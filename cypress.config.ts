import { defineConfig } from "cypress";

export default defineConfig({
  e2e: {
    baseUrl:
      process.env.CYPRESS_BASE_URL ||
      "https://takehome-desktop.d.tekvisionflow.com",
    specPattern: "cypress/e2e/**/*.cy.ts",
    supportFile: "cypress/support/e2e.ts",
  },
  env: {
    BASE_URL:
      process.env.CYPRESS_BASE_URL ||
      "https://takehome-desktop.d.tekvisionflow.com",
  },
});
