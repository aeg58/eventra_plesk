import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Tüm organizasyon ürünlerini getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');
    const isActive = searchParams.get('isActive');

    const where: any = {};
    if (groupId) {
      where.groupId = groupId;
    }
    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    const items = await prisma.organizasyonUrunler.findMany({
      where,
      include: {
        GenelBirim: {
          select: {
            id: true,
            name: true,
          },
        },
        OrganizasyonGrup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // Format items - tüm ürünleri döndür (organizasyon grubu gözetmeksizin)
    const formattedItems = items.map((item) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      price: item.price?.toNumber() || 0,
      unit: item.GenelBirim?.name || '',
      unitId: item.unitId || '',
      groupId: item.groupId || '',
      groupIds: item.groupId ? [item.groupId] : [],
      isActive: item.isActive,
      OrganizasyonGrup: item.OrganizasyonGrup ? {
        id: item.OrganizasyonGrup.id,
        name: item.OrganizasyonGrup.name,
        slug: item.OrganizasyonGrup.slug,
      } : null,
      GenelBirim: item.GenelBirim ? {
        id: item.GenelBirim.id,
        name: item.GenelBirim.name,
      } : null,
    }));

    return NextResponse.json({ items: formattedItems });
  } catch (error) {
    console.error('Error fetching organization items:', error);
    return NextResponse.json(
      { error: 'Organizasyon ürünleri getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni ürün oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      groupIds,
      groupId, // Backward compatibility
      name,
      description,
      price,
      unitId,
      isActive,
      sortOrder,
    } = body;

    const finalGroupIds = groupIds || (groupId ? [groupId] : []);

    if (!finalGroupIds || finalGroupIds.length === 0 || !name) {
      return NextResponse.json(
        { error: 'En az bir grup ID ve ürün adı gereklidir' },
        { status: 400 }
      );
    }

    // İlk grup ID'yi ana grup olarak kullan (backward compatibility)
    const primaryGroupId = finalGroupIds[0];

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

    const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Ürünü oluştur
    const newItem = await prisma.organizasyonUrunler.create({
      data: {
        id: itemId,
        groupId: primaryGroupId, // Ana grup (backward compatibility)
        name,
        slug,
        description: description || null,
        price: price ? parseFloat(price) : null,
        unitId: unitId || null,
        isActive: isActive !== false,
        sortOrder: sortOrder || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        OrganizasyonGrup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        GenelBirim: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Junction table'a tüm grupları ekle
    const junctionData = finalGroupIds.map((gId: string, index: number) => ({
      id: `junc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      organizasyonUrunId: itemId,
      organizasyonGrupId: gId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    await prisma.organizasyonUrunGruplari.createMany({
      data: junctionData,
    });

    // Grup bilgilerini çek
    const groups = await prisma.organizasyonGrup.findMany({
      where: { id: { in: finalGroupIds } },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...newItem,
        groupIds: finalGroupIds,
        OrganizasyonGruplar: groups,
      },
    });
  } catch (error: any) {
    console.error('Error creating organization item:', error);
    return NextResponse.json(
      { error: 'Ürün oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}

// Ürün güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      id,
      groupIds,
      groupId, // Backward compatibility
      name,
      description,
      price,
      unitId,
      isActive,
      sortOrder,
    } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'Ürün ID ve adı gereklidir' },
        { status: 400 }
      );
    }

    const finalGroupIds = groupIds || (groupId ? [groupId] : []);

    if (!finalGroupIds || finalGroupIds.length === 0) {
      return NextResponse.json(
        { error: 'En az bir grup ID gereklidir' },
        { status: 400 }
      );
    }

    // İlk grup ID'yi ana grup olarak kullan (backward compatibility)
    const primaryGroupId = finalGroupIds[0];

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

    // Ürünü güncelle
    const updatedItem = await prisma.organizasyonUrunler.update({
      where: { id: String(id) },
      data: {
        groupId: primaryGroupId, // Ana grup (backward compatibility)
        name,
        slug,
        description: description || null,
        price: price ? parseFloat(price) : null,
        unitId: unitId || null,
        isActive: isActive !== undefined ? isActive : true,
        sortOrder: sortOrder || 0,
        updatedAt: new Date(),
      },
      include: {
        OrganizasyonGrup: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        GenelBirim: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Junction table'daki eski kayıtları sil
    await prisma.organizasyonUrunGruplari.deleteMany({
      where: { organizasyonUrunId: String(id) },
    });

    // Junction table'a yeni grupları ekle
    const junctionData = finalGroupIds.map((gId: string, index: number) => ({
      id: `junc_${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
      organizasyonUrunId: String(id),
      organizasyonGrupId: gId,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    await prisma.organizasyonUrunGruplari.createMany({
      data: junctionData,
    });

    // Grup bilgilerini çek
    const groups = await prisma.organizasyonGrup.findMany({
      where: { id: { in: finalGroupIds } },
      select: { id: true, name: true, slug: true },
    });

    return NextResponse.json({
      success: true,
      item: {
        ...updatedItem,
        groupIds: finalGroupIds,
        OrganizasyonGruplar: groups,
      },
    });
  } catch (error: any) {
    console.error('Error updating organization item:', error);
    return NextResponse.json(
      { error: 'Ürün güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Ürün sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Ürün ID gereklidir' },
        { status: 400 }
      );
    }

    await prisma.organizasyonUrunler.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ success: true, message: 'Ürün silindi' });
  } catch (error: any) {
    console.error('Error deleting organization item:', error);
    return NextResponse.json(
      { error: 'Ürün silinemedi', message: error.message },
      { status: 500 }
    );
  }
}
