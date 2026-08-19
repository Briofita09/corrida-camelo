# Plano de Implementação — US-04 Fluxo de início da partida

## 1. Contexto

Hoje `startMatch` já transita `Created` → `RaceSetup`, rejeita segundo início e `Finished`, e **não** reordena `players`. Ainda **não** define o primeiro turno (`currentTurnPlayerId` permanece nulo), **não** revalida invariantes antes de iniciar, e a persistência US-03 cobre sobretudo a partida **criada** — o estado iniciado (fase + turno) ainda não é o contrato de aceite desta história.

Esta feature resolve: **iniciar** uma partida `Created` válida com estado inicial completo e determinístico, **gravar o primeiro turno**, **rejeitar** origem inválida / segundo início / andamento / encerrada / estado parcial, e **persistir** o `RaceSetup` para reload sem re-iniciar nem resortear.

UI, baralho, apostas, pista, fennec, IA e servidor continuam fora de escopo.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-04-fluxo-inicio-partida/spec.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md` (fases, `startMatch`, invariantes)
- `docs/spec/us-02-configuracao-nova-partida/spec.md` (config válida → `Created`)
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md` (ordem = `players`; início não reordena; rodada 0 = `players[0]`)
- `domain/match/`, `domain/match-config/`, `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md` (turno no estado de domínio, não na UI)
- `docs/guidelines/02-rendering-strategy.md` (sem Client Components nesta US)

## 3. Objetivo da Implementação

Entregar, com Vitest e TDD:

1. **Domínio (`domain/match`)** — `startMatch` produz o estado da spec §7: `RaceSetup`, `currentTurnPlayerId = players[0].id`, jogadores/camelos/£3/ordem/`playerRoundIndex` preservados; rejeita `Created` inválida, fases ≠ `Created` e `Finished`; comando imutável.
2. **Validação / hidratação** — `RaceSetup` sem turno, `Created` com turno, ou listas incompletas **não** passam como partida iniciada válida (D14 / RN-14).
3. **Aplicação** — após início bem-sucedido, persistir o estado iniciado; load **não** chama `startMatch` nem sorteio; falha de domínio **não** grava `RaceSetup` parcial.
4. **Configuração** — config inválida não gera partida iniciada; mutar rascunho de `MatchConfig` não altera partida já iniciada. Sem API nova de edição de elenco na partida.
5. **Testes** — cobrir spec §13 e regressão US-01–US-03.

Sem telas React nesta US.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

| Área | Impacto |
| --- | --- |
| Domínio `match` | **Principal** — `startMatch`, `validateMatchState`, testes de serialize/start |
| Aplicação `match-persistence` | **Secundário** — persistir/restaurar estado iniciado; orquestração start→save |
| Domínio `match-config` | **Testes** — config inválida não inicia; rascunho isolado da partida |
| Frontend (`app/*`) | Nenhum |
| Backend / API / DB | Nenhum |

### 4.2 Componentes existentes

| Componente | Ação |
| --- | --- |
| `startMatch` | Modificar: após guards de fase, validar estado; no sucesso definir `currentTurnPlayerId`; preservar resto |
| `validateMatchState` | Modificar: `Created` exige turno nulo; `RaceSetup` exige turno de jogador existente |
| `serialize` / `deserialize` | Reutilizar; round-trip pós-início deve incluir o turno |
| `createMatch` / `createMatchFromConfig` | Reutilizar; **não** iniciar nem definir turno (continuam `Created` + turno nulo) |
| `persistCreatedMatch` / `saveMatch` / `loadMatch` | Reutilizar para gravar/restaurar `RaceSetup`; load sem `startMatch` |
| Testes US-01 (`startMatch.test.ts`, `serialize.test.ts`) | Estender asserts de turno, preservação e rejeições |
| Testes US-03 (`advancePlayerRound.test.ts`) | Regressão: início ainda não reordena; turno definido não quebra avanço de rodada |

### 4.3 Novos componentes

| Componente (responsabilidade) | Camada |
| --- | --- |
| Orquestração `startAndPersistMatch` (domínio `startMatch` + persistência só se o início ok) | Aplicação |
| Suíte/casos extras em `startMatch.test.ts`, `validateMatchState.test.ts`, persistência | Testes |

Não criar comando `startFromConfig` (spec D1: início **não** gera a partida).

Estrutura-alvo (módulos já existentes):

