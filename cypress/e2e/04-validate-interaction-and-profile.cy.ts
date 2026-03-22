/*
Validate desktop content against the submitted payload.
- interactionInformation fields
- customer profile data
- chatTranscript entries
*/

import { INFO, TRANSCRIPT, AUTH, TIMEOUTS } from "../support/constants";

// before() — guard auth + ensure runId + open desktop + accept invite
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
// OBJECTIVE 4 — Validate interaction info, profile data and transcript
// =============================================================================
describe("Objective 4 · Validate desktop content against the payload", () => {
  // ── Test 1 — Open desktop and accept invite
  it("opens the desktop and accepts the chat invite", () => {
    cy.openDesktop();

    // Wait for invite modal and accept it
    cy.get("[data-testid='chat-invite-modal']", {
      timeout: TIMEOUTS.inviteModal,
    }).should("be.visible");

    cy.get("[data-testid='chat-invite-accept-btn']").click();

    cy.get("[data-testid='chat-window']", {
      timeout: TIMEOUTS.chatWindow,
    }).should("be.visible");

    cy.log("[PASS] Desktop open and invite accepted");
  });

  // ── interactionInformation ────────────────────────────────────────────────
  // ── Test 2
  it("displays the correct interactionId", () => {
    cy.get("[data-testid='interaction-id']")
      .should("be.visible")
      .and("contain.text", INFO.interactionId); // "CHAT-10001"

    cy.log(`[PASS] interactionId: ${INFO.interactionId}`);
  });

  // ── Test 3
  it("displays the correct journeyName", () => {
    cy.get("[data-testid='journey-name']")
      .should("be.visible")
      .and("contain.text", INFO.journeyName); // "Billing Support"

    cy.log(`[PASS] journeyName: ${INFO.journeyName}`);
  });

  // ── Test 4
  it("displays the correct queueName", () => {
    cy.get("[data-testid='queue-name']")
      .should("be.visible")
      .and("contain.text", INFO.queueName); // "Billing Tier 1"

    cy.log(`[PASS] queueName: ${INFO.queueName}`);
  });

  // ── Test 5
  it("displays the correct agentDesktopStatus", () => {
    cy.get("[data-testid='agent-desktop-status']")
      .should("be.visible")
      .and("contain.text", INFO.agentDesktopStatus); // "Connected"

    cy.log(`[PASS] agentDesktopStatus: ${INFO.agentDesktopStatus}`);
  });

  // ── Test 6
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

  // ── customer profile ──────────────────────────────────────────────────────
  // ── Test 7
  it("customer profile panel is visible after invite acceptance", () => {
    // Profile panel only populates when authenticationStatus = "Authenticated"
    // and the account is in the 10001–10050 fixture range
    cy.get("[data-testid='customer-profile-panel']")
      .should("exist")
      .and("be.visible");

    cy.log("[PASS] Customer profile panel is visible");
  });

  // ── Test 8
  it("profile panel shows the correct account number", () => {
    cy.get("[data-testid='profile-account-number']")
      .should("be.visible")
      .and("contain.text", INFO.customerAccountNumber); // "10001"

    cy.log(`[PASS] Profile account number: ${INFO.customerAccountNumber}`);
  });

  // ── Test 9
  it("profile panel customer name is not blank", () => {
    // The name comes from the fixture file — if blank the fixture did not load
    cy.get("[data-testid='profile-customer-name']")
      .invoke("text")
      .should("not.be.empty");

    cy.log("[PASS] Customer name is populated");
  });

  // ── chatTranscript ────────────────────────────────────────────────────────

  // ── Tests 10–12 — one test per transcript entry
  TRANSCRIPT.forEach((entry, index) => {
    it(`transcript entry [${index}] — sender: "${entry.sender}" · "${entry.message}"`, () => {
      cy.get("[data-testid='transcript-message']")
        .eq(index)
        .within(() => {
          cy.get("[data-testid='msg-sender']").should(
            "contain.text",
            entry.sender,
          );
          cy.get("[data-testid='msg-timestamp']").should(
            "contain.text",
            entry.timestamp,
          );
          cy.get("[data-testid='msg-text']").should(
            "contain.text",
            entry.message,
          );
        });

      cy.log(
        `[PASS] entry[${index}] sender="${entry.sender}" timestamp="${entry.timestamp}"`,
      );
    });
  });

  // ── Test 13
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
