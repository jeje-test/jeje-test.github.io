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
console.log("Initialisation du scanner... ! ");
var html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });

html5QrcodeScanner.render(onScanSuccess);
console.log("Scanner lancé !");
