# Demanda Flow — Web

Frontend Next.js 14 (App Router) que consome a API do Demanda Flow.

## Stack

- **Next.js 14** com App Router e TypeScript
- **TailwindCSS** com paleta editorial customizada (ivory + burnt orange + ink)
- **Tipografia**: Instrument Serif (títulos), IBM Plex Sans (corpo), JetBrains Mono (técnico)
- **Lucide React** para ícones
- **Socket.IO Client** para notificações em tempo real

## Como rodar

Antes de tudo, **o backend precisa estar rodando** em `http://localhost:3000`. Veja o README dele.

```bash
# Configurar variáveis de ambiente
cp .env.local.example .env.local

# Instalar dependências
npm install

# Iniciar em modo dev
npm run dev
```

O site sobe em `http://localhost:3001` (o Next vai mudar a porta automaticamente porque o backend já usa 3000).

Se quiser forçar uma porta específica:
```bash
PORT=3001 npm run dev
```

## Login de teste

Os usuários são criados pelo `seed` do backend:

- **Admin:** `admin@demanda.flow` / `admin123`
- **Maria** (cadastros Tupi + PlugShare): `maria@demanda.flow` / `user123`
- **João** (mapas): `joao@demanda.flow` / `user123`
- **Ana** (precificação): `ana@demanda.flow` / `user123`

## Rotas

| Rota | Quem acessa | Conteúdo |
|---|---|---|
| `/login` | Público | Autenticação |
| `/inbox` | Usuário comum | Caixa de entrada com tarefas atribuídas |
| `/admin/dashboard` | Admin | KPIs, gargalos, carga por usuário |
| `/admin/demands` | Admin | Lista de demandas com progresso |
| `/admin/demands/new` | Admin | Builder visual de demanda + dependências |
| `/admin/users` | Admin | CRUD de usuários e atribuição de habilidades |
| `/admin/skills` | Admin | CRUD de habilidades |

## Estrutura

```
src/
├── app/
│   ├── layout.tsx          # Root com AuthProvider
│   ├── page.tsx            # Redirect baseado em role
│   ├── globals.css         # Tailwind + estilos base
│   ├── login/
│   ├── inbox/              # Tela do usuário
│   └── admin/
│       ├── dashboard/
│       ├── demands/
│       │   └── new/        # 🎨 Builder visual
│       ├── users/
│       └── skills/
├── components/
│   └── app-shell.tsx       # Sidebar + topbar + notificações
├── hooks/
│   └── use-notifications.ts
└── lib/
    ├── api.ts              # Cliente fetch com JWT
    └── auth.tsx            # AuthProvider + useAuth
```

## Aesthetic

A interface segue uma direção editorial: tipografia serifada nos títulos, generoso uso de espaço em branco, paleta tonal de ivory/cream com acentos em burnt orange. Detalhes inspirados em revistas impressas:

- `Instrument Serif` em italico para títulos principais
- `JetBrains Mono` em letterspacing alto para metadados técnicos
- Texturas suaves (grain) sobre cores sólidas
- Animações de entrada com `cubic-bezier(0.16, 1, 0.3, 1)`

## Build de produção

```bash
npm run build
npm run start
```

## Deploy

A forma mais simples é pela **Vercel**:

1. Suba esse diretório para um repositório no GitHub
2. Conecte o repositório na Vercel
3. Configure a variável `NEXT_PUBLIC_API_URL` com a URL pública do seu backend
4. Deploy automático

## Notas

- O socket WebSocket usa o mesmo host da API (`NEXT_PUBLIC_API_URL` sem o `/api/v1`).
- O token JWT fica em `localStorage`. Para produção considere migrar para cookies httpOnly via API route.
- A interface é responsiva mas otimizada para desktop (ferramenta de trabalho).
