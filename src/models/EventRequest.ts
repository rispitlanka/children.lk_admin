import mongoose, { Schema, Model } from "mongoose";

export type RequestStatus = "pending" | "approved" | "denied";

export interface IEventRequest {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  /** Display line built from venue fields; kept for listings and legacy data */
  location: string;
  eventCategory?: string;
  locationName?: string;
  locationAddress?: string;
  locationContact?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  startDate: Date;
  endDate?: Date;
  description: string;
  tags: string[];
  registrationLink?: string;
  coverImage?: string;
  coverImagePublicId?: string;
  highlight1?: string;
  highlight2?: string;
  highlight3?: string;
  targetAudience: "children" | "people_work_for_children";
  ageGroup?: "1-5" | "5-10" | "11-15" | "15-18" | "above-18";
  organizationId: mongoose.Types.ObjectId;
  status: RequestStatus;
  adminReason?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventRequestSchema = new Schema<IEventRequest>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, trim: true, unique: true },
    location: { type: String, required: true },
    eventCategory: { type: String, trim: true },
    locationName: { type: String, trim: true },
    locationAddress: { type: String, trim: true },
    locationContact: { type: String, trim: true },
    locationLatitude: Number,
    locationLongitude: Number,
    startDate: { type: Date, required: true },
    endDate: Date,
    description: { type: String, required: true },
    tags: [String],
    registrationLink: String,
    coverImage: String,
    coverImagePublicId: String,
    highlight1: String,
    highlight2: String,
    highlight3: String,
    targetAudience: { 
      type: String, 
      enum: ["children", "people_work_for_children"], 
      required: true,
      default: "children"
    },
    ageGroup: { 
      type: String, 
      enum: ["1-5", "5-10", "11-15", "15-18", "above-18"]
    },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    adminReason: String,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Force model recreation in development
if (mongoose.models.EventRequest) {
  delete mongoose.models.EventRequest;
}

export const EventRequest: Model<IEventRequest> =
  mongoose.model<IEventRequest>("EventRequest", EventRequestSchema);
