import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Form alanlarını ve visibility durumlarını getir
export async function GET(request: NextRequest) {
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
    const groupId = searchParams.get('groupId');
    const fieldId = searchParams.get('fieldId');

    // Eğer fieldId ve groupId varsa, sadece visibility kaydını döndür
    if (fieldId && groupId) {
      const visibility = await prisma.formFieldVisibility.findFirst({
        where: {
          fieldId: fieldId,
          groupId: groupId,
        },
      });
      return NextResponse.json({ visibility: visibility || null });
    }

    // Tüm master form alanlarını bölümleriyle birlikte getir
    const fields = await prisma.formFieldMaster.findMany({
      include: {
        FormSectionMaster: {
          select: {
            id: true,
            title: true,
            globalKey: true,
            sortOrder: true,
          },
        },
        FormFieldVisibility: groupId
          ? {
              where: {
                groupId: groupId,
              },
              select: {
                id: true,
                groupId: true,
                isActive: true,
                sortOrder: true,
              },
            }
          : {
              select: {
                id: true,
                groupId: true,
                isActive: true,
                sortOrder: true,
              },
            },
      },
      orderBy: [
        {
          FormSectionMaster: {
            sortOrder: 'asc',
          },
        },
        {
          sortOrder: 'asc',
        },
      ],
    });

    return NextResponse.json(fields);
  } catch (error) {
    console.error('Error fetching form fields:', error);
    return NextResponse.json(
      { error: 'Form alanları getirilemedi' },
      { status: 500 }
    );
  }
}

// Form alanı visibility ve required durumunu güncelle
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
    const { fieldId, groupId, isActive, isRequired, sortOrder } = body;

    if (!fieldId) {
      return NextResponse.json(
        { error: 'fieldId gerekli' },
        { status: 400 }
      );
    }

    let visibility = null;

    // Eğer groupId varsa, visibility kaydını güncelle/oluştur
    if (groupId) {
      // Önce mevcut kaydı kontrol et
      const existing = await prisma.formFieldVisibility.findFirst({
        where: {
          groupId: groupId,
          fieldId: fieldId,
        },
      });

      if (existing) {
        // Güncelle - isActive undefined değilse kullan, yoksa mevcut değeri koru
        const updateData: any = {
          sortOrder: sortOrder !== undefined ? sortOrder : existing.sortOrder,
        };
        
        // isActive sadece açıkça gönderilmişse güncelle
        if (isActive !== undefined) {
          updateData.isActive = isActive;
        }
        
        // updatedAt'i güncelle
        updateData.updatedAt = new Date();
        
        visibility = await prisma.formFieldVisibility.update({
          where: {
            id: existing.id,
          },
          data: updateData,
        });
      } else {
        // Oluştur - isActive varsayılan olarak true, ama gönderilmişse onu kullan
        const now = new Date();
        visibility = await prisma.formFieldVisibility.create({
          data: {
            id: `vis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            groupId: groupId,
            fieldId: fieldId,
            isActive: isActive !== undefined ? isActive : true,
            sortOrder: sortOrder !== undefined ? sortOrder : 0,
            createdAt: now,
            updatedAt: now,
          },
        });
      }
    }

    // Master form alanının isRequired durumunu güncelle
    if (isRequired !== undefined) {
      await prisma.formFieldMaster.update({
        where: {
          id: fieldId,
        },
        data: {
          isRequired: isRequired,
        },
      });
    }

    // Master form alanının sortOrder durumunu güncelle (sadece groupId yoksa)
    if (sortOrder !== undefined && !groupId) {
      await prisma.formFieldMaster.update({
        where: {
          id: fieldId,
        },
        data: {
          sortOrder: sortOrder,
        },
      });
    }

    return NextResponse.json({ success: true, visibility });
  } catch (error: any) {
    console.error('Error updating form field visibility:', error);
    return NextResponse.json(
      { error: 'Form alanı güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}

