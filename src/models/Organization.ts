import mongoose, { Schema, Model } from "mongoose";

export interface IOrganization {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortDescription: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website?: string;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    logo: String,
    contactEmail: { type: String, required: true },
    contactPhone: { type: String, required: true },
    address: { type: String, required: true },
    website: String,
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  },
  { timestamps: true }
);

export const Organization: Model<IOrganization> =
  mongoose.models.Organization ??
  mongoose.model<IOrganization>("Organization", OrganizationSchema);
