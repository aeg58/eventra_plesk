import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Test rezervasyonu oluşturuluyor...\n');

  try {
    // Gerekli verileri bul
    const dugunGroup = await prisma.organizasyonGrup.findFirst({
      where: {
        OR: [
          { slug: 'dugun' },
          { name: { contains: 'Düğün' } }
        ]
      },
    });

    if (!dugunGroup) {
      console.error('Düğün grubu bulunamadı!');
      return;
    }

    const office = await prisma.ofisler.findFirst({
      where: { isActive: true },
    });

    if (!office) {
      console.error('Aktif ofis bulunamadı!');
      return;
    }

    const salon = await prisma.subeler.findFirst({
      where: { 
        officeId: office.id,
        isActive: true 
      },
    });

    const user = await prisma.kullan_c_lar.findFirst({
      where: { isActive: true },
    });

    if (!user) {
      console.error('Aktif kullanıcı bulunamadı!');
      return;
    }

    // Müşteri oluştur veya bul
    let customer = await prisma.customer.findFirst({
      where: {
        OR: [
          { adSoyad: 'Test Müşteri' },
          { telefon: '05551234567' }
        ]
      },
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          id: `customer_test_${Date.now()}`,
          adSoyad: 'Test Müşteri',
          telefon: '05551234567',
          email: 'test@example.com',
          adres: 'Test Adresi',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      console.log('✓ Test müşteri oluşturuldu');
    } else {
      console.log('✓ Test müşteri zaten mevcut');
    }

    // Rezervasyon numarası oluştur
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    
    const lastReservation = await prisma.reservation.findFirst({
      where: {
        rezervasyonNo: {
          startsWith: `REZ-${year}${month}${day}`,
        },
      },
      orderBy: {
        rezervasyonNo: 'desc',
      },
    });

    let sequence = 1;
    if (lastReservation) {
      const lastSeq = parseInt(lastReservation.rezervasyonNo.slice(-4)) || 0;
      sequence = lastSeq + 1;
    }

    const rezervasyonNo = `REZ-${year}${month}${day}-${String(sequence).padStart(4, '0')}`;

    // Rezervasyon oluştur
    const reservation = await prisma.reservation.create({
      data: {
        id: `reservation_test_${Date.now()}`,
        rezervasyonNo,
        customerId: customer.id,
        organizasyonGrupId: dugunGroup.id,
        officeId: office.id,
        salonId: salon?.id || null,
        yetkili: user.id,
        rezervasyonTarihi: new Date(),
        sozlesmeTarihi: new Date(),
        zamanDilimi: null,
        durum: 'Açık',
        paketId: null,
        davetiSayisi: 100,
        fiyatKisiBasi: 250.00,
        sozlesmeFiyati: 25000.00,
        iskonto: 0,
        iskontoYuzde: false,
        kdvOrani: 20.00,
        ozelTeklif: false,
        ozelNotlar: 'Test rezervasyonu',
        ekstraNotu: null,
        kaynakId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    console.log(`✓ Rezervasyon oluşturuldu: ${rezervasyonNo}`);

    // Dinamik form değerleri ekle
    await prisma.reservationDynamicValues.createMany({
      data: [
        {
          id: `dynamic_damat_adi_${Date.now()}`,
          reservationId: reservation.id,
          fieldKey: 'damat_adi',
          fieldValue: 'Ahmet Yılmaz',
        },
        {
          id: `dynamic_damat_telefon_${Date.now()}`,
          reservationId: reservation.id,
          fieldKey: 'damat_telefon',
          fieldValue: '05551234567',
        },
        {
          id: `dynamic_damat_memleket_${Date.now()}`,
          reservationId: reservation.id,
          fieldKey: 'damat_memleket',
          fieldValue: 'İstanbul',
        },
        {
          id: `dynamic_gelin_adi_${Date.now()}`,
          reservationId: reservation.id,
          fieldKey: 'gelin_adi',
          fieldValue: 'Ayşe Demir',
        },
        {
          id: `dynamic_gelin_telefon_${Date.now()}`,
          reservationId: reservation.id,
          fieldKey: 'gelin_telefon',
          fieldValue: '05559876543',
        },
        {
          id: `dynamic_gelin_memleket_${Date.now()}`,
          reservationId: reservation.id,
          fieldKey: 'gelin_memleket',
          fieldValue: 'Ankara',
        },
      ],
    });

    console.log('✓ Dinamik form değerleri eklendi');

    // Katılımcılar ekle
    await prisma.reservationParticipants.createMany({
      data: [
        {
          id: `participant_damat_${Date.now()}`,
          reservationId: reservation.id,
          participantKey: 'damat',
          adSoyad: 'Ahmet Yılmaz',
          telefon: '05551234567',
          memleket: 'İstanbul',
          extraJson: JSON.stringify({ email: 'ahmet@example.com' }),
        },
        {
          id: `participant_gelin_${Date.now()}`,
          reservationId: reservation.id,
          participantKey: 'gelin',
          adSoyad: 'Ayşe Demir',
          telefon: '05559876543',
          memleket: 'Ankara',
          extraJson: JSON.stringify({ email: 'ayse@example.com' }),
        },
      ],
    });

    console.log('✓ Katılımcılar eklendi');

    // Aktivite logu
    await prisma.rezervasyonAktivite.create({
      data: {
        id: `activity_${Date.now()}`,
        rezervasyonId: reservation.id,
        activityType: 'created',
        activityTitle: 'Rezervasyon Oluşturuldu',
        activityDescription: `Test rezervasyonu ${rezervasyonNo} oluşturuldu`,
        createdAt: new Date(),
      },
    });

    console.log('✓ Aktivite logu eklendi');

    // Rezervasyonu kontrol et
    const createdReservation = await prisma.reservation.findUnique({
      where: { id: reservation.id },
      include: {
        Customer: true,
        ReservationDynamicValues: true,
        ReservationParticipants: true,
      },
    });

    console.log('\n📊 Rezervasyon Detayları:');
    console.log(`  - Rezervasyon No: ${createdReservation?.rezervasyonNo}`);
    console.log(`  - Müşteri: ${createdReservation?.Customer.adSoyad}`);
    console.log(`  - Organizasyon: ${dugunGroup.name}`);
    console.log(`  - Durum: ${createdReservation?.durum}`);
    console.log(`  - Dinamik Değerler: ${createdReservation?.ReservationDynamicValues.length || 0}`);
    console.log(`  - Katılımcılar: ${createdReservation?.ReservationParticipants.length || 0}`);

    console.log('\n✅ Test rezervasyonu başarıyla oluşturuldu!');
  } catch (error: any) {
    console.error('❌ Hata:', error);
    console.error('Hata detayı:', error.message);
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
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

