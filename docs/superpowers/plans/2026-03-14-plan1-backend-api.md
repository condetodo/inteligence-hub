# Plan 1: Backend API Foundation

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the intelligence-hub-api backend with database schema, authentication, and all CRUD endpoints so agents and frontend can connect to it.

**Architecture:** Express.js REST API with Prisma ORM on PostgreSQL. JWT-based auth with bcrypt password hashing. Organized by domain (routes → controllers → services). Deployed to Railway.

**Tech Stack:** Node.js 20, TypeScript, Express, Prisma, PostgreSQL, bcryptjs, jsonwebtoken, zod (validation), cors, dotenv

**Spec:** `docs/superpowers/specs/2026-03-14-intelligence-hub-design.md`

---

## File Structure

```
intelligence-hub-api/
├── package.json
├── tsconfig.json
├── .env.example
├── .gitignore
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── index.ts                    ← Express app entry point
│   ├── config/
│   │   └── env.ts                  ← Environment variables with validation
│   ├── middleware/
│   │   ├── auth.ts                 ← JWT verification middleware
│   │   ├── errorHandler.ts         ← Global error handler
│   │   └── validateRequest.ts      ← Zod validation middleware
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   ├── instances.routes.ts
│   │   ├── brandVoice.routes.ts
│   │   ├── inputs.routes.ts
│   │   ├── content.routes.ts
│   │   ├── insights.routes.ts
│   │   ├── corpus.routes.ts
│   │   └── processing.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── instances.controller.ts
│   │   ├── brandVoice.controller.ts
│   │   ├── inputs.controller.ts
│   │   ├── content.controller.ts
│   │   ├── insights.controller.ts
│   │   ├── corpus.controller.ts
│   │   └── processing.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── instances.service.ts
│   │   ├── brandVoice.service.ts
│   │   ├── inputs.service.ts
│   │   ├── content.service.ts
│   │   ├── insights.service.ts
│   │   ├── corpus.service.ts
│   │   └── processing.service.ts
│   ├── lib/
│   │   └── prisma.ts               ← Prisma client singleton
│   └── types/
│       └── express.d.ts            ← Express Request extension for auth
└── tests/
    ├── setup.ts                    ← Test setup with test DB
    ├── auth.test.ts
    ├── instances.test.ts
    ├── brandVoice.test.ts
    ├── inputs.test.ts
    ├── content.test.ts
    └── processing.test.ts
```

---

## Chunk 1: Project Setup + Database

### Task 1: Initialize Node.js project

**Files:**
- Create: `intelligence-hub-api/package.json`
- Create: `intelligence-hub-api/tsconfig.json`
- Create: `intelligence-hub-api/.gitignore`
- Create: `intelligence-hub-api/.env.example`

- [ ] **Step 1: Create project directory and initialize**

```bash
cd /c/Proyectos/Inteligence-hub
mkdir intelligence-hub-api
cd intelligence-hub-api
npm init -y
```

- [ ] **Step 2: Install dependencies**

```bash
npm install express cors dotenv bcryptjs jsonwebtoken zod @prisma/client node-cron
npm install -D typescript @types/node @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/node-cron prisma ts-node tsx vitest supertest @types/supertest
```

- [ ] **Step 3: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*", "prisma/**/*", "tests/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create .gitignore**

```
node_modules/
dist/
.env
*.log
```

- [ ] **Step 5: Create .env.example**

```env
DATABASE_URL="postgresql://user:password@localhost:5432/intelligence_hub?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
NODE_ENV="development"
```

- [ ] **Step 6: Add scripts to package.json**

Update the `scripts` section of `package.json`:

```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio",
    "test": "vitest run",
    "test:watch": "vitest"
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add intelligence-hub-api/
git commit -m "feat: initialize intelligence-hub-api project with TypeScript and dependencies"
```

---

### Task 2: Prisma Schema

**Files:**
- Create: `intelligence-hub-api/prisma/schema.prisma`

- [ ] **Step 1: Create Prisma schema with all 9 models**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  ADMIN
  OPERATOR
}

enum InstanceStatus {
  ACTIVE
  PAUSED
  ARCHIVED
}

enum InputType {
  WHATSAPP
  EMAIL
  AUDIO
  NOTE
  INTERVIEW
}

enum InputStatus {
  PENDING
  PROCESSED
}

enum Platform {
  LINKEDIN
  X
  TIKTOK
  BLOG
}

enum ContentType {
  POST
  THREAD
  SCRIPT
  ARTICLE
}

enum ContentStatus {
  DRAFT
  REVIEW
  APPROVED
  PUBLISHED
}

enum RunStatus {
  RUNNING
  COMPLETED
  FAILED
}

enum RunTrigger {
  CRON
  MANUAL
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  password  String
  name      String
  role      UserRole   @default(OPERATOR)
  createdAt DateTime   @default(now())
  instances UserInstance[]
}

model Instance {
  id          String         @id @default(cuid())
  name        String
  clientName  String
  clientRole  String
  company     String
  industry    String
  status      InstanceStatus @default(ACTIVE)
  driveFolder String?
  createdAt   DateTime       @default(now())
  users       UserInstance[]
  brandVoice  BrandVoice?
  inputs      InputFile[]
  corpus      WeeklyCorpus[]
  content     ContentOutput[]
  insights    InsightReport[]
  runs        ProcessingRun[]
}

model UserInstance {
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId     String
  instance   Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId String
  assignedAt DateTime @default(now())

  @@id([userId, instanceId])
}

model BrandVoice {
  id               String   @id @default(cuid())
  instance         Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId       String   @unique
  identity         String   @default("")
  valueProposition String   @default("")
  audience         String   @default("")
  voiceTone        Json     @default("{}")
  recurringTopics  Json     @default("[]")
  positioning      String   @default("")
  metrics          String   @default("")
  insightHistory   Json     @default("[]")
  updatedAt        DateTime @updatedAt
}

model InputFile {
  id          String      @id @default(cuid())
  instance    Instance    @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId  String
  type        InputType
  filename    String
  content     String
  status      InputStatus @default(PENDING)
  uploadedAt  DateTime    @default(now())
  processedAt DateTime?
}

model WeeklyCorpus {
  id            String   @id @default(cuid())
  instance      Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId    String
  weekNumber    Int
  year          Int
  summary       Json     @default("{}")
  topics        Json     @default("[]")
  decisions     Json     @default("[]")
  concerns      Json     @default("[]")
  opportunities Json     @default("[]")
  createdAt     DateTime @default(now())

  @@unique([instanceId, weekNumber, year])
}

model ContentOutput {
  id          String        @id @default(cuid())
  instance    Instance      @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId  String
  weekNumber  Int
  year        Int
  platform    Platform
  type        ContentType
  title       String
  content     String
  imageUrl    String?
  imagePrompt String?
  variant     String        @default("A")
  status      ContentStatus @default(DRAFT)
  engagement  Json?
  createdAt   DateTime      @default(now())
}

