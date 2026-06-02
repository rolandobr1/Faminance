
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useMemo, useState, useEffect } from "react";
import { iconMap } from "@/lib/data";
import { Target, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useFamilyData } from "@/context/family-data-context";
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';


export function SavingsOverview() {
  const { goals } = useFamilyData();
  const [isClient, setIsClient] = useState(false);
  const [timeLeftStrings, setTimeLeftStrings] = useState<Record<string, string>>({});

  useEffect(() => {
    setIsClient(true);
  }, []);

  const goalsWithProgress = useMemo(() => {
    return goals.slice(0,3).map((goal, idx) => ({
      ...goal,
      progress: (goal.currentAmount / goal.targetAmount) * 100,
      icon: goal.icon || ['Home', 'GraduationCap', 'Car'][idx % 3] 
    }));
  }, [goals]);
  
  useEffect(() => {
    if (isClient && goalsWithProgress.length > 0) {
        const newTimeLefts: Record<string, string> = {};
        goalsWithProgress.forEach(goal => {
            newTimeLefts[goal.id] = formatDistanceToNow(parseISO(goal.targetDate), { addSuffix: true, locale: es });
        });
        setTimeLeftStrings(newTimeLefts);
    }
  }, [isClient, goalsWithProgress]);

  const getPriorityColor = (priority: string) => {
    if (priority === 'Alta') return 'text-red-400';
    if (priority === 'Media') return 'text-yellow-400';
    return 'text-green-400';
  }

  return (
    <section>
        <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
                <Target className="h-6 w-6 text-primary" />
                <h2 className="text-xl font-headline font-semibold">Metas de Ahorro</h2>
                {goals.length > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                        {goals.length > 3 ? `3 de ${goals.length}` : `${goals.length}`}
                    </span>
                )}
            </div>
             <Button asChild variant="link" className="text-primary">
                <Link href="/goals">
                    Ver Todas
                    <ArrowRight className="h-4 w-4 ml-2" />
                </Link>
            </Button>
        </div>
        <div className="space-y-4">
          {goalsWithProgress.map(goal => {
              const GoalIcon = iconMap[goal.icon];
              return (
                <Link href="/goals" key={goal.id}>
                    <Card className="bg-card border-border/50 hover:bg-muted transition-colors relative">
                        <CardContent className="p-4">
                             <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    {GoalIcon && <div className="p-2 bg-muted rounded-md"><GoalIcon className="h-5 w-5 text-primary"/></div>}
                                    <div>
                                        <p className="font-semibold font-headline">{goal.name}</p>
                                        <div className="flex items-center gap-1.5">
                                            <div className={cn("h-2 w-2 rounded-full", getPriorityColor(goal.priority).replace('text-', 'bg-'))}></div>
                                            <p className={cn("text-xs font-semibold", getPriorityColor(goal.priority))}>Prioridad {goal.priority}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-primary">{goal.progress.toFixed(0)}%</p>
                                    <p className="text-xs text-muted-foreground">completado</p>
                                </div>
                            </div>

                            <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted mb-1">
                                <div className="absolute h-full bg-gradient-to-r from-purple-500 to-cyan-500" style={{ width: `${goal.progress}%` }}></div>
                            </div>
                            
                            <div className="flex justify-between text-xs items-end">
                                <span className="font-medium text-muted-foreground">
                                    {goal.currentAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                </span>
                                <span className="font-bold">
                                    {goal.targetAmount.toLocaleString('es-DO', { style: 'currency', currency: 'DOP' })}
                                </span>
                            </div>
                              <p className="text-xs text-muted-foreground mt-2">
                                Fecha objetivo: {new Date(goal.targetDate).toLocaleDateString('es-ES')} {isClient && timeLeftStrings[goal.id] ? `(${timeLeftStrings[goal.id]})` : ''}
                             </p>
                        </CardContent>
                    </Card>
                </Link>
            )
          })}
        </div>
    </section>
  );
}
