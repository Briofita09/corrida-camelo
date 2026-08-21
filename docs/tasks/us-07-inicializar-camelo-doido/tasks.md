# Tarefas de Implementação — US-07 Inicializar camelo doido

## 1. Contexto

Implementar o posicionamento do camelo doido como passo automático de `startMatch`, **depois** das posições dos camelos de corrida (US-06): `Crazy` sozinho no espaço **7**, sentido `TowardStart` intacto, sem dono e sem campo extra de desclassificação — conforme o plano técnico e a spec US-07. Persistência restaura o estado; o load **não** recoloca o doido. Sem UI e sem movimento oficial do doido.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-07-inicializar-camelo-doido/spec.md`
- `docs/plan/us-07-inicializar-camelo-doido/plan.md`
- `docs/spec/us-06-posicoes-iniciais-camelos/spec.md`
- `docs/spec/us-04-fluxo-inicio-partida/spec.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md`
- `docs/rules/corrida_camelo_regras.md` §§3.2, 5.1–5.3 e 9
- `domain/match/`
- `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Convenções Utilizadas

| Item | Valor |
| --- | --- |
| Branch | `feature/us-07-inicializar-camelo-doido` (**suposição** — `AGENTS.md` não define convenção; padrão das US-01–06) |
| Base | Branch atual de trabalho / `develop` se for a base do repo |
| Testes | `npm test` (`vitest run`); opcional `npm run test:watch` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Domínio | `domain/match/` — testes colocalizados `*.test.ts` |
| Persistência | `application/match-persistence/` — testes colocalizados `*.test.ts` |
| Runner | Vitest, ambiente `node`; fake/in-memory para storage |
| Comando de produto | `startMatch(state, options?)` — **não** criar comando público de posicionamento do doido |
| Constante | `CRAZY_INITIAL_SPACE = 7` (junto de `START_SPACE`; exportar no barrel) |
| Helper interno | `placeCrazyCamel` (nome de arquivo fino ajustável); **não** exportar no barrel |
| `stackOrder` no 7 | Destino vazio: ocupação de casa vazia (mesmo padrão de destino vazio de `applyRacingCardMove`) |
| Desclassificação | Identidade `Crazy`; **sem** campo `disqualified` |
| Sem dono | `CamelState` permanece `{ id, space, stackOrder, direction }`; **sem** `owner` / `playerId` |

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

**Exceção documentada (plan §11):** testes US-06 que exigem `Crazy.space === 0` **após** `startMatch` bem-sucedido tornam-se **obsoletos** frente à US-07. Atualizar **somente** esses asserts pós-sucesso (espaço 7 + `TowardStart` + sozinho). Manter Crazy no espaço 0 em: `Created`, `determineInitialCamelPositions`, `applyRacingCardMove` a partir da largada, e rejeição atômica do início. Não enfraquecer os testes novos de destino vazio/sentido/identidade.

**Caracterização de pilha (plan §5.5 / TDD item 6):** os testes de RF-09 / spec §17.6 podem **já passar** no helper existente se ele não filtrar `Crazy`. Nesse caso o GREEN é no-op: **não** alterar `applyRacingCardMove` para excluir o doido e **não** implementar movimento de cartas pretas.

**Ordem obrigatória (plan §9):** constante + helper interno → `startMatch` happy path → Created / identidade / sentidos → rejeições → caracterização de pilha → validate → turno/serialize → persistência → `AGENTS.md` → suíte completa.

Não misturar o passo do doido em `determineInitialCamelPositions`. Não exigir na validação permanente que `Crazy` esteja no 7 em `RaceSetup`. Não alterar UI em `app/*`. Não alterar `MIN_MONEY`.

## 5. Lista de Tarefas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Descrição:** Criar e checkout da branch `feature/us-07-inicializar-camelo-doido`.
- **Dependências:** Nenhuma
- **Critério de conclusão:** Branch ativa com o nome acordado.

