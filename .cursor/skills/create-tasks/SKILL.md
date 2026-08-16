---
name: sdd-tasks
description: Transforma um plan.md previamente criado em uma lista operacional de tarefas (tasks.md), como a quarta etapa de um fluxo de Spec Driven Development (AGENTS.md → spec.md → plan.md → tasks.md → implementation → validation). Use esta skill sempre que o usuário pedir para criar, gerar ou atualizar tasks a partir de um plano, mencionar "tasks.md", "tarefas", "task list", "decompor o plano", referenciar o fluxo SDD na etapa de tasks, ou pedir a próxima etapa depois de um plan.md pronto. Também aciona quando o usuário referenciar um plano em um caminho como docs/plan/.../plan.md e quiser a decomposição em tarefas executáveis, incluindo criação de branch, ciclo TDD (RED-GREEN-REFACTOR), implementação de testes, implementação de código e reexecução de testes em caso de falha. NÃO use esta skill para escrever a spec, escrever o plano técnico, ou implementar o código de fato — essas são etapas separadas do fluxo SDD.
---

# SDD — Tasks Skill

## Objetivo

Esta skill é responsável por transformar um `plan.md` previamente criado em uma **lista operacional de tarefas** (`tasks.md`), prontas para serem executadas por um agente.

Ela representa a quarta etapa do fluxo de Spec Driven Development:

```text
AGENTS.md
   ↓
spec.md
   ↓
plan.md
   ↓
tasks.md       ← esta skill
   ↓
implementation
   ↓
validation
```

O objetivo do `tasks.md` é decompor a estratégia definida no `plan.md` em **tarefas executáveis, sequenciais e verificáveis**, cobrindo desde a criação da branch até a validação final via testes, seguindo o ciclo TDD (RED → GREEN → REFACTOR).

Esta skill **não deve implementar código** — ela apenas planeja e descreve as tarefas que o agente de implementação deverá executar posteriormente.

---

# Input

O input obrigatório desta skill é um arquivo:

```text
plan.md
```

Localizado em:

```text
docs/plan/<nome-da-feature>/plan.md
```

A skill deve identificar automaticamente a localização do `plan.md` mais relevante quando possível.

Caso não seja possível identificar um `plan.md` válido, a execução deve ser interrompida e o usuário deve ser questionado sobre qual plano deve ser utilizado.

---

# Output

O output obrigatório é:

```text
docs/tasks/<nome-da-feature>/tasks.md
```

A pasta `docs` fica na raiz do projeto.

O `<nome-da-feature>` deve ser o mesmo identificador utilizado nas etapas anteriores (`spec.md` e `plan.md`), garantindo rastreabilidade entre as pastas:

```text
docs/spec/<nome-da-feature>/spec.md
docs/plan/<nome-da-feature>/plan.md
docs/tasks/<nome-da-feature>/tasks.md
```

Caso o `plan.md` utilize um identificador explícito para a feature, esse identificador deve ser respeitado.

---

# Princípios

A elaboração das tarefas deve seguir os seguintes princípios:

1. **O `plan.md` é a fonte técnica da verdade.**
2. **AGENTS.md é a fonte de contexto e regras do projeto.**
3. **Guidelines do projeto devem ser respeitadas.**
4. **TDD é o ciclo obrigatório de desenvolvimento: RED → GREEN → REFACTOR.**
5. **BDD/Gherkin deve ser usado para descrever comportamentos sempre que agregar clareza à tarefa.**
6. **Cada tarefa deve ser pequena, objetiva e verificável.**
7. **Toda tarefa deve ser executável por outro agente sem depender de conhecimento implícito.**
8. **Decisões não especificadas no plano não devem ser inventadas.**
9. **Dúvidas relevantes devem interromper a execução.**
10. **Falha em teste implica reexecução da implementação, nunca alteração do teste para "passar a qualquer custo".**
11. **O arquivo deve ser escrito integralmente em PT-BR.**
12. **Não implementar código durante esta etapa.**
13. **Não alterar `spec.md` ou `plan.md` durante esta etapa.**

---

# Ordem de leitura do contexto

