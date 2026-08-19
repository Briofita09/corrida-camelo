# Relatório de Implementação — US-04 Fluxo de início da partida

## 1. Contexto

Implementação do início de partida já criada: `Created` → `RaceSetup` com primeiro turno, preservação do estado inicial, rejeição de origem/fase inválida e estado parcial, e persistência do estado iniciado sem re-iniciar — conforme `tasks.md`, `plan.md` e `spec.md` US-04. Sem UI.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-04-fluxo-inicio-partida/spec.md`
- `docs/plan/us-04-fluxo-inicio-partida/plan.md`
- `docs/tasks/us-04-fluxo-inicio-partida/tasks.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`

## 3. Branch Utilizada

- **Nome da branch:** `feature/us-04-fluxo-inicio-partida`
- **Branch base:** `develop`

## 4. Resumo da Execução

**Status:** Concluído.

Entregue:

1. **Domínio `startMatch`:** sucesso define `currentTurnPlayerId = players[0].id`, preserva elenco/camelos/£3/ordem/`playerRoundIndex`, valida o estado `Created` antes de transitar, não muta o input.
2. **`validateMatchState` (D14):** `Created` exige turno nulo; `RaceSetup` (e `LegInProgress`) exigem turno de jogador existente. Deserialize rejeita `RaceSetup` legado sem turno.
3. **Aplicação `startAndPersistMatch`:** `startMatch` e só então `persistCreatedMatch`; load restaura `RaceSetup` sem novo início; falha de domínio não grava iniciado.

**Testes:** 82 passando (baseline 69). Lint e build OK.

## 5. Tarefas Executadas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Status:** Concluída
- **Observações:** Branch criada a partir de `develop`.

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Baseline **69** testes verdes.

### Tarefa 3 — [RED] `startMatch` produz estado inicial completo

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.test.ts`
- **Resultado:** Falhou como esperado — `currentTurnPlayerId` era `null`, esperado `"A"`.

### Tarefa 4 — [GREEN] `startMatch` define turno e preserva estado

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.ts`
- **Observações:** Sucesso preenche `currentTurnPlayerId` com `players[0].id`. Nenhum teste antigo exigia turno nulo após o início.

### Tarefa 5 — Executar testes (`startMatch` sucesso)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `domain/match` verde (incluindo serialize / `advancePlayerRound`).

### Tarefa 6 — [RED] Rejeições de segundo início, andamento e encerrada

- **Tipo:** RED / regressão
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.test.ts`
- **Observações:** Casos já passavam após a Tarefa 4 (`INVALID_PHASE` / `MATCH_FINISHED`); acrescentados asserts de turno estável e `LegInProgress`.

### Tarefa 7 — [GREEN] Completar rejeições de fase

- **Tipo:** GREEN
- **Status:** Concluída
- **Observações:** Sem alteração de código — guards existentes suficientes.

### Tarefa 8 — Executar testes (rejeições de fase)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** 5 testes de `startMatch` verdes (antes da fatia Created inválida).

### Tarefa 9 — [RED] Início rejeitado se `Created` é inválida

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.test.ts`
- **Resultado:** Falhou como esperado — `startMatch` ainda aceitava camelos incompletos (`ok: true`).

### Tarefa 10 — [GREEN] Validar estado antes de transitar

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.ts`
- **Observações:** Após guards de fase, `validateMatchState`; cópias a partir do estado validado.

### Tarefa 11 — Executar testes (`Created` inválida)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `startMatch` / validate / serialize verdes.

### Tarefa 12 — [RED] Estado parcialmente iniciado rejeitado (D14)

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/validateMatchState.test.ts`
- **Resultado:** Falhou como esperado — `Created` com turno e `RaceSetup` sem turno ainda eram aceitos.

### Tarefa 13 — [GREEN] Regras de turno × fase em `validateMatchState`

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/validateMatchState.ts`
- **Observações:** `Created` → turno nulo; `RaceSetup` e `LegInProgress` → turno de jogador existente (sem exigir `players[0]` na validação).

### Tarefa 14 — Executar testes (validate + serialize pós-início)

