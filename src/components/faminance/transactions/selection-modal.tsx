'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { iconMap } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

export interface SelectionOption {
    value: string;
    label: string;
    icon: string;
    disabled?: boolean;
}

interface SelectionModalProps {
    title: string;
    options: SelectionOption[];
    selected?: SelectionOption;
    onSelect: (option: any) => void;
    disabled?: boolean;
}

export function SelectionModal({ title, options, selected, onSelect, disabled = false }: SelectionModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = (option: SelectionOption) => {
        if (option.disabled) {
            onSelect(option); // Let the parent component handle the disabled logic (e.g. toast)
            return;
        }
        onSelect(option);
        setIsOpen(false);
    };

    const TriggerIcon = selected ? iconMap[selected.icon] : null;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    type="button"
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2"
                    disabled={disabled}
                >
                    <div className="flex items-center gap-3 w-full">
                         {TriggerIcon && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                                <TriggerIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                        <div className="flex-grow">
                            <p className="text-xs text-muted-foreground">{title}</p>
                            <p className="font-semibold truncate">{selected?.label || `Seleccionar`}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto" />
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Seleccionar {title}</DialogTitle>
                    <DialogDescription className="sr-only">
                        Elija una de las siguientes opciones.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-3 gap-3 py-4 max-h-[60vh] overflow-y-auto">
                    {options.map((option, index) => {
                        const Icon = iconMap[option.icon];
                        return (
                            <Button
                                key={option.value}
                                type="button"
                                variant="outline"
                                onClick={() => handleSelect(option)}
                                className={cn(
                                    "h-24 flex flex-col items-center justify-center gap-2 text-center",
                                    option.disabled && "opacity-50 cursor-not-allowed"
                                )}
                                disabled={option.disabled}
                            >
                                {Icon && <div 
                                    className={cn(
                                        "h-8 w-8 rounded-full flex items-center justify-center",
                                        option.disabled ? "bg-muted" : `bg-chart-${(index % 10) + 1}`
                                    )}
                                    style={!option.disabled ? { 
                                        backgroundColor: `hsl(var(--chart-${(index % 10) + 1}))`, 
                                        color: 'hsl(var(--primary-foreground))'
                                     } : {}}
                                >
                                    <Icon className={cn("h-5 w-5", option.disabled && "text-muted-foreground")} />
                                </div>}
                                <span className="text-xs leading-tight">{option.label}</span>
                            </Button>
                        )
                    })}
                </div>
            </DialogContent>
        </Dialog>
    )
}
