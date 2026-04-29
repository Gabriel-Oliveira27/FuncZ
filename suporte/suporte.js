/* ========================================
   CONFIGURATION & STATE
   ======================================== */
const CONFIG = {
  ramaisJsonPath: '../data/ramais.json',
  manualPath: '../data/manual-geral.pdf'
};

let ramaisData = null;
let chatState = {
  stage: 'initial',
  awaitingResponse: false,
  isTyping: false
};

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */
function showToast(message, type = 'info', duration = 3200) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type] || icons.info}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastOut 0.3s ease forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ========================================
   THEME TOGGLE
   ======================================== */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeText   = document.getElementById('themeText');
  const body        = document.body;

  const savedTheme = localStorage.getItem('theme') || 'light';
  body.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  themeToggle?.addEventListener('click', () => {
    const current  = body.getAttribute('data-theme');
    const newTheme = current === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeUI(newTheme);
  });

  function updateThemeUI(theme) {
    if (themeText) {
      themeText.textContent = theme === 'light' ? 'Tema Escuro' : 'Tema Claro';
    }
    const icon = document.getElementById('themeIcon');
    if (icon) {
      icon.innerHTML = theme === 'light'
        ? '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'
        : '<circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>';
    }
  }
}

/* ========================================
   NAVIGATION
   ======================================== */
function initNavigation() {
  const backButton   = document.getElementById('backButton');
  const mainCards    = document.getElementById('mainCards');
  const sections     = document.querySelectorAll('.section-content');
  const supportCards = document.querySelectorAll('.support-card');
  const backBtns     = document.querySelectorAll('.back-btn');

  backButton?.addEventListener('click', () => {
    window.location.href = '../pages/selectsetor.html';
  });

  supportCards.forEach(card => {
    const sectionName = card.getAttribute('data-section');
    const btn = card.querySelector('.card-btn');

    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      showSection(sectionName);
    });
  });

  backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hideAllSections();
      mainCards.style.display = 'grid';
      // Reset chatbot stage so it re-initialises cleanly
      chatState = { stage: 'initial', awaitingResponse: false, isTyping: false };
    });
  });

  function showSection(name) {
    mainCards.style.display = 'none';
    sections.forEach(s => (s.style.display = 'none'));
    const target = document.getElementById(`${name}-content`);
    if (target) {
      target.style.display = 'block';
      if (name === 'sistema') initChatbot();
    }
  }

  function hideAllSections() {
    sections.forEach(s => (s.style.display = 'none'));
  }
}

/* ========================================
   CHATBOT SYSTEM
   ======================================== */
const greetings = [
  "Olá! Para começar, me conte: qual sistema está apresentando problemas?",
  "Oi! Vamos resolver isso juntos. Qual é o sistema que você está tendo dificuldades?",
  "Seja bem-vindo! Primeiro, preciso saber: em qual sistema você está enfrentando problemas?",
  "Olá! Estou aqui para ajudar. Pode me dizer qual sistema não está funcionando bem?",
  "Oi! Qual sistema está te dando dor de cabeça hoje?"
];

function initChatbot() {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput    = document.getElementById('chatInput');
  const sendBtn      = document.getElementById('sendBtn');
  const resetBtn     = document.getElementById('resetChatBtn');

  if (chatState.stage !== 'initial') return;

  chatMessages.innerHTML = '';
  chatState.awaitingResponse = false;

  const phrase = greetings[Math.floor(Math.random() * greetings.length)];

  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    addBotMessage(phrase + '\n\nSe quiser, também posso te ajudar a **baixar o Manual Geral do Sistema** — é só digitar "manual".');
    chatState.awaitingResponse = true;
    chatState.stage = 'waiting_system';
  }, 900);

  sendBtn?.addEventListener('click', handleUserInput);
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) handleUserInput();
  });

  resetBtn?.addEventListener('click', () => {
    chatState = { stage: 'initial', awaitingResponse: false, isTyping: false };
    initChatbot();
  });
}

