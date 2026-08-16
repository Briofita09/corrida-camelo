# Spec — US-01 Definir domínio e estado da partida

| Campo | Valor |
| --- | --- |
| ID | US-01 |
| Feature | `us-01-dominio-estado-partida` |
| História | Como sistema, quero possuir um modelo de domínio que represente uma partida de Camel Up, para que as regras do jogo possam ser implementadas sem depender da camada de interface. |
| Status | Pronta para planejamento |
| Fonte | História de produto US-01 + respostas de completude + `AGENTS.md` + `docs/game/game-design.md` |

---

## 1. Objetivo

Estabelecer o **modelo de domínio** e o **estado serializável** de uma partida de *Camel Up: The Card Game*, de forma que:

- as regras futuras do jogo possam operar sobre esse estado;
- a UI (React/Next.js) não seja necessária para representar ou validar a partida;
- o estado possa, no futuro, ser persistido localmente e sincronizado em multiplayer.

Esta feature **não** implementa as regras de movimento, apostas, baralho ou inteligência de bots — apenas a representação, criação, início e validação/invariantes do estado.

---

## 2. Contexto

- Produto: aplicação web Mobile First (`AGENTS.md`).
- Arquitetura desejada: domínio separado da UI (`docs/game/game-design.md` §§41–43, 64).
- Roadmap: Fase 1 — Domínio.
- Regras de mesa de referência: *Camel Up: The Card Game* (2–6 jogadores); Crazy Camel conforme `docs/game/game-design.md`.

---

## 3. Atores

| Ator | Papel nesta feature |
| --- | --- |
| Sistema / Domínio | Cria, inicia, valida e rejeita estados de partida |
| Jogador humano | Entidade no estado (sem UI nesta US) |
| Bot | Entidade no estado, com nível de dificuldade |
| Camada de aplicação / UI (futura) | Consumidora do estado; **fora** do escopo de implementação desta US |

---

## 4. Escopo

### 4.1 Dentro do escopo

- Representar uma **partida** com estado explícito e bem definido.
- Representar, no mínimo:
  - jogadores (humanos e bots);
  - quantidade e **nível de dificuldade** dos bots;
  - camelos (incluindo Crazy Camel);
  - posições dos camelos (espaço + ordem na pilha);
  - turno atual;
  - fase atual da partida (ciclo próximo ao jogo real);
  - pontuação em dinheiro (£) por jogador;
  - estado de encerramento.
- Criar partida com configuração válida de jogadores/bots.
- Iniciar partida a partir de estado criado.
- Rejeitar estados e operações inválidas.
- Garantir que o domínio **não dependa** de React nem de APIs do Next.js.
- Garantir que o estado seja **serializável** (estrutura de dados pura, adequada a JSON).

### 4.2 Fora do escopo

- UI, rotas Next.js, componentes React.
- Regras de movimento de camelos, pilhas em ação, fennec, atalho/palmeira.
- Baralho de corrida, apostas, pagamento calculado por cartas.
- Comportamento/IA dos bots (apenas o **atributo** de dificuldade no estado).
- Persistência em disco, rede, WebSocket ou multiplayer.
- Player-hosted, PWA, contas de usuário.
- Definição completa do comprimento da pista por número de jogadores (apenas representação de posições e invariantes locais).

---

## 5. Glossário

| Termo | Definição |
| --- | --- |
| Partida | Agregado de domínio que possui identidade e um estado |
| Estado da partida | Snapshot completo e serializável da partida em um instante |
| Jogador | Participante humano ou bot, com identificador único na partida |
| Bot | Jogador controlado pelo sistema, com `dificuldade` |
| Camelo de corrida | Um dos cinco camelos coloridos da corrida |
| Crazy Camel | Camelo especial, distinto dos de corrida, com direção própria |
| Posição | Espaço na pista + ordem na pilha naquele espaço |
| Pilha | Ordenação vertical de camelos no mesmo espaço; o de cima está à frente no ranking |
| Turno atual | Identificador do jogador autorizado a agir na fase em que há turnos |
| Fase | Etapa do ciclo de vida da partida (ver §7) |
| Pontuação | Dinheiro do jogador em libras (£) |
| Partida encerrada | Partida na fase `Finished` |
| Serializável | Representável como dados puros (ex.: JSON), sem funções, classes de UI ou referências a runtime de framework |

---

## 6. Premissas e decisões de produto

