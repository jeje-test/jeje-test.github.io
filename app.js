console.log("Vérification de Html5QrcodeScanner :", typeof Html5QrcodeScanner);


// Fonction appelée lorsqu'un QR Code est scanné
function onScanSuccess(qrCodeMessage) {
  console.log("✅ Fonction onScanSuccess appelée !");
    console.log("Scan réussi :", qrCodeMessage);
    const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec"; // Remplace par ton URL

    // Construire l'objet JSON à envoyer
    const data = { data: qrCodeMessage };

    // Envoi vers Google Apps Script avec JSON
    fetch(scriptURL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(responseData => {
        console.log("Réponse Google Sheet :", responseData);
        alert("Scan envoyé avec succès !");
    })
    .catch(error => {
        console.error("Erreur lors de l'envoi des données :", error);
        alert("Erreur lors de l'envoi des données !");
    });
}

// Initialisation du scanner QR Code

Html5Qrcode.getCameras().then(devices => {
    if (devices.length > 0) {
        console.log("📸 Caméras détectées :", devices);
    } else {
        console.log("❌ Aucune caméra détectée !");
    }
}).catch(err => {
    console.error("❌ Erreur en détectant la caméra :", err);
});

console.log("🚀 Initialisation du scanner... ");

setTimeout(() => {
    const scanner = new Html5Qrcode("reader");

    scanner.start(
        { facingMode: "environment" }, 
        {
            fps: 5,    
            qrbox: { width: 400, height: 400 }
        },
        (decodedText) => {
            console.log("✅ QR Code détecté :", decodedText);
            alert("QR Code détecté : " + decodedText);
        },
        (errorMessage) => {
            console.warn("⚠️ Erreur de scan :", errorMessage);
        }
    ).catch(err => console.error("❌ Erreur lors du démarrage du scanner :", err));
}, 1000); // Délai de 1 seconde

console.log("🔎 Attente d'un scan...");
