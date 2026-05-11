'use strict';
// ═══════════════════════════════════════════════════════════════════════════════
//  CUSTOM-UI.JS — Botões configuráveis + Modo escuro
//  Adicione APÓS todos os outros scripts no final do <body>.
//
//  ┌──────────────────────────────────────────────────────────────────────────┐
//  │  COMO CONFIGURAR UM BOTÃO                                               │
//  │                                                                          │
//  │  Adicione um objeto em BOTOES_CONFIG abaixo. Propriedades:              │
//  │                                                                          │
//  │  id       string  — id único do elemento gerado (obrigatório)           │
//  │  label    string  — texto exibido no botão                              │
//  │  icon     string  — classe Font Awesome (ex: 'fa-solid fa-table-list')  │
//  │  estilo   string  — visual do botão:                                    │
//  │             'pill'       – pílula colorida com ícone + texto            │
//  │             'ghost'      – transparente com borda, discreto             │
//  │             'icone-badge'– ícone circular + label pequeno embaixo       │
//  │  posicao  string  — onde inserir na interface:                          │
//  │             'sidebar-secao'   – ao lado do divisor "Mais ações"         │
//  │             'header-direita'  – canto direito do header principal       │
//  │             'sidebar-rodape'  – abaixo do botão "Voltar ao início"      │
//  │  acao     string  — o que acontece ao clicar:                           │
//  │             'imagem'      – abre popup com a imagem em src              │
//  │             'manual-ajuda'– popup especial: abrir aba ou baixar PDF     │
//  │  src      string  — caminho da imagem (.png/.jpg) ou PDF               │
//  │  titulo   string  — título exibido no popup (opcional)                  │
//  └──────────────────────────────────────────────────────────────────────────┘
// ═══════════════════════════════════════════════════════════════════════════════

var BOTOES_CONFIG = [

  // ── Exemplo 1: tabela de tamanhos — sidebar, ao lado de "Mais ações" ──────
  {
    id:     'cui-tabela-encartes',
    label:  'Tabela de encartes',
    icon:   'fa-solid fa-table-list',
    estilo: 'pill',
    posicao:'sidebar-secao',
    acao:   'imagem',
    src:    '../image/encarte.png',
    titulo: 'Tabela de Tamanhos de Encartes',
  },

  // ── Exemplo 2: ajuda geral — header à direita (manual PDF) ────────────────
  {
    id:     'cui-ajuda-header',
    label:  'Ajuda',
    icon:   'fa-solid fa-circle-question',
    estilo: 'ghost',
    posicao:'header-direita',
    acao:   'manual-ajuda',
    src:    '../data/manual-geral.pdf',
    titulo: 'Manual do Sistema',
  },

  // ── Feedbacks — header à direita, abre nova aba ──────────────────────────
  {
    id:     'cui-feedbacks',
    label:  'Feedbacks',
    icon:   'fa-solid fa-comment-dots',
    estilo: 'ghost',
    posicao:'header-direita',
    acao:   'link',
    href:   '../feedbacks/feedback.html',
    titulo: 'Enviar feedback',
  },

  // ── Toggle de tema claro/escuro — header à direita, ao lado da Ajuda ──────
  {
    id:     'cui-tema-toggle',
    label:  'Alternar tema',
    icon:   'fa-solid fa-moon',     // atualizado dinamicamente pelo script
    estilo: 'tema-toggle',
    posicao:'header-direita',
    acao:   'toggle-tema',
  },

  // ── Exemplo 3: referência rápida — rodapé da sidebar ──────────────────────
//  {
//    id:     'cui-referencia-rodape',
//    label:  'Referência',
//    icon:   'fa-solid fa-book-open',
//    estilo: 'icone-badge',
//    posicao:'sidebar-rodape',
//    acao:   'imagem',
//    src:    '../image/encarte.png',
//    titulo: 'Tabela de referência rápida',
//  },

  // ── Adicione mais botões aqui seguindo o mesmo padrão ──────────────────────
  // {
  //   id:     'cui-meu-botao',
  //   label:  'Meu botão',
  //   icon:   'fa-solid fa-star',
  //   estilo: 'pill',          // 'pill' | 'ghost' | 'icone-badge'
  //   posicao:'sidebar-secao', // 'sidebar-secao' | 'header-direita' | 'sidebar-rodape'
  //   acao:   'imagem',        // 'imagem' | 'manual-ajuda'
  //   src:    '../image/minha-imagem.png',
  //   titulo: 'Meu popup',
  // },

];

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 1 · CSS dos botões e popups (injetado uma única vez)
// ─────────────────────────────────────────────────────────────────────────────

