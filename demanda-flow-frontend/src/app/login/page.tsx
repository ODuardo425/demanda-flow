'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('admin@demanda.flow');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      if (err instanceof ApiError) setError(err.message);
      else setError('Erro inesperado ao entrar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-[1.1fr_1fr]">
      {/* Lado esquerdo: identidade visual */}
      <div className="hidden lg:flex relative bg-ink text-ivory p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-rust rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-rust-400 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-between h-full w-full">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-rust rounded-full animate-pulse" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-ivory/60">
              Demanda Flow / v0.1
            </span>
          </div>

          <div className="max-w-lg animate-fade-up">
            <h1 className="font-serif text-7xl xl:text-8xl leading-[0.95] italic">
              Trabalho
              <br />
              <span className="text-rust-400 not-italic font-normal">
                distribuído.
              </span>
              <br />
              <span className="italic">Naturalmente.</span>
            </h1>
            <div className="h-px bg-ivory/20 w-24 my-8" />
            <p className="text-ivory/70 text-lg leading-relaxed font-light max-w-md">
              Cada demanda encontra, sozinha, as mãos certas. Cada etapa, o
              momento certo. Sem planilhas. Sem fila de espera.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-[11px] font-mono uppercase tracking-wider">
            <div>
              <div className="text-rust-400 mb-1">01</div>
              <div className="text-ivory/60">Atribuição automática por habilidade</div>
            </div>
            <div>
              <div className="text-rust-400 mb-1">02</div>
              <div className="text-ivory/60">Dependências entre etapas</div>
            </div>
            <div>
              <div className="text-rust-400 mb-1">03</div>
              <div className="text-ivory/60">Notificações em tempo real</div>
            </div>
          </div>
        </div>
      </div>

      {/* Lado direito: formulário */}
      <div className="flex items-center justify-center p-8 lg:p-16">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="lg:hidden mb-12">
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash">
              Demanda Flow
            </div>
          </div>

          <h2 className="font-serif text-4xl mb-2">Entrar</h2>
          <p className="text-ash text-sm mb-10">
            Use as credenciais cadastradas pelo administrador.
          </p>

          <div className="space-y-8">
            <div>
              <label className="label block mb-3">E-mail</label>
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label block mb-3">Senha</label>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-ruby border-l-2 border-ruby pl-3 py-1 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-rust w-full h-12 disabled:opacity-50"
            >
              {loading ? 'Autenticando…' : 'Entrar →'}
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-bone">
            <div className="label mb-3">Credenciais de teste</div>
            <div className="space-y-1.5 text-xs font-mono text-ash">
              <div>admin@demanda.flow / admin123</div>
              <div>maria@demanda.flow / user123</div>
              <div>joao@demanda.flow / user123</div>
              <div>ana@demanda.flow / user123</div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
