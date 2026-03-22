// =============================================================================
// Handle the initial agent status state and chat invite flow
// =============================================================================

import { BASE_URL, ENDPOINTS, INFO, TIMEOUTS } from "../support/constants";

// Helper — polls the on-screen agent status badge until it matches expected
const waitForAgentStatus = (
  expected: string,
  attempt = 0,
): Cypress.Chainable => {
  if (attempt >= TIMEOUTS.agentMaxPolls) {
    throw new Error(
      `Agent status never reached "${expected}" after ${TIMEOUTS.agentMaxPolls} polls`,
    );
  }
  return cy.get("[data-testid='agent-status-badge']").then(($el) => {
    if ($el.text().toLowerCase().includes(expected.toLowerCase())) {
      cy.log(`✅  Agent status = "${expected}" after ${attempt + 1} poll(s)`);
      return;
    }
    cy.wait(TIMEOUTS.agentPoll);
    return waitForAgentStatus(expected, attempt + 1);
  });
};

// before() — guard auth + ensure runId + open desktop
before(() => {
  expect(
    INFO.authenticationStatus,
    `authenticationStatus must be Authenticated for invite to appear`,
  ).to.eq("Authenticated");

  if (!Cypress.env("runId")) {
    cy.createRun(); // ← reusable command from commands.ts
  }
});

describe("Objective 3 - Agent Status & Chat Invite Flow", () => {
  // ── Test 1 — cy.visit: first load of desktop for this spec ───────────────
  it("desktop shows agentDesktopStatus 'Connected' from the payload on load", () => {
    cy.openDesktop(); // ← reusable command from commands.ts

    cy.get("[data-testid='agent-desktop-status']")
      .should("be.visible")
      .and("contain.text", INFO.agentDesktopStatus); // "Connected"
  });

  // ! Check UI render
  // ── Tests 2 ───────────────────────────────────
  it("chat invite modal appears after the agent becomes ready", () => {
    cy.get("[data-testid='chat-invite-modal']", {
      timeout: TIMEOUTS.inviteModal,
    })
      .should("exist")
      .and("be.visible");
  });

  // ── Tests 3 ───────────────────────────────────
  it.only("invite modal displays the correct queue name from the payload", () => {
    cy.get("[data-testid='chat-invite-queue']")
      .should("be.visible")
      .and("contain.text", INFO.queueName); // "Billing Tier 1"
  });

  // ── Tests 4 ───────────────────────────────────
  it("clicking Accept opens the chat window and closes the modal", () => {
    cy.get("[data-testid='chat-invite-accept-btn']").click();

    cy.get("[data-testid='chat-window']", { timeout: TIMEOUTS.chatWindow })
      .should("exist")
      .and("be.visible");

    cy.get("[data-testid='chat-invite-modal']").should("not.exist");
  });

  // ── Tests 5 ───────────────────────────────────
  it("agent status badge updates to 'active' after accepting the invite", () => {
    waitForAgentStatus("active");
    cy.get("[data-testid='agent-status-badge']").should(
      "contain.text",
      "active",
    );
  });

  // ── Tests 6 ───────────────────────────────────
  it("chat window has an enabled input field and send button", () => {
    cy.get("[data-testid='chat-input']")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled");
    cy.get("[data-testid='chat-send-btn']").should("exist").and("be.visible");
  });

  // ! check negative
  // ── Test 7 — fresh desktop for decline test ─────────────
  it("clicking Decline closes the modal without opening the chat window", () => {
    cy.createRun();
    cy.openDesktop();

    cy.get("[data-testid='chat-invite-modal']", {
      timeout: TIMEOUTS.inviteModal,
    }).should("be.visible");

    cy.get("[data-testid='chat-invite-decline-btn']").click();

    cy.get("[data-testid='chat-invite-modal']").should("not.exist");
    cy.get("[data-testid='chat-window']").should("not.exist");
    cy.get("[data-testid='agent-status-badge']").should(
      "not.contain.text",
      "active",
    );
  });
});
