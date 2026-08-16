# Spec — US-03 Definir ordem inicial dos jogadores

| Campo | Valor |
| --- | --- |
| ID | US-03 |
| Feature | `us-03-ordem-inicial-jogadores` |
| História | Definir como a ordem dos jogadores é determinada ao iniciar uma partida (sorteio aleatório, persistência e rotação por rodada). |
| Status | Pronta para planejamento |
| Fonte | História US-03 + respostas de completude + regra de rotação + `AGENTS.md` + US-01/US-02 |

---

## 1. Objetivo

Definir e persistir a **ordem dos jogadores** no momento em que a partida é criada a partir da configuração (modo + participantes já escolhidos), de forma **aleatória e justa**, estável durante a partida, recuperável após recarregar/entrar de novo, e utilizável como base para a **rotação de quem começa cada rodada**.

Esta feature **não** implementa a UI completa do jogo, regras de movimento/apostas, nem a IA dos bots — apenas ordem, sorteio, persistência da ordem/estado necessário e a regra de sequência por rodada.

---

## 2. Contexto

- Domínio de partida: `domain/match` (US-01) — lista `players`, serialização JSON.
- Configuração: `domain/match-config` (US-02) — modo e participantes; `createMatchFromConfig` gera partida em `Created`.
- Hoje a ordem de `players` segue a ordem de entrada na configuração (sem sorteio).
- Aceite de produto exige que recarregar a página / reentrar na partida **não** resorteie — logo a ordem (e o estado da partida necessário) deve ser salva em **`localStorage`**.

---

## 3. Atores

| Ator | Papel nesta feature |
| --- | --- |
| Sistema / Domínio | Sorteia ordem, grava no estado, aplica regra de rodada |
| Camada de aplicação / persistência | Salva e restaura a partida (incluindo ordem) via `localStorage` |
| Jogador | Observa ordem estável após criação; não escolhe a ordem nesta US |
| UI futura | Exibe ordem e turnos; consome o domínio — implementação visual fora do núcleo desta US |

---

## 4. Escopo

### 4.1 Dentro do escopo

- Sorteio **aleatório** da ordem dos jogadores no momento da **criação da partida** (após modo e participantes definidos — tipicamente ao gerar partida a partir da US-02).
- Garantir: todos os jogadores entram no sorteio; posições únicas; probabilidade uniforme de cada jogador em cada posição.
- Representar a ordem como a **ordem do array `players`** no `MatchState`.
- Persistir a ordem (via estado da partida) em **`localStorage`**.
- Ao recarregar a página ou reabrir uma partida existente: **restaurar** estado/`players` **sem** novo sorteio.
- Manter a ordem base **immutável** durante a partida (salvo regras futuras explícitas).
- Definir a regra de **rotação por rodada** a partir da ordem base (ver §7).
- Manter o sorteio como regra **substituível no futuro** sem exigir reformulação estrutural grande do estado (ex.: ponto de extensão para estratégia de ordenação; nesta US só a estratégia aleatória).

### 4.2 Fora do escopo

- Telas de configuração/jogo (podem ser consumidas depois; não são o foco desta US além da persistência necessária).
- Outras estratégias de ordenação além da aleatória (só o gancho/extensibilidade).
- Alteração manual da ordem pelo usuário.
- Regras de movimento, apostas, baralho, IA.
- Multiplayer online / servidor.
- Redefinir `currentTurnPlayerId` em todas as fases futuras além do necessário para descrever a primeira posição da rodada 0 (detalhe de wiring fino pode ficar no plan, desde que a regra de §7 esteja coberta).

---

## 5. Glossário

| Termo | Definição |
| --- | --- |
| Ordem base | Sequência fixa dos jogadores no array `players` após o sorteio (índice 0 = primeiro da ordem base) |
| Sorteio | Permutação aleatória uniforme dos participantes no momento da criação da partida |
| Rodada | Ciclo em que cada jogador joga uma vez, na sequência determinada pela ordem base e pelo deslocamento da rodada |
| Deslocamento de rodada | Índice `r` (0, 1, 2, …) que indica quem começa a rodada |
| Turno do jogador | Ação individual de um jogador dentro de uma rodada (distinto de “rodada”) |
| Partida existente | Partida já criada e persistida (ex.: chave em `localStorage`) |

---

## 6. Premissas e decisões de produto

