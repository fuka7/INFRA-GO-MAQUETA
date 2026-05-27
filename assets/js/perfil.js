/* ═══════════════════════════════════════════════
   perfil.js — ElevalCorp
   Lógica de la página de perfil de usuario
   © 2026 ElevalCorp SpA / TIC Managers
═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var profile = null;
  var _quotLoaded    = false;
  var _comprasLoaded = false;

  /* ── Helpers ── */
  function formatRut(v) {
    v = v.replace(/[^0-9kK]/g, '').toUpperCase();
    if (v.length <= 1) return v;
    var dv = v.slice(-1), body = v.slice(0, -1);
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return body + '-' + dv;
  }

  function fmtPeso(n) {
    return n != null ? '$ ' + Number(n).toLocaleString('es-CL') : '—';
  }

  /* ── Init ── */
  function init() {
    try { profile = JSON.parse(localStorage.getItem('ig_profile') || 'null'); } catch (e) {}
    if (!profile || !profile.email) { window.location.replace('/index.html'); return; }

    renderHero();
    fillForm();
    attachEvents();

    // Activar la pestaña indicada en el hash URL
    var hash = (window.location.hash || '').replace('#', '');
    if (hash && document.querySelector('.prf-tab[data-tab="' + hash + '"]')) {
      switchTab(hash);
    }
  }

  /* ── Hero ── */
  function renderHero() {
    var nombre   = (profile.nombre   || '').trim();
    var apellido = (profile.apellido || '').trim();
    var initials = nombre && apellido ? (nombre[0] + apellido[0]).toUpperCase()
                 : nombre ? nombre.slice(0, 2).toUpperCase()
                 : profile.email.slice(0, 2).toUpperCase();
    var displayName = nombre ? (nombre + (apellido ? ' ' + apellido : '')) : profile.email.split('@')[0];

    var avEl    = document.getElementById('prfAvatar');
    var nmEl    = document.getElementById('prfName');
    var emEl    = document.getElementById('prfEmail');
    var bdgEl   = document.getElementById('prfBadge');
    var bdgTxt  = document.getElementById('prfBadgeText');

    if (avEl)   avEl.textContent   = initials;
    if (nmEl)   nmEl.textContent   = displayName;
    if (emEl)   emEl.textContent   = profile.email;

    var badgeLabel = profile.razon_social || profile.cargo || '';
    if (bdgEl && bdgTxt && badgeLabel) {
      bdgTxt.textContent  = badgeLabel;
      bdgEl.style.display = '';
    }

    document.title = 'Mi perfil — ' + displayName + ' · ElevalCorp';
  }

  /* ── Formulario ── */
  function fillForm() {
    var map = {
      prfNombre:    'nombre',
      prfApellido:  'apellido',
      prfRut:       'rut',
      prfPhone:     'phone',
      prfEmail2:    'email',
      prfCargo:     'cargo',
      prfEmpresa:   'razon_social',
      prfGiro:      'giro',
      prfDireccion: 'direccion',
      prfRegion:    'region',
      prfCiudad:    'ciudad'
    };
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.value = profile[map[id]] || '';
    });
  }

  /* ── Eventos ── */
  function attachEvents() {
    // Pestañas
    document.querySelectorAll('.prf-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        switchTab(tab.dataset.tab);
        history.replaceState(null, '', '#' + tab.dataset.tab);
      });
    });

    // Formato RUT en tiempo real
    var rutEl = document.getElementById('prfRut');
    if (rutEl) rutEl.addEventListener('input', function () { rutEl.value = formatRut(rutEl.value); });

    // Submit formulario
    var form = document.getElementById('prfFormDatos');
    if (form) form.addEventListener('submit', function (e) { e.preventDefault(); saveData(); });
  }

  /* ── Pestañas ── */
  function switchTab(tab) {
    document.querySelectorAll('.prf-tab').forEach(function (t) {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    var capTab = tab.charAt(0).toUpperCase() + tab.slice(1);
    document.querySelectorAll('.prf-section').forEach(function (s) {
      s.classList.toggle('active', s.id === 'tab' + capTab);
    });
    if (tab === 'cotizaciones') loadCotizaciones();
    if (tab === 'compras')      loadCompras();
  }

  /* ── Guardar datos ── */
  function saveData() {
    var btn     = document.getElementById('prfSaveBtn');
    var saveMsg = document.getElementById('prfSaveMsg');
    if (!btn) return;

    btn.disabled = true;
    if (saveMsg) { saveMsg.className = 'prf-save-msg'; saveMsg.textContent = ''; }

    var fields = {
      nombre:       val('prfNombre'),
      apellido:     val('prfApellido'),
      rut:          val('prfRut'),
      phone:        val('prfPhone'),
      cargo:        val('prfCargo'),
      razon_social: val('prfEmpresa'),
      giro:         val('prfGiro'),
      direccion:    val('prfDireccion'),
      region:       val('prfRegion'),
      ciudad:       val('prfCiudad')
    };

    // Actualizar caché local inmediatamente
    Object.assign(profile, fields);
    try { localStorage.setItem('ig_profile', JSON.stringify(profile)); } catch (e) {}
    renderHero();

    function done(ok, msg) {
      btn.disabled = false;
      if (saveMsg) { saveMsg.textContent = msg; saveMsg.className = 'prf-save-msg ' + (ok ? 'ok' : 'err'); }
    }

    if (!window.supabase) { done(true, 'Cambios guardados localmente.'); return; }

    window.supabase.auth.getSession().then(function (res) {
      var session = res.data && res.data.session;
      if (!session) { done(false, 'No hay sesión activa.'); return; }

      Promise.all([
        window.supabase.from('profiles').update({
          rut:          fields.rut,
          phone:        fields.phone,
          razon_social: fields.razon_social,
          cargo:        fields.cargo,
          direccion:    fields.direccion,
          region:       fields.region,
          ciudad:       fields.ciudad
        }).eq('id', session.user.id),
        window.supabase.auth.updateUser({ data: { nombre: fields.nombre, apellido: fields.apellido, giro: fields.giro } })
      ]).then(function (results) {
        var err = (results[0] && results[0].error) || (results[1] && results[1].error);
        done(!err, err ? 'Error al guardar. Intenta de nuevo.' : 'Cambios guardados correctamente.');
      }).catch(function () { done(false, 'Error de conexión.'); });
    });
  }

  /* ── Cotizaciones ── */
  function loadCotizaciones() {
    if (_quotLoaded) return;

    var loadEl  = document.getElementById('prfQuotLoading');
    var gridEl  = document.getElementById('prfQuotGrid');
    var emptyEl = document.getElementById('prfQuotEmpty');
    if (!loadEl) return;

    function renderItems(items) {
      loadEl.style.display = 'none';
      if (!items || !items.length) {
        if (emptyEl) emptyEl.style.display = '';
        return;
      }
      _quotLoaded = true;
      if (!gridEl) return;
      gridEl.style.display = '';
      gridEl.innerHTML = items.map(function(q) {
        var rawFecha = q.fecha || q.created_at || null;
        var fecha    = rawFecha
          ? new Date(rawFecha).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' })
          : '—';
        var empresa = esc(q.empresa || '—');

        var rows = '';
        if (q.total_productos) rows += '<div class="prf-quot-row"><span>Equipos (neto)</span><span>'    + fmtPeso(q.total_productos) + '</span></div>';
        if (q.total_servicios) rows += '<div class="prf-quot-row"><span>Servicios/mes (neto)</span><span>' + fmtPeso(q.total_servicios) + '</span></div>';
        if (q.total_despacho)  rows += '<div class="prf-quot-row"><span>Despacho</span><span>'          + fmtPeso(q.total_despacho)  + '</span></div>';
        if (q.cuota)           rows += '<div class="prf-quot-row prf-quot-row--fin"><span>' + (q.plazo || 24) + ' cuotas · ' + (q.tasa || 12) + '% anual</span><span>~' + fmtPeso(q.cuota) + '/mes</span></div>';

        var pdfBtn = q.id
          ? '<button class="prf-quot-pdf-btn" onclick="window._abrirCotizacionPDF(\'' + esc(String(q.id)) + '\')">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="12" height="12">' +
              '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
              '<polyline points="14 2 14 8 20 8"/></svg> Ver PDF</button>'
          : '';

        return '<div class="prf-quot-card">' +
          '<div class="prf-quot-top">' +
            '<span class="prf-quot-empresa">' + empresa + '</span>' +
            '<span class="prf-quot-date">' + fecha + '</span>' +
          '</div>' +
          (rows ? '<div class="prf-quot-breakdown">' + rows + '</div>' : '') +
          '<div class="prf-quot-footer">' +
            '<div class="prf-quot-total">' + fmtPeso(q.total_general) + '</div>' +
            pdfBtn +
          '</div>' +
        '</div>';
      }).join('');
    }

    function loadLocal() {
      var all = [];
      try { all = JSON.parse(localStorage.getItem('ig_cotizaciones') || '[]'); } catch(e) {}
      return all.filter(function(c) { return !c.email || c.email === profile.email; });
    }

    function fetchSupabase() {
      window.supabase
        .from('cotizaciones')
        .select('id, empresa, total_general, total_productos, total_servicios, created_at')
        .eq('email', profile.email)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(function(res) {
          var sItems = (!res.error && res.data && res.data.length) ? res.data : [];
          var local  = loadLocal();

          // Merge: local primero (tienen más datos), agregar de Supabase lo que no esté local
          var merged = local.slice();
          sItems.forEach(function(si) {
            var exists = merged.some(function(li) { return String(li.id) === String(si.id); });
            if (!exists) {
              merged.push({ id: String(si.id), fecha: si.created_at, empresa: si.empresa,
                email: profile.email, total_general: si.total_general,
                total_productos: si.total_productos, total_servicios: si.total_servicios });
            }
          });
          merged.sort(function(a, b) {
            return new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at);
          });
          renderItems(merged);
        })
        .catch(function() { renderItems(loadLocal()); });
    }

    if (window.supabase && profile && profile.email) {
      fetchSupabase();
    } else {
      loadEl.style.display = 'none';
      renderItems(loadLocal());
    }
  }

  /* Exponer globalmente para los botones onclick del grid */
  window._abrirCotizacionPDF = function(id) {
    var html = null;
    try { html = localStorage.getItem('ig_cot_pdf_' + id); } catch(e) {}
    if (!html) {
      alert('El PDF de esta cotización no está disponible.\nEnvía la cotización desde el configurador para generarlo.');
      return;
    }
    var win = window.open('', '_blank');
    if (!win) { alert('Permite las ventanas emergentes para ver el PDF.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  /* ── Compras (pedidos tienda) ── */
  function loadCompras() {
    if (_comprasLoaded) return;

    var loadEl  = document.getElementById('prfComprasLoading');
    var gridEl  = document.getElementById('prfComprasGrid');
    var emptyEl = document.getElementById('prfComprasEmpty');
    if (!loadEl) return;

    var METODOS = { transferencia:'Transferencia', tarjeta:'Tarjeta', bchileMC:'Banco Chile',
                    santanderVisa:'Santander', klap:'Klap', mercadopago:'MercadoPago', kiphu:'Kiphu' };

    function renderPedidos(items) {
      loadEl.style.display = 'none';
      if (!items || !items.length) {
        if (emptyEl) emptyEl.style.display = '';
        return;
      }
      _comprasLoaded = true;
      if (!gridEl) return;
      gridEl.style.display = '';
      gridEl.innerHTML = items.map(function(p) {
        var rawFecha    = p.fecha || p.created_at || null;
        var fecha       = rawFecha ? new Date(rawFecha).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' }) : '—';
        var metodo      = METODOS[p.metodo_pago] || p.metodo_pago || '—';
        var estado      = p.estado || 'pendiente';
        var estadoClass = estado === 'completado' ? 'prf-estado-completado' : estado === 'cancelado' ? 'prf-estado-cancelado' : 'prf-estado-pendiente';
        var estadoLabel = estado.charAt(0).toUpperCase() + estado.slice(1);

        var itemsList = p.items || [];
        if (typeof itemsList === 'string') { try { itemsList = JSON.parse(itemsList); } catch(e) { itemsList = []; } }
        var MAX_SHOW  = 3;
        var itemsHtml = itemsList.slice(0, MAX_SHOW).map(function(it) {
          return '<div class="prf-compra-item">' + esc(it.nombre || it.name || '') +
                 ' <span style="color:rgba(17,17,17,0.4)">× ' + (it.qty || 1) + '</span></div>';
        }).join('');
        if (itemsList.length > MAX_SHOW) {
          itemsHtml += '<div class="prf-compra-more">+ ' + (itemsList.length - MAX_SHOW) +
                       ' producto' + (itemsList.length - MAX_SHOW > 1 ? 's' : '') + ' más</div>';
        }

        var despacho = p.comuna ? (p.comuna + (p.region ? ', ' + p.region : '')) : '';

        var boletaBtn = p.id
          ? '<button class="prf-quot-pdf-btn" onclick="window._abrirBoletaPDF(\'' + esc(String(p.id)) + '\')">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="12" height="12">' +
              '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
              '<polyline points="14 2 14 8 20 8"/></svg> Ver Boleta</button>'
          : '';

        return '<div class="prf-quot-card">' +
          '<div class="prf-quot-top">' +
            '<span class="prf-quot-empresa">' + fecha + '</span>' +
            '<span class="prf-estado-badge ' + estadoClass + '">' + estadoLabel + '</span>' +
          '</div>' +
          (itemsHtml ? '<div class="prf-compra-items">' + itemsHtml + '</div>' : '') +
          '<div class="prf-compra-meta">' +
            '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11">' +
            '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' + esc(metodo) + '</span>' +
            (despacho ? '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11">' +
            '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
            esc(despacho) + '</span>' : '') +
          '</div>' +
          '<div class="prf-quot-footer">' +
            '<div class="prf-quot-total">' + fmtPeso(p.total) + '</div>' +
            boletaBtn +
          '</div>' +
        '</div>';
      }).join('');
    }

    function loadLocalPedidos() {
      var all = [];
      try { all = JSON.parse(localStorage.getItem('ig_pedidos') || '[]'); } catch(e) {}
      return all.filter(function(p) { return !p.email || p.email === profile.email; });
    }

    function fetchSupabase() {
      window.supabase
        .from('pedidos')
        .select('id, nombre, apellido, items, subtotal, total_svc, envio, total, metodo_pago, estado, direccion, region, comuna, created_at')
        .eq('email', profile.email)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(function(res) {
          var sItems = (!res.error && res.data && res.data.length) ? res.data : [];
          var local  = loadLocalPedidos();

          var merged = local.slice();
          sItems.forEach(function(si) {
            var exists = merged.some(function(li) { return String(li.id) === String(si.id); });
            if (!exists) {
              merged.push({
                id: String(si.id), fecha: si.created_at, nombre: si.nombre, apellido: si.apellido,
                email: profile.email, metodo_pago: si.metodo_pago, estado: si.estado,
                items: si.items, subtotal: si.subtotal, total_svc: si.total_svc,
                envio: si.envio, total: si.total, region: si.region, comuna: si.comuna
              });
            }
          });
          merged.sort(function(a, b) {
            return new Date(b.fecha || b.created_at) - new Date(a.fecha || a.created_at);
          });
          renderPedidos(merged);
        })
        .catch(function() { renderPedidos(loadLocalPedidos()); });
    }

    if (window.supabase && profile && profile.email) {
      fetchSupabase();
    } else {
      loadEl.style.display = 'none';
      renderPedidos(loadLocalPedidos());
    }
  }

  window._abrirBoletaPDF = function(id) {
    var html = null;
    try { html = localStorage.getItem('ig_pedido_boleta_' + id); } catch(e) {}
    if (!html) {
      alert('La boleta de este pedido no está disponible.\nSolo se generan boletas para compras realizadas desde este navegador.');
      return;
    }
    var win = window.open('', '_blank');
    if (!win) { alert('Permite las ventanas emergentes para ver la boleta.'); return; }
    win.document.write(html);
    win.document.close();
    win.focus();
  };

  function esc(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── Helper: leer valor de input ── */
  function val(id) {
    var el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
  }

  /* ── Arranque ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
