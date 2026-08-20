# AGENTS.md — camel-up-card-game

Contexto estável do repositório para agentes de código. A fonte de verdade é o próprio repositório.

---

## Identidade do projeto

| Campo | Valor |
| --- | --- |
| Nome | `camel-up-card-game` |
| Produto | Camel Up: The Card Game |
| Tipo | Aplicação web front-end (Next.js App Router), Mobile First |
| Experiência principal | Smartphone, portrait, touch, navegador (sem instalação nativa obrigatória) |
| Linguagens | TypeScript, CSS |
| Runtime | Node.js (via Next.js) |
| Gerenciador de pacotes | npm (`package-lock.json` presente) |
| Estado do código | UI ainda no template `create-next-app`; domínio `domain/match/` (US-01, US-03, US-04, US-05, US-06) e `domain/match-config/` (US-02); aplicação `application/match-persistence/` (US-03, US-04, US-05, US-06); US-01–US-06 implementadas |

**Propósito:** digitalizar *Camel Up: The Card Game* para jogar no celular pelo navegador — partidas locais (bots / pass-and-play) no MVP; multiplayer online em evolução futura.

`CLAUDE.md` apenas referencia este `AGENTS.md`.

---

## Fontes de verdade (documentação)

Não misturar estes papéis:

| Documento | Papel |
| --- | --- |
| `docs/rules/corrida_camelo_regras.md` | Regras oficiais do jogo de mesa (mecânica: componentes, preparação, movimento, etapa, apostas, fim de jogo). Fonte de verdade das **regras do jogo original**. |
| `docs/game/game-design.md` | Produto, UX Mobile First e arquitetura **desejada** da aplicação. |
| `docs/spec/<feature>/spec.md` (+ plan/tasks/implementation/validation) | Fatia implementável e o que já foi acordado para o código. |
| Código em `domain/`, `application/`, `app/` | O que existe de fato. |

Ao implementar mecânica de mesa, consultar primeiro as regras oficiais e a spec da fatia. Adaptações digitais (bots, persistência, modelo de turno já no código, piso de £) vivem na spec/código — **não** “corrigir” o domínio só porque o manual físico diz outra coisa, sem spec.

`game-design.md` não substitui o manual; o manual não substitui UX, stack nem o que já está implementado.

---

## Objetivos e não-objetivos

### Objetivos (produto + repositório)

- Experiência **Mobile First** e **Touch First** (prioridade: mobile → tablet → desktop).
- MVP **local-first**: single-player com bots e pass-and-play **sem servidor**.
- Separar **domínio do jogo** da UI e da I/O.
- Domínio de **partida** (`domain/match`) e de **configuração de nova partida** (`domain/match-config`).
- Persistência de **partida** (criada, iniciada ou após ação de turno aceita) via `localStorage` (`application/match-persistence`), sem I/O no domínio.
- Evoluir para multiplayer online **server-authoritative** sem app nativo.
- Guidelines em `docs/guidelines/` e skills SDD em `.cursor/skills/`.

### Critério principal de produto (MVP)

> Abrir o site no celular, iniciar partida contra bots e concluir uma partida completa sem computador, mouse, teclado ou configuração técnica.

### Não-objetivos / ainda não evidenciados no código

- UI de jogo (ainda template Next.js); wiring UI → domínio/aplicação ainda não feito.
- Regras de mesa do manual ainda não no domínio: apostas, baralho da etapa, feneco/atalho, tempestade de areia, preparação/pagamento de etapa, fim de corrida, IA de bots. Posições iniciais dos camelos de corrida (US-06) já estão no início da partida.
- Comando público de pular turno / avançar rodada sem ação válida (`advancePlayerRound` foi removido).
- Backend, game server, WebSocket, banco ou ORM.
- Autenticação / contas / ranking / matchmaking.
- Player-hosted como transporte inicial (adiado).
- PWA obrigatória no primeiro MVP.
- CI/CD neste diretório do projeto.
- Persistência de **rascunho** de configuração (`MatchConfig`); abandono continua sem gravar rascunho.
- Variáveis de ambiente documentadas (`.env*` no `.gitignore`; sem `.env.example`).

