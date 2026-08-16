# Camel Up: The Card Game — Especificação Mobile First

## 1. Objetivo

A aplicação deve ser desenvolvida seguindo o princípio **Mobile First**.

O principal dispositivo-alvo da aplicação será o **smartphone**, especialmente para partidas realizadas fora de casa.

A experiência mobile deve ser considerada a experiência principal do produto.

Desktop, tablet e outros dispositivos serão adaptações da experiência mobile.

---

# 2. Princípio fundamental

> **Se uma funcionalidade funciona bem no celular, ela pode ser adaptada para telas maiores. O contrário não é necessariamente verdadeiro.**

Portanto, nenhuma funcionalidade essencial poderá depender de:

* mouse;
* hover;
* teclado;
* tela grande;
* múltiplas janelas;
* drag-and-drop obrigatório;
* alta resolução.

A experiência completa deve ser possível utilizando somente:

* tela sensível ao toque;
* gestos básicos;
* botões;
* navegação vertical.

---

# 3. Dispositivo primário

O dispositivo primário é:

```text
Smartphone
↓
Orientação preferencial: Portrait
↓
Touch Screen
↓
Internet móvel ou Wi-Fi
```

A aplicação deve funcionar adequadamente em smartphones de diferentes tamanhos.

---

# 4. Orientação da tela

A aplicação deve priorizar:

```text
Portrait
```

A orientação `Landscape` poderá ser suportada posteriormente.

A experiência não deve exigir que o usuário gire o celular para realizar ações essenciais.

---

# 5. Resolução mínima de referência

O layout deve ser projetado considerando telas pequenas.

Como referência inicial:

```text
320 × 568
```

O sistema deve continuar funcional nessa resolução.

A experiência ideal deve ser validada também em:

```text
360 × 640
375 × 667
390 × 844
412 × 915
```

Não devem existir elementos essenciais cortados ou inacessíveis nessas dimensões.

---

# 6. Touch First

Todas as interações principais devem ser projetadas para toque.

Não depender de:

```text
hover
right click
double click
drag obrigatório
keyboard shortcuts
```

para realizar ações essenciais.

---

# 7. Área mínima de toque

Elementos interativos devem possuir área de toque adequada.

Como referência:

```text
mínimo recomendado:
44 × 44 px
```

Elementos importantes podem utilizar áreas maiores.

Exemplo:

```text
[ REVELAR CARTA ]

     ↑
grande área de toque
```

---

# 8. Feedback de toque

Toda ação realizada pelo usuário deve possuir feedback visual imediato.

Exemplos:

```text
Toque
 ↓
Botão muda visualmente
 ↓
Ação executada
 ↓
Estado atualizado
```

A aplicação não deve parecer congelada enquanto processa uma ação.

---

# 9. Evitar ações acidentais

Ações que possam alterar significativamente o estado do jogo devem possuir confirmação ou feedback claro quando necessário.

Exemplo:

```text
"Usar carta do João por £1?"

[Cancelar] [Confirmar]
```

Entretanto, ações frequentes não devem exigir confirmação excessiva.

---

# 10. Navegação

A navegação principal deve ser simples.

A aplicação deve evitar menus profundos.

Estrutura sugerida:

```text
Home
├── Nova partida
├── Continuar partida
├── Entrar em partida
└── Configurações
```

Durante o jogo:

```text
Game Screen
├── Estado da corrida
├── Ações
├── Apostas
├── Informações do jogador
└── Menu
```

---

# 11. Tela principal do jogo

A tela principal mobile deve priorizar:

1. pista;
2. camelos;
3. jogador atual;
4. ações disponíveis;
5. informações essenciais.

Elementos secundários podem ficar em:

* bottom sheets;
* modais;
* drawers;
* telas auxiliares.

---

# 12. Layout recomendado

Uma estrutura possível:

```text
┌──────────────────────┐
│  £12     Rodada 3    │
├──────────────────────┤
│                      │
│      CORRIDA         │
│                      │
│ 🐪 🐪                │
│    🐪                 │
│          🐪           │
│             🐪       │
│                      │
├──────────────────────┤
│ Sua vez: Felipe      │
├──────────────────────┤
│ [ Revelar carta ]    │
│ [ Colocar Fennec ]   │
│ [ Colocar Atalho ]   │
├──────────────────────┤
│ Apostas      Menu    │
└──────────────────────┘
```

O layout exato deverá ser definido durante a implementação.

---

# 13. Pista no mobile

A pista é um dos elementos mais importantes da interface.

Ela deve permanecer visualmente compreensível mesmo em uma tela pequena.

A implementação não deve simplesmente reduzir a pista até que ela fique ilegível.

Alternativas possíveis:

### Opção A — pista horizontal com scroll

```text
←────────── TRACK ──────────→
```

### Opção B — pista vertical

```text
START
 ↓
🐪
 ↓
🐪
 ↓
🐪
 ↓
FINISH
```

### Opção C — pista adaptativa

A aplicação pode alterar a representação da pista dependendo da quantidade de espaços.

A decisão final deve ser tomada através de protótipo e testes de usabilidade.

---

# 14. Recomendação para a pista

Para smartphone, recomenda-se inicialmente uma **pista vertical ou semi-vertical**.

Isso permite:

* melhor utilização do espaço;
* leitura da classificação;
* interação por toque;
* visualização das pilhas;
* menor necessidade de zoom.

A pista não deve depender de zoom para ser jogável.

---

# 15. Camelos

Os camelos devem ser visualmente distinguíveis.

A identificação não deve depender exclusivamente de cor.

Isso é importante para acessibilidade.

Cada camelo deve possuir:

* cor;
* símbolo ou identificação;
* nome;
* posição.

Exemplo:

```text
🟡 Amarelo
🟢 Verde
🔵 Azul
🟣 Roxo
🔴 Vermelho
⚫ Crazy Camel
```

Os símbolos utilizados na UI poderão ser substituídos por assets próprios.

---

# 16. Pilhas

Uma pilha de camelos deve ser claramente identificável.

Exemplo:

```text
┌─────────┐
│ 🟡      │
│ 🔵      │
│ 🔴      │
└─────────┘
```

O usuário deve conseguir entender:

* quem está no topo;
* quem está na base;
* qual camelo será transportado;
* qual camelo está à frente.

---

# 17. Crazy Camel na interface

O Crazy Camel deve possuir uma representação visual claramente diferente dos camelos de corrida.

Além disso, sua direção deve ser visualmente evidente.

Exemplo:

```text
🐪 ←
```

enquanto os camelos normais:

```text
→ 🐪
```

Isso reduz a necessidade de o usuário lembrar que ele corre na direção oposta.

---

# 18. Movimento dos camelos

Quando um camelo se movimentar, a interface poderá apresentar uma pequena animação.

Exemplo:

```text
Antes:

🐪
   ↓

Movimento:

🐪 → → →

Depois:

        🐪
```

A animação deve ser curta.

Não deve impedir a continuidade da partida.

---

# 19. Animações

Animações devem ser:

* rápidas;
* funcionais;
* opcionais quando possível;
* adequadas para dispositivos móveis.

Evitar animações longas.

Uma partida deve continuar rápida mesmo em conexão ou hardware mais limitado.

---

# 20. Ações do jogador

As ações disponíveis devem aparecer em uma área fixa.

Exemplo:

```text
┌────────────────────────┐
│                        │
│      GAME BOARD        │
│                        │
├────────────────────────┤
│ SUA VEZ                │
│                        │
│ [ Revelar carta ]      │
│ [ Fennec ]             │
│ [ Atalho ]             │
│ [ Apostar ]             │
└────────────────────────┘
```

Ações indisponíveis devem:

* ficar desabilitadas; ou
* não aparecer.

---

# 21. Bottom Sheet

Bottom sheets devem ser utilizados para ações secundárias.

Exemplo:

```text
[ APOSTAR ]
     ↓

┌────────────────────────┐
│ Suas apostas            │
│                        │
│ 🟡 Amarelo   £5        │
│ 🔵 Azul      £3        │
│                        │
│ [Cancelar]             │
└────────────────────────┘
```

