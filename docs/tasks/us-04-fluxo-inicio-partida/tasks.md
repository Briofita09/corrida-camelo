# Tarefas de Implementação — US-04 Fluxo de início da partida

## 1. Contexto

Implementar o fluxo de início de uma partida já criada (`Created` → `RaceSetup`): definir o primeiro turno, preservar o estado inicial da corrida, rejeitar origens/fases inválidas e estado parcial, e persistir o estado iniciado sem re-iniciar nem resortear — conforme o plano técnico e a spec US-04. Sem UI.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-04-fluxo-inicio-partida/spec.md`
- `docs/plan/us-04-fluxo-inicio-partida/plan.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `docs/spec/us-02-configuracao-nova-partida/spec.md`
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md`
- `domain/match/`
- `domain/match-config/`
- `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Convenções Utilizadas

| Item | Valor |
| --- | --- |
| Branch | `feature/us-04-fluxo-inicio-partida` (**suposição** — `AGENTS.md` não define convenção; padrão das US-01–03) |
| Base | Branch atual de trabalho / `develop` se for a base do repo |
| Testes | `npm test` (`vitest run`); opcional `npm run test:watch` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Domínio | `domain/match/` — testes colocalizados `*.test.ts` |
| Config | `domain/match-config/` — testes de fluxo leves |
| Persistência | `application/match-persistence/` — testes colocalizados `*.test.ts` |
| Runner | Vitest, ambiente `node`; fake/in-memory para storage |

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

**Ordem obrigatória (plan §9):** primeiro `startMatch` define o turno; só depois apertar `validateMatchState` para `RaceSetup` exigir turno — senão o `startMatch` atual (turno nulo) quebra a validação.

Não criar `startFromConfig`. Não introduzir fase `in_progress`. Não alterar UI em `app/*`.

## 5. Lista de Tarefas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Descrição:** Criar e checkout da branch `feature/us-04-fluxo-inicio-partida`.
- **Dependências:** Nenhuma
- **Critério de conclusão:** Branch ativa com o nome acordado.

---

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Preparação / Validação
- **Descrição:** Executar `npm test` (deve permanecer verde). Confirmar exports de `@/domain/match` (`startMatch`, `validateMatchState`, serialize/deserialize, `identityOrdering`) e `@/application/match-persistence` (`createMatchPersistence`, `persistCreatedMatch`, `loadMatch` / `getActiveMatch`).
- **Dependências:** Tarefa 1
- **Critério de conclusão:** Suíte verde; APIs disponíveis para extensão.

---

