/* ===== IMAGE DOWNLOAD MANAGER ===== */
(function() {
  'use strict';

  const isInSubfolder = window.location.pathname.includes('/suporte/');
  const imagePath = isInSubfolder ? '../image/' : './image/';

  const IMAGES = [
    { id: 'logo-simple', name: 'Logo Simples', file: 'logo.png', path: imagePath + 'logo.png' },
    { id: 'logo-zenir', name: 'Logo Zenir', file: 'zenirlogo.png', path: imagePath + 'zenirlogo.png' },
    { id: 'logo-completa', name: 'Logo Completa', file: 'logocompleta.png', path: imagePath + 'logocompleta.png' }
  ];

  /* ===== DEV ACCESS PANEL ===== */
  window.showImageDownloadPanel = function() {
    const container = document.querySelector('.login-container');
    if (!container) return;

    const panel = document.createElement('div');
    panel.id = '_imagePanel';
    panel.style.cssText = `
      position: absolute; inset: 0;
      background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
      border-radius: 20px; padding: 36px 28px;
      transform: rotateY(180deg);
      backface-visibility: hidden;
      z-index: 12; overflow-y: auto;
    `;

    let html = `
      <style>
        @keyframes _imgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
        #_imagePanel .img-header { text-align:center; margin-bottom:24px; animation:_imgIn .3s ease; }
        #_imagePanel .img-badge {
          display:inline-flex; align-items:center; gap:6px; padding:3px 12px;
          background:rgba(168,85,247,.15); border:1px solid rgba(168,85,247,.35);
          border-radius:20px; font-size:11px; font-weight:700; color:#d8b4fe;
          text-transform:uppercase; letter-spacing:.8px; margin-bottom:12px;
        }
        #_imagePanel h3 { font-size:21px; font-weight:700; color:#e2e8f0; margin-bottom:4px; }
        #_imagePanel .img-sub { font-size:13px; color:#64748b; }
        .img-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:12px; margin-bottom:20px; }
        .img-item { display:flex; flex-direction:column; align-items:center; padding:12px;
          background:#0f172a; border:2px solid #1e293b; border-radius:10px; transition:all .2s ease;
          text-align:center; animation:_imgIn .3s ease both; }
        .img-item:nth-child(1){animation-delay:.05s} .img-item:nth-child(2){animation-delay:.1s} .img-item:nth-child(3){animation-delay:.15s}
        .img-item:hover { border-color:#334155; background:#1a2234; transform:translateX(4px); }
        .img-preview { width:100%; height:70px; margin-bottom:8px; display:flex; align-items:center; justify-content:center;
          background:#1a2234; border-radius:6px; overflow:hidden; }
        .img-preview img { max-width:100%; max-height:100%; object-fit:contain; }
        .img-name { font-size:13px; font-weight:600; color:#e2e8f0; margin-bottom:3px; }
        .img-file { font-size:11px; color:#64748b; margin-bottom:8px; }
        .img-download-btn { width:100%; padding:6px 10px; background:linear-gradient(135deg,#a855f7,#7c3aed);
          border:none; border-radius:6px; color:#fff; font-size:12px; font-weight:600; cursor:pointer; transition:all .2s ease; }
        .img-download-btn:hover { transform:translateY(-2px); box-shadow:0 4px 12px rgba(168,85,247,.4); }
        .img-hr { border:none; border-top:1px solid #1e293b; margin:16px 0; }
        .img-cancel { width:100%; padding:12px; border:2px solid #334155; border-radius:12px; background:transparent;
          color:#64748b; font-size:14px; font-weight:600; cursor:pointer; transition:all .2s ease; font-family:inherit;
          animation:_imgIn .3s ease .2s both; }
        .img-cancel:hover { background:#1e293b; color:#94a3b8; border-color:#475569; }
      </style>

      <div class="img-header">
        <div class="img-badge">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          Logotipos
        </div>
        <h3>
          <svg viewBox="0 0 24 24" fill="none" stroke="#d8b4fe" stroke-width="2" width="18" height="18" style="vertical-align:middle;margin-right:6px;margin-top:-3px">
            <path d="M9 3H5a2 2 0 0 0-2 2v4m6-6h10a2 2 0 0 1 2 2v4M9 3v18m0 0h10a2 2 0 0 0 2-2v-4M9 21H5a2 2 0 0 1-2-2v-4m0 0h18"></path>
          </svg>
          Baixar Logotipos
        </h3>
        <p class="img-sub">Escolha qual imagem deseja baixar</p>
      </div>

      <div class="img-grid">
    `;

    IMAGES.forEach(img => {
      html += `
        <div class="img-item">
          <div class="img-preview">
            <img src="${img.path}" alt="${img.name}">
          </div>
          <div class="img-name">${img.name}</div>
          <div class="img-file">${img.file}</div>
          <button class="img-download-btn" onclick="window.downloadImageFromDevAccess('${img.path}', '${img.file}')">
            ⬇️ Baixar
          </button>
        </div>
      `;
    });

    html += `
      </div>
      <hr class="img-hr">
      <button class="img-cancel" onclick="window._closeDevPanel()">Voltar</button>
    `;

    panel.innerHTML = html;
    container.appendChild(panel);
  };

  window.downloadImageFromDevAccess = function(filePath, filename) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  /* ===== SUPPORT CHAT POPUP ===== */
  window.showImageDownloadPopup = function() {
    const existing = document.getElementById('imageDownloadPopup');
    if (existing) existing.remove();

    const popup = document.createElement('div');
    popup.id = 'imageDownloadPopup';
    popup.style.cssText = `position:fixed;top:0;left:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;z-index:99999;padding:20px;box-sizing:border-box;`;

    const overlay = document.createElement('div');
    overlay.style.cssText = `position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);cursor:pointer;`;

    const container = document.createElement('div');
    container.style.cssText = `position:relative;background:white;border-radius:8px;box-shadow:0 5px 20px rgba(0,0,0,0.3);max-width:500px;width:100%;max-height:80vh;overflow-y:auto;z-index:100000;padding:0;`;

    const header = document.createElement('div');
    header.style.cssText = `display:flex;justify-content:space-between;align-items:center;padding:15px 20px;border-bottom:1px solid #ddd;flex-shrink:0;`;

    const title = document.createElement('h3');
    title.textContent = 'Baixar Imagens';
    title.style.cssText = `margin:0;font-size:18px;color:#333;font-weight:600;`;

    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `background:none;border:none;font-size:24px;cursor:pointer;color:#666;padding:0;`;

    header.appendChild(title);
    header.appendChild(closeBtn);

    const content = document.createElement('div');
    content.style.cssText = `padding:15px 20px;`;

    const subtitle = document.createElement('p');
    subtitle.textContent = 'Selecione a imagem que deseja baixar:';
    subtitle.style.cssText = `margin:0 0 15px 0;color:#666;font-size:13px;`;

    const grid = document.createElement('div');
    grid.style.cssText = `display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;`;

    IMAGES.forEach(img => {
      const card = document.createElement('div');
      card.style.cssText = `display:flex;flex-direction:column;align-items:center;padding:10px;border:1px solid #ddd;border-radius:4px;text-align:center;`;

      const preview = document.createElement('div');
      preview.style.cssText = `width:100%;height:80px;margin-bottom:8px;display:flex;align-items:center;justify-content:center;background:#f8f8f8;border-radius:3px;overflow:hidden;`;

      const img_el = document.createElement('img');
      img_el.src = img.path;
      img_el.alt = img.name;
      img_el.style.cssText = `max-width:100%;max-height:100%;object-fit:contain;`;
      preview.appendChild(img_el);

      const name = document.createElement('h4');
      name.textContent = img.name;
      name.style.cssText = `margin:6px 0 3px 0;font-size:13px;color:#333;font-weight:600;`;

      const filename = document.createElement('p');
      filename.textContent = img.file;
      filename.style.cssText = `margin:0 0 8px 0;font-size:11px;color:#999;word-break:break-all;`;

      const downloadBtn = document.createElement('button');
      downloadBtn.textContent = '⬇️ Baixar';
      downloadBtn.style.cssText = `width:100%;padding:6px 10px;background:#0052cc;color:white;border:none;border-radius:3px;font-size:12px;font-weight:600;cursor:pointer;`;

      downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = img.path;
        link.download = img.file;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };

      card.appendChild(preview);
      card.appendChild(name);
      card.appendChild(filename);
      card.appendChild(downloadBtn);
      grid.appendChild(card);
    });

    content.appendChild(subtitle);
    content.appendChild(grid);
    container.appendChild(header);
    container.appendChild(content);
    popup.appendChild(overlay);
    popup.appendChild(container);
    document.body.appendChild(popup);

    closeBtn.onclick = () => popup.remove();
    overlay.onclick = () => popup.remove();
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.getElementById('imageDownloadPopup')) {
        popup.remove();
      }
    });
  };

  window.showImageDownloadInChat = function() {
    if (!window.addChatMessage) return;
    const messageHTML = `
      <div class="image-download-message">
        <p>Aqui estão as imagens disponíveis para download:</p>
        <div class="image-download-options">
          ${IMAGES.map(img => `<button class="chat-image-btn" onclick="window.downloadImageFromChat('${img.path}', '${img.file}')">📥 ${img.name} (${img.file})</button>`).join('')}
        </div>
        <button class="chat-image-popup-btn" onclick="window.showImageDownloadPopup()">🖼️ Ver todas as imagens</button>
      </div>
    `;
    window.addChatMessage(messageHTML, 'bot');
  };

  window.downloadImageFromChat = function(filePath, filename) {
    const link = document.createElement('a');
    link.href = filePath;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

})();
