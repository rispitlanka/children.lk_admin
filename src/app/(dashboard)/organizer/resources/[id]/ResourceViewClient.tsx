"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { DocsIcon, VideoIcon, AudioIcon, FileIcon, UserIcon, GroupIcon, CalenderIcon, CheckCircleIcon, AlertIcon, CloseLineIcon } from "@/icons";

type DocumentFile = {
  url: string;
  publicId: string;
  type: "pdf" | "video" | "audio" | "docx" | "ppt";
  name?: string;
};

type Resource = {
  _id: string;
  name: string;
  shortDescription: string;
  picture?: string;
  picturePublicId?: string;
  documents: DocumentFile[];
  tags: string[];
  targetAudience: "children" | "people_work_for_children";
  ageGroup?: "1-5" | "5-10" | "11-15" | "15-18" | "above-18";
  status: string;
  adminReason?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  organizationName?: string;
};

export default function ResourceViewClient() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    
    fetch(`/api/organizer/resource-requests/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setResource(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load resource");
        setResource(null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    if (status === "pending") return <Badge color="warning">Pending</Badge>;
    if (status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  const getDocumentTypeIcon = (type: string) => {
    switch (type) {
      case "pdf": return { emoji: "📄", icon: DocsIcon, color: "text-red-600 dark:text-red-400" };
      case "video": return { emoji: "🎥", icon: VideoIcon, color: "text-blue-600 dark:text-blue-400" };
      case "audio": return { emoji: "🎵", icon: AudioIcon, color: "text-green-600 dark:text-green-400" };
      case "docx": return { emoji: "📝", icon: FileIcon, color: "text-blue-600 dark:text-blue-400" };
      case "ppt": return { emoji: "📊", icon: FileIcon, color: "text-orange-600 dark:text-orange-400" };
      default: return { emoji: "📎", icon: FileIcon, color: "text-gray-600 dark:text-gray-400" };
    }
  };

  const getAudienceInfo = (audience: string, ageGroup?: string) => {
    if (audience === "children") {
      return {
        emoji: "👶",
        icon: UserIcon,
        label: "Children",
        ageLabel: ageGroup ? getAgeGroupLabel(ageGroup) : undefined
      };
    }
    return {
      emoji: "👨‍💼",
      icon: GroupIcon,
      label: "Professionals",
      ageLabel: undefined
    };
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

  if (loading) return <LoadingLottie variant="block" />;
  
  if (error || !resource) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Resource Details" />
        <ComponentCard title="Error">
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error || "Resource not found"}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/organizer/resources")}
            >
              Back to Resources
            </Button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Resource Details" />
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => router.push("/organizer/resources")}
        >
          Back to Resources
        </Button>
      </div>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative">
          {resource.picture && (
            <div className="relative h-80 rounded-2xl overflow-hidden mb-6">
              <img
                src={resource.picture}
                alt={resource.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {resource.name}
                </h1>
                <div className="flex items-center gap-3">
                  {getStatusBadge(resource.status)}
                  <div className="flex items-center gap-1 text-white/90">
                    <CalenderIcon className="h-4 w-4" />
                    <span className="text-sm">
                      {new Date(resource.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {!resource.picture && (
            <div className="bg-gradient-to-br from-brand-500 to-brand-600 rounded-2xl p-8 text-white mb-6">
              <h1 className="text-3xl font-bold mb-3">
                {resource.name}
              </h1>
              <div className="flex items-center gap-3">
                {getStatusBadge(resource.status)}
                <div className="flex items-center gap-1 text-white/90">
                  <CalenderIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(resource.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <ComponentCard title="📝 Description">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {resource.shortDescription}
                </p>
              </div>
            </ComponentCard>

            {/* Admin Message */}
            {resource.status === "denied" && resource.adminReason && (
              <div className={`rounded-xl border p-6 ${getStatusInfo(resource.status).bgColor} ${getStatusInfo(resource.status).borderColor}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getStatusInfo(resource.status).color}`}>
                    <CloseLineIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${getStatusInfo(resource.status).color}`}>
                      Admin Feedback
                    </h3>
                    <p className={`${getStatusInfo(resource.status).color.replace('600', '700').replace('400', '300')}`}>
                      {resource.adminReason}
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
              <div className={`rounded-lg p-4 ${getStatusInfo(resource.status).bgColor} ${getStatusInfo(resource.status).borderColor} border`}>
                <div className="flex items-center gap-3">
                  <div className={`${getStatusInfo(resource.status).color}`}>
                    {React.createElement(getStatusInfo(resource.status).icon, { className: "h-6 w-6" })}
                  </div>
                  <div>
                    <p className={`font-semibold ${getStatusInfo(resource.status).color}`}>
                      {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {resource.status === "approved" ? "Ready for use" : 
                       resource.status === "denied" ? "Needs revision" : "Under review"}
                    </p>
                  </div>
                </div>
              </div>
            </ComponentCard>

            {/* Target Audience */}
            <ComponentCard title="👥 Target Audience">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 dark:bg-brand-500/20">
                    <span className="text-lg">{getAudienceInfo(resource.targetAudience).emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getAudienceInfo(resource.targetAudience).label}
                      </p>
                      {React.createElement(getAudienceInfo(resource.targetAudience).icon, { 
                        className: "h-4 w-4 text-brand-600 dark:text-brand-400" 
                      })}
                    </div>
                  </div>
                </div>
                
                {resource.targetAudience === "children" && resource.ageGroup && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                      <span className="text-sm">{getAgeGroupLabel(resource.ageGroup).emoji}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Age Group: {getAgeGroupLabel(resource.ageGroup).label}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ComponentCard>

            {/* Tags */}
            {resource.tags && resource.tags.length > 0 && (
              <ComponentCard title="🏷️ Tags">
                <div className="flex flex-wrap gap-2">
                  {resource.tags.map((tag, index) => (
                    <Badge key={index} color="info" size="sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </ComponentCard>
            )}
          </div>
        </div>

        {/* Documents */}
        {resource.documents && resource.documents.length > 0 && (
          <ComponentCard title="📁 Documents & Files">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {resource.documents.map((doc, index) => {
                const docInfo = getDocumentTypeIcon(doc.type);
                const Icon = docInfo.icon;
                return (
                  <div
                    key={index}
                    className="group relative rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500"
                  >
                    {/* Document Icon */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-700/50 ${docInfo.color}`}>
                          <span className="text-xl">{docInfo.emoji}</span>
                        </div>
                        <div className="flex-1">
                        <Badge color="info" size="sm">
                          {doc.type.toUpperCase()}
                        </Badge>
                        </div>
                      </div>
                      <Icon className={`h-5 w-5 ${docInfo.color}`} />
                    </div>
                    
                    {/* Document Name */}
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2 truncate">
                      {doc.name || `${doc.type} document`}
                    </h4>
                    
                    {/* Download Link */}
                    <Link
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 group-hover:underline"
                    >
                      View Document
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </Link>
                  </div>
                );
              })}
            </div>
          </ComponentCard>
        )}

        {/* Metadata */}
        <ComponentCard title="📋 Submission Timeline">
          <div className="space-y-6">
            {/* Timeline */}
            <div className="relative">
              <div className="absolute left-4 top-8 bottom-0 w-px bg-gray-200 dark:bg-gray-700"></div>
              
              <div className="space-y-6">
                {/* Submitted */}
                <div className="relative flex items-start gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 dark:bg-brand-500/20">
                    <CalenderIcon className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">Resource Submitted</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(resource.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Updated */}
                {resource.updatedAt !== resource.createdAt && (
                  <div className="relative flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusInfo(resource.status).bgColor}`}>
                      {React.createElement(getStatusInfo(resource.status).icon, { 
                        className: `h-4 w-4 ${getStatusInfo(resource.status).color}` 
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Status Updated to {resource.status.charAt(0).toUpperCase() + resource.status.slice(1)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(resource.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Resource ID */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Resource ID:</span>
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                  {resource._id}
                </code>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}