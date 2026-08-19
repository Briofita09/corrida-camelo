# Tarefas de Implementação — US-05 Gerenciamento de turnos

## 1. Contexto

Implementar o gerenciamento de turnos: comando stub `performTurnAction` autoriza só o jogador ativo, avança turno/rodada pela sequência US-03, rejeita skip/`Created`/`Finished`/fora do turno, e persiste o novo ativo sem reexecutar a ação no load — conforme o plano técnico e a spec US-05. Sem UI.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md`
- `docs/plan/us-05-gerenciamento-de-turnos/plan.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md`
- `docs/spec/us-04-fluxo-inicio-partida/spec.md`
- `domain/match/`
- `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Convenções Utilizadas

| Item | Valor |
| --- | --- |
| Branch | `feature/us-05-gerenciamento-de-turnos` (**suposição** — `AGENTS.md` não define convenção; padrão das US-01–04) |
| Base | Branch atual de trabalho / `develop` se for a base do repo |
| Testes | `npm test` (`vitest run`); opcional `npm run test:watch` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Domínio | `domain/match/` — testes colocalizados `*.test.ts` |
| Persistência | `application/match-persistence/` — testes colocalizados `*.test.ts` |
| Runner | Vitest, ambiente `node`; fake/in-memory para storage |
| Comando de domínio | `performTurnAction(state, actorPlayerId)` |
| Orquestração | `performTurnActionAndPersist(state, actorPlayerId, persistence)` |
| Erro de autorização | `NOT_CURRENT_PLAYER` |
| Helpers internos (após refactor) | autorização + próximo turno; **não** exportar como skip |

## 4. Ciclo de Execução

```text
RED → GREEN → REFACTOR → npm test (escopo afetado)
         ↑______________________|
         (se falhar: corrigir implementação, não o teste)
```

Ao final: `npm test` completo + lint + build + checklist do `plan.md` §13.

**Em caso de falha de teste:**

1. Analisar causa (implementação, efeito colateral ou teste divergente da spec/plan).
2. Se implementação: voltar ao GREEN correspondente **sem** alterar o teste.
3. Se o teste parecer incorreto vs spec/plan: parar e perguntar ao usuário.
4. Repetir até passar ou dúvida bloqueante.

**Exceção documentada (plan §11):** testes US-03 que tratam `advancePlayerRound` como skip de sucesso tornam-se **obsoletos** frente à US-05 (RN-07). Migrar asserts de incremento de rodada para o wrap via `performTurnAction`. Não enfraquecer os testes novos de autorização/wrap.

**Ordem obrigatória (plan §9):** primeiro o stub no meio da rodada; depois rejeições; depois wrap e N=2/N=6; só então encerrar o skip público; helpers internos; por último persistência.

Não alterar `startMatch`. Não criar `advanceTurn` / `skipTurn` de sucesso. Não alterar UI em `app/*`.

## 5. Lista de Tarefas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Descrição:** Criar e checkout da branch `feature/us-05-gerenciamento-de-turnos`.
- **Dependências:** Nenhuma
- **Critério de conclusão:** Branch ativa com o nome acordado.

---

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Preparação / Validação
- **Descrição:** Executar `npm test` (deve permanecer verde). Confirmar exports de `@/domain/match` (`startMatch`, `getRoundPlayerSequence`, `validateMatchState`, `identityOrdering`, `advancePlayerRound` ainda público) e `@/application/match-persistence` (`persistCreatedMatch`, `loadMatch` / `getActiveMatch`, `createInMemoryStorage`). Confirmar helper `buildValidFinishedMatch`.
- **Dependências:** Tarefa 1
- **Critério de conclusão:** Suíte verde; APIs disponíveis para extensão.

---

