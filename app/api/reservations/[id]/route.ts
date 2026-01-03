import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { findOrCreateCustomer, logReservationActivity } from '@/app/utils/reservation-helpers';

export const dynamic = 'force-dynamic';

import { validateAuth } from '@/app/lib/auth';

// Rezervasyon detayı
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const reservation = await prisma.reservation.findUnique({
      where: { id: params.id },
      include: {
        Customer: true,
        ReservationDynamicValues: true,
        ReservationParticipants: true,
        Payments: {
          orderBy: {
            paymentDate: 'desc',
          },
        },
      },
    });

    // İlgili bilgileri manuel olarak çek
    let office = null;
    let salon = null;
    let organizasyonGrup = null;
    let paket = null;
    let kaynak = null;
    let yetkiliUser = null;
    let sozlesmeSablon = null;

    if (reservation) {
      if (reservation.officeId) {
        office = await prisma.ofisler.findUnique({
          where: { id: reservation.officeId },
          select: { id: true, name: true },
        });
      }
      if (reservation.salonId) {
        salon = await prisma.subeler.findUnique({
          where: { id: reservation.salonId },
          select: { id: true, name: true },
        });
      }
      if (reservation.organizasyonGrupId) {
        organizasyonGrup = await prisma.organizasyonGrup.findUnique({
          where: { id: reservation.organizasyonGrupId },
          select: { id: true, name: true },
        });
      }
      if (reservation.paketId) {
        paket = await prisma.organizasyonPaketler.findUnique({
          where: { id: reservation.paketId },
          select: { id: true, name: true },
        });
      }
      if (reservation.kaynakId) {
        kaynak = await prisma.rezervasyonKaynak.findUnique({
          where: { id: reservation.kaynakId },
          select: { id: true, name: true },
        });
        // Debug: kaynak bulunamadıysa log
        if (!kaynak) {
          console.warn(`[Reservation API] Kaynak bulunamadı: ${reservation.kaynakId}`);
        }
      }
      if (reservation.yetkili) {
        // yetkili alanı bir ID olabilir veya isim olabilir
        yetkiliUser = await prisma.kullan_c_lar.findFirst({
          where: {
            OR: [
              { id: reservation.yetkili },
              { name: reservation.yetkili },
            ],
          },
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true,
            Roller: {
              select: { name: true }
            }
          },
        });
      }
      if (reservation.sozlesmeKontrati) {
        sozlesmeSablon = await prisma.sozlesmeSablon.findUnique({
          where: { id: reservation.sozlesmeKontrati },
          select: { id: true, title: true },
        });
      }
    }

    if (!reservation) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      reservation: {
        ...reservation,
        Office: office,
        Salon: salon,
        OrganizasyonGrup: organizasyonGrup,
        Paket: paket,
        Kaynak: kaynak,
        YetkiliUser: yetkiliUser,
        SozlesmeSablon: sozlesmeSablon,
      }
    });
  } catch (error: any) {
    console.error('Reservation GET error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Rezervasyon güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    // Mevcut rezervasyonu getir
    const existingReservation = await prisma.reservation.findUnique({
      where: { id: params.id },
    });

    if (!existingReservation) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      // Müşteri bilgileri
      customerAdSoyad,
      customerTelefon,
      customerEmail,
      customerAdres,
      customerId,
      
      // Rezervasyon bilgileri
      organizasyonGrupId,
      officeId,
      salonId,
      yetkili,
      rezervasyonTarihi,
      sozlesmeTarihi,
      zamanDilimi,
      durum,
      paketId,
      davetiSayisi,
      fiyatKisiBasi,
      sozlesmeFiyati,
      iskonto,
      iskontoYuzde,
      kdvOrani,
      ozelTeklif,
      ozelNotlar,
      ekstraNotu,
      kaynakId,
      
      // Kontrat bilgileri
      sozlesmeKontrati,
      kontratSahibiAdSoyad,
      kontratSahibiTelefon,
      kontratSahibiTc,
      kontratAdresi,
      
      // Fatura bilgileri
      faturaIstiyorum,
      faturaUnvani,
      faturaVergiDairesi,
      faturaVergiNo,
      faturaAdresi,
      
      // Dinamik form verileri
      dynamicValues,
      
      // Katılımcılar
      participants,
    } = body;

    // Müşteri ID'sini güncelle veya oluştur
    let finalCustomerId = existingReservation.customerId;
    
    if (customerId) {
      finalCustomerId = customerId;
    } else if (customerAdSoyad) {
      finalCustomerId = await findOrCreateCustomer({
        adSoyad: customerAdSoyad,
        telefon: customerTelefon,
        email: customerEmail,
        adres: customerAdres,
      });
    }

    // İptal işlemi kontrolü
    if (durum === 'İptal' && existingReservation.durum !== 'İptal') {
      try {
        // Rezervasyonun tüm ödemelerini getir
        const payments = await prisma.payments.findMany({
          where: {
            reservationId: params.id,
            isCancelled: false,
          },
        });

        // Tüm ödemeleri iptal et ve kasa çıkış işlemi oluştur
        for (const payment of payments) {
          try {
            // Ödeme iptal et
            await prisma.payments.update({
              where: { id: payment.id },
              data: {
                isCancelled: true,
                cancelledAt: new Date(),
                updatedAt: new Date(),
              },
            });

            // Kasa çıkış işlemi oluştur
            if (payment.cashBoxId) {
              try {
                // Kasa bilgisini getir
                const cashBox = await prisma.cashBox.findUnique({
                  where: { id: payment.cashBoxId },
                });

                if (cashBox) {
                  // Mevcut bakiyeyi al
                  const currentBalance = parseFloat(cashBox.bakiye.toString());
                  const paymentAmount = parseFloat(payment.amount.toString());
                  
                  // Yetersiz bakiye kontrolü
                  if (currentBalance < paymentAmount) {
                    console.warn(`Yetersiz bakiye: ${currentBalance} < ${paymentAmount} (Kasa: ${cashBox.kasaAdi})`);
                    // Yetersiz bakiye olsa bile işlemi yap, negatif bakiye olabilir
                  }
                  
                  const newBalance = currentBalance - paymentAmount;

                  // Kasa bakiyesini güncelle
                  await prisma.cashBox.update({
                    where: { id: payment.cashBoxId },
                    data: {
                      bakiye: newBalance,
                      updatedAt: new Date(),
                    },
                  });

                  // Kasa çıkış işlemi oluştur
                  await prisma.cashBoxTransaction.create({
                    data: {
                      id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                      cashBoxId: payment.cashBoxId,
                      reservationId: existingReservation.id,
                      islemTuru: 'İptal İade',
                      tutar: paymentAmount,
                      aciklama: `İptal - Müşteri İadesi - ${existingReservation.rezervasyonNo}`,
                      tarih: new Date(),
                      yeniBakiye: newBalance,
                      createdAt: new Date(),
                    },
                  });
                } else {
                  console.warn(`Kasa bulunamadı: ${payment.cashBoxId}`);
                }
              } catch (cashError: any) {
                console.error(`Kasa işlemi hatası (Ödeme ID: ${payment.id}):`, cashError);
                // Kasa işleminde hata olsa bile devam et
              }
            }
          } catch (paymentError: any) {
            console.error(`Ödeme iptal hatası (Ödeme ID: ${payment.id}):`, paymentError);
            // Ödeme iptalinde hata olsa bile devam et
          }
        }

        // İptal logu
        await logReservationActivity(
          params.id,
          'cancelled',
          'Rezervasyon İptal Edildi',
          `Rezervasyon ${existingReservation.rezervasyonNo} iptal edildi`
        );
      } catch (error: any) {
        console.error('İptal işlemi hatası (ödemeler/kasa):', error);
        // Hata olsa bile rezervasyon durumunu iptal etmeye devam et
        // Ödeme/kasa işlemlerinde hata olsa bile rezervasyon iptal edilmeli
      }
    }
    
    // İptal durumu updateData'ya eklenecek (aşağıdaki if kontrolünde)

    // Güncelleme verilerini hazırla
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (organizasyonGrupId !== undefined) updateData.organizasyonGrupId = organizasyonGrupId || null;
    if (officeId !== undefined) updateData.officeId = officeId || null;
    if (salonId !== undefined) updateData.salonId = salonId || null;
    if (yetkili !== undefined) updateData.yetkili = yetkili || null;
    if (rezervasyonTarihi !== undefined) updateData.rezervasyonTarihi = rezervasyonTarihi ? new Date(rezervasyonTarihi) : null;
    if (sozlesmeTarihi !== undefined) updateData.sozlesmeTarihi = sozlesmeTarihi ? new Date(sozlesmeTarihi) : null;
    if (zamanDilimi !== undefined) updateData.zamanDilimi = zamanDilimi || null;
    if (durum !== undefined) updateData.durum = durum;
    if (paketId !== undefined) updateData.paketId = paketId || null;
    if (davetiSayisi !== undefined) updateData.davetiSayisi = davetiSayisi ? parseInt(String(davetiSayisi)) : null;
    if (fiyatKisiBasi !== undefined) updateData.fiyatKisiBasi = fiyatKisiBasi ? parseFloat(String(fiyatKisiBasi)) : null;
    if (sozlesmeFiyati !== undefined) updateData.sozlesmeFiyati = sozlesmeFiyati ? parseFloat(String(sozlesmeFiyati)) : null;
    if (iskonto !== undefined) updateData.iskonto = iskonto ? parseFloat(String(iskonto)) : null;
    if (iskontoYuzde !== undefined) updateData.iskontoYuzde = iskontoYuzde;
    if (kdvOrani !== undefined) updateData.kdvOrani = kdvOrani ? parseFloat(String(kdvOrani)) : 0;
    if (ozelTeklif !== undefined) updateData.ozelTeklif = ozelTeklif;
    if (ozelNotlar !== undefined) updateData.ozelNotlar = ozelNotlar || null;
    if (ekstraNotu !== undefined) updateData.ekstraNotu = ekstraNotu || null;
    if (kaynakId !== undefined) updateData.kaynakId = kaynakId || null;
    if (sozlesmeKontrati !== undefined) updateData.sozlesmeKontrati = sozlesmeKontrati || null;
    if (kontratSahibiAdSoyad !== undefined) updateData.kontratSahibiAdSoyad = kontratSahibiAdSoyad || null;
    if (kontratSahibiTelefon !== undefined) updateData.kontratSahibiTelefon = kontratSahibiTelefon || null;
    if (kontratSahibiTc !== undefined) updateData.kontratSahibiTc = kontratSahibiTc || null;
    if (kontratAdresi !== undefined) updateData.kontratAdresi = kontratAdresi || null;
    if (faturaIstiyorum !== undefined) updateData.faturaIstiyorum = faturaIstiyorum;
    if (faturaUnvani !== undefined) updateData.faturaUnvani = faturaUnvani || null;
    if (faturaVergiDairesi !== undefined) updateData.faturaVergiDairesi = faturaVergiDairesi || null;
    if (faturaVergiNo !== undefined) updateData.faturaVergiNo = faturaVergiNo || null;
    if (faturaAdresi !== undefined) updateData.faturaAdresi = faturaAdresi || null;
    if (finalCustomerId !== existingReservation.customerId) {
      updateData.customerId = finalCustomerId;
    }

    // Durum değişikliğini logla
    if (durum && durum !== existingReservation.durum) {
      await logReservationActivity(
        params.id,
        'status_changed',
        'Durum Değiştirildi',
        `Rezervasyon durumu "${existingReservation.durum}" → "${durum}" olarak değiştirildi`,
        undefined,
        undefined,
        existingReservation.durum || '',
        durum
      );
    }

    // Rezervasyonu güncelle
    const reservation = await prisma.reservation.update({
      where: { id: params.id },
      data: updateData,
      include: {
        Customer: true,
      },
    });

    // Dinamik form değerlerini güncelle
    if (dynamicValues && typeof dynamicValues === 'object') {
      const dynamicEntries = Object.entries(dynamicValues);
      
      for (const [fieldKey, fieldValue] of dynamicEntries) {
        if (fieldValue !== null && fieldValue !== undefined && fieldValue !== '') {
          await prisma.reservationDynamicValues.upsert({
            where: {
              reservationId_fieldKey: {
                reservationId: reservation.id,
                fieldKey,
              },
            },
            create: {
              id: `dynamic_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              reservationId: reservation.id,
              fieldKey,
              fieldValue: String(fieldValue),
              createdAt: new Date(),
            },
            update: {
              fieldValue: String(fieldValue),
            },
          });
        } else {
          // Boş değer ise sil
          await prisma.reservationDynamicValues.deleteMany({
            where: {
              reservationId: reservation.id,
              fieldKey,
            },
          });
        }
      }
    }

    // Katılımcıları güncelle (önce mevcutları sil, sonra yenilerini ekle)
    if (participants !== undefined) {
      await prisma.reservationParticipants.deleteMany({
        where: { reservationId: reservation.id },
      });

      if (Array.isArray(participants)) {
        for (const participant of participants) {
          if (participant.participantKey) {
            await prisma.reservationParticipants.create({
              data: {
                id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                reservationId: reservation.id,
                participantKey: participant.participantKey,
                adSoyad: participant.adSoyad || null,
                telefon: participant.telefon || null,
                memleket: participant.memleket || null,
                extraJson: participant.extraJson ? JSON.stringify(participant.extraJson) : null,
                createdAt: new Date(),
              },
            });
          }
        }
      }
    }

    // Kapora ödemesi güncelleme mantığı
    if (body.kaporaBilgisi !== undefined) {
      // Mevcut kapora ödemesini bul
      const existingKaporaPayment = await prisma.payments.findFirst({
        where: {
          reservationId: params.id,
          notes: { contains: 'Kapora' },
          isCancelled: false,
        },
      });

      if (body.kaporaBilgisi && body.kaporaBilgisi.kaporaEkle) {
        const { kaporaTutari, kaporaCashBoxId, kaporaPaymentMethod, kaporaPaymentDate, kaporaNotes } = body.kaporaBilgisi;
        
        // Validasyon
        if (!kaporaCashBoxId) {
          return NextResponse.json(
            { error: 'Kapora için kasa seçimi zorunludur' },
            { status: 400 }
          );
        }

        const kaporaAmount = parseFloat(String(kaporaTutari));
        const sozlesmeFiyati = parseFloat(String(reservation.sozlesmeFiyati || 0));
        
        // Kapora tutarı proje bedelini aşamaz
        if (kaporaAmount > sozlesmeFiyati && sozlesmeFiyati > 0) {
          return NextResponse.json(
            { error: 'Kapora tutarı proje bedelini aşamaz' },
            { status: 400 }
          );
        }

        if (kaporaAmount <= 0) {
          return NextResponse.json(
            { error: 'Kapora tutarı 0\'dan büyük olmalıdır' },
            { status: 400 }
          );
        }

        // Kasa kontrolü
        const cashBox = await prisma.cashBox.findUnique({
          where: { id: kaporaCashBoxId },
        });

        if (!cashBox) {
          return NextResponse.json(
            { error: 'Kasa bulunamadı' },
            { status: 404 }
          );
        }

        if (existingKaporaPayment) {
          // Mevcut ödemeyi güncelle (sadece payments tablosunda - cashBoxTransaction oluşturulmamalı)
          await prisma.payments.update({
            where: { id: existingKaporaPayment.id },
            data: {
              amount: kaporaAmount,
              cashBoxId: kaporaCashBoxId,
              paymentMethod: kaporaPaymentMethod || 'Nakit',
              paymentDate: new Date(kaporaPaymentDate || new Date()),
              notes: `Kapora - ${kaporaNotes || ''}`.trim(),
              updatedAt: new Date(),
            },
          });
        } else {
          // Yeni ödeme oluştur (sadece payments tablosuna - cashBoxTransaction oluşturulmamalı)
          // Rezervasyon ödemeleri sadece payments tablosunda tutulur, finans yönetimi sayfası bunları gösterir
          const payment = await prisma.payments.create({
            data: {
              id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              reservationId: reservation.id,
              cashBoxId: kaporaCashBoxId,
              amount: kaporaAmount,
              paymentDate: new Date(kaporaPaymentDate || new Date()),
              paymentMethod: kaporaPaymentMethod || 'Nakit',
              notes: `Kapora - ${kaporaNotes || ''}`.trim(),
              isCancelled: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      } else {
        // Kapora kaldırıldıysa, mevcut kapora ödemesini iptal et
        if (existingKaporaPayment) {
          await prisma.payments.update({
            where: { id: existingKaporaPayment.id },
            data: {
              isCancelled: true,
              cancelledAt: new Date(),
              updatedAt: new Date(),
            },
          });
        }
      }
    }

    // Güncelleme logu
    await logReservationActivity(
      reservation.id,
      'updated',
      'Rezervasyon Güncellendi',
      'Rezervasyon bilgileri güncellendi'
    );

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Rezervasyon başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Reservation PUT error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    return NextResponse.json(
      { 
        error: 'Rezervasyon güncellenemedi', 
        message: error.message || 'Bilinmeyen bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// DELETE endpoint kaldırıldı - Rezervasyonlar artık silinmeyecek, sadece iptal edilecek
// İptal işlemi PUT endpoint'i üzerinden yapılıyor


