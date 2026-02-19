import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const provinces = await db.province.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ provinces })
  } catch (error) {
    console.error('Get provinces error:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب المحافظات' },
      { status: 500 }
    )
  }
}