| ID | Decisão |
| --- | --- |
| D1 | Quantidade de jogadores (humanos + bots): **mínimo 2, máximo 6**. |
| D2 | Bots **contam** no total de jogadores. |
| D3 | Na criação, deve ser possível informar **quantos bots** e o **nível de dificuldade** de cada bot. |
| D4 | Níveis de dificuldade dos bots nesta US: `Easy`, `Medium`, `Hard`. (Extensíveis em features futuras sem quebrar o conceito.) |
| D5 | Deve existir **pelo menos 1 jogador humano** na criação (alinhado ao MVP “jogar contra bots”). |
| D6 | Camelos no estado: **Amarelo, Verde, Azul, Roxo, Vermelho** e **Crazy Camel**. |
| D7 | Crazy Camel possui **direção** representada no estado (ex.: rumo à largada vs. rumo à chegada), distinta dos camelos de corrida. |
| D8 | Pontuação = dinheiro em £; **todo jogador inicia com 3** ao criar/iniciar a partida conforme regras desta US. |
| D9 | Dinheiro de um jogador **nunca é inferior a 1** no estado válido (regra do jogo de cartas); valores abaixo de 1 são inconsistentes. |
| D10 | Fases seguem o ciclo do jogo (não apenas Created/InProgress/Finished). Ver §7. |

---

## 7. Ciclo de fases da partida

Fases obrigatórias do domínio (identificadores estáveis):

| Fase | Significado |
| --- | --- |
| `Created` | Partida criada; ainda não iniciada |
| `RaceSetup` | Preparação inicial da corrida (pista/camelos no setup da mesa) |
| `LegSetup` | Preparação da perna (montagem do baralho da perna, etc.) |
| `LegInProgress` | Perna em andamento (turnos e ações de pista/aposta) |
| `LegPayout` | Pagamento da perna |
| `FinalPayout` | Pagamento final da corrida |
| `Finished` | Partida encerrada |

### 7.1 Transições mínimas exigidas nesta US

| De | Para | Quando |
| --- | --- | --- |
| (inexistente) | `Created` | Criação bem-sucedida da partida |
| `Created` | `RaceSetup` | Início da partida |
| Qualquer fase ≠ `Finished` | (inalterada ou avançada por regras futuras) | Mutações de domínio futuras |
| `FinalPayout` | `Finished` | Encerramento após pagamento final (regra futura; estado deve **permitir** representar `Finished`) |

Nesta US, a operação de **iniciar** só é válida a partir de `Created` e resulta em `RaceSetup`. Avanços posteriores de fase poderão ser feitos por features de regras; o modelo **deve ser capaz de representar** todas as fases acima.

### 7.2 Regras de transição desta US

- Não é permitido **iniciar** uma partida que não esteja em `Created`.
- Não é permitido **qualquer comando de mutação** de domínio sobre partida em `Finished` (exceto leitura/serialização).
- Partida em `Finished` deve expor de forma explícita o encerramento (fase `Finished` e/ou flag derivada equivalente — a fase é a fonte de verdade).

---

## 8. Modelo conceitual de estado

O estado de uma partida deve permitir representar, de forma explícita:

### 8.1 Partida

- Identificador da partida.
- Fase atual (`Created` … `Finished`).
- Identificador do jogador do **turno atual** (obrigatório quando a fase for `LegInProgress`; nas demais fases pode ser nulo/ausente, desde que consistente com a fase).
- Número da perna atual (inteiro ≥ 1 quando a corrida já tiver entrado em ciclo de pernas; ausente ou 0 apenas se a fase ainda for `Created` / início de `RaceSetup`, de forma documentada e consistente).

### 8.2 Jogadores

Para cada jogador:

- Identificador **único** na partida.
- Nome ou rótulo de exibição (texto).
- Tipo: `Human` \| `Bot`.
- Se `Bot`: dificuldade `Easy` \| `Medium` \| `Hard` (**obrigatória**).
- Se `Human`: dificuldade **ausente**.
- Dinheiro atual em £ (inteiro ≥ 1; na criação/início válido = 3).

### 8.3 Camelos

Para cada um dos 6 camelos:

- Identidade estável (`Yellow`, `Green`, `Blue`, `Purple`, `Red`, `Crazy`).
- Posição: índice de espaço na pista (inteiro ≥ 0; convenção: espaço de largada = 0, salvo documentação interna consistente).
- Ordem na pilha no espaço (inteiro ≥ 0; maior = mais ao topo = mais à frente no ranking daquele espaço).
- Direção (obrigatória para `Crazy`; para camelos de corrida, direção fixa “rumo à chegada” ou omitida de forma consistente).

### 8.4 Encerramento

- Fase `Finished` representa partida encerrada.
- Estado encerrado permanece legível e serializável; não aceita mutações de domínio.

---