---

## Regras oficiais do jogo (referência)

Fonte: `docs/rules/corrida_camelo_regras.md` (versão 1.0, editora Galápagos). Resumo estável para agentes — **não** substitui o manual.

### Objetivo e fim de jogo

Cinco camelos de corrida disputam várias **etapas**. Jogadores apostam nas posições para ganhar Libras Egípcias. A corrida acaba quando a primeira **unidade de camelo** cruza a linha de chegada (carta de chegada). Nenhuma ação de aposta é permitida nesse momento; há pagamento da etapa e depois das apostas finais. Vence quem tiver mais dinheiro; empate é vitória partilhada.

O **camelo doido** está desclassificado: não pode vencer a corrida e é ignorado na classificação.

### Elenco e componentes relevantes

- **2–6 jogadores** (carta de preparação da etapa conforme o número de jogadores).
- **5 camelos de corrida** (cores) + **1 camelo doido** (corre na direção oposta).
- Cartas de corrida (30: cinco “1” e uma “2” por cor) + 5 cartas de camelo doido (duas “0”, duas “1”, uma “2”).
- Pista: cartas de pista + carta de chegada; verso das cartas de pista = tempestade de areia.
- Apostas de etapa (vencedor 5/3/2 e intermediária) e apostas finais (vencedor / perdedor).
- Feneco e atalho (ficha + marcador + carta).
- Cada jogador começa com **3 Libras**, 1 ficha de feneco e 1 ficha de atalho.

### Movimento (manual)

- Camelos na mesma casa formam **pilha** (exceto atrás da linha de partida). Quem se move carrega os que estão **em cima**; os de baixo ficam.
- Unidade (um camelo ou pilha) que termina em outra unidade **sobe** nela.
- Camelo doido usa a mesma pilha; pode carregar camelos de corrida rumo à partida. Não passa da linha de partida. Carta “0” não move, salvo a exceção abaixo.
- Exceção: unidade nas costas do camelo doido → **+1** ao movimento da carta do camelo doido (inclusive “0” → 1 casa).
- Mais alto na pilha = mais à frente na classificação.

### Turno e etapa (manual)

O jogador com o marcador de jogador inicial começa a etapa; depois, sentido horário.

Em cada turno o jogador:

- **deve** fazer exatamente **uma** ação de pista;
- **pode** fazer exatamente **uma** ação de aposta (antes ou depois da ação de pista).

Ações de pista: posicionar feneco ou atalho; revelar o topo do baralho de corrida; ou jogar a carta à sua frente (ou a de um oponente, pagando 1 Libra).

A etapa termina quando alguém revela a **última** carta do baralho de corrida (move, passa o marcador inicial à esquerda, sem aposta depois se ainda não a fez). Segue pagamento da etapa e nova preparação de etapa.

### Mapeamento de vocabulário

| Manual (`docs/rules`) | Código / produto |
| --- | --- |
| Camelo doido | `Crazy` (`TowardStart`) |
| Camelos de corrida (amarelo, verde, azul, roxo, vermelho) | `Yellow`, `Green`, `Blue`, `Purple`, `Red` (`TowardFinish`) |
| Etapa | `currentLeg` / fases `LegSetup`, `LegInProgress`, `LegPayout` |
| Libras Egípcias | `money` |
| Feneco / atalho | ainda não no domínio (UX em `game-design.md`) |
| Marcador de jogador inicial | aproximado por ordem `players` + `playerRoundIndex` (modelo digital US-03/US-05, não o marcador físico) |

### Lacunas conhecidas (manual × código)

O domínio **não** implementa ainda o manual. Diferenças estáveis a não “consertar” sem spec:

