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
// 2. ข้อมูลเริ่มต้นของโปรเจกต์และบทความ (Seed Data)
// ============================================================================
const DEFAULT_PROJECTS = [
    {
        id: "proj-portweb",
        title: "Minimalist Portfolio Website",
        tag: "HTML / CSS / Firebase",
        description: "เว็บไซต์พอร์ตโฟลิโอและบล็อกส่วนตัวสไตล์มินิมอล โทนสีมืด เน้นความคลีน โหลดไว และเชื่อมระบบอัปเดตเปอร์เซ็นต์ความคืบหน้า + เขียนบทความบนเว็บแบบเรียลไทม์",
        link: "https://github.com/theesirichai",
        image: "",
        progress: 90,
        order: 1
    },
    {
        id: "proj-homelab",
        title: "HomeLab Server & CasaOS Setup",
        tag: "Linux / Docker / HomeLab",
        description: "จัดการเซิร์ฟเวอร์ขนาดเล็กในบ้านด้วย Ubuntu และ Docker ผ่าน CasaOS พร้อมตั้งค่าระบบรีโมตจัดการผ่าน SSH บน Termux",
        link: "",
        image: "",
        progress: 70,
        order: 2
    },
    {
        id: "proj-local-ai",
        title: "Local AI Playground (Ollama & Phi)",
        tag: "AI / Self-Hosted",
        description: "ทดลองรันโมเดลภาษาขนาดเล็ก (Small Language Models) บนเครื่องตัวเองด้วย Ollama เพื่อใช้งานผู้ช่วยส่วนตัวแบบออฟไลน์",
        link: "",
        image: "",
        progress: 45,
        order: 3
    }
];

