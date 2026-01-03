import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { generateReservationNumber, findOrCreateCustomer, logReservationActivity } from '@/app/utils/reservation-helpers';
import { sendReservationConfirmationEmail } from '@/app/lib/email';

export const dynamic = 'force-dynamic';

import { validateAuth, checkAuth } from '@/app/lib/auth';

// Rezervasyon listesi (filtreleme ile)
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const durum = searchParams.get('durum');
    const organizasyonGrupId = searchParams.get('organizasyonGrupId');
    const officeId = searchParams.get('officeId');
    const salonId = searchParams.get('salonId');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filtre oluştur
    const where: any = {};

    if (startDate && endDate) {
      where.rezervasyonTarihi = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.rezervasyonTarihi = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.rezervasyonTarihi = {
        lte: new Date(endDate),
      };
    }

    // İptal durumunu varsayılan olarak hariç tut
    if (durum && durum === 'İptal') {
      where.durum = 'İptal';
    } else if (durum && durum !== 'all') {
      where.durum = durum;
    } else {
      // Durum filtresi yoksa veya 'all' ise, iptal hariç tüm durumları getir
      where.durum = {
        not: 'İptal',
      };
    }

    if (organizasyonGrupId) {
      where.organizasyonGrupId = organizasyonGrupId;
    }

    if (officeId) {
      where.officeId = officeId;
    }

    if (salonId) {
      where.salonId = salonId;
    }

    // Arama (müşteri adı, telefon, rezervasyon no)
    if (search) {
      where.OR = [
        { rezervasyonNo: { contains: search } },
        {
          Customer: {
            OR: [
              { adSoyad: { contains: search } },
              { telefon: { contains: search } },
              { email: { contains: search } },
            ],
          },
        },
      ];
    }

    // Rezervasyonları getir
    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          Customer: {
            select: {
              id: true,
              adSoyad: true,
              telefon: true,
              email: true,
            },
          },
        },
        orderBy: {
          rezervasyonTarihi: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.reservation.count({ where }),
    ]);

    // Salon bilgilerini manuel olarak çek
    const salonIds = [...new Set(reservations.map(r => r.salonId).filter(Boolean))];
    const salons = salonIds.length > 0
      ? await prisma.subeler.findMany({
          where: { id: { in: salonIds as string[] } },
          select: { id: true, name: true },
        })
      : [];
    const salonsMap = new Map(salons.map(s => [s.id, s]));

    // Rezervasyonlara salon bilgilerini ekle
    const reservationsWithSalons = reservations.map(reservation => ({
      ...reservation,
      Subeler: reservation.salonId ? salonsMap.get(reservation.salonId) || null : null,
    }));

    return NextResponse.json({
      reservations: reservationsWithSalons,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Reservations GET error:', error);
    return NextResponse.json(
      { error: 'Rezervasyonlar getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni rezervasyon oluştur
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const body = await request.json();
    const {
      // Müşteri bilgileri
      customerAdSoyad,
      customerTelefon,
      customerEmail,
      customerAdres,
      customerId, // Mevcut müşteri ID'si varsa
      
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

    // Validasyon
    if (!organizasyonGrupId || !rezervasyonTarihi) {
      return NextResponse.json(
        { error: 'Organizasyon grubu ve rezervasyon tarihi zorunludur' },
        { status: 400 }
      );
    }

    // Müşteri ID'sini al veya oluştur
    let finalCustomerId = customerId;
    
    if (!finalCustomerId) {
      if (!customerAdSoyad) {
        return NextResponse.json(
          { error: 'Müşteri bilgileri gereklidir' },
          { status: 400 }
        );
      }
      
      finalCustomerId = await findOrCreateCustomer({
        adSoyad: customerAdSoyad,
        telefon: customerTelefon,
        email: customerEmail,
        adres: customerAdres,
      });
    }

    // Rezervasyon numarası üret
    const rezervasyonNo = await generateReservationNumber();

    // Rezervasyon oluştur
    const reservation = await prisma.reservation.create({
      data: {
        id: `reservation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rezervasyonNo,
        customerId: finalCustomerId,
        officeId: officeId || null,
        salonId: salonId || null,
        organizasyonGrupId: organizasyonGrupId || null,
        yetkili: yetkili || null,
        rezervasyonTarihi: rezervasyonTarihi ? new Date(rezervasyonTarihi) : null,
        sozlesmeTarihi: sozlesmeTarihi ? new Date(sozlesmeTarihi) : null,
        zamanDilimi: (zamanDilimi && zamanDilimi.trim() !== '') ? zamanDilimi : null,
        durum: durum || 'Açık',
        paketId: (paketId && paketId.trim() !== '') ? paketId : null,
        davetiSayisi: davetiSayisi ? (isNaN(parseInt(String(davetiSayisi))) ? null : parseInt(String(davetiSayisi))) : null,
        fiyatKisiBasi: fiyatKisiBasi ? (isNaN(parseFloat(String(fiyatKisiBasi))) ? null : parseFloat(String(fiyatKisiBasi))) : null,
        sozlesmeFiyati: sozlesmeFiyati ? (isNaN(parseFloat(String(sozlesmeFiyati))) ? null : parseFloat(String(sozlesmeFiyati))) : null,
        iskonto: iskonto ? (isNaN(parseFloat(String(iskonto))) ? null : parseFloat(String(iskonto))) : null,
        iskontoYuzde: iskontoYuzde || false,
        kdvOrani: kdvOrani ? (isNaN(parseFloat(String(kdvOrani))) ? 0.00 : parseFloat(String(kdvOrani))) : 0.00,
        ozelTeklif: ozelTeklif || false,
        ozelNotlar: ozelNotlar || null,
        ekstraNotu: ekstraNotu || null,
        kaynakId: kaynakId || null,
        sozlesmeKontrati: sozlesmeKontrati || null,
        kontratSahibiAdSoyad: kontratSahibiAdSoyad || null,
        kontratSahibiTelefon: kontratSahibiTelefon || null,
        kontratSahibiTc: kontratSahibiTc || null,
        kontratAdresi: kontratAdresi || null,
        faturaIstiyorum: faturaIstiyorum || false,
        faturaUnvani: faturaUnvani || null,
        faturaVergiDairesi: faturaVergiDairesi || null,
        faturaVergiNo: faturaVergiNo || null,
        faturaAdresi: faturaAdresi || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        Customer: true,
      },
    });

    // Dinamik form değerlerini kaydet
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
        }
      }
    }

    // Katılımcıları kaydet
    if (participants && Array.isArray(participants)) {
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

    // Aktivite logu
    await logReservationActivity(
      reservation.id,
      'created',
      'Rezervasyon Oluşturuldu',
      `Rezervasyon ${rezervasyonNo} oluşturuldu`,
      undefined,
      undefined,
      undefined,
      JSON.stringify({ rezervasyonNo, durum: reservation.durum })
    );

    // Kapora ödemesi oluştur (eğer kapora bilgisi varsa)
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

      // Ödeme oluştur (sadece payments tablosuna - cashBoxTransaction oluşturulmamalı)
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

      // Kasa bakiyesini güncelle (cashBoxTransaction oluşturulmamalı - çift kayıt önlemek için)
      // Kasa bakiyesi güncellemesi sadece genel işlemler için cashBoxTransaction ile yapılır
      // Rezervasyon ödemeleri için kasa bakiyesi güncellemesi yapılmaz (payments tablosunda tutulur)
    }

    // E-posta gönder (eğer müşteri email'i varsa)
    if (reservation.Customer.email) {
      try {
        await sendReservationConfirmationEmail(reservation.Customer.email, {
          rezervasyonNo,
          rezervasyonTarihi: reservation.rezervasyonTarihi || new Date(),
          musteriAdi: reservation.Customer.adSoyad,
          durum: reservation.durum || 'Açık',
        });
      } catch (emailError) {
        // Email hatası rezervasyon oluşturmayı engellememeli
        console.error('Email gönderme hatası:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      reservation,
      message: 'Rezervasyon başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Reservation POST error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    // Prisma hatalarını daha detaylı göster
    let errorMessage = error.message || 'Rezervasyon oluşturulamadı';
    let statusCode = 500;
    
    if (error.code === 'P2002') {
      errorMessage = 'Bu rezervasyon zaten mevcut (unique constraint)';
      statusCode = 409;
    } else if (error.code === 'P2003') {
      errorMessage = 'Geçersiz referans (foreign key constraint)';
      statusCode = 400;
    } else if (error.code === 'P2025') {
      errorMessage = 'Kayıt bulunamadı';
      statusCode = 404;
    }
    
    return NextResponse.json(
      { 
        error: 'Rezervasyon oluşturulamadı', 
        message: errorMessage,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: statusCode }
    );
  }
}

