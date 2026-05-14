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
  'pc':           { abbr: 'PC',  cls: 'pr-cat-badge--pc'         },
  'notebook':     { abbr: 'NB',  cls: 'pr-cat-badge--notebook'   },
  'servidor':     { abbr: 'SRV', cls: 'pr-cat-badge--servidor'   },
  'impresora':    { abbr: 'IMP', cls: 'pr-cat-badge--impresora'  },
  'networking':   { abbr: 'NET', cls: 'pr-cat-badge--networking' },
  'storage':      { abbr: 'LIC', cls: 'pr-cat-badge--storage'    },
  'servicio-tic': { abbr: 'SVC', cls: 'pr-cat-badge--servicio-tic'},
  'accesorios':   { abbr: 'ACC', cls: 'pr-cat-badge--accesorios' },
};

/* Marcas con logo disponible: slug → ruta de imagen */
/* Todos los logos como SVG inline — fondo color de marca + ícono/texto blanco */
const BRAND_LOGOS = {
  'hp':          '/img/HP_logo_630x630.png',
  'dell':        '/img/Dell-Logo.png',
  'lenovo':      '/img/lenovo-white-logo-png-image-701751694772186qprjoasoxm.png',
  'brother':     '/img/logo-Brother.png',
  /* TIC Managers — logo imagen */
  'tic-managers':'/img/logo tic.png',
  /* Apple */
  'apple':       '/img/apple.png',
  /* Cisco — 5 barras verticales formando puente */
  'cisco':       '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 44 24" class="pr-prov-logo pr-prov-logo--cisco"><g fill="#049fd9"><rect x="0" y="14" width="6" height="10" rx="1.5"/><rect x="9.5" y="8" width="6" height="16" rx="1.5"/><rect x="19" y="2" width="6" height="22" rx="1.5"/><rect x="28.5" y="8" width="6" height="16" rx="1.5"/><rect x="38" y="14" width="6" height="10" rx="1.5"/></g></svg>',
  /* Fortinet — escudo rojo con F */
  'fortinet':    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 26" class="pr-prov-logo pr-prov-logo--fortinet"><path d="M11 0L0 4.5v8C0 18.5 5 23 11 25c6-2 11-6.5 11-12.5v-8L11 0z" fill="#d32f2f"/><path d="M7 8.5h8v2.5H9.5v2H14v2.5H9.5V19H7z" fill="white"/></svg>',
  /* Ubiquiti — U blanca en círculo azul */
  'ubiquiti':    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="pr-prov-logo pr-prov-logo--ubiquiti"><circle cx="12" cy="12" r="11.5" fill="#0559c9"/><path d="M7.5 6.5v8a4.5 4.5 0 009 0v-8H14v8a2 2 0 01-4 0v-8H7.5z" fill="white"/></svg>',
  /* Synology */
  'synology':    '/img/synology.svg',
  /* QNAP */
  'qnap':        '/img/qnap.png',
  /* Canon */
  'canon':       '/img/Canon.svg',
  /* Logitech */
  'logitech':    '/img/logitech.jpg',
  /* Microsoft */
  'microsoft':   '/img/Microsoft-logo.png',
  /* Bitdefender */
  'bitdefender': '/img/bitdefender.png',
};

