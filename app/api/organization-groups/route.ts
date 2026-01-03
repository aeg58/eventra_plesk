import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const groups = await prisma.organizasyonGrup.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
      },
    });

    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching organization groups:', error);
    return NextResponse.json(
      { error: 'Organizasyon grupları getirilemedi' },
      { status: 500 }
    );
  }
}

