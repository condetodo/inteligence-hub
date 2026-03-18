import { Request, Response, NextFunction } from 'express';
import { InsightsService } from '../services/insights.service';
import { param } from '../lib/params';

export class InsightsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const insights = await InsightsService.list(param(req.params.id));
      res.json(insights);
    } catch (error) {
      next(error);
    }
  }

  static async getByWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const week = Number(param(req.params.week));
      const year = req.query.year ? Number(req.query.year) : undefined;
      const report = await InsightsService.getByWeek(param(req.params.id), week, year);
      res.json(report);
    } catch (error) {
      next(error);
    }
  }
}
