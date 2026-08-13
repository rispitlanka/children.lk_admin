"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Button from "@/components/ui/button/Button";
import Badge from "@/components/ui/badge/Badge";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { formatAgeAudienceGroups, labelContentType, labelVisibility, taxonomyLine } from "@/lib/resource-display";

type Organization = {
  _id: string;
  name: string;
  shortDescription: string;
  logo?: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  website?: string;
};

type Organizer = {
  _id: string;
  name: string;
  email: string;
  createdAt: string;
  organization: Organization;
};

type PopulatedName = { _id?: string; name?: string };

type ResourceRequest = {
  _id: string;
  name: string;
  shortDescription: string;
  status: string;
  targetAudience?: string;
  ageGroup?: string;
  ageAudienceGroups?: string[];
  contentType?: string;
  visibilityStatus?: string;
  categoryId?: PopulatedName | string;
  subCategoryId?: PopulatedName | string;
  createdAt: string;
};

type MediaRequest = {
  _id: string;
  name: string;
  description: string;
  contentType: string;
  status: string;
  targetAudience?: string;
  ageGroup?: string;
  createdAt: string;
};

type EventRequest = {
  _id: string;
  name: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  targetAudience?: string;
  ageGroup?: string;
  createdAt: string;
};

type OrganizerDetails = {
  organizer: Organizer;
  resources: ResourceRequest[];
  media: MediaRequest[];
  events: EventRequest[];
  stats: {
    totalResources: number;
    approvedResources: number;
    totalMedia: number;
    approvedMedia: number;
    totalEvents: number;
    approvedEvents: number;
  };
};

