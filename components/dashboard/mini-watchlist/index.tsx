"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import {
    RefreshCw, ChevronDown, Plus, LayoutGrid, Search, MoreHorizontal,
    X, ListPlus, Upload, Check, List, ListChecks, Pin, Trash2, Edit2
} from "lucide-react";
import { GoTag } from "react-icons/go";
import Link from "next/link";
import { createPortal } from "react-dom";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { getPinnedSymbols, type PinnedSymbol } from "@/lib/pinned-symbols";
import { getCreatedLists, addCreatedList, updateCreatedList, deleteCreatedList, type CreatedList } from "@/lib/watchlist-store";
import { StockLogo } from "@/components/ui/stock-logo";

// ─── Types ───────────────────────────────────────────────────────────────────

interface WatchlistItem {
    id: string;
    symbol: string;
    name?: string;
    price: number;
    change: number;
    changePercent: number;
    category?: string;
}

interface WatchlistCategory {
    name: string;
    items: WatchlistItem[];
    isFlag?: boolean;
    flagColor?: FlagColor;
    isCustom?: boolean;
}

type FlagColor = "red" | "blue" | "green" | "yellow" | "orange";

// CreatedList type is now imported from @/lib/watchlist-store

// ─── Constants ────────────────────────────────────────────────────────────────

