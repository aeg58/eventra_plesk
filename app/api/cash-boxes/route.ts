import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Kasa listesi
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    const tur = searchParams.get('tur');

    // Filtre oluştur
    const where: any = {};

    if (isActive !== null) {
      where.isActive = isActive === 'true';
    }

    if (tur) {
      where.tur = tur;
    }

    // Kasaları getir
    const cashBoxes = await prisma.cashBox.findMany({
      where,
      orderBy: {
        kasaAdi: 'asc',
      },
    });

    // Kasa bakiyesini hesapla (hem cashBoxTransaction hem de payments tablosundan)
    async function calculateCashBoxBalance(cashBoxId: string): Promise<number> {
      const cashBox = await prisma.cashBox.findUnique({
        where: { id: cashBoxId },
      });

      if (!cashBox) {
        return 0;
      }

      // Başlangıç bakiyesi
      let currentBalance = parseFloat(String(cashBox.acilisBakiyesi || 0));

      // CashBoxTransaction işlemlerini ekle
      const transactions = await prisma.cashBoxTransaction.findMany({
        where: { cashBoxId },
        orderBy: [
          { tarih: 'asc' },
          { createdAt: 'asc' },
        ],
      });

      for (const transaction of transactions) {
        if (transaction.islemTuru === 'Gelir' || transaction.islemTuru === 'Transfer Giriş') {
          currentBalance += parseFloat(String(transaction.tutar || 0));
        } else if (transaction.islemTuru === 'Gider' || transaction.islemTuru === 'Transfer Çıkış' || transaction.islemTuru === 'Transfer') {
          currentBalance -= parseFloat(String(transaction.tutar || 0));
        }
      }

      // Rezervasyon ödemelerini ekle (payments tablosundan)
      // Negatif tutarlar iade işlemleri için (otomatik olarak çıkarılır)
      const payments = await prisma.payments.findMany({
        where: {
          cashBoxId,
          isCancelled: false,
        },
      });

      for (const payment of payments) {
        currentBalance += parseFloat(String(payment.amount || 0)); // Negatif tutarlar otomatik olarak çıkarılır
      }

      return currentBalance;
    }

    // Her kasa için güncel bakiyeyi hesapla
    const cashBoxesWithBalance = await Promise.all(
      cashBoxes.map(async (cashBox) => {
        const currentBalance = await calculateCashBoxBalance(cashBox.id);
        return {
          ...cashBox,
          currentBalance,
        };
      })
    );

    return NextResponse.json({ cashBoxes: cashBoxesWithBalance });
  } catch (error: any) {
    console.error('Cash boxes GET error:', error);
    return NextResponse.json(
      { error: 'Kasalar getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni kasa oluştur
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const body = await request.json();
    const { kasaAdi, tur, iban, dovizCinsi, acilisBakiyesi, isActive } = body;

    // Validasyon
    if (!kasaAdi || !tur) {
      return NextResponse.json(
        { error: 'Kasa adı ve tür gereklidir' },
        { status: 400 }
      );
    }

    // Yeni kasa oluştur
    const cashBox = await prisma.cashBox.create({
      data: {
        id: `cashbox_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        kasaAdi,
        tur,
        iban: iban || null,
        dovizCinsi: dovizCinsi || 'TL',
        acilisBakiyesi: acilisBakiyesi ? parseFloat(String(acilisBakiyesi)) : 0,
        isActive: isActive !== undefined ? isActive : true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      cashBox,
      message: 'Kasa başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Cash box POST error:', error);
    return NextResponse.json(
      { error: 'Kasa oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}


