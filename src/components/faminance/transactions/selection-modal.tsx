'use client';

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { iconMap } from "@/lib/data";
import { cn } from "@/lib/utils";
import { ChevronDown, Search } from "lucide-react";

export interface SelectionOption {
    value: string;
    label: string;
    icon: string;
    disabled?: boolean;
    parentId?: string;
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
    const [searchQuery, setSearchQuery] = useState("");

    const handleSelect = (option: SelectionOption) => {
        if (option.disabled) {
            onSelect(option); // Let the parent component handle the disabled logic (e.g. toast)
            return;
        }
        onSelect(option);
        setIsOpen(false);
        setTimeout(() => setSearchQuery(""), 200);
    };

    const TriggerIcon = selected ? iconMap[selected.icon] : null;

    // Filter options based on search
    const filteredOptions = useMemo(() => {
        if (!searchQuery.trim()) return options;
        const query = searchQuery.toLowerCase();
        return options.filter(opt => opt.label.toLowerCase().includes(query));
    }, [options, searchQuery]);

    // Group options by parent
    const groupedOptions = useMemo(() => {
        const hasHierarchy = options.some(o => o.parentId);
        if (!hasHierarchy) return { isFlat: true, items: filteredOptions };

        const rootOptions = filteredOptions.filter(o => !o.parentId);
        const subOptions = filteredOptions.filter(o => o.parentId);
        
        const groups: { parent: SelectionOption, children: SelectionOption[] }[] = [];
        
        // If we are searching, we might find a subcategory but not the parent. 
        // We will just show matching items. To keep it simple, we group by parent if the parent is also in the list, 
        // otherwise we just show them under a "Resultados" group or their actual parent if we can find it in the original options.
        
        // Let's use the original options to build the tree, then filter the tree
        const allRoots = options.filter(o => !o.parentId);
        
        allRoots.forEach(root => {
            const children = options.filter(o => o.parentId === root.value);
            // Check if root or any child matches search
            const rootMatches = root.label.toLowerCase().includes(searchQuery.toLowerCase());
            const matchingChildren = children.filter(c => c.label.toLowerCase().includes(searchQuery.toLowerCase()));
            
            if (rootMatches || matchingChildren.length > 0) {
                groups.push({
                    parent: root,
                    children: searchQuery.trim() ? matchingChildren : children
                });
            }
        });

        // Add orphans (subcategories whose parent somehow doesn't exist)
        const orphans = filteredOptions.filter(o => o.parentId && !allRoots.some(r => r.value === o.parentId));
        
        return { isFlat: false, groups, orphans };
    }, [options, filteredOptions, searchQuery]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    type="button"
                    variant="outline" 
                    className="w-full justify-start text-left h-auto py-2 bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 transition-colors"
                    disabled={disabled}
                >
                    <div className="flex items-center gap-3 w-full min-w-0">
                         {TriggerIcon && (
                            <div className="flex-shrink-0 h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
                                <TriggerIcon className="h-4 w-4 text-slate-200" />
                            </div>
                        )}
                        <div className="flex-grow min-w-0 overflow-hidden text-left">
                            <p className="text-xs text-slate-500 truncate">{title}</p>
                            <p className="font-semibold truncate text-slate-200">{selected?.label || `Seleccionar`}</p>
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-500 ml-auto flex-shrink-0" />
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-md bg-[#0d121f] border-white/10 text-slate-200 p-0 overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-white/10 bg-[#111827]">
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-lg text-white">Seleccionar {title}</DialogTitle>
                        <DialogDescription className="sr-only">
                            Elija una de las siguientes opciones.
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input 
                            placeholder="Buscar..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus-visible:ring-primary/50"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0 overscroll-contain">
                    {filteredOptions.length === 0 && (
                        <div className="py-8 text-center text-slate-500 text-sm">
                            No se encontraron resultados.
                        </div>
                    )}

                    {groupedOptions.isFlat ? (
                        <div className="grid grid-cols-1 gap-1">
                            {groupedOptions.items?.map((option, index) => {
                                const Icon = iconMap[option.icon];
                                return (
                                    <Button
                                        key={option.value}
                                        type="button"
                                        variant="ghost"
                                        onClick={() => handleSelect(option)}
                                        className={cn(
                                            "w-full justify-start h-auto py-3 px-4 hover:bg-white/5",
                                            option.disabled && "opacity-50 cursor-not-allowed",
                                            selected?.value === option.value && "bg-primary/10 text-primary hover:bg-primary/20"
                                        )}
                                        disabled={option.disabled}
                                    >
                                        <div className="flex items-center gap-3">
                                            {Icon && <div 
                                                className={cn(
                                                    "h-8 w-8 rounded-full flex items-center justify-center border border-white/5 flex-shrink-0",
                                                    option.disabled ? "bg-white/5" : selected?.value === option.value ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-300"
                                                )}
                                            >
                                                <Icon className="h-4 w-4" />
                                            </div>}
                                            <span className="font-medium truncate flex-1 text-left">{option.label}</span>
                                        </div>
                                    </Button>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="space-y-2 pb-4">
                            {groupedOptions.groups?.map(group => {
                                const ParentIcon = iconMap[group.parent.icon];
                                return (
                                    <div key={group.parent.value} className="space-y-1">
                                        {/* Parent Option */}
                                        {(searchQuery.trim() === "" || group.parent.label.toLowerCase().includes(searchQuery.toLowerCase())) && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() => handleSelect(group.parent)}
                                                className={cn(
                                                    "w-full justify-start h-auto py-2.5 px-3 hover:bg-white/5",
                                                    group.parent.disabled && "opacity-50 cursor-not-allowed",
                                                    selected?.value === group.parent.value && "bg-primary/10 text-primary hover:bg-primary/20"
                                                )}
                                                disabled={group.parent.disabled}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {ParentIcon && <div className={cn(
                                                        "h-8 w-8 rounded-full flex items-center justify-center border border-white/5 flex-shrink-0",
                                                        selected?.value === group.parent.value ? "bg-primary/20 text-primary" : "bg-white/10 text-slate-300"
                                                    )}>
                                                        <ParentIcon className="h-4 w-4" />
                                                    </div>}
                                                    <span className="font-semibold truncate flex-1 text-left">{group.parent.label}</span>
                                                </div>
                                            </Button>
                                        )}
                                        
                                        {/* Children Options */}
                                        {group.children.length > 0 && (
                                            <div className="pl-11 pr-2 space-y-1 relative before:absolute before:left-7 before:top-0 before:bottom-4 before:w-px before:bg-white/10">
                                                {group.children.map(child => {
                                                    const ChildIcon = iconMap[child.icon];
                                                    return (
                                                        <Button
                                                            key={child.value}
                                                            type="button"
                                                            variant="ghost"
                                                            onClick={() => handleSelect(child)}
                                                            className={cn(
                                                                "w-full justify-start h-auto py-2 px-3 hover:bg-white/5 relative",
                                                                child.disabled && "opacity-50 cursor-not-allowed",
                                                                selected?.value === child.value && "bg-primary/10 text-primary hover:bg-primary/20"
                                                            )}
                                                            disabled={child.disabled}
                                                        >
                                                            <div className="absolute left-[-16px] top-1/2 w-3 h-px bg-white/10" />
                                                            <div className="flex items-center gap-3">
                                                                {ChildIcon && <div className={cn(
                                                                    "h-6 w-6 rounded-md flex items-center justify-center border border-white/5 flex-shrink-0",
                                                                    selected?.value === child.value ? "bg-primary/20 text-primary" : "bg-white/5 text-slate-400"
                                                                )}>
                                                                    <ChildIcon className="h-3 w-3" />
                                                                </div>}
                                                                <span className="text-sm text-slate-300 truncate flex-1 text-left">{child.label}</span>
                                                            </div>
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                            
                            {/* Orphans */}
                            {groupedOptions.orphans && groupedOptions.orphans.length > 0 && (
                                <div className="space-y-1 pt-2 border-t border-white/5">
                                    <div className="px-4 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">Otros Resultados</div>
                                    {groupedOptions.orphans.map(orphan => {
                                        const Icon = iconMap[orphan.icon];
                                        return (
                                            <Button
                                                key={orphan.value}
                                                type="button"
                                                variant="ghost"
                                                onClick={() => handleSelect(orphan)}
                                                className={cn(
                                                    "w-full justify-start h-auto py-2 px-4 hover:bg-white/5",
                                                    selected?.value === orphan.value && "bg-primary/10 text-primary hover:bg-primary/20"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    {Icon && <div className="h-8 w-8 rounded-full flex items-center justify-center bg-white/10 text-slate-300">
                                                        <Icon className="h-4 w-4" />
                                                    </div>}
                                                    <span className="text-sm">{orphan.label}</span>
                                                </div>
                                            </Button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
