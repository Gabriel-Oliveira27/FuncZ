console.log('📦 func-json.js carregando...');

// ==================================================
// SEÇÃO 1: VARIÁVEIS GLOBAIS
// ==================================================
let produtosBackup = null;
let timeoutRecuperacao = null;
let debugMenuAberto = false;
let jsonValidado = false;
let arquivoJSON = null;

// ==================================================
// SEÇÃO 2: LIMPAR TODOS OS PRODUTOS COM RECUPERAÇÃO
// ==================================================
function atualizarBotoesAcao() {
    const productsActions = document.getElementById('products-actions');
    const btnGerarPDF = document.getElementById('btn-gerar-pdf');
    
    if (products.length > 0) {
        if (productsActions) {
            productsActions.style.display = 'flex';
        }
        if (btnGerarPDF) {
            btnGerarPDF.style.display = 'inline-flex';
        }
    } else {
        if (productsActions) {
            productsActions.style.display = 'none';
        }
        if (btnGerarPDF) {
            btnGerarPDF.style.display = 'none';
        }
    }
}

// Sobrescrever renderProducts para incluir atualização dos botões
const renderProductsOriginal = window.renderProducts;
if (renderProductsOriginal) {
    window.renderProducts = function() {
        renderProductsOriginal.call(this);
        atualizarBotoesAcao();
    };
}

function executarLimpezaCompleta() {
    const totalRemovido = produtosBackup.length;
    
    products = [];
    saveProducts();
    renderProducts();
    
    showToast('success', 'Produtos limpos!', `${totalRemovido} produto(s) removidos`);
    
    mostrarToastRecuperacao(totalRemovido);
}

