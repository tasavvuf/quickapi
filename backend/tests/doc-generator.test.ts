import { describe, it, expect } from 'vitest';
import { generateCurl } from '../src/services/doc-generator.service.js';
import type { IApiRequest } from '../src/models/index.js';

describe('Documentation & cURL Generator', () => {
  it('generates standard GET cURL command with query params and headers', () => {
    const mockReq = {
      name: 'Get Users',
      method: 'GET',
      url: 'https://api.example.com/users',
      headers: [
        { key: 'Accept', value: 'application/json', enabled: true },
        { key: 'X-Ignore', value: 'test', enabled: false },
      ],
      queryParams: [],
      auth: { type: 'bearer', bearer: { token: 'sample-jwt' } },
      body: { mode: 'none' },
    } as unknown as IApiRequest;

    const curl = generateCurl(mockReq);
    expect(curl).toContain("curl -X GET 'https://api.example.com/users'");
    expect(curl).toContain("-H 'Accept: application/json'");
    expect(curl).not.toContain('X-Ignore');
    expect(curl).toContain("-H 'Authorization: Bearer sample-jwt'");
  });

  it('generates POST cURL command with JSON payload and Basic auth', () => {
    const mockReq = {
      name: 'Create Item',
      method: 'POST',
      url: 'https://api.example.com/items',
      headers: [],
      queryParams: [],
      auth: { type: 'basic', basic: { username: 'admin', password: 'secretpassword' } },
      body: { mode: 'json', raw: '{"title":"Test"}' },
    } as unknown as IApiRequest;

    const curl = generateCurl(mockReq);
    expect(curl).toContain("curl -X POST 'https://api.example.com/items'");
    expect(curl).toContain("-u 'admin:secretpassword'");
    expect(curl).toContain("-H 'Content-Type: application/json'");
    expect(curl).toContain('-d \'{"title":"Test"}\'');
  });
});
