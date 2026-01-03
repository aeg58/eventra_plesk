import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Tüm zaman dilimlerini getir
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const officeId = searchParams.get('officeId');
    const salonId = searchParams.get('salonId');

    const where: any = {
      isActive: true,
    };
    
    // OfficeId filtresi
    if (officeId) {
      where.officeId = officeId;
    }
    
    // SalonId filtresi
    if (salonId) {
      where.salonId = salonId;
    }

    const timeSlots = await prisma.programSaatSlotlar_.findMany({
      where,
      orderBy: {
        sortOrder: 'asc',
      },
      include: {
        Ofisler: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        Subeler: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Çoklu şube/salon desteği için array'leri ekle (backward compatibility)
    const timeSlotsWithArrays = timeSlots.map(slot => ({
      ...slot,
      officeIds: slot.officeId ? [slot.officeId] : [],
      salonIds: slot.salonId ? [slot.salonId] : [],
    }));

    return NextResponse.json(timeSlotsWithArrays);
  } catch (error) {
    console.error('Error fetching time slots:', error);
    return NextResponse.json(
      { error: 'Zaman dilimleri getirilemedi' },
      { status: 500 }
    );
  }
}

// Yeni zaman dilimi oluştur
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, slug, description, startTime, endTime, officeId, officeIds, salonId, salonIds, capacity, sortOrder, isActive } = body;

    if (!name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'Ad, başlangıç saati ve bitiş saati zorunludur' },
        { status: 400 }
      );
    }

    // Çoklu şube ve salon desteği
    const finalOfficeIds = officeIds || (officeId ? [officeId] : []);
    const finalSalonIds = salonIds || (salonId ? [salonId] : []);

    // Eğer hiç şube ve salon seçilmemişse, genel bir kayıt oluştur
    if (finalOfficeIds.length === 0 && finalSalonIds.length === 0) {
      const timeSlot = await prisma.programSaatSlotlar_.create({
        data: {
          id: `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description: description || null,
          startTime,
          endTime,
          officeId: null,
          salonId: null,
          capacity: capacity ? parseInt(String(capacity)) : null,
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
      return NextResponse.json(timeSlot);
    }

    // Her şube/salon kombinasyonu için ayrı kayıt oluştur
    const createdSlots = [];
    const baseSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

    // Şubeler için
    for (const oId of finalOfficeIds) {
      if (finalSalonIds.length > 0) {
        // Her salon için ayrı kayıt
        for (const sId of finalSalonIds) {
          const timeSlot = await prisma.programSaatSlotlar_.create({
            data: {
              id: `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name,
              slug: `${baseSlug}-${oId}-${sId}`,
              description: description || null,
              startTime,
              endTime,
              officeId: oId,
              salonId: sId,
              capacity: capacity ? parseInt(String(capacity)) : null,
              sortOrder: sortOrder || 0,
              isActive: isActive !== undefined ? isActive : true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          createdSlots.push(timeSlot);
        }
      } else {
        // Sadece şube için kayıt
        const timeSlot = await prisma.programSaatSlotlar_.create({
          data: {
            id: `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            slug: `${baseSlug}-${oId}`,
            description: description || null,
            startTime,
            endTime,
            officeId: oId,
            salonId: null,
            capacity: capacity ? parseInt(String(capacity)) : null,
            sortOrder: sortOrder || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        createdSlots.push(timeSlot);
      }
    }

    // Sadece salonlar seçilmişse (şube yok)
    if (finalOfficeIds.length === 0 && finalSalonIds.length > 0) {
      for (const sId of finalSalonIds) {
        const timeSlot = await prisma.programSaatSlotlar_.create({
          data: {
            id: `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name,
            slug: `${baseSlug}-${sId}`,
            description: description || null,
            startTime,
            endTime,
            officeId: null,
            salonId: sId,
            capacity: capacity ? parseInt(String(capacity)) : null,
            sortOrder: sortOrder || 0,
            isActive: isActive !== undefined ? isActive : true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        createdSlots.push(timeSlot);
      }
    }

    // İlk oluşturulan kaydı döndür (backward compatibility)
    return NextResponse.json(createdSlots[0] || createdSlots);
  } catch (error) {
    console.error('Error creating time slot:', error);
    return NextResponse.json(
      { error: 'Zaman dilimi oluşturulamadı' },
      { status: 500 }
    );
  }
}

// Zaman dilimi güncelle
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, slug, description, startTime, endTime, officeId, officeIds, salonId, salonIds, capacity, sortOrder, isActive } = body;

    if (!id || !name || !startTime || !endTime) {
      return NextResponse.json(
        { error: 'ID, ad, başlangıç saati ve bitiş saati zorunludur' },
        { status: 400 }
      );
    }

    // Çoklu şube ve salon desteği
    const finalOfficeIds = officeIds || (officeId ? [officeId] : []);
    const finalSalonIds = salonIds || (salonId ? [salonId] : []);

    // Eğer çoklu şube/salon varsa, mevcut kaydı sil ve yeni kayıtlar oluştur
    if (finalOfficeIds.length > 1 || finalSalonIds.length > 1 || (finalOfficeIds.length > 0 && finalSalonIds.length > 0)) {
      // Mevcut kaydı sil
      await prisma.programSaatSlotlar_.delete({
        where: { id },
      });

      // Her şube/salon kombinasyonu için yeni kayıt oluştur
      const createdSlots = [];
      const baseSlug = slug || name.toLowerCase().replace(/\s+/g, '-');

      for (const oId of finalOfficeIds) {
        if (finalSalonIds.length > 0) {
          for (const sId of finalSalonIds) {
            const timeSlot = await prisma.programSaatSlotlar_.create({
              data: {
                id: `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                name,
                slug: `${baseSlug}-${oId}-${sId}`,
                description: description || null,
                startTime,
                endTime,
                officeId: oId,
                salonId: sId,
                capacity: capacity ? parseInt(String(capacity)) : null,
                sortOrder: sortOrder || 0,
                isActive: isActive !== undefined ? isActive : true,
                createdAt: new Date(),
                updatedAt: new Date(),
              },
            });
            createdSlots.push(timeSlot);
          }
        } else {
          const timeSlot = await prisma.programSaatSlotlar_.create({
            data: {
              id: `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name,
              slug: `${baseSlug}-${oId}`,
              description: description || null,
              startTime,
              endTime,
              officeId: oId,
              salonId: null,
              capacity: capacity ? parseInt(String(capacity)) : null,
              sortOrder: sortOrder || 0,
              isActive: isActive !== undefined ? isActive : true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          createdSlots.push(timeSlot);
        }
      }

      // Sadece salonlar seçilmişse (şube yok)
      if (finalOfficeIds.length === 0 && finalSalonIds.length > 0) {
        for (const sId of finalSalonIds) {
          const timeSlot = await prisma.programSaatSlotlar_.create({
            data: {
              id: `timeslot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name,
              slug: `${baseSlug}-${sId}`,
              description: description || null,
              startTime,
              endTime,
              officeId: null,
              salonId: sId,
              capacity: capacity ? parseInt(String(capacity)) : null,
              sortOrder: sortOrder || 0,
              isActive: isActive !== undefined ? isActive : true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          });
          createdSlots.push(timeSlot);
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Zaman dilimi başarıyla güncellendi',
        slot: createdSlots[0],
        slots: createdSlots,
      });
    } else {
      // Tek şube/salon varsa, mevcut kaydı güncelle
      const primaryOfficeId = finalOfficeIds.length > 0 ? finalOfficeIds[0] : null;
      const primarySalonId = finalSalonIds.length > 0 ? finalSalonIds[0] : null;

      const timeSlot = await prisma.programSaatSlotlar_.update({
        where: { id },
        data: {
          name,
          slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
          description: description || null,
          startTime,
          endTime,
          officeId: primaryOfficeId,
          salonId: primarySalonId,
          capacity: capacity ? parseInt(String(capacity)) : null,
          sortOrder: sortOrder || 0,
          isActive: isActive !== undefined ? isActive : true,
          updatedAt: new Date(),
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Zaman dilimi başarıyla güncellendi',
        slot: timeSlot,
        officeIds: finalOfficeIds,
        salonIds: finalSalonIds,
      });
    }
  } catch (error) {
    console.error('Error updating time slot:', error);
    return NextResponse.json(
      { error: 'Zaman dilimi güncellenemedi', message: error instanceof Error ? error.message : 'Bilinmeyen hata' },
      { status: 500 }
    );
  }
}

// Zaman dilimi sil
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID gerekli' },
        { status: 400 }
      );
    }

    await prisma.programSaatSlotlar_.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting time slot:', error);
    return NextResponse.json(
      { error: 'Zaman dilimi silinemedi' },
      { status: 500 }
    );
  }
}

