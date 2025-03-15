// 🚀 Version de l'application
const APP_VERSION = "1.2.0";
console.log(`🚀 Chargement de l'application - Version ${APP_VERSION}`);

// ✅ URL du script Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbyiwWCwq-lDemCUq58llRQ1lt_qqfT22AVtR37-bM8X0Nr5HN4ypTQH6ps5lfGTZUTP/exec";

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

    // 🚀 Relancer automatiquement le scanner après l'envoi
    setTimeout(() => scanner.render(onScanSuccess), 2000);
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
