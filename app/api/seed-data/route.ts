import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Örnek verileri ekle
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const results: any = {
      organizations: [],
      offices: [],
      salons: [],
      timeSlots: [],
      users: [],
    };

    // 1. Organizasyon Grupları
    const orgGroups = [
      { name: 'Düğün', description: 'Düğün organizasyon hizmetleri', sortOrder: 1 },
      { name: 'Kına', description: 'Kına gecesi organizasyon hizmetleri', sortOrder: 2 },
      { name: 'Nişan', description: 'Nişan ve söz organizasyonları', sortOrder: 3 },
      { name: 'İsteme / Söz', description: 'İsteme ve söz merasimleri', sortOrder: 4 },
      { name: 'Sünnet', description: 'Sünnet organizasyon hizmetleri', sortOrder: 5 },
      { name: 'Mezuniyet', description: 'Mezuniyet ve kep atma törenleri', sortOrder: 6 },
      { name: 'Toplantı', description: 'Kurumsal toplantı ve etkinlikler', sortOrder: 7 },
      { name: 'Diğer', description: 'Diğer organizasyon türleri', sortOrder: 8 },
    ];

    for (const org of orgGroups) {
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
        const created = await prisma.organizasyonGrup.create({
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
        results.organizations.push(created);
      } else {
        results.organizations.push(existing);
      }
    }

    // 2. Ofisler (Şubeler)
    const offices = [
      {
        name: 'Çengelköy Davet Alanı',
        code: 'CENGELKOY',
        phone: '+90 216 222 22 22',
        email: 'cengelkoy@eventra.com',
        address: 'İstanbul, Üsküdar / Çengelköy',
        isActive: true,
      },
      {
        name: 'Sarıyer Düğün Salonu',
        code: 'SARIYER',
        phone: '+90 212 111 11 11',
        email: 'sariyer@eventra.com',
        address: 'İstanbul, Sarıyer',
        isActive: true,
      },
    ];

    for (const office of offices) {
      const existing = await prisma.ofisler.findFirst({
        where: { code: office.code },
      });

      if (!existing) {
        const addressParts = office.address.split(', ');
        const created = await prisma.ofisler.create({
          data: {
            id: `office_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: office.name,
            code: office.code,
            phone: office.phone,
            email: office.email,
            city: addressParts[0] || null,
            district: addressParts.length > 1 ? addressParts[1] : null,
            addressLine1: office.address,
            isActive: office.isActive,
            sortOrder: results.offices.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        results.offices.push(created);
      } else {
        results.offices.push(existing);
      }
    }

    // 3. Salonlar
    const cengelkoyOffice = results.offices.find((o: any) => o.code === 'CENGELKOY') || results.offices[0];
    const sariyerOffice = results.offices.find((o: any) => o.code === 'SARIYER') || results.offices[1];

    const salons = [
      {
        name: 'Teras',
        officeId: cengelkoyOffice?.id,
        capacity: 500,
        area: 450,
        floor: 3,
        isActive: true,
      },
      {
        name: 'Bahçe 1',
        officeId: sariyerOffice?.id,
        capacity: 400,
        area: 400,
        floor: 0,
        isActive: true,
      },
    ];

    for (const salon of salons) {
      if (!salon.officeId) continue;

      const existing = await prisma.subeler.findFirst({
        where: {
          name: salon.name,
          officeId: salon.officeId,
        },
      });

      if (!existing) {
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
            sortOrder: results.salons.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        results.salons.push(created);
      } else {
        results.salons.push(existing);
      }
    }

    // 4. Zaman Dilimleri
    const terasSalon = results.salons.find((s: any) => s.name === 'Teras');
    const bahce1Salon = results.salons.find((s: any) => s.name === 'Bahçe 1');

    const timeSlots = [
      {
        name: 'Öğlen',
        officeId: cengelkoyOffice?.id,
        salonId: terasSalon?.id,
        startTime: '16:00',
        endTime: '19:00',
        capacity: 400,
        isActive: true,
      },
      {
        name: 'Akşam',
        officeId: cengelkoyOffice?.id,
        salonId: terasSalon?.id,
        startTime: '19:00',
        endTime: '23:59',
        capacity: 250,
        isActive: true,
      },
      {
        name: 'Gündüz',
        officeId: cengelkoyOffice?.id,
        salonId: terasSalon?.id,
        startTime: '11:00',
        endTime: '16:00',
        capacity: 300,
        isActive: true,
      },
      {
        name: 'Gündüz',
        officeId: cengelkoyOffice?.id,
        salonId: bahce1Salon?.id,
        startTime: '11:00',
        endTime: '16:00',
        capacity: 300,
        isActive: true,
      },
      {
        name: 'Öğlen',
        officeId: sariyerOffice?.id,
        salonId: bahce1Salon?.id,
        startTime: '13:00',
        endTime: '17:00',
        capacity: null,
        isActive: true,
      },
      {
        name: 'Akşam',
        officeId: sariyerOffice?.id,
        salonId: bahce1Salon?.id,
        startTime: '19:00',
        endTime: '23:00',
        capacity: null,
        isActive: true,
      },
    ];

    for (const slot of timeSlots) {
      if (!slot.officeId) continue;

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

        const created = await prisma.programSaatSlotlar_.create({
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
            sortOrder: results.timeSlots.length,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        results.timeSlots.push(created);
      } else {
        results.timeSlots.push(existing);
      }
    }

    // 5. Kullanıcılar (Yetkililer)
    const users = [
      {
        name: 'Enes Gedik',
        email: 'menesgedik@gmail.com',
        password: 'password123', // Gerçek uygulamada hash'lenmeli
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
    ];

    for (const user of users) {
      const existing = await prisma.kullan_c_lar.findFirst({
        where: { email: user.email },
      });

      if (!existing) {
        // Şifreyi hash'le (basit bir örnek, gerçekte bcrypt kullanılmalı)
        const hashedPassword = Buffer.from(user.password).toString('base64'); // Geçici çözüm

        const created = await prisma.kullan_c_lar.create({
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
        results.users.push(created);
      } else {
        results.users.push(existing);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Örnek veriler başarıyla eklendi',
      results: {
        organizations: results.organizations.length,
        offices: results.offices.length,
        salons: results.salons.length,
        timeSlots: results.timeSlots.length,
        users: results.users.length,
      },
    });
  } catch (error: any) {
    console.error('Seed data error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

