// dashboard.js

// Fichier autonome pour afficher un dashboard + gestion PWA + thème + version + graphique

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("dashboardContainer");
  const versionDiv = document.getElementById("appVersion");
  const toggleBtn = document.getElementById("toggleThemeBtn");
  const refreshCacheBtn = document.getElementById("refreshCacheBtn");
  const installBtn = document.getElementById("installBtnFooter");

  // Thème clair/sombre
  toggleBtn?.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    const isDark = document.body.classList.contains("dark-mode");
    toggleBtn.textContent = isDark ? "☀️ Mode clair" : "🌙 Mode sombre";
    localStorage.setItem("theme", isDark ? "dark" : "light");
  });

  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
    toggleBtn.textContent = "☀️ Mode clair";
  }

  // Installation PWA
  let deferredPrompt = null;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    installBtn.style.display = "inline-block";
  });

  installBtn?.addEventListener("click", () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(choice => {
        if (choice.outcome === "accepted") {
          console.log("✅ PWA installée");
        }
        installBtn.style.display = "none";
        deferredPrompt = null;
      });
    }
  });

  // Rafraîchissement du cache
  refreshCacheBtn?.addEventListener("click", () => {
    if ('caches' in window) {
      caches.keys().then(names => {
        for (let name of names) caches.delete(name);
      }).then(() => {
        alert("Le cache a été vidé. L'application va se recharger...");
        window.location.reload(true);
      }).catch(err => {
        alert("Erreur lors du vidage du cache.");
      });
    }
  });

  // Chargement des données depuis le script Apps Script (via POST pour éviter CORS)
  fetch("manifest.json")
    .then(res => res.json())
    .then(manifest => {
      versionDiv.textContent = "Version: " + manifest.version;

      const form = new FormData();
      form.append("action", "dashboard");

      return fetch(manifest.scriptURL, {
        method: "POST",
        body: form
      });
    })
    .then(res => res.json())
    .then(stats => {
      const html = `
        <div class="result-box">
          <h2>📅 Cours décomptés</h2>
          <p>Aujourd'hui : <strong>${stats.today}</strong></p>
          <p>Cette semaine : <strong>${stats.thisWeek}</strong></p>
          <p>Total global : <strong>${stats.total}</strong></p>
          <canvas id="weeklyChart" height="200"></canvas>
        </div>

        <div class="result-box">
          <h2>⚠️ Alertes - Cours restants faibles</h2>
          <ul>
            ${Array.isArray(stats.lowBalanceUsers) && stats.lowBalanceUsers.length > 0
              ? stats.lowBalanceUsers.map(u => `<li><strong>${u.name}</strong> - ${u.remaining} cours restants</li>`).join('')
              : '<li>Aucune alerte 👍</li>'}
          </ul>
        </div>
      `;
      container.innerHTML = html;
      drawChart(stats.weekly || []);
    })
    .catch(error => {
      console.error("Erreur chargement dashboard:", error);
      container.innerHTML = `<p style="color: red;">Erreur lors du chargement du tableau de bord.</p>`;
    });

  function drawChart(data) {
    if (!data || data.length === 0 || typeof Chart === 'undefined') return;
    const ctx = document.getElementById("weeklyChart").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: data.map(d => d.day),
        datasets: [{
          label: "Cours décomptés",
          data: data.map(d => d.count),
          backgroundColor: "#007bff"
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
});
