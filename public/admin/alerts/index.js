const tableHead = document.getElementById("tableHead");
const tableBody = document.getElementById("tableBody");

const chipTab = document.getElementById("chipTab");
const chipType = document.getElementById("chipType");
const chipResolved = document.getElementById("chipResolved");
const chipStatus = document.getElementById("chipStatus");
const chipDates = document.getElementById("chipDates");
const chipCount = document.getElementById("chipCount");

const cardTitle = document.getElementById("cardTitle");
const cardSub = document.getElementById("cardSub");

const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnPageRefresh = document.getElementById("btnPageRefresh");

const tabAlerts = document.getElementById("tabAlerts");
const tabAppeals = document.getElementById("tabAppeals");

const fType = document.getElementById("fType");
const fResolved = document.getElementById("fResolved");
const fAppealStatus = document.getElementById("fAppealStatus");
const fDateFrom = document.getElementById("fDateFrom");
const fDateTo = document.getElementById("fDateTo");

const btnApplyFilters = document.getElementById("btnApplyFilters");
const btnResetFilters = document.getElementById("btnResetFilters");

const alertsFilterBlock = document.getElementById("alertsFilterBlock");
const appealsFilterBlock = document.getElementById("appealsFilterBlock");

const detailsCanvasEl = document.getElementById("detailsCanvas");
const detailsCanvas = detailsCanvasEl ? new bootstrap.Offcanvas(detailsCanvasEl) : null;

const dTitle = document.getElementById("dTitle");
const dSub = document.getElementById("dSub");
const dStudent = document.getElementById("dStudent");
const dCourse = document.getElementById("dCourse");
const dClass = document.getElementById("dClass");
const dTypeStatus = document.getElementById("dTypeStatus");
const dCreatedAt = document.getElementById("dCreatedAt");
const dReason = document.getElementById("dReason");

const alertActionBlock = document.getElementById("alertActionBlock");
const appealActionBlock = document.getElementById("appealActionBlock");

const adminNote = document.getElementById("adminNote");
const btnResolveAlert = document.getElementById("btnResolveAlert");

const appealNote = document.getElementById("appealNote");
const evidenceLink = document.getElementById("evidenceLink");
const btnApproveAppeal = document.getElementById("btnApproveAppeal");
const btnRejectAppeal = document.getElementById("btnRejectAppeal");

const filtersCanvasEl = document.getElementById("filtersCanvas");
const filtersCanvas = filtersCanvasEl ? new bootstrap.Offcanvas(filtersCanvasEl) : null;

let state = {
  tab: "alerts",
  page: 1,
  pageSize: 10,
  type: "",
  resolved: "",
  appealStatus: "pending",
  dateFrom: "",
  dateTo: ""
};

let currentRows = [];
let selectedItem = null;

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
  tableHead.innerHTML = `<th>Loading...</th>`;
  tableBody.innerHTML = `<tr><td class="text-center py-4 adm-muted">Loading...</td></tr>`;
}

function setEmpty(message = "No data found.") {
  tableBody.innerHTML = `<tr><td colspan="20" class="text-center py-4 adm-muted">${esc(message)}</td></tr>`;
  chipCount.textContent = `0 Results`;
}

function formatDateText() {
  if (state.dateFrom && state.dateTo) return `${state.dateFrom} → ${state.dateTo}`;
  if (state.dateFrom) return `From ${state.dateFrom}`;
  if (state.dateTo) return `Until ${state.dateTo}`;
  return "All";
}

function updateFilterBlocks() {
  if (state.tab === "alerts") {
    alertsFilterBlock.classList.remove("d-none");
    appealsFilterBlock.classList.add("d-none");
  } else {
    alertsFilterBlock.classList.add("d-none");
    appealsFilterBlock.classList.remove("d-none");
  }
}

