import { NextRequest } from 'next/server';
import { createServiceClient, createUserClient } from './supabase-server';

export interface AuditParams {
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  request: NextRequest;
}

/**
 * Log an audit entry to the audit_log table.
 * Uses the service-role client for insert (audit_log is append-only via RLS).
 * Extracts user_id from the user's JWT, IP from x-forwarded-for, user-agent from headers.
 *
 * NEVER logs PII content — only resource IDs, action types, and metadata.
 */
export async function logAudit(params: AuditParams): Promise<void> {
  const { action, resourceType, resourceId, details, request } = params;

  // Use service client for audit inserts (append-only table)
  const serviceClient = createServiceClient();
  if (!serviceClient) {
    // No Supabase configured — skip audit logging silently in dev
    return;
  }

  // Extract user ID from user's JWT
  let userId: string | null = null;
  const userClient = createUserClient(request);
  if (userClient) {
    try {
      const { data: { user } } = await userClient.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Auth lookup failed — log audit without user_id
    }
  }

  // Extract IP address
  const forwardedFor = request.headers.get('x-forwarded-for');
  const ipAddress = forwardedFor
    ? forwardedFor.split(',')[0].trim()
    : request.headers.get('x-real-ip') ?? null;

  // Extract user agent
  const userAgent = request.headers.get('user-agent') ?? null;

  // Extract session ID from cookies if available
  const sessionCookie = request.cookies.get('sb-session-id');
  const sessionId = sessionCookie?.value ?? null;

  try {
    await serviceClient.from('audit_log').insert({
      user_id: userId,
      actor_id: userId,
      action,
      resource_type: resourceType,
      resource_id: resourceId ?? null,
      details: details ?? {},
      ip_address: ipAddress,
      user_agent: userAgent,
      session_id: sessionId,
      request_method: request.method,
      request_path: request.nextUrl.pathname,
    });
  } catch {
    // Audit logging must never break the main request flow.
    // In production, this should alert but not crash.
    console.error('[AUDIT] Failed to write audit log entry');
  }
}

/**
 * Helper to create a standard audit action name.
 */
export function auditAction(verb: string, resource: string): string {
  return `${verb}:${resource}`;
}
