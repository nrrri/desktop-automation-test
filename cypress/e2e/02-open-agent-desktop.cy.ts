// =============================================================================
// Open desktop from desktop/:runId after a run is created
// =============================================================================

import { BASE_URL, ENDPOINTS, INFO } from "../support/constants";

// checking if we have valid runId
before(() => {
  // Only create a new run if one does not already exist from a previous spec
  if (!Cypress.env("runId")) {
    cy.createRun();
  }
});

// --------------------------
describe("Objective 2 · /desktop/:runId — Open the mock agent desktop", () => {
  // ── Test 1 — Desktop shell loads correctly ────────────────────────────────
  it("navigates to /desktop/:runId and renders the desktop shell", () => {
    cy.openDesktop();

    cy.log("[PASS] Desktop shell is visible");
  });
});