### Tarefa 3 — [RED] Ação válida no meio da rodada

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
Feature: Gerenciamento de turnos
  Scenario: Partida iniciada possui jogador ativo no estado
    Given uma partida válida já iniciada (fase RaceSetup)
    And a ordem base é [A, B, C]
    And playerRoundIndex é 0
    Then currentTurnPlayerId é o identificador de A

  Scenario: Ação válida do jogador ativo avança o turno
    Given uma partida iniciada com ordem [A, B, C]
    And currentTurnPlayerId é A
    And playerRoundIndex é 0
    When A executa a ação de turno
    Then a operação é aceita
    And currentTurnPlayerId passa a ser B
    And playerRoundIndex permanece 0
    And a fase, os camelos, o dinheiro e a ordem de players permanecem iguais
    And a partida de origem permanece inalterada
```

- **Camada de teste:** Unitária (`domain/match/performTurnAction.test.ts`)
- **Descrição:** `identityOrdering` + `createMatch` + `startMatch` (A, B, C). Cobrir: ativo inicial = A (regressão US-04, sem reimplementar início); `performTurnAction(state, "A")` → ativo B, índice 0; fase/`players`/£/camelos/id iguais; input não mutado. Devem falhar enquanto o comando não existir.
- **Rastreabilidade:** Spec §13.1, RF-01–RF-03, RF-08, RN-06, RN-09–RN-10; Plan §9 item 1
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (comando ausente ou turno não avança).

---

### Tarefa 4 — [GREEN] `performTurnAction` avança o próximo da sequência

- **Tipo:** Implementação
- **Descrição:** Implementação mínima: `performTurnAction(state, actorPlayerId)` em `domain/match`. No caminho feliz (RaceSetup, ator = ativo, não último da sequência), novo estado com `currentTurnPlayerId` = próximo de `getRoundPlayerSequence`, `playerRoundIndex` inalterado, cópias de `players`/`camels`, demais campos preservados. Exportar no barrel de `domain/match`. Sem mutar o input. Sem RNG. Sem alterar `startMatch`.
- **Componentes envolvidos:** `performTurnAction`; `getRoundPlayerSequence`
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes da Tarefa 3 passando.

---

### Tarefa 5 — Executar testes (meio da rodada)

- **Tipo:** Validação
- **Descrição:** `npm test` no escopo `domain/match` (pelo menos `performTurnAction.test.ts` e regressão de `startMatch`).
- **Em caso de falha:** Protocolo §4 → Tarefa 4.
- **Dependências:** Tarefa 4
- **Critério de conclusão:** Novos testes verdes; início US-04 intacto.

---

### Tarefa 6 — [RED] Fora do turno e dupla conclusão

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Ação fora do turno é rejeitada
    Given uma partida iniciada cujo jogador ativo é A
    When B executa a ação de turno
    Then a operação é rejeitada
    And currentTurnPlayerId permanece A
    And playerRoundIndex permanece o mesmo

  Scenario: Não se conclui o mesmo turno duas vezes
    Given uma partida iniciada cujo jogador ativo é A
    When A executa a ação de turno com sucesso
    And currentTurnPlayerId passou a ser B
    When A executa a ação de turno novamente
    Then a segunda operação é rejeitada
    And currentTurnPlayerId permanece B
```

- **Camada de teste:** Unitária (`domain/match/performTurnAction.test.ts`)
- **Descrição:** Assertir código `NOT_CURRENT_PLAYER`; estado de origem intacto na rejeição; após sucesso de A, segunda chamada de A não avança de novo. Devem falhar enquanto qualquer ator for aceito.
- **Rastreabilidade:** Spec §13.2, RN-03–RN-04, RN-08, D6, RF-04, RF-06; Plan §9 item 2
- **Dependências:** Tarefa 5
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (autorização ainda frouxa).

---

### Tarefa 7 — [GREEN] Autorizar somente o jogador ativo

- **Tipo:** Implementação
- **Descrição:** Rejeitar quando `actorPlayerId !== currentTurnPlayerId` com `NOT_CURRENT_PLAYER`, sem mutar o estado. A dupla conclusão sai de graça depois do avanço (o ativo já é outro).
- **Componentes envolvidos:** `performTurnAction`
- **Dependências:** Tarefa 6
- **Critério de conclusão:** Testes da Tarefa 6 passando.

---

