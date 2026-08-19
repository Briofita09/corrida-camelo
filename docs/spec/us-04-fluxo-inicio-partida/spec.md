# Spec — US-04 Criar fluxo de início da partida

| Campo | Valor |
| --- | --- |
| ID | US-04 |
| Feature | `us-04-fluxo-inicio-partida` |
| História | Como jogador, quero iniciar uma partida configurada, para que o jogo prepare todos os componentes necessários e coloque a partida no estado inicial. |
| Status | Pronta para planejamento |
| Fonte | História US-04 + respostas de completude + `AGENTS.md` + US-01, US-02 e US-03 |

---

## 1. Objetivo

Definir o **fluxo de início** de uma partida já configurada e criada: validar que ela pode ser iniciada, confirmar o estado inicial da corrida, definir o primeiro turno e transitar a partida para **iniciada**, de forma **atômica**, **determinística** e **sem alterar a configuração**.

Esta feature **não** implementa UI, regras de movimento/apostas/baralho, IA de bots nem multiplayer em rede. O núcleo é o comando de início sobre uma partida em `Created`.

---

## 2. Contexto

- Produto Mobile First / local-first (`AGENTS.md`).
- Fluxo de produto (`docs/game/game-design.md` §§53–54): Nova partida → modo → jogadores → bots → **Iniciar**.
- US-02 gera partida na fase `Created` a partir de configuração válida; **não** inicia.
- US-01 já define a transição `Created` → `RaceSetup` e rejeita iniciar fora de `Created` ou em `Finished`.
- US-03 sorteia a ordem na **criação** (`players`); `startMatch` **não** reordena; rodada 0 começa em `players[0]`.
- Persistência de partida (`localStorage`) já existe (US-03). O estado **após** o início deve ser persistido para reload não “re-iniciar” nem resortear.
- Hoje o início **não** grava o jogador do primeiro turno (`currentTurnPlayerId` permanece nulo).

---

## 3. Atores

| Ator | Papel nesta feature |
| --- | --- |
| Jogador (humano) | Dispara o início da partida já configurada (via UI futura; sem tela nesta US) |
| Sistema / Domínio | Valida, inicia, define o primeiro turno, rejeita tentativas inválidas |
| Camada de aplicação / persistência | Após início bem-sucedido, persiste o estado iniciado; no load **não** inicia de novo |
| Bot | Já está registrado na partida; não inicia a partida por conta própria nesta US |
| UI futura | Consome o comando de início; **fora** do escopo de implementação desta US |

---

## 4. Escopo

### 4.1 Dentro do escopo

- Iniciar uma **partida já criada** na fase `Created` ( proveniente de configuração válida da US-02 / criação US-01).
- Exigir que **todos os jogadores** daquela partida estejam registrados e presentes no estado iniciado.
- Confirmar/preservar os **componentes iniciais da corrida** já definidos na criação (ver §7): jogadores, camelos na largada, pontuação inicial, ordem US-03.
- Definir o **primeiro turno** no estado iniciado.
- Transitar a fase para `RaceSetup` (equivalente de produto a “partida em andamento / `in_progress`” — ver D2).
- Impedir alteração da configuração da partida após o início.
- Garantir estado **válido** e **determinístico** após o início.
- Rejeitar: configuração inválida como origem de início; segundo início; partida já em andamento; partida encerrada; inicialização que deixaria estado parcial/inválido.
- Persistir o estado **iniciado** (fase + turno) para sobreviver a reload, sem novo sorteio e sem novo início.
- Registrar a regra de **no máximo uma transição de início bem-sucedida** (base para concorrência futura).

### 4.2 Fora do escopo

- Telas, rotas ou botão visual “Iniciar”.
- Gerar a partida a partir da config **dentro** do comando de início (US-02 continua sendo o passo de gerar `Created`).
- Nova fase de domínio chamada `in_progress`.
- Avançar para `LegInProgress`, `LegSetup` ou demais fases.
- Baralho da perna, apostas, comprimento da pista, sandstorm, fennec, atalho, pirâmide, mãos/cartas privadas.
- Re-sortear jogadores ou camelos no início.
- IA dos bots.
- Servidor, lock distribuído, WebSocket ou multiplayer online (só a **regra** de um único início bem-sucedido).
- Persistência de rascunho de `MatchConfig`.

---

## 5. Glossário

