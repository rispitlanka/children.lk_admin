import mongoose, { Schema, Model } from "mongoose";

export type RequestStatus = "pending" | "approved" | "denied";

export interface IDocumentFile {
  url: string;
  publicId: string;
  type: "pdf" | "video" | "audio" | "docx" | "ppt" | "image";
  name?: string;
}

export interface IResourceRequest {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortDescription: string;
  picture?: string;
  picturePublicId?: string;
  documents: IDocumentFile[];
  tags: string[];
  organizationId: mongoose.Types.ObjectId;
  status: RequestStatus;
  adminReason?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentFileSchema = new Schema<IDocumentFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ["pdf", "video", "audio", "docx", "ppt", "image"], required: true },
    name: String,
  },
  { _id: false }
);

const ResourceRequestSchema = new Schema<IResourceRequest>(
  {
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    picture: String,
    picturePublicId: String,
    documents: [DocumentFileSchema],
    tags: [String],
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    adminReason: String,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const ResourceRequest: Model<IResourceRequest> =
  mongoose.models.ResourceRequest ??
  mongoose.model<IResourceRequest>("ResourceRequest", ResourceRequestSchema);
