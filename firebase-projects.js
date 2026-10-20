import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
    getAuth,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    GoogleAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
    getFirestore,
    collection,
    doc,
    onSnapshot,
    setDoc,
    deleteDoc,
    query,
    orderBy
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ============================================================================
// 1. ตั้งค่า FIREBASE CONFIG ตรงนี้ (เอามาจาก Firebase Console -> Project Settings)
// ============================================================================
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBcWYRPP26NW7iVPtd5A67EX_MWm3mnmoc",
    authDomain: "thee-portfolio.firebaseapp.com",
    projectId: "thee-portfolio",
    storageBucket: "thee-portfolio.firebasestorage.app",
    messagingSenderId: "1043067681423",
    appId: "1:1043067681423:web:036f1e0681ce0f578d4efa",
    measurementId: "G-QN5HJV0P93"
};

// ใส่อีเมลของคุณเพื่อจำกัดสิทธิ์ให้เฉพาะคุณที่แก้ไขเว็บได้
const ALLOWED_ADMIN_EMAILS = ["thee3938@gmail.com"];

// ============================================================================
// 2. โครงสร้างข้อมูลว่างเริ่มต้น (ดึงและบันทึกจาก Firebase Firestore 100% ไม่มีข้อมูล Fixed ทับซ้อน)
// ============================================================================
const DEFAULT_PROJECTS = [];

const DEFAULT_POSTS = [];

const DEFAULT_ABOUT = {
    id: "config_about_me",
    intro: "สวัสดีครับ ผมธีร์ (Thee Dumrongsirichai) ผู้พัฒนาและสร้างสรรค์ระบบเทคโนโลยี เว็บแอปพลิเคชัน และเครื่องมืออำนวยความสะดวก",
    education: "• Computer Science / Software Engineering\n• Information Technology & System Architecture",
    techStack: "• Frontend: HTML5, CSS3, JavaScript (ES6+), TypeScript, React, Vite\n• Backend & Cloud: Node.js, Firebase Auth, Firestore, REST APIs\n• Infrastructure & Tools: Linux/Ubuntu Server, Docker, Git",
    hobbies: "• Coding & Building Web Tools\n• Music Production & Audio Engineering\n• Linux System Administration & Homelab",
    images: [],
    order: -1
};

const DEFAULT_HOME = {
    id: "config_home_data",
    title: "Hello, I'm Thee",
    intro: "พื้นที่เก็บบันทึก ความคิด และความคืบหน้าของโปรเจกต์ต่าง ๆ ที่ผมกำลังพัฒนาอยู่",
    club: "LP UNDERGROUND // 2026",
    badge: "MEMBER / DEV",
    nameEn: "THEE DUMRONGSIRICHAI",
    nameTh: "ธีร์ ดำรงศิริชัย",
    regNo: "TU-8505-CS",
    spec: "FULL-STACK / SYSTEM",
    status: "ACTIVE",
    affil: "THEESIRICHAI",
    mrz: "P<THATHEE<<DUMRONGSIRICHAI<<<<<<<<<<<<<<<<<<<",
    photo: "",
    sidebarName: "THEE D.",
    sidebarBio: "Developer & Creator | TU-8505-CS",
    fbUrl: "",
    ghUrl: "https://github.com/theesirichai",
    igUrl: "",
    ytUrl: "",
    order: -2
};

const DEFAULT_AVATAR_SVG =
    "data:image/svg+xml;utf8," +
    encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" fill="none"><rect width="200" height="200" fill="#1e1f23"/><circle cx="100" cy="78" r="34" fill="#383a3e"/><path d="M40 176c0-33.137 26.863-60 60-60s60 26.863 60 60" fill="#383a3e"/></svg>`
    );

// ============================================================================
// 3. ตรวจสอบสถานะการตั้งค่า Firebase
// ============================================================================
const isFirebaseConfigured =
    FIREBASE_CONFIG.apiKey &&
    FIREBASE_CONFIG.apiKey !== "YOUR_API_KEY" &&
    !FIREBASE_CONFIG.apiKey.includes("YOUR_");

let auth = null;
let db = null;
let currentUser = null;
let projectsData = [];
let postsData = [];
let aboutData = structuredClone(DEFAULT_ABOUT);
let homeData = structuredClone(DEFAULT_HOME);
let saveTimeout = null;

// เก็บรูปภาพชั่วคราวขณะเปิด Modal เขียนบทความ / โปรเจกต์ / About Me / Home Card
let tempPostImages = [];
let tempProjImage = "";
let tempAboutImages = [];
let tempCardPhoto = "";

// Search & Filter State
let projectSearchQuery = "";
let projectStatusFilter = "all";
let projectTagFilter = "all";
let postsSearchQuery = "";

function isAuthorized(user) {
    if (!user) return false;
    if (ALLOWED_ADMIN_EMAILS.length === 0) return true;
    return ALLOWED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes((user.email || "").toLowerCase());
}

// ============================================================================
// 4. ระบบย่อและบีบอัดรูปภาพอัตโนมัติ (ไม่ต้องเสียเงินเปิด Firebase Storage!)
// ============================================================================
function compressImageFile(file, maxWidth = 1280, quality = 0.82) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
            const img = new Image();
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                if (width > maxWidth) {
                    height = Math.round((height * maxWidth) / width);
                    width = maxWidth;
                }
                const canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                // แปลงเป็น WebP หรือ JPEG ขนาดเล็ก (~40-80KB) เก็บใน Firestore ได้ทันที
                let dataUrl = canvas.toDataURL("image/webp", quality);
                if (!dataUrl.startsWith("data:image/webp")) {
                    dataUrl = canvas.toDataURL("image/jpeg", quality);
                }
                resolve(dataUrl);
            };
            img.onerror = reject;
            img.src = ev.target.result;
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// ============================================================================
// 5. การแสดงผลหน้าบทความ (Posts List, Recent Posts, Single Post View)
// ============================================================================
function isConfigDocId(id) {
    return id === "config_about_me" || id === "config_home_data" || id === "__about_me__" || id === "__home_data__";
}

function getSortedPosts() {
    return [...postsData]
        .filter((p) => !isConfigDocId(p.id))
        .sort((a, b) => (b.order ?? 0) - (a.order ?? 0));
}

function renderPostsList() {
    const postsContainer = document.getElementById("posts-container");
    const recentPostsEl = document.getElementById("recent-posts-list");
    const canEdit = isAuthorized(currentUser);
    const sorted = getSortedPosts();

    // สำหรับหน้าแรก (index.html) แสดง 3 บทความล่าสุด
    if (recentPostsEl) {
        const top3 = sorted.slice(0, 3);
        recentPostsEl.innerHTML = top3
            .map(
                (p) => `
            <li class="post-item">
                <a href="post.html?id=${encodeURIComponent(p.id)}" class="post-link">${escapeHtml(p.title)}</a>
                <span class="post-date">${escapeHtml(p.shortDate || "")}</span>
            </li>
        `
            )
            .join("");
    }

    // สำหรับหน้ารวมบทความ (posts.html)
    if (postsContainer) {
        if (sorted.length === 0) {
            postsContainer.innerHTML = `<p style="color: #61656c;">ยังไม่มีบทความในระบบ</p>`;
            return;
        }

        // จัดกลุ่มตามปี (Year)
        const grouped = {};
        for (const p of sorted) {
            const y = p.year || "2026";
            if (!grouped[y]) grouped[y] = [];
            grouped[y].push(p);
        }

        const years = Object.keys(grouped).sort((a, b) => Number(b) - Number(a));
        postsContainer.innerHTML = years
            .map(
                (yr) => `
            <div style="margin-bottom: 35px;">
                <h2 class="year-title">${escapeHtml(yr)}</h2>
                <ul class="post-list">
                    ${grouped[yr]
                        .map(
                            (p) => `
                        <li class="post-item">
                            <a href="post.html?id=${encodeURIComponent(p.id)}" class="post-link">
                                ${escapeHtml(p.title)}
                                ${p.images && p.images.length > 0 ? `<i class="fa-regular fa-image" style="margin-left:6px; font-size:0.8rem; color:#61656c;" title="มีรูปภาพประกอบ"></i>` : ""}
                            </a>
                            <div class="post-right-meta">
                                <span class="post-date">${escapeHtml(p.shortDate || "")}</span>
                                ${
                                    canEdit
                                        ? `
                                    <button type="button" class="btn-minimal btn-icon-only btn-edit-post" data-id="${escapeHtml(p.id)}" title="แก้ไขบทความ">
                                        <i class="fa-solid fa-pen"></i>
                                    </button>
                                    <button type="button" class="btn-minimal btn-icon-only danger btn-delete-post" data-id="${escapeHtml(p.id)}" title="ลบบทความ">
                                        <i class="fa-solid fa-trash"></i>
                                    </button>
                                `
                                        : ""
                                }
                            </div>
                        </li>
                    `
                        )
                        .join("")}
                </ul>
            </div>
        `
            )
            .join("");

        if (canEdit) {
            document.querySelectorAll(".btn-edit-post").forEach((btn) => {
                btn.addEventListener("click", () => {
                    const id = btn.getAttribute("data-id");
                    const post = postsData.find((x) => x.id === id);
                    if (post) openPostModal(post);
                });
            });
            document.querySelectorAll(".btn-delete-post").forEach((btn) => {
                btn.addEventListener("click", async () => {
                    const id = btn.getAttribute("data-id");
                    const post = postsData.find((x) => x.id === id);
                    if (post && confirm(`ต้องการลบบทความ "${post.title}" ใช่หรือไม่?`)) {
                        await deletePost(id);
                    }
                });
            });
        }
    }
}

