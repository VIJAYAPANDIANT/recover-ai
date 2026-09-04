import { seedDemoDataset } from '../src/services/seedService.js';
import prisma from '../src/utils/prisma.js';

async function main() {
  console.log('🌱 Seeding RecoverAI database with 500 payment records...');
  const result = await seedDemoDataset();
  console.log(`✅ ${result.message} (${result.payments} records)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
