# Tarefas de Implementação — US-02 Configuração de nova partida

## 1. Contexto

Implementar o módulo `domain/match-config` para rascunho de configuração de nova partida (modo + participantes), validação por modo e geração de partida US-01 em `Created`, sem UI — conforme o plano técnico e a spec US-02.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-02-configuracao-nova-partida/spec.md`
- `docs/plan/us-02-configuracao-nova-partida/plan.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `domain/match/`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`

## 3. Convenções Utilizadas

| Item | Valor |
| --- | --- |
| Branch | `feature/us-02-configuracao-nova-partida` (**suposição** — `AGENTS.md` não define convenção) |
| Base | Branch atual / `feature/us-01-dominio-estado-partida` ou `master`, conforme estado do repo |
| Testes | `npm test` (`vitest run`); opcional `npm run test:watch` |
| Lint | `npm run lint` |
| Build | `npm run build` |
| Módulo | `domain/match-config/` com testes colocalizados `*.test.ts` |
| Integração | `@/domain/match` (`createMatch`, limites, `BotDifficulty`, `DomainResult`) |

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
- **Descrição:** Criar e checkout da branch `feature/us-02-configuracao-nova-partida`.
- **Dependências:** Nenhuma
- **Critério de conclusão:** Branch ativa com o nome acordado.

---

### Tarefa 2 — Confirmar Vitest e domínio US-01 disponíveis

- **Tipo:** Preparação / Validação
- **Descrição:** Executar `npm test` (suíte atual deve permanecer verde) e confirmar que `@/domain/match` exporta `createMatch`, `MIN_PLAYERS`, `MAX_PLAYERS`, `BotDifficulty`.
- **Dependências:** Tarefa 1
- **Critério de conclusão:** Vitest ok; API US-01 utilizável pelo novo módulo.

---

### Tarefa 3 — [RED] `createMatchConfig` e `setMatchMode`

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Modo deve vir antes dos jogadores
  Scenario: Voltar à etapa de modo descarta jogadores
```

- **Camada de teste:** Unitária (`domain/match-config/*.test.ts`)
- **Descrição:** Testes esperando: (1) criar config sem modo e sem participantes; (2) `setMatchMode` define modo; (3) add participante sem modo é rejeitado; (4) após adicionar participantes, redefinir modo zera a lista. Devem falhar até existir implementação.
- **Rastreabilidade:** Spec §13.3; Plan §9 itens 1–2; RF-01, RF-02
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Testes criados e falhando pelo motivo esperado.

---

### Tarefa 4 — [GREEN] Tipos, `createMatchConfig`, `setMatchMode`

- **Tipo:** Implementação
- **Descrição:** Criar `domain/match-config` com tipos (`MatchMode`, `MatchConfig`, participantes), `createMatchConfig` e `setMatchMode` (primeira definição e redefinição limpando participantes). Reutilizar padrão `DomainResult` (de `domain/match` ou espelho local consistente).
- **Componentes envolvidos:** Tipos; create; mode
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes da Tarefa 3 passando.

---

### Tarefa 5 — Executar testes (config + mode)

- **Tipo:** Validação
- **Descrição:** `npm test` no escopo `domain/match-config` (ou suíte completa).
- **Em caso de falha:** Protocolo §4 → Tarefa 4.
- **Dependências:** Tarefa 4
- **Critério de conclusão:** Testes de create/mode verdes; suíte US-01 intacta.

---

### Tarefa 6 — [RED] Participantes e nomes

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Nome vazio
  Scenario: Nomes duplicados
