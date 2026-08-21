# Plano de Implementação — US-07 Inicializar camelo doido

## 1. Contexto

Hoje `createMatch` deixa os **6 camelos no espaço 0**, com `Crazy` no sentido `TowardStart`. `startMatch` posiciona os cinco camelos de corrida (US-06) e **deixa `Crazy` no espaço 0**. A validação permanente de `RaceSetup` **já não** exige `Crazy` no 0 (abertura da US-06 para esta história).

Esta feature resolve: no **mesmo início** (`Created` → `RaceSetup`), **depois** das 5 cartas da US-06, colocar `Crazy` **sozinho na casa 7** (espaço **7**), **sem inverter** o sentido chegada → partida, **sem dono** (nenhum dos 6 camelos tem jogador associado) e **sem** novo atributo de desclassificação — a identidade `Crazy` basta. Persistência já grava o estado iniciado; o load **não** recoloca o doido.

UI, movimento do doido (cartas pretas, +1, não atravessar a linha), reposicionamento de etapa (`docs/rules` §6.3), ranking e apostas continuam fora de escopo.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-07-inicializar-camelo-doido/spec.md`
- `docs/spec/us-06-posicoes-iniciais-camelos/spec.md` (posições dos de corrida; **refinada** em D12: `Crazy` deixa o espaço 0)
- `docs/spec/us-04-fluxo-inicio-partida/spec.md` (início atômico, segundo início, persistência)
- `docs/spec/us-01-dominio-estado-partida/spec.md` (elenco de 6, espaço + `stackOrder`, direção, sem dono)
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md` (stub não move camelos)
- `docs/rules/corrida_camelo_regras.md` §§3.2, 5.1–5.3 e 9
- `domain/match/`, `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md` (posição e sentido no estado de domínio, não na UI)
- `docs/guidelines/02-rendering-strategy.md` (sem Client Components nesta US)

## 3. Objetivo da Implementação

Entregar, com Vitest e TDD:

1. **Domínio (`domain/match`)** — `startMatch` passa a executar o procedimento da spec §8: US-06 (5 cartas) → posicionar `Crazy` no espaço 7, sozinho, sentido `TowardStart` intacto → `RaceSetup`.
2. **Contrato de identidade** — `Crazy` continua no elenco, fora de `RACING_CAMEL_IDS`; nenhum camelo tem dono; desclassificação = identidade `Crazy` (sem campo novo); de corrida permanecem `TowardFinish`.
3. **Aplicação** — `startAndPersistMatch` grava o estado já com `Crazy` no 7; load **não** chama `startMatch` (não recoloca nem inverte o sentido).
4. **Regressão** — US-01 criação continua os 6 no espaço 0; US-06 posições/cartas/pool inalteradas salvo a saída de `Crazy` do 0; US-04 turno/elenco/£3; US-05 stub **preserva** `Crazy` no 7; testes que ainda esperam `Crazy` no 0 **após iniciar** são atualizados, não enfraquecidos.

Sem telas React nesta US.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

| Área | Impacto |
| --- | --- |
| Domínio `match` | **Principal** — passo pós-US-06 em `startMatch`; constante do espaço 7; testes de identidade/sentido/pilha |
| Aplicação `match-persistence` | **Secundário** — testes de load com `Crazy` no 7 e sentido preservado; orquestração inalterada |
| Domínio `match-config` | Nenhum (início continua sobre partida já criada) |
| Frontend (`app/*`) | Nenhum |
| Backend / API / DB | Nenhum |
| Documentação estável (`AGENTS.md`) | Atualizar lacuna “Crazy permanece no espaço 0” e a instrução 16 (casa 7 agora tem spec) |

### 4.2 Componentes existentes

