'use strict';

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
    'Zeflex', 'Ortolar', 'Henn', 'Samsung', 'LG', 'Philips', 'Sony', 'Dell', 'Lenovo', 'Asus',
    'Brastemp', 'Consul', 'Midea', 'Springer', 'Electrolux',  'TCL', 'Xiaomi', 'Multilaser', 'AOC', 'Acer', 'Avelan',
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

// ── Cache de produtos da API remota (GAS) ────────────────────────────────────
// Usado como fallback quando o produto não é encontrado em produtos.json.
var _apiProdutosCache  = null;   // null = não carregado ainda; [] = carregado (mesmo que vazio)
var _apiProdutosPromise = null;  // garante um único fetch simultâneo

/**
 * Busca produtos da API remota (Google Apps Script / API_URL) e armazena em cache.
 * Retorna o produto com o código solicitado ou null se não encontrar.
 */
async function _buscarProdutoNaAPI(codigo) {
  if (typeof API_URL === 'undefined' || !API_URL) return null;

  // Usa o cache se já carregado
  if (_apiProdutosCache !== null) {
    return _apiProdutosCache.find(function(p) {
      return String(p.codigo) === String(codigo);
    }) || null;
  }

  // Primeiro acesso: baixa todos os produtos da API e armazena em cache
  if (!_apiProdutosPromise) {
    _apiProdutosPromise = (async () => {
      try {
        const ctrl = new AbortController();
        const tid  = setTimeout(() => ctrl.abort(), 10000);
        const res  = await fetch(API_URL, { signal: ctrl.signal, cache: 'no-cache' });
        clearTimeout(tid);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const dados = await res.json();

        const lista = [];
        const toBRL = v => {
          if (v === null || v === undefined || v === '') return '';
          if (typeof v === 'number') return v.toFixed(2).replace('.', ',');
          return String(v).replace('.', ',');
        };

        if (Array.isArray(dados.produtos)) {
          dados.produtos.forEach(p => {
            if (!p.codigo || !p.descricao) return;
            lista.push({
              codigo:     String(p.codigo),
              descricao:  p.descricao,
              avista:     toBRL(p.avista) || '0,00',
              garantia12: toBRL(p.garantia12),
              tamanho:    (p.tamanho || '').toUpperCase().trim() || null,
            });
          });
        } else {
          // Formato legado Google Sheets
          ['Gabriel', 'Júlia', 'Giovana'].forEach(nome => {
            (dados[nome] || []).forEach(item => {
              if (!item['Código'] || !item['Descrição']) return;
              lista.push({
                codigo:     String(item['Código']),
                descricao:  item['Descrição'],
                avista:     toBRL(item['Total à vista']) || '0,00',
                garantia12: toBRL(item['Tot. G.E 12'] || ''),
                tamanho:    null,
              });
            });
          });
        }

        _apiProdutosCache = lista;
        console.log('[API-GAS] ' + lista.length + ' produto(s) carregado(s) da API remota.');
      } catch(e) {
        console.warn('[API-GAS] Falha ao carregar da API:', e.message);
        _apiProdutosCache = [];
      }
    })();
  }

  await _apiProdutosPromise;

  if (!_apiProdutosCache || _apiProdutosCache.length === 0) return null;
  return _apiProdutosCache.find(function(p) {
    return String(p.codigo) === String(codigo);
  }) || null;
}

function _classificarErro(err) {
  if (!err) return 'Mal contato com a API';
  if (err.name === 'AbortError') return 'Internet oscilando';
  if (err instanceof SyntaxError || (err.message || '').toLowerCase().indexOf('json') >= 0)
    return 'Estrutura recebida da API não compreendida';
  if ((err.message || '').toLowerCase().indexOf('http') >= 0)
    return 'Mal contato com a API';
  return 'Internet oscilando';
}

