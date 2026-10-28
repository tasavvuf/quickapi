import type { Request, Response, NextFunction } from 'express';
import { History } from '../models/index.js';

export async function getHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { workspaceId, method, limit = '50' } = req.query;
    const filter: Record<string, unknown> = {};
    if (workspaceId) filter.workspaceId = workspaceId;
    if (method) filter.method = method;

    const history = await History.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit as string, 10));
    res.json({ success: true, data: history });
  } catch (err) {
    next(err);
  }
}

export async function deleteHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await History.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

export async function clearHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { workspaceId } = req.query;
    const filter = workspaceId ? { workspaceId } : {};
    await History.deleteMany(filter);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}
