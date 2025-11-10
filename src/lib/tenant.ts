import { prisma } from './db'
import { PLANS, PlanType } from './stripe'

// Check if organization can create more facilities
export async function canCreateFacility(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      facilities: {
        where: { isActive: true }
      }
    }
  })

  if (!org) return false

  const plan = PLANS[org.plan as PlanType]
  const currentCount = org.facilities.length

  // Unlimited for enterprise
  if (plan.limits.facilities === -1) return true
  
  return currentCount < plan.limits.facilities
}

// Check if organization can record more surveys this month
export async function canRecordSurvey(organizationId: string): Promise<boolean> {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId }
  })

  if (!org) return false

  const plan = PLANS[org.plan as PlanType]
  
  // Unlimited for enterprise
  if (plan.limits.surveys === -1) return true

  // Count surveys from current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const monthlyCount = await prisma.survey.count({
    where: {
      organizationId,
      createdAt: {
        gte: startOfMonth
      }
    }
  })

  return monthlyCount < plan.limits.surveys
}

// Get usage stats for organization
export async function getUsageStats(organizationId: string) {
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    include: {
      facilities: {
        where: { isActive: true }
      }
    }
  })

  if (!org) return null

  const plan = PLANS[org.plan as PlanType]

  // Count surveys from current month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const monthlyCount = await prisma.survey.count({
    where: {
      organizationId,
      createdAt: {
        gte: startOfMonth
      }
    }
  })

  return {
    facilities: {
      current: org.facilities.length,
      limit: plan.limits.facilities,
      percentage: plan.limits.facilities === -1 ? 0 : (org.facilities.length / plan.limits.facilities) * 100
    },
    surveys: {
      current: monthlyCount,
      limit: plan.limits.surveys,
      percentage: plan.limits.surveys === -1 ? 0 : (monthlyCount / plan.limits.surveys) * 100
    },
    plan: {
      name: plan.name,
      price: plan.price
    }
  }
}

// Check if user has permission for action
export async function hasPermission(
  userId: string, 
  organizationId: string, 
  action: 'read' | 'write' | 'admin'
): Promise<boolean> {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId
    }
  })

  if (!user) return false

  switch (action) {
    case 'read':
      return ['OWNER', 'ADMIN', 'MEMBER', 'VIEWER'].includes(user.role)
    case 'write':
      return ['OWNER', 'ADMIN', 'MEMBER'].includes(user.role)
    case 'admin':
      return ['OWNER', 'ADMIN'].includes(user.role)
    default:
      return false
  }
}

// Validate organization slug
export function isValidSlug(slug: string): boolean {
  const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
  return slugRegex.test(slug) && slug.length >= 3 && slug.length <= 50
}

// Generate unique slug from organization name
export async function generateSlug(name: string, attempt = 0): Promise<string> {
  let baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()

  if (attempt > 0) {
    baseSlug += `-${attempt}`
  }

  const existing = await prisma.organization.findUnique({
    where: { slug: baseSlug }
  })

  if (existing) {
    return generateSlug(name, attempt + 1)
  }

  return baseSlug
}