import { prisma } from '@/app/lib/prisma';

/**
 * Benzersiz rezervasyon numarası üretir
 * Format: REZ-YYYY-XXXX (örn: REZ-2024-0001)
 */
export async function generateReservationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `REZ-${year}-`;
  
  // Bu yıl için en son rezervasyon numarasını bul
  const lastReservation = await prisma.reservation.findFirst({
    where: {
      rezervasyonNo: {
        startsWith: prefix,
      },
    },
    orderBy: {
      rezervasyonNo: 'desc',
    },
  });

  let sequence = 1;
  
  if (lastReservation?.rezervasyonNo) {
    // Son numaradan sıra numarasını çıkar
    const lastSequence = parseInt(
      lastReservation.rezervasyonNo.replace(prefix, '')
    );
    if (!isNaN(lastSequence)) {
      sequence = lastSequence + 1;
    }
  }

  // 4 haneli sıra numarası (0001, 0002, ...)
  const sequenceStr = sequence.toString().padStart(4, '0');
  
  return `${prefix}${sequenceStr}`;
}

/**
 * Customer oluşturur veya günceller
 * Telefon veya email ile mevcut müşteriyi bulur, yoksa yeni oluşturur
 */
export async function findOrCreateCustomer(data: {
  adSoyad: string;
  telefon?: string;
  email?: string;
  adres?: string;
}): Promise<string> {
  // Önce telefon ile ara
  if (data.telefon) {
    const existingByPhone = await prisma.customer.findFirst({
      where: {
        telefon: data.telefon,
      },
    });
    
    if (existingByPhone) {
      // Mevcut müşteriyi güncelle
      await prisma.customer.update({
        where: { id: existingByPhone.id },
        data: {
          adSoyad: data.adSoyad,
          email: data.email || existingByPhone.email,
          adres: data.adres || existingByPhone.adres,
          updatedAt: new Date(),
        },
      });
      return existingByPhone.id;
    }
  }

  // Email ile ara
  if (data.email) {
    const existingByEmail = await prisma.customer.findFirst({
      where: {
        email: data.email,
      },
    });
    
    if (existingByEmail) {
      // Mevcut müşteriyi güncelle
      await prisma.customer.update({
        where: { id: existingByEmail.id },
        data: {
          adSoyad: data.adSoyad,
          telefon: data.telefon || existingByEmail.telefon,
          adres: data.adres || existingByEmail.adres,
          updatedAt: new Date(),
        },
      });
      return existingByEmail.id;
    }
  }

  // Yeni müşteri oluştur
  const newCustomer = await prisma.customer.create({
    data: {
      id: `customer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      adSoyad: data.adSoyad,
      telefon: data.telefon || null,
      email: data.email || null,
      adres: data.adres || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return newCustomer.id;
}

/**
 * Rezervasyon aktivite logu kaydeder
 */
export async function logReservationActivity(
  reservationId: string,
  activityType: string,
  activityTitle: string,
  activityDescription?: string,
  userId?: string,
  userName?: string,
  oldValue?: string,
  newValue?: string
) {
  try {
    await prisma.rezervasyonAktivite.create({
      data: {
        id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        rezervasyonId: reservationId,
        activityType,
        activityTitle,
        activityDescription: activityDescription || null,
        userId: userId || null,
        userName: userName || null,
        oldValue: oldValue || null,
        newValue: newValue || null,
        createdAt: new Date(),
      },
    });
  } catch (error) {
    // Log hatası sistemin çalışmasını engellememeli
    console.error('Error logging reservation activity:', error);
  }
}


