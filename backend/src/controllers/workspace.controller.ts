import type { Request, Response, NextFunction } from 'express';
import { Workspace } from '../models/index.js';

export async function getWorkspaces(_req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspaces = await Workspace.find().sort({ updatedAt: -1 });
    res.json({ success: true, data: workspaces });
  } catch (err) {
    next(err);
  }
}

export async function createWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, description = '' } = req.body;
    const workspace = await Workspace.create({
      name,
      description,
      owner: 'default-user',
      members: [{ userId: 'default-user', role: 'owner', name: 'Default User' }],
    });
    res.status(201).json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
}

export async function updateWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await Workspace.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!workspace) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }
    res.json({ success: true, data: workspace });
  } catch (err) {
    next(err);
  }
}

export async function deleteWorkspace(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const workspace = await Workspace.findByIdAndDelete(req.params.id);
    if (!workspace) {
      res.status(404).json({ success: false, error: 'Workspace not found' });
      return;
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

