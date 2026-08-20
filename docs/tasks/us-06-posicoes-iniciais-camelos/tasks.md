# Tarefas de Implementação — US-06 Posições iniciais dos camelos

## 1. Contexto

Implementar a determinação das posições iniciais dos cinco camelos de corrida como passo automático de `startMatch`: embaralhar as 30 cartas oficiais, revelar exatamente 5 em sequência, aplicar movimento com pilha (exceção no espaço 0), gravar as 5 reveladas e o pool de 25, persistir sem reembaralhar no load — conforme o plano técnico e a spec US-06. `Crazy` permanece no espaço 0. Sem UI.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-06-posicoes-iniciais-camelos/spec.md`
- `docs/plan/us-06-posicoes-iniciais-camelos/plan.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `docs/spec/us-04-fluxo-inicio-partida/spec.md`
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md`
- `docs/rules/corrida_camelo_regras.md` §§3.2 e 5.1–5.2
- `domain/match/`
- `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Convenções Utilizadas

| Item | Valor |
| --- | --- |
| Branch | `feature/us-06-posicoes-iniciais-camelos` (**suposição** — `AGENTS.md` não define convenção; padrão das US-01–05) |
| Base | Branch atual de trabalho / `develop` se for a base do repo |
| Testes | `npm test` (`vitest run`); opcional `npm run test:watch` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Domínio | `domain/match/` — testes colocalizados `*.test.ts` |
| Persistência | `application/match-persistence/` — testes colocalizados `*.test.ts` |
| Runner | Vitest, ambiente `node`; fake/in-memory para storage |
| Comando de produto | `startMatch(state, options?: StartMatchOptions)` |
| Campos de estado | `setupRevealedRacingCards`, `remainingRacingCards` (`null` em `Created`) |
| Carta | `RacingCard` = `{ camelId` de corrida, `value`: 1 \| 2 `}` |
| Opções | `shuffleRacingCards?`, `revealedRacingCards?` (`revealedRacingCards` prevalece) |
| Erros novos | `INVALID_REVEAL_COUNT`, `INVALID_RACING_CARD`, `CAMELS_NOT_AT_START` |
| Helpers internos | movimento de uma carta + orquestração das 5; **não** exportar no barrel |
| Pool restante | comparar por **multiconjunto**; as 5 reveladas, por **ordem** |

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

**Exceção documentada (plan §11):** testes US-04/US-05 que exigem `camels.every(space === 0)` após `startMatch` ou após o stub, e o teste de determinismo **sem** opções, tornam-se **obsoletos** frente à US-06. Atualizar asserts nesta fatia: determinismo com sequência injetada; stub preserva as posições **já determinadas**. Não enfraquecer os testes novos de pilha/pool/reveal.

**Ordem obrigatória (plan §9):** baralho oficial → movimento no 0 → pilhas/mesmo camelo → `startMatch` com sequência → rejeições → shuffle → validate/serialize → regressão US-04/US-05 → persistência.

Não criar comando público `determineInitialCamelPositions`. Não posicionar `Crazy` na casa 7. Não alterar UI em `app/*`. Não exigir na validação permanente que `Crazy` esteja no 0 em `RaceSetup`.

## 5. Lista de Tarefas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Descrição:** Criar e checkout da branch `feature/us-06-posicoes-iniciais-camelos`.
- **Dependências:** Nenhuma
- **Critério de conclusão:** Branch ativa com o nome acordado.

---

### Tarefa 2 — Confirmar suíte atual e APIs

- **Tipo:** Preparação / Validação
- **Descrição:** Executar `npm test` (deve permanecer verde). Confirmar `startMatch(state)`, `createMatch` com camelos no espaço 0, `RACING_CAMEL_IDS`, `identityOrdering` / `RandomFn`, `validateMatchState`, `serializeMatchState` / `deserializeMatchState`, `performTurnAction`, `startAndPersistMatch`, `createInMemoryStorage`.
- **Dependências:** Tarefa 1
- **Critério de conclusão:** Suíte verde; APIs disponíveis para extensão.

