import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth';
import './globals.css';

export const metadata: Metadata = {
  title: 'Demanda Flow',
  description: 'Distribuição automática de tarefas por habilidades',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="grain min-h-screen">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
