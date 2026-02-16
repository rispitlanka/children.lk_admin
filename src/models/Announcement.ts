import mongoose, { Schema, Model } from "mongoose";

export interface IAnnouncement {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  isLive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    isLive: { type: Boolean, required: true, default: false },
  },
  { timestamps: true }
);

export const Announcement: Model<IAnnouncement> =
  mongoose.models.Announcement ??
  mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
