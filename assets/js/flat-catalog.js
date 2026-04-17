/* ═══════════════════════════════════════════════════════════════
   flat-catalog.js — InfraGo
   ───────────────────────────────────────────────────────────────
   Tabla dinámica de pedido con selector de productos del catálogo.
   · Cada fila tiene un <select> para elegir producto del catálogo
   · Botón "+ Agregar producto al pedido" añade una nueva fila
   · Botón × elimina una fila
   · Cantidades con spinner integrado
   · Precios actualizados por descuento por volumen y tipo de cambio
   · Estado expuesto en window._flatRows para configurador.js
   ═══════════════════════════════════════════════════════════════ */

/* ─── helpers ───────────────────────────────────────────────── */
function flatSlugify(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}
function flatFmt(n) {
  return (n || 0).toLocaleString('es-CL');
}
function flatObtenerPct(totalQty) {
  const TRAMOS = [
    { min: 10, max: 19,   pct: 1 },
    { min: 20, max: 29,   pct: 2 },
    { min: 30, max: 39,   pct: 3 },
    { min: 40, max: 49,   pct: 4 },
    { min: 50, max: 9999, pct: 5 },
  ];
  const t = TRAMOS.find(t => totalQty >= t.min && totalQty <= t.max);
  return t ? t.pct : 0;
}

/* Tipo → badge CSS class y abreviatura */
const TIPO_META = {
  'notebook':     { abbr: 'NB',  cls: 'pr-cat-badge--notebook'   },
  'servidor':     { abbr: 'SRV', cls: 'pr-cat-badge--servidor'   },
  'impresora':    { abbr: 'IMP', cls: 'pr-cat-badge--impresora'  },
  'networking':   { abbr: 'NET', cls: 'pr-cat-badge--networking' },
  'storage':      { abbr: 'NAS', cls: 'pr-cat-badge--storage'    },
  'servicio-tic': { abbr: 'SVC', cls: 'pr-cat-badge--servicio-tic'},
};

/* ─── estado: filas del pedido ──────────────────────────────── */
// Expuesto en window._flatRows para que configurador.js calcule sidebar y descuentos
let _flatRows   = [];   // [{ id, productName|null, qty, serviceValue|null }]
let _rowCounter = 0;
window._flatRows = _flatRows;   // referencia viva — siempre actualizada

function newRowId() { return ++_rowCounter; }

/* ═══════════════════════════════════════════════════════════════
   buildCatalogTable  — punto de entrada principal
═══════════════════════════════════════════════════════════════ */
window.buildCatalogTable = function buildCatalogTable() {
  const catalogoDiv = document.getElementById('catalogoProductos');
  if (!catalogoDiv) return;

  /* Ocultar el accordion original */
  catalogoDiv.style.display = 'none';

  /* Contenedor principal */
  const wrap = document.createElement('div');
  wrap.id = 'flatCatalogTable';
  wrap.className = 'flat-catalog-table';

  /* ── cabecera de columnas ── */
  wrap.innerHTML = `
    <div class="flat-col-headers">
      <span class="flat-col-label center">#</span>
      <span class="flat-col-label">Producto del catálogo</span>
      <span class="flat-col-label center">Cat.</span>
      <span class="flat-col-label right">P. Lista Unit.</span>
      <span class="flat-col-label center">Cant.</span>
      <span class="flat-col-label right">P. con dto.</span>
      <span class="flat-col-label right">Subtotal</span>
      <span class="flat-col-label right">Ahorro $</span>
    </div>
    <div id="flatRowsBody"></div>
    <div class="flat-add-row">
      <button type="button" id="btnAddFlatRow" onclick="flatAddRow()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Agregar producto al pedido
      </button>
    </div>
  `;

  catalogoDiv.parentNode.insertBefore(wrap, catalogoDiv);

  _injectStyles();

  /* Empezar con 3 filas vacías */
  for (let i = 0; i < 3; i++) flatAddRow(false);

  flatRefreshPrices();
};

/* ═══════════════════════════════════════════════════════════════
   flatAddRow  — agrega una fila nueva al cuerpo
═══════════════════════════════════════════════════════════════ */
window.flatAddRow = function flatAddRow(animate = true) {
  const id = newRowId();
  _flatRows.push({ id, productName: null, qty: 0, serviceValue: null });
  window._flatRows = _flatRows; // mantener referencia actualizada

  const body = document.getElementById('flatRowsBody');
  if (!body) return;

  const rowEl = _buildRowEl(id, animate);
  body.appendChild(rowEl);
  _renumberRows();
};

