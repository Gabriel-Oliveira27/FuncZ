const API_URL =
  "https://script.googleusercontent.com/macros/echo?user_content_key=AehSKLic4iE63JAJ0j4KpGWfRFINeiD4uyCsMjfF_uLkUNzhOsJMzO4uiiZpWV3xzDjbduZK8kU_wWw3ZSCs6cODW2gdFnIGb6pZ0Lz0cBqMpiV-SBOJroENJHqO1XML_YRs_41KFfQOKEehUQmf-Xg6Xhh-bKiYpPxxwQhQzEMP5g0DdJHN4sgG_Fc9cdvRRU4abxlz_PzeQ_5eJ7NtCfxWuP-ET0DEzUyiWhWITlXMZKJMfwmZQg5--gKmAEGpwSr0yXi3eycr23BCGltlXGIWtYZ3I0WkWg&lib=M38uuBDbjNiNXY1lAK2DF9n3ltsPa6Ver";


let modeloAtual = "padrao";

// ==================================================
// GARANTIA ESTENDIDA — OFFSETS GLOBAIS POR MODELO
// ==================================================
let GARANTIA_OFFSETS = (() => {
  try {
    const s = localStorage.getItem('garantia_offsets');
    return s ? JSON.parse(s) : {};
  } catch { return {}; }
})();

function getGarantiaOffsets(posicao) {
  const def = { bottom: 0, top: 0, left: 0, right: 0 };
  return Object.assign({}, def, GARANTIA_OFFSETS[posicao] || {});
}

function salvarGarantiaOffsets(posicao, offsets) {
  GARANTIA_OFFSETS[posicao] = offsets;
  try { localStorage.setItem('garantia_offsets', JSON.stringify(GARANTIA_OFFSETS)); } catch {}
}

// Formata número sem prefixo R$ para os blanks do template físico
function fmtGeVal(val) {
  if (!val || isNaN(val)) return '0,00';
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val);
}

// Gera HTML do overlay de garantia estendida dentro do cartaz
function renderGarantiaOverlay(product) {
  const { garantia12, garantia24, garantia36, juros, metodo, posicaoGarantia } = product;
  if (!(garantia12 > 0) && !(garantia24 > 0) && !(garantia36 > 0)) return '';
  if (!juros) return '';

  const tipoTaxa = juros === 'carne' ? 'carne' : 'cartao';
  const numParcelas = parseInt((metodo || '12x').replace('x', '')) || 12;
  const fator = FATORES[tipoTaxa]?.[numParcelas];
  if (!fator) return '';

  const taxas = {
    carne:  { am: '6,9',  aa: '122,71' },
    cartao: { am: '2,92', aa: '41,25' },
  };
  const { am: tx1, aa: tx2 } = taxas[tipoTaxa];

  const calcTier = (valor) => {
    if (!(valor > 0)) return null;
    // Cálculo simples: valor × fator, arredondado em 2 casas decimais (sem arredondamento para ,90)
    const vrpcalc   = Math.round(valor * fator * 100) / 100;
    const vrtotpraz = Math.round(vrpcalc * numParcelas * 100) / 100;
    return { vrinput: valor, vrpcalc, vrtotpraz };
  };

  const tiers = [calcTier(garantia12), calcTier(garantia24), calcTier(garantia36)];
  const posicao = posicaoGarantia || 'hp';

  // Só injecta --ge-shift-y/x inline para "custom" (valores vêm do dialog do usuário).
  // Para hp / brother / hp-a5 / hp-a6 o CSS da classe já define os shifts — não sobrescrever.
  let inlineStyle = '';
  if (posicao === 'custom') {
    const off = getGarantiaOffsets('custom');
    const syPct = (((off.top || 0) - (off.bottom || 0)) / 29.7 * 100).toFixed(3);
    const sxPct = (((off.left || 0) - (off.right || 0)) / 21.0 * 100).toFixed(3);
    inlineStyle = ` style="--ge-shift-y:${syPct}%;--ge-shift-x:${sxPct}%;"`;
  }

  // Gera os 6 spans de um tier, com prefixo de classe por tier (g12/g24/g36)
  const tierHtml = (tier, prefix) => {
    if (!tier) return '';
    return `
      <span class="pgv ${prefix}-n">${numParcelas}</span>
      <span class="pgv ${prefix}-vrc">${fmtGeVal(tier.vrpcalc)}</span>
      <span class="pgv ${prefix}-vtp">${fmtGeVal(tier.vrtotpraz)}</span>
      <span class="pgv ${prefix}-vi">${fmtGeVal(tier.vrinput)}</span>
      <span class="pgv ${prefix}-tx1">${tx1}</span>
      <span class="pgv ${prefix}-tx2">${tx2}</span>`;
  };

  return `<div class="poster-ge poster-ge-${posicao}"${inlineStyle}>${
    tierHtml(tiers[0], 'g12')}${
    tierHtml(tiers[1], 'g24')}${
    tierHtml(tiers[2], 'g36')}
  </div>`;
}


// ==================================================
// DETECÇÃO DE DISPOSITIVO MÓVEL (VALIDAÇÃO INFINITA)
// ==================================================
function isMobileDevice() {
  const userAgent =
    navigator.userAgent || navigator.vendor || window.opera;
  const mobileRegex =
    /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
  const isTouchDevice =
    "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isSmallScreen = window.innerWidth <= 768;

  return (
    mobileRegex.test(userAgent.toLowerCase()) ||
    (isTouchDevice && isSmallScreen)
  );
}

// Validação infinita - executa SEMPRE que a página carrega
function validacaoInfinitaMobile() {
  if (isMobileDevice()) {
    

    // 1. Esconder TODO o conteúdo do cartazes
    esconderConteudoDesktop();

    // 2. Mostrar modal de aviso
    mostrarModalMobile();

    // 3. Criar botão de mobile no header (sempre visível)
    criarBotaoMobileHeader();
  }
}

// Esconder conteúdo desktop quando for mobile
function esconderConteudoDesktop() {
  const mainContent = document.getElementById("main-content");
  if (mainContent) {
    mainContent.style.display = "none";
  }

  // Adicionar classe ao body
  document.body.classList.add("mobile-detected");
}

// Mostrar modal para mobile (sempre que carregar)
function mostrarModalMobile() {
  const modal = document.getElementById("modal-mobile-warning");
  if (modal) {
    modal.style.display = "flex";
  }
}

// Criar botão de mobile no header
function criarBotaoMobileHeader() {
  // Verificar se já existe
  if (document.getElementById("btn-mobile-header")) {
    return;
  }

  const header =
    document.querySelector(".header-top") ||
    document.querySelector("header") ||
    document.body;

  const btnMobile = document.createElement("button");
  btnMobile.id = "btn-mobile-header";
  btnMobile.className = "btn-mobile-header";
  btnMobile.innerHTML =
    '<i class="fa-solid fa-mobile-screen-button"></i> Versão Mobile';
  btnMobile.onclick = irParaVersaoMobile;

  // Inserir no header
  if (
    header.classList &&
    header.classList.contains("header-top")
  ) {
    header.appendChild(btnMobile);
  } else {
    header.insertBefore(btnMobile, header.firstChild);
  }
}

function irParaVersaoMobile() {
  window.location.href = "../celular/mobile.html";
}

function fecharAvisoMobile() {
  document.getElementById(
    "modal-mobile-warning",
  ).style.display = "none";
  // Redirecionar para selectsetor.html
  window.location.href = "../selectsetor.html";
}

// Verificar a cada 2 segundos (validação contínua)
function iniciarValidacaoContinua() {
  setInterval(() => {
    if (isMobileDevice()) {
      const modal = document.getElementById(
        "modal-mobile-warning",
      );
      const mainContent =
        document.getElementById("main-content");

      // Garantir que o conteúdo está escondido
      if (mainContent && mainContent.style.display !== "none") {
        mainContent.style.display = "none";
      }

      // Garantir que tem o botão no header
      if (!document.getElementById("btn-mobile-header")) {
        criarBotaoMobileHeader();
      }
    }
  }, 2000);
}

// Verificar dispositivo ao carregar a página
window.addEventListener("DOMContentLoaded", () => {
  validacaoInfinitaMobile();
  iniciarValidacaoContinua();
});

// Verificar também ao redimensionar
window.addEventListener("resize", () => {
  validacaoInfinitaMobile();
});

// ==================================================
// SISTEMA DE PERMISSÕES E LOCALSTORAGE
// ==================================================

// Definir tipo de usuário (admin/suporte/usuario)
// Para teste, defina manualmente. Em produção, isso viria de autenticação
const TIPO_USUARIO = "admin"; // ou 'suporte' ou 'usuario'

// Validar se usuário tem permissão admin/suporte
function isAdminOuSuporte() {
  return TIPO_USUARIO === "admin" || TIPO_USUARIO === "suporte";
}

// Mostrar/ocultar aba Suporte baseado em permissão
if (isAdminOuSuporte()) {
  document.getElementById("suporte-section").style.display =
    "block";
}

// Timer de inatividade (30 minutos = 1800000ms)
let inactivityTimer;
const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutos

// Função para resetar o timer de inatividade
function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    limparSessao();
  }, INACTIVITY_TIMEOUT);
}

// Função para limpar sessão e localStorage
function limparSessao() {
  
  localStorage.clear();
  products = [];
  renderProducts();
  showToast(
    "info",
    "Sessão encerrada",
    "Seus dados foram limpos por inatividade.",
  );
}

// Eventos que resetam o timer de inatividade
[
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
].forEach((event) => {
  document.addEventListener(event, resetInactivityTimer, true);
});

// Iniciar timer ao carregar página
resetInactivityTimer();

// ==================================================
// FUNÇÕES DE LOCALSTORAGE PARA CARTAZES
// ==================================================

// Salvar cartazes no localStorage
function salvarCartazesLocalStorage() {
  try {
    // Determinar versão baseado no modelo dos cartazes
    const modeloAtualCartazes =
      products.length > 0
        ? products[0].modelo || "padrao"
        : "padrao";
    const versao =
      modeloAtualCartazes === "cameba" ? "1.1" : "1.0";

    const dadosCartazes = {
      versao: versao,
      dataGeracao: new Date().toISOString(),
      totalCartazes: products.length,
      cartazes: products.map((p) => ({
        id: p.id,
        codigo: p.codigo,
        descricao: p.descricao,
        subdescricao: p.subdescricao || "",
        features: p.features,
        metodo: p.metodo,
        juros: p.juros,
        avista: p.avista,
        parcela: p.parcela,
        motivo: p.motivo || "",
        validade: p.validade || "",
        validadeInicio: p.validadeInicio || "",
        autorizacao: p.autorizacao || "",
        garantia12: p.garantia12 || 0,
        garantia24: p.garantia24 || 0,
        garantia36: p.garantia36 || 0,
        modelo: p.modelo || "padrao",
        semJuros: p.semJuros || false,
        moverValidade: p.moverValidade || false,
        layoutPersonalizado: p.layoutPersonalizado || '',
        posicaoGarantia: p.posicaoGarantia || 'hp',
      })),
    };
    localStorage.setItem(
      "cartazes_salvos",
      JSON.stringify(dadosCartazes),
    );
   
  } catch (error) {
    console.error("❌ Erro ao salvar cartazes:", error);
    showToast(
      "error",
      "Erro ao salvar",
      "Não foi possível salvar os cartazes.",
    );
  }
}

// Carregar cartazes do localStorage
function carregarCartazesLocalStorage() {
  try {
    const dados = localStorage.getItem("cartazes_salvos");
    if (dados) {
      const parsed = JSON.parse(dados);
      return parsed;
    }
    return null;
  } catch (error) {
    console.error("❌ Erro ao carregar cartazes:", error);
    return null;
  }
}

