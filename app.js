// 🌟 Version : 1.1.0
console.log("🚀 Début du script - Version 1.1.0");

// URL du script Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbyXggS-vyVeLEQd4ymd8nj2NwT2QvCJVX1gB4hzp6ES0UBEy8afoHodg7MfkUjncyr6/exec";

// Vérification de la disponibilité de Html5Qrcode
if (typeof Html5Qrcode === "undefined") {
    console.error("❌ Html5Qrcode non défini !");
} else {
    console.log("✅ Html5Qrcode bien chargé !");
}

// 🎨 Affichage de la version sur la page
document.addEventListener("DOMContentLoaded", function () {
    const versionElement = document.createElement("p");
    versionElement.textContent = "📌 Version : 1.1.0";
    versionElement.style.textAlign = "center";
    versionElement.style.fontWeight = "bold";
    document.body.appendChild(versionElement);
});

// Fonction de scan
function startScanner() {
    console.log("📸 Démarrage du scanner...");
    document.getElementById("scannerContainer").style.display = "block";

    const scanner = new Html5Qrcode("reader");
    const cameraConfig = { fps: 10, qrbox: 250, rememberLastUsedCamera: true };

    Html5Qrcode.getCameras().then(cameras => {
        if (cameras.length > 0) {
            const backCamera = cameras.find(camera => camera.label.toLowerCase().includes("back")) || cameras[0];

            scanner.start(
                backCamera.id,
                cameraConfig,
                qrCodeMessage => {
                    console.log("✅ QR Code détecté :", qrCodeMessage);
                    scanner.stop();
                    sendScanToGoogleSheet(qrCodeMessage);
                },
                errorMessage => {
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
}

// Fonction d'envoi des données scannées à Google Sheets
function sendScanToGoogleSheet(qrCodeData) {
    console.log("📤 Envoi des données :", qrCodeData);
    
    const formData = new FormData();
    formData.append("data", qrCodeData);

    fetch(scriptURL, {
        method: "POST",
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log("✅ Réponse Google Sheet :", data);
        alert("📋 Données envoyées avec succès !");
    })
    .catch(error => {
        console.error("❌ Erreur d'envoi :", error);
        alert("❌ Erreur lors de l'envoi des données !");
    });
}

// Fonction de récupération des données depuis Google Sheets
function fetchDataFromGoogleSheet() {
    console.log("📥 Récupération des données...");

    fetch(scriptURL + "?action=getData")
    .then(response => response.json())
    .then(data => {
        console.log("✅ Données récupérées :", data);

        let tableHTML = "<table border='1'><tr><th>Date</th><th>Donnée</th></tr>";
        data.forEach(row => {
            tableHTML += `<tr><td>${row.date}</td><td>${row.value}</td></tr>`;
        });
        tableHTML += "</table>";

        document.getElementById("dataContainer").innerHTML = tableHTML;
    })
    .catch(error => {
        console.error("❌ Erreur de récupération :", error);
        alert("❌ Erreur lors de la récupération des données !");
    });
}

// Ajout des événements aux boutons
document.getElementById("startScan").addEventListener("click", startScanner);
document.getElementById("fetchData").addEventListener("click", fetchDataFromGoogleSheet);
document.getElementById("stopScan").addEventListener("click", () => {
    document.getElementById("scannerContainer").style.display = "none";
    console.log("❌ Scanner arrêté !");
});
