// dummy url
export const BASE_URL = Cypress.env("BASE_URL");
export const ENDPOINTS = {
  CREATE_RUN: "/api/testrun",
  DESKTOP: "/desktop",
};
export const RUN_TTL_MS = 55 * 60 * 1000; // 55 minutes in milliseconds

export const TIMEOUTS = {
  desktopLoad: 15000, // how long to wait for the desktop shell to appear
  inviteModal: 20000, // how long to wait for the chat invite modal
  chatWindow: 10000, // how long to wait for the chat window to open
  agentPoll: 2000, // interval between agent status polls
  agentMaxPolls: 15, // maximum number of status polls before failing
};

export const AUTH = {
  authenticated: "Authenticated",
  unauthenticated: "Not Authenticated",
};

// MOCK_TEST - regalar payload
export const PAYLOAD = {
  interactionInformation: {
    interactionId: "CHAT-10001",
    channel: "Chat",
    authenticationStatus: "Authenticated",
    customerAccountNumber: "10001",
    journeyName: "Billing Support",
    queueName: "Billing Tier 1",
    agentDesktopStatus: "Connected",
    startTime: "2026-03-11T10:30:00Z",
  },
  chatTranscript: [
    {
      sender: "Customer",
      timestamp: "14:31:01",
      message: "I was charged twice this month.",
    },
    {
      sender: "Bot",
      timestamp: "14:31:09",
      message: "I can help with billing issues.",
    },
    {
      sender: "System",
      timestamp: "14:31:50",
      message: "Handoff to Billing Tier 1",
    },
  ],
};
// -------------------------

// From Payload
export const INFO = PAYLOAD.interactionInformation;
export const TRANSCRIPT = PAYLOAD.chatTranscript;
