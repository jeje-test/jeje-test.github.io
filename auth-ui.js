// auth-ui.js

// ✅ Gestion de l’affichage de connexion si l'utilisateur n'est pas authentifié
function enforceAuthAccess(pageName = "") {
  const token = localStorage.getItem("auth_token");
  if (!token) {
    const modal = document.createElement("div");
    modal.className = "custom-modal fullscreen-modal";
    modal.innerHTML = `
      <div class="custom-modal-content">
        <h2>🔒 Accès restreint</h2>
        <p>Vous devez être connecté pour accéder à cette page${pageName ? ` (${pageName})` : ''}.</p>
        <button onclick="window.location.href='index.html'">🔑 Se connecter</button>
      </div>
    `;
    document.body.innerHTML = '';
    document.body.appendChild(modal);
    return false;
  }
  return true;
}

// ✅ Affiche l'identité connectée ou les boutons login/logout si présents dans la page
function setupUserMenu() {
  const loginBtn = document.getElementById("loginBtn");
  const logoutBtn = document.getElementById("logoutBtn");
  const userNameDisplay = document.getElementById("userNameDisplay");
  const loginModal = document.getElementById("loginModal");
  const passwordInput = document.getElementById("passwordInput");
  const submitLoginBtn = document.getElementById("submitLoginBtn");
  const cancelLoginBtn = document.getElementById("cancelLoginBtn");
  const loginError = document.getElementById("loginError");

  const token = localStorage.getItem("auth_token");
  const name = localStorage.getItem("auth_name");

  if (token && userNameDisplay && loginBtn && logoutBtn) {
    userNameDisplay.textContent = `👤 ${name || "Connecté"}`;
    userNameDisplay.classList.remove("hidden");
    loginBtn.classList.add("hidden");
    logoutBtn.classList.remove("hidden");

    logoutBtn.onclick = () => {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_name");
      window.location.reload();
    };
  }

  if (loginBtn && loginModal && passwordInput && submitLoginBtn && loginError) {
    loginBtn.onclick = () => loginModal.classList.remove("hidden");

    cancelLoginBtn?.addEventListener("click", () => {
      loginModal.classList.add("hidden");
      loginError.classList.add("hidden");
      passwordInput.value = "";
    });

    submitLoginBtn.addEventListener("click", async () => {
      const pwd = passwordInput.value.trim();
      if (!pwd) {
        loginError.textContent = "⚠️ Veuillez entrer un mot de passe.";
        loginError.classList.remove("hidden");
        return;
      }

      try {
        const manifest = await fetch("manifest.json").then(r => r.json());
        const res = await fetch(`${manifest.scriptURL}?action=login&password=${encodeURIComponent(pwd)}`);
        const result = await res.json();

        if (result.status === "success" && result.token) {
          localStorage.setItem("auth_token", result.token);
          localStorage.setItem("auth_name", result.name);
          loginModal.classList.add("hidden");
          loginError.classList.add("hidden");
          setupUserMenu();
        } else {
          loginError.textContent = "❌ Mot de passe incorrect.";
          loginError.classList.remove("hidden");
        }
      } catch (err) {
        console.error("Erreur login:", err);
        loginError.textContent = "❌ Erreur serveur.";
        loginError.classList.remove("hidden");
      }
    });
  }
}

// ✅ À appeler dans les pages protégées
function requireAuthentication(pageName = "") {
  document.addEventListener("DOMContentLoaded", () => {
    const allowed = enforceAuthAccess(pageName);
    if (allowed) setupUserMenu();
  });
}

// ✅ Appel automatique si le script est chargé (sauf dashboard déjà autonome)
if (!window.skipAuthUIAutoInit) {
  setupUserMenu();
}
