# Spec — US-07 Inicializar camelo doido

| Campo | Valor |
| --- | --- |
| ID | US-07 |
| Feature | `us-07-inicializar-camelo-doido` |
| História | Como sistema, quero posicionar e configurar o camelo doido no início da partida, para que ele esteja pronto para participar da corrida conforme suas regras especiais. |
| Status | Pronta para planejamento |
| Fonte | História US-07 + respostas de completude + refinamentos de produto (nenhum camelo tem dono; doido sempre corre da chegada para a partida; doido empilha em qualquer posição vertical) + `docs/rules/corrida_camelo_regras.md` §§3.2, 5.1–5.3 e 9 + `AGENTS.md` + US-01, US-04 e US-06 |

---

## 1. Objetivo

Posicionar e configurar o **camelo doido** na preparação oficial da partida: após as posições dos cinco camelos de corrida (US-06), colocá-lo na **casa 7**, correndo **sempre** no sentido **linha de chegada → linha de partida** (contrário aos camelos de corrida), como entidade distinta dos cinco de corrida e **desclassificado** para classificação (não pode vencer a corrida).

**Nenhum camelo tem dono** — nem o doido, nem os cinco de corrida. Esta US não introduz vínculo jogador↔camelo.

O camelo doido **pode ser empilhado** com os de corrida: pode ficar **por cima** de outro camelo (outros por baixo dele) ou **por baixo** (outros por cima dele), inclusive no meio de uma pilha. A mesma regra oficial de pilha se aplica a ele (`docs/rules` §§5.1–5.3). Nesta inicialização ele é colocado **sozinho** na casa 7; a pilha mista é contrato para o movimento futuro.

Esta feature **não** implementa UI, movimento do camelo doido durante a etapa, cartas pretas do camelo doido, reposicionamento de etapa (`docs/rules` §6.3), cálculo de ranking/vencedor, apostas, feneco/atalho nem o fim da corrida. O núcleo é a **inicialização** no início da partida e as regras de identidade, direção, ausência de dono e **pilha** que as histórias futuras deverão respeitar.

---

## 2. Contexto

- Produto Mobile First / local-first (`AGENTS.md`).
- Regras oficiais (`docs/rules/corrida_camelo_regras.md` §3.2): **depois** de determinar as posições de largada dos camelos de corrida, posiciona-se o camelo doido (preto) na **casa 7**, correndo na direção oposta, com a cabeça voltada à linha de partida.
- Regras oficiais §§5.3 e 9: o camelo doido está **desclassificado**; não pode vencer; é **ignorado** em todos os propósitos de classificação. A mesma regra de pilha se aplica a ele; camelos de corrida nas costas podem ser carregados rumo à partida.
- US-01: o estado já inclui os 6 camelos; `Crazy` existe na criação, no espaço 0, com direção `TowardStart`. Camelos **não** têm vínculo de jogador.
- US-04: início `Created` → `RaceSetup`.
- US-06: no início, embaralha 30 cartas, revela 5 e posiciona os camelos de corrida; **deixou** `Crazy` no espaço 0 (abertura explícita: casa 7 nesta história). Amplitude máxima das 5 cartas de um único camelo de corrida: **6** casas à frente da linha — portanto, na largada, nenhum camelo de corrida alcança a casa 7.
- Persistência já grava o estado iniciado. Reload **não** reexecuta o início nem reposiciona o doido.

---

## 3. Atores

| Ator | Papel nesta feature |
| --- | --- |
| Sistema / Domínio | Ao iniciar, após a US-06, posiciona `Crazy` no espaço 7 com sentido permanente chegada → partida; mantém identidade (não é camelo de corrida, desclassificado) e a regra de que **nenhum** camelo tem dono |
| Jogador (humano) | Não escolhe a casa nem a orientação; não “possui” camelo algum; dispara apenas o início (US-04) |
| Camada de aplicação / persistência | Persiste o estado iniciado (incluindo `Crazy` no 7 e a direção); no load **não** reposiciona |
| UI futura | Poderá distinguir visualmente o doido e a direção (`docs/game/game-design.md` §17); **fora** do escopo de implementação desta US |

