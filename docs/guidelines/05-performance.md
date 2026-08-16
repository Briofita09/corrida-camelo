# Guideline: Performance

> Escopo: agnóstica à stack. Define quando otimizar e como medir, evitando otimização prematura.

## Princípios

1. **Medir antes de otimizar**
   Memoização (`memo`, `useMemo`, `useCallback`) não é padrão a ser aplicado em todo componente/função. Só deve ser introduzida quando:
   - Há um problema de performance medido (profiler, re-render excessivo comprovado), ou
   - O componente está em um caminho crítico conhecido (lista grande, render frequente).
   Aplicar memoização "preventivamente" em tudo aumenta complexidade sem garantia de ganho.

2. **Code splitting e lazy loading como padrão para o que é pesado**
   - Rotas devem ser carregadas sob demanda por padrão (comportamento nativo em frameworks modernos).
   - Componentes pesados que não aparecem no primeiro render (modais, editores ricos, gráficos complexos) devem ser carregados de forma lazy.

3. **Evitar recriação desnecessária de objetos/funções em render**
   Isso não significa memoizar tudo — significa não criar objetos/arrays literais complexos inline em props quando isso causa re-render comprovado em componentes filhos caros.

4. **Listas grandes precisam de estratégia explícita**
   Para listas com potencial de crescer (dezenas/centenas de itens), a spec deve definir: paginação, virtualização, ou infinite scroll. Renderizar tudo de uma vez sem estratégia não é aceitável além de um limiar razoável (ex. defina o limiar por projeto).

5. **Performance como critério de aceite, não afterthought**
   Métricas relevantes (ex. Core Web Vitals: LCP, CLS, INP) devem ser consideradas na validação da feature quando a feature afeta uma página visível ao usuário — não apenas "funciona" como critério de pronto.

## Critérios de aceite

- [ ] Memoização usada apenas onde há problema medido ou caminho crítico identificado.
- [ ] Componentes pesados fora do critical path usam lazy loading.
- [ ] Listas potencialmente grandes têm estratégia definida (paginação/virtualização/infinite scroll).
- [ ] Impacto em métricas de performance foi considerado quando a feature afeta página visível.
