const tbody = document.getElementById("classesTbody");
const inpSearch = document.getElementById("inpSearch");

const chipCourse = document.getElementById("chipCourse");
const chipInstructor = document.getElementById("chipInstructor");
const chipDay = document.getElementById("chipDay");
const chipCount = document.getElementById("chipCount");
const pagerInfo = document.getElementById("pagerInfo");

const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnClassesRefresh = document.getElementById("btnClassesRefresh");
const btnOpenCreate = document.getElementById("btnOpenCreate");

const fCourse = document.getElementById("fCourse");
const fInstructor = document.getElementById("fInstructor");
const fDay = document.getElementById("fDay");
const fTimeFrom = document.getElementById("fTimeFrom");
const fTimeTo = document.getElementById("fTimeTo");
const fRoom = document.getElementById("fRoom");
const fSection = document.getElementById("fSection");
const btnApplyFilters = document.getElementById("btnApplyFilters");
const btnResetFilters = document.getElementById("btnResetFilters");

const classModalEl = document.getElementById("classModal");
const classModal = classModalEl ? new bootstrap.Modal(classModalEl) : null;
const classModalTitle = document.getElementById("classModalTitle");
const classFormErr = document.getElementById("classFormErr");
const btnSaveClass = document.getElementById("btnSaveClass");

const clCourse = document.getElementById("clCourse");
const clSection = document.getElementById("clSection");
const clDay = document.getElementById("clDay");
const clStart = document.getElementById("clStart");
const clEnd = document.getElementById("clEnd");
const clRoom = document.getElementById("clRoom");

const detailsCanvasEl = document.getElementById("detailsCanvas");
const detailsCanvas = detailsCanvasEl ? new bootstrap.Offcanvas(detailsCanvasEl) : null;

const dTitle = document.getElementById("dTitle");
const dSub = document.getElementById("dSub");
const dCourse = document.getElementById("dCourse");
const dSection = document.getElementById("dSection");
const dDay = document.getElementById("dDay");
const dTime = document.getElementById("dTime");
const dRoom = document.getElementById("dRoom");

const btnEditFromDetails = document.getElementById("btnEditFromDetails");
const btnDeleteClass = document.getElementById("btnDeleteClass");

const enrollTbody = document.getElementById("enrollTbody");
const enrollCount = document.getElementById("enrollCount");
const btnOpenAddStudent = document.getElementById("btnOpenAddStudent");
const btnRefreshEnroll = document.getElementById("btnRefreshEnroll");

const sessionsTbody = document.getElementById("sessionsTbody");
const btnRefreshSessions = document.getElementById("btnRefreshSessions");

const btnRefreshSummary = document.getElementById("btnRefreshSummary");
const sumPresent = document.getElementById("sumPresent");
const sumLate = document.getElementById("sumLate");
const sumAbsent = document.getElementById("sumAbsent");
const relGreen = document.getElementById("relGreen");
const relYellow = document.getElementById("relYellow");
const relRed = document.getElementById("relRed");

const addStudentModalEl = document.getElementById("addStudentModal");
const addStudentModal = addStudentModalEl ? new bootstrap.Modal(addStudentModalEl) : null;
const addStudentErr = document.getElementById("addStudentErr");
const stuSearch = document.getElementById("stuSearch");
const stuResults = document.getElementById("stuResults");

const sessionRecordsModalEl = document.getElementById("sessionRecordsModal");
const sessionRecordsModal = sessionRecordsModalEl ? new bootstrap.Modal(sessionRecordsModalEl) : null;
const srSub = document.getElementById("srSub");
const srTbody = document.getElementById("srTbody");

const confirmDeleteModalEl = document.getElementById("confirmDeleteModal");
const confirmDeleteModal = confirmDeleteModalEl ? new bootstrap.Modal(confirmDeleteModalEl) : null;
const btnConfirmDelete = document.getElementById("btnConfirmDelete");

let state = {
  page: 1,
  pageSize: 10,
  search: "",
  course_id: "",
  instructor_id: "",
  day: "",
  time_from: "",
  time_to: "",
  room: "",
  section: ""
};

let currentClasses = [];
let selectedClass = null;
let mode = "create";