---

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Preparação / Validação
- **Descrição:** Executar `npm test` (deve permanecer verde). Confirmar `startMatch`, `createMatch` (6 camelos no espaço 0, `Crazy` `TowardStart`), `determineInitialCamelPositions`, `applyRacingCardMove`, `RACING_CAMEL_IDS` / `CAMEL_IDS`, `validateMatchState` (já **não** exige Crazy no 0 em `RaceSetup`), `serializeMatchState` / `deserializeMatchState`, `performTurnAction`, `startAndPersistMatch`, `createInMemoryStorage`.
- **Dependências:** Tarefa 1
- **Critério de conclusão:** Suíte verde; APIs disponíveis para extensão.

---

### Tarefa 3 — [RED] Helper posiciona Crazy sozinho no espaço 7

- **Tipo:** Teste
- **Cenário relacionado (BDD):** passo isolado da spec §8 (itens 2–4) / plan §5.2.

```gherkin
  Scenario: Helper coloca Crazy sozinho no espaço 7 sem inverter o sentido
    Given um snapshot de camelos após as 5 cartas da US-06
    And Crazy ainda está no espaço 0 no sentido TowardStart
    When o helper de posicionamento do doido é aplicado
    Then Crazy ocupa o espaço 7
    And Crazy permanece TowardStart
    And Crazy está sozinho nesse espaço
    And as posições e sentidos dos camelos de corrida não mudam
    And o array de origem não é mutado
```

- **Camada de teste:** Unitária (`domain/match/placeCrazyCamel.test.ts`)
- **Descrição:** Fixture: camelos de corrida já fora do 0 (ex. Yellow no 2) e Crazy no 0 `TowardStart`. Após o helper: `Crazy.space === CRAZY_INITIAL_SPACE` (7); `stackOrder` válido e único no 7; nenhum outro camelo no 7; de corrida inalterados; `direction` de Crazy inalterada. Deve falhar enquanto o helper/constante não existirem.
- **Rastreabilidade:** Spec RN-03–RN-05, RN-11–RN-12, D1, D6, D14; Plan §9 item 1, TDD item 1
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (helper/constante ausentes).

---

### Tarefa 4 — [GREEN] Constante `CRAZY_INITIAL_SPACE` e helper interno

- **Tipo:** Implementação
- **Descrição:** Introduzir `CRAZY_INITIAL_SPACE = 7` em `constants.ts`. Helper interno: recebe camelos pós-US-06, devolve novo array com Crazy sozinho no espaço 7, `TowardStart` copiado, `stackOrder` de casa vazia, demais camelos intactos. Não mutar o input. Não aplicar `applyRacingCardMove` a Crazy. **Não** exportar o helper no barrel. Exportar a constante no barrel (como `START_SPACE`). Ainda **não** ligar a `startMatch`.
- **Componentes envolvidos:** `constants.ts`; helper interno de posicionamento; `index.ts` (só a constante)
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes da Tarefa 3 passando.

---

### Tarefa 5 — Executar testes (helper)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/placeCrazyCamel.test.ts` (e suíte de domínio se o export da constante exigir ajuste de compilação).
- **Em caso de falha:** Protocolo §4 → Tarefa 4.
- **Dependências:** Tarefa 4
- **Critério de conclusão:** Helper verde; `startMatch` ainda deixa Crazy no 0 (suíte US-06 intacta até a Tarefa 7).

---

### Tarefa 6 — [REFACTOR] Helper de posicionamento

- **Tipo:** Refatoração
- **Descrição:** Clareza (cópia imutável, uso da constante). Continua **interno**. Testes da Tarefa 3 permanecem verdes. Sem mudar comportamento.
- **Dependências:** Tarefa 5
- **Critério de conclusão:** Testes do helper verdes após a organização.

---

