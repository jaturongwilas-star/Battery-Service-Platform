/* ============================================================
   D2532C SOP System — Data Module
   NETA EV Battery Pack Balancer / Analyzer (D2532C)
   Source: D2532C_Manual.pdf + NETA_D2532C_SOP_Standard.xlsx
           + EV_Battery_Specs_Thailand.xlsx (HV battery database)
   ============================================================ */

const DEVICE_INFO = {
  model: "D2532C",
  name: {
    th: "เครื่องวิเคราะห์และปรับสมดุลแบตเตอรี่ EV รุ่น D2532C",
    en: "EV Battery Pack Analyzer & Balancer — D2532C"
  },
  desc: {
    th: "อุปกรณ์จำลอง/วิเคราะห์แรงดันเซลล์แบตเตอรี่ 96–128 สตริง พร้อมฟังก์ชันปรับสมดุลเซลล์ (Cell Balancing) แบบ Pulse และ Continuous สำหรับรถยนต์ไฟฟ้า NETA",
    en: "Multi-string (96–128S) EV battery cell voltage analyzer with Pulse and Continuous cell-balancing functions, used for NETA EV service."
  }
};

const COMPANY_INFO = {
  name: { th: "P&K New Energy Service Center", en: "P&K New Energy Service Center" },
  tagline: { th: "ศูนย์บริการยานยนต์ไฟฟ้า — ระบบแรงดันสูง (HV)", en: "EV Service Center — High Voltage (HV) Systems" }
};

/* ============================================================
   Battery Database (HV) — multi-brand reference
   Source: EV_Battery_Specs_Thailand.xlsx (Thailand market)
   Editable at runtime via Excel import (see BATTERY_STORAGE_KEY)
   ============================================================ */
const BATTERY_STORAGE_KEY = "pk_d2532c_battery_custom";

const DEFAULT_BATTERY_DB = [
  { brand: "NETA", vehicle: "NETA V1 Gen1", chemistry: "NMC", strings: "96S", modules: 16, nominalV: 350.4, capacityAh: 110, energyKwh: 38.5, supplier: "CATL / Volt Standard" },
  { brand: "NETA", vehicle: "NETA V1 Gen2", chemistry: "LFP", strings: "112S", modules: 4, nominalV: 353.9, capacityAh: 115, energyKwh: 40.7, supplier: "SVOLT / EVE" },
  { brand: "NETA", vehicle: "NETA V2 (V-II)", chemistry: "LFP", strings: "112S", modules: 4, nominalV: 358.4, capacityAh: 104, energyKwh: 36.1, supplier: "SVOLT" },
  { brand: "NETA", vehicle: "NETA X Comfort", chemistry: "LFP", strings: "114S", modules: 6, nominalV: 365.0, capacityAh: 142, energyKwh: 51.8, supplier: "CATL / GOTION" },
  { brand: "NETA", vehicle: "NETA X Smart", chemistry: "LFP", strings: "128S", modules: 4, nominalV: 400.0, capacityAh: 151.4, energyKwh: 62.0, supplier: "CATL / GOTION" },
  { brand: "MG", vehicle: "MG EP / MG EP Plus", chemistry: "LFP", strings: "112S", modules: 4, nominalV: 358.4, capacityAh: 140, energyKwh: 50.3, supplier: "CATL-SAIC" },
  { brand: "MG", vehicle: "MG4 EV (D Standard)", chemistry: "LFP", strings: "104S", modules: 4, nominalV: 332.8, capacityAh: 150, energyKwh: 49.0, supplier: "CATL-SAIC (One Pack Technology)" },
  { brand: "MG", vehicle: "MG4 EV (X Long Range / XPOWER)", chemistry: "NMC", strings: "104S", modules: 4, nominalV: 374.4, capacityAh: 171, energyKwh: 64.0, supplier: "CATL-SAIC" },
  { brand: "MG", vehicle: "MG ZS EV (Facelift 50.3kWh)", chemistry: "LFP", strings: "108S", modules: 18, nominalV: 345.6, capacityAh: 145, energyKwh: 50.3, supplier: "CATL-SAIC" },
  { brand: "MG", vehicle: "MG MAXUS 9", chemistry: "NMC", strings: "108S", modules: 6, nominalV: 399.6, capacityAh: 225, energyKwh: 90.0, supplier: "CATL-SAIC" },
  { brand: "GAC AION", vehicle: "AION Y Plus 490 Elite", chemistry: "LFP", strings: "108S", modules: 4, nominalV: 345.6, capacityAh: 142, energyKwh: 49.8, supplier: "CALB / Sunwoda" },
  { brand: "GAC AION", vehicle: "AION Y Plus 500 Premium", chemistry: "LFP", strings: "112S", modules: 4, nominalV: 358.4, capacityAh: 175, energyKwh: 63.2, supplier: "GAC Magazine Battery" },
  { brand: "GAC AION", vehicle: "AION Y Plus 610 Ultra", chemistry: "NMC", strings: "96S", modules: 6, nominalV: 352.3, capacityAh: 218, energyKwh: 76.8, supplier: "CALB Magazine Battery" },
  { brand: "GAC AION", vehicle: "AION ES (Taxi / Fleet)", chemistry: "LFP", strings: "108S", modules: 4, nominalV: 345.6, capacityAh: 144, energyKwh: 50.0, supplier: "GAC Magazine Battery" },
  { brand: "GAC AION", vehicle: "AION V 600", chemistry: "LFP", strings: "114S", modules: 6, nominalV: 365.0, capacityAh: 200, energyKwh: 75.3, supplier: "GAC Magazine Battery 2.0" }
];

