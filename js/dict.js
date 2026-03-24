'use strict';

// ═══════════════════════════════════════════════════════════════
// §1  CSS INJETADO — estilos da garantia
// ═══════════════════════════════════════════════════════════════

(function _injectCSS() {
  if (document.getElementById('dict-styles')) return;
  const s = document.createElement('style');
  s.id = 'dict-styles';
  s.textContent = `
    /* ── Garantia estendida no cartaz ── */
    .poster-garantia-section {
      position: absolute;
      left: 5cm;
      top: 20cm;
      font-family: var(--font-lato);
      font-size: 6pt;
      line-height: 1.3;
    }
    .poster-garantia-bloco {
      position: absolute;
      left: 0;
    }
    .poster-garantia-bloco:nth-child(1) { top: 0;    }
    .poster-garantia-bloco:nth-child(2) { top: 3cm;  }
    .poster-garantia-bloco:nth-child(3) { top: 6cm;  }

    .gar-titulo {
      font-size: 6.5pt;
      font-weight: 900;
      margin-bottom: 0.12cm;
      white-space: nowrap;
    }
    .gar-row {
      display: flex;
      white-space: nowrap;
    }
    .gar-parc {
      display: inline-block;
      width: 2cm;
      font-weight: 700;
    }
    .gar-val {
      font-weight: 400;
    }
    .gar-info {
      margin-top: 0.4cm;
      font-weight: 700;
      white-space: nowrap;
    }
    .gar-taxas {
      display: flex;
      align-items: center;
      margin-top: 0.4cm;
      margin-left: -0.23cm;
      gap: 0.6cm;
      white-space: nowrap;
    }

    /* ── Toast action btn (compatibilidade) ── */
    .toast-action-btn.primary {
      background: var(--primary);
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
    .toast-action-btn.secondary {
      background: var(--gray-200);
      color: var(--gray-700);
      padding: 6px 12px;
      border-radius: 6px;
      border: none;
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
    }
  `;
  document.head.appendChild(s);
}());

// ═══════════════════════════════════════════════════════════════
// §2  DICIONÁRIO NATIVO
// ═══════════════════════════════════════════════════════════════

const DICIONARIO_NATIVO = {

  /**
   * Palavras protegidas — NUNCA movidas para feature ou marca.
   * São o "tipo" do produto e sempre ficam na descrição.
   */
  descricao: [
    'TV', 'Televisor', 'Televisão',
    'Roupeiro', 'Guarda-roupa',
    'Ventilador', 'Climatizador',
    'Geladeira', 'Refrigerador',
    'Fogão', 'Cooktop', 'Forno',
    'Berço', 'Cama', 'Colchão', 'Cômoda',
    'Sofá', 'Poltrona', 'Puff',
    'Mesa', 'Cadeira', 'Escrivaninha',
    'Lavadora', 'Secadora',
    'Microondas', 'Liquidificador', 'Batedeira',
    'Notebook', 'Computador', 'Monitor', 'Tablet',
    'Celular', 'Smartphone',
    'Impressora', 'Roteador',
    'Aspirador', 'Ferro',
  ],

  /**
   * Marcas — detectadas na descrição, movidas para #subdescricao
   * (somente se o campo estiver vazio).
   */
  marcas: [
    'Zeflex', 'Ortolar', 'Henn', 'Samsung', 'LG',
  ],

  /**
   * Features exatas — detectadas e movidas para #feature-1/2/3.
   * Ordenadas internamente por comprimento (maiores primeiro).
   */
  features: [
    'C/Eurotop', 'Pillow touch', '128gb', '9000 btus', '2 portas', 'Bluetooth',
    '158X198', '138X188', '220V/60hz', '4K', 'FHD', 'UHD', 'QLED', 'Android',
  ],

  /**
   * Cores — tratadas como features (movidas para #feature-1/2/3).
   */
  cores: [
    'Branco', 'Branca', 'Preto', 'Preta',
    'Azul', 'Verde', 'Vermelho', 'Vermelha',
    'Amarelo', 'Amarela', 'Laranja', 'Rosa',
    'Cinza', 'Bege', 'Marrom',
    'Dourado', 'Dourada', 'Prata', 'Prateado', 'Prateada',
    'Cromado', 'Cromada', 'Transparente',
    'Multicolor', 'Colorido', 'Colorida',
    'Off-white', 'Off white', 'Nude',
    'Champagne', 'Inox',
  ],

  /**
   * Padrões numéricos (strings de regex, NÃO objetos RegExp).
   * Reconhecem variações como "12000 btus", "256gb", "50"", "8PTS".
   *
   * Regras ajustadas conforme solicitado:
   *   · Polegadas: número + " ou '' (não "pol." ou "polegadas")
   *   · Watts: apenas W (não KW)
   *   · Litros: apenas L (não "litros")
   *   · PTS: número + PTS (portas abreviadas)
   */
  padroes: [
    '\\b\\d[\\d.,]*\\s*btus?\\b',           
    '\\b\\d[\\d.,]*\\s*gb\\b',               
    '\\b\\d[\\d.,]*\\s*cm\\b',             
    '\\b\\d[\\d.,]*\\s*mb\\b',               
    '\\b\\d+\\s*(?:")',               
    '\\b\\d[\\d.,]*\\s*kg\\b',               
    '\\b\\d+\\s*w\\b',                       
    '\\b\\d[\\d.,]*\\s*hz\\b',               
    '\\b\\d+\\s*l\\b',                       
    '\\b\\d+\\s*pts\\b',              
  ],
};

