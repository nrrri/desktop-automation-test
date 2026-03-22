# Desktop Run E2E Test Suite

Cypress + TypeScript end-to-end tests for the mock agent desktop application.

---

### Objective 1 — Create a test run via the backend API

**File:** `01-create-test-run.cy.ts`
**Type:** API only — no browser, no UI
**Total tests:** 4

Sends a `POST /api/testrun` request with the full interaction payload and validates the server response. Pure API testing — no `cy.visit`, no browser involved. The `runId` returned from Test 1 is saved to `Cypress.env` and used by all subsequent objectives.

| #   | Test name                                                                  | What it checks                                                                                                                                                                                            |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `return HTTP 201 with a runId and status pending`                          | HTTP 201 · `runId` exists in response body · `runId` is a non-empty string · `status = "pending"` · server echoes back `interactionId = "CHAT-10001"` · saves `runId` and `runCreatedAt` to `Cypress.env` |
| 2   | `rejects a payload with a blank interactionId -> HTTP 400`                 | Blank `interactionId` is rejected with HTTP 400 · response body contains an `error` field                                                                                                                 |
| 3   | `rejects a payload with no interactionInformation block → HTTP 400 or 422` | Payload containing only `chatTranscript` with no `interactionInformation` block is rejected                                                                                                               |
| 4   | `rejects an empty body → HTTP 400 or 422`                                  | Empty `{}` body must not create a run — server responds 400 or 422                                                                                                                                        |

> **Note — Test 1 CHECK 4:** The `status = "pending"` assertion will fail if the server does not return a `status` field in the response body. If this happens it is a potential bug — see Bugs Detected section.

---

### Objective 2 — Open the agent desktop using the returned runId

**File:** `02-open-agent-desktop.cy.ts`
**Type:** Browser UI
**Total tests:** 1

Uses the `runId` from Objective 1 to navigate to `/desktop/:runId` and verify the desktop shell renders correctly. A `before()` hook ensures a valid `runId` exists before the test runs — if none is found it calls `cy.createRun()` automatically.

| #   | Test name                                                    | What it checks                                                                        |
| --- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| 1   | `navigates to /desktop/:runId and renders the desktop shell` | `cy.openDesktop()` visits `/desktop/:runId` and confirms the desktop shell is visible |

---

### Objective 3 — Handle agent status and chat invite flow

**File:** `03-agent-status-and-chat-invite.cy.ts`
**Type:** Browser UI
**Total tests:** 4

Verifies the initial agent connection status on page load, then handles the full chat invite flow. The agent must select `"Ready"` from the status dropdown to trigger the incoming chat invite. A `waitForAgentStatus` helper polls the on-screen `agent-status-select` badge until the expected value appears.

| #   | Test name                                                               | What it checks                                                                                     |
| --- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | `desktop shows agentDesktopStatus 'Connected' from the payload on load` | `connection-status` shows `"Connected"` immediately on page load — before any action               |
| 2   | `chat invite modal appears after the agent becomes ready`               | Selects `"Ready"` from `agent-status-select` dropdown · invite modal `chat-invite` becomes visible |
| 3   | `clicking Accept opens the chat window`                                 | Clicks `accept-chat-invite` · `chat-transcript` appears · `chat-invite` modal is gone              |
| 4   | `chat window has an enabled input field and send button`                | `agent-chat-input` is visible and enabled · `agent-chat-send` button is visible                    |

---

### Objective 4 — Validate desktop content against the submitted payload

**File:** `04-validate-interaction-and-profile.cy.ts`
**Type:** Browser UI
**Total tests:** 11

Split into four focused `describe` blocks. A `before()` guard checks `authenticationStatus = "Authenticated"` before any test runs — if wrong, all tests are skipped immediately with a clear error message.

#### 4a — Open desktop and accept invite

Opens the desktop shell and accepts the incoming chat invite so the full UI is available for all subsequent tests.

| #   | Test name                                       | What it checks                                                           |
| --- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| 1   | `opens the desktop and accepts the chat invite` | `cy.openDesktop()` · `chat-invite` visible · clicks `accept-chat-invite` |

#### 4b — Interaction information details

Verifies every `interactionInformation` field from the payload is displayed on the desktop. Each field is a separate test so failures point to the exact field.

| #   | Test name                                                          | What it checks                                                              |
| --- | ------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 1   | `displays the correct interactionId`                               | `interaction-id` = `"CHAT-10001"`                                           |
| 2   | `displays the correct channel`                                     | `channel` = `"Chat"`                                                        |
| 3   | `displays the correct authenticationStatus`                        | `auth-status` = `"Authenticated"`                                           |
| 4   | `displays the correct account number`                              | `customer-account-number` = `"10001"`                                       |
| 5   | `displays the correct journeyName`                                 | `journey-name` = `"Billing Support"`                                        |
| 6   | `displays the correct queueName`                                   | `queue-name` = `"Billing Tier 1"`                                           |
| 7   | `displays the correct agentDesktopStatus`                          | `desktop-status` = `"Connected"`                                            |
| 8   | `displays startTime in a human-readable format — not raw ISO 8601` | `start-time` must not show raw `"2026-03-11T10:30:00Z"` — must be formatted |

#### 4c — Customer profile

Verifies the customer profile panel loads from the server fixture for account `10001`.

| #   | Test name                                       | What it checks                                                        |
| --- | ----------------------------------------------- | --------------------------------------------------------------------- |
| 1   | `customer profile tab is visible and clickable` | `tab-customer-profile` visible · click opens `customer-profile` panel |

#### 4d — Chat transcript

Verifies the pre-loaded transcript entries appear in the correct order.

| #   | Test name                                                              | What it checks                                                                   |
| --- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 1   | `transcript entries are in chronological order — timestamps ascending` | `msg-timestamp` values are sorted ascending — `14:31:01`, `14:31:09`, `14:31:50` |

## Bugs detected

The following bugs were discovered by manually exploring the mock agent desktop. Each entry includes steps to reproduce, expected vs actual behaviour, and a suggested fix.

---

### BUG-001 — POST /api/testrun response missing status field

**Description:**
The response body from POST /api/testrun does not include a status field.
A well-defined API should return the initial state of the created resource
so the client knows what lifecycle stage the run is in.

**Expected:** { runId: "...", status: "pending" }
**Actual:** { runId: "..." }
**Fix:** Include status: "pending" in the POST /api/testrun response body.
