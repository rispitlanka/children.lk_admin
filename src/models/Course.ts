import mongoose, { Schema, Model } from "mongoose";

export type CourseVisibilityStatus = "draft" | "published" | "archived";

export type CourseAgeGroup = "1-5" | "5-10" | "11-15" | "15-18" | "above-18";

export type CourseTargetAudience = "children" | "people_work_for_children";

export interface ICourse {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  shortDescription: string;
  description?: string;
  coverImage?: string;
  coverImagePublicId?: string;
  tags: string[];
  ageGroup?: CourseAgeGroup;
  targetAudience?: CourseTargetAudience;
  visibilityStatus: CourseVisibilityStatus;
  /** Denormalized count of lessons — updated by the API layer whenever lessons are added/removed. */
  lessonCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

const CourseSchema = new Schema<ICourse>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, trim: true },
    shortDescription: { type: String, required: true },
    description: String,
    coverImage: String,
    coverImagePublicId: String,
    tags: [String],
    ageGroup: {
      type: String,
      enum: ["1-5", "5-10", "11-15", "15-18", "above-18"],
    },
    targetAudience: {
      type: String,
      enum: ["children", "people_work_for_children"],
    },
    visibilityStatus: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    lessonCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Slug uniqueness is handled at the API layer (slugify + collision suffix loop),
// mirroring the pattern used in resource-categories/route.ts.

export const Course: Model<ICourse> =
  mongoose.models.Course ?? mongoose.model<ICourse>("Course", CourseSchema);