model InsightReport {
  id               String   @id @default(cuid())
  instance         Instance @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId       String
  weekNumber       Int
  year             Int
  executiveSummary String
  topTopics        Json
  opportunity      String
  evolution        String
  questions        Json
  recommendations  String
  createdAt        DateTime @default(now())

  @@unique([instanceId, weekNumber, year])
}

model ProcessingRun {
  id          String     @id @default(cuid())
  instance    Instance   @relation(fields: [instanceId], references: [id], onDelete: Cascade)
  instanceId  String
  weekNumber  Int
  year        Int
  status      RunStatus  @default(RUNNING)
  steps       Json       @default("{}")
  startedAt   DateTime   @default(now())
  completedAt DateTime?
  triggeredBy RunTrigger
}
```

- [ ] **Step 2: Create Prisma client singleton**

Create `intelligence-hub-api/src/lib/prisma.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

- [ ] **Step 3: Set up .env with local database URL**

Create `intelligence-hub-api/.env` (copy from `.env.example` and set real DATABASE_URL).

- [ ] **Step 4: Generate Prisma client and push schema**

```bash
cd intelligence-hub-api
npx prisma generate
npx prisma db push
```

Expected: Schema synced to database, no errors.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/prisma/ intelligence-hub-api/src/lib/prisma.ts
git commit -m "feat: add Prisma schema with all 9 models"
```

---

### Task 3: Express App + Config + Middleware

**Files:**
- Create: `intelligence-hub-api/src/config/env.ts`
- Create: `intelligence-hub-api/src/middleware/errorHandler.ts`
- Create: `intelligence-hub-api/src/middleware/auth.ts`
- Create: `intelligence-hub-api/src/middleware/validateRequest.ts`
- Create: `intelligence-hub-api/src/types/express.d.ts`
- Create: `intelligence-hub-api/src/index.ts`

- [ ] **Step 1: Create env config with validation**

Create `intelligence-hub-api/src/config/env.ts`:

```typescript
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string().min(10),
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

- [ ] **Step 2: Create Express type extension**

Create `intelligence-hub-api/src/types/express.d.ts`:

```typescript
import { UserRole } from '@prisma/client';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userRole?: UserRole;
    }
  }
}
```

- [ ] **Step 3: Create error handler middleware**

Create `intelligence-hub-api/src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}
```

- [ ] **Step 4: Create auth middleware**

Create `intelligence-hub-api/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './errorHandler';

interface JwtPayload {
  userId: string;
  role: string;
}

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required');
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    req.userId = payload.userId;
    req.userRole = payload.role as any;
    next();
  } catch {
    throw new AppError(401, 'Invalid or expired token');
  }
}
```

- [ ] **Step 5: Create validation middleware**

Create `intelligence-hub-api/src/middleware/validateRequest.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from './errorHandler';

export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      throw new AppError(400, message);
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      throw new AppError(400, message);
    }
    req.query = result.data;
    next();
  };
}
```

- [ ] **Step 6: Create Express app entry point**

Create `intelligence-hub-api/src/index.ts`:

```typescript
import express from 'express';
import cors from 'cors';
import { env } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRoutes } from './routes/auth.routes';
import { instancesRoutes } from './routes/instances.routes';
import { brandVoiceRoutes } from './routes/brandVoice.routes';
import { inputsRoutes } from './routes/inputs.routes';
import { contentRoutes } from './routes/content.routes';
import { insightsRoutes } from './routes/insights.routes';
import { corpusRoutes } from './routes/corpus.routes';
import { processingRoutes } from './routes/processing.routes';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/instances', instancesRoutes);
app.use('/api/instances', brandVoiceRoutes);
app.use('/api/instances', inputsRoutes);
app.use('/api/instances', contentRoutes);
app.use('/api/instances', insightsRoutes);
app.use('/api/instances', corpusRoutes);
app.use('/api/instances', processingRoutes);

// Error handler (must be last)
app.use(errorHandler);

app.listen(Number(env.PORT), () => {
  console.log(`Intelligence Hub API running on port ${env.PORT}`);
});

export { app };
```

Note: Route files will be created in subsequent tasks. Create placeholder files first so the app compiles. Each route file should export an empty Router for now.

- [ ] **Step 7: Create placeholder route files**

Create each route file in `intelligence-hub-api/src/routes/` with this pattern:

```typescript
// auth.routes.ts (and similarly for all 8 route files)
import { Router } from 'express';
export const authRoutes = Router();
```

Do the same for: `instances.routes.ts`, `brandVoice.routes.ts`, `inputs.routes.ts`, `content.routes.ts`, `insights.routes.ts`, `corpus.routes.ts`, `processing.routes.ts`.

- [ ] **Step 8: Verify app starts**

```bash
cd intelligence-hub-api
npm run dev
```

Expected: "Intelligence Hub API running on port 3001"

Test health endpoint:
```bash
curl http://localhost:3001/api/health
```

Expected: `{"status":"ok","timestamp":"..."}`

- [ ] **Step 9: Commit**

```bash
git add intelligence-hub-api/src/
git commit -m "feat: add Express app with config, middleware, and placeholder routes"
```

---

## Chunk 2: Auth + Instances CRUD

### Task 4: Auth Service + Routes (register, login, me)

**Files:**
- Create: `intelligence-hub-api/src/services/auth.service.ts`
- Create: `intelligence-hub-api/src/controllers/auth.controller.ts`
- Modify: `intelligence-hub-api/src/routes/auth.routes.ts`
- Create: `intelligence-hub-api/tests/setup.ts`
- Create: `intelligence-hub-api/tests/auth.test.ts`

- [ ] **Step 1: Create test setup**

Create `intelligence-hub-api/tests/setup.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function cleanDatabase() {
  await prisma.processingRun.deleteMany();
  await prisma.insightReport.deleteMany();
  await prisma.contentOutput.deleteMany();
  await prisma.weeklyCorpus.deleteMany();
  await prisma.inputFile.deleteMany();
  await prisma.brandVoice.deleteMany();
  await prisma.userInstance.deleteMany();
  await prisma.instance.deleteMany();
  await prisma.user.deleteMany();
}

export { prisma };
```

- [ ] **Step 2: Write failing auth tests**

Create `intelligence-hub-api/tests/auth.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { cleanDatabase } from './setup';

describe('Auth API', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      expect(res.status).toBe(201);
      expect(res.body.user.email).toBe('test@horse.io');
      expect(res.body.token).toBeDefined();
      expect(res.body.user.password).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password456', name: 'Other User' });

      expect(res.status).toBe(409);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@horse.io', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
    });

    it('should reject invalid password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@horse.io', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const registerRes = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${registerRes.body.token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('test@horse.io');
    });

    it('should reject request without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
cd intelligence-hub-api
npx vitest run tests/auth.test.ts
```

