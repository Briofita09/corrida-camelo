# Guideline: Acessibilidade

> Escopo: agnóstica à stack. Trata acessibilidade como requisito de spec, não como polimento opcional de última hora.

## Princípios

1. **HTML semântico como padrão**
   Usar elementos nativos com significado (`button`, `nav`, `main`, `header`, `label`, `table`) antes de recorrer a `div`/`span` com comportamento simulado via JS. Um `<div onClick>` fingindo ser botão só é aceitável quando não há alternativa nativa viável, e mesmo assim precisa de `role` e suporte a teclado equivalente.

2. **Navegação por teclado é requisito, não extra**
   Todo elemento interativo (botões, links, campos, itens de menu, modais) deve ser:
   - Alcançável via `Tab`.
   - Operável via teclado (`Enter`/`Space` para ativar, `Esc` para fechar overlays, setas quando aplicável em componentes tipo menu/combobox).
   - Com foco visível (não remover outline sem substituir por indicador visual equivalente).

3. **Labels e nomes acessíveis**
   - Todo input tem `label` associado (via `htmlFor`/`id` ou `aria-label` quando label visual não é possível).
   - Ícones usados como botão sem texto visível precisam de `aria-label` descritivo.
   - Imagens informativas precisam de `alt` descritivo; imagens decorativas usam `alt=""`.

4. **Gerenciamento de foco em interações dinâmicas**
   - Ao abrir um modal/dialog, o foco deve mover para dentro dele; ao fechar, deve retornar ao elemento que o acionou.
   - Mudanças de conteúdo assíncronas relevantes (erros, confirmações) devem ser anunciadas via `aria-live` quando apropriado.

5. **Contraste e legibilidade**
   Contraste de texto deve atender no mínimo WCAG AA para o contexto (ajustar conforme o padrão exigido pelo projeto).

## Critérios de aceite

- [ ] Elementos interativos usam semântica nativa ou `role`+comportamento de teclado equivalente.
- [ ] Toda a jornada da feature é operável apenas com teclado.
- [ ] Todo input/ícone-botão tem nome acessível.
- [ ] Foco é gerenciado corretamente em modais/overlays.
- [ ] Contraste mínimo definido pelo projeto é respeitado.
