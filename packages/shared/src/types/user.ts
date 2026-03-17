export type UserRole = 'citizen' | 'case_manager' | 'admin';

export type ConvictionType =
  | 'nonviolent_drug'
  | 'violent'
  | 'sex_offense'
  | 'property'
  | 'dui'
  | 'white_collar'
  | 'other';

export type ImmediateNeed =
  | 'shelter'
  | 'food'
  | 'phone'
  | 'transportation'
  | 'clothing'
  | 'medication'
  | 'mental_health';

export type Language = 'en' | 'es';

export interface FamilySituation {
  hasChildren: boolean;
  numberOfChildren?: number;
  childrenAges?: number[];
  hasSupportNetwork: boolean;
  supportNetworkDetails?: string;
  custodyStatus?: 'full' | 'partial' | 'none' | 'unknown';
}

export interface User {
  id: string;
  phone?: string;
  email?: string;
  fullName: string;
  stateOfRelease: string;
  convictionType: ConvictionType;
  releaseDate?: string;
  releaseFacility?: string;
  familySituation?: FamilySituation;
  skills?: UserSkills;
  immediateNeeds: ImmediateNeed[];
  supervisionTerms?: SupervisionTerms;
  languagePreference: Language;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface UserSkills {
  workHistory: WorkHistoryEntry[];
  education: string;
  certifications: string[];
  languages: string[];
}

export interface WorkHistoryEntry {
  title: string;
  industry: string;
  yearsExperience: number;
}

export interface SupervisionTerms {
  type: 'parole' | 'probation' | 'supervised_release';
  officer?: string;
  checkInFrequency: string;
  conditions: string[];
  travelRestrictions?: string;
  drugTesting: boolean;
  curfew?: string;
  endDate?: string;
}