---

## 4. Escopo

### 4.1 Dentro do escopo

- Tratar o posicionamento do camelo doido como **passo automático do início**, **depois** da determinação das posições dos camelos de corrida (US-06).
- Na fase `Created`, manter o contrato vigente: os **6** camelos no espaço 0 (incluindo `Crazy`).
- Ao concluir um início bem-sucedido, `Crazy` ocupa a **casa 7** (espaço **7**) e corre no sentido **chegada → partida**.
- Garantir que esse sentido seja o **único** sentido de `Crazy` nesta partida: contrário ao dos camelos de corrida, que correm partida → chegada.
- Garantir que `Crazy` continue presente no estado e **não** seja um dos cinco camelos de corrida.
- Explicitar que **nenhum** dos 6 camelos tem dono (doido e de corrida).
- Registrar no contrato de estado que `Crazy` está **desclassificado**: não pode vencer a corrida e deve ser ignorado em classificação futura (identidade `Crazy` + sentido chegada → partida bastam; sem atributo novo nesta US).
- Na inicialização desta US, colocar `Crazy` **sozinho** na casa 7 (destino vazio após a US-06).
- Registrar **invariantes** de pilha: `Crazy` **pode ser empilhado** com camelos de corrida em casa ≥ 1; pode estar **por cima** (outros por baixo), **por baixo** (outros por cima) ou **no meio** da pilha. Quem se move leva só os de cima; quem chega sobe na unidade presente. Sem implementar esse movimento nesta US.
- Persistir o estado iniciado; restaurar **sem** recolocar o doido na casa 7.
- Refinar o contrato da US-06: após o início, `Crazy` **não** permanece no espaço 0.

### 4.2 Fora do escopo

- Telas, animações ou tratamento visual do Crazy Camel.
- Movimento do camelo doido (cartas pretas, pirâmide, +1 se houver unidade nas costas).
- Reposicionamento do doido na preparação de cada etapa (`docs/rules` §6.3).
- Calcular classificação, lugares 1º–5º, vencedor/perdedor da corrida ou pagamentos.
- Alterar posições dos camelos de corrida além do já definido na US-06.
- Alterar ordem de jogadores, dinheiro, turno ou rodada além da US-04.
- Introduzir dono, vínculo ou “associação” de **qualquer** camelo a um jogador.
- Inverter, anular ou tornar opcional a direção de `Crazy`.
- Campo/atributo novo de desclassificação além da identidade `Crazy`.
- Comprimento da pista por número de jogadores, tempestade de areia, feneco, atalho, apostas.
- UI, IA de bots, servidor ou multiplayer online.

---

## 5. Glossário

| Termo | Definição |
| --- | --- |
| Camelo de corrida | Um dos cinco: `Yellow`, `Green`, `Blue`, `Purple`, `Red`. Sentido permanente: **linha de partida → linha de chegada** |
| Camelo doido | `Crazy`; camelo preto oficial; **não** é camelo de corrida. Sentido permanente: **linha de chegada → linha de partida** |
| Casa 7 | Sétima casa à frente da linha de partida = espaço **7** no estado (espaço 0 = atrás da linha; espaço 1 = primeira casa) |
| Linha de partida | Espaço **0**. Os de corrida afastam-se dela rumo à chegada; o doido corre **em direção** a ela |
| Linha de chegada | Extremidade oposta da pista (casa ainda não dimensionada nesta US). Os de corrida correm para ela; o doido corre **a partir do sentido dela** para a partida |
| Sentido do doido | Sempre chegada → partida (`TowardStart`). Nunca o sentido dos camelos de corrida |
| Desclassificado | Condição permanente de `Crazy` para classificação: não ocupa lugar 1º–5º e não pode vencer a corrida |
| Sem dono | **Nenhum** camelo (os cinco de corrida e o doido) pertence a jogador; não há vínculo participante↔camelo no estado |
| Pilha de jogo | Camelos na mesma casa ≥ 1, inclusive com `Crazy`. `Crazy` pode ser o de cima, o de baixo ou um do meio |
| Inicialização do doido | O passo desta US no início; ocorre **depois** das 5 cartas da US-06 |