// Gerar JSON para download
function gerarJSONCartazes() {
  if (products.length === 0) {
    showToast(
      "warning",
      "Nenhum cartaz",
      "Não há cartazes para gerar JSON.",
    );
    return;
  }

  const dadosCartazes = {
    versao: "1.0",
    dataGeracao: new Date().toISOString(),
    totalCartazes: products.length,
    cartazes: products.map((p) => ({
      id: p.id,
      codigo: p.codigo,
      descricao: p.descricao,
      subdescricao: p.subdescricao || "",
      features: p.features,
      metodo: p.metodo,
      juros: p.juros,
      avista: p.avista,
      parcela: p.parcela,
      motivo: p.motivo || "",
      validade: p.validade || "",
      validadeInicio: p.validadeInicio || "",
      autorizacao: p.autorizacao || "",
      garantia12: p.garantia12 || 0,
      garantia24: p.garantia24 || 0,
      garantia36: p.garantia36 || 0,
      semJuros: p.semJuros || false,
      moverValidade: p.moverValidade || false,
      layoutPersonalizado: p.layoutPersonalizado || '',
      posicaoGarantia: p.posicaoGarantia || 'hp',
    })),
  };

  // Criar blob e fazer download
  const jsonString = JSON.stringify(dadosCartazes, null, 2);
  const blob = new Blob([jsonString], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `cartazes_${new Date().toISOString().split("T")[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  showToast(
    "success",
    "JSON gerado!",
    `${products.length} cartazes exportados com sucesso.`,
  );
}

// Tabela de fatores para cálculo de parcelas
const FATORES = {
  carne: {
    1: 1.069,
    2: 0.5523,
    3: 0.3804,
    4: 0.2946,
    5: 0.2432,
    6: 0.2091,
    7: 0.1849,
    8: 0.1668,
    9: 0.1528,
    10: 0.1417,
    11: 0.1327,
    12: 0.1252,
  },
  cartao: {
    1: 1.0292,
    2: 0.522,
    3: 0.353,
    4: 0.2685,
    5: 0.2179,
    6: 0.1841,
    7: 0.16,
    8: 0.142,
    9: 0.128,
    10: 0.1168,
    11: 0.1076,
    12: 0.1,
  },
};

// Função para formatar número com separador de milhar
function formatarMilhar(numero) {
  return numero
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

let products = [];

// Variáveis globais para o modal de busca por texto
let todosProdutos = [];
let produtosFiltrados = [];
let paginaAtual = 1;
const itensPorPagina = 10;
let modoAgrupamento = "nenhum"; // 'nenhum', 'marca', 'codigo'

// ==================================================
// NAVEGAÇÃO
// ==================================================
const navButtons = document.querySelectorAll(".nav-item");
const views = {
  gerar: document.getElementById("view-gerar"),
  produtos: document.getElementById("view-produtos"),
  calculadora: document.getElementById("view-calculadora"),
};

navButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const viewName = btn.getAttribute("data-view");
    if (!viewName) return;

    // Atualiza botões ativos
    navButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");

    // Atualiza views ativas
    Object.values(views).forEach(
      (v) => v && v.classList.remove("active"),
    );
    if (views[viewName]) {
      views[viewName].classList.add("active");
    }

    // Atualiza header
    updateHeader(viewName);
    
    // Sincroniza switch ao voltar para aba "Gerar"
    if (viewName === "gerar") {
      const switchModelo = document.getElementById("switch-modelo");
      if (switchModelo) {
        switchModelo.checked = (modeloAtual === 'cameba');
      }
    }
  });
});

function updateHeader(viewName) {
  const subtitle = document.getElementById("header-subtitle");
  const subtitles = {
    gerar: "Preencha os dados do produto para criar o cartaz",
    produtos: `${products.length} produto(s) adicionado(s)`,
    calculadora:
      "Calcule o valor das parcelas com base no fator de multiplicação",
  };
  subtitle.textContent =
    subtitles[viewName] || "Bem-vindo ao sistema";
}

// ==================================================
// OVERLAY DE LOADING (funções legadas - mantidas por compatibilidade)
// ==================================================
function mostrarOverlay() {
  // Usa a função moderna por padrão
  mostrarOverlayBusca("Carregando", "Aguarde um momento...");
}

function esconderOverlay() {
  ocultarOverlay();
}

// ==================================================
// FUNÇÕES DO OVERLAY MODERNO
// ==================================================
function atualizarOverlayTexto(msg) {
  const textoEl = document.getElementById("overlay-texto");
  if (textoEl) textoEl.textContent = msg;
}

// Mostrar overlay em estado de busca
function mostrarOverlayBusca(
  texto = "Buscando informações",
  subtexto = "Aguarde um momento",
) {
  const overlay = document.getElementById("overlay");
  const textoEl = document.getElementById("overlay-texto");
  const subtextoEl = document.getElementById(
    "overlay-subtexto",
  );
  const iconEl = document.getElementById("overlay-icon");

  // Resetar classes
  overlay.className = "searching";
  overlay.classList.add("active");

  // Atualizar textos
  if (textoEl) textoEl.textContent = texto;
  if (subtextoEl) {
    subtextoEl.textContent = subtexto;
    subtextoEl.style.display = "block";
  }

  // Ocultar ícone durante busca
  if (iconEl) {
    iconEl.classList.remove("show", "success", "error");
    iconEl.innerHTML =
      '<i class="fa-solid fa-magnifying-glass"></i>';
  }
}

// Mostrar overlay de sucesso
function mostrarOverlaySucesso(
  texto = "Informações encontradas",
  subtexto = "Carregando dados...",
) {
  const overlay = document.getElementById("overlay");
  const textoEl = document.getElementById("overlay-texto");
  const subtextoEl = document.getElementById(
    "overlay-subtexto",
  );
  const iconEl = document.getElementById("overlay-icon");

  // Mudar para estado de sucesso
  overlay.className = "success";
  overlay.classList.add("active");

  // Atualizar textos
  if (textoEl) textoEl.textContent = texto;
  if (subtextoEl) {
    subtextoEl.textContent = subtexto;
    subtextoEl.style.display = "block";
  }

  // Mostrar ícone de sucesso
  if (iconEl) {
    iconEl.innerHTML =
      '<i class="fa-solid fa-circle-check"></i>';
    iconEl.classList.add("show", "success");
    iconEl.classList.remove("error");
  }
}

// Mostrar overlay de erro
function mostrarOverlayErro(
  texto = "Informações inexistentes",
  subtexto = "Produto não encontrado",
) {
  const overlay = document.getElementById("overlay");
  const textoEl = document.getElementById("overlay-texto");
  const subtextoEl = document.getElementById(
    "overlay-subtexto",
  );
  const iconEl = document.getElementById("overlay-icon");

  // Mudar para estado de erro
  overlay.className = "error";
  overlay.classList.add("active");

  // Atualizar textos
  if (textoEl) textoEl.textContent = texto;
  if (subtextoEl) {
    subtextoEl.textContent = subtexto;
    subtextoEl.style.display = "block";
  }

  // Mostrar ícone de erro
  if (iconEl) {
    iconEl.innerHTML =
      '<i class="fa-solid fa-circle-xmark"></i>';
    iconEl.classList.add("show", "error");
    iconEl.classList.remove("success");
  }
}

// Ocultar overlay
function ocultarOverlay() {
  const overlay = document.getElementById("overlay");
  if (overlay) {
    overlay.classList.remove(
      "active",
      "searching",
      "success",
      "error",
    );
  }
}

// ==================================================
// FORMATAÇÃO DE VALORES
// ==================================================
function formatCurrency(value) {
  if (!value) return "";
  let num = value.replace(/\D/g, "");
  num = (parseInt(num) / 100).toFixed(2);
  return num
    .replace(".", ",")
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function parseCurrency(value) {
  if (!value) return 0;
  let limpo = value
    .toString()
    .replace(/R\$/g, "")
    .replace(/\s+/g, "")
    .replace(/\u00A0/g, "")
    .replace(/[^\d,.-]/g, "");
  limpo = limpo.replace(/\.(?=\d{3}(,|$))/g, "");
  limpo = limpo.replace(",", ".");
  const numero = parseFloat(limpo);
  return isNaN(numero) ? 0 : numero;
}

function brl(n) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(+n || 0);
}

function arredondar90(valor) {
  const num = Number(valor);
  if (!isFinite(num) || num <= 0) return 0;
  const centavos = Math.floor(num * 100);
  const k = Math.floor((centavos - 90) / 100);
  const resultCentavos = Math.max(0, k * 100 + 90);
  return resultCentavos / 100;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatDateExtended(dateStr, inicioStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  const meses = [
    "janeiro",
    "fevereiro",
    "março",
    "abril",
    "maio",
    "junho",
    "julho",
    "agosto",
    "setembro",
    "outubro",
    "novembro",
    "dezembro",
  ];
  const mesNome = meses[parseInt(m) - 1];
  const diaFim  = parseInt(d);

  if (inicioStr) {
    const [iy, im, id] = inicioStr.split("-");
    const diaIni = parseInt(id);
    const mesIni = String(im).padStart(2, '0');
    const mesFim = String(m).padStart(2, '0');
    return `Oferta válida de ${diaIni}/${mesIni} até ${diaFim}/${mesFim}/${String(y).slice(-2)}`;
  }

  return `Oferta válida até ${diaFim} de ${mesNome} de ${y}`;
}

// Aplicar máscara de moeda nos inputs
const currencyInputs = [
  "avista",
  "calc-valor",
  "garantia12",
  "garantia24",
  "garantia36",
];
currencyInputs.forEach((id) => {
  const input = document.getElementById(id);
  if (input) {
    input.addEventListener("input", (e) => {
      e.target.value = formatCurrency(e.target.value);
    });
  }
});

// ==================================================
// VALIDAÇÃO E FORMATAÇÃO DO CAMPO CÓDIGO
// ==================================================
const codigoInput = document.getElementById("codigo");
codigoInput.addEventListener("input", (e) => {
  // Permitir apenas números e "/"
  let value = e.target.value;
  value = value.replace(/[^0-9/]/g, "");
  e.target.value = value;
});

// ==================================================
// BUSCA DE PRODUTO NA API
// ==================================================
const btnBuscar = document.getElementById("btn-buscar");
const inputCodigo = document.getElementById("codigo");

inputCodigo.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    btnBuscar.click();
  }
});

btnBuscar.addEventListener("click", async () => {
  const codigo = inputCodigo.value.trim();

  // ✅ SE NÃO HOUVER CÓDIGO, ABRE O MODAL DE BUSCA POR TEXTO
  if (!codigo) {
    abrirModalBuscaTexto();
    return;
  }

  // ✅ ETAPA 1: Buscando informações
  mostrarOverlayBusca(
    "Buscando informações",
    `Procurando produto código ${codigo}...`,
  );

  try {
    // 🔧 FIX: Adiciona timeout de 10 segundos para evitar travamento
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const resposta = await fetch(API_URL, { 
      signal: controller.signal,
      cache: 'no-cache'
    });
    clearTimeout(timeoutId);

    if (!resposta.ok) throw new Error("Erro ao acessar a API");

    const dados = await resposta.json();
    let encontrado = false;
    let primeiroItem = null;

    ["Gabriel", "Júlia", "Giovana"].forEach((nome) => {
      if (dados[nome]) {
        dados[nome].forEach((item) => {
          if (item.Código == codigo) {
            encontrado = true;
            if (!primeiroItem) primeiroItem = item;
          }
        });
      }
    });

    if (encontrado && primeiroItem) {
      // ✅ ETAPA 2: Informações encontradas
      mostrarOverlaySucesso(
        "Informações encontradas",
        "Preenchendo campos automaticamente...",
      );

      // Aguardar um pouco para mostrar o sucesso
      await new Promise((res) => setTimeout(res, 800));

      const partes = (primeiroItem.Descrição || "").split(
        " - ",
      );
      document.getElementById("descricao").value = (
        partes[0] || ""
      ).trim();
      // Marca vai para subdescricao automaticamente
      document.getElementById("subdescricao").value = (
        partes[1] || ""
      ).trim();

      const avistaValor = parseCurrency(
        primeiroItem["Total à vista"],
      );
      document.getElementById("avista").value = formatCurrency(
        avistaValor.toFixed(2),
      );

      if (primeiroItem["Tot. G.E 12"]) {
        document.getElementById("garantia12").value =
          formatCurrency(
            parseCurrency(primeiroItem["Tot. G.E 12"]).toFixed(
              2,
            ),
          );
      }

      await new Promise((res) => setTimeout(res, 600));
      showToast(
        "success",
        "Produto encontrado",
        "Dados preenchidos automaticamente.",
      );
    } else {
      // ✅ ETAPA 3: Informações inexistentes
      mostrarOverlayErro(
        "Informações inexistentes",
        `Código ${codigo} não encontrado`,
      );
      await new Promise((res) => setTimeout(res, 1500));
      showToast(
        "warning",
        "Produto não encontrado",
        "Código não cadastrado. Preencha manualmente.",
      );
    }
  } catch (e) {
    console.error(e);
    
    // 🔧 FIX: Mensagens de erro mais específicas
    let errorTitle = "Erro na busca";
    let errorMessage = "Não foi possível acessar o banco de dados";
    let toastMessage = "Verifique sua internet e tente novamente.";
    
    if (e.name === 'AbortError') {
      errorTitle = "Tempo esgotado";
      errorMessage = "A conexão demorou muito para responder";
      toastMessage = "O servidor está demorando. Tente novamente em alguns instantes.";
    } else if (e.message.includes('fetch')) {
      errorTitle = "Erro de conexão";
      errorMessage = "Não foi possível conectar ao servidor";
      toastMessage = "Verifique sua conexão com a internet.";
    }
    
    mostrarOverlayErro(errorTitle, errorMessage);
    await new Promise((res) => setTimeout(res, 1500));
    showToast("error", errorTitle, toastMessage);
  } finally {
    ocultarOverlay();
  }
});

// ==================================================
// VALIDAÇÃO E CÁLCULOS
// ==================================================
const descricaoInput = document.getElementById("descricao");
const descricaoErro = document.getElementById("descricao-erro");

if (descricaoInput) {
  descricaoInput.addEventListener("input", () => {
    const len = descricaoInput.value.length;
    if (len >= 38) {
      // Hard cap: trava em 38 caracteres
      descricaoInput.value = descricaoInput.value.substring(0, 38);
    }
    const lenAtual = descricaoInput.value.length;
    if (lenAtual > 35) {
      // Aviso visual: entre 36 e 38 (zona de alerta)
      if (descricaoErro) {
        descricaoErro.style.display = "block";
        descricaoErro.textContent = `${lenAtual}/38 — Atenção: descrição longa pode cortar no cartaz!`;
        descricaoErro.style.color = lenAtual >= 38 ? "var(--danger)" : "#d97706";
      }
      descricaoInput.style.borderColor = lenAtual >= 38 ? "var(--danger)" : "#f59e0b";
      descricaoInput.style.boxShadow = lenAtual >= 38
        ? "0 0 0 3px rgba(239,68,68,0.15)"
        : "0 0 0 3px rgba(245,158,11,0.15)";
    } else {
      if (descricaoErro) descricaoErro.style.display = "none";
      descricaoInput.style.borderColor = "";
      descricaoInput.style.boxShadow = "";
    }
  });
}

// Garantias
const garantiaCheckbox = document.getElementById("garantia");
const warrantyOptions = document.getElementById(
  "warranty-options",
);
const g12 = document.getElementById("garantia12");
const g24 = document.getElementById("garantia24");
const g36 = document.getElementById("garantia36");

garantiaCheckbox.addEventListener("change", (e) => {
  if (e.target.checked) {
    warrantyOptions.style.display = "grid";
    warrantyOptions.style.animation = 'slideDown 0.25s ease';
  } else {
    warrantyOptions.style.display = "none";
    g12.value = "";
    g24.value = "";
    g36.value = "";
    g24.disabled = true;
    g36.disabled = true;
  }
  // Atualiza visual da caixa
  const box = document.getElementById('warranty-box');
  if (box) box.classList.toggle('warranty-box-active', e.target.checked);
});

// Clicar em qualquer parte da caixa de garantia ativa/desativa o switch
window.toggleWarrantySection = function(e) {
  // Não interferir em cliques nos próprios inputs, labels ou no switch
  const tag = e.target.tagName.toUpperCase();
  if (tag === 'INPUT' || tag === 'LABEL' || tag === 'SPAN') return;
  if (e.target.closest('.switch')) return;
  if (e.target.closest('.warranty-options')) return;
  garantiaCheckbox.checked = !garantiaCheckbox.checked;
  garantiaCheckbox.dispatchEvent(new Event('change'));
};

g12.addEventListener("input", () => {
  if (parseCurrency(g12.value) > 0) {
    g24.disabled = false;
  } else {
    g24.value = "";
    g24.disabled = true;
    g36.value = "";
    g36.disabled = true;
  }
});

g24.addEventListener("input", () => {
  if (parseCurrency(g24.value) > 0) {
    g36.disabled = false;
  } else {
    g36.value = "";
    g36.disabled = true;
  }
});

// ==================================================
// CAMPOS EXTRAS CONDICIONAIS
// ==================================================
const jurosSelect = document.getElementById("juros");
const extrasContainer = document.getElementById("extra-campos");
const campoMotivo = document.getElementById("campo-motivo");
const campoValidade = document.getElementById("campo-validade");
const campoAutorizacao = document.getElementById(
  "campo-autorizacao",
);

jurosSelect.addEventListener("change", () => {
  const juros = jurosSelect.value;

  // Esconder todos primeiro
  extrasContainer.style.display = "none";
  campoMotivo.style.display = "none";
  campoValidade.style.display = "none";
  campoAutorizacao.style.display = "none";

  if (juros === "carne") {
    // Carnê: nenhum campo extra
    extrasContainer.style.display = "none";
  } else if (juros === "cartao") {
    // Cartão: mostra APENAS validade (sem motivo)
    extrasContainer.style.display = "block";
    campoValidade.style.display = "block";
  } else if (juros === "virado") {
    // Preço virado: mostra motivo + autorização
    extrasContainer.style.display = "block";
    campoMotivo.style.display = "block";
    campoAutorizacao.style.display = "block";
  }
});

// Cálculo automático de parcela com lógicas especiais por parcelamento
function recalcularParcela() {
  const metodo = document.getElementById("metodo").value;
  const juros = document.getElementById("juros").value;
  const avistaInput = document.getElementById("avista");
  const parcelaInput = document.getElementById("parcela");

  // Limpar readonly e remover tooltip
  parcelaInput.removeAttribute("readonly");
  avistaInput.removeAttribute("readonly");
  avistaInput.removeAttribute("disabled");

  // Remover tooltip se existir
  const formGroup = avistaInput.closest(".form-group");
  const existingTooltip = formGroup
    ? formGroup.querySelector(".tooltip-text")
    : null;
  if (existingTooltip) existingTooltip.remove();
  if (formGroup)
    formGroup.classList.remove("input-with-tooltip");

  if (!metodo || metodo === "") return;

  // LÓGICA PARA 1x: Mostrar apenas R$, não calcular nada
  if (metodo === "1x") {
    parcelaInput.value = "";
    return;
  }

  // LÓGICA PARA 3x, 5x, 10x: Taxa é OPCIONAL
  if (metodo === "3x" || metodo === "5x" || metodo === "10x") {
    const habilitarTaxaCheck = document.getElementById("habilitar-taxa-1x");
    const taxaAtiva = habilitarTaxaCheck && habilitarTaxaCheck.checked;

    if (taxaAtiva && juros && juros !== "") {
      // COM taxa: usar FATORES (igual 12x)
      const avista = parseCurrency(avistaInput.value);
      if (avista === 0) return;

      const numParcelas = parseInt(metodo.replace("x", ""));
      const tipoTaxa = juros === "carne" ? "carne" : "cartao";

      if (FATORES[tipoTaxa] && FATORES[tipoTaxa][numParcelas]) {
        const fator = FATORES[tipoTaxa][numParcelas];
        let parcela = avista * fator;
        parcela = arredondar90(parcela); // arredonda para o centavo ,90 mais próximo
        parcelaInput.value = parcela ? formatCurrency(parcela.toFixed(2)) : "";
      }
    } else {
      // SEM taxa: parcela = à vista / número de parcelas
      parcelaInput.setAttribute("readonly", "true");
      const avista = parseCurrency(avistaInput.value);
      if (avista === 0) {
        parcelaInput.value = "";
        return;
      }

      const numParcelas = parseInt(metodo.replace("x", ""));
      const parcela = Math.round((avista / numParcelas) * 100) / 100;
      parcelaInput.value = formatCurrency(parcela.toFixed(2));
    }
    return;
  }

  // LÓGICA PARA 12x: Cálculo com fator
  if (metodo === "12x") {
    if (!juros || juros === "") return;

    const avista = parseCurrency(avistaInput.value);
    if (avista === 0) return;

    const numParcelas = 12;
    let parcela = 0;

    const tipoTaxa = juros === "carne" ? "carne" : "cartao";

    if (FATORES[tipoTaxa] && FATORES[tipoTaxa][numParcelas]) {
      const fator = FATORES[tipoTaxa][numParcelas];
      parcela = avista * fator;
      parcela = arredondar90(parcela); // arredonda para o centavo ,90 mais próximo
    }

    parcelaInput.value = parcela
      ? formatCurrency(parcela.toFixed(2))
      : "";
  }
}

// Aplicar máscara também no campo parcela
const parcelaInput = document.getElementById("parcela");
parcelaInput.addEventListener("input", (e) => {
  e.target.value = formatCurrency(e.target.value);
});

document
  .getElementById("metodo")
  .addEventListener("change", recalcularParcela);
document
  .getElementById("juros")
  .addEventListener("change", recalcularParcela);
document
  .getElementById("avista")
  .addEventListener("input", () => {
    // Só recalcula se o campo NÃO estiver bloqueado
    const avistaInput = document.getElementById("avista");
    if (!avistaInput.hasAttribute("disabled")) {
      recalcularParcela();
    }
  });

// ==================================================
// ADICIONAR PRODUTO
// ==================================================
const productForm = document.getElementById("product-form");

productForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const codigo = document.getElementById("codigo").value.trim();
  const descricao = document
    .getElementById("descricao")
    .value.trim()
    .toUpperCase();
  const subdescricao = document
    .getElementById("subdescricao")
    .value.trim()
    .toUpperCase();
  const feature1 = document
    .getElementById("feature-1")
    .value.trim();
  const feature2 = document
    .getElementById("feature-2")
    .value.trim();
  const feature3 = document
    .getElementById("feature-3")
    .value.trim();
  const metodo = document.getElementById("metodo").value;
  const juros = document.getElementById("juros").value;
  const avista = parseCurrency(
    document.getElementById("avista").value,
  );
  const parcela = parseCurrency(
    document.getElementById("parcela").value,
  );

  const motivo = document.getElementById("motivo").value.trim();
  const validade = document
    .getElementById("validade")
    .value.trim();
  const validadeInicio = (document.getElementById("validade-inicio")?.value || "").trim();
  const autorizacao = document
    .getElementById("autorizacao")
    .value.trim();



  const g12Val = parseCurrency(
    document.getElementById("garantia12").value,
  );
  const g24Val = parseCurrency(
    document.getElementById("garantia24").value,
  );
  const g36Val = parseCurrency(
    document.getElementById("garantia36").value,
  );

  if (!codigo || !descricao) {
    showToast(
      "warning",
      "Campos obrigatórios",
      "Preencha código e descrição!",
    );
    return;
  }

  if (!metodo) {
    showToast(
      "warning",
      "Campos obrigatórios",
      "Selecione o parcelamento!",
    );
    return;
  }

  // Parcelamentos que permitem taxa opcional (1x, 3x, 5x, 10x)
  const metodoTaxaOpcional = ["1x", "3x", "5x", "10x"].includes(metodo);
  const habilitarTaxaCheckVal = document.getElementById("habilitar-taxa-1x");
  const taxaAtivaCheckVal = habilitarTaxaCheckVal && habilitarTaxaCheckVal.checked;

  // Para métodos com taxa opcional sem checkbox ativo, juros pode ser vazio
  if (!juros && !metodoTaxaOpcional) {
    showToast(
      "warning",
      "Campos obrigatórios",
      "Selecione parcelamento e taxa de juros!",
    );
    return;
  }

  // Para métodos com taxa opcional COM checkbox ativo, juros é obrigatório
  if (!juros && metodoTaxaOpcional && taxaAtivaCheckVal) {
    showToast(
      "warning",
      "Campos obrigatórios",
      "Selecione a taxa de juros!",
    );
    return;
  }

  if (avista <= 0) {
    showToast(
      "warning",
      "Valor inválido",
      "Informe o valor à vista!",
    );
    return;
  }

  // Para métodos com taxa obrigatória (12x), parcela é obrigatória
  if (parcela <= 0 && !metodoTaxaOpcional) {
    showToast(
      "warning",
      "Valor inválido",
      "Informe o valor da parcela!",
    );
    return;
  }

  // Para métodos com taxa opcional COM taxa ativa, parcela é obrigatória
  if (parcela <= 0 && metodoTaxaOpcional && taxaAtivaCheckVal) {
    showToast(
      "warning",
      "Valor inválido",
      "Informe o valor da parcela!",
    );
    return;
  }

  // Capturar estado do checkbox "Sem juros!"
  const semJurosCheck = document.getElementById("mostrar-sem-juros");
  const semJuros = semJurosCheck ? semJurosCheck.checked : false;

  const features = [feature1, feature2, feature3].filter(
    (f) => f !== "",
  );

  // VALIDAÇÃO OBRIGATÓRIA DE CARACTERÍSTICAS
  if (features.length === 0) {
    showSearchToast(descricao);
    return;
  }

  // VALIDAÇÃO: Não permitir misturar modelos diferentes
  if (products.length > 0) {
    const primeiroModelo = products[0].modelo || "padrao";
    if (primeiroModelo !== modeloAtual) {
      const modeloAtualNome =
        modeloAtual === "cameba" ? "Cameba" : "Padrão";
      const primeiroModeloNome =
        primeiroModelo === "cameba" ? "Cameba" : "Padrão";
      showToast(
        "error",
        "Modelos diferentes",
        `Não é possível adicionar cartazes de modelos diferentes no mesmo PDF. Os cartazes já adicionados são do modelo ${primeiroModeloNome}.`,
      );
      return;
    }
  }

  // Para parcelamentos com taxa opcional sem taxa ativa
  let parcelaFinal = parcela;
  let jurosFinal = juros;
  const habilitarTaxaCheckFinal = document.getElementById("habilitar-taxa-1x");
  const taxaAtivaFinal = habilitarTaxaCheckFinal && habilitarTaxaCheckFinal.checked;

  if (metodo === "1x" && !taxaAtivaFinal) {
    // 1x sem taxa: valor à vista é o preço grande, parcela = avista, juros vazio
    parcelaFinal = avista;
    jurosFinal = "";
  } else if (["3x", "5x", "10x"].includes(metodo) && !taxaAtivaFinal) {
    // 3x/5x/10x sem taxa: parcela = à vista / número de parcelas
    const numParcelas = parseInt(metodo.replace("x", ""));
    parcelaFinal = Math.round((avista / numParcelas) * 100) / 100;
    jurosFinal = "";
  }

  const product = {
    id: Date.now(),
    codigo,
    descricao,
    subdescricao,
    features,
    metodo,
    juros: jurosFinal,
    avista,
    parcela: parcelaFinal,
    motivo,
    validade,
    validadeInicio,
    autorizacao,
    garantia12: g12Val,
    garantia24: g24Val,
    garantia36: g36Val,
    modelo: modeloAtual, // Adiciona o modelo selecionado
    semJuros: semJuros,  // Controla exibição de "Sem juros!" no rodapé
    moverValidade: false, // Padrão: validade lateral; toggle no card da preview
    layoutPersonalizado: '', // Layout customizado (ex: 'a5-loja53')
    posicaoGarantia: 'hp', // Posição da GE no template físico (hp/brother/custom)
  };

  products.push(product);
  salvarCartazesLocalStorage(); // Salvar no localStorage
  renderProducts();

  showToast(
    "success",
    "Produto adicionado!",
    `${descricao} foi adicionado com sucesso.`,
  );

  // Resetar formulário
  productForm.reset();
  warrantyOptions.style.display = "none";
  garantiaCheckbox.checked = false;
  g24.disabled = true;
  g36.disabled = true;
  extrasContainer.style.display = "none";

  // Resetar campos de 1x (juros e parcela voltam a ficar habilitados)
  const jurosSelectReset = document.getElementById("juros");
  const parcelaInputReset = document.getElementById("parcela");
  const checkboxTaxa1xReset = document.getElementById("checkbox-taxa-1x");
  const habilitarTaxa1xReset = document.getElementById("habilitar-taxa-1x");
  if (jurosSelectReset) {
    jurosSelectReset.disabled = false;
    jurosSelectReset.setAttribute("required", "required");
  }
  if (parcelaInputReset) {
    parcelaInputReset.disabled = false;
    parcelaInputReset.removeAttribute("readonly");
  }
  if (checkboxTaxa1xReset) checkboxTaxa1xReset.style.display = "none";
  if (habilitarTaxa1xReset) habilitarTaxa1xReset.checked = false;
  // Resetar "Sem juros!" e esconder checkbox
  const semJurosCheckReset = document.getElementById("mostrar-sem-juros");
  if (semJurosCheckReset) semJurosCheckReset.checked = false;
  const checkboxSemJurosReset = document.getElementById("checkbox-sem-juros");
  if (checkboxSemJurosReset) checkboxSemJurosReset.style.display = "none";

  // Mudar para view de produtos
  navButtons[1].click();
});

// ==================================================
// RENDERIZAR PRODUTOS
// ==================================================
function renderProducts() {
  const productsList = document.getElementById("products-list");
  const productsCount =
    document.getElementById("products-count");
  const btnGerarPDF = document.getElementById("btn-gerar-pdf");

  if (products.length === 0) {
    productsList.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
                </svg>
                <h3>Nenhum produto adicionado</h3>
                <p>Adicione produtos usando o formulário para começar</p>
            </div>
        `;
    btnGerarPDF.style.display = "none";
    productsCount.textContent = "0 produto(s) adicionado(s)";
    updateHeader("produtos");
    
    // Resetar switch quando não há produtos
    const switchModelo = document.getElementById("switch-modelo");
    if (switchModelo) {
      switchModelo.checked = (modeloAtual === 'cameba');
    }
    
    return;
  }

  productsCount.textContent = `${products.length} produto(s) adicionado(s)`;
  btnGerarPDF.style.display = "inline-flex";
  updateHeader("produtos");
  
  // Sincronizar switch com o modelo dos cartazes
  const switchModelo = document.getElementById("switch-modelo");
  if (switchModelo && products.length > 0) {
    const modeloDosCartazes = products[0].modelo || 'padrao';
    switchModelo.checked = (modeloDosCartazes === 'cameba');
    modeloAtual = modeloDosCartazes;
  }

  productsList.innerHTML = products
    .map((product) => {
      const featuresText = product.features.join(" | ");
      const jurosText =
        product.juros === "carne"
          ? "Carnê"
          : product.juros === "cartao"
            ? "Cartão"
            : "Preço virado";

      const modeloBadge =
        product.modelo === "cameba"
          ? `<span class="modelo-badge modelo-badge-cameba">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style="margin-right: 4px;">
                    <path d="M7 13c1.66 0 3-1.34 3-3S8.66 7 7 7s-3 1.34-3 3 1.34 3 3 3zm12-6h-8v7H3V7H1v10h22V7z"/>
                    <path d="M20 10h-7v7h7v-7z"/>
                </svg>
                Cameba
            </span>`
          : "";

      return `
            <div class="product-card">
                <div class="product-info">
                    <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 4px;">
                        <h3 style="margin: 0;">${product.descricao}</h3>
                        ${modeloBadge}
                    </div>
                    ${product.subdescricao ? `<p style="font-style: italic; color: #666; margin-top: 0;">${product.subdescricao}</p>` : ""}
                    <p>Código: ${product.codigo}</p>
                    ${
                      featuresText
                        ? `
                        <div class="product-features">
                            ${product.features.map((f) => `<span class="feature-tag">${f}</span>`).join("")}
                        </div>
                    `
                        : ""
                    }
                    <div class="product-details">
                        <div class="product-detail">
                            <span>Parcelamento</span>
                            <strong>${product.metodo}</strong>
                        </div>
                        <div class="product-detail">
                            <span>Valor à vista</span>
                            <strong>${brl(product.avista)}</strong>
                        </div>
                        <div class="product-detail">
                            <span>Parcela</span>
                            <strong>${brl(product.parcela)}</strong>
                        </div>
                        <div class="product-detail">
                            <span>Taxa</span>
                            <strong>${jurosText}</strong>
                        </div>
                    </div>
                </div>
                <div>
                    <div class="product-preview" data-preview-id="${product.id}" onclick="showPreview(${product.id})">
                        ${generatePosterHTML(product, true)}
                    </div>
                    ${product.validade ? `
                    <label class="chk-mover-validade-label" onclick="event.stopPropagation()">
                        <input type="checkbox"
                            onchange="toggleMoverValidade(${product.id}, this.checked)"
                            ${product.moverValidade ? 'checked' : ''}>
                        <span>Mover validade</span>
                    </label>` : ''}
                    <div style="display: flex; align-items: center; gap: 8px; margin-top: 12px;">
                        <select class="select-layout-personalizado${product.layoutPersonalizado ? ' layout-ativo' : ''}"
                            onchange="alterarLayoutPersonalizado(${product.id}, this.value)"
                            onclick="event.stopPropagation()">
                            <option value="">Padrão</option>
                            <option value="a5-loja53" ${product.layoutPersonalizado === 'a5-loja53' ? 'selected' : ''}>A5 - Config</option>
                            <option value="a5-loja53-novo" ${product.layoutPersonalizado === 'a5-loja53-novo' ? 'selected' : ''}>A5 - Loja 53 (novo)</option>
                        </select>
                        <button class="btn-delete" style="margin-top: 0;" onclick="deleteProduct(${product.id})">
                            <i class="fa-solid fa-trash"></i> Remover
                        </button>
                    </div>
                    ${(product.garantia12 > 0 || product.garantia24 > 0 || product.garantia36 > 0) ? `
                    <div id="ge-sel-row-${product.id}" class="ge-sel-row" onclick="event.stopPropagation()">
                        <i class="fa-solid fa-shield-halved ge-sel-icon"></i>
                        <span class="ge-sel-label">Posição GE:</span>
                        <select class="select-posicao-garantia${product.posicaoGarantia && product.posicaoGarantia !== 'hp' ? ' posicao-ativa' : ''}"
                            onchange="alterarPosicaoGarantia(${product.id}, this.value)"
                            onclick="event.stopPropagation()">
                            <option value="hp"      ${!product.posicaoGarantia || product.posicaoGarantia === 'hp'      ? 'selected' : ''}>HP (padrão)</option>
                            <option value="brother" ${product.posicaoGarantia === 'brother' ? 'selected' : ''}>Brother</option>
                            <option value="hp-a5"   ${product.posicaoGarantia === 'hp-a5'   ? 'selected' : ''}>HP - A5</option>
                            <option value="hp-a6"   ${product.posicaoGarantia === 'hp-a6'   ? 'selected' : ''}>HP - A6</option>
                            <option value="custom"  ${product.posicaoGarantia === 'custom'  ? 'selected' : ''}>Custom</option>
                        </select>
                        ${product.posicaoGarantia === 'custom' ? `
                        <button class="ge-calib-btn" title="Editar posição Custom"
                            onclick="abrirDialogCustomGE(${product.id})">
                            <i class="fa-solid fa-ruler"></i>
                        </button>` : ''}
                    </div>` : ''}
                </div>
            </div>
        `;
    })
    .join("");
}

