// ===================================
// DADOS DA ARQUITETURA REAL
// ===================================


const architectureData = {
    ativosz: {
        name: 'AtivosZ',
        description: 'Sistema inicial de geração de cartazes com layout fixo',
        composition: {
            JavaScript: 53.3,
            HTML: 28.5,
            CSS: 18.2
        },
        structure: [
            {
                type: 'folder',
                name: 'Data',
                expanded: false,
                files: [
                    { 
                        name: 'usuarios.json', 
                        type: 'json',
                        description: 'Base de usuários interna simples com permissões de acesso',
                        lines: 45
                    }
                ]
            },
            {
                type: 'folder',
                name: 'Imagens',
                expanded: false,
                files: [
                    { name: 'declaracaonova.png', type: 'image', description: 'Modelo de declaração atualizada' },
                    { name: 'declaracaosimples.png', type: 'image', description: 'Modelo de declaração simplificada' },
                    { name: 'hp.jpeg', type: 'image', description: 'Logo HP para documentos' },
                    { name: 'logozenir.png', type: 'image', description: 'Logo Zenir principal' },
                    { name: 'zenirlogo.png', type: 'image', description: 'Logo Zenir alternativa' }
                ]
            },
            {
                type: 'folder',
                name: 'css',
                expanded: false,
                files: [
                    { 
                        name: 'styles.css', 
                        type: 'css',
                        description: 'Estilos globais do sistema, definindo layout fixo e posicionamento absoluto',
                        lines: 320
                    }
                ]
            },
            {
                type: 'folder',
                name: 'js',
                expanded: false,
                files: [
                    { 
                        name: 'script.js', 
                        type: 'js',
                        description: 'Toda a lógica do sistema: geração de cartazes, cálculos, integração com GAS',
                        lines: 850
                    }
                ]
            },
            {
                type: 'folder',
                name: 'pages',
                expanded: false,
                files: [
                    { 
                        name: 'login.html', 
                        type: 'html',
                        description: 'Página de autenticação de usuários',
                        lines: 120
                    },
                    { 
                        name: 'bloqueado.html', 
                        type: 'html',
                        description: 'Tela exibida quando sessão expira ou detecta spam',
                        lines: 80
                    }
                ]
            },
            {
                type: 'file',
                name: 'index.html',
                fileType: 'html',
                description: 'Sistema principal de geração de cartazes com interface única',
                lines: 450
            }
        ]
    },
    funcz: {
        name: 'FuncZ',
        description: 'Plataforma viva com layouts adaptáveis e arquitetura modular',
        composition: {
            JavaScript: 52.7,
            CSS: 28.3,
            HTML: 19.0
        },
        structure: [
            {
                type: 'folder',
                name: 'avisos',
                expanded: false,
                files: [
                    { name: 'avisos-data.js', type: 'js', description: 'Banco de dados de avisos e changelog', lines: 180 },
                    { name: 'avisos.css', type: 'css', description: 'Estilos do widget de avisos', lines: 240 },
                    { name: 'avisos.js', type: 'js', description: 'Lógica do sistema de notificações', lines: 320 }
                ]
            },
            {
                type: 'folder',
                name: 'css',
                expanded: false,
                files: [
                    { name: 'declaracoes.css', type: 'css', description: 'Estilos para documentos fiscais', lines: 280 },
                    { name: 'login-styles.css', type: 'css', description: 'Estilos da tela de login', lines: 150 },
                    { name: 'ss.css', type: 'css', description: 'Estilos do hub de seleção de setor', lines: 200 },
                    { name: 'style.css', type: 'css', description: 'Estilos principais da geração de cartazes', lines: 520 },
                    { name: 'stylesadmin.css', type: 'css', description: 'Estilos exclusivos do painel administrativo', lines: 180 }
                ]
            },
            {
                type: 'folder',
                name: 'image',
                expanded: false,
                files: [
                    { name: 'assets/', type: 'folder', description: 'Recursos visuais do sistema' }
                ]
            },
            {
                type: 'folder',
                name: 'js',
                expanded: false,
                files: [
                    { name: 'auth-login.js', type: 'js', description: 'Autenticação e validação de credenciais', lines: 180 },
                    { name: 'declaracoes.js', type: 'js', description: 'Lógica de geração de documentos fiscais', lines: 420 },
                    { name: 'script.js', type: 'js', description: 'Core do sistema de cartazes com busca avançada e calculadora', lines: 980 },
                    { name: 'scriptadmin.js', type: 'js', description: 'Funções administrativas e gestão de usuários', lines: 350 },
                    { name: 'session-guard.js', type: 'js', description: 'Proteção de sessão em todas as páginas autenticadas', lines: 120 },
                    { name: 'ss.js', type: 'js', description: 'Lógica do hub de seleção', lines: 140 }
                ]
            },
            {
                type: 'folder',
                name: 'pages',
                expanded: false,
                files: [
                    { name: 'admin.html', type: 'html', description: 'Painel administrativo completo', lines: 380 },
                    { name: 'cartazes.html', type: 'html', description: 'Interface de criação de cartazes', lines: 520 },
                    { name: 'declaracoes.html', type: 'html', description: 'Sistema de documentos fiscais', lines: 340 },
                    { name: 'selectsetor.html', type: 'html', description: 'Hub de seleção de setor', lines: 180 }
                ]
            },
            {
                type: 'file',
                name: 'index.html',
                fileType: 'html',
                description: 'Login central unificado do sistema',
                lines: 220
            }
        ]
    },
    worker: {
        name: 'Cloudflare Worker',
        description: 'Ponte segura entre Frontend e Google App Script',
        composition: {
            JavaScript: 100
        },
        responsibilities: [
            'Roteamento seguro de requisições',
            'Proteção de credenciais do backend',
            'CORS e headers de segurança',
            'Cache de respostas frequentes',
            'Rate limiting',
            'Logs de requisições'
        ],
        note: 'Não contém lógica de negócio, apenas roteamento'
    },
    gas: {
        name: 'Google App Script',
        description: 'Backend lógico do sistema',
        composition: {
            'Google App Script': 100
        },
        responsibilities: [
            'Cadastro e gestão de usuários',
            'Cadastro e consulta de produtos',
            'Lógica de autenticação',
            'doGet() - Entrega JSON de produtos',
            'doPost() - Recebe dados via Worker',
            'Integração com Google Sheets',
            'Validações de negócio'
        ]
    }
};

