// ═══════════════════════════════════════════════════════════════════
// MOBILE.JS v3.0 — Self-contained, sem dependência do mobile-patch
// ═══════════════════════════════════════════════════════════════════
'use strict';

// ────────────────────────────────────────────────────────────────
// CONSTANTES
// ────────────────────────────────────────────────────────────────
const API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLic4iE63JAJ0j4KpGWfRFINeiD4uyCsMjfF_uLkUNzhOsJMzO4uiiZpWV3xzDjbduZK8kU_wWw3ZSCs6cODW2gdFnIGb6pZ0Lz0cBqMpiV-SBOJroENJHqO1XML_YRs_41KFfQOKEehUQmf-Xg6Xhh-bKiYpPxxwQhQzEMP5g0DdJHN4sgG_Fc9cdvRRU4abxlz_PzeQ_5eJ7NtCfxWuP-ET0DEzUyiWhWITlXMZKJMfwmZQg5--gKmAEGpwSr0yXi3eycr23BCGltlXGIWtYZ3I0WkWg&lib=M38uuBDbjNiNXY1lAK2DF9n3ltsPa6Ver';
const WORKER_URL = 'https://json-cartazes.gab-oliveirab27.workers.dev/json';
window.MOBILE_V3 = true; // sinaliza para mobile-patch.js não interferir

const FATORES = {
    carne:  { 1:1.0690,2:0.5523,3:0.3804,4:0.2946,5:0.2432,6:0.2091,7:0.1849,8:0.1668,9:0.1528,10:0.1417,11:0.1327,12:0.1252 },
    cartao: { 1:1.0292,2:0.5220,3:0.3530,4:0.2685,5:0.2179,6:0.1841,7:0.1600,8:0.1420,9:0.1280,10:0.1168,11:0.1076,12:0.1000 }
};

// ────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ────────────────────────────────────────────────────────────────
let carrinho      = [];
let produtosCache = [];
let currentTabIndex = 0;
let avistaOriginal  = 0;
let parcelaCalculada = false;

// Expor para compatibilidade com mobile-patch.js legado
window.carrinho      = carrinho;
window.produtosCache = produtosCache;

// ════════════════════════════════════════════════════════════════
// 1. UTILITÁRIOS — Formatação
// ════════════════════════════════════════════════════════════════
function brl(n) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(+n || 0);
}
function formatarMoeda(v) { return brl(v); }

function parseCurrency(val) {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    const limpo = String(val).replace(/[R$\s\u00A0]/g,'').replace(/\./g,'').replace(',','.');
    const n = parseFloat(limpo);
    return isNaN(n) ? 0 : n;
}

function formatCurrency(val) {
    const n = typeof val === 'string' ? parseCurrency(val) : val;
    return n.toFixed(2).replace('.',',').replace(/\B(?=(\d{3})+(?!\d))/g,'.');
}

function limparValor(val) {
    return parseFloat(String(val).replace(/[^\d,]/g,'').replace(',','.')) || 0;
}

function arredondar90(valor) {
    const num = Number(valor);
    if (!isFinite(num) || num <= 0) return 0;
    const centavos = Math.floor(num * 100);
    const k = Math.floor((centavos - 90) / 100);
    return Math.max(0, k * 100 + 90) / 100;
}

function formatarMilhar(n) {
    return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function formatDate(s) {
    if (!s) return '';
    const [y,m,d] = s.split('-');
    return `${d}/${m}/${y}`;
}

function formatDateExtended(s) {
    if (!s) return '';
    const [y,m,d] = s.split('-');
    const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
    return `Oferta válida até ${parseInt(d)} de ${meses[parseInt(m)-1]} de ${y}`;
}

// Expor globalmente
window.limparValor = limparValor;
window.parseCurrency = parseCurrency;
window.formatCurrency = formatCurrency;

// ════════════════════════════════════════════════════════════════
// 2. TOAST — Notificações
// ════════════════════════════════════════════════════════════════
const TOAST_ICONS = {
    success: 'fa-circle-check',
    error:   'fa-circle-xmark',
    warning: 'fa-triangle-exclamation',
    info:    'fa-circle-info'
};

function showToast(type, title, message, duration = 3500) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
        <div class="toast-icon-wrap"><i class="fa-solid ${TOAST_ICONS[type] || TOAST_ICONS.info}"></i></div>
        <div class="toast-body">
            <div class="toast-title">${title}</div>
            <div class="toast-message">${message}</div>
        </div>
        <div class="toast-progress" style="animation-duration:${duration}ms"></div>`;

    container.appendChild(toast);

    const dismiss = () => {
        if (toast.dataset.dismissing) return;
        toast.dataset.dismissing = '1';
        toast.classList.add('leaving');
        setTimeout(() => toast.remove(), 280);
    };
    const t = setTimeout(dismiss, duration);
    toast.addEventListener('click', () => { clearTimeout(t); dismiss(); });
}

// Alias compat
window.showToast = showToast;
function showToastEnhanced(type, title, message) { showToast(type, title, message); }
window.showToastEnhanced = showToastEnhanced;

// ════════════════════════════════════════════════════════════════
// 3. TEMA — Claro / Escuro
// ════════════════════════════════════════════════════════════════
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-icon').forEach(ic => {
        ic.className = `fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'} theme-icon`;
    });
    const lbl = document.getElementById('drawer-theme-label');
    if (lbl) lbl.textContent = theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro';
}

