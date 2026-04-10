/* ═══════════════════════════════════════════════
   modals-how.js
   Gestión de modales de "Cómo Funciona"
   © 2026 InfraGo SpA / TIC Manager's
═══════════════════════════════════════════════ */

// Abrir modal
function openHowModal(step) {
  const modalId = {
    'step1': 'howModal1',
    'step2': 'howModal2',
    'step3': 'howModal3'
  }[step];
  
  if (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }
}

// Cerrar modal
function closeHowModal(step) {
  const modalId = {
    'step1': 'howModal1',
    'step2': 'howModal2',
    'step3': 'howModal3'
  }[step];
  
  if (modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
      document.body.style.overflow = '';
    }
  }
}

// Cerrar modales con ESC
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(modal => {
      modal.classList.remove('open');
    });
    document.body.style.overflow = '';
  }
});
