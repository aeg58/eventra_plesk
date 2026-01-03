import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rastgele sayı (min, max arası)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rastgele boolean (yüzde şans)
function randomBoolean(chance: number = 50): boolean {
  return Math.random() * 100 < chance;
}

async function normalizePayments() {
  try {
    console.log('Ödemeler normalize ediliyor...');

    // Test rezervasyonlarını getir
    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { rezervasyonNo: { startsWith: 'REZ-2025' } },
          { rezervasyonNo: { startsWith: 'REZ-2026' } },
        ],
      },
      include: {
        Payments: true,
        Customer: true,
      },
    });

    console.log(`Toplam ${reservations.length} rezervasyon bulundu.`);

    let normalizedCount = 0;
    let deletedCount = 0;

    for (const reservation of reservations) {
      try {
        const sozlesmeFiyati = reservation.sozlesmeFiyati 
          ? Number(reservation.sozlesmeFiyati) 
          : 0;

        if (sozlesmeFiyati <= 0) {
          // Fiyat yoksa tüm ödemeleri sil
          if (reservation.Payments.length > 0) {
            await prisma.payments.deleteMany({
              where: { reservationId: reservation.id },
            });
            console.log(`✓ Ödemeler silindi: ${reservation.rezervasyonNo || reservation.id} (fiyat yok)`);
            deletedCount += reservation.Payments.length;
          }
          continue;
        }

        // Mevcut ödemeleri sil
        if (reservation.Payments.length > 0) {
          await prisma.payments.deleteMany({
            where: { reservationId: reservation.id },
          });
        }

        // Normalize edilmiş ödemeler oluştur
        // %70 ihtimalle kapora ödemesi yapılmış
        const hasKapora = randomBoolean(70);
        let totalPaid = 0;
        let kaporaDate: Date | null = null;

        if (hasKapora && sozlesmeFiyati > 0) {
          // Kapora: Sözleşme fiyatının %20-40'ı arası
          const kaporaYuzde = randomInt(20, 40);
          const kaporaTutari = Math.round((sozlesmeFiyati * kaporaYuzde) / 100);
          
          if (kaporaTutari > 0 && !isNaN(kaporaTutari)) {
            totalPaid += kaporaTutari;

            // Kapora ödemesi oluştur
            kaporaDate = reservation.sozlesmeTarihi 
              ? new Date(reservation.sozlesmeTarihi)
              : new Date(reservation.rezervasyonTarihi || new Date());
            
            // Kapora tarihi sözleşme tarihinden 1-7 gün sonra
            kaporaDate.setDate(kaporaDate.getDate() + randomInt(1, 7));

            await prisma.payments.create({
              data: {
                id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                reservationId: reservation.id,
                amount: kaporaTutari,
                paymentDate: kaporaDate,
                paymentMethod: randomItem(['Nakit', 'Kredi Kartı', 'Banka Transferi', 'POS']),
                notes: 'Kapora ödemesi',
                isCancelled: false,
              },
            });
          }
        }

        // %30 ihtimalle ek ödeme yapılmış (kapora sonrası)
        if (hasKapora && kaporaDate && randomBoolean(30)) {
          // Ek ödeme: Kalan bakiyenin %30-60'ı (ama toplam ödeme fiyatı geçmemeli)
          const kalanBakiye = sozlesmeFiyati - totalPaid;
          if (kalanBakiye > 0) {
            const ekOdemeYuzde = randomInt(30, 60);
            let ekOdemeTutari = Math.round((kalanBakiye * ekOdemeYuzde) / 100);
            
            // Toplam ödeme fiyatı geçmemeli
            if (totalPaid + ekOdemeTutari > sozlesmeFiyati) {
              ekOdemeTutari = sozlesmeFiyati - totalPaid;
            }
            
            if (ekOdemeTutari > 0 && !isNaN(ekOdemeTutari)) {
              totalPaid += ekOdemeTutari;

              // Ek ödeme tarihi kapora tarihinden 15-30 gün sonra
              const ekOdemeDate = new Date(kaporaDate);
              ekOdemeDate.setDate(ekOdemeDate.getDate() + randomInt(15, 30));

              await prisma.payments.create({
                data: {
                  id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  reservationId: reservation.id,
                  amount: ekOdemeTutari,
                  paymentDate: ekOdemeDate,
                  paymentMethod: randomItem(['Nakit', 'Kredi Kartı', 'Banka Transferi', 'POS']),
                  notes: 'Ara ödeme',
                  isCancelled: false,
                },
              });
            }
          }
        }

        // Toplam ödeme sözleşme fiyatını geçmemeli (fazla ödeme olmamalı)
        // Eğer geçerse, son ödemeyi azalt veya sil
        const allPayments = await prisma.payments.findMany({
          where: { reservationId: reservation.id },
          orderBy: { paymentDate: 'desc' },
        });

        // Toplam ödemeyi yeniden hesapla
        let actualTotalPaid = allPayments.reduce((sum, p) => sum + Number(p.amount), 0);

        if (allPayments.length > 0 && actualTotalPaid > sozlesmeFiyati) {
          const lastPayment = allPayments[0];
          const fazla = actualTotalPaid - sozlesmeFiyati;
          const yeniTutar = Math.max(0, Number(lastPayment.amount) - fazla);

          if (yeniTutar > 0) {
            await prisma.payments.update({
              where: { id: lastPayment.id },
              data: {
                amount: yeniTutar,
              },
            });
            actualTotalPaid = sozlesmeFiyati;
          } else {
            // Eğer son ödeme çok küçükse, sil
            await prisma.payments.delete({
              where: { id: lastPayment.id },
            });
            actualTotalPaid -= Number(lastPayment.amount);
          }
        }

        totalPaid = actualTotalPaid;

        console.log(`✓ Rezervasyon normalize edildi: ${reservation.rezervasyonNo || reservation.id} - Toplam: ${totalPaid.toFixed(2)} ₺ / ${sozlesmeFiyati.toFixed(2)} ₺`);
        normalizedCount++;
      } catch (error: any) {
        console.error(`✗ Rezervasyon normalize edilemedi: ${reservation.rezervasyonNo || reservation.id} - ${error.message}`);
      }
    }

    console.log(`\n✓ Toplam ${normalizedCount} rezervasyon normalize edildi`);
    console.log(`✓ Toplam ${deletedCount} ödeme silindi`);
    console.log(`✓ İşlem tamamlandı!`);
  } catch (error: any) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Rastgele değer seç
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

normalizePayments();

