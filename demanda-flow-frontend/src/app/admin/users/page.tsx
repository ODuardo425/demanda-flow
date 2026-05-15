'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, X, Mail, Shield, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { AppShell } from '@/components/app-shell';
import { api } from '@/lib/api';

type Skill = { id: string; name: string };
type User = {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  active: boolean;
  maxConcurrentTasks: number;
  skills: { skill: Skill }[];
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  const load = async () => {
    const [u, s] = await Promise.all([
      api.get<User[]>('/users'),
      api.get<Skill[]>('/skills'),
    ]);
    setUsers(u);
    setSkills(s);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (id: string) => {
    if (!confirm('Excluir usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      await load();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <AppShell title="Usuários" subtitle="Equipe e permissões">
      <div className="flex items-center justify-between mb-8">
        <p className="text-sm text-ash max-w-md">
          Cada usuário tem habilidades que determinam quais etapas o sistema pode atribuir.
        </p>
        <button onClick={() => setCreating(true)} className="btn-rust">
          <Plus size={14} /> Novo usuário
        </button>
      </div>

      <div className="bg-ivory border border-bone overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-bone bg-cream/40">
              <th className="text-left p-4 label font-medium">Nome</th>
              <th className="text-left p-4 label font-medium">E-mail</th>
              <th className="text-left p-4 label font-medium">Perfil</th>
              <th className="text-left p-4 label font-medium">Habilidades</th>
              <th className="text-left p-4 label font-medium">Capacidade</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr
                key={u.id}
                className="border-b border-bone last:border-b-0 hover:bg-cream/40 group"
              >
                <td className="p-4">
                  <button
                    onClick={() => setEditing(u)}
                    className="font-serif text-lg hover:text-rust transition-colors text-left"
                  >
                    {u.name}
                  </button>
                </td>
                <td className="p-4 font-mono text-xs text-ash">
                  <div className="flex items-center gap-2">
                    <Mail size={12} />
                    {u.email}
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={clsx(
                      'chip',
                      u.role === 'ADMIN' ? 'bg-ink text-ivory' : 'bg-cream text-ink',
                    )}
                  >
                    {u.role === 'ADMIN' && <Shield size={10} />}
                    {u.role}
                  </span>
                </td>
                <td className="p-4">
                  <div className="flex flex-wrap gap-1 max-w-xs">
                    {u.skills.length === 0 ? (
                      <span className="text-ash italic text-xs">nenhuma</span>
                    ) : (
                      u.skills.map((s) => (
                        <span key={s.skill.id} className="chip bg-rust-50 text-rust-700">
                          {s.skill.name}
                        </span>
                      ))
                    )}
                  </div>
                </td>
                <td className="p-4 font-mono text-xs">{u.maxConcurrentTasks}</td>
                <td className="p-4 text-right">
                  <button
                    onClick={() => remove(u.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-ash hover:text-ruby"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(creating || editing) && (
        <UserModal
          user={editing}
          skills={skills}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            load();
          }}
        />
      )}
    </AppShell>
  );
}

function UserModal({
  user,
  skills,
  onClose,
  onSaved,
}: {
  user: User | null;
  skills: Skill[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [name, setName] = useState(user?.name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'ADMIN' | 'USER'>(user?.role ?? 'USER');
  const [maxTasks, setMaxTasks] = useState(user?.maxConcurrentTasks ?? 10);
  const [selectedSkills, setSelectedSkills] = useState<string[]>(
    user?.skills.map((s) => s.skill.id) ?? [],
  );
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      if (user) {
        const payload: any = { name, email, role, maxConcurrentTasks: maxTasks };
        if (password) payload.password = password;
        await api.patch(`/users/${user.id}`, payload);
        await api.put(`/users/${user.id}/skills`, { skillIds: selectedSkills });
      } else {
        await api.post('/users', {
          name,
          email,
          password,
          role,
          maxConcurrentTasks: maxTasks,
          skillIds: selectedSkills,
        });
      }
      onSaved();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const toggleSkill = (id: string) =>
    setSelectedSkills((curr) =>
      curr.includes(id) ? curr.filter((x) => x !== id) : [...curr, id],
    );

  return (
    <div className="fixed inset-0 bg-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-ivory border border-bone w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-thin p-8 animate-fade-up">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-serif text-3xl italic">
              {user ? 'Editar' : 'Novo'} usuário
            </h2>
            <div className="label mt-1">
              {user ? user.email : 'Cadastrar membro da equipe'}
            </div>
          </div>
          <button onClick={onClose} className="text-ash hover:text-ink">
            <X size={18} strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-2">Nome</label>
              <input
                className="field-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label block mb-2">E-mail</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label block mb-2">
                Senha {user && '(deixe vazio para manter)'}
              </label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required={!user}
                minLength={6}
              />
            </div>
            <div>
              <label className="label block mb-2">Perfil</label>
              <select
                className="field-input"
                value={role}
                onChange={(e) => setRole(e.target.value as 'ADMIN' | 'USER')}
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
          </div>

          <div>
            <label className="label block mb-2">
              Tarefas simultâneas máximas
            </label>
            <input
              type="number"
              min={1}
              className="field-input w-32"
              value={maxTasks}
              onChange={(e) => setMaxTasks(parseInt(e.target.value, 10))}
            />
          </div>

          <div>
            <label className="label block mb-3 flex items-center gap-2">
              <Sparkles size={12} />
              Habilidades
            </label>
            <div className="flex flex-wrap gap-2">
              {skills.length === 0 ? (
                <span className="text-xs text-ash italic">
                  Cadastre habilidades primeiro.
                </span>
              ) : (
                skills.map((s) => {
                  const sel = selectedSkills.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleSkill(s.id)}
                      className={clsx(
                        'px-3 py-1.5 text-xs border transition-all',
                        sel
                          ? 'bg-rust text-ivory border-rust'
                          : 'bg-ivory border-bone text-ink hover:border-rust',
                      )}
                    >
                      {s.name}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {error && <div className="text-xs text-ruby">{error}</div>}

          <div className="flex justify-end gap-2 pt-4 border-t border-bone">
            <button type="button" onClick={onClose} className="btn-ghost">
              Cancelar
            </button>
            <button type="submit" className="btn-rust">
              {user ? 'Salvar alterações' : 'Cadastrar usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