const BATTERY_TEMPLATE_HEADER = ["Brand", "Vehicle Model", "Chemistry", "Strings", "Modules", "Nominal Voltage (V)", "Capacity (Ah)", "Energy (kWh)", "Battery Supplier / Note"];

function rowToBatteryEntry(row) {
  const [brand, vehicle, chemistry, strings, modules, nominalV, capacityAh, energyKwh, supplier] = row;
  if (!vehicle) return null;
  return {
    brand: String(brand || "").trim() || "Other",
    vehicle: String(vehicle).trim(),
    chemistry: String(chemistry || "").trim().toUpperCase(),
    strings: String(strings || "").trim(),
    modules: Number(modules) || 0,
    nominalV: Number(nominalV) || 0,
    capacityAh: Number(capacityAh) || 0,
    energyKwh: Number(energyKwh) || 0,
    supplier: String(supplier || "").trim()
  };
}

function getBatteryDB() {
  try {
    const raw = localStorage.getItem(BATTERY_STORAGE_KEY);
    if (!raw) return DEFAULT_BATTERY_DB;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_BATTERY_DB;
  } catch {
    return DEFAULT_BATTERY_DB;
  }
}

function setBatteryDB(entries) {
  localStorage.setItem(BATTERY_STORAGE_KEY, JSON.stringify(entries));
}

function resetBatteryDB() {
  localStorage.removeItem(BATTERY_STORAGE_KEY);
}

function isCustomBatteryDB() {
  return !!localStorage.getItem(BATTERY_STORAGE_KEY);
}

/* Upsert imported rows into existing DB, matched by vehicle name (case-insensitive) */
function importBatteryRows(rows) {
  const current = getBatteryDB().slice();
  let added = 0, updated = 0, skipped = 0;
  rows.forEach(r => {
    const entry = rowToBatteryEntry(r);
    if (!entry) { skipped++; return; }
    const idx = current.findIndex(c => c.vehicle.toLowerCase() === entry.vehicle.toLowerCase());
    if (idx >= 0) { current[idx] = entry; updated++; }
    else { current.push(entry); added++; }
  });
  setBatteryDB(current);
  return { added, updated, skipped, total: current.length };
}

/* ============================================================
   Parameter Settings by Vehicle Model
   NETA rows = verified against D2532C_Manual.pdf / SOP standard.
   Other brands = estimated reference values calculated from cell
   chemistry (LFP/NMC) and series string count, using the same
   charge-voltage formula validated against the NETA rows
   (strings × 3.65V for LFP, strings × 4.20V for NMC). These are
   NOT manufacturer-confirmed D2532C settings — verify against the
   vehicle's actual BMS data before use on MG / GAC AION packs.
   Editable at runtime via Excel import (see PARAMETER_STORAGE_KEY)
   ============================================================ */
const PARAMETER_STORAGE_KEY = "pk_d2532c_parameter_custom";

