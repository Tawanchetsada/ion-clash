/**
 * Google Apps Script Web App สำหรับรับข้อมูลวิจัย Ion Clash (Phase 9)
 *
 * วิธีติดตั้ง: ดู docs/research-setup.md
 * ห้ามใส่ URL ของ Web App ลงใน git repository สาธารณะ
 */
function doPost(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.getSheetByName("events") || ss.getActiveSheet();
    const d = JSON.parse(e.postData.contents);
    const errors = d.errorsByCode || {};

    sheet.appendRow([
      new Date(),
      d.playerName || "",
      d.installId || "",
      d.levelId || "",
      d.attemptNo || "",
      d.completed === true,
      typeof d.score === "number" ? d.score : 0,
      typeof d.stars === "number" ? d.stars : 0,
      typeof d.elapsedMs === "number" ? d.elapsedMs : 0,
      typeof d.hintsUsed === "number" ? d.hintsUsed : 0,
      typeof d.wrongAttempts === "number" ? d.wrongAttempts : 0,
      errors["E-CHARGE"] || 0,
      errors["E-PAIR"] || 0,
      errors["E-PHASE"] || 0,
      errors["E-BALANCE"] || 0,
      errors["E-RATIO"] || 0,
      errors["E-SPECTATOR"] || 0,
      d.startedAt || "",
      d.finishedAt || "",
    ]);

    return ContentService.createTextOutput(
      JSON.stringify({ status: "ok" }),
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ status: "error", message: String(err) }),
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
