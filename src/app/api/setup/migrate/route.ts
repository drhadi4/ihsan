import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// هذه النقطة تنشئ جداول قاعدة البيانات
// استدعها مرة واحدة: /api/setup/migrate

export async function GET() {
  try {
    // إنشاء الجداول باستخدام SQL مباشر
    
    // جدول المحافظات
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Province" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL UNIQUE,
        "code" TEXT NOT NULL UNIQUE,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // جدول المستخدمين
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
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE SET NULL
      )
    `)

    // جدول أنواع الرسوم
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
    `)

    // جدول الطلبات
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
        "branchApprovedBy" TEXT,
        "branchApprovedAt" TIMESTAMP(3),
        "branchNotes" TEXT,
        "facilitiesApproved" BOOLEAN NOT NULL DEFAULT false,
        "facilitiesApprovedBy" TEXT,
        "facilitiesApprovedAt" TIMESTAMP(3),
        "facilitiesNotes" TEXT,
        "reviewApproved" BOOLEAN NOT NULL DEFAULT false,
        "reviewApprovedBy" TEXT,
        "reviewApprovedAt" TIMESTAMP(3),
        "reviewNotes" TEXT,
        "deputyApproved" BOOLEAN NOT NULL DEFAULT false,
        "deputyApprovedBy" TEXT,
        "deputyApprovedAt" TIMESTAMP(3),
        "deputyNotes" TEXT,
        "receiptNumber" TEXT,
        "receiptAmount" DECIMAL(10,2),
        "receiptIssuedAt" TIMESTAMP(3),
        "receiptIssuedBy" TEXT,
        "paymentReference" TEXT,
        "paymentVerified" BOOLEAN NOT NULL DEFAULT false,
        "paymentVerifiedBy" TEXT,
        "paidAt" TIMESTAMP(3),
        "licenseNumber" TEXT,
        "licenseIssuedAt" TIMESTAMP(3),
        "licenseIssuedBy" TEXT,
        "licenseExpiryDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("provinceId") REFERENCES "Province"("id"),
        FOREIGN KEY ("userId") REFERENCES "User"("id")
      )
    `)

    // جدول المرفقات
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Attachment" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestId" TEXT NOT NULL,
        "documentType" TEXT NOT NULL,
        "documentName" TEXT NOT NULL,
        "fileName" TEXT NOT NULL,
        "filePath" TEXT NOT NULL,
        "fileSize" INTEGER,
        "mimeType" TEXT,
        "isVerified" BOOLEAN NOT NULL DEFAULT false,
        "verifiedBy" TEXT,
        "verifiedAt" TIMESTAMP(3),
        "notes" TEXT,
        "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE
      )
    `)

    // جدول رسوم الطلبات
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "RequestFee" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestId" TEXT NOT NULL,
        "feeTypeId" TEXT NOT NULL,
        "amount" DECIMAL(10,2) NOT NULL,
        "isPaid" BOOLEAN NOT NULL DEFAULT false,
        "paidAt" TIMESTAMP(3),
        FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE,
        FOREIGN KEY ("feeTypeId") REFERENCES "FeeType"("id")
      )
    `)

    // جدول سجل الإجراءات
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "ActionLog" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "requestId" TEXT NOT NULL,
        "action" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "userId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("requestId") REFERENCES "Request"("id") ON DELETE CASCADE,
        FOREIGN KEY ("userId") REFERENCES "User"("id")
      )
    `)

    // جدول الإشعارات
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Notification" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "userId" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "message" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "requestId" TEXT,
        "isRead" BOOLEAN NOT NULL DEFAULT false,
        "sentViaSms" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE
      )
    `)

    // جدول إعدادات النظام
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "SystemSetting" (
        "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
        "key" TEXT NOT NULL UNIQUE,
        "value" TEXT NOT NULL,
        "description" TEXT,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // إنشاء الفهارس
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Attachment_requestId_idx" ON "Attachment"("requestId")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "RequestFee_requestId_idx" ON "RequestFee"("requestId")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "ActionLog_requestId_idx" ON "ActionLog"("requestId")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")`)
    await db.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "Notification_requestId_idx" ON "Notification"("requestId")`)

    return NextResponse.json({
      success: true,
      message: 'تم إنشاء جميع جداول قاعدة البيانات بنجاح!',
      next_step: 'الآن افتح: /api/setup لإنشاء البيانات الأساسية'
    })

  } catch (error: unknown) {
    console.error('Migration error:', error)
    return NextResponse.json({
      success: false,
      error: 'حدث خطأ أثناء إنشاء الجداول',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
