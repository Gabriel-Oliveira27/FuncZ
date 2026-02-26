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
      secrets: ['gabriel*27', 'loja02', 'funcz2026', 'tests2026'],
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
    }
  };

  let currentBaseSession = null;

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
      
      <h3>🔐 Dev Access</h3>
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
      _showToast('❌ Código inválido', 'error');
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

    // Tipo auth - verificar palavra secreta
    const secretInput = document.getElementById('_secretInput');
    const secret = secretInput.value.trim();

    if (!secret) {
      _shake(secretInput);
      _showToast('⚠️ Digite a palavra secreta', 'warning');
      return;
    }

    if (!config.secrets.includes(secret)) {
      _shake(secretInput);
      _showToast('❌ Palavra secreta incorreta', 'error');
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
      padding: 40px 32px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 11;
      overflow-y: auto;
    `;

    panel.innerHTML = `
      <style>
        .profile-header {
          text-align: center;
          margin-bottom: 32px;
        }
        
        .profile-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto 16px;
          padding: 14px;
          background: linear-gradient(135deg, rgba(96, 165, 250, 0.2) 0%, rgba(59, 130, 246, 0.2) 100%);
          border-radius: 50%;
          color: #60a5fa;
        }
        
        .profile-icon svg {
          width: 100%;
          height: 100%;
        }
        
        .profile-header h3 {
          font-size: 22px;
          font-weight: 700;
          color: #60a5fa;
          margin-bottom: 8px;
        }
        
        .profile-header p {
          font-size: 14px;
          color: #94a3b8;
        }
        
        .profile-options {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .profile-btn {
          width: 100%;
          padding: 16px 18px;
          border: 2px solid #334155;
          border-radius: 12px;
          background: #0f172a;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 15px;
          font-weight: 600;
          color: #e2e8f0;
        }
        
        .profile-btn:hover {
          border-color: #60a5fa;
          background: #1e293b;
          transform: translateX(4px);
        }
        
        .profile-btn.cancel {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.3);
          color: #fca5a5;
        }
        
        .profile-btn.cancel:hover {
          background: rgba(239, 68, 68, 0.2);
          border-color: rgba(239, 68, 68, 0.5);
        }
        
        .profile-icon-small {
          width: 24px;
          height: 24px;
          color: #60a5fa;
          flex-shrink: 0;
        }
        
        .profile-btn.cancel .profile-icon-small {
          color: #ef4444;
        }
        
        .profile-details {
          display: flex;
          flex-direction: column;
          gap: 2px;
          flex: 1;
          text-align: left;
        }
        
        .profile-name {
          font-size: 15px;
          font-weight: 600;
        }
        
        .profile-info {
          font-size: 12px;
          color: #64748b;
          font-weight: 400;
        }
      </style>
      
      <div class="profile-header">
        <div class="profile-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
        </div>
        <h3>Escolha o Perfil</h3>
        <p>Selecione como deseja acessar</p>
      </div>
      
      <div class="profile-options">
        <button class="profile-btn" data-perm="admin" data-duration="null">
          <svg class="profile-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
            <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
          </svg>
          <div class="profile-details">
            <div class="profile-name">Admin</div>
            <div class="profile-info">Acesso completo • Ilimitado</div>
          </div>
        </button>
        
        <button class="profile-btn" data-perm="fat" data-duration="21600000">
          <svg class="profile-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
          </svg>
          <div class="profile-details">
            <div class="profile-name">Faturamento</div>
            <div class="profile-info">Acesso faturamento • 6 horas</div>
          </div>
        </button>
        
        <button class="profile-btn" data-perm="vendedor" data-duration="10800000">
          <svg class="profile-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="9" cy="21" r="1"></circle>
            <circle cx="20" cy="21" r="1"></circle>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
          </svg>
          <div class="profile-details">
            <div class="profile-name">Vendedor</div>
            <div class="profile-info">Acesso vendas • 3 horas</div>
          </div>
        </button>
        
        <button class="profile-btn cancel" onclick="window._cancelProfile()">
          <svg class="profile-icon-small" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
          <div class="profile-details">
            <div class="profile-name">Cancelar</div>
            <div class="profile-info">Voltar sem fazer login</div>
          </div>
        </button>
      </div>
    `;

    container.appendChild(panel);

    // Adicionar eventos
    const profileBtns = panel.querySelectorAll('.profile-btn[data-perm]');
    profileBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const perm = this.dataset.perm;
        const duration = this.dataset.duration === 'null' ? null : parseInt(this.dataset.duration);
        _createSession(currentBaseSession, perm, duration);
        panel.remove();
      });
    });
  }

  // Cancelar perfil
  window._cancelProfile = function() {
    const panel = document.getElementById('_profilePanel');
    if (panel) panel.remove();
    _closeDevPanel();
    _showToast('⚠️ Operação cancelada', 'warning');
  };

  // Criar sessão
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
    _showToast('✅ Sessão criada!', 'success');
    
    // NÃO fecha o card, apenas recarrega
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

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
          margin-bottom: 32px;
        }
        
        .cep-header h3 {
          font-size: 22px;
          font-weight: 700;
          color: #60a5fa;
          margin-bottom: 8px;
        }
        
        .cep-header p {
          font-size: 14px;
          color: #94a3b8;
        }
        
        .cep-input-wrapper {
          position: relative;
          margin-bottom: 16px;
        }
        
        .cep-input-wrapper input {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #334155;
          border-radius: 12px;
          font-size: 16px;
          background: #0f172a;
          color: #e2e8f0;
          text-align: center;
          letter-spacing: 1px;
        }
        
        .cep-input-wrapper input:focus {
          outline: none;
          border-color: #60a5fa;
          box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
        }
        
        .cep-input-wrapper input::placeholder {
          color: #475569;
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
        }
        
        .cep-btn.primary {
          background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
          color: white;
        }
        
        .cep-btn.primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 24px rgba(96, 165, 250, 0.4);
        }
        
        .cep-btn.secondary {
          background: #334155;
          color: #e2e8f0;
        }
        
        .cep-btn.secondary:hover {
          background: #475569;
        }
      </style>
      
      <div class="cep-header">
        <h3>📍 Digite seu CEP</h3>
        <p>Informe seu CEP para continuar</p>
      </div>
      
      <div class="cep-input-wrapper">
        <input 
          type="text" 
          id="_cepInput" 
          placeholder="00000-000" 
          maxlength="9"
          autocomplete="off"
        />
      </div>
      
      <button class="cep-btn primary" onclick="window._searchCEP()">Buscar</button>
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
      
      <button class="result-btn primary" onclick="window._closeLocationResult()">Fechar</button>
      <button class="result-btn secondary" onclick="window._askForCEP()">Cidade incorreta?</button>
    `;

    container.appendChild(resultPanel);

    // Copiar para clipboard
    if (navigator.clipboard) {
      navigator.clipboard.writeText(city);
    }

    _showToast(`Localização: ${city}`, 'success');
  }

  // Fechar resultado
  window._closeLocationResult = function() {
    const panel = document.getElementById('_resultPanel');
    if (panel) panel.remove();
    // NÃO chama _closeDevPanel - mantém card virado
  };

  // Fechar painel dev
  window._closeDevPanel = function() {
    const panel = document.getElementById('_devPanel');
    const profilePanel = document.getElementById('_profilePanel');
    const locationPanel = document.getElementById('_locationPanel');
    const cepPanel = document.getElementById('_cepPanel');
    const errorPanel = document.getElementById('_errorPanel');
    const resultPanel = document.getElementById('_resultPanel');
    
    if (panel) panel.remove();
    if (profilePanel) profilePanel.remove();
    if (locationPanel) locationPanel.remove();
    if (cepPanel) cepPanel.remove();
    if (errorPanel) errorPanel.remove();
    if (resultPanel) resultPanel.remove();

    // Desvirar card
    const container = document.querySelector('.login-container');
    if (container) {
      container.classList.remove('flipped');
    }
  };

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
