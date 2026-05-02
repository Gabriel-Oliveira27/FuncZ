/**
 * motivos.js — Seleção Rápida de Motivos de Devolução
 * ─────────────────────────────────────────────────────
 * Autocontido: injeta estilos + DOM automaticamente.
 * Para usar: <script src="../js/motivos.js"></script>
 *
 * ✏️  COMO EDITAR OS MOTIVOS:
 *   Altere apenas o array MOTIVOS abaixo.
 *   • texto  → texto que será inserido no campo
 *   • comum  → true exibe o badge "Frequente" (só um por vez, idealmente)
 *   • icone  → emoji opcional exibido ao lado do texto
 */

(function () {
    'use strict';

    /* ══════════════════════════════════════════════════════════════
       ✏️  EDITE AQUI — lista de motivos de devolução
    ══════════════════════════════════════════════════════════════ */
    var MOTIVOS = [
        {
            texto: 'Produto com defeito de fabricação.',
            comum: true,
            icone: '⚠️'
        },
        {
            texto: 'Erro no pedido.',
            comum: false,
            icone: '📋'
        },
        {
            texto: 'Troca de necessidade.',
            comum: false,
            icone: '🔄'
        },
        {
            texto: 'Produto não atendia às necessidades do cliente.',
            comum: false,
            icone: '❌'
        },
        {
            texto: 'Desistência da compra.',
            comum: false,
            icone: '🚫'
        },
        {
            texto: 'Troca de modelo — preferência por outro modelo.',
            comum: false,
            icone: '🔁'
        },
        {
            texto: 'Produto diferente do anunciado / descrito.',
            comum: false,
            icone: '🏷️'
        },
        {
            texto: 'Produto chegou avariado ou com embalagem danificada.',
            comum: false,
            icone: '📦'
        },
        {
            texto: 'Compra realizada em duplicidade.',
            comum: false,
            icone: '2️⃣'
        }
    ];
    /* ══════════════════════════════════════════════════════════════ */


    /* ── Estado ──────────────────────────────────────────────── */
    var painelAberto   = false;
    var btnGatilho     = null;
    var painelEl       = null;
    var backdropEl     = null;
    var textoSelecionado = null;

    /* ── CSS injetado (usa variáveis do projeto) ─────────────── */
    var CSS = [
        /* Botão gatilho */
        '.mtr-btn{',
            'display:inline-flex;align-items:center;gap:.4rem;',
            'padding:.3rem .75rem;',
            'background:transparent;',
            'border:1.5px solid rgba(26,79,214,.25);',
            'border-radius:20px;',
            'cursor:pointer;',
            'font-size:.72rem;font-weight:700;font-family:inherit;',
            'color:var(--blue,#1a4fd6);',
            'letter-spacing:.02em;white-space:nowrap;',
            'transition:background .2s,border-color .2s,transform .18s,box-shadow .2s;',
            'line-height:1;',
            'flex-shrink:0;',
        '}',
        '.mtr-btn:hover{',
            'background:rgba(26,79,214,.09);',
            'border-color:rgba(26,79,214,.45);',
            'transform:translateY(-1px);',
            'box-shadow:0 3px 10px rgba(26,79,214,.15);',
        '}',
        '.mtr-btn:active{transform:translateY(0);}',
        '.mtr-btn svg{width:13px;height:13px;flex-shrink:0;}',
        '.dark .mtr-btn{color:#6b96ff;border-color:rgba(107,150,255,.3);}',
        '.dark .mtr-btn:hover{background:rgba(107,150,255,.1);border-color:rgba(107,150,255,.5);}',

        /* Wrapper do bloco-label para suportar o botão */
        '.mtr-bloco-label{',
            'display:flex;align-items:center;justify-content:space-between;',
            'flex-wrap:wrap;gap:.5rem;margin-bottom:1.3rem;',
        '}',
        '.mtr-bloco-label-left{display:flex;align-items:center;gap:.55rem;}',

        /* Backdrop */
        '.mtr-backdrop{',
            'position:fixed;inset:0;z-index:2999;',
            'background:transparent;',
            'cursor:default;',
        '}',

        /* Painel flutuante */
        '.mtr-painel{',
            'position:fixed;z-index:3000;',
            'width:440px;max-width:calc(100vw - 24px);',
            'background:var(--card,#fff);',
            'border:1.5px solid var(--border,rgba(0,0,0,.07));',
            'border-radius:18px;',
            'box-shadow:0 8px 32px rgba(0,0,0,.12),0 20px 48px rgba(0,0,0,.07),0 2px 8px rgba(0,0,0,.06);',
            'overflow:hidden;',
            'transform-origin:top right;',
            'animation:mtrIn .22s cubic-bezier(.34,1.56,.64,1) both;',
        '}',
        '.dark .mtr-painel{',
            'box-shadow:0 8px 36px rgba(0,0,0,.5),0 20px 52px rgba(0,0,0,.3);',
            'border-color:rgba(255,255,255,.1);',
        '}',
        '@keyframes mtrIn{from{opacity:0;transform:scale(.88) translateY(-10px)}to{opacity:1;transform:scale(1) translateY(0)}}',
        '@keyframes mtrOut{from{opacity:1;transform:scale(1)}to{opacity:0;transform:scale(.9) translateY(-8px)}}',
        '.mtr-painel.fechando{animation:mtrOut .18s cubic-bezier(.4,0,.2,1) forwards;}',

        /* Header do painel */
        '.mtr-header{',
            'display:flex;align-items:center;justify-content:space-between;',
            'padding:.95rem 1.2rem .8rem;',
            'border-bottom:1.5px solid var(--border,rgba(0,0,0,.07));',
            'background:linear-gradient(to right,rgba(26,79,214,.04),transparent);',
        '}',
        '.dark .mtr-header{background:linear-gradient(to right,rgba(59,110,245,.07),transparent);}',
        '.mtr-header-left{display:flex;align-items:center;gap:.55rem;}',
        '.mtr-header-icon{',
            'width:30px;height:30px;border-radius:8px;',
            'background:linear-gradient(135deg,rgba(26,79,214,.12),rgba(26,79,214,.06));',
            'display:flex;align-items:center;justify-content:center;',
            'color:var(--blue,#1a4fd6);flex-shrink:0;',
        '}',
        '.dark .mtr-header-icon{background:linear-gradient(135deg,rgba(59,110,245,.18),rgba(59,110,245,.08));color:#6b96ff;}',
        '.mtr-header-icon svg{width:15px;height:15px;}',
        '.mtr-header-title{font-size:.86rem;font-weight:700;color:var(--fg,#0c1322);letter-spacing:-.01em;}',
        '.mtr-header-sub{font-size:.7rem;color:var(--fg-m,#6a7895);margin-top:.08rem;}',
        '.mtr-close{',
            'width:28px;height:28px;border-radius:7px;',
            'background:transparent;border:none;cursor:pointer;',
            'display:flex;align-items:center;justify-content:center;',
            'color:var(--fg-m,#6a7895);',
            'transition:background .18s,color .18s,transform .18s;',
            'flex-shrink:0;',
        '}',
        '.mtr-close:hover{background:rgba(192,57,43,.1);color:#e74c3c;transform:scale(1.1);}',
        '.mtr-close svg{width:14px;height:14px;}',

        /* Lista de motivos */
        '.mtr-lista{padding:.75rem;display:flex;flex-direction:column;gap:.4rem;max-height:360px;overflow-y:auto;}',
        '.mtr-lista::-webkit-scrollbar{width:5px;}',
        '.mtr-lista::-webkit-scrollbar-track{background:transparent;}',
        '.mtr-lista::-webkit-scrollbar-thumb{background:var(--border,rgba(0,0,0,.1));border-radius:10px;}',

        /* Item de motivo */
        '.mtr-item{',
            'display:flex;align-items:flex-start;gap:.65rem;',
            'padding:.65rem .85rem;',
            'border:1.5px solid var(--border,rgba(0,0,0,.07));',
            'border-radius:10px;',
            'cursor:pointer;',
            'background:var(--prod-bg,#f8f9fd);',
            'transition:all .18s cubic-bezier(.4,0,.2,1);',
            'position:relative;overflow:hidden;',
        '}',
        '.mtr-item::before{',
            'content:"";position:absolute;left:0;top:0;bottom:0;width:3px;',
            'background:var(--blue,#1a4fd6);border-radius:0 2px 2px 0;',
            'opacity:0;transform:scaleY(.4);transition:opacity .18s,transform .22s;',
        '}',
        '.mtr-item:hover{',
            'border-color:rgba(26,79,214,.3);',
            'background:rgba(26,79,214,.04);',
            'transform:translateX(2px);',
        '}',
        '.mtr-item:hover::before{opacity:1;transform:scaleY(1);}',
        '.mtr-item:active{transform:translateX(4px) scale(.99);}',
        '.dark .mtr-item{background:var(--prod-bg,#0f1a2c);border-color:var(--prod-border,#1c2d48);}',
        '.dark .mtr-item:hover{border-color:rgba(107,150,255,.35);background:rgba(107,150,255,.06);}',

        /* Item comum/frequente */
        '.mtr-item.mtr-comum{',
            'border-color:rgba(16,185,129,.25);',
            'background:linear-gradient(135deg,rgba(16,185,129,.05),rgba(16,185,129,.02));',
        '}',
        '.mtr-item.mtr-comum::before{background:var(--green,#10b981);}',
        '.mtr-item.mtr-comum:hover{',
            'border-color:rgba(16,185,129,.4);',
            'background:rgba(16,185,129,.07);',
        '}',
        '.dark .mtr-item.mtr-comum{',
            'border-color:rgba(16,185,129,.2);',
            'background:linear-gradient(135deg,rgba(16,185,129,.08),rgba(16,185,129,.03));',
        '}',

        /* Ícone do item */
        '.mtr-item-ico{font-size:1.1rem;line-height:1;flex-shrink:0;margin-top:.05rem;user-select:none;}',

        /* Corpo do item */
        '.mtr-item-body{flex:1;min-width:0;}',
        '.mtr-item-texto{',
            'font-size:.82rem;font-weight:500;',
            'color:var(--fg,#0c1322);line-height:1.45;',
        '}',
        '.mtr-item-badge{',
            'display:inline-flex;align-items:center;gap:.25rem;',
            'font-size:.62rem;font-weight:700;letter-spacing:.05em;text-transform:uppercase;',
            'color:var(--green,#10b981);',
            'background:rgba(16,185,129,.1);',
            'border:1px solid rgba(16,185,129,.2);',
            'padding:.1rem .45rem;border-radius:20px;',
            'margin-top:.3rem;',
        '}',
        '.mtr-item-badge svg{width:9px;height:9px;}',

        /* Checkmark de seleção */
        '.mtr-item-check{',
            'width:20px;height:20px;border-radius:50%;',
            'background:var(--green,#10b981);',
            'display:flex;align-items:center;justify-content:center;',
            'flex-shrink:0;align-self:center;',
            'opacity:0;transform:scale(0);',
            'transition:opacity .2s,transform .25s cubic-bezier(.34,1.56,.64,1);',
        '}',
        '.mtr-item-check svg{width:11px;height:11px;}',

        /* Animação de seleção */
        '.mtr-item.selecionado .mtr-item-check{opacity:1;transform:scale(1);}',
        '.mtr-item.selecionado{',
            'border-color:rgba(16,185,129,.45)!important;',
            'background:rgba(16,185,129,.08)!important;',
        '}',
        '.mtr-item.selecionado .mtr-item-texto{color:var(--green-h,#059669);font-weight:600;}',

        /* Footer do painel */
        '.mtr-footer{',
            'padding:.65rem 1.2rem;',
            'border-top:1.5px solid var(--border,rgba(0,0,0,.07));',
            'display:flex;align-items:center;justify-content:space-between;gap:.5rem;',
            'background:var(--surface,#f5f8fe);',
        '}',
        '.dark .mtr-footer{background:rgba(255,255,255,.02);}',
        '.mtr-footer-hint{font-size:.7rem;color:var(--fg-m,#6a7895);display:flex;align-items:center;gap:.3rem;}',
        '.mtr-footer-hint svg{width:12px;height:12px;flex-shrink:0;}',
        '.mtr-footer-count{',
            'font-size:.7rem;font-weight:700;',
            'color:var(--fg-m,#6a7895);',
            'background:var(--border,rgba(0,0,0,.06));',
            'padding:.15rem .5rem;border-radius:20px;',
            'white-space:nowrap;',
        '}',

        /* Responsivo mobile */
        '@media(max-width:480px){',
            '.mtr-painel{width:calc(100vw - 24px)!important;left:12px!important;right:12px!important;}',
        '}'
    ].join('');

    /* ── Injetar CSS ─────────────────────────────────────────── */
    function injetarEstilos() {
        if (document.getElementById('mtr-styles')) return;
        var style = document.createElement('style');
        style.id = 'mtr-styles';
        style.textContent = CSS;
        document.head.appendChild(style);
    }

    /* ── Criar botão gatilho ─────────────────────────────────── */
    function criarBotao() {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.id = 'btnSelecaoRapidaMotivos';
        btn.className = 'mtr-btn';
        btn.setAttribute('aria-haspopup', 'true');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('title', 'Selecione um motivo pré-definido');
        btn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                '<circle cx="12" cy="12" r="3"/>' +
                '<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>' +
                '<path d="M4.93 4.93a10 10 0 0 0 0 14.14"/>' +
            '</svg>' +
            '⚡ Seleção rápida';
        return btn;
    }

    /* ── Criar painel ────────────────────────────────────────── */
    function criarPainel() {
        var el = document.createElement('div');
        el.id = 'mtrPainel';
        el.className = 'mtr-painel';
        el.setAttribute('role', 'dialog');
        el.setAttribute('aria-label', 'Seleção rápida de motivos');
        el.style.display = 'none';

        /* Header */
        var header = document.createElement('div');
        header.className = 'mtr-header';
        header.innerHTML =
            '<div class="mtr-header-left">' +
                '<div class="mtr-header-icon">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                        '<path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>' +
                        '<polyline points="14 2 14 8 20 8"/>' +
                        '<line x1="9" y1="13" x2="15" y2="13"/>' +
                        '<line x1="9" y1="17" x2="12" y2="17"/>' +
                    '</svg>' +
                '</div>' +
                '<div>' +
                    '<div class="mtr-header-title">Motivos pré-definidos</div>' +
                    '<div class="mtr-header-sub">Clique para inserir no campo</div>' +
                '</div>' +
            '</div>' +
            '<button class="mtr-close" id="mtrBtnFechar" aria-label="Fechar">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round">' +
                    '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>' +
                '</svg>' +
            '</button>';
        el.appendChild(header);

        /* Lista */
        var lista = document.createElement('div');
        lista.className = 'mtr-lista';
        lista.id = 'mtrLista';

        for (var i = 0; i < MOTIVOS.length; i++) {
            var m = MOTIVOS[i];
            var item = document.createElement('div');
            item.className = 'mtr-item' + (m.comum ? ' mtr-comum' : '');
            item.dataset.index = i;
            item.setAttribute('role', 'option');
            item.setAttribute('tabindex', '0');
            item.setAttribute('aria-label', m.texto);

            var badgeHtml = m.comum
                ? '<div class="mtr-item-badge">' +
                    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>' +
                    'Frequente' +
                  '</div>'
                : '';

            item.innerHTML =
                '<div class="mtr-item-ico">' + (m.icone || '📄') + '</div>' +
                '<div class="mtr-item-body">' +
                    '<div class="mtr-item-texto">' + m.texto + '</div>' +
                    badgeHtml +
                '</div>' +
                '<div class="mtr-item-check">' +
                    '<svg viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                        '<polyline points="20 6 9 17 4 12"/>' +
                    '</svg>' +
                '</div>';

            lista.appendChild(item);
        }

        el.appendChild(lista);

        /* Footer */
        var footer = document.createElement('div');
        footer.className = 'mtr-footer';
        footer.innerHTML =
            '<div class="mtr-footer-hint">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
                    '<circle cx="12" cy="12" r="10"/>' +
                    '<line x1="12" y1="16" x2="12" y2="12"/>' +
                    '<line x1="12" y1="8" x2="12.01" y2="8"/>' +
                '</svg>' +
                'O texto pode ser editado após a seleção' +
            '</div>' +
            '<div class="mtr-footer-count">' + MOTIVOS.length + ' motivos</div>';
        el.appendChild(footer);

        return el;
    }

    /* ── Posicionar painel perto do botão ────────────────────── */
    function posicionarPainel() {
        if (!painelEl || !btnGatilho) return;
        var rect = btnGatilho.getBoundingClientRect();
        var panelW = 440;
        var margin = 8;
        var viewW  = window.innerWidth;
        var viewH  = window.innerHeight;

        var top  = rect.bottom + margin;
        var left = rect.right - panelW;

        // Não sair pela esquerda
        if (left < 12) left = 12;
        // Não sair pela direita
        if (left + panelW > viewW - 12) left = viewW - panelW - 12;
        // Se não couber embaixo, abre acima
        if (top + 420 > viewH - 12) top = rect.top - 420 - margin;
        // Garantia mínima
        if (top < 12) top = 12;

        painelEl.style.top  = top + 'px';
        painelEl.style.left = left + 'px';
    }

    /* ── Abrir painel ────────────────────────────────────────── */
    function abrirPainel() {
        if (painelAberto) return;
        painelAberto = true;
        textoSelecionado = null;

        // Reset estado visual
        var items = painelEl.querySelectorAll('.mtr-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('selecionado');
        }

        // Backdrop
        backdropEl.style.display = 'block';

        // Mostrar e posicionar
        painelEl.style.display = 'block';
        painelEl.classList.remove('fechando');
        void painelEl.offsetWidth; // reflow
        posicionarPainel();

        btnGatilho.setAttribute('aria-expanded', 'true');

        // Foco no primeiro item
        var primeiro = painelEl.querySelector('.mtr-item');
        if (primeiro) primeiro.focus();
    }

    /* ── Fechar painel ───────────────────────────────────────── */
    function fecharPainel(immediato) {
        if (!painelAberto) return;
        painelAberto = false;
        backdropEl.style.display = 'none';
        btnGatilho.setAttribute('aria-expanded', 'false');

        if (immediato) {
            painelEl.style.display = 'none';
            return;
        }

        painelEl.classList.add('fechando');
        var el = painelEl;
        setTimeout(function () {
            el.style.display = 'none';
            el.classList.remove('fechando');
        }, 180);
    }

    /* ── Selecionar motivo ───────────────────────────────────── */
    function selecionarMotivo(index) {
        var motivo = MOTIVOS[index];
        if (!motivo) return;

        var textarea = document.getElementById('motivoDevolucao');
        if (!textarea) return;

        // Feedback visual no item
        var items = painelEl.querySelectorAll('.mtr-item');
        for (var i = 0; i < items.length; i++) {
            items[i].classList.remove('selecionado');
        }
        if (items[index]) items[index].classList.add('selecionado');

        // Preencher textarea
        textarea.value = motivo.texto;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        textarea.focus();

        // Selecionar o final do texto para o usuário poder continuar digitando
        var len = textarea.value.length;
        textarea.setSelectionRange(len, len);

        // Toast de confirmação (usa showToast do declaracoes.js se disponível)
        if (typeof window.showToast === 'function') {
            window.showToast('Motivo inserido! Edite se necessário.', 'success', 2500);
        }

        // Fechar painel após breve delay (deixa o checkmark aparecer)
        setTimeout(function () { fecharPainel(false); }, 320);
    }

    /* ── Inicializar ─────────────────────────────────────────── */
    function init() {
        injetarEstilos();

        var textarea = document.getElementById('motivoDevolucao');
        if (!textarea) return; // Campo não encontrado, não inicializa

        // Encontrar o bloco-label da seção 5 (pai do textarea)
        var formBloco = textarea.closest
            ? textarea.closest('.form-bloco')
            : (function () {
                var p = textarea.parentNode;
                while (p) {
                    if (p.classList && p.classList.contains('form-bloco')) return p;
                    p = p.parentNode;
                }
                return null;
            })();

        if (!formBloco) return;

        var blocoLabel = formBloco.querySelector('.bloco-label');
        if (!blocoLabel) return;

        // Reestruturar bloco-label para suportar botão à direita
        var conteudoAnterior = blocoLabel.innerHTML;
        blocoLabel.innerHTML = '';
        blocoLabel.className = 'bloco-label mtr-bloco-label';

        var esquerda = document.createElement('div');
        esquerda.className = 'mtr-bloco-label-left';
        esquerda.innerHTML = conteudoAnterior;
        blocoLabel.appendChild(esquerda);

        // Criar e adicionar botão
        btnGatilho = criarBotao();
        blocoLabel.appendChild(btnGatilho);

        // Criar backdrop
        backdropEl = document.createElement('div');
        backdropEl.className = 'mtr-backdrop';
        backdropEl.style.display = 'none';
        document.body.appendChild(backdropEl);

        // Criar painel
        painelEl = criarPainel();
        document.body.appendChild(painelEl);

        /* ── Eventos ── */

        // Botão abre/fecha
        btnGatilho.addEventListener('click', function (e) {
            e.stopPropagation();
            if (painelAberto) fecharPainel(false);
            else abrirPainel();
        });

        // Fechar ao clicar no backdrop
        backdropEl.addEventListener('click', function () { fecharPainel(false); });

        // Fechar ao clicar no X interno
        document.addEventListener('click', function (e) {
            if (e.target.closest && e.target.closest('#mtrBtnFechar')) fecharPainel(false);
        });

        // Selecionar motivo ao clicar
        painelEl.addEventListener('click', function (e) {
            e.stopPropagation();
            var item = e.target.closest ? e.target.closest('.mtr-item') : null;
            if (!item) return;
            var idx = parseInt(item.dataset.index, 10);
            if (!isNaN(idx)) selecionarMotivo(idx);
        });

        // Teclado: Enter/Space nos itens, Escape fecha
        painelEl.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') { fecharPainel(false); btnGatilho.focus(); return; }
            var item = e.target.closest ? e.target.closest('.mtr-item') : null;
            if (!item) return;
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                var idx = parseInt(item.dataset.index, 10);
                if (!isNaN(idx)) selecionarMotivo(idx);
            }
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                var next = item.nextElementSibling;
                if (next) next.focus();
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                var prev = item.previousElementSibling;
                if (prev) prev.focus();
            }
        });

        // Fechar Escape global
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && painelAberto) fecharPainel(false);
        });

        // Reposicionar ao redimensionar/scroll
        window.addEventListener('resize',  function () { if (painelAberto) posicionarPainel(); }, { passive: true });
        window.addEventListener('scroll',  function () { if (painelAberto) posicionarPainel(); }, { passive: true });
    }

    /* ── Aguardar DOM ────────────────────────────────────────── */
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
