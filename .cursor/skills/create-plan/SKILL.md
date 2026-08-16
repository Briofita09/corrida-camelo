---
name: sdd-planning
description: Transforms a previously created spec.md into a technical implementation plan (plan.md), as the third stage of a Spec Driven Development (SDD) flow (AGENTS.md → spec.md → plan.md → tasks → implementation → validation). Use this skill whenever the user asks to create, generate, or update an implementation plan from a spec, mentions "plan.md", "planejamento", "plano de implementação", references the SDD flow, or asks how a feature described in a spec.md should be built (architecture, BDD/TDD strategy, impacted areas, implementation order, risks) without yet writing code or breaking things into granular tasks. Also trigger when the user references a spec located under a path like spec/.../spec.md or docs/spec/.../spec.md and wants the next step of the workflow. Do NOT use this skill for writing the spec itself, breaking the plan into tasks, or implementing code — those are separate stages of the SDD flow.
---

# SDD — Planning Skill

## Objetivo

Esta skill é responsável por transformar uma `spec.md` previamente criada em um **plano técnico de implementação**.

Ela representa a terceira etapa do fluxo de Spec Driven Development:

```text
AGENTS.md
   ↓
spec.md
   ↓
plan.md        ← esta skill
   ↓
tasks
   ↓
implementation
   ↓
validation
```

O objetivo do `plan.md` é definir **como a feature será implementada**, quais decisões técnicas serão necessárias, quais partes do sistema serão afetadas, como BDD e TDD serão aplicados e qual será a ordem lógica de execução.

O plano **não deve implementar código** e **não deve detalhar cada tarefa em nível operacional excessivo**. Esse detalhamento pertence à etapa posterior de `tasks`.

---

# Input

O input obrigatório desta skill é um arquivo:

```text
spec.md
```

A `spec.md` deve representar a especificação da feature que será implementada.

A skill deve identificar automaticamente a localização da `spec.md` quando possível.

Exemplo:

```text
docs/spec/login/spec-01-login/spec.md
```

ou:

```text
spec/login/spec-01-login/spec.md
```

Caso não seja possível identificar uma `spec.md` válida, a execução deve ser interrompida e o usuário deve ser questionado.

---

# Output

O output obrigatório é:

```text
docs/plan/<nome-da-feature>/plan.md
```

O `<nome-da-feature>` deve ser derivado da feature descrita na `spec.md`.

Exemplo:

```text
docs/spec/login/spec.md
```

deve gerar:

```text
docs/plan/login/plan.md
```

Caso a `spec.md` utilize um identificador explícito para a feature, esse identificador deve ser respeitado.

---

# Princípios

A elaboração do plano deve seguir os seguintes princípios:

1. **Spec é a fonte funcional da verdade.**
2. **AGENTS.md é a fonte de contexto e regras do projeto.**
3. **Guidelines do projeto devem ser respeitadas.**
4. **BDD define o comportamento esperado da feature.**
5. **TDD define a estratégia de desenvolvimento orientada por testes.**
6. **O plano deve ser implementável por outro agente sem depender de conhecimento implícito.**
7. **Decisões não especificadas não devem ser inventadas.**
8. **Dúvidas relevantes devem interromper a execução.**
9. **O plano deve preparar as tarefas da próxima etapa do fluxo.**
10. **O plano deve ser escrito integralmente em PT-BR.**
11. **Não implementar código durante esta etapa.**
12. **Não alterar a `spec.md` durante esta etapa.**

---

# Ordem de leitura do contexto

Antes de elaborar o plano, a skill deve analisar o contexto do projeto na seguinte ordem:

```text
1. AGENTS.md
2. Guidelines do projeto
3. spec.md
```

A `spec.md` continua sendo a fonte de verdade sobre **o que deve ser construído**, enquanto `AGENTS.md` e as guidelines definem **como o projeto deve ser trabalhado**.

---

# 1. Localizar AGENTS.md

A skill deve procurar pelo `AGENTS.md` relevante para a feature.

Deve considerar:

```text
AGENTS.md
```

e possíveis arquivos em diretórios superiores ou específicos da área do projeto.

