import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkPayments() {
  try {
    console.log('Rezervasyon ödemeleri kontrol ediliyor...\n');

    // Tüm ödemeleri getir
    const allPayments = await prisma.payments.findMany({
      where: {
        isCancelled: { not: true },
      },
      include: {
        Reservation: {
          include: {
            Customer: true,
          },
        },
        CashBox: true,
      },
      orderBy: {
        paymentDate: 'desc',
      },
      take: 20,
    });

    console.log(`Toplam Ödeme Sayısı: ${allPayments.length}\n`);

    if (allPayments.length === 0) {
      console.log('⚠️  Hiç ödeme bulunamadı!');
      return;
    }

    // Son 10 ödemeyi göster
    console.log('📋 Son 10 Ödeme:');
    allPayments.slice(0, 10).forEach((p, index) => {
      console.log(`${index + 1}. Rezervasyon: ${p.Reservation?.rezervasyonNo || 'N/A'}`);
      console.log(`   Müşteri: ${p.Reservation?.Customer?.adSoyad || 'Bilinmiyor'}`);
      console.log(`   Tutar: ${Number(p.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
      console.log(`   Tarih: ${new Date(p.paymentDate).toLocaleDateString('tr-TR')}`);
      console.log(`   Kasa: ${p.CashBox?.kasaAdi || 'Kasa seçilmemiş'}`);
      console.log(`   Ödeme Yöntemi: ${p.paymentMethod || 'Belirtilmemiş'}`);
      console.log('');
    });

    // Toplam tutar
    const toplamTutar = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);
    console.log(`\n💰 Toplam Ödeme Tutarı: ${toplamTutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);

    // Kasa bazında ödemeler
    const kasaBazinda: { [key: string]: number } = {};
    allPayments.forEach(p => {
      const kasaAdi = p.CashBox?.kasaAdi || 'Kasa seçilmemiş';
      kasaBazinda[kasaAdi] = (kasaBazinda[kasaAdi] || 0) + Number(p.amount);
    });

    console.log(`\n📊 Kasa Bazında Ödemeler:`);
    Object.entries(kasaBazinda).forEach(([kasa, tutar]) => {
      console.log(`   ${kasa}: ${tutar.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺`);
    });

  } catch (error: any) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPayments();

