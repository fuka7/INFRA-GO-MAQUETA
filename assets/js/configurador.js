/* ═══════════════════════════════════════════════
   configurador.js
═══════════════════════════════════════════════ */

import { supabaseClient } from './supabase.js';

let currentStep = 1;
const totalSteps = 4;

const state = {
  equipos: {},
  servicios: {},
  formulario: {}
};

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

  if (step === 2) collectServicios();
  if (step === 3 && !validateForm()) return false;

  return true;
}

function validateForm() {
  const empresa = document.getElementById('empresa').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!empresa || !email) {
    alert('⚠️ Completa los campos');
    return false;
  }

  state.formulario = {
    empresa,
    region: document.getElementById('region').value,
    ciudad: document.getElementById('ciudad').value,
    direccion: document.getElementById('direccion').value,
    contacto: document.getElementById('contacto').value,
    telefono: document.getElementById('telefono').value,
    email,
    notas: document.getElementById('notas').value
  };

  return true;
}

// ═════════════════════════════════════════
// PRODUCTOS
// ═════════════════════════════════════════

function incrementQty(event) {
  event.preventDefault();
  const qtySpan = event.currentTarget.parentElement.querySelector('.qty-value');
  qtySpan.textContent = parseInt(qtySpan.textContent) + 1;
  updateSidebar();
}

function decrementQty(event) {
  event.preventDefault();
  const qtySpan = event.currentTarget.parentElement.querySelector('.qty-value');
  const current = parseInt(qtySpan.textContent);

  if (current > 0) {
    qtySpan.textContent = current - 1;
    updateSidebar();
  }
}

// 👇 IMPORTANTE (para evitar error)
function toggleProduct() {}

// ═════════════════════════════════════════
// DATA
// ═════════════════════════════════════════

function collectEquipos() {
  state.equipos = {};

  document.querySelectorAll('.product-item').forEach(item => {
    const name = item.dataset.name;
    const price = parseInt(item.dataset.price);
    const qty = parseInt(item.querySelector('.qty-value').textContent) || 0;

    if (qty > 0) {
      state.equipos[name] = { qty, price };
    }
  });
}

function collectServicios() {
  state.servicios = {};

  document.querySelectorAll('.service-check:checked').forEach(el => {
    const name = el.dataset.name;
    const price = parseInt(el.dataset.price);
    state.servicios[name] = price;
  });
}

// ═════════════════════════════════════════
// SIDEBAR
// ═════════════════════════════════════════

function updateSidebar() {
  let totalEq = 0;
  let totalQty = 0;
  const selectedProducts = [];

  document.querySelectorAll('.product-item').forEach(item => {
    const qty = parseInt(item.querySelector('.qty-value').textContent) || 0;
    const price = parseInt(item.dataset.price);
    const name = item.dataset.name;
    if (qty > 0) {
      totalEq += qty * price;
      totalQty += qty;
      selectedProducts.push({ name, qty });
    }
  });

  let totalSvc = 0;
  let countSvc = 0;
  const selectedServices = [];
  document.querySelectorAll('.service-check:checked').forEach(el => {
    totalSvc += parseInt(el.dataset.price) || 0;
    countSvc++;
    selectedServices.push(el.dataset.name);
  });

  const total = totalEq + totalSvc;
  const cuota = Math.round(total / 24);

  // Contadores
  document.getElementById('countEquipos').textContent = totalQty;
  document.getElementById('countServicios').textContent = countSvc;

  // Costos
  document.getElementById('totalEquipos').textContent = totalEq.toLocaleString('es-CL');
  document.getElementById('totalServicios').textContent = totalSvc.toLocaleString('es-CL');
  document.getElementById('totalGeneral').textContent = total.toLocaleString('es-CL');
  document.getElementById('cuotaMensual').textContent = cuota.toLocaleString('es-CL');

  // Lista productos en sidebar
  const list = document.getElementById('productsListSidebar');
  if (selectedProducts.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--white-60);font-size:12px;padding:8px;">Sin productos aún</div>';
  } else {
    list.innerHTML = selectedProducts.map(p =>
      `<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;gap:8px;">`+
      `<span style="color:var(--white-80);flex:1;line-height:1.3;">${p.name}</span>`+
      `<span style="color:var(--gold);white-space:nowrap;font-weight:600;">×${p.qty}</span>`+
      `</div>`
    ).join('');
  }

  // Lista servicios en sidebar
  let svcList = document.getElementById('servicesListSidebar');
  if (!svcList) {
    const prodSection = document.getElementById('productsListSidebar').closest('.sidebar-section');
    const newSection = document.createElement('div');
    newSection.className = 'sidebar-section';
    newSection.innerHTML = '<h4>Servicios Seleccionados</h4>'
      + '<div id="servicesListSidebar" style="display:flex;flex-direction:column;gap:8px;max-height:150px;overflow-y:auto;"></div>';
    prodSection.parentNode.insertBefore(newSection, prodSection.nextSibling);
    svcList = document.getElementById('servicesListSidebar');
  }
  if (selectedServices.length === 0) {
    svcList.innerHTML = '<div style="text-align:center;color:var(--white-60);font-size:12px;padding:8px;">Sin servicios aún</div>';
  } else {
    svcList.innerHTML = selectedServices.map(name =>
      `<div style="font-size:12px;color:var(--white-80);line-height:1.3;">${name}</div>`
    ).join('');
  }
}

// ═════════════════════════════════════════
// RESUMEN
// ═════════════════════════════════════════

function generateFinalSummary() {
  collectEquipos();
  collectServicios();
}

// ═════════════════════════════════════════
// SUPABASE
// ═════════════════════════════════════════

async function guardarCotizacionSupabase(data) {
  console.log('📦 DATA:', data);

  const { data: result, error } = await supabaseClient
    .from('cotizaciones')
    .insert([data])
    .select();

  if (error) {
    console.error(error);
    alert(JSON.stringify(error));
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

  const totalEquipos = Object.values(state.equipos)
    .reduce((sum, e) => sum + e.qty * e.price, 0);

  const totalServicios = Object.values(state.servicios)
    .reduce((sum, s) => sum + s, 0);

  const data = {
    ...state.formulario,
    productos: state.equipos,
    servicios: state.servicios,
    total_productos: totalEquipos,
    total_servicios: totalServicios,
    total_general: totalEquipos + totalServicios,
    url: window.location.href
  };

  guardarCotizacionSupabase(data)
    .then(() => {
      alert('✅ Cotización guardada');
      location.reload();
    })
    .catch(() => {
      alert('❌ Error al guardar');
    });
}

// ═════════════════════════════════════════
// INIT
// ═════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  updateProgressBar();
  updateButtons();
  updateSidebar();
  document.querySelectorAll('.service-check').forEach(checkbox => {
    checkbox.addEventListener('change', updateSidebar);
  });
});

// 👇 EXPONER FUNCIONES AL HTML
window.toggleProduct = toggleProduct;
window.incrementQty = incrementQty;
window.decrementQty = decrementQty;
window.nextStep = nextStep;
window.prevStep = prevStep;
window.solicitarCotizacion = solicitarCotizacion;
window.updateSidebar = updateSidebar;