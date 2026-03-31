import React, { useState, useEffect } from "react";
import { Skeleton } from "@/components/ui/skeleton";

// Global memory cache to prevent duplicate fetching/redirects for identical symbols
// Maps symbol -> loaded image src
const logoCache = new Map<string, string>();

interface StockLogoProps {
    symbol: string;
    name?: string;
    type: string;
    className?: string;
}

export function StockLogo({ symbol, name, type, className = "w-10 h-10" }: StockLogoProps) {
    // If it's already in the global cache, we can bypass 'ticker' entirely and just use 'cache'
    const cachedUrl = logoCache.get(symbol);
    const [status, setStatus] = useState<'ticker' | 'search' | 'error' | 'cache'>(cachedUrl ? 'cache' : 'ticker');
    const [isLoading, setIsLoading] = useState(!cachedUrl);
    const token = process.env.NEXT_PUBLIC_LOGO_DEV_TOKEN;

    useEffect(() => {
        // Reset status to try ticker first when symbol changes, unless we already have it cached
        if (logoCache.has(symbol)) {
            setStatus('cache');
            setIsLoading(false);
        } else {
            setStatus('ticker');
            setIsLoading(true);
        }
    }, [symbol]);

    const getPrimaryUrl = (): string | null => {
        if (!token) return null;

        let querySymbol = symbol;
        if (type === "NSE" || type === "BSE" || type === "COMMODITY") {
            querySymbol = `${symbol}.IN`;
        }

        return `https://img.logo.dev/ticker/${querySymbol}?token=${token}&size=64&format=png&fallback=404`;
    };

    const primaryUrl = getPrimaryUrl();
    const fallbackSearchUrl = `/api/logo/search?q=${encodeURIComponent(symbol)}`;

    const initials = (name || symbol).substring(0, 2).toUpperCase();
    
    // The component accepts a generic className and appends standard utility classes
    const combinedClassName = `${className} rounded-full flex items-center justify-center shrink-0 border border-border/50 bg-card overflow-hidden`;

    if (!primaryUrl || status === 'error') {
        return (
            <div className={`${combinedClassName} bg-primary/10 text-primary text-[10px] font-bold`}>
                {initials}
            </div>
        );
    }

    const currentSrc = status === 'cache' && cachedUrl 
        ? cachedUrl 
        : status === 'ticker' ? primaryUrl : fallbackSearchUrl;

    return (
        <div className={`${combinedClassName} relative`}>
            {isLoading && (
                <Skeleton className="absolute inset-0 rounded-full" />
            )}
            <img
                src={currentSrc}
                alt={`${name || symbol} logo`}
                className={`w-full h-full object-contain ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
                loading="lazy"
                onLoad={() => {
                    setIsLoading(false);
                    // Once successfully loaded, add to global cache to prevent future lookups
                    if (status !== 'cache' && currentSrc) {
                        logoCache.set(symbol, currentSrc);
                    }
                }}
                onError={() => {
                    if (status === 'ticker') {
                        setStatus('search'); // Fallback to search endpoint
                    } else if (status === 'search') {
                        setStatus('error'); // Final fallback to initials
                        setIsLoading(false);
                    }
                }}
            />
        </div>
    );
}
