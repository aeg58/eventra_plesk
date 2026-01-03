import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Genel ayarları getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const settings = await prisma.generalSettings.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (settings) {
      return NextResponse.json({ settings });
    }

    // Varsayılan ayarları döndür
    return NextResponse.json({
      settings: {
        companyName: '',
        companyEmail: '',
        companyPhone: '',
        companyAddress: '',
        taxNumber: '',
        taxOffice: '',
        defaultLanguage: 'tr',
        defaultTimezone: 'Europe/Istanbul',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        currency: 'TRY',
        currencySymbol: '₺',
      },
    });
  } catch (error: any) {
    console.error('General settings GET error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Genel ayarları kaydet/güncelle
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const body = await request.json();
    const {
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      taxNumber,
      taxOffice,
      companyLogo,
      defaultLanguage,
      defaultTimezone,
      dateFormat,
      timeFormat,
      currency,
      currencySymbol,
    } = body;

    if (!companyName || !companyEmail) {
      return NextResponse.json(
        { error: 'Şirket adı ve e-posta zorunludur' },
        { status: 400 }
      );
    }

    const existing = await prisma.generalSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.generalSettings.update({
        where: { id: existing.id },
        data: {
          companyName,
          companyEmail,
          companyPhone: companyPhone || null,
          companyAddress: companyAddress || null,
          taxNumber: taxNumber || null,
          taxOffice: taxOffice || null,
          companyLogo: companyLogo || null,
          defaultLanguage: defaultLanguage || 'tr',
          defaultTimezone: defaultTimezone || 'Europe/Istanbul',
          dateFormat: dateFormat || 'DD/MM/YYYY',
          timeFormat: timeFormat || '24',
          currency: currency || 'TRY',
          currencySymbol: currencySymbol || '₺',
          updatedAt: new Date(),
        },
      });
    } else {
      settings = await prisma.generalSettings.create({
        data: {
          companyName,
          companyEmail,
          companyPhone: companyPhone || null,
          companyAddress: companyAddress || null,
          taxNumber: taxNumber || null,
          taxOffice: taxOffice || null,
          companyLogo: companyLogo || null,
          defaultLanguage: defaultLanguage || 'tr',
          defaultTimezone: defaultTimezone || 'Europe/Istanbul',
          dateFormat: dateFormat || 'DD/MM/YYYY',
          timeFormat: timeFormat || '24',
          currency: currency || 'TRY',
          currencySymbol: currencySymbol || '₺',
        },
      });
    }

    // Logo senkronizasyonu: ThemeSettings.logoUrl'i de güncelle
    if (companyLogo !== undefined) {
      const themeSettings = await prisma.themeSettings.findFirst();
      if (themeSettings) {
        await prisma.themeSettings.update({
          where: { id: themeSettings.id },
          data: {
            logoUrl: companyLogo || null,
            updatedAt: new Date(),
          },
        });
      } else {
        // ThemeSettings yoksa oluştur (minimal veri ile)
        await prisma.themeSettings.create({
          data: {
            primaryColor: '#2563eb',
            secondaryColor: '#64748b',
            logoUrl: companyLogo || null,
            darkMode: false,
            fontFamily: 'Inter',
            fontSize: 'medium',
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      settings,
      message: 'Genel ayarlar başarıyla kaydedildi',
    });
  } catch (error: any) {
    console.error('General settings POST error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

