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
    if (confirm("Are you sure you want to reject this video?")) {
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl font-bold">Video Moderation</h1>
            <p className="text-muted-foreground">Review submitted videos</p>
          </div>
          <Link
            href="/admin/dashboard"
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80"
          >
            Back to Dashboard
          </Link>
        </div>

        {/* Filter */}
        <div className="mb-6 flex gap-2">
          {(["ALL", "PENDING", "PROCESSING", "COMPLETED", "FAILED"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-md font-medium transition ${
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
        <div className="bg-card border rounded-lg overflow-hidden">
          {videos.isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : videos.data?.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              No videos found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="text-left p-4">Video</th>
                    <th className="text-left p-4">Details</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Submission</th>
                    <th className="text-right p-4">Actions</th>
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
                        <div className="text-sm text-muted-foreground">
                          {video.channelName}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {new Date(video.createdAt).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-1 text-xs rounded ${getStatusBadge(video.status)}`}
                        >
                          {video.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {video.submitterEmail && (
                          <div className="text-sm">{video.submitterEmail}</div>
                        )}
                        {video.submitterNote && (
                          <div className="text-xs text-muted-foreground mt-1">
                            "{video.submitterNote}"
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <a
                            href={video.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                          >
                            Watch
                          </a>
                          {video.status === VideoStatus.PENDING && (
                            <>
                              <button
                                onClick={() => handleApprove(video.id)}
                                disabled={updateStatus.isPending}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(video.id)}
                                disabled={updateStatus.isPending}
                                className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
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
