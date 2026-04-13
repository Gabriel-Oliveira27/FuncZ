/* ===== AUTH LOGIN - Sistema de Autenticação ===== */

document.addEventListener('DOMContentLoaded', () => {

  /* ===== ELEMENTOS DOM ===== */
  const loginForm     = document.getElementById('loginForm');
  const loginBtn      = document.getElementById('loginBtn');
  const inputUser     = document.getElementById('loginUser');
  const inputPass     = document.getElementById('loginPass');
  const errorAlert    = document.getElementById('errorAlert');
  const errorMessage  = document.getElementById('errorMessage');

  const modalCEP   = document.getElementById('modalCEP');
  const cepInput   = document.getElementById('cepInput');
  const cepConfirm = document.getElementById('cepConfirm');

  const modalVoucher = document.getElementById('modalVoucher');
  const progressBar  = modalVoucher.querySelector('.progress-bar');
  const progressText = modalVoucher.querySelector('.progress-text');

  const overlayAuth    = document.getElementById('overlayAuth');
  const toastContainer = document.getElementById('toastContainer');

  /* ===== VARIÁVEIS DE CONTROLE ===== */
  let currentUser    = '';
  let currentPass    = '';
  let localTentativa = null;
  let isVisitante    = false;

  /* ===== CONFIGURAÇÃO DOS WORKERS =====
     1-4: Cloudflare Workers
     5:   Render Python (fallback final — replica o Worker em Python)
  ===================================== */
  const WORKERS = [
    'https://proxy-apps-script.gab-oliveirab27.workers.dev/',   // Cloudflare 1 (principal)
    'https://conexao-fallback-1.gab-oliveirab27.workers.dev',   // Cloudflare 2
    'https://conexao-fallback-2.gab-oliveirab27.workers.dev',   // Cloudflare 3
    'https://conexao-fallback-3.gab-oliveirab27.workers.dev',   // Cloudflare 4
    'https://pythonlogin-hj3g.onrender.com',                 // ← Render Python (5º fallback)
  ];

  // Timeout individual por worker (ms)
  const WORKER_TIMEOUTS = [10000, 12000, 15000, 15000, 20000];

  // Mensagens exibidas ao trocar de worker
  const WORKER_MSGS = [
    null, // Worker 1 não exibe mensagem de troca
    { title: 'Servidor ocupado...', sub: 'Redirecionando para um servidor alternativo. Aguarde!', icon: '⚡' },
    { title: 'Ainda estamos tentando!',  sub: 'Sentimos o transtorno — estamos com uma pequena instabilidade. Já já resolvemos!', icon: '🔄' },
    { title: 'Última tentativa...',      sub: 'Estamos na reserva final. Segura aí, quase lá!', icon: '🚀' },
    { title: 'Usando servidor reserva...', sub: 'Acionando o servidor de contingência. Pode demorar um pouco mais — aguarde!', icon: '🛡️' },
  ];

  /* ===== VERIFICAÇÃO DE SESSÃO EXISTENTE ===== */
  const sessionData = (window.SessionGuard && window.SessionGuard.getSessionData)
    ? window.SessionGuard.getSessionData()
    : JSON.parse(localStorage.getItem('authSession') || 'null');

  if (sessionData) {
    const sessaoValida = window.SessionGuard
      ? window.SessionGuard.checkSession()
      : (function () {
          const now   = Date.now();
          const start = sessionData.start || now;
          const dur   = sessionData.duration;
          if (dur === -1 || dur === null || dur === undefined) return true;
          return typeof dur === 'number' && isFinite(dur) && now < (start + dur);
        })();

    if (sessaoValida) {
      window.location.href = 'pages/selectsetor.html';
      return;
    } else {
      localStorage.removeItem('authSession');
    }
  }

  /* ===================================================
     OVERLAY DE PROGRESSO DOS WORKERS
     ================================================= */
  function criarOverlayWorker() {
    if (document.getElementById('_workerOverlay')) return;

    const el = document.createElement('div');
    el.id = '_workerOverlay';
    el.innerHTML = `
      <style>
        #_workerOverlay {
          position: fixed; inset: 0;
          background: rgba(0, 10, 30, 0.82);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          z-index: 9000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: _wovIn 0.3s ease forwards;
        }
        @keyframes _wovIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        #_workerCard {
          background: linear-gradient(145deg, #0d1b2e 0%, #0a1628 100%);
          border: 1px solid rgba(96,165,250,0.18);
          border-radius: 24px;
          padding: 40px 36px 36px;
          max-width: 400px;
          width: 100%;
          box-shadow:
            0 32px 80px rgba(0,0,0,0.6),
            0 0 0 1px rgba(255,255,255,0.04),
            inset 0 1px 0 rgba(255,255,255,0.06);
          text-align: center;
          animation: _wcardIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards;
        }
        @keyframes _wcardIn {
          from { opacity: 0; transform: scale(0.92) translateY(16px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }

        #_wIconWrap {
          width: 72px; height: 72px;
          margin: 0 auto 24px;
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          position: relative;
          background: rgba(59,130,246,0.1);
          transition: background 0.5s ease;
        }
        #_wIconWrap::before {
          content: '';
          position: absolute; inset: -3px;
          border-radius: 50%;
          border: 2px solid transparent;
          border-top-color: #3b82f6;
          animation: _wSpin 1s linear infinite;
        }
        #_wIconWrap::after {
          content: '';
          position: absolute; inset: -7px;
          border-radius: 50%;
          border: 1px solid rgba(96,165,250,0.2);
          border-top-color: rgba(96,165,250,0.5);
          animation: _wSpin 1.8s linear infinite reverse;
        }
        @keyframes _wSpin {
          to { transform: rotate(360deg); }
        }
        #_wIconEmoji {
          font-size: 26px;
          line-height: 1;
          transition: all 0.3s ease;
          animation: _wPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
        }
        @keyframes _wPop {
          from { transform: scale(0.5); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }

        #_wTitle {
          font-size: 18px;
          font-weight: 700;
          color: #f1f5f9;
          margin-bottom: 8px;
          min-height: 26px;
          transition: opacity 0.3s ease;
        }
        #_wSub {
          font-size: 13px;
          color: #64748b;
          line-height: 1.65;
          min-height: 42px;
          transition: opacity 0.3s ease;
          margin-bottom: 28px;
        }

        #_wBarWrap {
          background: rgba(255,255,255,0.05);
          border-radius: 99px;
          height: 4px;
          overflow: hidden;
          margin-bottom: 16px;
        }
        #_wBar {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #2563eb, #60a5fa, #2563eb);
          background-size: 200% 100%;
          animation: _wBarShimmer 1.5s linear infinite;
          transition: width 0.8s ease;
          width: 0%;
        }
        @keyframes _wBarShimmer {
          from { background-position: 200% center; }
          to   { background-position: -200% center; }
        }

        #_wServers {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
        }
        .wserver-dot {
          width: 8px; height: 8px;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          transition: all 0.4s ease;
          position: relative;
        }
        .wserver-dot.ativo {
          background: #3b82f6;
          box-shadow: 0 0 8px rgba(59,130,246,0.6);
          animation: _wDotPulse 1.2s ease infinite;
        }
        .wserver-dot.ok {
          background: #10b981;
          box-shadow: 0 0 6px rgba(16,185,129,0.4);
          animation: none;
        }
        .wserver-dot.falhou {
          background: #ef4444;
          animation: none;
        }
        /* Dot do Render (5º) tem formato diferente — diamante */
        .wserver-dot.render {
          border-radius: 3px;
          transform: rotate(45deg);
        }
        .wserver-dot.render.ativo {
          background: #f59e0b;
          box-shadow: 0 0 8px rgba(245,158,11,0.6);
        }
        @keyframes _wDotPulse {
          0%,100% { transform: scale(1);   opacity: 1; }
          50%      { transform: scale(1.4); opacity: 0.7; }
        }
        .wserver-dot.render.ativo {
          animation: _wDotPulseRender 1.2s ease infinite;
        }
        @keyframes _wDotPulseRender {
          0%,100% { transform: rotate(45deg) scale(1);   opacity: 1; }
          50%      { transform: rotate(45deg) scale(1.4); opacity: 0.7; }
        }

        #_wServerLabel {
          font-size: 11px;
          color: rgba(100,116,139,0.7);
          margin-top: 10px;
          letter-spacing: 0.3px;
        }

        #_wTimer {
          font-size: 11px;
          color: rgba(100,116,139,0.5);
          margin-top: 6px;
          font-variant-numeric: tabular-nums;
        }
      </style>

      <div id="_workerCard">
        <div id="_wIconWrap">
          <span id="_wIconEmoji">🔐</span>
        </div>

        <div id="_wTitle">Aguarde um instante...</div>
        <div id="_wSub">Estamos liberando seu acesso com segurança.</div>

        <div id="_wBarWrap">
          <div id="_wBar"></div>
        </div>

        <div id="_wServers">
          <div class="wserver-dot ativo" id="_wdot0" title="Cloudflare 1"></div>
          <div class="wserver-dot"       id="_wdot1" title="Cloudflare 2"></div>
          <div class="wserver-dot"       id="_wdot2" title="Cloudflare 3"></div>
          <div class="wserver-dot"       id="_wdot3" title="Cloudflare 4"></div>
          <div class="wserver-dot render" id="_wdot4" title="Render (reserva)"></div>
        </div>
        <div id="_wServerLabel">Servidor 1 de 5</div>
        <div id="_wTimer">0s</div>
      </div>
    `;

    document.body.appendChild(el);
  }

  function atualizarOverlayWorker(index, falhos = []) {
    const msg = WORKER_MSGS[index];
    const isRender = index === 4;

    const emojis   = ['🔐', '⚡', '🔄', '🚀', '🛡️'];
    const cores    = [
      'rgba(59,130,246,0.1)',
      'rgba(245,158,11,0.12)',
      'rgba(168,85,247,0.12)',
      'rgba(239,68,68,0.12)',
      'rgba(245,158,11,0.15)',   // Render — tom âmbar
    ];
    const barCores = [
      'linear-gradient(90deg,#2563eb,#60a5fa,#2563eb)',
      'linear-gradient(90deg,#d97706,#fbbf24,#d97706)',
      'linear-gradient(90deg,#7c3aed,#a78bfa,#7c3aed)',
      'linear-gradient(90deg,#dc2626,#f87171,#dc2626)',
      'linear-gradient(90deg,#b45309,#f59e0b,#b45309)',  // Render
    ];
    const spinCores = ['#3b82f6', '#f59e0b', '#a78bfa', '#f87171', '#f59e0b'];

    const iconWrap  = document.getElementById('_wIconWrap');
    const iconEmoji = document.getElementById('_wIconEmoji');
    const title     = document.getElementById('_wTitle');
    const sub       = document.getElementById('_wSub');
    const bar       = document.getElementById('_wBar');
    const label     = document.getElementById('_wServerLabel');

    if (!iconWrap) return;

    title.style.opacity = '0';
    sub.style.opacity   = '0';

    setTimeout(() => {
      iconWrap.style.background = cores[index];

      const styleId = '_wSpinStyle';
      let s = document.getElementById(styleId);
      if (!s) { s = document.createElement('style'); s.id = styleId; document.head.appendChild(s); }
      s.textContent = `
        #_wIconWrap::before { border-top-color: ${spinCores[index]} !important; }
        #_wIconWrap::after  { border-top-color: ${spinCores[index]}88 !important; }
        #_wBar { background: ${barCores[index]} !important; }
      `;

      iconEmoji.style.animation = 'none';
      void iconEmoji.offsetWidth;
      iconEmoji.textContent = emojis[index];
      iconEmoji.style.animation = '_wPop 0.4s cubic-bezier(0.175,0.885,0.32,1.275)';

      if (msg) {
        title.textContent = msg.title;
        sub.textContent   = msg.sub;
      } else {
        title.textContent = 'Aguarde um instante...';
        sub.textContent   = 'Estamos liberando seu acesso com segurança.';
      }

      title.style.opacity = '1';
      sub.style.opacity   = '1';

      bar.style.width = `${(index / WORKERS.length) * 100}%`;

      // Dots — 5 agora (0-4)
      for (let i = 0; i < WORKERS.length; i++) {
        const dot = document.getElementById(`_wdot${i}`);
        if (!dot) continue;
        // Mantém classe "render" no dot 4
        const isRenderDot = i === 4;
        dot.className = `wserver-dot${isRenderDot ? ' render' : ''}`;
        if (falhos.includes(i))  dot.classList.add('falhou');
        else if (i < index)      dot.classList.add('ok');
        else if (i === index)    dot.classList.add('ativo');
      }

      const labels = [
        'Cloudflare 1 de 4',
        'Cloudflare 2 de 4',
        'Cloudflare 3 de 4',
        'Cloudflare 4 de 4',
        'Render Python (reserva)',
      ];
      label.textContent = labels[index] || `Servidor ${index + 1} de ${WORKERS.length}`;
    }, 200);
  }

  let _wTimerInterval = null;
  function iniciarTimerOverlay() {
    const timerEl = document.getElementById('_wTimer');
    if (!timerEl) return;
    let seg = 0;
    clearInterval(_wTimerInterval);
    _wTimerInterval = setInterval(() => {
      seg++;
      timerEl.textContent = `${seg}s`;
    }, 1000);
  }

  function pararTimerOverlay() {
    clearInterval(_wTimerInterval);
  }

  function removerOverlayWorker() {
    pararTimerOverlay();
    const el = document.getElementById('_workerOverlay');
    if (!el) return;
    el.style.opacity   = '0';
    el.style.transition = 'opacity 0.3s ease';
    setTimeout(() => el.remove(), 300);
  }

  /* ===================================================
     FETCH COM FAILOVER — 4 Cloudflare + 1 Render Python
     ================================================= */
  async function fetchComFailover(body) {
    const falhos = [];

    for (let i = 0; i < WORKERS.length; i++) {
      const isUltimo = i === WORKERS.length - 1;

      atualizarOverlayWorker(i, falhos);
      iniciarTimerOverlay();

      try {
        const controller = new AbortController();
        const timeoutId  = setTimeout(() => controller.abort(), WORKER_TIMEOUTS[i]);

        const response = await fetch(WORKERS[i], {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(body),
          signal:  controller.signal,
          redirect: 'follow'
        });

        clearTimeout(timeoutId);
        pararTimerOverlay();

        const rawText = await response.text();
        try {
          return JSON.parse(rawText);
        } catch {
          throw new Error('Resposta inválida do servidor');
        }

      } catch (err) {
        pararTimerOverlay();
        falhos.push(i);

        if (!isUltimo) {
          await new Promise(r => setTimeout(r, 600));
          continue;
        }

        // Todos os 5 falharam
        removerOverlayWorker();
        mostrarErroTotal();
        throw new Error('Todos os servidores estão indisponíveis');
      }
    }
  }

  /* ===================================================
     TELA DE ERRO TOTAL
     ================================================= */
  function mostrarErroTotal() {
    loginBtn.classList.remove('loading');
    if (document.getElementById('_erroTotalPopup')) return;

    const popup = document.createElement('div');
    popup.id = '_erroTotalPopup';
    popup.style.cssText = `
      position: fixed; inset: 0;
      background: rgba(0,0,0,0.75);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      z-index: 99999;
      display: flex; align-items: center; justify-content: center;
      padding: 20px;
      animation: etFadeIn 0.3s ease;
    `;

    popup.innerHTML = `
      <style>
        @keyframes etFadeIn  { from{opacity:0} to{opacity:1} }
        @keyframes etCardIn  {
          from { opacity:0; transform: scale(0.9) translateY(16px); }
          to   { opacity:1; transform: scale(1) translateY(0); }
        }
        @keyframes etPulse {
          0%,100% { box-shadow: 0 0 0 0   rgba(239,68,68,0.35); }
          50%      { box-shadow: 0 0 0 14px rgba(239,68,68,0); }
        }
        #_erroTotalCard {
          animation: etCardIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275);
          background: linear-gradient(145deg, #0d1b2e 0%, #0a1628 100%);
          border: 1px solid rgba(239,68,68,0.25);
          border-radius: 24px;
          padding: 40px 32px;
          max-width: 420px; width: 100%;
          text-align: center;
          box-shadow: 0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04);
        }
        .et-icon {
          width: 72px; height: 72px;
          margin: 0 auto 24px;
          background: rgba(239,68,68,0.1);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 30px;
          animation: etPulse 2.5s ease infinite;
        }
        .et-title { font-size: 19px; font-weight: 800; color: #f1f5f9; margin-bottom: 10px; }
        .et-desc  { font-size: 13px; color: #64748b; line-height: 1.75; margin-bottom: 28px; }
        .et-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 4px 12px;
          background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2);
          border-radius: 99px; font-size: 11px; font-weight: 700;
          color: #fca5a5; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 24px;
        }
        .et-contact {
          display: flex; align-items: center; gap: 12px;
          padding: 13px 16px; background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06); border-radius: 14px;
          margin-bottom: 10px; text-align: left; transition: border-color 0.2s;
        }
        .et-contact:hover { border-color: rgba(255,255,255,0.12); }
        .et-contact-icon { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; font-size: 18px; }
        .et-contact-label { font-size: 10px; font-weight: 700; color: #475569; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px; }
        .et-contact-value { font-size: 15px; font-weight: 700; color: #e2e8f0; }
        .et-btn-retry {
          width: 100%; padding: 14px; border: none; border-radius: 14px;
          background: linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%);
          color: white; font-weight: 700; font-size: 15px;
          cursor: pointer; transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(59,130,246,0.35);
          margin-top: 20px; font-family: inherit; letter-spacing: 0.2px;
        }
        .et-btn-retry:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(59,130,246,0.45); }
      </style>

      <div id="_erroTotalCard">
        <div class="et-icon">😵</div>
        <div class="et-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          Instabilidade detectada
        </div>
        <div class="et-title">Login temporariamente indisponível</div>
        <div class="et-desc">
          Tentamos em todos os 5 servidores disponíveis<br>
          (4 Cloudflare + 1 Render) e nenhum respondeu.<br><br>
          <strong style="color:#94a3b8">Entre em contato com o desenvolvedor:</strong>
        </div>
        <div class="et-contact">
          <div class="et-contact-icon" style="background:rgba(96,165,250,0.1)">📞</div>
          <div>
            <div class="et-contact-label">Ramal Interno</div>
            <div class="et-contact-value">302</div>
          </div>
        </div>
        <div class="et-contact">
          <div class="et-contact-icon" style="background:rgba(37,211,102,0.1)">💬</div>
          <div>
            <div class="et-contact-label">WhatsApp</div>
            <div class="et-contact-value">(88) 98856-8911</div>
          </div>
        </div>
        <button class="et-btn-retry" onclick="
          document.getElementById('_erroTotalPopup').remove();
          document.getElementById('loginBtn').classList.remove('loading');
        ">Tentar novamente</button>
      </div>
    `;

    document.body.appendChild(popup);
  }

  /* ===== FUNÇÃO: MOSTRAR ERRO ===== */
  function mostrarErro(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.add('show');
    setTimeout(() => errorAlert.classList.remove('show'), 5000);
  }

  /* ===== FUNÇÃO: TOAST ===== */
  function showToast(message, type = 'error', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    const titles = { success: 'Sucesso', error: 'Erro', warning: 'Atenção' };
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

  window.showToast = showToast;

  /* ===== FORGOT PASSWORD ===== */
  window.showForgotPassword = function () {
    if (document.getElementById('_mainForgotPopup')) return;
    const popup = document.createElement('div');
    popup.id = '_mainForgotPopup';
    popup.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:fpFadeIn 0.2s ease;`;
    popup.innerHTML = `
      <style>
        @keyframes fpFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fpCardIn{from{opacity:0;transform:scale(0.9) translateY(14px)}to{opacity:1;transform:scale(1) translateY(0)}}
        #_mainForgotCard{animation:fpCardIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)}
        .mfp-contact{display:flex;align-items:center;gap:14px;padding:13px 15px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:10px;transition:border-color 0.2s}
        .mfp-contact:hover{border-color:#93c5fd}
        .mfp-icon-wrap{width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .mfp-icon-wrap svg{width:19px;height:19px}
        .mfp-label{font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:2px}
        .mfp-value{font-size:16px;font-weight:700;color:#1e293b}
        .mfp-close{width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#003da5 0%,#3b82f6 100%);color:white;font-weight:600;font-size:15px;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(0,61,165,0.25);margin-top:8px;font-family:inherit}
        .mfp-close:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,61,165,0.35)}
      </style>
      <div id="_mainForgotCard" style="background:#fff;border-radius:20px;padding:36px 32px;max-width:360px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.18);text-align:center;">
        <div style="width:58px;height:58px;margin:0 auto 18px;padding:14px;background:#dbeafe;border-radius:50%;color:#003da5;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
        </div>
        <h3 style="font-size:19px;font-weight:700;color:#003da5;margin-bottom:8px;">Como trocar de senha?</h3>
        <p style="font-size:13px;color:#64748b;margin-bottom:22px;line-height:1.6;">Entre em contato com o desenvolvedor pelos canais abaixo:</p>
        <div class="mfp-contact">
          <div class="mfp-icon-wrap" style="background:#dbeafe"><svg viewBox="0 0 24 24" fill="none" stroke="#003da5" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg></div>
          <div style="text-align:left"><div class="mfp-label">Ramal Interno</div><div class="mfp-value">302</div></div>
        </div>
        <div class="mfp-contact">
          <div class="mfp-icon-wrap" style="background:#dcfce7"><svg viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg></div>
          <div style="text-align:left"><div class="mfp-label">WhatsApp</div><div class="mfp-value">(88) 98856-8911</div></div>
        </div>
        <button class="mfp-close" onclick="document.getElementById('_mainForgotPopup').remove()">Entendido</button>
      </div>
    `;
    document.body.appendChild(popup);
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  };

  /* ===== LOGIN HELP ===== */
  window.showLoginHelp = function () {
    if (document.getElementById('_loginHelpPopup')) return;
    const popup = document.createElement('div');
    popup.id = '_loginHelpPopup';
    popup.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.55);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;animation:lhFadeIn 0.2s ease;`;
    popup.innerHTML = `
      <style>
        @keyframes lhFadeIn{from{opacity:0}to{opacity:1}}
        @keyframes lhCardIn{from{opacity:0;transform:scale(0.9) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
        #_loginHelpCard{animation:lhCardIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)}
        .lh-step{display:flex;gap:14px;align-items:flex-start;padding:14px 16px;background:#f8fafc;border:1.5px solid #e2e8f0;border-radius:12px;margin-bottom:10px;text-align:left;transition:border-color 0.2s}
        .lh-step:hover{border-color:#bfdbfe}
        .lh-step-num{width:28px;height:28px;flex-shrink:0;border-radius:50%;background:linear-gradient(135deg,#003da5 0%,#3b82f6 100%);color:white;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
        .lh-step-title{font-size:13px;font-weight:700;color:#1e293b;margin-bottom:3px}
        .lh-step-desc{font-size:12px;color:#64748b;line-height:1.55}
        .lh-close{width:100%;padding:13px;border:none;border-radius:12px;background:linear-gradient(135deg,#003da5 0%,#3b82f6 100%);color:white;font-weight:600;font-size:15px;cursor:pointer;transition:all 0.2s;box-shadow:0 4px 16px rgba(0,61,165,0.25);margin-top:14px;font-family:inherit}
        .lh-close:hover{transform:translateY(-2px);box-shadow:0 6px 24px rgba(0,61,165,0.35)}
      </style>
      <div id="_loginHelpCard" style="background:#fff;border-radius:20px;max-width:420px;width:100%;box-shadow:0 25px 60px rgba(0,0,0,0.18);overflow:hidden;">
        <div style="overflow-y:auto;max-height:88vh;padding:32px 28px;box-sizing:border-box;">
          <div style="text-align:center;margin-bottom:22px;">
            <div style="width:54px;height:54px;margin:0 auto 14px;padding:13px;background:#dbeafe;border-radius:50%;color:#003da5;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </div>
            <h3 style="font-size:18px;font-weight:700;color:#003da5;margin-bottom:6px;">Como fazer login?</h3>
            <p style="font-size:13px;color:#64748b;line-height:1.5;">Siga os passos abaixo para acessar o sistema</p>
          </div>
          <div class="lh-step">
            <div class="lh-step-num">1</div>
            <div><div class="lh-step-title">Usuário e Senha</div><div class="lh-step-desc">Digite o login e senha fornecidos pelo administrador.</div></div>
          </div>
          <div class="lh-step">
            <div class="lh-step-num">2</div>
            <div><div class="lh-step-title">Autorização de Localização</div><div class="lh-step-desc">Clique em <strong>"Permitir"</strong> quando o navegador pedir acesso à sua localização.</div></div>
          </div>
          <div class="lh-step">
            <div class="lh-step-num">3</div>
            <div><div class="lh-step-title">Se pedir o CEP</div><div class="lh-step-desc">Informe seu CEP no formato <code style="background:#f1f5f9;padding:1px 5px;border-radius:4px;">00000-000</code>.</div></div>
          </div>
          <button class="lh-close" onclick="document.getElementById('_loginHelpPopup').remove()">Fechar</button>
        </div>
      </div>
    `;
    document.body.appendChild(popup);
    popup.addEventListener('click', e => { if (e.target === popup) popup.remove(); });
  };

  /* ===== INDICADORES DE LOCALIZAÇÃO ===== */
  function mostrarIndicadorLocalizacao() {
    return new Promise(resolve => {
      const banner = document.createElement('div');
      banner.id = '_locIndicator';
      banner.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:99998;display:flex;align-items:flex-start;justify-content:flex-start;padding:12px 16px;pointer-events:none;animation:locBannerIn 0.4s ease forwards;`;
      banner.innerHTML = `
        <style>
          @keyframes locBannerIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes locBannerOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px)}}
          @keyframes locArrowBounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
          @keyframes locPulseRing{0%{transform:scale(1);opacity:1}100%{transform:scale(2.2);opacity:0}}
          #_locInner{display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(135deg,#1e3a8a 0%,#1d4ed8 100%);border-radius:14px;box-shadow:0 8px 32px rgba(0,0,0,0.35),0 0 0 1px rgba(255,255,255,0.1);max-width:360px}
          #_locArrow{animation:locArrowBounce 0.9s ease infinite}
          #_locPulse{position:relative;width:12px;height:12px}
          #_locPulseDot,#_locPulseRing{position:absolute;inset:0;background:#60a5fa;border-radius:50%}
          #_locPulseRing{animation:locPulseRing 1.2s ease infinite}
          #_locTitle{font-size:13px;font-weight:700;color:#fff;margin-bottom:2px}
          #_locSub{font-size:12px;color:#93c5fd}
        </style>
        <div id="_locInner">
          <div style="display:flex;flex-direction:column;align-items:center;gap:4px;flex-shrink:0">
            <div id="_locArrow"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2.5"><polyline points="18 15 12 9 6 15"></polyline></svg></div>
            <div id="_locPulse"><div id="_locPulseRing"></div><div id="_locPulseDot"></div></div>
          </div>
          <div>
            <div id="_locTitle">Autorize sua localização ↑</div>
            <div id="_locSub">Clique em <strong style="color:#fff">"Permitir"</strong> no aviso acima</div>
          </div>
        </div>
      `;
      document.body.appendChild(banner);
      setTimeout(() => {
        banner.style.animation = 'locBannerOut 0.4s ease forwards';
        setTimeout(() => { banner.remove(); resolve(); }, 400);
      }, 5000);
    });
  }

  function removerIndicadorLocalizacao() {
    const b = document.getElementById('_locIndicator');
    if (!b) return;
    b.style.animation = 'locBannerOut 0.4s ease forwards';
    setTimeout(() => b.remove(), 400);
  }

  function mostrarIndicadorPermissaoNegada() {
    return new Promise(resolve => {
      const existing = document.getElementById('_locDeniedBanner');
      if (existing) existing.remove();
      const banner = document.createElement('div');
      banner.id = '_locDeniedBanner';
      banner.style.cssText = `position:fixed;top:0;left:0;right:0;z-index:99998;display:flex;align-items:flex-start;justify-content:flex-start;padding:12px 16px;pointer-events:none;`;
      banner.innerHTML = `
        <style>
          @keyframes locDeniedIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}
          @keyframes locDeniedOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px)}}
          @keyframes locDeniedPulse{0%,100%{box-shadow:0 8px 32px rgba(185,28,28,0.45)}50%{box-shadow:0 8px 44px rgba(220,38,38,0.7)}}
          #_locDeniedInner{display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(135deg,#7f1d1d 0%,#b91c1c 100%);border-radius:14px;max-width:420px;animation:locDeniedIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275) forwards,locDeniedPulse 2s ease 0.6s infinite}
          #_locDeniedIconWrap{width:36px;height:36px;background:rgba(0,0,0,0.22);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0}
          #_locDeniedIconWrap svg{width:18px;height:18px}
          #_locDeniedTitle{font-size:13px;font-weight:700;color:#fff;margin-bottom:2px}
          #_locDeniedSub{font-size:12px;color:#fca5a5}
        </style>
        <div id="_locDeniedInner">
          <div id="_locDeniedIconWrap"><svg viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
          <div>
            <div id="_locDeniedTitle">Localização bloqueada 🔒</div>
            <div id="_locDeniedSub">Clique no <strong style="color:#fff">cadeado 🔒</strong> para permitir — ou informe seu CEP abaixo</div>
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

  /* ===== PEGAR CIDADE ===== */
  async function pegarCidade(lat, lng) {
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await resp.json();
      return (data.address.city || data.address.town || data.address.village || '').toLowerCase();
    } catch { return null; }
  }

  /* ===== PROCESSAR LOGIN ===== */
  async function processarLogin() {
    if (!currentUser || !currentPass) {
      mostrarErro('Usuário ou senha não preenchidos'); showToast('Preencha todos os campos', 'warning'); return;
    }

    let attemptsData = JSON.parse(localStorage.getItem(`loginAttempts_${currentUser}`) || '{"count":0,"timeout":0}');
    const now = Date.now();

    if (attemptsData.timeout && now < attemptsData.timeout) {
      const remaining = Math.ceil((attemptsData.timeout - now) / 1000);
      mostrarErro(`Muitas tentativas. Aguarde ${remaining} segundos.`);
      showToast(`Login bloqueado por ${remaining}s`, 'error'); return;
    }

    const actionType = isVisitante ? 'voucher' : 'login';

    try {
      criarOverlayWorker();

      const result = await fetchComFailover({
        action: actionType,
        user:   currentUser,
        pass:   currentPass,
        local:  localTentativa
      });

      removerOverlayWorker();

      if (result.status === 'autorizado' || (result.ok && isVisitante)) {
        localStorage.removeItem(`loginAttempts_${currentUser}`);

        const serverStart    = (typeof result.start === 'number' && isFinite(result.start)) ? result.start : Date.now();
        const serverDuration = result.duration;

        const authSession = {
          user:      result.user || currentUser,
          perm:      (result.perm || (isVisitante ? 'voucher' : 'vendas')).toLowerCase(),
          fullName:  result['Nome completo'] || result.nome || '',
          local:     result.Local || result.local || localTentativa || '',
          cpf:       result.CPF || result.cpf || '',
          filial:    result.Filial || result.filial || '',
          start:     serverStart,
          duration:  (serverDuration === -1 || serverDuration === null || serverDuration === undefined)
            ? -1
            : (typeof serverDuration === 'number' && isFinite(serverDuration))
              ? serverDuration
              : (function (perm) {
                  perm = String(perm || '').toLowerCase();
                  if (perm === 'voucher' || perm === 'visitante') return 5 * 60 * 1000;
                  if (perm === 'crediario') return 4 * 60 * 60 * 1000;
                  if (perm === 'vendas') return 3 * 60 * 60 * 1000;
                  if (perm === 'faturamento') return 6 * 60 * 60 * 1000;
                  if (['gerente', 'admin', 'suporte'].includes(perm)) return -1;
                  return 60 * 60 * 1000;
                })(result.perm || ''),
          isVoucher:    !!isVisitante || !!result.isVoucher || ((result.perm || '').toLowerCase() === 'voucher'),
          tipo:         isVisitante ? 'voucher' : 'normal',
          lastActivity: Date.now()
        };

        localStorage.setItem('authSession', JSON.stringify(authSession));

        if (isVisitante) {
          modalVoucher.classList.add('show');
          let progress = 20;
          const circumference = 2 * Math.PI * 54;
          const interval = setInterval(() => {
            progress += Math.random() * 8;
            if (progress > 100) progress = 100;
            progressBar.style.strokeDashoffset = circumference * (1 - progress / 100);
            progressText.textContent = `${Math.floor(progress)}%`;
            if (progress >= 100) {
              clearInterval(interval);
              setTimeout(() => { modalVoucher.classList.remove('show'); window.location.href = 'pages/selectsetor.html'; }, 500);
            }
          }, 200);
        } else {
          showToast('Login realizado com sucesso!', 'success', 2000);
          setTimeout(() => { window.location.href = 'pages/selectsetor.html'; }, 1000);
        }

      } else {
        attemptsData.count = (attemptsData.count || 0) + 1;
        if (attemptsData.count >= 5) attemptsData.timeout = now + 30000;
        localStorage.setItem(`loginAttempts_${currentUser}`, JSON.stringify(attemptsData));

        if (result.motivo === 'localincorreto' || result.motivo === 'local-nao-permitido') {
          mostrarErro('Localização não permitida para este usuário');
          showToast('Acesso negado: localização não autorizada', 'error');
        } else if (result.motivo === 'senhaincorreta') {
          mostrarErro('Senha incorreta');
          showToast('Senha inválida. Tente novamente.', 'error');
        } else if (result.motivo === 'usuarionaoexiste') {
          mostrarErro('Usuário não encontrado');
          showToast('Usuário não cadastrado no sistema', 'error');
        } else {
          mostrarErro(result.error || 'Credenciais inválidas');
          showToast('Não foi possível autenticar', 'error');
        }

        if (attemptsData.count >= 5) showToast('5 tentativas excedidas. Aguarde 30 segundos.', 'warning', 5000);
      }

    } catch (error) {
      removerOverlayWorker();
      if (!document.getElementById('_erroTotalPopup')) {
        mostrarErro('Falha na conexão com o servidor');
        showToast('Erro de rede. Verifique sua conexão.', 'error');
      }
    } finally {
      loginBtn.classList.remove('loading');
    }
  }

  /* ===== GEOLOCALIZAÇÃO ===== */
  async function validarGeolocalizacao() {
    try {
      if (!navigator.geolocation) throw { code: 4 };
      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000, enableHighAccuracy: true });
      });
      const cidade = await pegarCidade(pos.coords.latitude, pos.coords.longitude);
      if (!cidade) throw { code: 3 };
      localTentativa = cidade;
      return true;
    } catch (error) {
      let msg = 'Não foi possível validar sua localização.';
      if (error.code === 1) msg = 'Permissão de localização negada. Por favor, informe seu CEP.';
      else if (error.code === 2) msg = 'Localização indisponível. Por favor, informe seu CEP.';
      else if (error.code === 3) msg = 'Tempo esgotado ao obter localização. Por favor, informe seu CEP.';
      mostrarErro(msg);
      showToast('Não foi possível obter sua localização', 'warning');
      return false;
    }
  }

  /* ===== CONFIRMAR CEP ===== */
  async function confirmarCEP() {
    const cep = cepInput.value.replace(/\D/g, '');
    if (cep.length !== 8) { showToast('CEP inválido. Digite 8 números.', 'warning'); cepInput.focus(); return; }
    try {
      cepConfirm.disabled = true;
      cepConfirm.style.opacity = '0.6';
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      if (data.erro) throw new Error('CEP não encontrado');
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

  /* ===== LOGIN PRINCIPAL ===== */
  async function login(e) {
    e.preventDefault();
    currentUser = inputUser.value.trim().toLowerCase();
    currentPass = inputPass.value.trim();

    if (!currentUser || !currentPass) {
      mostrarErro('Preencha usuário e senha');
      showToast('Todos os campos são obrigatórios', 'warning'); return;
    }

    let attemptsData = JSON.parse(localStorage.getItem(`loginAttempts_${currentUser}`) || '{"count":0,"timeout":0}');
    const now = Date.now();
    if (attemptsData.timeout && now < attemptsData.timeout) {
      const remaining = Math.ceil((attemptsData.timeout - now) / 1000);
      showToast(`Login bloqueado por ${remaining}s`, 'error'); return;
    }

    loginBtn.classList.add('loading');
    isVisitante = currentUser === 'visitante';

    mostrarIndicadorLocalizacao();
    const geoOk = await validarGeolocalizacao();
    removerIndicadorLocalizacao();

    if (!geoOk && !isVisitante) {
      loginBtn.classList.remove('loading');
      await mostrarIndicadorPermissaoNegada();
      modalCEP.classList.add('show'); cepInput.focus(); return;
    }
    if (isVisitante && !localTentativa) {
      loginBtn.classList.remove('loading');
      await mostrarIndicadorPermissaoNegada();
      modalCEP.classList.add('show'); cepInput.focus(); return;
    }

    await processarLogin();
  }

  /* ===== MÁSCARA CEP ===== */
  cepInput.addEventListener('input', e => {
    let v = e.target.value.replace(/\D/g, '');
    if (v.length > 5) v = v.slice(0, 5) + '-' + v.slice(5, 8);
    e.target.value = v;
  });

  /* ===== EVENT LISTENERS ===== */
  loginForm.addEventListener('submit', login);
  cepConfirm.addEventListener('click', confirmarCEP);
  cepInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); confirmarCEP(); } });
  modalCEP.addEventListener('click', e => { if (e.target === modalCEP) { modalCEP.classList.remove('show'); loginBtn.classList.remove('loading'); } });

});
