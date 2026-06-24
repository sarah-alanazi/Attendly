const tbody = document.getElementById("coursesTbody");
const inpSearch = document.getElementById("inpSearch");

const chipSemester = document.getElementById("chipSemester");
const chipYear = document.getElementById("chipYear");
const chipCount = document.getElementById("chipCount");
const pagerInfo = document.getElementById("pagerInfo");

const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnCoursesRefresh = document.getElementById("btnCoursesRefresh");

const fSemester = document.getElementById("fSemester");
const fYear = document.getElementById("fYear");
const btnApplyFilters = document.getElementById("btnApplyFilters");
const btnResetFilters = document.getElementById("btnResetFilters");

const btnOpenCreate = document.getElementById("btnOpenCreate");

const courseModalEl = document.getElementById("courseModal");
const courseModal = courseModalEl ? new bootstrap.Modal(courseModalEl) : null;
const courseModalTitle = document.getElementById("courseModalTitle");
const courseFormErr = document.getElementById("courseFormErr");
const btnSaveCourse = document.getElementById("btnSaveCourse");

const cName = document.getElementById("cName");
const cCredits = document.getElementById("cCredits");
const cSemester = document.getElementById("cSemester");
const cYear = document.getElementById("cYear");

const detailsCanvasEl = document.getElementById("detailsCanvas");
const detailsCanvas = detailsCanvasEl ? new bootstrap.Offcanvas(detailsCanvasEl) : null;

const dName = document.getElementById("dName");
const dSub = document.getElementById("dSub");
const dCredits = document.getElementById("dCredits");
const dSemester = document.getElementById("dSemester");
const dYear = document.getElementById("dYear");

const assignTbody = document.getElementById("assignTbody");

const btnEditFromDetails = document.getElementById("btnEditFromDetails");
const btnOpenAssign = document.getElementById("btnOpenAssign");
const btnDeleteCourse = document.getElementById("btnDeleteCourse");

const assignModalEl = document.getElementById("assignModal");
const assignModal = assignModalEl ? new bootstrap.Modal(assignModalEl) : null;
const assignErr = document.getElementById("assignErr");
const aInstructor = document.getElementById("aInstructor");
const btnConfirmAssign = document.getElementById("btnConfirmAssign");

const confirmDeleteModalEl = document.getElementById("confirmDeleteModal");
const confirmDeleteModal = confirmDeleteModalEl ? new bootstrap.Modal(confirmDeleteModalEl) : null;
const btnConfirmDelete = document.getElementById("btnConfirmDelete");

let state = {
  page: 1,
  pageSize: 10,
  search: "",
  semester: "",
  year: "",
};

let currentCourses = [];
let selectedCourse = null;
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

function setLoading() {
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 adm-muted">Loading...</td></tr>`;
}

function setEmpty() {
  tbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 adm-muted">No courses found.</td></tr>`;
}

function updateChips(total = 0) {
  chipSemester.textContent = `Semester: ${state.semester ? state.semester : "All"}`;
  chipYear.textContent = `Year: ${state.year ? state.year : "All"}`;
  chipCount.textContent = `${total} Courses`;
  pagerInfo.textContent = `Page ${state.page}`;
}

function renderRows(list) {
  if (!list.length) {
    setEmpty();
    updateChips(0);
    return;
  }

  const rows = list.map(c => {
    const name = c.course_name ?? "—";
    const credits = c.credits ?? "—";
    const semester = c.semester ?? "—";
    const year = c.academic_year ?? "—";

    return `
      <tr>
        <td>
          <div class="fw-bold">${esc(name)}</div>
          <div class="adm-muted">Course ID: ${esc(c.course_id)}</div>
        </td>
        <td><span class="adm-chip">${esc(credits)}</span></td>
        <td>${esc(semester)}</td>
        <td class="adm-muted">${esc(year)}</td>
        <td class="text-end">
          <div class="d-inline-flex gap-2">
            <button class="btn btn-light border rounded-4 fw-bold px-3 btn-view" data-id="${esc(c.course_id)}" type="button">
              <i class="fa-solid fa-eye me-2"></i>View
            </button>
            <button class="btn btn-light border rounded-4 fw-bold px-3 btn-edit" data-id="${esc(c.course_id)}" type="button">
              <i class="fa-solid fa-pen me-2"></i>Edit
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  tbody.innerHTML = rows;

  tbody.querySelectorAll(".btn-view").forEach(btn => {
    btn.addEventListener("click", () => openDetails(btn.getAttribute("data-id")));
  });

  tbody.querySelectorAll(".btn-edit").forEach(btn => {
    btn.addEventListener("click", () => openEdit(btn.getAttribute("data-id")));
  });
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

async function fetchCourses() {
  setLoading();

  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  if (state.search) params.set("search", state.search);
  if (state.semester) params.set("semester", state.semester);
  if (state.year) params.set("academic_year", state.year);

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/courses/list.php?${params.toString()}`);
    if (!res?.success) throw new Error(res?.message || "Failed");

    currentCourses = Array.isArray(res.data?.items) ? res.data.items : [];
    const total = Number(res.data?.total ?? currentCourses.length);

    renderRows(currentCourses);
    updateChips(total);

    btnPrev.disabled = state.page <= 1;
    btnNext.disabled = currentCourses.length < state.pageSize;
  } catch {
    currentCourses = [];
    setEmpty();
    updateChips(0);
    btnPrev.disabled = true;
    btnNext.disabled = true;
  }
}

