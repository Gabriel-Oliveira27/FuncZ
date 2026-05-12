(function () {
  'use strict';

  const DENIED_PAGE = '../pages/acesso-negado.html';

  function readSession() {
    try {
      const raw = localStorage.getItem('authSession') || localStorage.getItem('auth');
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  /** Remove acentos, espaços extras e coloca em minúsculas */
  function normalize(str) {
    return String(str || '')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /** Retorna true se a string normalizada é de uma cidade autorizada */
  function isCidadeAutorizada(str) {
    const n = normalize(str);
    return n.includes('iguatu') || n.includes('ico');
    // "icó" → normalize → "ico"  ✓
    // "iguatu" → normalize → "iguatu" ✓
  }

  function isAllowed() {
    const auth = readSession();

    if (auth) {
      // 1. Permissão admin / suporte
      const perm = normalize(auth.perm);
      if (perm === 'admin' || perm === 'suporte') return true;

      // 2. Usuário whitelisted
      if (normalize(auth.user) === 'jenifermoura') return true;

      // 3. auth.local (campo dentro do authSession)
      //    Ex: {"local":"iguatu"} ou {"local":"icó"}
      if (isCidadeAutorizada(auth.local)) return true;

      // 4. auth.filial ou auth.cidade (campos alternativos)
      if (isCidadeAutorizada(auth.filial)) return true;
      if (isCidadeAutorizada(auth.cidade)) return true;
    }

    // 5. Chave 'local' avulsa no localStorage (fallback)
    if (isCidadeAutorizada(localStorage.getItem('local'))) return true;

    return false;
  }

  if (!isAllowed()) {
    try {
      sessionStorage.setItem('ss_blocked_from', window.location.href);
    } catch (_) { /* ignore */ }

    window.location.replace(DENIED_PAGE);
  }

})();