| Componente | Ação |
| --- | --- |
| `startMatch` | Modificar: após `determineInitialCamelPositions`, posicionar `Crazy` no espaço 7. Guards US-04/US-06 inalterados (`Crazy` ainda deve estar no 0 **antes** do início) |
| `determineInitialCamelPositions` | **Não** misturar o passo do doido aqui. Continua só as 5 cartas; `Crazy` permanece no 0 **durante** esse helper |
| `applyRacingCardMove` | **Não** implementar movimento de `Crazy`. Reutilizar nos testes de caracterização de pilha (RF-09): o helper já não exclui `Crazy` em espaço ≥ 1 |
| `constants.ts` | Acrescentar constante nomeada do espaço da casa 7 (abertura da spec §20) |
| `createMatch` / `initialCamels` | Reutilizar: Created com 6 no 0 e `Crazy` `TowardStart`; **não** posicionar o doido na criação |
| `CamelState` | **Não** adicionar `owner`, `playerId` nem `disqualified` |
| `validateMatchState` | `Created`: os 6 no espaço 0. `RaceSetup`: **não** tornar o espaço 7 invariante permanente (D17). Reforçar sentido dos de corrida (`TowardFinish`) no mesmo espírito do check já existente de `Crazy` → `TowardStart` |
| `serialize` / `deserialize` | Reutilizar; round-trip já leva `space` e `direction` |
| `performTurnAction` | Reutilizar; stub continua copiando camelos — após o início, `Crazy` permanece no 7 |
| `startAndPersistMatch` / `loadMatch` | Reutilizar; load **não** chama `startMatch` |
| Testes `startMatch.test.ts` | Trocar asserts `Crazy.space === 0` **após sucesso** por espaço 7 + sentido + sozinho |
| Testes US-01 (`createMatch.test.ts`) | Manter `Crazy` no 0 na Created |
| Testes `validateMatchState.test.ts` | O caso “não exige Crazy no 0 em RaceSetup” permanece válido; complementar com sentido permanente |
| Testes de persistência | Assertir `Crazy` no 7 e `TowardStart` no load |

### 4.3 Novos componentes

| Componente (responsabilidade) | Camada |
| --- | --- |
| Constante do espaço da casa 7 (ex. `CRAZY_INITIAL_SPACE = 7`) | Domínio |
| Helper interno de posicionamento do doido (Crazy sozinho no espaço 7, sentido e identidade intactos, demais camelos inalterados) — **não** exportar no barrel | Domínio |
| Suíte colocalizada do helper + extensão de `startMatch.test.ts` / persistência | Testes |

Não criar comando público `placeCrazyCamel`. O único comando de produto continua sendo `startMatch`.

Estrutura-alvo:

```text
domain/match/
  constants.ts                 # CRAZY_INITIAL_SPACE = 7
  placeCrazyCamel.ts           # interno: passo US-07
  placeCrazyCamel.test.ts      # colocalizado
  startMatch.ts                # chama o helper após determineInitialCamelPositions
  startMatch.test.ts           # estender / atualizar Crazy 0 → 7
  applyRacingCardMove.test.ts  # caracterização RF-09 (Crazy na pilha)
  validateMatchState.ts        # TowardFinish nos de corrida; não fixar espaço 7 em RaceSetup
  serialize.test.ts            # round-trip espaço + sentido de Crazy
  performTurnAction.test.ts    # stub preserva Crazy no 7
  index.ts                     # exportar a constante; não exportar o helper

application/match-persistence/
  startAndPersistMatch.test.ts # Crazy no 7 + sentido no load
```

Nomes de arquivo finos podem ser ajustados em `tasks`; responsabilidades acima são fixas.

## 5. Estratégia de Implementação

### 5.1 Passo no início (spec D1, §8)

Manter o fluxo atual de `startMatch` e **acrescentar um passo depois** da US-06:

```text
Created válida
  → guards US-04 (Finished / fase / validate)
  → camelos de corrida no espaço 0; Crazy no espaço 0 (pré-condição do início)
  → resolver 5 cartas + pool (US-06)
  → determineInitialCamelPositions (Crazy ainda no 0 neste helper)
  → posicionar Crazy no espaço 7, sozinho, TowardStart intacto   ← esta US
  → RaceSetup (turno, £, players, cartas 5+25 como US-04/US-06)
```

Imutabilidade e atomicidade: não mutar o `Created` de entrada; falha em qualquer guard anterior → rejeição total, `Crazy` permanece no espaço 0.

Não revelar carta de camelo doido. Não aplicar `applyRacingCardMove` a `Crazy`. Não calcular ranking.

### 5.2 Constante e posicionamento (abertura spec §20)

