# Spec — US-02 Criar configuração de uma nova partida

| Campo | Valor |
| --- | --- |
| ID | US-02 |
| Feature | `us-02-configuracao-nova-partida` |
| História | Como jogador, quero configurar uma nova partida escolhendo os participantes e o modo de jogo, para que eu possa iniciar uma partida de acordo com minhas preferências. |
| Status | Pronta para planejamento |
| Fonte | História US-02 + respostas de completude + `AGENTS.md` + US-01 (`docs/spec/us-01-dominio-estado-partida/spec.md`) |

---

## 1. Objetivo

Permitir que o jogador **monte e valide uma configuração de nova partida** (modo + participantes), de forma independente de qualquer tela, e que uma configuração válida **gere uma nova partida** no domínio já definido pela US-01 (fase `Created`).

Esta feature **não** implementa a UI (telas, rotas, componentes), nem regras de movimento/apostas, nem o avanço de fase além da criação da partida (`Created`).

---

## 2. Contexto

- Produto Mobile First / local-first (`AGENTS.md`).
- Domínio de partida existente: `domain/match` (US-01 validada) — `createMatch`, limites 2–6, ≥1 humano, bots com dificuldade.
- Fluxo de produto desejado (`docs/game/game-design.md`): Nova partida → modo → jogadores → iniciar.
- Modo Online fica fora desta US (evolução futura).

---

## 3. Atores

| Ator | Papel nesta feature |
| --- | --- |
| Jogador (humano configurador) | Define modo e participantes da nova partida |
| Sistema / Domínio (ou camada de aplicação sem UI) | Mantém configuração, valida, descarta e gera partida |
| Bot | Participante opcional/obrigatório conforme o modo; age automaticamente na partida (comportamento de IA fora do escopo) |
| UI futura | Consome a API de configuração; **não** faz parte da implementação desta US |

---

## 4. Escopo

### 4.1 Dentro do escopo

- Modelo de **configuração de nova partida**, independente de tela.
- Definir **modo**: `SinglePlayerVsBots` \| `PassAndPlay`.
- Ordem do fluxo de configuração: **modo antes** dos jogadores.
- Definir participantes: humanos e bots (com dificuldade quando bot).
- Validar quantidade mínima/máxima e combinações por modo.
- Impedir nomes vazios e nomes duplicados.
- Gerar partida (`Created`) a partir de configuração válida, compatível com US-01.
- Descartar configuração em andamento ao abandonar / sair do fluxo (sem persistir rascunho).
- Dificuldade dos bots definida na configuração (antes do início) e **imutalível durante a partida** (fica gravada no estado da partida gerada).

### 4.2 Fora do escopo

- Telas React/Next, navegação visual, bottom sheets, etc. (a regra “modo antes dos jogadores” é de **fluxo da configuração**, não de implementação de UI nesta US).
- Modo Online / multiplayer em rede.
- `startMatch` e demais fases além de criar a partida em `Created`.
- IA/comportamento automático dos bots (apenas presença + dificuldade na config/partida).
- Persistência de rascunho de configuração (salvar/continuar config).
- Alteração de dificuldade (ou tipo) de bot **após** a partida ter sido criada.

---

## 5. Glossário

| Termo | Definição |
| --- | --- |
| Configuração de partida | Objeto de domínio/aplicação que representa o rascunho da nova partida (modo + lista de participantes), ainda não necessariamente uma `MatchState` |
| Modo `SinglePlayerVsBots` | Um único humano contra um ou mais bots |
| Modo `PassAndPlay` | Dois ou mais humanos no mesmo dispositivo; bots opcionais; na partida, bots não exigem “passar o aparelho” (agem automaticamente — detalhe de UX/IA futuro) |
| Participante da config | Entrada humana ou bot na configuração (nome, tipo, dificuldade se bot) |
| Gerar partida | Transformar configuração válida em partida de domínio US-01 na fase `Created` |
| Abandonar configuração | Sair do fluxo sem gerar partida; alterações são descartadas |
| Nome | Rótulo de exibição do participante; não pode ser vazio nem duplicado na mesma configuração |

---

## 6. Premissas e decisões de produto

