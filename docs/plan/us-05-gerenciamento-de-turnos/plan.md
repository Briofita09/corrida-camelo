# Plano de Implementação — US-05 Gerenciamento de turnos

## 1. Contexto

Após a US-04, uma partida iniciada (`RaceSetup`) já tem jogador ativo (`currentTurnPlayerId` = `players[0]`) e `playerRoundIndex` = 0. A US-03 define a sequência por rodada (`getRoundPlayerSequence`) e hoje existe `advancePlayerRound`, que **incrementa a rodada sem ação e sem atualizar o turno** — isso conflita com a spec US-05 (RN-07 / D5: sem skip).

Não há comando de “agir no turno”. Esta feature resolve: **autorizar só o jogador ativo**, **avançar o turno (e a rodada, se for o último da sequência)** somente após uma ação stub aceita, **rejeitar** fora do turno / `Created` / `Finished` / skip, e **persistir** o novo ativo para o reload não trocar a vez.

UI, regras de mesa, IA e desconexão continuam fora de escopo. O stub não encerra a partida nem altera o tabuleiro.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md` (fase, turno, `Finished`)
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md` (sequência por rodada)
- `docs/spec/us-04-fluxo-inicio-partida/spec.md` (primeiro ativo; início não avança turno)
- `domain/match/`, `application/match-persistence/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md` (turno no estado de domínio, não na UI)
- `docs/guidelines/02-rendering-strategy.md` (sem Client Components nesta US)

## 3. Objetivo da Implementação

Entregar, com Vitest e TDD:

1. **Domínio (`domain/match`)** — comando stub `performTurnAction(state, actorPlayerId)`: aceita só se o ator for o ativo e a partida admitir ações (spec §7); no sucesso avança turno/rodada (spec §8); imutável; preserva fase, camelos, £, `players` e id.
2. **Contrato reutilizável (RNF-06)** — extração da autorização + cálculo do próximo turno, para ações de mesa futuras não redesenharem “quem pode agir”.
3. **Fim do skip público** — `advancePlayerRound` deixa de ser comando de sucesso sem ação (RN-07). Incremento de rodada só ocorre no fluxo da ação aceita quando o ator é o último da sequência.
4. **Aplicação** — após ação aceita, persistir; load **não** reexecuta a ação nem avança o turno de novo; falha de domínio **não** grava avanço.
5. **Testes** — cobrir spec §13 (incluindo N=2 com turno consecutivo D14 e N=6) e regressão US-01/US-03/US-04.

Sem telas React nesta US.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

| Área | Impacto |
| --- | --- |
| Domínio `match` | **Principal** — ação de turno, avanço, autorização; ajuste de `advancePlayerRound` |
| Aplicação `match-persistence` | **Secundário** — persistir após sucesso; load sem reexecutar ação |
| Domínio `match-config` | Nenhum (ação opera sobre partida já criada/iniciada) |
| Frontend (`app/*`) | Nenhum |
| Backend / API / DB | Nenhum |

### 4.2 Componentes existentes

| Componente | Ação |
| --- | --- |
| `currentTurnPlayerId` / `playerRoundIndex` / `getRoundPlayerSequence` | Reutilizar; fonte da sequência e do ativo |
| `startMatch` | Reutilizar; **não** alterar (primeiro turno continua US-04) |
| `validateMatchState` | Reutilizar; origem inválida → rejeitar ação (RN-14) |
| `advancePlayerRound` | **Deixar de ser skip público de sucesso.** Rodada só avança via ação aceita. Helper interno opcional, não exportado como comando de produto |
| `createMatch` / `identityOrdering` | Reutilizar nos testes (N=2…6, ordem estável) |
| `persistCreatedMatch` / `saveMatch` / `loadMatch` | Reutilizar para gravar/restaurar após avanço |
| Testes US-03 (`advancePlayerRound.test.ts`, `playerRoundIndex.test.ts`) | Atualizar: incremento de rodada coberto pelo wrap da ação stub |

### 4.3 Novos componentes

| Componente (responsabilidade) | Camada |
| --- | --- |
| `performTurnAction(state, actorPlayerId)` — stub: autoriza + avança | Domínio |
| Autorização + próximo turno (funções internas reutilizáveis; nomes finos na etapa tasks) | Domínio |
| `performTurnActionAndPersist(state, actorPlayerId, persistence)` — domínio e, se ok, persistir | Aplicação |
| Suíte `performTurnAction.test.ts` + casos de persistência | Testes |

Estrutura-alvo:

