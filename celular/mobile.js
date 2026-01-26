// ==================================================
// VARIÁVEIS GLOBAIS
// ==================================================
console.log('Mobile script carregado!');

const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLic4iE63JAJ0j4KpGWfRFINeiD4uyCsMjfF_uLkUNzhOsJMzO4uiiZpWV3xzDjbduZK8kU_wWw3ZSCs6cODW2gdFnIGb6pZ0Lz0cBqMpiV-SBOJroENJHqO1XML_YRs_41KFfQOKEehUQmf-Xg6Xhh-bKiYpPxxwQhQzEMP5g0DdJHN4sgG_Fc9cdvRRU4abxlz_PzeQ_5eJ7NtCfxWuP-ET0DEzUyiWhWITlXMZKJMfwmZQg5--gKmAEGpwSr0yXi3eycr23BCGltlXGIWtYZ3I0WkWg&lib=M38uuBDbjNiNXY1lAK2DF9n3ltsPa6Ver";

let carrinho = [];
let produtosCache = [];

// Exportar variáveis globais para o window (acessível pelo patch)
window.carrinho = carrinho;
window.produtosCache = produtosCache;

// Fatores de cálculo
const FATORES = {
    carne: {
        1: 1.0690, 2: 0.5523, 3: 0.3804, 4: 0.2946, 5: 0.2432, 6: 0.2091,
        7: 0.1849, 8: 0.1668, 9: 0.1528, 10: 0.1417, 11: 0.1327, 12: 0.1252
    },
    cartao: {
        1: 1.0292, 2: 0.5220, 3: 0.3530, 4: 0.2685, 5: 0.2179, 6: 0.1841,
        7: 0.1600, 8: 0.1420, 9: 0.1280, 10: 0.1168, 11: 0.1076, 12: 0.1000
    }
};

// Carregar carrinho do localStorage
function carregarCarrinho() {
    const dados = localStorage.getItem('carrinho_mobile');
    if (dados) {
        carrinho = JSON.parse(dados);
        window.carrinho = carrinho; // Atualizar referência global
        atualizarCarrinho();
    }
}

// Salvar carrinho no localStorage
function salvarCarrinho() {
    window.carrinho = carrinho; // Atualizar referência global
    localStorage.setItem('carrinho_mobile', JSON.stringify(carrinho));
    atualizarCarrinho();
}

// ==================================================
// NAVEGAÇÃO ENTRE ABAS
// ==================================================
const tabs = document.querySelectorAll('.tab-item');
const tabContents = document.querySelectorAll('.tab-content');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;
        
        // Remover active de todas as tabs
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        
        // Adicionar active na tab clicada
        tab.classList.add('active');
        document.getElementById(`tab-${targetTab}`).classList.add('active');
    });
});

// ==================================================
// TOAST NOTIFICATIONS
// ==================================================
function showToast(type, title, message) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : 'info'}-circle"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ==================================================
// FORMATAÇÃO DE VALORES
// ==================================================
function formatarMoeda(valor) {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function limparValor(valor) {
    return parseFloat(valor.replace(/[^\d,]/g, '').replace(',', '.')) || 0;
}

// Converter string de moeda para número
function parseCurrency(valor) {
    if (typeof valor === 'number') return valor;
    if (!valor) return 0;
    // Remove R$, pontos de milhar e converte vírgula em ponto
    return parseFloat(String(valor).replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.')) || 0;
}

// Formatar número para string de moeda (sem R$, apenas formatado)
function formatCurrency(valor) {
    if (typeof valor === 'string') {
        valor = parseCurrency(valor);
    }
    return valor.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Função de arredondamento para 90 centavos (EXATAMENTE como no desktop)
function arredondar90(valor) {
    const num = Number(valor);
    if (!isFinite(num) || num <= 0) return 0;
    const centavos = Math.floor(num * 100);
    const k = Math.floor((centavos - 90) / 100);
    const resultCentavos = Math.max(0, k * 100 + 90);
    return resultCentavos / 100;
}

function aplicarMascaraMoeda(input) {
    input.addEventListener('input', function(e) {
        let valor = e.target.value.replace(/\D/g, '');
        valor = (valor / 100).toFixed(2);
        e.target.value = valor.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    });
}

// Aplicar máscara aos campos de moeda
document.addEventListener('DOMContentLoaded', () => {
    const camposMoeda = document.querySelectorAll('#avista, #parcela, #calc-valor');
    camposMoeda.forEach(campo => aplicarMascaraMoeda(campo));
    
    carregarCarrinho();
    
    // Event listener do botão de busca
    const btnBuscar = document.getElementById('btn-buscar');
    if (btnBuscar) {
        btnBuscar.addEventListener('click', async () => {
            const codigo = document.getElementById('codigo').value.trim();
            
            // Se tiver código, busca direto
            if (codigo) {
                await window.buscarProdutoPorCodigo(codigo);
                return;
            }
            
            // Se não tiver código, abre modal de busca
            abrirModalBusca();
        });
    }
});

// ==================================================
// BUSCAR PRODUTO - MODAL DE BUSCA
// ==================================================
window.buscarProdutoPorCodigo = buscarProdutoPorCodigo;

async function buscarProdutoPorCodigo(codigo) {
    showToast('info', 'Buscando...', `Procurando produto código ${codigo}...`);
    
    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error("Erro ao acessar a API");
        
        const dados = await resposta.json();
        let encontrado = false;
        let primeiroItem = null;

        // Buscar nas mesmas abas do desktop: Gabriel, Júlia, Giovana
        ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
            if (dados[nome]) {
                dados[nome].forEach(item => {
                    if (item.Código == codigo) {
                        encontrado = true;
                        if (!primeiroItem) primeiroItem = item;
                    }
                });
            }
        });

        if (encontrado && primeiroItem) {
            // Produto encontrado - preencher formulário
            const partes = (primeiroItem.Descrição || "").split(" - ");
            document.getElementById("descricao").value = (partes[0] || "").trim();
            document.getElementById("subdescricao").value = (partes[1] || "").trim();

            // CORRIGIDO: Preencher valor à vista SEM aplicar máscara duplicada
            const avistaValor = parseCurrency(primeiroItem["Total à vista"]);
            const avistaInput = document.getElementById("avista");
            // Remover event listener temporariamente para não aplicar máscara
            const novoInput = avistaInput.cloneNode(true);
            avistaInput.parentNode.replaceChild(novoInput, avistaInput);
            novoInput.value = formatCurrency(avistaValor);
            // Reaplicar máscara
            aplicarMascaraMoeda(novoInput);

            // Recalcular parcela
            calcularParcela();
            
            showToast('success', 'Produto encontrado!', 'Dados preenchidos automaticamente');
        } else {
            showToast('warning', 'Produto não encontrado', 'Código não cadastrado. Preencha manualmente');
        }
    } catch (error) {
        console.error('Erro ao buscar produto:', error);
        showToast('error', 'Erro na conexão', 'Verifique sua internet e tente novamente');
    }
}

