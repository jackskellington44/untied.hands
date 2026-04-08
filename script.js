/* ===================================================
   script.js — untied.hands
=================================================== */

'use strict';

/* ===================================================
   STATE
=================================================== */
const state = {
  calendarYear: new Date().getFullYear(),
  calendarMonth: new Date().getMonth(),
  selectedDates: [],       // up to 2 Date objects
  selectedFlash: [],       // up to 4 indices
  activeFlashbookThumb: 0,
};

/* ===================================================
   OVERLAY OPEN / CLOSE
=================================================== */
function openOverlay(name) {
  const el = document.getElementById('overlay-' + name);
  if (!el) return;
  el.classList.add('is-open');
  document.body.style.overflow = 'hidden';

  if (name === 'flashbook') {
    initFlashbook();
  }
}

function closeOverlay(name) {
  const el = document.getElementById('overlay-' + name);
  if (!el) return;
  el.classList.remove('is-open');
  document.body.style.overflow = '';
}

// Close overlay on Escape key
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    ['booking', 'contact', 'flashbook'].forEach(closeOverlay);
    closeCalendar();
    closeFlashPicker();
  }
});

/* ===================================================
   BOOKING TABS (waitlist / booking)
=================================================== */
function switchTab(tab) {
  const tabs = {
    waitlist: { btn: 'tab-waitlist', panel: 'panel-waitlist' },
    booking:  { btn: 'tab-booking-form', panel: 'panel-booking-form' },
  };

  Object.values(tabs).forEach(function (t) {
    document.getElementById(t.btn).classList.remove('active');
    document.getElementById(t.panel).classList.remove('active');
  });

  document.getElementById(tabs[tab].btn).classList.add('active');
  document.getElementById(tabs[tab].panel).classList.add('active');
}

/* ===================================================
   CONTACT TABS (about / rules)
=================================================== */
function switchContactTab(tab) {
  const tabs = {
    about: { btn: 'tab-about', panel: 'panel-about' },
    rules: { btn: 'tab-rules', panel: 'panel-rules' },
  };

  Object.values(tabs).forEach(function (t) {
    document.getElementById(t.btn).classList.remove('active');
    document.getElementById(t.panel).classList.remove('active');
  });

  document.getElementById(tabs[tab].btn).classList.add('active');
  document.getElementById(tabs[tab].panel).classList.add('active');
}

/* ===================================================
   CALENDAR PICKER
=================================================== */
const MONTH_NAMES = ['january','february','march','april','may','june',
                     'july','august','september','october','november','december'];
const DAY_NAMES   = ['su','mo','tu','we','th','fr','sa'];

function openCalendar() {
  renderCalendar();
  document.getElementById('modal-calendar').classList.add('is-open');
}

function closeCalendar() {
  document.getElementById('modal-calendar').classList.remove('is-open');
}

function renderCalendar() {
  const year  = state.calendarYear;
  const month = state.calendarMonth;
  const today = new Date();
  today.setHours(0,0,0,0);

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `
    <div class="calendar__nav">
      <button class="calendar__nav-btn" onclick="calPrev()" aria-label="Previous month">&#8592;</button>
      <span class="calendar__month">${MONTH_NAMES[month]} ${year}</span>
      <button class="calendar__nav-btn" onclick="calNext()" aria-label="Next month">&#8594;</button>
    </div>
    <div class="calendar__grid">
  `;

  DAY_NAMES.forEach(function (d) {
    html += `<div class="calendar__day-name">${d}</div>`;
  });

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    html += `<div class="calendar__day calendar__day--empty"></div>`;
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const isPast = date < today;
    const isSelected = state.selectedDates.some(function (sd) {
      return sd.getTime() === date.getTime();
    });

    let cls = 'calendar__day';
    if (isPast) cls += ' calendar__day--past';
    if (isSelected) cls += ' calendar__day--selected';

    const onclick = isPast ? '' : `onclick="toggleDate(${year}, ${month}, ${d})"`;
    html += `<div class="${cls}" ${onclick}>${d}</div>`;
  }

  html += '</div>';
  document.getElementById('calendar').innerHTML = html;

  renderTimePickers();
}

function calPrev() {
  if (state.calendarMonth === 0) {
    state.calendarMonth = 11;
    state.calendarYear--;
  } else {
    state.calendarMonth--;
  }
  renderCalendar();
}

function calNext() {
  if (state.calendarMonth === 11) {
    state.calendarMonth = 0;
    state.calendarYear++;
  } else {
    state.calendarMonth++;
  }
  renderCalendar();
}

