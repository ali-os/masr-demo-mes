const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Seeding Product Intelligence (Constraints & Ratios) ---');
  
  const intelPath = '../product_intelligence.json';
  if (!fs.existsSync(intelPath)) {
    console.error('Error: product_intelligence.json not found. Run extract_intel.py first.');
    return;
  }

  const intelData = JSON.parse(fs.readFileSync(intelPath, 'utf8'));

  for (const [sku, data] of Object.entries(intelData)) {
    try {
      await prisma.product.update({
        where: { skuCode: sku },
        data: {
          compatibleLines: data.compatible_lines,
          ingredientRatio: data.bulk_ratio
        }
      });
      console.log(`Updated SKU: ${sku} | Lines: ${data.compatible_lines.join(', ')} | Ratio: ${data.bulk_ratio}`);
    } catch (e) {
      // If product doesn't exist, skip (might not be in DB yet)
    }
  }

  console.log('--- Success: System Intelligence Layer Primed ---');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
