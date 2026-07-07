import { prisma } from "@/lib/prisma";
import { ok, fail, parseBody, handle } from "@/lib/api";
import { userCreateSchema } from "@/lib/schemas";
import { hashPassword } from "@/lib/auth";

export const dynamic = "force-dynamic";

// Access is owner-only (enforced in middleware). Never returns passwordHash.
const SELECT = {
  id: true,
  name: true,
  username: true,
  role: true,
  active: true,
  createdAt: true,
} as const;

export async function GET() {
  return handle(async () => {
    const users = await prisma.user.findMany({
      select: SELECT,
      orderBy: [{ role: "asc" }, { name: "asc" }],
    });
    return ok(users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() })));
  });
}

export async function POST(req: Request) {
  return handle(async () => {
    const parsed = await parseBody(req, userCreateSchema);
    if (!parsed.success) return parsed.response;
    const v = parsed.data;

    const username = v.username.toLowerCase();
    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return fail("That username is already taken", 409);

    const user = await prisma.user.create({
      data: {
        name: v.name,
        username,
        role: v.role,
        passwordHash: await hashPassword(v.password),
      },
      select: SELECT,
    });
    return ok({ ...user, createdAt: user.createdAt.toISOString() }, 201);
  });
}
