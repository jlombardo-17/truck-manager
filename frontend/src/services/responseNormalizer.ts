const COMMON_WRAPPER_FIELDS = ['payload', 'data', 'result', 'results', 'item', 'items'];

const parseIfJsonString = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const findArrayCandidate = (value: unknown, fieldName?: string, depth = 0): unknown[] | undefined => {
  const parsedValue = parseIfJsonString(value);

  if (Array.isArray(parsedValue)) {
    return parsedValue;
  }

  if (!parsedValue || typeof parsedValue !== 'object' || depth > 5) {
    return undefined;
  }

  const record = parsedValue as Record<string, unknown>;

  if (fieldName && Array.isArray(record[fieldName])) {
    return record[fieldName] as unknown[];
  }

  if (fieldName && record[fieldName] && typeof record[fieldName] === 'object') {
    const nestedFieldMatch = findArrayCandidate(record[fieldName], fieldName, depth + 1);
    if (nestedFieldMatch) {
      return nestedFieldMatch;
    }
  }

  for (const key of COMMON_WRAPPER_FIELDS) {
    const candidate = record[key];
    const nestedMatch = findArrayCandidate(candidate, fieldName, depth + 1);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  for (const candidate of Object.values(record)) {
    const nestedMatch = findArrayCandidate(candidate, fieldName, depth + 1);
    if (nestedMatch) {
      return nestedMatch;
    }
  }

  return undefined;
};

const findObjectCandidate = (value: unknown, fieldName?: string, depth = 0): Record<string, unknown> | undefined => {
  const parsedValue = parseIfJsonString(value);

  if (!parsedValue || typeof parsedValue !== 'object' || Array.isArray(parsedValue) || depth > 5) {
    return undefined;
  }

  const record = parsedValue as Record<string, unknown>;

  if (fieldName && record[fieldName] && typeof record[fieldName] === 'object' && !Array.isArray(record[fieldName])) {
    return record[fieldName] as Record<string, unknown>;
  }

  for (const key of COMMON_WRAPPER_FIELDS) {
    const candidate = record[key];
    if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
      const nestedMatch = findObjectCandidate(candidate, fieldName, depth + 1);
      return nestedMatch || (candidate as Record<string, unknown>);
    }
  }

  return record;
};

export const normalizeArrayResponse = <T>(value: unknown, fieldName?: string): T[] => {
  return (findArrayCandidate(value, fieldName) || []) as T[];
};

export const normalizeObjectResponse = <T>(value: unknown, fieldName?: string): T => {
  return (findObjectCandidate(value, fieldName) || {}) as T;
};
