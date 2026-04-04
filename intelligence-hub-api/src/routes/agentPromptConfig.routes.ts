import { Router } from 'express';
import { AgentPromptConfigController } from '../controllers/agentPromptConfig.controller';
import { authenticate } from '../middleware/auth';

export const agentPromptConfigRoutes = Router();

agentPromptConfigRoutes.use(authenticate);
agentPromptConfigRoutes.get('/:id/agent-config', AgentPromptConfigController.getAll);
agentPromptConfigRoutes.get('/:id/agent-config/:platform', AgentPromptConfigController.getForPlatform);
agentPromptConfigRoutes.put('/:id/agent-config/:platform', AgentPromptConfigController.upsert);