function handleUserInput() {
  const chatInput = document.getElementById('chatInput');
  const raw = chatInput.value.trim();
  if (!raw || !chatState.awaitingResponse || chatState.isTyping) return;

  addUserMessage(raw);
  chatInput.value = '';
  chatState.awaitingResponse = false;

  const lower = raw.toLowerCase();
  setTimeout(() => processUserResponse(lower, raw), 600);
}

/* ============ INTENT DETECTION ============ */
const INTENTS = {
  manual:   ['manual', 'manua', 'guia', 'guia geral', 'documentacao', 'documentação', 'pdf', 'apostila', 'tutorial'],
  funcz:    ['cartaz', 'cartazes', 'declarac', 'declaração', 'declaracoes', 'funcz', 'func'],
  odoo:     ['odoo', 'erp', 'gestao', 'gestão', 'financeiro', 'estoque'],
  email:    ['email', 'e-mail', 'correio'],
  ramal:    ['ramal', 'telefone', 'ligar', 'ligacao'],
  whatsapp: ['whatsapp', 'wpp', 'zap', 'urgente', 'urgência'],
  images:   ['logo', 'imagem', 'imagens', 'zenir', 'marca', 'branding'],
  reset:    ['tentar novamente', 'recomecar', 'recomeçar', 'reiniciar', 'resetar', 'novo']
};

function detectIntent(text) {
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(kw => text.includes(kw))) return intent;
  }
  return null;
}

function processUserResponse(lower, original) {
  const intent = detectIntent(lower);

  switch (intent) {
    case 'manual':
      showManualOffer();
      break;
    case 'funcz':
      showFuncZSupport();
      break;
    case 'odoo':
      showOdooSupport();
      break;
    case 'email':
      showTypingThen(() => showContactInfo('email'));
      break;
    case 'ramal':
      showTypingThen(() => showContactInfo('ramal'));
      break;
    case 'whatsapp':
      showTypingThen(() => showContactInfo('whatsapp'));
      break;
    case 'images':
      showImageOptions();
      break;
    case 'reset':
      chatState = { stage: 'initial', awaitingResponse: false, isTyping: false };
      initChatbot();
      break;
    default:
      showUnknownSystem(original);
  }
}

/* ============ FLOWS ============ */

function showManualOffer() {
  showTypingThen(() => {
    addBotMessage('Claro! O **Manual Geral do Sistema** contém instruções detalhadas sobre todos os módulos internos.');
    setTimeout(() => {
      addBotMessageWithActions(
        'Clique no botão abaixo para abrir ou baixar o PDF:',
        [
          {
            label: '📄 Baixar Manual Geral (PDF)',
            className: 'contact-btn pdf-btn',
            icon: pdfIcon(),
            action: () => downloadManual()
          },
          {
            label: '🔄 Tenho outro problema',
            className: 'contact-btn',
            icon: resetIcon(),
            action: () => offerAnother()
          }
        ]
      );
    }, 700);
  });
}

function showFuncZSupport() {
  showTypingThen(() => {
    addBotMessage('Entendi! Você está com problemas no **FuncZ** (Cartazes ou Declarações).');
    setTimeout(() => {
      addBotMessage('O suporte para estes sistemas funciona das seguintes formas:');
      setTimeout(() => {
        addBotMessageWithActions('Escolha como prefere entrar em contato:', [
          {
            label: '📞 Ligar no Ramal 302 (Gabriel)',
            icon: phoneIcon(),
            action: () => showContactInfo('ramal')
          },
          {
            label: '📧 Enviar E-mail',
            icon: mailIcon(),
            action: () => showContactInfo('email')
          },
          {
            label: '💬 WhatsApp (urgências)',
            icon: whatsappIcon(),
            action: () => showContactInfo('whatsapp')
          },
          {
            label: '📄 Baixar Manual do Sistema',
            className: 'contact-btn pdf-btn',
            icon: pdfIcon(),
            action: () => downloadManual()
          }
        ]);
      }, 800);
    }, 700);
  });
}

