import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { sendPaymentReminderEmail } from '@/app/lib/email';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Ödeme listesi (filtreleme ile)
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const reservationId = searchParams.get('reservationId');
    const cashBoxId = searchParams.get('cashBoxId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const isCancelled = searchParams.get('isCancelled');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filtre oluştur
    const where: any = {};

    if (reservationId) {
      where.reservationId = reservationId;
    }

    if (cashBoxId) {
      where.cashBoxId = cashBoxId;
    }

    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.paymentDate = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.paymentDate = {
        lte: new Date(endDate),
      };
    }

    if (isCancelled !== null) {
      where.isCancelled = isCancelled === 'true';
    }

    // Ödemeleri getir
    const [payments, total] = await Promise.all([
      prisma.payments.findMany({
        where,
        include: {
          Reservation: {
            select: {
              id: true,
              rezervasyonNo: true,
              Customer: {
                select: {
                  id: true,
                  adSoyad: true,
                },
              },
            },
          },
          CashBox: {
            select: {
              id: true,
              kasaAdi: true,
              tur: true,
            },
          },
        },
        orderBy: {
          paymentDate: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.payments.count({ where }),
    ]);

    return NextResponse.json({
      payments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Payments GET error:', error);
    return NextResponse.json(
      { error: 'Ödemeler getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni ödeme oluştur
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { reservationId, cashBoxId, amount, paymentDate, paymentMethod, notes } = body;

    // Validasyon
    if (!reservationId || !amount || !paymentDate) {
      return NextResponse.json(
        { error: 'Rezervasyon ID, tutar ve ödeme tarihi gereklidir' },
        { status: 400 }
      );
    }

    // Rezervasyonu kontrol et
    const reservation = await prisma.reservation.findUnique({
      where: { id: reservationId },
      include: {
        Customer: {
          select: {
            id: true,
            adSoyad: true,
            email: true,
          },
        },
      },
    });

    if (!reservation) {
      return NextResponse.json(
        { error: 'Rezervasyon bulunamadı' },
        { status: 404 }
      );
    }

    // Kasa kontrolü (eğer belirtilmişse)
    if (cashBoxId) {
      const cashBox = await prisma.cashBox.findUnique({
        where: { id: cashBoxId },
      });

      if (!cashBox) {
        return NextResponse.json(
          { error: 'Kasa bulunamadı' },
          { status: 404 }
        );
      }
    }

    // Tutar validasyonu (negatif tutarlar iade için kabul edilir)
    const paymentAmount = parseFloat(String(amount));
    if (isNaN(paymentAmount) || paymentAmount === 0) {
      return NextResponse.json(
        { error: 'Geçerli bir tutar girin (0\'dan farklı olmalıdır)' },
        { status: 400 }
      );
    }

    if (Math.abs(paymentAmount) > 1000000000) {
      return NextResponse.json(
        { error: 'Tutar çok büyük (maksimum: 1.000.000.000 ₺)' },
        { status: 400 }
      );
    }

    // İade işlemi kontrolü (negatif tutar)
    const isRefund = paymentAmount < 0;

    // Ödeme oluştur (sadece payments tablosuna - cashBoxTransaction oluşturulmamalı)
    // Rezervasyon ödemeleri sadece payments tablosunda tutulur, finans yönetimi sayfası bunları gösterir
    const payment = await prisma.payments.create({
      data: {
        id: `payment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        reservationId,
        cashBoxId: cashBoxId || null,
        amount: paymentAmount,
        paymentDate: new Date(paymentDate),
        paymentMethod: paymentMethod || null,
        notes: notes || null,
        isCancelled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        Reservation: {
          select: {
            rezervasyonNo: true,
            Customer: {
              select: {
                adSoyad: true,
              },
            },
          },
        },
        CashBox: {
          select: {
            kasaAdi: true,
          },
        },
      },
    });

    // Kasa bakiyesini güncelle (cashBoxTransaction oluşturulmamalı - çift kayıt önlemek için)
    // Kasa bakiyesi güncellemesi sadece genel işlemler için cashBoxTransaction ile yapılır
    // Rezervasyon ödemeleri için kasa bakiyesi güncellemesi yapılmaz (payments tablosunda tutulur)

    // Bekleyen ödeme kontrolü ve email gönderimi
    if (reservation) {
      const totalPayments = await prisma.payments.aggregate({
        where: {
          reservationId,
          isCancelled: false,
        },
        _sum: {
          amount: true,
        },
      });

      const totalPaid = totalPayments._sum.amount
        ? parseFloat(String(totalPayments._sum.amount))
        : 0;

      const totalAmount = reservation.sozlesmeFiyati
        ? parseFloat(String(reservation.sozlesmeFiyati))
        : 0;

      const pendingAmount = totalAmount - totalPaid;

      // Rezervasyon durumunu güncelle (ödemeler tamamlandıysa)
      if (pendingAmount <= 0 && reservation.durum !== 'İptal') {
        // Ödeme tamamlandı, durumu "Kesin" veya "Ödendi" olarak güncelle
        // Eğer durum "Açık" ise "Kesin" yap, zaten "Kesin" ise değiştirme
        if (reservation.durum === 'Açık') {
          await prisma.reservation.update({
            where: { id: reservationId },
            data: {
              durum: 'Kesin',
              updatedAt: new Date(),
            },
          });
        }
      }

      // Eğer hala bekleyen ödeme varsa ve müşteri email'i varsa hatırlatma gönder
      if (pendingAmount > 0 && reservation.Customer?.email) {
        try {
          await sendPaymentReminderEmail(reservation.Customer.email, {
            rezervasyonNo: reservation.rezervasyonNo || reservation.id,
            rezervasyonTarihi: reservation.rezervasyonTarihi || new Date(),
            musteriAdi: reservation.Customer.adSoyad,
            bekleyenTutar: pendingAmount,
          });
        } catch (emailError) {
          console.error('Email gönderme hatası:', emailError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      payment,
      message: 'Ödeme başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Payment POST error:', error);
    return NextResponse.json(
      { error: 'Ödeme oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}