---

## 6. Premissas e decisões de produto

| ID | Decisão |
| --- | --- |
| D1 | A inicialização ocorre como **passo automático do início**, **depois** da US-06: `Created` válida → posições dos camelos de corrida → posicionar `Crazy` na casa 7 → `RaceSetup`. |
| D2 | Na fase `Created`, os 6 camelos (incluindo `Crazy`) permanecem no espaço 0. Esta US **não** posiciona o doido na criação. |
| D3 | O jogador **não** escolhe casa nem orientação. |
| D4 | Sem UI nesta US. |
| D5 | “Casa 7” do manual = espaço **7** (mesma numeração da US-06). |
| D6 | **Sentido permanente de `Crazy`:** linha de chegada → linha de partida (`TowardStart`). Contrário aos camelos de corrida (partida → chegada, `TowardFinish`). O posicionamento na casa 7 **não** inverte, anula nem torna esse sentido opcional. |
| D7 | `Crazy` já **existe** no estado desde a criação (US-01). Esta US não cria um sétimo camelo nem remove `Crazy`. |
| D8 | `Crazy` **não** é um dos cinco camelos de corrida. Cartas de corrida da US-06 continuam sem alvo `Crazy`. |
| D9 | **Nenhum camelo tem dono** — nem `Crazy`, nem `Yellow`…`Red`. O aceite original “o doido não é associado a nenhum jogador” vale porque **nenhum** camelo o é. Esta US **não** introduz vínculo jogador↔camelo. |
| D10 | Desclassificação: a identidade `Crazy` (com sentido chegada → partida) **é** a identificação explícita no estado. Sem campo booleano adicional nesta US. Classificação/vencedor **não** são calculados aqui. |
| D11 | Histórias futuras de ranking **devem** ignorar `Crazy` em todos os propósitos de classificação (`docs/rules` §9). `Crazy` **não pode** vencer a corrida (`docs/rules` §5.3). |
| D12 | **Refina US-06 D5 / RF-06:** após início bem-sucedido, `Crazy` **não** permanece no espaço 0; ocupa o espaço 7, no sentido chegada → partida. |
| D13 | Demais efeitos da US-04 e da US-06 permanecem: fase `RaceSetup`, primeiro turno, £3, ordem `players`, 5 cartas + pool 25, posições dos camelos de corrida, atomicidade, segundo início rejeitado. |
| D14 | Na inicialização, a casa 7 está **vazia** (US-06: máximo 6 casas para um camelo de corrida). `Crazy` é colocado **sozinho** no espaço 7. |
| D15 | **Pilha com o doido (mesma regra dos demais, `docs/rules` §§5.1–5.3):** em casa ≥ 1, `Crazy` **pode ser empilhado** com camelos de corrida. Pode estar **por cima** de outro camelo (há camelos **por baixo** dele) ou **por baixo** (há camelos **por cima** dele), inclusive no meio. A posição vertical não é restrita por ele ser o doido. Não ocorre neste passo de inicialização (`Crazy` sozinho no 7). |
| D16 | “Perto da linha de partida” não se aplica a este passo (`Crazy` está no 7). Invariante futura de movimento: o doido só avança no sentido chegada → partida e **não atravessa** a linha de partida (`docs/rules` §5.3). Sem movimento nesta US. |
| D17 | Reposicionamento de etapa (§6.3: 3 casas à frente do 1º, etc.) **fora** desta US. Por isso o espaço 7 **não** é invariante permanente de `RaceSetup` / etapas seguintes. O **sentido** chegada → partida **é** permanente. |
| D18 | Reload restaura `Crazy` no espaço e no sentido persistidos; **proibido** recolocar na casa 7, reexecutar o início ou inverter a direção. |
| D19 | Segunda execução é impossível pelo segundo início (US-04): a inicialização do doido ocorre **no máximo uma vez** por partida. |
| D20 | Falha no início → rejeição **total**; `Created` intacta (`Crazy` permanece no espaço 0, ainda no sentido chegada → partida). |
| D21 | O stub de turno (US-05) continua sem mover camelos: após o início, preserva `Crazy` no espaço 7 e no mesmo sentido. |

