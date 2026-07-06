// Thin typed fetch helpers used by TanStack Query hooks.
// The API always returns { data } on success or { error } on failure.

export class ApiError extends Error {
  status: number;
  details?: unknown;
  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

async function parse<T>(res: Response): Promise<T> {
  const isJson = res.headers
    .get("content-type")
    ?.includes("application/json");
  const body = isJson ? await res.json() : null;
  if (!res.ok) {
    const message =
      (body && (body.error as string)) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body?.details);
  }
  return (body?.data ?? body) as T;
}

export async function getJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  return parse<T>(res);
}

export async function sendJSON<T>(
  url: string,
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return parse<T>(res);
}
