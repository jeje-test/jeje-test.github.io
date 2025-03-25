document.addEventListener("DOMContentLoaded", function () {
  const scannerDiv = document.getElementById("reader");
  const scannerContainer = document.getElementById("scannerContainer");
  const resultDiv = document.getElementById("dataContainer");
  const loader = document.getElementById("loader");
  const versionDiv = document.getElementById("appVersion");
  const confirmationMessage = document.getElementById("confirmationMessage");
  const actionsContainer = document.getElementById("actionsContainer");
  const decrementBtn = document.getElementById("decrementBtn");
  const cancelBtn = document.getElementById("cancelBtn");

  const startScanButton = document.getElementById("startScan");
  const stopScanButton = document.getElementById("stopScan");
  const refreshCacheBtn = document.getElementById("refreshCacheBtn");
  const toggleBtn = document.getElementById("toggleThemeBtn");
  const installBtn = document.getElementById("installBtn");

  let html5QrCode = null;
  let lastScannedCode = null;
  let getURL = "";
  let postURL = "";

  // 📦 Service Worker (PWA)
  if ("serviceWorker" in navigator) {
navigator.serviceWorker.register("service-worker.js")
      .then(() => console.log("✅ Service Worker enregistré"))
      .catch(err => console.error("❌ Erreur SW :", err));
  }

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

  // 🔁 Chargement manifest
  function fetchManifestAndInit() {
    fetch("manifest.json")
      .then(response => response.json())
      .then(data => {
        versionDiv.textContent = "Version: " + data.version;
        getURL = data.scriptURL + "?action=getData&q=";
        postURL = data.scriptURL;
        attachEventListeners();
      })
      .catch(error => {
        console.error("Erreur manifest.json :", error);
        versionDiv.textContent = "Version inconnue";
      });
  }

  // 📸 Scan
  function onScanSuccess(decodedText) {
    console.log("QR Code détecté:", decodedText);
    lastScannedCode = decodedText;

    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        scannerContainer.style.display = "none";
      });
    }

    fetchDataFromGoogleSheet(decodedText);
  }

  function fetchDataFromGoogleSheet(qrData) {
    loader.style.display = "block";
    resultDiv.innerHTML = "";
    actionsContainer.style.display = "none";
    confirmationMessage.style.display = "none";

    fetch(getURL + encodeURIComponent(qrData))
      .then(response => response.json())
      .then(data => {
        loader.style.display = "none";
        if (data && data.result) {
          let resultHTML = `<strong>Résultat :</strong><br><table class="result-table"><tbody>`;
          for (let key in data.result) {
            resultHTML += `<tr><th>${key}</th><td>${data.result[key]}</td></tr>`;
          }
          resultHTML += `</tbody></table>`;
          resultDiv.innerHTML = resultHTML;
          actionsContainer.style.display = "flex";
        } else {
          resultDiv.innerHTML = "Aucune donnée trouvée.";
        }
      })
      .catch(error => {
        loader.style.display = "none";
        resultDiv.innerHTML = "Erreur de récupération des données.";
        console.error("Erreur GET :", error);
      });
  }

  function sendDataToGoogleSheet(scannedData) {
    fetch(postURL, {
      method: "POST",
      body: new URLSearchParams({ data: scannedData })
    })
      .then(response => response.json())
      .then(data => {
        showConfirmationMessage("✅ Donnée envoyée avec succès !");
        actionsContainer.style.display = "none";
      })
      .catch(error => {
        showConfirmationMessage("❌ Erreur lors de l'envoi des données.", false);
        console.error("Erreur POST :", error);
      });
  }

  function showConfirmationMessage(message, success = true) {
    confirmationMessage.textContent = message;
    confirmationMessage.style.display = "block";
    confirmationMessage.style.color = success ? "green" : "red";

    setTimeout(() => {
      confirmationMessage.style.display = "none";
      confirmationMessage.textContent = "";
    }, 4000);
  }

  function startScanner() {
    scannerContainer.style.display = "block";
    resultDiv.innerHTML = "Scan en cours...";
    confirmationMessage.style.display = "none";
    actionsContainer.style.display = "none";

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess
    ).catch(err => console.error("Erreur démarrage scanner:", err));
  }

  function stopScanner() {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        scannerContainer.style.display = "none";
      });
    }
  }

  function attachEventListeners() {
    startScanButton.addEventListener("click", startScanner);
    stopScanButton.addEventListener("click", stopScanner);

    decrementBtn.addEventListener("click", () => {
      if (lastScannedCode) {
        sendDataToGoogleSheet(lastScannedCode);
      } else {
        showConfirmationMessage("Aucune donnée à envoyer.", false);
      }
    });

    cancelBtn.addEventListener("click", () => {
      actionsContainer.style.display = "none";
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
