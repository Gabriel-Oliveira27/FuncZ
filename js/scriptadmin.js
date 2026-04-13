(() => {
  // ======================
  // CONFIG - troque esta URL
  // ======================
  const WORKER_URL = 'https://conexao-fallback-3.gab-oliveirab27.workers.dev/';

  // ======================
  // Regras de acesso por perfil
  // ======================
  const ACCESS_RULES = {
    painel:       ['admin', 'suporte', 'ger', 'gerente'],
    criarUsuario: ['admin', 'suporte'],
    criarProduto: ['admin', 'suporte', 'ger', 'gerente'],
  };
  function getSession() {
    try {
      if (window.SessionGuard?.getSessionData) { const s = window.SessionGuard.getSessionData(); if (s) return s; }
      const raw = localStorage.getItem('authSession');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  function canAccess(rule) {
    const session = getSession();
    if (!session) return false;
    return (ACCESS_RULES[rule] || []).includes(String(session.perm || '').toLowerCase());
  }
  function getSessionUser() {
    const s = getSession();
    return s ? (s.user || s.nome || 'desconhecido') : 'desconhecido';
  }

  function getSession() {
    try {
      if (window.SessionGuard?.getSessionData) {
        const s = window.SessionGuard.getSessionData();
        if (s) return s;
      }
      const raw = localStorage.getItem('authSession');
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function canAccess(rule) {
    const session = getSession();
    if (!session) return false;
    const perm = String(session.perm || '').toLowerCase();
    return (ACCESS_RULES[rule] || []).includes(perm);
  }

  function getSessionUser() {
    const session = getSession();
    return session ? (session.user || session.nome || 'desconhecido') : 'desconhecido';
  }

  // ======================
  // Utilitários: Toast redesenhado com SVG
  // ======================
  const DEFAULT_TOAST_DURATION = 4000;

  const TOAST_ICONS = {
    success: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error:   '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
    info:    '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
  };
  const TOAST_COLORS = {
    success: { border: '#16a34a', bg: '#f0fdf4' },
    error:   { border: '#dc2626', bg: '#fef2f2' },
    warning: { border: '#d97706', bg: '#fffbeb' },
    info:    { border: '#2563eb', bg: '#eff6ff' },
  };

  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      Object.assign(c.style, { position:'fixed', bottom:'1.25rem', right:'1.25rem',
        zIndex:9999, display:'flex', flexDirection:'column', gap:'.5rem', pointerEvents:'none' });
      document.body.appendChild(c);
    }
    return c;
  }
  function showToast(message, type = 'info', duration = DEFAULT_TOAST_DURATION) {
    const container = ensureToastContainer();
    const colors = TOAST_COLORS[type] || TOAST_COLORS.info;
    const icon   = TOAST_ICONS[type]  || TOAST_ICONS.info;
    const t = document.createElement('div');
    Object.assign(t.style, {
      display:'flex', alignItems:'flex-start', gap:'10px',
      padding:'12px 14px', borderRadius:'8px',
      background: colors.bg, borderLeft: '3px solid ' + colors.border,
      boxShadow:'0 4px 16px rgba(0,0,0,.10)',
      minWidth:'260px', maxWidth:'340px',
      pointerEvents:'all', animation:'toastSlideIn .25s ease',
      transition:'opacity .2s, transform .2s',
    });
    const iconEl = document.createElement('span');
    iconEl.innerHTML = icon;
    iconEl.style.cssText = 'color:'+colors.border+';flex-shrink:0;margin-top:1px';
    const msgEl = document.createElement('span');
    msgEl.style.cssText = 'font-size:.84rem;color:#1e293b;line-height:1.4';
    msgEl.textContent = message;
    t.appendChild(iconEl); t.appendChild(msgEl);
    container.appendChild(t);
    if (!document.getElementById('_tk')) {
      const s = document.createElement('style');
      s.id = '_tk';
      s.textContent = '@keyframes toastSlideIn{from{opacity:0;transform:translateX(12px)}to{opacity:1;transform:none}}';
      document.head.appendChild(s);
    }
    setTimeout(() => { t.style.opacity='0'; t.style.transform='translateX(8px)'; setTimeout(()=>t.remove(),220); }, duration);
    return t;
  }

  // ======================
  // Helpers
  // ======================
  function safeGet(id) {
    return document.getElementById(id) || null;
  }

  function parseBRLtoNumber(value) {
    // 'R$ 1.234,56'  -> '1234.56'
    if (!value) return '';
    const cleaned = String(value).replace(/\s/g, '').replace('R$', '').replace(/\./g, '').replace(',', '.');
    // se vazio
    if (cleaned === '' || isNaN(Number(cleaned))) return '';
    // retorna como string com ponto decimal
    return Number(cleaned).toFixed(2);
  }

  // DEBUG sendToWorker — substitua temporariamente por esta versão para investigar
async function sendToWorker(action, data) {
  try {
    // monta o corpo que vamos enviar (flatten: action + campos)
    const bodyObj = Object.assign({ action }, (data || {}));
    const bodyText = JSON.stringify(bodyObj);

    // loga o que será enviado (vai aparecer no Console -> Network -> Request Payload também)
    

    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyText
    });

    // pega o texto cru que o Worker/GAS retornou
    const text = await resp.text();

    // loga status HTTP e texto cru
    

    // tenta parsear JSON, mas mesmo que falhe devolve o texto cru
    try {
      const parsed = JSON.parse(text);
     
      return parsed;
    } catch (err) {
     
      return { status: 'error', message: 'Resposta não-JSON', raw: text };
    }
  } catch (err) {
   
    return { status: 'error', message: err.message || 'Falha na requisição' };
  }
}




  // ======================
  // Executa após DOM carregado
  // ======================
  document.addEventListener('DOMContentLoaded', () => {

    // ======================
    // Controle de acesso ao painel
    // ======================
    if (!canAccess('painel')) {
      // Oculta seções restritas e exibe aviso
      document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
      const welcomeEl = document.getElementById('welcome');
      if (welcomeEl) {
        welcomeEl.classList.add('active');
        const sub = welcomeEl.querySelector('.welcome-subtitle');
        if (sub) sub.textContent = 'Você não tem permissão para acessar o painel administrativo.';
      }
    }

    // Oculta "Criar Usuário" para perfis sem permissão
    if (!canAccess('criarUsuario')) {
      const sidebarCriarUsuario = document.querySelector('.sidebar-item[data-section="usuario"]');
      const sectionUsuario = document.getElementById('usuario');
      if (sidebarCriarUsuario) sidebarCriarUsuario.style.display = 'none';
      if (sectionUsuario) sectionUsuario.style.display = 'none';
    }

    // Elementos (verifica se existem antes)
    const themeToggle = safeGet('themeToggle');
    const themeText = safeGet('themeText');
    const themeIcon = safeGet('themeIcon');
    const body = document.body;

    // Inicializa tema salvo (se existir)
    const savedTheme = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    if (themeText && themeIcon) updateThemeUI(savedTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        if (themeText && themeIcon) updateThemeUI(newTheme);
      });
    }

    function updateThemeUI(theme) {
      if (!themeText || !themeIcon) return;
      if (theme === 'dark') {
        themeText.textContent = 'Tema Escuro';
        themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path>';
      } else {
        themeText.textContent = 'Tema Claro';
        themeIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path>';
      }
    }

    // Sidebar
    const hamburger = safeGet('hamburger');
    const sidebar = safeGet('sidebar');
    const sidebarOverlay = safeGet('sidebarOverlay');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        if (sidebar) sidebar.classList.toggle('active');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
      });
    }
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        if (hamburger) hamburger.classList.remove('active');
        if (sidebar) sidebar.classList.remove('active');
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
      });
    }

    // Nav shortcuts (safe)
    const backToTopBtn = safeGet('backToTopBtn');
    if (backToTopBtn) backToTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    const homeNav = safeGet('homeNav');
    const sidebarItems = Array.from(document.querySelectorAll('.sidebar-item[data-section]'));
    const contentSections = Array.from(document.querySelectorAll('.content-section'));
    if (homeNav) {
      homeNav.addEventListener('click', () => {
        // showSection('welcome'); // se existir
        if (sidebar) sidebar.classList.remove('active');
        if (hamburger) hamburger.classList.remove('active');
        sidebarItems.forEach(i => i.classList.remove('active'));
      });
    }
    sidebarItems.forEach(item => item.addEventListener('click', () => {
      const section = item.getAttribute('data-section');
      contentSections.forEach(s => s.classList.remove('active'));
      const target = safeGet(section);
      if (target) target.classList.add('active');
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      if (sidebar) sidebar.classList.remove('active');
      if (hamburger) hamburger.classList.remove('active');
      if (sidebarOverlay) sidebarOverlay.classList.remove('active');
    }));

    // Load user name
    function loadFullName(force = false) {
  try {
    let session = null;

    // 1️⃣ tenta SessionGuard
    if (window.SessionGuard?.getSessionData) {
      session = window.SessionGuard.getSessionData();
    }

    // 2️⃣ fallback localStorage
    if (!session) {
      const raw = localStorage.getItem('authSession');
      if (!raw) return;
      session = JSON.parse(raw);
    }

    if (!session) {
      console.warn('[loadFullName] sessão não encontrada');
      return;
    }

    const fullName =
      session.fullName ||
      session['Nome completo'] ||
      session.nome ||
      session.name ||
      '';

    if (!fullName) {
      console.warn('[loadFullName] nome não encontrado na sessão', session);
      return;
    }

    const firstName = fullName.trim().split(/\s+/)[0];

    // 3️⃣ tenta TODOS os alvos possíveis
    const targets = [
      document.getElementById('userName'),
      document.getElementById('user'),
      document.querySelector('.welcome-name'),
      document.querySelector('.user-name'),
      document.querySelector('[data-user-name]')
    ];

    let applied = false;

    for (const el of targets) {
      if (el) {
        el.textContent = firstName;
        applied = true;
        console.log('[loadFullName] nome aplicado em:', el);
        break;
      }
    }

    if (!applied) {
      console.warn('[loadFullName] nenhum elemento encontrado para exibir nome');
    }

  } catch (e) {
    console.error('[loadFullName] erro:', e);
  }
}



    

    // CPF formatting
    const cpfField = safeGet('cpf');
    if (cpfField) {
      cpfField.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 11) {
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d)/, '$1.$2');
          value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        e.target.value = value;
      });
    }

    // Filial numeric only
    const filialInput = safeGet('filial');
    if (filialInput) filialInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));

    // Codigo numeric only
    const codigoInput = safeGet('codigoProduto');
    if (codigoInput) codigoInput.addEventListener('input', (e) => e.target.value = e.target.value.replace(/\D/g, ''));

    // Price formatting display
    const precoProduto = safeGet('precoProduto');
    if (precoProduto) {
      precoProduto.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) value = value.substring(0, 9);
        if (value === '') { e.target.value = ''; return; }
        value = (parseInt(value) / 100).toFixed(2);
        e.target.value = 'R$ ' + value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
      });
    }

    // Character counter
    const descricaoInput = safeGet('descricaoProduto');
    const charCount = safeGet('charCount');
    if (descricaoInput && charCount) {
      descricaoInput.addEventListener('input', function () {
        charCount.textContent = this.value.length;
      });
    }

    // Modal voucher actions
    const modalVoucher = safeGet('modalVoucher');
    const closeModalBtn = safeGet('closeModalBtn');
    const copyVoucherBtn = safeGet('copyVoucherBtn');
    if (closeModalBtn && modalVoucher) {
      closeModalBtn.addEventListener('click', () => modalVoucher.classList.remove('active'));
    }
    if (copyVoucherBtn) {
      copyVoucherBtn.addEventListener('click', () => {
        const voucherCodeEl = safeGet('voucherCode');
        const voucherCode = voucherCodeEl ? voucherCodeEl.textContent : '';
        navigator.clipboard.writeText(voucherCode).then(() => {
          showToast('Voucher copiado para a área de transferência!', 'success', 2000);
        }).catch(() => showToast('Erro ao copiar voucher.', 'error'));
      });
    }

    // ==============
    // FORMS (substitui antigos alert/local console)
    // ==============

    // Usuario form
    const usuarioForm = safeGet('usuarioForm');
    if (usuarioForm) {
      usuarioForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!canAccess('criarUsuario')) {
          showToast('Sem permissão para criar usuários.', 'error', 5000);
          return;
        }

        // Loader
        const btnEl   = safeGet('btnCriarUsuario');
        const btnText = safeGet('btnCriarUsuarioText');
        const btnSpin = safeGet('spinnerUsuario');
        if (btnEl)   btnEl.disabled = true;
        if (btnText) btnText.textContent = 'Criando…';
        if (btnSpin) btnSpin.style.display = '';

        const payloadData = {
          user:            (safeGet('user')         ? safeGet('user').value         : ''),
          password:        (safeGet('password')     ? safeGet('password').value     : ''),
          perm:            (safeGet('perm')         ? safeGet('perm').value         : ''),
          filial:          (safeGet('filial')       ? safeGet('filial').value       : ''),
          nome:            (safeGet('nomeCompleto') ? safeGet('nomeCompleto').value : ''),
          cpf:             (safeGet('cpf')          ? safeGet('cpf').value          : ''),
          cidade:          (safeGet('cidade')       ? safeGet('cidade').value       : ''),
          solicitante:     getSessionUser(),
          permSolicitante: (getSession()?.perm || '')
        };

        const result = await sendToWorker('createUser', payloadData);

        // Reset loader
        if (btnEl)   btnEl.disabled = false;
        if (btnText) btnText.textContent = 'Criar Usuário';
        if (btnSpin) btnSpin.style.display = 'none';

        if (result && (result.status === 'ok' || String(result.status || '').toLowerCase() === 'ok')) {
          await sendToWorker('registrarAuditoria', {
            acao: 'createUser', usuario: getSessionUser(),
            detalhe: `Usuário "${payloadData.user}" criado com permissão "${payloadData.perm}"`,
            timestamp: new Date().toISOString()
          });
          showToast('Usuário criado com sucesso!', 'success');
          this.reset();
        } else {
          showToast(result.message || 'Erro ao criar usuário', 'error', 6000);
          console.error('CreateUser error:', result);
        }
      });

      const limparUsuario = safeGet('limparUsuario');
      if (limparUsuario) limparUsuario.addEventListener('click', () => usuarioForm.reset());
    }

    // Voucher form
    const voucherForm = safeGet('voucherForm');
    if (voucherForm) {
      voucherForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const setor = (safeGet('setor') ? safeGet('setor').value : '');

        const payloadData = {
          permvoucher: setor
        };

        const result = await sendToWorker('createVoucher', payloadData);

        if (result && (result.status === 'ok' || (result.status && result.status.toLowerCase() === 'ok'))) {
          // se a GAS/Worker retornar voucher no body, mostra-o; caso contrário, espera que o servidor gere
          const voucherCode = result.codigo || result.voucher || generateVoucherCode();
          const voucherSetorEl = safeGet('voucherSetor');
          const voucherCodeEl = safeGet('voucherCode');
          if (voucherCodeEl) voucherCodeEl.textContent = voucherCode;
          if (voucherSetorEl) voucherSetorEl.textContent = setor;
          if (modalVoucher) modalVoucher.classList.add('active');

          showToast('Voucher gerado com sucesso!', 'success');
          this.reset();
        } else {
          showToast(result.message || 'Erro ao gerar voucher', 'error', 6000);
          console.error('CreateVoucher error:', result);
        }
      });

      const cancelarVoucher = safeGet('cancelarVoucher');
      if (cancelarVoucher) cancelarVoucher.addEventListener('click', () => voucherForm.reset());
    }

    // Produto form
    const produtoForm = safeGet('produtoForm');
    if (produtoForm) {
      produtoForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        if (!canAccess('criarProduto')) {
          showToast('Sem permissão para cadastrar produtos.', 'error', 5000);
          return;
        }

        // Loader
        const btnEl   = safeGet('btnCadastrarProduto');
        const btnText = safeGet('btnCadastrarProdutoText');
        const btnSpin = safeGet('spinnerProduto');
        if (btnEl)   btnEl.disabled = true;
        if (btnText) btnText.textContent = 'Cadastrando…';
        if (btnSpin) btnSpin.style.display = '';

        const precoRaw        = (safeGet('precoProduto')    ? safeGet('precoProduto').value    : '');
        const precoNormalized = parseBRLtoNumber(precoRaw);

        const payloadData = {
          cod:             (safeGet('codigoProduto')    ? safeGet('codigoProduto').value    : ''),
          desc:            (safeGet('descricaoProduto') ? safeGet('descricaoProduto').value : ''),
          tamanho:         (safeGet('tamanhoProduto')   ? safeGet('tamanhoProduto').value   : ''),
          preco:           precoNormalized,
          solicitante:     getSessionUser(),
          permSolicitante: (getSession()?.perm || ''),
          criadoPor:       getSessionUser(),
          criadoEm:        new Date().toISOString(),
        };

        const result = await sendToWorker('createProduct', payloadData);

        // Reset loader
        if (btnEl)   btnEl.disabled = false;
        if (btnText) btnText.textContent = 'Cadastrar Produto';
        if (btnSpin) btnSpin.style.display = 'none';

        if (result && String(result.status || '').toLowerCase() === 'ok') {
          await sendToWorker('registrarAuditoria', {
            acao: 'createProduct', usuario: getSessionUser(),
            detalhe: `Produto "${payloadData.desc}" (cód. ${payloadData.cod}) cadastrado`,
            timestamp: new Date().toISOString()
          });
          showToast('Produto cadastrado com sucesso!', 'success');
          this.reset();
          if (charCount) charCount.textContent = '0';
        } else {
          showToast(result.message || 'Erro ao cadastrar produto', 'error', 6000);
          console.error('CreateProduct error:', result);
        }
      });

      const limparProduto = safeGet('limparProduto');
      if (limparProduto) limparProduto.addEventListener('click', () => {
        produtoForm.reset();
        if (charCount) charCount.textContent = '0';
      });
    }

    // If no authSession create a mock
    if (!localStorage.getItem('authSession')) {
  // mock mínimo compatível com o que a session-guard / front espera
  localStorage.setItem('authSession', JSON.stringify({
    fullName: 'João Silva Santos',
    email: 'joao@example.com',
    user: 'joao',
    perm: 'vendedor',
    start: Date.now(),
    duration: 60*60*1000
  }));
  // chama a função correta
  loadFullName();
}


    // Voucher code generator fallback (if server doesn't provide)
    function generateVoucherCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 9; i++) {
        if (i === 3 || i === 6) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

    (function enforceUserName() {

  const applyName = () => {
    try {
      const raw = localStorage.getItem('authSession');
      if (!raw) return false;

      const session = JSON.parse(raw);
      if (!session.fullName) return false;

      const firstName = session.fullName.trim().split(/\s+/)[0];

      const el =
        document.getElementById('userName') ||
        document.getElementById('user') ||
        document.querySelector('.user-name') ||
        document.querySelector('[data-user-name]');

      if (!el) return false;

      if (el.textContent !== firstName) {
        el.textContent = firstName;
      
      }

      return true;
    } catch (e) {
      
      return false;
    }
  };

  // 1️⃣ tentativa imediata
  applyName();

  // 2️⃣ tenta novamente após carregamentos tardios
  setTimeout(applyName, 300);
  setTimeout(applyName, 800);
  setTimeout(applyName, 1500);

  // 3️⃣ OBSERVADOR — impede sobrescrita
  const observer = new MutationObserver(() => {
    applyName();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

})();


  }); // DOMContentLoaded end
})();



