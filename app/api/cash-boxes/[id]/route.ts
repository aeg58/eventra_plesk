import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

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

// Kasa detayı ve bakiyesi
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const cashBox = await prisma.cashBox.findUnique({
      where: { id: params.id },
    });

    if (!cashBox) {
      return NextResponse.json(
        { error: 'Kasa bulunamadı' },
        { status: 404 }
      );
    }

    // Güncel bakiyeyi hesapla
    const currentBalance = await calculateCashBoxBalance(params.id);

    return NextResponse.json({
      cashBox: {
        ...cashBox,
        currentBalance,
      },
    });
  } catch (error: any) {
    console.error('Cash box GET error:', error);
    return NextResponse.json(
      { error: 'Kasa getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Kasa güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    const cashBox = await prisma.cashBox.findUnique({
      where: { id: params.id },
    });

    if (!cashBox) {
      return NextResponse.json(
        { error: 'Kasa bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { kasaAdi, tur, iban, dovizCinsi, acilisBakiyesi, isActive } = body;

    // Güncelleme verilerini hazırla
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (kasaAdi !== undefined) updateData.kasaAdi = kasaAdi;
    if (tur !== undefined) updateData.tur = tur;
    if (iban !== undefined) updateData.iban = iban || null;
    if (dovizCinsi !== undefined) updateData.dovizCinsi = dovizCinsi || 'TL';
    if (acilisBakiyesi !== undefined) updateData.acilisBakiyesi = parseFloat(String(acilisBakiyesi));
    if (isActive !== undefined) updateData.isActive = isActive;

    // Kasayı güncelle
    const updatedCashBox = await prisma.cashBox.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      cashBox: updatedCashBox,
      message: 'Kasa başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Cash box PUT error:', error);
    return NextResponse.json(
      { error: 'Kasa güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}


