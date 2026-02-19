import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'

export async function GET(
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

    const requestItem = await db.request.findUnique({
      where: { id },
      include: {
        province: true,
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        actionLogs: {
          include: {
            user: {
              select: { id: true, name: true, role: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!requestItem) {
      return NextResponse.json(
        { error: 'الطلب غير موجود' },
        { status: 404 }
      )
    }

    return NextResponse.json({ request: requestItem })
  } catch (error) {
    console.error('Get request error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الطلب' },
      { status: 500 }
    )
  }
}