Expected: All tests FAIL.

- [ ] **Step 4: Create auth service**

Create `intelligence-hub-api/src/services/auth.service.ts`:

```typescript
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { AppError } from '../middleware/errorHandler';

export class AuthService {
  static async register(email: string, password: string, name: string) {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AppError(409, 'Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name },
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async login(email: string, password: string) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new AppError(401, 'Invalid credentials');
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      throw new AppError(401, 'Invalid credentials');
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      env.JWT_SECRET,
      { expiresIn: '7d' },
    );

    const { password: _, ...userWithoutPassword } = user;
    return { user: userWithoutPassword, token };
  }

  static async me(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}
```

- [ ] **Step 5: Create auth controller**

Create `intelligence-hub-api/src/controllers/auth.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';

export class AuthController {
  static async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password, name } = req.body;
      const result = await AuthService.register(email, password, name);
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async me(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await AuthService.me(req.userId!);
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 6: Wire up auth routes**

Update `intelligence-hub-api/src/routes/auth.routes.ts`:

```typescript
import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { z } from 'zod';

export const authRoutes = Router();

const registerSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

authRoutes.post('/register', validateBody(registerSchema), AuthController.register);
authRoutes.post('/login', validateBody(loginSchema), AuthController.login);
authRoutes.get('/me', authenticate, AuthController.me);
```

- [ ] **Step 7: Run tests to verify they pass**

```bash
npx vitest run tests/auth.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 8: Commit**

```bash
git add intelligence-hub-api/src/services/auth.service.ts intelligence-hub-api/src/controllers/auth.controller.ts intelligence-hub-api/src/routes/auth.routes.ts intelligence-hub-api/tests/
git commit -m "feat: implement auth endpoints (register, login, me) with tests"
```

---

### Task 5: Instances CRUD

**Files:**
- Create: `intelligence-hub-api/src/services/instances.service.ts`
- Create: `intelligence-hub-api/src/controllers/instances.controller.ts`
- Modify: `intelligence-hub-api/src/routes/instances.routes.ts`
- Create: `intelligence-hub-api/tests/instances.test.ts`

- [ ] **Step 1: Write failing instances tests**

