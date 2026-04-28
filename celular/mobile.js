// ═══════════════════════════════════════════════════════════════════
// MOBILE.JS v4.0 — Tax checkbox · Campanha · Send overlay moderno
// ═══════════════════════════════════════════════════════════════════
'use strict';

// ────────────────────────────────────────────────────────────────
// CONSTANTES
// ────────────────────────────────────────────────────────────────
const API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLic4iE63JAJ0j4KpGWfRFINeiD4uyCsMjfF_uLkUNzhOsJMzO4uiiZpWV3xzDjbduZK8kU_wWw3ZSCs6cODW2gdFnIGb6pZ0Lz0cBqMpiV-SBOJroENJHqO1XML_YRs_41KFfQOKEehUQmf-Xg6Xhh-bKiYpPxxwQhQzEMP5g0DdJHN4sgG_Fc9cdvRRU4abxlz_PzeQ_5eJ7NtCfxWuP-ET0DEzUyiWhWITlXMZKJMfwmZQg5--gKmAEGpwSr0yXi3eycr23BCGltlXGIWtYZ3I0WkWg&lib=M38uuBDbjNiNXY1lAK2DF9n3ltsPa6Ver';
const WORKER_URL = 'https://json-cartazes.gab-oliveirab27.workers.dev/json';
window.MOBILE_V3 = true;

const FATORES = {
  carne:  { 1:1.0690,2:0.5523,3:0.3804,4:0.2946,5:0.2432,6:0.2091,7:0.1849,8:0.1668,9:0.1528,10:0.1417,11:0.1327,12:0.1252 },
  cartao: { 1:1.0292,2:0.5220,3:0.3530,4:0.2685,5:0.2179,6:0.1841,7:0.1600,8:0.1420,9:0.1280,10:0.1168,11:0.1076,12:0.1000 }
};

const METODOS_TAXA_OPCIONAL = ['1x', '3x', '5x', '10x'];

// ────────────────────────────────────────────────────────────────
// ESTADO GLOBAL
// ────────────────────────────────────────────────────────────────
let carrinho      = [];
let produtosCache = [];
let currentTabIndex = 0;
let avistaOriginal   = 0;
let parcelaCalculada = false;

window.carrinho      = carrinho;
window.produtosCache = produtosCache;

// ════════════════════════════════════════════════════════════════
// 1. UTILITÁRIOS
// ════════════════════════════════════════════════════════════════
function brl(n) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(+n || 0);
}

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

function formatDate(s) {
  if (!s) return '';
  const [y,m,d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateExtended(fim, ini) {
  if (!fim) return '';
  const [fy,fm,fd] = fim.split('-');
  const meses = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro'];
  if (ini) {
    const [,im,id] = ini.split('-');
    return `Oferta válida de ${parseInt(id)}/${im} até ${parseInt(fd)}/${fm}/${String(fy).slice(-2)}`;
  }
  return `Oferta válida até ${parseInt(fd)} de ${meses[parseInt(fm)-1]} de ${fy}`;
}

window.limparValor   = limparValor;
window.parseCurrency = parseCurrency;
window.formatCurrency = formatCurrency;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ════════════════════════════════════════════════════════════════
// 2. TOAST
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

window.showToast = showToast;

// ════════════════════════════════════════════════════════════════
// 3. TEMA
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
  showToast('info', `Tema ${next === 'dark' ? 'escuro' : 'claro'} ativado`, 'Preferência salva', 2000);
}

function initTheme() { applyTheme(localStorage.getItem('mobile-theme') || 'light'); }

// ════════════════════════════════════════════════════════════════
// 4. DRAWER
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
  document.getElementById('btn-hamburger')?.addEventListener('click', openDrawer);
  document.getElementById('drawer-overlay')?.addEventListener('click', closeDrawer);
  document.getElementById('drawer-btn-calc')?.addEventListener('click', () => {
    closeDrawer(); setTimeout(() => switchToTab('calculadora'), 160);
  });
  document.getElementById('drawer-btn-theme')?.addEventListener('click', toggleTheme);
  document.getElementById('drawer-btn-help')?.addEventListener('click', () => {
    closeDrawer(); setTimeout(() => abrirModal('modal-help'), 200);
  });
  document.getElementById('btn-theme')?.addEventListener('click', toggleTheme);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });
}

