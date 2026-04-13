/* ═══════════════════════════════════════════════
   configurador.js  —  CORREGIDO
═══════════════════════════════════════════════ */

// ─── IMPORTANTE: Ya no usamos import estático.
// Supabase se carga dinámicamente para no romper
// el script cuando se usa sin bundler.
let supabaseClient = null;

async function initSupabase() {
  if (supabaseClient) return;
  try {
    const mod = await import('./supabase.js');
    supabaseClient = mod.supabaseClient;
  } catch (e) {
    console.warn('⚠️ supabase.js no encontrado. Las cotizaciones no se guardarán en BD.', e);
  }
}

// ═════════════════════════════════════════
// TIPO DE CAMBIO (DÓLAR TIC)
// ═════════════════════════════════════════
let tipoCambio = 900;

function actualizarTipoCambio(val) {
  const v = parseInt(val);
  if (!isNaN(v) && v > 0) {
    tipoCambio = v;
    renderizarPreciosUSD();
    updateSidebar();
  }
}

function cambiarDolar(delta) {
  const input = document.getElementById('tipoCambio');
  tipoCambio = Math.max(1, tipoCambio + delta);
  if (input) input.value = tipoCambio;
  renderizarPreciosUSD();
  updateSidebar();
}

function renderizarPreciosUSD() {
  document.querySelectorAll('.product-item').forEach(item => {
    const priceCLP = parseInt(item.dataset.price);
    if (!priceCLP) return;
    const usd = Math.round(priceCLP / tipoCambio);
    // Actualizar tag de precio CLP (por si cambia)
    const tag = item.querySelector('.product-price-tag');
    if (tag) {
      tag.innerHTML = `$${priceCLP.toLocaleString('es-CL')} <span class="product-price-usd">≈ USD ${usd.toLocaleString('en-US')}</span>`;
    }
  });
}

let currentStep = 1;
const totalSteps = 4;

const state = {
  equipos: {},
  servicios: {},
  formulario: {}
};

// ═════════════════════════════════════════
// SIMULADOR — estado
// ═════════════════════════════════════════
let simPlazo = 24;
let simTasa  = 12;

// ═════════════════════════════════════════
// NAVEGACIÓN
// ═════════════════════════════════════════

function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) {
    currentStep++;
    updateStepDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateStepDisplay() {
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.remove('active');
  });

  document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');

  updateProgressBar();
  updateButtons();

  const sidebar = document.querySelector('.config-sidebar');
  if (sidebar) sidebar.style.display = currentStep === 4 ? 'none' : '';

  if (currentStep === 3) generateFinalSummary();
  if (currentStep === 4) initSimulador();
}

function updateProgressBar() {
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('progressBar').style.width = progress + '%';

  document.querySelectorAll('.progress-step').forEach(step => {
    const n = parseInt(step.dataset.step);
    step.classList.toggle('active', n <= currentStep);
  });
}

function updateButtons() {
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');

  if (currentStep === 1) {
    btnPrev.style.display = 'none';
    btnNext.textContent = 'Siguiente →';
    btnNext.onclick = nextStep;
  } else if (currentStep === totalSteps) {
    btnPrev.style.display = 'inline-flex';
    btnNext.textContent = 'Solicitar Cotización';
    btnNext.onclick = solicitarCotizacion;
  } else {
    btnPrev.style.display = 'inline-flex';
    btnNext.textContent = 'Siguiente →';
    btnNext.onclick = nextStep;
  }
}

// ═════════════════════════════════════════
// VALIDACIONES
// ═════════════════════════════════════════

function validateStep(step) {
  if (step === 1) {
    let totalQty = 0;
    document.querySelectorAll('.qty-value').forEach(el => {
      totalQty += parseInt(el.textContent) || 0;
    });

    if (totalQty === 0) {
      alert('⚠️ Debes seleccionar al menos un equipo');
      return false;
    }

    collectEquipos();
  }

  // Al salir del paso 2 (info), recolectamos el form aunque esté incompleto
  // para mostrarlo en el resumen. La validación estricta ocurre al salir del paso 3.
  if (step === 2) {
    collectServicios();
    collectFormulario(); // recolectar sin validar
  }

  // Al salir del paso 3 (resumen) → validar que el form esté completo
  if (step === 3 && !validateForm()) return false;

  return true;
}

