import nodemailer from 'nodemailer';
import { prisma } from './prisma';

// SMTP yapılandırması
// Plesk'te eventra@blackwool.app mail adresi kullanılacak
// Plesk'te genellikle localhost:25 kullanılır veya sendmail
const getTransporter = () => {
  // Sendmail kullan (Plesk'te daha güvenilir)
  if (process.env.USE_SENDMAIL === 'true' || !process.env.SMTP_HOST) {
    return nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail',
    });
  }

  // SMTP kullan
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'localhost',
    port: parseInt(process.env.SMTP_PORT || '25'),
    secure: false, // Port 25 için secure false
    auth: {
      user: process.env.SMTP_USER || 'eventra@blackwool.app',
      pass: process.env.SMTP_PASSWORD || '',
    },
    // Plesk SMTP için ek ayarlar
    tls: {
      rejectUnauthorized: false,
    },
    // Plesk için ek ayarlar
    requireTLS: false,
    connectionTimeout: 10000,
    greetingTimeout: 10000,
  });
};

const transporter = getTransporter();

// Şirket bilgilerini getir
async function getCompanyInfo() {
  try {
    const settings = await prisma.generalSettings.findFirst({
      orderBy: { createdAt: 'desc' },
    });
    return {
      companyName: settings?.companyName || 'Eventra',
      companyEmail: settings?.companyEmail || process.env.SMTP_USER || 'eventra@blackwool.app',
      companyPhone: settings?.companyPhone || '',
      companyAddress: settings?.companyAddress || '',
      companyLogo: settings?.companyLogo || null,
      taxNumber: settings?.taxNumber || '',
      taxOffice: settings?.taxOffice || '',
    };
  } catch (error) {
    console.error('Error fetching company info:', error);
    return {
      companyName: 'Eventra',
      companyEmail: process.env.SMTP_USER || 'eventra@blackwool.app',
      companyPhone: '',
      companyAddress: '',
      companyLogo: null,
      taxNumber: '',
      taxOffice: '',
    };
  }
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}) {
  try {
    // SMTP ayarları kontrol et
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) {
      console.warn('SMTP ayarları eksik, e-posta gönderilemiyor. Sadece loglama yapılıyor.');
      console.log('Email would be sent to:', to);
      console.log('Subject:', subject);
      return { success: false, error: 'SMTP ayarları eksik' };
    }

    const useSendmail = process.env.USE_SENDMAIL === 'true' || !process.env.SMTP_HOST;
    
    console.log('Attempting to send email:', {
      method: useSendmail ? 'sendmail' : 'SMTP',
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      to,
      subject,
    });

    const mailOptions: any = {
      from: `"Eventra" <${process.env.SMTP_USER || 'eventra@blackwool.app'}>`,
      to,
      subject,
      html: html || text,
      text,
    };

    // Sendmail kullanılıyorsa transporter'ı yeniden oluştur
    const currentTransporter = useSendmail ? getTransporter() : transporter;

    const info = await currentTransporter.sendMail(mailOptions);

    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error('Email send error details:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response,
      responseCode: error.responseCode,
    });
    // Hata detaylarını logla
    console.warn('Email gönderilemedi:', error.message);
    throw error; // Hata fırlat ki çağıran fonksiyon bilsin
  }
}

export async function sendPasswordResetEmail(email: string, resetLink: string) {
  const companyInfo = await getCompanyInfo();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { max-width: 150px; max-height: 60px; margin-bottom: 15px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${companyInfo.companyLogo ? `<img src="${companyInfo.companyLogo}" alt="${companyInfo.companyName}" class="logo" />` : ''}
          <h1>Şifre Sıfırlama</h1>
        </div>
        <div class="content">
          <p>Merhaba,</p>
          <p>Eventra hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
          <p>Aşağıdaki bağlantıya tıklayarak yeni şifrenizi belirleyebilirsiniz:</p>
          <p style="text-align: center;">
            <a href="${resetLink}" class="button">Şifremi Sıfırla</a>
          </p>
          <div class="warning">
            <strong>⚠️ Önemli:</strong> Bu bağlantı 3 dakika geçerlidir. Bağlantıyı başkalarıyla paylaşmayın.
          </div>
          <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
          <p>İyi günler,<br>${companyInfo.companyName} Ekibi</p>
        </div>
        <div class="footer">
          <p>Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: 'Eventra - Şifre Sıfırlama',
    html,
  });
}

export async function sendDemoRequestEmail(adminEmail: string, data: {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message?: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .info-box strong { display: inline-block; width: 120px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Yeni Demo Talebi</h1>
        </div>
        <div class="content">
          <p>Yeni bir demo talebi alındı:</p>
          <div class="info-box">
            <p><strong>Ad Soyad:</strong> ${data.name}</p>
            <p><strong>E-posta:</strong> ${data.email}</p>
            ${data.phone ? `<p><strong>Telefon:</strong> ${data.phone}</p>` : ''}
            ${data.company ? `<p><strong>Şirket:</strong> ${data.company}</p>` : ''}
            ${data.message ? `<p><strong>Mesaj:</strong><br>${data.message.replace(/\n/g, '<br>')}</p>` : ''}
          </div>
          <p>Lütfen en kısa sürede ilgili kişiye dönüş yapın.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: adminEmail,
    subject: `Eventra - Yeni Demo Talebi: ${data.name}`,
    html,
  });
}

