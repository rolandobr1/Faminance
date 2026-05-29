'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/context/auth-context';
import { users } from '@/lib/data';
import { useEffect } from 'react';
import { Loader2, PiggyBank, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const getInitials = (name: string) => {
    if (!name) return '';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0][0]}${names[names.length - 1][0]}`;
    }
    return names[0] ? names[0][0] : '';
}

export default function WelcomePage() {
  const { login, currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && currentUser) {
        router.push('/dashboard');
    }
  }, [currentUser, loading, router])

  const handleUserSelect = (userId: string) => {
    login(userId);
  };

  if (loading || currentUser) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#07090e] p-4 relative overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-primary/20 rounded-full blur-[120px]" />
            <Loader2 className="h-12 w-12 animate-spin text-primary relative z-10" />
        </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#080b11] p-4 relative overflow-hidden selection:bg-primary/30">
        {/* Background Decorative Gradients */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[140px] pointer-events-none" />

        <div className="mb-10 flex flex-col items-center gap-3 relative z-10 text-center animate-fade-in">
            <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 p-3 shadow-lg shadow-primary/25 border border-primary/20 hover:scale-105 transition-transform duration-300">
                <PiggyBank className="h-10 w-10 text-white" />
            </div>
            <div className="mt-4 space-y-1">
                <h1 className="text-4xl font-headline font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                    Faminance
                </h1>
                <p className="text-xs text-primary font-semibold tracking-widest uppercase flex items-center justify-center gap-1">
                    <Sparkles className="h-3 w-3" /> Finanzas Familiares Inteligentes
                </p>
            </div>
        </div>

        <Card className="w-full max-w-md bg-[#0d121f]/50 backdrop-blur-xl border border-white/[0.08] shadow-2xl relative z-10 overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent">
            <CardContent className="p-8">
                <h2 className="text-xl font-bold text-center mb-8 font-headline text-white tracking-wide">
                    ¿Quién está usando la app hoy?
                </h2>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {users.map((user, idx) => (
                    <Button
                        key={user.id}
                        onClick={() => handleUserSelect(user.id)}
                        variant="outline"
                        className="h-32 text-lg flex flex-col gap-3 bg-[#111728]/40 border-white/[0.05] hover:border-primary/50 hover:bg-[#151d33]/80 text-slate-300 hover:text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 group relative overflow-hidden"
                    >
                        {/* Decorative card glow */}
                        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        
                        <Avatar className="h-12 w-12 border-2 border-white/10 group-hover:border-primary/50 group-hover:scale-105 transition-all duration-300 shadow-md">
                            <AvatarFallback className="bg-gradient-to-tr from-primary/20 to-blue-500/20 text-primary font-bold text-lg">
                                {getInitials(user.name)}
                            </AvatarFallback>
                        </Avatar>
                        <span className="font-headline font-semibold text-sm tracking-wide group-hover:translate-y-[-2px] transition-transform duration-300">{user.name}</span>
                    </Button>
                    ))}
                </div>
            </CardContent>
        </Card>
        
        <p className="mt-8 text-xs text-slate-500 text-center max-w-xs leading-relaxed relative z-10">
            Selecciona tu perfil de acceso familiar para ver presupuestos, transacciones y balances en tiempo real.
        </p>
    </div>
  );
}
