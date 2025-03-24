console.log(`🚀 Chargement de l'application - Version ${APP_VERSION}`);

// ✅ URL du script Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbx573h17nUKgmFA1V0iZdDQRXV_V8BpJTeH2oOZY3b9WRwC5xyQlUhEX__pwrjPBq_R/exec";

// 📌 Stockage des 5 derniers scans
let lastScans = [];

// 📸 Initialisation du scanner avec la caméra arrière
let scanner = new Html5QrcodeScanner("reader", {
    fps: 10,
    qrbox: 250,
    rememberLastUsedCamera: true,
    supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
});

// ✅ Fonction appelée lorsqu'un QR Code est scanné
function onScanSuccess(qrCodeMessage) {
    console.log("✅ Scan réussi :", qrCodeMessage);

    // Ajout à l'historique (max 5 éléments)
    lastScans.unshift(qrCodeMessage);
    if (lastScans.length > 5) {
        lastScans.pop();
    }

    // Mise à jour de l'affichage des scans
    updateScanHistory();

    // Envoi des données au Google Sheet
    fetch(scriptURL, {
        method: "POST",
        body: new URLSearchParams({ data: qrCodeMessage })
    })
    .then(response => response.json())
    .then(data => {
        console.log("✅ Réponse Google Sheet :", data);
        alert("✅ Données envoyées avec succès !");
    })
    .catch(error => {
        console.error("❌ Erreur lors de l'envoi des données :", error);
        alert("❌ Erreur d'envoi !");
    });

    // 🚀 Masquer le scanner après un scan réussi
    scanner.clear();
    document.getElementById("scannerContainer").style.display = "none";
}

// ✅ Fonction pour mettre à jour l'affichage des 5 derniers scans
function updateScanHistory() {
    const dataContainer = document.getElementById("dataContainer");
    dataContainer.innerHTML = ""; // Effacer le contenu actuel

    if (lastScans.length === 0) {
        dataContainer.innerHTML = "<p>Aucune donnée envoyée.</p>";
        return;
    }

    lastScans.forEach(scan => {
        let p = document.createElement("p");
        p.textContent = scan;
        dataContainer.appendChild(p);
    });
}

// ▶️ Démarrer le scanner au clic sur le bouton
document.getElementById("startScan").addEventListener("click", () => {
    document.getElementById("scannerContainer").style.display = "block";
    scanner.render(onScanSuccess);
});

// ❌ Arrêter le scanner
document.getElementById("stopScan").addEventListener("click", () => {
    scanner.clear();
    document.getElementById("scannerContainer").style.display = "none";
});


    // Fonction pour récupérer la version
    function fetchVersion() {
        fetch("manifest.json")
            .then(response => response.json())
            .then(data => {
                versionDiv.textContent = "Version: " + data.version;
            })
            .catch(error => console.error("Erreur de récupération de la version:", error));
    }

);
