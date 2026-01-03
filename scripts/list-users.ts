import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log('\n📋 Veritabanındaki Tüm Kullanıcılar:\n');
    console.log('═'.repeat(100));
    
    const users = await prisma.kullan_c_lar.findMany({
      include: {
        Roller: {
          select: {
            name: true,
          },
        },
        Ofisler: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (users.length === 0) {
      console.log('❌ Veritabanında kullanıcı bulunamadı.\n');
      return;
    }

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. Kullanıcı:`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Ad: ${user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : 'Belirtilmemiş')}`);
      console.log(`   🔑 Username: ${user.username || 'Belirtilmemiş'}`);
      console.log(`   📱 Telefon: ${user.phone || 'Belirtilmemiş'}`);
      console.log(`   🎭 Rol: ${user.Roller?.name || user.role || 'Belirtilmemiş'}`);
      console.log(`   🏢 Ofis: ${user.Ofisler?.name || 'Belirtilmemiş'}`);
      console.log(`   ✅ Durum: ${user.isActive ? 'Aktif' : 'Pasif'}`);
      console.log(`   🔒 Kilitli: ${user.isLocked ? 'Evet' : 'Hayır'}`);
      console.log(`   📅 Oluşturulma: ${user.createdAt ? new Date(user.createdAt).toLocaleString('tr-TR') : 'Belirtilmemiş'}`);
      console.log(`   🔐 Şifre Hash: ${user.passwordHash ? 'Var ✓' : 'Yok ✗'}`);
      console.log(`   🕐 Son Giriş: ${user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('tr-TR') : 'Hiç giriş yapılmamış'}`);
      console.log('   ' + '-'.repeat(90));
    });

    console.log(`\n✅ Toplam ${users.length} kullanıcı bulundu.\n`);
    
  } catch (error: any) {
    console.error('❌ Hata:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();



