import { Router } from 'express';
import { CostController } from '../controllers/cost.controller';
import { authenticate } from '../middleware/auth';

export const costRoutes = Router();
costRoutes.use(authenticate);
costRoutes.get('/:id/costs', CostController.getByInstance);
