import { prisma } from "@/lib/db/prisma";
import { success } from "@/lib/api/response";

export async function GET() {
  const now = new Date();
  const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const last30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  // Total requests
  const [total, last24hCount, last7dCount, last30dCount] = await Promise.all([
    prisma.apiRequestLog.count(),
    prisma.apiRequestLog.count({ where: { createdAt: { gte: last24h } } }),
    prisma.apiRequestLog.count({ where: { createdAt: { gte: last7d } } }),
    prisma.apiRequestLog.count({ where: { createdAt: { gte: last30d } } }),
  ]);

  // Per-key stats
  const keyStats = await prisma.apiKey.findMany({
    select: {
      id: true,
      name: true,
      domain: true,
      isActive: true,
      lastUsedAt: true,
      user: { select: { name: true } },
      _count: { select: { requests: true } },
    },
    orderBy: { requests: { _count: "desc" } },
  });

  // Requests by day (last 7 days)
  const dailyStats: { date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const count = await prisma.apiRequestLog.count({
      where: {
        createdAt: { gte: dayStart, lt: dayEnd },
      },
    });

    dailyStats.push({
      date: dayStart.toISOString().split("T")[0],
      count,
    });
  }

  // Top endpoints
  const recentLogs = await prisma.apiRequestLog.findMany({
    where: { createdAt: { gte: last7d } },
    select: { path: true },
  });

  const endpointCounts = new Map<string, number>();
  for (const log of recentLogs) {
    endpointCounts.set(log.path, (endpointCounts.get(log.path) || 0) + 1);
  }

  const topEndpoints = Array.from(endpointCounts.entries())
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return success({
    overview: {
      total,
      last24h: last24hCount,
      last7d: last7dCount,
      last30d: last30dCount,
    },
    keyStats: keyStats.map((k) => ({
      id: k.id,
      name: k.name,
      domain: k.domain,
      isActive: k.isActive,
      lastUsedAt: k.lastUsedAt,
      userName: k.user.name,
      totalRequests: k._count.requests,
    })),
    dailyStats,
    topEndpoints,
  });
}