function mostrarToastRecuperacao(total) {
    const container = document.getElementById('toast-container');
    if (!container) return;
    
    const toastAnterior = document.querySelector('.toast-recuperar');
    if (toastAnterior) {
        toastAnterior.remove();
    }
    
    const toast = document.createElement('div');
    toast.className = 'toast toast-warning toast-recuperar';
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid fa-undo"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">Produtos removidos</div>
            <div class="toast-message">${total} produto(s) podem ser recuperados</div>
        </div>
        <button class="toast-action-btn" onclick="recuperarProdutosCompleto()">
            <i class="fa-solid fa-undo"></i> Recuperar
        </button>
    `;
    
    container.appendChild(toast);
    
    if (timeoutRecuperacao) {
        clearTimeout(timeoutRecuperacao);
    }
    
    timeoutRecuperacao = setTimeout(() => {
        if (toast.parentNode) {
            toast.style.animation = 'slideDown 0.3s ease-out reverse';
            setTimeout(() => {
                toast.remove();
                produtosBackup = null;
            }, 300);
        }
    }, 15000);
}

window.recuperarProdutosCompleto = function() {
    if (produtosBackup && produtosBackup.length > 0) {
        products = JSON.parse(JSON.stringify(produtosBackup));
        saveProducts();
        renderProducts();
        
        const toastRecuperar = document.querySelector('.toast-recuperar');
        if (toastRecuperar) {
            toastRecuperar.remove();
        }
        
        if (timeoutRecuperacao) {
            clearTimeout(timeoutRecuperacao);
        }
        
        showToast('success', 'Recuperado!', `${produtosBackup.length} produto(s) foram restaurados`);
        produtosBackup = null;
    }
};

// ==================================================
// SEÇÃO 3: VER JSON DOS CARTAZES (VIEW COMPLETA)
// ==================================================
function carregarViewVerJSON() {
    const emptyDiv = document.getElementById('ver-json-empty');
    const contentDiv = document.getElementById('ver-json-content');
    const jsonCode = document.getElementById('json-viewer-code');
    const jsonEditor = document.getElementById('json-editor-textarea');
    
    if (!emptyDiv || !contentDiv || !jsonCode) {
        console.warn('Elementos da view Ver JSON não encontrados');
        return;
    }
    
    const dados = {
        versao: '1.0',
        origem: 'desktop',
        dataGeracao: new Date().toISOString(),
        totalCartazes: products.length,
        cartazes: products.map(item => ({
            codigo: item.codigo,
            descricao: item.descricao,
            subdescricao: item.subdescricao || '',
            features: item.features || [],
            metodo: item.metodo,
            avista: item.avista,
            juros: item.juros,
            parcela: item.parcela || 0,
            motivo: item.motivo || '',
            validade: item.validade || '',
            autorizacao: item.autorizacao || '',
            garantia12: item.garantia12 || 0,
            garantia24: item.garantia24 || 0,
            garantia36: item.garantia36 || 0
        }))
    };
    
    if (!dados || dados.totalCartazes === 0) {
        emptyDiv.style.display = 'block';
        contentDiv.style.display = 'none';
    } else {
        emptyDiv.style.display = 'none';
        contentDiv.style.display = 'block';
        
        const jsonFormatado = JSON.stringify(dados, null, 2);
        jsonCode.textContent = jsonFormatado;
        if (jsonEditor) {
            jsonEditor.value = jsonFormatado;
        }
    }
}

function mostrarErroEdicao(mensagem, errorDiv, errorText) {
    if (errorDiv) errorDiv.style.display = 'flex';
    if (errorText) errorText.textContent = mensagem;
}

function esconderErroEdicao(errorDiv) {
    if (errorDiv) errorDiv.style.display = 'none';
}

// ==================================================
// SEÇÃO 4: IMPORTAÇÃO DE JSON COM PREVIEWS
// ==================================================
function recriarAbasImportacao() {
    const viewImportar = document.getElementById('view-importar-json');
    if (!viewImportar) return;

    const card = viewImportar.querySelector('.card');
    if (!card) return;

    card.innerHTML = `
        <h2 style="margin-bottom: 16px;">
            <i class="fa-solid fa-file-import"></i> Importar Cartazes por JSON
        </h2>
        <p style="margin-bottom: 24px; color: var(--gray-600);">
            Escolha o método de importação: colar o JSON diretamente ou importar de um arquivo.
        </p>

        <!-- Abas principais -->
        <div class="import-tabs">
            <button class="import-tab active" data-import-tab="colando">
                <i class="fa-solid fa-paste"></i>
                <span>Importar Colando</span>
            </button>
            <button class="import-tab" data-import-tab="arquivo">
                <i class="fa-solid fa-file-upload"></i>
                <span>Importar por Arquivo</span>
            </button>
        </div>

        <!-- Conteúdo: Importar Colando -->
        <div id="import-content-colando" class="import-content active">
            <div class="form-group">
                <label for="json-text-input">Cole o JSON dos Cartazes *</label>
                <textarea id="json-text-input" rows="12" placeholder='{"cartazes": [{"codigo": "123456", "descricao": "Produto", ...}]}'></textarea>
                <p class="help-text">Cole o JSON exportado do sistema aqui. A validação é automática.</p>
            </div>
            <button id="btn-validar-json-colado" class="btn-primary" style="margin-top: 12px;">
                <i class="fa-solid fa-check-circle"></i>
                Validar e Carregar JSON
            </button>
        </div>

        <!-- Conteúdo: Importar por Arquivo -->
        <div id="import-content-arquivo" class="import-content">
            <!-- Sub-abas -->
            <div style="display: flex; gap: 12px; margin-bottom: 20px; border-bottom: 2px solid var(--gray-200); padding-bottom: 12px;">
                <button id="sub-tab-cloud" class="sub-import-tab active" data-sub-tab="cloud" style="flex: 1; padding: 10px 16px; background: var(--primary); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                    <i class="fa-solid fa-cloud"></i>
                    Importar de URL (Cloud/Drive)
                </button>
                <button id="sub-tab-upload" class="sub-import-tab" data-sub-tab="upload" style="flex: 1; padding: 10px 16px; background: white; color: var(--gray-700); border: 1px solid var(--gray-300); border-radius: 8px; cursor: pointer; font-weight: 500; transition: all 0.2s;">
                    <i class="fa-solid fa-upload"></i>
                    Upload de Arquivo
                </button>
            </div>

            <!-- Sub-conteúdo: Importar de URL -->
            <div id="import-subcontent-cloud" class="import-subcontent active">
                <div class="form-group">
                    <label for="json-url-input">URL do Arquivo JSON *</label>
                    <input type="url" id="json-url-input" placeholder="https://drive.google.com/..." style="padding: 14px; border: 1px solid var(--gray-300); border-radius: 8px; width: 100%; font-size: 15px;">
                    <p class="help-text">Cole a URL pública do arquivo JSON (Google Drive, Dropbox, etc.)</p>
                </div>
                <button id="btn-importar-url" class="btn-primary" style="margin-top: 12px;">
                    <i class="fa-solid fa-cloud-arrow-down"></i>
                    Buscar JSON da URL
                </button>
            </div>

            <!-- Sub-conteúdo: Upload -->
            <div id="import-subcontent-upload" class="import-subcontent" style="display: none;">
                <div class="upload-area" id="upload-area" style="border: 2px dashed var(--gray-300); border-radius: 12px; padding: 40px; text-align: center; background: var(--gray-50); cursor: pointer; transition: all 0.2s;">
                    <div class="upload-icon" style="margin-bottom: 16px;">
                        <i class="fa-solid fa-cloud-arrow-up" style="font-size: 48px; color: var(--gray-400);"></i>
                    </div>
                    <h3 style="margin-bottom: 8px;">Arraste o arquivo JSON aqui</h3>
                    <p style="color: var(--gray-500); margin-bottom: 20px;">ou clique para selecionar do seu computador</p>
                    <input type="file" id="json-file-input" accept=".json" style="display: none;">
                    <button type="button" class="btn-secondary" onclick="document.getElementById('json-file-input').click()">
                        <i class="fa-solid fa-folder-open"></i>
                        Selecionar Arquivo
                    </button>
                </div>
                <div id="file-info" class="file-info" style="display: none; margin-top: 20px; padding: 16px; background: white; border: 1px solid var(--gray-200); border-radius: 8px; align-items: center; gap: 12px;">
                    <i class="fa-solid fa-file-code" style="font-size: 24px; color: var(--primary);"></i>
                    <div class="file-details" style="flex: 1;">
                        <strong id="file-name" style="display: block; margin-bottom: 4px;">arquivo.json</strong>
                        <span id="file-size" style="font-size: 13px; color: var(--gray-500);">0 KB</span>
                    </div>
                    <button class="file-remove" onclick="removerArquivo()" style="background: transparent; border: none; color: var(--danger); cursor: pointer; padding: 8px; border-radius: 6px; transition: all 0.2s;">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>
                <button id="btn-tratar-arquivo-upload" class="btn-primary" style="margin-top: 16px; display: none; width: 100%;">
                    <i class="fa-solid fa-wand-magic-sparkles"></i>
                    Tratar Arquivo e Visualizar
                </button>
            </div>
        </div>

        <!-- Erro de validação -->
        <div id="json-import-error" class="import-error" style="display: none; margin-top: 20px; padding: 16px; background: #fee; border-left: 4px solid var(--danger); border-radius: 8px; align-items: center; gap: 12px;">
            <i class="fa-solid fa-circle-xmark" style="color: var(--danger); font-size: 20px;"></i>
            <span id="json-import-error-text" style="color: #b91c1c; font-weight: 500;"></span>
        </div>

        <!-- Área de previews -->
        <div id="import-previews-area" class="import-previews-area" style="display: none; margin-top: 24px;">
            <div class="previews-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid var(--gray-200);">
                <div>
                    <h3 style="margin: 0 0 8px 0;"><i class="fa-solid fa-eye"></i> Pré-visualização dos Cartazes</h3>
                    <p id="previews-count" style="margin: 0; color: var(--gray-600);">0 cartaz(es) encontrado(s)</p>
                </div>
                <button id="btn-confirmar-importacao" class="btn-primary">
                    <i class="fa-solid fa-file-import"></i>
                    Confirmar e Importar Tudo
                </button>
            </div>
            <div id="import-previews-list" class="import-previews-list">
                <!-- Previews serão inseridos aqui -->
            </div>
        </div>
    `;

    conectarEventosImportacao();
}

function conectarEventosImportacao() {
    // Navegação entre abas principais
    const importTabs = document.querySelectorAll('.import-tab');
    importTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.importTab;
            
            importTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.import-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const targetContent = document.getElementById(`import-content-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });

    // Navegação entre sub-abas (Cloud/Upload)
    const subTabs = document.querySelectorAll('.sub-import-tab');
    subTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetSubTab = tab.dataset.subTab;
            
            subTabs.forEach(t => {
                if (t === tab) {
                    t.style.background = 'var(--primary)';
                    t.style.color = 'white';
                    t.style.border = 'none';
                } else {
                    t.style.background = 'white';
                    t.style.color = 'var(--gray-700)';
                    t.style.border = '1px solid var(--gray-300)';
                }
            });
            
            document.querySelectorAll('.import-subcontent').forEach(c => {
                c.style.display = 'none';
            });
            const targetContent = document.getElementById(`import-subcontent-${targetSubTab}`);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });

    // Botão Validar JSON Colado
    document.getElementById('btn-validar-json-colado')?.addEventListener('click', validarJSONColado);

    // Botão Importar de URL
    document.getElementById('btn-importar-url')?.addEventListener('click', importarDeURL);

    // Upload de arquivo
    const fileInput = document.getElementById('json-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileUpload);
    }

    // Botão Tratar Arquivo
    document.getElementById('btn-tratar-arquivo-upload')?.addEventListener('click', tratarArquivoUpload);
}