---

## 7. Numeração da pista e sentidos

| Referência | Espaço / sentido |
| --- | --- |
| Atrás da linha de partida | espaço `0` |
| Primeira casa à frente da linha | espaço `1` |
| Casa 7 (manual §3.2) | espaço `7` |
| Camelos de corrida | sentido **partida → chegada** (espaço aumenta) |
| Camelo doido | sentido **chegada → partida** (espaço diminui, quando mover no futuro) |

Movimento dos camelos de corrida rumo à chegada permanece `espaço + N` (US-06). Movimento futuro de `Crazy` é rumo ao espaço 0; **não** é implementado aqui. O sentido de `Crazy` já vale na criação e após o início.

---

## 8. Procedimento (sucesso)

Dada uma partida `Created` válida (6 camelos no espaço 0; `Crazy` já no sentido chegada → partida; nenhum camelo com dono):

1. Executar a determinação das posições dos **cinco** camelos de corrida (US-06). `Crazy` **não** é alvo dessas cartas e permanece no espaço 0 durante esse passo, ainda no sentido chegada → partida.
2. Posicionar `Crazy` no espaço **7**.
3. Manter o sentido **chegada → partida** (não inverter).
4. Deixar `Crazy` sozinho nessa casa (destino vazio nesta preparação).
5. Não associar `Crazy` nem qualquer camelo de corrida a jogador.
6. Concluir o restante do início (US-04): fase `RaceSetup`, primeiro turno, persistência.

Não se revela carta de camelo doido. Não se aplica movimento extra. Não se calcula ranking.

---

## 9. Identidade, dono, sentido e classificação

Contrato desta US (sem motor de ranking):

| Afirmação | `Crazy` | Camelos de corrida |
| --- | --- | --- |
| Presente no elenco (6 no total) | Sim | Sim (cinco) |
| É camelo de corrida | **Não** | **Sim** |
| Tem jogador dono | **Não** | **Não** |
| Sentido | **Chegada → partida** | **Partida → chegada** |
| Está desclassificado | **Sim** (identidade `Crazy`) | Não |
| Pode vencer a corrida | **Não** | Sim (regras futuras) |
| Entra na classificação 1º–5º | **Não** | Sim (regras futuras) |
| Pode empilhar com os demais | **Sim** (cima, baixo ou meio) | **Sim** |

Qualquer comando futuro que classifique camelos ou declare vencedor da corrida **deve** excluir `Crazy`. Esta US não define o algoritmo de ranking.

Nenhum comando desta US (nem de histórias futuras, salvo spec explícita em contrário) deve criar dono de camelo.

---

## 10. Invariantes para movimento e pilha (abertura; sem execução nesta US)

Registrados para não se perderem os casos de borda da história. **Não** há movimento nem formação de pilha neste passo de inicialização.

A mesma regra de pilha do manual aplica-se ao camelo doido. Ele **não** fica de fora da pilha por ser desclassificado.