function renderSinglePostView() {
    const articleContainer = document.getElementById("single-post-article");
    if (!articleContainer) return;

    const params = new URLSearchParams(window.location.search);
    const postId = params.get("id");
    const post = postsData.find((p) => p.id === postId);

    if (!post) {
        articleContainer.innerHTML = `
            <h2 class="year-title post-title">ไม่พบบทความนี้</h2>
            <p><a href="posts.html" class="inline-cta">← กลับไปหน้ารวมบทความ</a></p>
        `;
        return;
    }

    document.title = `${post.title} | theesirichai`;
    const canEdit = isAuthorized(currentUser);

    let bodyHtml = "";
    if (typeof window.marked !== "undefined") {
        window.marked.setOptions({
            gfm: true,
            breaks: true
        });
        bodyHtml = window.marked.parse(post.content || "");
    } else {
        bodyHtml = String(post.content || "")
            .split(/\n\s*\n/)
            .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
            .join("");
    }

    const galleryHtml =
        post.images && post.images.length > 0
            ? `<div class="post-gallery">
                ${post.images.map((src) => `<img src="${src}" alt="Post image" class="post-image-item" loading="lazy">`).join("")}
               </div>`
            : "";

    const singleAdminBtns = document.getElementById("single-post-admin-actions");
    if (singleAdminBtns) {
        if (canEdit) {
            singleAdminBtns.innerHTML = `
                <button type="button" id="btn-edit-this-post" class="btn-minimal primary">
                    <i class="fa-solid fa-pen"></i> แก้ไขบทความ / แนบรูป
                </button>
                <button type="button" id="btn-delete-this-post" class="btn-minimal danger">
                    <i class="fa-solid fa-trash"></i> ลบ
                </button>
            `;
            document.getElementById("btn-edit-this-post")?.addEventListener("click", () => openPostModal(post));
            document.getElementById("btn-delete-this-post")?.addEventListener("click", async () => {
                if (confirm(`ต้องการลบบทความ "${post.title}" ใช่หรือไม่?`)) {
                    await deletePost(post.id);
                    window.location.href = "posts.html";
                }
            });
        } else {
            singleAdminBtns.innerHTML = "";
        }
    }

    articleContainer.innerHTML = `
        <h2 class="year-title post-title">${escapeHtml(post.title)}</h2>
        <p class="post-meta">Published on ${escapeHtml(post.fullDate || post.shortDate || "")}</p>
        ${galleryHtml}
        <div class="post-body">${bodyHtml}</div>
    `;

    // ทำ Syntax Highlighting สำหรับ Code Blocks
    if (typeof window.hljs !== "undefined") {
        articleContainer.querySelectorAll("pre code").forEach((block) => {
            window.hljs.highlightElement(block);
        });
    }

    // เพิ่มปุ่ม Copy Code บน <pre>
    articleContainer.querySelectorAll("pre").forEach((pre) => {
        if (pre.querySelector(".copy-code-btn")) return;
        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "copy-code-btn";
        copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
        copyBtn.addEventListener("click", async () => {
            const codeEl = pre.querySelector("code");
            const textToCopy = codeEl ? codeEl.innerText : pre.innerText;
            try {
                await navigator.clipboard.writeText(textToCopy);
                copyBtn.innerHTML = `<i class="fa-solid fa-check"></i> Copied!`;
                copyBtn.classList.add("copied");
                setTimeout(() => {
                    copyBtn.innerHTML = `<i class="fa-regular fa-copy"></i> Copy`;
                    copyBtn.classList.remove("copied");
                }, 2000);
            } catch (err) {
                console.error("Clipboard copy error:", err);
            }
        });
        pre.appendChild(copyBtn);
    });
}

// ============================================================================
// 6. การแสดงผลหน้าโปรเจกต์ (Projects & Progress %)
// ============================================================================
function renderProjects() {
    const projectListEl = document.getElementById("project-list");
    if (!projectListEl) return;

    if (projectsData.length === 0) {
        projectListEl.innerHTML = `<p style="color: #61656c;">ยังไม่มีโปรเจกต์ในระบบ</p>`;
        const countBadge = document.getElementById("project-count-badge");
        if (countBadge) countBadge.textContent = "0 projects";
        return;
    }

    // 1. Dynamic Tags Setup
    const tagFilterWrap = document.getElementById("tag-filter-wrap");
    const tagPillsEl = document.getElementById("tag-filter-pills");
    const uniqueTags = new Set();
    projectsData.forEach((p) => {
        if (p.tag) {
            p.tag.split(/[,/|]/).map((t) => t.trim()).filter(Boolean).forEach((t) => uniqueTags.add(t));
        }
    });

    if (tagFilterWrap && tagPillsEl) {
        if (uniqueTags.size > 0) {
            tagFilterWrap.style.display = "flex";
            const tagsArr = Array.from(uniqueTags).sort();
            tagPillsEl.innerHTML = `
                <button type="button" class="filter-pill ${projectTagFilter === "all" ? "active" : ""}" data-tag="all">All</button>
                ${tagsArr.map((t) => `<button type="button" class="filter-pill ${projectTagFilter.toLowerCase() === t.toLowerCase() ? "active" : ""}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`).join("")}
            `;
            tagPillsEl.querySelectorAll(".filter-pill").forEach((btn) => {
                btn.addEventListener("click", () => {
                    projectTagFilter = btn.getAttribute("data-tag") || "all";
                    renderProjects();
                });
            });
        } else {
            tagFilterWrap.style.display = "none";
        }
    }

    // 2. Filter & Search Logic
    const q = projectSearchQuery.toLowerCase().trim();
    const sorted = [...projectsData].sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    const filtered = sorted.filter((proj) => {
        const pct = Math.max(0, Math.min(100, Number(proj.progress) || 0));
        if (projectStatusFilter === "completed" && pct !== 100) return false;
        if (projectStatusFilter === "in-progress" && (pct === 100 || pct === 0)) return false;

        if (projectTagFilter !== "all") {
            const tags = (proj.tag || "").toLowerCase().split(/[,/|]/).map((t) => t.trim());
            if (!tags.includes(projectTagFilter.toLowerCase())) return false;
        }

        if (q) {
            const matchTitle = (proj.title || "").toLowerCase().includes(q);
            const matchDesc = (proj.description || "").toLowerCase().includes(q);
            const matchTag = (proj.tag || "").toLowerCase().includes(q);
            if (!matchTitle && !matchDesc && !matchTag) return false;
        }

        return true;
    });

    // 3. Count Badge
    const countBadge = document.getElementById("project-count-badge");
    if (countBadge) {
        countBadge.textContent = `Showing ${filtered.length} of ${projectsData.length} projects`;
    }

    // 4. Empty State
    if (filtered.length === 0) {
        projectListEl.innerHTML = `
            <div class="empty-filter-state">
                <p>ไม่พบโปรเจกต์ที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรอง</p>
                <button type="button" id="btn-reset-proj-filter" class="btn-minimal">
                    <i class="fa-solid fa-rotate-left"></i> ล้างตัวกรองทั้งหมด
                </button>
            </div>
        `;
        document.getElementById("btn-reset-proj-filter")?.addEventListener("click", () => {
            projectSearchQuery = "";
            projectStatusFilter = "all";
            projectTagFilter = "all";
            const sInput = document.getElementById("project-search-input");
            if (sInput) sInput.value = "";
            const clearBtn = document.getElementById("btn-clear-search");
            if (clearBtn) clearBtn.style.display = "none";
            document.querySelectorAll("#status-filter-pills .filter-pill").forEach((p) => {
                p.classList.toggle("active", p.getAttribute("data-filter") === "all");
            });
            renderProjects();
        });
        return;
    }

    const canEdit = isAuthorized(currentUser);

    // 5. Render Project Cards
    projectListEl.innerHTML = filtered
        .map((proj) => {
            const pct = Math.max(0, Math.min(100, Number(proj.progress) || 0));
            const isDone = pct === 100;
            const statusClass = isDone ? "completed" : pct > 0 ? "in-progress" : "planned";
            const statusText = isDone ? "Completed" : pct > 0 ? "In Progress" : "Planned";

            // Tag chips
            const tagsList = (proj.tag || "")
                .split(/[,/|]/)
                .map((t) => t.trim())
                .filter(Boolean);
            const tagChipsHtml = tagsList
                .map((t) => `<button type="button" class="project-tag-chip ${projectTagFilter.toLowerCase() === t.toLowerCase() ? "active" : ""}" data-tag="${escapeHtml(t)}">#${escapeHtml(t)}</button>`)
                .join("");

            // Links (Demo & GitHub)
            let demoUrl = "";
            let ghUrl = proj.github || "";

            if (proj.link) {
                if (proj.link.includes("github.com") && !ghUrl) {
                    ghUrl = proj.link;
                } else {
                    demoUrl = proj.link;
                }
            }

            let linksHtml = "";
            if (demoUrl || ghUrl) {
                linksHtml = `
                    <div class="project-links-row">
                        ${demoUrl ? `<a href="${escapeHtml(demoUrl)}" target="_blank" rel="noopener" class="project-action-btn demo-btn"><i class="fa-solid fa-arrow-up-right-from-square"></i> Live Demo</a>` : ""}
                        ${ghUrl ? `<a href="${escapeHtml(ghUrl)}" target="_blank" rel="noopener" class="project-action-btn github-btn"><i class="fa-brands fa-github"></i> Source Code</a>` : ""}
                    </div>
                `;
            }

            return `
            <div class="project-card" data-id="${escapeHtml(proj.id)}">
                <div class="project-top">
                    <div class="project-title-wrap">
                        <span class="project-title">${escapeHtml(proj.title)}</span>
                        ${tagChipsHtml ? `<div class="project-tags-wrap">${tagChipsHtml}</div>` : ""}
                    </div>
                    <span class="status-badge ${statusClass}">
                        <i class="fa-solid ${isDone ? "fa-circle-check" : pct > 0 ? "fa-spinner" : "fa-clock"}"></i>
                        ${statusText}
                    </span>
                </div>

                <p class="project-desc">${escapeHtml(proj.description)}</p>

                ${proj.image ? `<img src="${proj.image}" alt="${escapeHtml(proj.title)}" class="project-thumb" loading="lazy">` : ""}

                ${linksHtml}

                <div class="progress-container">
                    <div class="progress-track">
                        <div class="progress-fill ${isDone ? "done" : ""}" id="fill-${escapeHtml(proj.id)}" style="width: ${pct}%;"></div>
                    </div>
                    <span class="progress-percent" id="pct-label-${escapeHtml(proj.id)}">${pct}%</span>
                </div>

                ${
                    canEdit
                        ? `
                <div class="admin-controls">
                    <div class="slider-group">
                        <label for="slider-${escapeHtml(proj.id)}">อัปเดต %:</label>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value="${pct}"
                            class="progress-slider"
                            id="slider-${escapeHtml(proj.id)}"
                            data-id="${escapeHtml(proj.id)}"
                        >
                        <input
                            type="number"
                            min="0"
                            max="100"
                            value="${pct}"
                            class="progress-num-input"
                            id="num-${escapeHtml(proj.id)}"
                            data-id="${escapeHtml(proj.id)}"
                        >
                    </div>
                    <div class="admin-card-actions">
                        <button type="button" class="btn-minimal btn-edit-proj" data-id="${escapeHtml(proj.id)}">
                            <i class="fa-solid fa-pen"></i> แก้ไข
                        </button>
                        <button type="button" class="btn-minimal danger btn-delete-proj" data-id="${escapeHtml(proj.id)}">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                `
                        : ""
                }
            </div>
            `;
        })
        .join("");

    // Click on tag chip on project card filters by that tag
    projectListEl.querySelectorAll(".project-tag-chip").forEach((btn) => {
        btn.addEventListener("click", () => {
            const tag = btn.getAttribute("data-tag");
            if (projectTagFilter.toLowerCase() === tag.toLowerCase()) {
                projectTagFilter = "all";
            } else {
                projectTagFilter = tag;
            }
            renderProjects();
        });
    });

    if (canEdit) {
        attachAdminProjectListeners();
    }
}

