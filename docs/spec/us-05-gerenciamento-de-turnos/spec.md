# Spec — US-05 Implementar gerenciamento de turnos

| Campo | Valor |
| --- | --- |
| ID | US-05 |
| Feature | `us-05-gerenciamento-de-turnos` |
| História | Como jogador, quero que o sistema controle o turno atual, para que somente o jogador correto possa realizar uma ação. |
| Status | Pronta para planejamento |
| Fonte | História de produto (rotulada US-04 pelo time) + respostas de completude + `AGENTS.md` + US-01, US-03 e US-04 |

---

## 1. Objetivo

Definir o **gerenciamento de turnos** da partida: identificar o jogador ativo no estado, autorizar apenas esse jogador a executar uma ação de turno, e **avançar o turno** somente como efeito de uma ação válida, respeitando a sequência da **rodada corrente** (US-03).

Esta feature **não** implementa UI, regras de mesa (movimento, apostas, baralho), IA de bots nem desconexão em rede. O núcleo é o contrato de autorização + avanço de turno no domínio, com persistência do estado após o avanço.

---

## 2. Contexto

- Produto Mobile First / local-first (`AGENTS.md`).
- US-01: estado da partida inclui `currentTurnPlayerId`; mutações em `Finished` são rejeitadas.
- US-03: ordem base = array `players`; sequência da rodada `r` começa em `P[r mod n]` e percorre todos os jogadores uma vez.
- US-04: ao iniciar (`Created` → `RaceSetup`), `currentTurnPlayerId` = `players[0].id` e `playerRoundIndex` permanece `0`. O início **não** avança turno nem rodada.
- Ainda **não** existem ações de jogo reais. Nesta US, a “ação válida” é um **comando de domínio genérico (stub)** que não altera o tabuleiro; serve para provar autorização e avanço. Ações futuras devem reutilizar o mesmo contrato.
- A história de produto chegou rotulada como “US-04”; no repositório a US-04 já é o fluxo de início. Esta spec é **US-05** e **não** substitui `docs/spec/us-04-fluxo-inicio-partida/`.

---

## 3. Atores

| Ator | Papel nesta feature |
| --- | --- |
| Jogador ativo | Único autorizado a executar a ação de turno corrente |
| Jogador fora do turno | Pode tentar agir; a tentativa é **rejeitada** |
| Sistema / Domínio | Identifica o ativo, autoriza ou rejeita, avança turno/rodada no sucesso |
| Camada de aplicação / persistência | Após ação bem-sucedida, persiste o estado; no load **não** reexecuta a ação nem troca o turno |
| Bot | Participa da ordem como qualquer jogador; nesta US não decide sozinho (sem IA) |
| UI futura | Despacha a ação com a identidade do jogador; **fora** do escopo de implementação desta US |

---

## 4. Escopo

### 4.1 Dentro do escopo

- Exigir que uma partida **iniciada** (não `Created`, não `Finished`) possua um **jogador ativo** identificável no estado (`currentTurnPlayerId` de um jogador existente).
- Autorizar a ação de turno **somente** se o ator for o jogador ativo.
- Avançar o turno **somente** como efeito de uma ação de turno **válida e aceita**.
- Respeitar a sequência da rodada corrente (US-03).
- Após o **último** da sequência da rodada, incrementar a rodada e atribuir o turno ao **primeiro da nova sequência**.
- Rejeitar ação de quem não está no turno; rejeitar avanço de turno sem ação válida; rejeitar segunda conclusão do mesmo turno (já avançado).
- Rejeitar qualquer ação/avanço de turno em partida `Finished`.
- Rejeitar ação em partida `Created` (não há jogador ativo).
- Funcionar com 2 jogadores e com o máximo (6).
- Persistir o estado após avanço bem-sucedido (reload preserva de quem é a vez).
- Manter o gerenciamento **independente da interface**.

### 4.2 Fora do escopo

- Telas, indicadores visuais de “sua vez”, passagem de celular (pass-and-play).
- Regras de mesa: movimento, apostas, baralho, fennec, atalho, pirâmide, pagamentos.
- Terminar a partida como efeito do stub (o stub **não** encerra a partida).
- Comando público de “pular turno” ou “avançar rodada” sem ação válida.
- Alterar a ordem base (`players`) ou re-sortear.
- IA de bots.
- Desconexão / abandono de jogador durante o turno (regra futura).
- Servidor, lock, WebSocket ou multiplayer online.
- Substituir ou redefinir o fluxo de início (US-04).

