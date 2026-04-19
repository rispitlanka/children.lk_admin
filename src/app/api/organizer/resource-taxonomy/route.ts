import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { ResourceCategory } from "@/models/ResourceCategory";
import { ResourceSubCategory } from "@/models/ResourceSubCategory";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const categories = await ResourceCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("_id name slug sortOrder")
      .lean();
    const subs = await ResourceSubCategory.find({ isActive: true })
      .sort({ sortOrder: 1, name: 1 })
      .select("_id categoryId name slug sortOrder")
      .lean();

    const byCat = new Map<string, typeof subs>();
    for (const s of subs) {
      const key = String(s.categoryId);
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(s);
    }

    const payload = categories.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      sortOrder: c.sortOrder,
      subcategories: byCat.get(String(c._id)) ?? [],
    }));

    return NextResponse.json({ categories: payload });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load taxonomy" }, { status: 500 });
  }
}
