import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { RequestStatus, ApprovalLevel, RequestType } from '@prisma/client'

// GET - List requests based on user role
export async function GET(request: NextRequest) {
  try {
    const user = await getSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    let requests = []
    
    switch (user.role) {
      case 'CLIENT':
        // Client sees only their own requests
        requests = await db.request.findMany({
          where: { userId: user.id },
          include: {
            province: true,
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'BRANCH_MANAGER':
        // Branch manager sees requests from their province at BRANCH level
        requests = await db.request.findMany({
          where: {
            provinceId: user.provinceId,
            status: RequestStatus.PENDING_BRANCH,
          },
          include: {
            province: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'FACILITIES_MGR':
        // Facilities manager sees requests at FACILITIES level
        requests = await db.request.findMany({
          where: {
            status: RequestStatus.PENDING_FACILITIES,
          },
          include: {
            province: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'REVIEW_MGR':
        // Review manager sees requests at REVIEW level
        requests = await db.request.findMany({
          where: {
            status: {
              in: [RequestStatus.PENDING_REVIEW, RequestStatus.PENDING_PAYMENT],
            },
          },
          include: {
            province: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'GENERAL_MGR':
        // General manager sees all requests
        requests = await db.request.findMany({
          include: {
            province: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      case 'DEPUTY_MINISTER':
        // Deputy minister sees requests at DEPUTY level and all for overview
        requests = await db.request.findMany({
          where: {
            status: RequestStatus.PENDING_DEPUTY,
          },
          include: {
            province: true,
            user: {
              select: { id: true, name: true, email: true, phone: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        })
        break
        
      default:
        requests = []
    }

    return NextResponse.json({ requests })
  } catch (error) {
    console.error('Get requests error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلبات' },
      { status: 500 }
    )
  }
}
