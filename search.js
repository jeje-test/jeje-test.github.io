function doPost(e) {
  try {
    const data = e.parameter;

    // ✅ Traitement du dashboard
    if (data.action === "dashboard") {
      return ContentService.createTextOutput(JSON.stringify(getDashboardStats()))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    // 🎯 Traitement spécifique pour request.html
    if (data.feuille === "Demandes") {
      appendToDemandes(data);
      return ContentService.createTextOutput(JSON.stringify({
        status: "success",
        message: "Requête exceptionnelle enregistrée dans Demandes"
      })).setMimeType(ContentService.MimeType.JSON);
    }

    const rawData = data.data;
    if (!rawData) throw new Error("Aucune donnée reçue.");

    const ss = SpreadsheetApp.openById("1s7Qly-wzkb8XfD8xarlao1UvBALCNBSN1Z_e9bBokSg");
    const sheetFeuille1 = ss.getSheetByName("Feuille1");
    const sheetSuivi = ss.getSheetByName("suivi");

    const horodatage = Utilities.formatDate(new Date(), "Europe/Paris", "dd/MM/yyyy HH:mm:ss");

    if (sheetFeuille1.getLastRow() === 0) {
      sheetFeuille1.appendRow(["Date et heure", "QR Code", "Action", "Résultat"]);
    }

    const lignes = rawData.split(",").map(str => str.trim()).filter(Boolean);
    let results = [];

    for (let line of lignes) {
      let [qrCode, mode] = line.split("|");
      mode = mode || "LIVE";
      let action = `Ajout ${mode === "offline" ? "(OFFLINE)" : ""}`;
      let resultat = "";
      const query = qrCode.trim().toUpperCase();

      // Recherche dans suivi
      const dataSuivi = sheetSuivi.getDataRange().getValues();
      let ligneTrouvée = -1;
      let nouveauCompteur = 0;

      for (let i = 1; i < dataSuivi.length; i++) {
        const ligne = dataSuivi[i];
        const concatCD = (ligne[2] + " " + ligne[3]).trim().toUpperCase();
        const statut = (ligne[11] || "").toString().toUpperCase();

        if (concatCD === query && statut !== "CLOTURE" && statut !== "RESILIE") {
          ligneTrouvée = i + 1;

          // ✅ Mise à jour du suivi
          const cellI = sheetSuivi.getRange(ligneTrouvée, 9);
          const valeurI = parseInt(cellI.getValue()) || 0;
          nouveauCompteur = valeurI + 1;
          cellI.setValue(nouveauCompteur);

          const totalH = parseInt(ligne[7]) || 0;
          sheetSuivi.getRange(ligneTrouvée, 10).setValue(totalH - nouveauCompteur);
          sheetSuivi.getRange(ligneTrouvée, 11).setValue(new Date());

          resultat = `OK (ligne ${ligneTrouvée}, compteur = ${nouveauCompteur})`;
          sheetFeuille1.appendRow([horodatage, qrCode, action, resultat]);
          results.push({ status: "success", message: resultat });
          continue;
        }
      }

      if (ligneTrouvée === -1) {
        action = "Ajout mais suivi non trouvé";
        resultat = "KO (ligne non trouvée)";
        sheetFeuille1.appendRow([horodatage, qrCode, action, resultat]);
        results.push({ status: "not_found", message: resultat });
      }
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: "batch",
      results: results
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: "error",
      message: error.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

function appendToFeuille1(sheet, date, data, action, result) {
  sheet.appendRow([date, data, action, result]);
}

function appendToDemandes(data) {
  const feuille = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Demandes");
  const now = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy HH:mm:ss");
  feuille.appendRow([
    now,
    data.qrCode || '',
    data.nom || '',
    data.prenom || '',
    data.email || '',
    data.raison || '',
    data.commentaire || ''
  ]);
}

function doGet(e) {
  const query = e.parameter.q ? e.parameter.q.trim().toUpperCase() : "";
  const action = e.parameter.action;
  const rawDate = e.parameter.date;

  if (action === "history") {
    if (rawDate) {
      const parsedDate = new Date(rawDate);
      return getHistoryByDate(parsedDate);
    } else {
      return getTodayHistory();
    }
  }

  if (action === "dashboard") {
    return ContentService.createTextOutput(JSON.stringify(getDashboardStats()))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  if (action === "search") {
    const email = (e.parameter.email || "").trim().toLowerCase();
    const nom = (e.parameter.nom || "").trim().toLowerCase();
    const prenom = (e.parameter.prenom || "").trim().toLowerCase();

    if (!email && !nom && !prenom) {
      return ContentService.createTextOutput(JSON.stringify({ results: [] }))
                           .setMimeType(ContentService.MimeType.JSON);
    }

    const sheet = SpreadsheetApp
      .openById("1s7Qly-wzkb8XfD8xarlao1UvBALCNBSN1Z_e9bBokSg")
      .getSheetByName("suivi");
    const data = sheet.getDataRange().getValues();

    const results = data.slice(1).filter(row => {
      const statut = (row[11] || "").toString().toUpperCase();
      if (statut === "CLOTURE" || statut === "RESILIE") return false;

      const rEmail = (row[1] || "").toLowerCase(); // colonne B = index 1
      const rNom = (row[2] || "").toLowerCase();
      const rPrenom = (row[3] || "").toLowerCase();

      return (
        (!email || rEmail.includes(email)) &&
        (!nom || rNom.includes(nom)) &&
        (!prenom || rPrenom.includes(prenom))
      );
    }).map(row => ({
      nom: row[2],
      prenom: row[3],
      email: row[1],
      code: (row[2] + " " + row[3]).trim().toUpperCase()
    }));

    return ContentService.createTextOutput(JSON.stringify({ results }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  const sheet = SpreadsheetApp
    .openById("1s7Qly-wzkb8XfD8xarlao1UvBALCNBSN1Z_e9bBokSg")
    .getSheetByName("suivi");

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  let result = null;

  for (let i = 1; i < data.length; i++) {
    const ligne = data[i];
    const concatCD = (ligne[2] + " " + ligne[3]).trim().toUpperCase();
    const statut = (ligne[11] || "").toString().toUpperCase();

    if (concatCD === query && statut !== "CLOTURE" && statut !== "RESILIE") {
      result = {
        [headers[2]]: ligne[2],
        [headers[3]]: ligne[3],
        [headers[4]]: ligne[4],
        [headers[5]]: formatDateSafe(ligne[5]),
        [headers[6]]: formatDateSafe(ligne[6]),
        [headers[7]]: ligne[7],
        [headers[8]]: ligne[8],
        [headers[9]]: ligne[9],
        [headers[10]]: formatDateSafe(ligne[10]),
        [headers[11]]: ligne[11]
      };
      break;
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ result }))
                       .setMimeType(ContentService.MimeType.JSON);
}

function getTodayHistory() {
  const dateParam = new Date();
  return getHistoryByDate(dateParam);
}

function getHistoryByDate(dateObj) {
  const ss = SpreadsheetApp.openById("1s7Qly-wzkb8XfD8xarlao1UvBALCNBSN1Z_e9bBokSg");
  const feuille1 = ss.getSheetByName("Feuille1");
  const dataFeuille1 = feuille1.getDataRange().getValues();

  const cibleStr = Utilities.formatDate(dateObj, "Europe/Paris", "dd/MM/yyyy");

  const result = dataFeuille1
    .slice(1)
    .map(row => {
      const horodatage = row[0];
      const qrcode = row[1];
      const action = row[2];
      const resultat = row[3];
      const rowDateStr = Utilities.formatDate(new Date(horodatage), "Europe/Paris", "dd/MM/yyyy");

      if (rowDateStr !== cibleStr) return null;

      return {
        date: Utilities.formatDate(new Date(horodatage), "Europe/Paris", "yyyy-MM-dd'T'HH:mm:ss"),
        qrcode: qrcode,
        action: action,
        resultat: resultat
      };
    })
    .filter(item => item !== null)
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function formatDateSafe(value) {
  if (!value) return "";
  try {
    return Utilities.formatDate(new Date(value), "Europe/Paris", "dd/MM/yyyy HH:mm:ss");
  } catch (e) {
    return value;
  }
}

function getDashboardStats() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Feuille1");
  const suiviSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("suivi");

  const todayStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "dd/MM/yyyy");
  const now = new Date();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));

  const data = sheet.getDataRange().getValues().slice(1);
  let countToday = 0;
  let countWeek = 0;
  let weekly = {};

  data.forEach(row => {
    const cellDate = row[0];
    const action = (row[2] || "").toLowerCase();

    if (!cellDate || !action.includes("ajout")) return;

    const entryDate = new Date(cellDate);
    entryDate.setHours(0, 0, 0, 0);

    const dateStr = Utilities.formatDate(entryDate, Session.getScriptTimeZone(), "dd/MM/yyyy");
    const dayEn = Utilities.formatDate(entryDate, Session.getScriptTimeZone(), "EEE");
    const jourFr = {
      Mon: "Lun", Tue: "Mar", Wed: "Mer", Thu: "Jeu",
      Fri: "Ven", Sat: "Sam", Sun: "Dim"
    };
    const dateKey = jourFr[dayEn] || dayEn;

    if (dateStr === todayStr) countToday++;
    if (entryDate >= monday) {
      countWeek++;
      weekly[dateKey] = (weekly[dateKey] || 0) + 1;
    }
  });

  const suiviData = suiviSheet.getDataRange().getValues().slice(1);
  const lowBalanceUsers = [];

  suiviData.forEach(row => {
    const nom = row[2];
    const prenom = row[3];
    const restants = parseFloat(row[9]);
    if (!isNaN(restants) && restants <= 5) {
      lowBalanceUsers.push({ name: `${prenom} ${nom}`, remaining: restants });
    }
  });

  const weekDays = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const weeklyArray = weekDays.map(day => ({
    day,
    count: weekly[day] || 0
  }));

  return {
    today: countToday,
    thisWeek: countWeek,
    total: data.length,
    lowBalanceUsers,
    weekly: weeklyArray
  };
}
