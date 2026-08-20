# Plano de Implementação — US-06 Posições iniciais dos camelos

## 1. Contexto

Hoje `createMatch` e `startMatch` deixam os **6 camelos no espaço 0**. A US-04 trata o início como determinístico e **sem** reposicionar camelos. Não há cartas de corrida no estado, nem regras de pilha em movimento.

Esta feature resolve: no **início** (`Created` → `RaceSetup`), embaralhar as **30** cartas oficiais, revelar **exatamente 5** em sequência, mover os camelos de corrida (+1/+2) com as **regras oficiais de pilha** (exceção no espaço 0), gravar as 5 cartas e o **pool restante de 25**, e persistir isso para o reload **não** reembaralhar.

`Crazy` permanece no espaço 0. UI, casa 7, baralho da etapa e movimento em turno continuam fora de escopo.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-06-posicoes-iniciais-camelos/spec.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md` (camelos, espaço + `stackOrder`, serialização)
- `docs/spec/us-04-fluxo-inicio-partida/spec.md` (início atômico; **refinada** em posições e RNG)
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md` (RNG injetável / `identityOrdering` como padrão a espelhar)
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md` (stub não altera tabuleiro; copiar novos campos do estado)
- `docs/rules/corrida_camelo_regras.md` §§3.2 e 5.1–5.2
- `domain/match/`, `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md` (posições e cartas no estado de domínio, não na UI)
- `docs/guidelines/02-rendering-strategy.md` (sem Client Components nesta US)

## 3. Objetivo da Implementação

Entregar, com Vitest e TDD:

1. **Domínio (`domain/match`)** — `startMatch` passa a executar o procedimento da spec §9–§10: baralho oficial, embaralhamento, 5 revelações sequenciais, movimento com pilha, `Crazy` no 0; rejeição atômica se a sequência for inválida ou os camelos de corrida não estiverem no espaço 0.
2. **Estado serializável** — partida iniciada inclui as **5 cartas reveladas (ordem)** e o **pool restante (25)**; `Created` ainda não tem o procedimento (campos nulos). Round-trip JSON preserva composição e ordem das reveladas.
3. **Testabilidade (RF-09)** — injetar embaralhamento **ou** sequência revelada, no mesmo espírito de `CreateMatchOptions` / `identityOrdering`.
4. **Aplicação** — `startAndPersistMatch` grava o estado já posicionado; load **não** chama `startMatch` (não reembaralha). Propagar opções de teste até a orquestração quando necessário.
5. **Regressão** — US-01 criação continua todos no 0; US-04 turno/elenco/£3; US-05 stub **não move** camelos (preserva as posições já determinadas); testes que ainda esperam “todos no 0 após iniciar” são atualizados, não enfraquecidos.

Sem telas React nesta US.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

| Área | Impacto |
| --- | --- |
| Domínio `match` | **Principal** — tipos, `startMatch`, validação, serialize, movimento de setup, constantes do baralho |
| Aplicação `match-persistence` | **Secundário** — persistir/restaurar cartas + posições; opções no `startAndPersistMatch`; testes de load sem re-reveal |
| Domínio `match-config` | Nenhum (início continua sobre partida já criada) |
| Frontend (`app/*`) | Nenhum |
| Backend / API / DB | Nenhum |
| Documentação estável (`AGENTS.md`) | Atualizar lacuna “todos no espaço 0” na implementação |

### 4.2 Componentes existentes

| Componente | Ação |
| --- | --- |
| `startMatch` | Modificar: após guards US-04, rodar preparação; aceitar opções de baralho/sequência; no sucesso, camelos + cartas no estado |
| `MatchState` / `types.ts` | Estender com cartas reveladas e pool restante |
| `createMatch` | Preencher os novos campos como **nulos** (procedimento não roda na criação); camelos continuam no 0 |
| `validateMatchState` | `Created`: cartas nulas; camelos no espaço 0. Fase ≠ `Created`: 5 reveladas + 25 restantes, composição oficial, sem interseção |
| `serialize` / `deserialize` | Reutilizar via `validateMatchState`; round-trip inclui cartas e posições |
| `performTurnAction` / `applyNextTurn` | Copiar os novos campos (não perder pool no avanço de turno); stub continua sem mover camelos |
| `startAndPersistMatch` | Encaminhar opções opcionais a `startMatch`; load inalterado (só deserialize) |
| Testes US-04 (`startMatch.test.ts`) | Deixar de exigir todos os camelos no 0 após sucesso; injetar sequência para determinismo |
| Testes US-05 (`performTurnAction.test.ts`) | “Não altera camelos” = **mesmas** posições do estado iniciado, não “todos no 0” |
| `playerOrdering` / `RandomFn` | Reutilizar o tipo de RNG; Fisher–Yates análogo para as 30 cartas |

### 4.3 Novos componentes

| Componente (responsabilidade) | Camada |
| --- | --- |
| Tipo `RacingCard` (`camelId` de corrida + `value` 1 \| 2) e constantes do baralho oficial (30) | Domínio |
| Fábrica do baralho oficial + estratégia de embaralhamento (aleatória / identidade / custom) | Domínio |
| Aplicar **uma** carta de corrida (movimento + pilha, spec §10) — helper **interno** | Domínio |
| Orquestrar as 5 revelações e montar reveladas + pool — helper interno usado só por `startMatch` | Domínio |
| `StartMatchOptions` (embaralhamento e/ou sequência revelada) | Domínio |
| Suítes de movimento/setup e persistência do pool | Testes |

Helpers de movimento **não** entram no barrel público (mesmo critério dos helpers de turno da US-05). O comando de produto continua sendo `startMatch`.

Estrutura-alvo:

```text
domain/match/
  types.ts                         # RacingCard + campos no MatchState
  constants.ts                     # composição do baralho / valores
  racingCards.ts                   # baralho oficial + embaralhamento injetável
  applyRacingCardMove.ts           # interno: uma carta → novas posições
  determineInitialCamelPositions.ts # interno: 5 cartas + pool
  startMatch.ts                    # passa a chamar o procedimento
  startMatch.test.ts               # estender
  racingCards.test.ts / applyRacingCardMove.test.ts  # colocalizados
  validateMatchState.ts            # invariantes Created vs iniciado
  serialize.test.ts                # round-trip com cartas

application/match-persistence/
  startAndPersistMatch.ts          # options opcionais
  startAndPersistMatch.test.ts     # posições + pool; load sem re-reveal
```

Nomes de arquivo finos podem ser ajustados em `tasks`; responsabilidades acima são fixas.

## 5. Estratégia de Implementação

### 5.1 Modelo de cartas e estado (spec D18, abertura §20)

Nomes de contrato desta US:

| Campo em `MatchState` | `Created` | Após início bem-sucedido |
| --- | --- | --- |
| `setupRevealedRacingCards` | `null` | array de **5** `RacingCard` na ordem de revelação |
| `remainingRacingCards` | `null` | array de **25** `RacingCard` (pool; ordem interna **não** é contrato de produto — D19) |

`RacingCard`: `{ camelId: Yellow\|Green\|Blue\|Purple\|Red, value: 1 \| 2 }`. Sem `Crazy`, sem valor 0.

Composição oficial (spec §7): 5 cartas de valor 1 e 1 de valor 2 **por** cor de corrida (30 no total). Cartas da mesma cor e valor são indistinguíveis; o pool restante compara-se por **multiconjunto**.

Validação:

- `Created`: ambos os campos `null`; os **6** camelos no espaço 0 (alinha D2 / RN-01).
- Qualquer fase ≠ `Created`: exatamente 5 reveladas válidas, 25 restantes, união = 30 oficiais, interseção vazia (multiconjunto). Não exigir `Crazy` no 0 como invariante permanente de `RaceSetup` (história futura da casa 7).
- JSON antigo de `RaceSetup` **sem** esses campos → `deserialize`/`validate` **rejeita** (mesmo critério da US-04 com turno ausente). Aceitável: ainda não há UI de continuar partida em produção.

### 5.2 Injeção (RF-09 / RNF-02)

Espelhar `CreateMatchOptions`:

```text
startMatch(state, options?: StartMatchOptions)

StartMatchOptions:
  - shuffleRacingCards?: (deck: RacingCard[]) => RacingCard[]
  - revealedRacingCards?: RacingCard[]   # sequência forçada (testes / rejeições)
```

Comportamento:

1. Constituir o baralho oficial de 30 (ordem estável documentada, ex. por cor na ordem de `RACING_CAMEL_IDS`, cinco `1` e depois o `2`).
2. Se `revealedRacingCards` estiver presente: essa é a sequência a aplicar (**não** embaralhar). Deve ter comprimento **5**, só cartas válidas, e ser submulticonjunto do oficial; o pool = oficial **menos** as 5 (multiconjunto). Caso contrário → rejeitar o início inteiro (`Created` intacta).
3. Senão: `shuffle = shuffleRacingCards ?? Fisher–Yates com Math.random` (ou `random` injetável, reutilizando `RandomFn`). Embaralhar as 30, revelar as **5 primeiras**, pool = as 25 seguintes.
4. Helper de teste tipo `identityRacingCardOrdering`: não permuta — as 5 primeiras do baralho estável (cinco `Yellow` valor 1, se a ordem estável for essa). Útil para “mesmo camelo” e “outros no 0”.

`revealedRacingCards` prevalece sobre o shuffle quando ambos vierem (caminho de teste). Produção chama `startMatch(state)` sem opções.

Determinismo (spec RN-21 / refino US-04 D15): **mesma sequência de 5** → mesmo resultado. Duas chamadas **sem** opções **não** precisam ser iguais (RNG). O teste US-04 de “cópias iguais → `toEqual`” deve passar a injetar a **mesma** sequência ou o mesmo shuffle.

### 5.3 Fluxo interno de `startMatch`

Manter guards da US-04 (`Finished` → `MATCH_FINISHED`; fase ≠ `Created` → `INVALID_PHASE`; `validateMatchState` da origem). Em seguida:

1. Se algum camelo de corrida **não** está no espaço 0 → rejeitar (RN-01). `Crazy` deve estar no 0 neste instante (estado `Created` válido).
2. Resolver as 5 cartas + pool (§5.2). Inválido → rejeitar **sem** mutar input e **sem** `RaceSetup`.
3. Partindo de cópias dos camelos, aplicar as 5 cartas **em ordem** (spec §10).
4. Sucesso: novo objeto `RaceSetup`, turno/`playerRoundIndex`/£/`players` como US-04, camelos resultantes, `setupRevealedRacingCards` e `remainingRacingCards`, `Crazy` ainda no espaço 0.

Imutabilidade: não mutar o `Created` de entrada. Atomicidade: nenhum estado “meio revelado” aceito.

Códigos de erro: reutilizar `INVALID_PHASE`, `MATCH_FINISHED` e os de `validateMatchState`. Introduzir códigos explícitos para sequência inválida (ex. `INVALID_REVEAL_COUNT`, `INVALID_RACING_CARD`) e para camelos fora da largada no início (ex. `CAMELS_NOT_AT_START`). Nomes exatos na etapa tasks; o contrato é rejeição explícita `DomainResult`.

### 5.4 Movimento e pilha (spec §10)

Helper interno, aplicado carta a carta sobre um snapshot de camelos:

| Situação | Efeito |
| --- | --- |
| Carta inválida | Não se chega aqui se §5.2 rejeitou; defesa em profundidade pode rejeitar |
| Alvo no espaço **0** | Só aquele camelo avança `N`; ninguém no 0 é carregado (`Crazy` incluso) |
| Alvo em espaço **≥ 1** | Unidade = alvo + quem tem `stackOrder` **maior** no mesmo espaço; os de baixo ficam |
| Destino vazio | Unidade ocupa o espaço; ordem interna preservada; `stackOrder` distintos, maior = topo |
| Destino já ocupado (≥ 1) | Unidade **sobe** sobre a ocupante; ordem interna de cada unidade preservada |
| Mesmo camelo de novo | Parte da posição **atual** |

`stackOrder` no espaço 0 permanece distinto (US-01 RN-07) **sem** significado de pilha de jogo (D23). Não “normalizar” pilha no 0 ao sair um camelo, além de manter unicidade.

Não exportar este helper como API de movimento de turno. Não implementar pirâmide, carta da mão, tempestade ou comprimento de pista.

### 5.5 Persistência

```text
startMatch(Created, options?) → se ok → saveMatch(RaceSetup com posições+cartas) + setActive
                               → se erro → nenhum write de iniciado
```

`startAndPersistMatch(state, persistence, options?)` só grava se o domínio aceitar. `loadMatch` / `getActiveMatch` continuam só `deserialize` — **proibido** chamar `startMatch` no load (RN-20).

`performTurnAction` deve copiar `setupRevealedRacingCards` e `remainingRacingCards` para o novo estado (senão o wrap de turno apaga o pool).

### 5.6 O que não fazer

- Telas, animação de reveal, pista visual.
- Posicionar `Crazy` na casa 7.
- Cartas de camelo doido no baralho desta preparação.
- Montar baralho da etapa (§6.4 do manual).
- Comando público separado `determineInitialCamelPositions` (D1: passo do início).
- Reembaralhar no load, em `performTurnAction` ou num segundo `startMatch`.
- Exigir na validação permanente que `Crazy` esteja no 0 em `RaceSetup` (bloquearia a US da casa 7).
- Alterar `MIN_MONEY`, ordem de jogadores ou o stub de turno para “ficar igual ao manual” além desta preparação.
- UI, servidor, persistência de rascunho de `MatchConfig`.

## 6. Estratégia BDD

Cenários da `spec.md` §17 → testes Vitest (domínio + aplicação). Sem E2E.

| Cenário (spec) | Estratégia |
| --- | --- |
| Início revela 5 e posiciona (§17.1) | `revealedRacingCards` controlada → `RaceSetup`, 5 registradas na ordem, pool 25, união = 30, `Crazy` no 0, turno US-04 |
| Embaralha antes de revelar (§17.2) | shuffle injetado que permuta de forma conhecida → reveladas = 5 primeiras da permutação; composição oficial |
| Valor 1 / valor 2 (§17.2) | primeira carta `Yellow` 1 → espaço 1; `Green` 2 → espaço 2; demais de corrida ainda não revelados no 0 |
| Permanece atrás da linha (§17.2) | 5 cartas sem `Red` → `Red` no 0 e estado válido |
| Mesmo camelo várias vezes (§17.3) | `Blue` 1 depois `Blue` 2 → espaços 1 depois 3 |
| Dois na mesma casa (§17.4) | `Yellow` 1, `Green` 1 → ambos no 1, Green **acima** de Yellow |
| Três ou mais (§17.4) | três cores valor 1 → uma pilha, ordem de chegada de baixo para cima |
| Carrega quem está em cima (§17.4) | após empilhar Green em Yellow, carta `Yellow` 1 → os dois no 2, Green ainda acima |
| Sair do 0 não carrega (§17.4) | `Yellow` 1 com Green e Crazy no 0 → só Yellow no 1 |
| 5 fora do pool da etapa (§17.5) | pool não contém as reveladas; length 25 |
| Crazy não posicionado (§17.5) | espaço 0; nenhuma carta `Crazy` revelada |
| Reload (§17.5) | `startAndPersistMatch` com sequência injetada → load: mesmas posições, mesmas 5, mesmo pool; load não chama `startMatch` |
| Quantidade ≠ 5 (§17.6) | `revealedRacingCards` com 4 ou 6 → rejeitado; `Created` e camelos no 0 |
| Valor/cor inválidos (§17.6) | valor 0, 3 ou `camelId` Crazy → rejeitado; sem movimento parcial |
| Segundo início (§17.6) | sucesso + `startMatch(resultado)` rejeita; posições e pool estáveis |

## 7. Estratégia TDD

```text
RED → GREEN → REFACTOR
```

Ordem orientada a testes:

1. **Baralho oficial + tipos** — RED: 30 cartas, 6 por cor (cinco `1` + um `2`); rejeitar carta inválida na composição → GREEN: constantes/fábrica.
2. **Uma carta a partir do 0** — RED: `Yellow` 1 → espaço 1, demais no 0, Crazy no 0, ninguém carregado → GREEN: helper de movimento.
3. **Valor 2 e mesmo camelo cumulativo** — RED: `Blue` 1 depois `Blue` 2 → 1 depois 3 → GREEN.
4. **Pilhas** — RED: dois no mesmo espaço (chegada por cima); três; Yellow carrega Green; sair do 0 não carrega → GREEN: spec §10.3–10.4.
5. **`startMatch` com sequência injetada (happy path §17.1)** — RED: 5 reveladas, pool 25, fase/turno US-04, input intacto → GREEN: procedimento no início.
6. **Rejeições de sequência e camelos fora da largada (§17.6, RN-01)** — RED → GREEN: atomicidade.
7. **Shuffle injetado (§17.2)** — RED: 5 primeiras da permutação → GREEN: embaralhar antes de revelar.
8. **`validateMatchState` / serialize** — RED: `Created` com cartas preenchidas inválido; `RaceSetup` sem cartas inválido; round-trip → GREEN.
9. **Regressão US-04/US-05** — atualizar asserts de “todos no 0”; stub preserva posições; segundo início não reposiciona.
10. **`startAndPersistMatch` + load (§17.5)** — RED: persistido com posições+cartas; load sem `startMatch` → GREEN: encaminhar options; save só se `ok`.

Camada: unitário de domínio (principal) + unitário/aplicação com storage in-memory. Sem React.

## 8. Alterações Técnicas

### 8.1 Backend

Não aplicável.

### 8.2 Frontend

Não aplicável. Nenhuma alteração em `app/*`.

### 8.3 Banco de dados

Não aplicável. Persistência = `localStorage` já existente. Sem schema/migration. Após início, o JSON do mesmo `id` é **sobrescrito** com posições + `setupRevealedRacingCards` + `remainingRacingCards`.

Estados antigos em `RaceSetup` **sem** cartas: rejeitados na hidratação. Não inventar default silencioso de pool vazio nem reexecutar o reveal.

### 8.4 APIs

Sem HTTP. Contratos internos:

| API | Responsabilidade |
| --- | --- |
| `startMatch(state, options?)` | Início US-04 **mais** preparação de posições; senão `DomainResult` erro |
| Fábrica / shuffle do baralho oficial | Produção aleatória; testes injetáveis |
| `validateMatchState` | Invariantes de cartas × fase e camelos no 0 em `Created` |
| `startAndPersistMatch(state, persistence, options?)` | `startMatch`; só então `saveMatch` + ativa |
| `loadMatch` / `getActiveMatch` | Restaura JSON; **não** inicia / não revela |
| `performTurnAction` | Copia campos novos; não move camelos |

Barrel público: tipos `RacingCard`, `StartMatchOptions`, constantes úteis (`RACING_CAMEL_IDS` já existe), `startMatch`. Não exportar `applyRacingCardMove`.

### 8.5 Integrações

| Integração | Detalhe |
| --- | --- |
| US-01 | Criação inalterada (todos no 0, cartas `null`); invariante de `stackOrder` distinto |
| US-03 | RNG/`RandomFn` como precedente; persistência existente |
| US-04 | Mesma transição de fase e turno; posições e RNG **refinados**; atomicidade e segundo início iguais |
| US-05 | Stub não reposiciona; deve **preservar** pool e posições ao copiar estado |
| Web Storage | Fake in-memory + mock `Storage` já usados |

## 9. Ordem de Implementação

```text
1. Modelo RacingCard + baralho oficial (30) + invariantes de composição
2. RED + GREEN: movimento de uma carta (espaço 0, +1/+2, sem carregar no 0)
3. Pilhas: dois, três+, carregar os de cima, mesmo camelo cumulativo
4. startMatch integra o procedimento (sequência injetada, pool 25, Crazy no 0, US-04 intacta)
5. Rejeições: ≠5 cartas, carta inválida, camelos fora do 0, segundo início
6. Shuffle injetado + default Fisher–Yates; helper identidade para testes
7. validateMatchState + serialize/deserialize (Created nulo vs iniciado 5+25)
8. Copiar campos em performTurnAction; corrigir regressão US-04/US-05
9. startAndPersistMatch + load sem re-reveal
10. npm test (suíte completa) + checklist da spec §16
```

## 10. Estratégia de Testes

| Tipo | Usar? | Escopo |
| --- | --- | --- |
| Unitário domínio | **Sim — principal** | baralho, movimento/pilha, `startMatch`, validate, serialize |
| Unitário/app persistência | **Sim** | start→save→load; load sem novo reveal |
| UI / E2E / HTTP | Não | Fora de escopo |

Casos críticos: exatamente 5; pool 25 sem as reveladas; valor 1 vs 2; mesmo camelo; ficar no 0; pilhas e carregar; não carregar no 0; `Crazy` no 0; rejeição atômica; reload.

Comparar o **pool restante** por multiconjunto (ordem não é contrato). Comparar as **5 reveladas** por ordem.

Comando: `npm test`.

## 11. Riscos e Mitigações

| Risco | Mitigação |
| --- | --- |
| Quebrar US-04 (`camels.every(space === 0)` e determinismo sem opções) | Atualizar asserts na mesma fatia; determinismo **com sequência injetada** |
| US-05 assume camelos no 0 após o stub | Assertir igualdade com o estado **já iniciado**, não com a largada |
| Tratar `stackOrder` no espaço 0 como pilha e carregar `Crazy` | Teste §17.4 explícito; ramo `space === 0` não monta unidade |
| Invariante “Crazy sempre no 0 em RaceSetup” bloquear US futura | Validação permanente **não** exige Crazy no 0; só o comando `startMatch` garante isso agora |
| JSON legado sem cartas | Rejeitar na hidratação; sem default silencioso |
| `performTurnAction` dropar os novos campos | Cópia explícita no clone do estado; teste de round-trip após uma ação |
| Gravar iniciado após sequência inválida | `startAndPersistMatch` só persiste se `startMatch.ok` |
| Exportar movimento como API de turno | Helpers internos; único comando público desta fatia é `startMatch` |
| Flakiness do shuffle padrão | Testes de posição usam sequência/shuffle injetados |

## 12. Dependências

| Dependência | Tipo |
| --- | --- |
| Spec US-06 | Funcional — fonte da verdade |
| US-01 camelos / validate / serialize | Técnica |
| US-04 `startMatch` + persistência do iniciado | Técnica — ponto de extensão |
| US-03 `RandomFn` / persistência | Técnica — padrão de injeção e load |
| US-05 cópia de estado no stub | Técnica — não perder pool |
| Vitest | Já configurado |
| UI de reveal / casa 7 / baralho da etapa | Não bloqueiam (aberturas da spec) |

## 13. Critérios para Conclusão

- [ ] `startMatch` em `Created` válida embaralha (ou usa sequência injetada), revela 5, posiciona camelos de corrida e grava pool de 25.
- [ ] Camelos de corrida partem do espaço 0; um ou mais podem permanecer no 0; `Crazy` permanece no 0.
- [ ] Valor 1/2, mesmo camelo cumulativo, pilhas (2, 3+), carregar os de cima e não carregar no espaço 0 cobertos por teste.
- [ ] As 5 reveladas não estão no pool restante; união = 30 oficiais.
- [ ] Sequência ≠ 5 ou carta inválida rejeita o início por completo; input `Created` intacto.
- [ ] Turno, elenco, £3, ordem e `playerRoundIndex` seguem a US-04.
- [ ] `Created` serializa cartas `null`; iniciado round-trip preserva reveladas (ordem) e pool (composição).
- [ ] Load restaura posições e cartas **sem** `startMatch`.
- [ ] Stub US-05 não altera posições nem o pool.
- [ ] `npm test` passa (match + match-config + persistência).
- [ ] Critérios de aceite da spec §16 satisfeitos.
- [ ] Nenhuma UI introduzida.

## 14. Próxima Etapa

Decompor este plano em tarefas operacionais (`tasks.md`) via skill `create-tasks`, usando:

```text
docs/plan/us-06-posicoes-iniciais-camelos/plan.md
```

como input, com rastreabilidade para `docs/spec/us-06-posicoes-iniciais-camelos/spec.md`.
