const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Example DNA Templates...');

  // 1. Roll-on Template
  const rollon = await prisma.productTemplate.upsert({
    where: { name: 'Standard Roll-on 50ml' },
    update: {},
    create: {
      name: 'Standard Roll-on 50ml',
      category: 'Roll-on',
      description: 'Standard 50ml roll-on deodorant process (4N Roll-on Line)',
      ingredientRatio: 0.048, // ~50ml
      idealSpeed: 45,        // 45 BPM
      targetOEE: 82,
      setupTimeMins: 45,
      templateBoms: {
        create: [
          { name: 'Bottle 50ml White', category: 'Bottle', qtyPerUnit: 1 },
          { name: 'Roll-on Ball 10mm', category: 'Other', qtyPerUnit: 1 },
          { name: 'Cap 50ml Blue', category: 'Cap', qtyPerUnit: 1 },
          { name: 'Sticker Front/Back', category: 'Sticker', qtyPerUnit: 2 }
        ]
      }
    }
  });

  // 2. Kalix Cream Template
  const kalix = await prisma.productTemplate.upsert({
    where: { name: 'Kalix Cream 200ml' },
    update: {},
    create: {
      name: 'Kalix Cream 200ml',
      category: 'Cream',
      description: 'Industrial cream filling on Kalix line (Standard 200ml)',
      ingredientRatio: 0.191, // 191g for 200ml
      idealSpeed: 35,        // 35 BPM
      targetOEE: 75,
      setupTimeMins: 60,
      templateBoms: {
        create: [
          { name: 'Aluminum Tube 200ml', category: 'Bottle', qtyPerUnit: 1 },
          { name: 'Cream Cap 25mm', category: 'Cap', qtyPerUnit: 1 },
          { name: 'Outer Carton 200ml', category: 'Carton', qtyPerUnit: 1 }
        ]
      }
    }
  });

  console.log('✅ Example Templates Created:', { rollon: rollon.name, kalix: kalix.name });
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
