import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkFinancialTransactions() {
  try {
    console.log('Finans Yönetimi için işlemler kontrol ediliyor...\n');

    // Tüm kasa işlemlerini getir
    const allTransactions = await prisma.cashBoxTransaction.findMany({
      where: {
        islemTuru: {
          in: ['Gelir', 'Gider'],
        },
      },
      include: {
        CashBox_CashBoxTransaction_cashBoxIdToCashBox: {
          select: {
            id: true,
            kasaAdi: true,
            tur: true,
          },
        },
      },
      orderBy: {
        tarih: 'desc',
      },
      take: 50,
    });

    console.log(`Toplam Gelir/Gider İşlemi: ${allTransactions.length}\n`);

    if (allTransactions.length === 0) {
      console.log('⚠️  Hiç Gelir/Gider işlemi bulunamadı!');
      return;
    }

    // Gelir ve Gider ayrı ayrı
    const gelirler = allTransactions.filter(t => t.islemTuru === 'Gelir');
    const giderler = allTransactions.filter(t => t.islemTuru === 'Gider');

    console.log(`💰 Gelir İşlemleri: ${gelirler.length}`);
    console.log(`💸 Gider İşlemleri: ${giderler.length}\n`);

    // Son 10 işlemi göster
    console.log('📋 Son 10 İşlem:');
    allTransactions.slice(0, 10).forEach((t, index) => {
      console.log(`${index + 1}. ${t.islemTuru} - ${t.aciklama || 'Açıklama yok'}`);
      console.log(`   Tutar: ${Number(t.tutar).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
      console.log(`   Tarih: ${new Date(t.tarih).toLocaleDateString('tr-TR')}`);
      console.log(`   Kasa: ${t.CashBox_CashBoxTransaction_cashBoxIdToCashBox?.kasaAdi || 'Bilinmiyor'}`);
      console.log('');
    });

    // Toplam tutarlar
    const toplamGelir = gelirler.reduce((sum, t) => sum + Number(t.tutar), 0);
    const toplamGider = giderler.reduce((sum, t) => sum + Number(t.tutar), 0);
    const netFark = toplamGelir - toplamGider;

    console.log(`\n📊 Özet:`);
    console.log(`   Toplam Gelir: ${toplamGelir.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
    console.log(`   Toplam Gider: ${toplamGider.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
    console.log(`   Net Fark: ${netFark.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);

  } catch (error: any) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkFinancialTransactions();