function updateTabButtons() {
  if (state.tab === "alerts") {
    tabAlerts.className = "btn btn-primary rounded-4 fw-bold px-4";
    tabAppeals.className = "btn btn-light border rounded-4 fw-bold px-4";
    cardTitle.textContent = "Alerts List";
    cardSub.textContent = "View attendance issues and mark them as resolved";
  } else {
    tabAlerts.className = "btn btn-light border rounded-4 fw-bold px-4";
    tabAppeals.className = "btn btn-primary rounded-4 fw-bold px-4";
    cardTitle.textContent = "Appeals List";
    cardSub.textContent = "Review attendance appeals and approve or reject them";
  }
}

function updateChips(total = 0) {
  chipTab.textContent = `Tab: ${state.tab === "alerts" ? "Alerts" : "Appeals"}`;
  chipType.textContent = `Type: ${state.type || "All"}`;
  chipResolved.textContent = `Resolved: ${state.resolved === "" ? "All" : (state.resolved === "1" ? "Resolved" : "Unresolved")}`;
  chipStatus.textContent = `Appeal Status: ${state.appealStatus || "All"}`;
  chipDates.textContent = `Dates: ${formatDateText()}`;
  chipCount.textContent = `${total} Results`;
}

function syncInputs() {
  fType.value = state.type;
  fResolved.value = state.resolved;
  fAppealStatus.value = state.appealStatus;
  fDateFrom.value = state.dateFrom;
  fDateTo.value = state.dateTo;
}

function statusBadgeResolved(value) {
  if (String(value) === "1") return `<span class="badge rounded-pill bg-success-subtle text-success">Resolved</span>`;
  return `<span class="badge rounded-pill bg-warning-subtle text-warning">Unresolved</span>`;
}

function statusBadgeAppeal(value) {
  if (value === "approved") return `<span class="badge rounded-pill bg-success-subtle text-success">Approved</span>`;
  if (value === "rejected") return `<span class="badge rounded-pill bg-danger-subtle text-danger">Rejected</span>`;
  return `<span class="badge rounded-pill bg-warning-subtle text-warning">Pending</span>`;
}

function renderAlerts(list) {
  tableHead.innerHTML = `
    <th>Student</th>
    <th>Course</th>
    <th>Class</th>
    <th>Type</th>
    <th>Created At</th>
    <th>Resolved</th>
    <th class="text-end">Actions</th>
  `;

  if (!list.length) {
    setEmpty("No alerts found.");
    return;
  }

  tableBody.innerHTML = list.map(item => `
    <tr>
      <td>
        <div class="fw-bold">${esc(item.student_name)}</div>
        <div class="adm-muted">${esc(item.student_email ?? "—")}</div>
      </td>
      <td>${esc(item.course_name ?? "—")}</td>
      <td>
        <div class="fw-bold">${esc(item.section ?? "—")}</div>
        <div class="adm-muted">Class ID: ${esc(item.class_id ?? "—")}</div>
      </td>
      <td><span class="adm-chip">${esc(item.alert_type)}</span></td>
      <td class="adm-muted">${esc(item.generated_at ?? "—")}</td>
      <td>${statusBadgeResolved(item.resolved)}</td>
      <td class="text-end">
        <button class="btn btn-light border rounded-4 fw-bold px-3 btn-view-alert" data-id="${esc(item.alert_id)}" type="button">
          <i class="fa-solid fa-eye me-2"></i>View
        </button>
      </td>
    </tr>
  `).join("");

  tableBody.querySelectorAll(".btn-view-alert").forEach(btn => {
    btn.addEventListener("click", () => openAlertDetails(btn.getAttribute("data-id")));
  });
}

function renderAppeals(list) {
  tableHead.innerHTML = `
    <th>Student</th>
    <th>Course</th>
    <th>Class</th>
    <th>Status</th>
    <th>Created At</th>
    <th class="text-end">Actions</th>
  `;

  if (!list.length) {
    setEmpty("No appeals found.");
    return;
  }

  tableBody.innerHTML = list.map(item => `
    <tr>
      <td>
        <div class="fw-bold">${esc(item.student_name)}</div>
        <div class="adm-muted">${esc(item.student_email ?? "—")}</div>
      </td>
      <td>${esc(item.course_name ?? "—")}</td>
      <td>
        <div class="fw-bold">${esc(item.section ?? "—")}</div>
        <div class="adm-muted">Record ID: ${esc(item.record_id ?? "—")}</div>
      </td>
      <td>${statusBadgeAppeal(item.status)}</td>
      <td class="adm-muted">${esc(item.created_at ?? "—")}</td>
      <td class="text-end">
        <button class="btn btn-light border rounded-4 fw-bold px-3 btn-view-appeal" data-id="${esc(item.appeal_id)}" type="button">
          <i class="fa-solid fa-eye me-2"></i>View
        </button>
      </td>
    </tr>
  `).join("");

  tableBody.querySelectorAll(".btn-view-appeal").forEach(btn => {
    btn.addEventListener("click", () => openAppealDetails(btn.getAttribute("data-id")));
  });
}

