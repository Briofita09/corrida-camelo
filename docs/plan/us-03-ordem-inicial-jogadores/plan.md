# Plano de Implementação — US-03 Ordem inicial dos jogadores

## 1. Contexto

Hoje a ordem de `players` em `MatchState` segue a ordem de entrada na configuração (US-02 → `createMatch`). Não há sorteio, nem deslocamento de rodada serializável, nem persistência que impeça um novo sorteio após reload.

Esta feature resolve: **sortear** a ordem na criação da partida, **fixá-la** como array `players`, **calcular** a sequência por rodada com rotação, e **persistir/restaurar** a partida via `localStorage` sem resortear.

UI de jogo e listagem de partidas continuam fora de escopo.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-03-ordem-inicial-jogadores/spec.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md` (contrato de `MatchState`)
- `docs/spec/us-02-configuracao-nova-partida/spec.md` (criação pós-config)
- `domain/match/` e `domain/match-config/` (código existente)
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md` (estado de domínio ≠ UI; sequência de rodada é derivável da ordem base + índice)

## 3. Objetivo da Implementação

Entregar, com Vitest e TDD:

1. **Domínio (`domain/match`)** — ordenação inicial pluggable (estratégia aleatória uniforme), `players` como ordem base, campo serializável de rodada, função pura de sequência por rodada; `startMatch` e demais comandos **não** reordenam `players`.
2. **Integração US-02** — `createMatchFromConfig` passa a gerar partida já com ordem sorteada (via `createMatch`), sem lógica de modo misturada no sorteio.
3. **Aplicação / adaptador** — salvar e restaurar `MatchState` (JSON já existente) em `localStorage`, sem novo sorteio no load.
4. **Testes** — cobrir cenários da spec §12 (sorteio, estabilidade, rotação, extensibilidade mínima) e regressão US-01/US-02.

Sem telas React nesta US.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

| Área | Impacto |
| --- | --- |
| Domínio `match` | **Principal** — sorteio na criação, campo de rodada, API de sequência, serialização/validação |
| Domínio `match-config` | **Secundário** — comportamento de `createMatchFromConfig` herda o sorteio; testes que assumem ordem de entrada precisam ajustar |
| Aplicação / persistência | **Novo** — adaptador `localStorage` + porta testável |
| Testes | **Principal** — novas suítes + regressão |
| Frontend (`app/*`) | Nenhum (sem UI nesta US) |
| Backend / API / DB | Nenhum |

### 4.2 Componentes existentes

| Componente | Ação |
| --- | --- |
| `createMatch` | Modificar: após validar, aplicar estratégia de ordenação antes de montar o estado |
| `MatchState` / tipos / serialize / validate | Modificar: incluir campo de índice de rodada; validar ≥ 0; round-trip |
| `startMatch` | Manter ordem de `players`; não resetar índice de forma que viole a spec (ver §5.1) |
| `createMatchFromConfig` | Reutilizar `createMatch` (já sorteia); sem segundo sorteio |
| `serialize` / `deserialize` | Incluir novo campo |
| Testes US-01 / US-02 | Ajustar asserts de ordem quando necessário; injetar estratégia determinística nos testes |

### 4.3 Novos componentes

| Componente (responsabilidade) | Camada |
| --- | --- |
| Contrato de estratégia de ordenação inicial (ex.: `PlayerOrderingStrategy`) | Domínio |
| Estratégia aleatória (Fisher–Yates / permutação uniforme) com RNG injetável | Domínio |
| Função pura: sequência da rodada `r` a partir de `players` | Domínio |
| Campo de estado: índice da rodada corrente (nome técnico abaixo) | Domínio |
| Porta de armazenamento de partida (`save` / `load` / “ativa”) | Aplicação |
| Adaptador `localStorage` (browser) | Aplicação |
| Fake/in-memory storage para testes | Testes |
| Suítes `*.test.ts` de ordem, rodada e persistência | Testes |

Estrutura-alvo:

```text
domain/match/
  (ordenar na create; estratégia; sequência de rodada; tipos/serialize/validate)
  *.test.ts

application/match-persistence/
  (porta + adaptador localStorage + testes com fake)
  *.test.ts
```

Nomes de arquivo concretos ficam para `tasks`; o plano fixa módulos e responsabilidades.

**Decisão de nome (spec RR-03):** campo `playerRoundIndex: number` em `MatchState`, iniciando em `0` na criação. Não reutilizar `currentLeg` (perna de corrida ≠ rodada de jogadores).

## 5. Estratégia de Implementação

### 5.1 Abordagem