// ════════════════════════════════════════════════════════════════
// 5. NAVEGAÇÃO
// ════════════════════════════════════════════════════════════════
const TAB_ORDER = ['criar-cartaz', 'calculadora', 'json'];

function switchToTab(tabId, skipAnim) {
  const newIdx = TAB_ORDER.indexOf(tabId);
  if (newIdx === -1 || newIdx === currentTabIndex) return;
  const dir = newIdx > currentTabIndex ? 'right' : 'left';
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(tc => {
    tc.classList.remove('active', 'slide-in-right', 'slide-in-left');
  });
  document.querySelector(`.tab-item[data-tab="${tabId}"]`)?.classList.add('active');
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
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function initNav() {
  document.querySelectorAll('.tab-item').forEach(btn => {
    btn.addEventListener('click', () => { const tab = btn.dataset.tab; if (tab) switchToTab(tab); });
  });
}

// ════════════════════════════════════════════════════════════════
// 6. SEARCH OVERLAY (busca por código)
// ════════════════════════════════════════════════════════════════
const SOV = {
  el: null, iconWrap: null, title: null, sub: null, product: null,
  init() {
    this.el       = document.getElementById('search-overlay');
    this.iconWrap = document.getElementById('sov-icon-wrap');
    this.title    = document.getElementById('sov-title');
    this.sub      = document.getElementById('sov-sub');
    this.product  = document.getElementById('sov-product');
  },
  show(state, title, sub, productName) {
    if (!this.el) return;
    this.iconWrap.className = `sov-icon-wrap ${state}`;
    this.iconWrap.innerHTML = state === 'loading'
      ? '<div class="sov-spinner"></div>'
      : `<i class="fa-solid ${state === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'}"></i>`;
    this.title.textContent = title;
    this.sub.textContent   = sub;
    if (productName) { this.product.textContent = productName; this.product.style.display = 'block'; }
    else { this.product.style.display = 'none'; }
    this.el.classList.add('active');
  },
  hide(delay = 0) {
    if (!this.el) return;
    setTimeout(() => this.el.classList.remove('active'), delay);
  }
};

// ════════════════════════════════════════════════════════════════
// 7. MODAIS
// ════════════════════════════════════════════════════════════════
function abrirModal(id) {
  const m = document.getElementById(id);
  if (m) m.style.display = 'flex';
}

window.fecharModalBusca = function() { document.getElementById('modal-busca').style.display = 'none'; };
window.fecharModalJSONViewer = function() { document.getElementById('modal-json-viewer').style.display = 'none'; };
window.fecharModalHelp = function() { document.getElementById('modal-help').style.display = 'none'; };

document.addEventListener('click', e => {
  if (e.target.classList.contains('modal-overlay')) e.target.style.display = 'none';
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
  if (!input) return;
  input.value = formatCurrency(valor);
}

// ════════════════════════════════════════════════════════════════
// 9. CARRINHO
// ════════════════════════════════════════════════════════════════
function carregarCarrinho() {
  try {
    const raw = localStorage.getItem('carrinho_mobile');
    if (raw) { carrinho = JSON.parse(raw); window.carrinho = carrinho; }
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

  const jurosLabel = j => j === 'carne' ? 'Carnê' : j === 'cartao' ? 'Cartão' : j === 'virado' ? 'Virado' : 'S/ juros';

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
      ${item.campanha ? `
        <div class="cart-item-features" style="margin-top:2px;">
          <span class="cart-item-feature" style="background:var(--warning-bg);color:var(--warning);border-color:rgba(245,158,11,.3);">
            <i class="fa-solid fa-bullhorn" style="font-size:9px;"></i> ${item.campanha}
          </span>
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
          <span class="cart-item-value">${jurosLabel(item.juros)}</span>
        </div>
        ${item.parcela ? `
        <div class="cart-item-info">
          <span class="cart-item-label">Parcela</span>
          <span class="cart-item-value">${brl(item.parcela)}</span>
        </div>` : ''}
        ${item.validade ? `
        <div class="cart-item-info" style="grid-column: 1 / -1;">
          <span class="cart-item-label">Validade</span>
          <span class="cart-item-value" style="font-size:11px;">${formatDateExtended(item.validade, item.validadeInicio)}</span>
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
// 10. BUSCA DE PRODUTO — API
// ════════════════════════════════════════════════════════════════
async function fetchAPI() {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 12000);
  try {
    const resp = await fetch(API_URL, { signal: controller.signal, cache: 'no-cache' });
    clearTimeout(tid);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return await resp.json();
  } catch(e) { clearTimeout(tid); throw e; }
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
        codigo:    String(item.Código),
        descricao: item.Descrição || '',
        avista:    item['Total à vista'],
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
  } catch(e) {
    const isTimeout = e.name === 'AbortError';
    SOV.show('error', isTimeout ? 'Tempo esgotado' : 'Erro de conexão',
      isTimeout ? 'O servidor demorou demais.' : 'Verifique sua internet.');
    await sleep(1800);
    SOV.hide();
    showToast('error', 'Erro na busca', isTimeout ? 'Tente novamente.' : 'Verifique sua conexão.');
  }
}
window.buscarProdutoPorCodigo = buscarProdutoPorCodigo;

function preencherFormularioDeAPI(item) {
  const partes = (item.Descrição || '').split(' - ');
  document.getElementById('descricao').value    = (partes[0] || '').trim().toUpperCase();
  document.getElementById('subdescricao').value = (partes[1] || '').trim().toUpperCase();
  const avista = parseCurrency(item['Total à vista']);
  preencherInputMoeda(document.getElementById('avista'), avista);
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
      p.codigo.toLowerCase().includes(q) || p.descricao.toLowerCase().includes(q));
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
    </div>`).join('');
}

function selecionarProduto(codigo) {
  const p = produtosCache.find(x => x.codigo === codigo);
  if (!p) return;
  document.getElementById('codigo').value = p.codigo;
  preencherFormulario(p);
  fecharModalBusca();
  showToast('success', 'Produto selecionado', `"${p.descricao.substring(0,30)}" carregado`);
}
window.selecionarProduto = selecionarProduto;

// ════════════════════════════════════════════════════════════════
// 11. CAMPOS CONDICIONAIS & RECÁLCULO DE PARCELA
// ════════════════════════════════════════════════════════════════
function setupFormCondicional() {
  const metodoSel     = document.getElementById('metodo');
  const jurosEl       = document.getElementById('juros');
  const avistaEl      = document.getElementById('avista');
  const parcelaEl     = document.getElementById('parcela');
  const chkHabTaxa    = document.getElementById('chk-habilitar-taxa');

  const grupoHabTaxa  = document.getElementById('grupo-habilitar-taxa');
  const grupoJuros    = document.getElementById('grupo-juros');
  const grupoParcela  = document.getElementById('form-group-parcela');
  const grupoSemJuros = document.getElementById('grupo-sem-juros');
  const taxaToggleName= document.getElementById('taxa-toggle-name');

  const extraCampos   = document.getElementById('extra-campos');
  const campoMotivo   = document.getElementById('campo-motivo');
  const campoValidade = document.getElementById('campo-validade');
  const campoAut      = document.getElementById('campo-autorizacao');
  const campoCampanha = document.getElementById('grupo-campanha-toggle');

  function resetExtras() {
    extraCampos.style.display = 'none';
    campoMotivo.style.display = 'none';
    campoValidade.style.display = 'none';
    campoAut.style.display = 'none';
  }

  function onMetodoChange() {
    const m = metodoSel.value;
    const taxaOpc = METODOS_TAXA_OPCIONAL.includes(m);

    // Reset visual
    grupoHabTaxa.style.display  = 'none';
    grupoJuros.style.display    = 'none';
    grupoParcela.style.display  = 'none';
    grupoSemJuros.style.display = 'none';
    avistaEl.removeAttribute('readonly');
    avistaEl.removeAttribute('disabled');
    resetExtras();

    // Campanha: sempre disponível
    if (campoCampanha) campoCampanha.style.display = m ? 'block' : 'none';

    if (!m) return;

    if (taxaOpc) {
      // Mostrar toggle de taxa
      grupoHabTaxa.style.display = 'block';
      if (taxaToggleName) taxaToggleName.textContent = `Aplicar taxa em ${m}`;

      const taxaAtiva = chkHabTaxa?.checked;

      if (taxaAtiva) {
        grupoJuros.style.display   = 'block';
        grupoParcela.style.display = 'block';
        jurosEl.disabled = false;
        parcelaEl.removeAttribute('readonly');
      } else {
        // Sem taxa: parcela = avista/n (readonly)
        jurosEl.disabled = true;
        jurosEl.value    = '';
        if (m !== '1x') {
          grupoParcela.style.display = 'block';
          parcelaEl.setAttribute('readonly', 'true');
        }
      }

      // "Sem juros!" apenas para 3x/5x/10x sem taxa ativa
      if (m !== '1x' && !taxaAtiva) {
        grupoSemJuros.style.display = 'block';
      }

    } else if (m === '12x') {
      grupoJuros.style.display   = 'block';
      grupoParcela.style.display = 'block';
      jurosEl.disabled = false;
      parcelaEl.removeAttribute('readonly');
    }

    recalcularParcela();
  }

  function onTaxaChange() {
    onMetodoChange(); // re-roda toda a lógica de UI
    recalcularParcela();
  }

  function onJurosChange() {
    const j = jurosEl.value;
    resetExtras();
    if (j === 'cartao') {
      extraCampos.style.display   = 'block';
      campoValidade.style.display = 'block';
    } else if (j === 'virado') {
      extraCampos.style.display = 'block';
      campoMotivo.style.display = 'block';
      campoAut.style.display    = 'block';
    }
    recalcularParcela();
  }

  metodoSel?.addEventListener('change', onMetodoChange);
  chkHabTaxa?.addEventListener('change', onTaxaChange);
  jurosEl?.addEventListener('change', onJurosChange);

  avistaEl?.addEventListener('input', () => {
    recalcularParcela();
    detectarInconsistencia();
  });
}

function recalcularParcela() {
  const m          = document.getElementById('metodo')?.value;
  const j          = document.getElementById('juros')?.value;
  const chkHabTaxa = document.getElementById('chk-habilitar-taxa');
  const taxaAtiva  = chkHabTaxa?.checked;
  const avistaEl   = document.getElementById('avista');
  const parcelaEl  = document.getElementById('parcela');
  if (!m || !avistaEl || !parcelaEl) return;

  const avista = limparValor(avistaEl.value);
  const taxaOpc = METODOS_TAXA_OPCIONAL.includes(m);

  if (m === '1x') {
    if (!taxaAtiva) {
      // 1x à vista: parcela = avista (readonly)
      preencherInputMoeda(parcelaEl, avista);
      parcelaEl.setAttribute('readonly', 'true');
    } else if (j && avista > 0) {
      if (j === 'virado') { parcelaEl.value = ''; return; }
      const tipo = j === 'carne' ? 'carne' : 'cartao';
      const fator = FATORES[tipo]?.[1];
      if (fator) preencherInputMoeda(parcelaEl, arredondar90(avista * fator));
      parcelaEl.removeAttribute('readonly');
    }
    return;
  }

  if (taxaOpc) {
    const n = parseInt(m);
    if (!taxaAtiva) {
      // Sem taxa: parcela = avista / n
      if (avista > 0) preencherInputMoeda(parcelaEl, Math.round((avista / n) * 100) / 100);
      parcelaEl.setAttribute('readonly', 'true');
    } else if (j && avista > 0) {
      if (j === 'virado') { parcelaEl.value = ''; return; }
      const tipo = j === 'carne' ? 'carne' : 'cartao';
      const fator = FATORES[tipo]?.[n];
      if (fator) { preencherInputMoeda(parcelaEl, arredondar90(avista * fator)); parcelaCalculada = true; avistaOriginal = avista; }
      parcelaEl.removeAttribute('readonly');
    }
    return;
  }

  if (m === '12x') {
    if (!j) return;
    if (avista <= 0) return;
    if (j === 'virado') { parcelaEl.value = ''; return; }
    const tipo = j === 'carne' ? 'carne' : 'cartao';
    const fator = FATORES[tipo]?.[12];
    if (!fator) return;
    preencherInputMoeda(parcelaEl, arredondar90(avista * fator));
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
  } else { warn.classList.remove('active'); }
}

window.recalcularParcelaManual = function() {
  recalcularParcela();
  document.getElementById('parcela-warning')?.classList.remove('active');
  const av = document.getElementById('avista');
  if (av) avistaOriginal = limparValor(av.value);
  showToast('success', 'Recalculado!', 'Parcela atualizada com o novo valor à vista');
};

// ════════════════════════════════════════════════════════════════
// 12. CAMPANHA TOGGLE
// ════════════════════════════════════════════════════════════════
function setupCampanhaToggle() {
  const chk   = document.getElementById('chk-campanha');
  const campo = document.getElementById('campo-campanha-input');
  if (!chk || !campo) return;
  chk.addEventListener('change', () => {
    campo.style.display = chk.checked ? 'block' : 'none';
    if (!chk.checked) { const inp = document.getElementById('campanha'); if (inp) inp.value = ''; }
  });
}

// ════════════════════════════════════════════════════════════════
// 13. FORMULÁRIO — Adicionar Cartaz
// ════════════════════════════════════════════════════════════════
function setupFormSubmit() {
  document.getElementById('mobile-form')?.addEventListener('submit', e => {
    e.preventDefault();

    const codigo       = document.getElementById('codigo').value.trim();
    const descricao    = document.getElementById('descricao').value.trim().toUpperCase();
    const subdescricao = document.getElementById('subdescricao').value.trim().toUpperCase();
    const f1 = document.getElementById('feature-1').value.trim();
    const f2 = document.getElementById('feature-2').value.trim();
    const f3 = document.getElementById('feature-3').value.trim();
    const metodo      = document.getElementById('metodo').value;
    const juros       = document.getElementById('juros').value;
    const chkHabTaxa  = document.getElementById('chk-habilitar-taxa');
    const taxaAtiva   = chkHabTaxa?.checked || false;
    const semJuros    = document.getElementById('chk-sem-juros')?.checked || false;
    const campanha    = (document.getElementById('campanha')?.value || '').trim().toUpperCase();
    const motivo      = document.getElementById('motivo').value.trim();
    const validade    = document.getElementById('validade').value.trim();
    const validadeInicio = (document.getElementById('validade-inicio')?.value || '').trim();
    const autorizacao = document.getElementById('autorizacao').value.trim();

    // Validações
    if (!codigo)    { showToast('warning', 'Código obrigatório', 'Preencha o código'); return; }
    if (!descricao) { showToast('warning', 'Descrição obrigatória', 'Preencha a descrição'); return; }
    if (!metodo)    { showToast('warning', 'Parcelamento obrigatório', 'Selecione o parcelamento'); return; }

    const avistaRaw  = document.getElementById('avista').value;
    const parcelaRaw = document.getElementById('parcela').value;
    let avista  = limparValor(avistaRaw);
    let parcela = limparValor(parcelaRaw);

    if (avista <= 0) { showToast('warning', 'Valor inválido', 'Informe o valor à vista'); return; }

    const taxaOpc = METODOS_TAXA_OPCIONAL.includes(metodo);
    if (metodo === '12x' && !juros) { showToast('warning', 'Taxa obrigatória', 'Selecione a taxa para 12x'); return; }
    if (taxaOpc && taxaAtiva && !juros) { showToast('warning', 'Taxa obrigatória', 'Selecione a taxa de juros'); return; }

    const features = [f1, f2, f3].filter(Boolean);

    // Calcular valores finais
    let jurosFinal = juros;
    if (metodo === '1x' && !taxaAtiva) {
      parcela    = avista;
      jurosFinal = '';
    } else if (taxaOpc && !taxaAtiva) {
      // parcela = avista / n
      const n = parseInt(metodo);
      parcela    = Math.round((avista / n) * 100) / 100;
      jurosFinal = '';
    }

    if (parcela <= 0 && metodo !== '1x') {
      showToast('warning', 'Parcela inválida', 'A parcela não pôde ser calculada'); return;
    }

    const item = {
      id: Date.now(),
      codigo, descricao, subdescricao, features,
      metodo, juros: jurosFinal, avista, parcela,
      motivo, validade, validadeInicio, autorizacao,
      campanha,
      // Garantia removida do mobile — enviamos zeros para compatibilidade
      garantia12: 0, garantia24: 0, garantia36: 0,
      modelo: 'padrao',
      semJuros,
      // Campos de estilo com defaults
      negritoSubdesc: false,
      moverValidade: false,
      layoutPersonalizado: '',
      posicaoGarantia: 'hp',
    };

    carrinho.push(item);
    salvarCarrinho();

    // Reset form
    document.getElementById('mobile-form').reset();
    document.getElementById('grupo-habilitar-taxa').style.display = 'none';
    document.getElementById('grupo-juros').style.display    = 'none';
    document.getElementById('form-group-parcela').style.display = 'none';
    document.getElementById('grupo-sem-juros').style.display = 'none';
    document.getElementById('grupo-campanha-toggle').style.display = 'none';
    document.getElementById('campo-campanha-input').style.display  = 'none';
    document.getElementById('extra-campos').style.display   = 'none';
    document.getElementById('campo-motivo').style.display   = 'none';
    document.getElementById('campo-validade').style.display = 'none';
    document.getElementById('campo-autorizacao').style.display = 'none';
    if (document.getElementById('juros')) document.getElementById('juros').disabled = false;
    avistaOriginal = 0; parcelaCalculada = false;

    showToast('success', 'Cartaz adicionado!', `"${descricao.substring(0,28)}" adicionado ao JSON`);
    switchToTab('json');
  });
}

// ════════════════════════════════════════════════════════════════
// 14. CALCULADORA
// ════════════════════════════════════════════════════════════════
function setupCalculadora() {
  document.getElementById('calculator-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const valStr = document.getElementById('calc-valor').value.trim();
    const tipo   = document.getElementById('calc-tipo').value;
    if (!valStr || !tipo) { showToast('error', 'Preencha todos os campos', ''); return; }
    const valor = limparValor(valStr);
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
      const tr      = document.createElement('tr');
      tr.innerHTML  = `<td>${n}x</td><td>${fator.toFixed(4)}</td><td class="highlight">${brl(arred)}</td><td>${brl(total)}</td>`;
      tbody.appendChild(tr);
    }
    document.getElementById('calc-result').style.display = 'block';
    setTimeout(() => document.getElementById('calc-result').scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 80);
  });
}

// ════════════════════════════════════════════════════════════════
// 15. GERAR JSON
// ════════════════════════════════════════════════════════════════
function gerarJSON() {
  return {
    versao:        '1.0',
    origem:        'mobile',
    dataGeracao:   new Date().toISOString(),
    totalCartazes: carrinho.length,
    cartazes: carrinho.map(item => ({
      id:                  item.id,
      codigo:              item.codigo,
      descricao:           item.descricao,
      subdescricao:        item.subdescricao || '',
      features:            item.features,
      metodo:              item.metodo,
      juros:               item.juros || '',
      avista:              item.avista,
      parcela:             item.parcela || 0,
      motivo:              item.motivo || '',
      validade:            item.validade || '',
      validadeInicio:      item.validadeInicio || '',
      autorizacao:         item.autorizacao || '',
      campanha:            item.campanha || '',
      garantia12:          0,
      garantia24:          0,
      garantia36:          0,
      modelo:              item.modelo || 'padrao',
      semJuros:            item.semJuros || false,
      negritoSubdesc:      item.negritoSubdesc || false,
      moverValidade:       item.moverValidade || false,
      layoutPersonalizado: item.layoutPersonalizado || '',
      posicaoGarantia:     item.posicaoGarantia || 'hp',
    }))
  };
}
window.gerarJSON = gerarJSON;

async function uploadJsonToWorker(payload) {
  const controller = new AbortController();
  const tid = setTimeout(() => controller.abort(), 18000);
  let res;
  try {
    res = await fetch(WORKER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
      signal:  controller.signal
    });
  } finally { clearTimeout(tid); }
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch(e) {}
  if (!res.ok) {
    const errMsg = (parsed?.error) ? parsed.error : (text ? text.substring(0,200) : `HTTP ${res.status}`);
    throw new Error(errMsg);
  }
  return parsed !== null ? parsed : { raw: text };
}
window.uploadJsonToWorker = uploadJsonToWorker;

// ════════════════════════════════════════════════════════════════
// 16. SEND OVERLAY — Animação de envio moderna
// ════════════════════════════════════════════════════════════════
const SEND = {
  overlay: null,
  dots:    [],
  lines:   [],
  iconWrap: null,
  title:    null,
  sub:      null,
  detail:   null,
  actions:  null,

  init() {
    this.overlay  = document.getElementById('send-overlay');
    this.dots     = [1,2,3].map(n => document.getElementById(`sdot-${n}`));
    this.lines    = [1,2].map(n => document.getElementById(`sline-${n}`));
    this.iconWrap = document.getElementById('send-icon-wrap');
    this.title    = document.getElementById('send-title');
    this.sub      = document.getElementById('send-sub');
    this.detail   = document.getElementById('send-detail');
    this.actions  = document.getElementById('send-actions');
  },

  open() {
    if (!this.overlay) return;
    this.overlay.classList.add('active');
    this.setStage('preparing');
  },

  close() {
    if (!this.overlay) return;
    this.overlay.classList.remove('active');
  },

  /** stage: 'preparing' | 'sending' | 'success' | 'error' */
  setStage(stage, data = {}) {
    if (!this.overlay) return;

    // Dots state
    const dotStates = {
      preparing: ['active', '', ''],
      sending:   ['done', 'active', ''],
      success:   ['done', 'done', 'done'],
      error:     ['done', 'done', 'error'],
    };
    const states = dotStates[stage] || dotStates.preparing;
    this.dots.forEach((dot, i) => {
      dot.className = 'send-step-dot' + (states[i] ? ` ${states[i]}` : '');
    });
    this.lines[0].classList.toggle('done', states[0] === 'done');
    this.lines[1].classList.toggle('done', states[1] === 'done');

    // Icon, title, sub
    switch (stage) {
      case 'preparing':
        this.iconWrap.innerHTML = `<div class="send-upload-pulse"><i class="fa-solid fa-box-open"></i></div>`;
        this.iconWrap.className = 'send-icon-wrap preparing';
        this.title.textContent  = 'Preparando envio';
        this.sub.textContent    = `${data.count || 0} cartaz(es) em fila…`;
        this.detail.classList.remove('visible');
        this.actions.classList.remove('visible');
        break;

      case 'sending':
        this.iconWrap.innerHTML = `
          <div class="send-upload-anim">
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <div class="send-upload-ring"></div>
          </div>`;
        this.iconWrap.className = 'send-icon-wrap sending';
        this.title.textContent  = 'Enviando para o servidor';
        this.sub.textContent    = 'Aguarde, transmitindo dados…';
        this.detail.classList.remove('visible');
        this.actions.classList.remove('visible');
        break;

      case 'success':
        this.iconWrap.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
        this.iconWrap.className = 'send-icon-wrap success';
        this.title.textContent  = 'Enviado com sucesso!';
        this.sub.textContent    = `${data.count || 0} cartaz(es) registrado(s) no servidor`;
        if (data.fileName) {
          this.detail.textContent = `📄 ${data.fileName}`;
          this.detail.classList.add('visible');
        }
        this.actions.innerHTML = `
          <button class="btn-primary btn-full" onclick="SEND.close();showToast('success','Pronto!','Cartazes enviados com sucesso.')">
            <i class="fa-solid fa-check"></i> Concluído
          </button>`;
        this.actions.classList.add('visible');
        break;

      case 'error':
        this.iconWrap.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i>`;
        this.iconWrap.className = 'send-icon-wrap error';
        this.title.textContent  = 'Falha no envio';
        this.sub.textContent    = data.message || 'Verifique sua conexão e tente novamente.';
        this.detail.classList.remove('visible');
        this.actions.innerHTML = `
          <button class="btn-primary btn-full" onclick="SEND.close();setTimeout(()=>document.getElementById('btn-enviar-json')?.click(),100)">
            <i class="fa-solid fa-rotate-right"></i> Tentar novamente
          </button>
          <button class="btn-secondary btn-full" onclick="SEND.close()">
            <i class="fa-solid fa-xmark"></i> Fechar
          </button>`;
        this.actions.classList.add('visible');
        break;
    }
  }
};

