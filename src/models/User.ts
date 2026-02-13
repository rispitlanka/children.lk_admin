import mongoose, { Schema, Model } from "mongoose";

export type UserRole = "admin" | "organizer" | "parent";

export interface IUser {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  address?: string;
  otp?: string;
  otpExpires?: Date;
  organizationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ["admin", "organizer", "parent"], required: true },
    avatar: String,
    phone: String,
    address: String,
    otp: String,
    otpExpires: Date,
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization" },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);
