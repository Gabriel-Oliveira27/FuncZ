// Mapa de Filiais -> Cidades (Otimização)
var FILIAIS = {
    '02': 'Iguatu-CE',
    '04': 'Quixadá-CE',
    '05': 'Brejo Santo-CE',
    '06': 'Crato-CE',
    '07': 'Mombaça-CE',
    '09': 'Juazeiro do Norte-CE',
    '13': 'Campos Sales-CE',
    '14': 'Tianguá-CE',
    '16': 'Fortaleza-CE',
    '17': 'Fortaleza-CE',
    '21': 'Crateús-CE',
    '23': 'Fortaleza-CE',
    '24': 'Acopiara-CE',
    '25': 'Maracanaú-CE',
    '27': 'Itapipoca-CE',
    '28': 'Iguatu-CE',
    '29': 'Várzea Alegre-CE',
    '30': 'Assaré-CE',
    '31': 'Sobral-CE',
    '32': 'Juazeiro do Norte-CE',
    '34': 'Ubajara-CE',
    '35': 'Cedro-CE',
    '36': 'Icó-CE',
    '37': 'Parambu-CE',
    '38': 'Tabuleiro do Norte-CE',
    '39': 'Tauá-CE',
    '40': 'Fortaleza-CE',
    '41': 'Horizonte-CE',
    '42': 'Limoeiro do Norte-CE',
    '43': 'Morada Nova-CE',
    '45': 'Maranguape-CE',
    '46': 'Missão Velha-CE',
    '47': 'Pacajus-CE',
    '48': 'Sobral-CE',
    '49': 'Guaraciaba do Norte-CE',
    '51': 'Quixelô-CE',
    '52': 'Mauriti-CE',
    '53': 'Maracanaú-CE',
    '54': 'Barbalha-CE',
    '55': 'Aracati-CE',
    '56': 'Fortaleza-CE',
    '57': 'Fortaleza-CE',
    '58': 'Fortaleza-CE',
    '59': 'Senador Pompeu-CE',
    '60': 'Pedra Branca-CE',
    '61': 'Caucaia-CE',
    '63': 'Sobral-CE',
    '65': 'Fortaleza-CE',
    '66': 'Fortaleza-CE',
    '67': 'Eusébio-CE',
    '68': 'Fortaleza-CE',
    '69': 'Massapê-CE',
    '70': 'São Benedito-CE',
    '71': 'Cascavel-CE',
    '72': 'Fortaleza-CE',
    '73': 'Aquiraz-CE',
    '74': 'Fortaleza-CE',
    '75': 'Jucás-CE',
    '76': 'Trairi-CE',
    '77': 'Camocim-CE'
};

// Estado da aplicação
var produtos = [{ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' }];
var cacheProdutos = null;
var acaoConfirmacao = null;
var timbreCache = null; // Cache do timbre (OTIMIZAÇÃO)

var camposObrigatorios = [
    'nomeCliente',
    'cpf',
    'filial',
    'endereco',
    'pv',
    'cupomNFe',
    'motivoDevolucao'
];

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    inicializarEventos();
    renderizarProdutos();
    atualizarProgresso();
    enforceUserName();
});

// Função para aplicar nome do usuário (copiada do admin)
function enforceUserName() {
    var applyName = function() {
        try {
            var raw = localStorage.getItem('authSession');
            if (!raw) return false;

            var session = JSON.parse(raw);
            if (!session.fullName) return false;

            var firstName = session.fullName.trim().split(/\s+/)[0];

            var el =
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

    // Tentativa imediata
    applyName();

    // Tenta novamente após carregamentos tardios
    setTimeout(applyName, 300);
    setTimeout(applyName, 800);
    setTimeout(applyName, 1500);

    // OBSERVADOR — impede sobrescrita
    var observer = new MutationObserver(function() {
        applyName();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        characterData: true
    });
}

// Eventos
function inicializarEventos() {
   document.getElementById('btnVoltar').addEventListener('click', function () {
  window.location.href = 'selectsetor.html';
});

    document.getElementById('btnAbrirFormulario').addEventListener('click', abrirFormulario);
    
    // Novos botões do header
    document.getElementById('btnFecharHeader').addEventListener('click', tentarFecharFormulario);
    document.getElementById('btnGerarPDFHeader').addEventListener('click', verificarEGerarPDF);
    document.getElementById('btnLimparHeader').addEventListener('click', function() {
        acaoConfirmacao = 'limpar';
        mostrarModalConfirmacao('Limpar todos os campos?', 'Tem certeza que deseja limpar todos os campos? Esta ação não pode ser desfeita.');
    });

    document.getElementById('nomeCliente').addEventListener('blur', capitalizarNome);
    document.getElementById('nomeCliente').addEventListener('input', atualizarProgresso);
    document.getElementById('cpf').addEventListener('input', function(e) {
        aplicarMascaraCPF(e);
        atualizarProgresso();
    });
    document.getElementById('filial').addEventListener('change', atualizarProgresso);
    
    // Busca automática de CEP no campo de endereço
    var enderecoInput = document.getElementById('endereco');
    enderecoInput.addEventListener('input', detectarCEP);
    enderecoInput.addEventListener('blur', tentarBuscarCEPAuto);
    enderecoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            tentarBuscarCEPAuto();
        }
    });
    
    document.getElementById('pv').addEventListener('input', atualizarProgresso);
    document.getElementById('cupomNFe').addEventListener('input', atualizarProgresso);
    document.getElementById('motivoDevolucao').addEventListener('input', atualizarProgresso);
    document.getElementById('estado').addEventListener('input', function(e) {
        e.target.value = e.target.value.toUpperCase();
    });
    document.getElementById('outraCompra').addEventListener('change', handleOutraCompra);

    document.getElementById('btnCancelar').addEventListener('click', fecharModalConfirmacao);
    document.getElementById('btnConfirmar').addEventListener('click', executarAcaoConfirmada);

    document.getElementById('modalConfirmacao').addEventListener('click', function(e) {
        if (e.target.id === 'modalConfirmacao') fecharModalConfirmacao();
    });

    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            fecharModalConfirmacao();
        }
    });
}

