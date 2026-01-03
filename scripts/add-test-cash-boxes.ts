import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Test kasaları
const testCashBoxes = [
  {
    kasaAdi: 'Ana Nakit Kasa',
    tur: 'Nakit',
    iban: null,
    dovizCinsi: 'TL',
    acilisBakiyesi: 50000,
  },
  {
    kasaAdi: 'POS Makinesi',
    tur: 'POS',
    iban: null,
    dovizCinsi: 'TL',
    acilisBakiyesi: 25000,
  },
  {
    kasaAdi: 'Ziraat Bankası',
    tur: 'Banka',
    iban: 'TR330001000000000000000001',
    dovizCinsi: 'TL',
    acilisBakiyesi: 150000,
  },
  {
    kasaAdi: 'İş Bankası',
    tur: 'Banka',
    iban: 'TR640001000000000000000002',
    dovizCinsi: 'TL',
    acilisBakiyesi: 200000,
  },
  {
    kasaAdi: 'Kredi Kartı',
    tur: 'Kredi Kartı',
    iban: null,
    dovizCinsi: 'TL',
    acilisBakiyesi: 0,
  },
];

// Test işlemleri için açıklamalar
const gelirAciklamalari = [
  'Rezervasyon ödemesi - Düğün',
  'Rezervasyon ödemesi - Kına',
  'Rezervasyon ödemesi - Nişan',
  'Rezervasyon ödemesi - Sünnet',
  'Kapora ödemesi',
  'Kalan ödeme',
  'Ekstra hizmet ödemesi',
];

const giderAciklamalari = [
  'Catering hizmeti ödemesi',
  'Dekorasyon malzemeleri',
  'Çiçek düzenlemesi',
  'Müzik ve ses sistemi',
  'Fotoğraf çekimi',
  'Video kayıt',
  'Güvenlik hizmeti',
  'Temizlik hizmeti',
  'Masa sandalye kiralama',
  'Teknik ekipman',
  'Elektrik faturası',
  'Su faturası',
  'Doğalgaz faturası',
  'İnternet faturası',
  'Kira ödemesi',
  'Personel maaşları',
  'Vergi ödemesi',
];

// Rastgele değer seç
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Rastgele sayı (min, max arası)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rastgele boolean (yüzde şans)
function randomBoolean(chance: number = 50): boolean {
  return Math.random() * 100 < chance;
}