function showOdooSupport() {
  showTypingThen(() => {
    addBotMessage('Entendi! Você precisa de suporte para **sistemas de gestão (Odoo / ERP)**.');
    setTimeout(() => {
      addBotMessage(`Para este tipo de sistema, entre em contato com o setor de **T.I.:**\n\n📞 **Ramais da T.I.:**\n• Lívia — 221\n• Vinícius — 205\n• Karolinne — 230\n• Gustavo — 318\n• Gabriel — 302\n• Weslle — 295\n• Enzio — 301\n• Pablo — 208\n\n**Horário:** Seg–Sex 07h–19h · Sáb 08h–14h`);
      chatState.awaitingResponse = true;
    }, 800);
  });
}

function showImageOptions() {
  showTypingThen(() => {
    addBotMessage('Claro! Tenho as **imagens da marca Zenir** disponíveis para você baixar.');
    setTimeout(() => {
      addBotMessage('Escolha qual imagem você gostaria de baixar:');
      setTimeout(() => {
        // Criar mensagem HTML com opções de download
        const chatMessages = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message bot-message';
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `
          <div class="image-download-message">
            <div class="image-download-options">
              <button class="chat-image-btn" onclick="downloadImageFromChat('./image/logo.png', 'logo.png')">
                📥 Logo Simples (logo.png)
              </button>
              <button class="chat-image-btn" onclick="downloadImageFromChat('./image/zenirlogo.png', 'zenirlogo.png')">
                📥 Logo Zenir (zenirlogo.png)
              </button>
              <button class="chat-image-btn" onclick="downloadImageFromChat('./image/logocompleta.png', 'logocompleta.png')">
                📥 Logo Completa (logocompleta.png)
              </button>
            </div>
            <button class="chat-image-popup-btn" onclick="window.showImageDownloadPopup()">
              🖼️ Ver todas as imagens
            </button>
          </div>
        `;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        // Adicionar avatar
        const avatarDiv = document.createElement('div');
        avatarDiv.className = 'message-avatar bot-avatar';
        avatarDiv.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>';
        messageDiv.insertBefore(avatarDiv, contentDiv);
        
        scrollToBottom();
        chatState.awaitingResponse = true;
      }, 800);
    }, 700);
  });
}

function showUnknownSystem(original) {
  showTypingThen(() => {
    addBotMessage(`Não reconheci o sistema **"${original}"** na nossa base. Mas posso te ajudar de outra forma:`);
    setTimeout(() => {
      addBotMessageWithActions('O que você gostaria de fazer?', [
        {
          label: 'ℹ️ Ver Suporte Geral',
          icon: infoIcon(),
          action: () => showContactInfo('geral')
        },
        {
          label: '📄 Baixar Manual do Sistema',
          className: 'contact-btn pdf-btn',
          icon: pdfIcon(),
          action: () => downloadManual()
        },
        {
          label: '🔄 Tentar Novamente',
          icon: resetIcon(),
          action: () => offerAnother()
        }
      ]);
    }, 700);
  });
}

function showContactInfo(type) {
  const info = {
    ramal: `📞 **Contato por Ramal**\n\n**Ramal: 302** — Gabriel\n\n**Horários:**\n• Seg–Sex: 08h–12h e 14h–18h\n• Sábado: 08h–13h\n\nBasta discar 302 no seu telefone interno!`,
    email: `📧 **Contato por E-mail**\n\n**E-mail:** gabriel.oliveira@grupozenir.com.br\n\nTempo de resposta: até **24h úteis**.\n\nInclua no e-mail:\n• Qual sistema tem problema\n• O que aconteceu (erro, tela)\n• Prints se possível`,
    whatsapp: `💬 **Contato por WhatsApp**\n\n**Número:** (88) 98856-8911\n\n⚠️ Use apenas em casos **urgentes**:\n• Problema impede completamente o trabalho\n• Já tentou os outros canais\n\n**Horário:** Seg–Sex 8h–18h · Sáb 8h–13h`,
    geral: `ℹ️ **Suporte Geral**\n\n**FuncZ (Cartazes/Declarações):**\n📞 Ramal 302 — Gabriel\n📧 gabriel.oliveira@grupozenir.com.br\n💬 (88) 98856-8911 (urgências)\n\n**Outros sistemas (Odoo/ERP):**\n📞 T.I. — Ramais 221, 205, 230, 318...\n\n**Horários:** Seg–Sex 08h–18h · Sáb 08h–13h`
  };

  showTypingThen(() => {
    addBotMessage(info[type] || 'Informação não encontrada.');
    chatState.awaitingResponse = true;
  });
}

