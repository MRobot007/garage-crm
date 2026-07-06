// Server-side helpers for Route Handlers: consistent JSON envelope + Zod parsing.
import { NextResponse } from "next/server";
import { z, ZodError, type ZodTypeAny } from "zod";

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function fail(error: string, status = 400, details?: unknown) {
  return NextResponse.json({ error, details }, { status });
}

/** Parse + validate a JSON request body against a Zod schema. */
export async function parseBody<S extends ZodTypeAny>(
  req: Request,
  schema: S,
): Promise<
  | { success: true; data: z.output<S> }
  | { success: false; response: NextResponse }
> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return { success: false, response: fail("Invalid JSON body", 400) };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      success: false,
      response: fail(
        "Validation failed",
        422,
        flattenZod(result.error),
      ),
    };
  }
  return { success: true, data: result.data };
}

export function flattenZod(err: ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

/** Wrap a handler so thrown errors become a clean 500 instead of a stack dump. */
export async function handle(
  fn: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await fn();
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Unexpected server error";
    // Unique-constraint style errors from Prisma → 409.
    if (message.includes("Unique constraint")) {
      return fail("That value already exists (duplicate).", 409);
    }
    console.error("[api] unhandled error:", e);
    return fail("Internal server error", 500);
  }
}
