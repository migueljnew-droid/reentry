export type BenefitProgramType =
  | 'snap'
  | 'tanf'
  | 'medicaid'
  | 'medicare'
  | 'ssi'
  | 'ssdi'
  | 'section8'
  | 'liheap'
  | 'wic'
  | 'pell_grant'
  | 'lifeline'
  | 'veterans'
  | 'state_specific';

export interface BenefitProgram {
  name: string;
  type: BenefitProgramType;
  description: string;
  agency: string;
  applicationUrl?: string;
  phone?: string;
  documentsNeeded: string[];
  processingTimeDays: number;
  expeditedAvailable: boolean;
  monthlyValue?: string;
}

export interface BenefitsScreeningResult {
  id: string;
  userId: string;
  programName: string;
  programType: BenefitProgramType;
  eligible: boolean;
  confidence: number;
  requirementsMet: RequirementCheck[];
  requirementsMissing: RequirementCheck[];
  applicationUrl?: string;
  notes?: string;
  screenedAt: string;
}

export interface RequirementCheck {
  requirement: string;
  met: boolean;
  details?: string;
}

export interface BenefitsScreeningSummary {
  totalProgramsScreened: number;
  eligiblePrograms: number;
  potentialMonthlyValue: number;
  results: BenefitsScreeningResult[];
}
