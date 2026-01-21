// ==================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==================================================
console.log('Script carregado com sucesso!');

const API_URL = "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLic4iE63JAJ0j4KpGWfRFINeiD4uyCsMjfF_uLkUNzhOsJMzO4uiiZpWV3xzDjbduZK8kU_wWw3ZSCs6cODW2gdFnIGb6pZ0Lz0cBqMpiV-SBOJroENJHqO1XML_YRs_41KFfQOKEehUQmf-Xg6Xhh-bKiYpPxxwQhQzEMP5g0DdJHN4sgG_Fc9cdvRRU4abxlz_PzeQ_5eJ7NtCfxWuP-ET0DEzUyiWhWITlXMZKJMfwmZQg5--gKmAEGpwSr0yXi3eycr23BCGltlXGIWtYZ3I0WkWg&lib=M38uuBDbjNiNXY1lAK2DF9n3ltsPa6Ver";

// Tabela de fatores para cálculo de parcelas
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

// Função para formatar número com separador de milhar
function formatarMilhar(numero) {
    return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

let products = [];

// Variáveis globais para o modal de busca por texto
let todosProdutos = [];
let produtosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let modoAgrupamento = 'nenhum'; // 'nenhum', 'marca', 'codigo'

// ==================================================
// NAVEGAÇÃO
// ==================================================
const navButtons = document.querySelectorAll('.nav-item');
const views = {
    gerar: document.getElementById('view-gerar'),
    produtos: document.getElementById('view-produtos'),
    calculadora: document.getElementById('view-calculadora'),
    'cama-box': document.getElementById('view-cama-box'),
    'mesa-cadeiras': document.getElementById('view-mesa-cadeiras'),
    'cama-mesa-banho': document.getElementById('view-cama-mesa-banho')
};

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewName = btn.getAttribute('data-view');
        if (!viewName) return;

        // Atualiza botões ativos
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Atualiza views ativas
        Object.values(views).forEach(v => v && v.classList.remove('active'));
        if (views[viewName]) {
            views[viewName].classList.add('active');
        }

        // Atualiza header
        updateHeader(viewName);
    });
});

function updateHeader(viewName) {
    const subtitle = document.getElementById('header-subtitle');
    const subtitles = {
        gerar: 'Preencha os dados do produto para criar o cartaz',
        produtos: `${products.length} produto(s) adicionado(s)`,
        calculadora: 'Calcule o valor das parcelas com base no fator de multiplicação',
        'cama-box': 'Crie cartazes de combo: base + colchão',
        'mesa-cadeiras': 'Crie cartazes de combo: mesa + cadeiras',
        'cama-mesa-banho': 'Crie cartazes de combo completo com múltiplos itens'
    };
    subtitle.textContent = subtitles[viewName] || 'Bem-vindo ao sistema';
}

// ==================================================
// OVERLAY DE LOADING (funções legadas - mantidas por compatibilidade)
// ==================================================
function mostrarOverlay() {
    // Usa a função moderna por padrão
    mostrarOverlayBusca('Carregando', 'Aguarde um momento...');
}

function esconderOverlay() {
    ocultarOverlay();
}

// ==================================================
// FUNÇÕES DO OVERLAY MODERNO
// ==================================================
function atualizarOverlayTexto(msg) {
    const textoEl = document.getElementById("overlay-texto");
    if (textoEl) textoEl.textContent = msg;
}

// Mostrar overlay em estado de busca
function mostrarOverlayBusca(texto = 'Buscando informações', subtexto = 'Aguarde um momento') {
    const overlay = document.getElementById('overlay');
    const textoEl = document.getElementById('overlay-texto');
    const subtextoEl = document.getElementById('overlay-subtexto');
    const iconEl = document.getElementById('overlay-icon');
    
    // Resetar classes
    overlay.className = 'searching';
    overlay.classList.add('active');
    
    // Atualizar textos
    if (textoEl) textoEl.textContent = texto;
    if (subtextoEl) {
        subtextoEl.textContent = subtexto;
        subtextoEl.style.display = 'block';
    }
    
    // Ocultar ícone durante busca
    if (iconEl) {
        iconEl.classList.remove('show', 'success', 'error');
        iconEl.innerHTML = '<i class="fa-solid fa-magnifying-glass"></i>';
    }
}

// Mostrar overlay de sucesso
function mostrarOverlaySucesso(texto = 'Informações encontradas', subtexto = 'Carregando dados...') {
    const overlay = document.getElementById('overlay');
    const textoEl = document.getElementById('overlay-texto');
    const subtextoEl = document.getElementById('overlay-subtexto');
    const iconEl = document.getElementById('overlay-icon');
    
    // Mudar para estado de sucesso
    overlay.className = 'success';
    overlay.classList.add('active');
    
    // Atualizar textos
    if (textoEl) textoEl.textContent = texto;
    if (subtextoEl) {
        subtextoEl.textContent = subtexto;
        subtextoEl.style.display = 'block';
    }
    
    // Mostrar ícone de sucesso
    if (iconEl) {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        iconEl.classList.add('show', 'success');
        iconEl.classList.remove('error');
    }
}

// Mostrar overlay de erro
function mostrarOverlayErro(texto = 'Informações inexistentes', subtexto = 'Produto não encontrado') {
    const overlay = document.getElementById('overlay');
    const textoEl = document.getElementById('overlay-texto');
    const subtextoEl = document.getElementById('overlay-subtexto');
    const iconEl = document.getElementById('overlay-icon');
    
    // Mudar para estado de erro
    overlay.className = 'error';
    overlay.classList.add('active');
    
    // Atualizar textos
    if (textoEl) textoEl.textContent = texto;
    if (subtextoEl) {
        subtextoEl.textContent = subtexto;
        subtextoEl.style.display = 'block';
    }
    
    // Mostrar ícone de erro
    if (iconEl) {
        iconEl.innerHTML = '<i class="fa-solid fa-circle-xmark"></i>';
        iconEl.classList.add('show', 'error');
        iconEl.classList.remove('success');
    }
}

// Ocultar overlay
function ocultarOverlay() {
    const overlay = document.getElementById('overlay');
    if (overlay) {
        overlay.classList.remove('active', 'searching', 'success', 'error');
    }
}

// ==================================================
// FORMATAÇÃO DE VALORES
// ==================================================
function formatCurrency(value) {
    if (!value) return '';
    let num = value.replace(/\D/g, '');
    num = (parseInt(num) / 100).toFixed(2);
    return num.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function parseCurrency(value) {
    if (!value) return 0;
    let limpo = value.toString()
        .replace(/R\$/g, "")
        .replace(/\s+/g, "")
        .replace(/\u00A0/g, "")
        .replace(/[^\d,.-]/g, "");
    limpo = limpo.replace(/\.(?=\d{3}(,|$))/g, "");
    limpo = limpo.replace(",", ".");
    const numero = parseFloat(limpo);
    return isNaN(numero) ? 0 : numero;
}

function brl(n) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(+n || 0);
}

function arredondar90(valor) {
    const num = Number(valor);
    if (!isFinite(num) || num <= 0) return 0;
    const centavos = Math.floor(num * 100);
    const k = Math.floor((centavos - 90) / 100);
    const resultCentavos = Math.max(0, k * 100 + 90);
    return resultCentavos / 100;
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
}

function formatDateExtended(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 
                   'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
    const mesNome = meses[parseInt(m) - 1];
    return `Oferta válida até ${parseInt(d)} de ${mesNome} de ${y}`;
}

// Aplicar máscara de moeda nos inputs
const currencyInputs = ['avista', 'calc-valor', 'garantia12', 'garantia24', 'garantia36'];
currencyInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input) {
        input.addEventListener('input', (e) => {
            e.target.value = formatCurrency(e.target.value);
        });
    }
});

// ==================================================
// VALIDAÇÃO E FORMATAÇÃO DO CAMPO CÓDIGO
// ==================================================
const codigoInput = document.getElementById('codigo');
codigoInput.addEventListener('input', (e) => {
    // Permitir apenas números e "/"
    let value = e.target.value;
    value = value.replace(/[^0-9/]/g, '');
    e.target.value = value;
});

// ==================================================
// BUSCA DE PRODUTO NA API
// ==================================================
const btnBuscar = document.getElementById("btn-buscar");
const inputCodigo = document.getElementById("codigo");

inputCodigo.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        btnBuscar.click();
    }
});

btnBuscar.addEventListener("click", async () => {
    const codigo = inputCodigo.value.trim();
    
    // ✅ SE NÃO HOUVER CÓDIGO, ABRE O MODAL DE BUSCA POR TEXTO
    if (!codigo) {
        abrirModalBuscaTexto();
        return;
    }

    // ✅ ETAPA 1: Buscando informações
    mostrarOverlayBusca('Buscando informações', `Procurando produto código ${codigo}...`);

    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error("Erro ao acessar a API");
        
        const dados = await resposta.json();
        let encontrado = false;
        let primeiroItem = null;

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
            // ✅ ETAPA 2: Informações encontradas
            mostrarOverlaySucesso('Informações encontradas', 'Preenchendo campos automaticamente...');
            
            // Aguardar um pouco para mostrar o sucesso
            await new Promise(res => setTimeout(res, 800));
            
            const partes = (primeiroItem.Descrição || "").split(" - ");
            document.getElementById("descricao").value = (partes[0] || "").trim();
            // Marca vai para subdescricao automaticamente
            document.getElementById("subdescricao").value = (partes[1] || "").trim();

            const avistaValor = parseCurrency(primeiroItem["Total à vista"]);
            document.getElementById("avista").value = formatCurrency(avistaValor.toFixed(2));

            if (primeiroItem["Tot. G.E 12"]) {
                document.getElementById("garantia12").value = formatCurrency(parseCurrency(primeiroItem["Tot. G.E 12"]).toFixed(2));
            }

            await new Promise(res => setTimeout(res, 600));
            showToast('success', 'Produto encontrado', 'Dados preenchidos automaticamente.');
        } else {
            // ✅ ETAPA 3: Informações inexistentes
            mostrarOverlayErro('Informações inexistentes', `Código ${codigo} não encontrado`);
            await new Promise(res => setTimeout(res, 1500));
            showToast('warning', 'Produto não encontrado', 'Código não cadastrado. Preencha manualmente.');
        }
    } catch (e) {
        console.error(e);
        mostrarOverlayErro('Erro na busca', 'Não foi possível acessar o banco de dados');
        await new Promise(res => setTimeout(res, 1500));
        showToast('error', 'Erro na conexão', 'Verifique sua internet e tente novamente.');
    } finally {
        ocultarOverlay();
    }
});

