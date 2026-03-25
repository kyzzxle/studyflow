// =============================================
// StudyFlow — Main Application JavaScript
// Handles tasks, calendar, charts, reminders
// =============================================

// ---- State Variables ----
let tasks = [];             // All tasks array
let currentFilter = 'all'; // Current task filter
let editingTaskId = null;   // ID of task being edited (null = new task)
let calDate = new Date();   // Current calendar month
let selectedCalDate = null; // Selected date on calendar

// ---- Page Load ----
window.addEventListener('DOMContentLoaded', () => {
  // Check auth — redirect to login if no user session
  const user = JSON.parse(localStorage.getItem('sf_current_user') || 'null');
  if (!user) {
    window.location.href = 'login.html';
    return;
  }

  // Set user display info
  document.getElementById('userNameDisplay').textContent = user.name;
  document.getElementById('userAvatar').textContent = user.name.charAt(0).toUpperCase();

  // Set current date in topbar
  const now = new Date();
  document.getElementById('pageDate').textContent =
    now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  // Load tasks from localStorage
  loadTasks(user.id);

  // Render dashboard
  renderDashboard();

  // Start reminder checker (checks every 30 seconds)
  startReminderChecker();
});

// =============================================
// DATA LAYER — Load & Save Tasks
// =============================================

/**
 * Loads tasks for the current user from localStorage
 * @param {number} userId
 */
function loadTasks(userId) {
  const allTasks = JSON.parse(localStorage.getItem('sf_tasks') || '{}');
  tasks = allTasks[userId] || [];
}

/**
 * Saves tasks for the current user to localStorage
 */
function saveTasks() {
  const user = JSON.parse(localStorage.getItem('sf_current_user'));
  const allTasks = JSON.parse(localStorage.getItem('sf_tasks') || '{}');
  allTasks[user.id] = tasks;
  localStorage.setItem('sf_tasks', JSON.stringify(allTasks));
}

// =============================================
// NAVIGATION
// =============================================

/**
 * Shows a content section and updates nav highlight
 * @param {string} name - Section name: dashboard, tasks, schedule, progress
 */
function showSection(name) {
  // Hide all sections
  document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active-section'));
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

  // Show target section
  document.getElementById('section-' + name).classList.add('active-section');

  // Highlight nav item
  document.querySelectorAll('.nav-item').forEach(n => {
    if (n.textContent.toLowerCase().includes(name)) n.classList.add('active');
  });

  // Update page title
  const titles = { dashboard: 'Dashboard', tasks: 'My Tasks', schedule: 'Schedule', progress: 'Progress' };
  document.getElementById('pageTitle').textContent = titles[name] || name;

  // Section-specific renders
  if (name === 'tasks')    renderTasksSection();
  if (name === 'schedule') renderCalendar();
  if (name === 'progress') renderCharts();
}

/** Toggles sidebar open/close on mobile */
function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('open');
}

/** Logs out the current user */
function logout() {
  localStorage.removeItem('sf_current_user');
  window.location.href = 'login.html';
}

// =============================================
// DASHBOARD
// =============================================

/** Renders all dashboard components: stats, progress bar, upcoming, overdue */
function renderDashboard() {
  const total     = tasks.length;
  const pending   = tasks.filter(t => t.status === 'Pending').length;
  const inProg    = tasks.filter(t => t.status === 'In Progress').length;
  const done      = tasks.filter(t => t.status === 'Done').length;
  const pct       = total > 0 ? Math.round((done / total) * 100) : 0;

  // Update stat cards
  document.getElementById('statTotal').textContent     = total;
  document.getElementById('statPending').textContent   = pending;
  document.getElementById('statInProgress').textContent = inProg;
  document.getElementById('statDone').textContent      = done;

  // Update progress bar
  document.getElementById('progressPercent').textContent  = pct + '%';
  document.getElementById('progressBarFill').style.width  = pct + '%';

  // Upcoming tasks (due in next 7 days, not Done)
  const now  = new Date();
  const soon = new Date(); soon.setDate(soon.getDate() + 7);
  const upcoming = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return t.status !== 'Done' && d >= now && d <= soon;
  }).sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

  // Overdue tasks (past due date, not Done)
  const overdue = tasks.filter(t => {
    const d = new Date(t.dueDate);
    return t.status !== 'Done' && d < now;
  });

  renderTaskList('upcomingList', upcoming);
  renderTaskList('overdueList', overdue, true);
}

