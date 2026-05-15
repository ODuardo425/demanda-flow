'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Tag } from 'lucide-react';
import { AppShell } from '@/components/app-shell';
import { api } from '@/lib/api';

type Skill = {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
};

export default function SkillsPage() {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creating, setCreating] = useState(false);

  const load = async () => {
    const data = await api.get<Skill[]>('/skills');
    setSkills(data);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm('Excluir habilidade? Isso pode afetar etapas que dependem dela.')) return;
    try {
      await api.delete(`/skills/${id}`);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AppShell title="Habilidades" subtitle="Catálogo de competências">
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-ash max-w-md">
          Habilidades são as competências dos usuários. Cada etapa de demanda exige
          uma ou mais — o sistema atribui apenas a quem possui.
        </p>
        <button onClick={() => setCreating(true)} className="btn-rust">
          <Plus size={14} /> Nova habilidade
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {skills.map((s, i) => (
          <div
            key={s.id}
            className="group bg-ivory border border-bone hover:border-ink transition-all p-5 animate-fade-up"
            style={{ animationDelay: `${i * 0.03}s` }}
          >
            <div className="flex items-start justify-between mb-3">
              <Tag size={14} className="text-rust" strokeWidth={1.5} />
              <button
                onClick={() => remove(s.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-ash hover:text-ruby"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
            <div className="display text-xl mb-1">{s.name}</div>
            {s.category && (
              <div className="font-mono text-[10px] uppercase tracking-wider text-ash mb-2">
                {s.category}
              </div>
            )}
            {s.description && (
              <p className="text-xs text-ash mt-2">{s.description}</p>
            )}
          </div>
        ))}
      </div>

      {creating && (
        <CreateSkillModal
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function CreateSkillModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post('/skills', { name, category: category || undefined, description: description || undefined });
      onCreated();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-ivory border border-bone w-full max-w-md p-8 animate-fade-up">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="display text-3xl">Nova habilidade</h2>
            <div className="label mt-1">Cadastrar competência</div>
          </div>
          <button onClick={onClose} className="text-ash hover:text-ink">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label block mb-2">Nome</label>
            <input
              className="field-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Acesso Tupi"
              required
              autoFocus
            />
          </div>
          <div>
            <label className="label block mb-2">Categoria (opcional)</label>
            <input
              className="field-input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Comissionamento"
            />
          </div>
          <div>
            <label className="label block mb-2">Descrição (opcional)</label>
            <textarea
              className="field-input min-h-[80px] resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && <div className="text-xs text-ruby">{error}</div>}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-rust">
              Cadastrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
