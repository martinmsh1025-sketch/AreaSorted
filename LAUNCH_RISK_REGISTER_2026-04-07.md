# AreaSorted Launch Risk Register (2026-04-07)

## Top 10 Pre-Launch Risks

1. **Public booking data exposure**
   - `src/app/booking/manage/page.tsx`
   - Risk: customer PII could be exposed by reference lookup without authentication
   - Severity: Critical

2. **Reference-based quote and booking status pages**
   - `src/app/quote/[reference]/page.tsx`
   - `src/app/booking/status/[reference]/page.tsx`
   - Risk: privacy assumptions rely heavily on unguessable references and limited disclosure rules
   - Severity: High

3. **Customer reschedule path may bypass provider re-validation**
   - `src/app/account/bookings/[reference]/actions.ts`
   - Risk: customer may move a booking to a slot the provider/pricing rules no longer support
   - Severity: High

4. **Cancel/refund/capture race conditions still need real-world testing**
   - `src/app/account/bookings/[reference]/actions.ts`
   - `src/app/provider/orders/actions.ts`
   - Risk: inconsistent payment state, refund state, or booking state under concurrent actions
   - Severity: High

5. **In-memory rate limiting is not production-grade for distributed deployment**
   - `src/lib/security/rate-limit.ts`
   - Risk: protections weaken across multiple instances / serverless scale-out
   - Severity: High

6. **Legal/compliance documents require production version control**
   - `src/content/legal/customer-terms.txt`
   - `src/content/legal/refund-policy.txt`
   - `src/content/legal/gdpr-policy.txt`
   - `src/content/legal/cookie-policy.txt`
   - `src/app/(marketing)/cleaner-terms/page.tsx`
   - Risk: future policy edits may drift without version control and periodic review
   - Severity: Medium

7. **Live production integration keys are still missing**
   - Google login, Crisp, WhatsApp, production DB config
   - Risk: broken auth/support paths or incorrect production environment wiring
   - Severity: High

8. **Customer/payment path needs continued regression testing**
   - `README.md`
   - Risk: regressions caused by booking, pricing, payment, refund, or payout edge cases
   - Severity: Medium-High

9. **Pricing configuration needs continued auditability checks**
   - `src/lib/pricing-config-store.ts`
   - Risk: operational drift or weaker auditability if pricing changes are not reviewed consistently
   - Severity: Medium-High

10. **Test and monitoring coverage is not yet launch-grade**
    - Risk: payment, webhook, cron, and booking regressions may ship unnoticed
    - Severity: High

## Recommended Immediate Order

1. Fix public data exposure and sensitive reference-based flows
2. Re-test payment/cancel/reschedule edge cases end-to-end
3. Maintain legal/compliance version control
4. Complete production env + deployment validation
5. Add launch-critical tests and monitoring
