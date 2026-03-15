# Plan 3A: Frontend Setup — Project, Auth, Layout & Dashboard

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first half of the Intelligence Hub frontend — project initialization, API client, auth pages, root layout with sidebar, dashboard, create instance page, instance layout with topbar and tabs, and reusable UI components.

**Architecture:** Next.js 14 App Router with TypeScript. Client-side JWT auth stored in localStorage. API calls via fetch wrapper pointing to the Express backend. Sidebar lists instances, main area renders per-route content. Instance pages share a layout with topbar + tabs.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Inter font (Google Fonts), deployed to Vercel

**Spec:** `docs/superpowers/specs/2026-03-14-intelligence-hub-design.md`
**Mockup:** `mockup/index.html`

---

## File Structure

```
intelligence-hub-app/
├── package.json
├── tsconfig.json
├── next.config.js
├── tailwind.config.ts
├── postcss.config.js
├── .env.example
├── .env.local
├── .gitignore
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                          ← Root layout (sidebar + auth guard)
│   │   ├── globals.css                         ← Tailwind imports + Horse brand tokens
│   │   ├── page.tsx                            ← Redirect to /dashboard
│   │   ├── login/
│   │   │   └── page.tsx                        ← Login page
│   │   ├── register/
│   │   │   └── page.tsx                        ← Register page
│   │   ├── (app)/
│   │   │   ├── layout.tsx                      ← Authenticated layout with sidebar
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx                    ← Instance cards grid
│   │   │   ├── instances/
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx                ← Create instance form
│   │   │   │   └── [id]/
│   │   │   │       ├── layout.tsx              ← Instance layout (topbar + tabs)
│   │   │   │       ├── page.tsx                ← Redirect to content tab
│   │   │   │       ├── content/
│   │   │   │       │   └── page.tsx            ← Placeholder (Plan 3B)
│   │   │   │       ├── inputs/
│   │   │   │       │   └── page.tsx            ← Placeholder (Plan 3B)
│   │   │   │       ├── insights/
│   │   │   │       │   └── page.tsx            ← Placeholder (Plan 3B)
│   │   │   │       ├── brand-voice/
│   │   │   │       │   └── page.tsx            ← Placeholder (Plan 3B)
│   │   │   │       └── history/
│   │   │   │           └── page.tsx            ← Placeholder (Plan 3B)
│   │   │   └── settings/
│   │   │       └── page.tsx                    ← Placeholder
│   ├── components/
│   │   ├── ui/
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   └── StatusBanner.tsx
│   │   ├── Sidebar.tsx
│   │   ├── InstanceTopbar.tsx
│   │   └── InstanceTabs.tsx
│   ├── lib/
│   │   ├── api.ts                              ← Fetch wrapper with JWT
│   │   ├── auth.ts                             ← Auth context + hook
│   │   └── types.ts                            ← Shared TypeScript types
│   └── hooks/
│       └── useInstances.ts                     ← Fetch instances hook
```

---

## Chunk 1: Project Initialization

### Task 1: Initialize Next.js project

**Files:**
- Create: `intelligence-hub-app/package.json` (via create-next-app)
- Create: `intelligence-hub-app/tailwind.config.ts`
- Create: `intelligence-hub-app/.env.example`
- Create: `intelligence-hub-app/.gitignore`

- [ ] **Step 1: Create Next.js project**

```bash
cd /c/Proyectos/Inteligence-hub
npx create-next-app@14 intelligence-hub-app --typescript --tailwind --eslint --app --src-dir --no-import-alias
```

- [ ] **Step 2: Create .env.example**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

- [ ] **Step 3: Create .env.local**

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

- [ ] **Step 4: Configure Tailwind with Horse brand colors**

