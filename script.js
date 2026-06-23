/* ==========================================================================
   TRAVA DE SCROLL — Força o site a iniciar sempre no topo após F5/reload
   ========================================================================== */
if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
window.scrollTo(0, 0);

/* ==========================================================================
   SITE DE CASAMENTO: WESLEY & STEFANY
   LÓGICA DA INTRODUÇÃO CINEMATOGRÁFICA + MOTOR DO CARROSSEL HERO (Passo 3)
   ==========================================================================

   ORDEM DE EVENTOS:
     1. Intro roda (logo → T1 → T2 juntos → overlay some)
     2. endIntro() é chamado: carrossel inicia + logo decorativo faz fade-in
     3. A partir daí, carrossel avança a cada 6s em loop infinito

   Z-INDEX (reforço da hierarquia CSS):
     1  → #hero-carousel-container
     2  → .hero-logo-reveal
     10000 → #main-nav
     9999  → #intro-screen
   ========================================================================== */

(function () {
  'use strict';

  /* ── Elementos ─────────────────────────────────────────────────────────── */
  const introScreen = document.getElementById('intro-screen');
  if (!introScreen) return;

  const introLogo   = document.getElementById('intro-logo');
  const text1       = document.getElementById('intro-text-1');
  const text2       = document.getElementById('intro-text-2');
  const mainNav     = document.getElementById('main-nav');
  const heroLogo    = document.querySelector('.hero-logo-reveal');
  const slides      = document.querySelectorAll('.hero-slide');

  /* ── Timings — Introdução (ms) ──────────────────────────────────────────*/
  const FADE_MS    = 1500; // duração de cada fade (CSS transition: 1.5s)
  const PAUSE_MS   = 500;  // pausa preta entre elementos
  const LOGO_HOLD  = 2000; // logo fica visível após o fade-in
  const T2_DELAY   = 2000; // T2 aparece 2s após T1 completar o fade-in
  const TOTAL_HOLD = 5000; // tempo total em que T1 fica visível antes do encerramento

  /* ── Timings — Carrossel (ms) ───────────────────────────────────────────*/
  const SLIDE_INTERVAL = 6000; // intervalo entre trocas de foto (6s)

  /* ── Estado ────────────────────────────────────────────────────────────── */
  let phase        = 0;
  let timers       = [];
  let currentSlide = 0;
  let carouselTimer = null;

  /* ── Helpers de Timer ────────────────────────────────────────────────────*/
  function later(ms, fn) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /* ── Helpers de Fade (Intro) ─────────────────────────────────────────────*/

  /** Fade-in: opacity 0 → 1 via classe CSS */
  function show(el) {
    el.classList.remove('fade-out');
    el.classList.add('fade-in');
  }

  /** Fade-out: opacity 1 → 0 via classe CSS */
  function hide(el) {
    el.classList.remove('fade-in');
    el.classList.add('fade-out');
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MOTOR DO CARROSSEL
     startCarousel() é chamado APENAS dentro de endIntro() — nunca durante intro.
     advanceSlide() remove .active do slide atual e aplica no próximo.
     A transição CSS (opacity 1.2s) cuida do cross-fade visualmente.
     ══════════════════════════════════════════════════════════════════════════ */

  function advanceSlide() {
    // Remove .active do slide atual
    slides[currentSlide].classList.remove('active');

    // Avança o índice em loop circular
    currentSlide = (currentSlide + 1) % slides.length;

    // Aplica .active no próximo slide
    slides[currentSlide].classList.add('active');
  }

  function startCarousel() {
    if (slides.length === 0) return; // segurança: sem slides, não faz nada

    // Garante que o primeiro slide está ativo (já definido no HTML via class="hero-slide active")
    // Inicia o loop de avanço automático
    carouselTimer = setInterval(advanceSlide, SLIDE_INTERVAL);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     ENCERRAMENTO DA INTRO + REVEAL DO HERO
     Tudo que torna o site visível e vivo acontece aqui.
     ══════════════════════════════════════════════════════════════════════════ */

  function endIntro() {
    // Remove a overlay da intro do fluxo visual
    introScreen.style.display = 'none';

    // Libera o scroll da página
    document.body.style.overflow = '';

    // Revela o menu de navegação
    mainNav.classList.remove('nav-hidden');

    // Remove o listener de skip
    introScreen.removeEventListener('click', onSkip);

    /* ── REVEAL CINEMATOGRÁFICO ── */
    // 1. Inicia o carrossel de fotos (cross-fade entre slides)
    startCarousel();

    // 2. Logo decorativo faz fade-in suave (CSS transition: 1.8s)
    //    Pequeno delay de 200ms para garantir que o reflow ocorreu
    //    antes da transição, evitando o flash inicial.
    setTimeout(() => {
      if (heroLogo) heroLogo.classList.add('visible');
    }, 200);
  }

  /* ══════════════════════════════════════════════════════════════════════════
     MOTOR DE FASES DA INTRO
     ══════════════════════════════════════════════════════════════════════════ */

  function runPhase(newPhase) {
    clearAll();
    phase = newPhase;

    /* ── FASE 0: Logo ─────────────────────────────────────────────────── */
    if (phase === 0) {

      // Logo aparece (fade-in 1.5s) → fica 2s → avança para Fase 1
      show(introLogo);
      later(FADE_MS + LOGO_HOLD, () => runPhase(1));

    /* ── FASE 1: Textos (T1 sozinho → T2 aparece abaixo → ambos somem) ── */
    } else if (phase === 1) {

      // [1] Logo some (fade-out 1.5s) + pausa (0.5s)
      hide(introLogo);

      later(FADE_MS + PAUSE_MS, () => {

        // [2] T1 aparece (fade-in 1.5s)
        show(text1);

        // [3] 2s após T1 completar fade-in: T2 aparece ABAIXO (T1 permanece)
        later(FADE_MS + T2_DELAY, () => {
          show(text2);
        });

        // [4] 5s após T1 aparecer: ambos somem juntos → avança para Fase 2
        later(FADE_MS + TOTAL_HOLD, () => runPhase(2));

      });

    /* ── FASE 2: Outro — overlay some, site revelado ─────────────────── */
    } else if (phase === 2) {

      // T1 e T2 somem juntos
      hide(text1);
      hide(text2);

      // Após os textos sumirem (1.5s): overlay faz fade-out
      later(FADE_MS, () => {
        introScreen.classList.add('fade-out');

        // Após fade-out da overlay (1.5s): encerra e revela o site
        later(FADE_MS, endIntro);
      });
    }
  }

  /* ── Skip ao Clicar ─────────────────────────────────────────────────────*/
  /**
   * Fase 0 → avança para Fase 1 (logo some, T1 aparece)
   * Fase 1 → avança para Fase 2 (textos somem, overlay some, site revelado)
   * Fase 2 → ignorado (já encerrando)
   */
  function onSkip() {
    if (phase < 2) {
      runPhase(phase + 1);
    }
  }

  introScreen.addEventListener('click', onSkip);

  /* ── Inicialização ─────────────────────────────────────────────────────── */
  document.body.style.overflow = 'hidden'; // Bloqueia scroll durante a intro
  mainNav.classList.add('nav-hidden');     // Oculta o menu durante a intro
  runPhase(0);                             // Dispara a Fase 0 (Logo)

})();

/* ==========================================================================
   MOTOR DE REVEAL BLINDADO — IntersectionObserver
   ========================================================================== */
(function initReveal_wrapper() {
  // Tornar initReveal acessível globalmente para o window.onload chamar depois
  window.initReveal = function() {
  'use strict';

  var blocks = document.querySelectorAll('.reveal-block');
  if (blocks.length === 0) return;

  // Fallback imediato se não houver suporte
  if (!('IntersectionObserver' in window)) {
    blocks.forEach(function (el) { el.classList.add('is-visible'); });
    return;
  }

  // Configuração agressiva: threshold 0 garante disparo imediato 
  // rootMargin negativo garante que a animação só ocorre quando o bloco já entrou um pouco na tela
  var observer = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        obs.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0,
    rootMargin: '0px 0px -50px 0px'
  });

  blocks.forEach(function (el) {
    // Se o elemento já estiver visível por acaso no topo, força a classe
    var rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.add('is-visible');
    } else {
      observer.observe(el);
    }
  });
  };
})();

