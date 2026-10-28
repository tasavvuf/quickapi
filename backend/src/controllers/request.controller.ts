import type { Request, Response, NextFunction } from 'express';
import { ApiRequest } from '../models/index.js';

export async function getRequests(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { collectionId, workspaceId } = req.query;
    const filter: Record<string, unknown> = {};
    if (collectionId) filter.collectionId = collectionId;
    if (workspaceId) filter.workspaceId = workspaceId;
    const requests = await ApiRequest.find(filter).sort({ order: 1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    next(err);
  }
}

export async function getRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await ApiRequest.findById(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function createRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await ApiRequest.create(req.body);
    res.status(201).json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function updateRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await ApiRequest.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!request) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }
    res.json({ success: true, data: request });
  } catch (err) {
    next(err);
  }
}

export async function deleteRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const request = await ApiRequest.findByIdAndDelete(req.params.id);
    if (!request) {
      res.status(404).json({ success: false, error: 'Request not found' });
      return;
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

