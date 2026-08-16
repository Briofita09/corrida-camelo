# Plano de Implementação — US-02 Configuração de nova partida

## 1. Contexto

A feature introduz um **modelo de configuração de nova partida** (modo + participantes), independente de UI, que valida regras por modo e **gera** uma `MatchState` em fase `Created` via o domínio US-01 (`createMatch`).

Problema resolvido: hoje só existe `createMatch` com lista crua de jogadores; não há fluxo de rascunho com modo (`SinglePlayerVsBots` / `PassAndPlay`), ordem modo→jogadores, validação de nomes nem descarte sem persistência.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-02-configuracao-nova-partida/spec.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md` (contrato de partida)
- `domain/match/` (API existente)
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`

## 3. Objetivo da Implementação

Entregar módulo de domínio TypeScript puro, testado com Vitest, capaz de:

- criar rascunho de configuração;
- definir modo antes dos jogadores;
- adicionar/remover/atualizar participantes (humano/bot + dificuldade);
- validar limites 2–6 e regras por modo + nomes (trim, case-insensitive);
- gerar partida `Created` compatível com US-01;
- descartar rascunho ao abandonar ou ao voltar à etapa de modo (sem I/O);
- não depender de React/Next;

sem implementar telas nem `startMatch`.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

| Área | Impacto |
| --- | --- |
| Domínio | **Principal** — novo módulo de configuração |
| Domínio `match` | **Reuso** — `createMatch` / tipos; sem mudança de regras US-01 salvo necessidade mínima de adaptação de mapeamento |
| Testes | **Principal** — suíte Vitest do novo módulo |
| Frontend | Nenhum |
| Backend / API / DB | Nenhum |

### 4.2 Componentes existentes

| Componente | Ação |
| --- | --- |
| `domain/match` (`createMatch`, `DomainResult`, `BotDifficulty`, limites) | Reutilizar na geração da partida |
| Vitest / `vitest.config.ts` | Reutilizar |
| `app/*` | Não modificar |

### 4.3 Novos componentes

| Componente (responsabilidade) | Camada |
| --- | --- |
| Tipos: `MatchMode`, `MatchConfig`, participante de config | Domínio |
| `createMatchConfig` — rascunho inicial (sem modo / sem jogadores) | Domínio |
| `setMatchMode` — define/redefine modo; ao redefinir, limpa participantes | Domínio |
| `addParticipant` / `removeParticipant` / `updateParticipant` | Domínio |
| `validateMatchConfig` — regras §7 + nomes | Domínio |
| `createMatchFromConfig` — mapeia para `createMatch` e retorna `MatchState` | Domínio |
| `discardMatchConfig` (ou equivalente) — descarta rascunho | Domínio |
| Helpers de nome (trim + chave normalizada) | Domínio |
| Suíte `*.test.ts` colocalizada | Testes |

Estrutura-alvo:

```text
domain/match-config/
  (tipos, create, mode, participants, validate, createMatchFromConfig, discard)
  *.test.ts
```

Importa `@/domain/match` apenas para gerar a partida e reutilizar `BotDifficulty` / `DomainResult` / constantes de limite quando fizer sentido (ou reexportar limites locais alinhados a US-01: 2–6).

## 5. Estratégia de Implementação

### 5.1 Abordagem

1. Módulo **`domain/match-config/`**, espelhando o padrão de `domain/match` (puro TS, `DomainResult`, imutabilidade).
2. Estado da configuração como dados imutáveis; cada comando retorna novo estado ou erro.
3. **Etapas:** `mode` opcional/`null` no início; sem modo → rejeitar add/update de participantes e generate.
4. **`setMatchMode`:**
   - primeira definição: grava modo;
   - redefinição / “voltar à etapa de modo”: grava novo modo e **zera** a lista de participantes (D10).
5. **Nomes:** ao aceitar, persistir `name.trim()`; unicidade por `trim().toLowerCase()` (D8); rejeitar se trim resultar em vazio.
6. **IDs na partida:** gerados de forma determinística na geração (ex.: `p-1`, `p-2`… ou baseado em índice), únicos para `createMatch`; nomes vão para o campo `name` dos jogadores US-01.
7. **`createMatchFromConfig`:** validar config → montar `CreateMatchConfig` → chamar `createMatch`; se `createMatch` falhar, propagar erro (não criar partida parcial).
8. **Imutabilidade pós-partida:** este módulo **não** expõe alteração de dificuldade em `MatchState`; teste garante preservação após generate.
9. **`discardMatchConfig`:** retorna estado “vazio” equivalente a config descartada (ou `null` via resultado); sem filesystem/localStorage.
10. Não alterar comportamento de `startMatch` / fases além de `Created`.

### 5.2 O que não fazer

- Telas, rotas, hooks React.
- Persistência de rascunho.
- Online, IA de bots, `startMatch`.
- Expandir escopo de `domain/match` com regras de modo (regras de modo ficam em `match-config`).

## 6. Estratégia BDD

