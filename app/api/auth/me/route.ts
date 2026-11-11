import { NextResponse } from "next/server";
import { authenticateRequest, isResponse } from "@/lib/api/auth";

export async function GET(request: Request) {
  const result = await authenticateRequest(request);
  if (isResponse(result)) return result.response;
  return NextResponse.json({ user: result.user });
}
