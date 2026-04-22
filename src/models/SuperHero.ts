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
  /** Set when this row was created from an approved organizer request (public visibility follows request status). */
  sourceRequestId?: mongoose.Types.ObjectId;
  /** `admin` = created from admin UI/API; `organizer_request` = created when a request was approved. */
  creationSource?: "admin" | "organizer_request";
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
    sourceRequestId: { type: Schema.Types.ObjectId, ref: "SuperHeroRequest" },
    creationSource: {
      type: String,
      enum: ["admin", "organizer_request"],
    },
  },
  { timestamps: true }
);

export const SuperHero: Model<ISuperHero> =
  mongoose.models.SuperHero ?? mongoose.model<ISuperHero>("SuperHero", SuperHeroSchema);