```text
domain/match/
  performTurnAction.ts          # comando público stub
  performTurnAction.test.ts
  (helpers internos de autorização / próximo turno, colocalizados)
  index.ts                      # exportar performTurnAction; não exportar skip de rodada

application/match-persistence/
  performTurnActionAndPersist.ts
  performTurnActionAndPersist.test.ts  # ou casos no teste de persistência existente
```

Nomes de arquivo finos podem ser ajustados em `tasks`; responsabilidades acima são fixas.

## 5. Estratégia de Implementação

### 5.1 Abordagem

1. **Um comando de produto para “agir no turno” nesta US:** `performTurnAction(state, actorPlayerId: string)` em `domain/match`. O ator é **explícito** (RN-18); a UI futura só despacha o id, não escolhe o turno.
2. **Fluxo interno do comando:**
   1. se `Finished` → rejeitar (`MATCH_FINISHED`);
   2. `validateMatchState(state)` — se inválido, rejeitar sem alterar turno (RN-14);
   3. se a partida **não** admite ações de turno (spec §7: `Created`; fase sem jogador ativo existente; fora de `RaceSetup` / `LegInProgress`) → rejeitar (`INVALID_PHASE` ou `INVALID_TURN`, conforme o caso);
   4. se `actorPlayerId !== currentTurnPlayerId` → rejeitar (`NOT_CURRENT_PLAYER`); estado intacto;
   5. sucesso: novo objeto com o próximo turno/rodada (passo 3), cópias de `players`/`camels`, **mesma** fase, dinheiro, id e elenco.
3. **Cálculo do próximo turno (spec §8):**
   - `S = getRoundPlayerSequence(state.players, state.playerRoundIndex)`;
   - `k` = índice em `S` cujo `id === currentTurnPlayerId`;
   - se não encontrado → rejeitar (`INVALID_TURN`) — estado inconsistente, sem avanço parcial;
   - se `k < n-1` → `currentTurnPlayerId = S[k+1].id`; `playerRoundIndex` inalterado;
   - se `k === n-1` → `playerRoundIndex = r + 1`; `currentTurnPlayerId` = primeiro de `getRoundPlayerSequence(players, r+1)` (equivalente a `P[(r+1) mod n]`).
4. **Reuso (RNF-06):** autorização (passos 1–4) e “aplicar próximo turno” (passo 3) devem viver em helpers internos usados pelo stub, para ações futuras chamarem o mesmo contrato **depois** da regra de mesa. Nesta US o stub não tem regra de mesa: só autoriza e avança.
5. **Sem skip (D5 / RN-07):**
   - não criar `advanceTurn` / `skipTurn` de sucesso;
   - `advancePlayerRound` **não** permanece como comando público que incrementa rodada sem ação;
   - o cenário “avançar o turno sem ação válida” é coberto por: (a) ausência/rejeição desse skip; (b) `performTurnAction` de quem não é o ativo.
6. **Duplo avanço (D6):** segunda `performTurnAction` do jogador que **já** agiu é `NOT_CURRENT_PLAYER` — o ativo já é o seguinte. Não precisa de flag extra “turno já concluído”.
7. **Imutabilidade:** não mutar o estado de entrada; sucesso determinístico (D12).
8. **Fases que admitem ação:** `RaceSetup` e `LegInProgress` com `currentTurnPlayerId` de jogador existente (alinha à validação US-04). `Created` e `Finished` sempre rejeitam. `LegSetup` / `LegPayout` / `FinalPayout`: rejeitar nesta US (abertura da spec: semântica futura).
9. **Persistir depois do domínio (abertura spec §16):**
   ```text
   performTurnAction(state, actorId) → se ok → saveMatch(novo estado) + setActive
                                     → se erro → nenhum write de avanço
   ```
   Reutilizar `persistCreatedMatch` (já é save + ativa). Se `saveMatch` falhar, o storage permanece o anterior.
10. **`performTurnActionAndPersist`:** orquestra o passo 9. Load continua só `deserialize` — **não** chama `performTurnAction` (RN-15).
11. **N=2 (D14):** após B concluir a rodada 0, o ativo da rodada 1 é **B** de novo. Teste obrigatório, não tratado como bug.
12. **Códigos de erro:** reutilizar `MATCH_FINISHED`, `INVALID_PHASE`, `INVALID_TURN` e erros de `validateMatchState`. Introduzir `NOT_CURRENT_PLAYER` para ator ≠ ativo. Persistência reutiliza `STORAGE_*`.

### 5.2 O que não fazer

