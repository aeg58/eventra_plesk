import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Örnek rezervasyon kaynakları (lead kaynakları) ekleniyor...\n');

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

  // Yaygın lead kaynakları
  const sources = [
    {
      name: 'Instagram',
      description: 'Instagram üzerinden gelen rezervasyonlar',
      icon: 'instagram',
      color: '#E4405F',
      sortOrder: 1,
    },
    {
      name: 'Facebook',
      description: 'Facebook üzerinden gelen rezervasyonlar',
      icon: 'facebook',
      color: '#1877F2',
      sortOrder: 2,
    },
    {
      name: 'Google',
      description: 'Google araması veya Google Ads üzerinden gelen rezervasyonlar',
      icon: 'google',
      color: '#4285F4',
      sortOrder: 3,
    },
    {
      name: 'Referans',
      description: 'Mevcut müşteri referansı ile gelen rezervasyonlar',
      icon: 'users',
      color: '#10B981',
      sortOrder: 4,
    },
    {
      name: 'Web Sitesi',
      description: 'Web sitesi üzerinden gelen rezervasyonlar',
      icon: 'globe',
      color: '#6366F1',
      sortOrder: 5,
    },
    {
      name: 'Telefon',
      description: 'Telefon ile gelen rezervasyonlar',
      icon: 'phone',
      color: '#F59E0B',
      sortOrder: 6,
    },
    {
      name: 'E-posta',
      description: 'E-posta ile gelen rezervasyonlar',
      icon: 'mail',
      color: '#8B5CF6',
      sortOrder: 7,
    },
    {
      name: 'Yerel Reklam',
      description: 'Yerel reklam kampanyalarından gelen rezervasyonlar',
      icon: 'megaphone',
      color: '#EC4899',
      sortOrder: 8,
    },
    {
      name: 'Diğer',
      description: 'Diğer kaynaklardan gelen rezervasyonlar',
      icon: 'more-horizontal',
      color: '#6B7280',
      sortOrder: 9,
    },
  ];

  for (const sourceData of sources) {
    const slug = createSlug(sourceData.name);
    const existing = await prisma.rezervasyonKaynak.findFirst({
      where: { 
        OR: [
          { slug },
          { name: sourceData.name }
        ]
      },
    });

    if (!existing) {
      await prisma.rezervasyonKaynak.create({
        data: {
          id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: sourceData.name,
          slug: slug,
          description: sourceData.description,
          icon: sourceData.icon,
          color: sourceData.color,
          sortOrder: sourceData.sortOrder,
          isActive: true,
          createdAt: now,
          updatedAt: now,
        },
      });
      console.log(`✓ ${sourceData.name} eklendi`);
    } else {
      console.log(`- ${sourceData.name} zaten mevcut`);
    }
  }

  // Tüm kaynakları listele
  const allSources = await prisma.rezervasyonKaynak.findMany({
    orderBy: {
      sortOrder: 'asc',
    },
  });

  console.log(`\n📊 Toplam ${allSources.length} kaynak bulundu:\n`);
  allSources.forEach((source) => {
    console.log(`  - ${source.name} (${source.description || 'Açıklama yok'}) - ${source.isActive ? 'Aktif' : 'Pasif'}`);
  });

  console.log('\n✅ Rezervasyon kaynakları başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

