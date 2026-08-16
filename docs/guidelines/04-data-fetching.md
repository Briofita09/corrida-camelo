# Guideline: Data Fetching

> Escopo: agnóstica à ferramenta (fetch nativo, React Query, SWR, Server Actions, etc). Foca em onde e como a busca de dados é planejada, não na API específica.

## Princípios

1. **Colocation**
   Buscar dados o mais próximo possível de onde eles são consumidos, em vez de centralizar tudo em um componente "pai orquestrador" que repassa via props para toda a árvore.

2. **Loading e error são parte da spec, não detalhe de implementação**
   Toda feature que envolve fetch de dados deve definir, já na fase de `spec`/`plan`:
   - Qual é o estado de loading (skeleton? spinner? conteúdo parcial?).
   - Qual é o comportamento em caso de erro (retry automático? mensagem? fallback?).
   - Qual é o comportamento em caso de dado vazio (empty state).
   Sem essas três definições, a task de implementação está incompleta.

3. **Cache e revalidação são decisões explícitas**
   Para cada fonte de dado, deve estar definido:
   - O dado pode ser cacheado? Por quanto tempo?
   - Precisa revalidar em foco de janela, intervalo, ou apenas sob ação do usuário?
   - É um dado que pode ficar "stale" (desatualizado) por um tempo aceitável, ou precisa estar sempre fresco?

4. **Evitar fetch em cascata desnecessário**
   Se um componente busca dado A, e o filho busca dado B que depende de A, avaliar se B pode ser buscado em paralelo ou no mesmo request, para evitar waterfalls que degradam performance percebida.

5. **Fronteira clara entre fetch e apresentação**
   Componentes de apresentação não devem fazer fetch diretamente — devem recebê-lo via props ou hook dedicado, mantendo testabilidade.

## Critérios de aceite

- [ ] Toda feature com fetch define loading, error e empty state explicitamente.
- [ ] Estratégia de cache/revalidação está documentada por fonte de dado.
- [ ] Não há fetch em cascata evitável (waterfall).
- [ ] Fetch não está embutido em componente de apresentação puro.