## 9. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Uma partida válida possui entre **2 e 6** jogadores, inclusive. |
| RN-02 | A soma de humanos + bots determina o total; bots contam no limite. |
| RN-03 | Na criação, é obrigatório haver **≥ 1 humano**. |
| RN-04 | Cada bot deve ter dificuldade `Easy`, `Medium` ou `Hard`. |
| RN-05 | Identificadores de jogadores são únicos dentro da partida. |
| RN-06 | O estado inclui exatamente os **6** camelos definidos em D6, sem duplicar identidades. |
| RN-07 | Dois camelos no mesmo espaço devem ter **ordens de pilha distintas**. |
| RN-08 | Todo jogador em estado válido após criação/início possui dinheiro **igual a 3**, até que regras futuras alterem o valor. |
| RN-09 | Dinheiro de jogador em estado válido é inteiro **≥ 1**. |
| RN-10 | Fase deve ser um dos valores de §7. |
| RN-11 | Operação **criar** com 0 jogadores, &lt; 2, &gt; 6, sem humano, bot sem dificuldade, ou IDs duplicados → **rejeitada**. |
| RN-12 | Operação **iniciar** só é aceita se a fase for `Created`; caso contrário → **rejeitada**. |
| RN-13 | Qualquer mutação em fase `Finished` → **rejeitada**. |
| RN-14 | Hidratar/restaurar/validar estado incompleto ou inconsistente com estas regras → **rejeitado**. |
| RN-15 | O domínio não referencia React, Next.js, DOM, browser APIs ou frameworks de UI. |
| RN-16 | O estado da partida deve ser serializável e desserializável preservando os campos semânticos desta spec (round-trip). |

---

## 10. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve permitir **criar** uma partida informando a lista de jogadores (humanos e bots), inclusive quantidade de bots e dificuldade de cada bot. |
| RF-02 | Ao criar com sucesso, a partida deve ficar na fase `Created`, com dinheiro 3 para cada jogador e os 6 camelos presentes no estado com posições iniciais válidas e consistentes. |
| RF-03 | O sistema deve permitir **iniciar** uma partida em `Created`, passando-a para `RaceSetup`. |
| RF-04 | O sistema deve expor leitura do estado completo da partida (jogadores, camelos/posições, turno quando aplicável, fase, pontuação, encerramento). |
| RF-05 | O sistema deve **validar** um estado (ou rejeitar na criação/hidratação) conforme RN-01–RN-14. |
| RF-06 | O sistema deve **serializar** e **desserializar** o estado sem perda dos dados semânticos listados no escopo. |
| RF-07 | Tentativas inválidas (criação, início, mutação, hidratação) devem falhar de forma explícita no domínio (erro/resultado de rejeição), sem corromper o estado anterior quando houver partida já existente. |

---

## 11. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Independência de UI: o módulo de domínio não deve importar nem depender de React ou Next.js. |
| RNF-02 | Serialização: o estado deve ser expressável em formato de dados interoperável (ex.: JSON) para persistência e sync futuros. |
| RNF-03 | Determinismo de validação: as mesmas entradas inválidas devem ser sempre rejeitadas. |
| RNF-04 | Testabilidade: comportamentos desta spec devem ser verificáveis por testes automatizados de domínio (sem browser). |

---

## 12. Critérios de aceite

- [ ] Existe representação de **partida** no domínio.
- [ ] A partida possui **estado claramente definido** e documentado.
- [ ] O estado representa: jogadores; camelos (com Crazy Camel); posições; turno atual (quando aplicável); fase atual; pontuação (£); encerramento.
- [ ] É possível configurar **quantidade de bots** e **dificuldade** (`Easy` \| `Medium` \| `Hard`) na criação.
- [ ] Jogadores humanos e bots são representáveis.
- [ ] Domínio **não** depende de React/Next.js.
- [ ] Estado é **serializável** com round-trip semântico.
- [ ] Estados inválidos e operações inválidas são **rejeitados** (casos de borda abaixo).

---

## 13. Cenários de comportamento

### 13.1 Criação válida

```gherkin
Feature: Domínio e estado da partida
  Scenario: Criar partida válida com humano e bots
    Given uma configuração com 1 humano e 2 bots com dificuldades Easy e Medium
    When o domínio cria a partida
    Then a criação é aceita
    And a fase é Created
    And existem 3 jogadores com dinheiro 3 cada
    And os 6 camelos estão presentes no estado
    And o bot Easy e o bot Medium possuem suas dificuldades gravadas
```

### 13.2 Casos de borda — criação

