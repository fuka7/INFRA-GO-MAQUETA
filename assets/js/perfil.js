/* ═══════════════════════════════════════════════
   perfil.js — InfraGo
   Lógica de la página de perfil de usuario
   © 2026 InfraGo SpA / TIC Managers
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

    document.title = 'Mi perfil — ' + displayName + ' · InfraGo';
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

    function fetch() {
      if (!window.supabase || !profile) {
        loadEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = '';
        return;
      }

      window.supabase
        .from('cotizaciones')
        .select('id, empresa, total_general, total_productos, total_servicios, created_at')
        .eq('email', profile.email)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(function (res) {
          loadEl.style.display = 'none';
          if (res.error || !res.data || !res.data.length) {
            if (emptyEl) emptyEl.style.display = '';
            return;
          }
          _quotLoaded = true;
          if (gridEl) {
            gridEl.style.display = '';
            gridEl.innerHTML = res.data.map(function (q) {
              var fecha   = q.created_at ? new Date(q.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
              var empresa = q.empresa || '—';
              var rows    = '';
              if (q.total_productos) rows += '<div class="prf-quot-row"><span>Productos</span><span>' + fmtPeso(q.total_productos) + '</span></div>';
              if (q.total_servicios) rows += '<div class="prf-quot-row"><span>Servicios</span><span>' + fmtPeso(q.total_servicios) + '</span></div>';
              return '<div class="prf-quot-card">' +
                '<div class="prf-quot-top">' +
                  '<span class="prf-quot-empresa">' + empresa + '</span>' +
                  '<span class="prf-quot-date">' + fecha + '</span>' +
                '</div>' +
                (rows ? '<div class="prf-quot-breakdown">' + rows + '</div>' : '') +
                '<div class="prf-quot-total">' + fmtPeso(q.total_general) + '</div>' +
              '</div>';
            }).join('');
          }
        }).catch(function () {
          loadEl.style.display = 'none';
          if (emptyEl) emptyEl.style.display = '';
        });
    }

    if (window.supabase) {
      fetch();
    } else {
      window.addEventListener('supabase:ready', fetch, { once: true });
    }
  }

  /* ── Compras (pedidos tienda) ── */
  function loadCompras() {
    if (_comprasLoaded) return;

    var loadEl  = document.getElementById('prfComprasLoading');
    var gridEl  = document.getElementById('prfComprasGrid');
    var emptyEl = document.getElementById('prfComprasEmpty');
    if (!loadEl) return;

    var METODOS = { transferencia:'Transferencia', tarjeta:'Tarjeta', bchileMC:'Banco Chile', santanderVisa:'Santander', klap:'Klap', mercadopago:'MercadoPago', kiphu:'Kiphu' };

    function fetch() {
      if (!window.supabase || !profile) {
        loadEl.style.display = 'none';
        if (emptyEl) emptyEl.style.display = '';
        return;
      }

      window.supabase
        .from('pedidos')
        .select('id, nombre, apellido, items, subtotal, total_svc, envio, total, metodo_pago, estado, direccion, region, comuna, created_at')
        .eq('email', profile.email)
        .order('created_at', { ascending: false })
        .limit(50)
        .then(function (res) {
          loadEl.style.display = 'none';
          if (res.error || !res.data || !res.data.length) {
            if (emptyEl) emptyEl.style.display = '';
            return;
          }
          _comprasLoaded = true;
          if (gridEl) {
            gridEl.style.display = '';
            gridEl.innerHTML = res.data.map(function (p) {
              var fecha   = p.created_at ? new Date(p.created_at).toLocaleDateString('es-CL', { day:'2-digit', month:'short', year:'numeric' }) : '—';
              var metodo  = METODOS[p.metodo_pago] || p.metodo_pago || '—';
              var estado  = p.estado || 'pendiente';
              var estadoClass = estado === 'completado' ? 'prf-estado-completado' : estado === 'cancelado' ? 'prf-estado-cancelado' : 'prf-estado-pendiente';
              var estadoLabel = estado.charAt(0).toUpperCase() + estado.slice(1);

              var items = [];
              try { items = JSON.parse(p.items || '[]'); } catch(e) {}
              var MAX_SHOW = 3;
              var itemsHtml = items.slice(0, MAX_SHOW).map(function(it) {
                return '<div class="prf-compra-item">' + esc(it.nombre) + ' <span style="color:rgba(17,17,17,0.4)">× ' + it.qty + '</span></div>';
              }).join('');
              if (items.length > MAX_SHOW) {
                itemsHtml += '<div class="prf-compra-more">+ ' + (items.length - MAX_SHOW) + ' producto' + (items.length - MAX_SHOW > 1 ? 's' : '') + ' más</div>';
              }

              var despacho = p.comuna ? (p.comuna + (p.region ? ', ' + p.region : '')) : '—';

              return '<div class="prf-quot-card">' +
                '<div class="prf-quot-top">' +
                  '<span class="prf-quot-empresa">' + fecha + '</span>' +
                  '<span class="prf-estado-badge ' + estadoClass + '">' + estadoLabel + '</span>' +
                '</div>' +
                (itemsHtml ? '<div class="prf-compra-items">' + itemsHtml + '</div>' : '') +
                '<div class="prf-compra-meta">' +
                  '<span>' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' +
                    metodo +
                  '</span>' +
                  (p.comuna ? '<span>' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                    esc(despacho) +
                  '</span>' : '') +
                '</div>' +
                '<div class="prf-quot-total">' + fmtPeso(p.total) + '</div>' +
              '</div>';
            }).join('');
          }
        }).catch(function () {
          loadEl.style.display = 'none';
          if (emptyEl) emptyEl.style.display = '';
        });
    }

    if (window.supabase) {
      fetch();
    } else {
      window.addEventListener('supabase:ready', fetch, { once: true });
    }
  }

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
