/* ========================================
   CONFIGURATION & STATE
   ======================================== */
const CONFIG = {
  ramaisJsonPath: '../data/ramais.json'
};

let ramaisData = null;
let chatState = {
  stage: 'initial',
  awaitingResponse: false
};

/* ========================================
   TOAST NOTIFICATIONS
   ======================================== */
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/* ========================================
   THEME TOGGLE
   ======================================== */
function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  const themeText = document.getElementById('themeText');
  const body = document.body;

  const savedTheme = localStorage.getItem('theme') || 'light';
  body.setAttribute('data-theme', savedTheme);
  updateThemeText(savedTheme);

  themeToggle?.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    body.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeText(newTheme);
  });

  function updateThemeText(theme) {
    if (themeText) {
      themeText.textContent = theme === 'light' ? 'Tema Escuro' : 'Tema Claro';
    }
  }
}

/* ========================================
   NAVIGATION
   ======================================== */
function initNavigation() {
  const backButton = document.getElementById('backButton');
  const mainCards = document.getElementById('mainCards');
  const sections = document.querySelectorAll('.section-content');
  const supportCards = document.querySelectorAll('.support-card');
  const backBtns = document.querySelectorAll('.back-btn');

  backButton?.addEventListener('click', () => {
    window.location.href = '../home/selectsetor.html';
  });

  // Click nos cards principais
  supportCards.forEach(card => {
    const section = card.getAttribute('data-section');
    
    card.addEventListener('click', (e) => {
      if (e.target.classList.contains('card-btn') || e.target.closest('.card-btn')) {
        showSection(section);
      }
    });

    const btn = card.querySelector('.card-btn');
    btn?.addEventListener('click', (e) => {
      e.stopPropagation();
      showSection(section);
    });
  });

  // Botões de voltar nas seções
  backBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hideAllSections();
      mainCards.style.display = 'grid';
    });
  });

  function showSection(sectionName) {
    mainCards.style.display = 'none';
    sections.forEach(section => {
      section.style.display = 'none';
    });
    const targetSection = document.getElementById(`${sectionName}-content`);
    if (targetSection) {
      targetSection.style.display = 'block';
      
      // Inicializar chatbot se for seção sistema
      if (sectionName === 'sistema') {
        initChatbot();
      }
    }
  }

  function hideAllSections() {
    sections.forEach(section => {
      section.style.display = 'none';
    });
  }
}

/* ========================================
   CHATBOT SYSTEM
   ======================================== */
const chatbotPhrases = [
  "Olá! Para começar, me conte: qual sistema está apresentando problemas para você?",
  "Oi! Vamos resolver isso juntos. Qual é o sistema que você está tendo dificuldades?",
  "Seja bem-vindo! Primeiro, preciso saber: em qual sistema você está enfrentando problemas?",
  "Olá! Estou aqui para ajudar. Pode me dizer qual sistema não está funcionando bem?",
  "Oi! Vamos lá. Qual o nome do sistema que está te dando dor de cabeça hoje?"
];

function initChatbot() {
  const chatMessages = document.getElementById('chatMessages');
  const chatInput = document.getElementById('chatInput');
  const sendBtn = document.getElementById('sendBtn');
  const resetBtn = document.getElementById('resetChatBtn');

  // Limpar mensagens anteriores
  if (chatState.stage === 'initial') {
    chatMessages.innerHTML = '';
    
    // Escolher frase aleatória
    const randomPhrase = chatbotPhrases[Math.floor(Math.random() * chatbotPhrases.length)];
    
    // Adicionar mensagem inicial
    setTimeout(() => {
      addBotMessage(randomPhrase);
      chatState.awaitingResponse = true;
    }, 300);
  }

  // Enviar mensagem
  sendBtn?.addEventListener('click', handleUserInput);
  
  chatInput?.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      handleUserInput();
    }
  });

  // Reset
  resetBtn?.addEventListener('click', () => {
    chatState = { stage: 'initial', awaitingResponse: false };
    initChatbot();
  });
}

