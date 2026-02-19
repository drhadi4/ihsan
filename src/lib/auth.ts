import { db } from './db'
import { cookies } from 'next/headers'
import { Role, User } from '@prisma/client'

export interface SessionUser {
  id: string
  name: string
  email: string
  phone: string
  role: Role
  provinceId: string | null
  isActive: boolean
}

// Hash password (simple implementation for demo)
export async function hashPassword(password: string): Promise<string> {
  // In production, use bcrypt or similar
  const encoder = new TextEncoder()
  const data = encoder.encode(password + 'ihsan_salt_2024')
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  const hash = await hashPassword(password)
  return hash === hashedPassword
}

export async function createSession(userId: string): Promise<string> {
  const sessionId = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
  
  const cookieStore = await cookies()
  cookieStore.set('session_id', sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
  
  cookieStore.set('user_id', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })
  
  return sessionId
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies()
  const userId = cookieStore.get('user_id')?.value
  
  if (!userId) return null
  
  const user = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      provinceId: true,
      isActive: true,
    },
  })
  
  if (!user || !user.isActive) return null
  
  return user as SessionUser
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies()
  cookieStore.delete('session_id')
  cookieStore.delete('user_id')
}

// Check if user has required role
export function hasRole(userRole: Role, requiredRoles: Role[]): boolean {
  return requiredRoles.includes(userRole)
}

// Get role display name in Arabic
export function getRoleDisplayName(role: Role): string {
  const roleNames: Record<Role, string> = {
    CLIENT: 'عميل',
    BRANCH_MANAGER: 'مدير فرع',
    FACILITIES_MGR: 'مدير المنشآت',
    REVIEW_MGR: 'مدير المراجعة',
    GENERAL_MGR: 'مدير الإدارة العامة',
    DEPUTY_MINISTER: 'وكيل الوزارة',
  }
  return roleNames[role]
}

// Check if user can approve at specific level
export function canApproveAtLevel(userRole: Role, level: string): boolean {
  const approvalMatrix: Record<Role, string[]> = {
    CLIENT: [],
    BRANCH_MANAGER: ['BRANCH'],
    FACILITIES_MGR: ['FACILITIES'],
    REVIEW_MGR: ['REVIEW'],
    GENERAL_MGR: ['REVIEW', 'FACILITIES'],
    DEPUTY_MINISTER: ['DEPUTY', 'REVIEW', 'FACILITIES', 'BRANCH'],
  }
  return approvalMatrix[userRole]?.includes(level) || false
}