let searchArmed = false;
let lastTypedAt = 0;

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
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 adm-muted">Loading...</td></tr>`;
}

function setEmpty() {
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 adm-muted">No classes found.</td></tr>`;
}

function updateChips(total = 0) {
  const courseTxt = state.course_id ? `#${state.course_id}` : "All";
  const instTxt = state.instructor_id ? `#${state.instructor_id}` : "All";
  chipCourse.textContent = `Course: ${courseTxt}`;
  chipInstructor.textContent = `Instructor: ${instTxt}`;
  chipDay.textContent = `Day: ${state.day || "All"}`;
  chipCount.textContent = `${total} Classes`;
  pagerInfo.textContent = `Page ${state.page}`;
}

function renderRows(list) {
  if (!list.length) {
    setEmpty();
    updateChips(0);
    return;
  }

  tbody.innerHTML = list.map(x => {
    const course = x.course_name ?? `Course #${x.course_id}`;
    const section = x.section ?? "—";
    const schedule = `${x.schedule_day ?? "—"} • ${x.start_time ?? "—"} - ${x.end_time ?? "—"}`;
    const room = x.room ?? "—";
    const instructors = x.instructors_text ?? "—";

    return `
      <tr>
        <td>
          <div class="fw-bold">${esc(course)}</div>
          <div class="adm-muted">Course ID: ${esc(x.course_id)}</div>
        </td>
        <td><span class="adm-chip">${esc(section)}</span></td>
        <td>${esc(schedule)}</td>
        <td class="adm-muted">${esc(room)}</td>
        <td>${esc(instructors)}</td>
        <td class="text-end">
          <div class="d-inline-flex gap-2">
            <button class="btn btn-light border rounded-4 fw-bold px-3 btn-view" data-id="${esc(x.class_id)}" type="button">
              <i class="fa-solid fa-eye me-2"></i>View
            </button>
            <button class="btn btn-light border rounded-4 fw-bold px-3 btn-edit" data-id="${esc(x.class_id)}" type="button">
              <i class="fa-solid fa-pen me-2"></i>Edit
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.querySelectorAll(".btn-view").forEach(b => b.addEventListener("click", () => openDetails(b.dataset.id)));
  tbody.querySelectorAll(".btn-edit").forEach(b => b.addEventListener("click", () => openEdit(b.dataset.id)));
}

async function loadFiltersDropdowns() {
  try {
    const cRes = await fetchJson("/attendly/backend/api/admin/courses/list_simple.php");
    const items = Array.isArray(cRes?.data?.items) ? cRes.data.items : [];
    fCourse.innerHTML = `<option value="">All</option>` + items.map(c =>
      `<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`
    ).join("");
    clCourse.innerHTML = `<option value="">Select course</option>` + items.map(c =>
      `<option value="${esc(c.course_id)}">${esc(c.course_name)}</option>`
    ).join("");
  } catch {
    fCourse.innerHTML = `<option value="">All</option>`;
    clCourse.innerHTML = `<option value="">Select course</option>`;
  }

  try {
    const iRes = await fetchJson("/attendly/backend/api/admin/instructors/list.php");
    const items = Array.isArray(iRes?.data?.items) ? iRes.data.items : [];
    fInstructor.innerHTML = `<option value="">All</option>` + items.map(u => {
      const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username || `#${u.user_id}`;
      return `<option value="${esc(u.user_id)}">${esc(name)}</option>`;
    }).join("");
  } catch {
    fInstructor.innerHTML = `<option value="">All</option>`;
  }
}

