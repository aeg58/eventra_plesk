import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Rezervasyon raporu
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
    const durum = searchParams.get('durum');
    const organizasyonGrupId = searchParams.get('organizasyonGrupId');

    // Tarih filtresi
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate ve endDate parametreleri gereklidir' },
        { status: 400 }
      );
    }

    const where: any = {
      rezervasyonTarihi: {
        gte: new Date(startDate),
        lte: new Date(endDate),
      },
    };

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

    // Organizasyon gruplarını ve salonları önce getir
    const orgGroups = await prisma.organizasyonGrup.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const orgGroupsMap = new Map(orgGroups.map(og => [og.id, og.name]));

    const salons = await prisma.subeler.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    const salonsMap = new Map(salons.map(s => [s.id, s.name]));

    // Rezervasyonları getir
    const reservations = await prisma.reservation.findMany({
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
        ReservationDynamicValues: {
          select: {
            fieldKey: true,
            fieldValue: true,
          },
        },
      },
      orderBy: {
        rezervasyonTarihi: 'asc',
      },
    });

    // Durumlara göre grupla
    const byStatus: Record<string, number> = {};
    reservations.forEach((r) => {
      const status = r.durum || 'Belirtilmemiş';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });

    // Organizasyon gruplarına göre grupla (organizasyon adı ile)
    const byOrganization: Record<string, number> = {};
    reservations.forEach((r) => {
      const orgName = r.organizasyonGrupId 
        ? (orgGroupsMap.get(r.organizasyonGrupId) || 'Belirtilmemiş')
        : 'Belirtilmemiş';
      byOrganization[orgName] = (byOrganization[orgName] || 0) + 1;
    });

    // Aylık dağılım
    const byMonth: Record<string, number> = {};
    reservations.forEach((r) => {
      if (r.rezervasyonTarihi) {
        const date = new Date(r.rezervasyonTarihi);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        byMonth[monthKey] = (byMonth[monthKey] || 0) + 1;
      }
    });

    return NextResponse.json({
      report: {
        totalReservations: reservations.length,
        byStatus,
        byOrganization,
        byMonth,
        reservations: reservations.map((r) => ({
          id: r.id,
          rezervasyonNo: r.rezervasyonNo,
          tarih: r.rezervasyonTarihi,
          zamanDilimi: r.zamanDilimi || '-',
          durum: r.durum,
          musteri: r.Customer.adSoyad,
          telefon: r.Customer.telefon,
          email: r.Customer.email,
          fiyat: r.sozlesmeFiyati,
          davetiSayisi: r.davetiSayisi,
          organizasyonAdi: r.organizasyonGrupId 
            ? (orgGroupsMap.get(r.organizasyonGrupId) || '-')
            : '-',
          salonAdi: r.salonId 
            ? (salonsMap.get(r.salonId) || '-')
            : '-',
        })),
      },
    });
  } catch (error: any) {
    console.error('Reservations report GET error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon raporu getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}


