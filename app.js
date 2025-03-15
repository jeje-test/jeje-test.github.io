// 🚀 Version de l'application
const APP_VERSION = "1.2.1"; // Version mise à jour
console.log(`🚀 Chargement de l'application - Version ${APP_VERSION}`);

// ✅ URL du script Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbyiwWCwq-lDemCUq58llRQ1lt_qqfT22AVtR37-bM8X0Nr5HN4ypTQH6ps5lfGTZUTP/exec";

// 📸 Initialisation du scanner (sans autostart)
let scanner;
let isScanning = false; // Permet d'éviter le scan en boucle

// ✅ Fonction appelée lorsqu'un QR Code est scanné
function onScanSuccess(qrCodeMessage) {
    if (!isScanning) return; // Vérifie si le scan est en cours

    isScanning = false; // Désactive le scan après un succès
    console.log("✅ Scan réussi :", qrCodeMessage);

    // Masquer le scanner après un scan réussi
    scanner.clear();
    document.getElementById("scannerContainer").style.display = "none";

    // Envoi des données au Google Sheet
    fetch(scriptURL, {
        method: "POST",
        body: new URLSearchParams({ data: qrCodeMessage })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Réponse Google Sheet :", data);
        document.getElementById("dataContainer").innerHTML = `<p>✅ Données envoyées : ${qrCodeMessage}</p>`;
        alert("✅ Données envoyées avec succès !");
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'envoi des données :", error);
        alert("❌ Erreur d'envoi !");
    });
}

// ▶️ Démarrer le scanner au clic sur le bouton
document.getElementById("startScan").addEventListener("click", () => {
    if (!scanner) {
        scanner = new Html5QrcodeScanner("reader", {
            fps: 10,
            qrbox: 250,
            rememberLastUsedCamera: true,
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
        });
    }
    document.getElementById("scannerContainer").style.display = "block";
    isScanning = true; // Active le scan
    scanner.render(onScanSuccess);
});

// ❌ Arrêter le scanner
document.getElementById("stopScan").addEventListener("click", () => {
    if (scanner) {
        scanner.clear();
    }
    document.getElementById("scannerContainer").style.display = "none";
    isScanning = false; // Désactive le scan
});

// ✅ Afficher la version dans la page
document.addEventListener("DOMContentLoaded", () => {
    const versionElement = document.createElement("p");
    versionElement.id = "appVersion";
    versionElement.textContent = `Version : ${APP_VERSION}`;
    document.body.appendChild(versionElement);
    console.log("✅ Version affichée :", APP_VERSION);
});
