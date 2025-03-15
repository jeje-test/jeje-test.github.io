console.log("🚀 Début du script");

// Vérifier que Html5Qrcode est bien chargé
if (typeof Html5Qrcode === "undefined") {
    console.error("❌ Erreur : Html5Qrcode non défini !");
} else {
    console.log("✅ Html5Qrcode bien défini !");
}

// Vérifier que l'élément HTML existe
if (document.getElementById("reader")) {
    console.log("✅ Élément #reader trouvé !");
} else {
    console.error("❌ Erreur : L'élément #reader est introuvable !");
}

// Vérifier l'accès à la caméra
navigator.mediaDevices.getUserMedia({ video: true })
    .then((stream) => {
        console.log("✅ Accès à la caméra accordé !");
        stream.getTracks().forEach(track => track.stop()); // Ferme la caméra après le test
    })
    .catch((error) => {
        console.error("❌ Erreur d'accès à la caméra :", error);
    });

// Initialisation du scanner
const scanner = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(devices => {
    if (devices.length > 0) {
        console.log("✅ Caméras détectées :", devices);

        // Lancer le scanner avec la première caméra détectée
        scanner.start(
            devices[0].id, // ID de la caméra
            { fps: 10, qrbox: 250 },
            (decodedText) => {
                console.log("✅ QR Code détecté :", decodedText);
                alert("✅ QR Code détecté : " + decodedText);

                // Envoi des données scannées à Google Sheets
                const scriptURL = "https://script.google.com/macros/s/AKfycbwigngwYHN6bR5pnRIr4wsk8egM2JrFailsv3IFfQYiSTbU-FZUdLFCF-xZudMdvVzS/exec";
                const formData = new FormData();
                formData.append("data", decodedText);

                fetch(scriptURL, {
                    method: "POST",
                    body: formData
                })
                .then(response => response.text())
                .then(data => {
                    console.log("✅ Réponse Google Sheet :", data);
                    alert("📤 Scan envoyé avec succès !");
                })
                .catch(error => {
                    console.error("❌ Erreur lors de l'envoi des données :", error);
                    alert("❌ Erreur lors de l'envoi des données !");
                });

            },
            (errorMessage) => {
                console.warn("⚠️ Erreur de scan :", errorMessage);
            }
        ).catch(err => console.error("❌ Erreur lors du démarrage du scanner :", err));

        console.log("📸 Scanner lancé !");
    } else {
        console.error("❌ Aucune caméra détectée !");
    }
}).catch(err => console.error("❌ Erreur lors de la récupération des caméras :", err));