| Termo | Definição |
| --- | --- |
| Configuração válida | `MatchConfig` que passa nas regras da US-02 (modo + participantes) |
| Partida criada | `MatchState` na fase `Created`, gerada a partir de configuração/criação válida |
| Iniciar a partida | Comando de domínio que, a partir de `Created` válida, produz o estado inicial da corrida na fase `RaceSetup` |
| Partida iniciada | Partida cuja fase **não** é mais `Created` (nesta US: `RaceSetup`) |
| Partida em andamento | Qualquer fase posterior a `Created` e diferente de `Finished` (`RaceSetup`, `LegSetup`, `LegInProgress`, `LegPayout`, `FinalPayout`) |
| `in_progress` (história) | Linguagem de produto para “partida já iniciada”; **não** é identificador de fase do domínio |
| Primeiro turno | Jogador autorizado a ser o primeiro da rodada 0: o primeiro da ordem base (`players[0]`) |
| Estado inicial da corrida (desta US) | Jogadores registrados, camelos na largada, £3, ordem US-03, `playerRoundIndex` 0, primeiro turno definido, fase `RaceSetup` |
| Inicialização atômica | Ou o início completa com estado válido, ou é rejeitado e o estado anterior permanece intacto — sem “meio iniciada” |
| Configuração da partida | Modo, participantes, nomes, tipos e dificuldade dos bots já materializados na partida; após o início, imutáveis |

---

## 6. Premissas e decisões de produto

| ID | Decisão |
| --- | --- |
| D1 | O início opera sobre uma partida **já criada** em `Created`. Não gera a partida de novo nem sorteia de novo. |
| D2 | O aceite “mudar para `in_progress`” mapeia para a fase de domínio **`RaceSetup`**. Não se cria fase `in_progress`. Não se pula para `LegInProgress`. |
| D3 | Ao iniciar com sucesso, `currentTurnPlayerId` = identificador de `players[0]` (primeiro da rodada 0, US-03). |
| D4 | `playerRoundIndex` permanece **0** no início; o início **não** avança rodada. |
| D5 | Componentes inicializados nesta US = baseline US-01 + US-03: lista completa de jogadores, 6 camelos no espaço 0 com pilha válida, £3 por jogador, ordem base já sorteada. Sem baralho, apostas, pista por nº de jogadores ou fennec. |
| D6 | Camelos e dinheiro **não** são re-inicializados com novos valores aleatórios no início: preservam o estado válido da criação (posições iniciais e £3). |
| D7 | Sem UI nesta US; o fluxo é comando de domínio + persistência do estado iniciado. |
| D8 | Segunda tentativa de início (mesmo comando duas vezes, ou início com fase já ≠ `Created`) → **rejeitada**; estado permanece o da primeira transição bem-sucedida (ou o anterior, se a primeira também falhou). |
| D9 | Multiplayer futuro: no máximo **uma** transição de início bem-sucedida por partida. Nesta US não há servidor/lock; a regra de rejeição do segundo início é o contrato. |
| D10 | Falha ou invariante quebrada → rejeição **total**; não existe partida “parcialmente iniciada” aceita ou persistida como iniciada. |
| D11 | Após início bem-sucedido, persistir o novo estado (fase `RaceSetup` + primeiro turno). Reload restaura esse estado; **não** executa início de novo nem sorteio. |
| D12 | Após iniciar, não é permitido alterar modo, elenco, nomes, tipos ou dificuldade dos bots daquela partida. Rascunho de `MatchConfig` restante **não** altera a partida iniciada. |
| D13 | O início é **determinístico**: a mesma partida `Created` válida produz sempre o mesmo estado iniciado (sem RNG no início). |
| D14 | US-01 permitia `currentTurnPlayerId` nulo fora de `LegInProgress`. Esta US **refine**: após início bem-sucedido, o turno **deve** estar preenchido em `RaceSetup`. Em `Created`, continua nulo. |

---

## 7. Estado imediatamente após o início (sucesso)

Dada uma partida `Created` válida, o estado iniciado deve satisfazer:

| Aspecto | Valor esperado |
| --- | --- |
| Fase | `RaceSetup` |
| Jogadores | Os mesmos da criação (mesmos ids, nomes, tipos, dificuldades); 2–6; ≥1 humano; nenhum omitido ou extra |
| Ordem base | Array `players` **inalterado** (US-03) |
| `playerRoundIndex` | `0` |
| Turno atual | `currentTurnPlayerId` = `players[0].id` (não nulo) |
| Dinheiro | Cada jogador com **3** £ |
| Camelos | Os 6 camelos; espaço de largada **0**; ordens de pilha distintas; Crazy com direção oposta à dos de corrida |
| Encerramento | Não é `Finished` |
| Identidade | Mesmo `id` de partida |

