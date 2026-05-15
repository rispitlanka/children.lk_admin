import mongoose, { Schema, Model } from "mongoose";

export interface INewsMedia {
  _id: mongoose.Types.ObjectId;
  title: string;
  content: string;
  featuredImage?: string;
  files?: string[];
  createdAt: Date;
  updatedAt: Date;
}

const NewsMediaSchema = new Schema<INewsMedia>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    featuredImage: { type: String },
    files: [{ type: String }],
  },
  { timestamps: true }
);

export const NewsMedia: Model<INewsMedia> =
  mongoose.models.NewsMedia ??
  mongoose.model<INewsMedia>("NewsMedia", NewsMediaSchema);
