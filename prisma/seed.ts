/**
 * Database Seeding Script
 * Seeds common rulesets for 1v1 basketball games
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Seed common rulesets
  const rulesets = [
    {
      name: "Official 1v1 - 30pts",
      description: "Official competitive 1v1 format: 30 points to win, refereed, one-possession (no offensive rebounds), ~4 dribble limit",
      scoringTarget: 30,
      shotValues: "2s-3s",
      possessionType: "one-possession",
      isRefereed: true,
      dribbleLimit: 4,
    },
    {
      name: "Official 1v1 - 21pts",
      description: "Official competitive 1v1 format: 21 points to win, refereed, one-possession (no offensive rebounds), ~4 dribble limit",
      scoringTarget: 21,
      shotValues: "2s-3s",
      possessionType: "one-possession",
      isRefereed: true,
      dribbleLimit: 4,
    },
    {
      name: "Pickup - 21pts (Make-it-Take-it)",
      description: "Casual pickup format: 21 points, make-it-take-it, no referee",
      scoringTarget: 21,
      shotValues: "1s-2s",
      possessionType: "make-it-take-it",
      isRefereed: false,
      dribbleLimit: null,
    },
    {
      name: "Pickup - 21pts (Ones and Twos)",
      description: "Casual pickup format: 21 points, one-possession, 1s and 2s scoring, no referee",
      scoringTarget: 21,
      shotValues: "1s-2s",
      possessionType: "one-possession",
      isRefereed: false,
      dribbleLimit: null,
    },
    {
      name: "Pickup - 11pts",
      description: "Quick pickup game: 11 points to win, one-possession, 1s and 2s",
      scoringTarget: 11,
      shotValues: "1s-2s",
      possessionType: "one-possession",
      isRefereed: false,
      dribbleLimit: null,
    },
  ];

  for (const ruleset of rulesets) {
    await prisma.ruleset.upsert({
      where: { name: ruleset.name },
      update: {},
      create: ruleset,
    });
  }

  console.log(`✓ Seeded ${rulesets.length} rulesets`);
  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error("Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