| ID | Decisão |
| --- | --- |
| D1 | O sorteio ocorre **depois** de selecionar modo e participantes, na **criação da partida** (não na configuração; não ao reentrar). |
| D2 | A ordem canônica é a **ordem do array `players`**. |
| D3 | Estratégia desta US: **aleatória uniforme** (cada permutação igualmente provável). |
| D4 | A ordem base **não muda** durante a partida nesta US. |
| D5 | Persistência: salvar no **`localStorage`** o estado necessário para preservar a ordem (no mínimo a partida com `players` ordenados; tipicamente o `MatchState` serializado). |
| D6 | Recarregar a página ou abrir de novo a mesma partida: **carrega** do `localStorage` — **proibido** novo sorteio. |
| D7 | `startMatch` e demais transições de fase **não** reordenam `players`. |
| D8 | Extensibilidade: o mecanismo de obtenção da ordem inicial deve permitir trocar a estratégia no futuro (ex.: aleatória → outra) sem redesenhar o modelo de estado (`players` ordenado continua sendo a fonte da verdade). |
| D9 | Humanos e bots participam igualmente do sorteio e da sequência de rodadas. |

---

## 7. Regra de sequência por rodada

Seja a ordem base após o sorteio `[P0, P1, …, P(n-1)]` (exemplo: A, B, C, D → n = 4).

Para a **rodada** `r` (começando em `r = 0`):

- O jogador que **começa** a rodada é `P[r mod n]`.
- A sequência completa da rodada é:

```text
P[r mod n], P[(r+1) mod n], …, P[(r+n-1) mod n]
```

### Exemplo (ordem base A, B, C, D)

| Rodada `r` | Sequência |
| --- | --- |
| 0 | A → B → C → D |
| 1 | B → C → D → A |
| 2 | C → D → A → B |
| 3 | D → A → B → C |
| 4 | A → B → C → D (repete o padrão) |

### Requisitos derivados

| ID | Requisito |
| --- | --- |
| RR-01 | A ordem base permanece A,B,C,D; só o ponto de início da rodada avança. |
| RR-02 | O sistema deve poder determinar, dado `r` e a ordem base, a sequência da rodada (função pura de domínio ou equivalente). |
| RR-03 | O estado da partida deve permitir saber qual é a rodada corrente **ou** o deslocamento equivalente, de forma serializável (para sobreviver a reload). O nome do campo fica a cargo do plan; o comportamento é obrigatório. |

---

## 8. Regras de negócio

| ID | Regra |
| --- | --- |
| RN-01 | Ao criar a partida (pós-configuração), os jogadores são ordenados aleatoriamente no array `players`. |
| RN-02 | Nenhum jogador aparece mais de uma vez na ordem. |
| RN-03 | Todos os jogadores da configuração/partida participam do sorteio. |
| RN-04 | Cada jogador tem a mesma probabilidade de ocupar cada posição (sorteio justo / permutação uniforme). |
| RN-05 | A ordem fica no estado da partida (`players`). |
| RN-06 | Após criada, operações que não sejam regra futura explícita **não** alteram a ordem base. |
| RN-07 | Persistir a partida (incluindo ordem) em `localStorage` após criação (e atualizar quando o estado relevante mudar, no mínimo de forma que reload preserve ordem e deslocamento de rodada). |
| RN-08 | Restaurar do `localStorage` **não** executa novo sorteio. |
| RN-09 | A sequência de jogadas por rodada obedece §7. |
| RN-10 | Domínio de ordenação/sorteio/sequência de rodada não depende de React (a escrita em `localStorage` pode viver em adaptador/aplicação fino, mas o contrato de “salvar/restaurar sem resortear” é obrigatório). |

---

## 9. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aplicar ordenação aleatória justa na criação da partida a partir dos participantes. |
| RF-02 | O sistema deve expor/consultar a ordem base via array `players`. |
| RF-03 | O sistema deve calcular a sequência de uma rodada `r` conforme §7. |
| RF-04 | O sistema deve persistir a partida (com ordem e informação de rodada/deslocamento) em `localStorage`. |
| RF-05 | O sistema deve restaurar a partida do `localStorage` sem novo sorteio. |
| RF-06 | O sistema deve rejeitar/impedir segundo sorteio ao “entrar novamente” na mesma partida persistida. |
| RF-07 | A estratégia de ordenação inicial deve ser isolável para substituição futura (nesta US: apenas aleatória). |

---

## 10. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Testabilidade: sorteio injetável ou controlável em testes (para verificar unicidade/completude sem flakiness indevida; justiça pode ser validada por propriedade/contrato da estratégia). |
| RNF-02 | Independência: lógica de ordem/rodada testável sem browser; persistência `localStorage` testável com mock/fake se necessário. |
| RNF-03 | Compatibilidade: partida gerada continua válida segundo US-01 (invariantes); US-02 continua gerando partida, agora com ordem sorteada. |

---

