# Spec — US-06 Determinar posições iniciais dos camelos

| Campo | Valor |
| --- | --- |
| ID | US-06 |
| Feature | `us-06-posicoes-iniciais-camelos` |
| História | Como sistema, quero determinar as posições iniciais dos cinco camelos de corrida utilizando cartas de corrida, para reproduzir a preparação oficial da partida. |
| Status | Pronta para planejamento |
| Fonte | História US-06 + respostas de completude + `docs/rules/corrida_camelo_regras.md` §§2–3.2 e 5.1–5.2 + `AGENTS.md` + US-01 e US-04 |

---

## 1. Objetivo

Determinar as **posições iniciais dos cinco camelos de corrida** na preparação oficial da partida: embaralhar as cartas de corrida, revelar **exatamente cinco** cartas e aplicar cada uma **em sequência**, movendo o camelo correspondente 1 ou 2 casas à frente, até que a preparação das posições termine.

Esta feature **não** implementa UI, posicionamento do camelo doido na casa 7, montagem do baralho da etapa (distribuição aos jogadores, descarte, cartas à frente), apostas, pista por número de jogadores, feneco/atalho, IA de bots nem multiplayer em rede. O núcleo é a regra de preparação das posições, o pool de cartas de corrida resultante e a persistência desse estado após o início.

---

## 2. Contexto

- Produto Mobile First / local-first (`AGENTS.md`).
- Regras oficiais (`docs/rules/corrida_camelo_regras.md` §3.2): os cinco camelos de corrida começam **atrás da linha de partida**; embaralham-se as **30** cartas de corrida; revelam-se cartas até **exatamente 5**; cada carta move o camelo da cor em **+1 ou +2** casas; alguns camelos **podem** permanecer atrás da linha.
- Regras de pilha (`docs/rules` §§5.1–5.2): camelos na mesma casa formam pilha, **exceto** atrás da linha de partida; quem se move leva os de cima; unidade que termina sobre outra **sobe**.
- US-01: posição = espaço + `stackOrder`; espaço de largada = **0**; na criação todos os 6 camelos estão no espaço 0. A US-01 deixou o reveal oficial como abertura explícita.
- US-04: `Created` → `RaceSetup`; o estado iniciado preservava camelos no espaço 0 e o início era **sem RNG**. Esta US **refina** esse contrato (ver D14–D16).
- Persistência de partida já existe. Após o início com posições determinadas, reload **não** reembaralha nem revela de novo.

---

## 3. Atores

| Ator | Papel nesta feature |
| --- | --- |
| Sistema / Domínio | Embaralha, revela 5 cartas, aplica os movimentos em ordem, atualiza posições e o pool de cartas |
| Jogador (humano) | Não escolhe as cartas nem as posições nesta US; dispara apenas o início da partida (já definido na US-04) |
| Camada de aplicação / persistência | Após início bem-sucedido, persiste posições e pool; no load **não** reexecuta o procedimento |
| UI futura | Poderá animar as 5 revelações; **fora** do escopo de implementação desta US |

---

## 4. Escopo

### 4.1 Dentro do escopo

- Executar a determinação das posições como **passo automático do início** da partida (`Created` → `RaceSetup`).
- Garantir que, **antes** do procedimento, os cinco camelos de corrida estejam atrás da linha de partida (espaço 0).
- Representar as **30 cartas de corrida** oficiais (composição §7).
- Embaralhar essas 30 cartas **antes** de revelar.
- Revelar **exatamente 5** cartas, em ordem, e aplicar cada uma ao camelo da cor correspondente.
- Mover o camelo **+1 ou +2** casas conforme o valor da carta.
- Usar **somente** valores e cores válidos de carta de corrida.
- Permitir que um ou mais camelos de corrida **permaneçam** atrás da linha de partida.
- Aplicar as regras oficiais de **pilha** durante a sequência (exceção no espaço 0).
- Registrar as 5 cartas reveladas e o **pool restante de 25**, de forma que as 5 **não** voltem a ficar disponíveis para o baralho da etapa.
- Garantir posições **válidas** para todos os camelos ao final da preparação.
- Persistir o estado iniciado (posições + pool + cartas reveladas); restaurar **sem** novo embaralhamento nem nova revelação.
- Rejeitar sequência inválida (quantidade, valores, cores) como falha **total** do início.

### 4.2 Fora do escopo

