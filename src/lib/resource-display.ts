import {
  AGE_AUDIENCE_LABELS,
  CONTENT_TYPE_LABELS,
  type AgeAudienceValue,
  type ContentTypeValue,
  VISIBILITY_STATUS_LABELS,
  type VisibilityStatusValue,
} from "@/lib/resource-form-constants";

export function labelContentType(value?: string | null): string {
  if (!value) return "—";
  return CONTENT_TYPE_LABELS[value as ContentTypeValue] ?? value.replace(/_/g, " ");
}

export function labelVisibility(value?: string | null): string {
  if (!value) return "—";
  return VISIBILITY_STATUS_LABELS[value as VisibilityStatusValue] ?? value;
}

export function formatAgeAudienceGroups(groups?: string[] | null): string {
  if (!groups?.length) return "—";
  return groups
    .map((g) => AGE_AUDIENCE_LABELS[g as AgeAudienceValue] ?? g)
    .join(", ");
}

export function taxonomyLine(
  category?: { name?: string } | null,
  subCategory?: { name?: string } | null
): string {
  const c = category?.name;
  const s = subCategory?.name;
  if (c && s) return `${c} → ${s}`;
  if (c) return c;
  if (s) return s;
  return "—";
}
