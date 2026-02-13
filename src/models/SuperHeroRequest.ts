import mongoose, { Schema, Model } from "mongoose";

export type RequestStatus = "pending" | "approved" | "denied";

export interface ISuperHeroRequest {
  _id: mongoose.Types.ObjectId;
  name: string;
  icon: string;
  iconType: "emoji" | "image";
  iconPublicId?: string;
  phone: string;
  shortDescription: string;
  organizationId: mongoose.Types.ObjectId;
  status: RequestStatus;
  adminReason?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SuperHeroRequestSchema = new Schema<ISuperHeroRequest>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    iconType: { type: String, enum: ["emoji", "image"], required: true, default: "emoji" },
    iconPublicId: String,
    phone: { type: String, required: true },
    shortDescription: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    adminReason: String,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const SuperHeroRequest: Model<ISuperHeroRequest> =
  mongoose.models.SuperHeroRequest ??
  mongoose.model<ISuperHeroRequest>("SuperHeroRequest", SuperHeroRequestSchema);