| ID | Decisão |
| --- | --- |
| D1 | Limites globais herdados da US-01: **mínimo 2, máximo 6** participantes (humanos + bots). |
| D2 | **Nenhuma partida** pode ser gerada sem pelo menos **1 humano**. |
| D3 | Modo `SinglePlayerVsBots`: exatamente **1 humano** e **pelo menos 1 bot**; total entre 2 e 6. |
| D4 | Modo `PassAndPlay`: **pelo menos 2 humanos**; bots **opcionais**; total entre 2 e 6. |
| D5 | Cada bot na configuração **deve** ter dificuldade `Easy` \| `Medium` \| `Hard` (US-01). |
| D6 | Dificuldade do bot é escolhida **antes** de gerar/iniciar a partida e **não pode ser alterada** depois que a partida existe. |
| D7 | Nomes: rejeitar string vazia ou só espaços; rejeitar dois participantes com o **mesmo nome** (comparação após trim; case-sensitive ou normalização — ver D8). |
| D8 | Comparação de nomes duplicados: após `trim`, comparação **case-insensitive** (ex.: “Ana” e “ana” são o mesmo nome). |
| D9 | Fluxo: **modo é definido antes** da definição dos jogadores. Não se adicionam jogadores sem modo definido. |
| D10 | Ao **voltar** à etapa de modo ou **abandonar** a configuração, o rascunho é **descartado** (sem persistência). |
| D11 | Identificadores internos dos jogadores na partida gerada podem ser atribuídos pelo sistema; a unicidade de **nome** é a regra de produto na configuração (IDs únicos na partida seguem US-01). |
| D12 | Online e demais modos não listados estão fora desta US. |

---

## 7. Regras por modo

### 7.1 `SinglePlayerVsBots`

| Regra | Conteúdo |
| --- | --- |
| Humanos | Exatamente 1 |
| Bots | Entre 1 e 5 (de forma que total ∈ [2, 6]) |
| Sem bots | **Inválido** |
| Só bots / 0 humanos | **Inválido** |
| >1 humano | **Inválido** neste modo |

### 7.2 `PassAndPlay`

| Regra | Conteúdo |
| --- | --- |
| Humanos | Mínimo 2 |
| Bots | 0 ou mais, desde que total ∈ [2, 6] |
| Sem bots (só humanos ≥2) | **Válido** |
| 1 humano (+ bots ou não) | **Inválido** neste modo |
| 0 humanos | **Inválido** |

### 7.3 Comuns a ambos

- Total de participantes ∈ [2, 6].
- Todo bot com dificuldade válida.
- Todo participante com nome não vazio (após trim) e único na configuração (D7–D8).
- Configuração sem modo definido: não permite adicionar jogadores nem gerar partida.

---

## 8. Ciclo de vida da configuração

```text
(inexistente)
    → criar rascunho / iniciar configuração
    → definir modo                    [etapa 1]
    → definir / alterar participantes [etapa 2]
    → validar
    → gerar partida (Created)     OU  abandonar / voltar ao modo → descartar
```

| Evento | Efeito |
| --- | --- |
| Definir modo (pela primeira vez) | Configuração passa a ter modo; etapa de jogadores habilitada |
| Alterar modo voltando à etapa 1 | **Descarta** participantes já definidos; mantém apenas o novo modo (ou descarta tudo e recomeça com o novo modo — equivalente: sem jogadores) |
| Adicionar / remover / editar participante | Atualiza rascunho; pode tornar a config temporariamente inválida |
| Gerar partida | Só se configuração **válida**; produz `MatchState` em `Created` via regras US-01 |
| Abandonar | Descarta rascunho; nenhuma partida criada; nada persistido |

---

