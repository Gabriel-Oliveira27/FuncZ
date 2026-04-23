'use strict';
(function _ECEditor() {

  // ── Estado ─────────────────────────────────────────────────────────────
  var _id  = null;
  var _OPC = ['1x', '3x', '5x', '10x']; // parcelamentos com taxa opcional

  // ── §1 · CSS ────────────────────────────────────────────────────────────
  function _css() {
    if (document.getElementById('ec-styles')) return;
    var s  = document.createElement('style');
    s.id   = 'ec-styles';
    s.textContent = [

      /* ── Botão Editar no card ── */
      '.ec-edit-btn{',
        'display:inline-flex;align-items:center;justify-content:center;gap:6px;',
        'width:100%;padding:8px 0;margin-top:6px;',
        'background:#eff6ff;border:1.5px solid #bfdbfe;border-radius:8px;',
        'font-size:12px;font-weight:600;color:#1d4ed8;',
        'cursor:pointer;transition:all .18s ease;white-space:nowrap;',
      '}',
      '.ec-edit-btn:hover{background:#dbeafe;border-color:#3b82f6;',
        'box-shadow:0 2px 8px rgba(59,130,246,.2);transform:translateY(-1px);}',
      '.ec-edit-btn i{font-size:11px;}',

      /* ── Backdrop ── */
      '#ec-bd{display:none;position:fixed;inset:0;',
        'background:rgba(0,0,0,.38);backdrop-filter:blur(3px);z-index:10998;}',
      '#ec-bd.open{display:block;}',

      /* ── Painel lateral ── */
      '#ec-pnl{position:fixed;top:0;right:0;width:420px;height:100vh;',
        'background:#fff;box-shadow:-6px 0 36px rgba(0,0,0,.15);z-index:10999;',
        'display:flex;flex-direction:column;',
        'transform:translateX(110%);transition:transform .32s cubic-bezier(.16,1,.3,1);',
        'overflow:hidden;}',
      '#ec-pnl.open{transform:translateX(0);}',

      /* Header */
      '#ec-hdr{display:flex;align-items:center;gap:10px;padding:15px 16px;',
        'border-bottom:1.5px solid #e5e7eb;background:#f0f7ff;flex-shrink:0;}',
      '.ec-hdr-ico{width:34px;height:34px;',
        'background:linear-gradient(135deg,#3b82f6,#1d4ed8);border-radius:9px;',
        'display:flex;align-items:center;justify-content:center;',
        'color:white;font-size:13px;flex-shrink:0;}',
      '#ec-title{font-size:13px;font-weight:700;color:#111827;flex:1;',
        'white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}',
      '#ec-x{background:#f3f4f6;border:none;width:28px;height:28px;',
        'border-radius:7px;cursor:pointer;font-size:16px;color:#6b7280;',
        'display:flex;align-items:center;justify-content:center;',
        'transition:all .15s;flex-shrink:0;}',
      '#ec-x:hover{background:#fee2e2;color:#ef4444;}',

      /* Body */
      '#ec-body{flex:1;overflow-y:auto;padding:16px;scrollbar-width:thin;}',

      /* Seção */
      '.ec-sec{margin-bottom:18px;}',
      '.ec-sec-ttl{font-size:10px;font-weight:800;text-transform:uppercase;',
        'letter-spacing:.7px;color:#9ca3af;margin-bottom:11px;',
        'display:flex;align-items:center;gap:5px;}',

      /* Campo */
      '.ec-f{margin-bottom:10px;}',
      '.ec-f:last-child{margin-bottom:0;}',
      '.ec-f>label{display:block;font-size:11px;font-weight:600;',
        'color:#4b5563;margin-bottom:4px;}',
      '.ec-f input[type=text],.ec-f select{',
        'width:100%;padding:8px 10px;border:1.5px solid #e5e7eb;border-radius:7px;',
        'font-size:13px;outline:none;background:white;color:#374151;',
        'font-family:inherit;transition:border-color .15s,box-shadow .15s;}',
      '.ec-f input:focus,.ec-f select:focus{border-color:#3b82f6;',
        'box-shadow:0 0 0 3px rgba(59,130,246,.1);}',
      '.ec-feats{display:flex;flex-direction:column;gap:5px;}',
      '.ec-note{font-size:10px;color:#9ca3af;margin-top:3px;',
        'display:flex;align-items:center;gap:3px;}',

      /* Campo moeda */
      '.ec-cur{position:relative;}',
      '.ec-cur>span{position:absolute;left:10px;top:50%;transform:translateY(-50%);',
        'font-size:12px;color:#9ca3af;font-weight:500;pointer-events:none;}',
      '.ec-cur input{padding-left:28px!important;}',

      /* 2 colunas */
      '.ec-row2{display:grid;grid-template-columns:1fr 1fr;gap:8px;}',

      /* Checkbox row */
      'label.ec-chk{display:none;align-items:center;gap:8px;padding:8px 10px;',
        'background:#f9fafb;border:1.5px solid #e5e7eb;border-radius:8px;',
        'cursor:pointer;user-select:none;margin-bottom:8px;',
        'transition:border-color .15s,background .15s;}',
      'label.ec-chk.vis{display:flex;}',
      'label.ec-chk:hover{border-color:#3b82f6;background:#eff6ff;}',
      'label.ec-chk input[type=checkbox]{width:14px;height:14px;',
        'accent-color:#3b82f6;cursor:pointer;flex-shrink:0;}',
      'label.ec-chk span{font-size:12px;font-weight:500;color:#374151;}',

      /* Erro inline */
      '.ec-err{font-size:11px;color:#ef4444;margin-top:3px;display:none;}',
      '.ec-err.on{display:block;}',

      /* Divider */
      '.ec-div{height:1px;background:#f3f4f6;margin:16px 0;}',

      /* Mini preview */
      '.ec-prev-wrap{position:relative;width:210px;height:297px;overflow:hidden;',
        'margin:0 auto;background:white;border:1px solid #e5e7eb;border-radius:8px;',
        'box-shadow:0 2px 10px rgba(0,0,0,.1);}',
      '.ec-prev-inner{transform:scale(0.28);transform-origin:top left;',
        'width:210mm;height:297mm;pointer-events:none;}',

      /* Footer */
      '#ec-foot{display:flex;gap:8px;padding:12px 16px;',
        'border-top:1.5px solid #e5e7eb;background:white;flex-shrink:0;}',
      '#ec-cancel{flex:1;padding:10px;background:#f3f4f6;',
        'border:1.5px solid #e5e7eb;border-radius:8px;',
        'font-size:13px;font-weight:600;color:#374151;',
        'cursor:pointer;transition:all .15s;font-family:inherit;}',
      '#ec-cancel:hover{background:#e5e7eb;}',
      '#ec-save{flex:2;padding:10px;',
        'background:linear-gradient(135deg,#3b82f6,#1d4ed8);',
        'border:none;border-radius:8px;font-size:13px;font-weight:700;color:white;',
        'cursor:pointer;transition:all .2s;font-family:inherit;',
        'display:flex;align-items:center;justify-content:center;gap:6px;',
        'box-shadow:0 3px 10px rgba(59,130,246,.25);}',
      '#ec-save:hover{transform:translateY(-1px);',
        'box-shadow:0 5px 16px rgba(59,130,246,.35);}',

      /* Alerta de tamanho de desc */
      '.ec-desc-count{font-size:10px;color:#9ca3af;text-align:right;margin-top:2px;}',
      '.ec-desc-count.warn{color:#d97706;}',
      '.ec-desc-count.over{color:#ef4444;font-weight:700;}',

      /* Toast acima do painel */
      '#toast-container{z-index:11000!important;}',
      '#ec-bd{z-index:10998;}',

      /* ── Dark mode ── */
      '[data-theme="dark"] #ec-pnl{background:#1e293b;',
        'box-shadow:-6px 0 36px rgba(0,0,0,.5);}',
      '[data-theme="dark"] #ec-hdr{background:#162032;border-bottom-color:#334155;}',
      '[data-theme="dark"] #ec-title{color:#f1f5f9;}',
      '[data-theme="dark"] #ec-x{background:#273449;color:#94a3b8;}',
      '[data-theme="dark"] #ec-x:hover{background:#4c1515;color:#f87171;}',
      '[data-theme="dark"] #ec-body{scrollbar-color:#334155 #1e293b;}',
      '[data-theme="dark"] .ec-sec-ttl{color:#64748b;}',
      '[data-theme="dark"] .ec-f>label{color:#94a3b8;}',
      '[data-theme="dark"] .ec-f input[type=text],[data-theme="dark"] .ec-f select{',
        'background:#0f172a;border-color:#334155;color:#f1f5f9;}',
      '[data-theme="dark"] .ec-f input:focus,[data-theme="dark"] .ec-f select:focus{',
        'border-color:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,.15);}',
      '[data-theme="dark"] .ec-cur>span{color:#475569;}',
      '[data-theme="dark"] label.ec-chk{background:#162032;border-color:#334155;}',
      '[data-theme="dark"] label.ec-chk:hover{border-color:#3b82f6;background:#1e3a5f;}',
      '[data-theme="dark"] label.ec-chk span{color:#cbd5e1;}',
      '[data-theme="dark"] .ec-div{background:#273449;}',
      '[data-theme="dark"] .ec-note{color:#475569;}',
      '[data-theme="dark"] .ec-prev-wrap{background:#0f172a;border-color:#334155;}',
      '[data-theme="dark"] #ec-foot{background:#1e293b;border-top-color:#334155;}',
      '[data-theme="dark"] #ec-cancel{background:#273449;border-color:#334155;color:#cbd5e1;}',
      '[data-theme="dark"] #ec-cancel:hover{background:#334155;}',
      '[data-theme="dark"] .ec-desc-count{color:#475569;}',
      '[data-theme="dark"] .ec-desc-count.warn{color:#fcd34d;}',
      '[data-theme="dark"] .ec-desc-count.over{color:#f87171;}',
      '[data-theme="dark"] .ec-edit-btn{',
        'background:#1e3a5f;border-color:#3b82f6;color:#93c5fd;}',
      '[data-theme="dark"] .ec-edit-btn:hover{',
        'background:#1d4ed8;border-color:#60a5fa;color:white;}',

    ].join('');
    document.head.appendChild(s);
  }

  // ── §2 · DOM ─────────────────────────────────────────────────────────────
  function _dom() {
    if (document.getElementById('ec-bd')) return;

    // Backdrop
    var bd = document.createElement('div');
    bd.id  = 'ec-bd';
    bd.addEventListener('click', _close);
    document.body.appendChild(bd);

    // Painel
    var pnl = document.createElement('div');
    pnl.id  = 'ec-pnl';
    pnl.setAttribute('role', 'dialog');
    pnl.setAttribute('aria-modal', 'true');
    pnl.setAttribute('aria-label', 'Editor de cartaz');

    pnl.innerHTML = [
      '<div id="ec-hdr">',
        '<div class="ec-hdr-ico"><i class="fa-solid fa-pen-to-square"></i></div>',
        '<span id="ec-title">Editando cartaz</span>',
        '<button id="ec-x" type="button" title="Fechar editor (ESC)">×</button>',
      '</div>',

      '<div id="ec-body">',

        // Seção: Produto
        '<div class="ec-sec">',
          '<div class="ec-sec-ttl">',
            '<i class="fa-solid fa-tag"></i> Produto',
          '</div>',

          '<div class="ec-f">',
            '<label for="ec-desc">',
              'Descrição *',
              '<span id="ec-desc-count" class="ec-desc-count" style="float:right">0 / 38</span>',
            '</label>',
            '<input type="text" id="ec-desc" maxlength="38" ',
              'placeholder="Descrição do produto">',
            '<span class="ec-err" id="ec-desc-err">',
              'Máximo 38 caracteres — reduza antes de salvar',
            '</span>',
          '</div>',

          '<div class="ec-f">',
            '<label for="ec-subdesc">Sub descrição</label>',
            '<input type="text" id="ec-subdesc" placeholder="Marca / complemento">',
          '</div>',

          '<div class="ec-f">',
            '<label>Caracter&#237;sticas</label>',
            '<div class="ec-feats">',
              '<input type="text" id="ec-feat1" placeholder="Caracter&#237;stica 1">',
              '<input type="text" id="ec-feat2" placeholder="Caracter&#237;stica 2">',
              '<input type="text" id="ec-feat3" placeholder="Caracter&#237;stica 3">',
            '</div>',
          '</div>',
        '</div>',

        '<div class="ec-div"></div>',

        // Seção: Preço
        '<div class="ec-sec">',
          '<div class="ec-sec-ttl">',
            '<i class="fa-solid fa-dollar-sign"></i> Preço e parcelamento',
          '</div>',

          '<div class="ec-f">',
            '<label for="ec-avista">Valor à vista *</label>',
            '<div class="ec-cur">',
              '<span>R$</span>',
              '<input type="text" id="ec-avista" placeholder="0,00">',
            '</div>',
          '</div>',

          '<div class="ec-row2">',
            '<div class="ec-f">',
              '<label for="ec-metodo">Parcelamento *</label>',
              '<select id="ec-metodo">',
                '<option value="">Selecione...</option>',
                '<option value="1x">1x (&#224; vista)</option>',
                '<option value="3x">3x</option>',
                '<option value="5x">5x</option>',
                '<option value="10x">10x</option>',
                '<option value="12x">12x</option>',
              '</select>',
            '</div>',
            '<div class="ec-f">',
              '<label for="ec-juros">Taxa</label>',
              '<select id="ec-juros">',
                '<option value="">Sem taxa</option>',
                '<option value="carne">Carn&#234;</option>',
                '<option value="cartao">Cart&#227;o</option>',
                '<option value="virado">Pre&#231;o virado</option>',
              '</select>',
            '</div>',
          '</div>',

          // Checkbox: aplicar taxa (apenas para 1x/3x/5x/10x)
          '<label class="ec-chk" id="ec-chk-taxa-lbl">',
            '<input type="checkbox" id="ec-chk-taxa">',
            '<span>Aplicar taxa de juros na parcela</span>',
          '</label>',

          '<div class="ec-f">',
            '<label for="ec-parcela">',
              'Parcela ',
              '<span style="color:#9ca3af;font-weight:400;">(calculado automaticamente)</span>',
            '</label>',
            '<div class="ec-cur">',
              '<span>R$</span>',
              '<input type="text" id="ec-parcela" placeholder="0,00">',
            '</div>',
            '<div class="ec-note">',
              '<i class="fa-solid fa-calculator" style="font-size:9px;"></i>',
              ' Recalcula ao alterar à vista, parcelamento ou taxa',
            '</div>',
          '</div>',

          // Checkbox: sem juros (disponível para todos os métodos)
          '<label class="ec-chk vis" id="ec-chk-sj-lbl">',
            '<input type="checkbox" id="ec-chk-sj">',
            '<span>Mostrar "Sem juros!"; no cartaz</span>',
          '</label>',

          // Campo: campanha (visível quando há campanha ou ao marcar checkbox)
          '<label class="ec-chk" id="ec-chk-campanha-lbl" style="display:flex;">',
            '<input type="checkbox" id="ec-chk-campanha">',
            '<span>Inserir campanha no cartaz</span>',
          '</label>',
          '<div class="ec-f" id="ec-campanha-field" style="display:none;">',
            '<label for="ec-campanha">Campanha</label>',
            '<input type="text" id="ec-campanha" maxlength="40" placeholder="Ex: LIQUIDA VER\u00c3O 2025">',
          '</div>',
        '</div>',

        '<div class="ec-div"></div>',

        // Seção: Prévia
        '<div class="ec-sec">',
          '<div class="ec-sec-ttl">',
            '<i class="fa-solid fa-eye"></i> Prévia do cartaz',
          '</div>',
          '<div class="ec-prev-wrap">',
            '<div class="ec-prev-inner" id="ec-prev"></div>',
          '</div>',
          '<p style="font-size:10px;color:#9ca3af;text-align:center;margin-top:6px;">',
            'A prévia atualiza automaticamente',
          '</p>',
        '</div>',

      '</div>',

      '<div id="ec-foot">',
        '<button type="button" id="ec-cancel">Cancelar</button>',
        '<button type="button" id="ec-save">',
          '<i class="fa-solid fa-floppy-disk"></i> Salvar alterações',
        '</button>',
      '</div>',
    ].join('');

    document.body.appendChild(pnl);

    // ── Event listeners do painel ──
    _$('ec-x').addEventListener('click', _close);
    _$('ec-cancel').addEventListener('click', _close);
    _$('ec-save').addEventListener('click', _save);

    // Avista → formatar + recalcular + prévia
    _$('ec-avista').addEventListener('input', function(e) {
      if (typeof formatCurrency === 'function') e.target.value = formatCurrency(e.target.value);
      _recalc();
      _prev();
    });

    // Parcela → formatar + prévia (permite override manual)
    _$('ec-parcela').addEventListener('input', function(e) {
      if (typeof formatCurrency === 'function') e.target.value = formatCurrency(e.target.value);
      _prev();
    });

    // Metodo → atualizar UI + recalcular + prévia
    _$('ec-metodo').addEventListener('change', function() {
      _mUI();
      _recalc();
      _prev();
    });

    // Juros → recalcular + prévia
    _$('ec-juros').addEventListener('change', function() {
      _recalc();
      _prev();
    });

    // Checkbox taxa → habilitar/desabilitar juros + recalcular + prévia
    _$('ec-chk-taxa').addEventListener('change', function() {
      var j = _$('ec-juros');
      j.disabled = !this.checked;
      if (!this.checked) j.value = '';
      _recalc();
      _prev();
    });

    // Checkbox sem juros → apenas prévia
    _$('ec-chk-sj').addEventListener('change', _prev);

    // Checkbox campanha → mostrar/ocultar campo campanha + prévia
    _$('ec-chk-campanha').addEventListener('change', function() {
      var f = _$('ec-campanha-field');
      if (f) f.style.display = this.checked ? 'block' : 'none';
      if (!this.checked) { var c = _$('ec-campanha'); if (c) c.value = ''; }
      _prev();
    });

    // Campo campanha → prévia
    _$('ec-campanha').addEventListener('input', _prev);

    // Descrição → validar comprimento + contador + prévia
    _$('ec-desc').addEventListener('input', function() {
      var len = this.value.length;
      var cnt = _$('ec-desc-count');
      var err = _$('ec-desc-err');
      if (cnt) {
        cnt.textContent = len + ' / 38';
        cnt.className = 'ec-desc-count' + (len > 38 ? ' over' : len > 35 ? ' warn' : '');
      }
      if (len > 38) {
        this.style.borderColor = '#ef4444';
        err.classList.add('on');
      } else if (len > 35) {
        this.style.borderColor = '#f59e0b';
        err.classList.remove('on');
      } else {
        this.style.borderColor = '';
        err.classList.remove('on');
      }
      _prev();
    });

    // Outros campos de texto → apenas prévia
    ['ec-subdesc', 'ec-feat1', 'ec-feat2', 'ec-feat3'].forEach(function(id) {
      _$(id).addEventListener('input', _prev);
    });

    // ESC fecha o painel (sem interferir com outros handlers ESC existentes)
    document.addEventListener('keydown', function(e) {
      if (e.key !== 'Escape') return;
      var pnl = _$('ec-pnl');
      if (pnl && pnl.classList.contains('open')) {
        e.stopPropagation();
        _close();
      }
    }, true); // capture = true para ter prioridade
  }

  // ── §3 · ADICIONAR BOTÕES NOS CARDS ─────────────────────────────────────
  function _addBtns() {
    document.querySelectorAll('.product-card').forEach(function(card) {
      if (card.querySelector('.ec-edit-btn')) return;
      var preview = card.querySelector('.product-preview[data-preview-id]');
      if (!preview) return;
      var id = preview.getAttribute('data-preview-id');
      if (!id) return;

      var btn = document.createElement('button');
      btn.type      = 'button';
      btn.className = 'ec-edit-btn';
      btn.innerHTML = '<i class="fa-solid fa-pen-to-square"></i> Editar cartaz';
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        _warn(id);
      });

      // Inserir ao final da segunda coluna do card
      var secondCol = card.children[1];
      if (secondCol) {
        var wrapper = document.createElement('div');
        secondCol.appendChild(wrapper).appendChild(btn);
      }
    });
  }

  // ── §4 · DIÁLOGO DE AVISO ────────────────────────────────────────────────
  function _warn(id) {
    if (typeof showConfirm !== 'function') {
      _open(id);
      return;
    }
    showConfirm({
      title:       'Editar cartaz',
      subtitle:    'Atenção antes de editar',
      message:     'Cuidado com suas alterações! Elas podem modificar valores ou informações que deveriam permanecer fixos no cartaz. Deseja continuar?',
      confirmText: 'Sim, editar',
      cancelText:  'Voltar',
      iconType:    'warning',
      onConfirm:   function() { _open(id); },
    });
  }

  // ── §5 · ABRIR PAINEL ────────────────────────────────────────────────────
  function _open(id) {
    if (typeof products === 'undefined') return;
    var p = products.find(function(x) { return String(x.id) === String(id); });
    if (!p) {
      if (typeof showToast === 'function') showToast('error', 'Erro', 'Cartaz n&#227;o encontrado.');
      return;
    }

    _id = id;

    // Preencher campos de texto
    _v('ec-desc',    p.descricao    || '');
    _v('ec-subdesc', p.subdescricao || '');
    _v('ec-feat1',   (p.features && p.features[0]) || '');
    _v('ec-feat2',   (p.features && p.features[1]) || '');
    _v('ec-feat3',   (p.features && p.features[2]) || '');

    // Atualizar contador de caracteres da descrição
    var cnt = _$('ec-desc-count');
    if (cnt) {
      var dlen = (p.descricao || '').length;
      cnt.textContent = dlen + ' / 38';
      cnt.className   = 'ec-desc-count' + (dlen > 38 ? ' over' : dlen > 35 ? ' warn' : '');
    }

    // Valor à vista
    var avistaNum = (typeof parseCurrency === 'function')
      ? parseCurrency(p.avista)
      : (+p.avista || 0);
    _v('ec-avista', (typeof formatCurrency === 'function')
      ? formatCurrency(String(Math.round(avistaNum * 100)))
      : avistaNum.toFixed(2).replace('.', ','));

    // Parcelamento e taxa
    _v('ec-metodo', p.metodo || '');

    // Determinar se taxa foi aplicada (para parcelamentos opcionais)
    var taxaOpc  = _OPC.indexOf(p.metodo || '') >= 0;
    var taxaAtiva = taxaOpc ? !!(p.juros) : false;
    _$('ec-chk-taxa').checked = taxaAtiva;

    // Atualizar UI de metodo ANTES de setar juros
    // (pode limpar juros se taxa não ativa — será sobrescrito logo em seguida)
    _mUI();

    // Setar juros APÓS mUI para garantir valor correto
    _v('ec-juros', p.juros || '');
    // Garantir estado disabled correto
    _$('ec-juros').disabled = (taxaOpc && !taxaAtiva);

    // Parcela
    var parcelaNum = (typeof parseCurrency === 'function')
      ? parseCurrency(p.parcela)
      : (+p.parcela || 0);
    _v('ec-parcela', (typeof formatCurrency === 'function')
      ? formatCurrency(String(Math.round(parcelaNum * 100)))
      : parcelaNum.toFixed(2).replace('.', ','));

    // Sem juros
    _$('ec-chk-sj').checked = !!(p.semJuros);

    // Campanha
    var temCampanha = !!(p.campanha && p.campanha.trim());
    _$('ec-chk-campanha').checked = temCampanha;
    _v('ec-campanha', p.campanha || '');
    var campField = _$('ec-campanha-field');
    if (campField) campField.style.display = temCampanha ? 'block' : 'none';

    // Título do painel
    _$('ec-title').textContent = 'Editando: ' + (p.descricao || '').substring(0, 26);

    // Limpar estado de erro da descrição
    _$('ec-desc-err').classList.remove('on');
    _$('ec-desc').style.borderColor = '';

    // Atualizar prévia
    _prev();

    // Abrir
    _$('ec-bd').classList.add('open');
    _$('ec-pnl').classList.add('open');

    // Foco no primeiro campo após animação
    setTimeout(function() {
      var f = _$('ec-desc');
      if (f) { f.focus(); f.select(); }
    }, 340);
  }

  // ── §6 · FECHAR PAINEL ───────────────────────────────────────────────────
  function _close() {
    _$('ec-bd').classList.remove('open');
    _$('ec-pnl').classList.remove('open');
    _id = null;
  }

  // ── §7 · UI DINÂMICA DO PARCELAMENTO ─────────────────────────────────────
  function _mUI() {
    var metodo  = _gv('ec-metodo');
    var taxaLbl = _$('ec-chk-taxa-lbl');
    var taxaChk = _$('ec-chk-taxa');
    var juros   = _$('ec-juros');

    if (_OPC.indexOf(metodo) >= 0) {
      // Parcelamento com taxa opcional: mostrar checkbox
      taxaLbl.classList.add('vis');
      juros.disabled = !taxaChk.checked;
      if (!taxaChk.checked) juros.value = '';
    } else {
      // 12x ou vazio: ocultar checkbox, taxa obrigatória se 12x
      taxaLbl.classList.remove('vis');
      taxaChk.checked  = false;
      juros.disabled   = false;
    }
  }

  // ── §8 · RECALCULAR PARCELA ──────────────────────────────────────────────
  function _recalc() {
    var metodo   = _gv('ec-metodo');
    var juros    = _gv('ec-juros');
    var taxaAtiva = _$('ec-chk-taxa').checked;
    var pEl      = _$('ec-parcela');
    var avista   = (typeof parseCurrency === 'function')
      ? parseCurrency(_gv('ec-avista'))
      : _parseFallback(_gv('ec-avista'));

    if (!metodo || !(avista > 0)) { pEl.value = ''; return; }

    var n       = parseInt(metodo.replace('x', '')) || 1;
    var parcela = 0;

    if (metodo === '1x') {
      parcela = (!taxaAtiva || !juros) ? avista : _fator(avista, 1, juros);

    } else if (_OPC.indexOf(metodo) >= 0) {
      parcela = (!taxaAtiva || !juros)
        ? (Math.round((avista / n) * 100) / 100)
        : _fator(avista, n, juros);

    } else if (metodo === '12x') {
      if (!juros) { pEl.value = ''; return; }
      parcela = _fator(avista, 12, juros);
    }

    pEl.value = (typeof formatCurrency === 'function')
      ? formatCurrency(String(Math.round(parcela * 100)))
      : parcela.toFixed(2).replace('.', ',');
  }

  function _fator(avista, n, juros) {
    if (typeof FATORES === 'undefined') return Math.round((avista / n) * 100) / 100;
    var tipo = juros === 'carne' ? 'carne' : 'cartao';
    var f    = FATORES[tipo] && FATORES[tipo][n];
    if (!f) return Math.round((avista / n) * 100) / 100;
    var v = avista * f;
    return (typeof arredondar90 === 'function') ? arredondar90(v) : Math.round(v * 100) / 100;
  }

  // ── §9 · ATUALIZAR PRÉVIA ────────────────────────────────────────────────
  function _prev() {
    if (typeof generatePosterHTML !== 'function') return;
    if (typeof products === 'undefined' || !_id) return;
    var p = products.find(function(x) { return String(x.id) === String(_id); });
    if (!p) return;

    var taxaAtiva  = _$('ec-chk-taxa').checked;
    var metodo     = _gv('ec-metodo') || p.metodo || '12x';
    var juros      = _gv('ec-juros')  || '';
    var jurosFinal = (_OPC.indexOf(metodo) >= 0 && !taxaAtiva) ? '' : juros;

    var avista  = (typeof parseCurrency === 'function')
      ? parseCurrency(_gv('ec-avista'))
      : _parseFallback(_gv('ec-avista'));
    var parcela = (typeof parseCurrency === 'function')
      ? parseCurrency(_gv('ec-parcela'))
      : _parseFallback(_gv('ec-parcela'));

    if (!(avista > 0)) avista  = p.avista;
    if (!(parcela > 0)) parcela = p.parcela;

    var descRaw = (_gv('ec-desc') || '').trim();
    var feats   = [_gv('ec-feat1'), _gv('ec-feat2'), _gv('ec-feat3')].filter(Boolean);

    // Objeto temporário apenas para a prévia — não altera products[]
    var campanhaVal = _$('ec-chk-campanha') && _$('ec-chk-campanha').checked
      ? ((_gv('ec-campanha') || '').trim().toUpperCase())
      : '';
    var tmp = Object.assign({}, p, {
      descricao:    (descRaw ? descRaw : p.descricao).toUpperCase(),
      subdescricao: ((_gv('ec-subdesc') || p.subdescricao || '').trim()).toUpperCase(),
      features:     feats.length ? feats : p.features,
      avista:       avista,
      parcela:      parcela,
      metodo:       metodo,
      juros:        jurosFinal,
      semJuros:     _$('ec-chk-sj').checked,
      campanha:     campanhaVal,
    });

    var container = _$('ec-prev');
    if (container) {
      try {
        container.innerHTML = generatePosterHTML(tmp, true);
      } catch(e) {
        // silencia erros de prévia (ex: campos incompletos)
      }
    }
  }

  // ── §10 · SALVAR ─────────────────────────────────────────────────────────
  function _save() {
    if (!_id || typeof products === 'undefined') return;

    var idx = products.findIndex(function(x) { return String(x.id) === String(_id); });
    if (idx === -1) {
      if (typeof showToast === 'function') showToast('error', 'Erro', 'Produto não encontrado.');
      return;
    }

    var desc   = (_gv('ec-desc') || '').trim().toUpperCase();
    var metodo = _gv('ec-metodo');
    var avista = (typeof parseCurrency === 'function')
      ? parseCurrency(_gv('ec-avista'))
      : _parseFallback(_gv('ec-avista'));

    // Validações antes de salvar
    if (!desc) {
      _$('ec-desc').focus();
      if (typeof showToast === 'function') showToast('warning', 'Campo obrigatório', 'Preencha a descrição.');
      return;
    }
    if (desc.length > 38) {
      _$('ec-desc').focus();
      if (typeof showToast === 'function') showToast('error', 'Descrição longa demais',
        'Máximo 38 caracteres. Reduza antes de salvar.');
      return;
    }
    if (!metodo) {
      _$('ec-metodo').focus();
      if (typeof showToast === 'function') showToast('warning', 'Campo obrigatório', 'Selecione o parcelamento.');
      return;
    }
    if (!(avista > 0)) {
      _$('ec-avista').focus();
      if (typeof showToast === 'function') showToast('warning', 'Valor inválido', 'Informe o valor à vista.');
      return;
    }

    var taxaAtiva = _$('ec-chk-taxa').checked;
    var juros     = _gv('ec-juros');

    // 12x exige taxa obrigatória
    if (metodo === '12x' && !juros) {
      _$('ec-juros').focus();
      if (typeof showToast === 'function') showToast('warning', 'Campo obrigatório',
        'Selecione a taxa de juros para 12x.');
      return;
    }

    var jurosFinal = (_OPC.indexOf(metodo) >= 0 && !taxaAtiva) ? '' : juros;
    var parcela    = (typeof parseCurrency === 'function')
      ? parseCurrency(_gv('ec-parcela'))
      : _parseFallback(_gv('ec-parcela'));
    var feats      = [_gv('ec-feat1'), _gv('ec-feat2'), _gv('ec-feat3')].filter(Boolean);

    // Backup para desfazer
    var backup = JSON.parse(JSON.stringify(products[idx]));

    // Aplicar alterações
    products[idx].descricao    = desc;
    products[idx].subdescricao = ((_gv('ec-subdesc') || '').trim()).toUpperCase();
    products[idx].features     = feats.length ? feats : products[idx].features;
    products[idx].avista       = avista;
    products[idx].parcela      = parcela > 0 ? parcela : products[idx].parcela;
    products[idx].metodo       = metodo;
    products[idx].juros        = jurosFinal;
    products[idx].semJuros     = _$('ec-chk-sj').checked;
    products[idx].campanha     = (_$('ec-chk-campanha') && _$('ec-chk-campanha').checked)
      ? ((_gv('ec-campanha') || '').trim().toUpperCase())
      : '';

    // Persistir e re-renderizar
    if (typeof salvarCartazesLocalStorage === 'function') salvarCartazesLocalStorage();
    if (typeof renderProducts             === 'function') renderProducts();

    _close();

    // Toast com opção de desfazer
    var descLabel = desc.substring(0, 40);
    if (typeof showUndoToast === 'function') {
      showUndoToast(
        'Cartaz editado!',
        descLabel + ' \u00b7 altera\u00e7\u00f5es salvas.',
        function() {
          var i2 = products.findIndex(function(x) { return String(x.id) === String(backup.id); });
          if (i2 !== -1) {
            products[i2] = backup;
            if (typeof salvarCartazesLocalStorage === 'function') salvarCartazesLocalStorage();
            if (typeof renderProducts             === 'function') renderProducts();
            if (typeof showToast === 'function') showToast('info', 'Desfeito',
              'Cartaz restaurado para a vers\u00e3o anterior.');
          }
        },
        7000
      );
    } else if (typeof showToast === 'function') {
      showToast('success', 'Cartaz editado!', 'Alterações salvas com sucesso.');
    }
  }

  // ── §11 · HELPERS ────────────────────────────────────────────────────────
  function _$(id)        { return document.getElementById(id); }
  function _v(id, val)   { var el = _$(id); if (el) el.value = val; }
  function _gv(id)       { var el = _$(id); return el ? el.value : ''; }
  function _parseFallback(s) {
    if (!s) return 0;
    var n = parseFloat(String(s).replace(/\./g, '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  }

  // ── §12 · PATCH renderProducts ───────────────────────────────────────────
  function _patch() {
    var tries = 0;
    var iv = setInterval(function() {
      if (++tries > 40) { clearInterval(iv); return; }
      if (typeof window.renderProducts !== 'function') return;
      clearInterval(iv);

      var orig = window.renderProducts;
      window.renderProducts = function() {
        orig.apply(this, arguments);
        setTimeout(_addBtns, 80);
      };
    }, 150);
  }

  // ── §13 · INICIALIZAÇÃO ──────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', function() {
    _css();
    _dom();
    _patch();
    // Adicionar botões nos cards já renderizados (carregados do localStorage)
    setTimeout(_addBtns, 300);
  });

}());
