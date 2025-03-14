// Fonction appelée lorsqu'un QR Code est scanné
function onScanSuccess(qrCodeMessage) {
    console.log("Scan réussi :", qrCodeMessage); // Vérifier si cette ligne s'affiche

    console.log("Données scannées :", scannedData); // Vérifier si cette ligne s'affiche

    const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec"; // Remplace par ton URL
    const formData = new FormData();
    formData.append("data", scannedData);

    fetch(scriptURL, {
        method: "POST",
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log("Réponse Google Sheet :", data);
        alert("Scan envoyé avec succès !");
    })
    .catch(error => {
        console.error("Erreur lors de l'envoi des données :", error);
        alert("Erreur lors de l'envoi des données !");
    });
}

// Initialisation du scanner QR Code
console.log("Initialisation du scanner...");
var html5QrcodeScanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });

html5QrcodeScanner.render(onScanSuccess);
console.log("Scanner lancé !");



