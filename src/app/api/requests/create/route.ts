import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { RequestStatus, ApprovalLevel, RequestType, FacilityType } from '@prisma/client'

// Generate unique request number
async function generateRequestNumber(): Promise<string> {
  const year = new Date().getFullYear()
  const count = await db.request.count()
  const number = (count + 1).toString().padStart(6, '0')
  return `${year}/${number}`
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      type,
      facilityType,
      facilityName,
      ownerName,
      ownerPhone,
      ownerEmail,
      ownerAddress,
      facilityAddress,
      provinceId,
      attachments,
    } = body

    if (!facilityName || !ownerName || !ownerPhone || !facilityAddress || !provinceId || !facilityType) {
      return NextResponse.json(
        { error: 'جميع الحقول المطلوبة يجب ملؤها' },
        { status: 400 }
      )
    }

    const requestNumber = await generateRequestNumber()

    const newRequest = await db.request.create({
      data: {
        requestNumber,
        type: type as RequestType,
        facilityType: facilityType as FacilityType,
        facilityName,
        ownerName,
        ownerPhone,
        ownerEmail,
        ownerAddress,
        facilityAddress,
        provinceId,
        userId: user.id,
        status: RequestStatus.PENDING_BRANCH,
        currentLevel: ApprovalLevel.BRANCH,
      },
      include: {
        province: true,
      },
    })

    // Log action
    await db.actionLog.create({
      data: {
        requestId: newRequest.id,
        action: 'CREATE',
        description: 'تم إنشاء الطلب',
        userId: user.id,
      },
    })

    return NextResponse.json({ request: newRequest })
  } catch (error) {
    console.error('Create request error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الطلب' },
      { status: 500 }
    )
  }
}
