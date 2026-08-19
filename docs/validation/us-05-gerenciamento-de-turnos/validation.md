# Relatório de Validação — US-05 Gerenciamento de turnos

## 1. Contexto

Validação da feature US-05 (jogador ativo no estado, ação stub só do ativo, avanço de turno/rodada pela sequência US-03, rejeição de skip/`Created`/`Finished`/fora do turno, persistência sem reexecutar a ação), confrontando o código em `domain/match/` e `application/match-persistence/` e a reexecução de testes/lint/build com `spec.md`, `plan.md`, `tasks.md` e `implementation.md`.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-05-gerenciamento-de-turnos/spec.md`
- `docs/plan/us-05-gerenciamento-de-turnos/plan.md`
- `docs/tasks/us-05-gerenciamento-de-turnos/tasks.md`
- `docs/implementation/us-05-gerenciamento-de-turnos/implementation.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `domain/match/` (US-01, US-03, US-04)
- `application/match-persistence/` (US-03, US-04)

## 3. Veredito Final

**Status:** Aprovado com ressalvas

**Justificativa:** RF-01–RF-10, RN-01–RN-18 e o aceite da spec §12 estão atendidos no código, com suíte reexecutada **96/96** passando, lint e build OK. Não há UI, skip público nem alteração de `startMatch`. A ressalva é **documental**: `AGENTS.md` ainda lista `advancePlayerRound` na API pública e como incremento de rodada — o código removeu esse comando; atualizar via skill de arquitetura, sem bloqueio funcional. TDD das fatias principais teve RED evidenciado; as tarefas 16 e 25 foram no-op (wrap já genérico; persistência já reutilizava `persistCreatedMatch`).

## 4. Matriz de Rastreabilidade

| Critério / Cenário (spec) | Estratégia (plan) | Tarefas | Evidência | Status |
| --- | --- | --- | --- | --- |
| Jogador ativo no estado §13.1 (RF-01) | Consumir `currentTurnPlayerId` pós US-04 | 3–5 | `performTurnAction.test.ts` — iniciado A, rodada 0 | Atendido |
| Ação válida avança turno §13.1 (RF-02, RF-03, RF-08) | `performTurnAction` + `getRoundPlayerSequence` | 3–5 | A→B; fase/£/camelos/`players` iguais; input intacto | Atendido |
| Fora do turno §13.2 (RF-04) | `NOT_CURRENT_PLAYER` | 6–8 | ator B rejeitado; estado intacto | Atendido |
| Dupla conclusão §13.2 (RF-06, D6) | Segunda ação do ex-ativo | 6–8 | A sucesso → A de novo rejeitado; ativo B | Atendido |
| Sem skip §13.2 (RF-05, RN-07) | Remover `advancePlayerRound` público | 18–20 | barrel sem `advancePlayerRound`; módulo removido | Atendido |
| Wrap US-03 §13.3 (D3) | Último da `S` incrementa rodada | 12–14 | D→B, `playerRoundIndex` 1, ordem A,B,C,D | Atendido |
| N=2 D14 / N=6 §13.4 (RF-10) | Mesma fórmula §8 | 15–17 | B consecutivo; A…F wrap para B | Atendido |
| `Finished` / `Created` §13.5 (RF-07) | Guards Finished primeiro; fase admite | 9–11 | `MATCH_FINISHED`; `INVALID_PHASE` em Created e LegSetup | Atendido |
| Origem inválida RN-14 | `validateMatchState` | 9–11 | camelos incompletos rejeitados | Atendido |
| Persistência §13.5 (RF-09, RN-15) | `performTurnActionAndPersist` após domínio | 22–24 | save/load ativo B; rejeição não grava | Atendido |
| Independência de UI (RNF-01) | Sem `app/*` | 28 | `app/` sem wiring de turno | Atendido |
| Aceite §12 | Plan §13 | 26–28 | checklist + reexecução | Atendido |

## 5. Evidências de Teste

### 5.1 Execução da suíte de testes

- **Comando executado (reexecução nesta validação):** `npm test`
- **Resultado:** Passou
- **Quantidade:** 16 arquivos, **96 testes**, 0 falhas
- **Distribuição:** `performTurnAction.test.ts` (13), `performTurnActionAndPersist.test.ts` (3), regressão US-01–US-04 (`startMatch`, serialize, match-config, persistência existente)
- **Observação:** Aviso CJS do Vite (informativo)
- **Alinhamento com implementation.md:** Reportou 96; reexecução confirmou **96 passed**

### 5.2 Lint / Format

- **Comando executado:** `npm run lint`
- **Resultado:** Passou (exit 0)

### 5.3 Build

- **Comando executado:** `npm run build`
- **Resultado:** Passou (exit 0)
- **Observação:** Warning Next sobre lockfile/root fora do repo (ambiente); fora do escopo da US-05

### 5.4 Cobertura de testes

- **Resultado:** Não aplicável — projeto sem meta/ferramenta de cobertura definida

### 5.5 Divergências em relação ao implementation.md

- Nenhuma divergência funcional ou de contagem de testes.
- Lint/build alinhados ao relatório.

## 6. Conformidade Funcional