// ════════════════════════════════════════════════════════════════
// 17. AÇÕES DO JSON
// ════════════════════════════════════════════════════════════════
function setupAcoesJSON() {
  // ── Enviar JSON ──
  document.getElementById('btn-enviar-json')?.addEventListener('click', async () => {
    if (carrinho.length === 0) {
      showToast('warning', 'JSON vazio', 'Adicione cartazes antes de enviar');
      return;
    }

    // Lê sessão
    let user = '', filial = '';
    try {
      const raw = localStorage.getItem('authSession');
      if (!raw) throw new Error('authSession não encontrada');
      const sess = JSON.parse(raw);
      if (!sess || typeof sess !== 'object') throw new Error('authSession inválida');
      user   = String(sess.user   || sess.username || sess.email  || '').trim();
      filial = String(sess.filial || sess.branch   || sess.store  || '').trim();
    } catch(sessErr) {
      showToast('error', 'Sessão inválida', `Faça login novamente. (${sessErr.message})`);
      return;
    }

    if (!user || !filial) {
      showToast('error', 'Sessão incompleta', `user: "${user || 'VAZIO'}" | filial: "${filial || 'VAZIO'}"`);
      return;
    }

    // Abre overlay e inicia sequência
    SEND.open();
    SEND.setStage('preparing', { count: carrinho.length });

    const payload = { user, filial, data: gerarJSON() };

    await sleep(700);
    SEND.setStage('sending');

    try {
      const resultado = await uploadJsonToWorker(payload);
      await sleep(400);
      SEND.setStage('success', {
        count:    carrinho.length,
        fileName: resultado?.fileName || null,
      });
      showToast('success', 'Enviado!', `${carrinho.length} cartaz(es) enviados com sucesso`, 4000);
    } catch(err) {
      await sleep(300);
      const isTimeout = err.name === 'AbortError';
      SEND.setStage('error', {
        message: isTimeout ? 'Tempo esgotado — servidor demorou demais.' : (err.message || 'Erro desconhecido'),
      });
      showToast('error', 'Falha no envio', err.message || 'Erro desconhecido');
    }
  });

  // ── Ver / Copiar JSON ──
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
      navigator.clipboard.writeText(text).then(copiar).catch(() => copiarFallback(text, copiar));
    } else { copiarFallback(text, copiar); }
  });
}

