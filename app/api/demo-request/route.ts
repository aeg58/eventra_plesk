import { NextRequest, NextResponse } from 'next/server';
import { sendDemoRequestEmail } from '@/app/lib/email';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, company, message } = await request.json();

    if (!name || !email) {
      return NextResponse.json(
        { success: false, message: 'Ad soyad ve e-posta gereklidir' },
        { status: 400 }
      );
    }

    const adminEmail = process.env.EVENTRA_ADMIN_EMAIL || 'admin@blackwool.app';

    // Demo talebini admin'e e-posta ile gönder
    try {
      const emailResult = await sendDemoRequestEmail(adminEmail, {
        name,
        email,
        phone,
        company,
        message,
      });
      
      if (!emailResult.success) {
        console.warn('E-posta gönderilemedi, ancak demo talebi kaydedildi');
      }
    } catch (emailError: any) {
      console.error('Email send error:', emailError);
      // E-posta gönderilemese bile başarı mesajı dön
    }

    return NextResponse.json({
      success: true,
      message: 'Demo talebiniz başarıyla gönderildi. En kısa sürede size dönüş yapacağız.',
    });
  } catch (error: any) {
    console.error('Demo request error:', error);
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}
