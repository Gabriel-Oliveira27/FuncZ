'use strict';
// ════════════════════════════════════════════════════════════════════════════
//  MASS.JS v2.1 — Gerador de Cartazes em Massa
//  Depende de: script.js · dict.js · dict-box.js · mass-extra.css
//              Font Awesome 6, jsPDF, html2canvas
// ════════════════════════════════════════════════════════════════════════════

// ── §1 · LINK CSS ────────────────────────────────────────────────────────────
(function _linkCSS() {
  if (document.getElementById('mass-css-link')) return;
  const link = document.createElement('link');
  link.id   = 'mass-css-link';
  link.rel  = 'stylesheet';
  link.href = '../css/mass-extra.css';
  document.head.appendChild(link);
}());

// ── §2 · HTML ────────────────────────────────────────────────────────────────
(function _html() {
  if (document.getElementById('mass-overlay')) return;
  document.body.insertAdjacentHTML('beforeend', `

  <!-- ═══ MASS OVERLAY ═══ -->
  <div id="mass-overlay">
    <div id="mass-modal">

      <!-- HEADER -->
      <div id="mass-header">
        <div class="mass-hdr-icon default" id="mass-hdr-icon">
          <i class="fa-solid fa-layer-group"></i>
        </div>
        <div class="mass-hdr-text">
          <h2 id="mass-hdr-title">Gerador em Massa</h2>
          <p  id="mass-hdr-sub">Selecione o tipo de encarte</p>
        </div>
        <div class="mass-steps" id="mass-steps">
          <div class="mass-step active" data-step="0">
            <div class="mass-step-dot">1</div><span>Tipo</span>
          </div>
          <div class="mass-step-line"></div>
          <div class="mass-step" data-step="1">
            <div class="mass-step-dot">2</div><span>Produtos</span>
          </div>
          <div class="mass-step-line"></div>
          <div class="mass-step" data-step="2">
            <div class="mass-step-dot">3</div><span>Confirmação</span>
          </div>
        </div>
        <button id="mass-btn-back"><i class="fa-solid fa-arrow-left"></i> Voltar</button>
        <button id="mass-btn-help" class="btn-ajuda-encarte" title="Ver tabela de tamanhos de encartes">
          <i class="fa-solid fa-table-list"></i> Tabela de encartes
        </button>
        <button id="mass-btn-close">×</button>
      </div>

      <!-- ══ SCREEN 0 — TIPO ══ -->
      <div id="mass-screen-type" class="mass-screen active">
        <div class="mass-type-title">
          <h3>Qual tipo de encarte deseja gerar?</h3>
          <p>Cada tipo possui configuração específica de juros e opções.</p>
        </div>
        <div class="mass-type-cards">

          <div class="mass-type-card padrao" data-type="padrao">
            <div class="mass-type-icon"><i class="fa-solid fa-receipt"></i></div>
            <h4>Encarte Tabela Padrão</h4>
            <p>Geração padrão com carnê. Ideal para tabela fixa de preços parcelados.</p>
            <div class="mass-type-tags">
              <span class="mass-type-tag">Sempre Carnê</span>
              <span class="mass-type-tag">Sem desconto</span>
              <span class="mass-type-tag">Sem validade</span>
            </div>
          </div>

          <div class="mass-type-card promo" data-type="promocional">
            <div class="mass-type-icon"><i class="fa-solid fa-credit-card"></i></div>
            <h4>Encarte Promocional</h4>
            <p>Cartão de crédito com opção de validade. Ideal para campanhas.</p>
            <div class="mass-type-tags">
              <span class="mass-type-tag">Sempre Cartão</span>
              <span class="mass-type-tag">Com validade</span>
              <span class="mass-type-tag">Sem desconto</span>
            </div>
          </div>

          <div class="mass-type-card feirao" data-type="feirao">
            <div class="mass-type-icon"><i class="fa-solid fa-fire"></i></div>
            <h4>Encarte Feirão</h4>
            <p>Taxa livre, desconto automático 5% com arredondamento especial e validade.</p>
            <div class="mass-type-tags">
              <span class="mass-type-tag">Taxa livre</span>
              <span class="mass-type-tag">Desconto 5%</span>
              <span class="mass-type-tag">Com validade</span>
            </div>
          </div>

        </div>
      </div>

      <!-- ══ SCREEN 1 — SELEÇÃO ══ -->
      <div id="mass-screen-select" class="mass-screen">

        <div id="mass-list-panel">

          <div id="mass-toolbar">
            <div class="mass-search-wrap">
              <i class="fa-solid fa-magnifying-glass"></i>
              <input id="mass-search" type="text" placeholder="Buscar código ou descrição...">
            </div>
            <div class="mass-size-badge" id="mass-size-badge">
              <i class="fa-solid fa-ruler"></i>
              <span id="mass-size-badge-txt">A4</span>
            </div>
            <button id="mass-sel-all">
              <i class="fa-solid fa-check-double"></i>
              <span id="mass-sel-all-txt">Selecionar todos</span>
            </button>
          </div>

          <div id="mass-filter-chips">
            <span class="mass-chip active" data-f="all">Todos <span class="mass-chip-count" id="chip-cnt-all">0</span></span>
            <span class="mass-chip" data-f="selected">Selecionados <span class="mass-chip-count" id="chip-cnt-sel">0</span></span>
            <span class="mass-chip" data-f="A4">A4 <span class="mass-chip-count" id="chip-cnt-a4">0</span></span>
            <span class="mass-chip" data-f="A5">A5 <span class="mass-chip-count" id="chip-cnt-a5">0</span></span>
            <span class="mass-chip" data-f="A6">A6 <span class="mass-chip-count" id="chip-cnt-a6">0</span></span>
          </div>

          <div class="mass-state-block" id="mass-loading">
            <div class="mass-spinner"></div>
            <p>Carregando produtos da API...</p>
          </div>
          <div class="mass-state-block" id="mass-empty" style="display:none;">
            <i class="fa-solid fa-box-open" style="color:#d1d5db;"></i>
            <p>Nenhum produto encontrado para este filtro.</p>
          </div>

          <div id="mass-tbl-wrap" style="display:none;">
            <table id="mass-tbl">
              <thead>
                <tr>
                  <th style="width:36px;"></th>
                  <th style="width:88px;">Código</th>
                  <th>Descrição</th>
                  <th style="width:110px;">Valor à vista</th>
                  <th style="width:56px;">Tam.</th>
                </tr>
              </thead>
              <tbody id="mass-tbody"></tbody>
            </table>
          </div>

          <div id="mass-pagination" style="display:none;"></div>
        </div>

        <!-- Config panel -->
        <div id="mass-config-panel">

          <div class="mass-cfg-section">
            <div class="mass-cfg-title"><i class="fa-solid fa-list-ol"></i> Parcelamento</div>
            <div class="mass-cfg-field">
              <label>Nº de parcelas *</label>
              <select id="mass-metodo">
                <option value="">Selecione...</option>
                <option value="1x">1x (à vista)</option>
                <option value="3x">3x</option>
                <option value="5x">5x</option>
                <option value="10x">10x</option>
                <option value="12x">12x</option>
              </select>
            </div>
            <div class="mass-cfg-field" id="mass-juros-field">
              <label>Taxa</label>
              <!-- Preenchido dinamicamente por _selectType() -->
            </div>
          </div>

          <!-- Desconto — só feirão -->
          <div class="mass-cfg-section" id="mass-cfg-desconto" style="display:none;">
            <div class="mass-cfg-title"><i class="fa-solid fa-percent"></i> Desconto Feirão</div>
            <div class="mass-cfg-field">
              <label for="mass-desconto-pct">Desconto (%) <small style="color:#9ca3af;">— padrão 5%</small></label>
              <input type="number" id="mass-desconto-pct" value="5" min="0" max="99" step="0.5">
            </div>
            <div class="mass-disc-preview show" id="mass-disc-prev">
              <i class="fa-solid fa-tag"></i>
              Aplicando <strong id="mass-disc-pct-lbl">5%</strong> · fórmula de arredondamento X9 ativa
            </div>
          </div>

          <!-- Validade — promo e feirão -->
          <div class="mass-cfg-section" id="mass-cfg-validade" style="display:none;">
            <div class="mass-cfg-title"><i class="fa-solid fa-calendar-days"></i> Validade</div>
            <div class="mass-toggle-row">
              <label class="mass-sw">
                <input type="checkbox" id="mass-val-toggle">
                <span class="mass-sw-slider"></span>
              </label>
              <span class="mass-sw-label">Adicionar validade</span>
            </div>
            <div id="mass-val-fields" style="display:none;">
              <div class="mass-cfg-field">
                <label>Início (opcional)</label>
                <input type="date" id="mass-val-ini">
              </div>
              <div class="mass-cfg-field">
                <label>Fim *</label>
                <input type="date" id="mass-val-fim">
              </div>
            </div>
          </div>

          <!-- Aviso GE -->
          <div class="mass-cfg-section">
            <p class="mass-notice">
              <i class="fa-solid fa-shield-halved"></i>
              <strong>Garantia estendida indisponível</strong> no modo em massa.
              Os valores de G.E. da API serão ignorados.
            </p>
          </div>

          <div style="flex:1;"></div>

          <div id="mass-counter">
            <div class="mass-counter-row">
              <span class="mass-cnt-badge" id="mass-cnt-badge">0</span>
              <span class="mass-cnt-label" id="mass-cnt-label">produtos selecionados</span>
            </div>
            <button id="mass-btn-next" disabled>
              <i class="fa-solid fa-arrow-right"></i>
              Revisar e gerar cartazes
            </button>
          </div>

        </div>
      </div>

      <!-- ══ SCREEN 2 — CONFIRMAÇÃO ══ -->
      <div id="mass-screen-confirm" class="mass-screen">
        <div class="mass-confirm-header">
          <h3 id="mass-confirm-title">Confirmar produtos e valores</h3>
          <p id="mass-confirm-sub">Revise os valores. Você pode editar o valor à vista diretamente na tabela.</p>
        </div>
        <div class="mass-confirm-body">
          <table class="mass-confirm-table">
            <thead>
              <tr>
                <th style="width:90px;">Código</th>
                <th>Descrição</th>
                <th style="width:130px;">Valor à vista</th>
                <th id="mass-confirm-th-novo"  style="width:130px;display:none;">Valor Feirão</th>
                <th id="mass-confirm-th-val"   style="width:160px;display:none;">Validade</th>
              </tr>
            </thead>
            <tbody id="mass-confirm-tbody"></tbody>
          </table>
        </div>
        <div class="mass-confirm-footer">
          <div class="mass-confirm-summary">
            <strong id="mass-confirm-count">0</strong> produtos ·
            <span id="mass-confirm-info"></span>
          </div>
          <div class="mass-confirm-actions">
            <button class="mass-dlg-btn sec" id="mass-btn-back2">
              <i class="fa-solid fa-arrow-left"></i> Voltar
            </button>
            <button id="mass-btn-confirm" class="mass-dlg-btn prim">
              <i class="fa-solid fa-bolt"></i> Confirmar e gerar PDF
            </button>
          </div>
        </div>
      </div>

      <!-- ══ SCREEN 3 — PROGRESSO ══ -->
      <div id="mass-screen-progress" class="mass-screen">
        <div class="mass-prog-circle">
          <svg width="90" height="90" viewBox="0 0 90 90">
            <circle class="mass-prog-bg"   cx="45" cy="45" r="40"/>
            <circle class="mass-prog-fill" id="mass-prog-circle" cx="45" cy="45" r="40"/>
          </svg>
          <div id="mass-prog-pct">0%</div>
        </div>
        <p id="mass-prog-label">Iniciando geração...</p>
        <p id="mass-prog-sub">Aguarde, processando produtos</p>
      </div>

      <!-- FOOTER -->
      <div id="mass-footer">
        <span><strong id="mass-total-api">0</strong> produtos na API · <strong id="mass-total-filtered">0</strong> exibidos</span>
        <span>Dica: filtre por tamanho antes de selecionar todos</span>
      </div>

    </div>
  </div>

  <!-- ═══ DIALOG: TAMANHO INDEFINIDO ═══ -->
  <div class="mass-dialog-overlay" id="mass-dlg-size">
    <div class="mass-dialog">
      <div class="mass-dialog-hdr">
        <div class="mass-dialog-ico warn"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div>
          <h4>Tamanho não definido</h4>
          <p>Este produto não tem tamanho registrado na API</p>
        </div>
      </div>
      <div class="mass-dialog-body">
        <p>O produto <strong id="mass-dlg-size-prod">—</strong> não possui tamanho de cartaz definido pela API.</p>
        <p>Adicionar está <strong>por sua conta e risco</strong> — o cartaz pode ter tamanho incompatível com os demais.</p>
        <p>Prefere verificar a tabela de encartes primeiro?</p>
      </div>
      <div class="mass-dialog-footer">
        <button class="mass-dlg-btn sec" id="mass-dlg-size-help">
          <i class="fa-solid fa-table-list"></i> Ver tabela
        </button>
        <button class="mass-dlg-btn sec" id="mass-dlg-size-no">Cancelar</button>
        <button class="mass-dlg-btn warn" id="mass-dlg-size-yes">Adicionar mesmo assim</button>
      </div>
    </div>
  </div>

  <!-- ═══ DIALOG: TAMANHO DIFERENTE ═══ -->
  <div class="mass-dialog-overlay" id="mass-dlg-mismatch">
    <div class="mass-dialog">
      <div class="mass-dialog-hdr">
        <div class="mass-dialog-ico error"><i class="fa-solid fa-ban"></i></div>
        <div>
          <h4>Tamanhos incompatíveis</h4>
          <p>Não é possível misturar tamanhos no mesmo lote</p>
        </div>
      </div>
      <div class="mass-dialog-body">
        <p id="mass-dlg-mismatch-msg"></p>
        <p>Use o filtro de tamanhos para trabalhar com grupos separados.</p>
      </div>
      <div class="mass-dialog-footer">
        <button class="mass-dlg-btn prim" id="mass-dlg-mismatch-ok">Entendido</button>
      </div>
    </div>
  </div>

  <!-- ═══ DIALOG: CAMA BOX ═══ -->
  <div class="mass-dialog-overlay" id="mass-dlg-box">
    <div class="mass-dialog" style="max-width:540px;">
      <div class="mass-dialog-hdr">
        <div class="mass-dialog-ico box"><i class="fa-solid fa-bed"></i></div>
        <div>
          <h4>Conjunto Box detectado</h4>
          <p>Alta probabilidade de par colchão + base box entre os selecionados</p>
        </div>
      </div>
      <div class="mass-dialog-body">
        <p>Os produtos abaixo parecem formar um <strong>Conj. Box</strong>. Deseja combiná-los em um único cartaz?</p>
        <div id="mass-box-pairs-list" style="margin:12px 0;"></div>
        <p style="font-size:11px;color:#9ca3af;">
          Os valores à vista serão somados. Em caso de feirão, o desconto será aplicado sobre o valor total do conjunto.
        </p>
      </div>
      <div class="mass-dialog-footer">
        <button class="mass-dlg-btn sec"  id="mass-dlg-box-no">Não, manter separados</button>
        <button class="mass-dlg-btn succ" id="mass-dlg-box-yes">
          <i class="fa-solid fa-object-group"></i> Sim, combinar
        </button>
      </div>
    </div>
  </div>

  `);
}());

