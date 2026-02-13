"use client";

import React, { useEffect, useState } from "react";
import LoadingLottie from "@/components/common/LoadingLottie";

type MediaItem = {
  _id: string;
  name: string;
  description: string;
  files: { url: string; type: string; name?: string }[];
  createdAt: string;
};

export default function PublicMediaClient() {
  const [list, setList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/public/media")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) throw new Error(data.error);
        setList(Array.isArray(data) ? data : []);
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingLottie variant="block" />;
  if (list.length === 0) return <p className="text-gray-500 dark:text-gray-400">No media yet.</p>;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {list.map((item) => (
        <div
          key={item._id}
          className="rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <h3 className="font-medium text-gray-800 dark:text-white/90">{item.name}</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{item.description}</p>
          {item.files?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {item.files.slice(0, 3).map((f, i) => (
                f.type === "image" ? (
                  <img key={i} src={f.url} alt={f.name ?? ""} className="h-20 w-20 object-cover rounded-lg" />
                ) : (
                  <a key={i} href={f.url} target="_blank" rel="noopener noreferrer" className="text-brand-500 text-sm truncate max-w-[120px]">
                    {f.name ?? "File"}
                  </a>
                )
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
