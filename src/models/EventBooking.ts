import mongoose, { Model, Schema } from "mongoose";

export interface IEventBooking {
  _id: mongoose.Types.ObjectId;
  eventId: mongoose.Types.ObjectId;
  eventSlug: string;
  organizerOrganizationId: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  ticketType?: string;
  ticketPrice?: number;
  createdAt: Date;
  updatedAt: Date;
}

const EventBookingSchema = new Schema<IEventBooking>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    eventSlug: { type: String, required: true, trim: true, index: true },
    organizerOrganizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    ticketType: { type: String, trim: true },
    ticketPrice: Number,
  },
  { timestamps: true }
);

export const EventBooking: Model<IEventBooking> =
  mongoose.models.EventBooking ?? mongoose.model<IEventBooking>("EventBooking", EventBookingSchema);
