/* ═══════════════════════════════════════════════════════════════
   carrito.js — InfraGo
   ───────────────────────────────────────────────────────────────
   · Mini-dropdown en navbar al agregar producto (tienda + producto)
   · Página completa en carrito.html
   · Estado único en localStorage key 'igb_cart'
   · Requiere: carrito.css
═══════════════════════════════════════════════════════════════ */

(function () {

  var CART_KEY = 'igb_cart';
  var _items = [];

  /* ── Servicios opcionales — derivados de CATALOGO (catalogo.js) ── */
  var SERVICIOS_TIENDA = (function() {
    var fuente = window.CATALOGO || [];
    var tics = fuente.filter(function(p) {
      return p.tipo === 'servicio-tic'
        && p.marca === 'TIC Managers'
        && p.name.indexOf('Cibergestión') === -1
        && p.name.indexOf('Microsoft') === -1
        && p.name.indexOf('Bitdefender') === -1;
    });
    return tics.map(function(p) {
      var esMensual = p.name.toLowerCase().indexOf('mensual') !== -1
                   || p.name.toLowerCase().indexOf('seguro') !== -1;
      return {
        id:        p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        label:     p.name.replace('TIC Managers ', ''),
        desc:      p.desc || '',
        price:     p.price,
        unidad:    esMensual ? '/mes' : '',
        frecuencia: esMensual ? 'mensual' : 'pago único'
      };
    });
  })();

  /* ── Servicios logísticos (fijos) ── */
  var SERVICIOS_LOGISTICOS = [
    { id: 'log-instalacion',   label: 'Instalación en sitio',          desc: 'Técnico se desplaza e instala los equipos en su ubicación', price: 49990 },
    { id: 'log-rack',          label: 'Rack mounting y cableado',       desc: 'Montaje de equipos en rack y cableado estructurado',         price: 89990 },
    { id: 'log-config-red',    label: 'Configuración de red',           desc: 'Setup de red local, WiFi y conectividad de los equipos',     price: 69990 },
    { id: 'log-express',       label: 'Despacho express (24h)',         desc: 'Entrega garantizada al siguiente día hábil en Región Metropolitana', price: 9990 },
  ];

  /* ── Estado de servicios y método de pago ── */
  var _selectedSvc = {};   /* { id: true/false } */
  var _selectedLog = {};   /* { id: true/false } */
  var _metodo = 'transferencia';

  /* ── Estado de envío ── */
  var _shippingCost     = 0;
  var _shippingTimer    = null;
  var _shippingOpciones = [];
  var _shippingSelIdx   = -1;

  /* ── Persistencia ── */
  function _save() {
    try { localStorage.setItem(CART_KEY, JSON.stringify(_items)); } catch(e) {}
  }
  function _load() {
    try {
      /* Migrar key antigua */
      var old = localStorage.getItem('ig_cart');
      if (old && !localStorage.getItem(CART_KEY)) {
        localStorage.setItem(CART_KEY, old);
        localStorage.removeItem('ig_cart');
      }
      _items = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    } catch(e) { _items = []; }
  }

  function _totalQty()   { return _items.reduce(function(s,i){ return s+i.qty; }, 0); }
  function _subtotal()   { return _items.reduce(function(s,i){ return s+i.precio*i.qty; }, 0); }

  /* ── Descuentos por volumen (igual que configurador) ── */
  var DCTO_TRAMOS_TIENDA = [
    { min:10, max:19,   pct:1 },
    { min:20, max:29,   pct:2 },
    { min:30, max:39,   pct:3 },
    { min:40, max:49,   pct:4 },
    { min:50, max:9999, pct:5 },
  ];

  function _descuentoPct() {
    var qty = _totalQty();
    var t = DCTO_TRAMOS_TIENDA.find(function(t){ return qty >= t.min && qty <= t.max; });
    return t ? t.pct : 0;
  }

  function _subtotalConDescuento() {
    var pct = _descuentoPct();
    if (pct === 0) return _subtotal();
    return _items.reduce(function(s, i){
      return s + Math.round(i.precio * (1 - pct / 100)) * i.qty;
    }, 0);
  }

  function _updateDctoSidebarWidget() {
    var pct = _descuentoPct();
    var qty = _totalQty();
    var activo = document.getElementById('filtroDctoActivo');
    var pctEl  = document.getElementById('filtroDctoPct');
    if (activo) { activo.style.display = pct > 0 ? '' : 'none'; }
    if (pctEl)  pctEl.textContent = pct + '%';
    document.querySelectorAll('.filtro-dcto-row').forEach(function(row, i) {
      var tramo = DCTO_TRAMOS_TIENDA[i];
      row.classList.toggle('filtro-dcto-row--activo', !!(tramo && qty >= tramo.min && qty <= tramo.max));
    });
  }
  function _fmt(n)       { return '$' + (n||0).toLocaleString('es-CL'); }
  function _esc(str)     { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _defaultImg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="#b0bcc9" stroke-width="1.5" width="32" height="32"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'; }
  function _itemImg(item) {
    var src = item.img || ((window.CATALOGO || []).find(function(p){ return p.id === item.id; }) || {}).img || '';
    if (src) return '<img src="' + src + '" alt="' + _esc(item.nombre) + '" style="width:100%;height:100%;object-fit:contain;">';
    return item.svg || _defaultImg();
  }

  /* ════════════════════════════════════════════════════════════
     API PÚBLICA
  ════════════════════════════════════════════════════════════ */

  var _lastAddedId = null;

  /* Agregar item — abre dropdown del carro */
  window.igcAddItem = function(id, nombre, precio, svg) {
    _load();
    var ex = _items.find(function(i){ return i.id === id; });
    var catalogImg = ((window.CATALOGO || []).find(function(p){ return p.id === id; }) || {}).img || '';
    if (ex) { ex.qty++; if (!ex.img && catalogImg) ex.img = catalogImg; }
    else { _items.push({ id:id, nombre:nombre, precio:precio, qty:1, svg:svg||'', img:catalogImg }); }
    _lastAddedId = id;
    _save();
    _updateNavbarBadge();
    if (!document.getElementById('igcMiniDropdown')) _buildMiniDropdown();
    _openMini();
    _renderMini();
  };

  window.igcChangeQty = function(id, delta) {
    _load();
    var item = _items.find(function(i){ return i.id === id; });
    if (!item) return;
    item.qty = Math.max(0, item.qty + delta);
    if (item.qty === 0) _items = _items.filter(function(i){ return i.id !== id; });
    _save();
    _updateNavbarBadge();
    _renderMini();
    _renderPage();
  };

  window.igcSetQty = function(id, inputEl) {
    _load();
    var item = _items.find(function(i){ return i.id === id; });
    if (!item) return;
    var v = parseInt(inputEl.value);
    if (isNaN(v) || v < 0) v = 1;
    if (v === 0) {
      _items = _items.filter(function(i){ return i.id !== id; });
    } else {
      item.qty = v;
    }
    _save();
    _updateNavbarBadge();
    setTimeout(function() { _renderMini(); _renderPage(); }, 0);
  };

  window.igcQtyKey = function(e, id, inputEl) {
    if (e.key === 'Enter') { inputEl.blur(); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); igcChangeQty(id, 1); }
    if (e.key === 'ArrowDown') { e.preventDefault(); igcChangeQty(id, -1); }
  };

  window.igcRemoveItem = function(id) {
    _load();
    _items = _items.filter(function(i){ return i.id !== id; });
    _save();
    _updateNavbarBadge();
    _renderMini();
    _renderPage();
  };

  /* FIX: igcCheckout también está disponible como igbCheckout (alias) */
  function _doCheckout() {
    _load();
    if (!_items.length) return;
    var params = _items.map(function(i){ return encodeURIComponent(i.nombre)+':'+i.qty; }).join(',');
    window.location.href = '/configurador.html?cart=' + params;
  }
  window.igcCheckout = _doCheckout;
  window.igbCheckout  = _doCheckout;  // alias para uso en carrito.html inline

  /* ════════════════════════════════════════════════════════════
     TOAST NOTIFICACIÓN
  ════════════════════════════════════════════════════════════ */
  var _toastTimeout = null;

  function _showToast(nombre) {
    var toast = document.getElementById('igcToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'igcToast';
      toast.className = 'igc-toast';
      document.body.appendChild(toast);
    }

    toast.innerHTML = [
      '<div class="igc-toast-icon">',
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18">',
      '    <polyline points="20 6 9 17 4 12"/>',
      '  </svg>',
      '</div>',
      '<div class="igc-toast-body">',
      '  <div class="igc-toast-title">Agregado al carro</div>',
      '  <div class="igc-toast-nombre">' + _esc(nombre) + '</div>',
      '  <div class="igc-toast-btns">',
      '    <a href="/carrito.html" class="igc-toast-btn-ver">Ver carro</a>',
      '    <button class="igc-toast-btn-seguir" onclick="igcCloseToast()">Seguir viendo</button>',
      '  </div>',
      '</div>',
      '<button class="igc-toast-close" onclick="igcCloseToast()" aria-label="Cerrar">',
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">',
      '    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      '  </svg>',
      '</button>',
      '<div class="igc-toast-bar"></div>'
    ].join('');

    clearTimeout(_toastTimeout);
    /* Force reflow para reiniciar la animación de la barra */
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');

    _toastTimeout = setTimeout(function() {
      toast.classList.remove('show');
    }, 3500);
  }

  window.igcCloseToast = function() {
    clearTimeout(_toastTimeout);
    var toast = document.getElementById('igcToast');
    if (toast) toast.classList.remove('show');
  };

  /* ════════════════════════════════════════════════════════════
     MINI DROPDOWN (legacy)
  ════════════════════════════════════════════════════════════ */
  var _miniOpen = false;
  var _miniTimeout = null;

  function _openMini() {
    var el = document.getElementById('igcMiniDropdown');
    if (!el) return;
    clearTimeout(_miniTimeout);
    el.classList.add('open');
    _miniOpen = true;
  }

  function _closeMini() {
    var el = document.getElementById('igcMiniDropdown');
    if (el) el.classList.remove('open');
    _miniOpen = false;
  }

  window.igcCloseMini = _closeMini;

  function _renderMini() {
    var el = document.getElementById('igcMiniDropdown');
    if (!el) return;
    _load();

    if (!_items.length) {
      el.innerHTML = _miniShell('<div class="igc-mini-empty">Tu carrito está vacío</div>', false);
      return;
    }

    /* Renderizar TODOS los items en lista scrolleable */
    var allItemsHtml = _items.map(function(item) {
      var marca = '';
      if (window.PRODUCTOS_DB) {
        var prd = window.PRODUCTOS_DB.find(function(p){ return p.id === item.id; });
        if (prd) marca = prd.marca || '';
      }
      return [
        '<div class="igc-mini-item-rich">',
        '  <div class="igc-mini-img-large">' + _itemImg(item) + '</div>',
        '  <div class="igc-mini-detail">',
        marca ? '    <div class="igc-mini-marca">' + _esc(marca) + '</div>' : '',
        '    <div class="igc-mini-nombre-rich">' + _esc(item.nombre) + '</div>',
        '    <div class="igc-mini-stock-row">',
        '      <span class="igc-mini-stock-dot"></span>',
        '      Disponible, más de 20 unidades',
        '    </div>',
        '    <div class="igc-mini-payment-row">Todo medio de pago</div>',
        '    <div class="igc-mini-precio-rich">' + _fmt(item.precio) + '</div>',
        '  </div>',
        '  <div class="igc-mini-qty-col">',
        '    <div class="igc-mini-qty-wrap">',
        '      <button onclick="igcChangeQty(\'' + item.id + '\',-1)">−</button>',
        '      <input type="number" class="igc-qty-input" value="' + item.qty + '" min="0"',
        '             onchange="igcSetQty(\'' + item.id + '\', this)"',
        '             onkeydown="igcQtyKey(event, \'' + item.id + '\', this)"',
        '             onclick="this.select()">',
        '      <button onclick="igcChangeQty(\'' + item.id + '\',1)">+</button>',
        '    </div>',
        '    <button class="igc-mini-del" onclick="igcRemoveItem(\'' + item.id + '\')">Eliminar</button>',
        '  </div>',
        '</div>'
      ].join('');
    }).join('');

    var bodyHtml = '<div class="igc-mini-items">' + allItemsHtml + '</div>';

    var _pct  = _descuentoPct();
    var _subD = _subtotalConDescuento();
    var _subO = _subtotal();
    var _ahorro = _subO - _subD;
    _updateDctoSidebarWidget();

    var footerHtml = [
      _pct > 0 ? '<div class="igc-mini-dcto-badge">−' + _pct + '% descuento por volumen</div>' : '',
      '<div class="igc-mini-total">',
      '  <span>Total:</span>',
      _pct > 0 ? '  <span class="igc-mini-total-tachado">' + _fmt(_subO) + '</span>' : '',
      '  <span class="igc-mini-total-val">' + _fmt(_subD) + '</span>',
      '</div>',
      _pct > 0 ? '<div class="igc-mini-ahorro">Ahorras ' + _fmt(_ahorro) + '</div>' : '',
      '<div class="igc-mini-btns">',
      '  <a href="/carrito.html" class="igc-mini-btn-ver">Ver carro</a>',
      '  <button class="igc-mini-btn-cotizar" onclick="window.location.href=\'/carrito.html\'">Comprar</button>',
      '</div>',
      ''
    ].join('');

    el.innerHTML = _miniShell(bodyHtml, footerHtml);
  }

  function _miniShell(bodyHtml, footerHtml) {
    return [
      '<div class="igc-mini-header">',
      '  <span class="igc-mini-title">Mi carrito (' + _totalQty() + ')</span>',
      '  <button class="igc-mini-close" onclick="igcCloseMini()">',
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">',
      '      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
      '    </svg>',
      '  </button>',
      '</div>',
      bodyHtml,
      footerHtml ? '<div class="igc-mini-footer">' + footerHtml + '</div>' : ''
    ].join('');
  }

  /* ── Construir el div del mini-dropdown junto al .igb-cart ── */
  function _buildMiniDropdown() {
    if (document.getElementById('igcMiniDropdown')) return;
    var cartBtn = document.querySelector('.igb-cart');
    if (!cartBtn) return;
    cartBtn.style.display = '';

    /* Dropdown directo en body — evita problemas de stacking context del navbar */
    var drop = document.createElement('div');
    drop.id = 'igcMiniDropdown';
    drop.className = 'igc-mini-dropdown';
    document.body.appendChild(drop);

    /* Click en ícono del carro → abrir/cerrar dropdown */
    cartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      if (_miniOpen) {
        _closeMini();
      } else {
        _renderMini();
        _openMini();
      }
    });

    /* Cerrar al hacer click fuera */
    document.addEventListener('click', function(e) {
      if (!_miniOpen) return;
      var path = e.composedPath ? e.composedPath() : [];
      var enDropdown = path.some(function(el) { return el === drop; });
      var enCart     = path.some(function(el) { return el === cartBtn; });
      if (!enDropdown && !enCart) _closeMini();
    });

  }

  /* ════════════════════════════════════════════════════════════
     BADGE NAVBAR
  ════════════════════════════════════════════════════════════ */
  function _updateNavbarBadge() {
    _load();
    var qty = _totalQty();
    document.querySelectorAll('.igb-cart-count').forEach(function(el) {
      el.textContent = qty;
      el.style.display = qty > 0 ? '' : 'none';
    });
  }

  /* ════════════════════════════════════════════════════════════
     PÁGINA CARRITO.HTML — renderizado completo
  ════════════════════════════════════════════════════════════ */
  function _renderPage() {
    _load();
    var container = document.getElementById('igcPageContainer');
    if (!container) return;

    if (!_items.length) {
      container.innerHTML = [
        '<div class="igc-page-empty">',
        '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" width="64" height="64">',
        '    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>',
        '    <line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/>',
        '  </svg>',
        '  <h3>Tu carrito está vacío</h3>',
        '  <p>Agrega productos desde la tienda para comenzar</p>',
        '  <a href="/tienda.html">Ir a la tienda</a>',
        '</div>'
      ].join('');
      _updatePanel(0);
      return;
    }

    var _pct = _descuentoPct();
    _updateDctoSidebarWidget();

    container.innerHTML = _items.map(function(item) {
      var precioDto = _pct > 0 ? Math.round(item.precio * (1 - _pct / 100)) : item.precio;
      var sub = precioDto * item.qty;
      return [
        '<div class="igc-page-item">',
        '  <div class="igc-page-img">' + _itemImg(item) + '</div>',
        '  <div class="igc-page-info">',
        '    <div class="igc-page-marca">InfraGo</div>',
        '    <div class="igc-page-nombre">' + _esc(item.nombre) + '</div>',
        '    <div class="igc-page-precio">',
        _pct > 0 ? '      <span class="igc-page-precio-original">' + _fmt(item.precio) + '</span>' : '',
        '      ' + _fmt(precioDto),
        _pct > 0 ? '      <span class="igc-page-dto-badge">−' + _pct + '%</span>' : '',
        '    </div>',
        '    <div class="igc-page-disponible">Disponible · Todo medio de pago</div>',
        '  </div>',
        '  <div class="igc-page-qty">',
        '    <button onclick="igcChangeQty(\'' + item.id + '\',-1)">−</button>',
        '    <input type="number" class="igc-qty-input" value="' + item.qty + '" min="0"',
        '           onchange="igcSetQty(\'' + item.id + '\', this)"',
        '           onkeydown="igcQtyKey(event, \'' + item.id + '\', this)"',
        '           onclick="this.select()">',
        '    <button onclick="igcChangeQty(\'' + item.id + '\',1)">+</button>',
        '  </div>',
        '  <div class="igc-page-subtotal">Total:<br>' + _fmt(sub) + '</div>',
        '  <button class="igc-page-del" onclick="igcRemoveItem(\'' + item.id + '\')" title="Eliminar">',
        '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
        '    Eliminar',
        '  </button>',
        '</div>'
      ].join('');
    }).join('');

    _updatePanel(_subtotalConDescuento());
    _renderServicios();
  }

  /* ── Subtotal de servicios seleccionados ── */
  function _subtotalSvc() {
    var tic = SERVICIOS_TIENDA.reduce(function(s, svc) {
      return s + (_selectedSvc[svc.id] ? svc.price : 0);
    }, 0);
    var log = SERVICIOS_LOGISTICOS.reduce(function(s, svc) {
      return s + (_selectedLog[svc.id] ? svc.price : 0);
    }, 0);
    return tic + log;
  }

  function _svcItemHtml(svc, checked, toggleFn, rowPrefix) {
    var frecLabel = svc.frecuencia === 'mensual' ? '/mes' : svc.frecuencia === 'anual' ? '/año' : 'pago único';
    return [
      '<label class="igc-svc-item' + (checked ? ' igc-svc-selected' : '') + '" id="' + rowPrefix + svc.id + '">',
      '  <input type="checkbox" ' + (checked ? 'checked' : '') + ' onchange="' + toggleFn + '(\'' + svc.id + '\', this.checked)">',
      '  <div class="igc-svc-check"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" width="12" height="12"><polyline points="20 6 9 17 4 12"/></svg></div>',
      '  <div class="igc-svc-body">',
      '    <div class="igc-svc-label">' + _esc(svc.label) + '</div>',
      '    <div class="igc-svc-desc">' + _esc(svc.desc) + '</div>',
      '  </div>',
      '  <div class="igc-svc-price">',
      '    <span class="igc-svc-price-val">' + _fmt(svc.price) + '</span>',
      '    <span class="igc-svc-price-unit">' + frecLabel + '</span>',
      '  </div>',
      '</label>'
    ].join('');
  }

  /* ── Renderizar servicios TIC ── */
  function _renderServicios() {
    var list = document.getElementById('igcServiciosList');
    if (!list) return;
    list.innerHTML = SERVICIOS_TIENDA.map(function(svc) {
      return _svcItemHtml(svc, !!_selectedSvc[svc.id], 'igcToggleSvc', 'igcSvcRow_');
    }).join('');
  }

  /* ── Renderizar servicios logísticos ── */
  function _renderLogisticos() {
    var list = document.getElementById('igcLogisticosList');
    if (!list) return;
    list.innerHTML = SERVICIOS_LOGISTICOS.map(function(svc) {
      return _svcItemHtml(svc, !!_selectedLog[svc.id], 'igcToggleLog', 'igcLogRow_');
    }).join('');
  }

  /* ── Abrir / cerrar panel de servicios ── */
  window.igcAbrirServicios = function() {
    var overlay = document.getElementById('igcSvcOverlay');
    var panel   = document.getElementById('igcSvcPanel');
    if (overlay) overlay.classList.add('open');
    if (panel)   panel.classList.add('open');
    document.body.style.overflow = 'hidden';
    _renderServicios();
    _renderLogisticos();
  };

  window.igcCerrarServicios = function() {
    var overlay = document.getElementById('igcSvcOverlay');
    var panel   = document.getElementById('igcSvcPanel');
    if (overlay) overlay.classList.remove('open');
    if (panel)   panel.classList.remove('open');
    document.body.style.overflow = '';
  };

  window.igcToggleSvc = function(id, checked) {
    _selectedSvc[id] = !!checked;
    var row = document.getElementById('igcSvcRow_' + id);
    if (row) row.classList.toggle('igc-svc-selected', !!checked);
    _updatePanel();
  };

  window.igcToggleLog = function(id, checked) {
    _selectedLog[id] = !!checked;
    var row = document.getElementById('igcLogRow_' + id);
    if (row) row.classList.toggle('igc-svc-selected', !!checked);
    _updatePanel();
  };

  function _updatePanel(sub) {
    if (sub === undefined) sub = _subtotalConDescuento();
    var pct    = _descuentoPct();
    var ahorro = pct > 0 ? (_subtotal() - sub) : 0;
    var subSvc = _subtotalSvc();
    var base   = sub + subSvc;
    var total  = _metodo === 'tarjeta' ? Math.round(base * 1.03) : base;
    var neto   = Math.round(base / 1.19);
    var iva    = base - neto;
    var el;
    el = document.getElementById('igcPanelSubtotal');    if(el) el.textContent = _fmt(sub);
    el = document.getElementById('igcPanelSubtotalSvc'); if(el) el.textContent = _fmt(subSvc);
    el = document.getElementById('igcPanelTotal');       if(el) el.textContent = _fmt(total);
    el = document.getElementById('igcPanelNeto');        if(el) el.textContent = _fmt(neto);
    el = document.getElementById('igcPanelIVA');         if(el) el.textContent = _fmt(iva);
    el = document.getElementById('igcPanelQty');         if(el) el.textContent = _totalQty();
    el = document.getElementById('igcPanelRowSvc');
    if (el) el.style.display = subSvc > 0 ? '' : 'none';
    el = document.getElementById('igcPanelRowDcto');
    if (el) {
      el.style.display = pct > 0 ? '' : 'none';
      var pctEl    = document.getElementById('igcPanelDctoPct');
      var ahorroEl = document.getElementById('igcPanelAhorro');
      if (pctEl)    pctEl.textContent    = pct + '% dto.';
      if (ahorroEl) ahorroEl.textContent = '−' + _fmt(ahorro);
    }
    if (window.igShipping && typeof window.igShipping.updateTotal === 'function') {
      window.igShipping.updateTotal(total);
    }
  }

  /* ════════════════════════════════════════════════════════════
     CÁLCULO DE ENVÍO — se activa en el Step 2 del checkout
  ════════════════════════════════════════════════════════════ */

  /* Colores de badge por courier */
  var _COURIER_COLORS = {
    'blue express': { bg:'#003DA5', fg:'#fff' },
    'starken':      { bg:'#7B1010', fg:'#fff' },
    'chilexpress':  { bg:'#FFCD00', fg:'#000' },
    'shippify':     { bg:'#00B09B', fg:'#fff' },
    'infrago':      { bg:'#FF7A00', fg:'#fff' },
    'infrago express': { bg:'#FF7A00', fg:'#fff' },
  };

  function _courierStyle(name) {
    var key = (name||'').toLowerCase();
    for (var k in _COURIER_COLORS) {
      if (key.includes(k)) return _COURIER_COLORS[k];
    }
    return { bg:'#1a4fa0', fg:'#fff' };
  }

  function _courierInitials(name) {
    return (name||'').split(' ').map(function(w){ return w[0]; }).join('').toUpperCase().slice(0,2);
  }

  function _calcShipping() {
    var cotizarFn = window.igShipping && window.igShipping.cotizarOpciones;
    if (!cotizarFn) return;

    var comunaEl  = document.getElementById('igcCoComuna');
    var regionEl  = document.getElementById('igcCoRegion');
    var previewEl = document.getElementById('igcShippingPreview');
    var envioEl   = document.getElementById('igcCksEnvioVal');
    if (!comunaEl || !regionEl) return;

    var comuna = comunaEl.value.trim();
    var region = regionEl.value;

    if (!comuna) {
      _shippingCost = 0; _shippingOpciones = []; _shippingSelIdx = -1;
      if (previewEl) previewEl.style.display = 'none';
      if (envioEl)   { envioEl.textContent = 'Por definir'; envioEl.style.color = ''; }
      _cksRefresh(); return;
    }

    /* Loading */
    if (previewEl) {
      previewEl.style.display = '';
      previewEl.innerHTML = '<div class="igc-sp-loading"><span class="igc-sp-spinner"></span> Consultando métodos de despacho…</div>';
    }
    if (envioEl) { envioEl.textContent = 'Calculando…'; envioEl.style.color = '#b0bcc9'; }

    var totalBase = _subtotal() + _subtotalSvc();

    cotizarFn(comuna, region || 'Región Metropolitana', totalBase)
      .then(function(opciones) {
        _shippingOpciones = opciones || [];
        /* Auto-seleccionar la primera (más barata) */
        _shippingSelIdx = _shippingOpciones.length > 0 ? 0 : -1;
        _shippingCost   = _shippingSelIdx >= 0 ? (_shippingOpciones[0].precio || 0) : 0;

        if (previewEl) {
          previewEl.style.display = '';
          previewEl.innerHTML = _buildCourierOptions(_shippingOpciones, _shippingSelIdx, totalBase, region);
        }
        _updateShippingBadge();
        _cksRefresh();
      })
      .catch(function() {
        _shippingCost = 0; _shippingOpciones = []; _shippingSelIdx = -1;
        if (previewEl) previewEl.style.display = 'none';
        if (envioEl)   { envioEl.textContent = 'Por definir'; envioEl.style.color = ''; }
        _cksRefresh();
      });
  }

  function _buildCourierOptions(opciones, selIdx, totalBase, region) {
    var isGratis = opciones.length === 1 && opciones[0].tipo === 'gratis';
    var esRef    = opciones.length > 0 && opciones[0].tipo === 'referencial';

    var bannerHtml = '';
    if (isGratis) {
      bannerHtml = '<div class="igc-couriers-banner igc-couriers-banner--gratis">🎉 ¡Despacho gratuito a tu comuna! En compras sobre $75.000.</div>';
    } else if (esRef) {
      bannerHtml = '<div class="igc-couriers-banner">Tarifas referenciales. El precio exacto se confirma al procesar el pedido.</div>';
    }

    var optsHtml = opciones.map(function(opt, i) {
      var sel    = i === selIdx;
      var style  = _courierStyle(opt.courier);
      var initls = _courierInitials(opt.courier);
      var precio = opt.tipo === 'gratis' ? 'Gratis' : opt.label;
      var nota   = opt.tipo === 'referencial' ? '*' : '';
      return [
        '<label class="igc-courier-opt' + (sel ? ' igc-courier-opt--sel' : '') + '" onclick="igcSelectCourier(' + i + ')">',
        '  <input type="radio" name="igcCourierRadio"' + (sel ? ' checked' : '') + ' style="display:none">',
        '  <div class="igc-courier-radio-dot' + (sel ? ' igc-courier-radio-dot--on' : '') + '"></div>',
        '  <div class="igc-courier-badge" style="background:' + style.bg + ';color:' + style.fg + '">' + initls + '</div>',
        '  <div class="igc-courier-info">',
        opt.estimado ? '    <div class="igc-courier-eta-lbl">Fecha estimada de entrega:</div>' : '',
        opt.estimado ? '    <div class="igc-courier-eta">' + opt.estimado + '</div>' : '',
        '    <div class="igc-courier-name">' + _esc(opt.courier) + ' · ' + opt.dias + ' días hábiles</div>',
        '  </div>',
        '  <div class="igc-courier-price' + (opt.tipo === 'gratis' ? ' igc-courier-price--gratis' : '') + '">' + precio + nota + '</div>',
        '</label>'
      ].join('');
    }).join('');

    return [
      '<div class="igc-couriers">',
      '  <div class="igc-couriers-title">Seleccione el método de despacho:</div>',
      bannerHtml,
      optsHtml,
      esRef ? '<div class="igc-couriers-nota">* Precio referencial, puede variar según peso y dimensiones del pedido.</div>' : '',
      '</div>'
    ].join('');
  }

  function _updateShippingBadge() {
    var envioEl = document.getElementById('igcCksEnvioVal');
    if (!envioEl) return;
    if (_shippingSelIdx < 0 || !_shippingOpciones.length) {
      envioEl.textContent = 'Por definir'; envioEl.style.color = ''; return;
    }
    var opt = _shippingOpciones[_shippingSelIdx];
    if (opt.tipo === 'gratis') {
      envioEl.textContent = 'Gratis'; envioEl.style.color = '#16a34a';
    } else {
      var sufijo = opt.tipo === 'referencial' ? '*' : '';
      envioEl.textContent = opt.label + sufijo;
      envioEl.style.color = opt.tipo === 'referencial' ? '#d97706' : '';
    }
  }

  window.igcSelectCourier = function(idx) {
    _shippingSelIdx = idx;
    _shippingCost   = _shippingOpciones[idx] ? (_shippingOpciones[idx].precio || 0) : 0;

    /* Actualizar estilos de los botones */
    document.querySelectorAll('.igc-courier-opt').forEach(function(el, i) {
      el.classList.toggle('igc-courier-opt--sel', i === idx);
      var dot = el.querySelector('.igc-courier-radio-dot');
      if (dot) dot.classList.toggle('igc-courier-radio-dot--on', i === idx);
      var radio = el.querySelector('input[type="radio"]');
      if (radio) radio.checked = (i === idx);
    });

    _updateShippingBadge();
    _cksRefresh();
  };

  /* Handlers globales llamados desde onchange del HTML */
  window.igcOnRegionChange = function() {
    /* Resetear selección de envío al cambiar región */
    _shippingCost = 0; _shippingOpciones = []; _shippingSelIdx = -1;
    var previewEl = document.getElementById('igcShippingPreview');
    if (previewEl) previewEl.style.display = 'none';
    var envioEl = document.getElementById('igcCksEnvioVal');
    if (envioEl) { envioEl.textContent = 'Por definir'; envioEl.style.color = ''; }
    _cksRefresh();
  };

  window.igcOnComunaChange = function() {
    clearTimeout(_shippingTimer);
    _calcShipping();
  };

  function _attachShippingListeners() {
    var comunaEl = document.getElementById('igcCoComuna');
    var regionEl = document.getElementById('igcCoRegion');

    /* Ambos son ahora <select> — solo necesitamos el evento change,
       que ya está en el onchange inline del HTML. Aquí solo
       recalculamos si al volver al paso 2 ya había valores. */
    if (!comunaEl || !regionEl) return;
    if (comunaEl.value && regionEl.value && !_shippingOpciones.length) {
      _calcShipping();
    }
  }

  /* ════════════════════════════════════════════════════════════
     CHECKOUT — PASOS (Información → Envío → Pago)
  ════════════════════════════════════════════════════════════ */

  var _docTipo = 'boleta'; /* boleta | factura */

  function _cksRefresh() {
    _load();
    var sub    = _subtotalConDescuento();
    var subSvc = _subtotalSvc();
    var base   = sub + subSvc;
    var total  = _metodo === 'tarjeta' ? Math.round(base * 1.03) : base;

    /* Items del resumen lateral */
    var html = _items.map(function(item) {
      return [
        '<div class="igc-cks-item">',
        '  <div class="igc-cks-item-img">' + _itemImg(item) + '</div>',
        '  <div class="igc-cks-item-info">',
        '    <div class="igc-cks-item-nombre">' + _esc(item.nombre) + '</div>',
        '    <div class="igc-cks-item-qty">Cantidad: ' + item.qty + '</div>',
        '  </div>',
        '  <div class="igc-cks-item-precio">' + _fmt(item.precio * item.qty) + '</div>',
        '</div>'
      ].join('');
    }).join('');

    SERVICIOS_TIENDA.forEach(function(s) {
      if (!_selectedSvc[s.id]) return;
      html += [
        '<div class="igc-cks-item igc-cks-item--svc">',
        '  <div class="igc-cks-item-info" style="grid-column:1/3">',
        '    <div class="igc-cks-item-nombre">' + _esc(s.label) + '</div>',
        '  </div>',
        '  <div class="igc-cks-item-precio">' + _fmt(s.price) + '</div>',
        '</div>'
      ].join('');
    });

    total += _shippingCost;

    var el;
    el = document.getElementById('igcCksItems');    if(el) el.innerHTML = html;
    el = document.getElementById('igcCksSubtotal'); if(el) el.textContent = _fmt(sub);
    el = document.getElementById('igcCksSvc');      if(el) el.textContent = _fmt(subSvc);
    el = document.getElementById('igcCksSvcRow');   if(el) el.style.display = subSvc > 0 ? '' : 'none';
    el = document.getElementById('igcCksTotal');    if(el) el.textContent = _fmt(total);
  }

  function _setCrumbs(step) {
    [1,2,3].forEach(function(n) {
      var el = document.getElementById('igcCrumb' + n);
      if (!el) return;
      el.classList.toggle('igc-crumb--active', n === step);
      el.classList.toggle('igc-crumb--done',   n < step);
    });
  }

  window.igcSetDoc = function(tipo) {
    _docTipo = tipo;
    var bBtn = document.getElementById('igcDocBoleta');
    var fBtn = document.getElementById('igcDocFactura');
    var fFields = document.getElementById('igcFacturaFields');
    if (bBtn) bBtn.classList.toggle('igc-doc-btn--active', tipo === 'boleta');
    if (fBtn) fBtn.classList.toggle('igc-doc-btn--active', tipo === 'factura');
    if (fFields) fFields.style.display = tipo === 'factura' ? '' : 'none';
  };

  /* Actualiza los bloques de pago en paso 3 */
  window.igcSelectMetodo = function(metodo) {
    _metodo = metodo;
    var optT = document.getElementById('igcMetodoTransferencia');
    var optK = document.getElementById('igcMetodoTarjeta');
    if (optT) optT.classList.toggle('igc-metodo-selected', metodo === 'transferencia');
    if (optK) optK.classList.toggle('igc-metodo-selected', metodo === 'tarjeta');
    var bank   = document.getElementById('igcBankBlock');
    var webpay = document.getElementById('igcWebpayBlock');
    if (bank)   bank.style.display   = metodo === 'transferencia' ? '' : 'none';
    if (webpay) webpay.style.display = metodo === 'tarjeta'       ? '' : 'none';
    _updatePanel();
    _cksRefresh();
  };

  /* Validaciones por paso */
  function _validateStep(step) {
    var checks = [];
    if (step === 1) {
      checks = [{ id:'igcCoEmail', label:'Email' }];
      if (_docTipo === 'factura') {
        checks.push({ id:'igcCoEmpresa',    label:'Razón Social' });
        checks.push({ id:'igcCoRutEmpresa', label:'RUT Empresa' });
      }
    }
    if (step === 2) {
      checks = [
        { id:'igcCoNombre',    label:'Nombre' },
        { id:'igcCoApellido',  label:'Apellido' },
        { id:'igcCoTel',       label:'Teléfono' },
        { id:'igcCoDireccion', label:'Dirección' },
        { id:'igcCoRegion',    label:'Región' },
        { id:'igcCoComuna',    label:'Comuna' },
      ];
    }
    var missing = checks.filter(function(f) {
      var el = document.getElementById(f.id);
      return !el || !el.value.trim();
    });
    if (missing.length) {
      missing.forEach(function(f) {
        var el = document.getElementById(f.id);
        if (el) el.classList.add('igc-field-error');
      });
      document.getElementById(missing[0].id).focus();
      return false;
    }
    return true;
  }

  window.igcCloseCheckout = function() {
    var overlay = document.getElementById('igcCoOverlay');
    var panel   = document.getElementById('igcCoPanel');
    if (overlay) { overlay.classList.remove('open'); setTimeout(function(){ overlay.style.display = 'none'; }, 300); }
    if (panel)   { panel.classList.remove('open');   setTimeout(function(){ panel.style.display   = 'none'; }, 300); }
    document.body.style.overflow = '';
    _shippingCost = 0; _shippingOpciones = []; _shippingSelIdx = -1;
  };

  window.igcOpenCheckout = function() {
    _load();
    if (!_items.length) return;

    /* Pre-rellenar si está logueado */
    if (window.igbAuth && typeof window.igbAuth.current === 'function') {
      var u = window.igbAuth.current();
      if (u) {
        var fn = document.getElementById('igcCoNombre');
        var fa = document.getElementById('igcCoApellido');
        var fe = document.getElementById('igcCoEmail');
        if (fn && !fn.value) fn.value = u.nombre   || '';
        if (fa && !fa.value) fa.value = u.apellido  || '';
        if (fe && !fe.value) fe.value = u.email     || '';
      }
    }

    _cksRefresh();
    _setCrumbs(1);
    document.getElementById('igcStep1').style.display = '';
    document.getElementById('igcStep2').style.display = 'none';
    document.getElementById('igcStep3').style.display = 'none';

    var overlay = document.getElementById('igcCoOverlay');
    var panel   = document.getElementById('igcCoPanel');
    if (overlay) { overlay.style.display = 'block'; requestAnimationFrame(function(){ overlay.classList.add('open'); }); }
    if (panel)   { panel.style.display   = 'flex';  requestAnimationFrame(function(){ panel.classList.add('open'); }); }
    document.body.style.overflow = 'hidden';
  };

  window.igcGoStep = function(step) {
    if (step === 0) { igcCloseCheckout(); return; }

    var currentStep = [1,2,3].find(function(n) {
      var el = document.getElementById('igcStep' + n);
      return el && el.style.display !== 'none';
    });
    if (step > currentStep && !_validateStep(currentStep)) return;

    [1,2,3].forEach(function(n) {
      var el = document.getElementById('igcStep' + n);
      if (el) el.style.display = n === step ? '' : 'none';
    });
    _setCrumbs(step);
    _cksRefresh();
    if (step === 2) _attachShippingListeners();
    var form = document.querySelector('.igc-co-form');
    if (form) form.scrollTop = 0;
  };

  window.igcSubmitCheckout = function() {
    if (!_validateStep(3)) return;

    if (_metodo === 'tarjeta') {
      alert('Para completar el pago con tarjeta se requiere integración con el servidor Transbank WebPay Plus.');
      return;
    }

    /* Transferencia: mostrar pantalla de éxito */
    var nombre = (document.getElementById('igcCoNombre') || {}).value || 'cliente';
    var msg = [
      '<strong>Gracias, ' + _esc(nombre) + '!</strong><br><br>',
      'Tu pedido fue registrado. Realiza la transferencia a:<br>',
      '<strong>Banco de Chile · Cta. Cte. 123-456-789</strong><br>',
      'y envía el comprobante a <strong>pagos@infrago.cl</strong><br>',
      'con el asunto <em>"Pedido — ' + _esc(nombre) + '"</em>.<br><br>',
      'Un asesor te contactará en menos de 24 horas hábiles.'
    ].join('');

    igcCloseCheckout();
    var ss  = document.getElementById('igcSuccessScreen');
    var msg2 = document.getElementById('igcSuccessMsg');
    if (msg2) msg2.innerHTML = msg;
    if (ss)   ss.style.display = 'flex';

    _items = []; _save(); _selectedSvc = {}; _updateNavbarBadge();
    window.scrollTo(0, 0);
  };

  /* Limpiar error al escribir */
  document.addEventListener('input', function(e) {
    if (e.target && e.target.classList.contains('igc-field-error')) {
      e.target.classList.remove('igc-field-error');
    }
  });

  /* ════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function() {
    _load();
    _updateNavbarBadge();

    var enTienda    = !!document.getElementById('productosGrid');
    var enProducto  = !!document.getElementById('prdBtnCotizar');
    var enCarrito   = !!document.getElementById('igcPageContainer');

    function _showMobileCart() {
      var el = document.getElementById('igbMobileCart');
      if (el) el.style.display = '';
    }

    /* Mostrar ícono del carro solo en tienda y producto (con dropdown) */
    if (enTienda || enProducto) {
      function _activateCart() {
        var cartIcon = document.querySelector('.igb-cart');
        if (cartIcon) {
          cartIcon.style.display = '';
          _buildMiniDropdown();
        }
        _showMobileCart();
      }
      if (document.querySelector('.igb-cart')) {
        _activateCart();
      } else {
        document.addEventListener('componentInjected', function handler(e) {
          if (e.detail && e.detail.component === 'navbar-placeholder') {
            document.removeEventListener('componentInjected', handler);
            _activateCart();
          }
        });
      }
    }

    /* En carrito.html mostrar el ícono enlazado a la misma página */
    if (enCarrito) {
      function _showCartIcon() {
        var cartIcon = document.querySelector('.igb-cart');
        if (cartIcon) {
          cartIcon.style.display = '';
          cartIcon.href = '/carrito.html';
        }
        _showMobileCart();
      }
      if (document.querySelector('.igb-cart')) {
        _showCartIcon();
      } else {
        document.addEventListener('componentInjected', function handler2(e) {
          if (e.detail && e.detail.component === 'navbar-placeholder') {
            document.removeEventListener('componentInjected', handler2);
            _showCartIcon();
          }
        });
      }
      _renderPage();
    }
  });

})();