| ID | Avaliação | Evidência |
| --- | --- | --- |
| RF-01 | Atendido | Partida iniciada tem `currentTurnPlayerId` = A |
| RF-02 | Atendido | Stub aceito quando ator = ativo em `RaceSetup` |
| RF-03 | Atendido | Avanço A→B no meio da rodada; wrap D→B |
| RF-04 | Atendido | `NOT_CURRENT_PLAYER`; estado inalterado |
| RF-05 | Atendido | Sem skip público; fora do turno não avança |
| RF-06 | Atendido | Segunda `performTurnAction` de A rejeitada |
| RF-07 | Atendido | `Finished` → `MATCH_FINISHED`; `Created` → `INVALID_PHASE` |
| RF-08 | Atendido | Stub preserva fase, camelos, £, elenco, `players` |
| RF-09 | Atendido | `performTurnActionAndPersist` + `getActiveMatch` via deserialize |
| RF-10 | Atendido | N=2 (B→B) e N=6 (F→B) |
| RN-01–RN-06 | Atendido | Um ativo; só o ativo age; avanço §8 |
| RN-07–RN-10 | Atendido | Sem skip; ordem base intacta; stub sem mesa |
| RN-11–RN-14 | Atendido | Finished/Created/inválido rejeitados |
| RN-15–RN-18 | Atendido | Persistência; determinismo do avanço; ator explícito; domínio sem I/O |
| D5 / D14 | Atendido | Sem skip; turno consecutivo em N=2 é esperado |
| Spec §12 | Atendido | Critérios cobertos pelos testes reexecutados |

**Nota:** `LegInProgress` entra no conjunto de fases que admitem ação (`assertPlayerMayPerformTurnAction`), alinhado à spec §7 / plan §5.1 item 8. Não há teste dedicado de sucesso nessa fase (o caminho coberto é `RaceSetup`, fase real pós US-04). Abertura da spec para `LegSetup`/`LegPayout`/`FinalPayout` está coberta pela rejeição de `LegSetup`.

**Nota de desenho (conforme plan):** load não chama `performTurnAction` — `matchPersistence.ts` só desserializa.

## 7. Conformidade Técnica

| Aspecto | Avaliação |
| --- | --- |
| `performTurnAction(state, actorPlayerId)` | Conforme plan §5.1 |
| Helpers internos não públicos | `assertPlayerMayPerformTurnAction` e `applyNextTurn` existem; **não** estão no barrel `domain/match/index.ts` |
| Fim do skip | `advancePlayerRound.ts` removido; export público ausente |
| `performTurnActionAndPersist` | Domínio primeiro; `persistCreatedMatch` só se `ok` |
| Load sem reexecutar ação | `getActiveMatch` restaura JSON; teste de igualdade com o estado persistido |
| Camadas | Domínio sem React/Next/`localStorage`; I/O em `application/` |
| Tasks 1–28 | Reportadas concluídas; 16 e 25 no-op documentados |
| TDD | RED evidenciado nas fatias 3, 6, 9, 12, 18; 15 já verde (wrap genérico) |
| Sem UI / sem alterar `startMatch` | Conforme escopo |

## 8. Riscos e Mitigações — Situação Atual

| Risco (plan §11) | Situação |
| --- | --- |
| Testes US-03 de `advancePlayerRound` como skip | Mitigado — skip removido; wrap coberto por `performTurnAction`; arquivo `advancePlayerRound.test.ts` restou só com regressão de `startMatch` |
| Ciclo simples D→A | Mitigado — teste D→B obrigatório e verde |
| Tratar N=2 consecutivo como bug | Mitigado — teste D14 explícito |
| Gravar avanço após rejeição | Mitigado — orquestração só persiste se `ok` |
| Domínio acoplado a storage | Mitigado — I/O só em `application/` |
| Helper de próximo turno como skip público | Mitigado — não exportado no barrel |
| Escopo vazar para UI / mesa | Mitigado — sem wiring em `app/`; stub sem regras de mesa |

## 9. Não Conformidades e Pendências

| Item | Origem | Severidade | Recomendação |
| --- | --- | --- | --- |
| `AGENTS.md` ainda lista `advancePlayerRound` e não documenta `performTurnAction` / `performTurnActionAndPersist` | Plan / contexto estável do repo | Não bloqueante | Atualizar via skill de arquitetura |
| Sem teste dedicado de sucesso em `LegInProgress` | Spec §7 (fase também admite) | Não bloqueante | Código admite a fase; caminho de produto desta US é `RaceSetup` |
| Arquivo `advancePlayerRound.test.ts` mantém nome legado | Tasks 18–20 | Não bloqueante | Só testa estabilidade de `startMatch`; rename opcional |

Nenhuma não conformidade funcional bloqueante.

## 10. Dúvidas Levantadas Durante a Validação

Nenhuma dúvida bloqueante para o veredito.

## 11. Conclusão

US-05 **aprovada com ressalvas** (atualizar `AGENTS.md`). Critérios de aceite e cenários BDD relevantes estão cobertos por testes reexecutados com sucesso (96/96), lint e build OK.

**Próximos passos sugeridos:** merge/PR da branch `feature/us-05-gerenciamento-de-turnos`; atualizar `AGENTS.md` para refletir `performTurnAction`, `performTurnActionAndPersist` e a remoção de `advancePlayerRound`.
