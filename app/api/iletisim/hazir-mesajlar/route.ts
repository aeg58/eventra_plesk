import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Hazır mesajları getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const tip = searchParams.get('tip');
    const kategori = searchParams.get('kategori');

    const where: any = {};
    if (tip) where.tip = tip;
    if (kategori) where.kategori = kategori;

    const messages = await prisma.hazirMesajlar.findMany({
      where,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ messages });
  } catch (error: any) {
    console.error('Hazır mesajlar GET error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni hazır mesaj oluştur
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { baslik, icerik, tip, kategori, degiskenler, isActive, sortOrder } = body;

    if (!baslik || !icerik || !tip) {
      return NextResponse.json(
        { error: 'Başlık, içerik ve tip zorunludur' },
        { status: 400 }
      );
    }

    const message = await prisma.hazirMesajlar.create({
      data: {
        baslik,
        icerik,
        tip,
        kategori: kategori || null,
        degiskenler: degiskenler ? JSON.stringify(degiskenler) : null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Hazır mesaj POST error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Hazır mesaj güncelle
export async function PUT(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, baslik, icerik, tip, kategori, degiskenler, isActive, sortOrder } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'ID gerekli' },
        { status: 400 }
      );
    }

    const message = await prisma.hazirMesajlar.update({
      where: { id },
      data: {
        baslik,
        icerik,
        tip,
        kategori: kategori || null,
        degiskenler: degiskenler ? JSON.stringify(degiskenler) : null,
        isActive,
        sortOrder: sortOrder || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message,
    });
  } catch (error: any) {
    console.error('Hazır mesaj PUT error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Hazır mesaj sil
export async function DELETE(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID gerekli' },
        { status: 400 }
      );
    }

    await prisma.hazirMesajlar.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Mesaj silindi',
    });
  } catch (error: any) {
    console.error('Hazır mesaj DELETE error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

