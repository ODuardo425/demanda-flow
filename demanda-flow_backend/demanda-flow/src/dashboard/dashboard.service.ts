import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [pendingTasks, demandsInProgress, overdueTasks, unassignable] =
      await Promise.all([
        this.prisma.step.count({
          where: { status: { in: ['AVAILABLE', 'ASSIGNED', 'IN_PROGRESS'] } },
        }),
        this.prisma.demand.count({ where: { status: 'IN_PROGRESS' } }),
        this.prisma.step.count({
          where: {
            deadline: { lt: new Date() },
            status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
          },
        }),
        this.prisma.step.count({ where: { status: 'UNASSIGNABLE' } }),
      ]);

    // Tempo médio de conclusão (horas) das etapas concluídas nos últimos 30 dias
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const avgRow = await this.prisma.$queryRawUnsafe<{ avg_h: number | null }[]>(
      `
      SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) / 3600)::float AS avg_h
      FROM steps
      WHERE status = 'COMPLETED'
        AND started_at IS NOT NULL
        AND completed_at IS NOT NULL
        AND completed_at >= $1
      `,
      since,
    );

    return {
      pendingTasks,
      demandsInProgress,
      overdueTasks,
      unassignable,
      avgCompletionHours: avgRow[0]?.avg_h ?? null,
    };
  }

  async workload() {
    return this.prisma.$queryRawUnsafe<
      { user_id: string; name: string; active_tasks: bigint; capacity: number }[]
    >(`
      SELECT u.id AS user_id,
             u.name,
             COUNT(s.id) FILTER (WHERE s.status IN ('ASSIGNED','IN_PROGRESS'))::bigint AS active_tasks,
             u.max_concurrent_tasks AS capacity
      FROM users u
      LEFT JOIN steps s ON s.assigned_to = u.id
      WHERE u.active = TRUE
      GROUP BY u.id
      ORDER BY active_tasks DESC
    `);
  }

  /**
   * Gargalos: etapas AVAILABLE há mais tempo (não conseguindo virar ASSIGNED rápido)
   * + etapas UNASSIGNABLE (ninguém com a habilidade).
   */
  async bottlenecks() {
    const stuck = await this.prisma.step.findMany({
      where: { status: { in: ['AVAILABLE', 'UNASSIGNABLE'] } },
      include: {
        demand: { select: { id: true, title: true } },
        requiredSkills: { include: { skill: true } },
      },
      orderBy: { createdAt: 'asc' },
      take: 50,
    });
    return stuck;
  }
}
