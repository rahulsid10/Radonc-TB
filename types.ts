export enum CasePhase {
  Vignette = 'Vignette',
  Imaging = 'Imaging',
  Pathology = 'Pathology',
  Staging = 'Staging',
  Planning = 'Planning',
  PeerReview = 'PeerReview',
  Completed = 'Completed'
}

export interface PatientChartData {
  demographics: string;
  hpi: string;
  imaging: string[];
  pathology: string[];
  staging: string;
  comorbidities: string;
  labs: string;
  illustrationUrl?: string; // URL/Base64 of generated image
}

export interface PeerPlan {
  residentName: string;
  plan: string;
  rationale: string;
}

export interface PerformanceMetrics {
  clinicalReasoning: number; // 0-100
  guidelineAdherence: number; // 0-100
  safetyAwareness: number; // 0-100
  guidelinesCited: string[];
  improvementAreas: string[];
}

export interface SessionHistoryItem {
  id: string;
  timestamp: number;
  caseType: string;
  metrics: PerformanceMetrics;
}

export interface SimulationResponse {
  feedback: string;
  chartUpdates: Partial<PatientChartData>;
  nextPhase: CasePhase;
  questionToResident: string;
  performanceUpdate?: Partial<PerformanceMetrics>;
  peerPlans?: PeerPlan[];
  visualDescription?: string; // Prompt for the image generator
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface CaseState {
  isActive: boolean;
  phase: CasePhase;
  chart: PatientChartData;
  messages: Message[];
  isLoading: boolean;
  error?: string;
  metrics: PerformanceMetrics;
  peerPlans: PeerPlan[];
}