- Telas, animações de reveal ou pista visual.
- Posicionar o camelo doido (`Crazy`) na casa 7 (permanece no espaço 0 até história futura).
- Cartas de camelo doido (valores 0/1/2 do conjunto de 5 cartas pretas).
- Montar o **baralho da etapa** (distribuição, descarte, cartas à frente, inserção de cartas do camelo doido — `docs/rules` §6.4).
- Comprimento da pista, tempestade de areia, feneco, atalho, apostas.
- Movimento de camelos **depois** desta preparação (ações de turno / pirâmide).
- Alterar ordem de jogadores, dinheiro, turno ou rodada além do já definido na US-04.
- UI, IA de bots, servidor ou multiplayer online.

---

## 5. Glossário

| Termo | Definição |
| --- | --- |
| Camelo de corrida | Um dos cinco: `Yellow`, `Green`, `Blue`, `Purple`, `Red` (rumo à chegada) |
| Camelo doido | `Crazy`; **não** participa desta preparação |
| Linha de partida / atrás da linha | Espaço de largada **0** (`START_SPACE`); camelos aí **não** formam pilha de jogo |
| Casa da pista | Espaço inteiro ≥ 1; a primeira casa à frente da linha é o espaço **1** |
| Carta de corrida | Carta com **cor de camelo de corrida** e valor **1** ou **2** |
| Baralho de cartas de corrida | As **30** cartas oficiais (§7), distintas das 5 cartas de camelo doido |
| Revelar | Expor a próxima carta do baralho embaralhado e aplicá-la imediatamente |
| Unidade | Um camelo sozinho ou uma pilha que se move junta |
| Pilha de jogo | Ordenação vertical em um espaço **≥ 1**; o de cima está à frente no ranking e é carregado se o de baixo se move |
| Pool restante | As 25 cartas de corrida **não** reveladas nesta preparação; base futura do baralho da etapa |
| Cartas consumidas | As 5 cartas reveladas na preparação; **não** disponíveis como cartas do baralho da etapa |
| Preparação das posições iniciais | O procedimento desta US; termina após a quinta carta. Não encerra sozinha toda a fase `RaceSetup` (outros setups futuros ainda podem ocorrer nessa fase) |

---

## 6. Premissas e decisões de produto

| ID | Decisão |
| --- | --- |
| D1 | A determinação ocorre como **passo automático do início** (`startMatch` / equivalente): `Created` válida → procedimento → `RaceSetup` com posições e pool atualizados. |
| D2 | Na fase `Created`, os 6 camelos permanecem no espaço 0 (contrato de criação da US-01). O procedimento **não** roda na criação. |
| D3 | O jogador **não** escolhe cartas nem ordem de reveal; o sistema embaralha e aplica. |
| D4 | Sem UI nesta US. |
| D5 | Camelo doido **fora** desta US: permanece no espaço 0, direção `TowardStart`. Casa 7 fica para história futura. |
| D6 | Cartas de camelo doido **não** entram no embaralhamento desta preparação. |
| D7 | Composição oficial das 30 cartas (§7). Nenhuma outra carta é usada. |
| D8 | Embaralhamento **antes** da primeira revelação; permutação aleatória das 30. |
| D9 | Revelam-se **exatamente 5** cartas, uma a uma, **nesta ordem**; a ordem importa por causa das pilhas. |
| D10 | Cada carta move **somente** o camelo da cor indicada (e, se couber, a unidade que ele carrega). |
| D11 | Valor **1** → +1 casa; valor **2** → +2 casas. Nenhum outro valor. |
| D12 | Atrás da linha (espaço 0) **não** há pilha de jogo: um camelo que sai do 0 **não** carrega os demais que estejam no 0 (incluindo o doido). |
| D13 | Nos espaços ≥ 1 valem §§5.1–5.2: mesma casa = pilha; quem se move leva os de cima; unidade que chega **sobe** na unidade já presente. |
| D14 | **Refina US-04 D5/D6/RN-07:** após início bem-sucedido, os camelos de corrida **não** permanecem todos no espaço 0; ocupam as posições resultantes das 5 cartas. |
| D15 | **Refina US-04 D13/RN-17:** o início deixa de ser livre de RNG para posições. O embaralhamento é aleatório (testável/injetável). **Dada a mesma sequência de 5 cartas**, a aplicação é determinística. |
| D16 | Demais efeitos da US-04 permanecem: fase `RaceSetup`, `currentTurnPlayerId` = `players[0].id`, `playerRoundIndex` = 0, £3, ordem `players` inalterada, atomicidade, segundo início rejeitado. |
| D17 | As 5 cartas reveladas são **consumidas**: saem do pool e **não** ficam disponíveis para o baralho da etapa (mesmo que o manual §6.4 fale em 30 cartas na preparação da etapa — esta US fixa a adaptação). |
| D18 | O estado iniciado inclui, de forma serializável: as **5 cartas reveladas (em ordem)** e o **pool restante (25)**. União = 30 oficiais; interseção vazia. |
| D19 | O pool restante **não** é ainda o baralho da etapa. `LegSetup` / §6.4 continua fora de escopo. A ordem interna das 25 **não** é contrato desta US (a etapa futura reembaralha). |
| D20 | Reload restaura posições, cartas reveladas e pool restante; **proibido** novo embaralhamento, nova revelação ou reaplicação dos movimentos. |
| D21 | Segunda execução é impossível por via do segundo início (US-04): a preparação das posições ocorre **no máximo uma vez** por partida. |
| D22 | Falha no procedimento → rejeição **total** do início; a `Created` de origem permanece intacta (sem posições parciais nem pool pela metade). |
| D23 | `stackOrder` no espaço 0 continua **distinto** entre camelos nesse espaço (invariante US-01 RN-07), mas **não** significa pilha de jogo. |