// ==================================================
// GERAÇÃO DE CARTAZ HTML
// ==================================================
function generatePosterHTML(product, isPreview = false) {
  const featuresText = product.features.join(" | ");

  // Calcular valor total
  const numParcelas = parseInt(product.metodo.replace("x", ""));
  const valorTotal = product.parcela * numParcelas;

  // Separar parte inteira e decimal do valor da parcela
  const parcelaInteiro = Math.floor(product.parcela);
  const parcelaCentavos = Math.round(
    (product.parcela - parcelaInteiro) * 100,
  );

  const jurosTexto = {
    carne: "6,9% a.m e 122,71% a.a",
    cartao: "2,92% a.m e 41,25% a.a",
    virado: "2,92% a.m e 41,25% a.a",
  };

  // Determinar texto de parcelamento e taxa
  let tipoParcelamento =
    product.juros === "carne" ? "carnê" : "cartão";
  let taxaTexto = jurosTexto[product.juros];

  // Classe especial para carnê
  const posterClass =
    product.juros === "carne"
      ? "poster poster-carne"
      : "poster";

  // Lógica especial para parcelamentos sem juros (apenas quando TEM taxa aplicada)
    if (product.juros === 'carne') {
        taxaTexto = '6,9% a.m e 122,71% a.a';
    } else if (product.juros === 'cartao') {
        taxaTexto = '2,92% a.m e 41,25% a.a';
    } else {
        taxaTexto = 'Sem juros';
    }

  // Lógica especial para 1x
  let mostrar1xComTaxa = false;
  if (product.metodo === "1x" && product.juros && product.juros !== "") {
    // Se for 1x E tiver taxa selecionada (checkbox ativo)
    mostrar1xComTaxa = true;
  }

  // Lógica para 3x/5x/10x sem taxa (juros vazio)
  const semTaxaNx = ["3x", "5x", "10x"].includes(product.metodo) && (!product.juros || product.juros === "");

  // Validade por extenso
  const validadeExtensa = product.validade
    ? formatDateExtended(product.validade, product.validadeInicio || '')
    : "";

  // Calcular tamanho da fonte baseado no número de dígitos
  const numDigitosParcela = String(parcelaInteiro).length;
  let fontSizeParcela = "240pt"; // Padrão para 1-2 dígitos (100%)
  if (numDigitosParcela === 3) {
    fontSizeParcela = "165pt";
  } else if (numDigitosParcela >= 4) {
    fontSizeParcela = "150pt"; // 68% de 240pt — edite este valor se o tamanho não ficar bom
  }

  // Para 1x, calcular tamanho da fonte do valor à vista
  const avistaInteiro = Math.floor(product.avista);
  const numDigitosAvista = String(avistaInteiro).length;
  let fontSizeAvista = "240pt";
  if (numDigitosAvista === 3) {
    fontSizeAvista = "210pt";
  } else if (numDigitosAvista >= 4) {
    fontSizeAvista = "180pt";
  }

  // Determinar conteúdo da seção de pagamento (lado esquerdo do rodapé)
  let paymentInfoSection = '';
  if (mostrar1xComTaxa || (product.metodo !== "1x" && !semTaxaNx)) {
    // Com taxa aplicada (12x, ou 1x/3x/5x/10x com taxa ativa)
    if (product.semJuros) {
      paymentInfoSection = `<div class="poster-payment-info"><div class="poster-payment-type" style="font-family: var(--font-lato); font-weight: 400; font-size: 20pt; line-height: 1.2;">Sem juros!</div></div>`;
    } else {
      paymentInfoSection = `<div class="poster-payment-info"><div class="poster-payment-type">no ${tipoParcelamento}</div><div class="poster-payment-rate">${taxaTexto}</div></div>`;
    }
  } else if (semTaxaNx && product.semJuros) {
    // 3x/5x/10x sem taxa mas com "Sem juros!" marcado
    paymentInfoSection = `<div class="poster-payment-info"><div class="poster-payment-type" style="font-family: var(--font-lato); font-weight: 400; font-size: 20pt; line-height: 1.2;">Sem juros!</div></div>`;
  }

  // Classe adicional para modelo cameba
  const modeloClass =
    product.modelo === "cameba" ? "poster-cameba" : "";
  const finalClasses = `${posterClass} ${modeloClass}`.trim();

  // data-digits no elemento raiz permite CSS condicional por dígitos em filhos distintos (price-section e footer-table)
  const digitsAttr = product.metodo !== "1x" ? numDigitosParcela : numDigitosAvista;

  let posterHTML = `
        <div class="${finalClasses}" data-digits="${digitsAttr}">
            <div class="poster-header">
                <div class="poster-title">${product.descricao}</div>
                ${product.subdescricao ? `<div class="poster-subtitle">${product.subdescricao}</div>` : ""}
                ${featuresText ? `<div class="poster-features">${featuresText}</div>` : ""}
                <div class="poster-code">${product.codigo}</div>
            </div>
            
            ${
              product.metodo !== "1x"
                ? `
            <div class="poster-price-section">
                <div class="poster-left-section">
                    <div class="poster-installment">${product.metodo}</div>
                    <div class="poster-currency">R$</div>
                </div>
                <div class="poster-value-container" data-digits="${numDigitosParcela}">
                    <div class="poster-value-integer" style="font-size: ${fontSizeParcela};">${formatarMilhar(parcelaInteiro)}</div>
                    <div class="poster-value-decimal">,${String(parcelaCentavos).padStart(2, "0")}</div>
                </div>
            </div>
            `
                : `
            <div class="poster-price-section">
                <div class="poster-left-section">
                    <div class="poster-currency">R$</div>
                </div>
                <div class="poster-value-container" data-digits="${numDigitosAvista}">
                    <div class="poster-value-integer" style="font-size: ${fontSizeAvista};">${formatarMilhar(avistaInteiro)}</div>
                    <div class="poster-value-decimal">,${String(Math.round((product.avista - Math.floor(product.avista)) * 100)).padStart(2, "0")}</div>
                </div>
            </div>
            `
            }
            
            ${validadeExtensa ? `<div class="poster-validity${product.moverValidade ? ' poster-validity-baixo' : ''}">${validadeExtensa}</div>` : ""}
            
            <div class="poster-footer-table">
                <div class="poster-table-left" ${product.semJuros ? 'style="align-items: center;"' : ''}>
                    <div class="poster-price-line" ${product.semJuros ? 'style="width: 100%; justify-content: center;"' : ''}>
                        ${product.semJuros
                          ? `<div class="poster-table-main-text" style="font-family: var(--font-lato); font-weight: 400; font-size: 20pt; line-height: 1.2; text-align: center;">Sem juros!</div>`
                          : (product.metodo === "1x" && !mostrar1xComTaxa
                              ? ''
                              : `<div class="poster-table-main-text">= ${brl(valorTotal)}</div>${paymentInfoSection}`)
                        }
                    </div>
                    ${product.motivo ? `<div class="poster-table-sub-text" style="margin-top: 8px; font-weight: 700;">${product.motivo}</div>` : ""}
                </div>
                <div class="poster-table-right">
                    <div class="poster-table-main-text" style="font-family: var(--font-lato);">${brl(product.avista)} À VISTA</div>
                    ${product.autorizacao ? `<div class="poster-table-sub-text" style="margin-top: 8px;">${product.autorizacao}</div>` : ""}
                </div>
            </div>

            ${renderGarantiaOverlay(product)}
        </div>
    `;

  // Se tiver layout personalizado, envolver o poster no wrapper correspondente
  if (product.layoutPersonalizado === 'a5-loja53') {
    posterHTML = `<div class="poster-wrapper-a5loja53">${posterHTML}</div>`;
  } else if (product.layoutPersonalizado === 'a5-loja53-novo') {
    posterHTML = `<div class="poster-wrapper-a5loja53novo">${posterHTML}</div>`;
  }

  return posterHTML;
}