function offerAnother() {
  addBotMessage('Tudo bem! Me conte: qual sistema está apresentando problemas?');
  chatState.awaitingResponse = true;
  chatState.stage = 'waiting_system';
}

function downloadManual() {
  showToast('Abrindo manual...', 'info', 2000);
  addBotMessage('Ótimo! O manual está sendo aberto. 📄\n\nSe o download não iniciar automaticamente, verifique se pop-ups estão permitidos no seu navegador.');
  setTimeout(() => {
    const link = document.createElement('a');
    link.href = CONFIG.manualPath;
    link.target = '_blank';
    link.download = 'Manual-Geral.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, 500);
  chatState.awaitingResponse = true;
}

/* ============ TYPING INDICATOR ============ */
function showTypingIndicator() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  removeTypingIndicator();
  chatState.isTyping = true;

  const typingEl = document.createElement('div');
  typingEl.className = 'typing-indicator';
  typingEl.id = 'typingIndicator';
  typingEl.innerHTML = `
    <div class="message-avatar bot-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  chatMessages.appendChild(typingEl);
  scrollToBottom();
}

function removeTypingIndicator() {
  const el = document.getElementById('typingIndicator');
  if (el) el.remove();
  chatState.isTyping = false;
}

function showTypingThen(callback, delay = 900) {
  showTypingIndicator();
  setTimeout(() => {
    removeTypingIndicator();
    callback();
  }, delay);
}

/* ============ MESSAGE HELPERS ============ */
function currentTime() {
  return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function addBotMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const div = document.createElement('div');
  div.className = 'chat-message bot-message';

  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');

  div.innerHTML = `
    <div class="message-avatar bot-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <div class="message-content">
      <p>${formatted}</p>
      <span class="message-time">${currentTime()}</span>
    </div>
  `;

  chatMessages.appendChild(div);
  scrollToBottom();
}

function addUserMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const div = document.createElement('div');
  div.className = 'chat-message user-message';

  div.innerHTML = `
    <div class="message-avatar user-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
    <div class="message-content">
      <p>${text}</p>
      <span class="message-time">${currentTime()}</span>
    </div>
  `;

  chatMessages.appendChild(div);
  scrollToBottom();
}

function addBotMessageWithActions(text, actions) {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return;

  const div = document.createElement('div');
  div.className = 'chat-message bot-message';

  const formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  const buttonsHTML = actions.map(a => `
    <button class="${a.className || 'contact-btn'}" data-action="${a.label}">
      ${a.icon || ''}
      <span>${a.label}</span>
    </button>
  `).join('');

  div.innerHTML = `
    <div class="message-avatar bot-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <div class="message-content">
      <p>${formatted}</p>
      <div class="contact-options">${buttonsHTML}</div>
      <span class="message-time">${currentTime()}</span>
    </div>
  `;

  // Attach click handlers
  const buttons = div.querySelectorAll('button[data-action]');
  buttons.forEach((btn, i) => {
    btn.addEventListener('click', () => {
      // Visually mark selected
      buttons.forEach(b => b.style.opacity = '0.5');
      btn.style.opacity = '1';
      actions[i].action();
    });
  });

  chatMessages.appendChild(div);
  scrollToBottom();
}

function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  if (chatMessages) {
    chatMessages.scrollTo({ top: chatMessages.scrollHeight, behavior: 'smooth' });
  }
}

/* ============ SVG ICON HELPERS ============ */
function phoneIcon()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`; }
function mailIcon()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>`; }
function whatsappIcon() { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>`; }
function pdfIcon()      { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`; }
function resetIcon()    { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><polyline points="1 4 1 10 7 10"></polyline><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path></svg>`; }
function infoIcon()     { return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:15px;height:15px;flex-shrink:0"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`; }

/* ========================================
   RAMAIS SYSTEM
   ======================================== */
async function loadRamais() {
  const container         = document.getElementById('ramaisContainer');
  const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');

  try {
    const response = await fetch(CONFIG.ramaisJsonPath);
    if (!response.ok) throw new Error('Failed to load');

    ramaisData = await response.json();

    if (ultimaAtualizacao) {
      ultimaAtualizacao.textContent = ramaisData.atualizado_em || '—';
    }

    renderRamais();
    showToast('Lista de ramais carregada!', 'success');
  } catch (error) {
    console.error('Error loading ramais:', error);
    if (container) {
      container.innerHTML = `
        <div class="no-results">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>Erro ao carregar a lista de ramais.</p>
        </div>
      `;
    }
    showToast('Erro ao carregar ramais', 'error');
  }
}

function renderRamais(data) {
  const container = document.getElementById('ramaisContainer');
  if (!container) return;
  container.innerHTML = '';

  const source = data || ramaisData;
  if (!source?.unidades?.length) {
    container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem">Nenhum ramal encontrado.</p>';
    return;
  }

  const unidade = source.unidades[0];

  unidade.setores.forEach(setor => {
    const setorCard = document.createElement('div');
    setorCard.className = 'setor-card';

    setorCard.innerHTML = `
      <div class="setor-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        ${setor.nome}
      </div>
    `;

    const content = document.createElement('div');
    content.className = 'setor-content';

    setor.colaboradores.forEach(c => {
      const item = document.createElement('div');
      item.className = 'contato-item';
      item.innerHTML = `
        <span class="contato-nome">${c.nome}</span>
        <span class="contato-ramal">${c.ramal}</span>
      `;
      content.appendChild(item);
    });

    setorCard.appendChild(content);
    container.appendChild(setorCard);
  });
}

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  let timeout;

  searchInput?.addEventListener('input', (e) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const term = e.target.value.trim().toLowerCase();
      if (term.length === 0) {
        renderRamais();
      } else if (term.length >= 2) {
        filterRamais(term);
      }
    }, 280);
  });
}

