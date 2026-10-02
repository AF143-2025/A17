import db from './db';

export interface RecordAuditLogParams {
  adminId: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export async function logAdminAction({
  adminId,
  action,
  targetType,
  targetId,
  details,
  ipAddress,
}: RecordAuditLogParams) {
  try {
    return await db.auditLog.create({
      data: {
        adminId,
        action,
        targetType,
        targetId: targetId || null,
        details: details ? JSON.stringify(details) : null,
        ipAddress: ipAddress || null,
      },
    });
  } catch (error) {
    console.error('Failed to log admin action:', error);
  }
}
