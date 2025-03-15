console.log("🚀 Début du script");

// Vérifier si Html5QrcodeScanner est bien défini
if (typeof Html5QrcodeScanner === "undefined") {
    console.error("❌ Erreur : La bibliothèque html5-qrcode.min.js n'est pas chargée !");
} else {
    console.log("✅ Bibliothèque Html5QrcodeScanner chargée !");
}

// Vérifier si l'élément HTML existe
if (document.getElementById("reader")) {
    console.log("✅ Élément #reader trouvé !");
} else {
    console.error("❌ Erreur : L'élément #reader est introuvable !");
}

// Initialisation du scanner
console.log("🚀 Initialisation du scanner...");
const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });

console.log("📸 Scanner créé :", scanner);

scanner.render(
    (qrCodeMessage) => {
        console.log("✅ QR Code détecté :", qrCodeMessage);

        // Envoi des données scannées vers Google Sheets
        const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec"; // Remplace par ton lien Google Apps Script
        const formData = new FormData();
        formData.append("data", qrCodeMessage);

        fetch(scriptURL, {
            method: "POST",
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            console.log("✅ Réponse Google Sheet :", data);
            alert("✅ Scan envoyé avec succès !");
        })
        .catch(error => {
            console.error("❌ Erreur lors de l'envoi des données :", error);
            alert("❌ Erreur lors de l'envoi des données !");
        });

    },
    (errorMessage) => {
        console.warn("⚠️ Erreur de scan :", errorMessage);
    }
);

console.log("📸 Scanner lancé !");
