import mongoose, { Schema, Model } from "mongoose";

// ---------------------------------------------------------------------------
// Sub-schema types
// ---------------------------------------------------------------------------

export interface IQuizOption {
  text: string;
  isCorrect: boolean;
}

export type QuizQuestionType = "single" | "multiple" | "true_false";

export interface IQuizQuestion {
  questionText: string;
  questionType: QuizQuestionType;
  options: IQuizOption[];
  explanation?: string;
  /** Points awarded for a correct answer. Defaults to 1. */
  points: number;
}

// ---------------------------------------------------------------------------
// Lesson interface
// ---------------------------------------------------------------------------

export type LessonContentType = "video" | "text" | "quiz";

export type LessonVisibilityStatus = "draft" | "published";

export interface ILesson {
  _id: mongoose.Types.ObjectId;
  courseId: mongoose.Types.ObjectId;
  order: number;
  title: string;
  contentType: LessonContentType;
  visibilityStatus: LessonVisibilityStatus;

  // --- video fields ---
  youtubeUrl?: string;
  youtubeVideoId?: string;
  durationSeconds?: number;

  // --- text fields ---
  /** HTML string produced by a rich-text editor such as Quill. */
  textContent?: string;

  // --- quiz fields ---
  // NOTE (API-layer enforcement): Only the fields that correspond to the
  // lesson's `contentType` should be populated on write. For example, a
  // "video" lesson should not carry quizQuestions, and a "quiz" lesson should
  // not carry youtubeUrl. Enforce this validation in the API route handlers
  // (strip / reject mismatched fields before saving), NOT as a strict Mongoose
  // validator, to keep the schema simple and easy to extend.
  quizQuestions?: IQuizQuestion[];
  /** Minimum percentage of points required to pass the quiz. Defaults to 70. */
  passPercentage?: number;

  createdAt: Date;
  updatedAt: Date;
}

// ---------------------------------------------------------------------------
// Sub-schemas
// ---------------------------------------------------------------------------

const QuizOptionSchema = new Schema<IQuizOption>(
  {
    text: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false }
);

const QuizQuestionSchema = new Schema<IQuizQuestion>(
  {
    questionText: { type: String, required: true },
    questionType: {
      type: String,
      enum: ["single", "multiple", "true_false"],
      required: true,
    },
    options: { type: [QuizOptionSchema], default: [] },
    explanation: String,
    points: { type: Number, default: 1 },
  },
  { _id: false }
);

// ---------------------------------------------------------------------------
// Lesson schema
// ---------------------------------------------------------------------------

const LessonSchema = new Schema<ILesson>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    order: { type: Number, required: true, default: 0 },
    title: { type: String, required: true, trim: true },
    contentType: {
      type: String,
      enum: ["video", "text", "quiz"],
      required: true,
    },
    visibilityStatus: {
      type: String,
      enum: ["draft", "published"],
      default: "draft",
    },

    // video
    youtubeUrl: String,
    youtubeVideoId: String,
    durationSeconds: Number,

    // text
    textContent: String,

    // quiz
    quizQuestions: { type: [QuizQuestionSchema], default: undefined },
    passPercentage: { type: Number, default: 70 },
  },
  { timestamps: true }
);

export const Lesson: Model<ILesson> =
  mongoose.models.Lesson ?? mongoose.model<ILesson>("Lesson", LessonSchema);
