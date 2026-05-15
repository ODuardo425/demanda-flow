'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { AppShell } from '@/components/app-shell';
import { api } from '@/lib/api';

type Step = {
  id: string;
  name: string;
  status: string;
  assignedTo: { id: string; name: string; email: string } | null;
};
type Demand = {
  id: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  priority: number;
  deadline: string | null;
  createdAt: string;
  steps: Step[];
};

const statusLabel: Record<string, { label: string; cls: string }> = {
  OPEN: { label: 'Aberta', cls: 'bg-cream text-ink' },
  IN_PROGRESS: { label: 'Em curso', cls: 'bg-rust text-ivory' },
  COMPLETED: { label: 'Concluída', cls: 'bg-moss text-ivory' },
  CANCELLED: { label: 'Cancelada', cls: 'bg-bone text-ash' },
};

export default function DemandsPage() {
  const [demands, setDemands] = useState<Demand[]>([]);
  const [filter, setFilter] = useState<string>('all');

  const load = async () => {
    const data = await api.get<Demand[]>('/demands');
    setDemands(data);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Excluir demanda? Todas as etapas serão removidas.')) return;
    try {
      await api.delete(`/demands/${id}`);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const filtered = demands.filter((d) =>
    filter === 'all' ? true : d.status === filter,
  );

  return (
    <AppShell title="Demandas" subtitle="Processos e etapas">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-1 border-b border-bone -mb-px">
          {[
            { k: 'all', label: 'Todas' },
            { k: 'OPEN', label: 'Abertas' },
            { k: 'IN_PROGRESS', label: 'Em curso' },
            { k: 'COMPLETED', label: 'Concluídas' },
          ].map((f) => (
            <button
              key={f.k}
              onClick={() => setFilter(f.k)}
              className={clsx(
                'px-4 py-3 text-sm transition-colors relative',
                filter === f.k ? 'text-ink font-medium' : 'text-ash hover:text-ink',
              )}
            >
              {f.label}
              {filter === f.k && (
                <div className="absolute bottom-0 left-0 right-0 h-px bg-rust" />
              )}
            </button>
          ))}
        </div>
        <Link href="/admin/demands/new" className="btn-rust">
          <Plus size={14} /> Nova demanda
        </Link>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-24">
          <div className="font-serif text-3xl italic text-ash mb-2">
            Nenhuma demanda por aqui.
          </div>
          <Link href="/admin/demands/new" className="text-rust text-sm hover:underline">
            Criar a primeira →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((d, i) => {
            const completed = d.steps.filter((s) => s.status === 'COMPLETED').length;
            const total = d.steps.length;
            const pct = total > 0 ? (completed / total) * 100 : 0;
            const meta = statusLabel[d.status];

            return (
              <Link
                key={d.id}
                href={`/admin/demands`}
                className="group block bg-ivory border border-bone hover:border-ink transition-all animate-fade-up"
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="p-6 flex items-center gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={clsx('chip', meta.cls)}>{meta.label}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wider text-ash">
                        Prio {d.priority}
                      </span>
                      <span className="font-mono text-[10px] text-ash">
                        {new Date(d.createdAt).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    <h3 className="font-serif text-2xl mb-2">{d.title}</h3>
                    {d.description && (
                      <p className="text-sm text-ash line-clamp-1 mb-3">
                        {d.description}
                      </p>
                    )}

                    {/* Progress */}
                    <div className="flex items-center gap-3">
                      <div className="flex-1 max-w-xs h-1 bg-bone relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-rust transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="font-mono text-xs text-ash">
                        {completed}/{total} etapas
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={(e) => remove(d.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-ash hover:text-ruby transition-all"
                    >
                      <Trash2 size={14} strokeWidth={1.5} />
                    </button>
                    <ChevronRight
                      size={20}
                      className="text-ash group-hover:text-rust group-hover:translate-x-1 transition-all"
                      strokeWidth={1.5}
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