---

## 5. Glossário

| Termo | Definição |
| --- | --- |
| Jogador ativo | Jogador cujo identificador está em `currentTurnPlayerId` |
| Ordem base | Array `players` após o sorteio da criação (US-03); **não** muda nesta US |
| Rodada corrente | Rodada `r` = `playerRoundIndex` |
| Sequência da rodada | `P[r mod n], P[(r+1) mod n], …, P[(r+n-1) mod n]` (US-03) |
| Ação de turno (desta US) | Comando de domínio **stub**: declara o jogador ator, não altera camelos/dinheiro/fase/elenco; no sucesso, avança o turno (e a rodada, se for o último da sequência) |
| Ação válida | Ação de turno cujo ator é o jogador ativo, a partida admite ações de turno (§7) e o estado de origem é válido |
| Avanço de turno | Efeito colateral obrigatório de uma ação válida: `currentTurnPlayerId` passa a ser o próximo da sequência da rodada, ou o primeiro da próxima rodada se o ator era o último |
| Último da rodada | Último jogador da sequência da rodada corrente (não necessariamente o último da ordem base) |

---

## 6. Premissas e decisões de produto

| ID | Decisão |
| --- | --- |
| D1 | Identificador de história no repositório: **US-05**. Não sobrescreve a US-04 de início. |
| D2 | O jogador ativo **já existe** após o início (US-04). Esta US **consome** `currentTurnPlayerId`; não redefine o primeiro turno. |
| D3 | A sequência de turnos obedece a **US-03** (não é ciclo simples A→B→C→A na ordem base). |
| D4 | Ainda sem ações de mesa: a ação desta US é um **stub** de domínio. Ações futuras devem obedecer o mesmo contrato de autorização e avanço. |
| D5 | **Não há skip**: o turno (e a rodada) só mudam como efeito de uma ação de turno aceita. Não existe comando de sucesso que apenas “avance o turno”. |
| D6 | Segunda tentativa de concluir o **mesmo** turno: após o sucesso, o ativo já é outro; a nova tentativa do jogador anterior é **fora do turno** e é rejeitada. Não há “avançar duas vezes” com sucesso. |
| D7 | Sem UI nesta US; domínio + persistência do estado após sucesso. |
| D8 | Stub **não** altera fase, camelos, dinheiro, ordem `players`, elenco nem encerra a partida. |
| D9 | Partida `Finished`: nenhuma ação de turno e nenhum avanço. O stub não produz `Finished`. |
| D10 | Desconexão durante o turno: **fora desta US** (abertura §16). |
| D11 | Persistência: após ação aceita, gravar o novo turno (e rodada, se mudou). Reload restaura; **não** reexecuta a ação. |
| D12 | Determinismo: mesma partida + mesmo ator autorizado → mesmo próximo ativo (e mesma rodada seguinte, se couber). Sem RNG nesta operação. |
| D13 | Atomicidade: sucesso total com novo estado, ou rejeição com estado de origem intacto. |
| D14 | Com 2 jogadores, a US-03 implica que o último da rodada 0 (`B`) é seguido pelo primeiro da rodada 1 (`B`): o mesmo jogador pode ter **dois turnos consecutivos** na fronteira de rodada. Isso é comportamento esperado, não anomalia. |

---

## 7. Quando a partida admite ações de turno

| Situação | Ações de turno |
| --- | --- |
| Fase `Created` (`currentTurnPlayerId` nulo) | **Não** — rejeitar |
| Partida iniciada com jogador ativo existente (`RaceSetup` pós US-04; também `LegInProgress` se o estado já tiver turno válido) | **Sim** — autorizar se o ator for o ativo |
| Fase em que o turno não identifica jogador existente | **Não** — rejeitar |
| Fase `Finished` | **Não** — rejeitar |

O stub desta US **não** avança a fase (permanece na fase de origem no sucesso).

---

## 8. Avanço de turno e de rodada

Seja a ordem base `[P0, P1, …, P(n-1)]`, a rodada corrente `r`, e a sequência `S = getRoundPlayerSequence(players, r)` (conceito US-03).

O jogador ativo deve ser `S[k]` para algum índice `k` (0 ≤ k < n).

Após ação válida do ativo:

| Posição do ativo em `S` | Novo estado |
| --- | --- |
| Não é o último (`k < n-1`) | `currentTurnPlayerId` = id de `S[k+1]`; `playerRoundIndex` **inalterado**; `players` inalterado |
| É o último (`k = n-1`) | `playerRoundIndex` = `r + 1`; `currentTurnPlayerId` = id do **primeiro** da sequência da nova rodada (`S'` de `r+1`, ou seja `P[(r+1) mod n]`); `players` inalterado |

### Exemplo (ordem base A, B, C, D)

| Rodada | Sequência | Após ação de… | Próximo ativo | Nova rodada |
| --- | --- | --- | --- | --- |
| 0 | A → B → C → D | A | B | 0 |
| 0 | A → B → C → D | D (último) | **B** | **1** |
| 1 | B → C → D → A | B | C | 1 |
| 1 | B → C → D → A | A (último) | **C** | **2** |

O último da ordem base **não** é sucedido automaticamente pelo primeiro da ordem base. O sucessor do último da **rodada** é o primeiro da **próxima rodada** (US-03).

### Exemplo (dois jogadores A, B)

| Rodada | Sequência | Após último da rodada | Próximo ativo |
| --- | --- | --- | --- |
| 0 | A → B | ação de B | **B** (início da rodada 1) |
| 1 | B → A | ação de A | **A** (início da rodada 2) |

---

## 9. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Toda partida que admite ações de turno deve ter exatamente um jogador ativo, identificado por `currentTurnPlayerId`. |
| RN-02 | O jogador ativo deve ser um participante existente da partida. |
| RN-03 | Só o jogador ativo pode ter uma ação de turno aceita. |
| RN-04 | Jogador cujo id ≠ `currentTurnPlayerId` → ação **rejeitada**; estado inalterado. |
| RN-05 | Ação de turno só é aceita nas condições da §7. |
| RN-06 | No sucesso, o turno avança conforme a §8. |
| RN-07 | Não existe avanço de turno ou de rodada sem ação de turno aceita. |
| RN-08 | Não é possível concluir o mesmo turno duas vezes: a segunda tentativa ocorre quando aquele turno já não é o corrente → rejeitada (RN-04 / RN-07). |
| RN-09 | A ordem base `players` **não** muda. |
| RN-10 | O stub não altera fase, camelos, dinheiro, elenco nem identidade da partida. |
| RN-11 | Partida `Finished` → qualquer ação/avanço de turno **rejeitado**. |
| RN-12 | Partida `Created` → ação de turno **rejeitada**. |
| RN-13 | Se a partida se tornar `Finished` (por regra futura, não por este stub), deixa de haver ações de turno disponíveis. |
| RN-14 | Estado de origem inválido → ação rejeitada; nenhum turno parcial. |
| RN-15 | Persistência: gravar após sucesso; restaurar **não** dispara nova ação nem novo avanço. |
| RN-16 | Determinismo (D12). |
| RN-17 | Domínio sem React/Next/`localStorage`; I/O de persistência na aplicação. |
| RN-18 | O ator da ação deve ser identificado de forma explícita no comando (id do jogador). A UI futura não “escolhe o turno”; só informa quem tentou agir. |

---

## 10. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve **expor** o jogador ativo no estado da partida (`currentTurnPlayerId`). |
| RF-02 | O sistema deve **aceitar** a ação de turno stub quando o ator for o ativo e a partida admitir ações (§7). |
| RF-03 | O sistema deve **avançar** o turno (e a rodada, se for o último da sequência) no sucesso, conforme §8. |
| RF-04 | O sistema deve **rejeitar** ação de quem não é o ativo, sem alterar o estado. |
| RF-05 | O sistema deve **rejeitar** qualquer tentativa de avançar turno sem ação válida. |
| RF-06 | O sistema deve **rejeitar** a segunda conclusão do mesmo turno. |
| RF-07 | O sistema deve **rejeitar** ação/avanço em `Finished` e em `Created`. |
| RF-08 | O sistema deve **preservar** ordem base, fase, camelos, dinheiro e elenco no sucesso do stub. |
| RF-09 | O sistema deve **persistir** o estado após sucesso e **restaurá-lo** sem reexecutar a ação. |
| RF-10 | O sistema deve comportar-se corretamente com **2** e com **6** jogadores, inclusive na fronteira de rodada. |

---

