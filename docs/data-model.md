# Firestore data model

Everything a user owns lives under `users/{uid}`, so account deletion (Phase 8)
can remove one subtree. Rules: [`firestore.rules`](../firestore.rules),
tests: [`tests/rules/`](../tests/rules).

| Path                                | Written by               | Purpose                 |
| ----------------------------------- | ------------------------ | ----------------------- |
| `users/{uid}`                       | client (own)             | Profile                 |
| `users/{uid}/projects/{projectId}`  | client (own)             | User-created workspaces |
| `users/{uid}/activity/{activityId}` | **Cloud Functions only** | Recent activity feed    |
| `users/{uid}/usage/{YYYY-MM-DD}`    | **Cloud Functions only** | Daily AI usage counters |

## `users/{uid}`

| Field                | Type           | Notes                                               |
| -------------------- | -------------- | --------------------------------------------------- |
| displayName          | string         | ≤ 80 chars                                          |
| email                | string         | must equal the signed-in email; locked after create |
| photoURL             | string \| null | ≤ 2048 chars                                        |
| createdAt, updatedAt | timestamp      | server time only                                    |

## `users/{uid}/projects/{projectId}`

| Field                | Type      | Notes                                         |
| -------------------- | --------- | --------------------------------------------- |
| name                 | string    | 1–80 chars                                    |
| description          | string    | ≤ 500 chars (may be empty)                    |
| techStack            | string[]  | ≤ 10 tags, each ≤ 30 chars (client-validated) |
| createdAt, updatedAt | timestamp | server time only; createdAt locked            |

## `users/{uid}/activity/{activityId}`

| Field     | Type           | Notes                                                                          |
| --------- | -------------- | ------------------------------------------------------------------------------ |
| module    | string         | `assistant`, `reviewer`, `bug-fixer`, `component-generator`, `learn`, `github` |
| title     | string         | short summary, e.g. "Explained array.reduce()"; never raw user code            |
| projectId | string \| null | optional link to a project                                                     |
| targetId  | string \| null | e.g. the conversation id, for "open" links                                     |
| createdAt | timestamp      |                                                                                |

## `users/{uid}/usage/{YYYY-MM-DD}`

Document id is the **UTC** date, so ids sort by date and a date range is a simple
id range query.

| Field               | Type                | Notes                |
| ------------------- | ------------------- | -------------------- |
| requests            | number              | AI requests that day |
| tokensIn, tokensOut | number              | Gemini tokens        |
| byModule            | map<string, number> | requests per module  |
| updatedAt           | timestamp           |                      |
