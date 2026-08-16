# Tarefas de Implementação — US-03 Ordem inicial dos jogadores

## 1. Contexto

Implementar sorteio aleatório da ordem dos jogadores na criação da partida, campo serializável `playerRoundIndex`, sequência por rodada com rotação, e persistência/restauração via `localStorage` sem novo sorteio — conforme o plano técnico e a spec US-03. Sem UI.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md`
- `docs/plan/us-03-ordem-inicial-jogadores/plan.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `docs/spec/us-02-configuracao-nova-partida/spec.md`
- `domain/match/`
- `domain/match-config/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Convenções Utilizadas

| Item | Valor |
| --- | --- |
| Branch | `feature/us-03-ordem-inicial-jogadores` (**suposição** — `AGENTS.md` não define convenção) |
| Base | Branch atual / `master` (ou equivalente), conforme estado do repo |
| Testes | `npm test` (`vitest run`); opcional `npm run test:watch` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Domínio | `domain/match/` — testes colocalizados `*.test.ts` |
| Persistência | `application/match-persistence/` — testes colocalizados `*.test.ts` |
| Comando de testes | Ambiente Vitest `node`; mock/fake para `localStorage` |

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

## 5. Lista de Tarefas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Descrição:** Criar e checkout da branch `feature/us-03-ordem-inicial-jogadores`.
- **Dependências:** Nenhuma
- **Critério de conclusão:** Branch ativa com o nome acordado.

---

### Tarefa 2 — Confirmar suíte atual e APIs US-01/US-02

- **Tipo:** Preparação / Validação
- **Descrição:** Executar `npm test` (deve permanecer verde). Confirmar exports de `@/domain/match` (`createMatch`, `startMatch`, serialize/deserialize/validate, tipos) e `@/domain/match-config` (`createMatchFromConfig`).
- **Dependências:** Tarefa 1
- **Critério de conclusão:** Suíte verde; APIs disponíveis para extensão.

---

### Tarefa 3 — [RED] Sequência de jogadores por rodada

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
Feature: Ordem inicial dos jogadores
  Scenario: Sequência das primeiras rodadas com 4 jogadores
    Given ordem base [A, B, C, D]
    When se consulta a sequência da rodada 0
    Then a sequência é A, B, C, D
    When se consulta a sequência da rodada 1
    Then a sequência é B, C, D, A
    When se consulta a sequência da rodada 2
    Then a sequência é C, D, A, B
    When se consulta a sequência da rodada 3
    Then a sequência é D, A, B, C
```

- **Camada de teste:** Unitária (`domain/match/*.test.ts`)
- **Descrição:** Testes para função pura `getRoundPlayerSequence` (ou nome equivalente do plano) cobrindo rodadas 0–3 com 4 jogadores; opcionalmente N=2 e wrap-around. Devem falhar até existir a função.
- **Rastreabilidade:** Spec §7, §12.3; Plan §9 item 1; RF-03
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado.

---

### Tarefa 4 — [GREEN] `getRoundPlayerSequence`

- **Tipo:** Implementação
- **Descrição:** Implementar função pura que, dados `players` (ordem base) e índice de rodada `r`, retorna a sequência `P[r mod n], …` sem mutar o array de entrada.
- **Componentes envolvidos:** Domínio `match` — sequência de rodada
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes da Tarefa 3 passando.

---

### Tarefa 5 — Executar testes (sequência de rodada)

- **Tipo:** Validação
- **Descrição:** `npm test` no escopo `domain/match` (ou suíte completa).
- **Em caso de falha:** Protocolo §4 → Tarefa 4.
- **Dependências:** Tarefa 4
- **Critério de conclusão:** Testes de sequência verdes; restante da suíte intacto.

---

### Tarefa 6 — [RED] `playerRoundIndex` em estado, validate e serialize

- **Tipo:** Teste
- **Cenário relacionado (BDD):** Partida serializável com deslocamento de rodada (Spec RR-03; Plan §8.5).
- **Camada de teste:** Unitária (`domain/match/*.test.ts` — serialize/validate/create)
- **Descrição:** Testes esperando: (1) partida criada com `playerRoundIndex === 0`; (2) round-trip serialize/deserialize preserva o campo; (3) valor inválido (negativo, não inteiro) rejeitado na validate/deserialize; (4) campo ausente em JSON legado hidratado como `0` se o restante for válido. Devem falhar até o campo existir.
- **Rastreabilidade:** Spec RR-03, RN-05; Plan §5.1 itens 6 e 8.5; RF-02
- **Dependências:** Tarefa 5
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado.

