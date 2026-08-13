"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Select from "@/components/form/Select";
import ResourceDescriptionQuill from "@/components/form/ResourceDescriptionQuill";
import YouTubeEmbed from "@/components/ui/video/YouTubeEmbed";
import QuizQuestionEditor from "@/components/form/QuizQuestionEditor";
import { ChevronLeftIcon, PlusIcon } from "@/icons";
import { IQuizQuestion } from "@/models/Lesson";

export function extractYouTubeId(url: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }
  const regExp =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);
  return match && match[1] ? match[1] : "";
}

const CONTENT_TYPE_OPTIONS = [
  { value: "video", label: "Video" },
  { value: "text", label: "Text" },
  { value: "quiz", label: "Quiz" },
];

const VISIBILITY_STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

export type LessonFormInitialData = {
  _id?: string;
  title?: string;
  contentType?: "video" | "text" | "quiz";
  visibilityStatus?: "draft" | "published";
  youtubeUrl?: string;
  youtubeVideoId?: string;
  durationSeconds?: number;
  textContent?: string;
  passPercentage?: number;
  quizQuestions?: IQuizQuestion[];
};

export type AddLessonClientProps = {
  initialData?: LessonFormInitialData;
  isEditing?: boolean;
  lessonId?: string;
};

export default function AddLessonClient({
  initialData,
  isEditing = false,
  lessonId,
}: AddLessonClientProps) {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;
  const targetLessonId = lessonId || initialData?._id;

  const [title, setTitle] = useState(initialData?.title ?? "");
  const [contentType, setContentType] = useState<"video" | "text" | "quiz">(
    initialData?.contentType ?? "video"
  );
  const [visibilityStatus, setVisibilityStatus] = useState<
    "draft" | "published"
  >(initialData?.visibilityStatus ?? "draft");

  // Video fields
  const [youtubeUrl, setYoutubeUrl] = useState(initialData?.youtubeUrl ?? "");
  const [youtubeVideoId, setYoutubeVideoId] = useState(
    initialData?.youtubeVideoId ?? extractYouTubeId(initialData?.youtubeUrl ?? "")
  );
  const [durationSeconds, setDurationSeconds] = useState<number | string>(
    initialData?.durationSeconds ?? ""
  );

  // Text field
  const [textContent, setTextContent] = useState(initialData?.textContent ?? "");

  // Quiz fields
  const [passPercentage, setPassPercentage] = useState<number | string>(
    initialData?.passPercentage ?? 70
  );
  const [quizQuestions, setQuizQuestions] = useState<IQuizQuestion[]>(
    initialData?.quizQuestions ?? []
  );
  const [courseName, setCourseName] = useState("");

  React.useEffect(() => {
    if (!courseId) return;
    fetch(`/api/admin/learning-courses/${courseId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.name) {
          setCourseName(data.name);
        }
      })
      .catch(() => {});
  }, [courseId]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleYoutubeUrlBlur = () => {
    const extracted = extractYouTubeId(youtubeUrl);
    if (extracted) {
      setYoutubeVideoId(extracted);
    }
  };

  const handleYoutubeUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setYoutubeUrl(val);
    const extracted = extractYouTubeId(val);
    if (extracted) {
      setYoutubeVideoId(extracted);
    }
  };

  const handleAddQuestion = () => {
    const newQuestion: IQuizQuestion = {
      questionText: "",
      questionType: "single",
      options: [
        { text: "", isCorrect: true },
        { text: "", isCorrect: false },
      ],
      points: 1,
      explanation: "",
    };
    setQuizQuestions((prev) => [...prev, newQuestion]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuizQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestion = (idx: number, updated: IQuizQuestion) => {
    setQuizQuestions((prev) =>
      prev.map((q, i) => (i === idx ? updated : q))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;

    setError("");
    if (!title.trim()) {
      const msg = "Please enter a lesson title";
      setError(msg);
      toast.error(msg);
      return;
    }

    // Quiz Client-side Validation
    if (contentType === "quiz") {
      const numPass = Number(passPercentage);
      if (isNaN(numPass) || numPass < 0 || numPass > 100) {
        const msg = "Pass percentage must be a number between 0 and 100";
        setError(msg);
        toast.error(msg);
        return;
      }

      if (!quizQuestions || quizQuestions.length === 0) {
        const msg = "Please add at least one question to the quiz";
        setError(msg);
        toast.error(msg);
        return;
      }

      for (let i = 0; i < quizQuestions.length; i++) {
        const q = quizQuestions[i];
        const qNum = i + 1;
        const qText = q.questionText?.trim();

        if (!qText) {
          const msg = `Question ${qNum}: Question text is required`;
          setError(msg);
          toast.error(msg);
          return;
        }

        if (!q.options || q.options.length < 2) {
          const msg = `Question ${qNum}: Must have at least 2 options`;
          setError(msg);
          toast.error(msg);
          return;
        }

        let correctCount = 0;
        for (let j = 0; j < q.options.length; j++) {
          const opt = q.options[j];
          if (q.questionType !== "true_false") {
            if (!opt.text || !opt.text.trim()) {
              const msg = `Question ${qNum}, Option ${j + 1}: Option text cannot be empty`;
              setError(msg);
              toast.error(msg);
              return;
            }
          }
          if (opt.isCorrect) correctCount++;
        }

        if (
          (q.questionType === "single" || q.questionType === "true_false") &&
          correctCount !== 1
        ) {
          const msg = `Question ${qNum}: Single choice & True/False questions must have exactly 1 correct answer`;
          setError(msg);
          toast.error(msg);
          return;
        }

        if (q.questionType === "multiple" && correctCount < 1) {
          const msg = `Question ${qNum}: Multiple choice questions must have at least 1 correct answer`;
          setError(msg);
          toast.error(msg);
          return;
        }
      }
    }

    let finalVideoId = youtubeVideoId;
    if (contentType === "video" && youtubeUrl) {
      const extracted = extractYouTubeId(youtubeUrl);
      if (extracted) finalVideoId = extracted;
    }

    setSubmitting(true);

    try {
      const payload: Record<string, unknown> = {
        title: title.trim(),
        contentType,
        visibilityStatus,
      };

      if (contentType === "video") {
        payload.youtubeUrl = youtubeUrl.trim() || undefined;
        payload.youtubeVideoId = finalVideoId || undefined;
        payload.durationSeconds =
          durationSeconds !== "" ? Number(durationSeconds) : undefined;
      } else if (contentType === "text") {
        payload.textContent = textContent || undefined;
      } else if (contentType === "quiz") {
        payload.passPercentage =
          passPercentage !== "" ? Number(passPercentage) : 70;
        payload.quizQuestions = quizQuestions.map((q) => ({
          questionText: q.questionText.trim(),
          questionType: q.questionType,
          options: q.options.map((opt) => ({
            text: opt.text.trim(),
            isCorrect: Boolean(opt.isCorrect),
          })),
          explanation: q.explanation?.trim() || undefined,
          points: typeof q.points === "number" && q.points >= 0 ? q.points : 1,
        }));
      }

      const isEdit = isEditing || !!targetLessonId;
      const url = isEdit
        ? `/api/admin/learning-courses/${courseId}/lessons/${targetLessonId}`
        : `/api/admin/learning-courses/${courseId}/lessons`;
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        const msg = data.error ?? `Failed to ${isEdit ? "update" : "create"} lesson`;
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }

      toast.success(
        isEdit ? "Lesson updated successfully" : "Lesson created successfully"
      );
      router.push(`/admin/learning-hub/${courseId}/lessons`);
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  const isEditMode = isEditing || !!targetLessonId;

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Link
              href={`/admin/learning-hub/${courseId}/lessons`}
              className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
            >
              <ChevronLeftIcon className="h-4 w-4" />
              Back to lessons
            </Link>
          </div>
          <PageBreadcrumb
            pageTitle={isEditMode ? (title ? `Edit Lesson - ${title}` : "Edit Lesson") : "Add New Lesson"}
            items={[
              { name: "Learning Hub", href: "/admin/learning-hub" },
              { name: courseName || "Course", href: `/admin/learning-hub/${courseId}/lessons` },
              { name: "Lessons", href: `/admin/learning-hub/${courseId}/lessons` },
              { name: isEditMode ? (title || "Edit Lesson") : "Add Lesson" },
            ]}
          />
        </div>

        <Link href={`/admin/learning-hub/${courseId}/lessons`}>
          <Button size="sm" variant="outline" className="h-10 px-4 text-xs">
            Cancel
          </Button>
        </Link>
      </div>

      <ComponentCard
        title={isEditMode ? "Edit Lesson" : "Add New Lesson"}
        desc="Fill in the details below to save this lesson."
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-[10px] border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-2">
              <Label>Lesson Title *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Introduction to Child Safety Rights"
                required
              />
            </div>

            <div>
              <Label>Content Type *</Label>
              <Select
                key={contentType}
                defaultValue={contentType}
                options={CONTENT_TYPE_OPTIONS}
                onChange={(val) => setContentType(val as "video" | "text" | "quiz")}
              />
            </div>

            <div>
              <Label>Visibility Status *</Label>
              <Select
                key={visibilityStatus}
                defaultValue={visibilityStatus}
                options={VISIBILITY_STATUS_OPTIONS}
                onChange={(val) => setVisibilityStatus(val as "draft" | "published")}
              />
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 dark:border-gray-800">
            {/* Conditional Block 1: Video */}
            {contentType === "video" && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Video Settings
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="sm:col-span-2">
                    <Label>YouTube URL</Label>
                    <Input
                      type="text"
                      value={youtubeUrl}
                      onChange={handleYoutubeUrlChange}
                      onBlur={handleYoutubeUrlBlur}
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    />
                    <p className="mt-1 text-[11px] text-gray-500">
                      Supports youtube.com/watch?v=, youtu.be/, and youtube.com/embed/
                    </p>
                  </div>

                  <div>
                    <Label>Duration (seconds)</Label>
                    <Input
                      type="number"
                      value={durationSeconds}
                      onChange={(e) => setDurationSeconds(e.target.value)}
                      placeholder="e.g. 180"
                      min="0"
                    />
                  </div>
                </div>

                {youtubeVideoId && (
                  <div className="mt-4 space-y-2">
                    <Label>Video Preview</Label>
                    <div className="max-w-xl">
                      <YouTubeEmbed videoId={youtubeVideoId} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conditional Block 2: Text */}
            {contentType === "text" && (
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                  Text Content
                </h4>
                <div className="rounded-[10px] border border-gray-200 bg-white p-1 dark:border-gray-800 dark:bg-gray-dark min-h-[220px]">
                  <ResourceDescriptionQuill
                    value={textContent}
                    onChange={setTextContent}
                    placeholder="Write detailed lesson content here..."
                  />
                </div>
              </div>
            )}

            {/* Conditional Block 3: Quiz */}
            {contentType === "quiz" && (
              <div className="space-y-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-800 dark:text-white">
                      Quiz Settings & Builder
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Configure passing threshold and add questions for this lesson.
                    </p>
                  </div>

                  <div className="w-full sm:w-48">
                    <Label>Pass Percentage (%)</Label>
                    <Input
                      type="number"
                      value={passPercentage}
                      onChange={(e) => setPassPercentage(e.target.value)}
                      placeholder="70"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>

                {quizQuestions.length === 0 ? (
                  <div className="rounded-[10px] border border-dashed border-gray-300 bg-gray-50 p-8 text-center dark:border-gray-700 dark:bg-gray-800/40">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      No quiz questions added yet
                    </p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Click the button below to add your first question block.
                    </p>
                    <div className="mt-4 flex justify-center">
                      <Button
                        type="button"
                        size="sm"
                        onClick={handleAddQuestion}
                        startIcon={<PlusIcon className="h-4 w-4" />}
                      >
                        Add Question
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {quizQuestions.map((q, idx) => (
                      <QuizQuestionEditor
                        key={idx}
                        question={q}
                        index={idx}
                        totalQuestions={quizQuestions.length}
                        onChange={(updated) => handleUpdateQuestion(idx, updated)}
                        onRemove={() => handleRemoveQuestion(idx)}
                      />
                    ))}

                    <div className="flex justify-end pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddQuestion}
                        startIcon={<PlusIcon className="h-4 w-4" />}
                      >
                        Add Question
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 mt-6 dark:border-gray-800">
            <Link href={`/admin/learning-hub/${courseId}/lessons`}>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-4 text-xs"
              >
                Cancel
              </Button>
            </Link>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="h-10 px-4 text-xs"
            >
              {submitting
                ? "Saving..."
                : isEditMode
                ? "Update Lesson"
                : "Create Lesson"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}

