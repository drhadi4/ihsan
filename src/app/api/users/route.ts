import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { Role } from '@prisma/client'

export async function GET() {
  try {
    const user = await getSession()
    
    if (!user || user.role !== Role.GENERAL_MGR) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const users = await db.user.findMany({
      include: {
        province: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ users })
  } catch (error) {
    console.error('Get users error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المستخدمين' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    
    if (!user || user.role !== Role.GENERAL_MGR) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, email, phone, password, role, provinceId, isActive } = body

    if (!name || !email || !phone || !password || !role) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // Check if email exists
    const existingUser = await db.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني مستخدم بالفعل' },
        { status: 400 }
      )
    }

    // Hash password
    const encoder = new TextEncoder()
    const data = encoder.encode(password + 'ihsan_salt_2024')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    const hashedPassword = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

    const newUser = await db.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: role as Role,
        provinceId: provinceId || null,
        isActive: isActive ?? true,
      },
      include: {
        province: true,
      },
    })

    return NextResponse.json({ user: newUser })
  } catch (error) {
    console.error('Create user error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء المستخدم' },
      { status: 500 }
    )
  }
}
