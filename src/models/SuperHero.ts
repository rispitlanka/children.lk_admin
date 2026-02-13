import mongoose, { Schema, Model } from "mongoose";

export interface ISuperHero {
  _id: mongoose.Types.ObjectId;
  name: string;
  icon: string; // emoji or image URL
  iconType: "emoji" | "image";
  iconPublicId?: string; // if image uploaded to Cloudinary
  phone: string;
  shortDescription: string;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SuperHeroSchema = new Schema<ISuperHero>(
  {
    name: { type: String, required: true },
    icon: { type: String, required: true },
    iconType: { type: String, enum: ["emoji", "image"], required: true, default: "emoji" },
    iconPublicId: String,
    phone: { type: String, required: true },
    shortDescription: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true }
);

export const SuperHero: Model<ISuperHero> =
  mongoose.models.SuperHero ?? mongoose.model<ISuperHero>("SuperHero", SuperHeroSchema);