| Decisão técnica | Valor |
| --- | --- |
| Numeração | Casa 7 do manual = espaço **7** (D5) |
| Nome interno | Constante junto de `START_SPACE`, p.ex. `CRAZY_INITIAL_SPACE = 7` |
| Exportação | Exportar no barrel como `START_SPACE` (útil em testes); o **helper** não entra no barrel |
| `stackOrder` | Destino vazio: tratar como ocupação de casa vazia (`stackOrder` válido e único no espaço 7, equivalente ao padrão já usado em destino vazio por `applyRacingCardMove`) |
| Sentido | Copiar `TowardStart`; **proibido** alterar `direction` neste passo |
| Demais camelos | Posições, `stackOrder` e sentidos da US-06 intactos |

O helper interno recebe o snapshot de camelos **já** posicionado pela US-06 e devolve novo array: só `Crazy` muda de espaço (e de `stackOrder` se necessário para ficar sozinho/válido). Input não é mutado.

Não empilhar se o espaço 7 estiver ocupado: na composição oficial das 5 cartas, o máximo de um camelo de corrida é **6** casas (D14). Não inventar código de erro novo para “casa 7 ocupada”; o aceite é o teste de destino vazio após o início.

### 5.3 Identidade, dono e desclassificação (spec §9)

Contrato **sem** novos campos em `CamelState` / `MatchState`:

| Afirmação | Como o código expressa |
| --- | --- |
| `Crazy` existe | `CAMEL_IDS` inclui `Crazy`; elenco de 6 |
| Não é camelo de corrida | `RacingCamelId = Exclude<CamelId, "Crazy">`; cartas US-06 recusam `Crazy` |
| Sem dono (os seis) | `CamelState` permanece `{ id, space, stackOrder, direction }`; `Player` sem vínculo a camelo. **Não** adicionar `owner` / `playerId` |
| Desclassificado / não vence | Identidade `Crazy` (D10). **Não** adicionar booleano. Ranking **não** é implementado; `AGENTS.md` registra que US futuras de classificação **devem** ignorar `Crazy` |
| Sentido permanente | `Crazy` → `TowardStart`; de corrida → `TowardFinish`. Validação já exige Crazy `TowardStart`; esta US reforça o dual nos de corrida |

Nenhum comando desta US cria associação jogador↔camelo.

### 5.4 Validação permanente vs. garantia do comando

| Momento | `Crazy.space` | Sentido |
| --- | --- | --- |
| `Created` válido | **0** (os 6) | `TowardStart` |
| Sucesso de `startMatch` | **7** | `TowardStart` |
| `RaceSetup` / fases seguintes (validate) | **Qualquer** espaço válido ≥ 0 — **não** exigir 7 (D17: movimento e §6.3 futuros) | `TowardStart` obrigatório |

O espaço 7 é garantia do **comando de início**, não invariante de `validateMatchState` em `RaceSetup`. O sentido chegada → partida **é** invariante permanente.

### 5.5 Pilha (RF-09 / spec §10 e §17.6)

Esta US **não** implementa movimento de `Crazy` nem formação de pilha no passo de inicialização (`Crazy` sozinho no 7).

Estratégia para não perder o contrato:

1. **Inicialização** — teste: nenhum camelo de corrida no espaço 7; `Crazy` sozinho.
2. **Helper existente** — `applyRacingCardMove` já monta unidade em espaço ≥ 1 com **qualquer** `CamelState` (não filtra `Crazy`). Não alterar isso para “excluir o doido”.
3. **Caracterização (fixtures, não o início)** — testes em `applyRacingCardMove.test.ts` com estado montado: `Crazy` já em espaço ≥ 1; carta de corrida chega ou parte da mesma casa. Cobrir: Crazy por baixo (quem chega sobe); Crazy por cima (camelo de baixo leva o doido rumo à **chegada**); Crazy no meio. Explicitar que isso **não** é o movimento oficial do doido (cartas pretas / `TowardStart` / +1).
4. **Documentação** — `AGENTS.md` registra: mesma regra de pilha; Crazy pode estar em cima, no meio ou embaixo; ranking futuro ignora Crazy em qualquer posição vertical; movimento próprio do doido fica para história futura.

Não criar motor de movimento do doido, cartas 0/1/2 pretas, nem a exceção +1.

### 5.6 Persistência

```text
startMatch(Created) ok → RaceSetup com Crazy no 7 + TowardStart
                       → saveMatch + ativa
load / getActiveMatch  → deserialize; proibido startMatch / recolocar no 7 / inverter sentido
segundo startMatch     → INVALID_PHASE; Crazy permanece no 7
falha de início        → nenhum write de iniciado; Created com Crazy no 0
```

