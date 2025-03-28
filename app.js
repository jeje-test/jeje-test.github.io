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

  let html5QrCode = null;
  let lastScannedCode = null;
  let getURL = "";
  let postURL = "";

  // 🌓 Thème clair/sombre
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

  // 📲 Installation PWA
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
      })
      .catch(error => {
        console.error("Erreur manifest.json :", error);
        versionDiv.textContent = "Version inconnue";
      });
  }

  function onScanSuccess(decodedText) {
    console.log("QR Code détecté:", decodedText);
    if (navigator.vibrate) navigator.vibrate(200);
    lastScannedCode = decodedText;
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
          let resultHTML = `<strong>Résultat :</strong><br><table class="result-table"><tbody>`;
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
    show(scannerContainer);
    resultDiv.innerHTML = "Scan en cours...";
    hide(actionsContainer);
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess
    ).catch(err => console.error("Erreur démarrage scanner:", err));
  }

  function stopScanner() {
    if (html5QrCode) {
      html5QrCode.stop().then(() => hide(scannerContainer));
    }
  }

  function updateOfflineNotice() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const list = JSON.parse(data);
      if (Array.isArray(list) && list.length > 0) {
        show(offlineNotice);
        show(downloadBtn);
      } else {
        hide(offlineNotice);
        hide(downloadBtn);
      }
    } else {
      hide(offlineNotice);
      hide(downloadBtn);
    }
  }

  downloadBtn?.addEventListener("click", () => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (data.length === 0) return alert("Aucune donnée à exporter.");

    const csvContent = "data:text/csv;charset=utf-8,"
      + data.map((d, i) => `${i + 1};${d.code};${d.timestamp}`).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "historique_offline.csv");
    document.body.appendChild(link);
    link.click();
    link.remove();
  });

  function attachEventListeners() {
    startScanButton.addEventListener("click", startScanner);
    stopScanButton.addEventListener("click", stopScanner);

    decrementBtn.addEventListener("click", () => {
      if (lastScannedCode) {
        sendDataToGoogleSheet(lastScannedCode);
      } else {
        showStatusModal("❌ Aucune donnée à envoyer.");
      }
    });

    cancelBtn.addEventListener("click", () => {
      resultDiv.innerHTML = "";
      hide(actionsContainer);
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
  }

  fetchManifestAndInit();
});