// Controle do Formulário
function abrirFormulario() {
    document.getElementById('formularioLayout').classList.add('active');
    document.getElementById('botaoCentral').classList.add('hidden');
    document.getElementById('iconesFlutuantes').classList.add('hidden');
    document.getElementById('headerRight').classList.add('active');
}

function tentarFecharFormulario() {
    if (verificarDadosPreenchidos()) {
        acaoConfirmacao = 'fechar';
        mostrarModalConfirmacao('Descartar alterações?', 'Ainda há informações preenchidas. Quer mesmo sair? Todos os dados serão perdidos.');
    } else {
        fecharFormulario();
    }
}

function verificarDadosPreenchidos() {
    for (var i = 0; i < camposObrigatorios.length; i++) {
        var valor = document.getElementById(camposObrigatorios[i]).value.trim();
        if (valor) return true;
    }
    
    var camposOpcionais = ['numeroNFe', 'bairro', 'numero', 'cidade', 'estado', 'outraCompra', 'novoPV'];
    for (var j = 0; j < camposOpcionais.length; j++) {
        var val = document.getElementById(camposOpcionais[j]).value.trim();
        if (val) return true;
    }
    
    for (var k = 0; k < produtos.length; k++) {
        if (produtos[k].codigo || produtos[k].descricao || produtos[k].quantidade || produtos[k].valorUnitario) {
            return true;
        }
    }
    
    return false;
}

function fecharFormulario() {
    document.getElementById('formularioLayout').classList.remove('active');
    document.getElementById('botaoCentral').classList.remove('hidden');
    document.getElementById('iconesFlutuantes').classList.remove('hidden');
    document.getElementById('headerRight').classList.remove('active');
}

// Modal Confirmação
function mostrarModalConfirmacao(titulo, mensagem) {
    document.getElementById('modalTitulo').textContent = titulo;
    document.getElementById('modalMensagem').textContent = mensagem;
    document.getElementById('modalConfirmacao').classList.add('active');
}

function fecharModalConfirmacao() {
    document.getElementById('modalConfirmacao').classList.remove('active');
}

function executarAcaoConfirmada() {
    var acao = acaoConfirmacao;
    fecharModalConfirmacao();
    acaoConfirmacao = null;
    
    if (acao === 'limpar') {
        limparCamposSilenciosamente();
        showToast('Campos limpos com sucesso', 'success');
    } else if (acao === 'fechar') {
        limparCamposSilenciosamente();
        fecharFormulario();
        showToast('Formulário fechado e dados descartados', 'info');
    } else if (acao === 'gerar-vazio') {
        gerarPDF(true);
    } else if (acao === 'gerar-parcial') {
        gerarPDF(false);
    }
}

// Verificar e Gerar PDF
function verificarEGerarPDF() {
    if (verificarCamposVazios()) {
        acaoConfirmacao = 'gerar-vazio';
        mostrarModalConfirmacao('Gerar declaração vazia?', 'Você está tentando gerar a declaração sem preencher nenhum campo. Tem certeza que deseja continuar?');
    } else if (verificarCamposParciais()) {
        acaoConfirmacao = 'gerar-parcial';
        mostrarModalConfirmacao('Campos obrigatórios incompletos', 'Tem certeza que quer gerar? Nem todos os campos obrigatórios foram preenchidos.');
    } else {
        gerarPDF(false);
    }
}