function attachAdminProjectListeners() {
    document.querySelectorAll(".progress-slider").forEach((slider) => {
        slider.addEventListener("input", (e) => {
            const id = e.target.getAttribute("data-id");
            const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
            updateProgressPreview(id, val);
            if (saveTimeout) clearTimeout(saveTimeout);
            saveTimeout = setTimeout(() => saveProjectProgress(id, val), 250);
        });
    });

    document.querySelectorAll(".progress-num-input").forEach((numInput) => {
        numInput.addEventListener("change", (e) => {
            const id = e.target.getAttribute("data-id");
            const val = Math.max(0, Math.min(100, Number(e.target.value) || 0));
            e.target.value = val;
            updateProgressPreview(id, val);
            saveProjectProgress(id, val);
        });
    });

    document.querySelectorAll(".btn-edit-proj").forEach((btn) => {
        btn.addEventListener("click", () => {
            const id = btn.getAttribute("data-id");
            const proj = projectsData.find((p) => p.id === id);
            if (proj) openProjectModal(proj);
        });
    });

    document.querySelectorAll(".btn-delete-proj").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const id = btn.getAttribute("data-id");
            const proj = projectsData.find((p) => p.id === id);
            if (proj && confirm(`ต้องการลบโปรเจกต์ "${proj.title}" ใช่หรือไม่?`)) {
                await deleteProject(id);
            }
        });
    });
}

function updateProgressPreview(id, val) {
    const fillEl = document.getElementById(`fill-${id}`);
    const labelEl = document.getElementById(`pct-label-${id}`);
    const sliderEl = document.getElementById(`slider-${id}`);
    const numEl = document.getElementById(`num-${id}`);

    if (fillEl) {
        fillEl.style.width = `${val}%`;
        fillEl.classList.toggle("done", val === 100);
    }
    if (labelEl) labelEl.textContent = `${val}%`;
    if (sliderEl && Number(sliderEl.value) !== val) sliderEl.value = val;
    if (numEl && Number(numEl.value) !== val) numEl.value = val;
}

// ============================================================================
// 7. ฟังก์ชันบันทึกข้อมูล (Firestore & LocalStorage Fallback)
// ============================================================================
async function saveProjectProgress(id, newProgress) {
    const target = projectsData.find((p) => p.id === id);
    if (!target) return;
    target.progress = newProgress;

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_projects", id), target, { merge: true });
            flashStatus("บันทึก % แล้ว ✓");
        } catch (err) {
            console.error(err);
            flashStatus("บันทึกไม่สำเร็จ (เช็ค Firestore Rules)");
        }
    } else {
        saveLocalData();
        flashStatus("บันทึก % แล้ว ✓");
    }
}

async function upsertProject(projectObj) {
    const idx = projectsData.findIndex((p) => p.id === projectObj.id);
    if (idx >= 0) projectsData[idx] = projectObj;
    else projectsData.push(projectObj);
    renderProjects();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_projects", projectObj.id), projectObj, { merge: true });
            flashStatus("บันทึกโปรเจกต์ขึ้น Cloud แล้ว ✓");
        } catch (err) {
            console.error(err);
            alert("บันทึกโปรเจกต์ขึ้น Firebase ไม่สำเร็จ: " + err.message);
        }
    }
}

async function deleteProject(id) {
    projectsData = projectsData.filter((p) => p.id !== id);
    renderProjects();

    if (isFirebaseConfigured && db) {
        try {
            await deleteDoc(doc(db, "portweb_projects", id));
            flashStatus("ลบโปรเจกต์แล้ว ✓");
        } catch (err) {
            console.error(err);
            alert("ลบโปรเจกต์บน Firebase ไม่สำเร็จ: " + err.message);
        }
    }
}

async function upsertPost(postObj) {
    const idx = postsData.findIndex((p) => p.id === postObj.id);
    if (idx >= 0) postsData[idx] = postObj;
    else postsData.push(postObj);
    renderPostsList();
    renderSinglePostView();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_posts", postObj.id), postObj, { merge: true });
            flashStatus("บันทึกบทความขึ้น Cloud แล้ว ✓");
        } catch (err) {
            console.error(err);
            alert("บันทึกบทความขึ้น Firebase ไม่สำเร็จ: " + err.message);
        }
    }
}

async function deletePost(id) {
    postsData = postsData.filter((p) => p.id !== id);
    renderPostsList();

    if (isFirebaseConfigured && db) {
        try {
            await deleteDoc(doc(db, "portweb_posts", id));
            flashStatus("ลบบทความแล้ว ✓");
        } catch (err) {
            console.error(err);
            alert("ลบบทความบน Firebase ไม่สำเร็จ: " + err.message);
        }
    }
}

function renderBulletLines(text) {
    return String(text || "")
        .split("\n")
        .map((line) => line.trim().replace(/^[•\-]\s*/, ""))
        .filter(Boolean)
        .map((line) => {
            const colonIdx = line.indexOf(":");
            if (colonIdx > 0 && colonIdx < 40) {
                const head = escapeHtml(line.slice(0, colonIdx + 1));
                const rest = escapeHtml(line.slice(colonIdx + 1));
                return `<li>• <strong>${head}</strong>${rest}</li>`;
            }
            return `<li>• ${escapeHtml(line)}</li>`;
        })
        .join("");
}

