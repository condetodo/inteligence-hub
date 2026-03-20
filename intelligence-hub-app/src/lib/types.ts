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
  role: string;
  company: string;
  industry: string;
  status: "ACTIVE" | "PAUSED" | "ARCHIVED";
  createdAt: string;
  _count?: {
    inputs: number;
    content: number;
  };
  stats?: {
    pendingInputs: number;
    contentCount: number;
    lastProcessedAt: string | null;
  };
}

export interface InputFile {
  id: string;
  instanceId: string;
  type: "WHATSAPP" | "EMAIL" | "AUDIO" | "NOTE" | "INTERVIEW";
  filename: string;
  content: string;
  status: "PENDING" | "PROCESSED";
  uploadedAt: string;
  processedAt: string | null;
}

export interface ContentOutput {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  platform: "LINKEDIN" | "X" | "TIKTOK" | "BLOG";
  type: "POST" | "THREAD" | "SCRIPT" | "ARTICLE";
  title: string;
  content: string;
  imageUrl: string | null;
  imagePrompt: string | null;
  variant: "A" | "B" | "C";
  status: "DRAFT" | "REVIEW" | "APPROVED" | "PUBLISHED";
  engagement: Record<string, number> | null;
  createdAt: string;
}

export interface InsightReport {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  executiveSummary: string;
  topTopics: unknown[];
  opportunity: string;
  evolution: string;
  questions: string[];
  recommendations: string;
  createdAt: string;
}

export interface BrandVoice {
  id: string;
  instanceId: string;
  identity: string;
  valueProposition: string;
  audience: string;
  voiceTone: Record<string, unknown>;
  recurringTopics: string[];
  positioning: string;
  metrics: string;
  updatedAt: string;
}

export interface ProcessingRun {
  id: string;
  instanceId: string;
  weekNumber: number;
  year: number;
  status: "RUNNING" | "COMPLETED" | "FAILED";
  steps: Record<string, string>;
  startedAt: string;
  completedAt: string | null;
  triggeredBy: "CRON" | "MANUAL";
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
