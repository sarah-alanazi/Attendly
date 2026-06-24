const state = {
    alerts: [],
    classes: [],
    selectedAlertId: '',
    selectedAlertDetails: null
  };
  
  const els = {
    instructorName: document.getElementById('instructorName'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnLogout: document.getElementById('btnLogout'),
    btnLogoutM: document.getElementById('btnLogoutM'),
    alertTypeFilter: document.getElementById('alertTypeFilter'),
    resolvedFilter: document.getElementById('resolvedFilter'),
    classFilter: document.getElementById('classFilter'),
    btnApplyFilters: document.getElementById('btnApplyFilters'),
    btnClearFilters: document.getElementById('btnClearFilters'),
    alertsTableBody: document.getElementById('alertsTableBody'),
    alertsCountBadge: document.getElementById('alertsCountBadge'),
    detailStudentName: document.getElementById('detailStudentName'),
    detailStudentEmail: document.getElementById('detailStudentEmail'),
    detailCourseName: document.getElementById('detailCourseName'),
    detailClassSection: document.getElementById('detailClassSection'),
    detailAlertType: document.getElementById('detailAlertType'),
    detailDescription: document.getElementById('detailDescription'),
    detailGeneratedAt: document.getElementById('detailGeneratedAt'),
    detailResolvedStatus: document.getElementById('detailResolvedStatus'),
    btnOpenResolveModal: document.getElementById('btnOpenResolveModal'),
    btnConfirmResolveAlert: document.getElementById('btnConfirmResolveAlert')
  };
  
  const alertDetailsDrawer = new bootstrap.Offcanvas(document.getElementById('alertDetailsDrawer'));
  const resolveAlertModal = new bootstrap.Modal(document.getElementById('resolveAlertModal'));
  
  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  
  function showMessage(message) {
    alert(message);
  }
  
  function alertTypeChip(type) {
    const value = String(type || '').toLowerCase();
    if (value === 'low_attendance') return `<span class="ins-chip warn">Low Attendance</span>`;
    if (value === 'late') return `<span class="ins-chip">Late</span>`;
    if (value === 'suspicious') return `<span class="ins-chip danger">Suspicious</span>`;
    return `<span class="ins-chip">${escapeHtml(type || '—')}</span>`;
  }
  
  function resolvedChip(value) {
    if (Number(value) === 1) {
      return `<span class="ins-chip ok">Resolved</span>`;
    }
    return `<span class="ins-chip danger">Unresolved</span>`;
  }
  
  function readableAlertType(type) {
    const value = String(type || '').toLowerCase();
    if (value === 'low_attendance') return 'Low Attendance';
    if (value === 'late') return 'Late';
    if (value === 'suspicious') return 'Suspicious';
    return type || '—';
  }
  
  function fillClassOptions() {
    els.classFilter.innerHTML = `<option value="">All Classes</option>` + state.classes.map(item => {
      return `<option value="${item.class_id}">${escapeHtml(item.course_name)} - ${escapeHtml(item.section)}</option>`;
    }).join('');
  }
  
  function renderAlertsTable() {
    els.alertsCountBadge.textContent = `${state.alerts.length} Alert${state.alerts.length === 1 ? '' : 's'}`;
  
    if (!state.alerts.length) {
      els.alertsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="ins-empty">No alerts found.</td>
        </tr>
      `;
      return;
    }
  
    els.alertsTableBody.innerHTML = state.alerts.map(item => `
      <tr>
        <td>${escapeHtml(item.student_name)}</td>
        <td>
          <div>${escapeHtml(item.course_name)}</div>
          <div class="ins-muted">Section: ${escapeHtml(item.section || '—')}</div>
        </td>
        <td>${alertTypeChip(item.alert_type)}</td>
        <td>${escapeHtml(item.description || '—')}</td>
        <td>${escapeHtml(item.generated_at || '—')}</td>
        <td>${resolvedChip(item.resolved)}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary rounded-4 btn-view-alert" data-id="${item.alert_id}" type="button">
            Details
          </button>
        </td>
      </tr>
    `).join('');
  
    document.querySelectorAll('.btn-view-alert').forEach(btn => {
      btn.addEventListener('click', () => openAlertDetails(btn.dataset.id));
    });
  }
  
  function getFilters() {
    return {
      alert_type: els.alertTypeFilter.value,
      resolved: els.resolvedFilter.value,
      class_id: els.classFilter.value
    };
  }
  
  function buildQuery(filters) {
    const params = new URLSearchParams();
    if (filters.alert_type) params.append('alert_type', filters.alert_type);
    if (filters.resolved !== '') params.append('resolved', filters.resolved);
    if (filters.class_id) params.append('class_id', filters.class_id);
    return params.toString();
  }
  
  async function loadAlerts() {
    const filters = getFilters();
  
    try {
      const res = await fetch(`/attendly/backend/api/instructor/alerts/list.php?${buildQuery(filters)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          window.location.href = '/attendly/public/auth/login/index.html';
          return;
        }
        showMessage(data.message || 'Failed to load alerts.');
        return;
      }
  
      state.alerts = data.data.alerts || [];
      state.classes = data.data.classes || [];
      els.instructorName.textContent = data.data.instructor_name || 'Instructor';
  
      fillClassOptions();
      if (filters.class_id) {
        els.classFilter.value = filters.class_id;
      }
      renderAlertsTable();
    } catch (error) {
      showMessage('Something went wrong while loading alerts.');
    }
  }
  
  async function openAlertDetails(alertId) {
    try {
      const res = await fetch(`/attendly/backend/api/instructor/alerts/details.php?alert_id=${encodeURIComponent(alertId)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to load alert details.');
        return;
      }
  
      const item = data.data.alert || {};
      state.selectedAlertId = String(item.alert_id || '');
      state.selectedAlertDetails = item;
  
      els.detailStudentName.textContent = item.student_name || '—';
      els.detailStudentEmail.textContent = item.student_email || '—';
      els.detailCourseName.textContent = item.course_name || '—';
      els.detailClassSection.textContent = item.section || '—';
      els.detailAlertType.textContent = readableAlertType(item.alert_type);
      els.detailDescription.textContent = item.description || '—';
      els.detailGeneratedAt.textContent = item.generated_at || '—';
      els.detailResolvedStatus.textContent = Number(item.resolved) === 1 ? 'Resolved' : 'Unresolved';
  
      if (Number(item.resolved) === 1) {
        els.btnOpenResolveModal.style.display = 'none';
      } else {
        els.btnOpenResolveModal.style.display = 'block';
      }
  
      alertDetailsDrawer.show();
    } catch (error) {
      showMessage('Something went wrong while loading alert details.');
    }
  }
  
  async function resolveAlert() {
    if (!state.selectedAlertId) {
      showMessage('No alert selected.');
      return;
    }
  
    const formData = new FormData();
    formData.append('alert_id', state.selectedAlertId);
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/alerts/resolve.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to resolve alert.');
        return;
      }
  
      resolveAlertModal.hide();
      alertDetailsDrawer.hide();
      await loadAlerts();
      showMessage(data.message || 'Alert resolved successfully.');
    } catch (error) {
      showMessage('Something went wrong while resolving alert.');
    }
  }
  
  function clearFilters() {
    els.alertTypeFilter.value = '';
    els.resolvedFilter.value = '';
    els.classFilter.value = '';
    loadAlerts();
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
  
  els.btnApplyFilters.addEventListener('click', loadAlerts);
  els.btnClearFilters.addEventListener('click', clearFilters);
  els.btnRefresh.addEventListener('click', loadAlerts);
  els.btnLogout.addEventListener('click', logout);
  els.btnLogoutM.addEventListener('click', logout);
  
  els.btnOpenResolveModal.addEventListener('click', () => {
    resolveAlertModal.show();
  });
  
  els.btnConfirmResolveAlert.addEventListener('click', resolveAlert);
  
  loadAlerts();