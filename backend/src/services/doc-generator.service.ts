import yaml from 'js-yaml';
import { Collection, ApiRequest, type IApiRequest, type ICollection } from '../models/index.js';
import type { Types } from 'mongoose';

interface OpenAPIPath {
  [method: string]: {
    summary: string;
    description: string;
    parameters: object[];
    requestBody?: object;
    responses: object;
  };
}

/**
 * Generate an OpenAPI 3.0 specification from a collection and its saved requests.
 */
export async function generateOpenAPI(
  collectionId: string,
  format: 'json' | 'yaml' = 'json'
): Promise<string> {
  const collection = await Collection.findById(collectionId);
  if (!collection) throw new Error('Collection not found');

  const requests = await ApiRequest.find({ collectionId }).sort({ order: 1 });

  const paths: Record<string, OpenAPIPath> = {};

  for (const req of requests) {
    // Extract path from URL (strip protocol and host)
    let urlPath = '/';
    try {
      const parsed = new URL(req.url.replace(/\{\{.*?\}\}/g, 'placeholder'));
      urlPath = parsed.pathname || '/';
    } catch {
      urlPath = req.url;
    }

    if (!paths[urlPath]) paths[urlPath] = {};

    const parameters = req.queryParams
      .filter((p) => p.enabled)
      .map((p) => ({
        name: p.key,
        in: 'query',
        required: false,
        schema: { type: 'string' },
        example: p.value,
      }));

    // Add header parameters
    for (const h of req.headers.filter((h) => h.enabled)) {
      parameters.push({
        name: h.key,
        in: 'header',
        required: false,
        schema: { type: 'string' },
        example: h.value,
      });
    }

    const operation: OpenAPIPath[string] = {
      summary: req.name,
      description: req.description || '',
      parameters,
      responses: {
        '200': { description: 'Successful response' },
      },
    };

    if (req.body.mode === 'json' && req.body.raw) {
      try {
        const parsed = JSON.parse(req.body.raw);
        operation.requestBody = {
          content: {
            'application/json': {
              schema: { type: 'object' },
              example: parsed,
            },
          },
        };
      } catch {
        operation.requestBody = {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        };
      }
    }

    paths[urlPath][req.method.toLowerCase()] = operation;
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title: collection.name,
      description: collection.description || `API documentation for ${collection.name}`,
      version: '1.0.0',
    },
    paths,
  };

  return format === 'yaml' ? yaml.dump(spec) : JSON.stringify(spec, null, 2);
}

/**
 * Generate Markdown documentation from a collection.
 */
export async function generateMarkdown(collectionId: string): Promise<string> {
  const collection = await Collection.findById(collectionId);
  if (!collection) throw new Error('Collection not found');

  const requests = await ApiRequest.find({ collectionId }).sort({ order: 1 });

  let md = `# ${collection.name}\n\n`;
  if (collection.description) {
    md += `${collection.description}\n\n`;
  }
  md += `---\n\n`;

  for (const req of requests) {
    md += `## ${req.method} ${req.name}\n\n`;
    md += `\`${req.method} ${req.url}\`\n\n`;

    if (req.description) {
      md += `${req.description}\n\n`;
    }

    // Query parameters
    const enabledParams = req.queryParams.filter((p) => p.enabled);
    if (enabledParams.length) {
      md += `### Query Parameters\n\n`;
      md += `| Key | Value |\n|-----|-------|\n`;
      for (const p of enabledParams) {
        md += `| ${p.key} | ${p.value} |\n`;
      }
      md += `\n`;
    }

    // Headers
    const enabledHeaders = req.headers.filter((h) => h.enabled);
    if (enabledHeaders.length) {
      md += `### Headers\n\n`;
      md += `| Key | Value |\n|-----|-------|\n`;
      for (const h of enabledHeaders) {
        md += `| ${h.key} | ${h.value} |\n`;
      }
      md += `\n`;
    }

    // Body
    if (req.body.mode === 'json' && req.body.raw) {
      md += `### Request Body\n\n`;
      md += `\`\`\`json\n${req.body.raw}\n\`\`\`\n\n`;
    }

    // cURL
    md += `### cURL\n\n`;
    md += `\`\`\`bash\n${generateCurl(req)}\n\`\`\`\n\n`;
    md += `---\n\n`;
  }

  return md;
}

/**
 * Generate a cURL command from a saved request.
 */
export function generateCurl(req: IApiRequest): string {
  let curl = `curl -X ${req.method} '${req.url}'`;

  for (const h of req.headers.filter((h) => h.enabled)) {
    curl += ` \\\n  -H '${h.key}: ${h.value}'`;
  }

  if (req.auth.type === 'bearer' && req.auth.bearer?.token) {
    curl += ` \\\n  -H 'Authorization: Bearer ${req.auth.bearer.token}'`;
  } else if (req.auth.type === 'basic' && req.auth.basic?.username) {
    curl += ` \\\n  -u '${req.auth.basic.username}:${req.auth.basic.password || ''}'`;
  }

  if (req.body.mode === 'json' && req.body.raw) {
    curl += ` \\\n  -H 'Content-Type: application/json' \\\n  -d '${req.body.raw}'`;
  } else if (req.body.mode === 'text' && req.body.raw) {
    curl += ` \\\n  -d '${req.body.raw}'`;
  }

  return curl;
}
