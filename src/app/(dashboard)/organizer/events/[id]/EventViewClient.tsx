"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { CalenderIcon, CheckCircleIcon, AlertIcon, CloseLineIcon, UserIcon, GroupIcon, TimeIcon } from "@/icons";

type Event = {
  _id: string;
  name: string;
  location: string;
  startDate: string;
  endDate?: string;
  description: string;
  tags: string[];
  registrationLink?: string;
  coverImage?: string;
  coverImagePublicId?: string;
  targetAudience?: "children" | "people_work_for_children";
  ageGroup?: "1-5" | "5-10" | "11-15" | "15-18" | "above-18";
  status: string;
  adminReason?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  organizationName?: string;
};

export default function EventViewClient() {
  const params = useParams();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    
    fetch(`/api/organizer/event-requests/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setEvent(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load event");
        setEvent(null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    if (status === "pending") return <Badge color="warning">Pending</Badge>;
    if (status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isEventUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date();
  };

  const isEventOngoing = (startDate: string, endDate?: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : start;
    return now >= start && now <= end;
  };

  const getAudienceInfo = (audience?: string, ageGroup?: string) => {
    if (audience === "children") {
      return {
        emoji: "👶",
        icon: UserIcon,
        label: "Children",
        ageLabel: ageGroup ? getAgeGroupLabel(ageGroup) : undefined
      };
    } else if (audience === "people_work_for_children") {
      return {
        emoji: "👨‍💼",
        icon: GroupIcon,
        label: "Professionals",
        ageLabel: undefined
      };
    }
    return null;
  };

  const getAgeGroupLabel = (ageGroup: string) => {
    const ageEmojis = {
      "1-5": "🍼",
      "5-10": "🎒", 
      "11-15": "📚",
      "15-18": "🎓",
      "above-18": "🎯"
    };
    return {
      emoji: ageEmojis[ageGroup as keyof typeof ageEmojis] || "👶",
      label: ageGroup === "above-18" ? "Above 18 years" : `${ageGroup} years`
    };
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case "approved":
        return { 
          icon: CheckCircleIcon, 
          color: "text-green-600 dark:text-green-400", 
          bgColor: "bg-green-50 dark:bg-green-500/10",
          borderColor: "border-green-200 dark:border-green-500/20"
        };
      case "denied":
        return { 
          icon: CloseLineIcon, 
          color: "text-red-600 dark:text-red-400", 
          bgColor: "bg-red-50 dark:bg-red-500/10",
          borderColor: "border-red-200 dark:border-red-500/20"
        };
      default:
        return { 
          icon: AlertIcon, 
          color: "text-yellow-600 dark:text-yellow-400", 
          bgColor: "bg-yellow-50 dark:bg-yellow-500/10",
          borderColor: "border-yellow-200 dark:border-yellow-500/20"
        };
    }
  };

  const getEventStatusBadge = (startDate: string, status: string, endDate?: string) => {
    if (status !== "approved") return null;
    
    if (isEventOngoing(startDate, endDate)) {
                    return <Badge color="success">🟢 Live Now</Badge>;
                  } else if (isEventUpcoming(startDate)) {
                    return <Badge color="info">📅 Upcoming</Badge>;
                  } else {
                    return <Badge color="info">📋 Completed</Badge>;
    }
  };

  if (loading) return <LoadingLottie variant="block" />;
  
  if (error || !event) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Event Details" />
        <ComponentCard title="Error">
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error || "Event not found"}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/organizer/events")}
            >
              Back to Events
            </Button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  const upcoming = isEventUpcoming(event.startDate);
  const ongoing = isEventOngoing(event.startDate, event.endDate);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Event Details" />
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => router.push("/organizer/events")}
        >
          Back to Events
        </Button>
      </div>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative">
          {event.coverImage ? (
            <div className="relative h-80 rounded-2xl overflow-hidden mb-6">
              <img
                src={event.coverImage}
                alt={event.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl font-bold text-white mb-3">
                  {event.name}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {getStatusBadge(event.status)}
                  {getEventStatusBadge(event.startDate, event.status, event.endDate)}
                </div>
                <div className="flex items-center gap-4 text-white/90 text-sm">
                  <div className="flex items-center gap-1">
                    <CalenderIcon className="h-4 w-4" />
                    <span>Submitted {new Date(event.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span>📍</span>
                    <span>{event.location}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white mb-6">
              <div className="flex items-start gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                  <span className="text-2xl">🎉</span>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-3">
                    {event.name}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    {getStatusBadge(event.status)}
                    {getEventStatusBadge(event.startDate, event.status, event.endDate)}
                  </div>
                  <div className="flex items-center gap-4 text-white/90 text-sm">
                    <div className="flex items-center gap-1">
                      <CalenderIcon className="h-4 w-4" />
                      <span>Submitted {new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>📍</span>
                      <span>{event.location}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Details */}
            <ComponentCard title="📅 Event Details">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                    <span className="text-lg">🕐</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Start Time</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDateTime(event.startDate)}
                    </p>
                  </div>
                </div>

                {event.endDate && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-500/20">
                      <span className="text-lg">🕐</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">End Time</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDateTime(event.endDate)}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-500/20">
                    <span className="text-lg">📍</span>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-1">Location</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.location}
                    </p>
                  </div>
                </div>

                {event.registrationLink && (
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-500/20">
                      <span className="text-lg">🔗</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white mb-1">Registration</h4>
                      <Link
                        href={event.registrationLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 break-all hover:underline"
                      >
                        Open Registration Link
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Description */}
            <ComponentCard title="📝 Description">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </ComponentCard>

            {/* Admin Message */}
            {event.status === "denied" && event.adminReason && (
              <div className={`rounded-xl border p-6 ${getStatusInfo(event.status).bgColor} ${getStatusInfo(event.status).borderColor}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getStatusInfo(event.status).color}`}>
                    <CloseLineIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${getStatusInfo(event.status).color}`}>
                      Admin Feedback
                    </h3>
                    <p className={`${getStatusInfo(event.status).color.replace('600', '700').replace('400', '300')}`}>
                      {event.adminReason}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Status Card */}
            <ComponentCard title="📊 Status">
              <div className={`rounded-lg p-4 ${getStatusInfo(event.status).bgColor} ${getStatusInfo(event.status).borderColor} border`}>
                <div className="flex items-center gap-3">
                  <div className={`${getStatusInfo(event.status).color}`}>
                    {React.createElement(getStatusInfo(event.status).icon, { className: "h-6 w-6" })}
                  </div>
                  <div>
                    <p className={`font-semibold ${getStatusInfo(event.status).color}`}>
                      {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {event.status === "approved" ? "Event approved" : 
                       event.status === "denied" ? "Needs revision" : "Under review"}
                    </p>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Target Audience */}
            {event.targetAudience && getAudienceInfo(event.targetAudience, event.ageGroup) && (
              <ComponentCard title="👥 Target Audience">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20">
                      <span className="text-lg">{getAudienceInfo(event.targetAudience, event.ageGroup)!.emoji}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getAudienceInfo(event.targetAudience, event.ageGroup)!.label}
                        </p>
                        {React.createElement(getAudienceInfo(event.targetAudience, event.ageGroup)!.icon, { 
                          className: "h-4 w-4 text-brand-600 dark:text-brand-400" 
                        })}
                      </div>
                    </div>
                  </div>
                  
                  {event.targetAudience === "children" && event.ageGroup && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                        <span className="text-sm">{getAgeGroupLabel(event.ageGroup).emoji}</span>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                          Age Group: {getAgeGroupLabel(event.ageGroup).label}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </ComponentCard>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <ComponentCard title="🏷️ Tags">
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <Badge key={index} color="info" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </ComponentCard>
            )}
          </div>
        </div>

        {/* Event Timeline */}
        <ComponentCard title="📅 Event Timeline">
          <div className="space-y-6">
            <div className="relative">
              <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-6">
                {/* Submitted */}
                <div className="relative flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                    <CalenderIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">Event Submitted</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Status Update */}
                {event.status !== "pending" && (
                  <div className="relative flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusInfo(event.status).bgColor}`}>
                      {React.createElement(getStatusInfo(event.status).icon, { 
                        className: `h-4 w-4 ${getStatusInfo(event.status).color}` 
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Event {event.status === "approved" ? "Approved" : "Denied"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(event.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Event Status */}
                {event.status === "approved" && (
                  <div className="relative flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      upcoming ? "bg-blue-100 dark:bg-blue-500/20" : 
                      ongoing ? "bg-green-100 dark:bg-green-500/20" : 
                      "bg-gray-100 dark:bg-gray-500/20"
                    }`}>
                      <TimeIcon className={`h-4 w-4 ${
                        upcoming ? "text-blue-600 dark:text-blue-400" : 
                        ongoing ? "text-green-600 dark:text-green-400" : 
                        "text-gray-600 dark:text-gray-400"
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {ongoing ? "🟢 Event In Progress" : upcoming ? "📅 Event Scheduled" : "✅ Event Completed"}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {upcoming ? `Starts ${formatDate(event.startDate)}` : 
                         ongoing ? `Started ${formatDate(event.startDate)}` :
                         `Ended ${formatDate(event.endDate || event.startDate)}`}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event ID */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Event ID:</span>
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                  {event._id}
                </code>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}