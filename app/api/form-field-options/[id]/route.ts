import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Form field seçeneği güncelle
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

    const option = await prisma.formFieldOptionMaster.findUnique({
      where: { id: params.id },
    });

    if (!option) {
      return NextResponse.json(
        { error: 'Form field seçeneği bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { label, value, sortOrder } = body;

    // Validasyon
    if (label !== undefined && !label) {
      return NextResponse.json(
        { error: 'Label boş olamaz' },
        { status: 400 }
      );
    }

    if (value !== undefined && !value) {
      return NextResponse.json(
        { error: 'Value boş olamaz' },
        { status: 400 }
      );
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (label !== undefined) updateData.label = label;
    if (value !== undefined) updateData.value = value;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    // Seçeneği güncelle
    const updatedOption = await prisma.formFieldOptionMaster.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      option: updatedOption,
      message: 'Form field seçeneği başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Form field option PUT error:', error);
    return NextResponse.json(
      { error: 'Form field seçeneği güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Form field seçeneği sil
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

    const option = await prisma.formFieldOptionMaster.findUnique({
      where: { id: params.id },
    });

    if (!option) {
      return NextResponse.json(
        { error: 'Form field seçeneği bulunamadı' },
        { status: 404 }
      );
    }

    // Seçeneği sil
    await prisma.formFieldOptionMaster.delete({
      where: { id: params.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Form field seçeneği başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Form field option DELETE error:', error);
    return NextResponse.json(
      { error: 'Form field seçeneği silinemedi', message: error.message },
      { status: 500 }
    );
  }
}


