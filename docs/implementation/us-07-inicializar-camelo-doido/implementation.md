# Relatório de Implementação — US-07 Inicializar camelo doido

## 1. Contexto

Implementação do posicionamento do camelo doido como passo automático de `startMatch`, **depois** das posições dos camelos de corrida (US-06): `Crazy` sozinho no espaço **7**, sentido `TowardStart` intacto, sem dono e sem campo extra de desclassificação — conforme `spec.md`, `plan.md` e `tasks.md` da US-07. Persistência restaura o estado; o load **não** recoloca o doido. Sem UI e sem movimento oficial do doido.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-07-inicializar-camelo-doido/spec.md`
- `docs/plan/us-07-inicializar-camelo-doido/plan.md`
- `docs/tasks/us-07-inicializar-camelo-doido/tasks.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Branch Utilizada

- **Nome da branch:** `feature/us-07-inicializar-camelo-doido`
- **Branch base:** `develop`

## 4. Resumo da Execução

**Status:** Concluído.

Entregue:

1. **Constante** `CRAZY_INITIAL_SPACE = 7` (exportada no barrel, como `START_SPACE`).
2. **Helper interno** `placeCrazyCamel`: Crazy sozinho no espaço 7, sentido copiado, `stackOrder` de casa vazia, demais camelos intactos; **não** exportado.
3. **`startMatch`** chama o helper **depois** de `determineInitialCamelPositions`. `Created` permanece com os 6 no espaço 0.
4. **Validação:** camelos de corrida exigem `TowardFinish`; `RaceSetup` **não** fixa Crazy no 7; Crazy `TowardStart` continua obrigatório.
5. **Contrato de pilha** caracterizado em `applyRacingCardMove` (cima / meio / baixo) — sem cartas pretas.
6. **Persistência** inalterada na orquestração; load restaura Crazy no 7 sem reexecutar o início.
7. **`AGENTS.md`** alinhado: lacuna da casa 7 fechada; instrução 16 atualizada.

**Testes:** 130 passando / 19 arquivos (baseline 117 / 18). Lint e build OK.

## 5. Tarefas Executadas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Status:** Concluída
- **Observações:** Branch criada a partir de `develop`.

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado da execução dos testes:** Baseline **117** testes verdes (18 arquivos). APIs confirmadas: `startMatch`, `createMatch`, helpers internos, `validateMatchState` (já não exige Crazy no 0 em `RaceSetup`), serialize, `performTurnAction`, `startAndPersistMatch`, `createInMemoryStorage`.

### Tarefa 3 — [RED] Helper posiciona Crazy sozinho no espaço 7

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos criados:** `domain/match/placeCrazyCamel.test.ts`
- **Resultado:** Falhou como esperado (`Cannot find module './placeCrazyCamel'`).

### Tarefa 4 — [GREEN] Constante `CRAZY_INITIAL_SPACE` e helper interno

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos criados:** `domain/match/placeCrazyCamel.ts`
- **Arquivos alterados:** `domain/match/constants.ts`, `domain/match/index.ts` (só a constante)
- **Resultado da execução dos testes:** Passou. Helper **não** ligado a `startMatch` nesta tarefa.

### Tarefa 5 — Executar testes (helper)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `placeCrazyCamel.test.ts` verde; `startMatch.test.ts` ainda com Crazy no 0 (suíte US-06 intacta).

### Tarefa 6 — [REFACTOR] Helper de posicionamento

- **Tipo:** REFACTOR
- **Status:** Concluída
- **Observações:** Cópia imutável em um único `map`; `stackOrder` 0 em casa vazia; sentido copiado via spread. Testes do helper verdes.

### Tarefa 7 — [RED] `startMatch` posiciona Crazy na casa 7 após os de corrida

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.test.ts`
- **Observações:** Asserts pós-sucesso migrados de Crazy no 0 para espaço 7 + `TowardStart` + sozinho no 7 (exceção documentada no `tasks.md` §4). Posições dos de corrida, fase, turno, £3, cartas 5+25 e input `Created` intactos.
- **Resultado:** Falhou como esperado (`expected 0 to be 7`).

### Tarefa 8 — [GREEN] Ligar o helper ao `startMatch` após a US-06

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.ts`
- **Observações:** `placeCrazyCamel` após `determineInitialCamelPositions`. Guards US-04/US-06 inalterados. Sem comando público novo.
- **Resultado da execução dos testes:** Passou.