const DEFAULT_POSTS = [
    {
        id: "post3",
        title: "เล่าความรู้สึกหลังเปลี่ยนมาทำ vlog แทน การแคสเกม",
        shortDate: "June 2",
        fullDate: "June 2, 2026",
        year: "2026",
        content: `Hello World! เดี๋ยววันนี้จะมาเล่าการเปลี่ยนแปลงของช่องผมนะครับ 555\n\nสวัสดีครับทุกคน ถ้าพูดถึงช่องนี้ หลายคนคงคุ้นเคยกับเสียงกดคีย์บอร์ด เสียงจอยเกม หรือบรรยากาศการสตรีมเกมลุยด่านลุ้นๆ ที่เราเคยสนุกไปด้วยกันมาตลอด\n\nการนั่งอยู่หน้าจอคอมพิวเตอร์และแชร์ความสนุกในเกมหลักๆ คือความสุขของผมในเวลานั้นเลยครับ แต่พอเวลาผ่านไป ผมเริ่มรู้สึกว่า "โลกข้างนอกหน้าจอมันก็น่าสนุกไม่แพ้กัน" มีหลายสิ่งหลายอย่างในชีวิตประจำวัน ไม่ว่าจะเป็นเรื่องราวที่ไปเจอมา กิจกรรมใหม่ๆ ที่ได้ลองทำ หรือแม้แต่มุมมองเล็กๆ ในวันธรรมดาที่ผมอยากจะบันทึกเก็บไว้ และอยากแบ่งปันให้ทุกคนได้เห็นมากขึ้น\n\nจากเดิมที่เคยแชร์แค่ 'หน้าจอ' ตอนนี้ผมเลยอยากชวนทุกคนมาดู 'หน้าจริง' และเรื่องราวชีวิตของผมผ่านเลนส์กล้องบ้างครับ\n\nการเปลี่ยนมาทำ Vlog ครั้งนี้ อาจจะไม่ได้เห็นผมกดสกิลรัวๆ เหมือนเมื่อก่อน แต่รับรองว่าจะได้เห็นมุมมองใหม่ๆ ความเรียล และเรื่องราวที่สนุกไปอีกแบบแน่นอนครับ ขอบคุณทุกคนที่ซัพพอร์ตกันมาตั้งแต่ยุคเล่นเกม และฝากติดตามก้าวใหม่ในสาย Vlog ของผมด้วยนะครับ! มาลุยไปด้วยกันเด้อบอกเลยว่ามันส์แน่นอนครับ! เจอกันในคลิปใหม่เร็วๆ นี้ครับผม!`,
        images: [],
        order: 4
    },
    {
        id: "post2",
        title: "My Experience at the Science Day",
        shortDate: "May 25",
        fullDate: "May 25, 2026",
        year: "2026",
        content: `Hello World! เดี๋ยววันนี้จะมาเล่าความดีใจและความเจ็บปวดนะครับ 555\n\nสวัสดีครับผม จริงๆ ก็จะมาเล่าประสบการณ์ไปแข่งวันวิทย์ครั้งแรกตอนขึ้น ม.4 มาครับ เรื่องมันต้องย้อนกลับไปประมาณไม่กี่เดือนก่อน ซึ่งเป็นรายการของพวกห้องพิเศษ พอดีปีนี้พี่ ม.6 ที่ไปแข่งไม่มีคู่ไปแข่งด้วย เพื่อนผมที่อยู่ห้องกิ๊ฟ ม.4 ก็เลยมาชวนผม ซึ่งตอนแรกก็ตอบตกลงไปแบบไม่ได้คิดอะไร\n\nแม้จะมีบางคนแซะว่าคนอย่างผมจริงจังกับอะไรบ้างหรือทำอะไรได้บ้าง แต่ผมก็ไม่ได้เก็บมาคิดมาก แค่กังวลว่าจะพาพี่เขาตกรอบไหม ผมมีเวลาเตรียมตัวประมาณ 1-2 เดือนเพื่ออ่านเนื้อหาไปแข่งตอบคำถามความรู้รอบตัวบวกคำนวณนิดหน่อย โชคดีมากที่พี่คู่แข่งของผมเก่งคำนวณ ส่วนผมถนัดความรู้รอบตัว\n\nพอถึงวันแข่งจริงบรรยากาศในห้องแอร์ก็กดดันนิดหน่อย แข่งไปเรื่อยๆ จนประกาศคะแนน ปรากฏว่าคะแนนเสมอกับอันดับ 2 ต้องไปแข่งรอบตัดสิน แล้วสุดท้ายก็ชนะและได้รับเกียรติบัตรครับ เป็นเรื่องเล่าสั้นๆ และเป็นประสบการณ์ชีวิตครั้งหนึ่ง เดี๋ยวมีแข่งอีกก็จะไปเตรียมตัวครับ เจอกันใหม่บทความหน้าครับ cu!`,
        images: [],
        order: 3
    },
    {
        id: "post1",
        title: "Experience DJI Osmo Action 4 Creator Combo",
        shortDate: "May 24",
        fullDate: "May 24, 2026",
        year: "2026",
        content: `Hello World! เดี๋ยววันนี้จะมาเล่าความดีใจและความเจ็บปวดนะครับ 555\n\nผมได้ซื้อกล้อง DJI Osmo Action 4 Creator Combo มาเมื่อเดือนที่แล้ว และได้ลองใช้งานมาสักพักแล้วครับ ต้องบอกเลยว่าประทับใจมากๆ กับคุณภาพของวิดีโอที่ได้จากกล้องตัวนี้ ทั้งความคมชัด สีสันสดใส และระบบกันสั่นที่ทำงานได้ดีมากๆ ทำให้การถ่ายวิดีโอสนุกขึ้นเยอะเลยครับ`,
        images: [],
        order: 2
    },
    {
        id: "hello-world",
        title: "My first portfolio website with GitHub Pages",
        shortDate: "May 24",
        fullDate: "May 24, 2026",
        year: "2026",
        content: `Hello World! ยินดีต้อนรับเข้าสู่เว็บไซต์พอร์ตโฟลิโอเวอร์ชันแรกของผมครับ เว็บนี้เขียนขึ้นเองตั้งแต่ศูนย์ด้วยภาษา HTML และ CSS โดยตั้งใจออกแบบให้มีความมินิมอล โทนสีมืด (Dark Mode) และตัดส่วนประกอบที่ไม่จำเป็นออกทั้งหมดเพื่อให้หน้าเว็บโหลดได้เร็วที่สุด\n\nในอนาคต พื้นที่ตรงนี้จะถูกใช้เป็นบล็อกส่วนตัวสำหรับลงบันทึกโปรเจกต์คอมพิวเตอร์ เรื่องราวเกี่ยวกับระบบ HomeLab หรือเทคโนโลยีใหม่ๆ ที่ผมได้ทดลองเล่น ขอบคุณทุกคนที่แวะเข้ามาเยี่ยมชมครับ!`,
        images: [],
        order: 1
    }
];

