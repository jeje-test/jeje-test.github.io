// dashboard.js

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("dashboardContainer");
  const versionDiv = document.getElementById("appVersion");
  const toggleBtn = document.getElementById("toggleThemeBtn");
  const refreshCacheBtn = document.getElementById("refreshCacheBtn");
  const installBtn = document.getElementById("installBtnFooter");

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

  fetch("manifest.json")
    .then(res => res.json())
    .then(manifest => {
      versionDiv.textContent = "📦 Version : " + manifest.version;

      const form = new FormData();
      form.append("action", "dashboard");
      form.append("token", localStorage.getItem("auth_token") || "");

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
        <div class="field-tip">
          📌 Tous les abonnements pour l'année scolaire, sauf ceux qui sont en statut 'clos' ou 'résilié'
        </div>
        <canvas id="abonnementChart" height="200"></canvas>
      </div>

      <div class="result-box compact">
        <h2>📅 Cours décomptés</h2>
        <div class="field-tip">
          📌 En utilisant l'action 'décompter un cours', que ce soit en ligne, en mode "hors ligne" avec envoi en masse ou suite à une recherche manuelle.
        </div>
        <p><strong>Aujourd'hui :</strong> ${stats.today}</p>
        <p><strong>Cette semaine :</strong> ${stats.thisWeek}</p>
        <p><strong>Total global :</strong> ${stats.total}</p>
        <canvas id="weeklyChart" height="200"></canvas>
      </div>

      <div class="result-box">
        <h2>⚠️ Alertes - Cours restants faibles</h2>
        <div class="field-tip">
          📌 Sélectionnez une ligne pour accéder à la fiche détaillée et examiner les actions possibles.
        </div>
        ${Array.isArray(stats.lowBalanceUsers) && stats.lowBalanceUsers.length > 0
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
                          <tr class="alert-row" data-q="${encodeURIComponent(`${u.name} ${u.plan} ${u.startDate}`)}">
                          <td><strong>${u.name}</strong> <span class="action-icon">➡️</span></td>
                          <td>${u.plan || "-"}</td>
                          <td>${u.startDate || "-"}</td>
                          <td><strong>${u.remaining}</strong></td>
                        </tr>
                      `).join('')}
                  </tbody>
                </table>
              </div>
            `
          : '<p>Aucune alerte 👍</p>'}
      </div>
    `;

      container.innerHTML = html;
      drawChart(stats.weekly || []);
      drawAbonnementChart(stats.abonnements || {});

      document.querySelectorAll('.alert-row').forEach(row => {
        row.addEventListener('click', () => {
          const code = row.dataset.q;

          const modal = document.createElement("div");
          modal.className = "custom-modal";
          modal.innerHTML = `
            <div class="custom-modal-content">
              <p>🔍 Charger cette fiche dans la page principale ?</p>
              <div class="modal-buttons">
                <button id="confirmGoBtn">✅ Oui</button>
                <button id="cancelGoBtn">❌ Non</button>
              </div>
            </div>
          `;
          document.body.appendChild(modal);

          document.getElementById("confirmGoBtn").onclick = () => {
            window.location.href = `index.html?q=${code}`;
          };
          document.getElementById("cancelGoBtn").onclick = () => {
            modal.remove();
          };
        });
      });

    })
    .catch(error => {
      console.error("Erreur chargement dashboard:", error);
      container.innerHTML = `<p style="color: red;">Erreur lors du chargement du tableau de bord.</p>`;
    });


// === Graphiques ===

let weeklyChartInstance = null;
function drawChart(data) {
  if (!data || data.length === 0 || typeof Chart === 'undefined') return;
  const ctx = document.getElementById("weeklyChart").getContext("2d");

  if (weeklyChartInstance) weeklyChartInstance.destroy();

  weeklyChartInstance = new Chart(ctx, {
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
          font: { weight: 'bold' },
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

let abonnementChartInstance = null;
function drawAbonnementChart(data) {
  const ctx = document.getElementById("abonnementChart").getContext("2d");

  if (abonnementChartInstance) abonnementChartInstance.destroy();

  abonnementChartInstance = new Chart(ctx, {
    type: "pie",
    data: {
      labels: Object.keys(data),
      datasets: [{
        label: "Nombre d’abonnés",
        data: Object.values(data),
        backgroundColor: [
          "#007bff", "#28a745", "#ffc107", "#dc3545", "#6c757d", "#6610f2", "#17a2b8"
        ]
      }]
    },
    options: {
      plugins: {
        legend: { position: 'right' },
        datalabels: {
          color: '#000',
          font: { weight: 'bold' },
          formatter: value => value
        }
      }
    },
    plugins: [ChartDataLabels]
  });
}

});
