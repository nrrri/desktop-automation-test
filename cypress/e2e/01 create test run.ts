// =============================================================================
// Create a test run through the backend API.
// =============================================================================

import { BASE_URL, ENDPOINTS, INFO, PAYLOAD } from "../support/constants";

describe("Objective 1 · POST /api/testrun — Create a test run", () => {
  // ── Test 1 — check Path
  it("return HTTP 201 with a runId and status pending", () => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}${ENDPOINTS.CREATE_RUN}`,
      headers: { "Content-Type": "application/json" },
      body: PAYLOAD,
      failOnStatusCode: false,
    }).then((res) => {
      // ── CHECK 1: correct HTTP status ──────────────────────────────────────
      expect(res.status, "HTTP 201 Created").to.eq(201);

      // ── CHECK 2: runId exists in the response body ────────────────────────
      expect(res.body, "body must contain runId").to.have.property("runId");

      // ── CHECK 3: runId is a real non-empty string ─────────────────────────
      expect(res.body.runId, "runId must be a non-empty string").to.be.a(
        "string",
      ).and.not.be.empty;

      // ── CHECK 4: initial status is 'pending' ──────────────────────────────
      expect(res.body.status, "initial run status must be 'pending'").to.eq(
        "pending",
      );

      // ── CHECK 5: server echoes back the interactionId ─────────────────────
      const echoedId =
        res.body.interactionId ?? // top-level field
        res.body.interactionInformation?.interactionId; // or nested
      expect(echoedId, "server echoes back interactionId").to.eq(
        INFO.interactionId,
      ); // "CHAT-10001"

      // ── ACTION: save runId so other steps can use it ──────────────────────
      // Using cy.createRun() from commands.ts persists this automatically
      // but we save it here too so Test 1 is fully self-contained
      Cypress.env("runId", res.body.runId);
      Cypress.env("runCreatedAt", Date.now());
      cy.log(`[PASS] runId captured: ${res.body.runId}`);
    });
  });

  // ── Test 2 — Negative: blank interactionId ───────────────────────────────
  it("rejects a payload with a blank interactionId -> HTTP 400", () => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}${ENDPOINTS.CREATE_RUN}`,
      headers: { "Content-Type": "application/json" },
      body: {
        ...PAYLOAD,
        interactionInformation: {
          ...INFO,
          interactionId: "", // intentionally blank
        },
      },
      failOnStatusCode: false,
    }).then((res) => {
      // Server must reject blank interactionId
      expect(res.status, "blank interactionId -> 400 Bad Request").to.eq(400);

      // Response must include an error message
      expect(res.body, "error message must be present").to.have.property(
        "error",
      );
    });
  });

  // ── Test 3 — Negative: missing interactionInformation block ──────────────
  it("rejects a payload with no interactionInformation block → HTTP 400 or 422", () => {
    // Sending only chatTranscript with no interactionInformation at all
    cy.request({
      method: "POST",
      url: `${BASE_URL}${ENDPOINTS.CREATE_RUN}`,
      headers: { "Content-Type": "application/json" },
      body: {
        chatTranscript: PAYLOAD.chatTranscript, // transcript only, no info block
      },
      failOnStatusCode: false,
    }).then((res) => {
      expect(
        res.status,
        "missing interactionInformation must be rejected",
      ).to.be.oneOf([400, 422]);

      cy.log("[PASS] Missing interactionInformation block correctly rejected");
    });
  });

  // ── Test 4 — Negative: completely empty body ─────────────────────────────
  it("rejects an empty body → HTTP 400 or 422", () => {
    cy.request({
      method: "POST",
      url: `${BASE_URL}${ENDPOINTS.CREATE_RUN}`,
      headers: { "Content-Type": "application/json" },
      body: {}, // no fields at all
      failOnStatusCode: false,
    }).then((res) => {
      // 400 Bad Request OR 422 Unprocessable Entity — both are correct here
      expect(res.status, "empty body must be rejected").to.be.oneOf([400, 422]);
    });
  });
});
