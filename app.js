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
      navigator.mediaDevices?.getUserMedia({ video: true })
        .then(() => {
          scannerStatus.textContent = "✅ Scanner prêt";
          scannerStatus.style.color = "green";
        })
        .catch(() => {
          scannerStatus.textContent = "⚠️ Scanner non autorisé (caméra bloquée)";
          scannerStatus.style.color = "orange";
        });
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
  const atIndex = email.indexOf('@');
  if (atIndex === -1) return email; // Si pas d'@, on ne modifie pas l'email.

  const localPart = email.slice(0, atIndex); // Partie avant le "@"
  const domainPart = email.slice(atIndex);   // Partie après le "@"

  const maskedLocal = 'x'.repeat(localPart.length - 2) + localPart.slice(-2); // Masque tout sauf les 2 dernières lettres
  return maskedLocal + domainPart;  // Combine la partie masquée avec le domaine
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
        
        // Masque l'email
        const maskedEmail = maskEmail(data.result.email);

        resultHTML += `<p><strong>Email :</strong> ${maskedEmail}</p>`; // Affiche l'email masqué

        resultHTML += `<table class="result-table"><tbody>`;
        for (let key in data.result) {
          if (key !== "email") { // On évite de doubler l'affichage de l'email
            let value = data.result[key];
            let highlight = "";

            if (key.toLowerCase().includes("restants") && !isNaN(value)) {
              const nb = parseInt(value);
              if (nb <= 2) highlight = ' style="color: red; font-weight: bold;"';
              else if (nb <= 5) highlight = ' style="color: orange;"';
            }

            resultHTML += `<tr><th>${key}</th><td${highlight}>${value}</td></tr>`;
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


// Fonction pour renvoyer le QR Code
function resendQrCode() {
  show(loader);

  const email = document.getElementById("email").textContent.trim();    // Email
  const nom = document.getElementById("nom").textContent.trim();        // Nom
  const prenom = document.getElementById("prenom").textContent.trim();  // Prénom
  const abonnement = document.getElementById("abonnement").textContent.trim(); // Abonnement
  const dateDebut = document.getElementById("dateDebut").textContent.trim();   // Date de début

  // Désactiver le bouton pour éviter plusieurs clics
  const validateActionBtn = document.getElementById("validateActionBtn");
  validateActionBtn.disabled = true;

  // Envoi des données au serveur (Google Apps Script)
  fetch(postURL, {
    method: "POST",
    body: new URLSearchParams({
      action: "renvoyer",  // Action pour appeler la fonction "renvoyer" dans doPost
      email: email,
      nom: nom,
      prenom: prenom,
      abonnement: abonnement,
      dateDebut: dateDebut
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
    showStatusModal("❌ Erreur lors de l'envoi.");
    console.error(err);
  })
  .finally(() => {
    // Réactiver le bouton après la requête
    validateActionBtn.disabled = false;
  });
}





  function sendDataToGoogleSheet(scannedData) {
    show(loader);
    resultDiv.innerHTML = "";
    hide(actionsContainer);

    fetch(postURL, {
      method: "POST",
      body: new URLSearchParams({ data: scannedData, type: "decompte" })
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
    ).catch(err => {
      console.error("❌ Erreur démarrage scanner:", err);
      showStatusModal("❌ Accès à la caméra refusé ou indisponible.<br><br>Merci de vérifier vos autorisations dans le navigateur.");
      hide(scannerContainer);
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
        resendQrCode();  // Envoie les informations pour renvoyer le QR code
      } else if (selected === "sendOffline") {
        showStatusModal("📤 Fonction 'Envoyer le décompte' à implémenter.");
      } else {
        showStatusModal("❌ Action non reconnue.");
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
