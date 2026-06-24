import { PrismaClient, RoleType, PlanType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting NEXUS VAULT database seed...');

  // ─────────────────────────────────────────────────────────────────────────
  // 1. SUPER-ADMIN TENANT
  // ─────────────────────────────────────────────────────────────────────────
  const superTenant = await prisma.tenant.upsert({
    where: { slug: 'nexusvault-system' },
    update: {},
    create: {
      name: 'NEXUS VAULT System',
      slug: 'nexusvault-system',
      plan: PlanType.ENTERPRISE,
      isActive: true,
      maxStorage: BigInt(107374182400), // 100 GB
    },
  });
  console.log(`✅ Super-admin tenant created: ${superTenant.name} (${superTenant.id})`);

  // ─────────────────────────────────────────────────────────────────────────
  // 2. SUPER-ADMIN USER
  //    NOTE: firebaseUid must be replaced with a real Firebase UID before use.
  //    This seed uses a placeholder so migrations can run without Firebase.
  // ─────────────────────────────────────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { uid: 'SEED_SUPER_ADMIN_FIREBASE_UID' },
    update: {},
    create: {
      uid: 'SEED_SUPER_ADMIN_FIREBASE_UID',
      tenantId: superTenant.id,
      email: 'superadmin@nexusvault.internal',
      displayName: 'Super Admin',
      role: RoleType.SUPER_ADMIN,
      isActive: true,
    },
  });
  console.log(`✅ Super admin user created: ${superAdmin.email} (${superAdmin.id})`);

  // ─────────────────────────────────────────────────────────────────────────
  // 3. DEMO TENANT
  // ─────────────────────────────────────────────────────────────────────────
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo-university' },
    update: {},
    create: {
      name: 'Demo University',
      slug: 'demo-university',
      plan: PlanType.PROFESSIONAL,
      isActive: true,
      maxStorage: BigInt(53687091200), // 50 GB
    },
  });
  console.log(`✅ Demo tenant created: ${demoTenant.name} (${demoTenant.id})`);

  // ─────────────────────────────────────────────────────────────────────────
  // 4. DEMO ORGANIZATIONS
  // ─────────────────────────────────────────────────────────────────────────
  const collegeOfMedicine = await prisma.organization.upsert({
    where: { id: 'org-college-of-medicine' },
    update: {},
    create: {
      id: 'org-college-of-medicine',
      tenantId: demoTenant.id,
      name: 'College of Medicine',
      description: 'Faculty and students of the medical program',
    },
  });

  const deptRadiology = await prisma.organization.upsert({
    where: { id: 'org-dept-radiology' },
    update: {},
    create: {
      id: 'org-dept-radiology',
      tenantId: demoTenant.id,
      name: 'Department of Radiology',
      description: 'Radiology sub-department',
      parentId: collegeOfMedicine.id,
    },
  });
  console.log(`✅ Organizations created: ${collegeOfMedicine.name}, ${deptRadiology.name}`);

  // ─────────────────────────────────────────────────────────────────────────
  // 5. DEMO USERS
  // ─────────────────────────────────────────────────────────────────────────
  const demoUsers = [
    {
      uid: 'SEED_DEMO_ADMIN_FIREBASE_UID',
      email: 'admin@demo-university.edu',
      displayName: 'Demo Admin',
      role: RoleType.ADMIN,
      organizationId: collegeOfMedicine.id,
    },
    {
      uid: 'SEED_DEMO_INSTRUCTOR_FIREBASE_UID',
      email: 'prof.smith@demo-university.edu',
      displayName: 'Prof. Jane Smith',
      role: RoleType.INSTRUCTOR,
      organizationId: deptRadiology.id,
    },
    {
      uid: 'SEED_DEMO_SUPERVISOR_FIREBASE_UID',
      email: 'supervisor@demo-university.edu',
      displayName: 'Supervisor Rodriguez',
      role: RoleType.SUPERVISOR,
      organizationId: deptRadiology.id,
    },
    {
      uid: 'SEED_DEMO_STUDENT_1_FIREBASE_UID',
      email: 'student.alice@demo-university.edu',
      displayName: 'Alice Johnson',
      role: RoleType.STUDENT,
      organizationId: deptRadiology.id,
    },
    {
      uid: 'SEED_DEMO_STUDENT_2_FIREBASE_UID',
      email: 'student.bob@demo-university.edu',
      displayName: 'Bob Martinez',
      role: RoleType.STUDENT,
      organizationId: deptRadiology.id,
    },
  ];

  const createdUsers: Record<string, string> = {};

  for (const userData of demoUsers) {
    const user = await prisma.user.upsert({
      where: { uid: userData.uid },
      update: {},
      create: {
        ...userData,
        tenantId: demoTenant.id,
        isActive: true,
      },
    });
    createdUsers[userData.uid] = user.id;
    console.log(`  👤 User created: ${user.displayName} (${user.role})`);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // 6. SEED AUDIT LOG — initial system event
  // ─────────────────────────────────────────────────────────────────────────
  await prisma.auditLog.create({
    data: {
      tenantId: superTenant.id,
      userId: superAdmin.uid,
      userEmail: superAdmin.email,
      action: 'SYSTEM_SEED',
      resource: 'database',
      method: 'SEED',
      ipAddress: '127.0.0.1',
      userAgent: 'prisma-seed-script',
      statusCode: 200,
      durationMs: 0,
      metadata: {
        note: 'Database seeded by prisma/seed.ts',
        tenantsCreated: 2,
        usersCreated: 1 + demoUsers.length,
      },
    },
  });
  console.log('✅ Initial audit log entry recorded');

  // ─────────────────────────────────────────────────────────────────────────
  // 7. SEED NOTIFICATIONS for demo users
  // ─────────────────────────────────────────────────────────────────────────
  const adminUserId = createdUsers['SEED_DEMO_ADMIN_FIREBASE_UID'];
  if (adminUserId) {
    await prisma.notification.create({
      data: {
        userId: adminUserId,
        type: 'SYSTEM',
        title: 'Welcome to NEXUS VAULT',
        message: 'Your environment is ready. Configure your Firebase credentials to begin.',
        isRead: false,
      },
    });
    console.log('✅ Welcome notification created for demo admin');
  }

  console.log('\n🚀 Seed complete! Summary:');
  console.log(`   Tenants  : 2 (system + demo)`);
  console.log(`   Orgs     : 2`);
  console.log(`   Users    : ${1 + demoUsers.length}`);
  console.log(`\n⚠️  IMPORTANT: Replace SEED_*_FIREBASE_UID placeholders with real Firebase UIDs.`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
