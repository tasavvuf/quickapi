import type { Request, Response, NextFunction } from 'express';
import { Collection } from '../models/index.js';

export async function getCollections(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { workspaceId } = req.query;
    const filter = workspaceId ? { workspaceId } : {};
    const collections = await Collection.find(filter).sort({ order: 1 });
    res.json({ success: true, data: collections });
  } catch (err) {
    next(err);
  }
}

export async function getCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const collection = await Collection.findById(req.params.id);
    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.json({ success: true, data: collection });
  } catch (err) {
    next(err);
  }
}

export async function createCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const collection = await Collection.create(req.body);
    res.status(201).json({ success: true, data: collection });
  } catch (err) {
    next(err);
  }
}

export async function updateCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const collection = await Collection.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.json({ success: true, data: collection });
  } catch (err) {
    next(err);
  }
}

export async function deleteCollection(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const collection = await Collection.findByIdAndDelete(req.params.id);
    if (!collection) {
      res.status(404).json({ success: false, error: 'Collection not found' });
      return;
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}
