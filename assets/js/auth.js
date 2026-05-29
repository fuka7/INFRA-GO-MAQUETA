/* ═══════════════════════════════════════════════
   auth.js — ElevalCorp
   Modal Login / Registro — conectado a Supabase
   © 2026 ElevalCorp SpA / TIC Managers
═══════════════════════════════════════════════ */

(function () {

  var currentUser = null;

  /* ════════════════════════════════════════════
     VALIDADORES
  ════════════════════════════════════════════ */
  /* ════════════════════════════════════════════
     HELPERS DE PERFIL
  ════════════════════════════════════════════ */
  function igBuildProfile(email, data, meta) {
    var d = data || {};
    var m = meta || {};
    return {
      email:        email                  || '',
      nombre:       m.nombre               || d.nombre    || '',
      apellido:     m.apellido             || d.apellido  || '',
      rut:          d.rut                  || m.rut       || '',
      phone:        d.phone                || m.phone     || '',
      razon_social: d.razon_social         || '',
      giro:         m.giro                 || d.giro      || '',
      contacto:     d.contacto             || '',
      cargo:        d.cargo                || '',
      direccion:    d.direccion            || '',
      ciudad:       d.ciudad               || '',
      region:       d.region               || '',
      sii_fetched:  d.sii_fetched          || false
    };
  }

  function igSaveProfileCache(profile) {
    try { localStorage.setItem('ig_profile', JSON.stringify(profile)); } catch(e) {}
  }

  function igClearProfileCache() {
    try { localStorage.removeItem('ig_profile'); } catch(e) {}
  }

    var validators = {
    email: function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); },
    rut: function(v) {
      v = v.replace(/\./g, '').replace(/-/g, '').trim().toLowerCase();
      if (!/^\d{7,8}[0-9k]$/.test(v)) return false;
      var dv = v.slice(-1), num = v.slice(0, -1), sum = 0, mul = 2;
      for (var i = num.length - 1; i >= 0; i--) {
        sum += parseInt(num[i]) * mul;
        mul = mul === 7 ? 2 : mul + 1;
      }
      var res = 11 - (sum % 11);
      var expected = res === 11 ? '0' : res === 10 ? 'k' : String(res);
      return dv === expected;
    },
    phone: function(v) { return /^(\+?56)?[\s-]?[2-9]\d{7,8}$/.test(v.replace(/\s/g, '')); },
    password: function(v) { return v.length >= 8; }
  };

  function formatRut(v) {
    v = v.replace(/[^0-9kK]/g, '').toUpperCase();
    if (v.length <= 1) return v;
    var dv = v.slice(-1), body = v.slice(0, -1);
    body = body.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return body + '-' + dv;
  }

  function passwordStrength(v) {
    var score = 0;
    if (v.length >= 8)  score++;
    if (v.length >= 12) score++;
    if (/[A-Z]/.test(v)) score++;
    if (/[0-9]/.test(v)) score++;
    if (/[^A-Za-z0-9]/.test(v)) score++;
    if (score <= 1) return { level: 1, label: 'Débil',   cls: 'weak'   };
    if (score <= 2) return { level: 2, label: 'Regular', cls: 'fair'   };
    if (score <= 3) return { level: 3, label: 'Buena',   cls: 'good'   };
    return               { level: 4, label: 'Fuerte',  cls: 'strong' };
  }

  /* ════════════════════════════════════════════
     UI HELPERS
  ════════════════════════════════════════════ */
  function setError(input, msg) {
    input.classList.add('error'); input.classList.remove('ok');
    var err = input.closest('.auth-field') && input.closest('.auth-field').querySelector('.auth-error-msg');
    if (err) { err.textContent = msg; err.classList.add('show'); }
  }
  function setOk(input) {
    input.classList.remove('error'); input.classList.add('ok');
    var err = input.closest('.auth-field') && input.closest('.auth-field').querySelector('.auth-error-msg');
    if (err) err.classList.remove('show');
  }
  function clearField(input) {
    input.classList.remove('error', 'ok');
    var err = input.closest('.auth-field') && input.closest('.auth-field').querySelector('.auth-error-msg');
    if (err) err.classList.remove('show');
  }
  function setLoading(btn, on) {
    btn.disabled = on; btn.style.opacity = on ? '0.7' : ''; btn.style.cursor = on ? 'wait' : '';
  }

  /* ════════════════════════════════════════════
     MODAL HTML
  ════════════════════════════════════════════ */
  function buildModal() {
    if (document.getElementById('authOverlay')) return; // ya existe
    var div = document.createElement('div');
    div.innerHTML = '<div class="auth-overlay" id="authOverlay">\
  <div class="auth-modal" role="dialog" aria-modal="true">\
    <div class="auth-header">\
      <span class="auth-logo">Infra<span>Go</span></span>\
      <div class="auth-tabs">\
        <button class="auth-tab active" data-tab="login">Iniciar sesión</button>\
        <button class="auth-tab" data-tab="register">Crear cuenta</button>\
      </div>\
      <button class="auth-close" id="authClose" aria-label="Cerrar">\
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>\
      </button>\
    </div>\
    <div class="auth-body">\
      <div class="auth-panel active" id="panelLogin">\
        <div class="auth-title">Bienvenido de vuelta</div>\
        <div class="auth-sub">Ingresa para continuar con tu cotización</div>\
        <div class="auth-success" id="loginSuccess">\
          <div class="auth-success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg></div>\
          <h3>¡Sesión iniciada!</h3><p id="loginSuccessMsg">Redirigiendo...</p>\
        </div>\
        <form class="auth-form" id="formLogin" novalidate>\
          <div class="auth-field">\
            <label class="auth-label">Correo electrónico</label>\
            <div class="auth-input-wrap">\
              <input class="auth-input" type="email" id="loginEmail" placeholder="correo@empresa.cl" autocomplete="email">\
              <span class="auth-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>\
            </div>\
            <span class="auth-error-msg"></span>\
          </div>\
          <div class="auth-field">\
            <label class="auth-label">Contraseña</label>\
            <div class="auth-input-wrap">\
              <input class="auth-input" type="password" id="loginPassword" placeholder="••••••••" autocomplete="current-password">\
              <button type="button" class="auth-pw-toggle" data-target="loginPassword"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>\
            </div>\
            <span class="auth-error-msg"></span>\
          </div>\
          <div class="auth-forgot"><a href="#" id="forgotPasswordLink">¿Olvidaste tu contraseña?</a></div>\
          <button type="submit" class="auth-submit" id="btnLogin">\
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg>\
            Iniciar sesión\
          </button>\
          <div class="auth-error-msg" id="loginGlobalError" style="margin-top:8px;text-align:center;"></div>\
        </form>\
      </div>\
      <div class="auth-panel" id="panelRegister">\
        <div class="auth-title">Crear cuenta</div>\
        <div class="auth-sub">Regístrate para cotizar y hacer seguimiento de tus pedidos</div>\
        <div class="auth-success" id="registerSuccess">\
          <div class="auth-success-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg></div>\
          <h3>¡Cuenta creada!</h3>\
          <p>Revisa tu correo para confirmar tu cuenta.</p>\
          <p style="margin-top:10px;font-size:12px;color:#4a72b8;background:rgba(74,114,184,0.08);border:1px solid rgba(74,114,184,0.2);border-radius:8px;padding:10px 14px;line-height:1.5;">Una vez confirmada la cuenta, ingresa a <strong>Mi Perfil → Datos de facturación</strong> para guardar tu Razón Social, Giro y dirección. Se auto-rellenarán en todas tus cotizaciones.</p>\
          <button type="button" id="registerSuccessClose" style="margin-top:18px;width:100%;height:44px;background:linear-gradient(135deg,#CC6200,#FF7A00);color:#fff;border:none;border-radius:10px;font-family:Montserrat,sans-serif;font-size:14px;font-weight:700;cursor:pointer;">Entendido</button>\
        </div>\
        <form class="auth-form" id="formRegister" novalidate>\
          <div class="auth-row">\
            <div class="auth-field">\
              <label class="auth-label">Nombre</label>\
              <div class="auth-input-wrap">\
                <input class="auth-input" type="text" id="regNombre" placeholder="Juan" autocomplete="given-name">\
                <span class="auth-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>\
              </div>\
              <span class="auth-error-msg"></span>\
            </div>\
            <div class="auth-field">\
              <label class="auth-label">Apellido</label>\
              <div class="auth-input-wrap">\
                <input class="auth-input" type="text" id="regApellido" placeholder="González" autocomplete="family-name">\
                <span class="auth-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>\
              </div>\
              <span class="auth-error-msg"></span>\
            </div>\
          </div>\
          <div class="auth-row">\
            <div class="auth-field">\
              <label class="auth-label">Correo electrónico</label>\
              <div class="auth-input-wrap">\
                <input class="auth-input" type="email" id="regEmail" placeholder="correo@empresa.cl" autocomplete="email">\
                <span class="auth-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg></span>\
              </div>\
              <span class="auth-error-msg"></span>\
            </div>\
            <div class="auth-field">\
              <label class="auth-label">RUT</label>\
              <div class="auth-input-wrap">\
                <input class="auth-input" type="text" id="regRut" placeholder="12.345.678-9" maxlength="12" autocomplete="off">\
                <span class="auth-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>\
              </div>\
              <span class="auth-error-msg"></span>\
            </div>\
          </div>\
          <div class="auth-field">\
            <label class="auth-label">Teléfono</label>\
            <div class="auth-input-wrap">\
              <input class="auth-input" type="tel" id="regPhone" placeholder="+56 9 1234 5678" autocomplete="tel">\
              <span class="auth-input-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.44 4.69 2 2 0 015.41 2.5h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L9.91 9.9a16 16 0 006.29 6.29l.76-.76a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg></span>\
            </div>\
            <span class="auth-error-msg"></span>\
          </div>\
          <div class="auth-field">\
            <label class="auth-label">Contraseña</label>\
            <div class="auth-input-wrap">\
              <input class="auth-input" type="password" id="regPassword" placeholder="Mínimo 8 caracteres" autocomplete="new-password">\
              <button type="button" class="auth-pw-toggle" data-target="regPassword"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>\
            </div>\
            <div class="auth-pw-strength" id="pwStrength">\
              <div class="auth-pw-bars"><div class="auth-pw-bar" id="bar1"></div><div class="auth-pw-bar" id="bar2"></div><div class="auth-pw-bar" id="bar3"></div><div class="auth-pw-bar" id="bar4"></div></div>\
              <span class="auth-pw-label" id="pwLabel">—</span>\
            </div>\
            <span class="auth-error-msg"></span>\
          </div>\
          <div class="auth-field">\
            <label class="auth-label">Confirmar contraseña</label>\
            <div class="auth-input-wrap">\
              <input class="auth-input" type="password" id="regPasswordConfirm" placeholder="Repite tu contraseña" autocomplete="new-password">\
              <button type="button" class="auth-pw-toggle" data-target="regPasswordConfirm"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>\
            </div>\
            <span class="auth-error-msg"></span>\
          </div>\
          <label class="auth-terms"><input type="checkbox" id="regTerms"> Acepto los <a href="#">Términos de servicio</a> y la <a href="#">Política de privacidad</a> de ElevalCorp.</label>\
          <span class="auth-error-msg" id="termsError"></span>\
          <button type="submit" class="auth-submit" id="btnRegister">\
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>\
            Crear cuenta\
          </button>\
          <div class="auth-error-msg" id="registerGlobalError" style="margin-top:8px;text-align:center;"></div>\
        </form>\
      </div>\
    </div>\
  </div>\
</div>';
    document.body.appendChild(div.firstElementChild);
  }

  /* ════════════════════════════════════════════
     ABRIR / CERRAR / TABS
  ════════════════════════════════════════════ */
  function openAuth(tab, redirectAfter) {
    buildModal();
    window._authRedirect = redirectAfter || null;
    var overlay = document.getElementById('authOverlay');
    overlay.style.pointerEvents = '';
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
    switchTab(tab || 'login');
  }

  function closeAuth(clearRedirect) {
    var overlay = document.getElementById('authOverlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    var mobile = document.getElementById('igbMobile');
    if (!mobile || !mobile.classList.contains('open')) document.body.style.overflow = '';
    overlay.style.pointerEvents = 'none';
    setTimeout(function() { if (overlay) overlay.style.pointerEvents = ''; }, 50);
    if (clearRedirect !== false) window._authRedirect = null;
    if (window.location.pathname.includes('configurador') && !currentUser) {
      window.location.href = '/index.html';
    }
  }

  function switchTab(tab) {
    document.querySelectorAll('.auth-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    document.querySelectorAll('.auth-panel').forEach(function(p) {
      p.classList.toggle('active', p.id === 'panel' + tab.charAt(0).toUpperCase() + tab.slice(1));
    });
  }

  /* ════════════════════════════════════════════
     NAVBAR
  ════════════════════════════════════════════ */
  function _mobileAccountHTML(user) {
    if (user) {
      var nombre = (user.nombre || '').trim();
      var apellido = (user.apellido || '').trim();
      var initials = nombre && apellido ? (nombre[0] + apellido[0]).toUpperCase() : nombre ? nombre.slice(0,2).toUpperCase() : user.email.slice(0,2).toUpperCase();
      var displayName = nombre ? (nombre + (apellido ? ' ' + apellido : '')) : user.email.split('@')[0];
      return '<div class="igb-mobile-account"><div class="igb-mobile-account-row"><div class="igb-mobile-account-avatar">' + initials + '</div><div class="igb-mobile-account-info"><div class="igb-mobile-account-name">' + displayName + '</div><div class="igb-mobile-account-sub">Sesión activa</div></div></div><div class="igb-mobile-account-actions"><button onclick="igbOpenProfile()" class="igb-mobile-profile-btn">Mi perfil</button><button onclick="igbLogout()" class="igb-mobile-logout">Cerrar sesión</button></div></div>';
    } else {
      return '<div style="margin-top:8px;"><button onclick="igbMobileLogin()" class="igb-mobile-login-btn"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>Iniciar Sesión</button></div>';
    }
  }

  function updateNavbar() {
    document.querySelectorAll('.igb-account').forEach(function(link) {
      if (currentUser) {
        var nombre   = (currentUser.nombre   || '').trim();
        var apellido = (currentUser.apellido || '').trim();
        var initials = nombre && apellido
          ? (nombre[0] + apellido[0]).toUpperCase()
          : nombre
            ? nombre.slice(0, 2).toUpperCase()
            : currentUser.email.slice(0, 2).toUpperCase();
        var displayName = nombre
          ? (nombre + (apellido ? ' ' + apellido : ''))
          : currentUser.email.split('@')[0];
        link.innerHTML =
          '<span style="width:32px;height:32px;background:#FF7A00;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Montserrat,sans-serif;font-weight:800;font-size:12px;color:#fff;flex-shrink:0;">' + initials + '</span>' +
          '<span class="igb-account-text"><small>Sesión activa</small><strong>' + displayName + '</strong></span>' +
          '<svg class="igb-acct-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="13" height="13"><polyline points="6 9 12 15 18 9"/></svg>';
        link.dataset.igbState = 'logged';
      } else {
        link.dataset.igbState = 'guest';
      }
    });
    var mobileAccount = document.getElementById('igbMobileAccount');
    if (mobileAccount) mobileAccount.innerHTML = _mobileAccountHTML(currentUser);
  }

  /* ════════════════════════════════════════════
     LOGOUT — modal de confirmación custom
  ════════════════════════════════════════════ */
  function logout() {
    // Crear modal de confirmación si no existe
    var existing = document.getElementById('igbLogoutModal');
    if (existing) existing.remove();

    var el = document.createElement('div');
    el.id = 'igbLogoutModal';
    el.innerHTML = '<div id="igbLogoutOverlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:99999;display:flex;align-items:center;justify-content:center;">' +
      '<div style="background:#fff;border-radius:16px;padding:32px 28px;max-width:360px;width:90%;text-align:center;box-shadow:0 8px 40px rgba(0,0,0,0.18);">' +
        '<div style="width:52px;height:52px;background:#fff3e0;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;">' +
          '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FF7A00" stroke-width="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>' +
        '</div>' +
        '<h3 style="margin:0 0 8px;font-family:Montserrat,sans-serif;font-size:18px;font-weight:700;color:#0f172a;">¿Cerrar sesión?</h3>' +
        '<p style="margin:0 0 24px;font-family:Montserrat,sans-serif;font-size:14px;color:#64748b;">Tu sesión se cerrará en este dispositivo.</p>' +
        '<div style="display:flex;gap:10px;justify-content:center;">' +
          '<button id="igbLogoutCancel" style="flex:1;padding:10px;border:1.5px solid #e2e8f0;border-radius:8px;background:#fff;font-family:Montserrat,sans-serif;font-size:14px;font-weight:600;color:#64748b;cursor:pointer;">Cancelar</button>' +
          '<button id="igbLogoutConfirm" style="flex:1;padding:10px;border:none;border-radius:8px;background:#FF7A00;font-family:Montserrat,sans-serif;font-size:14px;font-weight:700;color:#fff;cursor:pointer;">Cerrar sesión</button>' +
        '</div>' +
      '</div>' +
    '</div>';
    document.body.appendChild(el);

    function closeModal() { el.remove(); }

    document.getElementById('igbLogoutCancel').addEventListener('click', closeModal);
    document.getElementById('igbLogoutOverlay').addEventListener('click', function(e) {
      if (e.target === document.getElementById('igbLogoutOverlay')) closeModal();
    });
    document.getElementById('igbLogoutConfirm').addEventListener('click', function() {
      closeModal();
      window.supabase.auth.signOut().then(function() {
        currentUser = null;
        if (window.location.pathname.includes('configurador')) {
          window.location.href = '/index.html';
        } else {
          window.location.reload();
        }
      });
    });
  }

  /* ════════════════════════════════════════════
     GUARDIA CONFIGURADOR
  ════════════════════════════════════════════ */
  function guardConfigurador() {
    if (!window.location.pathname.includes('configurador')) return;
    if (!currentUser) {
      // Redirige al origen en lugar de mostrar el configurador al fondo del modal
      sessionStorage.setItem('ig_open_login', '/configurador.html');
      window.location.replace('/index.html');
    }
  }

  /* ════════════════════════════════════════════
     EVENTOS DEL MODAL
  ════════════════════════════════════════════ */
  function attachModalEvents() {
    var overlay = document.getElementById('authOverlay');
    var closeBtn = document.getElementById('authClose');

    closeBtn.addEventListener('click', function() { closeAuth(); });
    overlay.addEventListener('click', function(e) { if (e.target === overlay) closeAuth(); });
    document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { closeAuth(); closeAcctDropdown(); } });

    // Tabs
    document.querySelectorAll('.auth-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { switchTab(tab.dataset.tab); });
    });

    // Toggle password visibility
    document.querySelectorAll('.auth-pw-toggle').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var inp = document.getElementById(btn.dataset.target);
        inp.type = inp.type === 'password' ? 'text' : 'password';
      });
    });

    // RUT format
    var rutInput = document.getElementById('regRut');
    rutInput.addEventListener('input', function() { rutInput.value = formatRut(rutInput.value); });
    rutInput.addEventListener('blur', function() {
      if (rutInput.value) validators.rut(rutInput.value) ? setOk(rutInput) : setError(rutInput, 'RUT inválido');
    });

    // Password strength
    var pwInput = document.getElementById('regPassword');
    var pwStrength = document.getElementById('pwStrength');
    var pwLabel = document.getElementById('pwLabel');
    var bars = ['bar1','bar2','bar3','bar4'].map(function(id) { return document.getElementById(id); });
    pwInput.addEventListener('input', function() {
      if (!pwInput.value) { pwStrength.classList.remove('show'); return; }
      pwStrength.classList.add('show');
      var s = passwordStrength(pwInput.value);
      pwLabel.textContent = s.label;
      bars.forEach(function(bar, i) { bar.className = 'auth-pw-bar'; if (i < s.level) bar.classList.add(s.cls); });
    });

    // Inline validations
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
    document.getElementById('regPasswordConfirm').addEventListener('blur', function() {
      if (!this.value) return clearField(this);
      this.value === document.getElementById('regPassword').value ? setOk(this) : setError(this, 'Las contraseñas no coinciden');
    });

    // Forgot password
    document.getElementById('forgotPasswordLink').addEventListener('click', function(e) {
      e.preventDefault();
      var emailVal = document.getElementById('loginEmail').value.trim();
      var globalErr = document.getElementById('loginGlobalError');
      if (!emailVal || !validators.email(emailVal)) {
        setError(document.getElementById('loginEmail'), 'Ingresa tu correo primero'); return;
      }
      window.supabase.auth.resetPasswordForEmail(emailVal, {
        redirectTo: window.location.origin + '/reset-password.html'
      }).then(function(res) {
        if (res.error) {
          globalErr.textContent = 'Error al enviar el correo.'; globalErr.classList.add('show');
        } else {
          globalErr.style.color = '#22c55e';
          globalErr.textContent = 'Te enviamos un correo de recuperación.'; globalErr.classList.add('show');
        }
      });
    });

    // LOGIN SUBMIT
    document.getElementById('formLogin').addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail');
      var pw    = document.getElementById('loginPassword');
      var btn   = document.getElementById('btnLogin');
      var globalErr = document.getElementById('loginGlobalError');
      globalErr.classList.remove('show');

      var ok = true;
      if (!validators.email(email.value)) { setError(email, 'Correo inválido'); ok = false; } else setOk(email);
      if (!pw.value) { setError(pw, 'Ingresa tu contraseña'); ok = false; } else setOk(pw);
      if (!ok) return;

      setLoading(btn, true);

      window.supabase.auth.signInWithPassword({
        email: email.value.trim().toLowerCase(),
        password: pw.value
      }).then(function(res) {
        if (res.error) {
          setLoading(btn, false);
          var msg = res.error.message.includes('Invalid login') ? 'Correo o contraseña incorrectos'
            : res.error.message.includes('Email not confirmed') ? 'Debes confirmar tu correo antes de ingresar'
            : 'Error al iniciar sesión. Intenta de nuevo.';
          setError(email, msg); setError(pw, ' ');
          return;
        }
        return window.supabase.from('profiles').select('rut, phone, email, razon_social, contacto, cargo, direccion, ciudad, region, sii_fetched').eq('id', res.data.user.id).single()
          .then(function(pr) {
            currentUser = igBuildProfile(res.data.user.email, pr.data, res.data.user.user_metadata);
            igSaveProfileCache(currentUser);
            updateNavbar();
            setLoading(btn, false);
            var redirectTarget = window._authRedirect;
            document.getElementById('formLogin').style.display = 'none';
            document.getElementById('loginSuccess').classList.add('show');
            setTimeout(function() {
              closeAuth(false);
              window._authRedirect = null;
              if (sessionStorage.getItem('ig_checkout_pending') && window.location.pathname.includes('carrito')) {
                sessionStorage.removeItem('ig_checkout_pending');
                if (typeof window.igcOpenCheckout === 'function') window.igcOpenCheckout();
                return;
              }
              if (redirectTarget) window.location.href = redirectTarget;
            }, 1500);
          });
      }).catch(function() {
        setLoading(btn, false);
        setError(email, 'Error de conexión. Intenta de nuevo.');
      });
    });

    // REGISTRO SUBMIT
    document.getElementById('formRegister').addEventListener('submit', function(e) {
      e.preventDefault();
      var nombre  = document.getElementById('regNombre');
      var apellido= document.getElementById('regApellido');
      var email   = document.getElementById('regEmail');
      var rut     = document.getElementById('regRut');
      var phone   = document.getElementById('regPhone');
      var pw      = document.getElementById('regPassword');
      var pwc     = document.getElementById('regPasswordConfirm');
      var terms   = document.getElementById('regTerms');
      var termsErr= document.getElementById('termsError');
      var btn     = document.getElementById('btnRegister');
      document.getElementById('registerGlobalError').classList.remove('show');

      var ok = true;
      if (!nombre.value.trim())            { setError(nombre,   'Ingresa tu nombre'); ok = false; }   else setOk(nombre);
      if (!apellido.value.trim())          { setError(apellido, 'Ingresa tu apellido'); ok = false; } else setOk(apellido);
      if (!validators.email(email.value))  { setError(email,    'Correo inválido'); ok = false; }     else setOk(email);
      if (!validators.rut(rut.value))      { setError(rut,      'RUT inválido'); ok = false; }        else setOk(rut);
      if (!validators.phone(phone.value))  { setError(phone,    'Teléfono inválido'); ok = false; }   else setOk(phone);
      if (!validators.password(pw.value))  { setError(pw,       'Mínimo 8 caracteres'); ok = false; } else setOk(pw);
      if (pwc.value !== pw.value)          { setError(pwc, 'Las contraseñas no coinciden'); ok = false; } else if (pwc.value) setOk(pwc);
      if (!terms.checked) { termsErr.textContent = 'Debes aceptar los términos'; termsErr.classList.add('show'); ok = false; }
      else termsErr.classList.remove('show');
      if (!ok) return;

      setLoading(btn, true);
      window.supabase.auth.signUp({
        email: email.value.trim().toLowerCase(),
        password: pw.value,
        options: { data: { nombre: nombre.value.trim(), apellido: apellido.value.trim(), rut: rut.value, phone: phone.value } }
      }).then(function(res) {
        setLoading(btn, false);
        if (res.error) {
          var msg = res.error.message.includes('already registered') ? 'Este correo ya está registrado' : 'Error al crear la cuenta.';
          setError(email, msg); return;
        }
        document.getElementById('formRegister').style.display = 'none';
        document.getElementById('registerSuccess').classList.add('show');
        var pending = window._authRedirect;
        var closeBtn = document.getElementById('registerSuccessClose');
        if (closeBtn) {
          closeBtn.addEventListener('click', function() {
            closeAuth();
            document.getElementById('registerSuccess').classList.remove('show');
            document.getElementById('formRegister').style.display = '';
            window._authRedirect = pending;
          }, { once: true });
        }
      }).catch(function() {
        setLoading(btn, false);
        setError(email, 'Error de conexión. Intenta de nuevo.');
      });
    });
  }

  /* ════════════════════════════════════════════
     SESIÓN SUPABASE
  ════════════════════════════════════════════ */
  function initSession() {
    window.supabase.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (session) {
        window.supabase.from('profiles').select('rut, phone, email, razon_social, contacto, cargo, direccion, ciudad, region, sii_fetched').eq('id', session.user.id).single().then(function(pr) {
          currentUser = igBuildProfile(session.user.email, pr.data, session.user.user_metadata);
          igSaveProfileCache(currentUser);
          updateNavbar();
          // Si venía de configurador y ya tiene sesión, va directo
          var pending = sessionStorage.getItem('ig_open_login');
          if (pending) { sessionStorage.removeItem('ig_open_login'); window.location.href = pending; return; }
          guardConfigurador();
        });
      } else {
        // Si fue redirigido desde configurador sin sesión, abre el modal aquí
        var pending = sessionStorage.getItem('ig_open_login');
        if (pending) { sessionStorage.removeItem('ig_open_login'); openAuth('login', pending); return; }
        guardConfigurador();
      }
    });

    window.supabase.auth.onAuthStateChange(function(event, session) {
      if (event === 'SIGNED_IN' && session && !currentUser) {
        window.supabase.from('profiles').select('rut, phone, email, razon_social, contacto, cargo, direccion, ciudad, region, sii_fetched').eq('id', session.user.id).single().then(function(pr) {
          currentUser = igBuildProfile(session.user.email, pr.data, session.user.user_metadata);
          igSaveProfileCache(currentUser);
          updateNavbar();
        });
      }
      if (event === 'SIGNED_OUT') { currentUser = null; igClearProfileCache(); updateNavbar(); }
    });
  }

  /* ════════════════════════════════════════════
     DROPDOWN DE CUENTA (navbar desktop)
  ════════════════════════════════════════════ */
  var _ddOpen = false;

  function buildAcctDropdown() {
    if (document.getElementById('igbAcctDd')) return;
    var el = document.createElement('div');
    el.id = 'igbAcctDd';
    el.className = 'igb-acct-dd';
    el.innerHTML =
      '<button class="igb-acct-dd-item" id="igbDdPerfil">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
        'Mi perfil' +
      '</button>' +
      '<hr class="igb-acct-dd-sep">' +
      '<button class="igb-acct-dd-item danger" id="igbDdLogout">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="15" height="15"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>' +
        'Cerrar sesión' +
      '</button>';
    document.body.appendChild(el);

    document.getElementById('igbDdPerfil').addEventListener('click', function(e) {
      e.stopPropagation();
      closeAcctDropdown();
      window.location.href = '/perfil.html';
    });
    document.getElementById('igbDdLogout').addEventListener('click', function(e) {
      e.stopPropagation();
      closeAcctDropdown();
      logout();
    });

    document.addEventListener('click', function(e) {
      if (!_ddOpen) return;
      var dd   = document.getElementById('igbAcctDd');
      var acct = document.querySelector('.igb-account');
      if (dd && dd.contains(e.target)) return;
      if (acct && acct.contains(e.target)) return;
      closeAcctDropdown();
    });
  }

  function openAcctDropdown(anchor) {
    buildAcctDropdown();
    var dd = document.getElementById('igbAcctDd');
    if (!dd) return;
    var rect = anchor.getBoundingClientRect();
    dd.style.top   = (rect.bottom + 8) + 'px';
    dd.style.right = (window.innerWidth - rect.right) + 'px';
    dd.style.left  = 'auto';
    dd.classList.add('open');
    anchor.classList.add('open');
    _ddOpen = true;
  }

  function closeAcctDropdown() {
    var dd   = document.getElementById('igbAcctDd');
    var acct = document.querySelector('.igb-account');
    if (dd)   dd.classList.remove('open');
    if (acct) acct.classList.remove('open');
    _ddOpen = false;
  }

  function toggleAcctDropdown(anchor) {
    _ddOpen ? closeAcctDropdown() : openAcctDropdown(anchor);
  }

  /* ════════════════════════════════════════════
     PANEL DE PERFIL
  ════════════════════════════════════════════ */
  var _profileEventsAttached = false;
  var _quotLoaded = false;

  function buildProfilePanel() {
    if (document.getElementById('igpPanel')) return;
    var wrapper = document.createElement('div');
    wrapper.innerHTML =
      '<div class="igp-overlay" id="igpOverlay"></div>' +
      '<div class="igp-panel" id="igpPanel" role="dialog" aria-modal="true" aria-label="Mi perfil">' +
        '<div class="igp-header">' +
          '<div class="igp-header-top">' +
            '<div class="igp-user-row">' +
              '<div class="igp-avatar" id="igpAvatar"></div>' +
              '<div class="igp-user-info">' +
                '<div class="igp-user-name" id="igpUserName"></div>' +
                '<div class="igp-user-email" id="igpUserEmail"></div>' +
              '</div>' +
            '</div>' +
            '<button class="igp-close" id="igpClose" aria-label="Cerrar perfil">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
          '<div class="igp-tabs">' +
            '<button class="igp-tab active" data-pane="datos">Mis Datos</button>' +
            '<button class="igp-tab" data-pane="tarjetas">Tarjetas</button>' +
            '<button class="igp-tab" data-pane="cotizaciones">Cotizaciones</button>' +
          '</div>' +
        '</div>' +
        '<div class="igp-body">' +
          '<div class="igp-pane active" id="igpPaneDatos">' +
            '<form class="igp-form" id="igpFormDatos" novalidate>' +
              '<div class="igp-row">' +
                '<div class="igp-field"><label class="igp-label">Nombre</label><input class="igp-input" type="text" id="igpNombre" placeholder="Juan" autocomplete="given-name"></div>' +
                '<div class="igp-field"><label class="igp-label">Apellido</label><input class="igp-input" type="text" id="igpApellido" placeholder="González" autocomplete="family-name"></div>' +
              '</div>' +
              '<div class="igp-row">' +
                '<div class="igp-field"><label class="igp-label">RUT</label><input class="igp-input" type="text" id="igpRut" placeholder="12.345.678-9" maxlength="12"></div>' +
                '<div class="igp-field"><label class="igp-label">Teléfono</label><input class="igp-input" type="tel" id="igpPhone" placeholder="+56 9 1234 5678" autocomplete="tel"></div>' +
              '</div>' +
              '<div class="igp-field"><label class="igp-label">Correo electrónico</label><input class="igp-input" type="email" id="igpEmail" disabled></div>' +
              '<div class="igp-field"><label class="igp-label">Cargo</label><input class="igp-input" type="text" id="igpCargo" placeholder="Gerente TI"></div>' +
              '<div class="igp-billing-section">' +
                '<div class="igp-billing-title">' +
                  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" width="13" height="13"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
                  'Datos de facturación' +
                '</div>' +
                '<span class="igp-billing-hint">Se auto-rellenan en tus cotizaciones</span>' +
              '</div>' +
              '<div class="igp-row">' +
                '<div class="igp-field"><label class="igp-label">Razón Social / Empresa</label><input class="igp-input" type="text" id="igpEmpresa" placeholder="Mi Empresa SpA" autocomplete="organization"></div>' +
                '<div class="igp-field"><label class="igp-label">Giro</label><input class="igp-input" type="text" id="igpGiro" placeholder="Venta de equipos"></div>' +
              '</div>' +
              '<div class="igp-field"><label class="igp-label">Dirección</label><input class="igp-input" type="text" id="igpDireccion" placeholder="Av. Ejemplo 123" autocomplete="street-address"></div>' +
              '<div class="igp-row">' +
                '<div class="igp-field"><label class="igp-label">Región</label><select class="igp-input igp-select" id="igpRegion"><option value="">— seleccionar —</option><option value="Región Metropolitana">Región Metropolitana</option><option value="Región de Valparaíso">Región de Valparaíso</option><option value="Región de O\'Higgins">Región de O\'Higgins</option><option value="Región del Maule">Región del Maule</option><option value="Región de Ñuble">Región de Ñuble</option><option value="Región del Biobío">Región del Biobío</option><option value="Región de La Araucanía">Región de La Araucanía</option><option value="Región de Los Ríos">Región de Los Ríos</option><option value="Región de Los Lagos">Región de Los Lagos</option><option value="Región de Coquimbo">Región de Coquimbo</option><option value="Región de Atacama">Región de Atacama</option><option value="Región de Antofagasta">Región de Antofagasta</option><option value="Región de Tarapacá">Región de Tarapacá</option><option value="Región de Arica y Parinacota">Región de Arica y Parinacota</option><option value="Región de Aysén">Región de Aysén</option><option value="Región de Magallanes">Región de Magallanes</option></select></div>' +
                '<div class="igp-field"><label class="igp-label">Ciudad / Comuna</label><input class="igp-input" type="text" id="igpCiudad" placeholder="Las Condes" autocomplete="address-level2"></div>' +
              '</div>' +
              '<button type="submit" class="igp-save-btn" id="igpSaveBtn">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="15" height="15"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>' +
                'Guardar cambios' +
              '</button>' +
              '<div class="igp-save-msg" id="igpSaveMsg"></div>' +
            '</form>' +
          '</div>' +
          '<div class="igp-pane" id="igpPaneTarjetas">' +
            '<div class="igp-cards-empty">' +
              '<div class="igp-coming-badge">Próximamente</div>' +
              '<div class="igp-cards-icon">💳</div>' +
              '<div class="igp-cards-text">Gestión de métodos de pago</div>' +
              '<div class="igp-cards-sub">Podrás guardar tus tarjetas y medios de pago para agilizar tus compras.</div>' +
            '</div>' +
          '</div>' +
          '<div class="igp-pane" id="igpPaneCotizaciones">' +
            '<div class="igp-loading" id="igpQuotLoading">Cargando cotizaciones...</div>' +
            '<div class="igp-quot-list" id="igpQuotList" style="display:none;"></div>' +
            '<div class="igp-empty" id="igpQuotEmpty" style="display:none;">' +
              '<div class="igp-empty-icon">📋</div>' +
              '<div class="igp-empty-text">Sin cotizaciones aún</div>' +
              '<div class="igp-empty-sub">Tus cotizaciones enviadas aparecerán aquí.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
        '<div class="igp-footer">' +
          '<button class="igp-logout-btn" id="igpLogoutBtn">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>' +
            'Cerrar sesión' +
          '</button>' +
        '</div>' +
      '</div>';
    while (wrapper.firstChild) document.body.appendChild(wrapper.firstChild);
  }

  function openProfile() {
    buildProfilePanel();
    _quotLoaded = false;

    if (currentUser) {
      var nombre   = (currentUser.nombre   || '').trim();
      var apellido = (currentUser.apellido || '').trim();
      var initials = nombre && apellido ? (nombre[0] + apellido[0]).toUpperCase()
                   : nombre ? nombre.slice(0, 2).toUpperCase()
                   : currentUser.email.slice(0, 2).toUpperCase();
      var displayName = nombre ? (nombre + (apellido ? ' ' + apellido : '')) : currentUser.email.split('@')[0];

      var avEl   = document.getElementById('igpAvatar');
      var nmEl   = document.getElementById('igpUserName');
      var emEl   = document.getElementById('igpUserEmail');
      if (avEl) avEl.textContent = initials;
      if (nmEl) nmEl.textContent = displayName;
      if (emEl) emEl.textContent = currentUser.email;

      var map = { igpNombre: 'nombre', igpApellido: 'apellido', igpRut: 'rut', igpPhone: 'phone', igpEmail: 'email', igpCargo: 'cargo', igpEmpresa: 'razon_social', igpGiro: 'giro', igpDireccion: 'direccion', igpRegion: 'region', igpCiudad: 'ciudad' };
      Object.keys(map).forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.value = currentUser[map[id]] || '';
      });
    }

    document.getElementById('igpOverlay').classList.add('open');
    document.getElementById('igpPanel').classList.add('open');
    document.body.style.overflow = 'hidden';
    switchProfileTab('datos');
    _attachProfileEvents();
  }

  function closeProfile() {
    var overlay = document.getElementById('igpOverlay');
    var panel   = document.getElementById('igpPanel');
    if (!overlay || !panel) return;
    overlay.classList.remove('open');
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  function switchProfileTab(pane) {
    document.querySelectorAll('.igp-tab').forEach(function(t) {
      t.classList.toggle('active', t.dataset.pane === pane);
    });
    var capPane = pane.charAt(0).toUpperCase() + pane.slice(1);
    document.querySelectorAll('.igp-pane').forEach(function(p) {
      p.classList.toggle('active', p.id === 'igpPane' + capPane);
    });
    if (pane === 'cotizaciones') loadCotizaciones();
  }

  function _attachProfileEvents() {
    if (_profileEventsAttached) return;
    _profileEventsAttached = true;

    document.getElementById('igpClose').addEventListener('click', closeProfile);
    document.getElementById('igpOverlay').addEventListener('click', closeProfile);

    document.querySelectorAll('.igp-tab').forEach(function(tab) {
      tab.addEventListener('click', function() { switchProfileTab(tab.dataset.pane); });
    });

    document.getElementById('igpLogoutBtn').addEventListener('click', function() {
      closeProfile();
      logout();
    });

    var rutInput = document.getElementById('igpRut');
    if (rutInput) rutInput.addEventListener('input', function() { rutInput.value = formatRut(rutInput.value); });

    document.getElementById('igpFormDatos').addEventListener('submit', function(e) {
      e.preventDefault();
      saveProfileData();
    });
  }

  function saveProfileData() {
    var btn     = document.getElementById('igpSaveBtn');
    var saveMsg = document.getElementById('igpSaveMsg');
    btn.disabled = true;
    btn.style.opacity = '0.7';
    saveMsg.className = 'igp-save-msg';

    var fields = {
      nombre:       (document.getElementById('igpNombre')    || {}).value || '',
      apellido:     (document.getElementById('igpApellido')  || {}).value || '',
      rut:          (document.getElementById('igpRut')       || {}).value || '',
      phone:        (document.getElementById('igpPhone')     || {}).value || '',
      cargo:        (document.getElementById('igpCargo')     || {}).value || '',
      razon_social: (document.getElementById('igpEmpresa')   || {}).value || '',
      giro:         (document.getElementById('igpGiro')      || {}).value || '',
      direccion:    (document.getElementById('igpDireccion') || {}).value || '',
      region:       (document.getElementById('igpRegion')    || {}).value || '',
      ciudad:       (document.getElementById('igpCiudad')    || {}).value || ''
    };

    if (currentUser) {
      Object.assign(currentUser, fields);
      igSaveProfileCache(currentUser);
      updateNavbar();
    }

    function _done(ok, msg) {
      btn.disabled = false;
      btn.style.opacity = '';
      saveMsg.textContent = msg;
      saveMsg.className = 'igp-save-msg ' + (ok ? 'ok' : 'err');
      setTimeout(function() { saveMsg.className = 'igp-save-msg'; }, 3500);
    }

    if (!window.supabase) { _done(true, 'Cambios guardados localmente.'); return; }

    window.supabase.auth.getSession().then(function(res) {
      var session = res.data && res.data.session;
      if (!session) { _done(false, 'No hay sesión activa.'); return; }

      var profileUpdate = { rut: fields.rut, phone: fields.phone, razon_social: fields.razon_social, cargo: fields.cargo, direccion: fields.direccion, region: fields.region, ciudad: fields.ciudad };

      Promise.all([
        window.supabase.from('profiles').update(profileUpdate).eq('id', session.user.id),
        window.supabase.auth.updateUser({ data: { nombre: fields.nombre, apellido: fields.apellido, giro: fields.giro } })
      ]).then(function(results) {
        var err = (results[0] && results[0].error) || (results[1] && results[1].error);
        err ? _done(false, 'Error al guardar. Intenta de nuevo.') : _done(true, 'Cambios guardados correctamente.');
      }).catch(function() { _done(false, 'Error de conexión.'); });
    });
  }

  function loadCotizaciones() {
    if (_quotLoaded) return;

    var loading = document.getElementById('igpQuotLoading');
    var list    = document.getElementById('igpQuotList');
    var empty   = document.getElementById('igpQuotEmpty');
    if (!loading || !list || !empty) return;

    if (!window.supabase || !currentUser) {
      loading.style.display = 'none';
      empty.style.display = '';
      return;
    }

    window.supabase.from('cotizaciones')
      .select('id, empresa, total_general, total_productos, total_servicios, created_at')
      .eq('email', currentUser.email)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(function(res) {
        loading.style.display = 'none';
        if (res.error || !res.data || res.data.length === 0) {
          empty.style.display = '';
          return;
        }
        _quotLoaded = true;
        list.style.display = '';
        list.innerHTML = res.data.map(function(q) {
          var fecha   = q.created_at ? new Date(q.created_at).toLocaleDateString('es-CL', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
          var total   = q.total_general != null ? '$ ' + Number(q.total_general).toLocaleString('es-CL') : '—';
          var empresa = q.empresa || '—';
          var detalle = [];
          if (q.total_productos) detalle.push('Productos: $ ' + Number(q.total_productos).toLocaleString('es-CL'));
          if (q.total_servicios) detalle.push('Servicios: $ ' + Number(q.total_servicios).toLocaleString('es-CL'));
          return '<div class="igp-quot-card">' +
            '<div class="igp-quot-top">' +
              '<div class="igp-quot-empresa">' + empresa + '</div>' +
              '<div class="igp-quot-total">' + total + '</div>' +
            '</div>' +
            '<div class="igp-quot-meta">' + fecha + '</div>' +
            (detalle.length ? '<div class="igp-quot-products">' + detalle.join(' · ') + '</div>' : '') +
          '</div>';
        }).join('');
      }).catch(function() {
        loading.style.display = 'none';
        empty.style.display = '';
      });
  }

  /* ════════════════════════════════════════════
     API GLOBAL — expuesta inmediatamente
  ════════════════════════════════════════════ */
  window.igbAuth = {
    open:               openAuth,
    close:              closeAuth,
    logout:             logout,
    openProfile:        openProfile,
    closeProfile:       closeProfile,
    toggleAcctDropdown: toggleAcctDropdown,
    current: function() { return currentUser; },
    getProfileCache: function() {
      try { return JSON.parse(localStorage.getItem('ig_profile') || 'null'); } catch(e) { return null; }
    }
  };

  /* ── Guard cotizador global — disponible en todas las páginas ──
     Uso en cualquier HTML: onclick="return igbCotizar(event)"
     No requiere lógica adicional en cada página.              ── */
  window.igbCotizar = function(e) {
    var p=null;try{p=JSON.parse(localStorage.getItem('ig_profile')||'null');}catch(_){}
    if(currentUser||(p&&p.email)) return true; // sesión activa → navegar normal
    if(e) e.preventDefault();
    openAuth('login', '/configurador.html');
    return false;
  };

  /* Click global en .igb-account — fallback sin inline onclick */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.igb-account');
    if (!btn) return;
    e.preventDefault();
    if (btn.dataset.igbState === 'logged') {
      toggleAcctDropdown(btn);
    } else {
      openAuth('login');
    }
  });

  /* ════════════════════════════════════════════
     ARRANQUE
  ════════════════════════════════════════════ */
  function start() {
    buildModal();
    attachModalEvents();
    if (window.supabase) {
      initSession();
    } else {
      window.addEventListener('supabase:ready', initSession, { once: true });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

})();