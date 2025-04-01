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

  let html5QrCode = null;
  let lastScannedCode = null;
  let getURL = "";
  let postURL = "";
  let fromSearch = false;

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


toggleBtn?.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  toggleBtn.textContent = document.body.classList.contains("dark-mode")
    ? "☀️ Mode clair"
    : "🌙 Mode sombre";
});

  
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

        // 🔍 Auto-lancement si ?q= dans l'URL (depuis search.html)
        const urlParams = new URLSearchParams(window.location.search);
        const qParam = urlParams.get("q");
        if (qParam) {
          lastScannedCode = qParam; // ✅ on stocke le code pour pouvoir le réutiliser
          fromSearch = true;
          hideAllButtonSections();
          hide(scannerContainer);
          hide(stopScanButton);
          fetchDataFromGoogleSheet(qParam);

          const searchNotice = document.getElementById("searchNotice");
          if (searchNotice) show(searchNotice);
        }
      })
      .catch(error => {
        console.error("Erreur manifest.json :", error);
        versionDiv.textContent = "Version inconnue";
      });
  }

  function onScanSuccess(decodedText) {
    if (navigator.vibrate) navigator.vibrate(200);
    lastScannedCode = decodedText;
    fromSearch = false;
    if (html5QrCode) {
      html5QrCode.stop().then(() => hide(scannerContainer));
    }
    fetchDataFromGoogleSheet(decodedText);
  }

  function fetchDataFromGoogleSheet(qrData) {
    show(loader);
    resultDiv.innerHTML = "";
    hide(actionsContainer);

    const cacheBuster = `&cacheBust=${Date.now()}`;
    fetch(`${getURL}${encodeURIComponent(qrData)}${cacheBuster}`, {
      cache: "no-store"
    })
      .then(response => response.json())
      .then(data => {
        hide(loader);
        if (data && data.result) {
          let resultHTML = `<strong>Résultat :</strong><br>`;
          if (fromSearch) {
            resultHTML += `<p id="searchNotice" class="subtext">🔍 Résultat issu d'une recherche manuelle</p>`;
          }
          resultHTML += `<table class="result-table"><tbody>`;
          for (let key in data.result) {
            let value = data.result[key];
            let highlight = "";

            if (key.toLowerCase().includes("restants") && !isNaN(value)) {
              const nb = parseInt(value);
              if (nb <= 2) highlight = ' style="color: red; font-weight: bold;"';
              else if (nb <= 5) highlight = ' style="color: orange;"';
            }

            resultHTML += `<tr><th>${key}</th><td${highlight}>${value}</td></tr>`;
          }
          resultHTML += `</tbody></table>`;
          resultDiv.innerHTML = resultHTML;
          resultDiv.classList.add("fade-in");
          setTimeout(() => resultDiv.classList.remove("fade-in"), 500);
          show(actionsContainer);
        } else {
          resultDiv.innerHTML = "Aucune donnée trouvée.";
          showStatusModal("❌ Aucune donnée trouvée.");
        }
      })
      .catch(error => {
        hide(loader);
        resultDiv.innerHTML = "Erreur de récupération des données.";
        console.error("Erreur GET :", error);
        showStatusModal("❌ Erreur lors de la récupération des données.");
      });
  }

  function sendDataToGoogleSheet(scannedData) {
    show(loader);
    resultDiv.innerHTML = "";
    hide(actionsContainer);

    fetch(postURL, {
      method: "POST",
      body: new URLSearchParams({ data: scannedData })
    })
      .then(response => response.json())
      .then(data => {
        if (data.status === "success" || data.status === "ignored") {
          showStatusModal("✅ Cours décompté avec succès !");
          setTimeout(() => fetchDataFromGoogleSheet(scannedData), 1000);
        } else if (data.status === "batch" && Array.isArray(data.results)) {
          const first = data.results[0];
          if (first.status === "success") {
            showStatusModal("✅ " + (first.message || "Opération en lot réussie."));
            setTimeout(() => fetchDataFromGoogleSheet(scannedData), 1000);
          } else {
            showStatusModal("❌ " + (first.message || "Erreur lors du traitement par lot."));
          }
        } else {
          showStatusModal("❌ " + (data.message || "Erreur lors du décompte."));
        }
      })
      .catch(error => {
        hide(loader);
        showStatusModal("❌ Erreur lors de l'envoi des données.");
        console.error("Erreur POST :", error);
      });
  }

  function startScanner() {
    hideAllButtonSections();
    show(scannerContainer);
    resultDiv.innerHTML = "Scan en cours...";
    hide(actionsContainer);
    html5QrCode = new Html5QrCode("reader");
html5QrCode.start(
  { facingMode: "environment" },
  { fps: 10, qrbox: { width: 250, height: 250 } },
  onScanSuccess
).catch(err => {
  console.error("❌ Erreur démarrage scanner:", err);
  showStatusModal("❌ Accès à la caméra refusé ou indisponible.<br><br>Merci de vérifier vos autorisations dans le navigateur.");
  hide(scannerContainer); // on masque le bloc scanner pour éviter un vide
  showAllButtonSections();
});

  }

  function stopScanner() {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        hide(scannerContainer);
        showAllButtonSections();
      });
    }
  }

  function updateOfflineNotice() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        show(offlineNotice);
      } else {
        hide(offlineNotice);
      }
    } else {
      hide(offlineNotice);
    }
  }

  function attachEventListeners() {
    startScanButton.addEventListener("click", startScanner);
    stopScanButton.addEventListener("click", stopScanner);

        const actionSelect = document.getElementById("actionSelect");
        const validateActionBtn = document.getElementById("validateActionBtn");
        
        validateActionBtn.addEventListener("click", () => {
          const selected = actionSelect.value;
        
          if (!lastScannedCode) {
            showStatusModal("❌ Aucune donnée à traiter.");
            return;
          }
        
          if (selected === "decrement") {
            sendDataToGoogleSheet(lastScannedCode);
          } else if (selected === "resend") {
            showStatusModal("📧 Fonction 'Renvoyer le QR code' à implémenter.");
            // TODO : appeler une fonction de renvoi par mail si disponible
          } else if (selected === "sendOffline") {
            showStatusModal("📤 Fonction 'Envoyer le décompte' à implémenter.");
            // TODO : déclencher envoi batch ou action spécifique
          } else {
            showStatusModal("❌ Action non reconnue.");
          }
        });


cancelBtn.addEventListener("click", () => {
  resultDiv.innerHTML = "";
  lastScannedCode = null;
  hide(actionsContainer);
  showAllButtonSections();

  // Nettoie l'URL si ?q=... présent
  if (window.history.replaceState) {
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  // Nettoyage éventuel de stockage si implémenté
  localStorage.removeItem("lastScannedQR");
});
    
refreshCacheBtn?.addEventListener("click", () => {
  if (confirm("♻️ Réinitialiser complètement l'application ? Cela va vider le cache, les données locales et recharger l'application.")) {
    
    // 1. Vider tous les caches PWA
    if ('caches' in window) {
      caches.keys().then(names => {
        return Promise.all(names.map(name => caches.delete(name)));
      }).then(() => {
        console.log("✅ Cache vidé");
      }).catch(err => {
        console.error("❌ Erreur lors du vidage du cache :", err);
      });
    }

    // 2. Vider les données locales
    localStorage.clear();

    // 3. Recharger la page sans paramètres
    const cleanUrl = window.location.origin + window.location.pathname;
    window.location.href = cleanUrl; // reload propre (pas juste reload(true))
  }
});

  }

  fetchManifestAndInit();
});
