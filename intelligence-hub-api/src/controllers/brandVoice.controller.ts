import { Request, Response, NextFunction } from 'express';
import { BrandVoiceService } from '../services/brandVoice.service';
import { param } from '../lib/params';

export class BrandVoiceController {
  static async get(req: Request, res: Response, next: NextFunction) {
    try {
      const brandVoice = await BrandVoiceService.get(param(req.params.id));
      res.json(brandVoice);
    } catch (error) {
      next(error);
    }
  }

  static async getSnapshot(req: Request, res: Response, next: NextFunction) {
    try {
      const week = Number(req.query.week);
      const year = Number(req.query.year);
      if (!week || !year) {
        res.status(400).json({ error: 'week and year query params required' });
        return;
      }
      const snapshot = await BrandVoiceService.getSnapshot(param(req.params.id), week, year);
      res.json(snapshot);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const brandVoice = await BrandVoiceService.update(param(req.params.id), req.body);
      res.json(brandVoice);
    } catch (error) {
      next(error);
    }
  }
}