const DEFAULT_ABOUT = {
    id: "__about_me__",
    intro: "สวัสดีครับผมชื่อ ธีร์ ดำรงศิริชัย เป็นนักเรียนที่สนใจในด้านวิทยาการคอมพิวเตอร์ (Computer Science) ชอบศึกษาเกี่ยวกับการเขียนโค้ด การออกแบบเว็บไซต์ และเทคโนโลยีใหม่ๆ พื้นที่ตรงนี้สร้างขึ้นเพื่อรวบรวมสิ่งที่ผมสนใจ บันทึกการเรียนรู้ และโปรเจกต์ต่างๆ ที่ได้ลงมือทำครับ",
    education: "โรงเรียนแก่นนครวิทยาลัย (Kaennakhon Wittayalai School)\nมัธยมศึกษาตอนปลาย แผนการเรียนวิทยาศาสตร์-คณิตศาสตร์",
    techStack: "Web Development: HTML, CSS, JavaScript\nHomeLab & Systems: Linux (Ubuntu), Docker, CasaOS, SSH Management via Termux\nHardware Ecosystem: Xiaomi (HyperOS), Local AI Models (Phi-series, Ollama)\nNetworking: Basic TCP/IP, DNS, DHCP, Basic Setup Mesh Network\nOther Tools: Git, GitHub, DaVinci Resolve (Video Editing)",
    hobbies: "Free Time: Football, Tennis, Badminton, Gaming, Video Editing",
    images: [],
    order: -1
};

const DEFAULT_HOME = {
    id: "__home_data__",
    title: "Welcome to my space 👋",
    intro: "ยินดีต้อนรับเข้าสู่พื้นที่เก็บผลงานและบันทึกส่วนตัวของผมครับ\n\nผมสนใจและกำลังศึกษาเกี่ยวกับการพัฒนาเว็บไซต์ ดีไซน์สไตล์มินิมอล รวมถึงการจัดการระบบเซิร์ฟเวอร์ขนาดเล็ก (HomeLab) และเทคโนโลยีคอมพิวเตอร์ต่างๆ เว็บนี้เขียนขึ้นด้วย HTML และ CSS แบบคลีนๆ เพื่อเน้นความเบาและโหลดหน้าเว็บได้เร็วที่สุด",
    club: "THEE UNDERGROUND",
    badge: "PASSPORT PLUS",
    nameEn: "THEE DUMRONGSIRICHAI",
    nameTh: "ธีร์ ดำรงศิริชัย",
    regNo: "TU-8505-CS",
    spec: "DEV & SYSTEMS",
    status: "● ACTIVE",
    affil: "KKW SCHOOL",
    mrz: "P<THTHEE<<DUMRONGSIRICHAI<<<<<<<<<<<8505",
    photo: "",
    sidebarName: "Thee dumrongsirichai",
    sidebarBio: "Computer Science Student. Interested in Web Development.",
    fbUrl: "https://www.facebook.com/thee.dumrongsirichai.850503",
    ghUrl: "https://github.com/theesirichai",
    igUrl: "https://www.instagram.com/theesirichai/",
    ytUrl: "https://www.youtube.com/@theesirichai",
    order: -2
};

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

function isAuthorized(user) {
    if (!user) return false;
    if (ALLOWED_ADMIN_EMAILS.length === 0) return true;
    return ALLOWED_ADMIN_EMAILS.map((e) => e.toLowerCase()).includes((user.email || "").toLowerCase());
}

