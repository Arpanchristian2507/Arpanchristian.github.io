gsap.registerPlugin(ScrollTrigger);

// ===========================
// Navigation
// ===========================

const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');
const navAnchors = navLinks.querySelectorAll('a');
// HINT: The key is encoded in base64 somewhere on this page...
console.log("%c🔐 Developer Challenge Activated", "color: #3b82f6; font-size: 16px;");
console.log("Hint: The key is encoded in base64 somewhere on this page...");
console.log("Tip: Press Ctrl+Shift+D (Windows/Linux) or \u2318+Shift+D (Mac) to open the challenge.");


// Scroll: add 'scrolled' class to navbar
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 50);
  highlightActiveLink();
});

// Hamburger toggle (mobile)
hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('open');
  navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navAnchors.forEach((link) => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('open');
    navLinks.classList.remove('open');
  });
});

// Highlight active nav link based on scroll position
function highlightActiveLink() {
  const sections = document.querySelectorAll('section[id]');
  const scrollY = window.scrollY + 100;

  sections.forEach((section) => {
    const top = section.offsetTop;
    const height = section.offsetHeight;
    const id = section.getAttribute('id');
    const link = navLinks.querySelector(`a[href="#${id}"]`);
    if (link) {
      link.classList.toggle('active', scrollY >= top && scrollY < top + height);
    }
  });
}

// ===========================
// Typing Effect (Hero)
// ===========================

const typedEl = document.getElementById('typed-text');
const roles = [
  'Web Developer',
  'Cybersecurity Enthusiast',
  'UI/UX Enthusiast',
  'Creative Coder',
];
let roleIndex = 0;
let charIndex = 0;
let isDeleting = false;
const typingSpeed = 100;
const deletingSpeed = 60;
const pauseBetween = 1800;

function typeRole() {
  const current = roles[roleIndex];
  if (isDeleting) {
    typedEl.textContent = current.substring(0, charIndex - 1);
    charIndex--;
  } else {
    typedEl.textContent = current.substring(0, charIndex + 1);
    charIndex++;
  }

  if (!isDeleting && charIndex === current.length) {
    setTimeout(() => { isDeleting = true; typeRole(); }, pauseBetween);
    return;
  }

  if (isDeleting && charIndex === 0) {
    isDeleting = false;
    roleIndex = (roleIndex + 1) % roles.length;
  }

  setTimeout(typeRole, isDeleting ? deletingSpeed : typingSpeed);
}

typeRole();

// ===========================
// Animated Counters (About)
// ===========================

function animateCounter(el) {
  const target = parseInt(el.getAttribute('data-target'), 10);
  const duration = 1500;
  const step = Math.ceil(target / (duration / 16));
  let current = 0;

  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = current;
    if (current === target) clearInterval(timer);
  }, 16);
}

// ===========================
// Functional Observer (counters)
// ===========================

const functionalObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        if (entry.target.id === 'about') {
          document.querySelectorAll('.stat-number').forEach(animateCounter);
        }
        functionalObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

document.querySelectorAll('#about').forEach((el) => functionalObserver.observe(el));

// ===========================
// Three.js Hero Background
// ===========================

