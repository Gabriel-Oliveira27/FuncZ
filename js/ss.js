/* CONFIG */
const IDLE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutos
const DEFAULT_TOAST_DURATION = 3000;

// OpenWeather API key (fornecida)
const OPENWEATHER_KEY = '7dcc8dd07bbafc102b2844c88b1dc6b8';

// Feeds
const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json?rss_url=';
const G1_GERAL_RSS = 'https://g1.globo.com/rss/g1/';
const G1_ESPORTES_RSS = 'https://g1.globo.com/rss/g1/esportes/';

// Sua Google Apps Script para contar produtos (coloque sua URL)
const GAS_PRODUCTS_URL = 'https://script.google.com/macros/s/AKfycbzDpyIIi3x1Hu8Ro4w2yPMH8Ro9FUL3q6_CypQrgTEMZphWJzVJBLiP-TqKtkh6xY8a/exec';

/* Permissões */
const permissionsMap = {
  vendedor: ["vendas"],
  fat: ["vendas", "faturamento", "crediario"],
  ger: ["vendas", "faturamento", "crediario", "cartazista"],
  cred: ["vendas", "crediario"],
  admin: ["vendas", "faturamento", "crediario", "cartazista", "admin"],
  suporte: ["vendas", "faturamento", "crediario", "cartazista", "admin"]
};

/* Fallbacks locais */
const fallbackQuotes = [
  "O sucesso é a soma de pequenos esforços repetidos dia após dia.",
  "Acredite em si mesmo e tudo será possível.",
  "O único lugar onde o sucesso vem antes do trabalho é no dicionário.",
  "Grandes conquistas requerem tempo e dedicação.",
  "A persistência é o caminho do êxito.",
  "O futuro pertence àqueles que acreditam na beleza de seus sonhos."
];

/* UTIL helpers */
function $(sel) { return document.querySelector(sel); }
function $all(sel) { return Array.from(document.querySelectorAll(sel)); }
function escapeHtml(str) { if (str === null || typeof str === 'undefined') return ''; return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

/* -- new helpers to store/retrieve coords -- */
function getStoredCoords() {
  try {
    const raw = localStorage.getItem('ss_lastCoords');
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (obj && typeof obj.lat === 'number' && typeof obj.lon === 'number') return obj;
    return null;
  } catch (e) { return null; }
}
function setStoredCoords(lat, lon) {
  try {
    localStorage.setItem('ss_lastCoords', JSON.stringify({ lat: Number(lat), lon: Number(lon), ts: Date.now() }));
  } catch (e) { /* ignore */ }
}
/* wrapper to get current position as promise */
function getCurrentPositionPromise(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error('Geolocalização não disponível'));
    navigator.geolocation.getCurrentPosition((pos) => {
      resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, (err) => {
      reject(err || new Error('erro na geolocalização'));
    }, options);
  });
}

/* TOAST (barra + X) */
function ensureToastContainer() {
  let c = document.getElementById('toast-container');
  if (!c) {
    c = document.createElement('div');
    c.id = 'toast-container';
    c.setAttribute('aria-live', 'polite');
    c.style.position = 'fixed';
    c.style.top = '1rem';
    c.style.right = '1rem';
    c.style.zIndex = 9999;
    c.style.display = 'flex';
    c.style.flexDirection = 'column';
    c.style.gap = '0.6rem';
    document.body.appendChild(c);
  }
  return c;
}
function showToast(message, type = 'info', duration = 3000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  };
  
  const titles = {
    success: 'Sucesso',
    error: 'Erro',
    warning: 'Atenção',
    info: 'Informação'
  };
  
  toast.innerHTML = `
    <div class="toast-icon">${icons[type]}</div>
    <div class="toast-content">
      <div class="toast-title">${titles[type]}</div>
      <div class="toast-message">${escapeHtml(String(message))}</div>
    </div>
    <div class="toast-progress"></div>
  `;
  
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideInRight 0.4s ease reverse';
    setTimeout(() => toast.remove(), 400);
  }, duration);

  return { element: toast, close: () => toast.remove() };
}

/* AUTH helpers */
function readAuthSession() {
  const raw = localStorage.getItem('authSession') || localStorage.getItem('auth');
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (err) { console.warn('readAuthSession parse error', err); return null; }
}
function firstName(fullName) { if (!fullName) return ''; return String(fullName).trim().split(/\s+/)[0]; }

/* OpenWeather helpers */
async function fetchWeatherByCoords(lat, lon, timeoutMs = 9000) {
  if (!OPENWEATHER_KEY) throw new Error('OpenWeather key not configured');
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&units=metric&lang=pt_br&appid=${OPENWEATHER_KEY}`;
  return fetchWithTimeout(url, {}, timeoutMs).then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(parseOpenWeather);
}
async function fetchWeatherByCityName(city, timeoutMs = 9000) {
  if (!OPENWEATHER_KEY) throw new Error('OpenWeather key not configured');
  if (!city) return null;
  const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&lang=pt_br&appid=${OPENWEATHER_KEY}`;
  return fetchWithTimeout(url, {}, timeoutMs).then(r => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).then(parseOpenWeather);
}
function parseOpenWeather(j) {
  if (!j) return null;
  const temp = j.main && typeof j.main.temp !== 'undefined' ? Math.round(j.main.temp) : null;
  const condition = j.weather && j.weather[0] && j.weather[0].description ? j.weather[0].description : '';
  const icon = j.weather && j.weather[0] && j.weather[0].icon ? j.weather[0].icon : '';
  const name = j.name || '';
  return { temp, condition, icon, name, raw: j };
}

