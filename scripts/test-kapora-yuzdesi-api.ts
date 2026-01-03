import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testKaporaYuzdesiAPI() {
  try {
    console.log('🧪 Kapora yüzdesi API testi...\n');

    // 1. Mevcut ayarı kontrol et
    console.log('1️⃣ Mevcut kapora yüzdesi kontrol ediliyor...');
    let settings = await prisma.reservationSettings.findFirst();
    
    if (settings) {
      console.log('   📊 Mevcut yüzde:', settings.kaporaYuzdesi, '%');
    } else {
      console.log('   ⚠️  Ayar bulunamadı, oluşturuluyor...');
      settings = await prisma.reservationSettings.create({
        data: {
          id: 'reservation_settings_1',
          kaporaYuzdesi: 20.00,
        },
      });
      console.log('   ✅ Ayar oluşturuldu:', settings.kaporaYuzdesi, '%');
    }

    // 2. Yüzdeyi güncelle (25%)
    console.log('\n2️⃣ Kapora yüzdesi güncelleniyor (25%)...');
    settings = await prisma.reservationSettings.update({
      where: { id: settings.id },
      data: { kaporaYuzdesi: 25.00 },
    });
    console.log('   ✅ Yüzde güncellendi:', settings.kaporaYuzdesi, '%');

    // 3. Tekrar güncelle (30%)
    console.log('\n3️⃣ Kapora yüzdesi tekrar güncelleniyor (30%)...');
    settings = await prisma.reservationSettings.update({
      where: { id: settings.id },
      data: { kaporaYuzdesi: 30.00 },
    });
    console.log('   ✅ Yüzde güncellendi:', settings.kaporaYuzdesi, '%');

    // 4. Son değeri kontrol et
    console.log('\n4️⃣ Son değer kontrol ediliyor...');
    const finalSettings = await prisma.reservationSettings.findFirst();
    if (finalSettings) {
      console.log('   ✅ Son yüzde:', finalSettings.kaporaYuzdesi, '%');
      if (parseFloat(String(finalSettings.kaporaYuzdesi)) === 30) {
        console.log('   ✅ Değer doğru!');
      } else {
        throw new Error('Yüzde değeri beklenen değerle eşleşmiyor!');
      }
    } else {
      throw new Error('Ayar bulunamadı!');
    }

    // 5. Yüzdeyi 20'ye geri al (varsayılan)
    console.log('\n5️⃣ Kapora yüzdesi varsayılana döndürülüyor (20%)...');
    settings = await prisma.reservationSettings.update({
      where: { id: settings.id },
      data: { kaporaYuzdesi: 20.00 },
    });
    console.log('   ✅ Yüzde varsayılana döndürüldü:', settings.kaporaYuzdesi, '%');

    console.log('\n✅ Tüm testler başarılı!');
    console.log('🎉 Kapora yüzdesi API çalışıyor!');

  } catch (error: any) {
    console.error('❌ Test hatası:', error);
    console.error('   Hata detayı:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testKaporaYuzdesiAPI()
  .then(() => {
    console.log('\n🎉 Test tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test başarısız:', error);
    process.exit(1);
  });

