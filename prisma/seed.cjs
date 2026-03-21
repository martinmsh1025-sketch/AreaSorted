const { PrismaClient } = require('@prisma/client');
const { createHash, scryptSync } = require('node:crypto');

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = 'areasorted-demo-salt';
  const derived = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

const demoProviderInvites = [
  { token: 'demo-provider-invite-token', email: 'demo-provider-invite@example.com', approvedCategoryKey: null, approvedServiceKeysJson: null },
  { token: 'demo-provider-invite-cleaning', email: 'demo-provider-cleaning@example.com', approvedCategoryKey: 'CLEANING', approvedServiceKeysJson: ['regular-home-cleaning', 'end-of-tenancy-cleaning', 'carpet-upholstery-cleaning', 'deep-cleaning', 'office-commercial-cleaning', 'airbnb-turnover-cleaning', 'after-builders-cleaning', 'sofa-upholstery-cleaning', 'oven-cleaning', 'fridge-cleaning', 'window-cleaning-interior', 'window-cleaning-exterior-ground-floor', 'bathroom-deep-clean', 'kitchen-deep-clean'] },
  { token: 'demo-provider-invite-pest-control', email: 'demo-provider-pest@example.com', approvedCategoryKey: 'PEST_CONTROL', approvedServiceKeysJson: ['rat-mouse-treatment', 'cockroach-treatment', 'wasp-nest-removal', 'pest-survey-report', 'mice-treatment', 'rat-treatment', 'ant-treatment', 'flea-treatment', 'bed-bug-treatment', 'moth-treatment', 'silverfish-treatment', 'pigeon-proofing-inspection', 'proofing-sealing-entry-points', 'pest-follow-up-visit'] },
  { token: 'demo-provider-invite-handyman', email: 'demo-provider-handyman@example.com', approvedCategoryKey: 'HANDYMAN', approvedServiceKeysJson: ['tv-mounting', 'mirror-picture-hanging', 'shelf-curtain-fitting', 'tap-toilet-seat-replacement', 'sealant-resealing', 'minor-home-repairs', 'shelf-installation', 'curtain-blind-installation', 'furniture-moving-within-property', 'door-handle-lock-replacement', 'minor-wall-repair-filling', 'flat-pack-adjustment', 'cabinet-fixing', 'minor-plumbing-repair', 'light-fitting-replacement', 'smoke-alarm-installation', 'draft-excluder-sealing-work'] },
  { token: 'demo-provider-invite-furniture-assembly', email: 'demo-provider-furniture@example.com', approvedCategoryKey: 'FURNITURE_ASSEMBLY', approvedServiceKeysJson: ['wardrobe-bed-assembly', 'desk-storage-assembly', 'disassembly-reassembly', 'bed-assembly', 'wardrobe-assembly', 'desk-assembly', 'dining-table-assembly', 'chair-assembly', 'chest-of-drawers-assembly', 'bookcase-assembly', 'nursery-furniture-assembly', 'ikea-assembly', 'multiple-item-assembly', 'disassembly', 'assembly-wall-fixing'] },
  { token: 'demo-provider-invite-waste-removal', email: 'demo-provider-waste@example.com', approvedCategoryKey: 'WASTE_REMOVAL', approvedServiceKeysJson: ['bagged-household-waste', 'bulky-item-removal', 'property-clearance', 'general-household-waste-removal', 'furniture-disposal', 'mattress-removal', 'appliance-removal', 'garage-shed-clearance', 'office-clearance', 'builders-waste-removal'] },
  { token: 'demo-provider-invite-garden-maintenance', email: 'demo-provider-garden@example.com', approvedCategoryKey: 'GARDEN_MAINTENANCE', approvedServiceKeysJson: ['lawn-mowing', 'hedge-trimming', 'garden-tidy-up', 'weeding', 'leaf-clearance', 'pruning', 'small-tree-trimming', 'garden-waste-bagging', 'pressure-washing-patio-driveway', 'fence-painting', 'deck-cleaning', 'seasonal-garden-maintenance'] },
];

