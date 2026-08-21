# Relatório de Validação — US-07 Inicializar camelo doido

## 1. Contexto

Validação da feature US-07 (posicionar o camelo doido no início da partida: após as 5 cartas da US-06, `Crazy` sozinho no espaço **7**, sentido `TowardStart` intacto, sem dono, desclassificado por identidade, persistido sem recolocar no load; sem UI e sem movimento oficial do doido), confrontando o código em `domain/match/` e `application/match-persistence/` e a reexecução de testes/lint/build com `spec.md`, `plan.md`, `tasks.md` e `implementation.md`.

Branch verificada: `feature/us-07-inicializar-camelo-doido`. Sem UI nesta fatia.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-07-inicializar-camelo-doido/spec.md`
- `docs/plan/us-07-inicializar-camelo-doido/plan.md`
- `docs/tasks/us-07-inicializar-camelo-doido/tasks.md`
- `docs/implementation/us-07-inicializar-camelo-doido/implementation.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Veredito Final

**Status:** Aprovado

**Justificativa:** RF-01–RF-09, RN-01–RN-19 e o aceite da spec §16 estão atendidos no código. O procedimento vive em `startMatch` **depois** de `determineInitialCamelPositions`; `placeCrazyCamel` e o movimento de preparação não entram no barrel; `CRAZY_INITIAL_SPACE` é pública; load só desserializa; validação permanente **não** fixa o espaço 7 em `RaceSetup`; `AGENTS.md` já reflete a US-07. Suíte reexecutada nesta validação: **130/130** passando, lint e build OK. Sem pendências no `implementation.md`. Sem não conformidades bloqueantes.

## 4. Matriz de Rastreabilidade

