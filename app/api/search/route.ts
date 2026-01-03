import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Global arama
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
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all'; // all, reservation, customer, salon

    if (!query || query.trim().length < 2) {
      return NextResponse.json({
        results: [],
        message: 'Arama sorgusu en az 2 karakter olmalıdır'
      });
    }

    const searchQuery = query.trim();
    const results: any[] = [];

    // Rezervasyon araması
    if (type === 'all' || type === 'reservation') {
      const reservations = await prisma.reservation.findMany({
        where: {
          OR: [
            { rezervasyonNo: { contains: searchQuery } },
            { yetkili: { contains: searchQuery } },
            { ozelNotlar: { contains: searchQuery } },
            { ekstraNotu: { contains: searchQuery } },
            {
              Customer: {
                OR: [
                  { adSoyad: { contains: searchQuery } },
                  { telefon: { contains: searchQuery } },
                  { email: { contains: searchQuery } },
                ]
              }
            }
          ]
        },
        include: {
          Customer: {
            select: {
              id: true,
              adSoyad: true,
              telefon: true,
              email: true,
            }
          },
          OrganizasyonGrup: {
            select: {
              id: true,
              name: true,
              slug: true,
            }
          }
        },
        take: 10,
        orderBy: {
          rezervasyonTarihi: 'desc'
        }
      });

      reservations.forEach(r => {
        results.push({
          type: 'reservation',
          id: r.id,
          title: r.rezervasyonNo || 'Rezervasyon',
          subtitle: r.Customer?.adSoyad || 'Müşteri bilgisi yok',
          description: `${r.OrganizasyonGrup?.name || ''} - ${r.rezervasyonTarihi ? new Date(r.rezervasyonTarihi).toLocaleDateString('tr-TR') : ''}`,
          url: `/rezervasyon/${r.id}`,
          icon: 'calendar'
        });
      });
    }

    // Müşteri araması
    if (type === 'all' || type === 'customer') {
      const customers = await prisma.customer.findMany({
        where: {
          OR: [
            { adSoyad: { contains: searchQuery } },
            { telefon: { contains: searchQuery } },
            { email: { contains: searchQuery } },
            { adres: { contains: searchQuery } },
          ]
        },
        take: 10,
        orderBy: {
          createdAt: 'desc'
        }
      });

      customers.forEach(c => {
        results.push({
          type: 'customer',
          id: c.id,
          title: c.adSoyad || 'İsimsiz Müşteri',
          subtitle: c.telefon || c.email || 'İletişim bilgisi yok',
          description: c.email || c.adres || '',
          url: `/musteriler/aktif?customerId=${c.id}`,
          icon: 'user'
        });
      });
    }

    // Salon araması
    if (type === 'all' || type === 'salon') {
      const salons = await prisma.subeler.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { description: { contains: searchQuery } },
          ],
          isActive: true
        },
        take: 10,
        orderBy: {
          name: 'asc'
        }
      });

      salons.forEach(s => {
        results.push({
          type: 'salon',
          id: s.id,
          title: s.name,
          subtitle: s.description || '',
          description: '',
          url: `/ayarlar/salon/tanimlar?salonId=${s.id}`,
          icon: 'building'
        });
      });
    }

    // Organizasyon grubu araması
    if (type === 'all' || type === 'organization') {
      const orgs = await prisma.organizasyonGrup.findMany({
        where: {
          OR: [
            { name: { contains: searchQuery } },
            { description: { contains: searchQuery } },
          ],
          active: true
        },
        take: 10,
        orderBy: {
          name: 'asc'
        }
      });

      orgs.forEach(o => {
        results.push({
          type: 'organization',
          id: o.id,
          title: o.name,
          subtitle: o.description || '',
          description: '',
          url: `/ayarlar/organizasyon/gruplar?groupId=${o.id}`,
          icon: 'event'
        });
      });
    }

    return NextResponse.json({
      results: results.slice(0, 20), // Maksimum 20 sonuç
      count: results.length
    });
  } catch (error: any) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: 'Arama yapılırken bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