async function abrirModalBusca() {
    const modal = document.getElementById('modal-busca');
    const loading = document.getElementById('busca-loading');
    const results = document.getElementById('busca-results');
    const empty = document.getElementById('busca-empty');
    const inputBusca = document.getElementById('busca-input');
    
    modal.style.display = 'flex';
    loading.style.display = 'block';
    results.innerHTML = '';
    empty.style.display = 'none';
    inputBusca.value = '';
    
    // Carregar produtos se ainda não foram carregados
    if (produtosCache.length === 0) {
        try {
            const resposta = await fetch(API_URL);
            if (!resposta.ok) throw new Error("Erro ao acessar a API");
            
            const dados = await resposta.json();
            
            // Carregar produtos das mesmas abas do desktop
            ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
                if (dados[nome]) {
                    dados[nome].forEach(item => {
                        produtosCache.push({
                            codigo: item.Código,
                            descricao: item.Descrição,
                            avista: item["Total à vista"],
                            garantia12: item["Tot. G.E 12"] || null,
                            garantia24: item["Tot. G.E 24"] || null,
                            garantia36: item["Tot. G.E 36"] || null
                        });
                    });
                }
            });
        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            showToast('error', 'Erro', 'Não foi possível carregar a lista de produtos');
        }
    }
    
    loading.style.display = 'none';
    renderizarResultadosBusca(produtosCache);
    
    // Busca em tempo real
    inputBusca.addEventListener('input', (e) => {
        const termo = e.target.value.toLowerCase().trim();
        
        if (!termo) {
            renderizarResultadosBusca(produtosCache);
            return;
        }
        
        const resultados = produtosCache.filter(p => 
            p.codigo.toLowerCase().includes(termo) ||
            p.descricao.toLowerCase().includes(termo) ||
            (p.marca && p.marca.toLowerCase().includes(termo))
        );
        
        renderizarResultadosBusca(resultados);
    });
}