### Tarefa 7 — [RED] `startMatch` posiciona Crazy na casa 7 após os de corrida

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
Feature: Inicializar camelo doido
  Scenario: Início posiciona o camelo doido na casa 7 após os camelos de corrida
    Given uma partida válida na fase Created
    And os seis camelos estão no espaço 0
    And Crazy está no sentido linha de chegada para linha de partida
    And os camelos de corrida estão no sentido linha de partida para linha de chegada
    When o domínio inicia a partida
    Then a operação é aceita
    And a fase passa a ser RaceSetup
    And Crazy ocupa o espaço 7
    And Crazy permanece no sentido linha de chegada para linha de partida
    And os cinco camelos de corrida permanecem no sentido linha de partida para linha de chegada
    And os cinco camelos de corrida estão nas posições determinadas pelas 5 cartas
    And Crazy não está no espaço 0

  Scenario: Nenhum camelo de corrida está na casa 7 no instante do posicionamento
    Given um início bem-sucedido
    Then Crazy está sozinho no espaço 7
    And nenhum camelo de corrida ocupa o espaço 7
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`)
- **Descrição:** Com `revealedRacingCards` controlada (a sequência já usada na US-06). Atualizar asserts pós-sucesso que ainda exigem `Crazy.space === 0` para espaço **7** + `TowardStart` + sozinho no 7. Manter asserts de fase, turno, £3, ordem `players`, 5 cartas + pool 25 e posições dos de corrida. Input `Created` intacto. Este RED é a suíte atual **incompatível** com a US-07 (Crazy ainda no 0 após `startMatch`).
- **Rastreabilidade:** Spec §17.1, §17.4, RF-01, RF-02, RF-06, RN-03–RN-04, RN-11–RN-13, D12; Plan §9 item 2, TDD item 2
- **Dependências:** Tarefa 6
- **Critério de conclusão:** Asserts alinhados à US-07 escritos e falhando pelo motivo esperado (Crazy ainda no 0 após o início).

---

### Tarefa 8 — [GREEN] Ligar o helper ao `startMatch` após a US-06

- **Tipo:** Implementação
- **Descrição:** Após `determineInitialCamelPositions`, aplicar o helper interno e gravar o array resultante em `RaceSetup`. Não misturar o passo nas 5 cartas. Guards US-04/US-06 inalterados (`Crazy` no 0 **antes** do início). Sem inverter `direction`. Sem comando público novo.
- **Componentes envolvidos:** `startMatch`; helper interno; `determineInitialCamelPositions` (intocado)
- **Dependências:** Tarefa 7
- **Critério de conclusão:** Testes da Tarefa 7 passando.

---

### Tarefa 9 — Executar testes (início com Crazy no 7)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (pelo menos `startMatch.test.ts`, `placeCrazyCamel.test.ts`, `applyRacingCardMove.test.ts`).
- **Em caso de falha:** Protocolo §4 → Tarefa 8. Se a falha for só assert antigo de Crazy no 0 **após** `startMatch`: completar a migração da Tarefa 7, sem alterar asserts da largada/`Created`.
- **Dependências:** Tarefa 8
- **Critério de conclusão:** Happy path US-07 verde; movimento US-06 a partir do 0 continua sem carregar Crazy.

---

### Tarefa 10 — [RED] Created no 0; identidade, sem dono e sentidos

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Na Created o camelo doido permanece na largada no sentido contrário
    Given uma partida recém-criada válida
    Then Crazy existe no estado
    And Crazy ocupa o espaço 0
    And Crazy está no sentido linha de chegada para linha de partida

  Scenario: Nenhum camelo tem dono; Crazy não é camelo de corrida
    Given uma partida iniciada com sucesso
    Then o elenco contém exatamente um camelo com identidade Crazy
    And Crazy não está entre Yellow, Green, Blue, Purple e Red
    And nenhum dos seis camelos está associado a um jogador
    And Crazy está desclassificado para classificação
    And Crazy não pode vencer a corrida

  Scenario: O sentido do doido é sempre o contrário dos de corrida
    Given uma partida Created ou já iniciada
    Then Crazy está no sentido linha de chegada para linha de partida
    And cada camelo de corrida está no sentido linha de partida para linha de chegada
```

- **Camada de teste:** Unitária (`domain/match/createMatch.test.ts`, `startMatch.test.ts`, `validateMatchState.test.ts`)
- **Descrição:** (1) Created: Crazy existe, espaço 0, `TowardStart` (regressão US-01; se já verde, registrar e não enfraquecer). (2) Após início: exatamente um Crazy; `Crazy` ∉ `RACING_CAMEL_IDS`; cada `CamelState` só tem `id`, `space`, `stackOrder`, `direction` (ausência de `owner` / `playerId` / `disqualified`); desclassificação = identidade Crazy, **sem** motor de ranking. (3) Created e iniciada: Crazy `TowardStart`; cada cor de corrida `TowardFinish`. (4) `validateMatchState`: camelo de corrida com `TowardStart` é rejeitado (dual do check já existente de Crazy).
- **Rastreabilidade:** Spec §17.2, §17.3, RF-03–RF-05, RN-01–RN-02, RN-05–RN-10, D7–D10; Plan §9 item 3, TDD itens 3–4
- **Dependências:** Tarefa 9
- **Critério de conclusão:** Testes do contrato de identidade/sentidos escritos; os que já existem na Created permanecem; o reforço `TowardFinish` nos de corrida falha se a validação ainda não o exigir.