/* ─── estado: filas del pedido ──────────────────────────────── */
// Expuesto en window._flatRows para que configurador.js calcule sidebar y descuentos
let _flatRows   = [];   // [{ id, productName|null, qty }]
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
      <span class="flat-col-label center">Marca</span>
      <span class="flat-col-label">Producto del catálogo</span>
      <span class="flat-col-label center">Cat.</span>
      <span class="flat-col-label center">N° Parte</span>
      <span class="flat-col-label right">P. Lista c/IVA</span>
      <span class="flat-col-label center">Cant.</span>
      <span class="flat-col-label right">P. dto. c/IVA</span>
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
  _flatRows.push({ id, productName: null, qty: 0 });
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

    <div class="pr-prov"><span class="pr-prov-badge" id="provbadge-${id}"></span></div>

    <div class="pr-info pr-info--select">
      <div class="flat-select-wrap">
        <select class="flat-product-select" onchange="flatRowSelectProduct(${id}, this)">
          <option value="">— seleccionar producto —</option>
          ${_buildSelectOptions()}
        </select>
      </div>
    </div>

    <div class="pr-cat"><span class="pr-cat-badge" id="catbadge-${id}"></span></div>

    <div class="pr-partnum">
      <span class="pr-partnum-val" id="partnumbadge-${id}"></span>
    </div>

    <div class="pr-precio-lista">
      <span class="precio-base" id="plista-${id}">—</span>
      <span class="precio-usd"  id="pusd-${id}"></span>
    </div>

    <div class="pr-qty pr-qty--disabled" id="prqty-${id}">
      <div class="qty-spinner-wrap">
        <input type="number" class="qty-value" id="qval-${id}" value="0" min="0"
               oninput="flatRowSetQty(${id}, this)"
               onkeydown="flatRowQtyKey(event, ${id})"
               onblur="flatRowQtyBlur(${id}, this)"
               tabindex="0">
        <div class="qty-arrows">
          <button type="button" onclick="flatRowIncQty(${id})" tabindex="-1">▲</button>
          <button type="button" onclick="flatRowDecQty(${id})" tabindex="-1">▼</button>
        </div>
      </div>
    </div>

    <div class="pr-precio-dto">
      <span class="precio-dto-val sin-dto" id="pdto-${id}">—</span>
      <span class="dto-badge oculto"       id="dtobadge-${id}"></span>
    </div>

  `;

  if (animate) {
    requestAnimationFrame(() => div.classList.remove('row-entering'));
  }

  /* Aplicar filtro de categoría activa al select de esta fila */
  const rowSel = div.querySelector('.flat-product-select');
  if (rowSel) _applyCatFilterToSelect(rowSel);

  return div;
}

/* ─── construir opciones del <select> agrupadas por categoría ── */
/* ─── categoría activa según el chip seleccionado ─────────────── */
function _getActiveCat() {
  const chip = document.querySelector('.flat-cat-chip.active');
  return chip ? (chip.dataset.tipo || 'todos') : 'todos';
}

/* ─── aplicar filtro de categoría a un <select> de fila ───────── */
function _applyCatFilterToSelect(sel) {
  const cat = _getActiveCat();
  const tipoMap = {
    'pc':'PC','notebook':'Notebook','servidor':'Server & Storage',
    'impresora':'Impresoras','networking':'Networking',
    'storage':'Licencias & Atach','servicio-tic':'Servicios TIC',
    'accesorios':'Accesorios'
  };
  sel.querySelectorAll('optgroup').forEach(og => {
    const show = cat === 'todos' || og.label === (tipoMap[cat] || cat);
    og.style.display = show ? '' : 'none';
    og.querySelectorAll('option').forEach(o => { o.style.display = show ? '' : 'none'; });
  });
}

function _buildSelectOptions() {
  if (!window.CATALOGO || !Array.isArray(window.CATALOGO)) return '';

  const grupos = {};
  const labelMap = {
    'pc':           'PC',
    'notebook':     'Notebook',
    'servidor':     'Server & Storage',
    'impresora':    'Impresoras',
    'networking':   'Networking',
    'storage':      'Licencias & Atach',
    'servicio-tic': 'Servicios TIC',
    'accesorios':   'Accesorios',
  };

  const orden = ['pc', 'notebook', 'servidor', 'impresora', 'networking', 'storage', 'servicio-tic', 'accesorios'];

  window.CATALOGO.forEach(p => {
    const g = p.tipo || 'otros';
    if (!grupos[g]) grupos[g] = [];
    grupos[g].push(p);
  });

  let html = '';
  orden.forEach(tipo => {
    if (grupos[tipo]) {
      const label = labelMap[tipo];
      html += `<optgroup label="${label}">`;
      grupos[tipo].forEach(p => {
        html += `<option value="${encodeURIComponent(p.name)}" data-tipo="${tipo}">${p.name}</option>`;
      });
      html += `</optgroup>`;
    }
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
    row.qty = 0;
    const inp = document.getElementById(`qval-${id}`);
    if (inp) { inp.value = '0'; inp.min = '0'; }
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
  selectEl.title     = productName;

  const producto = (window.CATALOGO || []).find(p => p.name === productName);
  if (!producto) return;

  /* Actualizar badge de categoría */
  const meta  = TIPO_META[producto.tipo] || { abbr: '?', cls: '' };
  const badge = document.getElementById(`catbadge-${id}`);
  if (badge) {
    badge.textContent = meta.abbr;
    badge.className   = `pr-cat-badge ${meta.cls}`;
  }

  /* Logo / badge de marca */
  const provBadge = document.getElementById(`provbadge-${id}`);
  if (provBadge) {
    const marcaSlug = flatSlugify(producto.marca || '');
    const logoSrc   = BRAND_LOGOS[marcaSlug];
    if (logoSrc) {
      provBadge.innerHTML = logoSrc.startsWith('<svg')
        ? logoSrc
        : `<img src="${logoSrc}" alt="${producto.marca}" class="pr-prov-logo pr-prov-logo--${marcaSlug}">`;
      provBadge.className = `pr-prov-badge pr-prov-badge--logo pr-prov-badge--${marcaSlug}`;
    } else {
      provBadge.textContent = (producto.marca || '').toUpperCase();
      provBadge.className   = `pr-prov-badge pr-prov-badge--${marcaSlug}`;
    }
  }

  /* Badge de part number (oculto para licencias y servicios) */
  const partBadge = document.getElementById(`partnumbadge-${id}`);
  if (partBadge) {
    const sinPart = producto.tipo === 'storage' || producto.tipo === 'servicio-tic';
    partBadge.textContent = sinPart ? '—' : (producto.partNumber || '—');
    partBadge.className   = (!sinPart && producto.partNumber) ? 'pr-partnum-val has-part' : 'pr-partnum-val';
  }

  /* Habilitar spinner de cantidad y poner 1 automáticamente */
  const qtyWrap = document.getElementById(`prqty-${id}`);
  if (qtyWrap) qtyWrap.classList.remove('pr-qty--disabled');
  if (row.qty === 0) {
    row.qty = 1;
    const inp = document.getElementById(`qval-${id}`);
    if (inp) { inp.value = '1'; inp.min = '1'; }
  }

  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar        === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento  === 'function') window.actualizarDescuento();
};

/* ─── limpiar producto de una fila (qty → 0 con producto seleccionado) ── */
function _clearRowProduct(id) {
  const row = _flatRows.find(r => r.id === id);
  if (!row) return;
  row.productName  = null;
  row.qty = 0;
  const inp = document.getElementById(`qval-${id}`);
  if (inp) { inp.value = '0'; inp.min = '0'; }
  const qtyWrap = document.getElementById(`prqty-${id}`);
  if (qtyWrap) qtyWrap.classList.add('pr-qty--disabled');
  const sel = document.querySelector(`#orow-${id} .flat-product-select`);
  if (sel) sel.value = '';
  _clearRowDisplay(id);
  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar       === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento === 'function') window.actualizarDescuento();
}

/* ═══════════════════════════════════════════════════════════════
   Cantidad +/−
═══════════════════════════════════════════════════════════════ */
window.flatRowIncQty = function flatRowIncQty(id) {
  const row = _flatRows.find(r => r.id === id);
  if (!row) return;
  row.qty++;
  const inp = document.getElementById(`qval-${id}`);
  if (inp) inp.value = row.qty;
  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar        === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento  === 'function') window.actualizarDescuento();
};

window.flatRowDecQty = function flatRowDecQty(id) {
  const row = _flatRows.find(r => r.id === id);
  if (!row) return;
  if (row.productName && row.qty <= 1) { _clearRowProduct(id); return; }
  if (row.qty <= 0) return;
  row.qty--;
  const inp = document.getElementById(`qval-${id}`);
  if (inp) inp.value = row.qty;
  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar        === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento  === 'function') window.actualizarDescuento();
};

/* ═══════════════════════════════════════════════════════════════
   flatRowSetQty — escritura directa desde el input de teclado
═══════════════════════════════════════════════════════════════ */
window.flatRowSetQty = function flatRowSetQty(id, inputEl) {
  const row = _flatRows.find(r => r.id === id);
  if (!row) return;
  const v = parseInt(inputEl.value);
  if (isNaN(v)) return;
  if (row.productName && v === 0) { _clearRowProduct(id); return; }
  const minQty = row.productName ? 1 : 0;
  row.qty = v >= minQty ? v : minQty;
  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar       === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento === 'function') window.actualizarDescuento();
};