// =============================================
// TASK RENDERING
// =============================================

/**
 * Renders a list of tasks into a container
 * @param {string} containerId
 * @param {Array} taskArr
 * @param {boolean} isOverdue - Applies overdue style
 */
function renderTaskList(containerId, taskArr, isOverdue = false) {
  const container = document.getElementById(containerId);
  if (taskArr.length === 0) {
    container.innerHTML = '<p class="empty-msg">No tasks here 🎉</p>';
    return;
  }
  container.innerHTML = taskArr.map(t => buildTaskCard(t, isOverdue)).join('');
}

/**
 * Renders task grid in the Tasks section, respecting active filter
 */
function renderTasksSection() {
  const filtered = currentFilter === 'all'
    ? tasks
    : tasks.filter(t => t.status === currentFilter);

  const container = document.getElementById('tasksList');
  if (filtered.length === 0) {
    container.innerHTML = '<p class="empty-msg">No tasks found. Add one! 📝</p>';
    return;
  }
  container.innerHTML = filtered.map(t => buildTaskCard(t)).join('');
}

/**
 * Builds HTML string for a single task card
 * @param {Object} task
 * @param {boolean} overdue
 * @returns {string} HTML string
 */
function buildTaskCard(task, overdue = false) {
  const statusClass = {
    'Pending': 'badge-pending',
    'In Progress': 'badge-progress',
    'Done': 'badge-done'
  }[task.status] || '';

  const priorityClass = {
    'Low': 'badge-low',
    'Medium': 'badge-medium',
    'High': 'badge-high'
  }[task.priority] || '';

  const dueFormatted = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '';

  const timeStr = task.reminderTime ? ` at ${task.reminderTime}` : '';

  return `
    <div class="task-card ${overdue ? 'overdue' : ''}">
      <div class="task-card-top">
        <span class="task-card-title">${escapeHtml(task.title)}</span>
        <span class="task-card-subject">${escapeHtml(task.subject)}</span>
      </div>
      ${task.description ? `<p class="task-card-desc">${escapeHtml(task.description)}</p>` : ''}
      <div class="task-card-meta">
        <span class="task-date">📅 ${dueFormatted}${timeStr}</span>
        <span class="badge ${statusClass}">${task.status}</span>
        <span class="badge ${priorityClass}">${task.priority}</span>
      </div>
      <div class="task-actions">
        <button class="btn-edit" onclick="openEditModal(${task.id})">✏️ Edit</button>
        <button class="btn-delete" onclick="deleteTask(${task.id})">🗑️ Delete</button>
      </div>
    </div>`;
}

// =============================================
// TASK CRUD — Create, Read, Update, Delete
// =============================================

/** Opens the Add Task modal */
function openModal() {
  editingTaskId = null;
  document.getElementById('modalTitle').textContent = 'Add New Task';
  document.getElementById('saveTaskBtn').textContent = 'Save Task';
  document.getElementById('taskForm').reset();
  clearTaskErrors();
  document.getElementById('modalOverlay').classList.add('open');
}

/**
 * Opens the Edit Task modal for a specific task
 * @param {number} taskId
 */
function openEditModal(taskId) {
  const task = tasks.find(t => t.id === taskId);
  if (!task) return;

  editingTaskId = taskId;
  document.getElementById('modalTitle').textContent = 'Edit Task';
  document.getElementById('saveTaskBtn').textContent = 'Update Task';

  // Populate form fields
  document.getElementById('taskTitle').value    = task.title;
  document.getElementById('taskSubject').value  = task.subject;
  document.getElementById('taskDesc').value     = task.description || '';
  document.getElementById('taskDate').value     = task.dueDate;
  document.getElementById('taskTime').value     = task.reminderTime || '';
  document.getElementById('taskPriority').value = task.priority;
  document.getElementById('taskStatus').value   = task.status;

  clearTaskErrors();
  document.getElementById('modalOverlay').classList.add('open');
}

/** Closes the modal */
function closeModal() {
  document.getElementById('modalOverlay').classList.remove('open');
  editingTaskId = null;
}

