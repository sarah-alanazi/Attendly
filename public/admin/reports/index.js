const resultsHead = document.getElementById("resultsHead");
const resultsBody = document.getElementById("resultsBody");
const resultsTitle = document.getElementById("resultsTitle");
const resultsSub = document.getElementById("resultsSub");
const reportMeta = document.getElementById("reportMeta");

const chipReport = document.getElementById("chipReport");
const chipCourse = document.getElementById("chipCourse");
const chipClass = document.getElementById("chipClass");
const chipDates = document.getElementById("chipDates");
const chipCount = document.getElementById("chipCount");

const fCourse = document.getElementById("fCourse");
const fClass = document.getElementById("fClass");
const fDateFrom = document.getElementById("fDateFrom");
const fDateTo = document.getElementById("fDateTo");

const btnApplyFilters = document.getElementById("btnApplyFilters");
const btnResetFilters = document.getElementById("btnResetFilters");
const btnApplyMain = document.getElementById("btnApplyMain");
const btnReportsRefresh = document.getElementById("btnReportsRefresh");
const btnExportPdf = document.getElementById("btnExportPdf");

const filtersCanvasEl = document.getElementById("filtersCanvas");
const filtersCanvas = filtersCanvasEl ? new bootstrap.Offcanvas(filtersCanvasEl) : null;

let state = {
  type: "course_summary",
  courseId: "",
  classId: "",
  dateFrom: "",
  dateTo: ""
};

let filtersData = {
  courses: [],
  classes: []
};

let currentRows = [];

function esc(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function readJsonSafe(res) {
  const text = await res.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return null; }
}

