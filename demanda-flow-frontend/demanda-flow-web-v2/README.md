# Demanda Flow — Web (v2)

Frontend Next.js 14 (App Router) com identidade visual **tech / EV charging**.

## Identidade visual

Direção estética inspirada em empresas de infraestrutura de carregamento de veículos elétricos:

- **Cor de marca:** Verde elétrico `#10B981` (rust no código por compatibilidade)
- **Acento elétrico:** Verde-lima `#A3E635` (volt)
- **Dark surface:** Verde-petróleo profundo `#0F1F1A` (forest)
- **Backgrounds:** Off-white frio (`#FAFBFA`) com cards `#FFFFFF`
- **Tipografia display:** [Sora](https://fonts.google.com/specimen/Sora) — sans geométrica moderna
- **Tipografia body:** [Manrope](https://fonts.google.com/specimen/Manrope) — humanista limpa
- **Tipografia técnica:** JetBrains Mono — IDs, métricas, status

### Elementos visuais característicos
- Ícone de raio (Zap) como logo + bolinha verde-lima pulsante
- Padrão de grid sutil em backgrounds escuros
- Glow effects em elementos ativos (`shadow-glow`)
- Animação `charge` deslizando em tasks em execução
- Cards com sombras suaves e bordas finas
- Chips arredondados (`pill-shaped`) para metadados

## Stack

- Next.js 14 (App Router) + TypeScript
- TailwindCSS com tokens customizados
- Lucide React (ícones)
- Socket.IO Client (notificações ao vivo)

## Como rodar

Antes: backend deve estar rodando em `http://localhost:3000` (veja README do `demanda-flow`).

```bash
cp .env.local.example .env.local
npm install
npm run dev
```

O Next vai detectar que a porta 3000 já está ocupada e perguntar se pode usar 3001. Aceite com `Y`.

Acesse: **http://localhost:3001**

## Login de teste

- **Admin:** `admin@demanda.flow` / `admin123` → Dashboard
- **Maria** (Tupi + PlugShare): `maria@demanda.flow` / `user123` → Inbox
- **João** (mapas): `joao@demanda.flow` / `user123` → Inbox
- **Ana** (precificação): `ana@demanda.flow` / `user123` → Inbox

## Telas

| Rota | Quem acessa | Visual |
|---|---|---|
| `/login` | Público | Hero dark com grid pattern, glow verde, linhas de energia |
| `/inbox` | Usuário | Cards com indicador de prioridade, charging bar em tarefas ativas |
| `/admin/dashboard` | Admin | KPIs com ícones temáticos + hero card "throughput" estilo equipamento |
| `/admin/demands` | Admin | Lista de demandas com barra de progresso |
| `/admin/demands/new` | Admin | Builder visual com seleção de habilidades em pills + grafo de dependências |
| `/admin/users` | Admin | Tabela com avatares circulares e pills de habilidade |
| `/admin/skills` | Admin | Grid de cards |

## Estrutura

```
src/
├── app/
│   ├── layout.tsx          # Root com AuthProvider
│   ├── page.tsx            # Redirect baseado em role
│   ├── globals.css         # Design system base
│   ├── login/              # Hero EV + form
│   ├── inbox/              # Usuário comum
│   └── admin/
│       ├── dashboard/
│       ├── demands/{,new}/
│       ├── users/
│       └── skills/
├── components/
│   └── app-shell.tsx       # Sidebar dark + topbar com sino
├── hooks/
│   └── use-notifications.ts
└── lib/
    ├── api.ts              # Cliente fetch + JWT
    └── auth.tsx            # AuthProvider
```

## Build de produção

```bash
npm run build
npm start
```

## Deploy

**Vercel** é o caminho mais simples — empurre para um repositório, conecte na Vercel, e configure:

```
NEXT_PUBLIC_API_URL = https://sua-api.com/api/v1
```

## Customizando cores

Toda a paleta vive em `tailwind.config.ts`. As cores chave:

- `rust-*` (paleta verde elétrico) — cor primária do sistema
- `volt`, `volt-500`, `volt-600` (verde-lima vibrante) — acentos
- `forest`, `forest-700`, `forest-900` (verde-petróleo) — backgrounds dark

Para trocar a cor de marca, basta editar `rust.DEFAULT` no Tailwind config — todo o app vai herdar.

## Notas técnicas

- WebSocket usa o mesmo host da API (`NEXT_PUBLIC_API_URL` sem o `/api/v1`).
- JWT fica em `localStorage`. Para produção considere cookies httpOnly.
- Sora foi escolhida em vez de Inter/Space Grotesk pra ter mais personalidade visual.
- O `shadow-glow` usa box-shadow com transparência verde — não funciona em IE11 (não é alvo).