// ===================================
// ÍCONES DE ARQUIVO
// ===================================

const fileIcons = {
    html: `<svg width="18" height="18" viewBox="0 0 32 32"><path fill="#e34c26" d="M5.902 27.201L3.656 2h24.688l-2.249 25.197L15.985 30 5.902 27.201z"/><path fill="#ef652a" d="M16 27.858l8.17-2.265 1.922-21.532H16v23.797z"/><path fill="#fff" d="M16 13.191h4.09l.282-3.165H16V6.935h7.75l-.074.829-.759 8.518H16v-3.091z"/><path fill="#ebebeb" d="M16 21.958l-.014.004-3.442-.93-.22-2.465H9.221l.433 4.853 6.331 1.758.015-.004v-3.216z"/><path fill="#fff" d="M19.827 16.151l-.372 4.139-3.447.93v3.216l6.336-1.756.047-.522.537-6.007h-3.101z"/><path fill="#ebebeb" d="M16 6.935v3.091h-7.168l-.062-.695L8.541 8.5l-.074-.829H16zm0 6.256v3.091h-3.399l-.062-.695-.229-2.396-.074-.829H16z"/></svg>`,
    css: `<svg width="18" height="18" viewBox="0 0 32 32"><path fill="#1572b6" d="M5.902 27.201L3.656 2h24.688l-2.249 25.197L15.985 30 5.902 27.201z"/><path fill="#33a9dc" d="M16 27.858l8.17-2.265 1.922-21.532H16v23.797z"/><path fill="#fff" d="M16 13.191h4.09l.282-3.165H16V6.935h7.75l-.074.829-.759 8.518H16v-3.091z"/><path fill="#ebebeb" d="M16 21.958l-.014.004-3.442-.93-.22-2.465H9.221l.433 4.853 6.331 1.758.015-.004v-3.216z"/><path fill="#fff" d="M19.827 16.151l-.372 4.139-3.447.93v3.216l6.336-1.756.047-.522.537-6.007h-3.101z"/><path fill="#ebebeb" d="M16 6.935v3.091h-7.168l-.062-.695L8.541 8.5l-.074-.829H16zm0 6.256v3.091h-3.399l-.062-.695-.229-2.396-.074-.829H16z"/></svg>`,
    js: `<svg width="18" height="18" viewBox="0 0 32 32"><rect fill="#f7df1e" width="32" height="32" rx="2"/><path d="M20.809 23.875c.385.73 1.002 1.264 2.003 1.264.998 0 1.631-.498 1.631-1.188 0-.826-.413-1.118-1.105-1.6l-.38-.243c-1.596-.913-2.656-2.056-2.656-4.472 0-2.227 1.696-3.921 4.347-3.921 1.886 0 3.241.656 4.214 2.377l-2.307 1.48c-.508-.912-1.056-1.27-1.907-1.27-.87 0-1.42.551-1.42 1.27 0 .888.551 1.247 1.824 1.799l.38.243c1.88 1.076 2.94 2.171 2.94 4.636 0 2.656-2.087 4.134-4.886 4.134-2.739 0-4.511-1.304-5.378-3.015l2.391-1.494zm-10.098.178c.349.621.664 1.145 1.425 1.145.726 0 1.183-.285 1.183-1.394v-7.548h2.929v7.57c0 2.298-1.348 3.346-3.316 3.346-1.777 0-2.808-.919-3.334-2.023l2.113-1.096z"/></svg>`,
    json: `<svg width="18" height="18" viewBox="0 0 32 32"><rect fill="#4b4b4b" width="32" height="32" rx="2"/><path fill="#cbcb41" d="M9.5 18.5c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5zm6.5 3.5c-1.4 0-2.5-.5-3.3-1.6l1.5-1.4c.5.6 1.1.9 1.8.9 1.1 0 1.9-.8 1.9-2.4v-7h2v7c0 2.8-1.6 4.5-4 4.5zm9 0c-1.7 0-3-.7-3.8-2l1.6-1.3c.5.8 1.1 1.3 2.2 1.3 1 0 1.6-.5 1.6-1.2 0-.8-.6-1.1-1.6-1.6l-.6-.2c-1.5-.6-2.5-1.4-2.5-3.1 0-1.5 1.2-2.7 3-2.7 1.3 0 2.2.5 2.9 1.6l-1.6 1c-.4-.6-.8-.9-1.3-.9-.6 0-1 .4-1 .9 0 .6.4.9 1.3 1.2l.6.2c1.7.7 2.7 1.5 2.7 3.2 0 1.8-1.4 2.9-3.4 2.9z"/></svg>`,
    image: `<svg width="18" height="18" viewBox="0 0 32 32"><rect fill="#4caf50" width="32" height="32" rx="2"/><circle cx="10" cy="10" r="3" fill="#fff"/><path fill="#fff" d="M4 24l6-8 4 6 6-10 8 12H4z"/></svg>`,
    folder: `<svg width="18" height="18" viewBox="0 0 32 32"><path fill="#ffa000" d="M27.5 5.5H17L14.2 3H4.5C3.7 3 3 3.7 3 4.5v23c0 .8.7 1.5 1.5 1.5h23c.8 0 1.5-.7 1.5-1.5v-21c0-.8-.7-1.5-1.5-1.5z"/><path fill="#ffca28" d="M27.5 9H4.5C3.7 9 3 9.7 3 10.5v17c0 .8.7 1.5 1.5 1.5h23c.8 0 1.5-.7 1.5-1.5v-17c0-.8-.7-1.5-1.5-1.5z"/></svg>`,
    folderOpen: `<svg width="18" height="18" viewBox="0 0 32 32"><path fill="#ffa000" d="M27.5 5.5H17L14.2 3H4.5C3.7 3 3 3.7 3 4.5v23c0 .8.7 1.5 1.5 1.5h23c.8 0 1.5-.7 1.5-1.5v-21c0-.8-.7-1.5-1.5-1.5z"/><path fill="#ffca28" d="M28.5 9H3.5c-.8 0-1.5.7-1.5 1.5L4 27.5c0 .8.7 1.5 1.5 1.5h21c.8 0 1.5-.7 1.5-1.5l2-16c0-.8-.7-1.5-1.5-1.5z"/></svg>`
};

