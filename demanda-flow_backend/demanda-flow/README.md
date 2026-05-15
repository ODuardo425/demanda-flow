# Demanda Flow

Sistema de gerenciamento de demandas com **distribuição automática de tarefas** baseada nas habilidades dos usuários, com **motor de dependências** entre etapas (DAG).

Stack: NestJS · Prisma · PostgreSQL · BullMQ (Redis) · Socket.IO · JWT.

---

## Como rodar

### 1. Pré-requisitos
- Node.js 20+
- Docker + docker-compose (para Postgres e Redis locais)
- npm ou pnpm

### 2. Setup
```bash
# Subir Postgres e Redis
docker-compose up -d

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Gerar client do Prisma e aplicar migrations
npx prisma migrate dev --name init

# Popular o banco com dados de exemplo
npm run prisma:seed

# Iniciar a API em modo dev
npm run start:dev
```

A API sobe em `http://localhost:3000/api/v1`.

### 3. Login de teste
- **Admin:** `admin@demanda.flow` / `admin123`
- **Usuários:** `maria@demanda.flow`, `joao@demanda.flow`, `ana@demanda.flow` — senha `user123`

---

## Estrutura

```
src/
├── auth/            # JWT, guards de role, login/refresh
├── users/           # CRUD de usuários (admin) + atribuição de habilidades
├── skills/          # CRUD de habilidades
├── demands/         # Criar demanda com etapas + dependências (transação)
├── steps/           # Inbox do usuário, start/complete/comentários
├── assignment/      # 🧠 Motor de atribuição automática
├── workflow/        # 🔀 Motor de propagação de dependências
├── notifications/   # Persistência, WebSocket gateway e fila
├── dashboard/       # KPIs admin (gargalos, carga, tempo médio)
├── common/          # Enums, filtros, utilitários
└── prisma/          # PrismaService global
```

---

## Fluxo end-to-end

1. **Admin cria uma demanda** via `POST /demands` com etapas e dependências entre elas.
2. Cada etapa nasce **BLOCKED**. O service detecta as etapas raiz (sem dependência) e enfileira `release-root-steps` na fila `assignment`.
3. O **AssignmentProcessor** vira as etapas raiz para **AVAILABLE**, depois roda o algoritmo:
   - Busca usuários ativos com a(s) habilidade(s) (modo `ANY` ou `ALL`)
   - Filtra os que ainda têm capacidade (`max_concurrent_tasks`)
   - Escolhe quem tem menor carga atual, desempatando por maior proficiência média e aleatório (jitter)
   - Marca a etapa como **ASSIGNED** e enfileira notificação
4. **Usuário vê a tarefa** na sua inbox (`GET /me/tasks`), recebe push via WebSocket (`/ws`) e marca como concluída via `POST /steps/:id/complete`.
5. O **WorkflowProcessor** consome `step-completed`:
   - Acha todas as etapas que dependiam dela
   - Para cada uma, verifica se **todas** as suas dependências estão concluídas
   - Se sim, marca **AVAILABLE** e enfileira novo `assign-step`
   - Se a demanda inteira concluiu, fecha a demanda automaticamente

---

## Endpoints principais

### Autenticação
```
POST   /api/v1/auth/login           body: { email, password }
POST   /api/v1/auth/refresh         body: { refreshToken }
GET    /api/v1/auth/me              header: Bearer <token>
```

### Admin — Usuários e habilidades
```
GET    /api/v1/users
POST   /api/v1/users                body: { name, email, password, role, skillIds[] }
PATCH  /api/v1/users/:id
PUT    /api/v1/users/:id/skills     body: { skillIds: [...] }
DELETE /api/v1/users/:id

GET    /api/v1/skills
POST   /api/v1/skills               body: { name, category, description }
PATCH  /api/v1/skills/:id
DELETE /api/v1/skills/:id
```

### Admin — Demandas
```
POST   /api/v1/demands
GET    /api/v1/demands?status=&priority=
GET    /api/v1/demands/:id
DELETE /api/v1/demands/:id

GET    /api/v1/dashboard/summary
GET    /api/v1/dashboard/workload
GET    /api/v1/dashboard/bottlenecks
```

### Usuário — Inbox e ações
```
GET    /api/v1/me/tasks?status=
POST   /api/v1/steps/:id/start
POST   /api/v1/steps/:id/complete
POST   /api/v1/steps/:id/reassign       body: { userId }   (somente admin)
POST   /api/v1/steps/:id/comments       body: { content }
GET    /api/v1/steps/:id/comments

GET    /api/v1/me/notifications?unread=true
PATCH  /api/v1/notifications/:id/read
POST   /api/v1/notifications/read-all
```

### WebSocket
```
URL:        ws://localhost:3000/ws
Auth:       auth: { token: "<jwt>" }  ou  header Authorization
Eventos:    notification.created   payload: <Notification>
```

---

## Exemplo: criar uma demanda completa

```http
POST /api/v1/demands
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "title": "Comissionamento — Estação Centro",
  "priority": 2,
  "deadline": "2025-06-30T18:00:00.000Z",
  "steps": [
    {
      "orderIndex": 1,
      "name": "Cadastro na Tupi",
      "requiredSkillIds": ["<id-da-skill-acesso-tupi>"],
      "matchMode": "ANY"
    },
    {
      "orderIndex": 2,
      "name": "Cadastro no PlugShare",
      "requiredSkillIds": ["<id-plugshare>"]
    },
    {
      "orderIndex": 3,
      "name": "Cadastro nos mapas",
      "requiredSkillIds": ["<id-gmaps>", "<id-waze>", "<id-maps>"],
      "matchMode": "ANY"
    },
    {
      "orderIndex": 4,
      "name": "Precificação",
      "requiredSkillIds": ["<id-precificacao>"],
      "dependsOnIndices": [1, 2, 3]
    }
  ]
}
```

Resultado: etapas 1, 2, 3 viram `AVAILABLE` e são atribuídas automaticamente em paralelo. A etapa 4 fica `BLOCKED` até as três anteriores concluírem.

---

## Modelo de estados (Step)

```
BLOCKED ──► AVAILABLE ──► ASSIGNED ──► IN_PROGRESS ──► COMPLETED
                │                                    
                └──► UNASSIGNABLE (ninguém com a habilidade)
```

`CANCELLED` é alcançável de qualquer estado pelo admin.

---

## Próximos passos sugeridos

- **Migrations versionadas**: rodar `npx prisma migrate dev --name <descrição>` para cada alteração de schema.
- **Cron de prazos**: agendar `sweep-overdue` periódico na fila `workflow` (ex.: a cada hora via `BullMQ Schedulers`).
- **Auditoria**: hookar middleware no Prisma que grava em `audit_log` toda mudança em `Step`, `Demand` e `User`.
- **Templates de demanda**: tabela `demand_templates` espelhando `demands+steps+dependencies`, com endpoint para instanciar.
- **Tests**: começar pelos casos do `WorkflowService` (DAG, ciclos, liberação parcial) e `AssignmentService` (sem candidato, com empate, com capacidade saturada).
- **Frontend**: Next.js + shadcn/ui consumindo essa API. Caixa de entrada, dashboard admin e criação de demandas com builder visual de etapas/dependências.

---

## Licença
MIT
