/**
 * Player Form Modal
 * Modal component for creating and editing player profiles
 */

"use client";

import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc/client";

interface PlayerFormModalProps {
  mode: "create" | "edit";
  playerId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface PlayerFormData {
  name: string;
  aliases: string;
  height: string;
  position: string;
  location: string;
  instagramHandle: string;
  imageUrl: string;
}

const initialFormData: PlayerFormData = {
  name: "",
  aliases: "",
  height: "",
  position: "",
  location: "",
  instagramHandle: "",
  imageUrl: "",
};

export default function PlayerFormModal({
  mode,
  playerId,
  onClose,
  onSuccess,
}: PlayerFormModalProps) {
  const [formData, setFormData] = useState<PlayerFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<PlayerFormData>>({});

  // Fetch player data if editing
  const { data: player, isLoading: isLoadingPlayer } = trpc.player.getById.useQuery(
    { id: playerId! },
    { enabled: mode === "edit" && !!playerId }
  );

  // Mutations
  const createPlayer = trpc.player.create.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      // eslint-disable-next-line no-alert
      alert(`Failed to create player: ${error.message}`);
    },
  });

  const updatePlayer = trpc.player.update.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      // eslint-disable-next-line no-alert
      alert(`Failed to update player: ${error.message}`);
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (mode === "edit" && player) {
      const newFormData = {
        name: player.name,
        aliases: player.aliases.join(", "),
        height: player.height || "",
        position: player.position || "",
        location: player.location || "",
        instagramHandle: player.instagramHandle || "",
        imageUrl: player.imageUrl || "",
      };
      setFormData(newFormData);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, player?.id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PlayerFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.imageUrl && formData.imageUrl.trim()) {
      try {
        const url = new URL(formData.imageUrl);
        // Validate that it's a valid URL
        if (!url.protocol.startsWith("http")) {
          newErrors.imageUrl = "Invalid URL format";
        }
      } catch {
        newErrors.imageUrl = "Invalid URL format";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Parse aliases from comma-separated string
    const aliasesArray = formData.aliases
      .split(",")
      .map((alias) => alias.trim())
      .filter((alias) => alias.length > 0);

    const playerData = {
      name: formData.name.trim(),
      aliases: aliasesArray,
      height: formData.height.trim() || undefined,
      position: formData.position.trim() || undefined,
      location: formData.location.trim() || undefined,
      instagramHandle: formData.instagramHandle.trim() || undefined,
      imageUrl: formData.imageUrl.trim() || "",
    };

    if (mode === "create") {
      await createPlayer.mutateAsync(playerData);
    } else if (playerId) {
      await updatePlayer.mutateAsync({
        id: playerId,
        ...playerData,
      });
    }
  };

  const handleChange = (field: keyof PlayerFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isPending = createPlayer.isPending || updatePlayer.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Create New Player" : "Edit Player"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            ✕
          </button>
        </div>

        {isLoadingPlayer && mode === "edit" ? (
          <div className="py-8 text-center text-muted-foreground">Loading player data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="mb-1 block text-sm font-medium">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., John Smith"
                disabled={isPending}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

            {/* Aliases */}
            <div>
              <label htmlFor="aliases" className="mb-1 block text-sm font-medium">
                Aliases
              </label>
              <input
                id="aliases"
                type="text"
                value={formData.aliases}
                onChange={(e) => handleChange("aliases", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., J-Smooth, Johnny Buckets (comma-separated)"
                disabled={isPending}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Alternative names used in videos (comma-separated)
              </p>
            </div>

            {/* Height */}
            <div>
              <label htmlFor="height" className="mb-1 block text-sm font-medium">
                Height
              </label>
              <input
                id="height"
                type="text"
                value={formData.height}
                onChange={(e) => handleChange("height", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., 6'2&quot;"
                disabled={isPending}
              />
            </div>

            {/* Position */}
            <div>
              <label htmlFor="position" className="mb-1 block text-sm font-medium">
                Position
              </label>
              <input
                id="position"
                type="text"
                value={formData.position}
                onChange={(e) => handleChange("position", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Guard, Forward, Center"
                disabled={isPending}
              />
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="mb-1 block text-sm font-medium">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => handleChange("location", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="e.g., Los Angeles, CA"
                disabled={isPending}
              />
            </div>

            {/* Instagram Handle */}
            <div>
              <label htmlFor="instagramHandle" className="mb-1 block text-sm font-medium">
                Instagram Handle
              </label>
              <div className="flex">
                <span className="flex items-center rounded-l-md border border-r-0 bg-secondary px-3 text-muted-foreground">
                  @
                </span>
                <input
                  id="instagramHandle"
                  type="text"
                  value={formData.instagramHandle}
                  onChange={(e) => handleChange("instagramHandle", e.target.value)}
                  className="w-full rounded-r-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="username"
                  disabled={isPending}
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium">
                Profile Image URL
              </label>
              <input
                id="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={(e) => handleChange("imageUrl", e.target.value)}
                className="w-full rounded-md border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="https://example.com/image.jpg"
                disabled={isPending}
              />
              {errors.imageUrl && <p className="mt-1 text-sm text-red-500">{errors.imageUrl}</p>}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isPending}
                className="rounded-md border px-6 py-2 hover:bg-secondary disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isPending}
                className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {isPending && "Saving..."}
                {!isPending && mode === "create" && "Create Player"}
                {!isPending && mode === "edit" && "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