Isso permite manter a pista visível durante a maior parte da partida.

---

# 22. Informação contextual

O usuário não deve precisar memorizar todas as regras.

A interface pode oferecer explicações contextuais.

Exemplo:

```text
Crazy Camel

← Move na direção do início.

Se estiver carregando um camelo:
+1 movimento adicional.
```

Essas informações devem estar disponíveis através de:

* tooltip adaptado para touch;
* modal;
* botão de informação.

---

# 23. HUD

A interface deve apresentar um HUD simples.

Informações recomendadas:

```text
Dinheiro
Jogador atual
Número da perna
Camelo líder
Estado da corrida
```

Não sobrecarregar a tela com informações secundárias.

---

# 24. Apostas

A área de apostas deve ser acessível sem abandonar a visão da pista.

No mobile:

```text
[ APOSTAS ]
      ↓
Bottom Sheet
```

Em vez de navegar para uma tela completamente separada sempre que possível.

---

# 25. Carta pessoal

A carta pessoal do jogador deve possuir uma representação clara.

Exemplo:

```text
┌───────────────┐
│               │
│     🟡 +2     │
│               │
│ Sua carta     │
└───────────────┘
```

O jogador deve conseguir entender:

* qual camelo;
* qual movimento;
* se a carta é especial;
* se pode ser utilizada.

---

# 26. Cartas privadas

Em partidas online, cartas privadas nunca devem aparecer no estado público da interface.

Cada cliente deverá receber somente as informações autorizadas para aquele jogador.

---

# 27. Pass-and-play mobile

O pass-and-play deve ser especialmente otimizado para celular.

Fluxo:

```text
Player 1 termina turno
        ↓
Tela de transição
        ↓
"Passe o celular para João"
        ↓
João toca
        ↓
Informações privadas de João aparecem
        ↓
João joga
```

---

# 28. Tela de passagem

Exemplo:

```text
┌────────────────────────┐
│                        │
│       PASSE O CELULAR  │
│                        │
│       Para João        │
│                        │
│                        │
│    [ Continuar ]       │
│                        │
└────────────────────────┘
```

Essa tela deve esconder completamente o estado privado do jogador anterior.

---

# 29. Multiplayer online mobile

O multiplayer online deve funcionar sem exigir instalação de aplicativo.

O objetivo é:

```text
Abrir navegador
       ↓
Entrar na partida
       ↓
Jogar
```

A aplicação deve ser uma **Web App responsiva**.

---

# 30. PWA

A aplicação poderá futuramente ser transformada em **Progressive Web App**.

Isso permitiria:

* adicionar à tela inicial;
* ícone próprio;
* abertura em modo standalone;
* cache de assets;
* experiência semelhante a aplicativo.

PWA não é requisito obrigatório do primeiro MVP.

---

# 31. Uso em conexão móvel

A aplicação deve considerar redes móveis instáveis.

Deve minimizar:

* payloads grandes;
* downloads desnecessários;
* imagens pesadas;
* chamadas frequentes;
* sincronizações redundantes.

---

# 32. Estado offline

Para single-player e pass-and-play:

```text
Internet não é necessária
```

desde que todos os assets necessários já estejam disponíveis.

Para multiplayer online:

```text
Internet necessária
```

---

# 33. Multiplayer e perda de conexão

Caso o jogador perca a conexão:

```text
┌────────────────────────┐
│ ⚠ Conexão perdida      │
│                        │
│ Tentando reconectar... │
│                        │
│     [Tentar agora]     │
└────────────────────────┘
```

A partida não deve ser perdida.

---

# 34. Responsividade

A aplicação deve suportar:

```text
Mobile
↓
Tablet
↓
Desktop
```

Mas a ordem de prioridade é:

```text
1. Mobile
2. Tablet
3. Desktop
```

---

# 35. Breakpoints

Os breakpoints devem ser definidos a partir do conteúdo, não de dispositivos específicos.

Como referência inicial:

