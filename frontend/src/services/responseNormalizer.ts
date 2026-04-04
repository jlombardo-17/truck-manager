export const normalizeArrayResponse = <T>(value: unknown, fieldName?: string): T[] => {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;

    if (fieldName && Array.isArray(record[fieldName])) {
      return record[fieldName] as T[];
    }

    const commonArrayFields = ['data', 'items', 'results'];
    for (const key of commonArrayFields) {
      if (Array.isArray(record[key])) {
        return record[key] as T[];
      }
    }
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeArrayResponse<T>(parsed, fieldName);
    } catch {
      return [];
    }
  }

  return [];
};

export const normalizeObjectResponse = <T>(value: unknown, fieldName?: string): T => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    const record = value as Record<string, unknown>;

    if (fieldName && record[fieldName] && typeof record[fieldName] === 'object') {
      return record[fieldName] as T;
    }

    const commonObjectFields = ['data', 'result', 'item'];
    for (const key of commonObjectFields) {
      const candidate = record[key];
      if (candidate && typeof candidate === 'object' && !Array.isArray(candidate)) {
        return candidate as T;
      }
    }

    return value as T;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return normalizeObjectResponse<T>(parsed, fieldName);
    } catch {
      return {} as T;
    }
  }

  return {} as T;
};
