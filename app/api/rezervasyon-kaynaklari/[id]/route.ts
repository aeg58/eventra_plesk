import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Rezervasyon kaynağı güncelle
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

    const source = await prisma.rezervasyonKaynak.findUnique({
      where: { id: params.id },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Rezervasyon kaynağı bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { name, slug, description, icon, color, sortOrder, isActive } = body;

    // Validasyon
    if (name !== undefined && !name) {
      return NextResponse.json(
        { error: 'Kaynak adı boş olamaz' },
        { status: 400 }
      );
    }

    // Slug kontrolü
    let finalSlug = slug || source.slug;
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
    if (finalSlug !== source.slug) {
      const existing = await prisma.rezervasyonKaynak.findUnique({
        where: { slug: finalSlug },
      });

      if (existing) {
        return NextResponse.json(
          { error: 'Bu slug ile kayıtlı kaynak zaten mevcut' },
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
    if (icon !== undefined) updateData.icon = icon || null;
    if (color !== undefined) updateData.color = color || '#6b7280';
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Kaynağı güncelle
    const updatedSource = await prisma.rezervasyonKaynak.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      source: updatedSource,
      message: 'Rezervasyon kaynağı başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Rezervasyon kaynağı PUT error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon kaynağı güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Rezervasyon kaynağı sil
export async function DELETE(
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

    const source = await prisma.rezervasyonKaynak.findUnique({
      where: { id: params.id },
    });

    if (!source) {
      return NextResponse.json(
        { error: 'Rezervasyon kaynağı bulunamadı' },
        { status: 404 }
      );
    }

    // Kaynağı sil
    await prisma.rezervasyonKaynak.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Rezervasyon kaynağı başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Rezervasyon kaynağı DELETE error:', error);
    return NextResponse.json(
      { error: 'Rezervasyon kaynağı silinemedi', message: error.message },
      { status: 500 }
    );
  }
}


