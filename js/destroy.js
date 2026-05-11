/* ===== DESTROY.JS - Bloqueio de Serviço =====
   v3 — Impedimento sutil nos inputs + nuvem triste flutuando
   ================================================== */

(function () {
  'use strict';

  const WORKER_URL = 'https://proxy-apps-script.gab-oliveirab27.workers.dev/';

  /* ===== REQUISIÇÃO INVÁLIDA (força erro na API) ===== */
  function dispararRequisicaoInvalida() {
    try {
      fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'login',
          user:   '__destroy_probe__',
          pass:   '!!INVALID_DESTROY_PROBE!!',
          local:  'N/A'
        })
      }).catch(() => {});
    } catch (_) {}
  }

  /* ===== ESTILOS GLOBAIS ===== */
  function injetarEstilosGlobais() {
    if (document.getElementById('_dsyGlobalStyles')) return;
    const s = document.createElement('style');
    s.id = '_dsyGlobalStyles';
    s.textContent = `
      @keyframes _dsyNudge {
        0%, 100% { transform: translateX(0); }
        30%  { transform: translateX(-4px); }
        60%  { transform: translateX(3px); }
        80%  { transform: translateX(-2px); }
      }

      @keyframes _dsyFadeWarn {
        0%   { opacity: 0; transform: translateY(-4px); }
        15%  { opacity: 1; transform: translateY(0); }
        75%  { opacity: 1; }
        100% { opacity: 0; }
      }

      ._dsyNudge {
        animation: _dsyNudge 0.35s ease !important;
      }

      ._dsyInputWarn {
        border-color: #f87171 !important;
        box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15) !important;
        transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
      }

      ._dsyInputWarn::placeholder {
        color: #f87171 !important;
      }

      ._dsyInputReset {
        transition: border-color 0.6s ease, box-shadow 0.6s ease !important;
      }
    `;
    document.head.appendChild(s);
  }

  /* ===== IMPEDIMENTO SUTIL NOS INPUTS ===== */
  function iniciarImpedimentoListener(input) {
    let bloqueadoAte = 0;

    input.addEventListener('input', function () {
      const agora = Date.now();
      if (agora < bloqueadoAte) {
        input.value = '';
        return;
      }

      // A cada 2 chars: apaga, borda vermelha, nudge e bloqueia por 900ms
      if (input.value.length >= 2) {
        bloqueadoAte = agora + 900;

        const valorAtual = input.value;
        input.value = '';

        // Borda de aviso
        input.classList.remove('_dsyInputReset');
        input.classList.add('_dsyInputWarn');

        // Nudge suave no wrapper
        const wrapper = input.closest('.input-wrapper') || input;
        wrapper.classList.add('_dsyNudge');
        setTimeout(() => wrapper.classList.remove('_dsyNudge'), 350);

        // Mostrar toast/dica sutil se existir a função global
        _mostrarDicaSutil(input);

        // Restaura borda após um tempo
        setTimeout(() => {
          input.classList.remove('_dsyInputWarn');
          input.classList.add('_dsyInputReset');
          setTimeout(() => input.classList.remove('_dsyInputReset'), 600);
        }, 1800);
      }
    });

    input.addEventListener('paste', function (e) {
      e.preventDefault();
      const wrapper = input.closest('.input-wrapper') || input;
      input.classList.add('_dsyInputWarn');
      wrapper.classList.add('_dsyNudge');
      setTimeout(() => wrapper.classList.remove('_dsyNudge'), 350);
      setTimeout(() => {
        input.classList.remove('_dsyInputWarn');
        input.classList.add('_dsyInputReset');
        setTimeout(() => input.classList.remove('_dsyInputReset'), 600);
      }, 1800);
    });
  }

  /* ===== DICA SUTIL (tooltip pequeno acima do input) ===== */
  const _dicaMsgs = [
    'Serviço indisponível no momento',
    'Conexões esgotadas',
    'Limite de acessos atingido',
    'Serviço temporariamente suspenso',
  ];
  let _dicaIdx = 0;

  function _mostrarDicaSutil(input) {
    // Remove dica anterior se ainda existir
    const anterior = document.getElementById('_dsyDica');
    if (anterior) anterior.remove();

    const rect = input.getBoundingClientRect();
    const dica = document.createElement('div');
    dica.id = '_dsyDica';

    const msg = _dicaMsgs[_dicaIdx % _dicaMsgs.length];
    _dicaIdx++;

    dica.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top - 10}px;
      transform: translateX(-50%) translateY(-100%);
      background: rgba(15, 23, 42, 0.92);
      color: #94a3b8;
      font-size: 12px;
      font-weight: 500;
      padding: 6px 14px;
      border-radius: 8px;
      border: 1px solid rgba(248,113,113,0.2);
      pointer-events: none;
      z-index: 99998;
      white-space: nowrap;
      animation: _dsyFadeWarn 2s ease forwards;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    `;

    dica.textContent = msg;
    document.body.appendChild(dica);
    setTimeout(() => dica.remove(), 2100);
  }

  /* ===== OVERLAY COM NUVEM TRISTE ===== */
  function injetarOverlay() {
    if (document.getElementById('_destroyOverlay')) return;

    dispararRequisicaoInvalida();

    const overlay = document.createElement('div');
    overlay.id = '_destroyOverlay';
    overlay.innerHTML = `
      <style>
        #_destroyOverlay {
          position: fixed;
          inset: 0;
          background: rgba(3, 8, 20, 0.93);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
          z-index: 999999;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          animation: _dsyOvIn 0.45s ease forwards;
        }

        @keyframes _dsyOvIn  { from { opacity: 0; } to { opacity: 1; } }

        @keyframes _dsyCardIn {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        /* Nuvem flutuando */
        @keyframes _dsyFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }

        /* Gotinhas caindo */
        @keyframes _dsyDrop1 {
          0%   { transform: translateY(0) scaleY(1); opacity: 0.7; }
          80%  { transform: translateY(22px) scaleY(1.15); opacity: 0.3; }
          100% { transform: translateY(26px) scaleY(0.8); opacity: 0; }
        }
        @keyframes _dsyDrop2 {
          0%   { transform: translateY(0) scaleY(1); opacity: 0.5; }
          80%  { transform: translateY(20px) scaleY(1.1); opacity: 0.2; }
          100% { transform: translateY(24px) scaleY(0.8); opacity: 0; }
        }
        @keyframes _dsyDrop3 {
          0%   { transform: translateY(0) scaleY(1); opacity: 0.6; }
          80%  { transform: translateY(18px) scaleY(1.1); opacity: 0.25; }
          100% { transform: translateY(22px) scaleY(0.8); opacity: 0; }
        }

        /* Olhinhos da nuvem piscando */
        @keyframes _dsyEyeBlink {
          0%, 90%, 100% { transform: scaleY(1); }
          95%            { transform: scaleY(0.08); }
        }

        #_destroyCard {
          background: linear-gradient(175deg, #0d1b2e 0%, #080f1c 100%);
          border: 1px solid rgba(148, 163, 184, 0.07);
          border-radius: 28px;
          padding: 52px 44px 44px;
          max-width: 400px;
          width: 100%;
          text-align: center;
          box-shadow:
            0 48px 100px rgba(0, 0, 0, 0.75),
            0 0 0 1px rgba(255, 255, 255, 0.03),
            inset 0 1px 0 rgba(255, 255, 255, 0.04);
          animation: _dsyCardIn 0.5s ease 0.05s both;
        }

        /* ---- Nuvem SVG wrapper ---- */
        #_dsyCloudWrap {
          width: 120px;
          height: 100px;
          margin: 0 auto 32px;
          position: relative;
          animation: _dsyFloat 4s ease-in-out infinite;
        }

        #_dsyCloudWrap svg {
          width: 100%;
          height: 100%;
          overflow: visible;
        }

        /* Gotinhas */
        .dsy-drop {
          transform-origin: center top;
        }
        .dsy-drop:nth-child(1) { animation: _dsyDrop1 2.2s ease-in infinite 0.1s; }
        .dsy-drop:nth-child(2) { animation: _dsyDrop2 2.2s ease-in infinite 0.55s; }
        .dsy-drop:nth-child(3) { animation: _dsyDrop3 2.2s ease-in infinite 1s; }

        /* Olhinhos */
        .dsy-eye {
          transform-origin: center center;
          animation: _dsyEyeBlink 3.5s ease-in-out infinite;
        }
        .dsy-eye:nth-child(2) { animation-delay: 0.1s; }

        /* ---- Textos ---- */
        #_dsyCode {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #334155;
          text-transform: uppercase;
          margin-bottom: 12px;
        }

        #_dsyTitle {
          font-size: 20px;
          font-weight: 700;
          color: #e2e8f0;
          line-height: 1.4;
          margin-bottom: 12px;
        }

        #_dsyDesc {
          font-size: 13.5px;
          color: #475569;
          line-height: 1.8;
          margin-bottom: 32px;
        }

        #_dsySep {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.05);
          margin: 0 0 24px;
        }

        #_dsyContact {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
        }

        #_dsyContact svg {
          width: 15px;
          height: 15px;
          flex-shrink: 0;
          color: #1e293b;
        }

        #_dsyFooter {
          margin-top: 28px;
          font-size: 10.5px;
          color: rgba(30, 41, 59, 0.6);
          letter-spacing: 0.4px;
        }
      </style>

      <div id="_destroyCard">

        <!-- Nuvem triste com gotinhas -->
        <div id="_dsyCloudWrap">
          <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg">

            <!-- Corpo da nuvem -->
            <g>
              <!-- Sombra suave -->
              <ellipse cx="60" cy="56" rx="46" ry="10" fill="rgba(0,0,0,0.18)" />

              <!-- Nuvem principal -->
              <path
                d="M24 52 C18 52 12 46 12 39 C12 32 18 26 25 26 C25 18 32 12 40 12 C45 12 50 14.5 53 19 C55 16 58.5 14 62.5 14 C70 14 76 20 76 27.5 C76 28 76 28.5 75.9 29 C79 29.5 82 32 82 36 C82 40 78.5 43 74.5 43 L74 43 C73 48 68.5 52 63 52 Z"
                fill="#1e2d42"
                stroke="#2d3f57"
                stroke-width="1.2"
              />

              <!-- Destaque superior da nuvem -->
              <path
                d="M36 28 C36 23 40 19 45 19 C48 19 50.5 20.5 52 23"
                stroke="#3a5068"
                stroke-width="1.8"
                stroke-linecap="round"
                fill="none"
                opacity="0.5"
              />
            </g>

            <!-- Olhos tristes -->
            <g>
              <!-- Olho esquerdo -->
              <ellipse class="dsy-eye" cx="43" cy="36" rx="3.5" ry="4" fill="#60a5fa" opacity="0.7" />
              <ellipse cx="43" cy="36" rx="1.8" ry="2" fill="#1e3a5f" />
              <!-- Brilhinho -->
              <circle cx="44.2" cy="34.8" r="0.9" fill="white" opacity="0.5" />

              <!-- Olho direito -->
              <ellipse class="dsy-eye" cx="62" cy="36" rx="3.5" ry="4" fill="#60a5fa" opacity="0.7" />
              <ellipse cx="62" cy="36" rx="1.8" ry="2" fill="#1e3a5f" />
              <!-- Brilhinho -->
              <circle cx="63.2" cy="34.8" r="0.9" fill="white" opacity="0.5" />
            </g>

            <!-- Boca triste -->
            <path
              d="M47 44 Q52.5 40.5 58 44"
              stroke="#3a5068"
              stroke-width="1.8"
              stroke-linecap="round"
              fill="none"
            />

            <!-- Sobrancelhas tristes (inclinadas p/ cima no centro) -->
            <path d="M39 29.5 Q43 27 47 29" stroke="#3a5068" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>
            <path d="M58 29 Q62 27 66 29.5" stroke="#3a5068" stroke-width="1.5" stroke-linecap="round" fill="none" opacity="0.7"/>

            <!-- Gotinhas -->
            <ellipse class="dsy-drop" cx="42" cy="60" rx="2" ry="3.5" fill="#3b82f6" opacity="0.55" />
            <ellipse class="dsy-drop" cx="55" cy="65" rx="1.8" ry="3" fill="#3b82f6" opacity="0.4" />
            <ellipse class="dsy-drop" cx="67" cy="60" rx="2" ry="3.5" fill="#3b82f6" opacity="0.5" />

          </svg>
        </div>

        <div id="_dsyCode">503 · Limite excedido</div>

        <div id="_dsyTitle">Sistema temporariamente<br>indisponível</div>

        <div id="_dsyDesc">
          Os acessos gratuitos excederam o<br>
          limite permitido para este período.
        </div>

        <hr id="_dsySep">

        <div id="_dsyContact">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          Contate o desenvolvedor para mais informações
        </div>

        <div id="_dsyFooter">FuncZ &nbsp;·&nbsp; Acesso suspenso pelo sistema</div>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  /* ===== BLOQUEIA ENVIO ===== */
  function bloquearFormulario() {
    const form = document.getElementById('loginForm');
    const btn  = document.getElementById('loginBtn');

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        injetarOverlay();
      }, true);
    }

    if (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopImmediatePropagation();
        injetarOverlay();
      }, true);
    }
  }

  /* ===== INIT ===== */
  function init() {
    injetarEstilosGlobais();
    bloquearFormulario();

    const inputUser = document.getElementById('loginUser');
    const inputPass = document.getElementById('loginPass');
    if (inputUser) iniciarImpedimentoListener(inputUser);
    if (inputPass) iniciarImpedimentoListener(inputPass);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
