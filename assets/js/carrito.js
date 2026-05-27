/* ═══════════════════════════════════════════════════════════════
   carrito.js — ElevalCorp
   ───────────────────────────────────────────────────────────────
   · Mini-dropdown en navbar al agregar producto (tienda + producto)
   · Página completa en carrito.html
   · Estado único en localStorage key 'igb_cart'
   · Requiere: carrito.css
═══════════════════════════════════════════════════════════════ */

(function () {

  var CART_KEY = 'igb_cart';
  var _items = [];

  var SERVICIOS_TIENDA    = [];
  var SERVICIOS_LOGISTICOS = [];

  /* ── Estado de servicios y método de pago ── */
  var _selectedSvc = {};   /* { id: true/false } */
  var _selectedLog = {};   /* { id: true/false } */
  var _metodo = 'transferencia';

  var _cartShipMounted     = false;
  var _cartShipCost        = 0;
  var _cartShipCalculated  = false;
  var _cartShipRegion      = '';
  var _cartShipComuna      = '';

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

  /* Detecta si un ítem es servicio consultando el catálogo */
  function _isService(item) {
    var cat = ((window.CATALOGO || []).find(function(p){ return p.id === item.id; }) || {}).cat || '';
    return cat === 'servicios';
  }

  /* Cantidad solo de productos (excluye servicios) — base para el descuento por volumen */
  function _productQty() {
    return _items.reduce(function(s, i){ return s + (_isService(i) ? 0 : i.qty); }, 0);
  }

  /* ── Descuentos por volumen (igual que configurador) ── */
  var DCTO_TRAMOS_TIENDA = [
    { min:10, max:19,   pct:1 },
    { min:20, max:29,   pct:2 },
    { min:30, max:39,   pct:3 },
    { min:40, max:49,   pct:4 },
    { min:50, max:9999, pct:5 },
  ];

  function _descuentoPct() {
    var qty = _productQty();
    var t = DCTO_TRAMOS_TIENDA.find(function(t){ return qty >= t.min && qty <= t.max; });
    return t ? t.pct : 0;
  }

  function _subtotalConDescuento() {
    var pct = _descuentoPct();
    if (pct === 0) return _subtotal();
    return _items.reduce(function(s, i){
      if (_isService(i)) return s + i.precio * i.qty;
      return s + Math.round(i.precio * (1 - pct / 100)) * i.qty;
    }, 0);
  }

  function _updateDctoSidebarWidget() {
    var pct = _descuentoPct();
    var qty = _productQty();
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

    var cartBtn = document.querySelector('.igb-cart');
    if (cartBtn) {
      var rect   = cartBtn.getBoundingClientRect();
      var dropW  = 440;
      var right  = Math.max(8, window.innerWidth - rect.right);
      // Si se saldría por la izquierda, recortar
      if (window.innerWidth - right - dropW < 8) right = window.innerWidth - dropW - 8;
      el.style.right = right + 'px';
      el.style.left  = 'auto';
      el.style.top   = (rect.bottom + 8) + 'px';
      // Flecha centrada sobre el botón del carro
      var arrowRight = Math.round(rect.width / 2 - 6);
      el.style.setProperty('--mini-arrow-right', Math.max(8, arrowRight) + 'px');
    }

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
        '    <div class="igc-mini-precio-rich">',
        item.qty > 1 ? '<span class="igc-mini-precio-unit">' + _fmt(item.precio) + ' c/u</span>' : '',
        _fmt(item.precio * item.qty),
        '    </div>',
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
      _cartShipCost       = 0;
      _cartShipCalculated = false;
      _updatePanel(0);
      var shipWrap = document.getElementById('igcCartShipWrap');
      if (shipWrap) shipWrap.style.display = 'none';
      return;
    }

    var _pct = _descuentoPct();
    _updateDctoSidebarWidget();

    container.innerHTML = _items.map(function(item) {
      var esSvc    = _isService(item);
      var precioDto = (_pct > 0 && !esSvc) ? Math.round(item.precio * (1 - _pct / 100)) : item.precio;
      var sub = precioDto * item.qty;
      return [
        '<div class="igc-page-item">',
        '  <div class="igc-page-img">' + _itemImg(item) + '</div>',
        '  <div class="igc-page-info">',
        '    <div class="igc-page-marca">ElevalCorp</div>',
        '    <div class="igc-page-nombre">' + _esc(item.nombre) + '</div>',
        '    <div class="igc-page-precio">',
        (_pct > 0 && !esSvc) ? '      <span class="igc-page-precio-original">' + _fmt(item.precio) + '</span>' : '',
        '      ' + _fmt(precioDto),
        (_pct > 0 && !esSvc) ? '      <span class="igc-page-dto-badge">−' + _pct + '%</span>' : '',
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

    /* Mostrar y montar el cotizador de envío */
    var shipWrap = document.getElementById('igcCartShipWrap');
    if (shipWrap) {
      shipWrap.style.display = '';
      if (!_cartShipMounted && window.igShipping && typeof window.igShipping.mountCarrito === 'function') {
        window.igShipping.mountCarrito('igcCartShippingWidget', _subtotalConDescuento());
        _cartShipMounted = true;
        /* Conectar callback: actualiza panel al cotizar */
        var widgetEl = document.getElementById('igs-widget-igcCartShippingWidget');
        if (widgetEl) {
          widgetEl._onResult = function(cotizacion) {
            _cartShipCost       = cotizacion.precio || 0;
            _cartShipCalculated = true;
            var rEl = document.getElementById('igs-region-igcCartShippingWidget');
            var cEl = document.getElementById('igs-comuna-igcCartShippingWidget');
            _cartShipRegion = rEl ? rEl.value : '';
            _cartShipComuna = cEl ? cEl.value : '';
            _updatePanel();
          };
          widgetEl._onReset = function() {
            _cartShipCost       = 0;
            _cartShipCalculated = false;
            _cartShipRegion     = '';
            _cartShipComuna     = '';
            _updatePanel();
          };
        }
      }
    }
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
    total += _cartShipCost;
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
    var rowEnvio = document.getElementById('igcPanelRowEnvio');
    el = document.getElementById('igcPanelEnvio');
    if (rowEnvio && el) {
      if (_cartShipCalculated) {
        rowEnvio.style.display = '';
        if (_cartShipCost > 0) {
          el.textContent = _fmt(_cartShipCost);
          el.className = '';
        } else {
          el.textContent = 'Gratis';
          el.className = 'igc-panel-envio-gratis';
        }
      } else {
        rowEnvio.style.display = 'none';
      }
    }
    if (window.igShipping && typeof window.igShipping.updateTotal === 'function') {
      window.igShipping.updateTotal(total);
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

    total += _cartShipCost;

    var el;
    el = document.getElementById('igcCksItems');    if(el) el.innerHTML = html;
    el = document.getElementById('igcCksSubtotal'); if(el) el.textContent = _fmt(sub);
    el = document.getElementById('igcCksSvc');      if(el) el.textContent = _fmt(subSvc);
    el = document.getElementById('igcCksSvcRow');   if(el) el.style.display = subSvc > 0 ? '' : 'none';
    el = document.getElementById('igcCksTotal');    if(el) el.textContent = _fmt(total);
    el = document.getElementById('igcCksEnvioVal');
    if (el) {
      if (_cartShipCalculated) {
        el.textContent = _cartShipCost > 0 ? _fmt(_cartShipCost) : 'Gratis';
        el.style.color = _cartShipCost === 0 ? '#16a34a' : '';
      } else {
        el.textContent = 'Por definir';
        el.style.color = '';
      }
    }
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
    var MAP = {
      'transferencia': 'Transfer',
      'bchileMC':      'Bchile',
      'santanderVisa': 'Santander',
      'klap':          'Klap',
      'mercadopago':   'Mercado',
      'kiphu':         'Kiphu'
    };
    var activeKey = MAP[metodo];
    Object.keys(MAP).forEach(function(m) {
      var key   = MAP[m];
      var opt   = document.getElementById('igcPay'      + key);
      var radio = document.getElementById('igcPayRadio' + key);
      var isOn  = key === activeKey;
      if (opt)   opt.classList.toggle('igc-pay-opt--sel',   isOn);
      if (radio) radio.classList.toggle('igc-pay-radio--on', isOn);
    });
    var note = document.getElementById('igcPayNoteTransfer');
    if (note) note.style.display = metodo === 'transferencia' ? '' : 'none';
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
    /* Re-habilitar selects por si el usuario vuelve a editar el envío */
    var rSel = document.getElementById('igcCoRegion');
    var cSel = document.getElementById('igcCoComuna');
    if (rSel) rSel.disabled = false;
    if (cSel) cSel.disabled = false;
  };

  window.igcOpenCheckout = function() {
    _load();
    if (!_items.length) return;

    /* Guard: require region selection */
    var regionSel = document.getElementById('igs-region-igcCartShippingWidget');
    var errEl     = document.getElementById('igcRegionError');
    if (regionSel && !regionSel.value) {
      if (errEl) { errEl.style.display = ''; setTimeout(function() { errEl.style.display = 'none'; }, 3500); }
      regionSel.classList.add('igc-field-error');
      setTimeout(function() { regionSel.classList.remove('igc-field-error'); }, 3500);
      var shipWrap = document.getElementById('igcCartShipWrap');
      if (shipWrap) shipWrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    if (errEl) errEl.style.display = 'none';

    /* Guard: require login to proceed to checkout */
    var loggedIn = (window.igbAuth && typeof window.igbAuth.current === 'function' && window.igbAuth.current())
                || (window.igbAuth && typeof window.igbAuth.getProfileCache === 'function' && window.igbAuth.getProfileCache());
    if (!loggedIn) {
      sessionStorage.setItem('ig_checkout_pending', '1');
      if (window.igbAuth && typeof window.igbAuth.open === 'function') {
        window.igbAuth.open('login');
      }
      return;
    }

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
    var confirmBtn = document.getElementById('igcCksConfirmBtn');
    if (confirmBtn) confirmBtn.style.display = step === 3 ? '' : 'none';
    if (step === 2 && _cartShipRegion && _cartShipComuna) {
      var rSel = document.getElementById('igcCoRegion');
      var cSel = document.getElementById('igcCoComuna');
      if (rSel) { rSel.value = _cartShipRegion; rSel.disabled = true; }
      if (typeof igcLoadComunas === 'function') igcLoadComunas(_cartShipRegion, _cartShipComuna);
      if (cSel) cSel.disabled = true;
    }
    var form = document.querySelector('.igc-co-form');
    if (form) form.scrollTop = 0;
  };

  /* ─── Boleta / localStorage ────────────────────────────── */
  function _fmtBol(n) { return '$ ' + (n || 0).toLocaleString('es-CL'); }

  function _generarBoletaHTML(snapshot) {
    var tipoDoc     = snapshot.tipo_doc === 'factura' ? 'Factura' : 'Boleta de Venta';
    var fecha       = new Date(snapshot.fecha).toLocaleDateString('es-CL', { day:'2-digit', month:'long', year:'numeric' });
    var folio       = String(snapshot.id).replace('ped_', '').slice(-10);
    var pct         = snapshot.dcto_pct || 0;
    var METODOS     = { transferencia:'Transferencia bancaria', tarjeta:'Tarjeta de crédito/débito',
                        bchileMC:'Banco de Chile MasterCard', santanderVisa:'Santander Visa',
                        klap:'Klap', mercadopago:'MercadoPago', kiphu:'Kiphu' };
    var metodoLabel = METODOS[snapshot.metodo_pago] || snapshot.metodo_pago || '—';

    var itemRows = (snapshot.items_arr || []).map(function(it) {
      var unitPrice = it.es_svc ? it.precio : Math.round(it.precio * (1 - pct / 100));
      var subtotal  = unitPrice * it.qty;
      return '<tr><td>' + _esc(it.nombre) + '</td>' +
             '<td style="text-align:center">' + it.qty + '</td>' +
             '<td style="text-align:right">' + _fmtBol(unitPrice) + '</td>' +
             '<td style="text-align:right">' + _fmtBol(subtotal) + '</td></tr>';
    }).join('');

    var svcRows = (snapshot.services_arr || []).map(function(s) {
      return '<tr class="svc-row"><td>' + _esc(s.label) + ' <span class="svc-freq">/mes</span></td>' +
             '<td style="text-align:center">1</td>' +
             '<td style="text-align:right">' + _fmtBol(s.price) + '</td>' +
             '<td style="text-align:right">' + _fmtBol(s.price) + '</td></tr>';
    }).join('');

    var fullName    = [snapshot.nombre, snapshot.apellido].filter(Boolean).join(' ');
    var clientRows  = '';
    if (fullName)              clientRows += '<tr><td>Nombre</td><td>' + _esc(fullName) + '</td></tr>';
    if (snapshot.email)        clientRows += '<tr><td>Email</td><td>' + _esc(snapshot.email) + '</td></tr>';
    if (snapshot.telefono)     clientRows += '<tr><td>Teléfono</td><td>' + _esc(snapshot.telefono) + '</td></tr>';
    if (snapshot.tipo_doc === 'factura') {
      if (snapshot.empresa)     clientRows += '<tr><td>Empresa</td><td>' + _esc(snapshot.empresa) + '</td></tr>';
      if (snapshot.rut_empresa) clientRows += '<tr><td>RUT Empresa</td><td>' + _esc(snapshot.rut_empresa) + '</td></tr>';
    }
    var dir = [snapshot.direccion, snapshot.comuna, snapshot.region].filter(Boolean).join(', ');
    if (dir) clientRows += '<tr><td>Dirección despacho</td><td>' + _esc(dir) + '</td></tr>';

    var sub     = snapshot.subtotal  || 0;
    var subSvc  = snapshot.total_svc || 0;
    var ahorro  = snapshot.ahorro    || 0;
    var envio   = snapshot.envio     || 0;
    var total   = snapshot.total     || 0;
    var base    = sub + subSvc;
    var recargo = snapshot.metodo_pago === 'tarjeta' ? (total - envio - base) : 0;

    var totalsRows = '';
    totalsRows += '<div class="totals-row sub"><span>Subtotal productos</span><span>' + _fmtBol(sub) + '</span></div>';
    if (ahorro > 0) {
      totalsRows += '<div class="totals-row sub" style="color:#16a34a"><span>Descuento ' + pct + '% aplicado · Ahorro</span><span>−' + _fmtBol(ahorro) + '</span></div>';
    }
    if (subSvc > 0) {
      totalsRows += '<div class="totals-row sub"><span>Servicios TIC</span><span>' + _fmtBol(subSvc) + '</span></div>';
    }
    totalsRows += '<div class="totals-row sub"><span>Despacho</span><span>' + (envio > 0 ? _fmtBol(envio) : '<span style="color:#16a34a">Gratis</span>') + '</span></div>';
    if (recargo > 0) {
      totalsRows += '<div class="totals-row sub"><span>Recargo tarjeta (3%)</span><span>' + _fmtBol(recargo) + '</span></div>';
    }
    totalsRows += '<div class="totals-row main"><span>TOTAL</span><span>' + _fmtBol(total) + '</span></div>';

    return '<!DOCTYPE html>\n<html lang="es">\n<head>\n  <meta charset="UTF-8">\n' +
      '  <title>' + tipoDoc + ' — ElevalCorp</title>\n  <style>\n' +
      '    * { margin:0; padding:0; box-sizing:border-box; }\n' +
      '    body { font-family:Arial,sans-serif; font-size:12px; color:#0a1628; background:#fff; line-height:1.5; }\n' +
      '    .no-print { display:flex; align-items:center; gap:12px; background:#f0f4ff; border-bottom:2px solid #0a1628; padding:10px 24px; font-size:12px; color:#0a1628; }\n' +
      '    .no-print button { background:#0a1628; color:#fff; border:none; border-radius:6px; padding:7px 18px; font-size:12px; font-weight:700; cursor:pointer; }\n' +
      '    @media print { .no-print { display:none; } }\n' +
      '    .header-banner { background:linear-gradient(135deg,#0a1628 0%,#1e3a5f 100%); color:#fff; padding:40px; margin-bottom:32px; display:flex; justify-content:space-between; align-items:flex-start; }\n' +
      '    .hdr-logo { font-size:32px; font-weight:900; }\n' +
      '    .hdr-logo span { color:#ff7a00; }\n' +
      '    .hdr-meta { text-align:right; font-size:11px; line-height:2; }\n' +
      '    .hdr-meta strong { font-size:17px; display:block; color:#ff7a00; margin-bottom:4px; }\n' +
      '    .main-content { padding:0 40px 40px; }\n' +
      '    .section { margin-bottom:28px; }\n' +
      '    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1.2px; color:#ff7a00; margin-bottom:12px; border-bottom:2px solid #ff7a00; padding-bottom:6px; }\n' +
      '    .info-table { border-collapse:collapse; font-size:12px; }\n' +
      '    .info-table td:first-child { font-weight:700; color:#666; text-transform:uppercase; font-size:10px; padding:4px 20px 4px 0; white-space:nowrap; vertical-align:top; }\n' +
      '    .info-table td:last-child { font-size:13px; font-weight:600; color:#0a1628; padding:4px 0; }\n' +
      '    table.items-table { width:100%; border-collapse:collapse; }\n' +
      '    table.items-table thead { background:#0a1628; color:#fff; }\n' +
      '    table.items-table thead th { padding:10px 8px; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }\n' +
      '    table.items-table tbody td { padding:9px 8px; border-bottom:1px solid #e0e0e0; font-size:11px; }\n' +
      '    .svc-row td { color:#444; font-style:italic; }\n' +
      '    .svc-freq { font-size:10px; opacity:0.6; }\n' +
      '    .totals-breakdown { background:#f0f2f5; border-radius:4px; padding:16px; margin:16px 0; max-width:380px; margin-left:auto; }\n' +
      '    .totals-row { display:flex; justify-content:space-between; padding:6px 0; font-size:12px; gap:24px; }\n' +
      '    .totals-row.sub { color:#444; font-size:11px; }\n' +
      '    .totals-row.main { font-size:16px; font-weight:800; color:#ff7a00; border-top:2px solid #0a1628; padding-top:12px; margin-top:8px; }\n' +
      '    .metodo-pago { font-size:11px; color:#666; margin-top:8px; text-align:right; }\n' +
      '    .metodo-pago strong { color:#0a1628; }\n' +
      '    .footer { text-align:center; font-size:10px; color:#999; border-top:1px solid #e0e0e0; padding:16px 40px; margin-top:16px; }\n' +
      '  </style>\n</head>\n<body>\n' +
      '<div class="no-print">\n' +
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>\n' +
      '  <span>Para guardar como PDF usa <strong>Ctrl+P → Guardar como PDF</strong></span>\n' +
      '  <button onclick="window.print()">Imprimir / Guardar PDF</button>\n</div>\n' +
      '<div class="header-banner">\n' +
      '  <div class="hdr-logo">INFRA<span>GO</span></div>\n' +
      '  <div class="hdr-meta"><strong>' + tipoDoc.toUpperCase() + '</strong>Folio N° ' + folio + '<br>Fecha: ' + fecha + '</div>\n' +
      '</div>\n<div class="main-content">\n' +
      (clientRows ? '<div class="section"><div class="section-title">Datos del cliente</div>' +
        '<table class="info-table"><tbody>' + clientRows + '</tbody></table></div>' : '') +
      '<div class="section"><div class="section-title">Detalle del pedido</div>' +
      '<table class="items-table"><thead><tr>' +
      '<th>Producto / Servicio</th><th style="text-align:center">Cant.</th>' +
      '<th style="text-align:right">P. Unit.</th><th style="text-align:right">Subtotal</th>' +
      '</tr></thead><tbody>' + itemRows + svcRows + '</tbody></table></div>' +
      '<div class="section"><div class="section-title">Resumen de pago</div>' +
      '<div class="totals-breakdown">' + totalsRows + '</div>' +
      '<div class="metodo-pago">Método de pago: <strong>' + _esc(metodoLabel) + '</strong></div>' +
      '</div></div>\n' +
      '<div class="footer">ElevalCorp SpA · www.infrago.cl · Este documento es informativo y no tiene validez tributaria oficial.</div>\n' +
      '</body>\n</html>';
  }

  function _guardarPedidoLocal(snapshot) {
    try {
      var record = {
        id:          snapshot.id,
        fecha:       snapshot.fecha,
        nombre:      snapshot.nombre,
        apellido:    snapshot.apellido,
        email:       snapshot.email,
        empresa:     snapshot.empresa,
        tipo_doc:    snapshot.tipo_doc,
        metodo_pago: snapshot.metodo_pago,
        subtotal:    snapshot.subtotal,
        total_svc:   snapshot.total_svc,
        envio:       snapshot.envio,
        total:       snapshot.total,
        dcto_pct:    snapshot.dcto_pct,
        ahorro:      snapshot.ahorro,
        region:      snapshot.region,
        comuna:      snapshot.comuna,
        n_items:     (snapshot.items_arr || []).reduce(function(s, i) { return s + i.qty; }, 0),
        items:       (snapshot.items_arr || []).slice(0, 8).map(function(i) { return { nombre: i.nombre, qty: i.qty }; })
      };
      var pedidos = [];
      try { pedidos = JSON.parse(localStorage.getItem('ig_pedidos') || '[]'); } catch(e2) {}
      pedidos.unshift(record);
      if (pedidos.length > 50) pedidos = pedidos.slice(0, 50);
      localStorage.setItem('ig_pedidos', JSON.stringify(pedidos));
      var htmlBoleta = _generarBoletaHTML(snapshot);
      if (htmlBoleta) localStorage.setItem('ig_pedido_boleta_' + snapshot.id, htmlBoleta);
    } catch (e) { console.warn('Error al guardar pedido local:', e); }
  }

  window.igcSubmitCheckout = function() {
    if (!_validateStep(3)) return;

    var nombre = (document.getElementById('igcCoNombre') || {}).value || 'cliente';
    var msg;

    if (_metodo === 'transferencia') {
      msg = [
        '<strong>Gracias, ' + _esc(nombre) + '!</strong><br><br>',
        'Tu pedido fue registrado. Realiza la transferencia a:<br>',
        '<strong>Banco de Chile · Cta. Cte. 123-456-789</strong><br>',
        'y envía el comprobante a <strong>pagos@infrago.cl</strong><br>',
        'con el asunto <em>"Pedido — ' + _esc(nombre) + '"</em>.<br><br>',
        'Un asesor te contactará en menos de 24 horas hábiles.'
      ].join('');
    } else {
      msg = [
        '<strong>Gracias, ' + _esc(nombre) + '!</strong><br><br>',
        'Tu pedido fue registrado y está siendo procesado.<br><br>',
        'Un asesor te contactará en menos de 24 horas hábiles para coordinar el pago y despacho.'
      ].join('');
    }

    igcCloseCheckout();
    var ss   = document.getElementById('igcSuccessScreen');
    var msg2 = document.getElementById('igcSuccessMsg');
    if (msg2) msg2.innerHTML = msg;
    if (ss)   ss.style.display = 'flex';

    /* Guardar pedido (Supabase + localStorage) antes de limpiar el carrito */
    (function() {
      var rawSub    = _subtotal();
      var sub       = _subtotalConDescuento();
      var subSvc    = _subtotalSvc();
      var base      = sub + subSvc;
      var pct       = _descuentoPct();
      var totalFinal = (_metodo === 'tarjeta' ? Math.round(base * 1.03) : base) + _cartShipCost;
      var gv = function(elId) { return ((document.getElementById(elId) || {}).value || '').trim(); };
      var snapshot = {
        id:           'ped_' + Date.now(),
        fecha:        new Date().toISOString(),
        nombre:       gv('igcCoNombre'),
        apellido:     gv('igcCoApellido'),
        email:        gv('igcCoEmail'),
        telefono:     gv('igcCoTel'),
        tipo_doc:     _docTipo,
        empresa:      gv('igcCoEmpresa'),
        rut_empresa:  gv('igcCoRutEmpresa'),
        direccion:    gv('igcCoDireccion'),
        region:       gv('igcCoRegion'),
        comuna:       gv('igcCoComuna'),
        metodo_pago:  _metodo,
        subtotal:     sub,
        total_svc:    subSvc,
        envio:        _cartShipCost,
        total:        totalFinal,
        dcto_pct:     pct,
        ahorro:       pct > 0 ? (rawSub - sub) : 0,
        items_arr:    _items.map(function(i) { return { id:i.id, nombre:i.nombre, precio:i.precio, qty:i.qty, es_svc:_isService(i) }; }),
        services_arr: SERVICIOS_TIENDA.filter(function(s){ return !!_selectedSvc[s.id]; }).map(function(s){ return { id:s.id, label:s.label, price:s.price }; })
      };
      var orderData = {
        email:       snapshot.email,       nombre:      snapshot.nombre,
        apellido:    snapshot.apellido,    telefono:    snapshot.telefono,
        items:       JSON.stringify(snapshot.items_arr.map(function(i){ return { id:i.id, nombre:i.nombre, precio:i.precio, qty:i.qty }; })),
        subtotal:    snapshot.subtotal,    total_svc:   snapshot.total_svc,
        envio:       snapshot.envio,       total:       snapshot.total,
        metodo_pago: snapshot.metodo_pago, tipo_doc:    snapshot.tipo_doc,
        direccion:   snapshot.direccion,   region:      snapshot.region,
        comuna:      snapshot.comuna,      empresa:     snapshot.empresa,
        rut_empresa: snapshot.rut_empresa, estado:      'pendiente'
      };
      if (window.supabase && orderData.email) {
        window.supabase.from('pedidos').insert([orderData]).then(function(res) {
          if (res.error) console.warn('Pedido no guardado en BD:', res.error);
        }).catch(function() {});
      }
      _guardarPedidoLocal(snapshot);
    })();

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