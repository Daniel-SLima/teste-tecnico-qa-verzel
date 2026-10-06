# Relatório de Testes — Verzel Store

## 1. Contexto e escopo

Foram validadas as regras de cupom de desconto e frete grátis no carrinho da Verzel Store, pela interface e pelo endpoint de cálculo da API. O carrinho é mantido por aba e a API de cálculo não depende de pedidos persistidos. Essas características do ambiente orientam a leitura dos resultados; a finalização de pedidos não fez parte do CT-05.

## 2. Cobertura dos critérios

| Critério | Situação | Cenário ou evidência relacionada |
| --- | --- | --- |
| CA01 | ATENDIDO | CT-01 e CT-03: BEMVINDO10 aceito e aplicado. |
| CA02 | ATENDIDO | CT-03: espaços e letras minúsculas normalizados. |
| CA03 | ATENDIDO | CT-04: NAOEXISTE rejeitado sem desconto. |
| CA04 | ATENDIDO | CT-04: VERAO2026 expirado rejeitado sem desconto. |
| CA05 | COBERTURA PARCIAL | CT-03: cupom removido e reaplicado; sem troca entre dois cupons válidos. |
| CA06 | NÃO ATENDIDO | CT-01 abaixo e CT-03 acima do limite; CT-02 falhou em R$ 200,00 (BUG-01). |
| CA07 | ATENDIDO | CT-01 e CT-02: valor faltante coerente abaixo do limite; na fronteira, ver BUG-01. |
| CA08 | ATENDIDO | CT-03: frete grátis com subtotal de R$ 219,80, mesmo após desconto para R$ 197,82. |
| CA09 | ATENDIDO | CT-01: desconto de R$ 19,98 somente sobre produtos; frete de R$ 19,90 preservado. |
| CA10 | NÃO ATENDIDO | CT-02: interface limita a cinco; CT-05: API aceita seis (BUG-02). |
| CA11 | COBERTURA PARCIAL | CT-01/CT-03 verificam valores com duas casas; os dados disponíveis não exigem arredondar terceira casa. |

CA05 permanece parcial porque há apenas um cupom válido documentado. CA06 falha na fronteira exata de R$ 200,00. CA10 funciona na interface, mas falha em `POST /api/carrinho/calcular`. CA11 não pôde ter o arredondamento efetivamente exercitado com os preços e o cupom fornecidos.

## 3. Cenários e execução

### CT-01 — Cupom válido abaixo do limite de frete grátis

**Prioridade:** Alta. **Critérios:** CA01, CA06 (lado abaixo da fronteira), CA07, CA09, CA11 (parcial).

```gherkin
Funcionalidade: Cupom de desconto e frete

  Cenário: Aplicar BEMVINDO10 abaixo do limite de frete grátis
    Dado que o carrinho contém uma Camiseta Essencial e uma Calça Jeans Slim
    E o subtotal dos produtos é R$ 199,80
    Quando aplico o cupom BEMVINDO10
    Então o desconto sobre os produtos deve ser R$ 19,98
    E o frete deve ser R$ 19,90
    E o total deve ser R$ 199,72
    E o carrinho deve informar que faltam R$ 0,20 para o frete grátis
```

**Resultado: PASS.** Execução revalidada manualmente: dois produtos, cupom aplicado, subtotal R$ 199,80, desconto R$ 19,98, frete R$ 19,90, total R$ 199,72 e faltante R$ 0,20. [Evidência manual](evidencias/CT-01-carrinho-cupom-aplicado.png).

### CT-02 — Fronteira do frete grátis e limite de unidades na interface

**Prioridade:** Alta. **Critérios:** CA06, CA07, CA10 (interface).

```gherkin
Funcionalidade: Frete grátis e quantidade máxima no carrinho

  Cenário: Atingir o limite de frete grátis e o máximo de unidades na interface
    Dado que o carrinho contém três Garrafas Térmicas 750ml
    Então o subtotal deve ser R$ 150,00
    E o frete deve ser R$ 19,90
    E o valor faltante para frete grátis deve ser R$ 50,00
    Quando a quantidade passa para quatro unidades
    Então o subtotal deve ser R$ 200,00
    E o frete deve ser grátis
    Quando a quantidade passa para cinco unidades
    Então as cinco unidades devem ser aceitas
    E o frete deve continuar grátis
    Quando tento adicionar uma sexta unidade do mesmo produto
    Então a interface deve impedir que a quantidade exceda cinco
    E os valores do carrinho devem permanecer coerentes
```

