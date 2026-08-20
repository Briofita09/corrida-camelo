# Relatório de Validação — US-06 Posições iniciais dos camelos

## 1. Contexto

Validação da feature US-06 (determinar posições iniciais dos cinco camelos de corrida no início da partida: embaralhar as 30 cartas oficiais, revelar exatamente 5, aplicar movimento com pilha, gravar as 5 reveladas e o pool de 25, persistir sem reembaralhar no load; `Crazy` permanece no espaço 0), confrontando o código em `domain/match/` e `application/match-persistence/` e a reexecução de testes/lint/build com `spec.md`, `plan.md`, `tasks.md` e `implementation.md`.

Branch verificada: `feature/us-06-posicoes-iniciais-camelos`. Sem UI nesta fatia.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-06-posicoes-iniciais-camelos/spec.md`
- `docs/plan/us-06-posicoes-iniciais-camelos/plan.md`
- `docs/tasks/us-06-posicoes-iniciais-camelos/tasks.md`
- `docs/implementation/us-06-posicoes-iniciais-camelos/implementation.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`
- `domain/match/` (US-01, US-03, US-04, US-05)
- `application/match-persistence/` (US-03, US-04, US-05)

## 3. Veredito Final

**Status:** Aprovado com ressalvas

**Justificativa:** RF-01–RF-09, RN-01–RN-22 e o aceite da spec §16 estão atendidos no código, com suíte reexecutada **117/117** passando, lint e build OK. O procedimento vive em `startMatch`; helpers de movimento não entram no barrel; load só desserializa; `AGENTS.md` já reflete a US-06. A ressalva é de **cobertura de exemplo**, não de comportamento: o cenário §17.6 cita carta de valor **3** além de 0 e `Crazy`, e só valor 0 e cor `Crazy` têm teste dedicado — o mesmo `isRacingCard` rejeita valor 3. TDD de movimento teve um RED inicial por import errado (`CAMEL_IDS` em `constants`), documentado e corrigido no teste, sem enfraquecer asserções.

## 4. Matriz de Rastreabilidade

| Critério / Cenário (spec) | Estratégia (plan) | Tarefas | Evidência | Status |
| --- | --- | --- | --- | --- |
| Aceite §16: camelos de corrida no 0 antes do procedimento (RF-01, RN-01) | Guard `racingCamelsAreAtStart` em `startMatch` | 16–21 | `startMatch.test.ts` — Created todos no 0; `CAMELS_NOT_AT_START` se Yellow no 1 | Atendido |
| Aceite §16 / §17.2: embaralhar antes de revelar (RF-01, RN-03, D8) | Fisher–Yates + `shuffleRacingCards` injetável | 22–24 | Shuffle invertido → 5 primeiras da permutação; identidade → cinco Yellow 1 | Atendido |
| Aceite §16 / §17.1: exatamente 5 cartas (RN-04, D9) | `INITIAL_SETUP_REVEAL_COUNT` | 16–21 | Sucesso grava 5; 4 e 6 → `INVALID_REVEAL_COUNT` | Atendido |
| Aceite §16 / §17.1–17.2: cada carta move a cor; valor 1 ou 2 (RN-05, RN-06) | Helper interno `applyRacingCardMove` | 6–18 | Yellow 1 → espaço 1; Green 2 → espaço 2; sequência controlada em `startMatch` | Atendido |
| Aceite §16 / §17.6: somente valores/cores válidos (RN-07, RF-07) | `isRacingCard`; rejeição atômica | 19–21 | Valor 0 e cor Crazy → `INVALID_RACING_CARD`; Created intacta | Parcial |
| Aceite §16 / §17.2: camelo pode permanecer no 0 (RN-08) | Sequência sem Red | 16–18 | Red no espaço 0 após sequência controlada; identidade deixa Red no 0 | Atendido |
| Aceite §16 / §17.5: 5 cartas fora do pool da etapa (RN-09, D17–D18, RF-04, RF-05) | `subtractRacingCards` / união = 30 | 16–18, 25–27, 31–33 | Pool 25; `racingCardMultisetsEqual(reveladas ∪ restante, oficiais)` | Atendido |
| Aceite §16: posições válidas ao final (RN-10, RF-03) | `validateMatchState` pós-início | 25–27 | Estado iniciado aceito; `stackOrder` distintos no mesmo espaço | Atendido |
| Aceite §16 / §17.3: mesmo camelo cumulativo (RN-14) | Aplicação sequencial | 6–15, 16–18 | Blue 1 depois Blue 2 → espaços 1 e 3; Yellow 1+1 → espaço 2 no início | Atendido |
| Aceite §16 / §17.4: pilha de 2 e 3+ (RN-13, RN-15) | Chegada sobe na unidade presente | 6–15 | Yellow depois Green no 1; Yellow/Green/Blue no 1 na ordem de chegada | Atendido |
| Aceite §16 / §17.4: carregar os de cima; não carregar no 0 (RN-12, D12) | Unidade só o alvo se `space === 0` | 6–15 | Yellow+Green avançam juntos; Green e Crazy ficam no 0 | Atendido |
| Aceite §16 / §17.5: Crazy no espaço 0 (RN-16, D5, RF-06) | Fora do baralho oficial; não é alvo | 16–18 | Crazy no 0 após início; deck sem Crazy | Atendido |
| Aceite §16 / §17.5: reload não reembaralha (RN-20, RF-08, D20) | Load só `deserialize`; sem `startMatch` | 31–33 | `startAndPersistMatch.test.ts` — load igual ao persistido; identidade não reembaralha | Atendido |
| §17.1: fase, turno US-04, atomicidade (D16, RN-17, RN-19) | `startMatch` refinado, não fundido com create | 16–21, 28–30 | RaceSetup, turno A, £3, `players` intactos; input Created snapshot | Atendido |
| §17.6: segundo início não reposiciona (RN-18, D21) | `INVALID_PHASE` fora de Created | 19–21 | Snapshot de posições/pool após segundo `startMatch` | Atendido |
| RF-09 / RNF-02: sequência/shuffle injetáveis | `StartMatchOptions` | 22–24, 31–34 | `revealedRacingCards` e `shuffleRacingCards`; persistência encaminha opções | Atendido |
| Independência de UI (RNF-01, D4) | Sem `app/*` | 37 | `app/` sem `startMatch` nem campos de cartas | Atendido |
| Aceite §16 / plan §13 | Checklist + suíte | 35–37 | Reexecução 117/117; lint/build OK; `AGENTS.md` atualizado | Atendido |

**Nota sobre “Parcial” (valor 3):** o cenário §17.6 lista “valor 0, valor 3, ou cor Crazy”. Há testes para valor 0 e `Crazy`. Valor 3 cai no mesmo `isRacingCard` (`value === 1 \|\| value === 2`) e seria `INVALID_RACING_CARD`; não há teste dedicado. Não altera o aceite §16.

## 5. Evidências de Teste

### 5.1 Execução da suíte de testes

- **Comando executado (reexecução nesta validação):** `npm test`
- **Resultado:** Passou
- **Quantidade:** 18 arquivos, **117 testes**, 0 falhas
- **Duração:** ~3,17 s (Vitest 3.2.4)
- **Distribuição relevante à US-06:**
  - `startMatch.test.ts` (11)
  - `applyRacingCardMove.test.ts` (7)
  - `racingCards.test.ts` (2)
  - `validateMatchState.test.ts` (13)
  - `serialize.test.ts` (6)
  - `startAndPersistMatch.test.ts` (7)
  - regressão US-01–US-05 (`performTurnAction`, `createMatch`, persistência, match-config)
- **Observação:** Aviso CJS do Vite (informativo), igual ao restante do projeto
- **Alinhamento com implementation.md:** Reportou 117; reexecução confirmou **117 passed**

### 5.2 Lint / Format

- **Comando executado:** `npm run lint`
- **Resultado:** Passou (exit 0)

### 5.3 Build

- **Comando executado:** `npm run build`
- **Resultado:** Passou (exit 0)
- **Observação:** Warning Next.js sobre `package-lock.json` fora do Git repository (diretório pai `projetos`); ambiente local, fora do escopo da US-06. Compilação TypeScript e rotas `/` e `/_not-found` OK.

### 5.4 Cobertura de testes

- **Resultado:** Não aplicável — projeto sem meta/ferramenta de cobertura definida no `AGENTS.md`

### 5.5 Divergências em relação ao implementation.md

- Nenhuma divergência funcional ou de contagem de testes (117).
- Lint e build alinhados ao relatório (implementation.md registrou falha TS2367 na primeira tentativa de build, corrigida no teste com cast; a reexecução desta validação já encontra o estado corrigido, build verde).

## 6. Conformidade Funcional

| ID | Avaliação | Evidência |
| --- | --- | --- |
| RF-01 | Atendido | `startMatch` resolve 30 cartas, revela 5 (shuffle ou sequência) |
| RF-02 | Atendido | `determineInitialCamelPositions` aplica as 5 em ordem via `applyRacingCardMove` |
| RF-03 | Atendido | Estado iniciado passa em `validateMatchState`; espaços ≥ 0 |
| RF-04 | Atendido | `setupRevealedRacingCards` (5, ordem) e `remainingRacingCards` (25) |
| RF-05 | Atendido | União multiconjunto = baralho oficial; restante obtido por subtração / fatia do shuffle |
| RF-06 | Atendido | Crazy no espaço 0 após início; não entra no baralho oficial |
| RF-07 | Atendido | `INVALID_REVEAL_COUNT` / `INVALID_RACING_CARD`; Created intacta |
| RF-08 | Atendido | `startAndPersistMatch` só grava se `ok`; `getActiveMatch` igual ao persistido |
| RF-09 | Atendido | `revealedRacingCards` e `shuffleRacingCards` em `StartMatchOptions` |
| RN-01–RN-08 | Atendido | Largada no 0, 30 oficiais, shuffle, 5 reveladas, movimento 1/2, validade, permanência |
| RN-09–RN-16 | Atendido | Pool 25, posições válidas, sequencial, pilha, cumulativo, Crazy |
| RN-17–RN-22 | Atendido | US-04 preservada; uma vez; atomicidade; load sem re-reveal; determinismo da aplicação; domínio sem I/O |
| D1–D4 | Atendido | Passo automático de `startMatch`; não na criação; sem escolha do jogador; sem UI |
| D5–D6 | Atendido | Crazy no 0; cartas do doido fora do baralho |
| D14–D16 | Atendido | Após início, corrida não fica toda no 0; RNG só nas posições; turno/elenco/£3 intactos |
| D17–D21 | Atendido | 5 consumidas; estado serializável; load sem procedimento; segundo início rejeitado |
| Spec §16 | Atendido | Checklist coberto pelos testes reexecutados |

**Notas de desenho (conforme plan):**

- Cartas idênticas (vários Yellow 1) não têm identidade de objeto: “não pertencem ao pool” é verificado por **multiconjunto** (união = 30 oficiais e restante com 25), não por diferença de referências.
- Embaralhamento de produção (`Math.random`) não é testado estatisticamente (plan §11 — flakiness). Caminho sem opções é exercido em persistência; determinismo usa injeção.
- Validação permanente de `RaceSetup` **não** exige Crazy no 0 (mitigação da US futura da casa 7); só `startMatch` garante isso agora.
- JSON legado de `RaceSetup` sem campos de cartas é rejeitado (`serialize.test.ts` / `validateMatchState.test.ts`).

## 7. Conformidade Técnica

| Aspecto | Avaliação |
| --- | --- |
| `startMatch(state, options?: StartMatchOptions)` | Conforme plan §5 / §8 |
| Campos `setupRevealedRacingCards` / `remainingRacingCards` | `null` em `Created`; 5+25 após início |
| Helpers internos não públicos | `applyRacingCardMove` e `determineInitialCamelPositions` existem; **não** estão no barrel `domain/match/index.ts` |
| Barrel público | Exporta `RacingCard`, `StartMatchOptions`, `identityRacingCardOrdering`, `createOfficialRacingDeck` |
| `startAndPersistMatch(state, persistence, options?)` | Encaminha opções; persiste só se domínio `ok` |
| Load sem re-reveal | `getActiveMatch` restaura JSON; igualdade com o estado persistido |
| Stub US-05 | `applyNextTurn` copia os campos de cartas; `performTurnAction.test.ts` compara com o estado já iniciado |
| Camadas | Domínio sem React/Next/`localStorage`; I/O em `application/` |
| `app/` | Sem wiring |
| Tasks 1–37 | Reportadas concluídas no `implementation.md`; nenhuma pendente/bloqueada |
| TDD | RED evidenciado no baralho (módulo ausente) e nas rejeições/`startMatch`; movimento: primeiro RED falhou por import de `CAMEL_IDS` (correção de teste, não de assert); depois 7 testes verdes. Processual, não funcional |
| `AGENTS.md` | Atualizado nesta US (posições no início, pool 25, Crazy no 0, helpers internos) |

## 8. Riscos e Mitigações — Situação Atual

| Risco (plan §11) | Situação |
| --- | --- |
| Quebrar US-04 (`camels.every(space === 0)` e determinismo sem opções) | Mitigado — asserts atualizados; determinismo com sequência injetada |
| US-05 assume camelos no 0 após o stub | Mitigado — igualdade com estado já iniciado + cópia dos campos |
| `stackOrder` no 0 tratado como pilha / carregar Crazy | Mitigado — teste explícito; ramo `space === 0` usa só o alvo |
| Invariante “Crazy sempre no 0 em RaceSetup” bloquear US futura | Mitigado — validação permanente não exige Crazy no 0 |
| JSON legado sem cartas | Mitigado — rejeição na hidratação; sem default silencioso |
| `performTurnAction` dropar os novos campos | Mitigado — cópia em `applyNextTurn`; teste após uma ação |
| Gravar iniciado após sequência inválida | Mitigado — orquestração só persiste se `ok` |
| Exportar movimento como API de turno | Mitigado — fora do barrel |
| Flakiness do shuffle padrão | Mitigado — testes de posição usam injeção |

## 9. Não Conformidades e Pendências

| Item | Origem | Severidade | Recomendação |
| --- | --- | --- | --- |
| Cenário §17.6 cita valor 3; não há teste dedicado (há valor 0 e `Crazy`) | Spec §17.6 / RF-07 | Não bloqueante | Opcional: um caso `value: 3` em `startMatch.test.ts` na próxima fatia; o guard já rejeita |
| TDD de movimento: RED inicial por import, não por assert de comportamento | Tasks 6–8 / implementation.md §6 | Não bloqueante | Processo já documentado; não exige retorno à implementação |

Nenhuma não conformidade funcional bloqueante. Nenhuma tarefa do `tasks.md` ficou sem correspondência no `implementation.md`.

## 10. Dúvidas Levantadas Durante a Validação

Nenhuma dúvida bloqueante para o veredito. A interpretação de “as 5 reveladas não pertencem ao pool” como igualdade de **multiconjunto** (cartas indistinguíveis) está alinhada ao plan e ao código; não exige decisão de produto.

## 11. Conclusão

US-06 **aprovada com ressalvas** (teste explícito de valor 3 opcional). Critérios de aceite §16, requisitos RF/RN e cenários BDD relevantes estão cobertos por testes reexecutados com sucesso (**117/117**), lint e build OK. O domínio posiciona os camelos de corrida no `startMatch`, consome 5 cartas do baralho oficial, deixa `Crazy` no espaço 0 e a persistência restaura sem novo reveal.

**Próximos passos sugeridos:** merge/PR da branch `feature/us-06-posicoes-iniciais-camelos`. Fluxo SDD desta fatia encerrado. Aberturas da spec (casa 7 do Crazy, baralho da etapa a partir do pool 25, UI de reveal) permanecem para histórias futuras.
