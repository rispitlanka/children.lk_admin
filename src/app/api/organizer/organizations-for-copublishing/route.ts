import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";

/** Other organizations (for co-publisher multi-select). Excludes the current user's org. */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "organizer") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    await connectDB();
    const user = await User.findOne({ _id: session.user.id }).select("organizationId").lean();
    if (!user?.organizationId) {
      return NextResponse.json({ organizations: [] });
    }
    const list = await Organization.find({ _id: { $ne: user.organizationId } })
      .select("_id name")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json({
      organizations: list.map((o) => ({ _id: o._id, name: o.name })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to load" }, { status: 500 });
  }
}
