/**
 * Admin Feedback Management Page
 * Review and manage user feedback submissions
 */

"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PageHeader } from "@/components/common/PageHeader";
import { FeedbackType, FeedbackStatus } from "@prisma/client";

const STATUS_COLORS = {
  [FeedbackStatus.UNREVIEWED]: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200",
  [FeedbackStatus.RESOLVED]: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
  [FeedbackStatus.CLOSED]: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200",
};

const TYPE_COLORS = {
  [FeedbackType.BUG_REPORT]: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
  [FeedbackType.FEATURE_REQUEST]: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
  [FeedbackType.DATA_CORRECTION]: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200",
  [FeedbackType.GENERAL]: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200",
};

export default function AdminFeedbackPage() {
  const [statusFilter, setStatusFilter] = useState<FeedbackStatus | "ALL">("ALL");
  const [typeFilter, setTypeFilter] = useState<FeedbackType | "ALL">("ALL");
  const [selectedFeedback, setSelectedFeedback] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");

  const utils = trpc.useUtils();

  const { data: feedback, isLoading } = trpc.feedback.getAll.useQuery({
    status: statusFilter !== "ALL" ? statusFilter : undefined,
    type: typeFilter !== "ALL" ? typeFilter : undefined,
  });

  const { data: stats } = trpc.feedback.getStats.useQuery();

  const updateStatusMutation = trpc.feedback.updateStatus.useMutation({
    onSuccess: () => {
      utils.feedback.getAll.invalidate();
      utils.feedback.getStats.invalidate();
    },
  });

  const addNotesMutation = trpc.feedback.addNotes.useMutation({
    onSuccess: () => {
      utils.feedback.getAll.invalidate();
    },
  });

  const deleteMutation = trpc.feedback.delete.useMutation({
    onSuccess: () => {
      utils.feedback.getAll.invalidate();
      utils.feedback.getStats.invalidate();
      setSelectedFeedback(null);
    },
  });

  const handleStatusChange = async (id: string, status: FeedbackStatus) => {
    await updateStatusMutation.mutateAsync({ id, status });
  };

  const handleSaveNotes = async (id: string) => {
    await addNotesMutation.mutateAsync({ id, adminNotes });
  };

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm("Delete this feedback?")) {
      await deleteMutation.mutateAsync({ id });
    }
  };

  const selectedItem = feedback?.find((f) => f.id === selectedFeedback);

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <PageHeader title="Feedback" subtitle="Manage user feedback and bug reports" />

      {/* Stats Cards */}
      {stats && (
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Unreviewed
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.unreviewed}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Resolved
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Closed
            </div>
            <div className="text-2xl font-bold text-gray-600">{stats.closed}</div>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Total
            </div>
            <div className="text-2xl font-bold text-primary">{stats.total}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="flex flex-col gap-1">
          <label htmlFor="status-filter" className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as FeedbackStatus | "ALL")}
            className="rounded border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All Status</option>
            <option value={FeedbackStatus.UNREVIEWED}>Unreviewed</option>
            <option value={FeedbackStatus.RESOLVED}>Resolved</option>
            <option value={FeedbackStatus.CLOSED}>Closed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="type-filter" className="text-xs font-medium text-muted-foreground">Type</label>
          <select
            id="type-filter"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as FeedbackType | "ALL")}
            className="rounded border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="ALL">All Types</option>
            <option value={FeedbackType.BUG_REPORT}>Bug Report</option>
            <option value={FeedbackType.FEATURE_REQUEST}>Feature Request</option>
            <option value={FeedbackType.DATA_CORRECTION}>Data Correction</option>
            <option value={FeedbackType.GENERAL}>General</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="rounded-lg border bg-card">
        {isLoading && (
          <div className="p-8 text-center text-muted-foreground">Loading...</div>
        )}

        {!isLoading && feedback && feedback.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No feedback found</div>
        )}

        {!isLoading && feedback && feedback.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Submitted
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {feedback.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedFeedback(item.id);
                      setAdminNotes(item.adminNotes || "");
                    }}
                  >
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${TYPE_COLORS[item.type]}`}>
                        {item.type.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium">{item.title}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(item.submittedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[item.status]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        {item.status === FeedbackStatus.UNREVIEWED && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(item.id, FeedbackStatus.RESOLVED);
                            }}
                            className="text-xs text-green-600 hover:underline"
                          >
                            Resolve
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(item.id);
                          }}
                          className="text-xs text-destructive hover:underline"
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

      {/* Detail Modal */}
      {selectedItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setSelectedFeedback(null)}
          onKeyDown={(e) => {
            if (e.key === "Escape") setSelectedFeedback(null);
          }}
          role="button"
          tabIndex={0}
          aria-label="Close modal"
        >
          {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */}
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border bg-card p-6"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-title"
            tabIndex={-1}
          >
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 id="feedback-title" className="text-2xl font-semibold">{selectedItem.title}</h2>
                <div className="mt-2 flex gap-2">
                  <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${TYPE_COLORS[selectedItem.type]}`}>
                    {selectedItem.type.replace(/_/g, " ")}
                  </span>
                  <span className={`inline-block rounded px-2 py-1 text-xs font-medium ${STATUS_COLORS[selectedItem.status]}`}>
                    {selectedItem.status}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFeedback(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </div>

            <div className="mb-4 space-y-4">
              <div>
                <h3 className="mb-2 text-sm font-medium text-muted-foreground">Description</h3>
                <p className="whitespace-pre-wrap">{selectedItem.description}</p>
              </div>

              {(selectedItem.email || selectedItem.name) && (
                <div>
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">Contact</h3>
                  <p className="text-sm">
                    {selectedItem.name && <span>{selectedItem.name}</span>}
                    {selectedItem.email && <span className="text-muted-foreground"> ({selectedItem.email})</span>}
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="status" className="mb-2 block text-sm font-medium">
                  Status
                </label>
                <select
                  id="status"
                  value={selectedItem.status}
                  onChange={(e) => handleStatusChange(selectedItem.id, e.target.value as FeedbackStatus)}
                  className="rounded border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value={FeedbackStatus.UNREVIEWED}>Unreviewed</option>
                  <option value={FeedbackStatus.RESOLVED}>Resolved</option>
                  <option value={FeedbackStatus.CLOSED}>Closed</option>
                </select>
              </div>

              <div>
                <label htmlFor="adminNotes" className="mb-2 block text-sm font-medium">
                  Admin Notes
                </label>
                <textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={4}
                  className="w-full rounded border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Internal notes..."
                />
              </div>
            </div>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => handleDelete(selectedItem.id)}
                className="rounded border border-destructive px-4 py-2 text-sm text-destructive hover:bg-destructive/10"
              >
                Delete
              </button>
              <button
                type="button"
                onClick={() => handleSaveNotes(selectedItem.id)}
                className="rounded bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90"
              >
                Save Notes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
