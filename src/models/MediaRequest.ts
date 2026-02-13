import mongoose, { Schema, Model } from "mongoose";

export type RequestStatus = "pending" | "approved" | "denied";

export interface IMediaFile {
  url: string;
  publicId: string;
  type: "video" | "audio" | "image";
  name?: string;
}

export interface IMediaRequest {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  files: IMediaFile[];
  organizationId: mongoose.Types.ObjectId;
  status: RequestStatus;
  adminReason?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MediaFileSchema = new Schema<IMediaFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ["video", "audio", "image"], required: true },
    name: String,
  },
  { _id: false }
);

const MediaRequestSchema = new Schema<IMediaRequest>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    files: [MediaFileSchema],
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    adminReason: String,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const MediaRequest: Model<IMediaRequest> =
  mongoose.models.MediaRequest ??
  mongoose.model<IMediaRequest>("MediaRequest", MediaRequestSchema);
