import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { handleInboundEmail } from "@/lib/inbound-email";

const payloadSchema = z.object({
  from: z.string().min(1),
  subject: z.string().nullish(),
  text: z.string().nullish(),
  html: z.string().nullish(),
});

function isAuthorized(request: NextRequest): boolean {
  const expected = process.env.WEBHOOK_SECRET;
  if (!expected) return false;

  const provided = request.nextUrl.searchParams.get("secret") ?? request.headers.get("x-webhook-secret") ?? "";

  const expectedBuf = Buffer.from(expected);
  const providedBuf = Buffer.from(provided);
  if (expectedBuf.length !== providedBuf.length) return false;

  return timingSafeEqual(expectedBuf, providedBuf);
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = payloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid payload", issues: parsed.error.issues }, { status: 422 });
  }

  const { ticket, created } = await handleInboundEmail(parsed.data);

  return NextResponse.json({ ticket }, { status: created ? 201 : 200 });
}