O estado deve passar na validação de invariantes da US-01 (com o refinamento D14 para o turno em `RaceSetup` pós-início).

---

## 8. Relação com a configuração

```text
MatchConfig válida  →  (US-02)  →  Partida Created  →  (US-04)  →  Partida RaceSetup
```

| Situação | Resultado |
| --- | --- |
| Configuração inválida (US-02) | Não gera partida iniciável; tentativa de “iniciar a partir dessa config” é **rejeitada**; nenhuma partida iniciada |
| Configuração válida, partida ainda não criada | O início desta US **não** cria a partida; o fluxo de produto exige gerar `Created` antes. Sem partida `Created`, o início é **rejeitado** |
| Partida `Created` válida | Início aceito → `RaceSetup` + primeiro turno |
| Partida já iniciada / encerrada | Início **rejeitado** |

Após o início, a fonte da verdade daquele jogo é o estado da **partida**. Mutar o rascunho de configuração (se ainda existir em memória) **não** retroage sobre a partida iniciada.

---

## 9. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Só se inicia partida na fase `Created`. |
| RN-02 | A partida a iniciar deve ser **válida** (invariantes US-01/US-03: jogadores, camelos, dinheiro, ordem, `playerRoundIndex`). Estado inválido → início rejeitado. |
| RN-03 | Não se inicia a partir de configuração inválida: nenhuma partida `RaceSetup` é produzida. |
| RN-04 | No sucesso, todos os jogadores da `Created` permanecem registrados no estado iniciado (mesmo conjunto, mesma ordem). |
| RN-05 | No sucesso, fase = `RaceSetup`. |
| RN-06 | No sucesso, `currentTurnPlayerId` = `players[0].id`. |
| RN-07 | No sucesso, camelos permanecem nas posições iniciais válidas da criação (espaço 0, pilha consistente). |
| RN-08 | No sucesso, pontuação de cada jogador permanece 3 £. |
| RN-09 | O início **não** altera a ordem de `players` nem `playerRoundIndex`. |
| RN-10 | Segunda chamada de início sobre a mesma partida (já `RaceSetup` ou outra fase ≠ `Created`) → rejeitada; estado inalterado. |
| RN-11 | Início sobre fase de andamento (`RaceSetup` … `FinalPayout`) → rejeitada. |
| RN-12 | Início sobre `Finished` → rejeitada (mutação proibida). |
| RN-13 | Se qualquer passo da inicialização falharia (invariante, dados incompletos), a operação inteira é rejeitada; o estado `Created` de origem permanece intacto. |
| RN-14 | Não é aceito nem persistido estado “parcialmente iniciado” (ex.: fase `RaceSetup` sem turno, ou turno definido com fase ainda `Created`, ou lista de jogadores/camelos incompleta). |
| RN-15 | Após início bem-sucedido, configuração daquela partida é imutável (elenco, modo implícito, dificuldades). |
| RN-16 | Persistência: gravar o estado iniciado; restaurar **não** dispara novo início. |
| RN-17 | Determinismo: mesmas entradas `Created` válidas → mesmo estado iniciado. |
| RN-18 | No máximo uma transição de início bem-sucedida por partida (aplica-se a tentativas sequenciais agora e concorrentes no futuro). |
| RN-19 | Domínio de início sem React/Next/`localStorage`; I/O de persistência na aplicação. |

---

## 10. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve **iniciar** uma partida `Created` válida, produzindo o estado da §7. |
| RF-02 | O sistema deve **rejeitar** início quando não houver partida `Created` válida (incluindo tentativa a partir de configuração inválida ou ausente). |
| RF-03 | O sistema deve **definir** o primeiro turno (`players[0]`) no sucesso. |
| RF-04 | O sistema deve **preservar** jogadores, ordem, camelos iniciais e £3. |
| RF-05 | O sistema deve **rejeitar** segundo início, partida em andamento e partida encerrada, sem alterar o estado. |
| RF-06 | O sistema deve **falhar de forma explícita** (resultado de rejeição) em inicialização inválida, sem deixar estado parcial aceito. |
| RF-07 | O sistema deve **persistir** o estado após início bem-sucedido e **restaurá-lo** sem reexecutar o início. |
| RF-08 | O sistema deve impedir que a configuração da partida iniciada seja alterada (elenco / dificuldades / modo materializado). |