Antes de gerar as tarefas, a skill deve analisar o contexto do projeto na seguinte ordem:

```text
1. AGENTS.md
2. Guidelines do projeto
3. plan.md
4. spec.md (quando necessário para esclarecer algum comportamento)
```

O `plan.md` é a fonte de verdade sobre **a estratégia técnica**, enquanto `AGENTS.md` e as guidelines definem **como o projeto deve ser trabalhado** (comandos, convenções, ferramentas de teste, padrão de branches e commits).

---

# 1. Localizar AGENTS.md

A skill deve procurar pelo `AGENTS.md` relevante para a feature, considerando possíveis arquivos em diretórios superiores ou específicos da área do projeto e respeitando a hierarquia de diretórios quando houver múltiplos.

A skill deve identificar, em especial para a geração de tasks:

* comando de execução de testes;
* comando de lint/format;
* convenção de nomenclatura de branches;
* convenção de mensagens de commit;
* estrutura de diretórios de testes;
* framework de testes utilizado;
* padrões de BDD/Gherkin já adotados no projeto, se houver;
* restrições sobre criação de branches (ex: branch a partir de qual base);
* qualquer outra instrução necessária para decompor o plano em tarefas.

A skill **não deve contradizer o `AGENTS.md`**. Em caso de conflito entre a tarefa inicialmente imaginada e uma regra explícita do `AGENTS.md`, a regra do `AGENTS.md` deve prevalecer.

---

# 2. Localizar Guidelines

A skill deve procurar guidelines ou documentação de desenvolvimento relevantes ao projeto, por exemplo:

```text
docs/guidelines/
docs/guides/
docs/architecture/
docs/standards/
CONTRIBUTING.md
DEVELOPMENT.md
README.md
```

A skill deve considerar somente as guidelines relevantes para a decomposição em tarefas (ex: padrão de testes, padrão de commits, padrão de branches, checklist de PR).

Caso não existam guidelines adicionais, a execução deve continuar normalmente.

---

# 3. Ler o plan.md

A skill deve ler integralmente o `plan.md` e identificar:

* análise de impacto (áreas afetadas, componentes novos e existentes);
* estratégia de implementação;
* estratégia BDD (cenários e comportamentos mapeados);
* estratégia TDD;
* alterações técnicas por camada (backend, frontend, banco de dados, APIs, integrações);
* ordem de implementação definida;
* estratégia de testes;
* riscos e mitigações;
* dependências;
* critérios para conclusão.

Caso alguma informação necessária para gerar as tarefas não esteja definida no `plan.md` (nem na `spec.md` referenciada), a skill não deve inventar — deve seguir para a etapa de verificação de ambiguidades.

---

# 4. Verificação de ambiguidades

Antes de gerar as tarefas, a skill deve verificar se existe informação insuficiente para decompor o plano com segurança.

Exemplos de dúvidas relevantes:

* O plano não define claramente a ordem entre duas mudanças com dependência mútua?
* Não está claro qual comando deve ser usado para rodar os testes?
* Não há convenção definida de nome de branch no `AGENTS.md` nem nas guidelines?
* Um cenário BDD do plano não possui estratégia de teste associada?
* Um componente citado no plano não tem responsabilidade clara o suficiente para virar uma tarefa objetiva?
* Existe ambiguidade sobre em qual camada um teste deve ser criado?
* O plano menciona um risco técnico sem estratégia de mitigação suficiente para gerar uma tarefa?

## Regra obrigatória

Se existir uma dúvida que possa alterar significativamente:

* a ordem das tarefas;
* o escopo de uma tarefa;
* a estratégia de testes;
* a definição de "concluído" de uma tarefa;
* o fluxo de branch/commit;

a skill deve **parar imediatamente a geração das tarefas e perguntar ao usuário**.

Não deve escolher arbitrariamente uma alternativa.

Não deve continuar produzindo o `tasks.md` parcialmente.

Depois que o usuário responder, a skill pode continuar a decomposição utilizando a nova informação.

---

# 5. Estrutura do ciclo de execução do agente

