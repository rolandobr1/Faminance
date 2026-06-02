'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PiggyBank, Target, ArrowRightLeft, Sparkles, CreditCard, ChevronRight } from "lucide-react";
import Link from "next/link";

export function OnboardingCard() {
  return (
    <Card className="relative overflow-hidden rounded-3xl p-2 glass-card border border-primary/20 shadow-xl col-span-full">
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] right-[-10%] h-80 w-80 bg-gradient-to-br from-primary/30 to-purple-500/20 rounded-full blur-3xl opacity-60 pointer-events-none"></div>
      <div className="absolute bottom-[-20%] left-[-10%] h-80 w-80 bg-gradient-to-tr from-cyan-500/20 to-primary/10 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

      <CardHeader className="relative z-10 pb-2">
        <div className="flex items-center gap-2 text-primary font-semibold text-xs tracking-wider uppercase">
          <Sparkles className="h-4 w-4 text-primary animate-pulse" />
          <span>¡Te damos la bienvenida a Faminance!</span>
        </div>
        <CardTitle className="text-2xl sm:text-3xl font-bold font-headline mt-1">
          Comienza tu camino hacia el orden financiero
        </CardTitle>
        <CardDescription className="text-sm max-w-2xl text-muted-foreground mt-2">
          Organiza tu presupuesto familiar en unos pocos pasos. Aquí tienes una guía rápida para configurar tu cuenta y empezar a registrar transacciones.
        </CardDescription>
      </CardHeader>

      <CardContent className="relative z-10 mt-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Step 1 */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/30 hover:bg-card/75 transition-all duration-300 group">
            <div>
              <div className="bg-primary/10 p-3 rounded-xl text-primary w-11 h-11 flex items-center justify-center mb-4 border border-primary/5">
                <CreditCard className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">1. Configurar Cuentas</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registra tus cuentas bancarias, tarjetas de crédito o efectivo para establecer tus saldos iniciales reales.
              </p>
            </div>
            <Link href="/accounts" className="mt-4">
              <Button size="sm" variant="ghost" className="w-full text-xs font-semibold justify-between group/btn text-primary hover:bg-primary/10">
                Ir a Cuentas
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/30 hover:bg-card/75 transition-all duration-300 group">
            <div>
              <div className="bg-primary/10 p-3 rounded-xl text-primary w-11 h-11 flex items-center justify-center mb-4 border border-primary/5">
                <PiggyBank className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">2. Crear Presupuestos</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Define límites mensuales por categorías (ej. comida, entretenimiento) para controlar tus gastos y evitar sorpresas.
              </p>
            </div>
            <Link href="/budgets" className="mt-4">
              <Button size="sm" variant="ghost" className="w-full text-xs font-semibold justify-between group/btn text-primary hover:bg-primary/10">
                Crear Presupuesto
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/30 hover:bg-card/75 transition-all duration-300 group">
            <div>
              <div className="bg-primary/10 p-3 rounded-xl text-primary w-11 h-11 flex items-center justify-center mb-4 border border-primary/5">
                <Target className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">3. Metas de Ahorro</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Establece objetivos de ahorro con plazos específicos (ej. fondo de emergencia, vacaciones familiares).
              </p>
            </div>
            <Link href="/goals" className="mt-4">
              <Button size="sm" variant="ghost" className="w-full text-xs font-semibold justify-between group/btn text-primary hover:bg-primary/10">
                Definir Metas
                <ChevronRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col justify-between p-5 rounded-2xl bg-card/40 border border-border/40 hover:border-primary/30 hover:bg-card/75 transition-all duration-300 group">
            <div>
              <div className="bg-primary/10 p-3 rounded-xl text-primary w-11 h-11 flex items-center justify-center mb-4 border border-primary/5">
                <ArrowRightLeft className="h-5 w-5" />
              </div>
              <h4 className="font-semibold text-sm mb-1 group-hover:text-primary transition-colors">4. Registrar Transacciones</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Registra tus ingresos y gastos diarios. Utiliza los botones flotantes de la esquina inferior derecha.
              </p>
            </div>
            <div className="mt-4">
              <Button size="sm" variant="ghost" className="w-full text-xs font-semibold justify-between group/btn text-primary hover:bg-primary/10" onClick={() => {
                const btn = document.getElementById('floating-add-expense-btn') || document.getElementById('mobile-nav-add-btn');
                if (btn) btn.click();
              }}>
                Comenzar Registro
                <ChevronRight className="h-4 w-4 transition-transform group:hover:translate-x-1" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
