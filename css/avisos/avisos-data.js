/**
 * ==================================================
 * BANCO DE DADOS DE AVISOS E CHANGELOG
 * ==================================================
 * 
 * Estrutura de cada aviso:
 * {
 *   id: string único,
 *   date: 'DD/MM/YYYY',
 *   title: 'Título do aviso',
 *   description: 'Descrição detalhada',
 *   type: 'new' | 'improvement' | 'fix' | 'warning',
 *   pages: ['index', 'login', 'global'], // onde aparece
 *   features: ['Feature 1', 'Feature 2'], // lista de mudanças
 *   tags: ['new', 'feature', 'improvement']
 * }
 */

const AVISOS_DATABASE = [
    // ==================================================
    // AVISOS GLOBAIS (aparecem em todas as páginas)
    // ==================================================
    {
        id: 'global-001',
        date: '03/01/2025',
        title: 'Sistema de Avisos Implementado',
        description: 'Agora você pode acompanhar todas as novidades e atualizações do sistema em tempo real!',
        type: 'new',
        pages: ['global'], // Aparece em todas as páginas
        features: [
            'Widget flutuante no canto inferior direito',
            'Timeline visual de mudanças',
            'Filtros por tipo de atualização',
            'Indicador de novidades não lidas',
            'Histórico completo de alterações'
        ],
        tags: ['new', 'feature']
    },

    // ==================================================
    // AVISOS ESPECÍFICOS DO INDEX (Cartazes)
    // ==================================================
    {
        id: 'index-001',
        date: '03/01/2025',
        title: 'Busca Avançada de Produtos',
        description: 'Sistema completo de busca por texto com múltiplos critérios e agrupamentos inteligentes.',
        type: 'new',
        pages: ['index'],
        features: [
            'Busca por código parcial ou completo',
            'Busca por nome/descrição com similaridade fuzzy (70%)',
            'Busca automática por marca extraída da descrição',
            'Paginação de 10 produtos por página',
            'Modal moderno com tabela responsiva'
        ],
        tags: ['new', 'feature']
    },
    {
        id: 'index-002',
        date: '03/01/2025',
        title: 'Sistema de Agrupamento de Produtos',
        description: 'Organize os resultados da busca de diferentes formas para facilitar a visualização.',
        type: 'new',
        pages: ['index'],
        features: [
            'Agrupamento por marca (alfabético)',
            'Agrupamento por código similar',
            'Visualização sem agrupamento (padrão)',
            'Menu dropdown intuitivo',
            'Confirmação visual via toast'
        ],
        tags: ['new', 'feature']
    },
    {
        id: 'index-003',
        date: '03/01/2025',
        title: 'Overlay de Busca Modernizado',
        description: 'Feedback visual aprimorado durante a busca de produtos com 3 estados distintos.',
        type: 'improvement',
        pages: ['index'],
        features: [
            'Estado 1: "Buscando informações" com spinner duplo',
            'Estado 2: "Informações encontradas" com ícone de sucesso',
            'Estado 3: "Informações inexistentes" com ícone de erro',
            'Animações suaves e profissionais',
            'Spinner moderno com efeito pulse'
        ],
        tags: ['improvement', 'design']
    },
    {
        id: 'index-004',
        date: '03/01/2025',
        title: 'Toasts com Ícones Coloridos',
        description: 'Sistema de notificações completamente reformulado com design moderno e intuitivo.',
        type: 'improvement',
        pages: ['index'],
        features: [
            'Ícones Font Awesome específicos por tipo',
            'Cores diferenciadas: Verde (sucesso), Vermelho (erro), Amarelo (aviso), Azul (info)',
            'Gradientes sutis no fundo',
            'Bordas laterais coloridas de 4px',
            'Ícones em círculos coloridos de 32px'
        ],
        tags: ['improvement', 'design']
    },
    {
        id: 'index-005',
        date: '03/01/2025',
        title: 'Correção do Menu de Agrupamento',
        description: 'Menu dropdown agora funciona perfeitamente após ajustes de CSS.',
        type: 'fix',
        pages: ['index'],
        features: [
            'Adicionado position: relative nos containers pais',
            'z-index corrigido para 1000',
            'Animação slideDown suave',
            'Fechamento automático ao clicar fora'
        ],
        tags: ['fix']
    },
    {
        id: 'index-006',
        date: '03/01/2025',
        title: 'Otimização de Performance',
        description: 'Sistema agora reutiliza dados já carregados em memória.',
        type: 'improvement',
        pages: ['index'],
        features: [
            'Cache de produtos em memória',
            'Eliminação de requisições desnecessárias à API',
            'Carregamento instantâneo na segunda abertura',
            'Melhor experiência do usuário'
        ],
        tags: ['improvement', 'performance']
    },

    // ==================================================
    // AVISOS ESPECÍFICOS DO LOGIN
    // ==================================================
    {
        id: 'login-001',
        date: '15/12/2024',
        title: 'Sistema de Login Seguro',
        description: 'Autenticação implementada com verificação de permissões.',
        type: 'new',
        pages: ['login'],
        features: [
            'Validação de credenciais',
            'Armazenamento seguro em localStorage',
            'Controle de permissões (admin, suporte, usuário)',
            'Redirecionamento automático'
        ],
        tags: ['new', 'feature']
    },

    // ==================================================
    // EXEMPLO: Avisos para múltiplas páginas
    // ==================================================
    {
        id: 'multi-001',
        date: '01/01/2025',
        title: 'Atualização de Segurança',
        description: 'Melhorias gerais de segurança implementadas em todo o sistema.',
        type: 'warning',
        pages: ['index', 'login'], // Aparece em index E login
        features: [
            'Validação reforçada de inputs',
            'Proteção contra XSS',
            'Sanitização de dados',
            'Logs de atividades sensíveis'
        ],
        tags: ['improvement', 'security']
    }
];

