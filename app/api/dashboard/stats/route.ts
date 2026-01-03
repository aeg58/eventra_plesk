import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Dashboard istatistikleri
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

    // Tarih filtresi
    const dateFilter: any = {};
    if (startDate && endDate) {
      dateFilter.rezervasyonTarihi = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else {
      // Varsayılan: Bu ay
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      dateFilter.rezervasyonTarihi = {
        gte: firstDay,
        lte: lastDay,
      };
    }

    // Toplam rezervasyon sayısı
    const totalReservations = await prisma.reservation.count({
      where: dateFilter,
    });

    // Durumlara göre rezervasyon sayıları
    const reservationsByStatus = await prisma.reservation.groupBy({
      by: ['durum'],
      where: dateFilter,
      _count: {
        id: true,
      },
    });

    // Toplam gelir (sözleşme fiyatı toplamı)
    const revenueResult = await prisma.reservation.aggregate({
      where: {
        ...dateFilter,
        durum: {
          not: 'İptal',
        },
      },
      _sum: {
        sozlesmeFiyati: true,
      },
    });

    const totalRevenue = revenueResult._sum.sozlesmeFiyati
      ? parseFloat(String(revenueResult._sum.sozlesmeFiyati))
      : 0;

    // Toplam ödemeler
    const paymentsResult = await prisma.payments.aggregate({
      where: {
        isCancelled: false,
        paymentDate: dateFilter.rezervasyonTarihi,
      },
      _sum: {
        amount: true,
      },
    });

    const totalPayments = paymentsResult._sum.amount
      ? parseFloat(String(paymentsResult._sum.amount))
      : 0;

    // Bekleyen ödeme (toplam gelir - ödenen)
    const pendingPayment = totalRevenue - totalPayments;

    // Toplam müşteri sayısı
    const totalCustomers = await prisma.customer.count();

    // Bu ay yeni müşteriler
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const newCustomersThisMonth = await prisma.customer.count({
      where: {
        createdAt: {
          gte: firstDayOfMonth,
        },
      },
    });

    // Aktif rezervasyonlar (Açık veya Kesin)
    const activeReservations = await prisma.reservation.count({
      where: {
        ...dateFilter,
        durum: {
          in: ['Açık', 'Kesin'],
        },
      },
    });

    // İptal edilen rezervasyonlar
    const cancelledReservations = await prisma.reservation.count({
      where: {
        ...dateFilter,
        durum: 'İptal',
      },
    });

    // Durum dağılımı
    const statusDistribution: Record<string, number> = {};
    reservationsByStatus.forEach((item) => {
      statusDistribution[item.durum || 'Belirtilmemiş'] = item._count.id;
    });

    return NextResponse.json({
      stats: {
        totalReservations,
        activeReservations,
        cancelledReservations,
        totalRevenue,
        totalPayments,
        pendingPayment,
        totalCustomers,
        newCustomersThisMonth,
        statusDistribution,
      },
    });
  } catch (error: any) {
    console.error('Dashboard stats GET error:', error);
    return NextResponse.json(
      { error: 'İstatistikler getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}