function copiarFallback(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta); ta.select();
  try { document.execCommand('copy'); cb(); } catch(e) {}
  document.body.removeChild(ta);
}

// ════════════════════════════════════════════════════════════════
// 18. DESCRIÇÃO — Contador
// ════════════════════════════════════════════════════════════════
function setupDescricaoCheck() {
  const desc = document.getElementById('descricao');
  const erro  = document.getElementById('descricao-erro');
  desc?.addEventListener('input', () => {
    if (desc.value.length > 35) {
      if (erro) erro.style.display = 'block';
      desc.style.borderColor = 'var(--danger)';
    } else {
      if (erro) erro.style.display = 'none';
      desc.style.borderColor = '';
    }
  });
}

// ════════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initDrawer();
  initNav();
  SOV.init();
  SEND.init();
  carregarCarrinho();

  // Máscaras de moeda (sem garantia)
  ['avista', 'parcela', 'calc-valor'].forEach(id => {
    const el = document.getElementById(id);
    if (el) aplicarMascaraMoeda(el);
  });

  // Botão buscar
  document.getElementById('btn-buscar')?.addEventListener('click', async () => {
    const cod = document.getElementById('codigo').value.trim();
    if (cod) { await buscarProdutoPorCodigo(cod); }
    else      { await abrirModalBusca(); }
  });

  // Enter no código
  document.getElementById('codigo')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); document.getElementById('btn-buscar')?.click(); }
  });

  setupFormCondicional();
  setupCampanhaToggle();
  setupFormSubmit();
  setupCalculadora();
  setupAcoesJSON();
  setupDescricaoCheck();

  // Fechar send-overlay ao clicar no backdrop
  document.getElementById('send-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('send-overlay')) SEND.close();
  });
});