const DEFAULT_PARAMETER_SETTINGS = [
  { vehicle: "NETA V1 Gen1", batteryType: "Li-ion (NMC)", strings: 96, chargeA: 10, balanceNormalA: 8, balanceHeavyA: 15, mode: "Pulse", targetCellV: "4.15", chargeVoltage: 403.2, stopDeltaV: "≤5mV", source: "verified" },
  { vehicle: "NETA V1 Gen2", batteryType: "LiFePO4", strings: 112, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 408.8, stopDeltaV: "≤3mV", source: "verified" },
  { vehicle: "NETA V2 (V-II)", batteryType: "LiFePO4", strings: 112, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 408.8, stopDeltaV: "≤3mV", source: "verified" },
  { vehicle: "NETA X Comfort", batteryType: "LiFePO4", strings: 114, chargeA: 10, balanceNormalA: 6, balanceHeavyA: 12, mode: "Pulse", targetCellV: "3.60–3.65", chargeVoltage: 416.1, stopDeltaV: "≤3mV", source: "verified" },
  { vehicle: "NETA X Smart", batteryType: "LiFePO4", strings: 128, chargeA: 10, balanceNormalA: 6, balanceHeavyA: 12, mode: "Pulse", targetCellV: "3.60–3.65", chargeVoltage: 466.6, stopDeltaV: "≤3mV", source: "verified" },
  { vehicle: "MG EP / MG EP Plus", batteryType: "LiFePO4", strings: 112, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 408.8, stopDeltaV: "≤3mV", source: "estimated" },
  { vehicle: "MG4 EV (D Standard)", batteryType: "LiFePO4", strings: 104, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 379.6, stopDeltaV: "≤3mV", source: "estimated" },
  { vehicle: "MG4 EV (X Long Range / XPOWER)", batteryType: "Li-ion (NMC)", strings: 104, chargeA: 10, balanceNormalA: 8, balanceHeavyA: 15, mode: "Pulse", targetCellV: "4.15", chargeVoltage: 436.8, stopDeltaV: "≤5mV", source: "estimated" },
  { vehicle: "MG ZS EV (Facelift 50.3kWh)", batteryType: "LiFePO4", strings: 108, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 394.2, stopDeltaV: "≤3mV", source: "estimated" },
  { vehicle: "MG MAXUS 9", batteryType: "Li-ion (NMC)", strings: 108, chargeA: 10, balanceNormalA: 8, balanceHeavyA: 15, mode: "Pulse", targetCellV: "4.15", chargeVoltage: 453.6, stopDeltaV: "≤5mV", source: "estimated" },
  { vehicle: "AION Y Plus 490 Elite", batteryType: "LiFePO4", strings: 108, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 394.2, stopDeltaV: "≤3mV", source: "estimated" },
  { vehicle: "AION Y Plus 500 Premium", batteryType: "LiFePO4", strings: 112, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 408.8, stopDeltaV: "≤3mV", source: "estimated" },
  { vehicle: "AION Y Plus 610 Ultra", batteryType: "Li-ion (NMC)", strings: 96, chargeA: 10, balanceNormalA: 8, balanceHeavyA: 15, mode: "Pulse", targetCellV: "4.15", chargeVoltage: 403.2, stopDeltaV: "≤5mV", source: "estimated" },
  { vehicle: "AION ES (Taxi / Fleet)", batteryType: "LiFePO4", strings: 108, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 394.2, stopDeltaV: "≤3mV", source: "estimated" },
  { vehicle: "AION V 600", batteryType: "LiFePO4", strings: 114, chargeA: 8, balanceNormalA: 5, balanceHeavyA: 10, mode: "Pulse", targetCellV: "3.60", chargeVoltage: 416.1, stopDeltaV: "≤3mV", source: "estimated" }
];

const PARAMETER_TEMPLATE_HEADER = ["Vehicle Model", "Battery Type", "Strings", "Charge Current (A)", "Balance Normal (A)", "Balance Heavy (A)", "Mode", "Target Cell (V)", "Charge Voltage (V)", "Stop Delta V", "Source / Note"];

function rowToParameterEntry(row) {
  const [vehicle, batteryType, strings, chargeA, balanceNormalA, balanceHeavyA, mode, targetCellV, chargeVoltage, stopDeltaV, source] = row;
  if (!vehicle) return null;
  return {
    vehicle: String(vehicle).trim(),
    batteryType: String(batteryType || "").trim(),
    strings: Number(strings) || 0,
    chargeA: Number(chargeA) || 0,
    balanceNormalA: Number(balanceNormalA) || 0,
    balanceHeavyA: Number(balanceHeavyA) || 0,
    mode: String(mode || "Pulse").trim(),
    targetCellV: String(targetCellV || "").trim(),
    chargeVoltage: Number(chargeVoltage) || 0,
    stopDeltaV: String(stopDeltaV || "").trim(),
    source: String(source || "imported").trim() || "imported"
  };
}

