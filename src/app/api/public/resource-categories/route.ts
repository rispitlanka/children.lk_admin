import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ResourceCategory } from "@/models/ResourceCategory";
import { ResourceSubCategory } from "@/models/ResourceSubCategory";

export async function GET() {
  try {
    await connectDB();

    const [categories, subcategories] = await Promise.all([
      ResourceCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
      ResourceSubCategory.find({ isActive: true }).sort({ sortOrder: 1, name: 1 }).lean(),
    ]);

    const subByCategory = new Map<string, typeof subcategories>();
    for (const sub of subcategories) {
      const key = String(sub.categoryId);
      const existing = subByCategory.get(key) ?? [];
      existing.push(sub);
      subByCategory.set(key, existing);
    }

    const payload = categories.map((category) => ({
      ...category,
      subcategories: subByCategory.get(String(category._id)) ?? [],
    }));

    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load resource categories" }, { status: 500 });
  }
}