/* ─── construir elemento de fila ─────────────────────────────── */
function _buildRowEl(id, animate) {
  const div = document.createElement('div');
  div.className = 'flat-order-row' + (animate ? ' row-entering' : '');
  div.id = `orow-${id}`;
  div.dataset.rowId = id;

  div.innerHTML = `
    <div class="pr-num row-num"></div>

    <div class="pr-info pr-info--select">
      <div class="flat-select-wrap">
        <select class="flat-product-select" onchange="flatRowSelectProduct(${id}, this)">
          <option value="">— seleccionar producto —</option>
          ${_buildSelectOptions()}
        </select>
      </div>
    </div>

    <div class="pr-cat"><span class="pr-cat-badge" id="catbadge-${id}"></span></div>

    <div class="pr-precio-lista">
      <span class="precio-base" id="plista-${id}">—</span>
      <span class="precio-usd"  id="pusd-${id}"></span>
    </div>

    <div class="pr-qty pr-qty--disabled" id="prqty-${id}">
      <button type="button" onclick="flatRowDecQty(${id})" tabindex="-1">−</button>
      <span class="qty-value" id="qval-${id}">0</span>
      <button type="button" onclick="flatRowIncQty(${id})" tabindex="-1">+</button>
    </div>

    <div class="pr-precio-dto">
      <span class="precio-dto-val sin-dto" id="pdto-${id}">—</span>
      <span class="dto-badge oculto"       id="dtobadge-${id}"></span>
    </div>

    <div class="pr-subtotal">
      <span class="subtotal-val inactive" id="psub-${id}">—</span>
    </div>

    <div class="pr-ahorro">
      <span class="ahorro-val cero" id="pahorro-${id}">—</span>
      <button type="button" class="flat-del-btn" onclick="flatRemoveRow(${id})" title="Eliminar fila">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  `;

  if (animate) {
    requestAnimationFrame(() => div.classList.remove('row-entering'));
  }

  return div;
}

/* ─── construir opciones del <select> agrupadas por categoría ── */
function _buildSelectOptions() {
  if (!window.CATALOGO || !Array.isArray(window.CATALOGO)) return '';

  const grupos = {};
  const labelMap = {
    'notebook':     'Notebooks',
    'servidor':     'Servidores',
    'impresora':    'Impresoras',
    'networking':   'Networking',
    'storage':      'Almacenamiento',
    'servicio-tic': 'Servicios TIC',
  };

  window.CATALOGO.forEach(p => {
    const g = p.tipo || 'otros';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(p);
  });

  let html = '';
  Object.entries(grupos).forEach(([tipo, items]) => {
    const label = labelMap[tipo] || tipo;
    html += `<optgroup label="${label}">`;
    items.forEach(p => {
      const part = p.partNumber ? ` · ${p.partNumber}` : '';
      html += `<option value="${encodeURIComponent(p.name)}" data-tipo="${tipo}">${p.name}${part}</option>`;
    });
    html += `</optgroup>`;
  });
  return html;
}

/* ═══════════════════════════════════════════════════════════════
   flatRowSelectProduct  — cuando el usuario elige un producto
═══════════════════════════════════════════════════════════════ */
window.flatRowSelectProduct = function flatRowSelectProduct(id, selectEl) {
  const row = _flatRows.find(r => r.id === id);
  if (!row) return;

  const val = selectEl.value;
  if (!val) {
    row.productName  = null;
    row.serviceValue = null;
    row.qty = 0;
    const span = document.getElementById(`qval-${id}`);
    if (span) span.textContent = '0';
    const qtyWrap = document.getElementById(`prqty-${id}`);
    if (qtyWrap) qtyWrap.classList.add('pr-qty--disabled');
    _clearRowDisplay(id);
    flatRefreshPrices();
    _syncAllToOriginal();
    if (typeof window.updateSidebar       === 'function') window.updateSidebar();
    if (typeof window.actualizarDescuento === 'function') window.actualizarDescuento();
    return;
  }

  const productName  = decodeURIComponent(val);
  row.productName    = productName;
  row.serviceValue   = null;

  const producto = (window.CATALOGO || []).find(p => p.name === productName);
  if (!producto) return;

  /* Actualizar badge de categoría */
  const meta  = TIPO_META[producto.tipo] || { abbr: '?', cls: '' };
  const badge = document.getElementById(`catbadge-${id}`);
  if (badge) {
    badge.textContent = meta.abbr;
    badge.className   = `pr-cat-badge ${meta.cls}`;
  }

  /* Habilitar spinner de cantidad y poner 1 automáticamente */
  const qtyWrap = document.getElementById(`prqty-${id}`);
  if (qtyWrap) qtyWrap.classList.remove('pr-qty--disabled');
  if (row.qty === 0) {
    row.qty = 1;
    const span = document.getElementById(`qval-${id}`);
    if (span) span.textContent = '1';
  }

  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar        === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento  === 'function') window.actualizarDescuento();
};

