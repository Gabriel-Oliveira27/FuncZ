// Mapa de Filiais -> Cidades
var FILIAIS = {
    '02': 'Iguatu-CE', '04': 'Quixadá-CE', '05': 'Brejo Santo-CE',
    '06': 'Crato-CE', '07': 'Mombaça-CE', '09': 'Juazeiro do Norte-CE',
    '13': 'Campos Sales-CE', '14': 'Tianguá-CE', '16': 'Fortaleza-CE',
    '17': 'Fortaleza-CE', '21': 'Crateús-CE', '23': 'Fortaleza-CE',
    '24': 'Acopiara-CE', '25': 'Maracanaú-CE', '27': 'Itapipoca-CE',
    '28': 'Iguatu-CE', '29': 'Várzea Alegre-CE', '30': 'Assaré-CE',
    '31': 'Sobral-CE', '32': 'Juazeiro do Norte-CE', '34': 'Ubajara-CE',
    '35': 'Cedro-CE', '36': 'Icó-CE', '37': 'Parambu-CE',
    '38': 'Tabuleiro do Norte-CE', '39': 'Tauá-CE', '40': 'Fortaleza-CE',
    '41': 'Horizonte-CE', '42': 'Limoeiro do Norte-CE', '43': 'Morada Nova-CE',
    '45': 'Maranguape-CE', '46': 'Missão Velha-CE', '47': 'Pacajus-CE',
    '48': 'Sobral-CE', '49': 'Guaraciaba do Norte-CE', '51': 'Quixelô-CE',
    '52': 'Mauriti-CE', '53': 'Maracanaú-CE', '54': 'Barbalha-CE',
    '55': 'Aracati-CE', '56': 'Fortaleza-CE', '57': 'Fortaleza-CE',
    '58': 'Fortaleza-CE', '59': 'Senador Pompeu-CE', '60': 'Pedra Branca-CE',
    '61': 'Caucaia-CE', '63': 'Sobral-CE', '65': 'Fortaleza-CE',
    '66': 'Fortaleza-CE', '67': 'Eusébio-CE', '68': 'Fortaleza-CE',
    '69': 'Massapê-CE', '70': 'São Benedito-CE', '71': 'Cascavel-CE',
    '72': 'Fortaleza-CE', '73': 'Aquiraz-CE', '74': 'Fortaleza-CE',
    '75': 'Jucás-CE', '76': 'Trairi-CE', '77': 'Camocim-CE'
};

var produtos = [{ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' }];

// ─── Cache de produtos (carregado uma vez de ../data/produtos.json) ───────────
var cacheProdutos = null;
var carregandoProdutos = false;

var acaoConfirmacao = null;
var timbreCache = null;
var buscandoCEP = false;
var modoBuscaCEP = false;

var camposObrigatorios = ['nomeCliente', 'cpf', 'filial', 'endereco', 'pv', 'cupomNFe', 'motivoDevolucao'];

document.addEventListener('DOMContentLoaded', function () {
    inicializarTema();
    inicializarEventos();
    renderizarProdutos();
    atualizarProgresso();
    atualizarTotalGeral();
    enforceUserName();
    // Pré-carrega o JSON em background para a primeira busca ser instantânea
    carregarBaseProdutos().catch(function () {});
});

// ========================
// TEMA ESCURO
// ========================
function inicializarTema() {
    var tema = localStorage.getItem('theme');
    if (tema === 'dark') {
        document.body.classList.add('dark');
        atualizarIconeTema(true);
    }
}

function toggleTema() {
    var isDark = document.body.classList.toggle('dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    atualizarIconeTema(isDark);
}

function atualizarIconeTema(isDark) {
    var el = document.getElementById('iconeTema');
    if (!el) return;
    if (isDark) {
        el.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>';
    } else {
        el.innerHTML = '<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>';
    }
}

// ========================
// OVERLAY LOADING
// ========================
function mostrarOverlay(id) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    var loader = overlay.querySelector('.modern-loader');
    if (loader) {
        loader.classList.remove('loader-show');
        void loader.offsetWidth;
        loader.classList.add('loader-show');
    }
    overlay.classList.add('active');
}

function esconderOverlay(id) {
    var overlay = document.getElementById(id);
    if (overlay) overlay.classList.remove('active');
}

// ========================
// ENFORCE USERNAME
// ========================
function enforceUserName() {
    var applyName = function () {
        try {
            var raw = localStorage.getItem('authSession');
            if (!raw) return false;
            var session = JSON.parse(raw);
            if (!session.fullName) return false;
            var firstName = session.fullName.trim().split(/\s+/)[0];
            var el = document.getElementById('userName') || document.getElementById('user') ||
                document.querySelector('.user-name') || document.querySelector('[data-user-name]');
            if (!el) return false;
            if (el.textContent !== firstName) el.textContent = firstName;
            return true;
        } catch (e) { return false; }
    };
    applyName();
    setTimeout(applyName, 300);
    setTimeout(applyName, 800);
    var observer = new MutationObserver(function () { applyName(); });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });
}

