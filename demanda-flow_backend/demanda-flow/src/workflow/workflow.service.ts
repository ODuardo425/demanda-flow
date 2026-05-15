import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WorkflowService {
  private readonly logger = new Logger(WorkflowService.name);

  constructor(
    private prisma: PrismaService,
    @InjectQueue('assignment') private assignmentQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  /**
   * Chamado quando uma etapa é marcada como COMPLETED.
   *
   * Para cada etapa que dependia desta, verifica se TODAS as dependências
   * dela já estão COMPLETED. Se sim, libera (AVAILABLE) e enfileira atribuição.
   *
   * Também fecha a demanda automaticamente se todas as etapas estiverem concluídas.
   */
  async onStepCompleted(stepId: string) {
    const step = await this.prisma.step.findUnique({ where: { id: stepId } });
    if (!step || step.status !== 'COMPLETED') return;

    // 1. Quem dependia desta etapa?
    const dependents = await this.prisma.stepDependency.findMany({
      where: { dependsOnStepId: stepId },
      select: { stepId: true },
    });

    for (const { stepId: depStepId } of dependents) {
      // Existe alguma dependência ainda não concluída?
      const pending = await this.prisma.$queryRawUnsafe<{ cnt: bigint }[]>(
        `
        SELECT COUNT(*)::bigint AS cnt
        FROM step_dependencies sd
        JOIN steps s ON s.id = sd.depends_on_step_id
        WHERE sd.step_id = $1
          AND s.status <> 'COMPLETED'
        `,
        depStepId,
      );

      if (pending[0].cnt === 0n) {
        const updated = await this.prisma.step.update({
          where: { id: depStepId },
          data: { status: 'AVAILABLE' },
        });
        this.logger.log(`Step ${depStepId} liberado (dependências satisfeitas)`);
        await this.assignmentQueue.add('assign-step', { stepId: updated.id });
      }
    }

    // 2. Demanda pode ser fechada?
    const remaining = await this.prisma.step.count({
      where: {
        demandId: step.demandId,
        status: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (remaining === 0) {
      await this.prisma.demand.update({
        where: { id: step.demandId },
        data: { status: 'COMPLETED', completedAt: new Date() },
      });
      this.logger.log(`Demanda ${step.demandId} concluída automaticamente`);
    } else {
      // Garantir que a demanda esteja em IN_PROGRESS
      await this.prisma.demand.updateMany({
        where: { id: step.demandId, status: 'OPEN' },
        data: { status: 'IN_PROGRESS' },
      });
    }
  }

  /**
   * Cron: marca etapas atrasadas e notifica.
   */
  async sweepOverdueSteps() {
    const overdue = await this.prisma.step.findMany({
      where: {
        deadline: { lt: new Date() },
        status: { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      select: { id: true, assignedToId: true },
    });

    for (const s of overdue) {
      if (!s.assignedToId) continue;
      await this.notificationsQueue.add('notify', {
        userId: s.assignedToId,
        type: 'TASK_OVERDUE',
        payload: { stepId: s.id },
      });
    }
    this.logger.log(`Sweep de atraso: ${overdue.length} etapas notificadas`);
  }
}