/* ═══════════════════════════════════════════════════════════════
   Cantidad +/−
═══════════════════════════════════════════════════════════════ */
window.flatRowIncQty = function flatRowIncQty(id) {
  const row = _flatRows.find(r => r.id === id);
  if (!row) return;
  row.qty++;
  const span = document.getElementById(`qval-${id}`);
  if (span) span.textContent = row.qty;
  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar        === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento  === 'function') window.actualizarDescuento();
};

window.flatRowDecQty = function flatRowDecQty(id) {
  const row = _flatRows.find(r => r.id === id);
  if (!row || row.qty <= 0) return;
  row.qty--;
  const span = document.getElementById(`qval-${id}`);
  if (span) span.textContent = row.qty;
  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar        === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento  === 'function') window.actualizarDescuento();
};

/* ═══════════════════════════════════════════════════════════════
   Eliminar fila
═══════════════════════════════════════════════════════════════ */
window.flatRemoveRow = function flatRemoveRow(id) {
  const rowEl = document.getElementById(`orow-${id}`);
  if (rowEl) {
    rowEl.classList.add('row-leaving');
    setTimeout(() => {
      rowEl.remove();
      _flatRows = _flatRows.filter(r => r.id !== id);
      window._flatRows = _flatRows;
      _renumberRows();
      flatRefreshPrices();
      _syncAllToOriginal();
      if (typeof window.updateSidebar        === 'function') window.updateSidebar();
      if (typeof window.actualizarDescuento  === 'function') window.actualizarDescuento();
    }, 200);
  }
};

/* ─── renumerar filas ─────────────────────────────────────────── */
function _renumberRows() {
  let i = 0;
  document.querySelectorAll('.flat-order-row').forEach(el => {
    i++;
    const num = el.querySelector('.row-num');
    if (num) num.textContent = i;
  });
}

/* ─── limpiar display de una fila vacía ───────────────────────── */
function _clearRowDisplay(id) {
  const badge = document.getElementById(`catbadge-${id}`);
  if (badge) { badge.textContent = ''; badge.className = 'pr-cat-badge'; }
  ['plista','pusd','pdto','psub','pahorro'].forEach(pfx => {
    const el = document.getElementById(`${pfx}-${id}`);
    if (el) el.textContent = '—';
  });
  const dtoBadge = document.getElementById(`dtobadge-${id}`);
  if (dtoBadge) dtoBadge.classList.add('oculto');
}

