import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Gelir raporu
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const groupBy = searchParams.get('groupBy') || 'month'; // day, week, month, year

    // Tarih filtresi
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate ve endDate parametreleri gereklidir' },
        { status: 400 }
      );
    }

    const dateFilter = {
      rezervasyonTarihi: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
      durum: {
        not: 'İptal',
      },
    };

    // Rezervasyonları getir
    const reservations = await prisma.reservation.findMany({
      where: dateFilter,
      select: {
        id: true,
        rezervasyonNo: true,
        rezervasyonTarihi: true,
        sozlesmeFiyati: true,
        iskonto: true,
        iskontoYuzde: true,
        kdvOrani: true,
        durum: true,
        Customer: {
          select: {
            adSoyad: true,
          },
        },
        Payments: {
          select: {
            amount: true,
            paymentDate: true,
            isCancelled: true,
          },
        },
      },
      orderBy: {
        rezervasyonTarihi: 'asc',
      },
    });

    // Toplam gelir
    const totalRevenue = reservations.reduce((sum, r) => {
      const price = r.sozlesmeFiyati ? parseFloat(String(r.sozlesmeFiyati)) : 0;
      return sum + price;
    }, 0);

    // Toplam ödemeler
    const totalPayments = reservations.reduce((sum, r) => {
      const paid = r.Payments
        .filter((p) => !p.isCancelled)
        .reduce((pSum, p) => pSum + parseFloat(String(p.amount)), 0);
      return sum + paid;
    }, 0);

    // Bekleyen ödeme
    const pendingPayment = totalRevenue - totalPayments;

    // Gruplama (aylık, haftalık, günlük)
    const groupedData: Record<string, { revenue: number; count: number }> = {};

    reservations.forEach((reservation) => {
      if (!reservation.rezervasyonTarihi) return;

      const date = new Date(reservation.rezervasyonTarihi);
      let key = '';

      switch (groupBy) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        case 'year':
          key = String(date.getFullYear());
          break;
        default:
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      }

      if (!groupedData[key]) {
        groupedData[key] = { revenue: 0, count: 0 };
      }

      const price = reservation.sozlesmeFiyati
        ? parseFloat(String(reservation.sozlesmeFiyati))
        : 0;
      groupedData[key].revenue += price;
      groupedData[key].count += 1;
    });

    return NextResponse.json({
      report: {
        totalRevenue,
        totalPayments,
        pendingPayment,
        reservationCount: reservations.length,
        groupedData,
        reservations: reservations.map((r) => ({
          id: r.id,
          rezervasyonNo: r.rezervasyonNo,
          tarih: r.rezervasyonTarihi,
          fiyat: r.sozlesmeFiyati,
          durum: r.durum,
          musteri: r.Customer.adSoyad,
          odeme: r.Payments.filter((p) => !p.isCancelled).reduce(
            (sum, p) => sum + parseFloat(String(p.amount)),
            0
          ),
        })),
      },
    });
  } catch (error: any) {
    console.error('Revenue report GET error:', error);
    return NextResponse.json(
      { error: 'Gelir raporu getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}