### Tarefa 8 — Executar testes (autorização)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/performTurnAction.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 7.
- **Dependências:** Tarefa 7
- **Critério de conclusão:** Autorização e duplo avanço verdes.

---

### Tarefa 9 — [RED] Created, Finished, fase que não admite e origem inválida

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Partida encerrada não admite ação de turno
    Given uma partida na fase Finished
    When qualquer jogador executa a ação de turno
    Then a operação é rejeitada
    And o estado permanece o mesmo

  Scenario: Encerrar a partida impede ações subsequentes
    Given uma partida que admite ações de turno
    And em seguida a partida está na fase Finished
    When se tenta executar a ação de turno
    Then a operação é rejeitada

  Scenario: Partida Created não admite ação de turno
    Given uma partida na fase Created
    When um jogador tenta executar a ação de turno
    Then a operação é rejeitada
    And currentTurnPlayerId permanece nulo
```

- **Camada de teste:** Unitária (`domain/match/performTurnAction.test.ts`)
- **Descrição:** Usar `buildValidFinishedMatch` e `createMatch` (Created). Cobrir: `Finished` → `MATCH_FINISHED`; `Created` → rejeição (`INVALID_PHASE` ou `INVALID_TURN`); pelo menos uma fase que não admite nesta US (`LegSetup`, `LegPayout` ou `FinalPayout`) → rejeitada; origem que falha `validateMatchState` (ex. lista de camelos incompleta) → rejeitada, sem avanço. Snapshot do input intacto.
- **Rastreabilidade:** Spec §7, §13.5, RN-05, RN-11–RN-14, RF-07; Plan §9 item 2
- **Dependências:** Tarefa 8
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (guards ausentes).

---

### Tarefa 10 — [GREEN] Guards de fase e validação

- **Tipo:** Implementação
- **Descrição:** Fluxo do plan §5.1 item 2: `Finished` primeiro (`MATCH_FINISHED`); depois `validateMatchState`; depois recusar fases que não admitem ação (`Created` e demais fora de `RaceSetup` / `LegInProgress`). Sem produzir estado parcial. Opcional nesta fatia: aceitar também `LegInProgress` com turno válido, se o teste da Tarefa 9 exigir.
- **Componentes envolvidos:** `performTurnAction`; `validateMatchState`
- **Dependências:** Tarefa 9
- **Critério de conclusão:** Testes da Tarefa 9 passando.

---

### Tarefa 11 — Executar testes (guards)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (ação de turno + `startMatch` / `validateMatchState` se tocados).
- **Em caso de falha:** Protocolo §4 → Tarefa 10.
- **Dependências:** Tarefa 10
- **Critério de conclusão:** Guards verdes; regressão de início/validação intacta.

---

### Tarefa 12 — [RED] Wrap da rodada (último → primeiro da próxima)

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Último jogador da rodada 0 cede a vez ao primeiro da rodada 1
    Given uma partida iniciada com ordem base [A, B, C, D]
    And playerRoundIndex é 0
    And currentTurnPlayerId é D
    When D executa a ação de turno
    Then a operação é aceita
    And playerRoundIndex passa a ser 1
    And currentTurnPlayerId passa a ser B
    And o array players permanece [A, B, C, D]
```

- **Camada de teste:** Unitária (`domain/match/performTurnAction.test.ts`)
- **Descrição:** Quatro jogadores identidade A–D. Levar o ativo até D com ações válidas **ou** partir de estado iniciado e aplicar ações A,B,C antes. Assertir após D: índice 1 e ativo **B** (não A). `players` estável. Deve falhar se o wrap for ciclo simples D→A.
- **Rastreabilidade:** Spec §8, §13.3, D3, RF-03, RF-08; Plan §9 item 3
- **Dependências:** Tarefa 11
- **Critério de conclusão:** Teste criado e falhando pelo motivo esperado (wrap US-03 ainda não implementado).

---

### Tarefa 13 — [GREEN] Avançar rodada só no último da sequência

