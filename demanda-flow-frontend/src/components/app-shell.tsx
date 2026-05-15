'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Inbox,
  LayoutGrid,
  Users,
  Sparkles,
  ListTodo,
  Bell,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import { useNotifications } from '@/hooks/use-notifications';
import { api } from '@/lib/api';

const adminNav = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/admin/demands', label: 'Demandas', icon: ListTodo },
  { href: '/admin/users', label: 'Usuários', icon: Users },
  { href: '/admin/skills', label: 'Habilidades', icon: Sparkles },
];

const userNav = [{ href: '/inbox', label: 'Caixa de entrada', icon: Inbox }];

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();
  const [token, setToken] = useState<string | null>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const { items, unreadCount } = useNotifications(token);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setToken(localStorage.getItem('accessToken'));
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="font-serif italic text-ash">Carregando…</div>
      </div>
    );
  }

  const nav = user.role === 'ADMIN' ? adminNav : userNav;

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-ink text-ivory flex flex-col">
        <div className="p-6 border-b border-ivory/10">
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-1.5 bg-rust rounded-full animate-pulse" />
            <span className="font-serif text-2xl italic">Demanda Flow</span>
          </div>
          <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ivory/40 mt-1.5">
            {user.role === 'ADMIN' ? 'Administração' : 'Operação'}
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 relative group',
                  active
                    ? 'bg-ivory/5 text-ivory'
                    : 'text-ivory/60 hover:text-ivory hover:bg-ivory/5',
                )}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-rust" />
                )}
                <Icon size={16} strokeWidth={1.5} />
                <span>{item.label}</span>
                {active && (
                  <ChevronRight
                    size={14}
                    strokeWidth={1.5}
                    className="ml-auto text-rust"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ivory/10">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 bg-rust flex items-center justify-center text-xs font-medium">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{user.name}</div>
              <div className="text-[10px] font-mono text-ivory/40 truncate">
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="text-ivory/40 hover:text-rust-400 transition-colors"
              title="Sair"
            >
              <LogOut size={16} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b border-bone bg-ivory/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            {title && (
              <h1 className="font-serif text-2xl leading-none italic">{title}</h1>
            )}
            {subtitle && (
              <div className="text-[11px] font-mono uppercase tracking-[0.15em] text-ash mt-1">
                {subtitle}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setBellOpen((v) => !v)}
                className="relative w-10 h-10 flex items-center justify-center hover:bg-cream transition-colors"
              >
                <Bell size={16} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-rust rounded-full" />
                )}
              </button>

              {bellOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBellOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-96 bg-ivory border border-bone shadow-xl z-50 animate-fade-up">
                    <div className="p-4 border-b border-bone flex items-center justify-between">
                      <div>
                        <div className="font-serif text-lg">Notificações</div>
                        <div className="text-[11px] font-mono text-ash uppercase tracking-wider">
                          {unreadCount} não lidas
                        </div>
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api.post('/notifications/read-all');
                          } catch {}
                        }}
                        className="text-[11px] text-rust font-mono uppercase tracking-wider hover:underline"
                      >
                        Marcar todas
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                      {items.length === 0 ? (
                        <div className="p-8 text-center text-ash text-sm italic font-serif">
                          Nada por aqui ainda.
                        </div>
                      ) : (
                        items.map((n) => (
                          <div
                            key={n.id}
                            className={clsx(
                              'p-4 border-b border-bone last:border-b-0 hover:bg-cream/50 transition-colors',
                              !n.readAt && 'bg-rust-50/40',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={clsx(
                                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                                  n.readAt ? 'bg-bone' : 'bg-rust',
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-[10px] uppercase tracking-wider text-ash mb-1">
                                  {n.type.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm">
                                  {describe(n)}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-8 max-w-7xl w-full">{children}</main>
      </div>
    </div>
  );
}

function describe(n: { type: string; payload: any }) {
  switch (n.type) {
    case 'TASK_ASSIGNED':
      return n.payload?.unassignable
        ? 'Uma etapa não tem candidato com a habilidade necessária.'
        : 'Você recebeu uma nova tarefa.';
    case 'TASK_OVERDUE':
      return 'Uma tarefa está atrasada.';
    case 'DEPENDENCY_RELEASED':
      return 'Uma dependência foi liberada — nova etapa disponível.';
    case 'COMMENT_ADDED':
      return 'Novo comentário em uma das suas etapas.';
    case 'TASK_REASSIGNED':
      return 'Uma tarefa foi redistribuída para você.';
    default:
      return n.type;
  }
}
