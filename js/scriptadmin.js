(() => {
  // ======================
  // CONFIG — Workers
  // ======================
  const PRIMARY_URL  = 'https://conexao-fallback-3.gab-oliveirab27.workers.dev/';
  const FALLBACK_URL = 'https://pythonlogin-hj3g.onrender.com';

  // Tentativas no fallback quando não há resposta
  const FALLBACK_MAX_RETRIES = 3;
  const FALLBACK_TIMEOUT_MS  = 15000; // 15 s — Render pode demorar no cold start
  const PRIMARY_TIMEOUT_MS   = 8000;

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
    return (ACCESS_RULES[rule] || []).includes(String(session.perm || '').toLowerCase());
  }

  function getSessionUser() {
    const s = getSession();
    return s ? (s.user || s.nome || 'desconhecido') : 'desconhecido';
  }

  // ======================
  // Toast (redesenhado com SVG)
  // ======================
  const DEFAULT_TOAST_DURATION = 4000;

  const TOAST_ICONS = {
    success: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    error:   '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    warning: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>',
    info:    '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>',
    loading: '<svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="animation:toastSpin .8s linear infinite;transform-origin:center"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>',
  };
  const TOAST_COLORS = {
    success: { border: '#16a34a', bg: '#f0fdf4', icon: '#16a34a' },
    error:   { border: '#dc2626', bg: '#fef2f2', icon: '#dc2626' },
    warning: { border: '#d97706', bg: '#fffbeb', icon: '#d97706' },
    info:    { border: '#2563eb', bg: '#eff6ff', icon: '#2563eb' },
    loading: { border: '#7c3aed', bg: '#f5f3ff', icon: '#7c3aed' },
  };

  function ensureToastContainer() {
    let c = document.getElementById('toast-container');
    if (!c) {
      c = document.createElement('div');
      c.id = 'toast-container';
      Object.assign(c.style, {
        position: 'fixed', bottom: '1.25rem', right: '1.25rem',
        zIndex: 9999, display: 'flex', flexDirection: 'column',
        gap: '.5rem', pointerEvents: 'none'
      });
      document.body.appendChild(c);
    }
    return c;
  }

  function showToast(message, type = 'info', duration = DEFAULT_TOAST_DURATION) {
    if (!document.getElementById('_tk')) {
      const s = document.createElement('style');
      s.id = '_tk';
      s.textContent = `
        @keyframes toastSlideIn{from{opacity:0;transform:translateX(14px)}to{opacity:1;transform:none}}
        @keyframes toastSpin{to{transform:rotate(360deg)}}
      `;
      document.head.appendChild(s);
    }
    const container = ensureToastContainer();
    const colors = TOAST_COLORS[type] || TOAST_COLORS.info;
    const icon   = TOAST_ICONS[type]  || TOAST_ICONS.info;
    const t = document.createElement('div');
    Object.assign(t.style, {
      display: 'flex', alignItems: 'flex-start', gap: '10px',
      padding: '12px 14px', borderRadius: '9px',
      background: colors.bg, borderLeft: '3px solid ' + colors.border,
      boxShadow: '0 4px 20px rgba(0,0,0,.12)',
      minWidth: '270px', maxWidth: '360px',
      pointerEvents: 'all', animation: 'toastSlideIn .25s ease',
      transition: 'opacity .2s, transform .2s',
    });
    const iconEl = document.createElement('span');
    iconEl.innerHTML = icon;
    iconEl.style.cssText = `color:${colors.icon};flex-shrink:0;margin-top:1px;display:flex`;
    const msgEl = document.createElement('span');
    msgEl.style.cssText = 'font-size:.84rem;color:#1e293b;line-height:1.45;flex:1';
    msgEl.textContent = message;
    t.appendChild(iconEl);
    t.appendChild(msgEl);
    container.appendChild(t);
    if (duration > 0) {
      setTimeout(() => {
        t.style.opacity = '0';
        t.style.transform = 'translateX(10px)';
        setTimeout(() => t.remove(), 220);
      }, duration);
    }
    return t;
  }

  function dismissToast(toastEl) {
    if (!toastEl) return;
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateX(10px)';
    setTimeout(() => toastEl.remove(), 220);
  }

  // ======================
  // Core fetch com timeout
  // ======================
  async function fetchWithTimeout(url, bodyText, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const resp = await fetch(url, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    bodyText,
        signal:  controller.signal,
      });
      clearTimeout(timer);
      const text = await resp.text();
      return JSON.parse(text);
    } catch (err) {
      clearTimeout(timer);
      throw err;
    }
  }

  // ======================
  // sendToWorker — primário → fallback (até 3 tentativas)
  // ======================
  async function sendToWorker(action, data) {
    const bodyObj  = Object.assign({ action }, data || {});
    const bodyText = JSON.stringify(bodyObj);

    // ── 1. Tenta o Worker primário (Cloudflare) ──
    try {
      const result = await fetchWithTimeout(PRIMARY_URL, bodyText, PRIMARY_TIMEOUT_MS);
      return result;
    } catch (_primaryErr) {
      // cai para o fallback
    }

    // ── 2. Fallback: Render (pode estar em cold start) ──
    let statusToast = showToast(
      'Servidor principal indisponível — conectando ao servidor alternativo…',
      'loading',
      0 // persiste até ser descartado manualmente
    );

    for (let attempt = 1; attempt <= FALLBACK_MAX_RETRIES; attempt++) {
      if (attempt > 1) {
        // Atualiza mensagem do toast persistente
        const msgEl = statusToast.querySelector('span:last-child');
        if (msgEl) {
          msgEl.textContent = `Aguardando resposta… tentativa ${attempt} de ${FALLBACK_MAX_RETRIES}`;
        }
        // Pequena espera antes de retentar (backoff: 2 s, 4 s)
        await new Promise(r => setTimeout(r, 2000 * (attempt - 1)));
      }

      try {
        const result = await fetchWithTimeout(FALLBACK_URL, bodyText, FALLBACK_TIMEOUT_MS);
        dismissToast(statusToast);
        if (attempt > 1) {
          showToast('Conectado ao servidor alternativo!', 'success', 3500);
        }
        return result;
      } catch (_fallbackErr) {
        if (attempt === FALLBACK_MAX_RETRIES) {
          dismissToast(statusToast);
          showToast(
            'Nenhum servidor respondeu. Verifique sua conexão e tente novamente.',
            'error',
            7000
          );
          return { status: 'error', message: 'Servidores temporariamente indisponíveis.' };
        }
      }
    }

    dismissToast(statusToast);
    return { status: 'error', message: 'Servidores temporariamente indisponíveis.' };
  }

  // ======================
  // Helpers
  // ======================
  function safeGet(id) {
    return document.getElementById(id) || null;
  }

  function parseBRLtoNumber(value) {
    if (!value) return '';
    const cleaned = String(value).replace(/\s/g, '').replace('R$', '')
      .replace(/\./g, '').replace(',', '.');
    if (cleaned === '' || isNaN(Number(cleaned))) return '';
    return Number(cleaned).toFixed(2);
  }

  function brl(v) {
    return v != null
      ? 'R$ ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2 })
      : '—';
  }

  // ======================
  // Produto: preview de preços calculados
  // ======================
  function calcProduto(precoAvista) {
    const v = parseFloat(precoAvista);
    if (isNaN(v) || v <= 0) return null;
    return {
      avista:       v,
      parcela:      +(v * 1.2 / 12).toFixed(2),
      prazo:        +(v * 1.2).toFixed(2),
      feirao:       +(v * 0.95).toFixed(2),
      parcelaFeirao:+(v * 0.95 * 1.2 / 12).toFixed(2),
    };
  }

  function updateProdutoPreview() {
    const precoRaw = safeGet('precoProduto')?.value || '';
    const precoNum = parseBRLtoNumber(precoRaw);
    const preview  = safeGet('prodPreview');
    if (!preview) return;

    const calc = calcProduto(precoNum);
    if (!calc) {
      preview.style.display = 'none';
      return;
    }
    preview.style.display = 'grid';
    const set = (id, val) => { const el = safeGet(id); if (el) el.textContent = val; };
    set('pvAvista',        brl(calc.avista));
    set('pvParcela',       `12× ${brl(calc.parcela)}`);
    set('pvPrazo',         brl(calc.prazo));
    set('pvFeirao',        brl(calc.feirao));
    set('pvParcelaFeirao', `12× ${brl(calc.parcelaFeirao)}`);
  }

  // ======================
  // Feedback visual de sucesso no formulário de produto
  // ======================
  function flashProdutoSuccess(descricao) {
    const formCard = safeGet('produtoFormCard');
    if (!formCard) return;

    // Overlay de sucesso sobre o card
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position:absolute;inset:0;border-radius:inherit;
      background:rgba(240,253,244,.96);
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      gap:.75rem;animation:pvSuccess .3s ease;z-index:10;
    `;
    overlay.innerHTML = `
      <div style="width:56px;height:56px;border-radius:50%;background:#16a34a;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 18px rgba(22,163,74,.35)">
        <svg width="28" height="28" fill="none" stroke="#fff" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7"/>
        </svg>
      </div>
      <p style="font-size:1rem;font-weight:700;color:#15803d;margin:0">Produto cadastrado!</p>
      <p style="font-size:.83rem;color:#166534;margin:0;text-align:center;max-width:240px">${descricao}</p>
    `;
    if (!document.getElementById('_pvStyle')) {
      const s = document.createElement('style');
      s.id = '_pvStyle';
      s.textContent = `
        @keyframes pvSuccess{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:none}}
      `;
      document.head.appendChild(s);
    }
    // O card precisa de position:relative para o overlay funcionar
    formCard.style.position = 'relative';
    formCard.appendChild(overlay);
    setTimeout(() => {
      overlay.style.transition = 'opacity .35s ease';
      overlay.style.opacity = '0';
      setTimeout(() => overlay.remove(), 380);
    }, 2200);
  }

  // ======================
  // DOM ready
  // ======================
  document.addEventListener('DOMContentLoaded', () => {

    // Controle de acesso ao painel
    if (!canAccess('painel')) {
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

    // ── Tema ──
    const themeToggle = safeGet('themeToggle');
    const themeText   = safeGet('themeText');
    const themeIcon   = safeGet('themeIcon');
    const body        = document.body;
    const savedTheme  = localStorage.getItem('theme') || 'light';
    body.setAttribute('data-theme', savedTheme);
    if (themeText && themeIcon) updateThemeUI(savedTheme);

    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        const cur = body.getAttribute('data-theme') || 'light';
        const next = cur === 'light' ? 'dark' : 'light';
        body.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
        if (themeText && themeIcon) updateThemeUI(next);
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

    // ── Sidebar ──
    const hamburger       = safeGet('hamburger');
    const sidebar         = safeGet('sidebar');
    const sidebarOverlay  = safeGet('sidebarOverlay');
    if (hamburger) {
      hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        if (sidebar)        sidebar.classList.toggle('active');
        if (sidebarOverlay) sidebarOverlay.classList.toggle('active');
      });
    }
    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', () => {
        hamburger?.classList.remove('active');
        sidebar?.classList.remove('active');
        sidebarOverlay.classList.remove('active');
      });
    }

    // ── Navegação sidebar ──
    const homeNav       = safeGet('homeNav');
    const sidebarItems  = Array.from(document.querySelectorAll('.sidebar-item[data-section]'));
    const contentSecs   = Array.from(document.querySelectorAll('.content-section'));

    if (homeNav) {
      homeNav.addEventListener('click', () => {
        sidebar?.classList.remove('active');
        hamburger?.classList.remove('active');
        sidebarItems.forEach(i => i.classList.remove('active'));
      });
    }
    sidebarItems.forEach(item => item.addEventListener('click', () => {
      const section = item.getAttribute('data-section');
      contentSecs.forEach(s => s.classList.remove('active'));
      safeGet(section)?.classList.add('active');
      sidebarItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      sidebar?.classList.remove('active');
      hamburger?.classList.remove('active');
      sidebarOverlay?.classList.remove('active');
    }));

    // ── Nome do usuário ──
    function loadFullName() {
      try {
        let session = window.SessionGuard?.getSessionData?.() || null;
        if (!session) {
          const raw = localStorage.getItem('authSession');
          if (!raw) return;
          session = JSON.parse(raw);
        }
        const fullName = session.fullName || session['Nome completo'] || session.nome || session.name || '';
        if (!fullName) return;
        const firstName = fullName.trim().split(/\s+/)[0];
        const targets = [
          document.getElementById('userName'),
          document.querySelector('.welcome-name'),
          document.querySelector('[data-user-name]'),
        ];
        for (const el of targets) {
          if (el) { el.textContent = firstName; break; }
        }
      } catch (e) { /* silent */ }
    }

    loadFullName();
    setTimeout(loadFullName, 300);
    setTimeout(loadFullName, 900);

    // ── CPF mask ──
    const cpfField = safeGet('cpf');
    if (cpfField) {
      cpfField.addEventListener('input', function (e) {
        let v = e.target.value.replace(/\D/g, '');
        if (v.length <= 11) {
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d)/, '$1.$2');
          v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        }
        e.target.value = v;
      });
    }

    // ── Filial: só números ──
    const filialInput = safeGet('filial');
    if (filialInput) filialInput.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });

    // ── Código: só números ──
    const codigoInput = safeGet('codigoProduto');
    if (codigoInput) codigoInput.addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, ''); });

    // ── Preço: máscara BRL + preview ──
    const precoProduto = safeGet('precoProduto');
    if (precoProduto) {
      precoProduto.addEventListener('input', function (e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 9) value = value.substring(0, 9);
        if (value === '') { e.target.value = ''; updateProdutoPreview(); return; }
        value = (parseInt(value) / 100).toFixed(2);
        e.target.value = 'R$ ' + value.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        updateProdutoPreview();
      });
    }

    // ── Counter de chars (descrição) ──
    const descricaoInput = safeGet('descricaoProduto');
    const charCount      = safeGet('charCount');
    if (descricaoInput && charCount) {
      descricaoInput.addEventListener('input', function () {
        charCount.textContent = this.value.length;
      });
    }

    // ── Voucher modal ──
    const modalVoucher  = safeGet('modalVoucher');
    const closeModalBtn = safeGet('closeModalBtn');
    const copyVoucherBtn = safeGet('copyVoucherBtn');
    if (closeModalBtn && modalVoucher) {
      closeModalBtn.addEventListener('click', () => modalVoucher.classList.remove('active'));
    }
    if (copyVoucherBtn) {
      copyVoucherBtn.addEventListener('click', () => {
        const code = safeGet('voucherCode')?.textContent || '';
        navigator.clipboard.writeText(code).then(() => {
          showToast('Voucher copiado!', 'success', 2000);
        }).catch(() => showToast('Erro ao copiar voucher.', 'error'));
      });
    }

    // ==============
    // FORM — Criar Usuário
    // ==============
    const usuarioForm = safeGet('usuarioForm');
    if (usuarioForm) {
      usuarioForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!canAccess('criarUsuario')) {
          showToast('Sem permissão para criar usuários.', 'error', 5000);
          return;
        }
        const btnEl   = safeGet('btnCriarUsuario');
        const btnText = safeGet('btnCriarUsuarioText');
        const btnSpin = safeGet('spinnerUsuario');
        if (btnEl)   btnEl.disabled = true;
        if (btnText) btnText.textContent = 'Criando…';
        if (btnSpin) btnSpin.style.display = '';

        const payloadData = {
          user:            safeGet('user')?.value         || '',
          password:        safeGet('password')?.value     || '',
          perm:            safeGet('perm')?.value         || '',
          filial:          safeGet('filial')?.value       || '',
          nome:            safeGet('nomeCompleto')?.value || '',
          cpf:             safeGet('cpf')?.value          || '',
          cidade:          safeGet('cidade')?.value       || '',
          solicitante:     getSessionUser(),
          permSolicitante: getSession()?.perm || '',
        };

        const result = await sendToWorker('createUser', payloadData);
        if (btnEl)   btnEl.disabled = false;
        if (btnText) btnText.textContent = 'Criar Usuário';
        if (btnSpin) btnSpin.style.display = 'none';

        if (result && String(result.status || '').toLowerCase() === 'ok') {
          await sendToWorker('registrarAuditoria', {
            acao: 'createUser', usuario: getSessionUser(),
            detalhe: `Usuário "${payloadData.user}" criado com permissão "${payloadData.perm}"`,
            timestamp: new Date().toISOString(),
          });
          showToast('Usuário criado com sucesso!', 'success');
          this.reset();
        } else {
          showToast(result.message || 'Erro ao criar usuário', 'error', 6000);
        }
      });
      safeGet('limparUsuario')?.addEventListener('click', () => usuarioForm.reset());
    }

    // ==============
    // FORM — Cadastrar Produto (com feedback visual)
    // ==============
    const produtoForm = safeGet('produtoForm');
    if (produtoForm) {
      produtoForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        if (!canAccess('criarProduto')) {
          showToast('Sem permissão para cadastrar produtos.', 'error', 5000);
          return;
        }
        const btnEl   = safeGet('btnCadastrarProduto');
        const btnText = safeGet('btnCadastrarProdutoText');
        const btnSpin = safeGet('spinnerProduto');
        if (btnEl)   btnEl.disabled = true;
        if (btnText) btnText.textContent = 'Cadastrando…';
        if (btnSpin) btnSpin.style.display = '';

        const precoRaw        = safeGet('precoProduto')?.value || '';
        const precoNormalized = parseBRLtoNumber(precoRaw);
        const descricao       = safeGet('descricaoProduto')?.value || '';

        const payloadData = {
          cod:             safeGet('codigoProduto')?.value    || '',
          desc:            descricao,
          tamanho:         safeGet('tamanhoProduto')?.value   || '',
          preco:           precoNormalized,
          solicitante:     getSessionUser(),
          permSolicitante: getSession()?.perm || '',
          criadoPor:       getSessionUser(),
          criadoEm:        new Date().toISOString(),
        };

        const result = await sendToWorker('createProduct', payloadData);
        if (btnEl)   btnEl.disabled = false;
        if (btnText) btnText.textContent = 'Cadastrar Produto';
        if (btnSpin) btnSpin.style.display = 'none';

        if (result && String(result.status || '').toLowerCase() === 'ok') {
          await sendToWorker('registrarAuditoria', {
            acao: 'createProduct', usuario: getSessionUser(),
            detalhe: `Produto "${descricao}" (cód. ${payloadData.cod}) cadastrado`,
            timestamp: new Date().toISOString(),
          });
          // Feedback visual animado no card
          flashProdutoSuccess(descricao);
          showToast(`"${descricao}" cadastrado com sucesso!`, 'success');
          this.reset();
          if (charCount) charCount.textContent = '0';
          // Limpa preview
          const preview = safeGet('prodPreview');
          if (preview) preview.style.display = 'none';
        } else {
          showToast(result.message || 'Erro ao cadastrar produto', 'error', 6000);
        }
      });

      safeGet('limparProduto')?.addEventListener('click', () => {
        produtoForm.reset();
        if (charCount) charCount.textContent = '0';
        const preview = safeGet('prodPreview');
        if (preview) preview.style.display = 'none';
      });
    }

    // ── Mock session se ausente ──
    if (!localStorage.getItem('authSession')) {
      localStorage.setItem('authSession', JSON.stringify({
        fullName: 'João Silva Santos',
        email:    'joao@example.com',
        user:     'joao',
        perm:     'vendedor',
        start:    Date.now(),
        duration: 60 * 60 * 1000,
      }));
      loadFullName();
    }

    // ── Observer para manter o nome do usuário correto ──
    (() => {
      const applyName = () => {
        try {
          const raw = localStorage.getItem('authSession');
          if (!raw) return;
          const session = JSON.parse(raw);
          if (!session.fullName) return;
          const firstName = session.fullName.trim().split(/\s+/)[0];
          const el = document.getElementById('userName') || document.querySelector('.welcome-name');
          if (el && el.textContent !== firstName) el.textContent = firstName;
        } catch { /* silent */ }
      };
      [0, 300, 900, 1600].forEach(d => setTimeout(applyName, d));
      new MutationObserver(applyName).observe(document.body, { childList: true, subtree: true, characterData: true });
    })();

    // Voucher form (mantido)
    const voucherForm = safeGet('voucherForm');
    if (voucherForm) {
      voucherForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const setor  = safeGet('setor')?.value || '';
        const result = await sendToWorker('createVoucher', { permvoucher: setor });
        if (result && String(result.status || '').toLowerCase() === 'ok') {
          const code = result.codigo || result.voucher || generateVoucherCode();
          if (safeGet('voucherCode'))  safeGet('voucherCode').textContent  = code;
          if (safeGet('voucherSetor')) safeGet('voucherSetor').textContent = setor;
          if (modalVoucher) modalVoucher.classList.add('active');
          showToast('Voucher gerado com sucesso!', 'success');
          this.reset();
        } else {
          showToast(result.message || 'Erro ao gerar voucher', 'error', 6000);
        }
      });
      safeGet('cancelarVoucher')?.addEventListener('click', () => voucherForm.reset());
    }

    function generateVoucherCode() {
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      let code = '';
      for (let i = 0; i < 9; i++) {
        if (i === 3 || i === 6) code += '-';
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    }

  }); // DOMContentLoaded end
})();