Toda feature decomposta por esta skill deve seguir o seguinte ciclo de alto nível, adaptado à realidade do `plan.md`:

```text
1. Criar branch
2. Para cada comportamento/unidade de trabalho, seguindo a ordem do plan.md:
   2.1. RED     — escrever/atualizar o teste que descreve o comportamento esperado (deve falhar)
   2.2. GREEN   — implementar o código mínimo necessário para o teste passar
   2.3. REFACTOR — refatorar mantendo os testes verdes
   2.4. Executar a suíte de testes relevante
   2.5. Caso algum teste falhe:
        - reexecutar a implementação (ajustar o código, não o teste, salvo erro comprovado no teste)
        - repetir 2.4 até os testes passarem ou até esgotar as tentativas razoáveis
        - se a falha persistir e a causa não estiver clara, parar e perguntar ao usuário
3. Executar a suíte de testes completa da feature
4. Executar validações adicionais definidas no plan.md (lint, build, etc., quando aplicável)
5. Revisar critérios de conclusão do plan.md
```

Esse ciclo deve nortear a criação das tarefas nas seções seguintes, mas a **decomposição real** deve refletir a ordem de implementação e os componentes definidos no `plan.md`, não apenas repetir este esqueleto genericamente.

---

# 6. Tarefa de criação de branch

A primeira tarefa do `tasks.md` deve sempre tratar da criação da branch de trabalho.

Deve considerar:

* convenção de nomenclatura definida no `AGENTS.md` ou guidelines (ex: `feature/<nome-da-feature>`, `feat/<ticket>-<descricao>`);
* branch base a partir da qual a nova branch deve ser criada (ex: `main`, `develop`), quando definida;
* caso não exista convenção definida, a skill deve propor um nome baseado no `<nome-da-feature>` e sinalizar isso como uma suposição não bloqueante, **exceto** se o próprio processo de branching for ambíguo o suficiente para impactar o fluxo de trabalho (nesse caso, deve perguntar ao usuário).

---

# 7. Tarefas de teste (RED)

Para cada comportamento relevante identificado na estratégia BDD/TDD do `plan.md`, a skill deve criar uma tarefa específica de escrita de teste, indicando:

* qual comportamento está sendo coberto (referenciando o cenário do `plan.md`/`spec.md` quando existir);
* em qual camada o teste deve ser criado (unitário, integração, componente, E2E, etc.), conforme definido no plano;
* qual é o resultado esperado do teste (deve falhar neste momento, pois o código ainda não existe — fase RED);
* quais casos de erro e casos de borda devem ser cobertos, quando aplicável.

Quando fizer sentido, a tarefa deve utilizar Gherkin para descrever o comportamento esperado:

```gherkin
Feature: <nome da feature>
  Scenario: <nome do cenário>
    Given <contexto>
    When <ação>
    Then <resultado esperado>
```

Não é obrigatório repetir Gherkin em toda tarefa — apenas quando o comportamento se beneficiar dessa formalização (fluxos de usuário, regras de negócio com múltiplos caminhos, critérios de aceitação).

---

# 8. Tarefas de implementação (GREEN)

Para cada tarefa de teste criada, deve existir uma tarefa de implementação correspondente, indicando:

* qual código deve ser criado ou alterado para fazer o teste passar;
* que a implementação deve ser a mínima necessária para atingir o comportamento esperado (princípio GREEN do TDD);
* quais componentes do `plan.md` estão envolvidos (reaproveitando a nomenclatura usada no plano: serviços, repositórios, controllers, componentes, hooks, etc.);
* a dependência direta da tarefa de teste correspondente (a implementação não deve anteceder o teste).

A skill não deve detalhar linha de código, apenas responsabilidade e comportamento esperado, mantendo o nível de abstração de "tarefa", não de "instrução de edição".

---

# 9. Tarefas de refatoração (REFACTOR)

Quando fizer sentido pela complexidade do comportamento implementado, a skill deve incluir uma tarefa de refatoração após o ciclo RED/GREEN de um determinado componente, indicando:

* o objetivo da refatoração (clareza, remoção de duplicação, alinhamento com padrões do projeto, performance, etc.);
* a exigência de que os testes permaneçam verdes após a refatoração;
* que a refatoração não deve alterar o comportamento externo já validado pelos testes.

Não é obrigatório criar uma tarefa de refatoração isolada para cada ciclo RED/GREEN — pode ser agrupada quando fizer sentido (ex: uma refatoração ao final de um conjunto de tarefas relacionadas a um mesmo componente).

---

# 10. Tarefas de execução de testes e tratamento de falhas

A skill deve incluir tarefas explícitas de execução da suíte de testes, no mínimo:

* após cada ciclo RED/GREEN/REFACTOR relevante (execução do subconjunto de testes afetado);
* ao final da implementação da feature (execução da suíte completa relacionada à feature).

Cada tarefa de execução de testes deve indicar o comportamento esperado em caso de falha:

```text
Se a execução dos testes falhar:
1. Analisar a causa da falha (implementação incorreta, teste mal definido, efeito colateral em outro comportamento).
2. Caso a causa seja a implementação: reexecutar a etapa de implementação (GREEN) corrigindo o código, sem alterar o teste.
3. Caso a causa aparente ser o próprio teste (ex: teste construído incorretamente em relação ao comportamento esperado pela spec/plan): não alterar o teste silenciosamente — evidenciar o problema e, se a divergência envolver a spec ou o plano, parar e perguntar ao usuário.
4. Repetir a execução dos testes até que passem ou até que uma dúvida bloqueante seja identificada.
```

A skill não deve orientar o agente de implementação a "flexibilizar" ou remover um teste apenas para fazê-lo passar.

---

# 11. Tarefas de validação complementares

Quando o `plan.md` ou o `AGENTS.md`/guidelines definirem validações adicionais, a skill deve incluir tarefas específicas para:

* lint/format;
* build;
* verificação de tipos (quando aplicável);
* verificação de acessibilidade (quando aplicável ao frontend, conforme o plano);
* revisão dos critérios de conclusão definidos no `plan.md`.

Não deve inventar validações que não estejam previstas no `plan.md` nem nos padrões do projeto.

---

# 12. Dependências entre tarefas

Cada tarefa no `tasks.md` deve deixar clara sua dependência em relação a tarefas anteriores, seguindo a ordem de implementação definida no `plan.md`.

A skill deve preferir uma numeração sequencial simples, com indicação explícita de dependência quando não for estritamente sequencial (ex: duas tarefas que podem ser feitas em paralelo, mas ambas dependem de uma tarefa anterior).

---

# 13. Fora do escopo

A skill deve respeitar rigorosamente o escopo definido no `plan.md` (que por sua vez respeita o escopo da `spec.md`).

O `tasks.md` não deve adicionar tarefas para funcionalidades que não foram previstas no plano.

Caso uma tarefa adicional seja identificada como necessária para viabilizar a implementação (ex: uma tarefa técnica de preparação não mencionada explicitamente no plano, mas essencial), ela deve:

1. ser marcada como uma tarefa de suporte/preparação, deixando clara sua origem;
2. ou gerar uma dúvida para o usuário, caso amplie o escopo técnico de forma relevante.

---

# Estrutura obrigatória do tasks.md

O arquivo gerado deve seguir uma estrutura semelhante à seguinte:

````markdown
# Tarefas de Implementação — <Nome da Feature>

## 1. Contexto

Resumo breve da feature, referenciando `spec.md` e `plan.md`.

## 2. Referências

- `AGENTS.md`
- `docs/spec/<nome-da-feature>/spec.md`
- `docs/plan/<nome-da-feature>/plan.md`
- Guidelines relevantes

## 3. Convenções Utilizadas

- Convenção de branch
- Convenção de commits (quando aplicável)
- Comando(s) de execução de testes
- Comando(s) de lint/build (quando aplicável)

## 4. Ciclo de Execução

Descrição resumida do ciclo TDD que orienta as tarefas (RED → GREEN → REFACTOR → EXECUÇÃO DE TESTES → REEXECUÇÃO EM CASO DE FALHA).

## 5. Lista de Tarefas