/* ==========================================================================
   ROLAGEM SUAVE CUSTOMIZADA (Motor Matemático Infalível)
   ========================================================================== */
(function initSmoothScroll() {
  'use strict';

  // Função de interpolação matemática (Ease In Out Cubic)
  function easeInOutCubic(t, b, c, d) {
    t /= d / 2;
    if (t < 1) return c / 2 * t * t * t + b;
    t -= 2;
    return c / 2 * (t * t * t + 2) + b;
  }

  function smoothScrollTo(targetPosition, duration) {
    var startPosition = window.pageYOffset;
    var distance = targetPosition - startPosition;
    var startTime = null;

    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      var timeElapsed = currentTime - startTime;
      var run = easeInOutCubic(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) {
        requestAnimationFrame(animation);
      }
    }
    requestAnimationFrame(animation);
  }

  document.addEventListener('click', function (e) {
    var link = e.target.closest('a[href]');
    if (!link) return;

    var href = link.getAttribute('href');
    
    // Logo "WS" volta ao topo
    if (link.dataset.scroll === 'top' || href === '#' || href === '#hero-carousel-container') {
      e.preventDefault();
      smoothScrollTo(0, 800); // 800ms de duração
      return;
    }

    // Navegação interna
    if (href && href.startsWith('#') && href.length > 1) {
      var targetEl = document.querySelector(href);
      if (targetEl) {
        e.preventDefault();
        // Pega a posição exata do elemento menos uma margem de segurança do menu superior
        var targetPosition = targetEl.getBoundingClientRect().top + window.pageYOffset - 80;
        smoothScrollTo(targetPosition, 800);
      }
    }
  });

})();

/* ==========================================================================
   CONTAGEM REGRESSIVA (COUNTDOWN)
   ========================================================================== */
