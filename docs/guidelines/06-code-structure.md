# Guideline: Estrutura de Código

> Escopo: agnóstica à stack. Define organização de pastas e colocation, não convenções específicas de um framework.

## Princípios

1. **Organização por feature/domínio, não por tipo de arquivo**
   - Preferir agrupar por domínio: `features/checkout/`, `features/user-profile/`.
   - Evitar agrupar globalmente por tipo: `components/`, `hooks/`, `utils/` como únicas pastas de topo, misturando features não relacionadas.
   - Estrutura compartilhada/genuinamente reutilizável (design system, utilitários realmente cross-feature) pode ter sua própria pasta de nível superior (`shared/`, `ui/`), mas deve ser reservada para o que é de fato compartilhado — não um "depósito" geral.

2. **Colocation**
   Arquivos que mudam juntos devem morar juntos: componente, seu teste, seus estilos (se locais) e seus tipos específicos devem ficar na mesma pasta da feature, não espalhados em árvores paralelas.

3. **Fronteiras claras entre camadas**
   - Camada de apresentação (UI) separada da camada de lógica de domínio/negócio.
   - Camada de acesso a dados (chamadas de API, queries) isolada e não misturada diretamente dentro de componentes de UI.

4. **Evitar acoplamento circular entre features**
   Uma feature não deve importar diretamente de dentro de outra feature. Se duas features precisam compartilhar algo, esse algo deve ser extraído para uma camada compartilhada explícita.

5. **Nomenclatura e index files previsíveis**
   - Evitar `index.ts` "barrel files" gigantes que reexportam tudo sem critério — isso dificulta tree-shaking e navegação.
   - Quando usados, devem ser escopados por pasta pequena (ex. o barril de uma feature específica), não um único barril global da aplicação.

## Critérios de aceite

- [ ] Organização segue domínio/feature, não apenas tipo de arquivo.
- [ ] Arquivos relacionados (componente/teste/tipos) estão colocados juntos.
- [ ] Não há import direto entre duas features sem passar por camada compartilhada.
- [ ] Não há barrel files globais que agregam a aplicação inteira.
