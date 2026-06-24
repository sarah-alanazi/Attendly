const tbody = document.getElementById("usersTbody");
const inpSearch = document.getElementById("inpSearch");
const chipRole = document.getElementById("chipRole");
const chipStatus = document.getElementById("chipStatus");
const chipCount = document.getElementById("chipCount");
const pagerInfo = document.getElementById("pagerInfo");
const btnPrev = document.getElementById("btnPrev");
const btnNext = document.getElementById("btnNext");
const btnUsersRefresh = document.getElementById("btnUsersRefresh");

const fRole = document.getElementById("fRole");
const fStatus = document.getElementById("fStatus");
const btnApplyFilters = document.getElementById("btnApplyFilters");
const btnResetFilters = document.getElementById("btnResetFilters");

const btnOpenCreate = document.getElementById("btnOpenCreate");

const userModalEl = document.getElementById("userModal");
const userModal = userModalEl ? new bootstrap.Modal(userModalEl) : null;
const userModalTitle = document.getElementById("userModalTitle");
const userFormErr = document.getElementById("userFormErr");
const btnSaveUser = document.getElementById("btnSaveUser");

const uRole = document.getElementById("uRole");
const uUsername = document.getElementById("uUsername");
const uPassword = document.getElementById("uPassword");
const passWrap = document.getElementById("passWrap");
const uFirst = document.getElementById("uFirst");
const uLast = document.getElementById("uLast");
const uEmail = document.getElementById("uEmail");
const uActive = document.getElementById("uActive");

const detailsCanvasEl = document.getElementById("detailsCanvas");
const detailsCanvas = detailsCanvasEl ? new bootstrap.Offcanvas(detailsCanvasEl) : null;

const dName = document.getElementById("dName");
const dSub = document.getElementById("dSub");
const dUsername = document.getElementById("dUsername");
const dEmail = document.getElementById("dEmail");
const dRole = document.getElementById("dRole");
const dStatus = document.getElementById("dStatus");
const dCreated = document.getElementById("dCreated");

const btnEditFromDetails = document.getElementById("btnEditFromDetails");
const btnToggleStatus = document.getElementById("btnToggleStatus");
const btnDeleteFromDetails = document.getElementById("btnDeleteFromDetails");

const confirmDeleteModalEl = document.getElementById("confirmDeleteModal");
const confirmDeleteModal = confirmDeleteModalEl ? new bootstrap.Modal(confirmDeleteModalEl) : null;
const btnConfirmDelete = document.getElementById("btnConfirmDelete");

let state = {
  page: 1,
  pageSize: 10,
  search: "",
  role: "",
  status: "",
};

let currentUsers = [];
let selectedUser = null;
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

function fmtRole(role) {
  const r = String(role ?? "").toLowerCase();
  if (r === "instructor") return "Instructor";
  if (r === "student") return "Student";
  return "—";
}

function fmtStatus(val) {
  const v = String(val ?? "").toLowerCase();
  if (v === "1" || v === "true" || v === "active") return { text: "Active", cls: "ok" };
  if (v === "0" || v === "false" || v === "suspended") return { text: "Suspended", cls: "" };
  return { text: "—", cls: "" };
}

function setLoading() {
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 adm-muted">Loading...</td></tr>`;
}

function setEmpty() {
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4 adm-muted">No users found.</td></tr>`;
}

function updateChips(total = 0) {
  chipRole.textContent = `Role: ${state.role ? fmtRole(state.role) : "All"}`;
  chipStatus.textContent = `Status: ${state.status ? (state.status === "active" ? "Active" : "Suspended") : "All"}`;
  chipCount.textContent = `${total} Users`;
  pagerInfo.textContent = `Page ${state.page}`;
}

