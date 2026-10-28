import { describe, it, expect } from 'vitest';
import { interpolate, interpolateRecord } from '../src/utils/interpolate.js';
import type { IEnvironmentVariable } from '../src/models/index.js';

describe('Environment Variable Interpolation', () => {
  const variables: IEnvironmentVariable[] = [
    { key: 'baseUrl', value: 'https://api.example.com', isSecret: false, enabled: true },
    { key: 'version', value: 'v2', isSecret: false, enabled: true },
    { key: 'apiKey', value: 'secret-token-123', isSecret: true, enabled: true },
    { key: 'disabledVar', value: 'should-not-resolve', isSecret: false, enabled: false },
  ];

  it('interpolates single variable in URL', () => {
    const input = '{{baseUrl}}/users';
    const result = interpolate(input, variables);
    expect(result).toBe('https://api.example.com/users');
  });

  it('interpolates multiple variables in URL and query', () => {
    const input = '{{baseUrl}}/{{version}}/posts?token={{apiKey}}';
    const result = interpolate(input, variables);
    expect(result).toBe('https://api.example.com/v2/posts?token=secret-token-123');
  });

  it('does not interpolate disabled variables', () => {
    const input = 'https://api.com/{{disabledVar}}';
    const result = interpolate(input, variables);
    expect(result).toBe('https://api.com/{{disabledVar}}');
  });

  it('leaves unknown variables unchanged', () => {
    const input = 'https://api.com/{{unknown}}';
    const result = interpolate(input, variables);
    expect(result).toBe('https://api.com/{{unknown}}');
  });

  it('interpolates record dictionary (headers/params)', () => {
    const headers = {
      'Authorization': 'Bearer {{apiKey}}',
      'X-App-Env': '{{baseUrl}}',
    };
    const result = interpolateRecord(headers, variables);
    expect(result).toEqual({
      'Authorization': 'Bearer secret-token-123',
      'X-App-Env': 'https://api.example.com',
    });
  });
});