function handleUserInput() {
  const chatInput = document.getElementById('chatInput');
  const userText = chatInput.value.trim().toLowerCase();

  if (!userText || !chatState.awaitingResponse) return;

  // Adicionar mensagem do usuário
  addUserMessage(chatInput.value.trim());
  chatInput.value = '';
  chatState.awaitingResponse = false;

  // Processar resposta
  setTimeout(() => {
    processUserResponse(userText);
  }, 800);
}

function processUserResponse(userInput) {
  // Detectar sistema FuncZ (Cartazes, Declarações, etc)
  const funcZKeywords = ['cartaz', 'cartazes', 'declarac', 'declaração', 'declaracoes', 'funcz', 'func'];
  const isFuncZ = funcZKeywords.some(keyword => userInput.includes(keyword));

  // Detectar sistemas de gestão (Odoo, sistemas gerais)
  const odooKeywords = ['odoo', 'siste', 'gestao', 'gestão', 'erp'];
  const isOdoo = odooKeywords.some(keyword => userInput.includes(keyword));

  if (isFuncZ) {
    showFuncZSupport();
  } else if (isOdoo) {
    showOdooSupport();
  } else {
    showUnknownSystem(userInput);
  }
}

function showFuncZSupport() {
  addBotMessage("Entendi! Você está com problemas no **FuncZ** (sistemas de Cartazes e Declarações).");
  
  setTimeout(() => {
    addBotMessage("O suporte para estes sistemas funciona das seguintes formas:");
    
    setTimeout(() => {
      const message = document.createElement('div');
      message.className = 'chat-message bot-message';
      message.innerHTML = `
        <div class="message-avatar bot-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div class="message-content">
          <div class="contact-options">
            <button class="contact-btn" onclick="showContactInfo('ramal')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
              </svg>
              <span>📞 Ligar no Ramal 302</span>
            </button>
            <button class="contact-btn" onclick="showContactInfo('email')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <span>📧 Enviar E-mail</span>
            </button>
            <button class="contact-btn" onclick="showContactInfo('whatsapp')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
              </svg>
              <span>💬 WhatsApp (se urgente)</span>
            </button>
          </div>
        </div>
      `;
      
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.appendChild(message);
      scrollToBottom();
    }, 1000);
  }, 800);
}

function showOdooSupport() {
  addBotMessage("Entendi! Você precisa de suporte para sistemas de **gestão (Odoo/ERP)**.");
  
  setTimeout(() => {
    addBotMessage("Para este tipo de sistema, entre em contato com o setor de **T.I. (Tecnologia da Informação)**:");
    
    setTimeout(() => {
      const tiInfo = `
📞 **Ramais da T.I.:**

• **Lívia** - Ramal 221
• **Vinícius** - Ramal 205  
• **Karolinne** - Ramal 230
• **Gustavo** - Ramal 318
• **Gabriel** - Ramal 302  
• **Weslle** - Ramal 295
• **Enzio** - Ramal 301  
• **Pablo** - Ramal 208

**Horário de atendimento:**
Segunda a Sexta: 07h às 19h
Sábado: 08h às 14h
      `;
      addBotMessage(tiInfo);
      chatState.awaitingResponse = false;
    }, 1000);
  }, 800);
}

