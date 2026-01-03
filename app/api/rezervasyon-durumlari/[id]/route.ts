import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Rezervasyon durumu güncelle
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

    const status = await prisma.rezervasyonDurum.findUnique({
      where: { id: params.id },
    });

    if (!status) {
      return NextResponse.json(
        { error: 'Rezervasyon durumu bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, slug, description, color, sortOrder, isActive } = body;

    // Validasyon
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: 'Durum adı boş olamaz' },
        { status: 400 }
      );
    }

    // Slug kontrolü
    let finalSlug = slug || status.slug;
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
    if (finalSlug !== status.slug) {
      const existing = await prisma.rezervasyonDurum.findUnique({
        where: { slug: finalSlug },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Bu slug ile kayıtlı durum zaten mevcut' },
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
    if (description !== undefined) updateData.description = description || null;
    if (color !== undefined) updateData.color = color || '#6b7280';
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Durumu güncelle
    const updatedStatus = await prisma.rezervasyonDurum.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      status: updatedStatus,
      message: 'Rezervasyon durumu başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Rezervasyon durumu PUT error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon durumu güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}


