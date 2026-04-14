/* ═══════════════════════════════════════════════
   includes.js — InfraGo
   Inyecta navbar.html y footer.html en cualquier
   página. Solo añade esta línea antes de </body>:
   <script src="/assets/js/includes.js"></script>
═══════════════════════════════════════════════ */

(function () {

  /* ── 1. CARGAR FRAGMENTO HTML ── */
  async function loadFragment(url) {
    const res = await fetch(url);
    if (!res.ok) throw new Error('No se pudo cargar: ' + url);
    return res.text();
  }

  /* ── 2. INYECTAR NAVBAR ── */
  async function injectNavbar() {
    const html = await loadFragment('/navbar.html');

    // Crear contenedor y pegarlo al inicio del body
    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.insertBefore(wrapper, document.body.firstChild);

    // Inicializar lógica del hamburger menu
    initHamburger();
  }

  /* ── 3. INYECTAR FOOTER ── */
  async function injectFooter() {
    const html = await loadFragment('/footer.html');

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);
  }

  /* ── 4. HAMBURGER MENU ── */
  function initHamburger() {
    const btn     = document.querySelector('.nav-hamburger');
    const menu    = document.getElementById('navMobileMenu');
    const overlay = document.getElementById('navMobileOverlay');

    if (!btn || !menu) return;

    function openMenu() {
      btn.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      if (overlay) overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
      btn.classList.remove('open');
      btn.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      if (overlay) overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    btn.addEventListener('click', () =>
      btn.classList.contains('open') ? closeMenu() : openMenu()
    );

    menu.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
    if (overlay) overlay.addEventListener('click', closeMenu);
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && btn.classList.contains('open')) closeMenu();
    });
  }

  /* ── 5. MARCAR LINK ACTIVO EN NAV ── */
  function setActiveNavLink() {
    const current = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .nav-mobile-menu a').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (href.includes(current) && !href.includes('#')) {
        a.style.color = '#ffffff';
        a.style.fontWeight = '700';
      }
    });
  }

  /* ── 6. INIT ── */
  async function init() {
    try {
      await injectNavbar();
      await injectFooter();
      setActiveNavLink();
    } catch (err) {
      console.warn('[includes.js]', err.message);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();