function validarJSONColado() {
    const textarea = document.getElementById('json-text-input');
    const errorDiv = document.getElementById('json-import-error');
    const errorText = document.getElementById('json-import-error-text');
    
    if (!textarea) return;
    
    const jsonText = textarea.value.trim();
    
    if (!jsonText) {
        mostrarErroImportacao('Por favor, cole o JSON no campo de texto', errorDiv, errorText);
        return;
    }
    
    try {
        const dados = JSON.parse(jsonText);
        
        if (!dados.cartazes || !Array.isArray(dados.cartazes)) {
            throw new Error('JSON inválido: propriedade "cartazes" não encontrada ou não é um array');
        }
        
        if (dados.cartazes.length === 0) {
            throw new Error('JSON não contém cartazes para importar');
        }
        
        esconderErroImportacao(errorDiv);
        showToast('success', 'JSON válido!', `${dados.cartazes.length} cartaz(es) encontrado(s)`);
        
        mostrarPreviews(dados.cartazes);
        
    } catch (error) {
        mostrarErroImportacao(`Erro ao processar JSON: ${error.message}`, errorDiv, errorText);
    }
}

async function importarDeURL() {
    const urlInput = document.getElementById('json-url-input');
    const errorDiv = document.getElementById('json-import-error');
    const errorText = document.getElementById('json-import-error-text');
    
    if (!urlInput) return;
    
    const url = urlInput.value.trim();
    
    if (!url) {
        mostrarErroImportacao('Por favor, insira uma URL válida', errorDiv, errorText);
        return;
    }
    
    try {
        new URL(url);
    } catch (e) {
        mostrarErroImportacao('URL inválida. Por favor, verifique e tente novamente', errorDiv, errorText);
        return;
    }
    
    esconderErroImportacao(errorDiv);
    
    if (typeof mostrarOverlay === 'function') {
        mostrarOverlay();
        if (typeof atualizarOverlayTexto === 'function') {
            atualizarOverlayTexto('📡 Importando JSON da URL...');
        }
    }
    
    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Erro HTTP: ${response.status}`);
        }
        
        const jsonText = await response.text();
        const dados = JSON.parse(jsonText);
        
        if (typeof esconderOverlay === 'function') {
            esconderOverlay();
        }
        
        if (!dados.cartazes || !Array.isArray(dados.cartazes)) {
            throw new Error('JSON inválido: propriedade "cartazes" não encontrada');
        }
        
        showToast('success', 'Importado!', `${dados.cartazes.length} cartaz(es) encontrado(s)`);
        
        mostrarPreviews(dados.cartazes);
        
    } catch (error) {
        if (typeof esconderOverlay === 'function') {
            esconderOverlay();
        }
        mostrarErroImportacao(`Erro ao importar da URL: ${error.message}`, errorDiv, errorText);
    }
}

function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const uploadArea = document.getElementById('upload-area');
    const fileInfo = document.getElementById('file-info');
    const fileName = document.getElementById('file-name');
    const fileSize = document.getElementById('file-size');
    const btnTratar = document.getElementById('btn-tratar-arquivo-upload');
    
    if (uploadArea) uploadArea.style.display = 'none';
    if (fileInfo) fileInfo.style.display = 'flex';
    if (fileName) fileName.textContent = file.name;
    if (fileSize) fileSize.textContent = `${(file.size / 1024).toFixed(2)} KB`;
    if (btnTratar) btnTratar.style.display = 'block';
    
    window.uploadedFile = file;
    
    showToast('success', 'Arquivo carregado', 'Clique em "Tratar Arquivo" para processar');
}

function tratarArquivoUpload() {
    if (!window.uploadedFile) return;
    
    const errorDiv = document.getElementById('json-import-error');
    const errorText = document.getElementById('json-import-error-text');
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const jsonText = e.target.result;
        
        try {
            const dados = JSON.parse(jsonText);
            
            if (!dados.cartazes || !Array.isArray(dados.cartazes)) {
                throw new Error('JSON inválido: propriedade "cartazes" não encontrada');
            }
            
            esconderErroImportacao(errorDiv);
            showToast('success', 'Arquivo processado!', `${dados.cartazes.length} cartaz(es) encontrado(s)`);
            
            mostrarPreviews(dados.cartazes);
            
        } catch (error) {
            mostrarErroImportacao(`Erro ao processar arquivo: ${error.message}`, errorDiv, errorText);
        }
    };
    reader.readAsText(window.uploadedFile);
}

window.removerArquivo = function() {
    const uploadArea = document.getElementById('upload-area');
    const fileInfo = document.getElementById('file-info');
    const fileInput = document.getElementById('json-file-input');
    const btnTratar = document.getElementById('btn-tratar-arquivo-upload');
    
    if (uploadArea) uploadArea.style.display = 'block';
    if (fileInfo) fileInfo.style.display = 'none';
    if (fileInput) fileInput.value = '';
    if (btnTratar) btnTratar.style.display = 'none';
    
    window.uploadedFile = null;
};

function mostrarPreviews(cartazes) {
    const previewsArea = document.getElementById('import-previews-area');
    const previewsList = document.getElementById('import-previews-list');
    const previewsCount = document.getElementById('previews-count');
    
    if (!previewsArea || !previewsList || !previewsCount) return;
    
    previewsCount.textContent = `${cartazes.length} cartaz(es) encontrado(s)`;
    
    previewsList.innerHTML = cartazes.map((item, index) => `
        <div class="preview-card" style="background: white; border: 1px solid var(--gray-200); border-radius: 8px; padding: 20px; margin-bottom: 16px;">
            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                <div>
                    <h4 style="margin: 0 0 4px 0; color: var(--gray-900);">${item.descricao}</h4>
                    <p style="margin: 0; font-size: 13px; color: var(--gray-500);">Código: ${item.codigo}</p>
                </div>
                <span style="padding: 4px 12px; background: var(--gray-100); border-radius: 6px; font-size: 13px; font-weight: 500; color: var(--gray-700);">#${index + 1}</span>
            </div>
            ${item.subdescricao ? `<p style="margin: 0 0 12px 0; font-style: italic; color: var(--gray-600);">${item.subdescricao}</p>` : ''}
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px;">
                <div>
                    <span style="font-size: 12px; color: var(--gray-500); display: block; margin-bottom: 4px;">Parcelamento</span>
                    <strong style="color: var(--gray-900);">${item.metodo}</strong>
                </div>
                <div>
                    <span style="font-size: 12px; color: var(--gray-500); display: block; margin-bottom: 4px;">À vista</span>
                    <strong style="color: var(--gray-900);">R$ ${item.avista.toFixed(2).replace('.', ',')}</strong>
                </div>
                <div>
                    <span style="font-size: 12px; color: var(--gray-500); display: block; margin-bottom: 4px;">Taxa</span>
                    <strong style="color: var(--gray-900);">${item.juros === 'carne' ? 'Carnê' : item.juros === 'cartao' ? 'Cartão' : 'Virado'}</strong>
                </div>
            </div>
        </div>
    `).join('');
    
    previewsArea.style.display = 'block';
    
    setTimeout(() => {
        previewsArea.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    const btnConfirmar = document.getElementById('btn-confirmar-importacao');
    if (btnConfirmar) {
        btnConfirmar.onclick = () => confirmarImportacao(cartazes);
    }
}

function confirmarImportacao(cartazes) {
    cartazes.forEach(item => {
        if (typeof products !== 'undefined') {
            products.push(item);
        }
    });
    
    if (typeof saveProducts === 'function') {
        saveProducts();
    }
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
    
    showToast('success', 'Importado!', `${cartazes.length} cartaz(es) adicionados com sucesso`);
    
    const btnProdutos = document.querySelector('[data-view="produtos"]');
    if (btnProdutos) {
        btnProdutos.click();
    }
}

function mostrarErroImportacao(mensagem, errorDiv, errorText) {
    if (errorDiv) errorDiv.style.display = 'flex';
    if (errorText) errorText.textContent = mensagem;
}

function esconderErroImportacao(errorDiv) {
    if (errorDiv) errorDiv.style.display = 'none';
}

// ==================================================
// SEÇÃO 5: MENU DROPDOWN DO DEBUG
// ==================================================
function toggleDebugMenu(event) {
    event.stopPropagation();
    const menu = document.getElementById('debug-menu');
    const btnRect = event.currentTarget.getBoundingClientRect();
    
    if (debugMenuAberto) {
        menu.style.display = 'none';
        debugMenuAberto = false;
    } else {
        menu.style.display = 'block';
        menu.style.top = `${btnRect.bottom + 5}px`;
        menu.style.left = `${btnRect.left}px`;
        debugMenuAberto = true;
    }
}

function testarCartaz() {
    const menu = document.getElementById('debug-menu');
    menu.style.display = 'none';
    debugMenuAberto = false;
    
    gerarCartazesDebug();
}

function testarFimSessao() {
    const menu = document.getElementById('debug-menu');
    menu.style.display = 'none';
    debugMenuAberto = false;
    
    showToastComContador();
}

function showToastComContador() {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast error';
    
    let segundosRestantes = 5;
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid fa-clock-rotate-left"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">Encerrando sessão</div>
            <div class="toast-message">Apagando cartazes criados em <strong id="contador-sessao">${segundosRestantes}</strong> segundos...</div>
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    const intervalo = setInterval(() => {
        segundosRestantes--;
        const contadorEl = document.getElementById('contador-sessao');
        if (contadorEl) {
            contadorEl.textContent = segundosRestantes;
        }
        
        if (segundosRestantes <= 0) {
            clearInterval(intervalo);
            limparSessao();
            toast.remove();
        }
    }, 1000);
    
    setTimeout(() => {
        if (toast.parentElement) {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 200);
        }
    }, 5000);
}

// ==================================================
// SEÇÃO 6: EVENTOS E INICIALIZAÇÃO
// ==================================================

// Adicionar views de JSON ao sistema de navegação
if (typeof views !== 'undefined') {
    views['importar-json'] = document.getElementById('view-importar-json');
    views['ver-json'] = document.getElementById('view-ver-json');
}

// Função helper para esconder TODAS as views
function esconderTodasViews() {
    document.querySelectorAll('.view').forEach(view => {
        view.classList.remove('active');
    });
}

// Função helper para desativar todos os botões de navegação
function desativarTodosNavButtons() {
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.classList.remove('active');
    });
}

// Fechar menu debug ao clicar fora
document.addEventListener('click', (e) => {
    const menu = document.getElementById('debug-menu');
    const btnDebug = document.getElementById('btn-debug');
    
    if (debugMenuAberto && !menu.contains(e.target) && e.target !== btnDebug) {
        menu.style.display = 'none';
        debugMenuAberto = false;
    }
});

// Toggle seção Suporte
document.getElementById('toggle-suporte')?.addEventListener('click', function() {
    const content = document.getElementById('suporte-content');
    this.classList.toggle('active');
    content.classList.toggle('active');
});

// Botão Debug - abre menu dropdown
document.getElementById('btn-debug')?.addEventListener('click', toggleDebugMenu);

// Botão Limpar Todos
document.getElementById('btn-limpar-todos')?.addEventListener('click', () => {
    if (!products || products.length === 0) {
        showToast('info', 'Nenhum produto', 'Não há produtos para limpar');
        return;
    }
    
    produtosBackup = JSON.parse(JSON.stringify(products));
    
    const confirmOverlay = document.getElementById('confirm-overlay');
    const confirmTitle = document.getElementById('confirm-title');
    const confirmMessage = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (!confirmOverlay) {
        if (confirm(`Deseja limpar ${products.length} cartaz(es)? Você poderá recuperá-los em seguida.`)) {
            executarLimpezaCompleta();
        }
        return;
    }
    
    confirmTitle.textContent = 'Limpar todos os cartazes?';
    confirmMessage.innerHTML = `
        Você está prestes a remover <strong>${products.length} cartaz(es)</strong> adicionados.<br>
        Você poderá recuperá-los logo após a exclusão.
    `;
    confirmBtn.innerHTML = '<i class="fa-solid fa-trash"></i> Sim, limpar todos';
    cancelBtn.innerHTML = '<i class="fa-solid fa-times"></i> Cancelar';
    
    confirmOverlay.classList.add('active');
    
    confirmBtn.onclick = () => {
        executarLimpezaCompleta();
        confirmOverlay.classList.remove('active');
    };
    
    cancelBtn.onclick = () => {
        confirmOverlay.classList.remove('active');
    };
});

// Botão Ver JSON - navegação para view completa
document.getElementById('btn-ver-json')?.addEventListener('click', () => {
    esconderTodasViews();
    desativarTodosNavButtons();
    
    const viewVerJSON = document.getElementById('view-ver-json');
    if (viewVerJSON) {
        viewVerJSON.classList.add('active');
    }
    
    document.getElementById('btn-ver-json')?.classList.add('active');
    
    const headerSubtitle = document.getElementById('header-subtitle');
    if (headerSubtitle) {
        headerSubtitle.textContent = 'JSON dos Cartazes Salvos';
    }
    
    carregarViewVerJSON();
});

// Navegação entre abas (Visualizar/Editar) na View Ver JSON
document.querySelectorAll('.json-view-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        document.querySelectorAll('.json-view-tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.json-view-content').forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        const targetContent = document.getElementById(`json-view-${targetTab}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
        
        if (targetTab === 'editar') {
            const jsonCode = document.getElementById('json-viewer-code');
            const jsonEditor = document.getElementById('json-editor-textarea');
            if (jsonCode && jsonEditor) {
                jsonEditor.value = jsonCode.textContent;
            }
        }
    });
});

