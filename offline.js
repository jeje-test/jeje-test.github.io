document.addEventListener("DOMContentLoaded", function () {
  const scannerContainer = document.getElementById("scannerContainer");
  const reader = document.getElementById("reader");
  const startScanButton = document.getElementById("startScanOffline");
  const stopScanButton = document.getElementById("stopScan");
  const sendButton = document.getElementById("sendOfflineDataBtn");
  const offlineList = document.getElementById("offlineList");
  const loader = document.getElementById("loader");
  const statusModal = document.getElementById("statusModal");
  const statusText = document.getElementById("statusText");
  const closeStatusBtn = document.getElementById("closeStatusBtn");

  let html5QrCode = null;
  let offlineScans = [];
  let postURL = "";

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
        if (!offlineScans.includes(decodedText)) {
          offlineScans.push(decodedText);
          const li = document.createElement("li");
          li.textContent = decodedText;
          offlineList.appendChild(li);
          showStatusModal("✅ QR Code ajouté !");
        } else {
          showStatusModal("⚠️ QR Code déjà scanné.");
        }
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
        offlineScans = [];
        offlineList.innerHTML = "";
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

  fetchManifestURL();
});