async function fetchClasses() {
  setLoading();

  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  if (state.search) params.set("search", state.search);
  if (state.course_id) params.set("course_id", state.course_id);
  if (state.instructor_id) params.set("instructor_id", state.instructor_id);
  if (state.day) params.set("day", state.day);
  if (state.time_from) params.set("time_from", state.time_from);
  if (state.time_to) params.set("time_to", state.time_to);
  if (state.room) params.set("room", state.room);
  if (state.section) params.set("section", state.section);

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/classes/list.php?${params.toString()}`);
    if (!res?.success) throw new Error(res?.message || "Failed");

    currentClasses = Array.isArray(res.data?.items) ? res.data.items : [];
    const total = Number(res.data?.total ?? currentClasses.length);

    renderRows(currentClasses);
    updateChips(total);

    btnPrev.disabled = state.page <= 1;
    btnNext.disabled = currentClasses.length < state.pageSize;
  } catch {
    currentClasses = [];
    setEmpty();
    updateChips(0);
    btnPrev.disabled = true;
    btnNext.disabled = true;
  }
}

function findById(id) {
  return currentClasses.find(x => String(x.class_id) === String(id)) || null;
}

function resetClassForm() {
  classFormErr.classList.add("d-none");
  classFormErr.textContent = "";
  clCourse.value = "";
  clSection.value = "";
  clDay.value = "";
  clStart.value = "";
  clEnd.value = "";
  clRoom.value = "";
}

function openCreate() {
  mode = "create";
  selectedClass = null;
  classModalTitle.textContent = "Add Class";
  resetClassForm();
  classModal?.show();
}

function openEdit(classId) {
  const x = findById(classId);
  if (!x) return;

  mode = "edit";
  selectedClass = x;

  classModalTitle.textContent = "Edit Class";
  classFormErr.classList.add("d-none");
  classFormErr.textContent = "";

  clCourse.value = String(x.course_id ?? "");
  clSection.value = String(x.section ?? "");
  clDay.value = String(x.schedule_day ?? "");
  clStart.value = String(x.start_time ?? "");
  clEnd.value = String(x.end_time ?? "");
  clRoom.value = String(x.room ?? "");

  classModal?.show();
}

function validateClassForm() {
  const course_id = (clCourse.value || "").trim();
  const section = (clSection.value || "").trim();
  const day = (clDay.value || "").trim();
  const start = (clStart.value || "").trim();
  const end = (clEnd.value || "").trim();
  const room = (clRoom.value || "").trim();

  if (!course_id) return "Course is required.";
  if (!section) return "Section is required.";
  if (!day) return "Day is required.";
  if (!start) return "Start time is required.";
  if (!end) return "End time is required.";
  if (start >= end) return "End time must be after start time.";
  if (!room) return "Room is required.";
  return null;
}

async function saveClass() {
  const err = validateClassForm();
  if (err) {
    classFormErr.textContent = err;
    classFormErr.classList.remove("d-none");
    return;
  }

  const payload = {
    course_id: Number(clCourse.value),
    section: clSection.value.trim(),
    schedule_day: clDay.value.trim(),
    start_time: clStart.value.trim(),
    end_time: clEnd.value.trim(),
    room: clRoom.value.trim()
  };

  try {
    btnSaveClass.blur();

    if (mode === "create") {
      const res = await fetchJson("/attendly/backend/api/admin/classes/create.php", { method: "POST", data: payload });
      if (!res?.success) throw new Error(res?.message || "Failed");
    } else {
      const res = await fetchJson("/attendly/backend/api/admin/classes/update.php", {
        method: "POST",
        data: { class_id: selectedClass.class_id, ...payload }
      });
      if (!res?.success) throw new Error(res?.message || "Failed");
    }

    classModal?.hide();
    await fetchClasses();
  } catch {
    classFormErr.textContent = "Some error occured.";
    classFormErr.classList.remove("d-none");
  }
}

async function openDetails(classId) {
  const x = findById(classId);
  if (!x) return;
  selectedClass = x;

  dTitle.textContent = `${x.course_name ?? "Class"} • ${x.section ?? ""}`.trim();
  dSub.textContent = `ID: ${x.class_id}`;

  dCourse.textContent = x.course_name ?? `Course #${x.course_id}`;
  dSection.textContent = x.section ?? "—";
  dDay.textContent = x.schedule_day ?? "—";
  dTime.textContent = `${x.start_time ?? "—"} - ${x.end_time ?? "—"}`;
  dRoom.textContent = x.room ?? "—";

  enrollTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 adm-muted">Loading...</td></tr>`;
  sessionsTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 adm-muted">Loading...</td></tr>`;
  sumPresent.textContent = "0";
  sumLate.textContent = "0";
  sumAbsent.textContent = "0";
  relGreen.textContent = "Green: 0";
  relYellow.textContent = "Yellow: 0";
  relRed.textContent = "Red: 0";
  enrollCount.textContent = "0";

  detailsCanvas?.show();

  await Promise.all([
    fetchEnrollment(),
    fetchSessions(),
    fetchSummary()
  ]);
}

