'use client';

import { useEffect, useState } from 'react';
import { Clock, Play, Check, MessageSquare, Calendar } from 'lucide-react';
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
  { key: 'open', label: 'Em aberto', statuses: ['ASSIGNED', 'IN_PROGRESS'] },
  { key: 'in_progress', label: 'Em andamento', statuses: ['IN_PROGRESS'] },
  { key: 'completed', label: 'Concluídas', statuses: ['COMPLETED'] },
] as const;

export default function InboxPage() {
  const [filter, setFilter] = useState<typeof filters[number]['key']>('open');
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const status = filter === 'open' ? undefined : filter === 'in_progress' ? 'IN_PROGRESS' : 'COMPLETED';
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
    <AppShell title="Sua caixa de entrada" subtitle="Tarefas atribuídas a você">
      {/* Filtros */}
      <div className="flex items-center gap-1 mb-8 border-b border-bone">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={clsx(
              'px-4 py-3 text-sm transition-colors relative',
              filter === f.key
                ? 'text-ink font-medium'
                : 'text-ash hover:text-ink',
            )}
          >
            {f.label}
            {filter === f.key && (
              <div className="absolute bottom-0 left-0 right-0 h-px bg-rust" />
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 font-serif italic text-ash">Carregando…</div>
      ) : steps.length === 0 ? (
        <div className="text-center py-24">
          <div className="font-serif text-3xl italic text-ash mb-2">
            Nada na sua mesa.
          </div>
          <div className="text-sm text-ash">
            Quando uma tarefa chegar, aparece aqui.
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
  const priorityColor =
    step.demand.priority <= 2 ? 'bg-ruby' : step.demand.priority === 3 ? 'bg-amber' : 'bg-moss';

  const overdue =
    step.deadline && new Date(step.deadline) < new Date() && step.status !== 'COMPLETED';

  return (
    <div
      className={clsx(
        'group bg-ivory border border-bone hover:border-ink transition-all duration-200 animate-fade-up',
        step.status === 'IN_PROGRESS' && 'border-l-2 border-l-rust',
        step.status === 'COMPLETED' && 'opacity-60',
      )}
      style={{ animationDelay: `${index * 0.04}s` }}
    >
      <div className="p-6 flex items-start gap-6">
        <div className={clsx('w-1 h-12 flex-shrink-0', priorityColor)} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1">
            <div className="font-mono text-[10px] uppercase tracking-[0.15em] text-ash">
              {step.demand.title}
            </div>
            {overdue && (
              <span className="chip bg-ruby/10 text-ruby">
                <Clock size={10} /> Atrasada
              </span>
            )}
            {step.status === 'IN_PROGRESS' && (
              <span className="chip bg-rust/10 text-rust">
                <span className="w-1 h-1 bg-rust rounded-full animate-pulse" />
                Em andamento
              </span>
            )}
          </div>

          <h3 className="font-serif text-xl mb-2 leading-tight">{step.name}</h3>

          {step.description && (
            <p className="text-sm text-ash mb-3 leading-relaxed line-clamp-2">
              {step.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-ash mt-3">
            <div className="flex items-center gap-1.5">
              <span className="label">Habilidade</span>
              {step.requiredSkills.map((s) => (
                <span key={s.skill.id} className="chip bg-cream text-ink">
                  {s.skill.name}
                </span>
              ))}
            </div>

            {step.deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar size={12} />
                <span className="font-mono">
                  {new Date(step.deadline).toLocaleDateString('pt-BR')}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {step.status === 'ASSIGNED' && (
            <button onClick={onStart} disabled={busy} className="btn-ghost h-9 px-3 text-xs">
              <Play size={12} /> Iniciar
            </button>
          )}
          {(step.status === 'ASSIGNED' || step.status === 'IN_PROGRESS') && (
            <button onClick={onComplete} disabled={busy} className="btn-rust h-9 px-3 text-xs">
              <Check size={12} /> Concluir
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
