const ATTACHMENT_MARKER = "[AttachmentPaths]";

export function appendAttachmentPathsToSupportMessage(message: string, paths: string[]) {
  if (!paths.length) return message;
  return `${message}\n\n${ATTACHMENT_MARKER}${JSON.stringify(paths)}`;
}

export function parseSupportAttachmentPaths(message: string) {
  const markerIndex = message.indexOf(ATTACHMENT_MARKER);
  if (markerIndex === -1) return [] as string[];

  const raw = message.slice(markerIndex + ATTACHMENT_MARKER.length).trim();
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
    }
  } catch {
    return [];
  }
  return [];
}

export function stripSupportAttachmentMetadata(message: string) {
  const markerIndex = message.indexOf(ATTACHMENT_MARKER);
  if (markerIndex === -1) return message;
  return message.slice(0, markerIndex).trimEnd();
}
