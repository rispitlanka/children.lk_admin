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
  contentType: "article" | "poem" | "video" | "audio" | "pictures" | "picture_story";
  textContent?: string;
  files: IMediaFile[];
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
    contentType: { 
      type: String, 
      enum: ["article", "poem", "video", "audio", "pictures", "picture_story"], 
      required: true,
      default: "pictures"
    },
    textContent: { type: String },
    files: [MediaFileSchema],
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
if (mongoose.models.MediaRequest) {
  delete mongoose.models.MediaRequest;
}

export const MediaRequest: Model<IMediaRequest> =
  mongoose.model<IMediaRequest>("MediaRequest", MediaRequestSchema);