// ── §3 · BOTÃO NA SIDEBAR ────────────────────────────────────────────────────
(function _btn() {
  const inject = () => {
    if (document.getElementById('btn-mass-open')) return;
    const nav = document.querySelector('.sidebar-nav');
    if (!nav) return;
    const btn = document.createElement('button');
    btn.id = 'btn-mass-open';
    btn.className = 'nav-item mass-nav-btn';
    btn.innerHTML = `<i class="fa-solid fa-layer-group"></i><span>Cartazes em Massa</span>`;
    btn.addEventListener('click', massOpen);
    const extra = nav.querySelector('.nav-section');
    extra ? nav.insertBefore(btn, extra) : nav.appendChild(btn);
  };
  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', inject)
    : inject();
}());

// ── §4 · ESTADO ──────────────────────────────────────────────────────────────
const MS = {
  type:     null,
  step:     0,
  all:      [],
  filtered: [],
  selected: new Map(),   // codigo → {product, merged?}
  selSize:  null,
  filter:   'all',
  page:     1,
  PER:      20,
  loaded:   false,
  boxPairs: [],
  _evBound: false,
};

const MS_FATORES = {
  carne:  {1:1.069,2:.5523,3:.3804,4:.2946,5:.2432,6:.2091,7:.1849,8:.1668,9:.1528,10:.1417,11:.1327,12:.1252},
  cartao: {1:1.0292,2:.522,3:.353,4:.2685,5:.2179,6:.1841,7:.16,8:.142,9:.128,10:.1168,11:.1076,12:.1},
};

