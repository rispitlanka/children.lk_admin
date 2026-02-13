import mongoose, { Schema, Model } from "mongoose";

export type RequestStatus = "pending" | "approved" | "denied";

export interface IEventRequest {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  tags: string[];
  registrationLink?: string;
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
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: Date,
    description: { type: String, required: true },
    tags: [String],
    registrationLink: String,
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    adminReason: String,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const EventRequest: Model<IEventRequest> =
  mongoose.models.EventRequest ??
  mongoose.model<IEventRequest>("EventRequest", EventRequestSchema);
