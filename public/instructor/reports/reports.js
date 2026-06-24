const state = {
    courses: [],
    classes: [],
    reportRows: [],
    summary: null
  };
  
  const els = {
    instructorName: document.getElementById('instructorName'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnLogout: document.getElementById('btnLogout'),
    btnLogoutM: document.getElementById('btnLogoutM'),
    courseSelect: document.getElementById('courseSelect'),
    classSelect: document.getElementById('classSelect'),
    dateFrom: document.getElementById('dateFrom'),
    dateTo: document.getElementById('dateTo'),
    reportType: document.getElementById('reportType'),
    btnGenerateReport: document.getElementById('btnGenerateReport'),
    btnExportPdf: document.getElementById('btnExportPdf'),
    btnClearFilters: document.getElementById('btnClearFilters'),
    kpiSessions: document.getElementById('kpiSessions'),
    kpiPresentRate: document.getElementById('kpiPresentRate'),
    kpiAbsentRate: document.getElementById('kpiAbsentRate'),
    kpiLateRate: document.getElementById('kpiLateRate'),
    reportTableBody: document.getElementById('reportTableBody'),
    resultsCountBadge: document.getElementById('resultsCountBadge')
  };
  
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
  
  function reliabilityChip(value) {
    const v = String(value || '').toLowerCase();
    if (v === 'strong') return `<span class="ins-chip ok">Strong</span>`;
    if (v === 'mixed') return `<span class="ins-chip warn">Mixed</span>`;
    if (v === 'weak') return `<span class="ins-chip danger">Weak</span>`;
    return `<span class="ins-chip">—</span>`;
  }
  
  function fillCourseOptions() {
    els.courseSelect.innerHTML = `<option value="">All Courses</option>` + state.courses.map(item => {
      return `<option value="${item.course_id}">${escapeHtml(item.course_name)}</option>`;
    }).join('');
  }
  
  function fillClassOptions() {
    const selectedCourseId = els.courseSelect.value;
    let items = state.classes;
  
    if (selectedCourseId) {
      items = items.filter(item => String(item.course_id) === String(selectedCourseId));
    }
  
    els.classSelect.innerHTML = `<option value="">All Classes</option>` + items.map(item => {
      return `<option value="${item.class_id}">${escapeHtml(item.course_name)} - ${escapeHtml(item.section)}</option>`;
    }).join('');
  }
  
  function renderSummary() {
    const s = state.summary || {
      total_sessions: 0,
      present_rate: 0,
      absent_rate: 0,
      late_rate: 0
    };
  
    els.kpiSessions.textContent = s.total_sessions ?? 0;
    els.kpiPresentRate.textContent = `${s.present_rate ?? 0}%`;
    els.kpiAbsentRate.textContent = `${s.absent_rate ?? 0}%`;
    els.kpiLateRate.textContent = `${s.late_rate ?? 0}%`;
  }
  
  function renderRows() {
    els.resultsCountBadge.textContent = `${state.reportRows.length} Student${state.reportRows.length === 1 ? '' : 's'}`;
  
    if (!state.reportRows.length) {
      els.reportTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="ins-empty">No report results found for the selected filters.</td>
        </tr>
      `;
      return;
    }
  
    els.reportTableBody.innerHTML = state.reportRows.map(item => `
      <tr>
        <td>${escapeHtml(item.student_name)}</td>
        <td>${escapeHtml(item.present_count)}</td>
        <td>${escapeHtml(item.absent_count)}</td>
        <td>${escapeHtml(item.late_count)}</td>
        <td>${escapeHtml(item.attendance_percentage)}%</td>
        <td>${reliabilityChip(item.reliability_pattern)}</td>
      </tr>
    `).join('');
  }
  
  function getFilters() {
    return {
      course_id: els.courseSelect.value,
      class_id: els.classSelect.value,
      date_from: els.dateFrom.value,
      date_to: els.dateTo.value,
      report_type: els.reportType.value
    };
  }
  
  function buildQuery(filters) {
    const params = new URLSearchParams();
  
    if (filters.course_id) params.append('course_id', filters.course_id);
    if (filters.class_id) params.append('class_id', filters.class_id);
    if (filters.date_from) params.append('date_from', filters.date_from);
    if (filters.date_to) params.append('date_to', filters.date_to);
    if (filters.report_type) params.append('report_type', filters.report_type);
  
    return params.toString();
  }
  
  async function loadFilters() {
    try {
      const res = await fetch('/attendly/backend/api/instructor/reports/filters.php', {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          window.location.href = '/attendly/public/auth/login/index.html';
          return;
        }
        showMessage(data.message || 'Failed to load report filters.');
        return;
      }
  
      state.courses = data.data.courses || [];
      state.classes = data.data.classes || [];
      els.instructorName.textContent = data.data.instructor_name || 'Instructor';
  
      fillCourseOptions();
      fillClassOptions();
    } catch (error) {
      showMessage('Something went wrong while loading report filters.');
    }
  }
  
  async function generateReport() {
    const filters = getFilters();
  
    try {
      const res = await fetch(`/attendly/backend/api/instructor/reports/generate.php?${buildQuery(filters)}`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to generate report.');
        return;
      }
  
      state.reportRows = data.data.rows || [];
      state.summary = data.data.summary || null;
  
      renderSummary();
      renderRows();
    } catch (error) {
      showMessage('Something went wrong while generating report.');
    }
  }
  
  function clearFilters() {
    els.courseSelect.value = '';
    fillClassOptions();
    els.classSelect.value = '';
    els.dateFrom.value = '';
    els.dateTo.value = '';
    els.reportType.value = 'daily';
  
    state.reportRows = [];
    state.summary = {
      total_sessions: 0,
      present_rate: 0,
      absent_rate: 0,
      late_rate: 0
    };
  
    renderSummary();
    renderRows();
  }
  
  function exportPdf() {
    const filters = getFilters();
    const query = buildQuery(filters);
    window.open(`/attendly/backend/api/instructor/reports/export_pdf.php?${query}`, '_blank');
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
  
  els.courseSelect.addEventListener('change', () => {
    fillClassOptions();
    els.classSelect.value = '';
  });
  
  els.btnGenerateReport.addEventListener('click', generateReport);
  els.btnExportPdf.addEventListener('click', exportPdf);
  els.btnClearFilters.addEventListener('click', clearFilters);
  els.btnRefresh.addEventListener('click', loadFilters);
  els.btnLogout.addEventListener('click', logout);
  els.btnLogoutM.addEventListener('click', logout);
  
  loadFilters();
  renderSummary();
  renderRows();