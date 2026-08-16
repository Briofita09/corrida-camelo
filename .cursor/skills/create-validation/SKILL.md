---
name: sdd-validation
description: Valida uma implementação previamente executada (implementation.md) e gera um artefato de validação (validation.md) com evidências de testes, cobertura de comportamento e conformidade com spec.md e plan.md, como a sexta e última etapa de um fluxo de Spec Driven Development (AGENTS.md → spec.md → plan.md → tasks.md → implementation.md → validation.md). Use esta skill sempre que o usuário pedir para validar, revisar, auditar ou conferir uma implementação, mencionar "validation.md", "validação", "evidências de teste", referenciar a etapa final do fluxo SDD, ou pedir a próxima etapa depois de um implementation.md pronto. Esta skill NÃO reimplementa código nem corrige bugs por conta própria — ela verifica o que já foi implementado, executa/reexecuta os testes existentes para coletar evidências, e reporta o resultado. Não use esta skill para escrever a spec, o plano, as tarefas, ou para implementar código novo — essas são etapas anteriores do fluxo SDD.
---

# SDD — Validation Skill

## Objetivo

Esta skill é responsável por **validar** uma implementação previamente executada, verificando se ela atende ao que foi definido em `spec.md`, `plan.md` e `tasks.md`, coletando evidências de teste e gerando um artefato de validação (`validation.md`).

Ela representa a sexta e última etapa do fluxo de Spec Driven Development:

```text
AGENTS.md
   ↓
spec.md
   ↓
plan.md
   ↓
tasks.md
   ↓
implementation.md
   ↓
validation.md   ← esta skill
```

O `validation.md` deve funcionar como um **artefato de evidência**: um registro objetivo de que a implementação foi verificada, quais testes foram executados, quais evidências foram coletadas, o que está conforme e o que não está.

Esta skill **não deve implementar ou corrigir código por conta própria**. Ela verifica, executa/reexecuta os testes já existentes para coletar evidências atualizadas, e reporta — sem alterar o comportamento do sistema.

---

# Input

O input obrigatório desta skill é um arquivo:

```text
implementation.md
```

Localizado em:

```text
docs/implementation/<nome-da-feature>/implementation.md
```

A skill deve identificar automaticamente o `implementation.md` mais relevante quando possível.

Caso não seja possível identificar um `implementation.md` válido, a execução deve ser interrompida e o usuário deve ser questionado sobre qual implementação deve ser validada.

---

# Output

O output obrigatório é:

```text
docs/validation/<nome-da-feature>/validation.md
```

A pasta `docs` fica na raiz do projeto.

O `<nome-da-feature>` deve ser o mesmo identificador utilizado nas etapas anteriores, garantindo rastreabilidade completa entre as pastas:

```text
docs/spec/<nome-da-feature>/spec.md
docs/plan/<nome-da-feature>/plan.md
docs/tasks/<nome-da-feature>/tasks.md
docs/implementation/<nome-da-feature>/implementation.md
docs/validation/<nome-da-feature>/validation.md
```

---

# Princípios

A validação deve seguir os seguintes princípios:

1. **O `implementation.md` é o ponto de partida, mas a validação deve verificar o código real, não apenas confiar no relatório.**
2. **`spec.md`, `plan.md` e `tasks.md` são a referência de conformidade — a validação verifica aderência a eles, não apenas se "os testes passam".**
3. **AGENTS.md é a fonte de contexto e regras do projeto (comandos de teste, lint, build, cobertura mínima, se definida).**
4. **Guidelines do projeto devem ser respeitadas.**
5. **A validação deve ser objetiva e baseada em evidências reais (saída de execução de testes, lint, build), não em suposições.**
6. **A skill não corrige código nem reescreve testes — apenas reporta o que encontrou.**
7. **Divergências relevantes entre implementação e spec/plano devem ser registradas como não conformidades, não omitidas nem "suavizadas".**
8. **Dúvidas relevantes sobre critérios de validação devem interromper a execução.**
9. **O `validation.md` deve ser escrito integralmente em PT-BR.**
10. **Não alterar `spec.md`, `plan.md`, `tasks.md` ou `implementation.md` durante esta etapa.**
11. **Toda constatação da validação deve estar rastreável a um critério de aceitação da spec, a um item do plano ou a uma tarefa.**

