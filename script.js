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
