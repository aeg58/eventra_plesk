import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Rastgele müşteri adları
const customerNames = [
  'Ahmet Yılmaz', 'Ayşe Demir', 'Mehmet Kaya', 'Fatma Şahin', 'Ali Çelik',
  'Zeynep Arslan', 'Mustafa Öztürk', 'Elif Yıldız', 'Hasan Aydın', 'Selin Doğan',
  'Emre Kılıç', 'Büşra Özdemir', 'Burak Şimşek', 'Derya Yüksel', 'Can Avcı',
  'Gizem Çetin', 'Onur Güneş', 'Seda Özkan', 'Kerem Yıldırım', 'Pınar Koç'
];

// Rastgele telefon numaraları
const generatePhone = () => {
  const prefix = ['0532', '0533', '0534', '0535', '0536', '0537', '0538', '0539', '0541', '0542', '0543', '0544', '0545', '0546', '0547', '0548', '0549', '0551', '0552', '0553', '0554', '0555'];
  const randomPrefix = prefix[Math.floor(Math.random() * prefix.length)];
  const randomNumber = Math.floor(1000000 + Math.random() * 9000000);
  return `${randomPrefix}${randomNumber}`;
};

// Rastgele email
const generateEmail = (name: string) => {
  const cleanName = name.toLowerCase().replace(/\s+/g, '.');
  const domains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com'];
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `${cleanName}@${domain}`;
};

// Rastgele organizasyon isimleri
const organizationNames = [
  'Düğün', 'Nişan', 'Kına Gecesi', 'Sünnet Düğünü', 'Doğum Günü',
  'Mezuniyet', 'Yılbaşı Organizasyonu', 'Kurumsal Etkinlik', 'Toplantı', 'Seminer'
];

// Rastgele salon isimleri
const salonNames = [
  'Ana Salon', 'Büyük Salon', 'Küçük Salon', 'VIP Salon', 'Bahçe Salonu',
  'Teras Salon', 'Konferans Salonu', 'Bal Salonu', 'Gül Salonu', 'Lale Salonu'
];

// Rastgele zaman dilimleri
const timeSlots = [
  '10:00 - 14:00', '14:00 - 18:00', '18:00 - 22:00', '19:00 - 23:00',
  '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00'
];

// Rastgele durumlar
const statuses = ['Kesin', 'Açık', 'İptal'];

// Rastgele yetkili isimleri
const yetkiliNames = [
  'Mehmet Özkan', 'Ayşe Yıldız', 'Ali Demir', 'Fatma Kaya', 'Mustafa Çelik',
  'Zeynep Şahin', 'Hasan Arslan', 'Selin Doğan', 'Emre Kılıç', 'Büşra Özdemir'
];

// Rastgele öneren isimleri
const onerenNames = [
  'Ahmet Yılmaz', 'Ayşe Demir', 'Mehmet Kaya', 'Fatma Şahin', 'Ali Çelik',
  'Zeynep Arslan', 'Mustafa Öztürk', 'Elif Yıldız', 'Hasan Aydın', 'Selin Doğan'
];

// Rastgele okul isimleri
const okulIsimleri = [
  'Atatürk İlkokulu', 'Cumhuriyet Ortaokulu', 'Mehmet Akif Ersoy Lisesi',
  'İstanbul Üniversitesi', 'Ankara Üniversitesi', 'Ege Üniversitesi',
  'Boğaziçi Üniversitesi', 'ODTÜ', 'İTÜ', 'Hacettepe Üniversitesi'
];

// Rastgele memleketler
const memleketler = [
  'İstanbul', 'Ankara', 'İzmir', 'Bursa', 'Antalya', 'Adana', 'Gaziantep',
  'Konya', 'Kayseri', 'Eskişehir', 'Trabzon', 'Samsun', 'Diyarbakır', 'Mersin'
];

// Rastgele adresler
const adresler = [
  'Atatürk Bulvarı No:123 Daire:5 Çankaya/Ankara',
  'İstiklal Caddesi No:45 Kadıköy/İstanbul',
  'Kordon Boyu No:78 Konak/İzmir',
  'Cumhuriyet Mahallesi No:12 Nilüfer/Bursa',
  'Liman Caddesi No:34 Muratpaşa/Antalya',
  'Kurtuluş Sokak No:56 Seyhan/Adana',
  'Şehitkamil Mahallesi No:78 Şahinbey/Gaziantep'
];

