import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addTestRole() {
  try {
    console.log('Test rolü ekleniyor...');

    // Test rolü oluştur
    const testRole = await prisma.roller.create({
      data: {
        id: `role_test_${Date.now()}`,
        name: 'Test Rolü',
        description: 'Bu bir test rolüdür. Sistem testleri için oluşturulmuştur.',
        isDefault: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log('✓ Test rolü başarıyla eklendi:');
    console.log(`  - ID: ${testRole.id}`);
    console.log(`  - Ad: ${testRole.name}`);
    console.log(`  - Açıklama: ${testRole.description}`);
    console.log(`  - Aktif: ${testRole.isActive}`);
  } catch (error: any) {
    if (error.code === 'P2002') {
      console.log('⚠ Test rolü zaten mevcut. Silinip yeniden oluşturuluyor...');
      
      // Mevcut test rolünü sil
      await prisma.roller.deleteMany({
        where: {
          name: 'Test Rolü',
        },
      });

      // Yeniden oluştur
      const testRole = await prisma.roller.create({
        data: {
          id: `role_test_${Date.now()}`,
          name: 'Test Rolü',
          description: 'Bu bir test rolüdür. Sistem testleri için oluşturulmuştur.',
          isDefault: false,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      console.log('✓ Test rolü başarıyla yeniden oluşturuldu:');
      console.log(`  - ID: ${testRole.id}`);
      console.log(`  - Ad: ${testRole.name}`);
    } else {
      console.error('✗ Hata:', error.message);
      throw error;
    }
  } finally {
    await prisma.$disconnect();
  }
}

addTestRole();

