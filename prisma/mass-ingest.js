const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('--- Mass Ingesting 800+ Products from Exhaustive Scrape ---');
  
  const scrapedPath = '../all_scraped_skus.txt';
  const intelPath = '../product_intelligence.json';
  
  if (!fs.existsSync(scrapedPath)) {
    console.error('Error: all_scraped_skus.txt not found.');
    return;
  }

  const scrapedContent = fs.readFileSync(scrapedPath, 'utf8');
  const intelData = fs.existsSync(intelPath) ? JSON.parse(fs.readFileSync(intelPath, 'utf8')) : {};

  const lines = scrapedContent.split('\n');
  let count = 0;

  for (const line of lines) {
    if (!line.includes('|')) continue;
    const [sku, name] = line.split('|').map(s => s.trim());
    
    if (!sku || sku === 'undefined') continue;

    const intel = intelData[sku] || {};

    try {
      await prisma.product.upsert({
        where: { skuCode: sku },
        update: {
          nameEn: name || 'Unnamed Product',
          compatibleLines: intel.compatible_lines || [],
          ingredientRatio: intel.bulk_ratio || 0
        },
        create: {
          skuCode: sku,
          nameEn: name || 'Unnamed Product',
          compatibleLines: intel.compatible_lines || [],
          ingredientRatio: intel.bulk_ratio || 0,
          uom: 'pcs'
        }
      });
      count++;
    } catch (e) {
      // console.error(`Error with SKU ${sku}:`, e.message);
    }
  }

  console.log(`--- Success: ${count} Products Synchronized with Database ---`);
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
