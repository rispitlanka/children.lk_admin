import mongoose, { Schema, Model } from "mongoose";

export interface IEvent {
  _id: mongoose.Types.ObjectId;
  name: string;
  location: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  tags: string[];
  registrationLink?: string;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true },
    location: { type: String, required: true },
    startDate: { type: Date, required: true },
    endDate: Date,
    description: { type: String, required: true },
    tags: [String],
    registrationLink: String,
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  },
  { timestamps: true }
);

export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);
