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
| Estado do código | Bootstrap `create-next-app`; UI ainda é o template padrão |

**Propósito:** digitalizar *Camel Up: The Card Game* para jogar no celular pelo navegador — partidas locais (bots / pass-and-play) no MVP; multiplayer online em evolução futura.

Documento de produto/UX/arquitetura desejada: `docs/game/game-design.md`.

`CLAUDE.md` apenas referencia este `AGENTS.md`.

---

## Objetivos e não-objetivos

### Objetivos (produto + repositório)

- Experiência **Mobile First** e **Touch First** (prioridade: mobile → tablet → desktop).
- MVP **local-first**: single-player com bots e pass-and-play **sem servidor** / sem internet (assets já disponíveis).
- Separar **domínio do jogo** da UI (regras não vivem em componentes).
- Evoluir para multiplayer online **server-authoritative** (lobby, código de sala, WebSocket, reconexão) sem exigir app nativo.
- Guidelines de front-end em `docs/guidelines/` e skills SDD em `.cursor/skills/`.

### Critério principal de produto (MVP)

> Abrir o site no celular, iniciar partida contra bots e concluir uma partida completa sem computador, mouse, teclado ou configuração técnica.

### Não-objetivos / ainda não evidenciados no código

- Backend, game server, WebSocket, banco ou ORM implementados.
- Autenticação / contas / ranking / matchmaking (roadmap fase 6).
- Player-hosted como transporte inicial (explicitamente adiado; arquitetura não deve impedir no futuro).
- PWA obrigatória no primeiro MVP (opcional depois).
- Suíte de testes automatizados configurada (`package.json` sem script `test`; nenhum `*.test.*` / `*.spec.*`).
- CI/CD neste diretório do projeto.
- Variáveis de ambiente documentadas (`.env*` no `.gitignore`; sem `.env.example`).

---

## Stack tecnológica

| Área | Tecnologia | Versão / evidência |
| --- | --- | --- |
| Framework | Next.js (App Router) | `16.3.1` — `package.json` |
| UI | React / React DOM | `19.2.8` |
| Linguagem | TypeScript | `^5` — `tsconfig.json` (`strict: true`) |
| Estilo | Tailwind CSS + `@tailwindcss/postcss` | `^4` — `app/globals.css`, `postcss.config.mjs` |
| Fontes | `next/font` (Geist / Geist Mono) | `app/layout.tsx` |
| Lint | ESLint flat config | `eslint.config.mjs`, `eslint-config-next@16.3.1` |
| Alias de import | `@/*` → raiz do projeto | `tsconfig.json` `paths` |
| Config Next | `next.config.ts` | Sem opções customizadas além do default |

Não há Prettier, Vitest, Jest, Playwright, Cypress, Storybook, banco, ORM nem SDKs de cloud no manifesto atual.

---

## Arquitetura

### Código atual

Aplicação Next.js monolítica no template inicial:

```text
Browser
  → app/layout.tsx (RootLayout, fontes, metadata)
  → app/page.tsx (Home do template)
  → app/globals.css (Tailwind + tokens CSS)
```

Sem `"use client"` no código atual. Sem pastas de domínio/features ainda.

### Arquitetura desejada (produto)

Fonte: `docs/game/game-design.md` §§41–43, 59–60, 64.