(function initThree() {
  const canvas = document.getElementById('hero-canvas');
  const heroSection = document.getElementById('hero');

  if (!canvas || !heroSection) {
    console.warn('Hero background skipped: missing #hero or #hero-canvas.');
    return;
  }

  if (typeof THREE === 'undefined') {
    console.warn('Hero background skipped: Three.js failed to load.');
    return;
  }

  // Prevent accidental double-init if this script is evaluated more than once.
  if (canvas.dataset.threeInitialized === 'true') {
    return;
  }
  canvas.dataset.threeInitialized = 'true';

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 200);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  } catch (err) {
    console.warn('Hero background skipped: WebGL context unavailable.', err);
    return;
  }

  renderer.setSize(canvas.clientWidth, canvas.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  camera.position.z = 30;

  // Particle field
  const count = 200;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count * 3; i++) {
    positions[i] = (Math.random() - 0.5) * 100;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ color: 0x6c63ff, size: 0.35, transparent: true, opacity: 0.75 });
  const particles = new THREE.Points(geo, mat);
  scene.add(particles);

  // Subtle wireframe torus
  const torusGeo = new THREE.TorusGeometry(10, 3, 16, 60);
  const torusMat = new THREE.MeshBasicMaterial({ color: 0x6c63ff, wireframe: true, transparent: true, opacity: 0.08 });
  const torus = new THREE.Mesh(torusGeo, torusMat);
  torus.position.set(18, -5, -10);
  scene.add(torus);

  // Mouse parallax
  let mouseX = 0;
  let mouseY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = (e.clientX / window.innerWidth - 0.5) * 4;
    mouseY = -(e.clientY / window.innerHeight - 0.5) * 4;
  });

  function tick() {
    requestAnimationFrame(tick);
    particles.rotation.y += 0.0008;
    particles.rotation.x += 0.0003;
    torus.rotation.x += 0.003;
    torus.rotation.y += 0.002;
    camera.position.x += (mouseX - camera.position.x) * 0.03;
    camera.position.y += (mouseY - camera.position.y) * 0.03;
    renderer.render(scene, camera);
  }
  tick();

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}());

//DEVLOPER ACCESS ONLY:
document.addEventListener("keydown", function (e) {
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "d") {
    document.getElementById("dev-unlock").classList.add("active");
    console.log("%c🔐 CTF Initialized", "color:#22c55e; font-size:16px;");
    console.log("U3RhZ2UxOiBXaGF0IGlzIDIgKyAyPw==");
  }
});
document.addEventListener("DOMContentLoaded", function () {

  let currentStage = 1;

  const unlockBtn = document.getElementById("unlock-btn");
  const inputEl = document.getElementById("dev-key-input");
  const questionEl = document.getElementById("stage-question");
  const descEl = document.getElementById("stage-description");
  const errorEl = document.getElementById("unlock-error");
  const hintBtn = document.getElementById("hint-btn");
  const hintText = document.getElementById("ctf-hint-text");

  if (!unlockBtn) return;

  const stages = [
    {
      question: "Stage 1 of 3: Decode the hidden console message.",
      description: "Open DevTools (F12 on Windows/Linux, ⌘+Option+J on Mac) → Console tab. You'll see a hint about a base64 key. Decode it to reveal a question, then answer that question here.",
      hint: "The encoded message in the source decodes to a simple arithmetic question. Your answer is just a number.",
      answer: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    },
    {
      question: "Stage 2 of 3: What is the character count of 'Arpan Christian' (with space)?",
      description: "Count each individual character in the full name 'Arpan Christian' — including the space between first and last name.",
      hint: "A-r-p-a-n = 5, [space] = 1, C-h-r-i-s-t-i-a-n = 9. Total?",
      answer: "e629fa6598d732768f7c726b4b621285f9c3b85303900aa912017db7617d8bdb",
    },
    {
      question: "Stage 3 of 3: What is 2 raised to the power of 5?",
      description: "A classic power-of-two calculation. Think binary: how many values can 5 bits represent?",
      hint: "2^5 = 2 × 2 × 2 × 2 × 2. Count it on your fingers.",
      answer: "e29c9c180c6279b0b02abd6a1801c7c04082cf486ec027aa13515e4f3884bb6b",
    },
  ];

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
  }

  function updateStageUI(stage) {
    const s = stages[stage - 1];
    questionEl.innerText = s.question;
    if (descEl) descEl.innerText = s.description;
    if (hintText) hintText.style.display = "none";
    errorEl.style.display = "none";
    inputEl.value = "";
    inputEl.focus();

    // Update progress pips
    document.querySelectorAll(".ctf-stage-pip").forEach((pip) => {
      const n = parseInt(pip.dataset.stage, 10);
      pip.classList.remove("active", "done");
      if (n < stage) {
        pip.classList.add("done");
        pip.textContent = "✔";
      } else if (n === stage) {
        pip.classList.add("active");
        pip.textContent = n;
      } else {
        pip.textContent = n;
      }
    });
    document.querySelectorAll(".ctf-stage-connector").forEach((conn, i) => {
      conn.classList.toggle("done", i + 1 < stage);
    });
  }

  updateStageUI(1);

  if (hintBtn) {
    hintBtn.addEventListener("click", function () {
      if (!hintText) return;
      const s = stages[currentStage - 1];
      hintText.textContent = "💡 " + s.hint;
      hintText.style.display = "block";
    });
  }

  unlockBtn.addEventListener("click", async function () {
    const input = inputEl.value.trim();
    const expected = stages[currentStage - 1].answer;
    let hashed;
    try {
      hashed = await sha256(input.toLowerCase());
    } catch (e) {
      showError();
      return;
    }

    if (hashed === expected) {
      if (currentStage < stages.length) {
        currentStage++;
        updateStageUI(currentStage);
      } else {
        sessionStorage.setItem("devAccess", "true");
        accessGranted();
      }
    } else {
      showError();
    }
  });

  inputEl.addEventListener("keydown", function (e) {
    if (e.key === "Enter") unlockBtn.click();
  });

  function showError() {
    errorEl.innerText = "❌ Access Denied. Think like a developer.";
    errorEl.style.display = "block";
  }

  function accessGranted() {
    document.body.innerHTML =
      "<h1 style='color:lime;text-align:center;margin-top:40vh;font-family:monospace;'>ACCESS GRANTED</h1>";

    setTimeout(() => {
      window.location.href = "c0ff33.html";
    }, 1500);
  }

  // ── Badge display (persisted in localStorage) ──
  loadBadge();
});

