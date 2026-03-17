export interface EmploymentMatch {
  id: string;
  userId: string;
  employerName: string;
  jobTitle: string;
  location: string;
  salaryRange?: string;
  convictionFriendly: boolean;
  convictionRestrictions: string[];
  matchScore: number;
  skillsMatched: string[];
  applicationUrl?: string;
  status: EmploymentMatchStatus;
  matchedAt: string;
}

export type EmploymentMatchStatus =
  | 'suggested'
  | 'saved'
  | 'applied'
  | 'interviewing'
  | 'hired'
  | 'declined';

export interface Employer {
  id: string;
  name: string;
  industry: string;
  locations: string[];
  convictionFriendly: boolean;
  convictionRestrictions: string[];
  banTheBox: boolean;
  jobOpenings: JobOpening[];
}

export interface JobOpening {
  id: string;
  title: string;
  description: string;
  location: string;
  salaryRange?: string;
  requirements: string[];
  skillsRequired: string[];
  convictionRestrictions: string[];
}
