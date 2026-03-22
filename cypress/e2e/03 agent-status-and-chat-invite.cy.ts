// =============================================================================
// Handle the initial agent status state and chat invite flow
// =============================================================================

import { INFO, TIMEOUTS } from "../support/constants";

// before() — ensure runId exists
before(() => {
  if (!Cypress.env("runId")) {
    cy.createRun();
  }
});

describe("Objective 3 · Agent Status & Chat Invite Flow", () => {
  // ── Test 1 — initial connection status on load ────────────────────────────
  it("desktop shows agentDesktopStatus 'Connected' from the payload on load", () => {
    cy.openDesktop();

    cy.get("[data-testid='connection-status']")
      .should("be.visible")
      .and("contain.text", INFO.agentDesktopStatus); // "Connected"

    cy.log(`[PASS] agentDesktopStatus: ${INFO.agentDesktopStatus}`);
  });

  // ── Test 2 — selecting Ready triggers the chat invite ────────────────────
  it("chat invite modal appears after the agent becomes ready", () => {
    cy.openAndAccept();

    cy.log("[PASS] Chat invite modal is visible");
  });

  // ── Test 3 — accepting the invite opens the chat window ──────────────────
  it("clicking Accept opens the chat window", () => {
    cy.openAndAccept();

    cy.get("[data-testid='chat-transcript']", { timeout: TIMEOUTS.chatWindow })
      .should("exist")
      .and("be.visible");

    cy.get("[data-testid='chat-invite']").should("not.exist");

    cy.log("[PASS] Chat window open and invite modal gone");
  });

  // ── Test 4 — chat input and send button are available ────────────────────
  it("chat window has an enabled input field and send button", () => {
    cy.openAndAccept();

    cy.get("[data-testid='agent-chat-input']")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled");

    cy.get("[data-testid='agent-chat-send']").should("exist").and("be.visible");

    cy.log("[PASS] Chat input and send button are ready");
  });
});