// ==================================================
// FUNÇÕES GLOBAIS
// ==================================================
window.deleteProduct = function (id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;

  showConfirm({
    title: "Remover produto",
    subtitle: "O produto será removido da lista",
    message: `Tem certeza que deseja remover "${product.descricao}"?`,
    confirmText: "Remover",
    onConfirm: () => {
      const deletedProduct = { ...product };
      const deletedIndex = products.findIndex(
        (p) => p.id === id,
      );

      products = products.filter((p) => p.id !== id);
      salvarCartazesLocalStorage(); // Atualizar localStorage
      renderProducts();

      // Mostrar toast com opção de desfazer
      showUndoToast(
        "Produto removido!",
        "O produto foi removido da lista.",
        () => {
          // Restaurar produto na mesma posição
          products.splice(deletedIndex, 0, deletedProduct);
          salvarCartazesLocalStorage(); // Atualizar localStorage
          renderProducts();
          showToast(
            "success",
            "Produto restaurado!",
            "O produto foi adicionado novamente à lista.",
          );
        },
      );
    },
  });
};

window.showPreview = function (id) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  showToast(
    "info",
    "Visualização",
    'Clique em "Gerar PDF" para visualizar o cartaz completo.',
  );
};

// Alterar layout personalizado de um produto
window.alterarLayoutPersonalizado = function (id, valor) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  product.layoutPersonalizado = valor || '';
  salvarCartazesLocalStorage();
  // Atualiza só o miniatura deste card
  const previewEl = document.querySelector(`.product-preview[data-preview-id="${id}"]`);
  if (previewEl) {
    previewEl.innerHTML = generatePosterHTML(product, true);
  }
  // Atualizar classe do select
  const card = previewEl ? previewEl.closest('.product-card') : null;
  if (card) {
    const sel = card.querySelector('.select-layout-personalizado');
    if (sel) {
      sel.classList.toggle('layout-ativo', !!valor);
    }
  }
};

// Toggle "Mover validade" diretamente no card — atualiza só o preview afetado
window.toggleMoverValidade = function (id, checked) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  product.moverValidade = checked;
  salvarCartazesLocalStorage();
  const previewEl = document.querySelector(`.product-preview[data-preview-id="${id}"]`);
  if (previewEl) {
    previewEl.innerHTML = generatePosterHTML(product, true);
  }
};

// ==================================================
// GARANTIA ESTENDIDA — FUNÇÕES DE POSIÇÃO E CALIBRAÇÃO
// ==================================================
window.alterarPosicaoGarantia = function (id, valor) {
  const product = products.find((p) => p.id === id);
  if (!product) return;
  product.posicaoGarantia = valor || 'hp';
  salvarCartazesLocalStorage();
  const previewEl = document.querySelector(`.product-preview[data-preview-id="${id}"]`);
  if (previewEl) previewEl.innerHTML = generatePosterHTML(product, true);
  const card = previewEl ? previewEl.closest('.product-card') : null;
  if (card) {
    const sel = card.querySelector('.select-posicao-garantia');
    if (sel) sel.classList.toggle('posicao-ativa', valor !== 'hp');
    // Mostrar/ocultar botão de régua (só para Custom)
    const row = document.getElementById(`ge-sel-row-${id}`);
    if (row) {
      let btn = row.querySelector('.ge-calib-btn');
      if (valor === 'custom') {
        if (!btn) {
          btn = document.createElement('button');
          btn.className = 'ge-calib-btn';
          btn.title = 'Editar posição Custom';
          btn.innerHTML = '<i class="fa-solid fa-ruler"></i>';
          btn.onclick = (e) => { e.stopPropagation(); abrirDialogCustomGE(id); };
          row.appendChild(btn);
        }
        // Auto-abre o dialog na primeira seleção de Custom
        abrirDialogCustomGE(id);
      } else {
        if (btn) btn.remove();
      }
    }
  }
};

// ==================================================
// GARANTIA ESTENDIDA — DIALOG CUSTOM (posicionamento em cm)
// ==================================================

window.abrirDialogCustomGE = function (id) {
  // Fechar qualquer dialog existente
  const existing = document.getElementById('modal-ge-custom');
  if (existing) existing.remove();

  const off = getGarantiaOffsets('custom');

  const overlay = document.createElement('div');
  overlay.id = 'modal-ge-custom';
  overlay.className = 'modal-overlay active';
  overlay.style.zIndex = '10010';
  overlay.onclick = (e) => { if (e.target === overlay) fecharDialogCustomGE(); };

  overlay.innerHTML = `
    <div class="modal-fator-content" style="max-width:520px;">
      <div class="modal-header" style="background:linear-gradient(135deg,#065f46 0%,#059669 100%);color:white;">
        <h2 style="color:white;"><i class="fa-solid fa-ruler"></i>&nbsp;Posicionamento Custom da GE</h2>
        <button class="modal-close" style="color:white;font-size:28px;" onclick="fecharDialogCustomGE()">×</button>
      </div>
      <div class="modal-body">
        <div style="background:#fef3c7;border-left:4px solid #f59e0b;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
          <p style="font-size:14px;font-weight:600;color:#92400e;margin-bottom:6px;">
            <i class="fa-solid fa-triangle-exclamation"></i>&nbsp;Como usar
          </p>
          <p style="font-size:13px;color:#78350f;line-height:1.5;">
            Imprima um cartaz de teste e use uma <strong>régua</strong> para medir a distância entre
            onde os valores aparecerem e onde deveriam estar nas linhas do papel físico.
            Insira os ajustes em <strong>cm</strong> abaixo. Os três módulos (+1/+2/+3 anos) serão
            deslocados juntos.
          </p>
          <p style="font-size:12px;color:#92400e;margin-top:8px;">
            Referência: 1&nbsp;cm vertical&nbsp;≈&nbsp;3,37% &nbsp;|&nbsp; 1&nbsp;cm horizontal&nbsp;≈&nbsp;4,76%
          </p>
        </div>
        <div class="ge-calib-grid">
          <label class="ge-calib-field">
            <span>↑ Subir (cm)</span>
            <input type="number" step="0.05" id="ge-cust-top"    value="${off.top    || 0}" placeholder="0.00">
          </label>
          <label class="ge-calib-field">
            <span>↓ Descer (cm)</span>
            <input type="number" step="0.05" id="ge-cust-bottom" value="${off.bottom || 0}" placeholder="0.00">
          </label>
          <label class="ge-calib-field">
            <span>← Esquerda (cm)</span>
            <input type="number" step="0.05" id="ge-cust-left"   value="${off.left   || 0}" placeholder="0.00">
          </label>
          <label class="ge-calib-field">
            <span>→ Direita (cm)</span>
            <input type="number" step="0.05" id="ge-cust-right"  value="${off.right  || 0}" placeholder="0.00">
          </label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn-secondary" onclick="fecharDialogCustomGE()">
          <i class="fa-solid fa-times"></i> Cancelar
        </button>
        <button class="btn-secondary" onclick="resetarCustomGE()">
          <i class="fa-solid fa-rotate-left"></i> Resetar
        </button>
        <button class="btn-primary" onclick="aplicarCustomGE()">
          <i class="fa-solid fa-check"></i> Aplicar em todos
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
};

window.fecharDialogCustomGE = function () {
  const m = document.getElementById('modal-ge-custom');
  if (m) m.remove();
};

window.aplicarCustomGE = function () {
  const top    = parseFloat(document.getElementById('ge-cust-top')?.value)    || 0;
  const bottom = parseFloat(document.getElementById('ge-cust-bottom')?.value) || 0;
  const left   = parseFloat(document.getElementById('ge-cust-left')?.value)   || 0;
  const right  = parseFloat(document.getElementById('ge-cust-right')?.value)  || 0;

  // Salva em cm; renderGarantiaOverlay converte para % ao gerar o HTML
  salvarGarantiaOffsets('custom', { top, bottom, left, right });

  // Re-renderiza todos os cartazes com posição custom
  products.forEach((p) => {
    if ((p.posicaoGarantia || 'hp') === 'custom') {
      const previewEl = document.querySelector(`.product-preview[data-preview-id="${p.id}"]`);
      if (previewEl) previewEl.innerHTML = generatePosterHTML(p, true);
    }
  });

  fecharDialogCustomGE();
  showToast('success', 'Posição Custom aplicada!',
    'Todos os cartazes Custom foram atualizados.');
};

window.resetarCustomGE = function () {
  ['ge-cust-top','ge-cust-bottom','ge-cust-left','ge-cust-right'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '0';
  });
};

// ==================================================
// LIMPAR TODOS OS PRODUTOS
// ==================================================
document
  .getElementById("btn-limpar-todos")
  .addEventListener("click", () => {
    if (products.length === 0) {
      showToast(
        "info",
        "Lista vazia",
        "Não há produtos para remover.",
      );
      return;
    }

    showConfirm({
      title: "Limpar todos os produtos",
      subtitle: "Esta ação não pode ser desfeita",
      message: `Tem certeza que deseja remover todos os ${products.length} produtos da lista?`,
      confirmText: "Sim, limpar tudo",
      onConfirm: () => {
        products = [];
        salvarCartazesLocalStorage();
        renderProducts();
        showToast(
          "success",
          "Lista limpa!",
          "Todos os produtos foram removidos.",
        );
      },
    });
  });

// ==================================================
// GERAR PDF COM BLOB
// ==================================================
document
  .getElementById("btn-gerar-pdf")
  .addEventListener("click", async () => {
    if (products.length === 0) {
      showToast(
        "warning",
        "Nenhum produto",
        "Adicione pelo menos um produto para gerar o PDF!",
      );
      return;
    }

    mostrarOverlay();
    atualizarOverlayTexto("📄 Gerando PDF...");

    try {
      const pdf = new window.jspdf.jsPDF("p", "mm", "a4");

      for (let i = 0; i < products.length; i++) {
        atualizarOverlayTexto(
          `📄 Processando cartaz ${i + 1} de ${products.length}...`,
        );

        const clone = document.createElement("div");
        clone.innerHTML = generatePosterHTML(
          products[i],
          false,
        );

        // Verificar se é layout personalizado A5
        const ehA5Loja53 = products[i].layoutPersonalizado === 'a5-loja53';
        const ehA5Loja53Novo = products[i].layoutPersonalizado === 'a5-loja53-novo';

        // Verificar se é modelo cameba
        const ehCameba = clone.querySelector('.poster-cameba') !== null;

        if (ehA5Loja53 || ehA5Loja53Novo) {
          // A5 Config / A5 Loja 53 (novo): o wrapper já contém o poster escalado via CSS
          clone.style.cssText =
            "position:absolute;left:-99999px;top:0;width:210mm;height:297mm;background:#fff;margin:0;padding:0;box-sizing:border-box;overflow:hidden;";
          // Não aplicar zoom extra nem reposicionar footer-table — o CSS do wrapper cuida de tudo
        } else if (!ehCameba) {
          // Escalar conteúdo em 15%: container 15% menor → PDF mapeado para 210×297mm = zoom 1.15×
          clone.style.cssText =
            "position:absolute;left:-99999px;top:0;width:182.6mm;height:258.3mm;background:#fff;margin:0;padding:0;box-sizing:border-box;overflow:hidden;";
          // Ajustar largura E ALTURA do poster para coincidir com o clone
          // CRUCIAL: height:258.3mm garante que bottom:% na .poster-ge funcione corretamente no PDF
          const posterElPDF = clone.querySelector('.poster');
          if (posterElPDF) {
            posterElPDF.style.width  = '182.6mm';
            posterElPDF.style.height = '258.3mm'; // sem isso bottom:4.8% aponta para fora do clone (297mm×4.8%=14.26mm do fundo → 282.74mm do topo, mas clone só vai até 258.3mm)
          }
          const footerTableEl = clone.querySelector('.poster-footer-table');
          if (footerTableEl) {
            const scaleFactor = 258.3 / 297; // clone height / PDF page height
            const posterRootEl = clone.querySelector('[data-digits]');
            const digits = posterRootEl ? posterRootEl.getAttribute('data-digits') : null;
            let previewTopCm;
            if (digits === '4')      previewTopCm = 19;        
            else if (digits === '3') previewTopCm = 20;    // +3mm
            else if (digits === '2') previewTopCm = 21.75;   // +1cm +0.5mm
            else if (digits === '1') previewTopCm = 22.5;    // +1cm
            else                     previewTopCm = 20.5;           // sem regra de dígitos
            const cloneTopCm = (previewTopCm * scaleFactor).toFixed(3);
            footerTableEl.style.top = cloneTopCm + 'cm';
          }
        } else {
          // Cameba mantém tamanho original (já ocupa quase toda a página)
          clone.style.cssText =
            "position:absolute;left:-99999px;top:0;width:210mm;height:297mm;background:#fff;margin:0;padding:0;box-sizing:border-box;";
          const footerTableCameba = clone.querySelector('.poster-footer-table');
          if (footerTableCameba) {
            const posterRootCameba = clone.querySelector('[data-digits]');
            const digits = posterRootCameba ? posterRootCameba.getAttribute('data-digits') : null;
            const CAMEBA_OFFSET = 10; // +3cm em relação ao ponto anterior (era 3.5cm)
            let previewTopCm;
            if (digits === '4')      previewTopCm = 19      + CAMEBA_OFFSET; // 25.5cm
            else if (digits === '3') previewTopCm = 20      + CAMEBA_OFFSET; // 26.5cm
            else if (digits === '2') previewTopCm = 21.75   + CAMEBA_OFFSET; // 28.25cm
            else if (digits === '1') previewTopCm = 22.5    + CAMEBA_OFFSET; // 29.0cm
            else                     previewTopCm = 20.5    + CAMEBA_OFFSET; // fallback: 27.0cm
            footerTableCameba.style.top = previewTopCm.toFixed(3) + 'cm';
          }
        }

        document.body.appendChild(clone);

        const canvas = await html2canvas(clone, {
          scale: 2,
          backgroundColor: "#fff",
          useCORS: true,
          allowTaint: true,
          logging: false,
          removeContainer: false,
          imageTimeout: 0,
          // 🔧 FIX CROSS-BROWSER: Força rendering consistente
          windowWidth: clone.scrollWidth,
          windowHeight: clone.scrollHeight,
        });
        const img = canvas.toDataURL("image/jpeg", 1.0);

        if (i > 0) pdf.addPage();
        pdf.addImage(img, "JPEG", 0, 0, 210, 297);

        document.body.removeChild(clone);
      }

      // Gerar blob e abrir em nova janela com título personalizado
      const pdfBlob = pdf.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Criar título com códigos dos produtos
      const codigos = products.map((p) => p.codigo).join(", ");
      const titulo = `Cartazes gerados - ${codigos}`;

      // Abrir em nova aba com título personalizado
      const newWindow = window.open(pdfUrl, "_blank");
      if (newWindow && !newWindow.closed) {
        newWindow.document.title = titulo;
        showToast(
          "success",
          "PDF gerado!",
          `Cartaz(es) do(s) produto(s) ${codigos} gerado(s) com sucesso!`,
        );
      } else {
        // Popup foi bloqueado
        showToast(
          "warning",
          "Popups bloqueados",
          "Por favor, ative os popups no seu navegador para visualizar o PDF.",
        );
      }
      esconderOverlay();
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      showToast(
        "error",
        "Erro ao gerar PDF",
        "Ocorreu um erro ao gerar o PDF. Tente novamente.",
      );
      esconderOverlay();
    }
  });

// ==================================================
// CALCULADORA DE FATOR
// ==================================================
document
  .getElementById("calculator-form")
  .addEventListener("submit", (e) => {
    e.preventDefault();

    const valor = parseCurrency(
      document.getElementById("calc-valor").value,
    );
    const tipo = document.getElementById("calc-tipo").value;

    if (valor <= 0) {
      showToast(
        "warning",
        "Valor obrigatório",
        "Informe um valor válido!",
      );
      return;
    }

    if (!tipo) {
      showToast(
        "warning",
        "Tipo obrigatório",
        "Selecione o tipo de taxa!",
      );
      return;
    }

    gerarTabelaFatores(valor, tipo);
  });

function gerarTabelaFatores(valorVista, tipo) {
  // Obter elementos do modal
  const elementoValor = document.getElementById(
    "tabela-valor-vista",
  );
  const elementoTipo = document.getElementById(
    "tabela-tipo-taxa",
  );
  const elementoTbody = document.getElementById(
    "tabela-fatores-body",
  );

  // Verificar se elementos existem
  if (!elementoValor || !elementoTipo || !elementoTbody) {
    showToast(
      "error",
      "Erro no sistema",
      "Modal de fatores não está disponível. Recarregue a página.",
    );
    return;
  }

  // Atualizar informações do modal
  elementoValor.textContent = brl(valorVista);
  elementoTipo.textContent =
    tipo === "carne" ? "Carnê" : "Cartão";

  const fatores = FATORES[tipo];
  elementoTbody.innerHTML = "";

  // Gerar linhas da tabela
  for (let parcelas = 1; parcelas <= 12; parcelas++) {
    const fator = fatores[parcelas];
    const valorParcela = valorVista * fator;
    const totalPrazo = valorParcela * parcelas;

    // Formatar valores com EXATAMENTE 2 casas decimais
    const valorParcelaFormatado = valorParcela
      .toFixed(2)
      .replace(".", ",");
    const totalPrazoFormatado = totalPrazo
      .toFixed(2)
      .replace(".", ",");

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${parcelas}x</td>
            <td>${fator.toFixed(4)}</td>
            <td>R$ ${totalPrazoFormatado}</td>
            <td>R$ ${valorParcelaFormatado}</td>
        `;
    elementoTbody.appendChild(row);
  }

  // Mostrar modal
  document
    .getElementById("modal-fator")
    .classList.add("active");
}