/** Closes modal when clicking the overlay background */
function closeModalOutside(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModal();
}

/** Clears all task form validation errors */
function clearTaskErrors() {
  ['taskTitleErr', 'taskSubjectErr', 'taskDateErr'].forEach(id => {
    document.getElementById(id).textContent = '';
  });
}

/**
 * Handles task form submission — validates and saves
 * @param {Event} e
 */
function saveTask(e) {
  e.preventDefault();
  clearTaskErrors();

  const title    = document.getElementById('taskTitle').value.trim();
  const subject  = document.getElementById('taskSubject').value.trim();
  const desc     = document.getElementById('taskDesc').value.trim();
  const dueDate  = document.getElementById('taskDate').value;
  const remTime  = document.getElementById('taskTime').value;
  const priority = document.getElementById('taskPriority').value;
  const status   = document.getElementById('taskStatus').value;

  let hasError = false;

  // Input validation
  if (!title) {
    document.getElementById('taskTitleErr').textContent = 'Task title is required.';
    hasError = true;
  } else if (title.length < 3) {
    document.getElementById('taskTitleErr').textContent = 'Title must be at least 3 characters.';
    hasError = true;
  }

  if (!subject) {
    document.getElementById('taskSubjectErr').textContent = 'Subject is required.';
    hasError = true;
  }

  if (!dueDate) {
    document.getElementById('taskDateErr').textContent = 'Due date is required.';
    hasError = true;
  }

  if (hasError) return;

  if (editingTaskId !== null) {
    // Update existing task
    const idx = tasks.findIndex(t => t.id === editingTaskId);
    if (idx > -1) {
      tasks[idx] = { ...tasks[idx], title, subject, description: desc, dueDate, reminderTime: remTime, priority, status };
    }
    showToast('Task updated!', `"${title}" has been updated.`, 'success');
  } else {
    // Add new task
    const newTask = {
      id: Date.now(),
      title, subject,
      description: desc,
      dueDate,
      reminderTime: remTime,
      priority,
      status,
      createdAt: new Date().toISOString()
    };
    tasks.push(newTask);
    showToast('Task added!', `"${title}" has been scheduled.`, 'success');
  }

  saveTasks();
  closeModal();
  renderDashboard();
  renderTasksSection();
}

/**
 * Deletes a task by ID after confirmation
 * @param {number} taskId
 */
function deleteTask(taskId) {
  if (!confirm('Are you sure you want to delete this task?')) return;
  tasks = tasks.filter(t => t.id !== taskId);
  saveTasks();
  renderDashboard();
  renderTasksSection();
  showToast('Task deleted', 'The task has been removed.', 'error');
}

// =============================================
// FILTER & SEARCH
// =============================================

/**
 * Filters task grid by status
 * @param {string} filter - 'all', 'Pending', 'In Progress', 'Done'
 * @param {HTMLElement} btn - The clicked filter button
 */
function filterTasks(filter, btn) {
  currentFilter = filter;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderTasksSection();
}

/**
 * Searches tasks by title or subject (Enhancement feature)
 */
function searchTasks() {
  const query = document.getElementById('searchInput').value.toLowerCase().trim();
  if (!query) {
    renderTasksSection();
    return;
  }
  const results = tasks.filter(t =>
    t.title.toLowerCase().includes(query) ||
    t.subject.toLowerCase().includes(query) ||
    (t.description && t.description.toLowerCase().includes(query))
  );
  const container = document.getElementById('tasksList');
  showSection('tasks'); // Switch to tasks view

  if (results.length === 0) {
    container.innerHTML = '<p class="empty-msg">No tasks match your search.</p>';
  } else {
    container.innerHTML = results.map(t => buildTaskCard(t)).join('');
  }
}

// =============================================
// CALENDAR
// =============================================

