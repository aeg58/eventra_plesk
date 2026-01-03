import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testRezervasyonKapora() {
  try {
    console.log('🧪 Rezervasyon kapora akışı test ediliyor...\n');

    // 1. Kapora yüzdesini güncelle
    console.log('1️⃣ Kapora yüzdesi güncelleniyor (30%)...');
    let settings = await prisma.reservationSettings.findFirst();
    
    if (settings) {
      settings = await prisma.reservationSettings.update({
        where: { id: settings.id },
        data: { kaporaYuzdesi: 30.00 },
      });
      console.log('   ✅ Kapora yüzdesi güncellendi:', settings.kaporaYuzdesi, '%');
    } else {
      settings = await prisma.reservationSettings.create({
        data: {
          id: 'reservation_settings_1',
          kaporaYuzdesi: 30.00,
        },
      });
      console.log('   ✅ Kapora yüzdesi oluşturuldu:', settings.kaporaYuzdesi, '%');
    }

    // 2. Test müşterisi oluştur
    console.log('\n2️⃣ Test müşterisi oluşturuluyor...');
    const customer = await prisma.customer.create({
      data: {
        id: `customer_test_rez_${Date.now()}`,
        adSoyad: 'Test Rezervasyon Müşteri',
        email: `test-rez-${Date.now()}@example.com`,
        telefon: '5551234567',
      },
    });
    console.log('   ✅ Müşteri oluşturuldu:', customer.id);

    // 3. Aktif kasa bul
    console.log('\n3️⃣ Aktif kasa bulunuyor...');
    const cashBox = await prisma.cashBox.findFirst({
      where: { isActive: true },
    });

    if (!cashBox) {
      throw new Error('Aktif kasa bulunamadı!');
    }
    console.log('   ✅ Kasa bulundu:', cashBox.kasaAdi);

    // 4. Rezervasyon oluştur
    console.log('\n4️⃣ Test rezervasyonu oluşturuluyor...');
    const sozlesmeFiyati = 10000.00;
    const kaporaYuzdesi = parseFloat(String(settings.kaporaYuzdesi));
    const otomatikKapora = Math.round(sozlesmeFiyati * (kaporaYuzdesi / 100));
    
    const rezNo = `TEST${Date.now().toString().slice(-8)}`;
    const reservation = await prisma.reservation.create({
      data: {
        id: `reservation_test_rez_${Date.now()}`,
        rezervasyonNo: rezNo,
        customerId: customer.id,
        durum: 'Açık',
        sozlesmeFiyati: sozlesmeFiyati,
        rezervasyonTarihi: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('   ✅ Rezervasyon oluşturuldu:', reservation.rezervasyonNo);
    console.log('   📊 Sözleşme fiyatı:', sozlesmeFiyati, '₺');
    console.log('   💰 Otomatik kapora (%' + kaporaYuzdesi + '):', otomatikKapora, '₺');

    // 5. Kapora ödemesi oluştur
    console.log('\n5️⃣ Kapora ödemesi oluşturuluyor...');
    const payment = await prisma.payments.create({
      data: {
        id: `payment_test_rez_${Date.now()}`,
        reservationId: reservation.id,
        cashBoxId: cashBox.id,
        amount: otomatikKapora,
        paymentDate: new Date(),
        paymentMethod: 'Nakit',
        notes: 'Kapora - Test rezervasyonu',
        isCancelled: false,
      },
    });
    console.log('   ✅ Kapora ödemesi oluşturuldu:', payment.id);
    console.log('   💵 Ödeme tutarı:', payment.amount, '₺');

    // 6. Kasa bakiyesini güncelle
    console.log('\n6️⃣ Kasa bakiyesi güncelleniyor...');
    const lastTransaction = await prisma.cashBoxTransaction.findFirst({
      where: { cashBoxId: cashBox.id },
      orderBy: { tarih: 'desc' },
    });

    const lastBalance = lastTransaction
      ? parseFloat(String(lastTransaction.yeniBakiye))
      : parseFloat(String(cashBox.acilisBakiyesi || 0));

    const newBalance = lastBalance + otomatikKapora;

    await prisma.cashBoxTransaction.create({
      data: {
        id: `transaction_test_rez_${Date.now()}`,
        cashBoxId: cashBox.id,
        reservationId: reservation.id,
        islemTuru: 'Gelir',
        tutar: otomatikKapora,
        aciklama: `Rezervasyon kapora ödemesi: ${reservation.rezervasyonNo}`,
        tarih: new Date(),
        yeniBakiye: newBalance,
        createdAt: new Date(),
      },
    });
    console.log('   ✅ Kasa işlemi kaydedildi');
    console.log('   💰 Yeni bakiye:', newBalance, '₺');

    // 7. Rezervasyonu kontrol et
    console.log('\n7️⃣ Rezervasyon kontrol ediliyor...');
    const checkReservation = await prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        Payments: {
          where: { isCancelled: false },
        },
      },
    });

    if (checkReservation) {
      console.log('   ✅ Rezervasyon bulundu');
      console.log('   📋 Rezervasyon No:', checkReservation.rezervasyonNo);
      console.log('   💵 Toplam ödeme:', checkReservation.Payments.reduce((sum, p) => sum + parseFloat(String(p.amount)), 0), '₺');
      console.log('   📊 Sözleşme fiyatı:', checkReservation.sozlesmeFiyati, '₺');
    }

    // 8. Temizlik - Rezervasyonu sil
    console.log('\n🧹 Test verileri temizleniyor...');
    
    // Önce kasa işlemlerini sil
    await prisma.cashBoxTransaction.deleteMany({
      where: { reservationId: reservation.id },
    });
    console.log('   ✅ Kasa işlemleri silindi');
    
    // Ödemeleri sil
    await prisma.payments.deleteMany({
      where: { reservationId: reservation.id },
    });
    console.log('   ✅ Ödemeler silindi');
    
    // Rezervasyonu sil
    await prisma.reservation.delete({
      where: { id: reservation.id },
    });
    console.log('   ✅ Rezervasyon silindi');
    
    // Müşteriyi sil
    await prisma.customer.delete({
      where: { id: customer.id },
    });
    console.log('   ✅ Müşteri silindi');

    console.log('\n✅ Tüm testler başarılı!');
    console.log('🎉 Rezervasyon kapora akışı doğrulandı!');

  } catch (error: any) {
    console.error('❌ Test hatası:', error);
    console.error('   Hata detayı:', error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testRezervasyonKapora()
  .then(() => {
    console.log('\n🎉 Test tamamlandı!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test başarısız:', error);
    process.exit(1);
  });

