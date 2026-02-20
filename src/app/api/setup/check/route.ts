import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

// هذه النقطة للتحقق من حالة قاعدة البيانات
// استدعها: /api/setup/check

export async function GET() {
  try {
    // محاولة الاتصال والتحقق من الجداول
    const userCount = await db.user.count().catch(() => -1)
    const provinceCount = await db.province.count().catch(() => -1)
    const feeTypeCount = await db.feeType.count().catch(() => -1)

    const tablesExist = userCount >= 0

    return NextResponse.json({
      status: tablesExist ? 'connected' : 'tables_missing',
      message: tablesExist 
        ? 'قاعدة البيانات متصلة والجداول موجودة'
        : 'قاعدة البيانات متصلة لكن الجداول غير موجودة',
      counts: tablesExist ? {
        users: userCount,
        provinces: provinceCount,
        feeTypes: feeTypeCount
      } : null,
      action: tablesExist 
        ? (userCount > 0 ? 'ready' : 'run_setup')
        : 'run_migrate'
    })

  } catch (error: unknown) {
    return NextResponse.json({
      status: 'error',
      message: 'فشل الاتصال بقاعدة البيانات',
      error: error instanceof Error ? error.message : 'Unknown error',
      action: 'check_env_vars'
    }, { status: 500 })
  }
}
