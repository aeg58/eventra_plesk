import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    // Cookie'yi sil
    const cookieStore = await cookies();
    cookieStore.delete('eventra_auth');

    return NextResponse.json({ success: true, message: 'Çıkış başarılı' });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: 'Bir hata oluştu' },
      { status: 500 }
    );
  }
}

