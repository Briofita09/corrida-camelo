# Relatório de Implementação — US-05 Gerenciamento de turnos

## 1. Contexto

Implementação do gerenciamento de turnos: comando stub `performTurnAction` autoriza só o jogador ativo, avança turno/rodada pela sequência US-03, rejeita skip/`Created`/`Finished`/fora do turno, e persiste o novo ativo sem reexecutar a ação no load — conforme `tasks.md`, `plan.md` e `spec.md` US-05. Sem UI.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md`
- `docs/plan/us-05-gerenciamento-de-turnos/plan.md`
- `docs/tasks/us-05-gerenciamento-de-turnos/tasks.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`

## 3. Branch Utilizada

- **Nome da branch:** `feature/us-05-gerenciamento-de-turnos`
- **Branch base:** `develop`

## 4. Resumo da Execução

**Status:** Concluído.

Entregue:

1. **Domínio `performTurnAction(state, actorPlayerId)`:** aceita só o ativo em `RaceSetup` / `LegInProgress`; no sucesso avança o turno (e a rodada se for o último da sequência US-03); não muta o input; não altera fase, camelos, £ nem ordem `players`.
2. **Helpers internos (não exportados):** `assertPlayerMayPerformTurnAction` e `applyNextTurn`.
3. **Fim do skip público:** `advancePlayerRound` removido da API e do módulo.
4. **Aplicação `performTurnActionAndPersist`:** domínio e, se ok, `persistCreatedMatch`; load restaura o ativo sem reexecutar a ação; falha de domínio não grava avanço.

**Testes:** 96 passando (baseline 82). Lint e build OK.

## 5. Tarefas Executadas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Status:** Concluída
- **Observações:** Branch criada a partir de `develop`.

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Baseline **82** testes verdes.

### Tarefa 3 — [RED] Ação válida no meio da rodada

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos criados:** `domain/match/performTurnAction.test.ts`
- **Resultado:** Falhou como esperado — módulo `performTurnAction` inexistente.

### Tarefa 4 — [GREEN] `performTurnAction` avança o próximo da sequência

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos criados:** `domain/match/performTurnAction.ts`
- **Arquivos alterados:** `domain/match/index.ts`
- **Observações:** Caminho feliz A→B via `getRoundPlayerSequence`; input não mutado.

### Tarefa 5 — Executar testes (meio da rodada)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `performTurnAction.test.ts` + `startMatch.test.ts` verdes.

### Tarefa 6 — [RED] Fora do turno e dupla conclusão

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.test.ts`
- **Resultado:** Falhou como esperado — ator B era aceito (`ok === true`).

### Tarefa 7 — [GREEN] Autorizar somente o jogador ativo

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.ts`
- **Observações:** Rejeição `NOT_CURRENT_PLAYER`. Dupla conclusão sai do avanço (ativo já é outro).

### Tarefa 8 — Executar testes (autorização)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** 4 testes de `performTurnAction` verdes.

### Tarefa 9 — [RED] Created, Finished, fase que não admite e origem inválida

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.test.ts`
- **Resultado:** Falhou como esperado (`NOT_CURRENT_PLAYER` em Finished/Created; LegSetup e origem inválida ainda avançavam).

### Tarefa 10 — [GREEN] Guards de fase e validação

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.ts`
- **Observações:** `Finished` → `MATCH_FINISHED`; `validateMatchState`; fases fora de `RaceSetup`/`LegInProgress` → `INVALID_PHASE`.

### Tarefa 11 — Executar testes (guards)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `domain/match` verde.

### Tarefa 12 — [RED] Wrap da rodada (último → primeiro da próxima)

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.test.ts`
- **Resultado:** Falhou como esperado — `next` indefinido ao agir com D.

### Tarefa 13 — [GREEN] Avançar rodada só no último da sequência

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.ts`
- **Observações:** Após D na rodada 0, índice 1 e ativo **B** (não A). Ativo ausente da sequência → `INVALID_TURN`.

### Tarefa 14 — Executar testes (wrap)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** 10 testes de `performTurnAction` verdes.

### Tarefa 15 — [RED] Dois jogadores (D14) e seis jogadores

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.test.ts`
- **Observações:** Testes já passaram na primeira execução — wrap da Tarefa 13 é genérico (N=2…6).

### Tarefa 16 — [GREEN] Generalizar wrap para N=2 e N=6

- **Tipo:** GREEN
- **Status:** Concluída (no-op)
- **Observações:** Sem alteração de código, conforme o critério da tarefa.

