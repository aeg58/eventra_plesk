import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Form section görünürlüğünü güncelle
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

    // Form section'ı kontrol et
    const section = await prisma.formSectionMaster.findUnique({
      where: { id: params.id },
    });

    if (!section) {
      return NextResponse.json(
        { error: 'Form section bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { groupId, isActive, sortOrder } = body;

    // Validasyon
    if (!groupId) {
      return NextResponse.json(
        { error: 'Organizasyon grubu ID gereklidir' },
        { status: 400 }
      );
    }

    // Organizasyon grubunu kontrol et
    const group = await prisma.organizasyonGrup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Organizasyon grubu bulunamadı' },
        { status: 404 }
      );
    }

    // Mevcut görünürlük kaydını kontrol et
    const existing = await prisma.formSectionVisibility.findUnique({
      where: {
        groupId_sectionId: {
          groupId,
          sectionId: params.id,
        },
      },
    });

    let visibility;
    
    if (existing) {
      // Güncelle
      const updateData: any = {
        updatedAt: new Date(),
      };
      
      if (isActive !== undefined) updateData.isActive = isActive;
      if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

      visibility = await prisma.formSectionVisibility.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      // Oluştur
      const now = new Date();
      visibility = await prisma.formSectionVisibility.create({
        data: {
          id: `vis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          groupId,
          sectionId: params.id,
          isActive: isActive !== undefined ? isActive : true,
          sortOrder: sortOrder !== undefined ? sortOrder : 0,
          createdAt: now,
          updatedAt: now,
        },
      });
    }

    return NextResponse.json({
      success: true,
      visibility,
      message: 'Form section görünürlüğü başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Form section visibility PUT error:', error);
    return NextResponse.json(
      { error: 'Form section görünürlüğü güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}


