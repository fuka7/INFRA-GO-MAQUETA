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
  function _fmt(n)       { return '$' + (n||0).toLocaleString('es-CL'); }
  function _esc(str)     { return (str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _defaultImg() { return '<svg viewBox="0 0 24 24" fill="none" stroke="#b0bcc9" stroke-width="1.5" width="32" height="32"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>'; }

  /* ════════════════════════════════════════════════════════════
     API PÚBLICA
  ════════════════════════════════════════════════════════════ */

  var _lastAddedId = null;

  /* Agregar item — abre dropdown del carro */
  window.igcAddItem = function(id, nombre, precio, svg) {
    _load();
    var ex = _items.find(function(i){ return i.id === id; });
    if (ex) { ex.qty++; } else { _items.push({ id:id, nombre:nombre, precio:precio, qty:1, svg:svg||'' }); }
    _lastAddedId = id;
    _save();
    _updateNavbarBadge();
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
    _miniTimeout = setTimeout(_closeMini, 4000);
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

    /* Mostrar el último producto agregado de forma prominente */
    var item = _lastAddedId ? _items.find(function(i){ return i.id === _lastAddedId; }) : null;
    if (!item) item = _items[_items.length - 1];

    /* Buscar marca en PRODUCTOS_DB si está disponible */
    var marca = '';
    if (window.PRODUCTOS_DB) {
      var prd = window.PRODUCTOS_DB.find(function(p){ return p.id === item.id; });
      if (prd) marca = prd.marca || '';
    }

    var itemHtml = [
      '<div class="igc-mini-item-rich">',
      '  <div class="igc-mini-img-large">' + (item.svg || _defaultImg()) + '</div>',
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
      '      <span>' + item.qty + '</span>',
      '      <button onclick="igcChangeQty(\'' + item.id + '\',1)">+</button>',
      '    </div>',
      '    <button class="igc-mini-del" onclick="igcRemoveItem(\'' + item.id + '\')">Eliminar</button>',
      '  </div>',
      '</div>'
    ].join('');

    var footerHtml = [
      '<div class="igc-mini-total">',
      '  <span>Total:</span>',
      '  <span class="igc-mini-total-val">' + _fmt(_subtotal()) + '</span>',
      '</div>',
      '<div class="igc-mini-btns">',
      '  <a href="/carrito.html" class="igc-mini-btn-ver">Ver carro</a>',
      '  <button class="igc-mini-btn-cotizar" onclick="igcCheckout()">Comprar</button>',
      '</div>',
      '<div class="igc-mini-cotizar-row">',
      '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13">',
      '    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6z"/>',
      '    <polyline points="14 2 14 8 20 8"/>',
      '  </svg>',
      '  <a href="/configurador.html" class="igc-mini-cotizar-link">Crear Cotización</a>',
      '</div>'
    ].join('');

    el.innerHTML = _miniShell(itemHtml, footerHtml);
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

    /* Corregir href del botón del carrito */
    cartBtn.href = '/carrito.html';

    /* Envolver en wrapper relativo */
    var wrap = document.createElement('div');
    wrap.className = 'igc-mini-wrap';
    cartBtn.parentNode.insertBefore(wrap, cartBtn);
    wrap.appendChild(cartBtn);

    var drop = document.createElement('div');
    drop.id = 'igcMiniDropdown';
    drop.className = 'igc-mini-dropdown';
    wrap.appendChild(drop);

    /* Click en ícono del carro → ir a carrito.html */
    cartBtn.addEventListener('click', function(e) {
      e.preventDefault();
      window.location.href = '/carrito.html';
    });

    /* Cerrar al hacer click fuera */
    document.addEventListener('click', function(e) {
      if (_miniOpen && !wrap.contains(e.target)) _closeMini();
    });

    /* Mantener abierto al hacer hover sobre el dropdown */
    drop.addEventListener('mouseenter', function() { clearTimeout(_miniTimeout); });
    drop.addEventListener('mouseleave', function() { _miniTimeout = setTimeout(_closeMini, 800); });
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

    container.innerHTML = _items.map(function(item) {
      var sub = item.precio * item.qty;
      return [
        '<div class="igc-page-item">',
        '  <div class="igc-page-img">' + (item.svg || _defaultImg()) + '</div>',
        '  <div class="igc-page-info">',
        '    <div class="igc-page-marca">InfraGo</div>',
        '    <div class="igc-page-nombre">' + _esc(item.nombre) + '</div>',
        '    <div class="igc-page-precio">' + _fmt(item.precio) + '/mes</div>',
        '    <div class="igc-page-disponible">Disponible · Todo medio de pago</div>',
        '  </div>',
        '  <div class="igc-page-qty">',
        '    <button onclick="igcChangeQty(\'' + item.id + '\',-1)">−</button>',
        '    <span>' + item.qty + '</span>',
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

    _updatePanel(_subtotal());
  }

  /* FIX: recibe el subtotal como parámetro para evitar doble cálculo */
  function _updatePanel(sub) {
    if (sub === undefined) sub = _subtotal();
    var el;
    el = document.getElementById('igcPanelSubtotal'); if(el) el.textContent = _fmt(sub);
    el = document.getElementById('igcPanelTotal');    if(el) el.textContent = _fmt(sub);

    /* Actualizar widget de shipping si ya está montado */
    if (window.igShipping && typeof window.igShipping.updateTotal === 'function') {
      window.igShipping.updateTotal(sub);
    }
  }

  /* ════════════════════════════════════════════════════════════
     INIT
  ════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function() {
    _load();
    _updateNavbarBadge();

    var enTienda    = !!document.getElementById('productosGrid');
    var enProducto  = !!document.getElementById('prdBtnCotizar');
    var enCarrito   = !!document.getElementById('igcPageContainer');

    /* Mostrar ícono del carro en tienda y producto */
    if (enTienda || enProducto) {
      function _activateCart() {
        var cartIcon = document.querySelector('.igb-cart');
        if (cartIcon) {
          cartIcon.style.display = '';
          _buildMiniDropdown();
        }
      }
      /* Si el navbar ya fue inyectado (tienda.html lo carga antes), activar ya */
      if (document.querySelector('.igb-cart')) {
        _activateCart();
      } else {
        /* Si no, esperar el evento que navbar-inline.js dispara al terminar */
        document.addEventListener('componentInjected', function handler(e) {
          if (e.detail && e.detail.component === 'navbar-placeholder') {
            document.removeEventListener('componentInjected', handler);
            _activateCart();
          }
        });
      }
    }

    /* FIX: en index.html y cualquier otra página, corregir href del carrito */
    if (!enTienda && !enProducto && !enCarrito) {
      var cartLink = document.querySelector('.igb-cart');
      if (cartLink && (!cartLink.href || cartLink.href === '#' || cartLink.href.endsWith('#'))) {
        cartLink.href = '/carrito.html';
      }
    }

    if (enCarrito) {
      _renderPage();
      /* Montar widget shipping si está disponible */
      if (window.igShipping) {
        window.igShipping.mountCarrito('igcPanelShipping', _subtotal());
      }
    }
  });

})();