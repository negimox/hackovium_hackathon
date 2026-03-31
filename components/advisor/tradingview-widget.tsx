"use client";

import { useEffect, useRef, memo } from "react";

interface SymbolData {
  symbol: string;
  name?: string;
  isFund?: boolean;
}

interface TradingViewWidgetProps {
  symbols?: string | string[] | SymbolData[];
  height?: number;
  theme?: "light" | "dark";
}

function TradingViewWidgetComponent({
  symbols = "NSE:NIFTY",
  height = 500,
  theme = "dark",
}: TradingViewWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous widget
    containerRef.current.innerHTML = "";
    
    // Create widget container
    const widgetDiv = document.createElement("div");
    widgetDiv.className = "tradingview-widget-container__widget";
    widgetDiv.style.height = "100%";
    widgetDiv.style.width = "100%";
    containerRef.current.appendChild(widgetDiv);

    // Format symbols array for the Symbol Overview widget
    let symbolsArray: [string, string][] = [];
    
    const resolveSymbol = (s: string | SymbolData): [string, string] => {
      if (typeof s === "string") {
        const base = s.split(':').pop() || s;
        return [base, s.includes('|') ? s : `${s}|12m`];
      }
      
      let ticker = s.symbol;
      
      // If marked as fund, ensure AMFI prefix
      if (s.isFund) {
          if (!ticker.startsWith("AMFI:")) {
              ticker = `AMFI:${ticker}`;
          }
      } else if (!ticker.includes(':')) {
          ticker = `NSE:${ticker}`;
      }
      
      return [s.name || s.symbol, ticker.includes('|') ? ticker : `${ticker}|12m`];
    };

    if (Array.isArray(symbols)) {
      symbolsArray = symbols.map(resolveSymbol);
    } else {
      symbolsArray = [resolveSymbol(symbols as string)];
    }

    // Create script
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
    script.type = "text/javascript";
    script.async = true;
    
    script.innerHTML = JSON.stringify({
      symbols: symbolsArray,
      chartOnly: false,
      width: "100%",
      height: "100%",
      locale: "en",
      colorTheme: theme,
      autosize: true,
      showVolume: false,
      showMA: false,
      hideDateRanges: false,
      hideMarketStatus: false,
      hideSymbolLogo: false,
      scalePosition: "right",
      scaleMode: "Normal",
      fontFamily: "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
      fontSize: "10",
      noTimeScale: false,
      valuesTracking: "1",
      changeMode: "price-and-percent",
      chartType: "area",
      lineWidth: 2,
      lineType: 0,
      backgroundColor: theme === "dark" ? "#0F0F0F" : "#FFFFFF",
      gridLineColor: theme === "dark" ? "rgba(242, 242, 242, 0.06)" : "rgba(242, 242, 242, 0.1)",
      widgetFontColor: theme === "dark" ? "#DBDBDB" : "#333333",
      upColor: "#22ab94",
      downColor: "#f7525f",
      borderUpColor: "#22ab94",
      borderDownColor: "#f7525f",
      wickUpColor: "#22ab94",
      wickDownColor: "#f7525f",
      dateRanges: [
        "1d|1",
        "1m|30",
        "3m|60",
        "12m|1D",
        "60m|1W",
        "all|1M"
      ]
    });

    containerRef.current.appendChild(script);

    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = "";
      }
    };
  }, [symbols, theme]);

  return (
    <div
      className="tradingview-widget-container w-full"
      ref={containerRef}
      style={{ height: `${height}px`, width: "100%" }}
    />
  );
}

const TradingViewWidget = memo(TradingViewWidgetComponent);
TradingViewWidget.displayName = "TradingViewWidget";

export default TradingViewWidget;
