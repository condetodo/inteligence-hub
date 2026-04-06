export interface User {
  id: string;
  email: string;
  name: string;
  role: "ADMIN" | "OPERATOR";
}

export interface Instance {
  id: string;
  name: string;
  clientName: string;
  clientRole: string;
  company: string;
  industry: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  processingPeriod?: "WEEKLY" | "MONTHLY";
  activeWindow?: number;
  createdAt: string;
  _count?: {
    inputs: number;
    content: number;
  };
  platformConfigs?: {
    platform: Platform;
    enabled: boolean;
    postsPerPeriod: number;
    threadsPerPeriod: number | null;
  }[];
}

// Content
export type Platform = "LINKEDIN" | "X" | "TIKTOK" | "BLOG";
export type ContentStatus = "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED";
export type ContentType = "POST" | "THREAD" | "SCRIPT" | "ARTICLE";
export type Variant = "A" | "B" | "C";

export interface ContentOutput {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  platform: Platform;
  type: ContentType;
  title: string;
  content: string;
  imageUrl: string | null;
  imagePrompt: string | null;
  variant: Variant;
  status: ContentStatus;
  engagement: Record<string, number> | null;
  approvalNotes: string | null;
  consistencyScore: number | null;
  consistencyNotes: string | null;
  createdAt: string;
}

// Inputs
export type InputType = "WHATSAPP" | "EMAIL" | "AUDIO" | "NOTE" | "INTERVIEW" | "LINKEDIN" | "MEETING" | "ARTICLE" | "STRATEGIC_DOC";
export type InputStatus = "PENDING" | "PROCESSED";

export interface InputFile {
  id: string;
  instanceId: string;
  type: InputType;
  filename: string;
  content: string;
  status: InputStatus;
  isFoundational: boolean;
  label: string | null;
  extractedSummary: string | null;
  uploadedAt: string;
  processedAt: string | null;
}

// Insights
export interface InsightReport {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  executiveSummary: string;
  topTopics: { topic: string; evidence: string }[];
  opportunity: string;
  evolution: string;
  questions: string[];
  recommendations: string;
  createdAt: string;
}

// Brand Voice
export interface BrandVoice {
  id: string;
  instanceId: string;
  identity: string;
  valueProposition: string;
  audience: string;
  voiceTone: { adjectives: string[]; examples: string[]; antiPatterns: string[] };
  recurringTopics: string[];
  positioning: string;
  metrics: string;
  insightHistory?: Record<string, unknown>;
  topics: { name: string; position: string; evidence: string; status: string; locked?: boolean }[];
  contacts: { name: string; company: string; context: string; frequency: string; locked?: boolean }[];
  narratives: { name: string; status: string; context: string; startedWeek?: string; locked?: boolean }[];
  lockedFields: Record<string, boolean>;
  staticFieldsLocked: boolean;
  updatedAt: string;
}

// Processing
export type RunStatus = "RUNNING" | "COMPLETED" | "FAILED";
export type TriggerType = "CRON" | "MANUAL";

export type StepStatus = "pending" | "running" | "completed" | "failed" | "reused" | "skipped";

export interface ProcessingRun {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  status: RunStatus;
  steps: Record<string, StepStatus>;
  startedAt: string;
  completedAt: string | null;
  triggeredBy: TriggerType;
}

// Costs
export interface CostStep {
  stepName: string;
  provider: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
}

export interface CostRun {
  runId: string;
  weekNumber: number;
  startedAt: string;
  status: RunStatus;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  steps: CostStep[];
}

export interface CostSummary {
  totalCost: number;
  totalRuns: number;
  avgCostPerRun: number;
}

export interface CostData {
  runs: CostRun[];
  imageCosts: (CostStep & { createdAt: string })[];
  summary: CostSummary;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
