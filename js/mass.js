// ════════════════════════════════════════════════════════════════════════════
//  MASS.JS v2.2 — Gerador de Cartazes em Massa
//  Depende de: script.js · dict.js · dict-box.js · mass-extra.css
//  O HTML do overlay e o botão da sidebar estão em cartazes.html.
// ════════════════════════════════════════════════════════════════════════════

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
  featuresPatch: {},     // codigo → [feat1, feat2, feat3]
  _semFeatures:  [],     // produtos sem características encontradas
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
  // Garantir que produtos.json está carregado via inicializarProdutos (script.js)
  if (typeof inicializarProdutos === 'function') {
    await inicializarProdutos();
  }

  if (typeof todosProdutos !== 'undefined' && todosProdutos.length > 0) {
    MS.all = todosProdutos.map(p => ({
      codigo:    String(p.codigo),
      descricao: p.descricao || '',
      avista:    msParseR(p.avista),
      tamanho:   p.tamanho || null,
    }));
    MS.loaded = true;
    _updateChipCounts();
    _massRender();
    _$('mass-total-api').textContent = MS.all.length;
  } else {
    _$('mass-loading').innerHTML = `
      <i class="fa-solid fa-triangle-exclamation" style="color:#ef4444;font-size:36px;"></i>
      <p>Nenhum produto carregado. Verifique o arquivo <strong>../data/produtos.json</strong>.</p>
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

// ── §14-A · PRÉ-GERAÇÃO: checar características ausentes ────────────────────
async function _massPreGenerate() {
  MS._semFeatures = [];
  MS.featuresPatch = MS.featuresPatch || {};

  // Ler valores editados na confirmação (precisa rodar antes de checar features)
  document.querySelectorAll('.mass-price-input').forEach(inp => {
    const cod = inp.dataset.cod;
    const val = msParseR(inp.value);
    if (MS.selected.has(cod)) MS.selected.get(cod).product.avista = val;
  });

  // Detectar produtos sem características identificadas pelo dicionário
  const selEntries = [...MS.selected.values()].filter(e => e.product);
  const semFeats = [];
  selEntries.forEach(entry => {
    const p = entry.product;
    const feats = msFeatures(p.descricao || '');
    if (feats.length === 0 && !(MS.featuresPatch[p.codigo] && MS.featuresPatch[p.codigo].length > 0)) {
      semFeats.push(p);
    }
  });

  if (semFeats.length === 0) {
    _massGenerate();
    return;
  }

  // Montar dialog com campo por produto
  const body = _$('mass-features-body');
  if (!body) { _massGenerate(); return; }

  body.innerHTML = semFeats.map(p => {
    const desc = (p.descricao || '').split(' - ')[0].substring(0, 50);
    const safeId = p.codigo.replace(/[^a-zA-Z0-9]/g, '_');
    return `
      <div class="mass-feat-item" data-cod="${p.codigo}" style="margin-bottom:18px;padding:14px;background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:12px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
          <span style="font-size:10px;font-weight:700;color:#1d4ed8;background:#eff6ff;padding:2px 8px;border-radius:8px;font-family:monospace;">${p.codigo}</span>
          <span style="font-size:12px;font-weight:600;color:#111827;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${desc}">${desc}</span>
        </div>
        <div class="mass-feat-tags-wrap" id="feat-tags-${safeId}" style="display:flex;flex-wrap:wrap;gap:6px;min-height:28px;margin-bottom:8px;"></div>
        <div style="display:flex;gap:6px;">
          <input type="text" id="feat-input-${safeId}" placeholder="Digite e pressione Enter ou +" maxlength="30"
            style="flex:1;padding:7px 10px;border:1.5px solid #d1d5db;border-radius:8px;font-size:13px;outline:none;"
            onkeydown="if(event.key==='Enter'){event.preventDefault();massFeatAdd('${p.codigo}','${safeId}');}">
          <button type="button" onclick="massFeatAdd('${p.codigo}','${safeId}')"
            style="padding:7px 12px;background:#2563eb;color:white;border:none;border-radius:8px;cursor:pointer;font-size:13px;font-weight:600;transition:all .15s;"
            onmouseover="this.style.background='#1d4ed8'" onmouseout="this.style.background='#2563eb'">
            <i class="fa-solid fa-plus"></i>
          </button>
        </div>
        <p style="font-size:10px;color:#9ca3af;margin-top:5px;">Máx. 3 características · Deixe vazio para usar "Consulte características"</p>
      </div>`;
  }).join('');

  _$('mass-dlg-features').classList.add('open');
}

window.massFeatAdd = function(codigo, safeId) {
  MS.featuresPatch = MS.featuresPatch || {};
  const input = document.getElementById(`feat-input-${safeId}`);
  const wrap  = document.getElementById(`feat-tags-${safeId}`);
  if (!input || !wrap) return;

  const val = input.value.trim().toUpperCase();
  if (!val) return;

  MS.featuresPatch[codigo] = MS.featuresPatch[codigo] || [];
  if (MS.featuresPatch[codigo].length >= 3) {
    msToast('warning', 'Limite atingido', 'Máximo de 3 características por produto.');
    return;
  }
  if (MS.featuresPatch[codigo].includes(val)) {
    input.value = '';
    return;
  }
  MS.featuresPatch[codigo].push(val);
  input.value = '';

  // Renderizar tag
  const tag = document.createElement('span');
  tag.className = 'mass-feat-tag';
  tag.innerHTML = `${val} <button type="button" onclick="massFeatRemove('${codigo}','${safeId}','${val.replace(/'/g,'\\\'')}')" style="all:unset;margin-left:4px;cursor:pointer;opacity:.7;font-size:12px;">×</button>`;
  wrap.appendChild(tag);
  input.focus();
};

window.massFeatRemove = function(codigo, safeId, val) {
  MS.featuresPatch = MS.featuresPatch || {};
  if (!MS.featuresPatch[codigo]) return;
  MS.featuresPatch[codigo] = MS.featuresPatch[codigo].filter(f => f !== val);
  const wrap = document.getElementById(`feat-tags-${safeId}`);
  if (!wrap) return;
  // Re-renderizar tags
  wrap.querySelectorAll('.mass-feat-tag').forEach(el => {
    if (el.textContent.replace('×','').trim() === val) el.remove();
  });
};

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
    // Checar patch manual (adicionado pelo usuário no dialog de features)
    if (features.length === 0 && MS.featuresPatch && MS.featuresPatch[p.codigo]) {
      features = MS.featuresPatch[p.codigo].slice(0, 3);
    }
    // Se ainda vazio, marcar para perguntar depois (ou usar fallback)
    if (features.length === 0) {
      MS._semFeatures = MS._semFeatures || [];
      if (!MS._semFeatures.find(x => x.codigo === p.codigo)) {
        MS._semFeatures.push({ codigo: p.codigo, descricao: desc });
      }
      features = ['Consulte características'];
    }

    // Campanha
    const campanhaToggle = _$('mass-campanha-toggle');
    const campanhaTxt    = _$('mass-campanha-txt');
    const campanha = (campanhaToggle && campanhaToggle.checked && campanhaTxt)
      ? (campanhaTxt.value || '').trim().toUpperCase()
      : '';

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
      campanha:            campanha,
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
    const ehJuazeiro2A6 = prod.layoutPersonalizado === 'juazeiro2-a6';

    if (ehA5Novo || ehA5Conf || ehJuazeiro2A6) {
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
  MS.featuresPatch = {}; MS._semFeatures = [];
  _goStep(0);
  _$('mass-overlay').classList.add('active');
  _massBindEvents();
}

function massClose() {
  _$('mass-overlay').classList.remove('active');
}

/**
 * Solicita confirmação antes de fechar se o usuário já passou da tela inicial
 * ou selecionou produtos. Na tela de seleção sem produtos, fecha direto.
 * Na tela de progresso (step 3), fecha direto pois o processo já terminou.
 */
function _confirmarFecharMass() {
  // Step 0 (tipo) ou step 3 (progresso/concluído): fecha sem perguntar
  if (MS.step === 0 || MS.step === 3) {
    massClose();
    return;
  }

  // Step 1 sem nenhum produto selecionado: fecha direto
  if (MS.step === 1 && MS.selected.size === 0) {
    massClose();
    return;
  }

  // Nos demais casos: pede confirmação usando o dialog interno do Mass
  const dlgId = 'mass-dlg-fechar-confirm';

  // Cria o dialog se ainda não existir
  if (!document.getElementById(dlgId)) {
    const el = document.createElement('div');
    el.className = 'mass-dialog-overlay';
    el.id = dlgId;
    el.innerHTML = `
      <div class="mass-dialog" style="max-width:420px;">
        <div class="mass-dialog-hdr">
          <div class="mass-dialog-ico warn"><i class="fa-solid fa-triangle-exclamation"></i></div>
          <div>
            <h4>Fechar gerador em massa?</h4>
            <p>As seleções e configurações serão perdidas</p>
          </div>
        </div>
        <div class="mass-dialog-body">
          <p id="mass-dlg-fechar-msg">Tem certeza que deseja fechar?</p>
        </div>
        <div class="mass-dialog-footer">
          <button class="mass-dlg-btn sec" id="mass-dlg-fechar-nao">
            <i class="fa-solid fa-arrow-left"></i> Não, continuar
          </button>
          <button class="mass-dlg-btn warn" id="mass-dlg-fechar-sim">
            <i class="fa-solid fa-times"></i> Sim, fechar
          </button>
        </div>
      </div>`;
    _$('mass-modal').appendChild(el);

    document.getElementById('mass-dlg-fechar-nao').addEventListener('click', () => {
      document.getElementById(dlgId).classList.remove('open');
    });
    document.getElementById('mass-dlg-fechar-sim').addEventListener('click', () => {
      document.getElementById(dlgId).classList.remove('open');
      massClose();
    });
  }

  // Atualiza mensagem com número de produtos selecionados
  const msgEl = document.getElementById('mass-dlg-fechar-msg');
  if (msgEl) {
    const n = MS.selected.size;
    msgEl.textContent = n > 0
      ? `Você tem ${n} produto${n > 1 ? 's' : ''} selecionado${n > 1 ? 's' : ''}. Fechar descartará todas as seleções e configurações.`
      : 'Fechar descartará todas as configurações já definidas.';
  }

  document.getElementById(dlgId).classList.add('open');
}

// Conectar o botão da sidebar ao massOpen
document.addEventListener('DOMContentLoaded', function() {
  var btnMass = document.getElementById('btn-mass-open');
  if (btnMass) btnMass.addEventListener('click', massOpen);
});

// ── §16 · EVENTOS ────────────────────────────────────────────────────────────
function _massBindEvents() {
  if (MS._evBound) return;
  MS._evBound = true;

  // Fechar (com confirmação quando relevante)
  _$('mass-btn-close').addEventListener('click', _confirmarFecharMass);
  _$('mass-overlay').addEventListener('click', e => {
    if (e.target === _$('mass-overlay')) _confirmarFecharMass();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && _$('mass-overlay').classList.contains('active')) {
      // ESC fecha dialog de confirmação se estiver aberto, senão pede confirmação
      const dlgFechar = document.getElementById('mass-dlg-fechar-confirm');
      if (dlgFechar && dlgFechar.classList.contains('open')) {
        dlgFechar.classList.remove('open');
        return;
      }
      _confirmarFecharMass();
    }
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
  _$('mass-btn-confirm').addEventListener('click', _massPreGenerate);

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
  // Campanha toggle
  const massCampanhaToggle = _$('mass-campanha-toggle');
  const massCampanhaFields = _$('mass-campanha-fields');
  if (massCampanhaToggle && massCampanhaFields) {
    massCampanhaToggle.addEventListener('change', () => {
      massCampanhaFields.style.display = massCampanhaToggle.checked ? 'block' : 'none';
    });
  }

  // Dialog: features ausentes — botões
  _$('mass-dlg-features-skip')?.addEventListener('click', () => {
    _$('mass-dlg-features').classList.remove('open');
    _massGenerate();
  });
  _$('mass-dlg-features-confirm')?.addEventListener('click', () => {
    _$('mass-dlg-features').classList.remove('open');
    _massGenerate();
  });
  _$('mass-dlg-features-help-btn')?.addEventListener('click', () => {
    _$('mass-dlg-feat-help').classList.add('open');
  });
  _$('mass-feat-help-close-btn')?.addEventListener('click', () => {
    _$('mass-dlg-feat-help').classList.remove('open');
  });
}

// ── §17 · EXPORTS ────────────────────────────────────────────────────────────
window.massOpen  = massOpen;
window.massClose = massClose;
window._confirmarFecharMass = _confirmarFecharMass;

console.log('✅ mass.js v2.2 carregado — HTML estático, Gerador em Massa com DICT_BOX ativo.');
