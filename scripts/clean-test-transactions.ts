import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function cleanTestTransactions() {
  try {
    console.log('Test işlemleri temizleniyor...\n');

    // Tüm kasa işlemlerini getir
    const allTransactions = await prisma.cashBoxTransaction.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Toplam işlem sayısı: ${allTransactions.length}\n`);

    // Test işlemlerini belirle (açıklamalarına göre)
    const testKeywords = [
      'Rezervasyon ödemesi',
      'Catering hizmeti',
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
      'Kapora ödemesi',
      'Kalan ödeme',
      'Ekstra hizmet ödemesi',
    ];

    const testTransactions = allTransactions.filter(t => {
      const aciklama = t.aciklama?.toLowerCase() || '';
      return testKeywords.some(keyword => aciklama.includes(keyword.toLowerCase()));
    });

    console.log(`Test işlemi bulundu: ${testTransactions.length}\n`);

    if (testTransactions.length === 0) {
      console.log('✅ Temizlenecek test işlemi bulunamadı.');
      return;
    }

    // Test işlemlerini sil
    let deletedCount = 0;
    for (const transaction of testTransactions) {
      try {
        await prisma.cashBoxTransaction.delete({
          where: { id: transaction.id },
        });
        deletedCount++;
        console.log(`✓ Silindi: ${transaction.aciklama} - ${transaction.tutar} ₺`);
      } catch (error: any) {
        console.error(`✗ Silinemedi: ${transaction.id} - ${error.message}`);
      }
    }

    console.log(`\n✅ Toplam ${deletedCount} test işlemi silindi!`);

    // Kasa bakiyelerini yeniden hesapla
    console.log('\nKasa bakiyeleri yeniden hesaplanıyor...\n');
    
    const cashBoxes = await prisma.cashBox.findMany({
      where: { isActive: true },
    });

    for (const cashBox of cashBoxes) {
      // Kasa için kalan işlemleri tarih sırasına göre al
      const remainingTransactions = await prisma.cashBoxTransaction.findMany({
        where: { cashBoxId: cashBox.id },
        orderBy: { tarih: 'asc' },
      });

      // Bakiyeyi başlangıç bakiyesinden başlayarak yeniden hesapla
      let currentBalance = Number(cashBox.acilisBakiyesi);

      for (const transaction of remainingTransactions) {
        if (transaction.islemTuru === 'Gelir' || transaction.islemTuru === 'Transfer Giriş') {
          currentBalance += Number(transaction.tutar);
        } else if (transaction.islemTuru === 'Gider' || transaction.islemTuru === 'Transfer Çıkış') {
          currentBalance -= Number(transaction.tutar);
        }

        // İşlemin yeni bakiyesini güncelle
        await prisma.cashBoxTransaction.update({
          where: { id: transaction.id },
          data: { yeniBakiye: currentBalance },
        });
      }

      console.log(`✓ ${cashBox.kasaAdi} bakiyesi güncellendi: ${currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
    }

    console.log('\n✅ Tüm işlemler tamamlandı!');

  } catch (error: any) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanTestTransactions();

