import { Router } from 'express';
import { InsightsController } from '../controllers/insights.controller';
import { authenticate } from '../middleware/auth';

export const insightsRoutes = Router();

insightsRoutes.use(authenticate);
insightsRoutes.get('/:id/insights', InsightsController.list);
insightsRoutes.get('/:id/insights/:week', InsightsController.getByWeek);
