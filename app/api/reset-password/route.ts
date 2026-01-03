import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import bcrypt from 'bcryptjs';

export const dynamic = 'force-dynamic';

// Token doğrulama
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token gerekli' },
        { status: 400 }
      );
    }

    // Token'ı kontrol et
    const resetToken = await prisma.sifreSifirlamaTokenlari.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(), // Süresi dolmamış
        },
      },
      include: {
        Kullan_c_lar: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veya süresi dolmuş token' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      email: resetToken.Kullan_c_lar.email,
    });
  } catch (error: any) {
    console.error('Token validation error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

// Şifre sıfırlama
export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json();

    if (!token || !password) {
      return NextResponse.json(
        { success: false, message: 'Token ve yeni şifre gerekli' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Şifre en az 6 karakter olmalıdır' },
        { status: 400 }
      );
    }

    // Token'ı kontrol et
    const resetToken = await prisma.sifreSifirlamaTokenlari.findFirst({
      where: {
        token,
        expiresAt: {
          gt: new Date(), // Süresi dolmamış
        },
      },
    });

    if (!resetToken) {
      return NextResponse.json(
        { success: false, message: 'Geçersiz veya süresi dolmuş token' },
        { status: 400 }
      );
    }

    // Şifreyi hash'le
    const passwordHash = await bcrypt.hash(password, 10);

    // Kullanıcı şifresini güncelle
    await prisma.kullan_c_lar.update({
      where: { id: resetToken.userId },
      data: {
        passwordHash,
        updatedAt: new Date(),
      },
    });

    // Token'ı sil
    await prisma.sifreSifirlamaTokenlari.delete({
      where: { id: resetToken.id },
    });

    return NextResponse.json({
      success: true,
      message: 'Şifreniz başarıyla güncellendi. Giriş sayfasına yönlendiriliyorsunuz...',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

