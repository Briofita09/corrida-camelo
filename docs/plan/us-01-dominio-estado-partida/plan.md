# Plano de Implementação — US-01 Domínio e estado da partida

## 1. Contexto

A feature estabelece o **modelo de domínio** e o **estado serializável** de uma partida de Camel Up: The Card Game, sem UI. Isso habilita a Fase 1 do roadmap (domínio + TDD/BDD) e desacopla regras futuras de React/Next.js.

Problema resolvido: hoje o repositório só tem o template Next.js; não existe representação de partida, jogadores, camelos, fases ou invariantes no código.

## 2. Referências

- `AGENTS.md`
- `docs/spec/us-01-dominio-estado-partida/spec.md`
- `docs/game/game-design.md` (separação domínio/UI; Crazy Camel)
- `docs/guidelines/06-code-structure.md`
- `docs/guidelines/08-testing.md`
- `docs/guidelines/03-state-management.md` (classificação de estado; domínio ≠ UI state)

## 3. Objetivo da Implementação

Entregar um módulo de domínio TypeScript puro, testado com Vitest, capaz de:

- criar partida com humanos e bots (dificuldade por bot);
- iniciar partida (`Created` → `RaceSetup`);
- representar estado completo (fase, jogadores, camelos/posições, turno, dinheiro, encerramento);
- validar/hidratar estado e rejeitar inconsistências;
- serializar/desserializar com round-trip semântico;
- rejeitar mutações em `Finished` e início inválido;

sem alterar a UI do template nesta US.

## 4. Análise de Impacto

### 4.1 Áreas afetadas

| Área | Impacto |
| --- | --- |
| Domínio | **Principal** — novo módulo |
| Testes | **Principal** — suíte Vitest de domínio |
| Configuração | Vitest já instalado; scripts `test` / `test:watch`; `vitest.config.ts` |
| Frontend | Nenhum (fora de escopo) |
| Backend / API / DB | Nenhum |
| Infraestrutura | Nenhum |

### 4.2 Componentes existentes

| Componente | Ação |
| --- | --- |
| `app/*` (template) | Não modificar para esta feature |
| `package.json` / `vitest.config.ts` | Já preparados para Vitest; ajustar só se a implementação exigir |

### 4.3 Novos componentes

| Componente (responsabilidade) | Camada |
| --- | --- |
| Tipos do estado (`GamePhase`, jogador, camelo, `MatchState`, config de criação) | Domínio |
| Factory / comando `createMatch` | Domínio |
| Comando `startMatch` | Domínio |
| Validador de invariantes / hidratação | Domínio |
| Serialização / desserialização JSON | Domínio |
| Erro ou resultado de rejeição de domínio | Domínio |
| Helpers de teste (estado `Finished`, configs válidas/inválidas) | Testes |
| Suíte de testes alinhada aos cenários da spec §13 | Testes |

Estrutura-alvo (alinhada a `AGENTS.md` + guideline 06 — domínio fora da UI, colocation):

```text
domain/match/
  (tipos, create, start, validate, serialize, errors)
  *.test.ts   # colocalizados
```

Nomes de arquivos concretos ficam para a etapa `tasks`; o plano fixa o **módulo** `domain/match` e as responsabilidades.

## 5. Estratégia de Implementação

### 5.1 Abordagem