// Rastgele vergi daireleri
const vergiDaireleri = [
  'Çankaya Vergi Dairesi', 'Kadıköy Vergi Dairesi', 'Konak Vergi Dairesi',
  'Nilüfer Vergi Dairesi', 'Muratpaşa Vergi Dairesi', 'Seyhan Vergi Dairesi'
];

// Rastgele TC kimlik numarası oluştur (11 haneli)
const generateTC = () => {
  let tc = '';
  for (let i = 0; i < 11; i++) {
    tc += Math.floor(Math.random() * 10).toString();
  }
  return tc;
};

// Rastgele vergi numarası oluştur (10 haneli)
const generateVergiNo = () => {
  let vergiNo = '';
  for (let i = 0; i < 10; i++) {
    vergiNo += Math.floor(Math.random() * 10).toString();
  }
  return vergiNo;
};

// Rastgele şirket unvanları
const sirketUnvanlari = [
  'ABC Organizasyon Ltd. Şti.', 'XYZ Etkinlik A.Ş.', 'DEF Düğün Salonu Ltd.',
  'GHI Organizasyon Hizmetleri', 'JKL Etkinlik ve Organizasyon A.Ş.',
  'MNO Düğün ve Organizasyon Ltd. Şti.'
];

// Rastgele notlar
const ozelNotlar = [
  'Müşteri özel menü istiyor. Vejetaryen seçenekler hazırlanmalı.',
  'Düğün öncesi prova yapılacak. Tarih belirlenecek.',
  'Özel dekorasyon istekleri var. Müşteri ile görüşülecek.',
  'Çocuk oyun alanı hazırlanmalı. Yaklaşık 20 çocuk bekleniyor.',
  'Müzik grubu kendi getirecek. Teknik destek sağlanacak.',
  'Özel fotoğraf çekimi için alan ayrılmalı.',
  'Düğün sonrası gece yarısına kadar uzatma yapılabilir.',
  'Müşteri özel çiçek düzenlemesi istiyor.'
];

// Rastgele değer seç
function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

// Rastgele sayı (min, max arası)
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rastgele boolean (yüzde şans)
function randomBoolean(chance: number = 50): boolean {
  return Math.random() * 100 < chance;
}

