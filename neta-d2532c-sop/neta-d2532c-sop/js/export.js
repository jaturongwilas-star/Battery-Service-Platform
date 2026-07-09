/* ============================================================
   Export / Import Module
   Requires: SheetJS (xlsx), jsPDF, html2canvas — loaded via CDN in index.html
   ============================================================ */

function tsForFilename() {
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
}

function libMissingMsg() {
  return currentLang === "th" ? "ไม่สามารถโหลดไลบรารีได้ (ต้องเชื่อมต่ออินเทอร์เน็ต)" : "Could not load library (internet connection required)";
}

/* ---- Export QC records to Excel ---- */
function exportRecordsToExcel(records) {
  if (typeof XLSX === "undefined") { showToast(libMissingMsg()); return; }
  if (!records || records.length === 0) { showToast(t("noRecords")); return; }

  const headerTh = ["วันที่", "รุ่นรถ", "ทะเบียน/VIN", "ผู้ตรวจสอบ", "ขั้นตอน", "แรงดันรวม (V)", "เซลล์สูงสุด (V)", "เซลล์ต่ำสุด (V)", "ΔV (mV)", "คำแนะนำ", "อุณหภูมิ (°C)", "หมายเหตุ"];
  const headerEn = ["Date", "Vehicle", "Plate/VIN", "Technician", "Stage", "Total V", "Highest Cell (V)", "Lowest Cell (V)", "ΔV (mV)", "Recommendation", "Temp (°C)", "Notes"];
  const header = currentLang === "th" ? headerTh : headerEn;

  const rows = records.map(r => {
    const decision = getDecision(r.deltaMv);
    return [
      r.date, r.vehicle, r.plate || "", r.tech || "",
      r.stage === "before" ? t("stageBefore") : t("stageAfter"),
      r.totalV, r.highCell, r.lowCell, r.deltaMv.toFixed(1),
      decision.action[currentLang], r.temp || "", r.notes || ""
    ];
  });

  const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
  ws["!cols"] = header.map(() => ({ wch: 18 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "QC Records");
  XLSX.writeFile(wb, `D2532C_QC_Records_${tsForFilename()}.xlsx`);
  showToast(currentLang === "th" ? "ส่งออก Excel สำเร็จ" : "Excel exported successfully");
}

/* ---- Export reference data (battery DB + parameters) to Excel ---- */
function exportReferenceToExcel() {
  if (typeof XLSX === "undefined") { showToast(libMissingMsg()); return; }
  const wb = XLSX.utils.book_new();

  const wsBattery = XLSX.utils.aoa_to_sheet([BATTERY_TEMPLATE_HEADER, ...getBatteryDB().map(b => [b.brand, b.vehicle, b.chemistry, b.strings, b.modules, b.nominalV, b.capacityAh, b.energyKwh, b.supplier])]);
  XLSX.utils.book_append_sheet(wb, wsBattery, "Battery_Database");

  const paramHeader = ["Vehicle", "Battery Type", "Strings", "Charge A", "Balance Normal A", "Balance Heavy A", "Mode", "Target Cell V", "Charge Voltage V", "Stop ΔV", "Source"];
  const wsParams = XLSX.utils.aoa_to_sheet([paramHeader, ...getParameterSettings().map(p => [p.vehicle, p.batteryType, p.strings, p.chargeA, p.balanceNormalA, p.balanceHeavyA, p.mode, p.targetCellV, p.chargeVoltage, p.stopDeltaV, p.source])]);
  XLSX.utils.book_append_sheet(wb, wsParams, "Parameter_Setting");

  const wsSop = XLSX.utils.aoa_to_sheet([["Step", "Title (TH)", "Detail (TH)", "Title (EN)", "Detail (EN)"], ...SOP_STEPS.map(s => [s.step, s.th.title, s.th.detail, s.en.title, s.en.detail])]);
  XLSX.utils.book_append_sheet(wb, wsSop, "SOP");

  const wsDec = XLSX.utils.aoa_to_sheet([["Range", "Action (TH)", "Action (EN)"], ...DECISION_TABLE.map(d => [d.label, d.action.th, d.action.en])]);
  XLSX.utils.book_append_sheet(wb, wsDec, "Decision");

  XLSX.writeFile(wb, `D2532C_Reference_Data_${tsForFilename()}.xlsx`);
  showToast(currentLang === "th" ? "ส่งออก Excel สำเร็จ" : "Excel exported successfully");
}

/* ---- Download blank/example battery import template ---- */
function downloadBatteryTemplate() {
  if (typeof XLSX === "undefined") { showToast(libMissingMsg()); return; }
  const example = ["NETA", "NETA X Comfort", "LFP", "114S", 6, 365.0, 142, 51.8, "CATL / GOTION"];
  const ws = XLSX.utils.aoa_to_sheet([BATTERY_TEMPLATE_HEADER, example]);
  ws["!cols"] = BATTERY_TEMPLATE_HEADER.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Battery_Template");
  XLSX.writeFile(wb, `D2532C_Battery_Import_Template.xlsx`);
  showToast(currentLang === "th" ? "ดาวน์โหลดเทมเพลตสำเร็จ" : "Template downloaded");
}

/* ---- Import battery database from uploaded Excel file ---- */
function handleBatteryImportFile(file, onDone) {
  if (typeof XLSX === "undefined") { showToast(libMissingMsg()); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, blankrows: false });
      const dataRows = rows.slice(1).filter(r => r && r.length && r[1]);
      if (!dataRows.length) throw new Error("empty");
      const result = importBatteryRows(dataRows);
      showToast(`${t("importSuccess")} — ${tf("importSummary", result)}`);
      if (onDone) onDone(result);
    } catch (err) {
      showToast(t("importFail"));
    }
  };
  reader.onerror = () => showToast(t("importFail"));
  reader.readAsArrayBuffer(file);
}

