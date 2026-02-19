import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSession } from '@/lib/auth'
import { RequestStatus, RequestType, Role } from '@prisma/client'

export async function GET() {
  try {
    const user = await getSession()
    
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      )
    }

    // Get overall stats
    const totalRequests = await db.request.count()
    const pendingRequests = await db.request.count({
      where: {
        status: {
          in: [
            RequestStatus.PENDING_BRANCH,
            RequestStatus.PENDING_FACILITIES,
            RequestStatus.PENDING_REVIEW,
            RequestStatus.PENDING_DEPUTY,
            RequestStatus.PENDING_PAYMENT,
          ],
        },
      },
    })
    const completedRequests = await db.request.count({
      where: { status: RequestStatus.COMPLETED },
    })
    const rejectedRequests = await db.request.count({
      where: { status: RequestStatus.REJECTED },
    })

    // Requests by type
    const requestsByType = await db.request.groupBy({
      by: ['type'],
      _count: true,
    })

    // Requests by province
    const requestsByProvince = await db.request.groupBy({
      by: ['provinceId'],
      _count: true,
    })

    // Get province names
    const provinces = await db.province.findMany()
    const provinceMap = new Map(provinces.map(p => [p.id, p.name]))

    const requestsByProvinceWithNames = requestsByProvince.map(item => ({
      provinceId: item.provinceId,
      provinceName: provinceMap.get(item.provinceId) || 'غير معروف',
      count: item._count,
    }))

    // Requests by status
    const requestsByStatus = await db.request.groupBy({
      by: ['status'],
      _count: true,
    })

    // Monthly requests (last 6 months)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    
    const recentRequests = await db.request.findMany({
      where: {
        createdAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
    })

    // Group by month
    const monthlyStats = new Map<string, { total: number; completed: number }>()
    recentRequests.forEach(req => {
      const monthKey = `${req.createdAt.getFullYear()}-${(req.createdAt.getMonth() + 1).toString().padStart(2, '0')}`
      const existing = monthlyStats.get(monthKey) || { total: 0, completed: 0 }
      existing.total++
      if (req.status === RequestStatus.COMPLETED) {
        existing.completed++
      }
      monthlyStats.set(monthKey, existing)
    })

    const monthlyData = Array.from(monthlyStats.entries())
      .map(([month, stats]) => ({
        month,
        ...stats,
      }))
      .sort((a, b) => a.month.localeCompare(b.month))

    // User stats
    const totalUsers = await db.user.count()
    const usersByRole = await db.user.groupBy({
      by: ['role'],
      _count: true,
    })

    // Pending for current user based on role
    let pendingForUser = 0
    if (user.role === Role.BRANCH_MANAGER && user.provinceId) {
      pendingForUser = await db.request.count({
        where: {
          provinceId: user.provinceId,
          status: RequestStatus.PENDING_BRANCH,
        },
      })
    } else if (user.role === Role.FACILITIES_MGR) {
      pendingForUser = await db.request.count({
        where: { status: RequestStatus.PENDING_FACILITIES },
      })
    } else if (user.role === Role.REVIEW_MGR) {
      pendingForUser = await db.request.count({
        where: { status: RequestStatus.PENDING_REVIEW },
      })
    } else if (user.role === Role.DEPUTY_MINISTER) {
      pendingForUser = await db.request.count({
        where: { status: RequestStatus.PENDING_DEPUTY },
      })
    }

    return NextResponse.json({
      stats: {
        totalRequests,
        pendingRequests,
        completedRequests,
        rejectedRequests,
        pendingForUser,
        totalUsers,
        requestsByType: requestsByType.map(item => ({
          type: item.type,
          count: item._count,
        })),
        requestsByProvince: requestsByProvinceWithNames,
        requestsByStatus: requestsByStatus.map(item => ({
          status: item.status,
          count: item._count,
        })),
        monthlyData,
        usersByRole: usersByRole.map(item => ({
          role: item.role,
          count: item._count,
        })),
      },
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الإحصائيات' },
      { status: 500 }
    )
  }
}
