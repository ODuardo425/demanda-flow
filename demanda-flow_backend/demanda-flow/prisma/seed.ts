import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // ----------------------------------------------------------
  // 1. Habilidades
  // ----------------------------------------------------------
  const skillNames = [
    'Acesso Tupi',
    'PlugShare',
    'Google Maps',
    'Waze',
    'Maps',
    'Precificação',
  ];

  const skills: Record<string, { id: string }> = {};
  for (const name of skillNames) {
    const s = await prisma.skill.upsert({
      where: { name },
      update: {},
      create: { name, category: 'Comissionamento' },
    });
    skills[name] = s;
  }
  console.log(`✔ ${skillNames.length} habilidades criadas`);

  // ----------------------------------------------------------
  // 2. Usuários
  // ----------------------------------------------------------
  const adminPass = await bcrypt.hash('admin123', 10);
  const userPass = await bcrypt.hash('user123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demanda.flow' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@demanda.flow',
      passwordHash: adminPass,
      role: Role.ADMIN,
    },
  });

  // Maria — habilidades de cadastro Tupi e PlugShare
  const maria = await prisma.user.upsert({
    where: { email: 'maria@demanda.flow' },
    update: {},
    create: {
      name: 'Maria Cadastro',
      email: 'maria@demanda.flow',
      passwordHash: userPass,
      role: Role.USER,
      skills: {
        create: [
          { skillId: skills['Acesso Tupi'].id, proficiency: 5 },
          { skillId: skills['PlugShare'].id, proficiency: 4 },
        ],
      },
    },
  });

  // João — habilidades de mapas
  const joao = await prisma.user.upsert({
    where: { email: 'joao@demanda.flow' },
    update: {},
    create: {
      name: 'João Mapas',
      email: 'joao@demanda.flow',
      passwordHash: userPass,
      role: Role.USER,
      skills: {
        create: [
          { skillId: skills['Google Maps'].id, proficiency: 4 },
          { skillId: skills['Waze'].id, proficiency: 4 },
          { skillId: skills['Maps'].id, proficiency: 3 },
        ],
      },
    },
  });

  // Ana — precificação
  const ana = await prisma.user.upsert({
    where: { email: 'ana@demanda.flow' },
    update: {},
    create: {
      name: 'Ana Preços',
      email: 'ana@demanda.flow',
      passwordHash: userPass,
      role: Role.USER,
      skills: {
        create: [{ skillId: skills['Precificação'].id, proficiency: 5 }],
      },
    },
  });

  console.log(`✔ Admin: ${admin.email} / admin123`);
  console.log(`✔ Usuários: ${maria.email}, ${joao.email}, ${ana.email} / user123`);

  // ----------------------------------------------------------
  // 3. Demanda de exemplo: Comissionamento de estação
  // ----------------------------------------------------------
  const existing = await prisma.demand.findFirst({
    where: { title: 'Comissionamento de estação — Posto Exemplo' },
  });
  if (existing) {
    console.log('ℹ Demanda de exemplo já existe, pulando.');
    return;
  }

  const demand = await prisma.demand.create({
    data: {
      title: 'Comissionamento de estação — Posto Exemplo',
      description: 'Demanda de demonstração para validar o motor de workflow',
      priority: 3,
      createdById: admin.id,
    },
  });

  // Etapas
  const tupi = await prisma.step.create({
    data: {
      demandId: demand.id,
      name: 'Cadastro da estação na Tupi',
      orderIndex: 1,
      matchMode: 'ANY',
      requiredSkills: { create: [{ skillId: skills['Acesso Tupi'].id }] },
    },
  });

  const plugshare = await prisma.step.create({
    data: {
      demandId: demand.id,
      name: 'Cadastro no PlugShare',
      orderIndex: 2,
      matchMode: 'ANY',
      requiredSkills: { create: [{ skillId: skills['PlugShare'].id }] },
    },
  });

  const mapas = await prisma.step.create({
    data: {
      demandId: demand.id,
      name: 'Cadastro nos mapas',
      orderIndex: 3,
      matchMode: 'ANY', // basta um (Google, Waze ou Maps)
      requiredSkills: {
        create: [
          { skillId: skills['Google Maps'].id },
          { skillId: skills['Waze'].id },
          { skillId: skills['Maps'].id },
        ],
      },
    },
  });

  const precificacao = await prisma.step.create({
    data: {
      demandId: demand.id,
      name: 'Precificação da estação',
      orderIndex: 4,
      matchMode: 'ANY',
      requiredSkills: { create: [{ skillId: skills['Precificação'].id }] },
    },
  });

  // Dependências: precificação depende das três anteriores
  await prisma.stepDependency.createMany({
    data: [
      { stepId: precificacao.id, dependsOnStepId: tupi.id },
      { stepId: precificacao.id, dependsOnStepId: plugshare.id },
      { stepId: precificacao.id, dependsOnStepId: mapas.id },
    ],
  });

  console.log(`✔ Demanda "${demand.title}" criada com 4 etapas`);
  console.log('');
  console.log('💡 Para liberar as etapas raiz, faça login como admin e use a API');
  console.log('   POST /demands (com novas demandas) — o seed cria etapas BLOCKED.');
  console.log('   Ou rode manualmente: SELECT enfileirar release-root-steps via fila.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