export async function sendReservationConfirmationEmail(
  customerEmail: string,
  reservationData: {
    rezervasyonNo: string;
    rezervasyonTarihi: Date | string;
    musteriAdi: string;
    salon?: string;
    durum: string;
  }
) {
  const companyInfo = await getCompanyInfo();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { max-width: 150px; max-height: 60px; margin-bottom: 15px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #667eea; }
        .info-box strong { display: inline-block; width: 150px; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; border-radius: 4px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${companyInfo.companyLogo ? `<img src="${companyInfo.companyLogo}" alt="${companyInfo.companyName}" class="logo" />` : ''}
          <h1>Rezervasyon Onayı</h1>
        </div>
        <div class="content">
          <p>Sayın ${reservationData.musteriAdi},</p>
          <p>Rezervasyonunuz başarıyla oluşturulmuştur.</p>
          <div class="success">
            <strong>✅ Rezervasyon Onaylandı</strong>
          </div>
          <div class="info-box">
            <p><strong>Rezervasyon No:</strong> ${reservationData.rezervasyonNo}</p>
            <p><strong>Tarih:</strong> ${new Date(reservationData.rezervasyonTarihi).toLocaleDateString('tr-TR')}</p>
            ${reservationData.salon ? `<p><strong>Salon:</strong> ${reservationData.salon}</p>` : ''}
            <p><strong>Durum:</strong> ${reservationData.durum}</p>
          </div>
          <p>Rezervasyonunuzla ilgili detaylı bilgi için lütfen bizimle iletişime geçin.</p>
          ${companyInfo.companyPhone ? `<p><strong>Telefon:</strong> ${companyInfo.companyPhone}</p>` : ''}
          ${companyInfo.companyAddress ? `<p><strong>Adres:</strong> ${companyInfo.companyAddress}</p>` : ''}
          <p>İyi günler,<br>${companyInfo.companyName} Ekibi</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `${companyInfo.companyName} - Rezervasyon Onayı: ${reservationData.rezervasyonNo}`,
    html,
  });
}

export async function sendPaymentReminderEmail(
  customerEmail: string,
  paymentData: {
    rezervasyonNo: string;
    rezervasyonTarihi: Date | string;
    musteriAdi: string;
    bekleyenTutar: number;
    sonOdemeTarihi?: Date | string;
  }
) {
  const companyInfo = await getCompanyInfo();
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .logo { max-width: 150px; max-height: 60px; margin-bottom: 15px; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info-box { background: white; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #f59e0b; }
        .info-box strong { display: inline-block; width: 150px; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .amount { font-size: 24px; font-weight: bold; color: #d97706; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          ${companyInfo.companyLogo ? `<img src="${companyInfo.companyLogo}" alt="${companyInfo.companyName}" class="logo" />` : ''}
          <h1>Ödeme Hatırlatması</h1>
        </div>
        <div class="content">
          <p>Sayın ${paymentData.musteriAdi},</p>
          <p>Rezervasyonunuz için bekleyen ödemeniz bulunmaktadır.</p>
          <div class="warning">
            <strong>⚠️ Ödeme Hatırlatması</strong>
          </div>
          <div class="info-box">
            <p><strong>Rezervasyon No:</strong> ${paymentData.rezervasyonNo}</p>
            <p><strong>Rezervasyon Tarihi:</strong> ${new Date(paymentData.rezervasyonTarihi).toLocaleDateString('tr-TR')}</p>
            <p><strong>Bekleyen Tutar:</strong> <span class="amount">${paymentData.bekleyenTutar.toLocaleString('tr-TR')} ₺</span></p>
            ${paymentData.sonOdemeTarihi ? `<p><strong>Son Ödeme Tarihi:</strong> ${new Date(paymentData.sonOdemeTarihi).toLocaleDateString('tr-TR')}</p>` : ''}
          </div>
          <p>Lütfen ödemenizi zamanında yaparak rezervasyonunuzun kesinleşmesini sağlayın.</p>
          <p>Ödeme ile ilgili sorularınız için bizimle iletişime geçebilirsiniz.</p>
          ${companyInfo.companyPhone ? `<p><strong>Telefon:</strong> ${companyInfo.companyPhone}</p>` : ''}
          ${companyInfo.companyAddress ? `<p><strong>Adres:</strong> ${companyInfo.companyAddress}</p>` : ''}
          <p>İyi günler,<br>${companyInfo.companyName} Ekibi</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: customerEmail,
    subject: `${companyInfo.companyName} - Ödeme Hatırlatması: ${paymentData.rezervasyonNo}`,
    html,
  });
}