function toggleTheme() {
    const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem('mobile-theme', next);
    showToast('info', `Tema ${next === 'dark' ? 'escuro' : 'claro'} ativado`, 'Preferência salva automaticamente', 2000);
}

function initTheme() {
    applyTheme(localStorage.getItem('mobile-theme') || 'light');
}

// ════════════════════════════════════════════════════════════════
// 4. DRAWER LATERAL
// ════════════════════════════════════════════════════════════════
function openDrawer() {
    document.getElementById('side-drawer').classList.add('open');
    document.getElementById('drawer-overlay').classList.add('open');
    document.body.style.overflow = 'hidden';
}
function closeDrawer() {
    document.getElementById('side-drawer').classList.remove('open');
    document.getElementById('drawer-overlay').classList.remove('open');
    document.body.style.overflow = '';
}

function initDrawer() {
    const hamburger = document.getElementById('btn-hamburger');
    const overlay   = document.getElementById('drawer-overlay');
    const btnCalc   = document.getElementById('drawer-btn-calc');
    const btnTheme  = document.getElementById('drawer-btn-theme');
    const btnHelp   = document.getElementById('drawer-btn-help');
    const btnThemeH = document.getElementById('btn-theme');

    hamburger?.addEventListener('click', openDrawer);
    overlay?.addEventListener('click', closeDrawer);

    btnCalc?.addEventListener('click', () => {
        closeDrawer();
        setTimeout(() => switchToTab('calculadora'), 160);
    });
    btnTheme?.addEventListener('click', () => {
        toggleTheme();
        // não fecha o drawer
    });
    btnHelp?.addEventListener('click', () => {
        closeDrawer();
        setTimeout(() => abrirModal('modal-help'), 200);
    });
    btnThemeH?.addEventListener('click', toggleTheme);

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
}

// ════════════════════════════════════════════════════════════════
// 5. NAVEGAÇÃO — Bottom Nav Circular (expande/retrai)
// ════════════════════════════════════════════════════════════════
const TAB_ORDER = ['criar-cartaz', 'calculadora', 'json'];

function switchToTab(tabId, skipAnim) {
    const newIdx = TAB_ORDER.indexOf(tabId);
    if (newIdx === -1 || newIdx === currentTabIndex) return;

    const dir = newIdx > currentTabIndex ? 'right' : 'left';

    // Desativa todos
    document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(tc => {
        tc.classList.remove('active', 'slide-in-right', 'slide-in-left');
    });

    // Ativa novo botão nav
    const navBtn = document.querySelector(`.tab-item[data-tab="${tabId}"]`);
    navBtn?.classList.add('active');

    // Ativa e anima conteúdo
    const content = document.getElementById(`tab-${tabId}`);
    if (content) {
        content.classList.add('active');
        if (!skipAnim) {
            const cls = `slide-in-${dir}`;
            content.classList.add(cls);
            content.addEventListener('animationend', () => content.classList.remove(cls), { once: true });
        }
    }

    currentTabIndex = newIdx;

    // Scroll para o topo do conteúdo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNav() {
    document.querySelectorAll('.tab-item').forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            if (tab) switchToTab(tab);
        });
    });
}

// ════════════════════════════════════════════════════════════════
// 6. SEARCH OVERLAY — 3 fases: loading → success/error
// ════════════════════════════════════════════════════════════════
const SOV = {
    el:       null,
    iconWrap: null,
    title:    null,
    sub:      null,
    product:  null,

    init() {
        this.el       = document.getElementById('search-overlay');
        this.iconWrap = document.getElementById('sov-icon-wrap');
        this.title    = document.getElementById('sov-title');
        this.sub      = document.getElementById('sov-sub');
        this.product  = document.getElementById('sov-product');
    },

    show(state, title, sub, productName) {
        if (!this.el) return;
        // Reset
        this.iconWrap.className = `sov-icon-wrap ${state}`;
        this.iconWrap.innerHTML = state === 'loading'
            ? '<div class="sov-spinner"></div>'
            : `<i class="fa-solid ${state === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>`;

        this.title.textContent = title;
        this.sub.textContent   = sub;

        if (productName) {
            this.product.textContent = productName;
            this.product.style.display = 'block';
        } else {
            this.product.style.display = 'none';
        }

        this.el.classList.add('active');
    },

    hide(delay = 0) {
        if (!this.el) return;
        setTimeout(() => {
            this.el.classList.remove('active');
        }, delay);
    }
};

// ════════════════════════════════════════════════════════════════
// 7. MODAIS
// ════════════════════════════════════════════════════════════════
function abrirModal(id) {
    const m = document.getElementById(id);
    if (m) m.style.display = 'flex';
}

window.fecharModalBusca = function() {
    document.getElementById('modal-busca').style.display = 'none';
};
window.fecharModalJSONViewer = function() {
    document.getElementById('modal-json-viewer').style.display = 'none';
};
window.fecharModalHelp = function() {
    document.getElementById('modal-help').style.display = 'none';
};

// Fechar modal ao clicar no overlay
document.addEventListener('click', e => {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.style.display = 'none';
    }
});

// ════════════════════════════════════════════════════════════════
// 8. MÁSCARAS DE MOEDA
// ════════════════════════════════════════════════════════════════
function aplicarMascaraMoeda(input) {
    if (!input || input._maskApplied) return;
    input._maskApplied = true;
    input.addEventListener('input', e => {
        let val = e.target.value.replace(/\D/g, '');
        val = (val / 100).toFixed(2);
        e.target.value = val.replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    });
}

