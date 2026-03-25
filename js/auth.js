// =============================================
// StudyFlow — Auth JavaScript
// Handles Login & Registration with validation
// =============================================

/**
 * Switches between Login and Register tabs
 * @param {string} tab - 'login' or 'register'
 */
function showTab(tab) {
  // Update tab button states
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(form => form.classList.remove('active-form'));

  if (tab === 'login') {
    document.querySelectorAll('.tab-btn')[0].classList.add('active');
    document.getElementById('loginForm').classList.add('active-form');
  } else {
    document.querySelectorAll('.tab-btn')[1].classList.add('active');
    document.getElementById('registerForm').classList.add('active-form');
  }
}

/**
 * Validates that a field is not empty
 * @param {string} value
 * @returns {boolean}
 */
function isEmpty(value) {
  return value.trim() === '';
}

/**
 * Validates email format using regex
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sets an error message on a field
 * @param {string} errId - ID of the error span element
 * @param {string} message - Error message to display
 */
function setError(errId, message) {
  document.getElementById(errId).textContent = message;
}

/**
 * Clears an error message
 * @param {string} errId
 */
function clearError(errId) {
  document.getElementById(errId).textContent = '';
}

// ---- LOGIN HANDLER ----
/**
 * Handles login form submission with full input validation
 * @param {Event} e - Form submit event
 */
function handleLogin(e) {
  e.preventDefault();

  // Clear previous errors
  clearError('loginEmailErr');
  clearError('loginPasswordErr');
  clearError('loginFormErr');

  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  let hasError = false;

  // Validate email
  if (isEmpty(email)) {
    setError('loginEmailErr', 'Email is required.');
    hasError = true;
  } else if (!isValidEmail(email)) {
    setError('loginEmailErr', 'Please enter a valid email address.');
    hasError = true;
  }

  // Validate password
  if (isEmpty(password)) {
    setError('loginPasswordErr', 'Password is required.');
    hasError = true;
  }

  if (hasError) return;

  // Check against stored users in localStorage (simulates backend auth)
  const users = JSON.parse(localStorage.getItem('sf_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    setError('loginFormErr', 'Incorrect email or password. Please try again.');
    return;
  }

  // Store logged-in session
  localStorage.setItem('sf_current_user', JSON.stringify(user));

  // Redirect to dashboard
  window.location.href = 'index.html';
}

// ---- REGISTER HANDLER ----
/**
 * Handles registration form submission with full input validation
 * @param {Event} e - Form submit event
 */
function handleRegister(e) {
  e.preventDefault();

  // Clear previous errors
  ['regNameErr', 'regEmailErr', 'regPasswordErr', 'regConfirmErr', 'regFormErr']
    .forEach(id => clearError(id));

  const name     = document.getElementById('regName').value;
  const email    = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  const confirm  = document.getElementById('regConfirm').value;

  let hasError = false;

  // Validate name
  if (isEmpty(name)) {
    setError('regNameErr', 'Full name is required.');
    hasError = true;
  } else if (name.trim().length < 2) {
    setError('regNameErr', 'Name must be at least 2 characters.');
    hasError = true;
  }

  // Validate email
  if (isEmpty(email)) {
    setError('regEmailErr', 'Email is required.');
    hasError = true;
  } else if (!isValidEmail(email)) {
    setError('regEmailErr', 'Please enter a valid email address.');
    hasError = true;
  }

  // Validate password
  if (isEmpty(password)) {
    setError('regPasswordErr', 'Password is required.');
    hasError = true;
  } else if (password.length < 6) {
    setError('regPasswordErr', 'Password must be at least 6 characters.');
    hasError = true;
  }

  // Validate confirm password
  if (isEmpty(confirm)) {
    setError('regConfirmErr', 'Please confirm your password.');
    hasError = true;
  } else if (password !== confirm) {
    setError('regConfirmErr', 'Passwords do not match.');
    hasError = true;
  }

  if (hasError) return;

  // Check if email already exists
  const users = JSON.parse(localStorage.getItem('sf_users') || '[]');
  if (users.find(u => u.email === email)) {
    setError('regFormErr', 'An account with this email already exists.');
    return;
  }

  // Save new user
  const newUser = { id: Date.now(), name: name.trim(), email, password };
  users.push(newUser);
  localStorage.setItem('sf_users', JSON.stringify(users));

  // Auto-login and redirect
  localStorage.setItem('sf_current_user', JSON.stringify(newUser));
  window.location.href = 'index.html';
}

// ---- PAGE LOAD CHECK ----
// If user is already logged in, redirect to dashboard
window.addEventListener('DOMContentLoaded', () => {
  const currentUser = localStorage.getItem('sf_current_user');
  if (currentUser && window.location.pathname.includes('login')) {
    window.location.href = 'index.html';
  }
});
