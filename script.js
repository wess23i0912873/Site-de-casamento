/* ==========================================================================
   SITE DE CASAMENTO: WESLEY & STEFANY
   LÓGICA INTERATIVA E INTEGRADA (script.js)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {

    /* ==========================================
       1. CONTROLE DO MENU MOBILE (HAMBÚRGUER)
       ========================================== */
    const mobileMenuToggle = document.querySelector('.mobile-menu-toggle');
    const mobileNavOverlay = document.querySelector('.mobile-nav-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    function toggleMobileMenu() {
        const isOpen = mobileMenuToggle.classList.toggle('open');
        mobileNavOverlay.classList.toggle('open');
        mobileMenuToggle.setAttribute('aria-expanded', isOpen);
        // Impede rolagem do fundo quando menu mobile está aberto
        document.body.style.overflow = isOpen ? 'hidden' : '';
    }

    if (mobileMenuToggle && mobileNavOverlay) {
        mobileMenuToggle.addEventListener('click', toggleMobileMenu);

        // Fecha ao clicar em qualquer link do menu mobile
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (mobileMenuToggle.classList.contains('open')) {
                    toggleMobileMenu();
                }
            });
        });
    }


    /* ==========================================
       2. CONTANTE REGRESSIVA DO CASAMENTO
       ========================================== */
    const countdownElement = document.getElementById('countdown');
    // Data limite: 19 de Setembro de 2026 às 17:00
    const targetDate = new Date('September 19, 2026 17:00:00').getTime();

    function updateCountdown() {
        if (!countdownElement) return;

        const now = new Date().getTime();
        const difference = targetDate - now;

        if (difference < 0) {
            countdownElement.textContent = "O grande dia chegou! Wesley & Stefany casam hoje!";
            clearInterval(countdownInterval);
            return;
        }

        // Cálculos de tempo
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        countdownElement.innerHTML = `Faltam <strong>${days}</strong> dias, <strong>${hours}</strong>h, <strong>${minutes}</strong>m e <strong>${seconds}</strong>s`;
    }

    // Executa e inicia o loop
    updateCountdown();
    const countdownInterval = setInterval(updateCountdown, 1000);


    /* ==========================================
       3. INTERSECTION OBSERVER (MENU ATIVO & ANIMAÇÃO)
       ========================================== */
    const sections = document.querySelectorAll('.sticky-section');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mapeamento de seções para botões do menu correspondentes
    const sectionToMenuMap = {
        'hero': null, // No topo, nada marcado
        'noiva': 'Sobre Nós',
        'noino': 'Sobre Nós', // Fallback caso acione noivo
        'noivo': 'Sobre Nós',
        'detalhes': 'Detalhes',
        'rsvp': 'RSVP',
        'presentes': 'Presentes'
    };

    const observerOptions = {
        root: null, // viewport
        rootMargin: '-20% 0px -40% 0px', // Aciona quando a seção ocupa a maior parte do meio
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                // 1. Revela a seção (transição CSS do opacity)
                entry.target.classList.add('active-visible');

                // 2. Atualiza estado ativo do menu
                const sectionId = entry.target.id;
                const activeMenuLabel = sectionToMenuMap[sectionId];

                navLinks.forEach(link => {
                    if (activeMenuLabel && link.textContent.trim() === activeMenuLabel) {
                        link.classList.add('active');
                    } else {
                        link.classList.remove('active');
                    }
                });
            }
        });
    }, observerOptions);

    sections.forEach(section => observer.observe(section));


    /* ==========================================
       4. CONTROLE GERAL DE MODAIS
       ========================================== */
    const modals = document.querySelectorAll('.modal');

    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('open');
            modal.setAttribute('aria-hidden', 'false');
            document.body.style.overflow = 'hidden'; // Trava rolagem externa
        }
    }

    function closeModal(modal) {
        if (modal) {
            modal.classList.remove('open');
            modal.setAttribute('aria-hidden', 'true');
            // Só libera rolagem se não houver outras modais abertas
            const anyOpen = Array.from(modals).some(m => m.classList.contains('open'));
            if (!anyOpen) {
                document.body.style.overflow = '';
            }
        }
    }

    // Configura listeners para fechar modal (botão fechar e clique fora)
    modals.forEach(modal => {
        const closeBtn = modal.querySelector('.modal-close-btn');
        const backdrop = modal.querySelector('.modal-backdrop');
        const okBtn = modal.querySelector('.modal-ok-btn');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => closeModal(modal));
        }
        if (backdrop) {
            backdrop.addEventListener('click', () => closeModal(modal));
        }
        if (okBtn) {
            okBtn.addEventListener('click', () => closeModal(modal));
        }
    });

    // Tecla Escape fecha modais
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const openModalEl = document.querySelector('.modal.open');
            if (openModalEl) closeModal(openModalEl);
        }
    });


    /* ==========================================
       5. SISTEMA DE TOAST DE FEEDBACK
       ========================================== */
    const toast = document.getElementById('toast-notification');
    const toastMessage = document.getElementById('toast-message');

    function showToast(message) {
        if (!toast || !toastMessage) return;
        toastMessage.textContent = message;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }


    /* ==========================================
       6. SEÇÃO DETALHES: MODAL DE MAPA
       ========================================== */
    const showMapButtons = document.querySelectorAll('.show-map');
    const mapTitle = document.getElementById('map-title');
    const mapAddressLabel = document.getElementById('map-address-label');
    const linkGoogleMaps = document.querySelector('.link-google-maps');

    const mapData = {
        cerimonia: {
            title: 'Local da Cerimônia',
            address: 'Av. da Aliança, 1000 — Centro, Flores-SP',
            query: 'Catedral+de+Sao+Francisco+das+Flores+Sao+Paulo'
        },
        recepcao: {
            title: 'Local da Recepção',
            address: 'Rua das Hortênsias, 250 — Alto da Colina, Flores-SP',
            query: 'Espaco+Jardins+e+Eventos+Sao+Paulo'
        }
    };

    showMapButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const locationKey = btn.getAttribute('data-map');
            const data = mapData[locationKey];

            if (data) {
                mapTitle.textContent = data.title;
                mapAddressLabel.textContent = data.address;
                linkGoogleMaps.setAttribute('href', `https://maps.google.com/?q=${data.query}`);
                openModal('map-modal');
            }
        });
    });


    /* ==========================================
       7. RSVP: VALIDAÇÃO E ENVIO SIMULADO
       ========================================== */
    const rsvpForm = document.getElementById('rsvp-form');

    if (rsvpForm) {
        rsvpForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Validação simples
            let isFormValid = true;
            const inputs = rsvpForm.querySelectorAll('input[required], select[required]');

            inputs.forEach(input => {
                const group = input.closest('.input-group');
                let isInputValid = true;

                if (input.type === 'email') {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    isInputValid = emailRegex.test(input.value.trim());
                } else {
                    isInputValid = input.value.trim() !== '';
                }

                if (!isInputValid) {
                    group.classList.add('error');
                    isFormValid = false;
                } else {
                    group.classList.remove('error');
                }

                // Remove o erro conforme digita ou muda valor
                input.addEventListener('input', () => {
                    if (input.value.trim() !== '') {
                        group.classList.remove('error');
                    }
                }, { once: true });
                if (input.tagName === 'SELECT') {
                    input.addEventListener('change', () => {
                        group.classList.remove('error');
                    }, { once: true });
                }
            });

            if (isFormValid) {
                const submitBtn = rsvpForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.innerHTML;

                // Animação de envio
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<span>Registrando...</span>';

                // Simulação de envio da API
                setTimeout(() => {
                    // Limpa form
                    rsvpForm.reset();

                    // Volta botão original
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = originalText;

                    // Abre modal de sucesso personalizado
                    const successTitle = document.getElementById('success-modal-title');
                    const successText = document.getElementById('success-modal-text');

                    successTitle.textContent = "Presença Confirmada!";
                    successText.textContent = "Ficamos muito felizes com sua confirmação. Stefany & Wesley te aguardam no dia 19/09/2026!";

                    openModal('success-modal');
                }, 1500);
            } else {
                showToast("Por favor, preencha todos os campos obrigatórios corretamente.");
            }
        });
    }


    /* ==========================================
       8. LISTA DE PRESENTES: RESERVAR E PIX
       ========================================== */
    const giftCards = document.querySelectorAll('.gift-card');
    const reserveItemName = document.getElementById('reserve-item-name');
    const reserveItemId = document.getElementById('reserve-item-id');
    const reserveForm = document.getElementById('reserve-form');

    const pixItemName = document.getElementById('pix-item-name');
    const pixItemPrice = document.getElementById('pix-item-price');
    const copyPixBtn = document.getElementById('btn-copy-pix');
    const pixCopyKey = document.getElementById('pix-copy-key');

    giftCards.forEach(card => {
        const id = card.getAttribute('data-id');
        const name = card.getAttribute('data-name');
        const price = card.getAttribute('data-price');

        const reserveBtn = card.querySelector('.action-reserve');
        const pixBtn = card.querySelector('.action-pix');

        // Abre modal de reserva
        if (reserveBtn) {
            reserveBtn.addEventListener('click', () => {
                reserveItemName.textContent = name;
                reserveItemId.value = id;
                // Limpa form de reserva
                reserveForm.reset();
                reserveForm.querySelector('.input-group').classList.remove('error');
                openModal('reserve-modal');
            });
        }

        // Abre modal de PIX
        if (pixBtn) {
            pixBtn.addEventListener('click', () => {
                pixItemName.textContent = name;
                pixItemPrice.textContent = price;
                openModal('pix-modal');
            });
        }
    });

    // Envio do Form de Reserva
    if (reserveForm) {
        reserveForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const guestNameInput = document.getElementById('reserve-guest-name');
            const group = guestNameInput.closest('.input-group');

            if (guestNameInput.value.trim() === '') {
                group.classList.add('error');
                return;
            }

            group.classList.remove('error');
            const submitBtn = reserveForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;

            submitBtn.disabled = true;
            submitBtn.innerHTML = '<span>Reservando...</span>';

            setTimeout(() => {
                const reservedName = reserveItemName.textContent;
                const guestName = guestNameInput.value.trim();

                // Fecha reserva
                closeModal(document.getElementById('reserve-modal'));

                // Reseta botão
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;

                // Abre modal sucesso
                const successTitle = document.getElementById('success-modal-title');
                const successText = document.getElementById('success-modal-text');

                successTitle.textContent = "Presente Reservado!";
                successText.textContent = `Você reservou com sucesso o presente "${reservedName}". Wesley & Stefany agradecem imensamente sua atenção!`;

                openModal('success-modal');
            }, 1200);
        });
    }

    // Copiar Chave Pix
    if (copyPixBtn && pixCopyKey) {
        copyPixBtn.addEventListener('click', () => {
            pixCopyKey.select();
            pixCopyKey.setSelectionRange(0, 99999); // Suporte mobile

            navigator.clipboard.writeText(pixCopyKey.value)
                .then(() => {
                    showToast("Copiado com sucesso!");
                    copyPixBtn.classList.add('btn-solid');
                    copyPixBtn.querySelector('span').textContent = "Copiado!";
                    setTimeout(() => {
                        copyPixBtn.querySelector('span').textContent = "Copiar";
                    }, 2000);
                })
                .catch(err => {
                    console.error('Falha ao copiar texto: ', err);
                    showToast("Erro ao copiar. Selecione o texto manualmente.");
                });
        });
    }

});