---

### Tarefa 11 — [GREEN] Reforçar sentidos dos de corrida; sem campos novos

- **Tipo:** Implementação
- **Descrição:** Em `validateCamels` / `validateMatchState`, exigir `TowardFinish` para `Yellow`…`Red` (mesmo espírito do check `Crazy` → `TowardStart`). **Não** adicionar `owner`, `playerId` nem `disqualified`. **Não** posicionar Crazy em `createMatch`. Se os testes de Created/identidade da Tarefa 10 já passam sem mudança, não adicionar lógica extra além do reforço de sentido que estiver falhando.
- **Componentes envolvidos:** `validateMatchState`; `createMatch` (intocado se já correto); tipos (`CamelState` inalterado)
- **Dependências:** Tarefa 10
- **Critério de conclusão:** Testes da Tarefa 10 passando.

---

### Tarefa 12 — Executar testes (Created, identidade, sentidos)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (`createMatch.test.ts`, `startMatch.test.ts`, `validateMatchState.test.ts`).
- **Em caso de falha:** Protocolo §4 → Tarefa 11.
- **Dependências:** Tarefa 11
- **Critério de conclusão:** Created no 0 verde; identidade/sentidos verdes; início continua com Crazy no 7.

---

### Tarefa 13 — [RED] Segundo início e falha atômica não reposicionam o doido

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Segundo início não move o camelo doido de novo
    Given uma partida já iniciada com Crazy no espaço 7
    When o domínio tenta iniciar novamente
    Then a operação é rejeitada
    And Crazy permanece no espaço 7
    And Crazy permanece no sentido linha de chegada para linha de partida
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`)
- **Descrição:** (1) `startMatch` sobre `RaceSetup` → rejeitado (`INVALID_PHASE`); snapshot com Crazy no 7 e `TowardStart` intacto. (2) Sequência inválida (≠ 5 ou carta Crazy) sobre `Created` → rejeitado; `Created` intacta; Crazy permanece no espaço 0 e `TowardStart`. Estender os casos US-06 de rejeição com esses asserts explícitos de Crazy.
- **Rastreabilidade:** Spec §17.5, RF-08, RN-14–RN-15, RN-20, D19–D20; Plan §9 item 4, TDD item 5
- **Dependências:** Tarefa 12
- **Critério de conclusão:** Asserts de Crazy nas rejeições escritos; falham se o segundo início ou a rejeição alterarem posição/sentido.

---

### Tarefa 14 — [GREEN] Preservar Crazy nas rejeições

- **Tipo:** Implementação
- **Descrição:** Guards atuais devem bastar (imutabilidade + `INVALID_PHASE`). Só ajustar se algum caminho mutar o input ou reposicionar Crazy na rejeição. Sem código de erro novo para “casa 7 ocupada”.
- **Componentes envolvidos:** `startMatch`
- **Dependências:** Tarefa 13
- **Critério de conclusão:** Testes da Tarefa 13 passando. Se já verdes após a Tarefa 8, registrar no-op e seguir.

---

### Tarefa 15 — Executar testes (rejeições)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/startMatch.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 14.
- **Dependências:** Tarefa 14
- **Critério de conclusão:** Segundo início e falha atômica verdes; happy path intacto.

---

### Tarefa 16 — [RED] Crazy participa da mesma regra de pilha (caracterização)

- **Tipo:** Teste
- **Cenário relacionado (BDD):** spec §17.6 / RF-09 — **documentado; sem movimento do doido nesta US**.

```gherkin
  Scenario: Crazy pode empilhar em qualquer posição vertical
    Given Crazy e um ou mais camelos de corrida no mesmo espaço ≥ 1 em uma história futura
    Then eles formam uma única pilha de jogo
    And Crazy pode estar por cima de outro camelo
    And podem existir camelos de corrida por baixo de Crazy
    And Crazy pode estar por baixo com camelos de corrida por cima
    And Crazy pode estar no meio da pilha
    And Crazy continua desclassificado e ignorado na classificação em qualquer dessas posições
    And quem se move leva apenas os que estão em cima
    And esta US não executa esse movimento