async function fetchJson(url, { method = "GET", data = null } = {}) {
  const opts = { method, headers: {} };
  if (data && method !== "GET") {
    opts.headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(data);
  }
  const res = await fetch(url, opts);
  const json = await readJsonSafe(res);
  if (!res.ok) {
    const msg = (json && (json.message || json.error)) || `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return json;
}

function setLoading() {
  resultsHead.innerHTML = `<th>Loading...</th>`;
  resultsBody.innerHTML = `<tr><td class="text-center py-4 adm-muted">Loading...</td></tr>`;
  chipCount.textContent = `0 Results`;
}

function setEmpty(message = "No data found.") {
  resultsBody.innerHTML = `<tr><td colspan="20" class="text-center py-4 adm-muted">${esc(message)}</td></tr>`;
  chipCount.textContent = `0 Results`;
}

function getReportName(type) {
  if (type === "course_summary") return "By Course";
  if (type === "class_summary") return "By Class";
  if (type === "low_attendance") return "Low Attendance";
  if (type === "alerts_summary") return "Alerts Summary";
  return "Report";
}

function getReportTitle(type) {
  if (type === "course_summary") return "Attendance Summary by Course";
  if (type === "class_summary") return "Attendance Summary by Class";
  if (type === "low_attendance") return "Low Attendance Students";
  if (type === "alerts_summary") return "Alerts Summary";
  return "Report";
}

function getReportSub(type) {
  if (type === "course_summary") return "Grouped attendance statistics for each course";
  if (type === "class_summary") return "Grouped attendance statistics for each class section";
  if (type === "low_attendance") return "Students whose attendance is below 75%";
  if (type === "alerts_summary") return "Summary of alert types and resolution status";
  return "Filtered report data will appear below";
}

function updateCards() {
  document.querySelectorAll(".report-card").forEach(card => card.classList.remove("active"));
  const el = document.getElementById(`card-${state.type}`);
  if (el) el.classList.add("active");
}

function updateChips() {
  chipReport.textContent = `Report: ${getReportName(state.type)}`;

  const course = filtersData.courses.find(x => String(x.course_id) === String(state.courseId));
  const cls = filtersData.classes.find(x => String(x.class_id) === String(state.classId));

  chipCourse.textContent = `Course: ${course ? course.course_name : "All"}`;
  chipClass.textContent = `Class: ${cls ? `${cls.course_name} - ${cls.section}` : "All"}`;

  let dateText = "All";
  if (state.dateFrom && state.dateTo) dateText = `${state.dateFrom} → ${state.dateTo}`;
  else if (state.dateFrom) dateText = `From ${state.dateFrom}`;
  else if (state.dateTo) dateText = `Until ${state.dateTo}`;

  chipDates.textContent = `Dates: ${dateText}`;
}

function buildMetaText(total) {
  const parts = [getReportTitle(state.type)];
  if (state.courseId) {
    const course = filtersData.courses.find(x => String(x.course_id) === String(state.courseId));
    if (course) parts.push(`Course: ${course.course_name}`);
  }
  if (state.classId) {
    const cls = filtersData.classes.find(x => String(x.class_id) === String(state.classId));
    if (cls) parts.push(`Class: ${cls.course_name} - ${cls.section}`);
  }
  if (state.dateFrom) parts.push(`From: ${state.dateFrom}`);
  if (state.dateTo) parts.push(`To: ${state.dateTo}`);
  parts.push(`Rows: ${total}`);
  return parts.join(" | ");
}

function renderTable(headers, rowsHtml, total = 0) {
  resultsHead.innerHTML = headers.map(h => `<th>${esc(h)}</th>`).join("");
  resultsBody.innerHTML = rowsHtml || `<tr><td colspan="${headers.length}" class="text-center py-4 adm-muted">No data found.</td></tr>`;
  chipCount.textContent = `${total} Results`;
  reportMeta.textContent = buildMetaText(total);
}

function formatRate(rate) {
  const num = Number(rate ?? 0);
  return `${num.toFixed(2)}%`;
}

function rateBadge(rate) {
  const num = Number(rate ?? 0);
  let cls = "bg-success-subtle text-success";
  if (num < 75) cls = "bg-danger-subtle text-danger";
  else if (num < 90) cls = "bg-warning-subtle text-warning";
  return `<span class="badge rounded-pill ${cls}">${formatRate(num)}</span>`;
}

function renderCourseSummary(rows) {
  const headers = ["Course", "Classes", "Sessions", "Present", "Absent", "Late", "Attendance Rate"];
  const html = rows.map(row => `
    <tr>
      <td>
        <div class="fw-bold">${esc(row.course_name)}</div>
        <div class="adm-muted">Course ID: ${esc(row.course_id)}</div>
      </td>
      <td>${esc(row.classes_count)}</td>
      <td>${esc(row.sessions_count)}</td>
      <td><span class="adm-chip">${esc(row.present_count)}</span></td>
      <td><span class="adm-chip">${esc(row.absent_count)}</span></td>
      <td><span class="adm-chip">${esc(row.late_count)}</span></td>
      <td>${rateBadge(row.attendance_rate)}</td>
    </tr>
  `).join("");
  renderTable(headers, html, rows.length);
}

function renderClassSummary(rows) {
  const headers = ["Class", "Course", "Day", "Room", "Sessions", "Present", "Absent", "Late", "Attendance Rate"];
  const html = rows.map(row => `
    <tr>
      <td>
        <div class="fw-bold">${esc(row.section)}</div>
        <div class="adm-muted">Class ID: ${esc(row.class_id)}</div>
      </td>
      <td>${esc(row.course_name)}</td>
      <td>${esc(row.schedule_day ?? "—")}</td>
      <td>${esc(row.room ?? "—")}</td>
      <td>${esc(row.sessions_count)}</td>
      <td><span class="adm-chip">${esc(row.present_count)}</span></td>
      <td><span class="adm-chip">${esc(row.absent_count)}</span></td>
      <td><span class="adm-chip">${esc(row.late_count)}</span></td>
      <td>${rateBadge(row.attendance_rate)}</td>
    </tr>
  `).join("");
  renderTable(headers, html, rows.length);
}

function renderLowAttendance(rows) {
  const headers = ["Student", "Course", "Class", "Present", "Absent", "Late", "Total", "Attendance Rate"];
  const html = rows.map(row => `
    <tr>
      <td>
        <div class="fw-bold">${esc(row.student_name)}</div>
        <div class="adm-muted">${esc(row.email ?? "—")}</div>
      </td>
      <td>${esc(row.course_name)}</td>
      <td>
        <div class="fw-bold">${esc(row.section)}</div>
        <div class="adm-muted">Class ID: ${esc(row.class_id)}</div>
      </td>
      <td><span class="adm-chip">${esc(row.present_count)}</span></td>
      <td><span class="adm-chip">${esc(row.absent_count)}</span></td>
      <td><span class="adm-chip">${esc(row.late_count)}</span></td>
      <td>${esc(row.total_records)}</td>
      <td>${rateBadge(row.attendance_rate)}</td>
    </tr>
  `).join("");
  renderTable(headers, html, rows.length);
}

function renderAlertsSummary(rows) {
  const headers = ["Alert Type", "Total Alerts", "Resolved", "Unresolved"];
  const html = rows.map(row => `
    <tr>
      <td><div class="fw-bold">${esc(row.alert_type)}</div></td>
      <td>${esc(row.total_alerts)}</td>
      <td><span class="adm-chip">${esc(row.resolved_count)}</span></td>
      <td><span class="adm-chip">${esc(row.unresolved_count)}</span></td>
    </tr>
  `).join("");
  renderTable(headers, html, rows.length);
}

function renderReport(type, rows) {
  currentRows = Array.isArray(rows) ? rows : [];
  resultsTitle.textContent = getReportTitle(type);
  resultsSub.textContent = getReportSub(type);

  if (!currentRows.length) {
    const headers = ["No Data"];
    resultsHead.innerHTML = `<th>No Data</th>`;
    setEmpty();
    reportMeta.textContent = buildMetaText(0);
    return;
  }

  if (type === "course_summary") renderCourseSummary(currentRows);
  else if (type === "class_summary") renderClassSummary(currentRows);
  else if (type === "low_attendance") renderLowAttendance(currentRows);
  else if (type === "alerts_summary") renderAlertsSummary(currentRows);
}

async function loadFilters() {
  try {
    const res = await fetchJson("/attendly/backend/api/admin/reports/filters.php");
    if (!res?.success) throw new Error(res?.message || "Failed");

    filtersData.courses = Array.isArray(res.data?.courses) ? res.data.courses : [];
    filtersData.classes = Array.isArray(res.data?.classes) ? res.data.classes : [];

    fCourse.innerHTML = `<option value="">All Courses</option>` + filtersData.courses.map(c => {
      return `<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`;
    }).join("");

    fClass.innerHTML = `<option value="">All Classes</option>` + filtersData.classes.map(c => {
      return `<option value="${esc(c.class_id)}">${esc(c.course_name)} - ${esc(c.section)}</option>`;
    }).join("");
  } catch {
    fCourse.innerHTML = `<option value="">All Courses</option>`;
    fClass.innerHTML = `<option value="">All Classes</option>`;
  }
}

async function fetchReport() {
  setLoading();
  updateCards();
  updateChips();

  const params = new URLSearchParams();
  params.set("report_type", state.type);
  if (state.courseId) params.set("course_id", state.courseId);
  if (state.classId) params.set("class_id", state.classId);
  if (state.dateFrom) params.set("date_from", state.dateFrom);
  if (state.dateTo) params.set("date_to", state.dateTo);

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/reports/data.php?${params.toString()}`);
    if (!res?.success) throw new Error(res?.message || "Failed");
    renderReport(state.type, res.data?.items || []);
  } catch {
    resultsHead.innerHTML = `<th>Result</th>`;
    setEmpty("Failed to load report data.");
    reportMeta.textContent = buildMetaText(0);
  }
}

