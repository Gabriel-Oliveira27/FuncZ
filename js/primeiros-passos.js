'use strict';
// ════════════════════════════════════════════════════════════════════════
//  PRIMEIROS-PASSOS.JS — Tour guiado "Primeiros Passos"
//  Substitui o botão "Campos obrigatórios" por "Primeiros passos".
//  6 etapas interativas ensinam o usuário a criar o primeiro cartaz.
//  Adicione <script src="../js/primeiros-passos.js"></script> no HTML.
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

/* ── Spotlight ring — o hero da tour ── */
#pp-spotlight {
  position: fixed;
  border-radius: 12px;
  /* a enorme box-shadow escurece tudo fora do ring */
  box-shadow: 0 0 0 9999px rgba(0,0,0,.72), 0 0 0 3px #3b82f6, 0 0 24px rgba(59,130,246,.4);
  z-index: 10500;
  pointer-events: none;
  transition: all .45s cubic-bezier(.16,1,.3,1);
  opacity: 0;
}
#pp-spotlight.visible { opacity: 1; }

/* ── Tooltip ── */
#pp-tooltip {
  position: fixed;
  z-index: 10501;
  width: 340px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,.25);
  border: 1px solid rgba(59,130,246,.15);
  overflow: hidden;
  transition: opacity .3s ease, transform .3s ease;
  opacity: 0; pointer-events: none;
}
#pp-tooltip.visible { opacity: 1; pointer-events: all; }

[data-theme="dark"] #pp-tooltip {
  background: #1e293b;
  border-color: rgba(59,130,246,.25);
  box-shadow: 0 20px 60px rgba(0,0,0,.5);
}

/* Header da tooltip */
.pp-tt-header {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  padding: 14px 18px 12px;
  display: flex; align-items: center; justify-content: space-between;
  gap: 10px;
}
.pp-tt-step-badge {
  background: rgba(255,255,255,.2);
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 20px;
  padding: 2px 10px;
  font-size: 11px; font-weight: 700;
  color: white; white-space: nowrap;
}
.pp-tt-title {
  font-size: 14px; font-weight: 700; color: white;
  flex: 1; line-height: 1.3;
}
.pp-tt-close {
  background: rgba(255,255,255,.15);
  border: none; border-radius: 6px;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  color: white; cursor: pointer; font-size: 14px;
  transition: background .15s; flex-shrink: 0;
}
.pp-tt-close:hover { background: rgba(255,255,255,.3); }

/* Progressbar */
.pp-progress-bar {
  height: 3px; background: rgba(255,255,255,.2);
  position: relative;
}
.pp-progress-fill {
  height: 100%; background: rgba(255,255,255,.85);
  border-radius: 0 2px 2px 0;
  transition: width .4s ease;
}

