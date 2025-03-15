console.log("🚀 Début du script 2");

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

// Démarrage du scanner
const scanner = new Html5Qrcode("reader");

scanner.start(
    { facingMode: "environment" }, // Utiliser la caméra arrière du téléphone
    {
        fps: 10,
        qrbox: { width: 250, height: 250 }
    },
    (decodedText) => {
        console.log("✅ QR Code détecté :", decodedText);
        alert("QR Code détecté : " + decodedText);
    },
    (errorMessage) => {
        console.warn("⚠️ Erreur de scan :", errorMessage);
    }
).catch(err => console.error("❌ Erreur lors du démarrage du scanner :", err));

console.log("📸 Scanner lancé !");