---

### Tarefa 3 — [RED] Baralho oficial de 30 cartas de corrida

- **Tipo:** Teste
- **Cenário relacionado (BDD):** composição da spec §7 (pré-condição de RF-01 / RN-02).
- **Camada de teste:** Unitária (`domain/match/racingCards.test.ts`)
- **Descrição:** Cobrir: fábrica do baralho tem **30** cartas; **6 por cor** de corrida (`Yellow`, `Green`, `Blue`, `Purple`, `Red`); em cada cor, **cinco** valor 1 e **uma** valor 2; nenhuma carta `Crazy` nem valor 0. Ordem estável documentada (plan §5.2: por `RACING_CAMEL_IDS`, cinco `1` e depois o `2` de cada cor). Devem falhar enquanto a fábrica não existir.
- **Rastreabilidade:** Spec §7, RN-02, RN-07; Plan §9 item 1, TDD item 1
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (fábrica/tipo ausentes).

---

### Tarefa 4 — [GREEN] Tipo `RacingCard` e fábrica do baralho oficial

- **Tipo:** Implementação
- **Descrição:** Introduzir `RacingCard` e a fábrica das 30 cartas oficiais (constantes em `constants.ts` / módulo `racingCards.ts`). Sem `Crazy`. Sem acoplar ainda a `startMatch` nem a `MatchState`. Exportar o tipo no barrel; a fábrica pode ser pública o bastante para testes (ou testada via o módulo). Não implementar shuffle nesta fatia além do necessário para a composição.
- **Componentes envolvidos:** `RacingCard`; fábrica do baralho oficial
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes da Tarefa 3 passando.

---

### Tarefa 5 — Executar testes (baralho)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/racingCards.test.ts` (e suíte de domínio se o tipo exportado exigir ajuste de compilação).
- **Em caso de falha:** Protocolo §4 → Tarefa 4.
- **Dependências:** Tarefa 4
- **Critério de conclusão:** Composição oficial verde; suíte existente continua compilando.

---

### Tarefa 6 — [RED] Uma carta a partir do espaço 0 (valor 1, sem carregar)

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Carta de valor 1 avança uma casa
    Given os camelos de corrida no espaço 0
    And a primeira carta revelada é Yellow com valor 1
    When a carta é aplicada
    Then Yellow ocupa o espaço 1
    And os demais camelos de corrida que ainda não foram revelados permanecem no espaço 0

  Scenario: Sair de trás da linha não carrega outros camelos do espaço 0
    Given Yellow, Green e Crazy no espaço 0
    And a carta revelada é Yellow valor 1
    When a carta é aplicada
    Then somente Yellow vai para o espaço 1
    And Green e Crazy permanecem no espaço 0
```

- **Camada de teste:** Unitária (`domain/match/applyRacingCardMove.test.ts`)
- **Descrição:** Snapshot de 6 camelos no espaço 0 (como `createMatch`). Aplicar `{ camelId: "Yellow", value: 1 }`. Assertir: Yellow no 1; Green e Crazy no 0; `stackOrder` distintos no 0 entre quem ficou. Deve falhar enquanto o helper não existir.
- **Rastreabilidade:** Spec §10.2, §17.2, §17.4, RN-06, RN-12, RN-16; Plan §9 item 2, TDD item 2
- **Dependências:** Tarefa 5
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (helper ausente).

---

### Tarefa 7 — [GREEN] Helper interno de movimento de uma carta (espaço 0)

- **Tipo:** Implementação
- **Descrição:** Implementação mínima: a partir do espaço 0, só o camelo da carta avança `N` casas; não carrega ninguém no 0. Retornar novo array de camelos (imutável). **Não** exportar no barrel público.
- **Componentes envolvidos:** `applyRacingCardMove` (interno)
- **Dependências:** Tarefa 6
- **Critério de conclusão:** Testes da Tarefa 6 passando.

---

### Tarefa 8 — Executar testes (movimento no 0)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/applyRacingCardMove.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 7.
- **Dependências:** Tarefa 7
- **Critério de conclusão:** Valor 1 a partir do 0 verde; Crazy não é carregado.

---

### Tarefa 9 — [RED] Valor 2 e mesmo camelo cumulativo

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Carta de valor 2 avança duas casas
    Given os camelos de corrida no espaço 0
    And a primeira carta revelada é Green com valor 2
    When a carta é aplicada
    Then Green ocupa o espaço 2

  Scenario: O mesmo camelo aparece múltiplas vezes
    Given os camelos no espaço 0
    And a sequência começa com Blue valor 1 e depois Blue valor 2
    When as duas cartas são aplicadas em ordem
    Then após a primeira carta Blue ocupa o espaço 1
    And após a segunda carta Blue ocupa o espaço 3
```