```text
Mobile:
< 640px

Tablet:
640px – 1024px

Desktop:
> 1024px
```

Esses valores poderão ser ajustados durante o desenvolvimento.

---

# 36. Desktop

No desktop, o espaço adicional poderá ser utilizado para:

* pista maior;
* painel de jogadores;
* apostas;
* histórico;
* informações auxiliares.

Porém, nenhuma regra adicional deverá existir exclusivamente no desktop.

---

# 37. Tablet

O tablet poderá utilizar uma experiência intermediária.

Por exemplo:

```text
┌──────────────────────────────────┐
│             TRACK                │
│                                  │
├──────────────────┬───────────────┤
│                  │ Player Panel  │
│                  │               │
│                  │ Actions       │
└──────────────────┴───────────────┘
```

---

# 38. Safe Areas

A interface mobile deve considerar dispositivos com:

* notch;
* câmera frontal;
* barra de navegação;
* Dynamic Island;
* áreas de gesto.

Elementos fixos devem respeitar `safe-area-inset`.

---

# 39. Scroll

A tela deve utilizar scroll vertical quando necessário.

Evitar:

* scroll horizontal inesperado;
* elementos parcialmente escondidos;
* áreas de toque fora da viewport.

A pista poderá possuir scroll próprio se isso melhorar a experiência.

---

# 40. Performance

A aplicação deve manter uma experiência fluida em smartphones intermediários.

Evitar:

* renderizações desnecessárias;
* animações pesadas;
* imagens enormes;
* bibliotecas excessivas;
* cálculos de domínio dentro da árvore de componentes.

---

# 41. Separação de domínio e UI

A UI nunca deverá determinar regras.

Não fazer:

```typescript
if (camel.position > finish) {
  // venceu
}
```

dentro de componentes.

Preferir:

```text
UI
 ↓
Command
 ↓
Domain
 ↓
GameState
 ↓
UI
```

---

# 42. Server Components e Client Components

Como o projeto utilizará Next.js, componentes que precisam de interação do jogador deverão ser Client Components.

Entretanto, a lógica do jogo não deve ficar dentro dos Client Components.

Conceitualmente:

```text
Next.js Server
      │
      ├── Pages
      ├── Layout
      └── Data fetching
              │
              ↓
        Game Application
              │
              ↓
        Game Domain
```

A UI interativa:

```text
GameBoard
GameControls
Camel
BetPanel
```

poderá utilizar Client Components.

---

# 43. Estado no cliente

O cliente deve manter somente o estado necessário para renderização e interação.

No modo online:

```text
Server State
    ↓
Client State
```

O cliente não deve ser considerado autoridade.

---

# 44. Otimização mobile

A aplicação deve priorizar:

* carregamento rápido;
* baixo consumo de dados;
* baixa utilização de memória;
* baixo consumo de bateria;
* poucos assets pesados;
* interação rápida.

---

# 45. Acessibilidade

A aplicação deve considerar acessibilidade desde o início.

Especialmente:

* contraste;
* tamanho de texto;
* tamanho de toque;
* navegação por teclado no desktop;
* leitores de tela;
* identificação dos camelos sem depender somente da cor;
* feedback visual e textual.

---

# 46. Cor não pode ser a única informação

Como existem cinco camelos de cores diferentes, a interface deve possuir outra forma de identificação.

Exemplo:

```text
🟡 A
🟢 V
🔵 Az
🟣 R
🔴 Ve
```

Os símbolos finais deverão ser definidos no design system.

---

# 47. Tema visual

O jogo deverá possuir uma identidade visual própria.

A implementação deve evitar depender exclusivamente de emojis para representar os componentes finais.

Emojis podem ser utilizados no protótipo.

Posteriormente:

```text
Emoji
 ↓
SVG / Canvas / Asset
```

---

# 48. Feedback de estado

O usuário deve sempre saber:

```text
De quem é a vez?
O que posso fazer?
O que aconteceu?
Por que não posso fazer determinada ação?
```

Exemplo:

```text
Sua vez!

Você pode:
✓ Revelar uma carta
✓ Apostar
✓ Colocar Fennec
✕ Colocar Shortcut
```

---

# 49. Feedback após ação

Após uma ação:

```text
Usuário toca
 ↓
Ação é processada
 ↓
Animação curta
 ↓
Estado atualizado
 ↓
Feedback
```

Exemplo:

```text
🐪 Azul avançou 2 espaços

+1 com Shortcut
```

---

# 50. Erros

Erros devem ser apresentados de maneira simples.

Evitar:

```text
Error: InvalidCommandException
```

Mostrar:

```text
Não é possível realizar essa ação agora.
```

Quando relevante, explicar o motivo.

---

# 51. Carregamento

Durante carregamentos curtos:

```text
[ ... ]
```

ou skeletons podem ser utilizados.

Não utilizar telas de loading completas para operações instantâneas.

---

# 52. Estado inicial

A primeira tela deve permitir iniciar rapidamente uma partida.

Exemplo:

```text
┌────────────────────────┐
│      CAMEL UP          │
│                        │
│   [ Nova partida ]     │
│                        │
│   [ Continuar ]        │
│                        │
│   [ Entrar em jogo ]   │
│                        │
└────────────────────────┘
```

---

# 53. Fluxo de criação de partida

O fluxo mobile deve ser curto:

```text
Nova partida
     ↓
Modo
     ↓
Jogadores
     ↓
Bots
     ↓
Iniciar
```

Evitar formulários longos.

---

# 54. Configuração de partida

Exemplo:

```text
Modo

○ Contra bots
○ Pass-and-play
○ Online
```

Depois:

```text
Jogadores

Você
+ Bot
+ Bot
+ Bot
```

O usuário deve conseguir iniciar a partida rapidamente.

---

# 55. Multiplayer online — UX

Fluxo recomendado:

```text
Online
 ↓
Criar partida
 ↓
Código da sala
 ↓
Compartilhar
 ↓
Jogadores entram
 ↓
Host inicia
 ↓
Partida
```

O compartilhamento poderá utilizar o recurso nativo do sistema operacional quando disponível.

---

# 56. Compartilhamento

Exemplo:

```text
Participe da minha partida de Camel Up!

Código:
ABC123

[ Compartilhar ]
```

O sistema poderá utilizar:

```text
Web Share API
```

quando suportada.

---

# 57. Instalação

Não exigir instalação de aplicativo nativo.

O produto deve funcionar inicialmente através do navegador.

Opcionalmente:

```text
Browser
 ↓
Adicionar à tela inicial
 ↓
PWA
```

---

# 58. Custo de infraestrutura

A estratégia deve priorizar baixo custo.

### MVP local

```text
Custo de infraestrutura:
≈ zero
```

A aplicação pode ser executada localmente.

### Multiplayer

Adicionar posteriormente:

```text
Frontend
+
Game Server
+
Database
```

O servidor pode ser dimensionado de acordo com a utilização.

---

# 59. Player-hosted

A possibilidade de um jogador hospedar a partida não deve ser implementada inicialmente.

A arquitetura deve, porém, evitar dependências que tornem isso impossível no futuro.

Se essa modalidade for implementada posteriormente, deverá ser tratada como um transporte alternativo:

```text
Domain
  ↑
Application
  ↑
Transport
  ├── Local
  ├── Server
  └── Player Hosted
```

---

# 60. Arquitetura final desejada

A arquitetura de longo prazo deve ser semelhante a:

```text
                         GAME DOMAIN
                              │
                    ┌─────────┴─────────┐
                    │                   │
               APPLICATION          BOT ENGINE
                    │
          ┌─────────┼─────────┐
          │         │         │
        Local     Server     Hosted
          │         │         │
          └─────────┼─────────┘
                    │
                  Next.js
                    │
             ┌──────┴──────┐
             │             │
          Mobile         Desktop
```

---

# 61. Requisitos funcionais adicionais

## RF-M01 — Mobile First

A aplicação deve ser completamente utilizável em smartphone.

## RF-M02 — Touch

