import mongoose, { Schema, Model } from "mongoose";

export interface IDocumentDownloadCount {
  _id: mongoose.Types.ObjectId;
  resourceId: mongoose.Types.ObjectId;
  documentPublicId: string;
  count: number;
  updatedAt: Date;
}

const DocumentDownloadCountSchema = new Schema<IDocumentDownloadCount>(
  {
    resourceId: { type: Schema.Types.ObjectId, ref: "ResourceRequest", required: true },
    documentPublicId: { type: String, required: true },
    count: { type: Number, required: true, default: 0 },
  },
  { timestamps: { createdAt: false, updatedAt: true } }
);

DocumentDownloadCountSchema.index(
  { resourceId: 1, documentPublicId: 1 },
  { unique: true }
);

export const DocumentDownloadCount: Model<IDocumentDownloadCount> =
  mongoose.models.DocumentDownloadCount ??
  mongoose.model<IDocumentDownloadCount>(
    "DocumentDownloadCount",
    DocumentDownloadCountSchema
  );
