"use client";
import { Button } from "@/components/ui/button";

import React, { useState, useEffect, useCallback } from "react";
import { Search } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useRouter } from "next/navigation";
import { StockLogo } from "@/components/ui/stock-logo";

interface SearchItem {
  id: string;
  symbol: string;
  name: string;
  type: string;
  market: string;
}

export function GlobalSearch({ variant = "default" }: { variant?: "default" | "icon" }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchItem[]>([]);
  const [search, setSearch] = useState("");
  const router = useRouter();

  const fetchSearchData = useCallback(async () => {
    if (data.length > 0) return;
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
        
        const formatItems = (marketData: any, market: string): SearchItem[] => {
            if (!marketData || marketData.error || marketData.status) return [];
            return Object.entries(marketData).map(([sym, d]: [string, any]) => ({
                id: `${market}-${sym}`,
                symbol: sym,
                name: d.name || d.symbol || sym,
                type: market.toUpperCase(),
                market
            }));
        };

        const pool = [
            ...formatItems(nseData, "nse"),
            ...formatItems(bseData, "bse"),
            ...formatItems(usData, "us"),
            ...formatItems(cryptoData, "crypto"),
            ...formatItems(commodityData, "commodity"),
        ];
        
        setData(pool);
    } catch (err) {
        console.error("Failed to fetch search data", err);
    } finally {
        setLoading(false);
    }
  }, [data.length]);

  useEffect(() => {
    // Only attach the keyboard shortcut to the default variant 
    // to prevent duplicate dialogs when both variants are rendered in the DOM
    if (variant === "icon") return;

    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [variant]);

  useEffect(() => {
    if (open) {
      fetchSearchData();
    }
  }, [open, fetchSearchData]);

  const handleSelect = (id: string) => {
    setOpen(false);
    router.push(`/dashboard/stock/${id}`);
  };

  const filteredData = React.useMemo(() => {
    if (!search) return data.slice(0, 20); // only show top 20 initially to prevent DOM lag
    const lower = search.toLowerCase();
    
    // An optimized O(N) loop with early termination is much faster than .filter().slice()
    const results: SearchItem[] = [];
    for (let i = 0; i < data.length; i++) {
        if (results.length >= 20) break;
        const item = data[i];
        if (
            item.symbol.toLowerCase().includes(lower) || 
            item.name.toLowerCase().includes(lower)
        ) {
            results.push(item);
        }
    }
    return results;
  }, [data, search]);

  return (
    <>
      {variant === "icon" ? (
        <Button
          onClick={() => setOpen(true)}
          className="w-8 h-8 rounded-full bg-accent flex items-center justify-center hover:bg-accent/80 transition-colors group"
          title="Search"
        >
          <Search className="size-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </Button>
      ) : (
        <Button
          onClick={() => setOpen(true)}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-muted-foreground bg-muted/30 border border-border/60 hover:bg-muted/50 hover:border-primary/40 rounded-full transition-all duration-200 group"
        >
          <Search className="w-4 h-4 opacity-50 group-hover:text-primary group-hover:opacity-100 transition-colors" />
          <span className="flex-1 text-left hidden sm:inline-block">Search stocks, ETFs...</span>
          <span className="flex-1 text-left sm:hidden">Search...</span>
          <kbd className="hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border/60 bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      )}

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false}>
        <CommandInput 
          placeholder="Type a symbol or company name..." 
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          <CommandEmpty>{loading ? "Loading market data..." : "No results found."}</CommandEmpty>
          
          {filteredData.length > 0 && (
            <CommandGroup heading="Stocks & Indices">
              {filteredData.map((item) => (
                <CommandItem
                  key={item.id}
                  value={`${item.symbol} ${item.name} ${item.type}`}
                  onSelect={() => handleSelect(item.id)}
                  className="flex items-center gap-3 py-2 cursor-pointer"
                >
                  <StockLogo symbol={item.symbol} name={item.name} type={item.type} className="w-8 h-8 rounded-full border border-border/50 shrink-0 object-contain overflow-hidden bg-white/5" />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="font-semibold font-display text-sm truncate">{item.symbol}</span>
                    <span className="text-[10px] text-muted-foreground truncate">{item.name}</span>
                  </div>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-sm bg-muted/50 text-muted-foreground font-medium shrink-0">
                    {item.type}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
