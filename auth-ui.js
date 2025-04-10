// auth-ui.js : gestion du bandeau connexion/déconnexion et modale login

const TOKEN_KEY = "auth_token";
const USER_NAME_KEY = "auth_name";

function show(el) {
  el.classList.remove("hidden");
}

function hide(el) {
  el.classList.add("hidden");
}

function showLoggedInUI(name) {
  const userNameDisplay = document.getElementById("userNameDisplay");
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  if (!userNameDisplay || !loginBtn || !logoutBtn) return;

  userNameDisplay.textContent = `👤 ${name}`;
  show(userNameDisplay);
  hide(loginBtn);
  show(logoutBtn);
}

function checkAuthStatus() {
  const token = localStorage.getItem(TOKEN_KEY);
  const name = localStorage.getItem(USER_NAME_KEY);
  if (token && name) showLoggedInUI(name);
}

function setupAuthUI() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const loginModal = document.getElementById("loginModal");
  const passwordInput = document.getElementById("passwordInput");
  const submitLoginBtn = document.getElementById("submitLoginBtn");
  const cancelLoginBtn = document.getElementById("cancelLoginBtn");
  const loginError = document.getElementById("loginError");

  if (!loginBtn || !logoutBtn || !submitLoginBtn) return;

  loginBtn.addEventListener("click", () => show(loginModal));

  cancelLoginBtn?.addEventListener("click", () => {
    hide(loginModal);
    hide(loginError);
    if (passwordInput) passwordInput.value = "";
  });

  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_NAME_KEY);
    location.reload();
  });

  submitLoginBtn.addEventListener("click", async () => {
    if (!passwordInput) return;
    const pwd = passwordInput.value.trim();
    if (!pwd) {
      loginError.textContent = "⚠️ Veuillez entrer un mot de passe.";
      show(loginError);
      return;
    }

    try {
      const manifest = await fetch("manifest.json").then(r => r.json());
      const res = await fetch(`${manifest.scriptURL}?action=login&password=${encodeURIComponent(pwd)}`);
      const result = await res.json();

      if (result.status === "success" && result.token) {
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(USER_NAME_KEY, result.name);
        hide(loginModal);
        hide(loginError);
        showLoggedInUI(result.name);
      } else {
        loginError.textContent = "❌ Mot de passe incorrect.";
        show(loginError);
      }
    } catch (err) {
      console.error("Erreur login:", err);
      loginError.textContent = "❌ Erreur serveur.";
      show(loginError);
    }
  });

  checkAuthStatus();
}

// Exécution automatique au chargement de la page
window.addEventListener("DOMContentLoaded", setupAuthUI);
