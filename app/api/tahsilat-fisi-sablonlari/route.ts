import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Tüm tahsilat fişi şablonlarını getir
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.tahsilatFisiSablon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching receipt templates:', error);
    return NextResponse.json(
      { error: 'Tahsilat fişi şablonları getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni tahsilat fişi şablonu oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, headerContent, footerContent, isDefault, isActive } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Başlık ve içerik gereklidir' },
        { status: 400 }
      );
    }

    // Eğer isDefault true ise, diğer tüm şablonların isDefault'unu false yap
    if (isDefault) {
      await prisma.tahsilatFisiSablon.updateMany({
        where: {
          isDefault: true,
        },
        data: {
          isDefault: false,
        },
      });
    }

    const newTemplate = await prisma.tahsilatFisiSablon.create({
      data: {
        id: `tahsilat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        content,
        headerContent: headerContent || null,
        footerContent: footerContent || null,
        isDefault: isDefault || false,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, template: newTemplate, message: 'Tahsilat fişi şablonu başarıyla oluşturuldu' });
  } catch (error: any) {
    console.error('Error creating receipt template:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Tahsilat fişi şablonu güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, headerContent, footerContent, isDefault, isActive } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID, başlık ve içerik gereklidir' },
        { status: 400 }
      );
    }

    // Eğer isDefault true ise, diğer tüm şablonların isDefault'unu false yap
    if (isDefault) {
      await prisma.tahsilatFisiSablon.updateMany({
        where: {
          isDefault: true,
          NOT: { id: id },
        },
        data: {
          isDefault: false,
        },
      });
    }

    const updatedTemplate = await prisma.tahsilatFisiSablon.update({
      where: { id: String(id) },
      data: {
        title,
        content,
        headerContent: headerContent || null,
        footerContent: footerContent || null,
        isDefault: isDefault !== undefined ? isDefault : false,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, template: updatedTemplate, message: 'Tahsilat fişi şablonu başarıyla güncellendi' });
  } catch (error: any) {
    console.error('Error updating receipt template:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Tahsilat fişi şablonu sil
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

    await prisma.tahsilatFisiSablon.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: 'Tahsilat fişi şablonu başarıyla silindi' });
  } catch (error: any) {
    console.error('Error deleting receipt template:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}



