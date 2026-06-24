const state = {
    profile: null
  };
  
  const els = {
    btnRefresh: document.getElementById('btnRefresh'),
    btnTopProfile: document.getElementById('btnTopProfile'),
    topUserName: document.getElementById('topUserName'),
    fullNameText: document.getElementById('fullNameText'),
    usernameText: document.getElementById('usernameText'),
    emailText: document.getElementById('emailText'),
    roleText: document.getElementById('roleText'),
    statusText: document.getElementById('statusText'),
    createdAtText: document.getElementById('createdAtText'),
    btnOpenEditProfile: document.getElementById('btnOpenEditProfile'),
    btnOpenChangePassword: document.getElementById('btnOpenChangePassword'),
    btnOpenLogout: document.getElementById('btnOpenLogout'),
    btnLogoutSide: document.getElementById('btnLogoutSide'),
    btnLogoutSideM: document.getElementById('btnLogoutSideM'),
    editFirstName: document.getElementById('editFirstName'),
    editLastName: document.getElementById('editLastName'),
    editUsername: document.getElementById('editUsername'),
    editEmail: document.getElementById('editEmail'),
    btnSaveProfile: document.getElementById('btnSaveProfile'),
    currentPassword: document.getElementById('currentPassword'),
    newPassword: document.getElementById('newPassword'),
    confirmPassword: document.getElementById('confirmPassword'),
    btnSavePassword: document.getElementById('btnSavePassword'),
    btnConfirmLogout: document.getElementById('btnConfirmLogout')
  };
  
  const editProfileModal = new bootstrap.Modal(document.getElementById('editProfileModal'));
  const changePasswordModal = new bootstrap.Modal(document.getElementById('changePasswordModal'));
  const logoutModal = new bootstrap.Modal(document.getElementById('logoutModal'));
  
  function showMessage(message) {
    alert(message);
  }
  
  function renderProfile() {
    if (!state.profile) return;
  
    const fullName = `${state.profile.first_name || ''} ${state.profile.last_name || ''}`.trim();
  
    els.topUserName.textContent = fullName || 'Instructor';
    els.fullNameText.textContent = fullName || '—';
    els.usernameText.textContent = state.profile.username || '—';
    els.emailText.textContent = state.profile.email || '—';
    els.roleText.textContent = state.profile.role || '—';
    els.statusText.textContent = Number(state.profile.is_active) === 1 ? 'Active' : 'Inactive';
    els.createdAtText.textContent = state.profile.created_at || '—';
  }
  
  function fillEditForm() {
    if (!state.profile) return;
  
    els.editFirstName.value = state.profile.first_name || '';
    els.editLastName.value = state.profile.last_name || '';
    els.editUsername.value = state.profile.username || '';
    els.editEmail.value = state.profile.email || '';
  }
  
  async function loadProfile() {
    try {
      const res = await fetch('/attendly/backend/api/instructor/profile/get.php', {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          window.location.href = '/attendly/public/auth/login/index.html';
          return;
        }
        showMessage(data.message || 'Failed to load profile.');
        return;
      }
  
      state.profile = data.data.profile || null;
      renderProfile();
    } catch (error) {
      showMessage('Something went wrong while loading profile.');
    }
  }
  
  async function saveProfile() {
    const firstName = els.editFirstName.value.trim();
    const lastName = els.editLastName.value.trim();
    const username = els.editUsername.value.trim();
    const email = els.editEmail.value.trim();
  
    if (!firstName || !lastName || !username || !email) {
      showMessage('Please fill all profile fields.');
      return;
    }
  
    const formData = new FormData();
    formData.append('first_name', firstName);
    formData.append('last_name', lastName);
    formData.append('username', username);
    formData.append('email', email);
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/profile/update.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to update profile.');
        return;
      }
  
      editProfileModal.hide();
      await loadProfile();
      showMessage(data.message || 'Profile updated successfully.');
    } catch (error) {
      showMessage('Something went wrong while updating profile.');
    }
  }
  
  async function changePassword() {
    const currentPassword = els.currentPassword.value;
    const newPassword = els.newPassword.value;
    const confirmPassword = els.confirmPassword.value;
  
    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('Please fill all password fields.');
      return;
    }
  
    if (newPassword.length < 6) {
      showMessage('New password must be at least 6 characters.');
      return;
    }
  
    if (newPassword !== confirmPassword) {
      showMessage('New password and confirm password do not match.');
      return;
    }
  
    const formData = new FormData();
    formData.append('current_password', currentPassword);
    formData.append('new_password', newPassword);
    formData.append('confirm_password', confirmPassword);
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/profile/change_password.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to change password.');
        return;
      }
  
      changePasswordModal.hide();
      els.currentPassword.value = '';
      els.newPassword.value = '';
      els.confirmPassword.value = '';
      showMessage(data.message || 'Password changed successfully.');
    } catch (error) {
      showMessage('Something went wrong while changing password.');
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
  
  els.btnRefresh.addEventListener('click', loadProfile);
  els.btnTopProfile.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  
  els.btnOpenEditProfile.addEventListener('click', () => {
    fillEditForm();
    editProfileModal.show();
  });
  
  els.btnOpenChangePassword.addEventListener('click', () => {
    els.currentPassword.value = '';
    els.newPassword.value = '';
    els.confirmPassword.value = '';
    changePasswordModal.show();
  });
  
  els.btnOpenLogout.addEventListener('click', () => {
    logoutModal.show();
  });
  
  els.btnLogoutSide.addEventListener('click', () => {
    logoutModal.show();
  });
  
  els.btnLogoutSideM.addEventListener('click', () => {
    logoutModal.show();
  });
  
  els.btnSaveProfile.addEventListener('click', saveProfile);
  els.btnSavePassword.addEventListener('click', changePassword);
  els.btnConfirmLogout.addEventListener('click', logout);
  
  loadProfile();