/* ═══════════════════════════════════════════════════════════════
   flatRefreshPrices — actualiza TODAS las celdas de precio.
   · Respeta el tipo de cambio actual (window.tipoCambio)
   · El USD se muestra sobre el precio con descuento (no el de lista)
═══════════════════════════════════════════════════════════════ */
window.flatRefreshPrices = function flatRefreshPrices() {
  const tc = window.tipoCambio || 900;

  /* 1. Total unidades para calcular % descuento */
  let totalQty = 0;
  _flatRows.forEach(r => {
    if (r.productName) totalQty += r.qty;
  });
  const pct = flatObtenerPct(totalQty);

  /* 2. Acumuladores para KPI de ahorro total (opcional, sidebar usa updateSidebar) */
  let totalListaAcum  = 0;
  let totalAhorroAcum = 0;

  /* 3. Actualizar cada fila */
  _flatRows.forEach(r => {
    const { id, productName, qty } = r;
    if (!productName) { _clearRowDisplay(id); return; }

    const producto = (window.CATALOGO || []).find(p => p.name === productName);
    if (!producto) return;

    const price         = producto.price || 0;
    const precioConDto  = Math.round(price * (1 - pct / 100));
    const subtotal      = qty * precioConDto;
    const subtotalLista = qty * price;
    const ahorro        = subtotalLista - subtotal;

    // USD calculado sobre precio con descuento (más preciso para el comprador)
    const usd = Math.round(precioConDto / tc);

    totalListaAcum  += subtotalLista;
    totalAhorroAcum += ahorro;

    /* Precio lista (tachado si hay dto) */
    const elBase = document.getElementById(`plista-${id}`);
    if (elBase) {
      elBase.textContent = `$${flatFmt(price)}`;
      elBase.classList.toggle('tachado', pct > 0 && qty > 0);
    }

    /* USD del precio con descuento */
    const elUsd = document.getElementById(`pusd-${id}`);
    if (elUsd) {
      elUsd.textContent = productName ? `≈ USD ${usd.toLocaleString('en-US')}` : '';
    }

    /* Precio con dto */
    const elDto   = document.getElementById(`pdto-${id}`);
    const elBadge = document.getElementById(`dtobadge-${id}`);
    if (elDto) {
      elDto.textContent = `$${flatFmt(precioConDto)}`;
      if (pct > 0) {
        elDto.classList.remove('sin-dto');
        if (elBadge) { elBadge.textContent = `-${pct}%`; elBadge.classList.remove('oculto'); }
      } else {
        elDto.classList.add('sin-dto');
        if (elBadge) elBadge.classList.add('oculto');
      }
    }

    /* Subtotal */
    const elSub = document.getElementById(`psub-${id}`);
    if (elSub) {
      if (qty > 0) {
        elSub.textContent = `$${flatFmt(subtotal)}`;
        elSub.classList.remove('inactive');
      } else {
        elSub.textContent = '—';
        elSub.classList.add('inactive');
      }
    }

    /* Ahorro por línea */
    const elAhorro = document.getElementById(`pahorro-${id}`);
    if (elAhorro) {
      if (qty > 0 && ahorro > 0) {
        elAhorro.textContent = `$${flatFmt(ahorro)}`;
        elAhorro.classList.remove('cero');
      } else if (qty > 0) {
        elAhorro.textContent = '$0';
        elAhorro.classList.add('cero');
      } else {
        elAhorro.textContent = '—';
        elAhorro.classList.add('cero');
      }
    }
  });
};

/* Alias para compatibilidad */
window.refreshTablePrices = window.flatRefreshPrices;

/* ═══════════════════════════════════════════════════════════════
   _syncAllToOriginal
   Sincroniza el estado _flatRows con los .product-item del accordion
   oculto, de modo que collectEquipos() / collectServicios() funcionen.
═══════════════════════════════════════════════════════════════ */
function _syncAllToOriginal() {
  /* Resetear todos a qty 0 */
  document.querySelectorAll('.product-item').forEach(item => {
    const q = item.querySelector('.qty-value');
    if (q) q.textContent = '0';
    const sel = item.querySelector('select');
    if (sel) sel.value = '';
  });

  /* Aplicar filas activas (suma si el mismo producto aparece en varias filas) */
  _flatRows.forEach(r => {
    if (!r.productName) return;
    const origItem = document.querySelector(`.product-item[data-name="${CSS.escape(r.productName)}"]`);
    if (!origItem) return;

    const origQty = origItem.querySelector('.qty-value');
    if (origQty) {
      const current = parseInt(origQty.textContent) || 0;
      origQty.textContent = current + r.qty;
    }

    if (r.serviceValue) {
      const origSel = origItem.querySelector('select');
      if (origSel) origSel.value = r.serviceValue;
    }
  });
}

/* ═══════════════════════════════════════════════════════════════
   Override de collectEquipos
   Lee directamente de _flatRows (más preciso que el accordion).
═══════════════════════════════════════════════════════════════ */
function _overrideCollectEquipos() {
  if (typeof window.collectEquipos !== 'function') return;
  const _orig = window.collectEquipos;

  window.collectEquipos = function () {
    if (!window.state) { _orig(); return; }
    window.state.equipos = {};

    const totalQtyAll = _flatRows.filter(x => x.productName).reduce((s, x) => s + x.qty, 0);
    const pct = flatObtenerPct(totalQtyAll);

    _flatRows.forEach(r => {
      if (!r.productName || r.qty <= 0) return;
      const producto = (window.CATALOGO || []).find(p => p.name === r.productName);
      if (!producto) return;

      const price = Math.round((producto.price || 0) * (1 - pct / 100));
      const key   = r.productName + (r.serviceValue ? ` (+svc:${r.serviceValue})` : '');

      if (window.state.equipos[key]) {
        window.state.equipos[key].qty += r.qty;
      } else {
        window.state.equipos[key] = { qty: r.qty, price };
      }
    });
  };
}