async function addTestCashBoxes() {
  try {
    console.log('Test kasaları ve işlemler ekleniyor...\n');

    // Mevcut kasaları kontrol et
    const existingCashBoxes = await prisma.cashBox.findMany({
      where: { isActive: true },
    });

    // Test kasaları oluştur (mevcut kasalar olsa bile)
    console.log('Test kasaları oluşturuluyor...\n');

    // Yeni test kasaları oluştur
    console.log('Yeni test kasaları oluşturuluyor...\n');
    const createdCashBoxes = [];

    for (const cashBoxData of testCashBoxes) {
      try {
        const cashBox = await prisma.cashBox.create({
          data: {
            id: `cashbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            ...cashBoxData,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        createdCashBoxes.push(cashBox);
        console.log(`✓ Kasa oluşturuldu: ${cashBox.kasaAdi} - Bakiye: ${cashBox.acilisBakiyesi} ₺`);
      } catch (error: any) {
        console.error(`✗ Kasa oluşturulamadı: ${cashBoxData.kasaAdi} - ${error.message}`);
      }
    }

    console.log(`\n✓ Toplam ${createdCashBoxes.length} kasa oluşturuldu!\n`);

    // Test işlemleri ekle
    await addTestTransactions(createdCashBoxes);

  } catch (error: any) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

async function addTestTransactions(cashBoxes: any[]) {
  try {
    console.log('Test işlemleri ekleniyor...\n');

    const today = new Date();
    const transactions: any[] = [];

    // Son 30 gün için işlemler
    for (let day = 0; day < 30; day++) {
      const transactionDate = new Date(today);
      transactionDate.setDate(today.getDate() - day);

      // Her gün için 1-4 işlem
      const numTransactions = randomInt(1, 4);

      for (let i = 0; i < numTransactions; i++) {
        const cashBox = randomItem(cashBoxes);
        const isGelir = randomBoolean(60); // %60 ihtimalle gelir

        if (isGelir) {
          // Gelir işlemi
          const tutar = randomInt(5000, 50000);
          
          // Mevcut bakiyeyi hesapla
          const lastTransaction = await prisma.cashBoxTransaction.findFirst({
            where: { cashBoxId: cashBox.id },
            orderBy: { tarih: 'desc' },
          });
          
          const currentBalance = lastTransaction 
            ? Number(lastTransaction.yeniBakiye)
            : Number(cashBox.acilisBakiyesi || 0);
          
          const yeniBakiye = currentBalance + tutar;
          
          transactions.push({
            id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            cashBoxId: cashBox.id,
            islemTuru: 'Gelir',
            tutar: tutar,
            aciklama: randomItem(gelirAciklamalari),
            tarih: transactionDate,
            yeniBakiye: yeniBakiye,
            createdAt: new Date(),
          });
        } else {
          // Gider işlemi
          const tutar = randomInt(2000, 30000);
          
          // Mevcut bakiyeyi hesapla
          const lastTransaction = await prisma.cashBoxTransaction.findFirst({
            where: { cashBoxId: cashBox.id },
            orderBy: { tarih: 'desc' },
          });
          
          const currentBalance = lastTransaction 
            ? Number(lastTransaction.yeniBakiye)
            : Number(cashBox.acilisBakiyesi || 0);
          
          const yeniBakiye = Math.max(0, currentBalance - tutar);
          
          transactions.push({
            id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            cashBoxId: cashBox.id,
            islemTuru: 'Gider',
            tutar: tutar,
            aciklama: randomItem(giderAciklamalari),
            tarih: transactionDate,
            yeniBakiye: yeniBakiye,
            createdAt: new Date(),
          });
        }
      }
    }

    // İşlemleri tarihe göre sırala (en eskiden yeniye)
    transactions.sort((a, b) => new Date(a.tarih).getTime() - new Date(b.tarih).getTime());

    // Bakiyeleri yeniden hesapla (sıralı şekilde)
    const cashBoxBalances: { [key: string]: number } = {};
    cashBoxes.forEach(cb => {
      cashBoxBalances[cb.id] = Number(cb.acilisBakiyesi || 0);
    });

    const finalTransactions = transactions.map(t => {
      const currentBalance = cashBoxBalances[t.cashBoxId] || 0;
      let yeniBakiye = currentBalance;
      
      if (t.islemTuru === 'Gelir') {
        yeniBakiye = currentBalance + t.tutar;
      } else if (t.islemTuru === 'Gider') {
        yeniBakiye = Math.max(0, currentBalance - t.tutar);
      }
      
      cashBoxBalances[t.cashBoxId] = yeniBakiye;
      return { ...t, yeniBakiye };
    });

    // İşlemleri veritabanına ekle
    let successCount = 0;
    for (const transaction of finalTransactions) {
      try {
        await prisma.cashBoxTransaction.create({
          data: transaction,
        });
        successCount++;
      } catch (error: any) {
        console.error(`✗ İşlem eklenemedi: ${error.message}`);
      }
    }

    console.log(`✓ Toplam ${successCount} test işlemi eklendi!`);
    console.log(`\n📊 Özet:`);
    console.log(`   - Kasalar: ${cashBoxes.length}`);
    console.log(`   - İşlemler: ${successCount}`);
    console.log(`   - Tarih aralığı: Son 30 gün\n`);

  } catch (error: any) {
    console.error('İşlem ekleme hatası:', error);
  }
}

addTestCashBoxes();