---

# Ordem de leitura do contexto

Antes de validar, a skill deve analisar o contexto do projeto na seguinte ordem:

```text
1. AGENTS.md
2. Guidelines do projeto
3. implementation.md
4. tasks.md
5. plan.md
6. spec.md
```

O `implementation.md` indica o que foi feito; `tasks.md` e `plan.md` indicam o que deveria ter sido feito e como; `spec.md` indica o comportamento e os critérios de aceitação originais — a referência final de conformidade.

---

# 1. Localizar AGENTS.md

A skill deve procurar pelo `AGENTS.md` relevante para a feature, considerando possíveis arquivos em diretórios superiores ou específicos da área do projeto, respeitando a hierarquia quando houver múltiplos.

A skill deve identificar, em especial para a validação:

* comando(s) de execução de testes (unitários, integração, E2E, etc.);
* comando(s) de lint/format/build;
* critérios de cobertura de testes, quando definidos;
* padrões de qualidade de código já adotados no projeto;
* convenções de checklist de PR/revisão, quando existirem;
* qualquer outra instrução necessária para validar a feature de forma consistente com o projeto.

A skill **não deve contradizer o `AGENTS.md`**. Critérios de validação definidos nele devem ser aplicados mesmo que não estejam explícitos no `plan.md`/`tasks.md`.

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

A skill deve considerar somente as guidelines relevantes para a validação (padrões de qualidade, checklist de definição de pronto/"Definition of Done").

Caso não existam guidelines adicionais, a execução deve continuar normalmente.

---

# 3. Ler o implementation.md

A skill deve ler integralmente o `implementation.md` e identificar:

* a branch utilizada;
* as tarefas executadas e seu status (concluída, concluída com ressalvas, bloqueada);
* arquivos criados/alterados por tarefa;
* testes envolvidos e resultado reportado;
* ciclos de falha e reexecução registrados;
* dúvidas levantadas durante a implementação e suas resoluções;
* itens pendentes ou bloqueados.

Itens marcados como pendentes/bloqueados no `implementation.md` devem ser explicitamente refletidos no `validation.md` como não concluídos — a skill não deve considerá-los válidos apenas por estarem documentados.

---

# 4. Ler tasks.md, plan.md e spec.md

A skill deve cruzar o que foi reportado no `implementation.md` com:

* **`tasks.md`**: todas as tarefas foram de fato executadas? Alguma tarefa do plano de tarefas ficou sem correspondência no relatório de implementação?
* **`plan.md`**: a estratégia de implementação, a estratégia BDD, a estratégia TDD e os critérios de conclusão foram respeitados?
* **`spec.md`**: cada requisito funcional, regra de negócio e cenário BDD relevante possui evidência de cobertura (teste correspondente e resultado) na implementação?

A skill deve montar uma matriz de rastreabilidade entre critérios de aceitação/cenários da spec e as evidências encontradas.

---

# 5. Execução de testes para coleta de evidências

A skill deve, sempre que possível e seguro no ambiente disponível, **reexecutar** os comandos de teste indicados no `AGENTS.md`/guidelines/`tasks.md`, para validar que o estado atual do código realmente passa nos testes — não apenas confiar no que o `implementation.md` reportou anteriormente.

Deve coletar evidências como:

* resultado da suíte de testes completa da feature (passou/falhou, quantidade de testes, quantidade de falhas);
* resultado de lint/format, quando aplicável;
* resultado de build, quando aplicável;
* cobertura de testes, quando a ferramenta/projeto fornecer essa métrica;
* saída relevante de erros, quando houver falha.

