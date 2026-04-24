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
  // Após _db_normStr: "colchão" → "colchao", "colchon" → "colchon"
  // Regex cobre: colchao, colchon, colcho, colchaozinho, etc.
  var isColchao = /^colch[ao][on]?\b/.test(norm);
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
    .replace(/^(colch[ao][on]?|base\s*box)\s*/, '')
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
    return /^colch[ao][on]?\b/i.test(_db_normStr(p.descricao || ''));
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

/** Abre o modal de encartes — compartilhado com mass.js */
window._abrirHelpEncarte = function() {
  var el = document.getElementById('encarte-help-overlay');
  if (el) el.classList.add('open');
};

// ─────────────────────────────────────────────────────────────────────────────
// §D · BOTÃO DE AJUDA — event listener para o botão do header e fechar modal
// ─────────────────────────────────────────────────────────────────────────────

function _db_wireHelpModal() {
  // Botão de ajuda injetado dinamicamente no header pelo dict-box
  var btnHeader = document.getElementById('btn-ajuda-encarte-main');
  if (btnHeader) btnHeader.addEventListener('click', window._abrirHelpEncarte);

  // Fechar o modal (botão X e clique fora)
  var overlay = document.getElementById('encarte-help-overlay');
  var closeBtn = document.getElementById('encarte-help-close');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.classList.remove('open');
    });
  }
  if (closeBtn) {
    closeBtn.addEventListener('click', function() {
      if (overlay) overlay.classList.remove('open');
    });
  }
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('open'))
      overlay.classList.remove('open');
  });
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
  // A UI de capitalização foi movida para o painel lateral "Configurações de estilo"
  // (acessado pelo botão de engrenagem no formulário principal).
  // Esta função está intencionalmente desativada para evitar duplicação.
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
    // Usar dialog de confirmação se disponível, senão fallback para toast
    if (typeof showConfirm === 'function') {
      _db_mostrarDialogBox(par);
    } else {
      _db_mostrarToastBox(par);
    }
  });
}

/** Dialog de confirmação de mesclagem — usa o sistema confirm-overlay do script.js */
function _db_mostrarDialogBox(par) {
  var mesclado  = _db_mesclarPar(par);
  var fmt       = function(n) { return (n || 0).toFixed(2).replace('.', ','); };
  var colLabel  = (par.col.descricao  || '').split(' - ')[0].substring(0, 44);
  var baseLabel = (par.base.descricao || '').split(' - ')[0].substring(0, 44);

  var msg = colLabel + '\n+ ' + baseLabel
    + '\n\n→ ' + mesclado.descricao
    + (mesclado.subdescricao ? ' · ' + mesclado.subdescricao : '')
    + '  ·  R$ ' + fmt(mesclado.avista) + ' à vista';

  showConfirm({
    title:        'Conjunto Box detectado!',
    subtitle:     'Par colchão + base box identificado automaticamente',
    message:      msg,
    confirmText:  'Mesclar em Conj. Box',
    cancelText:   'Manter separados',
    iconType:     'info',
    onConfirm: function() { _db_executarMesclagem(par, mesclado); },
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
  _db_wireHelpModal();
  _db_injectCapToggle();
  _db_hookBlurCap();

  // Verificar cama box 450ms após cada submit do formulário principal
  var form = document.getElementById('product-form');
  if (form) {
    form.addEventListener('submit', function() {
      setTimeout(_db_verificarBoxNosProducts, 450);
    }, false);
  }

  // ── FIX capitalização: aplica o modo escolhido (CAIXA ALTA / Primeira Letra)
  //    ao produto já armazenado em products[], APÓS dict.js ter rodado com _titleCase.
  //    Usa capture para salvar o comprimento antes, bubble para corrigir depois.
  if (form) {
    var _capLenAntes = -1;

    form.addEventListener('submit', function() {
      if (typeof products !== 'undefined') _capLenAntes = products.length;
    }, true); // capture — roda antes do handler original

    form.addEventListener('submit', function() {
      if (typeof products === 'undefined') return;
      if (products.length <= _capLenAntes) return; // validação falhou, nada adicionado

      var last = products[products.length - 1];
      if (!last) return;

      last.descricao    = _db_capitalizar(last.descricao    || '');
      last.subdescricao = _db_capitalizar(last.subdescricao || '');
      last.features     = (last.features || []).map(function(f) { return _db_capitalizar(f); });

      if (typeof salvarCartazesLocalStorage === 'function') salvarCartazesLocalStorage();
      if (typeof renderProducts            === 'function') renderProducts();
    }, false); // bubble — roda após dict.js ter aplicado _titleCase
  }

  // Verificar ao restaurar produtos do localStorage
  setTimeout(function() {
    if (typeof products !== 'undefined' && products.length >= 2) {
      _db_verificarBoxNosProducts();
    }
  }, 1500);

  _db_patchAdicionarProdutoDaBusca();
});

/** Envolve adicionarProdutoDaBusca para rodar detecção de Box após adicionar via modal */
function _db_patchAdicionarProdutoDaBusca() {
  // Pode ser que dict.js ainda não fez seu próprio patch; tentar algumas vezes
  var tentativas = 0;
  var interval = setInterval(function() {
    tentativas++;
    if (tentativas > 15) { clearInterval(interval); return; }
    if (typeof window.adicionarProdutoDaBusca !== 'function') return;
    clearInterval(interval);

    var prev = window.adicionarProdutoDaBusca;
    window.adicionarProdutoDaBusca = function(codigo) {
      prev(codigo);
      // Detectar pares após o modal de busca adicionar o produto
      setTimeout(_db_verificarBoxNosProducts, 600);
    };
  }, 200);
}

console.log('✅ dict-box.js v2 carregado — Box, Help, Capitalização e Feedback visual ativos.');
