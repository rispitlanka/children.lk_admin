import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { ResourceSubCategory } from "@/models/ResourceSubCategory";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const categoryId = searchParams.get("categoryId");
  try {
    await connectDB();
    const filter = categoryId && mongoose.Types.ObjectId.isValid(categoryId) ? { categoryId } : {};
    const list = await ResourceSubCategory.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    return NextResponse.json(list);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const categoryId = body.categoryId;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!categoryId || !mongoose.Types.ObjectId.isValid(String(categoryId)) || !name) {
      return NextResponse.json(
        { error: "categoryId and name are required" },
        { status: 400 }
      );
    }
    await connectDB();
    let base = slugify(name);
    if (!base) base = "subcategory";
    let slug = base;
    let n = 0;
    while (await ResourceSubCategory.exists({ categoryId, slug })) {
      n += 1;
      slug = `${base}-${n}`;
    }
    const doc = await ResourceSubCategory.create({
      categoryId,
      name,
      slug,
      sortOrder: typeof body.sortOrder === "number" ? body.sortOrder : 0,
      isActive: body.isActive !== false,
    });
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
  }
}
