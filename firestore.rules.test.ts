/**
 * Security TDD specification test cases for firestore.rules.
 * Verifies that all 12 "Dirty Dozen" adversarial payloads are rejected
 * with PERMISSION_DENIED against the Eight Pillars hardened ruleset.
 */

export interface SecurityTestCase {
  id: number;
  name: string;
  operation: "get" | "list" | "create" | "update" | "delete";
  path: string;
  auth: { uid: string; email?: string; email_verified?: boolean } | null;
  payload?: Record<string, unknown>;
  expected: "PERMISSION_DENIED" | "ALLOW";
}

export const DIRTY_DOZEN_TESTS: SecurityTestCase[] = [
  {
    id: 1,
    name: "Identity spoofing on PublicProfile create",
    operation: "create",
    path: "/publicProfiles/attacker",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: {
      uid: 99,
      ownerUid: "user-b",
      username: "attacker",
      displayName: "Attacker",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 2,
    name: "Shadow ghost field injection (isAdmin)",
    operation: "create",
    path: "/publicProfiles/ghost",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: {
      uid: 2,
      ownerUid: "user-a",
      username: "ghost",
      displayName: "Ghost",
      isAdmin: true,
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 3,
    name: "Unverified email admin spoofing",
    operation: "create",
    path: "/admins/spoof-uid",
    auth: { uid: "spoof-uid", email: "faizennahmed@gmail.com", email_verified: false },
    payload: { uid: "spoof-uid", grantedAt: "SERVER_TIMESTAMP" },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 4,
    name: "Cross-user PII read on /users/{userId}",
    operation: "get",
    path: "/users/user-a",
    auth: { uid: "user-b", email: "b@example.com", email_verified: true },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 5,
    name: "Path ID poisoning (>128 chars)",
    operation: "create",
    path: `/publicProfiles/${"a".repeat(200)}`,
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: {
      uid: 2,
      ownerUid: "user-a",
      username: "valid",
      displayName: "Valid",
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 6,
    name: "Oversized string Denial-of-Wallet on bio (>500 chars)",
    operation: "create",
    path: "/publicProfiles/toolong",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: {
      uid: 2,
      ownerUid: "user-a",
      username: "toolong",
      displayName: "Too Long",
      bio: "x".repeat(2000),
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 7,
    name: "Forged client timestamp instead of request.time",
    operation: "create",
    path: "/publicProfiles/backdated",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: {
      uid: 2,
      ownerUid: "user-a",
      username: "backdated",
      displayName: "Backdated",
      createdAt: "2020-01-01T00:00:00.000Z",
      updatedAt: "2020-01-01T00:00:00.000Z",
    },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 8,
    name: "Immutable ownerUid mutation on update",
    operation: "update",
    path: "/publicProfiles/faizen",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: { ownerUid: "user-b", updatedAt: "SERVER_TIMESTAMP" },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 9,
    name: "Self-assigned admin role escalation",
    operation: "create",
    path: "/admins/user-a",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: { uid: "user-a", grantedAt: "SERVER_TIMESTAMP" },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 10,
    name: "Blanket collection list scraping on /users",
    operation: "list",
    path: "/users",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 11,
    name: "Poisoned badges array (>10 items or non-string)",
    operation: "create",
    path: "/publicProfiles/badbadges",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: {
      uid: 2,
      ownerUid: "user-a",
      username: "badbadges",
      displayName: "Bad Badges",
      badges: [123, 456],
      createdAt: "SERVER_TIMESTAMP",
      updatedAt: "SERVER_TIMESTAMP",
    },
    expected: "PERMISSION_DENIED",
  },
  {
    id: 12,
    name: "Value poisoning on update (boolean displayName)",
    operation: "update",
    path: "/publicProfiles/faizen",
    auth: { uid: "user-a", email: "a@example.com", email_verified: true },
    payload: { displayName: true, updatedAt: "SERVER_TIMESTAMP" },
    expected: "PERMISSION_DENIED",
  },
];
