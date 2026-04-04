import { Router } from 'express';
import { ContentController } from '../controllers/content.controller';
import { authenticate } from '../middleware/auth';
import { validateBody } from '../middleware/validateRequest';
import { z } from 'zod';

export const contentRoutes = Router();

const updateStatusSchema = z.object({
  status: z.enum(['DRAFT', 'REVIEW', 'APPROVED', 'PUBLISHED']),
  approvalNotes: z.string().optional(),
});

contentRoutes.use(authenticate);
contentRoutes.get('/:id/content', ContentController.list);
contentRoutes.get('/:id/content/:contentId', ContentController.getById);
contentRoutes.patch('/:id/content/:contentId', validateBody(updateStatusSchema), ContentController.updateStatus);
contentRoutes.put('/:id/content/:contentId', ContentController.update);
