---
name: sdd-implementation
description: Executa as tarefas descritas em um tasks.md previamente criado, implementando o código de fato seguindo o ciclo TDD (RED → GREEN → REFACTOR), executando os testes e reexecutando a implementação em caso de falha, como a quinta etapa de um fluxo de Spec Driven Development (AGENTS.md → spec.md → plan.md → tasks.md → implementation.md → validation). Use esta skill sempre que o usuário pedir para implementar, codificar, executar ou "rodar" as tarefas de um tasks.md, mencionar "implementation.md", "implementação", "codar as tasks", referenciar a etapa de implementação do fluxo SDD, ou pedir a próxima etapa depois de um tasks.md pronto. Diferente das skills anteriores do fluxo SDD (spec, plan, tasks), esta skill EFETIVAMENTE escreve e altera código no projeto. Não use esta skill para escrever a spec, o plano técnico, ou a lista de tarefas — essas são etapas anteriores do fluxo SDD.
---

# SDD — Implementation Skill

## Objetivo

Esta skill é responsável por **executar** as tarefas descritas em um `tasks.md` previamente criado, implementando o código real do projeto seguindo o ciclo TDD (RED → GREEN → REFACTOR), executando os testes definidos e reexecutando a implementação sempre que um teste falhar.

Ela representa a quinta etapa do fluxo de Spec Driven Development:

```text
AGENTS.md
   ↓
spec.md
   ↓
plan.md
   ↓
tasks.md
   ↓
implementation.md   ← esta skill
   ↓
validation
```

Ao final da execução, a skill deve registrar tudo o que foi feito no arquivo `implementation.md`, servindo como relatório rastreável da implementação realizada.

Diferente das skills anteriores do fluxo (`spec`, `plan`, `tasks`), **esta skill implementa código de verdade** — cria/edita arquivos-fonte, arquivos de teste, executa comandos de teste, lint e build no projeto.

---

# Input

O input obrigatório desta skill é um arquivo:

```text
tasks.md
```

Localizado em:

```text
docs/tasks/<nome-da-feature>/tasks.md
```

A skill deve identificar automaticamente o `tasks.md` mais relevante quando possível.

Caso não seja possível identificar um `tasks.md` válido, a execução deve ser interrompida e o usuário deve ser questionado sobre qual lista de tarefas deve ser utilizada.

---

# Output

O output obrigatório é:

```text
docs/implementation/<nome-da-feature>/implementation.md
```

A pasta `docs` fica na raiz do projeto.

> **Observação sobre nomenclatura:** o caminho correto do diretório é `docs/implementation/` (com "n"), consistente com o nome do arquivo `implementation.md` e com as demais pastas do fluxo (`spec`, `plan`, `tasks`). Caso o projeto já possua uma pasta `docs/implementatio/` (sem o "n") por convenção prévia, a skill deve perguntar ao usuário qual grafia deve ser utilizada antes de criar o diretório, em vez de assumir silenciosamente.

O `<nome-da-feature>` deve ser o mesmo identificador utilizado nas etapas anteriores, garantindo rastreabilidade entre as pastas:

```text
docs/spec/<nome-da-feature>/spec.md
docs/plan/<nome-da-feature>/plan.md
docs/tasks/<nome-da-feature>/tasks.md
docs/implementation/<nome-da-feature>/implementation.md
```

---

# Princípios

A implementação deve seguir os seguintes princípios:

1. **O `tasks.md` é a fonte operacional da verdade sobre o que deve ser feito e em qual ordem.**
2. **`plan.md` e `spec.md` são consultados para esclarecer contexto quando o `tasks.md` referenciar algo não autoexplicativo.**
3. **AGENTS.md é a fonte de contexto e regras do projeto.**
4. **Guidelines do projeto devem ser respeitadas.**
5. **TDD é o ciclo obrigatório: RED → GREEN → REFACTOR.**
6. **Nenhum teste deve ser alterado apenas para "passar" — falha de teste implica reexecução/correção da implementação.**
7. **Toda tarefa do `tasks.md` deve ser executada na ordem e respeitando as dependências indicadas.**
8. **Decisões não especificadas em `tasks.md`/`plan.md`/`spec.md` não devem ser inventadas quando tiverem impacto relevante.**
9. **Dúvidas relevantes devem interromper a execução.**
10. **O `implementation.md` deve ser escrito integralmente em PT-BR.**
11. **Não alterar `spec.md`, `plan.md` ou `tasks.md` durante esta etapa**, exceto para marcar o progresso das tarefas (checkboxes), quando o `tasks.md` utilizar esse formato.
12. **Cada alteração de código deve estar rastreável a uma tarefa específica do `tasks.md`.**

