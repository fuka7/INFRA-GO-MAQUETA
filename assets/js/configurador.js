/* ═══════════════════════════════════════════════
   configurador.js
   Wizard de configuración de soluciones (4 pasos)
   © 2026 InfraGo SpA / TIC Manager's
═══════════════════════════════════════════════ */

let currentStep = 1;
const totalSteps = 4;

// Estado global
const state = {
  equipos: {},  // { nombre: { qty, precio } }
  servicios: {}, // { nombre: precio }
  formulario: {}
};

// Precios de servicios (como referencia)
const servicePrices = {
  'Soporte Técnico Premium': 150000,
  'Monitoreo 24/7': 180000,
  'Licencias Microsoft': 200000,
  'Seguros de Activos': 220000,
  'Backup & Replicación': 250000,
  'Mantenimiento Preventivo': 120000
};

// ═════════════════════════════════════════
// NAVEGACIÓN ENTRE PASOS
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
  // Ocultar todos los pasos
  document.querySelectorAll('.wizard-step').forEach(step => {
    step.classList.remove('active');
  });
  
  // Mostrar paso actual
  document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
  
  // Actualizar progress bar
  updateProgressBar();
  
  // Actualizar botones
  updateButtons();
  
  // Si es el paso 4, generar resumen
  if (currentStep === 4) {
    generateFinalSummary();
  }
  
  // Scroll al inicio
  window.scrollTo(0, 0);
}

function updateProgressBar() {
  const progress = (currentStep / totalSteps) * 100;
  document.getElementById('progressBar').style.width = progress + '%';
  
  // Actualizar indicadores
  document.querySelectorAll('.progress-step').forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    
    if (stepNum < currentStep) {
      step.classList.add('completed');
    } else if (stepNum === currentStep) {
      step.classList.add('active');
    }
  });
}