function findCourseById(id) {
  return currentCourses.find(c => String(c.course_id) === String(id)) || null;
}

function resetForm() {
  courseFormErr.classList.add("d-none");
  courseFormErr.textContent = "";
  cName.value = "";
  cCredits.value = "";
  cSemester.value = "";
  cYear.value = "";
}

function openCreate() {
  mode = "create";
  selectedCourse = null;
  courseModalTitle.textContent = "Add Course";
  resetForm();
  courseModal?.show();
}

function openEdit(courseId) {
  const c = findCourseById(courseId);
  if (!c) return;

  mode = "edit";
  selectedCourse = c;

  courseModalTitle.textContent = "Edit Course";
  courseFormErr.classList.add("d-none");
  courseFormErr.textContent = "";

  cName.value = String(c.course_name ?? "");
  cCredits.value = String(c.credits ?? "");
  cSemester.value = String(c.semester ?? "");
  cYear.value = String(c.academic_year ?? "");

  courseModal?.show();
}

function validateForm() {
  const name = (cName.value || "").trim();
  const credits = (cCredits.value || "").trim();
  const semester = (cSemester.value || "").trim();
  const year = (cYear.value || "").trim();

  if (!name) return "Course name is required.";
  if (!credits) return "Credits are required.";
  if (Number.isNaN(Number(credits)) || Number(credits) < 0) return "Credits must be a valid number.";
  if (!semester) return "Semester is required.";
  if (!year) return "Academic year is required.";

  return null;
}

async function saveCourse() {
  const err = validateForm();
  if (err) {
    courseFormErr.textContent = err;
    courseFormErr.classList.remove("d-none");
    return;
  }

  const payload = {
    course_name: cName.value.trim(),
    credits: Number(cCredits.value),
    semester: cSemester.value.trim(),
    academic_year: cYear.value.trim(),
  };

  try {
    btnSaveCourse.blur();

    if (mode === "create") {
      const res = await fetchJson("/attendly/backend/api/admin/courses/create.php", {
        method: "POST",
        data: payload,
      });
      if (!res?.success) throw new Error(res?.message || "Failed");
    } else {
      const res = await fetchJson("/attendly/backend/api/admin/courses/update.php", {
        method: "POST",
        data: { course_id: selectedCourse.course_id, ...payload },
      });
      if (!res?.success) throw new Error(res?.message || "Failed");
    }

    courseModal?.hide();
    await fetchCourses();
  } catch {
    courseFormErr.textContent = "Some error occured.";
    courseFormErr.classList.remove("d-none");
  }
}

function renderAssignments(list) {
  if (!list.length) {
    assignTbody.innerHTML = `<tr><td colspan="2" class="text-center py-3 adm-muted">No instructors assigned.</td></tr>`;
    return;
  }

  assignTbody.innerHTML = list.map(x => {
    const name = x.instructor_name ?? x.full_name ?? x.username ?? `#${x.instructor_id}`;
    const date = x.assigned_date ?? "—";
    return `
      <tr>
        <td>
          <div class="fw-bold">${esc(name)}</div>
          <div class="adm-muted">ID: ${esc(x.instructor_id)}</div>
        </td>
        <td class="adm-muted">${esc(date)}</td>
      </tr>
    `;
  }).join("");
}

