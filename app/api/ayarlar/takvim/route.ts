import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

// Auth kontrolü
function checkAuth(cookie: string | undefined): boolean {
  return /(?:^|;\s*)eventra_auth=1(?:;|$)/.test(cookie || '');
}

// Takvim ayarlarını getir
export async function GET(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const settings = await prisma.calendarSettings.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (settings) {
      return NextResponse.json({ settings });
    }

    // Varsayılan ayarları döndür
    return NextResponse.json({
      settings: {
        defaultView: 'month',
        weekStartDay: 'monday',
        showWeekends: true,
        businessHoursStart: '09:00',
        businessHoursEnd: '18:00',
        slotDuration: 30,
        slotLabelInterval: 60,
        firstDayOfWeek: 1,
        showTimeSlots: true,
        defaultDateRange: 30,
      },
    });
  } catch (error: any) {
    console.error('Calendar settings GET error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Takvim ayarlarını kaydet/güncelle
export async function POST(request: NextRequest) {
  try {
    const cookieHeader = request.headers.get('cookie') || '';
    
    if (!checkAuth(cookieHeader)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      defaultView,
      weekStartDay,
      showWeekends,
      businessHoursStart,
      businessHoursEnd,
      slotDuration,
      slotLabelInterval,
      firstDayOfWeek,
      showTimeSlots,
      defaultDateRange,
    } = body;

    const existing = await prisma.calendarSettings.findFirst();

    let settings;
    if (existing) {
      settings = await prisma.calendarSettings.update({
        where: { id: existing.id },
        data: {
          defaultView: defaultView || 'month',
          weekStartDay: weekStartDay || 'monday',
          showWeekends: showWeekends !== undefined ? showWeekends : true,
          businessHoursStart: businessHoursStart || '09:00',
          businessHoursEnd: businessHoursEnd || '18:00',
          slotDuration: slotDuration || 30,
          slotLabelInterval: slotLabelInterval || 60,
          firstDayOfWeek: firstDayOfWeek || 1,
          showTimeSlots: showTimeSlots !== undefined ? showTimeSlots : true,
          defaultDateRange: defaultDateRange || 30,
          updatedAt: new Date(),
        },
      });
    } else {
      settings = await prisma.calendarSettings.create({
        data: {
          defaultView: defaultView || 'month',
          weekStartDay: weekStartDay || 'monday',
          showWeekends: showWeekends !== undefined ? showWeekends : true,
          businessHoursStart: businessHoursStart || '09:00',
          businessHoursEnd: businessHoursEnd || '18:00',
          slotDuration: slotDuration || 30,
          slotLabelInterval: slotLabelInterval || 60,
          firstDayOfWeek: firstDayOfWeek || 1,
          showTimeSlots: showTimeSlots !== undefined ? showTimeSlots : true,
          defaultDateRange: defaultDateRange || 30,
        },
      });
    }

    return NextResponse.json({
      success: true,
      settings,
      message: 'Takvim ayarları başarıyla kaydedildi',
    });
  } catch (error: any) {
    console.error('Calendar settings POST error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