### Tarefa 9 — Executar testes (início com Crazy no 7)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `startMatch.test.ts`, `placeCrazyCamel.test.ts` e `applyRacingCardMove.test.ts` verdes. Movimento a partir do 0 continua sem carregar Crazy.

### Tarefa 10 — [RED] Created no 0; identidade, sem dono e sentidos

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `createMatch.test.ts`, `startMatch.test.ts`, `validateMatchState.test.ts`
- **Observações:** Created (Crazy no 0 / `TowardStart`) já verde (regressão US-01, não enfraquecida). Identidade/sem dono após o início já verdes. Reforço `TowardFinish` nos de corrida falhou como esperado (`validateMatchState` ainda aceitava Yellow `TowardStart`).

### Tarefa 11 — [GREEN] Reforçar sentidos dos de corrida; sem campos novos

- **Tipo:** GREEN
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/validateMatchState.ts`
- **Observações:** Dual do check Crazy → `TowardStart`. Sem `owner` / `playerId` / `disqualified`. `createMatch` intocado.
- **Resultado da execução dos testes:** Passou.

### Tarefa 12 — Executar testes (Created, identidade, sentidos)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Created no 0, identidade/sentidos e início com Crazy no 7 verdes.

### Tarefa 13 — [RED] Segundo início e falha atômica não reposicionam o doido

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/startMatch.test.ts`
- **Observações:** Asserts explícitos de Crazy nas rejeições (segundo início no 7; sequência inválida no 0). Já verdes após a Tarefa 8 (imutabilidade + `INVALID_PHASE`).

### Tarefa 14 — [GREEN] Preservar Crazy nas rejeições

- **Tipo:** GREEN
- **Status:** Concluída
- **Observações:** **No-op.** Guards atuais bastaram; nenhum caminho mutava o input.

### Tarefa 15 — Executar testes (rejeições)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `startMatch.test.ts` verde.

