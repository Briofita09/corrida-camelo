# Tarefas de Implementação — US-01 Domínio e estado da partida

## 1. Contexto

Implementar o módulo de domínio `domain/match` para representar, criar, iniciar, validar e serializar o estado de uma partida de Camel Up, sem UI — conforme o plano técnico e a spec US-01.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `docs/plan/us-01-dominio-estado-partida/plan.md`
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md`

## 3. Convenções Utilizadas

| Item | Valor |
| --- | --- |
| Branch | `feature/us-01-dominio-estado-partida` (**suposição** — `AGENTS.md` não define convenção de branch) |
| Base | Branch atual de trabalho / `main` se existir no remoto local |
| Testes | `npm test` (`vitest run`); opcional `npm run test:watch` |
| Lint | `npm run lint` |
| Build | `npm run build` (validação final; domínio não deve quebrá-lo) |
| Módulo | `domain/match/` com testes colocalizados `*.test.ts` |
| Runner | Vitest 3.2.4, ambiente `node` |

## 4. Ciclo de Execução

```text
RED → GREEN → REFACTOR → npm test (escopo afetado)
         ↑______________________|
         (se falhar: corrigir implementação, não o teste)
```

Ao final: `npm test` completo + lint (+ build se estável) + checklist do `plan.md` §13.

**Em caso de falha de teste (todas as tarefas de validação):**

1. Analisar a causa (implementação, efeito colateral ou teste divergente da spec/plan).
2. Se for implementação: voltar ao GREEN correspondente e corrigir o código **sem** alterar o teste.
3. Se o teste parecer incorreto em relação à spec/plan: parar e perguntar ao usuário.
4. Repetir até passar ou dúvida bloqueante.

## 5. Lista de Tarefas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Descrição:** Criar e checkout da branch `feature/us-01-dominio-estado-partida` a partir da base de trabalho atual.
- **Dependências:** Nenhuma
- **Critério de conclusão:** Branch ativa com o nome acordado.

---

### Tarefa 2 — Confirmar tooling Vitest

- **Tipo:** Preparação / Validação
- **Descrição:** Executar `npm test` e confirmar que o Vitest inicia (pode não haver testes ainda). Ajustar `vitest.config.ts` ou scripts somente se o comando falhar por config.
- **Dependências:** Tarefa 1
- **Critério de conclusão:** `npm test` termina sem erro de startup do Vitest.

---

### Tarefa 3 — [RED] Rejeições de `createMatch`

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
Feature: Domínio e estado da partida
  Scenario: Criar partida sem jogadores
  Scenario: Criar partida abaixo do mínimo
  Scenario: Criar partida acima do máximo
  Scenario: Criar partida só com bots
  Scenario: Criar partida com bot sem dificuldade
  Scenario: Criar partida com identificadores duplicados
```

- **Camada de teste:** Unitária de domínio (`domain/match/*.test.ts`)
- **Descrição:** Escrever testes Vitest que esperam rejeição (`ok: false` / erro de domínio) para cada caso acima. Incluir stubs mínimos de tipos/API se necessário para o teste compilar e **falhar** por comportamento ausente.
- **Rastreabilidade:** Spec §13.2; Plan §7 item 1; RN-11
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Testes existem e falham pelo motivo esperado (create ainda não implementado ou rejeições incompletas).

---

### Tarefa 4 — [GREEN] Tipos, erros e `createMatch` (rejeições)

- **Tipo:** Implementação
- **Descrição:** Implementação mínima em `domain/match`: tipos essenciais (`GamePhase`, jogador, config de criação, `MatchState` parcial se preciso), tipo de resultado `ok`/`erro`, e `createMatch` que **rejeita** os casos inválidos da Tarefa 3. Caminho feliz pode ainda não existir ou retornar stub — o foco é fazer os testes de rejeição passarem.
- **Componentes envolvidos:** Tipos; erros de domínio; `createMatch`
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes da Tarefa 3 passando.

---

### Tarefa 5 — Executar testes (rejeições create)

