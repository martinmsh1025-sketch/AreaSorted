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
    { key: 'marketplace.commission_percent', valueJson: { value: 18 }, description: 'Default platform commission percent' },
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
