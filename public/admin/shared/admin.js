import { apiFetch } from "/attendly/public/assets/js/api.js";

const adminNameEl = document.getElementById("adminName");
const btnLogout = document.getElementById("btnLogout");
const btnLogoutM = document.getElementById("btnLogoutM");
const btnRefresh = document.getElementById("btnRefresh");

const kpiUsers = document.getElementById("kpiUsers");
const kpiCourses = document.getElementById("kpiCourses");
const kpiClasses = document.getElementById("kpiClasses");
const kpiAlerts = document.getElementById("kpiAlerts");

function setKpisLoading(val = "—") {
  [kpiUsers, kpiCourses, kpiClasses, kpiAlerts].forEach(el => {
    if (el) el.textContent = val;
  });
}

async function loadMe() {
  const res = await apiFetch("/attendly/backend/api/auth/me.php");
  if (!res?.success || !res.user) throw new Error("Unauthorized");

  const full = `${res.user.first_name ?? ""} ${res.user.last_name ?? ""}`.trim();
  if (adminNameEl) adminNameEl.textContent = full || res.user.username || "Admin";

  return res.user;
}

async function loadDashboardStats() {
  // Only run on Dashboard (
  if (!kpiUsers || !kpiCourses || !kpiClasses || !kpiAlerts) return;

  const res = await apiFetch("/attendly/backend/api/admin/dashboard/stats.php");
  if (!res?.success || !res.data) throw new Error("Failed to load stats");

  kpiUsers.textContent = res.data.users ?? 0;
  kpiCourses.textContent = res.data.courses ?? 0;
  kpiClasses.textContent = res.data.classes ?? 0;
  kpiAlerts.textContent = res.data.open_alerts ?? 0;
}

async function logout() {
  try {
    await apiFetch("/attendly/backend/api/auth/logout.php", { method: "POST" });
  } catch {}
  window.location.href = "/attendly/public/auth/login/login.html";
}

btnLogout?.addEventListener("click", logout);
btnLogoutM?.addEventListener("click", logout);

btnRefresh?.addEventListener("click", async () => {
  setKpisLoading("—");
  await boot();
});

async function boot() {
  setKpisLoading("—");

  try {
    const me = await loadMe();

    if ((me?.role ?? "") !== "admin") {
      window.location.href = "/attendly/public/auth/login/login.html";
      return;
    }

    await loadDashboardStats();
  } catch {
    window.location.href = "/attendly/public/auth/login/login.html";
  }
}

boot();