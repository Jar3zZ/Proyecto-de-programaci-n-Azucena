const CATEGORY_INFO = {
  cientifica: { label: "Evidencia científica", icon: "⚗", tone: "sage" },
  academica: { label: "Formación académica", icon: "▤", tone: "lavender" },
  extracurricular: { label: "Formación extracurricular", icon: "♧", tone: "sand" },
  certificados: { label: "Certificados", icon: "✧", tone: "rose" }
};
const USERS_KEY = "portalUsuarios_v1";
const EVIDENCE_KEY = "portalEvidencias_v1";
const PROFILE_KEY = "portalPerfil_v1";
let currentUser = null;
let evidences = [];
let profile = {};
let selectedFileData = null;

function readStorage(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function userStorageKey(baseKey) { return `${baseKey}_${currentUser?.email || "sin_usuario"}`; }
function saveEvidences() {
  try { localStorage.setItem(userStorageKey(EVIDENCE_KEY), JSON.stringify(evidences)); return true; }
  catch { showToast("No se pudo guardar. Prueba con un archivo más pequeño."); return false; }
}
function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.remove("show"), 2600);
}
function navigate(section) {
  const target = document.getElementById(`view-${section}`);
  if (!target) return;
  document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
  target.classList.add("active");
  document.querySelectorAll("[data-section]").forEach(button => button.classList.toggle("active", button.dataset.section === section));
  const label = section === "inicio" ? "Inicio" : section === "perfil" ? "Mi perfil" : CATEGORY_INFO[section]?.label;
  document.getElementById("breadcrumb").innerHTML = `Mi espacio <span>/</span> ${label}`;
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
}
document.querySelectorAll("[data-section]").forEach(button => button.addEventListener("click", () => navigate(button.dataset.section)));
document.getElementById("todayLabel").textContent = new Intl.DateTimeFormat("es-MX", { dateStyle: "long" }).format(new Date());

function openModal(category = "academica") {
  const modal = document.getElementById("evidenceModal");
  document.getElementById("evidenceForm").reset();
  document.getElementById("evidenceCategory").value = category;
  document.getElementById("evidenceDate").value = new Date().toISOString().slice(0, 10);
  document.getElementById("fileName").textContent = "Ningún archivo seleccionado";
  document.getElementById("modalError").textContent = "";
  selectedFileData = null;
  document.getElementById("modalTitle").textContent = category === "certificados" ? "Agregar certificado" : "Agregar evidencia";
  modal.showModal();
}
document.getElementById("welcomeAdd").addEventListener("click", () => openModal());
document.querySelectorAll(".add-category").forEach(button => button.addEventListener("click", () => openModal(button.dataset.category)));
document.getElementById("closeModal").addEventListener("click", () => document.getElementById("evidenceModal").close());
document.getElementById("cancelModal").addEventListener("click", () => document.getElementById("evidenceModal").close());
document.getElementById("seeAll").addEventListener("click", () => navigate("academica"));

document.getElementById("evidenceFile").addEventListener("change", async event => {
  const file = event.target.files[0];
  selectedFileData = null;
  document.getElementById("fileName").textContent = file ? file.name : "Ningún archivo seleccionado";
  document.getElementById("modalError").textContent = "";
  if (!file) return;
  if (!(file.type === "application/pdf" || file.type.startsWith("image/"))) {
    event.target.value = "";
    document.getElementById("fileName").textContent = "Tipo de archivo no permitido";
    document.getElementById("modalError").textContent = "Selecciona un PDF o una imagen.";
    return;
  }
  if (file.size > 1.5 * 1024 * 1024) {
    event.target.value = "";
    document.getElementById("fileName").textContent = "Archivo demasiado grande";
    document.getElementById("modalError").textContent = "El archivo debe pesar 1.5 MB o menos.";
    return;
  }
  selectedFileData = { name: file.name, type: file.type, data: await fileToDataUrl(file) };
});
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

document.getElementById("evidenceForm").addEventListener("submit", event => {
  event.preventDefault();
  const category = document.getElementById("evidenceCategory").value;
  const item = {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    title: document.getElementById("evidenceTitle").value.trim(),
    category,
    date: document.getElementById("evidenceDate").value,
    description: document.getElementById("evidenceDescription").value.trim(),
    file: selectedFileData,
    created: Date.now()
  };
  if (!item.title || !item.date) return;
  evidences.unshift(item);
  if (saveEvidences()) {
    document.getElementById("evidenceModal").close();
    renderAll();
    showToast(category === "certificados" ? "Certificado guardado." : "Evidencia guardada.");
  } else {
    evidences.shift();
  }
});

function formatDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${date}T12:00:00Z`));
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[char]));
}
function evidenceMarkup(item) {
  const info = CATEGORY_INFO[item.category];
  const fileButton = item.file ? `<button class="small-action" data-file="${item.id}">Ver archivo</button>` : "";
  return `<article class="evidence-item">
    <span class="evidence-type-icon ${info.tone}">${info.icon}</span>
    <div class="evidence-info"><strong>${escapeHTML(item.title)}</strong><small>${info.label} · ${formatDate(item.date)}${item.file ? " · " + escapeHTML(item.file.name) : ""}</small>${item.description ? `<div class="evidence-desc">${escapeHTML(item.description)}</div>` : ""}</div>
    <div class="item-actions">${fileButton}<button class="small-action" data-delete="${item.id}" aria-label="Eliminar ${escapeHTML(item.title)}">Eliminar</button></div>
  </article>`;
}
function emptyMarkup(category) {
  return `<div class="empty-state"><span>${category ? CATEGORY_INFO[category].icon : "✧"}</span><strong>Aún no hay evidencias aquí</strong><p>Cuando agregues un registro, aparecerá en esta sección.</p></div>`;
}
function renderList(container, items, category = null) {
  container.innerHTML = items.length ? items.map(evidenceMarkup).join("") : emptyMarkup(category);
}
function renderAll() {
  document.getElementById("totalCount").textContent = evidences.length;
  document.getElementById("scienceCount").textContent = evidences.filter(item => item.category === "cientifica").length;
  document.getElementById("academicCount").textContent = evidences.filter(item => item.category === "academica").length;
  document.getElementById("certificateCount").textContent = evidences.filter(item => item.category === "certificados").length;
  renderList(document.getElementById("recentList"), evidences.slice(0, 4));
  Object.keys(CATEGORY_INFO).forEach(category => {
    renderList(document.getElementById(`list-${category}`), evidences.filter(item => item.category === category), category);
  });
  document.querySelectorAll("[data-delete]").forEach(button => button.addEventListener("click", () => {
    if (!confirm("¿Deseas eliminar esta evidencia?")) return;
    evidences = evidences.filter(item => item.id !== button.dataset.delete);
    saveEvidences(); renderAll(); showToast("Registro eliminado.");
  }));
  document.querySelectorAll("[data-file]").forEach(button => button.addEventListener("click", () => {
    const item = evidences.find(entry => entry.id === button.dataset.file);
    if (!item?.file) return;
    const link = document.createElement("a");
    link.href = item.file.data; link.target = "_blank"; link.rel = "noopener";
    link.download = item.file.name; link.click();
  }));
}
function loadProfile() {
  document.getElementById("profileName").value = profile.name || "";
  document.getElementById("profileEmail").value = profile.email || "";
  document.getElementById("profilePhone").value = profile.phone || "";
  document.getElementById("profileSchool").value = profile.school || "";
  updateProfilePreview();
}
function updateProfilePreview() {
  const name = profile.name || "Mi perfil";
  document.getElementById("profileNamePreview").textContent = name;
  document.getElementById("profileInitial").textContent = name === "Mi perfil" ? "S" : name.trim().charAt(0).toUpperCase();
  document.querySelector(".avatar-button").textContent = name === "Mi perfil" ? "S" : name.trim().charAt(0).toUpperCase();
}
document.getElementById("profileForm").addEventListener("submit", event => {
  event.preventDefault();
  profile = {
    name: document.getElementById("profileName").value.trim(),
    email: document.getElementById("profileEmail").value.trim(),
    phone: document.getElementById("profilePhone").value.trim(),
    school: document.getElementById("profileSchool").value.trim()
  };
  localStorage.setItem(userStorageKey(PROFILE_KEY), JSON.stringify(profile));
  updateProfilePreview();
  document.getElementById("profileSaved").textContent = "Cambios guardados en este navegador.";
  showToast("Perfil actualizado.");
});
function showAuthMode(mode) {
  const registering = mode === "register";
  document.getElementById("loginForm").hidden = registering;
  document.getElementById("registerForm").hidden = !registering;
  document.getElementById("authTitle").textContent = registering ? "Crea tu cuenta" : "Bienvenido de nuevo";
  document.getElementById("authSubtitle").textContent = registering ? "Regístrate para comenzar a organizar tus evidencias." : "Inicia sesión para consultar y organizar tus evidencias.";
  document.getElementById("authSwitch").hidden = false;
  document.getElementById("authSwitch").innerHTML = registering ? '¿Ya tienes una cuenta? <button type="button" id="showLogin">Iniciar sesión</button>' : '¿No tienes una cuenta? <button type="button" id="showRegister">Crear cuenta</button>';
  document.getElementById("loginError").textContent = "";
  document.getElementById("registerError").textContent = "";
  const registerButton = document.getElementById("showRegister");
  const loginButton = document.getElementById("showLogin");
  if (registerButton) registerButton.addEventListener("click", () => showAuthMode("register"));
  if (loginButton) loginButton.addEventListener("click", () => showAuthMode("login"));
}
function loadUserData() {
  evidences = readStorage(userStorageKey(EVIDENCE_KEY), []);
  profile = readStorage(userStorageKey(PROFILE_KEY), {});
  if (!profile.name && currentUser?.name) profile.name = currentUser.name;
  document.body.classList.remove("logged-out");
  document.getElementById("authScreen").hidden = true;
  document.getElementById("appShell").hidden = false;
  document.querySelector(".mobile-nav").hidden = false;
  loadProfile();
  renderAll();
}
function enterApp(user) {
  currentUser = user;
  // La sesión solo vive mientras la página permanece abierta.
  // La cuenta y las evidencias sí permanecen guardadas en este navegador.
  loadUserData();
  showToast(`Bienvenido/a, ${user.name || user.email}`);
}
async function hashPassword(password) {
  if (globalThis.crypto?.subtle) {
    const bytes = new TextEncoder().encode(password);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, "0")).join("");
  }
  // Respaldo para pruebas locales; no sustituye un sistema de autenticación seguro.
  return Array.from(password).reduce((hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619), 2166136261).toString(16);
}
document.getElementById("showRegister").addEventListener("click", () => showAuthMode("register"));
document.getElementById("loginForm").addEventListener("submit", async event => {
  event.preventDefault();
  const email = document.getElementById("loginEmail").value.trim().toLowerCase();
  const password = document.getElementById("loginPassword").value;
  const users = readStorage(USERS_KEY, {});
  const user = users[email];
  const error = document.getElementById("loginError");
  if (!user || user.passwordHash !== await hashPassword(password)) {
    error.textContent = "Correo o contraseña incorrectos. Verifica tus datos o crea una cuenta.";
    return;
  }
  enterApp(user);
});
document.getElementById("registerForm").addEventListener("submit", async event => {
  event.preventDefault();
  const name = document.getElementById("registerName").value.trim();
  const email = document.getElementById("registerEmail").value.trim().toLowerCase();
  const password = document.getElementById("registerPassword").value;
  const confirm = document.getElementById("registerConfirm").value;
  const error = document.getElementById("registerError");
  if (password.length < 6) { error.textContent = "La contraseña debe tener al menos 6 caracteres."; return; }
  if (password !== confirm) { error.textContent = "Las contraseñas no coinciden."; return; }
  const users = readStorage(USERS_KEY, {});
  if (users[email]) { error.textContent = "Ya existe una cuenta con ese correo."; return; }
  const user = { name, email, passwordHash: await hashPassword(password), created: Date.now() };
  users[email] = user;
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  // Conserva los registros antiguos del proyecto al crear la primera cuenta.
  if (Object.keys(users).length === 1) {
    const oldEvidence = localStorage.getItem(EVIDENCE_KEY);
    const oldProfile = localStorage.getItem(PROFILE_KEY);
    if (oldEvidence && !localStorage.getItem(`${EVIDENCE_KEY}_${email}`)) {
      localStorage.setItem(`${EVIDENCE_KEY}_${email}`, oldEvidence);
      localStorage.removeItem(EVIDENCE_KEY);
    }
    if (oldProfile && !localStorage.getItem(`${PROFILE_KEY}_${email}`)) {
      localStorage.setItem(`${PROFILE_KEY}_${email}`, oldProfile);
      localStorage.removeItem(PROFILE_KEY);
    }
  }
  enterApp(user);
});
document.getElementById("logoutButton").addEventListener("click", () => {
  currentUser = null;
  evidences = [];
  profile = {};
  document.getElementById("authScreen").hidden = false;
  document.getElementById("appShell").hidden = true;
  document.querySelector(".mobile-nav").hidden = true;
  document.body.classList.add("logged-out");
  document.getElementById("loginForm").reset();
  showAuthMode("login");
});
function initAuth() {
  document.body.classList.add("logged-out");
  document.getElementById("appShell").hidden = true;
  document.querySelector(".mobile-nav").hidden = true;
  const users = readStorage(USERS_KEY, {});
  const hasAccounts = Object.keys(users).length > 0;

  if (hasAccounts) {
    // Si ya existe una cuenta en este navegador, solicitar inicio de sesión.
    showAuthMode("login");
  } else {
    // Primera visita: mostrar directamente el formulario para crear la cuenta.
    showAuthMode("register");
    document.getElementById("authTitle").textContent = "Crea tu primera cuenta";
    document.getElementById("authSubtitle").textContent = "Registra tus datos para comenzar a organizar tus evidencias en este dispositivo.";
    document.getElementById("authSwitch").hidden = true;
  }
}
initAuth();
