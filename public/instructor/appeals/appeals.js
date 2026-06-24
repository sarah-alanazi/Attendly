const state = {
    appeals: [],
    classes: [],
    selectedAppealId: '',
    selectedAppealDetails: null
  };
  
  const els = {
    instructorName: document.getElementById('instructorName'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnLogout: document.getElementById('btnLogout'),
    btnLogoutM: document.getElementById('btnLogoutM'),
    statusFilter: document.getElementById('statusFilter'),
    classFilter: document.getElementById('classFilter'),
    btnApplyFilters: document.getElementById('btnApplyFilters'),
    btnClearFilters: document.getElementById('btnClearFilters'),
    appealsTableBody: document.getElementById('appealsTableBody'),
    appealsCountBadge: document.getElementById('appealsCountBadge'),
    detailStudentName: document.getElementById('detailStudentName'),
    detailStudentEmail: document.getElementById('detailStudentEmail'),
    detailCourseName: document.getElementById('detailCourseName'),
    detailClassSection: document.getElementById('detailClassSection'),
    detailRecordStatus: document.getElementById('detailRecordStatus'),
    detailSessionDate: document.getElementById('detailSessionDate'),
    detailReason: document.getElementById('detailReason'),
    detailEvidenceUrl: document.getElementById('detailEvidenceUrl'),
    detailAppealStatus: document.getElementById('detailAppealStatus'),
    reviewNote: document.getElementById('reviewNote'),
    btnOpenApproveModal: document.getElementById('btnOpenApproveModal'),
    btnOpenRejectModal: document.getElementById('btnOpenRejectModal'),
    btnConfirmApproveAppeal: document.getElementById('btnConfirmApproveAppeal'),
    btnConfirmRejectAppeal: document.getElementById('btnConfirmRejectAppeal')
  };
  
  const appealDetailsDrawer = new bootstrap.Offcanvas(document.getElementById('appealDetailsDrawer'));
  const approveAppealModal = new bootstrap.Modal(document.getElementById('approveAppealModal'));
  const rejectAppealModal = new bootstrap.Modal(document.getElementById('rejectAppealModal'));
  
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
  
  function statusChip(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'pending') return `<span class="ins-chip warn">Pending</span>`;
    if (value === 'approved') return `<span class="ins-chip ok">Approved</span>`;
    if (value === 'rejected') return `<span class="ins-chip danger">Rejected</span>`;
    return `<span class="ins-chip">${escapeHtml(status || '—')}</span>`;
  }
  
  function recordStatusChip(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'present') return `<span class="ins-chip ok">Present</span>`;
    if (value === 'late') return `<span class="ins-chip warn">Late</span>`;
    if (value === 'absent') return `<span class="ins-chip danger">Absent</span>`;
    return `<span class="ins-chip">${escapeHtml(status || '—')}</span>`;
  }
  
  function fillClassOptions() {
    els.classFilter.innerHTML = `<option value="">All Classes</option>` + state.classes.map(item => {
      return `<option value="${item.class_id}">${escapeHtml(item.course_name)} - ${escapeHtml(item.section)}</option>`;
    }).join('');
  }
  
  function renderAppealsTable() {
    els.appealsCountBadge.textContent = `${state.appeals.length} Appeal${state.appeals.length === 1 ? '' : 's'}`;
  
    if (!state.appeals.length) {
      els.appealsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="ins-empty">No appeals found.</td>
        </tr>
      `;
      return;
    }
  
    els.appealsTableBody.innerHTML = state.appeals.map(item => `
      <tr>
        <td>${escapeHtml(item.student_name)}</td>
        <td>
          <div>${escapeHtml(item.course_name)}</div>
          <div class="ins-muted">Section: ${escapeHtml(item.section || '—')}</div>
        </td>
        <td>${escapeHtml(item.reason || '—')}</td>
        <td>${statusChip(item.status)}</td>
        <td>${escapeHtml(item.created_at || '—')}</td>
        <td>
          <button class="btn btn-sm btn-outline-primary rounded-4 btn-view-appeal" data-id="${item.appeal_id}" type="button">
            Details
          </button>
        </td>
      </tr>
    `).join('');
  
    document.querySelectorAll('.btn-view-appeal').forEach(btn => {
      btn.addEventListener('click', () => openAppealDetails(btn.dataset.id));
    });
  }
  
  function getFilters() {
    return {
      status: els.statusFilter.value,
      class_id: els.classFilter.value
    };
  }
  
  function buildQuery(filters) {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.class_id) params.append('class_id', filters.class_id);
    return params.toString();
  }
  
  async function loadAppeals() {
    const filters = getFilters();
  
    try {
      const res = await fetch(`/attendly/backend/api/instructor/appeals/list.php?${buildQuery(filters)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          window.location.href = '/attendly/public/auth/login/index.html';
          return;
        }
        showMessage(data.message || 'Failed to load appeals.');
        return;
      }
  
      state.appeals = data.data.appeals || [];
      state.classes = data.data.classes || [];
      els.instructorName.textContent = data.data.instructor_name || 'Instructor';
  
      fillClassOptions();
      if (filters.class_id) {
        els.classFilter.value = filters.class_id;
      }
  
      renderAppealsTable();
    } catch (error) {
      showMessage('Something went wrong while loading appeals.');
    }
  }
  
  async function openAppealDetails(appealId) {
    try {
      const res = await fetch(`/attendly/backend/api/instructor/appeals/details.php?appeal_id=${encodeURIComponent(appealId)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to load appeal details.');
        return;
      }
  
      const item = data.data.appeal || {};
      state.selectedAppealId = String(item.appeal_id || '');
      state.selectedAppealDetails = item;
  
      els.detailStudentName.textContent = item.student_name || '—';
      els.detailStudentEmail.textContent = item.student_email || '—';
      els.detailCourseName.textContent = item.course_name || '—';
      els.detailClassSection.textContent = item.section || '—';
      els.detailRecordStatus.innerHTML = recordStatusChip(item.record_status);
      els.detailSessionDate.textContent = item.session_date || '—';
  
      if (item.reason) {
        els.detailReason.textContent = item.reason;
      } else {
        els.detailReason.textContent = '—';
      }
  
      if (item.evidence_url) {
        els.detailEvidenceUrl.innerHTML = `<a href="${escapeHtml(item.evidence_url)}" target="_blank">${escapeHtml(item.evidence_url)}</a>`;
      } else {
        els.detailEvidenceUrl.textContent = 'No evidence uploaded';
      }
  
      els.detailAppealStatus.innerHTML = statusChip(item.status);
      els.reviewNote.value = item.review_note || '';
  
      const isPending = String(item.status || '').toLowerCase() === 'pending';
      els.btnOpenApproveModal.style.display = isPending ? 'block' : 'none';
      els.btnOpenRejectModal.style.display = isPending ? 'block' : 'none';
      els.reviewNote.disabled = !isPending;
  
      appealDetailsDrawer.show();
    } catch (error) {
      showMessage('Something went wrong while loading appeal details.');
    }
  }
  
  async function submitReview(status) {
    if (!state.selectedAppealId) {
      showMessage('No appeal selected.');
      return;
    }
  
    const formData = new FormData();
    formData.append('appeal_id', state.selectedAppealId);
    formData.append('status', status);
    formData.append('review_note', els.reviewNote.value.trim());
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/appeals/review.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to review appeal.');
        return;
      }
  
      approveAppealModal.hide();
      rejectAppealModal.hide();
      appealDetailsDrawer.hide();
      await loadAppeals();
      showMessage(data.message || 'Appeal reviewed successfully.');
    } catch (error) {
      showMessage('Something went wrong while reviewing appeal.');
    }
  }
  
  function clearFilters() {
    els.statusFilter.value = '';
    els.classFilter.value = '';
    loadAppeals();
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
  
  els.btnApplyFilters.addEventListener('click', loadAppeals);
  els.btnClearFilters.addEventListener('click', clearFilters);
  els.btnRefresh.addEventListener('click', loadAppeals);
  els.btnLogout.addEventListener('click', logout);
  els.btnLogoutM.addEventListener('click', logout);
  
  els.btnOpenApproveModal.addEventListener('click', () => {
    approveAppealModal.show();
  });
  
  els.btnOpenRejectModal.addEventListener('click', () => {
    rejectAppealModal.show();
  });
  
  els.btnConfirmApproveAppeal.addEventListener('click', () => {
    submitReview('approved');
  });
  
  els.btnConfirmRejectAppeal.addEventListener('click', () => {
    submitReview('rejected');
  });
  
  loadAppeals();