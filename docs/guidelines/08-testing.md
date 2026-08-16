# Guideline: Testes

> Escopo: agnóstica à ferramenta (Jest, Vitest, Testing Library, Playwright, Cypress, etc). Define o que testar e em que nível, alimentando a fase de `validation` do SDD.

## Princípios

1. **Testar comportamento, não implementação**
   Testes devem validar o que o usuário vê/faz, não detalhes internos (nome de estado interno, estrutura de props privadas). Preferir queries por papel/texto visível (ex. estilo Testing Library: `getByRole`, `getByLabelText`) em vez de seletores por classe CSS ou estrutura interna do DOM.

2. **Pirâmide de testes definida por tipo de componente**
   A fase de `plan` do SDD deve indicar, por parte da feature, qual nível de teste se aplica:
   - **Unitário**: funções puras, hooks isolados, lógica de transformação de dados.
   - **Integração**: componente + suas dependências diretas (ex. formulário completo com validação), sem subir a aplicação inteira.
   - **E2E**: fluxo crítico do usuário de ponta a ponta (ex. login, checkout), reservado para os caminhos mais importantes — não para cobrir cada variação de UI.

3. **Toda spec de feature define critérios de teste antes da implementação**
   Antes de implementar, deve estar claro: quais comportamentos são "críticos" (precisam de teste automatizado) e quais são "triviais" (cobertura visual/manual é suficiente). Isso evita tanto sub-teste quanto over-testing de UI trivial.

4. **Estados assíncronos e de erro fazem parte do escopo de teste**
   Loading, erro e empty state (definidos na guideline de Data Fetching) devem ter teste correspondente — não apenas o "caminho feliz".

5. **Acessibilidade testável**
   Sempre que possível, os testes de integração devem cobrir também navegação por teclado e nomes acessíveis dos elementos centrais da feature, reforçando a guideline de Acessibilidade.

## Critérios de aceite

- [ ] Testes usam queries orientadas a comportamento/acessibilidade, não a detalhes de implementação.
- [ ] Nível de teste (unitário/integração/e2e) foi definido na fase de plan, não decidido ad-hoc.
- [ ] Loading, erro e empty state têm cobertura de teste.
- [ ] Fluxos críticos do usuário têm teste E2E; variações triviais de UI não exigem E2E.
