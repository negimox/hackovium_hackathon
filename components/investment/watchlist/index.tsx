"use client";

import React, { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { ChevronDown, ChevronRight, Plus, Search, RefreshCw, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { GoTag } from "react-icons/go";
import { createPortal } from "react-dom";
import {
    addPinnedSymbol, removePinnedSymbol, isPinned, getPinnedSymbols, setPinnedSymbols,
    type PinnedSymbol
} from "@/lib/pinned-symbols";
import { useSearchParams, useRouter } from "next/navigation";
import { getCreatedLists } from "@/lib/watchlist-store";
import { StockLogo } from "@/components/ui/stock-logo";

// ─── Types ────────────────────────────────────────────────────────────────────

type FlagColor = "red" | "blue" | "green" | "yellow" | "orange";

interface WatchlistItem {
    id: string;
    symbol: string;
    name?: string;
    price: number;
    change: number;
    changePercent: number;
    volume?: number;
    open?: number;
    prevClose?: number;
    marketCap?: number;
    category: string;
}

interface WatchlistCategory {
    name: string;
    items: WatchlistItem[];
    isExpanded?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FLAG_COLORS: FlagColor[] = ["red", "blue", "green", "yellow", "orange"];
const FLAG_SVG_COLOR: Record<FlagColor, string> = {
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#10b981",
    yellow: "#eab308",
    orange: "#f97316",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toNum = (v: any): number => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

/** Parse Indian formatted strings like "0.04 Lakh", "1,24,630.73 Cr.", "3.2M" into a raw number */
function parseIndianNum(v: any): number {
    if (typeof v === "number") return v;
    if (!v) return 0;
    const s = String(v).replace(/,/g, "").trim();
    const lower = s.toLowerCase();
    const base = parseFloat(s);
    if (isNaN(base)) return 0;
    if (lower.includes("cr")) return base * 1e7;   // 1 Crore = 10M
    if (lower.includes("lakh") || lower.includes(" l")) return base * 1e5;
    if (lower.includes("k")) return base * 1e3;
    if (lower.includes("m")) return base * 1e6;
    if (lower.includes("b")) return base * 1e9;
    return base;
}

function fmtPrice(p: number) {
    return p.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtChange(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(2)}`; }
function fmtPct(n: number) { return `${n >= 0 ? "+" : ""}${n.toFixed(2)}%`; }
function clrChange(n: number) {
    return n > 0 ? "text-emerald-500 dark:text-emerald-400"
        : n < 0 ? "text-red-500 dark:text-red-400"
            : "text-muted-foreground";
}
function bgChange(n: number) {
    return n > 0 ? "bg-emerald-50 dark:bg-emerald-950/30"
        : n < 0 ? "bg-red-50 dark:bg-red-950/30"
            : "bg-muted/30";
}

/** Format large numbers: 1.2B, 45.3M, 8.2K */
function fmtLarge(n: number | undefined): string {
    if (!n || n === 0) return "—";
    if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
    if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e7) return `${(n / 1e7).toFixed(2)}Cr`;   // Indian crore
    if (n >= 1e5) return `${(n / 1e5).toFixed(2)}L`;    // Indian lakh
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return n.toFixed(0);
}

// ─── Add Symbol Modal ─────────────────────────────────────────────────────────

interface AddSymbolModalProps {
    allItems: WatchlistItem[];
    onClose: () => void;
}

function AddSymbolModal({ allItems, onClose }: AddSymbolModalProps) {
    const [query, setQuery] = useState("");
    const [pinned, setPinned] = useState<Set<string>>(() => new Set(getPinnedSymbols().map(s => s.id)));
    const inputRef = React.useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [onClose]);

    const results = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return [];
        return allItems.filter(item =>
            item.symbol.toLowerCase().includes(q) ||
            item.name?.toLowerCase().includes(q)
        ).slice(0, 12);
    }, [query, allItems]);

    const toggle = (item: WatchlistItem) => {
        if (pinned.has(item.id)) {
            removePinnedSymbol(item.id);
            setPinned(prev => { const n = new Set(prev); n.delete(item.id); return n; });
        } else {
            const ps: PinnedSymbol = {
                id: item.id, symbol: item.symbol, name: item.name,
                category: item.category, price: item.price,
                change: item.change, changePercent: item.changePercent,
            };
            addPinnedSymbol(ps);
            setPinned(prev => new Set([...prev, item.id]));
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[9998] flex items-center justify-center"
            style={{ background: "oklch(0 0 0 / 0.6)" }}
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-[500px] max-h-[600px] rounded-2xl border border-border/60 bg-card/95 backdrop-blur-xl shadow-2xl flex flex-col overflow-hidden"
                style={{ animation: "modalIn 0.18s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Tag Symbol</p>
                            <p className="text-[10px] text-muted-foreground">Tag stocks for your mini watchlist</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted/50 transition-colors text-muted-foreground hover:text-foreground">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-border/30">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            ref={inputRef}
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search by symbol or name…"
                            className="w-full pl-9 pr-4 py-2 rounded-lg border border-border/50 bg-muted/30 text-sm outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40"
                        />
                    </div>
                </div>

                {/* Results */}
                <div className="flex-1 overflow-y-auto">
                    {query.trim() === "" ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                            <Search className="w-8 h-8 opacity-20" />
                            <p className="text-sm">Type to search stocks, crypto, commodities…</p>
                        </div>
                    ) : results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-muted-foreground">
                            <p className="text-sm">No results for "{query}"</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-border/20">
                            {results.map(item => {
                                const pos = item.changePercent >= 0;
                                const added = pinned.has(item.id);
                                return (
                                    <div key={item.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/20 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${pos ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"}`}>
                                                {item.symbol.substring(0, 2)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold truncate">{item.symbol}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">{item.name ?? item.category}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <div className="text-right">
                                                <p className="text-sm font-semibold font-display">{fmtPrice(item.price)}</p>
                                                <p className={`text-[11px] font-medium ${pos ? "text-emerald-400" : "text-red-400"}`}>{fmtPct(item.changePercent)}</p>
                                            </div>
                                            <button
                                                onClick={() => toggle(item)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${added ? "bg-primary/10 text-primary hover:bg-red-500/10 hover:text-red-400" : "bg-primary text-primary-foreground hover:opacity-90"}`}
                                            >
                                                {added ? <><GoTag className="w-3 h-3" /> Remove</> : <><GoTag className="w-3 h-3" /> Add</>}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border/30 flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">{pinned.size} symbol{pinned.size !== 1 ? "s" : ""} tagged for mini watchlist</p>
                    <button onClick={onClose} className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Done</button>
                </div>
            </div>
            <style>{`@keyframes modalIn { from { opacity:0; transform:scale(0.93) translateY(10px); } to { opacity:1; transform:scale(1) translateY(0); } }`}</style>
        </div>,
        document.body
    );
}

// ─── Main Watchlist Component ─────────────────────────────────────────────────

function WatchlistContent() {
    const [categories, setCategories] = useState<WatchlistCategory[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const searchParams = useSearchParams();
    const router = useRouter();
    const activeTab = searchParams.get("tab") || "all";
    const [, forceUpdate] = useState(0);
    const ROWS_PER_PAGE = 20;
    const [rowLimits, setRowLimits] = useState<Record<string, number>>({});

    const getVisibleCount = useCallback((catName: string) => {
        return rowLimits[catName] || ROWS_PER_PAGE;
    }, [rowLimits]);

    const showMore = useCallback((catName: string) => {
        setRowLimits(prev => ({
            ...prev,
            [catName]: (prev[catName] || ROWS_PER_PAGE) + ROWS_PER_PAGE,
        }));
    }, []);

    // Listen for external state changes (e.g. from MiniWatchlist)
    useEffect(() => {
        const h = () => forceUpdate(n => n + 1);
        window.addEventListener("pinned-symbols-changed", h);
        window.addEventListener("custom-watchlists-changed", h);
        return () => {
            window.removeEventListener("pinned-symbols-changed", h);
            window.removeEventListener("custom-watchlists-changed", h);
        };
    }, []);

    const fetchWatchlistData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [bseRes, nseRes, usRes, cryptoRes, commodityRes] = await Promise.all([
                fetch('/api/watchlist/bse'), fetch('/api/watchlist/nse'),
                fetch('/api/watchlist/us'), fetch('/api/watchlist/crypto'),
                fetch('/api/watchlist/commodity')
            ]);
            const [bseData, nseData, usData, cryptoData, commodityData] = await Promise.all([
                bseRes.json(), nseRes.json(), usRes.json(), cryptoRes.json(), commodityRes.json()
            ]);

            setCategories([
                {
                    name: "BSE STOCKS", isExpanded: true,
                    items: Object.entries(bseData).map(([code, d]: [string, any]) => ({
                        id: `bse-${code}`, symbol: code, name: d.symbol, category: "BSE STOCKS",
                        price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent),
                        volume: parseIndianNum(d.volume), open: toNum(d.open),
                        prevClose: toNum(d.prevClose),
                        marketCap: parseIndianNum(d.marketCap),
                    }))
                },
                {
                    name: "NSE STOCKS", isExpanded: true,
                    items: Object.entries(nseData).map(([sym, d]: [string, any]) => ({
                        id: `nse-${sym}`, symbol: sym, name: d.name, category: "NSE STOCKS",
                        price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent),
                        volume: toNum(d.volume), open: toNum(d.open),
                        prevClose: toNum(d.prevClose),
                        marketCap: toNum(d.marketCap),
                    }))
                },
                {
                    name: "US MARKETS", isExpanded: true,
                    items: Object.entries(usData).map(([sym, d]: [string, any]) => ({
                        id: `us-${sym}`, symbol: sym, name: d.name, category: "US MARKETS",
                        price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent),
                        volume: toNum(d.volume), open: toNum(d.open),
                        prevClose: toNum(d.prevClose),
                        marketCap: toNum(d.marketCap),
                    }))
                },
                {
                    name: "CRYPTO", isExpanded: true,
                    items: Object.entries(cryptoData).map(([sym, d]: [string, any]) => ({
                        id: `crypto-${sym}`, symbol: sym, name: d.name, category: "CRYPTO",
                        price: toNum(d.price), change: toNum(d.change24h), changePercent: toNum(d.percent24h),
                        // Crypto has no open; prevClose is present
                        volume: undefined, open: undefined,
                        prevClose: toNum(d.prevClose),
                        marketCap: toNum(d.marketCap ?? d.market_cap),
                    }))
                },
                {
                    name: "COMMODITIES", isExpanded: true,
                    items: Object.entries(commodityData).map(([sym, d]: [string, any]) => ({
                        id: `commodity-${sym}`, symbol: sym, name: sym, category: "COMMODITIES",
                        price: toNum(d.price), change: toNum(d.change), changePercent: toNum(d.percent),
                        // Commodity API has no volume, open, prevClose, or marketCap
                        volume: undefined, open: undefined,
                        prevClose: undefined, marketCap: undefined,
                    }))
                },
            ]);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching watchlist data:", err);
            setError("Failed to load watchlist data");
            setLoading(false);
        }
    };

    useEffect(() => { fetchWatchlistData(); }, []);

    const allItems = useMemo(() => categories.flatMap(c => c.items), [categories]);

    const filteredCategories = useMemo(() => {
        let current = categories;

        // 1. Filter by Tab (Tags or Custom Lists)
        if (activeTab !== "all") {
            if (activeTab === "pinned") {
                const pinned = getPinnedSymbols();
                const pinnedIds = new Set(pinned.map(p => p.id));
                current = current.map(cat => ({
                    ...cat,
                    items: cat.items.filter(item => pinnedIds.has(item.id))
                })).filter(cat => cat.items.length > 0);
            } else if (FLAG_COLORS.includes(activeTab as FlagColor)) {
                const color = activeTab as FlagColor;
                const pinnedInColor = getPinnedSymbols().filter(p => p.color === color);
                const pinnedIds = new Set(pinnedInColor.map(p => p.id));
                current = current.map(cat => ({
                    ...cat,
                    items: cat.items.filter(item => pinnedIds.has(item.id))
                })).filter(cat => cat.items.length > 0);
            } else if (activeTab.startsWith("list-")) {
                const list = getCreatedLists().find(l => l.id === activeTab);
                if (list) {
                    const results: WatchlistCategory[] = [];
                    const allMarketItems = categories.flatMap(c => c.items);
                    const pinnedSymbols = getPinnedSymbols();

                    // Helper to get item by ID from all sources
                    const findItem = (id: string) => {
                        const marketItem = allMarketItems.find(i => i.id === id);
                        if (marketItem) return marketItem;
                        const pinned = pinnedSymbols.find(p => p.id === id);
                        if (pinned) return {
                            id: pinned.id, symbol: pinned.symbol, name: pinned.name,
                            category: pinned.category || "Other", price: pinned.price,
                            change: pinned.change, changePercent: pinned.changePercent
                        } as WatchlistItem;
                        return null;
                    };

                    // 1. Custom Sections
                    if (list.sections && list.sections.length > 0) {
                        list.sections.forEach(s => {
                            const items = s.itemIds.map(findItem).filter(Boolean) as WatchlistItem[];
                            results.push({ name: s.name, items, isExpanded: true });
                        });
                    }

                    // 2. Default/Legacy items (Grouped by Market Category)
                    if (list.itemIds && list.itemIds.length > 0) {
                        const items = list.itemIds.map(findItem).filter(Boolean) as WatchlistItem[];
                        if (items.length > 0) {
                            // Group by market category
                            const grouped: Record<string, WatchlistItem[]> = {};
                            items.forEach(item => {
                                const cat = item.category || "Other";
                                if (!grouped[cat]) grouped[cat] = [];
                                grouped[cat].push(item);
                            });

                            Object.entries(grouped).forEach(([catName, catItems]) => {
                                results.push({
                                    name: catName,
                                    items: catItems,
                                    isExpanded: true
                                });
                            });
                        }
                    }

                    current = results;
                } else {
                    current = [];
                }
            }
        }

        // 2. Filter by Search Query
        if (!searchQuery.trim()) return current;
        const q = searchQuery.toLowerCase();
        return current.map(cat => ({
            ...cat,
            isExpanded: true,
            items: cat.items.filter(item =>
                item.symbol.toLowerCase().includes(q) || item.name?.toLowerCase().includes(q)
            )
        })).filter(cat => cat.items.length > 0);
    }, [categories, searchQuery, activeTab]);

    const toggleCategory = (name: string) => {
        setCategories(prev => prev.map(cat =>
            cat.name === name ? { ...cat, isExpanded: !cat.isExpanded } : cat
        ));
    };

    const toggleTag = (item: WatchlistItem) => {
        const currentPinned = getPinnedSymbols().find(p => p.id === item.id);
        const currentTag = currentPinned?.color as FlagColor | undefined;
        const idx = currentTag ? FLAG_COLORS.indexOf(currentTag) : -1;
        const nextColor = idx < FLAG_COLORS.length - 1 ? FLAG_COLORS[idx + 1] : null;

        if (nextColor) {
            if (currentPinned) {
                setPinnedSymbols(getPinnedSymbols().map(p => p.id === item.id ? { ...p, color: nextColor } : p));
            } else {
                addPinnedSymbol({
                    id: item.id, symbol: item.symbol, name: item.name, category: item.category,
                    price: item.price, change: item.change, changePercent: item.changePercent,
                    color: nextColor
                });
            }
        } else {
            removePinnedSymbol(item.id);
        }
        forceUpdate(n => n + 1);
    };

    if (loading) return (
        <div className="bg-card rounded-lg shadow-sm border border-border">
            {/* Skeleton Header */}
            <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <Skeleton className="h-6 w-28" />
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-8 w-24 rounded-md" />
                        <Skeleton className="h-8 w-28 rounded-md" />
                    </div>
                </div>
                <Skeleton className="h-9 w-full rounded-md" />
            </div>

            {/* Skeleton Categories */}
            {Array.from({ length: 3 }).map((_, ci) => (
                <div key={ci} className="border-b border-border last:border-b-0">
                    {/* Category header skeleton */}
                    <div className="px-4 py-3 flex items-center gap-2">
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-3 w-8" />
                    </div>
                    {/* Table header skeleton */}
                    <div className="grid grid-cols-[2fr_1.2fr_0.9fr_0.9fr_1fr_1fr_1fr_1.1fr] gap-3 px-4 py-2 border-b border-border/50">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <Skeleton key={i} className={`h-3 ${i === 0 ? 'w-16' : 'w-14 ml-auto'}`} />
                        ))}
                    </div>
                    {/* Row skeletons */}
                    {Array.from({ length: 5 }).map((_, ri) => (
                        <div key={ri} className="grid grid-cols-[2fr_1.2fr_0.9fr_0.9fr_1fr_1fr_1fr_1.1fr] gap-3 items-center px-4 py-2.5 border-b border-border/20 last:border-b-0">
                            <div className="flex items-center gap-2">
                                <Skeleton className="w-8 h-8 rounded-full" />
                                <div className="flex flex-col gap-1">
                                    <Skeleton className="h-4 w-16" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                            </div>
                            <Skeleton className="h-4 w-16 ml-auto" />
                            <Skeleton className="h-4 w-12 ml-auto" />
                            <Skeleton className="h-5 w-14 ml-auto rounded" />
                            <Skeleton className="h-4 w-12 ml-auto" />
                            <Skeleton className="h-4 w-14 ml-auto" />
                            <Skeleton className="h-4 w-14 ml-auto" />
                            <Skeleton className="h-4 w-16 ml-auto" />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

    if (error) return (
        <div className="bg-card rounded-lg shadow-sm border border-border p-8">
            <div className="flex flex-col items-center gap-4">
                <p className="text-red-500">{error}</p>
                <button onClick={fetchWatchlistData} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">Retry</button>
            </div>
        </div>
    );

    return (
        <>
            <div className="bg-card rounded-lg shadow-sm border border-border">
                {/* Header */}
                <div className="p-4 border-b border-border">
                    <div className="flex items-center justify-between gap-4 mb-4">
                        <h2 className="text-lg font-semibold">Watchlist</h2>
                        <div className="flex items-center gap-2">
                            <button onClick={fetchWatchlistData} className="flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm">
                                <RefreshCw className="w-4 h-4" /> Refresh
                            </button>
                            <button onClick={() => setShowAddModal(true)} className="flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors text-sm">
                                <Plus className="w-4 h-4" /> Add Symbol
                            </button>
                        </div>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Search symbols..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        />
                    </div>
                </div>

                {/* Categories */}
                <div className="divide-y divide-border">
                    {filteredCategories.length === 0 ? (
                        <div className="p-12 text-center flex flex-col items-center gap-3">
                            <Plus className="w-8 h-8 text-muted-foreground/20" />
                            <div>
                                <p className="text-sm font-medium text-foreground">
                                    {searchQuery.trim() ? `No results for "${searchQuery}"` : "This watchlist is empty"}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {searchQuery.trim() ? "Try searching for another symbol" : "Add symbols from the sidebar or using the button above"}
                                </p>
                            </div>
                            {!searchQuery.trim() && (
                                <button
                                    onClick={() => setShowAddModal(true)}
                                    className="mt-2 px-4 py-1.5 bg-primary/10 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition-all border border-primary/20"
                                >
                                    Add Symbols
                                </button>
                            )}
                        </div>
                    ) : (
                        filteredCategories.map((category, categoryIndex) => (
                            <div key={categoryIndex}>
                                {/* Category header */}
                                <button
                                    onClick={() => toggleCategory(category.name)}
                                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        {category.isExpanded
                                            ? <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                                        <span className="font-medium text-sm uppercase tracking-wide text-muted-foreground">{category.name}</span>
                                        <span className="text-xs text-muted-foreground">({category.items.length})</span>
                                    </div>
                                </button>

                                {category.isExpanded && (
                                    <div className="bg-background/50">
                                        {/* Table header */}
                                        <div className="grid grid-cols-[2fr_1.2fr_0.9fr_0.9fr_1fr_1fr_1fr_1.1fr] gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/50">
                                            <div>Symbol</div>
                                            <div className="text-right">Last Price</div>
                                            <div className="text-right">Chg</div>
                                            <div className="text-right">Chg%</div>
                                            <div className="text-right">Volume</div>
                                            <div className="text-right">Open</div>
                                            <div className="text-right">Prev Close</div>
                                            <div className="text-right">Market Cap</div>
                                        </div>

                                        {/* Rows — show limited rows with a "Show more" button */}
                                        {(() => {
                                            const limit = getVisibleCount(category.name);
                                            const visibleItems = category.items.slice(0, limit);
                                            const hasMore = category.items.length > limit;
                                            return (
                                                <>
                                                    {visibleItems.map((item) => {
                                                        const isTagged = isPinned(item.id);
                                                        return (
                                                            <div
                                                                key={item.id}
                                                                onClick={() => router.push(`/dashboard/stock/${item.id}`)}
                                                                className="grid grid-cols-[2fr_1.2fr_0.9fr_0.9fr_1fr_1fr_1fr_1.1fr] gap-3 items-center px-4 py-2.5 hover:bg-muted/30 transition-colors border-b border-border/20 last:border-b-0 group cursor-pointer"
                                                            >
                                                                {/* Symbol + tag */}
                                                                <div className="flex items-center gap-2 min-w-0">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); toggleTag(item); }}
                                                                        title={isTagged ? "Cycle tag color or remove tag" : "Tag for mini watchlist"}
                                                                        className={`shrink-0 p-0.5 rounded transition-all ${isTagged ? "opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-primary"}`}
                                                                    >
                                                                        <GoTag
                                                                            size={14}
                                                                            style={{ color: isTagged ? FLAG_SVG_COLOR[getPinnedSymbols().find(p => p.id === item.id)?.color as FlagColor] : undefined }}
                                                                        />
                                                                    </button>

                                                                    {/* Avatar */}
                                                                    <StockLogo
                                                                        symbol={item.symbol}
                                                                        name={item.name}
                                                                        type={item.id.split('-')[0]}
                                                                        className="w-8 h-8"
                                                                    />

                                                                    {/* Name */}
                                                                    <div className="min-w-0">
                                                                        <p className="font-semibold text-sm truncate leading-tight">{item.symbol}</p>
                                                                        {item.name && <p className="text-[11px] text-muted-foreground truncate leading-tight">{item.name}</p>}
                                                                    </div>
                                                                </div>

                                                                {/* Last price */}
                                                                <div className="text-right">
                                                                    <span className="font-semibold text-sm font-display">{fmtPrice(item.price)}</span>
                                                                </div>

                                                                {/* Change */}
                                                                <div className="text-right">
                                                                    <span className={`text-sm font-medium font-display ${clrChange(item.change)}`}>{fmtChange(item.change)}</span>
                                                                </div>

                                                                {/* Change % */}
                                                                <div className="text-right">
                                                                    <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${clrChange(item.change)} ${bgChange(item.change)}`}>
                                                                        {fmtPct(item.changePercent)}
                                                                    </span>
                                                                </div>

                                                                {/* Volume */}
                                                                <div className="text-right">
                                                                    <span className="text-sm text-muted-foreground font-display">{fmtLarge(item.volume)}</span>
                                                                </div>

                                                                {/* Open */}
                                                                <div className="text-right">
                                                                    <span className="text-sm text-muted-foreground font-display">{item.open ? fmtPrice(item.open) : "—"}</span>
                                                                </div>

                                                                {/* Prev Close */}
                                                                <div className="text-right">
                                                                    <span className="text-sm text-muted-foreground font-display">{item.prevClose ? fmtPrice(item.prevClose) : "—"}</span>
                                                                </div>

                                                                {/* Market Cap */}
                                                                <div className="text-right">
                                                                    <span className="text-sm text-muted-foreground font-display">{fmtLarge(item.marketCap)}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    {hasMore && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); showMore(category.name); }}
                                                            className="w-full py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors border-t border-border/30"
                                                        >
                                                            Show more ({category.items.length - limit} remaining)
                                                        </button>
                                                    )}
                                                </>
                                            );
                                        })()}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {showAddModal && (
                <AddSymbolModal allItems={allItems} onClose={() => setShowAddModal(false)} />
            )}
        </>
    );
}

export default function Watchlist() {
    return (
        <Suspense fallback={<div className="p-12 text-center text-muted-foreground">Loading watchlist...</div>}>
            <WatchlistContent />
        </Suspense>
    );
}
