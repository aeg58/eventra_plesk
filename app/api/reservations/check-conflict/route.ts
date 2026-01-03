import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Rezervasyon çakışması kontrolü
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
    const rezervasyonTarihi = searchParams.get('rezervasyonTarihi');
    const officeId = searchParams.get('officeId'); // Şube kontrolü
    const salonId = searchParams.get('salonId');
    const zamanDilimi = searchParams.get('zamanDilimi');
    const excludeReservationId = searchParams.get('excludeReservationId'); // Düzenleme modunda mevcut rezervasyonu hariç tut

    // Parametre kontrolü - salonId ve zamanDilimi zorunlu, officeId opsiyonel (ama kontrol edilmeli)
    if (!rezervasyonTarihi || !salonId || !zamanDilimi) {
      return NextResponse.json(
        { error: 'Rezervasyon tarihi, salon ve zaman dilimi gereklidir' },
        { status: 400 }
      );
    }

    // Tarihi parse et (günün başı ve sonu)
    const date = new Date(rezervasyonTarihi);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Çakışan rezervasyonları bul
    // Organizasyon türü fark etmeksizin, sadece şube + salon + tarih + zaman dilimi kontrol edilir
    const where: any = {
      rezervasyonTarihi: {
        gte: startOfDay,
        lte: endOfDay,
      },
      salonId: salonId,
      zamanDilimi: zamanDilimi,
      durum: {
        not: 'İptal', // İptal edilen rezervasyonlar çakışma sayılmaz
      },
    };

    // Şube kontrolü (eğer officeId verilmişse)
    if (officeId) {
      where.officeId = officeId;
    }

    // Düzenleme modunda mevcut rezervasyonu hariç tut
    if (excludeReservationId) {
      where.id = {
        not: excludeReservationId,
      };
    }

    const conflictingReservations = await prisma.reservation.findMany({
      where,
      include: {
        Customer: {
          select: {
            adSoyad: true,
            telefon: true,
          },
        },
      },
      orderBy: {
        rezervasyonTarihi: 'asc',
      },
    });

    if (conflictingReservations.length > 0) {
      return NextResponse.json({
        hasConflict: true,
        conflictingReservations: conflictingReservations.map(r => ({
          id: r.id,
          rezervasyonNo: r.rezervasyonNo,
          durum: r.durum,
          musteriAdi: r.Customer?.adSoyad || 'Bilinmiyor',
          musteriTelefon: r.Customer?.telefon || '',
        })),
        message: `Bu tarih ve saatte ${conflictingReservations.length} rezervasyon mevcut`,
      });
    }

    return NextResponse.json({
      hasConflict: false,
      message: 'Bu saatte rezervasyon yok',
    });
  } catch (error: any) {
    console.error('Check conflict error:', error);
    return NextResponse.json(
      { error: 'Çakışma kontrolü yapılamadı', message: error.message },
      { status: 500 }
    );
  }
}

