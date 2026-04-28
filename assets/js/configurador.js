/* ═══════════════════════════════════════════════════════════════
   configurador.js — InfraGo
   ───────────────────────────────────────────────────────────────
   Contiene: navegación wizard, validaciones, descuentos,
   tipo de cambio, sidebar, resumen, simulador, cotización.

   La tabla del catálogo es responsabilidad de flat-catalog.js.
   ═══════════════════════════════════════════════════════════════ */

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
window.tipoCambio = 900; // inicializar inmediatamente para que flat-catalog lo use

async function fetchDolarTIC() {
  const input = document.getElementById('tipoCambio');
  const note  = document.getElementById('dolarNote');
  try {
    const res  = await fetch('https://mindicador.cl/api/dolar');
    const data = await res.json();
    const raw  = data?.serie?.[0]?.valor;
    if (raw && raw > 0) {
      tipoCambio = Math.round(raw) + 5; // BCCh + $5 TIC
      window.tipoCambio = tipoCambio;
      if (input) input.value = tipoCambio;
      if (note)  note.textContent = `Tipo de cambio actualizado: $${tipoCambio.toLocaleString('es-CL')} CLP/USD`;
      // Notificar a flat-catalog para que actualice los precios USD
      if (typeof window.flatRefreshPrices === 'function') window.flatRefreshPrices();
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
    window.tipoCambio = v;
    if (typeof window.flatRefreshPrices === 'function') window.flatRefreshPrices();
    updateSidebar();
    actualizarDescuento();
  }
}

function cambiarDolar(delta) {
  const input = document.getElementById('tipoCambio');
  tipoCambio = Math.max(1, tipoCambio + delta);
  window.tipoCambio = tipoCambio;
  if (input) input.value = tipoCambio;
  if (typeof window.flatRefreshPrices === 'function') window.flatRefreshPrices();
  updateSidebar();
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

function obtenerPctDescuento(totalQty) {
  const tramo = DCTO_TRAMOS.find(t => totalQty >= t.min && totalQty <= t.max);
  return tramo ? tramo.pct : 0;
}

function actualizarDescuento() {
  // Contar SOLO hardware (no servicio-tic ni accesorios) para el descuento por volumen
  let totalQty = 0;
  if (typeof window._flatRows !== 'undefined') {
    window._flatRows.forEach(r => {
      if (!r.productName) return;
      const prod = (window.CATALOGO || []).find(p => p.name === r.productName);
      if (prod && prod.tipo !== 'servicio-tic' && prod.tipo !== 'accesorios') totalQty += r.qty;
    });
  } else {
    // Fallback: accordion oculto
    document.querySelectorAll('.product-item .qty-value').forEach(el => {
      totalQty += parseInt(el.textContent) || 0;
    });
  }

  // Resaltar fila activa en tabla de descuentos
  document.querySelectorAll('.dcto-row').forEach(row => {
    const min = parseInt(row.dataset.min);
    const max = parseInt(row.dataset.max);
    row.classList.toggle('dcto-active', totalQty >= min && totalQty <= max);
  });

  // Mostrar descuento aplicado
  const tramo   = DCTO_TRAMOS.find(t => totalQty >= t.min && totalQty <= t.max);
  const dctoEl  = document.getElementById('dctoAplicado');
  const dctoVal = document.getElementById('dctoAplicadoVal');
  if (dctoEl && dctoVal) {
    if (tramo) {
      dctoEl.style.display = 'flex';
      dctoVal.textContent  = tramo.pct + '%';
    } else {
      dctoEl.style.display = 'none';
    }
  }

  // Propagar a flat-catalog para repintar precios
  if (typeof window.flatRefreshPrices === 'function') window.flatRefreshPrices();
}

// ═════════════════════════════════════════
// ESTADO DEL WIZARD
// ═════════════════════════════════════════
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
  // Guardar datos del paso actual ANTES de cambiar el display
  if (currentStep === 1) {
    collectEquipos();
    collectServicios();
  }
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
  document.querySelectorAll('.wizard-step').forEach(step => step.classList.remove('active'));
  document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
  updateProgressBar();
  updateButtons();

  const isStep1 = currentStep === 1;

  // Sidebar izquierdo
  const sidebar = document.querySelector('.config-sidebar');
  if (sidebar) sidebar.style.display = isStep1 ? '' : 'none';
  const leftSidebar = document.getElementById('configLeftSidebar');
  if (leftSidebar) leftSidebar.style.display = isStep1 ? '' : 'none';

  // Barra derecha (resumen)
  const bottomBar = document.getElementById('bottomBar');
  if (bottomBar) bottomBar.style.display = isStep1 ? '' : 'none';

  // Layout: columna única en pasos 2-4
  const layout = document.querySelector('.config-layout');
  if (layout) layout.classList.toggle('config-layout--single', !isStep1);

  // Botón Anterior y Next inline
  const btnPrev    = document.getElementById('btnPrev');
  const inlineNext = document.getElementById('btnNextInline');
  if (btnPrev)     btnPrev.style.display    = isStep1 ? 'none' : '';
  if (inlineNext) {
    inlineNext.style.display = isStep1 ? 'none' : '';
    if (currentStep === totalSteps) {
      inlineNext.textContent = 'Enviar Cotización';
      inlineNext.onclick = solicitarCotizacion;
    } else {
      inlineNext.textContent = 'Siguiente →';
      inlineNext.onclick = nextStep;
    }
  }

  if (currentStep === 2) initSimulador();
  if (currentStep === 3) {
    const regionVal = (document.getElementById('region') || {}).value;
    if (regionVal) {
      popularComunas(regionVal);
      const comunaVal = (document.getElementById('ciudad') || {}).value;
      if (comunaVal) cotizarDespachoForm();
    }
  }
  if (currentStep === 4) generateFinalSummary();
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
    btnNext.textContent = 'Enviar Cotización';
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
    // La validación real de qty la hace flat-catalog (_overrideValidateStep)
    // pero si flat-catalog no está, usamos fallback
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

  if (step === 2) {
    // Simulador — solo recopilar equipos para el cálculo
    collectEquipos();
    collectServicios();
  }

  if (step === 3 && !validateForm()) return false;

  if (step === 3) {
    collectFormulario();
  }

  return true;
}

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
// PRODUCTOS — accordion oculto (fallback)
// La tabla real es flat-catalog.js
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
  // Preserve existing state if _flatRows is not available and DOM is not visible (pasos > 1)
  const hasFlatRows = typeof window._flatRows !== 'undefined';

  if (hasFlatRows) {
    // Fuente de verdad: flat-catalog rows
    state.equipos = {};

    // Calcular total hardware para descuento por volumen (excluye servicio-tic y accesorios)
    const totalQtyHw = window._flatRows
      .filter(r => r.productName && r.qty > 0)
      .reduce((s, r) => {
        const prod = (window.CATALOGO || []).find(p => p.name === r.productName);
        return prod && prod.tipo !== 'servicio-tic' && prod.tipo !== 'accesorios' ? s + r.qty : s;
      }, 0);
    const pct = obtenerPctDescuento(totalQtyHw);

    window._flatRows.forEach(r => {
      if (!r.productName || r.qty <= 0) return;
      const producto = (window.CATALOGO || []).find(p => p.name === r.productName);
      if (!producto) return;
      const tc = window.tipoCambio || 900;
      const basePrice = (producto.priceUSD && producto.priceUSD > 0)
        ? Math.round(producto.priceUSD * tc)
        : (producto.price || 0);
      // Aplicar descuento por volumen solo a hardware (servicio-tic y accesorios no descuentan)
      const price = (producto.tipo !== 'servicio-tic' && producto.tipo !== 'accesorios')
        ? Math.round(basePrice * (1 - pct / 100))
        : basePrice;
      state.equipos[r.productName] = { qty: r.qty, price };
    });
  } else {
    // Fallback: DOM accordion — solo actualizar si el paso 1 está visible
    const step1 = document.querySelector('.wizard-step[data-step="1"]');
    const step1Visible = step1 && step1.classList.contains('active');
    if (!step1Visible && Object.keys(state.equipos).length > 0) return; // preserve existing state
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
}

function collectServicios() {
  const hasFlatRows = typeof window._flatRows !== 'undefined';
  const step1 = document.querySelector('.wizard-step[data-step="1"]');
  const step1Visible = step1 && step1.classList.contains('active');

  // Solo resetear servicios si estamos en el paso 1 o hay flatRows disponibles
  if (step1Visible || hasFlatRows) {
    state.servicios = {};
  }

  // Servicios asociados a productos (service-check selects) — solo si paso 1 visible
  if (step1Visible || !hasFlatRows) {
    document.querySelectorAll('.service-check').forEach(el => {
      const selectedOption = el.options ? el.options[el.selectedIndex] : null;
      if (!selectedOption || !selectedOption.value) return;
      const price = parseInt(selectedOption.dataset.price) || 0;
      if (price === 0) return;
      const prefix    = el.dataset.namePrefix || el.dataset.name || 'Servicio';
      const label     = `${prefix} — ${selectedOption.text.split('—')[0].trim()}`;
      const frecuencia = selectedOption.dataset.frecuencia || '/mes';
      state.servicios[label] = { price, frecuencia };
    });
  }

  // Productos tipo servicio-tic desde _flatRows
  if (hasFlatRows) {
    window._flatRows.forEach(r => {
      if (!r.productName || r.qty <= 0) return;
      const producto = (window.CATALOGO || []).find(p => p.name === r.productName);
      if (!producto || producto.tipo !== 'servicio-tic') return;
      // servicio-tic siempre es mensual
      state.servicios[r.productName] = { price: (producto.price || 0) * r.qty, frecuencia: '/mes' };
    });
  }
}

// ═════════════════════════════════════════
// SIDEBAR / STICKY RESUMEN
// ═════════════════════════════════════════
function updateSidebar() {
  let totalEqBase   = 0;  // hardware precio lista (sin descuento)
  let totalEqCLP    = 0;  // hardware precio con descuento (lo que paga el cliente)
  let totalQtyEq    = 0;  // unidades de hardware
  let totalQtySvc   = 0;  // unidades de servicios
  const selectedProducts = [];

  // Leer desde _flatRows si está disponible (fuente de verdad)
  if (typeof window._flatRows !== 'undefined') {
    // Paso 1: contar SOLO hardware para el descuento por volumen
    const qtyHardware = window._flatRows
      .filter(r => r.productName && r.qty > 0)
      .reduce((s, r) => {
        const prod = (window.CATALOGO || []).find(p => p.name === r.productName);
        return prod && prod.tipo !== 'servicio-tic' ? s + r.qty : s;
      }, 0);

    const pct = obtenerPctDescuento(qtyHardware);

    window._flatRows.forEach(r => {
      if (!r.productName || r.qty <= 0) return;
      const producto = (window.CATALOGO || []).find(p => p.name === r.productName);
      if (!producto) return;

      if (producto.tipo === 'servicio-tic') return; // los servicios TIC van aparte

      // Hardware: precio dinámico (USD × tipo de cambio si aplica) con descuento por volumen
      const tc = window.tipoCambio || 900;
      const precioBase = (producto.priceUSD && producto.priceUSD > 0)
        ? Math.round(producto.priceUSD * tc)
        : (producto.price || 0);
      const precio = Math.round(precioBase * (1 - pct / 100));
      totalEqBase += r.qty * precioBase;  // acumula precio lista
      totalEqCLP  += r.qty * precio;      // acumula precio con descuento
      totalQtyEq  += r.qty;
      selectedProducts.push({ name: r.productName, qty: r.qty });
    });
  } else {
    // Fallback: accordion
    document.querySelectorAll('.product-item').forEach(item => {
      const qty      = parseInt(item.querySelector('.qty-value').textContent) || 0;
      const priceCLP = parseInt(item.dataset.price) || 0;
      const name     = item.dataset.name;
      if (qty > 0) {
        totalQtyEq += qty;
        totalEqCLP += qty * priceCLP;
        selectedProducts.push({ name, qty });
      }
    });
  }

  // Servicios: asociados a productos (service-check) + servicio-tic de flat rows
  let totalSvc = 0;
  let countSvc = 0;

  document.querySelectorAll('.service-check').forEach(el => {
    const selectedOption = el.options ? el.options[el.selectedIndex] : null;
    if (!selectedOption || !selectedOption.value) return;
    const price = parseInt(selectedOption.dataset.price) || 0;
    if (price === 0) return;
    totalSvc += price; // todos los servicios suman al total independiente de frecuencia
    countSvc++;
  });

  // Servicios TIC desde flat rows — SIN descuento por volumen
  if (typeof window._flatRows !== 'undefined') {
    window._flatRows.forEach(r => {
      if (!r.productName || r.qty <= 0) return;
      const producto = (window.CATALOGO || []).find(p => p.name === r.productName);
      if (!producto || producto.tipo !== 'servicio-tic') return;
      totalSvc    += (producto.price || 0) * r.qty;
      countSvc    += r.qty;
      totalQtySvc += r.qty;
    });
  }

  // Cálculos correctos — totalEqCLP ya tiene el descuento aplicado desde el loop
  const pctDcto     = obtenerPctDescuento(totalQtyEq);
  const descuento   = Math.round(totalEqBase - totalEqCLP); // ahorro real: lista − con descuento
  const totalNeto   = totalEqCLP + totalSvc;                // neto: hw descontado + servicios
  const iva         = Math.round(totalNeto * 0.19);
  const totalConIVA = totalNeto + iva;
  const totalQty    = totalQtyEq;

  const setTxt = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  setTxt('countEquipos',   totalQty);
  setTxt('countServicios', countSvc);
  setTxt('totalEquipos',   Math.round(totalEqCLP * 1.19).toLocaleString('es-CL'));
  setTxt('totalServicios', Math.round(totalSvc * 1.19).toLocaleString('es-CL'));
  setTxt('totalNeto',      totalNeto.toLocaleString('es-CL'));
  setTxt('totalIVA',       iva.toLocaleString('es-CL'));
  setTxt('totalGeneral',   totalConIVA.toLocaleString('es-CL'));
  setTxt('ahorroTotal',    Math.round(descuento * 1.19).toLocaleString('es-CL'));
  setTxt('descuentoPct',   pctDcto > 0 ? pctDcto + '%' : '—');
  setTxt('plazoSidebarLabel', simPlazo);

  // Lista de productos en sidebar
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

  // ── Sincronizar state en vivo cada vez que cambie el sidebar ──
  // Esto garantiza que state.equipos y state.servicios siempre reflejen
  // lo que está seleccionado, sin importar en qué paso se encuentre el usuario
  collectEquipos();
  collectServicios();
}

// ═════════════════════════════════════════
// RESUMEN (Paso 3)
// ═════════════════════════════════════════
function generateFinalSummary() {
  // state.equipos y state.servicios ya están actualizados via updateSidebar()
  // Solo aseguramos tener los datos más frescos si _flatRows está disponible
  if (typeof window._flatRows !== 'undefined') {
    collectEquipos();
    collectServicios();
  }

  const fmt    = n => n.toLocaleString('es-CL');
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  // ── Productos (solo hardware, excluye servicio-tic) ──────────────────────
  const summaryEquipos = document.getElementById('summaryEquipos');
  // Filtrar state.equipos para excluir servicio-tic
  const eqEntries = Object.entries(state.equipos).filter(([name]) => {
    const prod = (window.CATALOGO || []).find(p => p.name === name);
    return !prod || prod.tipo !== 'servicio-tic';
  });
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
      summaryServicios.innerHTML = svcEntries.map(([name, svc]) => {
        const price     = typeof svc === 'object' ? svc.price      : svc;
        const frecuencia = typeof svc === 'object' ? svc.frecuencia : '/mes';
        totalSvc += price;
        const freqLabel = frecuencia === 'al inicio' ? ' — pago al inicio'
                        : frecuencia === '/año'       ? '/año'
                        : '/mes';
        return `<div class="resumen-line-item">
          <div class="resumen-line-info">
            <span class="resumen-line-name">${name}</span>
            <span class="resumen-line-qty" style="font-size:10px;opacity:0.6;">${frecuencia === 'al inicio' ? 'pago único' : frecuencia === '/año' ? 'anual' : 'mensual'}</span>
          </div>
          <span class="resumen-line-price">$${fmt(price)}${freqLabel}</span>
        </div>`;
      }).join('');
    }
  }

  // Subtotales con IVA en los footers de cada card
  const eqIVA  = Math.round(totalEq * 1.19);
  const svcIVA = Math.round(totalSvc * 1.19);
  setTxt('summarySubtotalEq',  fmt(eqIVA));
  setTxt('summarySubtotalSvc', fmt(svcIVA));

  // Guardar neto para que refreshResumenTotales lo use
  window._summaryNetoEq  = totalEq;
  window._summaryNetoSvc = totalSvc;
  refreshResumenTotales();

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
  // state.equipos y state.servicios ya están sincronizados por updateSidebar()
  if (typeof window._flatRows !== 'undefined') {
    collectEquipos();
    collectServicios();
  }

  const totalEq  = Object.entries(state.equipos)
    .filter(([name]) => { const p = (window.CATALOGO||[]).find(x => x.name === name); return !p || p.tipo !== 'servicio-tic'; })
    .reduce((s, [, e]) => s + e.qty * e.price, 0);
  const totalSvc = Object.values(state.servicios).reduce((s, v) => s + (typeof v === 'object' ? v.price : v), 0);

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('montoFinanciar',        Math.round(totalEq * 1.19).toLocaleString('es-CL'));
  setTxt('serviciosMensualesSim', Math.round(totalSvc * 1.19).toLocaleString('es-CL'));

  calcularSimulador();
}