const demoProviderInviteEmails = demoProviderInvites.map((invite) => invite.email);

async function main() {
  const roles = [
    { key: 'ADMIN', label: 'Admin' },
    { key: 'PROVIDER', label: 'Provider' },
    { key: 'CUSTOMER', label: 'Customer' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { key: role.key },
      update: { label: role.label },
      create: role,
    });
  }

  const demoUsers = await prisma.user.findMany({
    where: {
      email: {
        in: demoProviderInviteEmails,
      },
    },
    select: { id: true },
  });

  const demoUserIds = demoUsers.map((user) => user.id);
  const demoCompanies = await prisma.providerCompany.findMany({
    where: {
      OR: [
        { contactEmail: { in: demoProviderInviteEmails } },
        ...(demoUserIds.length ? [{ userId: { in: demoUserIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const demoCompanyIds = demoCompanies.map((company) => company.id);

  if (demoCompanyIds.length) {
    await prisma.providerPricingRule.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
    await prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
    await prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
    await prisma.providerAgreement.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
    await prisma.providerOnboardingDocument.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
    await prisma.providerEmailVerification.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
    await prisma.providerAuthToken.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
    await prisma.stripeConnectedAccount.deleteMany({ where: { providerCompanyId: { in: demoCompanyIds } } });
  }

  await prisma.providerInvite.deleteMany({ where: { email: { in: demoProviderInviteEmails } } });

  if (demoCompanyIds.length) {
    await prisma.providerCompany.deleteMany({ where: { id: { in: demoCompanyIds } } });
  }

  if (demoUserIds.length) {
    await prisma.userRoleAssignment.deleteMany({ where: { userId: { in: demoUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: demoUserIds } } });
  }

  const settings = [
    { key: 'marketplace.charge_model', valueJson: { value: 'direct_charges' }, description: 'Default Stripe Connect charge model' },
    { key: 'marketplace.invoice_strategy', valueJson: { value: 'provider_service_plus_platform_fee_receipt' }, description: 'Default invoice ownership strategy' },
    { key: 'marketplace.booking_fee', valueJson: { value: 12 }, description: 'Default booking fee in GBP' },
    { key: 'marketplace.commission_percent', valueJson: { value: 12 }, description: 'Default platform commission percent' },
    { key: 'marketplace.payout_hold_days', valueJson: { value: 7 }, description: 'Default hold period before provider payout' },
  ];

  for (const setting of settings) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: { valueJson: setting.valueJson, description: setting.description },
      create: setting,
    });
  }

  const providerRole = await prisma.role.findUnique({ where: { key: 'PROVIDER' } });
  const adminRole = await prisma.role.findUnique({ where: { key: 'ADMIN' } });
  const adminEmail = process.env.SEED_ADMIN_EMAIL || 'admin@areasorted.test';
  const adminPasswordHash = hashPassword(process.env.SEED_ADMIN_PASSWORD || 'Admin123!');
  const providerEmail = process.env.SEED_PROVIDER_EMAIL || 'provider@example.com';
  const providerPasswordHash = hashPassword('Provider123!');

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { passwordHash: adminPasswordHash, isActive: true },
    create: { email: adminEmail, passwordHash: adminPasswordHash, isActive: true },
  });

  if (adminRole) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
      update: {},
      create: { userId: adminUser.id, roleId: adminRole.id },
    });
  }

  const providerUser = await prisma.user.upsert({
    where: { email: providerEmail },
    update: { passwordHash: providerPasswordHash, isActive: true },
    create: { email: providerEmail, passwordHash: providerPasswordHash, isActive: true },
  });

  if (providerRole) {
    await prisma.userRoleAssignment.upsert({
      where: { userId_roleId: { userId: providerUser.id, roleId: providerRole.id } },
      update: {},
      create: { userId: providerUser.id, roleId: providerRole.id },
    });
  }

  const providerCompany = await prisma.providerCompany.upsert({
    where: { userId: providerUser.id },
    update: {
      userId: providerUser.id,
      legalName: null,
      tradingName: null,
      companyNumber: 'AS-DEMO-001',
      registeredAddress: null,
      contactEmail: providerEmail,
      phone: null,
      status: 'PASSWORD_SETUP_PENDING',
      paymentReady: false,
      emailVerifiedAt: null,
      passwordSetAt: null,
      onboardingSubmittedAt: null,
      reviewStartedAt: null,
      approvedAt: null,
      reviewNotes: null,
    },
    create: {
      userId: providerUser.id,
      legalName: null,
      tradingName: null,
      companyNumber: 'AS-DEMO-001',
      registeredAddress: null,
      contactEmail: providerEmail,
      phone: null,
      status: 'PASSWORD_SETUP_PENDING',
      paymentReady: false,
      emailVerifiedAt: null,
      passwordSetAt: null,
      onboardingSubmittedAt: null,
      reviewStartedAt: null,
      approvedAt: null,
      reviewNotes: null,
    },
  });

  await prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: providerCompany.id } });
  await prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: providerCompany.id } });
  await prisma.providerAgreement.deleteMany({ where: { providerCompanyId: providerCompany.id } });
  await prisma.stripeConnectedAccount.deleteMany({ where: { providerCompanyId: providerCompany.id } });
  await prisma.providerOnboardingDocument.deleteMany({ where: { providerCompanyId: providerCompany.id } });
  await prisma.providerAuthToken.deleteMany({ where: { providerCompanyId: providerCompany.id } });
  await prisma.providerEmailVerification.deleteMany({ where: { providerCompanyId: providerCompany.id } });

  await prisma.providerPricingRule.deleteMany({ where: { providerCompanyId: providerCompany.id } });

  await prisma.providerInvite.deleteMany({
    where: {
      token: {
        in: demoProviderInvites.map((invite) => invite.token),
      },
    },
  });

  for (const invite of demoProviderInvites) {
    await prisma.providerInvite.create({
      data: {
        email: invite.email,
        approvedCategoryKey: invite.approvedCategoryKey,
        approvedServiceKeysJson: invite.approvedServiceKeysJson,
        token: invite.token,
        expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      },
    });
  }

  const inviteOnlyEmail = 'provider-incomplete@example.com';
  const inviteOnlyToken = 'provider-incomplete-invite-token';

  await prisma.providerInvite.upsert({
    where: { token: inviteOnlyToken },
    update: { email: inviteOnlyEmail, approvedCategoryKey: 'HANDYMAN', approvedServiceKeysJson: ['minor-home-repairs'] },
    create: {
      email: inviteOnlyEmail,
      approvedCategoryKey: 'HANDYMAN',
      approvedServiceKeysJson: ['minor-home-repairs'],
      token: inviteOnlyToken,
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    },
  });

  await prisma.providerAuthToken.deleteMany({ where: { email: inviteOnlyEmail } });
  await prisma.providerAuthToken.create({
    data: {
      email: inviteOnlyEmail,
      token: tokenHash('demo-provider-reset-token'),
      purpose: 'PASSWORD_RESET',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
    },
  });

  // ── ACTIVE PROVIDERS for quote-flow testing ──
  // Cleaning: 3 providers (multi-provider comparison view)
  // Pest Control: 1 provider (single-provider direct pricing view)

  const activeProviders = [
    {
      // Sparkle Clean: uses HOURLY pricing mode (system estimates hours from bedrooms/bathrooms)
      email: 'sparkle-clean@example.com',
      tradingName: 'Sparkle Clean London',
      legalName: 'Sparkle Clean London Ltd',
      companyNumber: 'AS-ACTIVE-001',
      registeredAddress: '10 Downing Street, London SW1A 2AA',
      phone: '+44 20 7946 0001',
      categories: ['CLEANING'],
      postcodes: ['SW1A', 'SW1V', 'SW1W', 'SW1X', 'SW1Y', 'SW1P', 'SW1H', 'SW1E', 'SW3', 'W1', 'W1A', 'W1B', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W', 'W2', 'EC1', 'EC1A', 'EC1M', 'EC1N', 'EC1R', 'EC1V', 'EC1Y', 'N1'],
      pricingRules: [
        { categoryKey: 'CLEANING', serviceKey: 'regular-home-cleaning', pricingMode: 'hourly', hourlyPrice: 18, minimumCharge: 36 },
        { categoryKey: 'CLEANING', serviceKey: 'end-of-tenancy-cleaning', pricingMode: 'hourly', hourlyPrice: 22, minimumCharge: 88 },
        { categoryKey: 'CLEANING', serviceKey: 'deep-cleaning', pricingMode: 'hourly', hourlyPrice: 20, minimumCharge: 60 },
        { categoryKey: 'CLEANING', serviceKey: 'office-commercial-cleaning', pricingMode: 'hourly', hourlyPrice: 24, minimumCharge: 72 },
      ],
      stripeAccountId: 'acct_mock_sparkle_001',
    },
    {
      // Pristine Maids: uses FIXED_PER_SIZE pricing mode (provider sets prices per property size)
      email: 'pristine-maids@example.com',
      tradingName: 'Pristine Maids',
      legalName: 'Pristine Maids Services Ltd',
      companyNumber: 'AS-ACTIVE-002',
      registeredAddress: '221B Baker Street, London NW1 6XE',
      phone: '+44 20 7946 0002',
      categories: ['CLEANING'],
      postcodes: ['SW1A', 'SW1V', 'SW1W', 'SW1P', 'SW3', 'SW5', 'SW6', 'W1', 'W1A', 'W1B', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W'],
      pricingRules: [
        { categoryKey: 'CLEANING', serviceKey: 'regular-home-cleaning', pricingMode: 'fixed_per_size', pricingJson: { small: 55, standard: 85, large: 125 }, minimumCharge: 55 },
        { categoryKey: 'CLEANING', serviceKey: 'end-of-tenancy-cleaning', pricingMode: 'fixed_per_size', pricingJson: { small: 129, standard: 199, large: 289 }, minimumCharge: 129 },
        { categoryKey: 'CLEANING', serviceKey: 'deep-cleaning', pricingMode: 'fixed_per_size', pricingJson: { small: 96, standard: 145, large: 210 }, minimumCharge: 96 },
      ],
      stripeAccountId: 'acct_mock_pristine_002',
    },
    {
      // Fresh Start: uses HOURLY pricing mode (budget-friendly option)
      email: 'fresh-start-cleaners@example.com',
      tradingName: 'Fresh Start Cleaners',
      legalName: 'Fresh Start Cleaners Ltd',
      companyNumber: 'AS-ACTIVE-003',
      registeredAddress: '1 Oxford Street, London W1D 1AN',
      phone: '+44 20 7946 0003',
      categories: ['CLEANING'],
      postcodes: ['SW1A', 'SW1V', 'SW1W', 'W1', 'W1A', 'W1B', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W', 'W2', 'WC1', 'WC1A', 'WC1B', 'WC1E', 'WC1H', 'WC1N', 'WC1R', 'WC1V', 'WC1X', 'WC2', 'WC2A', 'WC2B', 'WC2E', 'WC2H', 'WC2N', 'WC2R'],
      pricingRules: [
        { categoryKey: 'CLEANING', serviceKey: 'regular-home-cleaning', pricingMode: 'hourly', hourlyPrice: 15, minimumCharge: 30 },
        { categoryKey: 'CLEANING', serviceKey: 'end-of-tenancy-cleaning', pricingMode: 'hourly', hourlyPrice: 20, minimumCharge: 80 },
        { categoryKey: 'CLEANING', serviceKey: 'deep-cleaning', pricingMode: 'hourly', hourlyPrice: 18, minimumCharge: 54 },
        { categoryKey: 'CLEANING', serviceKey: 'carpet-upholstery-cleaning', pricingMode: 'hourly', hourlyPrice: 30, minimumCharge: 60 },
      ],
      stripeAccountId: 'acct_mock_fresh_003',
    },
    {
      // London Pest Solutions: uses FIXED_PER_SIZE pricing (size-based treatment pricing)
      email: 'london-pest-solutions@example.com',
      tradingName: 'London Pest Solutions',
      legalName: 'London Pest Solutions Ltd',
      companyNumber: 'AS-ACTIVE-004',
      registeredAddress: '50 Broadway, London SW1H 0BL',
      phone: '+44 20 7946 0004',
      categories: ['PEST_CONTROL'],
      postcodes: ['SW1A', 'SW1V', 'SW1W', 'SW1X', 'SW1Y', 'SW1P', 'SW1H', 'SW1E', 'SW3', 'W1', 'W1A', 'W1B', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W', 'W2', 'EC1', 'EC1A', 'EC1M', 'EC1N', 'EC1R', 'EC1V', 'EC1Y', 'N1', 'SE1', 'E1', 'E2', 'E14', 'NW1'],
      pricingRules: [
        { categoryKey: 'PEST_CONTROL', serviceKey: 'rat-mouse-treatment', pricingMode: 'fixed_per_size', pricingJson: { small: 129, standard: 171, large: 224 }, minimumCharge: 129 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'cockroach-treatment', pricingMode: 'fixed_per_size', pricingJson: { small: 149, standard: 197, large: 251 }, minimumCharge: 149 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'bed-bug-treatment', pricingMode: 'fixed_per_size', pricingJson: { small: 179, standard: 249, large: 349 }, minimumCharge: 179 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'wasp-nest-removal', pricingMode: 'fixed_per_size', pricingJson: { small: 99, standard: 129, large: 177 }, minimumCharge: 99 },
      ],
      stripeAccountId: 'acct_mock_pest_004',
    },
  ];

  const activeProviderEmails = activeProviders.map((p) => p.email);

  // Clean up any existing active demo providers
  const existingActiveUsers = await prisma.user.findMany({
    where: { email: { in: activeProviderEmails } },
    select: { id: true },
  });
  const existingActiveUserIds = existingActiveUsers.map((u) => u.id);
  const existingActiveCompanies = await prisma.providerCompany.findMany({
    where: {
      OR: [
        { contactEmail: { in: activeProviderEmails } },
        ...(existingActiveUserIds.length ? [{ userId: { in: existingActiveUserIds } }] : []),
      ],
    },
    select: { id: true },
  });
  const existingActiveCompanyIds = existingActiveCompanies.map((c) => c.id);

  if (existingActiveCompanyIds.length) {
    // Clean up bookings and their dependent records
    const existingBookings = await prisma.booking.findMany({
      where: { providerCompanyId: { in: existingActiveCompanyIds } },
      select: { id: true },
    });
    const existingBookingIds = existingBookings.map((b) => b.id);
    if (existingBookingIds.length) {
      await prisma.paymentRecord.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.bookingPriceSnapshot.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.booking.deleteMany({ where: { id: { in: existingBookingIds } } });
    }

    // Clean up quote-related records that reference providers
    await prisma.quoteOption.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerPricingRule.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.pricingAuditLog.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.pricingAreaOverride.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerAgreement.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerOnboardingDocument.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerEmailVerification.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerAuthToken.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.stripeConnectedAccount.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerAvailability.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerCompany.deleteMany({ where: { id: { in: existingActiveCompanyIds } } });
  }

  if (existingActiveUserIds.length) {
    await prisma.userRoleAssignment.deleteMany({ where: { userId: { in: existingActiveUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: existingActiveUserIds } } });
  }

  // Create each active provider
  for (const prov of activeProviders) {
    const user = await prisma.user.create({
      data: {
        email: prov.email,
        passwordHash: hashPassword('Provider123!'),
        isActive: true,
      },
    });

    if (providerRole) {
      await prisma.userRoleAssignment.create({
        data: { userId: user.id, roleId: providerRole.id },
      });
    }

    const company = await prisma.providerCompany.create({
      data: {
        userId: user.id,
        tradingName: prov.tradingName,
        legalName: prov.legalName,
        companyNumber: prov.companyNumber,
        registeredAddress: prov.registeredAddress,
        contactEmail: prov.email,
        phone: prov.phone,
        status: 'ACTIVE',
        paymentReady: true,
        emailVerifiedAt: new Date(),
        passwordSetAt: new Date(),
        onboardingSubmittedAt: new Date(),
        reviewStartedAt: new Date(),
        approvedAt: new Date(),
      },
    });

    // Stripe connected account (mock, fully enabled)
    await prisma.stripeConnectedAccount.create({
      data: {
        providerCompanyId: company.id,
        stripeAccountId: prov.stripeAccountId,
        chargesEnabled: true,
        payoutsEnabled: true,
        detailsSubmitted: true,
        lastSyncedAt: new Date(),
      },
    });

    // Required document — company registration proof (approved)
    await prisma.providerOnboardingDocument.create({
      data: {
        providerCompanyId: company.id,
        documentKey: 'company_registration_proof',
        label: 'Company registration proof',
        fileName: 'company_registration.pdf',
        storedFileName: 'mock_company_registration.pdf',
        storagePath: '/mock/documents/company_registration.pdf',
        mimeType: 'application/pdf',
        sizeBytes: 102400,
        status: 'APPROVED',
        uploadedAt: new Date(),
        reviewedAt: new Date(),
      },
    });

    // Provider agreement (signed)
    await prisma.providerAgreement.create({
      data: {
        providerCompanyId: company.id,
        version: '1.0',
        status: 'SIGNED',
        documentUrl: '/mock/agreements/provider-agreement-v1.pdf',
        signedAt: new Date(),
      },
    });

    // Service categories
    for (const cat of prov.categories) {
      await prisma.providerServiceCategory.create({
        data: { providerCompanyId: company.id, categoryKey: cat, active: true },
      });
    }

    // Coverage areas — each category × each postcode prefix
    for (const cat of prov.categories) {
      for (const pc of prov.postcodes) {
        await prisma.providerCoverageArea.create({
          data: { providerCompanyId: company.id, postcodePrefix: pc, categoryKey: cat, active: true },
        });
      }
    }

    // Pricing rules
    for (const rule of prov.pricingRules) {
      await prisma.providerPricingRule.create({
        data: {
          providerCompanyId: company.id,
          categoryKey: rule.categoryKey,
          serviceKey: rule.serviceKey,
          pricingMode: rule.pricingMode,
          hourlyPrice: rule.hourlyPrice || null,
          minimumCharge: rule.minimumCharge,
          pricingJson: rule.pricingJson || undefined,
          active: true,
        },
      });
    }

    // Availability: Mon-Sat 08:00-18:00
    for (let day = 1; day <= 6; day++) {
      await prisma.providerAvailability.create({
        data: {
          providerCompanyId: company.id,
          dayOfWeek: day,
          startTime: '08:00',
          endTime: '18:00',
          isAvailable: true,
        },
      });
    }

    console.log(`  ✓ Created active provider: ${prov.tradingName} (${prov.email})`);
  }

  console.log('\n  Active providers summary:');
  console.log('  - Cleaning (hourly mode): Sparkle Clean London (£18/hr), Fresh Start Cleaners (£15/hr)');
  console.log('  - Cleaning (fixed per size mode): Pristine Maids (£55/£85/£125 per size)');
  console.log('  - Pest Control (fixed per size): London Pest Solutions (e.g. rats £129/£171/£224)');
  console.log('  - Test postcode: SW1A 1AA (or any SW1 prefix)');
  console.log('  - All provider passwords: Provider123!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