// Recolecta el formulario sin validar (para el resumen)
function collectFormulario() {
  state.formulario = {
    empresa:   document.getElementById('empresa')?.value.trim()   || '',
    region:    document.getElementById('region')?.value           || '',
    ciudad:    document.getElementById('ciudad')?.value           || '',
    direccion: document.getElementById('direccion')?.value        || '',
    contacto:  document.getElementById('contacto')?.value.trim()  || '',
    cargo:     document.getElementById('cargo')?.value            || '',
    telefono:  document.getElementById('telefono')?.value.trim()  || '',
    email:     document.getElementById('email')?.value.trim()     || '',
    empleados: document.getElementById('empleados')?.value        || '',
    rubro:     document.getElementById('rubro')?.value            || '',
    notas:     document.getElementById('notas')?.value            || ''
  };
}

function validateForm() {
  const empresa  = document.getElementById('empresa')?.value.trim();
  const email    = document.getElementById('email')?.value.trim();
  const contacto = document.getElementById('contacto')?.value.trim();
  const telefono = document.getElementById('telefono')?.value.trim();

  if (!empresa || !email || !contacto || !telefono) {
    alert('⚠️ Completa los campos obligatorios (Empresa, Contacto, Teléfono y Email)');
    return false;
  }

  collectFormulario();
  return true;
}

// ═════════════════════════════════════════
// PRODUCTOS
// ═════════════════════════════════════════

function incrementQty(event) {
  event.preventDefault();
  const qtySpan = event.currentTarget.parentElement.querySelector('.qty-value');
  qtySpan.textContent = parseInt(qtySpan.textContent) + 1;
  const cat = event.currentTarget.closest('.product-category');
  updateCatBadge(cat);
  updateSidebar();
}

function decrementQty(event) {
  event.preventDefault();
  const qtySpan = event.currentTarget.parentElement.querySelector('.qty-value');
  const current = parseInt(qtySpan.textContent);

  if (current > 0) {
    qtySpan.textContent = current - 1;
    const cat = event.currentTarget.closest('.product-category');
    updateCatBadge(cat);
    updateSidebar();
  }
}

function toggleProduct() {}

// ═════════════════════════════════════════
// DATA
// ═════════════════════════════════════════

function collectEquipos() {
  state.equipos = {};

  document.querySelectorAll('.product-item').forEach(item => {
    const name  = item.dataset.name;
    const price = parseInt(item.dataset.price);
    const qty   = parseInt(item.querySelector('.qty-value').textContent) || 0;

    if (qty > 0) {
      state.equipos[name] = { qty, price };
    }
  });
}

function collectServicios() {
  state.servicios = {};

  document.querySelectorAll('.service-check').forEach(el => {
    const selectedOption = el.options ? el.options[el.selectedIndex] : null;
    if (!selectedOption || !selectedOption.value) return;

    const price = parseInt(selectedOption.dataset.price) || 0;
    if (price === 0) return;

    const prefix = el.dataset.namePrefix || el.dataset.name || 'Servicio';
    const label  = `${prefix} — ${selectedOption.text.split('—')[0].trim()}`;
    state.servicios[label] = price;
  });
}

// ═════════════════════════════════════════
// SIDEBAR / STICKY RESUMEN
// ═════════════════════════════════════════