function preencherInputMoeda(input, valor) {
    // Preenche sem disparar o event listener
    if (!input) return;
    input.value = formatCurrency(valor);
}

// ════════════════════════════════════════════════════════════════
// 9. CARRINHO — Persistência
// ════════════════════════════════════════════════════════════════
function carregarCarrinho() {
    try {
        const raw = localStorage.getItem('carrinho_mobile');
        if (raw) {
            carrinho = JSON.parse(raw);
            window.carrinho = carrinho;
        }
    } catch(e) { carrinho = []; }
    atualizarCarrinho();
}

function salvarCarrinho() {
    window.carrinho = carrinho;
    try { localStorage.setItem('carrinho_mobile', JSON.stringify(carrinho)); } catch(e) {}
    atualizarCarrinho();
}

function atualizarCarrinho() {
    const count   = carrinho.length;
    const badge   = document.getElementById('cart-count');
    const total   = document.getElementById('cart-total');
    const actions = document.getElementById('json-actions');

    if (badge) { badge.textContent = count; badge.style.display = count > 0 ? 'flex' : 'none'; }
    if (total) total.textContent = count;
    if (actions) actions.style.display = count > 0 ? 'flex' : 'none';

    renderizarCarrinho();
}

function renderizarCarrinho() {
    const container = document.getElementById('cart-list');
    if (!container) return;

    if (carrinho.length === 0) {
        container.innerHTML = `
            <div class="empty-cart">
                <i class="fa-solid fa-layer-group"></i>
                <h3>JSON vazio</h3>
                <p>Adicione cartazes usando a aba Criar Cartaz</p>
            </div>`;
        return;
    }

    container.innerHTML = carrinho.map(item => `
        <div class="cart-item">
            <div class="cart-item-header">
                <span class="cart-item-code">${item.codigo}</span>
                <button class="cart-item-remove" onclick="removerItem(${item.id})" aria-label="Remover">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="cart-item-title">${item.descricao}</div>
            ${item.subdescricao ? `<div class="cart-item-subtitle">${item.subdescricao}</div>` : ''}
            ${item.features?.length ? `
                <div class="cart-item-features">
                    ${item.features.map(f => `<span class="cart-item-feature">${f}</span>`).join('')}
                </div>` : ''}
            <div class="cart-item-footer">
                <div class="cart-item-info">
                    <span class="cart-item-label">Parcelamento</span>
                    <span class="cart-item-value">${item.metodo}</span>
                </div>
                <div class="cart-item-info">
                    <span class="cart-item-label">À vista</span>
                    <span class="cart-item-value">${brl(item.avista)}</span>
                </div>
                <div class="cart-item-info">
                    <span class="cart-item-label">Taxa</span>
                    <span class="cart-item-value">${item.juros === 'carne' ? 'Carnê' : item.juros === 'cartao' ? 'Cartão' : item.juros === 'virado' ? 'Virado' : 'S/ juros'}</span>
                </div>
                ${item.parcela ? `
                <div class="cart-item-info">
                    <span class="cart-item-label">Parcela</span>
                    <span class="cart-item-value">${brl(item.parcela)}</span>
                </div>` : ''}
            </div>
        </div>`).join('');
}

function removerItem(id) {
    const item = carrinho.find(i => i.id === id);
    carrinho = carrinho.filter(i => i.id !== id);
    salvarCarrinho();
    showToast('success', 'Removido', item ? `"${item.descricao.substring(0,28)}" removido` : 'Item removido');
}
window.removerItem = removerItem;

// ════════════════════════════════════════════════════════════════
// 10. BUSCA DE PRODUTO — API + Modal texto
// ════════════════════════════════════════════════════════════════
async function fetchAPI() {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), 12000);
    try {
        const resp = await fetch(API_URL, { signal: controller.signal, cache: 'no-cache' });
        clearTimeout(tid);
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    } catch(e) {
        clearTimeout(tid);
        throw e;
    }
}

function buscarNaDados(dados, codigo) {
    let encontrado = null;
    ['Gabriel', 'Júlia', 'Giovana'].forEach(aba => {
        if (dados[aba] && !encontrado) {
            const item = dados[aba].find(i => String(i.Código) === String(codigo));
            if (item) encontrado = item;
        }
    });
    return encontrado;
}

function carregarProdutosNoCache(dados) {
    if (produtosCache.length > 0) return;
    ['Gabriel', 'Júlia', 'Giovana'].forEach(aba => {
        if (!dados[aba]) return;
        dados[aba].forEach(item => {
            produtosCache.push({
                codigo:     String(item.Código),
                descricao:  item.Descrição || '',
                avista:     item['Total à vista'],
                garantia12: item['Tot. G.E 12'] || null,
                garantia24: item['Tot. G.E 24'] || null,
                garantia36: item['Tot. G.E 36'] || null
            });
        });
    });
    window.produtosCache = produtosCache;
}