function fecharModalFator() {
  document
    .getElementById("modal-fator")
    .classList.remove("active");
}

function imprimirTabela() {
  window.print();
}

// Tornar funções globais
window.fecharModalFator = fecharModalFator;
window.imprimirTabela = imprimirTabela;
window.fecharModalBuscaTexto = fecharModalBuscaTexto;
window.adicionarProdutoDaBusca = adicionarProdutoDaBusca;
window.alterarAgrupamento = alterarAgrupamento;

// Fechar modal com ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    const modalFator = document.getElementById("modal-fator");
    if (modalFator && modalFator.classList.contains("active")) {
      fecharModalFator();
    }

    const modalBusca = document.getElementById(
      "modal-busca-texto",
    );
    if (modalBusca && modalBusca.classList.contains("active")) {
      fecharModalBuscaTexto();
    }
  }
});

// ==================================================
// MODAL DE BUSCA POR TEXTO - FUNÇÕES AUXILIARES
// ==================================================

// Calcula similaridade entre duas strings (algoritmo de Levenshtein simplificado)
function calcularSimilaridade(str1, str2) {
  str1 = str1.toLowerCase();
  str2 = str2.toLowerCase();

  if (str1 === str2) return 100;
  if (str1.includes(str2) || str2.includes(str1)) return 85;

  const len1 = str1.length;
  const len2 = str2.length;
  const matrix = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  const similarity =
    ((maxLen - matrix[len1][len2]) / maxLen) * 100;
  return similarity;
}

// Extrai a marca do nome do produto (heurística simples)
function extrairMarca(descricao) {
  // Lista de marcas conhecidas (adicione mais conforme necessário)
  const marcasConhecidas = [
    "SAMSUNG",
    "LG",
    "SONY",
    "PHILIPS",
    "PANASONIC",
    "TCL",
    "AOC",
    "MULTILASER",
    "POSITIVO",
    "DELL",
    "HP",
    "LENOVO",
    "ASUS",
    "ELECTROLUX",
    "BRASTEMP",
    "CONSUL",
    "MIDEA",
    "PHILCO",
    "MONDIAL",
    "ARNO",
    "BRITÂNIA",
    "CADENCE",
    "BLACK+DECKER",
    "TOSHIBA",
    "HITACHI",
    "SHARP",
    "JBL",
    "HARMAN",
    "BOSE",
  ];

  const descUpper = descricao.toUpperCase();

  // Procura por marca conhecida
  for (const marca of marcasConhecidas) {
    if (descUpper.includes(marca)) {
      return marca;
    }
  }

  // Se não encontrou, usa a primeira palavra como marca
  const palavras = descricao.trim().split(/\s+/);
  return palavras[0] || "SEM MARCA";
}

// Agrupa código similar baseado em dígitos
function obterPrefixoCodigo(codigo) {
  const codigoStr = codigo.toString().trim();
  const tamanho = codigoStr.length;

  if (tamanho >= 6) {
    // 6+ dígitos: agrupa pelos primeiros 4
    return codigoStr.substring(0, 4);
  } else if (tamanho === 5) {
    // 5 dígitos: agrupa pelos primeiros 2
    return codigoStr.substring(0, 2);
  } else {
    // Menos de 5: usa o código completo
    return codigoStr;
  }
}

// Função de busca avançada (código, nome com fuzzy, marca)
function buscarProdutos(termo) {
  if (!termo || termo.trim() === "") {
    return [...todosProdutos];
  }

  termo = termo.toLowerCase().trim();

  return todosProdutos.filter((produto) => {
    // 1. Busca por código (parcial)
    if (
      produto.codigo.toString().toLowerCase().includes(termo)
    ) {
      return true;
    }

    // 2. Busca por descrição (exata ou parcial)
    if (produto.descricao.toLowerCase().includes(termo)) {
      return true;
    }

    // 3. Busca por marca
    const marca = extrairMarca(produto.descricao);
    if (marca.toLowerCase().includes(termo)) {
      return true;
    }

    // 4. Busca fuzzy (70% de similaridade)
    const similaridade = calcularSimilaridade(
      termo,
      produto.descricao,
    );
    if (similaridade >= 70) {
      return true;
    }

    return false;
  });
}

// Função para alternar agrupamento
function alterarAgrupamento(modo) {

  modoAgrupamento = modo;

  // Atualizar visual do menu
  const menuItems = document.querySelectorAll(
    ".menu-agrupamento-item",
  );
  menuItems.forEach((item) => item.classList.remove("active"));

  // Fechar menu
  const menu = document.getElementById("menu-agrupamento");
  const btnAgrupar = document.getElementById("btn-agrupar");

  if (menu) menu.style.display = "none";
  if (btnAgrupar) btnAgrupar.classList.remove("active");

  // Resetar para página 1 e renderizar
  paginaAtual = 1;
  renderizarProdutos();

  // Toast de feedback
  const labels = {
    nenhum: "Sem agrupamento",
    marca: "Agrupado por marca",
    codigo: "Agrupado por código",
  };

  showToast(
    "info",
    "Visualização alterada",
    labels[modo] || "Modo atualizado",
  );
}

// ==================================================
// MODAL DE BUSCA POR TEXTO
// ==================================================
async function abrirModalBuscaTexto() {
  const modal = document.getElementById("modal-busca-texto");
  const loading = document.getElementById(
    "busca-texto-loading",
  );
  const results = document.getElementById(
    "busca-texto-results",
  );
  const empty = document.getElementById("busca-texto-empty");
  const inputBusca = document.getElementById(
    "busca-texto-input",
  );

  // Resetar campo de busca
  inputBusca.value = "";

  // Resetar modo de agrupamento
  modoAgrupamento = "nenhum";

  // Abrir modal
  modal.classList.add("active");

  // ✅ Setup do botão de agrupamento (precisa executar após modal abrir)
  setTimeout(() => {
    const setupAgrupamento = () => {
      const btnAgrupar = document.getElementById("btn-agrupar");
      const menuAgrupamento = document.getElementById(
        "menu-agrupamento",
      );

      if (!btnAgrupar || !menuAgrupamento) return;

      btnAgrupar.onclick = function (e) {
        e.stopPropagation();
        const isActive = this.classList.contains("active");

        if (isActive) {
          menuAgrupamento.style.display = "none";
          this.classList.remove("active");
        } else {
          menuAgrupamento.style.display = "block";
          this.classList.add("active");
        }


      };
    };
    setupAgrupamento();
  }, 100);

  // ✅ SE JÁ CARREGOU OS PRODUTOS, NÃO PRECISA CARREGAR NOVAMENTE
  if (todosProdutos.length > 0) {
    produtosFiltrados = [...todosProdutos];
    paginaAtual = 1;
    renderizarProdutos();
    loading.style.display = "none";
    results.style.display = "block";
    empty.style.display = "none";
    setTimeout(() => inputBusca.focus(), 100);
    return;
  }

  // ✅ PRIMEIRA VEZ: CARREGAR PRODUTOS DA API
  loading.style.display = "block";
  results.style.display = "none";
  empty.style.display = "none";

  try {
    // 🔧 FIX: Adiciona timeout de 10 segundos para evitar travamento
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const resposta = await fetch(API_URL, { 
      signal: controller.signal,
      cache: 'no-cache'
    });
    clearTimeout(timeoutId);

    if (!resposta.ok) throw new Error("Erro ao acessar a API");

    const dados = await resposta.json();
    todosProdutos = [];

    // Processar dados de todas as planilhas (Gabriel, Júlia, Giovana)
    ["Gabriel", "Júlia", "Giovana"].forEach((nome) => {
      if (dados[nome]) {
        dados[nome].forEach((item) => {
          if (item.Código && item.Descrição) {
            todosProdutos.push({
              codigo: item.Código,
              descricao: item.Descrição,
              avista: item["Total à vista"] || "0,00",
              garantia12: item["Tot. G.E 12"] || "",
            });
          }
        });
      }
    });

    // Mostrar todos os produtos inicialmente
    produtosFiltrados = [...todosProdutos];
    paginaAtual = 1;
    renderizarProdutos();

    loading.style.display = "none";
    results.style.display = "block";

    // Focar no input de busca
    setTimeout(() => inputBusca.focus(), 100);
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    loading.style.display = "none";
    empty.style.display = "block";
    
    // 🔧 FIX: Mensagens de erro mais específicas
    let errorMessage = "Não foi possível carregar os produtos da API.";
    
    if (error.name === 'AbortError') {
      errorMessage = "Tempo esgotado. O servidor está demorando. Tente novamente.";
    } else if (error.message.includes('fetch')) {
      errorMessage = "Erro de conexão. Verifique sua internet.";
    }
    
    showToast("error", "Erro ao carregar", errorMessage);
  }
}

function fecharModalBuscaTexto() {
  const modal = document.getElementById("modal-busca-texto");
  modal.classList.remove("active");
}

