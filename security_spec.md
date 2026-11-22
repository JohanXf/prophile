# Firestore Security Specification (`security_spec.md`)

## 1. Data Invariants
1. **Strict PII Isolation**: Email addresses live exclusively in `/users/{userId}` (`UserPrivateProfile`), readable only by the authenticated owner (`request.auth.uid == userId`) or a verified admin. `/publicProfiles/{username}` contains zero PII.
2. **Ownership Integrity**: Every `/publicProfiles/{username}` document carries an immutable `ownerUid` matching `request.auth.uid` on creation and immutable across updates. Every `/users/{userId}` document requires `ownerUid == userId == request.auth.uid`.
3. **Verified Writes Only**: Standard write operations require `request.auth != null && request.auth.token.email_verified == true`.
4. **No Self-Assigned Roles**: Non-admin users can never write to `/admins/{userId}` or inject ghost role fields (`role`, `isAdmin`, `isVerified`) into any document.
5. **Temporal Integrity**: `createdAt` must equal `request.time` on `create` and remain immutable on `update`; `updatedAt` must equal `request.time` on both `create` and `update`.
6. **Path & Size Hardening**: All document IDs are validated with `isValidId()` (`<= 128` chars, `^[a-zA-Z0-9_-]+$`), all strings enforce strict `.size()` caps matching `firebase-blueprint.json`, and `badges` array is strictly capped at `<= 10` elements with first-element type validation.

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Identity Spoofing on PublicProfile Create**: `ownerUid` set to another user's UID (`"other-uid-999"`). Expected: `PERMISSION_DENIED`.
2. **Shadow Ghost Field Injection**: Creating `/publicProfiles/faizen` with extra field `isAdmin: true`. Expected: `PERMISSION_DENIED`.
3. **Unverified Email Admin Spoofing**: Authenticated with `email: "faizennahmed@gmail.com"` and `email_verified: false`. Expected: `PERMISSION_DENIED`.
4. **Cross-User PII Read**: Authenticated user B attempting `get` on `/users/userA`. Expected: `PERMISSION_DENIED`.
5. **Path ID Poisoning**: Creating a document with a 300-character or punctuation-poisoned ID (`"bad/../../id!"`). Expected: `PERMISSION_DENIED`.
6. **Oversized String DoW**: Setting `bio` to a 2000-character string (exceeding `maxLength: 500`). Expected: `PERMISSION_DENIED`.
7. **Forged Timestamp**: Setting `createdAt` or `updatedAt` to a client-supplied past timestamp instead of `request.time`. Expected: `PERMISSION_DENIED`.
8. **Immutable Field Mutation**: Updating `/publicProfiles/faizen` to change `ownerUid` or `createdAt`. Expected: `PERMISSION_DENIED`.
9. **Self-Assigned Admin Escalation**: Standard user attempting to create `/admins/{theirUid}`. Expected: `PERMISSION_DENIED`.
10. **Blanket Collection Scraping (`list`)**: Unauthenticated or non-admin user attempting `list` on `/users`. Expected: `PERMISSION_DENIED`.
11. **Unbounded or Poisoned Array**: Setting `badges` to 15 items or non-string first element `[123]`. Expected: `PERMISSION_DENIED`.
12. **Value Poisoning on Update**: Updating allowed field `displayName` to a boolean `true` instead of a string. Expected: `PERMISSION_DENIED`.
