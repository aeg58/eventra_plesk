import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Müşteri detayı
export async function GET(
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

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        Reservation: {
          include: {
            ReservationDynamicValues: {
              select: {
                fieldKey: true,
                fieldValue: true,
              },
            },
          },
          orderBy: {
            rezervasyonTarihi: 'desc',
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ customer });
  } catch (error: any) {
    console.error('Customer GET error:', error);
    return NextResponse.json(
      { error: 'Müşteri getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Müşteri güncelle
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

    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Müşteri bulunamadı' },
        { status: 404 }
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

    // Telefon veya email ile başka bir müşteriyi kontrol et
    if (telefon && telefon !== customer.telefon) {
      const existingByPhone = await prisma.customer.findFirst({
        where: {
          telefon,
          id: { not: params.id },
        },
      });
      
      if (existingByPhone) {
        return NextResponse.json(
          { error: 'Bu telefon numarası başka bir müşteriye ait' },
          { status: 409 }
        );
      }
    }

    if (email && email !== customer.email) {
      const existingByEmail = await prisma.customer.findFirst({
        where: {
          email,
          id: { not: params.id },
        },
      });
      
      if (existingByEmail) {
        return NextResponse.json(
          { error: 'Bu e-posta adresi başka bir müşteriye ait' },
          { status: 409 }
        );
      }
    }

    // Müşteriyi güncelle
    const updatedCustomer = await prisma.customer.update({
      where: { id: params.id },
      data: {
        adSoyad,
        telefon: telefon || null,
        email: email || null,
        adres: adres || null,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      message: 'Müşteri başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Customer PUT error:', error);
    return NextResponse.json(
      { error: 'Müşteri güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}


