# Relatório de Validação — US-03 Ordem inicial dos jogadores

## 1. Contexto

Validação da feature US-03 (sorteio da ordem dos jogadores na criação da partida, `playerRoundIndex`, sequência por rodada, persistência/`localStorage` sem resortear), confrontando o código em `domain/match/`, `domain/match-config/` e `application/match-persistence/` e a reexecução de testes/lint/build com `spec.md`, `plan.md`, `tasks.md` e `implementation.md`.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md`
- `docs/plan/us-03-ordem-inicial-jogadores/plan.md`
- `docs/tasks/us-03-ordem-inicial-jogadores/tasks.md`
- `docs/implementation/us-03-ordem-inicial-jogadores/implementation.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `domain/match/` (US-01)
- `domain/match-config/` (US-02)

## 3. Veredito Final

**Status:** Aprovado com ressalvas

**Justificativa:** RF-01–RF-07, RN-01–RN-10, RR-01–RR-03 e o aceite da spec §11 estão atendidos no código, com suíte reexecutada **69/69** passando, lint e build OK. A ressalva é **processual (TDD)**: o `implementation.md` registra ciclo RED comprimido na mesma sessão (testes escritos junto do GREEN), sem evidência isolada de falha RED por fatia — sem impacto no comportamento entregue. Pendência documental menor: `AGENTS.md` ainda descreve “sem persistência de partida” no estado do repositório (pré-US-03); a spec/plan desta US autorizam `localStorage` — atualizar `AGENTS.md` fica para a skill de arquitetura, não bloqueia o aceite funcional.

## 4. Matriz de Rastreabilidade

| Critério / Cenário (spec) | Estratégia (plan) | Tarefas | Evidência | Status |
| --- | --- | --- | --- | --- |
| Sorteio aleatório na criação (RF-01, §12.1) | Estratégia em `createMatch` | 9–10 | `playerOrdering.test.ts`; default `createRandomOrdering` | Atendido |
| Sem duplicata / todos participam (RN-02/03, §12.1) | Permutação N=2..6 | 9–10, 15 | `playerOrdering.test.ts`; `matchConfig.test.ts` permutação | Atendido |
| Ordem = array `players` (D2, RF-02) | Ordem canônica no estado | 7, 10 | `MatchState.players` pós-create | Atendido |
| Persistência `localStorage` (RF-04, D5) | `application/match-persistence` | 18–23 | adaptador + testes com mock Storage | Atendido |
| Reload / reentrar sem resortear (§12.2, RF-05/06) | save/load/ativa + deserialize | 18–23 | `matchPersistence.test.ts`; `persistCreatedMatch` | Atendido |
| Rodadas A→B→C→D / B→C→D→A… (§7, §12.3) | `getRoundPlayerSequence` | 3–5 | `getRoundPlayerSequence.test.ts` | Atendido |
| `playerRoundIndex` serializável (RR-03) | campo + validate/serialize | 6–8 | `playerRoundIndex.test.ts` | Atendido |
| `startMatch` não reordena (§12.3) | preservar `players` | 11–12 | `advancePlayerRound.test.ts` | Atendido |
| Estratégia isolada (§12.4, RF-07) | `PlayerOrderingStrategy` | 9–10, 13 | `playerOrdering.ts` + testes identidade/aleatória | Atendido |
| Domínio sem React/`localStorage` (RN-10) | I/O só em `application/` | 13, 24 | `independence.test.ts` (match + persistence) | Atendido |
| US-02 generate sem duplo sorteio | options opcional | 15–16 | `createMatchFromConfig` repassa options | Atendido |
| Aceite §11 | Plan §13 | 25–27 | checklist implementation + reexecução | Atendido |

## 5. Evidências de Teste

### 5.1 Execução da suíte de testes

- **Comando executado (reexecução nesta validação):** `npm test`
- **Resultado:** Passou
- **Quantidade:** 13 arquivos, **69 testes**, 0 falhas
- **Distribuição aproximada:** domínio match (ordem/rodada + US-01), match-config (US-02 + regressão), `application/match-persistence`
- **Observação:** Aviso CJS do Vite (informativo)

### 5.2 Lint / Format

- **Comando executado:** `npm run lint`
- **Resultado:** Passou (exit 0)

### 5.3 Build

- **Comando executado:** `npm run build`
- **Resultado:** Passou (exit 0)
- **Observação:** Warning Next sobre lockfile/root fora do repo (ambiente); fora do escopo da US-03

