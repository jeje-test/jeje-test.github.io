document.addEventListener("DOMContentLoaded", function () {
    const scannerDiv = document.getElementById("reader");
    const scannerContainer = document.getElementById("scannerContainer");
    const resultDiv = document.getElementById("dataContainer");
    const backButton = document.getElementById("backButton");
    const startScanButton = document.getElementById("startScan");
    const stopScanButton = document.getElementById("stopScan");
    const versionDiv = document.getElementById("appVersion");
    const loader = document.getElementById("loader");

    const actionsContainer = document.getElementById("actionsContainer");
    const decrementBtn = document.getElementById("decrementBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const getURL = "https://script.google.com/macros/s/AKfycbxqBUT3bkwY2UL_6Gcl7s2fVBN-MQH0wYFzUI1S8ItPeUt3tLf075d9Zs6SIvOO0ZeQ/exec?action=getData&q=";
    const postURL = "https://script.google.com/macros/s/AKfycbxqBUT3bkwY2UL_6Gcl7s2fVBN-MQH0wYFzUI1S8ItPeUt3tLf075d9Zs6SIvOO0ZeQ/exec";

    let html5QrCode = null;
    let lastScannedCode = null;

    // Récupération version de l'app
    function fetchVersion() {
        fetch("manifest.json")
            .then(response => response.json())
            .then(data => {
                versionDiv.textContent = "Version: " + data.version;
            })
            .catch(error => console.error("Erreur de récupération de la version:", error));
    }

    // Après scan réussi
    function onScanSuccess(decodedText) {
        console.log(`QR Code détecté: ${decodedText}`);
        lastScannedCode = decodedText;

        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("Scanner arrêté.");
                scannerContainer.style.display = "none";
            }).catch(err => console.error("Erreur d'arrêt du scanner:", err));
        }

        fetchDataFromGoogleSheet(decodedText);
    }

    // Récupération des infos depuis Google Sheet
    function fetchDataFromGoogleSheet(qrData) {
        loader.style.display = "block";
        resultDiv.innerHTML = "";
        actionsContainer.style.display = "none";

        fetch(getURL + encodeURIComponent(qrData))
            .then(response => response.json())
            .then(data => {
                loader.style.display = "none";
                if (data && data.result) {
                    let resultHTML = `<strong>Résultat :</strong><br><table class="result-table"><tbody>`;
                    for (let key in data.result) {
                        resultHTML += `<tr><th>${key}</th><td>${data.result[key]}</td></tr>`;
                    }
                    resultHTML += `</tbody></table>`;
                    resultDiv.innerHTML = resultHTML;

                    actionsContainer.style.display = "flex";
                    actionsContainer.style.gap = "10px";
                } else {
                    resultDiv.innerHTML = "Aucune donnée trouvée.";
                    actionsContainer.style.display = "none";
                }
            })
            .catch(error => {
                loader.style.display = "none";
                console.error("Erreur lors de la récupération des données :", error);
                resultDiv.innerHTML = "Erreur de récupération des données.";
                actionsContainer.style.display = "none";
            });
    }

    // Envoi de la donnée vers Google Sheet
    function sendDataToGoogleSheet(scannedData) {
        fetch(postURL, {
            method: "POST",
            body: JSON.stringify({ data: scannedData }),
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.text())
        .then(responseText => {
            alert("✅ Donnée envoyée avec succès !");
            actionsContainer.style.display = "none";
        })
        .catch(error => {
            console.error("Erreur lors de l'envoi :", error);
            alert("❌ Échec de l'envoi des données.");
        });
    }

    // Lancer le scanner
    function startScanner() {
        scannerContainer.style.display = "block";
        resultDiv.innerHTML = "Scan en cours...";
        actionsContainer.style.display = "none";

        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
        ).catch(err => console.error("Erreur lors du démarrage du scanner:", err));
    }

    // Arrêter le scanner
    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                console.log("Scanner arrêté.");
                scannerContainer.style.display = "none";
            }).catch(err => console.error("Erreur d'arrêt du scanner:", err));
        }
    }

    // Bouton : Décompter 1 cours
    decrementBtn.addEventListener("click", function () {
        if (lastScannedCode) {
            sendDataToGoogleSheet(lastScannedCode);
        } else {
            alert("Aucune donnée à envoyer.");
        }
    });

    // Bouton : Annuler
    cancelBtn.addEventListener("click", function () {
        actionsContainer.style.display = "none";
    });

    // Boutons de navigation
    startScanButton.addEventListener("click", startScanner);
    stopScanButton.addEventListener("click", stopScanner);

    backButton.addEventListener("click", function () {
        if (html5QrCode) {
            html5QrCode.stop().finally(() => {
                window.location.href = "index.html";
            });
        } else {
            window.location.href = "index.html";
        }
    });

    // Initialisation
    fetchVersion();
});
