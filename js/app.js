/* ============================================================
   App Module — routing, rendering, QC form, ΔV calculator,
   battery DB import, professional inspection report
   ============================================================ */

const ROUTES = ["dashboard", "sop", "params", "battery", "qc", "report", "calc"];
const RECORDS_KEY = "pk_d2532c_qc_records";

const NAV_ICONS = {
  dashboard: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>`,
  sop: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  params: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7"/><path d="M4 10V3"/><path d="M12 21v-9"/><path d="M12 8V3"/><path d="M20 21v-5"/><path d="M20 12V3"/><circle cx="4" cy="12" r="2"/><circle cx="12" cy="10" r="2"/><circle cx="20" cy="14" r="2"/></svg>`,
  battery: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="17" height="10" rx="2"/><line x1="22" y1="11" x2="22" y2="13"/><line x1="6" y1="10" x2="6" y2="14"/><line x1="10" y1="10" x2="10" y2="14"/></svg>`,
  qc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M11 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-6"/></svg>`,
  report: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/></svg>`,
  calc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="8" y2="10"/><line x1="12" y1="10" x2="12" y2="10"/><line x1="16" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="8" y2="14"/><line x1="12" y1="14" x2="12" y2="14"/><line x1="16" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>`
};

function getRoute() {
  const h = (location.hash || "#dashboard").replace("#", "");
  return ROUTES.includes(h) ? h : "dashboard";
}

function getRecords() {
  try { return JSON.parse(localStorage.getItem(RECORDS_KEY)) || []; }
  catch { return []; }
}
function saveRecords(records) {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}
function netaModels() {
  return getBatteryDB().filter(b => b.brand === "NETA");
}

/* ============================================================
   Render root
   ============================================================ */
function renderApp() {
  const root = document.getElementById("app");
  const route = getRoute();

  root.innerHTML = `
    <div class="app-shell">
      <div class="overlay" id="overlay"></div>
      <aside class="sidebar" id="sidebar">
        ${renderBrand()}
        <nav class="nav">${renderNav(route)}</nav>
        <div class="sidebar-footer">
          <div class="device-tag">MODEL: ${DEVICE_INFO.model}</div>
          ${renderLangSwitch()}
        </div>
      </aside>
      <div>
        <div class="topbar">
          ${renderBrand()}
          <button class="menu-btn" id="menuBtn">☰</button>
        </div>
        <main class="main" id="main">${renderRoute(route)}</main>
      </div>
    </div>
  `;

  bindGlobalEvents();
  bindRouteEvents(route);
}

function renderBrand() {
  return `
    <div class="brand">
      <div class="brand-mark">P&K</div>
      <div class="brand-text">
        <div class="name">${t("brand")}</div>
        <div class="sub">${t("brandSub")}</div>
      </div>
    </div>`;
}

function renderLangSwitch() {
  return `
    <div class="lang-switch" role="group" aria-label="Language">
      <button class="lang-opt ${currentLang === "th" ? "active" : ""}" data-lang="th">ไทย</button>
      <button class="lang-opt ${currentLang === "en" ? "active" : ""}" data-lang="en">EN</button>
    </div>`;
}

function renderNav(route) {
  return ROUTES.map(r => `
    <button class="nav-item ${r === route ? "active" : ""}" data-route="${r}">
      ${NAV_ICONS[r]}<span>${t("nav" + r.charAt(0).toUpperCase() + r.slice(1))}</span>
    </button>
  `).join("");
}

function bindGlobalEvents() {
  document.querySelectorAll(".lang-opt").forEach(btn => {
    btn.onclick = () => setLang(btn.dataset.lang);
  });
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.onclick = () => { location.hash = btn.dataset.route; closeSidebar(); };
  });
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) menuBtn.onclick = openSidebar;
  const overlay = document.getElementById("overlay");
  if (overlay) overlay.onclick = closeSidebar;
}
function openSidebar() {
  document.getElementById("sidebar").classList.add("open");
  document.getElementById("overlay").classList.add("show");
}
function closeSidebar() {
  document.getElementById("sidebar").classList.remove("open");
  document.getElementById("overlay").classList.remove("show");
}

/* ============================================================
   Route dispatch
   ============================================================ */
function renderRoute(route) {
  switch (route) {
    case "dashboard": return renderDashboard();
    case "sop": return renderSop();
    case "params": return renderParams();
    case "battery": return renderBattery();
    case "qc": return renderQc();
    case "report": return renderReport();
    case "calc": return renderCalc();
    default: return renderDashboard();
  }
}
function bindRouteEvents(route) {
  if (route === "dashboard") bindDashboardEvents();
  if (route === "battery") bindBatteryEvents();
  if (route === "qc") bindQcEvents();
  if (route === "report") bindReportEvents();
  if (route === "calc") bindCalcEvents();
  if (route === "sop") bindExportBtn("sopPanelGroup", "exportSopPdf", "D2532C_SOP");
  if (route === "params") bindParamsEvents();
}
function bindExportBtn(panelId, btnId, prefix) {
  const btn = document.getElementById(btnId);
  if (btn) btn.onclick = () => exportPanelToPdf(panelId, prefix);
  const printBtn = document.getElementById(btnId.replace("Pdf", "Print"));
  if (printBtn) printBtn.onclick = () => window.print();
}