### Tarefa 16 — [RED] Crazy participa da mesma regra de pilha (caracterização)

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/applyRacingCardMove.test.ts`
- **Observações:** Fixtures montadas (não via `startMatch`): Crazy por baixo (quem chega sobe); Crazy por cima levado rumo à chegada; Crazy no meio. Comentário explícito: **não** é o movimento oficial do doido. Já verdes no helper existente.

### Tarefa 17 — [GREEN] Não excluir Crazy da pilha

- **Tipo:** GREEN
- **Status:** Concluída
- **Observações:** **No-op.** `applyRacingCardMove` não filtra `id === "Crazy"`. Sem cartas pretas.

### Tarefa 18 — Executar testes (pilha / caracterização)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Caracterização verde; inicialização continua com Crazy sozinho no 7.

### Tarefa 19 — [RED] Validação permanente não fixa o espaço 7 em RaceSetup

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `validateMatchState.test.ts`, `serialize.test.ts`
- **Observações:** RaceSetup válido com Crazy no 7, no 0 (legado US-06) e no 5; Crazy `TowardFinish` rejeitado; round-trip JSON com Crazy no 7; Created recusa camelo fora do 0. Já verdes (validação permanente não exigia o 7).

### Tarefa 20 — [GREEN] Não exigir Crazy no 7 em `validateMatchState`

- **Tipo:** GREEN
- **Status:** Concluída
- **Observações:** **No-op.** Sem migração de JSON legado; sem default de recolocar no 7 na hidratação.

### Tarefa 21 — Executar testes (validate/serialize)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Validate/serialize verdes; `startMatch` continua colocando Crazy no 7.

### Tarefa 22 — [RED] Stub de turno preserva Crazy no 7

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `domain/match/performTurnAction.test.ts`
- **Observações:** Sequência injetada + ação do jogador ativo. Já verde (`applyNextTurn` copia `camels`).

### Tarefa 23 — [GREEN] Preservar camelos no stub

- **Tipo:** GREEN
- **Status:** Concluída
- **Observações:** **No-op.** Cópia existente preserva espaço e sentido.

### Tarefa 24 — Executar testes (turno)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** Stub preserva Crazy no 7; domínio de turno verde.

### Tarefa 25 — [RED] Persistência: load não recoloca o doido nem inverte o sentido

- **Tipo:** RED
- **Status:** Concluída
- **Arquivos alterados:** `application/match-persistence/startAndPersistMatch.test.ts`
- **Observações:** Asserts de Crazy no 7 / `TowardStart` em `getActiveMatch` e `loadMatch`; falha de início deixa Crazy no 0; segundo `startAndPersistMatch` não corrompe o 7. Já verdes com o domínio novo.

### Tarefa 26 — [GREEN] Orquestração de persistência inalterada

- **Tipo:** GREEN
- **Status:** Concluída
- **Observações:** **No-op.** Load continua só `deserialize`; domínio sem `localStorage`.

### Tarefa 27 — Executar testes (persistência)

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `application/match-persistence` verde.

### Tarefa 28 — [REFACTOR] Barrel, independência e documentação estável

- **Tipo:** REFACTOR
- **Status:** Concluída
- **Arquivos alterados:** `AGENTS.md`, `domain/match/index.ts` (constante já exportada na Tarefa 4)
- **Observações:** Barrel exporta `CRAZY_INITIAL_SPACE`; **não** exporta `placeCrazyCamel`, `applyRacingCardMove` nem `determineInitialCamelPositions`. Lacuna “Crazy permanece no espaço 0” fechada; tabela US-06 refinada; seção US-07; contrato de pilha e ranking futuro; instrução 16 (casa 7 tem spec; não reverter Crazy para o 0 após o início; não alterar `MIN_MONEY`).

### Tarefa 29 — Executar suíte completa da feature

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** **130** testes / 19 arquivos, todos verdes.

### Tarefa 30 — Lint e build

- **Tipo:** Validação
- **Status:** Concluída
- **Resultado:** `npm run lint` OK. `npm run build` OK (Next.js 16.3.1).

### Tarefa 31 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Status:** Concluída
- **Observações:** Checklist do `plan.md` §13 e aceite da `spec.md` §16 atendidos (Crazy no 7 após início, Created no 0, sentido contrário permanente, sem dono, não é camelo de corrida, desclassificado por identidade, sozinho no 7, pilha só como caracterização, reload sem recolocar, sem UI). Sem gaps.

## 6. Ciclos de Falha e Reexecução

```text
Tarefa 3: RED esperado — módulo placeCrazyCamel ausente
Tarefa 7: RED esperado — Crazy ainda no espaço 0 após startMatch
Tarefa 10: RED esperado — Yellow TowardStart ainda aceito em validateMatchState
Tarefas 14, 17, 20, 23, 26: GREEN no-op (já verdes após implementação anterior)
Nenhuma reexecução corretiva da implementação foi necessária.
```

## 7. Dúvidas Levantadas Durante a Implementação

Nenhuma dúvida bloqueante. Decisões técnicas seguiram o `plan.md` (`CRAZY_INITIAL_SPACE`, helper interno `placeCrazyCamel`, `stackOrder` de casa vazia, desclassificação por identidade).

## 8. Validações Finais

- [x] Suíte de testes completa da feature executada com sucesso (130 testes).
- [x] Lint/format executados com sucesso (`npm run lint`).
- [x] Build executado com sucesso (`npm run build`).
- [x] Critérios de conclusão do `plan.md` §13 atendidos.
- [x] Nenhum teste foi alterado apenas para “passar” sem justificativa registrada (migração dos asserts de Crazy no 0 após início documentada no `tasks.md` §4).

## 9. Itens Pendentes ou Bloqueados

Nenhum.

## 10. Próxima Etapa

Validar a implementação com a skill `create-validation`, usando este arquivo como registro do que foi implementado.

```text
docs/implementation/us-07-inicializar-camelo-doido/implementation.md
  ↓
docs/validation/us-07-inicializar-camelo-doido/validation.md
```
