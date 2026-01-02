/**
 * Admin Video Moderation Queue
 * Review and manage submitted videos
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { VideoStatus } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";

export default function AdminVideosPage() {
  const [statusFilter, setStatusFilter] = useState<VideoStatus | "ALL">("PENDING");
  const utils = trpc.useUtils();

  const videos = trpc.video.getAll.useQuery({
    status: statusFilter === "ALL" ? undefined : statusFilter,
  });

  const updateStatus = trpc.video.updateStatus.useMutation({
    onSuccess: () => {
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
    },
  });

  const handleApprove = async (id: string) => {
    await updateStatus.mutateAsync({ id, status: VideoStatus.PROCESSING });
  };

  const handleReject = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Are you sure you want to reject this video?")) {
      await updateStatus.mutateAsync({ id, status: VideoStatus.FAILED });
    }
  };

  const getStatusBadge = (status: VideoStatus) => {
    const colors = {
      PENDING: "bg-yellow-100 text-yellow-800",
      PROCESSING: "bg-blue-100 text-blue-800",
      COMPLETED: "bg-green-100 text-green-800",
      FAILED: "bg-red-100 text-red-800",
    };
    return colors[status];
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Video Moderation</h1>
            <p className="text-muted-foreground">Review submitted videos</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {(["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-md px-4 py-2 font-medium transition ${
                statusFilter === status
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Videos List */}
        <div className="overflow-hidden rounded-lg border bg-card">
          {videos.isLoading && (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          )}
          {!videos.isLoading && videos.data?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">No videos found</div>
          )}
          {!videos.isLoading && videos.data && videos.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-4 text-left">Video</th>
                    <th className="p-4 text-left">Details</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-left">Submission</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.data?.map((video) => (
                    <tr key={video.id} className="border-t">
                      <td className="p-4">
                        {video.thumbnailUrl && (
                          <Image
                            src={video.thumbnailUrl}
                            alt={video.title}
                            width={160}
                            height={90}
                            className="rounded"
                          />
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-semibold">{video.title}</div>
                        <div className="text-sm text-muted-foreground">{video.channelName}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded px-2 py-1 text-xs ${getStatusBadge(video.status)}`}
                        >
                          {video.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {video.submitterEmail && (
                          <div className="text-sm">{video.submitterEmail}</div>
                        )}
                        {video.submitterNote && (
                          <div className="mt-1 text-xs text-muted-foreground">
                            "{video.submitterNote}"
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:bg-secondary/80"
                          >
                            Watch
                          </a>
                          {video.status === VideoStatus.PENDING && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApprove(video.id)}
                                disabled={updateStatus.isPending}
                                className="rounded bg-green-600 px-3 py-1 text-sm text-white hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReject(video.id)}
                                disabled={updateStatus.isPending}
                                className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