```text
domain/match/
  startMatch.ts
  validateMatchState.ts
  startMatch.test.ts
  validateMatchState.test.ts
  serialize.test.ts

application/match-persistence/
  startAndPersistMatch.ts   # novo, orquestração fina
  matchPersistence.test.ts  # casos de RaceSetup + load sem re-início
```

Nomes de arquivo finos podem ser ajustados em `tasks`; responsabilidades acima são fixas.

## 5. Estratégia de Implementação

### 5.1 Abordagem

1. **Um único comando de início:** continuar `startMatch(state)` em `domain/match`. Não fundir com `createMatch` / `createMatchFromConfig`.
2. **Fluxo interno de `startMatch`:**
   1. se `Finished` → rejeitar (`MATCH_FINISHED`);
   2. se fase ≠ `Created` → rejeitar (`INVALID_PHASE`) — cobre segundo início, andamento (`RaceSetup`…`FinalPayout`);
   3. `validateMatchState(state)` — se inválido, rejeitar **sem** produzir `RaceSetup` (RN-02, RN-13);
   4. sucesso: novo objeto com `phase: "RaceSetup"`, `currentTurnPlayerId: state.players[0].id`, cópias de `players`/`camels`, mesmos `id`, `currentLeg`, `playerRoundIndex`.
3. **Primeiro turno (D3):** `players[0]` é o primeiro da ordem base (US-03, rodada 0). Não consultar RNG. Não chamar `advancePlayerRound`.
4. **Preservação (RN-04–RN-09):** não reordenar, não resortear camelos, não alterar £, não zerar/incrementar `playerRoundIndex`.
5. **Imutabilidade:** não mutar o `Created` de entrada; duas execuções independentes sobre cópias iguais → estados semanticamente equivalentes (D13).
6. **Refino D14 em `validateMatchState`:**
   - `Created`: `currentTurnPlayerId === null`;
   - `RaceSetup`: `currentTurnPlayerId` string de um `players[].id`;
   - **não** exigir na validação que o turno seja sempre `players[0]` (o **comando** de início define isso; fases futuras podem mudar o turno sem voltar a `Created`);
   - `LegInProgress` permanece com a regra US-01 já existente.
7. **Estado parcial:** hidratar/validar `RaceSetup` sem turno, `Created` com turno, ou camelos/jogadores incompletos → rejeitado; `saveMatch` só persiste o que o domínio serializa após `validate`/`serialize` — falha de serialize impede escrita.
8. **Persistir depois do domínio (abertura spec §16):**
   ```text
   startMatch(Created) → se ok → saveMatch(RaceSetup) + setActive
                      → se erro → nenhum write de iniciado
   ```
   Se `saveMatch` falhar, o storage permanece o anterior (tipicamente `Created` já persistido na US-03). Não gravar JSON incompleto.
9. **`startAndPersistMatch(state, persistence)`:** orquestra o passo 8. Não chama `createMatch`. Load continua só `deserialize` (RN-16).
10. **Config inválida / sem `Created`:** rejeição em `validateMatchConfig` / `createMatchFromConfig` (já US-02) e/ou `getActiveMatch` (`NO_ACTIVE_MATCH`) / `startMatch` sem estado `Created`. Nenhuma partida `RaceSetup` é produzida. Testes de fluxo cobrem isso **sem** novo comando que inicie a partir do rascunho.
11. **Configuração congelada (RF-08):** não adicionar API de alterar elenco/dificuldade em `MatchState`. Cobrir: (a) `startMatch` não altera nomes/tipos/dificuldades; (b) `updateParticipant` no rascunho de `MatchConfig` **não** muda a partida iniciada (objetos distintos).
12. **Concorrência (RN-18):** sem lock/servidor. Contrato testável: `startMatch(já iniciada)` rejeita; `startAndPersistMatch` na segunda chamada sobre o estado persistido `RaceSetup` rejeita e **não** altera storage. Duas chamadas de `startMatch` sobre **cópias** `Created` iguais cobrem determinismo (§13.5), não “duas transições no mesmo agregado”.

### 5.2 O que não fazer

- Telas, rotas, botão “Iniciar”, hooks de UI.
- Fase `in_progress`; pular para `LegInProgress` / `LegSetup`.
- Baralho, apostas, comprimento de pista, fennec, IA.
- Segundo sorteio no início.
- `startMatch` dentro de `createMatchFromConfig`.
- Persistência de rascunho de `MatchConfig`.
- WebSocket, lock distribuído, backend.

