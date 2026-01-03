import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: 'E-posta ve şifre gereklidir' },
        { status: 400 }
      );
    }

    // Önce admin kontrolü (fallback)
    const adminEmail = process.env.EVENTRA_ADMIN_EMAIL || 'admin@eventra.local';
    const adminPassword = process.env.EVENTRA_ADMIN_PASSWORD || 'eventra123';

    if (email?.toLowerCase() === adminEmail.toLowerCase() && password === adminPassword) {
      const cookieStore = await cookies();
      cookieStore.set('eventra_auth', '1', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7, // 7 gün
        path: '/eventra',
      });

      return NextResponse.json({ success: true, message: 'Giriş başarılı' });
    }

    // Veritabanından kullanıcıyı bul
    const user = await prisma.kullan_c_lar.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'E-posta veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Kullanıcı aktif değilse
    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: 'Hesabınız pasif durumda' },
        { status: 401 }
      );
    }

    // Şifre kontrolü
    if (!user.passwordHash) {
      return NextResponse.json(
        { success: false, message: 'Şifre ayarlanmamış. Lütfen yönetici ile iletişime geçin.' },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'E-posta veya şifre hatalı' },
        { status: 401 }
      );
    }

    // Başarılı giriş - Cookie set et
    const cookieStore = await cookies();
    cookieStore.set('eventra_auth', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 gün
      path: '/eventra',
    });

    // Son giriş zamanını güncelle
    await prisma.kullan_c_lar.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return NextResponse.json({ success: true, message: 'Giriş başarılı' });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