// ── §5 · UTILITÁRIOS ─────────────────────────────────────────────────────────
const _$ = id => document.getElementById(id);

function msParseR(v) {
  if (!v) return 0;
  const s = v.toString().replace(/R\$/g,'').replace(/\s+/g,'')
    .replace(/[^\d,.-]/g,'').replace(/\.(?=\d{3}(,|$))/g,'').replace(',','.');
  return isNaN(parseFloat(s)) ? 0 : parseFloat(s);
}

function msFmt(n) {
  return new Intl.NumberFormat('pt-BR',{minimumFractionDigits:2,maximumFractionDigits:2}).format(+n||0);
}

function msToast(type, title, msg) {
  if (typeof showToast === 'function') showToast(type, title, msg);
}

/** Arredondamento ,90 para parcelas */
function msArr90(v) {
  const c = Math.floor(+v * 100);
  const k = Math.floor((c - 90) / 100);
  return Math.max(0, k * 100 + 90) / 100;
}

/** Cálculo de parcela */
function msCalcParcela(avista, metodo, juros) {
  const n = parseInt((metodo||'').replace('x','')) || 1;
  if (!juros) return Math.round((avista / n) * 100) / 100;
  const tipo = juros === 'carne' ? 'carne' : 'cartao';
  const f = MS_FATORES[tipo]?.[n];
  if (!f) return Math.round((avista / n) * 100) / 100;
  return msArr90(avista * f);
}

/**
 * Fórmula do Feirão (planilha original):
 * =SE(E(D2>=89;D2<=139);D2;SE(MOD(D2*0,95;10)<=5;(D2*0,95)-MOD(D2*0,95;10)-1;(D2*0,95)+(9-MOD(D2*0,95;10))))
 *
 * Aplica 5% de desconto e arredonda para terminar em X9,00 (inteiro).
 * Faixa 89–139: sem desconto (faixas especiais).
 */
function msFeiraoPrix(preco, pct) {
  pct = (typeof pct === 'number') ? pct : 5;
  if (pct === 5 && preco >= 89 && preco <= 139) return preco;
  const d   = preco * (1 - pct / 100);
  const mod = d % 10;
  const result = mod <= 5 ? (d - mod - 1) : (d + (9 - mod));
  return Math.round(result); // inteiro, ,00 centavos
}

/** Formata data para texto de validade no cartaz */
function msDateExt(fim, ini) {
  if (!fim) return '';
  const [fy,fm,fd] = fim.split('-');
  const meses = ['janeiro','fevereiro','março','abril','maio','junho',
                 'julho','agosto','setembro','outubro','novembro','dezembro'];
  if (ini) {
    const [,im,id] = ini.split('-');
    return `Oferta válida de ${parseInt(id)}/${im} até ${parseInt(fd)}/${fm}/${String(fy).slice(-2)}`;
  }
  return `Oferta válida até ${parseInt(fd)} de ${meses[parseInt(fm)-1]} de ${fy}`;
}

/** Layout personalizado baseado no tamanho do cartaz */
function msLayout(tam) {
  if (tam === 'A5') return 'a5-loja53-novo';
  if (tam === 'A6') return 'a5-loja53';
  return '';
}