---

# Ordem de leitura do contexto

Antes de iniciar a implementação, a skill deve analisar o contexto do projeto na seguinte ordem:

```text
1. AGENTS.md
2. Guidelines do projeto
3. tasks.md
4. plan.md (para esclarecer estratégia técnica quando necessário)
5. spec.md (para esclarecer comportamento/critérios de aceitação quando necessário)
```

---

# 1. Localizar AGENTS.md

A skill deve procurar pelo `AGENTS.md` relevante para a feature, considerando possíveis arquivos em diretórios superiores ou específicos da área do projeto, respeitando a hierarquia quando houver múltiplos.

A skill deve identificar, em especial para a implementação:

* comandos de execução de testes (unitários, integração, E2E, etc.);
* comandos de lint/format/build;
* padrões de código e nomenclatura;
* estrutura de diretórios de código-fonte e de testes;
* framework(s) de teste utilizados;
* convenções de commits;
* restrições técnicas (ex: versões de linguagem/framework, bibliotecas proibidas);
* padrões de tratamento de erros, logging e observabilidade já adotados;
* qualquer outra instrução necessária para implementar a feature de forma consistente com o projeto.

A skill **não deve contradizer o `AGENTS.md`**. Em caso de conflito entre a implementação inicialmente imaginada e uma regra explícita do `AGENTS.md`, a regra do `AGENTS.md` deve prevalecer.

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

A skill deve considerar somente as guidelines relevantes para a implementação da feature (padrões de código, padrões de teste, padrões de revisão).

Caso não existam guidelines adicionais, a execução deve continuar normalmente.

---

# 3. Ler o tasks.md

A skill deve ler integralmente o `tasks.md` e identificar:

* a tarefa de criação de branch e suas convenções;
* cada tarefa RED (teste), GREEN (implementação) e REFACTOR, na ordem definida;
* as dependências entre tarefas;
* os critérios de conclusão de cada tarefa;
* as tarefas de execução de testes e o comportamento esperado em caso de falha;
* as validações finais exigidas.

Caso alguma tarefa esteja descrita de forma ambígua ou incompleta a ponto de impedir sua execução com segurança, a skill deve seguir para a etapa de verificação de ambiguidades antes de implementar essa tarefa.

---

# 4. Verificação de ambiguidades

Antes de implementar, a skill deve verificar se existe informação insuficiente para executar uma tarefa com segurança.

Exemplos de dúvidas relevantes:

* Uma tarefa referencia um componente cuja localização exata no código não está clara e não há um padrão óbvio no projeto?
* Um critério de conclusão de tarefa é ambíguo (ex: "implementar validação" sem detalhar a regra)?
* Um teste falha repetidamente e a causa raiz não está clara (pode ser bug na implementação, mas também pode indicar um problema na própria tarefa/plano/spec)?
* Existe conflito entre o que o `tasks.md` pede e o que o código existente no projeto já faz?
* Uma dependência externa mencionada na tarefa não está disponível/configurada no ambiente?
* Uma tarefa exige uma decisão de design não coberta pelo `plan.md` nem pelo `AGENTS.md`?

## Regra obrigatória

Se existir uma dúvida que possa alterar significativamente:

* o comportamento implementado;
* a arquitetura da solução;
* o resultado de um teste;
* o escopo da tarefa;
* dados existentes ou contratos já publicados;

a skill deve **parar imediatamente a implementação da tarefa em questão e perguntar ao usuário**.

Não deve escolher arbitrariamente uma alternativa quando o impacto for relevante.

Não deve "forçar" um teste a passar alterando sua asserção apenas para avançar.

