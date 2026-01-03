import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Tema ayarlarını getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await prisma.themeSettings.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // GeneralSettings'ten logo çek (senkronizasyon için)
    const generalSettings = await prisma.generalSettings.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    let logoUrl = settings?.logoUrl || null;
    
    // Eğer ThemeSettings'te logo yoksa ama GeneralSettings'te varsa, onu kullan
    if (!logoUrl && generalSettings?.companyLogo) {
      logoUrl = generalSettings.companyLogo;
    }

    if (settings) {
      return NextResponse.json({ 
        settings: {
          ...settings,
          logoUrl: logoUrl || settings.logoUrl,
        }
      });
    }

    // Varsayılan ayarları döndür
    return NextResponse.json({
      settings: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        logoUrl: logoUrl || null,
        faviconUrl: null,
        darkMode: false,
        fontFamily: 'Inter',
        fontSize: 'medium',
      },
    });
  } catch (error: any) {
    console.error('Theme settings GET error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Tema ayarlarını kaydet/güncelle
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
    const {
      primaryColor,
      secondaryColor,
      logoUrl,
      faviconUrl,
      darkMode,
      fontFamily,
      fontSize,
    } = body;

    // Logo URL validasyonu (base64 veya URL olabilir)
    let validatedLogoUrl = null;
    if (logoUrl) {
      // Base64 string kontrolü veya URL kontrolü
      if (typeof logoUrl === 'string' && (logoUrl.startsWith('data:image/') || logoUrl.startsWith('http://') || logoUrl.startsWith('https://'))) {
        validatedLogoUrl = logoUrl;
      } else if (logoUrl === null || logoUrl === '') {
        validatedLogoUrl = null;
      }
    }

    // Favicon URL validasyonu
    let validatedFaviconUrl = null;
    if (faviconUrl) {
      if (typeof faviconUrl === 'string' && (faviconUrl.startsWith('data:image/') || faviconUrl.startsWith('http://') || faviconUrl.startsWith('https://'))) {
        validatedFaviconUrl = faviconUrl;
      } else if (faviconUrl === null || faviconUrl === '') {
        validatedFaviconUrl = null;
      }
    }

    const existing = await prisma.themeSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.themeSettings.update({
        where: { id: existing.id },
        data: {
          primaryColor: primaryColor || '#2563eb',
          secondaryColor: secondaryColor || '#64748b',
          logoUrl: validatedLogoUrl,
          faviconUrl: validatedFaviconUrl,
          darkMode: darkMode !== undefined ? darkMode : false,
          fontFamily: fontFamily || 'Inter',
          fontSize: fontSize || 'medium',
          updatedAt: new Date(),
        },
      });
    } else {
      settings = await prisma.themeSettings.create({
        data: {
          primaryColor: primaryColor || '#2563eb',
          secondaryColor: secondaryColor || '#64748b',
          logoUrl: validatedLogoUrl,
          faviconUrl: validatedFaviconUrl,
          darkMode: darkMode !== undefined ? darkMode : false,
          fontFamily: fontFamily || 'Inter',
          fontSize: fontSize || 'medium',
        },
      });
    }

    // Logo senkronizasyonu: GeneralSettings.companyLogo'yu da güncelle
    if (validatedLogoUrl !== undefined) {
      try {
        const generalSettings = await prisma.generalSettings.findFirst();
        if (generalSettings) {
          await prisma.generalSettings.update({
            where: { id: generalSettings.id },
            data: {
              companyLogo: validatedLogoUrl,
              updatedAt: new Date(),
            },
          });
        } else {
          // GeneralSettings yoksa oluştur (minimal veri ile)
          await prisma.generalSettings.create({
            data: {
              companyName: 'Eventra',
              companyEmail: 'info@eventra.com',
              companyLogo: validatedLogoUrl,
              defaultLanguage: 'tr',
              defaultTimezone: 'Europe/Istanbul',
              dateFormat: 'DD/MM/YYYY',
              timeFormat: '24',
              currency: 'TRY',
              currencySymbol: '₺',
            },
          });
        }
      } catch (syncError) {
        console.error('Logo sync error:', syncError);
        // Logo senkronizasyon hatası kritik değil, devam et
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      message: 'Tema ayarları başarıyla kaydedildi',
    });
  } catch (error: any) {
    console.error('Theme settings POST error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