// ── §6 · FEATURE EXTRACTION ──────────────────────────────────────────────────
/** Extrai características via DICIONARIO (dict.js) */
function msFeatures(descricao) {
  if (typeof window.DICIONARIO === 'undefined') return [];
  const dic  = window.DICIONARIO;
  const text = descricao.toUpperCase();
  const feats = [];
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re  = t => new RegExp('\\b'+esc(t)+'\\b','gi');

  (dic.features||[]).slice().sort((a,b)=>b.length-a.length).forEach(f=>{
    if (feats.length>=3) return;
    if (re(f).test(text)) feats.push(f.toUpperCase());
  });
  (dic.cores||[]).slice().sort((a,b)=>b.length-a.length).forEach(c=>{
    if (feats.length>=3) return;
    if (re(c).test(text)) feats.push(c.toUpperCase());
  });
  (dic.padroes||[]).forEach(p=>{
    if (feats.length>=3) return;
    const m = text.match(new RegExp(p,'gi'));
    if (m) feats.push(...m.slice(0,3-feats.length).map(x=>x.trim().toUpperCase()));
  });
  return feats.slice(0,3);
}

// ── §7 · CARREGAR API ────────────────────────────────────────────────────────
async function msLoadAPI() {
  // Reutilizar cache do script.js se disponível
  if (typeof todosProdutos !== 'undefined' && todosProdutos.length > 0) {
    MS.all = todosProdutos.map(p => ({
      codigo:    String(p.codigo),
      descricao: p.descricao || '',
      avista:    msParseR(p.avista),
      tamanho:   (p.tamanho || '').toUpperCase().replace(/\s/g,'') || null,
    }));
    MS.loaded = true;
    _updateChipCounts();
    _massRender();
    _$('mass-total-api').textContent = MS.all.length;
    return;
  }

  const apiUrl = typeof API_URL !== 'undefined' ? API_URL : null;
  if (!apiUrl) {
    _$('mass-loading').innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;font-size:36px;"></i><p>API_URL não configurada.</p>`;
    return;
  }

  try {
    const ctrl = new AbortController();
    const tid  = setTimeout(() => ctrl.abort(), 14000);
    const res  = await fetch(apiUrl, { signal: ctrl.signal, cache: 'no-cache' });
    clearTimeout(tid);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();

    MS.all = [];
    ['Gabriel','Júlia','Giovana'].forEach(n => {
      (data[n] || []).forEach(item => {
        if (!item.Código || !item.Descrição) return;
        let tam = (item['Tamanho cartaz'] || item['Tamanho'] || '').toString().toUpperCase().trim();
        tam = ['A4','A5','A6'].includes(tam) ? tam : null;
        MS.all.push({
          codigo:    String(item.Código),
          descricao: item.Descrição,
          avista:    msParseR(item['Total à vista']),
          tamanho:   tam,
        });
      });
    });

    MS.loaded = true;
    _$('mass-total-api').textContent = MS.all.length;
    _updateChipCounts();
    _massRender();

  } catch(err) {
    _$('mass-loading').innerHTML = `
      <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;font-size:36px;"></i>
      <p>${err.name==='AbortError' ? 'Tempo esgotado. Tente novamente.' : 'Erro ao carregar a API: '+err.message}</p>
    `;
  }
}

// ── §8 · FILTRO & RENDER ─────────────────────────────────────────────────────
function _applyFilter() {
  const q = (_$('mass-search')?.value||'').toLowerCase().trim();
  MS.filtered = MS.all.filter(p => {
    if (q && !p.codigo.toLowerCase().includes(q) && !p.descricao.toLowerCase().includes(q)) return false;
    if (MS.filter === 'selected') return MS.selected.has(p.codigo);
    if (['A4','A5','A6'].includes(MS.filter)) return p.tamanho === MS.filter;
    return true;
  });
  _$('mass-total-filtered').textContent = MS.filtered.length;
}

function _updateChipCounts() {
  _$('chip-cnt-all').textContent = MS.all.length;
  _$('chip-cnt-sel').textContent = MS.selected.size;
  _$('chip-cnt-a4').textContent  = MS.all.filter(p=>p.tamanho==='A4').length;
  _$('chip-cnt-a5').textContent  = MS.all.filter(p=>p.tamanho==='A5').length;
  _$('chip-cnt-a6').textContent  = MS.all.filter(p=>p.tamanho==='A6').length;
}

function _massRender() {
  _applyFilter();
  const loading = _$('mass-loading');
  const wrap    = _$('mass-tbl-wrap');
  const empty   = _$('mass-empty');
  const pag     = _$('mass-pagination');

  loading.style.display = 'none';

  if (MS.filtered.length === 0) {
    wrap.style.display = 'none'; pag.style.display = 'none';
    empty.style.display = 'flex';
    _updateUI(); return;
  }
  empty.style.display = 'none'; wrap.style.display = 'block';

  const total = MS.filtered.length;
  const pages = Math.ceil(total / MS.PER);
  const start = (MS.page - 1) * MS.PER;
  const slice = MS.filtered.slice(start, Math.min(start + MS.PER, total));

  _$('mass-tbody').innerHTML = slice.map(p => {
    const isSel    = MS.selected.has(p.codigo);
    const isMerged = MS.selected.get(p.codigo)?.merged;
    const pMain = p.descricao.includes(' - ') ? p.descricao.split(' - ')[0] : p.descricao;
    const pSub  = p.descricao.includes(' - ') ? p.descricao.split(' - ')[1] : '';
    const tamC  = p.tamanho || 'undef';
    const tamL  = p.tamanho || '?';

    return `<tr class="${isSel?'m-sel':''}" onclick="msToggle('${p.codigo}')">
      <td onclick="event.stopPropagation()" style="width:36px;">
        <div class="mass-chk-wrap">
          <input type="checkbox" class="mass-chk" ${isSel?'checked':''}
            onchange="msToggle('${p.codigo}'); event.stopPropagation();">
        </div>
      </td>
      <td>
        <span style="font-family:monospace;font-weight:700;color:#1d4ed8;font-size:12px;">${p.codigo}</span>
        ${isMerged?'<br><span style="font-size:10px;background:#d1fae5;color:#065f46;padding:1px 5px;border-radius:8px;font-weight:600;">CONJ. BOX</span>':''}
      </td>
      <td>
        <div class="mass-prod-name">${pMain}</div>
        ${pSub?`<div class="mass-prod-sub">${pSub}</div>`:''}
      </td>
      <td class="mass-price-col">R$&nbsp;${msFmt(p.avista)}</td>
      <td><span class="mass-size-pill ${tamC}">${tamL}</span></td>
    </tr>`;
  }).join('');

  // Paginação
  if (pages > 1) {
    pag.style.display = 'flex';
    let h = `<button class="mass-pg-btn" ${MS.page===1?'disabled':''} onclick="msPage(${MS.page-1})">‹</button>`;
    for (let i=1;i<=pages;i++) {
      if (i===1||i===pages||(i>=MS.page-2&&i<=MS.page+2))
        h += `<button class="mass-pg-btn${i===MS.page?' active':''}" onclick="msPage(${i})">${i}</button>`;
      else if (i===MS.page-3||i===MS.page+3)
        h += `<span class="mass-pg-info">…</span>`;
    }
    h += `<button class="mass-pg-btn" ${MS.page===pages?'disabled':''} onclick="msPage(${MS.page+1})">›</button>`;
    h += `<span class="mass-pg-info">${start+1}–${Math.min(start+MS.PER,total)} de ${total}</span>`;
    pag.innerHTML = h;
  } else {
    pag.style.display = 'none';
  }

  _updateUI();
  _updateChipCounts();
}

