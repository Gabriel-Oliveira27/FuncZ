'use strict';
// ═══════════════════════════════════════════════════════════════════════════
//  DECIMAL-FIX.JS v2.2 — Auto-correção do ,90 + botão por card
//  ─────────────────────────────────────────────────────────────────────────
//  BUGS CORRIGIDOS vs v2.1:
//
//  1. Nenhum fallback para a renderização inicial.
//     editcart.js tem setTimeout(_addBtns, 300) no DOMContentLoaded para
//     injetar "Editar cartaz" nos cards que já existiam ao carregar.
//     Nosso módulo não tinha equivalente — o botão "Centavos" nunca
//     aparecia na primeira abertura da página.
//     FIX: setTimeout 500ms no DOMContentLoaded (depois do 300ms do editcart).
//
//  2. decimalOffset não era persistido.
//     salvarCartazesLocalStorage() lista explicitamente os campos salvos
//     e decimalOffset não está na lista — era perdido a cada recarga.
//     FIX: armazenamento próprio em localStorage indexado por produto.codigo.
//
//  Integração: adicionar em cartazes.html antes de </body> (apenas UMA vez):
//    <script src="../js/decimal-fix.js"></script>
// ═══════════════════════════════════════════════════════════════════════════

(function DecimalFix() {

  /* ── Constantes ─────────────────────────────────────────────────────── */
  var SCALE_X      = 0.7;
  var GAP_MIN      = 6;
  var GLOBAL_KEY   = 'cartazes-decimal-offset';          // offset global (slider)
  var PRODUCT_KEY  = 'cartazes-decimal-product-offsets'; // offsets por produto.codigo

  /* ── Estado do modal ────────────────────────────────────────────────── */
  var _mpid   = null;  // pid (product.id) sendo editado
  var _mcodigo = null; // product.codigo sendo editado
  var _mpend  = 0;     // offset em edição (não salvo)
  var _msaved = 0;     // offset antes de abrir (para cancelar)

  /* ══════════════════════════════════════════════════════════════════════
     OFFSETS — global e por produto
  ══════════════════════════════════════════════════════════════════════ */
  function getOffset() {
    try { return parseFloat(localStorage.getItem(GLOBAL_KEY)) || 0; } catch { return 0; }
  }
  function saveOffset(px) {
    try { localStorage.setItem(GLOBAL_KEY, String(parseFloat(px) || 0)); } catch {}
  }

  // Carrega o mapa de offsets por produto (codigo → px)
  function _loadProductOffsets() {
    try { return JSON.parse(localStorage.getItem(PRODUCT_KEY) || '{}'); } catch { return {}; }
  }
  function _saveProductOffsets(map) {
    try { localStorage.setItem(PRODUCT_KEY, JSON.stringify(map)); } catch {}
  }
  function getProductOffset(codigo) {
    if (!codigo) return 0;
    return _loadProductOffsets()[String(codigo)] || 0;
  }
  function saveProductOffset(codigo, px) {
    if (!codigo) return;
    var map = _loadProductOffsets();
    if (px === 0) { delete map[String(codigo)]; }
    else          { map[String(codigo)] = px; }
    _saveProductOffsets(map);
  }

  function _getProduct(pid) {
    if (typeof products === 'undefined' || !pid) return null;
    return products.find(function(p) { return String(p.id) === String(pid); }) || null;
  }

  /* ══════════════════════════════════════════════════════════════════════
     CSS
  ══════════════════════════════════════════════════════════════════════ */
  function _injectCSS() {
    if (document.getElementById('df-styles')) return;
    var s = document.createElement('style');
    s.id = 'df-styles';
    s.textContent = '\n'
      /* ── botão no card ── */
      + '.df-centavos-btn{'
      + 'display:flex;align-items:center;justify-content:center;'
      + 'gap:5px;padding:10px 12px;'
      + 'background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;'
      + 'font-size:12px;font-weight:600;color:#475569;'
      + 'cursor:pointer;transition:all .12s ease;white-space:nowrap;font-family:inherit;'
      + 'min-height:32px;margin:0;flex-shrink:0;'
      + '}\n'
      + '.df-centavos-btn i{font-size:12px;opacity:.8;}\n'
      + '.df-centavos-btn:hover{'
      + 'background:#eff6ff;border-color:#2563eb;color:#2563eb;'
      + 'box-shadow:0 1px 3px rgba(37,99,235,.12);}\n'
      + '.df-centavos-btn:active{transform:scale(.98);}\n'
      + '.df-centavos-btn .df-off-badge{'
      + 'padding:2px 6px;border-radius:4px;font-size:10px;font-weight:700;'
      + 'background:#2563eb;color:white;margin-left:auto;'
      + '}\n'
      /* ── overlay simples (sem blur) ── */
      + '#df-overlay{'
      + 'display:none;position:fixed;inset:0;'
      + 'background:rgba(0,0,0,.48);'
      + 'z-index:11500;align-items:center;justify-content:center;'
      + 'animation:dfFadeIn .12s ease;}\n'
      + '#df-overlay.df-open{display:flex;}\n'
      + '@keyframes dfFadeIn{from{opacity:0}to{opacity:1}}\n'
      /* ── caixa do modal ── */
      + '#df-box{'
      + 'background:white;border-radius:12px;width:90%;max-width:360px;'
      + 'box-shadow:0 10px 40px rgba(0,0,0,.15);overflow:hidden;'
      + 'animation:dfBoxIn .2s cubic-bezier(.16,1,.3,1);}\n'
      + '@keyframes dfBoxIn{'
      + 'from{opacity:0;transform:scale(.95) translateY(8px)}'
      + 'to{opacity:1;transform:scale(1) translateY(0)}}\n'
      /* ── header modal ── */
      + '#df-hdr{display:flex;align-items:center;gap:10px;padding:12px 14px;'
      + 'background:#f8fafc;border-bottom:1px solid #e2e8f0;}\n'
      + '.df-hdr-ico{width:32px;height:32px;border-radius:6px;flex-shrink:0;'
      + 'background:#eff6ff;'
      + 'display:flex;align-items:center;justify-content:center;color:#2563eb;font-size:14px;}\n'
      + '#df-hdr-title{font-size:13px;font-weight:700;color:#1e293b;}\n'
      + '#df-hdr-sub{font-size:11px;color:#64748b;margin-top:2px;}\n'
      + '#df-close{background:transparent;border:none;width:24px;height:24px;'
      + 'border-radius:4px;cursor:pointer;font-size:18px;color:#94a3b8;'
      + 'display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .1s;}\n'
      + '#df-close:hover{background:#e2e8f0;color:#475569;}\n'
      /* ── body modal ── */
      + '#df-body{padding:16px 14px;}\n'
      + '.df-btns{display:flex;align-items:center;gap:3px;justify-content:center;margin-bottom:10px;flex-wrap:wrap;}\n'
      + '.df-adj{padding:8px 9px;border:1px solid #cbd5e1;background:#f8fafc;'
      + 'border-radius:6px;font-size:11px;font-weight:700;color:#475569;'
      + 'cursor:pointer;transition:all .1s;font-family:inherit;min-width:34px;text-align:center;flex:0 0 auto;}\n'
      + '.df-adj:hover{border-color:#2563eb;color:#2563eb;background:#eff6ff;}\n'
      + '.df-adj:active{transform:scale(.95);}\n'
      + '#df-display{flex:0 0 auto;text-align:center;font-size:18px;font-weight:800;'
      + 'color:#1e293b;padding:8px 12px;background:#f1f5f9;'
      + 'border-radius:6px;min-width:70px;transition:all .12s;letter-spacing:-.3px;'
      + 'border:1px solid #cbd5e1;}\n'
      + '#df-display.df-pos{color:#15803d;background:#dcfce7;border-color:#86efac;}\n'
      + '#df-display.df-neg{color:#0369a1;background:#e0f2fe;border-color:#7dd3fc;}\n'
      + '.df-hint{font-size:10px;color:#64748b;text-align:center;line-height:1.4;margin-top:8px;}\n'
      + '.df-hint strong{color:#475569;font-weight:700;}\n'
      /* ── footer modal ── */
      + '#df-foot{display:flex;gap:7px;padding:10px 14px;'
      + 'border-top:1px solid #e2e8f0;background:#f8fafc;}\n'
      + '#df-reset-modal{padding:8px 10px;background:transparent;'
      + 'border:1px solid #fca5a5;border-radius:6px;'
      + 'font-size:12px;font-weight:600;color:#dc2626;cursor:pointer;transition:all .1s;font-family:inherit;}\n'
      + '#df-reset-modal:hover{background:#fee2e2;border-color:#f87171;}\n'
      + '#df-cancel-modal{flex:1;padding:8px 10px;background:#f8fafc;border:1px solid #cbd5e1;'
      + 'border-radius:6px;font-size:12px;font-weight:600;color:#475569;'
      + 'cursor:pointer;transition:all .1s;font-family:inherit;}\n'
      + '#df-cancel-modal:hover{background:#e2e8f0;border-color:#94a3b8;}\n'
      + '#df-save-modal{flex:1.2;padding:8px 10px;'
      + 'background:#2563eb;border:none;border-radius:6px;'
      + 'font-size:12px;font-weight:700;color:white;cursor:pointer;'
      + 'display:flex;align-items:center;justify-content:center;gap:5px;'
      + 'transition:all .12s;font-family:inherit;box-shadow:0 1px 3px rgba(37,99,235,.2);}\n'
      + '#df-save-modal:hover{background:#1d4ed8;box-shadow:0 2px 6px rgba(37,99,235,.3);}\n'
      + '#df-save-modal:active{transform:scale(.98);}\n'
      /* ── controle global no painel estilos ── */
      + '#df-range{accent-color:#2563eb;cursor:pointer;width:100%;}\n'
      + '#df-gval{min-width:44px;text-align:center;font-size:11px;font-weight:700;'
      + 'color:#2563eb;background:#eff6ff;border:1px solid #bfdbfe;'
      + 'border-radius:4px;padding:3px 8px;white-space:nowrap;flex-shrink:0;}\n'
      + '.df-gbtns{display:flex;gap:7px;}\n'
      + '.df-gbtn{flex:1;padding:8px 10px;border-radius:6px;font-size:12px;font-weight:600;'
      + 'cursor:pointer;display:flex;align-items:center;justify-content:center;'
      + 'gap:5px;font-family:inherit;transition:all .1s;}\n'
      + '#df-gapply{background:#2563eb;border:none;color:white;box-shadow:0 1px 3px rgba(37,99,235,.2);}\n'
      + '#df-gapply:hover{background:#1d4ed8;box-shadow:0 2px 6px rgba(37,99,235,.3);}\n'
      + '#df-greset{background:#f8fafc;border:1px solid #cbd5e1;color:#475569;}\n'
      + '#df-greset:hover{background:#e2e8f0;border-color:#94a3b8;}\n'
      + '.df-g-notice{margin-top:8px;padding:8px 10px;background:#eff6ff;'
      + 'border-left:3px solid #2563eb;border-radius:0 4px 4px 0;'
      + 'font-size:10px;color:#1e40af;line-height:1.5;}\n'
      + '.df-g-notice i{font-size:11px;margin-right:3px;opacity:.75;}\n'
      /* ── dark mode ── */
      + '[data-theme="dark"] .df-centavos-btn{background:#1e293b;border-color:#334155;color:#cbd5e1;}\n'
      + '[data-theme="dark"] .df-centavos-btn:hover{background:#0f172a;border-color:#3b82f6;color:#93c5fd;box-shadow:0 1px 3px rgba(59,130,246,.15);}\n'
      + '[data-theme="dark"] .df-centavos-btn .df-off-badge{background:#3b82f6;}\n'
      + '[data-theme="dark"] #df-box{background:#1e293b;}\n'
      + '[data-theme="dark"] #df-hdr{background:#0f172a;border-bottom-color:#334155;}\n'
      + '[data-theme="dark"] .df-hdr-ico{background:#1e3a5f;color:#93c5fd;}\n'
      + '[data-theme="dark"] #df-hdr-title{color:#f1f5f9;}\n'
      + '[data-theme="dark"] #df-hdr-sub{color:#94a3b8;}\n'
      + '[data-theme="dark"] #df-close{color:#64748b;}\n'
      + '[data-theme="dark"] #df-close:hover{background:#334155;color:#cbd5e1;}\n'
      + '[data-theme="dark"] .df-adj{background:#0f172a;border-color:#334155;color:#cbd5e1;}\n'
      + '[data-theme="dark"] .df-adj:hover{border-color:#3b82f6;color:#93c5fd;background:#1e3a5f;}\n'
      + '[data-theme="dark"] #df-display{background:#0f172a;color:#f1f5f9;border-color:#334155;}\n'
      + '[data-theme="dark"] #df-display.df-pos{background:#052e16;color:#86efac;border-color:#166534;}\n'
      + '[data-theme="dark"] #df-display.df-neg{background:#0c2233;color:#38bdf8;border-color:#164e63;}\n'
      + '[data-theme="dark"] .df-hint{color:#64748b;}\n'
      + '[data-theme="dark"] .df-hint strong{color:#94a3b8;}\n'
      + '[data-theme="dark"] #df-foot{background:#0f172a;border-top-color:#334155;}\n'
      + '[data-theme="dark"] #df-reset-modal{border-color:#7f1d1d;color:#f87171;}\n'
      + '[data-theme="dark"] #df-reset-modal:hover{background:#4c1515;}\n'
      + '[data-theme="dark"] #df-cancel-modal{background:#0f172a;border-color:#334155;color:#cbd5e1;}\n'
      + '[data-theme="dark"] #df-cancel-modal:hover{background:#1e293b;border-color:#475569;}\n'
      + '[data-theme="dark"] #df-save-modal{background:#2563eb;}\n'
      + '[data-theme="dark"] #df-save-modal:hover{background:#1d4ed8;}\n'
      + '[data-theme="dark"] #df-gval{background:#1e3a5f;border-color:#3b82f6;color:#93c5fd;}\n'
      + '[data-theme="dark"] #df-greset{background:#0f172a;border-color:#334155;color:#cbd5e1;}\n'
      + '[data-theme="dark"] #df-greset:hover{background:#1e293b;border-color:#475569;}\n'
      + '[data-theme="dark"] #df-gapply{background:#2563eb;}\n'
      + '[data-theme="dark"] #df-gapply:hover{background:#1d4ed8;}\n'
      + '[data-theme="dark"] .df-g-notice{background:#1e3a5f;border-color:#3b82f6;color:#93c5fd;}\n';
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════════════════
     NÚCLEO — ALGORITMO V1 PRESERVADO
  ══════════════════════════════════════════════════════════════════════ */
  function _fixContainer(container, productOff) {
    productOff = productOff || 0;
    var intEl = container.querySelector('.poster-value-integer');
    var decEl = container.querySelector('.poster-value-decimal');
    if (!intEl || !decEl) return;
    var W = intEl.offsetWidth;
    if (!W) return;
    var intVisualRight = W * SCALE_X;
    decEl.style.marginLeft = '';
    var cssMargin = parseFloat(window.getComputedStyle(decEl).marginLeft) || 0;
    var gap       = (W + cssMargin) - intVisualRight;
    var globalOff = getOffset();
    var target    = GAP_MIN + globalOff + productOff;
    if (gap < target) {
      decEl.style.marginLeft = (intVisualRight - W + target).toFixed(1) + 'px';
    } else if (Math.abs(globalOff + productOff) > 0.5) {
      decEl.style.marginLeft = (cssMargin + globalOff + productOff).toFixed(1) + 'px';
    }
  }

  function fix(rootEl, productOff) {
    if (!rootEl) return;
    productOff = productOff || 0;
    rootEl.querySelectorAll('.poster-value-container').forEach(function(c) {
      _fixContainer(c, productOff);
    });
  }

  function fixPreviews() {
    document.querySelectorAll('.product-preview[data-preview-id]').forEach(function(p) {
      var prod = _getProduct(p.getAttribute('data-preview-id'));
      var off  = prod ? getProductOffset(prod.codigo) : 0;
      requestAnimationFrame(function() { fix(p, off); });
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     PATCHES
  ══════════════════════════════════════════════════════════════════════ */

  // Embute data-decimal-offset no poster root para uso pelo html2canvas patch.
  // "data-digits=" ocorre primeiro no poster root (nunca nos wrappers A5/A6).
  function _patchGenerateHTML() {
    if (typeof window.generatePosterHTML !== 'function') return false;
    if (window.generatePosterHTML._dfPatched) return true;
    var orig = window.generatePosterHTML;
    window.generatePosterHTML = function(product, isPreview) {
      var html = orig.call(this, product, isPreview);
      var off  = product ? getProductOffset(product.codigo) : 0;
      return html.replace('data-digits=', 'data-decimal-offset="' + off + '" data-digits=');
    };
    window.generatePosterHTML._dfPatched = true;
    return true;
  }

  // Aplica fix e injeta botões após cada renderProducts().
  function _patchRender() {
    if (typeof window.renderProducts !== 'function') return false;
    if (window.renderProducts._dfPatched) return true;
    var orig = window.renderProducts;
    window.renderProducts = function() {
      orig.apply(this, arguments);
      // 140ms > 80ms (editcart.js) — garante que .ec-edit-btn já existe
      setTimeout(function() { fixPreviews(); _injectCardButtons(0); }, 140);
    };
    window.renderProducts._dfPatched = true;
    return true;
  }

  // Lê data-decimal-offset e corrige ANTES da captura do html2canvas.
  function _patchCanvas() {
    if (typeof window.html2canvas !== 'function') return false;
    if (window.html2canvas._dfPatched) return true;
    var orig = window.html2canvas;
    window.html2canvas = function(el, opts) {
      if (el && el.querySelectorAll) {
        el.querySelectorAll('.poster-value-container').forEach(function(c) {
          var pEl  = c.closest('[data-decimal-offset]');
          var pOff = pEl ? (parseFloat(pEl.dataset.decimalOffset) || 0) : 0;
          _fixContainer(c, pOff);
        });
      }
      return orig.call(this, el, opts);
    };
    window.html2canvas._dfPatched = true;
    return true;
  }

  /* ══════════════════════════════════════════════════════════════════════
     MODAL
  ══════════════════════════════════════════════════════════════════════ */
  function _buildModal() {
    if (document.getElementById('df-overlay')) return;
    var ov = document.createElement('div');
    ov.id = 'df-overlay';
    ov.innerHTML =
      '<div id="df-box">'
      + '<div id="df-hdr">'
      +   '<div class="df-hdr-ico"><i class="fa-solid fa-subscript"></i></div>'
      +   '<div style="flex:1;min-width:0;overflow:hidden;">'
      +     '<div id="df-hdr-title">Ajuste dos centavos</div>'
      +     '<div id="df-hdr-sub"></div>'
      +   '</div>'
      +   '<button id="df-close" type="button">✕</button>'
      + '</div>'
      + '<div id="df-body">'
      +   '<div class="df-btns">'
      +     '<button type="button" class="df-adj" data-d="-10">−10</button>'
      +     '<button type="button" class="df-adj" data-d="-5">−5</button>'
      +     '<button type="button" class="df-adj" data-d="-1">−1</button>'
      +     '<span id="df-display">+0px</span>'
      +     '<button type="button" class="df-adj" data-d="1">+1</button>'
      +     '<button type="button" class="df-adj" data-d="5">+5</button>'
      +     '<button type="button" class="df-adj" data-d="10">+10</button>'
      +   '</div>'
      +   '<p class="df-hint">Negativo = aproxima · Positivo = afasta<br><strong>Visualização em tempo real</strong></p>'
      + '</div>'
      + '<div id="df-foot">'
      +   '<button id="df-reset-modal" type="button">↺ Reset</button>'
      +   '<button id="df-cancel-modal" type="button">Cancelar</button>'
      +   '<button id="df-save-modal" type="button"><i class="fa-solid fa-check"></i>Salvar</button>'
      + '</div>'
      + '</div>';
    document.body.appendChild(ov);

    ov.addEventListener('click', function(e) { if (e.target === ov) _cancelModal(); });
    document.getElementById('df-close').addEventListener('click', _cancelModal);
    document.getElementById('df-cancel-modal').addEventListener('click', _cancelModal);
    document.getElementById('df-save-modal').addEventListener('click', _saveModal);
    document.getElementById('df-reset-modal').addEventListener('click', function() {
      _mpend = 0; _refreshModal(); _applyToPreview(_mpid, 0);
    });
    document.querySelectorAll('.df-adj').forEach(function(btn) {
      btn.addEventListener('click', function() {
        _mpend = Math.max(-50, Math.min(80, _mpend + (parseInt(btn.dataset.d) || 0)));
        _refreshModal();
        _applyToPreview(_mpid, _mpend);
      });
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && document.getElementById('df-overlay').classList.contains('df-open'))
        _cancelModal();
    });
  }

  function _openModal(pid) {
    _buildModal();
    var product = _getProduct(pid);
    if (!product) return;
    _mpid    = pid;
    _mcodigo = product.codigo;
    _msaved  = getProductOffset(product.codigo);
    _mpend   = _msaved;
    var desc = (product.descricao || '').substring(0, 40);
    document.getElementById('df-hdr-sub').textContent = desc + (product.descricao && product.descricao.length > 40 ? '…' : '');
    _refreshModal();
    document.getElementById('df-overlay').classList.add('df-open');
  }

  function _closeModal() {
    var ov = document.getElementById('df-overlay');
    if (ov) ov.classList.remove('df-open');
    _mpid = null; _mcodigo = null;
  }

  function _cancelModal() {
    if (_mpid) _applyToPreview(_mpid, _msaved);
    _closeModal();
  }

  function _saveModal() {
    if (!_mpid || !_mcodigo) return;
    // Persistir no storage próprio (não depende de salvarCartazesLocalStorage)
    saveProductOffset(_mcodigo, _mpend);

    // Forçar generatePosterHTML a usar o novo offset regenerando o preview
    var product = _getProduct(_mpid);
    if (product && typeof generatePosterHTML === 'function') {
      var preview = document.querySelector('.product-preview[data-preview-id="' + _mpid + '"]');
      if (preview) {
        preview.innerHTML = generatePosterHTML(product, true);
        fix(preview, _mpend);
      }
    }
    _updateBadge(_mpid, _mpend);
    if (typeof showToast === 'function') {
      var v = _mpend;
      showToast('success', 'Centavos ajustados',
        (_mcodigo || '') + ' · ' + (v >= 0 ? '+' : '') + v + 'px salvo.');
    }
    _closeModal();
  }

  function _refreshModal() {
    var disp = document.getElementById('df-display');
    if (!disp) return;
    var v = _mpend;
    disp.textContent = (v >= 0 ? '+' : '') + v + 'px';
    disp.className = v > 0 ? 'df-pos' : v < 0 ? 'df-neg' : '';
  }

  function _applyToPreview(pid, off) {
    var p = document.querySelector('.product-preview[data-preview-id="' + pid + '"]');
    if (p) fix(p, off);
  }

  function _updateBadge(pid, off) {
    var btn = document.querySelector('.df-centavos-btn[data-pid="' + pid + '"]');
    if (!btn) return;
    var badge = btn.querySelector('.df-off-badge');
    if (off !== 0) {
      if (!badge) { badge = document.createElement('span'); badge.className = 'df-off-badge'; btn.appendChild(badge); }
      badge.textContent = (off > 0 ? '+' : '') + off + 'px';
    } else if (badge) {
      badge.remove();
    }
  }

  /* ══════════════════════════════════════════════════════════════════════
     BOTÃO POR CARD — organizado com better spacing
  ══════════════════════════════════════════════════════════════════════ */
  function _injectCardButtons(retries) {
    var pending = 0;
    document.querySelectorAll('.product-card').forEach(function(card) {
      if (card.querySelector('.df-centavos-btn')) return;
      var preview = card.querySelector('.product-preview[data-preview-id]');
      if (!preview) return;
      var pid   = preview.getAttribute('data-preview-id');
      var actionsContainer = card.querySelector('.product-actions-buttons');
      if (!actionsContainer) { pending++; return; }

      var product  = _getProduct(pid);
      var savedOff = product ? getProductOffset(product.codigo) : 0;

      var myBtn = document.createElement('button');
      myBtn.type = 'button';
      myBtn.className = 'df-centavos-btn';
      myBtn.dataset.pid = pid;
      myBtn.innerHTML = '<i class="fa-solid fa-subscript"></i><span style="flex:1;text-align:left;">Centavos</span>'
        + (savedOff !== 0 ? '<span class="df-off-badge">' + (savedOff > 0 ? '+' : '') + savedOff + 'px</span>' : '');
      myBtn.addEventListener('click', function(e) { e.stopPropagation(); _openModal(pid); });

      actionsContainer.insertBefore(myBtn, actionsContainer.firstChild);
    });

    if (pending > 0 && retries < 8)
      setTimeout(function() { _injectCardButtons(retries + 1); }, 100);
  }

  /* ══════════════════════════════════════════════════════════════════════
     CONTROLE GLOBAL — painel ⚙ Estilos
  ══════════════════════════════════════════════════════════════════════ */
  function _injectEstilosControl() {
    var panelBody = document.getElementById('estilos-panel-body');
    if (!panelBody || document.getElementById('df-global-section')) return;
    var cur = getOffset();
    var sec = document.createElement('div');
    sec.id = 'df-global-section';
    sec.className = 'estilos-panel-section';
    sec.innerHTML =
      '<div class="estilos-panel-section-title"><i class="fa-solid fa-subscript"></i>&nbsp;Ajuste de centavos</div>'
      + '<p class="estilos-panel-section-desc">Configuração global que afeta todos os cartazes. Use o botão <strong>Centavos</strong> em cada card para ajustes individuais.</p>'
      + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">'
      + '<input type="range" id="df-range" min="-20" max="40" step="1" value="' + cur + '">'
      + '<span id="df-gval">' + (cur >= 0 ? '+' : '') + cur + 'px</span></div>'
      + '<div class="df-gbtns">'
      + '<button id="df-greset" type="button" class="df-gbtn"><i class="fa-solid fa-rotate-left"></i> Resetar</button>'
      + '<button id="df-gapply" type="button" class="df-gbtn"><i class="fa-solid fa-wand-magic-sparkles"></i> Aplicar</button>'
      + '</div>'
      + '<div class="df-g-notice"><i class="fa-solid fa-circle-info"></i> A auto-correção de overlap está sempre ativa. Ajuste apenas se necessário.</div>';
    panelBody.appendChild(sec);

    var range = document.getElementById('df-range');
    var lbl   = document.getElementById('df-gval');
    range.addEventListener('input', function() { var v = parseInt(range.value); lbl.textContent = (v >= 0 ? '+' : '') + v + 'px'; });
    document.getElementById('df-gapply').addEventListener('click', function() {
      var v = parseInt(range.value); saveOffset(v); fixPreviews();
      if (typeof showToast === 'function') showToast('success', 'Centavos ajustados globalmente', (v >= 0 ? '+' : '') + v + 'px aplicado.');
    });
    document.getElementById('df-greset').addEventListener('click', function() {
      range.value = '0'; lbl.textContent = '+0px'; saveOffset(0); fixPreviews();
      if (typeof showToast === 'function') showToast('info', 'Ajuste global resetado', 'Auto-correção padrão restaurada.');
    });
  }

  /* ══════════════════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════════════════ */
  function _init() {
    _injectCSS();

    // ── FIX BUG 1: fallback para renderização inicial ──────────────────
    // script.js chama renderProducts() no DOMContentLoaded antes de qualquer
    // patch estar ativo. editcart.js resolve isso com setTimeout(_addBtns, 300).
    // Rodamos 500ms depois — garante que o .ec-edit-btn já existe — e aplicamos
    // fix nos previews e injetamos os botões Centavos.
    setTimeout(function() {
      fixPreviews();
      _injectCardButtons(0);
    }, 500);

    // ── Patches via polling ────────────────────────────────────────────
    var gDone = false, rDone = false, cDone = false, uiDone = false, n = 0;
    var iv = setInterval(function() {
      if (++n > 60) { clearInterval(iv); return; }
      if (!gDone) gDone = _patchGenerateHTML();
      if (!rDone) rDone = _patchRender();
      if (!cDone) cDone = _patchCanvas();
      if (!uiDone && document.getElementById('estilos-panel-body')) { _injectEstilosControl(); uiDone = true; }
      if (gDone && rDone && cDone && uiDone) clearInterval(iv);
    }, 150);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    // Scripts no fim do <body> correm antes do DOMContentLoaded;
    // o readyState ainda é 'loading' nesse momento, mas por segurança:
    setTimeout(_init, 0);
  }

  /* ── API pública ── */
  window.DecimalFix = { fix: fix, fixPreviews: fixPreviews, getOffset: getOffset, saveOffset: saveOffset };
}());