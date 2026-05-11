/**
 * acessospermitidos.js
 * ─────────────────────────────────────────────
 * Importar no <head> (ou antes do </body>) de selectsetor.html.
 * Roda imediatamente ao ser carregado — sem precisar de DOMContentLoaded
 * pois só lê localStorage e redireciona se necessário.
 *
 * REGRAS DE ACESSO (qualquer uma libera):
 *  1. perm === 'admin' ou 'suporte'           (authSession.perm)
 *  2. usuário 'jenifermoura'                  (authSession.user)
 *  3. cidade 'iguatu' no item 'local'         (localStorage.getItem('local'))
 *  4. filial/cidade da sessão contém 'iguatu' (authSession.filial ou authSession.cidade)
 */

(function () {
  'use strict';

  const DENIED_PAGE = '../pages/acesso-negado.html';

  /* ── helpers ─────────────────────────────────────── */
  function readSession() {
    try {
      const raw = localStorage.getItem('authSession') || localStorage.getItem('auth');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (_) { return null; }
  }

  function normalize(str) {
    return String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, ''); // remove acentos
  }

  /* ── lógica de permissão ──────────────────────────── */
  function isAllowed() {
    const auth = readSession();

    // 1. Permissão administrativa na sessão
    if (auth) {
      const perm = normalize(auth.perm);
      if (perm === 'admin' || perm === 'suporte') return true;
    }

    // 2. Usuário específico whitelisted
    if (auth) {
      const user = normalize(auth.user || '');
      if (user === 'jenifermoura') return true;
    }

    // 3. Chave 'local' no localStorage contém 'iguatu'
    const local = normalize(localStorage.getItem('local') || '');
    if (local.includes('iguatu')) return true;

    // 4. Filial/cidade da sessão contém 'iguatu'
    if (auth) {
      const filial = normalize(auth.filial || ''); 
      const cidade = normalize(auth.cidade || '');
      if (filial.includes('iguatu') || cidade.includes('iguatu') || filial.includes('icó') || cidade.includes('icó')) return true ;
    }

    return false;
  }

  /* ── execução ─────────────────────────────────────── */
  if (!isAllowed()) {
    // Salva a URL atual para eventual exibição na tela de negado
    try {
      sessionStorage.setItem('ss_blocked_from', window.location.href);
    } catch (_) { /* ignore */ }

    // Redireciona imediatamente — antes de qualquer render
    window.location.replace(DENIED_PAGE);
  }

})();
