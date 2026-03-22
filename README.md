# Desktop Run E2E Automation testing

Cypress + TypeScript end-to-end tests for the mock agent desktop application.

---

### Objective 1 — Create a test run via the backend API

**File:** `01-create-test-run.cy.ts`
**Type:** API only — no browser, no UI
**Total tests:** 4

Sends `POST /api/testrun` with the full interaction payload and validates the response. The `runId` from Test 1 is saved to `Cypress.env("runId")` and used by all subsequent objectives.

| #   | Test name                                                                  | What it checks                                                                                                                                                        |
| --- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `return HTTP 201 with a runId and status pending`                          | HTTP 201 · `runId` in body · non-empty string · `status = "pending"` · server echoes `interactionId = "CHAT-10001"` · saves `runId` + `runCreatedAt` to `Cypress.env` |
| 2   | `rejects a payload with a blank interactionId -> HTTP 400`                 | Blank `interactionId` → HTTP 400 · response body has `error` field                                                                                                    |
| 3   | `rejects a payload with no interactionInformation block → HTTP 400 or 422` | Only `chatTranscript` sent with no `interactionInformation` → rejected                                                                                                |
| 4   | `rejects an empty body → HTTP 400 or 422`                                  | Empty `{}` body → server responds 400 or 422                                                                                                                          |

> **Note — Test 1 CHECK 4:** The `status = "pending"` assertion will fail if the server does not return a `status` field. This may be a bug — see Bugs Detected.

---

### Objective 2 — Open the agent desktop using the returned runId

**File:** `02-open-agent-desktop.cy.ts`
**Type:** Browser UI
**Total tests:** 1

Navigates to `/desktop/:runId` and confirms the desktop shell renders. A `before()` hook creates a fresh run via `cy.createRun()` if no `runId` exists in `Cypress.env`.

| #   | Test name                                                    | What it checks                                                         |
| --- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| 1   | `navigates to /desktop/:runId and renders the desktop shell` | `cy.openDesktop()` visits `/desktop/:runId` · desktop shell is visible |

---

### Objective 3 — Handle agent status and chat invite flow

**File:** `03-agent-status-and-chat-invite.cy.ts`
**Type:** Browser UI
**Total tests:** 4

Verifies the initial agent connection status on page load, then handles the full chat invite flow. Uses `cy.openAndAccept()` — a custom command that opens the desktop, selects `"Ready"` from the status dropdown, waits for the invite, and accepts it.

| #   | Test name                                                               | What it checks                                                                 |
| --- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| 1   | `desktop shows agentDesktopStatus 'Connected' from the payload on load` | `cy.openDesktop()` · `connection-status` shows `"Connected"` before any action |
| 2   | `chat invite modal appears after the agent becomes ready`               | `cy.openAndAccept()` · invite modal appears after selecting `"Ready"`          |
| 3   | `clicking Accept opens the chat window`                                 | `cy.openAndAccept()` · `chat-transcript` visible · `chat-invite` gone          |
| 4   | `chat window has an enabled input field and send button`                | `cy.openAndAccept()` · `agent-chat-input` enabled · `agent-chat-send` visible  |

---

### Objective 4 — Validate desktop content against the submitted payload

**File:** `04-validate-interaction-and-profile.cy.ts`
**Type:** Browser UI
**Total tests:** 12

Split into two `describe` blocks. A global `before()` guard checks `authenticationStatus = "Authenticated"` — if wrong, all tests are skipped immediately. Every test calls `cy.openAndAccept()` to set up a fresh desktop session.

#### 4a — Interaction information details

Verifies every `interactionInformation` field from the payload is displayed correctly. Each field is a separate test so failures point to the exact field.

| #   | Test name                                                          | What it checks                                                             |
| --- | ------------------------------------------------------------------ | -------------------------------------------------------------------------- |
| 1   | `displays the correct interactionId`                               | `interaction-id` = `"CHAT-10001"`                                          |
| 2   | `displays the correct channel`                                     | `channel` = `"Chat"`                                                       |
| 3   | `displays the correct authenticationStatus`                        | `auth-status` = `"Authenticated"`                                          |
| 4   | `displays the correct account number`                              | `customer-account-number` = `"10001"`                                      |
| 5   | `displays the correct journeyName`                                 | `journey-name` = `"Billing Support"`                                       |
| 6   | `displays the correct queueName`                                   | `queue-name` = `"Billing Tier 1"`                                          |
| 7   | `displays the correct agentDesktopStatus`                          | `desktop-status` = `"Connected"`                                           |
| 8   | `displays the correct start-time`                                  | `start-time` contains `INFO.startTime` value                               |
| 9   | `displays startTime in a human-readable format — not raw ISO 8601` | `start-time` must not show `"2026-03-11T10:30:00Z"` verbatim — see BUG-001 |

#### 4b — Customer profile

Verifies the customer profile panel and its sections load correctly after invite acceptance.

| #   | Test name                                       | What it checks                                                      |
| --- | ----------------------------------------------- | ------------------------------------------------------------------- |
| 1   | `customer profile tab is visible and clickable` | `tab-customer-profile` clickable · `customer-profile` panel visible |
| 2   | `Recent Transactions section is available`      | `recent-transactions` visible after clicking profile tab            |
| 3   | `Account History section is available`          | `account-history` visible after clicking profile tab                |

---

## Bugs detected

### BUG-001 — POST /api/testrun response missing status field

**Severity:** Low
**Status:** Confirmed

**Description:**
The response body from `POST /api/testrun` does not include a `status` field.
A well-defined API should return the initial state of the created resource
so the client knows what lifecycle stage the run is in.

**Expected:** `{ runId: "...", status: "pending" }`
**Actual:** `{ runId: "..." }`
**Fix:** Include `status: "pending"` in the `POST /api/testrun` response body.

---

### BUG-002 — startTime displayed as raw ISO 8601 string

**Severity:** Low / UX
**Status:** Confirmed
**Test:** `04-validate-interaction-and-profile.cy.ts` — Objective 4d, Test 8

**Description:**
The `startTime` field from the payload (`"2026-03-11T10:30:00Z"`) is shown verbatim on the desktop instead of being formatted into a human-readable string such as `"10:30 AM UTC"`. The date formatting utility is not being called for this field.

**Expected:** `"10:30 AM UTC"` or locale-equivalent human-readable format
**Actual:** `"2026-03-11T10:30:00Z"` — raw ISO 8601 string shown verbatim
**Fix:** Pass `startTime` through the existing date formatter before rendering
