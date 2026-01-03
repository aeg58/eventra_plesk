# Eventra - Düğün ve Etkinlik Takip Sistemi

Modern bir düğün salonu ve etkinlik yönetim sistemi. Next.js 14, TypeScript ve Tailwind CSS ile geliştirilmiştir.

## 🚀 Özellikler

- **Takvim Görünümü**: 2 haftalık, aylık, 3 aylık ve yıllık görünüm seçenekleri
- **Rezervasyon Yönetimi**: Kolay rezervasyon ekleme ve düzenleme
- **Dashboard**: Hızlı istatistikler ve bilgi kutucukları
- **Filtreleme**: Durum, tür, salon ve tarihe göre filtreleme
- **Dark Mode**: Koyu tema desteği
- **Responsive**: Mobil ve masaüstü uyumlu tasarım

## 📋 Gereksinimler

- Node.js 18.x veya üzeri
- npm veya yarn
- MySQL 8.0 veya üzeri
- Git

## 🛠️ Kurulum

### 1. Projeyi Klonlayın

```bash
git clone https://github.com/miqropz/eventrali.git
cd eventrali
```

### 2. Bağımlılıkları Yükleyin

```bash
npm install
```

### 3. Veritabanı Kurulumu

#### 3.1. MySQL Veritabanı Oluşturun

MySQL'de yeni bir veritabanı oluşturun:

```sql
CREATE DATABASE eventra_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### 3.2. Ortam Değişkenlerini Ayarlayın

`.env` dosyası oluşturun (`.env.example` dosyasını referans alabilirsiniz):

```bash
cp .env.example .env
```

`.env` dosyasını düzenleyin ve veritabanı bilgilerinizi girin:

```env
DATABASE_URL="mysql://kullanici:sifre@localhost:3306/eventra_db"
```

**Önemli:** `.env` dosyası asla GitHub'a yüklenmemelidir (`.gitignore`'da zaten var).

#### 3.3. Prisma Migration ve Seed

Veritabanı şemasını oluşturun ve örnek verileri ekleyin:

```bash
# Prisma client'ı oluştur
npm run db:generate

# Veritabanı migration'larını çalıştır (tabloları oluşturur)
npm run db:migrate

# Örnek verileri ekle (seed)
npm run db:seed
```

**Not:** İlk migration sırasında Prisma size bir migration adı soracaktır. Örneğin: `init` yazabilirsiniz.

### 4. Geliştirme Sunucusunu Başlatın

```bash
npm run dev
```

### 5. Tarayıcıda Açın

```
http://localhost:3000
```

**Varsayılan Giriş Bilgileri:**
- Email: `admin@eventra.local`
- Şifre: `admin123`

## 📁 Proje Yapısı

```
/app
├── layout.tsx              → Ana layout (Header, Sidebar)
├── page.tsx                → Ana sayfa (Takvim ve Dashboard)
├── rezervasyon/
│   ├── yeni/page.tsx       → Yeni rezervasyon formu
│   └── [id]/page.tsx       → Rezervasyon detay sayfası
├── components/
│   ├── Header.tsx          → Üst bar
│   ├── Sidebar.tsx         → Sol menü
│   ├── Calendar.tsx        → Takvim bileşeni
│   ├── Filters.tsx         → Filtre alanı
│   ├── DashboardStats.tsx  → İstatistik kutucukları
│   └── ViewModeSelector.tsx → Görünüm seçici
├── styles/
│   └── globals.css         → Global stiller
└── utils/
    └── helpers.ts          → Yardımcı fonksiyonlar
```

## 🎨 Renk Kodları

- **Düğün**: Mavi (`bg-blue-500`)
- **Kına**: Pembe (`bg-pink-500`)
- **Nişan**: Mor (`bg-purple-500`)
- **Sünnet**: Turkuaz (`bg-teal-500`)
- **İptal**: Gri (`bg-gray-400`)

## 🔧 Geliştirme

```bash
# Geliştirme modunda çalıştır
npm run dev

# Production build
npm run build

# Production'da başlat
npm start

# Lint kontrolü
npm run lint
```

## 🗄️ Veritabanı Komutları

```bash
# Prisma Client'ı oluştur
npm run db:generate

# Yeni migration oluştur ve uygula
npm run db:migrate

# Veritabanı seed (örnek veriler)
npm run db:seed

# Prisma Studio'yu aç (veritabanı görüntüleme arayüzü)
npm run db:studio
```

## 📊 Veritabanı Yapısı

Proje Prisma ORM kullanmaktadır. Veritabanı şeması `prisma/schema.prisma` dosyasında tanımlanmıştır.

### Seed İşlemi

`npm run db:seed` komutu şunları ekler:
- ✅ Temel birimler (Hizmet, Kilogram, Litre, vb.)
- ✅ Rezervasyon kaynakları (Instagram, Facebook, Google, vb.)
- ✅ Rezervasyon durumları (Beklemede, Onaylandı, İptal, vb.)
- ✅ Organizasyon grupları (Düğün, Kına, Nişan, vb.)
- ✅ Örnek ofisler ve salonlar
- ✅ Zaman dilimleri
- ✅ Varsayılan kullanıcılar
- ✅ Sistem ayarları

### Test Verileri (Opsiyonel)

Daha fazla test verisi eklemek için:

```bash
# Test rezervasyonları ekle
npm run add-test-reservations