Tarefas já concluídas antes da dúvida surgir podem ser mantidas; a skill não precisa desfazer trabalho válido já registrado, apenas pausar antes da tarefa problemática.

Depois que o usuário responder, a implementação pode continuar utilizando a nova informação.

---

# 5. Execução do ciclo TDD por tarefa

Para cada conjunto de tarefas RED/GREEN/REFACTOR do `tasks.md`, a skill deve seguir:

```text
1. RED
   - Criar ou atualizar o teste descrito na tarefa.
   - Executar o teste e confirmar que ele falha pelo motivo esperado
     (comportamento ainda não implementado — não por erro de sintaxe ou configuração).

2. GREEN
   - Implementar o código mínimo necessário para que o teste passe,
     conforme a responsabilidade descrita na tarefa e no plan.md.
   - Executar o teste novamente.

3. REFACTOR (quando a tarefa existir ou fizer sentido)
   - Refatorar mantendo o comportamento externo validado pelos testes.
   - Executar os testes novamente para confirmar que continuam passando.

4. EXECUÇÃO DE TESTES
   - Executar a suíte de testes indicada na tarefa (ou o escopo mínimo relevante).

5. TRATAMENTO DE FALHA
   - Se algum teste falhar:
     a. Analisar a causa raiz (implementação incorreta, efeito colateral em outro
        comportamento, ambiente, ou problema no próprio teste/tarefa).
     b. Se a causa for a implementação: corrigir o código e repetir o passo 4.
     c. Se a causa aparentar ser o teste, a tarefa ou o plano: NÃO alterar o teste
        silenciosamente — registrar o problema e, se a divergência for relevante,
        parar e perguntar ao usuário conforme a seção 4.
     d. Repetir até os testes passarem ou até uma dúvida bloqueante ser identificada.
```

Este ciclo deve ser aplicado tarefa a tarefa, respeitando a ordem e as dependências definidas no `tasks.md`.

---

# 6. Criação da branch

A primeira ação de execução deve ser a criação da branch definida na tarefa correspondente do `tasks.md`, seguindo a convenção indicada nela (ou no `AGENTS.md`/guidelines).

Caso a tarefa de criação de branch não especifique a branch base ou o comando exato, e isso não estiver definido no `AGENTS.md`/guidelines, a skill deve perguntar ao usuário antes de prosseguir, **exceto** se houver um padrão inequívoco já em uso no repositório (ex: única branch principal existente).

---

# 7. Execução das demais tarefas

A skill deve executar as tarefas subsequentes do `tasks.md` na ordem definida, respeitando suas dependências, e, para cada uma:

* implementar exatamente o que a tarefa descreve, sem expandir escopo;
* utilizar os padrões de código, nomenclatura e arquitetura já existentes no projeto (ou definidos no `AGENTS.md`/guidelines/`plan.md`);
* não introduzir bibliotecas, frameworks ou padrões novos que não estejam previstos no `plan.md` ou no `AGENTS.md`, salvo necessidade técnica inevitável — nesse caso, tratar como dúvida bloqueante (seção 4);
* marcar a tarefa como concluída no `tasks.md`, quando este utilizar checkboxes, mantendo o restante do arquivo intacto;
* registrar o resultado da tarefa (arquivos criados/alterados, testes executados, resultado) para uso posterior na geração do `implementation.md`.

---

# 8. Validações finais

Após concluir todas as tarefas, a skill deve executar as validações finais indicadas no `tasks.md` (e, por extensão, no `plan.md`/`AGENTS.md`), tipicamente:

* suíte de testes completa da feature;
* lint/format;
* build;
* verificação de tipos, quando aplicável;
* revisão dos critérios de conclusão definidos no `plan.md`/`tasks.md`.

Caso alguma validação final falhe, a skill deve aplicar o mesmo tratamento de falha da seção 5 (corrigir a implementação, não os testes, e parar para perguntar em caso de dúvida real).

---

# 9. Fora do escopo

A skill deve respeitar rigorosamente o escopo definido no `tasks.md` (que por sua vez respeita `plan.md` e `spec.md`).

A implementação não deve adicionar funcionalidades, refatorações amplas ou melhorias não solicitadas que não estejam previstas nas tarefas.

