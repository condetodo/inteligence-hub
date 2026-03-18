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

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const brandVoice = await BrandVoiceService.update(param(req.params.id), req.body);
      res.json(brandVoice);
    } catch (error) {
      next(error);
    }
  }
}