| Tema | Manual | Código atual |
| --- | --- | --- |
| Posição inicial | 5 cartas reveladas para os camelos de corrida; camelo doido na casa 7 | Camelos de corrida posicionados no `startMatch` (30 cartas, revela 5, pilha); `Crazy` permanece no espaço 0 |
| Cartas da preparação | As 5 cartas da largada saem do pool (adaptação US-06) | `setupRevealedRacingCards` (5) + `remainingRacingCards` (25); baralho da etapa ainda não montado |
| Dinheiro após pagamentos | Nunca abaixo de **0** | `MIN_MONEY = 1` (US-01) |
| Turno | Horário + ação de pista obrigatória + aposta opcional; etapa acaba no último card do baralho | Stub `performTurnAction`: só autorização + avanço pela sequência US-03 |
| Fichas feneco/atalho, baralho, apostas, tempestade, extensão de pista | Regras §§6–11 | Ausentes |

---

## Stack tecnológica

| Área | Tecnologia | Versão / evidência |
| --- | --- | --- |
| Framework | Next.js (App Router) | `16.3.1` — `package.json` |
| UI | React / React DOM | `19.2.8` |
| Linguagem | TypeScript | `^5` — `tsconfig.json` (`strict: true`) |
| Estilo | Tailwind CSS + `@tailwindcss/postcss` | `^4` |
| Fontes | `next/font` (Geist / Geist Mono) | `app/layout.tsx` |
| Lint | ESLint flat config | `eslint.config.mjs`, `eslint-config-next@16.3.1` |
| Testes | Vitest | `^3.2.4` — `vitest.config.ts`, scripts `test` / `test:watch` |
| Alias de import | `@/*` → raiz do projeto | `tsconfig.json` + alias no Vitest |
| Persistência local | Web Storage (`localStorage`) via porta `KeyValueStorage` | `application/match-persistence/` |

Não há Prettier, Jest, Playwright, Cypress, Storybook, banco, ORM nem SDKs de cloud no manifesto atual.

**Nota de ambiente:** Vitest 4 exige Node ≥20.19; o projeto fixou Vitest 3.2.4 para compatibilidade com Node mais antigo.

---

## Arquitetura

### Código atual

```text
Browser
  → app/layout.tsx / app/page.tsx (template UI)
  → (ainda sem wiring para domínio ou persistência)

Aplicação (I/O; sem React/Next)
  application/match-persistence/   # save/load; persistCreatedMatch; startAndPersistMatch; performTurnActionAndPersist

Domínio (puro TypeScript, sem React/Next/localStorage)
  domain/match/                    # partida, ordem/rodada, início, turno (US-01, US-03, US-04, US-05)
  domain/match-config/             # rascunho de configuração → createMatch (US-02)
```

| Módulo | API pública | Papel |
| --- | --- | --- |
| `@/domain/match` | `createMatch`, `startMatch`, `performTurnAction`, `validateMatchState`, serialize/deserialize, `getRoundPlayerSequence`, `createRandomOrdering` / `identityOrdering`, `identityRacingCardOrdering` / `createOfficialRacingDeck` | Estado da partida, sorteio da ordem, sequência por rodada, início (inclui posições iniciais US-06), autorização e avanço de turno |
| `@/domain/match-config` | `createMatchConfig`, `setMatchMode`, participantes, `validateMatchConfig`, `createMatchFromConfig`, `discardMatchConfig` | Configuração pré-partida |
| `@/application/match-persistence` | `createMatchPersistence`, `persistCreatedMatch`, `startAndPersistMatch`, `performTurnActionAndPersist`, `createLocalStorageAdapter`, `createInMemoryStorage` | Persistir/restaurar partida; marcar partida ativa; iniciar e persistir; persistir após ação de turno aceita |

