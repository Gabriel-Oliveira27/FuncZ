'use strict';
// ═══════════════════════════════════════════════════════════════════════════
//  DECIMAL-FIX.JS v1.0 — Correção automática da posição do ,90
//  ─────────────────────────────────────────────────────────────────────────
//  PROBLEMA:
//    O fragmento ",90" (centavos) sobrepõe ou some em números cujos dígitos
//    são estreitos no Impact font — especialmente "1" e "7".
//    Ex: "117,90" → vírgula desaparece. "224,90" → correto.
//
//  CAUSA RAIZ:
//    O CSS usa margin-left fixo (px) por nº de dígitos no decimal.
//    O inteiro tem transform:scaleX(0.7) → borda visual = offsetWidth × 0.7.
//    "117" layout ≈ 323px, visual ≈ 226px. Com margin-left:-100px, o decimal
//    começa em 223px — 3px ANTES da borda visual → OVERLAP.
//    "224" layout ≈ 476px, visual ≈ 333px. Decimal em 376px → gap de 43px.
//
//  SOLUÇÃO (fórmula):
//    W               = intEl.offsetWidth      (layout, não afetado por transforms)
//    intVisualRight  = W × 0.7
//    decLayoutLeft   = W + cssMarginLeft
//    gap             = decLayoutLeft − intVisualRight
//
//    Se gap < GAP_MIN:
//      newMarginLeft = intVisualRight − W + GAP_TARGET
//                    = −W × 0.3 + GAP_TARGET
//
//  INTEGRAÇÃO:
//    Adicionar em cartazes.html, antes de </body>:
//      <script src="../js/decimal-fix.js"></script>
//
//    Nenhuma outra mudança é necessária. O módulo patcha automaticamente
//    renderProducts() e html2canvas() para aplicar a correção.
//
//  CONTROLE DO USUÁRIO:
//    Uma seção "Posição do ,90" é injetada no painel ⚙ Estilos com slider
//    de −20px a +40px para ajuste fino. Valor salvo em localStorage.
// ═══════════════════════════════════════════════════════════════════════════

