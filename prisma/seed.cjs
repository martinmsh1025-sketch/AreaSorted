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

function stringifyPublicProfileMetadata(input) {
  return JSON.stringify({
    supportedContactChannels: input.supportedContactChannels || [],
    responseTimeLabel: input.responseTimeLabel || null,
    serviceCommitments: input.serviceCommitments || [],
    languagesSpoken: input.languagesSpoken || [],
    customerCareNote: input.customerCareNote || null,
  });
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
      publicProfileMetadata: {
        supportedContactChannels: ['WhatsApp', 'SMS', 'Phone'],
        contactDetails: { WhatsApp: '+447700900101', SMS: '+447700900101', Phone: '+442079460001' },
        responseTimeLabel: 'Usually replies within 30 mins',
        serviceCommitments: ['Own supplies', 'Weekend slots', 'Arrival updates'],
        languagesSpoken: ['English'],
      },
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
      publicProfileMetadata: {
        supportedContactChannels: ['WhatsApp', 'Email'],
        contactDetails: { WhatsApp: '+447700900102', Email: 'bookings@pristinemaids.test' },
        responseTimeLabel: 'Usually replies within 1 hour',
        serviceCommitments: ['Eco products available', 'Landlord-ready checklists', 'Weekend slots'],
        languagesSpoken: ['English', 'Polish'],
      },
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
      publicProfileMetadata: {
        supportedContactChannels: ['SMS', 'Phone'],
        contactDetails: { SMS: '+447700900103', Phone: '+442079460003' },
        responseTimeLabel: 'Usually replies within 45 mins',
        serviceCommitments: ['Budget-friendly pricing', 'Same-day updates', 'Flexible weekday slots'],
        languagesSpoken: ['English', 'Romanian'],
      },
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
      publicProfileMetadata: {
        supportedContactChannels: ['Phone', 'SMS', 'WhatsApp'],
        contactDetails: { Phone: '+442079460004', SMS: '+447700900104', WhatsApp: '+447700900104' },
        responseTimeLabel: 'Usually replies within 20 mins',
        serviceCommitments: ['Photo proofing notes', 'Follow-up guidance', 'Emergency slots'],
        languagesSpoken: ['English'],
      },
      postcodes: ['SW1A', 'SW1V', 'SW1W', 'SW1X', 'SW1Y', 'SW1P', 'SW1H', 'SW1E', 'SW3', 'W1', 'W1A', 'W1B', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W', 'W2', 'EC1', 'EC1A', 'EC1M', 'EC1N', 'EC1R', 'EC1V', 'EC1Y', 'N1', 'SE1', 'E1', 'E2', 'E14', 'NW1'],
      pricingRules: [
        { categoryKey: 'PEST_CONTROL', serviceKey: 'rat-mouse-treatment', pricingMode: 'fixed_per_size', pricingJson: { small: 129, standard: 171, large: 224 }, minimumCharge: 129 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'cockroach-treatment', pricingMode: 'fixed_per_size', pricingJson: { small: 149, standard: 197, large: 251 }, minimumCharge: 149 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'bed-bug-treatment', pricingMode: 'fixed_per_size', pricingJson: { small: 179, standard: 249, large: 349 }, minimumCharge: 179 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'wasp-nest-removal', pricingMode: 'fixed_per_size', pricingJson: { small: 99, standard: 129, large: 177 }, minimumCharge: 99 },
      ],
      stripeAccountId: 'acct_mock_pest_004',
    },
    {
      // AreaSorted Test Provider: SUPER PROVIDER — covers ALL London postcodes, ALL 6 categories, ALL 57 services
      // Purpose: end-to-end testing of the full quote flow for any postcode/service combination
      email: 'test-provider@areasorted.test',
      tradingName: 'AreaSorted Test Provider',
      legalName: 'AreaSorted Test Services Ltd',
      companyNumber: 'AS-TEST-999',
      registeredAddress: '1 Test Street, London EC1A 1BB',
      phone: '+44 20 7946 9999',
      categories: ['CLEANING', 'PEST_CONTROL', 'HANDYMAN', 'FURNITURE_ASSEMBLY', 'WASTE_REMOVAL', 'GARDEN_MAINTENANCE'],
      publicProfileMetadata: {
        supportedContactChannels: ['WhatsApp', 'SMS', 'Phone', 'Telegram'],
        contactDetails: { WhatsApp: '+447700909999', SMS: '+447700909999', Phone: '+442079469999', Telegram: '@areasortedtestprovider' },
        responseTimeLabel: 'Usually replies within 15 mins',
        serviceCommitments: ['Multi-service coordination', 'Weekend slots', 'Arrival updates'],
        languagesSpoken: ['English', 'Cantonese'],
      },
      postcodes: [
        // E postcodes
        'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'E11', 'E12', 'E13', 'E14', 'E15', 'E16', 'E17', 'E18', 'E20',
        'E1W',
        // EC postcodes
        'EC1', 'EC1A', 'EC1M', 'EC1N', 'EC1R', 'EC1V', 'EC1Y',
        'EC2', 'EC2A', 'EC2M', 'EC2N', 'EC2R', 'EC2V', 'EC2Y',
        'EC3', 'EC3A', 'EC3M', 'EC3N', 'EC3R', 'EC3V',
        'EC4', 'EC4A', 'EC4M', 'EC4N', 'EC4R', 'EC4V', 'EC4Y',
        // N postcodes
        'N1', 'N1C', 'N1P', 'N2', 'N3', 'N4', 'N5', 'N6', 'N7', 'N8', 'N9', 'N10', 'N11', 'N12', 'N13', 'N14', 'N15', 'N16', 'N17', 'N18', 'N19', 'N20', 'N21', 'N22',
        // NW postcodes
        'NW1', 'NW1W', 'NW2', 'NW3', 'NW4', 'NW5', 'NW6', 'NW7', 'NW8', 'NW9', 'NW10', 'NW11',
        // SE postcodes
        'SE1', 'SE1P', 'SE2', 'SE3', 'SE4', 'SE5', 'SE6', 'SE7', 'SE8', 'SE9', 'SE10', 'SE11', 'SE12', 'SE13', 'SE14', 'SE15', 'SE16', 'SE17', 'SE18', 'SE19', 'SE20', 'SE21', 'SE22', 'SE23', 'SE24', 'SE25', 'SE26', 'SE27', 'SE28',
        // SW postcodes
        'SW1', 'SW1A', 'SW1E', 'SW1H', 'SW1P', 'SW1V', 'SW1W', 'SW1X', 'SW1Y',
        'SW2', 'SW3', 'SW4', 'SW5', 'SW6', 'SW7', 'SW8', 'SW9', 'SW10', 'SW11', 'SW12', 'SW13', 'SW14', 'SW15', 'SW16', 'SW17', 'SW18', 'SW19', 'SW20',
        // W postcodes
        'W1', 'W1A', 'W1B', 'W1C', 'W1D', 'W1F', 'W1G', 'W1H', 'W1J', 'W1K', 'W1S', 'W1T', 'W1U', 'W1W',
        'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12', 'W13', 'W14',
        // WC postcodes
        'WC1', 'WC1A', 'WC1B', 'WC1E', 'WC1H', 'WC1N', 'WC1R', 'WC1V', 'WC1X',
        'WC2', 'WC2A', 'WC2B', 'WC2E', 'WC2H', 'WC2N', 'WC2R',
        // Outer London — BR, CR, DA, EN, HA, IG, KT, RM, SM, TN, TW, UB
        'BR1', 'BR2', 'BR3', 'BR4', 'BR5', 'BR6', 'BR7', 'BR8',
        'CR0', 'CR2', 'CR3', 'CR4', 'CR5', 'CR6', 'CR7', 'CR8', 'CR9',
        'DA1', 'DA2', 'DA3', 'DA4', 'DA5', 'DA6', 'DA7', 'DA8', 'DA9', 'DA10', 'DA11', 'DA12', 'DA13', 'DA14', 'DA15', 'DA16', 'DA17', 'DA18',
        'EN1', 'EN2', 'EN3', 'EN4', 'EN5', 'EN6', 'EN7', 'EN8', 'EN9', 'EN10', 'EN11',
        'HA0', 'HA1', 'HA2', 'HA3', 'HA4', 'HA5', 'HA6', 'HA7', 'HA8', 'HA9',
        'IG1', 'IG2', 'IG3', 'IG4', 'IG5', 'IG6', 'IG7', 'IG8', 'IG9', 'IG10', 'IG11',
        'KT1', 'KT2', 'KT3', 'KT4', 'KT5', 'KT6', 'KT7', 'KT8', 'KT9', 'KT10', 'KT11', 'KT12', 'KT13', 'KT14', 'KT15', 'KT16', 'KT17', 'KT18', 'KT19', 'KT20', 'KT21', 'KT22', 'KT23', 'KT24',
        'RM1', 'RM2', 'RM3', 'RM4', 'RM5', 'RM6', 'RM7', 'RM8', 'RM9', 'RM10', 'RM11', 'RM12', 'RM13', 'RM14', 'RM15', 'RM16', 'RM17', 'RM18', 'RM19', 'RM20',
        'SM1', 'SM2', 'SM3', 'SM4', 'SM5', 'SM6', 'SM7',
        'TN1', 'TN2', 'TN3', 'TN4', 'TN13', 'TN14', 'TN15', 'TN16',
        'TW1', 'TW2', 'TW3', 'TW4', 'TW5', 'TW6', 'TW7', 'TW8', 'TW9', 'TW10', 'TW11', 'TW12', 'TW13', 'TW14', 'TW15', 'TW16', 'TW17', 'TW18', 'TW19', 'TW20',
        'UB1', 'UB2', 'UB3', 'UB4', 'UB5', 'UB6', 'UB7', 'UB8', 'UB9', 'UB10', 'UB11', 'UB18',
      ],
      pricingRules: [
        // CLEANING (14 services) — hourly pricing based on catalog basePrice
        { categoryKey: 'CLEANING', serviceKey: 'regular-home-cleaning', pricingMode: 'hourly', hourlyPrice: 18, minimumCharge: 36 },
        { categoryKey: 'CLEANING', serviceKey: 'deep-cleaning', pricingMode: 'hourly', hourlyPrice: 22, minimumCharge: 66 },
        { categoryKey: 'CLEANING', serviceKey: 'end-of-tenancy-cleaning', pricingMode: 'hourly', hourlyPrice: 25, minimumCharge: 100 },
        { categoryKey: 'CLEANING', serviceKey: 'office-commercial-cleaning', pricingMode: 'hourly', hourlyPrice: 22, minimumCharge: 66 },
        { categoryKey: 'CLEANING', serviceKey: 'airbnb-turnover-cleaning', pricingMode: 'hourly', hourlyPrice: 20, minimumCharge: 60 },
        { categoryKey: 'CLEANING', serviceKey: 'after-builders-cleaning', pricingMode: 'hourly', hourlyPrice: 28, minimumCharge: 84 },
        { categoryKey: 'CLEANING', serviceKey: 'carpet-upholstery-cleaning', pricingMode: 'hourly', hourlyPrice: 24, minimumCharge: 48 },
        { categoryKey: 'CLEANING', serviceKey: 'sofa-upholstery-cleaning', pricingMode: 'hourly', hourlyPrice: 22, minimumCharge: 44 },
        { categoryKey: 'CLEANING', serviceKey: 'oven-cleaning', pricingMode: 'hourly', hourlyPrice: 20, minimumCharge: 46 },
        { categoryKey: 'CLEANING', serviceKey: 'fridge-cleaning', pricingMode: 'hourly', hourlyPrice: 18, minimumCharge: 28 },
        { categoryKey: 'CLEANING', serviceKey: 'window-cleaning-interior', pricingMode: 'hourly', hourlyPrice: 18, minimumCharge: 36 },
        { categoryKey: 'CLEANING', serviceKey: 'window-cleaning-exterior-ground-floor', pricingMode: 'hourly', hourlyPrice: 20, minimumCharge: 40 },
        { categoryKey: 'CLEANING', serviceKey: 'bathroom-deep-clean', pricingMode: 'hourly', hourlyPrice: 20, minimumCharge: 40 },
        { categoryKey: 'CLEANING', serviceKey: 'kitchen-deep-clean', pricingMode: 'hourly', hourlyPrice: 22, minimumCharge: 54 },
        // PEST_CONTROL (14 services) — flat pricing
        { categoryKey: 'PEST_CONTROL', serviceKey: 'rat-mouse-treatment', pricingMode: 'hourly', hourlyPrice: 60, minimumCharge: 118 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'mice-treatment', pricingMode: 'hourly', hourlyPrice: 55, minimumCharge: 108 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'rat-treatment', pricingMode: 'hourly', hourlyPrice: 62, minimumCharge: 124 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'cockroach-treatment', pricingMode: 'hourly', hourlyPrice: 68, minimumCharge: 136 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'wasp-nest-removal', pricingMode: 'hourly', hourlyPrice: 44, minimumCharge: 88 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'ant-treatment', pricingMode: 'hourly', hourlyPrice: 44, minimumCharge: 88 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'flea-treatment', pricingMode: 'hourly', hourlyPrice: 61, minimumCharge: 122 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'bed-bug-treatment', pricingMode: 'hourly', hourlyPrice: 78, minimumCharge: 156 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'moth-treatment', pricingMode: 'hourly', hourlyPrice: 48, minimumCharge: 96 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'silverfish-treatment', pricingMode: 'hourly', hourlyPrice: 42, minimumCharge: 84 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'pigeon-proofing-inspection', pricingMode: 'hourly', hourlyPrice: 36, minimumCharge: 72 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'proofing-sealing-entry-points', pricingMode: 'hourly', hourlyPrice: 41, minimumCharge: 82 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'pest-follow-up-visit', pricingMode: 'hourly', hourlyPrice: 27, minimumCharge: 54 },
        { categoryKey: 'PEST_CONTROL', serviceKey: 'pest-survey-report', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 76 },
        // HANDYMAN (17 services)
        { categoryKey: 'HANDYMAN', serviceKey: 'tv-mounting', pricingMode: 'hourly', hourlyPrice: 40, minimumCharge: 79 },
        { categoryKey: 'HANDYMAN', serviceKey: 'mirror-picture-hanging', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 46 },
        { categoryKey: 'HANDYMAN', serviceKey: 'shelf-installation', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 48 },
        { categoryKey: 'HANDYMAN', serviceKey: 'shelf-curtain-fitting', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 54 },
        { categoryKey: 'HANDYMAN', serviceKey: 'tap-toilet-seat-replacement', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 58 },
        { categoryKey: 'HANDYMAN', serviceKey: 'curtain-blind-installation', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 54 },
        { categoryKey: 'HANDYMAN', serviceKey: 'door-handle-lock-replacement', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 48 },
        { categoryKey: 'HANDYMAN', serviceKey: 'cabinet-fixing', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 54 },
        { categoryKey: 'HANDYMAN', serviceKey: 'minor-plumbing-repair', pricingMode: 'hourly', hourlyPrice: 40, minimumCharge: 66 },
        { categoryKey: 'HANDYMAN', serviceKey: 'sealant-resealing', pricingMode: 'hourly', hourlyPrice: 32, minimumCharge: 49 },
        { categoryKey: 'HANDYMAN', serviceKey: 'minor-home-repairs', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 72 },
        { categoryKey: 'HANDYMAN', serviceKey: 'minor-wall-repair-filling', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 54 },
        { categoryKey: 'HANDYMAN', serviceKey: 'draft-excluder-sealing-work', pricingMode: 'hourly', hourlyPrice: 30, minimumCharge: 46 },
        { categoryKey: 'HANDYMAN', serviceKey: 'furniture-moving-within-property', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 58 },
        { categoryKey: 'HANDYMAN', serviceKey: 'flat-pack-adjustment', pricingMode: 'hourly', hourlyPrice: 30, minimumCharge: 46 },
        { categoryKey: 'HANDYMAN', serviceKey: 'light-fitting-replacement', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 58 },
        { categoryKey: 'HANDYMAN', serviceKey: 'smoke-alarm-installation', pricingMode: 'hourly', hourlyPrice: 28, minimumCharge: 40 },
        // FURNITURE_ASSEMBLY (15 services)
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'wardrobe-bed-assembly', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 78 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'bed-assembly', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 58 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'wardrobe-assembly', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 78 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'chest-of-drawers-assembly', pricingMode: 'hourly', hourlyPrice: 32, minimumCharge: 48 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'desk-storage-assembly', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 59 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'desk-assembly', pricingMode: 'hourly', hourlyPrice: 32, minimumCharge: 48 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'bookcase-assembly', pricingMode: 'hourly', hourlyPrice: 32, minimumCharge: 48 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'dining-table-assembly', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 54 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'chair-assembly', pricingMode: 'hourly', hourlyPrice: 25, minimumCharge: 28 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'nursery-furniture-assembly', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 58 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'ikea-assembly', pricingMode: 'hourly', hourlyPrice: 32, minimumCharge: 48 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'multiple-item-assembly', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 82 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'disassembly-reassembly', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 82 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'disassembly', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 58 },
        { categoryKey: 'FURNITURE_ASSEMBLY', serviceKey: 'assembly-wall-fixing', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 76 },
        // WASTE_REMOVAL (10 services)
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'bagged-household-waste', pricingMode: 'hourly', hourlyPrice: 40, minimumCharge: 64 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'general-household-waste-removal', pricingMode: 'hourly', hourlyPrice: 40, minimumCharge: 64 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'bulky-item-removal', pricingMode: 'hourly', hourlyPrice: 42, minimumCharge: 74 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'furniture-disposal', pricingMode: 'hourly', hourlyPrice: 42, minimumCharge: 74 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'property-clearance', pricingMode: 'hourly', hourlyPrice: 50, minimumCharge: 112 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'garage-shed-clearance', pricingMode: 'hourly', hourlyPrice: 48, minimumCharge: 102 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'office-clearance', pricingMode: 'hourly', hourlyPrice: 52, minimumCharge: 128 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'builders-waste-removal', pricingMode: 'hourly', hourlyPrice: 50, minimumCharge: 112 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'mattress-removal', pricingMode: 'hourly', hourlyPrice: 30, minimumCharge: 36 },
        { categoryKey: 'WASTE_REMOVAL', serviceKey: 'appliance-removal', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 54 },
        // GARDEN_MAINTENANCE (12 services)
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'lawn-mowing', pricingMode: 'hourly', hourlyPrice: 32, minimumCharge: 54 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'hedge-trimming', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 66 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'pruning', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 58 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'small-tree-trimming', pricingMode: 'hourly', hourlyPrice: 42, minimumCharge: 82 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'garden-tidy-up', pricingMode: 'hourly', hourlyPrice: 35, minimumCharge: 62 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'weeding', pricingMode: 'hourly', hourlyPrice: 28, minimumCharge: 48 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'leaf-clearance', pricingMode: 'hourly', hourlyPrice: 28, minimumCharge: 46 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'garden-waste-bagging', pricingMode: 'hourly', hourlyPrice: 25, minimumCharge: 36 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'seasonal-garden-maintenance', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 76 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'pressure-washing-patio-driveway', pricingMode: 'hourly', hourlyPrice: 42, minimumCharge: 82 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'fence-painting', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 82 },
        { categoryKey: 'GARDEN_MAINTENANCE', serviceKey: 'deck-cleaning', pricingMode: 'hourly', hourlyPrice: 38, minimumCharge: 72 },
      ],
      stripeAccountId: 'acct_mock_test_999',
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
    const existingQuoteRequests = await prisma.quoteRequest.findMany({
      where: { providerCompanyId: { in: existingActiveCompanyIds } },
      select: { id: true },
    });
    const existingQuoteRequestIds = existingQuoteRequests.map((q) => q.id);

    // Clean up bookings and their dependent records
    const existingBookings = await prisma.booking.findMany({
      where: { providerCompanyId: { in: existingActiveCompanyIds } },
      select: { id: true },
    });
    const existingBookingIds = existingBookings.map((b) => b.id);
    if (existingBookingIds.length) {
      await prisma.notificationLogV2.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.invoiceRecord.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.ledgerEntry.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.payoutRecord.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.disputeRecord.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.refundRecord.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.providerNotification.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.counterOffer.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.bookingAddon.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.jobAssignment.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.jobCancellation.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.complaint.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.job.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.refund.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.payment.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.paymentRecord.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.bookingPriceSnapshot.deleteMany({ where: { bookingId: { in: existingBookingIds } } });
      await prisma.booking.deleteMany({ where: { id: { in: existingBookingIds } } });
    }

    // Clean up quote-related records that reference providers
    if (existingQuoteRequestIds.length) {
      await prisma.quotePriceSnapshot.deleteMany({ where: { quoteRequestId: { in: existingQuoteRequestIds } } });
      await prisma.quoteOption.deleteMany({ where: { quoteRequestId: { in: existingQuoteRequestIds } } });
      await prisma.quoteRequest.deleteMany({ where: { id: { in: existingQuoteRequestIds } } });
    }

    await prisma.quoteOption.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerPricingRule.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.pricingAuditLog.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.pricingAreaOverride.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerCoverageArea.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.coverageChangeRequest.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerServiceCategory.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerAgreement.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerOnboardingDocument.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerEmailVerification.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerAuthToken.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.stripeConnectedAccount.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerAvailability.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerDateOverride.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
    await prisma.providerNotification.deleteMany({ where: { providerCompanyId: { in: existingActiveCompanyIds } } });
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
        specialtiesText: stringifyPublicProfileMetadata(prov.publicProfileMetadata || {}),
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
  console.log('  - ★ SUPER PROVIDER: AreaSorted Test Provider — ALL postcodes, ALL 6 categories, ALL 57 services');
  console.log('  - Login: test-provider@areasorted.test / Provider123!');
  console.log('  - Test postcode: any London postcode (e.g. SW1A 1AA, E1 6AN, HA5 2AH)');
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