/* ============================================================
   Dashboard
   ============================================================ */
function renderDashboard() {
  const records = getRecords();
  const last = records[records.length - 1];
  return `
    <div class="page-head">
      <span class="eyebrow">${DEVICE_INFO.model}</span>
      <h1>${t("dashTitle")}</h1>
      <p>${t("dashSubtitle")}</p>
    </div>

    <div class="stat-grid">
      <div class="stat-card">
        <div class="label">${t("dashModelsCovered")}</div>
        <div class="value">${getBatteryDB().length}</div>
      </div>
      <div class="stat-card">
        <div class="label">${t("dashRecords")}</div>
        <div class="value">${records.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">${t("dashLastRecord")}</div>
        <div class="value small">${last ? `${last.vehicle} · ${last.date}` : t("dashNone")}</div>
      </div>
    </div>

    <div class="panel">
      <h2>${DEVICE_INFO.name[currentLang]}</h2>
      <p class="panel-sub" style="margin-top:8px;">${DEVICE_INFO.desc[currentLang]}</p>
    </div>

    <div class="panel">
      <h2>${t("quickLinks")}</h2>
      <div class="quick-links" style="margin-top:12px;">
        <button class="quick-link" data-go="sop">${t("goSop")}</button>
        <button class="quick-link" data-go="calc">${t("goCalc")}</button>
        <button class="quick-link" data-go="qc">${t("goQc")}</button>
        <button class="quick-link" data-go="report">${t("goReport")}</button>
      </div>
    </div>

    ${renderFooterNote()}
  `;
}
function bindDashboardEvents() {
  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.onclick = () => location.hash = btn.dataset.go;
  });
}

/* ============================================================
   SOP page
   ============================================================ */