- **Camada de teste:** Unitária (`domain/match/applyRacingCardMove.test.ts`)
- **Descrição:** Segunda carta parte da posição **atual**. Deve falhar se valor 2 for ignorado ou se a segunda carta reiniciar do 0.
- **Rastreabilidade:** Spec §10.1, §10.5, §17.2, §17.3, RN-06, RN-14; Plan §9 item 3, TDD item 3
- **Dependências:** Tarefa 8
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado, ou já verdes se o helper da Tarefa 7 for genérico em `N` — neste caso registrar que a Tarefa 10 é no-op e seguir.

---

### Tarefa 10 — [GREEN] Generalizar avanço +N e posição atual

- **Tipo:** Implementação
- **Descrição:** Garantir `N` ∈ {1, 2} a partir da posição atual do alvo. Sem regra especial que reinicie na largada. Se os testes da Tarefa 9 já passam, não adicionar lógica extra.
- **Componentes envolvidos:** `applyRacingCardMove`
- **Dependências:** Tarefa 9
- **Critério de conclusão:** Testes da Tarefa 9 passando.

---

### Tarefa 11 — Executar testes (valor 2 e cumulativo)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/applyRacingCardMove.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 10.
- **Dependências:** Tarefa 10
- **Critério de conclusão:** Valor 2 e mesmo camelo verdes.

---

### Tarefa 12 — [RED] Pilhas (dois, três+, carregar os de cima)

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Dois camelos terminam na mesma casa
    Given os camelos no espaço 0
    And a sequência revela Yellow valor 1 e em seguida Green valor 1
    When as cartas são aplicadas em ordem
    Then Yellow e Green ocupam o espaço 1
    And formam uma pilha de jogo
    And Green está acima de Yellow

  Scenario: Três ou mais camelos terminam na mesma casa
    Given os camelos no espaço 0
    And três cartas de valor 1 de cores distintas são reveladas em sequência
    When as cartas são aplicadas
    Then os três camelos ocupam o mesmo espaço 1
    And formam uma única pilha
    And a ordem de baixo para cima segue a ordem de chegada

  Scenario: Um camelo forma pilha e depois carrega quem está em cima
    Given Yellow no espaço 1 e Green empilhado acima de Yellow
    And a próxima carta é Yellow valor 1
    When a carta é aplicada
    Then Yellow e Green avançam juntos para o espaço 2
    And Green permanece acima de Yellow
    And nenhum camelo que estava abaixo de Yellow (se houver) é levado
