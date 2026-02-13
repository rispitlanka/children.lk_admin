import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Tag } from "@/models/Tag";

/** GET: list all tag names for dropdown/autofill (authenticated) */
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") ?? "").trim().toLowerCase();
    const query = q ? { name: new RegExp(escapeRegex(q), "i") } : {};
    const docs = await Tag.find(query, { name: 1, _id: 0 }).sort({ name: 1 }).lean();
    const tags = (docs as { name: string }[]).map((d) => d.name);
    return NextResponse.json(tags);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load tags" }, { status: 500 });
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