## 9. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Deve ser possível criar e manipular uma configuração de partida sem depender de UI. |
| RN-02 | A configuração deve armazenar modo e lista ordenada (ou conjunto) de participantes. |
| RN-03 | Participantes humanos e bots são representáveis; bots exigem dificuldade. |
| RN-04 | Validação de quantidade e composição conforme §7. |
| RN-05 | Nome vazio / só espaços → rejeitado. |
| RN-06 | Nomes duplicados (D8) → rejeitados. |
| RN-07 | Combinações inválidas para o modo → rejeitadas na validação / na geração. |
| RN-08 | Configuração válida deve poder gerar partida US-01 em `Created` com os mesmos nomes, tipos e dificuldades. |
| RN-09 | Após gerar a partida, dificuldades dos bots no estado da partida não são alteráveis por esta feature (imutáveis na partida). |
| RN-10 | Abandonar ou voltar à etapa de modo descarta o rascunho de jogadores / configuração em andamento; **não** persiste. |
| RN-11 | Tentativa de gerar partida com configuração inválida → rejeitada; nenhuma partida parcial é criada. |
| RN-12 | Modo Online não existe nesta US. |

---

## 10. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve permitir **criar** uma configuração de nova partida. |
| RF-02 | O sistema deve permitir **definir o modo** (`SinglePlayerVsBots` \| `PassAndPlay`) antes dos jogadores. |
| RF-03 | O sistema deve permitir **adicionar, remover e atualizar** participantes (humano/bot) após o modo definido. |
| RF-04 | O sistema deve permitir definir **dificuldade** de cada bot na configuração. |
| RF-05 | O sistema deve **validar** a configuração (limites, modo, nomes, dificuldades). |
| RF-06 | O sistema deve **gerar** uma partida US-01 (`Created`) a partir de configuração válida. |
| RF-07 | O sistema deve **descartar** a configuração em andamento ao abandonar ou ao retornar à definição de modo (sem persistência de rascunho). |
| RF-08 | A configuração e suas operações não devem depender de React/Next.js. |

---

## 11. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Independência de UI: módulo de configuração sem imports de React/Next. |
| RNF-02 | Testabilidade: comportamentos validáveis com testes automatizados (Vitest), sem browser. |
| RNF-03 | Compatibilidade: partida gerada deve satisfazer invariantes US-01 (`createMatch` / estado válido). |
| RNF-04 | Sem I/O de persistência de rascunho (memória de processo / objeto apenas). |

---

## 12. Critérios de aceite

- [ ] Existe forma de criar uma configuração de partida (sem UI).
- [ ] É possível definir jogadores humanos e bots na configuração.
- [ ] É possível definir modo Single-player contra bots e Pass-and-Play.
- [ ] Modo é definido **antes** dos jogadores.
- [ ] Validação de mínimo/máximo (2–6) e regras por modo (§7).
- [ ] Combinações inválidas são impedidas (incluindo só bots; Single-player sem bots; Pass-and-Play com &lt;2 humanos).
- [ ] Nomes vazios e nomes duplicados são rejeitados.
- [ ] Configuração válida gera nova partida em `Created` compatível com US-01.
- [ ] Dificuldade dos bots definida na config e refletida na partida; não há operação nesta US para alterá-la após gerar a partida.
- [ ] Abandonar / voltar ao modo descarta o rascunho sem persistir.
- [ ] Configuração independente da tela.

---

## 13. Cenários de comportamento

### 13.1 Fluxo feliz

```gherkin
Feature: Configuração de nova partida

  Scenario: Single-player válido gera partida
    Given uma configuração nova
    When o jogador define o modo SinglePlayerVsBots
    And adiciona 1 humano com nome "Felipe"
    And adiciona 2 bots com dificuldades Easy e Medium e nomes distintos
    And solicita gerar a partida
    Then a configuração é válida
    And uma partida é criada na fase Created
    And a partida contém 1 humano e 2 bots com as dificuldades informadas

  Scenario: Pass-and-play só com humanos
    Given o modo PassAndPlay
    When são adicionados 3 humanos com nomes distintos
    And nenhum bot
    And solicita gerar a partida
    Then a partida é criada com 3 humanos

  Scenario: Pass-and-play com humanos e bots
    Given o modo PassAndPlay
    When são adicionados 2 humanos e 1 bot com dificuldade Hard
    And todos com nomes distintos
    And solicita gerar a partida
    Then a partida é criada com 3 participantes incluindo o bot Hard
```

### 13.2 Casos de borda — validação