---

## 7. Cartas de corrida oficiais

Conjunto fechado desta US (**30** cartas), 6 por cor de camelo de corrida:

| Cor (`CamelId`) | Quantidade de valor **1** | Quantidade de valor **2** |
| --- | ---: | ---: |
| `Yellow` | 5 | 1 |
| `Green` | 5 | 1 |
| `Blue` | 5 | 1 |
| `Purple` | 5 | 1 |
| `Red` | 5 | 1 |

Não fazem parte deste conjunto: cartas de camelo doido, apostas, pista, preparação de etapa.

**Valores válidos** de carta de corrida: **1** e **2**.  
**Cores válidas:** as cinco de corrida.  
Carta com valor 0, valor &gt; 2, cor `Crazy` ou identidade inexistente é **inválida** nesta preparação.

---

## 8. Numeração da pista nesta US

| Referência | Espaço no estado |
| --- | --- |
| Atrás da linha de partida | `0` |
| Primeira casa à frente da linha | `1` |
| Segunda casa | `2` |
| … | `n` |

Mover +1 a partir do espaço `s` resulta no espaço `s + 1` (rumo à chegada).  
Exemplo: camelo no 0 com carta 2 termina no espaço **2**, se não houver outras interações de pilha além das regras §9.

Amplitude possível após 5 cartas (um único camelo recebendo as cinco): no máximo **6** casas à frente (uma carta 2 + quatro cartas 1 da mesma cor). Esta US **não** exige o comprimento completo da pista por número de jogadores; as casas atingíveis aqui cabem na representação já existente (inteiro ≥ 0).

---

## 9. Procedimento (sucesso)

Dada uma partida `Created` válida (camelos no espaço 0):

1. Confirmar que os **cinco** camelos de corrida estão atrás da linha (espaço 0). O camelo doido também está no 0, mas **não** é movido por este procedimento.
2. Constituir o baralho com as **30** cartas da §7.
3. **Embaralhar** o baralho.
4. Para `i` de 1 a 5:
   1. Revelar a próxima carta (cor + valor).
   2. Rejeitar o início inteiro se a carta for inválida (§7).
   3. Aplicar o movimento ao camelo da cor, segundo §10, avançando **exatamente** o valor da carta.
5. Encerrar a preparação das posições iniciais.
6. Registrar as 5 cartas reveladas (ordem de revelação) e o pool restante (25).
7. Concluir o restante do início (US-04): fase `RaceSetup`, primeiro turno, etc.

Não se revela sexta carta. Não se aplica movimento extra após a quinta.

---

## 10. Regras de movimento nesta preparação

### 10.1 Destino

O camelo da carta avança **N** casas rumo à chegada, N ∈ {1, 2} igual ao valor. Não há movimento 0. Não há movimento para trás.

### 10.2 Sair de trás da linha (espaço 0)

- Os camelos no espaço 0 **não** formam pilha de jogo.
- Somente o camelo da carta sai; nenhum outro camelo no 0 é carregado (nem outros de corrida, nem o doido).
- O camelo chega ao espaço `0 + N`.