function renderizarProdutos() {
  const tbody = document.getElementById("busca-texto-tbody");
  const paginationDiv = document.getElementById(
    "busca-texto-pagination",
  );
  const results = document.getElementById(
    "busca-texto-results",
  );
  const empty = document.getElementById("busca-texto-empty");



  // Se não houver produtos, mostrar mensagem vazia
  if (produtosFiltrados.length === 0) {
    results.style.display = "none";
    empty.style.display = "block";
    return;
  }

  results.style.display = "block";
  empty.style.display = "none";

  let produtosParaRenderizar = [...produtosFiltrados];
  let htmlProdutos = "";

  // ====== APLICAR AGRUPAMENTO ======
  if (modoAgrupamento === "marca") {
    // Agrupar por marca
    const grupos = {};
    produtosParaRenderizar.forEach((produto) => {
      const marca = extrairMarca(produto.descricao);
      if (!grupos[marca]) grupos[marca] = [];
      grupos[marca].push(produto);
    });

    // Ordenar marcas alfabeticamente
    const marcasOrdenadas = Object.keys(grupos).sort();

    // Renderizar com cabeçalhos de grupo
    marcasOrdenadas.forEach((marca) => {
      htmlProdutos += `
                <tr class="group-header-row">
                    <td colspan="4" class="group-header">
                        <i class="fa-solid fa-tag"></i> ${marca} (${grupos[marca].length} produtos)
                    </td>
                </tr>
            `;

      grupos[marca].forEach((produto) => {
        htmlProdutos += `
                    <tr>
                        <td>${produto.codigo}</td>
                        <td>${produto.descricao}</td>
                        <td>R$ ${produto.avista}</td>
                        <td>
                            <button class="btn-add-product" onclick="adicionarProdutoDaBusca('${produto.codigo}')">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </td>
                    </tr>
                `;
      });
    });

    tbody.innerHTML = htmlProdutos;
    paginationDiv.innerHTML = ""; // Sem paginação quando agrupado
  } else if (modoAgrupamento === "codigo") {
    // Agrupar por código similar
    const grupos = {};
    produtosParaRenderizar.forEach((produto) => {
      const prefixo = obterPrefixoCodigo(produto.codigo);
      if (!grupos[prefixo]) grupos[prefixo] = [];
      grupos[prefixo].push(produto);
    });

    // Ordenar prefixos
    const prefixosOrdenados = Object.keys(grupos).sort();

    // Renderizar com cabeçalhos de grupo
    prefixosOrdenados.forEach((prefixo) => {
      htmlProdutos += `
                <tr class="group-header-row">
                    <td colspan="4" class="group-header">
                        <i class="fa-solid fa-barcode"></i> Código ${prefixo}*** (${grupos[prefixo].length} produtos)
                    </td>
                </tr>
            `;

      grupos[prefixo].forEach((produto) => {
        htmlProdutos += `
                    <tr>
                        <td>${produto.codigo}</td>
                        <td>${produto.descricao}</td>
                        <td>R$ ${produto.avista}</td>
                        <td>
                            <button class="btn-add-product" onclick="adicionarProdutoDaBusca('${produto.codigo}')">
                                <i class="fa-solid fa-plus"></i>
                            </button>
                        </td>
                    </tr>
                `;
      });
    });

    tbody.innerHTML = htmlProdutos;
    paginationDiv.innerHTML = ""; // Sem paginação quando agrupado
  } else {
    // ====== SEM AGRUPAMENTO - COM PAGINAÇÃO ======
    const totalPaginas = Math.ceil(
      produtosFiltrados.length / itensPorPagina,
    );
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const produtosPagina = produtosFiltrados.slice(inicio, fim);


    // Renderizar produtos
    tbody.innerHTML = produtosPagina
      .map(
        (produto) => `
            <tr>
                <td>${produto.codigo}</td>
                <td>${produto.descricao}</td>
                <td>R$ ${produto.avista}</td>
                <td>
                    <button class="btn-add-product" onclick="adicionarProdutoDaBusca('${produto.codigo}')">
                        <i class="fa-solid fa-plus"></i>
                    </button>
                </td>
            </tr>
        `,
      )
      .join("");

    // Renderizar paginação
    paginationDiv.innerHTML = "";

    if (totalPaginas > 1) {
      // Botão anterior
      const btnPrev = document.createElement("button");
      btnPrev.className = "pagination-btn";
      btnPrev.innerHTML =
        '<i class="fa-solid fa-chevron-left"></i>';
      btnPrev.disabled = paginaAtual === 1;
      btnPrev.onclick = () => {
        if (paginaAtual > 1) {
          paginaAtual--;
          renderizarProdutos();
        }
      };
      paginationDiv.appendChild(btnPrev);

      // Páginas
      for (let i = 1; i <= totalPaginas; i++) {
        // Mostrar apenas algumas páginas próximas
        if (
          i === 1 ||
          i === totalPaginas ||
          (i >= paginaAtual - 2 && i <= paginaAtual + 2)
        ) {
          const btnPage = document.createElement("button");
          btnPage.className =
            "pagination-btn" +
            (i === paginaAtual ? " active" : "");
          btnPage.textContent = i;
          btnPage.onclick = () => {
            paginaAtual = i;
            renderizarProdutos();
          };
          paginationDiv.appendChild(btnPage);
        } else if (
          i === paginaAtual - 3 ||
          i === paginaAtual + 3
        ) {
          const ellipsis = document.createElement("span");
          ellipsis.className = "pagination-info";
          ellipsis.textContent = "...";
          paginationDiv.appendChild(ellipsis);
        }
      }

      // Botão próximo
      const btnNext = document.createElement("button");
      btnNext.className = "pagination-btn";
      btnNext.innerHTML =
        '<i class="fa-solid fa-chevron-right"></i>';
      btnNext.disabled = paginaAtual === totalPaginas;
      btnNext.onclick = () => {
        if (paginaAtual < totalPaginas) {
          paginaAtual++;
          renderizarProdutos();
        }
      };
      paginationDiv.appendChild(btnNext);

      // Info de paginação
      const info = document.createElement("span");
      info.className = "pagination-info";
      info.textContent = `${inicio + 1}-${Math.min(fim, produtosFiltrados.length)} de ${produtosFiltrados.length}`;
      paginationDiv.appendChild(info);
    }
  }
}

function adicionarProdutoDaBusca(codigo) {
  // Buscar o produto nos dados já carregados
  const produto = todosProdutos.find(
    (p) => p.codigo.toString() === codigo.toString(),
  );

  if (!produto) {
    showToast(
      "error",
      "Produto não encontrado",
      "Não foi possível carregar os dados do produto.",
    );
    return;
  }

  // Fechar modal
  fecharModalBuscaTexto();

  // Preencher campos diretamente com os dados já carregados
  const partes = (produto.descricao || "").split(" - ");
  document.getElementById("codigo").value = produto.codigo;
  document.getElementById("descricao").value = (
    partes[0] || ""
  ).trim();
  document.getElementById("subdescricao").value = (
    partes[1] || ""
  ).trim();

  // Preencher valor à vista
  const avistaValor = parseCurrency(produto.avista);
  document.getElementById("avista").value = formatCurrency(
    avistaValor.toFixed(2),
  );

  // Preencher garantia se houver
  if (produto.garantia12) {
    document.getElementById("garantia12").value =
      formatCurrency(
        parseCurrency(produto.garantia12).toFixed(2),
      );
  }

  // Mostrar toast de sucesso
  showToast(
    "success",
    "Produto carregado",
    `Código ${codigo} preenchido com sucesso!`,
  );
}

// ==================================================

document.addEventListener("DOMContentLoaded", () => {
  // Carregar cartazes salvos do localStorage (se existir)
  const dadosSalvos = carregarCartazesLocalStorage();
  if (
    dadosSalvos &&
    dadosSalvos.cartazes &&
    dadosSalvos.cartazes.length > 0
  ) {
    products = dadosSalvos.cartazes;

    // Restaurar modelo baseado na versão do JSON
    if (dadosSalvos.versao === "1.1") {
      modeloAtual = "cameba";
    } else {
      modeloAtual = "padrao";
    }
  }

  renderProducts();
  updateHeader("gerar");

  const switchModelo = document.getElementById("switch-modelo");
  
  // Sincronizar switch com o modelo atual ao carregar a página
  if (switchModelo) {
    switchModelo.checked = (modeloAtual === 'cameba');
  }
  
  if (switchModelo) {
    switchModelo.addEventListener("change", (e) => {
      // Se já existem cartazes, não permitir trocar o modelo
      if (products.length > 0) {
        e.preventDefault();
        switchModelo.checked = !e.target.checked; // Reverter o switch
        const modeloAtualNome =
          modeloAtual === "cameba" ? "Cameba" : "Padrão";
        showToast(
          "warning",
          "Não é possível trocar o modelo",
          `Você já possui ${products.length} cartaz(es) do modelo ${modeloAtualNome}. Limpe todos os cartazes para trocar o modelo.`,
        );
        return;
      }

      modeloAtual = e.target.checked ? "cameba" : "padrao";
    });
  }

  // Botão Debug - agora é gerenciado pelo script-modals.js
  // (removido daqui para evitar conflito com menu dropdown)

  // ✅ Event listener para busca em tempo real no modal
  const inputBusca = document.getElementById(
    "busca-texto-input",
  );
  if (inputBusca) {
    inputBusca.addEventListener("input", (e) => {
      const termo = e.target.value.trim();


      // Usar função de busca avançada
      produtosFiltrados = buscarProdutos(termo);


      paginaAtual = 1;
      modoAgrupamento = "nenhum"; // Resetar agrupamento ao buscar
      renderizarProdutos();
    });
  }

  // ✅ Toggle do menu de agrupamento
  const setupAgrupamentoButton = () => {
    const btnAgrupar = document.getElementById("btn-agrupar");
    const menuAgrupamento = document.getElementById(
      "menu-agrupamento",
    );

    if (!btnAgrupar || !menuAgrupamento) return;

    // Remover listeners antigos (se existir)
    btnAgrupar.onclick = null;

    // Adicionar novo listener
    btnAgrupar.onclick = function (e) {
      e.stopPropagation();
      const isActive = this.classList.contains("active");

      if (isActive) {
        menuAgrupamento.style.display = "none";
        this.classList.remove("active");
      } else {
        menuAgrupamento.style.display = "block";
        this.classList.add("active");
      }


    };

    // Fechar ao clicar fora
    document.addEventListener("click", function (e) {
      if (!menuAgrupamento || !btnAgrupar) return;

      const clickedInsideMenu = e.target.closest(
        "#menu-agrupamento",
      );
      const clickedButton = e.target.closest("#btn-agrupar");

      if (
        !clickedInsideMenu &&
        !clickedButton &&
        menuAgrupamento.style.display === "block"
      ) {
        menuAgrupamento.style.display = "none";
        btnAgrupar.classList.remove("active");
      }
    });
  };

  // Executar setup quando o modal abrir
  setupAgrupamentoButton();

  // ✅ Fechar modal de busca ao clicar fora
  const modalBusca = document.getElementById(
    "modal-busca-texto",
  );
  if (modalBusca) {
    modalBusca.addEventListener("click", (e) => {
      if (e.target.id === "modal-busca-texto") {
        fecharModalBuscaTexto();
      }
    });
  }

  // ✅ Fechar modal de fator ao clicar fora
  const modalFator = document.getElementById("modal-fator");
  if (modalFator) {
    modalFator.addEventListener("click", (e) => {
      if (e.target.id === "modal-fator") {
        fecharModalFator();
      }
    });
  }

  // ==================================================
  // LÓGICA DO CHECKBOX PARA PARCELAMENTO COM TAXA OPCIONAL (1x, 3x, 5x, 10x)
  // ==================================================
  const metodoSelect = document.getElementById("metodo");
  const jurosSelect = document.getElementById("juros");
  const parcelaInput = document.getElementById("parcela");
  const checkboxTaxa1x = document.getElementById("checkbox-taxa-1x");
  const habilitarTaxa1x = document.getElementById("habilitar-taxa-1x");
  const labelTaxa = habilitarTaxa1x ? habilitarTaxa1x.closest(".checkbox-wrapper-13")?.querySelector("label") : null;

  // Métodos que permitem taxa opcional
  const metodosTaxaOpcional = ["1x", "3x", "5x", "10x"];

  if (metodoSelect && jurosSelect && checkboxTaxa1x && habilitarTaxa1x && parcelaInput) {
    // Mostrar/esconder checkboxes quando selecionar método com taxa opcional
    metodoSelect.addEventListener("change", function() {
      const checkboxSemJuros = document.getElementById("checkbox-sem-juros");
      const mostrarSemJurosInput = document.getElementById("mostrar-sem-juros");
      const metodoVal = this.value;

      if (metodosTaxaOpcional.includes(metodoVal)) {
        checkboxTaxa1x.style.display = "flex";
        // Atualizar label dinamicamente
        if (labelTaxa) labelTaxa.textContent = `Aplicar taxa em ${metodoVal}`;
        // Mostrar checkbox "Sem juros?"
        if (checkboxSemJuros) checkboxSemJuros.style.display = "flex";

        if (!habilitarTaxa1x.checked) {
          // Remover required e desabilitar juros
          jurosSelect.removeAttribute("required");
          jurosSelect.value = "";
          jurosSelect.disabled = true;

          if (metodoVal === "1x") {
            // 1x sem taxa: parcela vazia e desabilitada
            parcelaInput.value = "";
            parcelaInput.disabled = true;
          } else {
            // 3x/5x/10x sem taxa: parcela calculada automaticamente (readonly)
            parcelaInput.setAttribute("readonly", "true");
            recalcularParcela();
          }
        }
      } else {
        // 12x ou outros: taxa obrigatória
        checkboxTaxa1x.style.display = "none";
        habilitarTaxa1x.checked = false;
        // Ocultar e resetar checkbox "Sem juros?"
        if (checkboxSemJuros) checkboxSemJuros.style.display = "none";
        if (mostrarSemJurosInput) mostrarSemJurosInput.checked = false;
        jurosSelect.disabled = false;
        jurosSelect.setAttribute("required", "required");
        parcelaInput.disabled = false;
        parcelaInput.removeAttribute("readonly");
      }
    });

    // Habilitar/desabilitar taxa ao marcar/desmarcar checkbox
    habilitarTaxa1x.addEventListener("change", function() {
      const metodoVal = metodoSelect.value;
      if (metodosTaxaOpcional.includes(metodoVal)) {
        if (this.checked) {
          // Habilitar taxa e parcela
          jurosSelect.disabled = false;
          jurosSelect.setAttribute("required", "required");
          parcelaInput.disabled = false;
          parcelaInput.removeAttribute("readonly");
        } else {
          // Desabilitar taxa
          jurosSelect.removeAttribute("required");
          jurosSelect.value = "";
          jurosSelect.disabled = true;

          if (metodoVal === "1x") {
            parcelaInput.value = "";
            parcelaInput.disabled = true;
          } else {
            // 3x/5x/10x: recalcular parcela sem taxa
            parcelaInput.setAttribute("readonly", "true");
            recalcularParcela();
          }
        }
      }
    });
  }

  // ==================================================
  // SISTEMA DE FONTES
  // PADRÃO (desmarcado): Fontes importadas via CDN (Google Fonts + cdnfonts)
  // ATIVADO (marcado):   Fontes locais — arquivos .woff2/.woff em /fonts/
  // ==================================================
  const checkboxFontesCloudflare = document.getElementById('usar-fontes-cloudflare');
  const FONT_PREFERENCE_KEY = 'cartazes-usar-fontes-locais';

  if (checkboxFontesCloudflare) {
    const fonteSalva = localStorage.getItem(FONT_PREFERENCE_KEY);

    if (fonteSalva === 'true') {
      // Usuário escolheu fontes locais anteriormente → marcar e ativar locais
      checkboxFontesCloudflare.checked = true;
      removerFontesImportadas();         // garante que CDN não esteja ativo
    } else {
      // Padrão (null) ou escolha prévia de CDN → desmarcado + fontes importadas
      checkboxFontesCloudflare.checked = false;
      aplicarFontesImportadas();
    }

    checkboxFontesCloudflare.addEventListener('change', function() {
      if (this.checked) {
        // MARCADO = Fontes locais
        removerFontesImportadas();
        localStorage.setItem(FONT_PREFERENCE_KEY, 'true');
        showToast('success', 'Fontes locais ativadas', 'Usando arquivos do repositório');
      } else {
        // DESMARCADO = Fontes importadas (CDN)
        aplicarFontesImportadas();
        localStorage.setItem(FONT_PREFERENCE_KEY, 'false');
        showToast('success', 'Fontes importadas ativadas', 'Usando fontes externas');
      }

      if (products.length > 0) {
        renderProducts();
      }
    });
  }

  // Ativa fontes via CDN: desabilita fonts.css local e injeta links externos
  function aplicarFontesImportadas() {
    // Usa ID para encontrar o link independente de normalização do browser
    const linkLocal = document.getElementById('fonts-local');
    if (linkLocal) linkLocal.disabled = true;

    if (!document.getElementById('google-fonts-link')) {
      const linkLato = document.createElement('link');
      linkLato.rel = 'stylesheet';
      linkLato.href = 'https://fonts.googleapis.com/css2?family=Lato:ital,wght@0,400;0,700;0,900;1,400&display=swap';
      linkLato.id = 'google-fonts-link';
      document.head.appendChild(linkLato);
    }

    if (!document.getElementById('impact-font-link')) {
      const linkImpact = document.createElement('link');
      linkImpact.rel = 'stylesheet';
      linkImpact.href = 'https://fonts.cdnfonts.com/css/impact';
      linkImpact.id = 'impact-font-link';
      document.head.appendChild(linkImpact);
    }
  }

  // Ativa fontes locais: remove links CDN e reabilita fonts.css com @font-face locais
  function removerFontesImportadas() {
    const googleLink = document.getElementById('google-fonts-link');
    if (googleLink) googleLink.remove();

    const impactLink = document.getElementById('impact-font-link');
    if (impactLink) impactLink.remove();

    // Reabilita fonts.css local pelo ID (nunca falha por normalização de URL)
    const linkLocal = document.getElementById('fonts-local');
    if (linkLocal) linkLocal.disabled = false;
  }

  // Mantém aliases para compatibilidade com outras chamadas existentes no código
  function aplicarFontesCloudflare() { aplicarFontesImportadas(); }
  function removerFontesCloudflare()  { removerFontesImportadas(); }
});

