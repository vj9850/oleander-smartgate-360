/* ================================================
   SmartGate 360 – Masters Framework (masters.js)
   Generic CRUD engine for all 11 master modules.
   Oleander Farms Operations System
   ================================================ */
'use strict';

// ─── STORAGE ─────────────────────────────────────
const MasterDB = {
  async seed(key, path) {
    if (localStorage.getItem(key)) return;
    try {
      const r = await fetch(path);
      if (!r.ok) throw new Error('fetch failed');
      const d = await r.json();
      localStorage.setItem(key, JSON.stringify(d));
    } catch {
      localStorage.setItem(key, JSON.stringify([]));
    }
  },
  all(key)           { try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; } },
  save(key, data)    { localStorage.setItem(key, JSON.stringify(data)); },
  add(key, item)     { const d = this.all(key); d.push(item); this.save(key, d); return item; },
  update(key, id, p) {
    const d = this.all(key), i = d.findIndex(x => x.id === id);
    if (i < 0) return null;
    d[i] = { ...d[i], ...p }; this.save(key, d); return d[i];
  },
  remove(key, id)    { this.save(key, this.all(key).filter(x => x.id !== id)); },
  toggle(key, id)    {
    const d = this.all(key), x = d.find(i => i.id === id);
    if (!x) return;
    x.status = x.status === 'Active' ? 'Inactive' : 'Active';
    this.save(key, d); return x.status;
  }
};

// ─── HELPERS ──────────────────────────────────────
function mpGenId(prefix) {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

const _BC = {
  green:  ['#e8f5ee','#1f5c3a'], teal:  ['#e0f4f0','#1a8a78'],
  blue:   ['#e8eeff','#3045c8'], orange:['#fef3e2','#b45309'],
  purple: ['#f5f0ff','#6d28d9'], pink:  ['#fdf2f8','#be185d'],
  red:    ['#fdecea','#dc2626'], gray:  ['#f0f0f0','#4b5563']
};
const _BM = {
  Security:'green', Housekeeping:'teal', 'Front Office':'blue', Maintenance:'orange',
  Restaurant:'purple', Spa:'pink', Events:'blue', Management:'gray',
  Active:'green', Inactive:'gray', Available:'green', 'In Use':'orange',
  Owned:'blue', Rental:'orange', Diesel:'gray', Petrol:'orange', CNG:'teal', Electric:'green',
  Wedding:'purple', 'Corporate Event':'blue', 'Private Party':'orange', Festival:'teal', Conference:'blue',
  Supplier:'blue', 'Maintenance Vendor':'orange', 'Event Vendor':'purple',
  'Food Supplier':'green', 'Laundry Vendor':'teal', Contractor:'gray',
  'Main Gate':'green', 'Service Gate':'blue', 'Event Gate':'orange', 'Staff Gate':'teal',
  Guest:'blue', Vendor:'orange', Staff:'green', Delivery:'gray', 'Event Guest':'purple', Maintenance_:'orange',
  'Super Admin':'purple', Admin:'blue', 'Security Guard':'green', 'Gate Operator':'teal',
  Receptionist:'blue', 'Vehicle Manager':'orange', 'Inventory Manager':'teal',
  'Housekeeping Manager':'pink', 'Event Manager':'purple', 'Maintenance Staff':'gray',
  Accommodation:'blue', 'Food & Beverage':'orange', Retail:'purple',
  Wellness:'green', 'Sports & Recreation':'teal', Experiences:'pink',
  Events_:'purple', Facility:'gray'
};

function mpBadge(v) {
  if (!v) return '<span style="color:#8fa898;">—</span>';
  const key = _BM[v] || 'gray';
  const c = _BC[key] || _BC.gray;
  return `<span style="display:inline-block;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:700;background:${c[0]};color:${c[1]};">${v}</span>`;
}

function mpStatusBadge(s) {
  const active = s === 'Active';
  const [bg, clr, dot] = active ? ['#e8f5ee','#1f5c3a','#2d7a4f'] : ['#f0f0f0','#4b5563','#9ca3af'];
  return `<span style="display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:100px;font-size:11px;font-weight:700;background:${bg};color:${clr};">
    <span style="width:6px;height:6px;border-radius:50%;background:${dot};flex-shrink:0;"></span>${s}</span>`;
}

function mpFmtDate(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return iso; }
}

