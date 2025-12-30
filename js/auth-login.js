/* ===== AUTH LOGIN - Sistema de Autenticação ===== */

document.addEventListener('DOMContentLoaded', () => {
  /* ===== ELEMENTOS DOM ===== */
  const loginForm = document.getElementById('loginForm');
  const loginBtn = document.getElementById('loginBtn');
  const inputUser = document.getElementById('loginUser');
  const inputPass = document.getElementById('loginPass');
  const errorAlert = document.getElementById('errorAlert');
  const errorMessage = document.getElementById('errorMessage');
  
  const modalCEP = document.getElementById('modalCEP');
  const cepInput = document.getElementById('cepInput');
  const cepConfirm = document.getElementById('cepConfirm');
  
  const modalVoucher = document.getElementById('modalVoucher');
  const progressBar = modalVoucher.querySelector('.progress-bar');
  const progressText = modalVoucher.querySelector('.progress-text');
  
  const overlayAuth = document.getElementById('overlayAuth');
  const toastContainer = document.getElementById('toastContainer');

  /* ===== VARIÁVEIS DE CONTROLE ===== */
  let currentUser = '';
  let currentPass = '';
  let localTentativa = null;
  let isVisitante = false;

  /* ===== VERIFICAÇÃO DE SESSÃO EXISTENTE ===== */
  const sessionData = (window.SessionGuard && window.SessionGuard.getSessionData)
    ? window.SessionGuard.getSessionData()
    : (JSON.parse(localStorage.getItem('authSession') || 'null'));

  if (sessionData && (window.SessionGuard ? window.SessionGuard.checkSession() : (function(){ 
        // fallback simples
        const now = Date.now();
        const start = sessionData.start || now;
        const dur = sessionData.duration || (60*60*1000);
        return (typeof dur === 'number' && isFinite(dur)) ? (now < (start + dur)) : true;
      })()
    )) {
    // já logado
    window.location.href = 'pages/selectsetor.html';
    return;
  }

  /* ===== FUNÇÃO: MOSTRAR ERRO ===== */
  function mostrarErro(msg) {
    errorMessage.textContent = msg;
    errorAlert.classList.add('show');
    
    setTimeout(() => {
      errorAlert.classList.remove('show');
    }, 5000);
  }

  /* ===== FUNÇÃO: TOAST NOTIFICATION ===== */
  function showToast(message, type = 'error', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const icons = {
      success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
      error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
      warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
    };
    
    const titles = {
      success: 'Sucesso',
      error: 'Erro',
      warning: 'Atenção'
    };
    
    toast.innerHTML = `
      <div class="toast-icon">${icons[type]}</div>
      <div class="toast-content">
        <div class="toast-title">${titles[type]}</div>
        <div class="toast-message">${message}</div>
      </div>
      <div class="toast-progress"></div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
      toast.style.animation = 'slideInRight 0.4s ease reverse';
      setTimeout(() => toast.remove(), 400);
    }, duration);
  }

  /* ===== FUNÇÃO: PEGAR CIDADE VIA GEOLOCALIZAÇÃO ===== */
  async function pegarCidade(lat, lng) {
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await resp.json();
      return (data.address.city || data.address.town || data.address.village || '').toLowerCase();
    } catch (error) {
      console.error('Erro ao pegar cidade:', error);
      return null;
    }
  }

  /* ===== FUNÇÃO: PROCESSAR LOGIN ===== */
  async function processarLogin() {
    if (!currentUser || !currentPass) {
      mostrarErro('Usuário ou senha não preenchidos');
      showToast('Preencha todos os campos', 'warning');
      return;
    }

    // Verificar tentativas
    let attemptsData = JSON.parse(
      localStorage.getItem(`loginAttempts_${currentUser}`) || '{"count":0,"timeout":0}'
    );
    const now = Date.now();
    
    if (attemptsData.timeout && now < attemptsData.timeout) {
      const remaining = Math.ceil((attemptsData.timeout - now) / 1000);
      mostrarErro(`Muitas tentativas. Aguarde ${remaining} segundos.`);
      showToast(`Login bloqueado por ${remaining}s`, 'error');
      return;
    }

    const actionType = isVisitante ? 'voucher' : 'login';

    try {
      if (!isVisitante) {
        overlayAuth.classList.add('show');
      }

      const response = await fetch('https://proxy-apps-script.gab-oliveirab27.workers.dev/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: actionType,
          user: currentUser,
          pass: currentPass,
          local: localTentativa
        })
      });

      const result = await response.json();

      if (result.status === 'autorizado' || (result.ok && isVisitante)) {
        // Limpa tentativas
        localStorage.removeItem(`loginAttempts_${currentUser}`);

        // Cria sessão com permissão
         const serverStart = (typeof result.start === 'number' && isFinite(result.start)) ? result.start : Date.now();
        const serverDuration = (typeof result.duration === 'number') ? result.duration : undefined;

        const authSession = {
          user: result.user || currentUser,
          perm: (result.perm || (isVisitante ? 'voucher' : 'vendas')).toLowerCase(),
          fullName: result["Nome completo"] || result.nome || "",
          local: result.Local || result.local || localTentativa || "",
          cpf: result.CPF || result.cpf || "",
          filial: result.Filial || result.filial || "",
          start: serverStart,
          duration: (typeof serverDuration === 'number') ? serverDuration : (
            // fallback por perm caso GAS não retorne duration
            (function(perm){
              if (!perm) return 60*60*1000;
              perm = String(perm).toLowerCase();
              if (perm === 'voucher' || perm === 'visitante') return 5*60*1000;
              if (perm === 'crediario') return 4*60*60*1000;
              if (perm === 'vendas') return 3*60*60*1000;
              if (perm === 'faturamento') return 6*60*60*1000;
              if (['gerente','admin','suporte'].includes(perm)) return Infinity;
              return 60*60*1000;
            })( (result.perm || (isVisitante ? 'voucher' : 'vendas')).toLowerCase() )
          ),
          isVoucher: !!isVisitante || !!result.isVoucher || ((result.perm || '').toLowerCase() === 'voucher'),
          tipo: isVisitante ? 'voucher' : 'normal',
          lastActivity: Date.now()
        };

        // grava sem senha
        localStorage.setItem('authSession', JSON.stringify(authSession));

        if (isVisitante) {
          overlayAuth.classList.remove('show');
          modalVoucher.classList.add('show');
          
          // Animação de progresso
          let progress = 20;
          const circumference = 2 * Math.PI * 54;
          
          const interval = setInterval(() => {
            progress += Math.random() * 8;
            if (progress > 100) progress = 100;
            
            const offset = circumference * (1 - progress / 100);
            progressBar.style.strokeDashoffset = offset;
            progressText.textContent = `${Math.floor(progress)}%`;
            
            if (progress >= 100) {
              clearInterval(interval);
              setTimeout(() => {
                modalVoucher.classList.remove('show');
                window.location.href = 'pages/selectsetor.html';
              }, 500);
            }
          }, 200);

        } else {
          setTimeout(() => {
            overlayAuth.classList.remove('show');
            showToast('Login realizado com sucesso!', 'success', 2000);
            setTimeout(() => {
              window.location.href = 'pages/selectsetor.html';
            }, 1000);
          }, 800);
        }

      } else {
        overlayAuth.classList.remove('show');
        
        // Incrementa tentativas
        attemptsData.count = (attemptsData.count || 0) + 1;
        if (attemptsData.count >= 5) {
          attemptsData.timeout = now + 30000; // 30 segundos
        }
        localStorage.setItem(`loginAttempts_${currentUser}`, JSON.stringify(attemptsData));

        // Mensagens de erro
        if (result.motivo === 'localincorreto' || result.motivo === 'local-nao-permitido') {
          mostrarErro('Localização não permitida para este usuário');
          showToast('Acesso negado: localização não autorizada', 'error');
        } else if (result.motivo === 'senhaincorreta') {
          mostrarErro('Senha incorreta');
          showToast('Senha inválida. Tente novamente.', 'error');
        } else {
          mostrarErro(result.error || 'Credenciais inválidas');
          showToast('Não foi possível autenticar', 'error');
        }

        if (attemptsData.count >= 5) {
          showToast('5 tentativas excedidas. Aguarde 30 segundos.', 'warning', 5000);
        }
      }

    } catch (error) {
      overlayAuth.classList.remove('show');
      console.error('Erro na requisição:', error);
      mostrarErro('Falha na conexão com o servidor');
      showToast('Erro de rede. Verifique sua conexão.', 'error');
    } finally {
      loginBtn.classList.remove('loading');
    }
  }

  /* ===== FUNÇÃO: VALIDAR GEOLOCALIZAÇÃO ===== */
  async function validarGeolocalizacao() {
    try {
      if (!navigator.geolocation) {
        throw { code: 4, message: 'Navegador não suporta geolocalização' };
      }

      const pos = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          timeout: 8000,
          enableHighAccuracy: true
        });
      });

      const cidade = await pegarCidade(pos.coords.latitude, pos.coords.longitude);
      if (!cidade) {
        throw { code: 3, message: 'Não foi possível detectar a cidade' };
      }

      localTentativa = cidade;
      return true;

    } catch (error) {
      let msg = 'Não foi possível validar sua localização.';
      
      if (error.code === 1) {
        msg = 'Permissão de localização negada. Por favor, informe seu CEP.';
      } else if (error.code === 2) {
        msg = 'Localização indisponível. Por favor, informe seu CEP.';
      } else if (error.code === 3) {
        msg = 'Tempo esgotado ao obter localização. Por favor, informe seu CEP.';
      }

      mostrarErro(msg);
      showToast('Não foi possível obter sua localização', 'warning');
      return false;
    }
  }

  /* ===== FUNÇÃO: CONFIRMAR CEP ===== */
  async function confirmarCEP() {
    const cep = cepInput.value.replace(/\D/g, '');
    
    if (cep.length !== 8) {
      showToast('CEP inválido. Digite 8 números.', 'warning');
      cepInput.focus();
      return;
    }

    try {
      cepConfirm.disabled = true;
      cepConfirm.style.opacity = '0.6';
      
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await resp.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      localTentativa = data.localidade.toLowerCase();
      modalCEP.classList.remove('show');
      showToast(`Cidade detectada: ${data.localidade}`, 'success');
      
      setTimeout(() => processarLogin(), 500);

    } catch (error) {
      showToast(error.message || 'CEP inválido', 'error');
    } finally {
      cepConfirm.disabled = false;
      cepConfirm.style.opacity = '1';
    }
  }

  /* ===== FUNÇÃO: LOGIN PRINCIPAL ===== */
  async function login(e) {
    e.preventDefault();

    currentUser = inputUser.value.trim().toLowerCase();
    currentPass = inputPass.value.trim();

    if (!currentUser || !currentPass) {
      mostrarErro('Preencha usuário e senha');
      showToast('Todos os campos são obrigatórios', 'warning');
      return;
    }

    // Verificar tentativas antes de prosseguir
    let attemptsData = JSON.parse(
      localStorage.getItem(`loginAttempts_${currentUser}`) || '{"count":0,"timeout":0}'
    );
    const now = Date.now();
    
    if (attemptsData.timeout && now < attemptsData.timeout) {
      const remaining = Math.ceil((attemptsData.timeout - now) / 1000);
      showToast(`Login bloqueado por ${remaining}s`, 'error');
      return;
    }

    loginBtn.classList.add('loading');
    isVisitante = currentUser === 'visitante';

    // Validar geolocalização
    const geoOk = await validarGeolocalizacao();
    
    if (!geoOk && !isVisitante) {
      loginBtn.classList.remove('loading');
      modalCEP.classList.add('show');
      cepInput.focus();
      return;
    }

    // Se visitante e não conseguiu geo, tenta pegar CEP
    if (isVisitante && !localTentativa) {
      loginBtn.classList.remove('loading');
      modalCEP.classList.add('show');
      cepInput.focus();
      return;
    }

    // Processa login
    await processarLogin();
  }

  /* ===== MÁSCARA DE CEP ===== */
  cepInput.addEventListener('input', (e) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 5) {
      value = value.slice(0, 5) + '-' + value.slice(5, 8);
    }
    e.target.value = value;
  });

  /* ===== EVENT LISTENERS ===== */
  loginForm.addEventListener('submit', login);
  cepConfirm.addEventListener('click', confirmarCEP);
  
  cepInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      confirmarCEP();
    }
  });

  // Fechar modal CEP ao clicar fora
  modalCEP.addEventListener('click', (e) => {
    if (e.target === modalCEP) {
      modalCEP.classList.remove('show');
      loginBtn.classList.remove('loading');
    }
  });
});