Comandos de domínio (e persistência) retornam `DomainResult` (`ok` / `erro`). Estado tratado como dados imutáveis nos comandos (novos objetos no sucesso).

`match-config` depende de `match` apenas para gerar a partida (`createMatch`) e reutilizar limites / `BotDifficulty` / `result`. `createMatchFromConfig` pode receber `CreateMatchOptions`, **não** sorteia de novo por conta própria e **não** inicia a partida.

`match-persistence` serializa com `serializeMatchState` / `deserializeMatchState`. **Load não chama `createMatch`, `startMatch` nem `performTurnAction`**, não resorteia, não re-inicia e não reexecuta ação de turno. Passos separados:

```text
config válida → createMatch / createMatchFromConfig → persistCreatedMatch
Created válida → startMatch / startAndPersistMatch → RaceSetup persistido
RaceSetup / LegInProgress → performTurnAction / performTurnActionAndPersist → novo ativo persistido
```

`startAndPersistMatch` e `performTurnActionAndPersist` só gravam se o comando de domínio for aceito. `persistCreatedMatch` grava o estado e marca a partida ativa (reutilizado após criação, início e ação de turno).

Helpers internos de turno (`assertPlayerMayPerformTurnAction`, `applyNextTurn`) **não** fazem parte do barrel público de `@/domain/match`. Não existe comando público `advancePlayerRound`.

### Arquitetura desejada (produto)

Fonte: `docs/game/game-design.md` §§41–43, 59–60, 64.

```text
GAME DOMAIN          ← domain/match + domain/match-config
     │
APPLICATION ←→ BOT ENGINE
     │         (application/match-persistence já existe; BOT ENGINE ainda não)
Transport: Local | Server | Hosted (futuro)
     │
  Next.js (Mobile / Desktop)
```

Fluxo de comando:

```text
UI → Command → Domain → GameState → UI
```

| Princípio | Implicação |
| --- | --- |
| Domain-driven | UI não decide regras; domínio é autoridade |
| Local-first (MVP) | Partidas locais no cliente |
| Server-authoritative (online futuro) | Cliente não é autoridade |
| Client Components | Só para interação; lógica fora da árvore de UI |
| Transports plugáveis | Não acoplar de forma que impeça Local / Server / Hosted |
| I/O fora do domínio | `localStorage` / `window` só em `application/` (ou UI), nunca em `domain/**` |

### Domínio de partida (US-01 + US-03 + US-04)

| Conceito | Situação no código |
| --- | --- |
| Jogadores | 2–6; ≥1 humano; bots com `Easy` \| `Medium` \| `Hard` |
| Camelos | 6 (`Yellow`…`Red` + `Crazy`); posição = espaço + `stackOrder` |
| Fases | `Created` … `Finished` (sem fase `in_progress`; “em andamento” de produto = pós-`Created`) |
| Dinheiro | £ por jogador; criação com 3; válido ≥ 1 |
| Início | `Created` válida → `RaceSetup` via `startMatch`; `currentTurnPlayerId` = `players[0].id`; não reordena; não avança rodada nem turno; **posiciona camelos de corrida** (embaralha 30, revela 5; RNG injetável) |
| Turno × fase | `Created`: turno nulo; `RaceSetup` / `LegInProgress`: turno de jogador existente |
| Encerrada | Mutações rejeitadas em `Finished` |
| Serialização | JSON round-trip; `playerRoundIndex` ausente hidrata como `0`; `RaceSetup` sem turno ou sem cartas de preparação é rejeitado |
| Cartas de corrida (US-06) | `Created`: campos nulos, camelos no espaço 0. Após início: `setupRevealedRacingCards` (5, ordem) + `remainingRacingCards` (25). `Crazy` permanece no 0. Helpers de movimento internos, não exportados. |
| Ordem base | Array `players` após o sorteio |
| Sorteio | Default `createRandomOrdering` (Fisher–Yates, RNG injetável); `identityOrdering` para testes; só na **criação** |
| Rodada | `getRoundPlayerSequence(players, r)` começa em `P[r mod n]` e percorre todos uma vez |