## 6. Estratégia BDD

Cenários da `spec.md` §13 → testes Vitest (domínio + aplicação). Sem E2E.

| Cenário (spec) | Estratégia |
| --- | --- |
| Iniciar `Created` válida (§13.1) | `identityOrdering` → `startMatch` → `RaceSetup`, turno = A, ordem/£/camelos/`playerRoundIndex` 0, input intacto |
| Config inválida (§13.2) | `createMatchFromConfig` rejeita; nenhum `RaceSetup`; não persistir iniciado |
| Sem partida `Created` (§13.2) | `getActiveMatch` sem ativa **ou** `startMatch` só aceita `Created`; rejeição explícita |
| Segundo início (§13.3) | sucesso + `startMatch(resultado)` rejeita; fase e turno estáveis |
| Já em andamento (§13.3) | `RaceSetup` e pelo menos outra fase ≠ `Created`/`Finished` (ex. `LegInProgress`) → rejeitado |
| Encerrada (§13.3) | `Finished` → rejeitado; snapshot igual |
| Falha na inicialização (§13.4) | `Created` com invariante quebrado (ex. camelos incompletos) → `startMatch` rejeita; origem intacta |
| Estado parcial (§13.4) | `validateMatchState` / deserialize: `RaceSetup`+turno nulo; `Created`+turno; listas incompletas |
| Duas tentativas (§13.4) | segunda sobre estado já iniciado rejeitada; no máximo um `RaceSetup` persistido no fluxo save |
| Config imutável (§13.5) | partida iniciada inalterada se o rascunho de config mudar |
| Determinismo (§13.5) | duas cópias `Created` → `startMatch` equivalentes |
| Persistência (§13.5) | `startAndPersistMatch` → load: mesma fase, turno e `players`; load não chama `createMatch`/`startMatch` |

## 7. Estratégia TDD

```text
RED → GREEN → REFACTOR
```

Ordem orientada a testes:

1. **`startMatch` sucesso completo (spec §7 / §13.1)** — RED: turno, preservação, imutabilidade do input → GREEN: preencher `currentTurnPlayerId` e copiar estado.
2. **Rejeições de fase (§13.3)** — reforçar/estender testes existentes (segundo início, andamento, `Finished`).
3. **`Created` inválida (§13.4)** — RED: início rejeitado se `validateMatchState` falha → GREEN: validar antes de transitar.
4. **Invariantes D14 / parcial (§13.4)** — RED em `validateMatchState` → GREEN regras Created vs RaceSetup.
5. **Determinismo + regressão ordem (US-03)** — duas cópias; `players` estáveis; `playerRoundIndex` 0.
6. **Config inválida / rascunho isolado (§13.2, §13.5)** — testes de fluxo US-02 + estado da partida.
7. **`startAndPersistMatch` + load (§13.5)** — RED: persistido `RaceSetup`+turno; segundo persist-start rejeita sem corromper; load sem re-início → GREEN orquestração.

Camada: unitário de domínio (principal) + unitário/aplicação com storage in-memory. Sem React.

## 8. Alterações Técnicas

### 8.1 Backend

Não aplicável.

### 8.2 Frontend

Não aplicável. Nenhuma alteração em `app/*`.

### 8.3 Banco de dados

Não aplicável. Persistência = `localStorage` já existente (`application/match-persistence`). Sem schema/migration. Estados `Created` já salvos continuam válidos; após início, o mesmo id é **sobrescrito** com `RaceSetup` completo.

Estados antigos em `RaceSetup` **sem** turno: `deserialize`/`validate` passam a **rejeitar** (D14). Aceitável nesta US (ainda sem UI de “continuar” em produção). Não hidratar turno ausente em `RaceSetup` com default silencioso.

### 8.4 APIs

Sem HTTP. Contratos internos:

| API | Responsabilidade |
| --- | --- |
| `startMatch(state)` | `Created` válida → `RaceSetup` + primeiro turno; senão `DomainResult` erro |
| `validateMatchState` | Inclui regras D14 para turno × fase |
| `startAndPersistMatch(state, persistence)` | `startMatch`; só então `saveMatch` + ativa |
| `loadMatch` / `getActiveMatch` | Restaura JSON; **não** inicia |

Códigos de erro: reutilizar `INVALID_PHASE`, `MATCH_FINISHED`, erros de `validateMatchState`; persistência reutiliza `STORAGE_*` / `NO_ACTIVE_MATCH`. Não inventar fase nova.

