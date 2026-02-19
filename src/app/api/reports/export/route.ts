import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    
    if (!user || (user.role !== 'GENERAL_MGR' && user.role !== 'DEPUTY_MINISTER')) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const provinceId = searchParams.get('provinceId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const facilityType = searchParams.get('facilityType')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build filter
    const where: any = {}
    
    if (provinceId) where.provinceId = provinceId
    if (status) where.status = status
    if (type) where.type = type
    if (facilityType) where.facilityType = facilityType
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate)
    }

    const requests = await db.request.findMany({
      where,
      include: {
        province: true,
        user: {
          select: { id: true, name: true, email: true, phone: true }
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    if (format === 'json') {
      return NextResponse.json({ requests, count: requests.length })
    }

    // Generate CSV for Excel export
    if (format === 'csv' || format === 'excel') {
      const headers = [
        'رقم المعاملة',
        'نوع الطلب',
        'نوع المنشأة',
        'اسم المنشأة',
        'اسم المالك',
        'هاتف المالك',
        'عنوان المنشأة',
        'المحافظة',
        'الحالة',
        'تاريخ الإنشاء',
      ]

      const statusLabels: Record<string, string> = {
        PENDING_BRANCH: 'معلق لدى مدير الفرع',
        PENDING_FACILITIES: 'معلق لدى مدير المنشآت',
        PENDING_REVIEW: 'معلق لدى المراجعة',
        PENDING_DEPUTY: 'معلق لدى الوكيل',
        PENDING_PAYMENT: 'في انتظار السداد',
        COMPLETED: 'مكتمل',
        REJECTED: 'مرفوض',
      }

      const typeLabels: Record<string, string> = {
        FURNISHING: 'تأثيث',
        OPERATION: 'تشغيل',
        RENEWAL: 'تجديد',
      }

      const facilityTypeLabels: Record<string, string> = {
        SPECIALIZED_HOSPITAL: 'مستشفى تخصصي',
        GENERAL_HOSPITAL: 'مستشفى عام',
        SPECIALIZED_CENTER: 'مركز تخصصي',
        POLYCLINIC: 'مستوصف',
        CLINIC: 'عيادة',
        LABORATORY: 'مختبر',
        DIAGNOSTIC_CENTER: 'مركز تشخيصي',
        DENTAL_CLINIC: 'عيادة أسنان',
      }

      const rows = requests.map(r => [
        r.requestNumber,
        typeLabels[r.type] || r.type,
        facilityTypeLabels[r.facilityType] || r.facilityType,
        r.facilityName,
        r.ownerName,
        r.ownerPhone,
        r.facilityAddress,
        r.province?.name || '',
        statusLabels[r.status] || r.status,
        new Date(r.createdAt).toLocaleDateString('ar-SA'),
      ])

      // Create CSV with BOM for proper Arabic encoding
      const BOM = '\uFEFF'
      const csvContent = BOM + [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="report-${Date.now()}.csv"`,
        },
      })
    }

    return NextResponse.json({ requests, count: requests.length })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تصدير التقرير' },
      { status: 500 }
    )
  }
}