function updateSidebar() {
  let totalEq  = 0;
  let totalQty = 0;
  const selectedProducts = [];

  document.querySelectorAll('.product-item').forEach(item => {
    const qty   = parseInt(item.querySelector('.qty-value').textContent) || 0;
    const price = parseInt(item.dataset.price);
    const name  = item.dataset.name;
    if (qty > 0) {
      totalEq  += qty * price;
      totalQty += qty;
      selectedProducts.push({ name, qty });
    }
  });

  let totalSvc = 0;
  let countSvc = 0;
  const selectedServices = [];

  document.querySelectorAll('.service-check').forEach(el => {
    const selectedOption = el.options ? el.options[el.selectedIndex] : null;
    if (!selectedOption || !selectedOption.value) return;
    const price = parseInt(selectedOption.dataset.price) || 0;
    if (price === 0) return;
    totalSvc += price;
    countSvc++;
    const prefix = el.dataset.namePrefix || el.dataset.name || 'Servicio';
    selectedServices.push(`${prefix} — ${selectedOption.text.split('—')[0].trim()}`);
  });

  const total = totalEq;
  const cuota = Math.round(total / 24);

  // Contadores
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setTxt('countEquipos',   totalQty);
  setTxt('countServicios', countSvc);
  setTxt('totalEquipos',   totalEq.toLocaleString('es-CL'));
  setTxt('totalServicios', totalSvc.toLocaleString('es-CL'));
  setTxt('totalGeneral',   total.toLocaleString('es-CL'));
  setTxt('cuotaMensual',   cuota.toLocaleString('es-CL'));
  setTxt('plazoSidebarLabel', simPlazo);

  // Lista productos en sidebar
  const list = document.getElementById('productsListSidebar');
  if (list) {
    if (selectedProducts.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:var(--white-60);font-size:12px;padding:8px;">Sin productos aún</div>';
    } else {
      list.innerHTML = selectedProducts.map(p =>
        `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;gap:8px;">` +
        `<span style="color:var(--white-80);flex:1;line-height:1.3;">${p.name}</span>` +
        `<span style="color:var(--gold);white-space:nowrap;font-weight:600;">×${p.qty}</span>` +
        `</div>`
      ).join('');
    }
  }
}

// ═════════════════════════════════════════
// RESUMEN (Paso 3)
// ═════════════════════════════════════════

function generateFinalSummary() {
  collectEquipos();
  collectServicios();

  const fmt = n => n.toLocaleString('es-CL');
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // ── Productos ──────────────────────────────────────────
  const summaryEquipos = document.getElementById('summaryEquipos');
  const eqEntries = Object.entries(state.equipos);
  let totalEq = 0;
  if (summaryEquipos) {
    if (eqEntries.length === 0) {
      summaryEquipos.innerHTML = '<p class="resumen-empty">Sin productos seleccionados</p>';
    } else {
      summaryEquipos.innerHTML = eqEntries.map(([name, v]) => {
        const sub = v.qty * v.price;
        totalEq  += sub;
        return `<div class="resumen-line-item">
          <div class="resumen-line-info">
            <span class="resumen-line-name">${name}</span>
            <span class="resumen-line-qty">× ${v.qty} unid.</span>
          </div>
          <span class="resumen-line-price">$${fmt(sub)}</span>
        </div>`;
      }).join('');
    }
  }

  // ── Servicios ──────────────────────────────────────────
  const summaryServicios = document.getElementById('summaryServicios');
  const svcEntries = Object.entries(state.servicios);
  let totalSvc = 0;
  if (summaryServicios) {
    if (svcEntries.length === 0) {
      summaryServicios.innerHTML = '<p class="resumen-empty">Sin servicios seleccionados</p>';
    } else {
      summaryServicios.innerHTML = svcEntries.map(([name, price]) => {
        totalSvc += price;
        return `<div class="resumen-line-item">
          <div class="resumen-line-info">
            <span class="resumen-line-name">${name}</span>
          </div>
          <span class="resumen-line-price">$${fmt(price)}/mes</span>
        </div>`;
      }).join('');
    }
  }

  // ── Totales ────────────────────────────────────────────
  const total = totalEq + totalSvc;
  setTxt('summarySubtotalEq',  fmt(totalEq));
  setTxt('summarySubtotalSvc', fmt(totalSvc));
  setTxt('summaryTotal',       fmt(total));
  setTxt('summaryCuota',       fmt(Math.round(total / simPlazo)));
  setTxt('plazoLabelSummary',  simPlazo + ' meses');

  // ── Información de contacto ────────────────────────────
  const f = state.formulario;
  const infoSection = document.getElementById('summaryInfo');
  if (infoSection) {
    infoSection.innerHTML = `
      <div class="resumen-card">
        <div class="resumen-card-header">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          <h3>Información de Contacto</h3>
        </div>
        <div class="resumen-card-body">
          <div class="resumen-contact-grid">
            ${f.empresa   ? `<div class="resumen-contact-field"><span class="resumen-contact-label">Empresa</span><span class="resumen-contact-value">${f.empresa}</span></div>` : ''}
            ${f.contacto  ? `<div class="resumen-contact-field"><span class="resumen-contact-label">Contacto</span><span class="resumen-contact-value">${f.contacto}</span></div>` : ''}
            ${f.email     ? `<div class="resumen-contact-field"><span class="resumen-contact-label">Email</span><span class="resumen-contact-value">${f.email}</span></div>` : ''}
            ${f.telefono  ? `<div class="resumen-contact-field"><span class="resumen-contact-label">Teléfono</span><span class="resumen-contact-value">${f.telefono}</span></div>` : ''}
            ${f.region    ? `<div class="resumen-contact-field"><span class="resumen-contact-label">Región</span><span class="resumen-contact-value">${f.region}</span></div>` : ''}
            ${f.ciudad    ? `<div class="resumen-contact-field"><span class="resumen-contact-label">Ciudad</span><span class="resumen-contact-value">${f.ciudad}</span></div>` : ''}
            ${f.direccion ? `<div class="resumen-contact-field resumen-contact-full"><span class="resumen-contact-label">Dirección</span><span class="resumen-contact-value">${f.direccion}</span></div>` : ''}
            ${f.notas     ? `<div class="resumen-contact-field resumen-contact-full"><span class="resumen-contact-label">Notas adicionales</span><span class="resumen-contact-value">${f.notas}</span></div>` : ''}
          </div>
        </div>
      </div>
    `;
  }
}

