import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Yaklaşan işlemleri getir (faturalar, ödemeler, tahsilatlar)
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
    const limit = parseInt(searchParams.get('limit') || '50');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Gelecekteki ödemeler (tahsilatlar) - gerçek ödemeler
    const upcomingPayments = await prisma.payments.findMany({
      where: {
        isCancelled: false,
        paymentDate: { gte: today },
      },
      include: {
        Reservation: {
          include: {
            Customer: true,
          },
        },
      },
      orderBy: {
        paymentDate: 'asc',
      },
    });

    // Bekleyen rezervasyon ödemeleri (kalan bakiyeler)
    const reservations = await prisma.reservation.findMany({
      where: {
        durum: { not: 'İptal' },
        rezervasyonTarihi: { gte: today },
      },
      include: {
        Customer: true,
      },
    });

    // Her rezervasyon için kalan bakiyeyi hesapla
    const pendingPayments: any[] = [];
    for (const reservation of reservations) {
      const totalPayments = await prisma.payments.aggregate({
        where: {
          reservationId: reservation.id,
          isCancelled: false,
        },
        _sum: {
          amount: true,
        },
      });
      
      const totalPaid = totalPayments._sum.amount ? parseFloat(String(totalPayments._sum.amount)) : 0;
      const totalPrice = reservation.sozlesmeFiyati ? parseFloat(String(reservation.sozlesmeFiyati)) : 0;
      const remaining = totalPrice - totalPaid;
      
      if (remaining > 0 && reservation.rezervasyonTarihi) {
        pendingPayments.push({
          id: `pending_${reservation.id}`,
          reservationId: reservation.id,
          paymentDate: reservation.rezervasyonTarihi,
          amount: remaining,
          Reservation: reservation,
          isPending: true,
        });
      }
    }

    // Gelecekteki kasa işlemleri (ödeme çıkışları)
    const upcomingTransactions = await prisma.cashBoxTransaction.findMany({
      where: {
        tarih: { gte: today },
        islemTuru: 'Gider',
      },
      include: {
        CashBox_CashBoxTransaction_cashBoxIdToCashBox: true,
      },
      orderBy: {
        tarih: 'asc',
      },
      take: limit,
    });

    // Rezervasyonlardan fatura bilgileri (fatura istenenler)
    const reservationsWithInvoice = await prisma.reservation.findMany({
      where: {
        faturaIstiyorum: true,
        rezervasyonTarihi: { gte: today },
      },
      include: {
        Customer: true,
      },
      orderBy: {
        rezervasyonTarihi: 'asc',
      },
      take: limit,
    });

    // Tüm işlemleri birleştir ve sırala
    const transactions: any[] = [];

    // Tahsilatlar (ödeme girişleri - gerçek ödemeler)
    upcomingPayments.forEach(payment => {
      transactions.push({
        type: 'Tahsilat',
        dueDate: payment.paymentDate.toISOString().split('T')[0],
        partner: payment.Reservation?.Customer?.adSoyad || 'Bilinmeyen Müşteri',
        description: `Rezervasyon Ödemesi: ${payment.Reservation?.rezervasyonNo || 'N/A'} - ${payment.notes || ''}`,
        debit: 0,
        credit: Number(payment.amount),
        reservationId: payment.reservationId,
      });
    });

    // Bekleyen ödemeler (kalan bakiyeler)
    pendingPayments.forEach(payment => {
      transactions.push({
        type: 'Bekleyen Tahsilat',
        dueDate: payment.paymentDate.toISOString().split('T')[0],
        partner: payment.Reservation?.Customer?.adSoyad || 'Bilinmeyen Müşteri',
        description: `Rezervasyon Kalan Bakiye: ${payment.Reservation?.rezervasyonNo || 'N/A'}`,
        debit: 0,
        credit: Number(payment.amount),
        reservationId: payment.reservationId,
      });
    });

    // Ödemeler (kasa çıkışları)
    upcomingTransactions.forEach(transaction => {
      transactions.push({
        type: 'Alış Faturası',
        dueDate: transaction.tarih.toISOString().split('T')[0],
        partner: transaction.aciklama || 'Tedarikçi',
        description: transaction.aciklama || 'Ödeme',
        debit: Number(transaction.tutar),
        credit: 0,
        transactionId: transaction.id,
      });
    });

    // Fatura bekleyen rezervasyonlar
    reservationsWithInvoice.forEach(reservation => {
      const fiyat = reservation.sozlesmeFiyati ? Number(reservation.sozlesmeFiyati) : 0;
      if (fiyat > 0) {
        transactions.push({
          type: 'Satış Faturası',
          dueDate: reservation.rezervasyonTarihi?.toISOString().split('T')[0] || today.toISOString().split('T')[0],
          partner: reservation.Customer?.adSoyad || reservation.faturaUnvani || 'Bilinmeyen',
          description: `Rezervasyon: ${reservation.rezervasyonNo || 'N/A'}`,
          debit: 0,
          credit: fiyat,
          reservationId: reservation.id,
        });
      }
    });

    // Tarihe göre sırala
    transactions.sort((a, b) => {
      const dateA = new Date(a.dueDate);
      const dateB = new Date(b.dueDate);
      return dateA.getTime() - dateB.getTime();
    });

    return NextResponse.json({ transactions: transactions.slice(0, limit) });
  } catch (error: any) {
    console.error('Upcoming transactions GET error:', error);
    return NextResponse.json(
      { error: 'Yaklaşan işlemler yüklenemedi', message: error.message },
      { status: 500 }
    );
  }
}



