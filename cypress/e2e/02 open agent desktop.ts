// =============================================================================
// Open desktop from desktop/:runId after a run is created
// =============================================================================

import {
  BASE_URL,
  ENDPOINTS,
  INFO,
  AUTH,
  TIMEOUTS,
} from "../support/constants";

// checking if we have valid runId
before(() => {
  // ── GUARD: authenticationStatus must be "Authenticated" ─────────────────
  // If this fails, ALL tests in this describe are skipped automatically.
  // This prevents confusing profile-related failures in Tests 3–7.
  expect(
    INFO.authenticationStatus,
    `authenticationStatus must be "${AUTH.authenticated}" to trigger profile lookup — ` +
      `got "${INFO.authenticationStatus}" — fix PAYLOAD in constants.ts`,
  ).to.eq(AUTH.authenticated);

  // Only create a new run if one does not already exist from a previous spec
  if (!Cypress.env("runId")) {
    cy.createRun(); // ← reusable command from commands.ts
  }
});

// --------------------------
describe("Objective 2 · /desktop/:runId — Open the mock agent desktop", () => {
  // ── Test 1 — Desktop shell loads correctly ──────────────────────────────────
  it("navigates to /desktop/:runId and renders the desktop shell", () => {
    const runId = Cypress.env("runId");

    // Confirm runId is available before visiting
    expect(runId, "runId must be set before opening desktop").to.be.a("string")
      .and.not.be.empty;

    // Visit the desktop URL built from the runId
    cy.visit(`${BASE_URL}${ENDPOINTS.DESKTOP}/${runId}`);

    // ── CHECK 1: desktop container is visible ────────────────────────────────
    cy.get("[data-testid='desktop-container']", {
      timeout: TIMEOUTS.desktopLoad,
    })
      .should("exist")
      .and("be.visible");

    cy.log("[PASS] Desktop shell is visible");
  });

  // ── Test 2 — URL contains the runId ────────────────────────────────────────
  it("URL includes the runId after navigation", () => {
    const runId = Cypress.env("runId");

    // The browser URL must reflect the runId so the page can be bookmarked
    // or shared — if the URL does not contain the runId the routing is broken
    cy.url().should("include", runId);

    cy.log(`[PASS] URL contains runId: ${runId}`);
  });

  // ! CHECK UI render
  // ── Test 3 — Channel badge ────────────────────────────────────────────────
  it("header shows channel: Chat", () => {
    cy.get("[data-testid='channel-badge']")
      .should("be.visible")
      .and("contain.text", INFO.channel); // "Chat"

    cy.log(`[PASS] Channel: ${INFO.channel}`);
  });

  // ── Test 4 — Header shows journey name from the payload ────────────────────
  it("header shows journeyName: Billing Support", () => {
    cy.get("[data-testid='journey-name']")
      .should("be.visible")
      .and("contain.text", INFO.journeyName); // "Billing Support"

    cy.log(`[PASS] Journey: ${INFO.journeyName}`);
  });

  // ── Test 5 — All three header fields are correct in one assertion ───────────
  it("all header fields match the submitted payload simultaneously", () => {
    // Runs all three checks together — catches layout bugs where one field
    // overwrites another or fields are swapped in the template
    cy.get("[data-testid='channel-badge']").should(
      "contain.text",
      INFO.channel,
    );
    cy.get("[data-testid='journey-name']").should(
      "contain.text",
      INFO.journeyName,
    );
    cy.get("[data-testid='queue-name']").should("contain.text", INFO.queueName);

    cy.log("[PASS] All header fields match the payload");
  });

  // ! CHECK ERROR Id
  // ── Test 6 — Negative: invalid runId shows an error state ──────────────────
  it("shows an error state when the runId does not exist", () => {
    // A garbage runId should never show a desktop — it must show an error.
    // If the desktop loads anyway with blank data that is a security/UX bug.
    cy.visit(`${BASE_URL}${ENDPOINTS.DESKTOP}/INVALID-RUN-ID-000`, {
      failOnStatusCode: false,
    });

    cy.get(
      "[data-testid='error-state'], [data-testid='not-found'], [data-testid='error-message']",
      { timeout: 8000 },
    ).should("be.visible");

    cy.log("[PASS] Error state shown for unknown runId");
  });

  // ── Test 7 — Negative: missing runId segment in the URL ────────────────────
  it("shows an error or redirect when no runId is provided in the URL", () => {
    // Visiting /desktop with no runId at all — should not crash or show blank UI
    cy.visit(`${BASE_URL}${ENDPOINTS.DESKTOP}`, { failOnStatusCode: false });

    // Either an error page or a redirect back to the generator is acceptable
    cy.get(
      "[data-testid='error-state'], [data-testid='not-found'], form, [data-testid='generator-form']",
      { timeout: 8000 },
    ).should("exist");

    cy.log("[PASS] No crash when runId segment is missing");
  });
});
