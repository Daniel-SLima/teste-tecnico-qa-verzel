const { test, expect } = require('@playwright/test');

async function addProduct(page, name) {
  const product = page.getByRole('listitem').filter({
    has: page.getByRole('heading', { name, exact: true }),
  });
  await product.getByRole('button', { name: 'Adicionar ao carrinho' }).click();
}

function summaryValue(page, name) {
  return page
    .getByRole('region', { name: 'Resumo do pedido' })
    .locator(`[data-valor="${name}"]`);
}

test('CT-01 — BEMVINDO10 abaixo do limite de frete grátis', async ({ page }) => {
  await page.goto('/');
  await addProduct(page, 'Camiseta Essencial');
  await addProduct(page, 'Calça Jeans Slim');
  await page.getByRole('link', { name: /^Carrinho\b/ }).click();

  await page.getByLabel('Cupom de desconto').fill('BEMVINDO10');
  await page.getByRole('button', { name: 'Aplicar cupom' }).click();

  await expect(page.getByText('Cupom BEMVINDO10 aplicado.', { exact: true })).toBeVisible();
  await expect(summaryValue(page, 'subtotal')).toHaveText('R$ 199,80');
  await expect(summaryValue(page, 'desconto')).toHaveText('- R$ 19,98');
  await expect(summaryValue(page, 'frete')).toHaveText('R$ 19,90');
  await expect(summaryValue(page, 'total')).toHaveText('R$ 199,72');
  await expect(page.getByText('Faltam R$ 0,20 para o frete grátis.', { exact: true })).toBeVisible();
});

test('CT-03 — cupom normalizado mantém frete grátis pelo subtotal', async ({ page }) => {
  await page.goto('/');
  await addProduct(page, 'Tênis Casual Urbano');
  await addProduct(page, 'Kit 3 Pares de Meias');
  await page.getByRole('link', { name: /^Carrinho\b/ }).click();

  await page.getByLabel('Cupom de desconto').fill('  bemvindo10  ');
  await page.getByRole('button', { name: 'Aplicar cupom' }).click();

  await expect(page.getByText('Cupom BEMVINDO10 aplicado.', { exact: true })).toBeVisible();
  await expect(summaryValue(page, 'subtotal')).toHaveText('R$ 219,80');
  await expect(summaryValue(page, 'desconto')).toHaveText('- R$ 21,98');
  await expect(summaryValue(page, 'frete')).toHaveText('Grátis');
  await expect(summaryValue(page, 'total')).toHaveText('R$ 197,82');

  await page.getByRole('button', { name: 'Remover cupom' }).click();
  await expect(page.getByLabel('Cupom de desconto')).toBeVisible();
  await expect(summaryValue(page, 'desconto')).toHaveText('R$ 0,00');
  await expect(summaryValue(page, 'frete')).toHaveText('Grátis');
  await expect(summaryValue(page, 'total')).toHaveText('R$ 219,80');

  await page.getByLabel('Cupom de desconto').fill('BEMVINDO10');
  await page.getByRole('button', { name: 'Aplicar cupom' }).click();
  await expect(summaryValue(page, 'desconto')).toHaveText('- R$ 21,98');
  await expect(summaryValue(page, 'frete')).toHaveText('Grátis');
  await expect(summaryValue(page, 'total')).toHaveText('R$ 197,82');
});

for (const { title, code, message } of [
  { title: 'CT-04 — cupom inexistente é rejeitado', code: 'NAOEXISTE', message: 'Cupom inválido.' },
  { title: 'CT-04 — cupom expirado é rejeitado', code: 'VERAO2026', message: 'Cupom expirado.' },
]) {
  test(title, async ({ page }) => {
    await page.goto('/');
    await addProduct(page, 'Mochila Urbana 20L');
    await page.getByRole('link', { name: /^Carrinho\b/ }).click();

    await page.getByLabel('Cupom de desconto').fill(code);
    await page.getByRole('button', { name: 'Aplicar cupom' }).click();

    await expect(page.getByRole('alert')).toHaveText(message);
    await expect(summaryValue(page, 'subtotal')).toHaveText('R$ 100,00');
    await expect(summaryValue(page, 'desconto')).toHaveText('R$ 0,00');
    await expect(summaryValue(page, 'frete')).toHaveText('R$ 19,90');
    await expect(summaryValue(page, 'total')).toHaveText('R$ 119,90');
  });
}

test('CT-05 / BUG-02 — API rejeita mais de cinco unidades', async ({ request }) => {
  const validResponse = await request.post('/api/carrinho/calcular', {
    data: { itens: [{ produtoId: 'P008', quantidade: 5 }] },
  });
  expect(validResponse.status()).toBe(200);
  const validCart = await validResponse.json();
  expect(validCart.itens).toEqual([
    expect.objectContaining({ produtoId: 'P008', quantidade: 5, total: 250 }),
  ]);
  expect(validCart.subtotal).toBe(250);
  expect(validCart.desconto).toBe(0);
  expect(validCart.frete).toBe(0);
  expect(validCart.freteGratis).toBe(true);
  expect(validCart.total).toBe(250);

  test.fail(true, 'BUG-02: /api/carrinho/calcular aceita 6 unidades; CA10 exige rejeição');
  const invalidResponse = await request.post('/api/carrinho/calcular', {
    data: { itens: [{ produtoId: 'P008', quantidade: 6 }] },
  });
  expect(invalidResponse.status()).toBe(422);
  const invalidBody = await invalidResponse.json();
  expect(invalidBody.erro.codigo).toBe('QUANTIDADE_MAXIMA_EXCEDIDA');
});