// ── §9 · SELEÇÃO ─────────────────────────────────────────────────────────────
window.msToggle = function(codigo) {
  const prod = MS.all.find(p => p.codigo === codigo);
  if (!prod) return;

  if (MS.selected.has(codigo)) {
    MS.selected.delete(codigo);
    if (MS.selected.size === 0) MS.selSize = null;
    _massRender(); return;
  }

  const tam = prod.tamanho;

  // Tamanho diferente do lote
  if (MS.selSize && tam && tam !== MS.selSize) {
    _$('mass-dlg-mismatch-msg').textContent =
      `Os produtos já selecionados são tamanho ${MS.selSize}. Este produto é tamanho ${tam}. Não é possível misturar tamanhos no mesmo lote.`;
    _$('mass-dlg-mismatch').classList.add('open');
    return;
  }

  // Tamanho indefinido — pede confirmação
  if (!tam) {
    _$('mass-dlg-size-prod').textContent = `${prod.codigo} — ${prod.descricao.split(' - ')[0]}`;
    _pendingSizeCod = codigo;
    _$('mass-dlg-size').classList.add('open');
    return;
  }

  if (!MS.selSize) MS.selSize = tam;
  MS.selected.set(codigo, { product: prod });
  _updateSizeBadge();
  _massRender();
};

let _pendingSizeCod = null;
window.msPage = p => { MS.page = p; _massRender(); };

function _massSelectAll() {
  const allSel = MS.filtered.every(p => MS.selected.has(p.codigo));
  if (allSel) {
    MS.filtered.forEach(p => MS.selected.delete(p.codigo));
    if (MS.selected.size === 0) MS.selSize = null;
  } else {
    const filteredSizes = [...new Set(MS.filtered.map(p=>p.tamanho).filter(Boolean))];
    if (filteredSizes.length > 1) {
      msToast('error','Tamanhos mistos',
        'Filtro contém produtos de tamanhos diferentes. Use filtro A4/A5/A6 antes de selecionar todos.');
      return;
    }
    const sz = filteredSizes[0] || null;
    if (MS.selSize && sz && sz !== MS.selSize) {
      _$('mass-dlg-mismatch-msg').textContent =
        `Seleção atual é tamanho ${MS.selSize}. Os filtrados são tamanho ${sz}.`;
      _$('mass-dlg-mismatch').classList.add('open');
      return;
    }
    const undef = MS.filtered.filter(p => !p.tamanho);
    if (undef.length > 0 && !confirm(`${undef.length} produto(s) sem tamanho definido serão incluídos. Continuar?`)) return;
    if (!MS.selSize && sz) MS.selSize = sz;
    MS.filtered.forEach(p => MS.selected.set(p.codigo, { product: p }));
  }
  _updateSizeBadge();
  _massRender();
}

function _updateSizeBadge() {
  const badge = _$('mass-size-badge');
  const txt   = _$('mass-size-badge-txt');
  if (MS.selSize) {
    txt.textContent = `Lote ${MS.selSize}`;
    badge.classList.add('visible');
  } else {
    badge.classList.remove('visible');
  }
}

// ── §10 · UPDATE UI ──────────────────────────────────────────────────────────
function _updateUI() {
  const count  = MS.selected.size;
  const badge  = _$('mass-cnt-badge');
  const lbl    = _$('mass-cnt-label');
  const next   = _$('mass-btn-next');
  const selAll = _$('mass-sel-all');
  const selTxt = _$('mass-sel-all-txt');

  const prev = badge.textContent;
  badge.textContent = count;
  if (String(count) !== prev) {
    badge.classList.remove('pop'); void badge.offsetWidth; badge.classList.add('pop');
  }
  lbl.textContent = count === 1 ? 'produto selecionado' : 'produtos selecionados';

  const metodo = _$('mass-metodo')?.value;
  const juros  = _getJuros();
  const taxaOk = ['1x','3x','5x','10x'].includes(metodo) || (metodo === '12x' && juros);
  next.disabled = !(count > 0 && taxaOk);

  const allFilSel = MS.filtered.length > 0 && MS.filtered.every(p => MS.selected.has(p.codigo));
  selAll.classList.toggle('active-all', allFilSel);
  selTxt.textContent = allFilSel ? 'Desmarcar todos' : 'Selecionar todos';
}

// ── §11 · NAVEGAÇÃO ──────────────────────────────────────────────────────────
const _SCREENS = ['mass-screen-type','mass-screen-select','mass-screen-confirm','mass-screen-progress'];
const _STEP_INFO = {
  padrao:      { title:'Tabela Padrão',       sub:'Carnê · Sem desconto · Sem validade', icon:'fa-receipt',     cls:'padrao' },
  promocional: { title:'Encarte Promocional', sub:'Cartão · Com validade',               icon:'fa-credit-card', cls:'promo'  },
  feirao:      { title:'Encarte Feirão',      sub:'Taxa livre · Desconto 5% · Validade', icon:'fa-fire',        cls:'feirao' },
};

function _goStep(n) {
  MS.step = n;
  _SCREENS.forEach((id,i) => _$(id).classList.toggle('active', i === n));
  document.querySelectorAll('.mass-step').forEach((el,i) => {
    el.classList.toggle('done', i < n);
    el.classList.toggle('active', i === n);
  });
  _$('mass-btn-back').classList.toggle('visible', n > 0 && n < 3);
  const info = MS.type ? _STEP_INFO[MS.type] : null;
  if (info && n > 0) {
    _$('mass-hdr-title').textContent = info.title;
    _$('mass-hdr-sub').textContent   = info.sub;
    _$('mass-hdr-icon').className    = `mass-hdr-icon ${info.cls}`;
    _$('mass-hdr-icon').innerHTML    = `<i class="fa-solid ${info.icon}"></i>`;
  } else {
    _$('mass-hdr-title').textContent = 'Gerador em Massa';
    _$('mass-hdr-sub').textContent   = 'Selecione o tipo de encarte';
    _$('mass-hdr-icon').className    = 'mass-hdr-icon default';
    _$('mass-hdr-icon').innerHTML    = '<i class="fa-solid fa-layer-group"></i>';
  }
}

