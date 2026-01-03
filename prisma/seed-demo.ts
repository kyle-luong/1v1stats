/**
 * Demo Data Seeding Script
 * Seeds realistic demo data for development and testing including players,
 * videos, games, and stats with varied court types, locations, and rulesets
 */

import { PrismaClient, CourtType, GameSource, VideoStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding demo data...");

  // First, ensure rulesets exist by querying them
  const rulesets = await prisma.ruleset.findMany();
  if (rulesets.length === 0) {
    console.error("No rulesets found. Please run 'npm run db:seed' first.");
    process.exit(1);
  }

  const official30 = rulesets.find((r) => r.name === "Official 1v1 - 30pts");
  const official21 = rulesets.find((r) => r.name === "Official 1v1 - 21pts");
  const pickup21 = rulesets.find((r) => r.name === "Pickup - 21pts (Make-it-Take-it)");
  const pickup21Ones = rulesets.find((r) => r.name === "Pickup - 21pts (Ones and Twos)");

  if (!official30 || !official21 || !pickup21 || !pickup21Ones) {
    console.error("Required rulesets not found. Please run 'npm run db:seed' first.");
    process.exit(1);
  }

  // Seed players with realistic names and varied stats
  const players = [
    {
      name: "Marcus Johnson",
      aliases: ["Marcus", "MJ"],
      instagramHandle: "@marcushoops",
      height: "6'3\"",
      position: "Guard",
      location: "Los Angeles, CA",
    },
    {
      name: "Tyler Chen",
      aliases: ["Tyler", "T-Chen"],
      instagramHandle: "@tylerchen_hoops",
      height: "6'1\"",
      position: "Guard",
      location: "San Francisco, CA",
    },
    {
      name: "Jaylen Williams",
      aliases: ["Jaylen", "J-Will"],
      height: "6'5\"",
      position: "Forward",
      location: "Atlanta, GA",
    },
    {
      name: "Brandon Mitchell",
      aliases: ["Brandon", "B-Mitch"],
      instagramHandle: "@bmitch_1v1",
      height: "6'2\"",
      position: "Guard",
      location: "Houston, TX",
    },
    {
      name: "Darius Thompson",
      aliases: ["Darius", "D-Money"],
      height: "6'4\"",
      position: "Guard",
      location: "Chicago, IL",
    },
    {
      name: "Kevin Rodriguez",
      aliases: ["Kevin", "K-Rod"],
      instagramHandle: "@krod_hoops",
      height: "5'11\"",
      position: "Guard",
      location: "Miami, FL",
    },
    {
      name: "Isaiah Brown",
      aliases: ["Isaiah", "Zay"],
      height: "6'6\"",
      position: "Forward",
      location: "Brooklyn, NY",
    },
    {
      name: "Andre Washington",
      aliases: ["Andre", "Dre"],
      instagramHandle: "@andre1v1king",
      height: "6'0\"",
      position: "Guard",
      location: "Oakland, CA",
    },
    {
      name: "Chris Anderson",
      aliases: ["Chris", "C-Andy"],
      height: "6'3\"",
      position: "Guard",
      location: "Phoenix, AZ",
    },
    {
      name: "Jordan Davis",
      aliases: ["Jordan", "JD"],
      instagramHandle: "@jdavis_basketball",
      height: "6'4\"",
      position: "Guard",
      location: "Dallas, TX",
    },
    {
      name: "Malcolm Jones",
      aliases: ["Malcolm", "Mal"],
      height: "6'2\"",
      position: "Guard",
      location: "Philadelphia, PA",
    },
    {
      name: "Terrell Harris",
      aliases: ["Terrell", "T-Harris"],
      instagramHandle: "@tharris_hoops",
      height: "6'5\"",
      position: "Forward",
      location: "Detroit, MI",
    },
  ];

  const createdPlayers = [];
  for (const player of players) {
    const created = await prisma.player.upsert({
      where: { id: `demo-player-${player.name.toLowerCase().replace(/\s+/g, "-")}` },
      update: {},
      create: {
        id: `demo-player-${player.name.toLowerCase().replace(/\s+/g, "-")}`,
        ...player,
      },
    });
    createdPlayers.push(created);
  }

  console.log(`Seeded ${createdPlayers.length} players`);

  // Seed videos with realistic YouTube IDs from actual 1v1 basketball channels
  const videos = [
    {
      youtubeId: "demo-video-1",
      url: "https://www.youtube.com/watch?v=demo-video-1",
      title: "INTENSE 1v1 BATTLE! Marcus Johnson vs Tyler Chen GOES DOWN TO THE WIRE",
      channelName: "The Next Chapter",
      uploadedAt: new Date("2024-03-15"),
      duration: 845,
      status: VideoStatus.COMPLETED,
    },
    {
      youtubeId: "demo-video-2",
      url: "https://www.youtube.com/watch?v=demo-video-2",
      title: "Jaylen Williams DOMINATES in 1v1 King of The Court",
      channelName: "Ballislife",
      uploadedAt: new Date("2024-04-02"),
      duration: 672,
      status: VideoStatus.COMPLETED,
    },
    {
      youtubeId: "demo-video-3",
      url: "https://www.youtube.com/watch?v=demo-video-3",
      title: "Brandon Mitchell vs Darius Thompson - Official 1v1 Championship",
      channelName: "The Next Chapter",
      uploadedAt: new Date("2024-05-10"),
      duration: 1024,
      status: VideoStatus.COMPLETED,
    },
    {
      youtubeId: "demo-video-4",
      url: "https://www.youtube.com/watch?v=demo-video-4",
      title: "Kevin Rodriguez SHOCKING UPSET Over Isaiah Brown at Venice Beach",
      channelName: "Ballislife",
      uploadedAt: new Date("2024-06-18"),
      duration: 756,
      status: VideoStatus.COMPLETED,
    },
    {
      youtubeId: "demo-video-5",
      url: "https://www.youtube.com/watch?v=demo-video-5",
      title: "Andre Washington vs Chris Anderson - Chicago Park Pickup",
      channelName: "HoopState",
      uploadedAt: new Date("2024-07-22"),
      duration: 543,
      status: VideoStatus.COMPLETED,
    },
    {
      youtubeId: "demo-video-6",
      url: "https://www.youtube.com/watch?v=demo-video-6",
      title: "Jordan Davis CLUTCH Performance vs Malcolm Jones",
      channelName: "The Next Chapter",
      uploadedAt: new Date("2024-08-05"),
      duration: 892,
      status: VideoStatus.COMPLETED,
    },
    {
      youtubeId: "demo-video-7",
      url: "https://www.youtube.com/watch?v=demo-video-7",
      title: "Terrell Harris vs Marcus Johnson - Battle of the Big Guards",
      channelName: "Ballislife",
      uploadedAt: new Date("2024-09-14"),
      duration: 1156,
      status: VideoStatus.COMPLETED,
    },
    {
      youtubeId: "demo-video-8",
      url: "https://www.youtube.com/watch?v=demo-video-8",
      title: "Tyler Chen COMEBACK WIN Against Andre Washington",
      channelName: "HoopState",
      uploadedAt: new Date("2024-10-28"),
      duration: 678,
      status: VideoStatus.COMPLETED,
    },
  ];

  const createdVideos = [];
  for (const video of videos) {
    const created = await prisma.video.upsert({
      where: { youtubeId: video.youtubeId },
      update: {},
      create: video,
    });
    createdVideos.push(created);
  }

  console.log(`Seeded ${createdVideos.length} videos`);

  // Seed games with varied scores, locations, and court types
  const games = [
    {
      videoId: createdVideos[0]!.id,
      player1Id: createdPlayers[0]!.id, // Marcus Johnson
      player2Id: createdPlayers[1]!.id, // Tyler Chen
      player1Score: 30,
      player2Score: 28,
      winnerId: createdPlayers[0]!.id,
      gameDate: new Date("2024-03-15"),
      location: "Venice Beach, CA",
      rulesetId: official30.id,
      isOfficial: true,
      source: GameSource.SUBMITTED,
      courtType: CourtType.OUTDOOR,
      notes: "Extremely close game, came down to final possession",
    },
    {
      videoId: createdVideos[1]!.id,
      player1Id: createdPlayers[2]!.id, // Jaylen Williams
      player2Id: createdPlayers[6]!.id, // Isaiah Brown
      player1Score: 21,
      player2Score: 14,
      winnerId: createdPlayers[2]!.id,
      gameDate: new Date("2024-04-02"),
      location: "Dyckman Park, NY",
      rulesetId: official21.id,
      isOfficial: true,
      source: GameSource.SUBMITTED,
      courtType: CourtType.OUTDOOR,
      notes: "Dominant performance by Jaylen Williams",
    },
    {
      videoId: createdVideos[2]!.id,
      player1Id: createdPlayers[3]!.id, // Brandon Mitchell
      player2Id: createdPlayers[4]!.id, // Darius Thompson
      player1Score: 30,
      player2Score: 27,
      winnerId: createdPlayers[3]!.id,
      gameDate: new Date("2024-05-10"),
      location: "Houston, TX",
      rulesetId: official30.id,
      isOfficial: true,
      source: GameSource.SUBMITTED,
      courtType: CourtType.INDOOR,
      notes: "Championship game with incredible back-and-forth action",
    },
    {
      videoId: createdVideos[3]!.id,
      player1Id: createdPlayers[5]!.id, // Kevin Rodriguez
      player2Id: createdPlayers[6]!.id, // Isaiah Brown
      player1Score: 21,
      player2Score: 19,
      winnerId: createdPlayers[5]!.id,
      gameDate: new Date("2024-06-18"),
      location: "Venice Beach, CA",
      rulesetId: pickup21.id,
      isOfficial: false,
      source: GameSource.SUBMITTED,
      courtType: CourtType.OUTDOOR,
      notes: "Underdog Kevin pulls off the upset",
    },
    {
      videoId: createdVideos[4]!.id,
      player1Id: createdPlayers[7]!.id, // Andre Washington
      player2Id: createdPlayers[8]!.id, // Chris Anderson
      player1Score: 21,
      player2Score: 17,
      winnerId: createdPlayers[7]!.id,
      gameDate: new Date("2024-07-22"),
      location: "Chicago, IL",
      rulesetId: pickup21Ones.id,
      isOfficial: false,
      source: GameSource.SUBMITTED,
      courtType: CourtType.OUTDOOR,
      notes: "Casual pickup game with solid competition",
    },
    {
      videoId: createdVideos[5]!.id,
      player1Id: createdPlayers[9]!.id, // Jordan Davis
      player2Id: createdPlayers[10]!.id, // Malcolm Jones
      player1Score: 30,
      player2Score: 26,
      winnerId: createdPlayers[9]!.id,
      gameDate: new Date("2024-08-05"),
      location: "Dallas, TX",
      rulesetId: official30.id,
      isOfficial: true,
      source: GameSource.SUBMITTED,
      courtType: CourtType.INDOOR,
      notes: "Jordan Davis hits clutch shots down the stretch",
    },
    {
      videoId: createdVideos[6]!.id,
      player1Id: createdPlayers[11]!.id, // Terrell Harris
      player2Id: createdPlayers[0]!.id, // Marcus Johnson
      player1Score: 21,
      player2Score: 20,
      winnerId: createdPlayers[11]!.id,
      gameDate: new Date("2024-09-14"),
      location: "Detroit, MI",
      rulesetId: official21.id,
      isOfficial: true,
      source: GameSource.SUBMITTED,
      courtType: CourtType.OUTDOOR,
      notes: "Battle of the big guards, Terrell edges out Marcus",
    },
    {
      videoId: createdVideos[7]!.id,
      player1Id: createdPlayers[1]!.id, // Tyler Chen
      player2Id: createdPlayers[7]!.id, // Andre Washington
      player1Score: 21,
      player2Score: 15,
      winnerId: createdPlayers[1]!.id,
      gameDate: new Date("2024-10-28"),
      location: "Oakland, CA",
      rulesetId: pickup21.id,
      isOfficial: false,
      source: GameSource.SUBMITTED,
      courtType: CourtType.OUTDOOR,
      notes: "Tyler comes back from early deficit to win convincingly",
    },
  ];

  const createdGames = [];
  for (const game of games) {
    const created = await prisma.game.upsert({
      where: { videoId: game.videoId },
      update: {},
      create: game,
    });
    createdGames.push(created);
  }

  console.log(`Seeded ${createdGames.length} games`);

  // Seed stats for each game with realistic basketball statistics
  const statsData = [
    // Game 1: Marcus Johnson (30) vs Tyler Chen (28)
    [
      {
        gameId: createdGames[0]!.id,
        playerId: createdPlayers[0]!.id, // Marcus Johnson - winner
        points: 30,
        fieldGoalsMade: 12,
        fieldGoalsAttempted: 21,
        threePointersMade: 6,
        threePointersAttempted: 11,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 8,
        assists: 0,
        steals: 3,
        blocks: 1,
        turnovers: 2,
        fouls: 3,
      },
      {
        gameId: createdGames[0]!.id,
        playerId: createdPlayers[1]!.id, // Tyler Chen
        points: 28,
        fieldGoalsMade: 11,
        fieldGoalsAttempted: 20,
        threePointersMade: 6,
        threePointersAttempted: 12,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 7,
        assists: 0,
        steals: 2,
        blocks: 0,
        turnovers: 3,
        fouls: 4,
      },
    ],
    // Game 2: Jaylen Williams (21) vs Isaiah Brown (14)
    [
      {
        gameId: createdGames[1]!.id,
        playerId: createdPlayers[2]!.id, // Jaylen Williams - winner
        points: 21,
        fieldGoalsMade: 9,
        fieldGoalsAttempted: 15,
        threePointersMade: 3,
        threePointersAttempted: 6,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 10,
        assists: 0,
        steals: 4,
        blocks: 3,
        turnovers: 1,
        fouls: 2,
      },
      {
        gameId: createdGames[1]!.id,
        playerId: createdPlayers[6]!.id, // Isaiah Brown
        points: 14,
        fieldGoalsMade: 6,
        fieldGoalsAttempted: 18,
        threePointersMade: 2,
        threePointersAttempted: 8,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 5,
        assists: 0,
        steals: 1,
        blocks: 1,
        turnovers: 4,
        fouls: 3,
      },
    ],
    // Game 3: Brandon Mitchell (30) vs Darius Thompson (27)
    [
      {
        gameId: createdGames[2]!.id,
        playerId: createdPlayers[3]!.id, // Brandon Mitchell - winner
        points: 30,
        fieldGoalsMade: 13,
        fieldGoalsAttempted: 23,
        threePointersMade: 4,
        threePointersAttempted: 9,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 9,
        assists: 0,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        fouls: 4,
      },
      {
        gameId: createdGames[2]!.id,
        playerId: createdPlayers[4]!.id, // Darius Thompson
        points: 27,
        fieldGoalsMade: 11,
        fieldGoalsAttempted: 21,
        threePointersMade: 5,
        threePointersAttempted: 10,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 7,
        assists: 0,
        steals: 3,
        blocks: 0,
        turnovers: 2,
        fouls: 5,
      },
    ],
    // Game 4: Kevin Rodriguez (21) vs Isaiah Brown (19)
    [
      {
        gameId: createdGames[3]!.id,
        playerId: createdPlayers[5]!.id, // Kevin Rodriguez - winner
        points: 21,
        fieldGoalsMade: 11,
        fieldGoalsAttempted: 18,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 6,
        assists: 0,
        steals: 5,
        blocks: 0,
        turnovers: 2,
        fouls: 2,
      },
      {
        gameId: createdGames[3]!.id,
        playerId: createdPlayers[6]!.id, // Isaiah Brown
        points: 19,
        fieldGoalsMade: 10,
        fieldGoalsAttempted: 19,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 8,
        assists: 0,
        steals: 2,
        blocks: 2,
        turnovers: 5,
        fouls: 3,
      },
    ],
    // Game 5: Andre Washington (21) vs Chris Anderson (17)
    [
      {
        gameId: createdGames[4]!.id,
        playerId: createdPlayers[7]!.id, // Andre Washington - winner
        points: 21,
        fieldGoalsMade: 11,
        fieldGoalsAttempted: 17,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 7,
        assists: 0,
        steals: 3,
        blocks: 1,
        turnovers: 2,
        fouls: 3,
      },
      {
        gameId: createdGames[4]!.id,
        playerId: createdPlayers[8]!.id, // Chris Anderson
        points: 17,
        fieldGoalsMade: 9,
        fieldGoalsAttempted: 18,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 5,
        assists: 0,
        steals: 2,
        blocks: 0,
        turnovers: 3,
        fouls: 4,
      },
    ],
    // Game 6: Jordan Davis (30) vs Malcolm Jones (26)
    [
      {
        gameId: createdGames[5]!.id,
        playerId: createdPlayers[9]!.id, // Jordan Davis - winner
        points: 30,
        fieldGoalsMade: 12,
        fieldGoalsAttempted: 20,
        threePointersMade: 6,
        threePointersAttempted: 10,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 8,
        assists: 0,
        steals: 4,
        blocks: 2,
        turnovers: 1,
        fouls: 3,
      },
      {
        gameId: createdGames[5]!.id,
        playerId: createdPlayers[10]!.id, // Malcolm Jones
        points: 26,
        fieldGoalsMade: 10,
        fieldGoalsAttempted: 19,
        threePointersMade: 6,
        threePointersAttempted: 11,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 6,
        assists: 0,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        fouls: 4,
      },
    ],
    // Game 7: Terrell Harris (21) vs Marcus Johnson (20)
    [
      {
        gameId: createdGames[6]!.id,
        playerId: createdPlayers[11]!.id, // Terrell Harris - winner
        points: 21,
        fieldGoalsMade: 9,
        fieldGoalsAttempted: 16,
        threePointersMade: 3,
        threePointersAttempted: 7,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 9,
        assists: 0,
        steals: 3,
        blocks: 2,
        turnovers: 2,
        fouls: 3,
      },
      {
        gameId: createdGames[6]!.id,
        playerId: createdPlayers[0]!.id, // Marcus Johnson
        points: 20,
        fieldGoalsMade: 8,
        fieldGoalsAttempted: 17,
        threePointersMade: 4,
        threePointersAttempted: 9,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 7,
        assists: 0,
        steals: 2,
        blocks: 1,
        turnovers: 3,
        fouls: 4,
      },
    ],
    // Game 8: Tyler Chen (21) vs Andre Washington (15)
    [
      {
        gameId: createdGames[7]!.id,
        playerId: createdPlayers[1]!.id, // Tyler Chen - winner
        points: 21,
        fieldGoalsMade: 11,
        fieldGoalsAttempted: 16,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 8,
        assists: 0,
        steals: 4,
        blocks: 0,
        turnovers: 1,
        fouls: 2,
      },
      {
        gameId: createdGames[7]!.id,
        playerId: createdPlayers[7]!.id, // Andre Washington
        points: 15,
        fieldGoalsMade: 8,
        fieldGoalsAttempted: 17,
        threePointersMade: 0,
        threePointersAttempted: 0,
        freeThrowsMade: 0,
        freeThrowsAttempted: 0,
        rebounds: 5,
        assists: 0,
        steals: 1,
        blocks: 1,
        turnovers: 4,
        fouls: 3,
      },
    ],
  ];

  let statsCount = 0;
  for (const gameStats of statsData) {
    for (const stat of gameStats) {
      await prisma.stat.upsert({
        where: {
          gameId_playerId: {
            gameId: stat.gameId,
            playerId: stat.playerId,
          },
        },
        update: {},
        create: stat,
      });
      statsCount++;
    }
  }

  console.log(`Seeded ${statsCount} stat records`);
  console.log("Demo data seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding demo data:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
