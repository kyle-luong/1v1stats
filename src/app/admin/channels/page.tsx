/**
 * Admin Channel Management Page
 * Manage whitelisted YouTube channels for automated video scraping
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import Image from "next/image";
import Link from "next/link";

export default function AdminChannelsPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChannelInput, setNewChannelInput] = useState("");
  const [scrapeFrequency, setScrapeFrequency] = useState<"daily" | "weekly" | "manual">("daily");
  const [scrapeImmediately, setScrapeImmediately] = useState(false);

  const utils = trpc.useUtils();
  const channels = trpc.channel.getAll.useQuery();
  const stats = trpc.channel.getStats.useQuery();

  const createChannel = trpc.channel.create.useMutation({
    onSuccess: () => {
      utils.channel.getAll.invalidate();
      utils.channel.getStats.invalidate();
      setShowAddModal(false);
      setNewChannelInput("");
      setScrapeImmediately(false);
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

  const scrapeNow = trpc.channel.scrapeNow.useMutation({
    onSuccess: (result) => {
      utils.channel.getAll.invalidate();
      utils.video.getAll.invalidate();
      utils.video.getStats.invalidate();
      // eslint-disable-next-line no-alert
      alert(`Scrape complete! ${result.videosCreated} new videos found, ${result.videosSkipped} skipped.`);
    },
  });

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    await createChannel.mutateAsync({
      input: newChannelInput,
      scrapeFrequency,
      scrapeImmediately,
    });
  };

  const handleDelete = async (id: string, name: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete channel "${name}"? This won't delete associated videos.`)) {
      await deleteChannel.mutateAsync({ id });
    }
  };

  const handleScrapeNow = async (id: string) => {
    await scrapeNow.mutateAsync({ id });
  };

  const handleToggleWhitelist = async (id: string, isWhitelisted: boolean) => {
    await updateChannel.mutateAsync({ id, isWhitelisted: !isWhitelisted });
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Never";
    return new Date(date).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold">Channel Management</h1>
            <p className="text-muted-foreground">Manage whitelisted YouTube channels</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            >
              Add Channel
            </button>
            <Link
              href="/admin/dashboard"
              className="rounded-md bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {stats.data && (
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.total}</div>
              <div className="text-sm text-muted-foreground">Total Channels</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.whitelisted}</div>
              <div className="text-sm text-muted-foreground">Whitelisted</div>
            </div>
            <div className="rounded-lg border bg-card p-4">
              <div className="text-2xl font-bold">{stats.data.scrapedVideos}</div>
              <div className="text-sm text-muted-foreground">Scraped Videos</div>
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
                    <th className="p-4 text-left">Channel</th>
                    <th className="p-4 text-left">Videos</th>
                    <th className="p-4 text-left">Frequency</th>
                    <th className="p-4 text-left">Last Scraped</th>
                    <th className="p-4 text-left">Status</th>
                    <th className="p-4 text-right">Actions</th>
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
                                {channel.subscriberCount.toLocaleString()} subscribers
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
                              scrapeFrequency: e.target.value as "daily" | "weekly" | "manual",
                            })
                          }
                          className="rounded border bg-background px-2 py-1 text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="manual">Manual</option>
                        </select>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {formatDate(channel.lastScrapedAt)}
                      </td>
                      <td className="p-4">
                        <button
                          type="button"
                          onClick={() => handleToggleWhitelist(channel.id, channel.isWhitelisted)}
                          className={`rounded px-2 py-1 text-xs ${
                            channel.isWhitelisted
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {channel.isWhitelisted ? "Active" : "Paused"}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => handleScrapeNow(channel.id)}
                            disabled={scrapeNow.isPending}
                            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {scrapeNow.isPending ? "Scraping..." : "Scrape Now"}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-card p-6">
            <h2 className="mb-4 text-xl font-bold">Add YouTube Channel</h2>
            <form onSubmit={handleAddChannel}>
              <div className="mb-4">
                <label htmlFor="channelInput" className="mb-1 block text-sm font-medium">
                  Channel URL, Handle, or ID
                </label>
                <input
                  type="text"
                  id="channelInput"
                  value={newChannelInput}
                  onChange={(e) => setNewChannelInput(e.target.value)}
                  placeholder="@channelname, UC..., or full URL"
                  className="w-full rounded border bg-background px-3 py-2"
                  required
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Examples: @TheNextChapter, https://youtube.com/@ballislife
                </p>
              </div>

              <div className="mb-4">
                <label htmlFor="frequency" className="mb-1 block text-sm font-medium">
                  Scrape Frequency
                </label>
                <select
                  id="frequency"
                  value={scrapeFrequency}
                  onChange={(e) => setScrapeFrequency(e.target.value as typeof scrapeFrequency)}
                  className="w-full rounded border bg-background px-3 py-2"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="manual">Manual only</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={scrapeImmediately}
                    onChange={(e) => setScrapeImmediately(e.target.checked)}
                    className="rounded"
                  />
                  <span className="text-sm">Scrape immediately after adding</span>
                </label>
              </div>

              {createChannel.error && (
                <div className="mb-4 rounded bg-red-100 p-2 text-sm text-red-800">
                  {createChannel.error.message}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="rounded bg-secondary px-4 py-2 text-secondary-foreground hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createChannel.isPending}
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