(function initCountdown() {
  'use strict';

  var elMeses = document.getElementById('countdown-meses');
  var elDias = document.getElementById('countdown-dias');
  var elHoras = document.getElementById('countdown-horas');
  var elMinutos = document.getElementById('countdown-minutos');

  if (!elMeses || !elDias || !elHoras || !elMinutos) return;

  // Alvo: 10 de outubro de 2026, 16:00:00
  var target = new Date("2026-10-10T16:00:00");

  function updateCountdown() {
    var currentDate = new Date();
    var distance = target.getTime() - currentDate.getTime();

    if (distance < 0) {
      elMeses.innerText = "00";
      elDias.innerText = "00";
      elHoras.innerText = "00";
      elMinutos.innerText = "00";
      return;
    }

    var months = (target.getFullYear() - currentDate.getFullYear()) * 12 + (target.getMonth() - currentDate.getMonth());
    var days = target.getDate() - currentDate.getDate();
    
    if (days < 0) {
        months--;
        var tempDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0); // last day of current month
        days += tempDate.getDate();
    }
    
    var hours = target.getHours() - currentDate.getHours();
    if (hours < 0) {
        days--;
        hours += 24;
    }
    
    var minutes = target.getMinutes() - currentDate.getMinutes();
    if (minutes < 0) {
        hours--;
        minutes += 60;
    }

    if (days < 0) { // borrow from months again se days ficou negativo
        months--;
        var tempDate2 = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        days += tempDate2.getDate();
    }

    // Formatação
    elMeses.innerText = months < 10 ? "0" + months : months;
    elDias.innerText = days < 10 ? "0" + days : days;
    elHoras.innerText = hours < 10 ? "0" + hours : hours;
    elMinutos.innerText = minutes < 10 ? "0" + minutes : minutes;
  }

  // Atualiza a cada segundo
  setInterval(updateCountdown, 1000);
  updateCountdown(); // chamada inicial
})();

/* ==========================================================================
   CARROSSEL DETALHES DO CASAMENTO (CAMADA DE FUNDO)
   ========================================================================== */
