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

// Cache de produtos (carregado uma vez de ../data/produtos.json)
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
    carregarBaseProdutos().catch(function () {});
});

// ========================
// TEMA
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
// OVERLAYS
// ========================
function mostrarOverlay(id) {
    var overlay = document.getElementById(id);
    if (!overlay) return;
    var card = overlay.querySelector('.loader-card');
    if (card) { card.style.animation = 'none'; void card.offsetWidth; card.style.animation = ''; }
    overlay.classList.add('active');
}

function esconderOverlay(id) {
    var el = document.getElementById(id);
    if (el) el.classList.remove('active');
}

// ========================
// USERNAME
// ========================
function enforceUserName() {
    var applyName = function () {
        try {
            var raw = localStorage.getItem('authSession');
            if (!raw) return false;
            var session = JSON.parse(raw);
            if (!session.fullName) return false;
            var firstName = session.fullName.trim().split(/\s+/)[0];
            var el = document.getElementById('userName');
            if (!el) return false;
            if (el.textContent !== firstName) el.textContent = firstName;
            return true;
        } catch (e) { return false; }
    };
    applyName();
    setTimeout(applyName, 300);
    setTimeout(applyName, 800);
}

// ========================
// EVENTOS
// ========================
function inicializarEventos() {
    // Tema
    document.getElementById('btnTema').addEventListener('click', toggleTema);

    // Home: voltar para selectsetor
    document.getElementById('btnHome').addEventListener('click', function () {
        window.location.href = 'selectsetor.html';
    });

    // Dashboard: abrir formulário
    document.getElementById('btnAbrirFormulario').addEventListener('click', abrirFormulario);

    // Dashboard: gerar em branco (direto, sem formulário)
    document.getElementById('btnGerarEmBranco').addEventListener('click', function () {
        gerarPDF(true);
    });

    // Header: ações do formulário
    document.getElementById('btnFecharHeader').addEventListener('click', tentarFecharFormulario);
    document.getElementById('btnGerarPDFHeader').addEventListener('click', verificarEGerarPDF);
    document.getElementById('btnLimparHeader').addEventListener('click', function () {
        acaoConfirmacao = 'limpar';
        mostrarModalConfirmacao('Limpar todos os campos?', 'Tem certeza que deseja limpar todos os campos? Esta ação não pode ser desfeita.');
    });

    // Campos obrigatórios — progresso
    document.getElementById('nomeCliente').addEventListener('blur', capitalizarNome);
    document.getElementById('nomeCliente').addEventListener('input', atualizarProgresso);
    document.getElementById('cpf').addEventListener('input', function (e) { aplicarMascaraCPF(e); atualizarProgresso(); });
    document.getElementById('filial').addEventListener('change', atualizarProgresso);
    document.getElementById('pv').addEventListener('input', atualizarProgresso);
    document.getElementById('cupomNFe').addEventListener('input', atualizarProgresso);
    document.getElementById('motivoDevolucao').addEventListener('input', atualizarProgresso);
    document.getElementById('estado').addEventListener('input', function (e) { e.target.value = e.target.value.toUpperCase(); });
    document.getElementById('outraCompra').addEventListener('change', handleOutraCompra);

    // Endereço / CEP
    var enderecoInput = document.getElementById('endereco');
    enderecoInput.addEventListener('input', onEnderecoInput);
    enderecoInput.addEventListener('blur', function () { if (modoBuscaCEP) tentarBuscarCEPAuto(); });
    enderecoInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter' && modoBuscaCEP) { e.preventDefault(); tentarBuscarCEPAuto(); }
    });
    document.getElementById('linkBuscarCEP').addEventListener('click', function (e) { e.preventDefault(); ativarModoCEP(); });

    // Modal
    document.getElementById('btnCancelar').addEventListener('click', fecharModalConfirmacao);
    document.getElementById('btnConfirmar').addEventListener('click', executarAcaoConfirmada);
    document.getElementById('modalConfirmacao').addEventListener('click', function (e) {
        if (e.target.id === 'modalConfirmacao') fecharModalConfirmacao();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') fecharModalConfirmacao(); });
}

// ========================
// CEP INTELIGENTE
// ========================
function onEnderecoInput(e) {
    var valor = e.target.value;
    var hint = document.getElementById('enderecoHint');
    var linkCEP = document.getElementById('linkBuscarCEP');
    var lc = document.getElementById('linkCancelarCEP');

    // Detecta automaticamente se o input é numérico (possível CEP)
    var soDig = valor.replace(/\D/g, '');
    var ehCEP = valor.length > 0 && /^[\d\-]*$/.test(valor) && soDig.length <= 8;

    if (ehCEP) {
        // Formata automaticamente como CEP: 00000-000
        var formatted = soDig.length > 5
            ? soDig.substring(0, 5) + '-' + soDig.substring(5, 8)
            : soDig;

        if (e.target.value !== formatted) {
            var cursor = e.target.selectionStart;
            e.target.value = formatted;
            // Mantém cursor após o hífen ao inserir o 6º dígito
            if (soDig.length === 6 && cursor === 6) {
                e.target.setSelectionRange(7, 7);
            }
        }

        // Ativa o modo CEP silenciosamente (sem precisar clicar em link)
        modoBuscaCEP = true;
        if (linkCEP) linkCEP.style.display = 'none';
        if (lc) lc.style.display = 'none';

        if (soDig.length === 8) {
            hint.textContent = 'CEP completo — pressione Enter para buscar o endereço.';
            hint.className = 'field-hint hint-inf';
        } else if (soDig.length >= 5) {
            hint.textContent = 'Continue digitando os 3 últimos dígitos do CEP...';
            hint.className = 'field-hint';
        } else if (soDig.length >= 1) {
            hint.textContent = 'Parece um CEP — continue digitando (8 dígitos).';
            hint.className = 'field-hint';
        }
    } else if (valor.length === 0) {
        // Campo vazio: reset completo
        modoBuscaCEP = false;
        if (linkCEP) linkCEP.style.display = 'none';
        if (lc) lc.style.display = 'none';
        hint.textContent = '';
        hint.className = 'field-hint';
    } else {
        // Contém letras: é endereço textual normal
        modoBuscaCEP = false;
        if (linkCEP) linkCEP.style.display = 'none';
        if (lc) lc.style.display = 'none';
        hint.textContent = '';
        hint.className = 'field-hint';
    }

    atualizarProgresso();
}

function ativarModoCEP() {
    modoBuscaCEP = true;
    var enderecoInput = document.getElementById('endereco');
    enderecoInput.value = '';
    enderecoInput.placeholder = 'Digite o CEP (ex: 63500-000)';
    var hint = document.getElementById('enderecoHint');
    hint.textContent = 'Digite o CEP e pressione Enter ou saia do campo.';
    hint.className = 'field-hint hint-inf';
    document.getElementById('linkBuscarCEP').style.display = 'none';
    var lc = document.getElementById('linkCancelarCEP');
    if (lc) lc.style.display = 'inline';
    enderecoInput.focus();
    showToast('Modo CEP ativado! Digite e pressione Enter.', 'info', 3000);
}

function cancelarModoCEP() {
    modoBuscaCEP = false;
    var enderecoInput = document.getElementById('endereco');
    enderecoInput.placeholder = 'Rua / Logradouro ou CEP';
    var hint = document.getElementById('enderecoHint');
    hint.textContent = '';
    hint.className = 'field-hint';
    document.getElementById('linkBuscarCEP').style.display = 'none';
    var lc = document.getElementById('linkCancelarCEP');
    if (lc) lc.style.display = 'none';
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
    if (loader) loader.classList.add('active');
    hint.textContent = 'Buscando endereço...';
    hint.className = 'field-hint';

    fetch('https://viacep.com.br/ws/' + cep + '/json/')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (loader) loader.classList.remove('active');
            buscandoCEP = false;
            if (data.erro) {
                hint.textContent = 'CEP inválido ou inexistente.';
                hint.className = 'field-hint hint-err';
                showToast('CEP inválido ou inexistente', 'error');
                return;
            }
            modoBuscaCEP = false;
            document.getElementById('endereco').value = data.logradouro || '';
            document.getElementById('endereco').placeholder = 'Rua / Logradouro ou CEP';
            document.getElementById('bairro').value = data.bairro || '';
            document.getElementById('cidade').value = data.localidade || '';
            document.getElementById('estado').value = data.uf || '';
            hint.textContent = 'Endereço preenchido! Complete o número e o bairro se necessário.';
            hint.className = 'field-hint hint-ok';
            document.getElementById('linkBuscarCEP').style.display = 'none';
            var lc = document.getElementById('linkCancelarCEP');
            if (lc) lc.style.display = 'none';
            showToast('Endereço encontrado com sucesso via CEP!', 'success');
            atualizarProgresso();
            document.getElementById('numero').focus();
            setTimeout(function () { hint.textContent = ''; hint.className = 'field-hint'; }, 4000);
        })
        .catch(function () {
            if (loader) loader.classList.remove('active');
            buscandoCEP = false;
            hint.textContent = 'Erro ao buscar CEP. Tente novamente.';
            hint.className = 'field-hint hint-err';
            showToast('Erro ao buscar CEP', 'error');
            setTimeout(function () { hint.textContent = ''; hint.className = 'field-hint'; }, 3000);
        });
}

