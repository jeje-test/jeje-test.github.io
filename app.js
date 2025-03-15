console.log("🚀 Début du script");

// Vérification si BarcodeDetector est supporté
if (!("BarcodeDetector" in window)) {
    console.error("❌ BarcodeDetector n'est pas supporté par ce navigateur !");
} else {
    console.log("✅ BarcodeDetector est bien supporté !");
}

// Vérification de l'accès à la caméra
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        console.log("✅ Accès à la caméra accordé !");
        stream.getTracks().forEach(track => track.stop()); // Fermer la caméra après le test
    })
    .catch((error) => {
        console.error("❌ Erreur d'accès à la caméra :", error);
    });

// Vérification de l'élément #reader
const readerElement = document.getElementById("reader");
if (readerElement) {
    const style = window.getComputedStyle(readerElement);
    console.log("📸 #reader - Display:", style.display, "Visibility:", style.visibility);
} else {
    console.error("❌ Erreur : L'élément #reader est introuvable !");
}

// Initialisation du scanner QR Code
console.log("🚀 Initialisation du scanner...");
const scanner = new Html5Qrcode("reader", { 
    supportedScanTypes: [Html5QrcodeScanType.CAMERA] // Forcer l'utilisation de la caméra
});

console.log("📸 Scanner créé :", scanner);

// Attendre que la caméra soit prête avant de lancer le scanner
setTimeout(() => {
    console.log("⏳ Attente avant démarrage du scanner...");
    
    Html5Qrcode.getCameras().then(devices => {
        if (devices.length > 0) {
            console.log("✅ Caméras détectées :", devices);

            scanner.start(
                devices[0].id,
                { fps: 10, qrbox: 250 },
                (decodedText) => {
                    console.log("✅ QR Code détecté :", decodedText);
                    alert("✅ QR Code détecté : " + decodedText);
                    
                    // Envoyer les données à Google Sheets
                    sendToGoogleSheet(decodedText);
                },
                (errorMessage) => {
                    console.warn("⚠️ Erreur de scan :", errorMessage);
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

// Fonction pour envoyer les données à Google Sheets
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