/** Dicionário ativo — começa com o nativo, pode ser enriquecido via doGet */
window.DICIONARIO = {
  descricao: [...DICIONARIO_NATIVO.descricao],
  marcas:    [...DICIONARIO_NATIVO.marcas],
  features:  [...DICIONARIO_NATIVO.features],
  cores:     [...DICIONARIO_NATIVO.cores],
  padroes:   [...DICIONARIO_NATIVO.padroes],
};

// ═══════════════════════════════════════════════════════════════
// §3  FORMATAÇÃO — Title Case (português)
// ═══════════════════════════════════════════════════════════════

/** Preposições, artigos e conjunções — ficam em minúsculo */
const _LOWER_WORDS = new Set([
  'de','da','do','das','dos','e','a','o','as','os',
  'em','no','na','nos','nas','ao','aos','à','às',
  'um','uma','uns','umas','por','para','com','sem',
  'sob','sobre','entre','até','num','numa','numas','nuns',
]);

/**
 * Siglas e termos técnicos — ficam em MAIÚSCULO.
 * Palavras com dígitos também ficam em maiúsculo (medidas: 128GB, 9000BTUS).
 */
const _UPPER_WORDS = new Set([
  'TV','LED','LCD','OLED','QLED','AMOLED',
  '4K','8K','HD','FHD','UHD','FULL','HD+',
  'AI','IA','USB','HDMI','VGA','RF','DC','AC',
  'GB','TB','MB','BTU','BTUS','KG','HZ','W','KW','PTS','ML',
  'WIFI','WI-FI','BLUETOOTH','BT',
]);

/**
 * Converte texto para Title Case respeitando as regras do português.
 *
 * Exemplo:
 *   "BERCO AMERICANO 3 EM 1" → "Berco Americano 3 em 1"
 *   "TUBOARTE"               → "Tuboarte"
 *   "BRANCO"                 → "Branco"
 *   "128GB"                  → "128GB"
 *   "TV SAMSUNG 50\""        → "TV Samsung 50\""
 */
function _titleCase(str) {
  if (!str) return '';
  return str
    .split(/\s+/)
    .filter(Boolean)
    .map(function(word, i) {
      const up  = word.toUpperCase();
      const low = word.toLowerCase();

      // Siglas técnicas → sempre maiúsculo
      if (_UPPER_WORDS.has(up)) return up;

      // Palavras com dígitos (medidas) → maiúsculo
      if (/\d/.test(word)) return up;

      // Preposições/artigos → minúsculo (exceto 1ª palavra)
      if (i > 0 && _LOWER_WORDS.has(low)) return low;

      // Padrão: capitaliza apenas a 1ª letra
      return low.charAt(0).toUpperCase() + low.slice(1);
    })
    .join(' ');
}

// ═══════════════════════════════════════════════════════════════
// §4  ANÁLISE E APLICAÇÃO DO DICIONÁRIO
// ═══════════════════════════════════════════════════════════════