export default function OrganizerDetailsClient() {
  const params = useParams();
  const router = useRouter();
  const [details, setDetails] = useState<OrganizerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const organizerId = params?.id as string;

  useEffect(() => {
    if (!organizerId) return;
    
    fetch(`/api/admin/organizers/${organizerId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setDetails(data);
        }
      })
      .catch(() => {
        setError("Failed to load organizer details");
      })
      .finally(() => setLoading(false));
  }, [organizerId]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge color="success" size="sm">Approved</Badge>;
      case "denied":
        return <Badge color="error" size="sm">Denied</Badge>;
      default:
        return <Badge color="warning" size="sm">Pending</Badge>;
    }
  };

  const getContentTypeBadge = (contentType?: string) => {
    if (!contentType) return null;
    
    const color = contentType === "article" || contentType === "poem" ? "info" :
                  contentType === "video" ? "success" :
                  contentType === "audio" ? "warning" : "info";
    
    return (
      <Badge color={color} size="sm">
        {contentType === "picture_story" ? "Picture Story" : 
         contentType.charAt(0).toUpperCase() + contentType.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Organizer Details" />
        <LoadingLottie variant="block" />
      </div>
    );
  }

  if (error || !details) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Organizer Details" />
        <ComponentCard title="Error">
          <p className="text-error-600 dark:text-error-400">
            {error || "Organizer not found"}
          </p>
          <Button 
            className="mt-4" 
            variant="outline" 
            onClick={() => router.push("/admin/organizers")}
          >
            Back to Organizers
          </Button>
        </ComponentCard>
      </div>
    );
  }

  const { organizer, resources, media, events, stats } = details;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Organizer Details" />
        <Button 
          variant="outline" 
          onClick={() => router.push("/admin/organizers")}
        >
          Back to Organizers
        </Button>
      </div>

      {/* Organizer & Organization Info */}
      <div className="space-y-8">
        {/* Organizer Information */}
        <ComponentCard title="Organizer Information">
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 text-sm md:grid-cols-2 min-[1200px]:grid-cols-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Name</p>
              <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                {organizer.name}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Joined</p>
              <p className="mt-1 text-gray-600 dark:text-gray-400">
                {new Date(organizer.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Email</p>
              <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{organizer.email}</p>
            </div>
          </div>
        </ComponentCard>

        {/* Organization Information */}
        <ComponentCard title="Organization Information">
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              {organizer.organization.logo && (
                <img
                  src={organizer.organization.logo}
                  alt={organizer.organization.name}
                  className="h-16 w-16 rounded-lg object-cover ring-1 ring-gray-200 dark:ring-gray-700"
                />
              )}
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {organizer.organization.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {organizer.organization.shortDescription}
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 border-t border-gray-200 pt-4 text-sm dark:border-gray-800 md:grid-cols-2 min-[1200px]:grid-cols-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact Email</p>
                <p className="mt-1 font-medium text-gray-800 dark:text-white/90">{organizer.organization.contactEmail}</p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Contact Phone</p>
                <p className="mt-1 text-gray-800 dark:text-white/90">{organizer.organization.contactPhone}</p>
              </div>
              {organizer.organization.website && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Website</p>
                  <a 
                    href={organizer.organization.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 break-all"
                  >
                    {organizer.organization.website}
                  </a>
                </div>
              )}
              <div className="col-span-1 md:col-span-2 min-[1200px]:col-span-3">
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">Address</p>
                <p className="mt-1 text-gray-800 dark:text-white/90">{organizer.organization.address}</p>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>

      {/* Statistics */}
      <ComponentCard title="Submission Statistics">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Resources</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalResources}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-600 dark:text-blue-400">Approved</p>
                <p className="text-lg font-semibold text-blue-800 dark:text-blue-200">{stats.approvedResources}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Media</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.totalMedia}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-600 dark:text-green-400">Approved</p>
                <p className="text-lg font-semibold text-green-800 dark:text-green-200">{stats.approvedMedia}</p>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Events</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.totalEvents}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-purple-600 dark:text-purple-400">Approved</p>
                <p className="text-lg font-semibold text-purple-800 dark:text-purple-200">{stats.approvedEvents}</p>
              </div>
            </div>
          </div>
        </div>
      </ComponentCard>

      {/* Resources */}
      <ComponentCard title={`Resources (${resources.length})`}>
        {resources.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full text-left text-sm">
              <colgroup>
                <col className="w-[30%]" />
                <col className="w-[20%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[16%]" />
                <col className="w-[10%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Title</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Category</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Type</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Visibility</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Audience</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {resources.map((resource) => {
                  const cat = typeof resource.categoryId === "object" ? resource.categoryId : null;
                  const sub = typeof resource.subCategoryId === "object" ? resource.subCategoryId : null;
                  const audienceText =
                    resource.ageAudienceGroups && resource.ageAudienceGroups.length > 0
                      ? formatAgeAudienceGroups(resource.ageAudienceGroups)
                      : [
                          resource.targetAudience === "children" ? "Children" : "Professionals",
                          resource.ageGroup,
                        ]
                          .filter(Boolean)
                          .join(" · ");
                  return (
                  <TableRow key={resource._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="px-4 py-3">
                      <Link 
                        href={`/admin/resource-requests/${resource._id}`}
                        className="font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 block whitespace-normal line-clamp-3 break-words"
                        title={resource.name}
                      >
                        {resource.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <span className="block whitespace-normal line-clamp-2 break-words">{taxonomyLine(cat, sub)}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {labelContentType(resource.contentType)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {labelVisibility(resource.visibilityStatus)}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                      <span className="block whitespace-normal line-clamp-2 break-words">{audienceText || "—"}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3">{getStatusBadge(resource.status)}</TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">No resources submitted yet.</p>
        )}
      </ComponentCard>

      {/* Media */}
      <ComponentCard title={`Media (${media.length})`}>
        {media.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full text-left text-sm">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[15%]" />
                <col className="w-[20%]" />
                <col className="w-[15%]" />
                <col className="w-[15%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Type</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Audience</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Date</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {media.map((item) => (
                  <TableRow key={item._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="px-4 py-3">
                      <Link 
                        href={`/admin/media/${item._id}`}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium block whitespace-normal line-clamp-2 break-words"
                        title={item.name}
                      >
                        {item.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      {getContentTypeBadge(item.contentType)}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="space-y-1">
                        <Badge color="primary" size="sm">
                          {item.targetAudience === "children" ? "Children" : "Professionals"}
                        </Badge>
                        {item.ageGroup && (
                          <Badge color="info" size="sm">{item.ageGroup}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">No media submitted yet.</p>
        )}
      </ComponentCard>

      {/* Events */}
      <ComponentCard title={`Events (${events.length})`}>
        {events.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full text-left text-sm">
              <colgroup>
                <col className="w-[35%]" />
                <col className="w-[25%]" />
                <col className="w-[12%]" />
                <col className="w-[15%]" />
                <col className="w-[13%]" />
              </colgroup>
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-800">
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Name</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Location</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Date</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Audience</TableCell>
                  <TableCell isHeader className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">Status</TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event._id} className="border-b border-gray-200 dark:border-gray-800">
                    <TableCell className="px-4 py-3">
                      <Link 
                        href={`/admin/events/${event._id}`}
                        className="text-brand-600 hover:text-brand-700 dark:text-brand-400 font-medium block whitespace-normal line-clamp-2 break-words"
                        title={event.name}
                      >
                        {event.name}
                      </Link>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <span className="block whitespace-normal line-clamp-2 break-words" title={event.location}>{event.location}</span>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      {new Date(event.startDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="space-y-1">
                        <Badge color="primary" size="sm">
                          {event.targetAudience === "children" ? "Children" : "Professionals"}
                        </Badge>
                        {event.ageGroup && (
                          <Badge color="info" size="sm">{event.ageGroup}</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3">{getStatusBadge(event.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <p className="py-8 text-center text-gray-500 dark:text-gray-400">No events submitted yet.</p>
        )}
      </ComponentCard>
    </div>
  );
}