async function buscarProdutoPorCodigo(codigo) {
    SOV.show('loading', 'Buscando produto', `Procurando código ${codigo}...`);

    try {
        const dados = await fetchAPI();
        carregarProdutosNoCache(dados);
        const item = buscarNaDados(dados, codigo);

        if (item) {
            const nome = (item.Descrição || '').split(' - ')[0].trim();
            SOV.show('success', 'Produto encontrado!', 'Preenchendo campos...', nome);
            await sleep(800);
            preencherFormularioDeAPI(item);
            SOV.hide(400);
            showToast('success', 'Produto encontrado', `Dados de "${nome.substring(0,30)}" preenchidos`);
        } else {
            SOV.show('error', 'Não encontrado', `Código ${codigo} não está na base de dados`);
            await sleep(1600);
            SOV.hide();
            showToast('warning', 'Produto não encontrado', 'Preencha os dados manualmente');
        }
    } catch (e) {
        const isTimeout = e.name === 'AbortError';
        SOV.show('error',
            isTimeout ? 'Tempo esgotado' : 'Erro de conexão',
            isTimeout ? 'O servidor demorou demais. Tente novamente.' : 'Verifique sua internet.');
        await sleep(1800);
        SOV.hide();
        showToast('error', 'Erro na busca', isTimeout ? 'Servidor demorou. Tente novamente.' : 'Verifique sua conexão.');
    }
}
window.buscarProdutoPorCodigo = buscarProdutoPorCodigo;

function preencherFormularioDeAPI(item) {
    const partes = (item.Descrição || '').split(' - ');
    document.getElementById('descricao').value    = (partes[0] || '').trim().toUpperCase();
    document.getElementById('subdescricao').value = (partes[1] || '').trim().toUpperCase();

    const avista = parseCurrency(item['Total à vista']);
    const avistaEl = document.getElementById('avista');
    preencherInputMoeda(avistaEl, avista);

    // Garantias
    if (item['Tot. G.E 12']) preencherInputMoeda(document.getElementById('garantia12'), parseCurrency(item['Tot. G.E 12']));
    if (item['Tot. G.E 24']) preencherInputMoeda(document.getElementById('garantia24'), parseCurrency(item['Tot. G.E 24']));
    if (item['Tot. G.E 36']) preencherInputMoeda(document.getElementById('garantia36'), parseCurrency(item['Tot. G.E 36']));

    avistaOriginal = avista;
    recalcularParcela();
}

function preencherFormulario(produto) {
    document.getElementById('codigo').value = produto.codigo || '';
    const partes = (produto.descricao || '').split(' - ');
    document.getElementById('descricao').value    = (partes[0] || '').trim().toUpperCase();
    document.getElementById('subdescricao').value = (partes[1] || '').trim().toUpperCase();

    if (produto.avista) {
        const v = parseCurrency(produto.avista);
        preencherInputMoeda(document.getElementById('avista'), v);
        avistaOriginal = v;
    }
    if (produto.garantia12) preencherInputMoeda(document.getElementById('garantia12'), parseCurrency(produto.garantia12));
    if (produto.garantia24) preencherInputMoeda(document.getElementById('garantia24'), parseCurrency(produto.garantia24));
    if (produto.garantia36) preencherInputMoeda(document.getElementById('garantia36'), parseCurrency(produto.garantia36));

    recalcularParcela();
}

// Modal de busca por texto
async function abrirModalBusca() {
    abrirModal('modal-busca');

    const loading = document.getElementById('busca-loading');
    const results = document.getElementById('busca-results');
    const empty   = document.getElementById('busca-empty');
    const count   = document.getElementById('busca-count');

    loading.style.display = 'block';
    results.innerHTML = '';
    empty.style.display = 'none';
    count.style.display = 'none';

    if (produtosCache.length === 0) {
        try {
            const dados = await fetchAPI();
            carregarProdutosNoCache(dados);
        } catch(e) {
            loading.style.display = 'none';
            showToast('error', 'Erro', 'Não foi possível carregar os produtos');
            return;
        }
    }

    loading.style.display = 'none';
    renderizarResultados(produtosCache);

    // Campo de busca — recriar para limpar listeners antigos
    const oldInput = document.getElementById('busca-input');
    const newInput = oldInput.cloneNode(true);
    oldInput.parentNode.replaceChild(newInput, oldInput);
    newInput.value = '';
    newInput.focus();

    const clearBtn = document.getElementById('busca-clear');

    newInput.addEventListener('input', () => {
        const q = newInput.value.toLowerCase().trim();
        clearBtn.style.display = q ? 'block' : 'none';
        if (!q) { renderizarResultados(produtosCache); return; }
        const res = produtosCache.filter(p =>
            p.codigo.toLowerCase().includes(q) ||
            p.descricao.toLowerCase().includes(q)
        );
        renderizarResultados(res);
    });

    clearBtn?.addEventListener('click', () => {
        newInput.value = '';
        clearBtn.style.display = 'none';
        renderizarResultados(produtosCache);
        newInput.focus();
    });
}

function renderizarResultados(lista) {
    const results = document.getElementById('busca-results');
    const empty   = document.getElementById('busca-empty');
    const count   = document.getElementById('busca-count');

    if (!lista.length) {
        results.innerHTML = '';
        empty.style.display = 'block';
        count.style.display = 'none';
        return;
    }

    empty.style.display = 'none';
    const slice = lista.slice(0, 60);
    count.textContent = `${lista.length} produto(s) encontrado(s)`;
    count.style.display = 'block';

    results.innerHTML = slice.map(p => `
        <div class="busca-item" onclick="selecionarProduto('${p.codigo}')">
            <div class="busca-item-code">${p.codigo}</div>
            <div class="busca-item-nome">${p.descricao}</div>
            ${p.marca ? `<div class="busca-item-marca">${p.marca}</div>` : ''}
        </div>`).join('');
}

