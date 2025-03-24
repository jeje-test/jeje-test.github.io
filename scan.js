document.addEventListener("DOMContentLoaded", function () {
    const scannerDiv = document.getElementById("reader");
    const scannerContainer = document.getElementById("scannerContainer");
    const resultDiv = document.getElementById("dataContainer");
    const backButton = document.getElementById("backButton");
    const startScanButton = document.getElementById("startScan");
    const stopScanButton = document.getElementById("stopScan");
    const versionDiv = document.getElementById("appVersion");
    const loader = document.getElementById("loader");

    // Boutons d'action après affichage
    const actionsContainer = document.getElementById("actionsContainer");
    const decrementBtn = document.getElementById("decrementBtn");
    const cancelBtn = document.getElementById("cancelBtn");

    const scriptURL = "https://script.google.com/macros/s/AKfycbxqBUT3bkwY2UL_6Gcl7s2fVBN-MQH0wYFzUI1S8ItPeUt3tLf075d9Zs6SIvOO0ZeQ/exec?action=getData&q=";
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
                scannerContainer.style.display = "none";
            }).catch(err => console.error("Erreur d'arrêt du scanner:", err));
        }

        fetchDataFromGoogleSheet(decodedText); // Passer les données du QR Code
    }

    // Fonction pour récupérer les données depuis Google Sheets avec tableau vertical
    function fetchDataFromGoogleSheet(qrData) {
        loader.style.display = "block"; // Affiche le spinner
        resultDiv.innerHTML = ""; // Nettoie les anciens résultats
        actionsContainer.style.display = "none"; // Cache les boutons par défaut

        fetch(scriptURL + encodeURIComponent(qrData))
            .then(response => response.json())
            .then(data => {
                loader.style.display = "none"; // Cache le spinner
                if (data && data.result) {
                    let resultHTML = `<strong>Résultat :</strong><br><table class="result-table"><tbody>`;
                    for (let key in data.result) {
                        resultHTML += `<tr>
                            <th>${key}</th>
                            <td>${data.result[key]}</td>
                        </tr>`;
                    }
                    resultHTML += `</tbody></table>`;
                    resultDiv.innerHTML = resultHTML;

                    // Afficher les boutons d'action
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

    // Fonction pour démarrer le scanner
    function startScanner() {
        scannerContainer.style.display = "block";
        resultDiv.innerHTML = "Scan en cours...";
        actionsContainer.style.display = "none";

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

    // Événement pour le bouton "Décompter 1 cours"
    decrementBtn.addEventListener("click", function () {
        alert("Décompte de cours à implémenter !");
        actionsContainer.style.display = "none";
    });

    // Événement pour le bouton "Annuler"
    cancelBtn.addEventListener("click", function () {
        actionsContainer.style.display = "none";
    });

    // Récupérer la version de l'app
    fetchVersion();

    // Écouteurs d'événements pour les boutons
    startScanButton.addEventListener("click", startScanner);
    stopScanButton.addEventListener("click", stopScanner);

    // Retour à la page principale (correctif pour arrêter proprement le scanner)
    backButton.addEventListener("click", function () {
        if (html5QrCode) {
            html5QrCode.stop().finally(() => {
                window.location.href = "index.html";
            });
        } else {
            window.location.href = "index.html";
        }
    });
});
