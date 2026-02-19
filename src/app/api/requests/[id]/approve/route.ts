import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession, canApproveAtLevel } from '@/lib/auth'
import { RequestStatus, ApprovalLevel } from '@prisma/client'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSession()
    const { id } = await params
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { action, notes, receiptNumber, receiptAmount, licenseNumber, paymentReference } = body

    const requestItem = await db.request.findUnique({
      where: { id },
    })

    if (!requestItem) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      )
    }

    // Determine current level and check permissions
    const currentLevel = requestItem.currentLevel
    
    if (!canApproveAtLevel(user.role, currentLevel)) {
      return NextResponse.json(
        { error: 'ليس لديك صلاحية الموافقة على هذا الطلب' },
        { status: 403 }
      )
    }

    let updateData: any = {}
    let newStatus = requestItem.status
    let newLevel = requestItem.currentLevel
    let actionDescription = ''

    if (action === 'approve') {
      // Handle approval based on current level
      switch (currentLevel) {
        case ApprovalLevel.BRANCH:
          updateData = {
            branchApproved: true,
            branchApprovedBy: user.id,
            branchApprovedAt: new Date(),
            branchNotes: notes,
            status: RequestStatus.PENDING_FACILITIES,
            currentLevel: ApprovalLevel.FACILITIES,
          }
          actionDescription = 'تمت الموافقة من مدير الفرع'
          break
          
        case ApprovalLevel.FACILITIES:
          updateData = {
            facilitiesApproved: true,
            facilitiesApprovedBy: user.id,
            facilitiesApprovedAt: new Date(),
            facilitiesNotes: notes,
            status: RequestStatus.PENDING_REVIEW,
            currentLevel: ApprovalLevel.REVIEW,
          }
          actionDescription = 'تمت الموافقة من مدير المنشآت'
          break
          
        case ApprovalLevel.REVIEW:
          updateData = {
            reviewApproved: true,
            reviewApprovedBy: user.id,
            reviewApprovedAt: new Date(),
            reviewNotes: notes,
            status: RequestStatus.PENDING_DEPUTY,
            currentLevel: ApprovalLevel.DEPUTY,
          }
          actionDescription = 'تمت الموافقة من مدير المراجعة'
          break
          
        case ApprovalLevel.DEPUTY:
          updateData = {
            deputyApproved: true,
            deputyApprovedBy: user.id,
            deputyApprovedAt: new Date(),
            deputyNotes: notes,
            status: RequestStatus.PENDING_PAYMENT,
            currentLevel: ApprovalLevel.COMPLETED,
          }
          actionDescription = 'تمت الموافقة النهائية من الوكيل'
          break
      }
    } else if (action === 'reject') {
      updateData = {
        status: RequestStatus.REJECTED,
      }
      
      // Add rejection note based on level
      switch (currentLevel) {
        case ApprovalLevel.BRANCH:
          updateData.branchNotes = notes
          break
        case ApprovalLevel.FACILITIES:
          updateData.facilitiesNotes = notes
          break
        case ApprovalLevel.REVIEW:
          updateData.reviewNotes = notes
          break
        case ApprovalLevel.DEPUTY:
          updateData.deputyNotes = notes
          break
      }
      
      actionDescription = `تم رفض الطلب: ${notes}`
    } else if (action === 'issue_receipt') {
      // Issue receipt (for Review Manager)
      updateData = {
        receiptNumber,
        receiptAmount,
        receiptIssuedAt: new Date(),
      }
      actionDescription = `تم إصدار سند الحافظة رقم ${receiptNumber}`
    } else if (action === 'verify_payment') {
      // Verify payment
      updateData = {
        paymentReference,
        paymentVerified: true,
        paidAt: new Date(),
        status: RequestStatus.COMPLETED,
      }
      actionDescription = 'تم التحقق من السداد'
    } else if (action === 'issue_license') {
      // Issue license
      const expiryDate = new Date()
      expiryDate.setFullYear(expiryDate.getFullYear() + 1)
      
      updateData = {
        licenseNumber,
        licenseIssuedAt: new Date(),
        licenseExpiryDate: expiryDate,
        status: RequestStatus.COMPLETED,
      }
      actionDescription = `تم إصدار الترخيص رقم ${licenseNumber}`
    }

    const updatedRequest = await db.request.update({
      where: { id },
      data: updateData,
    })

    // Log action
    await db.actionLog.create({
      data: {
        requestId: id,
        action: action.toUpperCase(),
        description: actionDescription,
        userId: user.id,
      },
    })

    return NextResponse.json({ request: updatedRequest })
  } catch (error) {
    console.error('Approve request error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء معالجة الطلب' },
      { status: 500 }
    )
  }
}
