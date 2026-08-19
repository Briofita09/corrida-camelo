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
| Estado do código | UI ainda no template `create-next-app`; domínio `domain/match/` (US-01, US-03) e `domain/match-config/` (US-02); aplicação `application/match-persistence/` (US-03); US-01–US-03 validadas |

**Propósito:** digitalizar *Camel Up: The Card Game* para jogar no celular pelo navegador — partidas locais (bots / pass-and-play) no MVP; multiplayer online em evolução futura.

Documento de produto/UX/arquitetura desejada: `docs/game/game-design.md`.

`CLAUDE.md` apenas referencia este `AGENTS.md`.

---

## Objetivos e não-objetivos

### Objetivos (produto + repositório)

- Experiência **Mobile First** e **Touch First** (prioridade: mobile → tablet → desktop).
- MVP **local-first**: single-player com bots e pass-and-play **sem servidor**.
- Separar **domínio do jogo** da UI e da I/O.
- Domínio de **partida** (`domain/match`) e de **configuração de nova partida** (`domain/match-config`).
- Persistência de **partida criada** via `localStorage` (`application/match-persistence`), sem I/O no domínio.
- Evoluir para multiplayer online **server-authoritative** sem app nativo.
- Guidelines em `docs/guidelines/` e skills SDD em `.cursor/skills/`.

### Critério principal de produto (MVP)

> Abrir o site no celular, iniciar partida contra bots e concluir uma partida completa sem computador, mouse, teclado ou configuração técnica.

### Não-objetivos / ainda não evidenciados no código

- UI de jogo (ainda template Next.js); wiring UI → domínio/aplicação ainda não feito.
- Regras de movimento, apostas, baralho, fennec/atalho, IA de bots.
- Backend, game server, WebSocket, banco ou ORM.
- Autenticação / contas / ranking / matchmaking.
- Player-hosted como transporte inicial (adiado).
- PWA obrigatória no primeiro MVP.
- CI/CD neste diretório do projeto.
- Persistência de **rascunho** de configuração (`MatchConfig`); abandono continua sem gravar rascunho.
- Variáveis de ambiente documentadas (`.env*` no `.gitignore`; sem `.env.example`).

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
  application/match-persistence/   # save/load de MatchState (US-03)

Domínio (puro TypeScript, sem React/Next/localStorage)
  domain/match/                    # partida + ordem/rodada (US-01, US-03)
  domain/match-config/             # rascunho de configuração → createMatch (US-02)
