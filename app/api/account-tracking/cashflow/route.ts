import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Nakit akışı verilerini getir (haftalık veya aylık)
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
    const period = searchParams.get('period') || 'weeks'; // 'weeks' veya 'months'
    const weeks = parseInt(searchParams.get('weeks') || '12');
    const months = parseInt(searchParams.get('months') || '12');

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tüm ödemeleri ve kasa işlemlerini getir (geçmiş ve gelecek)
    const [allPayments, allTransactions, reservations] = await Promise.all([
      prisma.payments.findMany({
        where: {
          isCancelled: false,
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
      }),
      prisma.cashBoxTransaction.findMany({
        include: {
          CashBox_CashBoxTransaction_cashBoxIdToCashBox: true,
        },
        orderBy: {
          tarih: 'asc',
        },
      }),
      // Bekleyen rezervasyon ödemeleri (kalan bakiyeler)
      prisma.reservation.findMany({
        where: {
          durum: { not: 'İptal' },
        },
        include: {
          Customer: true,
        },
      }),
    ]);

    // Her rezervasyon için kalan bakiyeyi hesapla
    const pendingPayments: any[] = [];
    for (const reservation of reservations) {
      const totalPayments = allPayments
        .filter(p => p.reservationId === reservation.id && !p.isCancelled)
        .reduce((sum, p) => sum + parseFloat(String(p.amount || 0)), 0);
      
      const totalPrice = reservation.sozlesmeFiyati ? parseFloat(String(reservation.sozlesmeFiyati)) : 0;
      const remaining = totalPrice - totalPayments;
      
      if (remaining > 0 && reservation.rezervasyonTarihi) {
        // Rezervasyon tarihinde bekleyen ödeme olarak ekle
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

    // Gelecekteki ödemeler ve işlemler
    const payments = allPayments.filter(p => {
      const paymentDate = new Date(p.paymentDate);
      return paymentDate >= today;
    });

    const transactions = allTransactions.filter(t => {
      const transactionDate = new Date(t.tarih);
      return transactionDate >= today;
    });

    // Başlangıç bakiyesi - tüm kasaların toplam bakiyesi (hem cashBoxTransaction hem de payments tablosundan)
    const cashBoxes = await prisma.cashBox.findMany({
      where: { isActive: true },
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
      const payments = await prisma.payments.findMany({
        where: {
          cashBoxId,
          isCancelled: false,
        },
      });

      for (const payment of payments) {
        currentBalance += parseFloat(String(payment.amount || 0));
      }

      return currentBalance;
    }

    let currentBalance = 0;
    for (const cashBox of cashBoxes) {
      const balance = await calculateCashBoxBalance(cashBox.id);
      currentBalance += balance;
    }

    const cashflowPeriods: any[] = [];

    if (period === 'weeks') {
      // 12 hafta için dönemler oluştur
      for (let i = 0; i < weeks; i++) {
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() + i * 7);
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        weekEnd.setHours(23, 59, 59, 999);

        const periodPayments = payments.filter(p => {
          const paymentDate = new Date(p.paymentDate);
          return paymentDate >= weekStart && paymentDate <= weekEnd;
        });

        // Bekleyen ödemeleri de ekle (rezervasyon tarihi bu dönemdeyse)
        const periodPendingPayments = pendingPayments.filter(p => {
          const paymentDate = new Date(p.paymentDate);
          return paymentDate >= weekStart && paymentDate <= weekEnd;
        });

        const periodTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tarih);
          return transactionDate >= weekStart && transactionDate <= weekEnd;
        });

        // Tahsilatlar (ödeme girişleri - gerçek ödemeler + bekleyen ödemeler)
        const tahsilatlar = [
          ...periodPayments
            .filter(p => Number(p.amount) > 0)
            .map(p => ({
              ad: `${p.Reservation?.Customer?.adSoyad || 'Bilinmeyen Müşteri'} - ${p.Reservation?.rezervasyonNo || ''}`,
              tutar: Number(p.amount),
            })),
          ...periodPendingPayments
            .filter(p => Number(p.amount) > 0)
            .map(p => ({
              ad: `${p.Reservation?.Customer?.adSoyad || 'Bilinmeyen Müşteri'} - ${p.Reservation?.rezervasyonNo || ''} (Bekleyen)`,
              tutar: Number(p.amount),
            })),
        ];

        // Ödemeler (kasa çıkışları)
        const odemeler = periodTransactions
          .filter(t => t.islemTuru === 'Gider' && Number(t.tutar) > 0)
          .map(t => ({
            ad: t.aciklama || 'Ödeme',
            tutar: Number(t.tutar),
          }));

        const inflow = tahsilatlar.reduce((sum, t) => sum + t.tutar, 0);
        const outflow = odemeler.reduce((sum, o) => sum + o.tutar, 0);

        const balanceStart = i === 0 ? currentBalance : cashflowPeriods[i - 1].balanceEnd;
        const balanceEnd = balanceStart + inflow - outflow;

        cashflowPeriods.push({
          date: weekStart.toISOString().split('T')[0],
          inflow,
          outflow,
          balanceStart,
          balanceEnd,
          tahsilatlar,
          odemeler,
        });
      }
    } else {
      // 12 ay için dönemler oluştur
      for (let i = 0; i < months; i++) {
        const monthStart = new Date(today.getFullYear(), today.getMonth() + i, 1);
        const monthEnd = new Date(today.getFullYear(), today.getMonth() + i + 1, 0);
        monthEnd.setHours(23, 59, 59, 999);

        const periodPayments = payments.filter(p => {
          const paymentDate = new Date(p.paymentDate);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });

        // Bekleyen ödemeleri de ekle (rezervasyon tarihi bu dönemdeyse)
        const periodPendingPayments = pendingPayments.filter(p => {
          const paymentDate = new Date(p.paymentDate);
          return paymentDate >= monthStart && paymentDate <= monthEnd;
        });

        const periodTransactions = transactions.filter(t => {
          const transactionDate = new Date(t.tarih);
          return transactionDate >= monthStart && transactionDate <= monthEnd;
        });

        const tahsilatlar = [
          ...periodPayments
            .filter(p => Number(p.amount) > 0)
            .map(p => ({
              ad: `${p.Reservation?.Customer?.adSoyad || 'Bilinmeyen Müşteri'} - ${p.Reservation?.rezervasyonNo || ''}`,
              tutar: Number(p.amount),
            })),
          ...periodPendingPayments
            .filter(p => Number(p.amount) > 0)
            .map(p => ({
              ad: `${p.Reservation?.Customer?.adSoyad || 'Bilinmeyen Müşteri'} - ${p.Reservation?.rezervasyonNo || ''} (Bekleyen)`,
              tutar: Number(p.amount),
            })),
        ];

        const odemeler = periodTransactions
          .filter(t => t.islemTuru === 'Gider' && Number(t.tutar) > 0)
          .map(t => ({
            ad: t.aciklama || 'Ödeme',
            tutar: Number(t.tutar),
          }));

        const inflow = tahsilatlar.reduce((sum, t) => sum + t.tutar, 0);
        const outflow = odemeler.reduce((sum, o) => sum + o.tutar, 0);

        const balanceStart = i === 0 ? currentBalance : cashflowPeriods[i - 1].balanceEnd;
        const balanceEnd = balanceStart + inflow - outflow;

        cashflowPeriods.push({
          date: monthStart.toISOString().split('T')[0],
          inflow,
          outflow,
          balanceStart,
          balanceEnd,
          tahsilatlar,
          odemeler,
        });
      }
    }

    return NextResponse.json({ cashflow: cashflowPeriods });
  } catch (error: any) {
    console.error('Cashflow GET error:', error);
    return NextResponse.json(
      { error: 'Nakit akışı verileri yüklenemedi', message: error.message },
      { status: 500 }
    );
  }
}