```

- **Camada de teste:** Unitária (`domain/match/applyRacingCardMove.test.ts`)
- **Descrição:** Fixtures **montadas** (não via `startMatch`): Crazy já em espaço ≥ 1. Cobrir: (1) Crazy sozinho no destino, carta de corrida chega → quem chega **sobe** (Crazy por baixo); (2) Crazy **por cima** de um de corrida no mesmo espaço, esse de corrida se move → leva Crazy rumo à **chegada**; (3) Crazy **no meio** de uma pilha de três, o de baixo se move → leva Crazy e o de cima. Comentário no teste: isto **não** é o movimento oficial do doido (cartas pretas / `TowardStart` / +1). Não chamar `startMatch` nestes casos. Podem **já passar** no helper atual.
- **Rastreabilidade:** Spec §10, §17.6, RF-09, RN-19, D15; Plan §9 item 5, TDD item 6
- **Dependências:** Tarefa 15
- **Critério de conclusão:** Testes de caracterização escritos. Se já verdes, registrar e seguir para a Tarefa 17 como no-op.

---

### Tarefa 17 — [GREEN] Não excluir Crazy da pilha

- **Tipo:** Implementação
- **Descrição:** **Não** filtrar `id === "Crazy"` em `applyRacingCardMove`. **Não** implementar cartas pretas nem movimento `TowardStart` do doido. Se os testes da Tarefa 16 já passam, não adicionar lógica. Só corrigir se algum ramo novo tiver excluído Crazy.
- **Componentes envolvidos:** `applyRacingCardMove` (apenas se necessário)
- **Dependências:** Tarefa 16
- **Critério de conclusão:** Testes da Tarefa 16 passando; testes US-06 de não carregar no espaço 0 continuam verdes.

---

### Tarefa 18 — Executar testes (pilha / caracterização)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/applyRacingCardMove.test.ts` e `startMatch.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 17. **Proibido** “passar” excluindo Crazy da pilha ou implementando movimento de cartas pretas.
- **Dependências:** Tarefa 17
- **Critério de conclusão:** Caracterização verde; inicialização continua com Crazy sozinho no 7.

---

### Tarefa 19 — [RED] Validação permanente não fixa o espaço 7 em RaceSetup

- **Tipo:** Teste
- **Cenário relacionado (BDD):** plan §5.4 / spec D17.
- **Camada de teste:** Unitária (`domain/match/validateMatchState.test.ts`, `serialize.test.ts`)
- **Descrição:** (1) Manter o caso existente: `RaceSetup` com Crazy no espaço 7 é válido. (2) `RaceSetup` com Crazy **ainda no 0** (JSON legado US-06) continua válido — **não** exigir espaço 7. (3) `RaceSetup` com Crazy noutro espaço ≥ 0 válido (ex. 5) continua válido. (4) Crazy com `TowardFinish` continua rejeitado. (5) Round-trip JSON de partida recém-iniciada: Crazy no 7 e `TowardStart`. Created continua recusando camelo fora do 0.
- **Rastreabilidade:** Spec D17, RN-17, RNF-04–RNF-05; Plan §9 item 6, TDD item 8
- **Dependências:** Tarefa 18
- **Critério de conclusão:** Testes de invariante permanente vs. garantia do comando escritos; falham se `validateMatchState` passar a exigir Crazy no 7 em `RaceSetup`.

---

### Tarefa 20 — [GREEN] Não exigir Crazy no 7 em `validateMatchState`

- **Tipo:** Implementação
- **Descrição:** Garantir que a validação permanente **não** fixe `Crazy.space === 7` em `RaceSetup`. Sentido `TowardStart` de Crazy permanece obrigatório. Sem migração de JSON legado. Sem default silencioso de recolocar no 7 na hidratação.
- **Componentes envolvidos:** `validateMatchState`; serialize/deserialize (via validate)
- **Dependências:** Tarefa 19
- **Critério de conclusão:** Testes da Tarefa 19 passando. Se já verdes, registrar no-op.

---

### Tarefa 21 — Executar testes (validate/serialize)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (`validateMatchState.test.ts`, `serialize.test.ts`, `startMatch.test.ts`).
- **Em caso de falha:** Protocolo §4 → Tarefa 20.
- **Dependências:** Tarefa 20
- **Critério de conclusão:** Validate/serialize verdes; `startMatch` continua colocando Crazy no 7.

---

### Tarefa 22 — [RED] Stub de turno preserva Crazy no 7

- **Tipo:** Teste
- **Cenário relacionado (BDD):** spec D21 / plan TDD item 7.
- **Camada de teste:** Unitária (`domain/match/performTurnAction.test.ts`)
- **Descrição:** Após `startMatch` com sequência injetada, `performTurnAction` do jogador ativo: `camels` iguais ao estado iniciado; Crazy permanece no espaço 7 e `TowardStart`. Não exigir “todos no 0”.
- **Rastreabilidade:** Spec D21, RN-13; US-05 stub; Plan §9 item 7, TDD item 7
- **Dependências:** Tarefa 21
- **Critério de conclusão:** Asserts explícitos de Crazy no 7 após o stub escritos; falham se o stub mover/resetar Crazy.

---

### Tarefa 23 — [GREEN] Preservar camelos no stub

- **Tipo:** Implementação
- **Descrição:** `performTurnAction` / `applyNextTurn` já devem copiar `camels`. Só corrigir se a cópia perder espaço/sentido. Sem alterar autorização/wrap. Sem mover Crazy.
- **Componentes envolvidos:** `performTurnAction`; `applyNextTurn`
- **Dependências:** Tarefa 22
- **Critério de conclusão:** Testes da Tarefa 22 e wrap/autorização US-05 verdes. Se já verdes, registrar no-op.

---

### Tarefa 24 — Executar testes (turno)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/performTurnAction.test.ts` e `startMatch.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 23.
- **Dependências:** Tarefa 23
- **Critério de conclusão:** Stub preserva Crazy no 7; domínio de turno verde.

---

### Tarefa 25 — [RED] Persistência: load não recoloca o doido nem inverte o sentido

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Reload não reposiciona o camelo doido nem inverte o sentido
    Given uma partida recém-iniciada persistida
    When o estado é restaurado
    Then Crazy permanece no espaço 7
    And Crazy permanece no sentido linha de chegada para linha de partida
    And nenhum novo posicionamento ocorre
```