// Botões da View Visualizar
document.getElementById('btn-copiar-json-viewer')?.addEventListener('click', () => {
    const jsonCode = document.getElementById('json-viewer-code');
    if (!jsonCode) return;
    
    const jsonText = jsonCode.textContent;
    
    navigator.clipboard.writeText(jsonText).then(() => {
        showToast('success', 'JSON copiado!', 'O JSON foi copiado para a área de transferência');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        showToast('error', 'Erro ao copiar', 'Não foi possível copiar o JSON');
    });
});

document.getElementById('btn-download-json-viewer')?.addEventListener('click', () => {
    const jsonCode = document.getElementById('json-viewer-code');
    if (!jsonCode) return;
    
    const jsonText = jsonCode.textContent;
    
    try {
        const blob = new Blob([jsonText], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cartazes_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('success', 'JSON baixado!', 'Arquivo salvo com sucesso');
    } catch (error) {
        console.error('Erro ao baixar:', error);
        showToast('error', 'Erro ao baixar', 'Não foi possível baixar o JSON');
    }
});

// Botões da View Editar
document.getElementById('btn-validar-json-editado')?.addEventListener('click', () => {
    const jsonEditor = document.getElementById('json-editor-textarea');
    const errorDiv = document.getElementById('json-edit-error');
    const errorText = document.getElementById('json-edit-error-text');
    const btnAplicar = document.getElementById('btn-aplicar-json-editado');
    
    if (!jsonEditor) return;
    
    const jsonText = jsonEditor.value.trim();
    
    if (!jsonText) {
        mostrarErroEdicao('O campo de edição está vazio', errorDiv, errorText);
        jsonValidado = false;
        if (btnAplicar) btnAplicar.style.display = 'none';
        return;
    }
    
    try {
        const dados = JSON.parse(jsonText);
        
        if (!dados.cartazes || !Array.isArray(dados.cartazes)) {
            throw new Error('JSON inválido: propriedade "cartazes" não encontrada ou não é um array');
        }
        
        if (dados.cartazes.length === 0) {
            throw new Error('O JSON não contém nenhum cartaz');
        }
        
        dados.cartazes.forEach((item, index) => {
            if (!item.codigo) throw new Error(`Cartaz ${index + 1}: propriedade "codigo" ausente`);
            if (!item.descricao) throw new Error(`Cartaz ${index + 1}: propriedade "descricao" ausente`);
            if (!item.metodo) throw new Error(`Cartaz ${index + 1}: propriedade "metodo" ausente`);
            if (item.avista === undefined) throw new Error(`Cartaz ${index + 1}: propriedade "avista" ausente`);
        });
        
        esconderErroEdicao(errorDiv);
        jsonValidado = true;
        if (btnAplicar) btnAplicar.style.display = 'inline-flex';
        
        showToast('success', 'JSON válido!', `${dados.cartazes.length} cartaz(es) encontrado(s) - pode aplicar as alterações`);
        
    } catch (error) {
        mostrarErroEdicao(`Erro no JSON: ${error.message}`, errorDiv, errorText);
        jsonValidado = false;
        if (btnAplicar) btnAplicar.style.display = 'none';
    }
});

document.getElementById('btn-aplicar-json-editado')?.addEventListener('click', () => {
    if (!jsonValidado) {
        showToast('warning', 'Valide primeiro', 'Você precisa validar o JSON antes de aplicar as alterações');
        return;
    }
    
    const jsonEditor = document.getElementById('json-editor-textarea');
    if (!jsonEditor) return;
    
    try {
        const dados = JSON.parse(jsonEditor.value);
        
        products = dados.cartazes.map(item => ({
            codigo: item.codigo,
            descricao: item.descricao,
            subdescricao: item.subdescricao || '',
            features: item.features || [],
            metodo: item.metodo,
            avista: item.avista,
            juros: item.juros,
            parcela: item.parcela || 0,
            motivo: item.motivo || '',
            validade: item.validade || '',
            autorizacao: item.autorizacao || '',
            garantia12: item.garantia12 || 0,
            garantia24: item.garantia24 || 0,
            garantia36: item.garantia36 || 0
        }));
        
        if (typeof saveProducts === 'function') {
            saveProducts();
        }
        if (typeof renderProducts === 'function') {
            renderProducts();
        }
        
        showToast('success', 'Alterações aplicadas!', `${products.length} cartaz(es) atualizados com sucesso`);
        
        document.getElementById('tab-visualizar')?.click();
        
        setTimeout(() => {
            carregarViewVerJSON();
        }, 100);
        
    } catch (error) {
        showToast('error', 'Erro ao aplicar', error.message);
    }
});

document.getElementById('btn-cancelar-edicao')?.addEventListener('click', () => {
    document.getElementById('tab-visualizar')?.click();
    
    const errorDiv = document.getElementById('json-edit-error');
    esconderErroEdicao(errorDiv);
    
    jsonValidado = false;
    const btnAplicar = document.getElementById('btn-aplicar-json-editado');
    if (btnAplicar) btnAplicar.style.display = 'none';
});

// Botão Gerar JSON
document.getElementById('btn-gerar-json')?.addEventListener('click', () => {
    if (!isAdminOuSuporte()) {
        showToast('error', 'Acesso negado', 'Você não tem permissão para acessar esta funcionalidade.');
        return;
    }
    gerarJSONCartazes();
});

// ==================================================
// SEÇÃO 7: SISTEMA DE AUTENTICAÇÃO E PERMISSÕES
// ==================================================

// Função para obter authSession do localStorage
function getAuthSession() {
    try {
        const sessionStr = localStorage.getItem('authSession');
        if (!sessionStr) return null;
        return JSON.parse(sessionStr);
    } catch (error) {
        console.error('Erro ao ler authSession:', error);
        return null;
    }
}

// Função para verificar se tem permissão de admin ou suporte
function verificarPermissaoSuporte() {
    const session = getAuthSession();
    if (!session || !session.perm) return false;
    return session.perm === 'admin' || session.perm === 'suporte';
}

// Controlar visibilidade da seção Suporte
function controlarVisibilidadeSuporte() {
    const suporteSection = document.getElementById('suporte-section');
    if (!suporteSection) return;
    
    if (verificarPermissaoSuporte()) {
        suporteSection.style.display = 'block';
        console.log('✅ Usuário tem permissão de suporte/admin');
    } else {
        suporteSection.style.display = 'none';
        console.log('ℹ️ Usuário sem permissão de suporte');
    }
}

// ==================================================
// SEÇÃO 8: CLOUD IMPORT (BUSCA NO GOOGLE DRIVE)
// ==================================================

const CLOUD_WORKER_ENDPOINT = 'https://json-cartazes.gab-oliveirab27.workers.dev/json';

let cloudJsonData = null; // Armazena o JSON carregado da cloud

// Alternar entre método automático e manual
const cloudMethodBtns = document.querySelectorAll('.cloud-method-btn');
cloudMethodBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const method = btn.dataset.method;
        
        // Atualizar botões ativos
        cloudMethodBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        // Mostrar/esconder formulários
        const autoInfo = document.getElementById('cloud-auto-info');
        const manualForm = document.getElementById('cloud-manual-form');
        
        if (method === 'auto') {
            autoInfo.style.display = 'block';
            manualForm.style.display = 'none';
        } else {
            autoInfo.style.display = 'none';
            manualForm.style.display = 'block';
        }
        
        // Esconder estados
        esconderEstadosCloud();
    });
});

