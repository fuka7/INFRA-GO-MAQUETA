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

  const base = (window.CATALOGO || []).find(p => p.id === id);
  if (!base) return null;

  const detalle = (window.PRODUCTO_DETALLE || {})[id] || {};
  return {
    ...base,
    description: detalle.description || base.specsResumen.join(' · '),
    specs:       detalle.specs       || base.specsResumen.map((s, i) => [`Especificación ${i + 1}`, s]),
    images:      detalle.images      || 2,
    precio:      base.precioVenta,
  };
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
    pc:         'PC',
    notebooks:  'Notebooks',
    servidores: 'Servidores',
    impresoras: 'Impresoras',
    accesorios: 'Accesorios',
    redes:      'Redes'
  }[p.cat] || p.cat;

  // Breadcrumb
  const breadCat  = document.getElementById('prdBreadcrumbCat');
  const breadName = document.getElementById('prdBreadcrumbName');
  if (breadCat)  breadCat.textContent  = catLabel;
  if (breadName) breadName.textContent = p.nombre;

  // Botón "Volver a la tienda": usa history.back() si venimos de tienda
  const backLink = document.getElementById('prdBackLink');
  if (backLink) {
    const ref = document.referrer;
    const fromTienda = ref && ref.includes('tienda.html');
    backLink.onclick = function(e) {
      e.preventDefault();
      if (fromTienda && history.length > 1) {
        history.back();
      } else {
        window.location.href = '/tienda.html?cat=' + p.cat;
      }
    };
  }


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
function igbAddToCart(e) {
  if (e) e.stopPropagation();
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

/* ── Extras sugeridos por categoría (productos y accesorios relacionados) ── */
const REC_EXTRAS = {
  notebooks:  ['hp-dock-usbc-g5', 'dell-dock-wd19s', 'dell-monitor-p2423d', 'hp-monitor-m27fw', 'logitech-mx-master-3s', 'logitech-mx-keys-s'],
  pc:         ['dell-monitor-p2423d', 'dell-monitor-p2723d', 'logitech-mx-master-3s', 'logitech-mx-keys-s', 'hp-monitor-e24-g5'],
  servidores: ['cisco-catalyst-2960', 'fortinet-fortigate-60f', 'synology-ds923', 'qnap-ts-464'],
  impresoras: ['logitech-mx-master-3s', 'hp-elite-presenter-mouse', 'logitech-mx-keys-mini'],
  redes:      ['dell-poweredge-r650', 'hp-proliant-dl380', 'synology-ds923', 'hp-dock-usbc-g5'],
  accesorios: ['logitech-mx-master-3s', 'logitech-mx-keys-s', 'dell-monitor-p2423d', 'hp-dock-usbc-g5', 'dell-dock-wd19s'],
};

function buildRecCard(a) {
  const nombre = (a.nombreLargo || a.nombre).replace(/'/g, "\\'");
  return `
    <a class="prd-rec-card" href="/producto.html?id=${a.id}">
      <div class="prd-rec-card-img">${a.svg}</div>
      <div class="prd-rec-card-body">
        <div class="prd-rec-card-brand">${a.marca}</div>
        <div class="prd-rec-card-name">${a.nombreLargo || a.nombre}</div>
        <div class="prd-rec-card-price">$${a.precioVenta.toLocaleString('es-CL')}</div>
      </div>
      <button class="prd-rec-card-btn" onclick="event.preventDefault();event.stopPropagation();typeof igcAddItem==='function'&&igcAddItem('${a.id}','${nombre}',${a.precioVenta},'')">
        + Agregar
      </button>
    </a>`;
}

function renderRecommended(p) {
  const catalogo = (window.CATALOGO || []).filter(x => x.cat !== 'servicios' && x.cat !== 'licencias');

  // 1. Productos de la misma categoría (excluye el actual), hasta 3
  const mismacat = catalogo
    .filter(x => x.cat === p.cat && x.id !== p.id)
    .slice(0, 3);

  // 2. Extras por categoría, sin duplicar los ya incluidos ni el actual
  const yaIncluidos = new Set([p.id, ...mismacat.map(x => x.id)]);
  const extras = (REC_EXTRAS[p.cat] || [])
    .filter(id => !yaIncluidos.has(id))
    .map(id => catalogo.find(x => x.id === id))
    .filter(Boolean);

  const sugeridos = [...mismacat, ...extras];

  const accGrid  = document.getElementById('prdAccGrid');
  const accBlock = document.getElementById('prdAccBlock');

  if (sugeridos.length && accGrid && accBlock) {
    accGrid.innerHTML = sugeridos.map(buildRecCard).join('');
    accBlock.style.display = '';
  }

  const section = document.getElementById('prdRecSection');
  if (section && sugeridos.length) section.style.display = '';
}

/* ══════════════════════════════════════════
   RESEÑAS
══════════════════════════════════════════ */

const REV_SEED = {
  notebooks: [
    { nombre: 'Carlos M.',    empresa: 'Constructora Andina', rating: 5, comentario: 'Excelente rendimiento para trabajo en terreno. Batería aguanta todo el día sin problemas.', fecha: '2025-11-14' },
    { nombre: 'Valentina R.', empresa: 'Clínica RedSalud',    rating: 4, comentario: 'Muy buena relación precio-calidad. El soporte de InfraGo respondió rápido cuando tuve una duda.', fecha: '2025-12-02' },
    { nombre: 'Diego F.',     empresa: '',                    rating: 5, comentario: 'Lo recomiendo 100%. Llegó configurado y listo para usar, lo conecté y funcionó de inmediato.', fecha: '2026-01-20' },
  ],
  servidores: [
    { nombre: 'Rodrigo A.',   empresa: 'Minera Collahuasi',   rating: 5, comentario: 'Instalación impecable. El equipo de InfraGo coordinó todo sin interrumpir nuestra operación.', fecha: '2025-10-08' },
    { nombre: 'Isabel C.',    empresa: 'ACME SpA',            rating: 4, comentario: 'Buen servidor para nuestra carga de trabajo. Estable desde el primer día.', fecha: '2026-02-11' },
  ],
  impresoras: [
    { nombre: 'Marco T.',     empresa: 'Notaría Balmaceda',   rating: 5, comentario: 'Perfecta para nuestras necesidades. Velocidad y calidad de impresión excelentes.', fecha: '2025-09-30' },
    { nombre: 'Paula V.',     empresa: '',                    rating: 4, comentario: 'Fácil de configurar en red. Tóner rinde bastante, muy conforme.', fecha: '2026-01-05' },
  ],
  redes: [
    { nombre: 'Tomás E.',     empresa: 'ISP Fibernet',        rating: 5, comentario: 'Equipo robusto, sin ningún corte en 4 meses de funcionamiento continuo.', fecha: '2025-12-18' },
  ],
  pc: [
    { nombre: 'Camila N.',    empresa: 'Cowork Providencia',  rating: 5, comentario: 'Ideal para trabajo de oficina. Rápido, silencioso y muy bien terminado.', fecha: '2026-01-30' },
    { nombre: 'Héctor L.',    empresa: 'Agencia Creativa',    rating: 4, comentario: 'Buena máquina para diseño liviano. La pantalla integrada es un plus.', fecha: '2026-02-14' },
  ],
  accesorios: [
    { nombre: 'Sofía P.',     empresa: '',                    rating: 5, comentario: 'La calidad de construcción es muy superior a otros que he usado. Vale cada peso.', fecha: '2026-03-01' },
    { nombre: 'Andrés K.',    empresa: 'Startup Labs',        rating: 4, comentario: 'Muy cómodo para largas jornadas. Llegó bien embalado y rápido.', fecha: '2026-03-10' },
  ],
};

let prdRevRating = 0;

function prdGetStorageKey() {
  const params = new URLSearchParams(window.location.search);
  return 'igb_rev_' + (params.get('id') || 'unknown');
}

function prdLoadReviews(cat) {
  const stored = JSON.parse(localStorage.getItem(prdGetStorageKey()) || '[]');
  const seed   = (REV_SEED[cat] || REV_SEED.accesorios).map(r => ({ ...r, seed: true }));
  return [...stored, ...seed].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

function prdStarsHtml(rating, size) {
  size = size || 16;
  return [1,2,3,4,5].map(i =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${i <= rating ? '#FF7A00' : 'none'}" stroke="#FF7A00" stroke-width="1.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>`
  ).join('');
}

function prdFmtFecha(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
}

function prdRenderReviews(cat) {
  const reviews = prdLoadReviews(cat);
  const total   = reviews.length;
  const avg     = total ? (reviews.reduce((s, r) => s + r.rating, 0) / total) : 0;

  document.getElementById('prdRevAvgNum').textContent   = avg.toFixed(1);
  document.getElementById('prdRevAvgStars').innerHTML   = prdStarsHtml(Math.round(avg), 20);
  document.getElementById('prdRevAvgCount').textContent = total + ' reseña' + (total !== 1 ? 's' : '');

  // Barras 5→1
  const bars = document.getElementById('prdRevBars');
  if (bars) {
    bars.innerHTML = [5,4,3,2,1].map(n => {
      const cnt = reviews.filter(r => r.rating === n).length;
      const pct = total ? Math.round((cnt / total) * 100) : 0;
      return `<div class="prd-rev-bar-row">
        <span class="prd-rev-bar-label">${n}</span>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="#FF7A00" stroke="#FF7A00" stroke-width="1"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>
        <div class="prd-rev-bar-track"><div class="prd-rev-bar-fill" style="width:${pct}%"></div></div>
        <span class="prd-rev-bar-count">${cnt}</span>
      </div>`;
    }).join('');
  }

  // Lista
  const list = document.getElementById('prdRevList');
  if (list) {
    if (!reviews.length) {
      list.innerHTML = '<p class="prd-rev-empty">Sé el primero en dejar una reseña.</p>';
    } else {
      list.innerHTML = reviews.map(r => `
        <div class="prd-rev-card">
          <div class="prd-rev-card-top">
            <div class="prd-rev-avatar">${r.nombre.charAt(0).toUpperCase()}</div>
            <div>
              <div class="prd-rev-card-autor">${r.nombre}${r.empresa ? ` <span class="prd-rev-empresa">· ${r.empresa}</span>` : ''}</div>
              <div class="prd-rev-card-stars">${prdStarsHtml(r.rating, 14)}</div>
            </div>
            <div class="prd-rev-card-fecha">${prdFmtFecha(r.fecha)}</div>
          </div>
          <p class="prd-rev-card-text">${r.comentario}</p>
        </div>`).join('');
    }
  }
}

function prdToggleForm() {
  const form = document.getElementById('prdRevForm');
  const btn  = document.getElementById('prdRevWriteBtn');
  const open = form.classList.toggle('open');
  btn.innerHTML = open
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancelar'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg> Escribir reseña';
  if (open) form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function prdSetStar(val) {
  prdRevRating = val;
  document.querySelectorAll('.prd-rev-star-pick').forEach(s => {
    const v = parseInt(s.dataset.val);
    s.style.fill   = v <= val ? '#FF7A00' : 'none';
    s.style.stroke = '#FF7A00';
  });
}

function prdSubmitReview() {
  const nombre     = document.getElementById('prdRevNombre').value.trim();
  const empresa    = document.getElementById('prdRevEmpresa').value.trim();
  const comentario = document.getElementById('prdRevComentario').value.trim();

  if (!nombre)          { alert('Ingresa tu nombre.'); return; }
  if (!prdRevRating)    { alert('Selecciona una calificación.'); return; }
  if (!comentario)      { alert('Escribe un comentario.'); return; }

  const key     = prdGetStorageKey();
  const stored  = JSON.parse(localStorage.getItem(key) || '[]');
  const p       = getProducto();

  stored.unshift({ nombre, empresa, rating: prdRevRating, comentario, fecha: new Date().toISOString().slice(0,10) });
  localStorage.setItem(key, JSON.stringify(stored));

  document.getElementById('prdRevNombre').value     = '';
  document.getElementById('prdRevEmpresa').value    = '';
  document.getElementById('prdRevComentario').value = '';
  prdSetStar(0);
  prdToggleForm();
  prdRenderReviews(p ? p.cat : 'accesorios');
}

function initReviews(p) {
  // Interactividad estrellas del formulario
  const stars = document.querySelectorAll('.prd-rev-star-pick');
  stars.forEach(s => {
    s.addEventListener('mouseenter', () => {
      const v = parseInt(s.dataset.val);
      stars.forEach(x => { x.style.fill = parseInt(x.dataset.val) <= v ? '#FF7A00' : 'none'; });
    });
    s.addEventListener('mouseleave', () => prdSetStar(prdRevRating));
    s.addEventListener('click',      () => prdSetStar(parseInt(s.dataset.val)));
  });

  prdRenderReviews(p.cat);
}

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  const p = getProducto();
  if (!p) {
    window.location.href = '/tienda.html';
    return;
  }
  renderProducto(p);
  renderRecommended(p);
  initReviews(p);
});