- **Tipo:** Implementação
- **Descrição:** Aplicar spec §8: localizar `k` do ativo em `getRoundPlayerSequence(players, r)`; se último, `playerRoundIndex = r + 1` e ativo = primeiro da sequência `r+1`. Se o ativo não estiver em `S`, rejeitar `INVALID_TURN`. Não reordenar `players`.
- **Componentes envolvidos:** `performTurnAction`; `getRoundPlayerSequence`
- **Dependências:** Tarefa 12
- **Critério de conclusão:** Testes da Tarefa 12 passando.

---

### Tarefa 14 — Executar testes (wrap)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/performTurnAction.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 13.
- **Dependências:** Tarefa 13
- **Critério de conclusão:** Wrap D→B verde; meio da rodada A→B continua verde.

---

### Tarefa 15 — [RED] Dois jogadores (D14) e seis jogadores

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Partida com dois jogadores avança e fecha a rodada
    Given uma partida iniciada com ordem base [A, B]
    And playerRoundIndex é 0
    And currentTurnPlayerId é A
    When A executa a ação de turno
    Then currentTurnPlayerId passa a ser B
    And playerRoundIndex permanece 0
    When B executa a ação de turno
    Then playerRoundIndex passa a ser 1
    And currentTurnPlayerId passa a ser B

  Scenario: Partida com seis jogadores percorre a sequência da rodada 0
    Given uma partida iniciada com ordem base [A, B, C, D, E, F]
    And playerRoundIndex é 0
    And currentTurnPlayerId é A
    When cada jogador da sequência A, B, C, D, E executa a ação na sua vez
    Then currentTurnPlayerId é F
    And playerRoundIndex permanece 0
    When F executa a ação de turno
    Then playerRoundIndex passa a ser 1
    And currentTurnPlayerId passa a ser B
```

- **Camada de teste:** Unitária (`domain/match/performTurnAction.test.ts`)
- **Descrição:** N=2: após B na rodada 0 o ativo é **B** de novo (não “corrigir” para A). N=6: um humano + bots, `identityOrdering`. Deve falhar se o wrap N=2 for tratado como anomalia.
- **Rastreabilidade:** Spec §13.4, D14, RF-10; Plan §9 item 4
- **Dependências:** Tarefa 14
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado, ou já verdes se o wrap da Tarefa 13 for genérico — neste caso registrar que a Tarefa 16 é no-op e seguir.

---

### Tarefa 16 — [GREEN] Generalizar wrap para N=2 e N=6

- **Tipo:** Implementação
- **Descrição:** Garantir que o cálculo da Tarefa 13 vale para qualquer N em 2–6, sem regra especial que evite turno consecutivo. Implementação mínima; se os testes da Tarefa 15 já passam, não adicionar lógica extra.
- **Componentes envolvidos:** `performTurnAction`
- **Dependências:** Tarefa 15
- **Critério de conclusão:** Testes da Tarefa 15 passando.

---

### Tarefa 17 — Executar testes (bordas N)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match`.
- **Em caso de falha:** Protocolo §4 → Tarefa 16.
- **Dependências:** Tarefa 16
- **Critério de conclusão:** N=2 e N=6 verdes; suíte de domínio da ação verde.

---

### Tarefa 18 — [RED] Sem avanço de turno/rodada sem ação válida

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Não se avança o turno sem ação válida
    Given uma partida iniciada cujo jogador ativo é A
    When se tenta avançar o turno sem uma ação de turno aceita
    Then a operação é rejeitada
    And currentTurnPlayerId permanece A