/** Renders the calendar for the current calDate month */
function renderCalendar() {
  const year  = calDate.getFullYear();
  const month = calDate.getMonth();
  const today = new Date();

  // Month/year heading
  document.getElementById('calMonthYear').textContent =
    calDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const grid = document.getElementById('calendarGrid');
  grid.innerHTML = '';

  // Day name headers
  ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(day => {
    const el = document.createElement('div');
    el.className = 'cal-day-name';
    el.textContent = day;
    grid.appendChild(el);
  });

  // Blank cells before first day
  const firstDay = new Date(year, month, 1).getDay();
  for (let i = 0; i < firstDay; i++) {
    const blank = document.createElement('div');
    blank.className = 'cal-day other-month';
    // Show previous month days
    const prevMonthDays = new Date(year, month, 0).getDate();
    blank.textContent = prevMonthDays - firstDay + i + 1;
    grid.appendChild(blank);
  }

  // Days of the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const cell = document.createElement('div');
    cell.className = 'cal-day';
    cell.textContent = d;

    const cellDate = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;

    // Check if today
    if (d === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
      cell.classList.add('today');
    }

    // Check if this date has tasks
    if (tasks.some(t => t.dueDate === cellDate)) {
      cell.classList.add('has-tasks');
    }

    // Check if selected
    if (selectedCalDate === cellDate) cell.classList.add('selected');

    cell.addEventListener('click', () => selectCalDate(cellDate));
    grid.appendChild(cell);
  }
}

/**
 * Selects a calendar date and shows tasks for that day
 * @param {string} dateStr - YYYY-MM-DD
 */
function selectCalDate(dateStr) {
  selectedCalDate = dateStr;
  renderCalendar(); // Re-render to show selected state

  const dayTasks = tasks.filter(t => t.dueDate === dateStr);
  const container = document.getElementById('scheduleTasks');

  const formatted = new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
  });

  if (dayTasks.length === 0) {
    container.innerHTML = `<p class="empty-msg">No tasks on ${formatted}</p>`;
  } else {
    container.innerHTML = `<h4 style="margin-bottom:12px; color:var(--text-muted); font-size:0.85rem; text-transform:uppercase; letter-spacing:0.06em">Tasks on ${formatted}</h4>` +
      dayTasks.map(t => buildTaskCard(t)).join('');
  }
}

/** Go to previous month */
function prevMonth() {
  calDate.setMonth(calDate.getMonth() - 1);
  renderCalendar();
}

/** Go to next month */
function nextMonth() {
  calDate.setMonth(calDate.getMonth() + 1);
  renderCalendar();
}

// =============================================
// CHARTS (Progress Section) — Enhancement Feature
// =============================================

/** Renders the status pie chart and subject bar chart using Canvas API */
function renderCharts() {
  renderStatusChart();
  renderSubjectChart();
}

