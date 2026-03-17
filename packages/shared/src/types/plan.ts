export type PlanPhase = 'immediate' | 'week_1' | 'month_1' | 'ongoing';

export type StepCategory =
  | 'id'
  | 'benefits'
  | 'housing'
  | 'employment'
  | 'legal'
  | 'supervision'
  | 'healthcare'
  | 'education'
  | 'family';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'skipped';

export interface ActionPlan {
  id: string;
  userId: string;
  state: string;
  status: 'active' | 'completed' | 'archived';
  steps: PlanStep[];
  generatedAt: string;
  lastSynced: string;
}

export interface PlanStep {
  id: string;
  planId: string;
  phase: PlanPhase;
  category: StepCategory;
  title: string;
  description: string;
  instructions: StepInstruction[];
  documentsNeeded: string[];
  deadline?: string;
  status: StepStatus;
  completedAt?: string;
  priority: number;
  sortOrder: number;
}

export interface StepInstruction {
  order: number;
  text: string;
  url?: string;
  phone?: string;
  address?: string;
  tips?: string[];
}

export interface PlanProgress {
  totalSteps: number;
  completedSteps: number;
  inProgressSteps: number;
  percentComplete: number;
  byPhase: Record<PlanPhase, PhaseProgress>;
  byCategory: Record<StepCategory, CategoryProgress>;
}

export interface PhaseProgress {
  total: number;
  completed: number;
  percentComplete: number;
}

export interface CategoryProgress {
  total: number;
  completed: number;
  percentComplete: number;
}
