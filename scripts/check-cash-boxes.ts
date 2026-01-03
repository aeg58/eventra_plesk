import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCashBoxes() {
  try {
    console.log('Kasalar kontrol ediliyor...\n');

    // Tüm kasaları getir
    const allCashBoxes = await prisma.cashBox.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`Toplam Kasa Sayısı: ${allCashBoxes.length}\n`);

    if (allCashBoxes.length === 0) {
      console.log('⚠️  Hiç kasa bulunamadı!');
      return;
    }

    // Aktif kasalar
    const activeCashBoxes = allCashBoxes.filter(cb => cb.isActive);
    console.log(`Aktif Kasa Sayısı: ${activeCashBoxes.length}\n`);

    // Her kasa için detaylı bilgi
    for (const cashBox of allCashBoxes) {
      // Son işlem bakiyesini hesapla
      const lastTransaction = await prisma.cashBoxTransaction.findFirst({
        where: { cashBoxId: cashBox.id },
        orderBy: { tarih: 'desc' },
      });

      const currentBalance = lastTransaction
        ? Number(lastTransaction.yeniBakiye)
        : Number(cashBox.acilisBakiyesi);

      // İşlem sayısı
      const transactionCount = await prisma.cashBoxTransaction.count({
        where: { cashBoxId: cashBox.id },
      });

      console.log(`📦 ${cashBox.kasaAdi}`);
      console.log(`   ID: ${cashBox.id}`);
      console.log(`   Tür: ${cashBox.tur}`);
      console.log(`   Döviz: ${cashBox.dovizCinsi}`);
      console.log(`   Açılış Bakiyesi: ${Number(cashBox.acilisBakiyesi).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
      console.log(`   Mevcut Bakiye: ${currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
      console.log(`   İşlem Sayısı: ${transactionCount}`);
      console.log(`   Aktif: ${cashBox.isActive ? '✅' : '❌'}`);
      console.log(`   Oluşturulma: ${cashBox.createdAt.toLocaleString('tr-TR')}`);
      console.log('');
    }

    // Toplam bakiye
    const totalBalance = activeCashBoxes.reduce((sum, cb) => {
      return sum + Number(cb.acilisBakiyesi);
    }, 0);

    console.log(`💰 Toplam Açılış Bakiyesi: ${totalBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);

  } catch (error: any) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkCashBoxes();