// ========================
// INICIALIZAR EVENTOS
// ========================
function inicializarEventos() {
    document.getElementById('btnVoltar').addEventListener('click', function () {
        window.location.href = 'selectsetor.html';
    });
    document.getElementById('btnTema').addEventListener('click', toggleTema);
    document.getElementById('btnAbrirFormulario').addEventListener('click', abrirFormulario);
    document.getElementById('btnFecharHeader').addEventListener('click', tentarFecharFormulario);
    document.getElementById('btnGerarPDFHeader').addEventListener('click', verificarEGerarPDF);
    document.getElementById('btnLimparHeader').addEventListener('click', function () {
        acaoConfirmacao = 'limpar';
        mostrarModalConfirmacao('Limpar todos os campos?', 'Tem certeza que deseja limpar todos os campos? Esta ação não pode ser desfeita.');
    });

    document.getElementById('nomeCliente').addEventListener('blur', capitalizarNome);
    document.getElementById('nomeCliente').addEventListener('input', atualizarProgresso);
    document.getElementById('cpf').addEventListener('input', function (e) { aplicarMascaraCPF(e); atualizarProgresso(); });
    document.getElementById('filial').addEventListener('change', atualizarProgresso);
    document.getElementById('pv').addEventListener('input', atualizarProgresso);
    document.getElementById('cupomNFe').addEventListener('input', atualizarProgresso);
    document.getElementById('motivoDevolucao').addEventListener('input', atualizarProgresso);
    document.getElementById('estado').addEventListener('input', function (e) { e.target.value = e.target.value.toUpperCase(); });
    document.getElementById('outraCompra').addEventListener('change', handleOutraCompra);

    var enderecoInput = document.getElementById('endereco');
    enderecoInput.addEventListener('input', onEnderecoInput);
    enderecoInput.addEventListener('blur', function () {
        if (modoBuscaCEP) tentarBuscarCEPAuto();
    });
    enderecoInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && modoBuscaCEP) { e.preventDefault(); tentarBuscarCEPAuto(); }
    });

    document.getElementById('linkBuscarCEP').addEventListener('click', function (e) {
        e.preventDefault();
        ativarModoCEP();
    });

    document.getElementById('btnCancelar').addEventListener('click', fecharModalConfirmacao);
    document.getElementById('btnConfirmar').addEventListener('click', executarAcaoConfirmada);
    document.getElementById('modalConfirmacao').addEventListener('click', function (e) {
        if (e.target.id === 'modalConfirmacao') fecharModalConfirmacao();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') fecharModalConfirmacao();
    });
}

// ========================
// CEP INTELIGENTE
// ========================
function onEnderecoInput(e) {
    var valor = e.target.value;
    var hint = document.getElementById('enderecoHint');
    var linkCEP = document.getElementById('linkBuscarCEP');

    if (modoBuscaCEP) {
        var apenasDigitos = valor.replace(/\D/g, '');
        if (apenasDigitos.length > 5) {
            e.target.value = apenasDigitos.substring(0, 5) + '-' + apenasDigitos.substring(5, 8);
        }
        var digits = e.target.value.replace(/\D/g, '');
        if (digits.length === 8) {
            hint.textContent = 'CEP completo! Pressione Enter ou saia do campo para buscar.';
            hint.className = 'field-hint hint-info';
        } else {
            hint.textContent = 'Digite o CEP (com ou sem hífen)';
            hint.className = 'field-hint';
        }
    } else {
        var soDigitos = valor.replace(/\D/g, '');
        if (valor.length >= 4 && !/^\d{5}-?\d{0,3}$/.test(valor.trim())) {
            linkCEP.style.display = 'inline';
            hint.textContent = '';
            hint.className = 'field-hint';
        } else if (soDigitos.length > 0 && soDigitos.length < 8) {
            linkCEP.style.display = 'none';
            hint.textContent = '';
        } else {
            linkCEP.style.display = 'none';
        }
    }
    atualizarProgresso();
}

function ativarModoCEP() {
    modoBuscaCEP = true;
    var enderecoInput = document.getElementById('endereco');
    var hint = document.getElementById('enderecoHint');
    var linkCEP = document.getElementById('linkBuscarCEP');

    enderecoInput.value = '';
    enderecoInput.placeholder = 'Digite o CEP (ex: 63500-000)';
    hint.textContent = 'Digite o CEP com ou sem hífen e pressione Enter ou saia do campo.';
    hint.className = 'field-hint hint-info';
    linkCEP.style.display = 'none';

    var linkCancelar = document.getElementById('linkCancelarCEP');
    if (linkCancelar) linkCancelar.style.display = 'inline';

    enderecoInput.focus();
    showToast('Modo CEP ativado! Digite o CEP e pressione Enter.', 'info', 3000);
}

