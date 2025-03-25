document.addEventListener("DOMContentLoaded", function () {
    const versionDiv = document.getElementById("appVersion");
    const dataContainer = document.getElementById("dataContainer");

    // ✅ Récupération de la version depuis manifest.json
    function fetchVersion() {
        fetch("manifest.json")
            .then(response => response.json())
            .then(data => {
                versionDiv.textContent = "Version: " + data.version;
            })
            .catch(error => console.error("Erreur de récupération de la version:", error));
    }

    // ✅ URL du script Google Apps Script (sera récupéré depuis manifest aussi si besoin)
    const scriptURL = "https://script.google.com/macros/s/AKfycbxqBUT3bkwY2UL_6Gcl7s2fVBN-MQH0wYFzUI1S8ItPeUt3tLf075d9Zs6SIvOO0ZeQ/exec";

    // 📌 Historique des 5 derniers scans
    let lastScans = [];

    // 📸 Initialisation du scanner
    let scanner = new Html5QrcodeScanner("reader", {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA]
    });

    // ✅ Lorsqu'un QR Code est scanné
    function onScanSuccess(qrCodeMessage) {
        console.log("✅ Scan réussi :", qrCodeMessage);

        // Enregistrement dans l’historique
        lastScans.unshift(qrCodeMessage);
        if (lastScans.length > 5) {
            lastScans.pop();
        }

        updateScanHistory();

        // Envoi au Google Sheets
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

        // 🚫 Stopper le scanner après scan
        scanner.clear();
        document.getElementById("scannerContainer").style.display = "none";
    }

    // ✅ Mise à jour de l'affichage des scans
    function updateScanHistory() {
        dataContainer.innerHTML = "";
        if (lastScans.length === 0) {
            dataContainer.innerHTML = "<p>Aucune donnée envoyée.</p>";
            return;
        }

        lastScans.forEach(scan => {
            const p = document.createElement("p");
            p.textContent = scan;
            dataContainer.appendChild(p);
        });
    }

    // ▶️ Lancer le scan
    document.getElementById("startScan").addEventListener("click", () => {
        document.getElementById("scannerContainer").style.display = "block";
        scanner.render(onScanSuccess);
    });

    // ❌ Arrêter le scan
    document.getElementById("stopScan").addEventListener("click", () => {
        scanner.clear();
        document.getElementById("scannerContainer").style.display = "none";
    });

    // ♻️ Recharger l'application (vider le cache)
    document.getElementById("refreshCacheBtn")?.addEventListener("click", () => {
        if ('caches' in window) {
            caches.keys().then(function (names) {
                for (let name of names) {
                    caches.delete(name);
                }
            }).then(() => {
                console.log("✅ Cache vidé !");
                alert("Le cache a été vidé. L'application va se recharger...");
                window.location.reload(true);
            }).catch((err) => {
                console.error("❌ Erreur lors du vidage du cache :", err);
                alert("Erreur lors du vidage du cache.");
            });
        } else {
            alert("Cache non supporté sur ce navigateur.");
        }
    });

    // 🔁 Init version
    fetchVersion();
});
