import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../src/lib/auth'

const prisma = new PrismaClient()

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

// أنواع الرسوم مع الأسعار المحددة لكل نوع منشأة
// التأثيث: 100,000 للمستشفى العام والتخصصي، 60,000 للباقي
// التشغيل: 2,000,000 للمستشفى العام والتخصصي، 100,000 للمركز التشخيصي، 50,000 للباقي
// التجديد: يزيد على رسوم التشغيل بـ 30%
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

async function main() {
  console.log('🌱 بدء تهيئة البيانات...')

  // إنشاء المحافظات
  console.log('📍 إنشاء المحافظات...')
  for (const province of provinces) {
    await prisma.province.upsert({
      where: { code: province.code },
      update: {},
      create: province,
    })
  }
  console.log('✅ تم إنشاء 15 محافظة')

  // إنشاء أنواع الرسوم
  console.log('💰 إنشاء أنواع الرسوم...')
  for (const fee of feeTypes) {
    await prisma.feeType.upsert({
      where: { code: fee.code },
      update: { name: fee.name, amount: fee.amount, description: fee.description },
      create: fee,
    })
  }
  console.log('✅ تم إنشاء أنواع الرسوم')

  // الحصول على المحافظات
  const allProvinces = await prisma.province.findMany()
  const firstProvince = allProvinces[0]

  // إنشاء المستخدمين التجريبيين
  console.log('👥 إنشاء المستخدمين التجريبيين...')
  const hashedPassword = await hashPassword('123456')

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
      provinceId: firstProvince.id,
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
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    })
  }
  console.log('✅ تم إنشاء 6 مستخدمين تجريبيين')

  // إنشاء إعدادات النظام
  console.log('⚙️ إنشاء إعدادات النظام...')
  const settings = [
    { key: 'system_name', value: 'نظام الخدمات الطبية إحسان', description: 'اسم النظام' },
    { key: 'organization_name', value: 'وزارة الصحة والبيئة', description: 'اسم الجهة' },
    { key: 'department_name', value: 'الإدارة العامة للمنشآت الصحية الخاصة', description: 'اسم الإدارة' },
    { key: 'currency', value: 'ريال يمني', description: 'العملة' },
    { key: 'license_validity_years', value: '1', description: 'مدة صلاحية الترخيص بالسنوات' },
  ]

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    })
  }
  console.log('✅ تم إنشاء إعدادات النظام')

  console.log('🎉 تمت تهيئة البيانات بنجاح!')
  console.log('')
  console.log('📋 بيانات الدخول التجريبية:')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  users.forEach(u => {
    const roleNames: Record<string, string> = {
      'CLIENT': 'عميل',
      'BRANCH_MANAGER': 'مدير فرع',
      'FACILITIES_MGR': 'مدير المنشآت',
      'REVIEW_MGR': 'مدير المراجعة',
      'GENERAL_MGR': 'مدير الإدارة العامة',
      'DEPUTY_MINISTER': 'وكيل الوزارة',
    }
    console.log(`${roleNames[u.role]}: ${u.email} / 123456`)
  })
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('💰 أنواع الرسوم:')
  feeTypes.forEach(f => {
    console.log(`${f.name}: ${f.amount.toLocaleString()} ريال`)
  })
}

main()
  .catch((e) => {
    console.error('❌ خطأ في تهيئة البيانات:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
