import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { listSuperHeroesForCatalog } from "@/lib/super-hero-public";

export async function GET() {
  try {
    await connectDB();
    const visible = await listSuperHeroesForCatalog(
      "name logo shortDescription",
      "public"
    );
    return NextResponse.json(visible);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load super heroes" },
      { status: 500 }
    );
  }
}