function mpCellVal(col, item) {
  const v = item[col.key];
  if (v === undefined || v === null || v === '') return '<span style="color:#8fa898;">—</span>';
  switch (col.type) {
    case 'id':     return `<span style="font-family:'Courier New',monospace;font-weight:700;color:var(--primary);font-size:12px;">${v}</span>`;
    case 'bold':   return `<span style="font-weight:700;font-size:13px;">${v}</span>`;
    case 'muted':  return `<span style="font-size:12px;color:var(--text-muted);">${v}</span>`;
    case 'badge':  return mpBadge(v);
    case 'date':   return `<span style="font-size:12px;">${mpFmtDate(v)}</span>`;
    case 'mono':   return `<span style="font-family:'Courier New',monospace;font-size:12px;">${v}</span>`;
    case 'number': return `<span style="font-weight:600;">${v}</span>`;
    case 'tags':   return Array.isArray(v) ? v.slice(0,3).map(t=>mpBadge(t)).join(' ') + (v.length>3?`<span style="font-size:11px;color:var(--text-muted);"> +${v.length-3}</span>`:''): mpBadge(v);
    default:       return `<span style="font-size:13px;">${v}</span>`;
  }
}

// ─── SIDEBAR HTML ─────────────────────────────────
function getMasterSidebar(active) {
  const A = (module, href, icon, label) =>
    `<a href="${href}" class="nav-item${active===module?' active':''}">${icon}${label}</a>`;
  const I = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">${d}</svg>`;

  return `
  <div class="sidebar-logo">
    <div class="logo-icon"><img src="../assets/icons/logo.webp" alt="Oleander Farms" style="width:38px;height:38px;object-fit:contain;border-radius:6px;" /></div>
    <div class="logo-name">SmartGate 360</div>
    <div class="logo-sub">Oleander Farms Operations</div>
  </div>
  <button class="sidebar-close-btn" id="sidebar-close-btn" aria-label="Close menu">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
  </button>
  <nav class="sidebar-nav">
    <div class="nav-section-label">Overview</div>
    ${A('masterdash', 'masters-dashboard.html', I('<circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 6.99 3.34"/><path d="M4 6.1a10 10 0 0 0-1.11 8.65"/><path d="M11.9 21.9a10 10 0 0 0 7.62-3.53"/>'), 'Master Overview')}
    </nav><nav class="sidebar-nav">
    <div class="nav-section-label">Main</div>
    ${A('dashboard','../dashboard.html',I('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'),'Dashboard')}
    <div class="nav-section-label">Operations</div>
    ${A('visitors','../visitor/visitor-list.html',I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>'),'Visitor Management')}
    ${A('vehicles','../vehicle/vehicle-list.html',I('<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'),'Vehicle Management')}
    ${A('inventory','../inventory/inventory-list.html',I('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'),'Inventory')}
    <div class="nav-section-label">Masters</div>
    ${A('staff',      'staff-master.html',      I('<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>'), 'Staff')}
    ${A('vendor',     'vendor-master.html',     I('<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>'), 'Vendors')}
    ${A('vehicle',    'vehicle-master.html',    I('<rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>'), 'Vehicle Master')}
    ${A('driver',     'driver-master.html',     I('<circle cx="12" cy="8" r="4"/><path d="M6 20v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>'), 'Drivers')}
    ${A('location',   'location-master.html',   I('<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>'), 'Locations')}
    ${A('invcat',     'inventory-category-master.html', I('<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>'), 'Inv. Categories')}
    ${A('invitems',   'inventory-items-master.html',    I('<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>'), 'Inventory Items')}
    ${A('visitortype','visitor-type-master.html',I('<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>'), 'Visitor Types')}
    ${A('role',       'role-master.html',       I('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'), 'Roles')}
    ${A('gate',       'gate-master.html',       I('<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'), 'Gates')}
    ${A('event',      'event-master.html',      I('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>'), 'Events')}
    ${A('dept',       'department-master.html', I('<rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>'), 'Departments')}
  </nav>
  <div class="sidebar-footer">
    <div class="property-tag">Oleander Farms · Karjat · 180 Acres</div>
    <div class="powered-by">Powered by <strong>Bpointer Technologies</strong></div>
    <button class="btn-logout" id="logout-btn">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
      Sign Out
    </button>
  </div>`;
}