async function addTestReservations() {
  try {
    console.log('Test rezervasyonları ekleniyor...');

    // Mevcut organizasyon gruplarını getir veya oluştur
    let orgGroups = await prisma.organizasyonGrup.findMany({
      where: { isActive: true },
    });

    // Eğer organizasyon grubu yoksa, birkaç tane oluştur
    if (orgGroups.length === 0) {
      console.log('Organizasyon grupları oluşturuluyor...');
      for (const orgName of organizationNames.slice(0, 5)) {
        const org = await prisma.organizasyonGrup.create({
          data: {
            id: `org-${Date.now()}-${Math.random()}`,
            name: orgName,
            slug: orgName.toLowerCase().replace(/\s+/g, '-'),
            sortOrder: 0,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        orgGroups.push(org);
      }
    }

    // Kullanıcıları ve rezervasyon kaynaklarını yükle
    let users = await prisma.kullan_c_lar.findMany({ take: 10 });
    let reservationSources = await prisma.rezervasyonKaynak.findMany({ take: 10 });
    
    // Eğer kullanıcı yoksa, birkaç test kullanıcısı oluştur
    if (users.length === 0) {
      console.log('Test kullanıcıları oluşturuluyor...');
      const testUsers = [
        { name: 'Mehmet Özkan', email: 'mehmet@test.com' },
        { name: 'Ayşe Yıldız', email: 'ayse@test.com' },
        { name: 'Ali Demir', email: 'ali@test.com' },
        { name: 'Fatma Kaya', email: 'fatma@test.com' },
        { name: 'Mustafa Çelik', email: 'mustafa@test.com' },
      ];
      
      for (const userData of testUsers) {
        const user = await prisma.kullan_c_lar.create({
          data: {
            id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: userData.name,
            email: userData.email,
            password: 'test123',
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        users.push(user);
      }
    }
    
    // Eğer rezervasyon kaynağı yoksa, birkaç test kaynağı oluştur
    if (reservationSources.length === 0) {
      console.log('Test rezervasyon kaynakları oluşturuluyor...');
      const testSources = [
        { name: 'Web Sitesi' },
        { name: 'Sosyal Medya' },
        { name: 'Referans' },
        { name: 'Telefon' },
        { name: 'E-posta' },
      ];
      
      for (const sourceData of testSources) {
        const source = await prisma.rezervasyonKaynak.create({
          data: {
            id: `source-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: sourceData.name,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        reservationSources.push(source);
      }
    }
    
    console.log(`Yüklenen kullanıcı sayısı: ${users.length}`);
    console.log(`Yüklenen rezervasyon kaynağı sayısı: ${reservationSources.length}`);

    // Mevcut salonları getir veya oluştur
    let salons = await prisma.subeler.findMany({
      where: { isActive: true },
    });

    if (salons.length === 0) {
      console.log('Salonlar oluşturuluyor...');
      // Önce bir ofis oluştur
      let ofis = await prisma.ofisler.findFirst();
      if (!ofis) {
        ofis = await prisma.ofisler.create({
          data: {
            id: `ofis-${Date.now()}`,
            name: 'Ana Ofis',
            sortOrder: 0,
            isActive: true,
            updatedAt: new Date(),
          },
        });
      }

      // Birkaç salon oluştur
      for (const salonName of salonNames.slice(0, 5)) {
        const salon = await prisma.subeler.create({
          data: {
            id: `salon-${Date.now()}-${Math.random()}`,
            name: salonName,
            slug: salonName.toLowerCase().replace(/\s+/g, '-') + `-${Date.now()}`,
            officeId: ofis.id,
            sortOrder: 0,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        salons.push(salon);
      }
    }

    // Test rezervasyonları için tarihler
    const reservationDates = [
      // 2025 Kasım
      new Date('2025-11-15'),
      new Date('2025-11-22'),
      new Date('2025-11-28'),
      // 2025 Aralık
      new Date('2025-12-06'),
      new Date('2025-12-13'),
      new Date('2025-12-20'),
      new Date('2025-12-27'),
      // 2026 Ocak
      new Date('2026-01-03'),
      new Date('2026-01-10'),
      new Date('2026-01-17'),
      new Date('2026-01-24'),
      new Date('2026-01-31'),
    ];

    // Her rezervasyon için rastgele müşteri oluştur
    const createdCustomers: any[] = [];
    
    for (let i = 0; i < reservationDates.length; i++) {
      const date = reservationDates[i];
      const customerName = randomItem(customerNames);
      const phone = generatePhone();
      const email = generateEmail(customerName);

      // Müşteriyi oluştur veya mevcut olanı kullan
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { telefon: phone },
            { email: email },
          ],
        },
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            id: `customer-${Date.now()}-${i}-${Math.random()}`,
            adSoyad: customerName,
            telefon: phone,
            email: email,
          },
        });
        createdCustomers.push(customer);
        console.log(`✓ Müşteri oluşturuldu: ${customerName}`);
      }

      // Rastgele organizasyon seç
      const orgGroup = randomItem(orgGroups);
      
      // Rastgele salon seç
      const salon = randomItem(salons);
      
      // Rastgele zaman dilimi
      const zamanDilimi = randomItem(timeSlots);
      
      // Rastgele durum
      const durum = randomItem(statuses);
      
      // Rastgele kişi sayısı
      const davetiSayisi = randomInt(80, 300);
      
      // Rastgele fiyat (kişi başı 200-500 TL arası)
      const fiyatKisiBasi = randomInt(200, 500);
      let sozlesmeFiyati = davetiSayisi * fiyatKisiBasi;
      
      // Rastgele iskonto - yüzde ise maksimum %10, sabit tutar ise maksimum 1000 TL, zorunlu değil
      let iskontoYuzde = false;
      let iskonto = 0;
      
      // %60 ihtimalle iskonto atanacak
      if (randomBoolean(60)) {
        // %50 ihtimalle yüzde iskonto, %50 ihtimalle sabit tutar iskonto
        const usePercentage = randomBoolean(50);
        
        if (usePercentage) {
          // Yüzde iskonto (maksimum %10)
          const yuzdeDegeri = randomInt(1, 10); // %1 ile %10 arası
          iskonto = (sozlesmeFiyati * yuzdeDegeri) / 100;
          iskontoYuzde = true;
        } else {
          // Sabit tutar iskonto (maksimum 1000 TL)
          iskonto = randomInt(100, 1000); // 100 TL ile 1000 TL arası
          iskontoYuzde = false;
        }
      }
      
      // İskonto sonrası fiyat (iskonto fiyattan düşülmez, sadece kaydedilir)
      
      // Rastgele KDV oranı (0, 1, 10, 20)
      const kdvOrani = randomItem([0, 1, 10, 20]);
      
      // Rastgele sözleşme tarihi (rezervasyon tarihinden 1-3 ay önce)
      const sozlesmeTarihi = new Date(date);
      sozlesmeTarihi.setMonth(sozlesmeTarihi.getMonth() - randomInt(1, 3));
      
      // Rastgele yetkili - gerçek kullanıcı ID'si kullan
      let yetkili = null;
      if (randomBoolean(70) && users.length > 0) {
        yetkili = randomItem(users).id;
      }
      
      // Rastgele öneren - gerçek rezervasyon kaynağı ID'si kullan
      let oneren = null;
      if (randomBoolean(60) && reservationSources.length > 0) {
        oneren = randomItem(reservationSources).id;
      }
      
      // Rastgele notlar
      const ozelNot = randomBoolean(80) ? randomItem(ozelNotlar) : null;
      const ekstraNot = randomBoolean(50) ? `Ekstra not: ${randomItem(['Özel istekler var', 'Son dakika değişiklikler olabilir', 'VIP misafirler var', 'Özel menü gerekiyor'])}` : null;
      
      // Rastgele kontrat bilgileri - tüm alanları doldur
      const kontratSahibiAdSoyad = customerName;
      const kontratSahibiTelefon = phone;
      const kontratSahibiTc = generateTC();
      const kontratAdresi = randomItem(adresler);
      
      // Sözleşme kontratı (kontrat şablonu ID'si) - eğer yoksa mevcut birini kullan veya oluştur
      let sozlesmeKontrati = null;
      try {
        const contractTemplates = await prisma.sozlesmeSablon.findMany({ take: 5 });
        if (contractTemplates.length > 0) {
          sozlesmeKontrati = randomItem(contractTemplates).id;
        } else {
          // Eğer şablon yoksa, rastgele bir ID oluştur
          sozlesmeKontrati = `kontrat-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
        }
      } catch (error) {
        // Model bulunamazsa, rastgele bir ID oluştur
        sozlesmeKontrati = `kontrat-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      }
      
      // Rastgele fatura bilgileri
      const faturaIstiyorum = randomBoolean(50);
      const faturaUnvani = faturaIstiyorum ? (randomBoolean(50) ? randomItem(sirketUnvanlari) : customerName) : null;
      const faturaVergiDairesi = faturaIstiyorum && faturaUnvani ? randomItem(vergiDaireleri) : null;
      const faturaVergiNo = faturaIstiyorum && faturaUnvani ? generateVergiNo() : null;
      const faturaAdresi = faturaIstiyorum ? randomItem(adresler) : null;

      // OfficeId'yi salon'dan al
      const officeId = salon.officeId;

      // Rezervasyon kaynaklarını çek veya oluştur
      let kaynakId = null;
      const existingSources = await prisma.rezervasyonKaynak.findMany({ take: 5 });
      if (existingSources.length > 0) {
        kaynakId = randomItem(existingSources).id;
      } else {
        // Eğer kaynak yoksa oluştur
        const newSource = await prisma.rezervasyonKaynak.create({
          data: {
            id: `kaynak-${Date.now()}-${i}`,
            name: randomItem(['Web Sitesi', 'Telefon', 'Referans', 'Sosyal Medya', 'Diğer']),
            slug: `kaynak-${Date.now()}-${i}`,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        kaynakId = newSource.id;
      }

      // Paket bilgisini çek veya oluştur (organizasyon grubuna göre)
      let paketId = null;
      const existingPackages = await prisma.organizasyonPaketler.findMany({
        where: { groupId: orgGroup.id },
        take: 5,
      });
      if (existingPackages.length > 0) {
        paketId = randomItem(existingPackages).id;
      } else {
        // Eğer paket yoksa oluştur
        const newPackage = await prisma.organizasyonPaketler.create({
          data: {
            id: `paket-${Date.now()}-${i}-${Math.random()}`,
            groupId: orgGroup.id,
            name: randomItem(['Standart Paket', 'Premium Paket', 'Lüks Paket', 'Ekonomik Paket']),
            slug: `paket-${Date.now()}-${i}`,
            isActive: true,
            updatedAt: new Date(),
          },
        });
        paketId = newPackage.id;
      }

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const rezervasyonNo = `REZ-${year}-${month}-${day}-${String(i + 1).padStart(3, '0')}`;

      try {
        const existing = await prisma.reservation.findUnique({
          where: { rezervasyonNo: rezervasyonNo },
        });

        if (!existing) {
          // Rezervasyon oluştur
          const reservation = await prisma.reservation.create({
            data: {
              id: `res-${Date.now()}-${i}-${Math.random()}`,
              rezervasyonNo: rezervasyonNo,
              customerId: customer.id,
              officeId: officeId,
              salonId: salon.id,
              organizasyonGrupId: orgGroup.id,
              rezervasyonTarihi: date,
              sozlesmeTarihi: sozlesmeTarihi,
              zamanDilimi: zamanDilimi,
              durum: durum,
              davetiSayisi: davetiSayisi,
              fiyatKisiBasi: fiyatKisiBasi,
              sozlesmeFiyati: sozlesmeFiyati,
              iskonto: iskonto > 0 ? iskonto : null,
              iskontoYuzde: iskontoYuzde,
              kdvOrani: kdvOrani,
              ozelTeklif: randomBoolean(20),
              ozelNotlar: ozelNot,
              ekstraNotu: ekstraNot,
              yetkili: yetkili,
              kaynakId: kaynakId,
              paketId: paketId,
              sozlesmeKontrati: sozlesmeKontrati,
              kontratSahibiAdSoyad: kontratSahibiAdSoyad,
              kontratSahibiTelefon: kontratSahibiTelefon,
              kontratSahibiTc: kontratSahibiTc,
              kontratAdresi: kontratAdresi,
              faturaIstiyorum: faturaIstiyorum,
              faturaUnvani: faturaUnvani,
              faturaVergiDairesi: faturaVergiDairesi,
              faturaVergiNo: faturaVergiNo,
              faturaAdresi: faturaAdresi,
            },
          });
          
          // Dinamik form değerlerini ekle
          const dynamicFieldsToAdd: Array<{ fieldKey: string; fieldValue: string }> = [];
          
          // Öneren - ID olarak kaydet
          if (oneren) {
            dynamicFieldsToAdd.push({ fieldKey: 'oneren', fieldValue: oneren });
          }
          
          // Yetkili bilgileri (organizasyon türüne göre) - kullanıcı adını al
          if (yetkili) {
            const yetkiliUser = users.find(u => u.id === yetkili);
            const yetkiliAdi = yetkiliUser?.adSoyad || yetkiliUser?.name || 'Yetkili';
            
            if (orgGroup.name === 'Mezuniyet') {
              dynamicFieldsToAdd.push(
                { fieldKey: 'yetkili_adi_mezuniyet', fieldValue: yetkiliAdi },
                { fieldKey: 'yetkili_telefon_mezuniyet', fieldValue: generatePhone() }
              );
            } else if (orgGroup.name === 'Kurumsal Etkinlik' || orgGroup.name === 'Toplantı' || orgGroup.name === 'Seminer') {
              dynamicFieldsToAdd.push(
                { fieldKey: 'yetkili_adi_kurumsal', fieldValue: yetkiliAdi },
                { fieldKey: 'yetkili_telefon_kurumsal', fieldValue: generatePhone() }
              );
            } else {
              dynamicFieldsToAdd.push(
                { fieldKey: 'yetkili_adi_etkinlik', fieldValue: yetkiliAdi },
                { fieldKey: 'yetkili_telefon_etkinlik', fieldValue: generatePhone() }
              );
            }
          }
          
          // Okul adı (Mezuniyet için)
          if (orgGroup.name === 'Mezuniyet' && randomBoolean(70)) {
            dynamicFieldsToAdd.push({ fieldKey: 'okul_adi', fieldValue: randomItem(okulIsimleri) });
          }
          
          // Dinamik form değerlerini ekle
          if (dynamicFieldsToAdd.length > 0) {
            await prisma.reservationDynamicValues.createMany({
              data: dynamicFieldsToAdd.map((field, idx) => ({
                id: `dynamic-${field.fieldKey}-${reservation.id}-${idx}`,
                reservationId: reservation.id,
                fieldKey: field.fieldKey,
                fieldValue: field.fieldValue,
              })),
            });
          }
          
          // Katılımcı bilgileri ekle (damat ve gelin için)
          if (orgGroup.name === 'Düğün' || orgGroup.name === 'Nişan' || orgGroup.name === 'Kına Gecesi') {
            // Damat bilgileri
            const damatAdi = randomItem(customerNames.filter(n => n !== customerName));
            const damatTelefon = generatePhone();
            const damatMemleket = randomItem(memleketler);
            
            await prisma.reservationParticipants.create({
              data: {
                id: `participant-damat-${reservation.id}-${Date.now()}`,
                reservationId: reservation.id,
                participantKey: 'damat',
                adSoyad: damatAdi,
                telefon: damatTelefon,
                memleket: damatMemleket,
              },
            });
            
            // Gelin bilgileri
            const gelinAdi = randomItem(customerNames.filter(n => n !== customerName && n !== damatAdi));
            const gelinTelefon = generatePhone();
            const gelinMemleket = randomItem(memleketler);
            
            await prisma.reservationParticipants.create({
              data: {
                id: `participant-gelin-${reservation.id}-${Date.now()}`,
                reservationId: reservation.id,
                participantKey: 'gelin',
                adSoyad: gelinAdi,
                telefon: gelinTelefon,
                memleket: gelinMemleket,
              },
            });
            
            // Dinamik form değerleri ekle
            await prisma.reservationDynamicValues.createMany({
              data: [
                {
                  id: `dynamic-damat-adi-${reservation.id}`,
                  reservationId: reservation.id,
                  fieldKey: 'damat_adi',
                  fieldValue: damatAdi,
                },
                {
                  id: `dynamic-damat-telefon-${reservation.id}`,
                  reservationId: reservation.id,
                  fieldKey: 'damat_telefon',
                  fieldValue: damatTelefon,
                },
                {
                  id: `dynamic-gelin-adi-${reservation.id}`,
                  reservationId: reservation.id,
                  fieldKey: 'gelin_adi',
                  fieldValue: gelinAdi,
                },
                {
                  id: `dynamic-gelin-telefon-${reservation.id}`,
                  reservationId: reservation.id,
                  fieldKey: 'gelin_telefon',
                  fieldValue: gelinTelefon,
                },
                {
                  id: `dynamic-damat-memleket-${reservation.id}`,
                  reservationId: reservation.id,
                  fieldKey: 'damat_memleket',
                  fieldValue: damatMemleket,
                },
                {
                  id: `dynamic-gelin-memleket-${reservation.id}`,
                  reservationId: reservation.id,
                  fieldKey: 'gelin_memleket',
                  fieldValue: gelinMemleket,
                },
              ],
            });
          } else {
            // Diğer organizasyon türleri için de katılımcı ekle
            const participantName = randomItem(customerNames.filter(n => n !== customerName));
            const participantPhone = generatePhone();
            const participantMemleket = randomItem(memleketler);
            
            await prisma.reservationParticipants.create({
              data: {
                id: `participant-main-${reservation.id}-${Date.now()}`,
                reservationId: reservation.id,
                participantKey: 'ana_kisi',
                adSoyad: participantName,
                telefon: participantPhone,
                memleket: participantMemleket,
              },
            });
          }
          
          console.log(`✓ Rezervasyon eklendi: ${rezervasyonNo} - ${customerName} - ${orgGroup.name} - ${salon.name}`);
        } else {
          console.log(`- Rezervasyon zaten mevcut: ${rezervasyonNo}`);
        }
      } catch (error: any) {
        console.error(`✗ Rezervasyon eklenemedi ${rezervasyonNo}:`, error.message);
      }
    }

    console.log(`\n✓ Toplam ${createdCustomers.length} yeni müşteri oluşturuldu`);
    console.log('✓ Test rezervasyonları eklendi!');
  } catch (error: any) {
    console.error('Hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

addTestReservations();
