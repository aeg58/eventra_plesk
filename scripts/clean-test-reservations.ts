import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestReservations() {
  try {
    console.log('Test rezervasyonları temizleniyor...');
    
    // REZ-2025- ve REZ-2026- ile başlayan rezervasyonları sil
    const testReservations = await prisma.reservation.findMany({
      where: {
        rezervasyonNo: {
          startsWith: 'REZ-2025-',
        },
      },
    });

    const testReservations2026 = await prisma.reservation.findMany({
      where: {
        rezervasyonNo: {
          startsWith: 'REZ-2026-',
        },
      },
    });

    const allTestReservations = [...testReservations, ...testReservations2026];

    for (const reservation of allTestReservations) {
      await prisma.reservation.delete({
        where: { id: reservation.id },
      });
      console.log(`✓ Silindi: ${reservation.rezervasyonNo}`);
    }

    console.log(`✓ Toplam ${allTestReservations.length} test rezervasyonu silindi`);
  } catch (error: any) {
    console.error('Hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestReservations();