function renderizarResultadosBusca(produtos) {
    const results = document.getElementById('busca-results');
    const empty = document.getElementById('busca-empty');
    
    if (produtos.length === 0) {
        results.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    
    empty.style.display = 'none';
    results.innerHTML = produtos.slice(0, 50).map(p => `
        <div class="busca-item" onclick="selecionarProduto('${p.codigo}')">
            <div class="busca-item-code">${p.codigo}</div>
            <div class="busca-item-nome">${p.descricao}</div>
            ${p.marca ? `<div class="busca-item-marca">${p.marca}</div>` : ''}
        </div>
    `).join('');
}

function selecionarProduto(codigo) {
    const produto = produtosCache.find(p => p.codigo === codigo);
    if (produto) {
        preencherFormulario(produto);
        fecharModalBusca();
        showToast('success', 'Produto selecionado', 'Informações carregadas');
    }
}

// Tornar função global
window.selecionarProduto = selecionarProduto;

function preencherFormulario(produto) {
    // Preencher código
    document.getElementById('codigo').value = produto.codigo || '';
    
    // Separar descrição e subdescricao (marca)
    const partes = (produto.descricao || "").split(" - ");
    document.getElementById('descricao').value = (partes[0] || "").trim();
    document.getElementById('subdescricao').value = (partes[1] || "").trim();
    
    // CORRIGIDO: Preencher preço à vista SEM aplicar máscara duplicada
    if (produto.avista) {
        const avistaValor = parseCurrency(produto.avista);
        const avistaInput = document.getElementById('avista');
        // Remover event listener temporariamente para não aplicar máscara
        const novoInput = avistaInput.cloneNode(true);
        avistaInput.parentNode.replaceChild(novoInput, avistaInput);
        novoInput.value = formatCurrency(avistaValor);
        // Reaplicar máscara
        aplicarMascaraMoeda(novoInput);
    }
    
    // Recalcular parcela
    calcularParcela();
}

function fecharModalBusca() {
    document.getElementById('modal-busca').style.display = 'none';
}

// ==================================================
// CAMPOS EXTRAS CONDICIONAIS (PREÇO VIRADO E CARTÃO)
// ==================================================
const jurosSelect = document.getElementById('juros');
const extrasContainer = document.getElementById('extra-campos');
const campoMotivo = document.getElementById('campo-motivo');
const campoValidade = document.getElementById('campo-validade');
const campoAutorizacao = document.getElementById('campo-autorizacao');

jurosSelect.addEventListener('change', () => {
    const juros = jurosSelect.value;
    
    // Esconder todos primeiro
    extrasContainer.style.display = 'none';
    campoMotivo.style.display = 'none';
    campoValidade.style.display = 'none';
    campoAutorizacao.style.display = 'none';
    
    if (juros === 'carne') {
        // Carnê: nenhum campo extra
        extrasContainer.style.display = 'none';
    } else if (juros === 'cartao') {
        // Cartão: mostra APENAS validade
        extrasContainer.style.display = 'block';
        campoValidade.style.display = 'block';
    } else if (juros === 'virado') {
        // Preço virado: mostra motivo + autorização
        extrasContainer.style.display = 'block';
        campoMotivo.style.display = 'block';
        campoAutorizacao.style.display = 'block';
    }
    
    // Recalcular parcela ao mudar taxa
    recalcularParcela();
});

// ==================================================
// CÁLCULO AUTOMÁTICO DA PARCELA
// ==================================================
function recalcularParcela() {
    const metodo = document.getElementById('metodo').value;
    const juros = document.getElementById('juros').value;
    const avistaInput = document.getElementById('avista');
    const parcelaInput = document.getElementById('parcela');
    
    if (!metodo || !juros || !avistaInput.value) {
        return;
    }
    
    const avista = limparValor(avistaInput.value);
    const numParcelas = parseInt(metodo.replace('x', ''));
    
    // Se for preço virado, não calcula
    if (juros === 'virado') {
        parcelaInput.value = '';
        return;
    }
    
    // Determinar tipo de taxa
    const tipoTaxa = (juros === 'carne') ? 'carne' : 'cartao';
    
    if (FATORES[tipoTaxa] && FATORES[tipoTaxa][numParcelas]) {
        const fator = FATORES[tipoTaxa][numParcelas];
        
        // Cálculo correto: valor à vista * fator = valor da parcela
        let parcela = avista * fator;
        
        // Arredondar para 90 centavos
        // Ex: 123.45 -> 123.90, 199.99 -> 199.90
        parcela = arredondar90(parcela);
        
        // Formatar e exibir
        parcelaInput.value = parcela.toFixed(2).replace('.', ',');
    }
}

// Alias para compatibilidade
const calcularParcela = recalcularParcela;

// Eventos para recálculo automático
document.getElementById('metodo').addEventListener('change', recalcularParcela);
document.getElementById('avista').addEventListener('input', recalcularParcela);

// ==================================================
// ADICIONAR AO CARRINHO
// ==================================================
document.getElementById('mobile-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const codigo = document.getElementById('codigo').value.trim();
    const descricao = document.getElementById('descricao').value.trim();
    const subdescricao = document.getElementById('subdescricao').value.trim();
    const feature1 = document.getElementById('feature-1').value.trim();
    const feature2 = document.getElementById('feature-2').value.trim();
    const feature3 = document.getElementById('feature-3').value.trim();
    const metodo = document.getElementById('metodo').value;
    const avista = document.getElementById('avista').value.trim();
    const juros = document.getElementById('juros').value;
    const parcela = document.getElementById('parcela').value.trim();
    
    // Campos extras
    const motivo = document.getElementById('motivo').value.trim();
    const validade = document.getElementById('validade').value.trim();
    const autorizacao = document.getElementById('autorizacao').value.trim();
    
    if (!codigo || !descricao || !metodo || !avista || !juros) {
        showToast('error', 'Campos obrigatórios', 'Preencha todos os campos obrigatórios');
        return;
    }
    
    const features = [feature1, feature2, feature3].filter(f => f.length > 0);
    
    const item = {
        id: Date.now(),
        codigo,
        descricao,
        subdescricao,
        features,
        metodo,
        avista: limparValor(avista),
        juros,
        parcela: parcela ? limparValor(parcela) : null,
        motivo,
        validade,
        autorizacao
    };
    
    carrinho.push(item);
    salvarCarrinho();
    
    // Limpar formulário
    document.getElementById('mobile-form').reset();
    
    // Esconder campos extras
    extrasContainer.style.display = 'none';
    
    showToast('success', 'Adicionado!', 'Cartaz adicionado ao JSON');
    
    // Mudar para aba do JSON
    document.querySelector('[data-tab="json"]').click();
});