Create `intelligence-hub-api/tests/instances.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { cleanDatabase } from './setup';

let token: string;

async function createAuthUser() {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'test@horse.io', password: 'password123', name: 'Test User' });
  return res.body.token;
}

describe('Instances API', () => {
  beforeEach(async () => {
    await cleanDatabase();
    token = await createAuthUser();
  });

  describe('POST /api/instances', () => {
    it('should create a new instance with brand voice', async () => {
      const res = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Francisco P.',
          clientName: 'Francisco Pérez',
          clientRole: 'Cofounder',
          company: 'Horse Consulting',
          industry: 'Technology Consulting',
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('Francisco P.');
      expect(res.body.brandVoice).toBeDefined();
    });
  });

  describe('GET /api/instances', () => {
    it('should list only instances assigned to the user', async () => {
      await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .get('/api/instances')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].name).toBe('Client 1');
    });
  });

  describe('GET /api/instances/:id', () => {
    it('should return instance detail', async () => {
      const createRes = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .get(`/api/instances/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.clientName).toBe('Client One');
      expect(res.body.brandVoice).toBeDefined();
    });
  });

  describe('PUT /api/instances/:id', () => {
    it('should update an instance', async () => {
      const createRes = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .put(`/api/instances/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated Name' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
    });
  });

  describe('DELETE /api/instances/:id', () => {
    it('should archive an instance', async () => {
      const createRes = await request(app)
        .post('/api/instances')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: 'Client 1',
          clientName: 'Client One',
          clientRole: 'CEO',
          company: 'Company 1',
          industry: 'Tech',
        });

      const res = await request(app)
        .delete(`/api/instances/${createRes.body.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ARCHIVED');
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run tests/instances.test.ts
```

Expected: All tests FAIL.

- [ ] **Step 3: Create instances service**

Create `intelligence-hub-api/src/services/instances.service.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class InstancesService {
  static async create(
    userId: string,
    data: {
      name: string;
      clientName: string;
      clientRole: string;
      company: string;
      industry: string;
    },
  ) {
    const instance = await prisma.instance.create({
      data: {
        ...data,
        users: { create: { userId } },
        brandVoice: { create: {} },
      },
      include: { brandVoice: true },
    });
    return instance;
  }

  static async list(userId: string) {
    const instances = await prisma.instance.findMany({
      where: {
        users: { some: { userId } },
        status: { not: 'ARCHIVED' },
      },
      include: {
        _count: {
          select: {
            inputs: { where: { status: 'PENDING' } },
            content: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return instances;
  }

  static async getById(userId: string, instanceId: string) {
    const instance = await prisma.instance.findFirst({
      where: {
        id: instanceId,
        users: { some: { userId } },
      },
      include: { brandVoice: true },
    });
    if (!instance) {
      throw new AppError(404, 'Instance not found');
    }
    return instance;
  }

  static async update(
    userId: string,
    instanceId: string,
    data: Partial<{
      name: string;
      clientName: string;
      clientRole: string;
      company: string;
      industry: string;
    }>,
  ) {
    // Verify access
    await InstancesService.getById(userId, instanceId);

    const updated = await prisma.instance.update({
      where: { id: instanceId },
      data,
    });
    return updated;
  }

  static async archive(userId: string, instanceId: string) {
    // Verify access
    await InstancesService.getById(userId, instanceId);

    const archived = await prisma.instance.update({
      where: { id: instanceId },
      data: { status: 'ARCHIVED' },
    });
    return archived;
  }
}
```

- [ ] **Step 4: Create instances controller**

Create `intelligence-hub-api/src/controllers/instances.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { InstancesService } from '../services/instances.service';

export class InstancesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.create(req.userId!, req.body);
      res.status(201).json(instance);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const instances = await InstancesService.list(req.userId!);
      res.json(instances);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.getById(req.userId!, req.params.id);
      res.json(instance);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.update(req.userId!, req.params.id, req.body);
      res.json(instance);
    } catch (error) {
      next(error);
    }
  }

  static async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.archive(req.userId!, req.params.id);
      res.json(instance);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 5: Wire up instances routes**

Update `intelligence-hub-api/src/routes/instances.routes.ts`:

```typescript
import { Router } from 'express';
import { InstancesController } from '../controllers/instances.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { z } from 'zod';

export const instancesRoutes = Router();

const createInstanceSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  clientRole: z.string().min(1),
  company: z.string().min(1),
  industry: z.string().min(1),
});

const updateInstanceSchema = z.object({
  name: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientRole: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
});

instancesRoutes.use(authenticate);
instancesRoutes.post('/', validateBody(createInstanceSchema), InstancesController.create);
instancesRoutes.get('/', InstancesController.list);
instancesRoutes.get('/:id', InstancesController.getById);
instancesRoutes.put('/:id', validateBody(updateInstanceSchema), InstancesController.update);
instancesRoutes.delete('/:id', InstancesController.archive);
```

- [ ] **Step 6: Run tests to verify they pass**

```bash
npx vitest run tests/instances.test.ts
```

Expected: All 5 tests PASS.

- [ ] **Step 7: Commit**

```bash
git add intelligence-hub-api/src/services/instances.service.ts intelligence-hub-api/src/controllers/instances.controller.ts intelligence-hub-api/src/routes/instances.routes.ts intelligence-hub-api/tests/instances.test.ts
git commit -m "feat: implement instances CRUD with tests"
```

---

## Chunk 3: Domain Endpoints (Brand Voice, Inputs, Content, Insights, Corpus, Processing)

### Task 6: Brand Voice Endpoints

**Files:**
- Create: `intelligence-hub-api/src/services/brandVoice.service.ts`
- Create: `intelligence-hub-api/src/controllers/brandVoice.controller.ts`
- Modify: `intelligence-hub-api/src/routes/brandVoice.routes.ts`

- [ ] **Step 1: Create brand voice service**

Create `intelligence-hub-api/src/services/brandVoice.service.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class BrandVoiceService {
  static async get(instanceId: string) {
    const brandVoice = await prisma.brandVoice.findUnique({
      where: { instanceId },
    });
    if (!brandVoice) {
      throw new AppError(404, 'Brand voice not found');
    }
    return brandVoice;
  }

  static async update(
    instanceId: string,
    data: Partial<{
      identity: string;
      valueProposition: string;
      audience: string;
      voiceTone: any;
      recurringTopics: any;
      positioning: string;
      metrics: string;
      insightHistory: any;
    }>,
  ) {
    const brandVoice = await prisma.brandVoice.update({
      where: { instanceId },
      data,
    });
    return brandVoice;
  }
}
```

- [ ] **Step 2: Create brand voice controller**

Create `intelligence-hub-api/src/controllers/brandVoice.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { BrandVoiceService } from '../services/brandVoice.service';

export class BrandVoiceController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const brandVoice = await BrandVoiceService.get(req.params.id);
      res.json(brandVoice);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const brandVoice = await BrandVoiceService.update(req.params.id, req.body);
      res.json(brandVoice);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 3: Wire up brand voice routes**

Update `intelligence-hub-api/src/routes/brandVoice.routes.ts`:

```typescript
import { Router } from 'express';
import { BrandVoiceController } from '../controllers/brandVoice.controller';
import { authenticate } from '../middleware/auth';

export const brandVoiceRoutes = Router();

brandVoiceRoutes.use(authenticate);
brandVoiceRoutes.get('/:id/brand-voice', BrandVoiceController.get);
brandVoiceRoutes.put('/:id/brand-voice', BrandVoiceController.update);
```

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-api/src/services/brandVoice.service.ts intelligence-hub-api/src/controllers/brandVoice.controller.ts intelligence-hub-api/src/routes/brandVoice.routes.ts
git commit -m "feat: implement brand voice GET and PUT endpoints"
```

---

### Task 7: Inputs Endpoints

**Files:**
- Create: `intelligence-hub-api/src/services/inputs.service.ts`
- Create: `intelligence-hub-api/src/controllers/inputs.controller.ts`
- Modify: `intelligence-hub-api/src/routes/inputs.routes.ts`

- [ ] **Step 1: Create inputs service**

Create `intelligence-hub-api/src/services/inputs.service.ts`:

```typescript
import { InputType } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class InputsService {
  static async list(instanceId: string, status?: string) {
    const where: any = { instanceId };
    if (status) where.status = status;

    return prisma.inputFile.findMany({
      where,
      orderBy: { uploadedAt: 'desc' },
    });
  }

  static async create(
    instanceId: string,
    data: { type: InputType; filename: string; content: string },
  ) {
    return prisma.inputFile.create({
      data: { ...data, instanceId },
    });
  }

  static async delete(instanceId: string, inputId: string) {
    const input = await prisma.inputFile.findFirst({
      where: { id: inputId, instanceId },
    });
    if (!input) {
      throw new AppError(404, 'Input not found');
    }
    await prisma.inputFile.delete({ where: { id: inputId } });
    return { deleted: true };
  }
}
```

- [ ] **Step 2: Create inputs controller**

Create `intelligence-hub-api/src/controllers/inputs.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { InputsService } from '../services/inputs.service';

export class InputsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const inputs = await InputsService.list(
        req.params.id,
        req.query.status as string | undefined,
      );
      res.json(inputs);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = await InputsService.create(req.params.id, req.body);
      res.status(201).json(input);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InputsService.delete(req.params.id, req.params.inputId);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 3: Wire up inputs routes**

Update `intelligence-hub-api/src/routes/inputs.routes.ts`:

```typescript
import { Router } from 'express';
import { InputsController } from '../controllers/inputs.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { z } from 'zod';

export const inputsRoutes = Router();

const createInputSchema = z.object({
  type: z.enum(['WHATSAPP', 'EMAIL', 'AUDIO', 'NOTE', 'INTERVIEW']),
  filename: z.string().min(1),
  content: z.string().min(1),
});

inputsRoutes.use(authenticate);
inputsRoutes.get('/:id/inputs', InputsController.list);
inputsRoutes.post('/:id/inputs', validateBody(createInputSchema), InputsController.create);
inputsRoutes.delete('/:id/inputs/:inputId', InputsController.delete);
```

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-api/src/services/inputs.service.ts intelligence-hub-api/src/controllers/inputs.controller.ts intelligence-hub-api/src/routes/inputs.routes.ts
git commit -m "feat: implement inputs endpoints (list, create, delete)"
```

---

### Task 8: Content Endpoints

**Files:**
- Create: `intelligence-hub-api/src/services/content.service.ts`
- Create: `intelligence-hub-api/src/controllers/content.controller.ts`
- Modify: `intelligence-hub-api/src/routes/content.routes.ts`

- [ ] **Step 1: Create content service**

Create `intelligence-hub-api/src/services/content.service.ts`:

```typescript
import { ContentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class ContentService {
  static async list(
    instanceId: string,
    filters?: { week?: number; year?: number; platform?: string; status?: string },
  ) {
    const where: any = { instanceId };
    if (filters?.week) where.weekNumber = Number(filters.week);
    if (filters?.year) where.year = Number(filters.year);
    if (filters?.platform) where.platform = filters.platform;
    if (filters?.status) where.status = filters.status;

    return prisma.contentOutput.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  static async getById(instanceId: string, contentId: string) {
    const content = await prisma.contentOutput.findFirst({
      where: { id: contentId, instanceId },
    });
    if (!content) {
      throw new AppError(404, 'Content not found');
    }
    return content;
  }

  static async updateStatus(instanceId: string, contentId: string, status: ContentStatus) {
    await ContentService.getById(instanceId, contentId);
    return prisma.contentOutput.update({
      where: { id: contentId },
      data: { status },
    });
  }

  static async update(
    instanceId: string,
    contentId: string,
    data: Partial<{ title: string; content: string; status: ContentStatus }>,
  ) {
    await ContentService.getById(instanceId, contentId);
    return prisma.contentOutput.update({
      where: { id: contentId },
      data,
    });
  }
}
```

- [ ] **Step 2: Create content controller**

Create `intelligence-hub-api/src/controllers/content.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';

export class ContentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.list(req.params.id, req.query as any);
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.getById(req.params.id, req.params.contentId);
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.updateStatus(
        req.params.id,
        req.params.contentId,
        req.body.status,
      );
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.update(
        req.params.id,
        req.params.contentId,
        req.body,
      );
      res.json(content);
    } catch (error) {
      next(error);
    }
  }
}
```

- [ ] **Step 3: Wire up content routes**

Update `intelligence-hub-api/src/routes/content.routes.ts`:

```typescript
import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { z } from 'zod';

export const contentRoutes = Router();

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED']),
});

contentRoutes.use(authenticate);
contentRoutes.get('/:id/content', ContentController.list);
contentRoutes.get('/:id/content/:contentId', ContentController.getById);
contentRoutes.patch('/:id/content/:contentId', validateBody(updateStatusSchema), ContentController.updateStatus);
contentRoutes.put('/:id/content/:contentId', ContentController.update);
```

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-api/src/services/content.service.ts intelligence-hub-api/src/controllers/content.controller.ts intelligence-hub-api/src/routes/content.routes.ts
git commit -m "feat: implement content endpoints (list, get, patch status, update)"
```

---

### Task 9: Insights + Corpus + Processing Endpoints

**Files:**
- Create: `intelligence-hub-api/src/services/insights.service.ts`
- Create: `intelligence-hub-api/src/controllers/insights.controller.ts`
- Modify: `intelligence-hub-api/src/routes/insights.routes.ts`
- Create: `intelligence-hub-api/src/services/corpus.service.ts`
- Create: `intelligence-hub-api/src/controllers/corpus.controller.ts`
- Modify: `intelligence-hub-api/src/routes/corpus.routes.ts`
- Create: `intelligence-hub-api/src/services/processing.service.ts`
- Create: `intelligence-hub-api/src/controllers/processing.controller.ts`
- Modify: `intelligence-hub-api/src/routes/processing.routes.ts`

- [ ] **Step 1: Create insights service + controller + routes**

Create `intelligence-hub-api/src/services/insights.service.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class InsightsService {
  static async list(instanceId: string) {
    return prisma.insightReport.findMany({
      where: { instanceId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
  }

  static async getByWeek(instanceId: string, week: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const report = await prisma.insightReport.findUnique({
      where: {
        instanceId_weekNumber_year: {
          instanceId,
          weekNumber: week,
          year: currentYear,
        },
      },
    });
    if (!report) {
      throw new AppError(404, 'Insight report not found');
    }
    return report;
  }
}
```

Create `intelligence-hub-api/src/controllers/insights.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { InsightsService } from '../services/insights.service';

export class InsightsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const insights = await InsightsService.list(req.params.id);
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }

  static async getByWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const week = Number(req.params.week);
      const year = req.query.year ? Number(req.query.year) : undefined;
      const report = await InsightsService.getByWeek(req.params.id, week, year);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}
```

Update `intelligence-hub-api/src/routes/insights.routes.ts`:

```typescript
import { Router } from 'express';
import { InsightsController } from '../controllers/insights.controller';
import { authenticate } from '../middleware/auth';

export const insightsRoutes = Router();

insightsRoutes.use(authenticate);
insightsRoutes.get('/:id/insights', InsightsController.list);
insightsRoutes.get('/:id/insights/:week', InsightsController.getByWeek);
```

- [ ] **Step 2: Create corpus service + controller + routes**

Create `intelligence-hub-api/src/services/corpus.service.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

export class CorpusService {
  static async list(instanceId: string) {
    return prisma.weeklyCorpus.findMany({
      where: { instanceId },
      orderBy: [{ year: 'desc' }, { weekNumber: 'desc' }],
    });
  }

  static async getByWeek(instanceId: string, week: number, year?: number) {
    const currentYear = year || new Date().getFullYear();
    const corpus = await prisma.weeklyCorpus.findUnique({
      where: {
        instanceId_weekNumber_year: {
          instanceId,
          weekNumber: week,
          year: currentYear,
        },
      },
    });
    if (!corpus) {
      throw new AppError(404, 'Corpus not found');
    }
    return corpus;
  }
}
```

Create `intelligence-hub-api/src/controllers/corpus.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { CorpusService } from '../services/corpus.service';

export class CorpusController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const corpus = await CorpusService.list(req.params.id);
      res.json(corpus);
    } catch (error) {
      next(error);
    }
  }

  static async getByWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const week = Number(req.params.week);
      const year = req.query.year ? Number(req.query.year) : undefined;
      const corpus = await CorpusService.getByWeek(req.params.id, week, year);
      res.json(corpus);
    } catch (error) {
      next(error);
    }
  }
}
```

Update `intelligence-hub-api/src/routes/corpus.routes.ts`:

```typescript
import { Router } from 'express';
import { CorpusController } from '../controllers/corpus.controller';
import { authenticate } from '../middleware/auth';

export const corpusRoutes = Router();

corpusRoutes.use(authenticate);
corpusRoutes.get('/:id/corpus', CorpusController.list);
corpusRoutes.get('/:id/corpus/:week', CorpusController.getByWeek);
```

- [ ] **Step 3: Create processing service + controller + routes**

Create `intelligence-hub-api/src/services/processing.service.ts`:

```typescript
import { prisma } from '../lib/prisma';
import { AppError } from '../middleware/errorHandler';

// Helper to get ISO week number
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

export class ProcessingService {
  static async trigger(instanceId: string) {
    const now = new Date();
    const weekNumber = getWeekNumber(now);
    const year = now.getFullYear();

    // Check if already running
    const existing = await prisma.processingRun.findFirst({
      where: { instanceId, status: 'RUNNING' },
    });
    if (existing) {
      throw new AppError(409, 'A processing run is already in progress');
    }

    const run = await prisma.processingRun.create({
      data: {
        instanceId,
        weekNumber,
        year,
        triggeredBy: 'MANUAL',
        steps: {
          corpus: 'pending',
          brandVoice: 'pending',
          content: 'pending',
          insights: 'pending',
          distribution: 'pending',
        },
      },
    });

    // The actual orchestration will be called here in Plan 2
    // For now, just return the run ID for polling
    return run;
  }

  static async listRuns(instanceId: string) {
    return prisma.processingRun.findMany({
      where: { instanceId },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });
  }

  static async getRun(instanceId: string, runId: string) {
    const run = await prisma.processingRun.findFirst({
      where: { id: runId, instanceId },
    });
    if (!run) {
      throw new AppError(404, 'Processing run not found');
    }
    return run;
  }
}
```

Create `intelligence-hub-api/src/controllers/processing.controller.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import { ProcessingService } from '../services/processing.service';

export class ProcessingController {
  static async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await ProcessingService.trigger(req.params.id);
      res.status(202).json(run);
    } catch (error) {
      next(error);
    }
  }

  static async listRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const runs = await ProcessingService.listRuns(req.params.id);
      res.json(runs);
    } catch (error) {
      next(error);
    }
  }

  static async getRun(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await ProcessingService.getRun(req.params.id, req.params.runId);
      res.json(run);
    } catch (error) {
      next(error);
    }
  }
}
```

Update `intelligence-hub-api/src/routes/processing.routes.ts`:

```typescript
import { Router } from 'express';
import { ProcessingController } from '../controllers/processing.controller';
import { authenticate } from '../middleware/auth';

