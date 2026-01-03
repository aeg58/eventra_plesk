import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Ödeme güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const payment = await prisma.payments.findUnique({
      where: { id: params.id },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Ödeme bulunamadı' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { cashBoxId, amount, paymentDate, paymentMethod, notes } = body;

    // Eski kasa işlemini bul ve sil (eğer varsa)
    const oldTransaction = await prisma.cashBoxTransaction.findFirst({
      where: {
        reservationId: payment.reservationId,
        cashBoxId: payment.cashBoxId,
        aciklama: { contains: payment.id },
      },
    });

    // Eski kasayı güncelle (iptal işlemi ekle)
    if (oldTransaction && payment.cashBoxId) {
      // Eski işlemi sil
      await prisma.cashBoxTransaction.delete({
        where: { id: oldTransaction.id },
      });

      // Bakiye yeniden hesapla
      await recalculateCashBoxBalance(payment.cashBoxId);
    }

    // Tutar validasyonu
    if (amount !== undefined) {
      const paymentAmount = parseFloat(String(amount));
      if (paymentAmount <= 0) {
        return NextResponse.json(
          { error: 'Tutar sıfırdan büyük olmalıdır' },
          { status: 400 }
        );
      }

      if (paymentAmount > 1000000000) {
        return NextResponse.json(
          { error: 'Tutar çok büyük (maksimum: 1.000.000.000 ₺)' },
          { status: 400 }
        );
      }
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (cashBoxId !== undefined) updateData.cashBoxId = cashBoxId || null;
    if (amount !== undefined) updateData.amount = parseFloat(String(amount));
    if (paymentDate !== undefined) updateData.paymentDate = new Date(paymentDate);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod || null;
    if (notes !== undefined) updateData.notes = notes || null;

    // Ödemeyi güncelle
    const updatedPayment = await prisma.payments.update({
      where: { id: params.id },
      data: updateData,
      include: {
        Reservation: {
          select: {
            rezervasyonNo: true,
          },
        },
        CashBox: {
          select: {
            kasaAdi: true,
          },
        },
      },
    });

    // Yeni kasa bakiyesini güncelle (eğer kasa belirtilmişse)
    const finalCashBoxId = cashBoxId !== undefined ? (cashBoxId || null) : payment.cashBoxId;
    const finalAmount = amount !== undefined ? parseFloat(String(amount)) : parseFloat(String(payment.amount));

    if (finalCashBoxId) {
      // Eğer kasa değiştiyse, eski kasayı da güncelle
      if (cashBoxId !== undefined && cashBoxId !== payment.cashBoxId && payment.cashBoxId) {
        await recalculateCashBoxBalance(payment.cashBoxId);
      }

      const newLastTransaction = await prisma.cashBoxTransaction.findFirst({
        where: { cashBoxId: finalCashBoxId },
        orderBy: [
          { tarih: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      const newCashBox = await prisma.cashBox.findUnique({
        where: { id: finalCashBoxId },
      });

      const newLastBalance = newLastTransaction
        ? parseFloat(String(newLastTransaction.yeniBakiye))
        : parseFloat(String(newCashBox?.acilisBakiyesi || 0));

      const newNewBalance = newLastBalance + finalAmount;

      // Yeni kasa işlemi kaydı oluştur
      await prisma.cashBoxTransaction.create({
        data: {
          id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cashBoxId: finalCashBoxId,
          reservationId: payment.reservationId,
          islemTuru: 'Gelir',
          tutar: finalAmount,
          aciklama: `Rezervasyon ödemesi: ${updatedPayment.Reservation?.rezervasyonNo || payment.reservationId}`,
          tarih: paymentDate ? new Date(paymentDate) : payment.paymentDate,
          yeniBakiye: newNewBalance,
          createdAt: new Date(),
        },
      });

      // Bakiye yeniden hesapla
      await recalculateCashBoxBalance(finalCashBoxId);
    }

    return NextResponse.json({
      success: true,
      payment: updatedPayment,
      message: 'Ödeme başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Payment PUT error:', error);
    return NextResponse.json(
      { error: 'Ödeme güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Ödeme iptal et (silme yerine iptal)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const payment = await prisma.payments.findUnique({
      where: { id: params.id },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Ödeme bulunamadı' },
        { status: 404 }
      );
    }

    if (payment.isCancelled) {
      return NextResponse.json(
        { error: 'Ödeme zaten iptal edilmiş' },
        { status: 400 }
      );
    }

    // Ödemeyi iptal et (silme yerine)
    const cancelledPayment = await prisma.payments.update({
      where: { id: params.id },
      data: {
        isCancelled: true,
        cancelledAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Kasa bakiyesini güncelle (eğer kasa belirtilmişse)
    if (payment.cashBoxId) {
      // Son işlem bakiyesini al
      const lastTransaction = await prisma.cashBoxTransaction.findFirst({
        where: { cashBoxId: payment.cashBoxId },
        orderBy: { tarih: 'desc' },
      });

      const lastBalance = lastTransaction
        ? parseFloat(String(lastTransaction.yeniBakiye))
        : parseFloat(String((await prisma.cashBox.findUnique({ where: { id: payment.cashBoxId } }))?.acilisBakiyesi || 0));

      const newBalance = lastBalance - parseFloat(String(payment.amount));

      // Eski kasa işlemini bul ve sil (eğer varsa)
      const oldTransaction = await prisma.cashBoxTransaction.findFirst({
        where: {
          reservationId: payment.reservationId,
          cashBoxId: payment.cashBoxId,
          aciklama: { contains: payment.id },
        },
      });

      if (oldTransaction) {
        // Eski işlemi sil
        await prisma.cashBoxTransaction.delete({
          where: { id: oldTransaction.id },
        });
      }

      // Bakiye yeniden hesapla
      await recalculateCashBoxBalance(payment.cashBoxId);
    }

    return NextResponse.json({
      success: true,
      payment: cancelledPayment,
      message: 'Ödeme başarıyla iptal edildi',
    });
  } catch (error: any) {
    console.error('Payment DELETE error:', error);
    return NextResponse.json(
      { error: 'Ödeme iptal edilemedi', message: error.message },
      { status: 500 }
    );
  }
}