function toggleDate(year, month, day) {
  const date = new Date(year, month, day);
  const idx = state.selectedDates.findIndex(function (d) {
    return d.getTime() === date.getTime();
  });

  if (idx > -1) {
    state.selectedDates.splice(idx, 1);
  } else if (state.selectedDates.length < 2) {
    state.selectedDates.push(date);
  } else {
    // Replace oldest
    state.selectedDates.shift();
    state.selectedDates.push(date);
  }

  renderCalendar();
}

function renderTimePickers() {
  const container = document.getElementById('calendar-time-pickers');
  if (!container) return;

  if (state.selectedDates.length === 0) {
    container.innerHTML = '';
    return;
  }

  const hours = [];
  for (let h = 9; h <= 20; h++) {
    hours.push(`<option value="${h}">${formatHour(h)}</option>`);
  }

  let html = '';
  state.selectedDates.forEach(function (d, i) {
    const label = formatDate(d);
    html += `
      <div class="time-picker-row">
        <label>${label}</label>
        <select id="time-${i}" aria-label="Time for ${label}">
          ${hours.join('')}
        </select>
      </div>
    `;
  });

  container.innerHTML = html;
}

function formatDate(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}

function formatHour(h) {
  if (h === 12) return '12:00 pm';
  return h < 12 ? `${h}:00 am` : `${h - 12}:00 pm`;
}

function confirmCalendar() {
  const input = document.getElementById('bk-avail');
  if (state.selectedDates.length === 0) {
    input.value = '';
    closeCalendar();
    return;
  }

  const parts = state.selectedDates.map(function (d, i) {
    const timeSel = document.getElementById('time-' + i);
    const hour = timeSel ? parseInt(timeSel.value, 10) : 12;
    return `${formatDate(d)} ${formatHour(hour)}`;
  });

  input.value = parts.join(', ');
  closeCalendar();
}

/* ===================================================
   FLASH IMAGE PICKER
=================================================== */

// Helper: generate SVG ray lines for a sun icon centered at (cx, cy)
function sunRays(cx, cy, innerR, outerR) {
  const angles = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
  return angles.map(function (a) {
    const rad = a * Math.PI / 180;
    const x1 = Math.round((cx + innerR * Math.cos(rad)) * 100) / 100;
    const y1 = Math.round((cy + innerR * Math.sin(rad)) * 100) / 100;
    const x2 = Math.round((cx + outerR * Math.cos(rad)) * 100) / 100;
    const y2 = Math.round((cy + outerR * Math.sin(rad)) * 100) / 100;
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#4a4a4a" stroke-width="1.5" stroke-linecap="round"/>`;
  }).join('');
}

