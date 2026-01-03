import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Takvim için rezervasyon listesi
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Authentication kontrolü
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

    // Tarih aralığı zorunlu
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate ve endDate parametreleri gereklidir' },
        { status: 400 }
      );
    }

    // Tarihleri local timezone'da parse et (timezone sorunlarını önlemek için)
    // startDate'i günün başına, endDate'i günün sonuna ayarla
    // YYYY-MM-DD formatındaki tarihleri local timezone'da parse et
    const parseLocalDate = (dateStr: string, isEndOfDay: boolean = false): Date => {
      const [year, month, day] = dateStr.split('-').map(Number);
      const date = new Date(year, month - 1, day);
      if (isEndOfDay) {
        date.setHours(23, 59, 59, 999);
      } else {
        date.setHours(0, 0, 0, 0);
      }
      return date;
    };
    
    const startDateObj = parseLocalDate(startDate, false);
    const endDateObj = parseLocalDate(endDate, true);

    // Filtre oluştur - rezervasyonTarihi null olmayan ve tarih aralığı içindeki rezervasyonlar
    const where: any = {
      rezervasyonTarihi: {
        not: null, // Null olmayan rezervasyonlar
        gte: startDateObj,
        lte: endDateObj,
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

    if (officeId) {
      where.officeId = officeId;
    }

    if (salonId) {
      where.salonId = salonId;
    }

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

    return NextResponse.json({ reservations });
  } catch (error: any) {
    console.error('Calendar reservations GET error:', error);
    return NextResponse.json(
      { error: 'Takvim rezervasyonları getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}