function filterRamais(term) {
  const container = document.getElementById('ramaisContainer');
  if (!container || !ramaisData?.unidades) return;
  container.innerHTML = '';

  const unidade  = ramaisData.unidades[0];
  let hasResults = false;

  unidade.setores.forEach(setor => {
    const matches = setor.colaboradores.filter(c =>
      c.nome.toLowerCase().includes(term) ||
      c.ramal.includes(term) ||
      setor.nome.toLowerCase().includes(term)
    );

    if (!matches.length) return;
    hasResults = true;

    const setorCard = document.createElement('div');
    setorCard.className = 'setor-card';
    setorCard.innerHTML = `
      <div class="setor-header">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        ${setor.nome} <span style="opacity:.7;font-weight:400">(${matches.length})</span>
      </div>
    `;

    const content = document.createElement('div');
    content.className = 'setor-content';

    matches.forEach(c => {
      const item = document.createElement('div');
      item.className = 'contato-item';
      item.innerHTML = `
        <span class="contato-nome">${highlight(c.nome, term)}</span>
        <span class="contato-ramal">${c.ramal}</span>
      `;
      content.appendChild(item);
    });

    setorCard.appendChild(content);
    container.appendChild(setorCard);
  });

  if (!hasResults) {
    container.innerHTML = `
      <div class="no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <p>Nenhum resultado para "<strong>${term}</strong>"</p>
      </div>
    `;
  }
}

function highlight(text, term) {
  const regex = new RegExp(`(${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark style="background:var(--primary-glow);color:var(--primary);border-radius:2px;padding:0 2px">$1</mark>');
}

/* ========================================
   INITIALIZATION
   ======================================== */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initSearch();
  loadRamais();
  console.log('✅ Sistema de Suporte inicializado');
});