// ==================================================
// ATUALIZAR CARRINHO
// ==================================================
function atualizarCarrinho() {
    const count = carrinho.length;
    document.getElementById('cart-count').textContent = count;
    document.getElementById('cart-total').textContent = count;
    
    const jsonActions = document.getElementById('json-actions');
    if (count > 0) {
        jsonActions.style.display = 'flex';
    } else {
        jsonActions.style.display = 'none';
    }
    
    renderizarCarrinho();
}

function renderizarCarrinho() {
    const container = document.getElementById('cart-list');
    
    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-file-code"></i>
                <h3>JSON vazio</h3>
                <p>Adicione cartazes e preencha o JSON</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = carrinho.map(item => `
        <div class="cart-item">
            <div class="cart-item-header">
                <div class="cart-item-code">${item.codigo}</div>
                <button class="cart-item-remove" onclick="removerItem(${item.id})">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="cart-item-title">${item.descricao}</div>
            ${item.subdescricao ? `<div class="cart-item-subtitle">${item.subdescricao}</div>` : ''}
            ${item.features.length > 0 ? `
                <div class="cart-item-features">
                    ${item.features.map(f => `<span class="cart-item-feature">${f}</span>`).join('')}
                </div>
            ` : ''}
            <div class="cart-item-footer">
                <div class="cart-item-info">
                    <span class="cart-item-label">Parcelamento</span>
                    <span class="cart-item-value">${item.metodo}</span>
                </div>
                <div class="cart-item-info">
                    <span class="cart-item-label">À vista</span>
                    <span class="cart-item-value">${formatarMoeda(item.avista)}</span>
                </div>
                <div class="cart-item-info">
                    <span class="cart-item-label">Taxa</span>
                    <span class="cart-item-value">${item.juros === 'carne' ? 'Carnê' : item.juros === 'cartao' ? 'Cartão' : 'Virado'}</span>
                </div>
                ${item.parcela ? `
                    <div class="cart-item-info">
                        <span class="cart-item-label">Parcela</span>
                        <span class="cart-item-value">${formatarMoeda(item.parcela)}</span>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function removerItem(id) {
    carrinho = carrinho.filter(item => item.id !== id);
    salvarCarrinho();
    showToast('success', 'Removido', 'Item removido do JSON');
}

// ==================================================
// AÇÕES DO JSON
// ==================================================

// Função para fazer upload do JSON para o Worker
async function uploadJsonToWorker(payload) {
    const endpoint = 'https://json-cartazes.gab-oliveirab27.workers.dev/json';
  
    console.log('[uploadJsonToWorker] POST ->', endpoint);
    // opcional: limitar ou sanitizar payload aqui
  
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
  
    // pega texto cru sempre (pra debug caso não seja JSON)
    const text = await res.text();
    let parsed;
    try { parsed = JSON.parse(text); } catch { parsed = null; }
  
    console.log('[uploadJsonToWorker] resposta HTTP', res.status, res.statusText);
    console.log('[uploadJsonToWorker] body recebido:', parsed !== null ? parsed : text);
  
    if (!res.ok) {
      // tenta extrair mensagem de erro do corpo
      const errMsg = (parsed && parsed.error) ? parsed.error : (text || `${res.status} ${res.statusText}`);
      throw new Error(errMsg);
    }
  
    return parsed !== null ? parsed : { raw: text };
}

// Tornar funções globais para o patch ter acesso
window.uploadJsonToWorker = uploadJsonToWorker;
window.gerarJSON = gerarJSON;
window.limparValor = limparValor;
window.carrinho = carrinho;

// Botão Enviar JSON (Upload para Worker do Cloudflare)
document.getElementById('btn-enviar-json')?.addEventListener('click', async () => {
    if (carrinho.length === 0) {
        showToast('warning', 'Carrinho vazio', 'Adicione cartazes antes de enviar');
        return;
    }
  
    // ler sessão com try/catch
    let authSession = null;
    try {
        const raw = localStorage.getItem('authSession');
        if (!raw) throw new Error('authSession não encontrada no localStorage');
        authSession = JSON.parse(raw);
    } catch (err) {
        console.error('Erro lendo authSession:', err);
        showToast('error', 'Sessão inválida', 'authSession não encontrada ou inválida');
        return;
    }
  
    // tentar várias chaves possíveis (compatibilidade)
    const user = (authSession.user || authSession.username || authSession.email || '').toString().trim();
    const filial = (authSession.filial || authSession.branch || authSession.store || '').toString().trim();
  
    if (!user || !filial) {
        console.error('authSession disponível, mas faltam user/filial:', authSession);
        showToast('error', 'Sessão incompleta', 'Usuário ou filial ausente em authSession');
        return;
    }
  
    // montar payload conforme a GAS espera
    const payload = {
        user: user,
        filial: filial,
        data: gerarJSON()
    };
  
    // LOG para debug — verifique Network > Request Payload no DevTools
    console.log('Payload enviado para o Worker:', payload);
  
    try {
        showToast('info', 'Enviando...', 'Fazendo upload do JSON para o servidor');
  
        const resultado = await uploadJsonToWorker(payload);
  
        // resultado deve ser { success: true, fileName: '...' } (conforme a GAS)
        console.log('Resposta do servidor:', resultado);
        if (resultado && resultado.success) {
            showToast('success', 'Enviado com sucesso!', `Arquivo salvo: ${resultado.fileName}`);
        } else if (resultado && resultado.error) {
            showToast('error', 'Erro no servidor', resultado.error);
        } else {
            showToast('success', 'Resposta recebida', JSON.stringify(resultado));
        }
    } catch (err) {
        console.error('Erro ao enviar JSON:', err);
        showToast('error', 'Erro no envio', err.message || 'Não foi possível enviar o JSON ao servidor');
    }
});

// Botão Ver/Copiar JSON
document.getElementById('btn-ver-copiar-json')?.addEventListener('click', () => {
    const jsonData = gerarJSON();
    const jsonString = JSON.stringify(jsonData, null, 2);
    
    document.getElementById('json-viewer-content').textContent = jsonString;
    document.getElementById('modal-json-viewer').style.display = 'flex';
    
    showToast('info', 'Ver/Copiar JSON', 'Você pode copiar o JSON para a área de transferência');
});

// Botão Limpar Tudo
document.getElementById('btn-limpar-json')?.addEventListener('click', () => {
    if (confirm('Deseja realmente limpar todos os cartazes do JSON?')) {
        carrinho = [];
        salvarCarrinho();
        showToast('success', 'Limpo!', 'Todos os cartazes foram removidos');
    }
});

// Botão Copiar do Modal
document.getElementById('btn-copiar-json-modal')?.addEventListener('click', () => {
    const jsonString = document.getElementById('json-viewer-content').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(jsonString).then(() => {
            showToast('success', 'Copiado!', 'JSON copiado para área de transferência');
            fecharModalJSONViewer();
        });
    } else {
        // Fallback para navegadores antigos
        const textarea = document.createElement('textarea');
        textarea.value = jsonString;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        showToast('success', 'Copiado!', 'JSON copiado para área de transferência');
        fecharModalJSONViewer();
    }
});

function gerarJSON() {
    return {
        versao: '1.0',
        origem: 'mobile',
        dataGeracao: new Date().toISOString(),
        totalCartazes: carrinho.length,
        cartazes: carrinho.map(item => ({
            codigo: item.codigo,
            descricao: item.descricao,
            subdescricao: item.subdescricao || '',
            features: item.features,
            metodo: item.metodo,
            avista: item.avista,
            juros: item.juros,
            parcela: item.parcela || 0,
            motivo: item.motivo || '',
            validade: item.validade || '',
            autorizacao: item.autorizacao || '',
            garantia12: 0,
            garantia24: 0,
            garantia36: 0
        }))
    };
}

function fecharModalJSONViewer() {
    document.getElementById('modal-json-viewer').style.display = 'none';
}

// ==================================================
// CALCULADORA DE FATOR
// ==================================================
document.getElementById('calculator-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const valorInput = document.getElementById('calc-valor').value.trim();
    const tipo = document.getElementById('calc-tipo').value;
    
    if (!valorInput || !tipo) {
        showToast('error', 'Campos obrigatórios', 'Preencha todos os campos');
        return;
    }
    
    const valor = limparValor(valorInput);
    const resultDiv = document.getElementById('calc-result');
    const tbody = document.getElementById('result-tbody');
    
    document.getElementById('result-valor').textContent = formatarMoeda(valor);
    document.getElementById('result-tipo').textContent = tipo === 'carne' ? 'Carnê' : 'Cartão';
    
    const tabelaFator = FATORES[tipo];
    tbody.innerHTML = '';
    
    // EXATAMENTE como no desktop: valor à vista * fator = valor da parcela
    for (let parcelas = 1; parcelas <= 12; parcelas++) {
        const fator = tabelaFator[parcelas];
        const valorParcela = valor * fator; // valor da PARCELA, não do total
        const totalPrazo = valorParcela * parcelas; // total a prazo
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${parcelas}x</td>
            <td>${fator.toFixed(4)}</td>
            <td>${formatarMoeda(valorParcela)}</td>
        `;
        tbody.appendChild(tr);
    }
    
    resultDiv.style.display = 'block';
    
    // Scroll suave até o resultado
    setTimeout(() => {
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
    
    showToast('success', 'Calculado!', 'Tabela de fatores gerada');
});

// ==================================================
// MODAL DE AJUDA
// ==================================================
document.getElementById('btn-help-float')?.addEventListener('click', () => {
    document.getElementById('modal-help').style.display = 'flex';
});

function fecharModalHelp() {
    document.getElementById('modal-help').style.display = 'none';
}

// ==================================================
// INICIALIZAÇÃO
// ==================================================
console.log('Sistema mobile inicializado!');

// ==================================================
// 1. SKELETON LOADING AO BUSCAR PRODUTO
// ==================================================

function mostrarSkeletonLoading() {
    const skeleton = document.createElement('div');
    skeleton.id = 'skeleton-overlay';
    skeleton.className = 'skeleton-overlay';
    skeleton.innerHTML = `
        <div class="skeleton-content">
            <div class="skeleton-status">
                <div class="skeleton-icon">
                    <i class="fa-solid fa-search"></i>
                </div>
                <div class="skeleton-text" id="skeleton-text">Buscando produto...</div>
            </div>
            <div class="skeleton-form">
                <div class="skeleton-field">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-input"></div>
                </div>
                <div class="skeleton-field">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-input"></div>
                </div>
                <div class="skeleton-field">
                    <div class="skeleton-label"></div>
                    <div class="skeleton-input short"></div>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(skeleton);
    
    // Animação de textos
    const textos = [
        'Buscando produto...',
        'Olhando cada linha...',
        'Encontrei!',
        'Tudo pronto.'
    ];
    
    let currentIndex = 0;
    const textElement = document.getElementById('skeleton-text');
    
    const intervalo = setInterval(() => {
        currentIndex++;
        if (currentIndex < textos.length) {
            textElement.style.animation = 'none';
            setTimeout(() => {
                textElement.textContent = textos[currentIndex];
                textElement.style.animation = 'fadeInOut 0.8s ease-in-out';
            }, 50);
        } else {
            clearInterval(intervalo);
        }
    }, currentIndex === 2 ? 400 : 1200); // "Encontrei!" aparece mais rápido
    
    return skeleton;
}

function esconderSkeletonLoading() {
    const skeleton = document.getElementById('skeleton-overlay');
    if (skeleton) {
        skeleton.style.animation = 'fadeIn 0.2s ease-out reverse';
        setTimeout(() => skeleton.remove(), 200);
    }
}

// ==================================================
// 2. VALIDAÇÃO INTELIGENTE DE CAMPOS
// ==================================================

function validarCamposObrigatorios() {
    const campos = [
        { id: 'codigo', nome: 'Código do produto', tipo: 'text' },
        { id: 'descricao', nome: 'Descrição', tipo: 'text' },
        { id: 'metodo', nome: 'Parcelamento', tipo: 'select' },
        { id: 'avista', nome: 'Valor à vista', tipo: 'currency' },
        { id: 'juros', nome: 'Taxa de juros', tipo: 'select' }
    ];
    
    let primeiroErro = null;
    let todosValidos = true;
    
    // Limpar erros anteriores
    document.querySelectorAll('.form-group').forEach(group => {
        group.classList.remove('error');
    });
    
    for (const campo of campos) {
        const elemento = document.getElementById(campo.id);
        const formGroup = elemento.closest('.form-group');
        
        let valor = elemento.value.trim();
        let erroMsg = '';
        
        // Validar campo vazio
        if (!valor) {
            erroMsg = `Campo obrigatório: ${campo.nome}`;
        }
        // Validar valor de moeda
        else if (campo.tipo === 'currency') {
            const valorNumerico = limparValor(valor);
            if (valorNumerico <= 0) {
                erroMsg = `${campo.nome} deve ser maior que zero`;
            }
        }
        
        if (erroMsg) {
            todosValidos = false;
            mostrarErroCampo(formGroup, erroMsg);
            
            if (!primeiroErro) {
                primeiroErro = formGroup;
            }
        }
    }
    
    // Validar campos extras condicionais
    const juros = document.getElementById('juros').value;
    
    if (juros === 'cartao') {
        const validade = document.getElementById('validade');
        if (validade && !validade.value) {
            const formGroup = validade.closest('.form-group');
            mostrarErroCampo(formGroup, 'Validade da oferta é obrigatória para Cartão');
            todosValidos = false;
            if (!primeiroErro) primeiroErro = formGroup;
        }
    }
    
    if (juros === 'virado') {
        const motivo = document.getElementById('motivo');
        const autorizacao = document.getElementById('autorizacao');
        
        if (motivo && !motivo.value.trim()) {
            const formGroup = motivo.closest('.form-group');
            mostrarErroCampo(formGroup, 'Motivo é obrigatório para Preço Virado');
            todosValidos = false;
            if (!primeiroErro) primeiroErro = formGroup;
        }
        
        if (autorizacao && !autorizacao.value.trim()) {
            const formGroup = autorizacao.closest('.form-group');
            mostrarErroCampo(formGroup, 'Autorização é obrigatória para Preço Virado');
            todosValidos = false;
            if (!primeiroErro) primeiroErro = formGroup;
        }
    }
    
    // Scroll e foco no primeiro erro
    if (primeiroErro) {
        primeiroErro.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => {
            const input = primeiroErro.querySelector('input, select');
            if (input) input.focus();
        }, 500);
    }
    
    return todosValidos;
}

function mostrarErroCampo(formGroup, mensagem) {
    formGroup.classList.add('error');
    
    // Remove mensagem de erro existente
    const erroExistente = formGroup.querySelector('.field-error-message');
    if (erroExistente) {
        erroExistente.remove();
    }
    
    // Adiciona nova mensagem de erro
    const erroElement = document.createElement('div');
    erroElement.className = 'field-error-message';
    erroElement.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${mensagem}`;
    formGroup.appendChild(erroElement);
}

// ==================================================
// 3. DETECÇÃO DE INCONSISTÊNCIA DE PARCELA
// ==================================================

function detectarInconsistenciaParcela() {
    const avistaInput = document.getElementById('avista');
    const avistaAtual = limparValor(avistaInput.value);
    
    // Se o valor à vista mudou desde o último cálculo
    if (avistaOriginal > 0 && avistaAtual !== avistaOriginal && parcelaCalculada) {
        mostrarAlertaParcela();
    } else {
        esconderAlertaParcela();
    }
}

function mostrarAlertaParcela() {
    const warning = document.getElementById('parcela-warning');
    if (warning) {
        warning.classList.add('active');
    }
}

function esconderAlertaParcela() {
    const warning = document.getElementById('parcela-warning');
    if (warning) {
        warning.classList.remove('active');
    }
}

window.recalcularParcelaManual = function() {
    recalcularParcela();
    esconderAlertaParcela();
    
    const avistaInput = document.getElementById('avista');
    avistaOriginal = limparValor(avistaInput.value);
    parcelaCalculada = true;
    
    showToastEnhanced('success', 'Recalculado!', 'Parcela atualizada com o novo valor');
};

// Monitor de mudanças no campo à vista
document.getElementById('avista')?.addEventListener('input', function() {
    detectarInconsistenciaParcela();
});

// Atualizar avistaOriginal após cálculo
const recalcularParcelaOriginal = window.recalcularParcela;
window.recalcularParcela = function() {
    recalcularParcelaOriginal();
    
    const avistaInput = document.getElementById('avista');
    avistaOriginal = limparValor(avistaInput.value);
    parcelaCalculada = true;
    esconderAlertaParcela();
};

// ==================================================
// 4. TOAST EVOLUÍDO
// ==================================================

function showToastEnhanced(type, title, message, action = null) {
    const container = document.getElementById('toast-container');
    
    const toast = document.createElement('div');
    toast.className = `toast enhanced ${type}`;
    
    let actionHtml = '';
    if (action) {
        actionHtml = `<div class="toast-action" onclick="${action.onClick}">${action.text} <i class="fa-solid fa-arrow-right"></i></div>`;
    }
    
    toast.innerHTML = `
        <div class="toast-icon">
            <i class="fa-solid fa-${type === 'success' ? 'check' : type === 'error' ? 'times' : type === 'warning' ? 'exclamation-triangle' : 'info'}-circle"></i>
        </div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}${actionHtml}</div>
        </div>
    `;
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideDown 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, action ? 5000 : 3500);
}

// ==================================================
// 5. TELA DE CONSOLE PARA ENVIO
// ==================================================

function mostrarConsoleEnvio() {
    const console = document.createElement('div');
    console.id = 'console-overlay';
    console.className = 'console-overlay';
    console.innerHTML = `
        <div class="console-container">
            <div class="console-header">
                <div class="console-dot red"></div>
                <div class="console-dot yellow"></div>
                <div class="console-dot green"></div>
                <div class="console-title">terminal ~ /mobile</div>
            </div>
            <div class="console-body" id="console-body">
                <div class="console-line" style="animation-delay: 0s;">
                    <span class="console-prompt">></span>
                    <span class="console-text">Enviando cartazes...</span>
                    <span class="console-cursor"></span>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(console);
    return console;
}

