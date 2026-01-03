import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Örnek veriler ekleniyor...');

  // 1. Organizasyon Grupları
  const organizations = [
    { name: 'Düğün', description: 'Düğün organizasyon hizmetleri', sortOrder: 1 },
    { name: 'Kına', description: 'Kına gecesi organizasyon hizmetleri', sortOrder: 2 },
    { name: 'Nişan', description: 'Nişan ve söz organizasyonları', sortOrder: 3 },
    { name: 'İsteme / Söz', description: 'İsteme ve söz merasimleri', sortOrder: 4 },
    { name: 'Sünnet', description: 'Sünnet organizasyon hizmetleri', sortOrder: 5 },
    { name: 'Mezuniyet', description: 'Mezuniyet ve kep atma törenleri', sortOrder: 6 },
    { name: 'Toplantı', description: 'Kurumsal toplantı ve etkinlikler', sortOrder: 7 },
    { name: 'test', description: null, sortOrder: 8 },
    { name: 'Diğer', description: 'Diğer organizasyon türleri', sortOrder: 9 },
  ];

  for (const org of organizations) {
    const slug = org.name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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
      console.log(`✓ Organizasyon eklendi: ${org.name}`);
    } else {
      console.log(`- Organizasyon zaten var: ${org.name}`);
    }
  }

  // 2. Ofisler (Şubeler)
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
      console.log(`✓ Ofis eklendi: ${office.name}`);
    } else {
      createdOffices.push(existing);
      console.log(`- Ofis zaten var: ${office.name}`);
    }
  }

  const cengelkoyOffice = createdOffices.find((o: any) => o.code === 'CENGELKOY');
  const sariyerOffice = createdOffices.find((o: any) => o.code === 'SARIYER');

  // 3. Salonlar
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

    const slug = salon.name
      .toLowerCase()
      .replace(/ğ/g, 'g')
      .replace(/ü/g, 'u')
      .replace(/ş/g, 's')
      .replace(/ı/g, 'i')
      .replace(/ö/g, 'o')
      .replace(/ç/g, 'c')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

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
      console.log(`✓ Salon eklendi: ${salon.name}`);
    } else {
      createdSalons.push(existing);
      console.log(`- Salon zaten var: ${salon.name}`);
    }
  }

  const terasSalon = createdSalons.find((s: any) => s.name === 'Teras');
  const bahce1Salon = createdSalons.find((s: any) => s.name === 'Bahçe 1');

  // 4. Zaman Dilimleri
  const timeSlots = [
    {
      name: 'Öğlen',
      officeId: cengelkoyOffice?.id,
      salonId: terasSalon?.id,
      startTime: '16:00',
      endTime: '19:00',
      capacity: 400,
      isActive: true,
      sortOrder: 1,
    },
    {
      name: 'Akşam',
      officeId: cengelkoyOffice?.id,
      salonId: terasSalon?.id,
      startTime: '19:00',
      endTime: '23:59',
      capacity: 250,
      isActive: true,
      sortOrder: 2,
    },
    {
      name: 'Gündüz',
      officeId: cengelkoyOffice?.id,
      salonId: terasSalon?.id,
      startTime: '11:00',
      endTime: '16:00',
      capacity: 300,
      isActive: true,
      sortOrder: 3,
    },
    {
      name: 'Gündüz',
      officeId: cengelkoyOffice?.id,
      salonId: bahce1Salon?.id,
      startTime: '11:00',
      endTime: '16:00',
      capacity: 300,
      isActive: true,
      sortOrder: 4,
    },
    {
      name: 'Öğlen',
      officeId: sariyerOffice?.id,
      salonId: bahce1Salon?.id,
      startTime: '13:00',
      endTime: '17:00',
      capacity: null,
      isActive: true,
      sortOrder: 5,
    },
    {
      name: 'Akşam',
      officeId: sariyerOffice?.id,
      salonId: bahce1Salon?.id,
      startTime: '19:00',
      endTime: '23:00',
      capacity: null,
      isActive: true,
      sortOrder: 6,
    },
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
          isActive: slot.isActive,
          sortOrder: slot.sortOrder,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✓ Zaman dilimi eklendi: ${slot.name} (${slot.startTime}-${slot.endTime})`);
    } else {
      console.log(`- Zaman dilimi zaten var: ${slot.name}`);
    }
  }

  // 5. Kullanıcılar (Yetkililer)
  const users = [
    {
      name: 'Enes Gedik',
      email: 'menesgedik@gmail.com',
      password: 'password123',
      role: 'Admin',
      isActive: true,
    },
    {
      name: 'Kenan Reis',
      email: 'kenan@blackwool.app',
      password: 'password123',
      role: 'Admin',
      isActive: true,
    },
    {
      name: 'Erol Sarı',
      email: 'erol@admuch.com',
      password: 'password123',
      role: 'Admin',
      isActive: true,
    },
    {
      name: 'Ali Erdem',
      email: 'ali@blackwool.app',
      password: 'password123',
      role: 'Admin',
      isActive: true,
    },
    {
      name: 'Sistem Yöneticisi',
      email: 'admin@eventra.local',
      password: 'password123',
      role: 'Admin',
      isActive: true,
    },
  ];

  for (const user of users) {
    const existing = await prisma.kullan_c_lar.findFirst({
      where: { email: user.email },
    });

    if (!existing) {
      // Şifreyi hash'le (basit bir örnek, gerçekte bcrypt kullanılmalı)
      const hashedPassword = Buffer.from(user.password).toString('base64');

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
      console.log(`✓ Kullanıcı eklendi: ${user.name}`);
    } else {
      console.log(`- Kullanıcı zaten var: ${user.name}`);
    }
  }

  console.log('\n✅ Tüm örnek veriler başarıyla eklendi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