// ========================
// CONTROLE FORMULÁRIO
// ========================
function abrirFormulario() {
    var dash = document.getElementById('dashboard');
    var form = document.getElementById('formularioLayout');
    var formGroup = document.getElementById('headerFormGroup');
    var btnLimpar = document.getElementById('btnLimparHeader');
    var btnGerar = document.getElementById('btnGerarPDFHeader');
    var btnFechar = document.getElementById('btnFecharHeader');

    // Mostra o grupo de ferramentas e habilita botões
    formGroup.style.display = 'flex';
    btnLimpar.disabled = false;
    btnGerar.disabled = false;
    btnFechar.disabled = false;

    // Esconde dashboard com fade
    dash.style.transition = 'opacity .3s, transform .3s';
    dash.style.opacity = '0';
    dash.style.transform = 'translateY(-8px)';
    setTimeout(function () {
        dash.style.display = 'none';
        form.classList.add('active');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 280);
}

function fecharFormulario() {
    var dash = document.getElementById('dashboard');
    var form = document.getElementById('formularioLayout');
    var formGroup = document.getElementById('headerFormGroup');
    var btnLimpar = document.getElementById('btnLimparHeader');
    var btnGerar = document.getElementById('btnGerarPDFHeader');
    var btnFechar = document.getElementById('btnFecharHeader');

    form.classList.remove('active');

    // Esconde o grupo de ferramentas e desabilita botões
    formGroup.style.display = 'none';
    btnLimpar.disabled = true;
    btnGerar.disabled = true;
    btnFechar.disabled = true;

    dash.style.display = '';
    dash.style.opacity = '0';
    dash.style.transform = 'translateY(-8px)';
    void dash.offsetWidth;
    dash.style.transition = 'opacity .35s, transform .35s';
    requestAnimationFrame(function () {
        dash.style.opacity = '1';
        dash.style.transform = 'translateY(0)';
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        if (document.getElementById(camposObrigatorios[i]).value.trim()) return true;
    }
    var opcionais = ['numeroNFe', 'bairro', 'numero', 'cidade', 'estado', 'outraCompra', 'novoPV'];
    for (var j = 0; j < opcionais.length; j++) {
        if (document.getElementById(opcionais[j]).value.trim()) return true;
    }
    for (var k = 0; k < produtos.length; k++) {
        if (produtos[k].codigo || produtos[k].descricao || produtos[k].quantidade || produtos[k].valorUnitario) return true;
    }
    return false;
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
        mostrarModalConfirmacao('Gerar declaração vazia?', 'Nenhum campo foi preenchido. Deseja gerar mesmo assim?');
    } else if (verificarCamposParciais()) {
        acaoConfirmacao = 'gerar-parcial';
        mostrarModalConfirmacao('Campos incompletos', 'Nem todos os campos obrigatórios foram preenchidos. Deseja continuar mesmo assim?');
    } else {
        gerarPDF(false);
    }
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
    var temAlgum = false, temVazio = false;
    for (var i = 0; i < camposObrigatorios.length; i++) {
        var v = document.getElementById(camposObrigatorios[i]).value.trim();
        if (v) temAlgum = true; else temVazio = true;
    }
    if (isProdutosObrigatoriosPreenchidos()) temAlgum = true; else temVazio = true;
    return temAlgum && temVazio;
}

// ========================
// LIMPAR
// ========================
function limparCamposSilenciosamente() {
    ['numeroNFe','nomeCliente','cpf','filial','endereco','bairro','numero','cidade','estado',
     'pv','cupomNFe','outraCompra','novoPV','motivoDevolucao'].forEach(function (id) {
        document.getElementById(id).value = '';
    });
    document.getElementById('novoPV').disabled = true;
    modoBuscaCEP = false;
    document.getElementById('endereco').placeholder = 'Rua / Logradouro ou CEP';
    var hint = document.getElementById('enderecoHint');
    if (hint) { hint.textContent = ''; hint.className = 'field-hint'; }
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
            '<input type="number" min="0.01" step="0.01" class="produto-valor-unitario" data-index="' + i + '" value="' + produtos[i].valorUnitario + '" placeholder="0,00">' +
            '<input type="text" class="produto-valor-total" data-index="' + i + '" value="' + (produtos[i].valorTotal ? 'R$ ' + formatarMoeda(produtos[i].valorTotal) : '') + '" placeholder="R$ 0,00" readonly>' +
            (temLixeira
                ? '<button type="button" class="btn-remover-produto" data-index="' + i + '" title="Remover produto"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>'
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
    var vunit = parseFloat(String(produtos[index].valorUnitario).replace(',', '.')) || 0;
    var total = qtd * vunit;
    produtos[index].valorTotal = total > 0 ? total.toFixed(2) : '';
    var el = document.querySelector('.produto-valor-total[data-index="' + index + '"]');
    if (el) el.value = total > 0 ? 'R$ ' + formatarMoeda(total.toFixed(2)) : '';
    atualizarTotalGeral();
    atualizarProgresso();
}

function atualizarTotalGeral() {
    var total = 0, count = 0;
    for (var i = 0; i < produtos.length; i++) {
        if (produtos[i].valorTotal) { total += parseFloat(produtos[i].valorTotal); count++; }
    }
    var valEl = document.getElementById('totalGeralValor');
    var cntEl = document.getElementById('totalGeralCount');
    var contEl = document.getElementById('totalGeralContainer');
    if (valEl) valEl.textContent = 'R$ ' + formatarMoeda(total.toFixed(2));
    if (contEl) {
        if (total > 0) {
            contEl.classList.add('visible');
            if (cntEl) cntEl.textContent = count + ' produto' + (count !== 1 ? 's' : '');
        } else {
            contEl.classList.remove('visible');
        }
    }
}

function onCodigoBlur(e) {
    var codigo = e.target.value.trim();
    var index = parseInt(e.target.dataset.index);
    if (codigo && !produtos[index].descricao) buscarProdutoAPI(codigo, index);
}
function onCodigoInput(e) {
    produtos[parseInt(e.target.dataset.index)].codigo = e.target.value;
    verificarEAdicionarNovoProduto(parseInt(e.target.dataset.index));
}
function onDescricaoInput(e) {
    produtos[parseInt(e.target.dataset.index)].descricao = e.target.value;
    atualizarProgresso();
    verificarEAdicionarNovoProduto(parseInt(e.target.dataset.index));
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
        showToast('Novo produto adicionado', 'info', 2000);
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
// Estrutura: { "NomeQualquer": [ { "Código": 123, "Descrição": "...", "Total à vista": 99.9, ... }, ... ], ... }
// ========================
function carregarBaseProdutos() {
    if (cacheProdutos !== null) return Promise.resolve(cacheProdutos);
    if (carregandoProdutos) {
        return new Promise(function (resolve, reject) {
            var tries = 0;
            var iv = setInterval(function () {
                tries++;
                if (cacheProdutos !== null) { clearInterval(iv); resolve(cacheProdutos); }
                else if (tries > 100) { clearInterval(iv); reject(new Error('Timeout')); }
            }, 100);
        });
    }
    carregandoProdutos = true;
    return fetch('../data/produtos.json')
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function (data) { cacheProdutos = data; carregandoProdutos = false; return data; })
        .catch(function (err) { carregandoProdutos = false; cacheProdutos = {}; throw err; });
}

function buscarProdutoPorCodigo(codigo) {
    return carregarBaseProdutos().then(function (dados) {
        var codigoNum = Number(codigo);
        var codigoStr = String(codigo).trim();
        var chaves = Object.keys(dados);
        for (var c = 0; c < chaves.length; c++) {
            var lista = dados[chaves[c]];
            if (!Array.isArray(lista)) continue;
            for (var i = 0; i < lista.length; i++) {
                var item = lista[i];
                // Aceita tanto "Código" (com acento) quanto "Codigo"
                var itemCod = item['Código'] !== undefined ? item['Código'] : item['Codigo'];
                if (itemCod === undefined) continue;
                if (Number(itemCod) === codigoNum || String(itemCod).trim() === codigoStr) return item;
            }
        }
        return null;
    });
}

function buscarProdutoAPI(codigo, index) {
    if (!codigo) return;
    mostrarOverlay('overlayBuscaProduto');
    buscarProdutoPorCodigo(codigo)
        .then(function (produto) {
            esconderOverlay('overlayBuscaProduto');
            if (!produto) {
                produtos[index].descricao = '';
                produtos[index].valorUnitario = '';
                produtos[index].valorTotal = '';
                var dc = document.querySelector('.produto-descricao[data-index="' + index + '"]');
                var vu = document.querySelector('.produto-valor-unitario[data-index="' + index + '"]');
                var vt = document.querySelector('.produto-valor-total[data-index="' + index + '"]');
                if (dc) dc.value = '';
                if (vu) vu.value = '';
                if (vt) vt.value = '';
                showToast('Produto não encontrado. Código: ' + codigo, 'error');
                return;
            }
            produtos[index].descricao = produto['Descrição'] || produto['Descricao'] || '';
            var precoRaw = produto['Total à vista'] || produto['Total a vista'] || 0;
            var preco = parseFloat(String(precoRaw).replace(',', '.')) || 0;
            produtos[index].valorUnitario = preco > 0 ? preco.toFixed(2) : '';
            if (produtos[index].quantidade) recalcularTotal(index);

            var dEl = document.querySelector('.produto-descricao[data-index="' + index + '"]');
            var uEl = document.querySelector('.produto-valor-unitario[data-index="' + index + '"]');
            var tEl = document.querySelector('.produto-valor-total[data-index="' + index + '"]');
            if (dEl) dEl.value = produtos[index].descricao;
            if (uEl) uEl.value = produtos[index].valorUnitario;
            if (tEl) tEl.value = produtos[index].valorTotal ? 'R$ ' + formatarMoeda(produtos[index].valorTotal) : '';

            showToast('Produto: ' + (produtos[index].descricao || codigo), 'success');
            verificarEAdicionarNovoProduto(index);
            atualizarTotalGeral();
            atualizarProgresso();
        })
        .catch(function (err) {
            console.error('Busca produto:', err);
            esconderOverlay('overlayBuscaProduto');
            showToast('Erro ao acessar produtos.json', 'error');
        });
}

// ========================
// MÁSCARAS
// ========================
function aplicarMascaraCPF(e) {
    var v = e.target.value.replace(/\D/g, '');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d)/, '$1.$2');
    v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    e.target.value = v;
}