### 5.4 Cobertura de testes

- **Resultado:** Não aplicável — projeto sem meta/ferramenta de cobertura definida

### 5.5 Divergências em relação ao implementation.md

- Nenhuma divergência funcional: implementation reportou 69 testes; reexecução confirmou **69 passed**.
- Lint/build alinhados ao relatório.

## 6. Conformidade Funcional

| ID | Avaliação | Evidência |
| --- | --- | --- |
| RF-01 | Atendido | `createMatch` + `createRandomOrdering` / RNG injetável |
| RF-02 | Atendido | ordem base = `players` |
| RF-03 | Atendido | `getRoundPlayerSequence` |
| RF-04 | Atendido | `createLocalStorageAdapter` + `saveMatch` |
| RF-05 | Atendido | `loadMatch` / `getActiveMatch` via deserialize |
| RF-06 | Atendido | load não chama `createMatch` (imports + testes) |
| RF-07 | Atendido | `PlayerOrderingStrategy` pluggable |
| RN-01–RN-04 | Atendido | sorteio na create; unicidade; justiça via Fisher–Yates + RNG |
| RN-05–RN-06 | Atendido | ordem no estado; `startMatch` / advance não reordenam base |
| RN-07–RN-08 | Atendido | persistência + restore sem sorteio |
| RN-09 | Atendido | sequência §7 |
| RN-10 | Atendido | domínio puro; I/O em application |
| RR-01–RR-03 | Atendido | rotação; função pura; `playerRoundIndex` |
| RNF-01–03 | Atendido | RNG injetável; testes node; US-01/US-02 compatíveis |
| Spec §11 | Atendido | checklist verificável coberto por testes |

**Nota de desenho (conforme plan):** o cenário Gherkin que une “create a partir da config **e** persiste no localStorage” é coberto por **dois** passos (`createMatchFromConfig` + `persistCreatedMatch`), não por auto-persistência dentro do domínio — alinhado a RN-10 / plan §5.1.

## 7. Conformidade Técnica

| Aspecto | Avaliação |
| --- | --- |
| Extensão `domain/match/` | Conforme plan §4–§5 (estratégia, rodada, campo, advance) |
| `application/match-persistence/` | Conforme plan (porta, fake, localStorage, orquestração) |
| Wiring US-02 | `CreateMatchOptions` opcional; um único sorteio |
| Camadas | Domínio sem browser; application depende de serialize/deserialize |
| Tasks 1–27 | Reportadas concluídas no implementation; comportamento revalidado |
| TDD RED isolado | **Ressalva:** RED comprimido (mesmo padrão US-01/US-02) |
| Sem UI | Conforme escopo |

## 8. Riscos e Mitigações — Situação Atual

| Risco (plan §11) | Situação |
| --- | --- |
| Testes US-02 quebram por ordem | Mitigado — asserts por nome/conjunto + options |
| Flakiness RNG | Mitigado — RNG/estratégia injetáveis |
| Confundir `currentLeg` com rodada | Mitigado — campo `playerRoundIndex` |
| Domínio acoplado a browser | Mitigado — I/O só em `application/` |
| AGENTS sem persistência | Parcial — feature ok; doc raiz ainda desatualizada |
| Duplo sorteio | Mitigado — sorteio só em `createMatch` |

## 9. Não Conformidades e Pendências

| Item | Origem | Severidade | Recomendação |
| --- | --- | --- | --- |
| Ciclo TDD RED não evidenciado por fatia isolada | implementation §5 (tarefas RED “comprimido”) | Não bloqueante | Aceitar como ressalva processual (histórico do projeto) ou reforçar RED em USs futuras |
| `AGENTS.md` ainda lista ausência de persistência de partida | Plan §11 / AGENTS “não-objetivos” | Não bloqueante | Atualizar via skill de arquitetura pós-merge |

Nenhuma não conformidade funcional bloqueante.

## 10. Dúvidas Levantadas Durante a Validação

Nenhuma dúvida bloqueante para o veredito.

## 11. Conclusão

US-03 **aprovada com ressalvas** (TDD comprimido + atualização pendente do `AGENTS.md`). Critérios de aceite e cenários BDD relevantes estão cobertos por testes reexecutados com sucesso (69/69), lint e build OK.

**Próximos passos sugeridos:** merge/PR da branch `feature/us-03-ordem-inicial-jogadores`; atualizar `AGENTS.md` para refletir `application/match-persistence` e a ordem de jogadores.
