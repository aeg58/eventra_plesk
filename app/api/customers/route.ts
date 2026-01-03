import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Müşteri listesi (arama ve filtreleme ile)
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
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filtre oluştur
    const where: any = {};

    // Arama (ad, telefon, email)
    if (search) {
      where.OR = [
        { adSoyad: { contains: search } },
        { telefon: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Müşterileri getir
    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          Reservation: {
            select: {
              id: true,
              rezervasyonNo: true,
              rezervasyonTarihi: true,
              durum: true,
              sozlesmeFiyati: true,
              davetiSayisi: true,
              organizasyonGrupId: true,
              salonId: true,
            },
            orderBy: {
              rezervasyonTarihi: 'desc',
            },
            take: 10, // Son 10 rezervasyon
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    // Organizasyon gruplarını ve salonları çek
    const orgGroupIds = [...new Set(customers.flatMap(c => 
      c.Reservation?.map(r => r.organizasyonGrupId).filter(Boolean) || []
    ))];
    const salonIds = [...new Set(customers.flatMap(c => 
      c.Reservation?.map(r => r.salonId).filter(Boolean) || []
    ))];

    const [orgGroups, salons] = await Promise.all([
      orgGroupIds.length > 0 
        ? prisma.organizasyonGrup.findMany({
            where: { id: { in: orgGroupIds as string[] } },
            select: { id: true, name: true, slug: true },
          })
        : [],
      salonIds.length > 0
        ? prisma.subeler.findMany({
            where: { id: { in: salonIds as string[] } },
            select: { id: true, name: true },
          })
        : [],
    ]);

    const orgGroupsMap = new Map(orgGroups.map(og => [og.id, og]));
    const salonsMap = new Map(salons.map(s => [s.id, s]));

    // Rezervasyonlara organizasyon ve salon bilgilerini ekle
    const customersWithDetails = customers.map(customer => ({
      ...customer,
      Reservation: customer.Reservation?.map(reservation => ({
        ...reservation,
        OrganizasyonGrup: reservation.organizasyonGrupId 
          ? orgGroupsMap.get(reservation.organizasyonGrupId) || null
          : null,
        Subeler: reservation.salonId
          ? salonsMap.get(reservation.salonId) || null
          : null,
      })),
    }));

    return NextResponse.json({
      customers: customersWithDetails,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Customers GET error:', error);
    return NextResponse.json(
      { error: 'Müşteriler getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni müşteri oluştur
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { adSoyad, telefon, email, adres } = body;

    // Validasyon
    if (!adSoyad) {
      return NextResponse.json(
        { error: 'Ad Soyad gereklidir' },
        { status: 400 }
      );
    }

    // Telefon veya email ile mevcut müşteriyi kontrol et
    if (telefon) {
      const existingByPhone = await prisma.customer.findFirst({
        where: { telefon },
      });
      
      if (existingByPhone) {
        return NextResponse.json(
          { error: 'Bu telefon numarası ile kayıtlı müşteri zaten mevcut', customer: existingByPhone },
          { status: 409 }
        );
      }
    }

    if (email) {
      const existingByEmail = await prisma.customer.findFirst({
        where: { email },
      });
      
      if (existingByEmail) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi ile kayıtlı müşteri zaten mevcut', customer: existingByEmail },
          { status: 409 }
        );
      }
    }

    // Yeni müşteri oluştur
    const customer = await prisma.customer.create({
      data: {
        id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        adSoyad,
        telefon: telefon || null,
        email: email || null,
        adres: adres || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      customer,
      message: 'Müşteri başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Customer POST error:', error);
    return NextResponse.json(
      { error: 'Müşteri oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}


