import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Kullanıcılar kontrol ediliyor ve düzeltiliyor...\n');

  // Örnek kullanıcılar
  const users = [
    {
      name: 'Enes Gedik',
      email: 'menesgedik@gmail.com',
      password: 'password123',
      role: 'Admin',
      isActive: true,
      lastLoginAt: new Date('2025-12-13'),
    },
    {
      name: 'Kenan Reis',
      email: 'kenan@blackwool.app',
      password: 'password123',
      role: 'Admin',
      isActive: true,
      lastLoginAt: new Date('2025-12-16'),
    },
    {
      name: 'Erol Sarı',
      email: 'erol@admuch.com',
      password: 'password123',
      role: 'Admin',
      isActive: true,
      lastLoginAt: new Date('2025-12-04'),
    },
    {
      name: 'Ali Erdem',
      email: 'ali@blackwool.app',
      password: 'password123',
      role: 'Admin',
      isActive: true,
      lastLoginAt: new Date('2025-12-22'),
    },
    {
      name: 'Sistem Yöneticisi',
      email: 'admin@eventra.local',
      password: 'password123',
      role: 'Admin',
      isActive: true,
      lastLoginAt: new Date('2025-12-06'),
    },
  ];

  // Önce Admin rolünü oluştur veya bul
  let adminRole = await prisma.roller.findFirst({
    where: { name: 'Admin' },
  });

  if (!adminRole) {
    adminRole = await prisma.roller.create({
      data: {
        id: `role_admin_${Date.now()}`,
        name: 'Admin',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });
    console.log('✓ Admin rolü oluşturuldu');
  } else {
    console.log('✓ Admin rolü zaten mevcut');
  }

  for (const userData of users) {
    const existing = await prisma.kullan_c_lar.findFirst({
      where: { email: userData.email },
    });

    // Şifreyi bcrypt ile hash'le
    const passwordHash = await bcrypt.hash(userData.password, 10);

    if (existing) {
      // Mevcut kullanıcıyı güncelle
      await prisma.kullan_c_lar.update({
        where: { id: existing.id },
        data: {
          name: userData.name,
          passwordHash: passwordHash,
          role: userData.role,
          roleId: adminRole.id,
          isActive: userData.isActive,
          lastLoginAt: userData.lastLoginAt,
          username: userData.email.split('@')[0],
          updatedAt: new Date(),
        },
      });
      console.log(`✓ Kullanıcı güncellendi: ${userData.name}`);
    } else {
      // Yeni kullanıcı oluştur
      await prisma.kullan_c_lar.create({
        data: {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: userData.name,
          email: userData.email,
          passwordHash: passwordHash,
          role: userData.role,
          roleId: adminRole.id,
          isActive: userData.isActive,
          lastLoginAt: userData.lastLoginAt,
          username: userData.email.split('@')[0],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log(`✓ Kullanıcı oluşturuldu: ${userData.name}`);
    }
  }

  // Tüm kullanıcıları listele
  const allUsers = await prisma.kullan_c_lar.findMany({
    include: {
      Roller: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  console.log(`\n📊 Toplam ${allUsers.length} kullanıcı bulundu:\n`);
  allUsers.forEach((user) => {
    console.log(`  - ${user.name} (${user.email}) - ${user.role} - ${user.isActive ? 'Aktif' : 'Pasif'}`);
  });

  console.log('\n✅ Kullanıcılar başarıyla düzeltildi!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