// ── §12 · SELECIONAR TIPO ────────────────────────────────────────────────────
function _selectType(type) {
  MS.type = type;
  MS.selected.clear();
  MS.selSize = null;

  const jField = _$('mass-juros-field');
  if (type === 'padrao') {
    jField.innerHTML = `<label>Taxa (fixo)</label>
      <div class="mass-tax-fixed carne"><i class="fa-solid fa-receipt"></i> Carnê — sempre</div>`;
    _$('mass-cfg-desconto').style.display = 'none';
    _$('mass-cfg-validade').style.display = 'none';
  } else if (type === 'promocional') {
    jField.innerHTML = `<label>Taxa (fixo)</label>
      <div class="mass-tax-fixed cartao"><i class="fa-solid fa-credit-card"></i> Cartão — sempre</div>`;
    _$('mass-cfg-desconto').style.display = 'none';
    _$('mass-cfg-validade').style.display = 'block';
  } else { // feirao
    jField.innerHTML = `<label for="mass-juros-sel">Taxa *</label>
      <select id="mass-juros-sel">
        <option value="">Selecione...</option>
        <option value="carne">Carnê</option>
        <option value="cartao">Cartão</option>
      </select>`;
    _$('mass-juros-sel')?.addEventListener('change', _updateUI);
    _$('mass-cfg-desconto').style.display = 'block';
    _$('mass-cfg-validade').style.display = 'block';
  }

  // Cor do botão de confirmação
  const cb = _$('mass-btn-confirm');
  cb.className = 'mass-dlg-btn prim' + (type==='feirao'?' feirao':type==='promocional'?' promo':'');

  _goStep(1);
  if (!MS.loaded) msLoadAPI(); else _massRender();
}

// ── §13 · CONFIRMAÇÃO — detecção de cama box ─────────────────────────────────
async function _goConfirm() {
  if (MS.selected.size === 0) {
    msToast('warning','Nada selecionado','Selecione ao menos um produto.'); return;
  }

  // Usar DICT_BOX se disponível (dict-box.js carregado)
  const detectarFn = window.DICT_BOX?.detectar;
  if (typeof detectarFn !== 'function') {
    _buildConfirmScreen(); return;
  }

  const selList = [...MS.selected.values()].map(e => e.product).filter(Boolean);
  const pairs   = detectarFn(selList);

  if (pairs.length > 0) {
    MS.boxPairs = pairs;
    _renderBoxDialog(pairs);
    _$('mass-dlg-box').classList.add('open');
    return;
  }

  _buildConfirmScreen();
}

function _renderBoxDialog(pairs) {
  const mesclarFn = window.DICT_BOX?.mesclar;

  _$('mass-box-pairs-list').innerHTML = pairs.map(pair => {
    const col  = pair.col;
    const base = pair.base;
    const ci   = pair.colInfo;
    const bi   = pair.baseInfo;

    // Resultado da mesclagem
    const merged = mesclarFn ? mesclarFn(pair) : null;
    const resultLabel = merged
      ? merged.descricao + (merged.subdescricao ? ' · ' + merged.subdescricao : '')
      : `Conj. Box ${ci.size || ''}`;

    const simPct = Math.round((pair.sim || 0) * 100);

    return `
      <div class="mass-box-pair" style="margin-bottom:12px;">
        <div class="mass-box-item">
          <strong>${col.codigo}</strong>
          <span>${(col.descricao||'').split(' - ')[0].substring(0,40)}</span>
          <small style="color:#9ca3af;">R$ ${msFmt(col.avista)}</small>
        </div>
        <div class="mass-box-arrow">+</div>
        <div class="mass-box-item">
          <strong>${base.codigo}</strong>
          <span>${(base.descricao||'').split(' - ')[0].substring(0,40)}</span>
          <small style="color:#9ca3af;">R$ ${msFmt(base.avista)}</small>
        </div>
      </div>
      <div class="mass-box-result">
        → <strong>${resultLabel}</strong> · R$ ${msFmt(col.avista + base.avista)} à vista
        <span style="margin-left:8px;font-size:10px;opacity:.7;">similaridade: ${simPct}%</span>
      </div>
    `;
  }).join('<div style="height:12px;"></div>');
}

function _applyBoxMerge() {
  const mesclarFn = window.DICT_BOX?.mesclar;
  if (!mesclarFn) { _buildConfirmScreen(); return; }

  MS.boxPairs.forEach(pair => {
    const merged = mesclarFn(pair);

    // Remover os dois produtos individuais do Map
    MS.selected.delete(pair.col.codigo);
    MS.selected.delete(pair.base.codigo);

    // Produto mesclado
    const mergedProduct = {
      codigo:    merged.codigo,
      descricao: merged.descricao,
      subdescricao: merged.subdescricao,
      avista:    merged.avista,
      tamanho:   pair.col.tamanho || pair.base.tamanho,
      _merged:   true,
    };

    // Inserir no início do Map (usando reconstrução)
    const tmpMap = new Map([[mergedProduct.codigo, { product: mergedProduct, merged: true }]]);
    MS.selected.forEach((v,k) => tmpMap.set(k,v));
    MS.selected.clear();
    tmpMap.forEach((v,k) => MS.selected.set(k,v));
  });

  _buildConfirmScreen();
}

function _buildConfirmScreen() {
  _goStep(2);

  const hasVal = _hasValidade();
  const isFei  = MS.type === 'feirao';
  const discPct = parseFloat(_$('mass-desconto-pct')?.value) || 5;

  _$('mass-confirm-th-novo').style.display = isFei  ? '' : 'none';
  _$('mass-confirm-th-val').style.display  = hasVal ? '' : 'none';

  const selEntries = [...MS.selected.values()];
  let rows = '';

  selEntries.forEach(entry => {
    const p = entry.product;
    if (!p) return;
    const pMain = p.descricao.includes(' - ') ? p.descricao.split(' - ')[0] : p.descricao;
    const novoVal = isFei ? msFeiraoPrix(p.avista, discPct) : null;
    const valStr  = hasVal
      ? (_$('mass-val-fim')?.value ? msDateExt(_$('mass-val-fim').value, _$('mass-val-ini')?.value) : '—')
      : '';

    rows += `<tr>
      <td style="font-family:monospace;font-size:11px;color:#1d4ed8;font-weight:700;">${p.codigo}</td>
      <td style="font-size:12px;font-weight:500;color:#111827;max-width:200px;">${pMain}</td>
      <td>
        <div class="mass-price-edit">
          <span>R$</span>
          <input type="text" class="mass-price-input" data-cod="${p.codigo}"
            value="${msFmt(p.avista)}"
            oninput="msUpdateConfirmRow(this)"
            style="color:${isFei?'#374151':'#059669'};">
        </div>
      </td>
      ${isFei ? `<td>
        <div class="mass-feirao-price">
          <span id="feirao-novo-${p.codigo.replace('/','_')}">R$ ${msFmt(novoVal)}</span>
          <span class="mass-feirao-badge">-${discPct}%</span>
        </div>
      </td>` : ''}
      ${hasVal ? `<td class="mass-confirm-validade">${valStr}</td>` : ''}
    </tr>`;
  });

  _$('mass-confirm-tbody').innerHTML = rows;
  _$('mass-confirm-count').textContent = selEntries.length;

  const metodo = _$('mass-metodo')?.value || '—';
  const juros  = _getJuros();
  const jLabel = juros === 'carne' ? 'Carnê' : juros === 'cartao' ? 'Cartão' : '—';
  _$('mass-confirm-info').textContent =
    `${metodo} · ${jLabel}${isFei ? ` · Desconto ${discPct}% (fórmula X9)` : ''}`;
}