- **Tipo:** Validação
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/serialize.test.ts` (assert explícito de fase/turno + rejeição de `RaceSetup` sem turno)
- **Resultado:** `domain/match` verde; `playerRoundIndex` intacto.

### Tarefa 15 — [REFACTOR] Comando de início no domínio

- **Tipo:** REFACTOR
- **Status:** Concluída
- **Observações:** `startMatch` já usa estado validado e cópias imutáveis; validação de turno de `RaceSetup`/`LegInProgress` unificada na Tarefa 13. Sem mudança de comportamento.

### Tarefa 16 — [RED] Config inválida e rascunho isolado da partida

- **Tipo:** RED / fluxo
- **Status:** Concluída
- **Arquivos alterados:** `domain/match-config/matchConfig.test.ts`
- **Observações:** Testes passaram com o código existente (US-02 + objetos distintos). Sem `startFromConfig` e sem API de editar elenco da partida.

### Tarefa 17 — Executar testes (config / isolamento)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `matchConfig.test.ts` 25 testes verdes.

### Tarefa 18 — [RED] `startAndPersistMatch` e load sem re-início

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos criados:** `application/match-persistence/startAndPersistMatch.test.ts`
- **Arquivos alterados:** `application/match-persistence/independence.test.ts`
- **Resultado:** Falhou como esperado — módulo `startAndPersistMatch` inexistente (`Cannot find module` / ENOENT).

### Tarefa 19 — [GREEN] `startAndPersistMatch`

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos criados:** `application/match-persistence/startAndPersistMatch.ts`
- **Arquivos alterados:** `application/match-persistence/index.ts`
- **Observações:** `startMatch` e, se ok, `persistCreatedMatch` (save + ativa). Sem `createMatch`.

### Tarefa 20 — Executar testes (persistência do iniciado)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** 12 testes em `application/match-persistence` verdes.

### Tarefa 21 — [REFACTOR] Orquestração de persistência

- **Tipo:** REFACTOR
- **Status:** Concluída
- **Observações:** Já reutiliza `persistCreatedMatch`; independence inclui o novo arquivo. Sem duplicar save+ativa.

### Tarefa 22 — Executar suíte completa da feature

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** **82** testes, 14 arquivos, 0 falhas.

### Tarefa 23 — Lint e build

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `npm run lint` exit 0; `npm run build` exit 0 (aviso Next de lockfile fora do repo — ambiente, já conhecido).

### Tarefa 24 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Status:** Concluída
- **Observações:** Checklist do `plan.md` §13 atendido (ver §8). Sem UI, sem `startFromConfig`.

## 6. Ciclos de Falha e Reexecução

```text
Tarefa 3: RED — expected null to be "A"
Tarefa 4: GREEN — currentTurnPlayerId = players[0].id → passou

Tarefa 9: RED — startMatch aceitava Created com camelos incompletos
Tarefa 10: GREEN — validateMatchState antes de transitar → passou

Tarefa 12: RED — Created+turno e RaceSetup sem turno ainda válidos
Tarefa 13: GREEN — regras D14 → passou

Tarefa 18: RED — módulo startAndPersistMatch ausente
Tarefa 19: GREEN — orquestração + export → passou
```

Nenhum teste foi enfraquecido para passar. Tarefas 6–7 e 16–17 não exigiram GREEN de produto extra.

## 7. Dúvidas Levantadas Durante a Implementação

Nenhuma. Decisões do plan aplicadas: persistir depois do domínio; turno `players[0]` só no comando `startMatch`; validação de `RaceSetup` exige turno de jogador, não necessariamente o primeiro da ordem.

## 8. Validações Finais

- [x] Suíte de testes completa da feature executada com sucesso (`npm test` — 82/82).
- [x] Lint executado com sucesso.
- [x] Build executado com sucesso.
- [x] Critérios de conclusão do `plan.md` §13 atendidos.
- [x] Nenhum teste foi alterado apenas para “passar” sem justificativa registrada.
- [x] Domínio sem React/Next/`localStorage`; persistência só em `application/`.
- [x] Sem UI e sem `startFromConfig`.

## 9. Itens Pendentes ou Bloqueados

Nenhum.

## 10. Próxima Etapa

Validar a feature com a skill `create-validation`, gerando `docs/validation/us-04-fluxo-inicio-partida/validation.md`.

Input:

```text
docs/implementation/us-04-fluxo-inicio-partida/implementation.md
```