// ==================================================
// VALIDAÇÃO E CÁLCULOS
// ==================================================
const descricaoInput = document.getElementById("descricao");
const descricaoErro = document.getElementById("descricao-erro");

if (descricaoInput) {
    descricaoInput.addEventListener("input", () => {
        if (descricaoInput.value.length > 35) {
            descricaoErro.style.display = "block";
            descricaoInput.style.borderColor = "red";
        } else {
            descricaoErro.style.display = "none";
            descricaoInput.style.borderColor = "";
        }
    });
}

// Garantias
const garantiaCheckbox = document.getElementById('garantia');
const warrantyOptions = document.getElementById('warranty-options');
const g12 = document.getElementById("garantia12");
const g24 = document.getElementById("garantia24");
const g36 = document.getElementById("garantia36");

garantiaCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
        warrantyOptions.style.display = 'grid';
    } else {
        warrantyOptions.style.display = 'none';
        g12.value = '';
        g24.value = '';
        g36.value = '';
        g24.disabled = true;
        g36.disabled = true;
    }
});

g12.addEventListener("input", () => {
    if (parseCurrency(g12.value) > 0) {
        g24.disabled = false;
    } else {
        g24.value = "";
        g24.disabled = true;
        g36.value = "";
        g36.disabled = true;
    }
});

g24.addEventListener("input", () => {
    if (parseCurrency(g24.value) > 0) {
        g36.disabled = false;
    } else {
        g36.value = "";
        g36.disabled = true;
    }
});

// ==================================================
// CAMPOS EXTRAS CONDICIONAIS
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
        // Cartão: mostra APENAS validade (sem motivo)
        extrasContainer.style.display = 'block';
        campoValidade.style.display = 'block';
    } else if (juros === 'virado') {
        // Preço virado: mostra motivo + autorização
        extrasContainer.style.display = 'block';
        campoMotivo.style.display = 'block';
        campoAutorizacao.style.display = 'block';
    }
});

// Cálculo automático de parcela com lógicas especiais por parcelamento
function recalcularParcela() {
    const metodo = document.getElementById('metodo').value;
    const juros = document.getElementById('juros').value;
    const avistaInput = document.getElementById('avista');
    const parcelaInput = document.getElementById('parcela');

    // Limpar readonly e remover tooltip
    parcelaInput.removeAttribute('readonly');
    avistaInput.removeAttribute('readonly');
    avistaInput.removeAttribute('disabled');
    
    // Remover tooltip se existir  
    const formGroup = avistaInput.closest('.form-group');
    const existingTooltip = formGroup ? formGroup.querySelector('.tooltip-text') : null;
    if (existingTooltip) existingTooltip.remove();
    if (formGroup) formGroup.classList.remove('input-with-tooltip');

    if (!metodo || metodo === '') return;

    // LÓGICA PARA 1x: Mostrar apenas R$, não calcular nada
    if (metodo === '1x') {
        parcelaInput.value = '';
        return;
    }

    // LÓGICA PARA 3x, 5x, 10x: SEM JUROS
    if (metodo === '3x' || metodo === '5x' || metodo === '10x') {
        const parcela = parseCurrency(parcelaInput.value);
        if (parcela > 0) {
            const numParcelas = parseInt(metodo.replace('x', ''));
            const valorAvista = parcela * numParcelas;
            avistaInput.value = formatCurrency(valorAvista.toFixed(2));
            
            // Bloquear campo à vista e adicionar tooltip
            avistaInput.setAttribute('readonly', 'true');
            avistaInput.setAttribute('disabled', 'true');
            
            // Criar tooltip
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip-text';
            
            let tooltipMsg = `Como o parcelamento é "sem juros", não há necessidade de preencher o campo de à vista, o cálculo é feito automaticamente`;
            if (metodo === '10x' && juros === 'cartao') {
                tooltipMsg = `Parcelamento sem juros no cartão! O valor à vista é calculado automaticamente`;
            }
            
            tooltip.textContent = tooltipMsg;
            const formGroup = avistaInput.closest('.form-group');
            if (formGroup) {
                formGroup.classList.add('input-with-tooltip');
                formGroup.appendChild(tooltip);
            }
        }
        return;
    }

    // LÓGICA PARA 12x: Cálculo com fator
    if (metodo === '12x') {
        if (!juros || juros === '') return;

        const avista = parseCurrency(avistaInput.value);
        if (avista === 0) return;

        const numParcelas = 12;
        let parcela = 0;

        const tipoTaxa = (juros === 'carne') ? 'carne' : 'cartao';
        
        if (FATORES[tipoTaxa] && FATORES[tipoTaxa][numParcelas]) {
            const fator = FATORES[tipoTaxa][numParcelas];
            parcela = avista * fator;
            parcela = arredondar90(parcela);
        }

        parcelaInput.value = parcela ? formatCurrency(parcela.toFixed(2)) : '';
    }
}

// Aplicar máscara também no campo parcela
const parcelaInput = document.getElementById('parcela');
parcelaInput.addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
    // Recalcular à vista para parcelamentos sem juros
    const metodo = document.getElementById('metodo').value;
    if (metodo === '3x' || metodo === '5x' || metodo === '10x') {
        recalcularParcela();
    }
});

document.getElementById('metodo').addEventListener('change', recalcularParcela);
document.getElementById('juros').addEventListener('change', recalcularParcela);
document.getElementById('avista').addEventListener('input', () => {
    // Só recalcula se o campo NÃO estiver bloqueado
    const avistaInput = document.getElementById('avista');
    if (!avistaInput.hasAttribute('disabled')) {
        recalcularParcela();
    }
});

// ==================================================
// ADICIONAR PRODUTO
// ==================================================
const productForm = document.getElementById('product-form');

productForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const codigo = document.getElementById('codigo').value.trim();
    const descricao = document.getElementById('descricao').value.trim().toUpperCase();
    const subdescricao = document.getElementById('subdescricao').value.trim().toUpperCase();
    const feature1 = document.getElementById('feature-1').value.trim();
    const feature2 = document.getElementById('feature-2').value.trim();
    const feature3 = document.getElementById('feature-3').value.trim();
    const metodo = document.getElementById('metodo').value;
    const juros = document.getElementById('juros').value;
    const avista = parseCurrency(document.getElementById('avista').value);
    const parcela = parseCurrency(document.getElementById('parcela').value);
    
    const motivo = document.getElementById('motivo').value.trim();
    const validade = document.getElementById('validade').value.trim();
    const autorizacao = document.getElementById('autorizacao').value.trim();

    const g12Val = parseCurrency(document.getElementById('garantia12').value);
    const g24Val = parseCurrency(document.getElementById('garantia24').value);
    const g36Val = parseCurrency(document.getElementById('garantia36').value);

    if (!codigo || !descricao) {
        showToast('warning', 'Campos obrigatórios', 'Preencha código e descrição!');
        return;
    }

    if (!metodo || !juros) {
        showToast('warning', 'Campos obrigatórios', 'Selecione parcelamento e taxa de juros!');
        return;
    }

    if (avista <= 0) {
        showToast('warning', 'Valor inválido', 'Informe o valor à vista!');
        return;
    }

    if (parcela <= 0) {
        showToast('warning', 'Valor inválido', 'Informe o valor da parcela!');
        return;
    }

    const features = [feature1, feature2, feature3].filter(f => f !== '');
    
    // VALIDAÇÃO OBRIGATÓRIA DE CARACTERÍSTICAS
    if (features.length === 0) {
        showSearchToast(descricao);
        return;
    }

    const product = {
        id: Date.now(),
        codigo,
        descricao,
        subdescricao,
        features,
        metodo,
        juros,
        avista,
        parcela,
        motivo,
        validade,
        autorizacao,
        garantia12: g12Val,
        garantia24: g24Val,
        garantia36: g36Val
    };

    products.push(product);
    renderProducts();
    
    showToast('success', 'Produto adicionado!', `${descricao} foi adicionado com sucesso.`);

    // Resetar formulário
    productForm.reset();
    warrantyOptions.style.display = 'none';
    garantiaCheckbox.checked = false;
    g24.disabled = true;
    g36.disabled = true;
    extrasContainer.style.display = 'none';

    // Mudar para view de produtos
    navButtons[1].click();
});