| Critério de aceitação / Cenário (spec.md) | Estratégia (plan.md) | Tarefa (tasks.md) | Evidência (implementation.md / execução) | Status |
| --- | --- | --- | --- | --- |
| Aceite §16 / §17.1 / RF-01 / RN-03–RN-04: após início, Crazy no espaço 7 | Helper interno após US-06 em `startMatch` | 3–9 | `startMatch.ts` chama `placeCrazyCamel` após `determineInitialCamelPositions`; `startMatch.test.ts` — `Crazy.space === CRAZY_INITIAL_SPACE` (7), não no 0 | Atendido |
| Aceite §16 / §17.4 / RF-06 / RN-11 / D14: sozinho no 7; nenhum de corrida no 7 | Destino vazio; sem erro “casa ocupada” | 3–9 | `startMatch.test.ts` — um camelo no 7; cada `RACING_CAMEL_IDS` fora do 7; `placeCrazyCamel.test.ts` | Atendido |
| Aceite §16 / §17.2 / RN-01–RN-02 / D2: Created no 0, Crazy `TowardStart` | Não posicionar em `createMatch` | 10–12 | `createMatch.test.ts` — Crazy existe, espaço 0, `TowardStart`; Created todos no 0 | Atendido |
| Aceite §16 / §17.3 / RF-02 / RN-05–RN-06 / D6: sentidos permanentes | Crazy `TowardStart`; corrida `TowardFinish` | 10–12 | `startMatch.test.ts` Created e iniciada; `validateMatchState` rejeita Crazy `TowardFinish` e corrida `TowardStart` | Atendido |
| Aceite §16 / §17.3 / RF-03 / RN-07 / D8: Crazy não é camelo de corrida | `RACING_CAMEL_IDS` / `RacingCamelId` | 10–12 | `startMatch.test.ts` — exatamente um Crazy; `"Crazy"` ∉ `RACING_CAMEL_IDS` | Atendido |
| Aceite §16 / §17.3 / RF-04 / RN-08 / D9: nenhum camelo tem dono | `CamelState` sem `owner` / `playerId` | 10–12 | `types.ts` — `{ id, space, stackOrder, direction }`; teste de ausência de campos | Atendido |
| Aceite §16 / §17.3 / RF-05 / RN-09–RN-10 / D10–D11: desclassificado / não vence | Identidade `Crazy`; sem motor de ranking (plan §10) | 10–12, 28 | Sem campo `disqualified`; `AGENTS.md` registra que ranking futuro ignora Crazy | Atendido |
| Aceite §16 / §17.5 / RF-08 / RN-14–RN-15 / D19–D20: segundo início e atomicidade | Guards US-04; imutabilidade | 13–15 | `startMatch.test.ts` — `INVALID_PHASE`, Crazy permanece no 7; sequência inválida, Crazy no 0, Created intacta | Atendido |
| Aceite §16 / §17.5 / RF-07 / RN-16 / D18: reload não recoloca nem inverte | Load só `deserialize`; sem `startMatch` | 25–27 | `startAndPersistMatch.test.ts` — `getActiveMatch` / `loadMatch` iguais ao persistido; Crazy 7 + `TowardStart`; falha deixa Crazy no 0 | Atendido |
| Aceite §16 / §17.6 / RF-09 / RN-19 / D15: pilha cima/meio/baixo | Caracterização em `applyRacingCardMove`; sem cartas pretas | 16–18, 28 | `applyRacingCardMove.test.ts` — Crazy por baixo, por cima e no meio; `AGENTS.md` contrato de pilha | Atendido |
| D17 / RN-17: espaço 7 não é invariante permanente de `RaceSetup` | `validateMatchState` não exige 7 | 19–21 | `validateMatchState.test.ts` — RaceSetup válido com Crazy no 0 (legado), no 5 e no 7 | Atendido |
| D21 / RN-13: stub US-05 preserva Crazy no 7 | Cópia de `camels` em `applyNextTurn` | 22–24 | `performTurnAction.test.ts` — após ação, camelos iguais; Crazy no 7 e `TowardStart` | Atendido |
| RNF-01 / RN-18: domínio sem React/Next/`localStorage` | Independência de camadas | 28 | `independence.test.ts` (match); `app/` sem `startMatch`/`Crazy`; persistência só em `application/` | Atendido |
| RNF-02: determinismo | Mesma sequência US-06 → mesmo Crazy no 7 | 7–9 | `startMatch.test.ts` — início determinístico com a mesma sequência | Atendido |
| RNF-04: serialização espaço + sentido | Round-trip JSON | 19–21 | `serialize.test.ts` — após `startMatch`, Crazy espaço 7 e `TowardStart` | Atendido |
| RNF-05: compatibilidade US-01/US-04/US-06 | Refino D12 (Crazy deixa o 0) | 7–12, 28 | Posições das 5 cartas, pool 25, fase/turno/£3; Created no 0; `AGENTS.md` atualizado | Atendido |
| Plan §13 / tasks 29–31 | Suíte + lint + build + checklist | 29–31 | Reexecução nesta validação: 130 testes, lint OK, build OK | Atendido |

## 5. Evidências de Teste

### 5.1 Execução da suíte de testes

- **Comando executado (reexecução nesta validação):** `npm test` (`vitest run`)
- **Resultado:** Passou
- **Quantidade:** 19 arquivos, **130 testes**, 0 falhas
- **Duração:** ~6,36 s (Vitest 3.2.4)
- **Distribuição relevante à US-07:**
  - `placeCrazyCamel.test.ts` (1)
  - `startMatch.test.ts` (13)
  - `applyRacingCardMove.test.ts` (10)
  - `createMatch.test.ts` (8)
  - `validateMatchState.test.ts` (18)
  - `serialize.test.ts` (6)
  - `performTurnAction.test.ts` (14)
  - `startAndPersistMatch.test.ts` (7)
  - regressão US-01–US-06 e `match-config`
- **Observação:** Aviso CJS do Vite (informativo), igual ao restante do projeto
- **Alinhamento com implementation.md:** Reportou 130 / 19 arquivos; reexecução confirmou **130 passed (19 files)**