function renderSkillsMatrix(text) {
    if (!text) return "";
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
    const hasColon = lines.some((l) => l.includes(":"));
    if (!hasColon) {
        return renderBulletLines(text);
    }

    const getCatIcon = (cat) => {
        const c = cat.toLowerCase();
        if (c.includes("front") || c.includes("ui") || c.includes("web")) return "fa-solid fa-code";
        if (c.includes("back") || c.includes("cloud") || c.includes("api") || c.includes("server")) return "fa-solid fa-server";
        if (c.includes("infra") || c.includes("devops") || c.includes("docker") || c.includes("linux")) return "fa-solid fa-terminal";
        if (c.includes("system") || c.includes("tool") || c.includes("arch")) return "fa-solid fa-gears";
        if (c.includes("data") || c.includes("db") || c.includes("sql")) return "fa-solid fa-database";
        if (c.includes("ai") || c.includes("ml")) return "fa-solid fa-brain";
        return "fa-solid fa-layer-group";
    };

    const getTechIcon = (tech) => {
        const t = tech.toLowerCase();
        if (t.includes("html")) return "fa-brands fa-html5";
        if (t.includes("css")) return "fa-brands fa-css3-alt";
        if (t.includes("javascript") || t.includes("js")) return "fa-brands fa-js";
        if (t.includes("react")) return "fa-brands fa-react";
        if (t.includes("node")) return "fa-brands fa-node-js";
        if (t.includes("docker")) return "fa-brands fa-docker";
        if (t.includes("linux") || t.includes("ubuntu")) return "fa-brands fa-linux";
        if (t.includes("git")) return "fa-brands fa-git-alt";
        if (t.includes("python")) return "fa-brands fa-python";
        return "fa-solid fa-circle-check";
    };

    return `
    <div class="skills-grid">
        ${lines
            .map((line) => {
                const idx = line.indexOf(":");
                if (idx === -1) {
                    return `
                    <div class="skill-category-card full-width">
                        <div class="skill-category-title"><i class="fa-solid fa-angle-right"></i> ${escapeHtml(line)}</div>
                    </div>`;
                }
                const cat = line.slice(0, idx).trim();
                const items = line
                    .slice(idx + 1)
                    .split(",")
                    .map((i) => i.trim())
                    .filter(Boolean);
                const catIcon = getCatIcon(cat);

                return `
                <div class="skill-category-card">
                    <div class="skill-category-title">
                        <i class="${catIcon}"></i>
                        <span>${escapeHtml(cat)}</span>
                    </div>
                    <div class="skill-badges-wrap">
                        ${items
                            .map((item) => {
                                const itemIcon = getTechIcon(item);
                                return `
                                <span class="skill-badge">
                                    <i class="${itemIcon}"></i>
                                    <span>${escapeHtml(item)}</span>
                                </span>`;
                            })
                            .join("")}
                    </div>
                </div>`;
            })
            .join("")}
    </div>`;
}

function renderAboutMe() {
    const introEl = document.getElementById("about-intro-display");
    const eduEl = document.getElementById("about-edu-display");
    const techEl = document.getElementById("about-tech-display");
    const hobbiesEl = document.getElementById("about-hobbies-display");
    const galleryEl = document.getElementById("about-gallery-display");

    if (!introEl) return;

    introEl.textContent = aboutData.intro || DEFAULT_ABOUT.intro;
    if (eduEl) eduEl.innerHTML = renderBulletLines(aboutData.education);
    if (techEl) techEl.innerHTML = renderSkillsMatrix(aboutData.techStack);
    if (hobbiesEl) hobbiesEl.innerHTML = renderBulletLines(aboutData.hobbies);

    if (galleryEl) {
        if (aboutData.images && aboutData.images.length > 0) {
            galleryEl.innerHTML = `<div class="post-gallery">
                ${aboutData.images.map((src) => `<img src="${src}" alt="About image" class="post-image-item" loading="lazy">`).join("")}
            </div>`;
        } else {
            galleryEl.innerHTML = "";
        }
    }
}

async function upsertAbout(newAbout) {
    aboutData = { ...DEFAULT_ABOUT, ...newAbout, id: "config_about_me", order: -1 };
    renderAboutMe();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_posts", "config_about_me"), aboutData, { merge: true });
            flashStatus("บันทึกหน้า About Me ขึ้น Cloud แล้ว ✓");
        } catch (err) {
            console.error(err);
            alert("บันทึกหน้า About Me ขึ้น Firebase ไม่สำเร็จ: " + err.message);
        }
    }
}

function renderSidebarProfile() {
    const sidebarEl = document.querySelector(".left-sidebar");
    if (!sidebarEl) return;

    const imgEl = sidebarEl.querySelector(".profile-img");
    const nameEl = sidebarEl.querySelector(".profile-name");
    const bioEl = sidebarEl.querySelector(".profile-bio");
    const socialEl = sidebarEl.querySelector(".social-links");

    if (imgEl) {
        imgEl.src = homeData.photo || DEFAULT_AVATAR_SVG;
    }
    if (nameEl) {
        nameEl.textContent = homeData.sidebarName ?? DEFAULT_HOME.sidebarName;
    }
    if (bioEl) {
        bioEl.textContent = homeData.sidebarBio ?? DEFAULT_HOME.sidebarBio;
    }

    if (socialEl) {
        const fb = homeData.fbUrl ?? DEFAULT_HOME.fbUrl;
        const gh = homeData.ghUrl ?? DEFAULT_HOME.ghUrl;
        const ig = homeData.igUrl ?? DEFAULT_HOME.igUrl;
        const yt = homeData.ytUrl ?? DEFAULT_HOME.ytUrl;

        const linksHtml = [
            fb ? `<a href="${escapeHtml(fb)}" target="_blank" rel="noopener" title="Facebook"><i class="fa-brands fa-facebook"></i></a>` : "",
            gh ? `<a href="${escapeHtml(gh)}" target="_blank" rel="noopener" title="GitHub"><i class="fa-brands fa-github"></i></a>` : "",
            ig ? `<a href="${escapeHtml(ig)}" target="_blank" rel="noopener" title="Instagram"><i class="fa-brands fa-instagram"></i></a>` : "",
            yt ? `<a href="${escapeHtml(yt)}" target="_blank" rel="noopener" title="YouTube"><i class="fa-brands fa-youtube"></i></a>` : ""
        ]
            .filter(Boolean)
            .join("");

        socialEl.innerHTML = linksHtml;
    }

    // ปุ่มแก้ไขโปรไฟล์ซ้าย & โซเชียล (แสดงเฉพาะตอนล็อกอิน Admin)
    let quickBtn = document.getElementById("btn-edit-sidebar-quick");
    if (isAuthorized(currentUser)) {
        if (!quickBtn) {
            quickBtn = document.createElement("button");
            quickBtn.type = "button";
            quickBtn.id = "btn-edit-sidebar-quick";
            quickBtn.className = "btn-minimal";
            quickBtn.style.marginTop = "16px";
            quickBtn.style.fontSize = "0.78rem";
            quickBtn.innerHTML = `<i class="fa-solid fa-pen"></i> แก้ไขโปรไฟล์ซ้าย / โซเชียล`;
            quickBtn.addEventListener("click", () => {
                if (document.getElementById("home-modal")) {
                    openHomeModal();
                } else {
                    openSidebarQuickModal();
                }
            });
            sidebarEl.appendChild(quickBtn);
        }
        quickBtn.style.display = "inline-flex";
    } else if (quickBtn) {
        quickBtn.style.display = "none";
    }
}

function renderHomeAndCard() {
    // อัปเดตแถบด้านซ้ายทุกหน้าเสมอ
    renderSidebarProfile();

    const titleEl = document.getElementById("home-title-display");
    const introEl = document.getElementById("home-intro-display");
    if (!titleEl || !introEl) return;

    titleEl.textContent = homeData.title || DEFAULT_HOME.title;
    introEl.textContent = homeData.intro || DEFAULT_HOME.intro;

    const setElText = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    };

    setElText("card-club-display", homeData.club || DEFAULT_HOME.club);
    setElText("card-badge-display", homeData.badge || DEFAULT_HOME.badge);
    setElText("card-name-en-display", homeData.nameEn || DEFAULT_HOME.nameEn);
    setElText("card-name-th-display", homeData.nameTh || DEFAULT_HOME.nameTh);
    setElText("card-reg-display", homeData.regNo || DEFAULT_HOME.regNo);
    setElText("card-spec-display", homeData.spec || DEFAULT_HOME.spec);
    setElText("card-status-display", homeData.status || DEFAULT_HOME.status);
    setElText("card-affil-display", homeData.affil || DEFAULT_HOME.affil);
    setElText("card-mrz-display", homeData.mrz || DEFAULT_HOME.mrz);

    const photoEl = document.getElementById("card-photo-display");
    if (photoEl) {
        photoEl.src = homeData.photo || DEFAULT_AVATAR_SVG;
    }
}

async function upsertHome(newHome) {
    homeData = { ...DEFAULT_HOME, ...homeData, ...newHome, id: "config_home_data", order: -2 };
    renderHomeAndCard();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_posts", "config_home_data"), homeData, { merge: true });
            flashStatus("บันทึกข้อมูลขึ้น Cloud เรียบร้อย ✓");
        } catch (err) {
            console.error(err);
            alert("บันทึกข้อมูลหน้า Home ขึ้น Firebase ไม่สำเร็จ: " + err.message);
        }
    }
}

