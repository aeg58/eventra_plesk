import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Tüm sözleşme şablonlarını getir
export async function GET(request: NextRequest) {
  try {
    const templates = await prisma.sozlesmeSablon.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ templates });
  } catch (error) {
    console.error('Error fetching contract templates:', error);
    return NextResponse.json(
      { error: 'Sözleşme şablonları getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni sözleşme şablonu oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, isActive } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Başlık ve içerik gereklidir' },
        { status: 400 }
      );
    }

    const newTemplate = await prisma.sozlesmeSablon.create({
      data: {
        id: `sozlesme_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title,
        content,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, template: newTemplate, message: 'Sözleşme şablonu başarıyla oluşturuldu' });
  } catch (error: any) {
    console.error('Error creating contract template:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Sözleşme şablonu güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, isActive } = body;

    if (!id || !title || !content) {
      return NextResponse.json(
        { error: 'ID, başlık ve içerik gereklidir' },
        { status: 400 }
      );
    }

    const updatedTemplate = await prisma.sozlesmeSablon.update({
      where: { id: String(id) },
      data: {
        title,
        content,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true, template: updatedTemplate, message: 'Sözleşme şablonu başarıyla güncellendi' });
  } catch (error: any) {
    console.error('Error updating contract template:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Sözleşme şablonu sil
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

    await prisma.sozlesmeSablon.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: 'Sözleşme şablonu başarıyla silindi' });
  } catch (error: any) {
    console.error('Error deleting contract template:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}