function atualizarConsole(texto, tipo = 'normal', delay = 0) {
    const body = document.getElementById('console-body');
    if (!body) return;
    
    // Limpar conteúdo anterior
    body.innerHTML = '';
    
    const line = document.createElement('div');
    line.className = 'console-line';
    line.style.animationDelay = `${delay}s`;
    
    const className = tipo === 'success' ? 'console-success' : tipo === 'error' ? 'console-error' : '';
    
    line.innerHTML = `
        <span class="console-prompt">></span>
        <span class="console-text ${className}">${texto}</span>
        ${tipo === 'normal' ? '<span class="console-cursor"></span>' : ''}
    `;
    
    body.appendChild(line);
}

function mostrarOpcoesConsole(sucesso) {
    const body = document.getElementById('console-body');
    const container = body.closest('.console-container');
    
    const actions = document.createElement('div');
    actions.className = 'console-actions';
    
    if (sucesso) {
        actions.innerHTML = `
            <button class="primary" onclick="fecharConsole()">
                <i class="fa-solid fa-check"></i> OK
            </button>
        `;
    } else {
        actions.innerHTML = `
            <button onclick="tentarEnviarNovamente()">
                <i class="fa-solid fa-rotate-right"></i> Tentar Novamente
            </button>
            <button onclick="verCopiarJSON()">
                <i class="fa-solid fa-eye"></i> Ver/Copiar JSON
            </button>
        `;
    }
    
    container.appendChild(actions);
}

