import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Kasa işlemleri listesi
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
    const cashBoxId = searchParams.get('cashBoxId');
    const reservationId = searchParams.get('reservationId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const islemTuru = searchParams.get('islemTuru');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;

    // Filtre oluştur
    const where: any = {};

    if (cashBoxId) {
      where.cashBoxId = cashBoxId;
    }

    if (reservationId) {
      where.reservationId = reservationId;
    }

    if (startDate && endDate) {
      where.tarih = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    } else if (startDate) {
      where.tarih = {
        gte: new Date(startDate),
      };
    } else if (endDate) {
      where.tarih = {
        lte: new Date(endDate),
      };
    }

    if (islemTuru) {
      where.islemTuru = islemTuru;
    }

    // İşlemleri getir
    const [transactions, total] = await Promise.all([
      prisma.cashBoxTransaction.findMany({
        where,
        include: {
          CashBox_CashBoxTransaction_cashBoxIdToCashBox: {
            select: {
              id: true,
              kasaAdi: true,
              tur: true,
            },
          },
          CashBox_CashBoxTransaction_hedefCashBoxIdToCashBox: {
            select: {
              id: true,
              kasaAdi: true,
            },
          },
        },
        orderBy: {
          tarih: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.cashBoxTransaction.count({ where }),
    ]);

    // Rezervasyon bilgilerini çek (reservationId'leri topla)
    const reservationIds = transactions
      .map(t => t.reservationId)
      .filter((id): id is string => id !== null && id !== undefined);
    
    const reservations = reservationIds.length > 0
      ? await prisma.reservation.findMany({
          where: {
            id: { in: reservationIds },
          },
          select: {
            id: true,
            rezervasyonNo: true,
          },
        })
      : [];

    // Rezervasyon bilgilerini map'le
    const reservationMap = new Map(
      reservations.map(r => [r.id, r.rezervasyonNo || r.id])
    );

    // Transaction'lara rezervasyon no ekle
    const transactionsWithReservation = transactions.map(t => ({
      ...t,
      rezervasyonNo: t.reservationId ? reservationMap.get(t.reservationId) : null,
    }));

    return NextResponse.json({
      transactions: transactionsWithReservation,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Cash box transactions GET error:', error);
    return NextResponse.json(
      { error: 'Kasa işlemleri getirilemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni kasa işlemi oluştur
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
    const {
      cashBoxId,
      hedefCashBoxId,
      reservationId,
      islemTuru,
      tutar,
      aciklama,
      tarih,
    } = body;

    // Validasyon
    if (!cashBoxId || !islemTuru || !tutar || !tarih) {
      return NextResponse.json(
        { error: 'Kasa ID, işlem türü, tutar ve tarih gereklidir' },
        { status: 400 }
      );
    }

    // Kasayı kontrol et
    const cashBox = await prisma.cashBox.findUnique({
      where: { id: cashBoxId },
    });

    if (!cashBox) {
      return NextResponse.json(
        { error: 'Kasa bulunamadı' },
        { status: 404 }
      );
    }

    // Hedef kasa kontrolü (transfer işlemleri için)
    if (hedefCashBoxId) {
      const hedefCashBox = await prisma.cashBox.findUnique({
        where: { id: hedefCashBoxId },
      });

      if (!hedefCashBox) {
        return NextResponse.json(
          { error: 'Hedef kasa bulunamadı' },
          { status: 404 }
        );
      }
    }

    // Son işlem bakiyesini al (tarih + createdAt kombinasyonu ile)
    const lastTransaction = await prisma.cashBoxTransaction.findFirst({
      where: { cashBoxId },
      orderBy: [
        { tarih: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    const lastBalance = lastTransaction
      ? parseFloat(String(lastTransaction.yeniBakiye))
      : parseFloat(String(cashBox.acilisBakiyesi));

    // Yeni bakiyeyi hesapla
    let newBalance = lastBalance;
    const amount = parseFloat(String(tutar));

    // Tutar validasyonu
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Tutar sıfırdan büyük olmalıdır' },
        { status: 400 }
      );
    }

    if (amount > 1000000000) { // 1 milyar limit
      return NextResponse.json(
        { error: 'Tutar çok büyük (maksimum: 1.000.000.000 ₺)' },
        { status: 400 }
      );
    }

    // Negatif bakiye kontrolü (Gider ve Transfer için)
    if ((islemTuru === 'Gider' || islemTuru === 'Transfer Çıkış' || islemTuru === 'Transfer') && lastBalance < amount) {
      return NextResponse.json(
        { error: 'Yetersiz bakiye. Mevcut bakiye: ' + lastBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' },
        { status: 400 }
      );
    }

    if (islemTuru === 'Gelir' || islemTuru === 'Transfer Giriş') {
      newBalance = lastBalance + amount;
    } else if (islemTuru === 'Gider' || islemTuru === 'Transfer Çıkış') {
      newBalance = lastBalance - amount;
    } else if (islemTuru === 'Transfer') {
      // Transfer işleminde hem çıkış hem giriş yapılır
      newBalance = lastBalance - amount;
    }

    // İşlem oluştur
    const transaction = await prisma.cashBoxTransaction.create({
      data: {
        id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        cashBoxId,
        hedefCashBoxId: hedefCashBoxId || null,
        reservationId: reservationId || null,
        islemTuru,
        tutar: amount,
        aciklama: aciklama || null,
        tarih: new Date(tarih),
        yeniBakiye: newBalance,
        createdAt: new Date(),
      },
    });

    // Transfer işleminde hedef kasaya da kayıt ekle
    if (islemTuru === 'Transfer' && hedefCashBoxId) {
      const hedefCashBox = await prisma.cashBox.findUnique({
        where: { id: hedefCashBoxId },
      });

      if (!hedefCashBox) {
        return NextResponse.json(
          { error: 'Hedef kasa bulunamadı' },
          { status: 404 }
        );
      }

      const hedefLastTransaction = await prisma.cashBoxTransaction.findFirst({
        where: { cashBoxId: hedefCashBoxId },
        orderBy: [
          { tarih: 'desc' },
          { createdAt: 'desc' },
        ],
      });

      const hedefLastBalance = hedefLastTransaction
        ? parseFloat(String(hedefLastTransaction.yeniBakiye))
        : parseFloat(String(hedefCashBox.acilisBakiyesi || 0));

      const hedefNewBalance = hedefLastBalance + amount;

      await prisma.cashBoxTransaction.create({
        data: {
          id: `transaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          cashBoxId: hedefCashBoxId,
          hedefCashBoxId: cashBoxId,
          reservationId: reservationId || null,
          islemTuru: 'Transfer Giriş',
          tutar: amount,
          aciklama: aciklama || `Transfer: ${cashBox.kasaAdi}`,
          tarih: new Date(tarih),
          yeniBakiye: hedefNewBalance,
          createdAt: new Date(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      transaction,
      message: 'Kasa işlemi başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Cash box transaction POST error:', error);
    return NextResponse.json(
      { error: 'Kasa işlemi oluşturulamadı', message: error.message },
      { status: 500 }
    );
  }
}

// Kasa işlemini güncelle
export async function PUT(request: NextRequest) {
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
    const id = searchParams.get('id');
    const body = await request.json();
    const {
      cashBoxId,
      islemTuru,
      tutar,
      aciklama,
      tarih,
    } = body;

    if (!id || !cashBoxId || !islemTuru || !tutar || !tarih) {
      return NextResponse.json(
        { error: 'Tüm alanlar gereklidir' },
        { status: 400 }
      );
    }

    // Mevcut işlemi bul
    const existingTransaction = await prisma.cashBoxTransaction.findUnique({
      where: { id },
      include: {
        CashBox_CashBoxTransaction_cashBoxIdToCashBox: true,
      },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'İşlem bulunamadı' },
        { status: 404 }
      );
    }

    // Tutar validasyonu
    const amount = parseFloat(String(tutar));
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Tutar sıfırdan büyük olmalıdır' },
        { status: 400 }
      );
    }

    if (amount > 1000000000) {
      return NextResponse.json(
        { error: 'Tutar çok büyük (maksimum: 1.000.000.000 ₺)' },
        { status: 400 }
      );
    }

    // Negatif bakiye kontrolü (Gider ve Transfer için)
    if ((islemTuru === 'Gider' || islemTuru === 'Transfer Çıkış' || islemTuru === 'Transfer')) {
      const currentCashBox = await prisma.cashBox.findUnique({
        where: { id: cashBoxId },
      });
      
      if (currentCashBox) {
        const lastTransaction = await prisma.cashBoxTransaction.findFirst({
          where: { cashBoxId, id: { not: id } }, // Mevcut işlem hariç
          orderBy: [
            { tarih: 'desc' },
            { createdAt: 'desc' },
          ],
        });

        const currentBalance = lastTransaction
          ? parseFloat(String(lastTransaction.yeniBakiye))
          : parseFloat(String(currentCashBox.acilisBakiyesi));

        if (currentBalance < amount) {
          return NextResponse.json(
            { error: 'Yetersiz bakiye. Mevcut bakiye: ' + currentBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 }) + ' ₺' },
            { status: 400 }
          );
        }
      }
    }

    // İşlemi güncelle
    const updatedTransaction = await prisma.cashBoxTransaction.update({
      where: { id },
      data: {
        islemTuru,
        tutar: amount,
        aciklama: aciklama || null,
        tarih: new Date(tarih),
      },
    });

    // Transfer işlemlerinde hedef kasayı da güncelle
    if (existingTransaction.islemTuru === 'Transfer' && existingTransaction.hedefCashBoxId) {
      await recalculateCashBoxBalance(existingTransaction.hedefCashBoxId);
    } else if (existingTransaction.islemTuru === 'Transfer Giriş' && existingTransaction.hedefCashBoxId) {
      await recalculateCashBoxBalance(existingTransaction.hedefCashBoxId);
    }

    // Kasa bakiyelerini yeniden hesapla
    await recalculateCashBoxBalance(cashBoxId);

    return NextResponse.json({
      success: true,
      transaction: updatedTransaction,
      message: 'İşlem başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Cash box transaction PUT error:', error);
    return NextResponse.json(
      { error: 'İşlem güncellenemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Kasa işlemini sil
export async function DELETE(request: NextRequest) {
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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'İşlem ID gereklidir' },
        { status: 400 }
      );
    }

    // Mevcut işlemi bul
    const existingTransaction = await prisma.cashBoxTransaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: 'İşlem bulunamadı' },
        { status: 404 }
      );
    }

    const cashBoxId = existingTransaction.cashBoxId;

    // İşlemi sil
    await prisma.cashBoxTransaction.delete({
      where: { id },
    });

    // Transfer işlemlerinde hedef kasayı da güncelle
    if (existingTransaction.islemTuru === 'Transfer' && existingTransaction.hedefCashBoxId) {
      await recalculateCashBoxBalance(existingTransaction.hedefCashBoxId);
    } else if (existingTransaction.islemTuru === 'Transfer Giriş' && existingTransaction.hedefCashBoxId) {
      // Transfer Giriş işlemlerinde kaynak kasayı da güncelle
      await recalculateCashBoxBalance(existingTransaction.hedefCashBoxId);
    }

    // Kasa bakiyelerini yeniden hesapla
    await recalculateCashBoxBalance(cashBoxId);

    return NextResponse.json({
      success: true,
      message: 'İşlem başarıyla silindi',
    });
  } catch (error: any) {
    console.error('Cash box transaction DELETE error:', error);
    return NextResponse.json(
      { error: 'İşlem silinemedi', message: error.message },
      { status: 500 }
    );
  }
}

// Kasa bakiyesini yeniden hesapla
async function recalculateCashBoxBalance(cashBoxId: string) {
  const cashBox = await prisma.cashBox.findUnique({
    where: { id: cashBoxId },
  });

  if (!cashBox) return;

  // Tüm işlemleri tarih ve createdAt sırasına göre al
  const transactions = await prisma.cashBoxTransaction.findMany({
    where: { cashBoxId },
    orderBy: [
      { tarih: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  // Bakiyeyi başlangıç bakiyesinden başlayarak yeniden hesapla
  let currentBalance = parseFloat(String(cashBox.acilisBakiyesi));

  for (const transaction of transactions) {
    if (transaction.islemTuru === 'Gelir' || transaction.islemTuru === 'Transfer Giriş') {
      currentBalance += parseFloat(String(transaction.tutar));
    } else if (transaction.islemTuru === 'Gider' || transaction.islemTuru === 'Transfer Çıkış') {
      currentBalance -= parseFloat(String(transaction.tutar));
    } else if (transaction.islemTuru === 'Transfer') {
      currentBalance -= parseFloat(String(transaction.tutar));
    } else if (transaction.islemTuru === 'İptal') {
      // İptal edilen ödemeler için bakiye düşürülür
      currentBalance -= parseFloat(String(transaction.tutar));
    }

    // İşlemin yeni bakiyesini güncelle
    await prisma.cashBoxTransaction.update({
      where: { id: transaction.id },
      data: { yeniBakiye: currentBalance },
    });
  }
}


