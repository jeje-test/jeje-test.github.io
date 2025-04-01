// Helpers pour afficher/masquer des éléments
function hide(el) {
  el.classList.add("hidden");
}

function show(el) {
  el.classList.remove("hidden");
}

document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "offlineQRScans";

  const scannerDiv = document.getElementById("reader");
  const scannerContainer = document.getElementById("scannerContainer");
  const resultDiv = document.getElementById("dataContainer");
  const loader = document.getElementById("loader");
  const versionDiv = document.getElementById("appVersion");
  const actionsContainer = document.getElementById("actionsContainer");
  const decrementBtn = document.getElementById("decrementBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const startScanButton = document.getElementById("startScan");
  const stopScanButton = document.getElementById("stopScan");
  const refreshCacheBtn = document.getElementById("refreshCacheBtn");
  const toggleBtn = document.getElementById("toggleThemeBtn");
  const installBtn = document.getElementById("installBtnFooter");

  const statusModal = document.getElementById("statusModal");
  const statusText = document.getElementById("statusText");
  const closeStatusBtn = document.getElementById("closeStatusBtn");

  const offlineNotice = document.getElementById("offlineNotice");
  const downloadBtn = document.getElementById("downloadOfflineBtn");

  const allButtonSections = document.querySelectorAll(".buttons");
  const resultsContainer = document.getElementById("searchResults");
  const searchBtn = document.getElementById("searchBtn");
  const resetBtn = document.getElementById("resetBtn");
  const detailContainer = document.getElementById("detailContainer");

  let html5QrCode = null;
  let lastScannedCode = null;
  let getURL = "";
  let postURL = "";

  function hideAllButtonSections() {
    allButtonSections.forEach(el => hide(el));
  }

  function showAllButtonSections() {
    allButtonSections.forEach(el => show(el));
  }

  function showStatusModal(message) {
    statusText.textContent = message;
    statusModal.classList.remove("hidden");
    if (navigator.vibrate) navigator.vibrate(100);
  }

  closeStatusBtn.addEventListener("click", () => {
    statusModal.classList.add("hidden");
  });

  function fetchManifestAndInit() {
    fetch("manifest.json")
      .then(response => response.json())
      .then(data => {
        versionDiv.textContent = "Version: " + data.version;
        getURL = data.scriptURL + "?q=";
        postURL = data.scriptURL;
        attachEventListeners();
        updateOfflineNotice();

        const urlParams = new URLSearchParams(window.location.search);
        const qParam = urlParams.get("q");
        if (qParam) {
          hideAllButtonSections();
          hide(scannerContainer);
          fetchDataFromGoogleSheet(qParam);
          lastScannedCode = qParam;
        }
      })
      .catch(error => {
        console.error("Erreur manifest.json :", error);
        versionDiv.textContent = "Version inconnue";
      });
  }

  function renderResults(list) {
    if (!list.length) {
      resultsContainer.innerHTML = "Aucun résultat trouvé.";
      return;
    }

    resultsContainer.innerHTML = "<strong>Résultats :</strong><ul class='choice-list'>" +
      list.map((item) => {
        const label = `${item.nom} ${item.prenom} - ${item.email || ''}`;
        return `<li><button class='choice-btn' data-code="${item.code}">${label}</button></li>`;
      }).join("") + "</ul>";

    document.querySelectorAll(".choice-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const code = btn.getAttribute("data-code");
        showRedirectModal(code);
      });
    });
  }

  function showRedirectModal(code) {
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
      fetchDataFromGoogleSheet(code);
    });
  }

  fetchManifestAndInit();
});