// ฟังก์ชันวาดและดาวน์โหลดการ์ดโปรไฟล์ LPU Underground เป็นไฟล์ PNG คมชัดสูง (2x Retina)
async function downloadPassportCardPng() {
    const W = 1040;
    const H = 580;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    // 1. พื้นหลังการ์ดสีเข้มสไตล์ LPU Underground
    ctx.fillStyle = "#1e1f23";
    ctx.beginPath();
    ctx.roundRect(0, 0, W, H, 16);
    ctx.fill();

    // จุด Grid Pattern บางๆ
    ctx.fillStyle = "rgba(255, 255, 255, 0.04)";
    for (let x = 20; x < W; x += 28) {
        for (let y = 20; y < H; y += 28) {
            ctx.fillRect(x, y, 2, 2);
        }
    }

    // เส้นขอบการ์ด
    ctx.strokeStyle = "#383a3e";
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, W - 3, H - 3);

    // 2. ส่วนหัวการ์ด (Header)
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(56, 56, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#d1d4db";
    ctx.font = "bold 24px monospace";
    ctx.fillText(homeData.club || DEFAULT_HOME.club, 78, 64);

    // Badge มุมขวาบน
    const badgeText = homeData.badge || DEFAULT_HOME.badge;
    ctx.font = "bold 20px monospace";
    const bw = ctx.measureText(badgeText).width + 32;
    ctx.fillStyle = "rgba(34, 197, 94, 0.12)";
    ctx.fillRect(W - 48 - bw, 36, bw, 38);
    ctx.strokeStyle = "rgba(34, 197, 94, 0.45)";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(W - 48 - bw, 36, bw, 38);
    ctx.fillStyle = "#22c55e";
    ctx.fillText(badgeText, W - 32 - bw, 62);

    // เส้นคั่น Header
    ctx.strokeStyle = "#2e3035";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 96);
    ctx.lineTo(W - 48, 96);
    ctx.stroke();

    // 3. วาดรูปโปรไฟล์ในกรอบ
    const px = 48;
    const py = 132;
    const pw = 210;
    const ph = 268;
    ctx.fillStyle = "#141518";
    ctx.fillRect(px, py, pw, ph);

    try {
        const imgEl = document.getElementById("card-photo-display");
        if (imgEl && imgEl.complete && imgEl.naturalWidth > 0) {
            const scale = Math.max(pw / imgEl.naturalWidth, ph / imgEl.naturalHeight);
            const sw = pw / scale;
            const sh = ph / scale;
            const sx = (imgEl.naturalWidth - sw) / 2;
            const sy = (imgEl.naturalHeight - sh) / 2;
            ctx.drawImage(imgEl, sx, sy, sw, sh, px, py, pw, ph);
        }
    } catch (e) {
        console.warn("Canvas image draw:", e);
    }

    ctx.strokeStyle = "#45484f";
    ctx.lineWidth = 2;
    ctx.strokeRect(px, py, pw, ph);

    // มุมเขียว 4 มุมบนรูป
    ctx.strokeStyle = "#22c55e";
    ctx.lineWidth = 4;
    const cl = 14;
    // TL
    ctx.beginPath(); ctx.moveTo(px + 6, py + 6 + cl); ctx.lineTo(px + 6, py + 6); ctx.lineTo(px + 6 + cl, py + 6); ctx.stroke();
    // TR
    ctx.beginPath(); ctx.moveTo(px + pw - 6 - cl, py + 6); ctx.lineTo(px + pw - 6, py + 6); ctx.lineTo(px + pw - 6, py + 6 + cl); ctx.stroke();
    // BL
    ctx.beginPath(); ctx.moveTo(px + 6, py + ph - 6 - cl); ctx.lineTo(px + 6, py + ph - 6); ctx.lineTo(px + 6 + cl, py + ph - 6); ctx.stroke();
    // BR
    ctx.beginPath(); ctx.moveTo(px + pw - 6 - cl, py + ph - 6); ctx.lineTo(px + pw - 6, py + ph - 6); ctx.lineTo(px + pw - 6, py + ph - 6 - cl); ctx.stroke();

    // 4. ข้อมูลผู้ถือบัตร (Holder Info)
    const ix = 296;
    ctx.fillStyle = "#61656c";
    ctx.font = "20px monospace";
    ctx.fillText("PASSPORT HOLDER", ix, 152);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px 'Inter', sans-serif";
    ctx.fillText(homeData.nameEn || DEFAULT_HOME.nameEn, ix, 194);

    ctx.fillStyle = "#92969c";
    ctx.font = "26px 'Anuphan', sans-serif";
    ctx.fillText(homeData.nameTh || DEFAULT_HOME.nameTh, ix, 230);

    // กล่องข้อมูล 4 ช่อง
    const gx = ix;
    const gy = 254;
    const gw = W - ix - 48;
    const gh = 146;
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.fillRect(gx, gy, gw, gh);
    ctx.strokeStyle = "#2e3035";
    ctx.lineWidth = 2;
    ctx.strokeRect(gx, gy, gw, gh);

    const col2 = gx + gw / 2;
    // Row 1
    ctx.fillStyle = "#61656c";
    ctx.font = "18px monospace";
    ctx.fillText("REGISTRATION NO.", gx + 22, gy + 36);
    ctx.fillText("SPECIALIZATION", col2 + 12, gy + 36);

    ctx.fillStyle = "#d1d4db";
    ctx.font = "bold 23px monospace";
    ctx.fillText(homeData.regNo || DEFAULT_HOME.regNo, gx + 22, gy + 64);
    ctx.fillStyle = "#22c55e";
    ctx.fillText(homeData.spec || DEFAULT_HOME.spec, col2 + 12, gy + 64);

    // Row 2
    ctx.fillStyle = "#61656c";
    ctx.font = "18px monospace";
    ctx.fillText("STATUS", gx + 22, gy + 100);
    ctx.fillText("AFFILIATION", col2 + 12, gy + 100);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 23px monospace";
    ctx.fillText(homeData.status || DEFAULT_HOME.status, gx + 22, gy + 128);
    ctx.fillStyle = "#d1d4db";
    ctx.fillText(homeData.affil || DEFAULT_HOME.affil, col2 + 12, gy + 128);

    // 5. ส่วนท้ายการ์ด (Barcode + MRZ)
    ctx.strokeStyle = "#2e3035";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(48, 444);
    ctx.lineTo(W - 48, 444);
    ctx.stroke();

    // วาดแท่งบาร์โค้ด
    ctx.fillStyle = "#d1d4db";
    const pattern = [4, 4, 8, 4, 2, 6, 6, 4, 2, 4, 8, 6, 4, 2, 6, 4, 8, 4, 2, 6];
    let bx = 48;
    for (let i = 0; i < 42; i++) {
        const w = pattern[i % pattern.length];
        if (i % 2 === 0) {
            ctx.fillRect(bx, 468, w, 40);
        }
        bx += w + 3;
    }

    ctx.fillStyle = "#61656c";
    ctx.font = "19px monospace";
    ctx.fillText(homeData.mrz || DEFAULT_HOME.mrz, 48, 536);

    ctx.fillStyle = "#22c55e";
    ctx.font = "bold 20px monospace";
    const verText = "VERIFIED ID // 2026";
    const vw = ctx.measureText(verText).width;
    ctx.fillText(verText, W - 48 - vw, 534);

    // ดาวน์โหลดเป็นไฟล์ PNG
    const link = document.createElement("a");
    link.download = "thee-underground-passport.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
}

let rescuedLocalHome = null;

function clearAllLegacyLocalStorage() {
    // กู้เฉพาะกรณีที่เครื่องคอมเคยอัปโหลดรูปโปรไฟล์ (Base64 data:image) ค้างไว้ก่อนย้ายขึ้น Firebase
    try {
        const rawHome = localStorage.getItem("portweb_cloud_home_v2") || localStorage.getItem("portweb_home_local");
        if (rawHome) {
            const parsed = JSON.parse(rawHome);
            if (parsed && typeof parsed.photo === "string" && parsed.photo.startsWith("data:image")) {
                rescuedLocalHome = { ...DEFAULT_HOME, ...parsed, id: "config_home_data", order: -2 };
            }
        }
    } catch {
        // ignore
    }

    // ล้างแคชในเครื่องทั้งหมด 100% เพื่อไม่ให้ข้อมูลเก่าในเบราว์เซอร์มาทับข้อมูลจาก Firebase
    localStorage.removeItem("portweb_projects_local");
    localStorage.removeItem("portweb_posts_local");
    localStorage.removeItem("portweb_about_local");
    localStorage.removeItem("portweb_home_local");
    localStorage.removeItem("portweb_cloud_projects_v2");
    localStorage.removeItem("portweb_cloud_posts_v2");
    localStorage.removeItem("portweb_cloud_about_v2");
    localStorage.removeItem("portweb_cloud_home_v2");

    projectsData = [];
    postsData = [];
    aboutData = structuredClone(DEFAULT_ABOUT);
    homeData = rescuedLocalHome ? structuredClone(rescuedLocalHome) : structuredClone(DEFAULT_HOME);

    renderProjects();
    renderPostsList();
    renderSinglePostView();
    renderAboutMe();
    renderHomeAndCard();
}

function flashStatus(msg) {
    const adminStatusEl = document.getElementById("admin-status");
    if (!adminStatusEl) return;
    const prev = adminStatusEl.dataset.defaultText || "";
    adminStatusEl.textContent = msg;
    setTimeout(() => {
        if (currentUser) adminStatusEl.textContent = prev;
    }, 2200);
}

// ============================================================================
// 8. การจัดการสถานะล็อกอินและ Modal ทั้งหมด
// ============================================================================
function updateAuthUI(user) {
    currentUser = user;
    const canEdit = isAuthorized(user);

    const adminStatusEl = document.getElementById("admin-status");
    const loginBtn = document.getElementById("btn-open-login");
    const logoutBtn = document.getElementById("btn-logout");
    const addProjectBtn = document.getElementById("btn-add-project");
    const addPostBtn = document.getElementById("btn-add-post");
    const editAboutBtn = document.getElementById("btn-edit-about");
    const editHomeBtn = document.getElementById("btn-edit-home");

    if (canEdit) {
        const label = user.email || "Admin";
        if (adminStatusEl) {
            adminStatusEl.textContent = label;
            adminStatusEl.dataset.defaultText = label;
        }
        if (loginBtn) loginBtn.style.display = "none";
        if (logoutBtn) logoutBtn.style.display = "inline-flex";
        if (addProjectBtn) addProjectBtn.style.display = "inline-flex";
        if (addPostBtn) addPostBtn.style.display = "inline-flex";
        if (editAboutBtn) editAboutBtn.style.display = "inline-flex";
        if (editHomeBtn) editHomeBtn.style.display = "inline-flex";
    } else {
        if (adminStatusEl) {
            adminStatusEl.textContent = "";
            adminStatusEl.dataset.defaultText = "";
        }
        if (loginBtn) loginBtn.style.display = "inline-flex";
        if (logoutBtn) logoutBtn.style.display = "none";
        if (addProjectBtn) addProjectBtn.style.display = "none";
        if (addPostBtn) addPostBtn.style.display = "none";
        if (editAboutBtn) editAboutBtn.style.display = "none";
        if (editHomeBtn) editHomeBtn.style.display = "none";
    }

    renderProjects();
    renderPostsList();
    renderSinglePostView();
    renderAboutMe();
    renderHomeAndCard();
}

