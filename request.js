document.addEventListener("DOMContentLoaded", () => {
  const exceptionForm = document.getElementById('exceptionForm');
  const scannerContainer = document.getElementById('scannerContainer');
  const startScanBtn = document.getElementById('startScan');
  const stopScanBtn = document.getElementById('stopScan');
  const qrInput = document.getElementById('qrCode');
  const nomInput = document.getElementById('nom');
  const prenomInput = document.getElementById('prenom');
  const identityFields = document.getElementById('identityFields');
  const resetBtn = document.getElementById('resetBtn');

  const statusModal = document.getElementById('statusModal');
  const statusText = document.getElementById('statusText');
  const newRequestBtn = document.getElementById('newRequestBtn');

  const submitBtn = document.getElementById('submitBtn');
  const spinner = document.getElementById('loadingSpinner');

  let html5QrcodeScanner;

  function toggleIdentityFields() {
    const hasQR = qrInput.value.trim() !== '';
    identityFields.style.display = hasQR ? 'none' : 'flex';
    nomInput.required = !hasQR;
    prenomInput.required = !hasQR;
  }

  qrInput.addEventListener('input', toggleIdentityFields);

  resetBtn.addEventListener('click', () => {
    setTimeout(() => {
      qrInput.value = '';
      toggleIdentityFields();
    }, 0);
  });

  startScanBtn.addEventListener('click', () => {
    scannerContainer.classList.remove('hidden');
    html5QrcodeScanner = new Html5Qrcode("reader");
    html5QrcodeScanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: 250 },
      (decodedText) => {
        qrInput.value = decodedText;
        toggleIdentityFields();
        html5QrcodeScanner.stop().then(() => {
          html5QrcodeScanner.clear();
          scannerContainer.classList.add('hidden');
        });
      },
      (errorMessage) => {
        console.warn(errorMessage);
      }
    );
  });

  stopScanBtn.addEventListener('click', () => {
    if (html5QrcodeScanner) {
      html5QrcodeScanner.stop().then(() => {
        html5QrcodeScanner.clear();
        scannerContainer.classList.add('hidden');
      });
    }
  });

  exceptionForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    submitBtn.disabled = true;
    spinner.classList.remove('hidden');

    const qr = qrInput.value.trim();
    const nom = nomInput.value.trim();
    const prenom = prenomInput.value.trim();

    if (!qr && (!nom || !prenom)) {
      showStatus("❗ Veuillez remplir soit le QR Code, soit le Nom et le Prénom.");
      resetSubmitUI();
      return;
    }

    const data = {
      feuille: 'Demandes',
      qrCode: qr,
      nom: nom,
      prenom: prenom,
      email: document.getElementById('email').value.trim(),
      raison: document.getElementById('raison').value,
      commentaire: document.getElementById('commentaire').value.trim(),
      token: localStorage.getItem("auth_token") || "" // 🔐 Ajout du token
    };

    const params = new URLSearchParams(data);

    try {
      const manifest = await fetch('manifest.json').then(r => r.json());
      const response = await fetch(manifest.scriptURL, {
        method: 'POST',
        body: params
      });

      const result = await response.json();
      if (result.status === "success") {
        showStatus("✅ Requête enregistrée avec succès !");
        exceptionForm.reset();
        toggleIdentityFields();
      } else {
        showStatus("❌ Erreur : " + result.message);
      }
    } catch (error) {
      console.error(error);
      showStatus("⚠️ Erreur de communication avec le serveur.");
    } finally {
      resetSubmitUI();
    }
  });

  function showStatus(message) {
    statusText.textContent = message;
    statusModal.classList.remove('hidden');
    if (navigator.vibrate) navigator.vibrate(100);
  }

  function resetSubmitUI() {
    submitBtn.disabled = false;
    spinner.classList.add('hidden');
  }

  newRequestBtn.addEventListener('click', () => {
    statusModal.classList.add('hidden');
  });
});