```

| Módulo | API pública | Papel |
| --- | --- | --- |
| `@/domain/match` | `createMatch`, `startMatch`, `validateMatchState`, serialize/deserialize, `getRoundPlayerSequence`, `advancePlayerRound`, `createRandomOrdering` / `identityOrdering` | Estado da partida, sorteio da ordem, sequência por rodada |
| `@/domain/match-config` | `createMatchConfig`, `setMatchMode`, participantes, `validateMatchConfig`, `createMatchFromConfig`, `discardMatchConfig` | Configuração pré-partida |
| `@/application/match-persistence` | `createMatchPersistence`, `persistCreatedMatch`, `createLocalStorageAdapter`, `createInMemoryStorage` | Persistir/restaurar partida; marcar partida ativa |

Comandos de domínio (e persistência) retornam `DomainResult` (`ok` / `erro`). Estado tratado como dados imutáveis nos comandos (novos objetos no sucesso).

`match-config` depende de `match` apenas para gerar a partida (`createMatch`) e reutilizar limites / `BotDifficulty` / `result`. `createMatchFromConfig` pode receber `CreateMatchOptions` e **não** sorteia de novo por conta própria.

`match-persistence` serializa com `serializeMatchState` / `deserializeMatchState`. **Load não chama `createMatch`** e não resorteia. Criar e persistir são dois passos (`createMatch` / `createMatchFromConfig` e depois `persistCreatedMatch`).

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

### Domínio de partida (US-01 + US-03)

| Conceito | Situação no código |
| --- | --- |
| Jogadores | 2–6; ≥1 humano; bots com `Easy` \| `Medium` \| `Hard` |
| Camelos | 6 (`Yellow`…`Red` + `Crazy`); posição = espaço + `stackOrder` |
| Fases | `Created` … `Finished` |
| Dinheiro | £ por jogador; criação com 3; válido ≥ 1 |
| Início | `Created` → `RaceSetup` via `startMatch` (não reordena `players`) |
| Encerrada | Mutações rejeitadas em `Finished` |
| Serialização | JSON round-trip; `playerRoundIndex` ausente hidrata como `0` |
| Ordem base | Array `players` após o sorteio; imutável nesta US |
| Sorteio | Default `createRandomOrdering` (Fisher–Yates, RNG injetável); `identityOrdering` para testes |
| Rodada | `getRoundPlayerSequence(players, r)` começa em `P[r mod n]`; `advancePlayerRound` incrementa `playerRoundIndex` |

### Domínio de configuração (US-02)

| Conceito | Situação no código |
| --- | --- |
| Modos | `SinglePlayerVsBots` \| `PassAndPlay` (Online fora de escopo) |
| Fluxo | Modo **antes** dos jogadores; redefinir modo limpa participantes |
| Single-player | Exatamente 1 humano + ≥1 bot; total 2–6 |
| Pass-and-play | ≥2 humanos; bots opcionais; total 2–6 |
| Nomes | Sem vazio; sem duplicata (trim + case-insensitive) |
| Geração | `createMatchFromConfig` → partida `Created` (sorteio ocorre em `createMatch`) |
| Abandono | `discardMatchConfig`; sem persistência de rascunho |
| Dificuldade | Definida na config; preservada na partida; sem API de alteração pós-generate |

### Persistência de partida (US-03)

| Conceito | Situação no código |
| --- | --- |
| Porta | `KeyValueStorage` (`getItem` / `setItem` / `removeItem`) |
| Produção | `createLocalStorageAdapter` sobre `localStorage` |
| Testes | `createInMemoryStorage` + mock de `Storage` |
| Chaves | Prefixo `camel-up-card-game:`; partida `…match:{id}`; ativa `…active-match-id` |
| Operações | `saveMatch`, `loadMatch`, `setActiveMatchId`, `getActiveMatchId`, `getActiveMatch` |
| Orquestração | `persistCreatedMatch` grava e marca a partida como ativa |
| Reload | Restaura estado serializado; **proibido** novo sorteio no load |

Detalhes: `docs/spec/us-01-dominio-estado-partida/`, `docs/spec/us-02-configuracao-nova-partida/` e `docs/spec/us-03-ordem-inicial-jogadores/` (+ plan/tasks/implementation/validation).

### Roadmap (alto nível)

| Fase | Foco | Situação |
| --- | --- | --- |
| 1 | Domínio + regras + BDD/TDD | US-01, US-02 e US-03 validadas; regras de movimento/apostas/baralho ainda pendentes |
| 2 | MVP mobile UI + bots + pass-and-play | Não iniciado (UI) |
| 3 | Persistência local | Partida em `localStorage` (US-03) presente; rascunho de config e wiring UI ainda não |
| 4–6 | Multiplayer, PWA, contas, etc. | Não iniciado |

---

## Estrutura do projeto

```text
camel-up-card-game/
├── app/                         # Next.js App Router (template UI)
├── application/
│   └── match-persistence/       # Persistência de partida (US-03)
├── domain/
│   ├── match/                   # Domínio da partida (US-01, US-03)
│   └── match-config/            # Configuração de nova partida (US-02)
├── public/
├── docs/
│   ├── game/game-design.md
│   ├── guidelines/              # 01–08
│   ├── spec/
│   │   ├── us-01-dominio-estado-partida/
│   │   ├── us-02-configuracao-nova-partida/
│   │   └── us-03-ordem-inicial-jogadores/
│   ├── plan/…                   # us-01, us-02, us-03
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
- Sorteio só na **criação** da partida; restaurar do storage **não** reordena.

### TypeScript / Next

- `strict: true`.
- Server Components por padrão; `"use client"` só com justificativa.
- Path alias `@/*`.

### Fluxo SDD (alto nível)

Skills: specification → plan → tasks → implementation → validation. Detalhe do processo **não** vive neste arquivo. Artefatos em `docs/{spec,plan,tasks,implementation,validation}/<feature>/`.

`game-design.md` = produto/UX/arquitetura desejada; `spec.md` = fatia implementável.

---

## Estratégia de testes

| Aspecto | Situação |
| --- | --- |
| Runner | Vitest 3.2.4 (`vitest.config.ts`, env `node`) |
| Scripts | `npm test` (`vitest run`), `npm run test:watch` |
| Domínio + aplicação | `domain/match/*.test.ts`, `domain/match-config/*.test.ts`, `application/match-persistence/*.test.ts` (suíte validada: **69** testes, 13 arquivos) |
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
4. Antes de features de produto: `docs/game/game-design.md`, guidelines e fluxo SDD quando aplicável.
5. Mobile First / Touch First; desktop é adaptação.
6. MVP local-first: não exigir servidor para bots/pass-and-play.
7. Preferir Server Components; `"use client"` só com motivo concreto.
8. Rodar `npm test` (e lint/build quando relevante) ao alterar domínio ou aplicação.
9. Não adicionar auth, banco, WebSocket, persistência de rascunho de config ou CI sem spec/plan.
10. Não criar artefatos SDD a partir desta skill — use as skills correspondentes.
11. Idioma de artefatos de processo: **pt-BR**; identificadores técnicos conforme o código.
12. Não sortear de novo ao carregar partida persistida; não persistir rascunho de `MatchConfig`.
