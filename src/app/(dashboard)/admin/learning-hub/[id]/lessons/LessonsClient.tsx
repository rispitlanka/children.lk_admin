"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Modal } from "@/components/ui/modal";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PencilIcon, TrashBinIcon, PlusIcon, ChevronLeftIcon } from "@/icons";

type LessonItem = {
  _id: string;
  courseId: string;
  title: string;
  contentType: "video" | "text" | "quiz";
  visibilityStatus: "draft" | "published";
  order: number;
  youtubeUrl?: string;
  youtubeVideoId?: string;
  durationSeconds?: number;
  textContent?: string;
  passPercentage?: number;
  createdAt: string;
  updatedAt: string;
};

type CourseData = {
  _id: string;
  name: string;
};

const DragHandleIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg
    className={className}
    fill="currentColor"
    viewBox="0 0 20 20"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7 4a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0zM7 16a2 2 0 11-4 0 2 2 0 014 0zM17 4a2 2 0 11-4 0 2 2 0 014 0zM17 10a2 2 0 11-4 0 2 2 0 014 0zM17 16a2 2 0 11-4 0 2 2 0 014 0z" />
  </svg>
);

interface DraggableRowProps {
  lesson: LessonItem;
  index: number;
  moveRow: (dragIndex: number, hoverIndex: number) => void;
  onDropEnd: () => void;
  onDelete: (id: string) => void;
  courseId: string;
}