```

- **Camada de teste:** Unitária (`domain/match/applyRacingCardMove.test.ts`)
- **Descrição:** `stackOrder` maior = topo. Chegada sobe na unidade existente (espaço ≥ 1). Unidade que se move = alvo + quem está **acima**. Deve falhar se os camelos só atualizarem `space` sem pilha, ou se sair do 0 passar a carregar (regressão da Tarefa 6).
- **Rastreabilidade:** Spec §10.3–10.4, §17.4, RN-13, RN-15, D13; Plan §9 item 3, TDD item 4
- **Dependências:** Tarefa 11
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (pilha ainda não implementada).

---

### Tarefa 13 — [GREEN] Regras de pilha no helper de movimento

- **Tipo:** Implementação
- **Descrição:** Espaço ≥ 1: formar/empilhar; quem chega sobe; quem se move leva os de cima. Espaço 0: **não** montar unidade. Preservar ordem interna da unidade. `stackOrder` distintos no mesmo espaço.
- **Componentes envolvidos:** `applyRacingCardMove`
- **Dependências:** Tarefa 12
- **Critério de conclusão:** Testes da Tarefa 12 passando; testes das Tarefas 6 e 9 continuam verdes.

---

### Tarefa 14 — Executar testes (pilhas)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/applyRacingCardMove.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 13.
- **Dependências:** Tarefa 13
- **Critério de conclusão:** Pilhas e carregar verdes; não carregar no 0 intacto.

---

### Tarefa 15 — [REFACTOR] Helper de movimento

- **Tipo:** Refatoração
- **Descrição:** Clareza do ramo espaço 0 vs ≥ 1, sem mudar comportamento. Continua **interno** (fora do barrel). Testes de movimento permanecem verdes.
- **Dependências:** Tarefa 14
- **Critério de conclusão:** Testes de `applyRacingCardMove` verdes após a extração/organização.

---

### Tarefa 16 — [RED] `startMatch` revela 5, posiciona e grava o pool

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
Feature: Posições iniciais dos camelos de corrida
  Scenario: Início revela exatamente cinco cartas e posiciona os camelos
    Given uma partida válida na fase Created
    And os cinco camelos de corrida e o camelo doido estão no espaço 0
    When o domínio inicia a partida com uma sequência controlada de 5 cartas de corrida válidas
    Then a operação é aceita
    And a fase passa a ser RaceSetup
    And exatamente 5 cartas foram reveladas e registradas nessa ordem
    And o pool restante contém 25 cartas
    And as 5 reveladas não pertencem ao pool restante
    And a união das reveladas com o restante é o conjunto oficial de 30 cartas
    And cada carta revelada moveu o camelo da sua cor na quantidade do seu valor
    And o camelo doido permanece no espaço 0
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`)
- **Descrição:** `identityOrdering` + `createMatch`. Chamar `startMatch(created, { revealedRacingCards })` com 5 cartas válidas (ex.: mix que exercite pelo menos um movimento). Cobrir também: turno = `players[0]`, `playerRoundIndex` 0, £3, ordem `players`, input não mutado; `Created` permanece com cartas `null` e camelos no 0. Comparar pool por multiconjunto. Devem falhar enquanto o procedimento não estiver no início.
- **Rastreabilidade:** Spec §17.1, §17.5, RF-01–RF-06, RN-04–RN-10, RN-16–RN-17, D1, D14; Plan §9 item 4, TDD item 5
- **Dependências:** Tarefa 15
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (posições/cartas ainda não produzidas no início).

---

### Tarefa 17 — [GREEN] Procedimento no `startMatch` + campos no estado

- **Tipo:** Implementação
- **Descrição:** Estender `MatchState` com `setupRevealedRacingCards` e `remainingRacingCards`. `createMatch` preenche `null`. `startMatch(state, options?)`: após guards US-04, resolver as 5 cartas (`revealedRacingCards` se presente), aplicar o helper em ordem, gravar 5 + pool 25, `Crazy` no 0, resto US-04. Helper interno de orquestração (`determineInitialCamelPositions` ou equivalente) **não** vai ao barrel. Atualizar construções/helpers de `MatchState` para compilarem (`null` em `Created`; fixtures de fase ≠ `Created` com 5+25 válidos **ou** derivados de um `startMatch` injetado). Não enfraquecer asserts de turno/elenco.
- **Componentes envolvidos:** `MatchState`; `createMatch`; `startMatch`; `StartMatchOptions`; orquestração interna
- **Dependências:** Tarefa 16
- **Critério de conclusão:** Testes da Tarefa 16 passando.

---

### Tarefa 18 — Executar testes (início com sequência)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (pelo menos `startMatch.test.ts`, `createMatch.test.ts`).
- **Em caso de falha:** Protocolo §4 → Tarefa 17. Se a falha for só fixture TypeScript/`validate` de testes antigos sem os novos campos: completar o preenchimento da Tarefa 17, sem remover cobertura US-04 de turno/fase.
- **Dependências:** Tarefa 17
- **Critério de conclusão:** Happy path de reveal verde; criação continua todos no 0 com cartas `null`.