- **Tipo:** Validação
- **Descrição:** Executar `npm test` no escopo de `domain/match` (ou suíte completa).
- **Em caso de falha:** Seguir o protocolo da §4 (corrigir GREEN da Tarefa 4).
- **Dependências:** Tarefa 4
- **Critério de conclusão:** Testes de rejeição de criação verdes.

---

### Tarefa 6 — [RED] `createMatch` caminho feliz + posições iniciais

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Criar partida válida com humano e bots
    Given uma configuração com 1 humano e 2 bots Easy e Medium
    When o domínio cria a partida
    Then fase Created, 3 jogadores com £3, 6 camelos, dificuldades gravadas
```

- **Camada de teste:** Unitária de domínio
- **Descrição:** Testes cobrindo: fase `Created`; dinheiro 3; exatamente 6 camelos (`Yellow`…`Crazy`); todos no espaço 0 com ordens de pilha distintas e determinísticas; Crazy Camel com direção oposta; bots com `Easy`/`Medium`/`Hard` quando informados; IDs da config preservados.
- **Rastreabilidade:** Spec §13.1, §14; RF-01, RF-02; Plan §7 item 2
- **Dependências:** Tarefa 5
- **Critério de conclusão:** Novos testes falhando até implementação completa do create válido.

---

### Tarefa 7 — [GREEN] Completar `createMatch` válido

- **Tipo:** Implementação
- **Descrição:** Completar `createMatch` para produzir estado válido conforme spec (jogadores, camelos, posições, fase, perna 0, turno ausente, £3).
- **Componentes envolvidos:** `createMatch`; tipos de camelo/posição
- **Dependências:** Tarefa 6
- **Critério de conclusão:** Testes das Tarefas 3 e 6 passando.

---

### Tarefa 8 — [REFACTOR] Módulo create / tipos

- **Tipo:** Refatoração
- **Descrição:** Extrair constantes (fases, identidades de camelos, limites 2–6, £ inicial), clarear nomes e evitar duplicação entre validação de config e create — **sem** mudar comportamento.
- **Dependências:** Tarefa 7
- **Critério de conclusão:** `npm test` continua verde.

---

### Tarefa 9 — Executar testes (create completo)

- **Tipo:** Validação
- **Descrição:** `npm test` após refactor do create.
- **Em caso de falha:** Protocolo §4 → Tarefa 7/8.
- **Dependências:** Tarefa 8
- **Critério de conclusão:** Suíte atual verde.

---

### Tarefa 10 — [RED] `startMatch`

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Iniciar partida criada
    Given partida válida em Created
    When startMatch
    Then fase RaceSetup

  Scenario: Tentar iniciar partida já iniciada
    Given partida em RaceSetup ou posterior (exceto Finished)
    When startMatch novamente
    Then rejeitado e fase inalterada
```

- **Camada de teste:** Unitária de domínio
- **Descrição:** Testes de sucesso e rejeição; garantir imutabilidade do estado de entrada (referência/conteúdo original preservado em caso de rejeição e, no sucesso, retorno de novo estado).
- **Rastreabilidade:** Spec §13.3; RF-03; RN-12; Plan §7 item 3
- **Dependências:** Tarefa 9
- **Critério de conclusão:** Testes falhando até implementar `startMatch`.

---

### Tarefa 11 — [GREEN] `startMatch`

- **Tipo:** Implementação
- **Descrição:** Implementar `startMatch`: só aceita `Created` → `RaceSetup`; rejeita demais fases; não muta o estado de entrada in-place.
- **Componentes envolvidos:** `startMatch`
- **Dependências:** Tarefa 10
- **Critério de conclusão:** Testes da Tarefa 10 passando.

---

### Tarefa 12 — Executar testes (startMatch)

- **Tipo:** Validação
- **Descrição:** `npm test`.
- **Em caso de falha:** Protocolo §4 → Tarefa 11.
- **Dependências:** Tarefa 11
- **Critério de conclusão:** Suíte verde incluindo start.

---

