
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'


export async function GET() {
  try {
    // إنشاء جدول المحافظات
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Province" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL UNIQUE,
        "code" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})


    // إنشاء جدول المستخدمين
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "email" TEXT NOT NULL UNIQUE,
        "phone" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'CLIENT',
        "provinceId" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})


    // إنشاء جدول أنواع الرسوم
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "FeeType" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "code" TEXT NOT NULL UNIQUE,
        "amount" DECIMAL(10,2) NOT NULL,
        "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})


    // إنشاء جدول الطلبات
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Request" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestNumber" TEXT NOT NULL UNIQUE,
        "type" TEXT NOT NULL,
        "facilityName" TEXT NOT NULL,
        "facilityType" TEXT NOT NULL,
        "ownerName" TEXT NOT NULL,
        "ownerPhone" TEXT NOT NULL,
        "ownerEmail" TEXT,
        "ownerAddress" TEXT,
        "facilityAddress" TEXT NOT NULL,
        "provinceId" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING_BRANCH',
        "currentLevel" TEXT NOT NULL DEFAULT 'BRANCH',
        "branchApproved" BOOLEAN NOT NULL DEFAULT false,
        "facilitiesApproved" BOOLEAN NOT NULL DEFAULT false,
        "reviewApproved" BOOLEAN NOT NULL DEFAULT false,
        "deputyApproved" BOOLEAN NOT NULL DEFAULT false,
        "receiptNumber" TEXT,
        "receiptAmount" DECIMAL(10,2),
        "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
        "licenseNumber" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `).catch(() => {})


    // التحقق من وجود مستخدمين
    const existingUsers = await db.user.count().catch(() => 0)
    
    if (existingUsers > 0) {
      return NextResponse.json({ 
        success: true,
        message: 'النظام جاهز!',
        loginCredentials: {
          client: 'client@ihsan.gov.ye / 123456',
          deputy: 'deputy@ihsan.gov.ye / 123456',
        }
      })
    }


    // إنشاء المحافظات
    const provinces = [
      { name: 'الأمانة', code: 'AMN' },
      { name: 'صنعاء', code: 'SNA' },
      { name: 'تعز', code: 'TAZ' },
    ]
    for (const p of provinces) {
      await db.province.create({ data: p }).catch(() => {})
    }


    // كلمة المرور المشفرة
    const encoder = new TextEncoder()
    const hashData = encoder.encode('123456' + 'ihsan_salt_2024')
    const hashBuffer = await crypto.subtle.digest('SHA-256', hashData)
    const hashedPassword = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('')


    const firstProvince = await db.province.findFirst()


    // إنشاء المستخدمين
    const users = [
      { name: 'عميل', email: 'client@ihsan.gov.ye', phone: '777123456', password: hashedPassword, role: 'CLIENT', provinceId: null },
      { name: 'مدير فرع', email: 'branch@ihsan.gov.ye', phone: '777234567', password: hashedPassword, role: 'BRANCH_MANAGER', provinceId: firstProvince?.id || null },
      { name: 'مدير المنشآت', email: 'facilities@ihsan.gov.ye', phone: '777345678', password: hashedPassword, role: 'FACILITIES_MGR', provinceId: null },
      { name: 'مدير المراجعة', email: 'review@ihsan.gov.ye', phone: '777456789', password: hashedPassword, role: 'REVIEW_MGR', provinceId: null },
      { name: 'مدير الإدارة', email: 'general@ihsan.gov.ye', phone: '777567890', password: hashedPassword, role: 'GENERAL_MGR', provinceId: null },
      { name: 'وكيل الوزارة', email: 'deputy@ihsan.gov.ye', phone: '777678901', password: hashedPassword, role: 'DEPUTY_MINISTER', provinceId: null },
    ]


    for (const u of users) {
      await db.user.create({ data: u }).catch(() => {})
    }


    return NextResponse.json({ 
      success: true,
      message: 'تم تهيئة النظام بنجاح!',
      loginCredentials: {
        client: 'client@ihsan.gov.ye / 123456',
        branch: 'branch@ihsan.gov.ye / 123456',
        facilities: 'facilities@ihsan.gov.ye / 123456',
        review: 'review@ihsan.gov.ye / 123456',
        general: 'general@ihsan.gov.ye / 123456',
        deputy: 'deputy@ihsan.gov.ye / 123456',
      }
    })


  } catch (error: unknown) {
    return NextResponse.json({ 
      error: 'حدث خطأ',
      details: error instanceof Error ? error.message : 'Unknown'
    }, { status: 500 })
  }
}