function getParameterSettings() {
  try {
    const raw = localStorage.getItem(PARAMETER_STORAGE_KEY);
    if (!raw) return DEFAULT_PARAMETER_SETTINGS;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length) return parsed;
    return DEFAULT_PARAMETER_SETTINGS;
  } catch {
    return DEFAULT_PARAMETER_SETTINGS;
  }
}

function setParameterSettings(entries) {
  localStorage.setItem(PARAMETER_STORAGE_KEY, JSON.stringify(entries));
}

function resetParameterSettings() {
  localStorage.removeItem(PARAMETER_STORAGE_KEY);
}

function isCustomParameterSettings() {
  return !!localStorage.getItem(PARAMETER_STORAGE_KEY);
}

/* Upsert imported rows into existing parameter DB, matched by vehicle name (case-insensitive) */
function importParameterRows(rows) {
  const current = getParameterSettings().slice();
  let added = 0, updated = 0, skipped = 0;
  rows.forEach(r => {
    const entry = rowToParameterEntry(r);
    if (!entry) { skipped++; return; }
    const idx = current.findIndex(c => c.vehicle.toLowerCase() === entry.vehicle.toLowerCase());
    if (idx >= 0) { current[idx] = entry; updated++; }
    else { current.push(entry); added++; }
  });
  setParameterSettings(current);
  return { added, updated, skipped, total: current.length };
}

/* Look up which brand a vehicle belongs to, using the battery DB as the source of truth */
function vehicleBrand(vehicleName) {
  const match = getBatteryDB().find(b => b.vehicle === vehicleName);
  return match ? match.brand : "Other";
}

/* ---------- Parameter meaning / glossary ---------- */
const PARAMETER_GLOSSARY = [
  { key: "Battery Type", th: { label: "ชนิดแบตเตอรี่", meaning: "เคมีของแบตเตอรี่", recommended: "Li-ion = NMC / LiFePO4 = LFP" }, en: { label: "Battery Type", meaning: "Battery chemistry", recommended: "Li-ion = NMC / LiFePO4 = LFP" } },
  { key: "Number of Strings", th: { label: "จำนวนสตริง (Strings)", meaning: "จำนวนเซลล์ที่ต่ออนุกรมกัน", recommended: "96 / 112 / 114 / 128" }, en: { label: "Number of Strings", meaning: "Series-connected cell count", recommended: "96 / 112 / 114 / 128" } },
  { key: "Charge Current", th: { label: "กระแสชาร์จ (Charge Current)", meaning: "กระแสที่ใช้ในการชาร์จแพ็คแบตเตอรี่", recommended: "8–10A" }, en: { label: "Charge Current", meaning: "Current used to charge the battery pack", recommended: "8–10A" } },
  { key: "Balance Current", th: { label: "กระแสบาลานซ์ (Balance Current)", meaning: "กระแสดิสชาร์จเพื่อปรับสมดุลเซลล์", recommended: "5–15A ขึ้นอยู่กับค่า ΔV" }, en: { label: "Balance Current", meaning: "Discharge balancing current", recommended: "5–15A depending on ΔV" } },
  { key: "Balance Limit", th: { label: "ขีดจำกัดเริ่มบาลานซ์ (Balance Limit)", meaning: "แรงดันเซลล์ที่เริ่มทำการบาลานซ์", recommended: "NMC ≈ 4.15V, LFP ≈ 3.60V" }, en: { label: "Balance Limit", meaning: "Cell voltage above which balancing starts", recommended: "NMC ≈ 4.15V, LFP ≈ 3.60V" } },
  { key: "Pulse Mode", th: { label: "โหมดพัลส์ (Pulse Mode)", meaning: "ความแม่นยำสูง ความร้อนต่ำ", recommended: "ค่าเริ่มต้น (Default)" }, en: { label: "Pulse Mode", meaning: "Higher accuracy, lower heat generation", recommended: "Default mode" } },
  { key: "Continuous (A MAX)", th: { label: "โหมดต่อเนื่อง (Continuous / A MAX)", meaning: "บาลานซ์เร็วสำหรับ ΔV สูง", recommended: "ใช้เมื่อ ΔV > 80mV แล้วจบด้วยโหมด Pulse" }, en: { label: "Continuous (A MAX)", meaning: "Fast balancing for high ΔV", recommended: "Use when ΔV > 80mV, then finish in Pulse mode" } }
];

