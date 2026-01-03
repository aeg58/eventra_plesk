import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Tüm birimleri getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const units = await prisma.genelBirim.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json({ units });
  } catch (error) {
    console.error('Error fetching units:', error);
    return NextResponse.json(
      { error: 'Birimler getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni birim oluştur
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, code, slug, description, category, symbol, sortOrder, isDefault, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Birim adı gerekli' },
        { status: 400 }
      );
    }

    // Slug oluştur
    const generatedSlug = slug || name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    // Eğer isDefault true ise, diğer birimlerin isDefault'unu false yap
    if (isDefault) {
      await prisma.genelBirim.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });
    }

    const newUnit = await prisma.genelBirim.create({
      data: {
        id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        code: code || null,
        slug: generatedSlug,
        description: description || null,
        category: category || null,
        symbol: symbol || null,
        sortOrder: sortOrder !== undefined ? sortOrder : 0,
        isDefault: isDefault || false,
        isActive: isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, unit: newUnit, message: 'Birim başarıyla oluşturuldu' });
  } catch (error: any) {
    console.error('Create unit error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Birim güncelle
export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, code, slug, description, category, symbol, sortOrder, isDefault, isActive } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Birim ID ve adı gerekli' },
        { status: 400 }
      );
    }

    // Eğer isDefault true ise, diğer birimlerin isDefault'unu false yap
    if (isDefault) {
      await prisma.genelBirim.updateMany({
        where: {
          isDefault: true,
          id: { not: id },
        },
        data: { isDefault: false },
      });
    }

    const updateData: any = {
      name,
      updatedAt: new Date(),
    };

    if (code !== undefined) updateData.code = code;
    if (slug !== undefined) updateData.slug = slug;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (symbol !== undefined) updateData.symbol = symbol;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updatedUnit = await prisma.genelBirim.update({
      where: { id: String(id) },
      data: updateData,
    });

    return NextResponse.json({ success: true, unit: updatedUnit, message: 'Birim başarıyla güncellendi' });
  } catch (error: any) {
    console.error('Update unit error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Birim sil
export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Birim ID gerekli' },
        { status: 400 }
      );
    }

    await prisma.genelBirim.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: 'Birim başarıyla silindi' });
  } catch (error: any) {
    console.error('Delete unit error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

