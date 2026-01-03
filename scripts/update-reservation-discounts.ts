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

async function updateReservationDiscounts() {
  try {
    console.log('Rezervasyon iskontoları güncelleniyor...');

    // Tüm rezervasyonları getir
    const reservations = await prisma.reservation.findMany({
      where: {
        OR: [
          { rezervasyonNo: { startsWith: 'REZ-2025' } },
          { rezervasyonNo: { startsWith: 'REZ-2026' } },
        ],
      },
    });

    console.log(`Toplam ${reservations.length} rezervasyon bulundu.`);

    let updatedCount = 0;
    let removedCount = 0;

    for (const reservation of reservations) {
      try {
        // %60 ihtimalle iskonto atanacak, %40 ihtimalle iskonto olmayacak
        const willHaveDiscount = randomBoolean(60);

        if (willHaveDiscount) {
          const sozlesmeFiyati = reservation.sozlesmeFiyati 
            ? Number(reservation.sozlesmeFiyati) 
            : 0;
          
          if (sozlesmeFiyati > 0) {
            // %50 ihtimalle yüzde iskonto, %50 ihtimalle sabit tutar iskonto
            const usePercentage = randomBoolean(50);
            
            if (usePercentage) {
              // Yüzde iskonto (maksimum %10)
              const iskontoYuzde = randomInt(1, 10); // %1 ile %10 arası
              const iskontoTutari = (sozlesmeFiyati * iskontoYuzde) / 100;

              await prisma.reservation.update({
                where: { id: reservation.id },
                data: {
                  iskonto: iskontoTutari,
                  iskontoYuzde: true,
                },
              });

              console.log(`✓ Rezervasyon güncellendi: ${reservation.rezervasyonNo || reservation.id} - %${iskontoYuzde} iskonto (${iskontoTutari.toFixed(2)} ₺)`);
            } else {
              // Sabit tutar iskonto (maksimum 1000 TL)
              const iskontoTutari = randomInt(100, 1000); // 100 TL ile 1000 TL arası

              await prisma.reservation.update({
                where: { id: reservation.id },
                data: {
                  iskonto: iskontoTutari,
                  iskontoYuzde: false,
                },
              });

              console.log(`✓ Rezervasyon güncellendi: ${reservation.rezervasyonNo || reservation.id} - ${iskontoTutari.toFixed(2)} ₺ sabit iskonto`);
            }
            updatedCount++;
          } else {
            // Fiyat yoksa iskonto da kaldır
            await prisma.reservation.update({
              where: { id: reservation.id },
              data: {
                iskonto: null,
                iskontoYuzde: false,
              },
            });
            console.log(`✓ İskonto kaldırıldı: ${reservation.rezervasyonNo || reservation.id} (fiyat yok)`);
            removedCount++;
          }
        } else {
          // İskonto kaldır
          await prisma.reservation.update({
            where: { id: reservation.id },
            data: {
              iskonto: null,
              iskontoYuzde: false,
            },
          });
          console.log(`✓ İskonto kaldırıldı: ${reservation.rezervasyonNo || reservation.id}`);
          removedCount++;
        }
      } catch (error: any) {
        console.error(`✗ Rezervasyon güncellenemedi: ${reservation.rezervasyonNo || reservation.id} - ${error.message}`);
      }
    }

    console.log(`\n✓ Toplam ${updatedCount} rezervasyona iskonto atandı (maksimum %10)`);
    console.log(`✓ Toplam ${removedCount} rezervasyondan iskonto kaldırıldı`);
    console.log(`✓ İşlem tamamlandı!`);
  } catch (error: any) {
    console.error('Hata:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateReservationDiscounts();

