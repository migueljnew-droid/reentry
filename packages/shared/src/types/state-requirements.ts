export interface StateRequirements {
  state: string;
  stateName: string;
  lastUpdated: string;
  idRequirements: IDRequirements;
  benefits: Record<string, StateBenefitProgram>;
  employmentRestrictions: Record<string, EmploymentRestriction>;
  supervision: SupervisionRules;
}

export interface IDRequirements {
  stateId: IDDocumentRequirement;
  birthCertificate: DocumentObtainment;
  socialSecurityCard: DocumentObtainment;
}

export interface IDDocumentRequirement {
  documentsNeeded: string[];
  alternativeDocuments: Record<string, string[]>;
  fee: number;
  feeWaiverAvailable: boolean;
  feeWaiverRequirements?: string;
  processingTimeDays: number;
  locations: string;
  onlineAvailable: boolean;
  notes?: string;
}

export interface DocumentObtainment {
  requestUrl?: string;
  documentsNeeded?: string[];
  fee: number;
  processingTimeDays: number;
  expeditedAvailable: boolean;
  expeditedFee?: number;
  onlineAvailable?: boolean;
  url?: string;
}

export interface StateBenefitProgram {
  name: string;
  agency: string;
  eligibility: BenefitEligibility;
  applicationUrl?: string;
  documentsNeeded: string[];
  processingTimeDays: number;
  expeditedAvailable: boolean;
  expeditedCriteria?: string;
}

export interface BenefitEligibility {
  incomeLimitPercentFPL?: number;
  convictionRestrictions: string[];
  waitingPeriodDays: number;
  additionalRequirements?: string[];
}

export interface EmploymentRestriction {
  restrictedJobs: string[];
  registrationRequired: boolean;
  bufferZones?: string;
  banTheBox: boolean;
  lookBackPeriodYears?: number;
}

export interface SupervisionRules {
  parole: SupervisionType;
  probation?: SupervisionType;
}

export interface SupervisionType {
  checkInFrequency: string;
  travelRestrictions: string;
  drugTesting: string;
  curfew: string;
}