// Atualizar informações do usuário logado
function atualizarInfoUsuarioCloud() {
    const session = getAuthSession();
    const userSpan = document.getElementById('cloud-current-user');
    const filialSpan = document.getElementById('cloud-current-filial');
    
    if (session && session.user && session.filial) {
        userSpan.textContent = session.user;
        filialSpan.textContent = session.filial;
    } else {
        userSpan.textContent = 'Não identificado';
        filialSpan.textContent = 'Não identificado';
    }
}

// Esconder todos os estados da cloud
function esconderEstadosCloud() {
    document.getElementById('cloud-loading').style.display = 'none';
    document.getElementById('cloud-success').style.display = 'none';
    document.getElementById('cloud-error').style.display = 'none';
}

// Mostrar estado de loading
function mostrarLoadingCloud() {
    esconderEstadosCloud();
    document.getElementById('cloud-auto-info').style.display = 'none';
    document.getElementById('cloud-manual-form').style.display = 'none';
    document.getElementById('cloud-loading').style.display = 'block';
}

// Mostrar estado de sucesso
function mostrarSucessoCloud(fileName, fileDate, cartazesCount) {
    esconderEstadosCloud();
    const successDiv = document.getElementById('cloud-success');
    document.getElementById('cloud-success-message').textContent = `${cartazesCount} cartaz(es) encontrado(s) no arquivo`;
    document.getElementById('cloud-file-name').textContent = fileName;
    document.getElementById('cloud-file-date').textContent = `Data: ${fileDate}`;
    successDiv.style.display = 'block';
}

