import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Tüm organizasyon paketlerini getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (groupId) {
      where.groupId = groupId;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const packages = await prisma.organizasyonPaketler.findMany({
      where,
      include: {
        OrganizasyonGrup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json({ packages });
  } catch (error) {
    console.error('Error fetching organization packages:', error);
    return NextResponse.json(
      { error: 'Organizasyon paketleri getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni paket oluştur
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const {
      name,
      description,
      groupId,
      price,
      perPersonPrice,
      minGuests,
      maxGuests,
      details,
      isActive,
      sortOrder,
    } = body;

    if (!name || !groupId) {
      return NextResponse.json(
        { error: 'Paket adı ve grup ID gereklidir' },
        { status: 400 }
      );
    }

    // Slug oluştur
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newPackage = await prisma.organizasyonPaketler.create({
      data: {
        id: `pkg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        slug,
        description: description || null,
        groupId: groupId || null,
        price: price ? parseFloat(price) : null,
        perPersonPrice: perPersonPrice ? parseFloat(perPersonPrice) : null,
        minGuests: minGuests ? parseInt(minGuests) : null,
        maxGuests: maxGuests ? parseInt(maxGuests) : null,
        details: details || null,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        OrganizasyonGrup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, package: newPackage });
  } catch (error: any) {
    console.error('Error creating package:', error);
    return NextResponse.json(
      { error: 'Paket oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}

// Paket güncelle
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const {
      id,
      name,
      description,
      groupId,
      price,
      perPersonPrice,
      minGuests,
      maxGuests,
      details,
      isActive,
      sortOrder,
    } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Paket ID ve adı gereklidir' },
        { status: 400 }
      );
    }

    // Slug oluştur
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const updatedPackage = await prisma.organizasyonPaketler.update({
      where: { id: String(id) },
      data: {
        name,
        slug,
        description: description || null,
        groupId: groupId || null,
        price: price ? parseFloat(price) : null,
        perPersonPrice: perPersonPrice ? parseFloat(perPersonPrice) : null,
        minGuests: minGuests ? parseInt(minGuests) : null,
        maxGuests: maxGuests ? parseInt(maxGuests) : null,
        details: details || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        updatedAt: new Date(),
      },
      include: {
        OrganizasyonGrup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    return NextResponse.json({ success: true, package: updatedPackage });
  } catch (error: any) {
    console.error('Error updating package:', error);
    return NextResponse.json(
      { error: 'Paket güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Paket sil
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Paket ID gereklidir' },
        { status: 400 }
      );
    }

    await prisma.organizasyonPaketler.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: 'Paket silindi' });
  } catch (error: any) {
    console.error('Error deleting package:', error);
    return NextResponse.json(
      { error: 'Paket silinemedi', message: error.message },
      { status: 500 }
    );
  }
}