Quando existirem múltiplos `AGENTS.md`, devem ser considerados os arquivos aplicáveis ao diretório da feature, respeitando a hierarquia de diretórios do projeto.

A skill deve identificar:

* arquitetura;
* stack;
* padrões de código;
* convenções de nomenclatura;
* estrutura de diretórios;
* padrões de testes;
* comandos disponíveis;
* restrições técnicas;
* regras específicas de implementação;
* decisões arquiteturais já estabelecidas;
* padrões de documentação;
* convenções de commits ou branches, quando relevantes;
* quaisquer outras instruções necessárias para planejar a feature.

A skill **não deve contradizer o `AGENTS.md`**.

Caso exista conflito entre o plano inicialmente imaginado e uma regra explícita do `AGENTS.md`, a regra do `AGENTS.md` deve prevalecer.

---

# 2. Localizar Guidelines

A skill deve procurar guidelines ou documentação de desenvolvimento relevantes ao projeto.

Exemplos:

```text
docs/guidelines/
docs/guides/
docs/architecture/
docs/standards/
CONTRIBUTING.md
DEVELOPMENT.md
README.md
```

Também podem existir guidelines específicas dentro do diretório da feature ou de seus módulos.

A skill deve considerar somente as guidelines relevantes para o planejamento da feature.

Não é necessário incorporar documentação não relacionada à feature.

Caso não existam guidelines adicionais, a execução deve continuar normalmente.

---

# 3. Ler a spec.md

A skill deve ler integralmente a `spec.md`.

Deve identificar:

* objetivo da feature;
* problema que está sendo resolvido;
* contexto;
* escopo;
* fora de escopo;
* requisitos funcionais;
* requisitos não funcionais;
* regras de negócio;
* critérios de aceitação;
* cenários BDD;
* dependências;
* restrições;
* integrações;
* comportamento esperado;
* informações explicitamente não definidas.

A skill não deve assumir que algo está definido apenas porque seria uma solução tecnicamente comum.

---

# 4. Verificação de ambiguidades

Antes de gerar o plano, a skill deve verificar se existe informação insuficiente para definir uma estratégia de implementação segura.

Exemplos de dúvidas relevantes:

* Qual comportamento deve acontecer em determinado cenário?
* Qual fonte de dados deve ser utilizada?
* Qual módulo deve ser responsável pela lógica?
* Qual comportamento deve ocorrer em caso de erro?
* Existe uma regra de negócio conflitante?
* Há mais de uma arquitetura possível e a escolha impacta significativamente o projeto?
* A spec depende de uma decisão que não foi definida?
* Uma alteração pode quebrar comportamento existente?
* Existe uma dependência externa cuja utilização não foi especificada?
* A estratégia de persistência não está definida?
* O contrato de uma API não está definido?
* Existe ambiguidade nos critérios de aceitação?

## Regra obrigatória

Se existir uma dúvida que possa alterar significativamente:

* a arquitetura;
* o comportamento;
* os requisitos;
* os testes;
* a ordem de implementação;
* o escopo;
* ou a solução técnica;

a skill deve **parar imediatamente o planejamento e perguntar ao usuário**.

Não deve escolher arbitrariamente uma alternativa.

Não deve continuar produzindo o `plan.md` parcialmente.

Depois que o usuário responder, a skill pode continuar o planejamento utilizando a nova informação.

---

# 5. Análise de impacto

Antes de definir a estratégia, a skill deve analisar o impacto da feature no projeto.

Deve identificar, quando aplicável:

```text
Frontend
Backend
API
Banco de dados
Domínio
Serviços
Componentes
Hooks
Estado
Autenticação
Autorização
Integrações externas
Filas
Cache
Observabilidade
Logs
Testes
Documentação
Configuração
Infraestrutura
```

A análise deve indicar quais áreas realmente serão afetadas.

Não deve listar componentes apenas por possibilidade.

---

# 6. Definição da estratégia de implementação

O `plan.md` deve definir uma estratégia de implementação de alto nível.

A estratégia deve responder:

* Qual será a abordagem utilizada?
* Quais partes do sistema serão alteradas?
* Quais novos componentes serão necessários?
* Quais componentes existentes serão reutilizados?
* Quais componentes precisam ser modificados?
* Qual será a ordem lógica das mudanças?
* Quais dependências existem entre as mudanças?
* Quais riscos técnicos existem?
* Como a feature será testada?
* Como a implementação será validada?

O plano deve privilegiar:

* reutilização de código existente;
* baixo acoplamento;
* consistência com a arquitetura existente;
* menor alteração possível no comportamento existente;
* separação clara de responsabilidades;
* soluções alinhadas aos padrões já existentes no projeto.

---

# 7. BDD como princípio de comportamento

BDD deve ser utilizado para garantir que o plano esteja orientado ao comportamento esperado pelo usuário e pelo negócio.

A skill deve utilizar os cenários da `spec.md` como referência.

Quando necessário, deve organizar o plano em torno de comportamentos:

```gherkin
Feature
  Scenario
    Given
    When
    Then
```

O planejamento deve garantir que cada comportamento relevante da spec tenha uma estratégia de implementação e validação.

Não é necessário duplicar integralmente todos os cenários Gherkin no `plan.md` quando eles já estiverem suficientemente descritos na `spec.md`.

Em vez disso, o plano pode referenciá-los.

Exemplo:

```text
Os cenários de autenticação definidos na spec devem ser cobertos pelos testes
de comportamento da camada de aplicação.
```

---

# 8. TDD como princípio de desenvolvimento

O planejamento deve definir uma estratégia de TDD.

A skill deve considerar o ciclo:

```text
RED
 ↓
GREEN
 ↓
REFACTOR
```

Para cada parte relevante da implementação, o plano deve indicar:

1. quais comportamentos devem ser testados;
2. qual camada deve possuir o teste;
3. quais testes devem ser criados ou modificados;
4. quais casos de erro devem ser cobertos;
5. quais casos de borda devem ser considerados;
6. como os testes serão utilizados para orientar a implementação.

A skill deve preferir testes próximos ao comportamento que está sendo implementado.

Exemplo:

```text
Regra de negócio
    ↓
Teste unitário
    ↓
Implementação
    ↓
Refatoração

Fluxo de aplicação
    ↓
Teste de integração
    ↓
Implementação
    ↓
Refatoração

Comportamento do usuário
    ↓
Teste BDD/E2E, quando aplicável
```

---

# 9. Estratégia de testes

O plano deve definir quais tipos de testes serão necessários.

Dependendo do projeto e da feature, considerar:

* testes unitários;
* testes de integração;
* testes de contrato;
* testes de API;
* testes de componentes;
* testes E2E;
* testes BDD;
* testes de regressão.

A skill não deve exigir testes que não façam sentido para a arquitetura do projeto.

Deve seguir os padrões existentes definidos no `AGENTS.md` e nas guidelines.

---

# 10. Estratégia de banco de dados

Caso a feature envolva persistência, o plano deve identificar:

* alterações de schema;
* novas tabelas;
* alterações de tabelas;
* relacionamentos;
* índices;
* constraints;
* migrations;
* seeders, quando necessários;
* impacto nos dados existentes;
* compatibilidade com dados legados.

A skill não deve criar SQL ou código de migration nesta etapa.

Deve apenas definir a estratégia que será executada posteriormente.

---

# 11. Estratégia de API

Caso a feature envolva APIs, o plano deve identificar:

* novos endpoints;
* endpoints existentes que serão alterados;
* métodos HTTP;
* contratos de entrada;
* contratos de saída;
* validações;
* erros;
* autenticação;
* autorização;
* compatibilidade;
* testes necessários.

Não deve implementar os endpoints.

---

# 12. Estratégia de frontend

Caso a feature envolva frontend, o plano deve identificar:

* páginas;
* componentes;
* hooks;
* estado;
* chamadas de API;
* navegação;
* loading states;
* empty states;
* error states;
* validações;
* acessibilidade;
* responsividade;
* testes.

Deve respeitar a arquitetura existente do projeto.

---

# 13. Dependências e ordem de implementação

O plano deve estabelecer uma ordem lógica para a implementação.

