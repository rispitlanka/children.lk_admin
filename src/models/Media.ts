import mongoose, { Schema, Model } from "mongoose";

export interface IMediaFile {
  url: string;
  publicId: string;
  type: "video" | "audio" | "image";
  name?: string;
}

export interface IMedia {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  files: IMediaFile[];
  organizationId: mongoose.Types.ObjectId;
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

const MediaSchema = new Schema<IMedia>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    files: [MediaFileSchema],
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  },
  { timestamps: true }
);

export const Media: Model<IMedia> =
  mongoose.models.Media ?? mongoose.model<IMedia>("Media", MediaSchema);
