import { Router } from 'express';
import { BrandVoiceController } from '../controllers/brandVoice.controller';
import { authenticate } from '../middleware/auth';

export const brandVoiceRoutes = Router();

brandVoiceRoutes.use(authenticate);
brandVoiceRoutes.get('/:id/brand-voice', BrandVoiceController.get);
brandVoiceRoutes.get('/:id/brand-voice/snapshot', BrandVoiceController.getSnapshot);
brandVoiceRoutes.put('/:id/brand-voice', BrandVoiceController.update);