| Situação futura | Contrato |
| --- | --- |
| Camelo de corrida na mesma casa que `Crazy` (espaço ≥ 1) | Formam **uma** pilha de jogo. Unidade que chega **sobe** na já presente |
| `Crazy` **por cima** de outro camelo | Há camelos de corrida **por baixo** dele. Se `Crazy` se mover (chegada → partida), **não** leva os de baixo; leva só quem estiver acima dele (se houver) |
| Camelos **por baixo** de `Crazy` | Equivale a `Crazy` no topo ou no meio: os de baixo ficam se o doido sair; se o de baixo se mover rumo à chegada, **carrega** `Crazy` e os que estiverem sobre esse de baixo |
| `Crazy` **por baixo** / outros **por cima** | Camelos de corrida nas costas do doido; se o doido se mover chegada → partida, **carrega** quem está em cima. Exceção oficial futura: unidade nas costas → +1 à carta do doido |
| `Crazy` no **meio** da pilha | Válido. Acima e abaixo podem ser camelos de corrida. Quem se move leva só os de cima |
| Classificação na pilha | Mais alto = mais à frente **entre os de corrida**. `Crazy` é ignorado no ranking **em qualquer** posição da pilha |
| `Crazy` próximo à linha de partida | Só se aproxima andando chegada → partida; **não atravessa** a linha de partida; carta 0 do doido não move, salvo a exceção +1 — regras de movimento **futuras** |

Na **inicialização** desta US nenhuma dessas situações ocorre: `Crazy` está sozinho no espaço 7, no sentido chegada → partida. O contrato acima vale para quando a corrida (histórias futuras) juntar `Crazy` e camelos de corrida na mesma casa.

---

## 11. Estado imediatamente após o início (sucesso) — acréscimos desta US

Além do contrato da US-04 e da US-06 (fase, jogadores, turno, £3, cartas 5+25, posições dos camelos de corrida):

| Aspecto | Valor esperado |
| --- | --- |
| Camelo doido — identidade | `Crazy`; não é `Yellow`…`Red` |
| Camelo doido — espaço | **7** |
| Camelo doido — sentido | **Chegada → partida** (`TowardStart`) |
| Camelos de corrida — sentido | **Partida → chegada** (`TowardFinish`) |
| Todos os camelos — dono | Nenhum (os seis) |
| Camelo doido — pilha neste passo | Sozinho no espaço 7; `stackOrder` válido. Depois, pode empilhar em qualquer posição vertical (§10) |
| Camelo doido — classificação | Desclassificado (identidade `Crazy`); não pode vencer |
| Camelos de corrida — posição | Inalteradas em relação ao resultado da US-06 |
| Espaço 0 | Pode ainda ter camelos de corrida que não saíram; **não** tem `Crazy` |

O espaço 7 **não** precisa permanecer 7 nas fases seguintes (movimento e §6.3 futuros). O sentido chegada → partida de `Crazy` **permanece**.

---

## 12. Relação com criação, início e etapa

```text
createMatch                 →  Created; 6 camelos no espaço 0;
                               Crazy já no sentido chegada → partida; nenhum camelo com dono
        ↓
início US-04 + US-06        →  5 cartas; camelos de corrida posicionados;
                               Crazy ainda no 0 neste passo (mesmo sentido)
        ↓
início US-07 (este passo)   →  Crazy no espaço 7, sentido chegada → partida
        ↓
RaceSetup persistido        →  load não recoloca o doido nem inverte o sentido
        ↓
movimento / LegSetup futuro →  pilha com Crazy em cima, no meio ou embaixo;
                               doido só anda rumo à partida; ranking ignora Crazy
```

| Situação | Resultado |
| --- | --- |
| Partida `Created` válida | Início aceito → `Crazy` no espaço 7, sentido chegada → partida |
| Segundo início / já em andamento / encerrada | Rejeitado (US-04); se já iniciado, `Crazy` permanece onde o primeiro sucesso o deixou, no mesmo sentido |
| Load de partida já iniciada | Restaura espaço 7 e o sentido; **não** posiciona de novo |
| `Created` (ainda não iniciada) | `Crazy` no espaço 0, já no sentido chegada → partida |