// ==================================================
// FUNÇÃO DEBUG - GERA CARTAZES DE TESTE
// ==================================================
function gerarCartazesDebug() {
  // ✅ VALIDAÇÃO DE PERMISSÃO - Apenas admin e suporte podem acessar
  try {
    const authSession = localStorage.getItem("authSession");
    if (!authSession) {
      showToast(
        "error",
        "Acesso Negado",
        "Esta área é apenas disponível para o desenvolvedor",
      );
      return;
    }

    const sessionData = JSON.parse(authSession);
    const userPerm = sessionData.perm || "";

    // Permite apenas 'admin' e 'suporte'
    if (userPerm !== "admin" && userPerm !== "suporte") {
      showToast(
        "error",
        "Acesso Negado",
        "Esta área é apenas disponível para o desenvolvedor",
      );
      return;
    }
  } catch (error) {
    console.error("Erro ao validar permissão:", error);
    showToast(
      "error",
      "Acesso Negado",
      "Esta área é apenas disponível para o desenvolvedor",
    );
    return;
  }

  // Produtos fantasia
  const produtosFantasia = [
    {
      descricao: "Sofá Retrátil 3 Lugares",
      subdescricao: "Tecido Suede Premium",
      caracteristicas:
        "Conforto | Design Moderno | Garantia 2 Anos",
      codigo: "SF-2024-001",
      avista: 2499.9,
    },
    {
      descricao: "Guarda-Roupa Casal 6 Portas",
      subdescricao: "Com Espelho e Gavetas",
      caracteristicas: "MDF | Acabamento Fosco | 3 Gavetas",
      codigo: "GR-2024-042",
      avista: 1899.9,
    },
    {
      descricao: "Conjunto de Jantar Elegance",
      subdescricao: "Mesa + 6 Cadeiras Estofadas",
      caracteristicas:
        "Madeira Maciça | Estilo Clássico | Alta Durabilidade",
      codigo: "CJ-2024-015",
      avista: 3299.9,
    },
  ];

  // Escolhe um produto aleatório
  const produtoAleatorio =
    produtosFantasia[
      Math.floor(Math.random() * produtosFantasia.length)
    ];

  // Mostra overlay de loading
  const overlay = document.getElementById("overlay");
  const overlayTexto = document.getElementById("overlay-texto");
  overlay.classList.add("active");
  overlayTexto.textContent = "Gerando cartazes de debug...";

  // Simula preenchimento dos campos e geração
  setTimeout(() => {
    // Gera data de validade (15 dias a partir de hoje)
    const dataValidade = new Date();
    dataValidade.setDate(dataValidade.getDate() + 15);
    const validadeFormatada = dataValidade
      .toISOString()
      .split("T")[0];

    // Gera 2 produtos: um com carnê e outro com cartão
    const modalidades = ["carne", "cartao"];

    modalidades.forEach((modalidade, index) => {
      const metodoExibicao =
        modalidade === "carne" ? "Carnê" : "Cartão";
      const numParcelas = 12;
      const fator = FATORES[modalidade][numParcelas];
      const valorParcela = produtoAleatorio.avista * fator;

      // ✅ GERA PRODUTO NO FORMATO COMPLETO (igual ao normal)
      const produtoDebug = {
        id: Date.now() + index, // ID único
        codigo: produtoAleatorio.codigo,
        descricao: produtoAleatorio.descricao,
        subdescricao: produtoAleatorio.subdescricao,
        caracteristicas: produtoAleatorio.caracteristicas,
        features: produtoAleatorio.caracteristicas.split(" | "), // Array de características
        avista: produtoAleatorio.avista,
        modalidade: modalidade,
        metodo: `${numParcelas}x`,
        parcela: valorParcela,
        taxa:
          modalidade === "carne" ? "3.90% a.m." : "2.50% a.m.",
        tipoModalidade: metodoExibicao,
        validade: validadeFormatada,
        juros: modalidade, // Tipo de juros (carne/cartao)
        motivo: "", // Campos extras vazios
        autorizacao: "",
        garantia12: "",
        garantia24: "",
        garantia36: "",
      };

      products.push(produtoDebug);
    });

    // Atualiza a interface
    renderProducts();

    // Esconde overlay
    overlay.classList.remove("active");

    // Mostra toast de sucesso
    showToast(
      "success",
      "Debug Executado!",
      `2 cartazes de teste gerados com sucesso (Carnê e Cartão)`,
    );

    // Muda para a view de produtos
    const navProdutos = document.querySelector(
      '[data-view="produtos"]',
    );
    if (navProdutos) {
      navProdutos.click();
    }
  }, 1500);
}

// ==================================================
// SISTEMA DE TOASTS
// ==================================================
function showToast(
  type = "info",
  title,
  message,
  duration = 4000,
) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;

  // Ícones diferentes por tipo
  const icons = {
    success: '<i class="fa-solid fa-circle-check"></i>',
    error: '<i class="fa-solid fa-circle-xmark"></i>',
    warning: '<i class="fa-solid fa-triangle-exclamation"></i>',
    info: '<i class="fa-solid fa-circle-info"></i>',
  };

  toast.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ""}
        </div>
        <button class="toast-close" onclick="this.parentElement.remove()">×</button>
    `;

  container.appendChild(toast);

  if (duration > 0) {
    setTimeout(() => {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  return toast;
}

function showUndoToast(
  title,
  message,
  onUndo,
  duration = 6000,
) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast undo";

  let undoClicked = false;

  toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid fa-rotate-left"></i></div>
        <div class="toast-content">
            <div class="toast-title">${title}</div>
            ${message ? `<div class="toast-message">${message}</div>` : ""}
            <div class="toast-actions">
                <button class="toast-action-btn primary" data-action="undo">Desfazer</button>
                <button class="toast-action-btn secondary" data-action="dismiss">Dispensar</button>
            </div>
        </div>
    `;

  container.appendChild(toast);

  // Handlers para os botões
  toast
    .querySelector('[data-action="undo"]')
    .addEventListener("click", () => {
      undoClicked = true;
      onUndo();
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    });

  toast
    .querySelector('[data-action="dismiss"]')
    .addEventListener("click", () => {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    });

  // Auto-remover após duration
  if (duration > 0) {
    setTimeout(() => {
      if (!undoClicked) {
        toast.classList.add("removing");
        setTimeout(() => toast.remove(), 300);
      }
    }, duration);
  }

  return toast;
}

function showSearchToast(descricao) {
  const container = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.className = "toast warning";

  toast.innerHTML = `
        <div class="toast-icon"><i class="fa-solid fa-triangle-exclamation"></i></div>
        <div class="toast-content">
            <div class="toast-title">Características obrigatórias</div>
            <div class="toast-message">Adicione pelo menos uma característica para o produto <strong>${descricao}</strong>. Deseja buscar na internet mais informações do produto?</div>
            <div class="toast-actions">
                <button class="toast-action-btn primary" data-action="search"><i class="fa-solid fa-globe"></i> Buscar aqui</button>
                <button class="toast-action-btn secondary" data-action="dismiss">Dispensar</button>
            </div>
        </div>
    `;

  container.appendChild(toast);

  // Handlers para os botões
  toast
    .querySelector('[data-action="search"]')
    .addEventListener("click", () => {
      const searchQuery = `${descricao} características`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      const newWindow = window.open(searchUrl, "_blank");

      if (
        !newWindow ||
        newWindow.closed ||
        typeof newWindow.closed === "undefined"
      ) {
        // Popup foi bloqueado
        showToast(
          "warning",
          "Popups bloqueados",
          "Por favor, ative os popups no seu navegador para abrir a busca do Google.",
        );
      }

      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    });

  toast
    .querySelector('[data-action="dismiss"]')
    .addEventListener("click", () => {
      toast.classList.add("removing");
      setTimeout(() => toast.remove(), 300);
    });

  return toast;
}

// ==================================================
// SISTEMA DE CONFIRMAÇÃO
// ==================================================
function showConfirm(options) {
  const {
    title = "Confirmar ação",
    subtitle = "Esta ação não pode ser desfeita",
    message = "Tem certeza que deseja continuar?",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
    iconType = "danger",
    onConfirm = () => {},
    onCancel = () => {},
  } = options;

  const overlay = document.getElementById("confirm-overlay");
  const iconEl = document.getElementById("confirm-icon");
  const titleEl = document.getElementById("confirm-title");
  const subtitleEl = document.getElementById(
    "confirm-subtitle",
  );
  const messageEl = document.getElementById("confirm-message");
  const confirmBtn = document.getElementById(
    "confirm-confirm-btn",
  );
  const cancelBtn = document.getElementById(
    "confirm-cancel-btn",
  );

  // Configurar conteúdo
  titleEl.textContent = title;
  subtitleEl.textContent = subtitle;
  messageEl.textContent = message;
  confirmBtn.textContent = confirmText;
  cancelBtn.textContent = cancelText;

  // Configurar ícone
  iconEl.className = `confirm-icon ${iconType}`;
  const icons = {
    danger: '<i class="fa-solid fa-triangle-exclamation"></i>',
    warning: '<i class="fa-solid fa-exclamation"></i>',
    info: '<i class="fa-solid fa-circle-info"></i>',
  };
  iconEl.innerHTML = icons[iconType] || icons.danger;

  // Mostrar overlay
  overlay.classList.add("active");

  // Handlers
  function handleConfirm() {
    overlay.classList.remove("active");
    onConfirm();
    cleanup();
  }

  function handleCancel() {
    overlay.classList.remove("active");
    onCancel();
    cleanup();
  }

  function cleanup() {
    confirmBtn.removeEventListener("click", handleConfirm);
    cancelBtn.removeEventListener("click", handleCancel);
    overlay.removeEventListener("click", handleOutsideClick);
  }

  function handleOutsideClick(e) {
    if (e.target === overlay) {
      handleCancel();
    }
  }

  confirmBtn.addEventListener("click", handleConfirm);
  cancelBtn.addEventListener("click", handleCancel);
  overlay.addEventListener("click", handleOutsideClick);
}

// ==================================================
// SIDEBAR: TOGGLE EXTRAS E BOTÃO HOME
// ==================================================
const toggleExtras = document.getElementById("toggle-extras");
const extrasContent = document.getElementById("extras-content");
const btnHome = document.getElementById("btn-home");

toggleExtras.addEventListener("click", () => {
  toggleExtras.classList.toggle("active");
  extrasContent.classList.toggle("active");
});

btnHome.addEventListener("click", () => {
  const isHomeActive =
    navButtons[0].classList.contains("active");

  if (isHomeActive) {
    window.location.href = "selectsetor.html";
  } else {
    navButtons[0].click();
    showToast(
      "info",
      "Início",
      "Você voltou para o formulário inicial",
    );
  }
});

// ==================================================
// CAMPOS OBRIGATÓRIOS (Destaque por 5 segundos)
// ==================================================
const btnCamposObrigatorios = document.getElementById(
  "btn-campos-obrigatorios",
);

btnCamposObrigatorios.addEventListener("click", () => {
  // Descobrir qual view está ativa
  const activeView = document.querySelector(".view.active");
  let requiredFields = [];
  let formularioNome = "";

  if (activeView && activeView.id === "view-gerar") {
    // Formulário principal
    requiredFields = [
      "codigo",
      "descricao",
      "metodo",
      "juros",
      "avista",
      "feature-1",
      "feature-2",
      "feature-3",
    ];
    formularioNome = "Formulário Principal";
  }

  if (requiredFields.length > 0) {
    requiredFields.forEach((id) => {
      const field = document.getElementById(id);
      if (field) {
        field.classList.add("field-required-highlight");
        setTimeout(() => {
          field.classList.remove("field-required-highlight");
        }, 5000);
      }
    });

    showToast(
      "info",
      `Campos obrigatórios: ${formularioNome}`,
      "Os campos obrigatórios (incluindo características) foram destacados por 5 segundos.",
    );
  } else {
    showToast(
      "warning",
      "Nenhum formulário ativo",
      "Navegue até um formulário para ver os campos obrigatórios.",
    );
  }
});

/* ============================================================================
   PATCH: FUNCIONALIDADE "CRIAR COM DOIS CÓDIGOS"
   ============================================================================
   
   Este arquivo adiciona:
   1. Modo de seleção de 2 produtos no modal de busca (com checkboxes)
   2. Botão de confirmação para mesclar os 2 produtos selecionados
   3. Busca por barra "/" no campo principal (ex: 110049/110050)
   
   IMPORTANTE: Este arquivo deve ser carregado APÓS o script.js
   ============================================================================ */

// ============================================================================
// VARIÁVEIS GLOBAIS
// ============================================================================
let modoDoisCodigos = false;  // Flag para ativar/desativar modo de seleção
let codigosSelecionados = []; // Array com os 2 códigos selecionados

// ============================================================================
// PARTE 1: SOBRESCREVER renderizarProdutos() PARA ADICIONAR CHECKBOXES
// ============================================================================
const renderizarProdutosOriginal = window.renderizarProdutos;

window.renderizarProdutos = function() {
  const tbody = document.getElementById("busca-texto-tbody");
  const paginationDiv = document.getElementById("busca-texto-pagination");
  const results = document.getElementById("busca-texto-results");
  const empty = document.getElementById("busca-texto-empty");
  const thead = document.querySelector(".busca-texto-table thead tr");
  


  // Adicionar/remover coluna de checkbox no header
  let thCheckbox = document.getElementById("th-checkbox");
  if (modoDoisCodigos && !thCheckbox) {
    thCheckbox = document.createElement("th");
    thCheckbox.id = "th-checkbox";
    thCheckbox.style.width = "50px";
    thCheckbox.style.textAlign = "center";
    thCheckbox.innerHTML = '<i class="fa-solid fa-check-double"></i>';
    thead.insertBefore(thCheckbox, thead.firstChild);
  } else if (!modoDoisCodigos && thCheckbox) {
    thCheckbox.remove();
  }

  // Se não houver produtos, mostrar mensagem vazia
  if (produtosFiltrados.length === 0) {
    results.style.display = "none";
    empty.style.display = "block";
    return;
  }

  results.style.display = "block";
  empty.style.display = "none";

  let produtosParaRenderizar = [...produtosFiltrados];
  let htmlProdutos = "";

  // Função helper para criar linha de produto
  const criarLinhaProduto = (produto) => {
    const isSelecionado = codigosSelecionados.includes(produto.codigo.toString());
    
    // Se estiver no modo dois códigos, adiciona checkbox
    const checkboxHTML = modoDoisCodigos ? `
      <td style="width: 50px; text-align: center; padding: 8px;">
        <input type="checkbox" 
               class="produto-checkbox" 
               ${isSelecionado ? 'checked' : ''}
               ${!isSelecionado && codigosSelecionados.length >= 2 ? 'disabled' : ''}
               onchange="toggleCodigoSelecionado('${produto.codigo}')"
               style="cursor: pointer; width: 18px; height: 18px;">
      </td>
    ` : '';
    
    const rowClass = modoDoisCodigos && isSelecionado ? "selecionado" : "";
    
    return `
      <tr class="${rowClass}">
        ${checkboxHTML}
        <td style="width: 120px;">${produto.codigo}</td>
        <td>${produto.descricao}</td>
        <td style="width: 140px;">R$ ${produto.avista}</td>
        <td style="width: 80px; text-align: center;">
          ${!modoDoisCodigos ? `
            <button class="btn-add-product" onclick="adicionarProdutoDaBusca('${produto.codigo}')">
              <i class="fa-solid fa-plus"></i>
            </button>
          ` : ''}
        </td>
      </tr>
    `;
  };

  // ====== APLICAR AGRUPAMENTO ======
  if (modoAgrupamento === "marca") {
    // Agrupar por marca
    const grupos = {};
    produtosParaRenderizar.forEach((produto) => {
      const marca = extrairMarca(produto.descricao);
      if (!grupos[marca]) grupos[marca] = [];
      grupos[marca].push(produto);
    });

    const marcasOrdenadas = Object.keys(grupos).sort();

    marcasOrdenadas.forEach((marca) => {
      const colspan = modoDoisCodigos ? "5" : "4";
      htmlProdutos += `
        <tr class="group-header-row">
          <td colspan="${colspan}" class="group-header">
            <i class="fa-solid fa-tag"></i> ${marca} (${grupos[marca].length} produtos)
          </td>
        </tr>
      `;

      grupos[marca].forEach((produto) => {
        htmlProdutos += criarLinhaProduto(produto);
      });
    });

    tbody.innerHTML = htmlProdutos;
    paginationDiv.innerHTML = "";
  } else if (modoAgrupamento === "codigo") {
    // Agrupar por código similar
    const grupos = {};
    produtosParaRenderizar.forEach((produto) => {
      const prefixo = obterPrefixoCodigo(produto.codigo);
      if (!grupos[prefixo]) grupos[prefixo] = [];
      grupos[prefixo].push(produto);
    });

    const prefixosOrdenados = Object.keys(grupos).sort();

    prefixosOrdenados.forEach((prefixo) => {
      const colspan = modoDoisCodigos ? "5" : "4";
      htmlProdutos += `
        <tr class="group-header-row">
          <td colspan="${colspan}" class="group-header">
            <i class="fa-solid fa-barcode"></i> Código ${prefixo}*** (${grupos[prefixo].length} produtos)
          </td>
        </tr>
      `;

      grupos[prefixo].forEach((produto) => {
        htmlProdutos += criarLinhaProduto(produto);
      });
    });

    tbody.innerHTML = htmlProdutos;
    paginationDiv.innerHTML = "";
  } else {
    // ====== SEM AGRUPAMENTO - COM PAGINAÇÃO ======
    const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina);
    const inicio = (paginaAtual - 1) * itensPorPagina;
    const fim = inicio + itensPorPagina;
    const produtosPagina = produtosFiltrados.slice(inicio, fim);


    // Renderizar produtos
    tbody.innerHTML = produtosPagina.map(produto => criarLinhaProduto(produto)).join("");

    // Renderizar paginação
    paginationDiv.innerHTML = "";

    if (totalPaginas > 1) {
      // Botão anterior
      const btnPrev = document.createElement("button");
      btnPrev.className = "pagination-btn";
      btnPrev.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
      btnPrev.disabled = paginaAtual === 1;
      btnPrev.onclick = () => {
        if (paginaAtual > 1) {
          paginaAtual--;
          renderizarProdutos();
        }
      };
      paginationDiv.appendChild(btnPrev);

      // Páginas
      for (let i = 1; i <= totalPaginas; i++) {
        if (
          i === 1 ||
          i === totalPaginas ||
          (i >= paginaAtual - 2 && i <= paginaAtual + 2)
        ) {
          const btnPage = document.createElement("button");
          btnPage.className = "pagination-btn" + (i === paginaAtual ? " active" : "");
          btnPage.textContent = i;
          btnPage.onclick = () => {
            paginaAtual = i;
            renderizarProdutos();
          };
          paginationDiv.appendChild(btnPage);
        } else if (i === paginaAtual - 3 || i === paginaAtual + 3) {
          const ellipsis = document.createElement("span");
          ellipsis.className = "pagination-info";
          ellipsis.textContent = "...";
          paginationDiv.appendChild(ellipsis);
        }
      }

      // Botão próximo
      const btnNext = document.createElement("button");
      btnNext.className = "pagination-btn";
      btnNext.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
      btnNext.disabled = paginaAtual === totalPaginas;
      btnNext.onclick = () => {
        if (paginaAtual < totalPaginas) {
          paginaAtual++;
          renderizarProdutos();
        }
      };
      paginationDiv.appendChild(btnNext);

      // Info de paginação
      const info = document.createElement("span");
      info.className = "pagination-info";
      info.textContent = `${inicio + 1}-${Math.min(fim, produtosFiltrados.length)} de ${produtosFiltrados.length}`;
      paginationDiv.appendChild(info);
    }
  }
  
  // Atualizar squircles e botão de confirmação
  if (modoDoisCodigos) {
    atualizarSquircles();
    if (codigosSelecionados.length === 2) {
      mostrarBotaoConfirmar();
    } else {
      esconderBotaoConfirmar();
    }
  }
};

