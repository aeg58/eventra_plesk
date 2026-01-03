import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Rezervasyon durumları listesi
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

    const statuses = await prisma.rezervasyonDurum.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json({ statuses });
  } catch (error: any) {
    console.error('Rezervasyon durumları GET error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon durumları getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni rezervasyon durumu oluştur
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
    const { name, slug, description, color, sortOrder, isActive } = body;

    // Validasyon
    if (!name) {
      return NextResponse.json(
        { error: 'Durum adı gereklidir' },
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
    const existing = await prisma.rezervasyonDurum.findUnique({
      where: { slug: finalSlug },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Bu slug ile kayıtlı durum zaten mevcut' },
        { status: 409 }
      );
    }

    // Yeni durum oluştur
    const status = await prisma.rezervasyonDurum.create({
      data: {
        id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        slug: finalSlug,
        description: description || null,
        color: color || '#6b7280',
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      status,
      message: 'Rezervasyon durumu başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Rezervasyon durumu POST error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon durumu oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}