---

## 13. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | `Crazy` existe no estado desde a criação e permanece após o início. |
| RN-02 | Na `Created`, `Crazy` está no espaço 0, no sentido chegada → partida. |
| RN-03 | O posicionamento na casa 7 ocorre só no início, depois das posições dos camelos de corrida. |
| RN-04 | No sucesso do início, `Crazy` está no espaço **7**. |
| RN-05 | `Crazy` corre **sempre** no sentido linha de chegada → linha de partida, contrário aos camelos de corrida. |
| RN-06 | Camelos de corrida correm **sempre** no sentido linha de partida → linha de chegada. |
| RN-07 | `Crazy` não é um dos cinco camelos de corrida. |
| RN-08 | **Nenhum** camelo tem dono (nem `Crazy`, nem os cinco de corrida). |
| RN-09 | `Crazy` está desclassificado: a identidade `Crazy` identifica essa condição no estado. |
| RN-10 | `Crazy` não pode vencer a corrida; classificação futura o ignora. |
| RN-11 | Nesta inicialização, `Crazy` é colocado sozinho no espaço 7. |
| RN-12 | Posições, cartas e pool da US-06 não são alterados por este passo, salvo a saída de `Crazy` do espaço 0. |
| RN-13 | Jogadores, ordem, dinheiro, turno e `playerRoundIndex` seguem a US-04. |
| RN-14 | O passo só ocorre no início a partir de `Created`; no máximo uma vez por partida. |
| RN-15 | Falha no início → rejeição total; `Created` intacta. |
| RN-16 | Persistir após sucesso; restaurar **não** reposiciona o doido nem inverte o sentido. |
| RN-17 | Espaço 7 não é invariante permanente após o início (movimento e §6.3 futuros). O sentido chegada → partida **é** permanente. |
| RN-18 | Domínio sem React/Next/`localStorage`; I/O de persistência na aplicação. |
| RN-19 | `Crazy` pode ser empilhado com camelos de corrida: pode estar por cima (outros por baixo), por baixo (outros por cima) ou no meio. A mesma regra de pilha se aplica a ele. |

---

## 14. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | Ao iniciar uma `Created` válida, após posicionar os camelos de corrida, o sistema deve colocar `Crazy` no espaço 7. |
| RF-02 | O sistema deve manter `Crazy` no sentido chegada → partida (contrário aos camelos de corrida). |
| RF-03 | O sistema deve garantir que `Crazy` continue no elenco e distinto dos cinco camelos de corrida. |
| RF-04 | O sistema deve garantir que nenhum dos 6 camelos tenha dono. |
| RF-05 | O sistema deve tratar `Crazy` como desclassificado para classificação futura (identidade `Crazy`; não pode vencer). |
| RF-06 | O sistema deve deixar `Crazy` sozinho no espaço 7 neste passo de inicialização. |
| RF-07 | O sistema deve persistir o estado após sucesso e restaurá-lo sem reexecutar o posicionamento nem inverter o sentido. |
| RF-08 | O sistema deve rejeitar segundo início sem alterar a posição nem o sentido já determinados de `Crazy`. |
| RF-09 | O sistema deve tratar `Crazy` como participante da mesma regra de pilha dos demais: permitido por cima, por baixo ou no meio (contrato para movimento futuro; não executado nesta US). |

---

## 15. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Independência de UI: domínio sem React/Next. |
| RNF-02 | Determinismo: o mesmo `Created` válido + a mesma sequência US-06 produzem o mesmo `Crazy` no espaço 7, no sentido chegada → partida. |
| RNF-03 | Atomicidade: sucesso total do início ou rejeição com `Created` preservada. |
| RNF-04 | Serialização: espaço e sentido de `Crazy` sobrevivem a round-trip JSON / `localStorage`. |
| RNF-05 | Compatibilidade: US-01 (elenco de 6, pilha distinta, sem dono), US-04 (fase, turno) e US-06 (posições dos de corrida, pool) permanecem, com o refinamento D12. |