Caso uma necessidade técnica adicional seja identificada como indispensável para concluir uma tarefa (ex: um ajuste pontual não previsto, mas necessário para o teste passar corretamente), ela deve:

1. ser tratada como parte da tarefa em execução, sendo registrada no `implementation.md` com justificativa;
2. ou, se ampliar significativamente o escopo, gerar uma dúvida para o usuário antes de prosseguir.

---

# Estrutura obrigatória do implementation.md

O arquivo gerado deve seguir uma estrutura semelhante à seguinte:

````markdown
# Relatório de Implementação — <Nome da Feature>

## 1. Contexto

Resumo breve da feature, referenciando `spec.md`, `plan.md` e `tasks.md`.

## 2. Referências

- `AGENTS.md`
- `docs/spec/<nome-da-feature>/spec.md`
- `docs/plan/<nome-da-feature>/plan.md`
- `docs/tasks/<nome-da-feature>/tasks.md`
- Guidelines relevantes

## 3. Branch Utilizada

- **Nome da branch:** `<nome-da-branch>`
- **Branch base:** `<branch-base>`

## 4. Resumo da Execução

Visão geral do que foi implementado, em alto nível, e o status final (concluído / concluído com ressalvas / bloqueado aguardando decisão do usuário).

## 5. Tarefas Executadas

Para cada tarefa do `tasks.md`, na mesma ordem:

### Tarefa N — <título da tarefa>

- **Tipo:** RED / GREEN / REFACTOR / Validação / Preparação
- **Status:** Concluída / Concluída com ressalvas / Bloqueada
- **Arquivos criados:** ...
- **Arquivos alterados:** ...
- **Testes envolvidos:** ...
- **Resultado da execução dos testes:** Passou / Falhou (e quantas tentativas foram necessárias)
- **Observações:** decisões tomadas, ajustes realizados, particularidades relevantes.

## 6. Ciclos de Falha e Reexecução

Registrar, quando houver, os casos em que um teste falhou e a implementação precisou ser reexecutada:

```text
Tarefa: <N>
Tentativa 1: falhou — causa: <descrição>
Ação: <correção realizada>
Tentativa 2: passou
```

## 7. Dúvidas Levantadas Durante a Implementação

Registrar perguntas feitas ao usuário durante a execução e as respectivas decisões tomadas, quando houver.

## 8. Validações Finais

- [ ] Suíte de testes completa da feature executada com sucesso.
- [ ] Lint/format executados com sucesso (quando aplicável).
- [ ] Build executado com sucesso (quando aplicável).
- [ ] Critérios de conclusão do `plan.md` atendidos.
- [ ] Nenhum teste foi alterado apenas para "passar" sem justificativa registrada.

## 9. Itens Pendentes ou Bloqueados

Listar tarefas não concluídas, motivo do bloqueio e o que é necessário para desbloquear (ex: decisão do usuário ainda pendente).

## 10. Próxima Etapa

Indicar que o próximo estágio do fluxo é a validação final da feature (revisão, PR, QA, etc.), utilizando este arquivo como registro do que foi implementado.
````

---

# Regras para o registro no implementation.md

* O relatório deve refletir a execução **real**, não um resumo idealizado — falhas, reexecuções e decisões tomadas devem ser registradas, não omitidas.
* Não deve reproduzir o código-fonte completo dentro do `implementation.md` — referenciar caminhos de arquivos e descrever o que foi feito é suficiente.
* Deve manter rastreabilidade explícita com o número/título da tarefa correspondente do `tasks.md`.
* Deve ser objetivo: descrições curtas e diretas por tarefa, evitando repetir o conteúdo do `tasks.md`.

---

# Rastreabilidade

Sempre que possível, o `implementation.md` deve manter rastreabilidade completa entre:

```text
Spec
 ↓
Plano
 ↓
Tarefa (tasks.md)
 ↓
Execução (implementation.md)
 ↓
Testes executados
```

Exemplo:

