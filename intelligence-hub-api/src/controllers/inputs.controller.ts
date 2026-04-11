import { Request, Response, NextFunction } from 'express';
import { InputsService } from '../services/inputs.service';
import { param } from '../lib/params';

export class InputsController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const inputs = await InputsService.list(
        param(req.params.id),
        req.query.status as string | undefined,
      );
      res.json(inputs);
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const input = await InputsService.create(param(req.params.id), req.body);
      res.status(201).json(input);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InputsService.delete(param(req.params.id), param(req.params.inputId));
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  static async regenerateSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await InputsService.regenerateSummary(
        param(req.params.id),
        param(req.params.inputId),
      );
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
