document.addEventListener("DOMContentLoaded", () => {
    function onScanSuccess(decodedText) {
        document.getElementById("result").innerText = `QR Code: ${decodedText}`;
        sendToGoogleSheet(decodedText);
    }

    new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }).render(onScanSuccess);
});


function sendDataToGoogleSheet(scannedData) {
    const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec"; // Remplace par ton URL
    const formData = new FormData();
    formData.append("data", scannedData);

    fetch(scriptURL, {
        method: "POST",
        body: formData
    })
    .then(response => response.text())
    .then(data => console.log("Réponse Google Sheet :", data))
    .catch(error => console.error("Erreur lors de l'envoi des données :", error));
}

// Enregistrement du Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").then(() => {
        console.log("Service Worker enregistré !");
    });
}

document.getElementById("scanButton").addEventListener("click", () => {
    if (typeof Html5QrcodeScanner !== "undefined") {
        document.getElementById("reader").style.display = "block";
        new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }).render((decodedText) => {
            document.getElementById("result").innerText = `QR Code: ${decodedText}`;
        });
    } else {
        console.error("La bibliothèque Html5QrcodeScanner ne s'est pas chargée !");
    }
});
