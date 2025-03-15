// 📌 Version actuelle du script
const VERSION = "1.1.2";
console.log(`🚀 Chargement de app.js - Version ${VERSION}`);

// 📌 URL du Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbz9a6m-fEN6Th4j-o4qtdHhcQi2ZYmB0fU6Ql9owxzhEkqzdS4S35_p1gIbQdio-3i-/exec";

// 📌 Sélection des éléments HTML
const startScanButton = document.getElementById("startScan");
const stopScanButton = document.getElementById("stopScan");
const scannerContainer = document.getElementById("scannerContainer");
const dataContainer = document.getElementById("dataContainer");

// 📌 Initialisation du scanner
let html5QrCode = new Html5Qrcode("reader");
let isScanning = false;

// 📌 Fonction de démarrage du scanner (avec caméra arrière)
function startScanner() {
    console.log("📸 Démarrage du scanner...");
    scannerContainer.style.display = "block";
    
    Html5Qrcode.getCameras()
        .then(devices => {
            if (devices && devices.length) {
                // 📌 Sélectionner la caméra arrière (si disponible)
                let backCamera = devices.find(device => device.label.toLowerCase().includes("back")) || devices[0];
                let cameraId = backCamera.id;
                console.log("✅ Caméra arrière sélectionnée :", backCamera.label);

                html5QrCode.start(
                    cameraId,
                    { fps: 10, qrbox: 250 },
                    onScanSuccess,
                    onScanError
                );
                isScanning = true;
            } else {
                console.error("⚠️ Aucune caméra disponible !");
                alert("Aucune caméra détectée !");
            }
        })
        .catch(err => console.error("⚠️ Erreur lors de la détection des caméras :", err));
}

// 📌 Fonction de scan réussi
function onScanSuccess(qrCodeMessage) {
    console.log("✅ QR Code détecté :", qrCodeMessage);

    // Envoyer les données au Google Sheet
    const formData = new FormData();
    formData.append("data", qrCodeMessage);

    fetch(scriptURL, {
        method: "POST",
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log("✅ Réponse Google Sheet :", data);
        dataContainer.innerHTML = `✅ Données envoyées : ${qrCodeMessage}`;
        alert("📤 Données envoyées avec succès !");
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'envoi des données :", error);
        alert("❌ Erreur lors de l'envoi des données !");
    });

    stopScanner(); // Arrêter le scanner après un scan réussi
}

// 📌 Fonction de gestion des erreurs de scan
function onScanError(errorMessage) {
    console.warn("⚠️ Erreur de scan :", errorMessage);
}

// 📌 Fonction pour arrêter le scanner
function stopScanner() {
    if (isScanning) {
        html5QrCode.stop()
            .then(() => {
                console.log("🛑 Scanner arrêté !");
                scannerContainer.style.display = "none";
                isScanning = false;
            })
            .catch(err => console.error("⚠️ Erreur lors de l'arrêt du scanner :", err));
    }
}

// 📌 Gestion des événements des boutons
startScanButton.addEventListener("click", startScanner);
stopScanButton.addEventListener("click", stopScanner);

// 📌 Afficher la version sur la page
document.getElementById("version").innerText = `Version : ${VERSION}`;

console.log("✅ Script chargé avec succès !");
