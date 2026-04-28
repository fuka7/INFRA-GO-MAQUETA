/**
 * ════════════════════════════════════════════════════════════
 * NAVBAR — InfraGo (inline, sin fetch)
 * ════════════════════════════════════════════════════════════
 */
(function () {

  var NAVBAR_HTML = `<!-- ╔══════════════════════════════════════════════════╗
     NAVBAR — InfraGo
     Inyectado por /assets/js/navbar-inline.js en todas las páginas
     ╚══════════════════════════════════════════════════╝ -->

<!-- BARRA SUPERIOR -->
<div class="igb-top">
  <span>🚚 Despacho GRATIS en Santiago en compras desde $75.000 — <button class="igb-top-link" onclick="igbOpenComunas()">Ver comunas</button></span>
</div>

<!-- MODAL COMUNAS -->
<div class="igb-comunas-overlay" id="igbComunasOverlay" onclick="igbCloseComunas()"></div>
<div class="igb-comunas-modal" id="igbComunasModal" role="dialog" aria-modal="true" aria-label="Comunas con despacho gratis">
  <div class="igb-comunas-header">
    <div class="igb-comunas-title">
      <span>🚚 Despacho Gratis en Santiago</span>
    </div>
    <button class="igb-comunas-close" onclick="igbCloseComunas()" aria-label="Cerrar">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>
  </div>
  <div class="igb-comunas-body">
    <p class="igb-comunas-desc">Ofrecemos despacho gratuito de 2 a 4 días hábiles a las siguientes comunas de Santiago, en compras iguales o superiores a <strong>$75.000</strong> pagando por transferencia bancaria.</p>
    <h3 class="igb-comunas-subtitle">¿Qué comunas tienen despacho gratis?</h3>
    <ul class="igb-comunas-list">
      <li>Cerrillos</li><li>Cerro Navia</li><li>Estación Central</li>
      <li>Huechuraba</li><li>Independencia</li><li>La Florida</li>
      <li>La Reina</li><li>Las Condes</li><li>Lo Barnechea <span class="igb-comunas-note">*</span></li>
      <li>Lo Prado</li><li>Macul</li><li>Maipú</li>
      <li>Ñuñoa</li><li>Pedro Aguirre Cerda</li><li>Peñalolén</li>
      <li>Providencia</li><li>Puente Alto</li><li>Pudahuel</li>
      <li>Quilicura</li><li>Quinta Normal</li><li>Recoleta</li>
      <li>Renca</li><li>San Bernardo</li><li>San Joaquín</li>
      <li>San Miguel</li><li>Santiago Centro</li><li>Vitacura</li>
    </ul>
    <p class="igb-comunas-footnote">* Lo Barnechea no incluye el sector de Farellones (centros de ski).</p>
    <div class="igb-comunas-footer">
      <div class="igb-comunas-req">
        <div class="igb-comunas-req-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Compra mínima de $75.000
        </div>
        <div class="igb-comunas-req-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          Pago por transferencia bancaria
        </div>
        <div class="igb-comunas-req-item">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
          2 a 4 días hábiles de entrega
        </div>
      </div>
    </div>
  </div>
</div>

<!-- NAVBAR ÚNICO -->
<header class="igb-main">

  <a class="igb-logo" href="/index.html">
    Infra<span>Go</span>
  </a>

  <!-- Dropdown categorías -->
  <div class="igb-categories" id="igbCats">
    <button class="igb-cat-trigger" type="button" onclick="igbToggleCats()">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <line x1="3" y1="6" x2="21" y2="6"/>
        <line x1="3" y1="12" x2="21" y2="12"/>
        <line x1="3" y1="18" x2="21" y2="18"/>
      </svg>
      Categorías
      <svg class="igb-chevron" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <div class="igb-dropdown">
      <a class="igb-dropdown-item" href="/tienda.html?cat=pc">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="4" y="2" width="8" height="20" rx="1"/><circle cx="8" cy="18" r="1"/><rect x="5" y="5" width="6" height="4" rx="0.5"/>
        </svg>
        PC
      </a>
      <a class="igb-dropdown-item" href="/tienda.html?cat=notebooks">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
        </svg>
        Notebooks
      </a>
      <a class="igb-dropdown-item" href="/tienda.html?cat=servidores">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><path d="M6 6h.01M6 18h.01"/>
        </svg>
        Servidores
      </a>
      <a class="igb-dropdown-item" href="/tienda.html?cat=impresoras">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>
        </svg>
        Impresoras
      </a>
      <a class="igb-dropdown-item" href="/tienda.html?cat=redes">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <circle cx="12" cy="5" r="3"/><circle cx="5" cy="19" r="3"/><circle cx="19" cy="19" r="3"/><path d="M12 8v3M8.5 17l3.5-6M15.5 17L12 11"/>
        </svg>
        Redes
      </a>
      <a class="igb-dropdown-item" href="/tienda.html?cat=accesorios">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
          <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-4 0v2M8 11h.01M12 11h.01"/>
        </svg>
        Accesorios
      </a>
    </div>
  </div>

  <!-- Links principales -->
  <ul class="igb-links">
    <li><a href="/index.html">Inicio</a></li>
    <li><a href="/configurador.html" onclick="return igbCotizar(event)">Configurador</a></li>
    <li><a href="/tienda.html">Tienda Virtual</a></li>
  </ul>

  <div class="igb-actions">
    <a class="igb-cta igb-cta-header" href="https://outlook.office.com/book/InfraGo@ticmanagers.cl/" target="_blank">
      Agendar reunión
    </a>

    <!-- Carrito — visible solo en tienda.html y producto.html via carrito.js -->
    <a class="igb-cart" href="/carrito.html" style="display:none;">
      <div class="igb-cart-wrap">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 01-8 0"/>
        </svg>
        <span class="igb-cart-count" style="display:none;">0</span>
      </div>
      <span><small>Mi</small><strong>Carro</strong></span>
    </a>

    <a class="igb-account" href="#">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
      <span class="igb-account-text">
        <small>Iniciar Sesión</small>
        <strong>Mi cuenta</strong>
      </span>
    </a>
  </div>

  <!-- Hamburguesa mobile -->
  <button class="igb-burger" type="button" onclick="igbToggleMenu()" aria-label="Menú">
    <span></span><span></span><span></span>
  </button>

</header>


<!-- MENÚ MOBILE -->
<div class="igb-overlay" id="igbOverlay" onclick="igbCloseMenu()"></div>
<div class="igb-mobile" id="igbMobile">
  <a href="/index.html">Inicio</a>
  <a href="/configurador.html" onclick="return igbCotizar(event)">Configurador</a>
  <a href="/tienda.html">Tienda Virtual</a>
  <hr class="igb-mobile-sep">
  <a href="/tienda.html?cat=pc">PC</a>
  <a href="/tienda.html?cat=notebooks">Notebooks</a>
  <a href="/tienda.html?cat=servidores">Servidores</a>
  <a href="/tienda.html?cat=impresoras">Impresoras</a>
  <a href="/tienda.html?cat=redes">Redes</a>
  <a href="/tienda.html?cat=accesorios">Accesorios</a>
  <a class="igb-cta" href="https://outlook.office.com/book/InfraGo@ticmanagers.cl/" target="_blank">
    Agendar reunión
  </a>
</div>`;

  function injectNavbar() {
    var placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = NAVBAR_HTML;

    document.dispatchEvent(new CustomEvent('componentInjected', {
      detail: { component: 'navbar-placeholder' }
    }));
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNavbar);
  } else {
    injectNavbar();
  }

})();