// Mostrar estado de erro
function mostrarErroCloud(mensagem) {
    esconderEstadosCloud();
    document.getElementById('cloud-error-message').textContent = mensagem;
    document.getElementById('cloud-error').style.display = 'block';
}

// Função principal de busca na Cloud
async function buscarJSONNaCloud(user, filial) {
    if (!user || !filial) {
        showToast('error', 'Campos obrigatórios', 'Informe o usuário e a filial');
        return;
    }

    mostrarLoadingCloud();

    try {
        const url = `${CLOUD_WORKER_ENDPOINT}?user=${encodeURIComponent(user)}&filial=${encodeURIComponent(filial)}`;
        console.log('[Cloud] Fetching URL:', url);

        const response = await fetch(url);
        // debug rápido
        console.log('[Cloud] resposta HTTP:', response.status, response.statusText);

        if (!response.ok) {
            // tenta extrair mensagem de erro retornada pela GAS
            let errorMsg = 'Erro ao buscar JSON na cloud';
            try {
                const errObj = await response.json();
                errorMsg = errObj.error || JSON.stringify(errObj);
            } catch (e) {
                // fallback
                errorMsg = `${response.status} ${response.statusText}`;
            }
            throw new Error(errorMsg);
        }

        const dataRaw = await response.json();
        console.log('[Cloud] body recebido:', dataRaw);

        // === Normalizar formatos possíveis ===
        // Possível formatos:
        // 1) { cartazes: [...] }                <-- front antigo esperava isso
        // 2) { file: 'name.json', data: { cartazes: [...] } } <-- GAS atual
        // 3) { file: 'name.json', data: {...}, ... } (se quiser outros campos)
        let payload = null;
        let fileName = null;
        let fileDate = null;

        if (dataRaw == null) {
            throw new Error('Resposta vazia da cloud');
        }

        if (Array.isArray(dataRaw.cartazes) || (dataRaw.cartazes && typeof dataRaw.cartazes.length === 'number')) {
            // formato 1
            payload = dataRaw;
            fileName = dataRaw.file || `${user}-${filial}.json`;
        } else if (dataRaw.data && Array.isArray(dataRaw.data.cartazes)) {
            // formato 2 (GAS)
            payload = dataRaw.data;
            fileName = dataRaw.file || `${user}-${filial}.json`;
            // tenta extrair dataGeracao se existir
            if (dataRaw.data.dataGeracao) {
                fileDate = new Date(dataRaw.data.dataGeracao).toLocaleString('pt-BR');
            }
        } else if (dataRaw.data && dataRaw.data.cartazes === undefined && Array.isArray(dataRaw.cartazes)) {
            // caso estranho: top-level cartazes mas também data presente — fallback
            payload = { cartazes: dataRaw.cartazes };
            fileName = dataRaw.file || `${user}-${filial}.json`;
        } else {
            // nada compatível
            console.warn('[Cloud] Formato de resposta inesperado:', dataRaw);
            throw new Error('Formato de resposta inesperado da cloud');
        }

        if (!payload || !payload.cartazes || payload.cartazes.length === 0) {
            mostrarErroCloud('Nenhum JSON encontrado para este usuário e filial.');
            showToast('warning', 'Nenhum arquivo encontrado', 'Não há JSON salvo para este usuário/filial');
            return;
        }

        // Armazenar JSON carregado
        cloudJsonData = payload;

        // Informações pro UI
        const cartazesCount = payload.cartazes.length;
        const fileDisplayName = fileName || `${user}-${filial}.json`;
        const fileDisplayDate = fileDate || (payload.dataGeracao ? new Date(payload.dataGeracao).toLocaleString('pt-BR') : 'Data não disponível');

        mostrarSucessoCloud(fileDisplayName, fileDisplayDate, cartazesCount);
        showToast('success', 'JSON carregado!', `${cartazesCount} cartaz(es) encontrado(s)`);

        // Auto-importar os cartazes
        importarCartazesDaCloud(payload);

    } catch (error) {
        console.error('Erro ao buscar JSON:', error);
        mostrarErroCloud(error.message || 'Erro ao buscar JSON na cloud. Tente novamente.');
        showToast('error', 'Erro na busca', error.message || 'Não foi possível buscar o JSON');
    }
}