Cenários da `spec.md` §13 → testes Vitest em `domain/match-config/*.test.ts`.

| Cenário (spec) | Estratégia de teste |
| --- | --- |
| Single-player válido gera partida | Fluxo setMode → add human+bots → createMatchFromConfig; assert `Created`, contagens, difficulties |
| Pass-and-play só humanos | 3 humanos, 0 bots → partida OK |
| Pass-and-play com bots | 2 humanos + 1 Hard → OK |
| Sem jogadores / 1 jogador / 7 jogadores | generate rejeitado |
| Todos bots | rejeitado |
| Single sem bots | rejeitado |
| Pass sem bots com 2 humanos | aceito |
| Pass com 1 humano + bots | rejeitado |
| Nome vazio / duplicado (Ana/ana) | add/update rejeitado |
| Add sem modo | rejeitado |
| setMode de novo limpa participantes | assert lista vazia após redefinir modo |
| discard | estado descartado; sem partida |
| Dificuldade preservada pós-generate | bot Easy permanece Easy no `MatchState` |
| Sem React/Next | smoke de imports nos fontes do módulo |

## 7. Estratégia TDD

```text
RED → GREEN → REFACTOR
```

Ordem sugerida:

1. Tipos + `createMatchConfig` + `setMatchMode` (incl. limpar participantes ao redefinir) + rejeição add sem modo.
2. Participantes: add/remove/update + nomes vazios/duplicados.
3. `validateMatchConfig` / regras por modo (Single e Pass) + limites 2–6.
4. `createMatchFromConfig` (felizes + rejeições de generate).
5. `discardMatchConfig` + independência de UI + preservação de dificuldade.

Camada: **unitária de domínio** apenas.

## 8. Alterações Técnicas

### 8.1 Backend

Não aplicável.

### 8.2 Frontend

Não aplicável.

### 8.3 Banco de dados

Não aplicável.

### 8.4 APIs

Não HTTP. Contrato interno sugerido:

| Operação | Entrada | Saída |
| --- | --- | --- |
| `createMatchConfig` | (opcional id) | `MatchConfig` |
| `setMatchMode` | config, mode | config |
| `addParticipant` / `removeParticipant` / `updateParticipant` | config + dados | config |
| `validateMatchConfig` | config | ok / erro |
| `createMatchFromConfig` | config (+ matchId?) | `MatchState` |
| `discardMatchConfig` | config | config vazia / sentinela |

Todas via `DomainResult` onde houver rejeição.

### 8.5 Integrações

- Única integração: `createMatch` de `@/domain/match`.

## 9. Ordem de Implementação

```text
1. Esqueleto domain/match-config + tipos + createMatchConfig
2. setMatchMode (primeira vez + redefinição limpa jogadores)
3. Participantes + validação de nomes
4. validateMatchConfig (regras §7)
5. createMatchFromConfig → createMatch
6. discardMatchConfig
7. Testes de RNF-01 + preservação de dificuldade
8. Refactor + npm test / lint / build
```

## 10. Estratégia de Testes

| Tipo | Usar? | Escopo |
| --- | --- | --- |
| Unitário domínio | **Sim** | Todos os cenários §13 |
| UI / E2E | Não | Fora de escopo |

Comando: `npm test`.

## 11. Riscos e Mitigações

| Risco | Mitigação |
| --- | --- |
| Duplicar regras de limite US-01 de forma divergente | Reutilizar `MIN_PLAYERS`/`MAX_PLAYERS` de `domain/match` ou constantes espelhadas cobertas por teste de generate |
| `createMatch` rejeitar após validate passar | Mapear 1:1 nomes/tipos/dificuldades; IDs únicos; teste de integração domínio→domínio |
| Confundir “modo na UI” com implementação de telas | Só modelo/fluxo de config; zero React |
| Vazamento de mutação de dificuldade na partida | Não criar API de update em MatchState; assert no teste |

## 12. Dependências

| Dependência | Tipo |
| --- | --- |
| US-01 / `domain/match` | Técnica e funcional |
| Spec US-02 | Funcional |
| Vitest já configurado | Técnica |

## 13. Critérios para Conclusão

- [ ] `domain/match-config` existe sem dependência React/Next.
- [ ] Modo antes dos jogadores; redefinir modo limpa participantes.
- [ ] Regras Single / Pass + limites 2–6 cobertas por testes.
- [ ] Nomes vazios e duplicados (case-insensitive) rejeitados.
- [ ] `createMatchFromConfig` produz `Created` válido US-01 nos fluxos felizes.
- [ ] Discard/abandono sem persistência.
- [ ] Dificuldade do bot preservada na partida gerada; sem API de alteração pós-generate nesta feature.
- [ ] `npm test` verde cobrindo §13; lint/build OK.
- [ ] Critérios de aceite da spec §12 atendidos.

## 14. Próxima Etapa

Decompor este plano em `docs/tasks/us-02-configuracao-nova-partida/tasks.md` via skill `create-tasks`.
