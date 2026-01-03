import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Tüm organizasyon gruplarını getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      console.warn('Auth failed - cookie:', cookieHeader.substring(0, 100));
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const groups = await prisma.organizasyonGrup.findMany({
      orderBy: {
        sortOrder: 'asc',
      },
    });

    const formattedGroups = groups.map((group) => ({
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description || '',
      sortOrder: group.sortOrder,
      active: group.isActive,
      createdAt: group.createdAt ? new Date(group.createdAt).toLocaleDateString('tr-TR') : '-',
    }));

    return NextResponse.json({ groups: formattedGroups });
  } catch (error: any) {
    console.error('Organizasyon grupları API error:', error);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Bir hata oluştu', 
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Yeni organizasyon grubu oluştur
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
    const { name, description, active, sortOrder } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Organizasyon adı gerekli' },
        { status: 400 }
      );
    }

    // Slug oluştur
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newGroup = await prisma.organizasyonGrup.create({
      data: {
        id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        slug,
        description: description || null,
        isActive: active !== false,
        sortOrder: sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      group: newGroup,
      message: 'Organizasyon başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Create organization group error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Organizasyon grubu güncelle
export async function PUT(request: NextRequest) {
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
    const { id, name, description, active, sortOrder } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID ve organizasyon adı gerekli' },
        { status: 400 }
      );
    }

    // "Bilinmiyor" grubunu koru - güncellenmesine izin verme
    const existingGroup = await prisma.organizasyonGrup.findUnique({
      where: { id: String(id) },
    });

    if (existingGroup && (existingGroup.name === 'Bilinmiyor' || existingGroup.slug === 'bilinmiyor')) {
      return NextResponse.json(
        { error: 'Bu grup sistem tarafından korunmaktadır ve düzenlenemez' },
        { status: 403 }
      );
    }

    // Slug oluştur
    const slug = name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const updatedGroup = await prisma.organizasyonGrup.update({
      where: { id: String(id) },
      data: {
        name,
        slug,
        description: description || null,
        isActive: active !== false,
        sortOrder: sortOrder || 0,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      group: updatedGroup,
      message: 'Organizasyon başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Update organization group error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Organizasyon grubu sil
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID gerekli' },
        { status: 400 }
      );
    }

    // Grubu kontrol et
    const group = await prisma.organizasyonGrup.findUnique({
      where: { id },
    });

    if (!group) {
      return NextResponse.json(
        { error: 'Organizasyon grubu bulunamadı' },
        { status: 404 }
      );
    }

    // "Bilinmiyor" grubunu koru - silinmesine izin verme
    if (group.name === 'Bilinmiyor' || group.slug === 'bilinmiyor') {
      return NextResponse.json(
        { error: 'Bu grup sistem tarafından korunmaktadır ve silinemez' },
        { status: 403 }
      );
    }

    // Bağlı kayıtları kontrol et
    const relatedProducts = await prisma.organizasyonUrunler.count({
      where: { groupId: id },
    });

    const relatedPackages = await prisma.organizasyonPaketler.count({
      where: { groupId: id },
    });

    const relatedReservations = await prisma.reservation.count({
      where: { organizasyonGrupId: id },
    });

    // Eğer bağlı kayıtlar varsa, önce onları temizle veya uyar
    if (relatedProducts > 0 || relatedPackages > 0 || relatedReservations > 0) {
      // Bağlı ürünleri "Bilinmiyor" grubuna taşı
      const bilinmiyorGroup = await prisma.organizasyonGrup.findFirst({
        where: {
          OR: [
            { slug: 'bilinmiyor' },
            { name: 'Bilinmiyor' }
          ]
        },
      });

      if (bilinmiyorGroup) {
        // Ürünleri taşı
        if (relatedProducts > 0) {
          await prisma.organizasyonUrunler.updateMany({
            where: { groupId: id },
            data: { groupId: bilinmiyorGroup.id },
          });
        }

        // Paketleri taşı (groupId nullable olduğu için null yapabiliriz)
        if (relatedPackages > 0) {
          await prisma.organizasyonPaketler.updateMany({
            where: { groupId: id },
            data: { groupId: null },
          });
        }

        // Rezervasyonları taşı (organizasyonGrupId nullable)
        if (relatedReservations > 0) {
          await prisma.reservation.updateMany({
            where: { organizasyonGrupId: id },
            data: { organizasyonGrupId: null },
          });
        }
      } else {
        // "Bilinmiyor" grubu yoksa oluştur
        const newBilinmiyorGroup = await prisma.organizasyonGrup.create({
          data: {
            id: `group_bilinmiyor_${Date.now()}`,
            name: 'Bilinmiyor',
            slug: 'bilinmiyor',
            description: 'Grup atanmamış ürünler',
            isActive: true,
            sortOrder: 999,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        // Ürünleri taşı
        if (relatedProducts > 0) {
          await prisma.organizasyonUrunler.updateMany({
            where: { groupId: id },
            data: { groupId: newBilinmiyorGroup.id },
          });
        }

        // Paketleri null yap
        if (relatedPackages > 0) {
          await prisma.organizasyonPaketler.updateMany({
            where: { groupId: id },
            data: { groupId: null },
          });
        }

        // Rezervasyonları null yap
        if (relatedReservations > 0) {
          await prisma.reservation.updateMany({
            where: { organizasyonGrupId: id },
            data: { organizasyonGrupId: null },
          });
        }
      }
    }

    // FormFieldVisibility ve FormSectionVisibility kayıtları cascade ile silinecek
    // Şimdi grubu silebiliriz
    await prisma.organizasyonGrup.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: `Organizasyon başarıyla silindi. ${relatedProducts > 0 ? `${relatedProducts} ürün` : ''} ${relatedPackages > 0 ? `${relatedPackages} paket` : ''} Bilinmiyor grubuna taşındı.` 
    });
  } catch (error: any) {
    console.error('Delete organization group error:', error);
    
    // Foreign key constraint hatası
    if (error.code === 'P2003' || error.message?.includes('Foreign key constraint')) {
      return NextResponse.json(
        { 
          error: 'Bu organizasyon grubunu silemezsiniz', 
          message: 'Bu gruba bağlı ürünler, paketler veya rezervasyonlar bulunmaktadır. Lütfen önce bağlı kayıtları temizleyin.' 
        },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

