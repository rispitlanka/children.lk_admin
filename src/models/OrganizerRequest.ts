import mongoose, { Schema, Model } from "mongoose";

export interface IOrganizerRequest {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone?: string;
  message?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrganizerRequestSchema = new Schema<IOrganizerRequest>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    message: String,
  },
  { timestamps: true }
);

export const OrganizerRequest: Model<IOrganizerRequest> =
  mongoose.models.OrganizerRequest ??
  mongoose.model<IOrganizerRequest>("OrganizerRequest", OrganizerRequestSchema);
