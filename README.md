# Teste Técnico QA Júnior — Verzel

Validação da aplicação de cupons e da regra de frete grátis da Verzel Store, com execução manual, sessões exploratórias, bugs documentados e automação Playwright.

## Entregas

- [Cenários, resultados e bugs](relatorio-testes.md)
- [Evidências](evidencias/)
- [Testes Playwright](tests/store.spec.js)

## Automação

Pré-requisito: Node.js e npm instalados. Na raiz do projeto:

```bash
npm install
npx playwright install chromium
npm test
```

## Resultado atual

Quatro testes automatizados validam comportamentos atualmente corretos (CT-01, CT-03 e as duas variações de CT-04). O quinto, CT-05 / BUG-02, executa a regra da API como *expected failure* por meio de `test.fail()`; o defeito continua presente. O diagnóstico confirmou **HTTP esperado 422, recebido 200** para seis unidades. Se o Playwright mostrar `5 passed`, isso inclui a falha conhecida considerada esperada pelo executor, sem indicar que o bug foi corrigido.

## Bugs encontrados

- [BUG-01 — Frete cobrado com subtotal de R$ 200,00](relatorio-testes.md#bug-01)
- [BUG-02 — API aceita seis unidades](relatorio-testes.md#bug-02)
