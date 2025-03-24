document.addEventListener("DOMContentLoaded", function () {
    const scannerDiv = document.getElementById("reader");
    const scannerContainer = document.getElementById("scannerContainer");
    const resultDiv = document.getElementById("dataContainer");
    const backButton = document.getElementById("backButton");
    const startScanButton = document.getElementById("startScan");
    const stopScanButton = document.getElementById("stopScan");
    const versionDiv = document.getElementById("appVersion");

    const scriptURL = "https://script.google.com/macros/s/AKfycbx573h17nUKgmFA1V0iZdDQRXV_V8BpJTeH2oOZY3b9WRwC5xyQlUhEX__pwrjPBq_R/exec?action=getData&q=";
    let html5QrCode = null;

    // Fonction pour récupérer la version
    function fetchVersion() {
        fetch("manifest.json")
            .then(response => response.json())
            .then(data => {
                versionDiv.textContent = "Version: " + data.version;
            })
            .catch(error => console.error("Erreur de récupération de la version:", error));
    }

    // Fonction après le scan du QR code
    function onScanSuccess(decodedText) {
        console.log(`QR Code détecté: ${decodedText}`);

        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("Scanner arrêté.");
            }).catch(err => console.error("Erreur d'arrêt du scanner:", err));
        }

        scannerContainer.style.display = "none";
        fetchDataFromGoogleSheet(decodedText); // Passer les données du QR Code
    }

    // Fonction pour récupérer les données depuis Google Sheets
    function fetchDataFromGoogleSheet(qrData) {
        fetch(scriptURL + encodeURIComponent(qrData))
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

    // Fonction pour démarrer le scanner
    function startScanner() {
        scannerContainer.style.display = "block";
        resultDiv.innerHTML = "Scan en cours...";

        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },  // Caméra arrière
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
        ).catch(err => console.error("Erreur lors du démarrage du scanner:", err));
    }

    // Fonction pour arrêter le scanner
    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("Scanner arrêté.");
                scannerContainer.style.display = "none";
            }).catch(err => console.error("Erreur d'arrêt du scanner:", err));
        }
    }

    // Récupérer la version de l'app
    fetchVersion();

    // Écouteurs d'événements pour les boutons
    startScanButton.addEventListener("click", startScanner);
    stopScanButton.addEventListener("click", stopScanner);

    // Retour à la page principale
    backButton.addEventListener("click", function () {
        stopScanner();
        setTimeout(() => {
            window.location.href = "index.html";
        }, 300); // Petit délai pour s'assurer que le scanner s'arrête avant de changer de page
    });
});
