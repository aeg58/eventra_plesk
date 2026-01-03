import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { sendEmail } from '@/app/lib/email';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Test e-postası gönder
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
    const { to } = body;

    if (!to) {
      return NextResponse.json(
        { error: 'Alıcı e-posta adresi gerekli' },
        { status: 400 }
      );
    }

    // E-posta ayarlarını al
    const settings = await prisma.emailSettings.findFirst({
      where: {
        isActive: true,
      },
    });

    if (!settings) {
      return NextResponse.json(
        { error: 'E-posta ayarları bulunamadı veya aktif değil' },
        { status: 400 }
      );
    }

    // Test e-postası gönder
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Test E-postası</h1>
          </div>
          <div class="content">
            <div class="success">
              <strong>✅ Başarılı!</strong> E-posta ayarlarınız doğru çalışıyor.
            </div>
            <p>Bu bir test e-postasıdır. E-posta ayarlarınız başarıyla yapılandırıldı ve e-posta gönderimi çalışıyor.</p>
            <p>İyi günler,<br>Eventra Ekibi</p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail({
      to,
      subject: 'Eventra - Test E-postası',
      html,
    });

    return NextResponse.json({
      success: true,
      message: 'Test e-postası başarıyla gönderildi',
    });
  } catch (error: any) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Test e-postası gönderilemedi', message: error.message },
      { status: 500 }
    );
  }
}