/* Al perder el foco: si quedó en 0 con producto, limpia el producto */
window.flatRowQtyBlur = function flatRowQtyBlur(id, inputEl) {
  const row = _flatRows.find(r => r.id === id);
  if (!row) return;
  const v = parseInt(inputEl.value);
  if (row.productName && (!isNaN(v) && v === 0)) { _clearRowProduct(id); return; }
  const minQty = row.productName ? 1 : 0;
  row.qty = (!isNaN(v) && v >= minQty) ? v : minQty;
  inputEl.value = row.qty;
  flatRefreshPrices();
  _syncAllToOriginal();
  if (typeof window.updateSidebar       === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento === 'function') window.actualizarDescuento();
};

/* Teclas ↑/↓ sobre el input de cantidad */
window.flatRowQtyKey = function flatRowQtyKey(e, id) {
  if (e.key === 'ArrowUp')   { e.preventDefault(); flatRowIncQty(id); }
  if (e.key === 'ArrowDown') { e.preventDefault(); flatRowDecQty(id); }
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
  const provBadge = document.getElementById(`provbadge-${id}`);
  if (provBadge) { provBadge.innerHTML = ''; provBadge.className = 'pr-prov-badge'; }
  const partBadge = document.getElementById(`partnumbadge-${id}`);
  if (partBadge) { partBadge.textContent = ''; partBadge.className = 'pr-partnum-val'; }
  ['plista','pusd','pdto','psub'].forEach(pfx => {
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

  /* 1. Total unidades SOLO hardware para calcular % descuento (excluye servicio-tic y accesorios) */
  let totalQty = 0;
  _flatRows.forEach(r => {
    if (!r.productName) return;
    const prod = (window.CATALOGO || []).find(p => p.name === r.productName);
    if (prod && prod.tipo !== 'servicio-tic' && prod.tipo !== 'accesorios') totalQty += r.qty;
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

    // Servicios TIC y accesorios: sin descuento por volumen
    const esSvc        = producto.tipo === 'servicio-tic' || producto.tipo === 'accesorios';
    const pctEfectivo  = esSvc ? 0 : pct;

    // Precio CLP dinámico: si el producto tiene priceUSD → priceUSD × tipoCambio
    // De lo contrario usa price CLP fijo (servicios, licencias)
    const price = (producto.priceUSD && producto.priceUSD > 0)
      ? Math.round(producto.priceUSD * tc)
      : (producto.price || 0);

    const precioConDto  = Math.round(price * (1 - pctEfectivo / 100));
    const subtotal      = qty * precioConDto;
    const subtotalLista = qty * price;
    const ahorro        = subtotalLista - subtotal;

    totalListaAcum  += subtotalLista;
    totalAhorroAcum += ahorro;

    /* Precios para display (con IVA 19%) */
    const priceDisp        = Math.round(price * 1.19);
    const precioConDtoDisp = Math.round(precioConDto * 1.19);
    const subtotalDisp     = qty * precioConDtoDisp;
    const ahorroDisp       = Math.round(ahorro * 1.19);

    /* Precio lista (tachado si hay dto y qty > 0) */
    const elBase = document.getElementById(`plista-${id}`);
    if (elBase) {
      elBase.textContent = `$${flatFmt(priceDisp)}`;
      elBase.classList.toggle('tachado', pctEfectivo > 0 && qty > 0);
    }

    /* Ocultar siempre el campo USD — ya no se muestra */
    const elUsd = document.getElementById(`pusd-${id}`);
    if (elUsd) elUsd.textContent = '';

    /* Precio con dto */
    const elDto   = document.getElementById(`pdto-${id}`);
    const elBadge = document.getElementById(`dtobadge-${id}`);
    if (elDto) {
      elDto.textContent = qty > 0 ? `$${flatFmt(precioConDtoDisp)}` : '—';
      if (pctEfectivo > 0 && qty > 0) {
        elDto.classList.remove('sin-dto');
        if (elBadge) { elBadge.textContent = `-${pctEfectivo}%`; elBadge.classList.remove('oculto'); }
      } else {
        elDto.classList.add('sin-dto');
        if (elBadge) elBadge.classList.add('oculto');
      }
    }

    /* Ahorro por línea */
    const elAhorro = document.getElementById(`pahorro-${id}`);
    if (elAhorro) {
      if (qty > 0 && ahorro > 0) {
        elAhorro.textContent = `$${flatFmt(ahorroDisp)}`;
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

  /* Alerta de volumen inline */
  _checkVolumeAlerts();
};

/* Alias para compatibilidad */
window.refreshTablePrices = window.flatRefreshPrices;

/* ═══════════════════════════════════════════════════════════════
   _checkVolumeAlerts
   · Banner inline si totalQty >= 50 (alerta 1)
   · Se llama desde flatRefreshPrices
═══════════════════════════════════════════════════════════════ */
/* ── Flags de alertas descartadas (en memoria, duran la sesión) ── */
const _igaAlertDismissed = { volume: false, brand: false };

function _checkVolumeAlerts() {
  const totalQty = _flatRows.filter(r => r.productName && r.qty > 0)
    .reduce((s, r) => s + r.qty, 0);

  /* Al quedar sin productos: reiniciar AMBAS alertas */
  if (totalQty === 0) {
    _igaAlertDismissed.volume = false;
    _igaAlertDismissed.brand = false;
    return;
  }

  /* Alerta de volumen — se dispara automáticamente al llegar a 50 unidades */
  if (!_igaAlertDismissed.volume && totalQty >= 50) {
    _igaAlertDismissed.volume = true;
    igaOpenVolumeModal();
  }
}

/* ═══════════════════════════════════════════════════════════════
   _calcBrandStats — calcula qty total y marca dominante
═══════════════════════════════════════════════════════════════ */
function _calcBrandStats() {
  const totalQty = _flatRows.filter(r => r.productName && r.qty > 0)
    .reduce((s, r) => s + r.qty, 0);

  const byBrand = {};
  _flatRows.forEach(r => {
    if (!r.productName || r.qty <= 0) return;
    const prod = (window.CATALOGO || []).find(p => p.name === r.productName);
    if (!prod) return;
    const marca = (prod.marca || 'Otros').toUpperCase();
    byBrand[marca] = (byBrand[marca] || 0) + r.qty;
  });

  let topBrand = null, topQty = 0;
  Object.entries(byBrand).forEach(([m, q]) => { if (q > topQty) { topBrand = m; topQty = q; } });

  const topPct = totalQty > 0 ? Math.round((topQty / totalQty) * 100) : 0;
  return { totalQty, topBrand, topQty, topPct };
}

/* ═══════════════════════════════════════════════════════════════
   igaOpenVolumeModal — Modal al avanzar con >50 uds
   Decide qué variante mostrar: alto volumen general vs marca dominante
═══════════════════════════════════════════════════════════════ */
window.igaOpenVolumeModal = function igaOpenVolumeModal(forceBrand) {
  const stats = _calcBrandStats();
  const tc = (window.state && window.state.tipoCambio) || window._tipoCambio || 950;
  const totalEstimado = _flatRows.filter(r => r.productName && r.qty > 0).reduce((s, r) => {
    const prod = (window.CATALOGO || []).find(p => p.name === r.productName);
    if (!prod) return s;
    const price = (prod.priceUSD && prod.priceUSD > 0)
      ? Math.round(prod.priceUSD * tc)
      : (prod.price || 0);
    return s + price * r.qty;
  }, 0);

  let existing = document.getElementById('iga-modal-overlay');
  if (existing) existing.remove();

  // forceBrand=true → variante marca (desde "Siguiente"), false/undefined → variante volumen
  const showBrandVariant = forceBrand === true && stats.totalQty >= 10 && stats.topPct >= 50 && stats.topBrand;

  const overlay = document.createElement('div');
  overlay.id = 'iga-modal-overlay';
  overlay.className = 'iga-modal-overlay';
  /* Sin cierre al hacer click fuera — el cliente debe elegir una opción */

  if (showBrandVariant) {
    overlay.innerHTML = `
      <div class="iga-modal iga-modal--brand" role="dialog" aria-modal="true">
        <div class="iga-modal-header iga-modal-header--brand">
          <div class="iga-modal-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="iga-modal-header-text">
            <strong>El ${stats.topPct}% de su pedido es ${stats.topBrand}</strong>
            <span>Podemos gestionar mejores condiciones directamente con la marca</span>
          </div>
        </div>
        <div class="iga-brand-body">
          <div class="iga-brand-highlight">
            <div class="iga-brand-pill">${stats.topBrand}</div>
            <div class="iga-brand-pct">${stats.topPct}<span>%</span></div>
            <div class="iga-brand-pct-label">del pedido — ${stats.topQty} unidades</div>
          </div>
          <p class="iga-brand-desc">Nuestro equipo puede gestionar <strong>descuentos de canal y condiciones especiales</strong> directamente con ${stats.topBrand} para su proyecto.</p>
          <div class="iga-vol-actions">
            <a class="iga-modal-primary" href="https://outlook.office.com/book/InfraGo@ticmanagers.cl/" target="_blank" onclick="igaCloseVolumeModal()" style="text-decoration:none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Contactar ejecutivo
            </a>
            <button class="iga-modal-secondary" onclick="igaCloseVolumeModal(); igaResumeQuote()">
              Continuar sin asistencia
            </button>
          </div>
        </div>
      </div>
    `;
  } else {
    const totalFmt = totalEstimado > 0 ? '$' + Math.round(totalEstimado).toLocaleString('es-CL') : '—';
    overlay.innerHTML = `
      <div class="iga-modal iga-modal--vol" role="dialog" aria-modal="true">
        <div class="iga-modal-header iga-modal-header--volume">
          <div class="iga-modal-header-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
            </svg>
          </div>
          <div class="iga-modal-header-text">
            <strong>Su pedido supera las 50 unidades</strong>
            <span>Podemos mejorar sus condiciones directamente con las marcas</span>
          </div>
        </div>
        <div class="iga-vol-body">
          <div class="iga-vol-hero">
            <div class="iga-vol-hero-icon">
              <svg viewBox="0 0 48 48" fill="none" width="48" height="48">
                <rect x="4" y="20" width="40" height="24" rx="4" fill="#e8f0fe" stroke="#1a4fa0" stroke-width="2"/>
                <path d="M4 28h40" stroke="#1a4fa0" stroke-width="1.5" stroke-dasharray="4 3"/>
                <rect x="12" y="10" width="24" height="14" rx="3" fill="#c7d9fc" stroke="#1a4fa0" stroke-width="2"/>
                <rect x="18" y="4" width="12" height="10" rx="2" fill="#1a4fa0"/>
                <path d="M21 8h6" stroke="#fff" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div class="iga-vol-hero-number">${stats.totalQty}</div>
            <div class="iga-vol-hero-label">unidades en su pedido</div>
          </div>
          <div class="iga-vol-stats">
            <div class="iga-vol-stat">
              <span class="iga-vol-stat-val iga-vol-stat-val--blue">${totalFmt}</span>
              <span class="iga-vol-stat-key">Total estimado</span>
            </div>
            <div class="iga-vol-stat-divider"></div>
            <div class="iga-vol-stat">
              <span class="iga-vol-stat-val iga-vol-stat-val--orange">&gt;5%</span>
              <span class="iga-vol-stat-key">Descuento potencial</span>
            </div>
          </div>
          <p class="iga-vol-desc">Para pedidos de este volumen gestionamos <strong>descuentos directos con las marcas</strong> y financiamiento corporativo a medida.</p>
          <div class="iga-vol-actions">
            <a class="iga-modal-primary" href="https://outlook.office.com/book/InfraGo@ticmanagers.cl/" target="_blank" onclick="igaCloseVolumeModal()" style="text-decoration:none;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              Contactar ejecutivo
            </a>
            <button class="iga-modal-secondary" onclick="igaCloseVolumeModal()">Salir</button>
          </div>
        </div>
      </div>
    `;
  }

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('iga-modal--visible'));
  document.body.style.overflow = 'hidden';
};

window.igaCloseVolumeModal = function() {
  const overlay = document.getElementById('iga-modal-overlay');
  if (!overlay) return;
  overlay.classList.remove('iga-modal--visible');
  setTimeout(() => { overlay.remove(); document.body.style.overflow = ''; }, 280);
};

/* igaResumeQuote — descarta la alerta de marca y avanza al paso 2 */
window.igaResumeQuote = function() {
  /* Marcar alerta de marca como descartada para siempre en esta sesión */
  _igaAlertDismissed.brand = true;

  const _origValidate = window.validateStep;
  window.validateStep = function(step) {
    if (step === 1) return true; // ya validamos antes de abrir el modal
    return _origValidate ? _origValidate(step) : true;
  };
  if (typeof window.nextStep === 'function') window.nextStep();
  setTimeout(function() { window.validateStep = _origValidate; }, 0);
};

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

    // Descuento solo sobre hardware (excluye servicio-tic)
    const totalQtyHw = _flatRows.filter(x => x.productName && x.qty > 0).reduce((s, x) => {
      const prod = (window.CATALOGO || []).find(p => p.name === x.productName);
      return prod && prod.tipo !== 'servicio-tic' ? s + x.qty : s;
    }, 0);
    const pct = flatObtenerPct(totalQtyHw);

    _flatRows.forEach(r => {
      if (!r.productName || r.qty <= 0) return;
      const producto = (window.CATALOGO || []).find(p => p.name === r.productName);
      if (!producto) return;
      if (producto.tipo === 'servicio-tic') return; // va a state.servicios vía collectServicios()

      const tc = window.tipoCambio || 900;
      const basePrice = (producto.priceUSD && producto.priceUSD > 0)
        ? Math.round(producto.priceUSD * tc)
        : (producto.price || 0);
      const price = Math.round(basePrice * (1 - pct / 100));
      const key   = r.productName;

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

      /* Alerta de marca dominante al presionar Siguiente (desde 10 uds, si no fue descartada) */
      if (!_igaAlertDismissed.brand) {
        const stats = _calcBrandStats();
        if (stats.totalQty >= 10 && stats.topPct >= 50 && stats.topBrand) {
          _igaAlertDismissed.brand = true;
          window.igaOpenVolumeModal(true);
          return false; // el modal ofrece "Continuar sin asistencia" → igaResumeQuote
        }
      }

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
    const cat = _getActiveCat();
    const tipoMap = {
      'pc':'PC','notebook':'Notebook','servidor':'Server & Storage',
      'impresora':'Impresoras','networking':'Networking',
      'storage':'Licencias & Atach','servicio-tic':'Servicios TIC',
      'accesorios':'Accesorios'
    };

    /* Mostrar / ocultar botón de limpiar */
    const btnClear = document.getElementById('btnClearSearch');
    if (btnClear) btnClear.style.display = q ? '' : 'none';

    /* Filtrar opciones en cada fila: por categoría activa Y por búsqueda de texto */
    document.querySelectorAll('.flat-product-select').forEach(sel => {
      sel.querySelectorAll('optgroup').forEach(group => {
        const catMatch = cat === 'todos' || group.label === (tipoMap[cat] || cat);
        let groupVisible = 0;
        group.querySelectorAll('option').forEach(opt => {
          const name = opt.textContent.toLowerCase();
          const show = catMatch && (!q || name.includes(q));
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
    /* ── Cabecera de columnas ── */
    .flat-col-headers {
      display: grid;
      grid-template-columns: 40px 72px minmax(180px,240px) 60px 110px 100px 90px 100px;
      align-items: center;
      justify-content: space-between;
      padding: 10px 20px;
      background: #f8f9fb;
      border-bottom: 2px solid #dde1e8;
      gap: 8px;
    }
    .flat-col-label {
      font-size: 10px; font-weight: 800;
      text-transform: uppercase; letter-spacing: .6px;
      color: #7a8fa6;
    }
    .flat-col-label.center { text-align: center; }
    .flat-col-label.right  { text-align: right;  }

    /* ── Fila del pedido ── */
    .flat-order-row {
      position: relative;
      display: grid;
      grid-template-columns: 40px 72px minmax(180px,240px) 60px 110px 100px 90px 100px;
      align-items: center;
      justify-content: space-between;
      padding: 14px 44px 14px 20px;
      border-bottom: 1px solid #eaecf0;
      transition: background 0.15s, opacity 0.2s, transform 0.2s;
      gap: 8px;
    }
    .flat-order-row:last-of-type { border-bottom: none; }
    .flat-order-row:hover { background: rgba(255,122,0,.03); }
    .flat-order-row.row-entering { opacity: 0; transform: translateY(-6px); }
    .flat-order-row.row-leaving  { opacity: 0; transform: translateX(10px); }

    /* Número de fila */
    .pr-num {
      font-size: 11px; font-weight: 700;
      color: #b0bcc9; text-align: center;
    }

    /* Select producto */
    .pr-info--select { display: flex; flex-direction: column; gap: 4px; justify-content: center; padding-right: 8px; }
    .flat-select-wrap { position: relative; }
    .flat-product-select {
      width: 100%;
      background: #f4f5f7;
      border: 1px solid #dde1e8;
      border-radius: 6px;
      padding: 5px 26px 5px 9px;
      color: #0d1e36;
      font-size: 12px; font-weight: 500;
      font-family: inherit;
      cursor: pointer;
      appearance: none; -webkit-appearance: none;
      transition: border-color .18s, box-shadow .18s;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 7px center;
    }
    .flat-product-select:focus {
      outline: none;
      border-color: #FF7A00;
      box-shadow: 0 0 0 3px rgba(255,122,0,.12);
      background-color: #fff;
    }

    /* Badge PROV */
    .pr-prov { display: flex; align-items: center; justify-content: center; }
    .pr-prov-badge {
      font-size: 10px; font-weight: 800;
      letter-spacing: .3px;
      padding: 2px 6px; border-radius: 4px;
      border: 1px solid #dde1e8;
      background: #f4f5f7;
      color: #3d5068;
      white-space: nowrap;
      max-width: 100%; overflow: hidden; text-overflow: ellipsis;
    }
    .pr-prov-badge--hp          { border-color:#0096d6; color:#0096d6; background:rgba(0,150,214,.07); }
    .pr-prov-badge--dell        { border-color:#0076ce; color:#0076ce; background:rgba(0,118,206,.07); }
    .pr-prov-badge--lenovo      { border-color:#e2001a; color:#e2001a; background:rgba(226,0,26,.06); }
    .pr-prov-badge--apple       { border-color:#555; color:#444; background:rgba(0,0,0,.05); }
    .pr-prov-badge--brother     { border-color:#003087; color:#003087; background:rgba(0,48,135,.06); }
    .pr-prov-badge--cisco       { border-color:#049fd9; color:#049fd9; background:rgba(4,159,217,.07); }
    .pr-prov-badge--fortinet    { border-color:#d32f2f; color:#d32f2f; background:rgba(211,47,47,.06); }
    .pr-prov-badge--ubiquiti    { border-color:#0559c9; color:#0559c9; background:rgba(5,89,201,.07); }
    .pr-prov-badge--synology    { border-color:#b5202f; color:#b5202f; background:rgba(181,32,47,.06); }
    .pr-prov-badge--qnap        { border-color:#009641; color:#009641; background:rgba(0,150,65,.07); }
    .pr-prov-badge--canon       { border-color:#cc0000; color:#cc0000; background:rgba(204,0,0,.06); }
    .pr-prov-badge--tic-managers{ border-color:#FF7A00; color:#FF7A00; background:rgba(255,122,0,.09); }
    .pr-prov-badge--logitech    { border-color:#00b0f0; color:#0080c0; background:rgba(0,128,192,.07); }

    /* Logo SVG de marca — contenedor unificado sin borde ni fondo propio */
    .pr-prov-badge--logo {
      background: transparent;
      border: none;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .pr-prov-logo {
      display: block;
      width: 64px;
      height: 30px;
      object-fit: contain;
    }

    /* Badge Cat */
    .pr-cat { display: flex; align-items: center; justify-content: center; }
    .pr-cat-badge {
      font-size: 9px; font-weight: 800; letter-spacing: .4px;
      padding: 2px 6px; border-radius: 4px;
      background: #eaecf0; color: #7a8fa6;
      border: 1px solid #dde1e8;
      white-space: nowrap;
    }
    .pr-cat-badge--pc          { background:rgba(100,116,139,.1); color:#475569; border-color:rgba(100,116,139,.3);}
    .pr-cat-badge--notebook    { background:rgba(59,130,246,.1);  color:#2563eb; border-color:rgba(59,130,246,.3);  }
    .pr-cat-badge--servidor    { background:rgba(139,92,246,.1);  color:#7c3aed; border-color:rgba(139,92,246,.3);  }
    .pr-cat-badge--impresora   { background:rgba(16,185,129,.1);  color:#059669; border-color:rgba(16,185,129,.3);  }
    .pr-cat-badge--networking  { background:rgba(245,158,11,.1);  color:#d97706; border-color:rgba(245,158,11,.3);  }
    .pr-cat-badge--storage     { background:rgba(236,72,153,.1);  color:#db2777; border-color:rgba(236,72,153,.3);  }
    .pr-cat-badge--servicio-tic{ background:rgba(255,122,0,.12); color:#b45309; border-color:rgba(255,122,0,.35); }
    .pr-cat-badge--accesorios  { background:rgba(20,184,166,.1);  color:#0d9488; border-color:rgba(20,184,166,.3);  }

    /* Part Number */
    .pr-partnum { display: flex; align-items: center; justify-content: center; }
    .pr-partnum-val {
      font-size: 10px; font-weight: 600;
      color: #b0bcc9;
      white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      max-width: 115px;
    }
    .pr-partnum-val.has-part {
      background: #f0f2f5;
      border: 1px solid #dde1e8;
      border-radius: 4px;
      padding: 2px 6px;
      color: #3d5068;
    }

    /* Precio lista */
    .pr-precio-lista { display: flex; flex-direction: column; align-items: flex-end; gap: 1px; }
    .precio-base {
      font-size: 12px; font-weight: 700;
      color: #0d1e36;
    }
    .precio-base.tachado {
      text-decoration: line-through;
      color: #b0bcc9;
      font-weight: 400;
    }
    .precio-usd {
      font-size: 10px; color: #7a8fa6;
    }

    /* Cantidad — spinner vertical */
    .pr-qty { display: flex; align-items: center; justify-content: center; }
    .pr-qty--disabled { opacity: .3; pointer-events: none; user-select: none; }
    .qty-spinner-wrap {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #f4f5f7;
      border: 1px solid #dde1e8;
      border-radius: 7px;
      padding: 3px 6px;
    }
    .qty-value {
      font-family: 'Montserrat', sans-serif;
      font-size: 15px; font-weight: 800;
      color: #0d1e36;
      width: 36px;
      text-align: center;
      line-height: 1;
      border: none;
      background: transparent;
      outline: none;
      padding: 0;
      -moz-appearance: textfield;
    }
    .qty-value::-webkit-outer-spin-button,
    .qty-value::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
    .qty-value:focus { color: #FF7A00; }
    .qty-arrows {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }
    .qty-arrows button {
      background: none;
      border: none;
      padding: 0 2px;
      font-size: 9px;
      color: #7a8fa6;
      cursor: pointer;
      line-height: 1;
      transition: color .15s;
      display: block;
    }
    .qty-arrows button:hover { color: #FF7A00; }

    /* Precio con descuento */
    .pr-precio-dto { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .precio-dto-val {
      font-size: 13px; font-weight: 800;
      color: #FF7A00;
    }
    .precio-dto-val.sin-dto { color: #0d1e36; font-weight: 700; }
    .dto-badge {
      font-size: 9px; font-weight: 800;
      background: rgba(34,197,94,.12);
      color: #16a34a;
      border: 1px solid rgba(34,197,94,.3);
      border-radius: 10px;
      padding: 1px 6px;
    }
    .dto-badge.oculto { display: none; }

    /* Botón eliminar — columna propia */
    .pr-del {
      position: absolute;
      right: 6px;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }



    /* Botón agregar + zona eliminar */
    .flat-add-row {
      padding: 10px 16px;
      border-top: 1px dashed #dde1e8;
      background: #f8f9fb;
      border-radius: 0 0 12px 12px;
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    }
    #btnAddFlatRow {
      display: inline-flex; align-items: center; gap: 7px;
      background: rgba(255,122,0,.10);
      border: 1px solid rgba(255,122,0,.3);
      border-radius: 7px;
      padding: 7px 16px;
      color: #FF7A00;
      font-size: 12px; font-weight: 700;
      cursor: pointer; transition: all .18s;
    }
    #btnAddFlatRow:hover { background: rgba(255,122,0,.18); border-color: #FF7A00; }
    #btnAddFlatRow svg { width: 13px; height: 13px; }

    /* Buscador */
    .filtros-bar--simple { display: flex; align-items: center; padding: 10px 0 20px; gap: 10px; }
    .filtros-search--full {
      flex: 1; display: flex; align-items: center; gap: 10px;
      background: #f4f5f7; border: 1px solid #dde1e8;
      border-radius: 8px; padding: 0 14px;
      transition: border-color .18s, box-shadow .18s;
    }
    .filtros-search--full:focus-within { border-color: #FF7A00; box-shadow: 0 0 0 3px rgba(255,122,0,.12); }
    .filtros-search--full svg { width: 15px; height: 15px; color: #b0bcc9; flex-shrink: 0; }
    .filtros-search--full input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #0d1e36; font-size: 13px; font-family: inherit; padding: 10px 0;
    }
    .filtros-search--full input::placeholder { color: #b0bcc9; }
    .search-clear {
      background: none; border: none; padding: 3px; cursor: pointer;
      color: #b0bcc9; border-radius: 4px; display: flex; align-items: center;
      transition: color .15s, background .15s; flex-shrink: 0;
    }
    .search-clear:hover { color: #0d1e36; background: rgba(0,0,0,.05); }
    .search-clear svg { width: 12px; height: 12px; }

    /* Responsive */
    @media (max-width: 1400px) {
      .flat-col-headers,
      .flat-order-row { grid-template-columns: 36px 68px minmax(160px,240px) 56px 120px 100px 90px 84px; gap: 12px; }
    }
    @media (max-width: 1100px) {
      .flat-col-headers,
      .flat-order-row { grid-template-columns: 32px 60px minmax(140px,200px) 52px 82px 78px 82px 80px; gap: 4px; }
      .pr-prov-logo { width: 56px; height: 26px; }
    }

    /* ── Tablet / mobile: ocultar Marca, Cat, N°Parte y P.Dto ── */
    @media (max-width: 760px) {
      .flat-col-headers,
      .flat-order-row { grid-template-columns: 22px 1fr 84px 62px; gap: 4px; }

      /* Ocultar celdas de fila */
      .pr-prov, .pr-cat, .pr-partnum, .pr-precio-dto { display: none; }

      /* Ocultar cabeceras correspondientes: Marca(2) Cat(4) N°Parte(5) P.Dto(8) */
      .flat-col-headers span:nth-child(2),
      .flat-col-headers span:nth-child(4),
      .flat-col-headers span:nth-child(5),
      .flat-col-headers span:nth-child(8) { display: none; }

      .flat-col-headers { padding: 10px 12px; }
      .flat-order-row { padding: 10px 12px; }
      .precio-base { font-size: 13px; }
      .pr-precio-lista { align-items: flex-end; }
    }

    /* ── Móvil pequeño ── */
    @media (max-width: 520px) {
      .flat-col-headers,
      .flat-order-row { grid-template-columns: 18px 1fr 78px 56px; gap: 3px; }

      .flat-col-headers { padding: 8px 10px; }
      .flat-order-row { padding: 8px 10px; }
      .flat-product-select { font-size: 11px; padding: 4px 22px 4px 7px; }
      .precio-base { font-size: 12px; }
      .qty-value { font-size: 13px; width: 28px; }
      .qty-spinner-wrap { padding: 2px 4px; gap: 2px; }

      #btnAddFlatRow { justify-content: center; }
    }

    /* ══════════════════════════════════════════════════════
       MODAL DE ALTO VOLUMEN
    ══════════════════════════════════════════════════════ */
    .iga-modal-overlay {
      position: fixed; inset: 0;
      background: rgba(4,15,35,.65);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      opacity: 0; transition: opacity .28s ease;
    }
    .iga-modal-overlay.iga-modal--visible { opacity: 1; }
    .iga-modal {
      background: #fff;
      border-radius: 14px;
      width: 100%; max-width: 660px;
      overflow: hidden;
      box-shadow: 0 24px 80px rgba(4,15,35,.35);
      transform: translateY(16px) scale(.98);
      transition: transform .3s cubic-bezier(.22,.8,.4,1);
    }
    .iga-modal-overlay.iga-modal--visible .iga-modal {
      transform: translateY(0) scale(1);
    }
    @media (max-width: 600px) {
      .iga-modal { transform: translateY(100%); transition: transform .35s cubic-bezier(.22,.8,.4,1); }
      .iga-modal-overlay.iga-modal--visible .iga-modal { transform: translateY(0); }
    }
    .iga-modal-header {
      display: flex; align-items: center; gap: 12px;
      padding: 14px 18px;
      color: #fff;
    }
    .iga-modal-header--volume { background: linear-gradient(135deg, #0d2e6b 0%, #1a4fa0 100%); }
    .iga-modal-header--brand  { background: linear-gradient(135deg, #0e5a8a 0%, #1b82c4 100%); }
    .iga-modal-header-icon {
      width: 38px; height: 38px; flex-shrink: 0;
      background: rgba(255,255,255,.15);
      border-radius: 9px;
      display: flex; align-items: center; justify-content: center;
    }
    .iga-modal-header-icon svg { width: 18px; height: 18px; }
    .iga-modal-header-text { flex: 1; }
    .iga-modal-header-text strong { display: block; font-size: 15px; font-weight: 800; }
    .iga-modal-header-text span   { font-size: 12px; opacity: .8; }
    .iga-modal-close {
      background: rgba(255,255,255,.12); border: none;
      border-radius: 7px; width: 30px; height: 30px;
      display: flex; align-items: center; justify-content: center;
      color: rgba(255,255,255,.8); cursor: pointer;
      transition: background .15s;
    }
    .iga-modal-close:hover { background: rgba(255,255,255,.25); color: #fff; }
    .iga-modal-close svg { width: 15px; height: 15px; }

    .iga-modal-body {
      display: flex; gap: 0;
    }
    .iga-modal-persona {
      width: 160px; flex-shrink: 0;
      background: linear-gradient(180deg, #f0f4ff 0%, #e6ecf8 100%);
      border-right: 1px solid #dde6f5;
      padding: 24px 16px;
      display: flex; flex-direction: column; align-items: center; gap: 10px;
    }
    .iga-modal-avatar {
      width: 72px; height: 72px;
      border-radius: 50%;
      border: 3px solid #fff;
      box-shadow: 0 4px 16px rgba(26,79,160,.25);
      overflow: hidden;
      display: flex; align-items: center; justify-content: center;
    }
    .iga-modal-persona-info { text-align: center; }
    .iga-modal-persona-info strong { display: block; font-size: 13px; font-weight: 800; color: #0d1e36; }
    .iga-modal-persona-info span   { font-size: 11px; color: #5a7294; line-height: 1.4; }
    .iga-modal-wsp {
      display: inline-flex; align-items: center; gap: 5px;
      background: #25d366; border: none; border-radius: 6px;
      padding: 6px 12px; color: #fff;
      font-size: 11px; font-weight: 700; cursor: pointer;
      transition: background .18s;
    }
    .iga-modal-wsp:hover { background: #1da851; }
    .iga-modal-polyvideo {
      display: inline-flex; align-items: center; gap: 5px;
      background: #1a4fa0; border: none; border-radius: 6px;
      padding: 6px 12px; color: #fff;
      font-size: 11px; font-weight: 700; cursor: pointer;
      transition: background .18s;
    }
    .iga-modal-polyvideo:hover { background: #0d3578; }

    .iga-modal-content {
      flex: 1; padding: 24px 24px 20px;
      display: flex; flex-direction: column; gap: 12px;
    }
    .iga-modal-content h3 { font-size: 16px; font-weight: 800; color: #0d1e36; margin: 0; }
    .iga-modal-content p  { font-size: 13px; color: #4a6080; line-height: 1.55; margin: 0; }

    .iga-modal-stats {
      display: flex; gap: 10px;
    }
    .iga-modal-stat {
      flex: 1;
      background: #f4f7fd;
      border: 1px solid #dde6f5;
      border-radius: 9px;
      padding: 10px 12px;
      text-align: center;
    }
    .iga-modal-stat--blue { background: #eef4ff; border-color: #c4d7ff; }
    .iga-modal-stat--orange { background: #fff8ee; border-color: #ffd9a0; }
    .iga-modal-stat-val {
      display: block;
      font-family: 'Montserrat', sans-serif;
      font-size: 20px; font-weight: 800;
      color: #1a4fa0; line-height: 1;
    }
    .iga-modal-stat--orange .iga-modal-stat-val { color: #FF7A00; }
    .iga-modal-stat-label {
      display: block; font-size: 10px; font-weight: 700;
      text-transform: uppercase; letter-spacing: .5px;
      color: #7a8fa6; margin-top: 3px;
    }

    .iga-modal-primary {
      display: flex; align-items: center; justify-content: center; gap: 8px;
      background: #FF7A00; border: none; border-radius: 8px;
      padding: 11px 20px; color: #fff;
      font-size: 13px; font-weight: 800; cursor: pointer;
      transition: background .18s;
      width: 100%;
    }
    .iga-modal-primary:hover { background: #cf7e08; }
    .iga-modal-secondary {
      display: block; width: 100%;
      background: transparent;
      border: 1.5px solid #dde1e8;
      border-radius: 8px; padding: 9px 20px;
      color: #4a6080; font-size: 12px; font-weight: 600;
      cursor: pointer; transition: border-color .18s, color .18s;
    }
    .iga-modal-secondary:hover { border-color: #aab8cc; color: #0d1e36; }
    .iga-modal-footer-note {
      font-size: 11px; color: #aab8cc; text-align: center; margin: 0;
    }

    /* ── MODAL MARCA — layout propio ── */
    .iga-modal--brand { max-width: 380px; }
    .iga-brand-body { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
    .iga-brand-highlight {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: linear-gradient(135deg, #0e5a8a 0%, #1b82c4 100%);
      border-radius: 10px; padding: 16px 16px 14px;
    }
    .iga-brand-pill {
      background: rgba(255,255,255,.18); color: #fff;
      font-family: 'Montserrat', sans-serif; font-size: 10px; font-weight: 800;
      letter-spacing: .06em; text-transform: uppercase;
      padding: 3px 10px; border-radius: 20px; border: 1px solid rgba(255,255,255,.3);
    }
    .iga-brand-pct {
      font-family: 'Montserrat', sans-serif; font-size: 38px; font-weight: 900;
      color: #fff; line-height: 1; margin-top: 4px;
    }
    .iga-brand-pct span { font-size: 22px; vertical-align: super; }
    .iga-brand-pct-label { font-size: 11px; color: rgba(255,255,255,.75); font-weight: 600; }
    .iga-brand-desc { font-size: 12px; color: #4a6080; line-height: 1.55; margin: 0; text-align: center; }

    /* ── MODAL VOLUMEN — layout propio ── */
    .iga-modal--vol { max-width: 380px; }
    .iga-vol-body { padding: 18px 20px 20px; display: flex; flex-direction: column; gap: 14px; }
    .iga-vol-hero {
      display: flex; flex-direction: column; align-items: center; gap: 4px;
      background: linear-gradient(135deg, #f0f5ff 0%, #e6eeff 100%);
      border: 1px solid #d0dcf8; border-radius: 10px;
      padding: 14px 16px 12px;
    }
    .iga-vol-hero-icon { margin-bottom: 2px; }
    .iga-vol-hero-icon svg { width: 36px; height: 36px; }
    .iga-vol-hero-number {
      font-family: 'Montserrat', sans-serif;
      font-size: 36px; font-weight: 900;
      color: #1a4fa0; line-height: 1;
    }
    .iga-vol-hero-label { font-size: 11px; font-weight: 600; color: #5a7294; text-transform: uppercase; letter-spacing: .04em; }
    .iga-vol-stats {
      display: flex; align-items: center; gap: 0;
      background: #f8faff; border: 1px solid #dde6f5; border-radius: 8px;
      overflow: hidden;
    }
    .iga-vol-stat { flex: 1; text-align: center; padding: 10px 8px; }
    .iga-vol-stat-divider { width: 1px; background: #dde6f5; align-self: stretch; }
    .iga-vol-stat-val { display: block; font-family: 'Montserrat', sans-serif; font-size: 15px; font-weight: 800; line-height: 1; }
    .iga-vol-stat-val--blue  { color: #1a4fa0; }
    .iga-vol-stat-val--orange { color: #FF7A00; }
    .iga-vol-stat-key { display: block; font-size: 9px; font-weight: 600; color: #7a8fa6; text-transform: uppercase; letter-spacing: .04em; margin-top: 3px; }
    .iga-vol-desc { font-size: 12px; color: #4a6080; line-height: 1.55; margin: 0; text-align: center; }
    .iga-vol-actions { display: flex; flex-direction: column; gap: 7px; }

    @media (max-width: 600px) {
      /* Overlay — ocupa toda la pantalla sin margen lateral */
      .iga-modal-overlay { padding: 0; align-items: flex-end; }
      /* Modal base — bottom sheet en mobile */
      .iga-modal {
        border-radius: 18px 18px 0 0;
        max-width: 100%;
        transform: translateY(100%);
      }
      .iga-modal-overlay.iga-modal--visible .iga-modal { transform: translateY(0); }
      /* Header */
      .iga-modal-header { padding: 14px 16px; gap: 10px; }
      .iga-modal-header-text strong { font-size: 13px; }
      .iga-modal-header-icon { width: 32px; height: 32px; }
      /* Modal volumen */
      .iga-modal--vol { max-width: 100%; }
      .iga-vol-body { padding: 20px 16px 28px; gap: 16px; }
      .iga-vol-hero { padding: 16px 12px 14px; }
      .iga-vol-hero-number { font-size: 40px; }
      .iga-vol-hero-icon svg { width: 36px; height: 36px; }
      .iga-vol-stat-val { font-size: 15px; }
      /* Modal marca */
      .iga-modal--brand { max-width: 100%; }
      .iga-brand-body { padding: 20px 16px 28px; gap: 16px; }
      .iga-brand-highlight { padding: 18px 12px 14px; }
      .iga-brand-pct { font-size: 40px; }
      .iga-brand-pct span { font-size: 24px; }
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