/**
 * ==================================================
 * CONFIGURAÇÕES POR PÁGINA
 * ==================================================
 */
const AVISOS_CONFIG = {
    // Configuração para index.html (Cartazes)
    'index': {
        title: 'Novidades do Sistema de Cartazes',
        subtitle: 'Acompanhe as últimas atualizações',
        icon: 'fa-lightbulb',
        filters: [
            { id: 'all', label: 'Todas', icon: 'fa-list' },
            { id: 'new', label: 'Novidades', icon: 'fa-star' },
            { id: 'improvement', label: 'Melhorias', icon: 'fa-arrow-up' },
            { id: 'fix', label: 'Correções', icon: 'fa-wrench' }
        ]
    },

    // Configuração para login.html
    'login': {
        title: 'Atualizações do Sistema',
        subtitle: 'Fique por dentro das mudanças',
        icon: 'fa-lightbulb',
        filters: [
            { id: 'all', label: 'Todas', icon: 'fa-list' },
            { id: 'new', label: 'Novidades', icon: 'fa-star' },
            { id: 'warning', label: 'Importantes', icon: 'fa-exclamation-triangle' }
        ]
    },

    // Configuração padrão (fallback)
    'default': {
        title: 'Novidades do Sistema',
        subtitle: 'Últimas atualizações',
        icon: 'fa-lightbulb',
        filters: [
            { id: 'all', label: 'Todas', icon: 'fa-list' },
            { id: 'new', label: 'Novidades', icon: 'fa-star' }
        ]
    }
};

/**
 * ==================================================
 * ÍCONES POR TIPO
 * ==================================================
 */
const AVISOS_ICONS = {
    'new': 'fa-star',
    'improvement': 'fa-arrow-trend-up',
    'fix': 'fa-wrench',
    'warning': 'fa-triangle-exclamation',
    'info': 'fa-circle-info'
};

/**
 * ==================================================
 * FUNÇÕES AUXILIARES
 * ==================================================
 */

// Detecta a página atual baseada no nome do arquivo HTML
function detectarPaginaAtual() {
    const path = window.location.pathname;
    const fileName = path.split('/').pop().replace('.html', '');
    return fileName || 'index';
}

// Retorna avisos filtrados por página
function obterAvisosPorPagina(pageName) {
    return AVISOS_DATABASE.filter(aviso => {
        return aviso.pages.includes('global') || aviso.pages.includes(pageName);
    }).sort((a, b) => {
        // Ordenar por data (mais recente primeiro)
        const [diaA, mesA, anoA] = a.date.split('/');
        const [diaB, mesB, anoB] = b.date.split('/');
        const dataA = new Date(anoA, mesA - 1, diaA);
        const dataB = new Date(anoB, mesB - 1, diaB);
        return dataB - dataA;
    });
}

// Retorna configuração da página
function obterConfigPagina(pageName) {
    return AVISOS_CONFIG[pageName] || AVISOS_CONFIG['default'];
}

// Verifica se há avisos não lidos
function temAvisosNaoLidos(pageName) {
    const avisos = obterAvisosPorPagina(pageName);
    const lidos = JSON.parse(localStorage.getItem('avisos_lidos') || '[]');
    return avisos.some(aviso => !lidos.includes(aviso.id));
}

// Marca todos os avisos como lidos
function marcarTodosComoLidos(pageName) {
    const avisos = obterAvisosPorPagina(pageName);
    const lidos = JSON.parse(localStorage.getItem('avisos_lidos') || '[]');
    const novosLidos = [...new Set([...lidos, ...avisos.map(a => a.id)])];
    localStorage.setItem('avisos_lidos', JSON.stringify(novosLidos));
}

// Marca um aviso específico como lido
function marcarComoLido(avisoId) {
    const lidos = JSON.parse(localStorage.getItem('avisos_lidos') || '[]');
    if (!lidos.includes(avisoId)) {
        lidos.push(avisoId);
        localStorage.setItem('avisos_lidos', JSON.stringify(lidos));
    }
}

// Verifica se um aviso foi lido
function foiLido(avisoId) {
    const lidos = JSON.parse(localStorage.getItem('avisos_lidos') || '[]');
    return lidos.includes(avisoId);
}