async function fetchEnrollment() {
  if (!selectedClass) return;
  try {
    const res = await fetchJson(`/attendly/backend/api/admin/classes/enrollment_list.php?class_id=${encodeURIComponent(selectedClass.class_id)}`);
    if (!res?.success) throw new Error("Failed");
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    enrollCount.textContent = String(items.length);

    if (!items.length) {
      enrollTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 adm-muted">No students enrolled.</td></tr>`;
      return;
    }

    enrollTbody.innerHTML = items.map(it => {
        const name =
        (it.student_name ??
         `${it.first_name ?? ""} ${it.last_name ?? ""}`.trim()) 
        || it.username 
        || `#${it.student_id}`;
      const st = (it.status ?? "").toLowerCase() === "dropped"
        ? `<span class="adm-chip">Dropped</span>`
        : `<span class="adm-chip ok">Enrolled</span>`;
      const enrolledAt = it.enrolled_at ?? "—";
      return `
        <tr>
          <td>
            <div class="fw-bold">${esc(name)}</div>
            <div class="adm-muted">ID: ${esc(it.student_id)}</div>
          </td>
          <td>${st}</td>
          <td class="adm-muted">${esc(enrolledAt)}</td>
          <td class="text-end">
            <button class="btn btn-outline-danger rounded-4 fw-bold px-3 btn-remove-stu" data-enrollment="${esc(it.enrollment_id)}" type="button">
              <i class="fa-solid fa-user-minus me-2"></i>Remove
            </button>
          </td>
        </tr>
      `;
    }).join("");

    enrollTbody.querySelectorAll(".btn-remove-stu").forEach(b => {
      b.addEventListener("click", () => removeStudent(b.dataset.enrollment));
    });

  } catch {
    enrollTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 adm-muted">Failed to load enrollment.</td></tr>`;
  }
}

async function fetchSessions() {
  if (!selectedClass) return;
  try {
    const res = await fetchJson(`/attendly/backend/api/admin/classes/sessions_list.php?class_id=${encodeURIComponent(selectedClass.class_id)}`);
    if (!res?.success) throw new Error("Failed");
    const items = Array.isArray(res.data?.items) ? res.data.items : [];

    if (!items.length) {
      sessionsTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 adm-muted">No sessions yet.</td></tr>`;
      return;
    }

    sessionsTbody.innerHTML = items.map(s => {
      const date = s.session_date ?? "—";
      const time = `${s.start_time ?? "—"} - ${s.end_time ?? "—"}`;
      const status = (s.status ?? "").toLowerCase() === "active"
        ? `<span class="adm-chip ok">Active</span>`
        : `<span class="adm-chip">Closed</span>`;
      return `
        <tr>
          <td class="fw-bold">${esc(date)}</td>
          <td class="adm-muted">${esc(time)}</td>
          <td>${status}</td>
          <td class="text-end">
            <button class="btn btn-light border rounded-4 fw-bold px-3 btn-view-records" data-session="${esc(s.session_id)}" type="button">
              <i class="fa-solid fa-list-check me-2"></i>View Records
            </button>
          </td>
        </tr>
      `;
    }).join("");

    sessionsTbody.querySelectorAll(".btn-view-records").forEach(b => {
      b.addEventListener("click", () => openSessionRecords(b.dataset.session));
    });

  } catch {
    sessionsTbody.innerHTML = `<tr><td colspan="4" class="text-center py-4 adm-muted">Failed to load sessions.</td></tr>`;
  }
}

async function fetchSummary() {
  if (!selectedClass) return;
  try {
    const res = await fetchJson(`/attendly/backend/api/admin/classes/records_summary.php?class_id=${encodeURIComponent(selectedClass.class_id)}`);
    if (!res?.success) throw new Error("Failed");

    const d = res.data || {};
    sumPresent.textContent = String(d.present ?? 0);
    sumLate.textContent = String(d.late ?? 0);
    sumAbsent.textContent = String(d.absent ?? 0);

    relGreen.textContent = `Green: ${d.rel_green ?? 0}`;
    relYellow.textContent = `Yellow: ${d.rel_yellow ?? 0}`;
    relRed.textContent = `Red: ${d.rel_red ?? 0}`;
  } catch {}
}

