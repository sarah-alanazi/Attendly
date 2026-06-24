const state = {
    notifications: [],
    unreadOnly: false
  };
  
  const els = {
    instructorName: document.getElementById('instructorName'),
    btnRefresh: document.getElementById('btnRefresh'),
    btnLogout: document.getElementById('btnLogout'),
    btnLogoutM: document.getElementById('btnLogoutM'),
    btnShowAll: document.getElementById('btnShowAll'),
    btnShowUnread: document.getElementById('btnShowUnread'),
    notificationsList: document.getElementById('notificationsList'),
    notificationsCountBadge: document.getElementById('notificationsCountBadge')
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
  
  function typeChip(type) {
    const value = String(type || '').toLowerCase();
    if (value === 'attendance_update') return `<span class="ins-chip ok">Attendance Update</span>`;
    if (value === 'class_reminder') return `<span class="ins-chip warn">Class Reminder</span>`;
    if (value === 'warning') return `<span class="ins-chip danger">Warning</span>`;
    return `<span class="ins-chip">${escapeHtml(type || '—')}</span>`;
  }
  
  function readChip(isRead) {
    if (Number(isRead) === 1) {
      return `<span class="ins-chip ok">Read</span>`;
    }
    return `<span class="ins-chip danger">Unread</span>`;
  }
  
  function getVisibleNotifications() {
    if (state.unreadOnly) {
      return state.notifications.filter(item => Number(item.is_read) === 0);
    }
    return state.notifications;
  }
  
  function renderNotifications() {
    const items = getVisibleNotifications();
    els.notificationsCountBadge.textContent = `${items.length} Notification${items.length === 1 ? '' : 's'}`;
  
    if (!items.length) {
      els.notificationsList.innerHTML = `<div class="ins-empty">No notifications found.</div>`;
      return;
    }
  
    els.notificationsList.innerHTML = items.map(item => `
      <div class="ins-card ${Number(item.is_read) === 0 ? '' : ''}">
        <div class="p-3">
          <div class="d-flex flex-wrap justify-content-between align-items-start gap-3">
            <div class="flex-grow-1">
              <div class="fw-bold mb-2">${escapeHtml(item.message || '—')}</div>
              <div class="d-flex flex-wrap gap-2 mb-2">
                ${typeChip(item.type)}
                ${readChip(item.is_read)}
              </div>
              <div class="ins-muted">Sent at: ${escapeHtml(item.sent_at || '—')}</div>
            </div>
  
            <div>
              ${Number(item.is_read) === 0 ? `
                <button class="btn btn-sm btn-outline-primary rounded-4 btn-mark-read" data-id="${item.notification_id}" type="button">
                  Mark as Read
                </button>
              ` : `
                <button class="btn btn-sm btn-light rounded-4" type="button" disabled>
                  Already Read
                </button>
              `}
            </div>
          </div>
        </div>
      </div>
    `).join('');
  
    document.querySelectorAll('.btn-mark-read').forEach(btn => {
      btn.addEventListener('click', () => markAsRead(btn.dataset.id));
    });
  
    if (state.unreadOnly) {
      els.btnShowAll.className = 'btn btn-outline-secondary rounded-4';
      els.btnShowUnread.className = 'btn btn-primary rounded-4';
    } else {
      els.btnShowAll.className = 'btn btn-primary rounded-4';
      els.btnShowUnread.className = 'btn btn-outline-primary rounded-4';
    }
  }
  
  async function loadNotifications() {
    try {
      const res = await fetch('/attendly/backend/api/instructor/notifications/list.php', {
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          window.location.href = '/attendly/public/auth/login/index.html';
          return;
        }
        showMessage(data.message || 'Failed to load notifications.');
        return;
      }
  
      state.notifications = data.data.notifications || [];
      els.instructorName.textContent = data.data.instructor_name || 'Instructor';
      renderNotifications();
    } catch (error) {
      showMessage('Something went wrong while loading notifications.');
    }
  }
  
  async function markAsRead(notificationId) {
    const formData = new FormData();
    formData.append('notification_id', notificationId);
  
    try {
      const res = await fetch('/attendly/backend/api/instructor/notifications/mark_read.php', {
        method: 'POST',
        body: formData,
        credentials: 'same-origin'
      });
  
      const data = await res.json();
  
      if (!res.ok || !data.success) {
        showMessage(data.message || 'Failed to mark notification as read.');
        return;
      }
  
      await loadNotifications();
    } catch (error) {
      showMessage('Something went wrong while updating notification.');
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
  
  els.btnShowAll.addEventListener('click', () => {
    state.unreadOnly = false;
    renderNotifications();
  });
  
  els.btnShowUnread.addEventListener('click', () => {
    state.unreadOnly = true;
    renderNotifications();
  });
  
  els.btnRefresh.addEventListener('click', loadNotifications);
  els.btnLogout.addEventListener('click', logout);
  els.btnLogoutM.addEventListener('click', logout);
  
  loadNotifications();