function capitalizarNome(e) {
    e.target.value = e.target.value.toLowerCase().split(' ').map(function (p) {
        return p.length > 0 ? p.charAt(0).toUpperCase() + p.slice(1) : p;
    }).join(' ');
}

function handleOutraCompra(e) {
    var nv = document.getElementById('novoPV');
    if (e.target.value === 'Sim') { nv.disabled = false; nv.focus(); }
    else { nv.disabled = true; nv.value = ''; }
}

// ========================
// PROGRESSO
// ========================
function atualizarProgresso() {
    var preenchidos = 0;
    var total = camposObrigatorios.length + 1;
    for (var i = 0; i < camposObrigatorios.length; i++) {
        if (document.getElementById(camposObrigatorios[i]).value.trim()) preenchidos++;
    }
    if (isProdutosObrigatoriosPreenchidos()) preenchidos++;
    var pct = Math.round((preenchidos / total) * 100);
    var fill = document.getElementById('progressBarFill');
    var pEl  = document.getElementById('progressPercentage');
    if (fill) {
        fill.style.width = pct + '%';
        if (pct === 100)     fill.style.background = 'linear-gradient(90deg,#10b981,#059669)';
        else if (pct >= 50)  fill.style.background = 'linear-gradient(90deg,#f59e0b,#d97706)';
        else                 fill.style.background = 'linear-gradient(90deg,#ef4444,#dc2626)';
    }
    if (pEl) pEl.textContent = pct + '%';
}

