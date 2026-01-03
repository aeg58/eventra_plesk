import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Örnek birimler ekleniyor...\n');

  // Slug oluşturma fonksiyonu
  const createSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const now = new Date();

  // Görseldeki birimler
  const units = [
    {
      name: 'Hizmet',
      code: 'SERVICE',
      symbol: 'hizmet',
      category: 'service',
      isDefault: true,
      sortOrder: 0,
    },
    {
      name: 'Mililitre',
      code: 'ML',
      symbol: 'ml',
      category: 'volume',
      isDefault: false,
      sortOrder: 1,
    },
    {
      name: 'Kilogram',
      code: 'KG',
      symbol: 'kg',
      category: 'weight',
      isDefault: false,
      sortOrder: 2,
    },
    {
      name: 'Gram',
      code: 'GRAM',
      symbol: 'g',
      category: 'weight',
      isDefault: false,
      sortOrder: 3,
    },
    {
      name: 'Metre',
      code: 'METER',
      symbol: 'm',
      category: 'length',
      isDefault: false,
      sortOrder: 4,
    },
    {
      name: 'Litre',
      code: 'LITER',
      symbol: 'L',
      category: 'volume',
      isDefault: false,
      sortOrder: 5,
    },
    {
      name: 'Saat',
      code: 'HOUR',
      symbol: 'sa',
      category: 'time',
      isDefault: false,
      sortOrder: 6,
    },
    {
      name: 'Gün',
      code: 'DAY',
      symbol: 'gün',
      category: 'time',
      isDefault: false,
      sortOrder: 7,
    },
    {
      name: 'Adet',
      code: 'UNIT',
      symbol: 'adet',
      category: 'quantity',
      isDefault: false,
      sortOrder: 8,
    },
    {
      name: 'Kişi',
      code: 'PERSON',
      symbol: 'kişi',
      category: 'quantity',
      isDefault: false,
      sortOrder: 9,
    },
    {
      name: 'Paket',
      code: 'PACKAGE',
      symbol: 'paket',
      category: 'package',
      isDefault: false,
      sortOrder: 10,
    },
  ];

  // Eğer varsayılan birim varsa, önce onu false yap
  await prisma.genelBirim.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  for (const unitData of units) {
    const slug = createSlug(unitData.name);
    const existing = await prisma.genelBirim.findFirst({
      where: { 
        OR: [
          { slug },
          { name: unitData.name }
        ]
      },
    });

    if (!existing) {
      await prisma.genelBirim.create({
        data: {
          id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: unitData.name,
          code: unitData.code,
          slug: slug,
          symbol: unitData.symbol,
          category: unitData.category,
          isDefault: unitData.isDefault,
          isActive: true,
          sortOrder: unitData.sortOrder,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`✓ ${unitData.name} eklendi`);
    } else {
      // Mevcut birimi güncelle
      await prisma.genelBirim.update({
        where: { id: existing.id },
        data: {
          code: unitData.code,
          symbol: unitData.symbol,
          category: unitData.category,
          isDefault: unitData.isDefault,
          sortOrder: unitData.sortOrder,
          updatedAt: now,
        },
      });
      console.log(`✓ ${unitData.name} güncellendi`);
    }
  }

  // Varsayılan birim kontrolü - sadece bir tane varsayılan olmalı
  const defaultUnits = await prisma.genelBirim.findMany({
    where: { isDefault: true },
  });

  if (defaultUnits.length > 1) {
    // İlkini varsayılan yap, diğerlerini false yap
    for (let i = 1; i < defaultUnits.length; i++) {
      await prisma.genelBirim.update({
        where: { id: defaultUnits[i].id },
        data: { isDefault: false },
      });
    }
  }

  // Tüm birimleri listele
  const allUnits = await prisma.genelBirim.findMany({
    orderBy: {
      sortOrder: 'asc',
    },
  });

  console.log(`\n📊 Toplam ${allUnits.length} birim bulundu:\n`);
  allUnits.forEach((unit) => {
    console.log(`  - ${unit.name} (${unit.code || '-'}) - ${unit.symbol || '-'} - ${unit.category || '-'} - ${unit.isDefault ? 'Varsayılan' : ''} - ${unit.isActive ? 'Aktif' : 'Pasif'}`);
  });

  console.log('\n✅ Birimler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