Todas as ações essenciais devem ser executáveis por toque.

## RF-M03 — Portrait

O jogo deve funcionar em orientação vertical.

## RF-M04 — Pass-and-play

O sistema deve suportar múltiplos jogadores no mesmo dispositivo.

## RF-M05 — Privacidade

Informações privadas devem ser ocultadas durante a troca de jogador.

## RF-M06 — Responsive

A aplicação deve adaptar-se a tablet e desktop.

## RF-M07 — Offline local

Single-player e pass-and-play devem funcionar sem servidor.

## RF-M08 — Online

A aplicação deverá suportar multiplayer online em evolução futura.

## RF-M09 — Reconexão

Partidas online devem suportar reconexão.

## RF-M10 — PWA

A aplicação poderá ser instalada como PWA futuramente.

---

# 62. Critérios de aceitação mobile

A implementação será considerada adequada quando:

* [ ] uma partida completa puder ser jogada em smartphone;
* [ ] nenhuma ação essencial exigir hover;
* [ ] nenhuma ação essencial exigir teclado;
* [ ] os botões possuírem área adequada para toque;
* [ ] a pista for compreensível em tela pequena;
* [ ] os camelos forem distinguíveis sem depender exclusivamente de cor;
* [ ] o Crazy Camel for facilmente identificável;
* [ ] o jogador sempre souber de quem é a vez;
* [ ] informações privadas forem protegidas no pass-and-play;
* [ ] uma partida contra bots puder ser concluída no celular;
* [ ] uma partida pass-and-play puder ser concluída no celular;
* [ ] a interface funcionar em Portrait;
* [ ] a interface funcionar em telas a partir de aproximadamente 320px de largura;
* [ ] a aplicação não depender de conexão para partidas locais;
* [ ] a experiência permanecer utilizável em redes móveis instáveis no modo online.

---

# 63. Critério principal de produto

O teste mais importante da experiência será:

> **Um jogador deve conseguir abrir o site pelo celular, iniciar uma partida contra bots e jogar uma partida completa sem precisar de computador, mouse, teclado ou configuração técnica.**

Posteriormente:

> **Um grupo de jogadores deve conseguir compartilhar um código, entrar pelo navegador de seus celulares e jogar a mesma partida online.**

---

# 64. Decisão arquitetural

A aplicação será desenvolvida como:

```text
Next.js
+
Mobile First
+
Touch First
+
Domain Driven
+
TDD
+
BDD
+
Local-first para MVP
+
Server-authoritative para multiplayer futuro
```

A experiência principal será:

```text
Smartphone
    ↓
Browser
    ↓
Camel Up
    ↓
Jogar
```

Não será necessário instalar um aplicativo nativo para utilizar o produto.

---

# 65. Roadmap atualizado

## Fase 1 — Domínio

```text
Camel Up Rules
↓
Domain Model
↓
BDD
↓
TDD
```

## Fase 2 — MVP Mobile

```text
Next.js
↓
Mobile UI
↓
Single Player
↓
Bots
↓
Pass-and-play
```

## Fase 3 — Persistência local

```text
Save Game
↓
Continue Game
↓
Offline
```

## Fase 4 — Multiplayer

```text
Game Server
↓
Lobby
↓
Room Code
↓
WebSocket
↓
Server Authority
```

## Fase 5 — Experiência online

```text
Reconnect
↓
Persistent Games
↓
PWA
↓
Share Game
```

## Fase 6 — Evolução

```text
Accounts
↓
Matchmaking
↓
Ranking
↓
Replay
↓
Player-hosted (opcional)
```

---

# 66. Regra de ouro do projeto

A aplicação deve ser construída pensando primeiro em:

> **"Estou no meio da rua, tirei o celular do bolso e quero jogar Camel Up."**

Isso significa:

```text
Poucos cliques
+
Interface legível
+
Touch confortável
+
Carregamento rápido
+
Partida rápida
+
Sem instalação obrigatória
+
Sem configuração complexa
```

Essa experiência deve orientar as decisões de UX, arquitetura e priorização do projeto.
