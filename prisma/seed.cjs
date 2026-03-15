const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

  const settings = [
    {
      key: 'marketplace.charge_model',
      valueJson: { value: 'direct_charges' },
      description: 'Default Stripe Connect charge model',
    },
    {
      key: 'marketplace.invoice_strategy',
      valueJson: { value: 'provider_service_plus_platform_fee_receipt' },
      description: 'Default invoice ownership strategy',
    },
    {
      key: 'marketplace.booking_fee',
      valueJson: { value: 12 },
      description: 'Default booking fee in GBP',
    },
    {
      key: 'marketplace.commission_percent',
      valueJson: { value: 18 },
      description: 'Default platform commission percent',
    },
    {
      key: 'marketplace.payout_hold_days',
      valueJson: { value: 7 },
      description: 'Default hold period before provider payout',
    },
  ];

  for (const setting of settings) {
    await prisma.adminSetting.upsert({
      where: { key: setting.key },
      update: {
        valueJson: setting.valueJson,
        description: setting.description,
      },
      create: setting,
    });
  }

  const providerRole = await prisma.role.findUnique({ where: { key: 'PROVIDER' } });

  const providerUser = await prisma.user.upsert({
    where: { email: process.env.SEED_PROVIDER_EMAIL || 'provider@example.com' },
    update: {},
    create: {
      email: process.env.SEED_PROVIDER_EMAIL || 'provider@example.com',
      isActive: true,
    },
  });

  if (providerRole) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: providerUser.id,
          roleId: providerRole.id,
        },
      },
      update: {},
      create: {
        userId: providerUser.id,
        roleId: providerRole.id,
      },
    });
  }

  const providerCompany = await prisma.providerCompany.upsert({
    where: { companyNumber: 'AS-DEMO-001' },
    update: {
      userId: providerUser.id,
      legalName: 'AreaSorted Demo Provider Ltd',
      tradingName: 'Demo Provider',
      registeredAddress: '1 Demo Street, London',
      contactEmail: process.env.SEED_PROVIDER_EMAIL || 'provider@example.com',
      phone: '02000000000',
      status: 'PROFILE_STARTED',
    },
    create: {
      userId: providerUser.id,
      legalName: 'AreaSorted Demo Provider Ltd',
      tradingName: 'Demo Provider',
      companyNumber: 'AS-DEMO-001',
      registeredAddress: '1 Demo Street, London',
      contactEmail: process.env.SEED_PROVIDER_EMAIL || 'provider@example.com',
      phone: '02000000000',
      status: 'PROFILE_STARTED',
    },
  });

  await prisma.providerInvite.upsert({
    where: { token: 'demo-provider-invite-token' },
    update: {
      email: process.env.SEED_PROVIDER_EMAIL || 'provider@example.com',
      providerCompanyId: providerCompany.id,
    },
    create: {
      email: process.env.SEED_PROVIDER_EMAIL || 'provider@example.com',
      token: 'demo-provider-invite-token',
      expiresAt: new Date('2027-01-01T00:00:00.000Z'),
      acceptedAt: new Date(),
      providerCompanyId: providerCompany.id,
    },
  });

  const pricingSeedRows = [
    {
      categoryKey: 'CLEANING',
      serviceKey: 'regular-home-cleaning',
      pricingMode: 'hourly',
      hourlyPrice: '16.00',
      minimumCharge: '48.00',
      travelFee: '8.00',
      sameDayUplift: '18.00',
      weekendUplift: '12.00',
    },
    {
      categoryKey: 'HANDYMAN',
      serviceKey: 'minor-home-repairs',
      pricingMode: 'hourly',
      hourlyPrice: '26.00',
      minimumCharge: '78.00',
      travelFee: '10.00',
      sameDayUplift: '24.00',
      weekendUplift: '18.00',
    },
  ];

  for (const row of pricingSeedRows) {
    await prisma.providerPricingRule.upsert({
      where: {
        providerCompanyId_categoryKey_serviceKey: {
          providerCompanyId: providerCompany.id,
          categoryKey: row.categoryKey,
          serviceKey: row.serviceKey,
        },
      },
      update: row,
      create: {
        providerCompanyId: providerCompany.id,
        active: true,
        customQuoteRequired: false,
        ...row,
      },
    });
  }

  const incompleteUser = await prisma.user.upsert({
    where: { email: 'provider-incomplete@example.com' },
    update: {},
    create: {
      email: 'provider-incomplete@example.com',
      isActive: true,
    },
  });

  if (providerRole) {
    await prisma.userRoleAssignment.upsert({
      where: {
        userId_roleId: {
          userId: incompleteUser.id,
          roleId: providerRole.id,
        },
      },
      update: {},
      create: {
        userId: incompleteUser.id,
        roleId: providerRole.id,
      },
    });
  }

  await prisma.providerCompany.upsert({
    where: { companyNumber: 'AS-DEMO-002' },
    update: {
      userId: incompleteUser.id,
      legalName: 'AreaSorted Incomplete Provider Ltd',
      tradingName: 'Incomplete Provider',
      registeredAddress: '2 Missing Street, London',
      contactEmail: 'provider-incomplete@example.com',
      phone: '02000000001',
      status: 'PROFILE_STARTED',
      paymentReady: false,
    },
    create: {
      userId: incompleteUser.id,
      legalName: 'AreaSorted Incomplete Provider Ltd',
      tradingName: 'Incomplete Provider',
      companyNumber: 'AS-DEMO-002',
      registeredAddress: '2 Missing Street, London',
      contactEmail: 'provider-incomplete@example.com',
      phone: '02000000001',
      status: 'PROFILE_STARTED',
      paymentReady: false,
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
