import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDemandDto } from './dto/create-demand.dto';

@Injectable()
export class DemandsService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('assignment') private assignmentQueue: Queue,
  ) {}

  async create(dto: CreateDemandDto, createdById: string) {
    // 1. Validar índices únicos e dependências
    const indices = dto.steps.map((s) => s.orderIndex);
    if (new Set(indices).size !== indices.length) {
      throw new BadRequestException('orderIndex das etapas deve ser único');
    }
    const indexSet = new Set(indices);
    for (const s of dto.steps) {
      for (const dep of s.dependsOnIndices ?? []) {
        if (!indexSet.has(dep)) {
          throw new BadRequestException(
            `Etapa ${s.orderIndex} depende de índice ${dep} que não existe`,
          );
        }
        if (dep === s.orderIndex) {
          throw new BadRequestException(`Etapa ${s.orderIndex} não pode depender de si mesma`);
        }
      }
    }
    this.assertNoCycles(dto.steps);

    // 2. Criar tudo em uma transação
    const demand = await this.prisma.$transaction(async (tx) => {
      const created = await tx.demand.create({
        data: {
          title: dto.title,
          description: dto.description,
          priority: dto.priority ?? 3,
          deadline: dto.deadline ? new Date(dto.deadline) : null,
          createdById,
        },
      });

      // Mapa orderIndex -> stepId real
      const idByIndex = new Map<number, string>();

      for (const s of dto.steps) {
        const step = await tx.step.create({
          data: {
            demandId: created.id,
            name: s.name,
            description: s.description,
            orderIndex: s.orderIndex,
            matchMode: s.matchMode ?? 'ANY',
            deadline: s.deadline ? new Date(s.deadline) : null,
            expectedDurationHours: s.expectedDurationHours,
            // status fica BLOCKED por padrão; o workflow vai liberar etapas raiz
            requiredSkills: {
              create: s.requiredSkillIds.map((skillId) => ({ skillId })),
            },
          },
        });
        idByIndex.set(s.orderIndex, step.id);
      }

      // Criar dependências
      for (const s of dto.steps) {
        for (const depIdx of s.dependsOnIndices ?? []) {
          await tx.stepDependency.create({
            data: {
              stepId: idByIndex.get(s.orderIndex)!,
              dependsOnStepId: idByIndex.get(depIdx)!,
            },
          });
        }
      }

      return created;
    });

    // 3. Liberar etapas raiz (sem dependências) — disparar workflow
    await this.assignmentQueue.add('release-root-steps', { demandId: demand.id });

    return this.findOne(demand.id);
  }

  findAll(filters: { status?: string; priority?: number } = {}) {
    return this.prisma.demand.findMany({
      where: {
        status: filters.status as any,
        priority: filters.priority,
      },
      include: { steps: { include: { requiredSkills: true, assignedTo: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const demand = await this.prisma.demand.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        steps: {
          include: {
            requiredSkills: { include: { skill: true } },
            assignedTo: { select: { id: true, name: true, email: true } },
            dependencies: true,
            comments: true,
          },
          orderBy: { orderIndex: 'asc' },
        },
      },
    });
    if (!demand) throw new NotFoundException('Demanda não encontrada');
    return demand;
  }

  async remove(id: string) {
    await this.prisma.demand.delete({ where: { id } });
    return { ok: true };
  }

  // Detecção de ciclos via DFS no payload
  private assertNoCycles(steps: { orderIndex: number; dependsOnIndices?: number[] }[]) {
    const graph = new Map<number, number[]>();
    for (const s of steps) graph.set(s.orderIndex, s.dependsOnIndices ?? []);

    const WHITE = 0, GRAY = 1, BLACK = 2;
    const color = new Map<number, number>();
    for (const s of steps) color.set(s.orderIndex, WHITE);

    const dfs = (node: number): boolean => {
      color.set(node, GRAY);
      for (const next of graph.get(node) ?? []) {
        if (color.get(next) === GRAY) return true;
        if (color.get(next) === WHITE && dfs(next)) return true;
      }
      color.set(node, BLACK);
      return false;
    };

    for (const s of steps) {
      if (color.get(s.orderIndex) === WHITE && dfs(s.orderIndex)) {
        throw new BadRequestException('O grafo de dependências contém ciclos');
      }
    }
  }
}