(function initDetalhesCarousel() {
  'use strict';
  var slides = document.querySelectorAll('.detalhes-slide');
  if (slides.length === 0) return;
  
  var currentSlide = 0;
  
  // Transição cross-fade a cada 5 segundos
  setInterval(function() {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 5000);
})();

/* ==========================================================================
   CARROSSEL PADRINHOS (STORIES STYLE)
   ========================================================================== */
(function initPadrinhosCarousel() {
  'use strict';
  var track = document.getElementById('padrinhosTrack');
  if (!track) return;
  var slides = track.querySelectorAll('.padrinhos-slide');
  var prevBtn = document.querySelector('.padrinhos-btn.prev');
  var nextBtn = document.querySelector('.padrinhos-btn.next');

  // Bloqueio do context menu (Salvar Imagem) no mobile (long-press)
  slides.forEach(function(slide) {
      var img = slide.querySelector('img');
      if (img) {
          img.addEventListener('contextmenu', function(e) {
              e.preventDefault();
          });
      }
  });
  var progressBars = document.querySelectorAll('.padrinhos-timeline .timeline-progress');
  var textContainer = document.querySelector('.padrinhos-content');
  
  if (slides.length === 0 || progressBars.length === 0) return;
  
  var currentSlide = 0;
  var timerId = null;
  var holdTimer = null;
  var startTime = 0;
  var duration = 3000; // 3 segundos
  var remainingTime = duration;
  var isPaused = false;
  var isHolding = false;

  function updateSlide(newIndex) {
    if (newIndex < 0) newIndex = slides.length - 1;
    if (newIndex >= slides.length) newIndex = 0;
    
    slides[currentSlide].classList.remove('active');
    currentSlide = newIndex;
    slides[currentSlide].classList.add('active');
    
    progressBars.forEach(function(bar, index) {
      bar.classList.remove('filling');
      bar.classList.remove('completed');
      bar.classList.remove('paused');
      
      if (index < currentSlide) {
        bar.classList.add('completed');
      } else if (index === currentSlide) {
        // Força reflow
        void bar.offsetWidth;
        bar.classList.add('filling');
      }
    });
    
    resetTimer();
  }
  
  function nextSlide() {
    remainingTime = duration;
    updateSlide(currentSlide + 1);
  }
  
  function prevSlide() {
    remainingTime = duration;
    updateSlide(currentSlide - 1);
  }
  
  function startTimer() {
    if (isPaused) return;
    startTime = Date.now();
    timerId = setTimeout(function() {
      nextSlide();
    }, remainingTime);
  }

  function pauseTimer() {
    if (isPaused) return;
    isPaused = true;
    clearTimeout(timerId);
    remainingTime -= (Date.now() - startTime);
    progressBars[currentSlide].classList.add('paused');
  }

  function resumeTimer() {
    if (!isPaused) return;
    isPaused = false;
    progressBars[currentSlide].classList.remove('paused');
    startTimer();
  }

  function resetTimer() {
    clearTimeout(timerId);
    remainingTime = duration;
    isPaused = false;
    startTimer();
  }
  
  if (prevBtn) prevBtn.addEventListener('click', function(e) { e.stopPropagation(); prevSlide(); });
  if (nextBtn) nextBtn.addEventListener('click', function(e) { e.stopPropagation(); nextSlide(); });
  
  // Interações Pointer (Touch/Mouse)
  var touchStartX = 0;
  var touchEndX = 0;

  function handlePointerDown(e) {
    if (e.target.closest('.padrinhos-btn')) return; // ignora botões laterais
    isHolding = true;
    pauseTimer();
    
    holdTimer = setTimeout(function() {
      if (isHolding && textContainer) {
        textContainer.classList.add('hide-text');
      }
    }, 1000);
  }

  function handlePointerUp() {
    isHolding = false;
    clearTimeout(holdTimer);
    if (textContainer) {
      textContainer.classList.remove('hide-text');
    }
    resumeTimer();
  }
  
  track.addEventListener('touchstart', function(e) {
    touchStartX = e.changedTouches[0].screenX;
    handlePointerDown(e);
  }, { passive: true });
  
  track.addEventListener('touchend', function(e) {
    touchEndX = e.changedTouches[0].screenX;
    handlePointerUp();
    handleSwipe();
  }, { passive: true });

  track.addEventListener('touchcancel', handlePointerUp, { passive: true });

  track.addEventListener('mousedown', function(e) {
    touchStartX = e.screenX;
    handlePointerDown(e);
  });

  track.addEventListener('mouseup', function(e) {
    touchEndX = e.screenX;
    handlePointerUp();
    handleSwipe();
  });

  track.addEventListener('mouseleave', handlePointerUp);
  
  function handleSwipe() {
    var threshold = 40; 
    if (touchEndX < touchStartX - threshold) {
      remainingTime = duration;
      nextSlide();
    }
    if (touchEndX > touchStartX + threshold) {
      remainingTime = duration;
      prevSlide();
    }
  }
  
  // Inicializa
  remainingTime = duration;
  updateSlide(0);
})();

/* ══════════════════════════════════════════════════════════════════════════
   6. LÓGICA DO FORMULÁRIO RSVP
   ══════════════════════════════════════════════════════════════════════════ */
function initRSVP() {
    const rsvpForm = document.getElementById('rsvpForm');
    if (!rsvpForm) return;

    rsvpForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formContainer = document.getElementById('rsvp-form-container');
        const sucessoMsg = document.getElementById('rsvp-sucesso');
        const submitBtn = rsvpForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.innerText;
        
        // Estado de carregamento
        submitBtn.innerText = 'Enviando...';
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.7';
        
        // Captura e formata os dados para o padrão nativo da web
        const formData = new FormData(rsvpForm);
        const dataParams = new URLSearchParams(formData);

        const scriptURL = 'https://script.google.com/macros/s/AKfycbwPB6eqiozVrqDzwX0IVbCuNnZu43XMOwGy3mVwOCZdweQ87JFFBipjbsk8LYKGtDxf/exec';

        // Disparo da requisição
        fetch(scriptURL, {
            method: 'POST',
            mode: 'no-cors', // Mantemos para evitar o bloqueio no redirecionamento do Google
            body: dataParams
        })
        .then(() => {
            // Transição visual de sucesso
            const formBox = document.querySelector('#rsvp-form-container');
            const successBox = document.querySelector('#rsvp-sucesso');
            
            if (formBox && successBox) {
                formBox.style.transition = 'opacity 0.4s ease';
                formBox.style.opacity = '0';
                setTimeout(() => {
                    formBox.style.display = 'none';
                    successBox.style.display = 'block';
                    successBox.style.opacity = '1';
                }, 300);
            }
        })
        .catch(error => {
            console.error('Erro no envio:', error);
            alert('Erro ao confirmar presença. Por favor, tente novamente.');
            resetBtn();
        });

        function resetBtn() {
            submitBtn.innerText = originalBtnText;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    initRSVP();
});

/* ==========================================================================
   PRELOADER & INICIALIZAÇÃO DE ANIMAÇÕES DE SCROLL
   ========================================================================== */
window.addEventListener('load', function() {
    var preloader = document.getElementById('preloader');
    if (preloader) {
        preloader.classList.add('hide');
        setTimeout(function() {
            preloader.style.display = 'none';
            // Só inicializa a animação de scroll quando o preloader some
            if (typeof window.initReveal === 'function') window.initReveal();
        }, 800); // 800ms combina com o transition do CSS
    } else {
        if (typeof window.initReveal === 'function') window.initReveal();
    }
});

/* ==========================================================================
   LÓGICA DA PÁGINA DE PRESENTES (presentes.html) — INTEGRAÇÃO COM GOOGLE APPS SCRIPT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'https://script.google.com/macros/s/AKfycbwSOt56V8gjDFjttF01Uv3WcRdfeInWxoTjITK6dev_qFe3Bf3rsWX3jowz1GH-hY7M/exec';

    const container = document.getElementById('produtos-container');
    if (!container) return; // Só executa se estiver na página presentes.html

    let presentesData = [];
    let produtoSelecionado = null;
    let operacaoSucesso = false;

    // Lista de imagens disponíveis localmente na pasta IMAGENS/PRESENTES/
    const IMAGENS_DISPONIVEIS = [
        "Air fryer.png",
        "Batedeira.png",
        "Conjunto de Mesa Cozinha.png",
        "Fogão.jpg",
        "Geladeira.png",
        "Panela de arroz elétrica.png",
        "armário de cozinha.png",
        "liquidificador.jpg",
        "microondas.png"
    ];

    // Função para encontrar a imagem correspondente pelo nome do produto
    function acharImagemPorNome(nomeProduto) {
        if (!nomeProduto) return null;
        
        const normalizar = (txt) => {
            return txt.toLowerCase()
                      .normalize("NFD")
                      .replace(/[\u0300-\u036f]/g, "") // remove acentos
                      .replace(/[^a-z0-9]/g, " ") // remove caracteres especiais
                      .trim()
                      .replace(/\s+/g, " ");
        };

        const nomeNorm = normalizar(nomeProduto);

        // 1. Tenta correspondência exata do nome normalizado
        for (const img of IMAGENS_DISPONIVEIS) {
            const imgSemExt = img.substring(0, img.lastIndexOf('.'));
            const imgNorm = normalizar(imgSemExt);
            if (nomeNorm === imgNorm) {
                return `IMAGENS/PRESENTES/${img}`;
            }
        }

        // 2. Tenta correspondência parcial (ex: "Fogão 4 bocas" contém "fogao")
        for (const img of IMAGENS_DISPONIVEIS) {
            const imgSemExt = img.substring(0, img.lastIndexOf('.'));
            const imgNorm = normalizar(imgSemExt);
            if (nomeNorm.includes(imgNorm) || imgNorm.includes(nomeNorm)) {
                return `IMAGENS/PRESENTES/${img}`;
            }
        }

        return null;
    }

    // 1. Função de Formatação de Moeda
    function formatarPreco(val) {
        if (typeof val === 'number') {
            return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        let strVal = String(val || '').trim();
        if (strVal.includes('R$')) return strVal;
        let num = parseFloat(strVal.replace(/[^\d,-]/g, '').replace(',', '.'));
        if (!isNaN(num)) {
            return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        return strVal || 'R$ 0,00';
    }

    // 2. Adivinhação de Cômodo pelo Nome do Produto (Garante funcionamento dos filtros)
    function guessRoomByName(name) {
        const lowercaseName = String(name || '').toLowerCase();
        if (lowercaseName.includes('cama') || lowercaseName.includes('lençol') || lowercaseName.includes('travesseiro') || lowercaseName.includes('quarto') || lowercaseName.includes('guarda-roupa') || lowercaseName.includes('colchão')) return 'Quarto';
        if (lowercaseName.includes('panela') || lowercaseName.includes('prato') || lowercaseName.includes('copo') || lowercaseName.includes('faqueiro') || lowercaseName.includes('garfo') || lowercaseName.includes('faca') || lowercaseName.includes('liquidificador') || lowercaseName.includes('microondas') || lowercaseName.includes('cozinha') || lowercaseName.includes('cafeteira') || lowercaseName.includes('batedeira') || lowercaseName.includes('jantar') || lowercaseName.includes('talher') || lowercaseName.includes('frigideira')) return 'Cozinha';
        if (lowercaseName.includes('sofa') || lowercaseName.includes('sofá') || lowercaseName.includes('tapete') || lowercaseName.includes('sala') || lowercaseName.includes('tv') || lowercaseName.includes('quadro') || lowercaseName.includes('poltrona') || lowercaseName.includes('painel') || lowercaseName.includes('mesa de centro')) return 'Sala';
        if (lowercaseName.includes('banheiro') || lowercaseName.includes('toalha') || lowercaseName.includes('sabonete') || lowercaseName.includes('chuveiro') || lowercaseName.includes('box')) return 'Banheiro';
        if (lowercaseName.includes('lavanderia') || lowercaseName.includes('máquina') || lowercaseName.includes('ferro') || lowercaseName.includes('varal') || lowercaseName.includes('tábua') || lowercaseName.includes('aspirador') || lowercaseName.includes('vassoura')) return 'Lavanderia';
        return 'Cozinha'; // Padrão
    }

    // 3. Função Auxiliar para Requisições JSONP
    function fetchJSONP(url) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
            
            window[callbackName] = function(data) {
                cleanup();
                resolve(data);
            };

            const script = document.createElement('script');
            script.id = 'jsonp_' + callbackName;
            script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName;
            
            script.onerror = function() {
                cleanup();
                reject(new Error('Erro ao carregar o script JSONP.'));
            };

            function cleanup() {
                delete window[callbackName];
                const scriptNode = document.getElementById(script.id);
                if (scriptNode) {
                    scriptNode.remove();
                }
            }

            document.body.appendChild(script);
        });
    }

    // 4. Função para carregar a lista de presentes da API via JSONP
    async function carregarPresentes() {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 40px; color: #ffffff; font-family: var(--font-sans); font-size: 1.1rem; letter-spacing: 0.05em; background: rgba(0, 0, 0, 0.2); border-radius: 28px; border: 1px solid rgba(255, 255, 255, 0.05); backdrop-filter: blur(10px);">
                <div class="loader-spinner" style="border: 3px solid rgba(255, 255, 255, 0.1); border-radius: 50%; border-top: 3px solid var(--color-accent-blue); width: 30px; height: 30px; animation: spin 1s linear infinite; margin: 0 auto 16px;"></div>
                A carregar lista de presentes...
            </div>
            <style>
                @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
            </style>
        `;

        try {
            const data = await fetchJSONP(API_URL);
            
            if (Array.isArray(data)) {
                presentesData = data.map(item => {
                    let imagem = item.Imagem;
                    const temExtensaoValida = imagem && /\.(jpg|jpeg|png|webp|svg)$/i.test(imagem);
                    if (temExtensaoValida) {
                        item.Imagem = imagem.trim().replace(/\\/g, '/');
                    } else {
                        item.Imagem = acharImagemPorNome(item.Nome) || "";
                    }
                    return item;
                });
                renderizarPresentes(presentesData);
            } else {
                throw new Error('API não retornou um array de dados.');
            }
        } catch (error) {
            console.error(error);
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <p style="color: white; text-align: center;">Erro ao carregar a lista de presentes. Tentando conectar ao banco de dados...</p>
                </div>
            `;
        }
    }

    // 4. Renderização Dinâmica dos Presentes
    function renderizarPresentes(items) {
        if (items.length === 0) {
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #fff; font-family: var(--font-sans);">
                    Nenhum presente disponível no momento.
                </div>
            `;
            return;
        }

        container.innerHTML = items.map(item => {
            const id = item.ID;
            const nome = item.Nome;
            const valor = item.Valor;
            let imagem = item.Imagem;
            if (imagem) {
                imagem = imagem.trim().replace(/\\/g, '/');
            }
            const status = item.Status || 'Disponível';
            
            let room = item.Comodo ?? item.comodo ?? item.Cômodo ?? item.cômodo ?? item.Categoria ?? item.categoria;
            if (!room) {
                room = guessRoomByName(nome);
            }

            const isDisponivel = String(status).trim().toLowerCase() === 'disponível' || String(status).trim().toLowerCase() === 'disponivel';
            const precoFormatado = formatarPreco(valor);

            let actionsHTML = '';
            if (isDisponivel) {
                actionsHTML = `
                    <div class="action-btn-group">
                        <button class="btn-acao btn-pix btn-presentear" data-id="${id}">Presentear</button>
                        <span class="tooltip-icon tooltip-mini">?</span>
                        <div class="tooltip-box">Ao escolher o Pix, você envia o valor para que os noivos comprem o item por conta própria.</div>
                    </div>
                    <div class="action-btn-group">
                        <button class="btn-acao btn-reservar" data-id="${id}">Reservar</button>
                        <span class="tooltip-icon tooltip-mini">?</span>
                        <div class="tooltip-box">Ao clicar em reservar, você sinaliza aos noivos que entregará este presente físico pessoalmente.</div>
                    </div>
                `;
            } else {
                const label = String(status).trim().toLowerCase() === 'reservado' ? 'Reservado' : 'Já Presenteado';
                actionsHTML = `
                    <button class="btn-acao btn-indisponivel" disabled style="background-color: rgba(255, 255, 255, 0.1); color: rgba(255, 255, 255, 0.35); border: 1px solid rgba(255, 255, 255, 0.05); width: 100%; cursor: not-allowed; opacity: 0.6; padding: 12px; border-radius: 8px; font-weight: 700; text-transform: uppercase;">
                        ${label}
                    </button>
                `;
            }

            const cardStyle = isDisponivel ? '' : 'style="opacity: 0.65;"';

            return `
                <div class="presente-card ${isDisponivel ? '' : 'indisponivel'}" data-room="${room}" ${cardStyle}>
                    <div class="presente-img-wrapper">
                        ${imagem ? `<img src="${imagem}" alt="${nome}" draggable="false">` : `
                        <div class="presente-img-placeholder">
                            <span>Imagem do Presente</span>
                        </div>`}
                    </div>
                    <div class="presente-info">
                        <h3 class="presente-nome">${nome}</h3>
                        <p class="presente-preco">${precoFormatado}</p>
                        <div class="presente-actions">
                            ${actionsHTML}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // 5. Lógica do Dropdown Filtro de Cômodos
    const btnToggleFiltro = document.getElementById('btn-toggle-filtro');
    const filtroOpcoes = document.getElementById('filtro-opcoes');
    const filterBtns = document.querySelectorAll('.btn-filtro');

    if (btnToggleFiltro && filtroOpcoes) {
        btnToggleFiltro.addEventListener('click', function(e) {
            e.stopPropagation();
            filtroOpcoes.classList.toggle('hidden');
        });

        // Fechar dropdown ao clicar fora
        document.body.addEventListener('click', function() {
            if (!filtroOpcoes.classList.contains('hidden')) {
                filtroOpcoes.classList.add('hidden');
            }
        });

        // Lógica de Filtragem (Mapeamento Dinâmico)
        if (filterBtns.length > 0) {
            filterBtns.forEach(btn => {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    filterBtns.forEach(b => b.classList.remove('active'));
                    this.classList.add('active');
                    filtroOpcoes.classList.add('hidden');

                    const filterValue = this.getAttribute('data-filter');
                    btnToggleFiltro.innerText = `Filtros: ${this.innerText} ▼`;

                    const cards = document.querySelectorAll('.presente-card');
                    cards.forEach(card => {
                        if (filterValue === 'all') {
                            card.classList.remove('hidden');
                        } else {
                            if (card.getAttribute('data-room') === filterValue) {
                                card.classList.remove('hidden');
                            } else {
                                card.classList.add('hidden');
                            }
                        }
                    });
                });
            });
        }
    }

    // 6. Lógica dos Tooltips Dinâmicos (Event Delegation)
    document.addEventListener('click', function(e) {
        const tooltipIcon = e.target.closest('.tooltip-icon');
        if (tooltipIcon) {
            e.stopPropagation();
            const box = tooltipIcon.nextElementSibling;
            
            // Fecha todos os outros tooltips
            document.querySelectorAll('.tooltip-box').forEach(b => {
                if (b !== box) b.classList.remove('show');
            });

            if (box) {
                box.classList.toggle('show');
            }
            return;
        }

        // Fechar qualquer tooltip aberto ao clicar fora
        document.querySelectorAll('.tooltip-box.show').forEach(b => {
            b.classList.remove('show');
        });
    });

    window.addEventListener('scroll', function() {
        document.querySelectorAll('.tooltip-box.show').forEach(b => {
            b.classList.remove('show');
        });
    }, { passive: true });

    // 7. Modais (Elementos do DOM)
    const modalPresentear = document.getElementById('modal-presentear');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalItemNome = document.getElementById('modal-item-nome');
    const modalItemPreco = document.getElementById('modal-item-preco');
    const modalItemImg = document.getElementById('modal-item-img');
    const modalImgPlaceholder = document.getElementById('modal-item-img-placeholder');
    const inputPixNome = document.getElementById('pix-nome');
    const inputPixTelefone = document.getElementById('pix-telefone');
    const inputPixAceite = document.getElementById('pix-aceite');
    const btnFazerPix = document.getElementById('btn-fazer-pix');

    const modalReservar = document.getElementById('modal-reservar');
    const btnCloseModalReservar = document.getElementById('btn-close-modal-reservar');
    const modalItemNomeReservar = document.getElementById('modal-item-nome-reservar');
    const modalItemPrecoReservar = document.getElementById('modal-item-preco-reservar');
    const modalItemImgReservar = document.getElementById('modal-item-img-reservar');
    const modalImgPlaceholderReservar = document.getElementById('modal-item-img-placeholder-reservar');
    const inputReservaNome = document.getElementById('reserva-nome');
    const inputReservaTelefone = document.getElementById('reserva-telefone');
    const inputReservaAceite = document.getElementById('reserva-aceite');
    const btnConfirmarReserva = document.getElementById('btn-confirmar-reserva');

    // 8. Event Delegation para Abertura dos Modais
    document.addEventListener('click', function(e) {
        // Abertura Modal Presentear (Pix)
        const btnPresentear = e.target.closest('.btn-presentear');
        if (btnPresentear && modalPresentear) {
            const id = btnPresentear.getAttribute('data-id');
            const item = presentesData.find(p => String(p.ID) === String(id));
            
            if (item) {
                produtoSelecionado = item;
                
                modalItemNome.innerText = item.Nome;
                modalItemPreco.innerText = formatarPreco(item.Valor);

                const imgUrl = item.Imagem;
                if (imgUrl) {
                    modalItemImg.src = imgUrl;
                    modalItemImg.classList.remove('hidden');
                    modalImgPlaceholder.classList.add('hidden');
                } else {
                    modalItemImg.classList.add('hidden');
                    modalImgPlaceholder.classList.remove('hidden');
                }

                // Reset do Formulário do Modal
                inputPixNome.value = '';
                inputPixTelefone.value = '';
                if (inputPixAceite) inputPixAceite.checked = false;
                btnFazerPix.disabled = true;
                
                const step1 = document.getElementById('pix-step-1');
                const step2 = document.getElementById('pix-step-2');
                if (step1) step1.style.display = 'block';
                if (step2) step2.style.display = 'none';

                modalPresentear.classList.remove('hidden');
            }
            return;
        }

        // Abertura Modal Reservar (Físico)
        const btnReservar = e.target.closest('.btn-reservar:not(.btn-reservar-submit)');
        if (btnReservar && modalReservar) {
            const id = btnReservar.getAttribute('data-id');
            const item = presentesData.find(p => String(p.ID) === String(id));
            
            if (item) {
                produtoSelecionado = item;
                
                modalItemNomeReservar.innerText = item.Nome;
                modalItemPrecoReservar.innerText = formatarPreco(item.Valor);

                const imgUrl = item.Imagem;
                if (imgUrl) {
                    modalItemImgReservar.src = imgUrl;
                    modalItemImgReservar.classList.remove('hidden');
                    modalImgPlaceholderReservar.classList.add('hidden');
                } else {
                    modalItemImgReservar.classList.add('hidden');
                    modalImgPlaceholderReservar.classList.remove('hidden');
                }

                // Reset do Formulário do Modal
                inputReservaNome.value = '';
                inputReservaTelefone.value = '';
                if (inputReservaAceite) inputReservaAceite.checked = false;
                btnConfirmarReserva.disabled = true;
                
                const step1 = document.getElementById('reserva-step-1');
                const step2 = document.getElementById('reserva-step-2');
                if (step1) step1.style.display = 'block';
                if (step2) step2.style.display = 'none';

                modalReservar.classList.remove('hidden');
            }
            return;
        }
    });

    // 9. Lógica de Fechamento dos Modais (com atualização dinâmica)
    const fecharModalPresentear = () => {
        if (modalPresentear) {
            modalPresentear.classList.add('hidden');
            const step1 = document.getElementById('pix-step-1');
            const step2 = document.getElementById('pix-step-2');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';

            if (operacaoSucesso) {
                operacaoSucesso = false;
                carregarPresentes();
            }
        }
    };

    const fecharModalReservar = () => {
        if (modalReservar) {
            modalReservar.classList.add('hidden');
            const step1 = document.getElementById('reserva-step-1');
            const step2 = document.getElementById('reserva-step-2');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';

            if (operacaoSucesso) {
                operacaoSucesso = false;
                carregarPresentes();
            }
        }
    };

    if (btnCloseModal) btnCloseModal.addEventListener('click', fecharModalPresentear);
    if (modalPresentear) {
        modalPresentear.addEventListener('click', function(e) {
            if (e.target === this) fecharModalPresentear();
        });
    }

    if (btnCloseModalReservar) btnCloseModalReservar.addEventListener('click', fecharModalReservar);
    if (modalReservar) {
        modalReservar.addEventListener('click', function(e) {
            if (e.target === this) fecharModalReservar();
        });
    }

    // 10. Validações de Formulário em Tempo Real
    const validarFormularioPix = () => {
        const nomeLen = inputPixNome.value.trim().length;
        const telLen = inputPixTelefone.value.trim().length;
        const isChecked = inputPixAceite ? inputPixAceite.checked : false;
        
        btnFazerPix.disabled = !(nomeLen > 0 && telLen > 0 && isChecked);
    };

    if (inputPixNome && inputPixTelefone) {
        inputPixNome.addEventListener('input', validarFormularioPix);
        inputPixTelefone.addEventListener('input', validarFormularioPix);
    }
    if (inputPixAceite) {
        inputPixAceite.addEventListener('change', validarFormularioPix);
    }

    const validarFormularioReserva = () => {
        const nomeLen = inputReservaNome.value.trim().length;
        const telLen = inputReservaTelefone.value.trim().length;
        const isChecked = inputReservaAceite ? inputReservaAceite.checked : false;
        
        btnConfirmarReserva.disabled = !(nomeLen > 0 && telLen > 0 && isChecked);
    };

    if (inputReservaNome && inputReservaTelefone) {
        inputReservaNome.addEventListener('input', validarFormularioReserva);
        inputReservaTelefone.addEventListener('input', validarFormularioReserva);
    }
    if (inputReservaAceite) {
        inputReservaAceite.addEventListener('change', validarFormularioReserva);
    }

    // 11. Envio dos Formulários dos Modais para a API (POST)
    if (btnFazerPix) {
        btnFazerPix.addEventListener('click', async function() {
            if (!produtoSelecionado) return;

            const idDoProduto = produtoSelecionado.ID;
            const nomeDigitado = inputPixNome.value.trim();
            const telefoneDigitado = inputPixTelefone.value.trim();

            const originalText = btnFazerPix.innerText;
            btnFazerPix.innerText = 'A carregar...';
            btnFazerPix.disabled = true;

            try {
                // Requisição POST em modo no-cors para evitar falhas de preflight CORS com o Apps Script
                await fetch(API_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        id: idDoProduto,
                        convidado: nomeDigitado,
                        telefone: telefoneDigitado,
                        formaEnvio: "Pix"
                    })
                });

                // Transição para o QR Code (Sucesso)
                operacaoSucesso = true;
                const step1 = document.getElementById('pix-step-1');
                const step2 = document.getElementById('pix-step-2');
                if (step1) step1.style.display = 'none';
                if (step2) step2.style.display = 'block';

            } catch (error) {
                console.error('Erro ao registrar presente (Pix):', error);
                alert('Ocorreu um erro ao processar. Por favor, tente novamente.');
            } finally {
                btnFazerPix.innerText = originalText;
                btnFazerPix.disabled = false;
            }
        });
    }

    if (btnConfirmarReserva) {
        btnConfirmarReserva.addEventListener('click', async function() {
            if (!produtoSelecionado) return;

            const idDoProduto = produtoSelecionado.ID;
            const nomeDigitado = inputReservaNome.value.trim();
            const telefoneDigitado = inputReservaTelefone.value.trim();

            const originalText = btnConfirmarReserva.innerText;
            btnConfirmarReserva.innerText = 'A carregar...';
            btnConfirmarReserva.disabled = true;

            try {
                // Requisição POST em modo no-cors para evitar falhas de preflight CORS com o Apps Script
                await fetch(API_URL, {
                    method: 'POST',
                    mode: 'no-cors',
                    body: JSON.stringify({
                        id: idDoProduto,
                        convidado: nomeDigitado,
                        telefone: telefoneDigitado,
                        formaEnvio: "Físico"
                    })
                });

                // Transição para mensagem de sucesso
                operacaoSucesso = true;
                const step1 = document.getElementById('reserva-step-1');
                const step2 = document.getElementById('reserva-step-2');
                if (step1) step1.style.display = 'none';
                if (step2) step2.style.display = 'block';

            } catch (error) {
                console.error('Erro ao registrar presente (Físico):', error);
                alert('Ocorreu um erro ao processar a reserva. Por favor, tente novamente.');
            } finally {
                btnConfirmarReserva.innerText = originalText;
                btnConfirmarReserva.disabled = false;
            }
        });
    }

    // Copiar Chave Pix
    const btnCopyPix = document.getElementById('btn-copy-pix');
    const pixKeyText = document.getElementById('pix-key-text');
    
    if (btnCopyPix && pixKeyText) {
        btnCopyPix.addEventListener('click', function() {
            navigator.clipboard.writeText(pixKeyText.innerText).then(() => {
                const textoOriginal = btnCopyPix.innerText;
                btnCopyPix.innerText = 'Copiado!';
                btnCopyPix.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    btnCopyPix.innerText = textoOriginal;
                    btnCopyPix.style.backgroundColor = '';
                }, 2000);
            });
        });
    }

    // 12. Execução Inicial
    carregarPresentes();
});
