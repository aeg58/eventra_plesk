import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Form bölümleri ve alanları oluşturuluyor...\n');

  const now = new Date();

  // 1. Sünnet Bilgileri
  const sunnetSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'sunnet-bilgileri' },
    update: {},
    create: {
      id: 'section_sunnet',
      title: 'Sünnet Bilgileri',
      description: 'Sünnet organizasyonu için gerekli bilgiler',
      globalKey: 'sunnet-bilgileri',
      sortOrder: 1,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_sunnet_cocuk_adi' },
    update: {},
    create: {
      id: 'field_sunnet_cocuk_adi',
      sectionId: sunnetSection.id,
      label: 'Sünnet Çocuğu Adı Soyadı',
      fieldKey: 'sunnet_cocuk_adi',
      type: 'text',
      placeholder: 'Ad Soyad',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_veli_adi' },
    update: {},
    create: {
      id: 'field_veli_adi',
      sectionId: sunnetSection.id,
      label: 'Veli Adı Soyadı',
      fieldKey: 'veli_adi',
      type: 'text',
      placeholder: 'Veli Adı Soyadı',
      sortOrder: 1,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_veli_telefon' },
    update: {},
    create: {
      id: 'field_veli_telefon',
      sectionId: sunnetSection.id,
      label: 'Veli Telefon',
      fieldKey: 'veli_telefon',
      type: 'phone',
      placeholder: '05XX XXX XX XX',
      sortOrder: 2,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 2. Etkinlik Bilgileri
  const etkinlikSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'etkinlik-bilgileri' },
    update: {},
    create: {
      id: 'section_etkinlik',
      title: 'Etkinlik Bilgileri',
      description: 'Genel etkinlik bilgileri',
      globalKey: 'etkinlik-bilgileri',
      sortOrder: 2,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_etkinlik_adi' },
    update: {},
    create: {
      id: 'field_etkinlik_adi',
      sectionId: etkinlikSection.id,
      label: 'Etkinlik Adı',
      fieldKey: 'etkinlik_adi',
      type: 'text',
      placeholder: 'Etkinlik Adı',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_yetkili_adi_etkinlik' },
    update: {},
    create: {
      id: 'field_yetkili_adi_etkinlik',
      sectionId: etkinlikSection.id,
      label: 'Yetkili Adı Soyadı',
      fieldKey: 'yetkili_adi_etkinlik',
      type: 'text',
      placeholder: 'Yetkili Adı Soyadı',
      sortOrder: 1,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_yetkili_telefon_etkinlik' },
    update: {},
    create: {
      id: 'field_yetkili_telefon_etkinlik',
      sectionId: etkinlikSection.id,
      label: 'Yetkili Telefon',
      fieldKey: 'yetkili_telefon_etkinlik',
      type: 'phone',
      placeholder: '05XX XXX XX XX',
      sortOrder: 2,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 3. Mezuniyet Bilgileri
  const mezuniyetSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'mezuniyet-bilgileri' },
    update: {},
    create: {
      id: 'section_mezuniyet',
      title: 'Mezuniyet Bilgileri',
      description: 'Mezuniyet organizasyonu için gerekli bilgiler',
      globalKey: 'mezuniyet-bilgileri',
      sortOrder: 3,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_okul_adi' },
    update: {},
    create: {
      id: 'field_okul_adi',
      sectionId: mezuniyetSection.id,
      label: 'Okul Adı',
      fieldKey: 'okul_adi',
      type: 'text',
      placeholder: 'Okul Adı',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_yetkili_adi_mezuniyet' },
    update: {},
    create: {
      id: 'field_yetkili_adi_mezuniyet',
      sectionId: mezuniyetSection.id,
      label: 'Yetkili Adı Soyadı',
      fieldKey: 'yetkili_adi_mezuniyet',
      type: 'text',
      placeholder: 'Yetkili Adı Soyadı',
      sortOrder: 1,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_yetkili_telefon_mezuniyet' },
    update: {},
    create: {
      id: 'field_yetkili_telefon_mezuniyet',
      sectionId: mezuniyetSection.id,
      label: 'Yetkili Telefon',
      fieldKey: 'yetkili_telefon_mezuniyet',
      type: 'phone',
      placeholder: '05XX XXX XX XX',
      sortOrder: 2,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 4. Davet Bilgileri
  const davetSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'davet-bilgileri' },
    update: {},
    create: {
      id: 'section_davet',
      title: 'Davet Bilgileri',
      description: 'Davet bilgileri',
      globalKey: 'davet-bilgileri',
      sortOrder: 8,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_davet_adi' },
    update: {},
    create: {
      id: 'field_davet_adi',
      sectionId: davetSection.id,
      label: 'Ad Soyad',
      fieldKey: 'davet_adi',
      type: 'text',
      placeholder: 'Ad Soyad',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_davet_telefon' },
    update: {},
    create: {
      id: 'field_davet_telefon',
      sectionId: davetSection.id,
      label: 'Telefon',
      fieldKey: 'davet_telefon',
      type: 'phone',
      placeholder: '05XX XXX XX XX',
      sortOrder: 1,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_davet_memleket' },
    update: {},
    create: {
      id: 'field_davet_memleket',
      sectionId: davetSection.id,
      label: 'Memleket',
      fieldKey: 'davet_memleket',
      type: 'text',
      placeholder: 'Memleket',
      sortOrder: 2,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_davet_sehir' },
    update: {},
    create: {
      id: 'field_davet_sehir',
      sectionId: davetSection.id,
      label: 'Şehir seçin',
      fieldKey: 'davet_sehir',
      type: 'city',
      placeholder: 'Şehir seçin',
      sortOrder: 3,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 5. Damat Bilgileri
  const damatSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'damat-bilgileri' },
    update: {},
    create: {
      id: 'section_damat',
      title: 'Damat Bilgileri',
      description: 'Damat bilgileri',
      globalKey: 'damat-bilgileri',
      sortOrder: 8,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_damat_adi' },
    update: {},
    create: {
      id: 'field_damat_adi',
      sectionId: damatSection.id,
      label: 'Ad Soyad',
      fieldKey: 'damat_adi',
      type: 'text',
      placeholder: 'Ad Soyad',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_damat_telefon' },
    update: {},
    create: {
      id: 'field_damat_telefon',
      sectionId: damatSection.id,
      label: 'Telefon',
      fieldKey: 'damat_telefon',
      type: 'phone',
      placeholder: '05XX XXX XX XX',
      sortOrder: 1,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_damat_memleket' },
    update: {},
    create: {
      id: 'field_damat_memleket',
      sectionId: damatSection.id,
      label: 'Memleket',
      fieldKey: 'damat_memleket',
      type: 'text',
      placeholder: 'Memleket',
      sortOrder: 2,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_damat_sehir' },
    update: {},
    create: {
      id: 'field_damat_sehir',
      sectionId: damatSection.id,
      label: 'Şehir seçin',
      fieldKey: 'damat_sehir',
      type: 'city',
      placeholder: 'Şehir seçin',
      sortOrder: 3,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 6. Kurumsal Bilgiler
  const kurumsalSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'kurumsal-bilgiler' },
    update: {},
    create: {
      id: 'section_kurumsal',
      title: 'Kurumsal Bilgiler',
      description: 'Kurumsal organizasyon bilgileri',
      globalKey: 'kurumsal-bilgiler',
      sortOrder: 8,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_firma_adi' },
    update: {},
    create: {
      id: 'field_firma_adi',
      sectionId: kurumsalSection.id,
      label: 'Firma Adı',
      fieldKey: 'firma_adi',
      type: 'text',
      placeholder: 'Firma Adı',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_yetkili_adi_kurumsal' },
    update: {},
    create: {
      id: 'field_yetkili_adi_kurumsal',
      sectionId: kurumsalSection.id,
      label: 'Yetkili Adı Soyadı',
      fieldKey: 'yetkili_adi_kurumsal',
      type: 'text',
      placeholder: 'Yetkili Adı Soyadı',
      sortOrder: 1,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_yetkili_telefon_kurumsal' },
    update: {},
    create: {
      id: 'field_yetkili_telefon_kurumsal',
      sectionId: kurumsalSection.id,
      label: 'Yetkili Telefon',
      fieldKey: 'yetkili_telefon_kurumsal',
      type: 'phone',
      placeholder: '05XX XXX XX XX',
      sortOrder: 2,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 7. Gelin Bilgileri
  const gelinSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'gelin-bilgileri' },
    update: {},
    create: {
      id: 'section_gelin',
      title: 'Gelin Bilgileri',
      description: 'Gelin bilgileri',
      globalKey: 'gelin-bilgileri',
      sortOrder: 8,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_gelin_adi' },
    update: {},
    create: {
      id: 'field_gelin_adi',
      sectionId: gelinSection.id,
      label: 'Ad Soyad',
      fieldKey: 'gelin_adi',
      type: 'text',
      placeholder: 'Ad Soyad',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_gelin_telefon' },
    update: {},
    create: {
      id: 'field_gelin_telefon',
      sectionId: gelinSection.id,
      label: 'Telefon',
      fieldKey: 'gelin_telefon',
      type: 'phone',
      placeholder: '05XX XXX XX XX',
      sortOrder: 1,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_gelin_memleket' },
    update: {},
    create: {
      id: 'field_gelin_memleket',
      sectionId: gelinSection.id,
      label: 'Memleket',
      fieldKey: 'gelin_memleket',
      type: 'text',
      placeholder: 'Memleket',
      sortOrder: 2,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_gelin_sehir' },
    update: {},
    create: {
      id: 'field_gelin_sehir',
      sectionId: gelinSection.id,
      label: 'Şehir seçin',
      fieldKey: 'gelin_sehir',
      type: 'city',
      placeholder: 'Şehir seçin',
      sortOrder: 3,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  // 8. Özel Rezervasyon Talep ve Notları
  const ozelSection = await prisma.formSectionMaster.upsert({
    where: { globalKey: 'ozel-rezervasyon-notlar' },
    update: {},
    create: {
      id: 'section_ozel',
      title: 'Özel Rezervasyon Talep ve Notları',
      description: 'Özel istekler, masa düzeni tercihleri vb. notlar',
      globalKey: 'ozel-rezervasyon-notlar',
      sortOrder: 8,
      createdAt: now,
      updatedAt: now,
    },
  });

  await prisma.formFieldMaster.upsert({
    where: { id: 'field_notlar_talepler' },
    update: {},
    create: {
      id: 'field_notlar_talepler',
      sectionId: ozelSection.id,
      label: 'Notlar ve Talepler',
      fieldKey: 'notlar_talepler',
      type: 'textarea',
      placeholder: 'Özel istekler, masa düzeni tercihleri vb. notlar',
      helper: 'Özel istekler, masa düzeni tercihleri vb. notlar',
      sortOrder: 0,
      isRequired: false,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log('✅ Tüm form bölümleri ve alanları başarıyla oluşturuldu!');
}

main()
  .catch((e) => {
    console.error('Hata:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