---

## 16. Critérios de aceite

- [ ] O camelo doido existe no estado da partida (criação e após o início).
- [ ] Após o início bem-sucedido, a posição inicial do camelo doido é a casa 7 (espaço 7).
- [ ] O camelo doido corre no sentido contrário aos de corrida: **sempre** linha de chegada → linha de partida.
- [ ] Os camelos de corrida correm no sentido linha de partida → linha de chegada.
- [ ] Nenhum camelo tem dono (nem o doido, nem os cinco de corrida).
- [ ] O camelo doido não é considerado um dos cinco camelos de corrida.
- [ ] O camelo doido não pode vencer a corrida (contrato de desclassificação).
- [ ] O estado identifica o camelo doido como desclassificado para classificação (identidade `Crazy`).
- [ ] Na inicialização, nenhum camelo de corrida compartilha a casa 7 com o doido.
- [ ] O camelo doido pode ser empilhado com outros camelos: pode estar por cima (outros por baixo) ou por baixo (outros por cima), inclusive no meio (contrato de pilha; não ocorre neste passo).
- [ ] Reload não recoloca o camelo doido nem inverte o sentido.

---

## 17. Cenários de comportamento

### 17.1 Inicialização válida

```gherkin
Feature: Inicializar camelo doido

  Scenario: Início posiciona o camelo doido na casa 7 após os camelos de corrida
    Given uma partida válida na fase Created
    And os seis camelos estão no espaço 0
    And Crazy está no sentido linha de chegada para linha de partida
    And os camelos de corrida estão no sentido linha de partida para linha de chegada
    When o domínio inicia a partida
    Then a operação é aceita
    And a fase passa a ser RaceSetup
    And Crazy ocupa o espaço 7
    And Crazy permanece no sentido linha de chegada para linha de partida
    And os cinco camelos de corrida permanecem no sentido linha de partida para linha de chegada
    And os cinco camelos de corrida estão nas posições determinadas pelas 5 cartas
    And Crazy não está no espaço 0
```

### 17.2 Criação ainda não posiciona o doido

```gherkin
  Scenario: Na Created o camelo doido permanece na largada no sentido contrário
    Given uma partida recém-criada válida
    Then Crazy existe no estado
    And Crazy ocupa o espaço 0
    And Crazy está no sentido linha de chegada para linha de partida
```

### 17.3 Identidade, ausência de dono e desclassificação

```gherkin
  Scenario: Nenhum camelo tem dono; Crazy não é camelo de corrida
    Given uma partida iniciada com sucesso
    Then o elenco contém exatamente um camelo com identidade Crazy
    And Crazy não está entre Yellow, Green, Blue, Purple e Red
    And nenhum dos seis camelos está associado a um jogador
    And Crazy está desclassificado para classificação
    And Crazy não pode vencer a corrida

  Scenario: O sentido do doido é sempre o contrário dos de corrida
    Given uma partida Created ou já iniciada
    Then Crazy está no sentido linha de chegada para linha de partida
    And cada camelo de corrida está no sentido linha de partida para linha de chegada
```

### 17.4 Destino vazio na inicialização (borda da história, neste passo)

```gherkin
  Scenario: Nenhum camelo de corrida está na casa 7 no instante do posicionamento
    Given um início bem-sucedido
    Then Crazy está sozinho no espaço 7
    And nenhum camelo de corrida ocupa o espaço 7
```

### 17.5 Persistência e segundo início