// ═════════════════════════════════════════
// SIMULADOR (Paso 4)
// ═════════════════════════════════════════

function initSimulador() {
  collectEquipos();
  collectServicios();

  const totalEq  = Object.values(state.equipos).reduce((s, e) => s + e.qty * e.price, 0);
  const totalSvc = Object.values(state.servicios).reduce((s, v) => s + v, 0);

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setTxt('montoFinanciar',     totalEq.toLocaleString('es-CL'));
  setTxt('serviciosMensualesSim', totalSvc.toLocaleString('es-CL'));

  calcularSimulador();
}

function calcularSimulador() {
  const totalEq  = Object.values(state.equipos).reduce((s, e) => s + e.qty * e.price, 0);
  const totalSvc = Object.values(state.servicios).reduce((s, v) => s + v, 0);

  const principal = totalEq;
  const tasaMensual = simTasa / 100 / 12;
  const n = simPlazo;

  let cuotaProducto = 0;
  if (tasaMensual === 0) {
    cuotaProducto = principal / n;
  } else {
    cuotaProducto = principal * (tasaMensual * Math.pow(1 + tasaMensual, n)) / (Math.pow(1 + tasaMensual, n) - 1);
  }

  const cuotaTotal   = Math.round(cuotaProducto + totalSvc);
  const totalPagar   = Math.round(cuotaProducto * n + totalSvc * n);
  const intereses    = Math.round(cuotaProducto * n - principal);

  const fmt = v => v.toLocaleString('es-CL');
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setTxt('simCuota',    '$' + fmt(cuotaTotal));
  setTxt('simTotal',    '$' + fmt(totalPagar));
  setTxt('simIntereses','$' + fmt(Math.max(0, intereses)));

  // Tabla de amortización
  generarTablaAmort(principal, tasaMensual, n, cuotaProducto);
}

function generarTablaAmort(principal, tasaMensual, n, cuota) {
  const tbody = document.getElementById('tablaAmortBody');
  if (!tbody) return;

  const fmt = v => v.toLocaleString('es-CL');
  let saldo = principal;
  let totalCapital = 0, totalInteres = 0, totalCuota = 0;
  let rows = '';

  for (let i = 1; i <= n; i++) {
    const interes  = Math.round(saldo * tasaMensual);
    const capital  = Math.round(cuota - interes);
    saldo = Math.max(0, saldo - capital);
    totalCapital += capital;
    totalInteres += interes;
    totalCuota   += Math.round(cuota);
    rows += `<tr><td>${i}</td><td>$${fmt(Math.round(cuota))}</td><td>$${fmt(capital)}</td><td>$${fmt(interes)}</td><td>$${fmt(saldo)}</td></tr>`;
  }

  tbody.innerHTML = rows;

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('tfoot-cuota',   '$' + fmt(totalCuota));
  setTxt('tfoot-capital', '$' + fmt(totalCapital));
  setTxt('tfoot-interes', '$' + fmt(totalInteres));
}