function showUnknownSystem(userInput) {
  addBotMessage(`Hmm, não reconheci o sistema "${userInput}".`);
  
  setTimeout(() => {
    addBotMessage("Vou te ajudar a encontrar o suporte correto. Você pode:");
    
    setTimeout(() => {
      const message = document.createElement('div');
      message.className = 'chat-message bot-message';
      message.innerHTML = `
        <div class="message-avatar bot-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
        </div>
        <div class="message-content">
          <div class="contact-options">
            <button class="contact-btn" onclick="showContactInfo('geral')">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <span>ℹ️ Ver Informações Gerais de Suporte</span>
            </button>
            <button class="contact-btn" onclick="resetChatManual()">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="1 4 1 10 7 10"></polyline>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"></path>
              </svg>
              <span>🔄 Tentar Novamente</span>
            </button>
          </div>
        </div>
      `;
      
      const chatMessages = document.getElementById('chatMessages');
      chatMessages.appendChild(message);
      scrollToBottom();
    }, 1000);
  }, 800);
}

function showContactInfo(type) {
  let message = '';
  
  switch(type) {
    case 'ramal':
      message = `
📞 **Contato por Ramal**

**Ramal: 302** (Gabriel)

**Horários de atendimento:**
• Segunda a Sexta: 08h às 12h e 14h às 18h
• Sábado: 08h às 13h

Basta discar 302 no seu telefone interno!
      `;
      break;
      
    case 'email':
      message = `
📧 **Contato por E-mail**

**E-mail:** gabriel.oliveira@grupozenir.com.br

Envie um e-mail detalhando seu problema. O tempo de resposta é de até **24 horas úteis**.

Lembre-se de incluir:
• Qual sistema está com problema
• O que aconteceu (mensagem de erro, tela, etc)
• Prints se possível
      `;
      break;
      
    case 'whatsapp':
      message = `
💬 **Contato por WhatsApp**

**Número:** (88) 98856-8911

⚠️ **Use apenas em casos urgentes!**

Este canal é para emergências quando:
• O problema impede completamente o trabalho
• Já tentou os outros canais
• É fora do horário comercial mas precisa resolver

**Horário:** Disponível dentro do horário comercial (Seg-Sex 8h-18h, Sáb 8h-13h)
      `;
      break;
      
    case 'geral':
      message = `
ℹ️ **Informações Gerais de Suporte**

**Para sistemas FuncZ (Cartazes/Declarações):**
📞 Ramal 302 (Karolinne)
📧 gabriel.oliveira@grupozenir.com.br
💬 WhatsApp: (88) 98856-8911 (urgências)

**Para outros sistemas (Odoo/ERP):**
📞 T.I. - Ramais 213 e 311
👥 Richard, Ryan ou Zé Leite

**Horários:**
Segunda a Sexta: 08h-12h e 14h-18h
Sábado: 08h-13h
      `;
      break;
  }
  
  addBotMessage(message);
  chatState.awaitingResponse = false;
}

function resetChatManual() {
  chatState = { stage: 'initial', awaitingResponse: false };
  initChatbot();
}

function addBotMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  const message = document.createElement('div');
  message.className = 'chat-message bot-message';
  
  const formattedText = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>');
  
  message.innerHTML = `
    <div class="message-avatar bot-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
    </div>
    <div class="message-content">
      <p>${formattedText}</p>
    </div>
  `;
  
  chatMessages.appendChild(message);
  scrollToBottom();
}

function addUserMessage(text) {
  const chatMessages = document.getElementById('chatMessages');
  const message = document.createElement('div');
  message.className = 'chat-message user-message';
  
  message.innerHTML = `
    <div class="message-avatar user-avatar">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
        <circle cx="12" cy="7" r="4"></circle>
      </svg>
    </div>
    <div class="message-content">
      <p>${text}</p>
    </div>
  `;
  
  chatMessages.appendChild(message);
  scrollToBottom();
}