1. **Ponto único de sorteio:** dentro de `createMatch`, depois da validação da config e **antes** de materializar `MatchState.players`. Assim `createMatchFromConfig` e qualquer chamada direta herdam o mesmo comportamento (D1, RN-01).
2. **Ordem canônica:** o array `players` **já ordenado** é a fonte da verdade (D2). Não duplicar lista de IDs só para ordem.
3. **Estratégia pluggable (RF-07 / D8):** `createMatch` aceita opção opcional de ordenação (ex.: parâmetro `ordering` ou deps `{ orderPlayers, random }`). Default = estratégia aleatória uniforme. Testes passam estratégia identidade ou ordem fixa para asserts determinísticos.
4. **Aleatoriedade justa (RN-04):** permutação uniforme (ex.: Fisher–Yates) com fonte de aleatoriedade injetável (`() => number` no intervalo `[0,1)`), default `Math.random`.
5. **Rodada (§7):** função pura `getRoundPlayerSequence(players, playerRoundIndex)` (ou equivalente) retorna a sequência rotacionada; não altera `players`.
6. **Estado serializável:** `playerRoundIndex` começa em `0`; incluído em serialize/deserialize/validate (`number` inteiro ≥ 0).
7. **Avanço de rodada:** comando de domínio mínimo (ex.: `advancePlayerRound`) que incrementa `playerRoundIndex` sem reordenar `players`, para permitir persistir deslocamento quando o estado mudar (RN-07). Não implementa regras de “quando a rodada termina no jogo” além do incremento explícito.
8. **`startMatch`:** não reordena `players`; não executa novo sorteio; não precisa zerar `playerRoundIndex` se já for `0` (partida nova). Se no futuro `startMatch` for chamado com índice ≠ 0, nesta US basta **não alterar** o índice (preservar).
9. **Persistência fora do domínio puro:** módulo `application/match-persistence` depende de `serializeMatchState` / `deserializeMatchState` do domínio. Domínio **não** importa `localStorage` nem `window`.
10. **Contrato de storage:** porta com operações no mínimo:
    - salvar partida (estado completo serializado);
    - carregar partida por id **ou** carregar partida “ativa”;
    - definir/obter id da partida ativa (para “reentrar” sem UI de lista — abertura §15 da spec).
11. **Chaves `localStorage` (decisão técnica):** namespace estável do app (ex.: prefixo `camel-up-card-game:`) + chave da partida por id + chave do id ativo. Conteúdo = JSON do `MatchState` (via serialize do domínio).
12. **Fluxo create → persist:** após `createMatch` / `createMatchFromConfig` bem-sucedido, a camada de aplicação (função de orquestração fina) chama `save` + marca ativa. O domínio sozinho não escreve storage (RN-10).
13. **Fluxo load:** `load` → deserialize/validate → retorna estado; **não** chama `createMatch` nem estratégia de ordenação (RN-08, RF-05–06).
14. **Imutabilidade:** comandos de domínio continuam retornando novos objetos; não mutar arrays de entrada in-place na estratégia (copiar antes de embaralhar).

### 5.2 O que não fazer

- Telas, rotas, hooks de UI, listagem de várias partidas.
- Outras estratégias de ordenação além da aleatória (só o contrato).
- Regras de movimento/apostas/IA; wiring de `currentTurnPlayerId` em todas as fases além do que já existe.
- Persistência de **rascunho** de `match-config` (continua fora; só partida).
- Backend, sync online, cookies, IndexedDB.

## 6. Estratégia BDD

Cenários da `spec.md` §12 → testes Vitest (domínio + aplicação). Sem E2E.

| Cenário (spec) | Estratégia |
| --- | --- |
| Criar partida ordena aleatoriamente + persiste | `createMatch`/`createMatchFromConfig` com RNG controlado → permutação completa sem duplicata; orquestração save → storage contém mesma ordem |
| Todos participam / sem duplicata (N = 2..6) | Testes paramétricos no create |
| Recarregar não altera ordem | save → nova instância de storage/load → `players` idênticos; spy garante que ordenação **não** roda no load |
| Entrar novamente na partida existente | load da partida ativa → mesma ordem / mesmo `playerRoundIndex` |
| Sequência rodadas 0–3 com A,B,C,D | Teste puro de `getRoundPlayerSequence` |
| `startMatch` não reordena | create (ordem fixa via estratégia) → start → mesma ordem de ids |
| Estratégia isolada | Default aleatória; teste troca por estratégia identidade e verifica que `players` respeitam a estratégia |

## 7. Estratégia TDD

```text
RED → GREEN → REFACTOR
```

Ordem orientada a testes:

1. **Sequência de rodada (pura)** — RED com A,B,C,D → GREEN função pura → REFACTOR.
2. **Campo `playerRoundIndex` + serialize/validate** — testes de round-trip e rejeição de índice inválido → implementação.
3. **Estratégia + `createMatch` com ordenação** — unicidade/completude; RNG injetado; `startMatch` não reordena → implementação.
4. **`advancePlayerRound` (mínimo)** — incremento sem mexer em `players`.
5. **Regressão `match-config`** — generate ainda OK; ordem não assume entrada; opcionalmente assert permutação.
6. **Porta + fake storage + adaptador** — save/load/ativa sem resortear; mock de `localStorage` ou fake in-memory primeiro, depois adaptador real com mock do Storage Web API.

Camada: unitário de domínio + unitário/integração leve da aplicação com fake. Sem componente React.

## 8. Alterações Técnicas

### 8.1 Backend

Não aplicável.

### 8.2 Frontend

Não aplicável (UI fora de escopo). Nenhuma alteração obrigatória em `app/*`.

### 8.3 Banco de dados

