import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Kapora yüzdesini getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    let settings = await prisma.reservationSettings.findFirst();
    
    // Eğer ayar yoksa varsayılan oluştur
    if (!settings) {
      try {
        settings = await prisma.reservationSettings.create({
          data: {
            id: 'reservation_settings_1',
            kaporaYuzdesi: 20.00,
          },
        });
      } catch (createError: any) {
        // Eğer zaten varsa (unique constraint), tekrar çek
        if (createError.code === 'P2002') {
          settings = await prisma.reservationSettings.findFirst();
        } else {
          throw createError;
        }
      }
    }

    return NextResponse.json({
      kaporaYuzdesi: parseFloat(String(settings.kaporaYuzdesi)),
    });
  } catch (error: any) {
    console.error('Kapora settings GET error:', error);
    return NextResponse.json(
      { error: 'Ayarlar getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Kapora yüzdesini güncelle
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Kapora yüzdesi güncelleme isteği alındı');
    
    const cookieHeader = request.headers.get('cookie') || '';
    const authError = validateAuth(cookieHeader);
    if (authError) {
      console.error('❌ Auth hatası:', authError);
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    console.log('✅ Auth kontrolü başarılı');

    let body;
    try {
      body = await request.json();
      console.log('📦 Request body:', body);
    } catch (jsonError: any) {
      console.error('❌ JSON parse hatası:', jsonError);
      return NextResponse.json(
        { error: 'Geçersiz JSON formatı', message: jsonError.message },
        { status: 400 }
      );
    }

    const { kaporaYuzdesi } = body;

    if (kaporaYuzdesi === undefined || kaporaYuzdesi === null) {
      console.error('❌ Kapora yüzdesi eksik');
      return NextResponse.json(
        { error: 'Kapora yüzdesi gereklidir' },
        { status: 400 }
      );
    }

    const yuzde = parseFloat(String(kaporaYuzdesi));
    console.log('📊 Parsed yüzde:', yuzde);
    
    if (isNaN(yuzde) || yuzde < 0 || yuzde > 100) {
      console.error('❌ Geçersiz yüzde değeri:', yuzde);
      return NextResponse.json(
        { error: 'Kapora yüzdesi 0-100 arasında olmalıdır' },
        { status: 400 }
      );
    }

    // Önce mevcut ayarı kontrol et
    console.log('🔍 Mevcut ayar kontrol ediliyor...');
    let existingSettings;
    try {
      existingSettings = await prisma.reservationSettings.findFirst();
      console.log('📋 Mevcut ayar:', existingSettings ? `Bulundu (ID: ${existingSettings.id})` : 'Bulunamadı');
    } catch (findError: any) {
      console.error('❌ Ayar arama hatası:', findError);
      throw new Error(`Ayar aranırken hata oluştu: ${findError.message}`);
    }

    let settings;
    
    if (existingSettings) {
      // Mevcut ayarı güncelle
      console.log(`🔄 Mevcut ayar güncelleniyor (ID: ${existingSettings.id})...`);
      try {
        settings = await prisma.reservationSettings.update({
          where: { id: existingSettings.id },
          data: { kaporaYuzdesi: yuzde },
        });
        console.log('✅ Ayar güncellendi:', settings.kaporaYuzdesi, '%');
      } catch (updateError: any) {
        console.error('❌ Güncelleme hatası:', updateError);
        console.error('📋 Hata kodu:', updateError.code);
        console.error('📋 Hata mesajı:', updateError.message);
        throw new Error(`Ayar güncellenirken hata oluştu: ${updateError.message}`);
      }
    } else {
      // Yeni ayar oluştur
      console.log('➕ Yeni ayar oluşturuluyor...');
      try {
        settings = await prisma.reservationSettings.create({
          data: {
            id: 'reservation_settings_1',
            kaporaYuzdesi: yuzde,
          },
        });
        console.log('✅ Ayar oluşturuldu:', settings.kaporaYuzdesi, '%');
      } catch (createError: any) {
        console.error('❌ Oluşturma hatası:', createError);
        console.error('📋 Hata kodu:', createError.code);
        console.error('📋 Hata mesajı:', createError.message);
        
        // Eğer unique constraint hatası varsa, tekrar çek ve güncelle
        if (createError.code === 'P2002') {
          console.log('🔄 Unique constraint hatası, tekrar çekiliyor...');
          try {
            existingSettings = await prisma.reservationSettings.findFirst();
            if (existingSettings) {
              settings = await prisma.reservationSettings.update({
                where: { id: existingSettings.id },
                data: { kaporaYuzdesi: yuzde },
              });
              console.log('✅ Retry ile güncellendi:', settings.kaporaYuzdesi, '%');
            } else {
              throw new Error('Ayar bulunamadı ve oluşturulamadı');
            }
          } catch (retryError: any) {
            console.error('❌ Retry hatası:', retryError);
            throw new Error(`Ayar oluşturulurken hata oluştu: ${retryError.message}`);
          }
        } else {
          throw new Error(`Ayar oluşturulurken hata oluştu: ${createError.message}`);
        }
      }
    }

    const result = {
      success: true,
      kaporaYuzdesi: parseFloat(String(settings.kaporaYuzdesi)),
      message: 'Kapora yüzdesi başarıyla güncellendi',
    };
    
    console.log('✅ Başarılı response:', result);
    return NextResponse.json(result);
    
  } catch (error: any) {
    console.error('❌ Kapora settings POST error:', error);
    console.error('📋 Hata detayı:', {
      message: error.message,
      code: error.code,
      meta: error.meta,
      stack: error.stack,
    });
    
    return NextResponse.json(
      { 
        error: 'Ayar güncellenemedi', 
        message: error.message || 'Bilinmeyen bir hata oluştu',
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