```text
SPEC-01 / Cenário: usuário realiza login
  ↓
PLAN: Serviço de autenticação (item 8.1 do plan.md)
  ↓
TASKS: Tarefa 2 [RED] e Tarefa 3 [GREEN]
  ↓
IMPLEMENTATION: Tarefa 2 e 3 concluídas — testes passando na primeira tentativa
```

---

# Consistência com o projeto

A skill deve sempre preferir os padrões existentes no projeto para:

* estrutura de código e testes;
* nomenclatura de arquivos, classes, funções e variáveis;
* tratamento de erros e logging;
* forma de executar comandos de teste/lint/build;
* padrão de commits, quando a skill também for responsável por commitar (somente se isso estiver definido no `AGENTS.md`/guidelines/`tasks.md`; caso contrário, apenas deixar as alterações prontas para revisão, salvo instrução explícita do usuário).

Não introduzir um novo padrão simplesmente porque ele é considerado uma boa prática genérica, quando o projeto já possui um padrão definido.

---

# Tratamento de dúvidas

A skill deve interromper a execução sempre que encontrar uma dúvida relevante.

Formato recomendado:

```text
Encontrei uma decisão que precisa ser definida antes de continuar a implementação.

Tarefa relacionada:
<número/título da tarefa no tasks.md>

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

Após a resposta do usuário, a implementação deve continuar a partir do ponto em que parou, e a decisão deve ser registrada na seção 7 do `implementation.md`.

---

# Validação antes de escrever o implementation.md

Antes de escrever o `implementation.md`, a skill deve verificar:

* [ ] O `tasks.md` foi lido e executado integralmente (ou até o ponto de bloqueio, se houver).
* [ ] O `AGENTS.md` relevante foi considerado.
* [ ] Guidelines relevantes foram consideradas.
* [ ] A branch foi criada conforme definido.
* [ ] Cada tarefa RED possui teste correspondente criado e validado (falhou antes da implementação).
* [ ] Cada tarefa GREEN possui implementação correspondente e teste passando.
* [ ] Refatorações previstas foram realizadas sem quebrar testes.
* [ ] Falhas de teste, quando ocorreram, foram tratadas por correção da implementação (não do teste), com exceção de casos explicitamente esclarecidos com o usuário.
* [ ] Dúvidas bloqueantes foram levantadas ao usuário quando necessário.
* [ ] As validações finais (testes completos, lint, build) foram executadas.
* [ ] O conteúdo do `implementation.md` está em PT-BR.

Somente após essa validação o arquivo deve ser criado.

---

# Criação do arquivo

O arquivo deve ser criado em:

```text
docs/implementation/<nome-da-feature>/implementation.md
```

Caso o diretório não exista, ele deve ser criado.

Se já existir um `implementation.md` para a mesma feature, a skill deve verificar se está sendo solicitado:

* uma nova execução completa;
* a continuação de uma execução anterior (ex: retomando de um ponto bloqueado);
* ou a substituição do relatório existente.

Não sobrescrever silenciosamente um `implementation.md` existente quando houver risco de perda de histórico de execução relevante.

---

# Resultado esperado

Ao finalizar, o projeto deverá possuir:

```text
docs/
└── implementation/
    └── <nome-da-feature>/
        └── implementation.md
```

além do código-fonte e dos testes efetivamente implementados na branch criada para a feature.

O `implementation.md` deve representar um relatório fiel e rastreável de como o `tasks.md` foi executado, incluindo falhas, reexecuções e decisões tomadas.

Ele será utilizado como input pela próxima etapa:

```text
implementation.md
   ↓
validation
```

---

# Regra final

Esta skill deve sempre seguir o princípio:

> **Implemente exatamente o que o `tasks.md` descreve, na ordem definida, seguindo RED → GREEN → REFACTOR; nunca altere um teste apenas para fazê-lo passar; e, diante de qualquer decisão relevante não coberta pelas etapas anteriores, pare e pergunte ao usuário em vez de assumir.**

O objetivo desta etapa é transformar:

```text
QUAIS TAREFAS devem ser feitas
```

definido pelo `tasks.md`, em:

```text
CÓDIGO IMPLEMENTADO, TESTADO E DOCUMENTADO
```

registrado de forma rastreável no `implementation.md`, preparando o terreno para a etapa final de validação do fluxo SDD.
