import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import { validateAuth } from '@/app/lib/auth';

export const dynamic = 'force-dynamic';

// Tüm rollerleri getir
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

    const roles = await prisma.roller.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description || '',
      isDefault: role.isDefault || false,
      isActive: role.isActive !== false,
      createdAt: role.createdAt ? new Date(role.createdAt).toLocaleDateString('tr-TR') : '-',
      permissions: {}, // İleride Izinler tablosu ile entegre edilebilir
    }));

    return NextResponse.json({ roles: formattedRoles });
  } catch (error: any) {
    console.error('Roles API error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Yeni rol oluştur
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
    const { name, description, isDefault, isActive, permissions } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'Rol adı gerekli' },
        { status: 400 }
      );
    }

    const newRole = await prisma.roller.create({
      data: {
        id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name,
        description: description || null,
        isDefault: isDefault || false,
        isActive: isActive !== false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // Permissions şimdilik JSON olarak description'a eklenebilir veya ayrı bir alan olarak saklanabilir
    // İleride Izinler tablosu ile entegre edilebilir

    return NextResponse.json({
      success: true,
      role: newRole,
      message: 'Rol başarıyla oluşturuldu',
    });
  } catch (error: any) {
    console.error('Create role error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Rol güncelle
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

    const body = await request.json();
    const { id, name, description, isDefault, isActive, permissions } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: 'ID ve rol adı gerekli' },
        { status: 400 }
      );
    }

    const updatedRole = await prisma.roller.update({
      where: { id: String(id) },
      data: {
        name,
        description: description || null,
        isDefault: isDefault || false,
        isActive: isActive !== false,
        updatedAt: new Date(),
      },
    });

    // Permissions şimdilik JSON olarak saklanabilir

    return NextResponse.json({
      success: true,
      role: updatedRole,
      message: 'Rol başarıyla güncellendi',
    });
  } catch (error: any) {
    console.error('Update role error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

// Rol sil
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
        { error: 'ID gerekli' },
        { status: 400 }
      );
    }

    await prisma.roller.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Rol başarıyla silindi' });
  } catch (error: any) {
    console.error('Delete role error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