**Resultado: FAIL.** Com três unidades: R$ 150,00, frete R$ 19,90 e faltante R$ 50,00. Com quatro: subtotal R$ 200,00, porém frete R$ 19,90, total R$ 219,90 e mensagem “Faltam R$ 0,00 para o frete grátis.” (BUG-01). Com cinco: R$ 250,00, frete grátis, total R$ 250,00; a interface bloqueou a sexta unidade no carrinho e na vitrine. [Fronteira de R$ 200,00](evidencias/BUG-01-frete-cobrado-subtotal-200.png) · [Limite na interface](evidencias/CT-02-limite-5-unidades-ui.png).

### CT-03 — Normalização do cupom e frete pelo subtotal antes do desconto

**Prioridade:** Alta. **Critérios:** CA01, CA02, CA05 (parcial), CA06, CA08, CA11 (parcial).

```gherkin
Funcionalidade: Cupom e frete grátis

  Cenário: Aplicar, remover e reaplicar cupom com frete grátis
    Dado que o carrinho contém um Tênis Casual Urbano e um Kit 3 Pares de Meias
    E o subtotal dos produtos é R$ 219,80
    Quando aplico o código "  bemvindo10  "
    Então o cupom deve ser apresentado como BEMVINDO10
    E o desconto deve ser R$ 21,98
    E o frete deve ser grátis, calculado pelo subtotal antes do desconto
    E o total deve ser R$ 197,82
    Quando removo o cupom
    Então o desconto deve voltar a R$ 0,00
    E o frete deve permanecer grátis
    E o total deve voltar a R$ 219,80
    Quando aplico BEMVINDO10 novamente
    Então o desconto deve voltar a R$ 21,98
    E o total deve voltar a R$ 197,82
```

**Resultado: PASS.** Produtos P003 e P006, uma unidade de cada. O cupom foi normalizado; os valores esperados apareceram. Enquanto aplicado, a interface mostrou apenas a opção de remoção. Após remover, o campo voltou, os valores foram recalculados e a reaplicação funcionou. Essa reaplicação valida a reabertura do fluxo, sem provar troca entre dois cupons válidos. [Cupom aplicado](evidencias/CT-03-cupom-frete-gratis.png) · [Após remoção](evidencias/CT-03-cupom-removido.png).

### CT-04 — Rejeição de cupons inexistente e expirado

**Prioridade:** Média. **Critérios:** CA03, CA04.

```gherkin
Funcionalidade: Validação de cupons

  Esquema do Cenário: Rejeitar cupom que não pode ser aplicado
    Dado que o carrinho contém uma Mochila Urbana 20L de R$ 100,00
    Quando tento aplicar o cupom <codigo>
    Então devo ver a mensagem <mensagem>
    E o subtotal deve permanecer R$ 100,00
    E o desconto deve permanecer R$ 0,00
    E o frete deve permanecer R$ 19,90
    E o total deve permanecer R$ 119,90

    Exemplos:
      | codigo    | mensagem          |
      | NAOEXISTE | "Cupom inválido." |
      | VERAO2026 | "Cupom expirado." |
```

**Resultado: PASS nas duas variações.** NAOEXISTE exibiu “Cupom inválido.”; VERAO2026 exibiu “Cupom expirado.”. Em ambas, subtotal R$ 100,00, desconto R$ 0,00, frete R$ 19,90 e total R$ 119,90. [Cupom inexistente](evidencias/CT-04-cupom-invalido.png) · [Cupom expirado](evidencias/CT-04-cupom-expirado.png).

### CT-05 — Limite de cinco unidades na API de cálculo

**Prioridade:** Alta. **Critério:** CA10 (API `POST /api/carrinho/calcular`).