// ============================================================================
// PARTE 2: FUNÇÕES PARA O MODO DOIS CÓDIGOS
// ============================================================================

function alterarModoDoisCodigos() {
  modoDoisCodigos = !modoDoisCodigos;
  
  // ✅ LIMPAR SELEÇÕES E SQUIRCLES AO ALTERNAR MODO
  limparSelecoes();
  
  // Fechar menu
  const menu = document.getElementById("menu-agrupamento");
  const btnAgrupar = document.getElementById("btn-agrupar");
  
  if (menu) menu.style.display = "none";
  if (btnAgrupar) btnAgrupar.classList.remove("active");
  
  // Resetar agrupamento
  modoAgrupamento = "nenhum";
  
  // Re-renderizar produtos
  paginaAtual = 1;
  renderizarProdutos();
  
  if (modoDoisCodigos) {
    showToast("info", "Modo ativado", "Selecione até 2 produtos para mesclar");
  } else {
    showToast("info", "Modo desativado", "Voltando ao modo normal");
  }
}

function toggleCodigoSelecionado(codigo) {
  codigo = codigo.toString();
  const index = codigosSelecionados.indexOf(codigo);
  
  if (index >= 0) {
    // Remove código
    codigosSelecionados.splice(index, 1);
  } else {
    // Adiciona código (máx 2)
    if (codigosSelecionados.length < 2) {
      codigosSelecionados.push(codigo);
    } else {
      showToast("warning", "Limite atingido", "Você já selecionou 2 produtos");
      // Re-renderizar para desmarcar checkbox
      setTimeout(() => renderizarProdutos(), 50);
      return;
    }
  }
  renderizarProdutos();
}

// ✅ NOVA FUNÇÃO: Limpar seleções e squircles
function limparSelecoes() {
  codigosSelecionados = [];
  
  // Remover squircles
  const container = document.querySelector('.squircles-container');
  if (container) {
    container.remove();
  }
  
  // Esconder botão de confirmação
  esconderBotaoConfirmar();

}

function atualizarSquircles() {
  // Remover container antigo se existir
  let container = document.querySelector('.squircles-container');
  if (container) {
    container.remove();
  }
  
  // Se não tem códigos selecionados, não mostrar nada
  if (codigosSelecionados.length === 0) {
    return;
  }
  
  // ✅ VERIFICAR SE MODAL ESTÁ ABERTO
  const modal = document.getElementById("modal-busca-texto");
  if (!modal || !modal.classList.contains("active")) {
    // Modal fechado, não mostrar squircles
    return;
  }
  
  const inputBusca = document.getElementById("busca-texto-input");
  if (!inputBusca) return;
  
  // Criar container
  container = document.createElement('div');
  container.className = 'squircles-container';
  container.style.cssText = `
    display: flex;
    gap: 8px;
    margin-bottom: 12px;
    flex-wrap: wrap;
  `;
  
  // Criar squircles
  codigosSelecionados.forEach(codigo => {
    const squircle = document.createElement('div');
    squircle.className = 'codigo-squircle';
    squircle.style.cssText = `
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      background: #3b82f6;
      color: white;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
    `;
    squircle.innerHTML = `
      <span>${codigo}</span>
      <span onclick="event.stopPropagation(); toggleCodigoSelecionado('${codigo}')" 
            style="cursor: pointer; opacity: 0.8; hover: opacity: 1;">��</span>
    `;
    container.appendChild(squircle);
  });
  
  // Inserir antes do input
  inputBusca.parentElement.insertBefore(container, inputBusca);
}

function mostrarBotaoConfirmar() {
  let btnConfirmar = document.getElementById("btn-confirmar-dois-codigos");
  
  if (!btnConfirmar) {
    btnConfirmar = document.createElement("button");
    btnConfirmar.id = "btn-confirmar-dois-codigos";
    btnConfirmar.className = "btn-primary";
    btnConfirmar.style.cssText = `
      width: 100%;
      margin-top: 20px;
      padding: 14px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
    `;
    btnConfirmar.innerHTML = `
      <i class="fa-solid fa-check-double"></i>
      Confirmar Mesclagem dos 2 Produtos
    `;
    btnConfirmar.onclick = processarDoisCodigos;
    
    // Inserir após a paginação
    const paginationDiv = document.getElementById("busca-texto-pagination");
    if (paginationDiv && paginationDiv.parentNode) {
      paginationDiv.parentNode.insertBefore(btnConfirmar, paginationDiv.nextSibling);
    }
  }
  
  btnConfirmar.style.display = "flex";
}

function esconderBotaoConfirmar() {
  const btnConfirmar = document.getElementById("btn-confirmar-dois-codigos");
  if (btnConfirmar) {
    btnConfirmar.style.display = "none";
  }
}

function processarDoisCodigos() {
  if (codigosSelecionados.length !== 2) {
    showToast("error", "Erro", "Selecione exatamente 2 produtos");
    return;
  }
  
  
  const produto1 = todosProdutos.find(p => p.codigo.toString() === codigosSelecionados[0]);
  const produto2 = todosProdutos.find(p => p.codigo.toString() === codigosSelecionados[1]);
  
  if (!produto1 || !produto2) {
    showToast("error", "Erro", "Não foi possível encontrar os produtos");
    return;
  }

  
  // Separar descrição e marca
  const partes1 = (produto1.descricao || "").split(" - ");
  const partes2 = (produto2.descricao || "").split(" - ");
  
  const desc1 = (partes1[0] || "").trim();
  const desc2 = (partes2[0] || "").trim();
  const marca = (partes1[1] || partes2[1] || "").trim();
  
  // Preencher campos
  document.getElementById("codigo").value = `${codigosSelecionados[0]}/${codigosSelecionados[1]}`;
  document.getElementById("descricao").value = `${desc1}/${desc2}`;
  document.getElementById("subdescricao").value = marca;
  
  // Somar valores à vista
  const avista1 = parseCurrency(produto1.avista);
  const avista2 = parseCurrency(produto2.avista);
  const avistaTotal = avista1 + avista2;
  
  document.getElementById("avista").value = formatCurrency(avistaTotal.toFixed(2));
  
  showToast(
    "success",
    "Produtos mesclados",
    `Códigos ${produto1.codigo} e ${produto2.codigo} combinados com sucesso!`
  );
  
  // ✅ LIMPAR SELEÇÕES ANTES DE FECHAR MODAL
  limparSelecoes();
  
  // Resetar modo
  modoDoisCodigos = false;
  
  // Fechar modal
  fecharModalBuscaTexto();
}

// ✅ SOBRESCREVER fecharModalBuscaTexto() para limpar ao fechar
const fecharModalBuscaTextoOriginal = window.fecharModalBuscaTexto;

window.fecharModalBuscaTexto = function() {
  // ✅ LIMPAR SELEÇÕES AO FECHAR MODAL
  limparSelecoes();
  
  // Chamar função original
  if (fecharModalBuscaTextoOriginal) {
    fecharModalBuscaTextoOriginal();
  } else {
    const modal = document.getElementById("modal-busca-texto");
    if (modal) modal.classList.remove("active");
  }
};

// ============================================================================
// PARTE 3: BUSCA POR BARRA "/" NO CAMPO PRINCIPAL
// ============================================================================

async function buscarEMesclarProdutos(codigo1, codigo2) {
  
  // ✅ MOSTRAR OVERLAY DE BUSCA
  mostrarOverlayBusca(
    "Buscando produtos",
    `Procurando códigos ${codigo1} e ${codigo2}...`
  );
  
  try {
    // ✅ CARREGAR PRODUTOS DA API SE NECESSÁRIO
    if (!window.todosProdutos || todosProdutos.length === 0) {
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const resposta = await fetch(API_URL, { 
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);

      if (!resposta.ok) throw new Error("Erro ao acessar a API");

      const dados = await resposta.json();
      window.todosProdutos = [];

      ["Gabriel", "Júlia", "Giovana"].forEach((nome) => {
        if (dados[nome]) {
          dados[nome].forEach((item) => {
            if (item.Código && item.Descrição) {
              todosProdutos.push({
                codigo: item.Código,
                descricao: item.Descrição,
                avista: item["Total à vista"] || "0,00",
                garantia12: item["Tot. G.E 12"] || "",
              });
            }
          });
        }
      });
      
    }
    
    // ✅ BUSCAR PRODUTOS
    const produto1 = todosProdutos.find(p => p.codigo.toString() === codigo1);
    const produto2 = todosProdutos.find(p => p.codigo.toString() === codigo2);
    
    if (!produto1) {
      esconderOverlay();
      showToast("error", "Produto não encontrado", `Código ${codigo1} não existe`);
      return false;
    }
    
    if (!produto2) {
      esconderOverlay();
      showToast("error", "Produto não encontrado", `Código ${codigo2} não existe`);
      return false;
    }

    
    // ✅ MOSTRAR SUCESSO
    mostrarOverlaySucesso(
      "Produtos encontrados",
      "Preenchendo campos automaticamente..."
    );
    
    await new Promise(res => setTimeout(res, 800));
  
  // Separar descrição e marca
  const partes1 = (produto1.descricao || "").split(" - ");
  const partes2 = (produto2.descricao || "").split(" - ");
  
  const desc1 = (partes1[0] || "").trim();
  const desc2 = (partes2[0] || "").trim();
  const marca = (partes1[1] || partes2[1] || "").trim();
  
  // Preencher campos
  document.getElementById("codigo").value = `${codigo1}/${codigo2}`;
  document.getElementById("descricao").value = `${desc1}/${desc2}`;
  document.getElementById("subdescricao").value = marca;
  
  // Somar valores
  const avista1 = parseCurrency(produto1.avista);
  const avista2 = parseCurrency(produto2.avista);
  const avistaTotal = avista1 + avista2;
  
  document.getElementById("avista").value = formatCurrency(avistaTotal.toFixed(2));
  
  esconderOverlay();
  showToast("success", "Produtos mesclados", `Códigos ${codigo1} e ${codigo2} encontrados e mesclados!`);
  
  return true;
  } catch (error) {
    console.error("❌ Erro ao buscar produtos:", error);
    esconderOverlay();
    showToast("error", "Erro", "Não foi possível buscar os produtos");
    return false;
  }
}

// ✅ INTERCEPTAR O BOTÃO DE BUSCA (CAMPO PRINCIPAL)
document.addEventListener('DOMContentLoaded', function() {
  const btnBuscar = document.getElementById('btn-buscar');
  const inputCodigo = document.getElementById('codigo');
  
  if (!btnBuscar || !inputCodigo) return;
  

  
  // Remover maxlength
  inputCodigo.removeAttribute('maxlength');
  
  // ✅ CLONAR BOTÃO PARA REMOVER EVENTOS ANTIGOS
  const btnBuscarNovo = btnBuscar.cloneNode(true);
  btnBuscar.parentNode.replaceChild(btnBuscarNovo, btnBuscar);
  
  // ✅ ADICIONAR NOVO EVENTO
  btnBuscarNovo.addEventListener('click', async function(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const codigoValue = inputCodigo.value.trim();
    
    // Campo vazio = abrir modal
    if (!codigoValue) {
      if (typeof abrirModalBuscaTexto === 'function') {
        abrirModalBuscaTexto();
      }
      return;
    }
    
    // ✅ VERIFICAR SE TEM BARRA "/"
    if (codigoValue.includes('/')) {
      const codigos = codigoValue.split('/').map(c => c.trim()).filter(c => c);
      
      if (codigos.length !== 2) {
        showToast("error", "Formato inválido", "Digite exatamente 2 códigos separados por /");
        return;
      }
      

      // ✅ BUSCA APENAS COM A FUNÇÃO DE MESCLAR (NÃO FAZ BUSCA DUPLICADA)
      await buscarEMesclarProdutos(codigos[0], codigos[1]);
      return; // ← IMPORTANTE: Sai aqui e não continua para a busca normal
    }
    
    
    mostrarOverlayBusca(
      "Buscando informações",
      `Procurando produto código ${codigoValue}...`
    );
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const resposta = await fetch(API_URL, { 
        signal: controller.signal,
        cache: 'no-cache'
      });
      clearTimeout(timeoutId);

      if (!resposta.ok) throw new Error("Erro ao acessar a API");

      const dados = await resposta.json();
      let encontrado = false;
      let primeiroItem = null;

      ["Gabriel", "Júlia", "Giovana"].forEach((nome) => {
        if (dados[nome]) {
          dados[nome].forEach((item) => {
            if (item.Código == codigoValue) {
              encontrado = true;
              if (!primeiroItem) primeiroItem = item;
            }
          });
        }
      });

      if (encontrado && primeiroItem) {
        mostrarOverlaySucesso(
          "Informações encontradas",
          "Preenchendo campos automaticamente..."
        );

        await new Promise(res => setTimeout(res, 800));

        const partes = (primeiroItem.Descrição || "").split(" - ");
        document.getElementById("descricao").value = (partes[0] || "").trim();
        document.getElementById("subdescricao").value = (partes[1] || "").trim();

        const avistaValor = parseCurrency(primeiroItem["Total à vista"]);
        document.getElementById("avista").value = formatCurrency(avistaValor.toFixed(2));

        esconderOverlay();
        showToast("success", "Produto encontrado", `Código ${codigoValue} carregado com sucesso!`);
      } else {
        esconderOverlay();
        showToast("error", "Produto não encontrado", `O código ${codigoValue} não foi encontrado.`);
      }
    } catch (error) {
      console.error("❌ Erro:", error);
      esconderOverlay();
      showToast("error", "Erro ao buscar", "Não foi possível acessar a API");
    }
  });
  
  // ✅ ENTER NO INPUT
  inputCodigo.addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      btnBuscarNovo.click();
    }
  });
  
});

// ============================================================================
// EXPORTAR FUNÇÕES GLOBAIS
// ============================================================================
window.alterarModoDoisCodigos = alterarModoDoisCodigos;
window.toggleCodigoSelecionado = toggleCodigoSelecionado;
window.buscarEMesclarProdutos = buscarEMesclarProdutos;
window.limparSelecoes = limparSelecoes;
