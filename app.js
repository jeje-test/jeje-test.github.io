// 📌 Version du script
const VERSION = "1.1.0";

// 📌 URL du Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec";

document.addEventListener("DOMContentLoaded", function () {
    console.log("🚀 Début du script (Version " + VERSION + ")");

    const startScanBtn = document.getElementById("startScan");
    const stopScanBtn = document.getElementById("stopScan");
    const fetchDataBtn = document.getElementById("fetchData");
    const scannerContainer = document.getElementById("scannerContainer");
    const reader = document.getElementById("reader");
    const dataContainer = document.getElementById("dataContainer");

    let scanner;

    // 🔹 Démarrer le scanner
    startScanBtn.addEventListener("click", function () {
        console.log("📸 Scanner demandé...");
        scannerContainer.style.display = "block";

        scanner = new Html5Qrcode("reader");
        scanner.start(
            { facingMode: "environment" }, // Caméra arrière
            {
                fps: 10,
                qrbox: 250
            },
            (qrCodeMessage) => {
                console.log("✅ QR Code détecté :", qrCodeMessage);
                alert("QR Code détecté : " + qrCodeMessage);

                sendData(qrCodeMessage);
            },
            (errorMessage) => {
                console.warn("⚠️ Erreur de scan :", errorMessage);
            }
        ).then(() => {
            console.log("📸 Scanner lancé !");
        }).catch(err => {
            console.error("❌ Erreur lors du démarrage du scanner :", err);
        });
    });

    // 🔹 Arrêter le scanner
    stopScanBtn.addEventListener("click", function () {
        if (scanner) {
            scanner.stop().then(() => {
                console.log("🛑 Scanner arrêté.");
                scannerContainer.style.display = "none";
            }).catch(err => {
                console.error("❌ Erreur lors de l'arrêt du scanner :", err);
            });
        }
    });

    // 🔹 Fonction pour envoyer les données scannées à Google Sheets
    function sendData(qrCodeMessage) {
        console.log("📤 Envoi des données :", qrCodeMessage);

        fetch(scriptURL, {
            method: "POST",
            body: new URLSearchParams({ data: qrCodeMessage })
        })
        .then(response => response.text())
        .then(data => {
            console.log("✅ Réponse Google Sheets :", data);
            alert("📋 Données envoyées avec succès !");
        })
        .catch(error => {
            console.error("❌ Erreur lors de l'envoi des données :", error);
            alert("❌ Erreur d'envoi !");
        });
    }

    // 🔹 Récupérer les données associées au QR Code
    fetchDataBtn.addEventListener("click", function () {
        const searchValue = prompt("🔎 Entrez la valeur à rechercher (C + D) :");
        if (!searchValue) {
            console.warn("⚠️ Recherche annulée.");
            return;
        }

        console.log("🔍 Recherche des données pour :", searchValue);

        fetch(scriptURL + "?data=" + encodeURIComponent(searchValue))
        .then(response => response.json())
        .then(results => {
            console.log("📊 Données récupérées :", results);
            if (results.length > 0) {
                let content = "<ul>";
                results.forEach(row => {
                    content += `<li>${row.join(" | ")}</li>`;
                });
                content += "</ul>";
                dataContainer.innerHTML = content;
            } else {
                dataContainer.innerHTML = "❌ Aucune donnée trouvée.";
            }
        })
        .catch(error => {
            console.error("❌ Erreur lors de la récupération des données :", error);
            dataContainer.innerHTML = "❌ Erreur lors de la récupération des données.";
        });
    });

});
