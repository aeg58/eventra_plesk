import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Rezervasyonlar kontrol ediliyor...\n');

  // Tüm rezervasyonları getir
  const reservations = await prisma.reservation.findMany({
    include: {
      ReservationDynamicValues: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`Toplam Rezervasyon: ${reservations.length} adet\n`);

  // Kaynak ID'si olmayan rezervasyonları bul
  const reservationsWithoutKaynak = reservations.filter(r => !r.kaynakId);
  console.log(`Kaynak ID'si OLMAYAN rezervasyonlar: ${reservationsWithoutKaynak.length} adet\n`);

  if (reservationsWithoutKaynak.length > 0) {
    console.log('Kaynak ID\'si olmayan rezervasyonlar:');
    reservationsWithoutKaynak.forEach((res, index) => {
      console.log(`\n${index + 1}. Rezervasyon No: ${res.rezervasyonNo}`);
      console.log(`   ID: ${res.id}`);
      console.log(`   Durum: ${res.durum}`);
      console.log(`   Tarih: ${res.rezervasyonTarihi}`);
      console.log(`   Kaynak ID: ${res.kaynakId || 'YOK'}`);
      
      // Dinamik form değerlerinde "oneren" veya "kaynak" var mı kontrol et
      const onerenValue = res.ReservationDynamicValues?.find(v => 
        v.fieldKey === 'oneren' || 
        v.fieldKey === 'kaynak' ||
        v.fieldKey?.toLowerCase().includes('kaynak') ||
        v.fieldKey?.toLowerCase().includes('oneren')
      );
      
      if (onerenValue) {
        console.log(`   Dinamik Form Değeri: ${onerenValue.fieldKey} = ${onerenValue.fieldValue}`);
      }
    });
  }

  // Tüm kaynakları önce çek
  const allKaynaklar = await prisma.rezervasyonKaynak.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: 'asc' },
  });

  // Kaynak ID'si olan rezervasyonları göster
  const reservationsWithKaynak = reservations.filter(r => r.kaynakId);
  console.log(`\n\nKaynak ID'si OLAN rezervasyonlar: ${reservationsWithKaynak.length} adet\n`);

  if (reservationsWithKaynak.length > 0) {
    // Kaynak bilgilerini grupla
    const kaynakCounts: Record<string, { name: string; count: number }> = {};
    
    reservationsWithKaynak.forEach(res => {
      if (res.kaynakId) {
        const kaynak = allKaynaklar.find(k => k.id === res.kaynakId);
        const kaynakName = kaynak?.name || 'Bilinmeyen';
        if (!kaynakCounts[res.kaynakId]) {
          kaynakCounts[res.kaynakId] = { name: kaynakName, count: 0 };
        }
        kaynakCounts[res.kaynakId].count++;
      }
    });

    console.log('Kaynak dağılımı:');
    Object.entries(kaynakCounts).forEach(([id, data]) => {
      console.log(`  - ${data.name} (${id}): ${data.count} rezervasyon`);
    });
  }

  // Tüm kaynakları listele
  console.log('\n\nTüm Kaynaklar:');
  allKaynaklar.forEach(kaynak => {
    const count = reservations.filter(r => r.kaynakId === kaynak.id).length;
    console.log(`  - ${kaynak.name} (${kaynak.id}): ${count} rezervasyon`);
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

