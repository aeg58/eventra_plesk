import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Form field seçeneklerini getir
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

    const options = await prisma.formFieldOptionMaster.findMany({
      where: {
        fieldId: params.id,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    return NextResponse.json({ options });
  } catch (error: any) {
    console.error('Form field options GET error:', error);
    return NextResponse.json(
      { error: 'Form field seçenekleri getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni form field seçeneği oluştur
export async function POST(
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

    // Form field'ı kontrol et
    const field = await prisma.formFieldMaster.findUnique({
      where: { id: params.id },
    });

    if (!field) {
      return NextResponse.json(
        { error: 'Form field bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { label, value, sortOrder } = body;

    // Validasyon
    if (!label || !value) {
      return NextResponse.json(
        { error: 'Label ve value gereklidir' },
        { status: 400 }
      );
    }

    // Yeni seçenek oluştur
    const option = await prisma.formFieldOptionMaster.create({
      data: {
        id: `option_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fieldId: params.id,
        label,
        value,
        sortOrder: sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      option,
      message: 'Form field seçeneği başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Form field option POST error:', error);
    return NextResponse.json(
      { error: 'Form field seçeneği oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}


