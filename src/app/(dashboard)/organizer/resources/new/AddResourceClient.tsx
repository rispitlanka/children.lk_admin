"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import Button from "@/components/ui/button/Button";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import TextArea from "@/components/form/input/TextArea";
import DatePicker from "@/components/form/date-picker";
import ResourceDescriptionQuill from "@/components/form/ResourceDescriptionQuill";
import TagsSelect from "@/components/form/TagsSelect";
import Checkbox from "@/components/form/input/Checkbox";
import Badge from "@/components/ui/badge/Badge";
import { TrashBinIcon } from "@/icons";
import {
  AGE_AUDIENCE_LABELS,
  AGE_AUDIENCE_VALUES,
  CONTENT_TYPE_LABELS,
  CONTENT_TYPE_VALUES,
  COUNTRY_OPTIONS,
  FILE_FORMAT_LABELS,
  FILE_FORMAT_VALUES,
  LANGUAGE_OPTIONS,
  REGION_OPTIONS,
  VISIBILITY_STATUS_LABELS,
  VISIBILITY_STATUS_VALUES,
  type ContentTypeValue,
  type FileFormatValue,
  type VisibilityStatusValue,
} from "@/lib/resource-form-constants";
import { isRichTextEmpty } from "@/lib/rich-text";
import { slugify } from "@/lib/slugify";

type DocType = "pdf" | "video" | "audio" | "docx" | "ppt" | "image" | "other";
type DocumentFile = {
  url: string;
  publicId: string;
  type: DocType;
  name?: string;
  fileFormat: FileFormatValue;
  languages: string[];
  fileSizeBytes?: number;
  isPrimary: boolean;
};

type TaxCat = {
  _id: string;
  name: string;
  subcategories: { _id: string; name: string }[];
};

function getDocTypeFromFileFormat(fileFormat: FileFormatValue): DocType {
  if (fileFormat === "pdf") return "pdf";
  if (fileFormat === "docx") return "docx";
  if (fileFormat === "pptx") return "ppt";
  if (fileFormat === "image") return "image";
  if (fileFormat === "audio") return "audio";
  if (fileFormat === "video") return "video";
  return "other";
}

function getAcceptFromFileFormat(fileFormat: FileFormatValue): string {
  if (fileFormat === "pdf") return ".pdf,application/pdf";
  if (fileFormat === "docx") {
    return ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  }
  if (fileFormat === "pptx") {
    return ".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation";
  }
  if (fileFormat === "xlsx") {
    return ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  }
  if (fileFormat === "html") return ".htm,.html,text/html";
  if (fileFormat === "image") return "image/*";
  if (fileFormat === "audio") return "audio/*";
  if (fileFormat === "video") return "video/*";
  return "";
}

function getCloudinaryResourceType(docType: DocType): "image" | "video" | "raw" {
  if (docType === "video" || docType === "audio") return "video";
  if (docType === "image") return "image";
  return "raw";
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadFile(
  file: File,
  folder: string,
  resourceType: "image" | "video" | "raw"
): Promise<{ url: string; publicId: string }> {
  const base64 = await fileToBase64(file);
  const res = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      file: base64,
      folder,
      resource_type: resourceType,
      file_name: file.name,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.url) throw new Error(data.error ?? "Upload failed");
  return { url: data.url, publicId: data.publicId };
}

function toggleInList<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((x) => x !== value) : [...list, value];
}

