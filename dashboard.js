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
    <h2>📦 Répartition des abonnements</h2>
    <canvas id="abonnementChart" height="200"></canvas>
  </div>

  <div class="result-box compact">
    <h2>📅 Cours décomptés</h2>
    <p><strong>Aujourd'hui :</strong> ${stats.today}</p>
    <p><strong>Cette semaine :</strong> ${stats.thisWeek}</p>
    <p><strong>Total global :</strong> ${stats.total}</p>
    <canvas id="weeklyChart" height="200"></canvas>
  </div>

  <div class="result-box">
    <h2>⚠️ Alertes - Cours restants faibles</h2>
    ${
      Array.isArray(stats.lowBalanceUsers) && stats.lowBalanceUsers.length > 0
        ? `
          <div class="table-container">
            <table class="alert-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Abonnement</th>
                  <th>Date de début</th>
                  <th>Cours restants</th>
                </tr>
              </thead>
              <tbody>
                ${stats.lowBalanceUsers
                  .sort((a, b) => a.remaining - b.remaining)
                  .map(u => `
                    <tr>
                      <td><strong>${u.name}</strong></td>
                      <td>${u.plan || "-"}</td>
                      <td>${u.startDate || "-"}</td>
                      <td><strong>${u.remaining}</strong></td>
                    </tr>
                  `).join('')}
              </tbody>
            </table>
          </div>
        `
        : '<p>Aucune alerte 👍</p>'
    }
  </div>
`;

      container.innerHTML = html;
      drawChart(stats.weekly || []);

      drawChart(stats.weekly || []);
      drawAbonnementChart(stats.abonnements || {}); // <-- 👈 on appelle ici notre 2e graphique
      


      
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
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: ctx => `${ctx.parsed.y} cours`
            }
          },
          datalabels: {
            anchor: 'end',
            align: 'top',
            color: '#000',
            font: {
              weight: 'bold'
            },
            formatter: value => value
          }
        },
        scales: {
          y: { beginAtZero: true, precision: 0 }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

function drawAbonnementChart(data) {
  const ctx = document.getElementById("abonnementChart").getContext("2d");
  const labels = Object.keys(data);
  const counts = Object.values(data);

  new Chart(ctx, {
    type: "pie",
    data: {
      labels: labels,
      datasets: [{
        label: "Nombre d’abonnés",
        data: counts,
        backgroundColor: [
          "#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d", "#6610f2", "#17a2b8"
        ]
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: {
          position: 'right'
        },
        datalabels: {
          color: '#000',
          font: {
            weight: 'bold'
          },
          formatter: (value) => value
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}


  
});
