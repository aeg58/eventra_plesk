import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testKaporaFlow() {
  try {
    console.log('🧪 Kapora akışı test ediliyor...\n');

    // 1. Kapora yüzdesini test et
    console.log('1️⃣ Kapora yüzdesi ayarları test ediliyor...');
    let settings = await prisma.reservationSettings.findFirst();
    
    if (!settings) {
      console.log('   ⚠️  Ayar bulunamadı, oluşturuluyor...');
      settings = await prisma.reservationSettings.create({
        data: {
          id: 'reservation_settings_1',
          kaporaYuzdesi: 25.00,
        },
      });
      console.log('   ✅ Ayar oluşturuldu:', settings);
    } else {
      console.log('   ✅ Mevcut ayar:', settings);
      // Güncelle
      settings = await prisma.reservationSettings.update({
        where: { id: settings.id },
        data: { kaporaYuzdesi: 30.00 },
      });
      console.log('   ✅ Ayar güncellendi:', settings);
    }

    // 2. Test rezervasyonu için müşteri bul veya oluştur
    console.log('\n2️⃣ Test müşterisi kontrol ediliyor...');
    let customer = await prisma.customer.findFirst({
      where: { email: 'test-kapora@example.com' },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          id: `customer_test_${Date.now()}`,
          adSoyad: 'Test Kapora Müşteri',
          email: 'test-kapora@example.com',
          telefon: '5551234567',
        },
      });
      console.log('   ✅ Test müşterisi oluşturuldu:', customer.id);
    } else {
      console.log('   ✅ Mevcut müşteri kullanılıyor:', customer.id);
    }

    // 3. Aktif kasa bul
    console.log('\n3️⃣ Aktif kasa kontrol ediliyor...');
    const cashBox = await prisma.cashBox.findFirst({
      where: { isActive: true },
    });

    if (!cashBox) {
      console.log('   ❌ Aktif kasa bulunamadı! Test için kasa oluşturuluyor...');
      const newCashBox = await prisma.cashBox.create({
        data: {
          id: `cashbox_test_${Date.now()}`,
          kasaAdi: 'Test Kasa',
          tur: 'Nakit',
          dovizCinsi: 'TL',
          acilisBakiyesi: 0,
          isActive: true,
        },
      });
      console.log('   ✅ Test kasası oluşturuldu:', newCashBox.id);
      // Test rezervasyonu oluştur
      const reservation = await prisma.reservation.create({
        data: {
          id: `reservation_test_${Date.now()}`,
          rezervasyonNo: `TEST-${Date.now()}`,
          customerId: customer.id,
          durum: 'Açık',
          sozlesmeFiyati: 10000.00,
          rezervasyonTarihi: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('   ✅ Test rezervasyonu oluşturuldu:', reservation.id);

      // Kapora ödemesi oluştur
      const kaporaTutari = 3000.00; // %30
      const payment = await prisma.payments.create({
        data: {
          id: `payment_test_${Date.now()}`,
          reservationId: reservation.id,
          cashBoxId: newCashBox.id,
          amount: kaporaTutari,
          paymentDate: new Date(),
          paymentMethod: 'Nakit',
          notes: 'Kapora - Test ödemesi',
          isCancelled: false,
        },
      });
      console.log('   ✅ Kapora ödemesi oluşturuldu:', payment.id);

      // Kasa işlemi
      await prisma.cashBoxTransaction.create({
        data: {
          id: `transaction_test_${Date.now()}`,
          cashBoxId: newCashBox.id,
          reservationId: reservation.id,
          islemTuru: 'Gelir',
          tutar: kaporaTutari,
          aciklama: `Rezervasyon kapora ödemesi: ${reservation.rezervasyonNo}`,
          tarih: new Date(),
          yeniBakiye: kaporaTutari,
          createdAt: new Date(),
        },
      });
      console.log('   ✅ Kasa işlemi kaydedildi');

      // Test tamamlandı, temizlik
      console.log('\n🧹 Test verileri temizleniyor...');
      await prisma.cashBoxTransaction.deleteMany({
        where: { reservationId: reservation.id },
      });
      await prisma.payments.deleteMany({
        where: { reservationId: reservation.id },
      });
      await prisma.reservation.delete({
        where: { id: reservation.id },
      });
      await prisma.cashBox.delete({
        where: { id: newCashBox.id },
      });
      console.log('   ✅ Test verileri temizlendi');

      console.log('\n✅ Tüm testler başarılı!');
    } else {
      console.log('   ✅ Aktif kasa bulundu:', cashBox.id);
      
      // Test rezervasyonu oluştur
      const reservation = await prisma.reservation.create({
        data: {
          id: `reservation_test_${Date.now()}`,
          rezervasyonNo: `TEST-${Date.now()}`,
          customerId: customer.id,
          durum: 'Açık',
          sozlesmeFiyati: 10000.00,
          rezervasyonTarihi: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('   ✅ Test rezervasyonu oluşturuldu:', reservation.id);

      // Kapora ödemesi oluştur (%30)
      const kaporaTutari = 3000.00;
      const payment = await prisma.payments.create({
        data: {
          id: `payment_test_${Date.now()}`,
          reservationId: reservation.id,
          cashBoxId: cashBox.id,
          amount: kaporaTutari,
          paymentDate: new Date(),
          paymentMethod: 'Nakit',
          notes: 'Kapora - Test ödemesi',
          isCancelled: false,
        },
      });
      console.log('   ✅ Kapora ödemesi oluşturuldu:', payment.id);

      // Kasa bakiyesini güncelle
      const lastTransaction = await prisma.cashBoxTransaction.findFirst({
        where: { cashBoxId: cashBox.id },
        orderBy: { tarih: 'desc' },
      });

      const lastBalance = lastTransaction
        ? parseFloat(String(lastTransaction.yeniBakiye))
        : parseFloat(String(cashBox.acilisBakiyesi || 0));

      const newBalance = lastBalance + kaporaTutari;

      await prisma.cashBoxTransaction.create({
        data: {
          id: `transaction_test_${Date.now()}`,
          cashBoxId: cashBox.id,
          reservationId: reservation.id,
          islemTuru: 'Gelir',
          tutar: kaporaTutari,
          aciklama: `Rezervasyon kapora ödemesi: ${reservation.rezervasyonNo}`,
          tarih: new Date(),
          yeniBakiye: newBalance,
          createdAt: new Date(),
        },
      });
      console.log('   ✅ Kasa işlemi kaydedildi');

      // Test tamamlandı, temizlik
      console.log('\n🧹 Test verileri temizleniyor...');
      await prisma.cashBoxTransaction.deleteMany({
        where: { reservationId: reservation.id },
      });
      await prisma.payments.deleteMany({
        where: { reservationId: reservation.id },
      });
      await prisma.reservation.delete({
        where: { id: reservation.id },
      });
      console.log('   ✅ Test verileri temizlendi');
      console.log('\n✅ Tüm testler başarılı!');
    }

    // Test müşterisini temizle
    await prisma.customer.delete({
      where: { id: customer.id },
    }).catch(() => {
      // Müşteri başka rezervasyonlarda kullanılıyorsa silme
    });

  } catch (error: any) {
    console.error('❌ Test hatası:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testKaporaFlow()
  .then(() => {
    console.log('\n🎉 Test tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test başarısız:', error);
    process.exit(1);
  });