### Tarefa 13 — [RED] Validação / hidratação de estado inconsistente

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Receber estado incompleto ou inconsistente
    Given payload sem camelos completos
      Or dinheiro < 1
      Or mesma posição+ordem de pilha
      Or fase desconhecida
      Or LegInProgress sem turno válido
    When validate ou deserialize
    Then rejeitado
```

- **Camada de teste:** Unitária de domínio
- **Descrição:** Cobrir invariantes RN-01–RN-10 e RN-14 relevantes via `validateMatchState` e/ou `deserializeMatchState`. Incluir helper de teste que monta estados quase válidos com um defeito.
- **Rastreabilidade:** Spec §13.4; RF-05; Plan §7 item 4
- **Dependências:** Tarefa 12
- **Critério de conclusão:** Testes falhando até validador completo.

---

### Tarefa 14 — [GREEN] `validateMatchState` / hidratação

- **Tipo:** Implementação
- **Descrição:** Implementar validação de invariantes do estado e hidratação que rejeita payload incompleto/inconsistente. Estados em fases avançadas (`LegSetup`…`Finished`) devem ser representáveis se consistentes.
- **Componentes envolvidos:** Validador / hydrate
- **Dependências:** Tarefa 13
- **Critério de conclusão:** Testes da Tarefa 13 passando.

---

### Tarefa 15 — [RED] Mutação bloqueada em `Finished`

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Tentar modificar partida encerrada
    Given partida na fase Finished
    When qualquer comando de mutação (ex.: startMatch)
    Then rejeitado e estado inalterado
```

- **Camada de teste:** Unitária de domínio
- **Descrição:** Usar factory/hydrate de teste para construir `Finished` válido; assertir rejeição de `startMatch` (e qualquer outro comando de mutação exposto pelo módulo nesta US).
- **Rastreabilidade:** Spec §13.4; RN-13; Plan §11 mitigação Finished
- **Dependências:** Tarefa 14
- **Critério de conclusão:** Teste falhando ou vermelho até bloqueio explícito em `Finished`.

---

### Tarefa 16 — [GREEN] Bloqueio de mutação em `Finished`

- **Tipo:** Implementação
- **Descrição:** Garantir que comandos de mutação do módulo rejeitam fase `Finished` sem alterar o estado.
- **Componentes envolvidos:** `startMatch` (e guard compartilhado de mutação, se extrair)
- **Dependências:** Tarefa 15
- **Critério de conclusão:** Testes da Tarefa 15 passando.

---

### Tarefa 17 — [REFACTOR] Validação e guards

- **Tipo:** Refatoração
- **Descrição:** Unificar checagens de fase/`Finished`, reduzir duplicação entre create/validate/start; manter testes verdes.
- **Dependências:** Tarefa 16
- **Critério de conclusão:** `npm test` verde após refactor.

---

### Tarefa 18 — Executar testes (validate + Finished)

- **Tipo:** Validação
- **Descrição:** `npm test`.
- **Em caso de falha:** Protocolo §4 → Tarefas 14–17.
- **Dependências:** Tarefa 17
- **Critério de conclusão:** Suíte verde.

---

### Tarefa 19 — [RED] Serialização round-trip

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Round-trip de serialização
    Given partida válida em fase representável
    When serialize e depois deserialize
    Then estado semanticamente equivalente
```

- **Camada de teste:** Unitária de domínio
- **Descrição:** Cobrir pelo menos: estado `Created` pós-create; estado pós-`startMatch`; um estado `Finished` válido hidratado. Equivalência semântica dos campos da spec §8.
- **Rastreabilidade:** Spec §13.5; RF-06; RNF-02; Plan §7 item 5
- **Dependências:** Tarefa 18
- **Critério de conclusão:** Testes falhando até serialize/deserialize.

---

### Tarefa 20 — [GREEN] `serializeMatchState` / `deserializeMatchState`

- **Tipo:** Implementação
- **Descrição:** Serializar para string JSON (ou estrutura JSON-serializável) e desserializar com validação (reutilizar validador); rejeitar JSON inválido/inconsistente.
- **Componentes envolvidos:** Serialização / desserialização
- **Dependências:** Tarefa 19
- **Critério de conclusão:** Testes da Tarefa 19 passando.

---

### Tarefa 21 — [RED] Independência de UI (RNF-01)

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
  Scenario: Domínio independente de UI
    Given o módulo de domínio da partida
    Then ele não possui dependências de React nem de Next.js
```

