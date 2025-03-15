/**
 * 📌 Version : 1.1.0
 * 🚀 Mise à jour :
 * - 🔄 Sélection automatique de la caméra arrière 📷
 * - 📤 Amélioration de l'envoi des données à Google Sheets
 * - 📌 Correction des logs inutiles et erreurs de scan
 */

console.log("🚀 Début du script - Version 1.1.0");

// 🔹 Vérification de l'élément #reader
const readerElement = document.getElementById("reader");
if (!readerElement) {
    console.error("❌ Erreur : L'élément #reader est introuvable !");
} else {
    readerElement.style.display = "block";
    console.log("📸 #reader - Scanner visible");
}

// 🔹 Vérification et accès à la caméra
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        console.log("✅ Accès à la caméra accordé !");
        stream.getTracks().forEach(track => track.stop()); // Fermer la caméra après test
    })
    .catch((error) => {
        console.error("❌ Erreur d'accès à la caméra :", error);
    });

// 🔹 Initialisation du scanner QR Code
console.log("🚀 Initialisation du scanner...");
const scanner = new Html5Qrcode("reader", { 
    supportedScanTypes: [Html5QrcodeScanType.CAMERA] // ✅ Forcer l'utilisation de la caméra
});
console.log("📸 Scanner créé :", scanner);

// 🔹 Fonction pour récupérer la caméra arrière
function getBackCameraId(devices) {
    for (let device of devices) {
        if (device.label.toLowerCase().includes("back")) {
            return device.id; // ✅ Retourne l'ID de la caméra arrière
        }
    }
    return devices.length > 0 ? devices[0].id : null; // Sinon, utiliser la première caméra disponible
}

// 🔹 Attendre la détection des caméras avant de démarrer le scanner
setTimeout(() => {
    console.log("⏳ Attente avant démarrage du scanner...");

    Html5Qrcode.getCameras().then(devices => {
        if (devices.length > 0) {
            const cameraId = getBackCameraId(devices);
            if (!cameraId) {
                console.error("❌ Aucune caméra arrière détectée, utilisation de la caméra par défaut.");
            } else {
                console.log("✅ Caméra arrière détectée :", cameraId);
            }

            // 🔹 Démarrage du scanner avec la caméra arrière
            scanner.start(
                cameraId,
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    console.log("✅ QR Code détecté :", decodedText);
                    alert("✅ QR Code détecté : " + decodedText);
                    
                    // 🔹 Envoyer les données à Google Sheets
                    sendToGoogleSheet(decodedText);
                },
                (errorMessage) => {
                    // 🔹 Filtrer les erreurs pour éviter le spam
                    if (
                        !errorMessage.includes("No barcode or QR code detected") &&
                        !errorMessage.includes("No MultiFormat Readers were able to detect the code")
                    ) {
                        console.warn("⚠️ Erreur de scan :", errorMessage);
                    }
                }
            ).then(() => {
                console.log("📸 Scanner lancé !");
            }).catch(err => {
                console.error("❌ Erreur lors du démarrage du scanner :", err);
            });

        } else {
            console.error("❌ Aucune caméra détectée !");
        }
    }).catch(err => console.error("❌ Erreur lors de la récupération des caméras :", err));

}, 2000);

// 🔹 Fonction pour envoyer les données à Google Sheets
function sendToGoogleSheet(qrCodeMessage) {
    console.log("📤 Envoi des données à Google Sheets...");
    const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec";
    const formData = new FormData();
    formData.append("data", qrCodeMessage);

    fetch(scriptURL, {
        method: "POST",
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log("✅ Réponse Google Sheet :", data);
        alert("📤 Scan envoyé avec succès !");
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'envoi des données :", error);
        alert("❌ Erreur lors de l'envoi des données !");
    });
}