---

### Tarefa 19 — [RED] Rejeições: quantidade, carta inválida, fora da largada

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Sequência com quantidade diferente de 5 cartas é rejeitada
    Given uma partida Created válida
    When o início é tentado com uma sequência forçada que não tem exatamente 5 cartas
    Then a operação é rejeitada
    And a partida permanece Created
    And os camelos permanecem no espaço 0

  Scenario: Carta com valor ou cor inválidos é rejeitada
    Given uma partida Created válida
    When o início é tentado com uma carta de valor 0, valor 3, ou cor Crazy
    Then a operação é rejeitada
    And nenhum movimento parcial é aceito

  Scenario: Segundo início não reposiciona
    Given uma partida já iniciada com posições determinadas
    When o domínio tenta iniciar novamente
    Then a operação é rejeitada
    And as posições e o pool permanecem os do primeiro sucesso
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`)
- **Descrição:** Cobrir: `revealedRacingCards` com 4 e com 6 → `INVALID_REVEAL_COUNT`; valor 0, valor 3 e `camelId` Crazy → `INVALID_RACING_CARD`; `Created` com camelo de corrida fora do espaço 0 → `CAMELS_NOT_AT_START`; segundo `startMatch` no `RaceSetup` resultante → `INVALID_PHASE`, posições/pool estáveis; input intacto em toda rejeição.
- **Rastreabilidade:** Spec §17.6, RN-01, RN-07, RN-18–RN-19, RF-07; Plan §9 item 5, TDD item 6
- **Dependências:** Tarefa 18
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (rejeições ausentes ou parciais).

---

### Tarefa 20 — [GREEN] Rejeitar sequência inválida e largada incorreta

- **Tipo:** Implementação
- **Descrição:** Validar comprimento 5, cartas oficiais/submulticonjunto, camelos de corrida no espaço 0 **antes** de aplicar movimentos. Falha → nenhum `RaceSetup`, nenhum pool pela metade. Reutilizar `INVALID_PHASE` no segundo início (já US-04).
- **Componentes envolvidos:** `startMatch`; orquestração interna
- **Dependências:** Tarefa 19
- **Critério de conclusão:** Testes da Tarefa 19 passando.

---

### Tarefa 21 — Executar testes (rejeições do início)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match/startMatch.test.ts`.
- **Em caso de falha:** Protocolo §4 → Tarefa 20.
- **Dependências:** Tarefa 20
- **Critério de conclusão:** Rejeições atômicas verdes; happy path intacto.

---

### Tarefa 22 — [RED] Embaralhamento injetado antes da revelação

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Cartas são embaralhadas antes da revelação
    Given uma partida Created válida
    When o domínio inicia a partida sem sequência forçada
    Then as 5 cartas reveladas são as 5 primeiras de um embaralhamento das 30 oficiais
    And a composição revelada + restante permanece a das 30 oficiais

  Scenario: Um camelo permanece atrás da linha de partida
    Given uma sequência de 5 cartas que não inclui a cor Red
    When o domínio inicia a partida com essa sequência
    Then Red permanece no espaço 0
    And isso é válido
```

- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts` e/ou `racingCards.test.ts`)
- **Descrição:** (1) `shuffleRacingCards` que permuta de forma conhecida → reveladas = 5 primeiras da permutação; pool = as 25 seguintes; composição oficial. (2) Helper `identityRacingCardOrdering` (baralho estável, sem permutar): as 5 primeiras são cinco `Yellow` valor 1 → Yellow no espaço 5, `Red` (e demais não revelados) no 0. (3) Sem `revealedRacingCards`, o shuffle é usado. Não testar aleatoriedade estatística. Deve falhar enquanto o caminho sem `revealedRacingCards` não embaralhar.
- **Rastreabilidade:** Spec §17.2, RN-03, RN-08, RF-09, D8; Plan §9 item 6, TDD item 7
- **Dependências:** Tarefa 21
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (shuffle/identidade ausentes).

