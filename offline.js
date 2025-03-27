document.addEventListener("DOMContentLoaded", function () {
  const scannerContainer = document.getElementById("scannerContainer");
  const reader = document.getElementById("reader");
  const startScanButton = document.getElementById("startScanOffline");
  const stopScanButton = document.getElementById("stopScan");
  const sendButton = document.getElementById("sendOfflineDataBtn");
  const resetButton = document.getElementById("resetOfflineListBtn");
  const offlineList = document.getElementById("offlineList");
  const loader = document.getElementById("loader");
  const statusModal = document.getElementById("statusModal");
  const statusText = document.getElementById("statusText");
  const closeStatusBtn = document.getElementById("closeStatusBtn");
  const pendingNotice = document.getElementById("pendingNotice");

  let html5QrCode = null;
  let offlineScans = [];
  let postURL = "";

  const STORAGE_KEY = "offlineQRScans";

  function show(el) {
    el.classList.remove("hidden");
  }

  function hide(el) {
    el.classList.add("hidden");
  }

  function showStatusModal(message) {
    statusText.textContent = message;
    show(statusModal);
    if (navigator.vibrate) navigator.vibrate(100);
  }

  function updatePendingNotice() {
    if (offlineScans.length > 0) {
      show(pendingNotice);
    } else {
      hide(pendingNotice);
    }
  }

  function saveOfflineScans() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(offlineScans));
    updatePendingNotice();
  }

  function loadOfflineScans() {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      offlineScans = JSON.parse(data);
      renderOfflineList();
      updatePendingNotice();
    }
  }

  function clearOfflineScans() {
    offlineScans = [];
    localStorage.removeItem(STORAGE_KEY);
    renderOfflineList();
    updatePendingNotice();
  }

  function renderOfflineList() {
    offlineList.innerHTML = "";
    offlineScans.forEach((code, index) => {
      const li = document.createElement("li");
      li.textContent = `${index + 1}. ${code}`;
      offlineList.appendChild(li);
    });
    updatePendingNotice();
  }

  closeStatusBtn.addEventListener("click", () => {
    hide(statusModal);
  });

  function startScanner() {
    show(scannerContainer);
    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        offlineScans.push(decodedText);
        saveOfflineScans();
        renderOfflineList();
        showStatusModal("✅ QR Code ajouté !");
      }
    ).catch(err => {
      console.error("Erreur démarrage scanner:", err);
      showStatusModal("❌ Impossible de démarrer le scanner.");
    });
  }

  function stopScanner() {
    if (html5QrCode) {
      html5QrCode.stop().then(() => {
        hide(scannerContainer);
      });
    }
  }

  function sendOfflineData() {
    if (offlineScans.length === 0) {
      showStatusModal("❌ Aucun QR Code à envoyer.");
      return;
    }

    show(loader);

    const requests = offlineScans.map(code => {
      return fetch(postURL, {
        method: "POST",
        body: new URLSearchParams({ data: code + "|offline" })
      }).then(res => res.json());
    });

    Promise.all(requests)
      .then(results => {
        hide(loader);
        const ok = results.filter(r => r.status === "success").length;
        showStatusModal(`✅ ${ok} envois réussis.`);
        clearOfflineScans();
      })
      .catch(err => {
        hide(loader);
        console.error("Erreur envoi :", err);
        showStatusModal("❌ Erreur lors de l'envoi des données.");
      });
  }

  function fetchManifestURL() {
    fetch("manifest.json")
      .then(res => res.json())
      .then(data => {
        postURL = data.scriptURL;
      })
      .catch(err => {
        console.error("Erreur chargement manifest.json :", err);
        showStatusModal("❌ Erreur chargement configuration.");
      });
  }

  startScanButton.addEventListener("click", startScanner);
  stopScanButton.addEventListener("click", stopScanner);
  sendButton.addEventListener("click", sendOfflineData);
  resetButton.addEventListener("click", () => {
    if (confirm("⚠️ Réinitialiser la liste des scans ?")) {
      clearOfflineScans();
      showStatusModal("🗑️ Liste réinitialisée.");
    }
  });

  fetchManifestURL();
  loadOfflineScans();
});
