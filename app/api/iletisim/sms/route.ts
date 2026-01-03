import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// SMS ayarlarını getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await prisma.sMSSettings.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (settings) {
      return NextResponse.json({
        settings: {
          ...settings,
          apiSecret: settings.apiSecret ? '••••••••' : null,
        },
      });
    }

    return NextResponse.json({ settings: null });
  } catch (error: any) {
    console.error('SMS settings GET error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// SMS ayarlarını kaydet/güncelle
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
    const { provider, apiKey, apiSecret, senderNumber, senderName, isActive } = body;

    const existing = await prisma.sMSSettings.findFirst();

    let settings;
    if (existing) {
      const updateData: any = {
        provider: provider || 'manual',
        apiKey: apiKey || null,
        senderNumber: senderNumber || null,
        senderName: senderName || null,
        isActive: isActive !== undefined ? isActive : true,
        updatedAt: new Date(),
      };

      if (apiSecret && apiSecret !== '••••••••') {
        updateData.apiSecret = apiSecret;
      }

      settings = await prisma.sMSSettings.update({
        where: { id: existing.id },
        data: updateData,
      });
    } else {
      settings = await prisma.sMSSettings.create({
        data: {
          provider: provider || 'manual',
          apiKey: apiKey || null,
          apiSecret: apiSecret || null,
          senderNumber: senderNumber || null,
          senderName: senderName || null,
          isActive: isActive !== undefined ? isActive : true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings: {
        ...settings,
        apiSecret: settings.apiSecret ? '••••••••' : null,
      },
      message: 'SMS ayarları başarıyla kaydedildi',
    });
  } catch (error: any) {
    console.error('SMS settings POST error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

