# Relatório de Implementação — US-06 Posições iniciais dos camelos

## 1. Contexto

Implementação da determinação das posições iniciais dos cinco camelos de corrida como passo automático de `startMatch`: embaralha as 30 cartas oficiais, revela exatamente 5 em sequência, aplica movimento com pilha (exceção no espaço 0), grava as 5 reveladas e o pool de 25, e persiste sem reembaralhar no load — conforme `tasks.md`, `plan.md` e `spec.md` US-06. `Crazy` permanece no espaço 0. Sem UI.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-06-posicoes-iniciais-camelos/spec.md`
- `docs/plan/us-06-posicoes-iniciais-camelos/plan.md`
- `docs/tasks/us-06-posicoes-iniciais-camelos/tasks.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`

## 3. Branch Utilizada

- **Nome da branch:** `feature/us-06-posicoes-iniciais-camelos`
- **Branch base:** `develop`

## 4. Resumo da Execução

**Status:** Concluído.

Entregue:

1. **Baralho oficial** (`RacingCard`, 30 cartas: cinco `1` e uma `2` por cor de corrida) e embaralhamento Fisher–Yates / `identityRacingCardOrdering`.
2. **`startMatch(state, options?)`** posiciona os camelos de corrida: sequência injetada (`revealedRacingCards`) ou shuffle (`shuffleRacingCards`); 5 reveladas + pool 25; `Crazy` no espaço 0; turno/elenco da US-04 preservados.
3. **Movimento com pilha** (helpers internos, fora do barrel): sair do espaço 0 não carrega ninguém; nas casas ≥ 1 quem chega sobe e quem se move leva os de cima.
4. **Estado serializável:** `setupRevealedRacingCards` e `remainingRacingCards` (`null` em `Created`). JSON legado de `RaceSetup` sem cartas é rejeitado.
5. **Persistência:** `startAndPersistMatch` encaminha opções; load restaura sem `startMatch`.
6. **Stub US-05** copia os novos campos e **não** move camelos.

**Testes:** 117 passando (baseline 96). Lint e build OK.

## 5. Tarefas Executadas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Status:** Concluída
- **Observações:** Branch criada a partir de `develop`.

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado da execução dos testes:** Baseline **96** testes verdes.

### Tarefa 3 — [RED] Baralho oficial de 30 cartas de corrida

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos criados:** `domain/match/racingCards.test.ts`
- **Resultado:** Falhou como esperado (`Cannot find module './racingCards'`).

### Tarefa 4 — [GREEN] Tipo `RacingCard` e fábrica do baralho oficial

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos criados:** `domain/match/racingCards.ts`
- **Arquivos alterados:** `domain/match/types.ts`, `domain/match/constants.ts`
- **Resultado da execução dos testes:** Passou

### Tarefa 5 — Executar testes (baralho)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** 2 testes verdes.

### Tarefas 6–15 — Movimento e pilha

- **Tipo:** RED / GREEN / REFACTOR / Validação
- **Status:** Concluída
- **Arquivos criados:** `domain/match/applyRacingCardMove.ts`, `domain/match/applyRacingCardMove.test.ts`
- **Observações:** Ciclo cobre valor 1 a partir do 0 (sem carregar), valor 2, mesmo camelo cumulativo, pilha de 2 e 3+, carregar os de cima, imutabilidade. Helper **não** exportado no barrel.
- **Reexecução:** o primeiro RED de movimento falhou por importar `CAMEL_IDS` de `constants` (vive em `types`). Correção do **teste** (import), não das asserções de comportamento. Em seguida 7 testes verdes.

### Tarefas 16–18 — `startMatch` revela 5, posiciona e grava o pool

- **Tipo:** RED / GREEN / Validação
- **Status:** Concluída
- **Arquivos criados:** `domain/match/determineInitialCamelPositions.ts`
- **Arquivos alterados:** `startMatch.ts`, `types.ts` (`MatchState`), `createMatch.ts`, `index.ts`, `startMatch.test.ts`
- **Observações:** Campos `setupRevealedRacingCards` e `remainingRacingCards`. `createMatch` preenche `null`. Sequência controlada exercita movimento e Red/Crazy no 0.

### Tarefas 19–21 — Rejeições

- **Tipo:** RED / GREEN / Validação
- **Status:** Concluída
- **Observações:** `INVALID_REVEAL_COUNT` (≠ 5), `INVALID_RACING_CARD` (valor 0 / cor Crazy), `CAMELS_NOT_AT_START`, segundo início `INVALID_PHASE` com posições/pool estáveis.

### Tarefas 22–24 — Shuffle injetado

- **Tipo:** RED / GREEN / Validação
- **Status:** Concluída
- **Observações:** Permutação reversa → 5 primeiras conhecidas. `identityRacingCardOrdering` → cinco `Yellow` 1, Yellow no espaço 5, Red no 0.

### Tarefas 25–27 — Validação e serialização

- **Tipo:** RED / GREEN / Validação
- **Status:** Concluída
- **Arquivos alterados:** `validateMatchState.ts`, `validateMatchState.test.ts`, `serialize.test.ts`, `testHelpers.ts`
- **Observações:** `Created` exige cartas nulas e camelos no 0. Fase ≠ `Created` exige 5+25 com união = 30 oficiais. `Crazy` no 0 **não** é invariante permanente de `RaceSetup`. `buildValidFinishedMatch` passa por `startMatch` com identidade.

### Tarefas 28–30 — Regressão US-04/US-05

- **Tipo:** RED / GREEN / Validação
- **Status:** Concluída
- **Arquivos alterados:** `applyNextTurn.ts`, `performTurnAction.test.ts`, `startMatch.test.ts`, `createMatch.test.ts`
- **Observações:** Determinismo com a **mesma** sequência injetada. Stub compara camelos/pool ao estado **já iniciado**, não “todos no 0”. Cópia explícita dos campos de cartas em `applyNextTurn`.

### Tarefas 31–34 — Persistência e exports

- **Tipo:** RED / GREEN / Validação / REFACTOR
- **Status:** Concluída
- **Arquivos alterados:** `application/match-persistence/startAndPersistMatch.ts`, `startAndPersistMatch.test.ts`, `domain/match/index.ts`
- **Observações:** `startAndPersistMatch(state, persistence, options?)`. Load restaura posições, 5 reveladas e pool 25. Sequência inválida não grava `RaceSetup`. Barrel exporta `RacingCard`, `StartMatchOptions`, `identityRacingCardOrdering`; **não** exporta movimento interno.

### Tarefa 35 — Executar suíte completa da feature

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** **117** testes / 18 arquivos, todos verdes.

### Tarefa 36 — Lint e build

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `npm run lint` OK. Primeiro `npm run build` falhou em TS (`card.value === 0` em teste). Ajuste do teste com cast; build OK na segunda tentativa.

### Tarefa 37 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Status:** Concluída
- **Arquivos alterados:** `AGENTS.md`
- **Observações:** Checklist do plan §13 atendido. Lacuna “todos no espaço 0” atualizada: camelos de corrida posicionados no início; Crazy permanece no 0; pool 25.

## 6. Ciclos de Falha e Reexecução

```text
Tarefa: 6 (movimento)
Tentativa 1: falhou — CAMEL_IDS importado de constants (undefined)
Ação: importar CAMEL_IDS de types.ts
Tentativa 2: passou

Tarefa: 36 (build)
Tentativa 1: falhou — TS2367 comparação value === 0 em racingCards.test.ts
Ação: cast (card.value as number) === 0
Tentativa 2: passou
```

## 7. Dúvidas Levantadas Durante a Implementação

Nenhuma dúvida bloqueante. Decisões técnicas seguiram o `plan.md` (nomes de campos, opções de `startMatch`, códigos de erro).

## 8. Validações Finais

- [x] Suíte de testes completa da feature executada com sucesso (117 testes).
- [x] Lint executado com sucesso.
- [x] Build executado com sucesso.
- [x] Critérios de conclusão do `plan.md` atendidos.
- [x] Nenhum teste de comportamento foi enfraquecido só para passar; asserts obsoletos de “todos no 0 após iniciar” foram migrados conforme plan §11.

## 9. Itens Pendentes ou Bloqueados

Nenhum.

## 10. Próxima Etapa

Validar a feature com a skill `create-validation`, gerando `docs/validation/us-06-posicoes-iniciais-camelos/validation.md`.

Input:

```text
docs/implementation/us-06-posicoes-iniciais-camelos/implementation.md
```
