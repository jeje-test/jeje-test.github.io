const exceptionForm = document.getElementById('exceptionForm');
const scannerContainer = document.getElementById('scannerContainer');
const startScanBtn = document.getElementById('startScan');
const stopScanBtn = document.getElementById('stopScan');
const qrInput = document.getElementById('qrCode');
const nomInput = document.getElementById('nom');
const prenomInput = document.getElementById('prenom');
const identityFields = document.getElementById('identityFields');
const resetBtn = document.getElementById('resetBtn');
let html5QrcodeScanner;

function toggleIdentityFields() {
  if (qrInput.value.trim() !== '') {
    identityFields.style.display = 'none';
    nomInput.required = false;
    prenomInput.required = false;
  } else {
    identityFields.style.display = 'flex';
    nomInput.required = true;
    prenomInput.required = true;
  }
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
  if (qrInput.value.trim() === '' && (nomInput.value.trim() === '' || prenomInput.value.trim() === '')) {
    alert('Veuillez remplir soit le QR Code, soit le Nom et le Prénom.');
    e.preventDefault();
  } else {
    const data = {
      qrCode: qrInput.value.trim(),
      nom: nomInput.value.trim(),
      prenom: prenomInput.value.trim(),
      email: document.getElementById('email').value.trim(),
      raison: document.getElementById('raison').value,
      commentaire: document.getElementById('commentaire').value.trim(),
    };

    try {
      const manifest = await fetch('manifest.json').then(r => r.json());
      const response = await fetch(manifest.scriptURL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feuille: 'Requêtes', ...data })
      });

      const result = await response.json();
      if (result.success) {
        alert('Formulaire soumis avec succès !');
        exceptionForm.reset();
        toggleIdentityFields();
      } else {
        alert('Erreur lors de l’envoi : ' + result.message);
      }
    } catch (error) {
      alert('Erreur de communication avec le serveur.');
      console.error(error);
    }
  }
});

toggleIdentityFields();
