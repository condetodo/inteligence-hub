import { Request, Response, NextFunction } from 'express';
import { CorpusService } from '../services/corpus.service';
import { param } from '../lib/params';

export class CorpusController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const corpus = await CorpusService.list(param(req.params.id));
      res.json(corpus);
    } catch (error) {
      next(error);
    }
  }

  static async getByWeek(req: Request, res: Response, next: NextFunction) {
    try {
      const week = Number(param(req.params.week));
      const year = req.query.year ? Number(req.query.year) : undefined;
      const corpus = await CorpusService.getByWeek(param(req.params.id), week, year);
      res.json(corpus);
    } catch (error) {
      next(error);
    }
  }
}
