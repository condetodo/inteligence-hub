import { Router } from 'express';
import { ProcessingController } from '../controllers/processing.controller';
import { authenticate } from '../middleware/auth';

export const processingRoutes = Router();

processingRoutes.use(authenticate);
processingRoutes.post('/:id/process', ProcessingController.trigger);
processingRoutes.get('/:id/runs', ProcessingController.listRuns);
processingRoutes.get('/:id/runs/:runId', ProcessingController.getRun);
