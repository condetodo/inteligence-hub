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
  createdAt: string;
  _count?: {
    inputs: number;
    content: number;
  };
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
  createdAt: string;
}

// Inputs
export type InputType = "WHATSAPP" | "EMAIL" | "AUDIO" | "NOTE" | "INTERVIEW";
export type InputStatus = "PENDING" | "PROCESSED";

export interface InputFile {
  id: string;
  instanceId: string;
  type: InputType;
  filename: string;
  content: string;
  status: InputStatus;
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

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