// ===================================
// SCROLL SUAVE PARA EXPLORER
// ===================================

function scrollToExplorer() {
    const explorer = document.getElementById('explorer');
    explorer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===================================
// BOTÕES FLUTUANTES DE NAVEGAÇÃO
// ===================================

// Voltar ao topo
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Voltar à home (selectsetor.html)
function goToHome() {
    window.location.href = '/selectsetor.html';
}

// Controlar visibilidade do botão "Voltar ao Topo"
window.addEventListener('scroll', function() {
    const backToTopBtn = document.getElementById('backToTop');
    
    if (window.pageYOffset > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
});

// ===================================
// SYSTEM EXPLORER
// ===================================

function initExplorer() {
    const folderItems = document.querySelectorAll('.folder-item');
    
    folderItems.forEach(item => {
        item.addEventListener('click', function() {
            folderItems.forEach(f => f.classList.remove('active'));
            this.classList.add('active');
            
            const folderId = this.dataset.folder;
            loadSystemContent(folderId);
        });
    });
    
    // Carregar FuncZ por padrão
    loadSystemContent('funcz');
}

function loadSystemContent(systemId) {
    const data = architectureData[systemId];
    const contentArea = document.getElementById('folder-content');
    const tabName = document.getElementById('current-folder-name');
    
    tabName.textContent = data.name;
    
    if (systemId === 'worker' || systemId === 'gas') {
        // Renderizar view especial para Worker e GAS
        renderInfrastructureView(data, contentArea);
    } else {
        // Renderizar view de código para AtivosZ e FuncZ
        renderCodeView(data, contentArea);
    }
}

function renderCodeView(data, container) {
    let html = `
        <div class="folder-info">
            <h3>${data.name}</h3>
            <p>${data.description}</p>
        </div>
        
        <div class="composition-chart">
            <h4>Composição do Código</h4>
            <div class="chart-bars">
                ${Object.entries(data.composition).map(([tech, value]) => `
                    <div class="chart-item">
                        <div class="chart-label">
                            <span class="tech-name">${tech}</span>
                            <span class="tech-percentage">${value}%</span>
                        </div>
                        <div class="chart-bar">
                            <div class="chart-fill ${tech.toLowerCase().replace(' ', '-')}" 
                                 style="width: 0%;" 
                                 data-target="${value}"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
        
        <div class="file-tree">
            <h4>Estrutura de Arquivos</h4>
            ${renderFileTree(data.structure)}
        </div>
    `;
    
    container.innerHTML = html;
    
    // Inicializar interações
    initFileTreeInteractions();
    
    // Animar barras
    setTimeout(() => {
        document.querySelectorAll('.chart-fill').forEach(fill => {
            fill.style.width = fill.dataset.target + '%';
        });
    }, 100);
}

function renderFileTree(structure) {
    return `
        <div class="tree-container">
            ${structure.map(item => {
                if (item.type === 'folder') {
                    return `
                        <div class="tree-folder" data-folder-name="${item.name}">
                            <div class="tree-folder-header">
                                ${fileIcons.folder}
                                <span class="folder-name">${item.name}</span>
                                <span class="folder-toggle">›</span>
                            </div>
                            <div class="tree-folder-content">
                                ${item.files.map(file => `
                                    <div class="tree-file" data-file="${file.name}" title="${file.description || ''}">
                                        ${fileIcons[file.type] || fileIcons.folder}
                                        <span class="file-name">${file.name}</span>
                                        ${file.lines ? `<span class="file-lines">${file.lines} linhas</span>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    `;
                } else {
                    return `
                        <div class="tree-file" data-file="${item.name}" title="${item.description || ''}">
                            ${fileIcons[item.fileType] || fileIcons.html}
                            <span class="file-name">${item.name}</span>
                            ${item.lines ? `<span class="file-lines">${item.lines} linhas</span>` : ''}
                        </div>
                    `;
                }
            }).join('')}
        </div>
    `;
}

function renderInfrastructureView(data, container) {
    const isWorker = data.name === 'Cloudflare Worker';
    
    let html = `
        <div class="folder-info">
            <h3>${data.name}</h3>
            <p>${data.description}</p>
            ${data.note ? `<p class="infrastructure-note">${data.note}</p>` : ''}
        </div>
        
        ${isWorker ? `
            <div class="composition-chart">
                <h4>Tecnologia</h4>
                <div class="chart-bars">
                    <div class="chart-item">
                        <div class="chart-label">
                            <span class="tech-name">JavaScript (Edge Runtime)</span>
                            <span class="tech-percentage">100%</span>
                        </div>
                        <div class="chart-bar">
                            <div class="chart-fill javascript" style="width: 100%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        ` : `
            <div class="composition-chart">
                <h4>Tecnologia</h4>
                <div class="chart-bars">
                    <div class="chart-item">
                        <div class="chart-label">
                            <span class="tech-name">Google App Script</span>
                            <span class="tech-percentage">100%</span>
                        </div>
                        <div class="chart-bar">
                            <div class="chart-fill google-app-script" style="width: 100%;"></div>
                        </div>
                    </div>
                </div>
            </div>
        `}
        
        <div class="responsibilities-list">
            <h4>Responsabilidades</h4>
            <ul>
                ${data.responsibilities.map(resp => `
                    <li>
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <circle cx="8" cy="8" r="7" fill="#e8f4ff" stroke="#0066cc" stroke-width="1"/>
                            <path d="M5 8 L7 10 L11 6" stroke="#0066cc" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                        ${resp}
                    </li>
                `).join('')}
            </ul>
        </div>
    `;
    
    container.innerHTML = html;
}

function initFileTreeInteractions() {
    // Expandir/colapsar pastas
    document.querySelectorAll('.tree-folder-header').forEach(header => {
        header.addEventListener('click', function() {
            const folder = this.closest('.tree-folder');
            folder.classList.toggle('expanded');
            
            const toggle = this.querySelector('.folder-toggle');
            toggle.style.transform = folder.classList.contains('expanded') ? 'rotate(90deg)' : '';
        });
    });
    
    // Mostrar tooltip ao clicar em arquivo
    document.querySelectorAll('.tree-file').forEach(file => {
        file.addEventListener('click', function() {
            const description = this.getAttribute('title');
            if (description) {
                showFileTooltip(this, description);
            }
        });
    });
}

function showFileTooltip(element, description) {
    // Remove tooltip anterior
    const existingTooltip = document.querySelector('.file-tooltip');
    if (existingTooltip) existingTooltip.remove();
    
    // Cria novo tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'file-tooltip';
    tooltip.textContent = description;
    
    // Adiciona ao DOM primeiro para calcular dimensões
    document.body.appendChild(tooltip);
    
    // Calcula posição
    const rect = element.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
    // Posição inicial (à direita do elemento)
    let left = rect.right + scrollLeft + 10;
    let top = rect.top + scrollTop;
    
    // Ajusta se sair da tela pela direita
    if (left + tooltipRect.width > window.innerWidth + scrollLeft) {
        // Coloca à esquerda do elemento
        left = rect.left + scrollLeft - tooltipRect.width - 10;
    }
    
    // Ajusta se sair da tela pela esquerda
    if (left < scrollLeft) {
        left = scrollLeft + 10;
    }
    
    // Ajusta se sair da tela por baixo
    if (top + tooltipRect.height > window.innerHeight + scrollTop) {
        top = window.innerHeight + scrollTop - tooltipRect.height - 10;
    }
    
    // Ajusta se sair da tela por cima
    if (top < scrollTop) {
        top = scrollTop + 10;
    }
    
    tooltip.style.position = 'absolute';
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.pointerEvents = 'auto';
    
    // Remove ao clicar fora ou no tooltip
    const removeTooltip = (e) => {
        if (!tooltip.contains(e.target) && e.target !== element) {
            tooltip.remove();
            document.removeEventListener('click', removeTooltip);
        }
    };
    
    // Adiciona o listener após um pequeno delay para não remover imediatamente
    setTimeout(() => {
        document.addEventListener('click', removeTooltip);
    }, 100);
    
    // Remove ao clicar no próprio tooltip
    tooltip.addEventListener('click', () => {
        tooltip.remove();
        document.removeEventListener('click', removeTooltip);
    });
}

// ===================================
// PUZZLE DRAG & DROP
// ===================================

let draggedElement = null;
let completedSlots = 0;

function initPuzzle() {
    const draggableItems = document.querySelectorAll('.draggable-item');
    const droppableSlots = document.querySelectorAll('.droppable-slot');
    
    draggableItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
    });
    
    droppableSlots.forEach(slot => {
        slot.addEventListener('dragover', handleDragOver);
        slot.addEventListener('dragleave', handleDragLeave);
        slot.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
    return false;
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    this.classList.remove('drag-over');
    
    if (this.classList.contains('filled')) {
        return false;
    }
    
    const correctAnswer = this.dataset.answer;
    const droppedValue = draggedElement.dataset.value;
    
    if (correctAnswer === droppedValue) {
        const text = draggedElement.querySelector('span').textContent;
        this.textContent = text;
        this.classList.add('filled');
        draggedElement.classList.add('used');
        
        completedSlots++;
        
        if (completedSlots === 3) {
            showPuzzleResult();
        }
    }
    
    return false;
}

function showPuzzleResult() {
    const resultDiv = document.getElementById('puzzle-result');
    const statusSpan = document.getElementById('puzzle-status');
    
    statusSpan.textContent = 'Completo';
    statusSpan.classList.add('complete');
    
    resultDiv.style.display = 'block';
    
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 300);
}

// ===================================
// ANIMAÇÃO DAS BARRAS DE COMPARAÇÃO
// ===================================

function initComparisonBars() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bars = entry.target.querySelectorAll('.bar');
                bars.forEach(bar => {
                    const value = bar.dataset.value;
                    setTimeout(() => {
                        bar.style.width = `${value}%`;
                    }, 100);
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    const comparisonTable = document.querySelector('.comparison-table');
    if (comparisonTable) {
        observer.observe(comparisonTable);
    }
}

// ===================================
// LABELS RESPONSIVAS NA TABELA
// ===================================

function initResponsiveTable() {
    if (window.innerWidth <= 768) {
        const cells = document.querySelectorAll('.table-row .td:not(.system-name)');
        const labels = ['HTML', 'CSS', 'JavaScript', 'Google App Script', 'Workers'];
        
        cells.forEach((cell, index) => {
            const labelIndex = index % 5;
            cell.setAttribute('data-label', labels[labelIndex]);
        });
    }
}

// ===================================
// ANIMAÇÃO DE ENTRADA
// ===================================

function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, { threshold: 0.1 });
    
    const elements = document.querySelectorAll('.insight-card, .principle');
    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        observer.observe(el);
    });
}

// ===================================
// INICIALIZAÇÃO
// ===================================

document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 FuncZ - Arquitetura Viva inicializada');
    
    initExplorer();
    initPuzzle();
    initComparisonBars();
    initResponsiveTable();
    initScrollAnimations();
    
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            initResponsiveTable();
        }, 250);
    });
    
    console.log('✅ Todas as funcionalidades ativas');
});

// ===================================
// SMOOTH SCROLL GLOBAL
// ===================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===================================
// PERFORMANCE MONITOR
// ===================================

if (performance && performance.mark) {
    performance.mark('page-interactive');
    
    window.addEventListener('load', () => {
        performance.mark('page-loaded');
        performance.measure('time-to-interactive', 'page-interactive', 'page-loaded');
        
        const measure = performance.getEntriesByName('time-to-interactive')[0];
        console.log(`⚡ Tempo até interatividade: ${measure.duration.toFixed(2)}ms`);
    });
}

// ===================================
// EASTER EGG: CONSOLE ART
// ===================================


// ===================================
// EXPORT GLOBAL
// ===================================

window.FuncZArchitecture = {
    architectureData,
    loadSystemContent,
    version: '2.0.0',
    initialized: true
};
