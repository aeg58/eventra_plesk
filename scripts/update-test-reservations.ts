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

async function updateTestReservations() {
  try {
    console.log('Test rezervasyonları güncelleniyor...');

    // Kullanıcıları ve rezervasyon kaynaklarını önce yükle
    const users = await prisma.kullan_c_lar.findMany({ take: 10 });
    const reservationSources = await prisma.rezervasyonKaynak.findMany({ take: 10 });
    
    console.log(`Yüklenen kullanıcı sayısı: ${users.length}`);
    console.log(`Yüklenen rezervasyon kaynağı sayısı: ${reservationSources.length}`);

    // REZ-2025 veya REZ-2026 ile başlayan rezervasyonları bul
    const reservations = await prisma.reservation.findMany({
      where: {
        rezervasyonNo: {
          startsWith: 'REZ-2025',
        },
      },
      include: {
        Customer: true,
      },
    });

    // REZ-2026 ile başlayanları da ekle
    const reservations2026 = await prisma.reservation.findMany({
      where: {
        rezervasyonNo: {
          startsWith: 'REZ-2026',
        },
      },
      include: {
        Customer: true,
      },
    });

    const allReservations = [...reservations, ...reservations2026];
    console.log(`Toplam ${allReservations.length} rezervasyon bulundu.`);

    for (const reservation of allReservations) {
      try {
        // Rastgele iskonto - yüzde ise maksimum %10, sabit tutar ise maksimum 1000 TL, zorunlu değil
        const sozlesmeFiyati = reservation.sozlesmeFiyati ? Number(reservation.sozlesmeFiyati) : 0;
        let iskontoYuzde = false;
        let iskonto = 0;
        
        // %60 ihtimalle iskonto atanacak
        if (randomBoolean(60) && sozlesmeFiyati > 0) {
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
        
        // Rastgele KDV oranı
        const kdvOrani = randomItem([0, 1, 10, 20]);
        
        // Rastgele sözleşme tarihi (rezervasyon tarihinden 1-3 ay önce)
        let sozlesmeTarihi: Date | null = null;
        if (reservation.rezervasyonTarihi) {
          sozlesmeTarihi = new Date(reservation.rezervasyonTarihi);
          sozlesmeTarihi.setMonth(sozlesmeTarihi.getMonth() - randomInt(1, 3));
        }
        
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
        const kontratSahibiAdSoyad = reservation.Customer.adSoyad;
        const kontratSahibiTelefon = reservation.Customer.telefon || generatePhone();
        const kontratSahibiTc = generateTC();
        const kontratAdresi = randomItem(adresler);
        
        // Sözleşme kontratı (kontrat şablonu ID'si) - eğer yoksa mevcut birini kullan veya oluştur
        let sozlesmeKontrati = reservation.sozlesmeKontrati;
        if (!sozlesmeKontrati) {
          try {
            // Kontrat şablonlarını kontrol et (model adı farklı olabilir)
            const contractTemplates = await prisma.sozlesmeSablon.findMany({ take: 5 });
            if (contractTemplates.length > 0) {
              sozlesmeKontrati = randomItem(contractTemplates).id;
            } else {
              // Eğer şablon yoksa, rastgele bir ID oluştur
              sozlesmeKontrati = `kontrat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            }
          } catch (error) {
            // Model bulunamazsa, rastgele bir ID oluştur
            sozlesmeKontrati = `kontrat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          }
        }
        
        // Rastgele fatura bilgileri
        const faturaIstiyorum = randomBoolean(50);
        const faturaUnvani = faturaIstiyorum ? (randomBoolean(50) ? randomItem(sirketUnvanlari) : reservation.Customer.adSoyad) : null;
        const faturaVergiDairesi = faturaIstiyorum && faturaUnvani ? randomItem(vergiDaireleri) : null;
        const faturaVergiNo = faturaIstiyorum && faturaUnvani ? generateVergiNo() : null;
        const faturaAdresi = faturaIstiyorum ? randomItem(adresler) : null;

        // Salon bilgisini çek (officeId için)
        let officeId = null;
        if (reservation.salonId) {
          const salonInfo = await prisma.subeler.findUnique({
            where: { id: reservation.salonId },
            select: { officeId: true },
          });
          officeId = salonInfo?.officeId || null;
        }

        // Rezervasyon kaynaklarını çek veya oluştur
        let kaynakId = null;
        const existingSources = await prisma.rezervasyonKaynak.findMany({ take: 5 });
        if (existingSources.length > 0) {
          kaynakId = randomItem(existingSources).id;
        } else {
          // Eğer kaynak yoksa oluştur
          const newSource = await prisma.rezervasyonKaynak.create({
            data: {
              id: `kaynak-${Date.now()}`,
              name: randomItem(['Web Sitesi', 'Telefon', 'Referans', 'Sosyal Medya', 'Diğer']),
              slug: `kaynak-${Date.now()}`,
              isActive: true,
              updatedAt: new Date(),
            },
          });
          kaynakId = newSource.id;
        }

        // Paket bilgisini çek veya oluştur (organizasyon grubuna göre)
        let paketId = null;
        if (reservation.organizasyonGrupId) {
          const existingPackages = await prisma.organizasyonPaketler.findMany({
            where: { groupId: reservation.organizasyonGrupId },
            take: 5,
          });
          if (existingPackages.length > 0) {
            paketId = randomItem(existingPackages).id;
          } else {
            // Eğer paket yoksa oluştur
            const newPackage = await prisma.organizasyonPaketler.create({
              data: {
                id: `paket-${Date.now()}-${Math.random()}`,
                groupId: reservation.organizasyonGrupId,
                name: randomItem(['Standart Paket', 'Premium Paket', 'Lüks Paket', 'Ekonomik Paket']),
                slug: `paket-${Date.now()}`,
                isActive: true,
                updatedAt: new Date(),
              },
            });
            paketId = newPackage.id;
          }
        }

        // Zaman dilimi kontrolü - eğer boşsa veya sadece string ise, rastgele bir zaman dilimi ekle
        let zamanDilimi = reservation.zamanDilimi;
        if (!zamanDilimi || zamanDilimi.trim() === '') {
          const timeSlots = ['10:00 - 14:00', '14:00 - 18:00', '18:00 - 22:00', '19:00 - 23:00', '12:00 - 16:00', '16:00 - 20:00', '20:00 - 24:00'];
          zamanDilimi = randomItem(timeSlots);
        }

        // Rezervasyonu güncelle
        await prisma.reservation.update({
          where: { id: reservation.id },
          data: {
            officeId: officeId,
            sozlesmeTarihi: sozlesmeTarihi,
            zamanDilimi: zamanDilimi,
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

        // Organizasyon grubunu manuel olarak çek (önce)
        let orgName = '';
        if (reservation.organizasyonGrupId) {
          const orgGroup = await prisma.organizasyonGrup.findUnique({
            where: { id: reservation.organizasyonGrupId },
            select: { name: true },
          });
          orgName = orgGroup?.name || '';
        }

        // Dinamik form değerlerini güncelle/ekle
        const dynamicFieldsToAdd: Array<{ fieldKey: string; fieldValue: string }> = [];
        
        // Öneren - ID olarak kaydet
        if (oneren) {
          dynamicFieldsToAdd.push({ fieldKey: 'oneren', fieldValue: oneren });
        }
        
        // Yetkili bilgileri (organizasyon türüne göre) - kullanıcı adını al
        if (yetkili) {
          const yetkiliUser = users.find(u => u.id === yetkili);
          const yetkiliAdi = yetkiliUser?.adSoyad || yetkiliUser?.name || 'Yetkili';
          
          if (orgName === 'Mezuniyet') {
            dynamicFieldsToAdd.push(
              { fieldKey: 'yetkili_adi_mezuniyet', fieldValue: yetkiliAdi },
              { fieldKey: 'yetkili_telefon_mezuniyet', fieldValue: generatePhone() }
            );
          } else if (orgName === 'Kurumsal Etkinlik' || orgName === 'Toplantı' || orgName === 'Seminer') {
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
        if (orgName === 'Mezuniyet' && randomBoolean(70)) {
          dynamicFieldsToAdd.push({ fieldKey: 'okul_adi', fieldValue: randomItem(okulIsimleri) });
        }
        
        // Dinamik form değerlerini ekle/güncelle
        for (const field of dynamicFieldsToAdd) {
          const existing = await prisma.reservationDynamicValues.findFirst({
            where: {
              reservationId: reservation.id,
              fieldKey: field.fieldKey,
            },
          });
          if (!existing) {
            await prisma.reservationDynamicValues.create({
              data: {
                id: `dynamic-${field.fieldKey}-${reservation.id}-${Date.now()}`,
                reservationId: reservation.id,
                fieldKey: field.fieldKey,
                fieldValue: field.fieldValue,
              },
            });
          } else {
            await prisma.reservationDynamicValues.update({
              where: { id: existing.id },
              data: { fieldValue: field.fieldValue },
            });
          }
        }

        // Mevcut katılımcıları kontrol et
        const existingParticipants = await prisma.reservationParticipants.findMany({
          where: { reservationId: reservation.id },
        });

        // Eğer katılımcı yoksa ekle
        if (existingParticipants.length === 0) {
          if (orgName === 'Düğün' || orgName === 'Nişan' || orgName === 'Kına Gecesi') {
            // Damat bilgileri
            const damatAdi = randomItem(customerNames.filter(n => n !== reservation.Customer.adSoyad));
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
            const gelinAdi = randomItem(customerNames.filter(n => n !== reservation.Customer.adSoyad && n !== damatAdi));
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
            const existingDynamic = await prisma.reservationDynamicValues.findMany({
              where: { reservationId: reservation.id },
            });
            
            const dynamicFieldsForParticipants = [
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
            ];
            
            // Sadece mevcut olmayanları ekle
            for (const field of dynamicFieldsForParticipants) {
              const exists = existingDynamic.some(d => d.fieldKey === field.fieldKey);
              if (!exists) {
                await prisma.reservationDynamicValues.create({
                  data: field,
                });
              }
            }
          } else {
            // Diğer organizasyon türleri için de katılımcı ekle
            const participantName = randomItem(customerNames.filter(n => n !== reservation.Customer.adSoyad));
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
        }

        console.log(`✓ Rezervasyon güncellendi: ${reservation.rezervasyonNo}`);
      } catch (error: any) {
        console.error(`✗ Rezervasyon güncellenemedi ${reservation.rezervasyonNo}:`, error.message);
      }
    }

    console.log('\n✓ Tüm test rezervasyonları güncellendi!');
  } catch (error: any) {
    console.error('Hata:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

updateTestReservations();

