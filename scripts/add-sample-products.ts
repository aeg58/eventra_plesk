import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Örnek organizasyon ürünleri ekleniyor...\n');

  // "Bilinmiyor" grubunu oluştur veya bul
  let bilinmiyorGroup = await prisma.organizasyonGrup.findFirst({
    where: { 
      OR: [
        { slug: 'bilinmiyor' },
        { name: 'Bilinmiyor' }
      ]
    },
  });

  if (!bilinmiyorGroup) {
    bilinmiyorGroup = await prisma.organizasyonGrup.create({
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
    console.log('✓ "Bilinmiyor" grubu oluşturuldu');
  } else {
    console.log('✓ "Bilinmiyor" grubu zaten mevcut');
  }

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

  // Ürünler - grup olmadan (null grupId)
  const products = [
    {
      name: 'DJ Performansı',
      description: 'Profesyonel DJ hizmeti - 5 saat',
      price: 15000,
      isActive: false,
    },
    {
      name: 'xx',
      description: '',
      price: 50000,
      isActive: false,
    },
    {
      name: 'Kına Organizasyonu',
      description: 'Geleneksel kına organizasyonu',
      price: 10000,
      isActive: false,
    },
    {
      name: 'Düğün Pastası',
      description: '3 katlı özel tasarım pasta',
      price: 8000,
      isActive: false,
    },
  ];

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const slug = createSlug(product.name);
    const existing = await prisma.organizasyonUrunler.findFirst({
      where: { slug },
    });

    if (!existing) {
      await prisma.organizasyonUrunler.create({
        data: {
          id: `product_${Date.now()}_${i}`,
          name: product.name,
          slug: `${slug}-${Date.now()}`,
          description: product.description || null,
          price: product.price,
          groupId: bilinmiyorGroup.id, // Bilinmiyor grubu
          unitId: null, // Birim yok
          isActive: product.isActive,
          sortOrder: i,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`✓ ${product.name} eklendi`);
    } else {
      console.log(`- ${product.name} zaten mevcut`);
    }
  }

  // Tüm ürünleri listele
  const allProducts = await prisma.organizasyonUrunler.findMany({
    include: {
      OrganizasyonGrup: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  console.log(`\n📊 Toplam ${allProducts.length} ürün bulundu:\n`);
  allProducts.forEach((product) => {
    console.log(`  - ${product.name} (${product.OrganizasyonGrup?.name || 'Grup yok'}) - ₺${product.price?.toLocaleString('tr-TR') || 0} - ${product.isActive ? 'Aktif' : 'Pasif'}`);
  });

  console.log('\n✅ Ürünler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

