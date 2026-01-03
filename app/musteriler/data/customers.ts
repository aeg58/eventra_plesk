export interface Lead {
  id: string;
  adSoyad: string;
  etkinlikTuru: string;
  tarih: string;
  kaynak: 'Instagram' | 'WhatsApp' | 'Web Formu' | 'Telefon' | 'Referans';
  durum: 'Yeni' | 'Görüşüldü' | 'Teklif Gönderildi' | 'Beklemede' | 'Reddedildi';
  telefon: string;
  email: string;
  notlar?: string;
  olusturmaTarihi: string;
}

export interface Customer {
  id: string;
  adSoyad: string;
  etkinlikTuru: string;
  tarih: string;
  durum: 'Kesin' | 'İptal' | 'Tamamlandı';
  telefon: string;
  email: string;
  toplamTutar: number;
  odenecekTutar: number;
  misafirSayisi: number;
  salon: string;
}

export const mockLeads: Lead[] = [
  {
    id: '1',
    adSoyad: 'Ayşe Yılmaz',
    etkinlikTuru: 'Düğün',
    tarih: '22 Kasım 2025',
    kaynak: 'Instagram',
    durum: 'Yeni',
    telefon: '0532 123 4567',
    email: 'ayse@example.com',
    olusturmaTarihi: '2025-11-01'
  },
  {
    id: '2',
    adSoyad: 'Mehmet Demir',
    etkinlikTuru: 'Nişan',
    tarih: '15 Aralık 2025',
    kaynak: 'Web Formu',
    durum: 'Görüşüldü',
    telefon: '0533 456 7890',
    email: 'mehmet@example.com',
    notlar: 'Bahçe salonu tercih ediyor',
    olusturmaTarihi: '2025-10-28'
  },
  {
    id: '3',
    adSoyad: 'Zeynep Kaya',
    etkinlikTuru: 'Kına',
    tarih: '10 Ocak 2026',
    kaynak: 'WhatsApp',
    durum: 'Teklif Gönderildi',
    telefon: '0534 789 0123',
    email: 'zeynep@example.com',
    olusturmaTarihi: '2025-10-25'
  },
  {
    id: '4',
    adSoyad: 'Ali Yıldız',
    etkinlikTuru: 'Düğün',
    tarih: '5 Şubat 2026',
    kaynak: 'Telefon',
    durum: 'Beklemede',
    telefon: '0535 234 5678',
    email: 'ali@example.com',
    notlar: 'Fiyat konusunda düşünüyor',
    olusturmaTarihi: '2025-10-20'
  },
  {
    id: '5',
    adSoyad: 'Fatma Şahin',
    etkinlikTuru: 'Sünnet',
    tarih: '20 Mart 2026',
    kaynak: 'Referans',
    durum: 'Yeni',
    telefon: '0536 345 6789',
    email: 'fatma@example.com',
    olusturmaTarihi: '2025-11-03'
  },
  {
    id: '6',
    adSoyad: 'Can Özkan',
    etkinlikTuru: 'Düğün',
    tarih: '18 Nisan 2026',
    kaynak: 'Instagram',
    durum: 'Görüşüldü',
    telefon: '0537 456 7890',
    email: 'can@example.com',
    olusturmaTarihi: '2025-10-15'
  }
];

export const mockCustomers: Customer[] = [
  {
    id: '1',
    adSoyad: 'Elif Korkmaz',
    etkinlikTuru: 'Düğün',
    tarih: '12 Kasım 2025',
    durum: 'Kesin',
    telefon: '0532 111 2222',
    email: 'elif@example.com',
    toplamTutar: 85000,
    odenecekTutar: 25000,
    misafirSayisi: 200,
    salon: 'Ana Salon'
  },
  {
    id: '2',
    adSoyad: 'Burak Yılmaz',
    etkinlikTuru: 'Nişan',
    tarih: '8 Aralık 2025',
    durum: 'Kesin',
    telefon: '0533 222 3333',
    email: 'burak@example.com',
    toplamTutar: 35000,
    odenecekTutar: 15000,
    misafirSayisi: 100,
    salon: 'Küçük Salon'
  },
  {
    id: '3',
    adSoyad: 'Selin Aydın',
    etkinlikTuru: 'Kına',
    tarih: '25 Ocak 2026',
    durum: 'Kesin',
    telefon: '0534 333 4444',
    email: 'selin@example.com',
    toplamTutar: 28000,
    odenecekTutar: 0,
    misafirSayisi: 80,
    salon: 'Bahçe'
  },
  {
    id: '4',
    adSoyad: 'Emre Çelik',
    etkinlikTuru: 'Düğün',
    tarih: '14 Şubat 2026',
    durum: 'Kesin',
    telefon: '0535 444 5555',
    email: 'emre@example.com',
    toplamTutar: 95000,
    odenecekTutar: 45000,
    misafirSayisi: 250,
    salon: 'Ana Salon'
  },
  {
    id: '5',
    adSoyad: 'Deniz Arslan',
    etkinlikTuru: 'Düğün',
    tarih: '5 Ekim 2025',
    durum: 'Tamamlandı',
    telefon: '0536 555 6666',
    email: 'deniz@example.com',
    toplamTutar: 78000,
    odenecekTutar: 0,
    misafirSayisi: 180,
    salon: 'Ana Salon'
  },
  {
    id: '6',
    adSoyad: 'Merve Koç',
    etkinlikTuru: 'Nişan',
    tarih: '20 Eylül 2025',
    durum: 'İptal',
    telefon: '0537 666 7777',
    email: 'merve@example.com',
    toplamTutar: 32000,
    odenecekTutar: 0,
    misafirSayisi: 90,
    salon: 'Küçük Salon'
  }
];



