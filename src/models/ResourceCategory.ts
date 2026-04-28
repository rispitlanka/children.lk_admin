import mongoose, { Schema, Model } from "mongoose";

export interface IResourceCategory {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceCategorySchema = new Schema<IResourceCategory>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ResourceCategory: Model<IResourceCategory> =
  (mongoose.models.ResourceCategory as Model<IResourceCategory>) ??
  mongoose.model<IResourceCategory>("ResourceCategory", ResourceCategorySchema);
