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
  Zap,
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
        <div className="display text-ash">Carregando…</div>
      </div>
    );
  }

  const nav = user.role === 'ADMIN' ? adminNav : userNav;

  return (
    <div className="min-h-screen flex bg-cream/40">
      {/* Sidebar */}
      <aside className="w-64 bg-forest text-ivory flex flex-col relative overflow-hidden">
        {/* Glow decorativo */}
        <div className="absolute -top-20 -left-20 w-64 h-64 bg-rust/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative p-6 border-b border-ivory/5">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 bg-rust rounded-md flex items-center justify-center shadow-glow">
                <Zap
                  size={18}
                  className="text-forest"
                  fill="currentColor"
                  strokeWidth={0}
                />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-volt rounded-full animate-pulse-glow" />
            </div>
            <div>
              <div className="display text-lg leading-none">Demanda Flow</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ivory/40 mt-1">
                {user.role === 'ADMIN' ? 'Admin Panel' : 'Operator'}
              </div>
            </div>
          </div>
        </div>

        <nav className="relative flex-1 p-3 space-y-1">
          {nav.map((item) => {
            const active = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-200 relative rounded-md group',
                  active
                    ? 'bg-rust/15 text-ivory shadow-soft'
                    : 'text-ivory/60 hover:text-ivory hover:bg-ivory/5',
                )}
              >
                {active && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-volt rounded-full" />
                )}
                <Icon
                  size={16}
                  strokeWidth={active ? 2 : 1.5}
                  className={active ? 'text-rust' : ''}
                />
                <span className="font-medium">{item.label}</span>
                {active && (
                  <ChevronRight
                    size={14}
                    strokeWidth={1.5}
                    className="ml-auto text-volt"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="relative p-3 border-t border-ivory/5">
          <div className="flex items-center gap-3 px-3 py-2 rounded-md">
            <div className="w-8 h-8 bg-rust/20 border border-rust/30 rounded-md flex items-center justify-center text-xs font-bold text-rust">
              {user.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate font-medium">{user.name}</div>
              <div className="text-[10px] font-mono text-ivory/40 truncate">
                {user.email}
              </div>
            </div>
            <button
              onClick={logout}
              className="text-ivory/40 hover:text-rust transition-colors"
              title="Sair"
            >
              <LogOut size={15} strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </aside>

      {/* Conteúdo */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="h-16 border-b border-bone bg-ivory/90 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30">
          <div>
            {title && (
              <h1 className="display text-2xl leading-none">{title}</h1>
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
                className="relative w-10 h-10 flex items-center justify-center hover:bg-cream rounded-md transition-colors"
              >
                <Bell size={16} strokeWidth={1.5} />
                {unreadCount > 0 && (
                  <div className="absolute top-2 right-2 min-w-[14px] h-[14px] px-1 bg-rust text-ivory text-[9px] font-bold rounded-full flex items-center justify-center shadow-glow">
                    {unreadCount}
                  </div>
                )}
              </button>

              {bellOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setBellOpen(false)}
                  />
                  <div className="absolute right-0 top-12 w-96 bg-ivory border border-bone rounded-lg shadow-lift z-50 animate-fade-up overflow-hidden">
                    <div className="p-4 border-b border-bone flex items-center justify-between bg-cream/50">
                      <div>
                        <div className="display text-base">Notificações</div>
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
                        className="text-[11px] text-rust font-semibold uppercase tracking-wider hover:text-rust-700"
                      >
                        Marcar todas
                      </button>
                    </div>
                    <div className="max-h-96 overflow-y-auto scrollbar-thin">
                      {items.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="w-10 h-10 mx-auto bg-cream rounded-full flex items-center justify-center mb-3">
                            <Bell size={16} className="text-ash" strokeWidth={1.5} />
                          </div>
                          <div className="text-sm text-ash">Nenhuma notificação ainda.</div>
                        </div>
                      ) : (
                        items.map((n) => (
                          <div
                            key={n.id}
                            className={clsx(
                              'p-4 border-b border-bone last:border-b-0 hover:bg-cream/50 transition-colors',
                              !n.readAt && 'bg-rust-50/50',
                            )}
                          >
                            <div className="flex items-start gap-3">
                              <div
                                className={clsx(
                                  'w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0',
                                  n.readAt ? 'bg-bone' : 'bg-rust shadow-glow',
                                )}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-mono text-[10px] uppercase tracking-wider text-rust font-semibold mb-1">
                                  {n.type.replace(/_/g, ' ')}
                                </div>
                                <div className="text-sm">{describe(n)}</div>
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