---

### Tarefa 23 — [GREEN] Shuffle padrão Fisher–Yates e helper identidade

- **Tipo:** Implementação
- **Descrição:** Sem `revealedRacingCards`: embaralhar as 30 (`shuffleRacingCards` ou Fisher–Yates com `Math.random` / `RandomFn`), revelar as 5 primeiras, pool = resto. Com `revealedRacingCards`, não embaralhar. `identityRacingCardOrdering` para testes. Produção: `startMatch(state)` sem opções.
- **Componentes envolvidos:** `racingCards`; `startMatch`; `StartMatchOptions`
- **Dependências:** Tarefa 22
- **Critério de conclusão:** Testes da Tarefa 22 passando.

---

### Tarefa 24 — Executar testes (shuffle)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (`startMatch.test.ts`, `racingCards.test.ts`).
- **Em caso de falha:** Protocolo §4 → Tarefa 23.
- **Dependências:** Tarefa 23
- **Critério de conclusão:** Shuffle injetado e permanência no 0 verdes.

---

### Tarefa 25 — [RED] Validação e serialização das cartas × fase

- **Tipo:** Teste
- **Cenário relacionado (BDD):** estado válido/inválido da spec D18 e RN-10; round-trip RNF-05.
- **Camada de teste:** Unitária (`domain/match/validateMatchState.test.ts`, `serialize.test.ts`)
- **Descrição:** Cobrir: `Created` com cartas não nulas → rejeitado; `Created` com camelo fora do 0 → rejeitado; `RaceSetup` (e fixture de fase ≠ `Created`) **sem** as 5+25 → rejeitado (JSON legado); iniciado válido round-trip JSON: mesmas reveladas **em ordem**, mesmo pool **por composição**, mesmas posições; `Crazy` no 0 **não** é invariante permanente de `RaceSetup`. Devem falhar enquanto `validateMatchState` ignorar os novos campos.
- **Rastreabilidade:** Spec D18–D20, D23, RN-10, RN-20, RNF-05; Plan §9 item 7, TDD item 8
- **Dependências:** Tarefa 24
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (invariantes de cartas ausentes).

---

### Tarefa 26 — [GREEN] Invariantes em `validateMatchState`

- **Tipo:** Implementação
- **Descrição:** Hidratar `setupRevealedRacingCards` / `remainingRacingCards`. `Created`: ambos `null`, 6 camelos no espaço 0. Fase ≠ `Created`: 5 reveladas válidas + 25 restantes, união = 30, interseção vazia (multiconjunto). Sem default silencioso. Sem exigir Crazy no 0 fora do comando `startMatch`.
- **Componentes envolvidos:** `validateMatchState`; serialize/deserialize (via validate)
- **Dependências:** Tarefa 25
- **Critério de conclusão:** Testes da Tarefa 25 passando.

---

### Tarefa 27 — Executar testes (validate/serialize)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match` (`validateMatchState.test.ts`, `serialize.test.ts`, `startMatch.test.ts`).
- **Em caso de falha:** Protocolo §4 → Tarefa 26. Ajustar fixtures de fase ≠ `Created` para 5+25 válidos se a validação nova os rejeitar.
- **Dependências:** Tarefa 26
- **Critério de conclusão:** Validate/serialize verdes; início continua aceito.

---

### Tarefa 28 — [RED] Regressão US-04/US-05: posições após início e stub

