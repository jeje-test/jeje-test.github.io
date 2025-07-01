// Helpers pour afficher/masquer des éléments
function hide(el) {
  el.classList.add("hidden");
}

function show(el) {
  el.classList.remove("hidden");
}

// Clé de stockage du token
const TOKEN_KEY = "myAppToken";

document.addEventListener("DOMContentLoaded", function () {
  const STORAGE_KEY = "offlineQRScans";

  const scannerDiv = document.getElementById("reader");
  const scannerContainer = document.getElementById("scannerContainer");
  const resultDiv = document.getElementById("dataContainer");
  const loader = document.getElementById("loader");
  const actionsContainer = document.getElementById("actionsContainer");
  const cancelBtn = document.getElementById("cancelBtn");

  const startScanButton = document.getElementById("startScan");
  const stopScanButton = document.getElementById("stopScan");

  const statusModal = document.getElementById("statusModal");
  const statusText = document.getElementById("statusText");
  const closeStatusBtn = document.getElementById("closeStatusBtn");

  const offlineNotice = document.getElementById("offlineNotice");
  const allButtonSections = document.querySelectorAll(".buttons");

  let html5QrCode = null;
  let lastScannedCode = null;
  let getURL = "";
  let postURL = "";
  let fromSearch = false;

  function isAdmin() {
    return !!localStorage.getItem(TOKEN_KEY);
  }

  function hideAllButtonSections() {
    allButtonSections.forEach(el => hide(el));
  }

  function showAllButtonSections() {
    allButtonSections.forEach(el => show(el));
  }

  function showStatusModal(message) {
    statusText.innerHTML = message;
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
        getURL = data.scriptURL + "?q=";
        postURL = data.scriptURL;
        attachEventListeners();
        updateOfflineNotice();

        const urlParams = new URLSearchParams(window.location.search);
        const qParam = urlParams.get("q");
        if (qParam) {
          lastScannedCode = qParam;
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
      });

    const scannerStatus = document.getElementById("scannerStatus");
    if (typeof Html5Qrcode === "undefined") {
      scannerStatus.textContent = "❌ Scanner non disponible (librairie manquante)";
      scannerStatus.style.color = "red";
    } else {
      scannerStatus.textContent = "Cliquez sur « Démarrer » pour activer la caméra.";
      scannerStatus.style.color = "black";
    }
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

  function maskEmail(email) {
    if (typeof email !== "string") return "";
    const atIndex = email.indexOf("@");
    if (atIndex === -1) return email;

    const localPart = email.slice(0, atIndex);
    const domainPart = email.slice(atIndex);

    if (localPart.length <= 2) {
      return localPart[0] + '*' + domainPart;
    }

    const first = localPart[0];
    const last = localPart[localPart.length - 1];
    const masked = 'x'.repeat(localPart.length - 2);

    return `${first}${masked}${last}${domainPart}`;
  }

  function fetchDataFromGoogleSheet(qrData) {
    const fieldsToDisplay = {
      nom: "Nom",
      prenom: "Prénom",
      abonnement: "Abonnement",
      dateDebut: "Date de début",
      dateFin: "Date de fin",
      totalCours: "Nombre de cours",
      coursUtilises: "Cours utilisés",
      coursRestants: "Cours Restants",
      dernierScan: "Dernier scan",
      statut: "Statut"
    };

    show(loader);
    resultDiv.innerHTML = "";
    hide(actionsContainer);

    const cacheBuster = `&cacheBust=${Date.now()}`;
    const token = localStorage.getItem(TOKEN_KEY);
    fetch(`${getURL}${encodeURIComponent(qrData)}&token=${encodeURIComponent(token)}${cacheBuster}`, {
      cache: "no-store"
    })
      .then(response => response.json())
      .then(data => {
        hide(loader);
        if (data && data.result) {
          let resultHTML = `<strong>Résultat :</strong><br>`;

          if (data.result.email) {
            const maskedEmail = maskEmail(data.result.email);
            resultHTML += `<p id="email" data-email="${data.result.email}"><strong>Email :</strong> ${maskedEmail}</p>`;
          }

          resultHTML += `<table class="result-table"><tbody>`;
          for (const key in fieldsToDisplay) {
            const label = fieldsToDisplay[key];
            const value = data.result[key];

            if (value !== undefined && value !== "") {
              let highlight = "";

              if (key === "coursRestants" && !isNaN(value)) {
                const nb = parseInt(value);
                if (nb <= 2) highlight = ' style="color: red; font-weight: bold;"';
                else if (nb <= 5) highlight = ' style="color: orange;"';
              }

              resultHTML += `<tr><th>${label}</th><td${highlight} id="${key}">${value}</td></tr>`;
            }
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

  function resendQrCode() {
    show(loader);

    const emailEl = document.getElementById("email");
    const email = emailEl?.dataset?.email || "";
    const nom = document.getElementById("nom")?.textContent?.trim() || "";
    const prenom = document.getElementById("prenom")?.textContent?.trim() || "";
    const abonnement = document.getElementById("abonnement")?.textContent?.trim() || "";
    const dateDebut = document.getElementById("dateDebut")?.textContent?.trim() || "";

    if (!email || !nom || !prenom || !abonnement || !dateDebut) {
      hide(loader);
      showStatusModal("❌ Données manquantes pour renvoyer le QR Code.");
      return;
    }

    const validateActionBtn = document.getElementById("validateActionBtn");
    validateActionBtn.disabled = true;

    const token = localStorage.getItem(TOKEN_KEY);
    fetch(postURL, {
      method: "POST",
      body: new URLSearchParams({
        token,
        action: "renvoyerQRcode",
        email,
        nom,
        prenom,
        abonnement,
        dateDebut
      })
    })
      .then(res => res.json())
      .then(data => {
        hide(loader);
        if (data.status === "success") {
          showStatusModal("📧 " + (data.message || "QR Code renvoyé avec succès !"));
        } else {
          showStatusModal("❌ " + (data.message || "Échec de renvoi du QR Code."));
        }
      })
      .catch(err => {
        hide(loader);
        console.error(err);
        showStatusModal("❌ Erreur lors de l'envoi.");
      })
      .finally(() => {
        document.getElementById("validateActionBtn").disabled = false;
      });
  }

  function resendDetailInformation() {
    show(loader);

    const emailEl = document.getElementById("email");
    const email = emailEl?.dataset?.email || "";
    const nom = document.getElementById("nom")?.textContent?.trim() || "";
    const prenom = document.getElementById("prenom")?.textContent?.trim() || "";
    const abonnement = document.getElementById("abonnement")?.textContent?.trim() || "";
    const dateDebut = document.getElementById("dateDebut")?.textContent?.trim() || "";

    if (!email || !nom || !prenom || !abonnement || !dateDebut) {
      hide(loader);
      showStatusModal("❌ Données manquantes pour renvoyer le détail.");
      return;
    }

    const validateActionBtn = document.getElementById("validateActionBtn");
    validateActionBtn.disabled = true;

    const token = localStorage.getItem(TOKEN_KEY);
    fetch(postURL, {
      method: "POST",
      body: new URLSearchParams({
        token,
        action: "renvoyerDetailDecompte",
        email,
        nom,
        prenom,
        abonnement,
        dateDebut
      })
    })
      .then(res => res.json())
      .then(data => {
        hide(loader);
        if (data.status === "success") {
          showStatusModal("📧 " + (data.message || "Détail envoyé avec succès !"));
        } else {
          showStatusModal("❌ " + (data.message || "Échec de l'envoi du détail."));
        }
      })
      .catch(err => {
        hide(loader);
        console.error(err);
        showStatusModal("❌ Erreur lors de l'envoi.");
      })
      .finally(() => {
        document.getElementById("validateActionBtn").disabled = false;
      });
  }

  function sendDataToGoogleSheet(scannedData) {
    show(loader);
    resultDiv.innerHTML = "";
    hide(actionsContainer);

    const token = localStorage.getItem(TOKEN_KEY);
    fetch(postURL, {
      method: "POST",
      body: new URLSearchParams({ token, data: scannedData, type: "decompte" })
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
    if (typeof Html5Qrcode === "undefined") {
      showStatusModal("❌ Scanner indisponible : librairie non chargée.");
      return;
    }

    hideAllButtonSections();
    show(scannerContainer);
    resultDiv.innerHTML = "Scan en cours...";
    hide(actionsContainer);

    html5QrCode = new Html5Qrcode("reader");
    html5QrCode.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      onScanSuccess
    )
    .then(() => {
      const scannerStatus = document.getElementById("scannerStatus");
      if (scannerStatus) {
        scannerStatus.textContent = "✅ Caméra activée et prête à scanner";
        scannerStatus.style.color = "green";
      }
    })
    .catch(err => {
      console.error("❌ Erreur démarrage scanner:", err);
      showStatusModal("❌ Accès à la caméra refusé ou indisponible.<br><br>Merci de vérifier vos autorisations dans le navigateur.");
      hide(scannerContainer);
      showAllButtonSections();

      const scannerStatus = document.getElementById("scannerStatus");
      if (scannerStatus) {
        scannerStatus.textContent = "⚠️ Scanner non autorisé (caméra bloquée)";
        scannerStatus.style.color = "orange";
      }
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
      switch (selected?.trim()) {
        case "decrement":
          sendDataToGoogleSheet(lastScannedCode);
          break;
        case "resendQrCode":
          resendQrCode();
          break;
        case "resendDetailInformation":
          resendDetailInformation();
          break;
        default:
          showStatusModal(`❌ Action non reconnue : ${selected}`);
          break;
      }
    });

    cancelBtn.addEventListener("click", () => {
      resultDiv.innerHTML = "";
      lastScannedCode = null;
      hide(actionsContainer);
      showAllButtonSections();
      if (window.history.replaceState) {
        const cleanUrl = window.location.origin + window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
      }
      localStorage.removeItem("lastScannedQR");
    });
  }

  fetchManifestAndInit();
});
