'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, Trash2, ArrowLeft, Link2, X, GripVertical } from 'lucide-react';
import clsx from 'clsx';
import { AppShell } from '@/components/app-shell';
import { api } from '@/lib/api';

type Skill = { id: string; name: string; category: string | null };

type StepDraft = {
  uid: string;
  orderIndex: number;
  name: string;
  description: string;
  requiredSkillIds: string[];
  matchMode: 'ANY' | 'ALL';
  dependsOnIndices: number[];
  deadline: string;
  expectedDurationHours: string;
};

let _uid = 0;
const newDraft = (orderIndex: number): StepDraft => ({
  uid: `s-${++_uid}`,
  orderIndex,
  name: '',
  description: '',
  requiredSkillIds: [],
  matchMode: 'ANY',
  dependsOnIndices: [],
  deadline: '',
  expectedDurationHours: '',
});

export default function NewDemandPage() {
  const router = useRouter();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState(3);
  const [deadline, setDeadline] = useState('');
  const [steps, setSteps] = useState<StepDraft[]>([newDraft(1)]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<Skill[]>('/skills').then(setSkills);
  }, []);

  const addStep = () => {
    setSteps((curr) => [...curr, newDraft(curr.length + 1)]);
  };

  const removeStep = (uid: string) => {
    setSteps((curr) => {
      const removed = curr.find((s) => s.uid === uid);
      const filtered = curr
        .filter((s) => s.uid !== uid)
        .map((s, i) => ({
          ...s,
          orderIndex: i + 1,
          // Remover dependências para a etapa removida e reindexar
          dependsOnIndices: removed
            ? s.dependsOnIndices
                .filter((idx) => idx !== removed.orderIndex)
                .map((idx) => (idx > removed.orderIndex ? idx - 1 : idx))
            : s.dependsOnIndices,
        }));
      return filtered.length === 0 ? [newDraft(1)] : filtered;
    });
  };

  const updateStep = (uid: string, patch: Partial<StepDraft>) => {
    setSteps((curr) => curr.map((s) => (s.uid === uid ? { ...s, ...patch } : s)));
  };

  const toggleSkill = (uid: string, skillId: string) => {
    setSteps((curr) =>
      curr.map((s) =>
        s.uid === uid
          ? {
              ...s,
              requiredSkillIds: s.requiredSkillIds.includes(skillId)
                ? s.requiredSkillIds.filter((id) => id !== skillId)
                : [...s.requiredSkillIds, skillId],
            }
          : s,
      ),
    );
  };

  const toggleDependency = (uid: string, otherIndex: number) => {
    setSteps((curr) =>
      curr.map((s) =>
        s.uid === uid
          ? {
              ...s,
              dependsOnIndices: s.dependsOnIndices.includes(otherIndex)
                ? s.dependsOnIndices.filter((i) => i !== otherIndex)
                : [...s.dependsOnIndices, otherIndex],
            }
          : s,
      ),
    );
  };

  const submit = async () => {
    setError(null);
    if (!title.trim()) {
      setError('Defina um título para a demanda.');
      return;
    }
    if (steps.some((s) => !s.name.trim())) {
      setError('Todas as etapas precisam ter um nome.');
      return;
    }
    if (steps.some((s) => s.requiredSkillIds.length === 0)) {
      setError('Toda etapa precisa de pelo menos uma habilidade.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/demands', {
        title,
        description: description || undefined,
        priority,
        deadline: deadline || undefined,
        steps: steps.map((s) => ({
          orderIndex: s.orderIndex,
          name: s.name,
          description: s.description || undefined,
          requiredSkillIds: s.requiredSkillIds,
          matchMode: s.matchMode,
          dependsOnIndices: s.dependsOnIndices.length ? s.dependsOnIndices : undefined,
          deadline: s.deadline || undefined,
          expectedDurationHours: s.expectedDurationHours
            ? parseInt(s.expectedDurationHours, 10)
            : undefined,
        })),
      });
      router.push('/admin/demands');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Nova demanda" subtitle="Composição de etapas">
      <Link
        href="/admin/demands"
        className="inline-flex items-center gap-1.5 text-xs text-ash hover:text-ink mb-6 font-mono uppercase tracking-wider"
      >
        <ArrowLeft size={12} /> Voltar
      </Link>

      <div className="grid lg:grid-cols-[1fr_320px] gap-8">
        {/* Coluna principal */}
        <div className="space-y-6">
          {/* Cabeçalho da demanda */}
          <div className="card">
            <div className="label mb-2">Demanda</div>
            <input
              className="input text-3xl font-serif italic mb-4 py-2"
              placeholder="Título da demanda"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="field-input min-h-[60px] resize-none"
              placeholder="Descrição (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="label block mb-2">Prioridade</label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={clsx(
                        'w-9 h-9 text-xs font-mono border transition-all',
                        priority === p
                          ? 'bg-rust text-ivory border-rust'
                          : 'bg-ivory border-bone text-ash hover:border-rust',
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label block mb-2">Prazo final (opcional)</label>
                <input
                  type="datetime-local"
                  className="field-input"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Etapas */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-serif text-2xl italic">Etapas</h2>
                <div className="label">{steps.length} etapas configuradas</div>
              </div>
              <button onClick={addStep} className="btn-ghost">
                <Plus size={14} /> Adicionar etapa
              </button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <StepEditor
                  key={step.uid}
                  step={step}
                  index={idx}
                  allSteps={steps}
                  skills={skills}
                  onUpdate={(patch) => updateStep(step.uid, patch)}
                  onRemove={() => removeStep(step.uid)}
                  onToggleSkill={(id) => toggleSkill(step.uid, id)}
                  onToggleDep={(i) => toggleDependency(step.uid, i)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Coluna lateral: grafo visual + ações */}
        <aside className="space-y-4 lg:sticky lg:top-24 self-start">
          <div className="card">
            <div className="label mb-3">Fluxo de execução</div>
            <DependencyGraph steps={steps} />
          </div>

          <div className="card">
            {error && (
              <div className="text-xs text-ruby border-l-2 border-ruby pl-3 py-1 mb-3">
                {error}
              </div>
            )}
            <button
              onClick={submit}
              disabled={submitting}
              className="btn-rust w-full h-11"
            >
              {submitting ? 'Criando…' : 'Criar e distribuir'}
            </button>
            <p className="text-[11px] text-ash mt-3 leading-relaxed">
              As etapas sem dependências serão atribuídas automaticamente assim que a demanda for criada.
            </p>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}

function StepEditor({
  step,
  index,
  allSteps,
  skills,
  onUpdate,
  onRemove,
  onToggleSkill,
  onToggleDep,
}: {
  step: StepDraft;
  index: number;
  allSteps: StepDraft[];
  skills: Skill[];
  onUpdate: (patch: Partial<StepDraft>) => void;
  onRemove: () => void;
  onToggleSkill: (id: string) => void;
  onToggleDep: (i: number) => void;
}) {
  const others = allSteps.filter((s) => s.uid !== step.uid);
  return (
    <div className="bg-ivory border border-bone p-5 group animate-fade-up" style={{ animationDelay: `${index * 0.04}s` }}>
      <div className="flex items-start gap-4">
        <div className="font-serif text-3xl italic text-rust w-8 flex-shrink-0">
          {step.orderIndex}
        </div>

        <div className="flex-1 min-w-0 space-y-3">
          <input
            className="input text-lg font-medium py-1"
            placeholder="Nome da etapa"
            value={step.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
          />

          <textarea
            className="field-input text-xs min-h-[40px] resize-none"
            placeholder="Descrição (opcional)"
            value={step.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
          />

          {/* Habilidades */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="label">Habilidades necessárias</div>
              <div className="flex border border-bone">
                {(['ANY', 'ALL'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => onUpdate({ matchMode: m })}
                    className={clsx(
                      'px-2 py-0.5 text-[10px] font-mono uppercase',
                      step.matchMode === m
                        ? 'bg-ink text-ivory'
                        : 'text-ash hover:text-ink',
                    )}
                  >
                    {m === 'ANY' ? 'Qualquer' : 'Todas'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {skills.length === 0 ? (
                <Link href="/admin/skills" className="text-xs text-rust hover:underline">
                  Cadastrar habilidades →
                </Link>
              ) : (
                skills.map((s) => {
                  const sel = step.requiredSkillIds.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => onToggleSkill(s.id)}
                      className={clsx(
                        'px-2.5 py-1 text-[11px] border transition-all',
                        sel
                          ? 'bg-rust text-ivory border-rust'
                          : 'bg-ivory text-ash border-bone hover:border-rust',
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Dependências */}
          {others.length > 0 && (
            <div>
              <div className="label mb-2 flex items-center gap-1.5">
                <Link2 size={10} /> Depende de
              </div>
              <div className="flex flex-wrap gap-1.5">
                {others.map((o) => {
                  const sel = step.dependsOnIndices.includes(o.orderIndex);
                  return (
                    <button
                      key={o.uid}
                      onClick={() => onToggleDep(o.orderIndex)}
                      className={clsx(
                        'px-2.5 py-1 text-[11px] border transition-all',
                        sel
                          ? 'bg-ink text-ivory border-ink'
                          : 'bg-ivory text-ash border-bone hover:border-ink',
                      )}
                    >
                      {o.orderIndex}. {o.name || '(sem nome)'}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Prazo + duração */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label block mb-1">Prazo (opcional)</label>
              <input
                type="datetime-local"
                className="field-input text-xs"
                value={step.deadline}
                onChange={(e) => onUpdate({ deadline: e.target.value })}
              />
            </div>
            <div>
              <label className="label block mb-1">Duração estimada (h)</label>
              <input
                type="number"
                min={1}
                className="field-input text-xs"
                value={step.expectedDurationHours}
                onChange={(e) =>
                  onUpdate({ expectedDurationHours: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <button
          onClick={onRemove}
          className="opacity-0 group-hover:opacity-100 text-ash hover:text-ruby transition-all"
        >
          <Trash2 size={14} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}

function DependencyGraph({ steps }: { steps: StepDraft[] }) {
  if (steps.length === 0) {
    return (
      <div className="text-xs text-ash italic py-4 text-center">
        Adicione etapas para visualizar.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {steps.map((s) => (
        <div key={s.uid} className="text-xs">
          <div className="flex items-center gap-2">
            <span className="font-serif text-base italic text-rust w-5 text-right">
              {s.orderIndex}
            </span>
            <span className="font-medium truncate max-w-[180px]">
              {s.name || <span className="italic text-ash">sem nome</span>}
            </span>
          </div>
          {s.dependsOnIndices.length > 0 && (
            <div className="ml-7 mt-0.5 text-[10px] text-ash font-mono">
              ↑ depende de {s.dependsOnIndices.sort((a, b) => a - b).join(', ')}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
