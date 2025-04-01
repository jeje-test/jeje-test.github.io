document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("toggleThemeBtn");
  const savedTheme = localStorage.getItem("theme");

  // Appliquer le thème au chargement
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    if (toggleBtn) toggleBtn.textContent = "☀️ Mode clair";
  } else {
    if (toggleBtn) toggleBtn.textContent = "🌙 Mode sombre";
  }

  // Gestion du bouton de bascule
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    toggleBtn.textContent = isDark ? "☀️ Mode clair" : "🌙 Mode sombre";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });
});