function calcularSimulador() {
  const totalEq  = Object.entries(state.equipos)
    .filter(([name]) => { const p = (window.CATALOGO||[]).find(x => x.name === name); return !p || p.tipo !== 'servicio-tic'; })
    .reduce((s, [, e]) => s + e.qty * e.price, 0);
  const totalSvc = Object.values(state.servicios).reduce((s, v) => s + (typeof v === 'object' ? v.price : v), 0);

  const principal   = Math.round(totalEq * 1.19);
  const svcIVA      = Math.round(totalSvc * 1.19);
  const tasaMensual = simTasa / 100 / 12;
  const n           = simPlazo;

  let cuotaProducto = 0;
  if (tasaMensual === 0) {
    cuotaProducto = principal / n;
  } else {
    cuotaProducto = principal * (tasaMensual * Math.pow(1 + tasaMensual, n)) / (Math.pow(1 + tasaMensual, n) - 1);
  }

  const cuotaTotal = Math.round(cuotaProducto + svcIVA);
  const totalPagar = Math.round(cuotaProducto * n + svcIVA * n);
  const intereses  = Math.round(cuotaProducto * n - principal);

  const fmt    = v => v.toLocaleString('es-CL');
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  setTxt('simCuota',    '$' + fmt(cuotaTotal));
  setTxt('simTotal',    '$' + fmt(totalPagar));
  setTxt('simIntereses','$' + fmt(Math.max(0, intereses)));

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
    const interes = Math.round(saldo * tasaMensual);
    const capital = Math.round(cuota - interes);
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

  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt('plazoSidebarLabel', simPlazo);
  setTxt('cuotaMensual', calcularCuotaSimple());

  // Actualizar resumen si ya fue generado
  if (currentStep === 4) generateFinalSummary();
}

