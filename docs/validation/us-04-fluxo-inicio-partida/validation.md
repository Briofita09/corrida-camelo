# Relatório de Validação — US-04 Fluxo de início da partida

## 1. Contexto

Validação da feature US-04 (iniciar partida `Created` → `RaceSetup` com primeiro turno, preservação do estado inicial, rejeições de origem/fase/estado parcial, persistência do iniciado sem re-iniciar), confrontando o código em `domain/match/`, `domain/match-config/` e `application/match-persistence/` e a reexecução de testes/lint/build com `spec.md`, `plan.md`, `tasks.md` e `implementation.md`.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-04-fluxo-inicio-partida/spec.md`
- `docs/plan/us-04-fluxo-inicio-partida/plan.md`
- `docs/tasks/us-04-fluxo-inicio-partida/tasks.md`
- `docs/implementation/us-04-fluxo-inicio-partida/implementation.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `domain/match/` (US-01, US-03)
- `domain/match-config/` (US-02)
- `application/match-persistence/` (US-03)

## 3. Veredito Final

**Status:** Aprovado com ressalvas

**Justificativa:** RF-01–RF-08, RN-01–RN-19 e o aceite da spec §12 estão atendidos no código, com suíte reexecutada **82/82** passando, lint e build OK. Não há UI, fase `in_progress` nem `startFromConfig`. A ressalva é **documental**: `AGENTS.md` ainda descreve `startMatch` só como `Created` → `RaceSetup` (sem primeiro turno) e não lista `startAndPersistMatch` — atualizar via skill de arquitetura, sem bloqueio funcional. TDD das fatias principais teve RED evidenciado (turno nulo, `Created` inválida, D14, módulo ausente); fatias 6 e 16 passaram de imediato porque o comportamento já existia.

## 4. Matriz de Rastreabilidade

| Critério / Cenário (spec) | Estratégia (plan) | Tarefas | Evidência | Status |
| --- | --- | --- | --- | --- |
| Início válido §7 / §13.1 (RF-01, RF-03, RF-04) | Estender `startMatch` | 3–5 | `startMatch.test.ts` — `RaceSetup`, turno `A`, preservação, input intacto | Atendido |
| Determinismo §13.5 (D13, RN-17) | Cópias independentes | 3–5 | `startMatch.test.ts` — duas cópias equivalentes | Atendido |
| Config inválida / sem `Created` §13.2 (RF-02, RN-03) | Sem `startFromConfig`; US-02 + `getActiveMatch` | 16–18 | `matchConfig.test.ts`; `startAndPersistMatch.test.ts` (`NO_ACTIVE_MATCH`) | Atendido |
| Segundo início / andamento / `Finished` §13.3 (RF-05) | Guards de fase | 6–8 | `startMatch.test.ts` — turno estável, `LegInProgress`, `Finished` | Atendido |
| `Created` inválida §13.4 (RN-02, RN-13, RF-06) | `validateMatchState` antes de transitar | 9–11 | `startMatch.test.ts` — camelos incompletos rejeitados | Atendido |
| Estado parcial D14 / §13.4 (RN-14) | Validate Created vs RaceSetup | 12–14 | `validateMatchState.test.ts`; `serialize.test.ts` | Atendido |
| Config congelada §13.5 (RF-08, RN-15) | Sem API de elenco; isolamento de objetos | 16–17 | `matchConfig.test.ts` — `updateParticipant` no rascunho não muda a partida | Atendido |
| Persistência §13.5 (RF-07, RN-16) | `startAndPersistMatch` após domínio | 18–21 | `startAndPersistMatch.test.ts` — save/load `RaceSetup`+turno | Atendido |
| Duas tentativas RN-18 | Segunda sobre `RaceSetup` rejeitada | 6, 18–20 | domínio + persistência; storage não corrompido | Atendido |
| Sem UI / sem `in_progress` | Plan §5.2 | 24 | `app/` sem `startMatch`; grep sem `startFromConfig` / `in_progress` | Atendido |
| Aceite §12 | Plan §13 | 22–24 | checklist + reexecução | Atendido |

## 5. Evidências de Teste

### 5.1 Execução da suíte de testes

- **Comando executado (reexecução nesta validação):** `npm test`
- **Resultado:** Passou
- **Quantidade:** 14 arquivos, **82 testes**, 0 falhas
- **Distribuição aproximada:** `domain/match` (início, validate, serialize, regressão US-01/US-03), `domain/match-config` (US-02 + fluxo US-04), `application/match-persistence` (US-03 + `startAndPersistMatch`)
- **Observação:** Aviso CJS do Vite (informativo)
- **Alinhamento com implementation.md:** Reportou 82; reexecução confirmou **82 passed**

### 5.2 Lint / Format

- **Comando executado:** `npm run lint`
- **Resultado:** Passou (exit 0)

### 5.3 Build