- **Camada de teste:** Unitária / smoke estrutural
- **Descrição:** Teste ou verificação automatizada leve (ex.: leitura dos fontes de `domain/match` sem imports `react`/`next`) alinhada ao plano §6.
- **Rastreabilidade:** Spec §13.5; RNF-01
- **Dependências:** Tarefa 20
- **Critério de conclusão:** Verificação falha se houver import proibido; passa quando domínio está limpo.

---

### Tarefa 22 — [GREEN/REFACTOR] Garantir RNF-01 e API pública do módulo

- **Tipo:** Implementação / Refatoração
- **Descrição:** Remover qualquer import acidental de UI; expor API pública estável do módulo (`createMatch`, `startMatch`, `validateMatchState`, `serializeMatchState`, `deserializeMatchState`, tipos necessários). Sem barrel global da aplicação.
- **Componentes envolvidos:** Pacote `domain/match`
- **Dependências:** Tarefa 21
- **Critério de conclusão:** Teste RNF-01 e demais testes verdes.

---

### Tarefa 23 — Executar suíte completa da feature

- **Tipo:** Validação
- **Descrição:** Executar `npm test` cobrindo todos os cenários da spec §13 implementados.
- **Em caso de falha:** Protocolo §4 → GREEN relacionado.
- **Dependências:** Tarefa 22
- **Critério de conclusão:** Suíte completa verde.

---

### Tarefa 24 — Lint e build

- **Tipo:** Validação complementar
- **Descrição:** Executar `npm run lint` e `npm run build`. Corrigir problemas introduzidos pelo domínio sem alterar UI do template além do estritamente necessário.
- **Dependências:** Tarefa 23
- **Critério de conclusão:** Lint e build concluídos com sucesso.

---

### Tarefa 25 — Revisar critérios de conclusão do plano

- **Tipo:** Validação
- **Descrição:** Conferir checklist do `plan.md` §13 e aceite da `spec.md` §12. Confirmar: sem UI desnecessária; bots com dificuldades; mutação `Finished` bloqueada; round-trip ok; domínio sem React/Next.
- **Dependências:** Tarefa 24
- **Critério de conclusão:** Todos os itens do checklist do plano marcáveis como atendidos; divergências reportadas ao usuário.

---

## 6. Validações Finais

- [ ] Suíte de testes completa da feature executada com sucesso (`npm test`).
- [ ] Lint executado com sucesso (`npm run lint`).
- [ ] Build executado com sucesso (`npm run build`).
- [ ] Critérios de conclusão do `plan.md` §13 atendidos.
- [ ] Critérios de aceite da `spec.md` §12 atendidos.
- [ ] Nenhum teste foi alterado apenas para “passar” sem justificativa registrada.
- [ ] Escopo respeitado: sem movimento, apostas, IA, persistência em disco/rede ou UI de jogo.

## 7. Próxima Etapa

Executar a skill `create-implementation` (ou implementação manual) usando este arquivo como input:

```text
docs/tasks/us-01-dominio-estado-partida/tasks.md
```

Depois, validar com `create-validation` e gerar `validation.md`.

## 8. Mapa de rastreabilidade (resumo)

| Spec / Plan | Tarefas |
| --- | --- |
| §13.2 rejeições create | 3 → 4 → 5 |
| §13.1 + §14 create válido | 6 → 7 → 8 → 9 |
| §13.3 startMatch | 10 → 11 → 12 |
| §13.4 validate + inconsistências | 13 → 14 |
| §13.4 Finished imutável | 15 → 16 → 17 → 18 |
| §13.5 serialização | 19 → 20 |
| §13.5 / RNF-01 UI | 21 → 22 |
| Validação final | 23 → 24 → 25 |
