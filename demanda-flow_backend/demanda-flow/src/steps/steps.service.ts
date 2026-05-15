import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AuthUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class StepsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('assignment') private assignmentQueue: Queue,
    @InjectQueue('workflow') private workflowQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async inbox(userId: string, filters: { status?: string } = {}) {
    return this.prisma.step.findMany({
      where: {
        assignedToId: userId,
        status: filters.status
          ? (filters.status as any)
          : { in: ['ASSIGNED', 'IN_PROGRESS'] },
      },
      include: {
        demand: { select: { id: true, title: true, priority: true, deadline: true } },
        requiredSkills: { include: { skill: true } },
      },
      orderBy: [{ deadline: 'asc' }, { assignedAt: 'asc' }],
    });
  }

  async start(stepId: string, user: AuthUser) {
    const step = await this.requireStep(stepId);
    if (step.assignedToId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Esta etapa não está atribuída a você');
    }
    if (step.status !== 'ASSIGNED') {
      throw new BadRequestException(`Não é possível iniciar etapa no status ${step.status}`);
    }
    return this.prisma.step.update({
      where: { id: stepId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });
  }

  async complete(stepId: string, user: AuthUser) {
    const step = await this.requireStep(stepId);
    if (step.assignedToId !== user.id && user.role !== 'ADMIN') {
      throw new ForbiddenException('Esta etapa não está atribuída a você');
    }
    if (!['ASSIGNED', 'IN_PROGRESS'].includes(step.status)) {
      throw new BadRequestException(`Não é possível concluir etapa no status ${step.status}`);
    }

    const updated = await this.prisma.step.update({
      where: { id: stepId },
      data: { status: 'COMPLETED', completedAt: new Date() },
    });

    // Disparar workflow: liberar dependentes
    await this.workflowQueue.add('step-completed', { stepId });
    return updated;
  }

  async reassign(stepId: string, newUserId: string, actor: AuthUser) {
    if (actor.role !== 'ADMIN') throw new ForbiddenException();
    const step = await this.requireStep(stepId);
    if (['COMPLETED', 'CANCELLED'].includes(step.status)) {
      throw new BadRequestException('Etapa já finalizada');
    }
    const updated = await this.prisma.step.update({
      where: { id: stepId },
      data: { assignedToId: newUserId, status: 'ASSIGNED', assignedAt: new Date() },
    });
    await this.notificationsQueue.add('notify', {
      userId: newUserId,
      type: 'TASK_REASSIGNED',
      payload: { stepId, by: actor.id },
    });
    return updated;
  }

  async addComment(stepId: string, content: string, user: AuthUser) {
    await this.requireStep(stepId);
    const comment = await this.prisma.stepComment.create({
      data: { stepId, userId: user.id, content },
    });

    // Notificar o responsável (se não for o próprio comentarista)
    const step = await this.prisma.step.findUnique({ where: { id: stepId } });
    if (step?.assignedToId && step.assignedToId !== user.id) {
      await this.notificationsQueue.add('notify', {
        userId: step.assignedToId,
        type: 'COMMENT_ADDED',
        payload: { stepId, by: user.id },
      });
    }
    return comment;
  }

  async listComments(stepId: string) {
    await this.requireStep(stepId);
    return this.prisma.stepComment.findMany({
      where: { stepId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  private async requireStep(id: string) {
    const step = await this.prisma.step.findUnique({ where: { id } });
    if (!step) throw new NotFoundException('Etapa não encontrada');
    return step;
  }
}