## 11. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Independência de UI: autorização e avanço sem React/Next. |
| RNF-02 | Atomicidade: sucesso total ou rejeição com estado anterior preservado. |
| RNF-03 | Determinismo do avanço (sem aleatoriedade nesta operação). |
| RNF-04 | Testabilidade sem browser; persistência testável com fake/mock de storage. |
| RNF-05 | Compatibilidade: estado após avanço continua válido segundo US-01 (turno preenchido nas fases que o exigem), US-03 e US-04. |
| RNF-06 | Reuso: o contrato desta US deve poder ser aplicado a ações de mesa futuras sem redesenhar quem pode agir. |

---

## 12. Critérios de aceite

- [ ] A partida iniciada possui um jogador ativo.
- [ ] O jogador ativo é identificado pelo estado da partida (`currentTurnPlayerId`).
- [ ] Após uma ação válida, o turno avança conforme a sequência da rodada (US-03).
- [ ] O turno respeita a ordem/sequência definida dos jogadores da rodada corrente.
- [ ] O último da sequência da rodada é sucedido pelo primeiro da **próxima** rodada (não pelo primeiro da ordem base, salvo quando a US-03 coincidir).
- [ ] Quem não está no turno atual não executa ação (tentativa rejeitada).
- [ ] Partida encerrada (`Finished`) não possui ações de turno disponíveis.
- [ ] O gerenciamento funciona independentemente da interface.
- [ ] Tentar agir fora do turno: rejeitado, estado intacto.
- [ ] Tentar avançar o turno sem ação válida: rejeitado.
- [ ] Tentar concluir duas vezes o mesmo turno: segunda rejeitada.
- [ ] Último jogador da sequência da rodada: avança rodada e o próximo ativo é o primeiro da nova sequência.
- [ ] Partida com dois jogadores: sequência e fronteira de rodada corretas (incluindo turno consecutivo do mesmo jogador, D14).
- [ ] Partida com seis jogadores: mesma regra, todos entram na sequência.
- [ ] Tentativa de ação com partida já `Finished`: rejeitada.
- [ ] Reload após ação aceita preserva o jogador ativo (e a rodada).

---

## 13. Cenários de comportamento

### 13.1 Jogador ativo e ação válida

```gherkin
Feature: Gerenciamento de turnos

  Scenario: Partida iniciada possui jogador ativo no estado
    Given uma partida válida já iniciada (fase RaceSetup)
    And a ordem base é [A, B, C]
    And playerRoundIndex é 0
    Then currentTurnPlayerId é o identificador de A

  Scenario: Ação válida do jogador ativo avança o turno
    Given uma partida iniciada com ordem [A, B, C]
    And currentTurnPlayerId é A
    And playerRoundIndex é 0
    When A executa a ação de turno
    Then a operação é aceita
    And currentTurnPlayerId passa a ser B
    And playerRoundIndex permanece 0
    And a fase, os camelos, o dinheiro e a ordem de players permanecem iguais
    And o estado de origem permanece inalterado (comando sem mutação in-place)
```

### 13.2 Fora do turno, skip e duplo avanço

```gherkin
  Scenario: Ação fora do turno é rejeitada
    Given uma partida iniciada cujo jogador ativo é A
    When B executa a ação de turno
    Then a operação é rejeitada
    And currentTurnPlayerId permanece A
    And playerRoundIndex permanece o mesmo

  Scenario: Não se avança o turno sem ação válida
    Given uma partida iniciada cujo jogador ativo é A
    When se tenta avançar o turno sem uma ação de turno aceita
    Then a operação é rejeitada
    And currentTurnPlayerId permanece A

  Scenario: Não se conclui o mesmo turno duas vezes
    Given uma partida iniciada cujo jogador ativo é A
    When A executa a ação de turno com sucesso
    And currentTurnPlayerId passou a ser B
    When A executa a ação de turno novamente
    Then a segunda operação é rejeitada
    And currentTurnPlayerId permanece B
```

### 13.3 Último da rodada e wrap US-03

```gherkin
  Scenario: Último jogador da rodada 0 cede a vez ao primeiro da rodada 1
    Given uma partida iniciada com ordem base [A, B, C, D]
    And playerRoundIndex é 0
    And currentTurnPlayerId é D
    When D executa a ação de turno
    Then a operação é aceita
    And playerRoundIndex passa a ser 1
    And currentTurnPlayerId passa a ser B
    And o array players permanece [A, B, C, D]
```

### 13.4 Dois jogadores e máximo de jogadores

