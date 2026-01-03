import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Tüm salonları getir (Subeler tablosundan)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');

    const where: any = {};
    if (officeId) {
      where.officeId = officeId;
    }

    const salons = await prisma.subeler.findMany({
      where,
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        Ofisler: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
    });

    return NextResponse.json(salons);
  } catch (error) {
    console.error('Error fetching salons:', error);
    return NextResponse.json(
      { error: 'Salonlar getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni salon oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, officeId, description, address, phone, email, capacity, floor, area, location, features, gallery, sortOrder, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Salon adı gerekli' },
        { status: 400 }
      );
    }

    const salon = await prisma.subeler.create({
      data: {
        id: `salon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        officeId: officeId || null,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        capacity: capacity ? parseInt(capacity) : null,
        floor: floor ? parseInt(floor) : null,
        area: area ? parseInt(area) : null,
        location: location || null,
        features: features || null,
        gallery: gallery || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(salon);
  } catch (error) {
    console.error('Error creating salon:', error);
    return NextResponse.json(
      { error: 'Salon oluşturulamadı' },
      { status: 500 }
    );
  }
}

// Salon güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, officeId, description, address, phone, email, capacity, floor, area, location, features, gallery, sortOrder, isActive } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID ve salon adı gerekli' },
        { status: 400 }
      );
    }

    const salon = await prisma.subeler.update({
      where: { id },
      data: {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        officeId: officeId || null,
        description: description || null,
        address: address || null,
        phone: phone || null,
        email: email || null,
        capacity: capacity ? parseInt(capacity) : null,
        floor: floor ? parseInt(floor) : null,
        area: area ? parseInt(area) : null,
        location: location || null,
        features: features || null,
        gallery: gallery || null,
        sortOrder: sortOrder || 0,
        isActive: isActive !== undefined ? isActive : true,
      },
    });

    return NextResponse.json(salon);
  } catch (error) {
    console.error('Error updating salon:', error);
    return NextResponse.json(
      { error: 'Salon güncellenemedi' },
      { status: 500 }
    );
  }
}

// Salon sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID gerekli' },
        { status: 400 }
      );
    }

    await prisma.subeler.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting salon:', error);
    return NextResponse.json(
      { error: 'Salon silinemedi' },
      { status: 500 }
    );
  }
}