function loadBadge() {
  try {
    const badge = JSON.parse(localStorage.getItem("ctfBadge") || "null");
    if (badge && badge.earned) {
      const btn = document.getElementById("badge-earned-btn");
      if (btn) btn.style.display = "flex";
      const dateEl = document.getElementById("badge-date");
      if (dateEl && badge.earnedAt) {
        dateEl.textContent = "Earned " + new Date(badge.earnedAt).toLocaleDateString();
      }
    }
  } catch (e) { /* ignore */ }
}

// Open / close badge modal
document.addEventListener("DOMContentLoaded", function () {
  const badgeBtn = document.getElementById("badge-earned-btn");
  const badgeModal = document.getElementById("badge-modal");
  const badgeClose = document.getElementById("badge-modal-close");
  const badgeOverlay = badgeModal && badgeModal.querySelector(".badge-modal-overlay");

  if (badgeBtn && badgeModal) {
    badgeBtn.addEventListener("click", function () {
      badgeModal.classList.add("active");
    });
  }

  function closeBadgeModal() {
    if (badgeModal) badgeModal.classList.remove("active");
  }

  if (badgeClose) badgeClose.addEventListener("click", closeBadgeModal);
  if (badgeOverlay) badgeOverlay.addEventListener("click", closeBadgeModal);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeBadgeModal();
  });
});

// ===========================
// GSAP Animations
// ===========================

// Hero entrance timeline
gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.75 } })
  .from('.hero-greeting',    { opacity: 0, y: 30 },        0.2)
  .from('.hero-name',        { opacity: 0, y: 35 },        0.45)
  .from('.hero-title',       { opacity: 0, y: 25 },        0.65)
  .from('.hero-description', { opacity: 0, y: 25 },        0.82)
  .from('.hero-buttons',     { opacity: 0, y: 20 },        1.0)
  .from('.social-links',     { opacity: 0, y: 20 },        1.15)
  .from('.hero-visual',      { opacity: 0, scale: 0.8, duration: 0.9 }, 0.5);

// Section titles
gsap.utils.toArray('.section-title').forEach((el) => {
  gsap.from(el, {
    scrollTrigger: { trigger: el, start: 'top 85%' },
    opacity: 0, y: 40, duration: 0.7, ease: 'power3.out',
  });
});