/* ---------- SOP steps ---------- */
const SOP_STEPS = [
  { step: 1, th: { title: "ตรวจสอบความปลอดภัยและการเดินสาย", detail: "ตรวจสอบค่าความเป็นฉนวน (Insulation) ไม่มีจุดชำรุด อุณหภูมิห้องอยู่ระหว่าง 15–35°C และเดินสายขั้ว B0–Bn ให้ถูกต้องตามลำดับ" }, en: { title: "Verify safety & wiring", detail: "Verify insulation resistance is fault-free, ambient temperature is 15–35°C, and wiring from B0 to Bn is correctly connected in sequence." } },
  { step: 2, th: { title: "เปิดเครื่องและเข้าสู่โหมดวิเคราะห์", detail: "กดปุ่ม Power เปิดเครื่อง จากนั้นกด START เพื่อเข้าสู่เมนู Analyze" }, en: { title: "Power on and enter analyze mode", detail: "Press Power to switch on, then press START to enter the Analyze menu." } },
  { step: 3, th: { title: "บันทึกค่าที่วัดได้", detail: "บันทึกแรงดันรวม (Total Voltage) เซลล์สูงสุด/ต่ำสุด ค่า Delta (ΔV) และอุณหภูมิ" }, en: { title: "Record measured values", detail: "Record total pack voltage, highest/lowest cell voltage, delta (ΔV), and temperature." } },
  { step: 4, th: { title: "เลือกโหมดบาลานซ์ตามค่า ΔV", detail: "อ้างอิงตารางตัดสินใจ (Decision Table) เพื่อเลือกโหมดและกระแสบาลานซ์ที่เหมาะสม" }, en: { title: "Select balance mode by delta", detail: "Reference the Decision Table to select the appropriate balancing mode and current." } },
  { step: 5, th: { title: "ดิสชาร์จบาลานซ์ (Discharge Equalization)", detail: "กด START เพื่อเริ่มกระบวนการดิสชาร์จปรับสมดุลเซลล์ที่มีแรงดันสูงเกินเกณฑ์" }, en: { title: "Discharge Equalization", detail: "Press START to begin discharging high cells to equalize the pack." } },
  { step: 6, th: { title: "ชาร์จบาลานซ์ (Charge Equalization)", detail: "กด CHARG เพื่อชาร์จแพ็คพร้อมปรับสมดุลเซลล์ระหว่างการชาร์จ" }, en: { title: "Charge Equalization", detail: "Press CHARG to charge the pack while balancing cells simultaneously." } },
  { step: 7, th: { title: "พักแบตเตอรี่ (Rest)", detail: "หลังกระบวนการเสร็จสิ้น ปล่อยให้แบตเตอรี่พักอย่างน้อย 30 นาที ก่อนวัดค่าซ้ำ" }, en: { title: "Rest the battery", detail: "After completion, allow the battery to rest for at least 30 minutes before re-measuring." } },
  { step: 8, th: { title: "วิเคราะห์ซ้ำและบันทึกผล QC", detail: "วิเคราะห์อีกครั้ง บันทึกเซลล์สูงสุด เซลล์ต่ำสุด และ ΔV สุดท้ายลงในแบบฟอร์ม QC" }, en: { title: "Re-analyze and log QC result", detail: "Re-analyze the pack and record final highest cell, lowest cell, and ΔV in the QC form." } }
];

/* ---------- Decision table (thresholds in mV) ---------- */
const DECISION_TABLE = [
  { min: 0, max: 10, label: "< 10 mV", action: { th: "ผ่าน (Pass)", en: "Pass" }, level: "pass" },
  { min: 10, max: 30, label: "10–30 mV", action: { th: "บาลานซ์แบบ Pulse 5A", en: "Pulse balance 5A" }, level: "info" },
  { min: 30, max: 80, label: "30–80 mV", action: { th: "บาลานซ์แบบ Pulse 8A", en: "Pulse balance 8A" }, level: "warn" },
  { min: 80, max: 150, label: "80–150 mV", action: { th: "บาลานซ์ต่อเนื่อง (Continuous) แล้วจบด้วย Pulse", en: "Continuous, then finish in Pulse" }, level: "danger" },
  { min: 150, max: Infinity, label: "> 150 mV", action: { th: "ตรวจสอบโมดูล/เซลล์ที่ผิดปกติ", en: "Inspect module/cell" }, level: "critical" }
];