- **Tipo:** Teste
- **Cenário relacionado (BDD):** spec RN-17, RN-21; plan §11 (asserts obsoletos).
- **Camada de teste:** Unitária (`domain/match/startMatch.test.ts`, `performTurnAction.test.ts`)
- **Descrição:** (1) Determinismo: duas cópias `Created` + **mesma** `revealedRacingCards` → estados equivalentes; remover/substituir o `toEqual` sem opções. (2) Após início injetado, `performTurnAction` do ativo **não** altera `camels`, `setupRevealedRacingCards` nem `remainingRacingCards` (igualdade com o estado iniciado, **não** “todos no 0”). (3) Segundo início já coberto na Tarefa 19; reforçar se o teste antigo ainda exigir camelos no 0 após sucesso. O RED é a suíte atual **incompatível** com a US-06.
- **Rastreabilidade:** Spec RN-17, RN-21, D15–D16; US-05 stub; Plan §9 item 8, TDD item 9
- **Dependências:** Tarefa 27
- **Critério de conclusão:** Asserts alinhados à US-06 escritos; testes obsoletos de “todos no 0 após iniciar” deixam de ser o contrato.

---

### Tarefa 29 — [GREEN] Copiar cartas/posições em `performTurnAction`

- **Tipo:** Implementação
- **Descrição:** `applyNextTurn` / `performTurnAction` copiam `setupRevealedRacingCards` e `remainingRacingCards` e **não** movem camelos. Atualizar asserts obsoletos US-04/US-05 nesta fatia (plan §11). Sem alterar autorização/wrap.
- **Componentes envolvidos:** `performTurnAction`; `applyNextTurn`; testes US-04/US-05 obsoletos
- **Dependências:** Tarefa 28
- **Critério de conclusão:** Testes da Tarefa 28 e wrap/autorização US-05 verdes.

---

### Tarefa 30 — Executar testes (regressão turno + início)

- **Tipo:** Validação
- **Descrição:** `npm test` em `domain/match`.
- **Em caso de falha:** Protocolo §4 → Tarefa 29. Se a falha for só assert antigo de espaço 0: completar a migração da Tarefa 28/29, sem enfraquecer pilha/pool.
- **Dependências:** Tarefa 29
- **Critério de conclusão:** Domínio verde; stub preserva posições e pool.

---

### Tarefa 31 — [RED] Persistir posições e pool; load sem re-reveal

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Reload não refaz a preparação
    Given uma partida recém-iniciada com posições e pool persistidos
    When o estado é restaurado
    Then as posições dos camelos são as mesmas
    And as 5 cartas reveladas são as mesmas
    And o pool restante é o mesmo
    And nenhum novo embaralhamento nem revelação ocorre

  Scenario: As cinco cartas da preparação não ficam no baralho da etapa
    Given um início bem-sucedido com 5 cartas reveladas
    When se consulta o pool restante de cartas de corrida
    Then ele não contém nenhuma das 5 cartas reveladas
    And contém 25 cartas
