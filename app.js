// 📌 Version de l'application
const APP_VERSION = "1.1.1";
document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("version").innerText = "Version : " + APP_VERSION;
});

// 📌 URL du script Google Apps Script
const scriptURL = "https://script.google.com/macros/s/AKfycbyXggS-vyVeLEQd4ymd8nj2NwT2QvCJVX1gB4hzp6ES0UBEy8afoHodg7MfkUjncyr6/exec";

// 📸 Initialisation du scanner QR Code
let scanner = new Html5Qrcode("reader");

// 📌 Fonction de scan et récupération des données
function onScanSuccess(qrCodeMessage) {
    console.log("✅ QR Code détecté :", qrCodeMessage);
    
    // Envoyer la requête à Google Apps Script pour récupérer les données
    fetch(scriptURL, {
        method: "POST",
        body: new URLSearchParams({
            action: "recherche_fiche",
            data: qrCodeMessage
        })
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === "success" && data.results.length > 0) {
            displayData(data.results);
        } else {
            document.getElementById("dataContainer").innerText = "Aucune donnée trouvée.";
        }
        restartScanner(); // Réactiver le scanner
    })
    .catch(error => {
        console.error("⚠️ Erreur lors de la récupération :", error);
        document.getElementById("dataContainer").innerText = "Erreur lors de la récupération des données.";
        restartScanner();
    });
}

// 📌 Fonction pour afficher les données récupérées
function displayData(results) {
    let container = document.getElementById("dataContainer");
    container.innerHTML = "<h3>📊 Résultats trouvés :</h3>";
    let list = document.createElement("ul");
    results.forEach(row => {
        let listItem = document.createElement("li");
        listItem.textContent = row.join(" | "); // Afficher toutes les colonnes
        list.appendChild(listItem);
    });
    container.appendChild(list);
}

// 📌 Démarrer le scanner
function startScanner() {
    document.getElementById("scannerContainer").style.display = "block";
    scanner.start(
        { facingMode: "environment" }, // Utilisation de la caméra arrière
        { fps: 10, qrbox: 250 },
        onScanSuccess,
        errorMessage => console.warn("⚠️ Erreur de scan :", errorMessage)
    )
    .then(() => console.log("📸 Scanner lancé !"))
    .catch(err => console.error("❌ Impossible d'ouvrir la caméra :", err));
}

// 📌 Arrêter le scanner
function stopScanner() {
    scanner.stop().then(() => {
        document.getElementById("scannerContainer").style.display = "none";
        console.log("❌ Scanner arrêté !");
    }).catch(err => console.warn("⚠️ Erreur lors de l'arrêt :", err));
}

// 📌 Redémarrer le scanner après une recherche
function restartScanner() {
    stopScanner();
    setTimeout(startScanner, 1000); // Petite pause avant relancer
}

// 📌 Écouteurs d'événements pour les boutons
document.getElementById("startScan").addEventListener("click", startScanner);
document.getElementById("stopScan").addEventListener("click", stopScanner);
document.getElementById("fetchData").addEventListener("click", startScanner);
