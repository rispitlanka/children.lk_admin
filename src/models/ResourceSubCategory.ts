import mongoose, { Schema, Model } from "mongoose";

export interface IResourceSubCategory {
  _id: mongoose.Types.ObjectId;
  categoryId: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSubCategorySchema = new Schema<IResourceSubCategory>(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "ResourceCategory", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

ResourceSubCategorySchema.index({ categoryId: 1, slug: 1 }, { unique: true });

if (mongoose.models.ResourceSubCategory) {
  delete mongoose.models.ResourceSubCategory;
}

export const ResourceSubCategory: Model<IResourceSubCategory> =
  mongoose.model<IResourceSubCategory>("ResourceSubCategory", ResourceSubCategorySchema);