### 5.2 Lint / Format

- **Comando executado:** `npm run lint`
- **Resultado:** Passou (exit 0)

### 5.3 Build

- **Comando executado:** `npm run build`
- **Resultado:** Passou (exit 0). Next.js 16.3.1, TypeScript OK, rotas `/` e `/_not-found` estáticas.

### 5.4 Cobertura de testes

- **Resultado:** O projeto **não** define métrica mínima de cobertura no `AGENTS.md` nem no `plan.md`. Não foi exigida percentual. A cobertura de comportamento da spec §16–§17 está na matriz da seção 4.

### 5.5 Divergências em relação ao implementation.md

Nenhuma. Contagem de testes (130), lint e build coincidem com o relatório de implementação. Tarefas 14, 17, 20, 23 e 26 continuam coerentes como GREEN no-op (código inspecionado: guards/cópia/orquestração já bastavam).

## 6. Conformidade Funcional

| Item | Avaliação | Evidência |
| --- | --- | --- |
| RF-01 | Atendido | `startMatch` posiciona Crazy no 7 após as 5 cartas |
| RF-02 | Atendido | `direction` de Crazy copiada (`TowardStart`); não invertida no helper |
| RF-03 | Atendido | Elenco de 6; `Crazy` fora de `RACING_CAMEL_IDS` |
| RF-04 | Atendido | Sem `owner` / `playerId` em `CamelState` |
| RF-05 | Atendido | Contrato por identidade (plan §10: sem algoritmo de vencedor nesta fatia) + `AGENTS.md` |
| RF-06 | Atendido | Um camelo no espaço 7 após sucesso |
| RF-07 | Atendido | Persistência grava estado iniciado; load = JSON |
| RF-08 | Atendido | Segundo `startMatch` rejeitado; snapshot com Crazy no 7 |
| RF-09 | Atendido | Caracterização de pilha + documentação; sem movimento de cartas pretas |
| RN-01–RN-19 | Atendido | Ver matriz (seção 4) |
| D1 / procedimento §8 | Atendido | Ordem: US-06 → `placeCrazyCamel` → `RaceSetup` |
| D17 | Atendido | `validateMatchState` aceita Crazy fora do 7 em `RaceSetup` |
| Spec §16 | Atendido | Checklist coberto pelos testes reexecutados (os checkboxes no `spec.md` permanecem como critérios, não foram alterados nesta etapa) |

**Notas de desenho (conforme spec/plan):**

- Desclassificação e “não pode vencer” **não** têm motor de ranking nesta US. O aceite é identidade `Crazy` + ausência de campo extra + registro em `AGENTS.md` para histórias futuras (plan §10).
- `determineInitialCamelPositions` **não** mistura o passo do doido; Crazy permanece no 0 **durante** as 5 cartas.
- `MIN_MONEY` permanece `1`.
- JSON legado de `RaceSetup` com Crazy ainda no 0 é válido na validação permanente (D17).

## 7. Conformidade Técnica