// ============================================================================
// 4. ระบบย่อและบีบอัดรูปภาพอัตโนมัติ (ไม่ต้องเสียเงินเปิด Firebase Storage!)
// ============================================================================
function compressImageFile(file, maxWidth = 1000, quality = 0.75) {
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
                const dataUrl = canvas.toDataURL("image/webp", quality);
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
function getSortedPosts() {
    return [...postsData]
        .filter((p) => p.id !== "__about_me__" && p.id !== "__home_data__")
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

    const paragraphs = String(post.content || "")
        .split(/\n\s*\n/)
        .map((para) => `<p>${escapeHtml(para.trim())}</p>`)
        .join("");

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
        ${paragraphs}
    `;
}

// ============================================================================
// 6. การแสดงผลหน้าโปรเจกต์ (Projects & Progress %)
// ============================================================================
function renderProjects() {
    const projectListEl = document.getElementById("project-list");
    if (!projectListEl) return;

    if (projectsData.length === 0) {
        projectListEl.innerHTML = `<p style="color: #61656c;">ยังไม่มีโปรเจกต์ในระบบ</p>`;
        return;
    }

    const canEdit = isAuthorized(currentUser);

    projectListEl.innerHTML = [...projectsData]
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99))
        .map((proj) => {
            const pct = Math.max(0, Math.min(100, Number(proj.progress) || 0));
            const isDone = pct === 100;
            const statusText = isDone ? "Completed" : pct > 0 ? "In Progress" : "Planned";
            const titleHtml = proj.link
                ? `<a href="${escapeHtml(proj.link)}" target="_blank" rel="noopener" class="project-title">${escapeHtml(proj.title)} ↗</a>`
                : `<span class="project-title">${escapeHtml(proj.title)}</span>`;

            return `
            <div class="project-card" data-id="${escapeHtml(proj.id)}">
                <div class="project-top">
                    <div class="project-title-wrap">
                        ${titleHtml}
                        ${proj.tag ? `<span class="project-tag">${escapeHtml(proj.tag)}</span>` : ""}
                    </div>
                    <span class="status-badge">${statusText}</span>
                </div>

                <p class="project-desc">${escapeHtml(proj.description)}</p>

                ${proj.image ? `<img src="${proj.image}" alt="${escapeHtml(proj.title)}" class="project-thumb" loading="lazy">` : ""}

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
    saveLocalData();
    renderProjects();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_projects", projectObj.id), projectObj, { merge: true });
            flashStatus("บันทึกโปรเจกต์ขึ้น Cloud แล้ว ✓");
        } catch (err) {
            console.error(err);
            flashStatus("บันทึกในเครื่องแล้ว (รอเปิด Firestore Rules)");
        }
    } else {
        flashStatus("บันทึกโปรเจกต์แล้ว ✓");
    }
}

async function deleteProject(id) {
    projectsData = projectsData.filter((p) => p.id !== id);
    saveLocalData();
    renderProjects();

    if (isFirebaseConfigured && db) {
        try {
            await deleteDoc(doc(db, "portweb_projects", id));
            flashStatus("ลบโปรเจกต์แล้ว ✓");
        } catch (err) {
            console.error(err);
            flashStatus("ลบในเครื่องแล้ว (รอเปิด Firestore Rules)");
        }
    } else {
        flashStatus("ลบโปรเจกต์แล้ว ✓");
    }
}

async function upsertPost(postObj) {
    const idx = postsData.findIndex((p) => p.id === postObj.id);
    if (idx >= 0) postsData[idx] = postObj;
    else postsData.push(postObj);
    saveLocalData();
    renderPostsList();
    renderSinglePostView();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_posts", postObj.id), postObj, { merge: true });
            flashStatus("บันทึกบทความขึ้น Cloud แล้ว ✓");
        } catch (err) {
            console.error(err);
            flashStatus("บันทึกในเครื่องแล้ว (รอเปิด Firestore Rules)");
        }
    } else {
        flashStatus("บันทึกบทความแล้ว ✓");
    }
}

