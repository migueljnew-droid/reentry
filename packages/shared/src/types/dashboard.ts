export type RiskSeverity = 'low' | 'medium' | 'high' | 'critical';

export type RiskFlagType =
  | 'missed_checkin'
  | 'benefits_lapse'
  | 'housing_loss'
  | 'employment_gap'
  | 'court_date_missed'
  | 'supervision_violation';

export interface RiskFlag {
  id: string;
  userId: string;
  flagType: RiskFlagType;
  severity: RiskSeverity;
  description: string;
  resolved: boolean;
  resolvedAt?: string;
  createdAt: string;
}

export interface CaseAssignment {
  id: string;
  caseManagerId: string;
  citizenId: string;
  status: 'active' | 'closed';
  notes?: string;
  assignedAt: string;
}

export interface ClientOverview {
  user: {
    id: string;
    fullName: string;
    stateOfRelease: string;
    releaseDate?: string;
    convictionType: string;
  };
  planProgress: {
    totalSteps: number;
    completedSteps: number;
    percentComplete: number;
  };
  activeRisks: RiskFlag[];
  upcomingDeadlines: Deadline[];
  lastActivity?: string;
}

export interface Deadline {
  id: string;
  userId: string;
  planStepId?: string;
  title: string;
  description?: string;
  dueDate: string;
  category: string;
  status: 'upcoming' | 'notified' | 'completed' | 'overdue';
}

export interface DashboardAnalytics {
  totalClients: number;
  activeClients: number;
  averageProgress: number;
  riskBreakdown: Record<RiskSeverity, number>;
  completionRate: number;
  activeRiskFlags: number;
}
