/**
 * Make Admin Script
 * Grants admin privileges to a user by email
 * Usage: npx tsx scripts/make-admin.ts your@email.com
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function makeAdmin(email: string) {
  console.log(`Looking for user with email: ${email}`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`User not found with email: ${email}`);
    console.log("\nMake sure the user has signed up first:");
    console.log(`  1. Go to http://localhost:3000/signup`);
    console.log(`  2. Create an account with this email`);
    console.log(`  3. Run this script again`);
    process.exit(1);
  }

  if (user.isAdmin) {
    console.log(`User is already an admin: ${user.email}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { isAdmin: true },
  });

  console.log(`Successfully granted admin privileges to: ${user.email}`);
  console.log(`\nYou can now access /admin routes after logging in.`);
}

const email = process.argv[2];

if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.ts your@email.com");
  process.exit(1);
}

makeAdmin(email)
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