async function deletePost(id) {
    postsData = postsData.filter((p) => p.id !== id);
    saveLocalData();
    renderPostsList();

    if (isFirebaseConfigured && db) {
        try {
            await deleteDoc(doc(db, "portweb_posts", id));
            flashStatus("ลบบทความแล้ว ✓");
        } catch (err) {
            console.error(err);
            flashStatus("ลบในเครื่องแล้ว (รอเปิด Firestore Rules)");
        }
    } else {
        flashStatus("ลบบทความแล้ว ✓");
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

function renderAboutMe() {
    const introEl = document.getElementById("about-intro-display");
    const eduEl = document.getElementById("about-edu-display");
    const techEl = document.getElementById("about-tech-display");
    const hobbiesEl = document.getElementById("about-hobbies-display");
    const galleryEl = document.getElementById("about-gallery-display");

    if (!introEl) return;

    introEl.textContent = aboutData.intro || DEFAULT_ABOUT.intro;
    if (eduEl) eduEl.innerHTML = renderBulletLines(aboutData.education);
    if (techEl) techEl.innerHTML = renderBulletLines(aboutData.techStack);
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
    aboutData = { ...DEFAULT_ABOUT, ...newAbout, id: "__about_me__", order: -1 };
    saveLocalData();
    renderAboutMe();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_posts", "__about_me__"), aboutData, { merge: true });
            flashStatus("บันทึกหน้า About Me แล้ว ✓");
        } catch (err) {
            console.error(err);
            flashStatus("บันทึกในเครื่องแล้ว (รอเปิด Firestore Rules)");
        }
    } else {
        flashStatus("บันทึกหน้า About Me แล้ว ✓");
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
        imgEl.src = homeData.photo || "picture/me.jpg";
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
        photoEl.src = homeData.photo || "picture/me.jpg";
    }
}