/** Escapa metacaracteres de regex numa string literal */
function _esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Cria RegExp /gi com âncora de palavra inteira. Nova instância a cada chamada. */
function _re(termo) {
  return new RegExp('\\b' + _esc(termo) + '\\b', 'gi');
}

/**
 * Analisa o texto da descrição e retorna:
 *   descricaoLimpa — texto sem os termos extraídos
 *   marca          — 1ª marca encontrada (vazia se nenhuma)
 *   features       — array de features encontradas (máx. 3)
 *
 * Ordem de prioridade:
 *   1. Palavras protegidas (marcadas, não removidas)
 *   2. Marcas → subtracted → subdescricao
 *   3. Features exatas (maiores primeiro)
 *   4. Cores
 *   5. Padrões numéricos
 *   6. Restauração de palavras protegidas acidentalmente removidas
 */
function _analisar(descricao) {
  const dic    = window.DICIONARIO;
  const oriUp  = descricao.toUpperCase().trim();
  let   texto  = oriUp;
  let   marca  = '';
  const feats  = [];

  // ── 1. Coletar palavras protegidas presentes no texto ────────
  var protegidas = [];
  if (Array.isArray(dic.descricao)) {
    dic.descricao.forEach(function(p) {
      if (_re(p).test(texto)) protegidas.push(p.toUpperCase());
    });
  }

  // ── 2. Marcas ────────────────────────────────────────────────
  dic.marcas.forEach(function(m) {
    if (_re(m).test(texto)) {
      if (!marca) marca = m.toUpperCase();
      texto = texto.replace(_re(m), ' ');
    }
  });

  // ── 3. Features exatas (maiores primeiro) ───────────────────
  var featsOrd = dic.features.slice().sort(function(a, b) {
    return b.length - a.length;
  });
  featsOrd.forEach(function(f) {
    if (_re(f).test(texto)) {
      feats.push(f.toUpperCase());
      texto = texto.replace(_re(f), ' ');
    }
  });

  // ── 4. Cores ─────────────────────────────────────────────────
  if (Array.isArray(dic.cores)) {
    var coresOrd = dic.cores.slice().sort(function(a, b) {
      return b.length - a.length;
    });
    coresOrd.forEach(function(c) {
      if (_re(c).test(texto)) {
        feats.push(c.toUpperCase());
        texto = texto.replace(_re(c), ' ');
      }
    });
  }

  // ── 5. Padrões numéricos ─────────────────────────────────────
  dic.padroes.forEach(function(padrao) {
    var re   = new RegExp(padrao, 'gi');
    var hits = texto.match(re);
    if (hits) {
      hits.forEach(function(h) { feats.push(h.trim().toUpperCase()); });
      texto = texto.replace(new RegExp(padrao, 'gi'), ' ');
    }
  });

  // ── Limpeza ──────────────────────────────────────────────────
  var descricaoLimpa = texto
    .replace(/\s{2,}/g, ' ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim();

  // ── 6. Restaurar palavras protegidas se foram removidas ──────
  protegidas.forEach(function(p) {
    if (!_re(p).test(descricaoLimpa)) {
      descricaoLimpa = (p + ' ' + descricaoLimpa).trim();
    }
  });

  return {
    descricaoLimpa: descricaoLimpa,
    marca:          marca,
    features:       feats.slice(0, 3),
  };
}

/**
 * Aplica o dicionário + Title Case aos campos do formulário.
 * Nunca sobrescreve campos já preenchidos.
 * @returns {boolean} true se ao menos um campo foi alterado
 */
window.aplicarDicionarioAoCampos = function() {
  var descEl = document.getElementById('descricao');
  var subEl  = document.getElementById('subdescricao');
  var f1El   = document.getElementById('feature-1');
  var f2El   = document.getElementById('feature-2');
  var f3El   = document.getElementById('feature-3');

  if (!descEl || !descEl.value.trim()) return false;

  var r    = _analisar(descEl.value);
  var mudou = false;

  // Descrição limpa + Title Case
  var novaDesc = _titleCase(r.descricaoLimpa);
  if (novaDesc !== descEl.value) {
    descEl.value = novaDesc;
    mudou = true;
  }

  // Marca → subdescricao (somente se vazio)
  if (r.marca && subEl && !subEl.value.trim()) {
    subEl.value = _titleCase(r.marca);
    mudou = true;
  }

  // Features → feature-1/2/3 (somente vazios)
  var campos = [f1El, f2El, f3El].filter(Boolean);
  r.features.forEach(function(feat, i) {
    if (campos[i] && !campos[i].value.trim()) {
      campos[i].value = _titleCase(feat);
      mudou = true;
    }
  });

  return mudou;
};

// ═══════════════════════════════════════════════════════════════
// §5  SISTEMA DE BUSCA UNIFICADO
// ─────────────────────────────────────────────────────────────
// PROBLEMA CORRIGIDO:
//   script.js registra um listener em #btn-buscar no topo do arquivo
//   (fora do DOMContentLoaded) E depois clona o botão no DOMContentLoaded
//   adicionando um segundo listener. O inputCodigo acaba com DOIS
//   listeners de keydown, disparando a busca duas vezes.
//   A primeira busca não trata "/" e bagunça o estado do overlay.
//
// SOLUÇÃO: no DOMContentLoaded deste arquivo (roda após script.js),
//   clonar novamente o botão e o input para zerar TODOS os listeners
//   e instalar exatamente UM handler unificado.
// ═══════════════════════════════════════════════════════════════

var _esperar = function(ms) {
  return new Promise(function(r) { setTimeout(r, ms); });
};

function _classificarErro(err) {
  if (!err) return 'Mal contato com a API';
  if (err.name === 'AbortError') return 'Internet oscilando';
  if (err instanceof SyntaxError || (err.message || '').toLowerCase().indexOf('json') >= 0)
    return 'Estrutura recebida da API não compreendida';
  if ((err.message || '').toLowerCase().indexOf('http') >= 0)
    return 'Mal contato com a API';
  return 'Internet oscilando';
}

async function _fetchAPI(ms) {
  ms = ms || 8000;
  var ctrl = new AbortController();
  var tid  = setTimeout(function() { ctrl.abort(); }, ms);
  try {
    var res = await fetch(API_URL, { signal: ctrl.signal, cache: 'no-cache' });
    clearTimeout(tid);
    if (!res.ok) throw new Error('HTTP ' + res.status);
    return await res.json();
  } catch(e) {
    clearTimeout(tid);
    throw e;
  }
}

function _popularCache(dados) {
  if (typeof todosProdutos === 'undefined' || todosProdutos.length > 0) return;
  ['Gabriel', 'Júlia', 'Giovana'].forEach(function(nome) {
    if (!dados[nome]) return;
    dados[nome].forEach(function(item) {
      if (item.Código && item.Descrição) {
        todosProdutos.push({
          codigo:     item.Código,
          descricao:  item.Descrição,
          avista:     item['Total à vista'] || '0,00',
          garantia12: item['Tot. G.E 12'] || '',
        });
      }
    });
  });
}

async function _garantirCache() {
  if (typeof todosProdutos === 'undefined') return false;
  if (todosProdutos.length > 0) return true;
  try {
    _popularCache(await _fetchAPI(10000));
    return true;
  } catch(_) { return false; }
}

// ── Toast de retry ──────────────────────────────────────────
function _toastRetry(codigo, motivo) {
  var container = document.getElementById('toast-container');
  if (!container) return;

  var toast = document.createElement('div');
  toast.className = 'toast error';
  toast.innerHTML =
    '<div class="toast-icon"><i class="fa-solid fa-circle-xmark"></i></div>' +
    '<div class="toast-content">' +
      '<div class="toast-title">Falha na busca</div>' +
      '<div class="toast-message">' +
        'Percebi que deu erro 2 vezes pra achar esse produto, por motivo de ' +
        '<strong>' + motivo + '</strong>. Gostaria de tentar novamente?' +
      '</div>' +
      '<div class="toast-actions">' +
        '<button class="toast-action-btn primary _retry">' +
          '<i class="fa-solid fa-rotate-right"></i>&nbsp;Tentar novamente' +
        '</button>' +
        '<button class="toast-action-btn secondary _dismiss">Dispensar</button>' +
      '</div>' +
    '</div>';

  container.appendChild(toast);

  var fechar = function() {
    toast.classList.add('removing');
    setTimeout(function() { toast.remove(); }, 300);
  };
  toast.querySelector('._retry').addEventListener('click', function() {
    fechar(); _executarBusca(codigo);
  });
  toast.querySelector('._dismiss').addEventListener('click', fechar);
  setTimeout(fechar, 20000);
}

// ── Busca de código simples ──────────────────────────────────
async function _buscarCodigo(codigo) {
  mostrarOverlayBusca('Buscando informações', 'Procurando código ' + codigo + '…');

  var dados = null, lastErr = null;

  for (var t = 1; t <= 2; t++) {
    try {
      dados = await _fetchAPI(8000);
      break;
    } catch(err) {
      lastErr = err;
      if (t === 1) { atualizarOverlayTexto('Reconectando…'); await _esperar(1500); }
    }
  }

  if (!dados) {
    ocultarOverlay();
    _toastRetry(codigo, _classificarErro(lastErr));
    return;
  }

  _popularCache(dados);

  var item = null;
  ['Gabriel', 'Júlia', 'Giovana'].forEach(function(nome) {
    if (!dados[nome]) return;
    dados[nome].forEach(function(i) {
      if (!item && String(i.Código) === String(codigo)) item = i;
    });
  });

  if (item) {
    mostrarOverlaySucesso('Informações encontradas', 'Preenchendo campos…');
    await _esperar(600);

    var partes = (item.Descrição || '').split(' - ');
    document.getElementById('descricao').value    = (partes[0] || '').trim().toUpperCase();
    document.getElementById('subdescricao').value = (partes[1] || '').trim().toUpperCase();

    var avVal = parseCurrency(item['Total à vista']);
    document.getElementById('avista').value = formatCurrency(avVal.toFixed(2));

    if (item['Tot. G.E 12']) {
      document.getElementById('garantia12').value =
        formatCurrency(parseCurrency(item['Tot. G.E 12']).toFixed(2));
    }

    ocultarOverlay();
    setTimeout(function() { window.aplicarDicionarioAoCampos(); }, 100);
    showToast('success', 'Produto encontrado', 'Dados preenchidos automaticamente.');

  } else {
    mostrarOverlayErro('Informações inexistentes', 'Código ' + codigo + ' não encontrado');
    await _esperar(1200);
    ocultarOverlay();
    showToast('warning', 'Produto não encontrado', 'Código não cadastrado. Preencha manualmente.');
  }
}

// ── Busca "/" — mesclar dois produtos ───────────────────────
async function _buscarMesclar(cod1, cod2) {
  mostrarOverlayBusca('Carregando produtos', 'Procurando ' + cod1 + ' e ' + cod2 + '…');

  if (!await _garantirCache()) {
    ocultarOverlay();
    showToast('error', 'Erro ao buscar', 'Não foi possível acessar a API');
    return;
  }

  var prod1 = todosProdutos.find(function(p) { return String(p.codigo) === String(cod1); });
  var prod2 = todosProdutos.find(function(p) { return String(p.codigo) === String(cod2); });

  if (!prod1 || !prod2) {
    ocultarOverlay();
    var falta = !prod1 ? cod1 : cod2;
    showToast('error', 'Produto não encontrado', 'Código ' + falta + ' não existe no cadastro');
    return;
  }

  mostrarOverlaySucesso('Produtos encontrados', 'Preenchendo campos…');
  await _esperar(600);

  var p1 = (prod1.descricao || '').split(' - ');
  var p2 = (prod2.descricao || '').split(' - ');

  document.getElementById('codigo').value       = cod1 + '/' + cod2;
  document.getElementById('descricao').value    = (p1[0] || '').trim().toUpperCase() + '/' + (p2[0] || '').trim().toUpperCase();
  document.getElementById('subdescricao').value = ((p1[1] || p2[1] || '')).trim().toUpperCase();

  var av1 = parseCurrency(prod1.avista), av2 = parseCurrency(prod2.avista);
  document.getElementById('avista').value = formatCurrency((av1 + av2).toFixed(2));

  ocultarOverlay();
  setTimeout(function() { window.aplicarDicionarioAoCampos(); }, 100);
  showToast('success', 'Produtos mesclados', 'Códigos ' + cod1 + ' e ' + cod2 + ' combinados!');
}

// ── Entry-point ──────────────────────────────────────────────
async function _executarBusca(codigo) {
  codigo = (codigo || '').trim();
  if (!codigo) { abrirModalBuscaTexto(); return; }

  if (codigo.indexOf('/') >= 0) {
    var partes = codigo.split('/').map(function(c) { return c.trim(); }).filter(Boolean);
    if (partes.length !== 2) {
      showToast('error', 'Formato inválido', 'Digite exatamente 2 códigos separados por /');
      return;
    }
    await _buscarMesclar(partes[0], partes[1]);
    return;
  }

  await _buscarCodigo(codigo);
}

// ── Instalação dos handlers (zera duplicatas de script.js) ──
function _instalarHandlersBusca() {
  // Clonar botão → remove todos os listeners existentes
  var btnOld = document.getElementById('btn-buscar');
  if (btnOld) {
    var btnNovo = btnOld.cloneNode(true);
    btnOld.parentNode.replaceChild(btnNovo, btnOld);
    btnOld = btnNovo;
  }

  // Clonar input → remove todos os keydown existentes
  var codOld = document.getElementById('codigo');
  if (codOld) {
    var codNovo = codOld.cloneNode(true);
    codOld.parentNode.replaceChild(codNovo, codOld);

    // Re-instalar máscara (só números e "/")
    codNovo.addEventListener('input', function(e) {
      var v = e.target.value.replace(/[^0-9/]/g, '');
      if (v !== e.target.value) e.target.value = v;
    });

    // Enter → clica no botão
    codNovo.addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      e.preventDefault();
      var btn = document.getElementById('btn-buscar');
      if (btn) btn.click();
    });
  }

  // Único listener no botão
  var btn = document.getElementById('btn-buscar');
  if (btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      var val = (document.getElementById('codigo') || {}).value || '';
      _executarBusca(val.trim());
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// §6  GARANTIA ESTENDIDA NO CARTAZ
// ═══════════════════════════════════════════════════════════════

/**
 * Retorna null se valor ≤ 0. Caso contrário retorna objeto com
 * as 5 linhas de parcelamento calculadas pelo FATORES do produto.
 */
function _calcBloco(valor, tipoJuros) {
  if (!valor || valor <= 0) return null;
  var fatores = (typeof FATORES !== 'undefined') ? FATORES[tipoJuros] : null;
  if (!fatores) return null;

  var opcoes = [1, 3, 5, 10, 12];
  return {
    valor:  valor,
    linhas: opcoes.map(function(n) {
      var porParcela = valor * fatores[n];
      return { n: n, porParcela: porParcela, total: porParcela * n };
    }),
  };
}

/** Formata número como "R$ 1.234,56" sem usar brl() externo */
function _brlLocal(n) {
  return 'R$ ' + Number(n).toFixed(2)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/**
 * Gera o HTML de UM bloco de garantia.
 * @param {number} meses  — 12, 24 ou 36
 * @param {object} bloco  — resultado de _calcBloco
 * @param {string} juros  — 'carne' ou 'cartao'
 */
function _blocoHTML(meses, bloco, juros) {
  if (!bloco) return '';

  var taxa1 = juros === 'carne' ? '6,9%' : '2,92%';
  var taxa2 = juros === 'carne' ? '122,71%' : '41,25%';

  // 12x é o plano de referência para "total a prazo"
  var ultimo = bloco.linhas[bloco.linhas.length - 1];

  var linhasHTML = bloco.linhas.map(function(l) {
    return '<div class="gar-row">' +
      '<span class="gar-parc">' + l.n + 'x</span>' +
      '<span class="gar-val">' + _brlLocal(l.porParcela) + '</span>' +
    '</div>';
  }).join('');

  return '<div class="poster-garantia-bloco">' +
    '<div class="gar-titulo">+' + meses + ' MESES</div>' +
    linhasHTML +
    '<div class="gar-info">T.PRAZO: ' + _brlLocal(ultimo.total) + '</div>' +
    '<div class="gar-info">À VISTA: ' + _brlLocal(bloco.valor) + '</div>' +
    '<div class="gar-taxas">' +
      '<span class="gar-t1">' + taxa1 + '</span>' +
      '<span class="gar-t2">' + taxa2 + '</span>' +
    '</div>' +
  '</div>';
}

/**
 * Gera o HTML completo da seção de garantia para o produto.
 * Retorna string vazia se nenhuma garantia estiver preenchida.
 */
function _garantiaSectionHTML(product) {
  var juros = product.juros === 'carne' ? 'carne' : 'cartao';
  var b12   = _calcBloco(product.garantia12, juros);
  var b24   = _calcBloco(product.garantia24, juros);
  var b36   = _calcBloco(product.garantia36, juros);

  if (!b12 && !b24 && !b36) return '';

  return '<div class="poster-garantia-section">' +
    (b12 ? _blocoHTML(12, b12, juros) : '') +
    (b24 ? _blocoHTML(24, b24, juros) : '') +
    (b36 ? _blocoHTML(36, b36, juros) : '') +
  '</div>';
}

/** Patch de generatePosterHTML: injeta a seção de garantia no poster */
function _patchGeneratePosterHTML() {
  var orig = window.generatePosterHTML;
  if (typeof orig !== 'function') return;

  window.generatePosterHTML = function(product, isPreview) {
    var html = orig(product, isPreview);

    var garantiaHTML = _garantiaSectionHTML(product);
    if (!garantiaHTML) return html;

    // Insere via DOM para garantir posicionamento correto
    var temp = document.createElement('div');
    temp.innerHTML = html;

    var posterEl = temp.querySelector('.poster, .poster-carne');
    if (posterEl) {
      var div = document.createElement('div');
      div.innerHTML = garantiaHTML;
      while (div.firstChild) posterEl.appendChild(div.firstChild);
    }

    return temp.innerHTML;
  };
}

// ═══════════════════════════════════════════════════════════════
// §7  HOOKS
// ═══════════════════════════════════════════════════════════════

/** Patch de adicionarProdutoDaBusca: aplica dicionário após preenchimento */
function _patchAdicionarProdutoDaBusca() {
  var orig = window.adicionarProdutoDaBusca;
  if (typeof orig !== 'function') return;
  window.adicionarProdutoDaBusca = function(codigo) {
    orig(codigo);
    setTimeout(function() { window.aplicarDicionarioAoCampos(); }, 150);
  };
}

/**
 * Patch do submit do formulário.
 * Após o handler original rodar (e fazer products.push), normaliza
 * o último produto adicionado para Title Case.
 *
 * Usa dois listeners:
 *   · capture=true  → salva length ANTES do handler original
 *   · capture=false → normaliza o produto SE length aumentou
 */
function _patchFormSubmit() {
  var form = document.getElementById('product-form');
  if (!form) return;

  var _lenAntes = -1;

  // Capture: roda ANTES do handler original de script.js
  form.addEventListener('submit', function() {
    if (typeof products !== 'undefined') _lenAntes = products.length;
  }, true);

  // Bubble: roda APÓS o handler original
  form.addEventListener('submit', function() {
    if (typeof products === 'undefined') return;
    if (products.length <= _lenAntes)   return; // validação falhou, nada foi adicionado

    var last = products[products.length - 1];
    last.descricao    = _titleCase(last.descricao    || '');
    last.subdescricao = _titleCase(last.subdescricao || '');
    last.features     = (last.features || []).map(function(f) { return _titleCase(f); });

    if (typeof salvarCartazesLocalStorage === 'function') salvarCartazesLocalStorage();
    if (typeof renderProducts            === 'function') renderProducts();
  }, false);
}

/** Hook blur no campo #descricao */
function _hookBlurDescricao() {
  var el = document.getElementById('descricao');
  if (el) el.addEventListener('blur', function() { window.aplicarDicionarioAoCampos(); });
}

// ═══════════════════════════════════════════════════════════════
// §8  BUG FIXES
// ═══════════════════════════════════════════════════════════════

// ── Fix 1: #products-actions nunca exibido ───────────────────
// O container pai tem display:none fixo no HTML; renderProducts()
// altera só o filho #btn-gerar-pdf, nunca o container.
function _fixProductsActions() {
  var orig = window.renderProducts;
  if (typeof orig !== 'function') return;
  window.renderProducts = function() {
    orig.apply(this, arguments);
    var actionsEl = document.getElementById('products-actions');
    var listEl    = document.getElementById('products-list');
    if (!actionsEl || !listEl) return;
    actionsEl.style.display =
      listEl.querySelector('.product-card') ? 'flex' : 'none';
  };
}

// ── Fix 2: #descricao-erro ausente no HTML ───────────────────
// script.js faz getElementById('descricao-erro') mas o elemento
// não existe, quebrando a validação de 35 caracteres.
function _fixDescricaoErro() {
  if (document.getElementById('descricao-erro')) return;
  var descEl = document.getElementById('descricao');
  if (!descEl) return;
  var el = document.createElement('span');
  el.id = 'descricao-erro';
  el.style.cssText = 'display:none;color:var(--danger);font-size:12px;margin-top:4px;';
  el.textContent   = 'Máximo de 35 caracteres atingido.';
  descEl.parentElement.appendChild(el);
}

// ── Fix 3: views importar-json e ver-json sem navegação ──────
// O objeto `views` em script.js não inclui essas duas views.
function _fixNavViewsExtras() {
  var mapa = {
    'importar-json': 'Importe cartazes a partir de um arquivo JSON',
    'ver-json':      'Visualize e edite o JSON dos cartazes salvos',
  };
  document.querySelectorAll('.nav-item[data-view]').forEach(function(btn) {
    var name = btn.getAttribute('data-view');
    if (!mapa[name]) return;
    btn.addEventListener('click', function() {
      document.querySelectorAll('.view').forEach(function(v)    { v.classList.remove('active'); });
      document.querySelectorAll('.nav-item').forEach(function(b) { b.classList.remove('active'); });
      var target = document.getElementById('view-' + name);
      if (target) target.classList.add('active');
      btn.classList.add('active');
      var sub = document.getElementById('header-subtitle');
      if (sub) sub.textContent = mapa[name];
    });
  });
}

// ═══════════════════════════════════════════════════════════════
// §9  INICIALIZAÇÃO
// ═══════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
  // Busca: zera handlers duplicados, instala um único unificado
  _instalarHandlersBusca();

  // Dicionário: blur + patch do submit (Title Case) + patch do modal
  _hookBlurDescricao();
  _patchFormSubmit();
  _patchAdicionarProdutoDaBusca();

  // Garantia: injeta seção no HTML do cartaz
  _patchGeneratePosterHTML();

  // Bugs estruturais
  _fixProductsActions();
  _fixDescricaoErro();
  _fixNavViewsExtras();

  // Pré-aquece o cache do modal em background (após 3 s)
  // → Primeira busca por "/" ou pelo modal já é instantânea
  setTimeout(function() { _garantirCache(); }, 3000);
});