/* generic fetch with timeout */
function fetchWithTimeout(url, opts = {}, timeoutMs = 8000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    fetch(url, opts).then(res => {
      clearTimeout(timer);
      resolve(res);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/* NEWS fetch + render (G1 via rss2json) */
async function fetchG1Headlines(limit = 6, feed = 'geral') {
  const rssUrl = (feed === 'futebol') ? G1_ESPORTES_RSS : G1_GERAL_RSS;
  const url = `${RSS2JSON_BASE}${encodeURIComponent(rssUrl)}`;
  try {
    const r = await fetchWithTimeout(url, {}, 8000);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const j = await r.json();
    if (!j || !j.items) return [];
    const items = j.items.map(it => ({
      title: it.title || '',
      link: it.link || '',
      pubDate: it.pubDate || '',
      description: it.description || it.content || ''
    })).slice(0, limit);
    return items;
  } catch (err) {
    console.warn('fetchG1Headlines failed', err);
    // fallback: try raw XML (may be CORS blocked)
    try {
      const rawRss = await fetchWithTimeout(rssUrl, {}, 8000);
      if (!rawRss.ok) throw new Error('raw RSS HTTP ' + rawRss.status);
      const text = await rawRss.text();
      const parser = new DOMParser();
      const xml = parser.parseFromString(text, 'application/xml');
      const itemsNodes = Array.from(xml.querySelectorAll('item')).slice(0, limit);
      const items = itemsNodes.map(node => {
        const title = node.querySelector('title') ? node.querySelector('title').textContent : '';
        const link = node.querySelector('link') ? node.querySelector('link').textContent : '';
        const description = node.querySelector('description') ? node.querySelector('description').textContent : '';
        return { title, link, description };
      });
      return items;
    } catch (err2) {
      console.warn('fetchG1Headlines fallback failed', err2);
      return [];
    }
  }
}

/* ensure news loader (uses your .waiter CSS) */
function ensureNewsLoaderExists() {
  let loader = document.getElementById('newsLoader');
  if (!loader) {
    loader = document.createElement('div');
    loader.id = 'newsLoader';
    loader.style.display = 'none';
    loader.style.margin = '0 auto';
    loader.innerHTML = `<div class="waiter" aria-hidden="true" style="width:40px;height:60px;"></div>`;
    const newsText = document.getElementById('newsText');
    if (newsText && newsText.parentElement) newsText.parentElement.appendChild(loader);
    else {
      const lockInfo = document.querySelector('.lock-info-grid .lock-info-card:nth-child(2)') || document.body;
      lockInfo.appendChild(loader);
    }
  }
  return loader;
}

/* render news */
async function renderNews(mode = 'geral') {
  const newsText = document.getElementById('newsText');
  const newsList = document.getElementById('newsList');
  const loader = ensureNewsLoaderExists();
  if (loader) loader.style.display = 'inline-block';
  if (newsText) newsText.style.display = 'none';
  if (newsList) { newsList.innerHTML = ''; newsList.style.display = 'none'; }

  try {
    const items = await Promise.race([
      fetchG1Headlines(6, mode),
      new Promise((_, rej) => setTimeout(() => rej(new Error('timeout news')), 8000))
    ]);
    if (!items || items.length === 0) {
      if (newsText) { newsText.textContent = 'Sem notícias no momento'; newsText.style.display = 'block'; }
      return;
    }
    if (newsList) {
      items.forEach(it => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = it.link || '#';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        a.textContent = it.title || (it.description ? it.description.slice(0, 80) : 'Sem título');
        li.appendChild(a);
        newsList.appendChild(li);
      });
      newsList.style.display = '';
      if (newsText) newsText.style.display = 'none';
    } else {
      if (newsText) {
        newsText.innerHTML = `<a href="${escapeHtml(items[0].link || '#')}" target="_blank" rel="noopener noreferrer">${escapeHtml(items[0].title || 'Sem título')}</a>`;
        newsText.style.display = 'block';
      }
    }
  } catch (err) {
    console.warn('renderNews fail', err);
    if (newsText) { newsText.textContent = 'Sem notícias no momento'; newsText.style.display = 'block'; }
  } finally {
    if (loader) loader.style.display = 'none';
  }
}
async function renderFootballSummary() {
  await renderNews('futebol');
  const newsList = document.getElementById('newsList');
  if (!newsList) return;
  $all('#newsList a').forEach(a => {
    const t = a.textContent || '';
    if (/\d\s*[xX-]\s*\d/.test(t)) a.style.fontWeight = '700';
  });
}

/* =========================
   PRODUCT COUNT from GAS
   ========================= */
async function fetchProductCountFromGAS(url = GAS_PRODUCTS_URL, timeoutMs = 12000) {
  if (!url) return { count: null, reason: 'URL não configurada' };
  try {
    const r = await fetchWithTimeout(url, {}, timeoutMs);
    if (!r.ok) return { count: null, reason: 'HTTP ' + r.status };
    const j = await r.json();
    const codes = new Set();

    function collectFromArrayOfArrays(arr) {
      arr.forEach(row => {
        if (Array.isArray(row) && row.length > 0) {
          const val = String(row[0]).trim();
          if (val) codes.add(val);
        }
      });
    }
    function collectFromArrayOfObjects(arr) {
      arr.forEach(obj => {
        if (!obj || typeof obj !== 'object') return;
        const keys = Object.keys(obj);
        const prefer = keys.find(k => /cod|codigo|code|produto/i.test(k));
        let val = null;
        if (prefer) val = obj[prefer];
        else if (keys.length) val = obj[keys[0]];
        if (typeof val !== 'undefined' && val !== null) {
          const s = String(val).trim();
          if (s) codes.add(s);
        }
      });
    }

    if (Array.isArray(j)) {
      if (j.length && Array.isArray(j[0])) {
        collectFromArrayOfArrays(j);
      } else if (j.length && typeof j[0] === 'object') {
        collectFromArrayOfObjects(j);
      } else {
        j.forEach(v => { if (v) codes.add(String(v).trim()); });
      }
    } else if (typeof j === 'object') {
      const arrays = Object.values(j).filter(v => Array.isArray(v));
      if (arrays.length) {
        arrays.forEach(arr => {
          if (arr.length && Array.isArray(arr[0])) collectFromArrayOfArrays(arr);
          else if (arr.length && typeof arr[0] === 'object') collectFromArrayOfObjects(arr);
          else {
            arr.forEach(v => { if (v) codes.add(String(v).trim()); });
          }
        });
      } else {
        const maybe = j.sheets || j.data || j.rows || j.result || j.items;
        if (maybe && Array.isArray(maybe)) {
          if (maybe.length && Array.isArray(maybe[0])) collectFromArrayOfArrays(maybe);
          else if (maybe.length && typeof maybe[0] === 'object') collectFromArrayOfObjects(maybe);
        } else {
          for (const k of Object.keys(j)) {
            const v = j[k];
            if (Array.isArray(v)) {
              if (v.length && Array.isArray(v[0])) collectFromArrayOfArrays(v);
              else if (v.length && typeof v[0] === 'object') collectFromArrayOfObjects(v);
            }
          }
        }
      }
    }

    const count = codes.size || 0;
    return { count: count || 0, reason: null };
  } catch (err) {
    console.warn('fetchProductCountFromGAS fail', err);
    return { count: null, reason: err && err.message ? String(err.message) : 'erro desconhecido' };
  }
}

/* =========================
   LOCKSCREEN PANEL ROTATOR (uses existing second lock-info-card when present)
   - Durations: productCount 60s, ping 15s, curiosity 30s, api-info 30s
   - Ensures it uses the existing card in HTML (no new card creation unless none exist)
   - Forces lockscreen card text color to a single fixed color so theme doesn't change it
   ========================= */
const LockPanelRotator = {
  timerId: null,
  stopped: true,
  currentIndex: 0,
  items: [],
  lastProductCountResult: null,
  // ping URL (small static file on same origin to avoid CORS). Change if you prefer.
  pingUrl: (window.location.origin ? window.location.origin : '') + '/favicon.ico',

  async buildItems() {
    // returns array of { render: async ()=>HTMLElement|string, durationMs }
    this.items = [
      {
        // Product count: 60s
        render: async () => {
          const panel = document.createElement('div');
          panel.style.textAlign = 'center';
          panel.style.padding = '8px';
          // force color fixed for lockscreen (so theme doesn't change)
          panel.style.color = '#111';
          panel.innerHTML = `
            <div style="font-weight:700;margin-bottom:6px">Produtos cadastrados</div>
            <div id="lockProductCount" style="font-size:1.6rem; font-weight:700">---</div>
            <div id="lockProductNote" style="font-size:0.85rem;opacity:0.9;margin-top:6px">Contando... (pode demorar alguns segundos)</div>
          `;

          // Fire off count (don't block render)
          (async () => {
            const el = panel.querySelector('#lockProductCount');
            const note = panel.querySelector('#lockProductNote');
            if (el) el.textContent = '---';
            if (note) note.textContent = 'Contando... (pode demorar alguns segundos)';
            const result = await fetchProductCountFromGAS();
            this.lastProductCountResult = result;
            if (el) {
              if (result && result.count != null) el.textContent = String(result.count);
              else el.textContent = 'Erro';
            }
            // update note with final friendly message
            if (note) {
              if (result && result.count != null) {
                note.textContent = 'São muitos, mas se ainda houver algum faltando, comunique ao desenvolvedor para adicionar.';
              } else {
                note.textContent = `Não foi possível contar os produtos: ${result && result.reason ? result.reason : 'erro'}`;
              }
            }
          })();

          return panel;
        },
        durationMs: 60000
      },

      {
        // Ping: 15s
        render: async () => {
          const panel = document.createElement('div');
          panel.style.textAlign = 'center';
          panel.style.padding = '8px';
          panel.style.color = '#111';
          panel.innerHTML = `<div style="font-weight:700;margin-bottom:6px">Verificação de Conexão</div>
                             <div id="lockPingStatus" style="font-weight:600">Verificando...</div>
                             <div id="lockPingInfo" style="font-size:0.85rem;opacity:0.9;margin-top:6px">Ping: --</div>`;
          const statusEl = panel.querySelector('#lockPingStatus');
          const pingInfoEl = panel.querySelector('#lockPingInfo');

          try {
            const pingResult = await LockPanelRotator.pingShort();
            if (statusEl) statusEl.textContent = pingResult.ok ? 'Online' : 'Offline';
            if (pingInfoEl) pingInfoEl.textContent = `Ping: ${pingResult.ms != null ? pingResult.ms + ' ms' : pingResult.reason || 'erro'}`;
          } catch (e) {
            if (statusEl) statusEl.textContent = 'Erro';
            if (pingInfoEl) pingInfoEl.textContent = `Ping: erro`;
          }

          return panel;
        },
        durationMs: 15000
      },

      {
        // Curiosity: 30s
        render: async () => {
          const p = document.createElement('div');
          p.style.padding = '8px';
          p.style.textAlign = 'center';
          p.style.color = '#111';
          const random = [
            'Sabia que este sistema foi feito com tecnologias simples para agilizar o trabalho?',
            'Se encontrar produto faltando, avise o dev para atualizar a lista.',
            'Dica: mantenha o cadastro de produtos atualizado para relatórios precisos.',
            'Curiosidade: esta plataforma foi construída com foco em usabilidade rápida.'
          ];
          const idx = Math.floor(Math.random() * random.length);
          p.innerHTML = `<div style="font-weight:700;margin-bottom:6px">Curiosidade</div><div style="font-size:0.95rem">${escapeHtml(random[idx])}</div>`;
          return p;
        },
        durationMs: 30000
      },

      {
        // API / system info: 30s
        render: async () => {
          const p = document.createElement('div');
          p.style.padding = '8px';
          p.style.textAlign = 'center';
          p.style.color = '#111';
          const lastReason = this.lastProductCountResult && this.lastProductCountResult.reason ? escapeHtml(this.lastProductCountResult.reason) : '—';
          p.innerHTML = `<div style="font-weight:700;margin-bottom:6px">Informações do Sistema</div>
                         <div style="font-size:0.95rem">OpenWeather: ${OPENWEATHER_KEY ? 'configurada' : 'não configurada'}</div>
                         <div style="font-size:0.85rem;opacity:0.85;margin-top:6px">Última contagem: ${lastReason}</div>`;
          return p;
        },
        durationMs: 30000
      }
    ];
  },

  // ping helper: quick GET to measure time (avoids CORS by using same-origin asset)
  async pingShort(timeoutMs = 5000) {
    const url = this.pingUrl;
    const start = performance.now();
    try {
      const r = await fetchWithTimeout(url, { method: 'GET', cache: 'no-store' }, timeoutMs);
      const end = performance.now();
      return { ok: r.ok, status: r.status, ms: Math.round(end - start) };
    } catch (err) {
      return { ok: false, reason: err && err.message ? String(err.message) : 'erro', ms: null };
    }
  },

  // find target card: prefer the second .lock-info-card (index 1), fallback to first
  findTargetCard() {
    const grid = document.querySelector('.lock-info-grid');
    if (!grid) return null;
    const cards = Array.from(grid.querySelectorAll('.lock-info-card'));
    if (cards.length >= 2) return cards[1]; // second existing card (use existing)
    if (cards.length === 1) return cards[0];
    // fallback: return null (do not create new automatically to avoid changing layout)
    return null;
  },

  async start() {
    try {
      this.stopped = false;
      await this.buildItems();
      this.currentIndex = 0;
      // stop any previous timer
      if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
      const card = this.findTargetCard();
      if (!card) {
        console.warn('LockPanelRotator: target card not found (expected .lock-info-card present in HTML)');
        return;
      }

      // force a fixed color for the whole card so theme won't change lockscreen appearance
      card.style.color = '#111';

      card.innerHTML = ''; // clear
      const firstItem = await this.items[this.currentIndex].render();
      if (firstItem instanceof HTMLElement) card.appendChild(firstItem);
      else card.innerHTML = String(firstItem);

      // schedule next using recursive timeout chain
      const scheduleNext = async () => {
        if (this.stopped) return;
        const cur = this.currentIndex;
        const duration = (this.items[cur] && this.items[cur].durationMs) ? this.items[cur].durationMs : 10000;
        this.timerId = setTimeout(async () => {
          if (this.stopped) return;
          try {
            this.currentIndex = (this.currentIndex + 1) % this.items.length;
            const nextItem = await this.items[this.currentIndex].render();
            card.innerHTML = '';
            if (nextItem instanceof HTMLElement) card.appendChild(nextItem);
            else card.innerHTML = String(nextItem);
          } catch (err) {
            console.warn('rotator render error', err);
          }
          // schedule recursively
          scheduleNext();
        }, duration);
      };

      scheduleNext();
    } catch (err) {
      console.warn('LockPanelRotator.start fail', err);
    }
  },

  stop() {
    this.stopped = true;
    if (this.timerId) { clearTimeout(this.timerId); this.timerId = null; }
    // keep last shown content in place (no removal)
  }
};

/* show weather failure SVG + reason */
function showWeatherErrorSVG(reason) {
  const wCard = document.querySelector('.lock-info-grid .lock-info-card:first-child') || document.querySelector('#weatherTemp')?.closest('.lock-info-card');
  if (!wCard) return;
  // force fixed text color
  wCard.style.color = '#111';
  wCard.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px;color:inherit">
      <svg width="120" height="120" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none">
        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.6" d="M8 9.036a3.485 3.485 0 011.975.99M4 12.5A3.5 3.5 0 007.5 16h9.75a2.75 2.75 0 00.734-5.4A5 5 0 008.37 9.108 3.5 3.5 0 004 12.5z"/>
      </svg>
      <div style="font-weight:700">Dados do clima indisponíveis</div>
      <div style="font-size:0.9rem;opacity:0.85;text-align:center">Não foi possível obter dados da API: ${escapeHtml(String(reason || 'motivo desconhecido'))}</div>
      <button id="lockRetryGeoloc" style="margin-top:8px;padding:6px 10px;border-radius:6px;border:1px solid rgba(0,0,0,0.08);background:#ffffff;cursor:pointer">Atualizar local (requer permissão)</button>
    </div>
  `;
  const btn = document.getElementById('lockRetryGeoloc');
  if (btn) {
    btn.addEventListener('click', () => {
      try { requestGeolocationAndUpdateWeather(); } catch (e) { console.warn(e); }
    });
  }
}

/* determineCityToUse - no geolocation prompt here */
async function determineCityToUse() {
  const auth = readAuthSession();
  if (auth && (String(auth.perm || '').toLowerCase() === 'admin' || String(auth.perm || '').toLowerCase() === 'suporte')) {
    if (auth.cidade) return auth.cidade;
  }
  if (auth && auth.lastCoords && auth.lastCoords.lat && auth.lastCoords.lon) {
    return `${auth.lastCoords.lat},${auth.lastCoords.lon}`;
  }
  if (auth && auth.cidade) return auth.cidade;
  // check our stored coords key too (non-auth)
  const stored = getStoredCoords();
  if (stored) return `${stored.lat},${stored.lon}`;
  return null;
}

/* -- attempt to obtain coordinates when opening lockscreen (will prompt user) --
   returns string "lat,lon" or null */
async function ensureCoordsForLockscreen(timeoutMs = 10000) {
  // 1) try authSession lastCoords
  const auth = readAuthSession();
  if (auth && auth.lastCoords && auth.lastCoords.lat && auth.lastCoords.lon) {
    return `${auth.lastCoords.lat},${auth.lastCoords.lon}`;
  }
  // 2) try stored coords
  const stored = getStoredCoords();
  if (stored) return `${stored.lat},${stored.lon}`;

  // 3) prompt user for geolocation (because lockscreen open is user-initiated)
  try {
    // small options: maximumAge allow recent cached, timeout
    const pos = await getCurrentPositionPromise({ timeout: timeoutMs, maximumAge: 60 * 60 * 1000 });
    const lat = Number(pos.lat);
    const lon = Number(pos.lon);
    // save to both storage places if possible
    setStoredCoords(lat, lon);
    try {
      const a = readAuthSession();
      if (a) { a.lastCoords = { lat, lon }; localStorage.setItem('authSession', JSON.stringify(a)); }
    } catch (e) { /* ignore */ }
    return `${lat},${lon}`;
  } catch (err) {
    // user denied or error -> return null silently (caller will handle showing message)
    console.warn('ensureCoordsForLockscreen failed', err);
    return null;
  }
}

/* updateLockScreen - the main function that prepares lock screen panel content */
async function updateLockScreen(options = { newsMode: 'geral' }) {
  // quote
  const quote = fallbackQuotes[Math.floor(Math.random() * fallbackQuotes.length)];
  const quoteEl = document.getElementById('lockQuote');
  if (quoteEl) {
    quoteEl.textContent = `"${quote}"`;
    // fixed color
    quoteEl.style.color = '#111';
  }

  // start rotator (this handles product count, ping, curiosities, api-info)
  try { LockPanelRotator.start(); } catch (e) { console.warn(e); }

  // render news (may show loader)
  try {
    if (options.newsMode === 'futebol') await renderFootballSummary();
    else await renderNews('geral');
  } catch (e) { console.warn('updateLockScreen news fail', e); }

  // weather: use stored city/coords only; if none, attempt to prompt (since lockscreen opening is user-initiated)
  let city = await determineCityToUse();
  const wTempEl = document.getElementById('weatherTemp');
  const wCondEl = document.getElementById('weatherCondition');

  // ensure weather card texts keep fixed color
  const wCard = document.querySelector('.lock-info-grid .lock-info-card:first-child') || document.querySelector('#weatherTemp')?.closest('.lock-info-card');
  if (wCard) wCard.style.color = '#111';

  if (!OPENWEATHER_KEY) {
    if (wTempEl) { wTempEl.textContent = '--'; wTempEl.style.color = '#111'; }
    if (wCondEl) { wCondEl.textContent = 'Chave OpenWeather não configurada'; wCondEl.style.color = '#111'; }
    showWeatherErrorSVG('Chave OpenWeather não configurada');
    return;
  }

  // if no city yet, attempt to get coords (this will prompt geolocation permission)
  if (!city) {
    if (wCard) {
      // show a small cloud + spinner while requesting location
      wCard.style.color = '#111';
      wCard.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;padding:8px;color:inherit">
          <svg width="68" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 16.5A4.5 4.5 0 0 0 15.5 12h-1.1A5 5 0 0 0 6.5 13.8 3.5 3.5 0 0 0 7 20h9" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
            <g transform="translate(4,2)">
              <circle cx="10" cy="10" r="3" stroke="currentColor" stroke-width="1.2" fill="none">
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" from="0 10 10" to="360 10 10" dur="1s" repeatCount="indefinite"/>
              </circle>
            </g>
          </svg>
          <div style="font-weight:700">Buscando localização...</div>
          <div style="font-size:0.9rem;opacity:0.85;text-align:center">Permitindo que o navegador obtenha sua localização para exibir o clima.</div>
        </div>
      `;
    }

    // try to get coords (timeout ~9s)
    const auto = await ensureCoordsForLockscreen(9000);
    if (auto) city = auto;
  }

  if (!city) {
    // still no city: show message and let user manually update
    if (wTempEl) { wTempEl.textContent = '--'; wTempEl.style.color = '#111'; }
    if (wCondEl) { wCondEl.textContent = 'Local não definido'; wCondEl.style.color = '#111'; }
    showWeatherErrorSVG('Local não definido. Atualize a localização manualmente.');
    return;
  }

  try {
    let weather = null;
    if (/^[0-9.+\-]+\s*,\s*[0-9.+\-]+$/.test(String(city))) {
      const parts = String(city).split(',').map(s => s.trim());
      weather = await fetchWeatherByCoords(parts[0], parts[1]).catch(err => { throw err; });
    } else {
      weather = await fetchWeatherByCityName(city).catch(err => { throw err; });
    }

    if (weather) {
      if (wCard) {
        // restore a compact weather view inside the card but keep color fixed
        wCard.style.color = '#111';
        wCard.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="weatherIcon" style="width:28px;height:28px;margin-bottom:8px;color:inherit">
            <circle cx="12" cy="12" r="5"></circle>
          </svg>
          <div style="text-align:center;color:inherit">
            <div class="lock-weather-temp" id="weatherTempDisplay">${weather.temp != null ? weather.temp + '°C' : '--'}</div>
            <div class="lock-weather-condition" id="weatherConditionDisplay" style="opacity:0.85">${escapeHtml(weather.condition || '')}</div>
          </div>
        `;
      } else {
        if (wTempEl) { wTempEl.textContent = (weather.temp != null) ? `${weather.temp}°C` : '--'; wTempEl.style.color = '#111'; }
        if (wCondEl) { wCondEl.textContent = weather.condition || ''; wCondEl.style.color = '#111'; }
      }
    } else {
      showWeatherErrorSVG('Resposta vazia da API');
      if (wTempEl) { wTempEl.textContent = '--'; wTempEl.style.color = '#111'; }
      if (wCondEl) { wCondEl.textContent = 'Dados do clima indisponíveis'; wCondEl.style.color = '#111'; }
    }
  } catch (err) {
    console.warn('updateLockScreen weather error', err);
    const reason = (err && err.message) ? err.message : 'erro desconhecido';
    showWeatherErrorSVG(reason);
    if (wTempEl) { wTempEl.textContent = '--'; wTempEl.style.color = '#111'; }
    if (wCondEl) { wCondEl.textContent = 'Erro ao buscar clima'; wCondEl.style.color = '#111'; }
  }
}

/* request geolocation from user gesture and update weather - saves coords to authSession */
function requestGeolocationAndUpdateWeather() {
  if (!navigator.geolocation) {
    showToast('Geolocalização não disponível neste navegador.', 'error');
    return;
  }
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const lat = pos.coords.latitude;
    const lon = pos.coords.longitude;
    const auth = readAuthSession();
    if (auth) {
      auth.lastCoords = { lat, lon };
      try { localStorage.setItem('authSession', JSON.stringify(auth)); } catch (e) {}
    }
    // also store in our separate key
    setStoredCoords(lat, lon);
    try {
      const w = await fetchWeatherByCoords(lat, lon);
      const wCard = document.querySelector('.lock-info-grid .lock-info-card:first-child') || document.querySelector('#weatherTemp')?.closest('.lock-info-card');
      if (wCard) {
        wCard.style.color = '#111';
        wCard.innerHTML = `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" id="weatherIcon" style="width:28px;height:28px;margin-bottom:8px;color:inherit">
            <circle cx="12" cy="12" r="5"></circle>
          </svg>
          <div style="text-align:center;color:inherit">
            <div class="lock-weather-temp" id="weatherTempDisplay">${w && w.temp != null ? w.temp + '°C' : '--'}</div>
            <div class="lock-weather-condition" id="weatherConditionDisplay" style="opacity:0.85">${escapeHtml(w && w.condition || '')}</div>
          </div>
        `;
      } else {
        const wTempEl = document.getElementById('weatherTemp');
        const wCondEl = document.getElementById('weatherCondition');
        if (wTempEl) { wTempEl.textContent = w.temp != null ? `${w.temp}°C` : '--'; wTempEl.style.color = '#111'; }
        if (wCondEl) { wCondEl.textContent = w.condition || ''; wCondEl.style.color = '#111'; }
      }
      showToast('Clima atualizado pela localização.', 'success', 3000);
    } catch (err) {
      console.warn('requestGeolocationAndUpdateWeather', err);
      showToast('Erro ao buscar clima por coordenadas.', 'error', 5000);
    }
  }, (err) => {
    console.warn('geolocation denied/failed', err);
    showToast('Permissão de localização negada ou indisponível.', 'error', 4000);
  }, { timeout: 10000 });
}

/* Cards / Access Controls (mantive suas versões) */
function addLockOverlayCard(card) {
  if (!card || card.querySelector('.lock-overlay')) return;
  const overlay = document.createElement('div');
  overlay.className = 'lock-overlay';
  overlay.style.position = 'absolute';
  overlay.style.inset = '0';
  overlay.style.display = 'flex';
  overlay.style.flexDirection = 'column';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.style.background = 'rgba(12,20,40,0.55)';
  overlay.style.color = '#fff';
  overlay.style.padding = '12px';
  overlay.innerHTML = `
    <div class="lock-title" style="display:flex;align-items:center;gap:8px;font-weight:600">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="11" width="18" height="11" rx="2"></rect>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
      </svg>
      Acesso bloqueado
    </div>
    <div class="lock-desc" style="font-size:0.9rem;opacity:0.95;margin-top:6px">Você não possui permissão para acessar essa área.</div>
    <div class="lock-actions" style="display:flex;gap:8px;margin-top:8px">
      <button class="lock-btn" data-action="request" style="padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:white;cursor:pointer">Solicitar Acesso</button>
      <button class="lock-btn" data-action="info" style="padding:6px 10px;border-radius:6px;border:1px solid rgba(255,255,255,0.12);background:transparent;color:white;cursor:pointer">Mais informações</button>
    </div>
  `;
  card.style.position = card.style.position || 'relative';
  card.appendChild(overlay);
  const btnReq = overlay.querySelector('[data-action="request"]');
  const btnInfo = overlay.querySelector('[data-action="info"]');
  if (btnReq) btnReq.addEventListener('click', (ev) => { ev.stopPropagation(); requestAccess(card.dataset.feature); });
  if (btnInfo) btnInfo.addEventListener('click', (ev) => { ev.stopPropagation(); showToast('Área restrita. Contate o administrador.', 'info'); });
}
function applyAccessControlsFromAuth(auth) {
  const permRaw = auth && auth.perm ? String(auth.perm).toLowerCase() : '';
  const allowed = permissionsMap[permRaw] || [];
  const btnCart = document.getElementById('btn-cartazista');
  const btnAdmin = document.getElementById('btn-admin');
  if (auth) { if (btnCart) btnCart.style.display = ''; if (btnAdmin) btnAdmin.style.display = ''; }
  else { if (btnCart) btnCart.style.display = 'none'; if (btnAdmin) btnAdmin.style.display = 'none'; }

  $all('.card[data-feature]').forEach(card => {
    const feat = card.dataset.feature;
    const existing = card.querySelector('.lock-overlay'); if (existing) existing.remove();
    if (!auth) { card.classList.add('locked'); card.setAttribute('aria-disabled','true'); addLockOverlayCard(card); }
    else {
      if (permRaw === 'admin' || permRaw === 'suporte' || allowed.includes(feat)) {
        card.classList.remove('locked'); card.removeAttribute('aria-disabled');
      } else {
        card.classList.add('locked'); card.setAttribute('aria-disabled','true'); addLockOverlayCard(card);
      }
    }
  });

  if (btnCart) {
    btnCart.onclick = () => {
      const a = readAuthSession(); const pr = a && a.perm ? String(a.perm).toLowerCase() : '';
      const allowed2 = permissionsMap[pr] || [];
      if (!a) { showToast('Você não está logado.', 'error'); return; }
      if (!(pr === 'admin' || pr === 'suporte' || allowed2.includes('cartazista'))) { showToast('Acesso negado: você não tem permissão para a Área Cartazista.', 'error'); return; }
      window.location.href = 'cartazista.html';
    };
  }
  if (btnAdmin) {
    btnAdmin.onclick = () => {
      const a = readAuthSession(); const pr = a && a.perm ? String(a.perm).toLowerCase() : '';
      if (!a) { showToast('Você não está logado.', 'error'); return; }
      if (!(pr === 'admin' || pr === 'suporte')) { showToast('Acesso negado: somente administradores podem acessar.', 'error'); return; }
      window.location.href = 'admin.html';
    };
  }
}
function attachCardClicks() {
  $all('.card[data-feature]').forEach(card => {
    try { if (card._clickHandler) card.removeEventListener('click', card._clickHandler); } catch(e) {}
    const handler = (e) => {
      if (card.classList.contains('locked')) { showToast('Você não tem acesso a esta área.', 'error'); return; }
      const routeMap = { vendas: 'cartazes.html', faturamento: 'declaracoes.html', crediario: 'declaracoes.html', cartazista: 'cartazista.html', admin: 'admin.html' };
      const target = routeMap[card.dataset.feature] || '#';
      if (target === '#') showToast('Rota não definida para este setor.', 'info');
      else window.location.href = target;
    };
    card.addEventListener('click', handler);
    card._clickHandler = handler;
    card.addEventListener('keypress', (e) => { if (e.key === 'Enter') handler(e); });
  });
}
function requestAccess(feature) {
  const auth = readAuthSession();
  const user = auth ? (auth.user || auth.nome || 'Desconhecido') : 'Desconhecido';
  showToast(`Solicitação enviada para o gestor. Recurso: ${feature}`, 'success', DEFAULT_TOAST_DURATION);
}

/* CLOCK & IDLE LOCK */
let clockInterval = null;
function updateClock() {
  const now = new Date();
  const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const date = now.toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const tEl = document.getElementById('lockTime'); if (tEl) { tEl.textContent = time; tEl.style.color = '#111'; }
  const dEl = document.getElementById('lockDate'); if (dEl) { dEl.textContent = date; dEl.style.color = '#111'; }
}
function startClock() { updateClock(); if (clockInterval) clearInterval(clockInterval); clockInterval = setInterval(updateClock, 1000); }
function stopClock() { if (clockInterval) { clearInterval(clockInterval); clockInterval = null; } }

let idleTimer = null;
function resetIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    const lockScreen = document.getElementById('lockScreen');
    if (lockScreen) {
      try { if (document.activeElement) document.activeElement.blur(); } catch(e) {}
      const main = document.querySelector('main');
      if (main) {
        if ('inert' in HTMLElement.prototype) main.inert = true;
        else main.setAttribute('aria-hidden', 'true');
      }
      // ensure lockScreen accessible to AT: remove aria-hidden BEFORE focusing descendants
      lockScreen.classList.remove('fade-out');
      lockScreen.classList.add('active');
      lockScreen.removeAttribute('aria-hidden');
      const unlockButton = document.getElementById('unlockButton'); if (unlockButton) unlockButton.focus({preventScroll:true});
      startClock();
      await updateLockScreen();
    }
  }, IDLE_TIMEOUT_MS);
}
function bindActivityEvents() {
  ['mousemove','mousedown','keydown','touchstart','scroll'].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });
  resetIdleTimer();
}

/* UI Bindings - menu, lock, unlock, theme, login/logout */
function setupUiBindings() {
  const menuButton = document.getElementById('menuButton');
  const menuOverlay = document.getElementById('menuOverlay');
  const menuDropdown = document.getElementById('menuDropdown');
  const themeToggle = document.getElementById('themeToggle');
  const lockButton = document.getElementById('lockButton');
  const loginButton = document.getElementById('loginButton');
  const logoutButton = document.getElementById('logoutButton');
  const unlockButton = document.getElementById('unlockButton');
  const newsModeSelect = document.getElementById('newsModeSelect');

  if (menuButton) {
    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.classList.toggle('active');
      if (menuOverlay) menuOverlay.classList.toggle('active', isOpen);
      if (menuDropdown) menuDropdown.classList.toggle('active', isOpen);
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }
  if (menuOverlay) {
    menuOverlay.addEventListener('click', () => {
      if (menuButton) menuButton.classList.remove('active');
      if (menuOverlay) menuOverlay.classList.remove('active');
      if (menuDropdown) menuDropdown.classList.remove('active');
    });
  }
  if (themeToggle) {
    themeToggle.addEventListener('click', () => {
      document.documentElement.classList.toggle('dark');
      const txt = document.documentElement.classList.contains('dark') ? 'Tema Claro' : 'Tema Escuro';
      const themeText = document.getElementById('themeText'); if (themeText) themeText.textContent = txt;
    });
  }
  if (lockButton) {
    lockButton.addEventListener('click', async () => {
      const ls = document.getElementById('lockScreen'); if (!ls) return;
      try { if (document.activeElement) document.activeElement.blur(); } catch(e){}
      const main = document.querySelector('main');
      if (main) {
        if ('inert' in HTMLElement.prototype) main.inert = true;
        else main.setAttribute('aria-hidden','true');
      }
      // ensure lockScreen accessible
      ls.classList.remove('fade-out'); ls.classList.add('active'); ls.removeAttribute('aria-hidden');
      const unlockButton = document.getElementById('unlockButton'); if (unlockButton) unlockButton.focus({preventScroll:true});
      startClock(); await updateLockScreen();
    });
  }
  if (unlockButton) {
    unlockButton.addEventListener('click', () => {
      const ls = document.getElementById('lockScreen'); if (!ls) return;
      // blur unlockButton first to avoid aria-hidden focus errors
      try { if (document.activeElement) document.activeElement.blur(); } catch(e) {}
      ls.classList.add('fade-out');
      setTimeout(() => {
        ls.classList.remove('active'); ls.classList.remove('fade-out'); ls.setAttribute('aria-hidden','true');
        const main = document.querySelector('main');
        if (main) {
          if ('inert' in HTMLElement.prototype) main.inert = false;
          else main.removeAttribute('aria-hidden');
        }
        stopClock();
        // stop rotator
        LockPanelRotator.stop();
        try {
          const firstFocusable = document.querySelector('main button, main a, main [tabindex]:not([tabindex="-1"])');
          if (firstFocusable) firstFocusable.focus({preventScroll:true});
        } catch(e){}
      }, 400);
    });
  }
  if (loginButton) {
    loginButton.addEventListener('click', () => {
      showToast('Redirecionando para a tela de login...', 'info');
      setTimeout(() => window.location.href = '../index.html', 700);
    });
  }
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem('authSession'); localStorage.removeItem('auth');
      showToast('Sessão encerrada', 'info');
      setTimeout(()=> window.location.href = '../index.html', 700);
    });
  }
  if (newsModeSelect) {
    newsModeSelect.addEventListener('change', (e) => {
      if (e.target.value === 'futebol') renderFootballSummary();
      else renderNews('geral');
    });
  }

  // ESC closes menus/lockscreen
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const lock = document.getElementById('lockScreen');
      const menuBtn = document.getElementById('menuButton');
      if (lock && lock.classList.contains('active')) {
        const unlockButton = document.getElementById('unlockButton'); if (unlockButton) unlockButton.click();
      } else if (menuBtn && menuBtn.classList.contains('active')) {
        menuBtn.classList.remove('active');
        const menuOverlay = document.getElementById('menuOverlay'); if (menuOverlay) menuOverlay.classList.remove('active');
        const menuDropdown = document.getElementById('menuDropdown'); if (menuDropdown) menuDropdown.classList.remove('active');
      }
    }
  });
}

/* Welcome/UI init */
function initWelcomeAndUi() {
  const auth = readAuthSession();
  const headline = document.getElementById('welcomeHeadline');
  const sub = document.getElementById('welcomeSub');

  if (!auth) {
    if (headline) headline.innerText = 'Bem-vindo!';
    if (sub) sub.innerText = 'Faça login para continuar.';
    applyAccessControlsFromAuth(null);
    attachCardClicks();
    return;
  }

  const name = firstName(auth.fullName);
  const now = new Date(); const hours = now.getHours();
  let greeting = 'Tenha um bom dia';
  if (hours >= 5 && hours < 11) greeting = 'Tenha uma ótima manhã';
  else if (hours >= 11 && hours < 13) greeting = 'Bom almoço — recarregue as energias!';
  else if (hours >= 13 && hours < 17) greeting = 'Boa tarde — continue firme nas entregas!';
  else if (hours >= 17 && hours < 18) greeting = 'Pôr do sol — aproveite o final do dia';
  else if (hours >= 18) greeting = 'Boa noite — descanse e recupere as forças';

  if (headline) headline.innerText = `Bem-vindo(a) ${name}!`;
  if (sub) sub.innerText = greeting;

  applyAccessControlsFromAuth(auth);
  attachCardClicks();
}

/* initial login state */
function initialLoginState() {
  const auth = readAuthSession();
  const logoutBtn = document.getElementById('logoutButton');
  const loginBtn = document.getElementById('loginButton');
  if (!auth) {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (loginBtn) loginBtn.style.display = '';
    console.log('Usuário não logado.');
  } else {
    showToast('Usuário logado.', 'success', 2000);
    if (loginBtn) loginBtn.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = '';
  }
}

/* Boot */
document.addEventListener('DOMContentLoaded', async () => {
  ensureToastContainer();
  setupUiBindings();
  initWelcomeAndUi();
  initialLoginState();
  bindActivityEvents();

  // ensure news loader exists
  ensureNewsLoaderExists();

  // If lockScreen is already active on load, start clock and update
  if (document.querySelector('#lockScreen.active')) { startClock(); await updateLockScreen(); }

  // expose helpers for debug/testing
  window.ss_utils = {
    showToast,
    readAuthSession,
    updateLockScreen,
    fetchG1Headlines,
    renderNews,
    renderFootballSummary,
    requestGeolocationAndUpdateWeather,
    fetchProductCountFromGAS,
    LockPanelRotator,
    getStoredCoords
  };
});
