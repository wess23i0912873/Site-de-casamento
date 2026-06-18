/* ==========================================================================
   SITE DE CASAMENTO: WESLEY & STEFANY
   LÓGICA INTERATIVA E INTEGRADA (script.js) - Passo 1
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    console.log('Site de Casamento de Wesley & Stefany — Fundação e Menu Editorial Carregados.');
    
    // Suporte para scroll suave básico
    const links = document.querySelectorAll('.nav-link');
    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const targetId = link.getAttribute('href');
            if (targetId.startsWith('#')) {
                // Como <main> está vazio para o Passo 1, vamos apenas demonstrar no console
                console.log(`Navegando para a seção: ${targetId}`);
            }
        });
    });
});
