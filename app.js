// 🚀 Version de l'application
const APP_VERSION = "1.2.3";
console.log(`🚀 Chargement de l'application - Version ${APP_VERSION}`);

// ✅ URL du script Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbyiwWCwq-lDemCUq58llRQ1lt_qqfT22AVtR37-bM8X0Nr5HN4ypTQH6ps5lfGTZUTP/exec";

// 📌 Stockage des 5 derniers scans
let lastScans = [];

// 📸 Initialisation du scanner avec la caméra arrière
let scanner = new Html5QrcodeScanner("reader", {
    fps: 10,
    qrbox: 250,
    rememberLastUsedCamera: true,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
});

// ✅ Fonction appelée lorsqu'un QR Code est scanné
function onScanSuccess(qrCodeMessage) {
    console.log("✅ Scan réussi :", qrCodeMessage);

    // Ajout à l'historique (max 5 éléments)
    lastScans.unshift(qrCodeMessage);
    if (lastScans.length > 5) {
        lastScans.pop();
    }

    // Mise à jour de l'affichage des scans
    updateScanHistory();

    // Envoi des données au Google Sheet
    fetch(scriptURL, {
        method: "POST",
        body: new URLSearchParams({ data: qrCodeMessage })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Réponse Google Sheet :", data);
        alert("✅ Données envoyées avec succès !");
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'envoi des données :", error);
        alert("❌ Erreur d'envoi !");
    });

    // 🚀 Masquer le scanner après un scan réussi
    scanner.clear();
    document.getElementById("scannerContainer").style.display = "none";
}

// ✅ Fonction pour mettre à jour l'affichage des 5 derniers scans
function updateScanHistory() {
    const dataContainer = document.getElementById("dataContainer");
    dataContainer.innerHTML = ""; // Effacer le contenu actuel

    if (lastScans.length === 0) {
        dataContainer.innerHTML = "<p>Aucune donnée envoyée.</p>";
        return;
    }

    lastScans.forEach(scan => {
        let p = document.createElement("p");
        p.textContent = scan;
        dataContainer.appendChild(p);
    });
}

// ▶️ Démarrer le scanner au clic sur le bouton
document.getElementById("startScan").addEventListener("click", () => {
    document.getElementById("scannerContainer").style.display = "block";
    scanner.render(onScanSuccess);
});

// ❌ Arrêter le scanner
document.getElementById("stopScan").addEventListener("click", () => {
    scanner.clear();
    document.getElementById("scannerContainer").style.display = "none";
});

// ✅ Afficher la version dans la page
document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.createElement("p");
    versionElement.textContent = `Version : ${APP_VERSION}`;
    document.body.appendChild(versionElement);
    console.log("✅ Version affichée :", APP_VERSION);
});