- **Camada de teste:** Unitária/aplicação (`application/match-persistence/startAndPersistMatch.test.ts`)
- **Descrição:** Storage in-memory. `startAndPersistMatch` com sequência injetada → `getActiveMatch` / `loadMatch`: Crazy no 7, `TowardStart`, camelos iguais ao persistido. Load **não** chama `startMatch`. Falha de início (sequência inválida) → storage sem `RaceSetup` novo; se houver Created persistida, Crazy permanece no 0. Segundo `startAndPersistMatch` sobre RaceSetup rejeita sem corromper Crazy no 7.
- **Rastreabilidade:** Spec §17.5, RF-07, RN-16, D18; Plan §9 item 8, TDD item 8
- **Dependências:** Tarefa 24
- **Critério de conclusão:** Asserts explícitos de Crazy no load escritos; falham se o load reexecutar o início ou inverter o sentido.

---

### Tarefa 26 — [GREEN] Orquestração de persistência inalterada

- **Tipo:** Implementação
- **Descrição:** `startAndPersistMatch` continua chamando `startMatch` e só gravando se `ok`. Load continua só `deserialize`. **Não** recolocar Crazy no 7 no load. Domínio sem `localStorage`; aplicação sem React/Next. Se os testes da Tarefa 25 já passam com o domínio novo, não mudar a orquestração.
- **Componentes envolvidos:** `startAndPersistMatch`; `MatchPersistence`; `loadMatch` / `getActiveMatch`
- **Dependências:** Tarefa 25
- **Critério de conclusão:** Testes da Tarefa 25 passando.

---

### Tarefa 27 — Executar testes (persistência)

- **Tipo:** Validação
- **Descrição:** `npm test` em `application/match-persistence` (e domínio se afetado).
- **Em caso de falha:** Protocolo §4 → Tarefa 26.
- **Dependências:** Tarefa 26
- **Critério de conclusão:** Persistência verde; load sem recolocar Crazy.

