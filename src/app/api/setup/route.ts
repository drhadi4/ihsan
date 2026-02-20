import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

// هذه النقطة تقوم بتهيئة قاعدة البيانات بالمستخدمين والبيانات الأساسية
// استدعها مرة واحدة فقط: /api/setup

export async function GET() {
  try {
    // التحقق من وجود مستخدمين
    const existingUsers = await db.user.count()
    if (existingUsers > 0) {
      return NextResponse.json({ 
        message: 'قاعدة البيانات تحتوي بالفعل على بيانات',
        usersCount: existingUsers 
      })
    }

    // إنشاء المحافظات
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
      await db.province.create({ data: province })
    }

    // إنشاء أنواع الرسوم
    const feeTypes = [
      { name: 'رسوم تأثيث - مستشفى عام/تخصصي', code: 'FURNISH_HOSPITAL', amount: 100000, description: 'رسوم تأثيث للمستشفى العام والتخصصي' },
      { name: 'رسوم تأثيث - منشآت أخرى', code: 'FURNISH_OTHER', amount: 60000, description: 'رسوم تأثيث للمستوصف والمركز التشخيصي والمختبر وعيادة الأسنان والعيادة' },
      { name: 'رسوم تشغيل - مستشفى عام/تخصصي', code: 'OPERATE_HOSPITAL', amount: 2000000, description: 'رسوم تشغيل للمستشفى العام والتخصصي' },
      { name: 'رسوم تشغيل - مركز تشخيصي', code: 'OPERATE_DIAGNOSTIC', amount: 100000, description: 'رسوم تشغيل للمركز التشخيصي' },
      { name: 'رسوم تشغيل - منشآت أخرى', code: 'OPERATE_OTHER', amount: 50000, description: 'رسوم تشغيل للمستوصف والمختبر والعيادة وعيادة الأسنان والمركز التخصصي' },
      { name: 'رسوم تجديد - مستشفى عام/تخصصي', code: 'RENEW_HOSPITAL', amount: 2600000, description: 'رسوم تجديد للمستشفى العام والتخصصي (تشغيل + 30%)' },
      { name: 'رسوم تجديد - مركز تشخيصي', code: 'RENEW_DIAGNOSTIC', amount: 130000, description: 'رسوم تجديد للمركز التشخيصي (تشغيل + 30%)' },
      { name: 'رسوم تجديد - منشآت أخرى', code: 'RENEW_OTHER', amount: 65000, description: 'رسوم تجديد للمستوصف والمختبر والعيادة وعيادة الأسنان والمركز التخصصي (تشغيل + 30%)' },
      { name: 'رسوم معاينة', code: 'INSPECT_FEE', amount: 20000, description: 'رسوم معاينة الموقع' },
      { name: 'رسوم إصدار الترخيص', code: 'LICENSE_FEE', amount: 15000, description: 'رسوم إصدار الترخيص النهائي' },
    ]

    for (const fee of feeTypes) {
      await db.feeType.create({ data: fee })
    }

    // الحصول على أول محافظة
    const firstProvince = await db.province.findFirst()

    // كلمة المرور المشفرة
    const hashedPassword = await hashPassword('123456')

    // إنشاء المستخدمين
    const users = [
      {
        name: 'عميل تجريبي',
        email: 'client@ihsan.gov.ye',
        phone: '777123456',
        password: hashedPassword,
        role: 'CLIENT' as const,
        provinceId: null,
      },
      {
        name: 'مدير فرع الأمانة',
        email: 'branch@ihsan.gov.ye',
        phone: '777234567',
        password: hashedPassword,
        role: 'BRANCH_MANAGER' as const,
        provinceId: firstProvince?.id || null,
      },
      {
        name: 'مدير المنشآت الصحية',
        email: 'facilities@ihsan.gov.ye',
        phone: '777345678',
        password: hashedPassword,
        role: 'FACILITIES_MGR' as const,
        provinceId: null,
      },
      {
        name: 'مدير المراجعة والتراخيص',
        email: 'review@ihsan.gov.ye',
        phone: '777456789',
        password: hashedPassword,
        role: 'REVIEW_MGR' as const,
        provinceId: null,
      },
      {
        name: 'مدير الإدارة العامة',
        email: 'general@ihsan.gov.ye',
        phone: '777567890',
        password: hashedPassword,
        role: 'GENERAL_MGR' as const,
        provinceId: null,
      },
      {
        name: 'وكيل الوزارة',
        email: 'deputy@ihsan.gov.ye',
        phone: '777678901',
        password: hashedPassword,
        role: 'DEPUTY_MINISTER' as const,
        provinceId: null,
      },
    ]

    for (const user of users) {
      await db.user.create({ data: user })
    }

    // إنشاء إعدادات النظام
    const settings = [
      { key: 'system_name', value: 'نظام الخدمات الطبية إحسان', description: 'اسم النظام' },
      { key: 'organization_name', value: 'وزارة الصحة والبيئة', description: 'اسم الجهة' },
      { key: 'department_name', value: 'الإدارة العامة للمنشآت الصحية الخاصة', description: 'اسم الإدارة' },
      { key: 'currency', value: 'ريال يمني', description: 'العملة' },
      { key: 'license_validity_years', value: '1', description: 'مدة صلاحية الترخيص بالسنوات' },
    ]

    for (const setting of settings) {
      await db.systemSetting.create({ data: setting })
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم تهيئة قاعدة البيانات بنجاح!',
      data: {
        provinces: provinces.length,
        feeTypes: feeTypes.length,
        users: users.length,
        settings: settings.length,
        loginCredentials: {
          client: 'client@ihsan.gov.ye / 123456',
          branch: 'branch@ihsan.gov.ye / 123456',
          facilities: 'facilities@ihsan.gov.ye / 123456',
          review: 'review@ihsan.gov.ye / 123456',
          general: 'general@ihsan.gov.ye / 123456',
          deputy: 'deputy@ihsan.gov.ye / 123456',
        }
      }
    })

  } catch (error: unknown) {
    console.error('Setup error:', error)
    return NextResponse.json({ 
      error: 'حدث خطأ أثناء تهيئة قاعدة البيانات',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
