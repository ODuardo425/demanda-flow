import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class SkillsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateSkillDto) {
    return this.prisma.skill.create({ data: dto });
  }

  findAll() {
    return this.prisma.skill.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const skill = await this.prisma.skill.findUnique({ where: { id } });
    if (!skill) throw new NotFoundException('Habilidade não encontrada');
    return skill;
  }

  update(id: string, dto: Partial<CreateSkillDto>) {
    return this.prisma.skill.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.prisma.skill.delete({ where: { id } });
    return { ok: true };
  }
}
