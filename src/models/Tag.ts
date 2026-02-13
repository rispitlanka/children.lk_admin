import mongoose, { Schema, Model } from "mongoose";

export interface ITag {
  _id: mongoose.Types.ObjectId;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const TagSchema = new Schema<ITag>(
  {
    name: { type: String, required: true, unique: true, trim: true },
  },
  { timestamps: true }
);

export const Tag: Model<ITag> =
  mongoose.models.Tag ?? mongoose.model<ITag>("Tag", TagSchema);