// ==================================================
// RENDERIZAR PRODUTOS
// ==================================================
function renderProducts() {
    const productsList = document.getElementById('products-list');
    const productsCount = document.getElementById('products-count');
    const btnGerarPDF = document.getElementById('btn-gerar-pdf');

    if (products.length === 0) {
        productsList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <h3>Nenhum produto adicionado</h3>
                <p>Adicione produtos usando o formulário para começar</p>
            </div>
        `;
        btnGerarPDF.style.display = 'none';
        productsCount.textContent = '0 produto(s) adicionado(s)';
        updateHeader('produtos');
        return;
    }

    productsCount.textContent = `${products.length} produto(s) adicionado(s)`;
    btnGerarPDF.style.display = 'inline-flex';
    updateHeader('produtos');

    productsList.innerHTML = products.map(product => {
        const featuresText = product.features.join(' | ');
        const jurosText = product.juros === 'carne' ? 'Carnê' :
            product.juros === 'cartao' ? 'Cartão' : 'Preço virado';

        return `
            <div class="product-card">
                <div class="product-info">
                    <h3>${product.descricao}</h3>
                    ${product.subdescricao ? `<p style="font-style: italic; color: #666;">${product.subdescricao}</p>` : ''}
                    <p>Código: ${product.codigo}</p>
                    ${featuresText ? `
                        <div class="product-features">
                            ${product.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                        </div>
                    ` : ''}
                    <div class="product-details">
                        <div class="product-detail">
                            <span>Parcelamento</span>
                            <strong>${product.metodo}</strong>
                        </div>
                        <div class="product-detail">
                            <span>Valor à vista</span>
                            <strong>${brl(product.avista)}</strong>
                        </div>
                        <div class="product-detail">
                            <span>Parcela</span>
                            <strong>${brl(product.parcela)}</strong>
                        </div>
                        <div class="product-detail">
                            <span>Taxa</span>
                            <strong>${jurosText}</strong>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="product-preview" onclick="showPreview(${product.id})">
                        ${generatePosterHTML(product, true)}
                    </div>
                    <button class="btn-delete" onclick="deleteProduct(${product.id})">
                        <i class="fa-solid fa-trash"></i> Remover
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// ==================================================
// GERAÇÃO DE CARTAZ HTML
// ==================================================
function generatePosterHTML(product, isPreview = false) {
    const featuresText = product.features.join(' | ');
    
    // Calcular valor total
    const numParcelas = parseInt(product.metodo.replace('x', ''));
    const valorTotal = product.parcela * numParcelas;

    // Separar parte inteira e decimal do valor da parcela
    const parcelaInteiro = Math.floor(product.parcela);
    const parcelaCentavos = Math.round((product.parcela - parcelaInteiro) * 100);

    const jurosTexto = {
        carne: '6,9% a.m e 122,71% a.a',
        cartao: '2,92% a.m e 41,25% a.a',
        virado: '2,92% a.m e 41,25% a.a'
    };

    // Determinar texto de parcelamento e taxa
    let tipoParcelamento = product.juros === 'carne' ? 'carnê' : 'cartão';
    let taxaTexto = jurosTexto[product.juros];
    
    // Classe especial para carnê
    const posterClass = product.juros === 'carne' ? 'poster poster-carne' : 'poster';
    
    // Lógica especial para parcelamentos sem juros
    if (product.metodo === '3x' || product.metodo === '5x') {
        taxaTexto = 'Sem juros';
    } else if (product.metodo === '10x' && product.juros === 'cartao') {
        taxaTexto = 'Sem juros no cartão!';
    }

    // Validade por extenso
    const validadeExtensa = product.validade ? formatDateExtended(product.validade) : '';

    // Calcular tamanho da fonte baseado no número de dígitos
    const numDigitosParcela = String(parcelaInteiro).length;
    let fontSizeParcela = '240pt'; // Padrão para 2 dígitos
    if (numDigitosParcela === 3) {
        fontSizeParcela = '210pt'; // Reduz um pouco para 3 dígitos
    } else if (numDigitosParcela >= 4) {
        fontSizeParcela = '180pt'; // Reduz bem mais para 4+ dígitos
    }

    // Para 1x, calcular tamanho da fonte do valor à vista
    const avistaInteiro = Math.floor(product.avista);
    const numDigitosAvista = String(avistaInteiro).length;
    let fontSizeAvista = '240pt';
    if (numDigitosAvista === 3) {
        fontSizeAvista = '210pt';
    } else if (numDigitosAvista >= 4) {
        fontSizeAvista = '180pt';
    }

    return `
        <div class="${posterClass}">
            <div class="poster-header">
                <div class="poster-title">${product.descricao}</div>
                ${product.subdescricao ? `<div class="poster-subtitle">${product.subdescricao}</div>` : ''}
                ${featuresText ? `<div class="poster-features">${featuresText}</div>` : ''}
                <div class="poster-code">${product.codigo}</div>
            </div>
            
            ${product.metodo !== '1x' ? `
            <div class="poster-price-section">
                <div class="poster-left-section">
                    <div class="poster-installment">${product.metodo}</div>
                    <div class="poster-currency">R$</div>
                </div>
                <div class="poster-value-container" data-digits="${numDigitosParcela}">
                    <div class="poster-value-integer" style="font-size: ${fontSizeParcela};">${formatarMilhar(parcelaInteiro)}</div>
                    <div class="poster-value-decimal">,${String(parcelaCentavos).padStart(2, '0')}</div>
                </div>
            </div>
            ` : `
            <div class="poster-price-section">
                <div class="poster-left-section">
                    <div class="poster-currency">R$</div>
                </div>
                <div class="poster-value-container" data-digits="${numDigitosAvista}">
                    <div class="poster-value-integer" style="font-size: ${fontSizeAvista};">${formatarMilhar(avistaInteiro)}</div>
                    <div class="poster-value-decimal">,${String(Math.round((product.avista - Math.floor(product.avista)) * 100)).padStart(2, '0')}</div>
                </div>
            </div>
            `}
            
            ${validadeExtensa ? `<div class="poster-validity">${validadeExtensa}</div>` : ''}
            
            <div class="poster-footer-table">
                <div class="poster-table-left">
                    <div class="poster-price-line">
                        <div class="poster-table-main-text">= ${brl(valorTotal)}</div>
                        <div class="poster-payment-info">
                            <div class="poster-payment-type">no ${tipoParcelamento}</div>
                            <div class="poster-payment-rate">${taxaTexto}</div>
                        </div>
                    </div>
                    ${product.motivo ? `<div class="poster-table-sub-text" style="margin-top: 8px; font-weight: 700;">${product.motivo}</div>` : ''}
                </div>
                <div class="poster-table-right">
                    <div class="poster-table-main-text">${brl(product.avista)} À VISTA</div>
                    ${product.autorizacao ? `<div class="poster-table-sub-text" style="margin-top: 8px;">${product.autorizacao}</div>` : ''}
                </div>
            </div>
        </div>
    `;
}

// ==================================================
// FUNÇÕES GLOBAIS
// ==================================================
window.deleteProduct = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    showConfirm({
        title: 'Remover produto',
        subtitle: 'O produto será removido da lista',
        message: `Tem certeza que deseja remover "${product.descricao}"?`,
        confirmText: 'Remover',
        onConfirm: () => {
            const deletedProduct = {...product};
            const deletedIndex = products.findIndex(p => p.id === id);
            
            products = products.filter(p => p.id !== id);
            renderProducts();
            
            // Mostrar toast com opção de desfazer
            showUndoToast('Produto removido!', 'O produto foi removido da lista.', () => {
                // Restaurar produto na mesma posição
                products.splice(deletedIndex, 0, deletedProduct);
                renderProducts();
                showToast('success', 'Produto restaurado!', 'O produto foi adicionado novamente à lista.');
            });
        }
    });
};

window.showPreview = function(id) {
    const product = products.find(p => p.id === id);
    if (!product) return;
    showToast('info', 'Visualização', 'Clique em "Gerar PDF" para visualizar o cartaz completo.');
};

// ==================================================
// GERAR PDF COM BLOB
// ==================================================
document.getElementById('btn-gerar-pdf').addEventListener('click', async () => {
    if (products.length === 0) {
        showToast('warning', 'Nenhum produto', 'Adicione pelo menos um produto para gerar o PDF!');
        return;
    }

    mostrarOverlay();
    atualizarOverlayTexto("📄 Gerando PDF...");

    try {
        const pdf = new window.jspdf.jsPDF("p", "mm", "a4");

        for (let i = 0; i < products.length; i++) {
            atualizarOverlayTexto(`📄 Processando cartaz ${i + 1} de ${products.length}...`);

            const clone = document.createElement('div');
            clone.innerHTML = generatePosterHTML(products[i], false);
            clone.style.cssText = 'position:absolute;left:-99999px;top:0;width:210mm;height:297mm;background:#fff';
            document.body.appendChild(clone);

            const canvas = await html2canvas(clone, { scale: 2, backgroundColor: "#fff" });
            const img = canvas.toDataURL("image/jpeg", 1.0);

            if (i > 0) pdf.addPage();
            pdf.addImage(img, "JPEG", 0, 0, 210, 297);

            document.body.removeChild(clone);
        }

        // Gerar blob e abrir em nova janela com título personalizado
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        
        // Criar título com códigos dos produtos
        const codigos = products.map(p => p.codigo).join(', ');
        const titulo = `Cartazes gerados - ${codigos}`;
        
        // Abrir em nova aba com título personalizado
        const newWindow = window.open(pdfUrl, '_blank');
        if (newWindow && !newWindow.closed) {
            newWindow.document.title = titulo;
            showToast('success', 'PDF gerado!', `Cartaz(es) do(s) produto(s) ${codigos} gerado(s) com sucesso!`);
        } else {
            // Popup foi bloqueado
            showToast('warning', 'Popups bloqueados', 'Por favor, ative os popups no seu navegador para visualizar o PDF.');
        }
        esconderOverlay();

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        showToast('error', 'Erro ao gerar PDF', 'Ocorreu um erro ao gerar o PDF. Tente novamente.');
        esconderOverlay();
    }
});

// ==================================================
// CALCULADORA DE FATOR
// ==================================================
document.getElementById('calculator-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const valor = parseCurrency(document.getElementById('calc-valor').value);
    const tipo = document.getElementById('calc-tipo').value;

    if (valor <= 0) {
        showToast('warning', 'Valor obrigatório', 'Informe um valor válido!');
        return;
    }

    if (!tipo) {
        showToast('warning', 'Tipo obrigatório', 'Selecione o tipo de taxa!');
        return;
    }

    gerarTabelaFatores(valor, tipo);
});