const DraggableLessonRow: React.FC<DraggableRowProps> = ({
  lesson,
  index,
  moveRow,
  onDropEnd,
  onDelete,
  courseId,
}) => {
  const rowRef = useRef<HTMLTableRowElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: "LESSON_ROW",
    item: () => ({ id: lesson._id, index }),
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: "LESSON_ROW",
    hover(item: { id: string; index: number }, monitor) {
      if (!rowRef.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = rowRef.current.getBoundingClientRect();
      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      if (!clientOffset) return;
      const hoverClientY = clientOffset.y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveRow(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
    drop() {
      onDropEnd();
    },
  });

  const attachRowRef = (node: HTMLTableRowElement | null) => {
    rowRef.current = node;
    drop(node);
  };

  const attachHandleRef = (node: HTMLDivElement | null) => {
    handleRef.current = node;
    drag(node);
  };

  const getContentTypeBadge = (type: LessonItem["contentType"]) => {
    switch (type) {
      case "video":
        return <Badge size="sm" color="info">Video</Badge>;
      case "text":
        return <Badge size="sm" color="light">Text</Badge>;
      case "quiz":
        return <Badge size="sm" color="warning">Quiz</Badge>;
      default:
        return <Badge size="sm" color="primary">{type}</Badge>;
    }
  };

  const getVisibilityBadge = (status: LessonItem["visibilityStatus"]) => {
    switch (status) {
      case "published":
        return <Badge size="sm" color="success">Published</Badge>;
      case "draft":
        return <Badge size="sm" color="warning">Draft</Badge>;
      default:
        return <Badge size="sm" color="light">{status}</Badge>;
    }
  };

  return (
    <TableRow
      ref={attachRowRef}
      className={`border-b border-gray-200 transition-colors hover:bg-gray-50/60 dark:border-gray-800 dark:hover:bg-white/[0.02] ${
        isDragging ? "opacity-30 bg-brand-50/20" : ""
      }`}
    >
      <TableCell className="px-4 py-3 text-center">
        <div
          ref={attachHandleRef}
          className="inline-flex cursor-grab active:cursor-grabbing p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Drag to reorder"
        >
          <DragHandleIcon className="h-4 w-4" />
        </div>
      </TableCell>
      <TableCell className="px-4 py-3 font-medium text-gray-600 dark:text-gray-400 text-xs">
        #{index + 1}
      </TableCell>
      <TableCell className="px-4 py-3 text-gray-800 dark:text-white/90 font-medium">
        <span className="block font-semibold line-clamp-1" title={lesson.title}>
          {lesson.title}
        </span>
      </TableCell>
      <TableCell className="px-4 py-3">
        {getContentTypeBadge(lesson.contentType)}
      </TableCell>
      <TableCell className="px-4 py-3">
        {getVisibilityBadge(lesson.visibilityStatus)}
      </TableCell>
      <TableCell className="px-4 py-3 text-right">
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/admin/learning-hub/${courseId}/lessons/${lesson._id}/edit`}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/10 dark:hover:text-white"
            title="Edit Lesson"
          >
            <PencilIcon className="size-4" />
          </Link>
          <button
            type="button"
            onClick={() => onDelete(lesson._id)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] bg-transparent text-rose-500 transition-colors hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-500/10"
            title="Delete Lesson"
          >
            <TrashBinIcon className="size-4" />
          </button>
        </div>
      </TableCell>
    </TableRow>
  );
};

export default function LessonsClient() {
  const params = useParams();
  const router = useRouter();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<CourseData | null>(null);
  const [lessons, setLessons] = useState<LessonItem[]>([]);
  const [previousLessons, setPreviousLessons] = useState<LessonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const lessonsRef = useRef<LessonItem[]>([]);
  lessonsRef.current = lessons;

  const isReorderingRef = useRef(false);

  useEffect(() => {
    if (!courseId) return;

    // Fetch course details & lessons in parallel
    Promise.all([
      fetch(`/api/admin/learning-courses/${courseId}`).then((r) => r.json()),
      fetch(`/api/admin/learning-courses/${courseId}/lessons`).then((r) => r.json()),
    ])
      .then(([courseData, lessonsData]) => {
        if (courseData.error) throw new Error(courseData.error);
        setCourse(courseData);

        const list = Array.isArray(lessonsData) ? lessonsData : [];
        setLessons(list);
        setPreviousLessons(list);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load course lessons");
      })
      .finally(() => setLoading(false));
  }, [courseId]);

  const moveRow = (dragIndex: number, hoverIndex: number) => {
    setLessons((prev) => {
      const updated = [...prev];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(hoverIndex, 0, moved);
      return updated;
    });
  };

  const handleDropEnd = async () => {
    if (isReorderingRef.current) return;
    isReorderingRef.current = true;

    const currentLessons = lessonsRef.current;
    const newOrderedIds = currentLessons.map((l) => l._id);
    const snapshot = [...previousLessons];

    // Update snapshot for potential subsequent moves
    setPreviousLessons(currentLessons);

    try {
      const res = await fetch(
        `/api/admin/learning-courses/${courseId}/lessons/reorder`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderedLessonIds: newOrderedIds }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Failed to update lesson order");
        setLessons(snapshot);
        setPreviousLessons(snapshot);
      } else {
        toast.success("Lessons reordered");
      }
    } catch {
      toast.error("Failed to update lesson order");
      setLessons(snapshot);
      setPreviousLessons(snapshot);
    } finally {
      isReorderingRef.current = false;
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId || !courseId) return;
    setDeleting(true);
    try {
      const res = await fetch(
        `/api/admin/learning-courses/${courseId}/lessons/${deleteId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (res.ok) {
        setDeleteId(null);
        toast.success("Lesson deleted successfully");
        // Remove locally
        const updated = lessons.filter((l) => l._id !== deleteId);
        setLessons(updated);
        setPreviousLessons(updated);
      } else {
        toast.error(data.error ?? "Failed to delete lesson");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Link
                href="/admin/learning-hub"
                className="inline-flex items-center gap-1 text-xs text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Back to courses
              </Link>
            </div>
            <PageBreadcrumb
              pageTitle={course ? `${course.name} - Lessons` : "Course Lessons"}
              items={[
                { name: "Learning Hub", href: "/admin/learning-hub" },
                { name: course?.name || "Course" },
                { name: "Lessons" },
              ]}
            />
          </div>

          <Button
            onClick={() =>
              router.push(`/admin/learning-hub/${courseId}/lessons/new`)
            }
            startIcon={<PlusIcon className="h-4 w-4" />}
          >
            Add Lesson
          </Button>
        </div>

        <ComponentCard
          title={course ? `Lessons for ${course.name}` : "Lessons"}
          desc="Drag rows to reorder lessons. Changes are saved automatically."
        >
          {loading ? (
            <LoadingLottie variant="block" />
          ) : (
            <div className="overflow-x-auto">
              <Table className="table-fixed w-full text-left text-theme-sm">
                <colgroup>
                  <col className="w-[48px]" />
                  <col className="w-[60px]" />
                  <col className="w-[45%]" />
                  <col className="w-[15%]" />
                  <col className="w-[15%]" />
                  <col className="w-[120px]" />
                </colgroup>
                <TableHeader>
                  <TableRow className="border-b border-gray-200 bg-transparent dark:border-gray-800">
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-center"
                    >
                      Drag
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Order
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Title
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Content Type
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400"
                    >
                      Status
                    </TableCell>
                    <TableCell
                      isHeader
                      className="px-4 py-3 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400 text-right"
                    >
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessons.map((lesson, idx) => (
                    <DraggableLessonRow
                      key={lesson._id}
                      lesson={lesson}
                      index={idx}
                      moveRow={moveRow}
                      onDropEnd={handleDropEnd}
                      onDelete={(id) => setDeleteId(id)}
                      courseId={courseId}
                    />
                  ))}
                </TableBody>
              </Table>
              {lessons.length === 0 && (
                <div className="py-12 text-center">
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                    No lessons yet
                  </h4>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Click &quot;Add Lesson&quot; to create the first lesson for this course.
                  </p>
                </div>
              )}
            </div>
          )}
        </ComponentCard>

        <Modal
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          className="max-w-sm w-full border border-gray-200 dark:border-gray-800"
        >
          <div className="p-6 text-center">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Delete Lesson?
            </h3>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              This action cannot be undone. Are you sure you want to delete this lesson?
            </p>
            <div className="mt-6 flex gap-2 justify-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteId(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleDeleteConfirm}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </DndProvider>
  );
}
