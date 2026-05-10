import prisma from '@/lib/db';

async function main() {
  console.log('--- Initializing System Users & Roles (DOCX Alignment) ---');
  
  // 1. Create Roles
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: 'System Administrator' }
  });

  await prisma.role.upsert({
    where: { code: 'OPERATOR' },
    update: {},
    create: { code: 'OPERATOR', name: 'Line Operator' }
  });

  // 2. Create Department
  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { code: 'IT', nameEn: 'IT & Digital', nameAr: 'تكنولوجيا المعلومات' }
  });

  // 3. Create System User for Auditing
  if (adminRole && itDept) {
    const systemUser = await prisma.user.upsert({
      where: { username: 'SYSTEM' },
      update: {},
      create: {
        username: 'SYSTEM',
        email: 'system@mes.local',
        name: 'Automated System',
        passwordHash: '',
        roleId: adminRole.id,
        departmentId: itDept.id
      }
    });
    console.log('System User Initialized ID:', systemUser.id);
  }
}

main().catch(e => console.error(e));
