import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import prisma from '@/lib/db';

// Cache the system user ID to avoid repeated DB lookups
let _systemUserId: string | null = null;

/**
 * Ensures a SYSTEM user exists in the database and returns its ID.
 * This is needed because AuditLog has a foreign key to User.
 */
export async function getSystemUserId(): Promise<string> {
  if (_systemUserId) return _systemUserId;
  
  const adminRole = await prisma.role.findUnique({ where: { code: 'ADMIN' } });
  const prodDept = await prisma.department.findUnique({ where: { code: 'PROD' } });

  if (!adminRole || !prodDept) {
    throw new Error('Database not seeded: ADMIN role or PROD department missing');
  }

  const user = await prisma.user.upsert({
    where: { email: 'system@mes.local' },
    create: { 
      email: 'system@mes.local', 
      username: 'system',
      name: 'System', 
      passwordHash: '',
      roleId: adminRole.id,
      departmentId: prodDept.id
    },
    update: {}
  });
  _systemUserId = user.id;
  return user.id;
}

/**
 * Create an audit log entry with automatic SYSTEM user resolution
 */
export async function createAuditLog(action: string, entity: string, details: any) {
  try {
    const userId = await getSystemUserId();
    await prisma.auditLog.create({
      data: { userId, action, entity, details }
    });
  } catch (err) {
    console.error('[AUDIT] Failed to log:', err);
  }
}

export async function handleApiError(error: any, context: string) {
  console.error(`[API ERROR] ${context}:`, error);

  // Log to AuditLog for industrial compliance
  await createAuditLog('API_ERROR', context, { 
    message: error.message, 
    name: error.name
  });

  if (error instanceof ZodError) {
    return NextResponse.json({
      error: 'Validation Failed',
      details: error.issues.map(e => ({ path: e.path, message: e.message }))
    }, { status: 400 });
  }

  // Handle Prisma errors
  if (error.code === 'P2002') {
    return NextResponse.json({
      error: 'Conflict',
      details: 'A record with this unique identifier already exists.'
    }, { status: 409 });
  }

  return NextResponse.json({
    error: 'Internal Server Error',
    message: error.message || 'An unexpected error occurred'
  }, { status: 500 });
}

export function apiResponse(data: any, status: number = 200) {
  return NextResponse.json({
    success: true,
    data,
    timestamp: new Date().toISOString()
  }, { status });
}