function cancelarModoCEP() {
    modoBuscaCEP = false;
    var enderecoInput = document.getElementById('endereco');
    var hint = document.getElementById('enderecoHint');
    var linkCEP = document.getElementById('linkBuscarCEP');
    var linkCancelar = document.getElementById('linkCancelarCEP');

    enderecoInput.placeholder = 'Rua / Logradouro ou CEP';
    hint.textContent = '';
    hint.className = 'field-hint';
    linkCEP.style.display = 'none';
    if (linkCancelar) linkCancelar.style.display = 'none';
    enderecoInput.focus();
}

function tentarBuscarCEPAuto() {
    if (!modoBuscaCEP) return;
    var valor = document.getElementById('endereco').value.replace(/\D/g, '');
    if (valor.length === 8 && !buscandoCEP) buscarCEPAutomatico(valor);
}

function buscarCEPAutomatico(cep) {
    if (buscandoCEP) return;
    buscandoCEP = true;
    var loader = document.getElementById('enderecoLoader');
    var hint = document.getElementById('enderecoHint');
    loader.classList.add('active');
    hint.textContent = 'Buscando endereço...';
    hint.className = 'field-hint hint-loading';

    fetch('https://viacep.com.br/ws/' + cep + '/json/')
        .then(function (resp) { return resp.json(); })
        .then(function (data) {
            loader.classList.remove('active');
            buscandoCEP = false;
            if (data.erro) {
                hint.textContent = 'CEP inválido ou inexistente.';
                hint.className = 'field-hint hint-error';
                showToast('CEP inválido ou inexistente', 'error');
                return;
            }
            modoBuscaCEP = false;
            document.getElementById('endereco').value = data.logradouro || '';
            document.getElementById('endereco').placeholder = 'Rua / Logradouro ou CEP';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
            hint.textContent = 'Endereço encontrado! Verifique e complete o número.';
            hint.className = 'field-hint hint-success';
            document.getElementById('linkBuscarCEP').style.display = 'none';
            var linkCancelar = document.getElementById('linkCancelarCEP');
            if (linkCancelar) linkCancelar.style.display = 'none';
            showToast('Endereço preenchido automaticamente!', 'success');
            atualizarProgresso();
            document.getElementById('numero').focus();
            setTimeout(function () { hint.textContent = ''; hint.className = 'field-hint'; }, 4000);
        })
        .catch(function () {
            loader.classList.remove('active');
            buscandoCEP = false;
            hint.textContent = 'Erro ao buscar CEP. Tente novamente.';
            hint.className = 'field-hint hint-error';
            showToast('Erro ao buscar CEP', 'error');
            setTimeout(function () { hint.textContent = ''; hint.className = 'field-hint'; }, 3000);
        });
}

// ========================
// CONTROLE FORMULÁRIO
// ========================
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
    } else { fecharFormulario(); }
}

function verificarDadosPreenchidos() {
    for (var i = 0; i < camposObrigatorios.length; i++) {
        if (document.getElementById(camposObrigatorios[i]).value.trim()) return true;
    }
    var camposOpcionais = ['numeroNFe', 'bairro', 'numero', 'cidade', 'estado', 'outraCompra', 'novoPV'];
    for (var j = 0; j < camposOpcionais.length; j++) {
        if (document.getElementById(camposOpcionais[j]).value.trim()) return true;
    }
    for (var k = 0; k < produtos.length; k++) {
        if (produtos[k].codigo || produtos[k].descricao || produtos[k].quantidade || produtos[k].valorUnitario) return true;
    }
    return false;
}

function fecharFormulario() {
    document.getElementById('formularioLayout').classList.remove('active');
    document.getElementById('botaoCentral').classList.remove('hidden');
    document.getElementById('iconesFlutuantes').classList.remove('hidden');
    document.getElementById('headerRight').classList.remove('active');
}

// ========================
// MODAL
// ========================
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
    if (acao === 'limpar') { limparCamposSilenciosamente(); showToast('Campos limpos com sucesso', 'success'); }
    else if (acao === 'fechar') { limparCamposSilenciosamente(); fecharFormulario(); showToast('Formulário fechado', 'info'); }
    else if (acao === 'gerar-vazio') { gerarPDF(true); }
    else if (acao === 'gerar-parcial') { gerarPDF(false); }
}

// ========================
// VALIDAÇÃO PDF
// ========================
function verificarEGerarPDF() {
    if (verificarCamposVazios()) {
        acaoConfirmacao = 'gerar-vazio';
        mostrarModalConfirmacao('Gerar declaração vazia?', 'Você está tentando gerar a declaração sem preencher nenhum campo. Tem certeza?');
    } else if (verificarCamposParciais()) {
        acaoConfirmacao = 'gerar-parcial';
        mostrarModalConfirmacao('Campos obrigatórios incompletos', 'Nem todos os campos obrigatórios foram preenchidos. Deseja continuar mesmo assim?');
    } else { gerarPDF(false); }
}

