'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, Clock, TrendingUp, Users2, Activity } from 'lucide-react';
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
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

      {/* Tempo médio */}
      <div className="mb-10 p-6 bg-ink text-ivory grain">
        <div className="flex items-end gap-6">
          <div>
            <div className="label text-ivory/60 mb-2">Tempo médio de conclusão</div>
            <div className="font-serif text-5xl italic">
              {summary?.avgCompletionHours
                ? `${summary.avgCompletionHours.toFixed(1)}h`
                : '—'}
            </div>
          </div>
          <div className="text-xs font-mono text-ivory/40 pb-2 uppercase tracking-wider">
            últimos 30 dias
          </div>
        </div>
      </div>

      {/* Workload + Bottlenecks */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif text-2xl italic">Carga por usuário</h2>
              <div className="label">Usuários ativos no momento</div>
            </div>
            <Users2 size={18} className="text-ash" strokeWidth={1.5} />
          </div>

          <div className="space-y-4">
            {workload.length === 0 ? (
              <div className="text-sm text-ash italic">Nenhum usuário ativo.</div>
            ) : (
              workload.map((w) => {
                const active = parseInt(w.active_tasks, 10);
                const pct = Math.min((active / w.capacity) * 100, 100);
                const overloaded = pct > 80;
                return (
                  <div key={w.user_id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="text-sm">{w.name}</div>
                      <div className="font-mono text-xs text-ash">
                        {active} / {w.capacity}
                      </div>
                    </div>
                    <div className="h-1 bg-bone relative overflow-hidden">
                      <div
                        className={clsx(
                          'absolute inset-y-0 left-0 transition-all duration-500',
                          overloaded ? 'bg-ruby' : pct > 50 ? 'bg-rust' : 'bg-moss',
                        )}
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
              <h2 className="font-serif text-2xl italic">Gargalos</h2>
              <div className="label">Etapas paradas há mais tempo</div>
            </div>
            <AlertTriangle size={18} className="text-ash" strokeWidth={1.5} />
          </div>

          <div className="space-y-3">
            {bottlenecks.length === 0 ? (
              <div className="text-sm text-ash italic">Nenhum gargalo detectado.</div>
            ) : (
              bottlenecks.slice(0, 5).map((b) => (
                <Link
                  key={b.id}
                  href={`/admin/demands`}
                  className="block p-3 -mx-3 hover:bg-cream/60 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="font-mono text-[10px] uppercase tracking-wider text-ash truncate">
                        {b.demand.title}
                      </div>
                      <div className="text-sm mt-0.5">{b.name}</div>
                      <div className="flex gap-1 mt-1">
                        {b.requiredSkills.map((s) => (
                          <span
                            key={s.skill.id}
                            className="chip bg-cream text-ash"
                          >
                            {s.skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={clsx(
                          'chip',
                          b.status === 'UNASSIGNABLE'
                            ? 'bg-ruby/10 text-ruby'
                            : 'bg-amber/10 text-amber',
                        )}
                      >
                        {b.status === 'UNASSIGNABLE' ? 'Sem responsável' : 'Aguardando'}
                      </span>
                    </div>
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
  const accentColor = {
    rust: 'text-rust',
    ink: 'text-ink',
    ruby: 'text-ruby',
    amber: 'text-amber',
  }[accent];
  return (
    <div className="card relative overflow-hidden">
      {alarm && (
        <div className="absolute top-0 right-0 w-2 h-2 m-2 bg-ruby rounded-full animate-pulse" />
      )}
      <div className="flex items-start justify-between mb-6">
        <Icon size={16} className="text-ash" strokeWidth={1.5} />
      </div>
      <div className={clsx('font-serif text-5xl italic mb-1', accentColor)}>
        {value}
      </div>
      <div className="label">{label}</div>
    </div>
  );
}