- **Comando executado:** `npm run build`
- **Resultado:** Passou (exit 0)
- **Observação:** Warning Next sobre lockfile/root fora do repo (ambiente); fora do escopo da US-04

### 5.4 Cobertura de testes

- **Resultado:** Não aplicável — projeto sem meta/ferramenta de cobertura definida

### 5.5 Divergências em relação ao implementation.md

- Nenhuma divergência funcional ou de contagem de testes.
- Lint/build alinhados ao relatório.

## 6. Conformidade Funcional

| ID | Avaliação | Evidência |
| --- | --- | --- |
| RF-01 | Atendido | `startMatch` em `Created` válida → `RaceSetup` + turno |
| RF-02 | Atendido | Config inválida não gera/`start`; sem ativa → `NO_ACTIVE_MATCH` |
| RF-03 | Atendido | `currentTurnPlayerId = players[0].id` |
| RF-04 | Atendido | Elenco, ordem, camelos no espaço 0, £3, `playerRoundIndex` 0 |
| RF-05 | Atendido | Segundo início, `LegInProgress`, `Finished` rejeitados; input intacto |
| RF-06 | Atendido | `Created` inválida rejeitada; sem `RaceSetup` |
| RF-07 | Atendido | `startAndPersistMatch` + `getActiveMatch` / `loadMatch` via deserialize |
| RF-08 | Atendido | Sem API de editar elenco; rascunho de config isolado |
| RN-01–RN-09 | Atendido | Fase só `Created`; validate; preservação; turno; sem reordenar |
| RN-10–RN-14 | Atendido | Rejeições de fase/Finished/parcial; D14 |
| RN-15–RN-19 | Atendido | Config imutável na partida; persistência; determinismo; um início; domínio sem I/O |
| D2 | Atendido | `in_progress` mapeado a `RaceSetup`; sem fase nova |
| D1 | Atendido | `createMatchFromConfig` continua só `Created`; início separado |
| Spec §12 | Atendido | Critérios cobertos pelos testes reexecutados |

**Nota de desenho (conforme plan):** “iniciar a partir de config inválida” é `createMatchFromConfig` rejeitado, não um comando `startFromConfig`. RF-08 é ausência de mutação da partida + isolamento do rascunho, não um comando de edição que falha.

## 7. Conformidade Técnica

| Aspecto | Avaliação |
| --- | --- |
| Extensão `startMatch` + `validateMatchState` | Conforme plan §5.1 (turno no comando; D14 na validação) |
| `startAndPersistMatch` | Conforme plan: domínio primeiro, `persistCreatedMatch` só se `ok` |
| Load sem re-início | `matchPersistence.ts` desserializa; não importa `createMatch` |
| Camadas | Domínio sem React/Next/`localStorage`; I/O em `application/` |
| Tasks 1–24 | Reportadas concluídas; comportamento revalidado |
| TDD | RED evidenciado nas fatias 3, 9, 12, 18; fatias 6 e 16 verdes de imediato (pré-existente) |
| Sem UI / sem `startFromConfig` | Conforme escopo |

## 8. Riscos e Mitigações — Situação Atual

| Risco (plan §11) | Situação |
| --- | --- |
| Testes com `RaceSetup` e turno nulo | Mitigado — `startMatch` preenche turno; validate rejeita legado sem turno |
| Validar turno sempre = `players[0]` em `RaceSetup` | Mitigado — validate só exige jogador existente; `players[0]` é regra do comando |
| Duplo início em cópias `Created` | Mitigado — documentado: determinismo ≠ duas transições; persistência rejeita o segundo no agregado |
| Gravar iniciado após falha de domínio | Mitigado — `startAndPersistMatch` só persiste se `startMatch.ok` |
| Domínio acoplado a storage | Mitigado — I/O só em `application/` |
| Escopo vazar para UI / `startFromConfig` | Mitigado — não há no código |

## 9. Não Conformidades e Pendências

| Item | Origem | Severidade | Recomendação |
| --- | --- | --- | --- |
| `AGENTS.md` não lista `startAndPersistMatch` nem turno no `startMatch` | Plan / contexto estável do repo | Não bloqueante | Atualizar via skill de arquitetura |
| RED das tarefas 6 e 16 não falhou (comportamento já existia) | tasks.md / implementation §5 | Não bloqueante | Aceitável; fatias novas tiveram RED real |

Nenhuma não conformidade funcional bloqueante.

## 10. Dúvidas Levantadas Durante a Validação

Nenhuma dúvida bloqueante para o veredito.

## 11. Conclusão

US-04 **aprovada com ressalvas** (atualizar `AGENTS.md`). Critérios de aceite e cenários BDD relevantes estão cobertos por testes reexecutados com sucesso (82/82), lint e build OK.

**Próximos passos sugeridos:** merge/PR da branch `feature/us-04-fluxo-inicio-partida`; atualizar `AGENTS.md` para refletir o primeiro turno em `startMatch` e `startAndPersistMatch`.
