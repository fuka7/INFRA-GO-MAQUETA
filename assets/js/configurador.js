/* ═══════════════════════════════════════════════
   configurador.js
   Lógica del configurador de soluciones
   © 2026 InfraGo SpA / TIC Manager's
═══════════════════════════════════════════════ */

let carrito = {};
let serviciosSeleccionados = {};

// Precios hardcodeados por servicio
const preciosServicios = {
  0: 150000,  // Instalación Profesional
  1: 200000,  // Soporte Técnico Gold
  2: 100000,  // Monitoreo 24/7
  3: 80000,   // Licencias Microsoft
  4: 120000,  // Seguros de Activos
  5: 90000    // Backup & Replicación
};

function addProduct(element, nombre, spec, precio) {
  const qty = element.querySelector('.product-item-qty');
  const qtyValue = parseInt(qty.querySelector('.qty-value').textContent);
  
  if (qtyValue > 0) {
    if (!carrito[nombre]) {
      carrito[nombre] = { qty: 0, precio: precio };
    }
    carrito[nombre].qty += qtyValue;
    
    // Reset cantidad visual
    qty.querySelector('.qty-value').textContent = '0';
    updateResumen();
  }
}

function increaseQty(qtyElement) {
  const span = qtyElement.querySelector('.qty-value');
  span.textContent = parseInt(span.textContent) + 1;
}

function decreaseQty(qtyElement) {
  const span = qtyElement.querySelector('.qty-value');
  const current = parseInt(span.textContent);
  if (current > 0) span.textContent = current - 1;
}

function updateResumen() {
  const container = document.getElementById('resumenItems');
  
  // Calcular servicios seleccionados
  document.querySelectorAll('.service-checkbox input[type="checkbox"]').forEach((checkbox, index) => {
    serviciosSeleccionados[index] = checkbox.checked;
  });

  // Mostrar items del carrito
  if (Object.keys(carrito).length === 0) {
    container.innerHTML = '<div class="empty-message">Selecciona productos para ver el resumen</div>';
  } else {
    let html = '';
    Object.entries(carrito).forEach(([nombre, data]) => {
      html += `
        <div class="resumen-item">
          <div class="resumen-item-name">${nombre}</div>
          <span class="resumen-item-qty">x${data.qty}</span>
          <button class="resumen-item-remove" onclick="removerDelCarrito('${nombre}')">✕</button>
        </div>
      `;
    });
    container.innerHTML = html;
  }

  // Calcular totales
  let subtotalProductos = 0;
  Object.entries(carrito).forEach(([nombre, data]) => {
    subtotalProductos += data.precio * data.qty;
  });

  let subtotalServicios = 0;
  Object.entries(serviciosSeleccionados).forEach(([index, selected]) => {
    if (selected) {
      subtotalServicios += preciosServicios[index];
    }
  });

  // Dividir entre cantidad de meses (24 por defecto)
  const precioMensualProductos = Math.round(subtotalProductos / 24);
  const precioMensualServicios = Math.round(subtotalServicios / 24);
  const totalMensual = precioMensualProductos + precioMensualServicios;

  document.getElementById('subtotalProductos').textContent = precioMensualProductos.toLocaleString('es-CL');
  document.getElementById('subtotalServicios').textContent = precioMensualServicios.toLocaleString('es-CL');
  document.getElementById('totalFinal').textContent = totalMensual.toLocaleString('es-CL');
}

function removerDelCarrito(nombre) {
  delete carrito[nombre];
  updateResumen();
}

function solicitarCotizacion() {
  if (Object.keys(carrito).length === 0) {
    alert('Debes seleccionar al menos un producto');
    return;
  }

  // Construir resumen
  let resumen = 'Configuración solicitada:\n\n';
  Object.entries(carrito).forEach(([nombre, data]) => {
    resumen += `• ${nombre} x${data.qty}\n`;
  });

  let servicios = [];
  Object.entries(serviciosSeleccionados).forEach(([index, selected]) => {
    if (selected) {
      const labels = ['Instalación Profesional', 'Soporte Técnico Gold', 'Monitoreo 24/7', 'Licencias Microsoft', 'Seguros de Activos', 'Backup & Replicación'];
      servicios.push(labels[index]);
    }
  });

  if (servicios.length > 0) {
    resumen += '\nServicios:\n• ' + servicios.join('\n• ');
  }

  resumen += '\n\nNos pondremos en contacto pronto con tu cotización detallada.';
  
  // Aquí podrías enviar a un backend o abrir el chat
  alert(resumen);
}

// Inicializar
updateResumen();