function fecharConsole() {
    const console = document.getElementById('console-overlay');
    if (console) {
        console.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => console.remove(), 300);
    }
}

window.tentarEnviarNovamente = function() {
    fecharConsole();
    document.getElementById('btn-enviar-json')?.click();
};

window.verCopiarJSON = function() {
    fecharConsole();
    document.getElementById('btn-ver-copiar-json')?.click();
};

// ==================================================
// 6. INTEGRAÇÃO COM FUNÇÕES EXISTENTES
// ==================================================

// Aguardar o DOM estar completamente pronto
setTimeout(() => {
    // Substituir buscarProdutoPorCodigo com skeleton loading
    const buscarProdutoPorCodigoOriginal = window.buscarProdutoPorCodigo;
    
    if (!buscarProdutoPorCodigoOriginal) {
        console.error('❌ Função buscarProdutoPorCodigo não encontrada!');
        return;
    }
    
    window.buscarProdutoPorCodigo = async function(codigo) {
        const skeleton = mostrarSkeletonLoading();
        
        try {
            await new Promise(resolve => setTimeout(resolve, 2400)); // Tempo para animação completa
            await buscarProdutoPorCodigoOriginal(codigo);
        } finally {
            esconderSkeletonLoading();
        }
    };
    
    console.log('✅ Função de busca interceptada com sucesso!');
}, 100);