Não aplicável. Persistência = **`localStorage`** no cliente.

### 8.4 APIs

Sem HTTP. Contratos internos:

| API | Responsabilidade |
| --- | --- |
| `createMatch(config, options?)` | Cria partida com `players` ordenados pela estratégia; `playerRoundIndex = 0` |
| `getRoundPlayerSequence(...)` | Sequência da rodada `r` |
| `advancePlayerRound(state)` | Incrementa `playerRoundIndex` |
| `serialize` / `deserialize` / `validate` | Incluem `playerRoundIndex` |
| `saveMatch` / `loadMatch` / `getActiveMatch` (nomes na tasks) | Persistência via porta + `localStorage` |

### 8.5 Integrações

| Integração | Detalhe |
| --- | --- |
| Web Storage | Adaptador usa `localStorage`; testes usam fake ou mock |
| US-01 serialize | Reutilizar formato JSON existente, estendido com o novo campo |
| US-02 generate | Continua chamando `createMatch` (um único sorteio) |

Estados legados sem `playerRoundIndex`: na deserialize/validate, rejeitar **ou** hidratar com default `0` se a política for compatibilidade local. **Decisão desta US:** hidratar ausente como `0` apenas se o restante do estado for válido (facilita transição); se o campo existir e for inválido, rejeitar. Documentar no implementation.

## 9. Ordem de Implementação

```text
1. Testes RED + função pura de sequência por rodada
2. Estender MatchState (playerRoundIndex) + validate/serialize/deserialize
3. Contrato de estratégia + aleatória com RNG injetável
4. Integrar ordenação em createMatch (e opções de teste)
5. Garantir startMatch / demais caminhos não reordenam; advancePlayerRound
6. Ajustar/regressão testes match + match-config
7. Porta de persistência + fake in-memory (save/load/ativa, sem sorteio no load)
8. Adaptador localStorage + testes com mock de Storage
9. Orquestração fina create→save (função de aplicação, sem UI)
10. npm test (suíte completa) + checagem critérios de aceite da spec
```

## 10. Estratégia de Testes

| Tipo | Usar? | Escopo |
| --- | --- | --- |
| Unitário domínio | **Sim — principal** | Sorteio, rodada, startMatch estável, serialize |
| Unitário/app persistência | **Sim** | Fake storage + mock `localStorage` |
| Integração UI / E2E | Não | Sem UI |
| HTTP | Não | — |

Casos críticos: permutação sem duplicata; load idêntico; sequência §7; não chamar ordenação no restore; regressão US-01/US-02.

Comando: `npm test`.

## 11. Riscos e Mitigações

| Risco | Mitigação |
| --- | --- |
| Testes US-02 quebram ao assumir ordem de participantes | Injetar estratégia identidade nos testes de config **ou** assertar como conjunto/permutação |
| Flakiness do RNG | RNG injetável; não depender de probabilidade empírica frágil nos testes unitários |
| Confundir `currentLeg` com rodada de jogadores | Campo dedicado `playerRoundIndex`; documentação no plano/spec |
| Domínio acoplado a browser | Persistência só em `application/`; domínio sem `localStorage` |
| AGENTS.md ainda lista “sem persistência de partida” | Spec US-03 autoriza; após implementação, atualizar `AGENTS.md` na skill de arquitetura (não bloqueia esta US) |
| Duplo sorteio (config + create) | Sorteio **apenas** em `createMatch` |

## 12. Dependências

| Dependência | Tipo |
| --- | --- |
| Spec US-03 | Funcional — fonte da verdade |
| US-01 `domain/match` (create, serialize, start) | Técnica — base |
| US-02 `createMatchFromConfig` | Técnica — caminho pós-config |
| Vitest | Já configurado |
| `localStorage` no runtime do browser | Ambiente; mock nos testes |
| UI de “continuar partida” | Não bloqueia (abertura da spec) |

## 13. Critérios para Conclusão

- [ ] `createMatch` aplica ordenação aleatória justa (estratégia default) com RNG injetável.
- [ ] Ordem canônica = array `players`; sem duplicatas; todos participam.
- [ ] `playerRoundIndex` existe, serializa e valida; inicia em `0`.
- [ ] `getRoundPlayerSequence` cobre o exemplo A,B,C,D das rodadas 0–3.
- [ ] `startMatch` não reordena `players`.
- [ ] Persistência save/load (porta + `localStorage`) restaura a mesma ordem e índice **sem** novo sorteio.
- [ ] Estratégia de ordenação isolada o suficiente para troca futura sem mudar o modelo (`players` ordenado).
- [ ] `npm test` passa (match + match-config + persistência).
- [ ] Critérios de aceite da spec §11 satisfeitos.
- [ ] Nenhuma UI obrigatória introduzida além do necessário (nenhuma nesta US).

## 14. Próxima Etapa

Decompor este plano em tarefas operacionais (`tasks.md`) via skill `create-tasks`, usando:

```text
docs/plan/us-03-ordem-inicial-jogadores/plan.md
```

como input, com rastreabilidade para `docs/spec/us-03-ordem-inicial-jogadores/spec.md`.