async function openDetails(courseId) {
  const c = findCourseById(courseId);
  if (!c) return;

  selectedCourse = c;

  dName.textContent = c.course_name ?? "Course";
  dSub.textContent = `ID: ${c.course_id}`;
  dCredits.textContent = c.credits ?? "—";
  dSemester.textContent = c.semester ?? "—";
  dYear.textContent = c.academic_year ?? "—";

  assignTbody.innerHTML = `<tr><td colspan="2" class="text-center py-3 adm-muted">Loading...</td></tr>`;
  detailsCanvas?.show();

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/courses/assignments_list.php?course_id=${encodeURIComponent(c.course_id)}`);
    if (!res?.success) throw new Error("Failed");
    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    renderAssignments(items);
  } catch {
    renderAssignments([]);
  }
}

async function loadInstructorsForAssign() {
  assignErr.classList.add("d-none");
  assignErr.textContent = "";
  aInstructor.innerHTML = `<option value="">Loading...</option>`;

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/instructors/list.php`);
    if (!res?.success) throw new Error("Failed");

    const items = Array.isArray(res.data?.items) ? res.data.items : [];
    const opts = [`<option value="">Select instructor</option>`].concat(
      items.map(u => {
        const name = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username || `#${u.user_id}`;
        return `<option value="${esc(u.user_id)}">${esc(name)}</option>`;
      })
    );

    aInstructor.innerHTML = opts.join("");
  } catch {
    aInstructor.innerHTML = `<option value="">No instructors</option>`;
  }
}

function openAssign() {
  if (!selectedCourse) return;
  loadInstructorsForAssign();
  assignModal?.show();
}

async function confirmAssign() {
  if (!selectedCourse) return;

  const instructorId = (aInstructor.value || "").trim();
  if (!instructorId) {
    assignErr.textContent = "Please select an instructor.";
    assignErr.classList.remove("d-none");
    return;
  }

  try {
    btnConfirmAssign.blur();

    const res = await fetchJson("/attendly/backend/api/admin/courses/assign_instructor.php", {
      method: "POST",
      data: {
        course_id: selectedCourse.course_id,
        instructor_id: Number(instructorId),
      },
    });

    if (!res?.success) throw new Error(res?.message || "Failed");

    assignModal?.hide();
    await openDetails(selectedCourse.course_id);
  } catch {
    assignErr.textContent = "Some error occured.";
    assignErr.classList.remove("d-none");
  }
}

function askDelete() {
  confirmDeleteModal?.show();
}

async function confirmDelete() {
  if (!selectedCourse) return;

  try {
    btnConfirmDelete.blur();

    const res = await fetchJson("/attendly/backend/api/admin/courses/delete.php", {
      method: "POST",
      data: { course_id: selectedCourse.course_id },
    });

    if (!res?.success) throw new Error("Failed");

    confirmDeleteModal?.hide();
    detailsCanvas?.hide();
    await fetchCourses();
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
  await fetchCourses();
}, 350);

btnApplyFilters?.addEventListener("click", async () => {
  state.semester = (fSemester.value || "").trim();
  state.year = (fYear.value || "").trim();
  state.page = 1;
  bootstrap.Offcanvas.getInstance(document.getElementById("filtersCanvas"))?.hide();
  await fetchCourses();
});

btnResetFilters?.addEventListener("click", async () => {
  fSemester.value = "";
  fYear.value = "";
  state.semester = "";
  state.year = "";
  state.page = 1;
  await fetchCourses();
});

btnPrev?.addEventListener("click", async () => {
  if (state.page <= 1) return;
  state.page -= 1;
  await fetchCourses();
});

btnNext?.addEventListener("click", async () => {
  state.page += 1;
  await fetchCourses();
});

btnCoursesRefresh?.addEventListener("click", async () => {
  await fetchCourses();
});

inpSearch?.addEventListener("focus", () => {
  searchArmed = true;
});
inpSearch?.addEventListener("keydown", () => {
  lastTypedAt = Date.now();
});
inpSearch?.addEventListener("input", onSearch);

btnOpenCreate?.addEventListener("click", openCreate);
btnSaveCourse?.addEventListener("click", saveCourse);

btnEditFromDetails?.addEventListener("click", () => {
  if (!selectedCourse) return;
  detailsCanvas?.hide();
  setTimeout(() => openEdit(selectedCourse.course_id), 180);
});

btnOpenAssign?.addEventListener("click", openAssign);

btnDeleteCourse?.addEventListener("click", askDelete);
btnConfirmDelete?.addEventListener("click", confirmDelete);

btnConfirmAssign?.addEventListener("click", confirmAssign);

function clearSearchBoxOnLoad() {
  if (!inpSearch) return;
  inpSearch.value = "";
  inpSearch.setAttribute("autocomplete", "off");
  inpSearch.setAttribute("autocapitalize", "off");
  inpSearch.setAttribute("autocorrect", "off");
  inpSearch.setAttribute("spellcheck", "false");
}

clearSearchBoxOnLoad();
fetchCourses();