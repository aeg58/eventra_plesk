import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Tüm ofisleri getir
export async function GET() {
  try {
    const offices = await prisma.ofisler.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        Subeler: {
          where: {
            isActive: true,
          },
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });

    return NextResponse.json(offices);
  } catch (error) {
    console.error('Error fetching offices:', error);
    return NextResponse.json(
      { error: 'Ofisler getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni ofis oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, phone, email, city, district, addressLine1, addressLine2, capacity, timezone, color, settings, isActive, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Ofis adı gerekli' },
        { status: 400 }
      );
    }

    const office = await prisma.ofisler.create({
      data: {
        id: `office-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        code: code || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        district: district || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        capacity: capacity ? parseInt(capacity) : null,
        timezone: timezone || 'Europe/Istanbul',
        color: color || '#2563eb',
        settings: settings || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(office);
  } catch (error) {
    console.error('Error creating office:', error);
    return NextResponse.json(
      { error: 'Ofis oluşturulamadı' },
      { status: 500 }
    );
  }
}

// Ofis güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, code, phone, email, city, district, addressLine1, addressLine2, capacity, timezone, color, settings, isActive, sortOrder } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID ve ofis adı gerekli' },
        { status: 400 }
      );
    }

    const office = await prisma.ofisler.update({
      where: { id },
      data: {
        name,
        code: code || null,
        phone: phone || null,
        email: email || null,
        city: city || null,
        district: district || null,
        addressLine1: addressLine1 || null,
        addressLine2: addressLine2 || null,
        capacity: capacity ? parseInt(capacity) : null,
        timezone: timezone || 'Europe/Istanbul',
        color: color || '#2563eb',
        settings: settings || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json(office);
  } catch (error) {
    console.error('Error updating office:', error);
    return NextResponse.json(
      { error: 'Ofis güncellenemedi' },
      { status: 500 }
    );
  }
}

// Ofis sil
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

    await prisma.ofisler.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting office:', error);
    return NextResponse.json(
      { error: 'Ofis silinemedi' },
      { status: 500 }
    );
  }
}

