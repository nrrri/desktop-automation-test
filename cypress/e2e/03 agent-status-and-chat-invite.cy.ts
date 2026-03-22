// =============================================================================
// Handle the initial agent status state and chat invite flow
// =============================================================================
//
import { INFO, TIMEOUTS } from "../support/constants";

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
  return cy.get("[data-testid='agent-status-select']").then(($el) => {
    if ($el.text().toLowerCase().includes(expected.toLowerCase())) {
      cy.log(`✅  Agent status = "${expected}" after ${attempt + 1} poll(s)`);
      return;
    }
    cy.wait(TIMEOUTS.agentPoll);
    return waitForAgentStatus(expected, attempt + 1);
  });
};

// before() — ensure runId + open desktop
before(() => {
  if (!Cypress.env("runId")) {
    cy.createRun();
  }
});

describe("Objective 3 - Agent Status & Chat Invite Flow", () => {
  // ── Test 1 — cy.visit: first load of desktop for this spec ───────────────
  it("desktop shows agentDesktopStatus 'Connected' from the payload on load", () => {
    cy.openDesktop();

    cy.get("[data-testid='connection-status']")
      .should("be.visible")
      .and("contain.text", INFO.agentDesktopStatus); // "Connected"
  });

  // ! Check UI render
  // ── Tests 2 ───────────────────────────────────
  it("chat invite modal appears after the agent becomes ready", () => {
    cy.get("select[data-testid='agent-status-select']").select("Ready");

    cy.get("[data-testid='chat-invite']", {
      timeout: TIMEOUTS.inviteModal,
    })
      .should("exist")
      .and("be.visible");
  });

  // ── Tests 4 ───────────────────────────────────
  it("clicking Accept opens the chat window", () => {
    cy.get("[data-testid='accept-chat-invite']").click();

    // check chat
    cy.get("[data-testid='chat-transcript']", { timeout: TIMEOUTS.chatWindow })
      .should("exist")
      .and("be.visible");

    cy.get("[data-testid='chat-invite']").should("not.exist");
  });

  // ── Tests 6 ───────────────────────────────────
  it("chat window has an enabled input field and send button", () => {
    cy.get("[data-testid='agent-chat-input']")
      .should("exist")
      .and("be.visible")
      .and("not.be.disabled");
    cy.get("[data-testid='agent-chat-send']").should("exist").and("be.visible");
  });
});