function openAddStudent() {
  if (!selectedClass) return;
  addStudentErr.classList.add("d-none");
  addStudentErr.textContent = "";
  stuSearch.value = "";
  stuResults.innerHTML = "";
  addStudentModal?.show();
}

async function searchStudents(q) {
  if (!selectedClass) return;
  const query = (q || "").trim();
  if (!query || query.length < 2) {
    stuResults.innerHTML = `<div class="adm-muted">Type at least 2 characters.</div>`;
    return;
  }

  stuResults.innerHTML = `<div class="adm-muted">Searching...</div>`;

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/students/search.php?q=${encodeURIComponent(query)}&limit=10`);
    if (!res?.success) throw new Error("Failed");
    const items = Array.isArray(res.data?.items) ? res.data.items : [];

    if (!items.length) {
      stuResults.innerHTML = `<div class="adm-muted">No students found.</div>`;
      return;
    }

    stuResults.innerHTML = items.map(s => {
      const name = `${s.first_name ?? ""} ${s.last_name ?? ""}`.trim() || s.username || `#${s.user_id}`;
      const sub = s.email ? s.email : s.username;
      return `
        <button type="button" class="list-group-item list-group-item-action rounded-4 mb-2 border btn-pick-stu"
                data-id="${esc(s.user_id)}">
          <div class="fw-bold">${esc(name)}</div>
          <div class="adm-muted">${esc(sub)}</div>
        </button>
      `;
    }).join("");

    stuResults.querySelectorAll(".btn-pick-stu").forEach(b => {
      b.addEventListener("click", () => addStudentToClass(b.dataset.id));
    });

  } catch {
    stuResults.innerHTML = `<div class="adm-muted">Search failed.</div>`;
  }
}

async function addStudentToClass(studentId) {
  if (!selectedClass) return;

  try {
    const res = await fetchJson("/attendly/backend/api/admin/classes/enrollment_add.php", {
      method: "POST",
      data: { class_id: selectedClass.class_id, student_id: Number(studentId) }
    });
    if (!res?.success) throw new Error(res?.message || "Failed");

    addStudentModal?.hide();
    await fetchEnrollment();
  } catch (e) {
    addStudentErr.textContent = e?.message || "Failed to add student.";
    addStudentErr.classList.remove("d-none");
  }
}

async function removeStudent(enrollmentId) {
  if (!selectedClass) return;

  try {
    const res = await fetchJson("/attendly/backend/api/admin/classes/enrollment_remove.php", {
      method: "POST",
      data: { enrollment_id: Number(enrollmentId) }
    });
    if (!res?.success) throw new Error(res?.message || "Failed");
    await fetchEnrollment();
  } catch {}
}

async function openSessionRecords(sessionId) {
  srSub.textContent = `Session ID: ${sessionId}`;
  srTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 adm-muted">Loading...</td></tr>`;
  sessionRecordsModal?.show();

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/sessions/records_list.php?session_id=${encodeURIComponent(sessionId)}`);
    if (!res?.success) throw new Error("Failed");
    const items = Array.isArray(res.data?.items) ? res.data.items : [];

    if (!items.length) {
      srTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 adm-muted">No records found.</td></tr>`;
      return;
    }

    srTbody.innerHTML = items.map(r => {
        const name =
        (r.student_name ??
         `${r.first_name ?? ""} ${r.last_name ?? ""}`.trim())
        || r.username
        || `#${r.student_id}`;
      const st = (r.status ?? "").toLowerCase();
      const badge = st === "present"
        ? `<span class="adm-chip ok">Present</span>`
        : (st === "late" ? `<span class="adm-chip">Late</span>` : `<span class="adm-chip">Absent</span>`);
      const scanAt = r.scan_at ?? "—";
      const within = String(r.within_campus ?? 0) === "1" ? "Yes" : "No";
      const rel = (r.reliability_color ?? "—");
      return `
        <tr>
          <td>
            <div class="fw-bold">${esc(name)}</div>
            <div class="adm-muted">ID: ${esc(r.student_id)}</div>
          </td>
          <td>${badge}</td>
          <td class="adm-muted">${esc(scanAt)}</td>
          <td class="adm-muted">${esc(within)}</td>
         <td class="adm-muted" style="color:${rel}">${esc(rel)}</td>
        </tr>
      `;
    }).join("");

  } catch {
    srTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 adm-muted">Failed to load records.</td></tr>`;
  }
}