- Telas, “sua vez”, passagem de celular, hooks de UI.
- Movimento, apostas, baralho, fennec, pagamentos, encerrar partida no stub.
- Comando público de pular turno/rodada com sucesso.
- Alterar `startMatch`, sorteio ou ordem base.
- Hidratar/corrigir silenciosamente turno dessincronizado da sequência.
- Servidor, lock, desconexão, WebSocket.
- Persistência de rascunho de `MatchConfig`.

## 6. Estratégia BDD

Cenários da `spec.md` §13 → testes Vitest (domínio + aplicação). Sem E2E.

| Cenário (spec) | Estratégia |
| --- | --- |
| Jogador ativo no estado (§13.1) | `identityOrdering` + `startMatch` → `currentTurnPlayerId` = A (regressão US-04; não reimplementar início) |
| Ação válida avança turno (§13.1) | `performTurnAction(iniciada, A)` → ativo B; índice 0; fase/£/camelos/`players` iguais; input intacto |
| Fora do turno (§13.2) | `performTurnAction(..., B)` com ativo A → `NOT_CURRENT_PLAYER`; estado igual |
| Avançar sem ação válida (§13.2) | skip público inexistente ou rejeitado; turno permanece A |
| Dupla conclusão do mesmo turno (§13.2) | A sucesso → B ativo; A de novo → rejeitado; ativo continua B |
| Último da rodada 0 (§13.3) | ordem A,B,C,D; ativo D; sucesso → índice 1, ativo **B**; `players` estável |
| Dois jogadores (§13.4 / D14) | A → B (índice 0); B → índice 1 e ativo **B** |
| Seis jogadores (§13.4) | A…E sequenciais → F; F → índice 1, ativo **B** |
| `Finished` (§13.5) | qualquer ator → `MATCH_FINISHED`; snapshot igual |
| Encerrada impede subsequentes (§13.5) | estado `Finished` (helper já usado na US-04) → rejeitado |
| `Created` (§13.5) | ação rejeitada; turno permanece nulo |
| Persistência (§13.5) | `performTurnActionAndPersist` → load: mesmo ativo e índice; load não chama o comando de ação |

## 7. Estratégia TDD

```text
RED → GREEN → REFACTOR
```

Ordem orientada a testes:

1. **Ação válida no meio da rodada (§13.1)** — RED: A → B, preservação, input imutável → GREEN: comando stub.
2. **Fora do turno + duplo avanço (§13.2)** — RED: `NOT_CURRENT_PLAYER` → GREEN: comparação com `currentTurnPlayerId`.
3. **Created / Finished / fase que não admite (§13.5)** — RED: rejeições → GREEN: guards (Finished primeiro, como `startMatch`).
4. **Wrap de rodada (§13.3)** — RED: D → B e `playerRoundIndex` 1 → GREEN: spec §8 via `getRoundPlayerSequence`.
5. **N=2 (D14) e N=6 (§13.4)** — RED: turnos consecutivos de B; percurso completo da rodada 0 → GREEN.
6. **Skip / `advancePlayerRound` (§13.2, RN-07)** — RED: não há sucesso de avanço sem ação → GREEN: remover export de skip ou fazê-lo rejeitar; testes US-03 de incremento passam a usar o wrap do stub.
7. **Estado inválido (RN-14)** — origem que falha `validateMatchState` → ação rejeitada.
8. **`performTurnActionAndPersist` + load (§13.5)** — RED: persistido ativo B; load sem reexecutar → GREEN: orquestração só grava se o domínio ok.

Camada: unitário de domínio (principal) + unitário/aplicação com storage in-memory. Sem React.

## 8. Alterações Técnicas

### 8.1 Backend

Não aplicável.

### 8.2 Frontend

Não aplicável. Nenhuma alteração em `app/*`.

### 8.3 Banco de dados

Não aplicável. Persistência = `localStorage` já existente. Sem schema/migration. O JSON da partida já inclui `currentTurnPlayerId` e `playerRoundIndex`; após ação, o mesmo id é **sobrescrito** com o novo ativo/rodada. Load não interpreta “próximo turno”.

### 8.4 APIs

Sem HTTP. Contratos internos:

| API | Responsabilidade |
| --- | --- |
| `performTurnAction(state, actorPlayerId)` | Stub: autoriza ator e avança turno/rodada; senão `DomainResult` erro |
| Helpers internos de autorização / próximo turno | Reuso futuro (RNF-06); não são API de skip |
| `getRoundPlayerSequence` | Cálculo puro da sequência (já existe) |
| `performTurnActionAndPersist(...)` | `performTurnAction`; só então `saveMatch` + ativa |
| `loadMatch` / `getActiveMatch` | Restaura JSON; **não** executa ação |