### Tarefa 3 — [RED] `startMatch` produz estado inicial completo

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
Feature: Fluxo de início da partida
  Scenario: Iniciar partida Created válida
    Given uma configuração válida já transformada em partida na fase Created
    And a ordem base é [A, B, C]
    And todos os jogadores têm 3 libras
    And os 6 camelos estão no espaço 0
    And currentTurnPlayerId é nulo
    When o domínio inicia a partida
    Then a operação é aceita
    And a fase passa a ser RaceSetup
    And os jogadores continuam sendo exatamente A, B e C na mesma ordem
    And currentTurnPlayerId é o identificador de A
    And playerRoundIndex permanece 0
    And o dinheiro de cada jogador permanece 3
    And os camelos permanecem no espaço 0 com pilha válida
    And a partida Created de origem permanece inalterada

  Scenario: Início determinístico
    Given a mesma partida Created válida
    When o início é executado duas vezes de forma independente sobre cópias idênticas
    Then os estados iniciados resultantes são semanticamente equivalentes
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`)
- **Descrição:** Usar `identityOrdering` (A, B, C). Cobrir spec §7: turno = `players[0].id`; preservação de elenco/dificuldades/camelos/£3/`playerRoundIndex`; input não mutado; determinismo entre cópias. Devem falhar enquanto o turno permanecer nulo.
- **Rastreabilidade:** Spec §7, §13.1, §13.5, RF-01, RF-03, RF-04, D3–D6, D13; Plan §9 item 1
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (turno ainda nulo / preservação incompleta).

---

### Tarefa 4 — [GREEN] `startMatch` define turno e preserva estado

- **Tipo:** Implementação
- **Descrição:** Implementação mínima: no sucesso, `phase: "RaceSetup"`, `currentTurnPlayerId = state.players[0].id`, cópias de `players`/`camels`, demais campos preservados. Sem RNG, sem `advancePlayerRound`, sem mutar o input. Se testes antigos assumirem turno nulo após início, atualizar **asserts obsoletos** nesta fatia (plan §11), sem enfraquecer os testes da Tarefa 3.
- **Componentes envolvidos:** `startMatch`
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes da Tarefa 3 passando.

---

### Tarefa 5 — Executar testes (`startMatch` sucesso)

- **Tipo:** Validação
- **Descrição:** `npm test` no escopo `domain/match` (ou suíte completa).
- **Em caso de falha:** Protocolo §4 → Tarefa 4.
- **Dependências:** Tarefa 4
- **Critério de conclusão:** Novos testes verdes; regressão US-01/US-03 de `startMatch`/serialize/`advancePlayerRound` analisada.

---

### Tarefa 6 — [RED] Rejeições de segundo início, andamento e encerrada

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Tentar iniciar duas vezes a mesma partida
    Given uma partida válida que já foi iniciada com sucesso (fase RaceSetup)
    When o domínio tenta iniciar a partida novamente
    Then a operação é rejeitada
    And a fase permanece RaceSetup
    And currentTurnPlayerId permanece o definido no primeiro início

  Scenario: Tentar iniciar partida já em andamento
    Given uma partida na fase RaceSetup ou posterior, exceto Finished
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada
    And a fase permanece inalterada

  Scenario: Tentar iniciar partida encerrada
    Given uma partida na fase Finished
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada
    And o estado permanece o mesmo
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`)
- **Descrição:** Estender testes US-01: segundo início preserva turno; cobrir pelo menos mais uma fase de andamento (ex.: `LegInProgress`); `Finished` com snapshot. Parte pode já passar após a Tarefa 4 — não inventar implementação extra se já estiver verde pelo motivo certo (`INVALID_PHASE` / `MATCH_FINISHED`).
- **Rastreabilidade:** Spec §13.3, RN-10–RN-12, RF-05; Plan §9 item 2
- **Dependências:** Tarefa 5
- **Critério de conclusão:** Casos de rejeição de fase cobertos; falha só se o comportamento ainda divergir da spec.

---

### Tarefa 7 — [GREEN] Completar rejeições de fase (se necessário)

- **Tipo:** Implementação
- **Descrição:** Ajuste mínimo em `startMatch` se a Tarefa 6 falhar (guards `Finished` → `MATCH_FINISHED`; demais ≠ `Created` → `INVALID_PHASE`; sem mutar input). Se os testes já passarem, registrar e seguir.
- **Componentes envolvidos:** `startMatch`
- **Dependências:** Tarefa 6
- **Critério de conclusão:** Testes da Tarefa 6 passando.

---

### Tarefa 8 — Executar testes (rejeições de fase)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match`.
- **Em caso de falha:** Protocolo §4 → Tarefa 7.
- **Dependências:** Tarefa 7
- **Critério de conclusão:** Rejeições de fase verdes.

---

