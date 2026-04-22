/* ═══════════════════════════════════════════════
   producto.js — InfraGo
   Página de detalle de producto.
   Requiere: productos.js cargado antes que este archivo.
   © 2026 InfraGo SpA / TIC Managers
═══════════════════════════════════════════════ */

/* ── Helpers ── */
function fmtPrecio(n) {
  return '$' + n.toLocaleString('es-CL');
}

/* ── Obtener producto de la URL ── */
function getProducto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');
  if (!id) return null;
  return PRODUCTOS_DB.find(p => p.id === id) || null;
}

/* ── Generar miniaturas SVG (variantes de opacidad) ── */
function buildThumbs(producto, n) {
  const opacities = [1, 0.75, 0.5, 0.35];
  let html = '';
  for (let i = 0; i < Math.min(n, opacities.length); i++) {
    const op = opacities[i];
    const svgMod = producto.svg.replace(/opacity="[\d.]+"/g, `opacity="${op}"`);
    html += `<div class="prd-thumb ${i === 0 ? 'active' : ''}" data-idx="${i}" onclick="selectThumb(this, ${i})">
      ${svgMod}
    </div>`;
  }
  return html;
}

function selectThumb(el, idx) {
  document.querySelectorAll('.prd-thumb').forEach(t => t.classList.remove('active'));
  el.classList.add('active');
  const opacities = [1, 0.75, 0.5, 0.35];
  const mainSvg = document.querySelector('.prd-img-main');
  if (mainSvg) mainSvg.style.opacity = opacities[idx] || 1;
}

/* ── Render estrellas ── */
function renderStars(rating) {
  let html = '';
  for (let i = 1; i <= 5; i++) {
    html += `<svg class="prd-star${i > rating ? ' empty' : ''}" viewBox="0 0 24 24"
      fill="${i <= rating ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="1.5">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
    </svg>`;
  }
  return html;
}

/* ── Cantidad ── */
let qty = 1;
function changeQty(delta) {
  qty = Math.max(1, qty + delta);
  const el = document.getElementById('prdQty');
  if (el) el.textContent = qty;
}

/* ── Renderizar página completa ── */
function renderProducto(p) {
  const catLabel = {
    notebooks: 'Notebooks',
    servidores: 'Servidores',
    impresoras: 'Impresoras',
    monitores: 'Monitores',
    redes: 'Redes'
  }[p.cat] || p.cat;


  // Galería
  document.getElementById('prdImgMain').innerHTML = p.svg || `<svg viewBox="0 0 120 84" fill="none"><rect x="12" y="6" width="96" height="60" rx="4" fill="rgba(17,17,17,0.05)"/></svg>`;
  document.getElementById('prdThumbs').innerHTML = buildThumbs(p, p.images);

  // Descripción
  document.getElementById('prdDescription').textContent = p.description;

  // Tabla de specs
  const specsHtml = p.specs.map(([k, v]) =>
    `<tr><td>${k}</td><td>${v}</td></tr>`
  ).join('');
  document.getElementById('prdSpecsTable').innerHTML = specsHtml;

  // Panel derecho — badge
  const badge = document.getElementById('prdBadge');
  if (badge) {
    if (p.badge) {
      badge.textContent = p.badge;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  // Panel derecho — textos
  document.getElementById('prdBrand').textContent   = p.marca;
  document.getElementById('prdName').textContent    = p.nombre;
  document.getElementById('prdSku').textContent     = p.partNumber ? `SKU: ${p.partNumber}` : '';

  // Rating (decorativo)
  const rating  = (4.2 + Math.random() * 0.8).toFixed(1);
  const reviews = Math.floor(Math.random() * 40) + 5;
  document.getElementById('prdStars').innerHTML    = renderStars(Math.round(parseFloat(rating)));
  document.getElementById('prdRating').textContent = rating;
  document.getElementById('prdReviews').textContent = `(${reviews} reseñas)`;

  // Specs resumen
  document.getElementById('prdSpecsList').innerHTML = p.specsResumen
    .map(s => `<div class="prd-panel-spec">${s}</div>`).join('');

  // Precio
  document.getElementById('prdPrice').textContent = fmtPrecio(p.precio);

  // Botón cotizar — solo guarda el producto en sessionStorage.
  // El onclick "igbCotizar(event)" definido en el HTML se mantiene intacto;
  // NO se sobreescribe aquí para no romper el guard de autenticación.
  const btnCotizar = document.getElementById('prdBtnCotizar');
  if (btnCotizar) {
    btnCotizar.href = '/configurador.html';
    // Almacenar producto para que igbCotizar (HTML) lo encuentre al redirigir
    btnCotizar.addEventListener('click', () => {
      sessionStorage.setItem('igb_producto_cotizar', JSON.stringify(p));
    });
  }

  // Título de la página
  document.title = `${p.nombre} — InfraGo`;
}

/* ── Agregar al carro ── */
function igbAddToCart() {
  const p = getProducto();
  if (!p) return;

  /* Si carrito.js está cargado, usar su API unificada (toast incluido) */
  if (typeof window.igcAddItem === 'function') {
    for (let i = 0; i < qty; i++) {
      window.igcAddItem(p.id, p.nombre, p.precio, p.svg || '');
    }
    return;
  }

  /* Fallback: escribir directo en igb_cart */
  const cart = JSON.parse(localStorage.getItem('igb_cart') || '[]');
  const existing = cart.find(i => i.id === p.id);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: p.id, nombre: p.nombre, marca: p.marca, precio: p.precio, qty });
  }
  localStorage.setItem('igb_cart', JSON.stringify(cart));

  const badge = document.querySelector('.igb-cart-count');
  if (badge) {
    const total = cart.reduce((s, i) => s + i.qty, 0);
    badge.textContent = total;
  }

  const btn = document.querySelector('.prd-btn-cart');
  if (btn) {
    const orig = btn.innerHTML;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16"><path d="M20 6L9 17l-5-5"/></svg> Agregado';
    btn.style.background = '#16a34a';
    setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; }, 2000);
  }
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  const p = getProducto();
  if (!p) {
    window.location.href = '/tienda.html';
    return;
  }
  renderProducto(p);
});