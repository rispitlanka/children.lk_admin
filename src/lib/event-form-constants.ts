export const EVENT_CATEGORY_VALUES = [
  "workshop",
  "conference",
  "webinar",
  "community",
  "fundraiser",
  "sports",
  "cultural",
  "education",
  "other",
] as const;

export type EventCategoryValue = (typeof EVENT_CATEGORY_VALUES)[number];

export const EVENT_CATEGORY_LABELS: Record<EventCategoryValue, string> = {
  workshop: "Workshop",
  conference: "Conference",
  webinar: "Webinar",
  community: "Community / outreach",
  fundraiser: "Fundraiser",
  sports: "Sports",
  cultural: "Cultural",
  education: "Education",
  other: "Other",
};

export const EVENT_VISIBILITY_STATUS_VALUES = ["draft", "published"] as const;

export type EventVisibilityStatusValue = (typeof EVENT_VISIBILITY_STATUS_VALUES)[number];

export const EVENT_VISIBILITY_STATUS_LABELS: Record<EventVisibilityStatusValue, string> = {
  draft: "Draft",
  published: "Published",
};
