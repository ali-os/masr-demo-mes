const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Initializing System Users & Roles ---');
  
  const adminRole = await prisma.role.upsert({
    where: { code: 'ADMIN' },
    update: {},
    create: { code: 'ADMIN', name: 'System Administrator' }
  });

  const itDept = await prisma.department.upsert({
    where: { code: 'IT' },
    update: {},
    create: { code: 'IT', nameEn: 'IT & Digital', nameAr: 'تكنولوجيا المعلومات' }
  });

  const systemUser = await prisma.user.upsert({
    where: { username: 'SYSTEM' },
    update: {},
    create: {
      username: 'SYSTEM',
      name: 'Automated System',
      roleId: adminRole.id,
      departmentId: itDept.id
    }
  });
  
  console.log('Success: System User Created ID:', systemUser.id);
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
