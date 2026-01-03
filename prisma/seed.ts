import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Slug oluşturma fonksiyonu
const createSlug = (name: string): string => {
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

async function seedUnits() {
  console.log('\n📦 Birimler ekleniyor...');
  
  const units = [
    { name: 'Hizmet', code: 'SERVICE', symbol: 'hizmet', category: 'service', isDefault: true, sortOrder: 0 },
    { name: 'Mililitre', code: 'ML', symbol: 'ml', category: 'volume', isDefault: false, sortOrder: 1 },
    { name: 'Kilogram', code: 'KG', symbol: 'kg', category: 'weight', isDefault: false, sortOrder: 2 },
    { name: 'Gram', code: 'GRAM', symbol: 'g', category: 'weight', isDefault: false, sortOrder: 3 },
    { name: 'Metre', code: 'METER', symbol: 'm', category: 'length', isDefault: false, sortOrder: 4 },
    { name: 'Litre', code: 'LITER', symbol: 'L', category: 'volume', isDefault: false, sortOrder: 5 },
    { name: 'Saat', code: 'HOUR', symbol: 'sa', category: 'time', isDefault: false, sortOrder: 6 },
    { name: 'Gün', code: 'DAY', symbol: 'gün', category: 'time', isDefault: false, sortOrder: 7 },
    { name: 'Adet', code: 'UNIT', symbol: 'adet', category: 'quantity', isDefault: false, sortOrder: 8 },
    { name: 'Kişi', code: 'PERSON', symbol: 'kişi', category: 'quantity', isDefault: false, sortOrder: 9 },
    { name: 'Paket', code: 'PACKAGE', symbol: 'paket', category: 'package', isDefault: false, sortOrder: 10 },
  ];

  await prisma.genelBirim.updateMany({
    where: { isDefault: true },
    data: { isDefault: false },
  });

  for (const unitData of units) {
    const slug = createSlug(unitData.name);
    const existing = await prisma.genelBirim.findFirst({
      where: { OR: [{ slug }, { name: unitData.name }] },
    });

    if (!existing) {
      await prisma.genelBirim.create({
        data: {
          id: `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: unitData.name,
          code: unitData.code,
          slug,
          symbol: unitData.symbol,
          category: unitData.category,
          isDefault: unitData.isDefault,
          isActive: true,
          sortOrder: unitData.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ ${unitData.name} eklendi`);
    } else {
      await prisma.genelBirim.update({
        where: { id: existing.id },
        data: {
          code: unitData.code,
          symbol: unitData.symbol,
          category: unitData.category,
          isDefault: unitData.isDefault,
          sortOrder: unitData.sortOrder,
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ ${unitData.name} güncellendi`);
    }
  }
}

async function seedReservationSources() {
  console.log('\n📋 Rezervasyon kaynakları ekleniyor...');
  
  const sources = [
    { name: 'Instagram', description: 'Instagram üzerinden gelen rezervasyonlar', icon: 'instagram', color: '#E4405F', sortOrder: 1 },
    { name: 'Facebook', description: 'Facebook üzerinden gelen rezervasyonlar', icon: 'facebook', color: '#1877F2', sortOrder: 2 },
    { name: 'Google', description: 'Google araması veya Google Ads üzerinden gelen rezervasyonlar', icon: 'google', color: '#4285F4', sortOrder: 3 },
    { name: 'Referans', description: 'Mevcut müşteri referansı ile gelen rezervasyonlar', icon: 'users', color: '#10B981', sortOrder: 4 },
    { name: 'Web Sitesi', description: 'Web sitesi üzerinden gelen rezervasyonlar', icon: 'globe', color: '#6366F1', sortOrder: 5 },
    { name: 'Telefon', description: 'Telefon ile gelen rezervasyonlar', icon: 'phone', color: '#F59E0B', sortOrder: 6 },
    { name: 'E-posta', description: 'E-posta ile gelen rezervasyonlar', icon: 'mail', color: '#8B5CF6', sortOrder: 7 },
    { name: 'Yerel Reklam', description: 'Yerel reklam kampanyalarından gelen rezervasyonlar', icon: 'megaphone', color: '#EC4899', sortOrder: 8 },
    { name: 'Diğer', description: 'Diğer kaynaklardan gelen rezervasyonlar', icon: 'more-horizontal', color: '#6B7280', sortOrder: 9 },
  ];

  for (const sourceData of sources) {
    const slug = createSlug(sourceData.name);
    const existing = await prisma.rezervasyonKaynak.findFirst({
      where: { OR: [{ slug }, { name: sourceData.name }] },
    });

    if (!existing) {
      await prisma.rezervasyonKaynak.create({
        data: {
          id: `source_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: sourceData.name,
          slug,
          description: sourceData.description,
          icon: sourceData.icon,
          color: sourceData.color,
          sortOrder: sourceData.sortOrder,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ ${sourceData.name} eklendi`);
    } else {
      console.log(`  - ${sourceData.name} zaten mevcut`);
    }
  }
}

async function seedReservationStatuses() {
  console.log('\n📊 Rezervasyon durumları ekleniyor...');
  
  const statuses = [
    { name: 'Beklemede', slug: 'beklemede', color: '#F59E0B', sortOrder: 1 },
    { name: 'Onaylandı', slug: 'onaylandi', color: '#10B981', sortOrder: 2 },
    { name: 'İptal Edildi', slug: 'iptal-edildi', color: '#EF4444', sortOrder: 3 },
    { name: 'Tamamlandı', slug: 'tamamlandi', color: '#6B7280', sortOrder: 4 },
    { name: 'Taslak', slug: 'taslak', color: '#9CA3AF', sortOrder: 5 },
  ];

  for (const statusData of statuses) {
    const existing = await prisma.rezervasyonDurum.findFirst({
      where: { OR: [{ slug: statusData.slug }, { name: statusData.name }] },
    });

    if (!existing) {
      await prisma.rezervasyonDurum.create({
        data: {
          id: `status_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: statusData.name,
          slug: statusData.slug,
          color: statusData.color,
          sortOrder: statusData.sortOrder,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ ${statusData.name} eklendi`);
    } else {
      console.log(`  - ${statusData.name} zaten mevcut`);
    }
  }
}

async function seedOrganizations() {
  console.log('\n🎉 Organizasyon grupları ekleniyor...');
  
  const organizations = [
    { name: 'Düğün', description: 'Düğün organizasyon hizmetleri', sortOrder: 1 },
    { name: 'Kına', description: 'Kına gecesi organizasyon hizmetleri', sortOrder: 2 },
    { name: 'Nişan', description: 'Nişan ve söz organizasyonları', sortOrder: 3 },
    { name: 'İsteme / Söz', description: 'İsteme ve söz merasimleri', sortOrder: 4 },
    { name: 'Sünnet', description: 'Sünnet organizasyon hizmetleri', sortOrder: 5 },
    { name: 'Mezuniyet', description: 'Mezuniyet ve kep atma törenleri', sortOrder: 6 },
    { name: 'Toplantı', description: 'Kurumsal toplantı ve etkinlikler', sortOrder: 7 },
    { name: 'Diğer', description: 'Diğer organizasyon türleri', sortOrder: 8 },
  ];

  for (const org of organizations) {
    const slug = createSlug(org.name);
    const existing = await prisma.organizasyonGrup.findFirst({
      where: { slug },
    });

    if (!existing) {
      await prisma.organizasyonGrup.create({
        data: {
          id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: org.name,
          slug,
          description: org.description,
          isActive: true,
          sortOrder: org.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ ${org.name} eklendi`);
    } else {
      console.log(`  - ${org.name} zaten mevcut`);
    }
  }
}

async function seedOffices() {
  console.log('\n🏢 Ofisler ekleniyor...');
  
  const offices = [
    {
      name: 'Çengelköy Davet Alanı',
      code: 'CENGELKOY',
      phone: '+90 216 222 22 22',
      email: 'cengelkoy@eventra.com',
      city: 'İstanbul',
      district: 'Üsküdar',
      addressLine1: 'İstanbul, Üsküdar / Çengelköy',
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Sarıyer Düğün Salonu',
      code: 'SARIYER',
      phone: '+90 212 111 11 11',
      email: 'sariyer@eventra.com',
      city: 'İstanbul',
      district: 'Sarıyer',
      addressLine1: 'İstanbul, Sarıyer',
      isActive: true,
      sortOrder: 2,
    },
  ];

  const createdOffices: any[] = [];
  for (const office of offices) {
    const existing = await prisma.ofisler.findFirst({
      where: { code: office.code },
    });

    if (!existing) {
      const created = await prisma.ofisler.create({
        data: {
          id: `office_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: office.name,
          code: office.code,
          phone: office.phone,
          email: office.email,
          city: office.city,
          district: office.district,
          addressLine1: office.addressLine1,
          isActive: office.isActive,
          sortOrder: office.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      createdOffices.push(created);
      console.log(`  ✓ ${office.name} eklendi`);
    } else {
      createdOffices.push(existing);
      console.log(`  - ${office.name} zaten mevcut`);
    }
  }

  return createdOffices;
}

async function seedSalons(offices: any[]) {
  console.log('\n🏛️ Salonlar ekleniyor...');
  
  const cengelkoyOffice = offices.find((o: any) => o.code === 'CENGELKOY');
  const sariyerOffice = offices.find((o: any) => o.code === 'SARIYER');

  const salons = [
    {
      name: 'Bahçe 1',
      officeId: sariyerOffice?.id,
      capacity: 400,
      area: 400,
      floor: 0,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Teras',
      officeId: cengelkoyOffice?.id,
      capacity: 500,
      area: 450,
      floor: 3,
      isActive: true,
      sortOrder: 2,
    },
  ];

  const createdSalons: any[] = [];
  for (const salon of salons) {
    if (!salon.officeId) continue;

    const slug = createSlug(salon.name);
    const existing = await prisma.subeler.findFirst({
      where: {
        name: salon.name,
        officeId: salon.officeId,
      },
    });

    if (!existing) {
      const created = await prisma.subeler.create({
        data: {
          id: `salon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: salon.name,
          slug: `${slug}-${Date.now()}`,
          officeId: salon.officeId,
          capacity: salon.capacity,
          area: salon.area,
          floor: salon.floor,
          isActive: salon.isActive,
          sortOrder: salon.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      createdSalons.push(created);
      console.log(`  ✓ ${salon.name} eklendi`);
    } else {
      createdSalons.push(existing);
      console.log(`  - ${salon.name} zaten mevcut`);
    }
  }

  return createdSalons;
}

async function seedTimeSlots(offices: any[], salons: any[]) {
  console.log('\n⏰ Zaman dilimleri ekleniyor...');
  
  const cengelkoyOffice = offices.find((o: any) => o.code === 'CENGELKOY');
  const sariyerOffice = offices.find((o: any) => o.code === 'SARIYER');
  const terasSalon = salons.find((s: any) => s.name === 'Teras');
  const bahce1Salon = salons.find((s: any) => s.name === 'Bahçe 1');

  const timeSlots = [
    { name: 'Öğlen', officeId: cengelkoyOffice?.id, salonId: terasSalon?.id, startTime: '16:00', endTime: '19:00', capacity: 400, sortOrder: 1 },
    { name: 'Akşam', officeId: cengelkoyOffice?.id, salonId: terasSalon?.id, startTime: '19:00', endTime: '23:59', capacity: 250, sortOrder: 2 },
    { name: 'Gündüz', officeId: cengelkoyOffice?.id, salonId: terasSalon?.id, startTime: '11:00', endTime: '16:00', capacity: 300, sortOrder: 3 },
    { name: 'Gündüz', officeId: cengelkoyOffice?.id, salonId: bahce1Salon?.id, startTime: '11:00', endTime: '16:00', capacity: 300, sortOrder: 4 },
    { name: 'Öğlen', officeId: sariyerOffice?.id, salonId: bahce1Salon?.id, startTime: '13:00', endTime: '17:00', capacity: null, sortOrder: 5 },
    { name: 'Akşam', officeId: sariyerOffice?.id, salonId: bahce1Salon?.id, startTime: '19:00', endTime: '23:00', capacity: null, sortOrder: 6 },
  ];

  for (const slot of timeSlots) {
    if (!slot.officeId) continue;

    const slug = `${slot.name}-${slot.startTime}-${slot.endTime}`
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await prisma.programSaatSlotlar_.findFirst({
      where: {
        name: slot.name,
        officeId: slot.officeId,
        salonId: slot.salonId || null,
        startTime: slot.startTime,
        endTime: slot.endTime,
      },
    });

    if (!existing) {
      await prisma.programSaatSlotlar_.create({
        data: {
          id: `timeslot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: slot.name,
          slug: `${slug}-${Date.now()}`,
          officeId: slot.officeId,
          salonId: slot.salonId || null,
          startTime: slot.startTime,
          endTime: slot.endTime,
          capacity: slot.capacity,
          isActive: true,
          sortOrder: slot.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ ${slot.name} (${slot.startTime}-${slot.endTime}) eklendi`);
    } else {
      console.log(`  - ${slot.name} zaten mevcut`);
    }
  }
}

async function seedUsers() {
  console.log('\n👤 Kullanıcılar ekleniyor...');
  
  const users = [
    { name: 'Admin', email: 'admin@eventra.local', password: 'admin123', role: 'admin', isActive: true },
    { name: 'Enes Gedik', email: 'menesgedik@gmail.com', password: 'password123', role: 'admin', isActive: true },
    { name: 'Kenan Reis', email: 'kenan@blackwool.app', password: 'password123', role: 'admin', isActive: true },
  ];

  for (const user of users) {
    const existing = await prisma.kullan_c_lar.findFirst({
      where: { email: user.email },
    });

    if (!existing) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await prisma.kullan_c_lar.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: user.name,
          email: user.email,
          passwordHash: hashedPassword,
          role: user.role,
          isActive: user.isActive,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`  ✓ ${user.name} (${user.email}) eklendi`);
    } else {
      console.log(`  - ${user.name} zaten mevcut`);
    }
  }
}

async function seedSettings() {
  console.log('\n⚙️ Varsayılan ayarlar ekleniyor...');
  
  // General Settings
  const generalSettings = await prisma.generalSettings.findFirst();
  if (!generalSettings) {
    await prisma.generalSettings.create({
      data: {
        companyName: 'Eventra',
        companyEmail: 'info@eventra.com',
        companyPhone: '+90 212 000 00 00',
        defaultLanguage: 'tr',
        defaultTimezone: 'Europe/Istanbul',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24',
        currency: 'TRY',
        currencySymbol: '₺',
      },
    });
    console.log('  ✓ Genel ayarlar eklendi');
  } else {
    console.log('  - Genel ayarlar zaten mevcut');
  }

  // Calendar Settings
  const calendarSettings = await prisma.calendarSettings.findFirst();
  if (!calendarSettings) {
    await prisma.calendarSettings.create({
      data: {
        defaultView: 'month',
        weekStartDay: 'monday',
        showWeekends: true,
        businessHoursStart: '09:00',
        businessHoursEnd: '18:00',
        slotDuration: 30,
        slotLabelInterval: 60,
        firstDayOfWeek: 1,
        showTimeSlots: true,
        defaultDateRange: 30,
      },
    });
    console.log('  ✓ Takvim ayarları eklendi');
  } else {
    console.log('  - Takvim ayarları zaten mevcut');
  }

  // Theme Settings
  const themeSettings = await prisma.themeSettings.findFirst();
  if (!themeSettings) {
    await prisma.themeSettings.create({
      data: {
        primaryColor: '#2563eb',
        secondaryColor: '#64748b',
        darkMode: false,
        fontFamily: 'Inter',
        fontSize: 'medium',
      },
    });
    console.log('  ✓ Tema ayarları eklendi');
  } else {
    console.log('  - Tema ayarları zaten mevcut');
  }
}

async function main() {
  console.log('🌱 Veritabanı seed işlemi başlatılıyor...\n');

  try {
    // Temel veriler
    await seedUnits();
    await seedReservationSources();
    await seedReservationStatuses();
    await seedOrganizations();
    
    // Ofis ve salonlar
    const offices = await seedOffices();
    const salons = await seedSalons(offices);
    await seedTimeSlots(offices, salons);
    
    // Kullanıcılar ve ayarlar
    await seedUsers();
    await seedSettings();

    console.log('\n✅ Tüm seed işlemleri başarıyla tamamlandı!');
    console.log('\n📝 Not: Gerçek veriler için seed script\'lerini çalıştırabilirsiniz:');
    console.log('   - npm run add-test-reservations');
    console.log('   - npm run add-test-cash-boxes');
  } catch (error) {
    console.error('\n❌ Seed işlemi sırasında hata oluştu:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

