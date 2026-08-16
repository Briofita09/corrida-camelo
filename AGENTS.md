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
| Estado do código | UI ainda no template `create-next-app`; domínio de partida iniciado em `domain/match/` (US-01 validada) |

**Propósito:** digitalizar *Camel Up: The Card Game* para jogar no celular pelo navegador — partidas locais (bots / pass-and-play) no MVP; multiplayer online em evolução futura.

Documento de produto/UX/arquitetura desejada: `docs/game/game-design.md`.

`CLAUDE.md` apenas referencia este `AGENTS.md`.

---

## Objetivos e não-objetivos

### Objetivos (produto + repositório)

- Experiência **Mobile First** e **Touch First** (prioridade: mobile → tablet → desktop).
- MVP **local-first**: single-player com bots e pass-and-play **sem servidor** / sem internet (assets já disponíveis).
- Separar **domínio do jogo** da UI (regras não vivem em componentes).
- Domínio de partida serializável (criação, início, validação, fases) já presente em `domain/match/`.
- Evoluir para multiplayer online **server-authoritative** sem exigir app nativo.
- Guidelines em `docs/guidelines/` e skills SDD em `.cursor/skills/`.

### Critério principal de produto (MVP)

> Abrir o site no celular, iniciar partida contra bots e concluir uma partida completa sem computador, mouse, teclado ou configuração técnica.

### Não-objetivos / ainda não evidenciados no código

- UI de jogo (ainda template Next.js).
- Regras de movimento, apostas, baralho, fennec/atalho, IA de bots.
- Backend, game server, WebSocket, banco ou ORM.
- Autenticação / contas / ranking / matchmaking.
- Player-hosted como transporte inicial (adiado; não impedir no futuro).
- PWA obrigatória no primeiro MVP.
- CI/CD neste diretório do projeto.
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

Não há Prettier, Jest, Playwright, Cypress, Storybook, banco, ORM nem SDKs de cloud no manifesto atual.

**Nota de ambiente:** Vitest 4 exige Node ≥20.19; o projeto fixou Vitest 3.2.4 para compatibilidade com Node mais antigo.

---

## Arquitetura

### Código atual

```text
Browser
  → app/layout.tsx / app/page.tsx (template UI)
  → (ainda sem wiring)

Domínio (puro TypeScript, sem React/Next)
  domain/match/
    createMatch | startMatch | validateMatchState
    serializeMatchState | deserializeMatchState
    tipos (MatchState, fases, jogadores, camelos)
```

API pública do domínio: `@/domain/match` (`index.ts`).

Comandos de domínio retornam `DomainResult` (`ok` / `erro`). Estado tratado como dados imutáveis nos comandos (novos objetos no sucesso).

### Arquitetura desejada (produto)

Fonte: `docs/game/game-design.md` §§41–43, 59–60, 64.

```text
GAME DOMAIN          ← domain/match/ (em construção)
     │
APPLICATION ←→ BOT ENGINE
     │
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

### Domínio de partida (evidência US-01)

| Conceito | Situação no código |
| --- | --- |
| Jogadores | 2–6; ≥1 humano; bots com `Easy` \| `Medium` \| `Hard` |
| Camelos | 6 (`Yellow`…`Red` + `Crazy`); posição = espaço + `stackOrder` |
| Fases | `Created`, `RaceSetup`, `LegSetup`, `LegInProgress`, `LegPayout`, `FinalPayout`, `Finished` |
| Dinheiro | £ por jogador; criação com 3; válido ≥ 1 |
| Início | `Created` → `RaceSetup` via `startMatch` |
| Encerrada | Mutações rejeitadas em `Finished` |
| Persistência futura | Estado JSON-serializável |

Detalhe de regras/aceitação: `docs/spec/us-01-dominio-estado-partida/` (e plan/tasks/implementation/validation).

### Roadmap (alto nível)

| Fase | Foco | Situação |
| --- | --- | --- |
| 1 | Domínio + regras + BDD/TDD | Estado da partida iniciado (US-01); regras de jogo ainda pendentes |
| 2 | MVP mobile UI + bots + pass-and-play | Não iniciado |
| 3 | Persistência local | Não iniciado |
| 4–6 | Multiplayer, PWA, contas, etc. | Não iniciado |

---

## Estrutura do projeto

```text
camel-up-card-game/
├── app/                         # Next.js App Router (template UI)
├── domain/
│   └── match/                   # Domínio da partida (+ *.test.ts colocalizados)
├── public/
├── docs/
│   ├── game/game-design.md
│   ├── guidelines/              # 01–08
│   ├── spec/us-01-dominio-estado-partida/
│   ├── plan/us-01-dominio-estado-partida/
│   ├── tasks/us-01-dominio-estado-partida/
│   ├── implementation/us-01-dominio-estado-partida/
│   └── validation/us-01-dominio-estado-partida/
├── .cursor/skills/              # SDD + create-architecture
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

Consultar `docs/guidelines/01`–`08` (componentes, RSC, estado, fetch, performance, estrutura, a11y, testes).

### Domínio

- Código em `domain/**` **sem** imports de `react` ou `next`.
- Preferir `DomainResult` para rejeições explícitas.
- Testes unitários colocalizados (`*.test.ts`) com Vitest, ambiente `node`.

### TypeScript / Next

- `strict: true`.
- Server Components por padrão; `"use client"` só com justificativa.
- Path alias `@/*`.

### Fluxo SDD (alto nível)

Skills: specification → plan → tasks → implementation → validation. Detalhe do processo **não** vive neste arquivo. Artefatos por feature em `docs/{spec,plan,tasks,implementation,validation}/<feature>/`.

`game-design.md` = produto/UX/arquitetura desejada; `spec.md` = fatia implementável.

---

## Estratégia de testes

| Aspecto | Situação |
| --- | --- |
| Runner | Vitest 3.2.4 (`vitest.config.ts`, env `node`) |
| Scripts | `npm test` (`vitest run`), `npm run test:watch` |
| Domínio | Testes em `domain/match/*.test.ts` (US-01 validada: 22 testes) |
| UI / E2E | Ainda não configurados |
| Diretriz | Guideline `08-testing.md`; domínio com TDD; UI quando existir |

---

## Segurança e configuração

- `.env*` no `.gitignore`; **nunca** copiar segredos para `AGENTS.md` ou commits.
- Nenhuma variável de ambiente em uso no código atual.
- Online futuro: cartas/estado privado nunca no estado público da UI.
- Metadata/`lang` ainda do template.

---

## Infraestrutura e deploy

- MVP local: infra ≈ zero (cliente).
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
2. Domínio de jogo em `domain/**`, fora de React; UI só renderiza e despacha comandos.
3. Estender `domain/match` (ou novos módulos de domínio) sem acoplar a Next; manter serialização/invariantes.
4. Antes de features de produto: `docs/game/game-design.md`, guidelines e fluxo SDD quando aplicável.
5. Mobile First / Touch First; desktop é adaptação.
6. MVP local-first: não exigir servidor para bots/pass-and-play.
7. Preferir Server Components; `"use client"` só com motivo concreto.
8. Rodar `npm test` (e lint/build quando relevante) ao alterar domínio.
9. Não adicionar auth, banco, WebSocket ou CI sem spec/plan.
10. Não criar artefatos SDD a partir desta skill — use as skills correspondentes.
11. Idioma de artefatos de processo: **pt-BR**; identificadores técnicos conforme o código.
