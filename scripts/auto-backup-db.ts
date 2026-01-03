import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';

const execAsync = promisify(exec);

async function autoBackupDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable bulunamadı!');
    console.error('   .env dosyanızı kontrol edin.');
    process.exit(1);
  }

  // MySQL URL'ini parse et
  // Format: mysql://user:password@host:port/database
  const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!urlMatch) {
    console.error('❌ Geçersiz DATABASE_URL formatı!');
    console.error('   Format: mysql://user:password@host:port/database');
    process.exit(1);
  }

  const [, user, password, host, port, database] = urlMatch;
  
  // Backup klasörü oluştur
  const backupDir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Tarihli yedek dosyası
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const timestampedFilename = `eventra_db_${timestamp}.sql`;
  const timestampedFilepath = path.join(backupDir, timestampedFilename);

  // Latest yedek dosyası (her zaman güncel)
  const latestFilepath = path.join(backupDir, 'latest.sql');

  console.log('📦 Veritabanı yedeği oluşturuluyor...\n');
  console.log(`   Veritabanı: ${database}`);
  console.log(`   Host: ${host}:${port}`);

  try {
    // mysqldump komutu
    const command = `mysqldump -h ${host} -P ${port} -u ${user} -p${password} ${database} > "${timestampedFilepath}"`;
    
    await execAsync(command, {
      shell: true,
      env: { ...process.env, MYSQL_PWD: password },
    });

    // Latest.sql dosyasını da oluştur (kopyala)
    fs.copyFileSync(timestampedFilepath, latestFilepath);

    const stats = fs.statSync(timestampedFilepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);

    console.log('✅ Yedek başarıyla oluşturuldu!');
    console.log(`   📁 Tarihli yedek: ${timestampedFilename}`);
    console.log(`   📁 Güncel yedek: latest.sql`);
    console.log(`   📊 Boyut: ${fileSizeMB} MB\n`);

    // Eski yedekleri temizle (30 günden eski olanları sil)
    cleanupOldBackups(backupDir);

  } catch (error: any) {
    console.error('❌ Yedek oluşturulurken hata oluştu:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('mysqldump')) {
      console.error('💡 mysqldump bulunamadı. MySQL client tools yüklü olmalı.');
      console.error('   Windows: MySQL Installer ile "MySQL Command Line Client" yükleyin');
      console.error('   Mac: brew install mysql-client');
      console.error('   Linux: sudo apt-get install mysql-client\n');
    }
    
    process.exit(1);
  }
}

function cleanupOldBackups(backupDir: string) {
  try {
    const files = fs.readdirSync(backupDir)
      .filter(file => file.endsWith('.sql') && file !== 'latest.sql');

    const now = Date.now();
    const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;

    let deletedCount = 0;

    files.forEach(file => {
      const filepath = path.join(backupDir, file);
      const stats = fs.statSync(filepath);
      const fileAge = now - stats.mtime.getTime();

      if (fileAge > thirtyDaysInMs) {
        fs.unlinkSync(filepath);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 ${deletedCount} eski yedek dosyası temizlendi (30 günden eski)\n`);
    }
  } catch (error) {
    // Hata olsa bile devam et
    console.log('⚠️  Eski yedekler temizlenirken bir hata oluştu (devam ediliyor)\n');
  }
}

// Script direkt çalıştırıldığında
if (require.main === module) {
  autoBackupDatabase();
}

export { autoBackupDatabase };


