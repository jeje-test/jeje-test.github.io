document.addEventListener("DOMContentLoaded", function () {
    const scannerDiv = document.getElementById("reader");
    const resultDiv = document.getElementById("dataContainer");
    const backButton = document.getElementById("backButton");
    const versionDiv = document.getElementById("appVersion");
    const scriptURL = "https://script.google.com/macros/s/AKfycbyiwWCwq-lDemCUq58llRQ1lt_qqfT22AVtR37-bM8X0Nr5HN4ypTQH6ps5lfGTZUTP/exec";

    let html5QrCode;

    // 🔹 Récupération et affichage de la version depuis manifest.json
    function fetchVersion() {
        fetch("manifest.json")
            .then(response => response.json())
            .then(data => {
                versionDiv.textContent = "Version: " + data.version;
            })
            .catch(error => console.error("Erreur de récupération de la version:", error));
    }

    // 🔹 Fonction appelée après un scan réussi
    function onScanSuccess(decodedText) {
        console.log(`QR Code détecté: ${decodedText}`);

        // Arrêter le scanner après un scan réussi
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("Scanner arrêté.");
            }).catch(err => console.error("Erreur d'arrêt du scanner:", err));
        }

        // Rechercher les données dans Google Sheets
        fetchDataFromGoogleSheet(decodedText);
    }

    // 🔹 Récupérer les données depuis Google Sheets
    function fetchDataFromGoogleSheet(qrData) {
        fetch(scriptURL + "?q=" + encodeURIComponent(qrData))
            .then(response => response.json())
            .then(data => {
                if (data && data.result) {
                    resultDiv.innerHTML = `<strong>Résultat :</strong><br>
                    🔹 E: ${data.result.E}<br>
                    🔹 F: ${data.result.F}<br>
                    🔹 G: ${data.result.G}<br>
                    🔹 H: ${data.result.H}`;
                } else {
                    resultDiv.innerHTML = "Aucune donnée trouvée.";
                }
            })
            .catch(error => {
                console.error("Erreur lors de la récupération des données :", error);
                resultDiv.innerHTML = "Erreur de récupération des données.";
            });
    }

    // 🔹 Démarrer le scanner QR Code
    function startScanner() {
        scannerDiv.style.display = "block";
        resultDiv.innerHTML = "Scan en cours...";

        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
        ).catch(err => console.error("Erreur lors du démarrage du scanner:", err));
    }

    // Charger la version et démarrer le scanner au chargement de la page
    fetchVersion();
    startScanner();

    // 🔹 Bouton retour vers index.html
    backButton.addEventListener("click", function () {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("Scanner arrêté avant retour.");
                window.location.href = "index.html";
            }).catch(err => console.error("Erreur d'arrêt du scanner:", err));
        } else {
            window.location.href = "index.html";
        }
    });
});
