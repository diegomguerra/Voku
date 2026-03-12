import { NextResponse } from "next/server";

export async function POST(req) {
  const { key } = await req.json();
  const valid = key === process.env.ADMIN_KEY;
  return NextResponse.json({ valid });
}
