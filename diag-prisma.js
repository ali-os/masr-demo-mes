const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const products = await prisma.product.findMany({ take: 5 });
    console.log('SUCCESS: Products found:', products.length);
    console.log(JSON.stringify(products, null, 2));
  } catch (e) {
    console.error('ERROR: Prisma query failed. This is why the API is returning an error.');
    console.error(e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
