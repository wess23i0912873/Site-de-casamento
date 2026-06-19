/* ==========================================================================
   SITE DE CASAMENTO: WESLEY & STEFANY
   LÓGICA DA INTRODUÇÃO CINEMATOGRÁFICA — Revisão Coreografia v3
   ==========================================================================

   TIMELINE (tempos a partir do início de cada fase):

   FASE 0 — Logo
     0ms      → Logo faz fade-in (1.5s)
     3500ms   → Logo faz fade-out; avança para Fase 1

   FASE 1 — Texto 1 aparece sozinho
     0ms      → (logo some em 1.5s, pausa 0.5s = 2s de espera)
     2000ms   → Texto 1 faz fade-in (1.5s)
     3500ms   → Texto 1 totalmente visível
     5000ms   → (2s após T1 aparecer) → Texto 2 faz fade-in ABAIXO (ambos visíveis)
     8500ms   → (5s após T1 aparecer) → ambos os textos somem juntos; avança para Fase 2

   FASE 2 — Outro: overlay inteira faz fade-out → site revelado

   SKIP: clique cancela timers e avança uma fase, com fade-out suave do atual.
   ========================================================================== */

(function () {
  'use strict';

  /* ── Elementos ─────────────────────────────────────────────────────────── */
  const introScreen = document.getElementById('intro-screen');
  const introLogo   = document.getElementById('intro-logo');
  const text1       = document.getElementById('intro-text-1');
  const text2       = document.getElementById('intro-text-2');
  const mainNav     = document.getElementById('main-nav');

  /* ── Timings (ms) — coincidem com as classes CSS ────────────────────────── */
  const FADE_MS       = 1500; // duração de cada fade (CSS transition: 1.5s)
  const PAUSE_MS      = 500;  // pausa preta entre elementos
  const LOGO_HOLD     = 2000; // logo fica visível após o fade-in
  const T2_DELAY      = 2000; // T2 aparece 2s após T1 completar o fade-in
  const TOTAL_HOLD    = 5000; // tempo total em que T1 fica visível antes do encerramento

  /* ── Estado ────────────────────────────────────────────────────────────── */
  let phase  = 0;
  let timers = []; // pool de IDs para cancelamento limpo

  /* ── Helpers ─────────────────────────────────────────────────────────────*/

  function later(ms, fn) {
    const id = setTimeout(fn, ms);
    timers.push(id);
    return id;
  }

  function clearAll() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  /** Fade-in: remove .fade-out, adiciona .fade-in → opacity: 1 */
  function show(el) {
    el.classList.remove('fade-out');
    el.classList.add('fade-in');
  }

  /** Fade-out: remove .fade-in, adiciona .fade-out → opacity: 0 */
  function hide(el) {
    el.classList.remove('fade-in');
    el.classList.add('fade-out');
  }

  /* ── Motor de Fases ──────────────────────────────────────────────────────*/

  function runPhase(newPhase) {
    clearAll();
    phase = newPhase;

    /* ── FASE 0: Logo ─────────────────────────────────────────────────── */
    if (phase === 0) {

      // Logo aparece (fade-in 1.5s) → fica visível 2s → avança
      show(introLogo);
      later(FADE_MS + LOGO_HOLD, () => runPhase(1));

    /* ── FASE 1: Textos ───────────────────────────────────────────────── */
    } else if (phase === 1) {

      // [1] Logo some (fade-out 1.5s) + pausa (0.5s) = 2s de espera
      hide(introLogo);

      later(FADE_MS + PAUSE_MS, () => {

        // [2] T1 aparece sozinho (fade-in 1.5s)
        show(text1);

        // [3] 2s após T1 completar o fade-in (1.5s fade + 2s delay = 3.5s):
        //     T2 aparece ABAIXO do T1 — T1 permanece visível
        later(FADE_MS + T2_DELAY, () => {
          show(text2);
        });

        // [4] 5s após T1 aparecer (1.5s fade + 5s hold = 6.5s):
        //     AMBOS somem juntos → avança para Fase 2
        later(FADE_MS + TOTAL_HOLD, () => runPhase(2));

      });

    /* ── FASE 2: Outro (encerramento) ─────────────────────────────────── */
    } else if (phase === 2) {

      // [1] T1 e T2 somem juntos (fade-out 1.5s)
      hide(text1);
      hide(text2);

      // [2] Após textos sumirem (1.5s): overlay some (fade-out 1.5s)
      later(FADE_MS, () => {
        introScreen.classList.add('fade-out');

        // [3] Após fade-out da overlay (1.5s): encerra
        later(FADE_MS, endIntro);
      });
    }
  }

  /* ── Encerramento ──────────────────────────────────────────────────────── */
  function endIntro() {
    introScreen.style.display = 'none';     // Remove overlay do fluxo visual
    document.body.style.overflow = '';      // Libera scroll da página
    mainNav.classList.remove('nav-hidden'); // Revela o menu
    introScreen.removeEventListener('click', onSkip);
  }

  /* ── Skip ao Clicar ─────────────────────────────────────────────────────*/
  /**
   * Clique durante Fase 0 → vai para Fase 1 (logo some, T1 aparece)
   * Clique durante Fase 1 → vai para Fase 2 (textos somem, overlay some)
   * Clique durante Fase 2 → ignorado (já encerrando)
   *
   * runPhase() sempre cancela timers e aplica fade-out do atual antes de avançar.
   */
  function onSkip() {
    if (phase < 2) {
      runPhase(phase + 1);
    }
  }

  introScreen.addEventListener('click', onSkip);

  /* ── Inicialização ─────────────────────────────────────────────────────── */
  document.body.style.overflow = 'hidden'; // Bloqueia scroll durante a intro
  mainNav.classList.add('nav-hidden');     // Oculta o menu enquanto a intro roda
  runPhase(0);                             // Dispara a sequência da Fase 0

})();
