document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleThemeBtn");
  const refreshBtn = document.getElementById("refreshCacheBtn");
  const versionDiv = document.getElementById("appVersion");
  const savedTheme = localStorage.getItem("theme");

  // 🌙 Appliquer le thème au chargement
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (toggleBtn) toggleBtn.textContent = "☀️ Mode clair";
  } else {
    if (toggleBtn) toggleBtn.textContent = "🌙 Mode sombre";
  }

  // 🎛 Bascule thème clair/sombre
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    toggleBtn.textContent = isDark ? "☀️ Mode clair" : "🌙 Mode sombre";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  // ♻️ Reset complet : cache + localStorage + reload propre
  refreshBtn?.addEventListener("click", () => {
    if (confirm("♻️ Réinitialiser complètement l'application ? Cela va vider le cache, les données locales et recharger l'application.")) {
      if ('caches' in window) {
        caches.keys().then(names => {
          return Promise.all(names.map(name => caches.delete(name)));
        }).then(() => {
          console.log("✅ Cache vidé");
        }).catch(err => {
          console.error("❌ Erreur lors du vidage du cache :", err);
        });
      }
      localStorage.clear();
      const cleanUrl = window.location.origin + window.location.pathname;
      window.location.href = cleanUrl;
    }
  });

  // 📦 Charger la version depuis manifest.json
  fetch("manifest.json")
    .then(response => response.json())
    .then(data => {
      if (versionDiv) {
        versionDiv.textContent = "Version: " + data.version;
      }
    })
    .catch(error => {
      console.error("Erreur lors du chargement du manifest :", error);
      if (versionDiv) {
        versionDiv.textContent = "Version inconnue";
      }
    });
});
