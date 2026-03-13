/* ============================================
   SmartGate 360 – app.js
   Shared utilities, data helpers, UI components
   ============================================ */

'use strict';

// ─── CONSTANTS ───────────────────────────────
const LOCATIONS = [
  'Rooms & Villas',
  'Saltt Restaurant',
  'Coffee House',
  'Waves Pool Bar',
  'Vintage Wines',
  'CocoCart',
  'Kensho Greenery Nursery',
  'Organic Hub',
  'Akashi Clothing',
  'Spa & Wellness',
  'Padel & Pickleball Court',
  'Wine Tasting',
  'Tea Ceremony',
  'Corporate Events',
  'Wedding Venue'
];

const VISITOR_TYPES = ['Guest', 'Vendor', 'Staff', 'Event Guest'];
const ID_PROOF_TYPES = ['Aadhar Card', 'Passport', 'Driving License', 'Voter ID', 'Employee ID', 'PAN Card'];
const VEHICLE_TYPES = ['Owned', 'Rental'];
const VEHICLE_PURPOSES = ['Pickup', 'Drop', 'Internal Tour'];
const VEHICLE_STATUSES = ['Available', 'In Use', 'Maintenance'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'CNG', 'Electric'];
const INV_CATEGORIES = ['Housekeeping', 'Room Service', 'Spa', 'Restaurant', 'Maintenance'];
const INV_UNITS = ['pcs', 'box', 'bottle', 'kg', 'litre'];

// ─── DATA LAYER (localStorage + JSON seed) ───

const KEYS = {
  visitors:    'sg360_visitors',
  vehicles:    'sg360_vehicles',
  inventory:   'sg360_inventory',
  shifts:      'sg360_shifts',
  expenses:    'sg360_vehicle_expenses',
  purchases:   'sg360_purchases',
  invIssues:   'sg360_inv_issues',
  invConsumption: 'sg360_inv_consumption'
};

async function seedIfEmpty(key, jsonPath) {
  if (!localStorage.getItem(key)) {
    try {
      const res = await fetch(jsonPath);
      const data = await res.json();
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('Could not seed', key, e);
      localStorage.setItem(key, JSON.stringify([]));
    }
  }
}

function getData(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || [];
  } catch {
    return [];
  }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function generateId(prefix) {
  return prefix + Date.now().toString(36).toUpperCase();
}

// ─── DATE HELPERS ────────────────────────────

function formatDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function todayString() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
  });
}

// ─── STATUS BADGE HTML ───────────────────────

function statusBadge(status) {
  const map = {
    'Active':       'badge-active',
    'Completed':    'badge-completed',
    'In Use':       'badge-inuse',
    'Available':    'badge-available',
    'Maintenance':  'badge-maintenance',
    'Low':          'badge-low',
    'OK':           'badge-ok'
  };
  const cls = map[status] || 'badge-completed';
  return `<span class="badge ${cls}">${status}</span>`;
}

function typeBadge(type) {
  const map = {
    'Guest':       'type-guest',
    'Vendor':      'type-vendor',
    'Staff':       'type-staff',
    'Event Guest': 'type-event'
  };
  const cls = map[type] || '';
  return `<span class="type-badge ${cls}">${type}</span>`;
}

// ─── STOCK BAR HTML ──────────────────────────

function stockBar(qty, min) {
  const pct = min > 0 ? Math.min((qty / (min * 2)) * 100, 100) : 100;
  const cls = qty < min ? 'low' : qty < min * 1.3 ? 'medium' : 'ok';
  return `
    <div class="stock-bar-wrap">
      <div class="stock-bar">
        <div class="stock-bar-fill ${cls}" style="width:${pct}%"></div>
      </div>
      <span class="stock-qty">${qty}</span>
    </div>`;
}

// ─── SIDEBAR ACTIVE LINK ─────────────────────

function setActiveNav() {
  const path = window.location.pathname;
  document.querySelectorAll('.nav-item').forEach(el => {
    const href = el.getAttribute('href') || '';
    if (href && path.endsWith(href)) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });
}

// ─── TOPBAR DATE ─────────────────────────────

function renderTopbarDate() {
  const el = document.getElementById('topbar-date');
  if (el) el.textContent = todayString();
}

// ─── MOBILE SIDEBAR TOGGLE ───────────────────

function initMobileMenu() {
  const btn      = document.getElementById('mobile-menu-btn');
  const sidebar  = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  const closeBtn = document.getElementById('sidebar-close-btn');
  if (!btn || !sidebar) return;

  const openSB  = () => { sidebar.classList.add('open');    if (backdrop) backdrop.classList.add('show'); };
  const closeSB = () => { sidebar.classList.remove('open'); if (backdrop) backdrop.classList.remove('show'); };

  btn.addEventListener('click', openSB);
  if (closeBtn) closeBtn.addEventListener('click', closeSB);
  if (backdrop) backdrop.addEventListener('click', closeSB);
}

// ─── TABLE SEARCH ────────────────────────────

