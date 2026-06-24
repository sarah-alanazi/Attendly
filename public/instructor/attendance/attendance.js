const state = {
    classes: [],
    selectedClassId: '',
    activeSession: null,
    selectedSessionId: '',
    records: [],
    history: []
  };
  
  const els = {
    instructorName: document.getElementById('instructorName'),
    classSelect: document.getElementById('classSelect'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnLogout: document.getElementById('btnLogout'),
    btnLogoutM: document.getElementById('btnLogoutM'),
    btnOpenStartSessionModal: document.getElementById('btnOpenStartSessionModal'),
    activeSessionCard: document.getElementById('activeSessionCard'),
    activeSessionBadge: document.getElementById('activeSessionBadge'),
    historyCountBadge: document.getElementById('historyCountBadge'),
    historyTableBody: document.getElementById('historyTableBody'),
    recordsSessionBadge: document.getElementById('recordsSessionBadge'),
    recordsTableBody: document.getElementById('recordsTableBody'),
    startSessionClassName: document.getElementById('startSessionClassName'),
    sessionDate: document.getElementById('sessionDate'),
    sessionStartTime: document.getElementById('sessionStartTime'),
    sessionEndTime: document.getElementById('sessionEndTime'),
    sessionLat: document.getElementById('sessionLat'),
    sessionLng: document.getElementById('sessionLng'),
    btnStartSession: document.getElementById('btnStartSession'),
    qrContainer: document.getElementById('qrContainer'),
    qrTokenText: document.getElementById('qrTokenText'),
    qrExpiryText: document.getElementById('qrExpiryText'),
    editRecordId: document.getElementById('editRecordId'),
    editStudentName: document.getElementById('editStudentName'),
    editStatus: document.getElementById('editStatus'),
    editNotes: document.getElementById('editNotes'),
    btnSaveRecord: document.getElementById('btnSaveRecord'),
    btnConfirmCloseSession: document.getElementById('btnConfirmCloseSession'),
    detailCourseName: document.getElementById('detailCourseName'),
    detailSection: document.getElementById('detailSection'),
    detailSessionDate: document.getElementById('detailSessionDate'),
    detailSessionTime: document.getElementById('detailSessionTime'),
    detailStatus: document.getElementById('detailStatus'),
    detailQrExpiry: document.getElementById('detailQrExpiry'),
    detailSessionLat: document.getElementById('detailSessionLat'),
    detailSessionLng: document.getElementById('detailSessionLng'),
    detailPresentCount: document.getElementById('detailPresentCount'),
    detailAbsentCount: document.getElementById('detailAbsentCount'),
    btnDownloadQr: document.getElementById('btnDownloadQr'),
    detailLateCount: document.getElementById('detailLateCount')
  };
  
  const startSessionModal = new bootstrap.Modal(document.getElementById('startSessionModal'));
  const qrPreviewModal = new bootstrap.Modal(document.getElementById('qrPreviewModal'));
  const editRecordModal = new bootstrap.Modal(document.getElementById('editRecordModal'));
  const closeSessionModal = new bootstrap.Modal(document.getElementById('closeSessionModal'));
  const sessionDetailsDrawer = new bootstrap.Offcanvas(document.getElementById('sessionDetailsDrawer'));
  
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
  
  function getQueryClassId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('class_id') || '';
  }
  
  function setTodayDefaults() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const date = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
    const start = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const endHour = now.getHours() + 1 > 23 ? 23 : now.getHours() + 1;
    const end = `${pad(endHour)}:${pad(now.getMinutes())}`;
    els.sessionDate.value = date;
    els.sessionStartTime.value = start;
    els.sessionEndTime.value = end;
  }
  
  function renderClassOptions() {
    const queryClassId = getQueryClassId();
    els.classSelect.innerHTML = `<option value="">Select class</option>` + state.classes.map(item => {
      const label = `${item.course_name} - ${item.section} (${item.schedule_day})`;
      return `<option value="${item.class_id}">${escapeHtml(label)}</option>`;
    }).join('');
  
    if (queryClassId && state.classes.some(item => String(item.class_id) === String(queryClassId))) {
      state.selectedClassId = queryClassId;
      els.classSelect.value = queryClassId;
      loadOverview(queryClassId);
      return;
    }
  
    if (state.classes.length > 0) {
      state.selectedClassId = String(state.classes[0].class_id);
      els.classSelect.value = state.selectedClassId;
      loadOverview(state.selectedClassId);
    }
  }
  
  function statusChip(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'active') return `<span class="ins-chip ok">Active</span>`;
    if (value === 'closed') return `<span class="ins-chip">Closed</span>`;
    return `<span class="ins-chip">${escapeHtml(status || '—')}</span>`;
  }
  
  function reliabilityChip(color) {
    const value = String(color || '').toLowerCase();
    if (value === 'green') return `<span class="ins-chip ok">Green</span>`;
    if (value === 'yellow') return `<span class="ins-chip warn">Yellow</span>`;
    if (value === 'red') return `<span class="ins-chip danger">Red</span>`;
    return `<span class="ins-chip">—</span>`;
  }
  
  function attendanceChip(status) {
    const value = String(status || '').toLowerCase();
    if (value === 'present') return `<span class="ins-chip ok">Present</span>`;
    if (value === 'late') return `<span class="ins-chip warn">Late</span>`;
    if (value === 'absent') return `<span class="ins-chip danger">Absent</span>`;
    return `<span class="ins-chip">—</span>`;
  }
  
  function campusText(value) {
    if (Number(value) === 1) return 'Yes';
    if (Number(value) === 0) return 'No';
    return '—';
  }
  
  function renderActiveSession() {
    if (!state.activeSession) {
      els.activeSessionBadge.textContent = 'No Session';
      els.activeSessionCard.innerHTML = `<div class="ins-empty">No active session found for this class.</div>`;
      return;
    }
  
    const session = state.activeSession;
    els.activeSessionBadge.textContent = 'Active';
  
    els.activeSessionCard.innerHTML = `
      <div class="mb-3">
        <div class="fw-bold mb-1">Status</div>
        <div>${statusChip(session.status)}</div>
      </div>
  
      <div class="mb-3">
        <div class="fw-bold mb-1">Session Date</div>
        <div>${escapeHtml(session.session_date || '—')}</div>
      </div>
  
      <div class="mb-3">
        <div class="fw-bold mb-1">Time</div>
        <div>${escapeHtml(session.start_time || '—')} - ${escapeHtml(session.end_time || '—')}</div>
      </div>
  
      <div class="mb-3">
        <div class="fw-bold mb-1">Session Location</div>
        <div>Lat: ${escapeHtml(session.session_lat || '—')}</div>
        <div>Lng: ${escapeHtml(session.session_lng || '—')}</div>
      </div>
  
      <div class="mb-3">
        <div class="fw-bold mb-1">QR Token Status</div>
        <div>${session.qr_token ? '<span class="ins-chip ok">Generated</span>' : '<span class="ins-chip warn">Not Generated</span>'}</div>
      </div>
  
      <div class="mb-3">
        <div class="fw-bold mb-1">QR Expiry</div>
        <div>${escapeHtml(session.qr_expires_at || '—')}</div>
      </div>
  
      <div class="d-grid gap-2">
      ${session.qr_token ? `
        <button id="btnViewQrNow" class="btn btn-primary rounded-4" type="button">
          <i class="fa-solid fa-eye me-2"></i>View QR
        </button>
      ` : `
        <button id="btnGenerateQrNow" class="btn btn-primary rounded-4" type="button">
          <i class="fa-solid fa-qrcode me-2"></i>Generate QR
        </button>
      `}
  
        <button id="btnOpenAttendanceList" class="btn btn-outline-primary rounded-4" type="button">
          <i class="fa-solid fa-table me-2"></i>Open Attendance List
        </button>
  
        <button id="btnOpenCloseSessionModal" class="btn btn-outline-danger rounded-4" type="button">
          <i class="fa-solid fa-xmark me-2"></i>Close Session
        </button>
      </div>
    `;
  
    document.getElementById('btnGenerateQrNow')?.addEventListener('click', generateQrForActiveSession);
    document.getElementById('btnViewQrNow')?.addEventListener('click', viewExistingQr);
    document.getElementById('btnOpenAttendanceList')?.addEventListener('click', () => {
      state.selectedSessionId = String(session.session_id);
      loadRecords(session.session_id);
      document.querySelector('.ins-card:last-of-type')?.scrollIntoView({ behavior: 'smooth' });
    });
    document.getElementById('btnOpenCloseSessionModal')?.addEventListener('click', () => {
      closeSessionModal.show();
    });
  }
  function viewExistingQr() {
    if (!state.activeSession || !state.activeSession.qr_token) {
      showMessage('No QR generated for this session yet.');
      return;
    }
  
    els.qrTokenText.textContent = state.activeSession.qr_token;
    els.qrExpiryText.textContent = `Expires at: ${state.activeSession.qr_expires_at || '—'}`;
    els.qrContainer.innerHTML = '';
  
    new QRCode(els.qrContainer, {
      text: state.activeSession.qr_token,
      width: 220,
      height: 220
    });
  
    qrPreviewModal.show();
  }
  function renderHistory() {
    els.historyCountBadge.textContent = `${state.history.length} Session${state.history.length === 1 ? '' : 's'}`;
  
    if (!state.history.length) {
      els.historyTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="ins-empty">No session history found.</td>
        </tr>
      `;
      return;
    }
  
    els.historyTableBody.innerHTML = state.history.map(item => `
      <tr>
        <td>${escapeHtml(item.session_date || '—')}</td>
        <td>${escapeHtml(item.start_time || '—')} - ${escapeHtml(item.end_time || '—')}</td>
        <td>${statusChip(item.status)}</td>
        <td>${escapeHtml(item.present_count || 0)}</td>
        <td>${escapeHtml(item.absent_count || 0)}</td>
        <td>${escapeHtml(item.late_count || 0)}</td>
        <td>
          <div class="d-flex gap-2 flex-wrap">
            <button class="btn btn-sm btn-outline-primary rounded-4 btn-view-records" data-id="${item.session_id}" type="button">Records</button>
            <button class="btn btn-sm btn-outline-secondary rounded-4 btn-view-details" data-id="${item.session_id}" type="button">Details</button>
          </div>
        </td>
      </tr>
    `).join('');
  
    document.querySelectorAll('.btn-view-records').forEach(btn => {
      btn.addEventListener('click', () => {
        state.selectedSessionId = String(btn.dataset.id);
        loadRecords(btn.dataset.id);
        document.querySelector('.ins-card:last-of-type')?.scrollIntoView({ behavior: 'smooth' });
      });
    });
  
    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', () => openSessionDetails(btn.dataset.id));
    });
  }
  
  function renderRecords() {
    if (!state.selectedSessionId) {
      els.recordsSessionBadge.textContent = 'No Session Selected';
      els.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="ins-empty">Select a session to view records.</td>
        </tr>
      `;
      return;
    }
  
    els.recordsSessionBadge.textContent = `Session #${state.selectedSessionId}`;
  
    if (!state.records.length) {
      els.recordsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="ins-empty">No records found for this session.</td>
        </tr>
      `;
      return;
    }
  
    els.recordsTableBody.innerHTML = state.records.map(item => `
      <tr>
        <td>${escapeHtml(item.student_name)}</td>
        <td>${attendanceChip(item.status)}</td>
        <td>${escapeHtml(item.scan_at || '—')}</td>
        <td>${reliabilityChip(item.reliability_color)}</td>
        <td>${escapeHtml(campusText(item.within_campus))}</td>
        <td>${escapeHtml(item.notes || '—')}</td>
        <td>
          <button
            class="btn btn-sm btn-outline-primary rounded-4 btn-edit-record"
            type="button"
            data-record-id="${item.record_id}"
            data-student-name="${escapeHtml(item.student_name)}"
            data-status="${escapeHtml(item.status || '')}"
            data-notes="${escapeHtml(item.notes || '')}"
          >
            Edit
          </button>
        </td>
      </tr>
    `).join('');
  
    document.querySelectorAll('.btn-edit-record').forEach(btn => {
      btn.addEventListener('click', () => {
        els.editRecordId.value = btn.dataset.recordId;
        els.editStudentName.value = btn.dataset.studentName;
        els.editStatus.value = btn.dataset.status || 'absent';
        els.editNotes.value = btn.dataset.notes || '';
        editRecordModal.show();
      });
    });
  }
  function downloadQrImage() {
    const img = els.qrContainer.querySelector('img');
    const canvas = els.qrContainer.querySelector('canvas');
  
    let imageUrl = '';
    let extension = 'png';
  
    if (img) {
      imageUrl = img.src;
      if (imageUrl.startsWith('data:image/jpeg')) {
        extension = 'jpg';
      }
    } else if (canvas) {
      imageUrl = canvas.toDataURL('image/png');
      extension = 'png';
    } else {
      showMessage('QR image is not available.');
      return;
    }
  
    const sessionId = state.activeSession?.session_id || 'session';
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `attendance_qr_${sessionId}.${extension}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  function fillStartSessionModal() {
    const selected = state.classes.find(item => String(item.class_id) === String(state.selectedClassId));
    els.startSessionClassName.value = selected ? `${selected.course_name} - ${selected.section}` : '';
    setTodayDefaults();
    els.sessionLat.value = '';
    els.sessionLng.value = '';
  }
  
  async function loadClasses() {
    try {
      const res = await fetch('/attendly/backend/api/instructor/attendance/list_classes.php', {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          window.location.href = '/attendly/public/auth/login/index.html';
          return;
        }
        showMessage(data.message || 'Failed to load classes.');
        return;
      }
  
      state.classes = data.data.classes || [];
      els.instructorName.textContent = data.data.instructor_name || 'Instructor';
      renderClassOptions();
    } catch (error) {
      showMessage('Something went wrong while loading classes.');
    }
  }
  
  async function loadOverview(classId) {
    if (!classId) {
      state.activeSession = null;
      state.history = [];
      state.selectedSessionId = '';
      state.records = [];
      renderActiveSession();
      renderHistory();
      renderRecords();
      return;
    }
  
    try {
      const res = await fetch(`/attendly/backend/api/instructor/attendance/overview.php?class_id=${encodeURIComponent(classId)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to load attendance overview.');
        return;
      }
  
      state.activeSession = data.data.active_session || null;
      state.history = data.data.history || [];
      renderActiveSession();
      renderHistory();
  
      if (state.activeSession) {
        state.selectedSessionId = String(state.activeSession.session_id);
        loadRecords(state.activeSession.session_id);
      } else {
        state.selectedSessionId = '';
        state.records = [];
        renderRecords();
      }
    } catch (error) {
      showMessage('Something went wrong while loading attendance overview.');
    }
  }
  
  async function loadRecords(sessionId) {
    try {
      const res = await fetch(`/attendly/backend/api/instructor/attendance/records.php?session_id=${encodeURIComponent(sessionId)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to load attendance records.');
        return;
      }
  
      state.records = data.data.records || [];
      state.selectedSessionId = String(sessionId);
      renderRecords();
    } catch (error) {
      showMessage('Something went wrong while loading records.');
    }
  }
  
  async function startSession() {
    if (!state.selectedClassId) {
      showMessage('Please select a class first.');
      return;
    }
  
    const sessionDate = els.sessionDate.value.trim();
    const startTime = els.sessionStartTime.value.trim();
    const endTime = els.sessionEndTime.value.trim();
    const sessionLat = els.sessionLat.value.trim();
    const sessionLng = els.sessionLng.value.trim();
  
    if (!sessionDate || !startTime || !endTime || !sessionLat || !sessionLng) {
      showMessage('Please fill all session fields including location.');
      return;
    }
  
    const formData = new FormData();
    formData.append('class_id', state.selectedClassId);
    formData.append('session_date', sessionDate);
    formData.append('start_time', startTime);
    formData.append('end_time', endTime);
    formData.append('session_lat', sessionLat);
    formData.append('session_lng', sessionLng);
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/attendance/start_session.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to start session.');
        return;
      }
  
      startSessionModal.hide();
      await loadOverview(state.selectedClassId);
      showMessage(data.message || 'Session started successfully.');
    } catch (error) {
      showMessage('Something went wrong while starting session.');
    }
  }
  
  async function generateQrForActiveSession() {
    if (!state.activeSession) {
      showMessage('No active session found.');
      return;
    }
  
    const formData = new FormData();
    formData.append('session_id', state.activeSession.session_id);
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/attendance/generate_qr.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to generate QR.');
        return;
      }
  
      const qrToken = data.data.qr_token || '';
      const qrExpiry = data.data.qr_expires_at || '—';
  
      els.qrTokenText.textContent = qrToken;
      els.qrExpiryText.textContent = `Expires at: ${qrExpiry}`;
      els.qrContainer.innerHTML = '';
  
      new QRCode(els.qrContainer, {
        text: qrToken,
        width: 220,
        height: 220
      });
  
      qrPreviewModal.show();
      await loadOverview(state.selectedClassId);
    } catch (error) {
      showMessage('Something went wrong while generating QR.');
    }
  }
  
  async function saveRecord() {
    if (!state.selectedSessionId) {
      showMessage('No session selected.');
      return;
    }
  
    const formData = new FormData();
    formData.append('record_id', els.editRecordId.value);
    formData.append('status', els.editStatus.value);
    formData.append('notes', els.editNotes.value.trim());
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/attendance/update_record.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to update record.');
        return;
      }
  
      editRecordModal.hide();
      await loadRecords(state.selectedSessionId);
      await loadOverview(state.selectedClassId);
      showMessage(data.message || 'Record updated successfully.');
    } catch (error) {
      showMessage('Something went wrong while updating record.');
    }
  }
  
  async function closeActiveSession() {
    if (!state.activeSession) {
      showMessage('No active session found.');
      return;
    }
  
    const formData = new FormData();
    formData.append('session_id', state.activeSession.session_id);
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/attendance/close_session.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to close session.');
        return;
      }
  
      closeSessionModal.hide();
      await loadOverview(state.selectedClassId);
      showMessage(data.message || 'Session closed successfully.');
    } catch (error) {
      showMessage('Something went wrong while closing session.');
    }
  }
  
  async function openSessionDetails(sessionId) {
    try {
      const res = await fetch(`/attendly/backend/api/instructor/attendance/session_details.php?session_id=${encodeURIComponent(sessionId)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to load session details.');
        return;
      }
  
      const item = data.data.session || {};
  
      els.detailCourseName.textContent = item.course_name || '—';
      els.detailSection.textContent = item.section || '—';
      els.detailSessionDate.textContent = item.session_date || '—';
      els.detailSessionTime.textContent = `${item.start_time || '—'} - ${item.end_time || '—'}`;
      els.detailStatus.textContent = item.status || '—';
      els.detailQrExpiry.textContent = item.qr_expires_at || '—';
      els.detailSessionLat.textContent = item.session_lat || '—';
      els.detailSessionLng.textContent = item.session_lng || '—';
      els.detailPresentCount.textContent = item.present_count || 0;
      els.detailAbsentCount.textContent = item.absent_count || 0;
      els.detailLateCount.textContent = item.late_count || 0;
  
      sessionDetailsDrawer.show();
    } catch (error) {
      showMessage('Something went wrong while loading session details.');
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
  
  els.classSelect.addEventListener('change', () => {
    state.selectedClassId = els.classSelect.value;
    loadOverview(state.selectedClassId);
  });
  
  els.btnOpenStartSessionModal.addEventListener('click', () => {
    if (!state.selectedClassId) {
      showMessage('Please select a class first.');
      return;
    }
    fillStartSessionModal();
    startSessionModal.show();
  });
  
  els.btnStartSession.addEventListener('click', startSession);
  els.btnSaveRecord.addEventListener('click', saveRecord);
  els.btnConfirmCloseSession.addEventListener('click', closeActiveSession);
  els.btnRefresh.addEventListener('click', () => {
    loadClasses();
  });
  els.btnLogout.addEventListener('click', logout);
  els.btnLogoutM.addEventListener('click', logout);
  els.btnDownloadQr.addEventListener('click', downloadQrImage);
  
  loadClasses();