export type IntakeStage =
  | 'welcome'
  | 'basic_info'
  | 'conviction_info'
  | 'family_situation'
  | 'immediate_needs'
  | 'skills_history'
  | 'supervision'
  | 'review'
  | 'complete';

export interface IntakeSession {
  id: string;
  userId?: string;
  stage: IntakeStage;
  responses: IntakeResponses;
  voiceTranscripts: VoiceTranscript[];
  startedAt: string;
  completedAt?: string;
}

export interface IntakeResponses {
  fullName?: string;
  phone?: string;
  stateOfRelease?: string;
  convictionType?: string;
  releaseDate?: string;
  releaseFacility?: string;
  hasChildren?: boolean;
  numberOfChildren?: number;
  hasSupportNetwork?: boolean;
  immediateNeeds?: string[];
  workHistory?: string;
  education?: string;
  supervisionType?: string;
  supervisionOfficer?: string;
  checkInFrequency?: string;
  languagePreference?: string;
}

export interface VoiceTranscript {
  id: string;
  sessionId: string;
  transcript: string;
  language: string;
  durationMs: number;
  createdAt: string;
}

export interface IntakeMessage {
  role: 'system' | 'assistant' | 'user';
  content: string;
  timestamp: string;
  voiceUrl?: string;
}