```

- **Camada de teste:** Unitária (`domain/match/performTurnAction.test.ts` e ajuste de `advancePlayerRound.test.ts`)
- **Descrição:** Cobrir RN-07: não existe comando público de sucesso que só incremente rodada/turno. (a) `advancePlayerRound` deixa de ser skip de sucesso — remover ou inverter o teste que espera incremento sem ação; manter regressão “`startMatch` não reordena”. (b) `performTurnAction` de quem não é o ativo não muda o turno (já na Tarefa 6; reforçar se necessário). O RED deste item é a suíte atual de skip **passando de forma incompatível** com a US-05 — o próximo GREEN encerra o export.
- **Rastreabilidade:** Spec §13.2, D5, RN-07, RF-05; Plan §9 item 5
- **Dependências:** Tarefa 17
- **Critério de conclusão:** Testes de produto alinhados à US-05 escritos; o skip público deixa de ser o contrato esperado.

---

### Tarefa 19 — [GREEN] Encerrar skip público `advancePlayerRound`

- **Tipo:** Implementação
- **Descrição:** Remover `advancePlayerRound` da API pública (`domain/match/index.ts`). Não manter comando de sucesso que só avança rodada. O incremento de `playerRoundIndex` permanece apenas no fluxo de `performTurnAction` quando o ator é o último da sequência. Atualizar testes US-03 obsoletos nesta fatia (plan §11): o incremento passa a ser coberto pelo wrap já testado. Não exportar helper de próximo turno.
- **Componentes envolvidos:** `advancePlayerRound`; `index.ts` de `domain/match`; testes US-03 de skip
- **Dependências:** Tarefa 18
- **Critério de conclusão:** Nenhum import público de skip; testes da Tarefa 18 e wrap verdes.

---

### Tarefa 20 — Executar testes (fim do skip + regressão US-03)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (incluindo `playerRoundIndex.test.ts`, `playerOrdering.test.ts`, `advancePlayerRound.test.ts` se ainda existir como regressão de `startMatch`).
- **Em caso de falha:** Protocolo §4 → Tarefa 19. Se a falha for só teste US-03 de skip ainda esperando sucesso: completar a migração da Tarefa 18/19, sem enfraquecer wrap.
- **Dependências:** Tarefa 19
- **Critério de conclusão:** Domínio verde; ordem base e `playerRoundIndex` de criação/serialize intactos.

---

### Tarefa 21 — [REFACTOR] Helpers internos de autorização e próximo turno

- **Tipo:** Refatoração
- **Descrição:** Extrair do stub (plan RNF-06 / §5.1 item 4): (1) autorização (Finished → validate → fase admite → ator = ativo); (2) aplicar próximo turno/rodada. Colocalizar em `domain/match`. O stub `performTurnAction` só autoriza e aplica — sem regra de mesa. **Não** exportar os helpers no barrel público. Testes existentes permanecem verdes; comportamento externo inalterado.
- **Dependências:** Tarefa 20
- **Critério de conclusão:** Testes de `performTurnAction` verdes após a extração; API pública continua só o stub (+ APIs já existentes, sem skip).

---

### Tarefa 22 — [RED] Persistir após ação aceita; load sem reexecutar

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Persistência do turno após ação válida
    Given uma partida iniciada em que A concluiu a ação de turno com sucesso
    And o ativo passou a ser B
    When o estado é persistido e depois restaurado
    Then currentTurnPlayerId restaurado é B
    And playerRoundIndex é o mesmo
    And nenhuma nova ação nem avanço extra ocorre
```

- **Camada de teste:** Unitária/aplicação (`application/match-persistence/performTurnActionAndPersist.test.ts` ou extensão do teste de persistência existente)
- **Descrição:** Storage in-memory. Cobrir: (1) sucesso → `loadMatch` / `getActiveMatch` com mesmo ativo e `playerRoundIndex`; load **não** chama `performTurnAction` (turno não “anda” sozinho); (2) ator fora do turno → erro de domínio e storage **sem** avanço (ainda o ativo anterior); (3) `Finished` rejeitado sem write de avanço. Reutilizar `persistCreatedMatch` na orquestração (plan §5.1 item 9).
- **Rastreabilidade:** Spec §13.5, D11, RN-15, RF-09; Plan §9 item 7
- **Dependências:** Tarefa 21
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (orquestração ausente).

---

### Tarefa 23 — [GREEN] `performTurnActionAndPersist`

- **Tipo:** Implementação
- **Descrição:** Orquestração: `performTurnAction(state, actorPlayerId)`; se erro, retornar sem I/O; se ok, `saveMatch` + `setActiveMatchId` via `persistCreatedMatch`. Exportar em `application/match-persistence`. Domínio sem `localStorage`; aplicação sem React/Next.
- **Componentes envolvidos:** `performTurnActionAndPersist`; `MatchPersistence`; `performTurnAction`
- **Dependências:** Tarefa 22
- **Critério de conclusão:** Testes da Tarefa 22 passando.

