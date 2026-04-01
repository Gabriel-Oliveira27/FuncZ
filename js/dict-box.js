'use strict';
// ════════════════════════════════════════════════════════════════════════════
//  DICT-BOX.JS v2 — Extensão do Dicionário
//  §A  Normalização agnóstica a acentos
//  §B  Cama Box — parse, detecção robusta, mesclagem
//  §C  Help Modal — tabela de encartes (../image/encarte.png)
//  §D  Botão de ajuda no header principal
//  §E  Capitalização (CAIXA ALTA | Primeira Letra) + toggle no formulário
//  §F  Feedback visual quando o dicionário preenche campos + undo
//  §G  Detecção de Cama Box no formulário principal (toast + undo)
//  §H  Inicialização
//
//  Carrega APÓS dict.js — expõe window.DICT_BOX e window._abrirHelpEncarte
// ════════════════════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────────────────────
// §A · NORMALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

function _db_normStr(s) {
  return (s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')   // remove diacríticos: ã→a, é→e, etc.
    .toLowerCase()
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// §B · CAMA BOX — parse, detecção e mesclagem
// ─────────────────────────────────────────────────────────────────────────────

/** Tokens de ruído removidos antes de calcular similaridade de modelo */
var _DB_NOISE = /\b(eps|pillow|touch|molas|espuma|mola|casal|queen|king|solteiro|especial|plush|bonnel|pocket|classe|ensacadas)\b|\bc\/\s*\d+\b|\b\d+\s*cm\b|\(\s*\d+\s*\)/g;

/**
 * Extrai metadados de uma descrição de colchão / base box.
 * Agnóstico a acentos, maiúsculas e variações de digitação.
 */
function _db_extrairInfo(descricao) {
  var norm      = _db_normStr(descricao);
  var isColchao = /^colch[ao]o?\b/.test(norm);
  var isBase    = /^base\s*box\b/.test(norm);

  // Marca = último segmento após " - " ou " – "
  var brandMatch = descricao.match(/\s*[-\u2013\u2014]\s*([^-\u2013\u2014]+)$/);
  var brand      = brandMatch ? brandMatch[1].trim() : '';
  var brandNorm  = _db_normStr(brand);

  // Texto sem marca
  var semMarca = descricao.replace(/\s*[-\u2013\u2014]\s*[^-\u2013\u2014]+$/, '').trim();

  // Tamanho (138X188, 138x188, 138×188)
  var sizeMatch = semMarca.match(/\b(\d{2,3})\s*[Xx\u00d7]\s*(\d{2,3})\b/);
  var size      = sizeMatch ? (sizeMatch[1] + 'X' + sizeMatch[2]) : '';

  // Modelo normalizado (sem tipo, tamanho e ruído)
  var modelNorm = _db_normStr(semMarca)
    .replace(/^(colch[ao]o?|base\s*box)\s*/, '')
    .replace(/\b\d{2,3}\s*[x\u00d7]\s*\d{2,3}\b/g, '')
    .replace(_DB_NOISE, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Modelo original (capitalização preservada, sem tipo nem tamanho)
  var modelOrig = semMarca
    .replace(/^(colch[aã]o|base\s*box)\s*/i, '')
    .replace(/\b\d{2,3}\s*[Xx\u00d7]\s*\d{2,3}\b/g, '')
    .replace(/\bc\/\s*\d+\b/gi, '')
    .replace(/\b\d+\s*cm\b/gi, '')
    .replace(/\beps\b/gi, '')
    .replace(/\(\s*\d+\s*\)/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  return { isColchao, isBase, brand, brandNorm, model: modelNorm, modelOrig, size, full: descricao };
}

/** Similaridade Jaccard entre tokens de dois modelos normalizados */
function _db_simModelo(a, b) {
  if (!a || !b) return 0;
  var ta = new Set(a.split(/\s+/).filter(function(w) { return w.length >= 2; }));
  var tb = new Set(b.split(/\s+/).filter(function(w) { return w.length >= 2; }));
  if (!ta.size || !tb.size) return 0;
  var inter = 0;
  ta.forEach(function(t) { if (tb.has(t)) inter++; });
  return inter / (ta.size + tb.size - inter);
}

/**
 * Detecta pares Colchão + Base Box numa lista de produtos.
 * Critério primário: tamanho igual + marca igual → aceito independente de similaridade.
 * Critério secundário: similaridade de modelo >= 30%.
 */
function _db_detectarPares(lista) {
  var colchoes = lista.filter(function(p) {
    return /^colch[ao]o?\b/i.test(_db_normStr(p.descricao || ''));
  });
  var bases = lista.filter(function(p) {
    return /^base\s*box\b/i.test(_db_normStr(p.descricao || ''));
  });

  if (!colchoes.length || !bases.length) return [];

  var pares      = [];
  var usadosBases = new Set();

  colchoes.forEach(function(col) {
    var ci = _db_extrairInfo(col.descricao);

    bases.forEach(function(base) {
      if (usadosBases.has(base.codigo)) return;
      var bi = _db_extrairInfo(base.descricao);

      // Rejeitar tamanhos incompatíveis
      if (ci.size && bi.size && ci.size !== bi.size) return;
      // Rejeitar marcas incompatíveis
      if (ci.brandNorm && bi.brandNorm && ci.brandNorm !== bi.brandNorm) return;

      var sim          = _db_simModelo(ci.model, bi.model);
      var sameSize     = !!(ci.size && bi.size && ci.size === bi.size);
      var sameBrand    = !!(ci.brandNorm && bi.brandNorm && ci.brandNorm === bi.brandNorm);
      var forteMatch   = sameSize && sameBrand;   // fallback forte: sem necessidade de sim

      if (sim < 0.30 && !forteMatch) return;

      var score = sim + (sameSize ? 0.4 : 0) + (sameBrand ? 0.2 : 0);
      pares.push({ col, base, colInfo: ci, baseInfo: bi, sim, score });
      usadosBases.add(base.codigo);
    });
  });

  return pares.sort(function(a, b) { return b.score - a.score; });
}

/**
 * Mescla um par Colchão + Base Box em "Conj. Box <modelo> <tamanho>".
 */
function _db_mesclarPar(par) {
  var ci    = par.colInfo;
  var bi    = par.baseInfo;
  var size  = ci.size || bi.size || '';
  var brand = ci.brand || bi.brand || '';

  var modeloLimpo = (ci.modelOrig || bi.modelOrig || '')
    .replace(new RegExp(size.replace('X', '[Xx\u00d7]'), 'gi'), '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  var descricao  = ('Conj. Box ' + modeloLimpo + (size ? ' ' + size : ''))
    .replace(/\s{2,}/g, ' ').trim().toUpperCase();
  var subdescricao = brand.toUpperCase();
  var codigo       = par.col.codigo + '/' + par.base.codigo;
  var avista       = (Number(par.col.avista) || 0) + (Number(par.base.avista) || 0);

  return { codigo, descricao, subdescricao, avista };
}

/** Namespace global — acessado por mass.js e pelo formulário principal */
window.DICT_BOX = {
  detectar:    _db_detectarPares,
  mesclar:     _db_mesclarPar,
  normStr:     _db_normStr,
  extrairInfo: _db_extrairInfo,
};

// ─────────────────────────────────────────────────────────────────────────────
// §C · HELP MODAL — tabela de encartes (imagem)
// ─────────────────────────────────────────────────────────────────────────────

(function _injectHelpModal() {
  if (document.getElementById('encarte-help-overlay')) return;

  var style = document.createElement('style');
  style.id = 'encarte-help-styles';
  style.textContent = `
    #encarte-help-overlay {
      display: none; position: fixed; inset: 0;
      background: rgba(0,0,0,.82); backdrop-filter: blur(7px);
      z-index: 16000; align-items: center; justify-content: center; padding: 16px;
    }
    #encarte-help-overlay.open { display: flex; }
    #encarte-help-box {
      background: white; border-radius: 16px;
      max-width: 920px; width: 100%; max-height: 93vh;
      overflow: hidden; display: flex; flex-direction: column;
      box-shadow: 0 28px 72px rgba(0,0,0,.4);
      animation: encHelpIn .25s cubic-bezier(.16,1,.3,1);
    }
    @keyframes encHelpIn {
      from { opacity:0; transform:scale(.92) translateY(20px); }
      to   { opacity:1; transform:scale(1)   translateY(0); }
    }
    .enc-help-hdr {
      display:flex; align-items:center; justify-content:space-between;
      padding:15px 22px; border-bottom:1.5px solid #e5e7eb;
      background:#f9fafb; flex-shrink:0;
    }
    .enc-help-hdr h4 {
      font-size:15px; font-weight:700; color:#111827; margin:0;
      display:flex; align-items:center; gap:8px;
    }
    .enc-help-hdr h4 i { color:#2563eb; }
    .enc-help-hdr p { font-size:12px; color:#6b7280; margin:3px 0 0; }
    .enc-help-close {
      background:#f3f4f6; border:none; width:34px; height:34px;
      border-radius:8px; cursor:pointer; font-size:19px; color:#6b7280;
      display:flex; align-items:center; justify-content:center; transition:all .15s;
    }
    .enc-help-close:hover { background:#fee2e2; color:#ef4444; }
    .enc-help-body {
      flex:1; overflow-y:auto; padding:20px;
      display:flex; align-items:flex-start; justify-content:center;
      background:#f0f2f7;
    }
    .enc-help-body img {
      max-width:100%; height:auto; border-radius:10px;
      box-shadow:0 6px 24px rgba(0,0,0,.18); display:block;
    }
    .enc-img-error {
      padding:48px 24px; text-align:center; color:#9ca3af; font-size:14px;
    }
    .enc-img-error i { font-size:44px; margin-bottom:14px; display:block; color:#d1d5db; }

    /* ── BOTÃO AJUDA (header principal + mass.js) ── */
    .btn-ajuda-encarte {
      display:inline-flex; align-items:center; gap:6px;
      padding:7px 13px; background:#fffbeb; border:1.5px solid #fde68a;
      border-radius:8px; font-size:12px; font-weight:600;
      color:#92400e; cursor:pointer; transition:all .15s; white-space:nowrap;
    }
    .btn-ajuda-encarte:hover {
      background:#fef3c7; border-color:#f59e0b;
      transform:translateY(-1px); box-shadow:0 2px 8px rgba(245,158,11,.2);
    }
    .btn-ajuda-encarte i { font-size:12px; }

    /* ── TOGGLE DE CAPITALIZAÇÃO ── */
    .cap-mode-wrap {
      display:inline-flex; align-items:center;
      border:1.5px solid #e5e7eb; border-radius:8px; overflow:hidden; flex-shrink:0;
    }
    .cap-mode-btn {
      padding:7px 12px; border:none; background:white;
      font-size:11px; font-weight:600; color:#6b7280;
      cursor:pointer; transition:all .15s; line-height:1;
      display:flex; align-items:center; gap:4px; white-space:nowrap;
    }
    .cap-mode-btn + .cap-mode-btn { border-left:1.5px solid #e5e7eb; }
    .cap-mode-btn:hover { background:#f9fafb; color:#374151; }
    .cap-mode-btn.active { background:#eff6ff; color:#1d4ed8; }

    /* ── FEEDBACK VISUAL DE CAMPOS PREENCHIDOS PELO DICT ── */
    @keyframes dictFillPulse {
      0%   { box-shadow:0 0 0 0 rgba(37,99,235,.5); background:white; }
      35%  { box-shadow:0 0 0 5px rgba(37,99,235,.14); background:#eff6ff; }
      100% { box-shadow:0 0 0 0 rgba(37,99,235,0); background:white; }
    }
    .dict-field-flash {
      animation:dictFillPulse 1.4s ease forwards;
      border-color:#2563eb !important;
    }
    .dict-field-badge {
      position:absolute; top:-9px; right:10px;
      padding:1px 7px; border-radius:8px;
      background:#eff6ff; color:#1d4ed8;
      font-size:10px; font-weight:700; pointer-events:none;
      animation:dictBadgeIn .2s ease; z-index:5; white-space:nowrap;
    }
    @keyframes dictBadgeIn {
      from { opacity:0; transform:translateY(-5px); }
      to   { opacity:1; transform:translateY(0); }
    }
  `;
  document.head.appendChild(style);

  var wrap = document.createElement('div');
  wrap.id = 'encarte-help-overlay';
  wrap.innerHTML = `
    <div id="encarte-help-box">
      <div class="enc-help-hdr">
        <div>
          <h4><i class="fa-solid fa-table-list"></i> Tabela de Tamanhos de Encartes</h4>
          <p>Consulte antes de gerar cartazes para evitar incompatibilidades de tamanho</p>
        </div>
        <button class="enc-help-close" id="encarte-help-close">×</button>
      </div>
      <div class="enc-help-body">
        <img
          src="../image/encarte.png"
          alt="Tabela de tamanhos de encartes"
          onerror="this.outerHTML='<div class=\\'enc-img-error\\'><i class=\\'fa-solid fa-image\\'></i><p>Imagem não encontrada.<br><small>Caminho esperado: ../image/encarte.png</small></p></div>'"
        >
      </div>
    </div>
  `;
  document.body.appendChild(wrap);

  document.getElementById('encarte-help-close').addEventListener('click', function() {
    wrap.classList.remove('open');
  });
  wrap.addEventListener('click', function(e) {
    if (e.target === wrap) wrap.classList.remove('open');
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && wrap.classList.contains('open')) wrap.classList.remove('open');
  });
}());

/** Abre o modal de encartes — compartilhado com mass.js */
window._abrirHelpEncarte = function() {
  var el = document.getElementById('encarte-help-overlay');
  if (el) el.classList.add('open');
};

// ─────────────────────────────────────────────────────────────────────────────
// §D · BOTÃO DE AJUDA NO HEADER PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

function _db_injectMainHelpButton() {
  if (document.getElementById('btn-ajuda-encarte-main')) return;
  var header = document.querySelector('.global-header');
  if (!header) return;
  var btn = document.createElement('button');
  btn.id = 'btn-ajuda-encarte-main';
  btn.className = 'btn-ajuda-encarte';
  btn.title = 'Ver tabela de tamanhos de encartes';
  btn.innerHTML = '<i class="fa-solid fa-table-list"></i> Tabela de encartes';
  btn.addEventListener('click', window._abrirHelpEncarte);
  header.appendChild(btn);
}

// ─────────────────────────────────────────────────────────────────────────────
// §E · CAPITALIZAÇÃO — CAIXA ALTA | PRIMEIRA LETRA
// ─────────────────────────────────────────────────────────────────────────────

var _CAP_KEY = 'cartazes-cap-mode'; // 'upper' | 'title'

function _db_getCapMode() {
  return localStorage.getItem(_CAP_KEY) || 'upper';
}

function _db_setCapMode(modo) {
  localStorage.setItem(_CAP_KEY, modo);
  document.querySelectorAll('.cap-mode-btn').forEach(function(b) {
    b.classList.toggle('active', b.dataset.cap === modo);
  });
}

/** Title Case pt-BR (reutiliza _titleCase do dict.js se disponível) */
function _db_titleCase(str) {
  if (typeof _titleCase === 'function') return _titleCase(str);
  if (!str) return '';
  var lowers  = new Set(['de','da','do','das','dos','e','a','o','em','no','na','ao','por','para','com','um','uma']);
  var uppers  = new Set(['TV','LED','4K','8K','HD','FHD','UHD','GB','TB','MB','BTU','KG','HZ','W','WIFI','BLUETOOTH','USB','HDMI']);
  return str.split(/\s+/).filter(Boolean).map(function(w, i) {
    var up = w.toUpperCase(), lo = w.toLowerCase();
    if (uppers.has(up) || /\d/.test(w)) return up;
    if (i > 0 && lowers.has(lo)) return lo;
    return lo.charAt(0).toUpperCase() + lo.slice(1);
  }).join(' ');
}

function _db_capitalizar(str) {
  if (!str) return str;
  return _db_getCapMode() === 'upper' ? str.toUpperCase() : _db_titleCase(str);
}

// Expor no namespace
window.DICT_BOX.capitalizar = _db_capitalizar;
window.DICT_BOX.getCapMode  = _db_getCapMode;
window.DICT_BOX.setCapMode  = _db_setCapMode;

/** Injeta o toggle de capitalização no formulário, antes do botão "Adicionar" */
function _db_injectCapToggle() {
  if (document.getElementById('cap-mode-toggle-wrap')) return;
  var submitBtn = document.querySelector('#product-form [type="submit"]');
  if (!submitBtn) return;
  var row = submitBtn.closest('div');
  if (!row) return;

  var wrap = document.createElement('div');
  wrap.id = 'cap-mode-toggle-wrap';
  wrap.style.cssText = 'display:flex;align-items:center;gap:7px;flex-shrink:0;';

  var label = document.createElement('span');
  label.style.cssText = 'font-size:11px;font-weight:600;color:#9ca3af;white-space:nowrap;';
  label.textContent = 'Caixa:';

  var group = document.createElement('div');
  group.className = 'cap-mode-wrap';

  var modo = _db_getCapMode();
  [
    { m:'upper', icon:'fa-font',        text:'CAIXA ALTA',     tip:'Todos os campos em MAIÚSCULO'             },
    { m:'title', icon:'fa-text-height', text:'Primeira Letra', tip:'Primeira letra de cada palavra maiúscula' },
  ].forEach(function(opt) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cap-mode-btn' + (modo === opt.m ? ' active' : '');
    btn.dataset.cap = opt.m;
    btn.title = opt.tip;
    btn.innerHTML = '<i class="fa-solid ' + opt.icon + '"></i> ' + opt.text;
    btn.addEventListener('click', function() {
      _db_setCapMode(opt.m);
      _db_reaplicarCap();
    });
    group.appendChild(btn);
  });

  wrap.appendChild(label);
  wrap.appendChild(group);
  row.insertBefore(wrap, row.firstChild);
}

var _CAP_FIELDS = ['descricao','subdescricao','feature-1','feature-2','feature-3'];

/** Reaplicar modo de capitalização em todos os campos visíveis do formulário */
function _db_reaplicarCap() {
  _CAP_FIELDS.forEach(function(id) {
    var el = document.getElementById(id);
    if (el && el.value.trim()) el.value = _db_capitalizar(el.value);
  });
}

/** Aplicar capitalização no blur de cada campo */
function _db_hookBlurCap() {
  _CAP_FIELDS.forEach(function(id) {
    var el = document.getElementById(id);
    if (!el) return;
    el.addEventListener('blur', function() {
      if (el.value.trim()) el.value = _db_capitalizar(el.value);
    });
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// §F · FEEDBACK VISUAL — dicionário preencheu campos
// ─────────────────────────────────────────────────────────────────────────────

/** Flash animado + badge temporário no campo */
function _db_flashField(el) {
  if (!el) return;
  el.classList.remove('dict-field-flash');
  void el.offsetWidth;
  el.classList.add('dict-field-flash');

  var parent = el.closest('.form-group') || el.parentElement;
  if (parent) {
    var existing = parent.querySelector('.dict-field-badge');
    if (existing) existing.remove();
    var old = parent.style.position;
    parent.style.position = 'relative';
    var badge = document.createElement('span');
    badge.className = 'dict-field-badge';
    badge.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles" style="font-size:9px;margin-right:3px;"></i>Dict';
    parent.appendChild(badge);
    setTimeout(function() {
      el.classList.remove('dict-field-flash');
      badge.remove();
      if (!old) parent.style.position = '';
    }, 3500);
  }
}

/**
 * Sobrescreve window.aplicarDicionarioAoCampos para:
 *   1. Aplicar o modo de capitalização do usuário após o dict.js rodar
 *   2. Dar feedback visual nos campos alterados
 *   3. Exibir toast "Dict preencheu N campos" com botão Desfazer
 */
(function _patchAplicar() {
  var _maxTentativas = 20, _tentativas = 0;
  var _intervalo = setInterval(function() {
    _tentativas++;
    if (_tentativas > _maxTentativas) { clearInterval(_intervalo); return; }
    if (typeof window.aplicarDicionarioAoCampos !== 'function') return;
    clearInterval(_intervalo);

    var _orig = window.aplicarDicionarioAoCampos;

    window.aplicarDicionarioAoCampos = function() {
      var descEl = document.getElementById('descricao');
      var subEl  = document.getElementById('subdescricao');
      var f1El   = document.getElementById('feature-1');
      var f2El   = document.getElementById('feature-2');
      var f3El   = document.getElementById('feature-3');

      // Snapshot antes
      var backup = {
        descricao:    descEl?.value  || '',
        subdescricao: subEl?.value   || '',
        feat1:        f1El?.value    || '',
        feat2:        f2El?.value    || '',
        feat3:        f3El?.value    || '',
      };

      // Rodar dict.js original (aplica _titleCase interno)
      var mudou = _orig.apply(this, arguments);
      if (!mudou) return false;

      // Reaplicar capitalização escolhida pelo usuário
      _CAP_FIELDS.forEach(function(id) {
        var el = document.getElementById(id);
        if (el && el.value.trim()) el.value = _db_capitalizar(el.value);
      });

      // Detectar campos alterados
      var mapa = {
        descricao:    descEl,
        subdescricao: subEl,
        feat1:        f1El,
        feat2:        f2El,
        feat3:        f3El,
      };
      var after = {
        descricao:    descEl?.value  || '',
        subdescricao: subEl?.value   || '',
        feat1:        f1El?.value    || '',
        feat2:        f2El?.value    || '',
        feat3:        f3El?.value    || '',
      };

      var alterados = [];
      Object.keys(backup).forEach(function(k) {
        if (backup[k] !== after[k] && mapa[k]) alterados.push(mapa[k]);
      });

      // Flash visual
      alterados.forEach(function(el) { _db_flashField(el); });

      // Toast com undo
      if (alterados.length > 0) _db_toastDictFeedback(alterados.length, backup, mapa);

      return true;
    };
  }, 150);
}());

function _db_toastDictFeedback(qtd, backup, mapa) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast info';
  toast.style.cssText = 'min-width:340px;';
  toast.innerHTML = `
    <div class="toast-icon" style="background:#2563eb;">
      <i class="fa-solid fa-wand-magic-sparkles"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">Dicionário ajustou ${qtd} campo${qtd > 1 ? 's' : ''}!</div>
      <div class="toast-message" style="font-size:12px;">
        Campos foram normalizados automaticamente conforme o dicionário.
      </div>
      <div class="toast-actions" style="margin-top:7px;gap:6px;display:flex;">
        <button class="toast-action-btn secondary _db-dict-undo" style="font-size:12px;padding:5px 10px;">
          <i class="fa-solid fa-rotate-left"></i>&nbsp;Desfazer
        </button>
      </div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  var fechar = function() {
    toast.classList.add('removing');
    setTimeout(function() { toast.remove(); }, 300);
  };

  toast.querySelector('._db-dict-undo').addEventListener('click', function() {
    Object.keys(backup).forEach(function(k) { if (mapa[k]) mapa[k].value = backup[k]; });
    fechar();
    if (typeof showToast === 'function') showToast('info', 'Desfeito', 'Campos restaurados para os valores anteriores.');
  });

  setTimeout(fechar, 14000);
}

// ─────────────────────────────────────────────────────────────────────────────
// §G · DETECÇÃO DE CAMA BOX NO FORMULÁRIO PRINCIPAL
// ─────────────────────────────────────────────────────────────────────────────

var _db_paresNotificados = new Set();

function _db_verificarBoxNosProducts() {
  if (typeof products === 'undefined' || products.length < 2) return;
  var pares = _db_detectarPares(products);
  if (!pares.length) return;

  pares.forEach(function(par) {
    var key = String(par.col.id || par.col.codigo) + '|' + String(par.base.id || par.base.codigo);
    if (_db_paresNotificados.has(key)) return;
    _db_paresNotificados.add(key);
    _db_mostrarToastBox(par);
  });
}

function _db_mostrarToastBox(par) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  var mesclado  = _db_mesclarPar(par);
  var colLabel  = (par.col.descricao  || '').split(' - ')[0].substring(0, 36);
  var baseLabel = (par.base.descricao || '').split(' - ')[0].substring(0, 36);

  var fmt = function(n) { return (n || 0).toFixed(2).replace('.', ','); };

  var toast = document.createElement('div');
  toast.className = 'toast info';
  toast.style.cssText = 'min-width:370px;max-width:500px;';
  toast.innerHTML = `
    <div class="toast-icon" style="background:#16a34a;">
      <i class="fa-solid fa-bed"></i>
    </div>
    <div class="toast-content">
      <div class="toast-title">Conjunto Box detectado!</div>
      <div class="toast-message" style="line-height:1.5;">
        <b>${colLabel}</b> +<br>
        <b>${baseLabel}</b>
        <span style="color:#6b7280;font-size:11px;margin-top:3px;display:block;">
          → <b>${mesclado.descricao}</b>${mesclado.subdescricao ? ' · ' + mesclado.subdescricao : ''}
          &nbsp;·&nbsp;R$ ${fmt(mesclado.avista)} à vista
        </span>
      </div>
      <div class="toast-actions" style="margin-top:8px;gap:6px;display:flex;">
        <button class="toast-action-btn primary _db-mesclar" style="font-size:12px;padding:5px 10px;">
          <i class="fa-solid fa-object-group"></i>&nbsp;Mesclar
        </button>
        <button class="toast-action-btn secondary _db-ignorar" style="font-size:12px;padding:5px 10px;">
          Ignorar
        </button>
      </div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  var fechar = function() {
    toast.classList.add('removing');
    setTimeout(function() { toast.remove(); }, 300);
  };

  toast.querySelector('._db-mesclar').addEventListener('click', function() { fechar(); _db_executarMesclagem(par, mesclado); });
  toast.querySelector('._db-ignorar').addEventListener('click', fechar);
  setTimeout(fechar, 26000);
}

function _db_executarMesclagem(par, mesclado) {
  if (typeof products === 'undefined') return;

  var backup = JSON.parse(JSON.stringify(products));

  var iCol  = products.findIndex(function(p) { return String(p.id || p.codigo) === String(par.col.id || par.col.codigo); });
  var iBase = products.findIndex(function(p) { return String(p.id || p.codigo) === String(par.base.id || par.base.codigo); });

  if (iCol === -1 || iBase === -1) {
    if (typeof showToast === 'function') showToast('error', 'Erro ao mesclar', 'Produtos não encontrados na lista.');
    return;
  }

  var insertAt = Math.min(iCol, iBase);

  // Estimar nova parcela proporcionalmente
  var avistaOrig  = Number(par.col.avista) || 0;
  var parcelaOrig = Number(par.col.parcela) || 0;
  var avistaNovo  = mesclado.avista;
  var parcelaNova = avistaOrig > 0
    ? Math.round((avistaNovo * parcelaOrig / avistaOrig) * 100) / 100
    : avistaNovo;

  var prodMesclado = Object.assign({}, par.col, {
    id:           Date.now() + Math.random(),
    codigo:       mesclado.codigo,
    descricao:    mesclado.descricao,
    subdescricao: mesclado.subdescricao,
    avista:       avistaNovo,
    parcela:      parcelaNova,
    features:     (par.col.features && par.col.features.length) ? par.col.features : (par.base.features || []),
    garantia12:   0, garantia24: 0, garantia36: 0,
  });

  [iCol, iBase].sort(function(a,b){return b-a;}).forEach(function(i){ products.splice(i, 1); });
  products.splice(insertAt, 0, prodMesclado);

  if (typeof salvarCartazesLocalStorage === 'function') salvarCartazesLocalStorage();
  if (typeof renderProducts             === 'function') renderProducts();

  _db_toastUndo(mesclado.descricao, backup);
}

function _db_toastUndo(label, backup) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast success';
  toast.innerHTML = `
    <div class="toast-icon"><i class="fa-solid fa-check-double"></i></div>
    <div class="toast-content">
      <div class="toast-title">Produtos mesclados com sucesso!</div>
      <div class="toast-message" style="font-size:12px;">${label}</div>
      <div class="toast-actions" style="margin-top:6px;">
        <button class="toast-action-btn secondary _db-undo" style="font-size:12px;padding:5px 10px;">
          <i class="fa-solid fa-rotate-left"></i>&nbsp;Desfazer
        </button>
      </div>
    </div>
    <button class="toast-close" onclick="this.parentElement.remove()">×</button>
  `;
  container.appendChild(toast);

  var fechar = function() {
    toast.classList.add('removing');
    setTimeout(function() { toast.remove(); }, 300);
  };

  toast.querySelector('._db-undo').addEventListener('click', function() {
    if (typeof products !== 'undefined') {
      products.length = 0;
      backup.forEach(function(p) { products.push(p); });
      if (typeof salvarCartazesLocalStorage === 'function') salvarCartazesLocalStorage();
      if (typeof renderProducts             === 'function') renderProducts();
    }
    fechar();
    if (typeof showToast === 'function') showToast('info', 'Desfeito', 'Produtos restaurados individualmente.');
  });

  setTimeout(fechar, 18000);
}

// ─────────────────────────────────────────────────────────────────────────────
// §H · INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  _db_injectMainHelpButton();
  _db_injectCapToggle();
  _db_hookBlurCap();

  // Verificar cama box 450ms após cada submit do formulário principal
  var form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', function() {
      setTimeout(_db_verificarBoxNosProducts, 450);
    }, false);
  }
});

console.log('✅ dict-box.js v2 carregado — Box, Help, Capitalização e Feedback visual ativos.');