// About text
gsap.from('.about-text', {
  scrollTrigger: { trigger: '.about-grid', start: 'top 80%' },
  opacity: 0, x: -50, duration: 0.8, ease: 'power3.out',
});

// Stat cards stagger
gsap.from('.stat-card', {
  scrollTrigger: { trigger: '.about-stats', start: 'top 80%' },
  opacity: 0, scale:0.95, duration: 0.6, stagger: 0.12, ease: 'power3.out',
});

// Skill category cards
gsap.from('.skills-cat-card', {
  scrollTrigger: {
    trigger: '.skills-categories',
    start: 'top 80%',
    once: true,
  },
  immediateRender: false,
  opacity: 0,
  scale: 0.95,
  duration: 0.6,
  stagger: 0.15,
  ease: 'power3.out',
  clearProps: 'all',
});

// Skill pills stagger
gsap.from('.skill-pill', {
  scrollTrigger: {
    trigger: '.skills-categories',
    start: 'top 75%',
    once: true,
  },
  immediateRender: false,
  opacity: 0,
  scale: 0.88,
  duration: 0.35,
  stagger: 0.04,
  ease: 'back.out(1.4)',
  clearProps: 'all',
});

// Project cards stagger
gsap.from('.project-card', {
  scrollTrigger: { trigger: '.projects-grid', start: 'top 80%' },
  opacity: 0, y: 60, duration: 0.7, stagger: 0.15, ease: 'power3.out',
});

// Projects show more toggle
(function initProjectsToggle() {
  const toggleBtn = document.getElementById('toggle-other-projects');
  const otherWrap = document.getElementById('other-projects-wrap');
  if (!toggleBtn || !otherWrap) return;

  const labelText = 'Show More Projects';
  const hideText = 'Show Less Projects';

  toggleBtn.addEventListener('click', () => {
    const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    const nextState = !isExpanded;

    toggleBtn.setAttribute('aria-expanded', String(nextState));
    toggleBtn.classList.toggle('is-open', nextState);
    toggleBtn.childNodes[0].nodeValue = (nextState ? hideText : labelText) + ' ';
    otherWrap.hidden = !nextState;

    if (nextState && window.gsap) {
      const cards = otherWrap.querySelectorAll('.project-card');
      gsap.fromTo(
        cards,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.45, stagger: 0.1, ease: 'power3.out' }
      );
    }
  });
}());

// Contact section
gsap.from('.contact-info', {
  scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' },
  opacity: 0, x: -50, duration: 0.8, ease: 'power3.out',
});
gsap.from('.contact-form', {
  scrollTrigger: { trigger: '.contact-grid', start: 'top 80%' },
  opacity: 0, x: 50, duration: 0.8, ease: 'power3.out',
});

window.addEventListener('load', () => {
  ScrollTrigger.refresh();
});

// ===========================
// Contact Form
// ===========================

const contactForm = document.getElementById('contact-form');
const formSuccess = document.getElementById('form-success');
const submitBtn = contactForm.querySelector('button[type="submit"]');
const btnText = document.getElementById('btn-text');
const successMessage = formSuccess.textContent.trim();

function validateField(id, errorId, validator, message) {
  const field = document.getElementById(id);
  const error = document.getElementById(errorId);
  if (!validator(field.value.trim())) {
    field.classList.add('invalid');
    error.textContent = message;
    return false;
  }
  field.classList.remove('invalid');
  error.textContent = '';
  return true;
}

function isNotEmpty(val) {
  return val.length > 0;
}

function isValidEmail(val) {
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val);
}

function showFormStatus(message, isError) {
  formSuccess.textContent = message;
  formSuccess.classList.toggle('form-error', isError);
  formSuccess.hidden = false;
}

contactForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const nameOk = validateField('name', 'name-error', isNotEmpty, 'Name is required.');
  const emailOk = validateField('email', 'email-error', isValidEmail, 'Enter a valid email.');
  const subjectOk = validateField('subject', 'subject-error', isNotEmpty, 'Subject is required.');
  const messageOk = validateField('message', 'message-error', isNotEmpty, 'Message is required.');

  if (!(nameOk && emailOk && subjectOk && messageOk)) {
    return;
  }

  const formData = new FormData(contactForm);
  formData.append('access_key', '480a93d6-58ee-4009-9b61-395e1a0506ed');

  const originalText = btnText.textContent;
  btnText.textContent = 'Sending...';
  submitBtn.disabled = true;
  formSuccess.hidden = true;

  try {
    const response = await fetch('https://api.web3forms.com/submit', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (data.success) {
      showFormStatus(successMessage, false);
      contactForm.reset();
      setTimeout(() => { formSuccess.hidden = true; }, 5000);
    } else {
      showFormStatus(data.message || 'Could not send your message. Please try again.', true);
    }
  } catch (error) {
    showFormStatus('Something went wrong. Please try again.', true);
  } finally {
    btnText.textContent = originalText;
    submitBtn.disabled = false;
  }
});

['name', 'email', 'subject', 'message'].forEach((id) => {
  document.getElementById(id).addEventListener('input', () => {
    document.getElementById(id).classList.remove('invalid');
    document.getElementById(`${id}-error`).textContent = '';
  });
});


// ===========================
// Footer Year
// ===========================

document.getElementById('year').textContent = new Date().getFullYear();

// ===========================
// Button Hover Previews
// ===========================

(function initHoverPreviews() {
  const previewEl = document.createElement('div');
  previewEl.id = 'btn-hover-preview';
  previewEl.setAttribute('role', 'tooltip');
  previewEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(previewEl);

  const previews = {
    '#projects': {
      title: '💻 Projects',
      items: ['Portfolio Website — HTML, CSS, JS', 'UI Design System — CSS, Design', 'VoiceBridge — Kotlin, Android'],
    },
    '#contact': {
      title: '✉️ Contact',
      items: ['arpanchristian2507@gmail.com', 'Winnipeg, MB', 'github.com/Arpanchristian2507'],
    },
    '/Resume.pdf': {
      title: '📄 Resume / CV',
      items: ['Opens the PDF resume', 'Arpan Christian — Web Developer', 'Skills · Projects · Experience'],
    },
    '#about': {
      title: '👤 About Me',
      items: ['Passionate web developer', '3 Years Experience', '10+ Projects Completed'],
    },
  };

  let hideTimeout;

  function showPreview(btn, href) {
    const data = previews[href];
    if (!data) return;
    clearTimeout(hideTimeout);

    previewEl.innerHTML =
      '<div class="bhp-title">' + data.title + '</div>' +
      '<ul class="bhp-list">' +
      data.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') +
      '</ul>';

    // Use offsetWidth/offsetHeight with safe fallbacks for initial render
    const pw = previewEl.offsetWidth || 220;
    const ph = previewEl.offsetHeight || 90;
    const rect = btn.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - pw / 2 + window.scrollX;
    // Keep within viewport
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    const top = rect.top + window.scrollY - ph - 12;

    previewEl.style.left = left + 'px';
    previewEl.style.top = top + 'px';
    previewEl.classList.add('bhp-visible');
  }

  function hidePreview() {
    hideTimeout = setTimeout(function () {
      previewEl.classList.remove('bhp-visible');
    }, 120);
  }

  document.querySelectorAll('.btn[href]').forEach(function (btn) {
    const href = btn.getAttribute('href');
    if (!previews[href]) return;

    btn.addEventListener('mouseenter', function () { showPreview(btn, href); });
    btn.addEventListener('mouseleave', hidePreview);
    btn.addEventListener('focus', function () { showPreview(btn, href); });
    btn.addEventListener('blur', hidePreview);
  });
}());

// ===========================
// Project Screen Previews
// ===========================

const fallbackImages = {
  "https://arpanchristian2507.github.io/project1": "images/previews/VoiceBridge.png"};

