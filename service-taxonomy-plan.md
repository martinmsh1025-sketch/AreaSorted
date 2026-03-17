# Service Taxonomy Plan

> Alignment note (2026-03-16)
> - Authoritative product direction is `AreaSorted` as a managed marketplace with `provider-company` as the primary commercial entity.
> - `ProviderCompany` is the top-level provider model for customer booking, pricing, onboarding, admin review, Stripe setup, and provider portal access.
> - `Cleaner` or worker flows remain legacy or secondary operational modules unless a document explicitly states they are future subcontractor/workforce features under a provider.
> - Provider auth lifecycle should be read as: `invite -> email verification -> password setup -> onboarding -> admin review -> Stripe -> pricing -> active portal`.
> - Where this document still references older names such as `WashHub`, `Alder London`, or `London Cleaning Platform`, treat them as legacy wording pending full content rewrite; `AreaSorted` is the active brand.


Source of truth: `/Users/piggypig/Desktop/job list.rtf`

## Categories

- Cleaning
- Waste Removal
- Pest Control
- Garden Work
- Handyman
- Furniture Assembly

## Cleaning Job Types

- Regular home cleaning
- Deep cleaning
- End of tenancy cleaning
- Office / commercial cleaning
- Airbnb turnover cleaning
- After-builders cleaning
- Carpet cleaning
- Sofa / upholstery cleaning
- Oven cleaning
- Fridge cleaning
- Window cleaning (interior)
- Window cleaning (exterior, ground floor only)
- Bathroom deep clean
- Kitchen deep clean

Primary pricing factors:
- property type
- area size
- room count
- condition level
- pets / smoking
- furnished / unfurnished
- supplies / machines
- bed changing / laundry extras
- floor / lift / parking / congestion
- same-day / weekend / holiday
- recurring frequency
- special requirements like mould, limescale, grease, post-party

## Waste Removal Job Types

- General household waste removal
- Bulky item removal
- Furniture disposal
- Mattress removal
- Appliance removal
- Garden waste removal
- Garage / shed clearance
- Loft / attic clearance
- Office clearance
- Builders waste removal
- End-of-tenancy rubbish clearance

Primary pricing factors:
- waste type
- volume
- weight
- item count
- dismantling required
- bagging / loading effort
- floor / lift / parking distance
- two-person crew
- large items
- sharp / fragile / dirty risk
- disposal / tip fee
- same-day
- restricted access

## Pest Control Job Types

- Pest inspection
- Mice treatment
- Rat treatment
- Ant treatment
- Cockroach treatment
- Flea treatment
- Bed bug treatment
- Wasp nest treatment
- Moth treatment
- Silverfish treatment
- Pigeon proofing inspection
- Proofing / sealing entry points
- Follow-up visit

Primary pricing factors:
- pest type
- infestation severity
- property type
- area / room count
- indoor / outdoor
- multiple treatments
- follow-up inspection
- trapping / baiting / spray / heat treatment
- proofing / sealing
- urgent
- commercial site
- children / pets
- report required

## Garden Work Job Types

- Lawn mowing
- Hedge trimming
- Weeding
- Garden tidy-up
- Leaf clearance
- Pruning
- Small tree trimming
- Garden waste bagging
- Pressure washing patio / driveway
- Fence painting
- Deck cleaning
- Seasonal garden maintenance

Primary pricing factors:
- garden size
- front / back / both
- grass length / hedge height
- weed density
- waste volume
- tools required
- mower / trimmer / pressure washer
- access difficulty
- disposal
- one-off / recurring
- weather / season
- water / power supply

## Handyman Job Types

- TV wall mounting
- Shelf installation
- Curtain / blind installation
- Mirror / picture hanging
- Furniture moving within property
- Door handle / lock replacement
- Silicone / caulking
- Minor wall repair / filling
- Flat-pack adjustment
- Cabinet fixing
- Minor plumbing repair
- Tap replacement
- Toilet seat replacement
- Light fitting replacement
- Smoke alarm installation
- Draft excluder / sealing work

Primary pricing factors:
- job complexity
- estimated duration
- drilling required
- wall type
- ladder / height work
- two-person crew
- materials source
- pickup materials
- parking issue
- urgent / evening
- licensed / regulated work flag

## Furniture Assembly Job Types

- Bed assembly
- Wardrobe assembly
- Desk assembly
- Dining table assembly
- Chair assembly
- Chest of drawers assembly
- Bookcase assembly
- Nursery furniture assembly
- IKEA assembly
- Multiple item assembly
- Disassembly
- Assembly + wall fixing

Primary pricing factors:
- furniture type
- item count
- brand / model
- flat-pack
- size
- wall fixing / anti-tip fixing
- two-person crew
- lift
- room-of-choice delivery already done
- disposal of packaging
- urgent
- manual / model / product link / photos

## Shared Pricing Engine Dimensions

- category
- subcategory
- property_type
- postcode_zone
- preferred_date
- preferred_time_window
- one_off_or_recurring
- area_size
- item_count
- room_count
- waste_volume
- garden_size
- task_count
- condition_level
- access_and_logistics
- labour_requirements
- materials_and_disposal
- risk_and_urgency

## Required Build Order

1. Replace current simplified taxonomy with the full Desktop job list.
2. Separate pricing models by category: cleaning, waste, pest, garden, handyman, furniture assembly.
3. Restore full cleaning-specific inputs: bedrooms, bathrooms, kitchens, multiple dates, multiple times, recurring options.
4. Add grouped job selection UI by category and subcategory.
5. Feed booking, payment, and admin records with category + job type + pricing factors.
