document.addEventListener("DOMContentLoaded", function () {
    const scannerDiv = document.getElementById("reader");
    const scannerContainer = document.getElementById("scannerContainer");
    const resultDiv = document.getElementById("dataContainer");
    const backButton = document.getElementById("backButton");
    const startScanButton = document.getElementById("startScan");
    const stopScanButton = document.getElementById("stopScan");
    const versionDiv = document.getElementById("appVersion");

    // ✅ URL de ton Google Apps Script (mise à jour)
    const scriptURL = "https://script.google.com/macros/s/AKfycbyiwWCwq-lDemCUq58llRQ1lt_qqfT22AVtR37-bM8X0Nr5HN4ypTQH6ps5lfGTZUTP/exec?action=getData&q=";

    let html5QrCode = null;

    // ✅ Fonction pour récupérer la version depuis manifest.json
    function fetchVersion() {
        fetch("manifest.json")
            .then(response => response.json())
            .then(data => {
                versionDiv.textContent = "Version: " + data.version;
            })
            .catch(error => console.error("❌ Erreur de récupération de la version:", error));
    }

    // ✅ Fonction exécutée après un scan réussi
    function onScanSuccess(decodedText) {
        console.log(`✅ QR Code détecté: ${decodedText}`);

        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("🛑 Scanner arrêté.");
            }).catch(err => console.error("❌ Erreur d'arrêt du scanner:", err));
        }

        scannerContainer.style.display = "none";

        // 🚀 Ajout d’un délai pour éviter les bugs sur certains téléphones
        setTimeout(() => {
            fetchDataFromGoogleSheet(decodedText);
        }, 500);
    }

    // ✅ Fonction pour récupérer les données depuis Google Sheets
    function fetchDataFromGoogleSheet(qrData) {
        fetch(scriptURL + encodeURIComponent(qrData))
            .then(response => response.json())
            .then(data => {
                if (data && data.result && data.result.length > 0) {
                    let output = `<strong>📊 Résultats trouvés :</strong><br>`;
                    data.result.forEach((row, index) => {
                        output += `📌 Ligne ${index + 1}: <br>
                                   🔹 E: ${row.E} <br>
                                   🔹 F: ${row.F} <br>
                                   🔹 G: ${row.G} <br>
                                   🔹 H: ${row.H} <br><hr>`;
                    });
                    resultDiv.innerHTML = output;
                } else {
                    resultDiv.innerHTML = "⚠️ Aucune donnée trouvée.";
                }
            })
            .catch(error => {
                console.error("❌ Erreur lors de la récupération des données :", error);
                resultDiv.innerHTML = "❌ Erreur de récupération des données.";
            });
    }

    // ✅ Fonction pour démarrer le scanner
    function startScanner() {
        scannerContainer.style.display = "block";
        resultDiv.innerHTML = "📡 Scan en cours...";

        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },  // 📸 Utilisation de la caméra arrière
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
        ).catch(err => console.error("❌ Erreur lors du démarrage du scanner:", err));
    }

    // ✅ Fonction pour arrêter le scanner
    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("🛑 Scanner arrêté.");
                scannerContainer.style.display = "none";
            }).catch(err => console.error("❌ Erreur d'arrêt du scanner:", err));
        }
    }

    // ✅ Charger la version
    fetchVersion();

    // 🎯 Ajout des écouteurs d'événements
    startScanButton.addEventListener("click", startScanner);
    stopScanButton.addEventListener("click", stopScanner);

    // 🔙 Bouton retour
    backButton.addEventListener("click", function () {
        stopScanner();
        setTimeout(() => {
            window.location.href = "index.html";
        }, 300); // ⏳ Petit délai pour éviter des bugs
    });
});
