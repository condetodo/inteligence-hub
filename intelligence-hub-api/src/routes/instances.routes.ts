import { Router, Request, Response, NextFunction } from 'express';
import { InstancesController } from '../controllers/instances.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { z } from 'zod';
import { prisma } from '../lib/prisma';

export const instancesRoutes = Router();

const platformConfigSchema = z.object({
  platform: z.enum(['LINKEDIN', 'X', 'TIKTOK', 'BLOG']),
  enabled: z.boolean(),
  postsPerPeriod: z.number().int().min(1).max(5),
  threadsPerPeriod: z.number().int().min(0).max(2).nullable().optional(),
});

const createInstanceSchema = z.object({
  name: z.string().min(1),
  clientName: z.string().min(1),
  clientRole: z.string().min(1),
  company: z.string().min(1),
  industry: z.string().min(1),
  processingPeriod: z.enum(['WEEKLY', 'MONTHLY']).optional(),
  activeWindow: z.number().int().min(4).max(16).optional(),
  platforms: z.array(platformConfigSchema).optional(),
});

const updateInstanceSchema = z.object({
  name: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientRole: z.string().min(1).optional(),
  company: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED"]).optional(),
});

instancesRoutes.use(authenticate);
instancesRoutes.post('/', validateBody(createInstanceSchema), InstancesController.create);
instancesRoutes.get('/', InstancesController.list);
instancesRoutes.get('/:id', InstancesController.getById);
instancesRoutes.put('/:id', validateBody(updateInstanceSchema), InstancesController.update);
instancesRoutes.delete('/:id', InstancesController.archive);

instancesRoutes.put('/:id/platforms', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id as string;
    const platforms = z.array(z.object({
      platform: z.enum(['LINKEDIN', 'X', 'TIKTOK', 'BLOG']),
      enabled: z.boolean(),
      postsPerPeriod: z.number().int().min(1).max(5),
      threadsPerPeriod: z.number().int().min(0).max(2).nullable().optional(),
    })).parse(req.body);

    const results = await Promise.all(
      platforms.map((p) =>
        prisma.instancePlatformConfig.upsert({
          where: { instanceId_platform: { instanceId: id, platform: p.platform as any } },
          update: { enabled: p.enabled, postsPerPeriod: p.postsPerPeriod, threadsPerPeriod: p.threadsPerPeriod ?? null },
          create: { instanceId: id, platform: p.platform as any, enabled: p.enabled, postsPerPeriod: p.postsPerPeriod, threadsPerPeriod: p.threadsPerPeriod ?? null },
        })
      )
    );

    res.json(results);
  } catch (error) {
    next(error);
  }
});