// Importar cartazes do JSON da Cloud
function importarCartazesDaCloud(jsonData) {
    if (!jsonData || !jsonData.cartazes || jsonData.cartazes.length === 0) {
        showToast('error', 'JSON inválido', 'O arquivo não contém cartazes válidos');
        return;
    }
    
    // Limpar produtos existentes
    if (typeof products !== 'undefined') {
        products.length = 0;
    }
    
    // Adicionar cada cartaz
    jsonData.cartazes.forEach(cartaz => {
        const produto = {
            codigo: cartaz.codigo || '',
            descricao: cartaz.descricao || '',
            subdescricao: cartaz.subdescricao || '',
            features: cartaz.features || [],
            metodo: cartaz.metodo || '12x',
            avista: parseFloat(cartaz.avista) || 0,
            juros: cartaz.juros || 'carne',
            parcela: parseFloat(cartaz.parcela) || 0,
            garantia12: parseFloat(cartaz.garantia12) || 0,
            garantia24: parseFloat(cartaz.garantia24) || 0,
            garantia36: parseFloat(cartaz.garantia36) || 0,
            motivo: cartaz.motivo || '',
            validade: cartaz.validade || '',
            autorizacao: cartaz.autorizacao || ''
        };
        
        if (typeof products !== 'undefined') {
            products.push(produto);
        }
    });
    
    // Atualizar interface
    if (typeof renderProducts === 'function') {
        renderProducts();
    }
    
    // Ir para aba de produtos
    const navProdutos = document.querySelector('[data-view="produtos"]');
    if (navProdutos) {
        navProdutos.click();
    }
    
    showToast('success', 'Importação concluída!', `${jsonData.cartazes.length} cartaz(es) importado(s) com sucesso`);
}

