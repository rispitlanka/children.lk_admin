/** Content type (single select) */
export const CONTENT_TYPE_VALUES = [
  "briefs",
  "fact_sheets",
  "brochures",
  "toolkit",
  "campaign",
] as const;

export type ContentTypeValue = (typeof CONTENT_TYPE_VALUES)[number];

export const CONTENT_TYPE_LABELS: Record<ContentTypeValue, string> = {
  briefs: "Briefs",
  fact_sheets: "Fact sheets",
  brochures: "Brochures",
  toolkit: "Toolkit",
  campaign: "Campaign",
};

/** Age group / audience (multi select) */
export const AGE_AUDIENCE_VALUES = ["children", "adolescents", "youth", "educators"] as const;
export type AgeAudienceValue = (typeof AGE_AUDIENCE_VALUES)[number];

export const AGE_AUDIENCE_LABELS: Record<AgeAudienceValue, string> = {
  children: "Children",
  adolescents: "Adolescents",
  youth: "Youth",
  educators: "Educators",
};

/** File format (primary file) */
export const FILE_FORMAT_VALUES = [
  "pdf",
  "docx",
  "pptx",
  "xlsx",
  "html",
  "image",
  "audio",
  "video",
  "other",
] as const;
export type FileFormatValue = (typeof FILE_FORMAT_VALUES)[number];

export const FILE_FORMAT_LABELS: Record<FileFormatValue, string> = {
  pdf: "PDF",
  docx: "Word (DOCX)",
  pptx: "PowerPoint (PPTX)",
  xlsx: "Excel (XLSX)",
  html: "HTML",
  image: "Image",
  audio: "Audio",
  video: "Video",
  other: "Other",
};

export const LANGUAGE_OPTIONS = [
  { value: "en", label: "English" },
  { value: "si", label: "Sinhala" },
  { value: "ta", label: "Tamil" },
  { value: "other", label: "Other" },
] as const;

/** Geographic — values stored as strings */
export const COUNTRY_OPTIONS = [
  { value: "LK", label: "Sri Lanka" },
  { value: "IN", label: "India" },
  { value: "BD", label: "Bangladesh" },
  { value: "NP", label: "Nepal" },
  { value: "PK", label: "Pakistan" },
  { value: "GB", label: "United Kingdom" },
  { value: "US", label: "United States" },
  { value: "AU", label: "Australia" },
  { value: "GLOBAL", label: "Global / not country-specific" },
] as const;

export const REGION_OPTIONS = [
  { value: "south_asia", label: "South Asia" },
  { value: "southeast_asia", label: "Southeast Asia" },
  { value: "middle_east", label: "Middle East" },
  { value: "africa", label: "Africa" },
  { value: "europe", label: "Europe" },
  { value: "north_america", label: "North America" },
  { value: "latin_america_caribbean", label: "Latin America & Caribbean" },
  { value: "oceania", label: "Oceania" },
  { value: "global", label: "Global" },
] as const;

export const VISIBILITY_STATUS_VALUES = ["draft", "published", "archived"] as const;
export type VisibilityStatusValue = (typeof VISIBILITY_STATUS_VALUES)[number];

export const VISIBILITY_STATUS_LABELS: Record<VisibilityStatusValue, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
};
