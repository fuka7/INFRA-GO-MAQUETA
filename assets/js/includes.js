/**
 * ════════════════════════════════════════════════════════════
 * INYECTOR DE COMPONENTES REUTILIZABLES — InfraGo
 * ════════════════════════════════════════════════════════════
 *
 * Las funciones del navbar viven en navbar-functions.js
 * (cargado via loadScript). No se re-ejecutan scripts inline.
 */

(function () {
  'use strict';

  /**
   * Carga un script externo de forma asincrónica
   */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      // Evitar cargar el mismo script dos veces
      if (document.querySelector('script[src="' + src + '"]')) {
        resolve();
        return;
      }
      var script = document.createElement('script');
      script.src = src;
      script.onload = function () { resolve(); };
      script.onerror = function () { reject(new Error('Failed to load: ' + src)); };
      document.head.appendChild(script);
    });
  }

  /**
   * Intenta fetch con la ruta dada; si falla, prueba con ruta relativa
   */
  async function fetchComponent(filePath) {
    // Intento 1: ruta absoluta (ej: /navbar.html)
    try {
      var res = await fetch(filePath);
      if (res.ok) return await res.text();
    } catch (e) { /* silencioso */ }

    // Intento 2: ruta relativa (quita la barra inicial)
    var relativePath = filePath.replace(/^\//, '');
    try {
      var res2 = await fetch(relativePath);
      if (res2.ok) return await res2.text();
    } catch (e) { /* silencioso */ }

    throw new Error('No se pudo cargar: ' + filePath);
  }

  /**
   * Inyecta un componente HTML en un placeholder
   */
  async function injectComponent(placeholderId, filePath, callback) {
    var placeholder = document.getElementById(placeholderId);

    if (!placeholder) {
      console.warn('[InfraGo Includes] Placeholder no encontrado: #' + placeholderId);
      return;
    }

    try {
      var html = await fetchComponent(filePath);

      // Limpiar scripts inyectados por Live Server antes de parsear
      // (Live Server corrompe SVGs al meter su script de WebSocket)
      html = html.replace(/<script[^>]*>[\s\S]*?WebSocket[\s\S]*?<\/script>/gi, '');

      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');
      placeholder.innerHTML = '';
      Array.from(doc.body.childNodes).forEach(function(node) {
        try { placeholder.appendChild(document.importNode(node, true)); }
        catch(e) { /* nodo inválido, ignorar */ }
      });

      if (typeof callback === 'function') {
        callback();
      }

      document.dispatchEvent(
        new CustomEvent('componentInjected', {
          detail: { component: placeholderId, path: filePath }
        })
      );

    } catch (error) {
      console.error('[InfraGo Includes] Error cargando ' + filePath + ':', error);
      placeholder.innerHTML =
        '<p style="color:red;padding:10px;font-size:12px;">' +
        '[InfraGo] Error cargando ' + placeholderId + '. Revisa la consola.</p>';
    }
  }

  /**
   * Inicializa la inyección de navbar y footer
   */
  function initializeIncludes() {
    // Navbar → luego carga navbar-functions.js
    injectComponent('navbar-placeholder', '/navbar.html', async function () {
      try {
        await loadScript('/assets/js/navbar-functions.js');
      } catch (err) {
        console.warn('[InfraGo Includes] navbar-functions.js no cargó:', err);
      }
    });

    // Footer
    injectComponent('footer-placeholder', '/footer.html', function () {
      if (typeof initFooterFunctions === 'function') {
        initFooterFunctions();
      }
    });
  }

  // API pública
  window.InfraGo = window.InfraGo || {};
  window.InfraGo.injectComponent = injectComponent;

  // Arrancar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIncludes);
  } else {
    initializeIncludes();
  }

})();
