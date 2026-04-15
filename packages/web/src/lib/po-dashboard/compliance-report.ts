import type { CaseloadMember } from './caseload';

export interface ComplianceReport {
  periodStart: Date;
  periodEnd: Date;
  generatedAt: Date;
  summary: {
    totalMembers: number;
    compliantCount: number;
    atRiskCount: number;
    overdueCount: number;
    complianceRate: number; // 0-1
  };
  atRiskMembers: Array<{
    member: CaseloadMember;
    riskFactors: string[];
  }>;
  overdueDeadlines: Array<{
    member: CaseloadMember;
    deadlineType: string;
    dueDate: Date;
    daysOverdue: number;
  }>;
  positiveOutcomes: Array<{
    member: CaseloadMember;
    outcome: string;
    achievedAt: Date;
  }>;
}

/** Determine if a member is at risk based on risk score and recent activity */
function getMemberRiskFactors(member: CaseloadMember): string[] {
  const factors: string[] = [];
  const m = member as unknown as Record<string, unknown>;
  const riskScore = Number(m.riskScore ?? m.risk_score ?? 0);
  const lastContact = (m.lastContact ?? m.last_contact) as string | undefined;
  const missedCheckIns = Number(m.missedCheckIns ?? m.missed_check_ins ?? 0);

  if (riskScore >= 7) factors.push('High risk score');
  else if (riskScore >= 5) factors.push('Elevated risk score');

  if (missedCheckIns >= 2) factors.push(`${missedCheckIns} missed check-ins`);
  else if (missedCheckIns === 1) factors.push('1 missed check-in');

  if (lastContact) {
    const daysSinceContact = Math.floor(
      (Date.now() - new Date(lastContact).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (daysSinceContact > 14) factors.push(`No contact in ${daysSinceContact} days`);
  }

  const employmentStatus = (member as unknown as Record<string, unknown>).employmentStatus ?? (member as unknown as Record<string, unknown>).employment_status;
  if (employmentStatus === 'unemployed') factors.push('Currently unemployed');

  const housingStatus = (member as unknown as Record<string, unknown>).housingStatus ?? (member as unknown as Record<string, unknown>).housing_status;
  if (housingStatus === 'unstable' || housingStatus === 'homeless') {
    factors.push('Unstable housing');
  }

  return factors;
}

/** Extract overdue deadlines for a member within the report period */
function getOverdueDeadlines(
  member: CaseloadMember,
  periodStart: Date,
  periodEnd: Date
): Array<{ deadlineType: string; dueDate: Date; daysOverdue: number }> {
  const deadlines: Array<{ deadlineType: string; dueDate: Date; daysOverdue: number }> = [];
  const rawDeadlines = (member as unknown as Record<string, unknown>).deadlines;
  const memberDeadlines: Array<Record<string, unknown>> = Array.isArray(rawDeadlines)
    ? (rawDeadlines as Array<Record<string, unknown>>)
    : [];

  const now = periodEnd;
  for (const dl of memberDeadlines) {
    const dueDate = new Date(String(dl.dueDate ?? dl.due_date ?? ''));
    if (dueDate >= periodStart && dueDate <= periodEnd) {
      const isCompleted = dl.completed ?? dl.status === 'completed';
      if (!isCompleted && dueDate < now) {
        const daysOverdue = Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        deadlines.push({
          deadlineType: String(dl.type ?? dl.deadlineType ?? 'Unknown'),
          dueDate,
          daysOverdue,
        });
      }
    }
  }

  return deadlines;
}

/** Extract positive outcomes achieved within the report period */
function getPositiveOutcomes(
  member: CaseloadMember,
  periodStart: Date,
  periodEnd: Date
): Array<{ outcome: string; achievedAt: Date }> {
  const outcomes: Array<{ outcome: string; achievedAt: Date }> = [];
  const rawOutcomes = (member as unknown as Record<string, unknown>).outcomes;
  const memberOutcomes: Array<Record<string, unknown>> = Array.isArray(rawOutcomes)
    ? (rawOutcomes as Array<Record<string, unknown>>)
    : [];

  for (const o of memberOutcomes) {
    const achievedAt = new Date(String(o.achievedAt ?? o.achieved_at ?? ''));
    if (achievedAt >= periodStart && achievedAt <= periodEnd) {
      outcomes.push({
        outcome: String(o.description ?? o.outcome ?? 'Achievement'),
        achievedAt,
      });
    }
  }

  return outcomes;
}

/**
 * Generate a compliance report for a caseload over a given period.
 * Pure function — no side effects, no I/O.
 */
export function generateComplianceReport(
  caseload: CaseloadMember[],
  periodStart: Date,
  periodEnd: Date
): ComplianceReport {
  const atRiskMembers: ComplianceReport['atRiskMembers'] = [];
  const overdueDeadlines: ComplianceReport['overdueDeadlines'] = [];
  const positiveOutcomes: ComplianceReport['positiveOutcomes'] = [];

  for (const member of caseload) {
    const riskFactors = getMemberRiskFactors(member);
    if (riskFactors.length > 0) {
      atRiskMembers.push({ member, riskFactors });
    }

    const memberOverdue = getOverdueDeadlines(member, periodStart, periodEnd);
    for (const dl of memberOverdue) {
      overdueDeadlines.push({ member, ...dl });
    }

    const memberOutcomes = getPositiveOutcomes(member, periodStart, periodEnd);
    for (const o of memberOutcomes) {
      positiveOutcomes.push({ member, ...o });
    }
  }

  const overdueSet = new Set(overdueDeadlines.map((d) => (d.member as { id: string }).id));
  const atRiskSet = new Set(atRiskMembers.map((a) => (a.member as { id: string }).id));
  const nonCompliantSet = new Set([...overdueSet, ...atRiskSet]);
  const compliantCount = caseload.length - nonCompliantSet.size;
  const complianceRate = caseload.length > 0 ? compliantCount / caseload.length : 1;

  return {
    periodStart,
    periodEnd,
    generatedAt: new Date(),
    summary: {
      totalMembers: caseload.length,
      compliantCount,
      atRiskCount: atRiskMembers.length,
      overdueCount: overdueDeadlines.length,
      complianceRate,
    },
    atRiskMembers,
    overdueDeadlines,
    positiveOutcomes,
  };
}

/** Format a compliance report as a Markdown string for export or email */
export function formatReportAsMarkdown(report: ComplianceReport): string {
  const fmt = (d: Date) => d.toISOString().split('T')[0];
  const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

  const lines: string[] = [
    `# Parole Officer Compliance Report`,
    ``,
    `**Period:** ${fmt(report.periodStart)} → ${fmt(report.periodEnd)}`,
    `**Generated:** ${report.generatedAt.toISOString()}`,
    ``,
    `## Summary`,
    ``,
    `| Metric | Value |`,
    `|--------|-------|`,
    `| Total Members | ${report.summary.totalMembers} |`,
    `| Compliant | ${report.summary.compliantCount} |`,
    `| At Risk | ${report.summary.atRiskCount} |`,
    `| Overdue Deadlines | ${report.summary.overdueCount} |`,
    `| Compliance Rate | ${pct(report.summary.complianceRate)} |`,
    ``,
  ];

  if (report.atRiskMembers.length > 0) {
    lines.push(`## At-Risk Members (${report.atRiskMembers.length})`, ``);
    for (const { member, riskFactors } of report.atRiskMembers) {
      const name = (member as unknown as Record<string, unknown>).name ?? (member as unknown as Record<string, unknown>).fullName ?? 'Unknown';
      lines.push(`### ${name}`);
      for (const f of riskFactors) lines.push(`- ${f}`);
      lines.push(``);
    }
  }

  if (report.overdueDeadlines.length > 0) {
    lines.push(`## Overdue Deadlines (${report.overdueDeadlines.length})`, ``);
    lines.push(`| Member | Type | Due Date | Days Overdue |`);
    lines.push(`|--------|------|----------|--------------|`);
    for (const { member, deadlineType, dueDate, daysOverdue } of report.overdueDeadlines) {
      const name = (member as unknown as Record<string, unknown>).name ?? 'Unknown';
      lines.push(`| ${name} | ${deadlineType} | ${fmt(dueDate)} | ${daysOverdue} |`);
    }
    lines.push(``);
  }

  if (report.positiveOutcomes.length > 0) {
    lines.push(`## Positive Outcomes (${report.positiveOutcomes.length})`, ``);
    for (const { member, outcome, achievedAt } of report.positiveOutcomes) {
      const name = (member as unknown as Record<string, unknown>).name ?? 'Unknown';
      lines.push(`- **${name}**: ${outcome} _(${fmt(achievedAt)})_`);
    }
    lines.push(``);
  }

  lines.push(`---`, `_Report generated by REENTRY PO Dashboard_`);
  return lines.join('\n');
}