Replace `intelligence-hub-app/tailwind.config.ts`:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
      },
      colors: {
        horse: {
          black: "#1a1a1a",
          dark: "#32373c",
          "gray-700": "#4a4a4a",
          "gray-500": "#7a7a7a",
          "gray-400": "#9a9a9a",
          "gray-300": "#c4c4c4",
          "gray-200": "#e2e2e0",
          "gray-100": "#f0f0ee",
          bg: "#f5f5f3",
          white: "#ffffff",
        },
        status: {
          draft: "#d4a017",
          review: "#2d6cce",
          approved: "#2a9d5c",
          published: "#1a1a1a",
        },
        platform: {
          linkedin: "#0a66c2",
          x: "#1a1a1a",
          tiktok: "#c13584",
          blog: "#2a9d5c",
        },
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 5: Set up globals.css**

Replace `intelligence-hub-app/src/app/globals.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap");

body {
  font-family: "Inter", system-ui, -apple-system, sans-serif;
  background: #f5f5f3;
  color: #1a1a1a;
}
```

- [ ] **Step 6: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/
git commit -m "feat: initialize intelligence-hub-app with Next.js 14, Tailwind, Horse brand config"
```

---

## Chunk 2: Types, API Client & Auth

### Task 2: Shared types

**Files:**
- Create: `intelligence-hub-app/src/lib/types.ts`

- [ ] **Step 1: Create types file**

```ts
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
```

---

### Task 3: API client with JWT

**Files:**
- Create: `intelligence-hub-app/src/lib/api.ts`

- [ ] **Step 1: Create fetch wrapper**

```ts
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

class ApiClient {
  private getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }

  setToken(token: string): void {
    localStorage.setItem("token", token);
  }

  clearToken(): void {
    localStorage.removeItem("token");
  }

  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
      throw new Error("Unauthorized");
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw error;
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint);
  }

  post<T>(endpoint: string, body?: unknown) {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: unknown) {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const api = new ApiClient();
```

---

### Task 4: Auth context

**Files:**
- Create: `intelligence-hub-app/src/lib/auth.ts`

- [ ] **Step 1: Create auth context and hook**

```tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { api } from "./api";
import { User } from "./types";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const data = await api.get<{ user: User }>("/auth/me");
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [fetchUser]);

  const login = async (email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>("/auth/login", { email, password });
    api.setToken(data.token);
    setUser(data.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await api.post<{ token: string; user: User }>("/auth/register", { name, email, password });
    api.setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    api.clearToken();
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/src/lib/
git commit -m "feat: add types, API client with JWT, and auth context"
```

---

## Chunk 3: Auth Pages

### Task 5: Login page

**Files:**
- Create: `intelligence-hub-app/src/app/login/page.tsx`

- [ ] **Step 1: Create login page**

```tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error al iniciar sesión";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-horse-bg flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-horse-black rounded-lg flex items-center justify-center text-white text-sm font-bold">
            H
          </div>
          <span className="text-2xl font-bold tracking-widest uppercase text-horse-black">
            Horse
          </span>
        </div>

        <div className="bg-white rounded-xl border border-horse-gray-200 p-8">
          <h1 className="text-lg font-semibold text-horse-black mb-6">Iniciar sesión</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-horse-black text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>

          <p className="text-center text-sm text-horse-gray-400 mt-4">
            ¿No tenés cuenta?{" "}
            <Link href="/register" className="text-horse-black font-medium hover:underline">
              Registrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

### Task 6: Register page

**Files:**
- Create: `intelligence-hub-app/src/app/register/page.tsx`

- [ ] **Step 1: Create register page**

```tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error al registrarse";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-horse-bg flex items-center justify-center">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-8 justify-center">
          <div className="w-10 h-10 bg-horse-black rounded-lg flex items-center justify-center text-white text-sm font-bold">
            H
          </div>
          <span className="text-2xl font-bold tracking-widest uppercase text-horse-black">
            Horse
          </span>
        </div>

        <div className="bg-white rounded-xl border border-horse-gray-200 p-8">
          <h1 className="text-lg font-semibold text-horse-black mb-6">Crear cuenta</h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">Nombre</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                placeholder="Tu nombre"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-horse-gray-700 mb-1">Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-horse-black text-white rounded-lg text-sm font-medium hover:bg-black transition-colors disabled:opacity-50"
            >
              {loading ? "Creando cuenta..." : "Crear cuenta"}
            </button>
          </form>

          <p className="text-center text-sm text-horse-gray-400 mt-4">
            ¿Ya tenés cuenta?{" "}
            <Link href="/login" className="text-horse-black font-medium hover:underline">
              Iniciá sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/src/app/login/ intelligence-hub-app/src/app/register/
git commit -m "feat: add login and register pages"
```

---

## Chunk 4: Reusable UI Components

### Task 7: Button component

**Files:**
- Create: `intelligence-hub-app/src/components/ui/Button.tsx`

- [ ] **Step 1: Create Button component**

```tsx
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
}

const variants = {
  primary: "bg-horse-black text-white hover:bg-black",
  outline: "bg-transparent border-[1.5px] border-horse-gray-300 text-horse-dark hover:border-horse-black hover:text-horse-black",
  ghost: "bg-transparent text-horse-gray-500 hover:bg-horse-gray-100 hover:text-horse-black",
};

const sizes = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-[18px] py-[9px] text-[13px]",
  lg: "px-6 py-3 text-sm",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`rounded-lg font-medium transition-colors font-sans disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant]} ${sizes[size]} ${className}`}
        disabled={disabled}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
```

