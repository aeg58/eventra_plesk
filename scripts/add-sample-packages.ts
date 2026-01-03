import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Örnek organizasyon paketleri ekleniyor...\n');

  // Organizasyon gruplarını bul
  const allGroups = await prisma.organizasyonGrup.findMany();
  
  const dugunGroup = allGroups.find(g => 
    g.slug.toLowerCase() === 'dugun' || 
    g.name.toLowerCase().includes('düğün') ||
    g.name.toLowerCase().includes('dugun')
  );

  const kinaGroup = allGroups.find(g => 
    g.slug.toLowerCase() === 'kina' || 
    g.name.toLowerCase().includes('kına') ||
    g.name.toLowerCase().includes('kina')
  );

  if (!dugunGroup) {
    console.error('Düğün grubu bulunamadı!');
    return;
  }

  if (!kinaGroup) {
    console.error('Kına grubu bulunamadı!');
    return;
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

  // 1. Klasik Düğün Paketi
  const klasikDugunSlug = createSlug('Klasik Düğün Paketi');
  const existingKlasik = await prisma.organizasyonPaketler.findFirst({
    where: { slug: klasikDugunSlug },
  });

  if (!existingKlasik) {
    await prisma.organizasyonPaketler.create({
      data: {
        id: `pkg_klasik_dugun_${Date.now()}`,
        name: 'Klasik Düğün Paketi',
        slug: klasikDugunSlug,
        description: 'FULL PAKET KARŞILAMADA ŞERBET VE LOKUM İKRAMI BAYAN DJ SINIRSIZ VİDEO ÇEKİMİ (HD KALİTESİ) 2 ADET KOSTÜMLÜ KINA DANSÇILARIMIZ DANSÇILARIMIZIN ÖZEL DANS KAREOGRAFİSİ KINA TAHTI-CİBİNLİĞ',
        groupId: dugunGroup.id,
        price: 60000,
        perPersonPrice: 250,
        isActive: true,
        sortOrder: 1,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log('✓ Klasik Düğün Paketi eklendi');
  } else {
    console.log('- Klasik Düğün Paketi zaten mevcut');
  }

  // 2. Premium Kına Paketi
  const premiumKinaSlug = createSlug('Premium Kına Paketi');
  const existingPremiumKina = await prisma.organizasyonPaketler.findFirst({
    where: { slug: premiumKinaSlug },
  });

  if (!existingPremiumKina) {
    await prisma.organizasyonPaketler.create({
      data: {
        id: `pkg_premium_kina_${Date.now()}`,
        name: 'Premium Kına Paketi',
        slug: premiumKinaSlug,
        description: 'Kapsamlı kına gecesi hizmetleri',
        groupId: kinaGroup.id,
        price: 32000,
        perPersonPrice: 320,
        isActive: true,
        sortOrder: 2,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log('✓ Premium Kına Paketi eklendi');
  } else {
    console.log('- Premium Kına Paketi zaten mevcut');
  }

  // 3. Premium (typo: preimum)
  const premiumSlug = createSlug('preimum');
  const existingPremium = await prisma.organizasyonPaketler.findFirst({
    where: { slug: premiumSlug },
  });

  if (!existingPremium) {
    await prisma.organizasyonPaketler.create({
      data: {
        id: `pkg_premium_${Date.now()}`,
        name: 'preimum',
        slug: premiumSlug,
        description: 'sdasdad',
        groupId: dugunGroup.id,
        price: 100000,
        perPersonPrice: 1000,
        isActive: true,
        sortOrder: 3,
        createdAt: now,
        updatedAt: now,
      },
    });
    console.log('✓ Premium (preimum) paketi eklendi');
  } else {
    console.log('- Premium (preimum) paketi zaten mevcut');
  }

  // Tüm paketleri listele
  const allPackages = await prisma.organizasyonPaketler.findMany({
    include: {
      OrganizasyonGrup: true,
    },
    orderBy: {
      sortOrder: 'asc',
    },
  });

  console.log(`\n📊 Toplam ${allPackages.length} paket bulundu:\n`);
  allPackages.forEach((pkg) => {
    console.log(`  - ${pkg.name} (${pkg.OrganizasyonGrup?.name || 'Grup yok'}) - ₺${pkg.price?.toLocaleString('tr-TR') || 0} - ${pkg.isActive ? 'Aktif' : 'Pasif'}`);
  });

  console.log('\n✅ Paketler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