Exemplo:

```text
1. Preparar modelo de domínio
2. Criar persistência
3. Implementar regras de negócio
4. Criar API
5. Implementar integração no frontend
6. Criar comportamento E2E
7. Executar validações
```

A ordem deve ser baseada nas dependências reais da feature.

Não deve transformar automaticamente todos os itens em tarefas.

A decomposição detalhada será feita pela skill de `tasks`.

---

# 14. Riscos técnicos

O plano deve registrar riscos relevantes.

Exemplos:

```text
- Alteração de contrato existente
- Migração de dados
- Compatibilidade retroativa
- Dependência externa
- Concorrência
- Performance
- Cache
- Segurança
- Estado inconsistente
```

Para cada risco relevante, indicar a estratégia de mitigação.

Não criar riscos artificiais apenas para preencher a seção.

---

# 15. Fora do escopo

A skill deve respeitar rigorosamente o escopo definido na `spec.md`.

O plano não deve adicionar funcionalidades que não foram solicitadas.

Caso uma necessidade adicional seja identificada e seja necessária para a implementação, ela deve:

1. ser considerada uma dependência;
2. ser explicitada no plano;
3. ou gerar uma dúvida para o usuário caso altere o escopo.

---

# Estrutura obrigatória do plan.md

O arquivo gerado deve seguir uma estrutura semelhante à seguinte:

````markdown
# Plano de Implementação — <Nome da Feature>

## 1. Contexto

Resumo da feature e do problema que será resolvido.

## 2. Referências

- `AGENTS.md`
- `spec.md`
- Guidelines relevantes

## 3. Objetivo da Implementação

Descrever o resultado técnico esperado.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

Listar somente as áreas realmente afetadas.

### 4.2 Componentes existentes

Componentes que serão reutilizados ou modificados.

### 4.3 Novos componentes

Componentes que precisarão ser criados.

## 5. Estratégia de Implementação

Descrever a abordagem técnica escolhida.

## 6. Estratégia BDD

Descrever como os comportamentos definidos na spec serão implementados e validados.

### Cenário 1

Descrição da estratégia.

### Cenário 2

Descrição da estratégia.

## 7. Estratégia TDD

Descrever a abordagem de testes e o ciclo:

```text
RED → GREEN → REFACTOR
````

Indicar os testes que deverão orientar a implementação.

## 8. Alterações Técnicas

### 8.1 Backend

Quando aplicável.

### 8.2 Frontend

Quando aplicável.

### 8.3 Banco de dados

Quando aplicável.

### 8.4 APIs

Quando aplicável.

### 8.5 Integrações

Quando aplicável.

## 9. Ordem de Implementação

Descrever a sequência lógica das etapas de implementação.

## 10. Estratégia de Testes

Descrever testes unitários, integração, BDD, E2E etc.

## 11. Riscos e Mitigações

Listar somente riscos relevantes.

## 12. Dependências

Listar dependências técnicas ou decisões necessárias.

## 13. Critérios para Conclusão

Descrever as condições que devem ser satisfeitas para considerar o plano implementado.

## 14. Próxima Etapa

Indicar que o próximo estágio do fluxo é a decomposição deste plano em tarefas.

A próxima etapa deve utilizar este arquivo como input para criação das tasks.

````

---

# Regras para a seção "Ordem de Implementação"

A ordem deve respeitar dependências técnicas.

Preferir uma sequência semelhante a:

```text
Testes
  ↓
Domínio / regra de negócio
  ↓
Persistência
  ↓
Serviços
  ↓
API
  ↓
Frontend
  ↓
Integração
  ↓
Validação
````

Porém, essa ordem **não é obrigatória**.

A arquitetura existente e as características da feature devem determinar a ordem correta.

O princípio fundamental é:

> Implementar primeiro aquilo que é necessário para habilitar as etapas seguintes.

---

# Regras para a decomposição

O `plan.md` deve ser suficientemente detalhado para que a próxima skill consiga transformar o plano em tarefas.

Entretanto, não deve chegar ao nível de:

```text
- criar arquivo X
- adicionar import Y
- adicionar função Z
- alterar linha 42
```