function renderRows(list) {
  if (!list.length) {
    setEmpty();
    updateChips(0);
    return;
  }

  const rows = list.map(u => {
    const full = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username || "—";
    const email = u.email ?? "—";
    const role = fmtRole(u.role);
    const st = fmtStatus(u.is_active);
    const created = u.created_at ?? "—";

    const badge = st.cls === "ok"
      ? `<span class="adm-chip ok">Active</span>`
      : `<span class="adm-chip">Suspended</span>`;

    return `
      <tr>
        <td>
          <div class="fw-bold">${esc(full)}</div>
          <div class="adm-muted">${esc(u.username ?? "")}</div>
        </td>
        <td>${esc(email)}</td>
        <td><span class="adm-chip">${esc(role)}</span></td>
        <td>${badge}</td>
        <td class="adm-muted">${esc(created)}</td>
        <td class="text-end">
          <div class="d-inline-flex gap-2">
            <button class="btn btn-light border rounded-4 fw-bold px-3 btn-view" data-id="${esc(u.user_id)}" type="button">
              <i class="fa-solid fa-eye me-2"></i>View
            </button>
            <button class="btn btn-light border rounded-4 fw-bold px-3 btn-edit" data-id="${esc(u.user_id)}" type="button">
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

async function fetchUsers() {
  setLoading();

  const params = new URLSearchParams();
  params.set("page", String(state.page));
  params.set("pageSize", String(state.pageSize));
  if (state.search) params.set("search", state.search);
  if (state.role) params.set("role", state.role);
  if (state.status) params.set("status", state.status);

  try {
    const res = await fetchJson(`/attendly/backend/api/admin/users/list.php?${params.toString()}`);
    if (!res?.success) throw new Error(res?.message || "Failed");

    currentUsers = Array.isArray(res.data?.items) ? res.data.items : [];
    const total = Number(res.data?.total ?? currentUsers.length);

    renderRows(currentUsers);
    updateChips(total);

    btnPrev.disabled = state.page <= 1;
    btnNext.disabled = currentUsers.length < state.pageSize;
  } catch {
    currentUsers = [];
    setEmpty();
    updateChips(0);
    btnPrev.disabled = true;
    btnNext.disabled = true;
  }
}

function findUserById(id) {
  return currentUsers.find(u => String(u.user_id) === String(id)) || null;
}

function openDetails(userId) {
  const u = findUserById(userId);
  if (!u) return;

  selectedUser = u;

  const full = `${u.first_name ?? ""} ${u.last_name ?? ""}`.trim() || u.username || "User";
  dName.textContent = full;
  dSub.textContent = `ID: ${u.user_id}`;

  dUsername.textContent = u.username ?? "—";
  dEmail.textContent = u.email ?? "—";
  dRole.textContent = fmtRole(u.role);

  const st = fmtStatus(u.is_active);
  dStatus.textContent = st.text;
  dCreated.textContent = u.created_at ?? "—";

  if (st.text === "Active") {
    btnToggleStatus.className = "btn btn-warning rounded-4 fw-bold flex-fill";
    btnToggleStatus.innerHTML = `<i class="fa-solid fa-ban me-2"></i>Suspend`;
  } else {
    btnToggleStatus.className = "btn btn-success rounded-4 fw-bold flex-fill";
    btnToggleStatus.innerHTML = `<i class="fa-solid fa-circle-check me-2"></i>Activate`;
  }

  detailsCanvas?.show();
}

function resetForm() {
  userFormErr.classList.add("d-none");
  userFormErr.textContent = "";

  uRole.value = "student";
  uUsername.value = "";
  uPassword.value = "";
  uFirst.value = "";
  uLast.value = "";
  uEmail.value = "";
  uActive.value = "1";
}

function openCreate() {
  mode = "create";
  selectedUser = null;

  userModalTitle.textContent = "Add User";
  passWrap.classList.remove("d-none");
  uPassword.value = "";

  resetForm();
  userModal?.show();
}

function openEdit(userId) {
  const u = findUserById(userId);
  if (!u) return;

  mode = "edit";
  selectedUser = u;

  userModalTitle.textContent = "Edit User";
  passWrap.classList.add("d-none");
  userFormErr.classList.add("d-none");
  userFormErr.textContent = "";

  uRole.value = String(u.role ?? "student");
  uUsername.value = String(u.username ?? "");
  uFirst.value = String(u.first_name ?? "");
  uLast.value = String(u.last_name ?? "");
  uEmail.value = String(u.email ?? "");
  uActive.value = String((u.is_active ?? 1) ? "1" : "0");

  userModal?.show();
}

function validateForm() {
  const role = (uRole.value || "").trim();
  const username = (uUsername.value || "").trim();
  const pass = (uPassword.value || "").trim();
  const first = (uFirst.value || "").trim();
  const last = (uLast.value || "").trim();
  const email = (uEmail.value || "").trim();

  if (!role) return "Role is required.";
  if (!username) return "Username is required.";
  if (mode === "create" && !pass) return "Password is required for new user.";
  if (!first) return "First name is required.";
  if (!last) return "Last name is required.";
  if (!email) return "Email is required.";

  const okEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!okEmail) return "Invalid email format.";

  return null;
}

async function saveUser() {
  const err = validateForm();
  if (err) {
    userFormErr.textContent = err;
    userFormErr.classList.remove("d-none");
    return;
  }

  const payload = {
    role: uRole.value,
    username: uUsername.value.trim(),
    password: uPassword.value.trim(),
    first_name: uFirst.value.trim(),
    last_name: uLast.value.trim(),
    email: uEmail.value.trim(),
    is_active: Number(uActive.value) === 1 ? 1 : 0,
  };

  try {
    btnSaveUser.blur();

    if (mode === "create") {
      const res = await fetchJson("/attendly/backend/api/admin/users/create.php", {
        method: "POST",
        data: payload,
      });
      if (!res?.success) throw new Error(res?.message || "Failed");
    } else {
      const res = await fetchJson("/attendly/backend/api/admin/users/update.php", {
        method: "POST",
        data: { user_id: selectedUser.user_id, ...payload, password: "" },
      });
      if (!res?.success) throw new Error(res?.message || "Failed");
    }

    userModal?.hide();
    await fetchUsers();
  } catch {
    userFormErr.textContent = "Some error occured.";
    userFormErr.classList.remove("d-none");
  }
}

async function toggleStatus() {
  if (!selectedUser) return;

  try {
    const res = await fetchJson("/attendly/backend/api/admin/users/toggle_status.php", {
      method: "POST",
      data: { user_id: selectedUser.user_id },
    });
    if (!res?.success) throw new Error("Failed");

    detailsCanvas?.hide();
    await fetchUsers();
  } catch {}
}

function askDelete() {
  confirmDeleteModal?.show();
}

async function confirmDelete() {
  if (!selectedUser) return;

  try {
    btnConfirmDelete.blur();

    const res = await fetchJson("/attendly/backend/api/admin/users/delete.php", {
      method: "POST",
      data: { user_id: selectedUser.user_id },
    });
    if (!res?.success) throw new Error("Failed");

    confirmDeleteModal?.hide();
    detailsCanvas?.hide();
    await fetchUsers();
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
  await fetchUsers();
}, 350);

btnApplyFilters?.addEventListener("click", async () => {
  state.role = fRole.value || "";
  state.status = fStatus.value || "";
  state.page = 1;
  bootstrap.Offcanvas.getInstance(document.getElementById("filtersCanvas"))?.hide();
  await fetchUsers();
});

btnResetFilters?.addEventListener("click", async () => {
  fRole.value = "";
  fStatus.value = "";
  state.role = "";
  state.status = "";
  state.page = 1;
  await fetchUsers();
});

btnPrev?.addEventListener("click", async () => {
  if (state.page <= 1) return;
  state.page -= 1;
  await fetchUsers();
});

btnNext?.addEventListener("click", async () => {
  state.page += 1;
  await fetchUsers();
});

btnUsersRefresh?.addEventListener("click", async () => {
  await fetchUsers();
});

inpSearch?.addEventListener("focus", () => {
  searchArmed = true;
});

inpSearch?.addEventListener("keydown", () => {
  lastTypedAt = Date.now();
});

inpSearch?.addEventListener("input", onSearch);

btnOpenCreate?.addEventListener("click", openCreate);
btnSaveUser?.addEventListener("click", saveUser);

btnEditFromDetails?.addEventListener("click", () => {
  if (!selectedUser) return;
  detailsCanvas?.hide();
  setTimeout(() => openEdit(selectedUser.user_id), 180);
});

btnToggleStatus?.addEventListener("click", toggleStatus);
btnDeleteFromDetails?.addEventListener("click", askDelete);
btnConfirmDelete?.addEventListener("click", confirmDelete);

function clearSearchBoxOnLoad() {
  if (!inpSearch) return;
  inpSearch.value = "";
  inpSearch.setAttribute("autocomplete", "off");
  inpSearch.setAttribute("autocapitalize", "off");
  inpSearch.setAttribute("autocorrect", "off");
  inpSearch.setAttribute("spellcheck", "false");
}

clearSearchBoxOnLoad();
fetchUsers();