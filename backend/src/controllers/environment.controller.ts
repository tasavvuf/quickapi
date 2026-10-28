import type { Request, Response, NextFunction } from 'express';
import { Environment } from '../models/index.js';

export async function getEnvironments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { workspaceId } = req.query;
    const filter = workspaceId ? { workspaceId } : {};
    const environments = await Environment.find(filter).sort({ name: 1 });

    // Mask secret values
    const masked = environments.map((env) => ({
      ...env.toObject(),
      variables: env.variables.map((v) => ({
        ...v,
        value: v.isSecret ? '********' : v.value,
      })),
    }));

    res.json({ success: true, data: masked });
  } catch (err) {
    next(err);
  }
}

export async function getEnvironment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const env = await Environment.findById(req.params.id);
    if (!env) {
      res.status(404).json({ success: false, error: 'Environment not found' });
      return;
    }
    res.json({ success: true, data: env });
  } catch (err) {
    next(err);
  }
}

export async function createEnvironment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const env = await Environment.create(req.body);
    res.status(201).json({ success: true, data: env });
  } catch (err) {
    next(err);
  }
}

export async function updateEnvironment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const env = await Environment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!env) {
      res.status(404).json({ success: false, error: 'Environment not found' });
      return;
    }
    res.json({ success: true, data: env });
  } catch (err) {
    next(err);
  }
}

export async function deleteEnvironment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Environment.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}