| Aspecto | Avaliação |
| --- | --- |
| `startMatch(state, options?)` | Conforme plan §5.1: passo US-07 **depois** da US-06 |
| `CRAZY_INITIAL_SPACE = 7` | Em `constants.ts`; exportada no barrel; **não** há comando público `placeCrazyCamel` |
| Helper interno | `placeCrazyCamel.ts` — cópia imutável, sentido copiado, `stackOrder` 0 em casa vazia |
| `determineInitialCamelPositions` | Intocado quanto ao doido |
| `applyRacingCardMove` | **Não** filtra `id === "Crazy"` |
| `validateMatchState` | Dual `TowardFinish` nos de corrida; **não** exige Crazy no 7 em `RaceSetup` |
| `CamelState` | Sem `owner`, `playerId`, `disqualified` |
| `startAndPersistMatch` | Orquestração inalterada; persiste só se `ok` |
| Load | `matchPersistence.ts` — só `deserializeMatchState`; **não** chama `startMatch` |
| Stub US-05 | `applyNextTurn` copia `camels`; teste explícito Crazy no 7 |
| Camadas | Domínio sem React/Next/`localStorage`; I/O em `application/` |
| `app/` | Sem wiring / sem menção a Crazy ou `startMatch` |
| Tasks 1–31 | Reportadas concluídas no `implementation.md`; nenhuma pendente/bloqueada; ordem TDD respeitada |
| TDD | RED evidenciado nas tarefas 3, 7 e 10; GREEN no-ops (14, 17, 20, 23, 26) previstos no plan/tasks |
| Migração de asserts US-06 | Só pós-sucesso de `startMatch` (Crazy 0 → 7); documentada no `tasks.md` §4 — não é alteração “para passar” |
| `AGENTS.md` | Lacuna da casa 7 fechada; seção US-07; instrução 16 (não reverter Crazy ao 0 após o início; não alterar `MIN_MONEY`) |

## 8. Riscos e Mitigações — Situação Atual

| Risco (plan §11) | Situação |
| --- | --- |
| Testes US-06 ainda assertem `Crazy.space === 0` após `startMatch` | Mitigado — asserts pós-sucesso migrados; Crazy no 0 permanece em Created, largada e rejeição atômica |
| Misturar o passo do doido nas 5 cartas | Mitigado — helper **depois** de `determineInitialCamelPositions` |
| Tornar espaço 7 invariante de `RaceSetup` | Mitigado — testes de legado no 0 e no espaço 5; validação não exige 7 |
| Adicionar `owner` / `disqualified` | Mitigado — tipo inalterado; testes de ausência de campo |
| Implementar movimento do doido para cobrir §17.6 | Mitigado — só caracterização + `AGENTS.md`; sem cartas pretas |
| `applyRacingCardMove` passar a ignorar Crazy | Mitigado — testes RF-09 falhariam se filtrasse `id === "Crazy"` |
| Load reexecutar o início e “corrigir” Crazy | Mitigado — load = deserialize; testes de igualdade com o persistido |
| Gravar iniciado após falha da US-06 | Mitigado — `startAndPersistMatch` só persiste se `ok`; Crazy permanece no 0 |
| JSON legado com Crazy no 0 em RaceSetup | Mitigado — aceito na validação permanente (D17) |

## 9. Não Conformidades e Pendências

Nenhuma não conformidade bloqueante. Nenhuma pendência no `implementation.md`.

Observação não bloqueante (não altera o veredito): o teste de independência de persistência trava que o load **não** importa `createMatch`; a inspeção de `matchPersistence.ts` confirma que o load também **não** chama `startMatch` (só `deserializeMatchState`), alinhado à spec D18.

## 10. Dúvidas Levantadas Durante a Validação

Nenhuma. Critérios de aceite, plan §13 e evidências de reexecução foram suficientes para o veredito.

## 11. Conclusão

A US-07 está **aprovada**. O código, os testes reexecutados e a documentação estável (`AGENTS.md`) atendem à `spec.md`, ao `plan.md` e ao `tasks.md`.

Fluxo SDD desta feature encerrado. Próximo passo de produto/repositório: revisão/PR/merge da branch `feature/us-07-inicializar-camelo-doido` quando desejado — esta validação **não** cria commit nem PR.

```text
docs/spec/us-07-inicializar-camelo-doido/spec.md
  ↓
docs/plan/us-07-inicializar-camelo-doido/plan.md
  ↓
docs/tasks/us-07-inicializar-camelo-doido/tasks.md
  ↓
docs/implementation/us-07-inicializar-camelo-doido/implementation.md
  ↓
docs/validation/us-07-inicializar-camelo-doido/validation.md   ← este artefato
```
