// API endpoint'ini test etmek için basit bir test
// Bu script Next.js dev server'ı çalışırken test edilebilir

async function testCashBoxAPI() {
  try {
    console.log('API endpoint test ediliyor...\n');
    
    // Local API endpoint'ini test et
    const response = await fetch('http://localhost:3000/eventra/api/cash-boxes?isActive=true', {
      credentials: 'include',
      headers: {
        'Cookie': 'eventra_auth=1', // Development için
      },
    });

    if (!response.ok) {
      console.error(`❌ API Hatası: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.error('Hata detayı:', errorText);
      return;
    }

    const data = await response.json();
    console.log(`✅ API Başarılı! ${data.cashBoxes?.length || 0} kasa bulundu.\n`);

    if (data.cashBoxes && data.cashBoxes.length > 0) {
      console.log('Kasalar:');
      data.cashBoxes.forEach((cb: any, index: number) => {
        console.log(`${index + 1}. ${cb.kasaAdi}`);
        console.log(`   Tür: ${cb.tur}`);
        console.log(`   Bakiye: ${cb.currentBalance || cb.acilisBakiyesi} ₺`);
        console.log(`   Aktif: ${cb.isActive ? 'Evet' : 'Hayır'}`);
        console.log('');
      });
    } else {
      console.log('⚠️  Hiç kasa bulunamadı!');
    }

  } catch (error: any) {
    console.error('❌ Test hatası:', error.message);
    console.log('\n💡 Not: Next.js dev server\'ının çalıştığından emin olun (npm run dev)');
  }
}

testCashBoxAPI();

