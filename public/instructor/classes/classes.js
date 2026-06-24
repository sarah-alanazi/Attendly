const state = {
    classes: [],
    currentClassId: null,
    currentClassDetails: null,
    currentStudents: [],
    removableStudentId: null
  };
  
  const els = {
    instructorName: document.getElementById('instructorName'),
    searchInput: document.getElementById('searchInput'),
    semesterFilter: document.getElementById('semesterFilter'),
    yearFilter: document.getElementById('yearFilter'),
    btnClearFilters: document.getElementById('btnClearFilters'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnLogout: document.getElementById('btnLogout'),
    btnLogoutM: document.getElementById('btnLogoutM'),
    classesTableBody: document.getElementById('classesTableBody'),
    classesCountBadge: document.getElementById('classesCountBadge'),
    studentsList: document.getElementById('studentsList'),
    btnOpenAddStudentModal: document.getElementById('btnOpenAddStudentModal'),
    btnOpenEditModal: document.getElementById('btnOpenEditModal'),
    studentSelect: document.getElementById('studentSelect'),
    studentEnrollStatus: document.getElementById('studentEnrollStatus'),
    btnSaveStudent: document.getElementById('btnSaveStudent'),
    editSection: document.getElementById('editSection'),
    editRoom: document.getElementById('editRoom'),
    editScheduleDay: document.getElementById('editScheduleDay'),
    editStartTime: document.getElementById('editStartTime'),
    editEndTime: document.getElementById('editEndTime'),
    btnSaveClassEdit: document.getElementById('btnSaveClassEdit'),
    removeStudentName: document.getElementById('removeStudentName'),
    btnConfirmRemoveStudent: document.getElementById('btnConfirmRemoveStudent'),
    detailCourseName: document.getElementById('detailCourseName'),
    detailCourseId: document.getElementById('detailCourseId'),
    detailSemester: document.getElementById('detailSemester'),
    detailYear: document.getElementById('detailYear'),
    detailClassId: document.getElementById('detailClassId'),
    detailSection: document.getElementById('detailSection'),
    detailScheduleDay: document.getElementById('detailScheduleDay'),
    detailRoom: document.getElementById('detailRoom'),
    detailStartTime: document.getElementById('detailStartTime'),
    detailEndTime: document.getElementById('detailEndTime'),
    detailAssignedDate: document.getElementById('detailAssignedDate'),
    detailStudentsCount: document.getElementById('detailStudentsCount')
  };
  
  const drawer = new bootstrap.Offcanvas(document.getElementById('classDetailsDrawer'));
  const addStudentModal = new bootstrap.Modal(document.getElementById('addStudentModal'));
  const editClassModal = new bootstrap.Modal(document.getElementById('editClassModal'));
  const removeStudentModal = new bootstrap.Modal(document.getElementById('removeStudentModal'));
  
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
  
  function setCountBadge(count) {
    els.classesCountBadge.textContent = `${count} Class${count === 1 ? '' : 'es'}`;
  }
  
  function fillFilters(items) {
    const semesters = [...new Set(items.map(item => item.semester).filter(Boolean))];
    const years = [...new Set(items.map(item => item.academic_year).filter(Boolean))];
  
    els.semesterFilter.innerHTML = `<option value="">All Semesters</option>` + semesters.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
    els.yearFilter.innerHTML = `<option value="">All Years</option>` + years.map(item => `<option value="${escapeHtml(item)}">${escapeHtml(item)}</option>`).join('');
  }
  
  function getFilteredClasses() {
    const q = els.searchInput.value.trim().toLowerCase();
    const semester = els.semesterFilter.value.trim();
    const year = els.yearFilter.value.trim();
  
    return state.classes.filter(item => {
      const bySearch = !q || String(item.course_name || '').toLowerCase().includes(q);
      const bySemester = !semester || item.semester === semester;
      const byYear = !year || item.academic_year === year;
      return bySearch && bySemester && byYear;
    });
  }
  
  function renderClassesTable() {
    const items = getFilteredClasses();
    setCountBadge(items.length);
  
    if (!items.length) {
      els.classesTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="ins-empty">No classes found.</td>
        </tr>
      `;
      return;
    }
  
    els.classesTableBody.innerHTML = items.map(item => `
      <tr>
        <td>
          <div class="fw-semibold">${escapeHtml(item.course_name)}</div>
        </td>
        <td>${escapeHtml(item.section || '—')}</td>
        <td>${escapeHtml(item.schedule_day || '—')}</td>
        <td>${escapeHtml(item.start_time || '—')} - ${escapeHtml(item.end_time || '—')}</td>
        <td>${escapeHtml(item.room || '—')}</td>
        <td>
          <div>${escapeHtml(item.semester || '—')}</div>
          <div class="ins-muted">${escapeHtml(item.academic_year || '—')}</div>
        </td>
        <td>
          <button class="btn ins-link-btn btn-view-details" data-id="${item.class_id}" type="button">
            View Details
          </button>
        </td>
      </tr>
    `).join('');
  
    document.querySelectorAll('.btn-view-details').forEach(btn => {
      btn.addEventListener('click', () => openClassDetails(btn.dataset.id));
    });
  }
  
  function fillDetails(details) {
    els.detailCourseName.textContent = details.course_name || '—';
    els.detailCourseId.textContent = details.course_id || '—';
    els.detailSemester.textContent = details.semester || '—';
    els.detailYear.textContent = details.academic_year || '—';
    els.detailClassId.textContent = details.class_id || '—';
    els.detailSection.textContent = details.section || '—';
    els.detailScheduleDay.textContent = details.schedule_day || '—';
    els.detailRoom.textContent = details.room || '—';
    els.detailStartTime.textContent = details.start_time || '—';
    els.detailEndTime.textContent = details.end_time || '—';
    els.detailAssignedDate.textContent = details.assigned_date || '—';
  }
  
  function renderStudents(students) {
    els.detailStudentsCount.textContent = students.length;
  
    if (!students.length) {
      els.studentsList.innerHTML = `<div class="ins-empty-inline">No students enrolled in this class.</div>`;
      return;
    }
  
    els.studentsList.innerHTML = students.map(student => `
      <div class="ins-student-card d-flex justify-content-between align-items-start gap-3">
        <div>
          <div class="ins-student-name">${escapeHtml(student.full_name)}</div>
          <div class="ins-student-meta">Username: ${escapeHtml(student.username || '—')}</div>
          <div class="ins-student-meta">Email: ${escapeHtml(student.email || '—')}</div>
          <div class="ins-student-meta">Status: ${escapeHtml(student.status || '—')}</div>
          <div class="ins-student-meta">Enrolled At: ${escapeHtml(student.enrolled_at || '—')}</div>
        </div>
        <div>
          <button class="btn btn-outline-danger rounded-4 px-3 btn-remove-student" type="button" data-id="${student.student_id}" data-name="${escapeHtml(student.full_name)}">
            Remove
          </button>
        </div>
      </div>
    `).join('');
  
    document.querySelectorAll('.btn-remove-student').forEach(btn => {
      btn.addEventListener('click', () => {
        state.removableStudentId = btn.dataset.id;
        els.removeStudentName.textContent = btn.dataset.name;
        removeStudentModal.show();
      });
    });
  }
  
  async function loadClasses() {
    try {
      const res = await fetch('/attendly/backend/api/instructor/classes/list.php', {
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
      fillFilters(state.classes);
      renderClassesTable();
    } catch (error) {
      showMessage('Something went wrong while loading classes.');
    }
  }
  
  async function openClassDetails(classId) {
    state.currentClassId = classId;
    els.studentsList.innerHTML = `<div class="ins-empty-inline">Loading students...</div>`;
  
    try {
      const [detailsRes, studentsRes] = await Promise.all([
        fetch(`/attendly/backend/api/instructor/classes/details.php?class_id=${encodeURIComponent(classId)}`, {
          credentials: 'same-origin'
        }),
        fetch(`/attendly/backend/api/instructor/classes/students.php?class_id=${encodeURIComponent(classId)}`, {
          credentials: 'same-origin'
        })
      ]);
  
      const detailsData = await detailsRes.json();
      const studentsData = await studentsRes.json();
  
      if (!detailsRes.ok || !detailsData.success) {
        showMessage(detailsData.message || 'Failed to load class details.');
        return;
      }
  
      if (!studentsRes.ok || !studentsData.success) {
        showMessage(studentsData.message || 'Failed to load students.');
        return;
      }
  
      state.currentClassDetails = detailsData.data.class;
      state.currentStudents = studentsData.data.students || [];
  
      fillDetails(state.currentClassDetails);
      renderStudents(state.currentStudents);
      fillEditForm(state.currentClassDetails);
      drawer.show();
    } catch (error) {
      showMessage('Something went wrong while loading class details.');
    }
  }
  
  async function loadAvailableStudents() {
    if (!state.currentClassId) return;
  
    try {
      const res = await fetch(`/attendly/backend/api/instructor/classes/students.php?class_id=${encodeURIComponent(state.currentClassId)}&available=1`, {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to load students list.');
        return;
      }
  
      const students = data.data.students || [];
      els.studentSelect.innerHTML = `<option value="">Select student</option>` + students.map(student => `
        <option value="${student.student_id}">${escapeHtml(student.full_name)}${student.username ? ' - ' + escapeHtml(student.username) : ''}</option>
      `).join('');
    } catch (error) {
      showMessage('Something went wrong while loading student options.');
    }
  }
  
  function fillEditForm(details) {
    els.editSection.value = details.section || '';
    els.editRoom.value = details.room || '';
    els.editScheduleDay.value = details.schedule_day || 'Sunday';
    els.editStartTime.value = details.start_time_raw || '';
    els.editEndTime.value = details.end_time_raw || '';
  }
  
  async function saveStudent() {
    const studentId = els.studentSelect.value;
    const status = els.studentEnrollStatus.value;
  
    if (!state.currentClassId) {
      showMessage('No class selected.');
      return;
    }
  
    if (!studentId) {
      showMessage('Please select a student.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('class_id', state.currentClassId);
      formData.append('student_id', studentId);
      formData.append('status', status);
  
      const res = await fetch('/attendly/backend/api/instructor/classes/add_student.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to add student.');
        return;
      }
  
      addStudentModal.hide();
      await openClassDetails(state.currentClassId);
      showMessage(data.message || 'Student added successfully.');
    } catch (error) {
      showMessage('Something went wrong while adding student.');
    }
  }
  
  async function removeStudent() {
    if (!state.currentClassId || !state.removableStudentId) {
      showMessage('Missing class or student data.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('class_id', state.currentClassId);
      formData.append('student_id', state.removableStudentId);
  
      const res = await fetch('/attendly/backend/api/instructor/classes/remove_student.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to remove student.');
        return;
      }
  
      removeStudentModal.hide();
      state.removableStudentId = null;
      await openClassDetails(state.currentClassId);
      showMessage(data.message || 'Student removed successfully.');
    } catch (error) {
      showMessage('Something went wrong while removing student.');
    }
  }
  
  async function saveClassEdit() {
    if (!state.currentClassId) {
      showMessage('No class selected.');
      return;
    }
  
    const section = els.editSection.value.trim();
    const room = els.editRoom.value.trim();
    const scheduleDay = els.editScheduleDay.value.trim();
    const startTime = els.editStartTime.value;
    const endTime = els.editEndTime.value;
  
    if (!section || !room || !scheduleDay || !startTime || !endTime) {
      showMessage('Please fill all fields.');
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('class_id', state.currentClassId);
      formData.append('section', section);
      formData.append('room', room);
      formData.append('schedule_day', scheduleDay);
      formData.append('start_time', startTime);
      formData.append('end_time', endTime);
  
      const res = await fetch('/attendly/backend/api/instructor/classes/update_class.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to update class.');
        return;
      }
  
      editClassModal.hide();
      await loadClasses();
      await openClassDetails(state.currentClassId);
      showMessage(data.message || 'Class updated successfully.');
    } catch (error) {
      showMessage('Something went wrong while updating class.');
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
  
  els.searchInput.addEventListener('input', renderClassesTable);
  els.semesterFilter.addEventListener('change', renderClassesTable);
  els.yearFilter.addEventListener('change', renderClassesTable);
  
  els.btnClearFilters.addEventListener('click', () => {
    els.searchInput.value = '';
    els.semesterFilter.value = '';
    els.yearFilter.value = '';
    renderClassesTable();
  });
  
  els.btnRefresh.addEventListener('click', loadClasses);
  els.btnLogout.addEventListener('click', logout);
  els.btnLogoutM.addEventListener('click', logout);
  
  els.btnOpenAddStudentModal.addEventListener('click', async () => {
    await loadAvailableStudents();
    addStudentModal.show();
  });
  
  els.btnOpenEditModal.addEventListener('click', () => {
    if (!state.currentClassDetails) {
      showMessage('No class selected.');
      return;
    }
    fillEditForm(state.currentClassDetails);
    editClassModal.show();
  });
  
  els.btnSaveStudent.addEventListener('click', saveStudent);
  els.btnSaveClassEdit.addEventListener('click', saveClassEdit);
  els.btnConfirmRemoveStudent.addEventListener('click', removeStudent);
  
  loadClasses();