function scrollToBottom() {
  const chatMessages = document.getElementById('chatMessages');
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ========================================
   RAMAIS SYSTEM
   ======================================== */
async function loadRamais() {
  const container = document.getElementById('ramaisContainer');
  const ultimaAtualizacao = document.getElementById('ultimaAtualizacao');

  try {
    const response = await fetch(CONFIG.ramaisJsonPath);
    if (!response.ok) throw new Error('Failed to load ramais');

    ramaisData = await response.json();

    if (ultimaAtualizacao) {
      ultimaAtualizacao.textContent = ramaisData.atualizado_em;
    }

    renderRamais();
    showToast('Lista de ramais carregada!', 'success');
  } catch (error) {
    console.error('Error loading ramais:', error);
    container.innerHTML = `
      <div class="no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <p>Erro ao carregar lista de ramais.</p>
      </div>
    `;
    showToast('Erro ao carregar ramais', 'error');
  }
}

function renderRamais() {
  const container = document.getElementById('ramaisContainer');
  container.innerHTML = '';

  if (!ramaisData || !ramaisData.unidades || ramaisData.unidades.length === 0) {
    container.innerHTML = '<p>Nenhum ramal encontrado.</p>';
    return;
  }

  const unidade = ramaisData.unidades[0]; // Iguatu - Sede

  unidade.setores.forEach(setor => {
    const setorCard = document.createElement('div');
    setorCard.className = 'setor-card';

    const header = document.createElement('div');
    header.className = 'setor-header';
    header.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
        <circle cx="9" cy="7" r="4"></circle>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
      </svg>
      ${setor.nome}
    `;

    const content = document.createElement('div');
    content.className = 'setor-content';

    setor.colaboradores.forEach(colaborador => {
      const contatoItem = document.createElement('div');
      contatoItem.className = 'contato-item';
      contatoItem.innerHTML = `
        <span class="contato-nome">${colaborador.nome}</span>
        <span class="contato-ramal">${colaborador.ramal}</span>
      `;
      content.appendChild(contatoItem);
    });

    setorCard.appendChild(header);
    setorCard.appendChild(content);
    container.appendChild(setorCard);
  });
}

function initSearch() {
  const searchInput = document.getElementById('searchInput');
  let searchTimeout;

  searchInput?.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    
    searchTimeout = setTimeout(() => {
      const searchTerm = e.target.value.trim().toLowerCase();
      
      if (searchTerm.length === 0) {
        renderRamais();
      } else if (searchTerm.length >= 2) {
        filterRamais(searchTerm);
      }
    }, 300);
  });
}

function filterRamais(searchTerm) {
  const container = document.getElementById('ramaisContainer');
  container.innerHTML = '';

  if (!ramaisData || !ramaisData.unidades) return;

  const unidade = ramaisData.unidades[0];
  let hasResults = false;

  unidade.setores.forEach(setor => {
    const matchingColaboradores = setor.colaboradores.filter(colaborador => {
      return colaborador.nome.toLowerCase().includes(searchTerm) ||
             colaborador.ramal.includes(searchTerm) ||
             setor.nome.toLowerCase().includes(searchTerm);
    });

    if (matchingColaboradores.length > 0) {
      hasResults = true;
      
      const setorCard = document.createElement('div');
      setorCard.className = 'setor-card';

      const header = document.createElement('div');
      header.className = 'setor-header';
      header.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
          <circle cx="9" cy="7" r="4"></circle>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
        </svg>
        ${setor.nome} (${matchingColaboradores.length})
      `;

      const content = document.createElement('div');
      content.className = 'setor-content';

      matchingColaboradores.forEach(colaborador => {
        const contatoItem = document.createElement('div');
        contatoItem.className = 'contato-item';
        contatoItem.innerHTML = `
          <span class="contato-nome">${colaborador.nome}</span>
          <span class="contato-ramal">${colaborador.ramal}</span>
        `;
        content.appendChild(contatoItem);
      });

      setorCard.appendChild(header);
      setorCard.appendChild(content);
      container.appendChild(setorCard);
    }
  });

  if (!hasResults) {
    container.innerHTML = `
      <div class="no-results">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <path d="m21 21-4.35-4.35"></path>
        </svg>
        <p>Nenhum resultado para "<strong>${searchTerm}</strong>"</p>
      </div>
    `;
  }
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