// ═══════════════════════════════════════════════════════════════
// §10  DICIONÁRIO REMOTO — doGet (Google Apps Script)
// ─────────────────────────────────────────────────────────────
// Estrutura esperada do endpoint:
//
//   {
//     "descricao": ["Berço", "Sofá"],
//     "marcas":    ["Marca1", "Marca2"],
//     "features":  ["Feature1"],
//     "cores":     ["Roxo", "Turquesa"],
//     "padroes":   ["\\b\\d+\\s*rpm\\b"]
//   }
//
// O dicionário remoto é MESCLADO com o nativo (sem substituir).
// Sistema funciona offline — nativo é sempre o fallback.
//
// Para ativar:
//   1. Publique o Apps Script como Web App (acesso público)
//   2. Defina DICIONARIO_REMOTE_URL abaixo
//   3. Descomente o bloco de inicialização no final
// ──────────────────────────────────────────────────────────────

// var DICIONARIO_REMOTE_URL =
//   'https://script.google.com/macros/s/SEU_ID/exec?action=dicionario';

async function carregarDicionarioRemoto(url) {
  if (!url) return;
  try {
    var res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    var dado = await res.json();

    var merge = function(ativo, novas) {
      if (!Array.isArray(novas)) return;
      novas.forEach(function(item) {
        var existe = ativo.some(function(x) {
          return String(x).toLowerCase() === String(item).toLowerCase();
        });
        if (!existe) ativo.push(item);
      });
    };

    merge(window.DICIONARIO.descricao, dado.descricao);
    merge(window.DICIONARIO.marcas,    dado.marcas);
    merge(window.DICIONARIO.features,  dado.features);
    merge(window.DICIONARIO.cores,     dado.cores);
    merge(window.DICIONARIO.padroes,   dado.padroes);

    console.log('✅ Dicionário remoto mesclado com sucesso.');
  } catch(err) {
    console.warn('⚠️ Dicionário remoto indisponível — usando nativo.', err.message);
  }
}

// Descomente para ativar:
// document.addEventListener('DOMContentLoaded', function() {
//   carregarDicionarioRemoto(DICIONARIO_REMOTE_URL);
// });