### 8.5 Integrações

| Integração | Detalhe |
| --- | --- |
| US-01 | Mesma transição de fase; turno em `RaceSetup` é o refino D14 |
| US-02 | Continua só até `Created`; testes de config inválida |
| US-03 | `identityOrdering` nos testes de turno = `players[0]`; persistência existente |
| Web Storage | Fake in-memory + mock `Storage` já usados |

## 9. Ordem de Implementação

```text
1. RED + GREEN: startMatch define turno e preserva estado §7
2. Estender rejeições (segundo início, andamento, Finished, input imutável)
3. Validar Created antes de transitar; rejeitar Created inválida
4. validateMatchState / deserialize: D14 e estado parcial
5. Regressão serialize round-trip pós-início; US-03 ordem/índice
6. Testes de config inválida + isolamento MatchConfig vs partida iniciada
7. startAndPersistMatch: save só após sucesso; load sem re-início; segundo início persistido rejeitado
8. npm test (suíte completa) + checklist da spec §12
```

## 10. Estratégia de Testes

| Tipo | Usar? | Escopo |
| --- | --- | --- |
| Unitário domínio | **Sim — principal** | `startMatch`, `validateMatchState`, serialize |
| Unitário/app persistência | **Sim** | start→save→load; sem re-início no load |
| Integração fluxo config | **Sim, leve** | config inválida não produz `RaceSetup` |
| UI / E2E / HTTP | Não | Fora de escopo |

Casos críticos: turno = `players[0]`; preservação; rejeições de borda; atomicidade; persistência do iniciado.

Comando: `npm test`.

## 11. Riscos e Mitigações

| Risco | Mitigação |
| --- | --- |
| Quebrar testes que esperam `RaceSetup` com turno nulo | Atualizar asserts na mesma fatia GREEN de `startMatch` / serialize |
| `validateMatchState` rígido demais (turno sempre `players[0]` em `RaceSetup`) | Validar só “turno presente e de jogador”; o valor `players[0]` é regra do **comando** `startMatch` |
| Duplo início sobre a mesma referência `Created` (duas cópias sucesso) | Documentar: determinismo ≠ duas transições do agregado; persistência serializa o segundo `startMatch(RaceSetup)` como rejeição |
| Gravar iniciado após falha de domínio | `startAndPersistMatch` só chama `saveMatch` se `startMatch.ok` |
| Acoplar domínio a storage | I/O só em `application/`; domínio sem `localStorage` |
| Escopo vazar para UI ou `startFromConfig` | Spec D1/D7; plan §5.2 |

## 12. Dependências

| Dependência | Tipo |
| --- | --- |
| Spec US-04 | Funcional — fonte da verdade |
| US-01 `startMatch` / fases / validate | Técnica — base a estender |
| US-02 generate / validate config | Técnica — origem válida |
| US-03 ordem, `playerRoundIndex`, persistência | Técnica — preservar e reutilizar |
| Vitest | Já configurado |
| UI “Iniciar” | Não bloqueia (abertura da spec) |

## 13. Critérios para Conclusão

- [ ] `startMatch` em `Created` válida → `RaceSetup` com `currentTurnPlayerId = players[0].id`.
- [ ] Jogadores, ordem, camelos na largada, £3 e `playerRoundIndex` 0 preservados; input não mutado.
- [ ] Rejeita config/`Created` inválida, ausência de `Created`, segundo início, andamento, `Finished`.
- [ ] `validateMatchState` rejeita estado parcialmente iniciado (D14 / RN-14).
- [ ] Início determinístico (cópias iguais → resultado equivalente).
- [ ] Rascunho de `MatchConfig` não altera partida iniciada; sem API de editar elenco da partida.
- [ ] `startAndPersistMatch` grava só sucesso; load restaura fase+turno+ordem sem novo início/sorteio.
- [ ] `npm test` passa (match + match-config + persistência).
- [ ] Critérios de aceite da spec §12 satisfeitos.
- [ ] Nenhuma UI introduzida.

## 14. Próxima Etapa

Decompor este plano em tarefas operacionais (`tasks.md`) via skill `create-tasks`, usando:

```text
docs/plan/us-04-fluxo-inicio-partida/plan.md
```

como input, com rastreabilidade para `docs/spec/us-04-fluxo-inicio-partida/spec.md`.