```

- **Camada de teste:** Unitária/aplicação (`application/match-persistence/startAndPersistMatch.test.ts`)
- **Descrição:** Storage in-memory. Cobrir: (1) `startAndPersistMatch(state, persistence, options)` com sequência injetada → `loadMatch` / `getActiveMatch` com mesmas posições, mesmas 5 (ordem) e mesmo pool (composição); load **não** chama `startMatch`; (2) sequência inválida → erro de domínio e storage **sem** `RaceSetup` novo; (3) segundo início persistido rejeitado sem corromper posições. Reutilizar `persistCreatedMatch`.
- **Rastreabilidade:** Spec §17.5, RN-09, RN-20, RF-08; Plan §9 item 9, TDD item 10
- **Dependências:** Tarefa 30
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (options não encaminhadas ou load reexecutando).

---

### Tarefa 32 — [GREEN] Encaminhar opções em `startAndPersistMatch`

- **Tipo:** Implementação
- **Descrição:** `startAndPersistMatch(state, persistence, options?)` chama `startMatch(state, options)`; só persiste se `ok`. Load inalterado (só deserialize). Domínio sem `localStorage`; aplicação sem React/Next.
- **Componentes envolvidos:** `startAndPersistMatch`; `MatchPersistence`; `startMatch`
- **Dependências:** Tarefa 31
- **Critério de conclusão:** Testes da Tarefa 31 passando.

---

### Tarefa 33 — Executar testes (persistência)

- **Tipo:** Validação
- **Descrição:** `npm test` em `application/match-persistence` (e domínio se afetado).
- **Em caso de falha:** Protocolo §4 → Tarefa 32.
- **Dependências:** Tarefa 32
- **Critério de conclusão:** Persistência verde; load sem re-reveal.

---

### Tarefa 34 — [REFACTOR] Orquestração e exports

- **Tipo:** Refatoração
- **Descrição:** Conferir barrel: exportar `RacingCard`, `StartMatchOptions`; **não** exportar `applyRacingCardMove` nem a orquestração interna. Evitar duplicar save+ativa. Independência: `domain/` sem `application/`/React/Next. Testes permanecem verdes. Sem mudar contrato.
- **Dependências:** Tarefa 33
- **Critério de conclusão:** Testes de domínio e persistência verdes; helpers internos fora da API pública.

---

### Tarefa 35 — Executar suíte completa da feature

- **Tipo:** Validação
- **Descrição:** `npm test` (match + match-config + match-persistence).
- **Em caso de falha:** Protocolo §4 → implementação correspondente.
- **Dependências:** Tarefa 34
- **Critério de conclusão:** Suíte completa verde.

---

### Tarefa 36 — Lint e build

- **Tipo:** Validação
- **Descrição:** Executar `npm run lint` e `npm run build`.
- **Em caso de falha:** Corrigir problemas introduzidos pela feature; não desabilitar regras sem necessidade.
- **Dependências:** Tarefa 35
- **Critério de conclusão:** Lint e build OK.

---

### Tarefa 37 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Descrição:** Conferir checklist do `plan.md` §13 e aceite da `spec.md` §16 (5 cartas, pool 25, pilhas, mesmo camelo, ficar no 0, Crazy no 0 após `startMatch`, rejeições, persistência sem re-reveal, sem UI). Atualizar `AGENTS.md` na lacuna “todos os camelos em `START_SPACE`” para refletir o reveal no início (plan §4.1). Registrar evidências na etapa de `implementation.md` (próxima skill).
- **Dependências:** Tarefa 36
- **Critério de conclusão:** Itens do plan §13 atendidos ou gaps explícitos reportados ao usuário; `AGENTS.md` alinhado ao comportamento novo.

## 6. Validações Finais

- [ ] Suíte de testes completa da feature executada com sucesso (`npm test`).
- [ ] Lint e build executados com sucesso.
- [ ] Critérios de conclusão do `plan.md` §13 atendidos.
- [ ] Critérios de aceite da `spec.md` §16 cobertos pelos testes.
- [ ] Nenhum teste foi alterado apenas para “passar” sem justificativa vs spec/plan (migração dos asserts de espaço 0 após início está documentada na §4).
- [ ] Domínio sem React/Next/`localStorage`; persistência só em `application/`.
- [ ] Sem UI, sem comando público de movimento/posições além de `startMatch`, sem casa 7 do `Crazy`.

## 7. Rastreabilidade resumida

| Spec / plano | Tarefas |
| --- | --- |
| §7 baralho oficial 30 | 3 → 4 → 5 |
| §17.2 / §17.4 movimento no 0 | 6 → 7 → 8 |
| §17.2 / §17.3 valor 2 e mesmo camelo | 9 → 10 → 11 |
| §17.4 pilhas | 12 → 13 → 14 → 15 |
| §17.1 início + pool 25 | 16 → 17 → 18 |
| §17.6 rejeições | 19 → 20 → 21 |
| §17.2 shuffle / permanece no 0 | 22 → 23 → 24 |
| D18 validate/serialize | 25 → 26 → 27 |
| Regressão US-04/US-05 | 28 → 29 → 30 |
| §17.5 persistência | 31 → 32 → 33 |
| Plan §9 item 10 suíte + aceite | 35 → 36 → 37 |

## 8. Próxima Etapa

Implementar as tarefas deste arquivo via skill `create-implementation`, gerando `docs/implementation/us-06-posicoes-iniciais-camelos/implementation.md`, e em seguida validar com `create-validation`.

Input desta etapa:

```text
docs/tasks/us-06-posicoes-iniciais-camelos/tasks.md
```