const FLAG_META: Record<FlagColor, { label: string; bg: string; text: string; dot: string; ring: string }> = {
    red: { label: "Red", bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500", ring: "ring-red-400" },
    blue: { label: "Blue", bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-500", ring: "ring-blue-400" },
    green: { label: "Green", bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500", ring: "ring-emerald-400" },
    yellow: { label: "Yellow", bg: "bg-yellow-500/10", text: "text-yellow-400", dot: "bg-yellow-500", ring: "ring-yellow-400" },
    orange: { label: "Orange", bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500", ring: "ring-orange-400" },
};
const FLAG_COLORS: FlagColor[] = ["red", "blue", "green", "yellow", "orange"];

// ─── Sub-components ───────────────────────────────────────────────────────────

/** SVG flag-on-a-pole shape */
function FlagPin({ color, size = 14, active = false }: { color: string; size?: number; active?: boolean }) {
    return (
        <svg
            width={size} height={size}
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "inline-block", flexShrink: 0 }}
        >
            {/* Pole */}
            <line x1="2.5" y1="1" x2="2.5" y2="13" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            {/* Flag body — triangular pennant */}
            <path d="M2.5 2 L11 5 L2.5 8 Z" fill={color} opacity={active ? 1 : 0.85} />
        </svg>
    );
}

/** Color hex values for SVG (can't use Tailwind classes inside SVG fill) */
const FLAG_SVG_COLOR: Record<FlagColor, string> = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#10b981",
    yellow: "#eab308",
    orange: "#f97316",
};

function SplitPrice({ price, positive }: { price: number; positive: boolean }) {
    const formatted = price.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return (
        <span className="font-mono text-xs font-medium text-foreground">
            {formatted.slice(0, -1)}
            <span className={positive ? "text-emerald-400" : "text-red-400"}>{formatted.slice(-1)}</span>
        </span>
    );
}

interface ContextMenuProps {
    x: number; y: number;
    onClose: () => void;
    onCreateList: () => void;
    onCreateSection: () => void;
    onUploadList: () => void;
}
function ContextMenu({ x, y, onClose, onCreateList, onCreateSection, onUploadList }: ContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        setTimeout(() => document.addEventListener("mousedown", h), 0);
        return () => document.removeEventListener("mousedown", h);
    }, [onClose]);

    const style: React.CSSProperties = {
        position: "fixed",
        left: Math.min(x, window.innerWidth - 200),
        top: Math.min(y, window.innerHeight - 120),
        zIndex: 9999,
    };

    return (
        <div ref={ref} style={style}
            className="w-48 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl py-1.5 text-sm"
        >
            <button onClick={() => { onCreateList(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 transition-colors text-left border-b border-border/10">
                <ListPlus className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs">Create new list…</span>
            </button>
            <button onClick={() => { onCreateSection(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 transition-colors text-left border-b border-border/10">
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs">Create new section…</span>
            </button>
            <button onClick={() => { onUploadList(); onClose(); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/40 transition-colors text-left">
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs">Upload list…</span>
            </button>
        </div>
    );
}

// ─── Create List Modal ────────────────────────────────────────────────────────

function CreateListModal({ onConfirm, onClose }: { onConfirm: (name: string) => void; onClose: () => void }) {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const submit = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onConfirm(trimmed);
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center"
            style={{ background: "oklch(0 0 0 / 0.55)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-80 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-4"
                style={{ animation: "modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                            <ListChecks className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">New Watchlist</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground font-medium">List name</label>
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") submit(); }}
                        placeholder="e.g. My Tech Picks"
                        className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={!value.trim()}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Create
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.92) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}

// ─── Create Section Modal ─────────────────────────────────────────────────────

function CreateSectionModal({ onConfirm, onClose }: { onConfirm: (name: string) => void; onClose: () => void }) {
    const [value, setValue] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const submit = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onConfirm(trimmed);
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center"
            style={{ background: "oklch(0 0 0 / 0.55)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-80 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-4"
                style={{ animation: "modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                            <LayoutGrid className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">New Section</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground font-medium">Section name</label>
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") submit(); }}
                        placeholder="e.g. My Favorites"
                        className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-end">
                    <button
                        onClick={onClose}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={submit}
                        disabled={!value.trim()}
                        className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        Create
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.92) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}

// ─── Add Symbol Modal ─────────────────────────────────────────────────────────

function AddSymbolModal({
    onConfirm,
    onClose,
    searchPool
}: {
    onConfirm: (symbols: string[]) => void;
    onClose: () => void;
    searchPool: WatchlistItem[];
}) {
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<WatchlistItem[]>([]);
    const [suggestions, setSuggestions] = useState<WatchlistItem[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    useEffect(() => {
        if (!query.trim()) {
            setSuggestions([]);
            return;
        }
        const lower = query.toLowerCase();
        const filtered = searchPool
            .filter(item =>
                (item.symbol.toLowerCase().includes(lower) || (item.name?.toLowerCase().includes(lower))) &&
                !selected.some(s => s.id === item.id)
            )
            .slice(0, 8);
        setSuggestions(filtered);
    }, [query, searchPool, selected]);

    const addStock = (item: WatchlistItem) => {
        setSelected(prev => [...prev, item]);
        setQuery("");
        inputRef.current?.focus();
    };

    const removeStock = (itemId: string) => {
        setSelected(prev => prev.filter(s => s.id !== itemId));
    };

    const submit = () => {
        if (selected.length === 0) return;
        onConfirm(selected.map(s => s.symbol));
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
            style={{ background: "oklch(0 0 0 / 0.55)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-md rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-5"
                style={{ animation: "modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <span className="text-sm font-semibold block">Add Symbols</span>
                            <span className="text-[10px] text-muted-foreground/60 leading-tight">Search and select stocks to add</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted/50 text-muted-foreground transition-colors"><X className="w-4 h-4" /></button>
                </div>

                <div className="flex flex-col gap-3">
                    {/* Tags Area */}
                    {selected.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 p-2 rounded-xl bg-muted/20 border border-border/40 min-h-[44px]">
                            {selected.map(item => (
                                <div key={item.id} className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-primary/10 border border-primary/20 text-xs font-medium animate-in fade-in zoom-in duration-200">
                                    <span className="text-primary">{item.symbol}</span>
                                    <button onClick={() => removeStock(item.id)} className="hover:text-red-400 text-muted-foreground/60 transition-colors">
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Search Input */}
                    <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/60">
                            <Search size={14} />
                        </div>
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === "Enter" && suggestions.length > 0) {
                                    addStock(suggestions[0]);
                                } else if (e.key === "Backspace" && !query && selected.length > 0) {
                                    removeStock(selected[selected.length - 1].id);
                                }
                            }}
                            placeholder={selected.length > 0 ? "Add more..." : "Type symbol or company name..."}
                            className="w-full rounded-xl border border-border/60 bg-muted/40 pl-9 pr-4 py-2.5 text-sm outline-none focus:border-primary/60 focus:ring-4 focus:ring-primary/10 transition-all"
                        />

                        {/* Suggestions Dropdown */}
                        {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl py-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
                                {suggestions.map(item => (
                                    <button
                                        key={item.id}
                                        onClick={() => addStock(item)}
                                        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/60 transition-colors text-left group"
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-xs font-semibold group-hover:text-primary transition-colors">{item.symbol}</span>
                                            {item.name && <span className="text-[10px] text-muted-foreground/60 truncate max-w-[200px]">{item.name}</span>}
                                        </div>
                                        <div className="px-1.5 py-0.5 rounded bg-muted/40 text-[9px] font-bold text-muted-foreground/60 uppercase tracking-tighter">
                                            {item.id.split('-')[0]}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 justify-end pt-2">
                    <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors">Cancel</button>
                    <button
                        onClick={submit}
                        disabled={selected.length === 0}
                        className="px-6 py-2 rounded-xl text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 shadow-lg shadow-primary/20 transition-all disabled:opacity-40 disabled:shadow-none"
                    >
                        Add {selected.length} {selected.length === 1 ? 'Stock' : 'Stocks'}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}

// ─── Edit Modal ──────────────────────────────────────────────────────────

function EditModal({
    initialName,
    title,
    label,
    onConfirm,
    onDelete,
    onClose
}: {
    initialName: string;
    title: string;
    label: string;
    onConfirm: (name: string) => void;
    onDelete?: () => void;
    onClose: () => void
}) {
    const [value, setValue] = useState(initialName);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const submit = () => {
        const trimmed = value.trim();
        if (!trimmed) return;
        onConfirm(trimmed);
        onClose();
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center"
            style={{ background: "oklch(0 0 0 / 0.55)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-80 rounded-2xl border border-border/60 bg-card/90 backdrop-blur-xl shadow-2xl p-6 flex flex-col gap-4"
                style={{ animation: "modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center">
                            <Edit2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-semibold">{title}</span>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Input */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-muted-foreground font-medium">List name</label>
                    <input
                        ref={inputRef}
                        value={value}
                        onChange={e => setValue(e.target.value)}
                        onKeyDown={e => { if (e.key === "Enter") submit(); }}
                        className="w-full rounded-lg border border-border/60 bg-muted/30 px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                </div>

                {/* Actions */}
                <div className="flex gap-2 justify-between mt-2">
                    {onDelete ? (
                        <button
                            onClick={() => { onDelete(); onClose(); }}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                        </button>
                    ) : <div />}
                    <div className="flex gap-2">
                        <button
                            onClick={onClose}
                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted/40 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={submit}
                            disabled={!value.trim()}
                            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
                        >
                            Save
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes modalIn {
                    from { opacity: 0; transform: scale(0.92) translateY(8px); }
                    to   { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </div>,
        document.body
    );
}

interface TabContextMenuProps {
    x: number; y: number;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
}
function TabContextMenu({ x, y, onClose, onEdit, onDelete }: TabContextMenuProps) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); };
        setTimeout(() => document.addEventListener("mousedown", h), 0);
        return () => document.removeEventListener("mousedown", h);
    }, [onClose]);

    return (
        <div
            ref={ref}
            style={{ position: "fixed", left: x, top: y, zIndex: 9999 }}
            className="w-40 rounded-xl border border-border/60 bg-card/95 backdrop-blur-md shadow-2xl py-1 text-sm"
        >
            <button onClick={() => { onEdit(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/40 transition-colors text-left">
                <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-xs">Rename...</span>
            </button>
            <button onClick={() => { onDelete(); onClose(); }} className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-red-500/10 transition-colors text-left text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
                <span className="text-xs">Delete list</span>
            </button>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

type ActiveTab = "all" | FlagColor | string; // string = created list id

function MiniWatchlistContent() {
    const [rawCategories, setRawCategories] = useState<WatchlistCategory[]>([]);
    const [searchPool, setSearchPool] = useState<WatchlistItem[]>([]);
    const [createdLists, setCreatedLists] = useState<CreatedList[]>([]);
    const [activeTab, setActiveTab] = useState<ActiveTab>("all");
    const [loading, setLoading] = useState(true);
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
    const [headerMenu, setHeaderMenu] = useState<{ x: number; y: number } | null>(null);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showCreateSectionModal, setShowCreateSectionModal] = useState(false);
    const [showAddSymbolModal, setShowAddSymbolModal] = useState(false);
    const [pinnedSymbols, setPinnedSymbols] = useState<PinnedSymbol[]>([]);
    const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [editingList, setEditingList] = useState<CreatedList | null>(null);
    const [editingSection, setEditingSection] = useState<{ id: string, name: string } | null>(null);
    const [tabMenu, setTabMenu] = useState<{ x: number, y: number, listId: string } | null>(null);
    const [selectedSectionForAdd, setSelectedSectionForAdd] = useState<string | null>(null);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const scrollRef = useRef<HTMLDivElement>(null);
    const trackRef = useRef<HTMLDivElement>(null);
    const tabsRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const dragStartY = useRef(0);
    const dragStartScroll = useRef(0);
    const [thumbHeight, setThumbHeight] = useState(40);
    const [thumbTop, setThumbTop] = useState(0);
    const [scrolling, setScrolling] = useState(false);
    const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const toNum = (val: any) => { const n = parseFloat(val); return isNaN(n) ? 0 : n; };

    const fetchData = async () => {
        setLoading(true);
        try {
            const [bseRes, nseRes, usRes, cryptoRes, commodityRes] = await Promise.all([
                fetch("/api/watchlist/bse"), fetch("/api/watchlist/nse"),
                fetch("/api/watchlist/us"), fetch("/api/watchlist/crypto"),
                fetch("/api/watchlist/commodity"),
            ]);
            const [bseData, nseData, usData, cryptoData, commodityData] = await Promise.all([
                bseRes.json(), nseRes.json(), usRes.json(), cryptoRes.json(), commodityRes.json(),
            ]);
            setRawCategories([
                { name: "BSE STOCKS", items: Object.entries(bseData).slice(0, 5).map(([code, d]: [string, any]) => ({ id: `bse-${code}`, symbol: code, name: d.symbol, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })) },
                { name: "NSE STOCKS", items: Object.entries(nseData).slice(0, 5).map(([sym, d]: [string, any]) => ({ id: `nse-${sym}`, symbol: sym, name: d.name, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })) },
                { name: "US MARKETS", items: Object.entries(usData).slice(0, 5).map(([sym, d]: [string, any]) => ({ id: `us-${sym}`, symbol: sym, name: d.name, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })) },
                { name: "CRYPTO", items: Object.entries(cryptoData).slice(0, 5).map(([sym, d]: [string, any]) => ({ id: `crypto-${sym}`, symbol: sym, name: d.name, price: toNum(d.price), change: toNum(d.change24h), changePercent: toNum(d.percent24h) })) },
                { name: "COMMODITIES", items: Object.entries(commodityData).slice(0, 5).map(([sym, d]: [string, any]) => ({ id: `commodity-${sym}`, symbol: sym, name: sym, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })) },
            ]);

            // Build full search pool (without slice)
            setSearchPool([
                ...Object.entries(bseData).map(([code, d]: [string, any]) => ({ id: `bse-${code}`, symbol: code, name: d.symbol, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })),
                ...Object.entries(nseData).map(([sym, d]: [string, any]) => ({ id: `nse-${sym}`, symbol: sym, name: d.name, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })),
                ...Object.entries(usData).map(([sym, d]: [string, any]) => ({ id: `us-${sym}`, symbol: sym, name: d.name, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })),
                ...Object.entries(cryptoData).map(([sym, d]: [string, any]) => ({ id: `crypto-${sym}`, symbol: sym, name: d.name, price: toNum(d.price), change: toNum(d.change24h), changePercent: toNum(d.percent24h) })),
                ...Object.entries(commodityData).map(([sym, d]: [string, any]) => ({ id: `commodity-${sym}`, symbol: sym, name: sym, price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent) })),
            ]);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    // ── Listen for pinned symbols and custom lists changes ──
    useEffect(() => {
        const syncPinned = () => setPinnedSymbols(getPinnedSymbols());
        const syncLists = () => setCreatedLists(getCreatedLists());
        syncPinned();
        syncLists();
        window.addEventListener("pinned-symbols-changed", syncPinned);
        window.addEventListener("custom-watchlists-changed", syncLists);
        return () => {
            window.removeEventListener("pinned-symbols-changed", syncPinned);
            window.removeEventListener("custom-watchlists-changed", syncLists);
        };
    }, []);

    // ── Sync activeTab with URL ──
    useEffect(() => {
        const tab = searchParams.get("tab");
        if (tab && pathname === "/watchlist") {
            setActiveTab(tab as ActiveTab);
        }
    }, [searchParams, pathname]);

    const handleTabChange = (tabId: ActiveTab) => {
        setActiveTab(tabId);
        if (pathname === "/watchlist") {
            router.push(`/watchlist?tab=${tabId}`);
        }
    };

    // ── Derived: all items flat (searchPool + pinned, deduped by id) ──
    const pinnedAsItems: WatchlistItem[] = pinnedSymbols.map(p => ({
        id: p.id, symbol: p.symbol, name: p.name,
        price: p.price, change: p.change, changePercent: p.changePercent,
        category: p.category
    }));
    const pinnedIds = new Set(pinnedSymbols.map(p => p.id));

    // We combine the active market data (rawCategories) with everything from searchPool
    // priority: pinned > searchPool
    const allItemsWithPinned = [
        ...pinnedAsItems,
        ...searchPool.filter(i => !pinnedIds.has(i.id)),
    ];

    // ── Derived: active flag colors — check the persistent store ──
    const activeFlagColors = FLAG_COLORS.filter(color =>
        pinnedSymbols.some(p => p.color === color)
    );

    // ── Tabs definition ──
    const tabs: { id: ActiveTab; label: string; flagColor?: FlagColor }[] = [
        { id: "all", label: "All" },
        ...activeFlagColors.map(color => ({ id: color as ActiveTab, label: FLAG_META[color].label, flagColor: color as FlagColor })),
        ...createdLists.map(l => ({ id: l.id, label: l.name })),
    ];

    // ── Displayed categories based on active tab ──
    const displayedCategories: WatchlistCategory[] = (() => {
        if (activeTab === "pinned") {
            return pinnedSymbols.length > 0
                ? [{ name: "TAGGED", isFlag: false, items: pinnedAsItems }]
                : [];
        }
        if (activeTab === "all") {
            // Include both market categories and any custom sections added to rawCategories
            return rawCategories.map(cat => {
                const taggedInCat = pinnedSymbols.filter(p => p.category === cat.name);
                const existingIds = new Set(cat.items.map(i => i.id));
                const missingTagged = taggedInCat
                    .filter(t => !existingIds.has(t.id))
                    .map(t => ({
                        id: t.id, symbol: t.symbol, name: t.name, price: t.price, change: t.change, changePercent: t.changePercent
                    }));

                return {
                    ...cat,
                    items: [...missingTagged, ...cat.items]
                };
            });
        }
        if (FLAG_COLORS.includes(activeTab as FlagColor)) {
            const color = activeTab as FlagColor;
            // Return category-wise filtered items
            return rawCategories.map(cat => {
                const taggedInColor = pinnedSymbols.filter(p => p.category === cat.name && p.color === color);
                const items = taggedInColor.map(t => ({
                    id: t.id, symbol: t.symbol, name: t.name, price: t.price, change: t.change, changePercent: t.changePercent
                }));
                return items.length > 0 ? { ...cat, items } : null;
            }).filter(Boolean) as WatchlistCategory[];
        }
        // Created list — support sections and categorization
        const list = createdLists.find(l => l.id === activeTab);
        if (list) {
            const results: WatchlistCategory[] = [];

            // 1. Custom Sections
            if (list.sections && list.sections.length > 0) {
                list.sections.forEach(s => {
                    const items = allItemsWithPinned.filter(i => s.itemIds.includes(i.id));
                    results.push({ name: s.name, items, isCustom: true });
                });
            }

            // 2. Legacy items or items not in any section (Grouped by Category)
            const items = allItemsWithPinned.filter(i => list.itemIds.includes(i.id));
            if (items.length > 0) {
                // Group by category
                const grouped: Record<string, WatchlistItem[]> = {};
                items.forEach(item => {
                    const cat = item.category || "Other";
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push(item);
                });

                Object.entries(grouped).forEach(([catName, catItems]) => {
                    results.push({ name: catName, items: catItems, isCustom: true });
                });
            }

            return results;
        }
        return rawCategories;
    })();

    // ── Custom scrollbar ──
    const updateThumb = useCallback(() => {
        const el = scrollRef.current; const track = trackRef.current;
        if (!el || !track) return;
        const scrollRange = el.scrollHeight - el.clientHeight;
        const trackH = track.clientHeight;
        const ratio = scrollRange > 0 ? el.clientHeight / el.scrollHeight : 1;
        const h = Math.max(28, ratio * trackH);
        const maxTop = Math.max(0, trackH - h);
        const top = scrollRange > 0 ? (el.scrollTop / scrollRange) * maxTop : 0;
        setThumbHeight(h);
        setThumbTop(isFinite(top) ? Math.min(top, maxTop) : 0);
    }, []);

    const handleScroll = useCallback(() => {
        updateThumb();
        setScrolling(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => setScrolling(false), 1000);
    }, [updateThumb]);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener("scroll", handleScroll, { passive: true });
        const ro = new ResizeObserver(updateThumb);
        ro.observe(el);
        updateThumb();
        return () => { el.removeEventListener("scroll", handleScroll); ro.disconnect(); };
    }, [displayedCategories, collapsed, handleScroll, updateThumb]);

    const onThumbMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        isDragging.current = true;
        dragStartY.current = e.clientY;
        dragStartScroll.current = scrollRef.current?.scrollTop ?? 0;
        setScrolling(true);
        const onMove = (ev: MouseEvent) => {
            if (!isDragging.current || !scrollRef.current || !trackRef.current) return;
            const delta = ev.clientY - dragStartY.current;
            const el = scrollRef.current;
            const scrollRange = el.scrollHeight - el.clientHeight;
            const thumbRange = trackRef.current.clientHeight - thumbHeight;
            if (thumbRange > 0) el.scrollTop = dragStartScroll.current + (delta / thumbRange) * scrollRange;
        };
        const onUp = () => {
            isDragging.current = false;
            if (hideTimer.current) clearTimeout(hideTimer.current);
            hideTimer.current = setTimeout(() => setScrolling(false), 800);
        };
        window.addEventListener("mousemove", onMove);
        window.addEventListener("mouseup", onUp, { once: true });
    };

    const toggleCategory = (name: string) => setCollapsed(prev => ({ ...prev, [name]: !prev[name] }));


    const handleFlag = (itemId: string, color: FlagColor | null) => {
        const item = allItemsWithPinned.find(i => i.id === itemId);
        if (!item) return;

        import("@/lib/pinned-symbols").then(m => {
            if (color) {
                const existing = m.getPinnedSymbols().find(p => p.id === itemId);
                if (existing) {
                    m.setPinnedSymbols(m.getPinnedSymbols().map(p => p.id === itemId ? { ...p, color } : p));
                } else {
                    m.addPinnedSymbol({
                        id: item.id, symbol: item.symbol, name: item.name,
                        category: (item as any).category || (rawCategories.find(c => c.items.some(i => i.id === itemId))?.name) || "Watchlist",
                        price: item.price, change: item.change, changePercent: item.changePercent,
                        color
                    });
                }
            } else {
                m.removePinnedSymbol(itemId);
            }
        });
    };

    // Cycle through tag colors on click, or untag if already on last color
    const handleTagCycle = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        const currentPinned = pinnedSymbols.find(p => p.id === itemId);
        const current = currentPinned?.color as FlagColor | undefined;
        const idx = current ? FLAG_COLORS.indexOf(current) : -1;
        const next = idx < FLAG_COLORS.length - 1 ? FLAG_COLORS[idx + 1] : null;
        handleFlag(itemId, next);
    };

    const handleRemove = (e: React.MouseEvent, itemId: string) => {
        e.stopPropagation();
        setRemovedIds(prev => new Set([...prev, itemId]));
    };

    const handleCreateList = () => {
        setHeaderMenu(null);
        setShowCreateModal(true);
    };

    const confirmCreateList = (name: string) => {
        const newList = addCreatedList(name);
        handleTabChange(newList.id);
    };

    const handleCreateSection = () => {
        setHeaderMenu(null);
        setShowCreateSectionModal(true);
    };

    const confirmCreateSection = (name: string) => {
        if (activeTab.toString().startsWith("list-")) {
            import("@/lib/watchlist-store").then(m => {
                m.addSectionToList(activeTab as string, name);
            });
        } else {
            setRawCategories(prev => [...prev, { name, items: [] }]);
        }
    };

    const handleAddSymbols = (symbols: string[]) => {
        // If it's a custom list (tab)
        const currentList = createdLists.find(l => l.id === activeTab);
        if (currentList) {
            import("@/lib/watchlist-store").then(m => {
                const targetSection = selectedSectionForAdd || (currentList.sections ? currentList.sections[currentList.sections.length - 1]?.name : undefined);
                symbols.forEach(s => {
                    // Try to guess type or find in search pool
                    const found = searchPool.find(i => i.symbol.toUpperCase() === s);
                    const id = found ? found.id : `nse-${s}`;
                    m.addItemToList(currentList.id, id, targetSection);
                });
                setSelectedSectionForAdd(null);
            });
            return;
        }

        // If it's a section in the "All" view or current view
        // We'll add it to the LAST section created if no specific one is targeted,
        // or just the first custom one we find.
        setRawCategories(prev => {
            const next = [...prev];
            const targetSection = next.find(c => c.items.length === 0) || next[next.length - 1];
            if (targetSection) {
                const newItems = symbols.map(s => {
                    const found = searchPool.find(i => i.symbol.toUpperCase() === s);
                    return found || {
                        id: `nse-${s}`,
                        symbol: s,
                        name: s,
                        price: 0,
                        change: 0,
                        changePercent: 0
                    };
                });
                targetSection.items = [...targetSection.items, ...newItems];
            }
            return next;
        });
    };

    const fmtChange = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}`;
    const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`;

    return (
        <>
            <div className="flex-1 min-h-0 flex flex-col border border-border/60 rounded-xl bg-card overflow-hidden shadow-sm">

                {/* ── Top header ── */}
                <div className="flex items-center justify-between px-3 py-2.5 border-b border-border/50 shrink-0">
                    <button
                        className="flex items-center gap-1 hover:opacity-80 transition-opacity"
                        onClick={(e) => {
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                            setHeaderMenu(headerMenu ? null : { x: rect.left, y: rect.bottom + 4 });
                        }}
                    >
                        <span className="text-sm font-semibold">Watchlist</span>
                        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${headerMenu ? "rotate-180" : ""}`} />
                    </button>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <button onClick={fetchData} title="Refresh" className="hover:text-foreground transition-colors">
                            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                        <Link href="/watchlist" className="hover:text-foreground transition-colors" title="Manage tags">
                            <Plus className="w-3.5 h-3.5" />
                        </Link>
                        <button
                            onClick={() => router.push("/watchlist")}
                            className="hover:text-foreground transition-colors"
                            title="Open full watchlist"
                        >
                            <LayoutGrid className="w-3.5 h-3.5" />
                        </button>
                        <button className="hover:text-foreground transition-colors">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* ── List / Tagged tabs ── */}
                <div
                    ref={tabsRef}
                    className="flex items-center gap-1 px-2 py-1.5 border-b border-border/40 overflow-x-auto shrink-0 no-scrollbar"
                >
                    {tabs.map(tab => {
                        const isActive = activeTab === tab.id;
                        const isCustom = tab.id.toString().startsWith("list-");
                        return (
                            <div
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                onContextMenu={(e) => {
                                    if (isCustom) {
                                        e.preventDefault();
                                        setTabMenu({ x: e.clientX, y: e.clientY, listId: tab.id.toString() });
                                    }
                                }}
                                className={`group flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all shrink-0 relative cursor-pointer ${isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                                    }`}
                            >
                                {tab.flagColor && (
                                    <GoTag
                                        size={10}
                                        style={{ color: FLAG_SVG_COLOR[tab.flagColor], flexShrink: 0 }}
                                    />
                                )}
                                {tab.label}
                                {isCustom && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            const list = createdLists.find(l => l.id === tab.id);
                                            if (list) setEditingList(list);
                                        }}
                                        className={`ml-1 p-0.5 rounded-full hover:bg-black/20 dark:hover:bg-white/10 transition-opacity ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}
                                    >
                                        <ChevronDown size={10} />
                                    </button>
                                )}
                            </div>
                        );
                    })}
                    {/* Add symbol button */}
                    <button
                        onClick={() => setShowAddSymbolModal(true)}
                        className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-all shrink-0 ml-auto"
                        title="Add symbols to current list/section"
                    >
                        <Plus className="w-3 h-3" />
                    </button>
                </div>

                {/* ── Column headers ── */}
                <div className="px-2 py-1.5 border-b border-border/20 shrink-0" style={{ display: "grid", gridTemplateColumns: "20px 24px 1fr 64px 48px 60px", alignItems: "center", gap: "6px" }}>
                    <span />
                    <span />
                    <span className="text-[10px] text-muted-foreground/60 font-medium">Symbol</span>
                    <span className="text-[10px] text-muted-foreground/60 font-medium text-right">Last</span>
                    <span className="text-[10px] text-muted-foreground/60 font-medium text-right">Chg</span>
                    <span className="text-[10px] text-muted-foreground/60 font-medium text-right pr-5">Chg%</span>
                </div>

                {/* ── Scrollable body ── */}
                <div className="flex flex-1 min-h-0 relative">
                    <div
                        ref={scrollRef}
                        className="flex-1 overflow-y-auto"
                        style={{ scrollbarWidth: "none" } as React.CSSProperties}
                    >
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <RefreshCw className="w-4 h-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : displayedCategories.length === 0 ? (
                            <div
                                className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground group"
                                onDoubleClick={(e) => {
                                    if (activeTab.toString().startsWith("list-")) {
                                        e.stopPropagation();
                                        handleCreateSection();
                                    }
                                }}
                            >
                                <div className="w-12 h-12 rounded-2xl bg-muted/20 flex items-center justify-center border border-dashed border-border/60 group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                                    <LayoutGrid className="w-6 h-6 opacity-20 group-hover:opacity-40" />
                                </div>
                                <div className="flex flex-col items-center gap-1 px-4 text-center">
                                    <p className="text-xs font-medium text-foreground/80">Empty Watchlist</p>
                                    <p className="text-[10px] opacity-60 max-w-[160px]">Create a section to start organizing your stocks</p>
                                </div>
                                {activeTab.toString().startsWith("list-") && (
                                    <button
                                        onClick={handleCreateSection}
                                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all border border-primary/20"
                                    >
                                        <Plus className="w-3 h-3" />
                                        Create New Section
                                    </button>
                                )}
                            </div>
                        ) : (
                            displayedCategories.map((cat) => {
                                const isCollapsed = !!collapsed[cat.name];
                                const flagMeta = cat.isFlag && cat.flagColor ? FLAG_META[cat.flagColor] : null;
                                return (
                                    <div key={cat.name}>
                                        <div
                                            className="group/header w-full flex items-center justify-between px-3 py-1.5 hover:bg-muted/30 transition-colors sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border/20"
                                        >
                                            <div className="flex flex-1 items-center gap-1.5 min-w-0">
                                                <button
                                                    onClick={() => toggleCategory(cat.name)}
                                                    className="p-1 -ml-1 hover:bg-muted/50 rounded transition-colors"
                                                >
                                                    <ChevronDown className={`w-3 h-3 text-muted-foreground/50 shrink-0 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`} />
                                                </button>

                                                {flagMeta ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <GoTag size={12} style={{ color: FLAG_SVG_COLOR[cat.flagColor!], flexShrink: 0 }} />
                                                        <input
                                                            className={`bg-transparent border-none outline-none text-[10px] font-bold uppercase tracking-widest ${flagMeta.text} w-full focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1`}
                                                            defaultValue={cat.name}
                                                            onBlur={(e) => {
                                                                if (e.target.value && e.target.value !== cat.name) {
                                                                    if (activeTab.toString().startsWith("list-")) {
                                                                        import("@/lib/watchlist-store").then(m => {
                                                                            m.updateSectionName(activeTab as string, cat.name, e.target.value);
                                                                        });
                                                                    } else {
                                                                        setRawCategories(prev => prev.map(p => p.name === cat.name ? { ...p, name: e.target.value } : p));
                                                                    }
                                                                }
                                                            }}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                                            }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <input
                                                        className="bg-transparent border-none outline-none text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 w-full focus:text-foreground focus:ring-1 focus:ring-primary/20 rounded px-1 -mx-1"
                                                        defaultValue={cat.name}
                                                        onBlur={(e) => {
                                                            if (e.target.value && e.target.value !== cat.name) {
                                                                if (activeTab.toString().startsWith("list-")) {
                                                                    import("@/lib/watchlist-store").then(m => {
                                                                        m.updateSectionName(activeTab as string, cat.name, e.target.value);
                                                                    });
                                                                } else {
                                                                    setRawCategories(prev => prev.map(p => p.name === cat.name ? { ...p, name: e.target.value } : p));
                                                                }
                                                            }
                                                        }}
                                                        onKeyDown={(e) => {
                                                            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                                                        }}
                                                    />
                                                )}
                                            </div>

                                            <div className="flex items-center gap-1 opacity-0 group-hover/header:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (activeTab.toString().startsWith("list-")) {
                                                            import("@/lib/watchlist-store").then(m => {
                                                                m.removeSectionFromList(activeTab as string, cat.name);
                                                            });
                                                        } else {
                                                            setRawCategories(prev => prev.filter(p => p.name !== cat.name));
                                                        }
                                                    }}
                                                    className="p-1 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>

                                        {!isCollapsed && (cat.items.length === 0 ? (
                                            <div className="py-8 flex flex-col items-center justify-center gap-2 text-muted-foreground/40 italic">
                                                <button
                                                    onClick={() => {
                                                        setSelectedSectionForAdd(cat.name);
                                                        setShowAddSymbolModal(true);
                                                    }}
                                                    className="group flex flex-col items-center gap-2 hover:text-primary transition-colors"
                                                >
                                                    <div className="w-8 h-8 rounded-full border border-dashed border-border/60 flex items-center justify-center group-hover:border-primary/40 group-hover:bg-primary/5 transition-all">
                                                        <Plus className="w-3.5 h-3.5" />
                                                    </div>
                                                    <span className="text-[10px] font-medium tracking-tight">Add Symbol</span>
                                                </button>
                                            </div>
                                        ) : cat.items
                                            .filter(item => !removedIds.has(item.id))
                                            .map((item, idx, arr) => {
                                                const pos = item.changePercent >= 0;
                                                const clr = pos ? "text-emerald-400" : "text-red-400";
                                                const itemPinned = pinnedSymbols.find(p => p.id === item.id);
                                                const itemFlag = itemPinned?.color as FlagColor | undefined;
                                                const itemFlagMeta = itemFlag ? FLAG_META[itemFlag] : null;
                                                const isHovered = hoveredId === item.id;
                                                return (
                                                    <div
                                                        key={item.id}
                                                        onMouseEnter={() => setHoveredId(item.id)}
                                                        onMouseLeave={() => setHoveredId(null)}
                                                        onClick={() => router.push(`/dashboard/stock/${item.id}`)}
                                                        onDoubleClick={(e) => {
                                                            e.stopPropagation();
                                                            handleCreateSection();
                                                        }}
                                                        className={`px-2 py-1.5 hover:bg-muted/30 transition-colors select-none cursor-pointer ${idx !== arr.length - 1 ? "border-b border-border/10" : ""} ${itemFlagMeta ? itemFlagMeta.bg : ""}`}
                                                        style={{ display: "grid", gridTemplateColumns: "20px 24px 1fr 64px 48px 60px", alignItems: "center", gap: "6px" }}
                                                    >
                                                        {/* Tag icon — col 1 */}
                                                        <button
                                                            onClick={(e) => handleTagCycle(e, item.id)}
                                                            title={itemFlag ? `Tagged: ${FLAG_META[itemFlag].label} (click to cycle)` : "Tag this stock"}
                                                            className="w-5 h-5 flex items-center justify-center rounded transition-opacity"
                                                            style={{ opacity: isHovered || itemFlag ? 1 : 0, pointerEvents: isHovered || !!itemFlag ? "auto" : "none" }}
                                                        >
                                                            <GoTag
                                                                size={12}
                                                                style={{ color: itemFlag ? FLAG_SVG_COLOR[itemFlag] : "var(--muted-foreground)", flexShrink: 0 }}
                                                            />
                                                        </button>

                                                        {/* Logo - col 2 */}
                                                        <div className="flex items-center justify-center">
                                                            <StockLogo symbol={item.symbol} name={item.name} type={item.id.split('-')[0].toUpperCase()} className="w-6 h-6 rounded-full" />
                                                        </div>

                                                        {/* Symbol + name — col 3 */}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-semibold truncate leading-tight">{item.symbol}</p>
                                                            {item.name && <p className="text-[9px] text-muted-foreground/50 truncate leading-tight">{item.name}</p>}
                                                        </div>

                                                        {/* Price — col 3 */}
                                                        <div className="text-right"><SplitPrice price={item.price} positive={pos} /></div>

                                                        {/* Change — col 4 */}
                                                        <div className={`text-right font-mono text-xs font-medium ${clr}`}>{fmtChange(item.change)}</div>

                                                        {/* Chg% + trash — col 5 */}
                                                        <div className="flex items-center justify-end gap-1">
                                                            <span className={`font-mono text-xs font-medium ${clr} whitespace-nowrap`}>{fmtPct(item.changePercent)}</span>
                                                            <button
                                                                onClick={(e) => handleRemove(e, item.id)}
                                                                title="Remove from watchlist"
                                                                className="w-4 h-4 flex items-center justify-center rounded hover:text-red-400 text-muted-foreground/40 transition-all shrink-0"
                                                                style={{ opacity: isHovered ? 1 : 0, pointerEvents: isHovered ? "auto" : "none" }}
                                                            >
                                                                <Trash2 className="w-3 h-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            }))}
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Custom scrollbar */}
                    <div ref={trackRef} className="w-[3px] shrink-0 my-1 mr-0.5 rounded-full relative" style={{ background: "transparent" }}>
                        <div
                            onMouseDown={onThumbMouseDown}
                            className="absolute inset-x-0 rounded-full cursor-grab active:cursor-grabbing"
                            style={{
                                top: thumbTop, height: thumbHeight,
                                background: scrolling ? "oklch(0.65 0.05 240 / 0.7)" : "oklch(0.5 0.03 240 / 0.3)",
                                opacity: scrolling ? 1 : 0.4,
                                transition: "background 0.3s, opacity 0.3s",
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Context menu */}
            {/* Header dropdown menu */}
            {headerMenu && (
                <ContextMenu
                    x={headerMenu.x} y={headerMenu.y}
                    onClose={() => setHeaderMenu(null)}
                    onCreateList={handleCreateList}
                    onCreateSection={handleCreateSection}
                    onUploadList={() => setHeaderMenu(null)}
                />
            )}

            {/* Create section modal */}
            {showCreateSectionModal && (
                <CreateSectionModal
                    onConfirm={confirmCreateSection}
                    onClose={() => setShowCreateSectionModal(false)}
                />
            )}

            {/* Edit modal (shared for lists and sections) */}
            {editingList && (
                <EditModal
                    title="Edit List"
                    label="List name"
                    initialName={editingList.name}
                    onConfirm={(name) => updateCreatedList(editingList.id, name)}
                    onDelete={() => {
                        deleteCreatedList(editingList.id);
                        if (activeTab === editingList.id) handleTabChange("all");
                    }}
                    onClose={() => setEditingList(null)}
                />
            )}

            {editingSection && (
                <EditModal
                    title="Edit Section"
                    label="Section name"
                    initialName={editingSection.name}
                    onConfirm={(name) => {
                        setRawCategories(prev => prev.map(p => p.name === editingSection.id ? { ...p, name } : p));
                    }}
                    onDelete={() => {
                        setRawCategories(prev => prev.filter(p => p.name !== editingSection.id));
                    }}
                    onClose={() => setEditingSection(null)}
                />
            )}

            {/* Create list modal */}
            {showCreateModal && (
                <CreateListModal
                    onConfirm={confirmCreateList}
                    onClose={() => setShowCreateModal(false)}
                />
            )}

            {/* Tab context menu */}
            {tabMenu && (
                <TabContextMenu
                    x={tabMenu.x} y={tabMenu.y}
                    onClose={() => setTabMenu(null)}
                    onEdit={() => {
                        const list = createdLists.find(l => l.id === tabMenu.listId);
                        if (list) setEditingList(list);
                    }}
                    onDelete={() => {
                        deleteCreatedList(tabMenu.listId);
                        if (activeTab === tabMenu.listId) handleTabChange("all");
                    }}
                />
            )}
            {/* Add symbol modal */}
            {showAddSymbolModal && (
                <AddSymbolModal
                    searchPool={searchPool}
                    onConfirm={handleAddSymbols}
                    onClose={() => setShowAddSymbolModal(false)}
                />
            )}
        </>
    );
}

export default function MiniWatchlist() {
    return (
        <Suspense fallback={<div className="p-8 text-center text-muted-foreground animate-pulse">Loading watchlist...</div>}>
            <MiniWatchlistContent />
        </Suspense>
    );
}
