# AreaSorted Operating Model

## Selected Model

AreaSorted uses `Model B: Managed marketplace with provider-company network`.

## Core Rules

- Provider is a company-level partner, not an individual worker.
- Provider may use its own staff or workers to fulfil booked jobs.
- AreaSorted controls the customer booking flow, quote flow, and customer-facing platform experience.
- Provider remains responsible for service delivery and fulfilment quality.
- Provider submits base / net pricing to the platform.
- AreaSorted can apply booking fees, markup rules, and admin override pricing.
- Final customer-facing pricing is controlled by AreaSorted platform logic.
- One primary provider may be assigned per area/service, but backup providers should exist in backend operations.

## Commercial Logic

- Provider company gives base price.
- Platform calculates customer sell price.
- Platform earns booking fee and/or margin.
- Admin can override pricing when needed.

## Operational Logic

- Platform owns postcode lookup, service discovery, quote capture, booking flow, and support layer.
- Provider company owns on-site execution, worker assignment, and fulfilment delivery.
- Platform should maintain provider company background, insurance, and agreement records.

## Legal / Responsibility Direction

- Provider company is an independent service provider.
- Provider is responsible for fulfilment and delivery obligations.
- Platform is responsible for booking, pricing presentation, support, and platform administration.
- Payment flow should be structured carefully to match managed marketplace operations.

## Backend Implications

- Provider company records
- Service-area-provider assignment
- Provider base pricing tables
- Platform markup rules
- Admin override pricing
- Margin visibility
- Provider contract and compliance records