function findCurrentById(key, id) {
  return currentRows.find(x => String(x[key]) === String(id)) || null;
}

async function fetchList() {
  setLoading();
  updateTabButtons();
  updateFilterBlocks();
  updateChips();

  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  if (state.dateFrom) params.set("date_from", state.dateFrom);
  if (state.dateTo) params.set("date_to", state.dateTo);

  try {
    if (state.tab === "alerts") {
      if (state.type) params.set("type", state.type);
      if (state.resolved !== "") params.set("resolved", state.resolved);

      const res = await fetchJson(`/attendly/backend/api/admin/alerts/list.php?${params.toString()}`);
      if (!res?.success) throw new Error(res?.message || "Failed");

      currentRows = Array.isArray(res.data?.items) ? res.data.items : [];
      renderAlerts(currentRows);
      updateChips(Number(res.data?.total ?? currentRows.length));
      btnPrev.disabled = state.page <= 1;
      btnNext.disabled = currentRows.length < state.pageSize;
      return;
    }

    if (state.appealStatus !== "") params.set("status", state.appealStatus);

    const res = await fetchJson(`/attendly/backend/api/admin/appeals/list.php?${params.toString()}`);
    if (!res?.success) throw new Error(res?.message || "Failed");

    currentRows = Array.isArray(res.data?.items) ? res.data.items : [];
    renderAppeals(currentRows);
    updateChips(Number(res.data?.total ?? currentRows.length));
    btnPrev.disabled = state.page <= 1;
    btnNext.disabled = currentRows.length < state.pageSize;
  } catch {
    currentRows = [];
    setEmpty("Failed to load data.");
    btnPrev.disabled = true;
    btnNext.disabled = true;
  }
}

function fillCommonDetails(data) {
  dStudent.textContent = data.student_name || "—";
  dCourse.textContent = data.course_name || "—";
  dClass.textContent = data.section || "—";
  dCreatedAt.textContent = data.generated_at || data.created_at || "—";
  dReason.textContent = data.description || data.reason || "—";
}

async function openAlertDetails(alertId) {
  selectedItem = findCurrentById("alert_id", alertId);
  if (!selectedItem) return;

  dTitle.textContent = "Alert Details";
  dSub.textContent = `ID: ${selectedItem.alert_id}`;
  dTypeStatus.textContent = `${selectedItem.alert_type || "—"} / ${String(selectedItem.resolved) === "1" ? "Resolved" : "Unresolved"}`;
  fillCommonDetails(selectedItem);

  alertActionBlock.classList.remove("d-none");
  appealActionBlock.classList.add("d-none");
  adminNote.value = "";
  detailsCanvas?.show();

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/alerts/details.php?alert_id=${encodeURIComponent(alertId)}`);
    if (!res?.success) throw new Error("Failed");
    const item = res.data?.item || selectedItem;

    fillCommonDetails(item);
    dSub.textContent = `ID: ${item.alert_id}`;
    dTypeStatus.textContent = `${item.alert_type || "—"} / ${String(item.resolved) === "1" ? "Resolved" : "Unresolved"}`;
    adminNote.value = item.admin_note || "";
    btnResolveAlert.disabled = String(item.resolved) === "1";
  } catch {
    btnResolveAlert.disabled = String(selectedItem.resolved) === "1";
  }
}

async function openAppealDetails(appealId) {
  selectedItem = findCurrentById("appeal_id", appealId);
  if (!selectedItem) return;

  dTitle.textContent = "Appeal Details";
  dSub.textContent = `ID: ${selectedItem.appeal_id}`;
  dTypeStatus.textContent = selectedItem.status || "—";
  fillCommonDetails(selectedItem);

  alertActionBlock.classList.add("d-none");
  appealActionBlock.classList.remove("d-none");
  appealNote.value = "";
  evidenceLink.href = "#";
  evidenceLink.textContent = "No Evidence";
  detailsCanvas?.show();

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/appeals/details.php?appeal_id=${encodeURIComponent(appealId)}`);
    if (!res?.success) throw new Error("Failed");
    const item = res.data?.item || selectedItem;

    fillCommonDetails(item);
    dSub.textContent = `ID: ${item.appeal_id}`;
    dTypeStatus.textContent = item.status || "—";
    appealNote.value = item.review_note || "";
    evidenceLink.href = item.evidence_url || "#";
    evidenceLink.textContent = item.evidence_url ? "Open Evidence" : "No Evidence";

    const disabled = item.status !== "pending";
    btnApproveAppeal.disabled = disabled;
    btnRejectAppeal.disabled = disabled;
  } catch {
    const disabled = selectedItem.status !== "pending";
    btnApproveAppeal.disabled = disabled;
    btnRejectAppeal.disabled = disabled;
  }
}

