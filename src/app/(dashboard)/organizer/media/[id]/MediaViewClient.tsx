"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import ComponentCard from "@/components/common/ComponentCard";
import LoadingLottie from "@/components/common/LoadingLottie";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import Badge from "@/components/ui/badge/Badge";
import Button from "@/components/ui/button/Button";
import { VideoIcon, AudioIcon, FileIcon, DocsIcon, UserIcon, GroupIcon, CalenderIcon, CheckCircleIcon, AlertIcon, CloseLineIcon } from "@/icons";

type MediaFile = {
  url: string;
  publicId: string;
  type: "video" | "audio" | "image";
  name?: string;
};

type Media = {
  _id: string;
  name: string;
  description: string;
  contentType: "article" | "poem" | "video" | "audio" | "pictures" | "picture_story";
  textContent?: string;
  files: MediaFile[];
  targetAudience: "children" | "people_work_for_children";
  ageGroup?: "1-5" | "5-10" | "11-15" | "15-18" | "above-18";
  status: string;
  adminReason?: string;
  createdAt: string;
  updatedAt: string;
  organizationId: string;
  organizationName?: string;
};

export default function MediaViewClient() {
  const params = useParams();
  const router = useRouter();
  const [media, setMedia] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!params.id) return;
    
    fetch(`/api/organizer/media-requests/${params.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setMedia(data);
      })
      .catch((err) => {
        setError(err.message || "Failed to load media");
        setMedia(null);
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  const getStatusBadge = (status: string) => {
    if (status === "pending") return <Badge color="warning">Pending</Badge>;
    if (status === "approved") return <Badge color="success">Approved</Badge>;
    return <Badge color="error">Denied</Badge>;
  };

  const getMediaTypeIcon = (type: string) => {
    switch (type) {
      case "image": return { emoji: "🖼️", icon: FileIcon, color: "text-purple-600 dark:text-purple-400" };
      case "video": return { emoji: "🎥", icon: VideoIcon, color: "text-blue-600 dark:text-blue-400" };
      case "audio": return { emoji: "🎵", icon: AudioIcon, color: "text-green-600 dark:text-green-400" };
      default: return { emoji: "📎", icon: FileIcon, color: "text-gray-600 dark:text-gray-400" };
    }
  };

  const getContentTypeInfo = (contentType: string) => {
    const contentTypes = {
      "article": { emoji: "📝", icon: DocsIcon, color: "text-blue-600 dark:text-blue-400", label: "Article" },
      "poem": { emoji: "📖", icon: FileIcon, color: "text-purple-600 dark:text-purple-400", label: "Poem" },
      "video": { emoji: "🎬", icon: VideoIcon, color: "text-red-600 dark:text-red-400", label: "Video" },
      "audio": { emoji: "🎵", icon: AudioIcon, color: "text-green-600 dark:text-green-400", label: "Audio" },
      "pictures": { emoji: "🖼️", icon: FileIcon, color: "text-pink-600 dark:text-pink-400", label: "Pictures" },
      "picture_story": { emoji: "📚", icon: FileIcon, color: "text-indigo-600 dark:text-indigo-400", label: "Picture Story" }
    };
    return contentTypes[contentType as keyof typeof contentTypes] || contentTypes.article;
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

  const renderMediaPreview = (file: MediaFile) => {
    switch (file.type) {
      case "image":
        return (
          <img
            src={file.url}
            alt={file.name || "Media image"}
            className="w-full h-48 object-cover rounded-lg"
          />
        );
      case "video":
        return (
          <video
            controls
            className="w-full h-48 rounded-lg bg-gray-100 dark:bg-gray-800"
            preload="metadata"
          >
            <source src={file.url} />
            Your browser does not support the video tag.
          </video>
        );
      case "audio":
        return (
          <div className="flex items-center justify-center h-24 bg-gray-100 dark:bg-gray-800 rounded-lg">
            <audio controls className="w-full max-w-md">
              <source src={file.url} />
              Your browser does not support the audio tag.
            </audio>
          </div>
        );
      default:
        return null;
    }
  };

  if (loading) return <LoadingLottie variant="block" />;
  
  if (error || !media) {
    return (
      <div>
        <PageBreadcrumb pageTitle="Media Details" />
        <ComponentCard title="Error">
          <div className="py-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {error || "Media not found"}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => router.push("/organizer/media")}
            >
              Back to Media
            </Button>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <PageBreadcrumb pageTitle="Media Details" />
        <Button 
          size="sm" 
          variant="outline" 
          onClick={() => router.push("/organizer/media")}
        >
          Back to Media
        </Button>
      </div>

      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative">
          <div className={`bg-gradient-to-br ${getContentTypeInfo(media.contentType).color.includes('blue') ? 'from-blue-500 to-blue-600' :
            getContentTypeInfo(media.contentType).color.includes('purple') ? 'from-purple-500 to-purple-600' :
            getContentTypeInfo(media.contentType).color.includes('red') ? 'from-red-500 to-red-600' :
            getContentTypeInfo(media.contentType).color.includes('green') ? 'from-green-500 to-green-600' :
            getContentTypeInfo(media.contentType).color.includes('pink') ? 'from-pink-500 to-pink-600' :
            getContentTypeInfo(media.contentType).color.includes('indigo') ? 'from-indigo-500 to-indigo-600' :
            'from-brand-500 to-brand-600'} rounded-2xl p-8 text-white mb-6`}>
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20">
                <span className="text-2xl">{getContentTypeInfo(media.contentType).emoji}</span>
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold mb-3">
                  {media.name}
                </h1>
                <div className="flex items-center gap-3 mb-2">
                  {getStatusBadge(media.status)}
                  <Badge color="info" size="sm">
                    {getContentTypeInfo(media.contentType).label}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-white/90">
                  <CalenderIcon className="h-4 w-4" />
                  <span className="text-sm">
                    {new Date(media.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <ComponentCard title="📝 Description">
              <div className="prose prose-gray dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                  {media.description}
                </p>
              </div>
            </ComponentCard>

            {/* Text Content (for articles and poems) */}
            {media.textContent && (
              <ComponentCard title={`📄 ${media.contentType === "article" ? "Article" : "Poem"} Content`}>
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-800/50 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <div className="prose prose-gray dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-gray-800 dark:text-gray-200">
                      {media.textContent}
                    </pre>
                  </div>
                </div>
              </ComponentCard>
            )}

            {/* Admin Message */}
            {media.status === "denied" && media.adminReason && (
              <div className={`rounded-xl border p-6 ${getStatusInfo(media.status).bgColor} ${getStatusInfo(media.status).borderColor}`}>
                <div className="flex items-start gap-3">
                  <div className={`flex-shrink-0 ${getStatusInfo(media.status).color}`}>
                    <CloseLineIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-lg font-semibold mb-2 ${getStatusInfo(media.status).color}`}>
                      Admin Feedback
                    </h3>
                    <p className={`${getStatusInfo(media.status).color.replace('600', '700').replace('400', '300')}`}>
                      {media.adminReason}
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
              <div className={`rounded-lg p-4 ${getStatusInfo(media.status).bgColor} ${getStatusInfo(media.status).borderColor} border`}>
                <div className="flex items-center gap-3">
                  <div className={`${getStatusInfo(media.status).color}`}>
                    {React.createElement(getStatusInfo(media.status).icon, { className: "h-6 w-6" })}
                  </div>
                  <div>
                    <p className={`font-semibold ${getStatusInfo(media.status).color}`}>
                      {media.status.charAt(0).toUpperCase() + media.status.slice(1)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {media.status === "approved" ? "Ready for use" : 
                       media.status === "denied" ? "Needs revision" : "Under review"}
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
                    <span className="text-lg">{getAudienceInfo(media.targetAudience).emoji}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getAudienceInfo(media.targetAudience).label}
                      </p>
                      {React.createElement(getAudienceInfo(media.targetAudience).icon, { 
                        className: "h-4 w-4 text-brand-600 dark:text-brand-400" 
                      })}
                    </div>
                  </div>
                </div>
                
                {media.targetAudience === "children" && media.ageGroup && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-500/10">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-500/20">
                      <span className="text-sm">{getAgeGroupLabel(media.ageGroup).emoji}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Age Group: {getAgeGroupLabel(media.ageGroup).label}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </ComponentCard>
          </div>
        </div>

        {/* Media Files */}
        {media.files && media.files.length > 0 && (
          <ComponentCard title={`🎬 ${
            media.contentType === "picture_story" ? "Story Images" :
            media.contentType === "pictures" ? "Images" :
            media.contentType === "video" ? "Video File" :
            media.contentType === "audio" ? "Audio File" :
            "Media Files"
          }`}>
            <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
              {media.files.map((file, index) => {
                const fileInfo = getMediaTypeIcon(file.type);
                const Icon = fileInfo.icon;
                return (
                  <div
                    key={index}
                    className="group relative rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-brand-300 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-brand-500 overflow-hidden"
                  >
                    {/* File preview */}
                    <div className="aspect-video bg-gray-100 dark:bg-gray-800 relative">
                      {renderMediaPreview(file)}
                      <div className="absolute top-3 right-3">
                        <Badge color="info" size="sm">
                          {file.type.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    
                    {/* File info */}
                    <div className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex h-10 w-10 items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-700/50 ${fileInfo.color}`}>
                          <span className="text-lg">{fileInfo.emoji}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 dark:text-white truncate">
                            {file.name || `${file.type} file`}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <Icon className={`h-4 w-4 ${fileInfo.color}`} />
                            <span className={`text-sm ${fileInfo.color}`}>
                              {file.type.charAt(0).toUpperCase() + file.type.slice(1)} File
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-medium text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 group-hover:underline"
                      >
                        View Full Size
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </Link>
                    </div>
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
                    <p className="font-medium text-gray-900 dark:text-white">Media Submitted</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(media.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Updated */}
                {media.updatedAt !== media.createdAt && (
                  <div className="relative flex items-start gap-4">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${getStatusInfo(media.status).bgColor}`}>
                      {React.createElement(getStatusInfo(media.status).icon, { 
                        className: `h-4 w-4 ${getStatusInfo(media.status).color}` 
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        Status Updated to {media.status.charAt(0).toUpperCase() + media.status.slice(1)}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(media.updatedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Media ID */}
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Media ID:</span>
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                  {media._id}
                </code>
              </div>
            </div>
          </div>
        </ComponentCard>
      </div>
    </div>
  );
}