```gherkin
Funcionalidade: Limite de unidades no cálculo do carrinho

  Cenário: Aceitar cinco unidades e rejeitar seis unidades do mesmo produto
    Dado que solicito o cálculo do carrinho com cinco unidades da Garrafa Térmica 750ml
    Então a API deve responder com status 200
    E o cálculo deve considerar as cinco unidades
    Quando solicito o cálculo com seis unidades do mesmo produto
    Então a API deve responder com status 422
    E o código do erro deve ser QUANTIDADE_MAXIMA_EXCEDIDA
```

**Resultado: FAIL.** Cinco unidades de P008: HTTP 200, subtotal R$ 250,00, desconto R$ 0,00, frete grátis e total R$ 250,00. Seis unidades: HTTP 200 e cálculo aceito (subtotal e total R$ 300,00), em vez de HTTP 422 e código de erro esperado. BUG-02 foi reproduzido 2/2 manualmente e também se manifesta no teste automatizado como *expected failure*. [Evidência da API](evidencias/BUG-02-api-aceita-6-unidades.png).

## 4. Testes exploratórios

### EX-01 — Cupom após alteração do carrinho

**Missão:** observar se o cupom acompanha mudança de quantidade. Com BEMVINDO10 aplicado a um Tênis e um Kit de Meias, o subtotal/desconto/total eram R$ 219,80/R$ 21,98/R$ 197,82. Ao aumentar o Kit de uma para duas unidades, passaram a R$ 249,70/R$ 24,97/R$ 224,73; ao reduzir, retornaram aos valores iniciais. O cupom permaneceu aplicado e o frete grátis permaneceu coerente. **Resultado: sem achados.** [Antes](evidencias/EX-01-antes-alteracao-carrinho.png) · [Após alteração](evidencias/EX-01-apos-alteracao-carrinho.png).

### EX-02 — Perder e recuperar o frete grátis

**Missão:** observar a transição do frete após remover e repor um produto, sem cupom. Com Tênis e Kit de Meias: subtotal e total R$ 219,80, frete grátis. Sem o Kit: subtotal R$ 189,90, frete R$ 19,90, total R$ 209,80 e faltante R$ 10,10. Ao repor o Kit, subtotal e total voltaram a R$ 219,80, frete grátis e mensagem de faltante ausente. **Resultado: sem achados.** [Frete pago](evidencias/EX-02-frete-pago-apos-remocao.png) · [Frete grátis recuperado](evidencias/EX-02-frete-gratis-recuperado.png).

### EX-03 — Consistência do resumo entre carrinho, checkout e confirmação

**Missão:** validar se os valores de cupom e frete permanecem coerentes até a confirmação. Com um Tênis Casual Urbano, um Kit 3 Pares de Meias e BEMVINDO10, carrinho, checkout e confirmação apresentaram os mesmos produtos e valores: subtotal R$ 219,80, desconto R$ 21,98, frete grátis e total R$ 197,82. O pedido foi confirmado com número fictício e informação de pagamento na entrega, conforme as simplificações documentadas. **Resultado: sem achados.** [Checkout](evidencias/EX-03-checkout-valores-consistentes.png) · [Confirmação](evidencias/EX-03-confirmacao-pedido-valores-consistentes.png).

## 5. Bugs confirmados

<a id="bug-01"></a>
### BUG-01 — Frete grátis não é aplicado quando o subtotal é exatamente R$ 200,00

- **Severidade:** Média. **Critério:** CA06. **Reprodutibilidade:** 2/2.
- **Pré-condição:** carrinho sem cupom, com a Garrafa Térmica 750ml (R$ 50,00 por unidade).
- **Passos:** colocar três unidades no carrinho; aumentar para quatro; observar frete, total e mensagem. Repetir a transição de três para quatro.
- **Esperado:** com subtotal de R$ 200,00, frete grátis e total de R$ 200,00.
- **Observado:** subtotal R$ 200,00, frete R$ 19,90, total R$ 219,90 e “Faltam R$ 0,00 para o frete grátis.” A mensagem é consequência do mesmo defeito, sem registro separado.
- **Evidência:** [BUG-01-frete-cobrado-subtotal-200.png](evidencias/BUG-01-frete-cobrado-subtotal-200.png).

<a id="bug-02"></a>
### BUG-02 — API de cálculo do carrinho aceita quantidade acima do limite máximo de 5 unidades

