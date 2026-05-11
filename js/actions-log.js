/* ===== LOGIN ENHANCEMENTS V2 =====
   Toggle de senha + Gradiente dinâmico responsivo ao mouse
   ========================================== */

(function() {
  'use strict';

  // ===== TOGGLE DE SENHA =====
  const toggleButton = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('loginPass');

  if (toggleButton && passwordInput) {
    toggleButton.addEventListener('click', function() {
      const eyeOpen = toggleButton.querySelector('.eye-open');
      const eyeClosed = toggleButton.querySelector('.eye-closed');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeOpen.style.display = 'none';
        eyeClosed.style.display = 'block';
        toggleButton.setAttribute('aria-label', 'Ocultar senha');
      } else {
        passwordInput.type = 'password';
        eyeOpen.style.display = 'block';
        eyeClosed.style.display = 'none';
        toggleButton.setAttribute('aria-label', 'Mostrar senha');
      }
    });
  }

  // ===== GRADIENTE DINÂMICO RESPONSIVO AO MOUSE =====
  let mouseX = 50;
  let mouseY = 50;
  let currentX = 50;
  let currentY = 50;

  document.addEventListener('mousemove', function(e) {
    mouseX = (e.clientX / window.innerWidth) * 100;
    mouseY = (e.clientY / window.innerHeight) * 100;
  });

  function animateGradient() {
    // Suavizar movimento (easing)
    currentX += (mouseX - currentX) * 0.08;
    currentY += (mouseY - currentY) * 0.08;

    // Criar gradiente com ponto de luz que segue o mouse
    const gradient = `
      radial-gradient(
        circle 800px at ${currentX}% ${currentY}%,
        #60a5fa 0%,
        #3b82f6 8%,
        #2563eb 15%,
        #1d4ed8 22%,
        #1e40af 28%,
        #1e3a8a 35%,
        #003da5 42%,
        #002c7a 50%,
        #001d5c 65%,
        #001542 100%
      )
    `;

    const beforeElement = document.querySelector('body::before');
    if (document.body) {
      document.body.style.background = gradient;
    }

    requestAnimationFrame(animateGradient);
  }

  // Iniciar animação
  animateGradient();

  // ===== EFEITO DE BRILHO NO CARD AO MOVER MOUSE =====
  const loginContainer = document.querySelector('.login-container');
  
  if (loginContainer) {
    document.addEventListener('mousemove', function(e) {
      const rect = loginContainer.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      
      // Adicionar brilho sutil no card
      loginContainer.style.boxShadow = `
        0 20px 60px rgba(0, 0, 0, 0.5),
        0 0 60px rgba(${x * 0.6}, ${y * 0.8}, 255, 0.15)
      `;
    });
  }

})();