function gerarTabelaFatores(valorVista, tipo) {
    // Obter elementos do modal
    const elementoValor = document.getElementById('tabela-valor-vista');
    const elementoTipo = document.getElementById('tabela-tipo-taxa');
    const elementoTbody = document.getElementById('tabela-fatores-body');
    
    // Verificar se elementos existem
    if (!elementoValor || !elementoTipo || !elementoTbody) {
        showToast('error', 'Erro no sistema', 'Modal de fatores não está disponível. Recarregue a página.');
        return;
    }
    
    // Atualizar informações do modal
    elementoValor.textContent = brl(valorVista);
    elementoTipo.textContent = tipo === 'carne' ? 'Carnê' : 'Cartão';

    const fatores = FATORES[tipo];
    elementoTbody.innerHTML = '';

    // Gerar linhas da tabela
    for (let parcelas = 1; parcelas <= 12; parcelas++) {
        const fator = fatores[parcelas];
        const valorParcela = valorVista * fator;
        const totalPrazo = valorParcela * parcelas;

        // Formatar valores com EXATAMENTE 2 casas decimais
        const valorParcelaFormatado = valorParcela.toFixed(2).replace('.', ',');
        const totalPrazoFormatado = totalPrazo.toFixed(2).replace('.', ',');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${parcelas}x</td>
            <td>${fator.toFixed(4)}</td>
            <td>R$ ${totalPrazoFormatado}</td>
            <td>R$ ${valorParcelaFormatado}</td>
        `;
        elementoTbody.appendChild(row);
    }

    // Mostrar modal
    document.getElementById('modal-fator').classList.add('active');
}

function fecharModalFator() {
    document.getElementById('modal-fator').classList.remove('active');
}

function imprimirTabela() {
    window.print();
}

// Tornar funções globais
window.fecharModalFator = fecharModalFator;
window.imprimirTabela = imprimirTabela;
window.fecharModalBuscaTexto = fecharModalBuscaTexto;
window.adicionarProdutoDaBusca = adicionarProdutoDaBusca;
window.alterarAgrupamento = alterarAgrupamento;

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modalFator = document.getElementById('modal-fator');
        if (modalFator && modalFator.classList.contains('active')) {
            fecharModalFator();
        }
        
        const modalBusca = document.getElementById('modal-busca-texto');
        if (modalBusca && modalBusca.classList.contains('active')) {
            fecharModalBuscaTexto();
        }
    }
});

// ==================================================
// MODAL DE BUSCA POR TEXTO - FUNÇÕES AUXILIARES
// ==================================================

// Calcula similaridade entre duas strings (algoritmo de Levenshtein simplificado)
function calcularSimilaridade(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    
    if (str1 === str2) return 100;
    if (str1.includes(str2) || str2.includes(str1)) return 85;
    
    const len1 = str1.length;
    const len2 = str2.length;
    const matrix = [];
    
    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i];
    }
    
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j;
    }
    
    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            );
        }
    }
    
    const maxLen = Math.max(len1, len2);
    const similarity = ((maxLen - matrix[len1][len2]) / maxLen) * 100;
    return similarity;
}

// Extrai a marca do nome do produto (heurística simples)
function extrairMarca(descricao) {
    // Lista de marcas conhecidas (adicione mais conforme necessário)
    const marcasConhecidas = [
        'SAMSUNG', 'LG', 'SONY', 'PHILIPS', 'PANASONIC', 'TCL', 'AOC',
        'MULTILASER', 'POSITIVO', 'DELL', 'HP', 'LENOVO', 'ASUS',
        'ELECTROLUX', 'BRASTEMP', 'CONSUL', 'MIDEA', 'PHILCO',
        'MONDIAL', 'ARNO', 'BRITÂNIA', 'CADENCE', 'BLACK+DECKER',
        'TOSHIBA', 'HITACHI', 'SHARP', 'JBL', 'HARMAN', 'BOSE'
    ];
    
    const descUpper = descricao.toUpperCase();
    
    // Procura por marca conhecida
    for (const marca of marcasConhecidas) {
        if (descUpper.includes(marca)) {
            return marca;
        }
    }
    
    // Se não encontrou, usa a primeira palavra como marca
    const palavras = descricao.trim().split(/\s+/);
    return palavras[0] || 'SEM MARCA';
}

// Agrupa código similar baseado em dígitos
function obterPrefixoCodigo(codigo) {
    const codigoStr = codigo.toString().trim();
    const tamanho = codigoStr.length;
    
    if (tamanho >= 6) {
        // 6+ dígitos: agrupa pelos primeiros 4
        return codigoStr.substring(0, 4);
    } else if (tamanho === 5) {
        // 5 dígitos: agrupa pelos primeiros 2
        return codigoStr.substring(0, 2);
    } else {
        // Menos de 5: usa o código completo
        return codigoStr;
    }
}

// Função de busca avançada (código, nome com fuzzy, marca)
function buscarProdutos(termo) {
    if (!termo || termo.trim() === '') {
        return [...todosProdutos];
    }
    
    termo = termo.toLowerCase().trim();
    
    return todosProdutos.filter(produto => {
        // 1. Busca por código (parcial)
        if (produto.codigo.toString().toLowerCase().includes(termo)) {
            return true;
        }
        
        // 2. Busca por descrição (exata ou parcial)
        if (produto.descricao.toLowerCase().includes(termo)) {
            return true;
        }
        
        // 3. Busca por marca
        const marca = extrairMarca(produto.descricao);
        if (marca.toLowerCase().includes(termo)) {
            return true;
        }
        
        // 4. Busca fuzzy (70% de similaridade)
        const similaridade = calcularSimilaridade(termo, produto.descricao);
        if (similaridade >= 70) {
            return true;
        }
        
        return false;
    });
}

// Função para alternar agrupamento
function alterarAgrupamento(modo) {
    console.log('🔄 Agrupamento solicitado:', modo);
    
    modoAgrupamento = modo;
    
    // Atualizar visual do menu
    const menuItems = document.querySelectorAll('.menu-agrupamento-item');
    menuItems.forEach(item => item.classList.remove('active'));
    
    // Fechar menu
    const menu = document.getElementById('menu-agrupamento');
    const btnAgrupar = document.getElementById('btn-agrupar');
    
    if (menu) menu.style.display = 'none';
    if (btnAgrupar) btnAgrupar.classList.remove('active');
    
    // Resetar para página 1 e renderizar
    paginaAtual = 1;
    renderizarProdutos();
    
    // Toast de feedback
    const labels = {
        'nenhum': 'Sem agrupamento',
        'marca': 'Agrupado por marca',
        'codigo': 'Agrupado por código'
    };
    
    showToast('info', 'Visualização alterada', labels[modo] || 'Modo atualizado');
}

// ==================================================
// MODAL DE BUSCA POR TEXTO
// ==================================================
async function abrirModalBuscaTexto() {
    const modal = document.getElementById('modal-busca-texto');
    const loading = document.getElementById('busca-texto-loading');
    const results = document.getElementById('busca-texto-results');
    const empty = document.getElementById('busca-texto-empty');
    const inputBusca = document.getElementById('busca-texto-input');
    
    // Resetar campo de busca
    inputBusca.value = '';
    
    // Resetar modo de agrupamento
    modoAgrupamento = 'nenhum';
    
    // Abrir modal
    modal.classList.add('active');
    
    // ✅ Setup do botão de agrupamento (precisa executar após modal abrir)
    setTimeout(() => {
        const setupAgrupamento = () => {
            const btnAgrupar = document.getElementById('btn-agrupar');
            const menuAgrupamento = document.getElementById('menu-agrupamento');
            
            if (!btnAgrupar || !menuAgrupamento) return;
            
            btnAgrupar.onclick = function(e) {
                e.stopPropagation();
                const isActive = this.classList.contains('active');
                
                if (isActive) {
                    menuAgrupamento.style.display = 'none';
                    this.classList.remove('active');
                } else {
                    menuAgrupamento.style.display = 'block';
                    this.classList.add('active');
                }
                
                console.log('🔽 Menu agrupamento:', isActive ? 'fechado' : 'aberto');
            };
        };
        setupAgrupamento();
    }, 100);
    
    // ✅ SE JÁ CARREGOU OS PRODUTOS, NÃO PRECISA CARREGAR NOVAMENTE
    if (todosProdutos.length > 0) {
        produtosFiltrados = [...todosProdutos];
        paginaAtual = 1;
        renderizarProdutos();
        loading.style.display = 'none';
        results.style.display = 'block';
        empty.style.display = 'none';
        setTimeout(() => inputBusca.focus(), 100);
        return;
    }
    
    // ✅ PRIMEIRA VEZ: CARREGAR PRODUTOS DA API
    loading.style.display = 'block';
    results.style.display = 'none';
    empty.style.display = 'none';
    
    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error("Erro ao acessar a API");
        
        const dados = await resposta.json();
        todosProdutos = [];
        
        // Processar dados de todas as planilhas (Gabriel, Júlia, Giovana)
        ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
            if (dados[nome]) {
                dados[nome].forEach(item => {
                    if (item.Código && item.Descrição) {
                        todosProdutos.push({
                            codigo: item.Código,
                            descricao: item.Descrição,
                            avista: item["Total à vista"] || "0,00",
                            garantia12: item["Tot. G.E 12"] || ""
                        });
                    }
                });
            }
        });
        
        // Mostrar todos os produtos inicialmente
        produtosFiltrados = [...todosProdutos];
        paginaAtual = 1;
        renderizarProdutos();
        
        loading.style.display = 'none';
        results.style.display = 'block';
        
        // Focar no input de busca
        setTimeout(() => inputBusca.focus(), 100);
        
    } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        loading.style.display = 'none';
        empty.style.display = 'block';
        showToast('error', 'Erro ao carregar', 'Não foi possível carregar os produtos da API.');
    }
}

function fecharModalBuscaTexto() {
    const modal = document.getElementById('modal-busca-texto');
    modal.classList.remove('active');
}

function renderizarProdutos() {
    const tbody = document.getElementById('busca-texto-tbody');
    const paginationDiv = document.getElementById('busca-texto-pagination');
    const results = document.getElementById('busca-texto-results');
    const empty = document.getElementById('busca-texto-empty');
    
    console.log('🎨 Renderizando produtos. Total filtrado:', produtosFiltrados.length);
    console.log('📋 Modo de agrupamento:', modoAgrupamento);
    
    // Se não houver produtos, mostrar mensagem vazia
    if (produtosFiltrados.length === 0) {
        console.log('⚠️ Nenhum produto encontrado');
        results.style.display = 'none';
        empty.style.display = 'block';
        return;
    }
    
    results.style.display = 'block';
    empty.style.display = 'none';
    
    let produtosParaRenderizar = [...produtosFiltrados];
    let htmlProdutos = '';
    
    // ====== APLICAR AGRUPAMENTO ======
    if (modoAgrupamento === 'marca') {
        // Agrupar por marca
        const grupos = {};
        produtosParaRenderizar.forEach(produto => {
            const marca = extrairMarca(produto.descricao);
            if (!grupos[marca]) grupos[marca] = [];
            grupos[marca].push(produto);
        });
        
        // Ordenar marcas alfabeticamente
        const marcasOrdenadas = Object.keys(grupos).sort();
        
        // Renderizar com cabeçalhos de grupo
        marcasOrdenadas.forEach(marca => {
            htmlProdutos += `
                <tr class="group-header-row">
                    <td colspan="4" class="group-header">
                        <i class="fa-solid fa-tag"></i> ${marca} (${grupos[marca].length} produtos)
                    </td>
                </tr>
            `;
            
            grupos[marca].forEach(produto => {
                htmlProdutos += `
                    <tr>
                        <td>${produto.codigo}</td>
                        <td>${produto.descricao}</td>
                        <td>R$ ${produto.avista}</td>
                        <td>
                            <button class="btn-add-product" onclick="adicionarProdutoDaBusca('${produto.codigo}')">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
        
        tbody.innerHTML = htmlProdutos;
        paginationDiv.innerHTML = ''; // Sem paginação quando agrupado
        
    } else if (modoAgrupamento === 'codigo') {
        // Agrupar por código similar
        const grupos = {};
        produtosParaRenderizar.forEach(produto => {
            const prefixo = obterPrefixoCodigo(produto.codigo);
            if (!grupos[prefixo]) grupos[prefixo] = [];
            grupos[prefixo].push(produto);
        });
        
        // Ordenar prefixos
        const prefixosOrdenados = Object.keys(grupos).sort();
        
        // Renderizar com cabeçalhos de grupo
        prefixosOrdenados.forEach(prefixo => {
            htmlProdutos += `
                <tr class="group-header-row">
                    <td colspan="4" class="group-header">
                        <i class="fa-solid fa-barcode"></i> Código ${prefixo}*** (${grupos[prefixo].length} produtos)
                    </td>
                </tr>
            `;
            
            grupos[prefixo].forEach(produto => {
                htmlProdutos += `
                    <tr>
                        <td>${produto.codigo}</td>
                        <td>${produto.descricao}</td>
                        <td>R$ ${produto.avista}</td>
                        <td>
                            <button class="btn-add-product" onclick="adicionarProdutoDaBusca('${produto.codigo}')">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </td>
                    </tr>
                `;
            });
        });
        
        tbody.innerHTML = htmlProdutos;
        paginationDiv.innerHTML = ''; // Sem paginação quando agrupado
        
    } else {
        // ====== SEM AGRUPAMENTO - COM PAGINAÇÃO ======
        const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
        const inicio = (paginaAtual - 1) * itensPorPagina;
        const fim = inicio + itensPorPagina;
        const produtosPagina = produtosFiltrados.slice(inicio, fim);
        
        console.log(`📄 Página ${paginaAtual} de ${totalPaginas} - Mostrando ${produtosPagina.length} produtos`);
        
        // Renderizar produtos
        tbody.innerHTML = produtosPagina.map(produto => `
            <tr>
                <td>${produto.codigo}</td>
                <td>${produto.descricao}</td>
                <td>R$ ${produto.avista}</td>
                <td>
                    <button class="btn-add-product" onclick="adicionarProdutoDaBusca('${produto.codigo}')">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
        // Renderizar paginação
        paginationDiv.innerHTML = '';
        
        if (totalPaginas > 1) {
            // Botão anterior
            const btnPrev = document.createElement('button');
            btnPrev.className = 'pagination-btn';
            btnPrev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
            btnPrev.disabled = paginaAtual === 1;
            btnPrev.onclick = () => {
                if (paginaAtual > 1) {
                    paginaAtual--;
                    renderizarProdutos();
                }
            };
            paginationDiv.appendChild(btnPrev);
            
            // Páginas
            for (let i = 1; i <= totalPaginas; i++) {
                // Mostrar apenas algumas páginas próximas
                if (
                    i === 1 || 
                    i === totalPaginas || 
                    (i >= paginaAtual - 2 && i <= paginaAtual + 2)
                ) {
                    const btnPage = document.createElement('button');
                    btnPage.className = 'pagination-btn' + (i === paginaAtual ? ' active' : '');
                    btnPage.textContent = i;
                    btnPage.onclick = () => {
                        paginaAtual = i;
                        renderizarProdutos();
                    };
                    paginationDiv.appendChild(btnPage);
                } else if (i === paginaAtual - 3 || i === paginaAtual + 3) {
                    const ellipsis = document.createElement('span');
                    ellipsis.className = 'pagination-info';
                    ellipsis.textContent = '...';
                    paginationDiv.appendChild(ellipsis);
                }
            }
            
            // Botão próximo
            const btnNext = document.createElement('button');
            btnNext.className = 'pagination-btn';
            btnNext.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
            btnNext.disabled = paginaAtual === totalPaginas;
            btnNext.onclick = () => {
                if (paginaAtual < totalPaginas) {
                    paginaAtual++;
                    renderizarProdutos();
                }
            };
            paginationDiv.appendChild(btnNext);
            
            // Info de paginação
            const info = document.createElement('span');
            info.className = 'pagination-info';
            info.textContent = `${inicio + 1}-${Math.min(fim, produtosFiltrados.length)} de ${produtosFiltrados.length}`;
            paginationDiv.appendChild(info);
        }
    }
}

function adicionarProdutoDaBusca(codigo) {
    // Buscar o produto nos dados já carregados
    const produto = todosProdutos.find(p => p.codigo.toString() === codigo.toString());
    
    if (!produto) {
        showToast('error', 'Produto não encontrado', 'Não foi possível carregar os dados do produto.');
        return;
    }
    
    // Fechar modal
    fecharModalBuscaTexto();
    
    // Preencher campos diretamente com os dados já carregados
    const partes = (produto.descricao || "").split(" - ");
    document.getElementById("codigo").value = produto.codigo;
    document.getElementById("descricao").value = (partes[0] || "").trim();
    document.getElementById("subdescricao").value = (partes[1] || "").trim();
    
    // Preencher valor à vista
    const avistaValor = parseCurrency(produto.avista);
    document.getElementById("avista").value = formatCurrency(avistaValor.toFixed(2));
    
    // Preencher garantia se houver
    if (produto.garantia12) {
        document.getElementById("garantia12").value = formatCurrency(parseCurrency(produto.garantia12).toFixed(2));
    }
    
    // Mostrar toast de sucesso
    showToast('success', 'Produto carregado', `Código ${codigo} preenchido com sucesso!`);
}

// ==================================================
// INICIALIZAÇÃO
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateHeader('gerar');
    
    // Botão Debug
    const btnDebug = document.getElementById('btn-debug');
    if (btnDebug) {
        btnDebug.addEventListener('click', gerarCartazesDebug);
    }
    
    // ✅ Event listener para busca em tempo real no modal
    const inputBusca = document.getElementById('busca-texto-input');
    if (inputBusca) {
        inputBusca.addEventListener('input', (e) => {
            const termo = e.target.value.trim();
            
            console.log('🔍 Buscando por:', termo);
            console.log('📦 Total de produtos:', todosProdutos.length);
            
            // Usar função de busca avançada
            produtosFiltrados = buscarProdutos(termo);
            
            console.log('✅ Produtos filtrados:', produtosFiltrados.length);
            
            paginaAtual = 1;
            modoAgrupamento = 'nenhum'; // Resetar agrupamento ao buscar
            renderizarProdutos();
        });
    }
    
    // ✅ Toggle do menu de agrupamento
    const setupAgrupamentoButton = () => {
        const btnAgrupar = document.getElementById('btn-agrupar');
        const menuAgrupamento = document.getElementById('menu-agrupamento');
        
        if (!btnAgrupar || !menuAgrupamento) return;
        
        // Remover listeners antigos (se existir)
        btnAgrupar.onclick = null;
        
        // Adicionar novo listener
        btnAgrupar.onclick = function(e) {
            e.stopPropagation();
            const isActive = this.classList.contains('active');
            
            if (isActive) {
                menuAgrupamento.style.display = 'none';
                this.classList.remove('active');
            } else {
                menuAgrupamento.style.display = 'block';
                this.classList.add('active');
            }
            
            console.log('🔽 Menu agrupamento:', isActive ? 'fechado' : 'aberto');
        };
        
        // Fechar ao clicar fora
        document.addEventListener('click', function(e) {
            if (!menuAgrupamento || !btnAgrupar) return;
            
            const clickedInsideMenu = e.target.closest('#menu-agrupamento');
            const clickedButton = e.target.closest('#btn-agrupar');
            
            if (!clickedInsideMenu && !clickedButton && menuAgrupamento.style.display === 'block') {
                menuAgrupamento.style.display = 'none';
                btnAgrupar.classList.remove('active');
            }
        });
    };
    
    // Executar setup quando o modal abrir
    setupAgrupamentoButton();
    
    // ✅ Fechar modal de busca ao clicar fora
    const modalBusca = document.getElementById('modal-busca-texto');
    if (modalBusca) {
        modalBusca.addEventListener('click', (e) => {
            if (e.target.id === 'modal-busca-texto') {
                fecharModalBuscaTexto();
            }
        });
    }
    
    // ✅ Fechar modal de fator ao clicar fora
    const modalFator = document.getElementById('modal-fator');
    if (modalFator) {
        modalFator.addEventListener('click', (e) => {
            if (e.target.id === 'modal-fator') {
                fecharModalFator();
            }
        });
    }
});

// ==================================================
// FUNÇÃO DEBUG - GERA CARTAZES DE TESTE
// ==================================================
function gerarCartazesDebug() {
    // ✅ VALIDAÇÃO DE PERMISSÃO - Apenas admin e suporte podem acessar
    try {
        const authSession = localStorage.getItem('authSession');
        if (!authSession) {
            showToast('error', 'Acesso Negado', 'Esta área é apenas disponível para o desenvolvedor');
            return;
        }
        
        const sessionData = JSON.parse(authSession);
        const userPerm = sessionData.perm || '';
        
        // Permite apenas 'admin' e 'suporte'
        if (userPerm !== 'admin' && userPerm !== 'suporte') {
            showToast('error', 'Acesso Negado', 'Esta área é apenas disponível para o desenvolvedor');
            return;
        }
    } catch (error) {
        console.error('Erro ao validar permissão:', error);
        showToast('error', 'Acesso Negado', 'Esta área é apenas disponível para o desenvolvedor');
        return;
    }
    
    // Produtos fantasia
    const produtosFantasia = [
        {
            descricao: 'Sofá Retrátil 3 Lugares',
            subdescricao: 'Tecido Suede Premium',
            caracteristicas: 'Conforto | Design Moderno | Garantia 2 Anos',
            codigo: 'SF-2024-001',
            avista: 2499.90
        },
        {
            descricao: 'Guarda-Roupa Casal 6 Portas',
            subdescricao: 'Com Espelho e Gavetas',
            caracteristicas: 'MDF | Acabamento Fosco | 3 Gavetas',
            codigo: 'GR-2024-042',
            avista: 1899.90
        },
        {
            descricao: 'Conjunto de Jantar Elegance',
            subdescricao: 'Mesa + 6 Cadeiras Estofadas',
            caracteristicas: 'Madeira Maciça | Estilo Clássico | Alta Durabilidade',
            codigo: 'CJ-2024-015',
            avista: 3299.90
        }
    ];
    
    // Escolhe um produto aleatório
    const produtoAleatorio = produtosFantasia[Math.floor(Math.random() * produtosFantasia.length)];
    
    // Mostra overlay de loading
    const overlay = document.getElementById('overlay');
    const overlayTexto = document.getElementById('overlay-texto');
    overlay.classList.add('active');
    overlayTexto.textContent = 'Gerando cartazes de debug...';
    
    // Simula preenchimento dos campos e geração
    setTimeout(() => {
        // Gera data de validade (15 dias a partir de hoje)
        const dataValidade = new Date();
        dataValidade.setDate(dataValidade.getDate() + 15);
        const validadeFormatada = dataValidade.toISOString().split('T')[0];
        
        // Gera 2 produtos: um com carnê e outro com cartão
        const modalidades = ['carne', 'cartao'];
        
        modalidades.forEach((modalidade, index) => {
            const metodoExibicao = modalidade === 'carne' ? 'Carnê' : 'Cartão';
            const numParcelas = 12;
            const fator = FATORES[modalidade][numParcelas];
            const valorParcela = produtoAleatorio.avista * fator;
            
            // ✅ GERA PRODUTO NO FORMATO COMPLETO (igual ao normal)
            const produtoDebug = {
                id: Date.now() + index, // ID único
                codigo: produtoAleatorio.codigo,
                descricao: produtoAleatorio.descricao,
                subdescricao: produtoAleatorio.subdescricao,
                caracteristicas: produtoAleatorio.caracteristicas,
                features: produtoAleatorio.caracteristicas.split(' | '), // Array de características
                avista: produtoAleatorio.avista,
                modalidade: modalidade,
                metodo: `${numParcelas}x`,
                parcela: valorParcela,
                taxa: modalidade === 'carne' ? '3.90% a.m.' : '2.50% a.m.',
                tipoModalidade: metodoExibicao,
                validade: validadeFormatada,
                juros: modalidade, // Tipo de juros (carne/cartao)
                motivo: '', // Campos extras vazios
                autorizacao: '',
                garantia12: '',
                garantia24: '',
                garantia36: ''
            };
            
            products.push(produtoDebug);
        });
        
        // Atualiza a interface
        renderProducts();
        
        // Esconde overlay
        overlay.classList.remove('active');
        
        // Mostra toast de sucesso
        showToast('success', 'Debug Executado!', `2 cartazes de teste gerados com sucesso (Carnê e Cartão)`);
        
        // Muda para a view de produtos
        const navProdutos = document.querySelector('[data-view="produtos"]');
        if (navProdutos) {
            navProdutos.click();
        }
    }, 1500);
}

// ==================================================
// SISTEMA DE TOASTS
// ==================================================
function showToast(type = 'info', title, message, duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    // Ícones diferentes por tipo
    const icons = {
        success: '<i class="fa-solid fa-circle-check"></i>',
        error: '<i class="fa-solid fa-circle-xmark"></i>',
        warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
        info: '<i class="fa-solid fa-circle-info"></i>'
    };
    
    toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;
    
    container.appendChild(toast);
    
    if (duration > 0) {
        setTimeout(() => {
            toast.classList.add('removing');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    }
    
    return toast;
}

function showUndoToast(title, message, onUndo, duration = 6000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast undo';
    
    let undoClicked = false;
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid fa-rotate-left"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ''}
            <div class="toast-actions">
                <button class="toast-action-btn primary" data-action="undo">Desfazer</button>
                <button class="toast-action-btn secondary" data-action="dismiss">Dispensar</button>
            </div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Handlers para os botões
    toast.querySelector('[data-action="undo"]').addEventListener('click', () => {
        undoClicked = true;
        onUndo();
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
    
    toast.querySelector('[data-action="dismiss"]').addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
    
    // Auto-remover após duration
    if (duration > 0) {
        setTimeout(() => {
            if (!undoClicked) {
                toast.classList.add('removing');
                setTimeout(() => toast.remove(), 300);
            }
        }, duration);
    }
    
    return toast;
}

function showSearchToast(descricao) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast warning';
    
    toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="toast-content">
            <div class="toast-title">Características obrigatórias</div>
            <div class="toast-message">Adicione pelo menos uma característica para o produto <strong>${descricao}</strong>. Deseja buscar na internet mais informações do produto?</div>
            <div class="toast-actions">
                <button class="toast-action-btn primary" data-action="search"><i class="fa-solid fa-globe"></i> Buscar aqui</button>
                <button class="toast-action-btn secondary" data-action="dismiss">Dispensar</button>
            </div>
        </div>
    `;
    
    container.appendChild(toast);
    
    // Handlers para os botões
    toast.querySelector('[data-action="search"]').addEventListener('click', () => {
        const searchQuery = `${descricao} características`;
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
        const newWindow = window.open(searchUrl, '_blank');
        
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
            // Popup foi bloqueado
            showToast('warning', 'Popups bloqueados', 'Por favor, ative os popups no seu navegador para abrir a busca do Google.');
        }
        
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
    
    toast.querySelector('[data-action="dismiss"]').addEventListener('click', () => {
        toast.classList.add('removing');
        setTimeout(() => toast.remove(), 300);
    });
    
    return toast;
}

// ==================================================
// SISTEMA DE CONFIRMAÇÃO
// ==================================================
function showConfirm(options) {
    const {
        title = 'Confirmar ação',
        subtitle = 'Esta ação não pode ser desfeita',
        message = 'Tem certeza que deseja continuar?',
        confirmText = 'Confirmar',
        cancelText = 'Cancelar',
        iconType = 'danger',
        onConfirm = () => {},
        onCancel = () => {}
    } = options;
    
    const overlay = document.getElementById('confirm-overlay');
    const iconEl = document.getElementById('confirm-icon');
    const titleEl = document.getElementById('confirm-title');
    const subtitleEl = document.getElementById('confirm-subtitle');
    const messageEl = document.getElementById('confirm-message');
    const confirmBtn = document.getElementById('confirm-confirm-btn');
    const cancelBtn = document.getElementById('confirm-cancel-btn');
    
    // Configurar conteúdo
    titleEl.textContent = title;
    subtitleEl.textContent = subtitle;
    messageEl.textContent = message;
    confirmBtn.textContent = confirmText;
    cancelBtn.textContent = cancelText;
    
    // Configurar ícone
    iconEl.className = `confirm-icon ${iconType}`;
    const icons = {
        danger: '<i class="fa-solid fa-triangle-exclamation"></i>',
        warning: '<i class="fa-solid fa-exclamation"></i>',
        info: '<i class="fa-solid fa-circle-info"></i>'
    };
    iconEl.innerHTML = icons[iconType] || icons.danger;
    
    // Mostrar overlay
    overlay.classList.add('active');
    
    // Handlers
    function handleConfirm() {
        overlay.classList.remove('active');
        onConfirm();
        cleanup();
    }
    
    function handleCancel() {
        overlay.classList.remove('active');
        onCancel();
        cleanup();
    }
    
    function cleanup() {
        confirmBtn.removeEventListener('click', handleConfirm);
        cancelBtn.removeEventListener('click', handleCancel);
        overlay.removeEventListener('click', handleOutsideClick);
    }
    
    function handleOutsideClick(e) {
        if (e.target === overlay) {
            handleCancel();
        }
    }
    
    confirmBtn.addEventListener('click', handleConfirm);
    cancelBtn.addEventListener('click', handleCancel);
    overlay.addEventListener('click', handleOutsideClick);
}

// ==================================================
// SIDEBAR: TOGGLE EXTRAS E BOTÃO HOME
// ==================================================
const toggleExtras = document.getElementById('toggle-extras');
const extrasContent = document.getElementById('extras-content');
const btnHome = document.getElementById('btn-home');

toggleExtras.addEventListener('click', () => {
    toggleExtras.classList.toggle('active');
    extrasContent.classList.toggle('active');
});

btnHome.addEventListener('click', () => {
    const isHomeActive = navButtons[0].classList.contains('active');

    if (isHomeActive) {
        window.location.href = 'selectsetor.html';
    } else {
        navButtons[0].click();
        showToast(
            'info',
            'Início',
            'Você voltou para o formulário inicial'
        );
    }
});

// ==================================================
// CAMPOS OBRIGATÓRIOS (Destaque por 5 segundos)
// ==================================================
const btnCamposObrigatorios = document.getElementById('btn-campos-obrigatorios');

btnCamposObrigatorios.addEventListener('click', () => {
    // Descobrir qual view está ativa
    const activeView = document.querySelector('.view.active');
    let requiredFields = [];
    let formularioNome = '';
    
    if (activeView && activeView.id === 'view-gerar') {
        // Formulário principal
        requiredFields = ['codigo', 'descricao', 'metodo', 'juros', 'avista', 'feature-1', 'feature-2', 'feature-3'];
        formularioNome = 'Formulário Principal';
    } else if (activeView && activeView.id === 'view-cama-box') {
        // Cama Box
        requiredFields = ['codigo-base', 'codigo-colchao', 'descricao-cb', 'metodo-cb', 'juros-cb', 'avista-cb', 'feature-cb-1', 'feature-cb-2', 'feature-cb-3'];
        formularioNome = 'Cama Box';
    } else if (activeView && activeView.id === 'view-mesa-cadeiras') {
        // Mesa e Cadeiras
        requiredFields = ['codigo-mesa', 'codigo-cadeira', 'qtd-cadeiras', 'descricao-mc', 'metodo-mc', 'juros-mc', 'avista-mc', 'feature-mc-1', 'feature-mc-2', 'feature-mc-3'];
        formularioNome = 'Mesa e Cadeiras';
    } else if (activeView && activeView.id === 'view-cama-mesa-banho') {
        // Cama, Mesa e Banho: apenas parcela, à vista, um código e uma descrição
        requiredFields = ['codigo-cmb', 'descricao-cmb', 'metodo-cmb', 'parcela-cmb', 'avista-cmb'];
        formularioNome = 'Cama, Mesa e Banho';
    }
    
    if (requiredFields.length > 0) {
        requiredFields.forEach(id => {
            const field = document.getElementById(id);
            if (field) {
                field.classList.add('field-required-highlight');
                setTimeout(() => {
                    field.classList.remove('field-required-highlight');
                }, 5000);
            }
        });
        
        showToast('info', `Campos obrigatórios: ${formularioNome}`, 'Os campos obrigatórios (incluindo características) foram destacados por 5 segundos.');
    } else {
        showToast('warning', 'Nenhum formulário ativo', 'Navegue até um formulário para ver os campos obrigatórios.');
    }
});

// ==================================================
// FORMULÁRIO: CAMA BOX
// ==================================================
const formCamaBox = document.getElementById('cama-box-form');
let produtoBase = null;
let produtoColchao = null;

// Botões individuais removidos - agora usa botão unificado

// Botão unificado de busca Cama Box
document.getElementById('btn-buscar-cama-box').addEventListener('click', async () => {
    const codigoBase = document.getElementById('codigo-base').value.trim();
    const codigoColchao = document.getElementById('codigo-colchao').value.trim();
    
    if (!codigoBase || !codigoColchao) {
        showToast('warning', 'Códigos obrigatórios', 'Preencha ambos os códigos (base e colchão) antes de buscar.');
        return;
    }
    
    mostrarOverlay();
    atualizarOverlayTexto('🔍 Buscando base e colchão...');
    
    try {
        const resposta = await fetch(API_URL);
        const dados = await resposta.json();
        
        // Buscar base
        let baseEncontrada = false;
        ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
            if (dados[nome]) {
                dados[nome].forEach(item => {
                    if (item.Código == codigoBase) {
                        baseEncontrada = true;
                        produtoBase = item;
                    }
                });
            }
        });
        
        // Buscar colchão
        let colchaoEncontrado = false;
        ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
            if (dados[nome]) {
                dados[nome].forEach(item => {
                    if (item.Código == codigoColchao) {
                        colchaoEncontrado = true;
                        produtoColchao = item;
                    }
                });
            }
        });
        
        if (baseEncontrada && colchaoEncontrado) {
            showToast('success', 'Produtos encontrados!', 'Base e colchão encontrados no banco de dados.');
            atualizarCamaBoxDescricao();
            atualizarCamaBoxValor();
        } else if (!baseEncontrada && !colchaoEncontrado) {
            showToast('error', 'Produtos não encontrados', 'Base e colchão não encontrados no banco de dados.');
            produtoBase = null;
            produtoColchao = null;
        } else if (!baseEncontrada) {
            showToast('warning', 'Base não encontrada', 'A base não foi encontrada no banco de dados.');
            produtoBase = null;
        } else {
            showToast('warning', 'Colchão não encontrado', 'O colchão não foi encontrado no banco de dados.');
            produtoColchao = null;
        }
    } catch (e) {
        showToast('error', 'Erro', 'Erro ao buscar produtos.');
        produtoBase = null;
        produtoColchao = null;
    } finally {
        esconderOverlay();
    }
});