function selecionarProduto(codigo) {
    const p = produtosCache.find(x => x.codigo === codigo);
    if (!p) return;
    document.getElementById('codigo').value = p.codigo;
    preencherFormulario(p);
    fecharModalBusca();
    showToast('success', 'Produto selecionado', `"${p.descricao.substring(0,30)}" carregado no formulário`);
}
window.selecionarProduto = selecionarProduto;

// ════════════════════════════════════════════════════════════════
// 11. CAMPOS EXTRAS CONDICIONAIS & RECALCULAR PARCELA
// ════════════════════════════════════════════════════════════════
function setupFormCondicional() {
    const metodoSel  = document.getElementById('metodo');
    const jurosEl    = document.getElementById('juros');
    const avistaEl   = document.getElementById('avista');
    const parcelaEl  = document.getElementById('parcela');

    const grupoJuros     = document.getElementById('grupo-juros');
    const grupoParcela   = document.getElementById('form-group-parcela');
    const grupoSemJuros  = document.getElementById('grupo-sem-juros');
    const extraCampos    = document.getElementById('extra-campos');
    const campoMotivo    = document.getElementById('campo-motivo');
    const campoValidade  = document.getElementById('campo-validade');
    const campoAut       = document.getElementById('campo-autorizacao');
    const parcelaLabel   = document.getElementById('parcela-label');

    const grupoAvista = document.getElementById('grupo-avista');

    function onMetodoChange() {
        const m = metodoSel.value;

        // Esconde tudo e vai reabilitando conforme necessário
        grupoJuros.style.display    = 'none';
        grupoParcela.style.display  = 'none';
        grupoSemJuros.style.display = 'none';
        avistaEl.removeAttribute('readonly');
        avistaEl.removeAttribute('disabled');
        extraCampos.style.display   = 'none';
        campoMotivo.style.display   = 'none';
        campoValidade.style.display = 'none';
        campoAut.style.display      = 'none';

        if (m === '1x') {
            // Só mostra avista, sem taxa, sem parcela
            grupoAvista.style.display = 'flex';
        } else if (m === '3x' || m === '5x' || m === '10x') {
            // Sem juros: usuário digita parcela, avista é calculado
            grupoAvista.style.display   = 'flex';
            grupoParcela.style.display  = 'block';
            grupoSemJuros.style.display = 'block';
            if (parcelaLabel) parcelaLabel.textContent = 'Valor da parcela *';
            // Ava-vista fica readonly e é calculado
            avistaEl.setAttribute('readonly', 'true');
        } else if (m === '12x') {
            // Com juros: calcular pelo fator
            grupoJuros.style.display   = 'block';
            grupoParcela.style.display = 'block';
            if (parcelaLabel) parcelaLabel.textContent = 'Valor da parcela (calculado)';
        }

        recalcularParcela();
    }

    function onJurosChange() {
        const j = jurosEl.value;
        // Campos extras por tipo de juros
        extraCampos.style.display   = 'none';
        campoMotivo.style.display   = 'none';
        campoValidade.style.display = 'none';
        campoAut.style.display      = 'none';

        if (j === 'cartao') {
            extraCampos.style.display  = 'block';
            campoValidade.style.display = 'block';
        } else if (j === 'virado') {
            extraCampos.style.display = 'block';
            campoMotivo.style.display = 'block';
            campoAut.style.display    = 'block';
        }
        recalcularParcela();
    }

    metodoSel?.addEventListener('change', onMetodoChange);
    jurosEl?.addEventListener('change', onJurosChange);
    avistaEl?.addEventListener('input', () => {
        if (!avistaEl.hasAttribute('disabled')) recalcularParcela();
        detectarInconsistencia();
    });
    parcelaEl?.addEventListener('input', () => {
        const m = metodoSel.value;
        if (m === '3x' || m === '5x' || m === '10x') {
            // Calcula avista a partir da parcela
            const parcela = limparValor(parcelaEl.value);
            const n = parseInt(m);
            if (parcela > 0) {
                const avista = parcela * n;
                preencherInputMoeda(avistaEl, avista);
            }
        }
    });
}

function recalcularParcela() {
    const m = document.getElementById('metodo')?.value;
    const j = document.getElementById('juros')?.value;
    const avistaEl  = document.getElementById('avista');
    const parcelaEl = document.getElementById('parcela');
    if (!m || !avistaEl || !parcelaEl) return;

    if (m === '1x') { parcelaEl.value = ''; return; }
    if (m === '3x' || m === '5x' || m === '10x') {
        // Parcela é input do usuário — avista calculado
        return;
    }
    if (m === '12x') {
        if (!j) return;
        const avista = limparValor(avistaEl.value);
        if (avista <= 0) return;
        if (j === 'virado') { parcelaEl.value = ''; return; }
        const tipo = j === 'carne' ? 'carne' : 'cartao';
        const fator = FATORES[tipo]?.[12];
        if (!fator) return;
        const p = arredondar90(avista * fator);
        preencherInputMoeda(parcelaEl, p);
        parcelaCalculada = true;
        avistaOriginal   = avista;
    }
}
window.recalcularParcela = recalcularParcela;

function detectarInconsistencia() {
    const avistaEl = document.getElementById('avista');
    if (!avistaEl) return;
    const atual = limparValor(avistaEl.value);
    const warn  = document.getElementById('parcela-warning');
    if (!warn) return;
    if (avistaOriginal > 0 && atual !== avistaOriginal && parcelaCalculada) {
        warn.classList.add('active');
    } else {
        warn.classList.remove('active');
    }
}