// 12 abstract placeholder SVG flash images
const FLASH_SVGS = [
  // 0 — crescent moon
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f5f0eb"/><path d="M62,20 A32,32 0 1 0 62,80 A22,22 0 1 1 62,20Z" fill="#4a4a4a"/></svg>`,
  // 1 — geometric eye
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#eef0f2"/><ellipse cx="50" cy="50" rx="40" ry="22" fill="none" stroke="#4a4a4a" stroke-width="2"/><circle cx="50" cy="50" r="12" fill="none" stroke="#4a4a4a" stroke-width="2"/><circle cx="50" cy="50" r="5" fill="#4a4a4a"/><line x1="10" y1="50" x2="90" y2="50" stroke="#4a4a4a" stroke-width="1"/></svg>`,
  // 2 — butterfly
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0ece8"/><path d="M50,50 C50,50 22,20 18,40 C14,60 50,55 50,55Z" fill="none" stroke="#4a4a4a" stroke-width="1.8"/><path d="M50,50 C50,50 78,20 82,40 C86,60 50,55 50,55Z" fill="none" stroke="#4a4a4a" stroke-width="1.8"/><path d="M50,50 C50,50 30,68 32,80 C34,92 50,72 50,72Z" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><path d="M50,50 C50,50 70,68 68,80 C66,92 50,72 50,72Z" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><line x1="50" y1="42" x2="44" y2="28" stroke="#4a4a4a" stroke-width="1.2" stroke-linecap="round"/><line x1="50" y1="42" x2="56" y2="28" stroke="#4a4a4a" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  // 3 — hand with eye
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f2eee8"/><path d="M30,80 L30,35 Q30,28 37,28 Q44,28 44,35 L44,55 L44,35 Q44,28 51,28 Q58,28 58,35 L58,55 L58,38 Q58,31 65,31 Q72,31 72,38 L72,55 Q72,48 76,46 Q82,44 82,52 L82,65 Q82,80 68,85 L30,85Z" fill="none" stroke="#4a4a4a" stroke-width="1.8" stroke-linejoin="round"/><ellipse cx="51" cy="57" rx="8" ry="5" fill="none" stroke="#4a4a4a" stroke-width="1.2"/><circle cx="51" cy="57" r="2.5" fill="#4a4a4a"/></svg>`,
  // 4 — moth
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ebe8e2"/><path d="M50,35 C50,35 15,25 12,45 C9,65 50,60 50,60Z" fill="none" stroke="#4a4a4a" stroke-width="1.8"/><path d="M50,35 C50,35 85,25 88,45 C91,65 50,60 50,60Z" fill="none" stroke="#4a4a4a" stroke-width="1.8"/><path d="M50,55 C50,55 30,62 30,72 C30,82 50,78 50,78Z" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><path d="M50,55 C50,55 70,62 70,72 C70,82 50,78 50,78Z" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><rect x="48" y="25" width="4" height="50" rx="2" fill="#4a4a4a"/><line x1="50" y1="25" x2="42" y2="15" stroke="#4a4a4a" stroke-width="1.2" stroke-linecap="round"/><line x1="50" y1="25" x2="58" y2="15" stroke="#4a4a4a" stroke-width="1.2" stroke-linecap="round"/></svg>`,
  // 5 — crystal / gem
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#edf0f5"/><polygon points="50,15 80,35 80,70 50,88 20,70 20,35" fill="none" stroke="#4a4a4a" stroke-width="2"/><polygon points="50,15 80,35 50,45 20,35" fill="none" stroke="#4a4a4a" stroke-width="1"/><line x1="50" y1="45" x2="50" y2="88" stroke="#4a4a4a" stroke-width="1"/><line x1="50" y1="45" x2="80" y2="70" stroke="#4a4a4a" stroke-width="1"/><line x1="50" y1="45" x2="20" y2="70" stroke="#4a4a4a" stroke-width="1"/></svg>`,
  // 6 — skull
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f0ece5"/><ellipse cx="50" cy="44" rx="28" ry="30" fill="none" stroke="#4a4a4a" stroke-width="2"/><rect x="36" y="68" width="28" height="16" rx="3" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><line x1="44" y1="68" x2="44" y2="84" stroke="#4a4a4a" stroke-width="1.2"/><line x1="50" y1="68" x2="50" y2="84" stroke="#4a4a4a" stroke-width="1.2"/><line x1="56" y1="68" x2="56" y2="84" stroke="#4a4a4a" stroke-width="1.2"/><ellipse cx="40" cy="44" rx="8" ry="9" fill="#4a4a4a" opacity="0.15"/><ellipse cx="60" cy="44" rx="8" ry="9" fill="#4a4a4a" opacity="0.15"/><ellipse cx="40" cy="44" rx="5" ry="6" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><ellipse cx="60" cy="44" rx="5" ry="6" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><path d="M44,60 Q50,64 56,60" fill="none" stroke="#4a4a4a" stroke-width="1.2"/></svg>`,
  // 7 — candle
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f4f0e8"/><rect x="40" y="42" width="20" height="48" fill="none" stroke="#4a4a4a" stroke-width="2" rx="2"/><path d="M50,42 L50,22" stroke="#4a4a4a" stroke-width="1.5" stroke-linecap="round"/><path d="M50,22 C50,22 44,12 50,8 C56,12 50,22 50,22Z" fill="#4a4a4a"/><ellipse cx="50" cy="42" rx="10" ry="3" fill="none" stroke="#4a4a4a" stroke-width="1.5"/><line x1="40" y1="55" x2="60" y2="55" stroke="#4a4a4a" stroke-width="0.8" opacity="0.4"/><line x1="40" y1="65" x2="60" y2="65" stroke="#4a4a4a" stroke-width="0.8" opacity="0.4"/></svg>`,
  // 8 — hourglass
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#eff0ec"/><path d="M28,12 L72,12 L50,50 L72,88 L28,88 L50,50Z" fill="none" stroke="#4a4a4a" stroke-width="2" stroke-linejoin="round"/><line x1="28" y1="12" x2="72" y2="12" stroke="#4a4a4a" stroke-width="2.5"/><line x1="28" y1="88" x2="72" y2="88" stroke="#4a4a4a" stroke-width="2.5"/><path d="M30,85 Q50,60 50,50 Q50,60 70,85" fill="#4a4a4a" opacity="0.12"/></svg>`,
  // 9 — ouroboros (snake eating tail)
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#eaeae4"/><circle cx="50" cy="50" r="30" fill="none" stroke="#4a4a4a" stroke-width="7" stroke-dasharray="170 20"/><circle cx="50" cy="20" r="7" fill="#4a4a4a"/><circle cx="47" cy="17" r="1.5" fill="white"/><circle cx="53" cy="17" r="1.5" fill="white"/><line x1="45" y1="14" x2="42" y2="10" stroke="#4a4a4a" stroke-width="1.5" stroke-linecap="round"/><line x1="55" y1="14" x2="58" y2="10" stroke="#4a4a4a" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  // 10 — sun with rays
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#f5f2e8"/><circle cx="50" cy="50" r="16" fill="none" stroke="#4a4a4a" stroke-width="2"/><circle cx="50" cy="50" r="6" fill="#4a4a4a"/>${sunRays(50, 50, 22, 34)}</svg>`,
  // 11 — minimal leaf / botanical
  `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" fill="#ecf0e8"/><path d="M50,85 C50,85 20,65 20,38 C20,18 35,10 50,12 C65,10 80,18 80,38 C80,65 50,85 50,85Z" fill="none" stroke="#4a4a4a" stroke-width="2"/><line x1="50" y1="85" x2="50" y2="12" stroke="#4a4a4a" stroke-width="1.2"/><line x1="50" y1="35" x2="30" y2="25" stroke="#4a4a4a" stroke-width="0.9"/><line x1="50" y1="45" x2="28" y2="40" stroke="#4a4a4a" stroke-width="0.9"/><line x1="50" y1="55" x2="30" y2="55" stroke="#4a4a4a" stroke-width="0.9"/><line x1="50" y1="65" x2="33" y2="68" stroke="#4a4a4a" stroke-width="0.9"/><line x1="50" y1="35" x2="70" y2="25" stroke="#4a4a4a" stroke-width="0.9"/><line x1="50" y1="45" x2="72" y2="40" stroke="#4a4a4a" stroke-width="0.9"/><line x1="50" y1="55" x2="70" y2="55" stroke="#4a4a4a" stroke-width="0.9"/><line x1="50" y1="65" x2="67" y2="68" stroke="#4a4a4a" stroke-width="0.9"/></svg>`,
];

