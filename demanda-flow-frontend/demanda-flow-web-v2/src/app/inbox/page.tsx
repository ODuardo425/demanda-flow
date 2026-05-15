'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, Check, Calendar, Zap, CircleDot } from 'lucide-react';
import clsx from 'clsx';
import { AppShell } from '@/components/app-shell';
import { api } from '@/lib/api';

type Step = {
  id: string;
  name: string;
  description: string | null;
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED';
  assignedAt: string | null;
  startedAt: string | null;
  deadline: string | null;
  demand: { id: string; title: string; priority: number; deadline: string | null };
  requiredSkills: { skill: { id: string; name: string } }[];
};

const filters = [
  { key: 'open', label: 'Em aberto' },
  { key: 'in_progress', label: 'Em andamento' },
  { key: 'completed', label: 'Concluídas' },
] as const;

export default function InboxPage() {
  const [filter, setFilter] = useState<typeof filters[number]['key']>('open');
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const status =
        filter === 'open' ? undefined : filter === 'in_progress' ? 'IN_PROGRESS' : 'COMPLETED';
      const path = status ? `/me/tasks?status=${status}` : '/me/tasks';
      const data = await api.get<Step[]>(path);
      setSteps(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const start = async (id: string) => {
    setBusy(id);
    try {
      await api.post(`/steps/${id}/start`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  const complete = async (id: string) => {
    setBusy(id);
    try {
      await api.post(`/steps/${id}/complete`);
      await load();
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell title="Caixa de entrada" subtitle="Suas tarefas atribuídas">
      {/* Filtros em segmented control */}
      <div className="flex items-center gap-1 mb-8 p-1 bg-cream rounded-md w-fit">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-4 py-1.5 text-sm rounded-md transition-all duration-200',
              filter === f.key
                ? 'bg-ivory text-ink shadow-soft font-semibold'
                : 'text-ash hover:text-ink',
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-ash">Carregando…</div>
      ) : steps.length === 0 ? (
        <div className="text-center py-24 max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto bg-cream rounded-full flex items-center justify-center mb-4">
            <CircleDot size={24} className="text-ash" strokeWidth={1.5} />
          </div>
          <div className="display text-2xl mb-2">Nada por enquanto.</div>
          <div className="text-sm text-ash">
            Quando uma tarefa chegar, ela aparece aqui em tempo real.
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {steps.map((step, idx) => (
            <StepCard
              key={step.id}
              step={step}
              index={idx}
              busy={busy === step.id}
              onStart={() => start(step.id)}
              onComplete={() => complete(step.id)}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}

function StepCard({
  step,
  index,
  busy,
  onStart,
  onComplete,
}: {
  step: Step;
  index: number;
  busy: boolean;
  onStart: () => void;
  onComplete: () => void;
}) {
  const priorityCls =
    step.demand.priority <= 2
      ? 'bg-ruby'
      : step.demand.priority === 3
        ? 'bg-amber'
        : 'bg-rust';

  const overdue =
    step.deadline && new Date(step.deadline) < new Date() && step.status !== 'COMPLETED';

  const isActive = step.status === 'IN_PROGRESS';
  const isDone = step.status === 'COMPLETED';

  return (
    <div
      className={clsx(
        'group relative bg-ivory border border-bone rounded-lg overflow-hidden transition-all duration-300 animate-fade-up',
        'hover:shadow-lift hover:border-rust/30',
        isActive && 'border-rust/50 shadow-soft',
        isDone && 'opacity-60',
      )}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      {/* Charging bar animada quando IN_PROGRESS */}
      {isActive && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-rust/10 overflow-hidden">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-volt to-transparent animate-charge" />
        </div>
      )}

      <div className="p-6 flex items-start gap-5">
        {/* Indicador de prioridade */}
        <div className="flex-shrink-0 flex flex-col items-center gap-1.5 pt-1">
          <div className={clsx('w-2.5 h-2.5 rounded-full', priorityCls)} />
          <div className="text-[9px] font-mono font-semibold text-ash uppercase">
            P{step.demand.priority}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ash font-semibold">
              {step.demand.title}
            </div>
            {overdue && (
              <span className="chip bg-ruby/10 text-ruby">
                <Clock size={10} /> Atrasada
              </span>
            )}
            {isActive && (
              <span className="chip bg-rust/10 text-rust">
                <Zap size={10} fill="currentColor" strokeWidth={0} />
                Em execução
              </span>
            )}
            {isDone && (
              <span className="chip bg-moss/10 text-moss">
                <Check size={10} strokeWidth={3} />
                Concluída
              </span>
            )}
          </div>

          <h3 className="display text-xl mb-2 leading-tight">{step.name}</h3>

          {step.description && (
            <p className="text-sm text-ash mb-3 leading-relaxed line-clamp-2">
              {step.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-3 text-xs mt-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              {step.requiredSkills.map((s) => (
                <span
                  key={s.skill.id}
                  className="chip bg-rust-50 text-rust-700 border border-rust-100"
                >
                  {s.skill.name}
                </span>
              ))}
            </div>

            {step.deadline && (
              <div className="flex items-center gap-1.5 text-ash">
                <Calendar size={12} strokeWidth={1.5} />
                <span className="font-mono">
                  {new Date(step.deadline).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>

        {!isDone && (
          <div className="flex flex-col gap-2 flex-shrink-0">
            {step.status === 'ASSIGNED' && (
              <button
                onClick={onStart}
                disabled={busy}
                className="btn-ghost h-9 px-3 text-xs"
              >
                <Play size={12} fill="currentColor" strokeWidth={0} />
                Iniciar
              </button>
            )}
            <button
              onClick={onComplete}
              disabled={busy}
              className="btn-rust h-9 px-3 text-xs"
            >
              <Check size={12} strokeWidth={2.5} />
              Concluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