/* ---- Download blank/example parameter import template ---- */
function downloadParameterTemplate() {
  if (typeof XLSX === "undefined") { showToast(libMissingMsg()); return; }
  const example = ["NETA X Comfort", "LiFePO4", 114, 10, 6, 12, "Pulse", "3.60–3.65", 416.1, "≤3mV", "verified"];
  const ws = XLSX.utils.aoa_to_sheet([PARAMETER_TEMPLATE_HEADER, example]);
  ws["!cols"] = PARAMETER_TEMPLATE_HEADER.map(() => ({ wch: 20 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Parameter_Template");
  XLSX.writeFile(wb, `D2532C_Parameter_Import_Template.xlsx`);
  showToast(currentLang === "th" ? "ดาวน์โหลดเทมเพลตสำเร็จ" : "Template downloaded");
}

/* ---- Import parameter database from uploaded Excel file ---- */
function handleParameterImportFile(file, onDone) {
  if (typeof XLSX === "undefined") { showToast(libMissingMsg()); return; }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result);
      const wb = XLSX.read(data, { type: "array" });
      const firstSheet = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(firstSheet, { header: 1, blankrows: false });
      const dataRows = rows.slice(1).filter(r => r && r.length && r[0]);
      if (!dataRows.length) throw new Error("empty");
      const result = importParameterRows(dataRows);
      showToast(`${t("importSuccess")} — ${tf("importSummary", result)}`);
      if (onDone) onDone(result);
    } catch (err) {
      showToast(t("importFail"));
    }
  };
  reader.onerror = () => showToast(t("importFail"));
  reader.readAsArrayBuffer(file);
}

/* ---- Export any panel to PDF (A4) via jsPDF + html2canvas ---- */
async function exportPanelToPdf(elementId, filenamePrefix) {
  const el = document.getElementById(elementId);
  if (!el) return;
  if (typeof html2canvas === "undefined" || typeof window.jspdf === "undefined") {
    showToast(currentLang === "th" ? "ไม่สามารถโหลดไลบรารี PDF ได้ — ใช้ปุ่มพิมพ์แทนได้" : "Could not load PDF library — try Print instead");
    return;
  }
  showToast(currentLang === "th" ? "กำลังสร้าง PDF..." : "Generating PDF...");

  const canvas = await html2canvas(el, { scale: 2, backgroundColor: "#ffffff", useCORS: true });
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;

  let heightLeft = imgHeight;
  let position = margin;

  pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
  heightLeft -= (pageHeight - margin * 2);

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + margin;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", margin, position, usableWidth, imgHeight);
    heightLeft -= (pageHeight - margin * 2);
  }

  pdf.save(`${filenamePrefix}_${tsForFilename()}.pdf`);
  showToast(currentLang === "th" ? "ส่งออก PDF สำเร็จ" : "PDF exported successfully");
}

let toastTimer = null;
function showToast(msg) {
  let toastEl = document.getElementById("toast");
  if (!toastEl) {
    toastEl = document.createElement("div");
    toastEl.id = "toast";
    toastEl.className = "toast";
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = msg;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 3200);
}