function setPlazo(meses, btn) {
  simPlazo = meses;
  document.querySelectorAll('.sim-plazo-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  calcularSimulador();

  // Actualizar label del plazo en sticky y summary
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('plazoSidebarLabel', simPlazo);
  setTxt('cuotaMensual', calcularCuotaSimple());
}

function updateTasa(val) {
  simTasa = parseFloat(val);
  const el = document.getElementById('tasaVal');
  if (el) el.textContent = simTasa + '%';
  calcularSimulador();
}

function toggleTablaAmort() {
  const wrap = document.getElementById('tablaAmortWrap');
  const btn  = document.getElementById('btnToggleTabla');
  if (!wrap) return;
  const visible = wrap.style.display !== 'none';
  wrap.style.display = visible ? 'none' : 'block';
  if (btn) btn.textContent = visible ? '▼ Ver tabla de amortización' : '▲ Ocultar tabla';
}

function calcularCuotaSimple() {
  const totalEq = Object.values(state.equipos).reduce((s, e) => s + e.qty * e.price, 0);
  const tasaMensual = simTasa / 100 / 12;
  const n = simPlazo;
  if (tasaMensual === 0) return Math.round(totalEq / n).toLocaleString('es-CL');
  const cuota = totalEq * (tasaMensual * Math.pow(1 + tasaMensual, n)) / (Math.pow(1 + tasaMensual, n) - 1);
  return Math.round(cuota).toLocaleString('es-CL');
}

// ═════════════════════════════════════════
// SUPABASE
// ═════════════════════════════════════════

async function guardarCotizacionSupabase(data) {
  await initSupabase();

  if (!supabaseClient) {
    console.warn('Supabase no disponible, cotización solo en consola:', data);
    return { id: 'local-' + Date.now() };
  }

  console.log('📦 DATA:', data);
  const { data: result, error } = await supabaseClient
    .from('cotizaciones')
    .insert([data])
    .select();

  if (error) {
    console.error(error);
    throw error;
  }

  return result;
}

// ═════════════════════════════════════════
// COTIZACIÓN
// ═════════════════════════════════════════

function solicitarCotizacion() {
  if (!validateStep(3)) return;

  collectEquipos();
  collectServicios();

  const totalEquipos   = Object.values(state.equipos).reduce((sum, e) => sum + e.qty * e.price, 0);
  const totalServicios = Object.values(state.servicios).reduce((sum, s) => sum + s, 0);

  const data = {
    ...state.formulario,
    productos:        state.equipos,
    servicios:        state.servicios,
    total_productos:  totalEquipos,
    total_servicios:  totalServicios,
    total_general:    totalEquipos + totalServicios,
    plazo_meses:      simPlazo,
    tasa_anual:       simTasa,
    url:              window.location.href
  };

  guardarCotizacionSupabase(data)
    .then(() => {
      const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
      setTxt('modalEmpresa', state.formulario.empresa || '—');
      setTxt('modalEmail',   state.formulario.email   || '—');
      const suc = document.getElementById('modalSuccess');
      const err = document.getElementById('modalError');
      if (suc) suc.style.display = '';
      if (err) err.style.display = 'none';
      abrirModal();
    })
    .catch(() => {
      const suc = document.getElementById('modalSuccess');
      const err = document.getElementById('modalError');
      if (suc) suc.style.display = 'none';
      if (err) err.style.display = '';
      abrirModal();
    });
}

// Alias usado en el HTML (btn "Enviar Cotización" del paso 4)
function enviarCotizacion() {
  solicitarCotizacion();
}

// ═════════════════════════════════════════
// MODAL
// ═════════════════════════════════════════

function abrirModal() {
  document.getElementById('modalOverlay').classList.add('modal-visible');
  document.body.style.overflow = 'hidden';
}

function cerrarModal() {
  document.getElementById('modalOverlay').classList.remove('modal-visible');
  document.body.style.overflow = '';
  window.scrollTo({ top: 0, behavior: 'instant' });
  location.reload();
}

// ═════════════════════════════════════════
// FILTROS (Paso 1)
// ═════════════════════════════════════════
let filtroMarca = 'todos';
let filtroTipo  = 'todos';

function setFiltro(btn, tipo) {
  if (tipo === 'marca') {
    filtroMarca = btn.dataset.val;
    document.querySelectorAll('#filtrosMarca .chip').forEach(c => c.classList.remove('active'));
  } else {
    filtroTipo = btn.dataset.val;
    document.querySelectorAll('#filtrosTipo .sidebar-menu-item').forEach(c => c.classList.remove('active'));
  }
  btn.classList.add('active');
  aplicarFiltros();
}

function actualizarConteos() {
  const tipos = ['todos', 'notebook', 'servidor', 'impresora', 'networking', 'storage'];
  tipos.forEach(tipo => {
    const el = document.getElementById('count-' + tipo);
    if (!el) return;
    if (tipo === 'todos') {
      el.textContent = document.querySelectorAll('.product-item').length;
    } else {
      el.textContent = document.querySelectorAll(`.product-item[data-tipo="${tipo}"]`).length;
    }
  });
}

function aplicarFiltros() {
  const q = (document.getElementById('searchProductos')?.value || '').toLowerCase();
  let algunaVisible = false;

  document.querySelectorAll('.product-category').forEach(cat => {
    const catTipo = cat.dataset.tipo;
    const tipoOk  = filtroTipo === 'todos' || catTipo === filtroTipo;

    let itemsVisibles = 0;
    cat.querySelectorAll('.product-item').forEach(item => {
      const marca   = (item.dataset.marca || '').toLowerCase();
      const nombre  = (item.dataset.name  || '').toLowerCase();
      const specs   = (item.dataset.specs || '').toLowerCase();

      const marcaOk  = filtroMarca === 'todos' || marca.includes(filtroMarca.toLowerCase());
      const searchOk = !q || nombre.includes(q) || specs.includes(q) || marca.includes(q);

      const visible = tipoOk && marcaOk && searchOk;
      item.style.display = visible ? '' : 'none';
      if (visible) itemsVisibles++;
    });

    cat.style.display = itemsVisibles > 0 ? '' : 'none';
    if (itemsVisibles > 0) algunaVisible = true;
  });

  const noRes = document.getElementById('sinResultados');
  if (noRes) noRes.style.display = algunaVisible ? 'none' : 'block';
}

function resetFiltros() {
  filtroMarca = 'todos';
  filtroTipo  = 'todos';
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-filtro="marca"][data-val="todos"]')?.classList.add('active');
  document.querySelector('[data-filtro="tipo"][data-val="todos"]')?.classList.add('active');
  const inp = document.getElementById('searchProductos');
  if (inp) inp.value = '';
  aplicarFiltros();
}

