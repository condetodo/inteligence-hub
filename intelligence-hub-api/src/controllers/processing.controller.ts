import { Request, Response, NextFunction } from 'express';
import { ProcessingService } from '../services/processing.service';
import { param } from '../lib/params';

export class ProcessingController {
  static async trigger(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await ProcessingService.trigger(param(req.params.id));
      res.status(202).json(run);
    } catch (error) {
      next(error);
    }
  }

  static async listRuns(req: Request, res: Response, next: NextFunction) {
    try {
      const runs = await ProcessingService.listRuns(param(req.params.id));
      res.json(runs);
    } catch (error) {
      next(error);
    }
  }

  static async getRun(req: Request, res: Response, next: NextFunction) {
    try {
      const run = await ProcessingService.getRun(param(req.params.id), param(req.params.runId));
      res.json(run);
    } catch (error) {
      next(error);
    }
  }
}