---

### Task 8: Badge component

**Files:**
- Create: `intelligence-hub-app/src/components/ui/Badge.tsx`

- [ ] **Step 1: Create Badge component**

```tsx
import { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "active" | "linkedin" | "x" | "tiktok" | "blog" | "draft" | "review" | "approved" | "published";
  className?: string;
}

const variantStyles: Record<string, string> = {
  default: "bg-horse-gray-100 text-horse-gray-500",
  active: "bg-horse-black text-white",
  linkedin: "bg-[rgba(10,102,194,0.08)] text-platform-linkedin",
  x: "bg-[rgba(0,0,0,0.05)] text-platform-x",
  tiktok: "bg-[rgba(193,53,132,0.08)] text-platform-tiktok",
  blog: "bg-[rgba(42,157,92,0.08)] text-platform-blog",
  draft: "bg-[rgba(212,160,23,0.1)] text-status-draft",
  review: "bg-[rgba(45,108,206,0.1)] text-status-review",
  approved: "bg-[rgba(42,157,92,0.1)] text-status-approved",
  published: "bg-horse-gray-100 text-horse-black",
};

export function Badge({ children, variant = "default", className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold ${variantStyles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
```

---

### Task 9: Modal component

**Files:**
- Create: `intelligence-hub-app/src/components/ui/Modal.tsx`

- [ ] **Step 1: Create Modal component**

```tsx
"use client";

import { ReactNode, useEffect, useRef } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
}

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
};

export function Modal({ open, onClose, title, children, size = "md" }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className={`bg-white rounded-xl border border-horse-gray-200 shadow-lg w-full ${sizeClasses[size]} mx-4`}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-horse-gray-200">
            <h2 className="text-base font-semibold text-horse-black">{title}</h2>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-horse-gray-400 hover:text-horse-black hover:bg-horse-gray-100 transition-colors"
            >
              &times;
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
```

---

### Task 10: StatusBanner component

**Files:**
- Create: `intelligence-hub-app/src/components/ui/StatusBanner.tsx`

- [ ] **Step 1: Create StatusBanner component**

