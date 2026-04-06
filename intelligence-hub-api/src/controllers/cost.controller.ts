import { Request, Response, NextFunction } from 'express';
import { CostService } from '../services/cost.service';

export class CostController {
  static async getByInstance(req: Request, res: Response, next: NextFunction) {
    try {
      const month = Number(req.query.month) || new Date().getMonth() + 1;
      const year = Number(req.query.year) || new Date().getFullYear();
      const result = await CostService.getByInstance(req.params.id, month, year);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
