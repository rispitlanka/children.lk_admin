import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { slugify } from "@/lib/slugify";
import { ResourceCategory } from "@/models/ResourceCategory";
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
    const update: Record<string, unknown> = {};
    if (typeof body.name === "string" && body.name.trim()) {
      update.name = body.name.trim();
      let base = slugify(body.name.trim());
      if (!base) base = "category";
      let slug = base;
      let n = 0;
      while (await ResourceCategory.exists({ slug, _id: { $ne: id } })) {
        n += 1;
        slug = `${base}-${n}`;
      }
      update.slug = slug;
    }
    if (typeof body.sortOrder === "number") update.sortOrder = body.sortOrder;
    if (typeof body.isActive === "boolean") update.isActive = body.isActive;
    const doc = await ResourceCategory.findByIdAndUpdate(id, update, { new: true }).lean();
    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
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
    await ResourceSubCategory.deleteMany({ categoryId: id });
    await ResourceCategory.deleteOne({ _id: id });
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
