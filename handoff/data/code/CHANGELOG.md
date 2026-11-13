# Changelog

## Unreleased: INV-2143 Recurring Investments API

- Added `POST /v1/plans`, `GET /v1/plans` and `PATCH /v1/plans/{id}/status` from recurring-investments.yaml v1.2.0.
- `Idempotency-Key` is required on create; reusing a key returns 409.
- Amounts are stored in cents, rounded half-even, with a $1.00 minimum.
- Added contract tests for all three operations.