1. Domínio **puro TypeScript** sob `domain/match/`, importável via `@/domain/match/...`.
2. Estado como **dados imutáveis** (novos objetos em cada comando bem-sucedido); comandos não mutam o estado de entrada in-place (facilita RF-07).
3. API de domínio baseada em **resultado explícito** (`ok` / `erro` de domínio) para create, start, validate/hydrate e mutações — coerente com RF-07 (“erro/resultado de rejeição”), sem exceções não tratadas como fluxo normal.
4. Identificadores de partida e jogadores: **fornecidos na configuração de criação** (determinísticos nos testes; UI futura pode gerar IDs).
5. Posições iniciais na criação: todos no espaço `0`, ordens de pilha distintas e **determinísticas** por identidade estável dos camelos; Crazy Camel com direção oposta à dos de corrida (spec §14).
6. Fases: tipo união com todos os valores da spec §7; nesta US só a transição `Created` → `RaceSetup` via `startMatch`; demais fases representáveis via estado construído/hidratado (para testes de `Finished` e validação).
7. Turno atual: `null`/ausente fora de `LegInProgress`; se fase for `LegInProgress`, turno obrigatório e deve referenciar jogador existente (invariante de validação).
8. Número da perna: `0` em `Created` e ao entrar em `RaceSetup` nesta US; ≥ 1 quando o estado representar pernas (validação consistente com a fase).
9. Vitest em ambiente `node` (já configurado); sem jsdom/browser para esta feature.

### 5.2 O que não fazer

- Não criar páginas, componentes, hooks ou rotas.
- Não implementar movimento, apostas, baralho ou IA.
- Não persistir em `localStorage`/rede (só serialização em memória/string).
- Não acoplar domínio a Next/React.

## 6. Estratégia BDD

Os cenários Gherkin da `spec.md` §13 são a referência de comportamento. Cada um mapeia para testes Vitest de domínio (describe/it nomeados com a intenção do cenário). Não há E2E nesta US (sem UI).

| Cenário (spec) | Estratégia |
| --- | --- |
| Criar partida válida com humano e bots | Teste de `createMatch` — fase `Created`, £3, 6 camelos, dificuldades gravadas |
| Criar sem jogadores / &lt;2 / &gt;6 / só bots / bot sem dificuldade / IDs duplicados | Testes de rejeição de `createMatch` |
| Iniciar partida criada | `startMatch` → `RaceSetup` |
| Iniciar já iniciada | `startMatch` rejeitado; estado inalterado |
| Modificar partida encerrada | Estado `Finished` via hydrate/factory de teste; comando de mutação (ex.: `startMatch` ou mutação genérica do módulo) rejeitado |
| Estado incompleto/inconsistente | `validate` / `deserialize` rejeitam (camelos incompletos, £&lt;1, pilha conflitante, fase inválida) |
| Round-trip serialização | `serialize` → `deserialize` equivalência semântica |
| Domínio independente de UI | Garantia estrutural: módulo só TypeScript; teste opcional de que exports não puxam React (smoke de import / convenção de lint na implementação) |

## 7. Estratégia TDD

Ciclo obrigatório por fatia:

```text
RED → GREEN → REFACTOR
```

Ordem orientada a testes:

1. **Tipos + validação de configuração / create rejeições** (cenários 13.2) — RED com testes de create inválido → GREEN com `createMatch` mínimo → REFACTOR.
2. **Create válido** (13.1 + posições §14) — testes do caminho feliz → implementação → refactor.
3. **startMatch** (13.3) — testes aceitar/rejeitar → implementação.
4. **validate / hydrate + Finished** (13.4) — testes de inconsistência e mutação bloqueada.
5. **serialize / deserialize** (13.5) — round-trip.

Camada dos testes: **unitária de domínio** (guideline 08: funções puras / lógica de transformação). Sem testes de componente ou E2E nesta US.

## 8. Alterações Técnicas

### 8.1 Backend

Não aplicável.

### 8.2 Frontend

Não aplicável (UI fora de escopo).

### 8.3 Banco de dados

Não aplicável.

### 8.4 APIs

Não aplicável (sem HTTP). Contrato interno do domínio:

- entrada: configuração de criação (id da partida, lista de jogadores);
- comandos: `createMatch`, `startMatch`, `validateMatchState` (ou equivalente), `serializeMatchState` / `deserializeMatchState`;
- saída: resultado com estado ou erro de domínio tipado.

### 8.5 Integrações

Não aplicável.