window.recalcularParcelaManual = function() {
    recalcularParcela();
    const w = document.getElementById('parcela-warning');
    if (w) w.classList.remove('active');
    const av = document.getElementById('avista');
    if (av) avistaOriginal = limparValor(av.value);
    showToast('success', 'Recalculado!', 'Parcela atualizada com o novo valor à vista');
};

// ════════════════════════════════════════════════════════════════
// 12. GARANTIA ESTENDIDA — Colapsável
// ════════════════════════════════════════════════════════════════
function setupGarantia() {
    const btnToggle = document.getElementById('btn-garantia-toggle');
    const fields    = document.getElementById('garantia-fields');
    const arrow     = document.getElementById('garantia-arrow');
    const g12 = document.getElementById('garantia12');
    const g24 = document.getElementById('garantia24');
    const g36 = document.getElementById('garantia36');

    btnToggle?.addEventListener('click', () => {
        const open = fields.style.display !== 'none';
        fields.style.display = open ? 'none' : 'block';
        arrow?.classList.toggle('open', !open);
    });

    g12?.addEventListener('input', () => {
        const v = limparValor(g12.value);
        if (v > 0) {
            g24.disabled = false;
        } else {
            g24.value = ''; g24.disabled = true;
            g36.value = ''; g36.disabled = true;
        }
    });

    g24?.addEventListener('input', () => {
        const v = limparValor(g24.value);
        if (v > 0) { g36.disabled = false; }
        else { g36.value = ''; g36.disabled = true; }
    });
}

// ════════════════════════════════════════════════════════════════
// 13. FORMULÁRIO — Adicionar Cartaz
// ════════════════════════════════════════════════════════════════
function setupFormSubmit() {
    document.getElementById('mobile-form')?.addEventListener('submit', e => {
        e.preventDefault();

        const codigo      = document.getElementById('codigo').value.trim();
        const descricao   = document.getElementById('descricao').value.trim().toUpperCase();
        const subdescricao= document.getElementById('subdescricao').value.trim().toUpperCase();
        const f1 = document.getElementById('feature-1').value.trim();
        const f2 = document.getElementById('feature-2').value.trim();
        const f3 = document.getElementById('feature-3').value.trim();
        const metodo  = document.getElementById('metodo').value;
        const juros   = document.getElementById('juros').value;
        const semJuros = document.getElementById('chk-sem-juros')?.checked || false;
        const motivo  = document.getElementById('motivo').value.trim();
        const validade= document.getElementById('validade').value.trim();
        const autorizacao = document.getElementById('autorizacao').value.trim();

        const g12 = limparValor(document.getElementById('garantia12').value);
        const g24 = limparValor(document.getElementById('garantia24').value);
        const g36 = limparValor(document.getElementById('garantia36').value);

        // Validações
        if (!codigo) { showToast('warning', 'Código obrigatório', 'Preencha o código do produto'); return; }
        if (!descricao) { showToast('warning', 'Descrição obrigatória', 'Preencha a descrição do produto'); return; }
        if (!metodo) { showToast('warning', 'Parcelamento obrigatório', 'Selecione o parcelamento'); return; }

        const avistaRaw   = document.getElementById('avista').value;
        const parcelaRaw  = document.getElementById('parcela').value;
        let avista  = limparValor(avistaRaw);
        let parcela = limparValor(parcelaRaw);

        if (avista <= 0) { showToast('warning', 'Valor inválido', 'Informe o valor à vista'); return; }

        if (metodo !== '1x') {
            if (!juros && metodo === '12x') { showToast('warning', 'Taxa obrigatória', 'Selecione a taxa de juros para 12x'); return; }
        }

        const features = [f1, f2, f3].filter(Boolean);

        // Para 1x: parcela = avista
        let jurosFinal = juros;
        if (metodo === '1x') {
            parcela    = avista;
            jurosFinal = '';
        }

        // Para 3x/5x/10x: avista é calculado a partir da parcela
        if (metodo === '3x' || metodo === '5x' || metodo === '10x') {
            if (parcela <= 0) { showToast('warning', 'Parcela obrigatória', `Informe o valor da parcela para ${metodo}`); return; }
            avista = parcela * parseInt(metodo);
            jurosFinal = '';
        }

        const item = {
            id: Date.now(),
            codigo, descricao, subdescricao, features,
            metodo, juros: jurosFinal, avista, parcela,
            motivo, validade, autorizacao,
            garantia12: g12, garantia24: g24, garantia36: g36,
            modelo: 'padrao',
            semJuros
        };

        carrinho.push(item);
        salvarCarrinho();

        // Reset form
        document.getElementById('mobile-form').reset();
        document.getElementById('grupo-juros').style.display    = 'none';
        document.getElementById('form-group-parcela').style.display = 'none';
        document.getElementById('grupo-sem-juros').style.display = 'none';
        document.getElementById('extra-campos').style.display   = 'none';
        document.getElementById('campo-motivo').style.display   = 'none';
        document.getElementById('campo-validade').style.display = 'none';
        document.getElementById('campo-autorizacao').style.display = 'none';
        document.getElementById('garantia-fields').style.display = 'none';
        document.getElementById('garantia-arrow')?.classList.remove('open');
        document.getElementById('garantia24').disabled = true;
        document.getElementById('garantia36').disabled = true;
        avistaOriginal = 0; parcelaCalculada = false;

        showToast('success', 'Cartaz adicionado!', `"${descricao.substring(0,28)}" adicionado ao JSON`);
        switchToTab('json');
    });
}