### 10.3 Mover a partir de um espaço ≥ 1

- A **unidade** é o camelo da carta **mais** todos os que estiverem **em cima** dele na pilha.
- Camelos **abaixo** dele permanecem no espaço de origem.
- A unidade inteira avança N casas, **preservando** a ordem interna (quem estava em cima continua em cima).

### 10.4 Chegar a um espaço já ocupado (espaço ≥ 1)

- Se o destino já possui uma unidade, a unidade que chega **sobe** sobre ela (novos de cima; a ordem interna de cada unidade se preserva).
- Isso vale para 2, 3 ou mais camelos no mesmo espaço.

### 10.5 Mesmo camelo mais de uma vez

- É válido o mesmo camelo aparecer nas 5 cartas (há 6 cartas por cor).
- A segunda (ou posterior) carta parte da **posição atual** daquele camelo, não da linha de partida.
- Se nesse momento ele já integra uma pilha em espaço ≥ 1, aplica-se §10.3.

### 10.6 Permanecer atrás da linha

- Se a cor de um camelo **não** sai nas 5 cartas, ele permanece no espaço 0.
- Isso é **válido** e esperado.

### 10.7 Camelo doido

- Não é alvo de nenhuma carta desta preparação.
- Não muda de espaço nem de direção.
- Não é carregado por camelos de corrida que saem do espaço 0.

---

## 11. Estado imediatamente após o início (sucesso) — acréscimos desta US

Além do contrato da US-04 (fase, jogadores, ordem, turno, £3), o estado iniciado deve satisfazer:

| Aspecto | Valor esperado |
| --- | --- |
| Camelos de corrida | Cada um no espaço resultante das cartas que o afetaram (0 se nenhuma carta da sua cor) |
| Camelo doido | Espaço **0**, direção `TowardStart` |
| Pilhas em espaços ≥ 1 | `stackOrder` distintos no espaço; maior = topo = à frente no ranking |
| Espaço 0 | Pode haver vários camelos (doido e/ou de corrida que não saíram); `stackOrder` distintos **sem** significado de pilha de jogo |
| Cartas reveladas | Exatamente **5** cartas válidas, em ordem de aplicação |
| Pool restante | **25** cartas de corrida; composição = 30 oficiais menos as 5 reveladas |
| Disponibilidade para etapa | As 5 reveladas **não** pertencem ao pool restante |

O estado deve continuar válido segundo os invariantes da US-01 (com o refinamento de posições desta US) e o turno da US-04.

---

## 12. Relação com criação, início e etapa

```text
createMatch          →  Created; 6 camelos no espaço 0; procedimento ainda não rodou
        ↓
início (US-04+US-06) →  embaralha 30, revela 5, posiciona, persiste
        ↓
RaceSetup            →  posições definidas; pool 25; baralho da etapa ainda não montado
        ↓
LegSetup (futuro)    →  usa o pool restante; as 5 consumidas não voltam
```

| Situação | Resultado |
| --- | --- |
| Partida `Created` válida | Início aceito → posições + pool conforme §9–§11 |
| Segundo início / já em andamento / encerrada | Rejeitado (US-04); posições e pool permanecem os do primeiro sucesso (se houver) |
| Load de partida já iniciada | Restaura posições e pool; **não** revela de novo |
| Preparação da etapa (futura) | Não pode incluir as 5 cartas consumidas nesta US |

---

