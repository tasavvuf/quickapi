import type { Request, Response, NextFunction } from 'express';
import { generateOpenAPI, generateMarkdown } from '../services/doc-generator.service.js';

export async function getDocumentation(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const collectionId = req.params.collectionId as string;
    const format = (req.query.format as string) || 'json';

    let doc: string;

    if (format === 'markdown' || format === 'md') {
      doc = await generateMarkdown(collectionId);
      res.setHeader('Content-Type', 'text/markdown');
    } else if (format === 'yaml') {
      doc = await generateOpenAPI(collectionId, 'yaml');
      res.setHeader('Content-Type', 'text/yaml');
    } else {
      doc = await generateOpenAPI(collectionId, 'json');
      res.setHeader('Content-Type', 'application/json');
    }

    res.send(doc);
  } catch (err) {
    next(err);
  }
}
