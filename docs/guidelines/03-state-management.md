# Guideline: State Management

> Escopo: agnóstica a biblioteca de state management (Context API, Zustand, Redux, Jotai, etc). Define onde cada tipo de estado deve morar antes de decidir a ferramenta.

## Princípios

1. **Hierarquia de decisão: local antes de global**
   Ordem de preferência ao decidir onde colocar um estado:
   1. Estado local do componente (`useState`/`useReducer`).
   2. Estado elevado (lifting state up) para o ancestral comum mais próximo.
   3. Estado compartilhado via contexto, apenas se múltiplos componentes não-relacionados diretamente precisarem dele.
   4. Store global (Zustand/Redux/etc), apenas se o estado precisa ser acessado/mutado de partes muito distintas da aplicação, ou precisa persistir entre navegações de forma complexa.

2. **Classificação obrigatória do tipo de estado**
   Toda spec de feature deve identificar explicitamente a que categoria cada estado pertence:
   - **Server state**: dados vindos de uma API/banco (cache, fetch, revalidação). Não deve ser tratado como estado de UI comum — usar camada dedicada (cache de dados) em vez de `useState` + `useEffect` manual sempre que possível.
   - **UI state**: estado efêmero de interface (modal aberto, tab selecionada, input em edição). Vive local ao componente.
   - **URL state**: estado que deveria ser reflexo da URL (filtros, paginação, tab ativa persistente). Deve viver em query params/route params, não duplicado em `useState`.
   - **Form state**: estado de formulário, preferencialmente isolado com lib dedicada ou padrão consistente, não misturado com UI state genérico.

3. **Evitar estado derivável**
   Se um valor pode ser calculado a partir de outro estado/prop existente, ele não deve ser armazenado separadamente.
   - Ruim: manter `filteredList` em estado e sincronizar com `useEffect` toda vez que `list` ou `filter` mudam.
   - Bom: calcular `filteredList` diretamente no corpo do componente (ou memoizar se o cálculo for caro).

4. **Evitar sincronização manual entre estados**
   `useEffect` para "sincronizar" um estado com outro é um sinal de que o estado está modelado incorretamente. Preferir derivar o valor ou consolidar a fonte de verdade.

## Critérios de aceite

- [ ] Cada estado da feature está classificado (server / UI / URL / form).
- [ ] Nenhum estado é global por padrão sem justificativa de compartilhamento real.
- [ ] Não há estado duplicado que poderia ser derivado.
- [ ] Não há `useEffect` usado apenas para sincronizar dois estados que poderiam ser um só.
