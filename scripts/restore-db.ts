import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

const execAsync = promisify(exec);

async function askQuestion(query: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function restoreDatabase() {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    console.error('❌ DATABASE_URL environment variable bulunamadı!');
    console.error('   .env dosyanızı kontrol edin.');
    process.exit(1);
  }

  // MySQL URL'ini parse et
  const urlMatch = dbUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
  
  if (!urlMatch) {
    console.error('❌ Geçersiz DATABASE_URL formatı!');
    process.exit(1);
  }

  const [, user, password, host, port, database] = urlMatch;

  // Backup klasöründeki dosyaları listele
  const backupDir = path.join(process.cwd(), 'backups');
  
  if (!fs.existsSync(backupDir)) {
    console.error('❌ Backups klasörü bulunamadı!');
    console.error('   Önce bir yedek oluşturmalısınız veya SQL dosyasını backups/ klasörüne koymalısınız.');
    process.exit(1);
  }

  // Önce latest.sql var mı kontrol et
  const latestFilepath = path.join(backupDir, 'latest.sql');
  const hasLatest = fs.existsSync(latestFilepath);

  const files = fs.readdirSync(backupDir)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse(); // En yeni dosyalar önce

  if (files.length === 0) {
    console.error('❌ Backups klasöründe SQL dosyası bulunamadı!');
    console.error('   SQL dosyasını backups/ klasörüne koyun.');
    process.exit(1);
  }

  console.log('📋 Mevcut yedekler:\n');
  
  if (hasLatest) {
    const latestStats = fs.statSync(latestFilepath);
    const latestSizeMB = (latestStats.size / (1024 * 1024)).toFixed(2);
    const latestDate = latestStats.mtime.toLocaleString('tr-TR');
    console.log(`   ⭐ latest.sql (${latestSizeMB} MB) - ${latestDate} [ÖNERİLEN]`);
  }

  files.forEach((file, index) => {
    if (file === 'latest.sql') return; // Zaten gösterdik
    
    const filepath = path.join(backupDir, file);
    const stats = fs.statSync(filepath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    const date = stats.mtime.toLocaleString('tr-TR');
    console.log(`   ${index + 1}. ${file} (${fileSizeMB} MB) - ${date}`);
  });

  console.log('\n⚠️  UYARI: Bu işlem mevcut veritabanındaki TÜM verileri silecek!');
  const confirm = await askQuestion('\nDevam etmek istiyor musunuz? (evet/hayır): ');

  if (confirm.toLowerCase() !== 'evet' && confirm.toLowerCase() !== 'e') {
    console.log('❌ İşlem iptal edildi.');
    process.exit(0);
  }

  let selectedFile: string;

  if (hasLatest) {
    const useLatest = await askQuestion(`\nlatest.sql dosyasını kullanmak ister misiniz? (evet/hayır) [evet]: `);
    
    if (useLatest.toLowerCase() === '' || useLatest.toLowerCase() === 'evet' || useLatest.toLowerCase() === 'e') {
      selectedFile = 'latest.sql';
    } else {
      const fileIndex = await askQuestion(`\nHangi dosyayı geri yüklemek istersiniz? (1-${files.length}): `);
      const selectedIndex = parseInt(fileIndex) - 1;

      if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= files.length) {
        console.error('❌ Geçersiz seçim!');
        process.exit(1);
      }

      selectedFile = files[selectedIndex];
    }
  } else {
    const fileIndex = await askQuestion(`\nHangi dosyayı geri yüklemek istersiniz? (1-${files.length}): `);
    const selectedIndex = parseInt(fileIndex) - 1;

    if (isNaN(selectedIndex) || selectedIndex < 0 || selectedIndex >= files.length) {
      console.error('❌ Geçersiz seçim!');
      process.exit(1);
    }

    selectedFile = files[selectedIndex];
  }

  const filepath = path.join(backupDir, selectedFile);

  console.log(`\n📥 Veritabanı geri yükleniyor: ${selectedFile}\n`);
  console.log(`   Veritabanı: ${database}`);
  console.log(`   Host: ${host}:${port}\n`);

  try {
    // MySQL restore komutu
    const command = `mysql -h ${host} -P ${port} -u ${user} -p${password} ${database} < "${filepath}"`;
    
    await execAsync(command, {
      shell: true,
      env: { ...process.env, MYSQL_PWD: password },
    });

    console.log('✅ Veritabanı başarıyla geri yüklendi!\n');
    console.log('💡 Prisma client\'ı yeniden oluşturmanız gerekebilir:');
    console.log('   npm run db:generate\n');

  } catch (error: any) {
    console.error('❌ Geri yükleme sırasında hata oluştu:');
    console.error(`   ${error.message}\n`);
    
    if (error.message.includes('mysql')) {
      console.error('💡 mysql client bulunamadı. MySQL client tools yüklü olmalı.');
      console.error('   Windows: MySQL Installer ile "MySQL Command Line Client" yükleyin');
      console.error('   Mac: brew install mysql-client');
      console.error('   Linux: sudo apt-get install mysql-client\n');
    }
    
    process.exit(1);
  }
}

// Script direkt çalıştırıldığında
if (require.main === module) {
  restoreDatabase();
}

export { restoreDatabase };


