/**
 * ==================================================
 * SISTEMA DE AVISOS E CHANGELOG
 * Versão: 1.0.0
 * Auto-inicializa quando importado
 * ==================================================
 */

(function() {
    'use strict';

    // ==================================================
    // VARIÁVEIS GLOBAIS
    // ==================================================
    let paginaAtual = '';
    let configAtual = {};
    let avisosAtual = [];
    let filtroAtivo = 'all';

    // ==================================================
    // INICIALIZAÇÃO AUTOMÁTICA
    // ==================================================
    function inicializar() {
        // Detectar página atual
        paginaAtual = detectarPaginaAtual();
        configAtual = obterConfigPagina(paginaAtual);
        avisosAtual = obterAvisosPorPagina(paginaAtual);

        console.log('📢 Sistema de Avisos inicializado');
        console.log('📄 Página detectada:', paginaAtual);
        console.log('📋 Total de avisos:', avisosAtual.length);

        // Criar elementos na página
        criarBotaoFlutuante();
        criarModal();
        
        // Configurar eventos
        configurarEventos();

        // Verificar se há novidades
        verificarNovidades();
    }

    // ==================================================
    // CRIAR BOTÃO FLUTUANTE
    // ==================================================
    function criarBotaoFlutuante() {
        const botao = document.createElement('button');
        botao.className = 'avisos-float-button';
        botao.id = 'avisos-float-btn';
        botao.innerHTML = `
            <i class="fa-solid ${configAtual.icon}"></i>
            <span class="avisos-badge" id="avisos-badge" style="display: none;">NOVO</span>
        `;
        botao.title = 'Ver novidades e atualizações';
        
        document.body.appendChild(botao);
    }

    // ==================================================
    // CRIAR MODAL
    // ==================================================
    function criarModal() {
        const overlay = document.createElement('div');
        overlay.className = 'avisos-overlay';
        overlay.id = 'avisos-overlay';
        
        overlay.innerHTML = `
            <div class="avisos-modal" onclick="event.stopPropagation()">
                <!-- Header -->
                <div class="avisos-modal-header">
                    <div class="avisos-modal-title">
                        <i class="fa-solid ${configAtual.icon}"></i>
                        <div>
                            <h2>${configAtual.title}</h2>
                            <div class="avisos-modal-subtitle">${configAtual.subtitle}</div>
                        </div>
                    </div>
                    <button class="avisos-modal-close" id="avisos-modal-close">
                        <i class="fa-solid fa-times"></i>
                    </button>
                </div>

                <!-- Filtros -->
                <div class="avisos-filters" id="avisos-filters">
                    ${renderizarFiltros()}
                </div>

                <!-- Body -->
                <div class="avisos-modal-body" id="avisos-modal-body">
                    ${renderizarTimeline()}
                </div>

                <!-- Footer -->
                <div class="avisos-modal-footer">
                    <div class="avisos-footer-info">
                        <i class="fa-solid fa-clock"></i>
                        Última atualização: ${obterUltimaAtualizacao()}
                    </div>
                    <button class="avisos-mark-read-btn" id="avisos-mark-read">
                        <i class="fa-solid fa-check-double"></i>
                        Marcar tudo como lido
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
    }

    // ==================================================
    // RENDERIZAR FILTROS
    // ==================================================
    function renderizarFiltros() {
        return configAtual.filters.map(filtro => {
            const count = filtro.id === 'all' 
                ? avisosAtual.length 
                : avisosAtual.filter(a => a.type === filtro.id).length;
            
            const activeClass = filtro.id === filtroAtivo ? 'active' : '';
            
            return `
                <button class="avisos-filter-btn ${activeClass}" data-filter="${filtro.id}">
                    <i class="fa-solid ${filtro.icon}"></i>
                    ${filtro.label}
                    <span class="avisos-filter-count">${count}</span>
                </button>
            `;
        }).join('');
    }

    // ==================================================
    // RENDERIZAR TIMELINE
    // ==================================================
    function renderizarTimeline() {
        let avisosFiltrados = avisosAtual;
        
        if (filtroAtivo !== 'all') {
            avisosFiltrados = avisosAtual.filter(a => a.type === filtroAtivo);
        }

        if (avisosFiltrados.length === 0) {
            return `
                <div class="avisos-empty">
                    <i class="fa-solid fa-inbox"></i>
                    <h3>Nenhum aviso encontrado</h3>
                    <p>Não há avisos deste tipo no momento.</p>
                </div>
            `;
        }

        return `
            <div class="avisos-timeline">
                ${avisosFiltrados.map(aviso => renderizarItem(aviso)).join('')}
            </div>
        `;
    }

    // ==================================================
    // RENDERIZAR ITEM DA TIMELINE
    // ==================================================
    function renderizarItem(aviso) {
        const lido = foiLido(aviso.id);
        const iconClass = lido ? aviso.type : 'new';
        const icon = AVISOS_ICONS[aviso.type] || 'fa-circle-info';

        return `
            <div class="avisos-item" data-id="${aviso.id}">
                <div class="avisos-item-icon ${iconClass}">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="avisos-item-content">
                    <div class="avisos-item-header">
                        <h3 class="avisos-item-title">${aviso.title}</h3>
                        <span class="avisos-item-date">${aviso.date}</span>
                    </div>
                    <p class="avisos-item-description">${aviso.description}</p>
                    ${aviso.features && aviso.features.length > 0 ? `
                        <ul class="avisos-item-features">
                            ${aviso.features.map(f => `<li>${f}</li>`).join('')}
                        </ul>
                    ` : ''}
                    ${aviso.tags && aviso.tags.length > 0 ? `
                        <div class="avisos-item-tags">
                            ${aviso.tags.map(tag => `<span class="avisos-tag ${tag}">${tag}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // ==================================================
    // OBTER ÚLTIMA ATUALIZAÇÃO
    // ==================================================
    function obterUltimaAtualizacao() {
        if (avisosAtual.length === 0) return 'Sem atualizações';
        return avisosAtual[0].date;
    }

    // ==================================================
    // CONFIGURAR EVENTOS
    // ==================================================
    function configurarEventos() {
        // Abrir modal
        document.getElementById('avisos-float-btn').addEventListener('click', abrirModal);

        // Fechar modal
        document.getElementById('avisos-modal-close').addEventListener('click', fecharModal);
        document.getElementById('avisos-overlay').addEventListener('click', fecharModal);

        // Marcar como lido
        document.getElementById('avisos-mark-read').addEventListener('click', () => {
            marcarTodosComoLidos(paginaAtual);
            fecharModal();
            atualizarBadge();
            
            // Toast de confirmação (se existir a função)
            if (typeof showToast === 'function') {
                showToast('success', 'Avisos marcados como lidos', 'Você está em dia com as novidades!');
            }
        });

        // Filtros (event delegation)
        document.getElementById('avisos-filters').addEventListener('click', (e) => {
            const btn = e.target.closest('.avisos-filter-btn');
            if (!btn) return;

            filtroAtivo = btn.dataset.filter;
            atualizarConteudoModal();
        });
    }

    // ==================================================
    // ABRIR MODAL
    // ==================================================
    function abrirModal() {
        document.getElementById('avisos-overlay').classList.add('active');
        document.body.style.overflow = 'hidden';
        
        // Marcar avisos visíveis como lidos após 2 segundos
        setTimeout(() => {
            avisosAtual.forEach(aviso => {
                marcarComoLido(aviso.id);
            });
            atualizarBadge();
        }, 2000);
    }

    // ==================================================
    // FECHAR MODAL
    // ==================================================
    function fecharModal() {
        document.getElementById('avisos-overlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    // ==================================================
    // ATUALIZAR CONTEÚDO DO MODAL
    // ==================================================
    function atualizarConteudoModal() {
        // Atualizar filtros
        document.getElementById('avisos-filters').innerHTML = renderizarFiltros();

        // Atualizar timeline
        document.getElementById('avisos-modal-body').innerHTML = renderizarTimeline();
    }

    // ==================================================
    // VERIFICAR NOVIDADES
    // ==================================================
    function verificarNovidades() {
        atualizarBadge();
    }

    // ==================================================
    // ATUALIZAR BADGE
    // ==================================================
    function atualizarBadge() {
        const badge = document.getElementById('avisos-badge');
        const botao = document.getElementById('avisos-float-btn');
        
        if (temAvisosNaoLidos(paginaAtual)) {
            badge.style.display = 'block';
            botao.classList.add('has-new');
        } else {
            badge.style.display = 'none';
            botao.classList.remove('has-new');
        }
    }

    // ==================================================
    // EXECUTAR QUANDO O DOM ESTIVER PRONTO
    // ==================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', inicializar);
    } else {
        inicializar();
    }

    // ==================================================
    // EXPOR API PÚBLICA (opcional)
    // ==================================================
    window.SistemaAvisos = {
        abrir: abrirModal,
        fechar: fecharModal,
        atualizar: () => {
            avisosAtual = obterAvisosPorPagina(paginaAtual);
            atualizarConteudoModal();
            verificarNovidades();
        },
        marcarLidos: () => {
            marcarTodosComoLidos(paginaAtual);
            atualizarBadge();
        },
        limparLidos: () => {
            localStorage.removeItem('avisos_lidos');
            atualizarBadge();
        }
    };

})();
