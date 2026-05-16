/* ================================================
   SmartGate 360 – Login Page Logic
   Oleander Farms Operations System
   ================================================ */

'use strict';

const SESSION_KEY = 'sg360_session';

/* ── Redirect if already authenticated ───────── */
(function () {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY));
    if (s && s.role) window.location.replace('dashboard.html');
  } catch (_) {}
})();

/* ── DOM references ──────────────────────────── */
const form         = document.getElementById('login-form');
const emailInput   = document.getElementById('login-email');
const passwordInput= document.getElementById('login-password');
const roleSelect   = document.getElementById('login-role');
const rememberChk  = document.getElementById('remember-me');
const submitBtn    = document.getElementById('btn-submit');
const alertBox     = document.getElementById('login-alert');
const alertMsg     = document.getElementById('alert-msg');
const pwToggle     = document.getElementById('pw-toggle');
const eyeOpen      = document.getElementById('eye-open');
const eyeClosed    = document.getElementById('eye-closed');

/* Field error elements */
const emailErr    = document.getElementById('email-error');
const passwordErr = document.getElementById('password-error');
const roleErr     = document.getElementById('role-error');

/* ── Users cache ─────────────────────────────── */
let USERS = [];

async function loadUsers() {
  try {
    const res = await fetch('data/users.json');
    if (!res.ok) throw new Error('Failed to load users');
    USERS = await res.json();
  } catch (e) {
    console.warn('Could not load users.json, using fallback.', e);
    USERS = [
      { id:1, name:'Super Admin',       email:'admin@smartgate360.com',       username:'admin',        password:'123456', role:'Super Admin',         redirect:'dashboard.html' },
      { id:2, name:'Admin',             email:'manager@smartgate360.com',     username:'manager',      password:'123456', role:'Admin',               redirect:'dashboard.html' },
      { id:3, name:'Security Guard',    email:'security@smartgate360.com',    username:'security',     password:'123456', role:'Security Guard',      redirect:'visitor/visitor-list.html' },
      { id:4, name:'Gate Operator',     email:'gate@smartgate360.com',        username:'gate',         password:'123456', role:'Gate Operator',       redirect:'visitor/visitor-form.html' },
      { id:5, name:'Vehicle Manager',   email:'vehicle@smartgate360.com',     username:'vehicle',      password:'123456', role:'Vehicle Manager',     redirect:'vehicle/vehicle-list.html' },
      { id:6, name:'Inventory Manager', email:'inventory@smartgate360.com',   username:'inventory',    password:'123456', role:'Inventory Manager',   redirect:'inventory/inventory-list.html' },
      { id:7, name:'Housekeeping Manager', email:'housekeeping@smartgate360.com', username:'housekeeping', password:'123456', role:'Housekeeping Manager', redirect:'inventory/inventory-list.html' },
      { id:8, name:'Event Manager',     email:'events@smartgate360.com',      username:'events',       password:'123456', role:'Event Manager',       redirect:'visitor/visitor-list.html' },
      { id:9, name:'Receptionist',      email:'reception@smartgate360.com',   username:'reception',    password:'123456', role:'Receptionist',        redirect:'visitor/visitor-form.html' },
      { id:10,name:'Maintenance Staff', email:'maintenance@smartgate360.com', username:'maintenance',  password:'123456', role:'Maintenance Staff',   redirect:'inventory/inventory-list.html' }
    ];
  }
}

/* ── Remembered credentials ─────────────────── */
function loadRemembered() {
  try {
    const saved = JSON.parse(localStorage.getItem('sg360_remember'));
    if (saved) {
      emailInput.value = saved.email || '';
      if (saved.role) roleSelect.value = saved.role;
      rememberChk.checked = true;
    }
  } catch (_) {}
}

/* ── Validation helpers ──────────────────────── */
function showFieldError(inputEl, msgEl, message) {
  inputEl.classList.add('is-invalid');
  msgEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>${message}`;
  msgEl.classList.add('show');
}

function clearFieldError(inputEl, msgEl) {
  inputEl.classList.remove('is-invalid');
  msgEl.classList.remove('show');
}

function clearAllErrors() {
  clearFieldError(emailInput, emailErr);
  clearFieldError(passwordInput, passwordErr);
  clearFieldError(roleSelect, roleErr);
  alertBox.classList.remove('show');
}

function showAlert(title, detail) {
  alertBox.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
    <div class="alert-error-body">
      <p>${title}</p>
      ${detail ? `<p>${detail}</p>` : ''}
    </div>`;
  alertBox.classList.add('show');
}

/* ── Password visibility toggle ─────────────── */
pwToggle.addEventListener('click', () => {
  const isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  eyeOpen.style.display   = isPassword ? 'none'  : 'block';
  eyeClosed.style.display = isPassword ? 'block' : 'none';
  passwordInput.focus();
});

/* ── Quick role pill selection ───────────────── */
document.querySelectorAll('.quick-role-pill').forEach(pill => {
  pill.addEventListener('click', () => {
    const role  = pill.dataset.role;
    const email = pill.dataset.email;
    const pw    = pill.dataset.pw;

    // Update select
    roleSelect.value = role;

    // Fill credentials
    if (email) emailInput.value = email;
    if (pw)    passwordInput.value = pw;

    // Highlight active pill
    document.querySelectorAll('.quick-role-pill').forEach(p => p.classList.remove('active'));
    pill.classList.add('active');

    clearAllErrors();
    submitBtn.focus();
  });
});

