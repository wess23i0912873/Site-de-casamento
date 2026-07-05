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
  function iniciarIntro() {
    document.body.style.overflow = 'hidden'; // Bloqueia scroll durante a intro
    mainNav.classList.add('nav-hidden');     // Oculta o menu durante a intro
    runPhase(0);                             // Dispara a Fase 0 (Logo)
  }

  const preloader = document.getElementById('preloader');
  if (preloader) {
    window.addEventListener('load', function() {
      // Inicia a intro apenas após o preloader terminar de sumir
      setTimeout(iniciarIntro, 800);
    });
  } else {
    iniciarIntro();
  }
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

    const rsvpConfirmadoRadios = rsvpForm.querySelectorAll('input[name="confirmado"]');
    const justificativaContainer = document.getElementById('rsvp-justificativa-container');
    const justificativaInput = document.getElementById('rsvp-justificativa');

    if (rsvpConfirmadoRadios && justificativaContainer && justificativaInput) {
        rsvpConfirmadoRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'Não') {
                    justificativaContainer.style.display = 'block';
                } else {
                    justificativaContainer.style.display = 'none';
                    justificativaInput.value = '';
                }
            });
        });
    }

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
        
        // Manipulação condicional do payload para a justificativa de ausência
        const confirmado = formData.get('confirmado');
        const justificativaVal = justificativaInput ? justificativaInput.value.trim() : '';
        if (confirmado === 'Não' && justificativaVal) {
            formData.set('observacoes', 'Justificativa de ausência: ' + justificativaVal);
        }

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
   ÁREA DE HOSPEDAGENS (ACCORDION DINÂMICO)
   ========================================================================== */
const iconesSVG = {
    tv: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon-amenity"><rect x="2" y="7" width="20" height="15" rx="2" ry="2"></rect><polyline points="17 2 12 7 7 2"></polyline></svg>`,
    ar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon-amenity"><line x1="12" y1="2" x2="12" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><path d="M20 16.66l-4-2.66 4-2.66M4 7.34l4 2.66-4 2.66M20 7.34l-4 2.66 4 2.66M4 16.66l4-2.66-4-2.66M16.66 20l-2.66-4-2.66 4M7.34 4l2.66 4 2.66-4M7.34 20l2.66-4 2.66 4M16.66 4l-2.66 4-2.66-4"></path></svg>`,
    frigobar: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon-amenity"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="5" y1="10" x2="19" y2="10"></line><line x1="9" y1="5" x2="9" y2="7"></line><line x1="9" y1="14" x2="9" y2="18"></line></svg>`,
    cafe: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon-amenity"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="2" x2="6" y2="4"></line><line x1="10" y1="2" x2="10" y2="4"></line><line x1="14" y1="2" x2="14" y2="4"></line></svg>`,
    parking: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon-amenity"><rect x="3" y="3" width="18" height="18" rx="5" ry="5"></rect><path d="M9 17V7h4a3 3 0 0 1 0 6H9"></path></svg>`,
    pin: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon-map"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="svg-icon-warning"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`
};

const listaHospedagens = [
    {
        nome: "Pousada Mãe Maria",
        local: "Ipaumirim, Ceará | 10% de desconto",
        contexto: "Hotel na cidade do casamento",
        linkMaps: "https://maps.app.goo.gl/eYFWFoK4dWNfipfM6",
        comodidadesIcones: ["tv", "ar", "frigobar", "cafe"],
        topicos: [
            "Todos os quartos contam com televisão, ar-condicionado, frigobar",
            "Oferecem café da manhã",
            "Conveniência no térreo",
            "De frente a um posto de gasolina"
        ],
        aviso: "Eles não oferecem café da manhã aos domingos.",
        linkWhats: "https://wa.me/558897266655?text=Ol%C3%A1%21%20Vi%20o%20contato%20de%20voc%C3%AAs%20no%20site%20do%20casamento%20de%20Wesley%20e%20Stefany.%20Gostaria%20de%20verificar%20a%20disponibilidade%20e%20os%20valores%20de%20hospedagem."
    },
    {
        nome: "Comfort Hotel",
        local: "Cajazeiras, PB",
        contexto: "Hotel a 29 min da cidade do casamento",
        linkMaps: "https://maps.app.goo.gl/3oJgL7nTMpijtjAn6",
        comodidadesIcones: ["tv", "ar", "frigobar", "cafe", "parking"],
        topicos: [
            "Café da manhã incluso",
            "Todos os quartos contam com televisão, ar-condicionado, frigobar",
            "Estacionamento privativo",
            "Fica a 10 min do centro de Cajazeiras",
            "De frente a um posto de Gasolina e uma conveniência"
        ],
        aviso: "O Hotel fica a 29,3 KM de distância da cidade do casamento.",
        linkWhats: "https://wa.me/83991085179?text=Ol%C3%A1%21%20Vi%20o%20contato%20de%20voc%C3%AAs%20no%20site%20do%20casamento%20de%20Wesley%20e%20Stefany.%20Gostaria%20de%20verificar%20a%20disponibilidade%20e%20os%20valores%20de%20hospedagem.",
        linkInsta: "https://www.instagram.com/hotelcomfortcajazeiras/"
    }
];

