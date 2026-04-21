import mongoose, { Schema, Model } from "mongoose";

export interface IEvent {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  location: string;
  eventCategory?: string;
  locationName?: string;
  locationAddress?: string;
  locationContact?: string;
  locationLatitude?: number;
  locationLongitude?: number;
  startDate: Date;
  endDate?: Date;
  description: string;
  tags: string[];
  pricingType?: "free" | "paid";
  ticketOptions?: { ticketType: string; ticketPrice: number }[];
  ticketType?: string;
  ticketPrice?: number;
  registrationMode?: "internal" | "external";
  registrationExternalUrl?: string;
  internalRegistrationFields?: string[];
  whoCanJoin: string[];
  coverImage?: string;
  coverImagePublicId?: string;
  highlight1?: string;
  highlight2?: string;
  highlight3?: string;
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, trim: true, unique: true },
    location: { type: String, required: true },
    eventCategory: { type: String, trim: true },
    locationName: { type: String, trim: true },
    locationAddress: { type: String, trim: true },
    locationContact: { type: String, trim: true },
    locationLatitude: Number,
    locationLongitude: Number,
    startDate: { type: Date, required: true },
    endDate: Date,
    description: { type: String, required: true },
    tags: [String],
    pricingType: { type: String, enum: ["free", "paid"], default: "free" },
    ticketOptions: [
      {
        ticketType: { type: String, trim: true },
        ticketPrice: Number,
      },
    ],
    ticketType: String,
    ticketPrice: Number,
    registrationMode: { type: String, enum: ["internal", "external"], default: "external" },
    registrationExternalUrl: String,
    internalRegistrationFields: [String],
    whoCanJoin: { type: [String], required: true, default: [] },
    coverImage: String,
    coverImagePublicId: String,
    highlight1: String,
    highlight2: String,
    highlight3: String,
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  },
  { timestamps: true }
);

export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);