function atualizarCamaBoxDescricao() {
    if (produtoBase && produtoColchao) {
        const desc1 = (produtoBase.Descrição || "").split(" - ")[0].trim();
        const desc2 = (produtoColchao.Descrição || "").split(" - ")[0].trim();
        document.getElementById('descricao-cb').value = `${desc1} + ${desc2}`;
        
        // Marca (subdescricao) - pega da base
        const marca = (produtoBase.Descrição || "").split(" - ")[1] || "";
        document.getElementById('subdescricao-cb').value = marca.trim();
    } else if (produtoBase) {
        const desc = (produtoBase.Descrição || "").split(" - ")[0].trim();
        document.getElementById('descricao-cb').value = desc;
    } else if (produtoColchao) {
        const desc = (produtoColchao.Descrição || "").split(" - ")[0].trim();
        document.getElementById('descricao-cb').value = desc;
    }
}

function atualizarCamaBoxValor() {
    if (produtoBase && produtoColchao) {
        const valorBase = parseCurrency(produtoBase["Total à vista"]);
        const valorColchao = parseCurrency(produtoColchao["Total à vista"]);
        const total = valorBase + valorColchao;
        document.getElementById('avista-cb').value = formatCurrency(total.toFixed(2));
    } else if (produtoBase) {
        const valor = parseCurrency(produtoBase["Total à vista"]);
        document.getElementById('avista-cb').value = formatCurrency(valor.toFixed(2));
        showToast('warning', 'Falta o colchão', 'Busque também o código do colchão para somar os valores.');
    } else if (produtoColchao) {
        const valor = parseCurrency(produtoColchao["Total à vista"]);
        document.getElementById('avista-cb').value = formatCurrency(valor.toFixed(2));
        showToast('warning', 'Falta a base', 'Busque também o código da base para somar os valores.');
    }
}

