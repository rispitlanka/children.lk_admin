"use client";

import React, { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import Switch from "@/components/form/switch/Switch";
import LoadingLottie from "@/components/common/LoadingLottie";

import DashedDropzone from "@/components/form/input/DashedDropzone";

export default function EditNewsMediaClient({ idPromise }: { idPromise: Promise<string> }) {
  const router = useRouter();
  const id = use(idPromise);

  const [form, setForm] = useState({
    title: "",
    content: "",
    existingFeaturedImage: "",
    existingFiles: [] as string[],
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const [featuredImage, setFeaturedImage] = useState<File | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    fetch(`/api/admin/news-media/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setForm({
          title: data.title || "",
          content: data.content || "",
          existingFeaturedImage: data.featuredImage || "",
          existingFiles: data.files || [],
        });
      })
      .catch((err) => {
        toast.error("Failed to load news media");
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > MAX_FILE_SIZE) {
        toast.error("Featured image exceeds 10MB");
        return;
      }
      setFeaturedImage(file);
    }
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles = selectedFiles.filter(f => {
        if (f.size > MAX_FILE_SIZE) {
          toast.error(`${f.name} exceeds 10MB`);
          return false;
        }
        return true;
      });
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeExistingFile = (url: string) => {
    setForm(prev => ({
      ...prev,
      existingFiles: prev.existingFiles.filter(f => f !== url)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!form.title.trim() || !form.content.trim()) {
      const msg = "Title and content are required";
      setError(msg);
      toast.error(msg);
      return;
    }
    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("content", form.content.trim());
      
      if (form.existingFeaturedImage && !featuredImage) {
        formData.append("existingFeaturedImage", form.existingFeaturedImage);
      }
      form.existingFiles.forEach(fileUrl => {
        formData.append("existingFiles", fileUrl);
      });

      if (featuredImage) {
        formData.append("featuredImage", featuredImage);
      }
      files.forEach(file => {
        formData.append("files", file);
      });

      const res = await fetch(`/api/admin/news-media/${id}`, {
        method: "PATCH",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error ?? "Failed to update";
        setError(msg);
        toast.error(msg);
        setSubmitting(false);
        return;
      }
      toast.success("Updated successfully");
      router.push("/admin/news-media");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  if (loading) return <LoadingLottie variant="block" />;

  return (
    <div className="w-full space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Edit News Media" />
        <Link href="/admin/news-media">
          <Button size="sm" variant="outline" className="h-10 px-4 text-xs">Back to list</Button>
        </Link>
      </div>

      <ComponentCard title="Edit News Media" desc="Update the details, image, or attached files.">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-[10px] border border-rose-200 bg-rose-50/50 p-3.5 text-xs text-rose-600 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-400">
              {error}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <div className="sm:col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>
            
            <div className="sm:col-span-2">
              <Label>Content *</Label>
              <TextArea
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                rows={6}
              />
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <Label>Featured Image (Max 10MB)</Label>
              {form.existingFeaturedImage && !featuredImage ? (
                <div className="flex items-center gap-3 rounded-[10px] border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                  <img src={form.existingFeaturedImage} alt="Featured" className="h-14 w-14 rounded-[10px] object-cover" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-gray-900 dark:text-white">Current featured image</p>
                    <p className="text-[11px] text-gray-400">Click change to update</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setForm((f) => ({ ...f, existingFeaturedImage: "" }))}
                    className="h-8 text-xs"
                  >
                    Change
                  </Button>
                </div>
              ) : featuredImage ? (
                <div className="flex items-center gap-3 rounded-[10px] border border-gray-200 bg-gray-50/50 p-3 dark:border-gray-800 dark:bg-gray-800/30">
                  <img src={URL.createObjectURL(featuredImage)} alt="Preview" className="h-14 w-14 rounded-[10px] object-cover" />
                  <div className="flex-1 truncate">
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate">{featuredImage.name}</p>
                    <p className="text-[11px] text-gray-400">{(featuredImage.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setFeaturedImage(null)}
                    className="h-8 text-xs"
                  >
                    Remove
                  </Button>
                </div>
              ) : (
                <DashedDropzone
                  onChange={handleImageChange}
                  accept="image/*"
                  label="Click or drag new featured image"
                  sublabel="PNG, JPG, or WEBP (max 10MB)"
                />
              )}
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <Label>Files (Max 10MB each)</Label>
              {form.existingFiles.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Existing Files:</p>
                  <div className="space-y-1.5">
                    {form.existingFiles.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded-[6px] border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 text-xs dark:border-gray-800 dark:bg-gray-800/30">
                        <a href={f} target="_blank" rel="noreferrer" className="truncate text-brand-500 hover:text-brand-600 max-w-[180px]">{f.split('/').pop()}</a>
                        <button type="button" onClick={() => removeExistingFile(f)} className="text-rose-500 hover:text-rose-600 text-xs font-medium">Remove</button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <DashedDropzone
                onChange={handleFilesChange}
                multiple
                label="Click or drag additional files"
                sublabel="Images, PDFs, or docs (max 10MB each)"
              />
              {files.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 rounded-[6px] border border-gray-200 bg-gray-50/50 px-2.5 py-1.5 dark:border-gray-800 dark:bg-gray-800/30 text-xs">
                      <span className="truncate max-w-[120px] text-gray-700 dark:text-gray-300" title={f.name}>{f.name}</span>
                      <button
                        type="button"
                        onClick={() => setFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="text-gray-400 hover:text-rose-500"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 mt-6 dark:border-gray-800">
            <Link href="/admin/news-media">
              <Button type="button" variant="outline" size="sm" className="h-10 px-4 text-xs">
                Cancel
              </Button>
            </Link>
            <Button type="submit" size="sm" disabled={submitting} className="h-10 px-4 text-xs">
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