function renderSop() {
  return `
    <div class="page-head">
      <span class="eyebrow">SOP</span>
      <h1>${t("sopTitle")}</h1>
      <p>${t("sopSubtitle")}</p>
    </div>

    <div id="sopPanelGroup">
      <div class="panel">
        <h2>${t("sopTitle")}</h2>
        <div class="sop-list" style="margin-top:14px;">
          ${SOP_STEPS.map(s => `
            <div class="sop-step">
              <div class="num">${s.step}</div>
              <div class="body">
                <h4>${s[currentLang].title}</h4>
                <p>${s[currentLang].detail}</p>
              </div>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="panel">
        <h2>${t("precautionsTitle")}</h2>
        <div class="precaution-list" style="margin-top:14px;">
          ${PRECAUTIONS.map(p => `
            <div class="precaution-item"><span class="dot">⚠</span><span>${p[currentLang]}</span></div>
          `).join("")}
        </div>
      </div>

      <div class="panel">
        <h2>${t("opTitle")}</h2>
        <p class="panel-sub">${t("opSubtitle")}</p>
        <div class="table-wrap">
          <table>
            <thead><tr><th>${t("step")}</th><th class="wrap">${currentLang === "th" ? "การปฏิบัติงาน" : "Operation"}</th><th>${t("reference")}</th></tr></thead>
            <tbody>
              ${OPERATION_STEPS.map(o => `
                <tr><td class="mono">${o.step}</td><td class="wrap">${o[currentLang]}</td><td>${o.ref}</td></tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="btn-row no-print">
      <button class="btn" id="exportSopPrint">🖨 ${t("printPage")}</button>
      <button class="btn primary" id="exportSopPdf">⬇ ${t("exportPdf")}</button>
    </div>

    ${renderFooterNote()}
  `;
}

/* ============================================================
   Parameters page — searchable, filterable, importable
   ============================================================ */
let paramsBrandFilter = "ALL";

function renderParams() {
  const params = getParameterSettings();
  const brands = ["ALL", ...Array.from(new Set(params.map(p => vehicleBrand(p.vehicle))))];

  return `
    <div class="page-head">
      <span class="eyebrow">PARAMETERS</span>
      <h1>${t("paramsTitle")} ${isCustomParameterSettings() ? `<span class="level-badge info" style="vertical-align:middle;font-size:11px;">${t("customDbBadge")}</span>` : ""}</h1>
      <p>${t("paramsSubtitle")}</p>
    </div>

    <div class="panel no-print">
      <h2>${t("paramsImportTitle")}</h2>
      <p class="panel-sub">${t("paramsImportSubtitle")}</p>
      <div class="btn-row" style="margin-top:4px;">
        <button class="btn" id="downloadParamsTemplateBtn">📄 ${t("downloadTemplate")}</button>
        <label class="btn primary" for="paramsImportInput" style="cursor:pointer;">⬆ ${t("importExcel")}</label>
        <input type="file" id="paramsImportInput" accept=".xlsx,.xls" style="display:none;">
        <button class="btn danger-outline" id="resetParamsBtn" ${isCustomParameterSettings() ? "" : "disabled"}>↺ ${t("resetDefault")}</button>
      </div>
    </div>

    <div class="filter-bar no-print">
      <input type="text" id="paramsSearch" class="search-input" placeholder="${t("paramsSearchPlaceholder")}">
      <div class="filter-tabs" style="margin-bottom:0;">
        ${brands.map(b => `<button class="filter-tab ${b === paramsBrandFilter ? "active" : ""}" data-brand="${b}">${b === "ALL" ? t("allBrands") : b}</button>`).join("")}
      </div>
    </div>

    <div id="paramsPanelGroup">
      <div class="panel">
        <h2>${t("paramsTitle")}</h2>
        <div class="table-wrap" style="margin-top:14px;">
          <table>
            <thead><tr>
              <th>${t("vehicle")}</th><th>${t("batteryType")}</th><th>${t("strings")}</th>
              <th>${t("chargeA")}</th><th>${t("balanceNormalA")}</th><th>${t("balanceHeavyA")}</th>
              <th>${t("mode")}</th><th>${t("targetCellV")}</th><th>${t("chargeVoltage")}</th><th>${t("stopDeltaV")}</th><th>${t("source")}</th>
            </tr></thead>
            <tbody id="paramsTableBody">
              ${params.map(p => `
                <tr data-brand="${vehicleBrand(p.vehicle)}" data-search="${(p.vehicle + " " + p.batteryType).toLowerCase()}">
                  <td>${p.vehicle}</td><td>${p.batteryType}</td><td class="mono">${p.strings}</td>
                  <td class="mono">${p.chargeA}A</td><td class="mono">${p.balanceNormalA}A</td><td class="mono">${p.balanceHeavyA}A</td>
                  <td>${p.mode}</td><td class="mono">${p.targetCellV}V</td><td class="mono">${p.chargeVoltage}V</td><td class="mono">${p.stopDeltaV}</td>
                  <td>${renderSourceBadge(p.source)}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
          <p id="paramsNoResults" class="table-empty-msg" style="display:none;">${t("noResults")}</p>
        </div>
      </div>

      <div class="panel">
        <h2>${t("glossaryTitle")}</h2>
        <div class="table-wrap" style="margin-top:14px;">
          <table>
            <thead><tr><th>${t("parameter")}</th><th class="wrap">${t("meaning")}</th><th class="wrap">${t("recommended")}</th></tr></thead>
            <tbody>
              ${PARAMETER_GLOSSARY.map(g => `
                <tr><td>${g[currentLang].label}</td><td class="wrap">${g[currentLang].meaning}</td><td class="wrap">${g[currentLang].recommended}</td></tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h2>${t("decisionTitle")}</h2>
        <div class="table-wrap" style="margin-top:14px;">
          <table>
            <thead><tr><th>ΔV</th><th class="wrap">${t("recommendation")}</th></tr></thead>
            <tbody>
              ${DECISION_TABLE.map(d => `
                <tr><td class="mono">${d.label}</td><td><span class="level-badge ${d.level}">${d.action[currentLang]}</span></td></tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="btn-row no-print">
      <button class="btn" id="exportParamsPrint">🖨 ${t("printPage")}</button>
      <button class="btn primary" id="exportParamsPdf">⬇ ${t("exportPdf")}</button>
      <button class="btn" id="exportParamsExcel">📊 ${t("exportExcel")}</button>
    </div>

    ${renderFooterNote()}
  `;
}

function renderSourceBadge(source) {
  if (source === "verified") return `<span class="level-badge pass" style="font-size:11px;">${t("sourceVerified")}</span>`;
  if (source === "estimated") return `<span class="level-badge warn" style="font-size:11px;">${t("sourceEstimated")}</span>`;
  return `<span class="level-badge info" style="font-size:11px;">${t("sourceImported")}</span>`;
}

function filterParamsTable() {
  const query = (document.getElementById("paramsSearch").value || "").trim().toLowerCase();
  const rows = document.querySelectorAll("#paramsTableBody tr");
  let visibleCount = 0;
  rows.forEach(row => {
    const matchesBrand = paramsBrandFilter === "ALL" || row.dataset.brand === paramsBrandFilter;
    const matchesSearch = !query || row.dataset.search.includes(query);
    const show = matchesBrand && matchesSearch;
    row.style.display = show ? "" : "none";
    if (show) visibleCount++;
  });
  document.getElementById("paramsNoResults").style.display = visibleCount === 0 ? "block" : "none";
}

function bindParamsEvents() {
  document.getElementById("paramsSearch").addEventListener("input", filterParamsTable);
  document.querySelectorAll(".filter-tab").forEach(btn => {
    btn.onclick = () => {
      paramsBrandFilter = btn.dataset.brand;
      document.querySelectorAll(".filter-tab").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      filterParamsTable();
    };
  });
  document.getElementById("downloadParamsTemplateBtn").onclick = downloadParameterTemplate;
  document.getElementById("paramsImportInput").onchange = (e) => {
    const file = e.target.files[0];
    if (file) handleParameterImportFile(file, () => renderApp());
  };
  const resetBtn = document.getElementById("resetParamsBtn");
  if (resetBtn) resetBtn.onclick = () => {
    if (confirm(t("confirmResetDb"))) { resetParameterSettings(); renderApp(); }
  };
  bindExportBtn("paramsPanelGroup", "exportParamsPdf", "D2532C_Parameters");
  document.getElementById("exportParamsExcel").onclick = exportReferenceToExcel;
}

/* ============================================================
   Battery DB page — grouped by brand + import/export
   ============================================================ */
let batteryBrandFilter = "ALL";

function renderBattery() {
  const db = getBatteryDB();
  const brands = ["ALL", ...Array.from(new Set(db.map(b => b.brand)))];
  const filtered = batteryBrandFilter === "ALL" ? db : db.filter(b => b.brand === batteryBrandFilter);

  return `
    <div class="page-head">
      <span class="eyebrow">BATTERY DB</span>
      <h1>${t("batteryTitle")} ${isCustomBatteryDB() ? `<span class="level-badge info" style="vertical-align:middle;font-size:11px;">${t("customDbBadge")}</span>` : ""}</h1>
      <p>${t("batterySubtitle")}</p>
    </div>

    <div class="panel no-print">
      <h2>${t("batteryImportTitle")}</h2>
      <p class="panel-sub">${t("batteryImportSubtitle")}</p>
      <div class="btn-row" style="margin-top:4px;">
        <button class="btn" id="downloadTemplateBtn">📄 ${t("downloadTemplate")}</button>
        <label class="btn primary" for="batteryImportInput" style="cursor:pointer;">⬆ ${t("importExcel")}</label>
        <input type="file" id="batteryImportInput" accept=".xlsx,.xls" style="display:none;">
        <button class="btn danger-outline" id="resetDbBtn" ${isCustomBatteryDB() ? "" : "disabled"}>↺ ${t("resetDefault")}</button>
      </div>
    </div>

    <div class="filter-tabs no-print">
      ${brands.map(b => `<button class="filter-tab ${b === batteryBrandFilter ? "active" : ""}" data-brand="${b}">${b === "ALL" ? t("allBrands") : b}</button>`).join("")}
    </div>

    <div id="batteryPanelGroup">
      <div class="panel">
        <div class="model-grid">
          ${filtered.map(b => `
            <div class="model-card">
              <span class="chem-badge ${b.chemistry === "NMC" ? "nmc" : "lfp"}">${b.chemistry}</span>
              <span class="brand-badge">${b.brand}</span>
              <h3>${b.vehicle}</h3>
              <div class="spec-row"><span class="k">${t("strings")}</span><span class="v">${b.strings}</span></div>
              <div class="spec-row"><span class="k">${t("modules")}</span><span class="v">${b.modules}</span></div>
              <div class="spec-row"><span class="k">${t("nominalV")}</span><span class="v">${b.nominalV} V</span></div>
              <div class="spec-row"><span class="k">${t("capacity")}</span><span class="v">${b.capacityAh} Ah</span></div>
              <div class="spec-row"><span class="k">${t("energy")}</span><span class="v">${b.energyKwh} kWh</span></div>
              <p class="model-note">${b.supplier}</p>
            </div>
          `).join("")}
        </div>
      </div>

      <div class="panel">
        <h2>${currentLang === "th" ? "ตารางเปรียบเทียบ" : "Comparison Table"}</h2>
        <div class="table-wrap" style="margin-top:14px;">
          <table>
            <thead><tr>
              <th>${t("brand")}</th><th>${t("vehicle")}</th><th>${t("chemistry")}</th><th>${t("strings")}</th>
              <th>${t("modules")}</th><th>${t("nominalV")}</th><th>${t("capacity")}</th><th>${t("energy")}</th><th class="wrap">${t("supplier")}</th>
            </tr></thead>
            <tbody>
              ${filtered.map(b => `
                <tr><td>${b.brand}</td><td>${b.vehicle}</td><td>${b.chemistry}</td><td class="mono">${b.strings}</td><td class="mono">${b.modules}</td><td class="mono">${b.nominalV}V</td><td class="mono">${b.capacityAh}Ah</td><td class="mono">${b.energyKwh}kWh</td><td class="wrap">${b.supplier}</td></tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="btn-row no-print">
      <button class="btn" id="exportBatteryPrint">🖨 ${t("printPage")}</button>
      <button class="btn primary" id="exportBatteryPdf">⬇ ${t("exportPdf")}</button>
      <button class="btn" id="exportBatteryExcel">📊 ${t("exportExcel")}</button>
    </div>

    ${renderFooterNote()}
  `;
}

function bindBatteryEvents() {
  document.querySelectorAll(".filter-tab").forEach(btn => {
    btn.onclick = () => { batteryBrandFilter = btn.dataset.brand; renderApp(); location.hash = "battery"; };
  });
  document.getElementById("downloadTemplateBtn").onclick = downloadBatteryTemplate;
  document.getElementById("batteryImportInput").onchange = (e) => {
    const file = e.target.files[0];
    if (file) handleBatteryImportFile(file, () => renderApp());
  };
  const resetBtn = document.getElementById("resetDbBtn");
  if (resetBtn) resetBtn.onclick = () => {
    if (confirm(t("confirmResetDb"))) { resetBatteryDB(); renderApp(); }
  };
  bindExportBtn("batteryPanelGroup", "exportBatteryPdf", "D2532C_Battery_DB");
  document.getElementById("exportBatteryExcel").onclick = exportReferenceToExcel;
}

/* ============================================================
   QC Form page
   ============================================================ */
function renderQc() {
  const records = getRecords();
  const vehicleOptions = netaModels().map(b => `<option value="${b.vehicle}">${b.vehicle}</option>`).join("");

  return `
    <div class="page-head">
      <span class="eyebrow">QC</span>
      <h1>${t("qcTitle")}</h1>
      <p>${t("qcSubtitle")}</p>
    </div>

    <div class="panel" id="qcFormPanel">
      <h2>${t("qcTitle")}</h2>
      <div class="form-grid" style="margin-top:14px;">
        <div class="field"><label>${t("fVehicle")}</label>
          <select id="qcVehicle">${vehicleOptions}</select>
        </div>
        <div class="field"><label>${t("fStage")}</label>
          <select id="qcStage">
            <option value="before">${t("stageBefore")}</option>
            <option value="after">${t("stageAfter")}</option>
          </select>
        </div>
        <div class="field"><label>${t("fPlate")}</label><input type="text" id="qcPlate" placeholder="${currentLang === "th" ? "เช่น กก-1234" : "e.g. AB-1234"}"></div>
        <div class="field"><label>${t("fTech")}</label><input type="text" id="qcTech"></div>
        <div class="field"><label>${t("fDate")}</label><input type="date" id="qcDate"></div>
        <div class="field"><label>${t("fTotalV")}</label><input type="number" step="0.1" id="qcTotalV"></div>
        <div class="field"><label>${t("fHighCell")}</label><input type="number" step="0.001" id="qcHighCell"></div>
        <div class="field"><label>${t("fLowCell")}</label><input type="number" step="0.001" id="qcLowCell"></div>
        <div class="field"><label>${t("fTemp")}</label><input type="number" step="0.1" id="qcTemp"></div>
      </div>
      <div class="field" style="margin-top:14px;"><label>${t("fNotes")}</label><textarea id="qcNotes"></textarea></div>

      <div id="qcResult"></div>

      <div class="btn-row">
        <button class="btn primary" id="qcSaveBtn">💾 ${t("saveRecord")}</button>
        <button class="btn" id="qcClearBtn">↺ ${t("clearForm")}</button>
      </div>
    </div>

    <div class="panel">
      <h2>${t("recordsTitle")}</h2>
      <div id="qcRecordsWrap" style="margin-top:14px;">${renderQcRecordsTable(records)}</div>
      <div class="btn-row no-print">
        <button class="btn" id="qcExportExcel">📊 ${t("exportExcel")}</button>
        <button class="btn danger-outline" id="qcDeleteAll" ${records.length === 0 ? "disabled" : ""}>🗑 ${t("deleteAll")}</button>
      </div>
    </div>

    ${renderFooterNote()}
  `;
}

function renderQcRecordsTable(records) {
  if (!records.length) return `<p style="color:var(--text-dim);font-size:13.5px;">${t("noRecords")}</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>
          <th>${t("fDate")}</th><th>${t("fVehicle")}</th><th>${t("fStage")}</th>
          <th>${t("fHighCell")}</th><th>${t("fLowCell")}</th><th>ΔV (mV)</th><th class="wrap">${t("recommendation")}</th><th class="no-print"></th>
        </tr></thead>
        <tbody>
          ${records.slice().reverse().map(r => {
            const d = getDecision(r.deltaMv);
            return `
              <tr>
                <td class="mono">${r.date}</td><td>${r.vehicle}</td><td>${r.stage === "before" ? t("stageBefore") : t("stageAfter")}</td>
                <td class="mono">${r.highCell}</td><td class="mono">${r.lowCell}</td><td class="mono">${r.deltaMv.toFixed(1)}</td>
                <td><span class="level-badge ${d.level}">${d.action[currentLang]}</span></td>
                <td class="no-print"><button class="btn danger-outline" style="padding:4px 10px;font-size:12px;" data-del="${r.id}">${t("actionDelete")}</button></td>
              </tr>`;
          }).join("")}
        </tbody>
      </table>
    </div>`;
}

function bindQcEvents() {
  const dateEl = document.getElementById("qcDate");
  if (dateEl && !dateEl.value) dateEl.value = new Date().toISOString().slice(0, 10);

  ["qcHighCell", "qcLowCell"].forEach(id => document.getElementById(id).addEventListener("input", updateQcResult));
  document.getElementById("qcVehicle").addEventListener("change", updateQcResult);
  updateQcResult();

  document.getElementById("qcSaveBtn").onclick = saveQcRecord;
  document.getElementById("qcClearBtn").onclick = () => renderApp();
  document.getElementById("qcExportExcel").onclick = () => exportRecordsToExcel(getRecords());
  const delAllBtn = document.getElementById("qcDeleteAll");
  if (delAllBtn) delAllBtn.onclick = () => {
    if (confirm(t("confirmDeleteAll"))) { saveRecords([]); renderApp(); }
  };
  bindDeleteRowButtons();
}

function bindDeleteRowButtons() {
  document.querySelectorAll("[data-del]").forEach(btn => {
    btn.onclick = () => {
      const id = btn.dataset.del;
      saveRecords(getRecords().filter(r => r.id !== id));
      renderApp();
    };
  });
}

function updateQcResult() {
  const high = parseFloat(document.getElementById("qcHighCell").value);
  const low = parseFloat(document.getElementById("qcLowCell").value);
  const resultEl = document.getElementById("qcResult");
  if (isNaN(high) || isNaN(low)) { resultEl.innerHTML = ""; return; }
  const deltaMv = Math.abs(high - low) * 1000;
  const decision = getDecision(deltaMv);
  resultEl.innerHTML = `
    <div class="result-panel">
      <div class="metric"><div class="k">${t("deltaV")}</div><div class="v">${deltaMv.toFixed(1)} mV</div></div>
      <div class="metric"><div class="k">${t("recommendation")}</div><div class="v"><span class="level-badge ${decision.level}" style="font-size:13px;">${decision.action[currentLang]}</span></div></div>
    </div>`;
}

function saveQcRecord() {
  const vehicle = document.getElementById("qcVehicle").value;
  const stage = document.getElementById("qcStage").value;
  const plate = document.getElementById("qcPlate").value.trim();
  const tech = document.getElementById("qcTech").value.trim();
  const date = document.getElementById("qcDate").value;
  const totalV = document.getElementById("qcTotalV").value;
  const highCell = parseFloat(document.getElementById("qcHighCell").value);
  const lowCell = parseFloat(document.getElementById("qcLowCell").value);
  const temp = document.getElementById("qcTemp").value;
  const notes = document.getElementById("qcNotes").value.trim();

  if (!vehicle || !date || isNaN(highCell) || isNaN(lowCell)) { showToast(t("fillRequired")); return; }

  const deltaMv = Math.abs(highCell - lowCell) * 1000;
  const record = { id: "qc_" + Date.now(), vehicle, stage, plate, tech, date, totalV: totalV || "", highCell, lowCell, temp: temp || "", notes, deltaMv };
  const records = getRecords();
  records.push(record);
  saveRecords(records);
  showToast(t("savedMsg"));
  renderApp();
  location.hash = "qc";
}

/* ============================================================
   ΔV Calculator page
   ============================================================ */
function renderCalc() {
  const vehicleOptions = `<option value="">—</option>` + netaModels().map(b => `<option value="${b.vehicle}">${b.vehicle}</option>`).join("");
  return `
    <div class="page-head">
      <span class="eyebrow">ΔV</span>
      <h1>${t("calcTitle")}</h1>
      <p>${t("calcSubtitle")}</p>
    </div>

    <div class="panel">
      <div class="form-grid">
        <div class="field"><label>${t("calcVehicleOptional")}</label><select id="calcVehicle">${vehicleOptions}</select></div>
        <div class="field"><label>${t("calcHigh")}</label><input type="number" step="0.001" id="calcHigh"></div>
        <div class="field"><label>${t("calcLow")}</label><input type="number" step="0.001" id="calcLow"></div>
      </div>
      <div id="calcResult"></div>
    </div>

    ${renderFooterNote()}
  `;
}

function bindCalcEvents() {
  ["calcHigh", "calcLow", "calcVehicle"].forEach(id => {
    document.getElementById(id).addEventListener("input", updateCalcResult);
    document.getElementById(id).addEventListener("change", updateCalcResult);
  });
}

function updateCalcResult() {
  const high = parseFloat(document.getElementById("calcHigh").value);
  const low = parseFloat(document.getElementById("calcLow").value);
  const vehicle = document.getElementById("calcVehicle").value;
  const resultEl = document.getElementById("calcResult");
  if (isNaN(high) || isNaN(low)) { resultEl.innerHTML = ""; return; }

  const deltaMv = Math.abs(high - low) * 1000;
  const decision = getDecision(deltaMv);

  let stopCompareHtml = "";
  if (vehicle) {
    const param = getParameterSettings().find(p => p.vehicle === vehicle);
    if (param) {
      const stopVal = parseFloat(param.stopDeltaV.replace(/[^\d.]/g, ""));
      const within = deltaMv <= stopVal;
      stopCompareHtml = `
        <div class="hint-box">
          <strong>${t("stopDeltaCompare")}:</strong> ${param.stopDeltaV} —
          <span style="color:${within ? "var(--success)" : "var(--danger)"};font-weight:600;">
            ${within ? t("within") : t("exceed")}
          </span>
        </div>`;
    }
  }

  resultEl.innerHTML = `
    <div class="result-panel">
      <div class="metric"><div class="k">${t("deltaV")}</div><div class="v">${deltaMv.toFixed(1)} mV</div></div>
      <div class="metric"><div class="k">${t("recommendation")}</div><div class="v"><span class="level-badge ${decision.level}" style="font-size:13px;">${decision.action[currentLang]}</span></div></div>
    </div>
    ${stopCompareHtml}
  `;
}

/* ============================================================
   Inspection Report page — professional lab-style document
   ============================================================ */
function nextDocNumber() {
  const records = getRecords();
  const d = new Date();
  const pad = n => String(n).padStart(2, "0");
  return `PK-D2532C-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${String(records.length + 1).padStart(3, "0")}`;
}

function renderReport() {
  const records = getRecords();
  const recordOptions = `<option value="">${t("reportNoRecord")}</option>` + records.slice().reverse().map(r => `<option value="${r.id}">${r.date} · ${r.vehicle} · ${r.stage === "before" ? t("stageBefore") : t("stageAfter")}</option>`).join("");
  const vehicleOptions = netaModels().map(b => `<option value="${b.vehicle}">${b.vehicle}</option>`).join("");
  const today = new Date().toISOString().slice(0, 10);

  return `
    <div class="page-head">
      <span class="eyebrow">REPORT</span>
      <h1>${t("reportTitle")}</h1>
      <p>${t("reportSubtitle")}</p>
    </div>

    <div class="panel no-print">
      <h2>${t("reportGenerate")}</h2>
      <p class="panel-sub">${t("reportNoDataHint")}</p>
      <div class="form-grid" style="margin-top:6px;">
        <div class="field" style="grid-column:1/-1;"><label>${t("reportSelectRecord")}</label><select id="rptRecordSelect">${recordOptions}</select></div>
        <div class="field"><label>${t("reportDocNo")}</label><input type="text" id="rptDocNo" value="${nextDocNumber()}"></div>
        <div class="field"><label>${t("reportDocDate")}</label><input type="date" id="rptDocDate" value="${today}"></div>
        <div class="field"><label>${t("reportCustomer")}</label><input type="text" id="rptCustomer"></div>
        <div class="field"><label>${t("fPlate")}</label><input type="text" id="rptPlate"></div>
        <div class="field"><label>${t("fVehicle")}</label><select id="rptVehicle">${vehicleOptions}</select></div>
        <div class="field"><label>${t("fTotalV")}</label><input type="number" step="0.1" id="rptTotalV"></div>
        <div class="field"><label>${t("fHighCell")}</label><input type="number" step="0.001" id="rptHighCell"></div>
        <div class="field"><label>${t("fLowCell")}</label><input type="number" step="0.001" id="rptLowCell"></div>
        <div class="field"><label>${t("fTemp")}</label><input type="number" step="0.1" id="rptTemp"></div>
        <div class="field"><label>${t("reportInspector")}</label><input type="text" id="rptInspector"></div>
        <div class="field"><label>${t("reportApprover")}</label><input type="text" id="rptApprover"></div>
      </div>
      <div class="field" style="margin-top:14px;"><label>${t("fNotes")}</label><textarea id="rptNotes"></textarea></div>
    </div>

    <div id="reportDoc" class="report-doc"></div>

    <div class="btn-row no-print">
      <button class="btn" id="reportPrint">🖨 ${t("printPage")}</button>
      <button class="btn primary" id="reportPdf">⬇ ${t("exportPdf")}</button>
    </div>
  `;
}

function reportFieldIds() {
  return ["rptDocNo", "rptDocDate", "rptCustomer", "rptPlate", "rptVehicle", "rptTotalV", "rptHighCell", "rptLowCell", "rptTemp", "rptInspector", "rptApprover", "rptNotes"];
}

function fillReportFromRecord(recordId) {
  const record = getRecords().find(r => r.id === recordId);
  if (!record) return;
  document.getElementById("rptVehicle").value = record.vehicle;
  document.getElementById("rptPlate").value = record.plate || "";
  document.getElementById("rptTotalV").value = record.totalV || "";
  document.getElementById("rptHighCell").value = record.highCell;
  document.getElementById("rptLowCell").value = record.lowCell;
  document.getElementById("rptTemp").value = record.temp || "";
  document.getElementById("rptInspector").value = record.tech || "";
  document.getElementById("rptNotes").value = record.notes || "";
}

function bindReportEvents() {
  document.getElementById("rptRecordSelect").addEventListener("change", (e) => {
    if (e.target.value) fillReportFromRecord(e.target.value);
    updateReportPreview();
  });
  reportFieldIds().forEach(id => {
    document.getElementById(id).addEventListener("input", updateReportPreview);
  });
  updateReportPreview();

  document.getElementById("reportPrint").onclick = () => window.print();
  document.getElementById("reportPdf").onclick = () => exportPanelToPdf("reportDoc", "D2532C_Inspection_Report");
}

function updateReportPreview() {
  const docNo = document.getElementById("rptDocNo").value || nextDocNumber();
  const docDate = document.getElementById("rptDocDate").value || new Date().toISOString().slice(0, 10);
  const customer = document.getElementById("rptCustomer").value;
  const plate = document.getElementById("rptPlate").value;
  const vehicle = document.getElementById("rptVehicle").value;
  const totalV = document.getElementById("rptTotalV").value;
  const highCell = parseFloat(document.getElementById("rptHighCell").value);
  const lowCell = parseFloat(document.getElementById("rptLowCell").value);
  const temp = document.getElementById("rptTemp").value;
  const inspector = document.getElementById("rptInspector").value;
  const approver = document.getElementById("rptApprover").value;
  const notes = document.getElementById("rptNotes").value;

  const hasValues = !isNaN(highCell) && !isNaN(lowCell);
  const deltaMv = hasValues ? Math.abs(highCell - lowCell) * 1000 : null;
  const decision = hasValues ? getDecision(deltaMv) : null;
  const isPass = hasValues ? deltaMv < 10 : null;

  const spec = getBatteryDB().find(b => b.vehicle === vehicle);
  const param = getParameterSettings().find(p => p.vehicle === vehicle);

  document.getElementById("reportDoc").innerHTML = `
    <div class="panel report-panel">
      <div class="report-header">
        <div class="report-brand">
          <div class="report-logo">P&amp;K</div>
          <div>
            <div class="report-company">${COMPANY_INFO.name[currentLang]}</div>
            <div class="report-tagline">${COMPANY_INFO.tagline[currentLang]}</div>
          </div>
        </div>
        <div class="report-title-block">
          <div class="report-doctype">${t("reportTitle")}</div>
          <div class="report-model">MODEL: ${DEVICE_INFO.model}</div>
        </div>
      </div>

      <table class="report-meta-table">
        <tr>
          <td><span>${t("reportDocNo")}</span><strong>${docNo}</strong></td>
          <td><span>${t("reportDocDate")}</span><strong>${docDate}</strong></td>
          <td><span>${t("reportCustomer")}</span><strong>${customer || "—"}</strong></td>
          <td><span>${t("fPlate")}</span><strong>${plate || "—"}</strong></td>
        </tr>
      </table>

      <h3 class="report-section-title">${t("reportSection1")}</h3>
      <div class="report-grid-2">
        <div>
          <table class="report-kv">
            <tr><th>${t("fVehicle")}</th><td>${vehicle || "—"}</td></tr>
            <tr><th>${t("chemistry")}</th><td>${spec ? spec.chemistry : "—"}</td></tr>
            <tr><th>${t("strings")}</th><td>${spec ? spec.strings : "—"}</td></tr>
            <tr><th>${t("nominalV")}</th><td>${spec ? spec.nominalV + " V" : "—"}</td></tr>
          </table>
        </div>
        <div>
          <table class="report-kv">
            <tr><th>${t("fTotalV")}</th><td>${totalV || "—"} V</td></tr>
            <tr><th>${t("fHighCell")}</th><td>${!isNaN(highCell) ? highCell + " V" : "—"}</td></tr>
            <tr><th>${t("fLowCell")}</th><td>${!isNaN(lowCell) ? lowCell + " V" : "—"}</td></tr>
            <tr><th>${t("fTemp")}</th><td>${temp || "—"} °C</td></tr>
          </table>
        </div>
      </div>

      <div class="report-result-strip ${hasValues ? (isPass ? "pass" : "flag") : ""}">
        <div class="rr-item"><span class="rr-k">${t("deltaV")}</span><span class="rr-v">${hasValues ? deltaMv.toFixed(1) + " mV" : "—"}</span></div>
        <div class="rr-item"><span class="rr-k">${t("recommendation")}</span><span class="rr-v">${decision ? decision.action[currentLang] : "—"}</span></div>
        <div class="rr-item"><span class="rr-k">${t("reportResultLabel")}</span><span class="rr-v">${hasValues ? (isPass ? t("reportPass") : t("reportFail")) : "—"}</span></div>
        ${param ? `<div class="rr-item"><span class="rr-k">${t("stopDeltaV")}</span><span class="rr-v">${param.stopDeltaV}</span></div>` : ""}
      </div>

      ${notes ? `<div class="report-notes"><strong>${t("fNotes")}:</strong> ${notes}</div>` : ""}

      <h3 class="report-section-title">${t("reportSection2")}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr>
            <th>${t("vehicle")}</th><th>${t("chemistry")}</th><th>${t("strings")}</th><th>${t("modules")}</th>
            <th>${t("nominalV")}</th><th>${t("capacity")}</th><th>${t("energy")}</th>
          </tr></thead>
          <tbody>
            ${netaModels().map(b => `
              <tr class="${b.vehicle === vehicle ? "row-highlight" : ""}">
                <td>${b.vehicle}</td><td>${b.chemistry}</td><td class="mono">${b.strings}</td><td class="mono">${b.modules}</td>
                <td class="mono">${b.nominalV}V</td><td class="mono">${b.capacityAh}Ah</td><td class="mono">${b.energyKwh}kWh</td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <h3 class="report-section-title">${t("reportSection3")}</h3>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ΔV</th><th class="wrap">${t("recommendation")}</th></tr></thead>
          <tbody>
            ${DECISION_TABLE.map(d => `
              <tr class="${decision && decision.label === d.label ? "row-highlight" : ""}">
                <td class="mono">${d.label}</td><td><span class="level-badge ${d.level}">${d.action[currentLang]}</span></td>
              </tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="report-signatures">
        <div class="sign-block">
          <div class="sign-line"></div>
          <div class="sign-label">${t("reportSignTech")}${inspector ? ` — ${inspector}` : ""}</div>
          <div class="sign-date">${t("reportSignDate")}: _______________</div>
        </div>
        <div class="sign-block">
          <div class="sign-line"></div>
          <div class="sign-label">${t("reportSignApprover")}${approver ? ` — ${approver}` : ""}</div>
          <div class="sign-date">${t("reportSignDate")}: _______________</div>
        </div>
      </div>

      <div class="report-footer">${t("footerNote")}</div>
    </div>
  `;
}

/* ============================================================
   Shared
   ============================================================ */
function renderFooterNote() {
  return `<div class="footer-note no-print">${t("footerNote")}</div>`;
}

/* ============================================================
   Init
   ============================================================ */
window.addEventListener("hashchange", renderApp);
window.addEventListener("DOMContentLoaded", () => {
  document.documentElement.lang = currentLang === "th" ? "th" : "en";
  renderApp();
});