---

### Tarefa 28 — [REFACTOR] Barrel, independência e documentação estável

- **Tipo:** Refatoração
- **Descrição:** Barrel: exportar `CRAZY_INITIAL_SPACE`; **não** exportar `placeCrazyCamel` nem `applyRacingCardMove` nem `determineInitialCamelPositions`. `domain/` sem `application/`/React/Next. Atualizar `AGENTS.md`: lacuna “Crazy permanece no espaço 0”; tabela US-06 (Crazy no 7 após o início; espaço 7 **não** é invariante permanente de `RaceSetup`); contrato de pilha (cima/meio/baixo); ranking futuro ignora Crazy; instrução 16 (casa 7 agora tem spec; não reverter para Crazy no 0 após o início; não alterar `MIN_MONEY`). Sem mudar contrato testado.
- **Dependências:** Tarefa 27
- **Critério de conclusão:** Testes de domínio e persistência verdes; helper interno fora da API pública; `AGENTS.md` alinhado à US-07.

---

### Tarefa 29 — Executar suíte completa da feature

- **Tipo:** Validação
- **Descrição:** `npm test` (match + match-config + match-persistence).
- **Em caso de falha:** Protocolo §4 → implementação correspondente.
- **Dependências:** Tarefa 28
- **Critério de conclusão:** Suíte completa verde.

---

### Tarefa 30 — Lint e build

- **Tipo:** Validação
- **Descrição:** Executar `npm run lint` e `npm run build`.
- **Em caso de falha:** Corrigir problemas introduzidos pela feature; não desabilitar regras sem necessidade.
- **Dependências:** Tarefa 29
- **Critério de conclusão:** Lint e build OK.

---

### Tarefa 31 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Descrição:** Conferir checklist do `plan.md` §13 e aceite da `spec.md` §16 (Crazy no 7 após início, Created no 0, sentido contrário permanente, sem dono, não é camelo de corrida, desclassificado por identidade, sozinho no 7, pilha só como contrato/caracterização, reload sem recolocar, sem UI). Registrar evidências na etapa de `implementation.md` (próxima skill).
- **Dependências:** Tarefa 30
- **Critério de conclusão:** Itens do plan §13 atendidos ou gaps explícitos reportados ao usuário.

## 6. Validações Finais

- [x] Suíte de testes completa da feature executada com sucesso (`npm test`).
- [x] Lint e build executados com sucesso.
- [x] Critérios de conclusão do `plan.md` §13 atendidos.
- [x] Critérios de aceite da `spec.md` §16 cobertos pelos testes.
- [x] Nenhum teste foi alterado apenas para “passar” sem justificativa vs spec/plan (migração dos asserts de Crazy no 0 após início está documentada na §4).
- [x] Domínio sem React/Next/`localStorage`; persistência só em `application/`.
- [x] Sem UI, sem comando público de posicionamento além de `startMatch`, sem movimento oficial do doido, sem campo `owner`/`disqualified`.

## 7. Rastreabilidade resumida

| Spec / plano | Tarefas |
| --- | --- |
| Constante + helper interno (plan §9.1) | 3 → 4 → 5 → 6 |
| §17.1 / §17.4 início + destino vazio | 7 → 8 → 9 |
| §17.2 / §17.3 Created, identidade, sentidos | 10 → 11 → 12 |
| §17.5 segundo início / atomicidade | 13 → 14 → 15 |
| §17.6 / RF-09 pilha (caracterização) | 16 → 17 → 18 |
| D17 validate/serialize | 19 → 20 → 21 |
| D21 stub US-05 | 22 → 23 → 24 |
| §17.5 persistência | 25 → 26 → 27 |
| `AGENTS.md` + barrel | 28 |
| Plan §9 itens 9–10 suíte + aceite | 29 → 30 → 31 |

## 8. Próxima Etapa

Implementar as tarefas deste arquivo via skill `create-implementation`, gerando `docs/implementation/us-07-inicializar-camelo-doido/implementation.md`, e em seguida validar com `create-validation`.

Input desta etapa:

```text
docs/tasks/us-07-inicializar-camelo-doido/tasks.md
```