function verificarCamposVazios() {
    for (var i = 0; i < camposObrigatorios.length; i++) {
        if (document.getElementById(camposObrigatorios[i]).value.trim()) return false;
    }
    for (var j = 0; j < produtos.length; j++) {
        if (produtos[j].codigo || produtos[j].descricao || produtos[j].quantidade || produtos[j].valorUnitario) return false;
    }
    return true;
}

function verificarCamposParciais() {
    var temAlgumPreenchido = false;
    var temAlgumVazio = false;
    for (var i = 0; i < camposObrigatorios.length; i++) {
        var valor = document.getElementById(camposObrigatorios[i]).value.trim();
        if (valor) temAlgumPreenchido = true; else temAlgumVazio = true;
    }
    if (isProdutosObrigatoriosPreenchidos()) temAlgumPreenchido = true; else temAlgumVazio = true;
    return temAlgumPreenchido && temAlgumVazio;
}

// ========================
// LIMPAR
// ========================
function limparCamposSilenciosamente() {
    ['numeroNFe', 'nomeCliente', 'cpf', 'filial', 'endereco', 'bairro', 'numero', 'cidade', 'estado',
        'pv', 'cupomNFe', 'outraCompra', 'novoPV', 'motivoDevolucao'].forEach(function (id) {
            document.getElementById(id).value = '';
        });
    document.getElementById('novoPV').disabled = true;
    modoBuscaCEP = false;
    document.getElementById('endereco').placeholder = 'Rua / Logradouro ou CEP';
    document.getElementById('enderecoHint').textContent = '';
    document.getElementById('enderecoHint').className = 'field-hint';
    document.getElementById('linkBuscarCEP').style.display = 'none';
    var lc = document.getElementById('linkCancelarCEP');
    if (lc) lc.style.display = 'none';

    produtos = [{ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' }];
    renderizarProdutos();
    atualizarProgresso();
    atualizarTotalGeral();
}

// ========================
// PRODUTOS — renderização
// ========================
function renderizarProdutos() {
    var container = document.getElementById('listaProdutos');
    container.innerHTML = '';

    for (var i = 0; i < produtos.length; i++) {
        var div = document.createElement('div');
        div.className = 'produto-linha';
        var temLixeira = i > 0;
        div.innerHTML =
            '<div class="produto-num">' + (i + 1) + '</div>' +
            '<input type="text" class="produto-codigo" data-index="' + i + '" value="' + escapeAttr(produtos[i].codigo) + '" placeholder="Código *">' +
            '<input type="text" class="produto-descricao" data-index="' + i + '" value="' + escapeAttr(produtos[i].descricao) + '" placeholder="Descrição *">' +
            '<input type="number" min="1" step="1" class="produto-quantidade" data-index="' + i + '" value="' + produtos[i].quantidade + '" placeholder="Qtd *">' +
            '<input type="number" min="0.01" step="0.01" class="produto-valor-unitario" data-index="' + i + '" value="' + produtos[i].valorUnitario + '" placeholder="VR. Unit. *">' +
            '<input type="text" class="produto-valor-total" data-index="' + i + '" value="' + (produtos[i].valorTotal ? 'R$ ' + formatarMoeda(produtos[i].valorTotal) : '') + '" placeholder="VR. Total" readonly>' +
            (temLixeira
                ? '<button type="button" class="btn-remover-produto" data-index="' + i + '" title="Remover produto"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
                : '<div class="produto-placeholder-btn"></div>');
        container.appendChild(div);
    }

    container.querySelectorAll('.produto-codigo').forEach(function (el) {
        el.addEventListener('blur', onCodigoBlur);
        el.addEventListener('input', onCodigoInput);
    });
    container.querySelectorAll('.produto-descricao').forEach(function (el) { el.addEventListener('input', onDescricaoInput); });
    container.querySelectorAll('.produto-quantidade').forEach(function (el) {
        el.addEventListener('input', onQuantidadeInput);
        el.addEventListener('blur', function (e) {
            var val = parseInt(e.target.value);
            var idx = parseInt(e.target.dataset.index);
            if (isNaN(val) || val < 1) { e.target.value = ''; produtos[idx].quantidade = ''; }
            else { e.target.value = val; produtos[idx].quantidade = String(val); }
            recalcularTotal(idx);
        });
    });
    container.querySelectorAll('.produto-valor-unitario').forEach(function (el) {
        el.addEventListener('input', onValorUnitarioInput);
        el.addEventListener('blur', function (e) {
            var val = parseFloat(e.target.value);
            var idx = parseInt(e.target.dataset.index);
            if (isNaN(val) || val <= 0) { e.target.value = ''; produtos[idx].valorUnitario = ''; }
            else { e.target.value = val.toFixed(2); produtos[idx].valorUnitario = val.toFixed(2); }
            recalcularTotal(idx);
        });
    });
    container.querySelectorAll('.btn-remover-produto').forEach(function (el) {
        el.addEventListener('click', function () { removerProduto(parseInt(this.dataset.index)); });
    });
}

function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function formatarMoeda(valor) {
    return parseFloat(valor).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function recalcularTotal(index) {
    var qtd = parseInt(produtos[index].quantidade) || 0;
    var valorUnit = parseFloat(String(produtos[index].valorUnitario).replace(',', '.')) || 0;
    var total = qtd * valorUnit;
    produtos[index].valorTotal = total > 0 ? total.toFixed(2) : '';
    var inputTotal = document.querySelector('.produto-valor-total[data-index="' + index + '"]');
    if (inputTotal) inputTotal.value = total > 0 ? 'R$ ' + formatarMoeda(total.toFixed(2)) : '';
    atualizarTotalGeral();
    atualizarProgresso();
}

function atualizarTotalGeral() {
    var total = 0, count = 0;
    for (var i = 0; i < produtos.length; i++) {
        if (produtos[i].valorTotal) { total += parseFloat(produtos[i].valorTotal); count++; }
    }
    var totalEl = document.getElementById('totalGeralValor');
    var containerEl = document.getElementById('totalGeralContainer');
    if (totalEl) totalEl.textContent = 'R$ ' + formatarMoeda(total.toFixed(2));
    if (containerEl) {
        if (total > 0) {
            containerEl.classList.add('visible');
            var countEl = document.getElementById('totalGeralCount');
            if (countEl) countEl.textContent = count + ' produto' + (count !== 1 ? 's' : '');
        } else {
            containerEl.classList.remove('visible');
        }
    }
}

function onCodigoBlur(e) {
    var codigo = e.target.value.trim();
    var index = parseInt(e.target.dataset.index);
    if (codigo && !produtos[index].descricao) {
        buscarProdutoAPI(codigo, index);
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
    var val = e.target.value.replace(/[^0-9]/g, '');
    if (val !== e.target.value) e.target.value = val;
    produtos[index].quantidade = val;
    recalcularTotal(index);
    verificarEAdicionarNovoProduto(index);
}

function onValorUnitarioInput(e) {
    var index = parseInt(e.target.dataset.index);
    produtos[index].valorUnitario = e.target.value;
    recalcularTotal(index);
    verificarEAdicionarNovoProduto(index);
}

function verificarEAdicionarNovoProduto(index) {
    if (isProdutoCompleto(index) && index === produtos.length - 1 && produtos.length < 6) {
        produtos.push({ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' });
        renderizarProdutos();
        showToast('Novo campo de produto adicionado', 'info', 2000);
    }
}

function removerProduto(index) {
    if (index === 0) return;
    produtos.splice(index, 1);
    renderizarProdutos();
    atualizarProgresso();
    atualizarTotalGeral();
    showToast('Produto removido', 'info');
}

function isProdutoCompleto(index) {
    var p = produtos[index];
    return p && p.codigo && p.descricao && p.quantidade && p.valorUnitario;
}

function isProdutosObrigatoriosPreenchidos() {
    for (var i = 0; i < produtos.length; i++) {
        if (produtos[i].codigo && produtos[i].descricao && produtos[i].quantidade && produtos[i].valorUnitario && produtos[i].valorTotal) return true;
    }
    return false;
}

// ========================
// BUSCA DE PRODUTOS — ../data/produtos.json
// ========================

/**
 * Carrega o JSON de produtos uma única vez e cacheia.
 * O JSON pode ter QUALQUER estrutura de chaves no nível raiz, ex:
 *   { "Gabriel": [...], "Júlia": [...], "NomeQualquer": [...] }
 * Cada item da lista deve conter pelo menos: Código, Descrição, "Total à vista"
 */
function carregarBaseProdutos() {
    if (cacheProdutos !== null) {
        return Promise.resolve(cacheProdutos);
    }
    if (carregandoProdutos) {
        // Espera o carregamento atual terminar (polling simples)
        return new Promise(function (resolve, reject) {
            var tentativas = 0;
            var intervalo = setInterval(function () {
                tentativas++;
                if (cacheProdutos !== null) {
                    clearInterval(intervalo);
                    resolve(cacheProdutos);
                } else if (tentativas > 100) {
                    clearInterval(intervalo);
                    reject(new Error('Timeout aguardando produtos'));
                }
            }, 100);
        });
    }

    carregandoProdutos = true;

    return fetch('../data/produtos.json')
        .then(function (resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            return resp.json();
        })
        .then(function (data) {
            cacheProdutos = data;
            carregandoProdutos = false;
            return data;
        })
        .catch(function (err) {
            carregandoProdutos = false;
            cacheProdutos = {}; // evita loop de retry; próxima chamada retorna vazio
            throw err;
        });
}

/**
 * Busca um produto pelo código em TODAS as chaves do JSON.
 * Faz comparação de número e string para garantir match independente do tipo.
 */
function buscarProdutoPorCodigo(codigo) {
    return carregarBaseProdutos().then(function (dados) {
        var codigoNum = Number(codigo);
        var codigoStr = String(codigo).trim();

        // Itera sobre todas as chaves do objeto raiz (ex: "Gabriel", "Júlia", etc.)
        var chaves = Object.keys(dados);
        for (var c = 0; c < chaves.length; c++) {
            var lista = dados[chaves[c]];
            if (!Array.isArray(lista)) continue;
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                var itemCod = item['Código'] !== undefined ? item['Código'] : item['Codigo'];
                if (itemCod === undefined) continue;
                // Compara tanto como número quanto como string
                if (Number(itemCod) === codigoNum || String(itemCod).trim() === codigoStr) {
                    return item;
                }
            }
        }
        return null; // não encontrado
    });
}

function buscarProdutoAPI(codigo, index) {
    if (!codigo) return;
    mostrarOverlay('overlayBuscaProduto');

    buscarProdutoPorCodigo(codigo)
        .then(function (produto) {
            esconderOverlay('overlayBuscaProduto');

            if (!produto) {
                // Limpa campos do produto se não encontrado
                produtos[index].descricao = '';
                produtos[index].valorUnitario = '';
                produtos[index].valorTotal = '';
                ['descricao', 'valor-unitario', 'valor-total'].forEach(function (cls) {
                    var el = document.querySelector('.produto-' + cls + '[data-index="' + index + '"]');
                    if (el) el.value = '';
                });
                showToast('Produto não encontrado. Código: ' + codigo, 'error');
                return;
            }

            // Preenche descrição
            produtos[index].descricao = produto['Descrição'] || produto['Descricao'] || '';

            // Preenche valor unitário (usa "Total à vista" como preço padrão)
            var precoRaw = produto['Total à vista'] || produto['Total a vista'] || 0;
            var preco = parseFloat(String(precoRaw).replace(',', '.')) || 0;
            produtos[index].valorUnitario = preco > 0 ? preco.toFixed(2) : '';

            // Recalcula total se já tem quantidade
            if (produtos[index].quantidade) recalcularTotal(index);

            // Atualiza DOM
            var descInput = document.querySelector('.produto-descricao[data-index="' + index + '"]');
            var valUnitInput = document.querySelector('.produto-valor-unitario[data-index="' + index + '"]');
            var totalInput = document.querySelector('.produto-valor-total[data-index="' + index + '"]');

            if (descInput) descInput.value = produtos[index].descricao;
            if (valUnitInput) valUnitInput.value = produtos[index].valorUnitario;
            if (totalInput) totalInput.value = produtos[index].valorTotal
                ? 'R$ ' + formatarMoeda(produtos[index].valorTotal)
                : '';

            showToast('Produto carregado: ' + (produtos[index].descricao || codigo), 'success');
            verificarEAdicionarNovoProduto(index);
            atualizarTotalGeral();
            atualizarProgresso();
        })
        .catch(function (err) {
            console.error('Erro ao buscar produto:', err);
            esconderOverlay('overlayBuscaProduto');
            showToast('Erro ao acessar a base de produtos. Verifique o arquivo produtos.json.', 'error');
        });
}

// ========================
// MÁSCARAS
// ========================
function aplicarMascaraCPF(e) {
    var valor = e.target.value.replace(/\D/g, '');
    if (valor.length <= 11) {
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d)/, '$1.$2');
        valor = valor.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    }
    e.target.value = valor;
}

function capitalizarNome(e) {
    var palavras = e.target.value.toLowerCase().split(' ');
    var resultado = [];
    for (var i = 0; i < palavras.length; i++) {
        if (palavras[i].length > 0) resultado.push(palavras[i].charAt(0).toUpperCase() + palavras[i].slice(1));
    }
    e.target.value = resultado.join(' ');
}

function handleOutraCompra(e) {
    var novoPVInput = document.getElementById('novoPV');
    if (e.target.value === 'Sim') { novoPVInput.disabled = false; novoPVInput.focus(); }
    else { novoPVInput.disabled = true; novoPVInput.value = ''; }
}

// ========================
// PROGRESSO
// ========================
function atualizarProgresso() {
    var camposPreenchidos = 0;
    var totalCampos = camposObrigatorios.length + 1;
    for (var i = 0; i < camposObrigatorios.length; i++) {
        if (document.getElementById(camposObrigatorios[i]).value.trim()) camposPreenchidos++;
    }
    if (isProdutosObrigatoriosPreenchidos()) camposPreenchidos++;
    var porcentagem = Math.round((camposPreenchidos / totalCampos) * 100);
    var fill = document.getElementById('progressBarFill');
    var pct = document.getElementById('progressPercentage');
    if (fill) {
        fill.style.width = porcentagem + '%';
        if (porcentagem === 100) fill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
        else if (porcentagem >= 50) fill.style.background = 'linear-gradient(90deg, #f59e0b, #d97706)';
        else fill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
    }
    if (pct) pct.textContent = porcentagem + '%';
}

// ========================
// GERAÇÃO DE PDF
// ========================
function gerarPDF(emBranco) {
    mostrarOverlay('overlayLoading');

    function loadImageCached(url) {
        if (timbreCache) return Promise.resolve(timbreCache);
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () { timbreCache = img; resolve(img); };
            img.onerror = reject;
            img.src = url;
        });
    }

    function obterCidadePorFilial() {
        var filialSelecionada = document.getElementById('filial').value.trim();
        if (filialSelecionada && FILIAIS[filialSelecionada]) {
            var partes = FILIAIS[filialSelecionada].split('-');
            return { cidade: partes[0] || 'Fortaleza', uf: partes[1] || 'CE' };
        }
        var cidadeForm = document.getElementById('cidade').value.trim();
        var ufForm = document.getElementById('estado').value.trim();
        if (cidadeForm || ufForm) return { cidade: cidadeForm || 'Fortaleza', uf: ufForm || 'CE' };
        return { cidade: 'Fortaleza', uf: 'CE' };
    }

    loadImageCached('../image/declaracaonova.png')
        .catch(function () { return null; })
        .then(function (timbre) {
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

                if (timbre) doc.addImage(timbre, 'PNG', 0, 0, 210, 297);

                doc.setFont('times', 'bold');
                doc.setFontSize(16);
                doc.text('DECLARAÇÃO', 105, 40, { align: 'center' });
                doc.setFont('times', 'normal');
                doc.setFontSize(12);
                var nfeTexto = emBranco ? '___________' : (campos.nfe || '___________');
                doc.text('Declaro para fins de comprovação junto à SEFAZ – Secretaria da Fazenda do Estado do Ceará, que através da NF-e de devolução Nº ' + nfeTexto + ', devolvo o(s) produto(s) abaixo relacionado(s):', 15, 55, { maxWidth: 180, align: 'justify' });

                var produtosParaPDF = produtos.slice();
                while (produtosParaPDF.length < 6) produtosParaPDF.push({ codigo: '', descricao: '', quantidade: '', valorUnitario: '', valorTotal: '' });

                var produtosBody = emBranco
                    ? [['','','','',''],['','','','',''],['','','','',''],['','','','',''],['','','','',''],['','','','','']]
                    : produtosParaPDF.slice(0, 6).map(function (p) {
                        return [p.codigo || '', p.descricao || '', p.quantidade || '',
                            p.valorUnitario ? 'R$ ' + formatarMoeda(p.valorUnitario) : '',
                            p.valorTotal ? 'R$ ' + formatarMoeda(p.valorTotal) : ''];
                    });

                doc.autoTable({
                    head: [['Código', 'Descrição', 'QTD', 'VR. Unit.', 'VR. Total']],
                    body: produtosBody,
                    startY: 75,
                    theme: 'grid',
                    styles: { font: 'times', fontSize: 11, halign: 'center', valign: 'middle' },
                    headStyles: { fillColor: [200, 200, 200], textColor: 0, fontStyle: 'bold' }
                });

                var totalGeral = 0;
                for (var t = 0; t < produtos.length; t++) {
                    if (produtos[t].valorTotal) totalGeral += parseFloat(produtos[t].valorTotal);
                }

                var afterTableY = doc.lastAutoTable.finalY;

                if (!emBranco && totalGeral > 0) {
                    doc.setFont('times', 'bold');
                    doc.setFontSize(12);
                    doc.text('Total Devolvido: R$ ' + formatarMoeda(totalGeral.toFixed(2)), 195, afterTableY + 7, { align: 'right' });
                    doc.setFont('times', 'normal');
                    afterTableY += 14;
                } else {
                    afterTableY += 10;
                }

                var finalY = afterTableY;
                var marginX = 15;
                var maxWidth = 180;

                if (emBranco) {
                    doc.text('Cliente: _______________________________________________ CPF: _______________________', marginX, finalY); finalY += 7;
                    doc.text('Endereço: ____________________________________________ Nº ____ Bairro: _______________', marginX, finalY); finalY += 7;
                    doc.text('Cidade: ______________ Estado: ____ PV: ___________ Cupom/NF-e: ___________ Filial: ____', marginX, finalY); finalY += 7;
                    doc.text('Cliente efetuou outra compra? ______ Novo PV: ___________ Motivo da devolução:', marginX, finalY); finalY += 7;
                    doc.text('_______________________________________________________________________________', marginX, finalY);
                } else {
                    var placeholders = { nomeCliente: '_______________________________________________', cpf: '_______________________', endereco: '______________________________________________', numero: '____', bairro: '_______________', cidadeForm: '______________', ufForm: '____', pv: '___________', cupom: '___________', filial: '____', novaCompra: '______', novoPV: '___________', motivo: '_______________________________________________________________________________' };
                    var linha = [
                        { label: 'Cliente:', key: 'nomeCliente' }, { label: 'CPF:', key: 'cpf' },
                        { label: 'Endereço:', key: 'endereco' }, { label: 'Nº', key: 'numero' },
                        { label: 'Bairro:', key: 'bairro' }, { label: 'Cidade:', key: 'cidadeForm' },
                        { label: 'Estado:', key: 'ufForm' }, { label: 'PV:', key: 'pv' },
                        { label: 'Cupom/NF-e:', key: 'cupom' }, { label: 'Filial:', key: 'filial' },
                        { label: 'Cliente efetuou outra compra?', key: 'novaCompra' },
                        { label: 'Novo PV:', key: 'novoPV' }, { label: 'Motivo da devolução:', key: 'motivo' }
                    ];
                    var x = marginX, y = finalY;
                    for (var i = 0; i < linha.length; i++) {
                        var label = linha[i].label, key = linha[i].key;
                        var value = campos[key] ? campos[key].trim() : '';
                        var displayValue = value;
                        if (key === 'novoPV') { if (campos.novaCompra !== 'Sim') displayValue = ''; else if (!value) displayValue = placeholders[key]; }
                        else { if (!value) displayValue = placeholders[key]; }
                        if (!displayValue) continue;
                        doc.setFont('times', 'bold');
                        var labelWidth = doc.getTextWidth(label + ' ');
                        if (x + labelWidth > marginX + maxWidth) { x = marginX; y += 7; }
                        doc.text(label + ' ', x, y);
                        x += labelWidth;
                        doc.setFont('times', 'normal');
                        var words = displayValue.split(' ');
                        for (var w = 0; w < words.length; w++) {
                            var word = words[w] + ' ';
                            var wordWidth = doc.getTextWidth(word);
                            if (x + wordWidth > marginX + maxWidth) { x = marginX; y += 7; }
                            doc.text(word, x, y);
                            doc.line(x, y + 0.8, x + wordWidth, y + 0.8);
                            x += wordWidth;
                        }
                        x += 2;
                    }
                    finalY = y + 10;
                }

                finalY += 20;
                doc.text('Assinatura Cliente: ___________________________________________', marginX, finalY); finalY += 15;
                doc.text('Assinatura Gerente: __________________________________________', marginX, finalY); finalY += 20;

                var meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
                var dataAtual = new Date();
                doc.setFontSize(12);
                doc.text(localUsuario.cidade + '-' + localUsuario.uf + ', ' + dataAtual.getDate() + ' de ' + meses[dataAtual.getMonth()] + ' de ' + dataAtual.getFullYear(), 105, finalY, { align: 'center' });

                var pdfBlob = doc.output('blob');
                var pdfUrl = URL.createObjectURL(pdfBlob);
                var html = '<!DOCTYPE html><html><head><title>Declaração de Devolução</title></head><body style="margin:0"><iframe src="' + pdfUrl + '" style="width:100vw;height:100vh;border:none;"></iframe></body></html>';
                var win = window.open();
                if (!win || win.closed || typeof win.closed === 'undefined') {
                    esconderOverlay('overlayLoading');
                    showToast('Não foi possível abrir o PDF. Verifique o bloqueador de popups.', 'error');
                    return;
                }
                win.document.write(html);
                win.document.close();
                esconderOverlay('overlayLoading');
                showToast('PDF gerado com sucesso!', 'success');
            } catch (error) {
                console.error('Erro ao gerar PDF:', error);
                esconderOverlay('overlayLoading');
                showToast('Erro ao gerar o PDF. Tente novamente.', 'error');
            }
        })
        .catch(function (error) {
            console.error('Erro ao preparar PDF:', error);
            esconderOverlay('overlayLoading');
            showToast('Erro ao gerar o PDF. Tente novamente.', 'error');
        });
}

// ========================
// TOAST
// ========================
function showToast(message, type, duration) {
    if (!duration) duration = 3000;
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    var icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    var titles = { success: 'Sucesso', error: 'Erro', warning: 'Atenção', info: 'Informação' };
    toast.innerHTML =
        '<div class="toast-icon">' + icons[type] + '</div>' +
        '<div class="toast-content"><div class="toast-title">' + titles[type] + '</div><div class="toast-message">' + escapeHtml(String(message)) + '</div></div>' +
        '<div class="toast-progress" style="animation-duration:' + duration + 'ms;"></div>';
    container.appendChild(toast);
    setTimeout(function () {
        toast.style.animation = 'slideInRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) reverse';
        setTimeout(function () { if (container.contains(toast)) container.removeChild(toast); }, 400);
    }, duration);
}

function escapeHtml(str) {
    if (str === null || typeof str === 'undefined') return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