### Gerenciamento de turnos (US-05)

| Conceito | Situação no código |
| --- | --- |
| Jogador ativo | `currentTurnPlayerId` de um jogador existente (após `startMatch`) |
| Ação de turno | Stub `performTurnAction(state, actorPlayerId)`; ator explícito |
| Autorização | Só o jogador ativo; fases que admitem: `RaceSetup` e `LegInProgress` |
| Avanço | Somente efeito de ação **aceita**; meio da sequência → próximo da `S`; último da `S` → incrementa `playerRoundIndex` e o primeiro da nova sequência |
| Stub | Não altera fase, camelos (preserva posições e pool US-06), £, elenco nem ordem `players`; não encerra a partida |
| Rejeições | `Finished` → `MATCH_FINISHED`; `Created` e demais fases → `INVALID_PHASE`; fora do turno → `NOT_CURRENT_PLAYER` |
| Sem skip | Não há comando público que só avance turno/rodada; fora do turno **não** avança |
| N=2 | Turno consecutivo do mesmo jogador no wrap é esperado (não é bug) |
| Helpers | `assertPlayerMayPerformTurnAction` e `applyNextTurn` internos, não exportados |
| Persistência | `performTurnActionAndPersist`; load restaura o ativo sem reexecutar a ação |

### Domínio de configuração (US-02)

| Conceito | Situação no código |
| --- | --- |
| Modos | `SinglePlayerVsBots` \| `PassAndPlay` (Online fora de escopo) |
| Fluxo | Modo **antes** dos jogadores; redefinir modo limpa participantes |
| Single-player | Exatamente 1 humano + ≥1 bot; total 2–6 |
| Pass-and-play | ≥2 humanos; bots opcionais; total 2–6 |
| Nomes | Sem vazio; sem duplicata (trim + case-insensitive) |
| Geração | `createMatchFromConfig` → partida `Created` (sorteio em `createMatch`; início é US-04) |
| Abandono | `discardMatchConfig`; sem persistência de rascunho |
| Dificuldade | Definida na config; preservada na partida; sem API de alteração pós-generate |
| Isolamento | Mutar rascunho de `MatchConfig` **não** altera partida já gerada/iniciada |

### Persistência de partida (US-03 + US-04 + US-05 + US-06)

| Conceito | Situação no código |
| --- | --- |
| Porta | `KeyValueStorage` (`getItem` / `setItem` / `removeItem`) |
| Produção | `createLocalStorageAdapter` sobre `localStorage` |
| Testes | `createInMemoryStorage` + mock de `Storage` |
| Chaves | Prefixo `camel-up-card-game:`; partida `…match:{id}`; ativa `…active-match-id` |
| Operações | `saveMatch`, `loadMatch`, `setActiveMatchId`, `getActiveMatchId`, `getActiveMatch` |
| Orquestração | `persistCreatedMatch` (grava + ativa); `startAndPersistMatch`; `performTurnActionAndPersist` |
| Reload | Restaura estado serializado; **proibido** novo sorteio, novo início, nova revelação de cartas ou reexecução da ação de turno |

Detalhes: `docs/spec/us-01-dominio-estado-partida/`, `docs/spec/us-02-configuracao-nova-partida/`, `docs/spec/us-03-ordem-inicial-jogadores/`, `docs/spec/us-04-fluxo-inicio-partida/`, `docs/spec/us-05-gerenciamento-de-turnos/` e `docs/spec/us-06-posicoes-iniciais-camelos/` (+ plan/tasks/implementation/validation).

### Roadmap (alto nível)

