import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import "@/models/Organization";
import { SuperHero } from "@/models/SuperHero";
import { SuperHeroRequest } from "@/models/SuperHeroRequest";
import {
  buildRequestStatusMap,
  isSuperHeroPubliclyVisible,
} from "@/lib/super-hero-public";

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
    const superHero = await SuperHero.findById(id)
      .populate("organizationId", "name logo shortDescription")
      .lean();

    if (!superHero) {
      return NextResponse.json(
        { error: "Super hero not found" },
        { status: 404 }
      );
    }

    const [pendingRequests, sourceRows] = await Promise.all([
      SuperHeroRequest.find({ status: "pending" })
        .select("name contactNumber organizationId")
        .lean(),
      superHero.sourceRequestId
        ? SuperHeroRequest.find({ _id: superHero.sourceRequestId })
            .select("_id status")
            .lean()
        : Promise.resolve([]),
    ]);
    const requestStatusById = buildRequestStatusMap(sourceRows);
    if (!isSuperHeroPubliclyVisible(superHero, pendingRequests, requestStatusById)) {
      return NextResponse.json({ error: "Super hero not found" }, { status: 404 });
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
