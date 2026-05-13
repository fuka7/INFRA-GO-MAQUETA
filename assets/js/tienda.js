/* ═══════════════════════════════════════════════
   tienda.js — InfraGo
   Lógica de la página de tienda.
   Requiere: productos.js cargado antes que este archivo.
   © 2026 InfraGo SpA / TIC Managers
═══════════════════════════════════════════════ */

/* ── Estado de filtros ── */
let currentView   = 'grid';
let currentCat    = 'todos';
let currentMax    = 5000000;
let currentSearch = '';
let currentOrder  = 'relevancia';

/* ── Clases de badge según valor ── */
const BADGE_CLASS = {
  'Más vendido': 'prod-badge--hot',
  'Popular':     'prod-badge--hot',
  'Nuevo':       'prod-badge--new',
  'Premium':     'prod-badge--premium'
};

/* ── Íconos y colores por servicio ── */
const SVC_META = {
  'tic-instalacion':       { color: '#FF7A00', bg: 'rgba(255,122,0,0.1)',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>' },
  'tic-migracion':          { color: '#2563c4', bg: 'rgba(37,99,196,0.1)',    svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v6c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/><path d="M3 11v6c0 1.66 4.03 3 9 3s9-1.34 9-3v-6"/><path d="M16 17l3-3-3-3"/><path d="M8 7l-3 3 3 3"/></svg>' },
  'tic-mesa-ayuda':         { color: '#16a34a', bg: 'rgba(22,163,74,0.1)',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3z"/><path d="M3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>' },
  'tic-soporte-terreno':    { color: '#7c3aed', bg: 'rgba(124,58,237,0.1)',  svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="3"/></svg>' },
  'tic-seguro-equipos':     { color: '#0891b2', bg: 'rgba(8,145,178,0.1)',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>' },
  'tic-cibgestion-esencial':{ color: '#ca8a04', bg: 'rgba(202,138,4,0.1)',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1" fill="currentColor"/></svg>' },
  'tic-cibgestion-avanzada':{ color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>' },
  'tic-cibgestion-enterprise':{ color: '#9333ea', bg: 'rgba(147,51,234,0.1)', svg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="36" height="36"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polygon points="12 8 13.5 11 17 11.5 14.5 14 15 17.5 12 16 9 17.5 9.5 14 7 11.5 10.5 11 12 8"/></svg>' },
};

/* ── Agregar servicio al carro con ícono coloreado para el dropdown ── */
function igAddService(id, nombre, precio) {
  if (typeof igcAddItem !== 'function') return;
  const meta = SVC_META[id] || { color: '#FF7A00', bg: 'rgba(255,122,0,0.1)', svg: '' };
  const miniSvg = meta.svg.replace(/width="36" height="36"/, 'width="26" height="26"');
  const iconHtml = `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:${meta.bg};border-radius:8px;color:${meta.color}">${miniSvg}</div>`;
  igcAddItem(id, nombre, precio, iconHtml);
}

/* ── Card especial para servicios (sin foto ni enlace a detalle) ── */
function buildServiceCard(p) {
  const badgeHtml = p.badge
    ? `<div class="prod-badge ${BADGE_CLASS[p.badge] || 'prod-badge--hot'}">${p.badge}</div>`
    : '';
  const specsHtml = p.specsResumen.map(s => `<span>${s}</span>`).join('');
  const meta = SVC_META[p.id] || { color: '#FF7A00', bg: 'rgba(255,122,0,0.1)', svg: '' };
  return `
    <div class="prod-card svc-card"
      data-cat="${p.cat}"
      data-marca="${p.marca}"
      data-precio="${p.precio}"
      data-nombre="${p.nombre}">
      ${badgeHtml}
      <div class="svc-icon-area" style="--svc-color:${meta.color};--svc-bg:${meta.bg}">
        <div class="svc-icon-circle" style="color:${meta.color};background:${meta.bg}">${meta.svg}</div>
      </div>
      <div class="prod-info">
        <div class="prod-brand">${p.marca}</div>
        <div class="prod-name">${p.nombreLargo}</div>
        <div class="prod-specs-list">${specsHtml}</div>
        <div class="prod-footer">
          <div class="prod-price">
            <span class="prod-price-val">$${p.precio.toLocaleString('es-CL')}</span>
          </div>
          <div class="prod-btns">
            <button class="prod-btn prod-btn--cart" onclick="event.stopPropagation(); igAddService('${p.id}', '${p.nombre.replace(/'/g, String.fromCharCode(92,39))}', ${p.precio})">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Generar HTML de una card ── */
function buildCard(p) {
  const badgeHtml = p.badge
    ? `<div class="prod-badge ${BADGE_CLASS[p.badge] || 'prod-badge--hot'}">${p.badge}</div>`
    : '';

  const specsHtml = p.specsResumen
    .map(s => `<span>${s}</span>`)
    .join('');

  return `
    <div class="prod-card"
      data-cat="${p.cat}"
      data-marca="${p.marca}"
      data-precio="${p.precio}"
      data-nombre="${p.nombre}"
      style="cursor:pointer;"
      onclick="sessionStorage.setItem('igb_tienda_back', location.href); window.location.href='/producto.html?id=${p.id}'">
      ${badgeHtml}
      <div class="prod-img">${p.img ? `<img src="${p.img}" alt="${p.nombre}" loading="lazy">` : p.svg}</div>
      <div class="prod-info">
        <div class="prod-brand">${p.marca}</div>
        <div class="prod-name">${p.nombreLargo}</div>
        <div class="prod-specs-list">${specsHtml}</div>
        <div class="prod-footer">
          <div class="prod-price">
            <span class="prod-price-val">$${p.precio.toLocaleString('es-CL')}</span>
          </div>
          <div class="prod-btns">
            <a href="/producto.html?id=${p.id}" class="prod-btn prod-btn--sec" onclick="event.stopPropagation(); sessionStorage.setItem('igb_tienda_back', location.href)">Ver</a>
            <button class="prod-btn prod-btn--cart" onclick="event.stopPropagation(); typeof igcAddItem==='function' && igcAddItem('${p.id}', '${p.nombre.replace(/'/g, String.fromCharCode(92,39))}', ${p.precio}, '')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              Agregar
            </button>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Renderizar todas las cards en el grid ── */
function renderCards() {
  const grid = document.getElementById('productosGrid');
  if (!grid) return;
  const catalog = (window.CATALOGO || [])
    .filter(p => p.cat !== 'licencias')
    .map(p => ({ ...p, precio: p.precioVenta }));
  grid.innerHTML = catalog.map(p => p.cat === 'servicios' ? buildServiceCard(p) : buildCard(p)).join('');
  [...grid.querySelectorAll('.prod-card')].forEach((card, i) => card.dataset.idx = i);
}

/* ── Filtros ── */
function applyFilters() {
  const marcasActivas = [...document.querySelectorAll('#filtroMarcas .marca-pill.active')].map(b => b.dataset.marca);
  let cards = [...document.querySelectorAll('.prod-card')];

  cards.forEach(card => {
    const catOk    = currentCat === 'todos' || card.dataset.cat === currentCat;
    const marcaOk  = marcasActivas.length === 0 || marcasActivas.includes(card.dataset.marca);
    const precioOk = parseInt(card.dataset.precio) <= currentMax;
    const searchOk = card.dataset.nombre.toLowerCase().includes(currentSearch);

    card.style.display = (catOk && marcaOk && precioOk && searchOk) ? '' : 'none';
  });

  // Ordenar
  const grid = document.getElementById('productosGrid');
  const visible = cards.filter(c => c.style.display !== 'none');

  if (currentOrder === 'precio-asc') {
    visible.sort((a, b) => parseInt(a.dataset.precio) - parseInt(b.dataset.precio));
  } else if (currentOrder === 'precio-desc') {
    visible.sort((a, b) => parseInt(b.dataset.precio) - parseInt(a.dataset.precio));
  } else if (currentOrder === 'nombre') {
    visible.sort((a, b) => a.dataset.nombre.localeCompare(b.dataset.nombre));
  } else {
    visible.sort((a, b) => parseInt(a.dataset.idx) - parseInt(b.dataset.idx));
  }
  visible.forEach(card => grid.appendChild(card));

  // Contador y estado vacío
  const count = visible.length;
  document.getElementById('productCount').textContent = count + ' producto' + (count !== 1 ? 's' : '');
  document.getElementById('tiendaEmpty').style.display  = count === 0 ? 'flex' : 'none';
  document.getElementById('productosGrid').style.display = count === 0 ? 'none' : '';

  updateActiveFilters();
  updateUrl();
}

function filterByPrice(val) {
  currentMax = parseInt(val);
  document.getElementById('rangeMax').textContent = '$' + parseInt(val).toLocaleString('es-CL');
  applyFilters();
}

function searchProducts() {
  currentSearch = document.getElementById('searchInput').value.toLowerCase();
  applyFilters();
}

function sortProducts() {
  currentOrder = document.getElementById('ordenSelect').value;
  applyFilters();
}

/* ── Filtros activos (tags) ── */
const _filterClears = [];

function clearActiveFilter(i) {
  if (_filterClears[i]) _filterClears[i]();
}

function updateActiveFilters() {
  const container = document.getElementById('activeFilters');
  const tags = [];

  if (currentCat !== 'todos') tags.push({
    label: currentCat,
    clear: () => {
      currentCat = 'todos';
      document.querySelector('#filtroCategorias input[value="todos"]').checked = true;
      document.querySelectorAll('.filtro-check[data-cat]').forEach(l => l.classList.remove('active'));
      document.querySelector('.filtro-check[data-cat="todos"]').classList.add('active');
      applyFilters();
    }
  });

  if (currentSearch) tags.push({
    label: `"${currentSearch}"`,
    clear: () => {
      currentSearch = '';
      document.getElementById('searchInput').value = '';
      applyFilters();
    }
  });

  if (currentMax < 5000000) tags.push({
    label: `Hasta $${currentMax.toLocaleString('es-CL')}`,
    clear: () => {
      currentMax = 5000000;
      document.getElementById('precioRange').value = 5000000;
      document.getElementById('rangeMax').textContent = '$5.000.000';
      applyFilters();
    }
  });

  _filterClears.length = 0;
  tags.forEach((t, i) => { _filterClears[i] = t.clear; });

  container.innerHTML = tags.map((t, i) =>
    `<span class="active-filter-tag">${t.label} <button onclick="clearActiveFilter(${i})">&times;</button></span>`
  ).join('');
}

function updateUrl() {
  const params = new URLSearchParams();
  if (currentCat !== 'todos') params.set('cat', currentCat);
  if (currentSearch)          params.set('q',   currentSearch);
  if (currentMax < 200000)    params.set('max', currentMax);
  const qs = params.toString();
  history.replaceState(null, '', qs ? '?' + qs : location.pathname);
}

function resetFilters() {
  currentCat    = 'todos';
  currentSearch = '';
  currentMax    = 5000000;
  document.querySelector('#filtroCategorias input[value="todos"]').checked = true;
  document.querySelectorAll('.filtro-check[data-cat]').forEach(l => l.classList.remove('active'));
  document.querySelector('.filtro-check[data-cat="todos"]').classList.add('active');
  document.getElementById('searchInput').value = '';
  document.getElementById('precioRange').value = 5000000;
  document.getElementById('rangeMax').textContent = '$5.000.000';
  document.querySelectorAll('#filtroMarcas .marca-pill').forEach(p => p.classList.remove('active'));
  applyFilters();
}

function setView(v) {
  currentView = v;
  const grid = document.getElementById('productosGrid');
  grid.className = v === 'list' ? 'productos-list' : 'productos-grid';
  document.getElementById('viewGrid').classList.toggle('active', v === 'grid');
  document.getElementById('viewList').classList.toggle('active', v === 'list');
}

/* ── Init ── */
window.addEventListener('DOMContentLoaded', () => {
  // 1. Generar cards desde CATALOGO
  renderCards();

  // 2. Conectar listeners de filtros
  document.querySelectorAll('#filtroCategorias input').forEach(radio => {
    radio.addEventListener('change', () => {
      currentCat = radio.value;
      document.querySelectorAll('.filtro-check[data-cat]').forEach(l => l.classList.remove('active'));
      radio.closest('.filtro-check').classList.add('active');
      applyFilters();
    });
  });

  document.querySelectorAll('#filtroMarcas .marca-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      pill.classList.toggle('active');
      applyFilters();
    });
    pill.querySelector('.pill-x').addEventListener('click', e => {
      e.stopPropagation();
      pill.classList.remove('active');
      applyFilters();
    });
  });

  // 3. Restaurar estado desde URL (?cat=, ?q=, ?max=)
  const params = new URLSearchParams(window.location.search);

  const cat = params.get('cat');
  if (cat) {
    const radio = document.querySelector(`#filtroCategorias input[value="${cat}"]`);
    if (radio) {
      radio.checked = true;
      currentCat = cat;
      document.querySelectorAll('.filtro-check[data-cat]').forEach(l => l.classList.remove('active'));
      radio.closest('.filtro-check').classList.add('active');
    }
  }

  const q = params.get('q');
  if (q) {
    currentSearch = q.toLowerCase();
    const inp = document.getElementById('searchInput');
    if (inp) inp.value = q;
  }

  const max = params.get('max');
  if (max) {
    currentMax = parseInt(max);
    const rng = document.getElementById('precioRange');
    if (rng) rng.value = max;
    const lbl = document.getElementById('rangeMax');
    if (lbl) lbl.textContent = '$' + parseInt(max).toLocaleString('es-CL');
  }

  applyFilters();
});
/* ── Estilos botones dobles en cards ── */
(function() {
  if (document.getElementById('igc-card-btn-styles')) return;
  var s = document.createElement('style');
  s.id = 'igc-card-btn-styles';
  s.textContent = [
    '.prod-btns { display:flex; gap:6px; width:100%; }',
    '.prod-btn--sec {',
    '  flex:0 0 auto; padding:8px 16px;',
    '  background:transparent; border:1.5px solid #dde1e8;',
    '  border-radius:7px; color:#4a6080; font-size:12px; font-weight:700;',
    '  text-decoration:none; transition:all .15s; cursor:pointer; display:inline-flex;',
    '  align-items:center;',
    '}',
    '.prod-btn--sec:hover { border-color:#0083FF; color:#0083FF; }',
    '.prod-btn--cart {',
    '  flex:1; display:flex; align-items:center; justify-content:center; gap:5px;',
    '  background:#FF7A00; border:none; border-radius:7px;',
    '  color:#fff; font-size:12px; font-weight:800; cursor:pointer;',
    '  padding:8px 10px; transition:background .15s; font-family:inherit;',
    '}',
    '.prod-btn--cart:hover { background:#CC6200; }',
  ].join('\n');
  document.head.appendChild(s);
})();