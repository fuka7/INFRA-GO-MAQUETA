/**
 * ════════════════════════════════════════════════════════════
 * NAVBAR — InfraGo (inline, sin fetch, sin parpadeo)
 * ════════════════════════════════════════════════════════════
 */
(function () {

  // Obtener perfil cacheado ANTES de generar navbar
  var cachedProfile = null;
  try { cachedProfile = JSON.parse(localStorage.getItem('ig_profile') || 'null'); } catch(e) {}

  // Generar HTML del account sin parpadeo
  var accountHTML = '';
  var accountHTMLMobile = '';
  if (cachedProfile && cachedProfile.email) {
    var nombre = (cachedProfile.nombre || '').trim();
    var apellido = (cachedProfile.apellido || '').trim();
    var initials = nombre && apellido
      ? (nombre[0] + apellido[0]).toUpperCase()
      : nombre
        ? nombre.slice(0, 2).toUpperCase()
        : cachedProfile.email.slice(0, 2).toUpperCase();
    var displayName = nombre
      ? (nombre + (apellido ? ' ' + apellido : ''))
      : cachedProfile.email.split('@')[0];
    accountHTML = '<span style="width:32px;height:32px;background:#FF7A00;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Montserrat,sans-serif;font-weight:800;font-size:12px;color:#fff;flex-shrink:0;">' + initials + '</span>' +
      '<span class="igb-account-text"><small>Sesión activa</small><strong>' + displayName + '</strong></span>';
    accountHTMLMobile = '<div class="igb-mobile-account"><div class="igb-mobile-account-row"><div class="igb-mobile-account-avatar">' + initials + '</div><div class="igb-mobile-account-info"><div class="igb-mobile-account-name">' + displayName + '</div><div class="igb-mobile-account-sub">Sesión activa</div></div></div><div class="igb-mobile-account-actions"><button onclick="igbOpenProfile()" class="igb-mobile-profile-btn">Mi perfil</button><button onclick="igbLogout()" class="igb-mobile-logout">Cerrar sesión</button></div></div>';
  } else {
    accountHTML = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
      '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>' +
      '<circle cx="12" cy="7" r="4"/>' +
      '</svg>' +
      '<span class="igb-account-text"><small>Iniciar Sesión</small><strong>Mi cuenta</strong></span>';
    accountHTMLMobile = '<div style="margin-top:8px;"><button onclick="igbMobileLogin()" class="igb-mobile-login-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Iniciar Sesión</button></div>';
  }

  var NAVBAR_HTML = `<!-- ╔══════════════════════════════════════════════════╗
     NAVBAR — InfraGo
     Inyectado por /assets/js/navbar-inline.js en todas las páginas
     ╚══════════════════════════════════════════════╝ -->

<!-- BARRA SUPERIOR -->
<div class="igb-top">
  <span class="igb-top-full">🚚 Despacho GRATIS en Santiago en compras desde $75.000 — <button class="igb-top-link" onclick="igbOpenComunas()">Ver comunas</button></span><span class="igb-top-short">🚚 Envío GRATIS +$75.000 — <button class="igb-top-link" onclick="igbOpenComunas()">Ver comunas</button></span>
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
    <img src="/img/logo infrago.png" alt="InfraGo" class="igb-logo-img">
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
    <li><a href="/servicios.html">Nuestros Servicios</a></li>
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

    <a class="igb-account" href="#" onclick="return igbHandleAccount(event);">
      ${accountHTML}
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
  <span class="igb-mobile-section-label">Menú</span>
  <a href="/index.html">Inicio</a>
  <a href="/configurador.html" onclick="return igbCotizar(event)">Configurador</a>
  <a href="/tienda.html">Tienda Virtual</a>
  <a href="/servicios.html">Nuestros Servicios</a>
  <a class="igb-mobile-cart" id="igbMobileCart" href="/carrito.html" style="display:none;">
    <span class="igb-mobile-cart-icon">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
        <line x1="3" y1="6" x2="21" y2="6"/>
        <path d="M16 10a4 4 0 01-8 0"/>
      </svg>
      <span class="igb-cart-count" style="display:none;">0</span>
    </span>
    <span class="igb-mobile-cart-label">Mi Carro</span>
  </a>
  <hr class="igb-mobile-sep">
  <span class="igb-mobile-section-label">Categorías</span>
  <a href="/tienda.html?cat=pc">PC</a>
  <a href="/tienda.html?cat=notebooks">Notebooks</a>
  <a href="/tienda.html?cat=servidores">Servidores</a>
  <a href="/tienda.html?cat=impresoras">Impresoras</a>
  <a href="/tienda.html?cat=redes">Redes</a>
  <a href="/tienda.html?cat=accesorios">Accesorios</a>
  <a href="https://outlook.office.com/book/InfraGo@ticmanagers.cl/" target="_blank" class="igb-mobile-action-btn">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
    Agendar reunión
  </a>
  <div id="igbMobileAccount">${accountHTMLMobile}</div>
</div>`;

  function injectNavbar() {
    var placeholder = document.getElementById('navbar-placeholder');
    if (!placeholder) return;
    placeholder.innerHTML = NAVBAR_HTML;

    // Establecer estado en atributo data
    var accountLink = document.querySelector('.igb-account');
    if (accountLink) {
      accountLink.dataset.igbState = cachedProfile && cachedProfile.email ? 'logged' : 'guest';
    }

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

/* ════════════════════════════════════════════════════════════
   FUNCIONES NAVBAR GLOBAL — Modal de comunas y menú
════════════════════════════════════════════════════════════ */
function igbOpenComunas(){
  document.getElementById('igbComunasOverlay').classList.add('open');
  document.getElementById('igbComunasModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function igbCloseComunas(){
  document.getElementById('igbComunasOverlay').classList.remove('open');
  document.getElementById('igbComunasModal').classList.remove('open');
  document.body.style.overflow='';
}
function igbToggleCats(){
  document.getElementById('igbCats').classList.toggle('open');
}
function igbToggleMenu(){
  var btn=document.querySelector('.igb-burger');
  var menu=document.getElementById('igbMobile');
  var ov=document.getElementById('igbOverlay');
  var open=menu.classList.toggle('open');
  if(btn)btn.classList.toggle('open',open);
  if(ov)ov.classList.toggle('open',open);
  document.body.style.overflow=open?'hidden':'';
  igbSetWidgetsBlocked(open);
}
function igbSetWidgetsBlocked(block){
  var selectors = [
    'body > iframe',
    'body > div > iframe',
    'body > div[id*="assist"]',
    'body > div[id*="chat"]',
    'body > div[class*="assist"]',
    'body > div[class*="widget"]',
    '.wsp-fab'
  ];
  document.querySelectorAll(selectors.join(',')).forEach(function(el){
    el.style.visibility = block ? 'hidden' : '';
    el.style.pointerEvents = block ? 'none' : '';
  });
}
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){
    igbCloseMenu();
    igbCloseComunas();
  }
});
function igbCloseMenu(){
  var btn=document.querySelector('.igb-burger');
  var menu=document.getElementById('igbMobile');
  var ov=document.getElementById('igbOverlay');
  menu.classList.remove('open');
  ov.classList.remove('open');
  if(btn)btn.classList.remove('open');
  document.body.style.overflow='';
  igbSetWidgetsBlocked(false);
}
function igbSearch(){
  var q=document.querySelector('.igb-search-input').value.trim();
  if(q) window.location.href='/tienda.html?q='+encodeURIComponent(q);
}
function igbCotizar(e){
  var p=null;try{p=JSON.parse(localStorage.getItem('ig_profile')||'null');}catch(_){}
  if(p&&p.email) return true; // sesión cacheada → navegar normal
  if(e) e.preventDefault();
  if(window.igbAuth) window.igbAuth.open('login','/configurador.html');
  return false;
}
function igbHandleAccount(e){
  e.preventDefault();
  e.stopPropagation();
  var btn = e.target.closest('.igb-account');
  if(!btn) return false;

  var state = btn.dataset.igbState;
  var attempts = 0;
  var tryAct = function() {
    if(window.igbAuth && window.igbAuth.open) {
      if(state === 'logged') {
        window.igbAuth.toggleAcctDropdown(btn);
      } else {
        window.igbAuth.open('login');
      }
    } else if(attempts < 50) {
      attempts++;
      setTimeout(tryAct, 2);
    }
  };
  tryAct();
  return false;
}
function igbLogout(){
  igbCloseMenu();
  if(window.supabase && window.supabase.auth){
    window.supabase.auth.signOut().then(function(){
      localStorage.removeItem('ig_profile');
      location.reload();
    });
  } else {
    localStorage.removeItem('ig_profile');
    location.reload();
  }
}
function igbMobileLogin(){
  igbCloseMenu();
  var attempts = 0;
  var tryOpen = function(){
    if(window.igbAuth && window.igbAuth.open){
      window.igbAuth.open('login');
    } else if(attempts < 100){
      attempts++;
      setTimeout(tryOpen, 10);
    }
  };
  tryOpen();
}
function igbOpenProfile(){
  igbCloseMenu();
  window.location.href = '/perfil.html';
}
// Cerrar menú mobile al redimensionar a pantalla grande
window.addEventListener('resize', function(){
  if(window.innerWidth > 1024){
    igbCloseMenu();
  }
});
document.addEventListener('DOMContentLoaded',function(){
  var search = document.querySelector('.igb-search-input');
  if(search) search.addEventListener('keydown',function(e){
    if(e.key==='Enter') igbSearch();
  });
});