## 11. Critérios de aceite

- [ ] Ao criar a partida (após modo e participantes), os jogadores são ordenados aleatoriamente.
- [ ] Nenhum jogador aparece mais de uma vez na ordem.
- [ ] Todos os jogadores participam do sorteio.
- [ ] A ordem é a do array `players` no estado da partida.
- [ ] A ordem (e o deslocamento/rodada necessários) é salva em `localStorage`.
- [ ] Recarregar a página restaura a mesma ordem (sem novo sorteio).
- [ ] Entrar novamente na mesma partida existente não provoca novo sorteio.
- [ ] Dada ordem base A,B,C,D: rodada 0 = A,B,C,D; rodada 1 = B,C,D,A; rodada 2 = C,D,A,B; e assim por diante.
- [ ] A estratégia atual é aleatória; o desenho permite substituí-la no futuro sem mudança estrutural grande do estado.

---

## 12. Cenários de comportamento

### 12.1 Sorteio na criação

```gherkin
Feature: Ordem inicial dos jogadores

  Scenario: Criar partida ordena jogadores aleatoriamente
    Given uma configuração válida com participantes A, B, C, D
    When a partida é criada a partir da configuração
    Then o array players contém exatamente A, B, C e D uma vez cada
    And a ordem é uma permutação dos participantes
    And a partida é persistida no localStorage com essa ordem

  Scenario: Todos participam e sem duplicata
    Given N participantes na configuração (2 ≤ N ≤ 6)
    When a partida é criada
    Then a ordem tem tamanho N
    And não há ids duplicados na ordem
```

### 12.2 Estabilidade e reload

```gherkin
  Scenario: Recarregar não altera a ordem
    Given uma partida já criada com ordem base persistida
    When o estado é restaurado do localStorage (equivalente a recarregar a página)
    Then o array players é idêntico ao persistido
    And nenhum novo sorteio ocorre

  Scenario: Entrar novamente na partida existente
    Given uma partida existente salva no localStorage
    When o usuário abre essa partida novamente
    Then a ordem base permanece a mesma
    And não ocorre novo sorteio
```

### 12.3 Rotação por rodada

```gherkin
  Scenario: Sequência das primeiras rodadas com 4 jogadores
    Given ordem base [A, B, C, D]
    When se consulta a sequência da rodada 0
    Then a sequência é A, B, C, D
    When se consulta a sequência da rodada 1
    Then a sequência é B, C, D, A
    When se consulta a sequência da rodada 2
    Then a sequência é C, D, A, B
    When se consulta a sequência da rodada 3
    Then a sequência é D, A, B, C

  Scenario: startMatch não reordena players
    Given uma partida Created com ordem base já sorteada
    When startMatch é executado
    Then a ordem do array players permanece inalterada
```

### 12.4 Extensibilidade (comportamento mínimo)

```gherkin
  Scenario: Ordenação inicial é estratégia isolada
    Given o ponto de extensão de ordenação inicial
    Then a estratégia ativa nesta US é a aleatória
    And a fonte da verdade da ordem no estado continua sendo o array players
```

---

## 13. Dependências e restrições

| Tipo | Descrição |
| --- | --- |
| US-01 | `MatchState.players`, serialize/deserialize, `startMatch` sem reordenar |
| US-02 | Criação após modo + participantes via `createMatchFromConfig` (ou fluxo equivalente) |
| AGENTS.md | Domínio fora da UI; Vitest; local-first |
| Ambiente | `localStorage` disponível no cliente web; testes podem mockar |

---

## 14. Rastreabilidade da história

| Critério / regra | Cobertura |
| --- | --- |
| Ordem aleatória ao iniciar/criar | RF-01, D1, §12.1 |
| Posição única / todos participam | RN-02, RN-03, §12.1 |
| Ordem estável na partida | RN-06, §12.3 |
| Sorteio na criação pós-config | D1 |
| Probabilidade uniforme | RN-04, RNF-01 |
| Persistida no estado | RN-05, D2 |
| Reload / reentrar sem novo sorteio | RF-04–06, D5–D6, §12.2 |
| Extensível | RF-07, D8, §12.4 |
| Rotação A→B→C→D por rodada | §7, §12.3 |

---

## 15. Aberturas explícitas (não bloqueantes)

- UI de “continuar partida” / listagem de partidas salvas.
- Outras estratégias de ordenação inicial (fixa, ranking, etc.).
- Regras futuras que **alterem** a ordem base no meio da partida.
- Sincronização multiplayer da ordem (servidor como autoridade).
- Detalhe de quantas ações por “turno do jogador” dentro da rodada (regras de Camel Up — features posteriores).