Caso não seja possível executar os testes no ambiente atual (ex: ausência de acesso ao ambiente de execução do projeto), a skill deve registrar essa limitação explicitamente no `validation.md`, utilizando como evidência secundária o que foi reportado no `implementation.md`, deixando claro que não houve reexecução independente.

## Regra obrigatória em caso de divergência

Se a reexecução dos testes apresentar resultado diferente do reportado no `implementation.md` (ex: um teste que constava como "passou" agora falha), a skill deve:

1. registrar a divergência de forma explícita no `validation.md`;
2. **não corrigir o código nem o teste**;
3. classificar a feature como não validada/pendente nesse ponto;
4. caso a causa não seja óbvia, tratar como dúvida relevante (seção 6).

---

# 6. Verificação de ambiguidades

Antes de finalizar a validação, a skill deve verificar se existe informação insuficiente para emitir um veredito seguro.

Exemplos de dúvidas relevantes:

* Não está claro qual comando deve ser usado para reproduzir os testes no ambiente atual.
* Um critério de aceitação da spec é ambíguo o suficiente para não ser possível afirmar se foi ou não atendido.
* Existe divergência entre o que o `plan.md` definiu como critério de conclusão e o que o `AGENTS.md`/guidelines exigem como "definição de pronto".
* Um teste reexecutado falha e a causa não é evidente a partir do código e das evidências disponíveis.
* Não é possível determinar se uma tarefa marcada como "concluída com ressalvas" no `implementation.md` deve ser tratada como aprovada ou reprovada na validação.

## Regra obrigatória

Se existir uma dúvida que possa alterar significativamente:

* o veredito final da validação (aprovado/reprovado/pendente);
* a interpretação de um critério de aceitação;
* a necessidade de retorno à etapa de implementação;

a skill deve **parar e perguntar ao usuário** antes de emitir o veredito final, em vez de presumir uma resposta.

A skill pode continuar registrando as evidências já coletadas até o ponto da dúvida, mas não deve fechar o `validation.md` com um veredito definitivo sem essa definição.

---

# 7. Critérios de validação

A validação deve considerar, no mínimo:

## 7.1 Conformidade funcional

* Todos os requisitos funcionais e critérios de aceitação da `spec.md` possuem evidência de implementação e teste?
* Os cenários BDD relevantes da `spec.md`/`plan.md` estão cobertos por testes que realmente os representam?

## 7.2 Conformidade técnica

* A estratégia definida no `plan.md` foi seguida (arquitetura, componentes, camadas)?
* As tarefas do `tasks.md` foram todas executadas, na ordem e com as dependências respeitadas?

## 7.3 Qualidade e testes

* A suíte de testes da feature passa integralmente na reexecução?
* O ciclo TDD (RED → GREEN → REFACTOR) foi respeitado, conforme registrado no `implementation.md`?
* Não há teste alterado apenas para "passar" sem justificativa registrada?
* Lint/build/cobertura (quando aplicável) atendem aos padrões do `AGENTS.md`/guidelines?

## 7.4 Riscos e pendências

* Os riscos identificados no `plan.md` foram de fato mitigados?
* Existem itens pendentes/bloqueados no `implementation.md` que impedem a aprovação total da feature?

---

# 8. Veredito da validação

Ao final da análise, a skill deve emitir um veredito claro para a feature, podendo ser:

```text
- Aprovado: todos os critérios relevantes foram atendidos e as evidências confirmam.
- Aprovado com ressalvas: critérios essenciais atendidos, mas existem pendências
  menores, não bloqueantes, que devem ser registradas.
- Reprovado / Pendente: existem não conformidades relevantes, testes falhando,
  ou critérios de aceitação não atendidos, exigindo retorno à etapa de
  implementação (ou até de planejamento, se a causa for estrutural).
```

O veredito deve ser justificado com base nas evidências coletadas, nunca atribuído de forma genérica.

---

# Estrutura obrigatória do validation.md

O arquivo gerado deve seguir uma estrutura semelhante à seguinte:

````markdown
# Relatório de Validação — <Nome da Feature>

