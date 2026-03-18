import { Router } from 'express';
import { CorpusController } from '../controllers/corpus.controller';
import { authenticate } from '../middleware/auth';

export const corpusRoutes = Router();

corpusRoutes.use(authenticate);
corpusRoutes.get('/:id/corpus', CorpusController.list);
corpusRoutes.get('/:id/corpus/:week', CorpusController.getByWeek);
