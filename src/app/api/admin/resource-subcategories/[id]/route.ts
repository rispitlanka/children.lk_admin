import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { ResourceSubCategory } from "@/models/ResourceSubCategory";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    const body = await req.json();
    await connectDB();
    const existing = await ResourceSubCategory.findById(id).lean();
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const categoryId =
      body.categoryId && mongoose.Types.ObjectId.isValid(String(body.categoryId))
        ? body.categoryId
        : existing.categoryId;

    const update: Record<string, unknown> = {};
    if (categoryId) update.categoryId = categoryId;
    if (typeof body.name === "string" && body.name.trim()) {
      update.name = body.name.trim();
      let base = slugify(body.name.trim());
      if (!base) base = "subcategory";
      let slug = base;
      let n = 0;
      while (
        await ResourceSubCategory.exists({
          categoryId,
          slug,
          _id: { $ne: id },
        })
      ) {
        n += 1;
        slug = `${base}-${n}`;
      }
      update.slug = slug;
    }
    if (typeof body.sortOrder === "number") update.sortOrder = body.sortOrder;
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;

    const doc = await ResourceSubCategory.findByIdAndUpdate(id, update, { new: true }).lean();
    return NextResponse.json(doc);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }
  try {
    await connectDB();
    await ResourceSubCategory.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
