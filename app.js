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
  const statusMessage = document.getElementById("statusMessage");
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
    hide(statusMessage);

    fetch(getURL + encodeURIComponent(qrData))
      .then(response => response.json())
      .then(data => {
        hide(loader);
        if (data && data.result) {
          let resultHTML = `<strong>Résultat :</strong><br><
