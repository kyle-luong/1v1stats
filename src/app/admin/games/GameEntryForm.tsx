/**
 * Game Entry Form Component
 * Form for creating a new game from a video with player selection and score entry
 */

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc/client";
import { CourtType } from "@prisma/client";

interface GameEntryFormProps {
  onSuccess: () => void;
}

export default function GameEntryForm({ onSuccess }: GameEntryFormProps) {
  const [formData, setFormData] = useState({
    videoId: "",
    player1Id: "",
    player2Id: "",
    player1Score: "",
    player2Score: "",
    rulesetId: "",
    isOfficial: false,
    courtType: "UNKNOWN" as CourtType,
    gameDate: "",
    location: "",
    notes: "",
  });

  const [player1Search, setPlayer1Search] = useState("");
  const [player2Search, setPlayer2Search] = useState("");
  const [showPlayer1Dropdown, setShowPlayer1Dropdown] = useState(false);
  const [showPlayer2Dropdown, setShowPlayer2Dropdown] = useState(false);

  const videos = trpc.video.getVideosWithoutGames.useQuery();
  const players = trpc.player.getAll.useQuery({ limit: 100 });
  const rulesets = trpc.ruleset.getAll.useQuery();
  const createGame = trpc.game.createWithStats.useMutation({
    onSuccess: () => {
      onSuccess();
      // Reset form
      setFormData({
        videoId: "",
        player1Id: "",
        player2Id: "",
        player1Score: "",
        player2Score: "",
        rulesetId: "",
        isOfficial: false,
        courtType: "UNKNOWN",
        gameDate: "",
        location: "",
        notes: "",
      });
      setPlayer1Search("");
      setPlayer2Search("");
    },
    onError: (error) => {
      // eslint-disable-next-line no-alert
      alert(`Error creating game: ${error.message}`);
    },
  });

  const filteredPlayer1Options = useMemo(
    () =>
      players.data?.filter(
        (p) =>
          p.name.toLowerCase().includes(player1Search.toLowerCase()) && p.id !== formData.player2Id
      ) || [],
    [players.data, player1Search, formData.player2Id]
  );

  const filteredPlayer2Options = useMemo(
    () =>
      players.data?.filter(
        (p) =>
          p.name.toLowerCase().includes(player2Search.toLowerCase()) && p.id !== formData.player1Id
      ) || [],
    [players.data, player2Search, formData.player1Id]
  );

  const selectedPlayer1 = players.data?.find((p) => p.id === formData.player1Id);
  const selectedPlayer2 = players.data?.find((p) => p.id === formData.player2Id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const player1Score = parseInt(formData.player1Score, 10);
    const player2Score = parseInt(formData.player2Score, 10);

    if (!formData.videoId || !formData.player1Id || !formData.player2Id) {
      // eslint-disable-next-line no-alert
      alert("Please select video and both players");
      return;
    }

    if (Number.isNaN(player1Score) || Number.isNaN(player2Score)) {
      // eslint-disable-next-line no-alert
      alert("Please enter valid scores");
      return;
    }

    // Create placeholder stats with only points populated
    const player1Stats = {
      points: player1Score,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
    };

    const player2Stats = {
      points: player2Score,
      fieldGoalsMade: 0,
      fieldGoalsAttempted: 0,
      threePointersMade: 0,
      threePointersAttempted: 0,
      freeThrowsMade: 0,
      freeThrowsAttempted: 0,
      rebounds: 0,
      assists: 0,
      steals: 0,
      blocks: 0,
      turnovers: 0,
      fouls: 0,
    };

    await createGame.mutateAsync({
      videoId: formData.videoId,
      player1Id: formData.player1Id,
      player2Id: formData.player2Id,
      player1Score,
      player2Score,
      player1Stats,
      player2Stats,
      rulesetId: formData.rulesetId || undefined,
      isOfficial: formData.isOfficial,
      courtType: formData.courtType,
      gameDate: formData.gameDate ? new Date(formData.gameDate) : undefined,
      location: formData.location || undefined,
      notes: formData.notes || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Video Selection */}
      <div>
        <label htmlFor="video" className="mb-2 block text-sm font-medium">
          Select Video <span className="text-red-500">*</span>
        </label>
        <select
          id="video"
          value={formData.videoId}
          onChange={(e) => setFormData({ ...formData, videoId: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2"
          required
        >
          <option value="">-- Select a video --</option>
          {videos.data?.map((video) => (
            <option key={video.id} value={video.id}>
              {video.title} ({video.channelName})
            </option>
          ))}
        </select>
        {videos.data?.length === 0 && (
          <p className="mt-1 text-sm text-muted-foreground">
            No videos available. All videos have games assigned.
          </p>
        )}
      </div>

      {/* Player 1 Selection */}
      <div className="relative">
        <label htmlFor="player1-search" className="mb-2 block text-sm font-medium">
          Player 1 <span className="text-red-500">*</span>
        </label>
        <input
          id="player1-search"
          type="text"
          value={selectedPlayer1?.name || player1Search}
          onChange={(e) => {
            setPlayer1Search(e.target.value);
            setFormData({ ...formData, player1Id: "" });
            setShowPlayer1Dropdown(true);
          }}
          onFocus={() => setShowPlayer1Dropdown(true)}
          placeholder="Search for player..."
          className="w-full rounded-md border bg-background px-3 py-2"
          required
        />
        {showPlayer1Dropdown && !selectedPlayer1 && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-card shadow-lg">
            {filteredPlayer1Options.length > 0 ? (
              filteredPlayer1Options.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, player1Id: player.id });
                    setPlayer1Search(player.name);
                    setShowPlayer1Dropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-secondary"
                >
                  {player.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">No players found</div>
            )}
          </div>
        )}
      </div>

      {/* Player 2 Selection */}
      <div className="relative">
        <label htmlFor="player2-search" className="mb-2 block text-sm font-medium">
          Player 2 <span className="text-red-500">*</span>
        </label>
        <input
          id="player2-search"
          type="text"
          value={selectedPlayer2?.name || player2Search}
          onChange={(e) => {
            setPlayer2Search(e.target.value);
            setFormData({ ...formData, player2Id: "" });
            setShowPlayer2Dropdown(true);
          }}
          onFocus={() => setShowPlayer2Dropdown(true)}
          placeholder="Search for player..."
          className="w-full rounded-md border bg-background px-3 py-2"
          required
        />
        {showPlayer2Dropdown && !selectedPlayer2 && (
          <div className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-card shadow-lg">
            {filteredPlayer2Options.length > 0 ? (
              filteredPlayer2Options.map((player) => (
                <button
                  key={player.id}
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, player2Id: player.id });
                    setPlayer2Search(player.name);
                    setShowPlayer2Dropdown(false);
                  }}
                  className="w-full px-3 py-2 text-left hover:bg-secondary"
                >
                  {player.name}
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">No players found</div>
            )}
          </div>
        )}
      </div>

      {/* Scores */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="player1-score" className="mb-2 block text-sm font-medium">
            Player 1 Score <span className="text-red-500">*</span>
          </label>
          <input
            id="player1-score"
            type="number"
            min="0"
            value={formData.player1Score}
            onChange={(e) => setFormData({ ...formData, player1Score: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>
        <div>
          <label htmlFor="player2-score" className="mb-2 block text-sm font-medium">
            Player 2 Score <span className="text-red-500">*</span>
          </label>
          <input
            id="player2-score"
            type="number"
            min="0"
            value={formData.player2Score}
            onChange={(e) => setFormData({ ...formData, player2Score: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2"
            required
          />
        </div>
      </div>

      {/* Ruleset */}
      <div>
        <label htmlFor="ruleset" className="mb-2 block text-sm font-medium">
          Ruleset
        </label>
        <select
          id="ruleset"
          value={formData.rulesetId}
          onChange={(e) => setFormData({ ...formData, rulesetId: e.target.value })}
          className="w-full rounded-md border bg-background px-3 py-2"
        >
          <option value="">-- No ruleset --</option>
          {rulesets.data?.map((ruleset) => (
            <option key={ruleset.id} value={ruleset.id}>
              {ruleset.name} ({ruleset.scoringTarget} pts)
            </option>
          ))}
        </select>
      </div>

      {/* Court Type */}
      <div>
        <label htmlFor="court-type" className="mb-2 block text-sm font-medium">
          Court Type
        </label>
        <select
          id="court-type"
          value={formData.courtType}
          onChange={(e) => setFormData({ ...formData, courtType: e.target.value as CourtType })}
          className="w-full rounded-md border bg-background px-3 py-2"
        >
          <option value="UNKNOWN">Unknown</option>
          <option value="INDOOR">Indoor</option>
          <option value="OUTDOOR">Outdoor</option>
        </select>
      </div>

      {/* Official Game Checkbox */}
      <div className="flex items-center gap-2">
        <input
          id="is-official"
          type="checkbox"
          checked={formData.isOfficial}
          onChange={(e) => setFormData({ ...formData, isOfficial: e.target.checked })}
          className="h-4 w-4 rounded border-gray-300"
        />
        <label htmlFor="is-official" className="text-sm font-medium">
          Mark as official competitive game
        </label>
      </div>

      {/* Optional Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="game-date" className="mb-2 block text-sm font-medium">
            Game Date
          </label>
          <input
            id="game-date"
            type="date"
            value={formData.gameDate}
            onChange={(e) => setFormData({ ...formData, gameDate: e.target.value })}
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="location" className="mb-2 block text-sm font-medium">
            Location
          </label>
          <input
            id="location"
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Venice Beach, CA"
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="mb-2 block text-sm font-medium">
          Notes
        </label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Optional context about the game..."
          rows={3}
          className="w-full rounded-md border bg-background px-3 py-2"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end gap-3">
        <button
          type="submit"
          disabled={createGame.isPending}
          className="rounded-md bg-primary px-6 py-2 text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {createGame.isPending ? "Creating..." : "Create Game"}
        </button>
      </div>
    </form>
  );
}
