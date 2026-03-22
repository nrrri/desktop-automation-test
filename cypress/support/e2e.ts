// =============================================================================
// cypress/support/e2e.ts
// Loaded automatically before every spec file
// =============================================================================

// Register all custom commands (cy.createRun, cy.guardTTL, cy.openDesktop)
import "./commands";

before(() => {
  Cypress.env("runId", null);
  Cypress.env("runCreatedAt", null);
});

// Surface app exceptions in the log without killing the suite
Cypress.on("uncaught:exception", (err) => {
  cy.log(`⚠️  Uncaught exception: ${err.message}`);
  return false;
});
