import { Request, Response, NextFunction } from 'express';
import { AgentPromptConfigService } from '../services/agentPromptConfig.service';
import { param } from '../lib/params';

export class AgentPromptConfigController {
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const configs = await AgentPromptConfigService.getAll(param(req.params.id));
      res.json(configs);
    } catch (error) {
      next(error);
    }
  }

  static async getForPlatform(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await AgentPromptConfigService.getForPlatform(
        param(req.params.id),
        param(req.params.platform),
      );
      res.json(config);
    } catch (error) {
      next(error);
    }
  }

  static async upsert(req: Request, res: Response, next: NextFunction) {
    try {
      const config = await AgentPromptConfigService.upsert(
        param(req.params.id),
        param(req.params.platform),
        req.body,
      );
      res.json(config);
    } catch (error) {
      next(error);
    }
  }
}
