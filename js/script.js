// ==================================================
// CONFIGURAÇÕES E VARIÁVEIS GLOBAIS
// ==================================================
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

let products = [];

// ==================================================
// NAVEGAÇÃO
// ==================================================
const navButtons = document.querySelectorAll('.nav-item');
const views = {
    gerar: document.getElementById('view-gerar'),
    produtos: document.getElementById('view-produtos'),
    calculadora: document.getElementById('view-calculadora')
};

navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const viewName = btn.dataset.view;
        
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
        
        updateHeaderSubtitle(viewName);
    });
});

function updateHeaderSubtitle(viewName) {
    const subtitle = document.getElementById('header-subtitle');
    const subtitles = {
        gerar: 'Preencha os dados do produto para criar o cartaz',
        produtos: `${products.length} produto(s) adicionado(s)`,
        calculadora: 'Calcule o valor das parcelas com base no fator de multiplicação'
    };
    subtitle.textContent = subtitles[viewName] || 'Bem-vindo ao sistema';
}

// ==================================================
// OVERLAY DE LOADING
// ==================================================
function mostrarOverlay() {
    document.getElementById("overlay").classList.add("active");
}

function esconderOverlay() {
    document.getElementById("overlay").classList.remove("active");
}

function atualizarOverlayTexto(msg) {
    const textoEl = document.getElementById("overlay-texto");
    if (textoEl) textoEl.textContent = msg;
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
    if (!codigo) {
        alert('Digite um código para buscar');
        return;
    }

    mostrarOverlay();
    atualizarOverlayTexto("🔍 Buscando produto...");

    try {
        const resposta = await fetch(API_URL);
        if (!resposta.ok) throw new Error("Erro ao acessar a API");
        
        const dados = await resposta.json();
        let encontrado = false;
        let primeiroItem = null;

        ["Gabriel", "Júlia", "Giovana"].forEach(nome => {
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
            const partes = (primeiroItem.Descrição || "").split(" - ");
            document.getElementById("descricao").value = (partes[0] || "").trim();
            // Marca vai para subdescricao automaticamente
            document.getElementById("subdescricao").value = (partes[1] || "").trim();

            const avistaValor = parseCurrency(primeiroItem["Total à vista"]);
            document.getElementById("avista").value = formatCurrency(avistaValor.toFixed(2));

            if (primeiroItem["Tot. G.E 12"]) {
                document.getElementById("garantia12").value = formatCurrency(parseCurrency(primeiroItem["Tot. G.E 12"]).toFixed(2));
            }

            atualizarOverlayTexto("✅ Produto encontrado!");
            await new Promise(res => setTimeout(res, 1000));
        } else {
            atualizarOverlayTexto("❌ Produto não encontrado");
            alert('Produto não encontrado. Preencha manualmente.');
            await new Promise(res => setTimeout(res, 1500));
        }
    } catch (e) {
        console.error(e);
        atualizarOverlayTexto("⚠️ Erro ao buscar dados");
        await new Promise(res => setTimeout(res, 1500));
    } finally {
        esconderOverlay();
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

// Cálculo automático de parcela APENAS para 12x
function recalcularParcela() {
    const metodo = document.getElementById('metodo').value;
    const juros = document.getElementById('juros').value;
    const avistaInput = document.getElementById('avista');
    const parcelaInput = document.getElementById('parcela');

    // Limpar readonly sempre para permitir edição manual
    parcelaInput.removeAttribute('readonly');

    // Só calcula automaticamente se for 12x
    if (metodo !== '12x') {
        return; // Não calcula automaticamente para outros valores
    }

    if (!juros || juros === '') {
        return;
    }

    const avista = parseCurrency(avistaInput.value);
    if (avista === 0) {
        return;
    }

    const numParcelas = 12;
    let parcela = 0;

    // Determinar tipo de taxa (carnê ou cartão)
    const tipoTaxa = (juros === 'carne') ? 'carne' : 'cartao';
    
    // Buscar fator na tabela
    if (FATORES[tipoTaxa] && FATORES[tipoTaxa][numParcelas]) {
        const fator = FATORES[tipoTaxa][numParcelas];
        parcela = avista * fator;
        
        // Arredondar para R$ X,90
        parcela = arredondar90(parcela);
    }

    parcelaInput.value = parcela ? formatCurrency(parcela.toFixed(2)) : '';
}

// Aplicar máscara também no campo parcela
const parcelaInput = document.getElementById('parcela');
parcelaInput.addEventListener('input', (e) => {
    e.target.value = formatCurrency(e.target.value);
});

document.getElementById('metodo').addEventListener('change', recalcularParcela);
document.getElementById('juros').addEventListener('change', recalcularParcela);
document.getElementById('avista').addEventListener('input', recalcularParcela);

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
        alert('Preencha código e descrição!');
        return;
    }

    if (!metodo || !juros) {
        alert('Selecione parcelamento e taxa de juros!');
        return;
    }

    if (avista <= 0) {
        alert('Informe o valor à vista!');
        return;
    }

    if (parcela <= 0) {
        alert('Informe o valor da parcela!');
        return;
    }

    const features = [feature1, feature2, feature3].filter(f => f !== '');

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
        updateHeaderSubtitle('produtos');
        return;
    }

    productsCount.textContent = `${products.length} produto(s) adicionado(s)`;
    btnGerarPDF.style.display = 'inline-flex';
    updateHeaderSubtitle('produtos');

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

    // Determinar texto de parcelamento (carnê/cartão)
    const tipoParcelamento = product.juros === 'carne' ? 'carnê' : 'cartão';

    return `
        <div class="poster">
            <div class="poster-header">
                <div class="poster-title">${product.descricao}</div>
                ${product.subdescricao ? `<div class="poster-subtitle">${product.subdescricao}</div>` : ''}
                ${featuresText ? `<div class="poster-features">${featuresText}</div>` : ''}
                <div class="poster-code">${product.codigo}</div>
            </div>
            
            <div class="poster-price-section">
                <div class="poster-left-section">
                    <div class="poster-installment">${product.metodo}</div>
                    <div class="poster-currency">R$</div>
                </div>
                <div class="poster-value-container">
                    <div class="poster-value-integer">${parcelaInteiro}</div>
                    <div class="poster-value-decimal">,${String(parcelaCentavos).padStart(2, '0')}</div>
                </div>
            </div>
            
            <div class="poster-footer-table">
                <div class="poster-table-left">
                    <div class="poster-table-main-text">= ${brl(valorTotal)} no ${tipoParcelamento}</div>
                    <div class="poster-table-sub-text">${jurosTexto[product.juros]}</div>
                    ${product.motivo ? `<div class="poster-table-sub-text" style="margin-top: 8px; font-weight: 700;">${product.motivo}</div>` : ''}
                </div>
                <div class="poster-table-right">
                    <div class="poster-table-main-text">${brl(product.avista)} À VISTA</div>
                    ${product.validade ? `<div class="poster-table-sub-text">Val: ${formatDate(product.validade)}</div>` : ''}
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
    const product = products.find(p => p.id !== id);
    if (!product) return;
    showToast('info', 'Visualização', 'Clique em "Gerar PDF" para visualizar o cartaz completo.');
};

// ==================================================
// GERAR PDF COM BLOB
// ==================================================
document.getElementById('btn-gerar-pdf').addEventListener('click', async () => {
    if (products.length === 0) {
        alert('Adicione pelo menos um produto!');
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

        // Gerar blob e abrir em nova janela
        const pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(pdfBlob);
        window.open(pdfUrl, '_blank');

        atualizarOverlayTexto("✅ PDF gerado com sucesso!");
        setTimeout(esconderOverlay, 1500);

    } catch (error) {
        console.error('Erro ao gerar PDF:', error);
        alert('Erro ao gerar PDF. Tente novamente.');
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
        alert('Informe um valor válido!');
        return;
    }

    if (!tipo) {
        alert('Selecione o tipo de taxa!');
        return;
    }

    gerarTabelaFatores(valor, tipo);
});

function gerarTabelaFatores(valorVista, tipo) {
    // Atualizar informações do modal
    document.getElementById('tabela-valor-vista').textContent = brl(valorVista);
    document.getElementById('tabela-tipo-taxa').textContent = tipo === 'carne' ? 'Carnê' : 'Cartão';

    const fatores = FATORES[tipo];
    const tbody = document.getElementById('tabela-fatores-body');
    tbody.innerHTML = '';

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
            <td>R$ ${valorParcelaFormatado}</td>
            <td>R$ ${totalPrazoFormatado}</td>
        `;
        tbody.appendChild(row);
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

// Fechar modal ao clicar fora
document.getElementById('modal-fator').addEventListener('click', (e) => {
    if (e.target.id === 'modal-fator') {
        fecharModalFator();
    }
});

// Fechar modal com ESC
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const modal = document.getElementById('modal-fator');
        if (modal.classList.contains('active')) {
            fecharModalFator();
        }
    }
});

// ==================================================
// INICIALIZAÇÃO
// ==================================================
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateHeaderSubtitle('gerar');
});

// ==================================================
// SISTEMA DE TOASTS
// ==================================================
function showToast(type = 'info', title, message, duration = 5000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
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
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
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