---

## 11. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Independência de UI: domínio de início sem React/Next. |
| RNF-02 | Atomicidade: sucesso total ou rejeição com estado anterior preservado. |
| RNF-03 | Determinismo do início (sem nova aleatoriedade nesta operação). |
| RNF-04 | Testabilidade sem browser; persistência testável com fake/mock de storage. |
| RNF-05 | Compatibilidade: partida iniciada continua válida segundo US-01 (com D14) e US-03. |
| RNF-06 | Preparação a concorrência futura: a regra RN-18 não depende de haver um único cliente, mas esta US não implementa transporte de rede. |

---

## 12. Critérios de aceite

- [ ] Uma partida só é iniciada a partir de origem válida (configuração válida → partida `Created` válida).
- [ ] Ao iniciar, todos os jogadores estão registrados no estado (mesmo conjunto da criação).
- [ ] Os componentes iniciais da corrida desta US estão presentes (jogadores, camelos na largada, £3, ordem).
- [ ] Os camelos começam (permanecem) nas posições iniciais.
- [ ] A pontuação inicial dos jogadores é 3 £.
- [ ] O primeiro turno está definido (`currentTurnPlayerId` = `players[0].id`).
- [ ] A partida passa para o estado iniciado de produto (`RaceSetup`, mapeamento de `in_progress`).
- [ ] Após iniciar, a configuração daquela partida não pode mais ser alterada.
- [ ] O estado iniciado é determinístico e válido (invariantes).
- [ ] Configuração inválida não inicia partida.
- [ ] Iniciar duas vezes a mesma partida: segunda rejeitada.
- [ ] Iniciar partida já em andamento: rejeitado.
- [ ] Iniciar partida encerrada: rejeitado.
- [ ] Falha na inicialização: rejeição total, sem estado parcial.
- [ ] Estado parcialmente inicializado: rejeitado / não aceito como iniciado.
- [ ] Duas tentativas de início (sequenciais agora; concorrentes no futuro): no máximo uma bem-sucedida.

---

## 13. Cenários de comportamento

### 13.1 Início válido

```gherkin
Feature: Fluxo de início da partida

  Scenario: Iniciar partida Created válida
    Given uma configuração válida já transformada em partida na fase Created
    And a ordem base é [A, B, C]
    And todos os jogadores têm 3 libras
    And os 6 camelos estão no espaço 0
    And currentTurnPlayerId é nulo
    When o domínio inicia a partida
    Then a operação é aceita
    And a fase passa a ser RaceSetup
    And os jogadores continuam sendo exatamente A, B e C na mesma ordem
    And currentTurnPlayerId é o identificador de A
    And playerRoundIndex permanece 0
    And o dinheiro de cada jogador permanece 3
    And os camelos permanecem no espaço 0 com pilha válida
    And a partida Created de origem permanece inalterada (comando sem mutação in-place)
```

### 13.2 Configuração inválida e ausência de Created

```gherkin
  Scenario: Tentar iniciar a partir de configuração inválida
    Given uma configuração inválida (ex.: SinglePlayerVsBots sem bots, ou nomes duplicados)
    When se tenta iniciar a partida a partir dessa configuração
    Then a operação é rejeitada
    And nenhuma partida na fase RaceSetup é produzida

  Scenario: Tentar iniciar sem partida Created
    Given que não existe partida na fase Created
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada
```

### 13.3 Segundo início, em andamento e encerrada

```gherkin
  Scenario: Tentar iniciar duas vezes a mesma partida
    Given uma partida válida que já foi iniciada com sucesso (fase RaceSetup)
    When o domínio tenta iniciar a partida novamente
    Then a operação é rejeitada
    And a fase permanece RaceSetup
    And currentTurnPlayerId permanece o definido no primeiro início

  Scenario: Tentar iniciar partida já em andamento
    Given uma partida na fase RaceSetup ou posterior, exceto Finished
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada
    And a fase permanece inalterada

  Scenario: Tentar iniciar partida encerrada
    Given uma partida na fase Finished
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada
    And o estado permanece o mesmo
```

### 13.4 Falha, estado parcial e concorrência

