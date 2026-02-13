import mongoose, { Schema, Model } from "mongoose";

export interface IDocumentFile {
  url: string;
  publicId: string;
  type: "pdf" | "video" | "audio" | "docx" | "ppt" | "image";
  name?: string;
}

export interface IResource {
  _id: mongoose.Types.ObjectId;
  name: string;
  shortDescription: string;
  picture?: string;
  picturePublicId?: string;
  documents: IDocumentFile[];
  tags: string[];
  organizationId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentFileSchema = new Schema<IDocumentFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ["pdf", "video", "audio", "docx", "ppt", "image"], required: true },
    name: String,
  },
  { _id: false }
);

const ResourceSchema = new Schema<IResource>(
  {
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    picture: String,
    picturePublicId: String,
    documents: [DocumentFileSchema],
    tags: [String],
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
  },
  { timestamps: true }
);

export const Resource: Model<IResource> =
  mongoose.models.Resource ?? mongoose.model<IResource>("Resource", ResourceSchema);
