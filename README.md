Site-de-casamento

# Contexto Arquitetural e Visual: Site de Casamento
===

# 

# \## 1. Informações Base

# \* \*\*Projeto:\*\* Site de Casamento Premium (Single Page Application com modais e páginas auxiliares).

# \* \*\*Noivos:\*\* Wesley \& Stefany

# \* \*\*Data do Evento:\*\* 12 de setembro de 2026

# \* \*\*Estilo Geral:\*\* Minimalista, editorial, alta costura, focado em tipografia elegante e uso expressivo de espaço negativo (design de revista).

# 

# \## 2. Design System \& UI

# \* \*\*Paleta de Cores:\*\* Fundo Branco Puro, Textos e Sombras em Preto/Grafite Escuro, Destaques/Botões em Azul Nobre.

# \* \*\*Tipografia:\*\* Serifada elegante para títulos (estilo convite clássico) e Sans-serif moderna e legível para parágrafos.

# \* \*\*Menu de Navegação (Desktop):\*\* Lateral esquerdo, fixo e levemente transparente. Logotipo tipográfico (iniciais empilhadas). Itens rotacionados em 90 graus (escritos de baixo para cima) com linhas decorativas finas. 

# \* \*\*Menu de Navegação (Mobile):\*\* Fixo no topo, sem fundo sólido (integrado ao espaço negativo), sem barra visível que quebre a estética.

# \* \*\*Comportamento de Rolagem:\*\* Efeito de \*Overlay Scrolling\* (camadas sobrepostas). Todas as seções principais deslizam por cima da anterior (usando `position: sticky` e drop shadows).

# 

# \## 3. Estrutura e Comportamento das Seções

# \* \*\*1. Intro Cinematográfica (Preloader):\*\*

# &#x20; \* Fundo preto absoluto.

# &#x20; \* Texto 1: "Olá! Seja muito bem vindo ao nosso site de casamento!" (Piscada rápida, fica 5s, some em fade out).

# &#x20; \* Texto 2: "Estamos muito felizes em ter você aqui" (Fade in, fica 5s, some em fade out).

# &#x20; \* \*Regra de UX:\* O usuário pode pular cada etapa clicando na tela. Após o Texto 2 sumir, a seção Hero é revelada e o menu lateral aparece.

# \* \*\*2. Hero (Tela Inicial):\*\* Letreiro grande "Wesley \& Stefany". Fundo com foto previamente tratada (inserida como arquivo pronto, sem necessidade de filtros via CSS).

# \* \*\*3. Detalhes:\*\* Seção em \*overlay\* contendo informações de Local, Data, Hora e Dress Code.

# \* \*\*4. Sobre Nós (A Noiva e O Noivo):\*\*

# &#x20; \* Layout editorial assimétrico e livre (sem fundos sólidos, usando apenas sombras para destacar sobre o \*overlay\*).

# &#x20; \* A Noiva: 3 fotos (2 em cima, 1 embaixo à direita) com texto descritivo embaixo à esquerda.

# &#x20; \* O Noivo: Mesma estrutura, surgindo por cima da seção da noiva via scroll.

# \* \*\*5. RSVP (Confirmação de Presença):\*\*

# &#x20; \* Acessado pelo menu (com tooltip interativo). É uma página/janela isolada.

# &#x20; \* Contém: Cronômetro regressivo até a data limite e formulário (Nome, Email, Quem convidou, Acompanhantes, Endereço, Mensagem).

# &#x20; \* Integração silenciosa com Google Sheets via Apps Script para salvar dados e disparar email automático.

# &#x20; \* Pós-confirmação: O formulário some e dá lugar a uma mensagem de agradecimento com botão de retorno.

# \* \*\*6. Lista de Presentes (Bifurcação de Jornada):\*\*

# &#x20; \* \*Portal Sério:\* Uma barreira visual/botão ("Aperte aqui para nos presentear") no fluxo da página que redireciona o usuário para um site externo apenas com mobília/eletrodomésticos.

# &#x20; \* \*Área Engraçada (Ao ignorar o portal e continuar o scroll):\* Grid de cards interativos para doações via Pix.

# \* \*\*7. Comportamento dos Cards (Área Engraçada):\*\*

# &#x20; \* Layout base: Imagem, Título cômico, Descrição curta, botão/texto "Clique".

# &#x20; \* Responsividade: Até 5 por linha no Desktop, exatamente 3 por linha no Mobile.

# &#x20; \* Interação (\*Lightbox\*): Ao clicar, o card se expande e centraliza. O fundo do site ganha efeito \*blur\* (desfoque). O card aberto exibe a chave Pix, botão de "Copiar" e QR Code em SVG. Possui botão "X" para fechar.

# \* \*\*8. Rodapé (Footer Hub):\*\*

# &#x20; \* Mensagem final de agradecimento.

# &#x20; \* 4 botões de conversão: "Voltar ao topo", "Fotos do Casamento" (leva a página externa com aviso de 'Em breve'), "Nos presentear" e "Falar com o noivo".

# 

# \## 4. Regras de Código e Segurança

# \* Nunca utilizar dados reais de contato, chaves Pix ou endereços físicos definitivos durante a codificação. Usar \*placeholders\* estruturais até o deploy final.

# \* Todo o CSS deve ser modular e usar variáveis (`:root`) para facilitar alterações na paleta de cores ou tipografia.