function askDelete() {
  confirmDeleteModal?.show();
}

async function confirmDelete() {
  if (!selectedClass) return;

  try {
    const res = await fetchJson("/attendly/backend/api/admin/classes/delete.php", {
      method: "POST",
      data: { class_id: selectedClass.class_id }
    });
    if (!res?.success) throw new Error(res?.message || "Failed");

    confirmDeleteModal?.hide();
    detailsCanvas?.hide();
    await fetchClasses();
  } catch {
    confirmDeleteModal?.hide();
  }
}

function debounce(fn, ms = 350) {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

const onSearch = debounce(async () => {
  if (!searchArmed) return;
  if (document.activeElement !== inpSearch) return;
  if (Date.now() - lastTypedAt > 1500) return;

  state.search = (inpSearch.value || "").trim();
  state.page = 1;
  await fetchClasses();
}, 350);

const onStudentSearch = debounce(async () => {
  await searchStudents(stuSearch.value || "");
}, 350);

btnApplyFilters?.addEventListener("click", async () => {
  state.course_id = fCourse.value || "";
  state.instructor_id = fInstructor.value || "";
  state.day = fDay.value || "";
  state.time_from = fTimeFrom.value || "";
  state.time_to = fTimeTo.value || "";
  state.room = (fRoom.value || "").trim();
  state.section = (fSection.value || "").trim();
  state.page = 1;

  bootstrap.Offcanvas.getInstance(document.getElementById("filtersCanvas"))?.hide();
  await fetchClasses();
});

btnResetFilters?.addEventListener("click", async () => {
  fCourse.value = "";
  fInstructor.value = "";
  fDay.value = "";
  fTimeFrom.value = "";
  fTimeTo.value = "";
  fRoom.value = "";
  fSection.value = "";

  state.course_id = "";
  state.instructor_id = "";
  state.day = "";
  state.time_from = "";
  state.time_to = "";
  state.room = "";
  state.section = "";
  state.page = 1;

  await fetchClasses();
});

btnPrev?.addEventListener("click", async () => {
  if (state.page <= 1) return;
  state.page -= 1;
  await fetchClasses();
});

btnNext?.addEventListener("click", async () => {
  state.page += 1;
  await fetchClasses();
});

btnClassesRefresh?.addEventListener("click", async () => {
  await fetchClasses();
});

btnOpenCreate?.addEventListener("click", openCreate);
btnSaveClass?.addEventListener("click", saveClass);

btnEditFromDetails?.addEventListener("click", () => {
  if (!selectedClass) return;
  detailsCanvas?.hide();
  setTimeout(() => openEdit(selectedClass.class_id), 180);
});

btnDeleteClass?.addEventListener("click", askDelete);
btnConfirmDelete?.addEventListener("click", confirmDelete);

btnOpenAddStudent?.addEventListener("click", openAddStudent);
btnRefreshEnroll?.addEventListener("click", fetchEnrollment);

btnRefreshSessions?.addEventListener("click", fetchSessions);
btnRefreshSummary?.addEventListener("click", fetchSummary);

inpSearch?.addEventListener("focus", () => { searchArmed = true; });
inpSearch?.addEventListener("keydown", () => { lastTypedAt = Date.now(); });
inpSearch?.addEventListener("input", onSearch);

stuSearch?.addEventListener("input", onStudentSearch);

function clearSearchBoxOnLoad() {
  if (!inpSearch) return;
  inpSearch.value = "";
  inpSearch.setAttribute("autocomplete", "off");
  inpSearch.setAttribute("autocapitalize", "off");
  inpSearch.setAttribute("autocorrect", "off");
  inpSearch.setAttribute("spellcheck", "false");
}

clearSearchBoxOnLoad();
await loadFiltersDropdowns();
fetchClasses();