### Tarefa 17 — Executar testes (bordas N)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `domain/match` verde (incluindo N=2 com turno consecutivo de B e N=6).

### Tarefa 18 — [RED] Sem avanço de turno/rodada sem ação válida

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.test.ts`; `domain/match/advancePlayerRound.test.ts` (migração: só regressão de `startMatch`)
- **Resultado:** Falhou como esperado — API pública ainda exportava `advancePlayerRound`.

### Tarefa 19 — [GREEN] Encerrar skip público `advancePlayerRound`

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/index.ts`
- **Arquivos removidos:** `domain/match/advancePlayerRound.ts`
- **Observações:** Incremento de rodada permanece só no wrap de `performTurnAction`. Testes US-03 de skip migrados (exceção documentada no `tasks.md` §4).

### Tarefa 20 — Executar testes (fim do skip + regressão US-03)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Domínio verde; `playerRoundIndex` de criação/serialize intacto.

### Tarefa 21 — [REFACTOR] Helpers internos de autorização e próximo turno

- **Tipo:** REFACTOR
- **Status:** Concluída
- **Arquivos criados:** `domain/match/assertPlayerMayPerformTurnAction.ts`; `domain/match/applyNextTurn.ts`
- **Arquivos alterados:** `domain/match/performTurnAction.ts` (orquestra os helpers)
- **Observações:** Helpers **não** exportados no barrel. Stub sem regra de mesa.

### Tarefa 22 — [RED] Persistir após ação aceita; load sem reexecutar

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos criados:** `application/match-persistence/performTurnActionAndPersist.test.ts`
- **Observações:** Teste escrito antes da orquestração; implementação da Tarefa 23 na sequência imediata.

### Tarefa 23 — [GREEN] `performTurnActionAndPersist`

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos criados:** `application/match-persistence/performTurnActionAndPersist.ts`
- **Arquivos alterados:** `application/match-persistence/index.ts`; `application/match-persistence/independence.test.ts`
- **Observações:** `performTurnAction` e, se ok, `persistCreatedMatch`. Sem I/O em rejeição.

### Tarefa 24 — Executar testes (persistência do turno)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Persistência do avanço verde (incluída na suíte completa).

### Tarefa 25 — [REFACTOR] Orquestração de persistência

- **Tipo:** REFACTOR
- **Status:** Concluída (no-op)
- **Observações:** Já reutiliza `persistCreatedMatch`, igual a `startAndPersistMatch`. Sem duplicar save+ativa.

### Tarefa 26 — Executar suíte completa da feature

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** **96** testes passando (16 arquivos).

### Tarefa 27 — Lint e build

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `npm run lint` e `npm run build` OK.

### Tarefa 28 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Status:** Concluída
- **Observações:** Checklist do `plan.md` §13 atendido (ver §8). Sem UI. `startMatch` não alterado.

## 6. Ciclos de Falha e Reexecução

```text
Tarefa 3: RED — módulo inexistente (esperado)
Tarefa 6: RED — ator fora do turno aceito (esperado)
Tarefa 9: RED — guards de fase/origem ausentes (esperado)
Tarefa 12: RED — wrap D→B lançava TypeError em next.id (esperado)
Tarefa 15: testes N=2/N=6 já verdes (wrap genérico)
Tarefa 18: RED — advancePlayerRound ainda exportado (esperado)
Nenhuma reexecução GREEN por regressão inesperada.
```

## 7. Dúvidas Levantadas Durante a Implementação

Nenhuma. Created rejeita com `INVALID_PHASE` (uma das opções da tarefa 9).

## 8. Validações Finais

- [x] Suíte de testes completa da feature executada com sucesso (`npm test` — 96 testes).
- [x] Lint executado com sucesso.
- [x] Build executado com sucesso.
- [x] Critérios de conclusão do `plan.md` §13 atendidos.
- [x] Nenhum teste foi alterado apenas para "passar"; a migração do skip US-03 está documentada no `tasks.md` §4.

## 9. Itens Pendentes ou Bloqueados

Nenhum.

`AGENTS.md` ainda descreve `advancePlayerRound` na API pública — atualização fica para a etapa de validação, como nas US anteriores.

## 10. Próxima Etapa

Validar a implementação via skill `create-validation`, gerando `docs/validation/us-05-gerenciamento-de-turnos/validation.md`.

Input:

```text
docs/implementation/us-05-gerenciamento-de-turnos/implementation.md
```