(function _injectCSS() {
  if (document.getElementById('cui-styles')) return;
  var s = document.createElement('style');
  s.id = 'cui-styles';
  s.textContent = `

/* ── Botão estilo PILL ── */
.cui-btn-pill {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 13px;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  cursor: pointer;
  transition: all .18s ease;
  white-space: nowrap;
  line-height: 1;
}
.cui-btn-pill:hover {
  background: #fef3c7;
  border-color: #f59e0b;
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(245,158,11,.2);
}
.cui-btn-pill i { font-size: 12px; }

/* ── Botão estilo GHOST ── */
.cui-btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  background: transparent;
  border: 1.5px solid var(--gray-300, #d1d5db);
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--gray-600, #4b5563);
  cursor: pointer;
  transition: all .18s ease;
  white-space: nowrap;
}
.cui-btn-ghost:hover {
  border-color: var(--primary, #2563eb);
  color: var(--primary, #2563eb);
  background: rgba(37,99,235,.05);
}
.cui-btn-ghost i { font-size: 14px; }

/* ── Botão estilo TEMA-TOGGLE ── */
.cui-btn-tema-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: 1.5px solid var(--gray-200, #e5e7eb);
  background: var(--gray-100, #f3f4f6);
  color: var(--gray-600, #4b5563);
  cursor: pointer;
  transition: background .22s ease, border-color .22s ease,
              box-shadow .22s ease, transform .18s ease;
  overflow: hidden;
  flex-shrink: 0;
}
.cui-btn-tema-toggle i {
  font-size: 14px;
  transition: transform .35s cubic-bezier(.34,1.56,.64,1),
              opacity .25s ease;
  will-change: transform, opacity;
}
.cui-btn-tema-toggle:hover {
  border-color: var(--primary, #2563eb);
  box-shadow: 0 0 0 3px rgba(37,99,235,.12);
  transform: scale(1.08);
}
/* Estado: tema claro ativo → ícone = lua (clicar vai escurecer) */
.cui-btn-tema-toggle[data-modo="light"] {
  background: #f3f4f6;
  border-color: #d1d5db;
  color: #4b5563;
}
.cui-btn-tema-toggle[data-modo="light"] i {
  transform: rotate(0deg);
}
/* Estado: tema escuro ativo → ícone = sol (clicar vai clarear) */
.cui-btn-tema-toggle[data-modo="dark"] {
  background: #1e3a5f;
  border-color: #3b82f6;
  color: #fbbf24;
  box-shadow: 0 0 0 1px rgba(59,130,246,.3),
              inset 0 0 8px rgba(251,191,36,.08);
}
.cui-btn-tema-toggle[data-modo="dark"]:hover {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(59,130,246,.25),
              inset 0 0 8px rgba(251,191,36,.1);
}
.cui-btn-tema-toggle[data-modo="dark"] i {
  transform: rotate(180deg);
}
/* Animação de troca de ícone */
.cui-btn-tema-toggle.cui-girando i {
  animation: cuiGiroTema .4s cubic-bezier(.34,1.56,.64,1) forwards;
}
@keyframes cuiGiroTema {
  0%   { transform: scale(1)    rotate(0deg);   opacity: 1; }
  40%  { transform: scale(0.5)  rotate(90deg);  opacity: 0; }
  60%  { transform: scale(0.5)  rotate(270deg); opacity: 0; }
  100% { transform: scale(1)    rotate(360deg); opacity: 1; }
}

/* ── Botão estilo ÍCONE-BADGE ── */
.cui-btn-icone-badge {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 8px 10px;
  background: var(--gray-100, #f3f4f6);
  border: 1.5px solid var(--gray-200, #e5e7eb);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 600;
  color: var(--gray-600, #4b5563);
  cursor: pointer;
  transition: all .18s ease;
  white-space: nowrap;
}
.cui-btn-icone-badge i {
  font-size: 16px;
  color: var(--primary, #2563eb);
}
.cui-btn-icone-badge:hover {
  background: #eff6ff;
  border-color: var(--primary, #2563eb);
  color: var(--primary, #2563eb);
  transform: translateY(-1px);
  box-shadow: 0 3px 10px rgba(37,99,235,.12);
}

/* ── Faixa de botões ao lado do nav-divider ── */
.cui-secao-strip {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 0 16px 10px;
  margin-top: -4px;
}

/* ── Popup genérico de imagem ── */
.cui-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.82);
  backdrop-filter: blur(8px);
  z-index: 18000;
  align-items: center;
  justify-content: center;
  padding: 16px;
  animation: cuiOverlayIn .2s ease;
}
.cui-overlay.open { display: flex; }
@keyframes cuiOverlayIn {
  from { opacity: 0; }
  to   { opacity: 1; }
}
.cui-popup {
  background: white;
  border-radius: 16px;
  max-width: 900px;
  width: 100%;
  max-height: 92vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 28px 72px rgba(0,0,0,.4);
  animation: cuiPopupIn .25s cubic-bezier(.16,1,.3,1);
}
@keyframes cuiPopupIn {
  from { opacity: 0; transform: scale(.93) translateY(16px); }
  to   { opacity: 1; transform: scale(1)   translateY(0); }
}
.cui-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 20px;
  border-bottom: 1.5px solid #e5e7eb;
  background: #f9fafb;
  flex-shrink: 0;
}
.cui-popup-header h4 {
  font-size: 15px;
  font-weight: 700;
  color: #111827;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}
.cui-popup-header h4 i { color: #2563eb; }
.cui-popup-close {
  background: #f3f4f6;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  color: #6b7280;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all .15s;
}
.cui-popup-close:hover { background: #fee2e2; color: #ef4444; }
.cui-popup-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: #f0f2f7;
}
.cui-popup-body img {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  box-shadow: 0 6px 24px rgba(0,0,0,.18);
  display: block;
}
.cui-popup-body .cui-img-error {
  padding: 48px 24px;
  text-align: center;
  color: #9ca3af;
  font-size: 14px;
}
.cui-popup-body .cui-img-error i {
  font-size: 44px;
  margin-bottom: 14px;
  display: block;
  color: #d1d5db;
}

/* ── Popup de escolha: manual de ajuda ── */
.cui-manual-dialog {
  background: white;
  border-radius: 18px;
  max-width: 440px;
  width: 94%;
  overflow: hidden;
  box-shadow: 0 24px 64px rgba(0,0,0,.35);
  animation: cuiPopupIn .25s cubic-bezier(.16,1,.3,1);
}
.cui-manual-icon {
  width: 72px;
  height: 72px;
  background: linear-gradient(135deg,#eff6ff,#dbeafe);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  color: #2563eb;
  margin: 32px auto 0;
}
.cui-manual-body {
  padding: 20px 28px 28px;
  text-align: center;
}
.cui-manual-body h3 {
  font-size: 19px;
  font-weight: 700;
  color: #111827;
  margin: 12px 0 6px;
}
.cui-manual-body p {
  font-size: 13px;
  color: #6b7280;
  margin: 0 0 24px;
  line-height: 1.5;
}
.cui-manual-actions {
  display: flex;
  gap: 10px;
}
.cui-manual-actions button {
  flex: 1;
  padding: 13px 16px;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all .18s ease;
}
.cui-manual-btn-tab {
  background: #2563eb;
  color: white;
  box-shadow: 0 3px 10px rgba(37,99,235,.25);
}
.cui-manual-btn-tab:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
  box-shadow: 0 5px 16px rgba(37,99,235,.35);
}
.cui-manual-btn-down {
  background: #f3f4f6;
  color: #374151;
}
.cui-manual-btn-down:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}
.cui-manual-footer {
  padding: 14px 28px;
  border-top: 1px solid #f3f4f6;
  background: #f9fafb;
  text-align: right;
}
.cui-manual-footer button {
  background: transparent;
  border: none;
  font-size: 13px;
  color: #9ca3af;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: color .15s;
}
.cui-manual-footer button:hover { color: #6b7280; }

/* ════════════════════════════════════════════════════════════
   MODO ESCURO — apenas chrome da interface
   ════════════════════════════════════════════════════════════
   ATENÇÃO: estas regras cobrem SOMENTE a interface (sidebar,
   header, formulários, cards, modais).
   As classes .poster, .poster-*, .product-preview e derivadas
   são INTENCIONALMENTE excluídas — cartazes e previews devem
   permanecer sempre brancos independente do tema.
   ============================================================ */

[data-theme="dark"] {
  color-scheme: dark;
}

/* Fundo geral */
[data-theme="dark"] body {
  background: #0f172a;
  color: #e2e8f0;
}

/* Sidebar */
[data-theme="dark"] .sidebar {
  background: #1e293b;
  border-right-color: #334155;
}
[data-theme="dark"] .sidebar-header {
  border-bottom-color: #334155;
}
[data-theme="dark"] .sidebar-header h2 {
  color: #f1f5f9;
}
[data-theme="dark"] .sidebar-header p {
  color: #94a3b8;
}
[data-theme="dark"] .sidebar-footer {
  border-top-color: #334155;
}
[data-theme="dark"] .sidebar-footer p {
  color: #64748b;
}
[data-theme="dark"] .nav-item {
  color: #cbd5e1;
}
[data-theme="dark"] .nav-item:hover {
  background: #273449;
}
[data-theme="dark"] .nav-item.active {
  background: #1e3a5f;
  color: #60a5fa;
}
[data-theme="dark"] .nav-divider {
  color: #475569;
}
[data-theme="dark"] .btn-home {
  background: #2563eb;
}
[data-theme="dark"] .btn-home:hover {
  background: #1d4ed8;
}

/* Main content */
[data-theme="dark"] .main-content {
  background: #0f172a;
}
[data-theme="dark"] .global-header {
  background: #1e293b;
  border-bottom-color: #334155;
}
[data-theme="dark"] .global-header h1 {
  color: #f1f5f9;
}
[data-theme="dark"] .global-header p {
  color: #94a3b8;
}

/* Cards e formulários */
[data-theme="dark"] .card {
  background: #1e293b;
  border-color: #334155;
}
[data-theme="dark"] .card h2 {
  color: #f1f5f9;
}
[data-theme="dark"] .form-group label {
  color: #cbd5e1;
}
[data-theme="dark"] .form-group input[type="text"],
[data-theme="dark"] .form-group input[type="tel"],
[data-theme="dark"] .form-group input[type="date"],
[data-theme="dark"] .form-group select {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
[data-theme="dark"] .form-group input::placeholder {
  color: #475569;
}
[data-theme="dark"] .form-group input:focus,
[data-theme="dark"] .form-group select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59,130,246,.2);
}
[data-theme="dark"] .input-currency span {
  color: #64748b;
}
[data-theme="dark"] .help-text {
  color: #64748b;
}
[data-theme="dark"] .features-input-compact input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
[data-theme="dark"] .warranty-box {
  background: #162032;
  border-color: #334155;
}
[data-theme="dark"] .warranty-options {
  background: #1e293b;
  border-top-color: #334155;
}
[data-theme="dark"] .warranty-input-group input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
[data-theme="dark"] .warranty-input-group input:disabled {
  background: #162032;
}

/* Produto cards */
[data-theme="dark"] .product-card {
  background: #1e293b;
  border-color: #334155;
}
[data-theme="dark"] .product-info h3 {
  color: #f1f5f9;
}
[data-theme="dark"] .product-info p {
  color: #94a3b8;
}
[data-theme="dark"] .feature-tag {
  background: #273449;
  color: #94a3b8;
}
[data-theme="dark"] .product-detail span {
  color: #64748b;
}
[data-theme="dark"] .product-detail strong {
  color: #e2e8f0;
}
[data-theme="dark"] .empty-state {
  background: #1e293b;
  border-color: #334155;
}
[data-theme="dark"] .empty-state h3 {
  color: #94a3b8;
}

/* Header de produtos */
[data-theme="dark"] .products-header h2 {
  color: #f1f5f9;
}
[data-theme="dark"] .products-header p {
  color: #94a3b8;
}

/* Botões secundários */
[data-theme="dark"] .btn-secondary {
  background: #273449;
  color: #cbd5e1;
  border: 1px solid #334155;
}
[data-theme="dark"] .btn-secondary:hover {
  background: #334155;
}
[data-theme="dark"] .btn-delete {
  border-color: #dc2626;
  color: #ef4444;
}

/* Selects dentro de views */
[data-theme="dark"] select {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}

/* Modais */
[data-theme="dark"] .modal-fator-content {
  background: #1e293b;
}
[data-theme="dark"] .modal-header {
  background: #162032;
  border-bottom-color: #334155;
}
[data-theme="dark"] .modal-header h2 {
  color: #f1f5f9;
}
[data-theme="dark"] .modal-body {
  background: #1e293b;
  color: #e2e8f0;
}
[data-theme="dark"] .modal-footer {
  background: #162032;
  border-top-color: #334155;
}
[data-theme="dark"] .modal-close {
  color: #94a3b8;
}
[data-theme="dark"] .modal-close:hover {
  background: #4c1515;
  color: #f87171;
}
[data-theme="dark"] .tabela-info {
  background: #162032;
  border-color: #334155;
}
[data-theme="dark"] .tabela-info span { color: #94a3b8; }
[data-theme="dark"] .tabela-fatores tbody tr {
  border-bottom-color: #334155;
}
[data-theme="dark"] .tabela-fatores tbody tr:hover {
  background: #162032;
}
[data-theme="dark"] .tabela-fatores td {
  color: #cbd5e1;
}

/* Modal de busca */
[data-theme="dark"] .modal-busca-content {
  background: #1e293b;
}
[data-theme="dark"] .busca-texto-table thead {
  background: #162032;
  border-bottom-color: #334155;
}
[data-theme="dark"] .busca-texto-table th {
  color: #64748b;
}
[data-theme="dark"] .busca-texto-table tbody tr {
  border-bottom-color: #273449;
}
[data-theme="dark"] .busca-texto-table tbody tr:hover {
  background: #273449;
}
[data-theme="dark"] .busca-texto-table td {
  color: #cbd5e1;
}
[data-theme="dark"] #busca-texto-input {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
[data-theme="dark"] .menu-agrupamento {
  background: #1e293b;
  border-color: #334155;
}
[data-theme="dark"] .menu-agrupamento-item {
  color: #cbd5e1;
}
[data-theme="dark"] .menu-agrupamento-item:hover {
  background: #273449;
}

/* Confirm dialog */
[data-theme="dark"] .confirm-dialog {
  background: #1e293b;
}
[data-theme="dark"] .confirm-header-text h3 { color: #f1f5f9; }
[data-theme="dark"] .confirm-header-text p  { color: #94a3b8; }
[data-theme="dark"] .confirm-message        { color: #cbd5e1; }
[data-theme="dark"] .confirm-footer {
  background: #162032;
}
[data-theme="dark"] .confirm-btn-cancel {
  background: #273449;
  border-color: #334155;
  color: #cbd5e1;
}

/* View Calculadora */
[data-theme="dark"] #view-calculadora .card p {
  color: #94a3b8;
}

/* View importar JSON */
[data-theme="dark"] .import-tab {
  color: #94a3b8;
}
[data-theme="dark"] .import-tab.active {
  color: #60a5fa;
  border-bottom-color: #3b82f6;
}
[data-theme="dark"] .upload-area {
  background: #162032;
  border-color: #334155;
}
[data-theme="dark"] .upload-area h3 { color: #e2e8f0; }
[data-theme="dark"] .upload-area p  { color: #64748b; }

/* View ver-json */
[data-theme="dark"] #ver-json-empty {
  background: #162032;
}
[data-theme="dark"] .json-view-tab {
  color: #94a3b8;
}
[data-theme="dark"] .json-view-tab.active {
  color: #60a5fa;
  border-bottom-color: #3b82f6;
}

/* GE selects e rows no card */
[data-theme="dark"] .ge-sel-row {
  background: #0d2b1e;
  border-color: #166534;
}
[data-theme="dark"] .select-layout-personalizado,
[data-theme="dark"] .select-posicao-garantia {
  background: #0f172a;
  border-color: #334155;
  color: #cbd5e1;
}

/* Checkbox validade */
[data-theme="dark"] .checkbox-validade-wrapper {
  background: #162032;
  border-color: #334155;
}
[data-theme="dark"] .checkbox-validade-wrapper span {
  color: #cbd5e1;
}
[data-theme="dark"] .date-input-styled {
  background: #0f172a;
  border-color: #334155;
  color: #f1f5f9;
}
[data-theme="dark"] .validade-preview {
  background: linear-gradient(135deg, #1e3a5f, #172b4d);
  border-left-color: #3b82f6;
  color: #93c5fd;
}

/* Encarte help overlay */
[data-theme="dark"] #encarte-help-box {
  background: #1e293b;
}
[data-theme="dark"] .enc-help-hdr {
  background: #162032;
  border-bottom-color: #334155;
}
[data-theme="dark"] .enc-help-hdr h4 { color: #f1f5f9; }
[data-theme="dark"] .enc-help-hdr p  { color: #94a3b8; }

/* Overlay principal (loading) */
[data-theme="dark"] .overlay-box {
  background: #1e293b;
}
[data-theme="dark"] .overlay-texto   { color: #f1f5f9; }
[data-theme="dark"] .overlay-subtexto { color: #94a3b8; }

/* Popups do custom-ui */
[data-theme="dark"] .cui-popup {
  background: #1e293b;
}
[data-theme="dark"] .cui-popup-header {
  background: #162032;
  border-bottom-color: #334155;
}
[data-theme="dark"] .cui-popup-header h4 { color: #f1f5f9; }
[data-theme="dark"] .cui-manual-dialog {
  background: #1e293b;
}
[data-theme="dark"] .cui-manual-body h3 { color: #f1f5f9; }
[data-theme="dark"] .cui-manual-body p  { color: #94a3b8; }
[data-theme="dark"] .cui-manual-btn-down {
  background: #273449;
  color: #e2e8f0;
}
[data-theme="dark"] .cui-manual-btn-down:hover {
  background: #334155;
}
[data-theme="dark"] .cui-manual-footer {
  background: #162032;
  border-top-color: #334155;
}

/* Checkbox taxa */
[data-theme="dark"] .checkbox-taxa-inline {
  background: #162032;
  border-color: #334155;
}
[data-theme="dark"] .checkbox-taxa-inline label {
  color: #cbd5e1;
}

/* Toggle de tema no modo escuro — fica ainda mais destacado */
[data-theme="dark"] .cui-btn-tema-toggle[data-modo="dark"] {
  background: #172b4d;
  border-color: #60a5fa;
  color: #fde68a;
}

/* Scrollbars (webkit) */
[data-theme="dark"] ::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
[data-theme="dark"] ::-webkit-scrollbar-track {
  background: #1e293b;
}
[data-theme="dark"] ::-webkit-scrollbar-thumb {
  background: #334155;
  border-radius: 4px;
}
[data-theme="dark"] ::-webkit-scrollbar-thumb:hover {
  background: #475569;
}

/* Pagination */
[data-theme="dark"] .pagination-btn {
  background: #1e293b;
  border-color: #334155;
  color: #cbd5e1;
}
[data-theme="dark"] .pagination-btn:hover:not(:disabled) {
  border-color: #3b82f6;
  color: #60a5fa;
}
[data-theme="dark"] .pagination-btn.active {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

  `;
  document.head.appendChild(s);
}());

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 2 · MODO ESCURO — lê localStorage e aplica ao <html>
// ─────────────────────────────────────────────────────────────────────────────

