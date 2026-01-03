import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { sendPasswordResetEmail } from '@/app/lib/email';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'E-posta adresi gereklidir' },
        { status: 400 }
      );
    }

    // Kullanıcıyı kontrol et (güvenlik için her durumda aynı mesaj döneceğiz)
    const user = await prisma.kullan_c_lar.findUnique({
      where: { email },
    });

    // Kullanıcı yoksa bile başarı mesajı dön (güvenlik)
    if (!user) {
      return NextResponse.json({
        success: true,
        message: 'Eğer bu e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.',
      });
    }

    // Token oluştur (3 dakika geçerli)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 3); // 3 dakika

    // Eski tokenları temizle
    await prisma.sifreSifirlamaTokenlari.deleteMany({
      where: {
        userId: user.id,
      },
    });

    // Yeni token kaydet
    await prisma.sifreSifirlamaTokenlari.create({
      data: {
        id: `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        userId: user.id,
        token,
        expiresAt,
        createdAt: new Date(),
      },
    });

    // Şifre sıfırlama linki oluştur
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://blackwool.app'}/eventra/reset-password?token=${token}`;

    // E-posta gönder
    try {
      const emailResult = await sendPasswordResetEmail(email, resetLink);
      if (!emailResult.success) {
        console.error('Email gönderilemedi:', emailResult.error);
        // Token oluşturuldu ama mail gönderilemedi - yine de başarı mesajı dön
      }
    } catch (emailError: any) {
      console.error('Email send error:', emailError);
      // E-posta gönderilemese bile token oluşturuldu, kullanıcıya başarı mesajı dön
      // Ancak loglara detaylı hata yaz
      console.error('Email gönderim hatası detayları:', {
        message: emailError.message,
        code: emailError.code,
        stack: emailError.stack,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Eğer bu e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.',
    });
  } catch (error: any) {
    console.error('Forgot password error:', error);
    // Hata durumunda da aynı mesajı dön (güvenlik)
    return NextResponse.json({
      success: true,
      message: 'Eğer bu e-posta adresi sistemde kayıtlıysa, şifre sıfırlama bağlantısı gönderilmiştir.',
    });
  }
}
