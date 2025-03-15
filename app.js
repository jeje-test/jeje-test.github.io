/**
 * 📌 QR Code Scanner App
 * Version : 1.1.1
 * Auteur : [Ton Nom]
 * Mise à jour : 2025-03-14
 */

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Script chargé (Version 1.1.1)");

    const startScanBtn = document.getElementById("startScan");
    const stopScanBtn = document.getElementById("stopScan");
    const fetchDataBtn = document.getElementById("fetchData");
    const scannerContainer = document.getElementById("scannerContainer");
    const dataContainer = document.getElementById("dataContainer");

    let scanner;
    const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec"; // ✅ URL correcte

    // 📸 Démarrer le scanner QR Code
    startScanBtn.addEventListener("click", () => {
        console.log("📸 Démarrage du scanner...");
        scannerContainer.style.display = "block";
        scanner = new Html5Qrcode("reader");

        // 🔍 Récupération des caméras disponibles
        Html5Qrcode.getCameras().then(devices => {
            if (devices.length > 0) {
                // 📷 Sélection de la caméra arrière par défaut
                const backCamera = devices.find(device => device.label.toLowerCase().includes("back")) || devices[0];
                const cameraId = backCamera.id;

                console.log("✅ Caméra sélectionnée :", backCamera.label);

                scanner.start(
                    cameraId,
                    { fps: 10, qrbox: 250 },
                    (decodedText) => {
                        console.log("✅ QR Code détecté :", decodedText);
                        alert("✅ QR Code détecté : " + decodedText);
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
                alert("❌ Aucune caméra détectée !");
            }
        }).catch(err => {
            console.error("❌ Erreur lors de la récupération des caméras :", err);
            alert("❌ Impossible d'accéder aux caméras !");
        });
    });

    // ❌ Arrêter le scanner
    stopScanBtn.addEventListener("click", () => {
        if (scanner) {
            scanner.stop().then(() => {
                console.log("📴 Scanner arrêté !");
                scannerContainer.style.display = "none";
            }).catch(err => console.error("❌ Erreur lors de l'arrêt du scanner :", err));
        }
    });

    // 📤 Envoyer les données à Google Sheets
    function sendToGoogleSheet(qrCodeMessage) {
        console.log("📤 Envoi des données à Google Sheets...");
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

    // 📊 Récupérer les données de Google Sheets
    fetchDataBtn.addEventListener("click", () => {
        console.log("📥 Récupération des données...");
        fetch(`${scriptURL}?action=getData`)
            .then(response => response.json())
            .then(data => {
                console.log("✅ Données reçues :", data);
                dataContainer.innerHTML = data.length ? data.map(row => `<p>${row}</p>`).join("") : "Aucune donnée trouvée.";
            })
            .catch(error => {
                console.error("❌ Erreur lors de la récupération des données :", error);
                dataContainer.innerHTML = "❌ Erreur lors de la récupération des données.";
            });
    });
});
