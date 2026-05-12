(function () {
  'use strict';

  const DENIED_PAGE = '../pages/acesso-negado.html';

  function readSession() {
    try {
      const raw = localStorage.getItem('authSession') || localStorage.getItem('auth');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function normalize(str) {
    return String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  function isAllowed() {
    const auth = readSession();

    if (auth) {
      // 1. Permissão admin / suporte
      const perm = normalize(auth.perm);
      if (perm === 'admin' || perm === 'suporte') return true;

      // 2. Usuário whitelisted
      if (normalize(auth.user) === 'jenifermoura') return true;

      // 3. auth.local (campo dentro do authSession) contém 'iguatu'
      //    Ex: {"local":"iguatu", ...}
      const localField = normalize(auth.local);
      if (localField.includes('iguatu')) return true;

      // 4. auth.filial ou auth.cidade contém 'iguatu' / 'ico'
      const filial = normalize(auth.filial);
      const cidade = normalize(auth.cidade);
      if (
        filial.includes('iguatu') || cidade.includes('iguatu') ||
        filial.includes('ico')    || cidade.includes('ico')
      ) return true;
    }

    // 5. Chave 'local' independente no localStorage (fallback)
    if (normalize(localStorage.getItem('local')).includes('iguatu')) return true;

    return false;
  }

  if (!isAllowed()) {
    try {
      sessionStorage.setItem('ss_blocked_from', window.location.href);
    } catch (_) { /* ignore */ }

    window.location.replace(DENIED_PAGE);
  }

})();