---

### Tarefa 24 — Executar testes (persistência do turno)

- **Tipo:** Validação
- **Descrição:** `npm test` em `application/match-persistence` (e domínio se afetado).
- **Em caso de falha:** Protocolo §4 → Tarefa 23.
- **Dependências:** Tarefa 23
- **Critério de conclusão:** Persistência do avanço verde; load sem reexecutar ação.

---

### Tarefa 25 — [REFACTOR] Orquestração de persistência

- **Tipo:** Refatoração
- **Descrição:** Evitar duplicar save+ativa se `persistCreatedMatch` já serve (mesmo padrão de `startAndPersistMatch`). Garantir `application/` sem React/Next e `domain/` sem `application/`. Testes permanecem verdes. Sem mudar contrato.
- **Dependências:** Tarefa 24
- **Critério de conclusão:** Testes de persistência verdes após refatoração.

---

### Tarefa 26 — Executar suíte completa da feature

- **Tipo:** Validação
- **Descrição:** `npm test` (match + match-config + match-persistence).
- **Em caso de falha:** Protocolo §4 → implementação correspondente.
- **Dependências:** Tarefa 25
- **Critério de conclusão:** Suíte completa verde.

---

### Tarefa 27 — Lint e build

- **Tipo:** Validação
- **Descrição:** Executar `npm run lint` e `npm run build`.
- **Em caso de falha:** Corrigir problemas introduzidos pela feature; não desabilitar regras sem necessidade.
- **Dependências:** Tarefa 26
- **Critério de conclusão:** Lint e build OK.

---

### Tarefa 28 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Descrição:** Conferir checklist do `plan.md` §13 e aceite da `spec.md` §12 (ativo no estado, avanço US-03, wrap D→B, D14, N=6, fora do turno, sem skip, `Finished`/`Created`, persistência sem reexecutar, sem UI). Registrar evidências na etapa de `implementation.md` (próxima skill).
- **Dependências:** Tarefa 27
- **Critério de conclusão:** Itens do plan §13 atendidos ou gaps explícitos reportados ao usuário.

## 6. Validações Finais

- [ ] Suíte de testes completa da feature executada com sucesso (`npm test`).
- [ ] Lint e build executados com sucesso.
- [ ] Critérios de conclusão do `plan.md` §13 atendidos.
- [ ] Critérios de aceite da `spec.md` §12 cobertos pelos testes.
- [ ] Nenhum teste foi alterado apenas para “passar” sem justificativa vs spec/plan (migração de skip US-03 está documentada na §4).
- [ ] Domínio sem React/Next/`localStorage`; persistência só em `application/`.
- [ ] Sem UI, sem `startMatch` alterado, sem skip público de turno/rodada.

## 7. Rastreabilidade resumida

| Spec / plano | Tarefas |
| --- | --- |
| §13.1 ação válida no meio da rodada | 3 → 4 → 5 |
| §13.2 fora do turno e duplo avanço | 6 → 7 → 8 |
| §13.5 Created / Finished / origem inválida | 9 → 10 → 11 |
| §13.3 wrap US-03 (D→B) | 12 → 13 → 14 |
| §13.4 N=2 (D14) e N=6 | 15 → 16 → 17 |
| §13.2 / RN-07 fim do skip | 18 → 19 → 20 |
| RNF-06 helpers internos | 21 |
| §13.5 persistência | 22 → 23 → 24 |
| Plan §9 item 8 suíte + aceite | 26 → 27 → 28 |

## 8. Próxima Etapa

Implementar as tarefas deste arquivo via skill `create-implementation`, gerando `docs/implementation/us-05-gerenciamento-de-turnos/implementation.md`, e em seguida validar com `create-validation`.

Input desta etapa:

```text
docs/tasks/us-05-gerenciamento-de-turnos/tasks.md
```
