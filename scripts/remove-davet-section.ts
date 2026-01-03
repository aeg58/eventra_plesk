import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Davet Bilgileri bölümü ve alanları siliniyor...\n');

  try {
    // Davet bilgileri bölümünü bul
    const davetSection = await prisma.formSectionMaster.findUnique({
      where: { globalKey: 'davet-bilgileri' },
      include: {
        FormFieldMaster: true,
      },
    });

    if (davetSection) {
      // Önce bölümdeki tüm alanları sil
      for (const field of davetSection.FormFieldMaster) {
        // Visibility kayıtlarını sil
        await prisma.formFieldVisibility.deleteMany({
          where: { fieldId: field.id },
        });
        
        // Field'ı sil
        await prisma.formFieldMaster.delete({
          where: { id: field.id },
        });
        console.log(`✓ Alan silindi: ${field.label}`);
      }

      // Bölümü sil
      await prisma.formSectionMaster.delete({
        where: { id: davetSection.id },
      });
      console.log(`✓ Bölüm silindi: ${davetSection.title}`);
    } else {
      console.log('Davet Bilgileri bölümü bulunamadı.');
    }

    console.log('\n✅ Davet Bilgileri bölümü ve alanları başarıyla silindi!');
  } catch (error: any) {
    console.error('Hata:', error);
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

