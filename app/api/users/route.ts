import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { validateAuth } from '@/app/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = request.headers.get('cookie') || '';
    
    // Auth kontrolü (güvenli: sadece DISABLE_AUTH=true olduğunda bypass edilir)
    const authError = validateAuth(cookieHeader);
    if (authError) {
      return NextResponse.json(
        { error: authError.error, message: authError.message },
        { status: authError.status }
      );
    }

    // Veritabanından kullanıcıları çek
    const users = await prisma.kullan_c_lar.findMany({
      include: {
        Roller: true,
        Ofisler: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`[Users API] ${users.length} kullanıcı bulundu`);

    // Frontend'e uygun formata dönüştür
    const formattedUsers = users.map((user) => {
      // Roller array'ini oluştur
      let rolesArray: string[] = [];
      if (user.Roller) {
        rolesArray = [user.Roller.name];
      } else if (user.role) {
        rolesArray = [user.role];
      }
      
      return {
        id: user.id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email.split('@')[0],
        email: user.email,
        phone: user.phone || '',
        username: user.username || user.email.split('@')[0],
        roles: rolesArray,
        lastLogin: user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString('tr-TR') : '-',
        createdAt: user.createdAt ? new Date(user.createdAt).toLocaleDateString('tr-TR') : '-',
        status: user.isActive ? 'Aktif' : 'Pasif',
      };
    });

    return NextResponse.json({ users: formattedUsers });
  } catch (error: any) {
    console.error('Users API error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

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
    const { name, email, phone, username, roles, aktif, rastgeleSifre, password } = body;

    // Şifre belirleme mantığı
    let plainPassword = '';
    
    if (rastgeleSifre) {
      // Rastgele şifre oluştur
      const generateRandomPassword = () => {
        const length = 12;
        const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
        let pwd = '';
        for (let i = 0; i < length; i++) {
          pwd += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        return pwd;
      };
      plainPassword = generateRandomPassword();
    } else if (password && password.trim()) {
      // Manuel girilen şifre
      plainPassword = password.trim();
      if (plainPassword.length < 6) {
        return NextResponse.json(
          { error: 'Şifre en az 6 karakter olmalıdır' },
          { status: 400 }
        );
      }
    } else {
      // Varsayılan şifre
      plainPassword = 'temp_password123';
    }

    const passwordHash = await bcrypt.hash(plainPassword, 10);
    
    // Roller array'inden ilk rolü al (veya boşsa null)
    let roleId = null;
    let roleName = 'user';
    
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // İlk rolü al
      const firstRole = roles[0];
      roleName = firstRole;
      
      // Roller tablosundan rol ID'sini bul
      const roleRecord = await prisma.roller.findUnique({
        where: { name: firstRole },
      });
      
      if (roleRecord) {
        roleId = roleRecord.id;
      } else {
        // Rol yoksa oluştur
        const newRole = await prisma.roller.create({
          data: {
            id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: firstRole,
            isActive: true,
          },
        });
        roleId = newRole.id;
      }
    }
    
    const newUser = await prisma.kullan_c_lar.create({
      data: {
        id: `user_${Date.now()}`,
        name: name || email.split('@')[0],
        email,
        phone: phone || null,
        username: username || email.split('@')[0],
        passwordHash: passwordHash,
        isActive: aktif !== false,
        roleId: roleId,
        role: roleName,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: newUser,
      password: rastgeleSifre ? plainPassword : null, // Sadece rastgele şifre oluşturulduysa döndür
      message: 'Kullanıcı başarıyla oluşturuldu' 
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

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
    const { id, name, email, phone, username, roles, aktif, newPassword } = body;

    // Roller array'inden ilk rolü al (veya boşsa null)
    let roleId = null;
    let roleName = 'user';
    
    if (roles && Array.isArray(roles) && roles.length > 0) {
      // İlk rolü al
      const firstRole = roles[0];
      roleName = firstRole;
      
      // Roller tablosundan rol ID'sini bul
      const roleRecord = await prisma.roller.findUnique({
        where: { name: firstRole },
      });
      
      if (roleRecord) {
        roleId = roleRecord.id;
      } else {
        // Rol yoksa oluştur
        const newRole = await prisma.roller.create({
          data: {
            id: `role_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            name: firstRole,
            isActive: true,
          },
        });
        roleId = newRole.id;
      }
    }

    // Güncelleme verilerini hazırla
    const updateData: any = {
      name: name || email.split('@')[0],
      email,
      phone: phone || null,
      username: username || email.split('@')[0],
      isActive: aktif !== false,
      roleId: roleId,
      role: roleName,
      updatedAt: new Date(),
    };

    // Şifre güncelleniyorsa hash'le
    if (newPassword) {
      updateData.passwordHash = await bcrypt.hash(newPassword, 10);
    }

    // Kullanıcıyı güncelle
    const updatedUser = await prisma.kullan_c_lar.update({
      where: { id: String(id) },
      data: updateData,
      include: {
        Roller: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: updatedUser,
      message: 'Kullanıcı başarıyla güncellendi' 
    });
  } catch (error: any) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

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
        { error: 'Kullanıcı ID gereklidir' },
        { status: 400 }
      );
    }

    // Kullanıcıyı sil
    await prisma.kullan_c_lar.delete({
      where: { id: String(id) },
    });

    return NextResponse.json({ 
      success: true,
      message: 'Kullanıcı başarıyla silindi' 
    });
  } catch (error: any) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { error: 'Bir hata oluştu', message: error.message },
      { status: 500 }
    );
  }
}