export default function AddResourceClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const [taxonomy, setTaxonomy] = useState<TaxCat[]>([]);
  const [coOrgs, setCoOrgs] = useState<{ _id: string; name: string }[]>([]);

  const [form, setForm] = useState({
    name: "",
    description: "",
    publicationDate: "",
    picture: "",
    picturePublicId: "",
    categoryId: "",
    subCategoryId: "",
    contentType: "",
    mainPublisherName: "",
    rightsNotice: "",
    externalDownloadUrl: "",
    visibilityStatus: "draft" as VisibilityStatusValue,
    contentPublishedAt: "",
    slug: "",
  });
  const [tags, setTags] = useState<string[]>([]);
  const [ageAudienceGroups, setAgeAudienceGroups] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);
  const [customAgeAudience, setCustomAgeAudience] = useState("");
  const [customContentType, setCustomContentType] = useState("");
  const [customContentTypes, setCustomContentTypes] = useState<string[]>([]);
  const [customCountry, setCustomCountry] = useState("");
  const [customRegion, setCustomRegion] = useState("");
  const [hasCoPublishers, setHasCoPublishers] = useState(false);
  const [coPublisherIds, setCoPublisherIds] = useState<string[]>([]);
  const [featured, setFeatured] = useState(false);

  const [picturePreview, setPicturePreview] = useState<{ url: string; publicId: string } | null>(null);
  const [primaryDoc, setPrimaryDoc] = useState<DocumentFile | null>(null);
  const [primaryFileFormat, setPrimaryFileFormat] = useState<FileFormatValue>("pdf");
  const [primaryLanguages, setPrimaryLanguages] = useState<string[]>(["en"]);
  const [slugEditedManually, setSlugEditedManually] = useState(false);

  const [uploadingPicture, setUploadingPicture] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [taxRes, orgRes, coRes] = await Promise.all([
          fetch("/api/organizer/resource-taxonomy"),
          fetch("/api/organizer/organization"),
          fetch("/api/organizer/organizations-for-copublishing"),
        ]);
        const taxData = await taxRes.json();
        const orgData = await orgRes.json();
        const coData = await coRes.json();
        if (!cancelled && taxRes.ok && taxData.categories) {
          setTaxonomy(taxData.categories);
          const first = taxData.categories[0];
          if (first) {
            setForm((f) => ({
              ...f,
              categoryId: f.categoryId || first._id,
              subCategoryId: f.subCategoryId || first.subcategories?.[0]?._id || "",
            }));
          }
        }
        if (!cancelled && orgRes.ok && orgData?.name) {
          setForm((f) => ({ ...f, mainPublisherName: f.mainPublisherName || orgData.name }));
        }
        if (!cancelled && coRes.ok && coData.organizations) {
          setCoOrgs(coData.organizations);
        }
        if (!cancelled && editId) {
          setLoadingExisting(true);
          const existingRes = await fetch(`/api/organizer/resource-requests/${editId}`);
          const existingData = await existingRes.json();
          if (!existingRes.ok || existingData?.error) {
            throw new Error(existingData?.error ?? "Failed to load existing resource");
          }
          const categoryId =
            typeof existingData.categoryId === "object"
              ? String(existingData.categoryId?._id ?? "")
              : String(existingData.categoryId ?? "");
          const subCategoryId =
            typeof existingData.subCategoryId === "object"
              ? String(existingData.subCategoryId?._id ?? "")
              : String(existingData.subCategoryId ?? "");
          const documents = Array.isArray(existingData.documents) ? existingData.documents : [];
          const primary = documents.find((d: { isPrimary?: boolean }) => d?.isPrimary) ?? documents[0];
          setForm((f) => ({
            ...f,
            name: String(existingData.name ?? ""),
            description: String(existingData.description ?? ""),
            publicationDate: existingData.publicationDate ? String(existingData.publicationDate).slice(0, 10) : "",
            picture: String(existingData.picture ?? ""),
            picturePublicId: String(existingData.picturePublicId ?? ""),
            categoryId: categoryId || f.categoryId,
            subCategoryId: subCategoryId || f.subCategoryId,
            contentType: String(existingData.contentType ?? ""),
            mainPublisherName: String(existingData.mainPublisherName ?? f.mainPublisherName),
            rightsNotice: String(existingData.rightsNotice ?? ""),
            externalDownloadUrl: String(existingData.externalDownloadUrl ?? ""),
            visibilityStatus:
              VISIBILITY_STATUS_VALUES.includes(existingData.visibilityStatus as VisibilityStatusValue)
                ? (existingData.visibilityStatus as VisibilityStatusValue)
                : "draft",
            contentPublishedAt: existingData.contentPublishedAt
              ? String(existingData.contentPublishedAt).slice(0, 10)
              : "",
            slug: String(existingData.slug ?? ""),
          }));
          setSlugEditedManually(Boolean(String(existingData.slug ?? "").trim()));
          setTags(Array.isArray(existingData.tags) ? existingData.tags.filter((t: unknown): t is string => typeof t === "string") : []);
          setAgeAudienceGroups(
            Array.isArray(existingData.ageAudienceGroups)
              ? existingData.ageAudienceGroups.filter((x: unknown): x is string => typeof x === "string")
              : []
          );
          setCountries(
            Array.isArray(existingData.countries)
              ? existingData.countries.filter((x: unknown): x is string => typeof x === "string")
              : []
          );
          setRegions(
            Array.isArray(existingData.regions)
              ? existingData.regions.filter((x: unknown): x is string => typeof x === "string")
              : []
          );
          setFeatured(Boolean(existingData.featured));
          const coIds = Array.isArray(existingData.coPublisherOrganizationIds)
            ? existingData.coPublisherOrganizationIds
                .map((x: unknown) => (typeof x === "object" && x ? String((x as { _id?: string })._id ?? "") : String(x ?? "")))
                .filter(Boolean)
            : [];
          setHasCoPublishers(Boolean(existingData.hasCoPublishers && coIds.length));
          setCoPublisherIds(coIds);
          if (primary) {
            const fileFormat = (primary.fileFormat ?? "pdf") as FileFormatValue;
            const languages = Array.isArray(primary.languages)
              ? primary.languages.filter((x: unknown): x is string => typeof x === "string")
              : ["en"];
            setPrimaryFileFormat(FILE_FORMAT_VALUES.includes(fileFormat) ? fileFormat : "pdf");
            setPrimaryLanguages(languages.length ? languages : ["en"]);
            setPrimaryDoc({
              url: String(primary.url ?? ""),
              publicId: String(primary.publicId ?? ""),
              type: getDocTypeFromFileFormat(FILE_FORMAT_VALUES.includes(fileFormat) ? fileFormat : "pdf"),
              name: String(primary.name ?? ""),
              fileFormat: FILE_FORMAT_VALUES.includes(fileFormat) ? fileFormat : "pdf",
              languages: languages.length ? languages : ["en"],
              fileSizeBytes: typeof primary.fileSizeBytes === "number" ? primary.fileSizeBytes : undefined,
              isPrimary: true,
            });
          }
          if (existingData.picture) {
            setPicturePreview({
              url: String(existingData.picture),
              publicId: String(existingData.picturePublicId ?? ""),
            });
          }
          if (
            existingData.contentType &&
            typeof existingData.contentType === "string" &&
            !CONTENT_TYPE_VALUES.includes(existingData.contentType as ContentTypeValue)
          ) {
            setCustomContentTypes((prev) =>
              prev.includes(existingData.contentType) ? prev : [...prev, existingData.contentType]
            );
          }
          setLoadingExisting(false);
        }
      } catch {
        if (!cancelled) toast.error("Failed to load form data");
        if (!cancelled) setLoadingExisting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [editId]);

  const subOptions = useMemo(() => {
    const cat = taxonomy.find((c) => c._id === form.categoryId);
    return cat?.subcategories ?? [];
  }, [taxonomy, form.categoryId]);

  useEffect(() => {
    if (subOptions.length === 0) return;
    if (!subOptions.some((s) => s._id === form.subCategoryId)) {
      setForm((f) => ({ ...f, subCategoryId: subOptions[0]._id }));
    }
  }, [form.categoryId, form.subCategoryId, subOptions]);

  useEffect(() => {
    if (slugEditedManually) return;
    setForm((f) => ({ ...f, slug: slugify(f.name) }));
  }, [form.name, slugEditedManually]);

  const handlePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    setUploadingPicture(true);
    try {
      const result = await uploadFile(file, "childrenlk/resources/pictures", "image");
      setPicturePreview(result);
      setForm((f) => ({ ...f, picture: result.url, picturePublicId: result.publicId }));
    } catch {
      toast.error("Failed to upload cover image");
    }
    setUploadingPicture(false);
    e.target.value = "";
  };

  const handlePrimaryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingDoc(true);
    try {
      const docType = getDocTypeFromFileFormat(primaryFileFormat);
      const resourceType = getCloudinaryResourceType(docType);
      const result = await uploadFile(file, "childrenlk/resources/documents", resourceType);
      setPrimaryDoc({
        url: result.url,
        publicId: result.publicId,
        type: docType,
        name: file.name,
        fileFormat: primaryFileFormat,
        languages: [...primaryLanguages],
        fileSizeBytes: file.size,
        isPrimary: true,
      });
    } catch {
      toast.error("Failed to upload primary file");
    }
    setUploadingDoc(false);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!taxonomy.length) {
      setError("No resource categories are available yet. Ask an admin to add taxonomy under Resource taxonomy.");
      toast.error("Missing categories");
      return;
    }
    if (!form.categoryId || !form.subCategoryId) {
      setError("Select a category and sub category.");
      return;
    }
    if (!form.contentType) {
      setError("Select a content type.");
      return;
    }
    if (!primaryDoc) {
      setError("Upload a primary file.");
      return;
    }
    if (isRichTextEmpty(form.description)) {
      setError("Enter a description.");
      toast.error("Enter a description.");
      return;
    }
    const langs = primaryLanguages.length ? primaryLanguages : ["en"];
    setSubmitting(true);
    try {
      const documents = [
        {
          ...primaryDoc,
          fileFormat: primaryFileFormat,
          languages: langs,
        },
      ];
      const res = await fetch(
        editId ? `/api/organizer/resource-requests/${editId}` : "/api/organizer/resource-requests",
        {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          description: form.description.trim(),
          publicationDate: form.publicationDate || undefined,
          picture: form.picture || undefined,
          picturePublicId: form.picturePublicId || undefined,
          documents,
          tags,
          categoryId: form.categoryId,
          subCategoryId: form.subCategoryId,
          contentType: form.contentType,
          ageAudienceGroups,
          mainPublisherName: form.mainPublisherName.trim(),
          hasCoPublishers,
          coPublisherOrganizationIds: hasCoPublishers ? coPublisherIds : [],
          rightsNotice: form.rightsNotice.trim() || undefined,
          externalDownloadUrl: form.externalDownloadUrl.trim() || undefined,
          countries,
          regions,
          visibilityStatus: form.visibilityStatus,
          contentPublishedAt: form.contentPublishedAt || undefined,
          featured,
          slug: form.slug.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to submit");
        toast.error(data.error ?? "Failed to submit");
        setSubmitting(false);
        return;
      }
      toast.success(
        form.visibilityStatus === "published"
          ? editId
            ? "Resource updated and submitted for review"
            : "Resource request submitted"
          : form.visibilityStatus === "archived"
            ? editId
              ? "Resource updated as archived"
              : "Resource saved as archived"
            : editId
              ? "Resource updated as draft"
              : "Resource saved as draft"
      );
      router.push("/organizer/resources");
    } catch {
      setError("Something went wrong");
      toast.error("Something went wrong");
    }
    setSubmitting(false);
  };

  const docAccept = getAcceptFromFileFormat(primaryFileFormat);

  const selectClass =
    "mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800";

  const descriptionEditorClass = [
    "resource-description-editor mt-1 rounded-lg border border-gray-300 shadow-theme-xs overflow-hidden",
    "dark:border-gray-700",
    "[&_.ql-toolbar]:rounded-t-lg [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-gray-200 [&_.ql-toolbar]:bg-gray-50",
    "dark:[&_.ql-toolbar]:border-gray-700 dark:[&_.ql-toolbar]:bg-gray-800/80",
    "[&_.ql-container]:rounded-b-lg [&_.ql-container]:border-0 [&_.ql-container]:bg-transparent dark:[&_.ql-container]:bg-gray-900",
    "[&_.ql-editor]:min-h-[220px] [&_.ql-editor]:px-3 [&_.ql-editor]:py-2.5 [&_.ql-editor]:text-sm",
    "text-gray-800 dark:[&_.ql-editor]:text-white/90",
    "[&_.ql-stroke]:stroke-gray-600 dark:[&_.ql-stroke]:stroke-gray-400",
    "[&_.ql-fill]:fill-gray-600 dark:[&_.ql-fill]:fill-gray-400",
  ].join(" ");

  const addCustomMultiValue = (
    rawValue: string,
    selectedValues: string[],
    setSelectedValues: React.Dispatch<React.SetStateAction<string[]>>,
    clearInput: () => void
  ) => {
    const value = rawValue.trim();
    if (!value) return;
    if (selectedValues.some((v) => v.toLowerCase() === value.toLowerCase())) {
      clearInput();
      return;
    }
    setSelectedValues((prev) => [...prev, value]);
    clearInput();
  };

  const customAgeAudienceSelected = ageAudienceGroups.filter(
    (v) => !AGE_AUDIENCE_VALUES.includes(v as (typeof AGE_AUDIENCE_VALUES)[number])
  );
  const customCountriesSelected = countries.filter(
    (v) => !COUNTRY_OPTIONS.some((opt) => opt.value === v)
  );
  const customRegionsSelected = regions.filter(
    (v) => !REGION_OPTIONS.some((opt) => opt.value === v)
  );
  const primaryActionLabel =
    form.visibilityStatus === "published"
      ? isEditMode
        ? "Update and submit for review"
        : "Submit request"
      : form.visibilityStatus === "archived"
        ? isEditMode
          ? "Update archived"
          : "Save as archived"
        : isEditMode
          ? "Update draft"
          : "Save as draft";

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle={isEditMode ? "Edit Resource" : "Add Resource"} />
        <Button size="sm" variant="outline" onClick={() => router.push("/organizer/resources")}>
          Back to Resources
        </Button>
      </div>
      {loadingExisting && (
        <ComponentCard title="Loading resource">
          <LoadingLottie variant="block" />
        </ComponentCard>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <p className="rounded-lg bg-error-50 px-4 py-2 text-sm text-error-600 dark:bg-error-500/10 dark:text-error-400">
            {error}
          </p>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <div className="space-y-6">
            <ComponentCard
              title="Basic information"
              desc="Title, publication date, and optional cover image. Fields marked * are required."
            >
              <div className="space-y-6">
                <div>
                  <Label>Title *</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Resource title"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>URL slug (optional)</Label>
                  <Input
                    value={form.slug}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSlugEditedManually(next.trim().length > 0);
                      setForm((f) => ({ ...f, slug: slugify(next) }));
                    }}
                    placeholder="Leave blank to auto-generate from title"
                    className="mt-1"
                  />
                </div>
                <div>
                  <DatePicker
                    id="resource-publication-date"
                    label="Publication date"
                    value={form.publicationDate}
                    onChange={(nextDate) => setForm((f) => ({ ...f, publicationDate: nextDate }))}
                  />
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <Label>Cover image</Label>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Optional promotional image.</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePictureChange}
                    disabled={uploadingPicture}
                    className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                  />
                  {uploadingPicture && <p className="mt-1 text-xs text-gray-500">Uploading…</p>}
                  {picturePreview && (
                    <div className="mt-3 flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={picturePreview.url}
                        alt="Cover preview"
                        className="h-20 w-20 rounded-lg object-cover ring-2 ring-gray-200 dark:ring-gray-700"
                      />
                      <span className="text-sm text-gray-600 dark:text-gray-400">Uploaded</span>
                    </div>
                  )}
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Classification & taxonomy" desc="Category, sub-category, tags, and content type.">
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label>Category *</Label>
                    <select
                      required
                      value={form.categoryId}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, categoryId: e.target.value, subCategoryId: "" }))
                      }
                      className={selectClass}
                    >
                      {taxonomy.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Sub category *</Label>
                    <select
                      required
                      value={form.subCategoryId}
                      onChange={(e) => setForm((f) => ({ ...f, subCategoryId: e.target.value }))}
                      className={selectClass}
                    >
                      {subOptions.map((s) => (
                        <option key={s._id} value={s._id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <TagsSelect
                    label="Tags / keywords"
                    value={tags}
                    onChange={setTags}
                    placeholder="Add tags (search or type new)"
                  />
                </div>
                <div>
                  <Label>Content type *</Label>
                  <select
                    required
                    value={form.contentType}
                    onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}
                    className={selectClass}
                  >
                    <option value="">Select category</option>
                    {CONTENT_TYPE_VALUES.map((v) => (
                      <option key={v} value={v}>
                        {CONTENT_TYPE_LABELS[v]}
                      </option>
                    ))}
                    {customContentTypes
                      .filter((v) => !CONTENT_TYPE_VALUES.includes(v as ContentTypeValue))
                      .map((v) => (
                        <option key={`custom-content-type-${v}`} value={v}>
                          {v}
                        </option>
                      ))}
                  </select>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={customContentType}
                      onChange={(e) => setCustomContentType(e.target.value)}
                      placeholder="Add custom content type"
                      className="w-full sm:w-72"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const value = customContentType.trim();
                        if (!value) return;
                        if (!customContentTypes.some((v) => v.toLowerCase() === value.toLowerCase())) {
                          setCustomContentTypes((prev) => [...prev, value]);
                        }
                        setForm((f) => ({ ...f, contentType: value }));
                        setCustomContentType("");
                      }}
                    >
                      Add
                    </Button>
                  </div>
                  {customContentTypes.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customContentTypes.map((value) => {
                        const isSelected = form.contentType === value;
                        return (
                          <button
                            key={`custom-content-chip-${value}`}
                            type="button"
                            onClick={() => setForm((f) => ({ ...f, contentType: value }))}
                            className={`rounded-full border px-3 py-1.5 text-sm ${
                              isSelected
                                ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-100"
                                : "border-gray-200 bg-white text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                            }`}
                            title="Click to select"
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                <div>
                  <Label className="mb-2 block">Age group / audience * (multi)</Label>
                  <div className="flex flex-wrap gap-2">
                    {AGE_AUDIENCE_VALUES.map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setAgeAudienceGroups((prev) => toggleInList(prev, v))}
                        className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                          ageAudienceGroups.includes(v)
                            ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-100"
                            : "border-gray-200 bg-white text-gray-700 hover:border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300"
                        }`}
                      >
                        {AGE_AUDIENCE_LABELS[v]}
                      </button>
                    ))}
                  </div>
                  {customAgeAudienceSelected.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customAgeAudienceSelected.map((value) => (
                        <button
                          key={`custom-age-${value}`}
                          type="button"
                          onClick={() =>
                            setAgeAudienceGroups((prev) => prev.filter((v) => v !== value))
                          }
                          className="rounded-full border border-brand-500 bg-brand-50 px-3 py-1.5 text-sm text-brand-800 dark:border-brand-400 dark:bg-brand-500/15 dark:text-brand-100"
                          title="Click to remove"
                        >
                          {value} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={customAgeAudience}
                      onChange={(e) => setCustomAgeAudience(e.target.value)}
                      placeholder="Add custom age group / audience"
                      className="w-full sm:w-72"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addCustomMultiValue(
                          customAgeAudience,
                          ageAudienceGroups,
                          setAgeAudienceGroups,
                          () => setCustomAgeAudience("")
                        )
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Geographic & regional scope" desc="Where this resource applies.">
              <div className="space-y-6">
                <div>
                  <Label className="mb-2 block">Country (multi)</Label>
                  <div className="flex flex-wrap gap-2">
                    {COUNTRY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCountries((prev) => toggleInList(prev, opt.value))}
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          countries.includes(opt.value)
                            ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/15"
                            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {customCountriesSelected.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customCountriesSelected.map((value) => (
                        <button
                          key={`custom-country-${value}`}
                          type="button"
                          onClick={() => setCountries((prev) => prev.filter((v) => v !== value))}
                          className="rounded-full border border-brand-500 bg-brand-50 px-3 py-1.5 text-sm text-brand-800 dark:border-brand-400 dark:bg-brand-500/15"
                          title="Click to remove"
                        >
                          {value} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={customCountry}
                      onChange={(e) => setCustomCountry(e.target.value)}
                      placeholder="Add custom country"
                      className="w-full sm:w-72"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addCustomMultiValue(customCountry, countries, setCountries, () =>
                          setCustomCountry("")
                        )
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="mb-2 block">Region (multi)</Label>
                  <div className="flex flex-wrap gap-2">
                    {REGION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setRegions((prev) => toggleInList(prev, opt.value))}
                        className={`rounded-full border px-3 py-1.5 text-sm ${
                          regions.includes(opt.value)
                            ? "border-brand-500 bg-brand-50 text-brand-800 dark:border-brand-400 dark:bg-brand-500/15"
                            : "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {customRegionsSelected.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {customRegionsSelected.map((value) => (
                        <button
                          key={`custom-region-${value}`}
                          type="button"
                          onClick={() => setRegions((prev) => prev.filter((v) => v !== value))}
                          className="rounded-full border border-brand-500 bg-brand-50 px-3 py-1.5 text-sm text-brand-800 dark:border-brand-400 dark:bg-brand-500/15"
                          title="Click to remove"
                        >
                          {value} ×
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <Input
                      value={customRegion}
                      onChange={(e) => setCustomRegion(e.target.value)}
                      placeholder="Add custom region"
                      className="w-full sm:w-72"
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addCustomMultiValue(customRegion, regions, setRegions, () =>
                          setCustomRegion("")
                        )
                      }
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </ComponentCard>
          </div>

          <div className="space-y-6">
            <ComponentCard
              title="Description"
              desc="Rich text with headings, lists, links, and basic formatting."
            >
              <div>
                <ResourceDescriptionQuill
                  value={form.description}
                  onChange={(html) => setForm((f) => ({ ...f, description: html }))}
                  placeholder="Full description of the resource"
                  className={descriptionEditorClass}
                />
              </div>
            </ComponentCard>

            <ComponentCard title="Publisher & attribution" desc="Who published this resource and rights notice.">
              <div className="space-y-6">
                <div>
                  <Label>Main publisher *</Label>
                  <Input
                    value={form.mainPublisherName}
                    onChange={(e) => setForm((f) => ({ ...f, mainPublisherName: e.target.value }))}
                    placeholder="Organization or publisher name"
                    required
                    className="mt-1"
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Defaults to your organization name; you may edit it.
                  </p>
                </div>
                <Checkbox
                  label="There is a secondary publisher (co-publishers)"
                  checked={hasCoPublishers}
                  onChange={(checked) => {
                    setHasCoPublishers(checked);
                    if (!checked) setCoPublisherIds([]);
                  }}
                />
                {hasCoPublishers && (
                  <div className="rounded-lg border border-gray-200 p-3 dark:border-gray-700">
                    <Label className="mb-2 block">Co-publishers (multi)</Label>
                    <div className="max-h-48 space-y-2 overflow-y-auto">
                      {coOrgs.map((o) => (
                        <Checkbox
                          key={o._id}
                          label={o.name}
                          checked={coPublisherIds.includes(o._id)}
                          onChange={(c) =>
                            setCoPublisherIds((prev) =>
                              c ? [...prev, o._id] : prev.filter((id) => id !== o._id)
                            )
                          }
                        />
                      ))}
                      {coOrgs.length === 0 && (
                        <p className="text-sm text-gray-500">No other organizations to select.</p>
                      )}
                    </div>
                  </div>
                )}
                <div>
                  <Label>Rights / © notice</Label>
                  <TextArea
                    value={form.rightsNotice}
                    onChange={(v) => setForm((f) => ({ ...f, rightsNotice: v }))}
                    rows={3}
                    placeholder="Optional copyright or usage notice"
                    className="mt-1"
                  />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Primary file" desc="Upload the file and set its metadata.">
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label>File format *</Label>
                    <select
                      value={primaryFileFormat}
                      onChange={(e) => setPrimaryFileFormat(e.target.value as FileFormatValue)}
                      className={selectClass}
                    >
                      {FILE_FORMAT_VALUES.map((v) => (
                        <option key={v} value={v}>
                          {FILE_FORMAT_LABELS[v]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label>Language * (multi)</Label>
                    <div className="mt-2 flex flex-wrap gap-3">
                      {LANGUAGE_OPTIONS.map((lang) => (
                        <Checkbox
                          key={lang.value}
                          label={lang.label}
                          checked={primaryLanguages.includes(lang.value)}
                          onChange={(c) =>
                            setPrimaryLanguages((prev) =>
                              c
                                ? [...prev, lang.value]
                                : prev.filter((x) => x !== lang.value)
                            )
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-800/30">
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                    Choose how the file is stored, then upload. File size is detected automatically.
                  </p>
                  <input
                    type="file"
                    accept={docAccept}
                    onChange={handlePrimaryUpload}
                    disabled={uploadingDoc}
                    className="mt-3 block w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-brand-500/10 dark:file:text-brand-400"
                  />
                  {uploadingDoc && <p className="mt-1 text-xs text-gray-500">Uploading…</p>}
                  {primaryDoc && (
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-800/50">
                      <span className="flex flex-wrap items-center gap-2 text-sm">
                        <Badge color="info" size="sm">{primaryDoc.fileFormat}</Badge>
                        <span className="truncate">{primaryDoc.name}</span>
                        {primaryDoc.fileSizeBytes != null && (
                          <span className="text-xs text-gray-500">
                            {(primaryDoc.fileSizeBytes / 1024).toFixed(1)} KB
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => setPrimaryDoc(null)}
                        className="rounded p-1 text-gray-500 hover:bg-gray-100 hover:text-error-500 dark:hover:bg-gray-700"
                        aria-label="Remove file"
                      >
                        <TrashBinIcon className="size-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <Label>External download URL (optional)</Label>
                  <Input
                    value={form.externalDownloadUrl}
                    onChange={(e) => setForm((f) => ({ ...f, externalDownloadUrl: e.target.value }))}
                    placeholder="https://…"
                    className="mt-1"
                  />
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Publishing & visibility" desc="Draft status, dates, slug, and featured flag.">
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div>
                    <Label>Status</Label>
                    <select
                      value={form.visibilityStatus}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          visibilityStatus: e.target.value as VisibilityStatusValue,
                        }))
                      }
                      className={selectClass}
                    >
                      {VISIBILITY_STATUS_VALUES.map((v) => (
                        <option key={v} value={v}>
                          {VISIBILITY_STATUS_LABELS[v]}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <DatePicker
                      id="resource-content-published-date"
                      label="Published date"
                      value={form.contentPublishedAt}
                      onChange={(nextDate) => setForm((f) => ({ ...f, contentPublishedAt: nextDate }))}
                    />
                  </div>
                </div>
                <Checkbox label="Featured" checked={featured} onChange={setFeatured} />
              </div>
            </ComponentCard>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-5 dark:border-gray-800 dark:bg-white/[0.03]">
          <Button type="submit" size="sm" disabled={loadingExisting || submitting || uploadingPicture || uploadingDoc}>
            {submitting ? "Submitting…" : primaryActionLabel}
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => router.push("/organizer/resources")}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