/** Atualiza coluna de valor feirão ao editar o à vista */
window.msUpdateConfirmRow = function(input) {
  if (MS.type !== 'feirao') return;
  const val  = msParseR(input.value);
  const pct  = parseFloat(_$('mass-desconto-pct')?.value) || 5;
  const novo = msFeiraoPrix(val, pct);
  const cod  = input.dataset.cod.replace('/','_');
  const el   = document.getElementById(`feirao-novo-${cod}`);
  if (el) el.textContent = `R$ ${msFmt(novo)}`;
  // Atualizar no state
  if (MS.selected.has(input.dataset.cod)) {
    MS.selected.get(input.dataset.cod).product.avista = val;
  }
};

function _hasValidade() {
  return (MS.type === 'promocional' || MS.type === 'feirao')
    && _$('mass-val-toggle')?.checked
    && _$('mass-val-fim')?.value;
}

function _getJuros() {
  if (MS.type === 'padrao')      return 'carne';
  if (MS.type === 'promocional') return 'cartao';
  return _$('mass-juros-sel')?.value || '';
}

// ── §14 · GERAÇÃO + PDF ──────────────────────────────────────────────────────
async function _massGenerate() {
  const metodo  = _$('mass-metodo')?.value;
  const juros   = _getJuros();
  const isFei   = MS.type === 'feirao';
  const discPct = parseFloat(_$('mass-desconto-pct')?.value) || 5;

  // Ler valores editados na tela de confirmação
  document.querySelectorAll('.mass-price-input').forEach(inp => {
    const cod = inp.dataset.cod;
    const val = msParseR(inp.value);
    if (MS.selected.has(cod)) MS.selected.get(cod).product.avista = val;
  });

  _goStep(3);

  const selEntries = [...MS.selected.values()].filter(e => e.product);
  const total      = selEntries.length;
  const circle     = _$('mass-prog-circle');
  const pct        = _$('mass-prog-pct');
  const lbl        = _$('mass-prog-label');
  const sub        = _$('mass-prog-sub');
  const CIRC       = 252;

  const erros = [];
  const produtosGerados = [];

  for (let i = 0; i < total; i++) {
    const entry = selEntries[i];
    const p     = entry.product;

    // Progresso
    const prog = Math.round(((i+1)/total)*100);
    circle.style.strokeDashoffset = CIRC - (CIRC * (i+1)/total);
    pct.textContent = prog + '%';
    lbl.textContent = `Processando ${i+1} de ${total}...`;
    sub.textContent = p.descricao.split(' - ')[0].substring(0, 52);

    let avista = p.avista;
    if (isNaN(avista) || avista <= 0) { erros.push(p.codigo); continue; }

    // Feirão: aplicar fórmula X9
    if (isFei) avista = msFeiraoPrix(avista, discPct);

    // Parcela
    let parcela = 0, jurosFinal = juros;
    if (metodo === '1x') {
      parcela = avista; jurosFinal = '';
    } else if (['3x','5x','10x'].includes(metodo) && !juros) {
      parcela = Math.round((avista / parseInt(metodo)) * 100) / 100;
      jurosFinal = '';
    } else {
      parcela = msCalcParcela(avista, metodo, jurosFinal);
    }

    // Descrição
    const partes  = (p.descricao || '').split(' - ');
    const desc    = (partes[0] || '').trim().toUpperCase();
    const subdesc = (partes[1] || p.subdescricao || '').trim().toUpperCase();

    // Features via dicionário
    let features = msFeatures(p.descricao);
    if (features.length === 0) features = ['Consulte características'];

    // Validade
    const valFim = _hasValidade() ? (_$('mass-val-fim')?.value || '') : '';
    const valIni = _hasValidade() ? (_$('mass-val-ini')?.value || '') : '';

    // Layout por tamanho
    const layout = msLayout(p.tamanho || MS.selSize || '');

    const produto = {
      id:                  Date.now() + Math.random(),
      codigo:              p.codigo,
      descricao:           desc,
      subdescricao:        subdesc,
      features,
      metodo,
      juros:               jurosFinal,
      avista,
      parcela,
      motivo:              '',
      validade:            valFim,
      validadeInicio:      valIni,
      autorizacao:         '',
      garantia12:          0,
      garantia24:          0,
      garantia36:          0,
      modelo:              'padrao',
      semJuros:            false,
      moverValidade:       false,
      layoutPersonalizado: layout,
      posicaoGarantia:     'hp',
    };

    produtosGerados.push(produto);
    if (typeof products !== 'undefined') products.push(produto);

    if ((i+1) % 8 === 0) await new Promise(r => setTimeout(r, 0));
  }

  // Salvar
  if (typeof salvarCartazesLocalStorage === 'function') salvarCartazesLocalStorage();
  if (typeof renderProducts             === 'function') renderProducts();

  // PDF direto
  lbl.textContent = 'Gerando PDF...';
  sub.textContent = 'Aguarde, montando os cartazes';
  circle.style.strokeDashoffset = 0;
  pct.textContent = '100%';

  await _gerarPDF(produtosGerados, sub);

  massClose();
  const nav = document.querySelector('[data-view="produtos"]');
  if (nav) nav.click();

  const ok = produtosGerados.length;
  if (erros.length === 0) {
    msToast('success', `${ok} cartaz(es) gerado(s)!`, 'PDF aberto em nova aba.');
  } else {
    msToast('warning', `${ok} gerado(s), ${erros.length} ignorado(s)`, `Ignorados: ${erros.join(', ')}`);
  }
}