### Tarefa 9 — [RED] Início rejeitado se `Created` é inválida

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Falha durante a inicialização
    Given uma partida Created que não satisfaz os invariantes necessários para iniciar
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada
    And não existe estado iniciado aceito
    And a partida Created de origem permanece intacta
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`)
- **Descrição:** Montar `Created` com invariante quebrado (ex.: lista de camelos incompleta). `startMatch` deve rejeitar **sem** produzir `RaceSetup`. Hoje tende a transitar só pela fase — o teste deve falhar até validar antes de iniciar.
- **Rastreabilidade:** Spec §13.4, RN-02, RN-13, RF-06; Plan §9 item 3
- **Dependências:** Tarefa 8
- **Critério de conclusão:** Teste criado e falhando pelo motivo esperado.

---

### Tarefa 10 — [GREEN] Validar estado antes de transitar

- **Tipo:** Implementação
- **Descrição:** Após os guards de fase, chamar `validateMatchState`; se inválido, retornar o erro e não construir `RaceSetup`.
- **Componentes envolvidos:** `startMatch`; `validateMatchState`
- **Dependências:** Tarefa 9
- **Critério de conclusão:** Testes da Tarefa 9 passando.

---

### Tarefa 11 — Executar testes (`Created` inválida)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match`.
- **Em caso de falha:** Protocolo §4 → Tarefa 10.
- **Dependências:** Tarefa 10
- **Critério de conclusão:** Início de `Created` inválida rejeitado; caminho feliz intacto.

---

### Tarefa 12 — [RED] Estado parcialmente iniciado rejeitado (D14)

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Estado parcialmente inicializado não é aceito
    Given um estado com fase RaceSetup mas sem currentTurnPlayerId
    Or com currentTurnPlayerId definido mas fase ainda Created
    Or com lista de jogadores ou camelos incompleta após um “início”
    When o domínio valida ou tenta persistir/usar esse estado como partida iniciada
    Then o estado é rejeitado como inválido para partida iniciada
```

- **Camada de teste:** Unitária (`domain/match/validateMatchState.test.ts`; deserialize via `serialize.test.ts` se couber)
- **Descrição:** `Created` + turno não nulo → rejeitar; `RaceSetup` + turno nulo → rejeitar; `RaceSetup` + turno de jogador existente → aceitar (não exigir que seja sempre `players[0]` na validação). Listas incompletas já devem falhar (regressão). **Não** hidratar turno ausente em `RaceSetup`.
- **Rastreabilidade:** Spec §13.4, D14, RN-14; Plan §9 item 4
- **Dependências:** Tarefa 11
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (hoje `RaceSetup` com turno nulo ainda é aceito).

---

### Tarefa 13 — [GREEN] Regras de turno × fase em `validateMatchState`

- **Tipo:** Implementação
- **Descrição:** `Created` exige `currentTurnPlayerId === null`; `RaceSetup` exige turno string de um `players[].id`. Manter regra de `LegInProgress` da US-01. Deserialize/validate rejeitam `RaceSetup` legado sem turno.
- **Componentes envolvidos:** `validateMatchState` (e caminho deserialize que já delega a validate)
- **Dependências:** Tarefa 12
- **Critério de conclusão:** Testes da Tarefa 12 passando.

---

### Tarefa 14 — Executar testes (validate + serialize pós-início)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match`. Confirmar round-trip após `startMatch` inclui fase `RaceSetup` e o mesmo `currentTurnPlayerId` (Plan §9 item 5).
- **Em caso de falha:** Protocolo §4 → Tarefa 13 ou 4 (serialize).
- **Dependências:** Tarefa 13
- **Critério de conclusão:** Validate/serialize verdes; regressão US-03 (`playerRoundIndex`, ordem) intacta.

---

### Tarefa 15 — [REFACTOR] Comando de início no domínio

- **Tipo:** Refatoração
- **Descrição:** Remover duplicação entre guards de fase e validate; manter cópias imutáveis alinhadas a outros comandos (`advancePlayerRound`). Sem mudar comportamento. Testes permanecem verdes.
- **Dependências:** Tarefa 14
- **Critério de conclusão:** Suíte de `domain/match` verde após refatoração.

---

