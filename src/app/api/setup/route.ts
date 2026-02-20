import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// هذه النقطة تقوم بكل شيء: إنشاء الجداول + البيانات
// استدعها: /api/setup

export async function GET() {
  try {
    // === الخطوة 1: إنشاء الجداول ===
    
    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Province" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL UNIQUE,
      "code" TEXT NOT NULL UNIQUE,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {})

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "email" TEXT NOT NULL UNIQUE,
      "phone" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'CLIENT',
      "provinceId" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {})

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "FeeType" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "name" TEXT NOT NULL,
      "code" TEXT NOT NULL UNIQUE,
      "amount" DECIMAL(10,2) NOT NULL,
      "description" TEXT,
      "isActive" BOOLEAN NOT NULL DEFAULT true,
      "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {})

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "Request" (
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
    )`).catch(() => {})

    await db.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "SystemSetting" (
      "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
      "key" TEXT NOT NULL UNIQUE,
      "value" TEXT NOT NULL,
      "description" TEXT,
      "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )`).catch(() => {})

    // === الخطوة 2: التحقق من وجود مستخدمين ===
    const existingUsers = await db.user.count().catch(() => 0)
    
    if (existingUsers > 0) {
      return NextResponse.json({ 
        success: true,
        message: 'النظام جاهز للاستخدام!',
        usersCount: existingUsers,
        loginCredentials: {
          client: 'client@ihsan.gov.ye / 123456',
          branch: 'branch@ihsan.gov.ye / 123456',
          facilities: 'facilities@ihsan.gov.ye / 123456',
          review: 'review@ihsan.gov.ye / 123456',
          general: 'general@ihsan.gov.ye / 123456',
          deputy: 'deputy@ihsan.gov.ye / 123456',
        }
      })
    }

    // === الخطوة 3: إنشاء المحافظات ===
    const provinces = [
      { name: 'الأمانة', code: 'AMN' },
      { name: 'صنعاء', code: 'SNA' },
      { name: 'عمران', code: 'AMR' },
      { name: 'صعدة', code: 'SAD' },
      { name: 'حجة', code: 'HAJ' },
      { name: 'الحديدة', code: 'HOD' },
      { name: 'تعز', code: 'TAZ' },
      { name: 'ذمار', code: 'DHA' },
      { name: 'إب', code: 'IBB' },
      { name: 'الضالع', code: 'DAL' },
      { name: 'لحج', code: 'LAH' },
      { name: 'البيضاء', code: 'BAY' },
      { name: 'ريمة', code: 'RIM' },
      { name: 'مأرب', code: 'MAR' },
      { name: 'الجوف', code: 'JAW' },
    ]

    for (const province of provinces) {
      await db.province.create({ data: province }).catch(() => {})
    }

    // === الخطوة 4: إنشاء أنواع الرسوم ===
    const feeTypes = [
      { name: 'رسوم تأثيث - مستشفى', code: 'FURNISH_HOSPITAL', amount: 100000 },
      { name: 'رسوم تأثيث - أخرى', code: 'FURNISH_OTHER', amount: 60000 },
      { name: 'رسوم تشغيل - مستشفى', code: 'OPERATE_HOSPITAL', amount: 2000000 },
      { name: 'رسوم تشغيل - مركز تشخيصي', code: 'OPERATE_DIAGNOSTIC', amount: 100000 },
      { name: 'رسوم تشغيل - أخرى', code: 'OPERATE_OTHER', amount: 50000 },
    ]

    for (const fee of feeTypes) {
      await db.feeType.create({ data: fee }).catch(() => {})
    }

    // === الخطوة 5: إنشاء المستخدمين ===
    // كلمة المرور المشفرة (123456)
    const encoder = new TextEncoder()
    const data = encoder.encode('123456' + 'ihsan_salt_2024')
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashedPassword = Array.from(new Uint8Array(hashBuffer))
      .map(b => b.toString(16).padStart(2, '0')).join('')

    const firstProvince = await db.province.findFirst()

    const users = [
      { name: 'عميل تجريبي', email: 'client@ihsan.gov.ye', phone: '777123456', password: hashedPassword, role: 'CLIENT', provinceId: null },
      { name: 'مدير فرع الأمانة', email: 'branch@ihsan.gov.ye', phone: '777234567', password: hashedPassword, role: 'BRANCH_MANAGER', provinceId: firstProvince?.id || null },
      { name: 'مدير المنشآت الصحية', email: 'facilities@ihsan.gov.ye', phone: '777345678', password: hashedPassword, role: 'FACILITIES_MGR', provinceId: null },
      { name: 'مدير المراجعة والتراخيص', email: 'review@ihsan.gov.ye', phone: '777456789', password: hashedPassword, role: 'REVIEW_MGR', provinceId: null },
      { name: 'مدير الإدارة العامة', email: 'general@ihsan.gov.ye', phone: '777567890', password: hashedPassword, role: 'GENERAL_MGR', provinceId: null },
      { name: 'وكيل الوزارة', email: 'deputy@ihsan.gov.ye', phone: '777678901', password: hashedPassword, role: 'DEPUTY_MINISTER', provinceId: null },
    ]

    for (const user of users) {
      await db.user.create({ data: user }).catch(() => {})
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم تهيئة النظام بنجاح! يمكنك الآن تسجيل الدخول.',
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
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
