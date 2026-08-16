# Guideline: Rendering Strategy (Server vs Client)

> Escopo: relevante para stacks com React Server Components (Next.js App Router e similares). Em stacks sem RSC, aplicar o princípio equivalente de "renderizar no servidor sempre que possível".

## Princípios

1. **Server por padrão**
   Um componente só deve rodar no client quando existe uma razão concreta:
   - Precisa de estado local (`useState`, `useReducer`).
   - Precisa de efeitos (`useEffect`) ou lifecycle no browser.
   - Precisa de interatividade (event handlers: `onClick`, `onChange`, etc).
   - Precisa de APIs exclusivas do browser (`window`, `localStorage`, geolocalização, etc).
   - Usa uma lib que depende de client-side.

   Se nenhuma dessas razões existir, o componente permanece no server.

2. **Fronteiras explícitas**
   - O ponto de transição server → client deve ser um componente pequeno e isolado ("client boundary"), não a página inteira.
   - Evitar marcar arquivos inteiros como client apenas porque um filho pequeno precisa ser interativo — extrair o filho.

3. **Dados não devem "vazar" desnecessariamente para o client**
   - Buscar e processar dados no server sempre que possível; passar para o client apenas o necessário para renderizar/interagir.
   - Evitar passar objetos grandes ou sensíveis como props de server para client component sem necessidade.

4. **Composição server/client**
   - Server Components podem renderizar Client Components, mas não o contrário diretamente.
   - Client Components podem receber Server Components como `children` (padrão de "slot") para evitar empurrar toda a árvore para o client.

## Critérios de aceite

- [ ] Cada uso de diretiva de client (`"use client"` ou equivalente) tem uma justificativa identificável (estado, efeito, evento, API de browser).
- [ ] A fronteira client é o menor componente possível, não a página/layout inteiro.
- [ ] Nenhum dado sensível ou desnecessariamente grande é repassado para o client sem propósito.
