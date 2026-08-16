# Guideline: Component Design

> Escopo: aplica-se a qualquer skill de implementação front-end baseada em React (Next.js, Remix, CRA, Vite, etc). Esta guideline é agnóstica à stack e deve ser consultada durante as fases de `plan` e `implementation` do SDD.

## Princípios

1. **Responsabilidade única**
   Cada componente deve resolver um problema. Se um componente cresce e passa a lidar com múltiplas preocupações (busca de dados + lógica de formulário + apresentação), ele deve ser quebrado.
   - Sinal de alerta: componente com mais de ~150-200 linhas, ou mais de 5-6 responsabilidades distintas no nome/uso.

2. **Composição sobre configuração**
   Preferir `children`, `slots` e composição de componentes a props booleanas que alteram comportamento internamente (`variant`, `showX`, `isY`).
   - Ruim: `<Card showHeader hasFooter footerType="actions" />`
   - Bom: `<Card><Card.Header /><Card.Footer><Actions /></Card.Footer></Card>`

3. **Separação apresentação vs. lógica**
   - Componentes de apresentação: recebem dados via props, não sabem de onde vêm, são fáceis de testar isoladamente.
   - Componentes com lógica (containers/hooks): concentram fetching, side-effects, orquestração de estado.
   - Esta separação deve ser explícita na spec da feature, não decidida ad-hoc durante a implementação.

4. **Previsibilidade de nomenclatura**
   - Um componente por arquivo.
   - Nome do arquivo = nome do componente (`UserCard.tsx` exporta `UserCard`).
   - PascalCase para componentes, camelCase para hooks e utilitários.
   - Hooks customizados sempre prefixados com `use`.

5. **Props explícitas e tipadas**
   - Evitar `...rest` sem justificativa documentada.
   - Props opcionais devem ter defaults claros (via destructuring ou `defaultProps` quando aplicável).
   - Evitar props que aceitam `any`/`unknown` sem necessidade real.

6. **Limite de profundidade de prop drilling**
   - Se uma prop atravessa mais de 2-3 níveis de componentes apenas para repasse, é sinal de que deveria virar contexto, composição, ou estado colocado mais próximo do uso.

## Critérios de aceite (para a fase de validation do SDD)

- [ ] Nenhum componente acumula mais de uma responsabilidade primária.
- [ ] Não há prop drilling além de 2-3 níveis sem justificativa.
- [ ] Componentes de apresentação não fazem fetch de dados diretamente.
- [ ] Nomenclatura de arquivos e componentes é consistente com o padrão do projeto.
