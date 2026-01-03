import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Şehir güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const city = await prisma.sehirler.findUnique({
      where: { id: params.id },
    });

    if (!city) {
      return NextResponse.json(
        { error: 'Şehir bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, slug, sortOrder, isActive } = body;

    // Validasyon
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: 'Şehir adı boş olamaz' },
        { status: 400 }
      );
    }

    // Slug kontrolü
    let finalSlug = slug || city.slug;
    if (name && !slug) {
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

    // Slug benzersizliğini kontrol et (kendisi hariç)
    if (finalSlug !== city.slug) {
      const existing = await prisma.sehirler.findUnique({
        where: { slug: finalSlug },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Bu slug ile kayıtlı şehir zaten mevcut' },
          { status: 409 }
        );
      }
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (slug !== undefined || name) updateData.slug = finalSlug;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Şehri güncelle
    const updatedCity = await prisma.sehirler.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      city: updatedCity,
      message: 'Şehir başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('City PUT error:', error);
    return NextResponse.json(
      { error: 'Şehir güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}


