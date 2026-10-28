import type { IEnvironmentVariable } from '../models/index.js';

/**
 * Replace all {{variable}} tokens in a string with their corresponding
 * values from the provided environment variables list.
 * Only enabled variables are resolved.
 */
export function interpolate(
  template: string,
  variables: IEnvironmentVariable[]
): string {
  if (!template || !variables.length) return template;

  const lookup = new Map<string, string>();
  for (const v of variables) {
    if (v.enabled) {
      lookup.set(v.key, v.value);
    }
  }

  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    return lookup.has(key) ? lookup.get(key)! : match;
  });
}

/**
 * Interpolate all values in a key-value record.
 */
export function interpolateRecord(
  record: Record<string, string>,
  variables: IEnvironmentVariable[]
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(record)) {
    result[interpolate(key, variables)] = interpolate(value, variables);
  }
  return result;
}
