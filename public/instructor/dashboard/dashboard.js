const els = {
  instructorName: document.getElementById('instructorName'),
  kpiCourses: document.getElementById('kpiCourses'),
  kpiClasses: document.getElementById('kpiClasses'),
  kpiSessions: document.getElementById('kpiSessions'),
  kpiAlerts: document.getElementById('kpiAlerts'),
  todayClassesBody: document.getElementById('todayClassesBody'),
  recentSessionsBody: document.getElementById('recentSessionsBody'),
  btnRefresh: document.getElementById('btnRefresh'),
  btnLogout: document.getElementById('btnLogout'),
  btnLogoutM: document.getElementById('btnLogoutM'),
  todayDayBadge: document.getElementById('todayDayBadge')
};

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatTimeRange(start, end) {
  if (!start && !end) return '—';
  if (start && end) return `${start} - ${end}`;
  return start || end || '—';
}

function statusChip(status) {
  const v = String(status || '').toLowerCase();
  if (v === 'active') {
    return `<span class="ins-chip ok">Active</span>`;
  }
  if (v === 'closed') {
    return `<span class="ins-chip">Closed</span>`;
  }
  return `<span class="ins-chip">${escapeHtml(status || '—')}</span>`;
}

function qrChip(status) {
  if (status) {
    return `<span class="ins-chip ok">Available</span>`;
  }
  return `<span class="ins-chip warn">Not Generated</span>`;
}

function renderTodayClasses(items) {
  if (!items.length) {
    els.todayClassesBody.innerHTML = `
      <tr>
        <td colspan="4" class="ins-empty">No classes scheduled for today.</td>
      </tr>
    `;
    return;
  }

  els.todayClassesBody.innerHTML = items.map(item => `
    <tr>
      <td>
        <div class="fw-semibold">${escapeHtml(item.course_name)}</div>
        <div class="ins-muted">${escapeHtml(item.semester || '')} ${item.academic_year ? '• ' + escapeHtml(item.academic_year) : ''}</div>
      </td>
      <td>${escapeHtml(item.section || '—')}</td>
      <td>${escapeHtml(formatTimeRange(item.start_time, item.end_time))}</td>
      <td>${escapeHtml(item.room || '—')}</td>
    </tr>
  `).join('');
}

function renderRecentSessions(items) {
  if (!items.length) {
    els.recentSessionsBody.innerHTML = `
      <tr>
        <td colspan="6" class="ins-empty">No attendance sessions found yet.</td>
      </tr>
    `;
    return;
  }

  els.recentSessionsBody.innerHTML = items.map(item => `
    <tr>
      <td>${escapeHtml(item.course_name)}</td>
      <td>${escapeHtml(item.section || '—')}</td>
      <td>${escapeHtml(item.session_date || '—')}</td>
      <td>${escapeHtml(formatTimeRange(item.start_time, item.end_time))}</td>
      <td>${statusChip(item.status)}</td>
      <td>${qrChip(item.qr_token)}</td>
    </tr>
  `).join('');
}

async function loadDashboard() {
  try {
    const res = await fetch('/attendly/backend/api/instructor/dashboard/index.php', {
      credentials: 'same-origin'
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      const message = data.message || 'Unable to load dashboard data.';
      if (res.status === 401) {
        window.location.href = '/attendly/public/auth/login/index.html';
        return;
      }
      alert(message);
      return;
    }

    const payload = data.data || {};
    const stats = payload.stats || {};
    const profile = payload.profile || {};
    const todayClasses = payload.today_classes || [];
    const recentSessions = payload.recent_sessions || [];

    els.instructorName.textContent = profile.full_name || 'Instructor';
    els.kpiCourses.textContent = stats.assigned_courses ?? 0;
    els.kpiClasses.textContent = stats.total_classes ?? 0;
    els.kpiSessions.textContent = stats.active_sessions ?? 0;
    els.kpiAlerts.textContent = stats.open_alerts ?? 0;
    els.todayDayBadge.textContent = payload.today_label || 'Today';

    renderTodayClasses(todayClasses);
    renderRecentSessions(recentSessions);
  } catch (error) {
    alert('Something went wrong while loading the dashboard.');
  }
}

async function logout() {
  try {
    const res = await fetch('/attendly/backend/api/auth/logout.php', {
      method: 'POST',
      credentials: 'same-origin'
    });

    const data = await res.json().catch(() => null);

    if (data && data.success) {
      window.location.href = '/attendly/public/auth/login/login.html';
      return;
    }

    window.location.href = '/attendly/public/auth/login/login.html';
  } catch (error) {
    window.location.href = '/attendly/public/auth/login/login.html';
  }
}

els.btnRefresh?.addEventListener('click', loadDashboard);
els.btnLogout?.addEventListener('click', logout);
els.btnLogoutM?.addEventListener('click', logout);

loadDashboard();