function openHomeModal() {
    const homeModal = document.getElementById("home-modal");
    if (!homeModal) return;

    document.getElementById("home-title-input").value = homeData.title || DEFAULT_HOME.title;
    document.getElementById("home-intro-input").value = homeData.intro || DEFAULT_HOME.intro;
    document.getElementById("card-name-en-input").value = homeData.nameEn || DEFAULT_HOME.nameEn;
    document.getElementById("card-name-th-input").value = homeData.nameTh || DEFAULT_HOME.nameTh;
    document.getElementById("card-club-input").value = homeData.club || DEFAULT_HOME.club;
    document.getElementById("card-badge-input").value = homeData.badge || DEFAULT_HOME.badge;
    document.getElementById("card-reg-input").value = homeData.regNo || DEFAULT_HOME.regNo;
    document.getElementById("card-spec-input").value = homeData.spec || DEFAULT_HOME.spec;
    document.getElementById("card-status-input").value = homeData.status || DEFAULT_HOME.status;
    document.getElementById("card-affil-input").value = homeData.affil || DEFAULT_HOME.affil;
    document.getElementById("card-mrz-input").value = homeData.mrz || DEFAULT_HOME.mrz;

    const sName = document.getElementById("sidebar-name-input");
    const sBio = document.getElementById("sidebar-bio-input");
    const sFb = document.getElementById("sidebar-fb-input");
    const sGh = document.getElementById("sidebar-gh-input");
    const sIg = document.getElementById("sidebar-ig-input");
    const sYt = document.getElementById("sidebar-yt-input");

    if (sName) sName.value = homeData.sidebarName ?? DEFAULT_HOME.sidebarName;
    if (sBio) sBio.value = homeData.sidebarBio ?? DEFAULT_HOME.sidebarBio;
    if (sFb) sFb.value = homeData.fbUrl ?? DEFAULT_HOME.fbUrl;
    if (sGh) sGh.value = homeData.ghUrl ?? DEFAULT_HOME.ghUrl;
    if (sIg) sIg.value = homeData.igUrl ?? DEFAULT_HOME.igUrl;
    if (sYt) sYt.value = homeData.ytUrl ?? DEFAULT_HOME.ytUrl;

    tempCardPhoto = homeData.photo || "";
    renderCardPhotoPreview();
    homeModal.classList.add("open");
}

