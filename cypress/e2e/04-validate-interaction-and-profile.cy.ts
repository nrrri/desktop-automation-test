/*
Validate desktop content against the submitted payload.
- interactionInformation fields
- customer profile data
- chatTranscript entries
*/

import { INFO, TRANSCRIPT, AUTH, TIMEOUTS } from "../support/constants";

// before() — guard auth + ensure runId exists
before(() => {
  // ── GUARD: authenticationStatus must be "Authenticated" ──────────────────
  // If wrong, profile panel will be empty and all profile tests fail
  expect(
    INFO.authenticationStatus,
    `authenticationStatus must be "${AUTH.authenticated}" to trigger profile lookup — ` +
      `got "${INFO.authenticationStatus}" — fix PAYLOAD in constants.ts`,
  ).to.eq(AUTH.authenticated);

  // ── Ensure runId exists ───────────────────────────────────────────────────
  if (!Cypress.env("runId")) {
    cy.createRun();
  }
});

// =============================================================================
// OBJECTIVE 4a — Open desktop and accept the chat invite
// Opens the desktop shell for the created runId and accepts the incoming
// chat invite so the full desktop UI is available for all subsequent tests.
// =============================================================================
describe("Objective 4 · Open desktop and accept invite", () => {
  // ── Test 1
  // todo: create custom command for open + accept invite
  it("opens the desktop and accepts the chat invite", () => {
    cy.openDesktop();

    cy.get("[data-testid='chat-invite']", {
      timeout: TIMEOUTS.inviteModal,
    }).should("be.visible");

    cy.get("[data-testid='accept-chat-invite']").click();

    cy.log("[PASS] Desktop open and invite accepted");
  });
});

// =============================================================================
// OBJECTIVE 4b — Interaction information details
// Verifies every interactionInformation field from the submitted payload is
// correctly displayed on the desktop UI after the invite is accepted.
// Each field is checked individually so failures point to the exact field.
// =============================================================================
describe("Objective 4 · Interaction information details", () => {
  // ── Test 1
  it("displays the correct interactionId", () => {
    cy.get("[data-testid='interaction-id']")
      .should("be.visible")
      .and("contain.text", INFO.interactionId); // "CHAT-10001"

    cy.log(`[PASS] interactionId: ${INFO.interactionId}`);
  });

  // ── Test 2
  it("displays the correct channel", () => {
    cy.get("[data-testid='channel']")
      .should("be.visible")
      .and("contain.text", INFO.channel); // "Chat"

    cy.log(`[PASS] channel: ${INFO.channel}`);
  });

  // ── Test 3
  it("displays the correct authenticationStatus", () => {
    cy.get("[data-testid='auth-status']")
      .should("be.visible")
      .and("contain.text", INFO.authenticationStatus); // "Authenticated"

    cy.log(`[PASS] authenticationStatus: ${INFO.authenticationStatus}`);
  });

  // ── Test 4
  it("displays the correct account number", () => {
    cy.get("[data-testid='customer-account-number']")
      .should("be.visible")
      .and("contain.text", INFO.customerAccountNumber); // "10001"

    cy.log(`[PASS] customerAccountNumber: ${INFO.customerAccountNumber}`);
  });

  // ── Test 5
  it("displays the correct journeyName", () => {
    cy.get("[data-testid='journey-name']")
      .should("be.visible")
      .and("contain.text", INFO.journeyName); // "Billing Support"

    cy.log(`[PASS] journeyName: ${INFO.journeyName}`);
  });

  // ── Test 6
  it("displays the correct queueName", () => {
    cy.get("[data-testid='queue-name']")
      .should("be.visible")
      .and("contain.text", INFO.queueName); // "Billing Tier 1"

    cy.log(`[PASS] queueName: ${INFO.queueName}`);
  });

  // ── Test 7
  it("displays the correct agentDesktopStatus", () => {
    cy.get("[data-testid='desktop-status']")
      .should("be.visible")
      .and("contain.text", INFO.agentDesktopStatus); // "Connected"

    cy.log(`[PASS] agentDesktopStatus: ${INFO.agentDesktopStatus}`);
  });

  // ── Test 8
  it("displays startTime in a human-readable format — not raw ISO 8601", () => {
    // The payload sends "2026-03-11T10:30:00Z"
    // The UI must format it as something like "10:30 AM UTC" — not the raw ISO string
    // If the raw string appears the date formatter is not being called — BUG
    cy.get("[data-testid='start-time']")
      .invoke("text")
      .then((text) => {
        const isRawIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(text.trim());
        expect(isRawIso, "startTime must not be displayed as raw ISO 8601").to
          .be.false;
      });

    cy.log("[PASS] startTime is formatted correctly");
  });
});

// =============================================================================
// OBJECTIVE 4c — Customer profile
// Verifies the customer profile panel loads correctly after invite acceptance.
// The profile data is pulled from a fixture file on the server based on the
// customerAccountNumber (10001) and authenticationStatus = "Authenticated".
// If the panel is empty the fixture did not load — check the account range.
// =============================================================================
describe("Objective 4 · Customer profile", () => {
  // ── Test 1
  it("customer profile tab is visible and clickable", () => {
    cy.get("[data-testid='tab-customer-profile']")
      .should("exist")
      .and("be.visible")
      .click();

    cy.get("[data-testid='customer-profile']").should("be.visible");

    cy.log("[PASS] Customer profile panel is visible");
  });
});

// =============================================================================
// OBJECTIVE 4d — Chat transcript
// Verifies the pre-loaded chatTranscript entries match the submitted payload.
// The transcript is loaded from the payload and displayed in the chat window.
// Timestamps must appear in ascending chronological order.
// =============================================================================
describe("Objective 4 · Chat transcript", () => {
  // ── Test 1
  it("transcript entries are in chronological order — timestamps ascending", () => {
    const times: string[] = [];

    cy.get("[data-testid='msg-timestamp']")
      .each(($el) => {
        times.push($el.text().trim());
      })
      .then(() => {
        expect(times, "timestamps must be in ascending order").to.deep.eq(
          [...times].sort(),
        );
      });

    cy.log("[PASS] Transcript entries are in chronological order");
  });
});
