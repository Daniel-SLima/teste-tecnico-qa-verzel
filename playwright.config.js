const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'https://verzel-store.qa-test-verzel-store.workers.dev',
    browserName: 'chromium',
  },
});