### Tarefa 1 — Criar branch

- **Tipo:** Preparação
- **Descrição:** ...
- **Dependências:** Nenhuma
- **Critério de conclusão:** ...

### Tarefa 2 — [RED] <comportamento>

- **Tipo:** Teste
- **Cenário relacionado (BDD):**

```gherkin
Feature: ...
  Scenario: ...
    Given ...
    When ...
    Then ...
```

- **Camada de teste:** ...
- **Dependências:** Tarefa 1
- **Critério de conclusão:** Teste criado e falhando pelo motivo esperado (comportamento ainda não implementado).

### Tarefa 3 — [GREEN] <componente/comportamento>

- **Tipo:** Implementação
- **Descrição:** Implementação mínima necessária para que o teste da Tarefa 2 passe.
- **Componentes envolvidos:** ...
- **Dependências:** Tarefa 2
- **Critério de conclusão:** Teste da Tarefa 2 passando.

### Tarefa 4 — [REFACTOR] <componente>

- **Tipo:** Refatoração
- **Descrição:** ...
- **Dependências:** Tarefa 3
- **Critério de conclusão:** Testes relacionados continuam passando após a refatoração.

### Tarefa N — Executar suíte de testes

- **Tipo:** Validação
- **Descrição:** Executar `<comando de testes>` para o(s) escopo(s) afetado(s).
- **Em caso de falha:** Reexecutar a implementação correspondente (voltar à tarefa GREEN relacionada), corrigindo o código sem alterar o teste, salvo divergência identificada em relação à spec/plano — nesse caso, parar e perguntar ao usuário.
- **Dependências:** Tarefas anteriores relacionadas
- **Critério de conclusão:** Suíte de testes executada com sucesso.

... (demais tarefas seguindo o mesmo padrão, cobrindo todas as camadas e comportamentos definidos no plan.md)

## 6. Validações Finais

- [ ] Suíte de testes completa da feature executada com sucesso.
- [ ] Lint/build executados com sucesso (quando aplicável).
- [ ] Critérios de conclusão do `plan.md` atendidos.
- [ ] Nenhum teste foi alterado apenas para "passar" sem justificativa registrada.

## 7. Próxima Etapa

Indicar que o próximo estágio do fluxo é a implementação efetiva das tarefas descritas neste arquivo, seguida da validação final da feature.
````

---

# Regras para numeração e granularidade das tarefas

* Cada tarefa deve representar uma unidade de trabalho pequena o suficiente para ser executada e verificada isoladamente (um teste, uma implementação mínima, uma refatoração pontual, uma execução de suite).
* A skill não deve descer ao nível de instrução de edição de código (ex: "adicionar linha X", "importar Y") — isso é responsabilidade do agente de implementação ao executar a tarefa, não da decomposição em si.
* A skill deve preferir agrupar tarefas por comportamento/componente, seguindo a ordem de implementação do `plan.md`, e não misturar arbitrariamente comportamentos não relacionados em uma mesma tarefa.

---

# Rastreabilidade

Sempre que possível, o `tasks.md` deve manter rastreabilidade entre:

```text
Spec
 ↓
Plano
 ↓
Tarefa (RED)
 ↓
Tarefa (GREEN)
 ↓
Tarefa (REFACTOR, quando aplicável)
 ↓
Tarefa (Execução de testes)
```

Exemplo:

```text
SPEC-01 / Cenário: usuário realiza login
  ↓
PLAN: Serviço de autenticação (item 8.1 do plan.md)
  ↓
Tarefa 2 [RED]: Teste do serviço de autenticação
  ↓
Tarefa 3 [GREEN]: Implementação do serviço de autenticação
  ↓
Tarefa 5: Execução da suíte de testes de autenticação
```

Isso permite que a etapa de implementação execute as tarefas com plena rastreabilidade até a spec original.

---

# Consistência com o projeto

A skill deve sempre preferir os padrões existentes no projeto para:

* nomenclatura de branches e commits;
* comandos de teste, lint e build;
* estrutura de diretórios de testes;
* padrão de nomenclatura de arquivos de teste;
* ferramentas de BDD já adotadas (Cucumber, Behave, etc.), quando existirem.