async function upsertHome(newHome) {
    homeData = { ...DEFAULT_HOME, ...homeData, ...newHome, id: "__home_data__", order: -2 };
    saveLocalData();
    renderHomeAndCard();

    if (isFirebaseConfigured && db) {
        try {
            await setDoc(doc(db, "portweb_posts", "__home_data__"), homeData, { merge: true });
            flashStatus("บันทึกข้อมูลเรียบร้อย ✓");
        } catch (err) {
            console.error(err);
            flashStatus("บันทึกในเครื่องแล้ว (รอเปิด Firestore Rules)");
        }
    } else {
        flashStatus("บันทึกข้อมูลเรียบร้อย ✓");
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

function loadLocalData() {
    try {
        const rawProj = localStorage.getItem("portweb_projects_local");
        projectsData = rawProj ? JSON.parse(rawProj) : structuredClone(DEFAULT_PROJECTS);
    } catch {
        projectsData = structuredClone(DEFAULT_PROJECTS);
    }

    try {
        const rawPosts = localStorage.getItem("portweb_posts_local");
        postsData = rawPosts ? JSON.parse(rawPosts) : structuredClone(DEFAULT_POSTS);
    } catch {
        postsData = structuredClone(DEFAULT_POSTS);
    }

    try {
        const rawAbout = localStorage.getItem("portweb_about_local");
        aboutData = rawAbout ? JSON.parse(rawAbout) : structuredClone(DEFAULT_ABOUT);
    } catch {
        aboutData = structuredClone(DEFAULT_ABOUT);
    }

    try {
        const rawHome = localStorage.getItem("portweb_home_local");
        homeData = rawHome ? JSON.parse(rawHome) : structuredClone(DEFAULT_HOME);
    } catch {
        homeData = structuredClone(DEFAULT_HOME);
    }

    saveLocalData();
    renderProjects();
    renderPostsList();
    renderSinglePostView();
    renderAboutMe();
    renderHomeAndCard();
}

function saveLocalData() {
    localStorage.setItem("portweb_projects_local", JSON.stringify(projectsData));
    localStorage.setItem("portweb_posts_local", JSON.stringify(postsData));
    localStorage.setItem("portweb_about_local", JSON.stringify(aboutData));
    localStorage.setItem("portweb_home_local", JSON.stringify(homeData));
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
                        <input type="text" id="quick-sidebar-name" class="form-input" required>
                    </div>
                    <div class="form-group">
                        <label for="quick-sidebar-bio">คำอธิบายสั้นๆ ด้านซ้าย (Bio)</label>
                        <input type="text" id="quick-sidebar-bio" class="form-input" required>
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
        document.getElementById("proj-progress").value = proj.progress ?? 0;
        tempProjImage = proj.image || "";
    } else {
        projectModalTitle.textContent = "เพิ่มโปรเจกต์ใหม่";
        projectForm.reset();
        document.getElementById("proj-id").value = "";
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
            id: "__home_data__",
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
            id: "__about_me__",
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
        const progress = Math.max(0, Math.min(100, Number(document.getElementById("proj-progress").value) || 0));

        const existing = projectsData.find((p) => p.id === idInput);
        const payload = {
            id: idInput || "proj-" + Date.now(),
            title,
            tag,
            description,
            link,
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

    // โหลดข้อมูลเริ่มต้นแสดงผลทันที ไม่ต้องรอโหลดหน้าขาว
    loadLocalData();

    if (isFirebaseConfigured) {
        const app = initializeApp(FIREBASE_CONFIG);
        auth = getAuth(app);
        db = getFirestore(app);

        let latestPostDocs = null;

        const syncMissingConfigDocsIfAdmin = async () => {
            if (!isAuthorized(currentUser) || !latestPostDocs) return;
            const hasAbout = latestPostDocs.some((d) => d.id === "__about_me__");
            const hasHome = latestPostDocs.some((d) => d.id === "__home_data__");
            try {
                if (!hasAbout) {
                    await setDoc(doc(db, "portweb_posts", "__about_me__"), {
                        ...DEFAULT_ABOUT,
                        ...aboutData,
                        id: "__about_me__",
                        order: -1
                    });
                }
                if (!hasHome) {
                    await setDoc(doc(db, "portweb_posts", "__home_data__"), {
                        ...DEFAULT_HOME,
                        ...homeData,
                        id: "__home_data__",
                        order: -2
                    });
                }
            } catch (e) {
                console.warn("Auto-sync config docs:", e);
            }
        };

        onAuthStateChanged(auth, async (user) => {
            updateAuthUI(user);
            await syncMissingConfigDocsIfAdmin();
        });

        // ซิงค์ข้อมูลโปรเจกต์แบบเรียลไทม์
        const qProj = query(collection(db, "portweb_projects"), orderBy("order", "asc"));
        onSnapshot(
            qProj,
            async (snapshot) => {
                if (snapshot.empty) {
                    if (isAuthorized(currentUser)) {
                        for (const item of projectsData) {
                            try {
                                await setDoc(doc(db, "portweb_projects", item.id), item);
                            } catch (e) {
                                console.warn(e);
                            }
                        }
                    }
                } else {
                    projectsData = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                    saveLocalData();
                    renderProjects();
                }
            },
            (err) => console.warn("Firestore projects sync waiting for DB/Rules:", err.message)
        );

        // ซิงค์ข้อมูลบทความ + About Me + Home Card แบบเรียลไทม์
        const qPosts = query(collection(db, "portweb_posts"), orderBy("order", "desc"));
        onSnapshot(
            qPosts,
            async (snapshot) => {
                if (snapshot.empty) {
                    latestPostDocs = [];
                    await syncMissingConfigDocsIfAdmin();
                } else {
                    const allDocs = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
                    latestPostDocs = allDocs;
                    const foundAbout = allDocs.find((d) => d.id === "__about_me__");
                    if (foundAbout) {
                        aboutData = { ...DEFAULT_ABOUT, ...foundAbout };
                    }
                    const foundHome = allDocs.find((d) => d.id === "__home_data__");
                    if (foundHome) {
                        homeData = { ...DEFAULT_HOME, ...foundHome };
                    }
                    const cloudPosts = allDocs.filter((d) => d.id !== "__about_me__" && d.id !== "__home_data__");
                    if (cloudPosts.length > 0) {
                        postsData = cloudPosts;
                    }
                    saveLocalData();
                    renderPostsList();
                    renderSinglePostView();
                    renderAboutMe();
                    renderHomeAndCard();
                    await syncMissingConfigDocsIfAdmin();
                }
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