function syncFilterInputs() {
  fCourse.value = state.courseId;
  fClass.value = state.classId;
  fDateFrom.value = state.dateFrom;
  fDateTo.value = state.dateTo;
}

function applyFilters() {
  state.courseId = (fCourse.value || "").trim();
  state.classId = (fClass.value || "").trim();
  state.dateFrom = (fDateFrom.value || "").trim();
  state.dateTo = (fDateTo.value || "").trim();
}

function resetFilters() {
  state.courseId = "";
  state.classId = "";
  state.dateFrom = "";
  state.dateTo = "";
  syncFilterInputs();
}

function makePdfFilename() {
  const name = getReportTitle(state.type).toLowerCase().replaceAll(" ", "_");
  const date = new Date().toISOString().slice(0, 10);
  return `attendly_${name}_${date}.pdf`;
}

function exportPdf() {
  const element = document.getElementById("reportExportArea");
  if (!element) return;

  const opt = {
    margin: 0.5,
    filename: makePdfFilename(),
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "in", format: "a4", orientation: "landscape" }
  };

  html2pdf().set(opt).from(element).save();
}

document.querySelectorAll(".report-card-btn").forEach(btn => {
  btn.addEventListener("click", async () => {
    state.type = btn.getAttribute("data-type") || "course_summary";
    await fetchReport();
  });
});

btnApplyFilters?.addEventListener("click", async () => {
  applyFilters();
  filtersCanvas?.hide();
  await fetchReport();
});

btnResetFilters?.addEventListener("click", async () => {
  resetFilters();
  await fetchReport();
});

btnApplyMain?.addEventListener("click", async () => {
  await fetchReport();
});

btnReportsRefresh?.addEventListener("click", async () => {
  await loadFilters();
  syncFilterInputs();
  await fetchReport();
});

btnExportPdf?.addEventListener("click", exportPdf);

loadFilters().then(() => {
  syncFilterInputs();
  fetchReport();
});