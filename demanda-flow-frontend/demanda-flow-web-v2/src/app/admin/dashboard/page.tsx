'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Clock,
  TrendingUp,
  Users2,
  Activity,
  Zap,
  Plug,
} from 'lucide-react';
import clsx from 'clsx';
import { AppShell } from '@/components/app-shell';
import { api } from '@/lib/api';

type Summary = {
  pendingTasks: number;
  demandsInProgress: number;
  overdueTasks: number;
  unassignable: number;
  avgCompletionHours: number | null;
};

type Workload = { user_id: string; name: string; active_tasks: string; capacity: number };
type Bottleneck = {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  demand: { id: string; title: string };
  requiredSkills: { skill: { id: string; name: string } }[];
};

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [workload, setWorkload] = useState<Workload[]>([]);
  const [bottlenecks, setBottlenecks] = useState<Bottleneck[]>([]);

  useEffect(() => {
    Promise.all([
      api.get<Summary>('/dashboard/summary'),
      api.get<Workload[]>('/dashboard/workload'),
      api.get<Bottleneck[]>('/dashboard/bottlenecks'),
    ]).then(([s, w, b]) => {
      setSummary(s);
      setWorkload(w);
      setBottlenecks(b);
    });
  }, []);

  return (
    <AppShell title="Visão geral" subtitle="Painel administrativo">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Tarefas pendentes"
          value={summary?.pendingTasks ?? '—'}
          icon={Activity}
          accent="rust"
        />
        <KpiCard
          label="Demandas em curso"
          value={summary?.demandsInProgress ?? '—'}
          icon={TrendingUp}
          accent="ink"
        />
        <KpiCard
          label="Atrasadas"
          value={summary?.overdueTasks ?? '—'}
          icon={Clock}
          accent="ruby"
          alarm={!!summary && summary.overdueTasks > 0}
        />
        <KpiCard
          label="Sem responsável"
          value={summary?.unassignable ?? '—'}
          icon={AlertTriangle}
          accent="amber"
          alarm={!!summary && summary.unassignable > 0}
        />
      </div>

      {/* Tempo médio — hero card */}
      <div className="mb-6 relative bg-forest text-ivory rounded-lg overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-rust/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-volt/10 rounded-full blur-3xl" />

        <div className="relative p-8 flex items-end justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Zap size={14} className="text-volt" fill="currentColor" strokeWidth={0} />
              <span className="label text-volt">Throughput médio</span>
            </div>
            <div className="display text-7xl mb-2">
              {summary?.avgCompletionHours
                ? `${summary.avgCompletionHours.toFixed(1)}`
                : '—'}
              <span className="text-3xl text-ivory/60 ml-2 font-medium">h</span>
            </div>
            <div className="text-sm text-ivory/60">
              Tempo médio de conclusão por etapa nos últimos 30 dias
            </div>
          </div>

          {/* Mini visualização decorativa */}
          <div className="flex items-end gap-1 h-16">
            {[0.4, 0.7, 0.5, 0.9, 0.6, 0.8, 1].map((h, i) => (
              <div
                key={i}
                className="w-2 bg-volt/60 rounded-sm"
                style={{ height: `${h * 100}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Workload + Bottlenecks */}
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="display text-xl">Carga por usuário</h2>
              <div className="label mt-0.5">Capacidade utilizada</div>
            </div>
            <div className="w-10 h-10 bg-cream rounded-md flex items-center justify-center">
              <Users2 size={16} className="text-ash" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-4">
            {workload.length === 0 ? (
              <div className="text-sm text-ash py-8 text-center">
                Nenhum usuário ativo.
              </div>
            ) : (
              workload.map((w) => {
                const active = parseInt(w.active_tasks, 10);
                const pct = Math.min((active / w.capacity) * 100, 100);
                const overloaded = pct > 80;
                const cls = overloaded
                  ? 'bg-ruby'
                  : pct > 50
                    ? 'bg-amber'
                    : 'bg-rust';
                return (
                  <div key={w.user_id}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-rust/10 text-rust rounded-md flex items-center justify-center text-[10px] font-bold">
                          {w.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <div className="text-sm font-medium">{w.name}</div>
                      </div>
                      <div className="font-mono text-xs">
                        <span className={overloaded ? 'text-ruby font-bold' : 'text-ink'}>
                          {active}
                        </span>
                        <span className="text-ash"> / {w.capacity}</span>
                      </div>
                    </div>
                    <div className="h-1.5 bg-cream rounded-full relative overflow-hidden">
                      <div
                        className={clsx('absolute inset-y-0 left-0 transition-all duration-500 rounded-full', cls)}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="display text-xl">Gargalos</h2>
              <div className="label mt-0.5">Etapas paradas há mais tempo</div>
            </div>
            <div className="w-10 h-10 bg-amber/10 rounded-md flex items-center justify-center">
              <AlertTriangle size={16} className="text-amber" strokeWidth={1.5} />
            </div>
          </div>

          <div className="space-y-2">
            {bottlenecks.length === 0 ? (
              <div className="py-8 text-center">
                <div className="w-12 h-12 mx-auto bg-moss/10 rounded-full flex items-center justify-center mb-2">
                  <Plug size={18} className="text-moss" strokeWidth={1.5} />
                </div>
                <div className="text-sm text-ash">Tudo fluindo bem.</div>
              </div>
            ) : (
              bottlenecks.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  href="/admin/demands"
                  className="block p-3 rounded-md hover:bg-cream/60 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-ash truncate">
                        {b.demand.title}
                      </div>
                      <div className="text-sm mt-0.5 font-medium group-hover:text-rust transition-colors">
                        {b.name}
                      </div>
                      <div className="flex gap-1 mt-1.5 flex-wrap">
                        {b.requiredSkills.map((s) => (
                          <span key={s.skill.id} className="chip bg-cream text-ash">
                            {s.skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        'chip flex-shrink-0',
                        b.status === 'UNASSIGNABLE'
                          ? 'bg-ruby/10 text-ruby'
                          : 'bg-amber/10 text-amber',
                      )}
                    >
                      {b.status === 'UNASSIGNABLE' ? 'Sem responsável' : 'Aguardando'}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function KpiCard({
  label,
  value,
  icon: Icon,
  accent,
  alarm,
}: {
  label: string;
  value: number | string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  accent: 'rust' | 'ink' | 'ruby' | 'amber';
  alarm?: boolean;
}) {
  const styles = {
    rust: { text: 'text-rust', bg: 'bg-rust/10' },
    ink: { text: 'text-ink', bg: 'bg-cream' },
    ruby: { text: 'text-ruby', bg: 'bg-ruby/10' },
    amber: { text: 'text-amber', bg: 'bg-amber/10' },
  }[accent];

  return (
    <div className="relative card overflow-hidden group hover:shadow-lift transition-shadow">
      {alarm && (
        <div className="absolute top-3 right-3 w-2 h-2 bg-ruby rounded-full animate-pulse-glow" />
      )}
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-9 h-9 rounded-md flex items-center justify-center', styles.bg)}>
          <Icon size={16} className={styles.text} strokeWidth={1.5} />
        </div>
      </div>
      <div className={clsx('display text-5xl mb-1', styles.text)}>{value}</div>
      <div className="label">{label}</div>
    </div>
  );
}