async function _gerarPDF(lista, subEl) {
  if (!lista.length) return;
  if (!window.jspdf || !window.html2canvas || typeof generatePosterHTML === 'undefined') {
    msToast('error','Dependências ausentes','jsPDF, html2canvas ou generatePosterHTML não encontrado.');
    return;
  }

  const pdf = new window.jspdf.jsPDF('p','mm','a4');

  for (let i = 0; i < lista.length; i++) {
    const prod = lista[i];
    if (subEl) subEl.textContent = `${prod.descricao.substring(0,48)} (${i+1}/${lista.length})`;

    const clone = document.createElement('div');
    clone.innerHTML = generatePosterHTML(prod, false);

    const ehA5Novo = prod.layoutPersonalizado === 'a5-loja53-novo';
    const ehA5Conf = prod.layoutPersonalizado === 'a5-loja53';

    if (ehA5Novo || ehA5Conf) {
      clone.style.cssText = 'position:absolute;left:-99999px;top:0;width:210mm;height:297mm;background:#fff;margin:0;padding:0;box-sizing:border-box;overflow:hidden;';
    } else {
      clone.style.cssText = 'position:absolute;left:-99999px;top:0;width:182.6mm;height:258.3mm;background:#fff;margin:0;padding:0;box-sizing:border-box;overflow:hidden;';
      const pEl = clone.querySelector('.poster');
      if (pEl) { pEl.style.width='182.6mm'; pEl.style.height='258.3mm'; }
      const ftEl = clone.querySelector('.poster-footer-table');
      if (ftEl) {
        const sf = 258.3/297;
        const dr = clone.querySelector('[data-digits]');
        const dg = dr?.getAttribute('data-digits');
        const top = dg==='4'?19:dg==='3'?20:dg==='2'?21.75:dg==='1'?22.5:20.5;
        ftEl.style.top = (top*sf).toFixed(3)+'cm';
      }
    }

    document.body.appendChild(clone);
    const canvas = await html2canvas(clone, {
      scale: 2, backgroundColor: '#fff', useCORS: true,
      allowTaint: true, logging: false,
      windowWidth: clone.scrollWidth, windowHeight: clone.scrollHeight,
    });
    const img = canvas.toDataURL('image/jpeg', 1.0);
    if (i > 0) pdf.addPage();
    pdf.addImage(img,'JPEG',0,0,210,297);
    document.body.removeChild(clone);
  }

  const blob = pdf.output('blob');
  const url  = URL.createObjectURL(blob);
  const codigos = lista.map(p=>p.codigo).join(', ');
  const win = window.open(url,'_blank');
  if (win) win.document.title = `Cartazes em Massa — ${codigos}`;
  else msToast('warning','Popup bloqueado','Permita pop-ups para visualizar o PDF.');
}

// ── §15 · OPEN / CLOSE ───────────────────────────────────────────────────────
function massOpen() {
  MS.type = null; MS.step = 0;
  MS.selected.clear(); MS.selSize = null;
  MS.filter = 'all'; MS.page = 1; MS.boxPairs = [];
  _goStep(0);
  _$('mass-overlay').classList.add('active');
  _massBindEvents();
}
function massClose() {
  _$('mass-overlay').classList.remove('active');
}

// ── §16 · EVENTOS ────────────────────────────────────────────────────────────
function _massBindEvents() {
  if (MS._evBound) return;
  MS._evBound = true;

  // Fechar
  _$('mass-btn-close').addEventListener('click', massClose);
  _$('mass-overlay').addEventListener('click', e => {
    if (e.target === _$('mass-overlay')) massClose();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _$('mass-overlay').classList.contains('active')) massClose();
  });

  // Voltar
  _$('mass-btn-back').addEventListener('click', () => {
    if (MS.step === 1) { MS.selected.clear(); MS.selSize=null; _goStep(0); }
    else if (MS.step === 2) _goStep(1);
  });
  _$('mass-btn-back2')?.addEventListener('click', () => _goStep(1));

  // Ajuda — usa modal compartilhado do dict-box.js, fallback simples
  _$('mass-btn-help').addEventListener('click', () => {
    if (typeof window._abrirHelpEncarte === 'function') {
      window._abrirHelpEncarte();
    }
  });

  // Type cards
  document.querySelectorAll('.mass-type-card').forEach(card => {
    card.addEventListener('click', () => _selectType(card.dataset.type));
  });

  // Busca
  _$('mass-search').addEventListener('input', () => { MS.page=1; _massRender(); });

  // Chips
  _$('mass-filter-chips').addEventListener('click', e => {
    const chip = e.target.closest('.mass-chip');
    if (!chip) return;
    document.querySelectorAll('.mass-chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    MS.filter = chip.dataset.f;
    MS.page = 1;
    _massRender();
  });

  // Select all
  _$('mass-sel-all').addEventListener('click', _massSelectAll);

  // Parcelamento
  _$('mass-metodo').addEventListener('change', _updateUI);

  // Validade toggle
  _$('mass-val-toggle').addEventListener('change', () => {
    _$('mass-val-fields').style.display = _$('mass-val-toggle').checked ? 'block' : 'none';
  });

  // Desconto pct
  _$('mass-desconto-pct').addEventListener('input', () => {
    const v = _$('mass-desconto-pct').value || '5';
    _$('mass-disc-pct-lbl').textContent = v + '%';
  });

  // Next → confirmação (com detecção de box)
  _$('mass-btn-next').addEventListener('click', _goConfirm);

  // Confirm → gerar PDF
  _$('mass-btn-confirm').addEventListener('click', _massGenerate);

  // Dialog: mismatch ok
  _$('mass-dlg-mismatch-ok').addEventListener('click', () => {
    _$('mass-dlg-mismatch').classList.remove('open');
  });

  // Dialog: size undef
  _$('mass-dlg-size-yes').addEventListener('click', () => {
    _$('mass-dlg-size').classList.remove('open');
    if (_pendingSizeCod) {
      const prod = MS.all.find(p => p.codigo === _pendingSizeCod);
      if (prod) {
        MS.selected.set(_pendingSizeCod, { product: prod });
        _updateSizeBadge();
        _massRender();
      }
      _pendingSizeCod = null;
    }
  });
  _$('mass-dlg-size-no').addEventListener('click', () => {
    _$('mass-dlg-size').classList.remove('open');
    _pendingSizeCod = null;
  });
  _$('mass-dlg-size-help').addEventListener('click', () => {
    _$('mass-dlg-size').classList.remove('open');
    if (typeof window._abrirHelpEncarte === 'function') window._abrirHelpEncarte();
  });

  // Dialog: box merge
  _$('mass-dlg-box-yes').addEventListener('click', () => {
    _$('mass-dlg-box').classList.remove('open');
    _applyBoxMerge();
  });
  _$('mass-dlg-box-no').addEventListener('click', () => {
    _$('mass-dlg-box').classList.remove('open');
    _buildConfirmScreen();
  });
}

// ── §17 · EXPORTS ────────────────────────────────────────────────────────────
window.massOpen  = massOpen;
window.massClose = massClose;

console.log('✅ mass.js v2.1 carregado — Gerador em Massa com DICT_BOX ativo.');