export const processingRoutes = Router();

processingRoutes.use(authenticate);
processingRoutes.post('/:id/process', ProcessingController.trigger);
processingRoutes.get('/:id/runs', ProcessingController.listRuns);
processingRoutes.get('/:id/runs/:runId', ProcessingController.getRun);
```

- [ ] **Step 4: Verify app compiles and starts**

```bash
cd intelligence-hub-api
npm run dev
```

Expected: "Intelligence Hub API running on port 3001" — no compile errors.

- [ ] **Step 5: Commit**

```bash
git add intelligence-hub-api/src/services/ intelligence-hub-api/src/controllers/ intelligence-hub-api/src/routes/
git commit -m "feat: implement insights, corpus, and processing endpoints"
```

---

## Chunk 4: Seed Data + Final Verification

### Task 10: Seed Script with Francisco Demo Data

**Files:**
- Create: `intelligence-hub-api/prisma/seed.ts`

- [ ] **Step 1: Create seed script**

Create `intelligence-hub-api/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const hashedPassword = await bcrypt.hash('horse2026', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'francisco@horseconsulting.io' },
    update: {},
    create: {
      email: 'francisco@horseconsulting.io',
      password: hashedPassword,
      name: 'Francisco Pérez',
      role: 'ADMIN',
    },
  });
  console.log('Created admin user:', admin.email);

  // Create Francisco's instance
  const instance = await prisma.instance.create({
    data: {
      name: 'Francisco P.',
      clientName: 'Francisco Pérez',
      clientRole: 'Cofounder',
      company: 'Uanaknow / Horse Consulting',
      industry: 'Technology Consulting & AI Implementation',
      users: { create: { userId: admin.id } },
      brandVoice: {
        create: {
          identity: 'Francisco Pérez, Cofounder de Uanaknow y Horse Consulting. Experto en implementación de IA en PyMEs y empresas medianas/grandes. Mezcla assessment estratégico con ejecución táctica.',
          valueProposition: 'Ayudo a empresas a adoptar IA de forma práctica — no teoría, no humo, implementación real que mejora procesos, eficiencia y resultados. Combino visión estratégica con capacidad de ejecución técnica.',
          audience: 'CEOs y directores de operaciones de PyMEs y empresas medianas que saben que necesitan IA pero no saben por dónde empezar. Empresas que no tienen miedo al cambio y quieren iterar.',
          voiceTone: {
            adjectives: ['directo', 'estructurado', 'técnico pero accesible', 'cálido', 'sin rodeos'],
            examples: [
              'Creo que lo mejor va a ser una reunión de re-group.',
              'Haciendo un poco de autocrítica creo que en lo personal no estoy cumpliendo.',
              'De paso te dejo lo que me tiro Claude sobre los puntos a validar del proyecto.',
              'Abrazo de gol académico.',
            ],
            neverSay: [
              'Sinergia', 'Disruptivo', 'Paradigma', 'Leverage',
              'Cualquier buzzword vacío sin sustancia',
            ],
          },
          recurringTopics: [
            'Implementación práctica de IA en empresas',
            'Automatización de procesos con multi-agentes',
            'Mejora continua basada en performance de IA',
            'Adopción tecnológica en PyMEs',
            'Equipos multidisciplinarios para transformación digital',
            'Escalar operaciones sin contratar proporcionalmente',
          ],
          positioning: 'Ser reconocido como el referente en implementación real de IA para empresas — no el que habla de IA en abstracto, sino el que la pone a funcionar en procesos reales con resultados medibles.',
          metrics: 'Clientes activos, proyectos implementados, eficiencia ganada por cliente, contenido publicado con engagement real.',
          insightHistory: [],
        },
      },
    },
  });
  console.log('Created instance:', instance.name);

  // Create demo WhatsApp inputs
  const whatsappInputs = [
    {
      filename: 'whatsapp_cliente_logistica.md',
      content: `**Chat con Marcos — Dir. Operaciones, LogiPack**
Fecha: 10 Mar 2026

Francisco: Marcos, te mando el resumen de lo que hablamos. Básicamente hay 3 puntos donde la IA puede entrar ya: clasificación de pedidos, ruteo de entregas y predicción de demanda. Lo más rápido de implementar es la clasificación.

Marcos: Perfecto. La clasificación manual nos está matando, tenemos 2 personas full time haciendo eso.

Francisco: Exacto. Con un modelo bien entrenado lo resolvés en tiempo real. Te armo una PoC esta semana y la probamos con data real.

Marcos: Dale, te paso acceso al sistema mañana.

Francisco: Genial. Una cosa — no arranquemos por todo. Hagamos clasificación, medimos impacto, y después vamos por ruteo. Paso a paso.

Marcos: Me gusta. Así se lo puedo vender al directorio sin que se asusten.`,
    },
    {
      filename: 'whatsapp_socio_justi.md',
      content: `**Chat con Justiniano — Cofounder, Uanaknow**
Fecha: 11 Mar 2026

Francisco: Justi, estuve pensando en el tema Horse. Creo que el Intelligence Hub puede ser un producto en sí mismo. No solo para nosotros, para venderlo.

Justiniano: Cómo sería?

Francisco: Armamos la plataforma, la probamos con nuestros clientes, y después la vendemos como SaaS. El cliente sube su material (whatsapps, mails, notas) y el sistema le genera contenido + insights automáticamente.

Justiniano: Me gusta. Pero no nos dispersamos?

Francisco: No si lo hacemos bien. Horse es el caso de uso. Intelligence Hub es el producto. Primero lo usamos nosotros, después lo vendemos. Mismo approach que con UanaCall.

Justiniano: True. Dale, armá el MVP y lo probamos.

Francisco: Ya estoy en eso. Te muestro algo la semana que viene. Abrazo.`,
    },
    {
      filename: 'whatsapp_prospect_farmacia.md',
      content: `**Chat con Laura — Gerente Comercial, FarmaRed**
Fecha: 12 Mar 2026

Laura: Hola Francisco, nos recomendó Marcos de LogiPack. Tenemos un problema con el stock de las sucursales, siempre nos falta o nos sobra.

Francisco: Hola Laura! Sí, Marcos me comentó. Mirá, ese es un caso clásico de predicción de demanda. Cuántas sucursales tienen?

Laura: 34 en todo el país.

Francisco: OK. La solución no es compleja pero necesito entender bien el flujo. Tienen data histórica de ventas por sucursal?

Laura: Sí, como 5 años de data.

Francisco: Perfecto, con eso sobra. Te propongo algo: hacemos una call de 30 min esta semana, me mostrás el sistema que usan, y yo te digo honestamente si tiene sentido usar IA o si hay una solución más simple primero.

Laura: Me encanta que digas eso. Otros nos vendieron soluciones carísimas sin preguntar nada.

Francisco: Es que a veces la solución no es IA, es un Excel bien armado. Pero cuando sí es IA, el impacto es enorme. Coordinamos?`,
    },
    {
      filename: 'whatsapp_equipo_interno.md',
      content: `**Grupo Horse Team**
Fecha: 13 Mar 2026

Francisco: Equipo, update semanal. Tenemos 3 deals activos:
1. LogiPack — PoC de clasificación arranca esta semana
2. FarmaRed — call de discovery el jueves
3. Vanadis — esperando feedback del presupuesto

Además estoy construyendo el Intelligence Hub que va a ser nuestro producto core. Les muestro demo la semana que viene.

Ana: Genial! Necesitás algo de diseño para el demo?

Francisco: Sí, necesito que el dashboard se vea profesional. Te paso el mockup que tengo y lo mejoramos.

Cristian: Yo puedo ayudar con el backend si necesitás.

Francisco: Por ahora estoy con Claude pero la semana que viene seguro necesito pair programming para las integraciones. Gracias!`,
    },
    {
      filename: 'whatsapp_personal_papa.md',
      content: `**Chat con Papá**
Fecha: 9 Mar 2026

Francisco: Pa, cómo estás? Todo bien por ahí?

Papá: Todo bien hijo. Tu madre pregunta cuándo venís a comer.

Francisco: Este finde voy. El sábado almuerzo?

Papá: Dale. Tu hermana viene también. Cómo va el laburo?

Francisco: Bien, mucho. Estoy armando un producto nuevo que puede ser grande. Básicamente uso inteligencia artificial para generar contenido y análisis para empresas.

Papá: No entiendo mucho pero suena bien. Mientras pague las cuentas...

Francisco: Jaja sí, pa. Paga y va a pagar más. El sábado les explico. Abrazo grande.`,
    },
  ];

  for (const input of whatsappInputs) {
    await prisma.inputFile.create({
      data: { instanceId: instance.id, type: 'WHATSAPP', ...input },
    });
  }
  console.log(`Created ${whatsappInputs.length} WhatsApp inputs`);

  // Create demo email inputs
  const emailInputs = [
    {
      filename: 'email_propuesta_logipack.md',
      content: `**De:** Francisco Pérez <francisco@horseconsulting.io>
**Para:** Marcos Delgado <marcos@logipack.com>
**Asunto:** Propuesta PoC — Clasificación Inteligente de Pedidos
**Fecha:** 10 Mar 2026

Marcos,

Como hablamos, te dejo la propuesta para la PoC de clasificación de pedidos.

**Objetivo:** Automatizar la clasificación manual de pedidos usando un modelo de IA entrenado con su data histórica.

**Alcance:**
1. Análisis de data existente (1 semana)
2. Entrenamiento del modelo con datos históricos (1 semana)
3. Integración con el sistema actual vía API (1 semana)
4. Testing y ajustes con el equipo de operaciones (1 semana)

**Inversión:** USD 4.500 por la PoC completa (4 semanas)
**Resultado esperado:** Reducción del 80% del tiempo manual de clasificación.

Si los resultados son positivos, la siguiente fase sería ruteo inteligente de entregas.

Quedo atento.
Abrazo,
Francisco`,
    },
    {
      filename: 'email_seguimiento_vanadis.md',
      content: `**De:** Francisco Pérez <francisco@horseconsulting.io>
**Para:** Manuel Castro <manuel@vanadis.com>
**CC:** Justiniano Vila <justiniano@uanaknow.com>
**Asunto:** Re: Seguimiento propuesta app móvil
**Fecha:** 12 Mar 2026

Manuel,

Te hago un seguimiento de la propuesta que te mandamos hace 2 semanas. Entiendo que estos procesos llevan su tiempo, pero quería saber si tienen alguna duda o si necesitan que ajustemos algo.

Puntos clave de la propuesta:
- App móvil offline-first para comerciales de campo
- Sincronización automática cuando hay conexión
- CMS para gestión de contenido multi-marca
- Timeline estimado: 12 semanas

Si necesitás una call rápida para resolver dudas, decime y coordinamos.

Abrazo,
Francisco`,
    },
    {
      filename: 'email_post_call_farmared.md',
      content: `**De:** Francisco Pérez <francisco@horseconsulting.io>
**Para:** Laura Méndez <laura@farmared.com>
**Asunto:** Resumen call + próximos pasos — FarmaRed
**Fecha:** 13 Mar 2026

Laura,

Gracias por la call de hoy. Te resumo lo que hablamos y los próximos pasos.

**Diagnóstico:**
- El problema principal es la falta de predicción de demanda por sucursal
- Tienen 5 años de data limpia en su ERP — excelente punto de partida
- El sobre-stock les cuesta aprox. 15% del margen bruto
- El quiebre de stock les genera pérdida de clientes en las sucursales más chicas

**Mi recomendación:**
Antes de ir a IA, primero necesitamos limpiar y estructurar la data. Después, un modelo de predicción por categoría de producto + sucursal.

**Próximos pasos:**
1. Me pasan acceso de lectura al ERP (esta semana)
2. Yo hago un análisis exploratorio de la data (1 semana)
3. Les presento hallazgos + propuesta formal

Sin compromiso hasta el paso 3. Si la data no da, se los digo honestamente.

Abrazo,
Francisco`,
    },
  ];

  for (const input of emailInputs) {
    await prisma.inputFile.create({
      data: { instanceId: instance.id, type: 'EMAIL', ...input },
    });
  }
  console.log(`Created ${emailInputs.length} email inputs`);

  // Create demo note inputs
  const noteInputs = [
    {
      filename: 'nota_idea_producto.md',
      content: `**Nota: Ideas para Intelligence Hub**
Fecha: 8 Mar 2026

El sistema tiene que resolver un problema real: las empresas de consulting/marketing gastan demasiado tiempo entendiendo al cliente y generando contenido. Si automatizo eso, libero tiempo para lo que realmente importa: la estrategia.

Flujo ideal:
1. El cliente habla naturalmente (WhatsApp, calls, mails)
2. El sistema captura todo eso
3. Lo procesa y entiende quién es el cliente, qué piensa, qué le preocupa
4. Genera contenido en su voz auténtica
5. Genera insights que ni el cliente sabía de sí mismo

El diferencial vs un ChatGPT es que acá hay CONTEXTO ACUMULADO. Cada semana el sistema sabe más del cliente. No arranca de cero cada vez.

Pricing tentativo:
- Plan Starter: 1 instancia, $500/mes
- Plan Pro: 5 instancias, $2000/mes
- Plan Agency: ilimitado, $5000/mes`,
    },
    {
      filename: 'nota_reflexion_mercado.md',
      content: `**Reflexión: El estado de la adopción de IA en empresas**
Fecha: 11 Mar 2026

Vengo de 3 reuniones esta semana y el patrón es el mismo:
- Todos saben que "tienen que hacer algo con IA"
- Nadie sabe por dónde empezar
- Les da miedo gastar plata en algo que no entienden
- Las grandes consultoras les cobran fortunas por un "roadmap de IA" que es un PDF de 80 páginas que nadie lee

Ahí está la oportunidad. No vender roadmaps, vender IMPLEMENTACIÓN. Ir, hacer, medir, iterar.

Lo que me diferencia:
1. Sé de estrategia (assessment, análisis de procesos)
2. Sé de tecnología (puedo buildear lo que propongo)
3. Sé de IA (no solo usar ChatGPT, sino entender modelos, agentes, flujos)
4. Hablo el idioma del CEO y del developer

Esa combinación es rara. Hay que explotarla.`,
    },
    {
      filename: 'nota_aprendizaje_agentes.md',
      content: `**Nota: Lo que aprendí sobre multi-agentes esta semana**
Fecha: 12 Mar 2026

Estuve experimentando con arquitecturas de multi-agentes y hay algunos aprendizajes clave:

1. No todo necesita un agente. A veces un prompt bien armado alcanza.
2. Los agentes son útiles cuando hay DECISIONES intermedias — si el flujo es lineal, no tiene sentido.
3. La comunicación entre agentes es el cuello de botella. Hay que definir contratos claros (qué le pasa un agente al otro).
4. El orquestador es el componente más importante. Si está mal diseñado, todo se rompe.
5. Los agentes que corren en paralelo necesitan ser completamente independientes. Si comparten estado, problemas.

Aplicado al Intelligence Hub:
- Corpus Builder y Brand Voice son secuenciales (uno depende del otro)
- Content Agent e Insights Agent son paralelos (independientes)
- Distribution es el último paso (depende de todos los anteriores)

El pattern es: sequential → parallel → sequential. Funciona.`,
    },
    {
      filename: 'nota_competencia.md',
      content: `**Nota: Análisis de competencia**
Fecha: 9 Mar 2026

Estuve mirando qué hay en el mercado:

1. **Jasper AI / Copy.ai** — Generan contenido pero sin contexto de marca. Es genérico. No aprenden del cliente.
2. **Lately** — Repurposea contenido largo en posts cortos. Interesante pero limitado.
3. **Taplio / AuthoredUp** — Tools para LinkedIn específicamente. Buenos pero solo una plataforma.
4. **Grandes consultoras** — Hacen análisis de marca pero manual, caro, y el entregable es un PDF.

Ninguno hace las DOS cosas: contenido + inteligencia. Y ninguno tiene el modelo de "aprendizaje continuo" que yo propongo.

El Intelligence Hub NO compite con Jasper. Compite con el servicio de una agencia de marketing — pero automatizado, más barato, y que mejora cada semana.

Eso es el pitch.`,
    },
  ];

  for (const input of noteInputs) {
    await prisma.inputFile.create({
      data: { instanceId: instance.id, type: 'NOTE', ...input },
    });
  }
  console.log(`Created ${noteInputs.length} note inputs`);

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Run seed**