Não introduzir um novo padrão simplesmente porque ele é considerado uma boa prática genérica, quando o projeto já possui um padrão definido no `AGENTS.md` ou nas guidelines.

---

# Decisões técnicas

Quando uma decisão técnica já estiver definida no `plan.md`, no `AGENTS.md` ou nas guidelines, ela deve ser utilizada diretamente na decomposição das tarefas.

Quando a decisão não estiver definida e houver uma única forma claramente compatível com o que já foi definido no `plan.md`, a skill pode defini-la ao decompor a tarefa.

Quando houver múltiplas alternativas razoáveis com impacto relevante na execução (ex: ordem de implementação ambígua, estratégia de teste não definida para um comportamento crítico), a skill deve parar e perguntar ao usuário.

---

# Tratamento de dúvidas

A skill deve interromper a execução sempre que encontrar uma dúvida relevante.

Formato recomendado:

```text
Encontrei uma decisão que precisa ser definida antes de continuar a criação das tarefas.

Contexto:
<explicação>

Opções:
1. <opção>
2. <opção>

Impacto:
<explicação>

Qual opção devemos seguir?
```

A pergunta deve ser objetiva e fornecer contexto suficiente para que o usuário consiga decidir.

Após a resposta do usuário, a criação das tarefas deve continuar.

---

# Validação das tarefas

Antes de escrever o `tasks.md`, a skill deve verificar:

* [ ] O `plan.md` foi lido integralmente.
* [ ] O `AGENTS.md` relevante foi considerado.
* [ ] Guidelines relevantes foram consideradas.
* [ ] Não existem dúvidas bloqueantes.
* [ ] O escopo do `plan.md` foi respeitado.
* [ ] Existe uma tarefa de criação de branch.
* [ ] Cada comportamento relevante do plano possui tarefas RED e GREEN correspondentes.
* [ ] Tarefas de refatoração foram incluídas quando fazem sentido.
* [ ] Existem tarefas explícitas de execução de testes, com tratamento de falha definido.
* [ ] As dependências entre tarefas estão claras.
* [ ] Gherkin foi utilizado nos comportamentos em que agrega clareza.
* [ ] O arquivo não contém código de implementação, apenas descrição de tarefas.
* [ ] O conteúdo está em PT-BR.

Somente após essa validação o arquivo deve ser criado.

---

# Criação do arquivo

O arquivo deve ser criado em:

```text
docs/tasks/<nome-da-feature>/tasks.md
```

Caso o diretório não exista, ele deve ser criado.

Se já existir um `tasks.md` para a mesma feature, a skill deve verificar se está sendo solicitado:

* criar uma nova lista de tarefas;
* atualizar a lista existente;
* ou substituir a lista existente.

Não sobrescrever silenciosamente um `tasks.md` existente quando houver risco de perda de trabalho (ex: tarefas já marcadas como concluídas).

---

# Resultado esperado

Ao finalizar, o projeto deverá possuir:

```text
docs/
└── tasks/
    └── <nome-da-feature>/
        └── tasks.md
```

O `tasks.md` deve representar a decomposição operacional necessária para transformar o `plan.md` em código implementado e testado, seguindo o ciclo RED → GREEN → REFACTOR, com reexecução da implementação sempre que um teste falhar.

Ele será utilizado como input pela próxima etapa:

```text
tasks.md
   ↓
implementation
   ↓
validation
```

---

# Regra final

Esta skill deve sempre seguir o princípio:

> **Não decomponha o que não está definido no plano, não invente decisões que precisam do usuário, não implemente durante esta etapa e nunca oriente a alterar um teste apenas para fazê-lo passar.**

O objetivo desta etapa é transformar:

```text
COMO será construído
```

definido pelo `plan.md`, em:

```text
QUAIS TAREFAS, em qual ordem, e com qual critério de verificação (testes)
```

para que a próxima etapa do fluxo SDD — a implementação — seja executada de forma guiada por testes (TDD), com rastreabilidade completa até a `spec.md` original.