# Test kasaları ekle
npm run add-test-cash-boxes
```

## 📝 Önemli Notlar

- ⚠️ **Veritabanı verileri GitHub'a yüklenmez** - Sadece şema (schema) ve seed script'leri yüklenir
- 🔒 `.env` dosyası asla commit edilmemelidir (`.gitignore`'da zaten var)
- 🗄️ Veritabanı verilerini paylaşmak için SQL dump kullanabilirsiniz (production'da dikkatli olun)
- 📦 Seed script'leri her çalıştırıldığında mevcut verileri kontrol eder, tekrar eklemez (idempotent)

## 🔄 Yeni Bir Ortamda Kurulum

Başka biri projeyi çektiğinde:

1. Repository'yi klonlayın
2. `npm install` çalıştırın
3. `.env` dosyasını oluşturun ve veritabanı bilgilerinizi girin
4. `npm run db:generate` - Prisma client oluştur
5. `npm run db:migrate` - Veritabanı tablolarını oluştur
6. `npm run db:seed` - Örnek verileri ekle (veya `npm run db:restore` ile güncel verileri yükleyin)
7. `npm run dev` - Geliştirme sunucusunu başlat

## 💾 Veritabanı Yedekleme ve Geri Yükleme

### Otomatik Yedekleme

Proje, veritabanı yedeklerini otomatik olarak `backups/` klasöründe tutar. Her yedekleme işleminde:
- Tarihli bir yedek dosyası oluşturulur (`eventra_db_YYYY-MM-DD_HH-MM-SS.sql`)
- `latest.sql` dosyası güncellenir (her zaman en güncel yedek)
- 30 günden eski yedekler otomatik temizlenir

### Yedek Oluşturma

```bash
npm run db:backup
```

Bu komut:
- Mevcut veritabanının tam yedeğini oluşturur
- `backups/latest.sql` dosyasını günceller
- Tarihli bir yedek dosyası oluşturur

**💡 İpucu:** Önemli işlemlerden sonra (rezervasyon ekleme, ödeme alma vb.) yedek almayı unutmayın!

### Geri Yükleme

```bash
npm run db:restore
```

Bu komut:
- `backups/` klasöründeki mevcut yedekleri listeler
- `latest.sql` dosyasını önerir (en güncel yedek)
- Seçtiğiniz yedeği veritabanına geri yükler

**⚠️ Dikkat:** Geri yükleme işlemi mevcut veritabanındaki **TÜM verileri siler** ve yedekteki verilerle değiştirir!

### Veri Paylaşımı (Ekip Çalışması)

**Senaryo:** Patron veya başka bir geliştirici projeyi çektiğinde güncel verileri almak istiyor.

1. **Yedek Oluşturma (Siz):**
   ```bash
   npm run db:backup
   ```
   Bu komut `backups/latest.sql` dosyasını günceller.

2. **Commit ve Push:**
   ```bash
   git add backups/latest.sql
   git commit -m "Update database backup"
   git push
   ```
   `latest.sql` dosyası GitHub'a yüklenir (diğer tarihli yedekler yüklenmez).

3. **Geri Yükleme (Patron/Başka Geliştirici):**
   ```bash
   git pull  # latest.sql dosyasını çeker
   npm run db:restore  # Veritabanına yükler
   ```

**Güvenlik Notu:** `latest.sql` dosyası hassas veriler içerebilir. Sadece güvenilir ekip üyeleriyle paylaşın. Production verilerini commit etmeden önce dikkatli olun!

### Manuel Yedekleme

Eğer otomatik yedekleme çalışmazsa, manuel olarak MySQL komutunu kullanabilirsiniz:

```bash
mysqldump -u kullanici -p veritabani_adi > backups/latest.sql
```

### Yedek Dosyaları

- `backups/latest.sql` - Her zaman güncel yedek (commit edilir)
- `backups/eventra_db_*.sql` - Tarihli yedekler (commit edilmez, 30 gün sonra silinir)

## 🎯 Özellikler

- ✅ Backend API entegrasyonu
- ✅ Veritabanı bağlantısı (Prisma + MySQL)
- ✅ Rezervasyon yönetimi
- ✅ Müşteri yönetimi
- ✅ Ödeme takibi
- ✅ Kasa yönetimi
- ✅ Raporlama
- ✅ E-posta ayarları
- ✅ SMS ayarları (hazır mesajlar)
- ✅ Kullanıcı ve rol yönetimi

## 📄 Lisans

Bu proje özel kullanım içindir.