function renderizarHospedagens() {
    const container = document.getElementById('hospedagens-container');
    if (!container) return;

    container.innerHTML = listaHospedagens.map((hotel, index) => {
        const topicosHTML = hotel.topicos.map(topico => `<li>${topico}</li>`).join('');

        const iconesHTML = hotel.comodidadesIcones.map(iconKey => {
            const svgContent = iconesSVG[iconKey] || '';
            return `<span class="amenity-badge">${svgContent}</span>`;
        }).join('');

        const avisoHTML = hotel.aviso 
            ? `<div class="hotel-warning-box">
                <span class="warning-icon">${iconesSVG.warning}</span>
                <p class="warning-text">${hotel.aviso}</p>
               </div>`
            : '';

        const ctaWhatsHTML = hotel.linkWhats
            ? `<a href="${hotel.linkWhats}" target="_blank" class="hotel-cta-btn">
                <svg viewBox="0 0 24 24">
                    <path d="M12.012 2c-5.506 0-9.989 4.478-9.99 9.984a9.96 9.96 0 001.37 5.054L2 22l5.077-1.33a9.927 9.927 0 004.93 1.302c5.507 0 9.99-4.478 9.99-9.985A9.997 9.997 0 0012.012 2zm6.035 13.92c-.248.696-1.246 1.258-1.716 1.312-.43.05-.98.077-1.583-.114a8.12 8.12 0 01-3.69-2.316 9.4 9.4 0 01-2.22-3.153 3.868 3.868 0 01-.762-2.072c0-1.127.587-1.688.804-1.91.217-.223.479-.28.636-.28.156 0 .313.003.45.01a1.295 1.295 0 01.954.463c.272.656.924 2.257 1.004 2.42.08.162.133.351.026.565-.107.214-.16.35-.32.533-.16.183-.337.408-.48.55-.16.16-.328.334-.142.653.186.318.826 1.362 1.77 2.203.943.84 1.737 1.1 2.062 1.259.325.16.513.133.705-.084.192-.217.826-.961 1.047-1.288.222-.328.444-.275.748-.163.303.11 1.923.906 2.253 1.07.33.165.55.247.63.385.08.138.08.8-.167 1.496z"></path>
                </svg>
                Entre em contato pelo WhatsApp
               </a>`
            : '';

        const ctaInstaHTML = hotel.linkInsta
            ? `<a href="${hotel.linkInsta}" target="_blank" class="hotel-cta-insta-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
                Visitar perfil no Instagram
               </a>`
            : '';

        return `
            <div class="hotel-card" data-index="${index}">
                <div class="hotel-header" role="button" aria-expanded="false" tabindex="0">
                    <div class="hotel-header-text">
                        <h3 class="hotel-name">${hotel.nome}</h3>
                        <span class="hotel-info">${hotel.local}</span>
                    </div>
                    <span class="hotel-icon">+</span>
                </div>
                <div class="hotel-body-wrapper">
                    <div class="hotel-body">
                        <p class="hotel-context">${hotel.contexto}</p>
                        <a href="${hotel.linkMaps}" target="_blank" class="hotel-maps-btn">
                            ${iconesSVG.pin} Clique aqui para ver a localização
                        </a>
                        
                        <h4 class="hotel-info-title">Informações da pousada</h4>
                        <div class="hotel-amenities-container">
                            ${iconesHTML}
                        </div>
                        
                        <ul class="hotel-topics">
                            ${topicosHTML}
                        </ul>
                        ${avisoHTML}
                        <div class="hotel-actions-container">
                            ${ctaWhatsHTML}
                            ${ctaInstaHTML}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    container.querySelectorAll('.hotel-header').forEach(header => {
        header.addEventListener('click', () => {
            const card = header.parentElement;
            toggleHotelCard(card);
        });

        header.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const card = header.parentElement;
                toggleHotelCard(card);
            }
        });
    });
}

function toggleHotelCard(card) {
    const isActive = card.classList.contains('active');
    
    document.querySelectorAll('.hotel-card').forEach(c => {
        c.classList.remove('active');
        c.querySelector('.hotel-header').setAttribute('aria-expanded', 'false');
    });

    if (!isActive) {
        card.classList.add('active');
        card.querySelector('.hotel-header').setAttribute('aria-expanded', 'true');
    }
}

/* ==========================================================================
   PRELOADER & INICIALIZAÇÃO DE ANIMAÇÕES DE SCROLL
   ========================================================================== */
window.addEventListener('load', function() {
    // Renderiza hospedagens dinâmicas
    renderizarHospedagens();
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
   LISTAS DE IMAGENS E CORRESPONDÊNCIA INTELIGENTE (COMPARTILHADA)
   ========================================================================== */
// Lista de imagens de presentes disponíveis localmente na pasta IMAGENS/PRESENTES/
const IMAGENS_DISPONIVEIS = [
    "2 Baldes.png",
    "Air fryer.png",
    "Bacias.png",
    "Batedeira.png",
    "Cabides.png",
    "Cesto de roupa suja.png",
    "Climatizador.png",
    "Conjunto de Mesa Cozinha.png",
    "Conjunto de panelas.png",
    "Conjunto de xícaras.png",
    "Depósitos de plásticos.png",
    "Escorredor de macarrão.png",
    "Escorredor de prato.png",
    "Escova sanitária.png",
    "Espelho.png",
    "Ferro de Passar Roupas.png",
    "Fogão.jpg",
    "Garrafa de café.png",
    "Geladeira.png",
    "Jarras de suco.png",
    "Kit Peneira.png",
    "Kit de almofadas.png",
    "Kit de banheiro ( saboneteira, recipiente pra escova).png",
    "Kit de potes.png",
    "Kit de recipientes de geladeira.png",
    "Kit de tapete de banheiro.png",
    "Kit de taças de vidro.png",
    "Lixeira pequena.png",
    "Maquina de Lavar.png",
    "Painel De TV.png",
    "Panela de arroz elétrica.png",
    "Panela de pressão.png",
    "Potes de armazenamento.png",
    "Pratos rasos.png",
    "Protetor de colchão.png",
    "Quadros para decoração.png",
    "Televisão.png",
    "Tábua de passar roupa.png",
    "Varal.png",
    "Ventilador.png",
    "armário de cozinha.png",
    "assadeira.png",
    "bule de fazer café.png",
    "cama.png",
    "coador de café.png",
    "cobertas de cama.png",
    "cobertores.png",
    "copos de vidro.png",
    "cuscuzeira média.png",
    "desentupidor.png",
    "faca grande pra carne.png",
    "faqueiros.png",
    "flanelas.png",
    "forma de bolo.png",
    "garrafas para água.png",
    "guarda-Roupas.png",
    "guardanapos.png",
    "jogos de lençol.png",
    "kit de conchas.png",
    "kit de toalha.png",
    "kit frigideira antiaderente.png",
    "liquidificador.jpg",
    "lixeira.png",
    "micro-ondas.png",
    "panos de chão.png",
    "pratos de sobremesas.png",
    "pratos fundos.png",
    "pá.png",
    "ralador.png",
    "rodo.png",
    "sofá.png",
    "tigela de vidro.png",
    "toalha de mesa.png",
    "travesseiros.png",
    "tábua de carne.png",
    "vasilhas de plastico.png",
    "vassoura.png"
];

// Lista de imagens de doações disponíveis localmente na pasta IMAGENS/PRESENTES/Doações/
const IMAGENS_DOACOES_DISPONIVEIS = [
    "1 ano de academia prós noivos voltarem pro shape.png",
    "1 ano de ovo pago para manter a dieta do noivo.png",
    "3 meses de mercado.png",
    "6 meses de Netflix.png",
    "Ajuda pra comprar uma TV pra noiva ver seus doramas.png",
    "Cooktop de última geração.png",
    "Deus te iluminou e você resolveu ajudar na lua de mel.png",
    "Deus tocou no seu coração.png",
    "ajuda com o aluguel.png",
    "ajuda extra para o DJ tocar mais.png",
    "ajuda na primeira compra no mercado.png",
    "ajuda ora Stefany comer e não ficar mal humorada.png",
    "ajuda para comprar os produtos de cabelo da noiva.png",
    "ajuda para mobiliar a casa.png",
    "ajuda para pagar a fatura  do noivo.png",
    "ajuda para pagar a make da noiva.png",
    "ajuda pra comprar máquina de lavar as tralhas.png",
    "ajuda pra custear a ração de Lucky.png",
    "ajuda pra pagar o casamento.png",
    "ajude  a noiva a comprar um vade Mecum novo.png",
    "ajude o noivo alimentar a noiva.png",
    "alexa para a noiva não mandar só no noivo.png",
    "balança para os noivos não engordarem.png",
    "bateria para o noivo.png",
    "calmante pro dia do casamento.png",
    "claro que posso pagar por esse presente, meu marido tem dois empregos.png",
    "cobertor ppra Wesley estar coberto de razão.png",
    "corte de cabelo do noivo por 6 meses.png",
    "cota para perguntar quando o casal tera filhos.png",
    "curso de culinária para a noiva.png",
    "curso intensivo para adivinhar porque a noiva ta bicuta.png",
    "dar pitaco-falar mal da festa.png",
    "dia de princesa para a noiva.png",
    "dose de paciência para a noiva.png",
    "estoque de café quentinho para o noivo.png",
    "eu vou dar o melhor presente.png",
    "fone para Stefany não ouvir a bateria de Wesley.png",
    "fritadeira pra fazer batatinha para as visitas.png",
    "ir de branco na festa.png",
    "ir junto com os noivos na lua de mel.png",
    "jogar o buquê em sua direção.png",
    "lava louça prós noivos não brigarem.png",
    "lenço para não borrar a maquiagem.png",
    "levar alguém que não foi convidado.png",
    "mensalidade pros noivos ficar fortão.png",
    "mil reais ou uma fotografia com raça negra.png",
    "mochila para a noiva levar só o necessário pra viagem.png",
    "patrocínio cinema do casal.png",
    "pegar um docinho antes de liberar a mesa de doces.png",
    "perfume novo pros noivos irem cheirosos.png",
    "pra abastecer a moto do noivo.png",
    "pra noiva não se atrasar.png",
    "presente da melhor forma.png",
    "prioridade na fila do buffet.png",
    "psicólogo pros noivos não surtarem.png",
    "robô para ajudar Stefany a limpar a casa.png",
    "só pra não dizer que não dei nada.png",
    "ta se sentindo generoso.png",
    "tampão de ouvida pra noiva enquanto o noivo ronca.png",
    "taxa para o buquê não cair na sua namorada.png",
    "toalha de banho para as visitas na casa dos noivos.png",
    "todo dinheiro que der para os noivos voltara em dobro pra vocês.png",
    "toma ai meu bolsa família.png",
    "toma aqui seu 50 reais.png",
    "uno caso os noivos fiquem entediados na lua de mel.png",
    "visita favorita dos noivos.png"
];

// Cache para evitar repetir o mapeamento e normalização pesados das listas de imagens
const cacheImagensNormalizadas = new Map();

// Função pura de normalização de texto
function normalizarTexto(txt) {
    if (!txt) return '';
    let res = txt.toLowerCase()
              .normalize("NFD")
              .replace(/[\u0300-\u036f]/g, "") // remove acentos
              .replace(/[^a-z0-9]/g, " ") // remove caracteres especiais
              .trim()
              .replace(/\s+/g, " ");
    
    // Substituições de sinônimos/normalizações comuns para melhorar casamento
    res = res.replace(/\b(conjunto|jogo)\b/g, "kit")
             .replace(/\b(panelas)\b/g, "panela")
             .replace(/\b(pratos)\b/g, "prato")
             .replace(/\b(bacias)\b/g, "bacia")
             .replace(/\b(baldes)\b/g, "balde")
             .replace(/\b(copos)\b/g, "copo")
             .replace(/\b(tacas)\b/g, "taca")
             .replace(/\b(xicaras)\b/g, "xicara")
             .replace(/\b(jarras)\b/g, "jarra")
             .replace(/\b(formas)\b/g, "forma")
             .replace(/\b(potes)\b/g, "pote")
             .replace(/\b(tigelas)\b/g, "tigela")
             .replace(/\b(vasilhas)\b/g, "vasilha")
             .replace(/\b(garrafas)\b/g, "garrafa")
             .replace(/\b(toalhas)\b/g, "toalha")
             .replace(/\b(recipientes)\b/g, "recipiente")
             .replace(/\b(cobertores|cobertas)\b/g, "cobertor")
             .replace(/\b(lencois|lencol)\b/g, "lencol")
             .replace(/\b(cabides)\b/g, "cabide")
             .replace(/\b(almofadas)\b/g, "almofada")
             .replace(/\b(quadros)\b/g, "quadro")
             .replace(/\b(tapetes)\b/g, "tapete")
             .replace(/\b(flanelas)\b/g, "flanela")
             .replace(/\b(panos)\b/g, "pano");
    return res;
}

// Mapeia e cacheia a lista de imagens para evitar processamento redundante de strings
function obterImagensNormalizadas(listaImagens) {
    if (cacheImagensNormalizadas.has(listaImagens)) {
        return cacheImagensNormalizadas.get(listaImagens);
    }
    const mapeadas = listaImagens.map(img => {
        const idx = img.lastIndexOf('.');
        const imgSemExt = idx !== -1 ? img.substring(0, idx) : img;
        const imgNorm = normalizarTexto(imgSemExt);
        const palavrasImg = imgNorm.split(' ').filter(w => w.length > 1);
        return {
            original: img,
            normalizada: imgNorm,
            palavras: palavrasImg
        };
    });
    cacheImagensNormalizadas.set(listaImagens, mapeadas);
    return mapeadas;
}

// Função de correspondência inteligente por nome
function acharImagemPorNome(nomeProduto, listaImagens = IMAGENS_DISPONIVEIS, pathImagens = 'IMAGENS/PRESENTES/') {
    if (!nomeProduto || !listaImagens || listaImagens.length === 0) return null;

    const nomeNorm = normalizarTexto(nomeProduto);
    const palavrasProduto = nomeNorm.split(' ').filter(w => w.length > 1);

    const imagensMapeadas = obterImagensNormalizadas(listaImagens);

    // 1. Tenta correspondência exata do nome normalizado
    for (let i = 0; i < imagensMapeadas.length; i++) {
        const imgObj = imagensMapeadas[i];
        if (nomeNorm === imgObj.normalizada) {
            return `${pathImagens}${imgObj.original}`;
        }
    }

    // 2. Tenta correspondência por palavras importantes (Comparações Exatas e Plurais/Singulares)
    const stopWords = ['de', 'para', 'pra', 'com', 'sem', 'em', 'um', 'uma', 'uns', 'umas', 'o', 'a', 'os', 'as', 'do', 'da', 'dos', 'das', 'no', 'na', 'nos', 'nas', 'pro', 'pra', 'pros', 'pras', 'que', 'se', 'ao', 'aos', 'ou', 'ela', 'ele', 'um', 'uma', 'e', 'o', 'kit', 'conjunto', 'jogo'];
    
    let melhorImagem = null;
    let maiorPontuacao = 0;

    for (let i = 0; i < imagensMapeadas.length; i++) {
        const imgObj = imagensMapeadas[i];
        let score = 0;
        let totalSignificativo = 0;

        imgObj.palavras.forEach(w => {
            if (stopWords.includes(w)) return;
            totalSignificativo++;
            
            const singularW = w.endsWith('s') ? w.slice(0, -1) : w;
            const matches = palavrasProduto.some(pw => {
                const singularPw = pw.endsWith('s') ? pw.slice(0, -1) : pw;
                return pw === w || singularPw === singularW || pw === singularW || singularPw === w;
            });
            if (matches) {
                score += 2;
            }
        });

        imgObj.palavras.forEach(w => {
            if (!stopWords.includes(w)) return;
            if (palavrasProduto.includes(w)) {
                score += 0.5;
            }
        });

        if (score > maiorPontuacao && totalSignificativo > 0) {
            maiorPontuacao = score;
            melhorImagem = imgObj.original;
        }
    }

    // Exigimos que pelo menos 50% das palavras significativas do nome da imagem coincidam com o produto
    // Isso evita falsos positivos onde apenas uma palavra bate, mas as outras não.
    if (melhorImagem && maiorPontuacao >= 2) {
        const imgObj = imagensMapeadas.find(o => o.original === melhorImagem);
        if (imgObj) {
            const palavrasImgSignificativas = imgObj.palavras.filter(w => !stopWords.includes(w));
            
            let palavrasCorrespondentes = 0;
            palavrasImgSignificativas.forEach(w => {
                const singularW = w.endsWith('s') ? w.slice(0, -1) : w;
                const matches = palavrasProduto.some(pw => {
                    const singularPw = pw.endsWith('s') ? pw.slice(0, -1) : pw;
                    return pw === w || singularPw === singularW || pw === singularW || singularPw === w;
                });
                if (matches) {
                    palavrasCorrespondentes++;
                }
            });

            if (palavrasImgSignificativas.length === 0 || (palavrasCorrespondentes / palavrasImgSignificativas.length) >= 0.5) {
                return `${pathImagens}${melhorImagem}`;
            }
        }
    }

    return null;
}

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
    let pollingInterval = null;

    // Lógica de correspondência inteligente usa as funções e listas compartilhadas definidas globalmente

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

    // Função para verificar se um item é considerado "Sem Preço" (0, 0.00, 0,00, nulo, vazio)
    function ehSemPreco(val) {
        if (val === null || val === undefined) return true;
        let strVal = String(val).trim();
        if (strVal === '' || strVal === '0' || strVal === '0,00' || strVal === '0.00') return true;
        let num = parseFloat(strVal.replace(/[^\d,-]/g, '').replace(',', '.'));
        return isNaN(num) || num === 0;
    }

    // 2. Adivinhação de Cômodo pelo Nome do Produto (Garante funcionamento dos filtros)
    function guessRoomByName(name) {
        const lowercaseName = String(name || '').toLowerCase();
        
        // 1. Banheiro
        if (lowercaseName.includes('banheiro') || 
            lowercaseName.includes('sabonete') || 
            lowercaseName.includes('sanitaria') || 
            lowercaseName.includes('sanitária') || 
            lowercaseName.includes('desentupidor') || 
            lowercaseName.includes('chuveiro') || 
            lowercaseName.includes('box') || 
            (lowercaseName.includes('toalha') && !lowercaseName.includes('mesa'))) {
            return 'Banheiro';
        }
        
        // 2. Lavanderia
        if (lowercaseName.includes('lavanderia') || 
            lowercaseName.includes('maquina') || 
            lowercaseName.includes('máquina') || 
            lowercaseName.includes('ferro') || 
            lowercaseName.includes('varal') || 
            lowercaseName.includes('aspirador') || 
            lowercaseName.includes('vassoura') || 
            lowercaseName.includes('rodo') || 
            lowercaseName.includes('balde') || 
            lowercaseName.includes('bacia') || 
            lowercaseName.includes('flanela') || 
            lowercaseName.includes('suja') || 
            lowercaseName.includes('cesto') || 
            lowercaseName.includes('pano de') || 
            lowercaseName.includes('panos de') || 
            (lowercaseName.includes('pa') && !lowercaseName.includes('panela')) || 
            (lowercaseName.includes('pá') && !lowercaseName.includes('panela')) || 
            (lowercaseName.includes('tabua') && !lowercaseName.includes('carne')) || 
            (lowercaseName.includes('tábua') && !lowercaseName.includes('carne'))) {
            return 'Lavanderia';
        }
        
        // 3. Quarto
        if (lowercaseName.includes('cama') || 
            lowercaseName.includes('lencol') || 
            lowercaseName.includes('lençol') || 
            lowercaseName.includes('travesseiro') || 
            lowercaseName.includes('quarto') || 
            lowercaseName.includes('guarda-roupa') || 
            lowercaseName.includes('guarda roupa') || 
            lowercaseName.includes('colchao') || 
            lowercaseName.includes('colchão') || 
            lowercaseName.includes('coberta') || 
            lowercaseName.includes('cobertor') || 
            lowercaseName.includes('cabide') || 
            lowercaseName.includes('espelho') || 
            lowercaseName.includes('ventilador')) {
            return 'Quarto';
        }
        
        // 4. Sala
        if (lowercaseName.includes('sofa') || 
            lowercaseName.includes('sofá') || 
            lowercaseName.includes('sala') || 
            lowercaseName.includes('tv') || 
            lowercaseName.includes('televisao') || 
            lowercaseName.includes('televisão') || 
            lowercaseName.includes('quadro') || 
            lowercaseName.includes('poltrona') || 
            lowercaseName.includes('painel') || 
            lowercaseName.includes('almofada') || 
            lowercaseName.includes('tapete')) {
            return 'Sala';
        }
        
        // 5. Cozinha (padrão)
        return 'Cozinha';
    }

    // 2.1. Normalização do Cômodo para correspondência exata de filtros
    function normalizarComodo(val) {
        if (!val) return 'Cozinha';
        const str = String(val).trim().toLowerCase();
        
        // Remove acentos
        const semAcento = str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        
        if (semAcento.includes('cozinha')) return 'Cozinha';
        if (semAcento.includes('quarto')) return 'Quarto';
        if (semAcento.includes('sala')) return 'Sala';
        if (semAcento.includes('banheiro')) return 'Banheiro';
        if (semAcento.includes('lavanderia')) return 'Lavanderia';
        
        return 'Cozinha';
    }

    // 3. Função Auxiliar para Requisições JSONP com Timeout e Cache Buster
    function fetchJSONP(url, timeoutMs) {
        var ms = timeoutMs || 8000;
        return new Promise(function(resolve, reject) {
            const callbackName = 'jsonpCallback_' + Math.round(Math.random() * 1000000);
            
            // Define o timer de timeout para celulares antigos / falhas de rede silenciosas
            const timeoutTimer = setTimeout(function() {
                cleanup();
                reject(new Error('Tempo limite excedido ao carregar os presentes (Timeout).'));
            }, ms);

            window[callbackName] = function(data) {
                cleanup();
                resolve(data);
            };

            const script = document.createElement('script');
            script.id = 'jsonp_' + callbackName;
            // Inclui cache buster dinâmico (&_t=...)
            script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + callbackName + '&_t=' + Date.now();
            
            script.onerror = function() {
                cleanup();
                reject(new Error('Erro ao carregar o script JSONP.'));
            };

            function cleanup() {
                clearTimeout(timeoutTimer);
                delete window[callbackName];
                const scriptNode = document.getElementById(script.id);
                if (scriptNode) {
                    scriptNode.remove();
                }
            }

            document.body.appendChild(script);
        });
    }

    // 4. Função para carregar a lista de presentes da API (Estratégia de Fallback Robusta Multicamadas)
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

        let data = null;
        let fetchError = null;

        // --- CAMADA 1: Fetch Nativo Limpo (Sem headers customizados, sem preflight) ---
        try {
            const response = await fetch(API_URL);
            if (response.ok) {
                data = await response.json();
            } else {
                throw new Error("Resposta de rede não foi OK.");
            }
        } catch (e) {
            fetchError = e;
        }

        // --- CAMADA 2: Fallback para JSONP (Script Injection com Cache Buster) ---
        if (!data) {
            try {
                data = await fetchJSONP(API_URL, 6000); // 6 segundos de timeout
            } catch (e) {
                fetchError = e;
            }
        }

        // --- CAMADA 3: Fallback para Proxy CORS Reverso (Garantia de Funcionamento) ---
        if (!data) {
            try {
                const proxyUrl = "https://corsproxy.io/?" + encodeURIComponent(API_URL);
                const response = await fetch(proxyUrl);
                if (response.ok) {
                    data = await response.json();
                } else {
                    throw new Error("Resposta do Proxy CORS não foi OK.");
                }
            } catch (e) {
                fetchError = e;
            }
        }

        // --- Renderização Final ou Exibição da Mensagem de Erro ---
        if (data && Array.isArray(data)) {
            presentesData = data.map(item => {
                if (item.Nome && typeof item.Nome === 'string') {
                    // GATILHO SECRETO: Itens com '*' no nome são infinitos
                    if (item.Nome.includes('*')) {
                        item.Nome = item.Nome.replace(/\*/g, '').trim();
                        item.Status = 'Disponível';
                    }
                }

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
            console.error("Todas as tentativas de carregar os presentes falharam:", fetchError);
            container.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px;">
                    <p style="color: white; text-align: center;">Erro ao carregar a lista de presentes. Tentando conectar ao banco de dados...</p>
                </div>
            `;
        }
    }

    // Função auxiliar para verificar se o item não tem preço definido
    function ehSemPreco(val) {
        if (val === null || val === undefined) return true;
        let strVal = String(val).trim().toLowerCase();
        // Remove 'r$' e espaços para normalizar
        strVal = strVal.replace('r$', '').trim();
        return strVal === '' || strVal === '0' || strVal === '0,00' || strVal === '0.00' || strVal === 'null';
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
            
            // Uso de operador lógico OR (||) tradicional para garantir compatibilidade com WebKit mobile antigo
            let roomRaw = item.Comodo || item.comodo || item.Cômodo || item.cômodo || item.Categoria || item.categoria;
            if (!roomRaw) {
                roomRaw = guessRoomByName(nome);
            }
            const room = normalizarComodo(roomRaw);

            const isDisponivel = String(status).trim().toLowerCase() === 'disponível' || String(status).trim().toLowerCase() === 'disponivel';
            const isReservado = String(status).trim().toLowerCase() === 'reservado';
            const precoFormatado = formatarPreco(valor);

            let statusText = '';
            let statusSub = '';
            if (!isDisponivel) {
                if (isReservado) {
                    statusText = 'RESERVADO';
                    statusSub = 'Alguém já reservou e irá entregar este item aos noivos.';
                } else {
                    statusText = 'ITEM INDISPONÍVEL';
                    statusSub = 'Alguém já presenteou os noivos com este item.';
                }
            }

            let actionsHTML = '';
            if (isDisponivel) {
                if (ehSemPreco(valor)) {
                    // Itens sem preço: exibe apenas o botão de Reservar
                    actionsHTML = `
                        <div class="action-btn-group">
                            <button class="btn-acao btn-reservar" data-id="${id}">Reservar</button>
                        </div>
                    `;
                } else {
                    // Itens com preço normal: mantêm fluxo original
                    actionsHTML = `
                        <div class="action-btn-group">
                            <button class="btn-acao btn-pix btn-presentear" data-id="${id}">Presentear</button>
                        </div>
                        <div class="action-btn-group">
                            <button class="btn-acao btn-reservar" data-id="${id}">Reservar</button>
                        </div>
                    `;
                }
            } else {
                // Esconde apenas os botões de ação originais quando o item está indisponível
                actionsHTML = '';
            }

            const cardStyle = isDisponivel ? '' : 'style="opacity: 0.6;"';

            return `
                <div class="presente-card ${isDisponivel ? '' : 'indisponivel'}" data-room="${room}" ${cardStyle}>
                    <div class="presente-img-wrapper">
                        ${imagem ? `<img src="${imagem}" alt="${nome}" draggable="false" decoding="async" loading="lazy">` : `
                        <div class="presente-img-placeholder">
                            <span>Imagem do Presente</span>
                        </div>`}
                        ${!isDisponivel ? `
                        <div class="presente-card-overlay-mask">
                            <span class="badge-status">${statusText}</span>
                            <span class="badge-sub">${statusSub}</span>
                        </div>
                        ` : ''}
                    </div>
                    <div class="presente-info">
                        <h3 class="presente-nome">${nome}</h3>
                        ${isDisponivel && !ehSemPreco(valor) ? `<p class="presente-preco">${precoFormatado}</p>` : ''}
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

                    // Mostra ou esconde o container do botão "Soltar filtro"
                    const limparFiltroContainer = document.getElementById('limpar-filtro-container');
                    if (limparFiltroContainer) {
                        if (filterValue === 'all') {
                            limparFiltroContainer.style.display = 'none';
                        } else {
                            limparFiltroContainer.style.display = 'block';
                        }
                    }

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

        // Lógica para o botão "Soltar filtro ✕"
        const btnLimparFiltro = document.getElementById('btn-limpar-filtro');
        const btnFiltroTodos = document.querySelector('.btn-filtro[data-filter="all"]');
        if (btnLimparFiltro && btnFiltroTodos) {
            btnLimparFiltro.addEventListener('click', function() {
                btnFiltroTodos.click();
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

    let scrollTimeout = null;
    window.addEventListener('scroll', function() {
        if (!scrollTimeout) {
            scrollTimeout = requestAnimationFrame(() => {
                const openTooltips = document.querySelectorAll('.tooltip-box.show');
                if (openTooltips.length > 0) {
                    openTooltips.forEach(b => {
                        b.classList.remove('show');
                    });
                }
                scrollTimeout = null;
            });
        }
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

    const modalContato = document.getElementById('modal-contato');
    const btnCloseModalContato = document.getElementById('btn-close-modal-contato');

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

                const containerCores = document.getElementById('reserva-cores-preferidas');
                if (ehSemPreco(item.Valor)) {
                    modalItemPrecoReservar.style.display = 'none';
                    if (containerCores) containerCores.style.display = 'block';
                } else {
                    modalItemPrecoReservar.innerText = formatarPreco(item.Valor);
                    modalItemPrecoReservar.style.display = 'block';
                    if (containerCores) containerCores.style.display = 'none';
                }

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

        // Abertura Modal de Contato (WhatsApp) ao clicar em qualquer item indisponível
        const cardIndisponivel = e.target.closest('.presente-card.indisponivel');
        if (cardIndisponivel && modalContato) {
            modalContato.classList.remove('hidden');
            return;
        }
    });

    // 9. Lógica de Fechamento dos Modais (com atualização dinâmica)
    const fecharModalPresentear = () => {
        if (modalPresentear) {
            modalPresentear.classList.add('hidden');
            
            // Limpa o polling do Pix se estiver rodando
            if (pollingInterval) {
                clearInterval(pollingInterval);
                pollingInterval = null;
            }

            const step1 = document.getElementById('pix-step-1');
            const step2 = document.getElementById('pix-step-2');
            const step3 = document.getElementById('pix-step-3');
            if (step1) step1.style.display = 'block';
            if (step2) step2.style.display = 'none';
            if (step3) step3.style.display = 'none';

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
    const btnSucessoFechar = document.getElementById('btn-sucesso-fechar');
    if (btnSucessoFechar) {
        btnSucessoFechar.addEventListener('click', fecharModalPresentear);
    }

    if (btnCloseModalReservar) btnCloseModalReservar.addEventListener('click', fecharModalReservar);
    if (modalReservar) {
        modalReservar.addEventListener('click', function(e) {
            if (e.target === this) fecharModalReservar();
        });
    }

    const fecharModalContato = () => {
        if (modalContato) {
            modalContato.classList.add('hidden');
        }
    };

    if (btnCloseModalContato) btnCloseModalContato.addEventListener('click', fecharModalContato);
    if (modalContato) {
        modalContato.addEventListener('click', function(e) {
            if (e.target === this) fecharModalContato();
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

    // 10.1. Funções de Polling de Pagamento Pix (JSONP)
    function iniciarPollingPagamento(idDoProduto) {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }

        pollingInterval = setInterval(async function() {
            try {
                // Consulta o status via JSONP para evitar bloqueio de CORS
                const pollUrl = `${API_URL}?action=checkStatus&idItem=${idDoProduto}`;
                const data = await fetchJSONP(pollUrl, 4000); // 4 segundos de timeout
                
                if (data && data.status) {
                    const statusStr = String(data.status).trim().toLowerCase();
                    // Confirmação do Pix recebido
                    if (statusStr === 'aprovado' || statusStr === 'approved' || statusStr === 'reservado' || statusStr === 'indisponivel' || statusStr === 'indisponível') {
                        encerrarPollingComSucesso();
                    }
                }
            } catch (err) {
                console.error("Erro no polling de status de pagamento (JSONP):", err);
            }
        }, 3000); // Polling a cada 3 segundos
    }

    function encerrarPollingComSucesso() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
        }

        // Transição para o Passo 3 (Sucesso)
        const step2 = document.getElementById('pix-step-2');
        const step3 = document.getElementById('pix-step-3');
        if (step2) step2.style.display = 'none';
        if (step3) step3.style.display = 'block';

        operacaoSucesso = true; // Ativa flag de atualização de cards ao fechar o modal

        // Dispara a animação canvas-confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
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

            let qrCodeBase64 = "";
            let copiaColaText = "";

            try {
                // Consulta o endpoint de gerarPix via JSONP (GET) para contornar limitações de CORS
                const queryUrl = `${API_URL}?action=gerarPix&id=${idDoProduto}&convidado=${encodeURIComponent(nomeDigitado)}&telefone=${encodeURIComponent(telefoneDigitado)}&preco=${encodeURIComponent(produtoSelecionado.Valor)}`;
                const resJson = await fetchJSONP(queryUrl, 10000); // 10 segundos de timeout
                
                if (resJson && resJson.status === "sucesso_pix") {
                    qrCodeBase64 = resJson.qr_code_base64;
                    copiaColaText = resJson.qr_code;
                } else if (resJson && resJson.status === "Erro") {
                    throw new Error(resJson.mensagem || "Erro na geração do Pix no servidor.");
                }
            } catch (error) {
                console.error("Falha ao gerar QR Code pela API JSONP:", error);
            }

            // Exibe alerta caso a geração do Pix real falhe
            if (!qrCodeBase64 || !copiaColaText) {
                alert("Ocorreu um erro ao gerar o Pix de pagamento com o Mercado Pago. Por favor, tente novamente.");
                btnFazerPix.innerText = originalText;
                btnFazerPix.disabled = false;
                return;
            }

            // Atualiza o modal com os dados gerados
            const qrImg = document.getElementById('pix-qr-img');
            const keyText = document.getElementById('pix-key-text');
            if (qrImg) {
                // Adiciona o prefixo MIME para imagens base64 se não estiver presente
                if (qrCodeBase64 && !qrCodeBase64.startsWith("data:image")) {
                    qrImg.src = "data:image/png;base64," + qrCodeBase64;
                } else {
                    qrImg.src = qrCodeBase64;
                }
            }
            if (keyText) keyText.innerText = copiaColaText;

            // Transição para o Passo 2 (QR Code e Polling)
            const step1 = document.getElementById('pix-step-1');
            const step2 = document.getElementById('pix-step-2');
            if (step1) step1.style.display = 'none';
            if (step2) step2.style.display = 'block';

            // Inicia o Polling de verificação de pagamento
            iniciarPollingPagamento(idDoProduto);

            // Restaura o botão original (caso reabra depois)
            btnFazerPix.innerText = originalText;
            btnFazerPix.disabled = false;
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
                // Consulta o endpoint de reservarFisico via JSONP (GET) para contornar limitações de CORS
                const queryUrl = `${API_URL}?action=reservarFisico&id=${idDoProduto}&convidado=${encodeURIComponent(nomeDigitado)}&telefone=${encodeURIComponent(telefoneDigitado)}`;
                const resJson = await fetchJSONP(queryUrl, 10000);
                
                if (resJson && resJson.status === "sucesso_reserva") {
                    // Transição para mensagem de sucesso
                    operacaoSucesso = true;
                    if (typeof confetti === 'function') {
                        confetti({
                            particleCount: 150,
                            spread: 80,
                            origin: { y: 0.6 }
                        });
                    }
                    const step1 = document.getElementById('reserva-step-1');
                    const step2 = document.getElementById('reserva-step-2');
                    if (step1) step1.style.display = 'none';
                    if (step2) step2.style.display = 'block';
                } else {
                    const errorMsg = resJson && resJson.mensagem ? resJson.mensagem : "Erro desconhecido.";
                    throw new Error(errorMsg);
                }

            } catch (error) {
                console.error('Erro ao registrar presente (Físico):', error);
                alert('Ocorreu um erro ao processar a reserva: ' + error.message);
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

/* ==========================================================================
   LÓGICA DA SEÇÃO DE DOAÇÕES (index.html) — INTEGRAÇÃO COM GOOGLE APPS SCRIPT
   ========================================================================== */
document.addEventListener('DOMContentLoaded', function() {
    const API_URL = 'https://script.google.com/macros/s/AKfycbwSOt56V8gjDFjttF01Uv3WcRdfeInWxoTjITK6dev_qFe3Bf3rsWX3jowz1GH-hY7M/exec';
    const PATH_IMAGENS_DOACOES = 'IMAGENS/PRESENTES/Doações/'; // Pasta de imagens das doações

    // Função para higienizar nomes de arquivos locais
    function sanitizarNomeArquivo(nome) {
        if (!nome) return '';
        return String(nome)
            .replace(/\//g, '-') // substitui '/' por '-'
            .replace(/\?/g, '')  // remove '?'
            .trim();
    }

    const gridContainer = document.getElementById('doacoes-cards-grid');
    if (!gridContainer) return; // Só executa na página principal (index.html) se a seção existir

    const modalDoar = document.getElementById('modal-doar');
    const btnCloseModalDoar = document.getElementById('btn-close-modal-doar');
    const modalDoarImgPlaceholder = document.getElementById('modal-doar-img-placeholder');
    const modalDoarImg = document.getElementById('modal-doar-img');
    const modalDoarNome = document.getElementById('modal-doar-nome');
    const modalDoarPreco = document.getElementById('modal-doar-preco');
    const btnConfirmarDoacao = document.getElementById('btn-confirmar-doacao');
    const btnDoarCopyPix = document.getElementById('btn-doar-copy-pix');
    const keyText = document.getElementById('doar-key-text');
    const qrImg = document.getElementById('doar-qr-img');
    const btnDoarSucessoFechar = document.getElementById('btn-doar-sucesso-fechar');

    const step1 = document.getElementById('doar-step-1');
    const step2 = document.getElementById('doar-step-2');
    const step3 = document.getElementById('doar-step-3');

    let doacaoSelecionada = null;
    let currentPaymentId = null;
    let doacaoPollingInterval = null;

    // Função de formatação de moeda
    function formatarPrecoDoacao(val) {
        if (typeof val === 'number') {
            return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        let strVal = String(val || '').trim();
        if (strVal.includes('R$')) return strVal;
        let num = parseFloat(strVal.replace(/[^0-9,-]/g, '').replace(',', '.'));
        if (isNaN(num)) return 'R$ 0,00';
        return `R$ ${num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Helper JSONP
    function fetchJSONPDoacao(url, timeoutMs) {
        return new Promise((resolve, reject) => {
            const callbackName = 'jsonp_doacoes_' + Math.round(100000 * Math.random());
            const script = document.createElement('script');
            let timer = null;

            window[callbackName] = function(data) {
                cleanup();
                resolve(data);
            };

            script.onerror = function() {
                cleanup();
                reject(new Error("Erro de rede ao carregar JSONP."));
            };

            const connector = url.includes('?') ? '&' : '?';
            script.src = `${url}${connector}callback=${callbackName}`;
            document.body.appendChild(script);

            if (timeoutMs) {
                timer = setTimeout(() => {
                    cleanup();
                    reject(new Error("Limite de tempo excedido para resposta."));
                }, timeoutMs);
            }

            function cleanup() {
                if (timer) clearTimeout(timer);
                if (script.parentNode) script.parentNode.removeChild(script);
                delete window[callbackName];
            }
        });
    }

    // Carregar Doações
    async function carregarDoacoes() {
        try {
            const url = `${API_URL}?aba=Doacoes`;
            const data = await fetchJSONPDoacao(url, 10000);
            if (data && Array.isArray(data)) {
                renderizarDoacoes(data);
            }
        } catch (e) {
            console.error("Falha ao carregar doações:", e);
        }
    }

    // Renderizar Cards
    function renderizarDoacoes(items) {
        if (items.length === 0) {
            gridContainer.innerHTML = `<p style="color: #fff; grid-column: 1/-1;">Nenhuma opção de doação disponível no momento.</p>`;
            return;
        }

        gridContainer.innerHTML = items.map(item => {
            const id = item.ID;
            let nome = item.Nome || '';
            if (typeof nome === 'string' && nome.includes('*')) {
                nome = nome.replace(/\*/g, '').trim();
            }
            const valor = item.Valor;
            const valorFormatado = formatarPrecoDoacao(valor);
            const imgPath = acharImagemPorNome(nome, IMAGENS_DOACOES_DISPONIVEIS, PATH_IMAGENS_DOACOES) || 'IMAGENS/WIS.svg';

            return `
                <div class="doacao-card">
                    <div class="doacao-img-wrapper">
                        <img src="${imgPath}" alt="${nome}" onerror="this.onerror=null; this.src='IMAGENS/WIS.svg';" decoding="async" loading="lazy">
                    </div>
                    <div class="doacao-info">
                        <h3 class="doacao-card-titulo">${nome}</h3>
                        <p class="doacao-card-preco">${valorFormatado}</p>
                        <div class="doacao-btn-wrapper">
                            <button class="btn-acao btn-pix btn-abrir-doar" data-id="${id}" style="width: 100%;">Doar</button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        // Event Listeners dos botões de doar
        const botoesDoar = gridContainer.querySelectorAll('.btn-abrir-doar');
        botoesDoar.forEach(botao => {
            botao.addEventListener('click', function() {
                const id = this.getAttribute('data-id');
                const item = items.find(i => String(i.ID) === String(id));
                if (item) {
                    abrirModalDoar(item);
                }
            });
        });
    }

    // Abrir Modal
    function abrirModalDoar(item) {
        doacaoSelecionada = item;
        
        // Reset passos
        step1.style.display = 'block';
        step2.style.display = 'none';
        step3.style.display = 'none';

        // Atualizar campos do modal
        modalDoarNome.innerText = item.Nome;
        modalDoarPreco.innerText = formatarPrecoDoacao(item.Valor);

        const imgPath = acharImagemPorNome(item.Nome, IMAGENS_DOACOES_DISPONIVEIS, PATH_IMAGENS_DOACOES) || 'IMAGENS/WIS.svg';
        
        // Tenta carregar a imagem usando preloader temporário para evitar bugs de cache
        const tempImg = new Image();
        tempImg.onload = function() {
            modalDoarImg.src = imgPath;
            modalDoarImg.classList.remove('hidden');
            modalDoarImgPlaceholder.classList.add('hidden');
        };
        tempImg.onerror = function() {
            modalDoarImg.classList.add('hidden');
            modalDoarImgPlaceholder.classList.remove('hidden');
        };
        tempImg.src = imgPath;

        // Abre modal visualmente
        modalDoar.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Trava scroll
    }

    // Fechar Modal
    function fecharModalDoar() {
        modalDoar.classList.add('hidden');
        document.body.style.overflow = ''; // Destrava scroll
        pararPollingDoacao();
    }

    if (btnCloseModalDoar) {
        btnCloseModalDoar.addEventListener('click', fecharModalDoar);
    }
    if (modalDoar) {
        modalDoar.addEventListener('click', function(e) {
            if (e.target === this) fecharModalDoar();
        });
    }

    // Gerar Pix (Clique no Confirmar)
    if (btnConfirmarDoacao) {
        btnConfirmarDoacao.addEventListener('click', async function() {
            if (!doacaoSelecionada) return;

            const id = doacaoSelecionada.ID;
            let precoRaw = String(doacaoSelecionada.Valor).replace(/[^0-9,-]/g, '').replace(',', '.');
            
            const originalText = btnConfirmarDoacao.innerText;
            btnConfirmarDoacao.innerText = 'A carregar...';
            btnConfirmarDoacao.disabled = true;

            try {
                const queryUrl = `${API_URL}?action=gerarPix&id=${id}&convidado=${encodeURIComponent('Anônimo')}&telefone=&preco=${encodeURIComponent(precoRaw)}&aba=Doacoes`;
                const resJson = await fetchJSONPDoacao(queryUrl, 12000);
                
                if (resJson && resJson.status === "sucesso_pix") {
                    const qrCode = resJson.qr_code;
                    const qrCodeBase64 = resJson.qr_code_base64;
                    currentPaymentId = resJson.payment_id;

                    if (keyText) keyText.innerText = qrCode;
                    if (qrImg) {
                        if (qrCodeBase64 && !qrCodeBase64.startsWith("data:image")) {
                            qrImg.src = "data:image/png;base64," + qrCodeBase64;
                        } else {
                            qrImg.src = qrCodeBase64;
                        }
                    }

                    // Transiciona para o QR Code (Passo 2)
                    step1.style.display = 'none';
                    step2.style.display = 'block';

                    // Inicia Polling
                    iniciarPollingDoacao(id, currentPaymentId);
                } else {
                    const msg = resJson && resJson.mensagem ? resJson.mensagem : "Erro na geração do Pix.";
                    throw new Error(msg);
                }
            } catch (err) {
                console.error("Erro ao gerar doação Pix:", err);
                alert("Ocorreu um erro ao gerar o Pix de doação. Por favor, tente novamente.");
            } finally {
                btnConfirmarDoacao.innerText = originalText;
                btnConfirmarDoacao.disabled = false;
            }
        });
    }

    // Copiar Chave Pix
    if (btnDoarCopyPix && keyText) {
        btnDoarCopyPix.addEventListener('click', function() {
            navigator.clipboard.writeText(keyText.innerText).then(() => {
                const originalText = btnDoarCopyPix.innerText;
                btnDoarCopyPix.innerText = 'Copiado!';
                btnDoarCopyPix.style.backgroundColor = '#28a745';
                setTimeout(() => {
                    btnDoarCopyPix.innerText = originalText;
                    btnDoarCopyPix.style.backgroundColor = '';
                }, 2000);
            });
        });
    }

    // Polling de Pagamento
    function iniciarPollingDoacao(idItem, paymentId) {
        pararPollingDoacao();

        doacaoPollingInterval = setInterval(async function() {
            try {
                const pollUrl = `${API_URL}?action=checkStatus&idItem=${idItem}&paymentId=${paymentId}&aba=Doacoes`;
                const data = await fetchJSONPDoacao(pollUrl, 4000);
                
                if (data && data.status) {
                    const statusStr = String(data.status).trim().toLowerCase();
                    if (statusStr === 'aprovado' || statusStr === 'approved') {
                        confirmarSucessoDoacao();
                    }
                }
            } catch (err) {
                console.error("Erro no polling de doação:", err);
            }
        }, 3000);
    }

    // Parar Polling
    function pararPollingDoacao() {
        if (doacaoPollingInterval) {
            clearInterval(doacaoPollingInterval);
            doacaoPollingInterval = null;
        }
    }

    // Confirmação de Sucesso
    function confirmarSucessoDoacao() {
        pararPollingDoacao();

        // Transiciona para o Passo 3
        step2.style.display = 'none';
        step3.style.display = 'block';

        // Animação de Confetti
        if (typeof confetti === 'function') {
            confetti({
                particleCount: 150,
                spread: 80,
                origin: { y: 0.6 }
            });
        }
    }

    if (btnDoarSucessoFechar) {
        btnDoarSucessoFechar.addEventListener('click', fecharModalDoar);
    }

    // Carrega doações ao iniciar
    carregarDoacoes();
});