function openFlashPicker() {
  renderFlashGrid();
  document.getElementById('modal-flash').classList.add('is-open');
}

function closeFlashPicker() {
  document.getElementById('modal-flash').classList.remove('is-open');
}

function renderFlashGrid() {
  const grid = document.getElementById('flash-grid');
  let html = '';

  FLASH_SVGS.forEach(function (svg, i) {
    const isSelected = state.selectedFlash.includes(i);
    const cls = isSelected ? 'flash-thumb flash-thumb--selected' : 'flash-thumb';
    html += `<div class="${cls}" onclick="toggleFlash(${i})">${svg}</div>`;
  });

  grid.innerHTML = html;
}

function toggleFlash(idx) {
  const pos = state.selectedFlash.indexOf(idx);
  if (pos > -1) {
    state.selectedFlash.splice(pos, 1);
  } else if (state.selectedFlash.length < 4) {
    state.selectedFlash.push(idx);
  } else {
    showToast('you can select up to 4 images');
    return;
  }
  renderFlashGrid();
}

function confirmFlash() {
  const input = document.getElementById('bk-flash');
  const count = state.selectedFlash.length;
  if (count === 0) {
    input.value = '';
  } else {
    input.value = count === 1 ? '1 image selected' : `${count} images selected`;
  }
  closeFlashPicker();
}

/* ===================================================
   FORM SUBMIT
=================================================== */
function handleSubmit(e, formName) {
  e.preventDefault();
  showToast('submitted — we\'ll be in touch.');
  e.target.reset();
  state.selectedDates = [];
  state.selectedFlash = [];
  document.getElementById('bk-avail').value = '';
  document.getElementById('bk-flash').value = '';
}

/* ===================================================
   FLASHBOOK
=================================================== */

