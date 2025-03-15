console.log("🚀 Début du script - Version 1.1.0");

// 📌 URL du script Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbyXggS-vyVeLEQd4ymd8nj2NwT2QvCJVX1gB4hzp6ES0UBEy8afoHodg7MfkUjncyr6/exec";

document.addEventListener("DOMContentLoaded", () => {
    console.log("✅ DOM chargé !");
    
    const startScanBtn = document.getElementById("startScan");
    const stopScanBtn = document.getElementById("stopScan");
    const fetchDataBtn = document.getElementById("fetchData");
    const scannerContainer = document.getElementById("scannerContainer");
    const reader = document.getElementById("reader");
    let html5QrCode;

    // Fonction pour démarrer le scanner
    function startScanner() {
        scannerContainer.style.display = "block";
        console.log("📸 Scanner en cours d'initialisation...");

        html5QrCode = new Html5Qrcode("reader");
        Html5Qrcode.getCameras().then(cameras => {
            if (cameras.length > 0) {
                let backCamera = cameras.find(cam => cam.label.toLowerCase().includes("back")) || cameras[0];
                console.log("✅ Utilisation de la caméra arrière :", backCamera.label);
                html5QrCode.start(
                    backCamera.id,
                    { fps: 10, qrbox: 250 },
                    qrCodeMessage => {
                        console.log("✅ QR Code détecté :", qrCodeMessage);
                        html5QrCode.stop();
                        scannerContainer.style.display = "none";
                        sendDataToSheet(qrCodeMessage);
                    },
                    errorMessage => console.warn("⚠️ Erreur de scan :", errorMessage)
                );
            } else {
                console.error("❌ Aucune caméra détectée !");
            }
        }).catch(err => console.error("⚠️ Erreur lors de la récupération des caméras :", err));
    }

    // Fonction pour envoyer les données au Google Sheet
    function sendDataToSheet(scannedData) {
        console.log("📤 Envoi des données :", scannedData);
        fetch(scriptURL, {
            method: "POST",
            body: new URLSearchParams({ action: "addData", data: scannedData })
        })
        .then(response => response.text())
        .then(responseText => {
            console.log("✅ Réponse Google Sheet :", responseText);
            alert("📋 Données envoyées !");
        })
        .catch(error => console.error("⚠️ Erreur d'envoi :", error));
    }

    // Fonction pour récupérer les données en fonction du QR Code
    function fetchDataFromSheet() {
        scannerContainer.style.display = "block";
        html5QrCode = new Html5Qrcode("reader");
        console.log("📊 Prêt à scanner pour récupérer des données...");

        Html5Qrcode.getCameras().then(cameras => {
            if (cameras.length > 0) {
                let backCamera = cameras.find(cam => cam.label.toLowerCase().includes("back")) || cameras[0];
                console.log("✅ Utilisation de la caméra arrière :", backCamera.label);
                html5QrCode.start(
                    backCamera.id,
                    { fps: 10, qrbox: 250 },
                    scannedData => {
                        console.log("📊 Recherche de :", scannedData);
                        html5QrCode.stop();
                        scannerContainer.style.display = "none";

                        fetch(scriptURL + "?action=getData&data=" + encodeURIComponent(scannedData))
                        .then(response => response.json())
                        .then(data => {
                            console.log("📊 Données récupérées :", data);
                            document.getElementById("dataContainer").innerText = data.length ? JSON.stringify(data, null, 2) : "Aucune donnée trouvée.";
                            startScanner(); // 🔄 Relancer le scanner après récupération
                        })
                        .catch(error => console.error("⚠️ Erreur de récupération :", error));
                    },
                    errorMessage => console.warn("⚠️ Erreur de scan :", errorMessage)
                );
            } else {
                console.error("❌ Aucune caméra détectée !");
            }
        }).catch(err => console.error("⚠️ Erreur lors de la récupération des caméras :", err));
    }

    // 🎯 Événements des boutons
    startScanBtn.addEventListener("click", startScanner);
    fetchDataBtn.addEventListener("click", fetchDataFromSheet);
    stopScanBtn.addEventListener("click", () => {
        if (html5QrCode) html5QrCode.stop();
        scannerContainer.style.display = "none";
    });

    console.log("📸 Scanner prêt !");
});
