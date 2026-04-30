'use strict';
// ════════════════════════════════════════════════════════════════════════
//  MOB-JSON.JS v2 — Enviar JSON para a cloud (desktop)
//  Lê de localStorage["cartazes_salvos"] pois products é let (não window)
// ════════════════════════════════════════════════════════════════════════

(function MobJSON() {

  const WORKER_URL = 'https://json-cartazes.gab-oliveirab27.workers.dev/json';

  function _getCartazes() {
    try {
      const raw = localStorage.getItem('cartazes_salvos');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed?.cartazes) ? parsed.cartazes : [];
    } catch (e) { return []; }
  }

  function _injectCSS() {
    if (document.getElementById('mj-styles')) return;
    const s = document.createElement('style');
    s.id = 'mj-styles';
    s.textContent = `
.mj-nav-btn {
  width:100%;display:flex;align-items:center;gap:12px;
  padding:12px 16px;margin-bottom:8px;
  border:1.5px dashed rgba(16,185,129,.5);
  background:linear-gradient(135deg,rgba(16,185,129,.07),rgba(5,150,105,.04));
  border-radius:8px;color:#065f46;cursor:pointer;
  transition:all .2s;font-size:14px;font-weight:600;text-align:left;
}
.mj-nav-btn:hover{background:linear-gradient(135deg,rgba(16,185,129,.16),rgba(5,150,105,.1));border-color:#10b981;transform:translateX(2px);box-shadow:0 2px 10px rgba(16,185,129,.15);}
.mj-nav-btn i{font-size:15px;color:#10b981;}
[data-theme="dark"] .mj-nav-btn{color:#6ee7b7;border-color:rgba(52,211,153,.35);background:linear-gradient(135deg,rgba(16,185,129,.1),rgba(5,150,105,.06));}
[data-theme="dark"] .mj-nav-btn:hover{background:linear-gradient(135deg,rgba(16,185,129,.18),rgba(5,150,105,.12));border-color:#34d399;}

#mj-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.72);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);z-index:11000;align-items:center;justify-content:center;padding:24px;}
#mj-overlay.open{display:flex;}

.mj-card{background:white;border-radius:20px;padding:36px 32px 28px;width:min(420px,92vw);box-shadow:0 32px 80px rgba(0,0,0,.3);display:flex;flex-direction:column;align-items:center;animation:mjCardIn .38s cubic-bezier(.16,1,.3,1);}
@keyframes mjCardIn{from{opacity:0;transform:scale(.88) translateY(16px)}to{opacity:1;transform:scale(1) translateY(0)}}
[data-theme="dark"] .mj-card{background:#1e293b;}

.mj-steps{display:flex;align-items:center;width:100%;margin-bottom:32px;}
.mj-step{display:flex;flex-direction:column;align-items:center;gap:7px;}
.mj-step-dot{width:40px;height:40px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;background:#f1f5f9;color:#94a3b8;border:2px solid #e2e8f0;transition:all .38s cubic-bezier(.16,1,.3,1);}
.mj-step-dot.active{background:#eff6ff;color:#2563eb;border-color:#2563eb;animation:mjPulse 1.8s ease-in-out infinite;}
.mj-step-dot.done{background:#10b981;color:#fff;border-color:#10b981;animation:mjPop .4s cubic-bezier(.16,1,.3,1);}
.mj-step-dot.done i{display:none;}
.mj-step-dot.done::after{content:'✓';font-size:16px;font-weight:800;}
.mj-step-dot.err{background:#fef2f2;color:#ef4444;border-color:#ef4444;animation:mjShake .45s ease;}
.mj-step-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94a3b8;white-space:nowrap;}
.mj-step-lbl.active{color:#2563eb;}.mj-step-lbl.done{color:#10b981;}.mj-step-lbl.err{color:#ef4444;}
.mj-step-line{flex:1;height:2px;background:#e2e8f0;margin:0 6px;margin-bottom:27px;max-width:60px;transition:background .4s ease .1s;}
.mj-step-line.done{background:#10b981;}
[data-theme="dark"] .mj-step-dot{background:#334155;color:#64748b;border-color:#475569;}
[data-theme="dark"] .mj-step-dot.active{background:#1e3a5f;color:#60a5fa;border-color:#3b82f6;}
[data-theme="dark"] .mj-step-line{background:#334155;}

@keyframes mjPulse{0%,100%{box-shadow:0 0 0 0 rgba(37,99,235,.35)}50%{box-shadow:0 0 0 8px rgba(37,99,235,0)}}
@keyframes mjPop{0%{transform:scale(.5)}60%{transform:scale(1.2)}100%{transform:scale(1)}}
@keyframes mjShake{0%,100%{transform:translateX(0)}25%{transform:translateX(-7px)}75%{transform:translateX(7px)}}

.mj-icon{width:88px;height:88px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;margin-bottom:20px;transition:background .3s,color .3s;position:relative;}
.mj-icon.preparing{background:#eff6ff;color:#2563eb;}
.mj-icon.sending{background:#f0fdf4;color:#059669;}
.mj-icon.success{background:#d1fae5;color:#059669;animation:mjPop .5s cubic-bezier(.16,1,.3,1);}
.mj-icon.error{background:#fef2f2;color:#ef4444;animation:mjShake .5s ease;}
.mj-icon.preparing::before,.mj-icon.preparing::after{content:'';position:absolute;inset:0;border-radius:50%;border:2px solid #2563eb;opacity:0;animation:mjRipple 1.8s ease-out infinite;}
.mj-icon.preparing::after{animation-delay:.7s;}
@keyframes mjRipple{0%{transform:scale(.85);opacity:.45}100%{transform:scale(1.5);opacity:0}}
.mj-icon.sending::before{content:'';position:absolute;inset:-5px;border-radius:50%;border:3px solid transparent;border-top-color:#10b981;border-right-color:#10b981;animation:mjSpin .85s linear infinite;}
@keyframes mjSpin{to{transform:rotate(360deg)}}
.mj-icon.sending i{animation:mjFloat 1.3s ease-in-out infinite;}
@keyframes mjFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}

.mj-title{font-size:19px;font-weight:800;color:#111827;letter-spacing:-.025em;text-align:center;margin-bottom:8px;}
.mj-sub{font-size:13px;color:#6b7280;text-align:center;line-height:1.5;margin-bottom:24px;}
[data-theme="dark"] .mj-title{color:#f1f5f9;}[data-theme="dark"] .mj-sub{color:#94a3b8;}

.mj-detail{padding:7px 16px;border-radius:20px;font-size:12px;font-weight:600;color:#059669;background:#d1fae5;margin-bottom:20px;opacity:0;max-height:0;overflow:hidden;transition:opacity .3s,max-height .3s,margin .3s;}
.mj-detail.show{opacity:1;max-height:50px;}

.mj-actions{display:flex;gap:10px;width:100%;flex-direction:column;}
.mj-btn-prim{width:100%;padding:12px;background:linear-gradient(135deg,#2563eb,#1d4ed8);border:none;border-radius:8px;font-size:14px;font-weight:700;color:white;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 3px 10px rgba(37,99,235,.25);}
.mj-btn-prim:hover{transform:translateY(-1px);box-shadow:0 5px 16px rgba(37,99,235,.35);}
.mj-btn-sec{width:100%;padding:11px;border:1.5px solid #e5e7eb;background:white;border-radius:8px;font-size:13px;font-weight:600;color:#374151;cursor:pointer;transition:all .18s;display:flex;align-items:center;justify-content:center;gap:8px;}
.mj-btn-sec:hover{background:#f9fafb;border-color:#d1d5db;}
[data-theme="dark"] .mj-btn-sec{background:#273449;border-color:#334155;color:#cbd5e1;}
[data-theme="dark"] .mj-btn-sec:hover{background:#334155;}
`;
    document.head.appendChild(s);
  }

  function _buildOverlay() {
    if (document.getElementById('mj-overlay')) return;
    const el = document.createElement('div');
    el.id = 'mj-overlay';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <div class="mj-card">
        <div class="mj-steps">
          <div class="mj-step">
            <div class="mj-step-dot active" id="mj-dot-1"><i class="fa-solid fa-box-open"></i></div>
            <span class="mj-step-lbl active" id="mj-lbl-1">Preparar</span>
          </div>
          <div class="mj-step-line" id="mj-line-1"></div>
          <div class="mj-step">
            <div class="mj-step-dot" id="mj-dot-2"><i class="fa-solid fa-cloud-arrow-up"></i></div>
            <span class="mj-step-lbl" id="mj-lbl-2">Enviar</span>
          </div>
          <div class="mj-step-line" id="mj-line-2"></div>
          <div class="mj-step">
            <div class="mj-step-dot" id="mj-dot-3"><i class="fa-solid fa-circle-check"></i></div>
            <span class="mj-step-lbl" id="mj-lbl-3">Concluído</span>
          </div>
        </div>
        <div class="mj-icon preparing" id="mj-icon">
          <i class="fa-solid fa-box-open" id="mj-icon-i"></i>
        </div>
        <div class="mj-title" id="mj-title">Preparando envio</div>
        <div class="mj-sub" id="mj-sub">Aguarde…</div>
        <div class="mj-detail" id="mj-detail"></div>
        <div class="mj-actions" id="mj-actions" style="display:none"></div>
      </div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target === el) _close(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && el.classList.contains('open')) _close();
    });
  }

  function _setState(stage, data = {}) {
    const icon = document.getElementById('mj-icon');
    const iconI = document.getElementById('mj-icon-i');
    const title = document.getElementById('mj-title');
    const sub = document.getElementById('mj-sub');
    const detail = document.getElementById('mj-detail');
    const actions = document.getElementById('mj-actions');
    const D = n => ({ dot: document.getElementById(`mj-dot-${n}`), lbl: document.getElementById(`mj-lbl-${n}`) });
    const L = n => document.getElementById(`mj-line-${n}`);
    const done  = n => { D(n).dot.className='mj-step-dot done';  D(n).lbl.className='mj-step-lbl done'; };
    const act   = n => { D(n).dot.className='mj-step-dot active'; D(n).lbl.className='mj-step-lbl active'; };
    const err   = n => { D(n).dot.className='mj-step-dot err';   D(n).lbl.className='mj-step-lbl err'; };
    const idle  = n => { D(n).dot.className='mj-step-dot';       D(n).lbl.className='mj-step-lbl'; };
    detail.classList.remove('show');
    actions.style.display = 'none'; actions.innerHTML = '';
    switch (stage) {
      case 'preparing':
        act(1); idle(2); idle(3);
        icon.className='mj-icon preparing'; iconI.className='fa-solid fa-box-open';
        title.textContent='Preparando envio'; sub.textContent=`${data.count||0} cartaz(es) em fila…`;
        break;
      case 'sending':
        done(1); act(2); idle(3); L(1).classList.add('done');
        icon.className='mj-icon sending'; iconI.className='fa-solid fa-cloud-arrow-up';
        title.textContent='Enviando para o servidor'; sub.textContent='Transmitindo para o Google Drive…';
        break;
      case 'success':
        done(1); done(2); done(3); L(1).classList.add('done'); L(2).classList.add('done');
        icon.className='mj-icon success'; iconI.className='fa-solid fa-circle-check';
        title.textContent='Enviado com sucesso!'; sub.textContent=`${data.count||0} cartaz(es) registrado(s)`;
        if (data.fileName) { detail.textContent=`📄 ${data.fileName}`; detail.classList.add('show'); }
        actions.style.display='flex';
        actions.innerHTML=`<button class="mj-btn-prim" onclick="window._MobJSON.close()"><i class="fa-solid fa-check"></i> Concluído</button>`;
        break;
      case 'error':
        done(1); done(2); err(3); L(1).classList.add('done'); L(2).classList.add('done');
        icon.className='mj-icon error'; iconI.className='fa-solid fa-triangle-exclamation';
        title.textContent='Falha no envio'; sub.textContent=data.message||'Verifique sua conexão.';
        actions.style.display='flex';
        actions.innerHTML=`
          <button class="mj-btn-prim" onclick="window._MobJSON.retry()"><i class="fa-solid fa-rotate-right"></i> Tentar novamente</button>
          <button class="mj-btn-sec" onclick="window._MobJSON.close()"><i class="fa-solid fa-xmark"></i> Fechar</button>`;
        break;
    }
  }

  function _open()  { document.getElementById('mj-overlay')?.classList.add('open'); }
  function _close() { document.getElementById('mj-overlay')?.classList.remove('open'); }
  function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  function _buildPayload(cartazes, user, filial) {
    return {
      user, filial,
      data: {
        versao: '1.0', origem: 'desktop',
        dataGeracao: new Date().toISOString(),
        totalCartazes: cartazes.length,
        cartazes: cartazes.map(item => ({
          id: item.id, codigo: item.codigo,
          descricao: item.descricao, subdescricao: item.subdescricao||'',
          features: item.features||[], metodo: item.metodo,
          juros: item.juros||'', avista: item.avista, parcela: item.parcela||0,
          motivo: item.motivo||'', validade: item.validade||'',
          validadeInicio: item.validadeInicio||'', autorizacao: item.autorizacao||'',
          campanha: item.campanha||'',
          garantia12: item.garantia12||0, garantia24: item.garantia24||0, garantia36: item.garantia36||0,
          modelo: item.modelo||'padrao', semJuros: item.semJuros||false,
          negritoSubdesc: item.negritoSubdesc||false, moverValidade: item.moverValidade||false,
          layoutPersonalizado: item.layoutPersonalizado||'', posicaoGarantia: item.posicaoGarantia||'hp',
        }))
      }
    };
  }

  async function _enviar() {
    const cartazes = _getCartazes();
    if (!cartazes.length) {
      if (typeof showToast === 'function')
        showToast('warning', 'Nenhum cartaz', 'Adicione cartazes antes de enviar.');
      return;
    }
    let user = '', filial = '';
    try {
      const sess = JSON.parse(localStorage.getItem('authSession') || '{}');
      user   = String(sess.user   || sess.username || sess.email || '').trim();
      filial = String(sess.filial || sess.branch   || sess.store || '').trim();
    } catch (e) {}
    if (!user || !filial) {
      if (typeof showToast === 'function')
        showToast('error', 'Sessão inválida', `user: "${user||'?'}"  filial: "${filial||'?'}" — faça login.`);
      return;
    }
    _open();
    _setState('preparing', { count: cartazes.length });
    await _sleep(700);
    _setState('sending');
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 18000);
    try {
      const resp = await fetch(WORKER_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(_buildPayload(cartazes, user, filial)), signal: ctrl.signal,
      });
      clearTimeout(tid);
      const text = await resp.text();
      let parsed = null; try { parsed = JSON.parse(text); } catch(e) {}
      if (!resp.ok) throw new Error(parsed?.error || `HTTP ${resp.status}`);
      await _sleep(350);
      _setState('success', { count: cartazes.length, fileName: parsed?.fileName||null });
      if (typeof showToast === 'function')
        showToast('success', 'Enviado!', `${cartazes.length} cartaz(es) enviados ao Drive.`, 4000);
    } catch (err) {
      clearTimeout(tid);
      await _sleep(300);
      _setState('error', { message: err.name==='AbortError' ? 'Tempo esgotado — servidor lento.' : (err.message||'Erro desconhecido') });
      if (typeof showToast === 'function')
        showToast('error', 'Falha no envio', err.message||'Erro desconhecido');
    }
  }

  function _injectButton() {
    if (document.getElementById('btn-mob-json')) return;
    const btn = document.createElement('button');
    btn.id = 'btn-mob-json';
    btn.className = 'nav-item mj-nav-btn';
    btn.setAttribute('aria-label', 'Enviar JSON para a cloud');
    btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i><span>Enviar JSON para cloud</span>`;
    btn.addEventListener('click', _enviar);
    const ref = document.getElementById('btn-primeiros-passos') || document.getElementById('btn-campos-obrigatorios');
    if (ref?.parentNode) ref.parentNode.insertBefore(btn, ref.nextSibling);
    else document.querySelector('.sidebar-nav')?.appendChild(btn);
  }

  window._MobJSON = { close: _close, retry: () => { _close(); setTimeout(_enviar, 180); }, send: _enviar };

  function _boot() {
    _injectCSS(); _buildOverlay(); _injectButton();
    console.log('✅ mob-json.js v2 — lê localStorage["cartazes_salvos"].');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', _boot);
  else _boot();
}());