## 13. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Os cinco camelos de corrida começam o procedimento atrás da linha (espaço 0). |
| RN-02 | O baralho usado tem exatamente as 30 cartas da §7. |
| RN-03 | O baralho é embaralhado antes da primeira revelação. |
| RN-04 | São reveladas exatamente 5 cartas, nem mais nem menos. |
| RN-05 | Cada carta revelada movimenta o camelo da cor indicada (e a unidade que ele carregar, se couber). |
| RN-06 | A quantidade de casas é o valor da carta (1 ou 2). |
| RN-07 | Somente valores e cores válidos de carta de corrida são utilizados. |
| RN-08 | Um ou mais camelos de corrida podem permanecer no espaço 0. |
| RN-09 | As 5 cartas reveladas **não** ficam no pool restante e **não** estão disponíveis para o baralho da etapa. |
| RN-10 | Ao final, todos os camelos (5 de corrida + doido) têm posição válida (espaço ≥ 0; `stackOrder` distintos no mesmo espaço). |
| RN-11 | A aplicação é **sequencial** na ordem de revelação. |
| RN-12 | No espaço 0 não há pilha de jogo; sair do 0 não carrega outros. |
| RN-13 | Em espaço ≥ 1, mesma casa forma pilha; unidade que chega sobe; quem se move leva os de cima. |
| RN-14 | O mesmo camelo pode ser alvo de mais de uma das 5 cartas; o movimento é cumulativo. |
| RN-15 | Dois ou mais (incluindo três ou mais) camelos no mesmo espaço ≥ 1 formam uma única pilha válida. |
| RN-16 | `Crazy` não é movido nem alvo de carta nesta US. |
| RN-17 | Jogadores, ordem, dinheiro, turno e `playerRoundIndex` seguem a US-04 (não são alterados por este procedimento além do próprio início). |
| RN-18 | O procedimento só ocorre no início a partir de `Created`; no máximo uma vez por partida. |
| RN-19 | Sequência inválida ou invariante quebrada → início rejeitado por completo; `Created` intacta. |
| RN-20 | Persistir após sucesso; restaurar **não** reembaralha, não revela e não reaplica movimento. |
| RN-21 | Mesma sequência de 5 cartas + mesmo estado `Created` → mesmas posições e mesmos conjuntos reveladas/restantes. |
| RN-22 | Domínio sem React/Next/`localStorage`; I/O de persistência na aplicação. |

---

## 14. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | Ao iniciar uma `Created` válida, o sistema deve embaralhar as 30 cartas de corrida e revelar exatamente 5. |
| RF-02 | O sistema deve aplicar cada carta revelada ao camelo correspondente, na ordem, segundo §10. |
| RF-03 | O sistema deve produzir posições válidas para todos os camelos ao final. |
| RF-04 | O sistema deve preservar no estado as 5 cartas reveladas (ordem) e o pool restante de 25. |
| RF-05 | O sistema deve garantir que as 5 cartas consumidas não estejam no pool restante. |
| RF-06 | O sistema deve deixar `Crazy` no espaço 0. |
| RF-07 | O sistema deve **rejeitar** o início se a sequência de cartas for inválida (quantidade ≠ 5, valor ou cor inválidos). |
| RF-08 | O sistema deve persistir o estado após sucesso e restaurá-lo sem reexecutar o procedimento. |
| RF-09 | O sistema deve permitir, em testes, controlar o embaralhamento ou a sequência revelada (equivalente ao RNG injetável da US-03). |

---

## 15. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Independência de UI: domínio sem React/Next. |
| RNF-02 | Testabilidade: sequência/embaralhamento injetável para cenários de pilha e “mesmo camelo” sem flakiness. |
| RNF-03 | Determinismo da **aplicação**: mesma sequência → mesmo resultado. O embaralhamento padrão é aleatório. |
| RNF-04 | Atomicidade: sucesso total ou rejeição com `Created` preservada. |
| RNF-05 | Serialização: posições, cartas reveladas e pool restante sobrevivem a round-trip JSON / `localStorage`. |
| RNF-06 | Compatibilidade: partida iniciada continua válida segundo US-01 (invariantes de camelos) e US-04 (fase, turno, elenco), com os refinamentos D14–D16. |

---

## 16. Critérios de aceite

- [ ] Os cinco camelos de corrida começam atrás da linha de partida (espaço 0) antes do procedimento.
- [ ] As cartas de corrida são embaralhadas antes da preparação.
- [ ] São reveladas exatamente cinco cartas.
- [ ] Cada carta movimenta o camelo correspondente.
- [ ] O valor da carta determina a quantidade de casas (1 ou 2).
- [ ] Somente valores válidos de cartas de corrida são utilizados.
- [ ] Um camelo pode permanecer atrás da linha de partida.
- [ ] As cinco cartas utilizadas na preparação não ficam disponíveis como cartas do baralho da etapa (fora do pool restante).
- [ ] Ao final da preparação, todos os camelos possuem uma posição válida.
- [ ] O mesmo camelo pode aparecer múltiplas vezes; o movimento é cumulativo.
- [ ] Um ou mais camelos podem permanecer atrás da linha.
- [ ] Dois ou mais camelos na mesma casa ≥ 1 formam pilha.
- [ ] Três ou mais camelos na mesma casa ≥ 1 formam pilha.
- [ ] Um camelo pode formar / integrar pilha durante a preparação; movimento seguinte respeita carregar os de cima.
- [ ] `Crazy` permanece no espaço 0.
- [ ] Reload não reembaralha nem revela de novo.

