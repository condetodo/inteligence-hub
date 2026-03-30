import { Request, Response, NextFunction } from 'express';
import { InstancesService } from '../services/instances.service';
import { param } from '../lib/params';

export class InstancesController {
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.create(req.userId!, req.body);
      res.status(201).json(instance);
    } catch (error) {
      next(error);
    }
  }

  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const instances = await InstancesService.list(req.userId!);
      res.json(instances);
    } catch (error) {
      next(error);
    }
  }

  static async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.getById(req.userId!, param(req.params.id));
      res.json(instance);
    } catch (error) {
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.update(req.userId!, param(req.params.id), req.body);
      res.json(instance);
    } catch (error) {
      next(error);
    }
  }

  static async archive(req: Request, res: Response, next: NextFunction) {
    try {
      const instance = await InstancesService.archive(req.userId!, param(req.params.id));
      res.json(instance);
    } catch (error) {
      next(error);
    }
  }

  static async destroy(req: Request, res: Response, next: NextFunction) {
    try {
      await InstancesService.destroy(req.userId!, param(req.params.id));
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }
}
