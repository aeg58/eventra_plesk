import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

export async function GET() {
  try {
    const cities = await prisma.sehirler.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    return NextResponse.json(cities);
  } catch (error: any) {
    console.error('Error fetching cities:', error);
    return NextResponse.json(
      { error: 'Şehirler getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni şehir oluştur
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
    const { name, slug, sortOrder, isActive } = body;

    // Validasyon
    if (!name) {
      return NextResponse.json(
        { error: 'Şehir adı gereklidir' },
        { status: 400 }
      );
    }

    // Slug oluştur (eğer verilmemişse)
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = name
        .toLowerCase()
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ı/g, 'i')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Slug benzersizliğini kontrol et
    const existing = await prisma.sehirler.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bu slug ile kayıtlı şehir zaten mevcut' },
        { status: 409 }
      );
    }

    // Yeni şehir oluştur
    const city = await prisma.sehirler.create({
      data: {
        id: `city_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        slug: finalSlug,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      city,
      message: 'Şehir başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('City POST error:', error);
    return NextResponse.json(
      { error: 'Şehir oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}

