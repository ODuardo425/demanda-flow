import { Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateUserDto) {
    const passwordHash = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role ?? 'USER',
        active: dto.active ?? true,
        maxConcurrentTasks: dto.maxConcurrentTasks ?? 10,
        skills: dto.skillIds
          ? { create: dto.skillIds.map((skillId) => ({ skillId })) }
          : undefined,
      },
      include: { skills: { include: { skill: true } } },
    });
    return this.sanitize(user);
  }

  async findAll() {
    const users = await this.prisma.user.findMany({
      include: { skills: { include: { skill: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((u) => this.sanitize(u));
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { skills: { include: { skill: true } } },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    return this.sanitize(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    const data: any = {
      name: dto.name,
      email: dto.email,
      role: dto.role,
      active: dto.active,
      maxConcurrentTasks: dto.maxConcurrentTasks,
    };
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.update({
      where: { id },
      data,
      include: { skills: { include: { skill: true } } },
    });
    return this.sanitize(user);
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }

  async setSkills(userId: string, skillIds: string[]) {
    await this.prisma.userSkill.deleteMany({ where: { userId } });
    await this.prisma.userSkill.createMany({
      data: skillIds.map((skillId) => ({ userId, skillId })),
      skipDuplicates: true,
    });
    return this.findOne(userId);
  }

  private sanitize(user: any) {
    const { passwordHash, ...rest } = user;
    return rest;
  }
}