`startAndPersistMatch` já encaminha opções e só grava se `ok`. Não mudar a orquestração além dos asserts de teste.

`performTurnAction` já copia `camels`; teste de regressão: após início, uma ação stub aceita deixa `Crazy` no espaço 7 e `TowardStart`.

### 5.7 O que não fazer

- Telas, animação, pista visual, UI do Crazy Camel (`game-design.md` §17).
- Movimento de `Crazy` (cartas pretas, pirâmide, +1, não atravessar a linha de partida).
- Reposicionamento de etapa (`docs/rules` §6.3).
- Motor de classificação / vencedor / apostas.
- Campo `disqualified` / `owner` / vínculo jogador↔camelo.
- Inverter, anular ou tornar opcional `TowardStart` de `Crazy`.
- Alterar posições dos camelos de corrida, baralho US-06, turno, £ ou ordem `players`.
- Exigir na validação permanente que `Crazy` esteja no 7 em `RaceSetup`.
- Posicionar o doido em `createMatch`.
- Comando público separado de posicionamento.
- Exportar o helper interno no barrel.
- Alterar `MIN_MONEY`.
- UI, servidor, persistência de rascunho de `MatchConfig`.

## 6. Estratégia BDD

Cenários da `spec.md` §17 → testes Vitest (domínio + aplicação). Sem E2E.

| Cenário (spec) | Estratégia |
| --- | --- |
| Início posiciona na casa 7 após os de corrida (§17.1) | `revealedRacingCards` controlada → `RaceSetup`; `Crazy.space === 7`; `TowardStart`; de corrida nas casas das 5 cartas; `Crazy` não está no 0; turno/£/fase US-04 |
| Created não posiciona (§17.2) | `createMatch` → `Crazy` existe, espaço 0, `TowardStart` (regressão US-01) |
| Identidade, sem dono, desclassificado (§17.3) | Após início: exatamente um `Crazy`; `Crazy` ∉ `RACING_CAMEL_IDS`; `CamelState` sem campo de dono; desclassificação = identidade `Crazy` (sem motor de ranking) |
| Sentido sempre contrário (§17.3) | Created **e** iniciada: Crazy `TowardStart`; cada `RACING_CAMEL_IDS` `TowardFinish` |
| Destino vazio (§17.4) | Após sucesso: só `Crazy` no espaço 7; nenhum de corrida no 7 |
| Reload (§17.5) | `startAndPersistMatch` → load: mesmo espaço 7, mesmo sentido; igualdade com o persistido; load não chama `startMatch` |
| Segundo início (§17.5) | sucesso + `startMatch(resultado)` rejeita; `Crazy` permanece no 7 e `TowardStart` |
| Pilha futura (§17.6) | **Não** executar no `startMatch`. Caracterização em `applyRacingCardMove` com fixtures + registro em `AGENTS.md` |

Rejeições já cobertas pela US-04/US-06 (segundo início, sequência inválida, `Created` intacta) permanecem; após falha, `Crazy` continua no espaço 0.

## 7. Estratégia TDD

```text
RED → GREEN → REFACTOR
```

Ordem orientada a testes:

1. **Constante + helper interno** — RED: dado o snapshot pós-US-06 (Crazy no 0), o helper deixa Crazy no espaço 7, sozinho, `TowardStart`, sem mover os de corrida e sem mutar o input → GREEN: posicionamento puro.
2. **`startMatch` happy path (§17.1, §17.4)** — RED: após sequência injetada, Crazy no 7, não no 0, de corrida nas posições US-06, destino vazio, fase/turno US-04 → GREEN: chamar o helper depois de `determineInitialCamelPositions`.
3. **Created inalterada (§17.2)** — RED/GREEN: regressão; o helper **não** roda em `createMatch`.
4. **Identidade, dono, sentidos (§17.3)** — RED: um Crazy, fora de `RACING_CAMEL_IDS`, sem dono, de corrida `TowardFinish`, Crazy `TowardStart` em Created e após início → GREEN: asserts + reforço de validação dos sentidos dos de corrida se ainda faltar.
5. **Rejeições e atomicidade** — RED: segundo início preserva Crazy no 7; sequência inválida preserva Crazy no 0 e `Created` → GREEN: sem código extra se os guards atuais já bastam; só asserts.
6. **Caracterização de pilha (RF-09 / §17.6)** — RED: fixtures com Crazy em espaço ≥ 1 (por baixo / por cima / meio) via `applyRacingCardMove` → GREEN: **não** alterar o helper para excluir Crazy; só travar o comportamento existente.
7. **`performTurnAction`** — RED: stub preserva Crazy no 7 e o sentido → GREEN: cópia já existente, só teste.
8. **Serialize / persistência (§17.5)** — RED: round-trip JSON e `startAndPersistMatch` + load com Crazy no 7 e `TowardStart`; load sem `startMatch` → GREEN: sem re-orquestrar; asserts.
9. **`AGENTS.md`** — alinhar lacuna da casa 7, US-06/US-07 e instrução 16.
10. **`npm test`** (suíte completa) + checklist da spec §16.

