/* ═══════════════════════════════════════════════
   configurador.js
   Wizard de configuración de soluciones (4 pasos)
═══════════════════════════════════════════════ */

import { supabaseClient } from './supabase.js'; // 👈 IMPORTANTE

let currentStep = 1;
const totalSteps = 4;

// Estado global
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
  }
}

function prevStep() {
  if (currentStep > 1) {
    currentStep--;
    updateStepDisplay();
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

  window.scrollTo(0, 0);
}

function updateProgressBar() {
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('progressBar').style.width = progress + '%';
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

// ═════════════════════════════════════════
// SERVICIOS
// ═════════════════════════════════════════

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
  let total = 0;

  document.querySelectorAll('.product-item').forEach(item => {
    const qty = parseInt(item.querySelector('.qty-value').textContent) || 0;
    const price = parseInt(item.dataset.price);
    total += qty * price;
  });

  document.getElementById('totalGeneral').textContent = total.toLocaleString('es-CL');
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
  console.log('📦 DATA A ENVIAR:', data);

  const { data: result, error } = await supabaseClient
    .from('cotizaciones')
    .insert([data])
    .select();

  if (error) {
    console.error('🔥 ERROR SUPABASE:', error);
    alert(JSON.stringify(error));
    throw error;
  }

  console.log('✅ GUARDADO:', result);
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
});
