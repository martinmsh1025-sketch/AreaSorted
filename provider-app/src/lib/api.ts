import { mobileConfig } from "@/lib/config";

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  token?: string | null;
};

/** Listeners called when any API request receives a 401 Unauthorized response. */
const unauthorizedListeners = new Set<() => void>();

export function onUnauthorized(listener: () => void) {
  unauthorizedListeners.add(listener);
  return () => { unauthorizedListeners.delete(listener); };
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${mobileConfig.apiBaseUrl}${path}`, {
    method: options.method || "GET",
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (response.status === 401) {
    unauthorizedListeners.forEach((fn) => fn());
  }

  if (!response.ok) {
    const errorMessage = typeof payload === "object" && payload && "error" in payload
      ? String((payload as { error: string }).error)
      : `Request failed with ${response.status}`;
    throw new Error(errorMessage);
  }

  return payload as T;
}