// ── Cache via inicializarProdutos (produtos.json) ────────────
// Mantém _garantirCache como wrapper para compatibilidade interna.
async function _garantirCache() {
  if (typeof inicializarProdutos === 'function') {
    await inicializarProdutos();
  }
  return typeof todosProdutos !== 'undefined' && todosProdutos.length > 0;
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

  var ok = await _garantirCache();

  // ── 1ª tentativa: base local (produtos.json) ──
  var item = null;
  if (ok) {
    for (var i = 0; i < todosProdutos.length; i++) {
      if (String(todosProdutos[i].codigo) === String(codigo)) { item = todosProdutos[i]; break; }
    }
  }

  // ── 2ª tentativa: API remota (GAS) se não encontrado localmente ──
  if (!item) {
    mostrarOverlayBusca(
      'Produto não encontrado localmente',
      'Buscando na base de dados da API…'
    );
    await _esperar(350);
    item = await _buscarProdutoNaAPI(codigo);
    // Adiciona ao cache local para buscas futuras nesta sessão
    if (item && typeof todosProdutos !== 'undefined') {
      todosProdutos.push(item);
    }
  }

  if (item) {
    mostrarOverlaySucesso('Informações encontradas', 'Preenchendo campos…');
    await _esperar(600);
    try {
      var partes = (item.descricao || '').split(' - ');
      document.getElementById('descricao').value    = (partes[0] || '').trim().toUpperCase();
      // partes[1] pode ser undefined quando não há " - " — || '' protege
      document.getElementById('subdescricao').value = (partes[1] || '').trim().toUpperCase();

      // Garante string antes de parseCurrency (avista pode chegar como number da API)
      var avVal = parseCurrency(String(item.avista || '0'));
      document.getElementById('avista').value = formatCurrency(avVal.toFixed(2));

      if (item.garantia12) {
        document.getElementById('garantia12').value =
          formatCurrency(parseCurrency(String(item.garantia12)).toFixed(2));
      }

      setTimeout(function() { window.aplicarDicionarioAoCampos(); }, 100);
      showToast('success', 'Produto encontrado', 'Dados preenchidos automaticamente.');
    } catch (fillErr) {
      console.error('[Dict] Erro ao preencher campos:', fillErr.message, fillErr);
      showToast('warning', 'Produto carregado', 'Código localizado — verifique os campos.');
    } finally {
      ocultarOverlay();
    }

  } else {
    mostrarOverlayErro(
      'Produto não encontrado',
      'Código ' + codigo + ' não existe na base local nem na API'
    );
    await _esperar(1400);
    ocultarOverlay();
    showToast('warning', 'Produto não encontrado',
      'Código ' + codigo + ' não foi localizado em nenhuma base de dados.');
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

  // Fallback para API remota se algum produto não estiver na base local
  if (!prod1 || !prod2) {
    mostrarOverlayBusca('Buscando na API remota', 'Produto não encontrado localmente…');
    await _esperar(300);
    if (!prod1) prod1 = await _buscarProdutoNaAPI(cod1);
    if (!prod2) prod2 = await _buscarProdutoNaAPI(cod2);
  }

  if (!prod1 || !prod2) {
    ocultarOverlay();
    var falta = !prod1 ? cod1 : cod2;
    showToast('error', 'Produto não encontrado',
      'Código ' + falta + ' não existe na base local nem na API');
    return;
  }

  mostrarOverlaySucesso('Produtos encontrados', 'Preenchendo campos…');
  await _esperar(600);

  // ── Detecção de tipo: colchão / base box ─────────────────
  var _norm = function(s) {
    return (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  };
  var norm1 = _norm(prod1.descricao);
  var norm2 = _norm(prod2.descricao);

  var isColchao1 = /^colch[ao][on]?\b/.test(norm1);
  var isBase1    = /^base\s*box\b/.test(norm1);
  var isColchao2 = /^colch[ao][on]?\b/.test(norm2);
  var isBase2    = /^base\s*box\b/.test(norm2);

  var duasBasesPairType = (isBase1 && isBase2)
    ? 'duas bases box'
    : (isColchao1 && isColchao2)
      ? 'dois colchões'
      : null;

  if (duasBasesPairType) {
    ocultarOverlay();
    showToast('error', 'Combinação inválida',
      'Você adicionou ' + duasBasesPairType + '. Não é possível criar um encarte de Conjunto Box assim. Verifique os códigos.');
    return;
  }

  // ── Par colchão + base → Conj. Box ──────────────────────
  var isBoxPair = (isColchao1 && isBase2) || (isBase1 && isColchao2);

  if (isBoxPair && typeof window.DICT_BOX !== 'undefined') {
    var colProd  = isColchao1 ? prod1 : prod2;
    var baseProd = isBase1    ? prod1 : prod2;

    var pair = {
      col:      { codigo: colProd.codigo,  descricao: colProd.descricao,  avista: parseCurrency(colProd.avista)  },
      base:     { codigo: baseProd.codigo, descricao: baseProd.descricao, avista: parseCurrency(baseProd.avista) },
      colInfo:  window.DICT_BOX.extrairInfo(colProd.descricao),
      baseInfo: window.DICT_BOX.extrairInfo(baseProd.descricao),
    };

    var mesclado = window.DICT_BOX.mesclar(pair);

    document.getElementById('codigo').value       = cod1 + '/' + cod2;
    document.getElementById('descricao').value    = mesclado.descricao;
    document.getElementById('subdescricao').value = mesclado.subdescricao;

    var av1 = parseCurrency(prod1.avista), av2 = parseCurrency(prod2.avista);
    document.getElementById('avista').value = formatCurrency((av1 + av2).toFixed(2));

    ocultarOverlay();
    setTimeout(function() { window.aplicarDicionarioAoCampos(); }, 100);
    showToast('success', 'Conj. Box detectado!',
      'Mesclado automaticamente como ' + mesclado.descricao);
    return;
  }

  // ── Mesclagem padrão ─────────────────────────────────────
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

// ── Fix 3: ver-json navigation com carregarViewVerJSON ───────
// Garante que ao navegar para ver-json os dados são carregados.
function _fixNavVerJson() {
  var btn = document.querySelector('[data-view="ver-json"]');
  if (!btn) return;
  btn.addEventListener('click', function() {
    setTimeout(function() {
      if (typeof carregarViewVerJSON === 'function') carregarViewVerJSON();
    }, 50);
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

  // Bugs estruturais
  _fixProductsActions();
  _fixDescricaoErro();
  _fixNavVerJson();

  // Pré-aquece os produtos em background
  setTimeout(function() { _garantirCache(); }, 3000);
});


// ═══════════════════════════════════════════════════════════════
// §10  DICIONÁRIO REMOTO — carregamento automático via GAS
// ─────────────────────────────────────────────────────────────
//
// O sistema carrega automaticamente um dicionário remoto do
// Google Apps Script e mescla com o nativo (sem substituir).
// Funciona offline — o dicionário nativo é sempre o fallback.
//
// ESTRUTURA ESPERADA DO ENDPOINT (doGet com action=dicionario):
//
//   {
//     "descricao": ["Berço", "Sofá"],          ← palavras protegidas
//     "marcas":    ["Marca1", "Marca2"],        ← movidas para subdesc.
//     "features":  ["Feature1", "Google TV"],   ← movidas para feat-1/2/3
//     "cores":     ["Roxo", "Turquesa"],        ← idem
//     "padroes":   ["\\b\\d+\\s*rpm\\b"]   ← regex de padrões numéricos
//   }
//
// CONFIGURAÇÃO:
//   • Se DICIONARIO_REMOTE_URL estiver vazio, o sistema deriva
//     automaticamente da API_URL adicionando &action=dicionario.
//   • Para usar URL própria: defina DICIONARIO_REMOTE_URL abaixo.
//   • Cache local (localStorage) com validade de 1 hora — permite
//     uso offline com termos da sessão anterior.
// ──────────────────────────────────────────────────────────────

/**
 * URL explícita do endpoint do dicionário remoto.
 * Deixe '' para derivar automaticamente do API_URL do sistema.
 * Exemplo: 'https://script.google.com/macros/s/SEU_ID/exec?action=dicionario'
 */
var DICIONARIO_REMOTE_URL = '';

/** Estado público do carregamento — consultável por outros módulos */
window.DICIONARIO_ESTADO = {
  carregado: false,   // true após sucesso
  offline:   false,   // true se falhou (usa somente nativo)
  cache:     false,   // true se veio do localStorage
  novos:     0,       // termos adicionados ao nativo nesta sessão
  fonte:     null,    // URL efetivamente utilizada
};

// ── Helpers internos ───────────────────────────────────────────

/** Deriva URL do dicionário a partir do API_URL global, se possível */
function _derivarURLDicionario() {
  // Só usa DICIONARIO_REMOTE_URL explícita — não deriva automaticamente do API_URL,
  // pois o endpoint de produtos não responde à action=dicionario.
  return DICIONARIO_REMOTE_URL || null;
}

/**
 * Cria ou atualiza o badge de status do dicionário remoto
 * no rodapé da sidebar. Invisível e discreto.
 * estados: 'carregando' | 'ok' | 'parcial' | 'offline'
 */
function _atualizarBadgeDicionario(estado, texto) {
  var BADGE_ID = 'dict-remote-status-badge';
  var badge = document.getElementById(BADGE_ID);

  if (!badge) {
    var footer = document.querySelector('.sidebar-footer');
    if (!footer) return;
    badge = document.createElement('div');
    badge.id = BADGE_ID;
    // Inserir antes do primeiro parágrafo de versão
    var firstP = footer.querySelector('p');
    footer.insertBefore(badge, firstP || null);
  }

  var icons = {
    carregando: 'fa-rotate fa-spin',
    ok:         'fa-book-open-reader',
    parcial:    'fa-book-open-reader',
    offline:    'fa-book',
  };

  // Usa data-estado para que o CSS (não o style inline) controle as cores —
  // assim dark mode funciona via seletor CSS sem precisar de !important frágil.
  badge.setAttribute('data-estado', estado);
  badge.style.cssText = [
    'display:flex;align-items:center;gap:5px;',
    'padding:4px 10px 4px 8px;border-radius:20px;',
    'margin-bottom:8px;cursor:default;',
    'font-size:10px;font-weight:600;line-height:1;',
    'transition:all .4s ease;user-select:none;',
  ].join('');

  badge.innerHTML = '<i class="fa-solid ' + (icons[estado] || 'fa-book') + '" style="font-size:9px;flex-shrink:0;"></i>'
    + '<span>' + texto + '</span>';
  badge.title = 'Dicionário remoto · ' + texto;
}

/**
 * Mescla os dados do GAS no dicionário ativo sem duplicatas (case-insensitive).
 * Retorna o número de termos novos adicionados.
 */
function _mesclarDicionario(dado) {
  var total = 0;
  var merge = function(ativo, novas) {
    if (!Array.isArray(novas)) return;
    novas.forEach(function(item) {
      if (!item) return;
      var existe = ativo.some(function(x) {
        return String(x).toLowerCase() === String(item).toLowerCase();
      });
      if (!existe) { ativo.push(item); total++; }
    });
  };
  merge(window.DICIONARIO.descricao, dado.descricao);
  merge(window.DICIONARIO.marcas,    dado.marcas);
  merge(window.DICIONARIO.features,  dado.features);
  merge(window.DICIONARIO.cores,     dado.cores);
  merge(window.DICIONARIO.padroes,   dado.padroes);
  return total;
}

// ── Função principal ───────────────────────────────────────────

/**
 * Carrega o dicionário remoto do GAS e mescla com o nativo.
 * Executa em background, sem bloquear a interface.
 * Fallback automático para cache localStorage (1h de validade).
 *
 * @param {string} [urlOverride] — sobrescreve DICIONARIO_REMOTE_URL
 */
async function carregarDicionarioRemoto(urlOverride) {
  var url = urlOverride || _derivarURLDicionario();

  if (!url) {
    // Sem URL configurada — dicionário nativo em uso, nenhum feedback visual
    console.info('[Dict] Sem URL de dicionário remoto configurada — usando apenas nativo.');
    return;
  }

  window.DICIONARIO_ESTADO.fonte = url;
  _atualizarBadgeDicionario('carregando', 'Sincronizando dict...');

  try {
    var ctrl = new AbortController();
    var tid  = setTimeout(function() { ctrl.abort(); }, 8000);
    var res  = await fetch(url, { signal: ctrl.signal, cache: 'no-cache' });
    clearTimeout(tid);

    if (!res.ok) throw new Error('HTTP ' + res.status);
    var dado = await res.json();

    // Validar: precisa de ao menos uma chave com dados
    var chaves = ['descricao', 'marcas', 'features', 'cores', 'padroes'];
    var temDados = chaves.some(function(k) {
      return Array.isArray(dado[k]) && dado[k].length > 0;
    });
    if (!temDados) throw new Error('Resposta sem dados de dicionário válidos');

    var novos = _mesclarDicionario(dado);

    // Salvar em cache local (validade: 1 hora)
    try {
      localStorage.setItem('dict_remote_cache', JSON.stringify({ ts: Date.now(), dados: dado }));
    } catch(e) { /* quota excedida ou modo privado */ }

    window.DICIONARIO_ESTADO.carregado = true;
    window.DICIONARIO_ESTADO.novos     = novos;

    if (novos > 0) {
      _atualizarBadgeDicionario('ok', 'Dict. +' + novos + ' termos');
      console.log('[Dict] Remoto mesclado: ' + novos + ' novo(s) termo(s).');
    } else {
      _atualizarBadgeDicionario('ok', 'Dict. em dia');
      console.log('[Dict] Remoto: nenhum termo novo (dicionário já atualizado).');
    }

  } catch(err) {
    window.DICIONARIO_ESTADO.offline = true;
    console.warn('[Dict] Remoto indisponível:', err.message);

    // Tentar cache local antes de desistir
    try {
      var cached = localStorage.getItem('dict_remote_cache');
      if (cached) {
        var obj   = JSON.parse(cached);
        var idade = (Date.now() - (obj.ts || 0)) / 60000; // minutos

        if (idade < 60 && obj.dados) {
          var novosCache = _mesclarDicionario(obj.dados);
          var min = Math.round(idade);
          window.DICIONARIO_ESTADO.cache = true;
          window.DICIONARIO_ESTADO.novos = novosCache;
          _atualizarBadgeDicionario('parcial', 'Dict. cache (' + min + 'min)');
          console.info('[Dict] Usando cache local (' + min + 'min atrás): '
            + novosCache + ' termo(s) carregado(s).');
          return;
        }
      }
    } catch(cacheErr) { /* localStorage indisponível */ }

    // Nem cache disponível — funciona apenas com o nativo
    _atualizarBadgeDicionario('offline', 'Dict. offline');
  }
}

// ── Auto-carregamento ──────────────────────────────────────────
// 1.5s de delay para não competir com a inicialização principal
// (produtos.json, session-guard, etc.) que já ocorre no DOMContentLoaded.
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(carregarDicionarioRemoto, 1500);
});

// ── Expor publicamente ─────────────────────────────────────────
window.carregarDicionarioRemoto = carregarDicionarioRemoto;
window.DICIONARIO_REMOTE_URL_get = function() { return _derivarURLDicionario(); };