### 8.6 Tooling de testes (já iniciado)

| Item | Estado |
| --- | --- |
| Dependência `vitest` | Instalada em **3.2.4** (Vitest 4 exige Node ≥20.19; ambiente atual é Node 20.9) |
| Scripts `test` / `test:watch` | Adicionados ao `package.json` |
| `vitest.config.ts` | Ambiente `node`, include `**/*.{test,spec}.ts`, alias `@`, `passWithNoTests` |

A etapa de tasks/implementação deve confirmar que `npm test` executa a suíte do domínio. Opcionalmente migrar para Vitest 4 após upgrade do Node.

## 9. Ordem de Implementação

```text
1. Confirmar tooling Vitest (npm test ok; ajuste fino de config se necessário)
2. Testes RED + tipos do estado / erros de domínio
3. createMatch (rejeições → caminho feliz) + posições iniciais
4. startMatch (Created → RaceSetup; rejeitar demais)
5. validate / deserialize (invariantes RN-01–RN-14)
6. Bloqueio de mutação em Finished
7. serialize / deserialize round-trip
8. Refactor final + verificação RNF-01 (sem imports React/Next no domínio)
9. Validação: npm test + checagem dos critérios de aceite da spec
```

## 10. Estratégia de Testes

| Tipo | Usar? | Escopo |
| --- | --- | --- |
| Unitário (domínio) | **Sim — principal** | Todos os cenários §13 e RNs aplicáveis |
| Integração UI | Não | Sem UI |
| E2E | Não | Sem UI |
| Contrato HTTP | Não | Sem API |

Casos críticos automatizados: criação válida/inválida; início; Finished imutável; inconsistências; serialização.

Comando: `npm test` (`vitest run`).

## 11. Riscos e Mitigações

| Risco | Mitigação |
| --- | --- |
| Vazamento de regras futuras no domínio (movimento, apostas) | Respeitar §4.2 da spec; só estado + create/start/validate/serialize |
| Estado `Finished` inacessível sem regras de fim de jogo | Factory/hydrate de teste constrói `Finished` válido para RN-13 |
| Ambiguidade de turno/perna fora de `LegInProgress` | Seguir §5.1 itens 7–8; validar consistência fase ↔ turno/perna |
| Acoplamento acidental a Next/React | Domínio em `domain/`; revisão de imports; testes sem browser |
| Node 20.9 incompatível com Vitest 4 | Vitest fixado em 3.2.4; upgrade Node ≥20.19 permite Vitest 4 depois |

## 12. Dependências

| Dependência | Tipo |
| --- | --- |
| Spec US-01 completa | Funcional — fonte da verdade |
| Vitest instalado e scripts | Técnica — já atendida nesta sessão |
| Nenhuma API/UI/DB | — |
| Specs futuras de regras de jogo | Não bloqueiam esta US |

## 13. Critérios para Conclusão

- [ ] Módulo `domain/match` existe e não depende de React/Next.
- [ ] `createMatch` e `startMatch` cobrem RF-01–RF-03 e cenários 13.1–13.3.
- [ ] Validação/hidratação cobre RN-01–RN-14 e cenário 13.4.
- [ ] Serialização round-trip cobre RF-06 e cenário 13.5.
- [ ] Mutação em `Finished` rejeitada.
- [ ] Bots com `Easy` \| `Medium` \| `Hard` representados na criação.
- [ ] `npm test` passa cobrindo os cenários da spec §13.
- [ ] Critérios de aceite da spec §12 satisfeitos.
- [ ] Nenhuma alteração de UI exigida pela US foi introduzida sem necessidade.

## 14. Próxima Etapa

Decompor este plano em tarefas operacionais (`tasks.md`) via skill `create-tasks`, usando:

```text
docs/plan/us-01-dominio-estado-partida/plan.md
```

como input, com rastreabilidade para `docs/spec/us-01-dominio-estado-partida/spec.md`.
