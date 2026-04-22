import mongoose, { Schema, Model } from "mongoose";

export type RequestStatus = "pending" | "approved" | "denied";

export type ResourceContentType = string;

export type ResourceVisibilityStatus = "draft" | "published" | "archived";

export interface IDocumentFile {
  url: string;
  publicId: string;
  type: "pdf" | "video" | "audio" | "docx" | "ppt" | "image";
  name?: string;
  /** Display / admin file format (may align with type) */
  fileFormat?: string;
  languages?: string[];
  fileSizeBytes?: number;
  isPrimary?: boolean;
}

export interface IResourceRequest {
  _id: mongoose.Types.ObjectId;
  /** Title */
  name: string;
  /** Short summary / legacy list preview */
  shortDescription: string;
  /** Full description (richer content) */
  description?: string;
  publicationDate?: Date;
  picture?: string;
  picturePublicId?: string;
  documents: IDocumentFile[];
  tags: string[];
  /** Super-admin taxonomy */
  categoryId?: mongoose.Types.ObjectId;
  subCategoryId?: mongoose.Types.ObjectId;
  contentType?: ResourceContentType;
  /** e.g. children, adolescents, youth, educators */
  ageAudienceGroups?: string[];
  /** Legacy audience (optional for older records) */
  targetAudience?: "children" | "people_work_for_children";
  ageGroup?: "1-5" | "5-10" | "11-15" | "15-18" | "above-18";
  mainPublisherName?: string;
  hasCoPublishers?: boolean;
  coPublisherOrganizationIds?: mongoose.Types.ObjectId[];
  rightsNotice?: string;
  externalDownloadUrl?: string;
  countries?: string[];
  regions?: string[];
  visibilityStatus?: ResourceVisibilityStatus;
  contentPublishedAt?: Date;
  featured?: boolean;
  slug?: string;
  organizationId: mongoose.Types.ObjectId;
  status: RequestStatus;
  adminReason?: string;
  reviewedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const DocumentFileSchema = new Schema<IDocumentFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ["pdf", "video", "audio", "docx", "ppt", "image"], required: true },
    name: String,
    fileFormat: String,
    languages: [String],
    fileSizeBytes: Number,
    isPrimary: Boolean,
  },
  { _id: false }
);

const ResourceRequestSchema = new Schema<IResourceRequest>(
  {
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    description: String,
    publicationDate: Date,
    picture: String,
    picturePublicId: String,
    documents: [DocumentFileSchema],
    tags: [String],
    categoryId: { type: Schema.Types.ObjectId, ref: "ResourceCategory" },
    subCategoryId: { type: Schema.Types.ObjectId, ref: "ResourceSubCategory" },
    contentType: { type: String },
    ageAudienceGroups: [String],
    targetAudience: {
      type: String,
      enum: ["children", "people_work_for_children"],
      default: "children",
    },
    ageGroup: {
      type: String,
      enum: ["1-5", "5-10", "11-15", "15-18", "above-18"],
    },
    mainPublisherName: String,
    hasCoPublishers: { type: Boolean, default: false },
    coPublisherOrganizationIds: [{ type: Schema.Types.ObjectId, ref: "Organization" }],
    rightsNotice: String,
    externalDownloadUrl: String,
    countries: [String],
    regions: [String],
    visibilityStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    contentPublishedAt: Date,
    featured: { type: Boolean, default: false },
    slug: { type: String, trim: true, sparse: true },
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    status: { type: String, enum: ["pending", "approved", "denied"], default: "pending" },
    adminReason: String,
    reviewedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

if (mongoose.models.ResourceRequest) {
  delete mongoose.models.ResourceRequest;
}

export const ResourceRequest: Model<IResourceRequest> =
  mongoose.model<IResourceRequest>("ResourceRequest", ResourceRequestSchema);
