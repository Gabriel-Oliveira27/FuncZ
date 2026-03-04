/* ===== AUTH LOGIN - Sistema de Autenticação ===== */

document.addEventListener('DOMContentLoaded', () => {
  /* ===== ELEMENTOS DOM ===== */
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const inputUser = document.getElementById('loginUser');
  const inputPass = document.getElementById('loginPass');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  
  const modalCEP = document.getElementById('modalCEP');
  const cepInput = document.getElementById('cepInput');
  const cepConfirm = document.getElementById('cepConfirm');
  
  const modalVoucher = document.getElementById('modalVoucher');
  const progressBar = modalVoucher.querySelector('.progress-bar');
  const progressText = modalVoucher.querySelector('.progress-text');
  
  const overlayAuth = document.getElementById('overlayAuth');
  const toastContainer = document.getElementById('toastContainer');

  /* ===== VARIÁVEIS DE CONTROLE ===== */
  let currentUser = '';
  let currentPass = '';
  let localTentativa = null;
  let isVisitante = false;

  /* ===== VERIFICAÇÃO DE SESSÃO EXISTENTE ===== */
  const sessionData = (window.SessionGuard && window.SessionGuard.getSessionData)
    ? window.SessionGuard.getSessionData()
    : (JSON.parse(localStorage.getItem('authSession') || 'null'));

  if (sessionData && (window.SessionGuard ? window.SessionGuard.checkSession() : (function(){ 
        // fallback simples
        const now = Date.now();
        const start = sessionData.start || now;
        const dur = sessionData.duration || (60*60*1000);
        return (typeof dur === 'number' && isFinite(dur)) ? (now < (start + dur)) : true;
      })()
    )) {
    // já logado
    window.location.href = 'pages/selectsetor.html';
    return;
  }

  /* ===== FUNÇÃO: MOSTRAR ERRO ===== */
  function mostrarErro(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.add('show');
    
    setTimeout(() => {
      errorAlert.classList.remove('show');
    }, 5000);
  }

  /* ===== FUNÇÃO: TOAST NOTIFICATION ===== */
  function showToast(message, type = 'error', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    
    const titles = {
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Atenção'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-progress"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.4s ease reverse';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  /* ===== FUNÇÃO: POPUP "ESQUECI MINHA SENHA" (global) ===== */
  window.showForgotPassword = function() {
    if (document.getElementById('_mainForgotPopup')) return;

    const popup = document.createElement('div');
    popup.id = '_mainForgotPopup';
    popup.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: fpFadeIn 0.2s ease;
    `;

    popup.innerHTML = `
      <style>
        @keyframes fpFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes fpCardIn {
          from { opacity:0; transform: scale(0.9) translateY(14px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        #_mainForgotCard { animation: fpCardIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }
        .mfp-contact {
          display: flex; align-items: center; gap: 14px;
          padding: 13px 15px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 10px;
          transition: border-color 0.2s;
        }
        .mfp-contact:hover { border-color: #93c5fd; }
        .mfp-icon-wrap {
          width: 38px; height: 38px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        .mfp-icon-wrap svg { width: 19px; height: 19px; }
        .mfp-label { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px; }
        .mfp-value { font-size: 16px; font-weight: 700; color: #1e293b; }
        .mfp-close {
          width: 100%; padding: 13px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, #003da5 0%, #3b82f6 100%);
          color: white; font-weight: 600; font-size: 15px;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(0,61,165,0.25);
          margin-top: 8px; font-family: inherit;
        }
        .mfp-close:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,61,165,0.35); }
      </style>
      <div id="_mainForgotCard" style="
        background: #fff; border-radius: 20px; padding: 36px 32px;
        max-width: 360px; width: 100%;
        box-shadow: 0 25px 60px rgba(0,0,0,0.18);
        text-align: center;
      ">
        <div style="width:58px;height:58px;margin:0 auto 18px;padding:14px;background:#dbeafe;border-radius:50%;color:#003da5;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3 style="font-size:19px;font-weight:700;color:#003da5;margin-bottom:8px;">Como trocar de senha?</h3>
        <p style="font-size:13px;color:#64748b;margin-bottom:22px;line-height:1.6;">
          Entre em contato com o desenvolvedor pelos canais abaixo:
        </p>
        <div class="mfp-contact">
          <div class="mfp-icon-wrap" style="background:#dbeafe;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#003da5" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div style="text-align:left;">
            <div class="mfp-label">Ramal Interno</div>
            <div class="mfp-value">302</div>
          </div>
        </div>
        <div class="mfp-contact">
          <div class="mfp-icon-wrap" style="background:#dcfce7;">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
          </div>
          <div style="text-align:left;">
            <div class="mfp-label">WhatsApp</div>
            <div class="mfp-value">(88) 98856-8911</div>
          </div>
        </div>
        <button class="mfp-close" onclick="document.getElementById('_mainForgotPopup').remove()">Entendido</button>
      </div>
    `;

    document.body.appendChild(popup);
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  };

  /* ===== FUNÇÃO: POPUP "PROBLEMAS AO EFETUAR LOGIN" (global) ===== */
  window.showLoginHelp = function() {
    if (document.getElementById('_loginHelpPopup')) return;

    const popup = document.createElement('div');
    popup.id = '_loginHelpPopup';
    popup.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.55);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 9999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: lhFadeIn 0.2s ease;
    `;

    popup.innerHTML = `
      <style>
        @keyframes lhFadeIn { from{opacity:0} to{opacity:1} }
        @keyframes lhCardIn {
          from { opacity:0; transform: scale(0.9) translateY(16px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        #_loginHelpCard { animation: lhCardIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }
        .lh-step {
          display: flex; gap: 14px; align-items: flex-start;
          padding: 14px 16px;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          margin-bottom: 10px;
          text-align: left;
          transition: border-color 0.2s;
        }
        .lh-step:hover { border-color: #bfdbfe; }
        .lh-step-num {
          width: 28px; height: 28px; flex-shrink: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, #003da5 0%, #3b82f6 100%);
          color: white;
          font-size: 13px; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          margin-top: 1px;
        }
        .lh-step-body {}
        .lh-step-title {
          font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 3px;
        }
        .lh-step-desc {
          font-size: 12px; color: #64748b; line-height: 1.55;
        }
        .lh-step-tag {
          display: inline-block;
          margin-top: 5px; padding: 2px 8px;
          background: #dbeafe; color: #1d4ed8;
          border-radius: 5px; font-size: 11px; font-weight: 600;
        }
        .lh-divider {
          border: none; border-top: 1px solid #e2e8f0; margin: 14px 0;
        }
        .lh-contact-row {
          display: flex; gap: 8px; margin-top: 4px;
        }
        .lh-contact-btn {
          flex: 1; display: flex; align-items: center; gap: 8px;
          padding: 10px 12px;
          background: #f1f5f9;
          border: 1.5px solid #e2e8f0;
          border-radius: 10px; cursor: pointer;
          transition: all 0.2s; font-family: inherit;
          text-align: left;
        }
        .lh-contact-btn:hover { background: #dbeafe; border-color: #93c5fd; }
        .lh-contact-btn svg { width: 16px; height: 16px; flex-shrink: 0; }
        .lh-contact-label { font-size: 10px; font-weight: 700; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.4px; }
        .lh-contact-val { font-size: 13px; font-weight: 700; color: #1e293b; }
        .lh-close {
          width: 100%; padding: 13px; border: none; border-radius: 12px;
          background: linear-gradient(135deg, #003da5 0%, #3b82f6 100%);
          color: white; font-weight: 600; font-size: 15px;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 16px rgba(0,61,165,0.25);
          margin-top: 14px; font-family: inherit;
        }
        .lh-close:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,61,165,0.35); }
        .lh-geo-tip {
          display: flex; align-items: flex-start; gap: 10px;
          padding: 10px 12px;
          background: #fef9c3; border: 1.5px solid #fde047;
          border-radius: 10px; margin-top: 6px;
        }
        .lh-geo-tip svg { width: 16px; height: 16px; flex-shrink: 0; color: #a16207; margin-top: 1px; }
        .lh-geo-tip span { font-size: 12px; color: #713f12; line-height: 1.5; }
      </style>
      <div id="_loginHelpCard" style="
        background: #fff; border-radius: 20px;
        max-width: 420px; width: 100%;
        box-shadow: 0 25px 60px rgba(0,0,0,0.18);
        overflow: hidden;
      "><div style="overflow-y: auto; max-height: 88vh; padding: 32px 28px; box-sizing: border-box;">
        <div style="text-align:center;margin-bottom:22px;">
          <div style="width:54px;height:54px;margin:0 auto 14px;padding:13px;background:#dbeafe;border-radius:50%;color:#003da5;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%">
              <circle cx="12" cy="12" r="10"></circle>
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
          </div>
          <h3 style="font-size:18px;font-weight:700;color:#003da5;margin-bottom:6px;">Como fazer login?</h3>
          <p style="font-size:13px;color:#64748b;line-height:1.5;">Siga os passos abaixo para acessar o sistema</p>
        </div>

        <div class="lh-step">
          <div class="lh-step-num">1</div>
          <div class="lh-step-body">
            <div class="lh-step-title">Usuário e Senha</div>
            <div class="lh-step-desc">
              No campo <strong>Usuário</strong>, digite o login fornecido pelo administrador (ex: <em>joaosilva</em>).<br>
              No campo <strong>Senha</strong>, digite sua senha pessoal com atenção às letras maiúsculas e minúsculas.
            </div>
            <span class="lh-step-tag">Exemplo: usuario / senha123</span>
          </div>
        </div>

        <div class="lh-step">
          <div class="lh-step-num">2</div>
          <div class="lh-step-body">
            <div class="lh-step-title">Autorização de Localização</div>
            <div class="lh-step-desc">
              Ao clicar em <strong>Entrar</strong>, o navegador vai pedir permissão para acessar sua localização. 
              Clique em <strong>"Permitir"</strong> no aviso que aparece no topo da janela do navegador.
            </div>
            <div class="lh-geo-tip">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              <span>O aviso do navegador aparece no <strong>canto superior esquerdo</strong> da tela, próximo à barra de endereço. Procure um ícone de cadeado 🔒 ou um popup pedindo permissão.</span>
            </div>
          </div>
        </div>

        <div class="lh-step">
          <div class="lh-step-num">3</div>
          <div class="lh-step-body">
            <div class="lh-step-title">Se pedir o CEP</div>
            <div class="lh-step-desc">
              Caso a localização automática não funcione, o sistema pedirá seu <strong>CEP</strong>. 
              Informe um CEP válido da <strong>sua cidade</strong> no formato <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">00000-000</code>.
            </div>
            <span class="lh-step-tag">Dica: use o CEP da sua rua ou de um local conhecido da cidade</span>
          </div>
        </div>

        <hr class="lh-divider">

        <p style="font-size:12px;font-weight:700;color:#94a3b8;text-align:center;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.5px;">Precisa de ajuda?</p>
        <div class="lh-contact-row">
          <div class="lh-contact-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="#003da5" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            <div>
              <div class="lh-contact-label">Ramal</div>
              <div class="lh-contact-val">302</div>
            </div>
          </div>
          <div class="lh-contact-btn">
            <svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <div>
              <div class="lh-contact-label">WhatsApp</div>
              <div class="lh-contact-val">(88) 98856-8911</div>
            </div>
          </div>
        </div>
        <button class="lh-close" onclick="document.getElementById('_loginHelpPopup').remove()">Fechar</button>
      </div></div>
    `;

    document.body.appendChild(popup);
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  };

  /* ===== FUNÇÃO: INDICADOR DE PERMISSÃO DE LOCALIZAÇÃO ===== */
  function mostrarIndicadorLocalizacao() {
    return new Promise(resolve => {
      const banner = document.createElement('div');
      banner.id = '_locIndicator';
      banner.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 99998;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 12px 16px;
        pointer-events: none;
        animation: locBannerIn 0.4s ease forwards;
      `;

      banner.innerHTML = `
        <style>
          @keyframes locBannerIn {
            from { opacity: 0; transform: translateY(-20px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          @keyframes locBannerOut {
            from { opacity: 1; transform: translateY(0); }
            to   { opacity: 0; transform: translateY(-20px); }
          }
          @keyframes locArrowBounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          @keyframes locPulseRing {
            0% { transform: scale(1); opacity: 1; }
            100% { transform: scale(2.2); opacity: 0; }
          }
          #_locInner {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 18px;
            background: linear-gradient(135deg, #1e3a8a 0%, #1d4ed8 100%);
            border-radius: 14px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.1);
            max-width: 360px;
          }
          #_locArrowWrap {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 4px;
            flex-shrink: 0;
          }
          #_locArrow {
            animation: locArrowBounce 0.9s ease infinite;
          }
          #_locPulse {
            position: relative;
            width: 12px; height: 12px;
          }
          #_locPulseDot {
            position: absolute; inset: 0;
            background: #60a5fa;
            border-radius: 50%;
          }
          #_locPulseRing {
            position: absolute; inset: 0;
            background: #60a5fa;
            border-radius: 50%;
            animation: locPulseRing 1.2s ease infinite;
          }
          #_locText { line-height: 1.45; }
          #_locTitle { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; }
          #_locSub { font-size: 12px; color: #93c5fd; }
        </style>
        <div id="_locInner">
          <div id="_locArrowWrap">
            <div id="_locArrow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
            </div>
            <div id="_locPulse">
              <div id="_locPulseRing"></div>
              <div id="_locPulseDot"></div>
            </div>
          </div>
          <div id="_locText">
            <div id="_locTitle">Autorize sua localização ↑</div>
            <div id="_locSub">Clique em <strong style="color:#fff">"Permitir"</strong> no aviso acima, próximo à barra de endereço</div>
          </div>
        </div>
      `;

      document.body.appendChild(banner);

      // Remover após 5 segundos e resolver a promise
      setTimeout(() => {
        banner.style.animation = 'locBannerOut 0.4s ease forwards';
        setTimeout(() => {
          banner.remove();
          resolve();
        }, 400);
      }, 5000);
    });
  }

  function removerIndicadorLocalizacao() {
    const b = document.getElementById('_locIndicator');
    if (!b) return;
    b.style.animation = 'locBannerOut 0.4s ease forwards';
    setTimeout(() => b.remove(), 400);
  }

  /* ===== FUNÇÃO: INDICADOR DE LOCALIZAÇÃO BLOQUEADA ===== */
  function mostrarIndicadorPermissaoNegada() {
    return new Promise(resolve => {
      const existing = document.getElementById('_locDeniedBanner');
      if (existing) existing.remove();

      const banner = document.createElement('div');
      banner.id = '_locDeniedBanner';
      banner.style.cssText = `
        position: fixed;
        top: 0; left: 0; right: 0;
        z-index: 99998;
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        padding: 12px 16px;
        pointer-events: none;
      `;

      banner.innerHTML = `
        <style>
          @keyframes locDeniedIn  { from{opacity:0;transform:translateY(-20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes locDeniedOut { from{opacity:1;transform:translateY(0)} to{opacity:0;transform:translateY(-20px)} }
          @keyframes locDeniedShake {
            0%,100%{transform:translateX(0)}
            15%{transform:translateX(-5px)}
            35%{transform:translateX(5px)}
            55%{transform:translateX(-3px)}
            75%{transform:translateX(3px)}
          }
          @keyframes locDeniedPulse {
            0%,100%{box-shadow:0 8px 32px rgba(185,28,28,0.45),0 0 0 1px rgba(255,255,255,0.08)}
            50%{box-shadow:0 8px 44px rgba(220,38,38,0.7),0 0 0 2px rgba(255,120,120,0.2)}
          }
          #_locDeniedInner {
            display: flex; align-items: center; gap: 12px;
            padding: 12px 18px;
            background: linear-gradient(135deg, #7f1d1d 0%, #b91c1c 100%);
            border-radius: 14px;
            max-width: 420px;
            animation: locDeniedIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards,
                       locDeniedPulse 2s ease 0.6s infinite;
          }
          #_locDeniedIconWrap {
            width: 36px; height: 36px;
            background: rgba(0,0,0,0.22);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center; flex-shrink: 0;
            animation: locDeniedShake 0.45s ease 0.5s;
          }
          #_locDeniedIconWrap svg { width: 18px; height: 18px; }
          #_locDeniedText { line-height: 1.45; }
          #_locDeniedTitle { font-size: 13px; font-weight: 700; color: #fff; margin-bottom: 2px; }
          #_locDeniedSub   { font-size: 12px; color: #fca5a5; }
        </style>
        <div id="_locDeniedInner">
          <div id="_locDeniedIconWrap">
            <svg viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="2.5">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          </div>
          <div id="_locDeniedText">
            <div id="_locDeniedTitle">Localização bloqueada pelo navegador 🔒</div>
            <div id="_locDeniedSub">Clique no <strong style="color:#fff">cadeado 🔒</strong> na barra de endereço para permitir e tente novamente — ou informe seu CEP abaixo</div>
          </div>
        </div>
      `;

      document.body.appendChild(banner);

      setTimeout(() => {
        banner.style.animation = 'locDeniedOut 0.4s ease forwards';
        setTimeout(() => { banner.remove(); resolve(); }, 400);
      }, 3500);
    });
  }

  /* ===== FUNÇÃO: PEGAR CIDADE VIA GEOLOCALIZAÇÃO ===== */
  async function pegarCidade(lat, lng) {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await resp.json();
      return (data.address.city || data.address.town || data.address.village || '').toLowerCase();
    } catch (error) {
      console.error('Erro ao pegar cidade:', error);
      return null;
    }
  }

  /* ===== FUNÇÃO: PROCESSAR LOGIN ===== */
  async function processarLogin() {
    if (!currentUser || !currentPass) {
      mostrarErro('Usuário ou senha não preenchidos');
      showToast('Preencha todos os campos', 'warning');
      return;
    }

    // Verificar tentativas
    let attemptsData = JSON.parse(
      localStorage.getItem(`loginAttempts_${currentUser}`) || '{"count":0,"timeout":0}'
    );
    const now = Date.now();
    
    if (attemptsData.timeout && now < attemptsData.timeout) {
      const remaining = Math.ceil((attemptsData.timeout - now) / 1000);
      mostrarErro(`Muitas tentativas. Aguarde ${remaining} segundos.`);
      showToast(`Login bloqueado por ${remaining}s`, 'error');
      return;
    }

    const actionType = isVisitante ? 'voucher' : 'login';

    try {
      if (!isVisitante) {
        overlayAuth.classList.add('show');
      }

      const response = await fetch('https://proxy-apps-script.gab-oliveirab27.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          user: currentUser,
          pass: currentPass,
          local: localTentativa
        })
      });

      const result = await response.json();

      if (result.status === 'autorizado' || (result.ok && isVisitante)) {
        // Limpa tentativas
        localStorage.removeItem(`loginAttempts_${currentUser}`);

        // Cria sessão com permissão
         const serverStart = (typeof result.start === 'number' && isFinite(result.start)) ? result.start : Date.now();
        const serverDuration = (typeof result.duration === 'number') ? result.duration : undefined;

        const authSession = {
          user: result.user || currentUser,
          perm: (result.perm || (isVisitante ? 'voucher' : 'vendas')).toLowerCase(),
          fullName: result["Nome completo"] || result.nome || "",
          local: result.Local || result.local || localTentativa || "",
          cpf: result.CPF || result.cpf || "",
          filial: result.Filial || result.filial || "",
          start: serverStart,
          duration: (typeof serverDuration === 'number') ? serverDuration : (
            // fallback por perm caso GAS não retorne duration
            (function(perm){
              if (!perm) return 60*60*1000;
              perm = String(perm).toLowerCase();
              if (perm === 'voucher' || perm === 'visitante') return 5*60*1000;
              if (perm === 'crediario') return 4*60*60*1000;
              if (perm === 'vendas') return 3*60*60*1000;
              if (perm === 'faturamento') return 6*60*60*1000;
              if (['gerente','admin','suporte'].includes(perm)) return Infinity;
              return 60*60*1000;
            })( (result.perm || (isVisitante ? 'voucher' : 'vendas')).toLowerCase() )
          ),
          isVoucher: !!isVisitante || !!result.isVoucher || ((result.perm || '').toLowerCase() === 'voucher'),
          tipo: isVisitante ? 'voucher' : 'normal',
          lastActivity: Date.now()
        };

        // grava sem senha
        localStorage.setItem('authSession', JSON.stringify(authSession));

        if (isVisitante) {
          overlayAuth.classList.remove('show');
          modalVoucher.classList.add('show');
          
          // Animação de progresso
          let progress = 20;
          const circumference = 2 * Math.PI * 54;
          
          const interval = setInterval(() => {
            progress += Math.random() * 8;
            if (progress > 100) progress = 100;
            
            const offset = circumference * (1 - progress / 100);
            progressBar.style.strokeDashoffset = offset;
            progressText.textContent = `${Math.floor(progress)}%`;
            
            if (progress >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                modalVoucher.classList.remove('show');
                window.location.href = 'pages/selectsetor.html';
              }, 500);
            }
          }, 200);

        } else {
          setTimeout(() => {
            overlayAuth.classList.remove('show');
            showToast('Login realizado com sucesso!', 'success', 2000);
            setTimeout(() => {
              window.location.href = 'pages/selectsetor.html';
            }, 1000);
          }, 800);
        }

      } else {
        overlayAuth.classList.remove('show');
        
        // Incrementa tentativas
        attemptsData.count = (attemptsData.count || 0) + 1;
        if (attemptsData.count >= 5) {
          attemptsData.timeout = now + 30000; // 30 segundos
        }
        localStorage.setItem(`loginAttempts_${currentUser}`, JSON.stringify(attemptsData));

        // Mensagens de erro
        if (result.motivo === 'localincorreto' || result.motivo === 'local-nao-permitido') {
          mostrarErro('Localização não permitida para este usuário');
          showToast('Acesso negado: localização não autorizada', 'error');
        } else if (result.motivo === 'senhaincorreta') {
          mostrarErro('Senha incorreta');
          showToast('Senha inválida. Tente novamente.', 'error');
        } else {
          mostrarErro(result.error || 'Credenciais inválidas');
          showToast('Não foi possível autenticar', 'error');
        }

        if (attemptsData.count >= 5) {
          showToast('5 tentativas excedidas. Aguarde 30 segundos.', 'warning', 5000);
        }
      }

    } catch (error) {
      overlayAuth.classList.remove('show');
      console.error('Erro na requisição:', error);
      mostrarErro('Falha na conexão com o servidor');
      showToast('Erro de rede. Verifique sua conexão.', 'error');
    } finally {
      loginBtn.classList.remove('loading');
    }
  }

  /* ===== FUNÇÃO: VALIDAR GEOLOCALIZAÇÃO ===== */
  async function validarGeolocalizacao() {
    try {
      if (!navigator.geolocation) {
        throw { code: 4, message: 'Navegador não suporta geolocalização' };
      }

      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          enableHighAccuracy: true
        });
      });

      const cidade = await pegarCidade(pos.coords.latitude, pos.coords.longitude);
      if (!cidade) {
        throw { code: 3, message: 'Não foi possível detectar a cidade' };
      }

      localTentativa = cidade;
      return true;

    } catch (error) {
      let msg = 'Não foi possível validar sua localização.';
      
      if (error.code === 1) {
        msg = 'Permissão de localização negada. Por favor, informe seu CEP.';
      } else if (error.code === 2) {
        msg = 'Localização indisponível. Por favor, informe seu CEP.';
      } else if (error.code === 3) {
        msg = 'Tempo esgotado ao obter localização. Por favor, informe seu CEP.';
      }

      mostrarErro(msg);
      showToast('Não foi possível obter sua localização', 'warning');
      return false;
    }
  }

  /* ===== FUNÇÃO: CONFIRMAR CEP ===== */
  async function confirmarCEP() {
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      showToast('CEP inválido. Digite 8 números.', 'warning');
      cepInput.focus();
      return;
    }

    try {
      cepConfirm.disabled = true;
      cepConfirm.style.opacity = '0.6';
      
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      localTentativa = data.localidade.toLowerCase();
      modalCEP.classList.remove('show');
      showToast(`Cidade detectada: ${data.localidade}`, 'success');
      
      setTimeout(() => processarLogin(), 500);

    } catch (error) {
      showToast(error.message || 'CEP inválido', 'error');
    } finally {
      cepConfirm.disabled = false;
      cepConfirm.style.opacity = '1';
    }
  }

  /* ===== FUNÇÃO: LOGIN PRINCIPAL ===== */
  async function login(e) {
    e.preventDefault();

    currentUser = inputUser.value.trim().toLowerCase();
    currentPass = inputPass.value.trim();

    if (!currentUser || !currentPass) {
      mostrarErro('Preencha usuário e senha');
      showToast('Todos os campos são obrigatórios', 'warning');
      return;
    }

    // Verificar tentativas antes de prosseguir
    let attemptsData = JSON.parse(
      localStorage.getItem(`loginAttempts_${currentUser}`) || '{"count":0,"timeout":0}'
    );
    const now = Date.now();
    
    if (attemptsData.timeout && now < attemptsData.timeout) {
      const remaining = Math.ceil((attemptsData.timeout - now) / 1000);
      showToast(`Login bloqueado por ${remaining}s`, 'error');
      return;
    }

    loginBtn.classList.add('loading');
    isVisitante = currentUser === 'visitante';

    // Mostrar indicador de localização antes de pedir geo
    mostrarIndicadorLocalizacao();

    // Validar geolocalização (simultâneo ao indicador)
    const geoOk = await validarGeolocalizacao();

    // Remover indicador assim que geo responder
    removerIndicadorLocalizacao();
    
    if (!geoOk && !isVisitante) {
      loginBtn.classList.remove('loading');
      // Mostrar indicador de localização bloqueada, depois abrir CEP automaticamente
      await mostrarIndicadorPermissaoNegada();
      modalCEP.classList.add('show');
      cepInput.focus();
      return;
    }

    // Se visitante e não conseguiu geo, tenta pegar CEP
    if (isVisitante && !localTentativa) {
      loginBtn.classList.remove('loading');
      await mostrarIndicadorPermissaoNegada();
      modalCEP.classList.add('show');
      cepInput.focus();
      return;
    }

    // Processa login
    await processarLogin();
  }

  /* ===== MÁSCARA DE CEP ===== */
  cepInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5, 8);
    }
    e.target.value = value;
  });

  /* ===== EVENT LISTENERS ===== */
  loginForm.addEventListener('submit', login);
  cepConfirm.addEventListener('click', confirmarCEP);
  
  cepInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmarCEP();
    }
  });

  // Fechar modal CEP ao clicar fora
  modalCEP.addEventListener('click', (e) => {
    if (e.target === modalCEP) {
      modalCEP.classList.remove('show');
      loginBtn.classList.remove('loading');
    }
  });
});