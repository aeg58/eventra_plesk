import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// E-posta ayarlarını getir (tek kayıt olacak)
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Tek bir kayıt olacak (varsa)
    const settings = await prisma.emailSettings.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Şifreyi gizle
    if (settings) {
      return NextResponse.json({
        settings: {
          ...settings,
          password: settings.password ? '••••••••' : null,
        },
      });
    }

    return NextResponse.json({ settings: null });
  } catch (error: any) {
    console.error('Email settings GET error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// E-posta ayarlarını kaydet/güncelle
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
    const { host, port, secure, user, password, fromEmail, fromName, useSendmail, isActive } = body;

    if (!host || !user || !fromEmail) {
      return NextResponse.json(
        { error: 'Host, kullanıcı adı ve gönderen e-posta zorunludur' },
        { status: 400 }
      );
    }

    // Mevcut ayarları kontrol et
    const existing = await prisma.emailSettings.findFirst();

    let settings;
    if (existing) {
      // Güncelle - şifre değişmemişse eski şifreyi koru
      const updateData: any = {
        host,
        port: port || 25,
        secure: secure || false,
        user,
        fromEmail,
        fromName: fromName || 'Eventra',
        useSendmail: useSendmail || false,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      };

      // Şifre değiştirilmek isteniyorsa (•••••••• değilse) güncelle
      if (password && password !== '••••••••') {
        updateData.password = password;
      }

      settings = await prisma.emailSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      // Yeni oluştur
      settings = await prisma.emailSettings.create({
        data: {
          host,
          port: port || 25,
          secure: secure || false,
          user,
          password: password || null,
          fromEmail,
          fromName: fromName || 'Eventra',
          useSendmail: useSendmail || false,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        password: settings.password ? '••••••••' : null,
      },
      message: 'E-posta ayarları başarıyla kaydedildi',
    });
  } catch (error: any) {
    console.error('Email settings POST error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