function initTableSearch(inputId, tableId) {
  const input = document.getElementById(inputId);
  const table = document.getElementById(tableId);
  if (!input || !table) return;
  input.addEventListener('input', () => {
    const val = input.value.toLowerCase();
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      row.style.display = text.includes(val) ? '' : 'none';
    });
  });
}

// ─── TABLE FILTER ────────────────────────────

function initTableFilter(selectId, tableId, colIndex) {
  const select = document.getElementById(selectId);
  const table = document.getElementById(tableId);
  if (!select || !table) return;
  select.addEventListener('change', () => {
    const val = select.value.toLowerCase();
    const rows = table.querySelectorAll('tbody tr');
    rows.forEach(row => {
      const cell = row.cells[colIndex];
      if (!val || (cell && cell.textContent.toLowerCase().includes(val))) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
}

// ─── FORM VALIDATION ─────────────────────────

function validateForm(formId) {
  const form = document.getElementById(formId);
  if (!form) return true;
  let valid = true;
  form.querySelectorAll('[data-required]').forEach(field => {
    const errEl = form.querySelector(`[data-error="${field.name}"]`);
    if (!field.value.trim()) {
      field.classList.add('error');
      if (errEl) { errEl.textContent = 'This field is required'; errEl.classList.add('visible'); }
      valid = false;
    } else {
      field.classList.remove('error');
      if (errEl) errEl.classList.remove('visible');
    }
  });
  return valid;
}

function clearFormErrors(formId) {
  const form = document.getElementById(formId);
  if (!form) return;
  form.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  form.querySelectorAll('.error-msg').forEach(el => el.classList.remove('visible'));
}

// ─── TOAST NOTIFICATION ──────────────────────

function showToast(message, type = 'success') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;';
    document.body.appendChild(container);
  }
  const toast = document.createElement('div');
  const colors = { success: '#2d7a4f', error: '#e74c3c', warning: '#e67e22', info: '#3d6ef5' };
  toast.style.cssText = `
    background:${colors[type] || colors.success};
    color:white;padding:12px 18px;border-radius:8px;
    font-size:13px;font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,0.2);
    animation:slideIn 0.25s ease;max-width:320px;line-height:1.4;
  `;
  toast.textContent = message;

  const style = document.createElement('style');
  style.textContent = '@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
  document.head.appendChild(style);

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ─── MODAL ───────────────────────────────────

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('show');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('show');
}

// ─── POPULATE SELECT ─────────────────────────

function populateSelect(selectId, options, placeholder = 'Select...') {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  options.forEach(opt => {
    const o = document.createElement('option');
    o.value = opt;
    o.textContent = opt;
    sel.appendChild(o);
  });
}

// ─── SIDEBAR RENDER ──────────────────────────

/**
 * Inject the full collapsible sidebar into #sidebar and wire accordion behaviour.
 * @param {string} active  Page key, e.g. 'dashboard','visitor-list','vehicle-form','staff'…
 */
function renderAppSidebar(active) {
  const seg = window.location.pathname.split('/').filter(Boolean);
  const dir = seg.length >= 2 ? seg[seg.length - 2] : '';
  const p   = ['visitor', 'vehicle', 'inventory', 'masters'].includes(dir) ? '../' : '';

  // Which groups auto-open?
  const VISITOR_SET   = new Set(['visitor-overview','visitor-list','visitor-form','visitor-details','visitor-pass']);
  const VEHICLE_SET   = new Set(['vehicle-list','vehicle-tracker','driver-shift','vehicle-expenses','vehicle-form']);
  const INVENTORY_SET = new Set(['inventory-dashboard','inventory-list','inventory-form','purchase-inward','stock-issue','consumption-log','stock-report']);
  const MASTERS_SET   = new Set(['masterdash','staff','vendor','vehicle','driver','location','invcat','invitems','visitortype','role','gate','event','dept']);

  const visOpen = VISITOR_SET.has(active);
  const vehOpen = VEHICLE_SET.has(active);
  const invOpen = INVENTORY_SET.has(active);
  const mstOpen = MASTERS_SET.has(active);

  const a = id => active === id ? ' active' : '';

  // Helper – build a collapsible group
  function group(id, label, iconPath, items, isOpen) {
    return `
    <div class="nav-group${isOpen ? ' open' : ''}" data-group="${id}">
      <div class="nav-group-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${iconPath}</svg>
        <span>${label}</span>
        <svg class="nav-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="nav-group-items">
        ${items.map(([key, href, lbl]) => `<a href="${href}" class="nav-sub-item${a(key)}">${lbl}</a>`).join('')}
      </div>
    </div>`;
  }

  const sidebar = document.getElementById('sidebar');
  if (!sidebar) return;

  sidebar.innerHTML = `
    <div class="sidebar-logo">
      <div class="logo-icon">
        <img src="${p}assets/icons/logo.webp" alt="Oleander Farms" style="width:38px;height:38px;object-fit:contain;border-radius:6px;" />
      </div>
      <div class="logo-name">SmartGate 360</div>
      <div class="logo-sub">Oleander Farms Operations</div>
    </div>
    <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close menu">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
    <nav class="sidebar-nav">

      <div class="nav-section-label">Main</div>
      <a href="${p}dashboard.html" class="nav-item${a('dashboard')}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
        Dashboard
      </a>

      <div class="nav-section-label">Operations</div>

      ${group('visitors', 'Visitor Management',
        '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
        [
          ['visitor-overview', `${p}visitor/visitor-dashboard.html`, 'Visitor Overview'],
          ['visitor-list',     `${p}visitor/visitor-list.html`,      'All Visitors'],
          ['visitor-form',     `${p}visitor/visitor-form.html`,      'Register Visitor']
        ], visOpen)}

      ${group('vehicles', 'Vehicle Management',
        '<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
        [
          ['vehicle-list',     `${p}vehicle/vehicle-list.html`,     'Fleet List'],
          ['vehicle-tracker',  `${p}vehicle/vehicle-tracker.html`,  'Fleet Tracker'],
          ['driver-shift',     `${p}vehicle/driver-shift.html`,     'Driver Shifts'],
          ['vehicle-expenses', `${p}vehicle/vehicle-expenses.html`, 'Expenses'],
          ['vehicle-form',     `${p}vehicle/vehicle-form.html`,     'Add Vehicle']
        ], vehOpen)}

      ${group('inventory', 'Inventory Management',
        '<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>',
        [
          ['inventory-dashboard', `${p}inventory/inventory-dashboard.html`, 'Dashboard'],
          ['inventory-list',      `${p}inventory/inventory-list.html`,      'Stock List'],
          ['purchase-inward',     `${p}inventory/purchase-inward.html`,     'Purchase Inward'],
          ['stock-issue',         `${p}inventory/stock-issue.html`,         'Stock Issue'],
          ['consumption-log',     `${p}inventory/consumption-log.html`,     'Consumption Log'],
          ['stock-report',        `${p}inventory/stock-report.html`,        'Reports'],
          ['inventory-form',      `${p}inventory/inventory-form.html`,      'Add Item']
        ], invOpen)}

      <div class="nav-section-label">Masters</div>

      ${group('masters', 'Master Data',
        '<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6.1a10 10 0 0 0-1.11 8.65"/><path d="M11.9 21.9a10 10 0 0 0 7.62-3.53"/>',
        [
          ['masterdash',   `${p}masters/masters-dashboard.html`,          'Overview'],
          ['staff',        `${p}masters/staff-master.html`,               'Staff'],
          ['vendor',       `${p}masters/vendor-master.html`,              'Vendors'],
          ['vehicle',      `${p}masters/vehicle-master.html`,             'Vehicles'],
          ['driver',       `${p}masters/driver-master.html`,              'Drivers'],
          ['gate',         `${p}masters/gate-master.html`,                'Gates'],
          ['event',        `${p}masters/event-master.html`,               'Events'],
          ['location',     `${p}masters/location-master.html`,            'Locations'],
          ['dept',         `${p}masters/department-master.html`,          'Departments'],
          ['visitortype',  `${p}masters/visitor-type-master.html`,        'Visitor Types'],
          ['role',         `${p}masters/role-master.html`,                'Roles'],
          ['invcat',       `${p}masters/inventory-category-master.html`,  'Inv. Categories'],
          ['invitems',     `${p}masters/inventory-items-master.html`,     'Inv. Items']
        ], mstOpen)}

    </nav>
    <div class="sidebar-footer">
      <div class="property-tag">Oleander Farms · Karjat · 180 Acres</div>
      <div class="powered-by">Powered by <strong>Bpointer Technologies</strong></div>
      <button class="btn-logout" id="logout-btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
        Sign Out
      </button>
    </div>`;

  // Wire accordion – click toggles group, others stay as-is
  sidebar.querySelectorAll('.nav-group-header').forEach(header => {
    header.addEventListener('click', () => {
      const grp = header.closest('.nav-group');
      grp.classList.toggle('open');
    });
  });
}

// ─── AUTH ─────────────────────────────────────

const SESSION_KEY = 'sg360_session';

function getSession() {
  try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
}

/**
 * Call at the top of every protected page script.
 * Redirects to login if no valid session exists.
 */
function requireAuth(indexPath) {
  const session = getSession();
  if (!session || !session.role) {
    window.location.replace(indexPath || '../index.html');
    return null;
  }
  return session;
}

/**
 * Populate topbar user info from session and wire logout button.
 */
function initAuthUI(indexPath) {
  const session = getSession();
  if (!session) return;

  const avatarEl = document.getElementById('user-avatar');
  const nameEl   = document.getElementById('user-name');
  const roleEl   = document.getElementById('user-role');

  if (avatarEl) avatarEl.textContent = session.username.slice(0, 2).toUpperCase();
  if (nameEl)   nameEl.textContent   = session.username.charAt(0).toUpperCase() + session.username.slice(1);
  if (roleEl)   roleEl.textContent   = session.role;

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) logoutBtn.addEventListener('click', () => logout(indexPath));
}

function logout(indexPath) {
  sessionStorage.removeItem(SESSION_KEY);
  window.location.replace(indexPath || '../index.html');
}

// ─── INIT ─────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  renderTopbarDate();
});
