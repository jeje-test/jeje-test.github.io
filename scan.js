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
    const confirmationMessage = document.getElementById("confirmationMessage");

    let html5QrCode = null;
    let lastScannedCode = null;
    let getURL = "";
    let postURL = "";

    // Chargement depuis manifest.json (version + URLs)
    function fetchManifestAndInit() {
        fetch("manifest.json")
            .then(response => response.json())
            .then(data => {
                versionDiv.textContent = "Version: " + data.version;

                const scriptBase = data.scriptURL;
                getURL = scriptBase + "?action=getData&q=";
                postURL = scriptBase;

                attachEventListeners(); // Une fois prêt, brancher les boutons
            })
            .catch(error => {
                console.error("Erreur manifest.json :", error);
                versionDiv.textContent = "Version inconnue";
            });
    }

    function onScanSuccess(decodedText) {
        console.log(`QR Code détecté: ${decodedText}`);
        lastScannedCode = decodedText;

        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                scannerContainer.style.display = "none";
            }).catch(err => console.error("Erreur arrêt scanner:", err));
        }

        fetchDataFromGoogleSheet(decodedText);
    }

    function fetchDataFromGoogleSheet(qrData) {
        loader.style.display = "block";
        resultDiv.innerHTML = "";
        actionsContainer.style.display = "none";
        confirmationMessage.style.display = "none";

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
                }
            })
            .catch(error => {
                loader.style.display = "none";
                console.error("Erreur récupération données :", error);
                resultDiv.innerHTML = "Erreur lors de la récupération des données.";
            });
    }

    function sendDataToGoogleSheet(scannedData) {
        fetch(postURL, {
            method: "POST",
            body: new URLSearchParams({ data: scannedData })
        })
        .then(response => response.json())
        .then(data => {
            console.log("✅ Réponse Google Sheet :", data);
            showConfirmationMessage("✅ Donnée envoyée avec succès !");
            actionsContainer.style.display = "none";
        })
        .catch(error => {
            console.error("❌ Erreur d'envoi :", error);
            showConfirmationMessage("❌ Échec de l'envoi des données.", false);
        });
    }

    function showConfirmationMessage(message, success = true) {
        confirmationMessage.textContent = message;
        confirmationMessage.style.display = "block";
        confirmationMessage.style.color = success ? "green" : "red";

        setTimeout(() => {
            confirmationMessage.style.display = "none";
            confirmationMessage.textContent = "";
        }, 4000);
    }

    function startScanner() {
        scannerContainer.style.display = "block";
        resultDiv.innerHTML = "Scan en cours...";
        actionsContainer.style.display = "none";
        confirmationMessage.style.display = "none";

        html5QrCode = new Html5Qrcode("reader");
        html5QrCode.start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 250, height: 250 } },
            onScanSuccess
        ).catch(err => console.error("Erreur démarrage scanner:", err));
    }

    function stopScanner() {
        if (html5QrCode) {
            html5QrCode.stop().then(() => {
                scannerContainer.style.display = "none";
            }).catch(err => console.error("Erreur arrêt scanner:", err));
        }
    }

    function attachEventListeners() {
        startScanButton.addEventListener("click", startScanner);
        stopScanButton.addEventListener("click", stopScanner);

        decrementBtn.addEventListener("click", function () {
            if (lastScannedCode) {
                sendDataToGoogleSheet(lastScannedCode);
            } else {
                showConfirmationMessage("Aucune donnée à envoyer.", false);
            }
        });

        cancelBtn.addEventListener("click", function () {
            actionsContainer.style.display = "none";
        });

        backButton.addEventListener("click", function () {
            if (html5QrCode) {
                html5QrCode.stop().finally(() => {
                    window.location.href = "index.html";
                });
            } else {
                window.location.href = "index.html";
            }
        });
    }

    // Initialisation complète
    fetchManifestAndInit();
});
