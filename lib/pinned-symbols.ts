/**
 * Shared pinned-symbols store backed by localStorage.
 * Both MiniWatchlist and the full Watchlist page read/write this.
 */

export interface PinnedSymbol {
    id: string;       // e.g. "bse-500002"
    symbol: string;   // e.g. "500002"
    name?: string;    // e.g. "ABB"
    category: string; // e.g. "BSE STOCKS"
    price: number;
    change: number;
    changePercent: number;
    color?: string; // e.g. "red", "blue", etc.
}

const KEY = "ploutos_pinned_symbols";

export function getPinnedSymbols(): PinnedSymbol[] {
    if (typeof window === "undefined") return [];
    try {
        return JSON.parse(localStorage.getItem(KEY) ?? "[]");
    } catch {
        return [];
    }
}

export function setPinnedSymbols(symbols: PinnedSymbol[]) {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(symbols));
    window.dispatchEvent(new Event("pinned-symbols-changed"));
}

export function addPinnedSymbol(symbol: PinnedSymbol) {
    const current = getPinnedSymbols();
    if (current.some(s => s.id === symbol.id)) return; // already pinned
    setPinnedSymbols([...current, symbol]);
}

export function removePinnedSymbol(id: string) {
    setPinnedSymbols(getPinnedSymbols().filter(s => s.id !== id));
}

export function isPinned(id: string): boolean {
    return getPinnedSymbols().some(s => s.id === id);
}
