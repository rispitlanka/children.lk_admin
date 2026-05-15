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
    <div className="w-full">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Edit News Media" />
        <Link href="/admin/news-media">
          <Button size="sm" variant="outline">Back to list</Button>
        </Link>
      </div>

      <ComponentCard title="Edit News Media" desc="Update the details, image, or attached files.">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600">
              {error}
            </p>
          )}

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
                className="mt-1"
              />
            </div>
            
            <div className="sm:col-span-2">
              <Label>Content *</Label>
              <TextArea
                value={form.content}
                onChange={(v) => setForm((f) => ({ ...f, content: v }))}
                rows={6}
                className="mt-1"
              />
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <Label>Featured Image (Max 10MB)</Label>
              {form.existingFeaturedImage && !featuredImage && (
                <div className="mb-2">
                  <img src={form.existingFeaturedImage} alt="Featured" className="w-32 h-32 object-cover rounded" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100"
              />
              {featuredImage && (
                <div className="mt-2">
                  <p className="text-sm text-gray-500 mb-1">New selected: {featuredImage.name}</p>
                  <img src={URL.createObjectURL(featuredImage)} alt="Preview" className="w-32 h-32 object-cover rounded" />
                </div>
              )}
            </div>

            <div className="sm:col-span-2 md:col-span-1">
              <Label>Files (Max 10MB each)</Label>
              {form.existingFiles.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-semibold mb-1">Existing Files:</p>
                  <ul className="text-sm text-gray-500 space-y-1">
                    {form.existingFiles.map((f, i) => (
                      <li key={i} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                        <a href={f} target="_blank" rel="noreferrer" className="truncate text-brand-600 max-w-[200px]">{f.split('/').pop()}</a>
                        <button type="button" onClick={() => removeExistingFile(f)} className="text-red-500 text-xs">Remove</button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              <input
                type="file"
                multiple
                onChange={handleFilesChange}
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-50 file:text-gray-700 hover:file:bg-gray-100"
              />
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((f, i) => (
                    <div key={i} className="border border-gray-200 dark:border-gray-800 rounded p-2 flex flex-col items-center max-w-[150px]">
                      {f.type.startsWith("image/") ? (
                        <img src={URL.createObjectURL(f)} alt={f.name} className="w-20 h-20 object-cover rounded mb-1" />
                      ) : (
                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded flex items-center justify-center mb-1 text-xs text-gray-500">File</div>
                      )}
                      <span className="text-xs text-gray-500 truncate w-full text-center" title={f.name}>{f.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-6">
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? "Saving..." : "Save Changes"}
            </Button>
            <Link href="/admin/news-media">
              <Button type="button" variant="outline" size="sm">Cancel</Button>
            </Link>
          </div>
        </form>
      </ComponentCard>
    </div>
  );
}
