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
