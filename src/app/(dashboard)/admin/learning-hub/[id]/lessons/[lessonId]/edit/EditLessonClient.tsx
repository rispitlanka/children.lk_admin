"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import toast from "react-hot-toast";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import AddLessonClient, { LessonFormInitialData } from "../../AddLessonClient";

export default function EditLessonClient() {
  const params = useParams();
  const id = params?.id as string;
  const lessonId = params?.lessonId as string;

  const [lesson, setLesson] = useState<LessonFormInitialData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id || !lessonId) return;
    fetch(`/api/admin/learning-courses/${id}/lessons/${lessonId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setLesson(data);
      })
      .catch((err) => {
        console.error(err);
        toast.error("Failed to load lesson details");
      })
      .finally(() => setLoading(false));
  }, [id, lessonId]);

  if (loading) {
    return (
      <div className="w-full space-y-8">
        <PageBreadcrumb pageTitle="Edit Lesson" />
        <LoadingLottie variant="block" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="w-full space-y-8">
        <PageBreadcrumb pageTitle="Edit Lesson" />
        <p className="text-sm text-gray-500">Lesson not found.</p>
      </div>
    );
  }

  return (
    <AddLessonClient
      initialData={lesson}
      isEditing={true}
      lessonId={lessonId}
    />
  );
}
