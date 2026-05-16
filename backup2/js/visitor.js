/* ============================================
   SmartGate 360 – visitor.js
   Visitor Management Module
   ============================================ */

'use strict';

// ─── VISITOR MODULE ───────────────────────────

const VisitorModule = (function () {

  // ── Data helpers ──────────────────────────

  function getAll() {
    return getData(KEYS.visitors);
  }

  function getById(id) {
    return getAll().find(v => v.id === id) || null;
  }

  function save(list) {
    saveData(KEYS.visitors, list);
  }

  function add(v) {
    const list = getAll();
    list.push(v);
    save(list);
  }

  function update(id, patch) {
    const list = getAll();
    const idx = list.findIndex(v => v.id === id);
    if (idx === -1) return false;
    list[idx] = Object.assign({}, list[idx], patch);
    save(list);
    return true;
  }

  // ── Actions ───────────────────────────────

  function checkIn(id) {
    return update(id, { status: 'Active', entryTime: new Date().toISOString() });
  }

  function checkOut(id) {
    const v = getById(id);
    if (!v) return false;
    if (v.status === 'Blacklisted') return false;
    return update(id, { status: 'Checked Out', exitTime: new Date().toISOString() });
  }

  function blacklist(id, reason) {
    return update(id, {
      status: 'Blacklisted',
      blacklisted: true,
      blacklistReason: reason || 'Blacklisted by security'
    });
  }

  function unblacklist(id) {
    const v = getById(id);
    if (!v) return false;
    const newStatus = v.exitTime ? 'Checked Out' : 'Active';
    return update(id, {
      status: newStatus,
      blacklisted: false,
      blacklistReason: null
    });
  }

  // ── Overstay detection (> 8 hours) ────────

  function refreshOverstay() {
    const list = getAll();
    const now = Date.now();
    let changed = false;
    list.forEach(v => {
      if (v.status === 'Active' && v.entryTime) {
        const diff = now - new Date(v.entryTime).getTime();
        if (diff > 8 * 60 * 60 * 1000) {
          v.status = 'Overstayed';
          changed = true;
        }
      }
    });
    if (changed) save(list);
  }

  // ── Filtered lists ────────────────────────

  function getTodayList() {
    const today = new Date().toISOString().slice(0, 10);
    return getAll().filter(v => v.entryTime && v.entryTime.startsWith(today));
  }

  function getActiveList() {
    return getAll().filter(v => v.status === 'Active');
  }

  function getOverstayed() {
    return getAll().filter(v => v.status === 'Overstayed');
  }

  function getBlacklisted() {
    return getAll().filter(v => v.blacklisted === true);
  }

  function getPending() {
    return getAll().filter(v => v.status === 'Active' || v.status === 'Overstayed');
  }

  // ── ID generators ─────────────────────────

  function nextId() {
    const list = getAll();
    const nums = list
      .map(v => parseInt((v.id || '').replace('VIS', ''), 10))
      .filter(n => !isNaN(n));
    const max = nums.length ? Math.max(...nums) : 0;
    return 'VIS' + String(max + 1).padStart(3, '0');
  }

  function nextPassId() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return 'GP-' + code;
  }

  // ── Duration helper ───────────────────────

  function duration(entry, exit) {
    if (!entry) return '—';
    const from = new Date(entry).getTime();
    const to   = exit ? new Date(exit).getTime() : Date.now();
    const ms   = to - from;
    if (ms < 0) return '—';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    if (h === 0) return `${m}m`;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }

  // ── Blacklist mobile check ─────────────────

  function isMobileBlacklisted(mobile) {
    return getAll().some(v => v.blacklisted && v.mobile === mobile);
  }

  // ── Alert generation ──────────────────────

  function getAlerts() {
    const alerts = [];
    getOverstayed().forEach(v => {
      alerts.push({
        type: 'overstay',
        severity: 'warning',
        v: v,
        msg: `${v.name} (${v.passId}) has been inside for over 8 hours. Location: ${v.location}`
      });
    });
    getBlacklisted().forEach(v => {
      if (v.status === 'Active' || v.status === 'Overstayed') {
        alerts.push({
          type: 'blacklist',
          severity: 'danger',
          v: v,
          msg: `Blacklisted visitor ${v.name} (${v.passId}) may still be on property.`
        });
      }
    });
    return alerts;
  }

  // ── Search & filter ───────────────────────

  function search(query, filters) {
    filters = filters || {};
    let list = getAll();

    if (query) {
      const q = query.toLowerCase();
      list = list.filter(v => {
        return [v.name, v.mobile, v.email, v.id, v.passId, v.idNumber, v.purpose, v.host]
          .filter(Boolean).join(' ').toLowerCase().includes(q);
      });
    }

    if (filters.type) {
      list = list.filter(v => v.visitorType === filters.type);
    }
    if (filters.status) {
      list = list.filter(v => v.status === filters.status);
    }
    if (filters.location) {
      list = list.filter(v => v.location === filters.location);
    }
    if (filters.gate) {
      list = list.filter(v => v.gate === filters.gate);
    }
    if (filters.date) {
      list = list.filter(v => v.entryTime && v.entryTime.startsWith(filters.date));
    }

    return list;
  }

  // Public API
  return {
    getAll, getById, save, add, update,
    checkIn, checkOut, blacklist, unblacklist,
    refreshOverstay,
    getTodayList, getActiveList, getOverstayed, getBlacklisted, getPending,
    nextId, nextPassId, duration,
    isMobileBlacklisted, getAlerts, search
  };
})();

// ─── UI BADGE HELPERS (global) ────────────────

function visBadge(type) {
  const map = {
    'Guest':       'type-guest',
    'Vendor':      'type-vendor',
    'Staff':       'type-staff',
    'Event Guest': 'type-event',
    'Delivery':    'type-delivery'
  };
  const cls = map[type] || '';
  return `<span class="type-badge ${cls}">${type}</span>`;
}

function visStatus(status) {
  const map = {
    'Active':       'badge-active',
    'Checked Out':  'badge-completed',
    'Overstayed':   'badge-inuse',
    'Blacklisted':  'badge-maintenance'
  };
  const cls = map[status] || 'badge-completed';
  return `<span class="badge ${cls}">${status}</span>`;
}

function gBadge(gate) {
  const map = {
    'Main Gate':    'gate-main',
    'Service Gate': 'gate-service',
    'Event Gate':   'gate-event',
    'Staff Gate':   'gate-staff'
  };
  const cls = map[gate] || '';
  return `<span class="gate-badge ${cls}">${gate || '—'}</span>`;
}

function visAvatar(name, type, photo, size) {
  size = size || 36;
  if (photo) {
    return `<img src="${photo}" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;" />`;
  }
  const colorMap = {
    'Guest':       '#3d6ef5',
    'Vendor':      '#e67e22',
    'Staff':       '#2d7a4f',
    'Event Guest': '#8e44ad',
    'Delivery':    '#00897b'
  };
  const bg = colorMap[type] || '#2d7a4f';
  const initials = name
    ? name.trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase()
    : '?';
  const fs = Math.max(10, Math.round(size * 0.38));
  return `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${bg};color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:${fs}px;font-weight:700;flex-shrink:0;">${initials}</div>`;
}

// ─── SHARED PAGE INIT ────────────────────────

// Shorthand alias used by all visitor pages
const VM = VisitorModule;

function initVPage(activePage) {
  renderAppSidebar(activePage || 'visitor-list');
  const session = requireAuth('../index.html');
  if (!session) return null;
  initAuthUI('../index.html');
  initMobileMenu();
  renderTopbarDate();
  return session;
}
