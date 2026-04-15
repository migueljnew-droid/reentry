import { withErrorHandler } from '@/lib/api/error-handler';
import { parseOrThrow } from '@/lib/validation/schemas';
import { z } from 'zod';
import { generateComplianceReport, formatReportAsMarkdown } from '@/lib/po-dashboard/compliance-report';
import type { CaseloadMember } from '@/lib/po-dashboard/caseload';

const ComplianceReportRequestSchema = z.object({
  periodStart: z.string().datetime({ message: 'periodStart must be an ISO 8601 datetime string' }),
  periodEnd: z.string().datetime({ message: 'periodEnd must be an ISO 8601 datetime string' }),
  format: z.enum(['json', 'markdown']).optional().default('json'),
});

/** Stub: replace with real DB/auth-scoped caseload fetch */
async function fetchCaseloadForOfficer(_officerId: string): Promise<CaseloadMember[]> {
  // TODO: query Supabase with RLS — officer sees only their assigned members
  return [];
}

export const POST = withErrorHandler(async (req: Request) => {
  const body = parseOrThrow(ComplianceReportRequestSchema, await req.json());

  const periodStart = new Date(body.periodStart);
  const periodEnd = new Date(body.periodEnd);

  if (periodStart >= periodEnd) {
    return Response.json(
      { error: 'periodStart must be before periodEnd', statusCode: 400 },
      { status: 400 }
    );
  }

  // TODO: extract officer ID from session/JWT
  const officerId = req.headers.get('x-officer-id') ?? 'anonymous';
  const caseload = await fetchCaseloadForOfficer(officerId);

  const report = generateComplianceReport(caseload, periodStart, periodEnd);

  if (body.format === 'markdown') {
    const md = formatReportAsMarkdown(report);
    return new Response(md, {
      status: 200,
      headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
    });
  }

  return Response.json({ ok: true, report }, { status: 200 });
});