```tsx
import { ProcessingRun } from "@/lib/types";

interface StatusBannerProps {
  run: ProcessingRun | null;
}

const stepLabels: Record<string, string> = {
  corpus: "Corpus",
  brandVoice: "Brand Voice",
  content: "Contenido",
  insights: "Insights",
  distribution: "Distribución",
};

export function StatusBanner({ run }: StatusBannerProps) {
  if (!run) return null;

  const isRunning = run.status === "RUNNING";
  const isFailed = run.status === "FAILED";

  return (
    <div className="bg-white border border-horse-gray-200 rounded-[10px] p-3.5 px-5 flex items-center justify-between mb-5">
      <div className="flex items-center gap-2.5 text-[13px] text-horse-gray-700">
        <div
          className={`w-2 h-2 rounded-full ${
            isRunning ? "bg-status-approved animate-pulse" : isFailed ? "bg-red-500" : "bg-status-approved"
          }`}
        />
        <span>
          {isRunning
            ? "Procesando..."
            : isFailed
              ? "Error en procesamiento"
              : `Último procesamiento: ${new Date(run.completedAt || run.startedAt).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`}
        </span>
      </div>
      <div className="flex gap-4 text-xs text-horse-gray-400">
        {Object.entries(run.steps).map(([key, status]) => (
          <span key={key} className={status === "completed" ? "text-status-approved font-medium" : ""}>
            {status === "completed" ? "\u2713 " : ""}
            {stepLabels[key] || key}
          </span>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/src/components/
git commit -m "feat: add reusable UI components — Button, Badge, Modal, StatusBanner"
```

---

## Chunk 5: Root Layout & Sidebar

### Task 11: Instances hook

**Files:**
- Create: `intelligence-hub-app/src/hooks/useInstances.ts`

- [ ] **Step 1: Create useInstances hook**

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";

export function useInstances() {
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInstances = useCallback(async () => {
    try {
      const data = await api.get<{ instances: Instance[] }>("/instances");
      setInstances(data.instances);
    } catch {
      setInstances([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInstances();
  }, [fetchInstances]);

  return { instances, loading, refetch: fetchInstances };
}
```

---

### Task 12: Sidebar component

**Files:**
- Create: `intelligence-hub-app/src/components/Sidebar.tsx`

- [ ] **Step 1: Create Sidebar matching mockup**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useInstances } from "@/hooks/useInstances";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function Sidebar() {
  const pathname = usePathname();
  const { instances } = useInstances();

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: "\u25EB" },
    { href: "/settings", label: "Configuración", icon: "\u2699" },
  ];

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-[260px] bg-white border-r border-horse-gray-200 flex flex-col z-40">
      <div className="px-6 py-5 pb-4 border-b border-horse-gray-200 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-horse-black rounded-md flex items-center justify-center text-white text-sm font-bold">
          H
        </div>
        <span className="text-[22px] font-bold tracking-[2px] uppercase text-horse-black">
          Horse
        </span>
      </div>

      <div className="px-6 pt-5 pb-2 text-[10px] uppercase text-horse-gray-400 tracking-[1.5px] font-semibold">
        General
      </div>
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 px-6 py-2.5 text-sm transition-colors ${
              active
                ? "bg-horse-gray-100 text-horse-black font-medium border-l-[3px] border-horse-black"
                : "text-horse-gray-500 hover:bg-horse-gray-100 hover:text-horse-black"
            }`}
          >
            <span className="w-[18px] text-center text-[15px]">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      <div className="px-6 pt-5 pb-2 text-[10px] uppercase text-horse-gray-400 tracking-[1.5px] font-semibold">
        Instancias
      </div>
      <div className="flex-1 overflow-y-auto">
        {instances.map((instance) => {
          const active = pathname.startsWith(`/instances/${instance.id}`);
          return (
            <Link
              key={instance.id}
              href={`/instances/${instance.id}/content`}
              className={`flex items-center gap-2.5 px-6 py-2.5 text-[13px] transition-colors ${
                active
                  ? "bg-horse-gray-100 text-horse-black"
                  : "text-horse-gray-500 hover:bg-horse-gray-100 hover:text-horse-black"
              }`}
            >
              <div className="w-[34px] h-[34px] rounded-lg bg-horse-gray-100 flex items-center justify-center text-xs font-semibold text-horse-black flex-shrink-0">
                {getInitials(instance.clientName)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-horse-black text-[13px]">{instance.clientName}</span>
                <span className="text-[11px] text-horse-gray-400 mt-px">
                  {instance.role} · {instance.company}
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <Link
        href="/instances/new"
        className="mx-4 mb-4 py-2.5 border-[1.5px] border-dashed border-horse-gray-300 rounded-lg text-center text-horse-gray-400 text-[13px] font-medium hover:border-horse-black hover:text-horse-black transition-colors"
      >
        + Nueva instancia
      </Link>
    </aside>
  );
}
```

---

### Task 13: Root layout and app layout

**Files:**
- Modify: `intelligence-hub-app/src/app/layout.tsx`
- Create: `intelligence-hub-app/src/app/page.tsx`
- Create: `intelligence-hub-app/src/app/(app)/layout.tsx`

- [ ] **Step 1: Update root layout**

Replace `intelligence-hub-app/src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Horse Intelligence Hub",
  description: "Content intelligence platform by Horse Consulting",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Create root page redirect**

```tsx
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/dashboard");
}
```

- [ ] **Step 3: Create authenticated app layout with sidebar**

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-horse-bg flex items-center justify-center">
        <div className="text-horse-gray-400 text-sm">Cargando...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-horse-bg">
      <Sidebar />
      <main className="ml-[260px]">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/src/
git commit -m "feat: add root layout, app layout with sidebar, and instances hook"
```

---

## Chunk 6: Dashboard

### Task 14: Dashboard page

**Files:**
- Create: `intelligence-hub-app/src/app/(app)/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard with instance cards grid**

```tsx
"use client";

import Link from "next/link";
import { useInstances } from "@/hooks/useInstances";
import { Badge } from "@/components/ui/Badge";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function DashboardPage() {
  const { instances, loading } = useInstances();

  return (
    <div>
      <div className="h-[68px] border-b border-horse-gray-200 flex items-center justify-between px-8 bg-white">
        <h1 className="text-lg font-semibold text-horse-black">Dashboard</h1>
        <Link
          href="/instances/new"
          className="px-[18px] py-[9px] bg-horse-black text-white rounded-lg text-[13px] font-medium hover:bg-black transition-colors"
        >
          + Nueva instancia
        </Link>
      </div>

      <div className="p-8">
        {loading ? (
          <div className="text-horse-gray-400 text-sm">Cargando instancias...</div>
        ) : instances.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-horse-gray-400 text-sm mb-4">No hay instancias creadas todavía.</p>
            <Link
              href="/instances/new"
              className="inline-block px-6 py-3 bg-horse-black text-white rounded-lg text-sm font-medium hover:bg-black transition-colors"
            >
              Crear primera instancia
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {instances.map((instance) => (
              <Link
                key={instance.id}
                href={`/instances/${instance.id}/content`}
                className="bg-white border border-horse-gray-200 rounded-xl p-5 hover:border-horse-gray-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-start gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-horse-gray-100 flex items-center justify-center text-sm font-semibold text-horse-black flex-shrink-0">
                    {getInitials(instance.clientName)}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-horse-black group-hover:underline">
                      {instance.clientName}
                    </h3>
                    <p className="text-xs text-horse-gray-400 mt-0.5">
                      {instance.role} · {instance.company}
                    </p>
                  </div>
                  <Badge variant={instance.status === "ACTIVE" ? "approved" : "default"} className="ml-auto">
                    {instance.status === "ACTIVE" ? "Activa" : instance.status === "PAUSED" ? "Pausada" : "Archivada"}
                  </Badge>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-horse-gray-100 rounded-lg py-2">
                    <div className="text-lg font-bold text-status-draft">
                      {instance.stats?.pendingInputs ?? 0}
                    </div>
                    <div className="text-[10px] text-horse-gray-400 font-medium">Inputs pendientes</div>
                  </div>
                  <div className="bg-horse-gray-100 rounded-lg py-2">
                    <div className="text-lg font-bold text-horse-black">
                      {instance.stats?.contentCount ?? 0}
                    </div>
                    <div className="text-[10px] text-horse-gray-400 font-medium">Contenidos</div>
                  </div>
                  <div className="bg-horse-gray-100 rounded-lg py-2">
                    <div className="text-[11px] font-medium text-horse-gray-500 mt-1">
                      {instance.stats?.lastProcessedAt
                        ? new Date(instance.stats.lastProcessedAt).toLocaleDateString("es-AR", { day: "numeric", month: "short" })
                        : "—"}
                    </div>
                    <div className="text-[10px] text-horse-gray-400 font-medium">Último proceso</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/src/app/\(app\)/dashboard/
git commit -m "feat: add dashboard page with instance cards grid"
```

---

## Chunk 7: Create Instance Page

### Task 15: Create instance form

**Files:**
- Create: `intelligence-hub-app/src/app/(app)/instances/new/page.tsx`

- [ ] **Step 1: Create instance form page**

```tsx
"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export default function NewInstancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    clientName: "",
    role: "",
    company: "",
    industry: "",
  });

  const update = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await api.post<{ instance: Instance }>("/instances", form);
      router.push(`/instances/${data.instance.id}/content`);
    } catch (err: unknown) {
      const message = err && typeof err === "object" && "message" in err ? (err as { message: string }).message : "Error al crear instancia";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const fields = [
    { key: "name", label: "Nombre de la instancia", placeholder: "Ej: Martín LinkedIn Q1" },
    { key: "clientName", label: "Nombre del cliente", placeholder: "Ej: Martín Rodríguez" },
    { key: "role", label: "Cargo / Rol", placeholder: "Ej: CEO" },
    { key: "company", label: "Empresa", placeholder: "Ej: AutomatizaPYME" },
    { key: "industry", label: "Industria", placeholder: "Ej: Tecnología / Automatización" },
  ];

  return (
    <div>
      <div className="h-[68px] border-b border-horse-gray-200 flex items-center px-8 bg-white">
        <h1 className="text-lg font-semibold text-horse-black">Nueva instancia</h1>
      </div>

      <div className="p-8 max-w-lg">
        <div className="bg-white border border-horse-gray-200 rounded-xl p-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map((f) => (
              <div key={f.key}>
                <label className="block text-sm font-medium text-horse-gray-700 mb-1">{f.label}</label>
                <input
                  type="text"
                  value={form[f.key as keyof typeof form]}
                  onChange={(e) => update(f.key, e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-horse-gray-200 rounded-lg text-sm focus:outline-none focus:border-horse-dark"
                  placeholder={f.placeholder}
                />
              </div>
            ))}

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creando..." : "Crear instancia"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/src/app/\(app\)/instances/
git commit -m "feat: add create instance page with form"
```

---

## Chunk 8: Instance Layout (Topbar + Tabs)

### Task 16: InstanceTopbar component

**Files:**
- Create: `intelligence-hub-app/src/components/InstanceTopbar.tsx`

- [ ] **Step 1: Create topbar matching mockup**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Instance } from "@/lib/types";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/Button";

interface InstanceTopbarProps {
  instance: Instance;
}

export function InstanceTopbar({ instance }: InstanceTopbarProps) {
  const router = useRouter();
  const [processing, setProcessing] = useState(false);

  const handleProcess = async () => {
    setProcessing(true);
    try {
      await api.post(`/instances/${instance.id}/process`);
      router.refresh();
    } catch {
      alert("Error al iniciar procesamiento");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="h-[68px] border-b border-horse-gray-200 flex items-center justify-between px-8 bg-white">
      <div className="flex items-center gap-4">
        <h1 className="text-lg font-semibold text-horse-black">{instance.clientName}</h1>
        <span className="text-[13px] text-horse-gray-400">
          {instance.company}
        </span>
      </div>
      <div className="flex items-center gap-2.5">
        <Button variant="outline" onClick={() => router.push(`/instances/${instance.id}/inputs`)}>
          &uarr; Subir inputs
        </Button>
        <Button onClick={handleProcess} disabled={processing}>
          {processing ? "Procesando..." : "\u26A1 Procesar ahora"}
        </Button>
      </div>
    </div>
  );
}
```

---

### Task 17: InstanceTabs component

**Files:**
- Create: `intelligence-hub-app/src/components/InstanceTabs.tsx`

- [ ] **Step 1: Create tabs matching mockup**

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface InstanceTabsProps {
  instanceId: string;
  counts?: {
    content?: number;
    inputs?: number;
  };
}

export function InstanceTabs({ instanceId, counts }: InstanceTabsProps) {
  const pathname = usePathname();

  const tabs = [
    { href: `/instances/${instanceId}/content`, label: "Contenido", count: counts?.content },
    { href: `/instances/${instanceId}/inputs`, label: "Inputs", count: counts?.inputs },
    { href: `/instances/${instanceId}/insights`, label: "Insights" },
    { href: `/instances/${instanceId}/brand-voice`, label: "Brand Voice" },
    { href: `/instances/${instanceId}/history`, label: "Historial" },
  ];

  return (
    <div className="flex gap-0 border-b border-horse-gray-200 px-8 bg-white">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`px-5 py-3.5 text-sm font-medium border-b-2 transition-colors ${
              active
                ? "text-horse-black border-horse-black"
                : "text-horse-gray-400 border-transparent hover:text-horse-dark"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={`ml-1.5 px-[7px] py-[2px] rounded-[10px] text-[11px] font-semibold ${
                  active ? "bg-horse-black text-white" : "bg-horse-gray-100 text-horse-gray-500"
                }`}
              >
                {tab.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
```

---

### Task 18: Instance layout + placeholder pages

**Files:**
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/layout.tsx`
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/page.tsx`
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/content/page.tsx`
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/inputs/page.tsx`
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/insights/page.tsx`
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/brand-voice/page.tsx`
- Create: `intelligence-hub-app/src/app/(app)/instances/[id]/history/page.tsx`

- [ ] **Step 1: Create instance layout**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Instance } from "@/lib/types";
import { InstanceTopbar } from "@/components/InstanceTopbar";
import { InstanceTabs } from "@/components/InstanceTabs";

export default function InstanceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const id = params.id as string;
  const [instance, setInstance] = useState<Instance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<{ instance: Instance }>(`/instances/${id}`)
      .then((data) => setInstance(data.instance))
      .catch(() => setInstance(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-horse-gray-400 text-sm">Cargando...</span>
      </div>
    );
  }

  if (!instance) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="text-horse-gray-400 text-sm">Instancia no encontrada</span>
      </div>
    );
  }

  return (
    <div>
      <InstanceTopbar instance={instance} />
      <InstanceTabs
        instanceId={id}
        counts={{
          content: instance._count?.content,
          inputs: instance._count?.inputs,
        }}
      />
      <div className="p-6 px-8">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create instance root page (redirect to content)**

```tsx
import { redirect } from "next/navigation";

export default function InstancePage({ params }: { params: { id: string } }) {
  redirect(`/instances/${params.id}/content`);
}
```

- [ ] **Step 3: Create content placeholder page**

```tsx
export default function ContentPage() {
  return (
    <div className="text-horse-gray-400 text-sm py-10 text-center">
      Kanban de contenido — se implementa en Plan 3B.
    </div>
  );
}
```

- [ ] **Step 4: Create inputs placeholder page**

```tsx
export default function InputsPage() {
  return (
    <div className="text-horse-gray-400 text-sm py-10 text-center">
      Gestión de inputs — se implementa en Plan 3B.
    </div>
  );
}
```

- [ ] **Step 5: Create insights placeholder page**

```tsx
export default function InsightsPage() {
  return (
    <div className="text-horse-gray-400 text-sm py-10 text-center">
      Reportes de insights — se implementa en Plan 3B.
    </div>
  );
}
```

- [ ] **Step 6: Create brand-voice placeholder page**

```tsx
export default function BrandVoicePage() {
  return (
    <div className="text-horse-gray-400 text-sm py-10 text-center">
      Brand Voice — se implementa en Plan 3B.
    </div>
  );
}
```

- [ ] **Step 7: Create history placeholder page**

```tsx
export default function HistoryPage() {
  return (
    <div className="text-horse-gray-400 text-sm py-10 text-center">
      Historial de procesamiento — se implementa en Plan 3B.
    </div>
  );
}
```

---

### Task 19: Settings placeholder page

**Files:**
- Create: `intelligence-hub-app/src/app/(app)/settings/page.tsx`

- [ ] **Step 1: Create settings placeholder**

```tsx
export default function SettingsPage() {
  return (
    <div>
      <div className="h-[68px] border-b border-horse-gray-200 flex items-center px-8 bg-white">
        <h1 className="text-lg font-semibold text-horse-black">Configuración</h1>
      </div>
      <div className="p-8 text-horse-gray-400 text-sm">
        Configuración de cuenta y equipo — próximamente.
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/src/
git commit -m "feat: add instance layout with topbar, tabs, and placeholder pages"
```

---

## Chunk 9: Final Verification

### Task 20: Verify the app builds

- [ ] **Step 1: Run build**

```bash
cd /c/Proyectos/Inteligence-hub/intelligence-hub-app
npm run build
```

- [ ] **Step 2: Fix any TypeScript or build errors**

Address any errors from the build output. Common fixes:
- Import path issues: ensure `@/` alias is configured in `tsconfig.json` (`"paths": {"@/*": ["./src/*"]}`)
- Missing `use client` directives on components using hooks or browser APIs

- [ ] **Step 3: Final commit**

```bash
cd /c/Proyectos/Inteligence-hub
git add intelligence-hub-app/
git commit -m "fix: resolve build errors and verify frontend compiles"
```