Camada: unitário de domínio (principal) + unitário/aplicação com storage in-memory. Sem React.

## 8. Alterações Técnicas

### 8.1 Backend

Não aplicável.

### 8.2 Frontend

Não aplicável. Nenhuma alteração em `app/*`.

### 8.3 Banco de dados

Não aplicável. Persistência = `localStorage` já existente. Sem schema/migration. Após início, o JSON do mesmo `id` passa a incluir `Crazy` no espaço 7 (campo `space` já serializado). Sem default silencioso de “recolocar no 7” na hidratação.

Estados antigos em `RaceSetup` com `Crazy` ainda no 0 (partidas de desenvolvimento da US-06) **permanecem válidos** na validação permanente (D17). Esta US **não** exige migração nem rejeição desses JSON.

### 8.4 APIs

Sem HTTP. Contratos internos:

| API | Responsabilidade |
| --- | --- |
| `startMatch(state, options?)` | Início US-04 + US-06 **mais** posicionar `Crazy` no 7 |
| Helper interno de posicionamento | Só o passo US-07; não público |
| `CRAZY_INITIAL_SPACE` (nome exacto na etapa tasks) | Espaço 7 nomeado |
| `validateMatchState` | Created: 6 no 0; sentidos permanentes; **não** fixar espaço 7 em RaceSetup |
| `startAndPersistMatch` | Inalterado na orquestração; persiste o estado já com Crazy no 7 |
| `loadMatch` / `getActiveMatch` | Restaura JSON; **não** inicia / não recoloca |
| `performTurnAction` | Copia camelos; não move Crazy |

Barrel público: constante do espaço 7, `startMatch`. Não exportar o helper de posicionamento nem `applyRacingCardMove`.

### 8.5 Integrações

| Integração | Detalhe |
| --- | --- |
| US-01 | Criação inalterada (todos no 0, Crazy `TowardStart`, sem dono) |
| US-04 | Mesma transição de fase e turno; atomicidade e segundo início iguais |
| US-06 | Mesmas 5 cartas, pool 25 e posições dos de corrida; **refino**: Crazy deixa o 0 |
| US-05 | Stub não reposiciona; deve **preservar** Crazy no 7 |
| Web Storage | Fake in-memory + mock `Storage` já usados |

## 9. Ordem de Implementação

```text
1. Constante do espaço 7 + helper interno (Crazy sozinho, sentido intacto)
2. RED + GREEN: startMatch chama o helper após a US-06 (happy path §17.1 / §17.4)
3. Created permanece no 0 (§17.2); identidade / sem dono / sentidos (§17.3)
4. Rejeições: segundo início (Crazy permanece no 7); falha de cartas (Crazy permanece no 0)
5. Caracterização de pilha no helper de movimento existente (RF-09; sem movimento do doido)
6. validateMatchState: sentidos permanentes; não exigir espaço 7 em RaceSetup
7. Copiar/preservar em performTurnAction; serialize round-trip
8. startAndPersistMatch + load sem recolocar
9. Atualizar AGENTS.md (lacuna casa 7, US-07, instrução 16)
10. npm test (suíte completa) + checklist da spec §16
```

## 10. Estratégia de Testes

| Tipo | Usar? | Escopo |
| --- | --- | --- |
| Unitário domínio | **Sim — principal** | helper de posicionamento, `startMatch`, identidade/sentidos, caracterização de pilha, validate, serialize |
| Unitário/app persistência | **Sim** | start→save→load com Crazy no 7; load sem novo posicionamento |
| UI / E2E / HTTP | Não | Fora de escopo |

