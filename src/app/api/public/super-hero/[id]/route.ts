import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { SuperHeroRequest } from "@/models/SuperHeroRequest";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json(
        { error: "Super hero ID is required" },
        { status: 400 }
      );
    }
    await connectDB();
    const superHero = await SuperHeroRequest.findOne({
      _id: id,
      status: "approved",
    })
      .populate("organizationId", "name logo shortDescription")
      .lean();

    if (!superHero) {
      return NextResponse.json(
        { error: "Super hero not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(superHero);
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to load super hero" },
      { status: 500 }
    );
  }
}