```

- **Camada de teste:** Unitária
- **Descrição:** Testes para `addParticipant` / `removeParticipant` / `updateParticipant`: aceitar humano e bot com dificuldade; rejeitar nome `""`/só espaços; rejeitar duplicata `Ana`/`ana` após trim; update que cause duplicata rejeitado.
- **Rastreabilidade:** Spec §13.2; RN-05, RN-06; RF-03, RF-04; Plan §9 item 3
- **Dependências:** Tarefa 5
- **Critério de conclusão:** Testes falhando até implementação.

---

### Tarefa 7 — [GREEN] Participantes + helpers de nome

- **Tipo:** Implementação
- **Descrição:** Implementar add/remove/update com trim na persistência do nome, chave normalizada case-insensitive, bot exigindo `Easy`\|`Medium`\|`Hard`, rejeição sem modo.
- **Componentes envolvidos:** participants; name helpers
- **Dependências:** Tarefa 6
- **Critério de conclusão:** Testes da Tarefa 6 passando.

---

### Tarefa 8 — [REFACTOR] Nomes e tipos de participante

- **Tipo:** Refatoração
- **Descrição:** Extrair helper de normalização de nome; alinhar erros tipados; sem mudar comportamento.
- **Dependências:** Tarefa 7
- **Critério de conclusão:** `npm test` continua verde.

---

### Tarefa 9 — Executar testes (participantes)

- **Tipo:** Validação
- **Descrição:** `npm test`.
- **Em caso de falha:** Protocolo §4 → Tarefas 7–8.
- **Dependências:** Tarefa 8
- **Critério de conclusão:** Suíte atual verde.

---

### Tarefa 10 — [RED] `validateMatchConfig` — regras por modo e limites

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Iniciar sem jogadores
  Scenario: Apenas um jogador no total
  Scenario: Acima do limite
  Scenario: Todos os jogadores são bots
  Scenario: Nenhum bot em Single-player
  Scenario: Nenhum bot em Pass-and-play com 2+ humanos
  Scenario: Pass-and-play com apenas 1 humano
```

- **Camada de teste:** Unitária
- **Descrição:** Testes de `validateMatchConfig` (e/ou generate, se validate for a porta) cobrindo §7 Single/Pass e limites 2–6. Preferir assertar validação explícita; generate também deve rejeitar os inválidos.
- **Rastreabilidade:** Spec §7, §13.2; RF-05; Plan §9 item 4
- **Dependências:** Tarefa 9
- **Critério de conclusão:** Testes falhando até validador completo.

---

### Tarefa 11 — [GREEN] `validateMatchConfig`

- **Tipo:** Implementação
- **Descrição:** Implementar validação: modo obrigatório; total ∈ [2,6]; Single = 1 humano + ≥1 bot; Pass = ≥2 humanos; bots com dificuldade; reutilizar `MIN_PLAYERS`/`MAX_PLAYERS` de `domain/match` quando possível.
- **Componentes envolvidos:** validate
- **Dependências:** Tarefa 10
- **Critério de conclusão:** Testes da Tarefa 10 passando.

---

### Tarefa 12 — Executar testes (validate)

- **Tipo:** Validação
- **Descrição:** `npm test`.
- **Em caso de falha:** Protocolo §4 → Tarefa 11.
- **Dependências:** Tarefa 11
- **Critério de conclusão:** Validação verde.

---

### Tarefa 13 — [RED] `createMatchFromConfig` — fluxos felizes e rejeições

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Single-player válido gera partida
  Scenario: Pass-and-play só com humanos
  Scenario: Pass-and-play com humanos e bots
  Scenario: Dificuldade do bot não muda após gerar partida
```

- **Camada de teste:** Unitária (integração domínio→domínio com `createMatch`)
- **Descrição:** Testes de geração: fase `Created`; nomes/tipos/dificuldades corretos; IDs únicos; configs inválidas rejeitadas sem criar partida; bot Easy preservado no `MatchState`.
- **Rastreabilidade:** Spec §13.1, §13.3; RF-06; RN-08, RN-09, RN-11; Plan §9 item 5
- **Dependências:** Tarefa 12
- **Critério de conclusão:** Testes falhando até `createMatchFromConfig`.

---

### Tarefa 14 — [GREEN] `createMatchFromConfig`

- **Tipo:** Implementação
- **Descrição:** Validar → mapear participantes para `CreateMatchConfig` (IDs determinísticos) → `createMatch`; propagar erro; não mutar dificuldade após retorno.
- **Componentes envolvidos:** createMatchFromConfig; integração `@/domain/match`
- **Dependências:** Tarefa 13
- **Critério de conclusão:** Testes da Tarefa 13 passando.

---

### Tarefa 15 — Executar testes (generate)

- **Tipo:** Validação
- **Descrição:** `npm test`.
- **Em caso de falha:** Protocolo §4 → Tarefa 14.
- **Dependências:** Tarefa 14
- **Critério de conclusão:** Generate verde; testes `domain/match` ainda passam.

---

### Tarefa 16 — [RED] `discardMatchConfig` e independência de UI

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Abandonar configuração
  Scenario: Configuração independente de UI
```