// สำหรับกดแก้ไขแถบโปรไฟล์ซ้ายจากหน้าอื่นๆ (เช่น Posts, About Me, Project)
function openSidebarQuickModal() {
    let modal = document.getElementById("sidebar-quick-modal");
    if (!modal) {
        modal = document.createElement("div");
        modal.id = "sidebar-quick-modal";
        modal.className = "modal-overlay";
        modal.innerHTML = `
            <div class="modal-box wide">
                <div class="modal-header">
                    <h3 class="modal-title">แก้ไขโปรไฟล์ด้านซ้าย &amp; โซเชียลมีเดีย</h3>
                    <button type="button" id="btn-close-sidebar-quick" class="modal-close">&times;</button>
                </div>
                <form id="sidebar-quick-form">
                    <div class="form-group">
                        <label>รูปโปรไฟล์ด้านซ้าย (อัปโหลดรูปใหม่ได้)</label>
                        <div class="image-upload-bar">
                            <label for="quick-sidebar-photo-file" class="btn-minimal" style="cursor: pointer; margin-bottom: 0;">
                                <i class="fa-regular fa-image"></i> เปลี่ยนรูปโปรไฟล์
                            </label>
                            <input type="file" id="quick-sidebar-photo-file" accept="image/*" style="display: none;">
                        </div>
                        <div id="quick-sidebar-photo-preview"></div>
                    </div>
                    <div class="form-group">
                        <label for="quick-sidebar-name">ชื่อโปรไฟล์ด้านซ้าย</label>
                        <input type="text" id="quick-sidebar-name" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="quick-sidebar-bio">คำอธิบายสั้นๆ ด้านซ้าย (Bio)</label>
                        <input type="text" id="quick-sidebar-bio" class="form-input">
                    </div>
                    <div class="form-group">
                        <label for="quick-sidebar-fb"><i class="fa-brands fa-facebook"></i> ลิงก์ Facebook (เว้นว่างเพื่อซ่อน)</label>
                        <input type="url" id="quick-sidebar-fb" class="form-input" placeholder="https://facebook.com/...">
                    </div>
                    <div class="form-group">
                        <label for="quick-sidebar-gh"><i class="fa-brands fa-github"></i> ลิงก์ GitHub (เว้นว่างเพื่อซ่อน)</label>
                        <input type="url" id="quick-sidebar-gh" class="form-input" placeholder="https://github.com/...">
                    </div>
                    <div class="form-group">
                        <label for="quick-sidebar-ig"><i class="fa-brands fa-instagram"></i> ลิงก์ Instagram (เว้นว่างเพื่อซ่อน)</label>
                        <input type="url" id="quick-sidebar-ig" class="form-input" placeholder="https://instagram.com/...">
                    </div>
                    <div class="form-group">
                        <label for="quick-sidebar-yt"><i class="fa-brands fa-youtube"></i> ลิงก์ YouTube (เว้นว่างเพื่อซ่อน)</label>
                        <input type="url" id="quick-sidebar-yt" class="form-input" placeholder="https://youtube.com/...">
                    </div>
                    <button type="submit" class="btn-minimal primary" style="width: 100%; justify-content: center; padding: 10px;">
                        บันทึกโปรไฟล์ด้านซ้าย &amp; โซเชียล
                    </button>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        document.getElementById("btn-close-sidebar-quick")?.addEventListener("click", () => {
            modal.classList.remove("open");
        });

        document.getElementById("quick-sidebar-photo-file")?.addEventListener("change", async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                tempCardPhoto = await compressImageFile(file, 600, 0.8);
                renderQuickSidebarPhotoPreview();
            } catch (err) {
                console.error(err);
            }
            e.target.value = "";
        });

        document.getElementById("sidebar-quick-form")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            await upsertHome({
                sidebarName: document.getElementById("quick-sidebar-name").value.trim(),
                sidebarBio: document.getElementById("quick-sidebar-bio").value.trim(),
                fbUrl: document.getElementById("quick-sidebar-fb").value.trim(),
                ghUrl: document.getElementById("quick-sidebar-gh").value.trim(),
                igUrl: document.getElementById("quick-sidebar-ig").value.trim(),
                ytUrl: document.getElementById("quick-sidebar-yt").value.trim(),
                photo: tempCardPhoto || ""
            });
            modal.classList.remove("open");
        });
    }

    document.getElementById("quick-sidebar-name").value = homeData.sidebarName ?? DEFAULT_HOME.sidebarName;
    document.getElementById("quick-sidebar-bio").value = homeData.sidebarBio ?? DEFAULT_HOME.sidebarBio;
    document.getElementById("quick-sidebar-fb").value = homeData.fbUrl ?? DEFAULT_HOME.fbUrl;
    document.getElementById("quick-sidebar-gh").value = homeData.ghUrl ?? DEFAULT_HOME.ghUrl;
    document.getElementById("quick-sidebar-ig").value = homeData.igUrl ?? DEFAULT_HOME.igUrl;
    document.getElementById("quick-sidebar-yt").value = homeData.ytUrl ?? DEFAULT_HOME.ytUrl;
    tempCardPhoto = homeData.photo || "";
    renderQuickSidebarPhotoPreview();
    modal.classList.add("open");
}

function renderQuickSidebarPhotoPreview() {
    const wrap = document.getElementById("quick-sidebar-photo-preview");
    if (!wrap) return;
    if (!tempCardPhoto) {
        wrap.innerHTML = "";
        return;
    }
    wrap.innerHTML = `
        <div class="image-preview-card" style="max-width: 110px; margin-top: 8px;">
            <img src="${tempCardPhoto}" alt="Profile preview">
            <button type="button" class="image-remove-btn" id="btn-remove-quick-photo" title="กลับไปใช้รูปเดิม">&times;</button>
        </div>
    `;
    document.getElementById("btn-remove-quick-photo")?.addEventListener("click", () => {
        tempCardPhoto = "";
        renderQuickSidebarPhotoPreview();
    });
}

function renderCardPhotoPreview() {
    const wrapEl = document.getElementById("card-photo-preview-wrap");
    if (!wrapEl) return;

    if (!tempCardPhoto) {
        wrapEl.innerHTML = "";
        return;
    }

    wrapEl.innerHTML = `
        <div class="image-preview-card" style="max-width: 130px; margin-top: 8px;">
            <img src="${tempCardPhoto}" alt="Card photo preview">
            <button type="button" class="image-remove-btn" id="btn-remove-card-photo" title="กลับไปใช้รูปโปรไฟล์หลัก">&times;</button>
        </div>
    `;
    document.getElementById("btn-remove-card-photo")?.addEventListener("click", () => {
        tempCardPhoto = "";
        renderCardPhotoPreview();
    });
}

function openAboutModal() {
    const aboutModal = document.getElementById("about-modal");
    if (!aboutModal) return;

    document.getElementById("about-intro-input").value = aboutData.intro || DEFAULT_ABOUT.intro;
    document.getElementById("about-edu-input").value = aboutData.education || DEFAULT_ABOUT.education;
    document.getElementById("about-tech-input").value = aboutData.techStack || DEFAULT_ABOUT.techStack;
    document.getElementById("about-hobbies-input").value = aboutData.hobbies || DEFAULT_ABOUT.hobbies;
    tempAboutImages = Array.isArray(aboutData.images) ? [...aboutData.images] : [];
    renderAboutImagePreviews();
    aboutModal.classList.add("open");
}

function renderAboutImagePreviews() {
    const listEl = document.getElementById("about-image-preview-list");
    if (!listEl) return;

    if (tempAboutImages.length === 0) {
        listEl.innerHTML = "";
        return;
    }

    listEl.innerHTML = tempAboutImages
        .map(
            (src, idx) => `
        <div class="image-preview-card">
            <img src="${src}" alt="About Preview ${idx + 1}">
            <button type="button" class="image-remove-btn" data-idx="${idx}" title="ลบรูปนี้">&times;</button>
        </div>
    `
        )
        .join("");

    listEl.querySelectorAll(".image-remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const idx = Number(btn.getAttribute("data-idx"));
            tempAboutImages.splice(idx, 1);
            renderAboutImagePreviews();
        });
    });
}

function openPostModal(post) {
    const postModal = document.getElementById("post-modal");
    const postModalTitle = document.getElementById("post-modal-title");
    const postForm = document.getElementById("post-form");
    if (!postModal || !postForm) return;

    const now = new Date();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "June", "July", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const defaultShort = `${monthNames[now.getMonth()]} ${now.getDate()}`;

    if (post) {
        postModalTitle.textContent = "แก้ไขบทความ";
        document.getElementById("post-id").value = post.id;
        document.getElementById("post-title-input").value = post.title || "";
        document.getElementById("post-date-input").value = post.shortDate || defaultShort;
        document.getElementById("post-year-input").value = post.year || String(now.getFullYear());
        document.getElementById("post-content-input").value = post.content || "";
        tempPostImages = Array.isArray(post.images) ? [...post.images] : [];
    } else {
        postModalTitle.textContent = "เขียนบทความใหม่";
        postForm.reset();
        document.getElementById("post-id").value = "";
        document.getElementById("post-date-input").value = defaultShort;
        document.getElementById("post-year-input").value = String(now.getFullYear());
        tempPostImages = [];
    }

    renderPostImagePreviews();
    postModal.classList.add("open");
}

function renderPostImagePreviews() {
    const listEl = document.getElementById("post-image-preview-list");
    if (!listEl) return;

    if (tempPostImages.length === 0) {
        listEl.innerHTML = "";
        return;
    }

    listEl.innerHTML = tempPostImages
        .map(
            (src, idx) => `
        <div class="image-preview-card">
            <img src="${src}" alt="Preview ${idx + 1}">
            <button type="button" class="image-remove-btn" data-idx="${idx}" title="ลบรูปนี้">&times;</button>
        </div>
    `
        )
        .join("");

    listEl.querySelectorAll(".image-remove-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            const idx = Number(btn.getAttribute("data-idx"));
            tempPostImages.splice(idx, 1);
            renderPostImagePreviews();
        });
    });
}

function openProjectModal(proj) {
    const projectModal = document.getElementById("project-modal");
    const projectModalTitle = document.getElementById("project-modal-title");
    const projectForm = document.getElementById("project-form");
    if (!projectModal || !projectForm) return;

    if (proj) {
        projectModalTitle.textContent = "แก้ไขโปรเจกต์";
        document.getElementById("proj-id").value = proj.id;
        document.getElementById("proj-title").value = proj.title || "";
        document.getElementById("proj-tag").value = proj.tag || "";
        document.getElementById("proj-desc").value = proj.description || "";
        document.getElementById("proj-link").value = proj.link || "";
        const ghInput = document.getElementById("proj-github");
        if (ghInput) ghInput.value = proj.github || "";
        document.getElementById("proj-progress").value = proj.progress ?? 0;
        tempProjImage = proj.image || "";
    } else {
        projectModalTitle.textContent = "เพิ่มโปรเจกต์ใหม่";
        projectForm.reset();
        document.getElementById("proj-id").value = "";
        const ghInput = document.getElementById("proj-github");
        if (ghInput) ghInput.value = "";
        document.getElementById("proj-progress").value = 0;
        tempProjImage = "";
    }

    renderProjectImagePreview();
    projectModal.classList.add("open");
}

function renderProjectImagePreview() {
    const wrapEl = document.getElementById("proj-image-preview-wrap");
    if (!wrapEl) return;

    if (!tempProjImage) {
        wrapEl.innerHTML = "";
        return;
    }

    wrapEl.innerHTML = `
        <div class="image-preview-card" style="max-width: 180px; margin-top: 8px;">
            <img src="${tempProjImage}" alt="Project preview">
            <button type="button" class="image-remove-btn" id="btn-remove-proj-img" title="ลบรูป">&times;</button>
        </div>
    `;
    document.getElementById("btn-remove-proj-img")?.addEventListener("click", () => {
        tempProjImage = "";
        renderProjectImagePreview();
    });
}

function setupModalEvents() {
    const loginModal = document.getElementById("login-modal");
    const loginBtn = document.getElementById("btn-open-login");
    const closeLoginBtn = document.getElementById("btn-close-login");
    const loginForm = document.getElementById("login-form");
    const googleLoginBtn = document.getElementById("btn-google-login");
    const loginErrorEl = document.getElementById("login-error");
    const logoutBtn = document.getElementById("btn-logout");

    loginBtn?.addEventListener("click", () => {
        if (loginErrorEl) loginErrorEl.style.display = "none";
        loginModal?.classList.add("open");
    });

    closeLoginBtn?.addEventListener("click", () => {
        loginModal?.classList.remove("open");
    });

    loginForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (loginErrorEl) loginErrorEl.style.display = "none";
        const email = document.getElementById("login-email").value.trim();
        const password = document.getElementById("login-password").value;

        if (isFirebaseConfigured && auth) {
            try {
                await signInWithEmailAndPassword(auth, email, password);
                loginModal?.classList.remove("open");
                loginForm.reset();
            } catch (err) {
                if (loginErrorEl) {
                    loginErrorEl.textContent = "อีเมลหรือรหัสผ่านไม่ถูกต้อง (" + err.code + ")";
                    loginErrorEl.style.display = "block";
                }
            }
        } else {
            localStorage.setItem("portweb_demo_admin", email || "admin@local");
            updateAuthUI({ email: email || "admin@local" });
            loginModal?.classList.remove("open");
            loginForm.reset();
        }
    });

    googleLoginBtn?.addEventListener("click", async () => {
        if (loginErrorEl) loginErrorEl.style.display = "none";
        if (isFirebaseConfigured && auth) {
            try {
                const provider = new GoogleAuthProvider();
                const result = await signInWithPopup(auth, provider);
                if (!isAuthorized(result.user)) {
                    await signOut(auth);
                    if (loginErrorEl) {
                        loginErrorEl.textContent = "บัญชีนี้ไม่มีสิทธิ์แก้ไขข้อมูล";
                        loginErrorEl.style.display = "block";
                    }
                    return;
                }
                loginModal?.classList.remove("open");
            } catch (err) {
                if (loginErrorEl) {
                    loginErrorEl.textContent = "ไม่สามารถล็อกอินด้วย Google ได้ (" + err.code + ")";
                    loginErrorEl.style.display = "block";
                }
            }
        } else {
            localStorage.setItem("portweb_demo_admin", "google-demo@local");
            updateAuthUI({ email: "google-demo@local" });
            loginModal?.classList.remove("open");
        }
    });

    logoutBtn?.addEventListener("click", async () => {
        if (isFirebaseConfigured && auth) {
            await signOut(auth);
        } else {
            localStorage.removeItem("portweb_demo_admin");
            updateAuthUI(null);
        }
    });

    // ---------------- ฟอร์มแก้ไขหน้า Home & การ์ดโปรไฟล์ + ปุ่มดาวน์โหลด PNG ----------------
    const editHomeBtn = document.getElementById("btn-edit-home");
    const homeModal = document.getElementById("home-modal");
    const closeHomeBtn = document.getElementById("btn-close-home");
    const homeForm = document.getElementById("home-form");
    const cardPhotoInput = document.getElementById("card-photo-file");
    const downloadCardBtn = document.getElementById("btn-download-card");

    editHomeBtn?.addEventListener("click", () => openHomeModal());
    closeHomeBtn?.addEventListener("click", () => homeModal?.classList.remove("open"));
    downloadCardBtn?.addEventListener("click", () => downloadPassportCardPng());

    cardPhotoInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            tempCardPhoto = await compressImageFile(file, 600, 0.8);
            renderCardPhotoPreview();
        } catch (err) {
            console.error(err);
        }
        cardPhotoInput.value = "";
    });

    homeForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            id: "config_home_data",
            title: document.getElementById("home-title-input").value.trim(),
            intro: document.getElementById("home-intro-input").value.trim(),
            nameEn: document.getElementById("card-name-en-input").value.trim(),
            nameTh: document.getElementById("card-name-th-input").value.trim(),
            club: document.getElementById("card-club-input").value.trim(),
            badge: document.getElementById("card-badge-input").value.trim(),
            regNo: document.getElementById("card-reg-input").value.trim(),
            spec: document.getElementById("card-spec-input").value.trim(),
            status: document.getElementById("card-status-input").value.trim(),
            affil: document.getElementById("card-affil-input").value.trim(),
            mrz: document.getElementById("card-mrz-input").value.trim(),
            sidebarName: document.getElementById("sidebar-name-input")?.value.trim() ?? homeData.sidebarName,
            sidebarBio: document.getElementById("sidebar-bio-input")?.value.trim() ?? homeData.sidebarBio,
            fbUrl: document.getElementById("sidebar-fb-input")?.value.trim() ?? homeData.fbUrl,
            ghUrl: document.getElementById("sidebar-gh-input")?.value.trim() ?? homeData.ghUrl,
            igUrl: document.getElementById("sidebar-ig-input")?.value.trim() ?? homeData.igUrl,
            ytUrl: document.getElementById("sidebar-yt-input")?.value.trim() ?? homeData.ytUrl,
            photo: tempCardPhoto || "",
            order: -2
        };
        await upsertHome(payload);
        homeModal?.classList.remove("open");
    });

    // ---------------- ฟอร์มแก้ไขหน้า About Me ----------------
    const editAboutBtn = document.getElementById("btn-edit-about");
    const aboutModal = document.getElementById("about-modal");
    const closeAboutBtn = document.getElementById("btn-close-about");
    const aboutForm = document.getElementById("about-form");
    const aboutFileInput = document.getElementById("about-image-file");

    editAboutBtn?.addEventListener("click", () => openAboutModal());
    closeAboutBtn?.addEventListener("click", () => aboutModal?.classList.remove("open"));

    aboutFileInput?.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            try {
                const compressedDataUrl = await compressImageFile(file);
                tempAboutImages.push(compressedDataUrl);
            } catch (err) {
                console.error(err);
            }
        }
        aboutFileInput.value = "";
        renderAboutImagePreviews();
    });

    aboutForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const payload = {
            id: "config_about_me",
            intro: document.getElementById("about-intro-input").value.trim(),
            education: document.getElementById("about-edu-input").value.trim(),
            techStack: document.getElementById("about-tech-input").value.trim(),
            hobbies: document.getElementById("about-hobbies-input").value.trim(),
            images: [...tempAboutImages],
            order: -1
        };
        await upsertAbout(payload);
        aboutModal?.classList.remove("open");
    });

    // ---------------- ฟอร์มบทความ (Posts + แนบรูปภาพ) ----------------
    const addPostBtn = document.getElementById("btn-add-post");
    const postModal = document.getElementById("post-modal");
    const closePostBtn = document.getElementById("btn-close-post");
    const postForm = document.getElementById("post-form");
    const postFileInput = document.getElementById("post-image-file");

    addPostBtn?.addEventListener("click", () => openPostModal(null));
    closePostBtn?.addEventListener("click", () => postModal?.classList.remove("open"));

    postFileInput?.addEventListener("change", async (e) => {
        const files = Array.from(e.target.files || []);
        for (const file of files) {
            try {
                const compressedDataUrl = await compressImageFile(file);
                tempPostImages.push(compressedDataUrl);
            } catch (err) {
                console.error("Image compress error:", err);
            }
        }
        postFileInput.value = "";
        renderPostImagePreviews();
    });

    postForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const idInput = document.getElementById("post-id").value;
        const title = document.getElementById("post-title-input").value.trim();
        const shortDate = document.getElementById("post-date-input").value.trim();
        const year = document.getElementById("post-year-input").value.trim() || "2026";
        const content = document.getElementById("post-content-input").value.trim();

        const existing = postsData.find((p) => p.id === idInput);
        const maxOrder = postsData.reduce((m, p) => Math.max(m, p.order || 0), 0);

        const payload = {
            id: idInput || "post-" + Date.now(),
            title,
            shortDate,
            fullDate: `${shortDate}, ${year}`,
            year,
            content,
            images: [...tempPostImages],
            order: existing ? existing.order : maxOrder + 1
        };

        await upsertPost(payload);
        postModal?.classList.remove("open");
    });

    // ---------------- ฟอร์มโปรเจกต์ (Projects + แนบรูปภาพ) ----------------
    const addProjectBtn = document.getElementById("btn-add-project");
    const projectModal = document.getElementById("project-modal");
    const closeProjectBtn = document.getElementById("btn-close-project");
    const projectForm = document.getElementById("project-form");
    const projFileInput = document.getElementById("proj-image-file");

    addProjectBtn?.addEventListener("click", () => openProjectModal(null));
    closeProjectBtn?.addEventListener("click", () => projectModal?.classList.remove("open"));

    projFileInput?.addEventListener("change", async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            tempProjImage = await compressImageFile(file);
            renderProjectImagePreview();
        } catch (err) {
            console.error(err);
        }
        projFileInput.value = "";
    });

    projectForm?.addEventListener("submit", async (e) => {
        e.preventDefault();
        const idInput = document.getElementById("proj-id").value;
        const title = document.getElementById("proj-title").value.trim();
        const tag = document.getElementById("proj-tag").value.trim();
        const description = document.getElementById("proj-desc").value.trim();
        const link = document.getElementById("proj-link").value.trim();
        const github = document.getElementById("proj-github")?.value.trim() || "";
        const progress = Math.max(0, Math.min(100, Number(document.getElementById("proj-progress").value) || 0));

        const existing = projectsData.find((p) => p.id === idInput);
        const payload = {
            id: idInput || "proj-" + Date.now(),
            title,
            tag,
            description,
            link,
            github,
            image: tempProjImage || "",
            progress,
            order: existing ? existing.order : projectsData.length + 1
        };

        await upsertProject(payload);
        projectModal?.classList.remove("open");
    });
}

// ============================================================================
// 9. เริ่มต้นระบบ (Initialize)
// ============================================================================
function init() {
    const configNoticeEl = document.getElementById("config-notice");

    // ล้างแคชในเครื่องทั้งหมดและแสดงผลเริ่มต้นจาก Firebase 100%
    clearAllLegacyLocalStorage();

    if (isFirebaseConfigured) {
        const app = initializeApp(FIREBASE_CONFIG);
        auth = getAuth(app);
        db = getFirestore(app);

        let latestPostDocs = null;

        const syncMissingConfigDocsIfAdmin = async () => {
            if (!isAuthorized(currentUser) || !latestPostDocs) return;
            const hasHome = latestPostDocs.some((d) => d.id === "config_home_data");
            try {
                if (!hasHome && rescuedLocalHome) {
                    await setDoc(doc(db, "portweb_posts", "config_home_data"), {
                        ...DEFAULT_HOME,
                        ...rescuedLocalHome,
                        id: "config_home_data",
                        order: -2
                    });
                    rescuedLocalHome = null;
                    flashStatus("ซิงค์หน้า Home & รูปโปรไฟล์ขึ้น Cloud แล้ว ✓");
                }
            } catch (e) {
                console.warn("Auto-sync config docs:", e);
            }
        };

        onAuthStateChanged(auth, async (user) => {
            updateAuthUI(user);
            await syncMissingConfigDocsIfAdmin();
        });

        // ซิงค์ข้อมูลโปรเจกต์แบบเรียลไทม์จาก Firebase 100%
        const qProj = query(collection(db, "portweb_projects"), orderBy("order", "asc"));
        onSnapshot(
            qProj,
            (snapshot) => {
                projectsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                renderProjects();
            },
            (err) => console.warn("Firestore projects sync waiting for DB/Rules:", err.message)
        );

        // ซิงค์ข้อมูลบทความ + About Me + Home Card แบบเรียลไทม์จาก Firebase 100%
        const qPosts = query(collection(db, "portweb_posts"), orderBy("order", "desc"));
        onSnapshot(
            qPosts,
            async (snapshot) => {
                const allDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                latestPostDocs = allDocs;

                const foundAbout = allDocs.find((d) => d.id === "config_about_me");
                aboutData = foundAbout
                    ? { ...DEFAULT_ABOUT, ...foundAbout, id: "config_about_me" }
                    : structuredClone(DEFAULT_ABOUT);

                const foundHome = allDocs.find((d) => d.id === "config_home_data");
                homeData = foundHome
                    ? { ...DEFAULT_HOME, ...foundHome, id: "config_home_data" }
                    : rescuedLocalHome
                      ? { ...DEFAULT_HOME, ...rescuedLocalHome, id: "config_home_data" }
                      : structuredClone(DEFAULT_HOME);

                postsData = allDocs.filter((d) => !isConfigDocId(d.id));

                renderPostsList();
                renderSinglePostView();
                renderAboutMe();
                renderHomeAndCard();
                await syncMissingConfigDocsIfAdmin();
            },
            (err) => console.warn("Firestore posts sync waiting for DB/Rules:", err.message)
        );
    } else {
        if (configNoticeEl) configNoticeEl.style.display = "block";
        const savedDemoUser = localStorage.getItem("portweb_demo_admin");
        if (savedDemoUser) {
            updateAuthUI({ email: savedDemoUser });
        }
    }

    setupModalEvents();
}

function escapeHtml(str) {
    return String(str || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

init();
