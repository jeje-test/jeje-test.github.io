document.addEventListener("DOMContentLoaded", () => {
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");
  const resultsContainer = document.getElementById("searchResults");
  const detailContainer = document.getElementById("detailContainer");
  const versionDiv = document.getElementById("appVersion");

  let getURL = "";

  function show(el) {
    el.classList.remove("hidden");
  }

  function hide(el) {
    el.classList.add("hidden");
  }

  toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  toggleBtn.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Mode clair"
    : "🌙 Mode sombre";
});

  function loadVersionAndURL() {
    fetch("manifest.json")
      .then((res) => res.json())
      .then((data) => {
        versionDiv.textContent = "Version: " + data.version;
        getURL = data.scriptURL;
      });
  }

  function buildQuery() {
    const email = document.getElementById("email").value.trim();
    const nom = document.getElementById("nom").value.trim();
    const prenom = document.getElementById("prenom").value.trim();

    if (!email && !nom && !prenom) {
      alert("Veuillez remplir au moins un champ.");
      return null;
    }

    const params = new URLSearchParams();
    if (email) params.append("email", email);
    if (nom) params.append("nom", nom);
    if (prenom) params.append("prenom", prenom);
    params.append("action", "search");

    return params;
  }

  function renderResults(list) {
    if (!list.length) {
      resultsContainer.innerHTML = "Aucun résultat trouvé.";
      return;
    }

    resultsContainer.innerHTML = "<strong>Résultats :</strong><ul>" +
      list.map((item) => {
        const label = `${item.nom} ${item.prenom} - ${item.email || ''}`;
        return `<li><button data-code="${item.code}">${label}</button></li>`;
      }).join("") + "</ul>";

    document.querySelectorAll("#searchResults button").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        showConfirmationModal(code);
      });
    });
  }

  function showConfirmationModal(code) {
    const modal = document.createElement("div");
    modal.className = "modal-overlay";
    modal.innerHTML = `
      <div class="modal-box">
        <p>🔍 Souhaitez-vous afficher cette fiche dans la page principale pour décompter un cours ?</p>
        <div class="modal-actions">
          <button id="confirmRedirect">✅ Oui, aller à l'accueil</button>
          <button id="stayHere">❌ Rester ici</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("confirmRedirect").addEventListener("click", () => {
      window.location.href = `index.html?q=${encodeURIComponent(code)}`;
    });

    document.getElementById("stayHere").addEventListener("click", () => {
      modal.remove();
      fetchDetail(code);
    });
  }`;
    } else {
      fetchDetail(code);
    }
  }

  function fetchDetail(code) {
    detailContainer.innerHTML = "Chargement...";
    hide(resultsContainer);
    show(detailContainer);

    const url = `${getURL}?q=${encodeURIComponent(code)}&cacheBust=${Date.now()}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.result) {
          let html = `<strong>Fiche détaillée :</strong><table class='result-table'><tbody>`;
          for (let key in data.result) {
            const value = data.result[key];
            let highlight = "";
            if (key.toLowerCase().includes("restants") && !isNaN(value)) {
              const nb = parseInt(value);
              if (nb <= 2) highlight = ' style="color: red; font-weight: bold;"';
              else if (nb <= 5) highlight = ' style="color: orange;"';
            }
            html += `<tr><th>${key}</th><td${highlight}>${value}</td></tr>`;
          }
          html += `</tbody></table>`;
          detailContainer.innerHTML = html;
        } else {
          detailContainer.innerHTML = "Aucune fiche trouvée.";
        }
      })
      .catch((err) => {
        detailContainer.innerHTML = "Erreur lors de la récupération.";
        console.error(err);
      });
  }

  searchBtn.addEventListener("click", () => {
    const params = buildQuery();
    if (!params) return;

    resultsContainer.innerHTML = "Recherche en cours...";
    hide(detailContainer);
    show(resultsContainer);

    fetch(`${getURL}?${params.toString()}&cacheBust=${Date.now()}`)
      .then((res) => res.json())
      .then((data) => renderResults(data.results || []))
      .catch((err) => {
        resultsContainer.innerHTML = "Erreur lors de la recherche.";
        console.error(err);
      });
  });

  resetBtn.addEventListener("click", () => {
    document.getElementById("email").value = "";
    document.getElementById("nom").value = "";
    document.getElementById("prenom").value = "";
    resultsContainer.innerHTML = "Aucun résultat pour l'instant.";
    hide(detailContainer);
  });

  loadVersionAndURL();
});