```bash
cd intelligence-hub-api
npm run db:seed
```

Expected output:
```
Seeding database...
Created admin user: francisco@horseconsulting.io
Created instance: Francisco P.
Created 5 WhatsApp inputs
Created 3 email inputs
Created 4 note inputs
Seed completed successfully!
```

- [ ] **Step 3: Verify via Prisma Studio**

```bash
npx prisma studio
```

Open browser, verify all tables have data.

- [ ] **Step 4: Commit**

```bash
git add intelligence-hub-api/prisma/seed.ts
git commit -m "feat: add seed script with Francisco demo data (WhatsApp, emails, notes)"
```

---

### Task 11: Full API Smoke Test

- [ ] **Step 1: Start the server and run manual tests**

```bash
cd intelligence-hub-api
npm run dev
```

Test the full flow:

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"francisco@horseconsulting.io","password":"horse2026"}'
# Save the token from the response

# List instances (replace TOKEN)
curl http://localhost:3001/api/instances \
  -H "Authorization: Bearer TOKEN"

# Get brand voice (replace INSTANCE_ID)
curl http://localhost:3001/api/instances/INSTANCE_ID/brand-voice \
  -H "Authorization: Bearer TOKEN"

# List inputs
curl http://localhost:3001/api/instances/INSTANCE_ID/inputs \
  -H "Authorization: Bearer TOKEN"

# Trigger processing
curl -X POST http://localhost:3001/api/instances/INSTANCE_ID/process \
  -H "Authorization: Bearer TOKEN"
```

Expected: All endpoints return correct data, no 500 errors.

- [ ] **Step 2: Run all tests**

```bash
npx vitest run
```

Expected: All tests pass.

- [ ] **Step 3: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve any issues found during smoke testing"
```

---

## Summary

**Plan 1 delivers:**
- Fully initialized Node.js/TypeScript project with Express
- Complete Prisma schema (9 models) synced to PostgreSQL
- JWT authentication (register, login, me)
- Full CRUD for instances with auto-created brand voice
- All domain endpoints: brand voice, inputs, content, insights, corpus, processing
- Seed script with realistic Francisco demo data
- Test suite for auth and instances

**Next plans:**
- **Plan 2:** Agent system (corpus builder, brand voice, content, insights, distribution agents + 4 skills + orchestrator + scheduler)
- **Plan 3:** Frontend dashboard (Next.js app with kanban, inputs, insights views)
