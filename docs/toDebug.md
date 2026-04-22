# Debug note - Mongo duplicate key on `executionId`

## Symptom

Backend logs show:

`E11000 duplicate key error collection: quizapp.quizzes index: executionId_1 dup key: { executionId: null }`

This can break quiz creation even before calling the start endpoint.

## Root cause

`executionId` is generated only when starting a quiz (`POST /api/quiz/:quizId/start`).
Before start, many quiz documents have no real execution id.

If Mongo index on `executionId` is plain `unique: true`, documents with `executionId: null`
conflict with each other, because only one `null` value is allowed for a unique index.

## Expected behavior

- A quiz can be created without `executionId`.
- `executionId` becomes unique only once a quiz is started.
- Multiple quizzes without started sessions must coexist without index errors.

## Recommended fix

1. Use a **partial unique index** (preferred) so uniqueness is enforced only when `executionId` exists and is not null.
2. Avoid persisting `executionId: null` on insert; omit the field until start.

Mongo index example:

```js
db.quizzes.createIndex(
  { executionId: 1 },
  {
    unique: true,
    partialFilterExpression: { executionId: { $exists: true, $ne: null } }
  }
);
```

## Optional migration steps

1. Drop the current problematic unique index on `executionId`.
2. Recreate it as partial unique.
3. Clean existing records where `executionId` is explicitly `null` (unset field if needed).

## Why this matters for frontend flow

Frontend reads execution id from `Location` header returned by start endpoint.
So `executionId` is an optional lifecycle field, not a mandatory creation-time field.