```gherkin
  Scenario: Partida com dois jogadores avança e fecha a rodada
    Given uma partida iniciada com ordem base [A, B]
    And playerRoundIndex é 0
    And currentTurnPlayerId é A
    When A executa a ação de turno
    Then currentTurnPlayerId passa a ser B
    And playerRoundIndex permanece 0
    When B executa a ação de turno
    Then playerRoundIndex passa a ser 1
    And currentTurnPlayerId passa a ser B

  Scenario: Partida com seis jogadores percorre a sequência da rodada 0
    Given uma partida iniciada com ordem base [A, B, C, D, E, F]
    And playerRoundIndex é 0
    And currentTurnPlayerId é A
    When cada jogador da sequência A, B, C, D, E executa a ação na sua vez
    Then currentTurnPlayerId é F
    And playerRoundIndex permanece 0
    When F executa a ação de turno
    Then playerRoundIndex passa a ser 1
    And currentTurnPlayerId passa a ser B
```

### 13.5 Encerrada, não iniciada e persistência

```gherkin
  Scenario: Partida encerrada não admite ação de turno
    Given uma partida na fase Finished
    When qualquer jogador executa a ação de turno
    Then a operação é rejeitada
    And o estado permanece o mesmo

  Scenario: Encerrar a partida impede ações subsequentes
    Given uma partida que admite ações de turno
    And em seguida a partida está na fase Finished
    When se tenta executar a ação de turno
    Then a operação é rejeitada

  Scenario: Partida Created não admite ação de turno
    Given uma partida na fase Created
    When um jogador tenta executar a ação de turno
    Then a operação é rejeitada
    And currentTurnPlayerId permanece nulo

  Scenario: Persistência do turno após ação válida
    Given uma partida iniciada em que A concluiu a ação de turno com sucesso
    And o ativo passou a ser B
    When o estado é persistido e depois restaurado
    Then currentTurnPlayerId restaurado é B
    And playerRoundIndex é o mesmo
    And nenhuma nova ação nem avanço extra ocorre
```

---

## 14. Dependências e restrições

| Tipo | Descrição |
| --- | --- |
| US-01 | Estado, fases, `currentTurnPlayerId`, rejeição de mutação em `Finished` |
| US-03 | Ordem base, `playerRoundIndex`, sequência por rodada |
| US-04 | Início define o primeiro ativo (`players[0]`) em `RaceSetup`; esta US não inicia a partida |
| AGENTS.md | Domínio fora da UI; I/O em `application/`; local-first; sem servidor no MVP |
| Restrição | Spec independente de pastas/libs; identificadores de estado já estabelecidos são contratos de produto |

---

## 15. Rastreabilidade da história

| Critério / caso da história | Cobertura |
| --- | --- |
| Partida possui jogador ativo | RN-01, RF-01, §13.1 |
| Ativo identificado no estado | D2, RF-01, §5 |
| Após ação válida, turno avança | RN-06, RF-02–RF-03, §8, §13.1 |
| Respeita ordem definida | D3, §8, RN-09 |
| Último sucedido pelo primeiro (da **próxima rodada**) | D3, §8, §13.3 |
| Fora do turno não executa | RN-03–RN-04, §13.2 |
| Encerrada sem ações de turno | D9, RN-11, RN-13, §13.5 |
| Independente da interface | D7, RN-17, RNF-01 |
| Ação fora do turno | §13.2 |
| Avançar sem ação válida | D5, RN-07, §13.2 |
| Avançar duas vezes o mesmo turno | D6, RN-08, §13.2 |
| Último jogador da rodada | §8, §13.3 |
| Dois jogadores | D14, RF-10, §13.4 |
| Número máximo de jogadores | RF-10, §13.4 |
| Encerrada durante / após ação | RN-11, RN-13, §13.5 |
| Desconectado no turno (futuro) | D10, §16 |

---

## 16. Aberturas explícitas (não bloqueantes)

- UI de “sua vez”, bloqueio visual de ações alheias e tela de passagem no pass-and-play.
- Ações reais de Camel Up (substituirão o stub, reusando autorização + avanço).
- Semântica de turno em `LegSetup` / `LegPayout` / `FinalPayout` (se o turno for nulo nessas fases, ações continuam rejeitadas por §7).
- Jogador desconectado ou que abandona durante o próprio turno (timeout, skip, substituição por bot).
- Encerramento da partida como efeito de uma ação de mesa (quando existir, RN-13 aplica-se depois do estado `Finished`).
- Orquestração fina persistir-antes vs. persistir-depois no plan (contrato: sucesso durável = turno já avançado; falha de I/O não grava avanço parcial).