function updateButtons() {
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  
  if (currentStep === 1) {
    btnPrev.style.display = 'none';
    btnNext.textContent = 'Siguiente →';
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

function validateStep(step) {
  if (step === 1) {
    // Verificar que hay al menos un equipo seleccionado
    let totalQty = 0;
    document.querySelectorAll('.product-qty-control .qty-value').forEach(el => {
      totalQty += parseInt(el.textContent) || 0;
    });
    
    if (totalQty === 0) {
      alert('⚠️ Debes seleccionar al menos un equipo para continuar');
      return false;
    }
    collectEquipos();
  } else if (step === 2) {
    collectServicios();
  } else if (step === 3) {
    if (!validateForm()) {
      return false;
    }
  }
  
  return true;
}

function validateForm() {
  const empresa = document.getElementById('empresa').value.trim();
  const region = document.getElementById('region').value.trim();
  const ciudad = document.getElementById('ciudad').value.trim();
  const direccion = document.getElementById('direccion').value.trim();
  const contacto = document.getElementById('contacto').value.trim();
  const telefono = document.getElementById('telefono').value.trim();
  const email = document.getElementById('email').value.trim();

  if (!empresa || !region || !ciudad || !direccion || !contacto || !telefono || !email) {
    alert('⚠️ Por favor completa todos los campos requeridos');
    return false;
  }

  if (!email.includes('@')) {
    alert('⚠️ Por favor ingresa un email válido');
    return false;
  }

  state.formulario = {
    empresa, region, ciudad, direccion, contacto, telefono, email,
    notas: document.getElementById('notas').value.trim()
  };

  return true;
}

// ═════════════════════════════════════════
// PRODUCTOS: INCREMENTAR/DECREMENTAR
// ═════════════════════════════════════════

function incrementQty(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const control = event.currentTarget.parentElement;
  const qtySpan = control.querySelector('.qty-value');
  const newQty = parseInt(qtySpan.textContent) + 1;
  qtySpan.textContent = newQty;
  
  updateSidebar();
}

function decrementQty(event) {
  event.preventDefault();
  event.stopPropagation();
  
  const control = event.currentTarget.parentElement;
  const qtySpan = control.querySelector('.qty-value');
  const current = parseInt(qtySpan.textContent);
  
  if (current > 0) {
    qtySpan.textContent = current - 1;
    updateSidebar();
  }
}

function toggleProduct(element) {
  // No se necesita toggle, los botones +/- manejan todo
}

function collectEquipos() {
  state.equipos = {};
  document.querySelectorAll('.product-item').forEach(item => {
    const name = item.getAttribute('data-name');
    const price = parseInt(item.getAttribute('data-price'));
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
  document.querySelectorAll('.service-check').forEach(checkbox => {
    if (checkbox.checked) {
      const name = checkbox.getAttribute('data-name');
      const price = parseInt(checkbox.getAttribute('data-price'));
      state.servicios[name] = price;
    }
  });
}

// ═════════════════════════════════════════
// ACTUALIZAR SIDEBAR
// ═════════════════════════════════════════

function updateSidebar() {
  // Contar equipos totales
  let totalEquiposQty = 0;
  let equiposCost = 0;
  
  document.querySelectorAll('.product-item').forEach(item => {
    const qty = parseInt(item.querySelector('.qty-value').textContent) || 0;
    const price = parseInt(item.getAttribute('data-price'));
    totalEquiposQty += qty;
    equiposCost += qty * price;
  });
  
  // Contar servicios
  let servicioCount = 0;
  let serviciosCost = 0;
  
  document.querySelectorAll('.service-check').forEach(checkbox => {
    if (checkbox.checked) {
      servicioCount++;
      serviciosCost += parseInt(checkbox.getAttribute('data-price'));
    }
  });
  
  // Actualizar sidebar
  document.getElementById('countEquipos').textContent = totalEquiposQty;
  document.getElementById('countServicios').textContent = servicioCount;
  
  document.getElementById('totalEquipos').textContent = equiposCost.toLocaleString('es-CL');
  document.getElementById('totalServicios').textContent = serviciosCost.toLocaleString('es-CL');
  
  const totalGeneral = equiposCost + serviciosCost;
  document.getElementById('totalGeneral').textContent = totalGeneral.toLocaleString('es-CL');
  
  // Cuota mensual (dividir entre 24 meses)
  const cuotaMensual = Math.round(totalGeneral / 24);
  document.getElementById('cuotaMensual').textContent = cuotaMensual.toLocaleString('es-CL');
  
  // Actualizar lista de productos seleccionados
  let productsListHTML = '';
  document.querySelectorAll('.product-item').forEach(item => {
    const qty = parseInt(item.querySelector('.qty-value').textContent) || 0;
    if (qty > 0) {
      const name = item.getAttribute('data-name');
      productsListHTML += `<div style="background: rgba(255,255,255,0.06); padding: 8px 12px; border-radius: 6px; font-size: 12px; display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--white-80);">${name}</span>
        <span style="background: var(--gold); color: var(--navy); font-weight: 700; padding: 2px 8px; border-radius: 4px;">x${qty}</span>
      </div>`;
    }
  });
  
  const productsListContainer = document.getElementById('productsListSidebar');
  if (productsListHTML === '') {
    productsListContainer.innerHTML = '<div style="text-align: center; color: var(--white-60); font-size: 12px; padding: 8px;">Sin productos aún</div>';
  } else {
    productsListContainer.innerHTML = productsListHTML;
  }
}

// ═════════════════════════════════════════
// RESUMEN FINAL (PASO 4)
// ═════════════════════════════════════════

function generateFinalSummary() {
  collectEquipos();
  collectServicios();
  
  // Resumen de equipos
  let equiposHTML = '';
  let totalEquiposCost = 0;
  
  if (Object.keys(state.equipos).length > 0) {
    Object.entries(state.equipos).forEach(([nombre, data]) => {
      const subtotal = data.qty * data.price;
      equiposHTML += `<div class="summary-item">
        <div class="summary-item-name">
          <div class="summary-item-title">${nombre} <strong>(x${data.qty})</strong></div>
        </div>
        <div class="summary-item-price">$${subtotal.toLocaleString('es-CL')}</div>
      </div>`;
      totalEquiposCost += subtotal;
    });
  } else {
    equiposHTML = '<div style="padding: 16px; text-align: center; color: var(--white-60);">No hay equipos seleccionados</div>';
  }
  document.getElementById('summaryEquipos').innerHTML = equiposHTML;
  
  // Resumen de servicios
  let serviciosHTML = '';
  let totalServicesCost = 0;
  
  if (Object.keys(state.servicios).length > 0) {
    Object.entries(state.servicios).forEach(([nombre, price]) => {
      serviciosHTML += `<div class="summary-item">
        <div class="summary-item-name">
          <div class="summary-item-title">${nombre}</div>
        </div>
        <div class="summary-item-price">$${price.toLocaleString('es-CL')}/mes</div>
      </div>`;
      totalServicesCost += price;
    });
  } else {
    serviciosHTML = '<div style="padding: 16px; text-align: center; color: var(--white-60);">No hay servicios seleccionados</div>';
  }
  document.getElementById('summaryServicios').innerHTML = serviciosHTML;
  
  // Totales
  const monthlyEquipos = Math.round(totalEquiposCost / 24);
  const monthlyServices = totalServicesCost;
  const monthlyTotal = monthlyEquipos + monthlyServices;
  
  document.getElementById('summarySubtotalEq').textContent = totalEquiposCost.toLocaleString('es-CL');
  document.getElementById('summarySubtotalSvc').textContent = totalServicesCost.toLocaleString('es-CL');
  document.getElementById('summaryTotal').textContent = (totalEquiposCost + totalServicesCost).toLocaleString('es-CL');
  document.getElementById('summaryCuota').textContent = monthlyTotal.toLocaleString('es-CL');
}

// ═════════════════════════════════════════
// SOLICITAR COTIZACIÓN
// ═════════════════════════════════════════

function solicitarCotizacion() {
  // Validar paso 3
  if (!validateStep(3)) return;
  
  // Recopilar datos finales
  collectEquipos();
  collectServicios();
  
  if (Object.keys(state.equipos).length === 0) {
    alert('⚠️ Debes seleccionar al menos un equipo');
    return;
  }

  // Construir datos para envío
  const cotizacionData = {
    equipos: state.equipos,
    servicios: state.servicios,
    formulario: state.formulario,
    timestamp: new Date().toLocaleString('es-CL'),
    url: window.location.href
  };

  // Log para debugging
  console.log('Cotización solicitada:', cotizacionData);
  
  // Aquí puedes integrar con un backend: fetch('/api/cotizaciones', { method: 'POST', body: JSON.stringify(cotizacionData) })
  
  // Por ahora, mostrar resumen
  const equiposText = Object.entries(state.equipos)
    .map(([nombre, data]) => `• ${nombre} x${data.qty}`)
    .join('\n');

  const serviciosText = Object.keys(state.servicios).length > 0
    ? '\n\nServicios:\n' + Object.keys(state.servicios).map(s => `• ${s}`).join('\n')
    : '';

  alert(`✅ ¡Cotización solicitada con éxito!\n\nEquipos:\n${equiposText}${serviciosText}\n\nNos pondremos en contacto a ${state.formulario.email} pronto.`);
  
  // Redirigir a inicio después de 2 segundos
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 2000);
}

// ═════════════════════════════════════════
// INICIALIZACIÓN
// ═════════════════════════════════════════

document.addEventListener('DOMContentLoaded', () => {
  updateProgressBar();
  updateButtons();
  updateSidebar();
});