/* ═══════════════════════════════════════════════════════════════
   Override de updateSidebar
   Sincroniza el accordion antes de que updateSidebar lo lea.
═══════════════════════════════════════════════════════════════ */
function _overrideUpdateSidebar() {
  if (typeof window.updateSidebar !== 'function') return;
  const _orig = window.updateSidebar;

  window.updateSidebar = function () {
    _syncAllToOriginal();
    _orig();
  };
}

/* ═══════════════════════════════════════════════════════════════
   Override de validateStep — contar desde _flatRows en paso 1
═══════════════════════════════════════════════════════════════ */
function _overrideValidateStep() {
  if (typeof window.validateStep !== 'function') return;
  const _orig = window.validateStep;

  window.validateStep = function (step) {
    if (step === 1) {
      const totalQty = _flatRows.filter(r => r.productName).reduce((s, r) => s + r.qty, 0);
      if (totalQty === 0) {
        alert('⚠️ Debes seleccionar al menos un producto');
        return false;
      }
      _syncAllToOriginal();
      if (typeof window.collectEquipos === 'function') window.collectEquipos();
      return true;
    }
    return _orig(step);
  };
}

/* ═══════════════════════════════════════════════════════════════
   Búsqueda live — filtra las opciones de todos los <select>
   Se llama desde oninput del campo #searchProductos
═══════════════════════════════════════════════════════════════ */
function patchFlatFilters() {
  window.aplicarFiltros = function () {
    const q = (document.getElementById('searchProductos')?.value || '').toLowerCase().trim();

    /* Mostrar / ocultar botón de limpiar */
    const btnClear = document.getElementById('btnClearSearch');
    if (btnClear) btnClear.style.display = q ? '' : 'none';

    /* Filtrar opciones en cada fila */
    document.querySelectorAll('.flat-product-select').forEach(sel => {
      sel.querySelectorAll('optgroup').forEach(group => {
        let groupVisible = 0;
        group.querySelectorAll('option').forEach(opt => {
          const name = opt.textContent.toLowerCase();
          const show = !q || name.includes(q);
          opt.style.display = show ? '' : 'none';
          if (show) groupVisible++;
        });
        group.style.display = groupVisible > 0 ? '' : 'none';
      });
    });
  };
}

/* Limpiar búsqueda */
window.clearSearch = function clearSearch() {
  const inp = document.getElementById('searchProductos');
  if (inp) { inp.value = ''; inp.focus(); }
  window.aplicarFiltros();
};