---

## 17. Cenários de comportamento

### 17.1 Preparação válida

```gherkin
Feature: Posições iniciais dos camelos de corrida

  Scenario: Início revela exatamente cinco cartas e posiciona os camelos
    Given uma partida válida na fase Created
    And os cinco camelos de corrida e o camelo doido estão no espaço 0
    When o domínio inicia a partida com uma sequência controlada de 5 cartas de corrida válidas
    Then a operação é aceita
    And a fase passa a ser RaceSetup
    And exatamente 5 cartas foram reveladas e registradas nessa ordem
    And o pool restante contém 25 cartas
    And as 5 reveladas não pertencem ao pool restante
    And a união das reveladas com o restante é o conjunto oficial de 30 cartas
    And cada carta revelada moveu o camelo da sua cor na quantidade do seu valor
    And o camelo doido permanece no espaço 0
```

### 17.2 Embaralhamento, valores e permanência na linha

```gherkin
  Scenario: Cartas são embaralhadas antes da revelação
    Given uma partida Created válida
    When o domínio inicia a partida sem sequência forçada
    Then as 5 cartas reveladas são as 5 primeiras de um embaralhamento das 30 oficiais
    And a composição revelada + restante permanece a das 30 oficiais

  Scenario: Carta de valor 1 avança uma casa
    Given os camelos de corrida no espaço 0
    And a primeira carta revelada é Yellow com valor 1
    When a carta é aplicada
    Then Yellow ocupa o espaço 1
    And os demais camelos de corrida que ainda não foram revelados permanecem no espaço 0

  Scenario: Carta de valor 2 avança duas casas
    Given os camelos de corrida no espaço 0
    And a primeira carta revelada é Green com valor 2
    When a carta é aplicada
    Then Green ocupa o espaço 2

  Scenario: Um camelo permanece atrás da linha de partida
    Given uma sequência de 5 cartas que não inclui a cor Red
    When o domínio inicia a partida com essa sequência
    Then Red permanece no espaço 0
    And isso é válido
```

### 17.3 Mesmo camelo mais de uma vez

```gherkin
  Scenario: O mesmo camelo aparece múltiplas vezes
    Given os camelos no espaço 0
    And a sequência começa com Blue valor 1 e depois Blue valor 2
    When as duas cartas são aplicadas em ordem
    Then após a primeira carta Blue ocupa o espaço 1
    And após a segunda carta Blue ocupa o espaço 3
```

### 17.4 Pilhas (duas, três ou mais; formação durante a preparação)

```gherkin
  Scenario: Dois camelos terminam na mesma casa
    Given os camelos no espaço 0
    And a sequência revela Yellow valor 1 e em seguida Green valor 1
    When as cartas são aplicadas em ordem
    Then Yellow e Green ocupam o espaço 1
    And formam uma pilha de jogo
    And Green está acima de Yellow

  Scenario: Três ou mais camelos terminam na mesma casa
    Given os camelos no espaço 0
    And três cartas de valor 1 de cores distintas são reveladas em sequência
    When as cartas são aplicadas
    Then os três camelos ocupam o mesmo espaço 1
    And formam uma única pilha
    And a ordem de baixo para cima segue a ordem de chegada

  Scenario: Um camelo forma pilha e depois carrega quem está em cima
    Given Yellow no espaço 1 e Green empilhado acima de Yellow
    And a próxima carta é Yellow valor 1
    When a carta é aplicada
    Then Yellow e Green avançam juntos para o espaço 2
    And Green permanece acima de Yellow
    And nenhum camelo que estava abaixo de Yellow (se houver) é levado

  Scenario: Sair de trás da linha não carrega outros camelos do espaço 0
    Given Yellow, Green e Crazy no espaço 0
    And a carta revelada é Yellow valor 1
    When a carta é aplicada
    Then somente Yellow vai para o espaço 1
    And Green e Crazy permanecem no espaço 0
```

### 17.5 Cartas consumidas, camelo doido e persistência