function updateTasa(val) {
  simTasa = parseFloat(val);
  const el = document.getElementById('tasaVal');
  if (el) el.textContent = simTasa + '%';
  calcularSimulador();
  if (currentStep === 4) generateFinalSummary();
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
  const totalEq     = Object.values(state.equipos).reduce((s, e) => s + e.qty * e.price, 0);
  const tasaMensual = simTasa / 100 / 12;
  const n           = simPlazo;
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
// ═════════════════════════════════════════
// DESCARGA PDF
// ═════════════════════════════════════════
function descargarCotizacionPDF() {
  const f = state.formulario;
  const fmt = n => (n || 0).toLocaleString('es-CL');

  // Construir items de productos
  const eqRows = Object.entries(state.equipos)
    .filter(([name]) => {
      const prod = (window.CATALOGO || []).find(p => p.name === name);
      return !prod || prod.tipo !== 'servicio-tic';
    })
    .map(([name, v]) => {
      const priceIVA = Math.round(v.price * 1.19);
      return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">${name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:center;">${v.qty}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;">$${fmt(priceIVA)}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">$${fmt(v.qty * priceIVA)}</td>
      </tr>`;
    }).join('');

  const svcRows = Object.entries(state.servicios).map(([name, svc]) => {
    const price = typeof svc === 'object' ? svc.price : svc;
    const freq  = typeof svc === 'object' ? svc.frecuencia : '/mes';
    return `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;" colspan="3">${name}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;text-align:right;font-weight:600;">$${fmt(Math.round(price * 1.19))}${freq}</td>
      </tr>`;
  }).join('');

  const totalEqNeto = Object.entries(state.equipos)
    .filter(([name]) => { const p = (window.CATALOGO||[]).find(x=>x.name===name); return !p||p.tipo!=='servicio-tic'; })
    .reduce((s, [, v]) => s + v.qty * v.price, 0);
  const totalSvcNeto = Object.values(state.servicios).reduce((s, v) => s + (typeof v === 'object' ? v.price : v), 0);
  const totalEq  = Math.round(totalEqNeto * 1.19);
  const totalSvc = Math.round(totalSvcNeto * 1.19);
  const totalGen = totalEq + totalSvc;

  const fecha = new Date().toLocaleDateString('es-CL', { year:'numeric', month:'long', day:'numeric' });

  const htmlPDF = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Cotización InfraGo — ${f.empresa || 'Cliente'}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 13px; color: #1a2540; background: #fff; padding: 32px; }
    .header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:32px; }
    .logo { font-size:28px; font-weight:900; color:#1a2540; }
    .logo span { color:#e6a817; }
    .meta { text-align:right; color:#666; font-size:12px; }
    .meta strong { display:block; font-size:16px; font-weight:700; color:#1a2540; margin-bottom:4px; }
    .divider { height:3px; background: linear-gradient(90deg,#1a2540,#e6a817); border-radius:2px; margin-bottom:28px; }
    .section-title { font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:1px; color:#e6a817; margin-bottom:12px; }
    .info-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 24px; margin-bottom:28px; background:#f8f9fc; padding:16px; border-radius:8px; }
    .info-field label { display:block; font-size:10px; font-weight:700; text-transform:uppercase; color:#999; margin-bottom:2px; }
    .info-field span { font-size:13px; font-weight:600; }
    table { width:100%; border-collapse:collapse; margin-bottom:20px; }
    thead th { background:#1a2540; color:#fff; padding:10px 12px; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; }
    thead th:last-child { text-align:right; }
    thead th:nth-child(2) { text-align:center; }
    thead th:nth-child(3) { text-align:right; }
    .totals-box { background:#f8f9fc; border-radius:8px; padding:16px 20px; margin-top:8px; }
    .total-row { display:flex; justify-content:space-between; padding:6px 0; font-size:13px; }
    .total-row.main { font-size:18px; font-weight:800; color:#e6a817; border-top:2px solid #e0e0e0; padding-top:12px; margin-top:4px; }
    .footer-note { margin-top:32px; font-size:11px; color:#999; border-top:1px solid #f0f0f0; padding-top:16px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">Infra<span>Go</span></div>
    <div class="meta">
      <strong>Cotización Formal</strong>
      Fecha: ${fecha}<br>
      contacto@infrago.cl
    </div>
  </div>
  <div class="divider"></div>

  <div class="section-title">Datos del cliente</div>
  <div class="info-grid">
    ${f.empresa   ? `<div class="info-field"><label>Empresa</label><span>${f.empresa}</span></div>` : ''}
    ${f.contacto  ? `<div class="info-field"><label>Contacto</label><span>${f.contacto}</span></div>` : ''}
    ${f.cargo     ? `<div class="info-field"><label>Cargo</label><span>${f.cargo}</span></div>` : ''}
    ${f.email     ? `<div class="info-field"><label>Email</label><span>${f.email}</span></div>` : ''}
    ${f.telefono  ? `<div class="info-field"><label>Teléfono</label><span>${f.telefono}</span></div>` : ''}
    ${f.region    ? `<div class="info-field"><label>Región</label><span>${f.region}</span></div>` : ''}
    ${f.ciudad    ? `<div class="info-field"><label>Ciudad</label><span>${f.ciudad}</span></div>` : ''}
  </div>

  ${eqRows ? `
  <div class="section-title">Productos</div>
  <table>
    <thead><tr><th>Producto</th><th style="text-align:center;">Cant.</th><th style="text-align:right;">P. Unit.</th><th style="text-align:right;">Subtotal</th></tr></thead>
    <tbody>${eqRows}</tbody>
  </table>` : ''}

  ${svcRows ? `
  <div class="section-title">Servicios</div>
  <table>
    <thead><tr><th colspan="3">Servicio</th><th style="text-align:right;">Precio</th></tr></thead>
    <tbody>${svcRows}</tbody>
  </table>` : ''}

  <div class="totals-box">
    <div class="total-row"><span>Subtotal productos</span><span>$${fmt(totalEq)}</span></div>
    <div class="total-row"><span>Subtotal servicios/mes</span><span>$${fmt(totalSvc)}/mes</span></div>
    <div class="total-row main"><span>Total estimado</span><span>$${fmt(totalGen)}</span></div>
    <div class="total-row" style="font-size:12px;color:#666;"><span>Cuota en ${simPlazo} meses</span><span>≈ $${fmt(Math.round(totalGen / simPlazo))}/mes</span></div>
  </div>

  ${f.notas ? `<div class="footer-note"><strong>Notas:</strong> ${f.notas}</div>` : ''}
  <div class="footer-note" style="margin-top:16px;">
    Esta cotización es referencial y válida por 30 días. Los precios incluyen IVA (19%). Sujeto a disponibilidad de stock.<br>
    InfraGo SpA — Una empresa de TIC Manager's · contacto@infrago.cl
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  if (!win) { alert('Permite las ventanas emergentes para descargar el PDF.'); return; }
  win.document.write(htmlPDF);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

window.descargarCotizacionPDF = descargarCotizacionPDF;



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
// BÚSQUEDA (delegada a flat-catalog.js)
// ═════════════════════════════════════════
// aplicarFiltros y clearSearch las define flat-catalog.js en su DOMContentLoaded.
// Se declara un stub aquí para evitar errores si se llama antes de que cargue.
function aplicarFiltros() {}
function actualizarConteos() {}

// ═════════════════════════════════════════
// ACCORDION (accordion oculto, solo usado
// como fuente de datos por flat-catalog)
// ═════════════════════════════════════════
function toggleCategory(id) {
  document.getElementById(id)?.classList.toggle('open');
}

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
// RENDER DINÁMICO DEL CATÁLOGO
// Lee window.CATALOGO (de catalogo.js) e
// inyecta el HTML en #catalogoProductos
// ═════════════════════════════════════════
const CAT_CONFIG = {
  notebook:  {
    id: 'cat-notebooks',    label: 'Notebooks',          open: false,
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
  },
  servidor:  {
    id: 'cat-servidores',   label: 'Servidores',         open: false,
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="8" rx="2"/><line x1="6" y1="6" x2="18" y2="6"/><rect x="2" y="14" width="20" height="8" rx="2"/><line x1="6" y1="18" x2="18" y2="18"/></svg>`,
  },
  impresora: {
    id: 'cat-impresoras',   label: 'Impresoras',         open: false,
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v4M6 9h12v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V9z"/><line x1="8" y1="13" x2="16" y2="13"/></svg>`,
  },
  networking: {
    id: 'cat-networking',   label: 'Networking',         open: false,
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>`,
  },
  storage:   {
    id: 'cat-storage',      label: 'Almacenamiento NAS', open: false,
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>`,
  },
  'servicio-tic': {
    id: 'cat-servicio-tic', label: 'Servicios TIC',      open: false,
    icon: `<svg class="cat-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  },
};

const SVC_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`;

function renderCatalogo(catalogo) {
  const container = document.getElementById('catalogoProductos');
  if (!container) return;

  const grupos = {};
  catalogo.forEach(prod => {
    if (!grupos[prod.tipo]) grupos[prod.tipo] = [];
    grupos[prod.tipo].push(prod);
  });

  const html = Object.entries(CAT_CONFIG).map(([tipo, cfg]) => {
    const productos = grupos[tipo] || [];
    if (productos.length === 0) return '';

    const itemsHtml = productos.map(prod => {
      const opcionesHtml = prod.servicios.map(svc =>
        `<option value="${svc.value}" data-price="${svc.price}">${svc.label} — $${svc.price.toLocaleString('es-CL')}${svc.unidad}</option>`
      ).join('\n');

      return `
            <div class="product-item" data-marca="${prod.marca}" data-tipo="${prod.tipo}" data-name="${prod.name}" data-partNumber="${prod.partNumber || ''}" data-price="${prod.price}">
              <div class="product-main">
                <div class="product-details">
                  <div class="product-name">${prod.name}</div>
                  ${prod.tipo !== 'servicio-tic' ? `<div class="product-specs">${prod.partNumber || ''}</div>` : ''}
                </div>
                <div class="product-price-tag">$${prod.price.toLocaleString('es-CL')}</div>
                <div class="product-qty-control">
                  <button type="button" onclick="decrementQty(event)">−</button>
                  <span class="qty-value">0</span>
                  <button type="button" onclick="incrementQty(event)">+</button>
                </div>
              </div>
              <div class="product-service-row">
                <label class="product-service-label">${SVC_ICON}Servicio:</label>
                <select class="product-service-select service-check" data-name-prefix="${prod.name}" onchange="updateSidebar()">
                  <option value="" data-price="0">Sin servicio</option>
                  ${opcionesHtml}
                </select>
              </div>
            </div>`;
    }).join('');

    const badgeId = cfg.id.replace('cat-', 'badge-');

    return `
      <div class="product-category${cfg.open ? ' open' : ''}" id="${cfg.id}" data-tipo="${tipo}">
        <div class="category-header" onclick="toggleCategory('${cfg.id}')">
          ${cfg.icon}
          <h3>${cfg.label}</h3>
          <span class="cat-badge" id="${badgeId}"></span>
          <svg class="cat-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div class="product-body">
          <div class="product-list">
            ${itemsHtml}
          </div>
        </div>
      </div>`;
  }).join('');

  container.innerHTML = html;
}

window.renderCatalogo = renderCatalogo;

// ═════════════════════════════════════════
// EXPONER AL SCOPE GLOBAL
// ═════════════════════════════════════════
window.toggleProduct        = toggleProduct;
window.incrementQty         = incrementQty;
window.decrementQty         = decrementQty;
window.nextStep             = nextStep;
window.prevStep             = prevStep;
window.updateStepDisplay    = updateStepDisplay;

/* ── Navegación clickeando el progress bar ── */
document.addEventListener('click', function(e) {
  const stepDot = e.target.closest('.progress-step');
  if (!stepDot) return;
  const targetStep = parseInt(stepDot.dataset.step);
  if (!targetStep || targetStep === currentStep) return;
  // Solo permitir ir a pasos ya visitados (targetStep < currentStep) o al siguiente
  if (targetStep < currentStep) {
    // Guardar estado antes de navegar
    if (currentStep === 1) {
      collectEquipos();
      collectServicios();
    }
    currentStep = targetStep;
    updateStepDisplay();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
});
window.solicitarCotizacion  = solicitarCotizacion;
window.enviarCotizacion     = enviarCotizacion;
window.updateSidebar        = updateSidebar;
window.cerrarModal          = cerrarModal;
window.aplicarFiltros       = aplicarFiltros;   // flat-catalog.js la reemplaza en su DOMContentLoaded
window.toggleCategory       = toggleCategory;
window.setPlazo             = setPlazo;
window.updateTasa           = updateTasa;
window.toggleTablaAmort     = toggleTablaAmort;
window.actualizarTipoCambio = actualizarTipoCambio;
window.cambiarDolar         = cambiarDolar;
window.actualizarDescuento  = actualizarDescuento;
window.obtenerPctDescuento  = obtenerPctDescuento;
window.state                = state;
window.tipoCambio           = tipoCambio;
window.popularComunas        = popularComunas;
window.cotizarDespachoForm   = cotizarDespachoForm;
window.refreshResumenTotales = refreshResumenTotales;

// ═════════════════════════════════════════
// TOTALES RESUMEN (con despacho)
// ═════════════════════════════════════════
function refreshResumenTotales() {
  const fmt    = n => n.toLocaleString('es-CL');
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };

  const totalEq  = window._summaryNetoEq  || 0;
  const totalSvc = window._summaryNetoSvc || 0;
  const eqIVA    = Math.round(totalEq * 1.19);
  const svcIVA   = Math.round(totalSvc * 1.19);
  const neto     = totalEq + totalSvc;
  const iva      = Math.round(neto * 0.19);

  // Despacho
  const despacho      = window._igDespachoResult || null;
  const shippingCost  = despacho && despacho.tipo !== 'gratis' ? (despacho.precio || 0) : 0;
  const shippingGratis = despacho && despacho.tipo === 'gratis';

  const total = neto + iva + shippingCost;

  setTxt('summaryNeto',  fmt(neto));
  setTxt('summaryIVA',   fmt(iva));
  setTxt('summaryTotal', fmt(total));

  // Fila de despacho
  const row   = document.getElementById('summaryDespachoRow');
  const label = document.getElementById('summaryDespachoLabel');
  if (row && label && despacho) {
    row.style.display = '';
    label.textContent = shippingGratis ? 'Gratis' : '$' + fmt(shippingCost);
    label.style.color = shippingGratis ? '#22c55e' : '';
  } else if (row) {
    row.style.display = 'none';
  }

  // Financiamiento (sobre equipos + servicios, sin despacho — se paga aparte)
  const tm = simTasa / 100 / 12;
  let cuotaEq = 0;
  if (tm === 0) {
    cuotaEq = eqIVA / simPlazo;
  } else {
    cuotaEq = eqIVA * (tm * Math.pow(1 + tm, simPlazo)) / (Math.pow(1 + tm, simPlazo) - 1);
  }
  const cuotaTotal = Math.round(cuotaEq + svcIVA);
  const totalPagar = Math.round(cuotaEq * simPlazo + svcIVA * simPlazo + shippingCost);
  const intereses  = Math.max(0, Math.round(cuotaEq * simPlazo - eqIVA));

  setTxt('summaryCuota',      fmt(cuotaTotal));
  setTxt('summaryTotalPagar', fmt(totalPagar));
  setTxt('summaryIntereses',  fmt(intereses));
  setTxt('plazoLabelSummary', simPlazo + '');
  setTxt('tasaLabelSummary',  simTasa + '');
}

// ═════════════════════════════════════════
// DESPACHO — Paso 3
// ═════════════════════════════════════════
function popularComunas(regionVal) {
  const sel = document.getElementById('ciudad');
  if (!sel) return;
  sel.innerHTML = '<option value="">Selecciona comuna</option>';
  const comunas = (window.COMUNAS_CHILE || {})[regionVal] || [];
  comunas.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c;
    opt.textContent = c;
    sel.appendChild(opt);
  });
  const wrap = document.getElementById('despacho-quote-wrap');
  if (wrap) wrap.style.display = 'none';
}

async function cotizarDespachoForm() {
  const region = (document.getElementById('region') || {}).value || '';
  const comuna = (document.getElementById('ciudad') || {}).value || '';
  const wrap   = document.getElementById('despacho-quote-wrap');
  const inner  = document.getElementById('despacho-quote-inner');
  if (!wrap || !inner) return;
  if (!region || !comuna) { wrap.style.display = 'none'; return; }

  const eq  = Object.values(state.equipos).reduce((s, e) => s + e.qty * e.price, 0);
  const svc = Object.values(state.servicios).reduce((s, v) => s + (typeof v === 'object' ? v.price : v), 0);
  const totalCompra = Math.round((eq + svc) * 1.19);

  wrap.style.display = '';
  inner.innerHTML = '<span class="dq-loading">Consultando tarifas…</span>';

  try {
    const res    = await window.igShipping.cotizar(comuna, region, totalCompra);
    const gratis = res.tipo === 'gratis';
    const fmt    = v => v.toLocaleString('es-CL');
    const ref    = res.tipo === 'referencial' ? '<span class="dq-ref">(referencial)</span>' : '';
    const diasParts = (res.dias || '').split('-').map(Number);
    const diasMax   = diasParts[1] || diasParts[0] || 3;
    const diasLabel = res.dias ? `${res.dias} día${diasMax > 1 ? 's' : ''} hábil${diasMax > 1 ? 'es' : ''}` : '';

    inner.innerHTML = `
      <div class="dq-row">
        <svg class="dq-truck" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13" rx="1"/>
          <path d="M16 8h4l3 5v4h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>
        <div class="dq-info">
          <span class="dq-comuna">Despacho a <strong>${comuna}</strong></span>
          <span class="dq-precio ${gratis ? 'dq-precio--gratis' : ''}">${gratis ? 'Gratis' : '$' + fmt(res.precio)}${ref}</span>
        </div>
        ${diasLabel ? `<div class="dq-dias-badge">${diasLabel}</div>` : ''}
      </div>`;
  } catch (e) {
    inner.innerHTML = '<span class="dq-loading">No se pudo cotizar el despacho.</span>';
  }
}

// ═════════════════════════════════════════
// INIT
// ═════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  if (typeof window.CATALOGO !== 'undefined') {
    renderCatalogo(window.CATALOGO);
  }

  updateProgressBar();
  updateButtons();
  updateSidebar();
  actualizarDescuento();
  fetchDolarTIC();

  document.querySelectorAll('.service-check').forEach(el => {
    el.addEventListener('change', updateSidebar);
  });

  // ── Paso 3: sincronizar state.formulario en tiempo real ──
  const camposFormulario = ['empresa','region','ciudad','direccion','contacto','cargo','telefono','email','notas'];
  camposFormulario.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const eventType = (el.tagName === 'SELECT') ? 'change' : 'input';
    el.addEventListener(eventType, () => {
      collectFormulario();
      if (currentStep === 4) generateFinalSummary();
    });
  });

  // ── Paso 3: región → poblar comunas; comuna → cotizar despacho ──
  // Esperar a que rut-prefill.js (defer) termine de setear los valores
  setTimeout(() => {
    const regionVal = (document.getElementById('region') || {}).value;
    if (regionVal) popularComunas(regionVal);
  }, 400);
});