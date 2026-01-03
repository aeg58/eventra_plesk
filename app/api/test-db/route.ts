import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export async function GET() {
  try {
    // DATABASE_URL kontrolü
    const hasDbUrl = !!process.env.DATABASE_URL;
    
    if (!hasDbUrl) {
      return NextResponse.json({
        success: false,
        error: 'DATABASE_URL environment variable bulunamadı',
        message: '.env dosyasında DATABASE_URL tanımlı olduğundan emin olun.',
      }, { status: 500 });
    }

    // Basit bir sorgu ile bağlantıyı test et
    const testResult: any = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Tabloları listele (MySQL için)
    const tables = await prisma.$queryRaw<Array<{ TABLE_NAME: string }>>`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = SCHEMA()
      ORDER BY TABLE_NAME
      LIMIT 20
    `;

    // Customer tablosundan örnek veri çek (varsa)
    let customerCount = 0;
    try {
      customerCount = await prisma.customer.count();
    } catch (e) {
      // Tablo yoksa veya hata varsa 0 döndür
    }

    // BigInt değerlerini string'e çevir
    const serializeBigInt = (obj: any): any => {
      if (obj === null || obj === undefined) return obj;
      if (typeof obj === 'bigint') return obj.toString();
      if (Array.isArray(obj)) return obj.map(serializeBigInt);
      if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
          result[key] = serializeBigInt(obj[key]);
        }
        return result;
      }
      return obj;
    };

    return NextResponse.json({
      success: true,
      message: 'Veritabanı bağlantısı başarılı!',
      data: {
        databaseUrl: process.env.DATABASE_URL ? '✅ Tanımlı' : '❌ Bulunamadı',
        testQuery: serializeBigInt(testResult),
        tableCount: tables.length,
        tables: tables.map(t => t.TABLE_NAME),
        customerCount: Number(customerCount),
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: 'Veritabanı bağlantı hatası',
      message: error.message,
      code: error.code,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    }, { status: 500 });
  }
}

