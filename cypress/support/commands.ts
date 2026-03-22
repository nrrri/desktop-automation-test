// =============================================================================
// Custom Cypress commands — available in every spec file as cy.commandName()
// No imports needed in test files — these are globally registered here.
// =============================================================================

import { BASE_URL, ENDPOINTS, PAYLOAD, RUN_TTL_MS } from "./constants";

// -----------------------------------------------------------------------------
// Tell TypeScript these commands exist on the cy object
// Without this, cy.createRun() would show a red underline in VSCode
// -----------------------------------------------------------------------------
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * POST /api/testrun with the standard payload.
       * Saves runId and runCreatedAt to Cypress.env for use across all spec files.
       *
       * Usage:
       *   cy.createRun()
       *   cy.createRun().then(() => { const id = Cypress.env("runId") })
       */
      createRun(): Chainable<void>;

      /**
       * Re-creates the run if it is within 5 minutes of the 60-min server purge.
       * Call this in before() of any spec that relies on an existing runId.
       *
       * Usage:
       *   before(() => { cy.guardTTL() })
       */
      guardTTL(): Chainable<void>;

      /**
       * Opens /desktop/:runId and waits for the desktop shell to be visible.
       * Requires a runId to already exist in Cypress.env.
       *
       * Usage:
       *   cy.openDesktop()
       */
      openDesktop(): Chainable<void>;
    }
  }
}

// -----------------------------------------------------------------------------
// cy.createRun()
// POSTs the standard payload to /api/testrun and persists the runId.
// Every spec file that needs a runId calls this instead of duplicating the logic.
// -----------------------------------------------------------------------------
Cypress.Commands.add("createRun", () => {
  cy.request({
    method: "POST",
    url: `${BASE_URL}${ENDPOINTS.CREATE_RUN}`,
    headers: { "Content-Type": "application/json" },
    body: PAYLOAD,
    failOnStatusCode: false,
  }).then((res) => {
    expect(res.status, "cy.createRun: POST /api/testrun must return 201").to.eq(
      201,
    );
    expect(
      res.body.runId,
      "cy.createRun: runId must be a non-empty string",
    ).to.be.a("string").and.not.be.empty;

    Cypress.env("runId", res.body.runId);
    Cypress.env("runCreatedAt", Date.now());
    cy.log(`✅  cy.createRun: runId = ${res.body.runId}`);
  });
});

// -----------------------------------------------------------------------------
// cy.guardTTL()
// Checks if the current run is within 5 min of the 60-min server purge limit.
// If it is, silently creates a fresh run so the suite does not randomly fail.
// Call this at the top of before() in any spec that runs after Objective 1.
// -----------------------------------------------------------------------------
Cypress.Commands.add("guardTTL", () => {
  const createdAt = Cypress.env("runCreatedAt");
  const age = createdAt ? Date.now() - createdAt : Infinity;

  if (age > RUN_TTL_MS) {
    cy.log(
      "cy.guardTTL: run is near the 60-min purge limit — creating a fresh one",
    );
    cy.createRun();
  } else {
    cy.log(`cy.guardTTL: run is fresh (age: ${Math.round(age / 1000)}s)`);
  }
});

// -----------------------------------------------------------------------------
// cy.openDesktop()
// Navigates to /desktop/:runId and waits for the shell to load.
// Requires Cypress.env("runId") to be set — call cy.createRun() first.
// -----------------------------------------------------------------------------
Cypress.Commands.add("openDesktop", () => {
  const runId = Cypress.env("runId");
  expect(
    runId,
    "cy.openDesktop: runId must exist — call cy.createRun() first",
  ).to.be.a("string").and.not.be.empty;

  cy.visit(`${BASE_URL}${ENDPOINTS.DESKTOP}/${runId}`);
  cy.get("[data-testid='desktop-container']", { timeout: 15000 }).should(
    "be.visible",
  );
  cy.log(`cy.openDesktop: desktop loaded for runId ${runId}`);
});