// ════════════════════════════════════════════════════════════════
// 14. CALCULADORA DE FATOR
// ════════════════════════════════════════════════════════════════
function setupCalculadora() {
    document.getElementById('calculator-form')?.addEventListener('submit', e => {
        e.preventDefault();
        const valStr = document.getElementById('calc-valor').value.trim();
        const tipo   = document.getElementById('calc-tipo').value;

        if (!valStr || !tipo) { showToast('error', 'Preencha todos os campos', ''); return; }

        const valor  = limparValor(valStr);
        if (valor <= 0) { showToast('error', 'Valor inválido', 'Informe um valor maior que zero'); return; }

        document.getElementById('result-valor').textContent = brl(valor);
        document.getElementById('result-tipo').textContent  = tipo === 'carne' ? 'Carnê' : 'Cartão';

        const tbody = document.getElementById('result-tbody');
        tbody.innerHTML = '';

        for (let n = 1; n <= 12; n++) {
            const fator   = FATORES[tipo][n];
            const parcela = valor * fator;
            const total   = parcela * n;
            const arred   = arredondar90(parcela);

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${n}x</td>
                <td>${fator.toFixed(4)}</td>
                <td class="highlight">${brl(arred)}</td>
                <td>${brl(total)}</td>`;
            tbody.appendChild(tr);
        }

        document.getElementById('calc-result').style.display = 'block';
        setTimeout(() => document.getElementById('calc-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
    });
}

// ════════════════════════════════════════════════════════════════
// 15. ENVIO JSON — Console visual
// ════════════════════════════════════════════════════════════════
function gerarJSON() {
    return {
        versao:        '1.0',
        origem:        'mobile',
        dataGeracao:   new Date().toISOString(),
        totalCartazes: carrinho.length,
        cartazes: carrinho.map(item => ({
            id:          item.id,
            codigo:      item.codigo,
            descricao:   item.descricao,
            subdescricao:item.subdescricao || '',
            features:    item.features,
            metodo:      item.metodo,
            juros:       item.juros || '',
            avista:      item.avista,
            parcela:     item.parcela || 0,
            motivo:      item.motivo || '',
            validade:    item.validade || '',
            autorizacao: item.autorizacao || '',
            garantia12:  item.garantia12 || 0,
            garantia24:  item.garantia24 || 0,
            garantia36:  item.garantia36 || 0,
            modelo:      item.modelo || 'padrao',
            semJuros:    item.semJuros || false
        }))
    };
}
window.gerarJSON = gerarJSON;

async function uploadJsonToWorker(payload) {
    const controller = new AbortController();
    const tid = setTimeout(function() { controller.abort(); }, 18000);
    let res;
    try {
        res = await fetch(WORKER_URL, {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify(payload),
            signal:  controller.signal
        });
    } finally {
        clearTimeout(tid);
    }
    const text = await res.text();
    let parsed = null;
    try { parsed = JSON.parse(text); } catch(parseErr) { /* body não é JSON */ }
    if (!res.ok) {
        const errMsg = (parsed && parsed.error) ? parsed.error : (text ? text.substring(0, 200) : ('HTTP ' + res.status));
        throw new Error(errMsg);
    }
    return (parsed !== null && parsed !== undefined) ? parsed : { raw: text };
}
window.uploadJsonToWorker = uploadJsonToWorker;

// Console visual
function consoleLog(text, type = 'normal') {
    const body = document.getElementById('console-body');
    if (!body) return;
    const line = document.createElement('div');
    line.className = 'console-line';
    line.innerHTML = `
        <span class="console-prompt">›</span>
        <span class="console-text ${type === 'error' ? 'error' : type === 'success' ? 'success' : ''}">${text}</span>
        ${type === 'normal' ? '<span class="console-cursor"></span>' : ''}`;
    body.appendChild(line);
    body.scrollTop = body.scrollHeight;
}

function consoleClear() {
    const body = document.getElementById('console-body');
    if (body) body.innerHTML = '';
}

function consoleShowActions(sucesso) {
    const actions = document.getElementById('console-actions');
    if (!actions) return;
    actions.style.display = 'flex';
    if (sucesso) {
        actions.innerHTML = `<button class="primary" onclick="fecharConsole()"><i class="fa-solid fa-check"></i> Concluído</button>`;
    } else {
        actions.innerHTML = `
            <button onclick="tentarEnviarNovamente()"><i class="fa-solid fa-rotate-right"></i> Tentar novamente</button>
            <button onclick="verCopiarJSON()"><i class="fa-solid fa-eye"></i> Ver JSON</button>`;
    }
}

function abrirConsole() {
    const el = document.getElementById('console-overlay');
    if (el) { el.style.display = 'flex'; consoleClear(); }
}

window.fecharConsole = function() {
    const el = document.getElementById('console-overlay');
    if (el) el.style.display = 'none';
};
window.tentarEnviarNovamente = function() {
    fecharConsole();
    setTimeout(() => document.getElementById('btn-enviar-json')?.click(), 100);
};
window.verCopiarJSON = function() {
    fecharConsole();
    document.getElementById('btn-ver-copiar-json')?.click();
};

function setupAcoesJSON() {
    // ── Enviar JSON ──
    document.getElementById('btn-enviar-json')?.addEventListener('click', async () => {
        if (carrinho.length === 0) {
            showToast('warning', 'JSON vazio', 'Adicione cartazes antes de enviar');
            return;
        }

        // ── Lê e valida authSession com null-safety total ──
        let user   = '';
        let filial = '';
        try {
            const raw = localStorage.getItem('authSession');
            if (!raw) throw new Error('authSession não encontrada no localStorage');
            const sess = JSON.parse(raw);
            if (!sess || typeof sess !== 'object') throw new Error('authSession inválida (não é objeto)');
            user   = String(sess.user   || sess.username || sess.email  || '').trim();
            filial = String(sess.filial || sess.branch   || sess.store  || '').trim();
        } catch(sessErr) {
            console.error('[Envio] authSession error:', sessErr);
            showToast('error', 'Sessão inválida', 'Faça login novamente. (' + sessErr.message + ')');
            return;
        }

        if (!user || !filial) {
            showToast('error', 'Sessão incompleta',
                'user: "' + (user || 'VAZIO') + '" | filial: "' + (filial || 'VAZIO') + '"');
            return;
        }

        // ── Abre console e prepara payload ──
        abrirConsole();
        const actionsEl = document.getElementById('console-actions');
        if (actionsEl) actionsEl.style.display = 'none';
        consoleClear();
        consoleLog('Preparando envio...');

        const payload = { user: user, filial: filial, data: gerarJSON() };

        await sleep(500);
        consoleLog('Enviando ' + carrinho.length + ' cartaz(es) → ' + WORKER_URL.split('/')[2] + '...');

        await sleep(350);
        consoleLog('Aguardando resposta do servidor...');

        try {
            const resultado = await uploadJsonToWorker(payload);
            await sleep(450);
            consoleClear();
            consoleLog('Upload concluído com sucesso!', 'success');
            const fileName = resultado && resultado.fileName ? resultado.fileName : null;
            if (fileName) consoleLog('Arquivo: ' + fileName, 'success');
            consoleLog('Cartazes enviados: ' + carrinho.length, 'success');
            await sleep(500);
            consoleShowActions(true);
            showToast('success', 'Enviado com sucesso!', carrinho.length + ' cartaz(es) enviados');
        } catch (err) {
            await sleep(350);
            consoleClear();
            const isTimeout = err.name === 'AbortError';
            const msg = isTimeout
                ? 'Tempo esgotado — servidor demorou demais'
                : (err.message || 'Erro desconhecido no envio');
            consoleLog('ERRO: ' + msg, 'error');
            consoleLog('Verifique sua conexão e tente novamente', 'error');
            await sleep(350);
            consoleShowActions(false);
            showToast('error', 'Falha no envio', msg);
        }
    });

    // ── Ver / Copiar ──
    document.getElementById('btn-ver-copiar-json')?.addEventListener('click', () => {
        const json = JSON.stringify(gerarJSON(), null, 2);
        document.getElementById('json-viewer-content').textContent = json;
        abrirModal('modal-json-viewer');
    });

    // ── Limpar ──
    document.getElementById('btn-limpar-json')?.addEventListener('click', () => {
        if (!confirm('Deseja realmente limpar todos os cartazes?')) return;
        carrinho = [];
        salvarCarrinho();
        showToast('success', 'Limpo!', 'Todos os cartazes foram removidos');
    });

    // ── Copiar do modal ──
    document.getElementById('btn-copiar-json-modal')?.addEventListener('click', () => {
        const text = document.getElementById('json-viewer-content').textContent;
        const copiar = () => {
            showToast('success', 'Copiado!', 'JSON copiado para a área de transferência');
            fecharModalJSONViewer();
        };
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(copiar).catch(function() { copiarFallback(text, copiar); });
        } else {
            copiarFallback(text, copiar);
        }
    });
}

function copiarFallback(text, cb) {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); cb(); } catch(copyErr) { /* silencioso */ }
    document.body.removeChild(ta);
}

// ════════════════════════════════════════════════════════════════
// 16. DESCRIÇÃO — Contador de caracteres
// ════════════════════════════════════════════════════════════════
function setupDescricaoCheck() {
    const desc  = document.getElementById('descricao');
    const erro  = document.getElementById('descricao-erro');
    desc?.addEventListener('input', () => {
        if (desc.value.length > 35) {
            erro.style.display = 'block';
            desc.style.borderColor = 'var(--danger)';
        } else {
            erro.style.display = 'none';
            desc.style.borderColor = '';
        }
    });
}

// ════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO — DOMContentLoaded
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    // Tema
    initTheme();

    // Drawer
    initDrawer();

    // Navegação
    initNav();

    // Search overlay
    SOV.init();

    // Carrinho
    carregarCarrinho();

    // Máscaras de moeda
    ['avista','parcela','calc-valor','garantia12','garantia24','garantia36'].forEach(id => {
        const el = document.getElementById(id);
        if (el) aplicarMascaraMoeda(el);
    });

    // Botão buscar
    document.getElementById('btn-buscar')?.addEventListener('click', async () => {
        const cod = document.getElementById('codigo').value.trim();
        if (cod) {
            await buscarProdutoPorCodigo(cod);
        } else {
            await abrirModalBusca();
        }
    });

    // Enter no campo código
    document.getElementById('codigo')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn-buscar')?.click(); }
    });

    // Formulário condicional
    setupFormCondicional();

    // Garantia estendida
    setupGarantia();

    // Submit
    setupFormSubmit();

    // Calculadora
    setupCalculadora();

    // Ações JSON
    setupAcoesJSON();

    // Descrição check
    setupDescricaoCheck();

});