```text
GAME DOMAIN
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
| Domain-driven | UI não decide regras (ex.: vitória); domínio é autoridade das regras |
| Local-first (MVP) | Partidas locais no cliente; custo de infra ≈ zero |
| Server-authoritative (online futuro) | Cliente não é autoridade; recebe só o estado autorizado ao jogador |
| Client Components | Só para interação; lógica de jogo fora da árvore de UI |
| Transports plugáveis | Evitar acoplamento que impeça Local / Server / Hosted depois |

### Decisão arquitetural resumida

```text
Next.js + Mobile First + Touch First + Domain Driven + TDD/BDD
+ Local-first (MVP) + Server-authoritative (multiplayer futuro)
```

### Roadmap (alto nível)

| Fase | Foco |
| --- | --- |
| 1 | Domínio + regras + BDD/TDD |
| 2 | MVP mobile: UI, single-player, bots, pass-and-play |
| 3 | Persistência local (salvar / continuar / offline) |
| 4 | Multiplayer (server, lobby, room code, WebSocket) |
| 5 | Online UX (reconnect, persistência, PWA, share) |
| 6 | Contas, matchmaking, ranking, replay, player-hosted opcional |

Detalhes de UX mobile, HUD, pista, apostas, etc.: `docs/game/game-design.md` — **não** duplicar aqui.

---

## Estrutura do projeto

```text
camel-up-card-game/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── public/                 # Assets do template
├── docs/
│   ├── game/
│   │   └── game-design.md  # Especificação Mobile First + arquitetura desejada
│   └── guidelines/         # Convenções front-end (01–08)
├── .cursor/skills/         # Skills SDD + create-architecture
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
├── eslint.config.mjs
├── README.md
├── CLAUDE.md
└── AGENTS.md
```

Quando o código crescer: organização por **feature/domínio** e colocation — `docs/guidelines/06-code-structure.md`.

---

## Convenções de desenvolvimento

### Produto / UX (estáveis)

| Tema | Regra |
| --- | --- |
| Dispositivo | Smartphone portrait; referência mínima ~320×568; touch ≥ ~44×44 px |
| Interação | Sem depender de hover, mouse, teclado, drag obrigatório ou tela grande para ações essenciais |
| Breakpoints (referência) | Mobile `<640px`, tablet `640–1024px`, desktop `>1024px` (ajustáveis) |
| Privacidade | Pass-and-play: tela de passagem esconde estado privado; online: cliente só vê o autorizado |
| Acessibilidade | Cor não é a única identificação dos camelos; contraste, toque, leitores de tela |
| Assets | Emoji ok no protótipo; produção com SVG/Canvas/assets próprios |
| Safe areas | Respeitar `safe-area-inset` em elementos fixos |

### Front-end (guidelines)

| Tema | Arquivo | Regras-chave |
| --- | --- | --- |
| Componentes | `01-component-design.md` | Responsabilidade única; composição; apresentação vs lógica |
| Rendering | `02-rendering-strategy.md` | Server por padrão; `"use client"` só com justificativa |
| Estado | `03-state-management.md` | Local → lift → contexto → store; classificar server/UI/URL/form |
| Data fetching | `04-data-fetching.md` | Colocation; loading/error/empty; evitar waterfalls |
| Performance | `05-performance.md` | Medir antes de memoizar; lazy fora do critical path |
| Estrutura | `06-code-structure.md` | Por feature; sem import direto entre features |
| Acessibilidade | `07-accessibility.md` | Semântica, teclado (desktop), labels, foco |
| Testes | `08-testing.md` | Comportamento > implementação; pirâmide unit/integração/e2e |

### TypeScript / Next

- `strict: true`.
- Preferir Server Components; Client Components para interação de jogo/UI.
- Path alias `@/*`.

### Fluxo SDD (alto nível)

Skills em `.cursor/skills/`: specification → plan → tasks → implementation → validation. Detalhe do processo SDD **não** vive neste arquivo. Este `AGENTS.md` é pré-requisito de contexto para essas skills.

O `game-design.md` orienta produto/UX/arquitetura desejada; specs de feature (`spec.md`) detalham fatias implementáveis — não confundir os dois.

---

## Estratégia de testes

| Aspecto | Situação |
| --- | --- |
| Código | Sem runner/scripts de teste ainda |
| Intenção de produto | Domain com TDD; comportamento com BDD; UI conforme `08-testing.md` |
| Aceite mobile | Checklist em `game-design.md` §62 (partida completa no smartphone, touch, privacidade pass-and-play, offline local, etc.) |

---

## Segurança e configuração

- `.env*` no `.gitignore`; **nunca** copiar segredos para `AGENTS.md` ou commits.
- Nenhuma variável de ambiente em uso no código atual.
- Online futuro: cartas/estado privado nunca no estado público da UI.
- Metadata/`lang` ainda do template (`lang="en"`, título "Create Next App").

---

## Infraestrutura e deploy

- MVP local: infra ≈ zero (cliente).
- Multiplayer futuro: frontend + game server + database (não implementado).
- README menciona Vercel; sem `vercel.json`, Dockerfile ou pipeline CI neste projeto.
- Sem instalação nativa obrigatória; PWA opcional depois.

---

## Comandos verificados

```bash
npm install          # instalar dependências
npm run dev          # next dev
npm run build        # next build
npm run start        # next start
npm run lint         # eslint
```

Não há scripts `test`, `format` ou `typecheck` dedicados.

---

## Instruções para agentes de código

1. Código + este arquivo + `docs/` são a fonte de verdade; não inventar stack, pastas ou serviços inexistentes.
2. Antes de features de produto: ler trechos relevantes de `docs/game/game-design.md` e `docs/guidelines/`; usar fluxo SDD quando a tarefa for de produto.
3. Implementar domínio de jogo **fora** de componentes React; UI só renderiza e despacha comandos.
4. Projetar UI Mobile First / Touch First; desktop é adaptação, não fonte de regras extras.
5. MVP local-first: não exigir servidor para bots/pass-and-play.
6. Preferir Server Components; `"use client"` só com motivo concreto.
7. Organizar código novo por feature/domínio com colocation.
8. Não adicionar auth, banco, WebSocket ou CI “por padrão” sem spec/plan.
9. Não criar artefatos SDD a partir desta skill de contexto — use as skills correspondentes.
10. Idioma de artefatos de processo: **pt-BR**; identificadores técnicos conforme o código.
