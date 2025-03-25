// Helpers pour afficher/masquer des éléments
function hide(el) {
  el.classList.add("hidden");
}
function show(el) {
  el.classList.remove("hidden");
}

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
      .then(registration => {
        console.log("✅ Service Worker enregistré");
        registration.addEventListener("updatefound", () => {
          const newWorker = registration.installing;
          newWorker?.addEventListener("statechange", () => {
            if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
              showUpdateBanner();
            }
          });
        });
      })
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

  function showUpdateBanner() {
    const banner = document.getElementById("updateBanner");
    if (banner) banner.style.display = "block";
  }

  // 🔁 Chargement manifest
  function fetchManifestAndInit() {
    fetch("manifest.json")
      .then(response => response.json())
      .then(data => {
        versionDiv.textContent = "Version: " + data.version;
      //  getURL = data.scriptURL + "?action=getData&q=";
        getURL = data.scriptURL + "?q=";

        postURL = data.scriptURL;
        attachEventListeners();
      })
      .catch(error => {
        console.error("Erreur manifest.json :", error);
        versionDiv.textContent = "Version inconnue";
      });
  }

  function onScanSuccess(decodedText) {
    console.log("QR Code détecté:", decodedText);
          // 📳 Vibration si supportée
      if (navigator.vibrate) {
        navigator.vibrate(200);
      }
    lastScannedCode = decodedText;

    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        hide(scannerContainer);
      });
    }

    fetchDataFromGoogleSheet(decodedText);
  }

  function fetchDataFromGoogleSheet(qrData) {
    show(loader);
    resultDiv.innerHTML = "";
    hide(actionsContainer);
    hide(confirmationMessage);

    fetch(getURL + encodeURIComponent(qrData))
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
          resultDiv.classList.add("fade-in"); // 👈 animation
          setTimeout(() => resultDiv.classList.remove("fade-in"), 500);
          show(actionsContainer);
        } else {
          resultDiv.innerHTML = "Aucune donnée trouvée.";
        }
      })
      .catch(error => {
        hide(loader);
        resultDiv.innerHTML = "Erreur de récupération des données.";
        console.error("Erreur GET :", error);
      });
  }

function sendDataToGoogleSheet(scannedData) {
  show(loader);
  resultDiv.innerHTML = "";
  hide(actionsContainer);
  hide(confirmationMessage);

  fetch(postURL, {
    method: "POST",
    body: new URLSearchParams({ data: scannedData })
  })
    .then(response => response.json())
    .then(data => {
      if (data.status === "success" || data.status === "ignored") {
        showConfirmationMessage("✅ Cours décompté et données mises à jour !");
        fetchDataFromGoogleSheet(scannedData);
      } else {
        showConfirmationMessage("❌ " + (data.message || "Erreur."), false);
      }
    })
    .catch(error => {
      hide(loader);
      showConfirmationMessage("❌ Erreur lors de l'envoi des données.", false);
      console.error("Erreur POST :", error);
    });
}


function showConfirmationMessage(message, success = true) {
  console.log("🔔 Notification affichée :", message); // 🔍 Vérif console

  confirmationMessage.textContent = message;
  confirmationMessage.style.color = success ? "green" : "red";
  confirmationMessage.style.display = "block";

  setTimeout(() => {
    confirmationMessage.style.display = "none";
    confirmationMessage.textContent = "";
  }, 4000);
}


  function startScanner() {
    show(scannerContainer);
    resultDiv.innerHTML = "Scan en cours...";
    hide(confirmationMessage);
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
      html5QrCode.stop().then(() => {
        hide(scannerContainer);
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