Esse nível de detalhamento pertence à etapa `tasks`.

O `plan.md` deve trabalhar principalmente com:

```text
componente
responsabilidade
dependência
estratégia
ordem
teste
comportamento
risco
```

---

# Rastreabilidade

Sempre que possível, o plano deve manter rastreabilidade entre:

```text
Spec
 ↓
Comportamento
 ↓
Estratégia
 ↓
Testes
 ↓
Implementação
```

Exemplo:

```text
SPEC-01
  ↓
Cenário: usuário realiza login
  ↓
Serviço de autenticação
  ↓
Teste de comportamento
  ↓
Implementação do serviço
```

Isso permite que a etapa de `tasks` gere tarefas rastreáveis à especificação original.

---

# Consistência com o projeto

A skill deve sempre preferir os padrões existentes no projeto.

Antes de propor uma nova abordagem, verificar se o projeto já possui um padrão para:

* testes;
* services;
* repositories;
* controllers;
* componentes;
* hooks;
* estado;
* validação;
* tratamento de erros;
* APIs;
* persistência;
* logging;
* documentação.

Não introduzir um novo padrão simplesmente porque ele é considerado uma boa prática genérica.

---

# Decisões técnicas

Quando uma decisão técnica já estiver definida no:

```text
AGENTS.md
```

ou nas guidelines, ela deve ser utilizada diretamente.

Quando a decisão não estiver definida e houver uma única solução claramente compatível com a arquitetura existente, a skill pode defini-la.

Quando houver múltiplas alternativas razoáveis e a escolha tiver impacto relevante, a skill deve parar e perguntar ao usuário.

---

# Tratamento de dúvidas

A skill deve interromper a execução sempre que encontrar uma dúvida relevante.

Formato recomendado:

```text
Encontrei uma decisão que precisa ser definida antes de continuar o planejamento.

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

Após a resposta do usuário, o planejamento deve continuar.

---

# Validação do plano

Antes de escrever o `plan.md`, a skill deve verificar:

* [ ] A `spec.md` foi lida integralmente.
* [ ] O `AGENTS.md` relevante foi considerado.
* [ ] Guidelines relevantes foram consideradas.
* [ ] Não existem dúvidas bloqueantes.
* [ ] O escopo da spec foi respeitado.
* [ ] A estratégia de implementação está definida.
* [ ] A estratégia BDD está definida.
* [ ] A estratégia TDD está definida.
* [ ] A estratégia de testes está definida.
* [ ] Dependências foram identificadas.
* [ ] A ordem de implementação está definida.
* [ ] Riscos relevantes foram identificados.
* [ ] O plano é suficiente para gerar tasks.
* [ ] O plano não contém código de implementação.
* [ ] O conteúdo está em PT-BR.

Somente após essa validação o arquivo deve ser criado.

---

# Criação do arquivo

O arquivo deve ser criado em:

```text
docs/plan/<nome-da-feature>/plan.md
```

Caso o diretório não exista, ele deve ser criado.

Se já existir um `plan.md` para a mesma feature, a skill deve verificar se está sendo solicitado:

* criar um novo plano;
* atualizar um plano existente;
* ou substituir o plano existente.

Não sobrescrever silenciosamente um plano existente quando houver risco de perda de trabalho.

---

# Resultado esperado

Ao finalizar, o projeto deverá possuir:

```text
docs/
└── plan/
    └── <nome-da-feature>/
        └── plan.md
```

O `plan.md` deve representar a estratégia técnica necessária para transformar a `spec.md` em uma implementação.

Ele será utilizado como input pela próxima etapa:

```text
plan.md
   ↓
tasks
```

---

# Regra final

Esta skill deve sempre seguir o princípio:

> **Não planeje o que não está especificado, não invente decisões que precisam do usuário e não implemente durante o planejamento.**

O objetivo desta etapa é transformar:

```text
O QUE deve ser construído
```

definido pela `spec.md`, em:

```text
COMO será construído
```

sem ainda definir:

```text
CADA TAREFA operacional
```

que será responsabilidade da próxima etapa do fluxo SDD.
