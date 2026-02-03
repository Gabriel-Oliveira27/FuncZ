/* ============================================================================
   FUNCIONALIDADE: TAMANHOS PERSONALIZADOS DOS CARTAZES
   ============================================================================
   
   Este arquivo adiciona 3 opções de tamanho para TODO O CONTEÚDO do cartaz:
   - Tamanho 1: X + (X/2) = 150% (scale 1.5)
   - Tamanho 2: X + (X/3) = 133% (scale 1.333)
   - Tamanho 3: X + (X/4) = 125% (scale 1.25)
   
   O zoom é aplicado NO POSTER INTEIRO através de CLASSE CSS!
   
   ============================================================================ */

// ✅ Função para obter o tamanho selecionado
function obterTamanhoSelecionado() {
    const radios = document.querySelectorAll('input[name="tamanho-cartaz"]');
    for (const radio of radios) {
      if (radio.checked) {
        return radio.value;
      }
    }
    return 'normal'; // Default
  }
  
  // ✅ Função para obter o scale baseado no tamanho
  function obterScalePorTamanho(tamanho) {
    const scales = {
      '1': 1.5,      // X + (X/2) = 1.5X = 150%
      '2': 1.333,    // X + (X/3) = 1.333X = 133%
      '3': 1.25,     // X + (X/4) = 1.25X = 125%
      'normal': 1.0  // Tamanho original
    };
    return scales[tamanho] || 1.0;
  }
  
  // ✅ Função para aplicar zoom NO POSTER INTEIRO (via classe CSS)
  function aplicarZoomNoPoster(poster, scale) {
    if (!poster) return;
    
    // Remover todas as classes de zoom anteriores
    poster.classList.remove('poster-zoom-1', 'poster-zoom-2', 'poster-zoom-3');
    poster.removeAttribute('data-scale');
    
    if (scale === 1.0) {
      // Normal - sem classe de zoom
      console.log('🔍 Zoom removido (tamanho normal)');
    } else if (scale === 1.5) {
      // Tamanho 1: +50%
      poster.classList.add('poster-zoom-1');
      poster.setAttribute('data-scale', '1.5');
      console.log('🔍 Zoom 1.5x aplicado (Tamanho 1)');
    } else if (scale === 1.333) {
      // Tamanho 2: +33%
      poster.classList.add('poster-zoom-2');
      poster.setAttribute('data-scale', '1.333');
      console.log('🔍 Zoom 1.333x aplicado (Tamanho 2)');
    } else if (scale === 1.25) {
      // Tamanho 3: +25%
      poster.classList.add('poster-zoom-3');
      poster.setAttribute('data-scale', '1.25');
      console.log('🔍 Zoom 1.25x aplicado (Tamanho 3)');
    }
  }
  
  // ✅ HOOK: Interceptar a criação de cartazes
  if (typeof window.criarCartaz !== 'undefined') {
    const criarCartazOriginal = window.criarCartaz;
    
    window.criarCartaz = function(produto) {
      // Chamar função original
      const resultado = criarCartazOriginal(produto);
      
      // ✅ APLICAR ZOOM NO POSTER INTEIRO
      setTimeout(() => {
        const tamanho = obterTamanhoSelecionado();
        const scale = obterScalePorTamanho(tamanho);
        
        // Encontrar o poster recém-criado
        const previews = document.querySelectorAll('.product-preview');
        const ultimoPreview = previews[previews.length - 1];
        
        if (ultimoPreview) {
          const poster = ultimoPreview.querySelector('.poster, .poster-carne');
          if (poster) {
            aplicarZoomNoPoster(poster, scale);
            console.log(`✅ Cartaz criado com zoom ${scale}x`);
          }
        }
      }, 100);
      
      return resultado;
    };
    
    console.log('✅ Hook na função criarCartaz() instalado');
  }
  
  // ✅ HOOK: Interceptar a renderização de cartazes (ao importar JSON)
  if (typeof window.renderizarCartaz !== 'undefined') {
    const renderizarCartazOriginal = window.renderizarCartaz;
    
    window.renderizarCartaz = function(produto) {
      // Chamar função original
      const resultado = renderizarCartazOriginal(produto);
      
      // ✅ APLICAR ZOOM NO POSTER INTEIRO
      setTimeout(() => {
        const tamanho = obterTamanhoSelecionado();
        const scale = obterScalePorTamanho(tamanho);
        
        const previews = document.querySelectorAll('.product-preview');
        const ultimoPreview = previews[previews.length - 1];
        
        if (ultimoPreview) {
          const poster = ultimoPreview.querySelector('.poster, .poster-carne');
          if (poster) {
            aplicarZoomNoPoster(poster, scale);
            console.log(`✅ Cartaz importado com zoom ${scale}x`);
          }
        }
      }, 100);
      
      return resultado;
    };
    
    console.log('✅ Hook na função renderizarCartaz() instalado');
  }
  
  // ✅ LISTENER: Mudar tamanho dos cartazes existentes
  document.addEventListener('DOMContentLoaded', function() {
    const radios = document.querySelectorAll('input[name="tamanho-cartaz"]');
    
    radios.forEach(radio => {
      radio.addEventListener('change', function() {
        const tamanho = this.value;
        const scale = obterScalePorTamanho(tamanho);
        
        // Aplicar em TODOS os posters existentes
        const previews = document.querySelectorAll('.product-preview');
        previews.forEach(preview => {
          const poster = preview.querySelector('.poster, .poster-carne');
          if (poster) {
            aplicarZoomNoPoster(poster, scale);
          }
        });
        
        // Mostrar toast
        if (scale === 1.0) {
          showToast('info', 'Tamanho normal', 'Cartazes voltaram ao tamanho padrão');
        } else {
          const percentual = Math.round((scale - 1) * 100);
          showToast('success', `Tamanho ${tamanho}`, `Cartazes aumentados em +${percentual}%`);
        }
        
        console.log(`✅ Tamanho alterado para: ${tamanho} (scale ${scale})`);
      });
    });
    
    console.log('✅ Listeners de tamanho instalados');
  });
  
  // ✅ OBSERVER: Aplicar zoom automaticamente ao adicionar novos cartazes
  const tamanhoObserver = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      if (mutation.addedNodes.length > 0) {
        const tamanho = obterTamanhoSelecionado();
        const scale = obterScalePorTamanho(tamanho);
        
        mutation.addedNodes.forEach(node => {
          if (node.classList && node.classList.contains('product-preview')) {
            const poster = node.querySelector('.poster, .poster-carne');
            if (poster) {
              setTimeout(() => {
                aplicarZoomNoPoster(poster, scale);
                console.log(`✅ Zoom ${scale}x aplicado automaticamente`);
              }, 150);
            }
          }
        });
      }
    });
  });
  
  document.addEventListener('DOMContentLoaded', function() {
    const productsList = document.getElementById('products-list');
    if (productsList) {
      tamanhoObserver.observe(productsList, {
        childList: true,
        subtree: true
      });
      console.log('✅ Observer de novos cartazes ativado');
    }
  });
  
  // ✅ Exportar funções
  window.obterTamanhoSelecionado = obterTamanhoSelecionado;
  window.obterScalePorTamanho = obterScalePorTamanho;
  window.aplicarZoomNoPoster = aplicarZoomNoPoster;
  
  console.log('✅ Módulo "Tamanhos personalizados" carregado com sucesso!');
  console.log('📊 Tamanhos disponíveis:');
  console.log('  • Tamanho 1: +50% (scale 1.5) - X + (X/2)');
  console.log('  • Tamanho 2: +33% (scale 1.333) - X + (X/3)');
  console.log('  • Tamanho 3: +25% (scale 1.25) - X + (X/4)');
  console.log('  • Normal: 100% (scale 1.0)');
  console.log('🎯 O zoom é aplicado NO POSTER INTEIRO via CLASSE CSS!');
  console.log('🎯 Preview = PDF gerado (exatamente igual)!');
  