// ─── MASTER PAGE CLASS ────────────────────────────
class MasterPage {
  constructor(cfg) {
    this.cfg      = cfg;
    this.page     = 1;
    this.pageSize = cfg.pageSize || 10;
    this.q        = '';
    this.filters  = {};
    this.editId   = null;
  }

  async init() {
    // Inject sidebar backdrop into body if missing
    if (!document.getElementById('sidebar-backdrop')) {
      document.body.insertAdjacentHTML('afterbegin',
        '<div class="sidebar-backdrop" id="sidebar-backdrop"></div>');
    }

    // Inject unified collapsible sidebar
    renderAppSidebar(this.cfg.activeModule);

    // Auth
    const session = requireAuth('../index.html');
    if (!session) return;
    initAuthUI('../index.html');
    initMobileMenu();
    renderTopbarDate();

    // Seed
    await MasterDB.seed(this.cfg.key, this.cfg.dataFile);

    // Render page content
    this._renderPage();

    // Expose instance globally for onclick handlers
    window._mp = this;
  }

  // ── Page shell ───────────────────────────────
  _renderPage() {
    const pc = document.getElementById('page-content');
    pc.innerHTML = `
      <div class="page-header" style="margin-bottom:16px;">
        <div class="page-header-left">
          <div class="page-title">${this.cfg.title}</div>
          <div class="page-subtitle">${this.cfg.subtitle || ''}</div>
        </div>
        <button class="btn btn-primary" onclick="_mp.openAddModal()">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add ${this.cfg.itemLabel || 'Record'}
        </button>
      </div>
      <div id="mp-stats" class="mp-stats-row"></div>
      <div class="section-card">
        <div class="section-header" style="padding:14px 18px;">
          <h2 style="font-size:14px;font-weight:700;">${this.cfg.title}</h2>
          <span id="mp-count" style="font-size:12px;color:var(--text-muted);"></span>
        </div>
        <div class="mp-toolbar">
          <div class="search-box" style="flex:1;min-width:0;max-width:320px;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input type="text" id="mp-search" placeholder="Search ${this.cfg.itemLabel || 'records'}…" oninput="_mp._onSearch(this.value)" />
          </div>
          ${(this.cfg.filters||[]).map(f=>`
          <select class="filter-select" id="mpf-${f.field}" onchange="_mp._onFilter('${f.field}',this.value)" style="font-size:12.5px;padding:6px 10px;">
            <option value="">All ${f.label}</option>
            ${f.options.map(o=>`<option>${o}</option>`).join('')}
          </select>`).join('')}
          <button class="btn btn-sm btn-ghost" onclick="_mp._clearSearch()" style="white-space:nowrap;">Clear</button>
        </div>
        <div class="table-wrapper">
          <table id="mp-table" style="min-width:600px;">
            <thead>
              <tr>
                ${this.cfg.columns.map(c=>`<th style="padding:9px 14px;font-size:10.5px;">${c.label}</th>`).join('')}
                <th style="padding:9px 14px;font-size:10.5px;">Status</th>
                <th style="padding:9px 14px;font-size:10.5px;width:120px;">Actions</th>
              </tr>
            </thead>
            <tbody id="mp-tbody"></tbody>
          </table>
        </div>
        <div id="mp-pagination" class="mp-pagination"></div>
      </div>`;

    // Modal
    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="mp-modal">
        <div class="modal" style="max-width:640px;width:95vw;">
          <h3 id="mp-modal-title" style="margin-bottom:4px;"></h3>
          <p id="mp-modal-sub" style="font-size:12.5px;color:var(--text-muted);margin-bottom:20px;"></p>
          <form id="mp-form" novalidate>
            <div id="mp-form-fields" class="form-grid"></div>
            <div class="form-footer" style="margin-top:20px;padding-top:16px;border-top:1px solid var(--border);">
              <button type="submit" class="btn btn-primary" id="mp-submit-btn">Save</button>
              <button type="button" class="btn btn-ghost" onclick="closeModal('mp-modal')">Cancel</button>
            </div>
          </form>
        </div>
      </div>
      <div class="modal-overlay" id="mp-del-modal">
        <div class="modal" style="max-width:400px;">
          <h3>Confirm Delete</h3>
          <p>Are you sure you want to delete <strong id="mp-del-name"></strong>? This action cannot be undone.</p>
          <div class="modal-actions">
            <button class="btn btn-ghost" onclick="closeModal('mp-del-modal')">Cancel</button>
            <button class="btn btn-danger" id="mp-del-confirm">Delete</button>
          </div>
        </div>
      </div>`);

    document.getElementById('mp-form').addEventListener('submit', e => { e.preventDefault(); this._handleSubmit(); });
    document.getElementById('mp-del-confirm').addEventListener('click', () => this._confirmDelete());

    this._renderStats();
    this._renderTable();
  }

  // ── Stats ────────────────────────────────────
  _renderStats() {
    if (!this.cfg.stats) return;
    const all = MasterDB.all(this.cfg.key);
    const icons = {
      green:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>',
      teal:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
      blue:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      orange: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>',
      red:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>',
      purple: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    };
    const bgMap = { green:'#e8f5ee', teal:'#e0f4f0', blue:'#e8eeff', orange:'#fef3e2', red:'#fdecea', purple:'#f5f0ff' };
    const clrMap= { green:'#1f5c3a', teal:'#1a8a78', blue:'#3045c8', orange:'#b45309', red:'#dc2626', purple:'#6d28d9' };

    document.getElementById('mp-stats').innerHTML = this.cfg.stats.map(s => {
      let count = all.length;
      if (s.filterKey) count = all.filter(i => i[s.filterKey] === s.filterValue).length;
      if (s.countFn)   count = s.countFn(all);
      const col = s.color || 'green';
      return `<div class="mp-stat">
        <div class="mp-stat-icon" style="background:${bgMap[col]||'#e8f5ee'};">${icons[col]||icons.green}</div>
        <div><div class="mp-stat-value">${count}</div><div class="mp-stat-label">${s.label}</div></div>
      </div>`;
    }).join('');
  }

  // ── Table ────────────────────────────────────
  _getFiltered() {
    let data = MasterDB.all(this.cfg.key);
    if (this.q) {
      const q = this.q.toLowerCase();
      data = data.filter(item => (this.cfg.searchKeys||[]).some(k => String(item[k]||'').toLowerCase().includes(q)));
    }
    Object.entries(this.filters).forEach(([k,v]) => { if (v) data = data.filter(i => i[k] === v); });
    return data;
  }

  _renderTable() {
    const filtered = this._getFiltered();
    const start    = (this.page - 1) * this.pageSize;
    const pageData = filtered.slice(start, start + this.pageSize);

    document.getElementById('mp-count').textContent = `${filtered.length} record${filtered.length!==1?'s':''}`;

    const tbody = document.getElementById('mp-tbody');
    if (!pageData.length) {
      tbody.innerHTML = `<tr><td colspan="${this.cfg.columns.length + 2}" class="table-empty">
        <div style="padding:32px;text-align:center;color:var(--text-muted);">No records found.</div>
      </td></tr>`;
    } else {
      tbody.innerHTML = pageData.map(item => `
        <tr>
          ${this.cfg.columns.map(c => `<td style="padding:9px 14px;font-size:13px;vertical-align:middle;">${mpCellVal(c,item)}</td>`).join('')}
          <td style="padding:9px 14px;">${mpStatusBadge(item.status||'Active')}</td>
          <td style="padding:9px 14px;">
            <div style="display:flex;gap:5px;align-items:center;">
              <button class="btn btn-sm btn-ghost" onclick="_mp.openEditModal('${item.id}')"
                style="padding:4px 10px;font-size:12px;">Edit</button>
              <button class="btn btn-sm btn-ghost" onclick="_mp._toggleStatus('${item.id}')"
                style="padding:4px 10px;font-size:12px;"
                title="${item.status==='Active'?'Deactivate':'Activate'}">
                ${item.status==='Active'?'Deactivate':'Activate'}
              </button>
              <button class="btn btn-sm btn-danger" onclick="_mp.promptDelete('${item.id}','${String(item[this.cfg.columns[1]?.key]||item.name||'').replace(/'/g,"&#39;")}')"
                style="padding:4px 8px;font-size:12px;">✕</button>
            </div>
          </td>
        </tr>`).join('');
    }

    this._renderPagination(filtered.length);
    this._renderStats();
  }

  // ── Pagination ───────────────────────────────
  _renderPagination(total) {
    const pages = Math.ceil(total / this.pageSize) || 1;
    const el    = document.getElementById('mp-pagination');
    if (pages <= 1) { el.innerHTML = ''; return; }
    const pageNums = [];
    for (let i = Math.max(1, this.page - 2); i <= Math.min(pages, this.page + 2); i++) pageNums.push(i);

    el.innerHTML = `
      <div class="mp-pag-info">Showing ${Math.min((this.page-1)*this.pageSize+1,total)}–${Math.min(this.page*this.pageSize,total)} of ${total}</div>
      <div class="mp-pag-btns">
        <button class="mp-pag-btn" onclick="_mp._goPage(${this.page-1})" ${this.page===1?'disabled':''}>‹</button>
        ${pageNums.map(n=>`<button class="mp-pag-btn${n===this.page?' active':''}" onclick="_mp._goPage(${n})">${n}</button>`).join('')}
        <button class="mp-pag-btn" onclick="_mp._goPage(${this.page+1})" ${this.page===pages?'disabled':''}>›</button>
      </div>`;
  }

  _goPage(n) {
    const pages = Math.ceil(this._getFiltered().length / this.pageSize) || 1;
    this.page = Math.max(1, Math.min(n, pages));
    this._renderTable();
  }

  // ── Search / Filter ──────────────────────────
  _onSearch(v) { this.q = v; this.page = 1; this._renderTable(); }
  _onFilter(k, v) { this.filters[k] = v; this.page = 1; this._renderTable(); }
  _clearSearch() {
    this.q = ''; this.filters = {}; this.page = 1;
    document.getElementById('mp-search').value = '';
    (this.cfg.filters||[]).forEach(f => { const el = document.getElementById(`mpf-${f.field}`); if(el) el.value=''; });
    this._renderTable();
  }

  // ── Modal ────────────────────────────────────
  _buildFormHTML(item) {
    return this.cfg.fields.map(f => {
      const val = item ? (item[f.name] ?? '') : (f.default ?? '');
      const req  = f.required ? '<span class="required">*</span>' : '';
      const half = f.full ? '' : 'half-width';
      let input;

      if (f.type === 'select') {
        const opts = (f.options||[]).map(o => `<option${o===val?' selected':''}>${o}</option>`).join('');
        input = `<select name="${f.name}" class="form-select"${f.required?' data-required':''}>
          <option value="">Select ${f.label}</option>${opts}</select>`;
      } else if (f.type === 'textarea') {
        input = `<textarea name="${f.name}" class="form-textarea" rows="3"${f.required?' data-required':''}
          placeholder="${f.placeholder||f.label}">${val}</textarea>`;
      } else if (f.type === 'checkbox-group') {
        input = `<div style="display:flex;flex-wrap:wrap;gap:8px;padding:6px 0;">
          ${(f.options||[]).map(o=>`
            <label style="display:flex;align-items:center;gap:5px;font-size:12.5px;font-weight:500;cursor:pointer;">
              <input type="checkbox" name="${f.name}[]" value="${o}"${Array.isArray(val)&&val.includes(o)?' checked':''}
                style="accent-color:var(--primary);width:14px;height:14px;" />
              ${o}
            </label>`).join('')}
        </div>`;
      } else {
        input = `<input type="${f.type||'text'}" name="${f.name}" class="form-input"
          value="${val}"${f.required?' data-required':''}
          placeholder="${f.placeholder||f.label}" />`;
      }
      return `<div class="form-group${half?' '+half:''}">
        <label class="form-label">${f.label} ${req}</label>
        ${input}
        <span class="error-msg" data-error="${f.name}"></span>
      </div>`;
    }).join('');
  }

  openAddModal() {
    this.editId = null;
    document.getElementById('mp-modal-title').textContent = `Add ${this.cfg.itemLabel||'Record'}`;
    document.getElementById('mp-modal-sub').textContent   = `Fill in the details to add a new ${(this.cfg.itemLabel||'record').toLowerCase()}.`;
    document.getElementById('mp-form-fields').innerHTML   = this._buildFormHTML(null);
    document.getElementById('mp-submit-btn').textContent  = `Save ${this.cfg.itemLabel||'Record'}`;
    openModal('mp-modal');
  }

  openEditModal(id) {
    this.editId = id;
    const item = MasterDB.all(this.cfg.key).find(x => x.id === id);
    if (!item) return;
    document.getElementById('mp-modal-title').textContent = `Edit ${this.cfg.itemLabel||'Record'}`;
    document.getElementById('mp-modal-sub').textContent   = `Update the details for this ${(this.cfg.itemLabel||'record').toLowerCase()}.`;
    document.getElementById('mp-form-fields').innerHTML   = this._buildFormHTML(item);
    document.getElementById('mp-submit-btn').textContent  = 'Update';
    openModal('mp-modal');
  }

  _handleSubmit() {
    const form = document.getElementById('mp-form');
    clearFormErrors('mp-form');

    // Basic required validation
    let valid = true;
    form.querySelectorAll('[data-required]').forEach(el => {
      if (!el.value.trim()) {
        el.classList.add('error');
        const errEl = form.querySelector(`[data-error="${el.name}"]`);
        if (errEl) { errEl.textContent = 'This field is required'; errEl.classList.add('visible'); }
        valid = false;
      }
    });
    if (!valid) { showToast('Please fill in all required fields', 'error'); return; }

    // Collect form data
    const data = {};
    const fd = new FormData(form);
    for (const [k, v] of fd.entries()) {
      if (k.endsWith('[]')) {
        const key = k.slice(0,-2);
        if (!data[key]) data[key] = [];
        data[key].push(v);
      } else {
        data[k] = v;
      }
    }

    if (this.editId) {
      MasterDB.update(this.cfg.key, this.editId, data);
      showToast(`${this.cfg.itemLabel||'Record'} updated successfully`, 'success');
    } else {
      const idField = this.cfg.idField || 'id';
      const newItem = {
        id: mpGenId(this.cfg.idPrefix||'REC'),
        [idField]: mpGenId(this.cfg.idPrefix||'REC'),
        ...data,
        status: 'Active'
      };
      MasterDB.add(this.cfg.key, newItem);
      showToast(`${this.cfg.itemLabel||'Record'} added successfully`, 'success');
    }

    closeModal('mp-modal');
    this.page = 1;
    this._renderTable();
  }

  // ── Delete ───────────────────────────────────
  promptDelete(id, name) {
    this._pendingDelId = id;
    document.getElementById('mp-del-name').textContent = name;
    openModal('mp-del-modal');
  }

  _confirmDelete() {
    if (!this._pendingDelId) return;
    MasterDB.remove(this.cfg.key, this._pendingDelId);
    this._pendingDelId = null;
    closeModal('mp-del-modal');
    showToast('Record deleted', 'success');
    this._renderTable();
  }

  // ── Status Toggle ────────────────────────────
  _toggleStatus(id) {
    const newStatus = MasterDB.toggle(this.cfg.key, id);
    showToast(`Status changed to ${newStatus}`, newStatus === 'Active' ? 'success' : 'warning');
    this._renderTable();
  }
}
