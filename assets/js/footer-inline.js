/**
 * footer-inline.js — ElevalCorp
 * Inyecta el footer en todas las páginas via #footer-placeholder
 */
(function () {

  var FOOTER_HTML = `<div class="ig-footer-root">

  <!-- ── MAIN GRID ── -->
  <div class="footer-main">

    <!-- Marca -->
    <div class="footer-brand">
      <div class="brand-logo">
        <img src="/img/logo en blanco.png" alt="ElevalCorp" class="footer-logo-img">
      </div>
      <p class="brand-tagline">Operación TI inteligente. Sin fricción.<br>Una empresa de TIC Manager's.</p>
      <div class="brand-badges">
        <span class="badge">Partner HP</span>
        <span class="badge">Chile &amp; LATAM</span>
        <span class="badge">Soporte 24/7</span>
      </div>
    </div>

    <!-- Plataforma -->
    <div class="footer-col">
      <div class="col-label">Plataforma</div>
      <ul class="col-links">
        <li><a href="/configurador.html" onclick="return igbCotizar(event)">Configurador</a></li>
        <li><a href="/tienda.html">Tienda Virtual</a></li>
        <li><a href="/tienda.html?cat=notebooks">Notebooks</a></li>
        <li><a href="/tienda.html?cat=all-in-one">All in One</a></li>
        <li><a href="/tienda.html?cat=pcs">PCs de Escritorio</a></li>
      </ul>
    </div>

    <!-- Empresa -->
    <div class="footer-col">
      <div class="col-label">Empresa</div>
      <ul class="col-links">
        <li><a href="/index.html#por-que">Por qué ElevalCorp</a></li>
        <li><a href="/index.html#como-funciona">Cómo funciona</a></li>
        <li><a href="/index.html#catalogo">Catálogo</a></li>
        <li><a href="/index.html#financiamiento">Financiamiento</a></li>
        <li><a href="/index.html#faq">Preguntas frecuentes</a></li>
      </ul>
    </div>

    <!-- Contacto -->
    <div class="footer-col">
      <div class="col-label">Contacto</div>
      <ul class="col-links">
        <li>
          <a href="mailto:contacto@elevalcorp.cl" class="contact-item">
            <span class="contact-label">Email</span>
            <span class="contact-val">contacto@elevalcorp.cl</span>
          </a>
        </li>
        <li>
          <a href="https://outlook.office.com/book/InfraGo@ticmanagers.cl/" target="_blank" rel="noopener" class="contact-item">
            <span class="contact-label">Reuniones</span>
            <span class="contact-val">Agendar reunión</span>
          </a>
        </li>
        <li>
          <a href="https://maps.google.com/?q=Providencia+1208+Santiago+Chile" target="_blank" rel="noopener" class="contact-item">
            <span class="contact-label">Dirección</span>
            <span class="contact-val">Providencia 1208, Of. 307</span>
          </a>
        </li>
      </ul>
    </div>

  </div>

  <!-- ── BOTTOM ── -->
  <div class="footer-bottom">
    <div class="bottom-left">
      <span class="copyright">© 2026 ElevalCorp SpA. Todos los derechos reservados.</span>
      <span class="bottom-divider"></span>
      <span class="made-by">Una empresa de <span>TIC Manager's</span></span>
    </div>
    <div class="footer-socials">
      <a href="#" class="social-link">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
        LinkedIn
      </a>
      <span class="social-sep">·</span>
      <a href="#" class="social-link">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
        Instagram
      </a>
      <span class="social-sep">·</span>
      <a href="#" class="social-link">Términos</a>
      <span class="social-sep">·</span>
      <a href="#" class="social-link">Privacidad</a>
    </div>
  </div>

</div>`;

  function injectFooter() {
    var placeholder = document.getElementById('footer-placeholder');
    if (!placeholder) return;
    placeholder.outerHTML = FOOTER_HTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

})();