## 1. Contexto

Resumo breve da feature, referenciando `spec.md`, `plan.md`, `tasks.md` e `implementation.md`.

## 2. Referências

- `AGENTS.md`
- `docs/spec/<nome-da-feature>/spec.md`
- `docs/plan/<nome-da-feature>/plan.md`
- `docs/tasks/<nome-da-feature>/tasks.md`
- `docs/implementation/<nome-da-feature>/implementation.md`
- Guidelines relevantes

## 3. Veredito Final

**Status:** Aprovado / Aprovado com ressalvas / Reprovado / Pendente

Justificativa objetiva do status atribuído.

## 4. Matriz de Rastreabilidade

| Critério de aceitação / Cenário (spec.md) | Estratégia (plan.md) | Tarefa (tasks.md) | Evidência (implementation.md / execução) | Status |
|---|---|---|---|---|
| ... | ... | ... | ... | Atendido / Não atendido / Parcial |

## 5. Evidências de Teste

### 5.1 Execução da suíte de testes

- **Comando executado:** `<comando>`
- **Resultado:** Passou / Falhou
- **Quantidade de testes:** ...
- **Falhas encontradas:** ...

### 5.2 Lint / Format

- **Comando executado:** `<comando>` (quando aplicável)
- **Resultado:** ...

### 5.3 Build

- **Comando executado:** `<comando>` (quando aplicável)
- **Resultado:** ...

### 5.4 Cobertura de testes

- **Resultado:** ... (quando aplicável/disponível)

### 5.5 Divergências em relação ao implementation.md

Registrar qualquer diferença entre o que foi reportado no `implementation.md` e o que foi observado na reexecução, quando houver.

## 6. Conformidade Funcional

Análise por requisito/critério de aceitação relevante da `spec.md`, indicando se foi atendido, parcialmente atendido ou não atendido, com a evidência correspondente.

## 7. Conformidade Técnica

Análise da aderência à estratégia definida no `plan.md` e à execução das tarefas do `tasks.md`.

## 8. Riscos e Mitigações — Situação Atual

Retomar os riscos identificados no `plan.md` e indicar se foram mitigados, permanecem parcialmente mitigados, ou não foram endereçados.

## 9. Não Conformidades e Pendências

Listar objetivamente cada não conformidade ou pendência encontrada, com:

- descrição;
- origem (tarefa/critério relacionado);
- severidade (bloqueante / não bloqueante);
- recomendação (ex: retornar à etapa de implementação, retornar à etapa de planejamento, ajuste pontual).

## 10. Dúvidas Levantadas Durante a Validação

Registrar perguntas feitas ao usuário durante a validação e as respectivas decisões, quando houver.

## 11. Conclusão

Resumo final e, quando aplicável, indicação clara de próximos passos (ex: "pronto para PR/merge", "retornar para implementation.md com os itens da seção 9", "retornar para plan.md devido a divergência estrutural").
````

---

# Regras para o registro no validation.md

* O relatório deve refletir evidências reais coletadas nesta etapa (reexecução de testes, lint, build), diferenciando claramente o que foi **reexecutado agora** do que foi apenas **herdado do `implementation.md`** sem reexecução.
* Não deve reproduzir o código-fonte completo dentro do `validation.md` — referenciar caminhos de arquivos e trechos mínimos de saída de teste (quando necessário) é suficiente.
* Não deve suavizar ou omitir não conformidades para "aprovar" a feature — o valor do artefato está na honestidade da evidência.
* Deve manter rastreabilidade explícita com a spec, o plano e as tarefas correspondentes.

---

# Rastreabilidade

Sempre que possível, o `validation.md` deve manter rastreabilidade completa entre:

```text
Spec (requisito/cenário)
 ↓
Plano (estratégia)
 ↓
Tarefa (tasks.md)
 ↓
Implementação (implementation.md)
 ↓
Validação (evidência + veredito)
```

Exemplo:

```text
SPEC-01 / Cenário: usuário realiza login
  ↓
PLAN: Serviço de autenticação (item 8.1 do plan.md)
  ↓
TASKS: Tarefa 2 [RED] e Tarefa 3 [GREEN]
  ↓
IMPLEMENTATION: Concluídas, testes passando
  ↓
VALIDATION: Reexecutado — suíte de autenticação passou (12/12) — Atendido
```

---

# Consistência com o projeto

A skill deve sempre preferir os comandos, ferramentas e critérios de qualidade já definidos no `AGENTS.md`/guidelines do projeto para executar e interpretar os testes, o lint e o build.

Não deve inventar critérios de aprovação genéricos (ex: exigir 100% de cobertura) quando o projeto não define isso explicitamente.

---

# Tratamento de dúvidas

A skill deve interromper a execução sempre que encontrar uma dúvida relevante que impacte o veredito.

Formato recomendado:

```text
Encontrei uma decisão que precisa ser definida antes de concluir a validação.

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

Após a resposta do usuário, a validação deve continuar e a decisão deve ser registrada na seção 10 do `validation.md`.

---

# Validação antes de escrever o validation.md

Antes de escrever o `validation.md`, a skill deve verificar:

* [ ] O `implementation.md` foi lido integralmente.
* [ ] O `tasks.md`, `plan.md` e `spec.md` foram consultados para verificação de conformidade.
* [ ] O `AGENTS.md` relevante foi considerado.
* [ ] Guidelines relevantes foram consideradas.
* [ ] Os testes foram reexecutados quando o ambiente permitiu, ou a limitação foi registrada explicitamente.
* [ ] Divergências entre o `implementation.md` e a reexecução foram registradas, quando houve.
* [ ] A matriz de rastreabilidade entre spec/plano/tarefas/evidências foi construída.
* [ ] Não conformidades e pendências foram listadas sem omissões.
* [ ] Não há correção de código ou testes realizada por esta skill.
* [ ] Dúvidas bloqueantes foram levantadas ao usuário quando necessário.
* [ ] Um veredito final claro e justificado foi definido.
* [ ] O conteúdo do `validation.md` está em PT-BR.

Somente após essa validação o arquivo deve ser criado.

---

# Criação do arquivo

O arquivo deve ser criado em:

```text
docs/validation/<nome-da-feature>/validation.md
```

Caso o diretório não exista, ele deve ser criado.

Se já existir um `validation.md` para a mesma feature, a skill deve verificar se está sendo solicitado:

* uma nova validação completa (ex: após correções em uma nova implementação);
* a atualização da validação existente;
* ou a substituição do relatório existente.

Não sobrescrever silenciosamente um `validation.md` existente quando houver risco de perda de histórico de validações anteriores relevante (ex: histórico de reprovações e evolução da feature).

---

# Resultado esperado

Ao finalizar, o projeto deverá possuir:

```text
docs/
└── validation/
    └── <nome-da-feature>/
        └── validation.md
```

O `validation.md` deve representar um artefato honesto e rastreável de que a implementação foi verificada em relação à `spec.md`, ao `plan.md` e ao `tasks.md`, com evidências reais de teste e um veredito final claro.

Ele encerra o fluxo SDD para a feature, servindo como registro de aceite (ou de pendências a resolver antes do aceite).

---

# Regra final

Esta skill deve sempre seguir o princípio:

> **Valide com base em evidências reais, não em suposições; nunca corrija código ou testes durante a validação; registre não conformidades honestamente; e, diante de qualquer dúvida que possa mudar o veredito, pare e pergunte ao usuário em vez de presumir.**

O objetivo desta etapa é transformar:

```text
O QUE FOI IMPLEMENTADO
```

registrado no `implementation.md`, em:

```text
EVIDÊNCIA VERIFICADA DE QUE A IMPLEMENTAÇÃO ATENDE À SPEC E AO PLANO
```

encerrando o fluxo SDD com um artefato confiável de validação, rastreável desde a `spec.md` original até o resultado final dos testes.