| Fase | Foco | Situação |
| --- | --- | --- |
| 1 | Domínio + regras + BDD/TDD | US-01–US-06 implementadas; mecânica de mesa do manual ainda pendente (apostas, etapa, casa 7 do Crazy, etc.) |
| 2 | MVP mobile UI + bots + pass-and-play | Não iniciado (UI) |
| 3 | Persistência local | Partida em `localStorage` presente (inclui ativo após turno); rascunho de config e wiring UI ainda não |
| 4–6 | Multiplayer, PWA, contas, etc. | Não iniciado |

---

## Estrutura do projeto

```text
camel-up-card-game/
├── app/                         # Next.js App Router (template UI)
├── application/
│   └── match-persistence/       # Persistência de partida (US-03, US-04, US-05, US-06)
├── domain/
│   ├── match/                   # Domínio da partida (US-01, US-03, US-04, US-05, US-06)
│   └── match-config/            # Configuração de nova partida (US-02)
├── public/
├── docs/
│   ├── rules/corrida_camelo_regras.md   # Regras oficiais do jogo original
│   ├── game/game-design.md              # Produto / UX / arquitetura desejada
│   ├── guidelines/                      # 01–08
│   ├── spec/
│   │   ├── us-01-dominio-estado-partida/
│   │   ├── us-02-configuracao-nova-partida/
│   │   ├── us-03-ordem-inicial-jogadores/
│   │   ├── us-04-fluxo-inicio-partida/
│   │   ├── us-05-gerenciamento-de-turnos/
│   │   └── us-06-posicoes-iniciais-camelos/
│   ├── plan/…                   # us-01 … us-06
│   ├── tasks/…
│   ├── implementation/…
│   └── validation/…
├── .cursor/skills/
├── vitest.config.ts
├── package.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

Organização futura de UI/features: por domínio, com colocation — `docs/guidelines/06-code-structure.md`.

---

## Convenções de desenvolvimento

### Produto / UX (estáveis)

| Tema | Regra |
| --- | --- |
| Dispositivo | Smartphone portrait; ~320×568; touch ≥ ~44×44 px |
| Interação | Sem hover/mouse/teclado/drag obrigatório para ações essenciais |
| Breakpoints (referência) | Mobile `<640px`, tablet `640–1024px`, desktop `>1024px` |
| Privacidade | Pass-and-play e online: estado privado não vaza |
| Acessibilidade | Camelos não só por cor; contraste; teclado no desktop |
| Assets | Emoji no protótipo; produção com assets próprios |

### Front-end (guidelines)

Consultar `docs/guidelines/01`–`08`.

### Domínio e aplicação

- Código em `domain/**` **sem** imports de `react`, `next`, `localStorage` ou `window`.
- Código em `application/**` **sem** imports de `react` ou `next`; I/O de storage via porta injetável.
- Preferir `DomainResult` para rejeições explícitas.
- Testes unitários colocalizados (`*.test.ts`) com Vitest, ambiente `node`.
- Regras de **modo de partida** em `match-config`; regras/estado de **partida** em `match`; I/O de persistência em `application/match-persistence` — não misturar.
- Mecânica de mesa futura: implementar no domínio a partir de `docs/rules/` + spec da fatia; não colocar regras em componentes React.
- Sorteio só na **criação**; início só a partir de `Created` válida; restaurar do storage **não** reordena, não re-inicia, **não** revela de novo as cartas de largada e **não** reexecuta ação de turno.
- Não fundir generate e início num único comando de domínio (`startFromConfig` não existe).
- Avanço de turno/rodada só via `performTurnAction` aceito; não reintroduzir skip público.
- Ações de mesa futuras devem reutilizar autorização + avanço de turno; o stub atual não implementa regras de mesa.
- Helpers internos de turno e de movimento de preparação não entram no barrel público.

### TypeScript / Next

- `strict: true`.
- Server Components por padrão; `"use client"` só com justificativa.
- Path alias `@/*`.

### Fluxo SDD (alto nível)

Skills: specification → plan → tasks → implementation → validation. Detalhe do processo **não** vive neste arquivo. Artefatos em `docs/{spec,plan,tasks,implementation,validation}/<feature>/`.

Hierarquia ao escrever uma spec de mecânica: `docs/rules/corrida_camelo_regras.md` (jogo) → `docs/game/game-design.md` (produto/UX) → `spec.md` (fatia).

---

## Estratégia de testes

| Aspecto | Situação |
| --- | --- |
| Runner | Vitest 3.2.4 (`vitest.config.ts`, env `node`) |
| Scripts | `npm test` (`vitest run`), `npm run test:watch` |
| Domínio + aplicação | `domain/match/*.test.ts`, `domain/match-config/*.test.ts`, `application/match-persistence/*.test.ts` (suíte: **117** testes, 18 arquivos) |
| UI / E2E | Ainda não configurados |
| Diretriz | Guideline `08-testing.md`; domínio/aplicação com TDD |

---

## Segurança e configuração

- `.env*` no `.gitignore`; **nunca** copiar segredos para `AGENTS.md` ou commits.
- Nenhuma variável de ambiente em uso no código atual.
- Online futuro: cartas/estado privado nunca no estado público da UI.
- Metadata/`lang` ainda do template (`Create Next App`, `lang="en"`).
- Chaves de `localStorage` prefixadas com `camel-up-card-game:` (não são segredos).

---

## Infraestrutura e deploy

- MVP local: infra ≈ zero (cliente); persistência de partida no `localStorage` do navegador.
- Multiplayer futuro: frontend + game server + database (não implementado).
- README menciona Vercel; sem `vercel.json`, Dockerfile ou CI neste projeto.
- Sem instalação nativa obrigatória; PWA opcional depois.

---

## Comandos verificados

```bash
npm install          # instalar dependências
npm run dev          # next dev
npm run build        # next build
npm run start        # next start
npm run lint         # eslint
npm test             # vitest run
npm run test:watch   # vitest (watch)
```

---

## Instruções para agentes de código

1. Código + este arquivo + `docs/` são a fonte de verdade; não inventar stack ou serviços inexistentes.
2. Domínio em `domain/**`, fora de React e de I/O de browser; UI só renderiza e despacha comandos.
3. Configuração de nova partida → `domain/match-config`; estado/regras de partida → `domain/match`; persistência de partida → `application/match-persistence`.
4. Mecânica do jogo original: `docs/rules/corrida_camelo_regras.md`. Produto/UX: `docs/game/game-design.md`. Fatia: spec/plan. Não copiar o manual inteiro para o código.
5. Mobile First / Touch First; desktop é adaptação.
6. MVP local-first: não exigir servidor para bots/pass-and-play.
7. Preferir Server Components; `"use client"` só com motivo concreto.
8. Rodar `npm test` (e lint/build quando relevante) ao alterar domínio ou aplicação.
9. Não adicionar auth, banco, WebSocket, persistência de rascunho de config ou CI sem spec/plan.
10. Não criar artefatos SDD a partir desta skill — use as skills correspondentes.
11. Idioma de artefatos de processo: **pt-BR**; identificadores técnicos conforme o código.
12. Não sortear de novo, não re-iniciar, não revelar de novo as cartas de largada e não reexecutar ação de turno ao carregar partida persistida; não persistir rascunho de `MatchConfig`.
13. `startMatch` só a partir de `Created` válida; gerar e iniciar são passos separados.
14. `performTurnAction` só para o jogador ativo, com `actorPlayerId` explícito; não criar skip público; não exportar helpers internos de turno nem de movimento de preparação.
15. Com 2 jogadores, turno consecutivo no wrap da rodada é comportamento esperado.
16. Não alterar `MIN_MONEY` nem posicionar o camelo doido na casa 7 sem uma spec que peça essa mudança. Posições iniciais dos camelos de corrida seguem a US-06 (não reverter para “todos no espaço 0” após o início).