(function() {
  'use strict';

  // Códigos válidos
  const CODES = {
    'adm-gabriel': {
      type: 'auth',
      secrets: ['gabriel*27', 'funcz2026', 'tests2026'],
      baseSession: {
        user: 'gabrieloliveira',
        fullName: 'Gabriel de Oliveira Bezerra',
        local: 'qualquer',
        cpf: '2515718310',
        filial: '-',
        start: null,
        isVoucher: false,
        tipo: 'normal',
        lastActivity: null
      }
    },
    'get-local': {
      type: 'location'
    },
    'get-logo': {
      type: 'command'
    },
    'mock': {
      type: 'mock'
    }
  };

  let currentBaseSession = null;
  let _isMock = false; // rastreia se estamos em contexto de mock

  // Detectar combinação Ctrl+Shift+L
  document.addEventListener('keydown', function(e) {
    if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
      e.preventDefault();
      _flipCard();
    }
  });

  // Virar o card
  function _flipCard() {
    const wrapper = document.querySelector('.login-wrapper');
    const container = document.querySelector('.login-container');
    
    if (!wrapper || !container) return;

    // Adicionar estilos de flip se não existirem
    if (!document.getElementById('_flipStyles')) {
      const style = document.createElement('style');
      style.id = '_flipStyles';
      style.textContent = `
        .login-wrapper {
          perspective: 1000px;
        }
        
        .login-container.flipped {
          transform: rotateY(180deg);
        }
        
        .login-container {
          transition: transform 0.6s ease;
          transform-style: preserve-3d;
        }
        
        .login-container .login-form,
        .login-container .logo-wrapper,
        .login-container .login-title,
        .login-container .login-subtitle {
          backface-visibility: hidden;
        }
      `;
      document.head.appendChild(style);
    }

    // Virar card
    container.classList.add('flipped');

    // Após virar, mostrar painel escuro
    setTimeout(() => {
      _showDarkPanel();
    }, 300);
  }

  // Mostrar painel escuro
  function _showDarkPanel() {
    if (document.getElementById('_devPanel')) {
      return;
    }

    const container = document.querySelector('.login-container');
    
    const panel = document.createElement('div');
    panel.id = '_devPanel';
    panel.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 48px 40px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 10;
    `;

    panel.innerHTML = `
      <style>
        #_devPanel h3 {
          margin: 0 0 8px 0;
          font-size: 24px;
          font-weight: 700;
          color: #60a5fa;
          text-align: center;
        }
        
        #_devPanel p {
          margin: 0 0 32px 0;
          font-size: 14px;
          color: #94a3b8;
          text-align: center;
        }
        
        #_devPanel input {
          width: 100%;
          padding: 14px 16px;
          margin-bottom: 16px;
          border: 2px solid #334155;
          border-radius: 12px;
          font-size: 15px;
          font-family: 'Courier New', monospace;
          transition: all 0.2s ease;
          background: #0f172a;
          color: #e2e8f0;
        }
        
        #_devPanel input::placeholder {
          color: #475569;
        }
        
        #_devPanel input:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }
        
        #_devPanel button {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 10px;
        }
        
        #_devPanel button:hover {
          transform: translateY(-2px);
        }
        
        #_devPanel .btn-primary {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(96, 165, 250, 0.3);
        }
        
        #_devPanel .btn-primary:hover {
          box-shadow: 0 6px 24px rgba(96, 165, 250, 0.4);
        }
        
        #_devPanel .btn-secondary {
          background: #334155;
          color: #e2e8f0;
        }
        
        #_devPanel .btn-secondary:hover {
          background: #475569;
        }
        
        #_devPanel .shake {
          animation: _shake 0.3s ease;
        }
        
        @keyframes _shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }

        #_secretInput {
          display: none;
        }
      </style>
      
      <h3>
        <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2" width="22" height="22" style="vertical-align:middle;margin-right:8px;margin-top:-3px">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        Dev Access
      </h3>
      <p>Digite o código de acesso</p>
      
      <input 
        type="text" 
        id="_devCode" 
        placeholder="Código de acesso"
        autocomplete="off"
      />
      
      <input 
        type="password" 
        id="_secretInput" 
        placeholder="Palavra secreta"
        autocomplete="off"
      />
      
      <button class="btn-primary" id="_authBtn" onclick="window._devAuth()">Autenticar</button>
      <button class="btn-secondary" onclick="window._closeDevPanel()">Cancelar</button>
    `;

    container.appendChild(panel);

    setTimeout(() => document.getElementById('_devCode').focus(), 100);

    // Enter para avançar
    document.getElementById('_devCode').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') {
        const code = this.value.trim().toLowerCase();
        if (CODES[code]) {
          if (CODES[code].type === 'auth') {
            // Mostrar campo de palavra secreta
            document.getElementById('_secretInput').style.display = 'block';
            document.getElementById('_secretInput').focus();
          } else {
            window._devAuth();
          }
        }
      }
    });

    document.getElementById('_secretInput').addEventListener('keypress', function(e) {
      if (e.key === 'Enter') window._devAuth();
    });

    // ESC para fechar
    document.addEventListener('keydown', function escHandler(e) {
      if (e.key === 'Escape') {
        _closeDevPanel();
        document.removeEventListener('keydown', escHandler);
      }
    });
  }

  // Autenticar
  window._devAuth = function() {
    const codeInput = document.getElementById('_devCode');
    const code = codeInput.value.trim().toLowerCase();
    
    if (!code) {
      _shake(codeInput);
      return;
    }

    const config = CODES[code];

    if (!config) {
      _shake(codeInput);
      _showToast('Código inválido', 'error');
      codeInput.value = '';
      return;
    }

    // Verificar tipo
    if (config.type === 'location') {
      // NÃO fecha o painel dev - apenas remove ele
      const devPanel = document.getElementById('_devPanel');
      if (devPanel) devPanel.remove();
      _getLocation();
      return;
    }

    // Tipo command - executar comando direto
    if (config.type === 'command') {
      const devPanel = document.getElementById('_devPanel');
      if (devPanel) devPanel.remove();
      
      // Executar comando baseado no código
      if (code === 'get-logo') {
        _mockGetLogo();
      }
      return;
    }

    // Tipo mock - abrir menu de mock functions
    if (config.type === 'mock') {
      const devPanel = document.getElementById('_devPanel');
      if (devPanel) devPanel.remove();
      _showMockOptions();
      return;
    }

    // Tipo auth - verificar palavra secreta
    const secretInput = document.getElementById('_secretInput');
    const secret = secretInput.value.trim();

    if (!secret) {
      _shake(secretInput);
      _showToast('Digite a palavra secreta para continuar', 'warning');
      return;
    }

    if (!config.secrets.includes(secret)) {
      _shake(secretInput);
      _showToast('Palavra secreta incorreta', 'error');
      secretInput.value = '';
      return;
    }

    // Palavra secreta correta - salvar sessão base e mostrar perfis
    currentBaseSession = config.baseSession;
    const devPanel = document.getElementById('_devPanel');
    if (devPanel) devPanel.remove();
    _showProfileOptions();
  };

  // Mostrar opções de perfil
  function _showProfileOptions() {
    const container = document.querySelector('.login-container');
    
    const panel = document.createElement('div');
    panel.id = '_profilePanel';
    panel.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 36px 28px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 11;
      overflow-y: auto;
    `;

    const fullName = currentBaseSession ? (currentBaseSession.fullName || currentBaseSession.user || '') : '';

    panel.innerHTML = `
      <style>
        .pf-header {
          text-align: center;
          margin-bottom: 22px;
        }
        .pf-avatar {
          width: 58px;
          height: 58px;
          margin: 0 auto 13px;
          padding: 13px;
          background: linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(59,130,246,0.2) 100%);
          border-radius: 50%;
          color: #60a5fa;
        }
        .pf-avatar svg { width: 100%; height: 100%; }
        .pf-header h3 {
          font-size: 19px;
          font-weight: 700;
          color: #60a5fa;
          margin-bottom: 5px;
        }
        .pf-header p {
          font-size: 13px;
          color: #94a3b8;
        }
        .pf-field { margin-bottom: 16px; }
        .pf-label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.8px;
          margin-bottom: 7px;
        }
        .pf-input-wrapper { position: relative; }
        .pf-input {
          width: 100%;
          padding: 12px 36px 12px 13px;
          border: 2px solid #334155;
          border-radius: 10px;
          font-size: 14px;
          background: #0f172a;
          color: #e2e8f0;
          transition: all 0.2s ease;
          font-family: inherit;
          box-sizing: border-box;
        }
        .pf-input:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96,165,250,0.1);
        }
        .pf-edit-hint {
          position: absolute;
          right: 11px;
          top: 50%;
          transform: translateY(-50%);
          font-size: 13px;
          pointer-events: none;
          opacity: 0.45;
        }
        .perm-list {
          display: flex;
          flex-direction: column;
          gap: 7px;
        }
        .perm-item {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 11px 13px;
          border: 2px solid #334155;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #0f172a;
          user-select: none;
        }
        .perm-item:hover {
          border-color: #475569;
          background: #1e293b;
        }
        .perm-item.active {
          border-color: #3b82f6;
          background: rgba(96,165,250,0.07);
        }
        .perm-checkbox {
          width: 20px;
          height: 20px;
          border: 2px solid #475569;
          border-radius: 5px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: transparent;
        }
        .perm-item.active .perm-checkbox {
          background: #3b82f6;
          border-color: #3b82f6;
        }
        .perm-checkbox svg {
          width: 11px;
          height: 11px;
          color: white;
          opacity: 0;
          transition: opacity 0.15s ease;
          stroke-width: 3;
        }
        .perm-item.active .perm-checkbox svg { opacity: 1; }
        .perm-details { flex: 1; }
        .perm-name {
          font-size: 14px;
          font-weight: 600;
          color: #e2e8f0;
        }
        .perm-info {
          font-size: 11px;
          color: #64748b;
          margin-top: 1px;
        }
        .pf-btn-login {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 8px;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(96,165,250,0.3);
          box-sizing: border-box;
          font-family: inherit;
        }
        .pf-btn-login:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(96,165,250,0.45);
        }
        .pf-btn-cancel {
          width: 100%;
          padding: 11px;
          border: 2px solid rgba(239,68,68,0.3);
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: rgba(239,68,68,0.07);
          color: #fca5a5;
          box-sizing: border-box;
          font-family: inherit;
        }
        .pf-btn-cancel:hover {
          background: rgba(239,68,68,0.15);
          border-color: rgba(239,68,68,0.5);
        }
        .pf-forgot-link {
          display: block;
          width: 100%;
          text-align: center;
          font-size: 13px;
          color: #60a5fa;
          background: none;
          border: none;
          cursor: pointer;
          padding: 8px;
          margin-bottom: 8px;
          text-decoration: underline;
          text-underline-offset: 2px;
          transition: color 0.2s ease;
          font-family: inherit;
        }
        .pf-forgot-link:hover { color: #93c5fd; }
        .pf-input.shake {
          animation: _shake 0.3s ease;
        }
        @keyframes _shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      </style>
      
      <div class="pf-header">
        <div class="pf-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h3>Acesso Identificado</h3>
        <p>Confirme os dados antes de entrar</p>
      </div>
      
      <div class="pf-field">
        <label class="pf-label">Nome do usuário</label>
        <div class="pf-input-wrapper">
          <input type="text" id="_nameInput" class="pf-input" value="${fullName}" placeholder="Digite seu nome" autocomplete="off" />
          <span class="pf-edit-hint">✏️</span>
        </div>
      </div>
      
      <div class="pf-field">
        <label class="pf-label">Permissão de acesso</label>
        <div class="perm-list" id="_permList">
          <div class="perm-item active" data-perm="admin" data-duration="null">
            <div class="perm-checkbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="perm-details">
              <div class="perm-name">Admin</div>
              <div class="perm-info">Acesso completo • Sem limite de tempo</div>
            </div>
          </div>

          <div class="perm-item" data-perm="ger" data-duration="4320000">
            <div class="perm-checkbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="perm-details">
              <div class="perm-name">Gerente</div>
              <div class="perm-info">Acesso gerente • 12 horas</div>
            </div>
          </div>
          
          <div class="perm-item" data-perm="fat" data-duration="21600000">
            <div class="perm-checkbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="perm-details">
              <div class="perm-name">Faturamento</div>
              <div class="perm-info">Acesso faturamento • 6 horas</div>
            </div>
          </div>
          
          <div class="perm-item" data-perm="vendedor" data-duration="10800000">
            <div class="perm-checkbox">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <div class="perm-details">
              <div class="perm-name">Vendedor</div>
              <div class="perm-info">Acesso vendas • 3 horas</div>
            </div>
          </div>
        </div>
      </div>
      
      <button class="pf-btn-login" id="_loginConfirmBtn">Entrar</button>
      <button class="pf-forgot-link" onclick="window._showForgotPassword()">Esqueci minha senha</button>
      <button class="pf-btn-cancel" onclick="window._cancelProfile()">Cancelar</button>
    `;

    container.appendChild(panel);

    // Comportamento de rádio para os itens de permissão
    let selectedPerm = 'admin';
    let selectedDuration = null;

    const permItems = panel.querySelectorAll('.perm-item[data-perm]');
    permItems.forEach(item => {
      item.addEventListener('click', function() {
        permItems.forEach(i => i.classList.remove('active'));
        this.classList.add('active');
        selectedPerm = this.dataset.perm;
        selectedDuration = this.dataset.duration === 'null' ? null : parseInt(this.dataset.duration);
      });
    });

    // Botão confirmar
    document.getElementById('_loginConfirmBtn').addEventListener('click', function() {
      const nameInput = document.getElementById('_nameInput');
      const name = nameInput.value.trim();

      if (!name) {
        _shake(nameInput);
        _showToast('Digite seu nome para continuar', 'warning');
        return;
      }

      if (!selectedPerm) {
        _showToast('Selecione uma permissão para continuar', 'warning');
        return;
      }

      const updatedSession = { ...currentBaseSession, fullName: name };
      panel.remove();
      _showRecognitionScreen(name, updatedSession, selectedPerm, selectedDuration);
    });
  }

  // Tela de reconhecimento animada
  function _showRecognitionScreen(name, baseSession, perm, duration) {
    const container = document.querySelector('.login-container');

    const panel = document.createElement('div');
    panel.id = '_recognitionPanel';
    panel.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 48px 40px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 11;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    `;

    const firstName = name.split(' ')[0];
    const permLabels = { admin: 'Admin', ger: 'Gerente', fat: 'Faturamento', vendedor: 'Vendedor' };
    const permLabel = permLabels[perm] || perm;

    panel.innerHTML = `
      <style>
        @keyframes _checkPop {
          0% { transform: scale(0); opacity: 0; }
          65% { transform: scale(1.18); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes _recogFade {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes _barLoad {
          from { width: 0%; }
          to { width: 100%; }
        }
        .recog-check-wrap {
          width: 88px;
          height: 88px;
          margin-bottom: 28px;
          background: linear-gradient(135deg, rgba(16,185,129,0.2) 0%, rgba(5,150,105,0.15) 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: _checkPop 0.55s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .recog-check-wrap svg {
          width: 42px;
          height: 42px;
          color: #10b981;
          stroke-width: 2.5;
        }
        .recog-label {
          font-size: 15px;
          color: #94a3b8;
          margin-bottom: 6px;
          animation: _recogFade 0.4s ease 0.35s both;
        }
        .recog-name {
          font-size: 36px;
          font-weight: 800;
          color: #60a5fa;
          margin-bottom: 18px;
          animation: _recogFade 0.4s ease 0.45s both;
          letter-spacing: -0.5px;
        }
        .recog-perm-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: 20px;
          background: rgba(96,165,250,0.12);
          border: 1px solid rgba(96,165,250,0.3);
          color: #93c5fd;
          font-size: 13px;
          font-weight: 600;
          margin-bottom: 28px;
          animation: _recogFade 0.4s ease 0.55s both;
        }
        .recog-sub {
          font-size: 13px;
          color: #64748b;
          animation: _recogFade 0.4s ease 0.65s both;
        }
        .recog-progress-wrap {
          width: 150px;
          height: 3px;
          background: #1e293b;
          border-radius: 3px;
          margin-top: 14px;
          overflow: hidden;
          animation: _recogFade 0.4s ease 0.75s both;
        }
        .recog-progress-fill {
          height: 100%;
          width: 0%;
          background: linear-gradient(90deg, #3b82f6, #60a5fa);
          border-radius: 3px;
          animation: _barLoad 1.8s ease 0.85s forwards;
        }
      </style>
      
      <div class="recog-check-wrap">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <div class="recog-label">Reconhecido,</div>
      <div class="recog-name">${firstName}</div>
      <div class="recog-perm-badge">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
          <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
        </svg>
        ${permLabel}
      </div>
      <p class="recog-sub">Preparando seu acesso...</p>
      <div class="recog-progress-wrap"><div class="recog-progress-fill"></div></div>
    `;

    container.appendChild(panel);
    _createSession(baseSession, perm, duration);
  }

  // Cancelar perfil
  window._cancelProfile = function() {
    const panel = document.getElementById('_profilePanel');
    if (panel) panel.remove();
    _closeDevPanel();
    _showToast('Operação cancelada', 'warning');
  };

  // Criar sessão e animar retorno ao login normal
  function _createSession(baseSession, perm, duration) {
    const now = Date.now();
    const session = {
      ...baseSession,
      perm: perm,
      duration: duration,
      start: now,
      lastActivity: now
    };

    localStorage.setItem('authSession', JSON.stringify(session));

    // Após a animação de reconhecimento, virar o card de volta e mostrar overlay de autenticação
    setTimeout(() => {
      const recogPanel = document.getElementById('_recognitionPanel');
      if (recogPanel) recogPanel.remove();

      // Desvirar o card (volta ao lado normal)
      const container = document.querySelector('.login-container');
      if (container) {
        container.classList.remove('flipped');
      }

      // Aguardar o flip terminar antes de mostrar o overlay
      setTimeout(() => {
        const overlayAuth = document.getElementById('overlayAuth');
        if (overlayAuth) {
          const h3 = overlayAuth.querySelector('h3');
          const p = overlayAuth.querySelector('p');
          if (h3) h3.textContent = 'Acesso Autorizado!';
          if (p) p.textContent = 'Redirecionando...';
          overlayAuth.classList.add('show');
        }

        setTimeout(() => {
          window.location.href = 'pages/selectsetor.html';
        }, 1200);
      }, 650);

    }, 2000);
  }

  // Popup "Esqueci minha senha"
  window._showForgotPassword = function() {
    if (document.getElementById('_forgotPopup')) return;

    const popup = document.createElement('div');
    popup.id = '_forgotPopup';
    popup.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.65);
      backdrop-filter: blur(6px);
      -webkit-backdrop-filter: blur(6px);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    `;

    popup.innerHTML = `
      <style>
        @keyframes _popupFadeIn { from { opacity:0; } to { opacity:1; } }
        @keyframes _popupIn {
          from { opacity:0; transform: scale(0.9) translateY(14px); }
          to { opacity:1; transform: scale(1) translateY(0); }
        }
        #_forgotPopup { animation: _popupFadeIn 0.2s ease; }
        #_forgotCard { animation: _popupIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275); }
        .fp-contact-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 14px 16px;
          background: #0f172a;
          border: 2px solid #334155;
          border-radius: 12px;
          margin-bottom: 10px;
          transition: border-color 0.2s ease;
        }
        .fp-contact-item:hover { border-color: #475569; }
        .fp-contact-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .fp-contact-icon svg { width: 20px; height: 20px; }
        .fp-contact-label {
          font-size: 11px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 3px;
        }
        .fp-contact-value {
          font-size: 16px;
          font-weight: 700;
          color: #e2e8f0;
        }
        .fp-close-btn {
          width: 100%;
          padding: 13px;
          border: none;
          border-radius: 12px;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 16px rgba(96,165,250,0.3);
          margin-top: 8px;
          font-family: inherit;
        }
        .fp-close-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(96,165,250,0.45);
        }
      </style>
      <div id="_forgotCard" style="
        background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        border: 1px solid #334155;
        border-radius: 20px;
        padding: 40px 36px;
        max-width: 380px;
        width: 100%;
        box-shadow: 0 25px 60px rgba(0,0,0,0.6);
        text-align: center;
      ">
        <div style="
          width:64px; height:64px;
          margin:0 auto 20px;
          padding:16px;
          background:rgba(96,165,250,0.12);
          border-radius:50%;
          color:#60a5fa;
        ">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:100%;height:100%">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <h3 style="font-size:20px;font-weight:700;color:#60a5fa;margin-bottom:10px;">Como trocar de senha?</h3>
        <p style="font-size:14px;color:#94a3b8;margin-bottom:24px;line-height:1.6;">
          Para redefinir sua senha, contate o gerente da filial. Usuários com permissão <strong style="color:#93c5fd">gerente</strong> ou superior podem alterar senhas no sistema.
        </p>
        <div class="fp-contact-item">
          <div class="fp-contact-icon" style="background:rgba(96,165,250,0.12)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.58 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </div>
          <div style="text-align:left;">
            <div class="fp-contact-label">Ramal Interno (TI)</div>
            <div class="fp-contact-value">302</div>
          </div>
        </div>
        <div class="fp-contact-item" style="background:rgba(16,185,129,0.07);border-color:rgba(16,185,129,0.25)">
          <div class="fp-contact-icon" style="background:rgba(16,185,129,0.15)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div style="text-align:left;">
            <div class="fp-contact-label">Solicite ao</div>
            <div class="fp-contact-value" style="color:#34d399">Gerente da filial</div>
          </div>
        </div>
        <button class="fp-close-btn" onclick="document.getElementById('_forgotPopup').remove()">Entendido</button>
      </div>
    `;

    document.body.appendChild(popup);
    popup.addEventListener('click', function(e) {
      if (e.target === popup) popup.remove();
    });
  };

  // Buscar localização
  function _getLocation() {
    _showLocationSearching();
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          _reverseGeocode(lat, lon);
        },
        (error) => {
          _askForCEP();
        },
        { timeout: 5000 }
      );
    } else {
      _askForCEP();
    }
  }

  // Tela de busca
  function _showLocationSearching() {
    const container = document.querySelector('.login-container');
    
    const panel = document.createElement('div');
    panel.id = '_locationPanel';
    panel.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 48px 40px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    `;

    panel.innerHTML = `
      <style>
        .search-icon {
          width: 80px;
          height: 80px;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
          border-radius: 50%;
          color: #60a5fa;
          animation: _pulse 2s ease infinite;
        }
        
        .search-icon svg {
          width: 100%;
          height: 100%;
          animation: _rotate 3s linear infinite;
        }
        
        @keyframes _pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        
        @keyframes _rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .search-title {
          font-size: 22px;
          font-weight: 700;
          color: #60a5fa;
          margin-bottom: 12px;
        }
        
        .search-text {
          font-size: 14px;
          color: #94a3b8;
          line-height: 1.6;
        }
      </style>
      
      <div class="search-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
      </div>
      <h3 class="search-title">Buscando Localização</h3>
      <p class="search-text">Detectando sua cidade...</p>
    `;

    container.appendChild(panel);
  }

  // Reverter geocodificação
  function _reverseGeocode(lat, lon) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`)
      .then(res => res.json())
      .then(data => {
        const city = (data.address.city || data.address.town || data.address.village || 'desconhecida').toLowerCase();
        _showLocationResult(city);
      })
      .catch(() => {
        _askForCEP();
      });
  }

  // Pedir CEP
  function _askForCEP() {
    const panel = document.getElementById('_locationPanel');
    if (panel) panel.remove();

    const container = document.querySelector('.login-container');
    
    const cepPanel = document.createElement('div');
    cepPanel.id = '_cepPanel';
    cepPanel.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 48px 40px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 10;
    `;

    cepPanel.innerHTML = `
      <style>
        .cep-header {
          text-align: center;
          margin-bottom: 28px;
        }
        .cep-header-icon {
          width: 64px; height: 64px;
          margin: 0 auto 18px;
          padding: 16px;
          background: linear-gradient(135deg, rgba(96,165,250,0.2) 0%, rgba(59,130,246,0.15) 100%);
          border-radius: 50%;
          color: #60a5fa;
        }
        .cep-header-icon svg { width: 100%; height: 100%; }
        .cep-header h3 {
          font-size: 21px;
          font-weight: 700;
          color: #e2e8f0;
          margin-bottom: 8px;
        }
        .cep-header p {
          font-size: 13px;
          color: #64748b;
          line-height: 1.55;
        }
        .cep-gps-failed {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.2);
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 12px;
          color: #fca5a5;
        }
        .cep-gps-failed svg { flex-shrink:0; width:16px; height:16px; }
        .cep-input-wrapper {
          position: relative;
          margin-bottom: 14px;
        }
        .cep-input-wrapper input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #334155;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          background: #0f172a;
          color: #e2e8f0;
          text-align: center;
          letter-spacing: 2px;
          font-family: 'Courier New', monospace;
          transition: border-color 0.2s ease, box-shadow 0.2s ease;
          box-sizing: border-box;
        }
        .cep-input-wrapper input:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.12);
        }
        .cep-input-wrapper input::placeholder {
          color: #334155;
          letter-spacing: 1px;
          font-size: 15px;
          font-weight: 400;
        }
        .cep-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 10px;
          font-family: inherit;
          box-sizing: border-box;
        }
        .cep-btn.primary {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
          box-shadow: 0 4px 16px rgba(96,165,250,0.25);
        }
        .cep-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(96, 165, 250, 0.4);
        }
        .cep-btn.secondary {
          background: transparent;
          border: 2px solid #334155;
          color: #64748b;
        }
        .cep-btn.secondary:hover {
          background: #1e293b;
          border-color: #475569;
          color: #94a3b8;
        }
        .cep-hint-text {
          font-size: 11px;
          color: #475569;
          text-align: center;
          margin-bottom: 16px;
          line-height: 1.5;
        }
      </style>
      
      <div class="cep-header">
        <div class="cep-header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
        </div>
        <h3>Confirme sua localização</h3>
        <p>Informe seu CEP para identificarmos sua cidade de acesso</p>
      </div>

      <div class="cep-gps-failed">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="15" y1="9" x2="9" y2="15"></line>
          <line x1="9" y1="9" x2="15" y2="15"></line>
        </svg>
        Localização automática (GPS) indisponível
      </div>
      
      <div class="cep-input-wrapper">
        <input 
          type="text" 
          id="_cepInput" 
          placeholder="00000-000" 
          maxlength="9"
          autocomplete="off"
          inputmode="numeric"
        />
      </div>
      
      <p class="cep-hint-text">Usamos apenas a cidade do CEP — nenhum dado pessoal é armazenado</p>
      
      <button class="cep-btn primary" onclick="window._searchCEP()">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16" style="vertical-align:middle;margin-right:6px;margin-top:-2px">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        Buscar cidade
      </button>
      <button class="cep-btn secondary" onclick="window._closeCEPPanel()">Cancelar</button>
    `;

    container.appendChild(cepPanel);
    setTimeout(() => document.getElementById('_cepInput').focus(), 100);

    // Formatar CEP automaticamente
    const input = document.getElementById('_cepInput');
    input.addEventListener('input', function(e) {
      let value = e.target.value.replace(/\D/g, '');
      if (value.length > 5) {
        value = value.slice(0, 5) + '-' + value.slice(5, 8);
      }
      e.target.value = value;
    });

    input.addEventListener('keypress', function(e) {
      if (e.key === 'Enter') window._searchCEP();
    });
  }

  // Buscar por CEP
  window._searchCEP = function() {
    const input = document.getElementById('_cepInput');
    const cep = input.value.replace(/\D/g, '');

    if (cep.length !== 8) {
      _shake(input);
      _showToast('CEP inválido', 'error');
      return;
    }

    const panel = document.getElementById('_cepPanel');
    if (panel) panel.remove();
    
    _showLocationSearching();

    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then(res => res.json())
      .then(data => {
        if (data.erro) {
          _showCEPNotFound();
        } else {
          const city = data.localidade.toLowerCase();
          _showLocationResult(city);
        }
      })
      .catch(() => {
        _showToast('Erro ao buscar CEP', 'error');
        _closeDevPanel();
      });
  };

  // CEP não encontrado
  function _showCEPNotFound() {
    const panel = document.getElementById('_locationPanel');
    if (panel) panel.remove();

    const container = document.querySelector('.login-container');
    
    const errorPanel = document.createElement('div');
    errorPanel.id = '_errorPanel';
    errorPanel.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 48px 40px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    `;

    errorPanel.innerHTML = `
      <style>
        .error-icon-big {
          width: 80px;
          height: 80px;
          margin-bottom: 24px;
          padding: 20px;
          background: rgba(239, 68, 68, 0.1);
          border-radius: 50%;
          color: #ef4444;
        }
        
        .error-icon-big svg {
          width: 100%;
          height: 100%;
        }
        
        .error-title-big {
          font-size: 22px;
          font-weight: 700;
          color: #fca5a5;
          margin-bottom: 12px;
        }
        
        .error-text-big {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 32px;
          line-height: 1.6;
        }
        
        .error-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 10px;
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
        }
        
        .error-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(96, 165, 250, 0.4);
        }
        
        .error-btn.secondary {
          background: #334155;
        }
        
        .error-btn.secondary:hover {
          background: #475569;
          box-shadow: none;
        }
      </style>
      
      <div class="error-icon-big">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h3 class="error-title-big">CEP Não Encontrado</h3>
      <p class="error-text-big">Desculpe, não conseguimos encontrar seu CEP.<br>Você pode buscar na internet.</p>
      
      <button class="error-btn" onclick="window.open('https://buscacepinter.correios.com.br/app/endereco/index.php', '_blank')">Buscar CEP na Internet</button>
      <button class="error-btn secondary" onclick="window._closeCEPPanel()">Cancelar</button>
    `;

    container.appendChild(errorPanel);
  }

  // Fechar painel CEP
  window._closeCEPPanel = function() {
    const panel = document.getElementById('_cepPanel') || document.getElementById('_errorPanel');
    if (panel) panel.remove();
    _closeDevPanel();
  };

  // Mostrar resultado da localização
  function _showLocationResult(city) {
    const panel = document.getElementById('_locationPanel');
    if (panel) panel.remove();

    const container = document.querySelector('.login-container');
    
    const resultPanel = document.createElement('div');
    resultPanel.id = '_resultPanel';
    resultPanel.style.cssText = `
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 48px 40px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 10;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    `;

    resultPanel.innerHTML = `
      <style>
        .result-icon {
          width: 80px;
          height: 80px;
          margin-bottom: 24px;
          padding: 20px;
          background: linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.2) 100%);
          border-radius: 50%;
          color: #10b981;
        }
        
        .result-icon svg {
          width: 100%;
          height: 100%;
        }
        
        .result-title {
          font-size: 22px;
          font-weight: 700;
          color: #60a5fa;
          margin-bottom: 12px;
        }
        
        .result-city {
          font-size: 32px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 24px;
          font-family: 'Courier New', monospace;
        }
        
        .result-text {
          font-size: 14px;
          color: #94a3b8;
          margin-bottom: 32px;
        }
        
        .result-btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 10px;
        }
        
        .result-btn.primary {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
        }
        
        .result-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(96, 165, 250, 0.4);
        }
        
        .result-btn.secondary {
          background: transparent;
          border: 2px solid #334155;
          color: #94a3b8;
        }
        
        .result-btn.secondary:hover {
          border-color: #475569;
          background: #1e293b;
        }
      </style>
      
      <div class="result-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      </div>
      <h3 class="result-title">Cidade Detectada</h3>
      <div class="result-city">${city}</div>
      <p class="result-text">Cidade copiada para a área de transferência</p>
      
      <button class="result-btn primary" id="_resultCloseBtn">Fechar</button>
      <button class="result-btn secondary" id="_resultWrongCityBtn">Cidade incorreta?</button>
    `;

    container.appendChild(resultPanel);

    // Botão Fechar: em mock volta ao menu de mock, fora do mock mantém card virado
    document.getElementById('_resultCloseBtn').addEventListener('click', () => {
      resultPanel.remove();
      if (_isMock) {
        _isMock = false;
        _showMockOptions();
      }
      // fora de mock: card continua virado (comportamento original)
    });

    // Botão "Cidade incorreta?": em mock volta ao mock, fora do mock vai pro CEP
    document.getElementById('_resultWrongCityBtn').addEventListener('click', () => {
      resultPanel.remove();
      if (_isMock) {
        _askForCEP(); // no CEP em modo mock, fechar vai para mock options via _closeCEPPanel
      } else {
        _askForCEP();
      }
    });

    // Copiar para clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(city);
    }

    _showToast(`Localização: ${city}`, 'success');
  }

  // Fechar resultado (mantido para compatibilidade, usado em chamadas antigas se existirem)
  window._closeLocationResult = function() {
    const panel = document.getElementById('_resultPanel');
    if (panel) panel.remove();
    if (_isMock) { _isMock = false; _showMockOptions(); }
  };

  // Fechar painel dev
  window._closeDevPanel = function() {
    ['_devPanel','_profilePanel','_recognitionPanel','_locationPanel',
     '_cepPanel','_errorPanel','_resultPanel','_mockPanel','_mockBlockPanel',
     '_mockBlockBanner','_mockDeniedBanner'
    ].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.remove();
    });
    _isMock = false;

    // Desvirar card
    const container = document.querySelector('.login-container');
    if (container) container.classList.remove('flipped');
  };

  // ===== MOCK FUNCTIONS =====

  function _showMockOptions() {
    const container = document.querySelector('.login-container');
    const panel = document.createElement('div');
    panel.id = '_mockPanel';
    panel.style.cssText = `
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px;
      padding: 36px 28px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 12;
      overflow-y: auto;
    `;

    panel.innerHTML = `
      <style>
        @keyframes _mkIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        #_mockPanel .mk-header { text-align:center; margin-bottom:24px; animation:_mkIn .3s ease; }
        #_mockPanel .mk-badge {
          display:inline-flex; align-items:center; gap:6px;
          padding:3px 12px;
          background:rgba(245,158,11,.15); border:1px solid rgba(245,158,11,.35);
          border-radius:20px; font-size:11px; font-weight:700; color:#fbbf24;
          text-transform:uppercase; letter-spacing:.8px; margin-bottom:12px;
        }
        #_mockPanel h3 { font-size:21px; font-weight:700; color:#e2e8f0; margin-bottom:4px; }
        #_mockPanel .mk-sub { font-size:13px; color:#64748b; }        .mk-option {
          display:flex; align-items:center; gap:16px;
          width:100%; padding:17px 18px; margin-bottom:10px;
          background:#0f172a; border:2px solid #1e293b; border-radius:14px;
          cursor:pointer; transition:all .2s ease; text-align:left; font-family:inherit;
          animation:_mkIn .3s ease both;
        }
        .mk-option:nth-child(1){animation-delay:.05s}
        .mk-option:nth-child(2){animation-delay:.1s}
        .mk-option:nth-child(3){animation-delay:.15s}
        .mk-option:hover { border-color:#334155; background:#1a2234; transform:translateX(4px); }
        .mk-icon {
          width:44px; height:44px; border-radius:12px;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .mk-icon svg { width:22px; height:22px; }
        .mk-title { font-size:15px; font-weight:700; color:#e2e8f0; margin-bottom:3px; }
        .mk-desc { font-size:12px; color:#64748b; line-height:1.4; }
        .mk-hr { border:none; border-top:1px solid #1e293b; margin:14px 0; }
        .mk-cancel {
          width:100%; padding:12px;
          border:2px solid #334155; border-radius:12px;
          background:transparent; color:#64748b;
          font-size:14px; font-weight:600; cursor:pointer;
          transition:all .2s ease; font-family:inherit;
          animation:_mkIn .3s ease .2s both;
        }
        .mk-cancel:hover { background:#1e293b; color:#94a3b8; border-color:#475569; }
      </style>

      <div class="mk-header">
        <div class="mk-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
          </svg>
          Mock Mode
        </div>
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="#e2e8f0" stroke-width="2" width="18" height="18" style="vertical-align:middle;margin-right:6px;margin-top:-3px">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"></path>
          </svg>
          Funções de Teste
        </h3>
        <p class="mk-sub">Escolha uma função para testar de forma independente</p>
      </div>

      <div>
        <button class="mk-option" id="_mkGPS">
          <div class="mk-icon" style="background:rgba(96,165,250,.12)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#60a5fa" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
          </div>
          <div>
            <div class="mk-title">Pegar Local</div>
            <div class="mk-desc">Testa GPS e geocoding reverso — exibe a cidade detectada</div>
          </div>
        </button>

        <button class="mk-option" id="_mkCEP">
          <div class="mk-icon" style="background:rgba(16,185,129,.12)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
              <line x1="8" y1="21" x2="16" y2="21"></line>
              <line x1="12" y1="17" x2="12" y2="21"></line>
            </svg>
          </div>
          <div>
            <div class="mk-title">Buscar CEP</div>
            <div class="mk-desc">Abre o input de CEP e consulta a API ViaCEP diretamente</div>
          </div>
        </button>

        <button class="mk-option" id="_mkBlock">
          <div class="mk-icon" style="background:rgba(239,68,68,.12)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
            </svg>
          </div>
          <div>
            <div class="mk-title">Bloqueio do Local</div>
            <div class="mk-desc">Simula a tela de acesso negado por localização não autorizada</div>
          </div>
        </button>

        <button class="mk-option" id="_mkLogo">
          <div class="mk-icon" style="background:rgba(168,85,247,.12)">
            <svg viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
          </div>
          <div>
            <div class="mk-title">Baixar Logotipos</div>
            <div class="mk-desc">Abre popup com as imagens dos logotipos disponíveis</div>
          </div>
        </button>
      </div>

      <hr class="mk-hr">
      <button class="mk-cancel" onclick="window._closeDevPanel()">Cancelar</button>
    `;

    container.appendChild(panel);

    document.getElementById('_mkGPS').addEventListener('click', () => { panel.remove(); _mockPegarLocal(); });
    document.getElementById('_mkCEP').addEventListener('click', () => { panel.remove(); _mockBuscarCEP(); });
    document.getElementById('_mkBlock').addEventListener('click', () => { panel.remove(); _mockBloqueioLocal(); });
    document.getElementById('_mkLogo').addEventListener('click', () => { panel.remove(); _mockGetLogo(); });
  }

  // MOCK: GPS
  function _mockPegarLocal() {
    _isMock = true;
    _showToast('Mock ativo — testando GPS...', 'warning');
    _getLocation();
  }

  // MOCK: CEP direto
  function _mockBuscarCEP() {
    _showToast('Mock ativo — testando busca por CEP...', 'warning');
    _askForCEP();
  }

  // MOCK: Get Logo - abrir painel de download de imagens
  function _mockGetLogo() {
    // Pequeno delay para evitar conflitos com remoção do painel anterior
    setTimeout(() => {
      if (typeof window.showImageDownloadPanel === 'function') {
        try {
          window.showImageDownloadPanel();
        } catch (err) {
          console.error('Erro ao abrir painel de imagens:', err);
          _showToast('Erro ao abrir imagens — verifique o console', 'error');
        }
      } else {
        _showToast('Função de imagens não carregada ainda', 'warning');
      }
    }, 100);
  }

  // MOCK: Bloqueio de local
  // MOCK: Bloqueio de local — simula o fluxo real: GPS tenta → banner vermelho → CEP
  function _mockBloqueioLocal() {
    _showToast('Mock ativo — simulando GPS bloqueado pelo navegador...', 'warning');

    // Passo 1: mostrar tela "buscando localização"
    _showLocationSearching();

    // Passo 2: após 1.8s simular rejeição do navegador
    setTimeout(function() {
      var locPanel = document.getElementById('_locationPanel');
      if (locPanel) locPanel.remove();

      // Mostrar banner vermelho idêntico ao do fluxo real
      _showMockDeniedBanner();

      // Passo 3: após 2.8s abrir painel CEP (banner ainda visível)
      setTimeout(function() {
        _askForCEP();
      }, 2800);
    }, 1800);
  }

  // Banner vermelho de localização bloqueada
  function _showMockDeniedBanner() {
    var existing = document.getElementById('_mockDeniedBanner');
    if (existing) existing.remove();

    var banner = document.createElement('div');
    banner.id = '_mockDeniedBanner';
    banner.style.cssText = [
      'position:fixed',
      'top:0','left:0','right:0',
      'z-index:99999',
      'display:flex',
      'align-items:flex-start',
      'justify-content:flex-start',
      'padding:12px 16px',
      'pointer-events:none'
    ].join(';');

    banner.innerHTML = '<style>' +
      '@keyframes _mdbIn{from{opacity:0;transform:translateY(-20px)}to{opacity:1;transform:translateY(0)}}' +
      '@keyframes _mdbOut{from{opacity:1;transform:translateY(0)}to{opacity:0;transform:translateY(-20px)}}' +
      '@keyframes _mdbShake{0%,100%{transform:translateX(0)}15%{transform:translateX(-5px)}35%{transform:translateX(5px)}55%{transform:translateX(-3px)}75%{transform:translateX(3px)}}' +
      '@keyframes _mdbPulse{0%,100%{box-shadow:0 8px 32px rgba(185,28,28,.45),0 0 0 1px rgba(255,255,255,.08)}50%{box-shadow:0 8px 44px rgba(220,38,38,.7),0 0 0 2px rgba(255,120,120,.2)}}' +
      '#_mdbInner{display:flex;align-items:center;gap:12px;padding:12px 18px;background:linear-gradient(135deg,#7f1d1d 0%,#b91c1c 100%);border-radius:14px;max-width:420px;' +
        'animation:_mdbIn .4s cubic-bezier(.175,.885,.32,1.275) forwards,_mdbPulse 2s ease .6s infinite}' +
      '#_mdbIconWrap{width:36px;height:36px;background:rgba(0,0,0,.22);border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;animation:_mdbShake .45s ease .5s}' +
      '#_mdbIconWrap svg{width:18px;height:18px}' +
      '#_mdbText{line-height:1.45}' +
      '#_mdbTitle{font-size:13px;font-weight:700;color:#fff;margin-bottom:2px}' +
      '#_mdbSub{font-size:12px;color:#fca5a5}' +
      '</style>' +
      '<div id="_mdbInner">' +
        '<div id="_mdbIconWrap">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="#fca5a5" stroke-width="2.5">' +
            '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>' +
            '<path d="M7 11V7a5 5 0 0 1 10 0v4"></path>' +
          '</svg>' +
        '</div>' +
        '<div id="_mdbText">' +
          '<div id="_mdbTitle">Localização bloqueada pelo navegador</div>' +
          '<div id="_mdbSub">Clique no <strong style="color:#fff">ícone de cadeado</strong> na barra de endere\u00E7o para permitir \u2014 ou informe seu CEP abaixo</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);

    // Remove após 6s
    setTimeout(function() {
      banner.style.animation = '_mdbOut .4s ease forwards';
      setTimeout(function() { banner.remove(); }, 400);
    }, 6000);
  }

  // Shake animation
  function _shake(element) {
    element.classList.add('shake');
    setTimeout(() => element.classList.remove('shake'), 300);
  }

  // Usar o toast do sistema
  function _showToast(message, type = 'error') {
    // Tentar usar a função showToast global do auth-login.js
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
      return;
    }

    // Fallback caso não exista
    const toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) return;

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
    }, 3000);
  }


})();