// 20 placeholder flashbook images (different SVG patterns)
function scaleSVGForEmbed(svgString, x, y, width, height) {
  // Parse and reserialize using DOM to safely set attributes
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.querySelector('svg');
  if (!svgEl) return svgString;
  svgEl.setAttribute('x', String(x));
  svgEl.setAttribute('y', String(y));
  svgEl.setAttribute('width', String(width));
  svgEl.setAttribute('height', String(height));
  return new XMLSerializer().serializeToString(svgEl);
}

function generateFlashbookSVGs() {
  const svgs = [];

  for (let i = 0; i < 20; i++) {
    const hue = (i * 37) % 360;
    const bg = `hsl(${hue},8%,${85 + (i % 3) * 4}%)`;
    const inner = scaleSVGForEmbed(FLASH_SVGS[i % FLASH_SVGS.length], 20, 20, 160, 160);
    svgs.push(`<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="${bg}"/>${inner}</svg>`);
  }
  return svgs;
}

let flashbookSVGs = null;

function initFlashbook() {
  if (flashbookSVGs === null) {
    flashbookSVGs = generateFlashbookSVGs();
  }

  const grid = document.getElementById('flashbook-grid');
  let html = '';
  flashbookSVGs.forEach(function (svg, i) {
    const cls = i === state.activeFlashbookThumb ? 'flashbook__thumb flashbook__thumb--active' : 'flashbook__thumb';
    html += `<div class="${cls}" onclick="selectFlashbookThumb(${i})" data-idx="${i}">${svg}</div>`;
  });
  grid.innerHTML = html;

  setFlashbookPreview(state.activeFlashbookThumb);
  initFlashbookDivider();
}

function selectFlashbookThumb(idx) {
  state.activeFlashbookThumb = idx;

  // Update active class
  document.querySelectorAll('.flashbook__thumb').forEach(function (el) {
    el.classList.remove('flashbook__thumb--active');
  });
  const active = document.querySelector(`.flashbook__thumb[data-idx="${idx}"]`);
  if (active) active.classList.add('flashbook__thumb--active');

  setFlashbookPreview(idx);
}

function setFlashbookPreview(idx) {
  const svg = flashbookSVGs[idx];
  const preview = document.getElementById('flashbook-preview');

  // Remove any existing preview SVG
  const existing = preview.querySelector('svg.preview-svg');
  if (existing) existing.remove();

  // Parse the SVG and render it directly, full-cover
  const wrapper = document.createElement('div');
  wrapper.innerHTML = svg;
  const svgEl = wrapper.querySelector('svg');
  if (svgEl) {
    svgEl.setAttribute('class', 'preview-svg');
    svgEl.style.cssText = 'width:100%;height:100%;position:absolute;inset:0;';
    svgEl.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    preview.appendChild(svgEl);
  }
}

/* ===================================================
   FLASHBOOK DIVIDER (drag to resize)
=================================================== */
function initFlashbookDivider() {
  const divider = document.getElementById('flashbook-divider');
  const flashbook = document.getElementById('flashbook');
  const preview = document.querySelector('.flashbook__preview');

  if (!divider || !flashbook || !preview) return;

  let dragging = false;
  let startX = 0;
  let startWidth = 0;

  function onPointerDown(e) {
    dragging = true;
    startX = e.clientX;
    startWidth = preview.getBoundingClientRect().width;
    divider.classList.add('is-dragging');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    e.preventDefault();
  }

  function onPointerMove(e) {
    if (!dragging) return;
    const dx = e.clientX - startX;
    const totalWidth = flashbook.getBoundingClientRect().width;
    let newWidth = startWidth + dx;
    // Clamp between 20% and 80%
    newWidth = Math.max(totalWidth * 0.2, Math.min(totalWidth * 0.8, newWidth));
    preview.style.flex = 'none';
    preview.style.width = newWidth + 'px';
  }

  function onPointerUp() {
    if (!dragging) return;
    dragging = false;
    divider.classList.remove('is-dragging');
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }

  divider.addEventListener('mousedown', onPointerDown);
  document.addEventListener('mousemove', onPointerMove);
  document.addEventListener('mouseup', onPointerUp);

  // Touch support
  divider.addEventListener('touchstart', function (e) {
    onPointerDown(e.touches[0]);
  }, { passive: false });
  document.addEventListener('touchmove', function (e) {
    onPointerMove(e.touches[0]);
  }, { passive: true });
  document.addEventListener('touchend', onPointerUp);
}

/* ===================================================
   TOAST
=================================================== */
let toastTimer = null;

function showToast(msg) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('is-visible');
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function () {
    toast.classList.remove('is-visible');
  }, 2800);
}