(function initProjectScreenPreviews() {
  // Build the preview popup (mini browser window)
  const previewEl = document.createElement('div');
  previewEl.id = 'project-screen-preview';
  previewEl.setAttribute('role', 'tooltip');
  previewEl.setAttribute('aria-live', 'polite');
  previewEl.innerHTML =
    '<div class="psp-browser-bar">' +
      '<span class="psp-dots"><span></span><span></span><span></span></span>' +
      '<span class="psp-url"></span>' +
    '</div>' +
    '<div class="psp-screen">' +
      '<img class="psp-img" alt="Page preview" />' +
      '<span class="psp-loading">Loading preview\u2026</span>' +
    '</div>';
  document.body.appendChild(previewEl);

  var urlEl = previewEl.querySelector('.psp-url');
  var imgEl = previewEl.querySelector('.psp-img');
  var loadingEl = previewEl.querySelector('.psp-loading');

  var hideTimeout;
  var currentHref = null;

function getScreenshotUrl(pageUrl) {
  return 'https://api.microlink.io/?screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark&url=' 
    + encodeURIComponent(pageUrl);
}

  function positionPreview(btn) {
    // Measure after content is set so height is correct
    var pw = previewEl.offsetWidth || 280;
    var ph = previewEl.offsetHeight || 200;
    var rect = btn.getBoundingClientRect();
    var left = rect.left + rect.width / 2 - pw / 2 + window.scrollX;
    left = Math.max(8, Math.min(left, window.innerWidth - pw - 8));
    // Prefer above; fall back to below if not enough room
    var top = rect.top + window.scrollY - ph - 12;
    if (top < window.scrollY + 8) {
      top = rect.bottom + window.scrollY + 8;
    }
    previewEl.style.left = left + 'px';
    previewEl.style.top = top + 'px';
  }

  function showPreview(btn, href) {
    clearTimeout(hideTimeout);

    // Update URL bar
    try {
      var url = new URL(href);
      var path = url.pathname;
      urlEl.textContent = url.hostname + (path.length > 28 ? path.slice(0, 28) + '\u2026' : path);
    } catch (e) {
      urlEl.textContent = href;
    }

    // Only reload screenshot when href changes
    var screenshotUrl = getScreenshotUrl(href);
    var fallback = fallbackImages[href];

imgEl.onload = function () {
  loadingEl.style.display = 'none';
  imgEl.style.display = 'block';
};

imgEl.onerror = function () {
  if (fallback) {
    imgEl.src = fallback; // fallback image
  } else {
    loadingEl.textContent = 'Preview unavailable';
  }
};

imgEl.src = screenshotUrl;

    positionPreview(btn);
    previewEl.classList.add('psp-visible');
  }

  function hidePreview() {
    hideTimeout = setTimeout(function () {
      previewEl.classList.remove('psp-visible');
    }, 150);
  }

  // Attach only to buttons inside .project-links with a real URL
  document.querySelectorAll('.project-links .btn[href]').forEach(function (btn) {
    var href = btn.getAttribute('href');
    if (!href || href === '#') return;

    btn.addEventListener('mouseenter', function () { showPreview(btn, href); });
    btn.addEventListener('mouseleave', hidePreview);
    btn.addEventListener('focus', function () { showPreview(btn, href); });
    btn.addEventListener('blur', hidePreview);
  });
}());

const message = `🔐 Hidden Challenge – For the Curious Minds

Some developers build projects.
Others build systems.
The curious ones look deeper.

Welcome to a small embedded challenge inside my portfolio.

If you’re reading this, you’ve already noticed that something feels… intentional.

This is a lightweight Capture The Flag (CTF) style puzzle designed for:

\u2022 Developers

\u2022 Security enthusiasts

\u2022 Recruiters who like digging into systems

\u2022 And anyone who enjoys solving problems

Your mission is simple:

\u2022 Inspect carefully.

\u2022 Decode thoughtfully.

\u2022 Follow the breadcrumbs.

Somewhere within this site is a hidden path.
If you reach the final stage, you’ll unlock:

🏆 A digital badge
or
🚀 A hidden “Support the Development” page

No brute force.
No guessing.
Just logic.`;
console.log(message);
