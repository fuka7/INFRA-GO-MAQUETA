/* ═══════════════════════════════════════════════════════════════
   shipping.js — ElevalCorp
   ───────────────────────────────────────────────────────────────
   Módulo de cotización de despacho.
   Usado en: configurador.html (paso 4) y tienda.html (carrito)

   Lógica:
   · Comunas con despacho GRATIS (lista predefinida, compra > $75.000)
   · Resto de Chile → cotización referencial via Shipit API
   · Si Shipit no responde → tabla de tarifas de respaldo

   Depende de:
   · SHIPIT_TOKEN — reemplaza con tu token de Shipit (shipit.cl)
   · window.supabase (opcional, para caché de tarifas)
═══════════════════════════════════════════════════════════════ */

(function () {

  /* ── Shipit token ───────────────────────────────────────────
     Regístrate en shipit.cl → Dashboard → API → Token
     Plan gratuito disponible para cotización.
  ─────────────────────────────────────────────────────────── */
  var SHIPIT_TOKEN = 'TU_TOKEN_SHIPIT_AQUI';

  /* ── Comunas RM con despacho gratuito ElevalCorp (compra > $75.000) ──
     Cubre el Gran Santiago urbano. Comunas rurales/periféricas (Alhué,
     Buin, Melipilla, etc.) van a tarifa normal de $3.900/caja.
  ─────────────────────────────────────────────────────────────────── */
  var COMUNAS_GRATIS = [
    // Centro y comunas urbanas consolidadas
    'santiago','providencia','vitacura','las condes','lo barnechea',
    'nunoa','la reina','macul','peñalolen','penalolen',
    // Poniente
    'cerrillos','cerro navia','estacion central','estación central',
    'huechuraba','independencia','lo prado','maipu','maipú',
    'padre aguirre cerda','pudahuel','quinta normal','renca',
    'san joaquin','san joaquín','san miguel',
    // Sur y suroriente
    'el bosque','la cisterna','la florida','la granja','la pintana',
    'lo espejo','pedro aguirre cerda','puente alto','san bernardo',
    'san ramon','san ramón','conchalí','conchali',
    // Norte
    'recoleta','quilicura',
  ];

  /* ── Origen de despacho ElevalCorp ── */
  var ORIGEN = {
    region:  'Región Metropolitana',
    comuna:  'Providencia',
    direccion: 'Providencia 1208'
  };

  /* ── Tarifas de respaldo si Shipit no responde ─────────────
     Fuente: tarifas referenciales couriers Chile 2025
  ─────────────────────────────────────────────────────────── */
  var TARIFAS_RESPALDO = {
    'Región de Arica y Parinacota': { precio: 23900, dias: '4-6' },
    'Región de Tarapacá':        { precio: 21900, dias: '4-6' },
    'Región de Antofagasta':     { precio: 19900, dias: '3-5' },
    'Región de Atacama':         { precio: 15900, dias: '3-5' },
    'Región de Coquimbo':        { precio:  9900, dias: '2-4' },
    'Región de Valparaíso':      { precio:  5900, dias: '2-3' },
    'Región Metropolitana':      { precio:  3900, dias: '1-2' },
    "Región de O'Higgins":       { precio:  4900, dias: '2-3' },
    'Región del Maule':          { precio:  7900, dias: '2-4' },
    'Región de Ñuble':           { precio:  8900, dias: '2-4' },
    'Región del Biobío':         { precio:  9900, dias: '2-4' },
    'Región de La Araucanía':    { precio: 12900, dias: '3-5' },
    'Región de Los Ríos':        { precio: 15900, dias: '3-5' },
    'Región de Los Lagos':       { precio: 17900, dias: '3-5' },
    'Región de Aysén':           { precio: 24900, dias: '5-7' },
    'Región de Magallanes':      { precio: 25900, dias: '5-8' },
  };

  /* ── Normalizar texto para comparación ── */
  function _norm(str) {
    return (str || '').toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .trim();
  }

  /* ── ¿Es comuna con despacho gratis? ── */
  function esComunaGratis(comuna) {
    var n = _norm(comuna);
    return COMUNAS_GRATIS.some(function(c) { return _norm(c) === n; });
  }
  window.igShipping = window.igShipping || {};
  window.igShipping.esComunaGratis = esComunaGratis;

  /* ═══════════════════════════════════════════════════════════
     cotizarDespacho(comuna, region, totalCompra)
     Retorna Promise<{ tipo, precio, dias, courier, label }>
     tipo: 'gratis' | 'shipit' | 'referencial'
  ═══════════════════════════════════════════════════════════ */
  window.igShipping.cotizar = async function(comuna, region, totalCompra) {
    totalCompra = totalCompra || 0;

    /* 1. ¿Despacho gratis? */
    if (esComunaGratis(comuna) && totalCompra >= 75000) {
      return { tipo: 'gratis', precio: 0, dias: '2-4', courier: 'ElevalCorp', label: 'Gratis' };
    }

    /* 2. Intentar Shipit API */
    if (SHIPIT_TOKEN && SHIPIT_TOKEN !== 'TU_TOKEN_SHIPIT_AQUI') {
      try {
        var shipitResult = await _cotizarShipit(comuna, region);
        if (shipitResult) return shipitResult;
      } catch(e) {
        console.warn('[ElevalCorp Shipping] Shipit no disponible, usando tarifa referencial:', e.message);
      }
    }

    /* 3. Tarifa de respaldo por región */
    return _tarifaRespaldo(region);
  };

  /* ── Cotización Shipit API ─────────────────────────────── */
  async function _cotizarShipit(comuna, region) {
    var body = {
      origin: {
        country: 'CL',
        region:  ORIGEN.region,
        commune: ORIGEN.comuna,
        street:  ORIGEN.direccion,
        number:  '1208'
      },
      destination: {
        country: 'CL',
        region:  region  || 'Región Metropolitana',
        commune: comuna  || 'Santiago',
        street:  'Dirección del cliente',
        number:  '0'
      },
      packages: [{ weight: 2, height: 20, width: 30, length: 40 }],
      declared_value: 50000
    };

    var res = await fetch('https://api.shipit.cl/v/deliveries/quote', {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': 'Token token=' + SHIPIT_TOKEN
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) throw new Error('HTTP ' + res.status);
    var data = await res.json();

    /* Shipit devuelve array de couriers — tomar el más barato */
    if (!data || !data.length) return null;
    data.sort(function(a, b) { return a.total_price - b.total_price; });
    var best = data[0];

    return {
      tipo:    'shipit',
      precio:  best.total_price || best.price || 0,
      dias:    best.transit_days ? best.transit_days + '-' + (best.transit_days + 1) : '2-5',
      courier: best.courier_name || 'Courier',
      label:   '$' + (best.total_price || 0).toLocaleString('es-CL')
    };
  }

  /* ── Tarifa de respaldo por región ───────────────────────── */
  function _tarifaRespaldo(region) {
    var tarifa = TARIFAS_RESPALDO[region] || { precio: 5990, dias: '3-5' };
    return {
      tipo:    'referencial',
      precio:  tarifa.precio,
      dias:    tarifa.dias,
      courier: 'Courier',
      label:   '~$' + tarifa.precio.toLocaleString('es-CL')
    };
  }

  /* ── Estimar fecha de entrega (días hábiles desde hoy) ── */
  function _estimarFecha(diasHabiles) {
    var d = new Date();
    var habil = 0;
    while (habil < diasHabiles) {
      d.setDate(d.getDate() + 1);
      if (d.getDay() !== 0 && d.getDay() !== 6) habil++;
    }
    return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /* ── Opciones de respaldo (3 couriers referenciales) ── */
  function _opcionesRespaldo(region) {
    var base  = TARIFAS_RESPALDO[region] || { precio: 5990, dias: '3-5' };
    var p     = base.precio;
    var parts = base.dias.split('-').map(Number);
    var OPTS  = [
      { courier: 'Blue Express', factor: 0.85, dOff: +1 },
      { courier: 'Starken',      factor: 1.00, dOff:  0 },
      { courier: 'Chilexpress',  factor: 1.20, dOff: -1 },
    ];
    return OPTS.map(function(o) {
      var precio = Math.round(p * o.factor / 100) * 100;
      var dMin   = Math.max(1, parts[0] + o.dOff);
      var dMax   = Math.max(dMin + 1, parts[1] + o.dOff);
      var dias   = dMin + '-' + dMax;
      return {
        tipo:     'referencial',
        precio:   precio,
        dias:     dias,
        courier:  o.courier,
        label:    '~$' + precio.toLocaleString('es-CL'),
        estimado: _estimarFecha(dMax)
      };
    }).sort(function(a, b) { return a.precio - b.precio; });
  }

  /* ═══════════════════════════════════════════════════════════
     cotizarOpciones — retorna array de opciones de courier
     para que el usuario elija.
  ═══════════════════════════════════════════════════════════ */
  window.igShipping.cotizarOpciones = async function(comuna, region, totalCompra) {
    totalCompra = totalCompra || 0;

    /* 1. ¿Despacho gratis? → una sola opción */
    if (esComunaGratis(comuna) && totalCompra >= 75000) {
      return [{
        tipo: 'gratis', precio: 0, dias: '2-4',
        courier: 'ElevalCorp Express', label: 'Gratis',
        estimado: _estimarFecha(3)
      }];
    }

    /* 2. Intentar Shipit API (devuelve múltiples couriers) */
    if (SHIPIT_TOKEN && SHIPIT_TOKEN !== 'TU_TOKEN_SHIPIT_AQUI') {
      try {
        var data = await _cotizarShipitRaw(comuna, region);
        if (data && data.length) {
          return data.slice(0, 4).map(function(opt) {
            var dias = opt.transit_days
              ? opt.transit_days + '-' + (opt.transit_days + 1)
              : '2-5';
            return {
              tipo:     'shipit',
              precio:   opt.total_price || 0,
              dias:     dias,
              courier:  opt.courier_name || 'Courier',
              label:    '$' + (opt.total_price || 0).toLocaleString('es-CL'),
              estimado: _estimarFecha(opt.transit_days || 3)
            };
          }).sort(function(a, b) { return a.precio - b.precio; });
        }
      } catch(e) {
        console.warn('[ElevalCorp Shipping] Shipit no disponible:', e.message);
      }
    }

    /* 3. Opciones de respaldo */
    return _opcionesRespaldo(region);
  };

  /* ── Raw Shipit fetch (devuelve array sin transformar) ── */
  async function _cotizarShipitRaw(comuna, region) {
    var body = {
      origin:      { country:'CL', region:ORIGEN.region, commune:ORIGEN.comuna, street:ORIGEN.direccion, number:'1208' },
      destination: { country:'CL', region:region||'Región Metropolitana', commune:comuna||'Santiago', street:'Dirección del cliente', number:'0' },
      packages:    [{ weight:2, height:20, width:30, length:40 }],
      declared_value: 50000
    };
    var res = await fetch('https://api.shipit.cl/v/deliveries/quote', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'Authorization':'Token token=' + SHIPIT_TOKEN },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  }

  /* ═══════════════════════════════════════════════════════════
     WIDGET REUTILIZABLE — renderiza el cotizador en cualquier
     contenedor dado su ID.

     igShipping.renderWidget(containerId, {
       totalCompra,        // número (para calcular si aplica gratis)
       comunaInicial,      // string opcional (pre-rellenar desde perfil)
       regionInicial,      // string opcional
       onResult            // callback(resultado) opcional
     })
  ═══════════════════════════════════════════════════════════ */
  window.igShipping.renderWidget = function(containerId, opts) {
    opts = opts || {};
    var container = document.getElementById(containerId);
    if (!container) return;

    var totalCompra   = opts.totalCompra  || 0;
    var comunaInicial = opts.comunaInicial || '';
    var regionInicial = opts.regionInicial || '';

    container.innerHTML = [
      '<div class="igs-widget" id="igs-widget-' + containerId + '">',
      '  <div class="igs-header">',
      '    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">',
      '      <rect x="1" y="3" width="15" height="13" rx="1"/>',
      '      <path d="M16 8h4l3 5v3h-7V8z"/>',
      '      <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
      '    </svg>',
      '    <strong>Calcular envío</strong>',
      '  </div>',
      '  <div class="igs-fields">',
      '    <div class="igs-field">',
      '      <label>Región</label>',
      '      <select id="igs-region-' + containerId + '" onchange="igShipping._onRegionChange(\'' + containerId + '\')">',
      '        <option value="">Seleccione una región</option>',
      _buildRegionOptions(regionInicial),
      '      </select>',
      '    </div>',
      '    <div class="igs-field">',
      '      <label>Comuna</label>',
      '      <select id="igs-comuna-' + containerId + '" disabled onchange="igShipping._doCotizar(\'' + containerId + '\',' + totalCompra + ')">',
      '        <option value="">Seleccionar comuna</option>',
      '      </select>',
      '    </div>',
      '  </div>',
      '  <div class="igs-result" id="igs-result-' + containerId + '" style="display:none"></div>',
      '</div>'
    ].join('\n');

    _injectStyles();

    /* Si hay datos iniciales, pre-rellenar los selects */
    if (regionInicial) {
      _populateComunas(containerId, regionInicial, comunaInicial);
      /* Si también hay comuna pre-cargada, cotizar automáticamente */
      if (comunaInicial) {
        setTimeout(function() {
          window.igShipping._doCotizar(containerId, totalCompra);
        }, 150);
      }
    }
  };

  /* ── Construir options de región (orden geográfico norte→sur) ── */
  var _REGIONES_ORDEN = [
    'Región de Arica y Parinacota','Región de Tarapacá','Región de Antofagasta',
    'Región de Atacama','Región de Coquimbo','Región de Valparaíso',
    'Región Metropolitana',"Región de O'Higgins",'Región del Maule',
    'Región de Ñuble','Región del Biobío','Región de La Araucanía',
    'Región de Los Ríos','Región de Los Lagos','Región de Aysén',
    'Región de Magallanes'
  ];

  function _buildRegionOptions(selected) {
    return _REGIONES_ORDEN.map(function(r) {
      return '<option value="' + r + '"' + (r === selected ? ' selected' : '') + '>' + r + '</option>';
    }).join('');
  }

  /* ── Poblar select de comunas según región ── */
  function _populateComunas(containerId, region, selected) {
    var select = document.getElementById('igs-comuna-' + containerId);
    if (!select) return;
    var comunas = (window.COMUNAS_CHILE && window.COMUNAS_CHILE[region]) || [];
    select.innerHTML = '<option value="">Seleccionar comuna</option>';
    comunas.forEach(function(c) {
      var opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      if (selected && c === selected) opt.selected = true;
      select.appendChild(opt);
    });
    select.disabled = comunas.length === 0;
  }

  /* ── Handler cambio región ── */
  window.igShipping._onRegionChange = function(containerId) {
    var regionEl = document.getElementById('igs-region-' + containerId);
    if (!regionEl) return;
    var result = document.getElementById('igs-result-' + containerId);
    if (result) result.style.display = 'none';
    _populateComunas(containerId, regionEl.value, '');
    /* Notificar reset al panel del carrito */
    var widget = document.getElementById('igs-widget-' + containerId);
    if (widget && widget._onReset) widget._onReset();
  };

  /* ── Autocomplete comunas básico ── */
  var COMUNAS_SUGERENCIAS = [
    'Santiago','Providencia','Las Condes','Maipú','Ñuñoa','La Florida',
    'Puente Alto','Vitacura','San Miguel','La Reina','Macul','Peñalolén',
    'Quilicura','Renca','Recoleta','Independencia','Cerrillos','Pudahuel',
    'San Bernardo','Valparaíso','Viña del Mar','Concepción','Temuco',
    'Puerto Montt','Antofagasta','Iquique','Arica','Rancagua','Talca',
    'Chillán','Osorno','Valdivia','Coyhaique','Punta Arenas'
  ];

  window.igShipping._onComunaInput = function(containerId) {
    var input = document.getElementById('igs-comuna-' + containerId);
    var ac    = document.getElementById('igs-ac-' + containerId);
    if (!input || !ac) return;
    var q = input.value.trim().toLowerCase();
    if (q.length < 2) { ac.innerHTML = ''; ac.style.display = 'none'; return; }
    var matches = COMUNAS_SUGERENCIAS.filter(function(c) {
      return c.toLowerCase().includes(q);
    }).slice(0, 5);
    if (!matches.length) { ac.style.display = 'none'; return; }
    ac.innerHTML = matches.map(function(c) {
      return '<div class="igs-ac-item" onclick="igShipping._selectComuna(\'' + containerId + '\',\'' + c + '\')">' + c + '</div>';
    }).join('');
    ac.style.display = 'block';
  };

  window.igShipping._selectComuna = function(containerId, comuna) {
    var input = document.getElementById('igs-comuna-' + containerId);
    var ac    = document.getElementById('igs-ac-' + containerId);
    if (input) input.value = comuna;
    if (ac) { ac.innerHTML = ''; ac.style.display = 'none'; }
    /* Marcar automáticamente si es zona gratis */
    _checkGratisPreview(containerId, comuna);
  };

  function _checkGratisPreview(containerId, comuna) {
    var result = document.getElementById('igs-result-' + containerId);
    if (!result) return;
    if (esComunaGratis(comuna)) {
      result.style.display = 'block';
      result.innerHTML = _buildResultHtml({ tipo:'gratis', precio:0, dias:'2-4', courier:'ElevalCorp', label:'Gratis' });
    }
  }

  /* ── Ejecutar cotización ── */
  window.igShipping._doCotizar = async function(containerId, totalCompra) {
    var comunaEl = document.getElementById('igs-comuna-' + containerId);
    var regionEl = document.getElementById('igs-region-' + containerId);
    var result   = document.getElementById('igs-result-' + containerId);
    if (!comunaEl || !result) return;

    var comuna = comunaEl.value;
    var region = regionEl ? regionEl.value : '';

    if (!region || !comuna) return;
    if (comunaEl) comunaEl.disabled = true;
    result.style.display = 'block';
    result.innerHTML = '<div class="igs-loading"><span class="igs-spinner"></span> Consultando tarifas…</div>';

    try {
      var cotizacion = await window.igShipping.cotizar(comuna, region, totalCompra);
      result.innerHTML = _buildResultHtml(cotizacion);

      /* Disparar callback si existe */
      var widget = document.getElementById('igs-widget-' + containerId);
      if (widget && widget._onResult) widget._onResult(cotizacion);

      /* Exponer resultado para uso externo (ej: configurador) */
      window._igLastShipping = cotizacion;
      window._igLastShipping.comuna = comuna;
      window._igLastShipping.region = region;

    } catch(e) {
      result.innerHTML = '<div class="igs-error">No se pudo cotizar. Intenta de nuevo.</div>';
    } finally {
      if (comunaEl) comunaEl.disabled = false;
    }
  };

  /* ── HTML del resultado ── */
  function _buildResultHtml(r) {
    var esGratis = r.tipo === 'gratis';
    var esRef    = r.tipo === 'referencial';
    var icon = esGratis
      ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><path d="M20 6L9 17l-5-5"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="18" height="18"><rect x="1" y="3" width="15" height="13" rx="1"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>';

    return [
      '<div class="igs-result-box igs-result-box--' + r.tipo + '">',
      '  <div class="igs-result-icon">' + icon + '</div>',
      '  <div class="igs-result-info">',
      '    <div class="igs-result-precio">' + (esGratis ? 'Despacho Gratis' : r.label) + '</div>',
      '    <div class="igs-result-detalle">',
      esGratis ? 'Entrega en 2-4 días hábiles · ' + r.courier
               : (esRef ? 'Tarifa referencial · ' : 'Vía ' + r.courier + ' · ') + r.dias + ' días hábiles',
      '    </div>',
      esRef ? '<div class="igs-result-nota">* Precio referencial. Puede variar según peso y dimensiones.</div>' : '',
      '  </div>',
      '</div>'
    ].join('\n');
  }

  /* ── Sanitizar HTML ── */
  function _escHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  /* ── Estilos ── */
  function _injectStyles() {
    if (document.getElementById('igs-styles')) return;
    var style = document.createElement('style');
    style.id = 'igs-styles';
    style.textContent = [
      '.igs-widget { font-family: inherit; }',

      '.igs-header {',
      '  display: flex; align-items: center; gap: 8px;',
      '  font-size: 13px; font-weight: 800; color: #0d1e36;',
      '  margin-bottom: 12px;',
      '}',
      '.igs-header svg { color: #1a4fa0; flex-shrink: 0; }',

      '.igs-fields {',
      '  display: flex; gap: 8px; align-items: flex-end; flex-wrap: wrap;',
      '}',
      '.igs-field {',
      '  display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 120px;',
      '  position: relative;',
      '}',
      '.igs-field label {',
      '  font-size: 11px; font-weight: 700; color: #7a8fa6;',
      '  text-transform: uppercase; letter-spacing: .4px;',
      '}',
      '.igs-field select, .igs-field input {',
      '  background: #f4f5f7; border: 1px solid #dde1e8;',
      '  border-radius: 7px; padding: 8px 10px;',
      '  font-size: 13px; font-family: inherit; color: #0d1e36;',
      '  outline: none; transition: border-color .18s, box-shadow .18s;',
      '  width: 100%;',
      '}',
      '.igs-field select:focus, .igs-field input:focus {',
      '  border-color: #FF7A00; box-shadow: 0 0 0 3px rgba(255,122,0,.1);',
      '}',


      '.igs-btn {',
      '  background: #1a4fa0; border: none; border-radius: 7px;',
      '  padding: 8px 18px; color: #fff;',
      '  font-size: 13px; font-weight: 700; cursor: pointer;',
      '  white-space: nowrap; transition: background .18s;',
      '  align-self: flex-end;',
      '}',
      '.igs-btn:hover { background: #0d3578; }',
      '.igs-btn:disabled { opacity: .6; cursor: wait; }',

      '.igs-result { margin-top: 10px; }',
      '.igs-loading {',
      '  display: flex; align-items: center; gap: 8px;',
      '  font-size: 12px; color: #7a8fa6; padding: 8px 0;',
      '}',
      '.igs-spinner {',
      '  width: 14px; height: 14px; border-radius: 50%;',
      '  border: 2px solid #dde1e8; border-top-color: #1a4fa0;',
      '  animation: igsSpin .7s linear infinite; display: inline-block;',
      '}',
      '@keyframes igsSpin { to { transform: rotate(360deg); } }',

      '.igs-result-box {',
      '  display: flex; align-items: flex-start; gap: 10px;',
      '  padding: 12px 14px; border-radius: 9px;',
      '  border: 1px solid #dde6f5;',
      '  background: #f4f7fd;',
      '  animation: igsResultIn .25s ease;',
      '}',
      '@keyframes igsResultIn { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }',
      '.igs-result-box--gratis {',
      '  background: linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);',
      '  border-color: #86efac;',
      '}',
      '.igs-result-box--referencial { background: #fff8ee; border-color: #fde68a; }',
      '.igs-result-icon { flex-shrink: 0; margin-top: 1px; }',
      '.igs-result-box--gratis .igs-result-icon { color: #16a34a; }',
      '.igs-result-box--shipit .igs-result-icon { color: #1a4fa0; }',
      '.igs-result-box--referencial .igs-result-icon { color: #d97706; }',

      '.igs-result-precio {',
      '  font-size: 15px; font-weight: 800; color: #0d1e36; line-height: 1;',
      '}',
      '.igs-result-box--gratis .igs-result-precio { color: #16a34a; }',
      '.igs-result-detalle {',
      '  font-size: 11px; color: #7a8fa6; margin-top: 3px;',
      '}',
      '.igs-result-nota {',
      '  font-size: 10px; color: #b0bcc9; margin-top: 3px; font-style: italic;',
      '}',
      '.igs-error { font-size: 12px; color: #ef4444; padding: 6px 0; }',
    ].join('\n');
    document.head.appendChild(style);
  }

  /* ════════════════════════════════════════════════════════════
     INTEGRACIÓN CONFIGURADOR — paso 4 (resumen)
     Inyecta la tarjeta de despacho en generateFinalSummary
  ════════════════════════════════════════════════════════════ */
  window.igShipping.hookConfigurador = function() {
    var _orig = window.generateFinalSummary;
    if (typeof _orig !== 'function') return;

    window.generateFinalSummary = function() {
      _orig.apply(this, arguments);
      _injectDespachoCardConfigurador();
    };
  };

  function _injectDespachoCardConfigurador() {
    var slot = document.getElementById('resumen-despacho-slot');
    if (!slot) return;

    /* Crear tarjeta solo si no existe */
    if (!document.getElementById('resumen-despacho-card')) {
      var card = document.createElement('div');
      card.id = 'resumen-despacho-card';
      card.className = 'resumen-card';
      card.innerHTML = [
        '<div class="resumen-card-header">',
        '  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">',
        '    <rect x="1" y="3" width="15" height="13" rx="1"/>',
        '    <path d="M16 8h4l3 5v3h-7V8z"/>',
        '    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
        '  </svg>',
        '  <h3>Despacho estimado</h3>',
        '</div>',
        '<div class="resumen-card-body" id="igs-cfg-result-body" style="padding:16px 20px;min-height:52px;">',
        '  <span style="font-size:13px;color:#9aa9bb;font-style:italic;">Selecciona una comuna en el paso anterior para ver el costo de despacho.</span>',
        '</div>'
      ].join('\n');
      slot.appendChild(card);
    }

    _updateDespachoCardConfigurador();
  }

  async function _updateDespachoCardConfigurador() {
    var body = document.getElementById('igs-cfg-result-body');
    if (!body) return;

    var comunaVal = (document.getElementById('ciudad') || {}).value || '';
    var regionVal = (document.getElementById('region') || {}).value || '';

    /* Fallback: usar la región elegida en el paso 1 */
    if (!regionVal) regionVal = window._despachoRegion || '';
    if (!regionVal) {
      window._igDespachoResult = null;
      if (typeof window.refreshResumenTotales === 'function') window.refreshResumenTotales();
      body.innerHTML = '<span style="font-size:13px;color:#9aa9bb;font-style:italic;">Selecciona una región en el paso 1 para ver el costo de despacho estimado.</span>';
      return;
    }

    var totalEl     = document.getElementById('summaryTotal');
    var totalCompra = totalEl ? parseInt((totalEl.textContent || '0').replace(/\D/g, '')) || 0 : 0;

    /* Sin comuna: mostrar estimado por región usando TARIFAS_REGIONES */
    if (!comunaVal) {
      var tarifas  = window.TARIFAS_REGIONES || {};
      var tarifa   = tarifas[regionVal] || { precio: 5990, gratis75k: false };
      var gratis   = tarifa.gratis75k && totalCompra >= 75000;
      var rCorta   = regionVal.replace(/^Región (de(l?|) )?/i, '');
      window._igDespachoResult = { tipo: gratis ? 'gratis' : 'estimado', precio: gratis ? 0 : tarifa.precio };
      if (typeof window.refreshResumenTotales === 'function') window.refreshResumenTotales();
      body.innerHTML = [
        '<div style="display:flex;align-items:center;gap:14px;">',
        '  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + (gratis ? '#16a34a' : '#d97706') + '" stroke-width="2">',
        '    <rect x="1" y="3" width="15" height="13" rx="1"/>',
        '    <path d="M16 8h4l3 5v4h-7V8z"/>',
        '    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
        '  </svg>',
        '  <div style="flex:1;">',
        '    <div style="font-size:12px;color:#7a8fa6;margin-bottom:2px;">Estimado para <strong>' + _escHtml(rCorta) + '</strong></div>',
        '    <div style="font-size:17px;font-weight:800;color:' + (gratis ? '#16a34a' : '#0d1e36') + ';">' + (gratis ? 'Gratis' : '~$' + tarifa.precio.toLocaleString('es-CL')) + '</div>',
        '  </div>',
        '</div>'
      ].join('\n');
      return;
    }

    body.innerHTML = '<span class="igs-loading"><span class="igs-spinner"></span> Consultando tarifas…</span>';
    _injectStyles();

    try {
      var r      = await window.igShipping.cotizar(comunaVal, regionVal, totalCompra);

      /* Guardar resultado para que refreshResumenTotales lo sume al total */
      window._igDespachoResult = r;
      if (typeof window.refreshResumenTotales === 'function') window.refreshResumenTotales();

      var gratis = r.tipo === 'gratis';
      var diasLabel = r.dias ? r.dias + ' días hábiles' : '';

      body.innerHTML = [
        '<div style="display:flex;align-items:center;gap:14px;">',
        '  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="' + (gratis ? '#16a34a' : '#d97706') + '" stroke-width="2">',
        '    <rect x="1" y="3" width="15" height="13" rx="1"/>',
        '    <path d="M16 8h4l3 5v4h-7V8z"/>',
        '    <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>',
        '  </svg>',
        '  <div style="flex:1;">',
        '    <div style="font-size:12px;color:#7a8fa6;margin-bottom:2px;">Despacho a <strong>' + _escHtml(comunaVal) + '</strong> &mdash; ' + _escHtml(regionVal) + '</div>',
        '    <div style="font-size:17px;font-weight:800;color:' + (gratis ? '#16a34a' : '#0d1e36') + ';">' +
             (gratis ? 'Gratis' : '~$' + (r.precio || 0).toLocaleString('es-CL')) + '</div>',
        '  </div>',
        diasLabel ? '  <div style="font-size:12px;font-weight:600;color:#FF7A00;background:#fff3dc;border-radius:20px;padding:5px 12px;white-space:nowrap;">' + diasLabel + '</div>' : '',
        '</div>'
      ].join('\n');
    } catch(e) {
      body.innerHTML = '<span style="font-size:13px;color:#ef4444;">No se pudo obtener el costo de despacho.</span>';
    }
  }

  /* ════════════════════════════════════════════════════════════
     INTEGRACIÓN TIENDA — carrito/checkout
     Expone igShipping.mountCarrito(containerId, totalCompra)
  ════════════════════════════════════════════════════════════ */
  window.igShipping.mountCarrito = function(containerId, totalCompra) {
    window.igShipping.renderWidget(containerId, {
      totalCompra:   totalCompra  || 0,
      comunaInicial: '',
      regionInicial: ''
    });
  };

  /* ════════════════════════════════════════════════════════════
     ARRANQUE AUTOMÁTICO
     · En configurador.html → hookea generateFinalSummary
     · En tienda.html → espera a que se monte el carrito
  ════════════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(function() {
      /* Configurador */
      if (document.getElementById('summaryInfo')) {
        window.igShipping.hookConfigurador();
      }
      /* Tienda — el carrito lo monta tienda.js llamando igShipping.mountCarrito() */
    }, 200);
  });

})();