`advancePlayerRound` deixa de fazer parte da API pública de produto. Testes que dependiam dele como skip devem migrar.

Não inventar fase nova nem campo extra de “turno concluído”.

### 8.5 Integrações

| Integração | Detalhe |
| --- | --- |
| US-01 | Mutação em `Finished` continua rejeitada; turno permanece campo do estado |
| US-03 | Sequência e wrap usam a mesma fórmula; ordem base intocável |
| US-04 | Primeiro ativo inalterado; esta US só avança **depois** do início |
| Web Storage | Fake in-memory + mock `Storage` já usados |

## 9. Ordem de Implementação

```text
1. RED + GREEN: performTurnAction no meio da rodada (A→B, preservação, imutabilidade)
2. Rejeições: fora do turno, Created, Finished, dupla ação, origem inválida
3. Wrap US-03: último da sequência incrementa rodada e define o primeiro da próxima
4. Bordas N=2 (turno consecutivo) e N=6
5. Encerrar skip público (advancePlayerRound) e ajustar regressão US-03
6. Refatorar helpers internos de autorização + próximo turno (RNF-06)
7. performTurnActionAndPersist: save só após sucesso; load sem reexecutar ação
8. npm test (suíte completa) + checklist da spec §12
```

## 10. Estratégia de Testes

| Tipo | Usar? | Escopo |
| --- | --- | --- |
| Unitário domínio | **Sim — principal** | `performTurnAction`, wrap, rejeições, N=2/N=6 |
| Unitário/app persistência | **Sim** | ação→save→load; load sem novo avanço |
| UI / E2E / HTTP | Não | Fora de escopo |

Casos críticos: autorização; wrap US-03 (D→B, não D→A); D14 (B→B); skip inexistente; `Finished`; persistência do ativo.

Comando: `npm test`.

## 11. Riscos e Mitigações

| Risco | Mitigação |
| --- | --- |
| Quebrar testes US-03 que chamam `advancePlayerRound` como skip | Migrar asserts de incremento para o wrap via `performTurnAction`; regressão de ordem base permanece |
| Implementar ciclo simples A→B→C→A e falhar a spec | Teste §13.3 obrigatório: após D na rodada 0 o ativo é **B** |
| Tratar turno consecutivo em N=2 como bug | Teste D14 explícito; não “corrigir” para A |
| Gravar avanço após rejeição de domínio | `performTurnActionAndPersist` só chama `saveMatch` se `ok` |
| Acoplar domínio a storage | I/O só em `application/` |
| Helper de próximo turno exportado como skip | Helpers internos; único comando público de mutação de turno nesta US é o stub |
| Escopo vazar para UI ou ações de mesa | Spec §4.2; plan §5.2 |

## 12. Dependências

| Dependência | Tipo |
| --- | --- |
| Spec US-05 | Funcional — fonte da verdade |
| US-01 estado / `Finished` / validate | Técnica |
| US-03 `getRoundPlayerSequence` / `playerRoundIndex` | Técnica — sequência |
| US-04 `startMatch` + primeiro turno + persistência iniciada | Técnica — precondição dos testes |
| Vitest | Já configurado |
| UI de turno / desconexão | Não bloqueiam (aberturas da spec) |

## 13. Critérios para Conclusão

- [ ] `performTurnAction` aceita só o jogador ativo em partida que admite ações; avança conforme spec §8.
- [ ] Fora do turno, `Created`, `Finished` e origem inválida são rejeitados; input intacto.
- [ ] Não há comando público de sucesso que só avance turno/rodada.
- [ ] Wrap da rodada 0 (A,B,C,D): após D → rodada 1 e ativo B.
- [ ] N=2: após B na rodada 0 → ativo B na rodada 1. N=6: percorre a sequência e wrap para B.
- [ ] Stub não altera fase, camelos, £, elenco nem ordem `players`.
- [ ] `performTurnActionAndPersist` grava só sucesso; load restaura ativo e rodada sem reexecutar a ação.
- [ ] `npm test` passa (match + match-config + persistência).
- [ ] Critérios de aceite da spec §12 satisfeitos.
- [ ] Nenhuma UI introduzida.

## 14. Próxima Etapa

Decompor este plano em tarefas operacionais (`tasks.md`) via skill `create-tasks`, usando:

```text
docs/plan/us-05-gerenciamento-de-turnos/plan.md
```

como input, com rastreabilidade para `docs/spec/us-05-gerenciamento-de-turnos/spec.md`.