/* ── Live clear errors on input ─────────────── */
emailInput.addEventListener('input',    () => clearFieldError(emailInput, emailErr));
passwordInput.addEventListener('input', () => clearFieldError(passwordInput, passwordErr));
roleSelect.addEventListener('change',   () => clearFieldError(roleSelect, roleErr));

/* ── Set loading state ───────────────────────── */
function setLoading(loading) {
  if (loading) {
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<div class="spinner"></div> Signing in…';
  } else {
    submitBtn.disabled = false;
    submitBtn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5">
        <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
        <polyline points="10 17 15 12 10 7"/>
        <line x1="15" y1="12" x2="3" y2="12"/>
      </svg>
      Sign In`;
  }
}

/* ── Form submit ─────────────────────────────── */
form.addEventListener('submit', async function (e) {
  e.preventDefault();
  clearAllErrors();

  const emailVal    = emailInput.value.trim();
  const passwordVal = passwordInput.value;
  const roleVal     = roleSelect.value;
  let valid = true;

  if (!emailVal) {
    showFieldError(emailInput, emailErr, 'Email or username is required.');
    valid = false;
  }

  if (!passwordVal) {
    showFieldError(passwordInput, passwordErr, 'Password is required.');
    valid = false;
  }

  if (!roleVal) {
    showFieldError(roleSelect, roleErr, 'Please select your role.');
    valid = false;
  }

  if (!valid) return;

  setLoading(true);

  // Simulate network latency
  await new Promise(r => setTimeout(r, 900));

  // Match user — support both email and username
  const user = USERS.find(u => {
    const emailMatch    = u.email    && u.email.toLowerCase()    === emailVal.toLowerCase();
    const usernameMatch = u.username && u.username.toLowerCase() === emailVal.toLowerCase();
    const passwordMatch = u.password === passwordVal;
    const roleMatch     = u.role     === roleVal;
    return (emailMatch || usernameMatch) && passwordMatch && roleMatch;
  });

  if (!user) {
    setLoading(false);

    // Determine what's wrong for a helpful message
    const userByEmail = USERS.find(u =>
      (u.email && u.email.toLowerCase() === emailVal.toLowerCase()) ||
      (u.username && u.username.toLowerCase() === emailVal.toLowerCase())
    );

    if (!userByEmail) {
      showAlert('Account not found', 'No account matches that email or username.');
      emailInput.classList.add('is-invalid');
    } else if (userByEmail.password !== passwordVal) {
      showAlert('Incorrect password', 'The password you entered is wrong.');
      passwordInput.classList.add('is-invalid');
      passwordInput.value = '';
      passwordInput.focus();
    } else {
      showAlert('Role mismatch', `Your account is registered as <strong>${userByEmail.role}</strong>, not ${roleVal}.`);
      roleSelect.classList.add('is-invalid');
    }
    return;
  }

  // Remember me
  if (rememberChk.checked) {
    localStorage.setItem('sg360_remember', JSON.stringify({ email: emailVal, role: roleVal }));
  } else {
    localStorage.removeItem('sg360_remember');
  }

  // Save session
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({
    id:       user.id,
    name:     user.name,
    username: user.username || user.email.split('@')[0],
    email:    user.email,
    role:     user.role
  }));

  // Success UI feedback
  submitBtn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5">
      <path d="M20 6L9 17l-5-5"/>
    </svg>
    Welcome, ${user.name.split(' ')[0]}!`;
  submitBtn.style.background = '#27ae60';

  await new Promise(r => setTimeout(r, 500));

  window.location.replace(user.redirect || 'dashboard.html');
});

/* ── Forgot password modal ───────────────────── */
const fpModal     = document.getElementById('forgot-modal');
const fpEmailInput= document.getElementById('fp-email');
const fpForm      = document.getElementById('forgot-form');

document.getElementById('btn-forgot').addEventListener('click', () => {
  fpEmailInput.value = emailInput.value;
  fpModal.classList.add('show');
  fpEmailInput.focus();
});

document.getElementById('fp-modal-close').addEventListener('click', () => {
  fpModal.classList.remove('show');
});

fpModal.addEventListener('click', e => {
  if (e.target === fpModal) fpModal.classList.remove('show');
});

fpForm.addEventListener('submit', function (e) {
  e.preventDefault();
  const email = fpEmailInput.value.trim();
  if (!email) return;

  const btn = fpForm.querySelector('.btn-modal-submit');
  btn.textContent = 'Sending…';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = '✓ Reset link sent!';
    btn.style.background = '#27ae60';
    setTimeout(() => {
      fpModal.classList.remove('show');
      btn.textContent = 'Send Reset Link';
      btn.disabled = false;
      btn.style.background = '';
    }, 1800);
  }, 1200);
});

/* ── Init ────────────────────────────────────── */
(async function init() {
  await loadUsers();
  loadRemembered();
})();