function verificarCamposVazios() {
    for (var i = 0; i < camposObrigatorios.length; i++) {
        if (document.getElementById(camposObrigatorios[i]).value.trim()) return false;
    }
    for (var j = 0; j < produtos.length; j++) {
        if (produtos[j].codigo || produtos[j].descricao || produtos[j].quantidade || produtos[j].valorUnitario) {
            return false;
        }
    }
    return true;
}

function verificarCamposParciais() {
    var temAlgumPreenchido = false;
    var temAlgumVazio = false;
    
    for (var i = 0; i < camposObrigatorios.length; i++) {
        var valor = document.getElementById(camposObrigatorios[i]).value.trim();
        if (valor) temAlgumPreenchido = true;
        else temAlgumVazio = true;
    }
    
    if (isProdutosObrigatoriosPreenchidos()) temAlgumPreenchido = true;
    else temAlgumVazio = true;
    
    return temAlgumPreenchido && temAlgumVazio;
}

// Limpar Campos
function limparCamposSilenciosamente() {
    document.getElementById('numeroNFe').value = '';
    document.getElementById('nomeCliente').value = '';
    document.getElementById('cpf').value = '';
    document.getElementById('filial').value = '';
    document.getElementById('endereco').value = '';
    document.getElementById('bairro').value = '';
    document.getElementById('numero').value = '';
    document.getElementById('cidade').value = '';
    document.getElementById('estado').value = '';
    document.getElementById('pv').value = '';
    document.getElementById('cupomNFe').value = '';
    document.getElementById('outraCompra').value = '';
    document.getElementById('novoPV').value = '';
    document.getElementById('novoPV').disabled = true;
    document.getElementById('motivoDevolucao').value = '';

    produtos = [{ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' }];
    renderizarProdutos();
    atualizarProgresso();
}

// Produtos
function renderizarProdutos() {
    var container = document.getElementById('listaProdutos');
    container.innerHTML = '';

    for (var i = 0; i < produtos.length; i++) {
        var produtoDiv = document.createElement('div');
        produtoDiv.className = 'produto-linha';
        
        var temLixeira = i > 0;
        
        produtoDiv.innerHTML = 
            '<input type="text" class="produto-codigo" data-index="' + i + '" value="' + produtos[i].codigo + '" placeholder="Código *">' +
            '<input type="text" class="produto-descricao" data-index="' + i + '" value="' + produtos[i].descricao + '" placeholder="Descrição *">' +
            '<input type="number" step="0.01" class="produto-quantidade" data-index="' + i + '" value="' + produtos[i].quantidade + '" placeholder="Qtd *">' +
            '<input type="number" step="0.01" class="produto-valor-unitario" data-index="' + i + '" value="' + produtos[i].valorUnitario + '" placeholder="VR. Unit. *">' +
            '<input type="text" class="produto-valor-total" data-index="' + i + '" value="' + produtos[i].valorTotal + '" placeholder="VR. Total *" readonly>' +
            (temLixeira ? '<button type="button" class="btn-remover-produto" data-index="' + i + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>' : '<div></div>');
        
        container.appendChild(produtoDiv);
    }

    var codigos = document.querySelectorAll('.produto-codigo');
    for (var c = 0; c < codigos.length; c++) {
        codigos[c].addEventListener('blur', onCodigoBlur);
        codigos[c].addEventListener('input', onCodigoInput);
    }

    var descricoes = document.querySelectorAll('.produto-descricao');
    for (var d = 0; d < descricoes.length; d++) {
        descricoes[d].addEventListener('input', onDescricaoInput);
    }

    var quantidades = document.querySelectorAll('.produto-quantidade');
    for (var q = 0; q < quantidades.length; q++) {
        quantidades[q].addEventListener('input', onQuantidadeInput);
    }

    var valoresUnit = document.querySelectorAll('.produto-valor-unitario');
    for (var v = 0; v < valoresUnit.length; v++) {
        valoresUnit[v].addEventListener('input', onValorUnitarioInput);
    }

    var botoesRemover = document.querySelectorAll('.btn-remover-produto');
    for (var b = 0; b < botoesRemover.length; b++) {
        botoesRemover[b].addEventListener('click', function(e) {
            removerProduto(parseInt(this.dataset.index));
        });
    }
}

function onCodigoBlur(e) {
    var codigo = e.target.value.trim();
    var index = parseInt(e.target.dataset.index);
    if (codigo && produtos[index].codigo === codigo) {
        if (!produtos[index].descricao) {
            buscarProdutoAPI(codigo, index);
        }
    }
}

function onCodigoInput(e) {
    var index = parseInt(e.target.dataset.index);
    produtos[index].codigo = e.target.value;
    verificarEAdicionarNovoProduto(index);
}

function onDescricaoInput(e) {
    var index = parseInt(e.target.dataset.index);
    produtos[index].descricao = e.target.value;
    atualizarProgresso();
    verificarEAdicionarNovoProduto(index);
}

function onQuantidadeInput(e) {
    var index = parseInt(e.target.dataset.index);
    atualizarProduto(index, 'quantidade', e.target.value);
    verificarEAdicionarNovoProduto(index);
}

function onValorUnitarioInput(e) {
    var index = parseInt(e.target.dataset.index);
    atualizarProduto(index, 'valorUnitario', e.target.value);
    verificarEAdicionarNovoProduto(index);
}

function atualizarProduto(index, campo, valor) {
    produtos[index][campo] = valor;

    if (campo === 'quantidade' || campo === 'valorUnitario') {
        var qtd = parseFloat(produtos[index].quantidade) || 0;
        var valorUnit = parseFloat(String(produtos[index].valorUnitario).replace(',', '.')) || 0;
        produtos[index].valorTotal = (qtd * valorUnit).toFixed(2);

        var inputTotal = document.querySelector('.produto-valor-total[data-index="' + index + '"]');
        if (inputTotal) inputTotal.value = produtos[index].valorTotal;
    }

    atualizarProgresso();
}

function verificarEAdicionarNovoProduto(index) {
    if (isProdutoCompleto(index) && index === produtos.length - 1 && produtos.length < 6) {
        produtos.push({ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' });
        
        var container = document.getElementById('listaProdutos');
        var novoProdutoDiv = document.createElement('div');
        novoProdutoDiv.className = 'produto-linha';
        var novoIndex = produtos.length - 1;
        
        novoProdutoDiv.innerHTML = 
            '<input type="text" class="produto-codigo" data-index="' + novoIndex + '" value="" placeholder="Código *">' +
            '<input type="text" class="produto-descricao" data-index="' + novoIndex + '" value="" placeholder="Descrição *">' +
            '<input type="number" step="0.01" class="produto-quantidade" data-index="' + novoIndex + '" value="" placeholder="Qtd *">' +
            '<input type="number" step="0.01" class="produto-valor-unitario" data-index="' + novoIndex + '" value="" placeholder="VR. Unit. *">' +
            '<input type="text" class="produto-valor-total" data-index="' + novoIndex + '" value="" placeholder="VR. Total *" readonly>' +
            '<button type="button" class="btn-remover-produto" data-index="' + novoIndex + '"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg></button>';
        
        container.appendChild(novoProdutoDiv);
        
        var novoCodigo = novoProdutoDiv.querySelector('.produto-codigo');
        novoCodigo.addEventListener('blur', onCodigoBlur);
        novoCodigo.addEventListener('input', onCodigoInput);
        
        var novaDesc = novoProdutoDiv.querySelector('.produto-descricao');
        novaDesc.addEventListener('input', onDescricaoInput);
        
        var novaQtd = novoProdutoDiv.querySelector('.produto-quantidade');
        novaQtd.addEventListener('input', onQuantidadeInput);
        
        var novoValor = novoProdutoDiv.querySelector('.produto-valor-unitario');
        novoValor.addEventListener('input', onValorUnitarioInput);
        
        var novoBtnRemover = novoProdutoDiv.querySelector('.btn-remover-produto');
        novoBtnRemover.addEventListener('click', function() {
            removerProduto(novoIndex);
        });
        
        showToast('Novo campo de produto adicionado', 'info', 2000);
    }
}

function removerProduto(index) {
    if (index === 0) return;
    
    produtos.splice(index, 1);
    renderizarProdutos();
    atualizarProgresso();
    showToast('Produto removido', 'info');
}

function isProdutoCompleto(index) {
    var p = produtos[index];
    return p && p.codigo && p.descricao && p.quantidade && p.valorUnitario;
}

function isProdutosObrigatoriosPreenchidos() {
    for (var i = 0; i < produtos.length; i++) {
        if (produtos[i].codigo && produtos[i].descricao && produtos[i].quantidade && produtos[i].valorUnitario && produtos[i].valorTotal) {
            return true;
        }
    }
    return false;
}

// API de Produtos
function carregarBaseProdutos() {
    if (cacheProdutos) return Promise.resolve(cacheProdutos);

    return fetch('https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLic4iE63JAJ0j4KpGWfRFINeiD4uyCsMjfF_uLkUNzhOsJMzO4uiiZpWV3xzDjbduZK8kU_wWw3ZSCs6cODW2gdFnIGb6pZ0Lz0cBqMpiV-SBOJroENJHqO1XML_YRs_41KFfQOKEehUQmf-Xg6Xhh-bKiYpPxxwQhQzEMP5g0DdJHN4sgG_Fc9cdvRRU4abxlz_PzeQ_5eJ7NtCfxWuP-ET0DEzUyiWhWITlXMZKJMfwmZQg5--gKmAEGpwSr0yXi3eycr23BCGltlXGIWtYZ3I0WkWg&lib=M38uuBDbjNiNXY1lAK2DF9n3ltsPa6Ver')
        .then(function(resp) {
            if (!resp.ok) throw new Error('Erro ao carregar base');
            return resp.json();
        })
        .then(function(data) {
            cacheProdutos = data;
            return data;
        });
}

function buscarProdutoPorCodigo(codigo) {
    return carregarBaseProdutos().then(function(dados) {
        var encontrado = null;
        var nomes = ["Gabriel", "Júlia", "Giovana"];
        
        for (var n = 0; n < nomes.length; n++) {
            if (!dados[nomes[n]]) continue;
            
            for (var i = 0; i < dados[nomes[n]].length; i++) {
                if (dados[nomes[n]][i].Código == codigo) {
                    encontrado = dados[nomes[n]][i];
                    break;
                }
            }
            if (encontrado) break;
        }
        
        return encontrado;
    });
}

function buscarProdutoAPI(codigo, index) {
    if (!codigo) return;

    var overlay = document.getElementById('overlayBuscaProduto');
    overlay.classList.add('active');

    buscarProdutoPorCodigo(codigo)
        .then(function(produto) {
            overlay.classList.remove('active');
            
            if (!produto) {
                produtos[index].descricao = '';
                produtos[index].valorUnitario = '';
                produtos[index].valorTotal = '';
                
                var descInput = document.querySelector('.produto-descricao[data-index="' + index + '"]');
                var valUnitInput = document.querySelector('.produto-valor-unitario[data-index="' + index + '"]');
                var totalInput = document.querySelector('.produto-valor-total[data-index="' + index + '"]');
                if (descInput) descInput.value = '';
                if (valUnitInput) valUnitInput.value = '';
                if (totalInput) totalInput.value = '';
                
                showToast('Produto não cadastrado ou indisponível', 'error');
                return;
            }

            produtos[index].descricao = produto.Descrição || '';
            produtos[index].valorUnitario = parseFloat(produto["Total à vista"] || 0).toFixed(2);

            if (produtos[index].quantidade) {
                var qtd = parseFloat(produtos[index].quantidade) || 0;
                produtos[index].valorTotal = (qtd * parseFloat(produtos[index].valorUnitario)).toFixed(2);
            }

            var descInput2 = document.querySelector('.produto-descricao[data-index="' + index + '"]');
            var valUnitInput2 = document.querySelector('.produto-valor-unitario[data-index="' + index + '"]');
            var totalInput2 = document.querySelector('.produto-valor-total[data-index="' + index + '"]');

            if (descInput2) descInput2.value = produtos[index].descricao;
            if (valUnitInput2) valUnitInput2.value = produtos[index].valorUnitario;
            if (totalInput2) totalInput2.value = produtos[index].valorTotal;

            showToast('Produto carregado com sucesso', 'success');
            verificarEAdicionarNovoProduto(index);
        })
        .catch(function(err) {
            console.error(err);
            overlay.classList.remove('active');
            showToast('Erro ao buscar produto', 'error');
        });
}

// Máscaras
function aplicarMascaraCPF(e) {
    var valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length <= 11) {
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    
    e.target.value = valor;
}

function aplicarMascaraCEP(e) {
    var valor = e.target.value.replace(/\D/g, '');
    
    if (valor.length <= 8) {
        valor = valor.replace(/(\d{5})(\d)/, '$1-$2');
    }
    
    e.target.value = valor;
}

// Capitalizar Nome
function capitalizarNome(e) {
    var palavras = e.target.value.toLowerCase().split(' ');
    var resultado = [];
    
    for (var i = 0; i < palavras.length; i++) {
        if (palavras[i].length > 0) {
            resultado.push(palavras[i].charAt(0).toUpperCase() + palavras[i].slice(1));
        }
    }
    
    e.target.value = resultado.join(' ');
}

// Outra Compra
function handleOutraCompra(e) {
    var novoPVInput = document.getElementById('novoPV');
    
    if (e.target.value === 'Sim') {
        novoPVInput.disabled = false;
    } else {
        novoPVInput.disabled = true;
        novoPVInput.value = '';
    }
}

// Progresso ATUALIZADO para barra horizontal
function atualizarProgresso() {
    var camposPreenchidos = 0;
    var totalCampos = camposObrigatorios.length + 1;

    for (var i = 0; i < camposObrigatorios.length; i++) {
        var valor = document.getElementById(camposObrigatorios[i]).value.trim();
        if (valor) camposPreenchidos++;
    }

    if (isProdutosObrigatoriosPreenchidos()) camposPreenchidos++;

    var porcentagem = Math.round((camposPreenchidos / totalCampos) * 100);
    
    // Atualizar barra horizontal
    var progressBarFill = document.getElementById('progressBarFill');
    var progressPercentage = document.getElementById('progressPercentage');
    var progressText = document.getElementById('progressText');
    
    if (progressBarFill) progressBarFill.style.width = porcentagem + '%';
    if (progressPercentage) progressPercentage.textContent = porcentagem + '%';
    
    if (progressText) {
        if (porcentagem === 100) {
            progressText.textContent = 'Todos os campos obrigatórios preenchidos!';
        } else {
            var faltam = totalCampos - camposPreenchidos;
            progressText.textContent = faltam + ' campo' + (faltam > 1 ? 's' : '') + ' obrigatório' + (faltam > 1 ? 's' : '') + ' restante' + (faltam > 1 ? 's' : '');
        }
    }
}

// Busca automática de CEP - NOVA IMPLEMENTAÇÃO
var buscandoCEP = false;

function detectarCEP(e) {
    var valor = e.target.value.replace(/\\D/g, '');
    var hint = document.getElementById('enderecoHint');
    
    if (valor.length >= 8 && valor.length <= 8) {
        hint.textContent = 'CEP detectado!';
        hint.style.color = '#10b981';
    } else {
        hint.textContent = ' ';
        hint.style.color = '#666';
    }
    
    atualizarProgresso();
}

function tentarBuscarCEPAuto() {
    var enderecoInput = document.getElementById('endereco');
    var valor = enderecoInput.value.replace(/\\D/g, '');
    
    // Se tem exatamente 8 dígitos, é um CEP
    if (valor.length === 8 && !buscandoCEP) {
        buscarCEPAutomatico(valor);
    }
}

function buscarCEPAutomatico(cep) {
    if (buscandoCEP) return;
    
    buscandoCEP = true;
    var loader = document.getElementById('enderecoLoader');
    var enderecoInput = document.getElementById('endereco');
    var hint = document.getElementById('enderecoHint');
    
    // Mostrar loader
    loader.classList.add('active');
    hint.textContent = '🔍 Buscando endereço...';
    hint.style.color = '#0ea5e9';
    
    showToast('Buscando endereço...', 'info', 2000);
    
    fetch('https://viacep.com.br/ws/' + cep + '/json/')
        .then(function(resp) { return resp.json(); })
        .then(function(data) {
            loader.classList.remove('active');
            buscandoCEP = false;
            
            if (data.erro) {
                hint.textContent = '❌ CEP inválido ou inexistente';
                hint.style.color = '#ef4444';
                showToast('CEP inválido ou inexistente', 'error');
                return;
            }
            
            // Preencher campos automaticamente
            enderecoInput.value = data.logradouro || '';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
            
            hint.textContent = '✅ Endereço encontrado!';
            hint.style.color = '#10b981';
            
            showToast('Endereço encontrado!', 'success');
            atualizarProgresso();
            
            // Resetar hint após 3 segundos
            setTimeout(function() {
                hint.textContent = ' ';
                hint.style.color = '#666';
            }, 3000);
        })
        .catch(function() {
            loader.classList.remove('active');
            buscandoCEP = false;
            
            hint.textContent = '❌ Erro ao buscar CEP';
            hint.style.color = '#ef4444';
            showToast('Erro ao buscar CEP', 'error');
            
            setTimeout(function() {
                hint.textContent = ' ';
                hint.style.color = '#666';
            }, 3000);
        });
}

// Geração de PDF OTIMIZADA (sem geolocalização lenta)
function gerarPDF(emBranco) {
    var overlay = document.getElementById('overlayLoading');
    document.getElementById('loadingText').textContent = 'Gerando PDF...';
    overlay.classList.add('active');

    // Função otimizada para carregar timbre com cache
    function loadImageCached(url) {
        if (timbreCache) {
            return Promise.resolve(timbreCache);
        }
        
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function() {
                timbreCache = img; // Cachear para próxima vez
                resolve(img);
            };
            img.onerror = reject;
            img.src = url;
        });
    }

    // OTIMIZAÇÃO: Obter cidade diretamente da filial (sem APIs lentas)
    function obterCidadePorFilial() {
        var filialSelecionada = document.getElementById('filial').value.trim();
        
        // Se tem filial, usa o mapa de filiais
        if (filialSelecionada && FILIAIS[filialSelecionada]) {
            var cidadeCompleta = FILIAIS[filialSelecionada];
            var partes = cidadeCompleta.split('-');
            return {
                cidade: partes[0] || 'Fortaleza',
                uf: partes[1] || 'CE'
            };
        }
        
        // Fallback: usa cidade do formulário
        var cidadeForm = document.getElementById('cidade').value.trim();
        var ufForm = document.getElementById('estado').value.trim();
        
        if (cidadeForm || ufForm) {
            return {
                cidade: cidadeForm || 'Fortaleza',
                uf: ufForm || 'CE'
            };
        }
        
        // Fallback final
        return {
            cidade: 'Fortaleza',
            uf: 'CE'
        };
    }

    // Carregar apenas timbre (RÁPIDO)
    loadImageCached('../image/declaracaonova.png')
        .catch(function() { return null; })
        .then(function(timbre) {
            // Obter cidade da filial (INSTANTÂNEO)
            var localUsuario = obterCidadePorFilial();

            try {
                var jsPDF = window.jspdf.jsPDF;
                var doc = new jsPDF();

                var campos = {
                    nfe: document.getElementById('numeroNFe').value.trim() || '',
                    nomeCliente: document.getElementById('nomeCliente').value.trim() || '',
                    cpf: document.getElementById('cpf').value.trim() || '',
                    endereco: document.getElementById('endereco').value.trim() || '',
                    numero: document.getElementById('numero').value.trim() || '',
                    bairro: document.getElementById('bairro').value.trim() || '',
                    cidadeForm: document.getElementById('cidade').value.trim() || '',
                    ufForm: document.getElementById('estado').value.trim() || '',
                    pv: document.getElementById('pv').value.trim() || '',
                    cupom: document.getElementById('cupomNFe').value.trim() || '',
                    filial: document.getElementById('filial').value.trim() || '',
                    novaCompra: document.getElementById('outraCompra').value.trim() || '',
                    novoPV: document.getElementById('novoPV').value.trim() || '',
                    motivo: document.getElementById('motivoDevolucao').value.trim() || ''
                };

                // Adicionar timbre de fundo
                if (timbre) {
                    doc.addImage(timbre, 'PNG', 0, 0, 210, 297);
                }

                doc.setFont('times', 'bold');
                doc.setFontSize(16);
                doc.text('DECLARAÇÃO', 105, 40, { align: 'center' });

                doc.setFont('times', 'normal');
                doc.setFontSize(12);
                var nfeTexto = emBranco ? '___________' : (campos.nfe || '___________');
                var cabecalho = 'Declaro para fins de comprovação junto à SEFAZ – Secretaria da Fazenda do Estado do Ceará, que através da NF-e de devolução Nº ' + nfeTexto + ', devolvo o(s) produto(s) abaixo relacionado(s):';
                doc.text(cabecalho, 15, 55, { maxWidth: 180, align: 'justify' });

                var produtosParaPDF = produtos.slice();
                while (produtosParaPDF.length < 6) {
                    produtosParaPDF.push({ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' });
                }

                var produtosBody = emBranco ? 
                    [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']] :
                    produtosParaPDF.slice(0, 6).map(function(p) {
                        return [p.codigo || '', p.descricao || '', p.quantidade || '', p.valorUnitario || '', p.valorTotal || ''];
                    });

                doc.autoTable({
                    head: [['Código', 'Descrição', 'QTD', 'VR. Unit.', 'VR. Total']],
                    body: produtosBody,
                    startY: 75,
                    theme: 'grid',
                    styles: { font: 'times', fontSize: 11, halign: 'center', valign: 'middle' },
                    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold' }
                });

                var finalY = doc.lastAutoTable.finalY + 10;
                var marginX = 15;
                var maxWidth = 180;

                if (emBranco) {
                    doc.text('Cliente: _______________________________________________ CPF: _______________________', marginX, finalY);
                    finalY += 7;
                    doc.text('Endereço: ____________________________________________ Nº ____ Bairro: _______________', marginX, finalY);
                    finalY += 7;
                    doc.text('Cidade: ______________ Estado: ____ PV: ___________ Cupom/NF-e: ___________ Filial: ____', marginX, finalY);
                    finalY += 7;
                    doc.text('Cliente efetuou outra compra? ______ Novo PV: ___________ Motivo da devolução:', marginX, finalY);
                    finalY += 7;
                    doc.text('_______________________________________________________________________________', marginX, finalY);
                } else {
                    var placeholders = {
                        nomeCliente: '_______________________________________________',
                        cpf: '_______________________',
                        endereco: '______________________________________________',
                        numero: '____',
                        bairro: '_______________',
                        cidadeForm: '______________',
                        ufForm: '____',
                        pv: '___________',
                        cupom: '___________',
                        filial: '____',
                        novaCompra: '______',
                        novoPV: '___________',
                        motivo: '_______________________________________________________________________________'
                    };

                    var linha = [
                        { label: 'Cliente:', key: 'nomeCliente' },
                        { label: 'CPF:', key: 'cpf' },
                        { label: 'Endereço:', key: 'endereco' },
                        { label: 'Nº', key: 'numero' },
                        { label: 'Bairro:', key: 'bairro' },
                        { label: 'Cidade:', key: 'cidadeForm' },
                        { label: 'Estado:', key: 'ufForm' },
                        { label: 'PV:', key: 'pv' },
                        { label: 'Cupom/NF-e:', key: 'cupom' },
                        { label: 'Filial:', key: 'filial' },
                        { label: 'Cliente efetuou outra compra?', key: 'novaCompra' },
                        { label: 'Novo PV:', key: 'novoPV' },
                        { label: 'Motivo da devolução:', key: 'motivo' }
                    ];

                    var x = marginX;
                    var y = finalY;

                    for (var i = 0; i < linha.length; i++) {
                        var label = linha[i].label;
                        var key = linha[i].key;
                        var value = campos[key] ? campos[key].trim() : '';
                        var displayValue = value;

                        if (key === 'novoPV') {
                            if (campos.novaCompra !== 'Sim') {
                                displayValue = '';
                            } else if (!value) {
                                displayValue = placeholders[key];
                            }
                        } else {
                            if (!value) displayValue = placeholders[key];
                        }

                        if (!displayValue) continue;

                        doc.setFont('times', 'bold');
                        var labelWidth = doc.getTextWidth(label + ' ');
                        if (x + labelWidth > marginX + maxWidth) {
                            x = marginX;
                            y += 7;
                        }
                        doc.text(label + ' ', x, y);
                        x += labelWidth;

                        doc.setFont('times', 'normal');
                        var words = displayValue.split(' ');
                        for (var w = 0; w < words.length; w++) {
                            var word = words[w] + ' ';
                            var wordWidth = doc.getTextWidth(word);
                            if (x + wordWidth > marginX + maxWidth) {
                                x = marginX;
                                y += 7;
                            }
                            doc.text(word, x, y);
                            doc.line(x, y + 0.8, x + wordWidth, y + 0.8);
                            x += wordWidth;
                        }
                        x += 2;
                    }

                    finalY = y + 10;
                }

                finalY += 20;
                doc.text('Assinatura Cliente: ___________________________________________', marginX, finalY);
                finalY += 15;
                doc.text('Assinatura Gerente: __________________________________________', marginX, finalY);

                finalY += 20;
                // Usa cidade da filial (OTIMIZAÇÃO)
                var cidadeAssinatura = localUsuario.cidade;
                var ufAssinatura = localUsuario.uf;
                var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                var dataAtual = new Date();
                var dia = dataAtual.getDate();
                var mes = meses[dataAtual.getMonth()];
                var ano = dataAtual.getFullYear();
                doc.setFontSize(12);
                doc.text(cidadeAssinatura + '-' + ufAssinatura + ', ' + dia + ' de ' + mes + ' de ' + ano, 105, finalY, { align: 'center' });

                var pdfBlob = doc.output('blob');
                var pdfUrl = URL.createObjectURL(pdfBlob);

                var html = '<!DOCTYPE html><html><head><title>Declaração de Devolução</title></head><body style="margin:0"><iframe src="' + pdfUrl + '" style="width:100vw; height:100vh; border:none;"></iframe></body></html>';

                var win = window.open();
                if (!win || win.closed || typeof win.closed == 'undefined') {
                    overlay.classList.remove('active');
                    showToast('Não foi possível abrir o PDF. Verifique o bloqueador de popups.', 'error');
                    return;
                }
                
                win.document.write(html);
                win.document.close();

                overlay.classList.remove('active');
                showToast('PDF gerado com sucesso!', 'success');

            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                overlay.classList.remove('active');
                showToast('Erro ao gerar o PDF. Tente novamente.', 'error');
            }
        })
        .catch(function(error) {
            console.error('Erro ao preparar PDF:', error);
            overlay.classList.remove('active');
            showToast('Erro ao gerar o PDF. Tente novamente.', 'error');
        });
}

// Toast
function showToast(message, type, duration) {
    if (!duration) duration = 3000;
    
    var container = document.getElementById('toastContainer');
    if (!container) return;

    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    
    var icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    };
    
    var titles = {
        success: 'Sucesso',
        error: 'Erro',
        warning: 'Atenção',
        info: 'Informação'
    };
    
    toast.innerHTML = 
        '<div class="toast-icon">' + icons[type] + '</div>' +
        '<div class="toast-content">' +
        '<div class="toast-title">' + titles[type] + '</div>' +
        '<div class="toast-message">' + escapeHtml(String(message)) + '</div>' +
        '</div>' +
        '<div class="toast-progress" style="animation: toastProgress ' + duration + 'ms linear forwards;"></div>';
    
    container.appendChild(toast);
    
    setTimeout(function() {
        toast.style.animation = 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) reverse';
        setTimeout(function() {
            if (container.contains(toast)) {
                container.removeChild(toast);
            }
        }, 400);
    }, duration);
}

function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}