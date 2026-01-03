import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Veritabanı verilerini kontrol ediliyor...\n');

  // Organizasyonlar
  const orgs = await prisma.organizasyonGrup.findMany();
  console.log(`Organizasyonlar: ${orgs.length} adet`);
  orgs.forEach(org => {
    console.log(`  - ${org.name} (${org.slug}) - Aktif: ${org.isActive}`);
  });

  // Ofisler
  const offices = await prisma.ofisler.findMany();
  console.log(`\nOfisler: ${offices.length} adet`);
  offices.forEach(office => {
    console.log(`  - ${office.name} (${office.code})`);
  });

  // Salonlar
  const salons = await prisma.subeler.findMany();
  console.log(`\nSalonlar: ${salons.length} adet`);
  salons.forEach(salon => {
    console.log(`  - ${salon.name} (Ofis: ${salon.officeId})`);
  });

  // Zaman Dilimleri
  const timeSlots = await prisma.programSaatSlotlar_.findMany();
  console.log(`\nZaman Dilimleri: ${timeSlots.length} adet`);
  timeSlots.forEach(slot => {
    console.log(`  - ${slot.name} (${slot.startTime}-${slot.endTime})`);
  });

  // Kullanıcılar
  const users = await prisma.kullan_c_lar.findMany();
  console.log(`\nKullanıcılar: ${users.length} adet`);
  users.forEach(user => {
    console.log(`  - ${user.name} (${user.email})`);
  });
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

