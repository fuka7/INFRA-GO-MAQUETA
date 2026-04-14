/* ═══════════════════════════════════════════════
   configurador.js 
═══════════════════════════════════════════════ */
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

async function fetchDolarTIC() {
  const input = document.getElementById('tipoCambio');
  const note  = document.getElementById('dolarNote');
  try {
    const res  = await fetch('https://mindicador.cl/api/dolar');
    const data = await res.json();
    const raw  = data?.serie?.[0]?.valor;
    if (raw && raw > 0) {
      tipoCambio = Math.round(raw) + 5; // BCCh + $5 TIC
      if (input) input.value = tipoCambio;
      if (note)  note.textContent = `Tipo de cambio actualizado: $${tipoCambio.toLocaleString('es-CL')} CLP/USD`;
      renderizarPreciosUSD();
      updateSidebar();
    } else throw new Error('sin valor');
  } catch {
    if (note) note.textContent = 'No se pudo obtener el tipo de cambio. Ingréselo manualmente.';
  }
}

function actualizarTipoCambio(val) {
  const v = parseInt(val);
  if (!isNaN(v) && v > 0) {
    tipoCambio = v;
    renderizarPreciosUSD();
    updateSidebar();
    actualizarDescuento();
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

// ═════════════════════════════════════════
// DESCUENTOS POR VOLUMEN
// ═════════════════════════════════════════
const DCTO_TRAMOS = [
  { min:10, max:19, pct:1 },
  { min:20, max:29, pct:2 },
  { min:30, max:39, pct:3 },
  { min:40, max:49, pct:4 },
  { min:50, max:9999, pct:5 },
];

function actualizarDescuento() {
  let totalQty = 0;
  document.querySelectorAll('.qty-value').forEach(el => {
    totalQty += parseInt(el.textContent) || 0;
  });

  // Resaltar fila activa
  document.querySelectorAll('.dcto-row').forEach(row => {
    const min = parseInt(row.dataset.min);
    const max = parseInt(row.dataset.max);
    row.classList.toggle('dcto-active', totalQty >= min && totalQty <= max);
  });

  // Mostrar descuento aplicado
  const tramo = DCTO_TRAMOS.find(t => totalQty >= t.min && totalQty <= t.max);
  const dctoEl   = document.getElementById('dctoAplicado');
  const dctoVal  = document.getElementById('dctoAplicadoVal');
  if (dctoEl && dctoVal) {
    if (tramo) {
      dctoEl.style.display = 'flex';
      dctoVal.textContent  = tramo.pct + '%';
    } else {
      dctoEl.style.display = 'none';
    }
  }
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
  actualizarDescuento();
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
    actualizarDescuento();
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
  let totalEqCLP = 0;
  let totalQty = 0;
  const selectedProducts = [];

  document.querySelectorAll('.product-item').forEach(item => {
    const qty = parseInt(item.querySelector('.qty-value').textContent) || 0;
    const priceCLP = parseInt(item.dataset.price) || 0;
    const name = item.dataset.name;

    if (qty > 0) {
      totalQty += qty;

      // 🔥 precio afectado por dólar (si quieres lógica USD real)
      const priceUSD = priceCLP / tipoCambio;
      const priceFinal = priceUSD * tipoCambio; // puedes cambiar lógica aquí

      totalEqCLP += qty * priceFinal;

      selectedProducts.push({ name, qty });
    }
  });

  // ─────────────────────────────
  // SERVICIOS
  // ─────────────────────────────
  let totalSvc = 0;
  let countSvc = 0;

  document.querySelectorAll('.service-check').forEach(el => {
    const selectedOption = el.options ? el.options[el.selectedIndex] : null;
    if (!selectedOption || !selectedOption.value) return;

    const price = parseInt(selectedOption.dataset.price) || 0;
    if (price === 0) return;

    totalSvc += price;
    countSvc++;
  });

  // ─────────────────────────────
  // DESCUENTO
  // ─────────────────────────────
  const pctDcto = obtenerPctDescuento(totalQty);
  const descuento = totalEqCLP * (pctDcto / 100);

  const totalEquiposConDcto = totalEqCLP - descuento;

  // ─────────────────────────────
  // TOTALES
  // ─────────────────────────────
  const totalGeneral = totalEquiposConDcto + totalSvc;
  const cuota = Math.round(totalGeneral / simPlazo);

  // ─────────────────────────────
  // UI
  // ─────────────────────────────
  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('countEquipos', totalQty);
  setTxt('countServicios', countSvc);

  setTxt('totalEquipos', totalEquiposConDcto.toLocaleString('es-CL'));
  setTxt('totalServicios', totalSvc.toLocaleString('es-CL'));
  setTxt('totalGeneral', totalGeneral.toLocaleString('es-CL'));
  setTxt('cuotaMensual', cuota.toLocaleString('es-CL'));

  // 🔥 NUEVO
  setTxt('ahorroTotal', descuento.toLocaleString('es-CL'));
  setTxt('descuentoPct', pctDcto + '%');

  setTxt('plazoSidebarLabel', simPlazo);

  // ─────────────────────────────
  // LISTA PRODUCTOS
  // ─────────────────────────────
  const list = document.getElementById('productsListSidebar');
  if (list) {
    if (selectedProducts.length === 0) {
      list.innerHTML = '<div style="text-align:center;color:var(--white-60);font-size:12px;padding:8px;">Sin productos aún</div>';
    } else {
      list.innerHTML = selectedProducts.map(p =>
        `<div style="display:flex;justify-content:space-between;font-size:12px;">
          <span>${p.name}</span>
          <span style="color:var(--gold)">×${p.qty}</span>
        </div>`
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
  actualizarDescuento();
  fetchDolarTIC();

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
window.actualizarDescuento  = actualizarDescuento;
/* ─────────────────────────────────────────────
   TRAMOS DE DESCUENTO (igual que el JS original)
───────────────────────────────────────────────*/
const TABLA_DCTO_TRAMOS = [
  { min: 10, max: 19, pct: 1 },
  { min: 20, max: 29, pct: 2 },
  { min: 30, max: 39, pct: 3 },
  { min: 40, max: 49, pct: 4 },
  { min: 50, max: 9999, pct: 5 },
];
 
function obtenerPctDescuento(totalQty) {
  const tramo = TABLA_DCTO_TRAMOS.find(t => totalQty >= t.min && totalQty <= t.max);
  return tramo ? tramo.pct : 0;
}
 
/* ─────────────────────────────────────────────
   CATEGORÍAS: definición para la nueva tabla
   (sincroniza con las del HTML original)
───────────────────────────────────────────────*/
const CATALOG_CATEGORIES = [
  {
    id: 'tab-notebooks',
    tipo: 'notebook',
    label: 'Notebooks',
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  },
  {
    id: 'tab-servidores',
    tipo: 'servidor',
    label: 'Servidores',
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>`,
  },
  {
    id: 'tab-impresoras',
    tipo: 'impresora',
    label: 'Impresoras',
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 9h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z"/><line x1="8" y1="13" x2="16" y2="13"/></svg>`,
  },
  {
    id: 'tab-networking',
    tipo: 'networking',
    label: 'Networking',
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>`,
  },
  {
    id: 'tab-storage',
    tipo: 'storage',
    label: 'Almacenamiento',
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  },
];
 
/* ─────────────────────────────────────────────
   CONSTRUIR LA TABLA A PARTIR DEL HTML ORIGINAL
───────────────────────────────────────────────*/
function buildCatalogTable() {
  const catalogoDiv = document.getElementById('catalogoProductos');
  if (!catalogoDiv) return;
 
  // Contenedor KPI encima de la tabla
  const kpiBanner = document.createElement('div');
  kpiBanner.className = 'catalogo-kpi-banner';
  kpiBanner.id = 'tablaKpiBanner';
  kpiBanner.innerHTML = `
    <div class="kpi-item">
      <span class="kpi-label">Unidades</span>
      <span class="kpi-value" id="kpiUnidades">0</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-label">Subtotal lista</span>
      <span class="kpi-value kpi-value--orange" id="kpiSubtotalLista">$0</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-label">Descuento</span>
      <span class="kpi-value kpi-value--green" id="kpiDcto">0%</span>
    </div>
    <div class="kpi-item">
      <span class="kpi-label">Ahorro total $</span>
      <span class="kpi-value kpi-value--green" id="kpiAhorro">$0</span>
    </div>
  `;
  catalogoDiv.parentNode.insertBefore(kpiBanner, catalogoDiv);
 
  // Para cada categoría definida, construir su tabla
  CATALOG_CATEGORIES.forEach((cat, catIdx) => {
    // Obtener los product-item del accordion original
    const originalCat = catalogoDiv.querySelector(`.product-category[data-tipo="${cat.tipo}"]`);
    if (!originalCat) return;
 
    const items = originalCat.querySelectorAll('.product-item');
    if (items.length === 0) return;
 
    // Wrapper de la tabla
    const wrap = document.createElement('div');
    wrap.className = 'catalog-table-wrap' + (catIdx === 0 ? ' open' : '');
    wrap.id = `tablewrap-${cat.tipo}`;
    wrap.dataset.tipo = cat.tipo;
 
    // Header colapsable
    wrap.innerHTML = `
      <div class="catalog-table-header" onclick="toggleTableCat('tablewrap-${cat.tipo}')">
        ${cat.icon}
        <h3>${cat.label}</h3>
        <span class="cat-badge" id="tablebadge-${cat.tipo}"></span>
        <svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
      </div>
      <div class="catalog-table-body">
        <div class="cat-col-headers">
          <span class="cat-col-label">Producto</span>
          <span class="cat-col-label right">P. Lista</span>
          <span class="cat-col-label center">Cantidad</span>
          <span class="cat-col-label right">P. c/dto.</span>
          <span class="cat-col-label right">Subtotal</span>
          <span class="cat-col-label right">Ahorro $</span>
        </div>
        <div class="product-rows" id="rows-${cat.tipo}"></div>
      </div>
    `;
 
    catalogoDiv.parentNode.insertBefore(wrap, catalogoDiv);
 
    // Construir filas
    const rowsContainer = wrap.querySelector(`#rows-${cat.tipo}`);
 
    items.forEach(item => {
      const name   = item.dataset.name  || '';
      const specs  = item.dataset.specs || '';
      const marca  = item.dataset.marca || '';
      const price  = parseInt(item.dataset.price) || 0;
      const usd    = Math.round(price / (window.tipoCambio || 900));
 
      // Clonar el select de servicios
      const origSelect = item.querySelector('.product-service-select');
      const selectClone = origSelect ? origSelect.cloneNode(true) : null;
      if (selectClone) {
        selectClone.addEventListener('change', () => {
          // Sincronizar con el select original
          if (origSelect) origSelect.value = selectClone.value;
          if (typeof window.updateSidebar === 'function') window.updateSidebar();
        });
      }
 
      // Crear fila
      const row = document.createElement('div');
      row.className = 'product-row';
      row.dataset.price = price;
      row.dataset.name  = name;
      row.dataset.marca = marca;
      row.dataset.tipo  = cat.tipo;
      row.dataset.specs = specs;
 
      row.innerHTML = `
        <div class="pr-info">
          <div class="pr-name">${name}</div>
          <div class="pr-specs">${specs}</div>
          <span class="pr-marca-badge">${marca}</span>
        </div>
        <div class="pr-precio-lista">
          <span class="precio-base" id="preciobase-${slugify(name)}">$${fmt(price)}</span>
          <span class="precio-usd">≈ USD ${usd.toLocaleString('en-US')}</span>
        </div>
        <div class="pr-qty">
          <button type="button" onclick="tablaDecrement(event)">−</button>
          <span class="qty-value" id="qty-${slugify(name)}">0</span>
          <button type="button" onclick="tablaIncrement(event)">+</button>
        </div>
        <div class="pr-precio-dto">
          <span class="precio-dto-val sin-dto" id="preciodto-${slugify(name)}">$${fmt(price)}</span>
          <span class="dto-badge oculto" id="dtobadge-${slugify(name)}"></span>
        </div>
        <div class="pr-subtotal">
          <span class="subtotal-val inactive" id="subtotal-${slugify(name)}">—</span>
        </div>
        <div class="pr-ahorro">
          <span class="ahorro-val cero" id="ahorro-${slugify(name)}">—</span>
        </div>
      `;
 
      rowsContainer.appendChild(row);
 
      // Fila de servicio
      if (selectClone) {
        const svcRow = document.createElement('div');
        svcRow.className = 'product-service-row';
        svcRow.id = `svcrow-${slugify(name)}`;
        svcRow.innerHTML = `
          <label class="product-service-label">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            Servicio:
          </label>
        `;
        svcRow.appendChild(selectClone);
        rowsContainer.appendChild(svcRow);
      }
    });
  });
 
  // Ocultar el catalogoDiv original (los product-category ya se ocultan con CSS,
  // pero ocultamos también el wrapper si queda vacío)
  catalogoDiv.style.display = 'none';
 
  // Primer render de precios
  refreshTablePrices();
}
 
/* ─────────────────────────────────────────────
   TOGGLE CATEGORÍA TABLA
───────────────────────────────────────────────*/
function toggleTableCat(id) {
  document.getElementById(id)?.classList.toggle('open');
}
window.toggleTableCat = toggleTableCat;
 
/* ─────────────────────────────────────────────
   INCREMENTAR / DECREMENTAR EN TABLA
───────────────────────────────────────────────*/
function tablaIncrement(event) {
  event.preventDefault();
  const qtySpan = event.currentTarget.parentElement.querySelector('.qty-value');
  qtySpan.textContent = parseInt(qtySpan.textContent) + 1;
 
  const row = event.currentTarget.closest('.product-row');
  const name = row?.dataset.name;
 
  // Sincronizar con el qty-value del accordion original
  syncOriginalQty(name, parseInt(qtySpan.textContent));
 
  toggleServiceRow(name, parseInt(qtySpan.textContent));
  refreshTablePrices();
  if (typeof window.updateSidebar     === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento === 'function') window.actualizarDescuento();
 
  // Actualizar badge de categoría original
  const origItem = document.querySelector(`.product-item[data-name="${CSS.escape(name)}"]`);
  if (origItem) {
    const cat = origItem.closest('.product-category');
    if (typeof window.updateCatBadge === 'function') window.updateCatBadge(cat);
  }
}
 
function tablaDecrement(event) {
  event.preventDefault();
  const qtySpan = event.currentTarget.parentElement.querySelector('.qty-value');
  const current = parseInt(qtySpan.textContent);
  if (current <= 0) return;
 
  qtySpan.textContent = current - 1;
 
  const row = event.currentTarget.closest('.product-row');
  const name = row?.dataset.name;
 
  syncOriginalQty(name, current - 1);
  toggleServiceRow(name, current - 1);
  refreshTablePrices();
  if (typeof window.updateSidebar       === 'function') window.updateSidebar();
  if (typeof window.actualizarDescuento === 'function') window.actualizarDescuento();
 
  const origItem = document.querySelector(`.product-item[data-name="${CSS.escape(name)}"]`);
  if (origItem) {
    const cat = origItem.closest('.product-category');
    if (typeof window.updateCatBadge === 'function') window.updateCatBadge(cat);
  }
}
 
window.tablaIncrement = tablaIncrement;
window.tablaDecrement = tablaDecrement;
 
/* ─────────────────────────────────────────────
   SINCRONIZAR QTY CON EL ACCORDION ORIGINAL
   (para que collectEquipos() siga funcionando)
───────────────────────────────────────────────*/
function syncOriginalQty(name, qty) {
  const origItem = document.querySelector(`.product-item[data-name="${CSS.escape(name)}"]`);
  if (!origItem) return;
  const origQty = origItem.querySelector('.qty-value');
  if (origQty) origQty.textContent = qty;
}
 
/* ─────────────────────────────────────────────
   MOSTRAR / OCULTAR FILA DE SERVICIO
───────────────────────────────────────────────*/
function toggleServiceRow(name, qty) {
  const svcRow = document.getElementById(`svcrow-${slugify(name)}`);
  if (!svcRow) return;
  if (qty > 0) {
    svcRow.classList.add('visible');
  } else {
    svcRow.classList.remove('visible');
    // Resetear select
    const sel = svcRow.querySelector('select');
    if (sel) {
      sel.value = '';
      // Sync original
      const origItem = document.querySelector(`.product-item[data-name="${CSS.escape(name)}"]`);
      if (origItem) {
        const origSel = origItem.querySelector('select');
        if (origSel) origSel.value = '';
      }
    }
  }
}
 
/* ─────────────────────────────────────────────
   REFRESCAR PRECIOS EN TODA LA TABLA
───────────────────────────────────────────────*/
function refreshTablePrices() {
  // 1. Calcular total de unidades para determinar % descuento
  let totalQty = 0;
  document.querySelectorAll('.product-row .qty-value').forEach(el => {
    totalQty += parseInt(el.textContent) || 0;
  });
  const pct = obtenerPctDescuento(totalQty);
 
  // 2. Variables de totales para KPI
  let totalListaAcum = 0;
  let totalAhorroAcum = 0;
 
  // 3. Recorrer cada fila y actualizar celdas
  document.querySelectorAll('.product-row').forEach(row => {
    const price  = parseInt(row.dataset.price) || 0;
    const name   = row.dataset.name;
    const slug   = slugify(name);
    const qty    = parseInt(row.querySelector('.qty-value')?.textContent) || 0;
    const tc     = window.tipoCambio || 900;
 
    const precioConDto = Math.round(price * (1 - pct / 100));
    const subtotal     = qty * precioConDto;
    const subtotalLista = qty * price;
    const ahorroLinea  = subtotalLista - subtotal;
 
    totalListaAcum  += subtotalLista;
    totalAhorroAcum += ahorroLinea;
 
    // Precio lista (tachar si hay dto)
    const elBase = document.getElementById(`preciobase-${slug}`);
    if (elBase) {
      elBase.textContent = `$${fmt(price)}`;
      if (pct > 0 && qty > 0) {
        elBase.classList.add('tachado');
      } else {
        elBase.classList.remove('tachado');
      }
    }
 
    // Precio con dto.
    const elDto = document.getElementById(`preciodto-${slug}`);
    const elDtoBadge = document.getElementById(`dtobadge-${slug}`);
    if (elDto) {
      elDto.textContent = `$${fmt(precioConDto)}`;
      if (pct > 0) {
        elDto.classList.remove('sin-dto');
        if (elDtoBadge) {
          elDtoBadge.textContent = `-${pct}%`;
          elDtoBadge.classList.remove('oculto');
        }
      } else {
        elDto.classList.add('sin-dto');
        if (elDtoBadge) elDtoBadge.classList.add('oculto');
      }
    }
 
    // Subtotal
    const elSub = document.getElementById(`subtotal-${slug}`);
    if (elSub) {
      if (qty > 0) {
        elSub.textContent = `$${fmt(subtotal)}`;
        elSub.classList.remove('inactive');
      } else {
        elSub.textContent = '—';
        elSub.classList.add('inactive');
      }
    }
 
    // Ahorro por línea
    const elAhorro = document.getElementById(`ahorro-${slug}`);
    if (elAhorro) {
      if (qty > 0 && ahorroLinea > 0) {
        elAhorro.textContent = `$${fmt(ahorroLinea)}`;
        elAhorro.classList.remove('cero');
      } else if (qty > 0) {
        elAhorro.textContent = '$0';
        elAhorro.classList.add('cero');
      } else {
        elAhorro.textContent = '—';
        elAhorro.classList.add('cero');
      }
    }
 
    // Badge de categoría tabla
    const wrap = row.closest('.catalog-table-wrap');
    if (wrap) {
      const tipo = wrap.dataset.tipo;
      updateTableCatBadge(tipo);
    }
  });
 
  // 4. Actualizar KPI banner
  const kpiUnidades = document.getElementById('kpiUnidades');
  const kpiSubLista = document.getElementById('kpiSubtotalLista');
  const kpiDcto     = document.getElementById('kpiDcto');
  const kpiAhorro   = document.getElementById('kpiAhorro');
 
  if (kpiUnidades) kpiUnidades.textContent = totalQty;
  if (kpiSubLista) kpiSubLista.textContent = `$${fmt(totalListaAcum)}`;
  if (kpiDcto)     kpiDcto.textContent     = pct > 0 ? `${pct}%` : '0%';
  if (kpiAhorro)   kpiAhorro.textContent   = `$${fmt(totalAhorroAcum)}`;
 
  // 5. Actualizar también los precios USD
  document.querySelectorAll('.product-row').forEach(row => {
    const price = parseInt(row.dataset.price) || 0;
    const tc    = window.tipoCambio || 900;
    const usdEl = row.querySelector('.precio-usd');
    if (usdEl) usdEl.textContent = `≈ USD ${Math.round(price / tc).toLocaleString('en-US')}`;
  });
}
 
/* ─────────────────────────────────────────────
   BADGE POR CATEGORÍA EN TABLA
───────────────────────────────────────────────*/
function updateTableCatBadge(tipo) {
  let total = 0;
  document.querySelectorAll(`.product-row[data-tipo="${tipo}"] .qty-value`).forEach(el => {
    total += parseInt(el.textContent) || 0;
  });
  const badge = document.getElementById(`tablebadge-${tipo}`);
  if (badge) {
    badge.textContent = `${total} uds`;
    badge.classList.toggle('visible', total > 0);
  }
}
 
/* ─────────────────────────────────────────────
   FILTROS: aplicar también a las filas de tabla
───────────────────────────────────────────────*/
const _originalAplicarFiltros = window.aplicarFiltros;
window.aplicarFiltros = function () {
  // Filtrar en el accordion original (para que la lógica original siga funcionando)
  if (typeof _originalAplicarFiltros === 'function') _originalAplicarFiltros();
 
  // Filtrar también en las filas de tabla
  const q = (document.getElementById('searchProductos')?.value || '').toLowerCase();
 
  // Leer filtro activo de marca y tipo desde los chips
  const activeChipMarca = document.querySelector('#filtrosMarca .chip.active');
  const activeChipTipo  = document.querySelector('#filtrosTipo .chip.active, #filtrosTipo .sidebar-menu-item.active');
  const filtroMarca = activeChipMarca?.dataset?.val || 'todos';
  const filtroTipo  = activeChipTipo?.dataset?.val  || 'todos';
 
  document.querySelectorAll('.catalog-table-wrap').forEach(wrap => {
    const catTipo = wrap.dataset.tipo;
    const tipoOk  = filtroTipo === 'todos' || catTipo === filtroTipo;
    let rowsVisible = 0;
 
    wrap.querySelectorAll('.product-row').forEach(row => {
      const marcaOk  = filtroMarca === 'todos' || (row.dataset.marca || '').toLowerCase().includes(filtroMarca.toLowerCase());
      const searchOk = !q || (row.dataset.name  || '').toLowerCase().includes(q)
                          || (row.dataset.specs || '').toLowerCase().includes(q)
                          || (row.dataset.marca || '').toLowerCase().includes(q);
 
      const visible = tipoOk && marcaOk && searchOk;
      row.style.display = visible ? '' : 'none';
 
      // También ocultar fila de servicio si el producto no es visible
      const svcRow = document.getElementById(`svcrow-${slugify(row.dataset.name)}`);
      if (svcRow) svcRow.style.display = visible ? '' : 'none';
 
      if (visible) rowsVisible++;
    });
 
    wrap.style.display = rowsVisible > 0 ? '' : 'none';
  });
};
 
/* ─────────────────────────────────────────────
   PARCHE: refreshTablePrices cuando cambia el
   descuento (llamada desde actualizarDescuento)
───────────────────────────────────────────────*/
const _originalActualizarDescuento = window.actualizarDescuento;
window.actualizarDescuento = function () {
  if (typeof _originalActualizarDescuento === 'function') _originalActualizarDescuento();
  refreshTablePrices();
};
 
/* ─────────────────────────────────────────────
   PARCHE: refreshTablePrices cuando cambia el
   tipo de cambio (dólar TIC)
───────────────────────────────────────────────*/
const _origActualizarTipoCambio = window.actualizarTipoCambio;
window.actualizarTipoCambio = function (val) {
  if (typeof _origActualizarTipoCambio === 'function') _origActualizarTipoCambio(val);
  refreshTablePrices();
};
 
/* ─────────────────────────────────────────────
   HELPERS
───────────────────────────────────────────────*/
function fmt(n) {
  return n.toLocaleString('es-CL');
}
 
function slugify(str) {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
 
/* ─────────────────────────────────────────────
   INIT: esperar a que el DOM y el JS original
   estén listos
───────────────────────────────────────────────*/
document.addEventListener('DOMContentLoaded', () => {
  // Pequeño delay para asegurarnos que configurador.js terminó su DOMContentLoaded
  setTimeout(() => {
    buildCatalogTable();
    refreshTablePrices();
  }, 50);
});