// Aplicar máscaras de moeda
document.getElementById('avista-cb').addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
    recalcularParcelaCamaBox(); // Cálculo automático
});
document.getElementById('parcela-cb').addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
});

// Cálculo automático de parcela para Cama Box
function recalcularParcelaCamaBox() {
    const metodo = document.getElementById('metodo-cb').value;
    const juros = document.getElementById('juros-cb').value;
    const avistaInput = document.getElementById('avista-cb');
    const parcelaInput = document.getElementById('parcela-cb');

    parcelaInput.removeAttribute('readonly');

    if (metodo !== '12x' || !juros || juros === '') return;

    const avista = parseCurrency(avistaInput.value);
    if (avista === 0) return;

    const numParcelas = 12;
    let parcela = 0;

    const tipoTaxa = (juros === 'carne') ? 'carne' : 'cartao';
    
    if (FATORES[tipoTaxa] && FATORES[tipoTaxa][numParcelas]) {
        const fator = FATORES[tipoTaxa][numParcelas];
        parcela = avista * fator;
        parcela = arredondar90(parcela);
    }

    parcelaInput.value = parcela ? formatCurrency(parcela.toFixed(2)) : '';
}

document.getElementById('metodo-cb').addEventListener('change', recalcularParcelaCamaBox);
document.getElementById('juros-cb').addEventListener('change', recalcularParcelaCamaBox);

