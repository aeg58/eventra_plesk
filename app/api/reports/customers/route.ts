import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Müşteri raporu
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

    // Müşterileri getir
    const customers = await prisma.customer.findMany({
      include: {
        Reservation: {
          where: startDate && endDate
            ? {
                rezervasyonTarihi: {
                  gte: new Date(startDate),
                  lte: new Date(endDate),
                },
                durum: {
                  not: 'İptal',
                },
              }
            : {
                durum: {
                  not: 'İptal',
                },
              },
          select: {
            id: true,
            rezervasyonNo: true,
            rezervasyonTarihi: true,
            durum: true,
            sozlesmeFiyati: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Müşteri istatistikleri
    const customerStats = customers.map((customer) => {
      const reservations = customer.Reservation || [];
      const totalReservations = reservations.length;
      const totalRevenue = reservations.reduce(
        (sum, r) => sum + (r.sozlesmeFiyati ? parseFloat(String(r.sozlesmeFiyati)) : 0),
        0
      );
      const activeReservations = reservations.filter(
        (r) => r.durum === 'Açık' || r.durum === 'Kesin'
      ).length;

      return {
        customerId: customer.id,
        adSoyad: customer.adSoyad,
        telefon: customer.telefon,
        email: customer.email,
        totalReservations,
        totalRevenue,
        activeReservations,
        firstReservation: reservations.length > 0
          ? reservations[reservations.length - 1].rezervasyonTarihi
          : null,
        lastReservation: reservations.length > 0
          ? reservations[0].rezervasyonTarihi
          : null,
      };
    });

    // Toplam müşteri sayısı
    const totalCustomers = customers.length;

    // Yeni müşteriler (son 30 gün)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newCustomers = customers.filter(
      (c) => c.createdAt && new Date(c.createdAt) >= thirtyDaysAgo
    ).length;

    // En çok rezervasyon yapan müşteriler
    const topCustomers = customerStats
      .sort((a, b) => b.totalReservations - a.totalReservations)
      .slice(0, 10);

    // En çok gelir getiren müşteriler
    const topRevenueCustomers = customerStats
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 10);

    return NextResponse.json({
      report: {
        totalCustomers,
        newCustomers,
        topCustomers,
        topRevenueCustomers,
        customers: customerStats,
      },
    });
  } catch (error: any) {
    console.error('Customers report GET error:', error);
    return NextResponse.json(
      { error: 'Müşteri raporu getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}