- **Camada de teste:** Unitária + smoke estrutural
- **Descrição:** Discard zera/descarta rascunho sem criar partida e sem I/O; fontes de `domain/match-config` (exceto testes) sem imports `react`/`next`.
- **Rastreabilidade:** Spec §13.3–13.4; RF-07, RF-08; RNF-01, RNF-04; Plan §9 itens 6–7
- **Dependências:** Tarefa 15
- **Critério de conclusão:** Testes falhando até discard + smoke.

---

### Tarefa 17 — [GREEN] `discardMatchConfig` + API pública

- **Tipo:** Implementação
- **Descrição:** Implementar discard; expor API estável via `index.ts` (`createMatchConfig`, `setMatchMode`, participantes, `validateMatchConfig`, `createMatchFromConfig`, `discardMatchConfig`, tipos).
- **Componentes envolvidos:** discard; index
- **Dependências:** Tarefa 16
- **Critério de conclusão:** Testes da Tarefa 16 passando.

---

### Tarefa 18 — [REFACTOR] Módulo match-config

- **Tipo:** Refatoração
- **Descrição:** Remover duplicação entre validate e generate; clarear códigos de erro; garantir imutabilidade dos comandos; sem mudar comportamento.
- **Dependências:** Tarefa 17
- **Critério de conclusão:** `npm test` verde após refactor.

---

### Tarefa 19 — Executar suíte completa

- **Tipo:** Validação
- **Descrição:** `npm test` (US-01 + US-02).
- **Em caso de falha:** Protocolo §4 → GREEN relacionado.
- **Dependências:** Tarefa 18
- **Critério de conclusão:** Toda a suíte verde cobrindo spec US-02 §13.

---

### Tarefa 20 — Lint e build

- **Tipo:** Validação complementar
- **Descrição:** `npm run lint` e `npm run build`. Corrigir problemas introduzidos pelo módulo sem alterar UI do template.
- **Dependências:** Tarefa 19
- **Critério de conclusão:** Lint e build com sucesso.

---

### Tarefa 21 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Descrição:** Conferir checklist do `plan.md` §13 e aceite da `spec.md` §12. Confirmar: sem UI; sem persistência de rascunho; sem API de alterar dificuldade pós-partida; modo limpa jogadores ao redefinir.
- **Dependências:** Tarefa 20
- **Critério de conclusão:** Checklist atendido ou divergências reportadas ao usuário.

---

## 6. Validações Finais

- [ ] Suíte completa `npm test` com sucesso (match + match-config).
- [ ] Lint OK (`npm run lint`).
- [ ] Build OK (`npm run build`).
- [ ] Critérios do `plan.md` §13 atendidos.
- [ ] Critérios de aceite da `spec.md` §12 atendidos.
- [ ] Nenhum teste alterado só para “passar”.
- [ ] Escopo respeitado: sem telas, Online, `startMatch`, IA ou persistência de rascunho.

## 7. Próxima Etapa

Executar a skill `create-implementation` com:

```text
docs/tasks/us-02-configuracao-nova-partida/tasks.md
```

Depois validar com `create-validation`.

## 8. Mapa de rastreabilidade (resumo)

| Spec / Plan | Tarefas |
| --- | --- |
| create + setMode + modo antes dos jogadores | 3 → 4 → 5 |
| Participantes + nomes | 6 → 7 → 8 → 9 |
| validate / regras §7 | 10 → 11 → 12 |
| createMatchFromConfig | 13 → 14 → 15 |
| discard + RNF-01 | 16 → 17 → 18 |
| Validação final | 19 → 20 → 21 |