// Submit Cama Box
formCamaBox.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const codigoBase = document.getElementById('codigo-base').value.trim();
    const codigoColchao = document.getElementById('codigo-colchao').value.trim();
    const descricao = document.getElementById('descricao-cb').value.trim().toUpperCase();
    const subdescricao = document.getElementById('subdescricao-cb').value.trim().toUpperCase();
    const feature1 = document.getElementById('feature-cb-1').value.trim();
    const feature2 = document.getElementById('feature-cb-2').value.trim();
    const feature3 = document.getElementById('feature-cb-3').value.trim();
    const metodo = document.getElementById('metodo-cb').value;
    const juros = document.getElementById('juros-cb').value;
    const avista = parseCurrency(document.getElementById('avista-cb').value);
    const parcela = parseCurrency(document.getElementById('parcela-cb').value);
    
    const features = [feature1, feature2, feature3].filter(f => f !== '');
    
    if (!codigoBase || !codigoColchao) {
        showToast('warning', 'Códigos obrigatórios', 'Preencha os códigos da base e do colchão!');
        return;
    }
    
    if (!descricao || !metodo || !juros || avista <= 0 || parcela <= 0) {
        showToast('warning', 'Campos obrigatórios', 'Preencha todos os campos obrigatórios!');
        return;
    }
    
    if (features.length === 0) {
        showSearchToast(descricao);
        return;
    }
    
    const product = {
        id: Date.now(),
        codigo: `${codigoBase}+${codigoColchao}`,
        descricao,
        subdescricao,
        features,
        metodo,
        juros,
        avista,
        parcela,
        motivo: '',
        validade: '',
        autorizacao: '',
        garantia12: 0,
        garantia24: 0,
        garantia36: 0
    };
    
    products.push(product);
    renderProducts();
    showToast('success', 'Cama Box adicionada!', 'Produto adicionado com sucesso.');
    
    formCamaBox.reset();
    produtoBase = null;
    produtoColchao = null;
    
    navButtons[1].click();
});

// ==================================================
// FORMULÁRIO: MESA E CADEIRAS
// ==================================================
const formMesaCadeiras = document.getElementById('mesa-cadeiras-form');
let produtoMesa = null;
let produtoCadeira = null;

