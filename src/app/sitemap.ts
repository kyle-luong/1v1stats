/**
 * Dynamic sitemap generation for SEO
 * Includes all public pages: players, games, videos, and static pages
 */

import { MetadataRoute } from 'next';
import { db } from '@/server/db';
import { VideoStatus } from '@prisma/client';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/players`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/games`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/videos`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/submit`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/feedback`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  try {
    // Player pages
    const players = await db.player.findMany({
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const playerPages: MetadataRoute.Sitemap = players.map((player) => ({
      url: `${baseUrl}/players/${player.id}`,
      lastModified: player.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    // Game pages (only approved competitive games)
    const games = await db.game.findMany({
      where: {
        isOfficial: true,
        video: {
          status: VideoStatus.APPROVED,
        },
      },
      select: { id: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const gamePages: MetadataRoute.Sitemap = games.map((game) => ({
      url: `${baseUrl}/games/${game.id}`,
      lastModified: game.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticPages, ...playerPages, ...gamePages];
  } catch (error) {
    console.warn('Could not load dynamic sitemap data, returning static pages only.', error);
    return staticPages;
  }
}