/** Renders doughnut chart showing task status distribution */
function renderStatusChart() {
  const canvas = document.getElementById('statusChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const pending  = tasks.filter(t => t.status === 'Pending').length;
  const inProg   = tasks.filter(t => t.status === 'In Progress').length;
  const done     = tasks.filter(t => t.status === 'Done').length;
  const total    = pending + inProg + done;

  if (total === 0) {
    ctx.fillStyle = '#8892b0';
    ctx.font = '14px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('No tasks yet', 150, 150);
    return;
  }

  const data   = [pending, inProg, done];
  const colors = ['#ffd93d', '#a78bfa', '#6bcb77'];
  const labels = ['Pending', 'In Progress', 'Done'];
  const cx = 150, cy = 150, outerR = 100, innerR = 55;

  let startAngle = -Math.PI / 2;
  data.forEach((val, i) => {
    if (val === 0) return;
    const sliceAngle = (val / total) * (2 * Math.PI);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = colors[i];
    ctx.fill();
    startAngle += sliceAngle;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, 2 * Math.PI);
  ctx.fillStyle = getComputedStyle(document.documentElement)
    .getPropertyValue('--bg2').trim() || '#171b26';
  ctx.fill();

  // Center text
  ctx.fillStyle = '#e8eaf6';
  ctx.font = 'bold 22px DM Serif Display';
  ctx.textAlign = 'center';
  ctx.fillText(total, cx, cy + 6);
  ctx.font = '11px DM Sans';
  ctx.fillStyle = '#8892b0';
  ctx.fillText('Total', cx, cy + 22);

  // Legend
  let legendY = 20;
  labels.forEach((label, i) => {
    ctx.fillStyle = colors[i];
    ctx.fillRect(220, legendY, 14, 14);
    ctx.fillStyle = '#e8eaf6';
    ctx.font = '12px DM Sans';
    ctx.textAlign = 'left';
    ctx.fillText(`${label} (${data[i]})`, 240, legendY + 11);
    legendY += 26;
  });
}

/** Renders bar chart showing tasks grouped by subject */
function renderSubjectChart() {
  const canvas = document.getElementById('subjectChart');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (tasks.length === 0) {
    ctx.fillStyle = '#8892b0';
    ctx.font = '14px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText('No tasks yet', 200, 150);
    return;
  }

  // Count tasks per subject
  const subjectMap = {};
  tasks.forEach(t => {
    subjectMap[t.subject] = (subjectMap[t.subject] || 0) + 1;
  });

  const subjects = Object.keys(subjectMap);
  const counts   = subjects.map(s => subjectMap[s]);
  const maxCount = Math.max(...counts);
  const barColors = ['#6c8eff','#a78bfa','#6bcb77','#ffd93d','#ff6b6b','#4ecdc4'];

  const chartH = 200, chartW = 340;
  const offsetX = 40, offsetY = 20;
  const barW = Math.min(40, (chartW / subjects.length) - 12);

  // Y-axis label
  ctx.fillStyle = '#8892b0';
  ctx.font = '11px DM Sans';
  ctx.textAlign = 'right';
  for (let i = 0; i <= maxCount; i++) {
    const y = offsetY + chartH - (i / maxCount) * chartH;
    ctx.fillText(i, offsetX - 6, y + 4);
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.beginPath();
    ctx.moveTo(offsetX, y);
    ctx.lineTo(offsetX + chartW, y);
    ctx.stroke();
  }

  // Bars
  subjects.forEach((subj, i) => {
    const x = offsetX + i * (chartW / subjects.length) + (chartW / subjects.length - barW) / 2;
    const barH = (counts[i] / maxCount) * chartH;
    const y = offsetY + chartH - barH;

    ctx.fillStyle = barColors[i % barColors.length];
    ctx.beginPath();
    ctx.roundRect(x, y, barW, barH, 4);
    ctx.fill();

    // Value label
    ctx.fillStyle = '#e8eaf6';
    ctx.font = 'bold 13px DM Sans';
    ctx.textAlign = 'center';
    ctx.fillText(counts[i], x + barW / 2, y - 6);

    // Subject label
    ctx.fillStyle = '#8892b0';
    ctx.font = '11px DM Sans';
    ctx.fillText(subj.length > 8 ? subj.slice(0, 7) + '…' : subj, x + barW / 2, offsetY + chartH + 18);
  });
}

// =============================================
// REMINDERS — Enhancement Feature
// =============================================

/** Starts the interval-based reminder checker */
function startReminderChecker() {
  checkReminders(); // Check immediately on load
  setInterval(checkReminders, 30000); // Check every 30 seconds
}

/**
 * Checks if any task reminders are due now (within current minute)
 * Fires a toast notification for matching tasks
 */
function checkReminders() {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTime = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}`;

  tasks.forEach(task => {
    if (
      task.dueDate === todayStr &&
      task.reminderTime === currentTime &&
      task.status !== 'Done'
    ) {
      showToast(
        `⏰ Reminder: ${task.title}`,
        `Subject: ${task.subject} | Status: ${task.status}`,
        'reminder'
      );
    }
  });

  // Also check tasks due today (not done, no time set)
  tasks.forEach(task => {
    if (task.dueDate === todayStr && task.status !== 'Done' && !task.reminderTime) {
      const alreadyNotified = sessionStorage.getItem(`notified_${task.id}`);
      if (!alreadyNotified && now.getHours() === 8 && now.getMinutes() === 0) {
        showToast(`📚 Task due today`, task.title, 'reminder');
        sessionStorage.setItem(`notified_${task.id}`, 'true');
      }
    }
  });
}

// =============================================
// TOAST NOTIFICATIONS
// =============================================

/**
 * Shows a toast notification
 * @param {string} title
 * @param {string} message
 * @param {string} type - 'success', 'error', 'reminder'
 */
function showToast(title, message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `<strong>${title}</strong><span>${message}</span>`;
  container.appendChild(toast);

  // Auto-remove after 4 seconds
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    toast.style.transition = '0.4s ease';
    setTimeout(() => toast.remove(), 400);
  }, 4000);
}

// =============================================
// UTILITY
// =============================================

/**
 * Escapes HTML special characters to prevent XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