---

### Tarefa 7 — [GREEN] Estender `MatchState` + validate/serialize/deserialize

- **Tipo:** Implementação
- **Descrição:** Adicionar `playerRoundIndex: number` a `MatchState`; incluir em create (inicial `0`), validate (inteiro ≥ 0), serialize/deserialize (ausente → `0`). Atualizar helpers de teste US-01 se necessário.
- **Componentes envolvidos:** Tipos; create (mínimo para o campo); validate; serialize
- **Dependências:** Tarefa 6
- **Critério de conclusão:** Testes da Tarefa 6 passando; regressões óbvias de serialize US-01 corrigidas na implementação (não afrouxar asserts sem necessidade).

---

### Tarefa 8 — Executar testes (estado + serialize)

- **Tipo:** Validação
- **Descrição:** `npm test` escopo `domain/match`.
- **Em caso de falha:** Protocolo §4 → Tarefa 7.
- **Dependências:** Tarefa 7
- **Critério de conclusão:** Serialize/validate/create com `playerRoundIndex` verdes.

---

### Tarefa 9 — [RED] Estratégia de ordenação + `createMatch` sorteia

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Criar partida ordena jogadores aleatoriamente
  Scenario: Todos participam e sem duplicata
  Scenario: Ordenação inicial é estratégia isolada
