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
  fullName: string;
  aliases: string;
  bio: string;
  height: string;
  weight: string;
  hometown: string;
  location: string;
  birthDate: string;
  imageUrl: string;
  instagramHandle: string;
  twitterHandle: string;
  youtubeChannel: string;
  tiktokHandle: string;
}

const initialFormData: PlayerFormData = {
  name: "",
  fullName: "",
  aliases: "",
  bio: "",
  height: "",
  weight: "",
  hometown: "",
  location: "",
  birthDate: "",
  imageUrl: "",
  instagramHandle: "",
  twitterHandle: "",
  youtubeChannel: "",
  tiktokHandle: "",
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
      setFormData({
        name: player.name,
        fullName: player.fullName || "",
        aliases: player.aliases.join(", "),
        bio: player.bio || "",
        height: player.height || "",
        weight: player.weight || "",
        hometown: player.hometown || "",
        location: player.location || "",
        birthDate: player.birthDate ? new Date(player.birthDate).toISOString().split("T")[0] : "",
        imageUrl: player.imageUrl || "",
        instagramHandle: player.instagramHandle || "",
        twitterHandle: player.twitterHandle || "",
        youtubeChannel: player.youtubeChannel || "",
        tiktokHandle: player.tiktokHandle || "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, player?.id]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PlayerFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Display name is required";
    }

    if (formData.imageUrl && formData.imageUrl.trim()) {
      try {
        const url = new URL(formData.imageUrl);
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
      fullName: formData.fullName.trim() || undefined,
      aliases: aliasesArray,
      bio: formData.bio.trim() || undefined,
      height: formData.height.trim() || undefined,
      weight: formData.weight.trim() || undefined,
      hometown: formData.hometown.trim() || undefined,
      location: formData.location.trim() || undefined,
      birthDate: formData.birthDate ? new Date(formData.birthDate) : undefined,
      imageUrl: formData.imageUrl.trim() || "",
      instagramHandle: formData.instagramHandle.trim() || undefined,
      twitterHandle: formData.twitterHandle.trim() || undefined,
      youtubeChannel: formData.youtubeChannel.trim() || undefined,
      tiktokHandle: formData.tiktokHandle.trim() || undefined,
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
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const isPending = createPlayer.isPending || updatePlayer.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">
            {mode === "create" ? "Create New Player" : "Edit Player"}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoadingPlayer && mode === "edit" ? (
          <div className="py-8 text-center text-muted-foreground">Loading player data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">Basic Info</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Display Name */}
                <div>
                  <label htmlFor="name" className="mb-1 block text-sm font-medium">
                    Display Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Rob Colon"
                    disabled={isPending}
                  />
                  {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="mb-1 block text-sm font-medium">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => handleChange("fullName", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Robert Colon"
                    disabled={isPending}
                  />
                </div>
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
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Bobby, Rob C, The Closer (comma-separated)"
                  disabled={isPending}
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  Other names used in videos (comma-separated)
                </p>
              </div>

              {/* Bio */}
              <div>
                <label htmlFor="bio" className="mb-1 block text-sm font-medium">
                  Bio
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange("bio", e.target.value)}
                  rows={3}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Player description, achievements, style of play..."
                  disabled={isPending}
                />
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
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="https://example.com/image.jpg"
                  disabled={isPending}
                />
                {errors.imageUrl && <p className="mt-1 text-sm text-red-500">{errors.imageUrl}</p>}
              </div>
            </div>

            {/* Physical Info Section */}
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">Physical Info</h3>
              
              <div className="grid grid-cols-3 gap-4">
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
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`6'2"`}
                    disabled={isPending}
                  />
                </div>

                {/* Weight */}
                <div>
                  <label htmlFor="weight" className="mb-1 block text-sm font-medium">
                    Weight
                  </label>
                  <input
                    id="weight"
                    type="text"
                    value={formData.weight}
                    onChange={(e) => handleChange("weight", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="185 lbs"
                    disabled={isPending}
                  />
                </div>

                {/* Birth Date */}
                <div>
                  <label htmlFor="birthDate" className="mb-1 block text-sm font-medium">
                    Birth Date
                  </label>
                  <input
                    id="birthDate"
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => handleChange("birthDate", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    disabled={isPending}
                  />
                </div>
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">Location</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Hometown */}
                <div>
                  <label htmlFor="hometown" className="mb-1 block text-sm font-medium">
                    Hometown
                  </label>
                  <input
                    id="hometown"
                    type="text"
                    value={formData.hometown}
                    onChange={(e) => handleChange("hometown", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Brooklyn, NY"
                    disabled={isPending}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Where they&apos;re from</p>
                </div>

                {/* Current Location */}
                <div>
                  <label htmlFor="location" className="mb-1 block text-sm font-medium">
                    Current Location
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Los Angeles, CA"
                    disabled={isPending}
                  />
                  <p className="mt-1 text-xs text-muted-foreground">Where they live now</p>
                </div>
              </div>
            </div>

            {/* Social Links Section */}
            <div className="space-y-4">
              <h3 className="border-b pb-2 text-lg font-semibold">Social Links</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {/* Instagram */}
                <div>
                  <label htmlFor="instagramHandle" className="mb-1 block text-sm font-medium">
                    Instagram
                  </label>
                  <div className="flex">
                    <span className="flex items-center rounded-l-md border border-r-0 bg-secondary px-3 text-sm text-muted-foreground">
                      @
                    </span>
                    <input
                      id="instagramHandle"
                      type="text"
                      value={formData.instagramHandle}
                      onChange={(e) => handleChange("instagramHandle", e.target.value)}
                      className="w-full rounded-r-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="username"
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* Twitter */}
                <div>
                  <label htmlFor="twitterHandle" className="mb-1 block text-sm font-medium">
                    Twitter / X
                  </label>
                  <div className="flex">
                    <span className="flex items-center rounded-l-md border border-r-0 bg-secondary px-3 text-sm text-muted-foreground">
                      @
                    </span>
                    <input
                      id="twitterHandle"
                      type="text"
                      value={formData.twitterHandle}
                      onChange={(e) => handleChange("twitterHandle", e.target.value)}
                      className="w-full rounded-r-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="username"
                      disabled={isPending}
                    />
                  </div>
                </div>

                {/* YouTube */}
                <div>
                  <label htmlFor="youtubeChannel" className="mb-1 block text-sm font-medium">
                    YouTube
                  </label>
                  <input
                    id="youtubeChannel"
                    type="text"
                    value={formData.youtubeChannel}
                    onChange={(e) => handleChange("youtubeChannel", e.target.value)}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="Channel name or URL"
                    disabled={isPending}
                  />
                </div>

                {/* TikTok */}
                <div>
                  <label htmlFor="tiktokHandle" className="mb-1 block text-sm font-medium">
                    TikTok
                  </label>
                  <div className="flex">
                    <span className="flex items-center rounded-l-md border border-r-0 bg-secondary px-3 text-sm text-muted-foreground">
                      @
                    </span>
                    <input
                      id="tiktokHandle"
                      type="text"
                      value={formData.tiktokHandle}
                      onChange={(e) => handleChange("tiktokHandle", e.target.value)}
                      className="w-full rounded-r-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="username"
                      disabled={isPending}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 border-t pt-4">
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