// Botão buscar com usuário logado
document.getElementById('btn-buscar-cloud-auto')?.addEventListener('click', () => {
    const session = getAuthSession();
    if (!session || !session.user || !session.filial) {
        showToast('error', 'Sessão inválida', 'Usuário não identificado. Use o modo manual.');
        return;
    }
    buscarJSONNaCloud(session.user, session.filial);
});

// Botão buscar manual
document.getElementById('btn-buscar-cloud-manual')?.addEventListener('click', () => {
    const user = document.getElementById('cloud-user-input').value.trim();
    const filial = document.getElementById('cloud-filial-input').value.trim();
    
    if (!user || !filial) {
        showToast('error', 'Campos obrigatórios', 'Preencha o usuário e a filial');
        return;
    }
    
    buscarJSONNaCloud(user, filial);
});

// Botão tentar novamente
document.getElementById('btn-retry-cloud')?.addEventListener('click', () => {
    esconderEstadosCloud();
    
    // Voltar para o formulário ativo
    const activeMethod = document.querySelector('.cloud-method-btn.active')?.dataset.method || 'auto';
    if (activeMethod === 'auto') {
        document.getElementById('cloud-auto-info').style.display = 'block';
    } else {
        document.getElementById('cloud-manual-form').style.display = 'block';
    }
});

// ==================================================
// SEÇÃO 9: SUB-ABAS DE IMPORTAÇÃO (Drive / Local)
// ==================================================

// Função para conectar eventos no HTML estático (sem recriar)
function conectarEventosImportacaoEstatica() {
    console.log('🔌 Conectando eventos de importação...');
    
    // Navegação entre abas principais (Colar JSON / Upload de Arquivo)
    const importTabs = document.querySelectorAll('.import-tab');
    importTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const targetTab = tab.dataset.importTab;
            
            importTabs.forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.import-content').forEach(c => c.classList.remove('active'));
            
            tab.classList.add('active');
            const targetContent = document.getElementById(`import-content-${targetTab}`);
            if (targetContent) {
                targetContent.classList.add('active');
            }
        });
    });
    
    // Botão "Tratar Arquivo e Visualizar Previews" (para colar JSON)
    const btnTratarJson = document.getElementById('btn-tratar-json');
    if (btnTratarJson) {
        btnTratarJson.addEventListener('click', () => {
            const textarea = document.getElementById('json-text-input');
            if (!textarea) return;
            
            const jsonText = textarea.value.trim();
            
            if (!jsonText) {
                showToast('error', 'Campo vazio', 'Por favor, cole o JSON no campo de texto');
                return;
            }
            
            try {
                const dados = JSON.parse(jsonText);
                
                if (!dados.cartazes || !Array.isArray(dados.cartazes)) {
                    throw new Error('JSON inválido: propriedade "cartazes" não encontrada ou não é um array');
                }
                
                if (dados.cartazes.length === 0) {
                    throw new Error('JSON não contém cartazes para importar');
                }
                
                showToast('success', 'JSON válido!', `${dados.cartazes.length} cartaz(es) encontrado(s)`);
                mostrarPreviews(dados.cartazes);
                
            } catch (error) {
                showToast('error', 'JSON inválido', error.message);
            }
        });
    }
    
    // Upload de arquivo local
    const fileInput = document.getElementById('json-file-input');
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const jsonText = event.target.result;
                    const dados = JSON.parse(jsonText);
                    
                    if (!dados.cartazes || !Array.isArray(dados.cartazes)) {
                        throw new Error('JSON inválido: propriedade "cartazes" não encontrada');
                    }
                    
                    showToast('success', 'Arquivo carregado!', `${dados.cartazes.length} cartaz(es) encontrado(s)`);
                    mostrarPreviews(dados.cartazes);
                    
                } catch (error) {
                    showToast('error', 'Erro ao processar arquivo', error.message);
                }
            };
            reader.readAsText(file);
        });
    }
    
    console.log('✅ Eventos de importação conectados');
}

// Controlar sub-abas dentro de "Upload de Arquivo"
const subImportTabs = document.querySelectorAll('.sub-import-tab');
subImportTabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetSubTab = tab.dataset.subImportTab;
        
        // Remover active de todas as sub-abas
        subImportTabs.forEach(t => t.classList.remove('active'));
        
        // Adicionar active na sub-aba clicada
        tab.classList.add('active');
        
        // Esconder todos os sub-conteúdos
        document.querySelectorAll('.sub-import-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Mostrar sub-conteúdo correspondente
        const targetContent = document.getElementById(`sub-import-content-${targetSubTab}`);
        if (targetContent) {
            targetContent.classList.add('active');
        }
    });
});

// ==================================================
// SEÇÃO 10: INICIALIZAÇÃO
// ==================================================
setTimeout(() => {
    // COMENTADO: recriarAbasImportacao() estava sobrescrevendo o HTML estático
    // recriarAbasImportacao();
    
    atualizarBotoesAcao();
    
    // Controlar visibilidade da seção Suporte
    controlarVisibilidadeSuporte();
    
    // Atualizar informações do usuário na aba Cloud
    atualizarInfoUsuarioCloud();
    
    // Conectar eventos de importação manualmente
    conectarEventosImportacaoEstatica();
    
    // Patch: Adicionar listener para navegação manual das views JSON
    const btnImportarNav = document.querySelector('[data-view="importar-json"]');
    if (btnImportarNav) {
        btnImportarNav.addEventListener('click', () => {
            esconderTodasViews();
            desativarTodosNavButtons();
            
            const viewImportar = document.getElementById('view-importar-json');
            if (viewImportar) {
                viewImportar.classList.add('active');
            }
            
            btnImportarNav.classList.add('active');
            
            const headerSubtitle = document.getElementById('header-subtitle');
            if (headerSubtitle) {
                headerSubtitle.textContent = 'Importar cartazes através de arquivo JSON';
            }
        });
    }
    
    console.log('✅ func-json.js carregado com sucesso!');
    console.log('🔐 Sistema de permissões ativo');
    console.log('☁️ Cloud Import configurado');
}, 500);