/* Corpo */
.pp-tt-body { padding: 18px; }
.pp-tt-desc {
  font-size: 13.5px; color: #374151; line-height: 1.6;
  margin-bottom: 0;
}
[data-theme="dark"] .pp-tt-desc { color: #cbd5e1; }

/* Sub-hints (conteúdo dinâmico da etapa 3) */
.pp-hint-box {
  margin-top: 12px;
  padding: 11px 14px;
  border-radius: 10px;
  font-size: 12.5px; line-height: 1.5; color: #374151;
  border-left: 3px solid;
  transition: all .25s ease;
  animation: ppHintIn .25s ease;
}
@keyframes ppHintIn {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.pp-hint-box.info    { background: #eff6ff; border-color: #3b82f6; }
.pp-hint-box.success { background: #f0fdf4; border-color: #10b981; }
.pp-hint-box.warning { background: #fffbeb; border-color: #f59e0b; }
[data-theme="dark"] .pp-hint-box.info    { background: #1e3a5f; color: #bfdbfe; }
[data-theme="dark"] .pp-hint-box.success { background: #0d2b1e; color: #86efac; }
[data-theme="dark"] .pp-hint-box.warning { background: #1c1a0d; color: #fef08a; }

.pp-hint-box strong { font-weight: 700; }
.pp-hint-box i { margin-right: 5px; }

/* Footer: nav */
.pp-tt-footer {
  padding: 12px 18px;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid #f3f4f6; gap: 8px;
}
[data-theme="dark"] .pp-tt-footer { border-top-color: #334155; }

.pp-btn-skip {
  background: none; border: none;
  font-size: 12px; color: #9ca3af;
  cursor: pointer; padding: 4px 8px; border-radius: 6px;
  transition: color .15s;
}
.pp-btn-skip:hover { color: #6b7280; }

.pp-nav-btns { display: flex; gap: 8px; }

.pp-btn-back {
  padding: 8px 14px;
  background: white; border: 1.5px solid #e5e7eb;
  border-radius: 8px; font-size: 13px; font-weight: 600;
  color: #374151; cursor: pointer; transition: all .15s;
  display: flex; align-items: center; gap: 5px;
}
.pp-btn-back:hover { border-color: #d1d5db; background: #f9fafb; }
[data-theme="dark"] .pp-btn-back { background: #273449; border-color: #334155; color: #cbd5e1; }

.pp-btn-next {
  padding: 8px 18px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  border: none; border-radius: 8px;
  font-size: 13px; font-weight: 700; color: white;
  cursor: pointer; transition: all .18s;
  box-shadow: 0 3px 10px rgba(37,99,235,.25);
  display: flex; align-items: center; gap: 6px;
}
.pp-btn-next:hover { transform: translateY(-1px); box-shadow: 0 5px 16px rgba(37,99,235,.35); }
.pp-btn-next.finish {
  background: linear-gradient(135deg, #10b981, #059669);
  box-shadow: 0 3px 10px rgba(16,185,129,.25);
}
.pp-btn-next.finish:hover { box-shadow: 0 5px 16px rgba(16,185,129,.35); }

/* Seta da tooltip */
#pp-arrow {
  position: fixed; z-index: 10502;
  width: 14px; height: 14px;
  background: white; border-radius: 2px;
  transform: rotate(45deg);
  transition: all .45s cubic-bezier(.16,1,.3,1);
  box-shadow: -2px -2px 4px rgba(0,0,0,.07);
  pointer-events: none; opacity: 0;
}
#pp-arrow.visible { opacity: 1; }
[data-theme="dark"] #pp-arrow { background: #1e293b; }

/* Highlight pulsante aplicado ao elemento alvo */
.pp-target-highlight {
  position: relative; z-index: 10499 !important;
  animation: ppTargetGlow 2s ease-in-out infinite;
}
@keyframes ppTargetGlow {
  0%,100% { outline: 3px solid transparent; outline-offset: 3px; }
  50%     { outline: 3px solid rgba(59,130,246,.6); outline-offset: 5px; }
}

/* Indicador de etapa no botão da sidebar */
#btn-primeiros-passos .pp-dot {
  width: 8px; height: 8px; border-radius: 50%;
  background: #10b981; margin-left: auto;
  animation: ppDotPulse 2s ease-in-out infinite;
}
@keyframes ppDotPulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50%     { opacity: .5; transform: scale(.7); }
}
`;
    document.head.appendChild(s);
  }

  // ════════════════════════════════════════════════════════════════════
  // 2. DOM
  // ════════════════════════════════════════════════════════════════════
  let _spotlight, _tooltip, _arrow;

  function _buildDOM() {
    if (document.getElementById('pp-spotlight')) return;

    _spotlight = document.createElement('div');
    _spotlight.id = 'pp-spotlight';
    document.body.appendChild(_spotlight);

    _arrow = document.createElement('div');
    _arrow.id = 'pp-arrow';
    document.body.appendChild(_arrow);

    _tooltip = document.createElement('div');
    _tooltip.id = 'pp-tooltip';
    _tooltip.setAttribute('role', 'dialog');
    _tooltip.setAttribute('aria-modal', 'false');
    document.body.appendChild(_tooltip);
  }

  // ════════════════════════════════════════════════════════════════════
  // 3. ESTADO
  // ════════════════════════════════════════════════════════════════════
  let _step    = 0;
  let _running = false;
  let _prevTarget = null;

  const TOTAL_STEPS = 6;

  // ════════════════════════════════════════════════════════════════════
  // 4. POSICIONAMENTO DO SPOTLIGHT + TOOLTIP
  // ════════════════════════════════════════════════════════════════════
  function _spotTarget(el, opts = {}) {
    if (!el) return;
    // Scroll para o elemento ficar visível
    el.scrollIntoView({ block: 'center', behavior: 'smooth' });

    // Remove highlight do alvo anterior
    if (_prevTarget && _prevTarget !== el) {
      _prevTarget.classList.remove('pp-target-highlight');
    }
    el.classList.add('pp-target-highlight');
    _prevTarget = el;

    const PAD = opts.pad ?? 10;

    // Atraso pequeno para o scroll assentar
    setTimeout(() => {
      const r = el.getBoundingClientRect();
      _spotlight.style.left   = `${r.left - PAD}px`;
      _spotlight.style.top    = `${r.top  - PAD}px`;
      _spotlight.style.width  = `${r.width  + PAD * 2}px`;
      _spotlight.style.height = `${r.height + PAD * 2}px`;
      _spotlight.classList.add('visible');
      _positionTooltip(r, opts);
    }, 120);
  }

  function _spotRect(rect, opts = {}) {
    // spotlight sobre uma área arbitrária (não um elemento)
    if (_prevTarget) { _prevTarget.classList.remove('pp-target-highlight'); _prevTarget = null; }
    const PAD = opts.pad ?? 10;
    _spotlight.style.left   = `${rect.left - PAD}px`;
    _spotlight.style.top    = `${rect.top  - PAD}px`;
    _spotlight.style.width  = `${rect.width  + PAD * 2}px`;
    _spotlight.style.height = `${rect.height + PAD * 2}px`;
    _spotlight.classList.add('visible');
    _positionTooltip(rect, opts);
  }

  function _positionTooltip(targetRect, opts = {}) {
    const TT_W = 340, TT_H = 300; // max estimado
    const vw = window.innerWidth, vh = window.innerHeight;
    const prefer = opts.prefer || 'right'; // right | left | bottom | top

    let tx, ty, arrowX, arrowY;
    const MARGIN = 18;

    if (prefer === 'right' && targetRect.right + TT_W + MARGIN < vw) {
      tx = targetRect.right + MARGIN;
      ty = Math.max(MARGIN, Math.min(vh - TT_H - MARGIN, targetRect.top + targetRect.height / 2 - TT_H / 2));
      arrowX = tx - 8; arrowY = ty + TT_H / 2 - 7;
    } else if (prefer === 'left' && targetRect.left - TT_W - MARGIN > 0) {
      tx = targetRect.left - TT_W - MARGIN;
      ty = Math.max(MARGIN, Math.min(vh - TT_H - MARGIN, targetRect.top + targetRect.height / 2 - TT_H / 2));
      arrowX = tx + TT_W - 6; arrowY = ty + TT_H / 2 - 7;
    } else if (prefer === 'bottom' || targetRect.bottom + TT_H + MARGIN < vh) {
      tx = Math.max(MARGIN, Math.min(vw - TT_W - MARGIN, targetRect.left + targetRect.width / 2 - TT_W / 2));
      ty = targetRect.bottom + MARGIN;
      arrowX = tx + TT_W / 2 - 7; arrowY = ty - 8;
    } else {
      // topo
      tx = Math.max(MARGIN, Math.min(vw - TT_W - MARGIN, targetRect.left + targetRect.width / 2 - TT_W / 2));
      ty = targetRect.top - TT_H - MARGIN;
      if (ty < MARGIN) ty = MARGIN;
      arrowX = tx + TT_W / 2 - 7; arrowY = ty + TT_H - 6;
    }

    _tooltip.style.left = `${tx}px`;
    _tooltip.style.top  = `${ty}px`;
    _tooltip.style.width = `${TT_W}px`;
    _arrow.style.left = `${arrowX}px`;
    _arrow.style.top  = `${arrowY}px`;

    _tooltip.classList.add('visible');
    _arrow.classList.add('visible');
  }

  function _hideSpot() {
    _spotlight.classList.remove('visible');
    _arrow.classList.remove('visible');
    _tooltip.classList.remove('visible');
    if (_prevTarget) { _prevTarget.classList.remove('pp-target-highlight'); _prevTarget = null; }
  }

  // ════════════════════════════════════════════════════════════════════
  // 5. RENDER DA TOOLTIP
  // ════════════════════════════════════════════════════════════════════
  function _render(title, desc, opts = {}) {
    const pct = Math.round((_step / TOTAL_STEPS) * 100);
    const isLast = _step === TOTAL_STEPS - 1;

    _tooltip.innerHTML = `
      <div class="pp-tt-header">
        <span class="pp-tt-step-badge">Etapa ${_step + 1} / ${TOTAL_STEPS}</span>
        <span class="pp-tt-title">${title}</span>
        <button class="pp-tt-close" onclick="window._PP.stop()" title="Sair do guia">×</button>
      </div>
      <div class="pp-progress-bar">
        <div class="pp-progress-fill" style="width:${pct}%"></div>
      </div>
      <div class="pp-tt-body">
        <div class="pp-tt-desc">${desc}</div>
        ${opts.hint ? `<div class="pp-hint-box ${opts.hintType || 'info'}" id="pp-hint">${opts.hint}</div>` : '<div id="pp-hint" style="display:none"></div>'}
      </div>
      <div class="pp-tt-footer">
        <button class="pp-btn-skip" onclick="window._PP.stop()">Sair do guia</button>
        <div class="pp-nav-btns">
          ${_step > 0 ? `<button class="pp-btn-back" onclick="window._PP.prev()"><i class="fa-solid fa-arrow-left"></i> Voltar</button>` : ''}
          <button class="pp-btn-next ${isLast ? 'finish' : ''}" onclick="window._PP.next()">
            ${isLast ? '<i class="fa-solid fa-check"></i> Concluir' : 'Próxima etapa <i class="fa-solid fa-arrow-right"></i>'}
          </button>
        </div>
      </div>`;
  }

  function _updateHint(html, type) {
    const el = document.getElementById('pp-hint');
    if (!el) return;
    el.className = `pp-hint-box ${type || 'info'}`;
    el.innerHTML = html;
    el.style.display = '';
    el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
  }

  // ════════════════════════════════════════════════════════════════════
  // 6. DEFINIÇÃO DAS ETAPAS
  // ════════════════════════════════════════════════════════════════════

  // ── Etapa 0: Código ──────────────────────────────────────────────────
  function _step0() {
    // Garante que a aba "gerar" está ativa
    const navGerar = document.querySelector('[data-view="gerar"]');
    navGerar?.click();

    setTimeout(() => {
      const el = document.getElementById('codigo');
      if (el) el.focus();

      _render(
        '<i class="fa-solid fa-barcode"></i> Código do produto',
        `Digite o código do produto que deseja criar o cartaz.<br><br>
         <strong>Exemplos:</strong> <code>2047</code>, <code>110056</code>, <code>22005</code><br><br>
         Ao digitar, pressione <kbd>Enter</kbd> ou clique na <strong>🔍 lupa</strong> para buscar automaticamente na base de dados.`,
        { hint: '<i class="fa-solid fa-lightbulb"></i> Deixe o campo <strong>em branco</strong> e clique na lupa para ver <strong>todos os produtos</strong> disponíveis.', hintType: 'info' }
      );

      _spotTarget(el, { pad: 8, prefer: 'right' });

      // Monitorar digitação no código para dar feedback em tempo real
      const handler = () => {
        const v = (el.value || '').trim();
        if (v.length >= 3) {
          _updateHint(`<i class="fa-solid fa-check" style="color:#10b981"></i> Código <strong>${v}</strong> digitado — agora pressione <kbd>Enter</kbd> ou clique na lupa para buscar!`, 'success');
        } else {
          _updateHint('<i class="fa-solid fa-lightbulb"></i> Deixe em branco e clique na lupa para ver todos os produtos disponíveis.', 'info');
        }
      };
      el.addEventListener('input', handler);
      el._ppHandler = handler;
    }, 350);
  }

  // ── Etapa 1: Descrição e Sub descrição ──────────────────────────────
  function _step1() {
    const descEl = document.getElementById('descricao');
    const subEl  = document.getElementById('subdescricao');

    _render(
      '<i class="fa-solid fa-tag"></i> Descrição e sub descrição',
      `O sistema preenche automaticamente ao buscar o produto. Verifique:<br><br>
       <strong>Descrição:</strong> nome principal do produto (ex: <em>TV TOSHIBA 75POL.</em>)<br>
       <strong>Sub descrição:</strong> marca ou complemento (ex: <em>Philco, Samsung…</em>)<br><br>
       Você pode editar livremente. <strong>Máximo 38 caracteres</strong> na descrição.`,
      { hint: '<i class="fa-solid fa-pencil"></i> Se a busca não encontrou o produto, preencha manualmente os dois campos antes de continuar.', hintType: 'warning' }
    );

    // Spotlight cobrindo os dois campos
    if (descEl && subEl) {
      descEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
      setTimeout(() => {
        const r1 = descEl.getBoundingClientRect();
        const r2 = subEl.getBoundingClientRect();
        const combined = {
          left:   Math.min(r1.left, r2.left),
          top:    r1.top,
          right:  Math.max(r1.right, r2.right),
          bottom: r2.bottom,
          width:  Math.max(r1.right, r2.right) - Math.min(r1.left, r2.left),
          height: r2.bottom - r1.top,
        };
        _spotRect(combined, { prefer: 'right' });
        descEl.focus();
      }, 200);
    }
  }

  // ── Etapa 2: Parcelamento + campos condicionais ──────────────────────
  function _step2() {
    const metodoEl = document.getElementById('metodo');

    _render(
      '<i class="fa-solid fa-credit-card"></i> Parcelamento e valores',
      `Escolha o <strong>parcelamento</strong> e veja os campos se adaptarem.<br><br>
       O <strong>valor à vista</strong> é obrigatório. A <strong>parcela</strong> é calculada automaticamente para 12x.<br><br>
       Para parcelamentos <strong>1x / 3x / 5x / 10x</strong>, botões extras aparecem — explore-os:`,
      { hint: '<i class="fa-solid fa-hand-pointer"></i> Selecione um parcelamento no campo abaixo para ver as opções disponíveis.', hintType: 'info' }
    );

    _spotTarget(metodoEl, { pad: 8, prefer: 'right' });

    // Monitorar mudança no metodo para explicar cada opção
    const handler = () => {
      const m = metodoEl.value;
      if (!m) return;

      const metodosTaxaOpc = ['1x','3x','5x','10x'];
      if (m === '12x') {
        _updateHint(`<i class="fa-solid fa-circle-info" style="color:#3b82f6"></i>
          <strong>12x com juros</strong> — escolha a taxa (Carnê ou Cartão) e a parcela é calculada automaticamente com o fator de multiplicação.`, 'info');
      } else if (metodosTaxaOpc.includes(m)) {
        _updateHint(`<i class="fa-solid fa-sliders" style="color:#f59e0b"></i>
          <strong>${m} — parcelamento especial!</strong><br>
          <ul style="margin:6px 0 0 14px;padding:0;font-size:12px;line-height:1.6;">
            <li><strong>Aplicar taxa</strong>: usa o fator de juros na parcela</li>
            <li><strong>Sem juros!</strong>: exibe "Sem juros!" no cartaz (sem taxa)</li>
            <li><strong>Campanha</strong>: adiciona texto de promoção (ex: BLACK FRIDAY)</li>
          </ul>`, 'warning');

        // Expand spotlight para cobrir os campos extras que aparecem
        setTimeout(() => {
          const campos = ['checkbox-taxa-1x','checkbox-sem-juros','checkbox-campanha']
            .map(id => document.getElementById(id))
            .filter(Boolean);
          if (campos.length) {
            const metodoRect = metodoEl.getBoundingClientRect();
            const last = campos[campos.length - 1].getBoundingClientRect();
            _spotRect({ left: metodoRect.left, top: metodoRect.top, right: metodoRect.right, bottom: last.bottom,
              width: metodoRect.right - metodoRect.left, height: last.bottom - metodoRect.top }, { prefer: 'right' });
          }
        }, 400);
      }
    };
    metodoEl.addEventListener('change', handler);
    metodoEl._ppHandler2 = handler;
  }

  // ── Etapa 3: Modelo ──────────────────────────────────────────────────
  function _step3() {
    const switchEl = document.getElementById('switch-modelo');

    _render(
      '<i class="fa-solid fa-store"></i> Modelo do cartaz',
      `O <strong>Modelo</strong> define o layout geral do cartaz.<br><br>
       <strong>Padrão</strong> — cartaz completo em folha A4, para a maioria das lojas.<br><br>
       <strong>Cameba</strong> — layout modificado onde o preço e a tabela ficam deslocados para baixo, adequado para o modelo físico da loja Cameba.<br><br>
       ⚠️ Não é possível misturar modelos no mesmo PDF.`,
      { hint: '<i class="fa-solid fa-info-circle"></i> Apenas mude para <strong>Cameba</strong> se você for imprimir especificamente nesse modelo de papel/impressora.', hintType: 'warning' }
    );

    if (switchEl) _spotTarget(switchEl.closest('.checkbox-wrapper-35') || switchEl, { pad: 12, prefer: 'right' });
  }

  // ── Etapa 4: Estilos ─────────────────────────────────────────────────
  function _step4() {
    const btnEstilos = document.getElementById('btn-estilos-gear');

    _render(
      '<i class="fa-solid fa-palette"></i> Configurações de estilo',
      `O botão <strong>⚙ Estilos</strong> abre um painel lateral com opções visuais:<br><br>
       <strong>CAIXA ALTA</strong> — todo o texto em maiúsculas (padrão)<br>
       <strong>Primeira Letra</strong> — capitaliza cada palavra<br><br>
       <strong>Negrito na sub descrição</strong> — deixa a marca em destaque no cartaz<br>
       <strong>Validade centralizada</strong> — move a data de validade para o centro inferior`,
      { hint: '<i class="fa-solid fa-hand-pointer"></i> Clique no botão destacado para abrir o painel de estilos e explorar as opções!', hintType: 'info' }
    );

    if (btnEstilos) _spotTarget(btnEstilos, { pad: 10, prefer: 'right' });
  }

  // ── Etapa 5: Previews e gerar PDF ────────────────────────────────────
  function _step5() {
    // Navega para a aba de produtos para mostrar o preview
    const navProdutos = document.querySelector('[data-view="produtos"]');
    navProdutos?.click();

    setTimeout(() => {
      const header = document.querySelector('.products-header') || document.getElementById('view-produtos');

      _render(
        '<i class="fa-solid fa-images"></i> Prévia e geração do PDF',
        `Após adicionar os cartazes, eles aparecem nesta tela com uma <strong>miniatura (prévia)</strong>.<br><br>
         Cada cartaz tem opções extras:<br>
         <ul style="margin:8px 0 0 16px;padding:0;font-size:13px;line-height:1.7;">
           <li><strong>Mover validade</strong> — centraliza a data no cartaz</li>
           <li><strong>Sub descrição em negrito</strong></li>
           <li><strong>Layout personalizado</strong> — A5 (loja 53), A6 (Juazeiro II)…</li>
           <li><strong>Editar cartaz</strong> — ajusta qualquer campo depois de adicionar</li>
         </ul>
         Quando estiver pronto, clique em <strong>"Gerar PDF de todos os cartazes"</strong>.`,
        { hint: '<i class="fa-solid fa-star" style="color:#f59e0b"></i> Você está pronto! Volte à aba <strong>Gerar Cartaz</strong> e crie seu primeiro cartaz.', hintType: 'success' }
      );

      if (header) {
        _spotTarget(header, { pad: 12, prefer: 'bottom' });
      }
    }, 400);
  }

  // ════════════════════════════════════════════════════════════════════
  // 7. MAPA DE ETAPAS
  // ════════════════════════════════════════════════════════════════════
  const STEPS = [_step0, _step1, _step2, _step3, _step4, _step5];

  function _goto(n) {
    if (n < 0 || n >= STEPS.length) return;
    // Limpar handlers da etapa anterior
    _cleanHandlers();
    _step = n;
    STEPS[n]?.();
  }

  function _cleanHandlers() {
    const cod = document.getElementById('codigo');
    if (cod?._ppHandler) { cod.removeEventListener('input', cod._ppHandler); cod._ppHandler = null; }
    const met = document.getElementById('metodo');
    if (met?._ppHandler2) { met.removeEventListener('change', met?._ppHandler2); met._ppHandler2 = null; }
  }

  // ════════════════════════════════════════════════════════════════════
  // 8. API PÚBLICA
  // ════════════════════════════════════════════════════════════════════
  function start() {
    if (_running) return;
    _running = true;
    _goto(0);
  }

  function stop() {
    _running = false;
    _cleanHandlers();
    _hideSpot();
    // Garante tooltip e spotlight sumidos
    _tooltip.classList.remove('visible');
    _arrow.classList.remove('visible');
    _spotlight.classList.remove('visible');
    if (_prevTarget) { _prevTarget.classList.remove('pp-target-highlight'); _prevTarget = null; }
    if (typeof showToast === 'function')
      showToast('info', 'Guia encerrado', 'Você pode iniciar novamente clicando em "Primeiros passos" na barra lateral.', 3000);
  }

  function next() {
    if (_step < STEPS.length - 1) { _goto(_step + 1); }
    else { stop(); }
  }

  function prev() {
    if (_step > 0) _goto(_step - 1);
  }

  window._PP = { start, stop, next, prev };

  // ════════════════════════════════════════════════════════════════════
  // 9. BOTÃO NA SIDEBAR — substitui btn-campos-obrigatorios
  // ════════════════════════════════════════════════════════════════════
  function _injectButton() {
    const oldBtn = document.getElementById('btn-campos-obrigatorios');
    if (!oldBtn) return;

    const btn = document.createElement('button');
    btn.id        = 'btn-primeiros-passos';
    btn.className = 'nav-item';
    btn.setAttribute('aria-label', 'Iniciar guia de primeiros passos');
    btn.innerHTML = `
      <i class="fa-solid fa-graduation-cap"></i>
      <span>Primeiros passos</span>
      <span class="pp-dot" title="Guia disponível"></span>`;

    btn.addEventListener('click', () => {
      // Navega para a aba gerar antes de iniciar
      const navGerar = document.querySelector('[data-view="gerar"]');
      navGerar?.click();
      setTimeout(start, 200);
    });

    oldBtn.replaceWith(btn);
  }

  // ════════════════════════════════════════════════════════════════════
  // 10. BOOT
  // ════════════════════════════════════════════════════════════════════
  function _boot() {
    _css();
    _buildDOM();
    _injectButton();

    // Fechar com Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && _running) stop();
    });

    // Reposicionar spotlight ao redimensionar
    window.addEventListener('resize', () => {
      if (_running && _prevTarget) {
        _spotTarget(_prevTarget, { pad: 10 });
      }
    });

    console.log('✅ primeiros-passos.js carregado — tour guiado de 6 etapas ativo.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _boot);
  } else {
    _boot();
  }

}());