### Tarefa 16 — [RED] Config inválida e rascunho isolado da partida

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Tentar iniciar a partir de configuração inválida
    Given uma configuração inválida (ex.: SinglePlayerVsBots sem bots)
    When se tenta iniciar a partida a partir dessa configuração
    Then a operação é rejeitada
    And nenhuma partida na fase RaceSetup é produzida

  Scenario: Após iniciar, a configuração não pode ser alterada
    Given uma partida já iniciada
    When se tenta alterar participantes, nomes ou dificuldade dos bots dessa partida
    Then a alteração é rejeitada
    And o estado da partida permanece o mesmo
```

- **Camada de teste:** Unitária de fluxo (`domain/match-config/*.test.ts` e/ou `domain/match/startMatch.test.ts`)
- **Descrição:** (1) `createMatchFromConfig` em config inválida falha; **não** chamar `startMatch` / não haver `RaceSetup`. (2) Após `startMatch`, `updateParticipant` no rascunho de `MatchConfig` **não** altera `players` da partida. **Não** criar API de editar elenco em `MatchState`.
- **Rastreabilidade:** Spec §13.2, §13.5, RN-03, RN-15, RF-02, RF-08; Plan §9 item 6
- **Dependências:** Tarefa 15
- **Critério de conclusão:** Testes cobrindo os dois comportamentos. Se já passarem com o código existente (isolamento de objetos / US-02), não adicionar comando novo.

---

### Tarefa 17 — Executar testes (config / isolamento)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` e `domain/match-config`.
- **Em caso de falha:** Protocolo §4. Só haverá GREEN de produto se a Tarefa 16 tiver exigido código além dos testes — nesse caso, implementação mínima **sem** `startFromConfig`.
- **Dependências:** Tarefa 16
- **Critério de conclusão:** Fluxo config inválida e isolamento verdes.

---

### Tarefa 18 — [RED] `startAndPersistMatch` e load sem re-início

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Persistência do estado iniciado
    Given uma partida recém-iniciada com sucesso
    When o estado é persistido e depois restaurado
    Then a fase restaurada é RaceSetup
    And currentTurnPlayerId é o mesmo
    And a ordem de players é a mesma
    And nenhum novo início nem sorteio ocorre

  Scenario: Tentar iniciar sem partida Created
    Given que não existe partida na fase Created
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada

  Scenario: Duas tentativas de início da mesma partida
    Given uma partida Created válida
    When duas tentativas de início ocorrem sobre essa partida
    Then no máximo uma é aceita
    And a outra é rejeitada
    And o estado resultante, se houver sucesso, é um único RaceSetup com o primeiro turno definido
```

- **Camada de teste:** Unitária/aplicação (`application/match-persistence/*.test.ts`)
- **Descrição:** Com fake in-memory: (1) `startAndPersistMatch` em `Created` válida → `saveMatch` + ativa; `loadMatch`/`getActiveMatch` devolve `RaceSetup` + turno + mesma ordem; garantir (spy ou ausência de `createMatch` no load) que restore **não** inicia de novo. (2) Falha de `startMatch` (ex. já `RaceSetup` ou `Created` inválida) → **nenhum** write de iniciado (storage permanece o anterior). (3) Segunda chamada sobre o estado já persistido/`RaceSetup` rejeita e não corrompe o storage. (4) Sem partida ativa: `getActiveMatch` → `NO_ACTIVE_MATCH`. (5) Independência: novo módulo de orquestração sem imports de `react`/`next`.
- **Rastreabilidade:** Spec §13.2, §13.4, §13.5, RF-07, RN-16, RN-18; Plan §9 item 7
- **Dependências:** Tarefa 17
- **Critério de conclusão:** Testes criados e falhando até existir `startAndPersistMatch`.

---

### Tarefa 19 — [GREEN] `startAndPersistMatch`

- **Tipo:** Implementação
- **Descrição:** Orquestração fina: `startMatch(state)`; se erro, retornar sem I/O; se ok, `saveMatch` + `setActiveMatchId` (reutilizar `persistCreatedMatch` internamente se couber). Não chamar `createMatch`. Exportar em `application/match-persistence`.
- **Componentes envolvidos:** `startAndPersistMatch`; `MatchPersistence`; `startMatch`
- **Dependências:** Tarefa 18
- **Critério de conclusão:** Testes da Tarefa 18 passando.

---

### Tarefa 20 — Executar testes (persistência do iniciado)

- **Tipo:** Validação
- **Descrição:** `npm test` em `application/match-persistence` (e domínio se afetado).
- **Em caso de falha:** Protocolo §4 → Tarefa 19.
- **Dependências:** Tarefa 19
- **Critério de conclusão:** Persistência do `RaceSetup` verde; load sem re-início.

---

### Tarefa 21 — [REFACTOR] Orquestração de persistência

- **Tipo:** Refatoração
- **Descrição:** Evitar duplicar save+ativa se `persistCreatedMatch` já serve; garantir `application/` sem React/Next e `domain/` sem `application/`. Testes permanecem verdes. Sem mudar contrato.
- **Dependências:** Tarefa 20
- **Critério de conclusão:** Testes de persistência verdes após refatoração.

---

### Tarefa 22 — Executar suíte completa da feature

- **Tipo:** Validação
- **Descrição:** `npm test` (match + match-config + match-persistence).
- **Em caso de falha:** Protocolo §4 → implementação correspondente.
- **Dependências:** Tarefa 21
- **Critério de conclusão:** Suíte completa verde.

---

### Tarefa 23 — Lint e build

- **Tipo:** Validação
- **Descrição:** Executar `npm run lint` e `npm run build`.
- **Em caso de falha:** Corrigir problemas introduzidos pela feature; não desabilitar regras sem necessidade.
- **Dependências:** Tarefa 22
- **Critério de conclusão:** Lint e build OK.

---

### Tarefa 24 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Descrição:** Conferir checklist do `plan.md` §13 e aceite da `spec.md` §12 (turno, preservação, rejeições, D14, determinismo, isolamento de config, persistência sem re-início, sem UI, sem `startFromConfig`). Registrar evidências na etapa de `implementation.md` (próxima skill).
- **Dependências:** Tarefa 23
- **Critério de conclusão:** Itens do plan §13 atendidos ou gaps explícitos reportados ao usuário.

## 6. Validações Finais

- [ ] Suíte de testes completa da feature executada com sucesso (`npm test`).
- [ ] Lint e build executados com sucesso.
- [ ] Critérios de conclusão do `plan.md` §13 atendidos.
- [ ] Critérios de aceite da `spec.md` §12 cobertos pelos testes.
- [ ] Nenhum teste foi alterado apenas para “passar” sem justificativa vs spec/plan.
- [ ] Domínio sem React/Next/`localStorage`; persistência só em `application/`.
- [ ] Sem UI e sem `startFromConfig` nesta US.

## 7. Rastreabilidade resumida

| Spec / plano | Tarefas |
| --- | --- |
| §13.1 / §7 início válido + determinismo | 3 → 4 → 5 |
| §13.3 segundo início / andamento / Finished | 6 → 7 → 8 |
| §13.4 falha na inicialização (`Created` inválida) | 9 → 10 → 11 |
| §13.4 / D14 estado parcial | 12 → 13 → 14 |
| §13.2 / §13.5 config inválida e congelada | 16 → 17 |
| §13.5 persistência; §13.2 sem Created; RN-18 | 18 → 19 → 20 |
| Plan §9 item 8 suíte + aceite | 22 → 23 → 24 |

## 8. Próxima Etapa

Implementar as tarefas deste arquivo via skill `create-implementation`, gerando `docs/implementation/us-04-fluxo-inicio-partida/implementation.md`, e em seguida validar com `create-validation`.

Input desta etapa:

```text
docs/tasks/us-04-fluxo-inicio-partida/tasks.md
```