(function _initDarkMode() {
  function _aplicar() {
    var tema;
    try { tema = localStorage.getItem('theme'); } catch(e) { tema = null; }
    if (tema === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  // Aplicar imediatamente (evita flash)
  _aplicar();

  // Ouvir mudanças em outras abas
  window.addEventListener('storage', function(e) {
    if (e.key === 'theme') {
      _aplicar();
      _cuiAtualizarBtnTema();
    }
  });

  // Reaplica no DOMContentLoaded (segurança extra)
  document.addEventListener('DOMContentLoaded', _aplicar);

  // Expõe globalmente para que outros scripts possam chamar
  window.CUI_APLICAR_TEMA = _aplicar;
}());

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 3 · POPUP DE IMAGEM
// ─────────────────────────────────────────────────────────────────────────────

var _cuiImageOverlay = null;

function _cuiAbrirImagem(src, titulo) {
  if (!_cuiImageOverlay) {
    var ov = document.createElement('div');
    ov.id = 'cui-img-overlay';
    ov.className = 'cui-overlay';
    ov.innerHTML = `
      <div class="cui-popup">
        <div class="cui-popup-header">
          <h4 id="cui-img-titulo"><i class="fa-solid fa-image"></i> <span></span></h4>
          <button class="cui-popup-close" id="cui-img-fechar">×</button>
        </div>
        <div class="cui-popup-body" id="cui-img-body">
          <div class="cui-img-error" id="cui-img-placeholder">
            <div style="width:48px;height:48px;border:4px solid #e5e7eb;border-top-color:#2563eb;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 14px;"></div>
            <p>Carregando imagem…</p>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(ov);
    _cuiImageOverlay = ov;

    ov.addEventListener('click', function(e) {
      if (e.target === ov) ov.classList.remove('open');
    });
    document.getElementById('cui-img-fechar').addEventListener('click', function() {
      ov.classList.remove('open');
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && ov.classList.contains('open')) ov.classList.remove('open');
    });
  }

  // Atualiza conteúdo
  document.querySelector('#cui-img-titulo span').textContent = titulo || 'Imagem';
  var body = document.getElementById('cui-img-body');
  body.innerHTML = `
    <div class="cui-img-error" style="display:block;">
      <div style="width:48px;height:48px;border:4px solid #e5e7eb;border-top-color:#2563eb;border-radius:50%;animation:spin 1s linear infinite;margin:0 auto 14px;"></div>
      <p>Carregando…</p>
    </div>
  `;
  _cuiImageOverlay.classList.add('open');

  var img = new Image();
  img.onload = function() {
    body.innerHTML = '';
    body.appendChild(img);
  };
  img.onerror = function() {
    body.innerHTML = `
      <div class="cui-img-error">
        <i class="fa-solid fa-triangle-exclamation"></i>
        <p>Imagem não encontrada.<br><small>${src}</small></p>
      </div>
    `;
  };
  img.src = src;
  img.alt = titulo || '';
  img.style.cssText = 'max-width:100%;height:auto;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.18);display:block;';
}

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 4 · POPUP DE MANUAL DE AJUDA (abrir aba ou baixar PDF)
// ─────────────────────────────────────────────────────────────────────────────

function _cuiAbrirManual(src, titulo) {
  var existente = document.getElementById('cui-manual-overlay');
  if (existente) existente.remove();

  var ov = document.createElement('div');
  ov.id = 'cui-manual-overlay';
  ov.className = 'cui-overlay';
  ov.innerHTML = `
    <div class="cui-manual-dialog">
      <div class="cui-manual-icon">
        <i class="fa-solid fa-file-pdf"></i>
      </div>
      <div class="cui-manual-body">
        <h3>${titulo || 'Manual do Sistema'}</h3>
        <p>Como você prefere acessar o manual?</p>
        <div class="cui-manual-actions">
          <button class="cui-manual-btn-tab" id="cui-manual-aba">
            <i class="fa-solid fa-arrow-up-right-from-square"></i> Abrir em nova aba
          </button>
          <button class="cui-manual-btn-down" id="cui-manual-baixar">
            <i class="fa-solid fa-download"></i> Baixar PDF
          </button>
        </div>
      </div>
      <div class="cui-manual-footer">
        <button id="cui-manual-cancelar">Cancelar</button>
      </div>
    </div>
  `;
  document.body.appendChild(ov);
  ov.classList.add('open');

  var fechar = function() { ov.classList.remove('open'); setTimeout(function() { ov.remove(); }, 300); };

  ov.addEventListener('click', function(e) { if (e.target === ov) fechar(); });
  document.getElementById('cui-manual-cancelar').addEventListener('click', fechar);
  document.addEventListener('keydown', function handler(e) {
    if (e.key === 'Escape') { fechar(); document.removeEventListener('keydown', handler); }
  });

  document.getElementById('cui-manual-aba').addEventListener('click', function() {
    window.open(src, '_blank');
    fechar();
  });

  document.getElementById('cui-manual-baixar').addEventListener('click', function() {
    var a = document.createElement('a');
    a.href = src;
    a.download = src.split('/').pop() || 'manual.pdf';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    fechar();
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 5 · TOGGLE DE TEMA CLARO / ESCURO
// ─────────────────────────────────────────────────────────────────────────────

/** Retorna o tema atual ('dark' ou 'light') */
function _cuiTemaAtual() {
  try { return localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'; }
  catch(e) { return 'light'; }
}

/**
 * Atualiza ícone, tooltip e data-modo de TODOS os botões toggle já inseridos.
 * Chamado após qualquer mudança de tema.
 */
function _cuiAtualizarBtnTema() {
  var modo = _cuiTemaAtual();
  document.querySelectorAll('.cui-btn-tema-toggle').forEach(function(btn) {
    btn.setAttribute('data-modo', modo);
    var icone = btn.querySelector('i');
    if (!icone) return;

    if (modo === 'dark') {
      icone.className = 'fa-solid fa-sun';
      btn.title = 'Mudar para tema claro';
      btn.setAttribute('aria-label', 'Mudar para tema claro');
    } else {
      icone.className = 'fa-solid fa-moon';
      btn.title = 'Mudar para tema escuro';
      btn.setAttribute('aria-label', 'Mudar para tema escuro');
    }
  });
}

/**
 * Alterna o tema e anima o botão clicado.
 * @param {HTMLElement} btn — o próprio botão clicado
 */
function _cuiToggleTema(btn) {
  var novoTema = _cuiTemaAtual() === 'dark' ? 'light' : 'dark';

  // Animação de giro no ícone
  if (btn) {
    btn.classList.add('cui-girando');
    btn.addEventListener('animationend', function limpar() {
      btn.classList.remove('cui-girando');
      btn.removeEventListener('animationend', limpar);
    });
  }

  try { localStorage.setItem('theme', novoTema); } catch(e) {}

  if (typeof window.CUI_APLICAR_TEMA === 'function') window.CUI_APLICAR_TEMA();
  _cuiAtualizarBtnTema();
}

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 6 · CRIAÇÃO DOS BOTÕES
// ─────────────────────────────────────────────────────────────────────────────

function _cuiCriarBotao(cfg) {
  var btn = document.createElement('button');
  btn.id = cfg.id;
  btn.type = 'button';
  btn.title = cfg.titulo || cfg.label;

  switch (cfg.estilo) {
    case 'ghost':
      btn.className = 'cui-btn-ghost';
      btn.innerHTML = '<i class="' + cfg.icon + '"></i> ' + cfg.label;
      break;
    case 'icone-badge':
      btn.className = 'cui-btn-icone-badge';
      btn.innerHTML = '<i class="' + cfg.icon + '"></i><span>' + cfg.label + '</span>';
      break;
    case 'tema-toggle':
      btn.className = 'cui-btn-tema-toggle';
      btn.setAttribute('aria-label', 'Alternar tema claro/escuro');
      // Ícone e data-modo definidos por _cuiAtualizarBtnTema()
      btn.innerHTML = '<i class="fa-solid fa-moon"></i>';
      break;
    default: // 'pill'
      btn.className = 'cui-btn-pill';
      btn.innerHTML = '<i class="' + cfg.icon + '"></i> ' + cfg.label;
  }

  btn.addEventListener('click', function() {
    if (cfg.acao === 'toggle-tema') {
      _cuiToggleTema(btn);
    } else if (cfg.acao === 'manual-ajuda') {
      _cuiAbrirManual(cfg.src, cfg.titulo);
    } else if (cfg.acao === 'link') {
      window.open(cfg.href || cfg.src, '_blank');
    } else {
      _cuiAbrirImagem(cfg.src, cfg.titulo);
    }
  });

  return btn;
}

function _cuiInserir(cfg) {
  var btn = _cuiCriarBotao(cfg);

  switch (cfg.posicao) {

    // ── Faixa logo abaixo do divisor "Mais ações" ────────────────────────────
    case 'sidebar-secao': {
      // Procura o nav-divider cujo texto inclui "Mais" ou usa o primeiro disponível
      var dividers = document.querySelectorAll('.nav-divider');
      var alvo = null;
      dividers.forEach(function(d) {
        if (!alvo && /mais/i.test(d.textContent)) alvo = d;
      });
      if (!alvo && dividers.length) alvo = dividers[0];
      if (!alvo) return; // fallback: não inseriu

      // Reutiliza strip existente ou cria um novo
      var strip = alvo.nextElementSibling;
      if (!strip || !strip.classList.contains('cui-secao-strip')) {
        strip = document.createElement('div');
        strip.className = 'cui-secao-strip';
        alvo.parentNode.insertBefore(strip, alvo.nextSibling);
      }
      strip.appendChild(btn);
      break;
    }

    // ── Canto direito do header principal ───────────────────────────────────
    case 'header-direita': {
      var header = document.querySelector('.global-header');
      if (!header) return;
      // Garante que o header fique em flex com space-between se ainda não estiver
      header.style.display = 'flex';
      header.style.alignItems = 'center';
      header.style.justifyContent = 'space-between';

      // Agrupa botões à direita em um wrapper
      var wrapper = header.querySelector('.cui-header-actions');
      if (!wrapper) {
        wrapper = document.createElement('div');
        wrapper.className = 'cui-header-actions';
        wrapper.style.cssText = 'display:flex;align-items:center;gap:8px;flex-shrink:0;';
        header.appendChild(wrapper);
      }
      wrapper.appendChild(btn);
      break;
    }

    // ── Abaixo do botão "Voltar ao início" na sidebar ────────────────────────
    case 'sidebar-rodape': {
      var btnHome = document.getElementById('btn-home');
      if (!btnHome) return;
      var footer = btnHome.closest('.sidebar-footer');
      if (!footer) return;

      // Container de botões logo após o btn-home
      var rodapeWrap = footer.querySelector('.cui-rodape-wrap');
      if (!rodapeWrap) {
        rodapeWrap = document.createElement('div');
        rodapeWrap.className = 'cui-rodape-wrap';
        rodapeWrap.style.cssText = 'display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;';
        // Insere depois do btnHome
        btnHome.parentNode.insertBefore(rodapeWrap, btnHome.nextSibling);
      }
      rodapeWrap.appendChild(btn);
      break;
    }

    default:
      console.warn('[custom-ui.js] posicao desconhecida:', cfg.posicao);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SEÇÃO 8 · INICIALIZAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function() {
  BOTOES_CONFIG.forEach(function(cfg) {
    if (!cfg || !cfg.id) return;
    _cuiInserir(cfg);
  });

  // Re-aplica tema e sincroniza ícone do toggle
  if (typeof window.CUI_APLICAR_TEMA === 'function') window.CUI_APLICAR_TEMA();
  _cuiAtualizarBtnTema();
});

