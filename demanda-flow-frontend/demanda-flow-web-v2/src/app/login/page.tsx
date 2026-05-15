'use client';

import { useState } from 'react';
import { Zap, ArrowRight, Plug, Activity, Network } from 'lucide-react';
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
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr]">
      {/* Lado esquerdo — hero tech */}
      <div className="hidden lg:flex relative bg-forest text-ivory overflow-hidden">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-grid opacity-50" />

        {/* Blobs de luz */}
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-rust/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-volt/20 rounded-full blur-[100px]" />

        {/* Linhas de energia decorativas */}
        <svg
          className="absolute inset-0 w-full h-full opacity-20"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="line" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#10B981" stopOpacity="0" />
              <stop offset="0.5" stopColor="#A3E635" stopOpacity="1" />
              <stop offset="1" stopColor="#10B981" stopOpacity="0" />
            </linearGradient>
          </defs>
          <line x1="0" y1="20%" x2="100%" y2="20%" stroke="url(#line)" strokeWidth="1" />
          <line x1="0" y1="55%" x2="100%" y2="55%" stroke="url(#line)" strokeWidth="1" />
          <line x1="0" y1="80%" x2="100%" y2="80%" stroke="url(#line)" strokeWidth="1" />
        </svg>

        <div className="relative z-10 flex flex-col justify-between h-full w-full p-12">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-9 h-9 bg-rust rounded-md flex items-center justify-center shadow-glow">
                <Zap size={18} className="text-forest" fill="currentColor" strokeWidth={0} />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-volt rounded-full animate-pulse-glow" />
            </div>
            <div>
              <div className="display text-lg">Demanda Flow</div>
              <div className="font-mono text-[9px] uppercase tracking-[0.2em] text-ivory/40">
                Operations · v0.1
              </div>
            </div>
          </div>

          <div className="max-w-xl animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rust/10 border border-rust/30 rounded-full mb-6">
              <div className="w-1.5 h-1.5 bg-volt rounded-full animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-wider text-volt">
                Sistema online
              </span>
            </div>

            <h1 className="display text-6xl xl:text-7xl leading-[0.95] mb-6">
              Cada demanda
              <br />
              <span className="text-rust">conectada</span>
              <br />
              ao especialista certo.
            </h1>
            <p className="text-ivory/60 text-base leading-relaxed max-w-md">
              Roteamento inteligente de tarefas baseado em habilidades. Etapas que
              se desbloqueiam sozinhas. Notificações em tempo real. Sem planilha,
              sem fila parada.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <FeatureCell icon={Network} label="Distribuição automática" />
            <FeatureCell icon={Activity} label="Workflow encadeado" />
            <FeatureCell icon={Plug} label="Notificações ao vivo" />
          </div>
        </div>
      </div>

      {/* Lado direito — formulário */}
      <div className="flex items-center justify-center p-8 lg:p-16 bg-ivory">
        <form
          onSubmit={onSubmit}
          className="w-full max-w-sm animate-fade-up"
          style={{ animationDelay: '0.1s' }}
        >
          <div className="lg:hidden mb-12 flex items-center gap-2">
            <div className="w-8 h-8 bg-rust rounded-md flex items-center justify-center">
              <Zap size={16} className="text-ivory" fill="currentColor" strokeWidth={0} />
            </div>
            <span className="display text-xl">Demanda Flow</span>
          </div>

          <div className="mb-10">
            <h2 className="display text-4xl mb-2">Acessar painel</h2>
            <p className="text-ash text-sm">
              Use as credenciais fornecidas pela administração.
            </p>
          </div>

          <div className="space-y-6">
            <div>
              <label className="label block mb-2">E-mail</label>
              <input
                type="email"
                className="field-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="voce@empresa.com"
                required
                autoFocus
              />
            </div>

            <div>
              <label className="label block mb-2">Senha</label>
              <input
                type="password"
                className="field-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="text-sm text-ruby bg-ruby/5 border border-ruby/20 rounded-md p-3 animate-fade-in">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-rust w-full h-12 disabled:opacity-50 text-base"
            >
              {loading ? (
                'Conectando…'
              ) : (
                <>
                  Entrar <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>

          <div className="mt-10 pt-8 border-t border-bone">
            <div className="label mb-3 flex items-center gap-2">
              <Zap size={10} className="text-rust" />
              Acessos de teste
            </div>
            <div className="space-y-1.5 text-xs font-mono text-ash">
              <div>
                <span className="text-ink">admin@demanda.flow</span> · admin123
              </div>
              <div>
                <span className="text-ink">maria@demanda.flow</span> · user123
              </div>
              <div>
                <span className="text-ink">joao@demanda.flow</span> · user123
              </div>
              <div>
                <span className="text-ink">ana@demanda.flow</span> · user123
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function FeatureCell({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
}) {
  return (
    <div className="p-3 border border-ivory/10 rounded-md backdrop-blur-sm bg-ivory/5">
      <Icon size={14} className="text-volt mb-2" strokeWidth={1.5} />
      <div className="text-[11px] text-ivory/70 leading-tight">{label}</div>
    </div>
  );
}
