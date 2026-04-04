import { Request, Response, NextFunction } from 'express';
import { ContentService } from '../services/content.service';
import { param } from '../lib/params';

export class ContentController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.list(param(req.params.id), req.query as any);
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.getById(param(req.params.id), param(req.params.contentId));
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, approvalNotes } = req.body;
      const content = await ContentService.updateStatus(
        param(req.params.id),
        param(req.params.contentId),
        status,
        approvalNotes,
      );
      res.json(content);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const content = await ContentService.update(
        param(req.params.id),
        param(req.params.contentId),
        req.body,
      );
      res.json(content);
    } catch (error) {
      next(error);
    }
  }
}
