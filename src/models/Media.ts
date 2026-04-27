import mongoose, { Schema, Model } from "mongoose";

export interface IMediaFile {
  url: string;
  publicId: string;
  type: "video" | "audio" | "image";
  name?: string;
}

export type MediaVisibilityStatus = "draft" | "published" | "archived";

export interface IChildInfo {
  fullName: string;
  age: string;
  gender: string;
  city: string;
  country: string;
}

export interface IMedia {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  contentType: "artwork" | "story_poem" | "video";
  visibilityStatus?: MediaVisibilityStatus;
  tags?: string[];
  childInfo: IChildInfo;
  artwork?: {
    title: string;
    description: string;
    medium: string;
    dateCreated?: Date;
    theme: string;
    tags?: string[];
    artwork: IMediaFile;
  };
  storyPoem?: {
    title: string;
    writtenWorkType: string;
    language: string;
    dateWritten?: Date;
    article: string;
    theme: string;
    tags?: string[];
    coverImage?: IMediaFile;
  };
  video?: {
    title: string;
    videoType: string;
    duration: string;
    releasedDate?: Date;
    language: string;
    aspectRatio: string;
    synopsis?: string;
    youtubeLink: string;
    thumbnail: IMediaFile;
    theme: string;
    tags?: string[];
  };
  files: IMediaFile[];
  organizationId: mongoose.Types.ObjectId;
  source?: string;
  createdAt: Date;
  updatedAt: Date;
}

const MediaFileSchema = new Schema<IMediaFile>(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    type: { type: String, enum: ["video", "audio", "image"], required: true },
    name: String,
  },
  { _id: false }
);

const ChildInfoSchema = new Schema<IChildInfo>(
  {
    fullName: { type: String, required: true },
    age: { type: String, required: true },
    gender: { type: String, required: true },
    city: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

const MediaSchema = new Schema<IMedia>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    contentType: {
      type: String,
      enum: ["artwork", "story_poem", "video"],
      required: true,
    },
    visibilityStatus: { type: String, enum: ["draft", "published", "archived"], default: "published" },
    tags: [String],
    childInfo: { type: ChildInfoSchema, required: true },
    artwork: {
      title: { type: String },
      description: { type: String },
      medium: { type: String },
      dateCreated: { type: Date },
      theme: { type: String },
      tags: [String],
      artwork: { type: MediaFileSchema },
    },
    storyPoem: {
      title: { type: String },
      writtenWorkType: { type: String },
      language: { type: String },
      dateWritten: { type: Date },
      article: { type: String },
      theme: { type: String },
      tags: [String],
      coverImage: { type: MediaFileSchema },
    },
    video: {
      title: { type: String },
      videoType: { type: String },
      duration: { type: String },
      releasedDate: { type: Date },
      language: { type: String },
      aspectRatio: { type: String },
      synopsis: { type: String },
      youtubeLink: { type: String },
      thumbnail: { type: MediaFileSchema },
      theme: { type: String },
      tags: [String],
    },
    files: [MediaFileSchema],
    organizationId: { type: Schema.Types.ObjectId, ref: "Organization", required: true },
    source: String,
  },
  { timestamps: true }
);

export const Media: Model<IMedia> =
  (() => {
    if (mongoose.models.Media) {
      delete mongoose.models.Media;
    }
    return mongoose.model<IMedia>("Media", MediaSchema);
  })();