```gherkin
  Scenario: Falha durante a inicialização
    Given uma partida Created que não satisfaz os invariantes necessários para iniciar
    When o domínio tenta iniciar a partida
    Then a operação é rejeitada
    And não existe estado iniciado aceito
    And a partida Created de origem permanece intacta

  Scenario: Estado parcialmente inicializado não é aceito
    Given um estado com fase RaceSetup mas sem currentTurnPlayerId
    Or com currentTurnPlayerId definido mas fase ainda Created
    Or com lista de jogadores ou camelos incompleta após um “início”
    When o domínio valida ou tenta persistir/usar esse estado como partida iniciada
    Then o estado é rejeitado como inválido para partida iniciada

  Scenario: Duas tentativas de início da mesma partida
    Given uma partida Created válida
    When duas tentativas de início ocorrem sobre essa partida
    Then no máximo uma é aceita
    And a outra é rejeitada
    And o estado resultante, se houver sucesso, é um único RaceSetup com o primeiro turno definido
```

### 13.5 Configuração congelada, determinismo e persistência

```gherkin
  Scenario: Após iniciar, a configuração não pode ser alterada
    Given uma partida já iniciada
    When se tenta alterar participantes, nomes ou dificuldade dos bots dessa partida
    Then a alteração é rejeitada
    And o estado da partida permanece o mesmo

  Scenario: Início determinístico
    Given a mesma partida Created válida
    When o início é executado duas vezes de forma independente sobre cópias idênticas
    Then os estados iniciados resultantes são semanticamente equivalentes

  Scenario: Persistência do estado iniciado
    Given uma partida recém-iniciada com sucesso
    When o estado é persistido e depois restaurado (equivalente a recarregar a página)
    Then a fase restaurada é RaceSetup
    And currentTurnPlayerId é o mesmo
    And a ordem de players é a mesma
    And nenhum novo início nem sorteio ocorre
```

---

## 14. Dependências e restrições

| Tipo | Descrição |
| --- | --- |
| US-01 | Fases, `startMatch` `Created` → `RaceSetup`, invariantes, rejeição em `Finished`, camelos/£ iniciais |
| US-02 | Só configuração válida gera `Created`; rascunho não persiste; dificuldade imutável após gerar |
| US-03 | Ordem = `players`; início não reordena; rodada 0 começa em `players[0]`; persistência `localStorage` |
| AGENTS.md | Domínio fora da UI; I/O em `application/`; local-first; sem servidor no MVP |
| Restrição | Spec independente de pastas/libs; identificadores de fase e APIs existentes são contratos de produto já estabelecidos |

---

## 15. Rastreabilidade da história

| Critério / caso da história | Cobertura |
| --- | --- |
| Só iniciar a partir de configuração válida | RN-01–RN-03, RF-02, §8, §13.2 |
| Todos os jogadores registrados | RN-04, RF-04, §7, §13.1 |
| Componentes da corrida inicializados | D5, RN-04–RN-08, §7 |
| Camelos nas posições iniciais | RN-07, D6, §13.1 |
| Pontuação inicial definida | RN-08, §7 |
| Primeiro turno definido | D3, RN-06, RF-03, §13.1 |
| Estado `in_progress` | D2, RN-05 (fase `RaceSetup`) |
| Configuração imutável após iniciar | D12, RN-15, RF-08, §13.5 |
| Estado determinístico válido | D13, RN-17, RNF-03, §13.5 |
| Configuração inválida | RN-03, §13.2 |
| Iniciar duas vezes | D8, RN-10, §13.3 |
| Já em andamento | RN-11, §13.3 |
| Encerrada | RN-12, §13.3 |
| Falha na inicialização | D10, RN-13, RF-06, §13.4 |
| Estado parcialmente inicializado | RN-14, §13.4 |
| Dois jogadores iniciando (futuro multiplayer) | D9, RN-18, RNF-06, §13.4 |

---

## 16. Aberturas explícitas (não bloqueantes)

- UI do botão “Iniciar” e do fluxo visual Nova partida → Iniciar.
- Conteúdo de `LegSetup` / `LegInProgress` (baralho, apostas, ações de turno).
- Comprimento da pista, sandstorm, fennec, reveal oficial de cartas de posição.
- Semântica de turno nas fases posteriores a `RaceSetup` (além de preservar o id até a feature de perna redefinir).
- Implementação de lock/servidor para concorrência real; apenas a regra de um único início é fixada aqui.
- Orquestração fina persistir-antes vs. persistir-depois no plan (o contrato é: sucesso durável = estado iniciado completo; falha de I/O não grava estado parcial iniciado).
