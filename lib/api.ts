// Client for the IEEE Sooners API (server/ in this repo, hosted on Railway).
// The base URL is baked in at build time from NEXT_PUBLIC_API_URL.

export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export const apiConfigured = API_URL.length > 0;

const TOKEN_KEY = 'ieee-admin-token';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message);
  }
}

function storage(kind: 'local' | 'session') {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

export const session = {
  get() {
    return storage('session')?.getItem(TOKEN_KEY) ?? storage('local')?.getItem(TOKEN_KEY) ?? null;
  },
  set(token: string, remember: boolean) {
    session.clear();
    storage(remember ? 'local' : 'session')?.setItem(TOKEN_KEY, token);
  },
  clear() {
    storage('session')?.removeItem(TOKEN_KEY);
    storage('local')?.removeItem(TOKEN_KEY);
  },
};

export async function api<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean; signal?: AbortSignal } = {},
): Promise<T> {
  if (!apiConfigured) throw new ApiError('The site API is not configured.', 0);
  const headers: Record<string, string> = {};
  let body: BodyInit | undefined;
  if (options.body instanceof FormData) body = options.body;
  else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }
  if (options.auth) {
    const token = session.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { method: options.method ?? 'GET', headers, body, signal: options.signal });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiError('Could not reach the server. Check your connection and try again.', 0);
  }
  const data = (res.headers.get('content-type')?.includes('json') ? await res.json() : null) as
    | ({ error?: string; field?: string } & Record<string, unknown>)
    | null;
  if (!res.ok) {
    throw new ApiError(data?.error ?? `Request failed (${res.status}).`, res.status, data?.field);
  }
  return data as T;
}

/** Download an authenticated file (CSV, backups) through the browser. */
export async function downloadFile(path: string, fallbackName: string) {
  const token = session.get();
  const res = await fetch(`${API_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
  if (!res.ok) throw new ApiError('Download failed.', res.status);
  const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
