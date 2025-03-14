document.addEventListener("DOMContentLoaded", () => {
    function onScanSuccess(decodedText) {
        document.getElementById("result").innerText = `QR Code: ${decodedText}`;
        sendToGoogleSheet(decodedText);
    }

    new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 }).render(onScanSuccess);
});

function sendToGoogleSheet(data) {
    fetch("https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData: data })
    })
    .then(response => response.json())
    .then(result => console.log(result))
    .catch(error => console.error("Erreur:", error));
}

// Enregistrement du Service Worker
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("service-worker.js").then(() => {
        console.log("Service Worker enregistré !");
    });
}