```gherkin
  Scenario: Reload não reposiciona o camelo doido nem inverte o sentido
    Given uma partida recém-iniciada persistida
    When o estado é restaurado
    Then Crazy permanece no espaço 7
    And Crazy permanece no sentido linha de chegada para linha de partida
    And nenhum novo posicionamento ocorre

  Scenario: Segundo início não move o camelo doido de novo
    Given uma partida já iniciada com Crazy no espaço 7
    When o domínio tenta iniciar novamente
    Then a operação é rejeitada
    And Crazy permanece no espaço 7
    And Crazy permanece no sentido linha de chegada para linha de partida
```

### 17.6 Invariantes futuras de pilha (documentadas; sem movimento nesta US)

```gherkin
  Scenario: Crazy pode empilhar em qualquer posição vertical
    Given Crazy e um ou mais camelos de corrida no mesmo espaço ≥ 1 em uma história futura
    Then eles formam uma única pilha de jogo
    And Crazy pode estar por cima de outro camelo
    And podem existir camelos de corrida por baixo de Crazy
    And Crazy pode estar por baixo com camelos de corrida por cima
    And Crazy pode estar no meio da pilha
    And Crazy continua desclassificado e ignorado na classificação em qualquer dessas posições
    And quem se move leva apenas os que estão em cima
    And esta US não executa esse movimento
```

---

## 18. Dependências e restrições

| Tipo | Descrição |
| --- | --- |
| US-01 | Elenco de 6 camelos, espaço + `stackOrder`, direção de `Crazy`, sem dono |
| US-04 | Início `Created` → `RaceSetup`, atomicidade, persistência, segundo início rejeitado |
| US-06 | Posições dos camelos de corrida no mesmo início; **refinada** quanto a `Crazy` no espaço 0 após o sucesso |
| Persistência | Load não reexecuta início |
| Regras oficiais | `docs/rules/corrida_camelo_regras.md` §3.2 (casa 7, direção oposta), §§5.1–5.3 (pilha e desclassificação), §9 (ignorar na classificação) |
| Restrição | Não alterar identificadores `Crazy` / `TowardStart` / `TowardFinish` já estabelecidos |
| Adaptação | Desclassificação expressa pela identidade `Crazy`, sem atributo extra nesta US; ausência de dono vale para os **seis** camelos |

---

## 19. Rastreabilidade da história

| Critério / caso da história | Cobertura |
| --- | --- |
| Doido criado no estado inicial | RN-01, D7, §17.2 |
| Posição inicial casa 7 | RN-03, RN-04, D5, RF-01, §17.1 |
| Orientação oposta / sempre chegada → partida | RN-05, RN-06, D6, RF-02, §7, §17.1, §17.3 |
| Nenhum camelo tem dono | RN-08, D9, RF-04, §9, §17.3 |
| Não é um dos cinco de corrida | RN-07, D8, RF-03, §17.3 |
| Não pode vencer | RN-10, D11, RF-05, §17.3 |
| Estado identifica desclassificado | RN-09, D10, §9, §17.3 |
| Mesma casa / Crazy por cima / outros por baixo / Crazy por baixo | D14–D15, RN-19, RF-09, §10, §17.4 (neste passo vazio), §17.6 |
| Perto da linha de partida | D16, §10 (só no sentido chegada → partida) |

---

## 20. Aberturas explícitas (não bloqueantes)

- Movimento do camelo doido **já empilhado** (cartas 0/1/2, exceção +1 com unidade nas costas, só no sentido chegada → partida, sem atravessar a linha de partida; carregar os de cima estando o doido em qualquer posição da pilha).
- Reposicionamento na preparação de etapa (`docs/rules` §6.3), **mantendo** o sentido chegada → partida.
- Motor de classificação e fim de corrida (vencedor/perdedor), sempre ignorando `Crazy`.
- UI distinta para o Crazy Camel e sua direção (`docs/game/game-design.md` §17).
- Nome interno de constantes de espaço (ex. “espaço da casa 7”) — fica a cargo do plan; o comportamento (espaço **7**) é obrigatório.
- Campo dedicado de desclassificação, se uma US futura preferir não depender só da identidade `Crazy`.