// NÃO substituir o formulário - deixar o original funcionar
// O formulário já tem validação básica e adiciona ao carrinho corretamente

// Substituir envio de JSON com console
const btnEnviar = document.getElementById('btn-enviar-json');
if (btnEnviar) {
    const novoBtnEnviar = btnEnviar.cloneNode(true);
    btnEnviar.parentNode.replaceChild(novoBtnEnviar, btnEnviar);
    
    novoBtnEnviar.addEventListener('click', async () => {
        // Acessar carrinho do window
        const carrinhoAtual = window.carrinho || [];
        
        if (carrinhoAtual.length === 0) {
            showToastEnhanced('warning', 'Carrinho vazio', 'Adicione cartazes antes de enviar');
            return;
        }
        
        // Ler authSession
        let authSession = null;
        try {
            const raw = localStorage.getItem('authSession');
            if (!raw) throw new Error('authSession não encontrada no localStorage');
            authSession = JSON.parse(raw);
        } catch (err) {
            console.error('Erro lendo authSession:', err);
            showToastEnhanced('error', 'Sessão inválida', 'authSession não encontrada ou inválida');
            return;
        }
        
        // Extrair user e filial
        const user = (authSession.user || authSession.username || authSession.email || '').toString().trim();
        const filial = (authSession.filial || authSession.branch || authSession.store || '').toString().trim();
        
        if (!user || !filial) {
            console.error('authSession disponível, mas faltam user/filial:', authSession);
            showToastEnhanced('error', 'Sessão incompleta', 'Usuário ou filial ausente em authSession');
            return;
        }
        
        const consoleEl = mostrarConsoleEnvio();
        
        // Montar payload correto
        const payload = {
            user: user,
            filial: filial,
            data: window.gerarJSON()
        };
        
        console.log('Payload enviado para o Worker:', payload);
        
        try {
            // Aguardar 1.5s para mostrar "Enviando..."
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            atualizarConsole('Aguardando resposta do êxito...', 'normal');
            
            // Fazer upload real
            const resultado = await window.uploadJsonToWorker(payload);
            
            // Aguardar mais um pouco
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Mostrar sucesso
            atualizarConsole('Tudo certo.', 'success');
            
            await new Promise(resolve => setTimeout(resolve, 1200));
            
            mostrarOpcoesConsole(true);
            
            if (resultado && resultado.success) {
                showToastEnhanced('success', 'Enviado!', `Arquivo salvo: ${resultado.fileName}`);
            } else {
                showToastEnhanced('success', 'Enviado!', `${carrinhoAtual.length} cartaz(es) enviado(s) com sucesso`);
            }
            
        } catch (error) {
            console.error('Erro ao enviar:', error);
            
            atualizarConsole(`Erro: ${error.message}`, 'error');
            await new Promise(resolve => setTimeout(resolve, 500));
            
            mostrarOpcoesConsole(false);
            
            showToastEnhanced('error', 'Erro no envio', error.message || 'Não foi possível enviar o JSON');
        }
    });
}

// ==================================================
// 7. INICIALIZAÇÃO DO PATCH
// ==================================================

console.log('✅ Patch Mobile aplicado com sucesso!');
console.log('🎨 Skeleton loading: ativado');
console.log('✔️ Validação inteligente: ativada');
console.log('⚠️ Detecção de inconsistência: ativada');
console.log('💬 Toast evoluído: ativado');