function getDecision(deltaMv) {
  return DECISION_TABLE.find(d => deltaMv >= d.min && deltaMv < d.max) || DECISION_TABLE[DECISION_TABLE.length - 1];
}

/* ---------- Machine operation steps ---------- */
const OPERATION_STEPS = [
  { step: 1, th: "ต่อสาย B0 เข้ากับขั้วลบหลัก จากนั้นต่อสายบาลานซ์ทั้งหมดตามลำดับไปยัง Bn ตรวจสอบขั้วให้ถูกต้องก่อนต่อ", en: "Connect B0 to main negative, then connect all balance leads sequentially to Bn. Verify polarity before connecting.", ref: "Wiring" },
  { step: 2, th: "เปิดสวิตช์ไฟหลัก แล้วกด Power/Confirm เพื่อเริ่มหน้าจอแสดงผล", en: "Turn on the main power switch, then press Power/Confirm to start the display.", ref: "Startup" },
  { step: 3, th: "กด START เพื่อวิเคราะห์แรงดันแบตเตอรี่และข้อมูลเซลล์", en: "Press START to analyze battery voltage and cell information.", ref: "Analyze" },
  { step: 4, th: "เปิดเมนู Parameter Settings", en: "Open Parameter Settings.", ref: "Settings" },
  { step: 5, th: "เลือกชนิดแบตเตอรี่: Li-ion (NMC) หรือ LiFePO4 (LFP)", en: "Select Battery Type: Li-ion (NMC) or LiFePO4 (LFP).", ref: "Battery Type" },
  { step: 6, th: "ป้อนจำนวนสตริงจริง (96/112/114/128)", en: "Enter actual Number of Strings (96/112/114/128).", ref: "Strings" },
  { step: 7, th: "ซิงค์ข้อมูล (Synchronize Data) ไปยัง BMS หลังตั้งค่าจำนวนสตริง", en: "Synchronize Data to BMS after setting strings.", ref: "Sync" },
  { step: 8, th: "ตั้งค่าโหมดบาลานซ์: Pulse สำหรับกรณีปกติ, A MAX (Continuous) สำหรับ ΔV สูง", en: "Set Balance Mode: Pulse for normal, A MAX (Continuous) for large Delta.", ref: "Balance" },
  { step: 9, th: "ตั้งค่ากระแสชาร์จ: NMC 10A, LFP 8–10A", en: "Set Charge Current: NMC 10A, LFP 8–10A.", ref: "Charge" },
  { step: 10, th: "กด START เพื่อดิสชาร์จบาลานซ์ หรือกด CHARG เพื่อชาร์จบาลานซ์", en: "Press START for Discharge Equalization or CHARG for Charge Equalization.", ref: "Run" },
  { step: 11, th: "หลังกระบวนการเสร็จสิ้น พักแบตเตอรี่ 30 นาที", en: "After completion, allow the battery to rest 30 minutes.", ref: "Relax" },
  { step: 12, th: "วิเคราะห์ซ้ำและบันทึกเซลล์สูงสุด เซลล์ต่ำสุด และค่า ΔV", en: "Re-analyze and record Highest Cell, Lowest Cell, Delta Voltage.", ref: "QC" }
];

/* ---------- Safety precautions ---------- */
const PRECAUTIONS = [
  { th: "ห้ามต่อสายกลับขั้ว ตรวจสอบขั้ว B0–Bn ทุกครั้งก่อนต่อเข้าเครื่อง", en: "Never reverse polarity — verify B0–Bn wiring every time before connecting." },
  { th: "ใช้งานในอุณหภูมิห้อง 15–35°C และพื้นที่ระบายอากาศดี", en: "Operate within 15–35°C ambient temperature in a well-ventilated area." },
  { th: "ตรวจค่าความเป็นฉนวน (Insulation) ก่อนเริ่มกระบวนการทุกครั้ง", en: "Check insulation resistance before starting every session." },
  { th: "ห้ามถอดสายขณะเครื่องกำลังชาร์จหรือบาลานซ์อยู่", en: "Never disconnect leads while charging or balancing is in progress." },
  { th: "หากค่า ΔV เกิน 150mV ให้หยุดกระบวนการและตรวจสอบโมดูลก่อนดำเนินการต่อ", en: "If ΔV exceeds 150mV, stop the process and inspect the module before continuing." }
];