```gherkin
  Scenario: Iniciar sem jogadores
    Given uma configuração com modo definido e zero participantes
    When solicita gerar a partida
    Then a operação é rejeitada

  Scenario: Apenas um jogador no total
    Given modo qualquer e apenas 1 participante
    When solicita gerar a partida
    Then a operação é rejeitada

  Scenario: Acima do limite
    Given 7 participantes
    When solicita gerar a partida
    Then a operação é rejeitada

  Scenario: Todos os jogadores são bots
    Given qualquer modo e somente bots
    When solicita gerar a partida
    Then a operação é rejeitada

  Scenario: Nenhum bot em Single-player
    Given modo SinglePlayerVsBots com exatamente 1 humano e 0 bots
    When solicita gerar a partida
    Then a operação é rejeitada

  Scenario: Nenhum bot em Pass-and-play com 2+ humanos
    Given modo PassAndPlay com 2 humanos e 0 bots
    When solicita gerar a partida
    Then a operação é aceita

  Scenario: Pass-and-play com apenas 1 humano
    Given modo PassAndPlay com 1 humano e 2 bots
    When solicita gerar a partida
    Then a operação é rejeitada

  Scenario: Nome vazio
    Given tentativa de adicionar participante com nome "" ou só espaços
    When a configuração é atualizada
    Then a operação é rejeitada

  Scenario: Nomes duplicados
    Given um participante "Ana"
    When tenta adicionar outro participante "ana"
    Then a operação é rejeitada
```

### 13.3 Modo, abandono e imutabilidade pós-partida

```gherkin
  Scenario: Modo deve vir antes dos jogadores
    Given uma configuração sem modo
    When tenta adicionar um jogador
    Then a operação é rejeitada

  Scenario: Voltar à etapa de modo descarta jogadores
    Given modo SinglePlayerVsBots e participantes já definidos
    When o fluxo retorna à definição de modo (ou o modo é redefinido nessa etapa)
    Then a lista de participantes é descartada
    And nenhum rascunho é persistido

  Scenario: Abandonar configuração
    Given uma configuração em andamento com modo e jogadores
    When o usuário abandona a configuração
    Then o rascunho é descartado
    And nenhuma partida é criada
    And nada é persistido

  Scenario: Dificuldade do bot não muda após gerar partida
    Given uma partida gerada a partir de config com bot Easy
    When qualquer operação desta feature tenta alterar a dificuldade do bot na partida
    Then não há operação suportada que altere essa dificuldade
    And o estado da partida preserva Easy
```

### 13.4 Independência de UI

```gherkin
  Scenario: Configuração independente de UI
    Given o módulo de configuração de partida
    Then ele não depende de React nem de Next.js
```

---

## 14. Dependências e restrições

| Tipo | Descrição |
| --- | --- |
| US-01 | Partida gerada deve usar / respeitar `createMatch` e invariantes (2–6, humano, dificuldades, fase `Created`) |
| AGENTS.md | Domínio fora da UI; Vitest; local-first |
| Produto | `docs/game/game-design.md` — fluxo Nova partida → modo → jogadores |
| Restrição | Spec independente de implementação de telas |

---

## 15. Rastreabilidade da história

| Critério / caso | Cobertura |
| --- | --- |
| Criar configuração | RF-01 |
| Definir jogadores / humanos e bots | RF-03, RF-04 |
| Modos Single-player e Pass-and-Play | RF-02, §7 |
| Validar min/max | RN-04, §7 |
| Impedir combinações inválidas | §7, §13.2 |
| Config válida gera partida | RF-06, §13.1 |
| Independente da tela | RF-08, RNF-01, §13.4 |
| Sem jogadores / 1 jogador / acima do limite | §13.2 |
| Todos bots | §13.2 |
| Nenhum bot | §13.2 (inválido em Single; válido em Pass com ≥2 humanos) |
| Nome vazio / duplicado | RN-05, RN-06, §13.2 |
| Troca/volta de modo | D9–D10, §13.3 |
| Abandonar | RF-07, §13.3 |

---

## 16. Aberturas explícitas (não bloqueantes)

- Implementação visual das “telas” de modo e jogadores (feature de UI posterior).
- Comportamento automático dos bots durante a partida (IA).
- UX de “passar o celular” apenas entre humanos no Pass-and-Play.
- Persistência de partida após criada (salvar/continuar jogo — roadmap fase 3).
- Modo Online.
