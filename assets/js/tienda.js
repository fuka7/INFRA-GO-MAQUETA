/* ═══════════════════════════════════════════════
   tienda.js — InfraGo
   Lógica de la página de tienda.
   Requiere: productos.js cargado antes que este archivo.
   © 2026 InfraGo SpA / TIC Managers
═══════════════════════════════════════════════ */

/* ── Estado de filtros ── */
let currentView   = 'grid';
let currentCat    = 'todos';
let currentMax    = 200000;
let currentSearch = '';
let currentOrder  = 'relevancia';

/* ── Clases de badge según valor ── */
const BADGE_CLASS = {
  'Más vendido': 'prod-badge--hot',
  'Popular':     'prod-badge--hot',
  'Nuevo':       'prod-badge--new',
  'Premium':     'prod-badge--premium'
};

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
      onclick="window.location.href='/producto.html?id=${p.id}'">
      ${badgeHtml}
      <div class="prod-img">${p.svg}</div>
      <div class="prod-info">
        <div class="prod-brand">${p.marca}</div>
        <div class="prod-name">${p.nombreLargo}</div>
        <div class="prod-specs-list">${specsHtml}</div>
        <div class="prod-footer">
          <div class="prod-price">
            <span class="prod-price-from">Desde</span>
            <span class="prod-price-val">$${p.precio.toLocaleString('es-CL')}</span>
            <span class="prod-price-period">/mes</span>
          </div>
          <a href="/producto.html?id=${p.id}" class="prod-btn" onclick="event.stopPropagation()">Ver producto</a>
        </div>
      </div>
    </div>`;
}

/* ── Renderizar todas las cards en el grid ── */
function renderCards() {
  const grid = document.getElementById('productosGrid');
  if (!grid) return;
  grid.innerHTML = PRODUCTOS_DB.map(buildCard).join('');
}

/* ── Filtros ── */
function applyFilters() {
  const marcasActivas = [...document.querySelectorAll('#filtroMarcas input:checked')].map(c => c.value);
  let cards = [...document.querySelectorAll('.prod-card')];

  cards.forEach(card => {
    const catOk    = currentCat === 'todos' || card.dataset.cat === currentCat;
    const marcaOk  = marcasActivas.includes(card.dataset.marca);
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
  }
  visible.forEach(card => grid.appendChild(card));

  // Contador y estado vacío
  const count = visible.length;
  document.getElementById('productCount').textContent = count + ' producto' + (count !== 1 ? 's' : '');
  document.getElementById('tiendaEmpty').style.display  = count === 0 ? 'flex' : 'none';
  document.getElementById('productosGrid').style.display = count === 0 ? 'none' : '';

  updateActiveFilters();
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

  if (currentMax < 200000) tags.push({
    label: `Hasta $${currentMax.toLocaleString('es-CL')}`,
    clear: () => {
      currentMax = 200000;
      document.getElementById('precioRange').value = 200000;
      document.getElementById('rangeMax').textContent = '$200.000';
      applyFilters();
    }
  });

  _filterClears.length = 0;
  tags.forEach((t, i) => { _filterClears[i] = t.clear; });

  container.innerHTML = tags.map((t, i) =>
    `<span class="active-filter-tag">${t.label} <button onclick="clearActiveFilter(${i})">&times;</button></span>`
  ).join('');
}

function resetFilters() {
  currentCat    = 'todos';
  currentSearch = '';
  currentMax    = 200000;
  document.querySelector('#filtroCategorias input[value="todos"]').checked = true;
  document.querySelectorAll('.filtro-check[data-cat]').forEach(l => l.classList.remove('active'));
  document.querySelector('.filtro-check[data-cat="todos"]').classList.add('active');
  document.getElementById('searchInput').value = '';
  document.getElementById('precioRange').value = 200000;
  document.getElementById('rangeMax').textContent = '$200.000';
  document.querySelectorAll('#filtroMarcas input').forEach(c => c.checked = true);
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
  // 1. Generar cards desde PRODUCTOS_DB
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

  document.querySelectorAll('#filtroMarcas input').forEach(cb => {
    cb.addEventListener('change', applyFilters);
  });

  // 3. Leer ?cat= de la URL y aplicar filtro inicial
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

  applyFilters();
});