```

- **Camada de teste:** Unitária (`domain/match/*.test.ts`)
- **Descrição:** Testes com RNG/estratégia injetável: (1) com RNG controlado, ordem é permutação completa sem duplicata (N=2..6); (2) estratégia identidade preserva ordem de entrada; (3) default usa estratégia aleatória (contrato: opção de ordenação existe / default não é identidade se RNG forçar troca — preferir asserts via injeção, sem flakiness); (4) `createMatch` não muta o array de input. Devem falhar até a ordenação existir.
- **Rastreabilidade:** Spec §12.1, §12.4; Plan §9 itens 3–4; RF-01, RF-07, RN-01–04
- **Dependências:** Tarefa 8
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado.

---

### Tarefa 10 — [GREEN] Contrato de estratégia + integração em `createMatch`

- **Tipo:** Implementação
- **Descrição:** Introduzir contrato de estratégia de ordenação (ex.: `PlayerOrderingStrategy`) e implementação aleatória (Fisher–Yates) com RNG injetável (`() => number`, default `Math.random`). `createMatch(config, options?)` aplica a estratégia **após** validar e **antes** de montar `players`; copiar array antes de embaralhar. Exportar o necessário via barril do módulo.
- **Componentes envolvidos:** Estratégia; `createMatch`; opções de teste
- **Dependências:** Tarefa 9
- **Critério de conclusão:** Testes da Tarefa 9 passando.

---

### Tarefa 11 — [RED] `startMatch` não reordena + `advancePlayerRound`

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: startMatch não reordena players
```

- **Camada de teste:** Unitária (`domain/match/*.test.ts`)
- **Descrição:** (1) create com estratégia identidade → `startMatch` → mesma ordem de ids e mesmo `playerRoundIndex`; (2) `advancePlayerRound` incrementa o índice sem alterar ordem de `players`; (3) opcional: partida `Finished` rejeita avanço, alinhado ao padrão US-01 de mutações. Devem falhar até o comando de avanço existir / asserts de estabilidade.
- **Rastreabilidade:** Spec §12.3, D7; Plan §5.1 itens 7–8; RN-06
- **Dependências:** Tarefa 10
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado (ou parcialmente verdes só o que já for verdade — avanço deve falhar até GREEN).

---

### Tarefa 12 — [GREEN] Estabilidade em `startMatch` + `advancePlayerRound`

- **Tipo:** Implementação
- **Descrição:** Garantir que `startMatch` não reordena `players` nem resorteia; implementar `advancePlayerRound` incrementando `playerRoundIndex` imutavelmente. Rejeitar mutação em `Finished` se o módulo já padroniza isso.
- **Componentes envolvidos:** `startMatch`; `advancePlayerRound`
- **Dependências:** Tarefa 11
- **Critério de conclusão:** Testes da Tarefa 11 passando.

---

### Tarefa 13 — [REFACTOR] Domínio de ordem / rodada

- **Tipo:** Refatoração
- **Descrição:** Clareza de nomes, exports públicos (`index`), remoção de duplicação entre estratégia e create; sem mudar comportamento. Confirmar que domínio não importa React/Next/`localStorage`.
- **Dependências:** Tarefa 12
- **Critério de conclusão:** Testes de `domain/match` continuam verdes.

---

### Tarefa 14 — Executar testes (domínio match completo US-03)

- **Tipo:** Validação
- **Descrição:** `npm test` escopo `domain/match`.
- **Em caso de falha:** Protocolo §4 → GREEN/REFACTOR anteriores.
- **Dependências:** Tarefa 13
- **Critério de conclusão:** Suíte `match` verde com ordem + rodada.

---

### Tarefa 15 — [RED/ajuste] Regressão `match-config` com ordenação

- **Tipo:** Teste / Ajuste
- **Cenário relacionado (BDD):** Criar partida a partir da configuração (Spec §12.1 via US-02).
- **Camada de teste:** Unitária (`domain/match-config/*.test.ts`)
- **Descrição:** Revisar testes que assumem ordem de entrada dos participantes. Ajustar para: (a) injetar estratégia identidade via `createMatch` se o fluxo de config permitir opções, **ou** (b) assertar permutação/conjunto de ids/nomes. Adicionar teste explícito: `createMatchFromConfig` produz permutação completa sem duplicata (com RNG/estratégia controlada se exposto). **Não** implementar segundo sorteio em `match-config`.
- **Rastreabilidade:** Plan §9 item 6, risco “testes US-02”; Spec D1
- **Dependências:** Tarefa 14
- **Critério de conclusão:** Testes de config alinhados ao novo comportamento; falhas esperadas só se ainda faltar wiring — caso contrário já verdes após ajuste.

---

### Tarefa 16 — [GREEN] Wiring mínimo US-02 se necessário

- **Tipo:** Implementação
- **Descrição:** Se `createMatchFromConfig` precisar repassar `options` de ordenação para testes, adicionar parâmetro opcional fino **sem** lógica de sorteio no módulo config. Caso contrário, apenas garantir que um único sorteio ocorre via `createMatch`.
- **Componentes envolvidos:** `createMatchFromConfig` (opcional)
- **Dependências:** Tarefa 15
- **Critério de conclusão:** Suíte `match-config` verde; sem duplo sorteio.

---

### Tarefa 17 — Executar testes (match + match-config)

- **Tipo:** Validação
- **Descrição:** `npm test` cobrindo `domain/match` e `domain/match-config`.
- **Em caso de falha:** Protocolo §4 → Tarefas 15–16.
- **Dependências:** Tarefa 16
- **Critério de conclusão:** Ambos os módulos verdes.

---

### Tarefa 18 — [RED] Porta de persistência + fake in-memory

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Recarregar não altera a ordem
  Scenario: Entrar novamente na partida existente
```

- **Camada de teste:** Unitária/aplicação (`application/match-persistence/*.test.ts`)
- **Descrição:** Com fake in-memory: (1) save de `MatchState` → load por id retorna mesma ordem e `playerRoundIndex`; (2) marcar/carregar partida ativa; (3) load **não** invoca ordenação/`createMatch` (spy ou ausência de dependência). Devem falhar até existir a porta/API.
- **Rastreabilidade:** Spec §12.2; Plan §9 item 7; RF-04–06, RN-07–08
- **Dependências:** Tarefa 17
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado.

---

### Tarefa 19 — [GREEN] Porta + fake storage + save/load/ativa

- **Tipo:** Implementação
- **Descrição:** Criar `application/match-persistence` com porta (save, load por id, set/get active id) e implementação in-memory para testes. Usar `serializeMatchState` / `deserializeMatchState` do domínio. Namespace de chaves conforme plano (prefixo `camel-up-card-game:`). Domínio continua sem I/O.
- **Componentes envolvidos:** Porta; fake; API save/load/ativa
- **Dependências:** Tarefa 18
- **Critério de conclusão:** Testes da Tarefa 18 passando.

---

### Tarefa 20 — [RED] Adaptador `localStorage`

- **Tipo:** Teste
- **Camada de teste:** Unitária (`application/match-persistence/*.test.ts`)
- **Descrição:** Com mock do Web Storage API: save/load/ativa persistem strings JSON nas chaves esperadas; restore produz `MatchState` equivalente; comportamento de chave ausente/erro de parse alinhado a `DomainResult` ou resultado explícito da aplicação (rejeitar/ restaurar falho — sem resortear).
- **Rastreabilidade:** Plan §9 item 8; Spec D5
- **Dependências:** Tarefa 19
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado.

---

### Tarefa 21 — [GREEN] Adaptador `localStorage`

- **Tipo:** Implementação
- **Descrição:** Implementar adaptador que usa `localStorage` (injetável para testes) com as mesmas operações da porta. Sem UI.
- **Componentes envolvidos:** Adaptador `localStorage`
- **Dependências:** Tarefa 20
- **Critério de conclusão:** Testes da Tarefa 20 passando.

---

### Tarefa 22 — [RED] Orquestração create → save

- **Tipo:** Teste
- **Cenário relacionado (BDD):** Criar partida … And a partida é persistida no localStorage com essa ordem (Spec §12.1).
- **Camada de teste:** Unitária/aplicação (`application/match-persistence/*.test.ts` ou módulo de orquestração colocalizado)
- **Descrição:** Função de aplicação que, dado resultado ok de `createMatch`/`createMatchFromConfig` (ou `MatchState` já criado), salva e marca como ativa. Assert: storage contém a mesma ordem; segunda “entrada” via load ativa não resorteia.
- **Rastreabilidade:** Plan §5.1 itens 12–13, §9 item 9; RN-10
- **Dependências:** Tarefa 21
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado.

---

### Tarefa 23 — [GREEN] Orquestração create → save

- **Tipo:** Implementação
- **Descrição:** Implementar função fina de aplicação (ex.: `persistCreatedMatch` / `createAndPersistMatch`) que apenas persiste estado já criado — **sem** regras de modo/sorteio. Documentar no código/exports o contrato para UI futura.
- **Componentes envolvidos:** Orquestração de persistência
- **Dependências:** Tarefa 22
- **Critério de conclusão:** Testes da Tarefa 22 passando.

---

### Tarefa 24 — [REFACTOR] Persistência de aplicação

- **Tipo:** Refatoração
- **Descrição:** Alinhar nomes públicos (`saveMatch`, `loadMatch`, `getActiveMatch` ou equivalentes), reduzir duplicação porta/adaptadores; garantir que `application/` não importa React desnecessariamente e que `domain/` não importa `application/`.
- **Dependências:** Tarefa 23
- **Critério de conclusão:** Testes de persistência continuam verdes.

---

### Tarefa 25 — Executar suíte completa da feature

- **Tipo:** Validação
- **Descrição:** `npm test` (match + match-config + match-persistence).
- **Em caso de falha:** Protocolo §4 → implementação correspondente.
- **Dependências:** Tarefa 24
- **Critério de conclusão:** Suíte completa verde.

---

### Tarefa 26 — Lint e build

- **Tipo:** Validação
- **Descrição:** Executar `npm run lint` e `npm run build`.
- **Em caso de falha:** Corrigir problemas introduzidos pela feature; não desabilitar regras sem necessidade.
- **Dependências:** Tarefa 25
- **Critério de conclusão:** Lint e build OK.

---

### Tarefa 27 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Descrição:** Conferir checklist do `plan.md` §13 e aceite da `spec.md` §11 (sorteio, unicidade, `players` como ordem, `playerRoundIndex`, sequência A–D, `startMatch` estável, save/load sem resortear, estratégia isolada, sem UI). Registrar evidências na etapa de `implementation.md` (próxima skill), não inventar escopo extra.
- **Dependências:** Tarefa 26
- **Critério de conclusão:** Todos os itens do plan §13 atendidos ou gaps explícitos reportados ao usuário.

## 6. Validações Finais

- [ ] Suíte de testes completa da feature executada com sucesso (`npm test`).
- [ ] Lint e build executados com sucesso.
- [ ] Critérios de conclusão do `plan.md` §13 atendidos.
- [ ] Critérios de aceite da `spec.md` §11 cobertos pelos testes.
- [ ] Nenhum teste foi alterado apenas para “passar” sem justificativa vs spec/plan.
- [ ] Domínio sem React/Next/`localStorage`; persistência só em `application/`.
- [ ] Sem UI introduzida nesta US.

## 7. Próxima Etapa

Implementar as tarefas deste arquivo via skill `create-implementation`, gerando `docs/implementation/us-03-ordem-inicial-jogadores/implementation.md`, e em seguida validar com `create-validation`.

Input desta etapa:

```text
docs/tasks/us-03-ordem-inicial-jogadores/tasks.md
```
