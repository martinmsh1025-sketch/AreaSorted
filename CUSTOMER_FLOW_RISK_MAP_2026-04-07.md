# Customer Flow Risk Map (2026-04-07)

```mermaid
flowchart TD
    A[Homepage / Quote Form] --> B[Quote Estimate API]
    B --> C[Create Public Quote]
    C --> D[Quote Result by Reference]
    D --> E[Secure Hold / Checkout]
    E --> F[Booking Status by Reference]
    F --> G[Customer Account Login]
    G --> H[Account Booking Detail]
    H --> I[Cancel / Reschedule / Counter Offer]
    I --> J[Provider Accept / Reject / Complete]
    J --> K[Refund / Payout / Admin Ops]

    B -. Rate limit / abuse risk .-> R1[Risk: in-memory rate limiting]
    C -. Account creation / pricing mix .-> R2[Risk: legacy + new architecture overlap]
    D -. Public reference access .-> R3[Risk: quote disclosure by reference]
    F -. Public reference access .-> R4[Risk: booking status privacy assumptions]
    H -. Was public before fix .-> R5[Risk: booking manage PII exposure]
    I -. Missing re-validation .-> R6[Risk: unsupported reschedule slot]
    I -. Concurrent state changes .-> R7[Risk: cancel vs accept/capture race]
    K -. Partial ops maturity .-> R8[Risk: payout/refund edge cases]
```

## Sensitive Data Boundaries

- **Public pages** should avoid exposing customer PII and provider identity unless absolutely necessary
- **Reference-based pages** must assume links can be forwarded or guessed and should expose the minimum viable information only
- **Authenticated account pages** are the only safe place for full booking details, address details, contact details, receipts, cancellation, and reschedule controls
- **Provider identity** should only be shown when the product/business rule explicitly allows it

## Highest-Risk Customer Nodes

1. `Quote Result by Reference`
2. `Booking Status by Reference`
3. `Booking Manage` (now gated to signed-in customer session)
4. `Cancel / Reschedule / Counter Offer`
5. `Refund / Payout / Admin Ops`

## Recommended Safeguards

- Keep public-by-reference pages minimal
- Gate all full booking details behind authenticated customer session
- Re-validate provider availability/pricing before any customer-initiated reschedule is committed
- Add stronger production-grade rate limiting and request auditing
- Add end-to-end tests for quote -> checkout -> booking -> cancel/reschedule -> refund flows
