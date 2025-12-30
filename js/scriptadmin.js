(() => {
  // ======================
  // CONFIG - troque esta URL
  // ======================
  const WORKER_URL = 'https://proc-uservoucherprod.adm-ativosz.workers.dev/';

  // ======================
  // Utilitários: Toast simples
  // ======================
  const DEFAULT_TOAST_DURATION = 4000;
  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      c.style.position = 'fixed';
      c.style.top = '1rem';
      c.style.right = '1rem';
      c.style.zIndex = 9999;
      c.style.display = 'flex';
      c.style.flexDirection = 'column';
      c.style.gap = '0.6rem';
      document.body.appendChild(c);
    }
    return c;
  }
  function showToast(message, type = 'info', duration = DEFAULT_TOAST_DURATION) {
    const container = ensureToastContainer();
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    t.style.padding = '10px 12px';
    t.style.borderRadius = '8px';
    t.style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
    t.style.background = type === 'error' ? '#fff1f1' : type === 'success' ? '#f1fff4' : '#ffffff';
    t.style.color = '#111';
    container.appendChild(t);
    setTimeout(() => {
      t.style.transition = 'opacity .25s, transform .25s';
      t.style.opacity = '0';
      t.style.transform = 'translateY(-8px)';
      setTimeout(() => t.remove(), 260);
    }, duration);
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
    console.log('DEBUG -> enviando para Worker:', bodyObj, '\n(text):', bodyText);

    const resp = await fetch(WORKER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: bodyText
    });

    // pega o texto cru que o Worker/GAS retornou
    const text = await resp.text();

    // loga status HTTP e texto cru
    console.log('DEBUG <- resposta HTTP status:', resp.status, 'texto:', text);

    // tenta parsear JSON, mas mesmo que falhe devolve o texto cru
    try {
      const parsed = JSON.parse(text);
      console.log('DEBUG <- resposta parseada JSON:', parsed);
      return parsed;
    } catch (err) {
      console.warn('DEBUG <- resposta não é JSON:', err);
      return { status: 'error', message: 'Resposta não-JSON', raw: text };
    }
  } catch (err) {
    console.error('DEBUG <- erro fetch/sendToWorker:', err);
    return { status: 'error', message: err.message || 'Falha na requisição' };
  }
}




  // ======================
  // Executa após DOM carregado
  // ======================
  document.addEventListener('DOMContentLoaded', () => {
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
        const payloadData = {
          user: (safeGet('usuario') ? safeGet('usuario').value : ''),
          password: (safeGet('senha') ? safeGet('senha').value : ''),
          perm: (safeGet('permissao') ? safeGet('permissao').value : ''),
          filial: (safeGet('filial') ? safeGet('filial').value : ''),
          nome: (safeGet('nomeCompleto') ? safeGet('nomeCompleto').value : ''),
          cpf: (safeGet('cpf') ? safeGet('cpf').value : ''),
          cidade: (safeGet('cidade') ? safeGet('cidade').value : '')
        };

        const result = await sendToWorker('createUser', payloadData);

        if (result && result.status && result.status.toLowerCase() === 'ok' || result.status === 'ok') {
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

        const precoRaw = (safeGet('precoProduto') ? safeGet('precoProduto').value : '');
        const precoNormalized = parseBRLtoNumber(precoRaw); // ex: "1234.56"

        const payloadData = {
          cod: (safeGet('codigoProduto') ? safeGet('codigoProduto').value : ''),
          desc: (safeGet('descricaoProduto') ? safeGet('descricaoProduto').value : ''),
          preco: precoNormalized // envia 1234.56 (string)
        };

        const result = await sendToWorker('createProduct', payloadData);

        if (result && String(result.status || '').toLowerCase() === 'ok') {
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


document.addEventListener('DOMContentLoaded',function(){
  const botao = document.getElementById('cart-open');

  botao.addEventListener('click',function(){
    window.location.href = 'cartazes.html'
  })
})