/* ═══════════════════════════════════════════════════════════════
   _injectStyles  — estilos adicionales para la tabla dinámica
═══════════════════════════════════════════════════════════════ */
function _injectStyles() {
  if (document.getElementById('flat-order-styles')) return;
  const style = document.createElement('style');
  style.id = 'flat-order-styles';
  style.textContent = `
    /* Fila del pedido */
    .flat-order-row {
      display: grid;
      grid-template-columns: 36px minmax(200px, 1.6fr) 62px 88px 84px 84px 96px 86px;
      align-items: center;
      padding: 10px 16px;
      border-bottom: 1px solid var(--c-border-s);
      transition: background 0.15s, opacity 0.2s, transform 0.2s;
      gap: 0;
    }
    .flat-order-row:last-of-type { border-bottom: none; }
    .flat-order-row:hover { background: rgba(232,146,10,0.025); }
    .flat-order-row.row-entering { opacity: 0; transform: translateY(-6px); }
    .flat-order-row.row-leaving  { opacity: 0; transform: translateX(10px); }

    /* Select de producto */
    .pr-info--select { display: flex; flex-direction: column; gap: 5px; justify-content: center; }
    .flat-select-wrap { position: relative; }
    .flat-product-select {
      width: 100%;
      background: var(--c-surface-2);
      border: 1px solid var(--c-border);
      border-radius: 7px;
      padding: 6px 28px 6px 10px;
      color: var(--c-text);
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
      appearance: none;
      -webkit-appearance: none;
      transition: border-color 0.18s, box-shadow 0.18s;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 8px center;
    }
    .flat-product-select:focus {
      outline: none;
      border-color: var(--orange);
      box-shadow: 0 0 0 3px var(--orange-dim);
    }
    .flat-product-select option     { background: #1a2030; color: #eee; }
    .flat-product-select optgroup   { color: var(--orange); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }

    /* Botón eliminar fila */
    .flat-del-btn {
      width: 22px; height: 22px;
      border-radius: 5px;
      border: 1px solid rgba(239,68,68,0.25);
      background: rgba(239,68,68,0.07);
      color: #ef4444;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0;
      margin-left: 6px;
      flex-shrink: 0;
      transition: all 0.15s;
    }
    .flat-del-btn:hover { background: rgba(239,68,68,0.18); border-color: rgba(239,68,68,0.5); }
    .flat-del-btn svg { width: 11px; height: 11px; }

    /* Botón agregar fila */
    .flat-add-row {
      padding: 12px 16px;
      border-top: 1px dashed var(--c-border);
      background: var(--c-surface-2);
    }
    #btnAddFlatRow {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      background: var(--orange-dim);
      border: 1px solid rgba(240,120,0,0.3);
      border-radius: 8px;
      padding: 8px 16px;
      color: var(--orange);
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.18s;
    }
    #btnAddFlatRow:hover { background: rgba(240,120,0,0.18); border-color: var(--orange); }
    #btnAddFlatRow svg  { width: 14px; height: 14px; }

    /* pr-ahorro con botón eliminar */
    .flat-order-row .pr-ahorro {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 4px;
    }

    /* ── Buscador simple ── */
    .filtros-bar--simple {
      display: flex;
      align-items: center;
      padding: 10px 0 24px;
      gap: 10px;
    }
    .filtros-search--full {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--c-surface-2, #1e2535);
      border: 1px solid var(--c-border, rgba(255,255,255,0.1));
      border-radius: 10px;
      padding: 0 14px;
      transition: border-color 0.18s, box-shadow 0.18s;
    }
    .filtros-search--full:focus-within {
      border-color: var(--orange, #f07800);
      box-shadow: 0 0 0 3px var(--orange-dim, rgba(240,120,0,0.15));
    }
    .filtros-search--full svg {
      width: 16px; height: 16px;
      color: var(--c-text-muted, #888);
      flex-shrink: 0;
    }
    .filtros-search--full input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: var(--c-text, #eee);
      font-size: 13px;
      font-family: inherit;
      padding: 11px 0;
    }
    .filtros-search--full input::placeholder { color: var(--c-text-muted, #666); }
    .search-clear {
      background: none;
      border: none;
      padding: 4px;
      cursor: pointer;
      color: var(--c-text-muted, #888);
      display: flex;
      align-items: center;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
      flex-shrink: 0;
    }
    .search-clear:hover { color: var(--c-text, #eee); background: rgba(255,255,255,0.06); }
    .search-clear svg { width: 13px; height: 13px; }

    /* Spinner deshabilitado (sin producto seleccionado) */
    .pr-qty--disabled {
      opacity: 0.25;
      pointer-events: none;
      user-select: none;
    }

    /* Responsive */
    @media (max-width: 1100px) {
      .flat-order-row { grid-template-columns: 36px minmax(160px, 1.6fr) 62px 80px 80px 80px; }
      .flat-order-row .pr-ahorro { display: none; }
    }
    @media (max-width: 900px) {
      .flat-order-row { grid-template-columns: 36px minmax(140px, 1.6fr) 62px 80px 80px; }
      .flat-order-row .pr-subtotal { display: none; }
    }
    @media (max-width: 620px) {
      .flat-order-row { grid-template-columns: 28px 1fr 60px 72px; }
      .flat-order-row .pr-cat,
      .flat-order-row .pr-precio-dto { display: none; }
    }
  `;
  document.head.appendChild(style);
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
  // Pequeño delay para asegurar que configurador.js terminó su DOMContentLoaded
  setTimeout(() => {
    buildCatalogTable();
    flatRefreshPrices();

    /* Sobreescribir funciones del configurador para operar sobre _flatRows */
    _overrideCollectEquipos();
    _overrideUpdateSidebar();
    _overrideValidateStep();
    patchFlatFilters();
  }, 80);
});