```gherkin
  Scenario: As cinco cartas da preparação não ficam no baralho da etapa
    Given um início bem-sucedido com 5 cartas reveladas
    When se consulta o pool restante de cartas de corrida
    Then ele não contém nenhuma das 5 cartas reveladas
    And contém 25 cartas

  Scenario: Camelo doido não é posicionado nesta US
    Given um início bem-sucedido
    Then Crazy permanece no espaço 0
    And nenhuma carta de camelo doido foi revelada nesta preparação

  Scenario: Reload não refaz a preparação
    Given uma partida recém-iniciada com posições e pool persistidos
    When o estado é restaurado
    Then as posições dos camelos são as mesmas
    And as 5 cartas reveladas são as mesmas
    And o pool restante é o mesmo
    And nenhum novo embaralhamento nem revelação ocorre
```

### 17.6 Rejeições e atomicidade

```gherkin
  Scenario: Sequência com quantidade diferente de 5 cartas é rejeitada
    Given uma partida Created válida
    When o início é tentado com uma sequência forçada que não tem exatamente 5 cartas
    Then a operação é rejeitada
    And a partida permanece Created
    And os camelos permanecem no espaço 0

  Scenario: Carta com valor ou cor inválidos é rejeitada
    Given uma partida Created válida
    When o início é tentado com uma carta de valor 0, valor 3, ou cor Crazy
    Then a operação é rejeitada
    And nenhum movimento parcial é aceito

  Scenario: Segundo início não reposiciona
    Given uma partida já iniciada com posições determinadas
    When o domínio tenta iniciar novamente
    Then a operação é rejeitada
    And as posições e o pool permanecem os do primeiro sucesso
```

---

## 18. Dependências e restrições

| Tipo | Descrição |
| --- | --- |
| US-01 | Camelos, espaço + `stackOrder`, espaço 0 na criação, invariante de pilha distinta no mesmo espaço, serialização |
| US-04 | Início `Created` → `RaceSetup`, atomicidade, primeiro turno, persistência do estado iniciado; **refinada** em posições e RNG (D14–D16) |
| US-03 / persistência | `localStorage`; load não reexecuta sorteio — aqui, não reexecuta reveal |
| Regras oficiais | `docs/rules/corrida_camelo_regras.md` §3.2 (posições) e §§5.1–5.2 (pilhas) |
| Restrição | Spec independente de pastas/libs; identificadores de camelo/fase já estabelecidos não mudam de nome |
| Adaptação | D17 (5 cartas fora do pool da etapa) é decisão de produto desta US, mesmo se §6.4 do manual for interpretado de outro modo no futuro |

---

## 19. Rastreabilidade da história

| Critério / caso da história | Cobertura |
| --- | --- |
| Cinco camelos começam atrás da linha | RN-01, D2, §9, §17.1 |
| Cartas embaralhadas antes da preparação | RN-03, D8, RF-01, §17.2 |
| Exatamente cinco cartas reveladas | RN-04, D9, §17.1, §17.6 |
| Cada carta movimenta o camelo correspondente | RN-05, D10, §17.1 |
| Valor determina as casas | RN-06, D11, §17.2 |
| Somente valores válidos | RN-07, §7, §17.6 |
| Camelo pode permanecer atrás da linha | RN-08, D12, §17.2 |
| Cinco cartas fora do baralho da etapa | RN-09, D17–D18, RF-05, §17.5 |
| Posição válida ao final | RN-10, RF-03, §11 |
| Mesmo camelo múltiplas vezes | RN-14, §17.3 |
| Um ou mais atrás da linha | RN-08, §17.2 |
| Dois ou mais na mesma casa | RN-15, §17.4 |
| Três ou mais na mesma casa | RN-15, §17.4 |
| Formar pilha durante a preparação | RN-13, D13, §17.4 |

---

## 20. Aberturas explícitas (não bloqueantes)

- Posicionar `Crazy` na casa 7 após esta preparação.
- Montagem do baralho da etapa a partir do pool de 25 (`docs/rules` §6.4: distribuição, descarte, cartas à frente, inserção de cartas do camelo doido).
- Comprimento da pista por número de jogadores e tempestade de areia.
- Animação / UI das cinco revelações.
- Movimento de camelos em ações de turno (pirâmide, jogar carta da mão).
- Nomes de campos do estado para “cartas reveladas” e “pool restante” (ficam a cargo do plan; o comportamento é obrigatório).
- Orquestração fina de persistência (já coberta pela US-04: sucesso durável = estado iniciado completo, agora incluindo posições e pool).
