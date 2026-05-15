import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AssignmentService {
  private readonly logger = new Logger(AssignmentService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  /**
   * Atribui uma etapa ao melhor candidato.
   *
   * Algoritmo:
   *  1. Buscar usuários ativos com a(s) habilidade(s) necessária(s)
   *     - ANY: pelo menos 1 habilidade
   *     - ALL: todas as habilidades
   *  2. Filtrar quem está abaixo do max_concurrent_tasks
   *  3. Ordenar por: menor carga atual → maior proficiência média → aleatório (jitter)
   *  4. Atribuir e notificar
   */
  async assign(stepId: string) {
    const step = await this.prisma.step.findUnique({
      where: { id: stepId },
      include: { requiredSkills: true },
    });

    if (!step) {
      this.logger.warn(`Step ${stepId} não encontrado`);
      return;
    }
    if (step.status !== 'AVAILABLE') {
      this.logger.debug(`Step ${stepId} não está AVAILABLE (status=${step.status}), pulando`);
      return;
    }

    const skillIds = step.requiredSkills.map((s) => s.skillId);
    if (skillIds.length === 0) {
      this.logger.warn(`Step ${stepId} sem habilidades requeridas`);
      return;
    }

    const havingClause =
      step.matchMode === 'ALL'
        ? `HAVING COUNT(DISTINCT us.skill_id) = ${skillIds.length}`
        : 'HAVING COUNT(DISTINCT us.skill_id) >= 1';

    // Query nativa pela facilidade de combinar agregações e filtros
    const candidates = await this.prisma.$queryRawUnsafe<
      { id: string; load: bigint; avg_prof: number | null }[]
    >(
      `
      WITH active_load AS (
        SELECT assigned_to AS uid, COUNT(*)::bigint AS load
        FROM steps
        WHERE assigned_to IS NOT NULL AND status IN ('ASSIGNED','IN_PROGRESS')
        GROUP BY assigned_to
      )
      SELECT u.id,
             COALESCE(al.load, 0) AS load,
             AVG(us.proficiency)::float AS avg_prof
      FROM users u
      JOIN user_skills us ON us.user_id = u.id
      LEFT JOIN active_load al ON al.uid = u.id
      WHERE u.active = TRUE
        AND us.skill_id = ANY($1::uuid[])
        AND (us.expires_at IS NULL OR us.expires_at > NOW())
        AND COALESCE(al.load, 0) < u.max_concurrent_tasks
      GROUP BY u.id, al.load
      ${havingClause}
      ORDER BY load ASC, avg_prof DESC, random()
      LIMIT 1
      `,
      skillIds,
    );

    if (candidates.length === 0) {
      this.logger.warn(`Nenhum candidato para step ${stepId}`);
      await this.prisma.step.update({
        where: { id: stepId },
        data: { status: 'UNASSIGNABLE' },
      });
      // Notificar admins
      const admins = await this.prisma.user.findMany({
        where: { role: 'ADMIN', active: true },
        select: { id: true },
      });
      for (const a of admins) {
        await this.notificationsQueue.add('notify', {
          userId: a.id,
          type: 'TASK_ASSIGNED',
          payload: { stepId, unassignable: true },
        });
      }
      return;
    }

    const chosen = candidates[0];
    await this.prisma.step.update({
      where: { id: stepId },
      data: {
        assignedToId: chosen.id,
        status: 'ASSIGNED',
        assignedAt: new Date(),
      },
    });

    await this.notificationsQueue.add('notify', {
      userId: chosen.id,
      type: 'TASK_ASSIGNED',
      payload: { stepId },
    });

    this.logger.log(`Step ${stepId} atribuído a usuário ${chosen.id} (carga ${chosen.load})`);
  }

  /**
   * Libera as etapas-raiz de uma demanda (as que não têm dependência alguma).
   * É chamado logo após a criação da demanda.
   */
  async releaseRootSteps(demandId: string) {
    const roots = await this.prisma.$queryRawUnsafe<{ id: string }[]>(
      `
      SELECT s.id
      FROM steps s
      LEFT JOIN step_dependencies d ON d.step_id = s.id
      WHERE s.demand_id = $1
        AND s.status = 'BLOCKED'
        AND d.step_id IS NULL
      `,
      demandId,
    );

    for (const r of roots) {
      await this.prisma.step.update({
        where: { id: r.id },
        data: { status: 'AVAILABLE' },
      });
      await this.assign(r.id);
    }
  }
}