// Botão unificado de busca Mesa e Cadeiras
document.getElementById('btn-buscar-mesa-cadeiras').addEventListener('click', async () => {
    const codigoMesa = document.getElementById('codigo-mesa').value.trim();
    const codigoCadeira = document.getElementById('codigo-cadeira').value.trim();
    
    if (!codigoMesa || !codigoCadeira) {
        showToast('warning', 'Códigos obrigatórios', 'Preencha ambos os códigos (mesa e cadeira) antes de buscar.');
        return;
    }
    
    mostrarOverlay();
    atualizarOverlayTexto('🔍 Buscando mesa e cadeiras...');
    
    try {
        const resposta = await fetch(API_URL);
        const dados = await resposta.json();
        
        // Buscar mesa
        let mesaEncontrada = false;
        ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
            if (dados[nome]) {
                dados[nome].forEach(item => {
                    if (item.Código == codigoMesa) {
                        mesaEncontrada = true;
                        produtoMesa = item;
                    }
                });
            }
        });
        
        // Buscar cadeira
        let cadeiraEncontrada = false;
        ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
            if (dados[nome]) {
                dados[nome].forEach(item => {
                    if (item.Código == codigoCadeira) {
                        cadeiraEncontrada = true;
                        produtoCadeira = item;
                    }
                });
            }
        });
        
        if (mesaEncontrada && cadeiraEncontrada) {
            showToast('success', 'Produtos encontrados!', 'Mesa e cadeiras encontradas no banco de dados.');
            atualizarMesaCadeirasDescricao();
            atualizarMesaCadeirasValor();
        } else if (!mesaEncontrada && !cadeiraEncontrada) {
            showToast('error', 'Produtos não encontrados', 'Mesa e cadeiras não encontradas no banco de dados.');
            produtoMesa = null;
            produtoCadeira = null;
        } else if (!mesaEncontrada) {
            showToast('warning', 'Mesa não encontrada', 'A mesa não foi encontrada no banco de dados.');
            produtoMesa = null;
        } else {
            showToast('warning', 'Cadeira não encontrada', 'A cadeira não foi encontrada no banco de dados.');
            produtoCadeira = null;
        }
    } catch (e) {
        showToast('error', 'Erro', 'Erro ao buscar produtos.');
        produtoMesa = null;
        produtoCadeira = null;
    } finally {
        esconderOverlay();
    }
});

// Atualizar quando mudar quantidade
document.getElementById('qtd-cadeiras').addEventListener('change', () => {
    atualizarMesaCadeirasValor();
});

function atualizarMesaCadeirasDescricao() {
    if (produtoMesa && produtoCadeira) {
        const descMesa = (produtoMesa.Descrição || "").split(" - ")[0].trim();
        const descCadeira = (produtoCadeira.Descrição || "").split(" - ")[0].trim();
        document.getElementById('descricao-mc').value = `${descMesa} + ${descCadeira}`;
        
        const marca = (produtoMesa.Descrição || "").split(" - ")[1] || "";
        document.getElementById('subdescricao-mc').value = marca.trim();
    }
}

function atualizarMesaCadeirasValor() {
    const qtdSelect = document.getElementById('qtd-cadeiras');
    const qtd = parseInt(qtdSelect.value) || 0;
    
    if (produtoMesa && produtoCadeira && qtd > 0) {
        const valorMesa = parseCurrency(produtoMesa["Total à vista"]);
        const valorCadeira = parseCurrency(produtoCadeira["Total à vista"]);
        const total = valorMesa + (valorCadeira * qtd);
        document.getElementById('avista-mc').value = formatCurrency(total.toFixed(2));
    } else if (produtoMesa && !produtoCadeira) {
        showToast('warning', 'Falta a cadeira', 'Busque também o código da cadeira.');
    } else if (!produtoMesa && produtoCadeira) {
        showToast('warning', 'Falta a mesa', 'Busque também o código da mesa.');
    } else if (produtoMesa && produtoCadeira && qtd === 0) {
        showToast('warning', 'Quantidade obrigatória', 'Selecione a quantidade de cadeiras.');
    }
}

// Máscaras de moeda
document.getElementById('avista-mc').addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
    recalcularParcelaMesaCadeiras(); // Cálculo automático
});
document.getElementById('parcela-mc').addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
});

// Cálculo automático de parcela para Mesa e Cadeiras
function recalcularParcelaMesaCadeiras() {
    const metodo = document.getElementById('metodo-mc').value;
    const juros = document.getElementById('juros-mc').value;
    const avistaInput = document.getElementById('avista-mc');
    const parcelaInput = document.getElementById('parcela-mc');

    parcelaInput.removeAttribute('readonly');

    if (metodo !== '12x' || !juros || juros === '') return;

    const avista = parseCurrency(avistaInput.value);
    if (avista === 0) return;

    const numParcelas = 12;
    let parcela = 0;

    const tipoTaxa = (juros === 'carne') ? 'carne' : 'cartao';
    
    if (FATORES[tipoTaxa] && FATORES[tipoTaxa][numParcelas]) {
        const fator = FATORES[tipoTaxa][numParcelas];
        parcela = avista * fator;
        parcela = arredondar90(parcela);
    }

    parcelaInput.value = parcela ? formatCurrency(parcela.toFixed(2)) : '';
}

document.getElementById('metodo-mc').addEventListener('change', recalcularParcelaMesaCadeiras);
document.getElementById('juros-mc').addEventListener('change', recalcularParcelaMesaCadeiras);

// Submit Mesa e Cadeiras
formMesaCadeiras.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const codigoMesa = document.getElementById('codigo-mesa').value.trim();
    const codigoCadeira = document.getElementById('codigo-cadeira').value.trim();
    const qtd = parseInt(document.getElementById('qtd-cadeiras').value) || 0;
    const descricao = document.getElementById('descricao-mc').value.trim().toUpperCase();
    const subdescricao = document.getElementById('subdescricao-mc').value.trim().toUpperCase();
    const feature1 = document.getElementById('feature-mc-1').value.trim();
    const feature2 = document.getElementById('feature-mc-2').value.trim();
    const feature3 = document.getElementById('feature-mc-3').value.trim();
    const metodo = document.getElementById('metodo-mc').value;
    const juros = document.getElementById('juros-mc').value;
    const avista = parseCurrency(document.getElementById('avista-mc').value);
    const parcela = parseCurrency(document.getElementById('parcela-mc').value);
    
    const features = [feature1, feature2, feature3].filter(f => f !== '');
    features.push(`${qtd} cadeiras`); // Adiciona quantidade como característica
    
    if (!codigoMesa || !codigoCadeira || qtd === 0) {
        showToast('warning', 'Campos obrigatórios', 'Preencha os códigos e a quantidade de cadeiras!');
        return;
    }
    
    if (!descricao || !metodo || !juros || avista <= 0 || parcela <= 0) {
        showToast('warning', 'Campos obrigatórios', 'Preencha todos os campos obrigatórios!');
        return;
    }
    
    const product = {
        id: Date.now(),
        codigo: `${codigoMesa}+${codigoCadeira}`,
        descricao,
        subdescricao,
        features,
        metodo,
        juros,
        avista,
        parcela,
        motivo: '',
        validade: '',
        autorizacao: '',
        garantia12: 0,
        garantia24: 0,
        garantia36: 0
    };
    
    products.push(product);
    renderProducts();
    showToast('success', 'Mesa e cadeiras adicionadas!', 'Produto adicionado com sucesso.');
    
    formMesaCadeiras.reset();
    produtoMesa = null;
    produtoCadeira = null;
    
    navButtons[1].click();
});

// ==================================================
// FORMULÁRIO: CAMA, MESA E BANHO
// ==================================================
const formCamaMesaBanho = document.getElementById('cama-mesa-banho-form');

// Expansão automática do textarea
const textareaCodigos = document.getElementById('codigos-cmb');
textareaCodigos.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
});

// Máscaras de moeda
document.getElementById('avista-cmb').addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
});
document.getElementById('parcela-cmb').addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
});

// Submit Cama, Mesa e Banho
formCamaMesaBanho.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const codigo = document.getElementById('codigo-cmb').value.trim();
    const descricao = document.getElementById('descricao-cmb').value.trim().toUpperCase();
    const subdescricao = document.getElementById('subdescricao-cmb').value.trim().toUpperCase();
    const feature1 = document.getElementById('feature-cmb-1').value.trim();
    const feature2 = document.getElementById('feature-cmb-2').value.trim();
    const feature3 = document.getElementById('feature-cmb-3').value.trim();
    const metodo = document.getElementById('metodo-cmb').value;
    const juros = document.getElementById('juros-cmb').value;
    const avista = parseCurrency(document.getElementById('avista-cmb').value);
    const parcela = parseCurrency(document.getElementById('parcela-cmb').value);
    
    const features = [feature1, feature2, feature3].filter(f => f !== '');
    
    if (!codigo || !descricao) {
        showToast('warning', 'Campos obrigatórios', 'Preencha código e descrição!');
        return;
    }
    
    if (!metodo || !juros) {
        showToast('warning', 'Campos obrigatórios', 'Selecione parcelamento e taxa de juros!');
        return;
    }
    
    if (avista <= 0 || parcela <= 0) {
        showToast('warning', 'Valores obrigatórios', 'Informe os valores à vista e da parcela!');
        return;
    }
    
    if (features.length === 0) {
        showSearchToast(descricao);
        return;
    }
    
    const product = {
        id: Date.now(),
        codigo,
        descricao,
        subdescricao,
        features,
        metodo,
        juros,
        avista,
        parcela,
        motivo: '',
        validade: '',
        autorizacao: '',
        garantia12: 0,
        garantia24: 0,
        garantia36: 0
    };
    
    products.push(product);
    renderProducts();
    showToast('success', 'Combo adicionado!', 'Produto adicionado com sucesso.');
    
    formCamaMesaBanho.reset();
    textareaCodigos.style.height = 'auto';
    
    navButtons[1].click();
});