// ═════════════════════════════════════════
// ACCORDION
// ═════════════════════════════════════════
function toggleCategory(id) {
  document.getElementById(id)?.classList.toggle('open');
}

// ═════════════════════════════════════════
// BADGE DE CATEGORÍA
// ═════════════════════════════════════════
function updateCatBadge(cat) {
  if (!cat) return;
  let total = 0;
  cat.querySelectorAll('.qty-value').forEach(q => total += parseInt(q.textContent) || 0);
  const badge = cat.querySelector('.cat-badge');
  if (badge) {
    badge.textContent = total + ' uds';
    badge.classList.toggle('visible', total > 0);
  }
  cat.classList.toggle('has-selection', total > 0);
}

// ═════════════════════════════════════════
// INIT
// ═════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  updateProgressBar();
  updateButtons();
  updateSidebar();
  actualizarConteos();
  renderizarPreciosUSD();

  document.querySelectorAll('.service-check').forEach(el => {
    el.addEventListener('change', updateSidebar);
  });
});

// ═════════════════════════════════════════
// EXPONER AL SCOPE GLOBAL (requerido por
// los onclick inline del HTML)
// ═════════════════════════════════════════
window.toggleProduct        = toggleProduct;
window.incrementQty         = incrementQty;
window.decrementQty         = decrementQty;
window.nextStep             = nextStep;
window.prevStep             = prevStep;
window.solicitarCotizacion  = solicitarCotizacion;
window.enviarCotizacion     = enviarCotizacion;
window.updateSidebar        = updateSidebar;
window.cerrarModal          = cerrarModal;
window.setFiltro            = setFiltro;
window.aplicarFiltros       = aplicarFiltros;
window.resetFiltros         = resetFiltros;
window.toggleCategory       = toggleCategory;
window.setPlazo             = setPlazo;
window.updateTasa           = updateTasa;
window.toggleTablaAmort     = toggleTablaAmort;
window.actualizarTipoCambio = actualizarTipoCambio;
window.cambiarDolar         = cambiarDolar;