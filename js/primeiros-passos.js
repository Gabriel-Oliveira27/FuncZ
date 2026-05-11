'use strict';
// ════════════════════════════════════════════════════════════════════════
//  PRIMEIROS-PASSOS.JS v2 — Tour guiado UX-friendly
//  • Tooltip compacta, nunca sai da viewport
//  • Scroll bloqueado durante a tour
//  • Botões de nav sempre visíveis
//  • Spotlight suave com transição
// ════════════════════════════════════════════════════════════════════════

(function PrimeirosPassos() {

  // ════════════════════════════════════════════════════════════════════
  // 1. CSS
  // ════════════════════════════════════════════════════════════════════
  function _css() {
    if (document.getElementById('pp-styles')) return;
    const s = document.createElement('style');
    s.id = 'pp-styles';
    s.textContent = `

/* ── Backdrop escuro com recorte (spotlight via clip-path no pseudo) ── */
#pp-backdrop {
  display: none;
  position: fixed; inset: 0; z-index: 10490;
  pointer-events: none;
}
#pp-backdrop.active { display: block; }

/* ── Overlay de sombra ao redor do spotlight ── */
#pp-shadow-top, #pp-shadow-bottom, #pp-shadow-left, #pp-shadow-right {
  position: fixed; z-index: 10491;
  background: rgba(0,0,0,.68);
  transition: all .38s cubic-bezier(.16,1,.3,1);
  pointer-events: all; /* bloqueia cliques fora */
}

/* ── Borda iluminada do spotlight ── */
#pp-spotlight-ring {
  position: fixed; z-index: 10492;
  border-radius: 10px;
  border: 2.5px solid #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.22), 0 0 24px rgba(59,130,246,.35);
  transition: all .38s cubic-bezier(.16,1,.3,1);
  pointer-events: none;
  opacity: 0;
}
#pp-spotlight-ring.visible { opacity: 1; }

/* ── Tooltip fixa — compacta e sempre dentro da viewport ── */
#pp-tooltip {
  position: fixed;
  z-index: 10500;
  width: 320px;
  max-width: calc(100vw - 32px);
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 8px 40px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.1);
  border: 1px solid rgba(59,130,246,.18);
  overflow: hidden;
  transition: opacity .28s ease, transform .28s ease;
  opacity: 0; pointer-events: none;
  /* Garante que nunca sai da tela */
  max-height: calc(100vh - 32px);
  display: flex; flex-direction: column;
}
#pp-tooltip.visible {
  opacity: 1; pointer-events: all;
}
[data-theme="dark"] #pp-tooltip {
  background: #1e293b;
  border-color: rgba(59,130,246,.28);
}

/* Header da tooltip */
.pp-hdr {
  background: linear-gradient(135deg,#2563eb,#1d4ed8);
  padding: 12px 14px 10px;
  display: flex; align-items: flex-start; gap: 8px;
  flex-shrink: 0;
}
.pp-hdr-badge {
  background: rgba(255,255,255,.2); border: 1px solid rgba(255,255,255,.25);
  border-radius: 20px; padding: 2px 9px;
  font-size: 10px; font-weight: 700; color: #fff; white-space: nowrap;
  flex-shrink: 0; margin-top: 1px;
}
.pp-hdr-title {
  font-size: 13px; font-weight: 700; color: #fff;
  flex: 1; line-height: 1.3;
}
.pp-hdr-close {
  background: rgba(255,255,255,.15); border: none; border-radius: 5px;
  width: 22px; height: 22px; display: flex; align-items: center; justify-content: center;
  color: #fff; cursor: pointer; font-size: 13px; line-height: 1;
  transition: background .15s; flex-shrink: 0;
}
.pp-hdr-close:hover { background: rgba(255,255,255,.3); }

/* Progress */
.pp-progress { height: 3px; background: rgba(255,255,255,.2); flex-shrink: 0; }
.pp-progress-fill { height: 100%; background: rgba(255,255,255,.85); border-radius: 0 2px 2px 0; transition: width .35s ease; }

/* Body — scrollável se necessário, mas conteúdo mantido curto */
.pp-body {
  padding: 14px; overflow-y: auto; flex: 1;
  scrollbar-width: thin;
}
.pp-desc {
  font-size: 12.5px; color: #374151; line-height: 1.6;
}
[data-theme="dark"] .pp-desc { color: #cbd5e1; }

/* Hint */
.pp-hint {
  margin-top: 10px; padding: 9px 12px;
  border-radius: 8px; font-size: 11.5px; line-height: 1.5;
  border-left: 3px solid;
  animation: ppHintIn .22s ease;
}
@keyframes ppHintIn { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
.pp-hint.info    { background:#eff6ff; border-color:#3b82f6; color:#1e40af; }
.pp-hint.success { background:#f0fdf4; border-color:#10b981; color:#065f46; }
.pp-hint.warning { background:#fffbeb; border-color:#f59e0b; color:#78350f; }
[data-theme="dark"] .pp-hint.info    { background:#1e3a5f; color:#bfdbfe; }
[data-theme="dark"] .pp-hint.success { background:#0d2b1e; color:#86efac; }
[data-theme="dark"] .pp-hint.warning { background:#1c1a0d; color:#fef08a; }

/* Footer — SEMPRE visível, não vai além da tela */
.pp-footer {
  padding: 10px 14px;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid #f1f5f9; gap: 8px;
  background: #fff; flex-shrink: 0;
}
[data-theme="dark"] .pp-footer { border-top-color: #334155; background: #1e293b; }

.pp-btn-skip {
  background: none; border: none; font-size: 11px; color: #9ca3af;
  cursor: pointer; padding: 3px 6px; border-radius: 5px; transition: color .15s; white-space: nowrap;
}
.pp-btn-skip:hover { color: #6b7280; }

.pp-nav { display: flex; gap: 6px; }

.pp-btn-back {
  padding: 7px 12px; background: #fff;
  border: 1.5px solid #e5e7eb; border-radius: 7px;
  font-size: 12px; font-weight: 600; color: #374151;
  cursor: pointer; transition: all .15s; white-space: nowrap;
  display: flex; align-items: center; gap: 4px;
}
.pp-btn-back:hover { border-color: #d1d5db; background: #f9fafb; }
[data-theme="dark"] .pp-btn-back { background:#273449; border-color:#334155; color:#cbd5e1; }

.pp-btn-next {
  padding: 7px 14px;
  background: linear-gradient(135deg,#2563eb,#1d4ed8);
  border: none; border-radius: 7px;
  font-size: 12px; font-weight: 700; color: #fff;
  cursor: pointer; transition: all .18s; white-space: nowrap;
  box-shadow: 0 2px 8px rgba(37,99,235,.25);
  display: flex; align-items: center; gap: 5px;
}
.pp-btn-next:hover { transform: translateY(-1px); box-shadow: 0 4px 14px rgba(37,99,235,.35); }
.pp-btn-next.finish {
  background: linear-gradient(135deg,#10b981,#059669);
  box-shadow: 0 2px 8px rgba(16,185,129,.25);
}
.pp-btn-next.finish:hover { box-shadow: 0 4px 14px rgba(16,185,129,.35); }

/* Dot na sidebar */
#btn-primeiros-passos .pp-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: #10b981; margin-left: auto; flex-shrink: 0;
  animation: ppDotPulse 2s ease-in-out infinite;
}
@keyframes ppDotPulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(.7)} }

/* Highlight no alvo */
.pp-target-glow { outline: 3px solid rgba(59,130,246,.7) !important; outline-offset: 4px !important; }
`;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════════════
  // 2. DOM
  // ════════════════════════════════════════════════════════════════════
  let _backdrop, _shadowT, _shadowB, _shadowL, _shadowR, _ring, _tooltip;
  let _prevTarget = null;

  function _buildDOM() {
    if (document.getElementById('pp-backdrop')) return;

    _backdrop = _el('div', 'pp-backdrop'); document.body.appendChild(_backdrop);
    _shadowT  = _el('div', 'pp-shadow-top');    document.body.appendChild(_shadowT);
    _shadowB  = _el('div', 'pp-shadow-bottom'); document.body.appendChild(_shadowB);
    _shadowL  = _el('div', 'pp-shadow-left');   document.body.appendChild(_shadowL);
    _shadowR  = _el('div', 'pp-shadow-right');  document.body.appendChild(_shadowR);
    _ring     = _el('div', 'pp-spotlight-ring'); document.body.appendChild(_ring);

    _tooltip = _el('div', 'pp-tooltip');
    _tooltip.setAttribute('role', 'dialog');
    _tooltip.setAttribute('aria-label', 'Guia primeiros passos');
    document.body.appendChild(_tooltip);
  }

  function _el(tag, id) {
    const e = document.createElement(tag);
    e.id = id;
    return e;
  }

  // ════════════════════════════════════════════════════════════════════
  // 3. ESTADO
  // ════════════════════════════════════════════════════════════════════
  let _step    = 0;
  let _running = false;
  const TOTAL  = 6;
  const PAD    = 10; // padding do spotlight

  // ════════════════════════════════════════════════════════════════════
  // 4. SPOTLIGHT — 4 painéis de sombra + anel
  // ════════════════════════════════════════════════════════════════════
  function _spotlight(rect) {
    const vw = window.innerWidth, vh = window.innerHeight;
    const { left: x, top: y, width: w, height: h } = rect;
    const lx = Math.max(0, x - PAD), ty = Math.max(0, y - PAD);
    const rx = Math.min(vw, x + w + PAD), by = Math.min(vh, y + h + PAD);

    Object.assign(_shadowT.style, { left:'0', top:'0', width:'100%', height:`${ty}px` });
    Object.assign(_shadowB.style, { left:'0', top:`${by}px`, width:'100%', height:`${vh - by}px` });
    Object.assign(_shadowL.style, { left:'0', top:`${ty}px`, width:`${lx}px`, height:`${by - ty}px` });
    Object.assign(_shadowR.style, { left:`${rx}px`, top:`${ty}px`, width:`${vw - rx}px`, height:`${by - ty}px` });

    Object.assign(_ring.style, {
      left: `${lx}px`, top: `${ty}px`,
      width: `${rx - lx}px`, height: `${by - ty}px`,
    });
    _ring.classList.add('visible');
    _backdrop.classList.add('active');
  }

  function _clearSpotlight() {
    _ring.classList.remove('visible');
    _backdrop.classList.remove('active');
    // Limpa sombras
    ['top','bottom','left','right'].forEach(k => {
      const el = document.getElementById(`pp-shadow-${k}`);
      if (el) el.style.cssText = '';
    });
  }

  // ════════════════════════════════════════════════════════════════════
  // 5. POSIÇÃO DA TOOLTIP — sempre dentro da viewport
  // ════════════════════════════════════════════════════════════════════
  const TT_W   = 320;
  const TT_H   = 260; // estimativa máxima
  const MARGIN = 14;

  function _placeTooltip(spotRect, prefer) {
    const vw = window.innerWidth, vh = window.innerHeight;

    let tx, ty;

    // Tenta a posição preferida e verifica se cabe
    const fits = {
      right:  spotRect.right  + TT_W + MARGIN < vw,
      left:   spotRect.left   - TT_W - MARGIN > 0,
      bottom: spotRect.bottom + TT_H + MARGIN < vh,
      top:    spotRect.top    - TT_H - MARGIN > 0,
    };

    const order = [prefer, 'right', 'left', 'bottom', 'top'].filter(Boolean);
    let chosen = order.find(d => fits[d]) || 'bottom';

    switch (chosen) {
      case 'right':
        tx = spotRect.right + MARGIN;
        ty = spotRect.top + spotRect.height / 2 - TT_H / 2;
        break;
      case 'left':
        tx = spotRect.left - TT_W - MARGIN;
        ty = spotRect.top + spotRect.height / 2 - TT_H / 2;
        break;
      case 'bottom':
        tx = spotRect.left + spotRect.width / 2 - TT_W / 2;
        ty = spotRect.bottom + MARGIN;
        break;
      case 'top':
      default:
        tx = spotRect.left + spotRect.width / 2 - TT_W / 2;
        ty = spotRect.top - TT_H - MARGIN;
        break;
    }

    // Clamp dentro da viewport com margens
    tx = Math.max(MARGIN, Math.min(vw - TT_W - MARGIN, tx));
    ty = Math.max(MARGIN, Math.min(vh - TT_H - MARGIN, ty));

    Object.assign(_tooltip.style, {
      left:  `${tx}px`,
      top:   `${ty}px`,
      width: `${TT_W}px`,
    });
    _tooltip.classList.add('visible');
  }

  // ════════════════════════════════════════════════════════════════════
  // 6. APONTAR PARA UM ELEMENTO
  // ════════════════════════════════════════════════════════════════════
  function _focus(el, prefer) {
    if (!el) return;

    if (_prevTarget) _prevTarget.classList.remove('pp-target-glow');
    el.classList.add('pp-target-glow');
    _prevTarget = el;

    // Scroll suave para o elemento (sem mover o wrapper principal)
    const rect = el.getBoundingClientRect();
    const vh   = window.innerHeight;
    if (rect.bottom > vh - 80 || rect.top < 80) {
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }

    setTimeout(() => {
      const r = el.getBoundingClientRect();
      _spotlight(r);
      _placeTooltip(r, prefer || 'right');
    }, rect.bottom > vh - 80 || rect.top < 80 ? 350 : 60);
  }

  function _focusGroup(els, prefer) {
    // Spotlight sobre um grupo de elementos (bounding box combinada)
    if (!els.length) return;
    if (_prevTarget) _prevTarget.classList.remove('pp-target-glow');
    _prevTarget = null;

    els.forEach(e => e.classList.add('pp-target-glow'));

    setTimeout(() => {
      const rects = els.map(e => e.getBoundingClientRect());
      const combined = {
        left:   Math.min(...rects.map(r => r.left)),
        top:    Math.min(...rects.map(r => r.top)),
        right:  Math.max(...rects.map(r => r.right)),
        bottom: Math.max(...rects.map(r => r.bottom)),
      };
      combined.width  = combined.right  - combined.left;
      combined.height = combined.bottom - combined.top;

      const vh = window.innerHeight;
      if (combined.bottom > vh - 80 || combined.top < 80) {
        els[0].scrollIntoView({ block: 'center', behavior: 'smooth' });
        setTimeout(() => {
          const r2 = els.map(e => e.getBoundingClientRect());
          const c2 = { left:Math.min(...r2.map(r=>r.left)), top:Math.min(...r2.map(r=>r.top)), right:Math.max(...r2.map(r=>r.right)), bottom:Math.max(...r2.map(r=>r.bottom)) };
          c2.width=c2.right-c2.left; c2.height=c2.bottom-c2.top;
          _spotlight(c2); _placeTooltip(c2, prefer||'right');
        }, 350);
      } else {
        _spotlight(combined); _placeTooltip(combined, prefer||'right');
      }
    }, 60);

    // limpar glow do grupo ao sair
    _prevTarget = { classList: { remove: () => els.forEach(e => e.classList.remove('pp-target-glow')) } };
  }

  // ════════════════════════════════════════════════════════════════════
  // 7. RENDER DA TOOLTIP
  // ════════════════════════════════════════════════════════════════════
  function _render(title, desc, { hint, hintType } = {}) {
    const pct    = Math.round((_step / TOTAL) * 100);
    const isLast = _step === TOTAL - 1;

    _tooltip.innerHTML = `
      <div class="pp-hdr">
        <span class="pp-hdr-badge">${_step + 1} / ${TOTAL}</span>
        <span class="pp-hdr-title">${title}</span>
        <button class="pp-hdr-close" onclick="window._PP.stop()" title="Fechar guia">×</button>
      </div>
      <div class="pp-progress">
        <div class="pp-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="pp-body">
        <div class="pp-desc">${desc}</div>
        ${hint ? `<div class="pp-hint ${hintType||'info'}" id="pp-hint">${hint}</div>` : '<div id="pp-hint" style="display:none"></div>'}
      </div>
      <div class="pp-footer">
        <button class="pp-btn-skip" onclick="window._PP.stop()">Sair</button>
        <div class="pp-nav">
          ${_step > 0 ? `<button class="pp-btn-back" onclick="window._PP.prev()"><i class="fa-solid fa-arrow-left"></i> Voltar</button>` : ''}
          <button class="pp-btn-next ${isLast?'finish':''}" onclick="window._PP.next()">
            ${isLast ? '<i class="fa-solid fa-check"></i> Concluir' : 'Próximo <i class="fa-solid fa-arrow-right"></i>'}
          </button>
        </div>
      </div>`;
  }

  function _updateHint(html, type) {
    const el = document.getElementById('pp-hint');
    if (!el) return;
    el.className = `pp-hint ${type||'info'}`;
    el.innerHTML = html; el.style.display = '';
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  }

  // ════════════════════════════════════════════════════════════════════
  // 8. BLOQUEAR SCROLL — só o main-content, não a sidebar
  // ════════════════════════════════════════════════════════════════════
  let _scrollTargets = [];

  function _lockScroll() {
    // Bloqueia scroll no container principal, mas deixa sidebar scrollável para a tour
    _scrollTargets = [
      document.querySelector('.main-content'),
      document.querySelector('body'),
    ].filter(Boolean);
    _scrollTargets.forEach(el => {
      el._ppOverflow = el.style.overflow;
      el.style.overflow = 'hidden';
    });
  }

  function _unlockScroll() {
    _scrollTargets.forEach(el => {
      el.style.overflow = el._ppOverflow || '';
      delete el._ppOverflow;
    });
    _scrollTargets = [];
  }

  // ════════════════════════════════════════════════════════════════════
  // 9. ETAPAS
  // ════════════════════════════════════════════════════════════════════
  function _step0() {
    document.querySelector('[data-view="gerar"]')?.click();
    setTimeout(() => {
      const el = document.getElementById('codigo');
      _render(
        '<i class="fa-solid fa-barcode"></i> Código do produto',
        `Digite o código do produto que deseja criar o cartaz.<br>
         Ex: <strong>2047</strong>, <strong>110056</strong>, <strong>22005</strong><br><br>
         Pressione <kbd>Enter</kbd> ou clique na <strong>🔍 lupa</strong> para buscar.`,
        { hint: '<i class="fa-solid fa-lightbulb"></i> Deixe em branco e clique na lupa para ver todos os produtos.', hintType: 'info' }
      );
      if (el) {
        _focus(el, 'right');
        el.focus();
        const h = () => {
          const v = (el.value || '').trim();
          _updateHint(v.length >= 3
            ? `<i class="fa-solid fa-check" style="color:#10b981"></i> Código <strong>${v}</strong> digitado — pressione Enter ou clique na lupa!`
            : '<i class="fa-solid fa-lightbulb"></i> Deixe em branco para ver todos os produtos disponíveis.', v.length >= 3 ? 'success' : 'info');
        };
        el.addEventListener('input', h); el._ppH = h;
      }
    }, 300);
  }

  function _step1() {
    const d = document.getElementById('descricao');
    const s = document.getElementById('subdescricao');
    _render(
      '<i class="fa-solid fa-tag"></i> Descrição e sub descrição',
      `O sistema preenche automaticamente ao buscar.<br>
       <strong>Descrição:</strong> nome principal (máx. 38 car.)<br>
       <strong>Sub descrição:</strong> marca ou complemento<br><br>
       Você pode editar livremente.`,
      { hint: '<i class="fa-solid fa-pencil"></i> Se não encontrou o produto, preencha manualmente antes de continuar.', hintType: 'warning' }
    );
    if (d && s) {
      _focusGroup([d, s], 'right');
      d.focus();
    }
  }

  function _step2() {
    const m = document.getElementById('metodo');
    _render(
      '<i class="fa-solid fa-credit-card"></i> Parcelamento e valores',
      `Escolha o <strong>parcelamento</strong> — os campos se adaptam.<br><br>
       Para <strong>1x / 3x / 5x / 10x</strong> surgem botões extras:`,
      { hint: '<i class="fa-solid fa-hand-pointer"></i> Selecione um parcelamento para ver as opções disponíveis.', hintType: 'info' }
    );
    if (m) {
      _focus(m, 'right');
      const h = () => {
        const v = m.value;
        if (!v) return;
        if (v === '12x') {
          _updateHint('<i class="fa-solid fa-circle-info" style="color:#3b82f6"></i> <strong>12x com juros</strong> — escolha a taxa (Carnê ou Cartão) e a parcela é calculada automaticamente.', 'info');
        } else {
          _updateHint(`<i class="fa-solid fa-sliders" style="color:#f59e0b"></i> <strong>${v} — opções especiais:</strong><br>
            • <strong>Aplicar taxa</strong>: usa fator de juros<br>
            • <strong>Sem juros!</strong>: exibe texto no cartaz<br>
            • <strong>Campanha</strong>: adiciona texto promocional`, 'warning');
        }
      };
      m.addEventListener('change', h); m._ppH2 = h;
    }
  }

  function _step3() {
    const sw = document.getElementById('switch-modelo');
    _render(
      '<i class="fa-solid fa-store"></i> Modelo do cartaz',
      `<strong>Padrão</strong> — layout completo em A4, para a maioria das lojas.<br><br>
       <strong>Cameba</strong> — layout com preço e tabela deslocados para baixo, específico para esse modelo de papel.<br><br>
       ⚠️ Não é possível misturar modelos no mesmo PDF.`,
      { hint: '<i class="fa-solid fa-info-circle"></i> Só mude para Cameba se for imprimir nesse modelo específico.', hintType: 'warning' }
    );
    if (sw) _focus(sw.closest('.checkbox-wrapper-35') || sw, 'right');
  }

  function _step4() {
    const btn = document.getElementById('btn-estilos-gear');
    _render(
      '<i class="fa-solid fa-palette"></i> Configurações de estilo',
      `O botão <strong>⚙ Estilos</strong> abre um painel com opções visuais:<br><br>
       • <strong>CAIXA ALTA</strong> ou <strong>Primeira Letra</strong><br>
       • <strong>Negrito</strong> na sub descrição<br>
       • <strong>Validade centralizada</strong>`,
      { hint: '<i class="fa-solid fa-hand-pointer"></i> Clique no botão destacado para explorar o painel de estilos.', hintType: 'info' }
    );
    if (btn) _focus(btn, 'right');
  }

  function _step5() {
    document.querySelector('[data-view="produtos"]')?.click();
    setTimeout(() => {
      const hdr = document.querySelector('.products-header') || document.getElementById('view-produtos');
      _render(
        '<i class="fa-solid fa-images"></i> Prévia e geração do PDF',
        `Os cartazes aparecem com <strong>miniaturas</strong> para revisão.<br><br>
         Cada cartaz tem:<br>
         • Mover validade · Negrito na sub desc.<br>
         • Layout personalizado (A5, A6…)<br>
         • Editar cartaz após adicionar<br><br>
         Clique em <strong>"Gerar PDF"</strong> quando estiver pronto.`,
        { hint: '<i class="fa-solid fa-star" style="color:#f59e0b"></i> Pronto! Volte à aba <strong>Gerar Cartaz</strong> e crie seu primeiro cartaz.', hintType: 'success' }
      );
      if (hdr) _focus(hdr, 'bottom');
    }, 400);
  }

  // ════════════════════════════════════════════════════════════════════
  // 10. MAPA + NAVEGAÇÃO
  // ════════════════════════════════════════════════════════════════════
  const STEPS = [_step0, _step1, _step2, _step3, _step4, _step5];

  function _cleanHandlers() {
    const c = document.getElementById('codigo');
    if (c?._ppH) { c.removeEventListener('input', c._ppH); c._ppH = null; }
    const m = document.getElementById('metodo');
    if (m?._ppH2) { m.removeEventListener('change', m._ppH2); m._ppH2 = null; }
    if (_prevTarget) { _prevTarget.classList.remove('pp-target-glow'); _prevTarget = null; }
  }

  function _goto(n) {
    if (n < 0 || n >= STEPS.length) return;
    _cleanHandlers();
    _tooltip.classList.remove('visible');
    _step = n;
    setTimeout(() => STEPS[n]?.(), 60);
  }

  // ════════════════════════════════════════════════════════════════════
  // 11. API PÚBLICA
  // ════════════════════════════════════════════════════════════════════
  function start() {
    if (_running) return;
    _running = true;
    _lockScroll();
    _goto(0);
  }

  function stop() {
    _running = false;
    _cleanHandlers();
    _unlockScroll();
    _clearSpotlight();
    _tooltip.classList.remove('visible');
    if (typeof showToast === 'function')
      showToast('info', 'Guia encerrado', 'Clique em "Primeiros passos" para iniciar novamente.', 3000);
  }

  function next() {
    if (_step < STEPS.length - 1) _goto(_step + 1);
    else { stop(); if (typeof showToast==='function') showToast('success','Guia concluído!','Agora você já sabe criar seus cartazes.',3500); }
  }

  function prev() { if (_step > 0) _goto(_step - 1); }

  window._PP = { start, stop, next, prev };

  // ════════════════════════════════════════════════════════════════════
  // 12. BOTÃO NA SIDEBAR
  // ════════════════════════════════════════════════════════════════════
  function _injectButton() {
    const old = document.getElementById('btn-campos-obrigatorios');
    if (!old) return;
    const btn = document.createElement('button');
    btn.id = 'btn-primeiros-passos';
    btn.className = 'nav-item';
    btn.setAttribute('aria-label', 'Iniciar guia de primeiros passos');
    btn.innerHTML = `
      <i class="fa-solid fa-graduation-cap"></i>
      <span>Primeiros passos</span>
      <span class="pp-dot" title="Guia disponível"></span>`;
    btn.addEventListener('click', () => {
      document.querySelector('[data-view="gerar"]')?.click();
      setTimeout(start, 200);
    });
    old.replaceWith(btn);
  }

  // ════════════════════════════════════════════════════════════════════
  // 13. BOOT
  // ════════════════════════════════════════════════════════════════════
  function _boot() {
    _css();
    _buildDOM();
    _injectButton();

    // ESC para fechar
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && _running) stop();
    });

    // Reposicionar ao redimensionar
    window.addEventListener('resize', () => {
      if (_running && _prevTarget?.getBoundingClientRect) {
        const r = _prevTarget.getBoundingClientRect();
        _spotlight(r); _placeTooltip(r, 'right');
      }
    });

  
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _boot);
  else _boot();

}());