(function DecimalFix() {

  /* ── Constantes ────────────────────────────────────────────────────────── */
  const SCALE_X    = 0.7;   // CSS transform scaleX do .poster-value-integer
  const GAP_MIN    = 6;     // gap visual mínimo aceitável (px)
  const OFFSET_KEY = 'cartazes-decimal-offset';

  /* ── CSS injetado ─────────────────────────────────────────────────────── */
  function _injectCSS() {
    if (document.getElementById('df-styles')) return;
    const s = document.createElement('style');
    s.id = 'df-styles';
    s.textContent = `
/* ── decimal-fix: controle no painel Estilos ── */
#df-range { accent-color: #2563eb; cursor: pointer; width: 100%; }

#df-val {
  min-width: 44px; text-align: center;
  font-size: 12px; font-weight: 700;
  color: #2563eb; background: #eff6ff;
  border: 1px solid #bfdbfe; border-radius: 6px;
  padding: 2px 7px; transition: all .15s;
  white-space: nowrap; flex-shrink: 0;
}

#df-apply {
  flex: 2; padding: 8px 10px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none; border-radius: 8px;
  font-size: 12px; font-weight: 700; color: #fff;
  cursor: pointer; display: flex; align-items: center;
  justify-content: center; gap: 6px;
  transition: all .18s; font-family: inherit;
}
#df-apply:hover { transform: translateY(-1px); box-shadow: 0 3px 10px rgba(37,99,235,.3); }

#df-reset {
  flex: 1; padding: 8px 10px;
  background: #f3f4f6; border: 1.5px solid #e5e7eb;
  border-radius: 8px; font-size: 12px; font-weight: 600;
  color: #374151; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 5px;
  transition: all .15s; font-family: inherit;
}
#df-reset:hover { background: #e5e7eb; }

.df-notice {
  margin-top: 8px; padding: 7px 10px;
  background: #fffbeb; border-left: 3px solid #f59e0b;
  border-radius: 0 6px 6px 0;
  font-size: 10.5px; color: #92400e; line-height: 1.55;
}

/* Dark mode */
[data-theme="dark"] #df-val {
  background: #1e3a5f; border-color: #3b82f6; color: #93c5fd;
}
[data-theme="dark"] #df-reset {
  background: #273449; border-color: #334155; color: #cbd5e1;
}
[data-theme="dark"] #df-reset:hover { background: #334155; }
[data-theme="dark"] .df-notice {
  background: #1c1a0d; border-left-color: #854d0e; color: #fef08a;
}
`;
    document.head.appendChild(s);
  }

  /* ── Offset do usuário ─────────────────────────────────────────────────── */
  function getOffset() {
    try { return parseFloat(localStorage.getItem(OFFSET_KEY)) || 0; }
    catch { return 0; }
  }
  function saveOffset(px) {
    try { localStorage.setItem(OFFSET_KEY, String(parseFloat(px) || 0)); }
    catch {}
  }

  /* ── Núcleo: corrigir um único .poster-value-container ─────────────────── */
  function _fixContainer(container) {
    var intEl = container.querySelector('.poster-value-integer');
    var decEl = container.querySelector('.poster-value-decimal');
    if (!intEl || !decEl) return;

    // offsetWidth = largura de LAYOUT do inteiro (não afetado por CSS transforms).
    // Funciona em elementos off-screen (left:-99999px) e em previews escaladas.
    var W = intEl.offsetWidth;
    if (!W) return;

    // Borda direita VISUAL do inteiro após scaleX(0.7) com transform-origin:left
    var intVisualRight = W * SCALE_X;

    // Remover qualquer fix inline anterior para ler o valor CSS puro
    decEl.style.marginLeft = '';
    var cssMargin = parseFloat(window.getComputedStyle(decEl).marginLeft) || 0;

    // Posição de layout do decimal no flex container
    var decLayoutLeft = W + cssMargin;

    // Gap visual atual entre inteiro e decimal
    var gap = decLayoutLeft - intVisualRight;

    var userOff = getOffset();
    var target  = GAP_MIN + userOff;

    if (gap < target) {
      // ─ OVERLAP DETECTADO: calcular margin correto ─
      // Queremos: decLayoutLeft = intVisualRight + target
      // W + newMargin = intVisualRight + target
      // newMargin = intVisualRight - W + target = -W*(1-SCALE_X) + target
      var newMargin = intVisualRight - W + target; // ex: -323*0.3 + 6 ≈ -91px para "117"
      decEl.style.marginLeft = newMargin.toFixed(1) + 'px';
    } else if (Math.abs(userOff) > 0.5) {
      // ─ Sem overlap, mas usuário quer ajuste global (slider) ─
      decEl.style.marginLeft = (cssMargin + userOff).toFixed(1) + 'px';
    }
    // Senão: gap já suficiente, manter CSS original
  }

  /* ── Aplicar em todos os .poster-value-container dentro de rootEl ──────── */
  function fix(rootEl) {
    if (!rootEl) return;
    var containers = rootEl.querySelectorAll('.poster-value-container');
    containers.forEach(_fixContainer);
  }

  /* ── Aplicar em todos os preview cards do DOM atual ─────────────────────── */
  function fixPreviews() {
    var previews = document.querySelectorAll('.product-preview');
    previews.forEach(function(p) {
      requestAnimationFrame(function() { fix(p); });
    });
  }

  /* ── Patch: renderProducts ──────────────────────────────────────────────── */
  // Chama fixPreviews após cada re-renderização da lista de produtos.
  function _patchRender() {
    if (typeof window.renderProducts !== 'function') return false;
    if (window.renderProducts._dfPatched) return true;
    var orig = window.renderProducts;
    window.renderProducts = function() {
      orig.apply(this, arguments);
      setTimeout(fixPreviews, 120); // espera o DOM ser pintado
    };
    window.renderProducts._dfPatched = true;
    return true;
  }

  /* ── Patch: html2canvas (geração de PDF) ─────────────────────────────────
   *
   * TIMING CRÍTICO: o script.js faz:
   *   document.body.appendChild(clone);
   *   const canvas = await html2canvas(clone, {...});
   *
   * Ao chamar html2canvas(el, opts), a função lê o DOM sincronamente logo
   * no início (cálculo de estilos, layout). Por isso, aplicamos o fix
   * ANTES de chamar o html2canvas original — garantindo que o PDF capture
   * o estado corrigido.
   * ─────────────────────────────────────────────────────────────────────── */
  function _patchCanvas() {
    if (typeof window.html2canvas !== 'function') return false;
    if (window.html2canvas._dfPatched) return true;
    var orig = window.html2canvas;
    window.html2canvas = function(el, opts) {
      // Aplicar fix sincronamente — antes do html2canvas ler o DOM
      if (el && typeof el.querySelectorAll === 'function') {
        fix(el);
      }
      return orig.call(this, el, opts);
    };
    window.html2canvas._dfPatched = true;
    return true;
  }

  /* ── Injetar controle no painel ⚙ Estilos ───────────────────────────────── */
  function _injectControl() {
    var panelBody = document.getElementById('estilos-panel-body');
    if (!panelBody || document.getElementById('df-section')) return;

    var cur = getOffset();
    var sec = document.createElement('div');
    sec.id = 'df-section';
    sec.className = 'estilos-panel-section';
    sec.innerHTML = [
      '<div class="estilos-panel-section-title">',
        '<i class="fa-solid fa-subscript"></i>&nbsp;Posição do ,90',
      '</div>',
      '<p class="estilos-panel-section-desc">',
        'Auto-correção ativa — sobreposições são eliminadas automaticamente.',
        ' Use o slider para refinamento estético fino.',
      '</p>',
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">',
        '<input type="range" id="df-range" min="-20" max="40" step="1" value="' + cur + '">',
        '<span id="df-val">' + (cur >= 0 ? '+' : '') + cur + 'px</span>',
      '</div>',
      '<div style="display:flex;gap:8px;">',
        '<button id="df-reset" type="button">',
          '<i class="fa-solid fa-rotate-left"></i> Resetar',
        '</button>',
        '<button id="df-apply" type="button">',
          '<i class="fa-solid fa-wand-magic-sparkles"></i> Aplicar prévia',
        '</button>',
      '</div>',
      '<div class="df-notice">',
        '<i class="fa-solid fa-robot" style="margin-right:4px;"></i>',
        '<strong>Negativo</strong>: aproxima o <strong>,90</strong>. ',
        '<strong>Positivo</strong>: afasta. ',
        'Padrão <strong>0px</strong> já corrige sobreposições.',
      '</div>',
    ].join('');
    panelBody.appendChild(sec);

    var range  = document.getElementById('df-range');
    var valLbl = document.getElementById('df-val');
    var resetB = document.getElementById('df-reset');
    var applyB = document.getElementById('df-apply');

    range.addEventListener('input', function() {
      var v = parseInt(range.value);
      valLbl.textContent = (v >= 0 ? '+' : '') + v + 'px';
    });

    applyB.addEventListener('click', function() {
      var v = parseInt(range.value);
      saveOffset(v);
      fixPreviews();
      if (typeof showToast === 'function')
        showToast('success', ',90 ajustado',
          'Offset de ' + (v >= 0 ? '+' : '') + v + 'px salvo e aplicado nos cartazes.');
    });

    resetB.addEventListener('click', function() {
      range.value = '0';
      valLbl.textContent = '+0px';
      saveOffset(0);
      fixPreviews();
      if (typeof showToast === 'function')
        showToast('info', 'Resetado', 'Auto-correção padrão restaurada.');
    });
  }

  /* ── Inicialização com polling ──────────────────────────────────────────── */
  // Usa polling porque os patches dependem de renderProducts e html2canvas,
  // que podem ser carregados após este arquivo.
  function _init() {
    _injectCSS();

    var rDone  = false;   // renderProducts patchado
    var cDone  = false;   // html2canvas patchado
    var uiDone = false;   // controle UI injetado
    var n = 0;
    var MAX = 60; // ~9 segundos

    var iv = setInterval(function() {
      if (++n > MAX) { clearInterval(iv); return; }

      if (!rDone) rDone = _patchRender();
      if (!cDone) cDone = _patchCanvas();

      if (!uiDone && document.getElementById('estilos-panel-body')) {
        _injectControl();
        uiDone = true;
      }

      if (rDone && cDone && uiDone) clearInterval(iv);
    }, 150);
  }

  /* ── Boot ───────────────────────────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    setTimeout(_init, 0);
  }

  /* ── API pública ─────────────────────────────────────────────────────────── */
  window.DecimalFix = {
    /** Corrige a posição do ,90 em todos os .poster-value-container dentro de rootEl */
    fix: fix,
    /** Corrige todos os previews atualmente visíveis na lista de produtos */
    fixPreviews: fixPreviews,
    /** Retorna o offset manual definido pelo usuário (px) */
    getOffset: getOffset,
    /** Define e salva o offset manual (px). Chame fixPreviews() após. */
    saveOffset: saveOffset,
  };

  console.log('✅ decimal-fix.js v1.0 — correção automática do ,90 ativa.');

}());
