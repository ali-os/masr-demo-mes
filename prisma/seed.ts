import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database with real factory data...')

  // 1. Departments
  const departments = [
    { code: 'PROD', nameEn: 'Production', nameAr: 'الإنتاج' },
    { code: 'QUAL', nameEn: 'Quality', nameAr: 'الجودة' },
    { code: 'MAIN', nameEn: 'Maintenance', nameAr: 'الصيانة' },
    { code: 'PLAN', nameEn: 'Planning', nameAr: 'التخطيط' },
    { code: 'STOR', nameEn: 'Stores', nameAr: 'المخازن' },
  ]

  for (const dept of departments) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: dept,
      create: dept,
    })
  }

  // 2. Roles
  const roles = [
    { code: 'ADMIN', name: 'Administrator' },
    { code: 'MANAGER', name: 'Manager' },
    { code: 'SUPERVISOR', name: 'Supervisor' },
    { code: 'OPERATOR', name: 'Operator' },
    { code: 'PLANNER', name: 'Planner' },
  ]

  for (const role of roles) {
    await prisma.role.upsert({
      where: { code: role.code },
      update: role,
      create: role,
    })
  }

  // 3. Lines
  const lines = [
    { code: 'F1', name: 'Production 1 (F1)' },
    { code: 'F2', name: 'Production 2 (F2)' },
  ]

  const lineRecords: any[] = []
  for (const line of lines) {
    const l = await prisma.line.upsert({
      where: { code: line.code },
      update: line,
      create: line,
    })
    lineRecords.push(l)
  }

  // 4. Machines
  const machines = [
    { machineCode: 'MC-F1-01', name: '1 Nozzle Cream', lineId: lineRecords[0].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F1-04', name: '4 Nozzle', lineId: lineRecords[0].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F1-KX', name: 'Kalix', lineId: lineRecords[0].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F1-RO', name: 'Roll-on', lineId: lineRecords[0].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F1-C1', name: 'Cream 1', lineId: lineRecords[0].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F1-C2', name: 'Cream 2', lineId: lineRecords[0].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F2-06', name: '6 Nozzle New', lineId: lineRecords[1].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F2-ND', name: 'Nordon', lineId: lineRecords[1].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F2-RT', name: 'Rotary', lineId: lineRecords[1].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F2-LB', name: 'Lip Balm', lineId: lineRecords[1].id, stationRole: 'FILLER' },
    { machineCode: 'MC-F2-PF', name: 'Perfume', lineId: lineRecords[1].id, stationRole: 'FILLER' },
  ]

  for (const machine of machines) {
    await prisma.machine.upsert({
      where: { machineCode: machine.machineCode },
      update: machine,
      create: machine,
    })
  }

  // 5. Loss Codes
  const lossCodes = [
    { code: 'MF-012', category: 'MF', subcategory: 'Valve', labelEn: 'Valve Leak', labelAr: 'تسريب صمام', oeeBucket: 'AVAILABILITY' },
    { code: 'ADJ-003', category: 'ADJ', subcategory: 'Sensor', labelEn: 'Sensor Re-alignment', labelAr: 'ضبط حساس', oeeBucket: 'PERFORMANCE' },
    { code: 'SU-001', category: 'ADJ', subcategory: 'Changeover', labelEn: 'Changeover', labelAr: 'تغيير صنف', oeeBucket: 'AVAILABILITY' },
    { code: 'WH-002', category: 'WH', subcategory: 'Materials', labelEn: 'Waiting Materials', labelAr: 'انتظار خامات', oeeBucket: 'AVAILABILITY' },
    { code: 'Q-001', category: 'Q', subcategory: 'Defect', labelEn: 'Defect Check', labelAr: 'فحص عيوب', oeeBucket: 'QUALITY' },
  ]

  for (const lc of lossCodes) {
    await prisma.lossCode.upsert({
      where: { code: lc.code },
      update: lc,
      create: lc,
    })
  }

  console.log('Seed completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