```gherkin
  Scenario: Criar partida sem jogadores
    Given uma configuração sem jogadores
    When o domínio tenta criar a partida
    Then a criação é rejeitada

  Scenario: Criar partida abaixo do mínimo
    Given uma configuração com apenas 1 jogador humano
    When o domínio tenta criar a partida
    Then a criação é rejeitada

  Scenario: Criar partida acima do máximo
    Given uma configuração com 7 jogadores (humanos e/ou bots)
    When o domínio tenta criar a partida
    Then a criação é rejeitada

  Scenario: Criar partida só com bots
    Given uma configuração com 3 bots e nenhum humano
    When o domínio tenta criar a partida
    Then a criação é rejeitada

  Scenario: Criar partida com bot sem dificuldade
    Given uma configuração com 1 humano e 1 bot sem dificuldade
    When o domínio tenta criar a partida
    Then a criação é rejeitada

  Scenario: Criar partida com identificadores duplicados
    Given uma configuração com dois jogadores possuindo o mesmo identificador
    When o domínio tenta criar a partida
    Then a criação é rejeitada
```

### 13.3 Início da partida

```gherkin
  Scenario: Iniciar partida criada
    Given uma partida válida na fase Created
    When o domínio inicia a partida
    Then a fase passa a ser RaceSetup

  Scenario: Tentar iniciar partida já iniciada
    Given uma partida na fase RaceSetup ou posterior (exceto Finished)
    When o domínio tenta iniciar a partida novamente
    Then a operação é rejeitada
    And a fase permanece inalterada
```

### 13.4 Partida encerrada e estado inconsistente

```gherkin
  Scenario: Tentar modificar partida encerrada
    Given uma partida na fase Finished
    When qualquer comando de mutação de domínio é aplicado
    Then a mutação é rejeitada
    And o estado permanece o mesmo

  Scenario: Receber estado incompleto ou inconsistente
    Given um payload de estado sem a lista de camelos completa
    Or com dinheiro de jogador menor que 1
    Or com dois camelos na mesma posição e mesma ordem de pilha
    Or com fase desconhecida
    When o domínio valida ou hidrata o estado
    Then a operação é rejeitada
```

### 13.5 Serialização e independência de UI

```gherkin
  Scenario: Round-trip de serialização
    Given uma partida válida em qualquer fase representável
    When o estado é serializado e em seguida desserializado
    Then o estado resultante é semanticamente equivalente ao original

  Scenario: Domínio independente de UI
    Given o módulo de domínio da partida
    Then ele não possui dependências de React nem de Next.js
```

---

## 14. Posições iniciais dos camelos (criação)

Na criação bem-sucedida, até que a feature de setup de corrida detalhe o sorteio por cartas:

- Todos os camelos devem ocupar o **espaço de largada (0)**.
- Ordens de pilha no espaço 0 devem ser **distintas** (empate de ordem é inconsistente).
- A ordem inicial exata da pilha na largada pode ser convencional (ex.: ordem estável pelas identidades), desde que determinística e documentada na implementação futura — **não** é necessário simular o reveal de 5 cartas nesta US.

Crazy Camel inicia com direção **oposta** à dos camelos de corrida.

---

## 15. Dependências e restrições

| Tipo | Descrição |
| --- | --- |
| Contexto | `AGENTS.md` — domínio fora da UI; local-first; serialização para sync futuro |
| Produto | `docs/game/game-design.md` — Crazy Camel, separação domínio/UI |
| Regras de mesa | Limites 2–6, dinheiro inicial 3, mínimo 1 £ |
| Restrição | Spec independente de implementação (sem impor pastas, libs de teste ou estrutura de arquivos) |

---

## 16. Rastreabilidade da história

| Critério / caso da história | Cobertura |
| --- | --- |
| Representar partida | RF-01, RF-04, §8 |
| Estado claramente definido | §7, §8 |
| Jogadores, camelos, posições, turno, fase, pontuação, encerramento | §8, RF-04 |
| Sem React/Next | RNF-01, cenário 13.5 |
| Serializável | RF-06, RNF-02, cenário 13.5 |
| Humanos e bots | §8.2, D3–D5 |
| Quantidade e dificuldade de bots | RF-01, D3–D4 |
| Rejeitar inválidos | RN-11–RN-14, §13.2–13.4 |
| Sem jogadores / abaixo mín. / acima máx. | §13.2 |
| Iniciar já iniciada | §13.3 |
| Modificar encerrada | §13.4 |
| Estado incompleto/inconsistente | §13.4 |
| IDs duplicados | §13.2 |

---

## 17. Aberturas explícitas (não bloqueantes)

Itens **não** fixados por esta US e a cargo de specs futuras de regras:

- Comprimento da pista por número de jogadores e sandstorm.
- Algoritmo oficial de posições iniciais via reveal de cartas.
- Conteúdo de `LegSetup` (baralho, intel, mão).
- Avanço automático de fases além de `Created` → `RaceSetup`.
- Semântica de turno fora de `LegInProgress`.
- Algoritmos de IA por dificuldade.
