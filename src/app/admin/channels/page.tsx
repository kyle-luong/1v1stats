/**
 * Admin Channel Management Page
 * Manage whitelisted YouTube channels for automated video scraping
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Image from "next/image";
import { PageHeader } from "@/components/common/PageHeader";

export default function AdminChannelsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelInput, setNewChannelInput] = useState("");
  const [scrapeFrequency, setScrapeFrequency] = useState<"daily" | "manual">("daily");
  const [previewData, setPreviewData] = useState<{
    id: string;
    name: string;
    description: string;
    thumbnailUrl: string;
    subscriberCount: number;
  } | null>(null);
  const [previewError, setPreviewError] = useState("");

  const utils = trpc.useUtils();
  const channels = trpc.channel.getAll.useQuery({ activeOnly: false });
  const stats = trpc.channel.getStats.useQuery();

  const previewChannel = trpc.channel.preview.useMutation({
    onSuccess: (data) => {
      setPreviewData(data);
      setPreviewError("");
    },
    onError: (error) => {
      setPreviewError(error.message);
      setPreviewData(null);
    },
  });

  const createChannel = trpc.channel.create.useMutation({
    onSuccess: () => {
      utils.channel.getAll.invalidate();
      utils.channel.getStats.invalidate();
      setShowAddModal(false);
      setNewChannelInput("");
      setPreviewData(null);
    },
  });

  const updateChannel = trpc.channel.update.useMutation({
    onSuccess: () => {
      utils.channel.getAll.invalidate();
    },
  });

  const deleteChannel = trpc.channel.delete.useMutation({
    onSuccess: () => {
      utils.channel.getAll.invalidate();
      utils.channel.getStats.invalidate();
    },
  });

  const scrapeAll = trpc.channel.scrapeAll.useMutation({
    onSuccess: (result) => {
      utils.channel.getAll.invalidate();
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
      // eslint-disable-next-line no-alert
      alert(
        `Scrape complete!\n\n${result.videosCreated} new videos added\n${result.videosSkipped} already existed\n${result.videosFound} total found`
      );
    },
    onError: (error) => {
      // eslint-disable-next-line no-alert
      alert(`Scrape failed: ${error.message}`);
    },
  });

  const scrapeNew = trpc.channel.scrapeNew.useMutation({
    onSuccess: (result) => {
      utils.channel.getAll.invalidate();
      utils.video.getAll.invalidate();
      // eslint-disable-next-line no-alert
      alert(`Scrape complete! ${result.videosCreated} new videos found.`);
    },
  });

  const handlePreview = async () => {
    if (!newChannelInput.trim()) return;
    setPreviewError("");
    setPreviewData(null);
    await previewChannel.mutateAsync({ input: newChannelInput });
  };

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!previewData) {
      setPreviewError("Please preview the channel first");
      return;
    }
    await createChannel.mutateAsync({
      input: newChannelInput,
      scrapeFrequency,
    });
  };

  const handleDelete = async (id: string, name: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete channel "${name}"?\n\nVideos from this channel will remain but be unlinked.`)) {
      await deleteChannel.mutateAsync({ id });
    }
  };

  const handleScrapeAll = async (id: string, name: string) => {
    // eslint-disable-next-line no-alert -- admin confirmation dialog
    if (window.confirm(`Scrape ALL videos from "${name}"?\n\nThis may take a while for channels with many videos.`)) {
      await scrapeAll.mutateAsync({ id });
    }
  };

  const handleScrapeNew = async (id: string) => {
    await scrapeNew.mutateAsync({ id });
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    await updateChannel.mutateAsync({ id, isActive: !isActive });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  const formatSubscribers = (count: number | null) => {
    if (!count) return "N/A";
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(0)}K`;
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PageHeader
            title="Channels"
            subtitle="Manage whitelisted YouTube channels for scraping"
            className="mb-0"
          />
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="shrink-0 rounded bg-primary px-6 py-3 font-heading text-sm font-medium uppercase tracking-wider text-primary-foreground transition hover:bg-primary/90"
          >
            + Add Channel
          </button>
        </div>

        {/* Stats Overview */}
        {stats.data && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.total}</div>
              <div className="text-sm text-muted-foreground">Total Channels</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.scrapedVideos}</div>
              <div className="text-sm text-muted-foreground">Scraped Videos</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.uncategorizedVideos}</div>
              <div className="text-sm text-muted-foreground">Uncategorized</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.needsScraping}</div>
              <div className="text-sm text-muted-foreground">Need Scraping</div>
            </div>
          </div>
        )}

        {/* Channels List */}
        <div className="overflow-hidden rounded-lg border bg-card">
          {channels.isLoading && (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          )}
          {!channels.isLoading && channels.data?.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              No channels yet. Add your first whitelisted channel!
            </div>
          )}
          {!channels.isLoading && channels.data && channels.data.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-secondary/50">
                  <tr>
                    <th className="p-4 text-left text-sm font-medium">Channel</th>
                    <th className="p-4 text-left text-sm font-medium">Videos</th>
                    <th className="p-4 text-left text-sm font-medium">Frequency</th>
                    <th className="p-4 text-left text-sm font-medium">Last Scraped</th>
                    <th className="p-4 text-left text-sm font-medium">Status</th>
                    <th className="p-4 text-right text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {channels.data.map((channel) => (
                    <tr key={channel.id} className="border-t">
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          {channel.thumbnailUrl && (
                            <Image
                              src={channel.thumbnailUrl}
                              alt={channel.name}
                              width={48}
                              height={48}
                              className="rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-semibold">{channel.name}</div>
                            {channel.subscriberCount && (
                              <div className="text-xs text-muted-foreground">
                                {formatSubscribers(channel.subscriberCount)} subscribers
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{channel._count.videos}</span>
                      </td>
                      <td className="p-4">
                        <select
                          value={channel.scrapeFrequency}
                          onChange={(e) =>
                            updateChannel.mutate({
                              id: channel.id,
                              scrapeFrequency: e.target.value as "daily" | "manual",
                            })
                          }
                          className="rounded border bg-background px-2 py-1 text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="manual">Manual</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(channel.lastScrapedAt)}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(channel.id, channel.isActive)}
                          className={`rounded px-2 py-1 text-xs font-medium ${
                            channel.isActive
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200"
                              : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200"
                          }`}
                        >
                          {channel.isActive ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleScrapeAll(channel.id, channel.name)}
                            disabled={scrapeAll.isPending}
                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {scrapeAll.isPending ? "..." : "Scrape All"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleScrapeNew(channel.id)}
                            disabled={scrapeNew.isPending}
                            className="rounded bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                          >
                            New Only
                          </button>
                          <a
                            href={`https://www.youtube.com/channel/${channel.youtubeChannelId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded bg-secondary px-3 py-1 text-sm text-secondary-foreground hover:bg-secondary/80"
                          >
                            View
                          </a>
                          <button
                            type="button"
                            onClick={() => handleDelete(channel.id, channel.name)}
                            disabled={deleteChannel.isPending}
                            className="rounded bg-red-600 px-3 py-1 text-sm text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Delete
                          </button>
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

      {/* Add Channel Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-bold">Add YouTube Channel</h2>
                <p className="text-sm text-muted-foreground">
                  Enter a channel URL, handle, or ID
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setPreviewData(null);
                  setPreviewError("");
                  setNewChannelInput("");
                }}
                aria-label="Close modal"
                className="rounded p-1 hover:bg-secondary"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleAddChannel}>
              <div className="mb-4">
                <label htmlFor="channelInput" className="mb-1 block text-sm font-medium">
                  Channel URL, Handle, or ID
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="channelInput"
                    value={newChannelInput}
                    onChange={(e) => {
                      setNewChannelInput(e.target.value);
                      setPreviewData(null);
                      setPreviewError("");
                    }}
                    placeholder="@channelname or https://youtube.com/..."
                    className="flex-1 rounded border bg-background px-3 py-2"
                    required
                  />
                  <button
                    type="button"
                    onClick={handlePreview}
                    disabled={previewChannel.isPending || !newChannelInput.trim()}
                    className="rounded bg-secondary px-4 py-2 text-sm font-medium hover:bg-secondary/80 disabled:opacity-50"
                  >
                    {previewChannel.isPending ? "..." : "Preview"}
                  </button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Examples: @TheNextChapter, https://youtube.com/@ballislife, UCxxxxxx
                </p>
              </div>

              {previewError && (
                <div className="mb-4 rounded bg-destructive/10 p-3 text-sm text-destructive">
                  {previewError}
                </div>
              )}

              {previewData && (
                <div className="mb-4 flex gap-4 rounded border bg-secondary/30 p-4">
                  {previewData.thumbnailUrl && (
                    <Image
                      src={previewData.thumbnailUrl}
                      alt={previewData.name}
                      width={64}
                      height={64}
                      className="rounded-full"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{previewData.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatSubscribers(previewData.subscriberCount)} subscribers
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {previewData.description}
                    </div>
                  </div>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="frequency" className="mb-1 block text-sm font-medium">
                  Scrape Frequency
                </label>
                <select
                  id="frequency"
                  value={scrapeFrequency}
                  onChange={(e) => setScrapeFrequency(e.target.value as "daily" | "manual")}
                  className="w-full rounded border bg-background px-3 py-2"
                >
                  <option value="daily">Daily (auto-scrape new videos)</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>

              {createChannel.error && (
                <div className="mb-4 rounded bg-destructive/10 p-2 text-sm text-destructive">
                  {createChannel.error.message}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setPreviewData(null);
                    setPreviewError("");
                    setNewChannelInput("");
                  }}
                  className="rounded bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createChannel.isPending || !previewData}
                  className="rounded bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createChannel.isPending ? "Adding..." : "Add Channel"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

