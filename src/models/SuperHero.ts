import mongoose, { Schema, Model } from "mongoose";

export interface ISuperHero {
  _id: mongoose.Types.ObjectId;
  name: string;
  color: string;
  contactNumber: string;
  image: string;
  imagePublicId?: string;
  description: string;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SuperHeroSchema = new Schema<ISuperHero>(
  {
    name: { type: String, required: true },
    color: { type: String, required: true, trim: true },
    contactNumber: { type: String, required: true, trim: true },
    image: { type: String, required: true },
    imagePublicId: String,
    description: { type: String, required: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true }
);

export const SuperHero: Model<ISuperHero> =
  mongoose.models.SuperHero ?? mongoose.model<ISuperHero>("SuperHero", SuperHeroSchema);
