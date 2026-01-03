import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Rezervasyon kaynak ID\'leri düzeltiliyor...\n');

  // Tüm rezervasyonları getir
  const reservations = await prisma.reservation.findMany({
    include: {
      ReservationDynamicValues: true,
    },
  });

  console.log(`Toplam Rezervasyon: ${reservations.length} adet\n`);

  // Kaynak ID'si olmayan rezervasyonları bul
  const reservationsWithoutKaynak = reservations.filter(r => !r.kaynakId);
  console.log(`Kaynak ID'si olmayan rezervasyonlar: ${reservationsWithoutKaynak.length} adet\n`);

  let updatedCount = 0;
  let errorCount = 0;

  for (const reservation of reservationsWithoutKaynak) {
    // Dinamik form değerlerinde "oneren" veya "kaynak" var mı kontrol et
    const onerenValue = reservation.ReservationDynamicValues?.find(v => 
      v.fieldKey === 'oneren' || 
      v.fieldKey === 'kaynak' ||
      v.fieldKey?.toLowerCase().includes('kaynak') ||
      v.fieldKey?.toLowerCase().includes('oneren')
    );

    if (onerenValue?.fieldValue) {
      const kaynakId = onerenValue.fieldValue.trim();
      
      // Kaynak ID'sinin geçerli olup olmadığını kontrol et
      const kaynak = await prisma.rezervasyonKaynak.findUnique({
        where: { id: kaynakId },
      });

      if (kaynak) {
        try {
          // Rezervasyonu güncelle
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: {
              kaynakId: kaynakId,
              updatedAt: new Date(),
            },
          });

          console.log(`✓ ${reservation.rezervasyonNo}: Kaynak ID eklendi (${kaynak.name})`);
          updatedCount++;
        } catch (error: any) {
          console.error(`✗ ${reservation.rezervasyonNo}: Güncelleme hatası - ${error.message}`);
          errorCount++;
        }
      } else {
        console.warn(`⚠ ${reservation.rezervasyonNo}: Geçersiz kaynak ID (${kaynakId})`);
        errorCount++;
      }
    } else {
      console.warn(`⚠ ${reservation.rezervasyonNo}: Dinamik form değerinde kaynak bilgisi yok`);
    }
  }

  console.log(`\n\nÖzet:`);
  console.log(`  ✓ Güncellenen: ${updatedCount} rezervasyon`);
  console.log(`  ✗ Hata/Alan: ${errorCount} rezervasyon`);
  console.log(`  Toplam: ${reservationsWithoutKaynak.length} rezervasyon`);
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

