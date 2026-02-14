import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { User } from "@/models/User";
import { Organization } from "@/models/Organization";
import { ResourceRequest } from "@/models/ResourceRequest";
import { MediaRequest } from "@/models/MediaRequest";
import { EventRequest } from "@/models/EventRequest";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await Promise.resolve(params);
    if (!resolvedParams?.id) {
      return NextResponse.json({ error: "ID parameter is required" }, { status: 400 });
    }
    const organizerId = resolvedParams.id;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(organizerId)) {
      return NextResponse.json({ error: "Invalid organizer ID" }, { status: 400 });
    }

    await connectDB();

    // Find the organizer with their organization
    const organizer = await User.findOne({ 
      _id: organizerId, 
      role: "organizer" 
    }).lean();

    if (!organizer) {
      return NextResponse.json({ error: "Organizer not found" }, { status: 404 });
    }

    // Find the organization
    const organization = await Organization.findOne({ 
      userId: organizer._id 
    }).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    // Fetch all submissions for this organization
    const [resources, media, events] = await Promise.all([
      ResourceRequest.find({ organizationId: organization._id })
        .select("name shortDescription status targetAudience ageGroup createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      MediaRequest.find({ organizationId: organization._id })
        .select("name description contentType status targetAudience ageGroup createdAt")
        .sort({ createdAt: -1 })
        .lean(),
      EventRequest.find({ organizationId: organization._id })
        .select("name description location startDate endDate status targetAudience ageGroup createdAt")
        .sort({ createdAt: -1 })
        .lean()
    ]);

    // Calculate statistics
    const stats = {
      totalResources: resources.length,
      approvedResources: resources.filter(r => r.status === "approved").length,
      totalMedia: media.length,
      approvedMedia: media.filter(m => m.status === "approved").length,
      totalEvents: events.length,
      approvedEvents: events.filter(e => e.status === "approved").length,
    };

    const response = {
      organizer: {
        _id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        createdAt: organizer.createdAt,
        organization: {
          _id: organization._id,
          name: organization.name,
          shortDescription: organization.shortDescription,
          logo: organization.logo,
          contactEmail: organization.contactEmail,
          contactPhone: organization.contactPhone,
          address: organization.address,
          website: organization.website,
        }
      },
      resources,
      media,
      events,
      stats
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching organizer details:", error);
    return NextResponse.json(
      { error: "Failed to fetch organizer details" },
      { status: 500 }
    );
  }
}