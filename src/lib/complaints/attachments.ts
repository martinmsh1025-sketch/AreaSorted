export function parseComplaintAttachmentPaths(value: string | null | undefined) {
  if (!value) return [] as string[];

  const trimmed = value.trim();
  if (!trimmed) return [] as string[];

  if (trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
      }
    } catch {
      return [];
    }
  }

  return [trimmed];
}

export function serializeComplaintAttachmentPaths(paths: string[]) {
  return JSON.stringify(paths);
}