// ========================
// GERAÇÃO DE PDF
// ========================
function gerarPDF(emBranco) {
    mostrarOverlay('overlayLoading');

    function loadTimbre(url) {
        if (timbreCache) return Promise.resolve(timbreCache);
        return new Promise(function (resolve, reject) {
            var img = new Image();
            img.crossOrigin = 'Anonymous';
            img.onload = function () { timbreCache = img; resolve(img); };
            img.onerror = reject;
            img.src = url;
        });
    }

    function obterLocal() {
        var fil = document.getElementById('filial').value.trim();
        if (fil && FILIAIS[fil]) {
            var p = FILIAIS[fil].split('-');
            return { cidade: p[0] || 'Fortaleza', uf: p[1] || 'CE' };
        }
        var c = document.getElementById('cidade').value.trim();
        var u = document.getElementById('estado').value.trim();
        return { cidade: c || 'Fortaleza', uf: u || 'CE' };
    }

    loadTimbre('../image/declaracaonova.png')
        .catch(function () { return null; })
        .then(function (timbre) {
            var local = obterLocal();
            try {
                var jsPDF = window.jspdf.jsPDF;
                var doc = new jsPDF();
                var campos = {
                    nfe:        document.getElementById('numeroNFe').value.trim(),
                    nomeCliente:document.getElementById('nomeCliente').value.trim(),
                    cpf:        document.getElementById('cpf').value.trim(),
                    endereco:   document.getElementById('endereco').value.trim(),
                    numero:     document.getElementById('numero').value.trim(),
                    bairro:     document.getElementById('bairro').value.trim(),
                    cidadeForm: document.getElementById('cidade').value.trim(),
                    ufForm:     document.getElementById('estado').value.trim(),
                    pv:         document.getElementById('pv').value.trim(),
                    cupom:      document.getElementById('cupomNFe').value.trim(),
                    filial:     document.getElementById('filial').value.trim(),
                    novaCompra: document.getElementById('outraCompra').value.trim(),
                    novoPV:     document.getElementById('novoPV').value.trim(),
                    motivo:     document.getElementById('motivoDevolucao').value.trim()
                };

                if (timbre) doc.addImage(timbre, 'PNG', 0, 0, 210, 297);

                doc.setFont('times', 'bold');
                doc.setFontSize(16);
                doc.text('DECLARAÇÃO', 105, 40, { align: 'center' });
                doc.setFont('times', 'normal');
                doc.setFontSize(12);
                var nfeTexto = emBranco ? '___________' : (campos.nfe || '___________');
                doc.text('Declaro para fins de comprovação junto à SEFAZ – Secretaria da Fazenda do Estado do Ceará, que através da NF-e de devolução Nº ' + nfeTexto + ', devolvo o(s) produto(s) abaixo relacionado(s):', 15, 55, { maxWidth: 180, align: 'justify' });

                var prodsPDF = produtos.slice();
                while (prodsPDF.length < 6) prodsPDF.push({ codigo:'', descricao:'', quantidade:'', valorUnitario:'', valorTotal:'' });

                var prodBody = emBranco
                    ? Array(6).fill(['','','','',''])
                    : prodsPDF.slice(0, 6).map(function (p) {
                        return [p.codigo||'', p.descricao||'', p.quantidade||'',
                            p.valorUnitario ? 'R$ '+formatarMoeda(p.valorUnitario) : '',
                            p.valorTotal    ? 'R$ '+formatarMoeda(p.valorTotal)    : ''];
                    });

                doc.autoTable({
                    head: [['Código','Descrição','QTD','VR. Unit.','VR. Total']],
                    body: prodBody, startY: 75, theme: 'grid',
                    styles: { font:'times', fontSize:11, halign:'center', valign:'middle' },
                    headStyles: { fillColor:[200,200,200], textColor:0, fontStyle:'bold' }
                });

                var totalGeral = 0;
                for (var t = 0; t < produtos.length; t++) {
                    if (produtos[t].valorTotal) totalGeral += parseFloat(produtos[t].valorTotal);
                }

                var afterY = doc.lastAutoTable.finalY;
                if (!emBranco && totalGeral > 0) {
                    doc.setFont('times','bold'); doc.setFontSize(12);
                    doc.text('Total Devolvido: R$ '+formatarMoeda(totalGeral.toFixed(2)), 195, afterY+7, { align:'right' });
                    doc.setFont('times','normal');
                    afterY += 14;
                } else { afterY += 10; }

                var finalY = afterY, mX = 15, mW = 180;

                if (emBranco) {
                    doc.text('Cliente: _______________________________________________ CPF: _______________________', mX, finalY); finalY+=7;
                    doc.text('Endereço: ____________________________________________ Nº ____ Bairro: _______________', mX, finalY); finalY+=7;
                    doc.text('Cidade: ______________ Estado: ____ PV: ___________ Cupom/NF-e: ___________ Filial: ____', mX, finalY); finalY+=7;
                    doc.text('Cliente efetuou outra compra? ______ Novo PV: ___________ Motivo da devolução:', mX, finalY); finalY+=7;
                    doc.text('_______________________________________________________________________________', mX, finalY);
                } else {
                    var placeholders = {
                        nomeCliente:'_______________________________________________', cpf:'_______________________',
                        endereco:'______________________________________________', numero:'____', bairro:'_______________',
                        cidadeForm:'______________', ufForm:'____', pv:'___________', cupom:'___________',
                        filial:'____', novaCompra:'______', novoPV:'___________',
                        motivo:'_______________________________________________________________________________'
                    };
                    var linha = [
                        {label:'Cliente:', key:'nomeCliente'}, {label:'CPF:', key:'cpf'},
                        {label:'Endereço:', key:'endereco'}, {label:'Nº', key:'numero'},
                        {label:'Bairro:', key:'bairro'}, {label:'Cidade:', key:'cidadeForm'},
                        {label:'Estado:', key:'ufForm'}, {label:'PV:', key:'pv'},
                        {label:'Cupom/NF-e:', key:'cupom'}, {label:'Filial:', key:'filial'},
                        {label:'Cliente efetuou outra compra?', key:'novaCompra'},
                        {label:'Novo PV:', key:'novoPV'}, {label:'Motivo da devolução:', key:'motivo'}
                    ];
                    var x = mX, y = finalY;
                    for (var i = 0; i < linha.length; i++) {
                        var lbl = linha[i].label, key = linha[i].key;
                        var value = campos[key] ? campos[key].trim() : '';
                        var display = value;
                        if (key === 'novoPV') { if (campos.novaCompra !== 'Sim') display = ''; else if (!value) display = placeholders[key]; }
                        else { if (!value) display = placeholders[key]; }
                        if (!display) continue;
                        doc.setFont('times','bold');
                        var lw = doc.getTextWidth(lbl+' ');
                        if (x+lw > mX+mW) { x=mX; y+=7; }
                        doc.text(lbl+' ', x, y); x+=lw;
                        doc.setFont('times','normal');
                        var words = display.split(' ');
                        for (var w = 0; w < words.length; w++) {
                            var word = words[w]+' ';
                            var ww = doc.getTextWidth(word);
                            if (x+ww > mX+mW) { x=mX; y+=7; }
                            doc.text(word, x, y);
                            doc.line(x, y+0.8, x+ww, y+0.8);
                            x+=ww;
                        }
                        x+=2;
                    }
                    finalY = y+10;
                }

                finalY += 20;
                doc.text('Assinatura Cliente: ___________________________________________', mX, finalY); finalY+=15;
                doc.text('Assinatura Gerente: __________________________________________', mX, finalY); finalY+=20;

                var meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
                var now = new Date();
                doc.text(local.cidade+'-'+local.uf+', '+now.getDate()+' de '+meses[now.getMonth()]+' de '+now.getFullYear(), 105, finalY, { align:'center' });

                var blob = doc.output('blob');
                var url  = URL.createObjectURL(blob);
                var html = '<!DOCTYPE html><html><head><title>Declaração de Devolução</title></head><body style="margin:0"><iframe src="'+url+'" style="width:100vw;height:100vh;border:none;"></iframe></body></html>';
                var win  = window.open();
                if (!win || win.closed) {
                    esconderOverlay('overlayLoading');
                    showToast('Bloqueador de popup impediu a abertura. Verifique as configurações.', 'error');
                    return;
                }
                win.document.write(html);
                win.document.close();
                esconderOverlay('overlayLoading');
                showToast('PDF gerado com sucesso!', 'success');
            } catch (err) {
                console.error('gerarPDF:', err);
                esconderOverlay('overlayLoading');
                showToast('Erro ao gerar PDF. Tente novamente.', 'error');
            }
        })
        .catch(function (err) {
            console.error('loadTimbre:', err);
            esconderOverlay('overlayLoading');
            showToast('Erro ao gerar PDF. Tente novamente.', 'error');
        });
}

// ========================
// TOAST
// ========================
function showToast(message, type, duration) {
    if (!duration) duration = 3000;
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var icons = {
        success:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
    };
    var titles = { success:'Sucesso', error:'Erro', warning:'Atenção', info:'Informação' };
    var toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.innerHTML =
        '<div class="toast-icon">'+icons[type]+'</div>' +
        '<div class="toast-content"><div class="toast-title">'+titles[type]+'</div><div class="toast-message">'+escapeHtml(String(message))+'</div></div>' +
        '<div class="toast-progress" style="animation-duration:'+duration+'ms;"></div>';
    container.appendChild(toast);
    setTimeout(function () {
        toast.style.animation = 'slideRight .4s cubic-bezier(0.4,0,0.2,1) reverse';
        setTimeout(function () { if (container.contains(toast)) container.removeChild(toast); }, 400);
    }, duration);
}

function escapeHtml(str) {
    return String(str||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
