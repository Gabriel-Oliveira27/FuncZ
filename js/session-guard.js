/* ===== SESSION GUARD - Proteção de Sessão Universal ===== */

/* ===== CONFIGURAÇÃO DE TEMPOS (em ms) ===== */
const SESSION_RULES = {
  voucher: 5 * 60 * 1000,        // 5 minutos
  crediario: 4 * 60 * 60 * 1000, // 4 horas
  vendas: 3 * 60 * 60 * 1000,    // 3 horas
  faturamento: 6 * 60 * 60 * 1000, // 6 horas
  admin: Infinity,
  gerente: Infinity,
  suporte: Infinity
};

/* ===== FUNÇÃO PRINCIPAL ===== */
function checkSession() {
  const raw = localStorage.getItem("authSession");

  if (!raw) {
    logout("Sessão inexistente");
    return false;
  }

  let session;
  try {
    session = JSON.parse(raw);
  } catch {
    logout("Sessão corrompida");
    return false;
  }

  const now = Date.now();

  /* ===== VALIDAÇÕES BÁSICAS ===== */
  if (!session.user || !session.perm || !session.start) {
    logout("Sessão inválida");
    return false;
  }

  /* ===== IDENTIFICA TEMPO LIMITE ===== */
  let maxDuration;

  if (session.isVoucher || session.tipo === "voucher") {
    maxDuration = SESSION_RULES.voucher;
  } else {
    const perm = session.perm.toLowerCase();
    maxDuration = SESSION_RULES[perm] ?? 60 * 60 * 1000; // fallback 1h
  }

  /* ===== VERIFICA EXPIRAÇÃO ===== */
  if (now - session.start > maxDuration) {
    logout("Sessão expirada");
    return false;
  }

  /* ===== ATUALIZA ATIVIDADE (SLIDING SESSION) ===== */
  session.lastActivity = now;
  localStorage.setItem("authSession", JSON.stringify(session));

  return true;
}

/* ===== LOGOUT CENTRALIZADO ===== */
function logout(reason = "") {
  console.warn("Logout:", reason);
  localStorage.removeItem("authSession");

  const path = window.location.pathname;

  if (
    path.endsWith("/") ||
    path.endsWith("/index.html")
  ) {
    return;
  }

  const repo = path.split("/")[1] || "FuncZ";
  window.location.href = `/${repo}/index.html`;
}


/* ===== MONITORAMENTO CONTÍNUO ===== */
function startSessionMonitor(interval = 15000) {
  checkSession();
  const monitor = setInterval(checkSession, interval);
  
  // Retorna função para parar o monitor se necessário
  return () => clearInterval(monitor);
}

/* ===== PROTEÇÃO MANUAL POR AÇÃO ===== */
function requireAuth() {
  return checkSession();
}

/* ===== OBTÉM DADOS DA SESSÃO ===== */
function getSessionData() {
  const raw = localStorage.getItem("authSession");
  if (!raw) return null;
  
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/* ===== EXPÕE GLOBALMENTE ===== */
window.SessionGuard = {
  checkSession,
  startSessionMonitor,
  logout,
  requireAuth,
  getSessionData,
  SESSION_RULES
};

/* ===== AUTO-INICIALIZAÇÃO EM PÁGINAS PROTEGIDAS ===== */
// Se não estiver na página de login, inicia monitoramento automático
if (typeof window !== 'undefined' && !window.location.pathname.includes('FuncZ/index.html')) {
  document.addEventListener('DOMContentLoaded', () => {
    if (checkSession()) {
      startSessionMonitor();
    }
  });
}



