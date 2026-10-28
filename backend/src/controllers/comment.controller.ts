import type { Request, Response, NextFunction } from 'express';
import { Comment } from '../models/index.js';

export async function getComments(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { requestId } = req.query;
    const filter = requestId ? { requestId } : {};
    const comments = await Comment.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: comments });
  } catch (err) {
    next(err);
  }
}

export async function createComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const comment = await Comment.create(req.body);
    res.status(201).json({ success: true, data: comment });
  } catch (err) {
    next(err);
  }
}

export async function deleteComment(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

