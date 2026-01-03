import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testKaporaAPIDirect() {
  try {
    console.log('🧪 Kapora API direkt testi...\n');

    // 1. Prisma client'ın reservationSettings modeline erişebildiğini kontrol et
    console.log('1️⃣ Prisma client kontrolü...');
    try {
      const testSettings = await prisma.reservationSettings.findFirst();
      console.log('   ✅ Prisma client çalışıyor');
      if (testSettings) {
        console.log('   📊 Mevcut ayar:', testSettings);
      } else {
        console.log('   ⚠️  Ayar bulunamadı');
      }
    } catch (prismaError: any) {
      console.error('   ❌ Prisma hatası:', prismaError.message);
      console.error('   📋 Hata kodu:', prismaError.code);
      throw prismaError;
    }

    // 2. Upsert testi
    console.log('\n2️⃣ Upsert testi (25%)...');
    try {
      const upsertResult = await prisma.reservationSettings.upsert({
        where: { id: 'reservation_settings_1' },
        update: { kaporaYuzdesi: 25.00 },
        create: {
          id: 'reservation_settings_1',
          kaporaYuzdesi: 25.00,
        },
      });
      console.log('   ✅ Upsert başarılı:', upsertResult);
    } catch (upsertError: any) {
      console.error('   ❌ Upsert hatası:', upsertError.message);
      console.error('   📋 Hata kodu:', upsertError.code);
      
      // Manuel güncelleme dene
      console.log('   🔄 Manuel güncelleme deneniyor...');
      const existing = await prisma.reservationSettings.findFirst();
      if (existing) {
        const updateResult = await prisma.reservationSettings.update({
          where: { id: existing.id },
          data: { kaporaYuzdesi: 25.00 },
        });
        console.log('   ✅ Manuel güncelleme başarılı:', updateResult);
      } else {
        const createResult = await prisma.reservationSettings.create({
          data: {
            id: 'reservation_settings_1',
            kaporaYuzdesi: 25.00,
          },
        });
        console.log('   ✅ Manuel oluşturma başarılı:', createResult);
      }
    }

    // 3. Tekrar güncelleme testi
    console.log('\n3️⃣ Güncelleme testi (30%)...');
    const finalSettings = await prisma.reservationSettings.findFirst();
    if (finalSettings) {
      const updateResult = await prisma.reservationSettings.update({
        where: { id: finalSettings.id },
        data: { kaporaYuzdesi: 30.00 },
      });
      console.log('   ✅ Güncelleme başarılı:', updateResult);
    }

    // 4. Son kontrol
    console.log('\n4️⃣ Son değer kontrolü...');
    const checkSettings = await prisma.reservationSettings.findFirst();
    if (checkSettings) {
      console.log('   ✅ Son yüzde:', checkSettings.kaporaYuzdesi, '%');
    }

    // 5. Varsayılana döndür
    console.log('\n5️⃣ Varsayılana döndürülüyor (20%)...');
    if (checkSettings) {
      await prisma.reservationSettings.update({
        where: { id: checkSettings.id },
        data: { kaporaYuzdesi: 20.00 },
      });
      console.log('   ✅ Varsayılana döndürüldü');
    }

    console.log('\n✅ Tüm testler başarılı!');

  } catch (error: any) {
    console.error('\n❌ Test hatası:', error);
    console.error('   📋 Hata mesajı:', error.message);
    console.error('   📋 Hata kodu:', error.code);
    console.error('   📋 Stack:', error.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testKaporaAPIDirect()
  .then(() => {
    console.log('\n🎉 Test tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test başarısız:', error);
    process.exit(1);
  });

