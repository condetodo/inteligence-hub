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
