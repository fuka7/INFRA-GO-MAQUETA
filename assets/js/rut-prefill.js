/* ═══════════════════════════════════════════════════════════════
   rut-prefill.js — InfraGo
   ───────────────────────────────────────────────────────────────
   Pre-rellena el paso 3 del configurador con los datos guardados
   en Supabase (profiles). Si razon_social está vacía, consulta
   SimpleAPI para obtenerla del SII y la guarda en el perfil.

   Depende de:
   · window.supabase   — cliente Supabase (config.js)
   · window.igbAuth    — auth.js expone .current() y .getProfileCache()

   Se incluye DESPUÉS de auth.js en configurador.html.
═══════════════════════════════════════════════════════════════ */

(function () {

  /* ── SimpleAPI key ──────────────────────────────────────────
     Reemplaza 'TU_API_KEY_AQUI' con tu key de simpleapi.cl
     Panel: https://simpleapi.cl/dashboard
     Plan gratuito: ~100 consultas/mes
  ─────────────────────────────────────────────────────────── */
  var SIMPLE_API_KEY = '3915-R940-6394-1466-0922';

  /* ── Campos del formulario paso 3 ──────────────────────────
     Mapa: id del <input> → clave en profiles
  ─────────────────────────────────────────────────────────── */
  var FIELD_MAP = {
    empresa:  'razon_social',
    telefono: 'phone',
    email:    'email',
    contacto: 'contacto',
    cargo:    'cargo',
    direccion:'direccion',
    ciudad:   'ciudad',
    region:   'region'
  };

  /* ════════════════════════════════════════════════════════════
     prefillStep3 — punto de entrada principal
     Llamado cuando el usuario llega al paso 3.
  ════════════════════════════════════════════════════════════ */
  window.igPrefillStep3 = async function igPrefillStep3() {
    var profile = _getProfile();
    if (!profile) return; // no hay sesión activa

    /* 1. Rellenar con lo que ya tenemos */
    _fillFields(profile);
    _showProfileBadge(profile);

    /* 2. Si no tenemos razón social, consultar SimpleAPI */
    if (!profile.razon_social && profile.rut && !profile.sii_fetched) {
      await _fetchRazonSocial(profile);
    }
  };

  /* ── Obtener perfil: primero caché, luego Supabase ────────── */
  function _getProfile() {
    /* Intentar caché localStorage primero (más rápido) */
    if (window.igbAuth && typeof window.igbAuth.getProfileCache === 'function') {
      var cached = window.igbAuth.getProfileCache();
      if (cached && cached.rut) return cached;
    }
    /* Fallback: current() del módulo auth */
    if (window.igbAuth && typeof window.igbAuth.current === 'function') {
      return window.igbAuth.current();
    }
    return null;
  }

  /* ── Rellenar campos del formulario ─────────────────────── */
  function _fillFields(profile) {
    Object.entries(FIELD_MAP).forEach(function(entry) {
      var fieldId = entry[0], profileKey = entry[1];
      var el = document.getElementById(fieldId);
      if (!el) return;
      var val = profile[profileKey] || '';
      if (!val) return; // no pisar placeholders con cadena vacía
      if (el.tagName === 'SELECT') {
        /* Intentar hacer match con las opciones existentes */
        var opts = Array.from(el.options);
        var match = opts.find(function(o) {
          return o.value === val || o.text === val ||
                 o.text.toLowerCase().includes(val.toLowerCase());
        });
        if (match) {
          el.value = match.value;
          el.dispatchEvent(new Event('change'));
        }
      } else {
        el.value = val;
      }
      /* Marcar campo como pre-rellenado */
      el.classList.add('ig-prefilled');
    });
  }

  /* ── Badge visual "Datos cargados desde tu perfil" ────────── */
  function _showProfileBadge(profile) {
    if (document.getElementById('ig-prefill-badge')) return;
    var formGrid = document.querySelector('.config-form-grid');
    if (!formGrid) return;

    var badge = document.createElement('div');
    badge.id = 'ig-prefill-badge';
    badge.className = 'ig-prefill-badge';
    badge.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">' +
        '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>' +
      '</svg>' +
      '<span>Datos cargados desde tu cuenta (<strong>' + _escHtml(profile.email) + '</strong>). ' +
      'Puedes editarlos antes de continuar.</span>' +
      '<span id="ig-prefill-rut" class="ig-prefill-rut">RUT: ' + _escHtml(profile.rut) + '</span>';

    formGrid.insertAdjacentElement('beforebegin', badge);
    _injectPrefillStyles();
  }

  /* ── Consultar SimpleAPI → razón social desde SII ─────────── */
  async function _fetchRazonSocial(profile) {
    var rutLimpio = (profile.rut || '').replace(/\./g, '').replace(/-/g, '').trim();
    if (!rutLimpio) return;

    /* Mostrar spinner en campo empresa */
    var empresaEl = document.getElementById('empresa');
    if (empresaEl) {
      empresaEl.placeholder = 'Consultando SII…';
      empresaEl.disabled = true;
    }

    try {
      var url = 'https://api.simpleapi.cl/api/v1/rut/' + encodeURIComponent(rutLimpio);
      var res = await fetch(url, {
        headers: {
          'x-api-key': SIMPLE_API_KEY,
          'Accept':    'application/json'
        }
      });

      if (!res.ok) throw new Error('HTTP ' + res.status);
      var data = await res.json();

      /* SimpleAPI devuelve: { razonSocial, actividad, direccion, comuna, region } */
      var razonSocial = data.razonSocial || data.nombre || data.name || '';
      var giroSII     = data.actividad   || data.giro   || '';
      var direccionSII = data.direccion  || '';
      var ciudadSII   = data.comuna      || '';
      var regionSII   = data.region      || '';

      if (razonSocial) {
        /* Rellenar en el formulario */
        if (empresaEl) empresaEl.value = razonSocial;
        if (direccionSII && !document.getElementById('direccion').value)
          document.getElementById('direccion').value = direccionSII;
        if (regionSII) {
          var regionEl = document.getElementById('region');
          if (regionEl) {
            var opts = Array.from(regionEl.options);
            var match = opts.find(function(o) {
              return o.text.toLowerCase().includes(regionSII.toLowerCase());
            });
            if (match && !regionEl.value) {
              regionEl.value = match.value;
              regionEl.dispatchEvent(new Event('change')); // puebla comunas
            }
          }
        }
        if (ciudadSII) {
          var ciudadEl = document.getElementById('ciudad');
          if (ciudadEl && !ciudadEl.value) {
            var comunaOpts = Array.from(ciudadEl.options);
            var comunaMatch = comunaOpts.find(function(o) {
              return o.text.toLowerCase() === ciudadSII.toLowerCase();
            });
            if (comunaMatch) {
              ciudadEl.value = comunaMatch.value;
              ciudadEl.dispatchEvent(new Event('change')); // cotiza despacho
            }
          }
        }

        /* Guardar en Supabase para no volver a consultar */
        _saveProfileToSupabase({
          razon_social: razonSocial,
          direccion:    direccionSII || profile.direccion,
          ciudad:       ciudadSII    || profile.ciudad,
          region:       regionSII    || profile.region,
          sii_fetched:  true
        });

        /* Guardar giro en user_metadata si vino del SII */
        if (giroSII && window.supabase) {
          window.supabase.auth.updateUser({ data: { giro: giroSII } });
        }

        /* Actualizar caché localStorage */
        var updatedProfile = Object.assign({}, profile, {
          razon_social: razonSocial,
          giro:         giroSII || profile.giro,
          sii_fetched:  true
        });
        try { localStorage.setItem('ig_profile', JSON.stringify(updatedProfile)); } catch(e) {}
      }
    } catch (err) {
      console.warn('[InfraGo] SimpleAPI error:', err.message);
      /* Falló la API — no bloquear al usuario, simplemente dejar el campo vacío */
    } finally {
      if (empresaEl) {
        empresaEl.disabled = false;
        if (!empresaEl.value) empresaEl.placeholder = 'Nombre de tu empresa';
      }
    }
  }

  /* ── Guardar campos actualizados en Supabase ─────────────── */
  async function _saveProfileToSupabase(fields) {
    if (!window.supabase) return;
    try {
      var session = await window.supabase.auth.getSession();
      var userId = session && session.data && session.data.session && session.data.session.user.id;
      if (!userId) return;
      await window.supabase.from('profiles').update(fields).eq('id', userId);
    } catch (e) {
      console.warn('[InfraGo] No se pudo guardar en Supabase:', e.message);
    }
  }

  /* ── Guardar paso 3 en profiles al avanzar al paso 4 ──────── */
  window.igSaveStep3ToProfile = async function igSaveStep3ToProfile() {
    var fields = {};
    Object.entries(FIELD_MAP).forEach(function(entry) {
      var fieldId = entry[0], profileKey = entry[1];
      var el = document.getElementById(fieldId);
      if (el) fields[profileKey] = el.value.trim();
    });
    /* No sobreescribir sii_fetched al guardar datos del formulario */
    await _saveProfileToSupabase(fields);
    /* Actualizar caché */
    try {
      var cached = JSON.parse(localStorage.getItem('ig_profile') || '{}');
      Object.assign(cached, fields);
      localStorage.setItem('ig_profile', JSON.stringify(cached));
    } catch(e) {}
  };

  /* ── Sanitizar HTML ──────────────────────────────────────── */
  function _escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── Estilos del badge y campos pre-rellenados ───────────── */
  function _injectPrefillStyles() {
    if (document.getElementById('ig-prefill-styles')) return;
    var style = document.createElement('style');
    style.id = 'ig-prefill-styles';
    style.textContent = [
      '.ig-prefill-badge {',
      '  display: flex; align-items: center; gap: 8px; flex-wrap: wrap;',
      '  background: linear-gradient(135deg,#eef4ff 0%,#f0f7ff 100%);',
      '  border: 1px solid #c4d7ff;',
      '  border-radius: 9px; padding: 10px 14px; margin-bottom: 16px;',
      '  font-size: 12px; color: #2d4a7a; line-height: 1.5;',
      '  animation: igBadgeIn .3s ease;',
      '}',
      '@keyframes igBadgeIn { from { opacity:0; transform:translateY(-6px); } to { opacity:1; transform:none; } }',
      '.ig-prefill-badge svg { flex-shrink:0; color:#1a4fa0; }',
      '.ig-prefill-badge span { flex:1; }',
      '.ig-prefill-rut {',
      '  flex:0 0 auto !important;',
      '  background:#1a4fa0; color:#fff !important;',
      '  border-radius:5px; padding:2px 9px;',
      '  font-size:11px; font-weight:700; letter-spacing:.3px;',
      '}',
      '.config-input.ig-prefilled {',
      '  border-color: #a3c2ff;',
      '  background: #f7faff;',
      '}',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ════════════════════════════════════════════════════════════
     HOOK EN EL WIZARD
     Detecta cuando el usuario llega al paso 3 y dispara el prefill.
     Se engancha en updateStepDisplay de configurador.js.
  ════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    /* Esperar a que configurador.js haya registrado updateStepDisplay */
    setTimeout(function () {
      var _origUpdateStep = window.updateStepDisplay;
      if (typeof _origUpdateStep !== 'function') return;

      window.updateStepDisplay = function () {
        _origUpdateStep.apply(this, arguments);
        /* Leer el paso activo DESPUÉS de que updateStepDisplay lo haya cambiado */
        var activeStep = document.querySelector('.wizard-step.active');
        if (activeStep && activeStep.dataset.step === '3') {
          window.igPrefillStep3();
        }
      };

      /* También guardar en profile cuando avanza del paso 3 al 4 */
      var _origNextStep = window.nextStep;
      if (typeof _origNextStep === 'function') {
        window.nextStep = function () {
          var activeStep = document.querySelector('.wizard-step.active');
          if (activeStep && activeStep.dataset.step === '3') {
            window.igSaveStep3ToProfile(); // fire-and-forget
          }
          _origNextStep.apply(this, arguments);
        };
      }
    }, 150);
  });

})();