async function resolveAlert() {
  if (!selectedItem) return;

  try {
    btnResolveAlert.blur();

    const res = await fetchJson("/attendly/backend/api/admin/alerts/resolve.php", {
      method: "POST",
      data: {
        alert_id: Number(selectedItem.alert_id),
        admin_note: (adminNote.value || "").trim()
      }
    });

    if (!res?.success) throw new Error(res?.message || "Failed");

    detailsCanvas?.hide();
    await fetchList();
  } catch {}
}

async function reviewAppeal(status) {
  if (!selectedItem) return;

  try {
    const res = await fetchJson("/attendly/backend/api/admin/appeals/review.php", {
      method: "POST",
      data: {
        appeal_id: Number(selectedItem.appeal_id),
        status,
        review_note: (appealNote.value || "").trim()
      }
    });

    if (!res?.success) throw new Error(res?.message || "Failed");

    detailsCanvas?.hide();
    await fetchList();
  } catch {}
}

function applyFilters() {
  state.type = (fType.value || "").trim();
  state.resolved = (fResolved.value || "").trim();
  state.appealStatus = (fAppealStatus.value || "").trim();
  state.dateFrom = (fDateFrom.value || "").trim();
  state.dateTo = (fDateTo.value || "").trim();
  state.page = 1;
}

function resetFilters() {
  state.type = "";
  state.resolved = "";
  state.appealStatus = "pending";
  state.dateFrom = "";
  state.dateTo = "";
  state.page = 1;
  syncInputs();
}

tabAlerts?.addEventListener("click", async () => {
  state.tab = "alerts";
  state.page = 1;
  updateFilterBlocks();
  updateTabButtons();
  await fetchList();
});

tabAppeals?.addEventListener("click", async () => {
  state.tab = "appeals";
  state.page = 1;
  updateFilterBlocks();
  updateTabButtons();
  await fetchList();
});

btnApplyFilters?.addEventListener("click", async () => {
  applyFilters();
  filtersCanvas?.hide();
  await fetchList();
});

btnResetFilters?.addEventListener("click", async () => {
  resetFilters();
  await fetchList();
});

btnPrev?.addEventListener("click", async () => {
  if (state.page <= 1) return;
  state.page -= 1;
  await fetchList();
});

btnNext?.addEventListener("click", async () => {
  state.page += 1;
  await fetchList();
});

btnPageRefresh?.addEventListener("click", async () => {
  await fetchList();
});

btnResolveAlert?.addEventListener("click", resolveAlert);
btnApproveAppeal?.addEventListener("click", async () => reviewAppeal("approved"));
btnRejectAppeal?.addEventListener("click", async () => reviewAppeal("rejected"));

syncInputs();
updateFilterBlocks();
updateTabButtons();
fetchList();