- **Severidade:** Média. **Critério:** CA10. **Reprodutibilidade:** 2/2 na execução manual.
- **Endpoint:** `POST /api/carrinho/calcular`.
- **Payload:**

  ```json
  {"itens":[{"produtoId":"P008","quantidade":6}]}
  ```

- **Esperado:** HTTP 422 e `erro.codigo = QUANTIDADE_MAXIMA_EXCEDIDA`.
- **Observado:** HTTP 200; a API calcula seis unidades com subtotal R$ 300,00, desconto R$ 0,00, frete R$ 0,00, `freteGratis: true` e total R$ 300,00.
- **Evidência:** [BUG-02-api-aceita-6-unidades.png](evidencias/BUG-02-api-aceita-6-unidades.png).
- **Limite da conclusão:** `POST /api/pedidos` não foi testado com seis unidades. O defeito comprovado se restringe ao endpoint de cálculo.

## 6. Evidências

| Arquivo | Cenário/bug | Conteúdo |
| --- | --- | --- |
| [CT-01-carrinho-cupom-aplicado.png](evidencias/CT-01-carrinho-cupom-aplicado.png) | CT-01 | Revalidação manual: produtos, cupom e valores. |
| [BUG-01-frete-cobrado-subtotal-200.png](evidencias/BUG-01-frete-cobrado-subtotal-200.png) | CT-02 / BUG-01 | Frete cobrado no subtotal de R$ 200,00. |
| [CT-02-limite-5-unidades-ui.png](evidencias/CT-02-limite-5-unidades-ui.png) | CT-02 / CA10 | Bloqueio na vitrine ao atingir cinco unidades. |
| [CT-03-cupom-frete-gratis.png](evidencias/CT-03-cupom-frete-gratis.png) | CT-03 | Cupom aplicado e frete grátis. |
| [CT-03-cupom-removido.png](evidencias/CT-03-cupom-removido.png) | CT-03 | Valores após remover cupom. |
| [CT-04-cupom-invalido.png](evidencias/CT-04-cupom-invalido.png) | CT-04 / CA03 | Cupom inexistente rejeitado. |
| [CT-04-cupom-expirado.png](evidencias/CT-04-cupom-expirado.png) | CT-04 / CA04 | Cupom expirado rejeitado. |
| [BUG-02-api-aceita-6-unidades.png](evidencias/BUG-02-api-aceita-6-unidades.png) | CT-05 / BUG-02 | Respostas da API para cinco e seis unidades. |
| [EX-01-antes-alteracao-carrinho.png](evidencias/EX-01-antes-alteracao-carrinho.png) | EX-01 | Carrinho com cupom antes da alteração. |
| [EX-01-apos-alteracao-carrinho.png](evidencias/EX-01-apos-alteracao-carrinho.png) | EX-01 | Desconto recalculado após alterar quantidade. |
| [EX-02-frete-pago-apos-remocao.png](evidencias/EX-02-frete-pago-apos-remocao.png) | EX-02 | Frete pago após retirar o Kit. |
| [EX-02-frete-gratis-recuperado.png](evidencias/EX-02-frete-gratis-recuperado.png) | EX-02 | Frete grátis restabelecido. |
| [EX-03-checkout-valores-consistentes.png](evidencias/EX-03-checkout-valores-consistentes.png) | EX-03 | Produtos e valores preservados no checkout. |
| [EX-03-confirmacao-pedido-valores-consistentes.png](evidencias/EX-03-confirmacao-pedido-valores-consistentes.png) | EX-03 | Produtos e valores preservados na confirmação. |

## 7. Limitações e interpretações

- **CA05:** somente um cupom válido está documentado. Remover e reaplicar BEMVINDO10 não demonstra troca bem-sucedida entre dois cupons válidos.
- **CA11:** os preços disponíveis são múltiplos de R$ 0,10 e BEMVINDO10 aplica 10%; os dados fornecidos não produzem terceira casa decimal que exija arredondamento.
- **“Primeira compra”:** expressão da vitrine tratada como ambiguidade. CA01 não estabelece elegibilidade por histórico e pedidos não são persistidos; não foi classificada como bug.
- **Escopo adjacente:** EX-03 acompanhou cupom e frete até a confirmação; validações exaustivas dos campos de checkout e erros genéricos da API não foram priorizados.
