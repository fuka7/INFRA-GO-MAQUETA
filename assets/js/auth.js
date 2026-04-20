/* ═══════════════════════════════════════════════
   auth.js — InfraGo
   Modal Login / Registro — solo frontend
   © 2026 InfraGo SpA / TIC Managers
═══════════════════════════════════════════════ */

(function () {

  /* ── Estado ── */
  const state = {
    users: JSON.parse(localStorage.getItem('igb_users') || '[]'),
    current: JSON.parse(localStorage.getItem('igb_current') || 'null'),
  };

  function saveUsers()   { localStorage.setItem('igb_users',   JSON.stringify(state.users));   }
  function saveCurrent() { localStorage.setItem('igb_current', JSON.stringify(state.current)); }

  /* ── Helpers de validación ── */
  const validators = {
    email(v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
    },
    rut(v) {
      // Formato: 12.345.678-9 o 12345678-9 o 123456789
      v = v.replace(/\./g, '').replace(/-/g, '').trim().toLowerCase();
      if (!/^\d{7,8}[0-9k]$/.test(v)) return false;
      const dv  = v.slice(-1);
      const num = v.slice(0, -1);
      let sum = 0, mul = 2;
      for (let i = num.length - 1; i >= 0; i--) {
        sum += parseInt(num[i]) * mul;
        mul = mul === 7 ? 2 : mul + 1;
      }
      const res = 11 - (sum % 11);
      const expected = res === 11 ? '0' : res === 10 ? 'k' : String(res);
      return dv === expected;
    },
    phone(v) {
      return /^(\+?56)?[\s-]?[2-9]\d{7,8}$/.test(v.replace(/\s/g, ''));
    },
    password(v) {
      return v.length >= 8;
    },
  };

  function formatRut(v) {
    v = v.replace(/[^0-9kK]/g, '').toUpperCase();
    if (v.length <= 1) return v;
    const dv   = v.slice(-1);
    let   body = v.slice(0, -1);
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return body + '-' + dv;
  }

  function passwordStrength(v) {
    let score = 0;
    if (v.length >= 8)  score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (score <= 1) return { level: 1, label: 'Débil',   cls: 'weak'   };
    if (score <= 2) return { level: 2, label: 'Regular', cls: 'fair'   };
    if (score <= 3) return { level: 3, label: 'Buena',   cls: 'good'   };
    return              { level: 4, label: 'Fuerte',  cls: 'strong' };
  }

  /* ── UI helpers ── */
  function setError(input, msg) {
    input.classList.add('error');
    input.classList.remove('ok');
    const err = input.closest('.auth-field')?.querySelector('.auth-error-msg');
    if (err) { err.textContent = msg; err.classList.add('show'); }
  }
  function setOk(input) {
    input.classList.remove('error');
    input.classList.add('ok');
    const err = input.closest('.auth-field')?.querySelector('.auth-error-msg');
    if (err) err.classList.remove('show');
  }
  function clearField(input) {
    input.classList.remove('error', 'ok');
    const err = input.closest('.auth-field')?.querySelector('.auth-error-msg');
    if (err) err.classList.remove('show');
  }

  /* ── Construir el modal HTML ── */
  function buildModal() {
    const div = document.createElement('div');
    div.innerHTML = `
<div class="auth-overlay" id="authOverlay">
  <div class="auth-modal" role="dialog" aria-modal="true" aria-label="Autenticación">

    <!-- Header -->
    <div class="auth-header">
      <span class="auth-logo">Infra<span>Go</span></span>
      <div class="auth-tabs">
        <button class="auth-tab active" data-tab="login">Iniciar sesión</button>
        <button class="auth-tab" data-tab="register">Crear cuenta</button>
      </div>
      <button class="auth-close" id="authClose" aria-label="Cerrar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>

    <!-- Body -->
    <div class="auth-body">

      <!-- ── PANEL LOGIN ── -->
      <div class="auth-panel active" id="panelLogin">
        <div class="auth-title">Bienvenido de vuelta</div>
        <div class="auth-sub">Ingresa para continuar con tu cotización</div>

        <div class="auth-success" id="loginSuccess">
          <div class="auth-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h3>¡Sesión iniciada!</h3>
          <p>Redirigiendo al configurador...</p>
        </div>

        <form class="auth-form" id="formLogin" novalidate>

          <div class="auth-field">
            <label class="auth-label">Correo electrónico</label>
            <div class="auth-input-wrap">
              <input class="auth-input" type="email" id="loginEmail"
                placeholder="correo@empresa.cl" autocomplete="email">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
            </div>
            <span class="auth-error-msg"></span>
          </div>

          <div class="auth-field">
            <label class="auth-label">Contraseña</label>
            <div class="auth-input-wrap">
              <input class="auth-input" type="password" id="loginPassword"
                placeholder="••••••••" autocomplete="current-password">
              <button type="button" class="auth-pw-toggle" data-target="loginPassword">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <span class="auth-error-msg"></span>
          </div>

          <div class="auth-forgot"><a href="#">¿Olvidaste tu contraseña?</a></div>

          <button type="submit" class="auth-submit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/>
            </svg>
            Iniciar sesión
          </button>

        </form>
      </div>

      <!-- ── PANEL REGISTRO ── -->
      <div class="auth-panel" id="panelRegister">
        <div class="auth-title">Crear cuenta</div>
        <div class="auth-sub">Regístrate para cotizar y hacer seguimiento de tus pedidos</div>

        <div class="auth-success" id="registerSuccess">
          <div class="auth-success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          </div>
          <h3>¡Cuenta creada!</h3>
          <p>Ya puedes iniciar sesión con tu correo y contraseña.</p>
        </div>

        <form class="auth-form" id="formRegister" novalidate>

          <div class="auth-row">
            <div class="auth-field">
              <label class="auth-label">Correo electrónico</label>
              <div class="auth-input-wrap">
                <input class="auth-input" type="email" id="regEmail"
                  placeholder="correo@empresa.cl" autocomplete="email">
                <span class="auth-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                    <polyline points="22,6 12,13 2,6"/>
                  </svg>
                </span>
              </div>
              <span class="auth-error-msg"></span>
            </div>

            <div class="auth-field">
              <label class="auth-label">RUT</label>
              <div class="auth-input-wrap">
                <input class="auth-input" type="text" id="regRut"
                  placeholder="12.345.678-9" maxlength="12" autocomplete="off">
                <span class="auth-input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                </span>
              </div>
              <span class="auth-error-msg"></span>
            </div>
          </div>

          <div class="auth-field">
            <label class="auth-label">Teléfono</label>
            <div class="auth-input-wrap">
              <input class="auth-input" type="tel" id="regPhone"
                placeholder="+56 9 1234 5678" autocomplete="tel">
              <span class="auth-input-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.44 4.69 2 2 0 015.41 2.5h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 9.9a16 16 0 006.29 6.29l.76-.76a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>
                </svg>
              </span>
            </div>
            <span class="auth-error-msg"></span>
          </div>

          <div class="auth-field">
            <label class="auth-label">Contraseña</label>
            <div class="auth-input-wrap">
              <input class="auth-input" type="password" id="regPassword"
                placeholder="Mínimo 8 caracteres" autocomplete="new-password">
              <button type="button" class="auth-pw-toggle" data-target="regPassword">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <div class="auth-pw-strength" id="pwStrength">
              <div class="auth-pw-bars">
                <div class="auth-pw-bar" id="bar1"></div>
                <div class="auth-pw-bar" id="bar2"></div>
                <div class="auth-pw-bar" id="bar3"></div>
                <div class="auth-pw-bar" id="bar4"></div>
              </div>
              <span class="auth-pw-label" id="pwLabel">—</span>
            </div>
            <span class="auth-error-msg"></span>
          </div>

          <div class="auth-field">
            <label class="auth-label">Confirmar contraseña</label>
            <div class="auth-input-wrap">
              <input class="auth-input" type="password" id="regPasswordConfirm"
                placeholder="Repite tu contraseña" autocomplete="new-password">
              <button type="button" class="auth-pw-toggle" data-target="regPasswordConfirm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
            </div>
            <span class="auth-error-msg"></span>
          </div>

          <label class="auth-terms">
            <input type="checkbox" id="regTerms">
            Acepto los <a href="#">Términos de servicio</a> y la <a href="#">Política de privacidad</a> de InfraGo.
          </label>
          <span class="auth-error-msg" id="termsError"></span>

          <button type="submit" class="auth-submit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <line x1="19" y1="8" x2="19" y2="14"/>
              <line x1="22" y1="11" x2="16" y2="11"/>
            </svg>
            Crear cuenta
          </button>

        </form>
      </div>

    </div><!-- /auth-body -->
  </div><!-- /auth-modal -->
</div><!-- /auth-overlay -->
    `;
    document.body.appendChild(div.firstElementChild);
  }

  /* ── Inicializar eventos ── */
  function init() {
    buildModal();

    const overlay = document.getElementById('authOverlay');
    const closeBtn = document.getElementById('authClose');
    const tabs     = document.querySelectorAll('.auth-tab');

    /* Cerrar */
    closeBtn.addEventListener('click', closeAuth);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeAuth(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAuth(); });

    /* Tabs */
    tabs.forEach(tab => {
      tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    /* Toggle contraseña */
    document.querySelectorAll('.auth-pw-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const inp = document.getElementById(btn.dataset.target);
        inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    });

    /* Formato RUT en tiempo real */
    const rutInput = document.getElementById('regRut');
    rutInput.addEventListener('input', () => {
      const pos = rutInput.selectionStart;
      rutInput.value = formatRut(rutInput.value);
    });
    rutInput.addEventListener('blur', () => {
      if (rutInput.value) {
        validators.rut(rutInput.value) ? setOk(rutInput) : setError(rutInput, 'RUT inválido');
      }
    });

    /* Fuerza de contraseña */
    const pwInput = document.getElementById('regPassword');
    const pwStrength = document.getElementById('pwStrength');
    const pwLabel    = document.getElementById('pwLabel');
    const bars = [document.getElementById('bar1'), document.getElementById('bar2'),
                  document.getElementById('bar3'), document.getElementById('bar4')];

    pwInput.addEventListener('input', () => {
      if (!pwInput.value) { pwStrength.classList.remove('show'); return; }
      pwStrength.classList.add('show');
      const s = passwordStrength(pwInput.value);
      pwLabel.textContent = s.label;
      bars.forEach((bar, i) => {
        bar.className = 'auth-pw-bar';
        if (i < s.level) bar.classList.add(s.cls);
      });
    });

    /* Validación inline email login */
    document.getElementById('loginEmail').addEventListener('blur', function() {
      if (!this.value) return clearField(this);
      validators.email(this.value) ? setOk(this) : setError(this, 'Correo inválido');
    });
    document.getElementById('regEmail').addEventListener('blur', function() {
      if (!this.value) return clearField(this);
      validators.email(this.value) ? setOk(this) : setError(this, 'Correo inválido');
    });
    document.getElementById('regPhone').addEventListener('blur', function() {
      if (!this.value) return clearField(this);
      validators.phone(this.value) ? setOk(this) : setError(this, 'Teléfono inválido (ej: +56 9 1234 5678)');
    });

    /* Confirmar contraseña */
    document.getElementById('regPasswordConfirm').addEventListener('blur', function() {
      if (!this.value) return clearField(this);
      const match = this.value === document.getElementById('regPassword').value;
      match ? setOk(this) : setError(this, 'Las contraseñas no coinciden');
    });

    /* Submit LOGIN */
    document.getElementById('formLogin').addEventListener('submit', function(e) {
      e.preventDefault();
      let ok = true;
      const email = document.getElementById('loginEmail');
      const pw    = document.getElementById('loginPassword');

      if (!validators.email(email.value)) { setError(email, 'Correo inválido'); ok = false; }
      else setOk(email);

      if (!pw.value) { setError(pw, 'Ingresa tu contraseña'); ok = false; }
      else setOk(pw);

      if (!ok) return;

      const user = state.users.find(u => u.email === email.value.trim().toLowerCase() && u.password === pw.value);
      if (!user) {
        setError(email, 'Correo o contraseña incorrectos');
        setError(pw, ' ');
        return;
      }

      state.current = { email: user.email, rut: user.rut, phone: user.phone };
      saveCurrent();
      updateNavbar();

      // Capturar el redirect antes de cerrar el modal, ya que
      // closeAuth() limpia _authRedirect para evitar redirects no deseados
      const redirectTarget = window._authRedirect;

      document.getElementById('formLogin').style.display = 'none';
      document.getElementById('loginSuccess').classList.add('show');
      setTimeout(() => {
        closeAuth();
        if (redirectTarget) window.location.href = redirectTarget;
      }, 1500);
    });

    /* Submit REGISTRO */
    document.getElementById('formRegister').addEventListener('submit', function(e) {
      e.preventDefault();
      let ok = true;

      const email   = document.getElementById('regEmail');
      const rut     = document.getElementById('regRut');
      const phone   = document.getElementById('regPhone');
      const pw      = document.getElementById('regPassword');
      const pwc     = document.getElementById('regPasswordConfirm');
      const terms   = document.getElementById('regTerms');
      const termsErr = document.getElementById('termsError');

      if (!validators.email(email.value))  { setError(email, 'Correo inválido'); ok = false; } else setOk(email);
      if (!validators.rut(rut.value))      { setError(rut,   'RUT inválido');    ok = false; } else setOk(rut);
      if (!validators.phone(phone.value))  { setError(phone, 'Teléfono inválido'); ok = false; } else setOk(phone);
      if (!validators.password(pw.value))  { setError(pw, 'Mínimo 8 caracteres'); ok = false; } else setOk(pw);
      if (pwc.value !== pw.value)          { setError(pwc, 'Las contraseñas no coinciden'); ok = false; } else if (pwc.value) setOk(pwc);
      if (!terms.checked) {
        termsErr.textContent = 'Debes aceptar los términos'; termsErr.classList.add('show'); ok = false;
      } else {
        termsErr.classList.remove('show');
      }

      if (!ok) return;

      const emailLower = email.value.trim().toLowerCase();
      if (state.users.find(u => u.email === emailLower)) {
        setError(email, 'Este correo ya está registrado'); return;
      }

      state.users.push({ email: emailLower, rut: rut.value, phone: phone.value, password: pw.value });
      saveUsers();

      document.getElementById('formRegister').style.display = 'none';
      document.getElementById('registerSuccess').classList.add('show');
      setTimeout(() => switchTab('login'), 2200);
    });

    /* Actualizar navbar si ya hay sesión */
    updateNavbar();
  }

  /* ── Actualizar botón Mi cuenta en navbar ── */
  function updateNavbar() {
    const accountLink = document.querySelector('.igb-account');
    if (!accountLink) return;
    if (state.current) {
      const initials = state.current.email.slice(0,2).toUpperCase();
      accountLink.innerHTML = `
        <span style="width:32px;height:32px;background:#e8920a;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Barlow',sans-serif;font-weight:800;font-size:12px;color:#fff;flex-shrink:0;">${initials}</span>
        <span class="igb-account-text">
          <small>Sesión activa</small>
          <strong>${state.current.email.split('@')[0]}</strong>
        </span>`;
      accountLink.href = '#';
      accountLink.onclick = (e) => { e.preventDefault(); logout(); };
    } else {
      accountLink.onclick = (e) => { e.preventDefault(); openAuth('login'); };
    }
  }

  /* ── Logout ── */
  function logout() {
    if (!confirm('¿Cerrar sesión?')) return;
    state.current = null;
    saveCurrent();
    updateNavbar();
  }

  /* ── API pública ── */
  function openAuth(tab = 'login', redirectAfter = null) {
    window._authRedirect = redirectAfter;
    const overlay = document.getElementById('authOverlay');
    overlay.style.pointerEvents = ''; // resetear por si closeAuth lo había deshabilitado
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    switchTab(tab);
  }

  function closeAuth() {
    const overlay = document.getElementById('authOverlay');
    overlay.classList.remove('open');

    // Restaurar scroll del body solo si el menú mobile del navbar no lo bloqueó también
    const mobileMenuOpen = document.getElementById('igbMobile')?.classList.contains('open');
    if (!mobileMenuOpen) {
      document.body.style.overflow = '';
    }

    // Asegurar que el overlay no bloquee clicks después de cerrarse
    overlay.style.pointerEvents = 'none';
    setTimeout(() => { overlay.style.pointerEvents = ''; }, 50);

    // Limpiar redirect pendiente al cerrar sin autenticarse
    window._authRedirect = null;
  }

  function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.auth-panel').forEach(p => p.classList.toggle('active', p.id === 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1)));
  }

  /* ── Proteger configurador ── */
  function guardConfigurador() {
    if (window.location.pathname.includes('configurador')) {
      if (!state.current) {
        openAuth('login', '/configurador.html');
        return true;
      }
    }
    return false;
  }

  /* ── Init ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { init(); guardConfigurador(); });
  } else {
    init();
    guardConfigurador();
  }

  /* Exponer globalmente */
  window.igbAuth = { open: openAuth, close: closeAuth, logout, current: () => state.current };

})();