Casos críticos: Crazy no 7 após sucesso; Created no 0; sentido nunca invertido; sozinho no 7; de corrida nas casas da US-06; sem dono; identidade ≠ corrida; segundo início; reload; stub US-05; falha atômica.

Não exigir teste E2E de ranking (“não pode vencer”): o aceite é o contrato de identidade `Crazy` + documentação para US futura, sem algoritmo de vencedor nesta fatia.

Comando: `npm test`.

## 11. Riscos e Mitigações

| Risco | Mitigação |
| --- | --- |
| Testes US-06 ainda assertem `Crazy.space === 0` após `startMatch` | Atualizar só os asserts **pós-sucesso** de `startMatch`; manter Crazy no 0 em `determineInitialCamelPositions` / `applyRacingCardMove` a partir da largada |
| Misturar o passo do doido nas 5 cartas | Helper **depois** de `determineInitialCamelPositions`; esse helper de US-06 continua sem mover Crazy |
| Tornar espaço 7 invariante de `RaceSetup` e bloquear §6.3 futuro | `validateMatchState` **não** exige Crazy no 7; só `startMatch` garante isso no instante do sucesso |
| Adicionar `owner` / `disqualified` “por clareza” | Proibido pela spec D9/D10; testes de ausência de campo |
| Implementar movimento do doido para “cobrir” §17.6 | Só caracterização do helper de corrida + `AGENTS.md`; sem cartas pretas |
| `applyRacingCardMove` passar a ignorar Crazy na pilha | Testes de caracterização RF-09 falham se alguém filtrar `id === "Crazy"` |
| Load reexecutar o início e “corrigir” Crazy | Teste de persistência: load igual ao gravado; proibido chamar `startMatch` no load |
| Gravar iniciado após falha da US-06 | `startAndPersistMatch` só persiste se `ok` (já existente); Crazy permanece no 0 no storage de Created |
| JSON legado com Crazy no 0 em RaceSetup | Aceito na validação permanente (D17); sem migração |

## 12. Dependências

| Dependência | Tipo |
| --- | --- |
| Spec US-07 | Funcional — fonte da verdade |
| US-01 elenco / direção / serialize | Técnica |
| US-04 `startMatch` + persistência do iniciado | Técnica — mesmo comando |
| US-06 posições dos de corrida no mesmo início | Técnica — passo anterior obrigatório |
| US-05 cópia de estado no stub | Técnica — não perder posição/sentido |
| Vitest | Já configurado |
| UI do Crazy Camel / movimento / ranking / §6.3 | Não bloqueiam (aberturas da spec) |

## 13. Critérios para Conclusão

- [ ] `startMatch` em `Created` válida posiciona os de corrida (US-06) e em seguida coloca `Crazy` no espaço 7.
- [ ] Na `Created`, os 6 camelos (incluindo `Crazy`) permanecem no espaço 0, `Crazy` em `TowardStart`.
- [ ] Após sucesso, `Crazy` está sozinho no espaço 7, `TowardStart`; nenhum camelo de corrida no 7; de corrida nas posições da US-06.
- [ ] `Crazy` não é `Yellow`…`Red`; nenhum dos 6 tem dono; desclassificação sem campo extra.
- [ ] Camelos de corrida permanecem `TowardFinish`; o posicionamento **não** inverte o sentido de `Crazy`.
- [ ] Segundo início rejeitado; `Crazy` permanece no 7. Falha de cartas: `Created` intacta, `Crazy` no 0.
- [ ] Load restaura espaço e sentido **sem** `startMatch`. Stub US-05 não move `Crazy`.
- [ ] Contrato de pilha (cima / meio / baixo) coberto por caracterização + `AGENTS.md`; sem movimento oficial do doido.
- [ ] `npm test` passa (match + match-config + persistência).
- [ ] Critérios de aceite da spec §16 satisfeitos.
- [ ] Nenhuma UI introduzida.

## 14. Próxima Etapa

Decompor este plano em tarefas operacionais (`tasks.md`) via skill `create-tasks`, usando:

```text
docs/plan/us-07-inicializar-camelo-doido/plan.md
```

como input, com rastreabilidade para `docs/spec/us-07-inicializar-camelo-doido/spec.md`.
